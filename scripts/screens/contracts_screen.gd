extends ScreenBase
## Co-op contract board. v1: delivery/legacy contracts accept + deliver here;
## supply/repair/favor resolve through conversations (sprints 6-7). Full
## negotiation flow also sprint 6 — the handshake here is the placeholder.

var _list: VBoxContainer


func _ready() -> void:
	add_background()
	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 40
	root.offset_right = -40
	root.offset_top = 30
	root.offset_bottom = -30
	root.add_theme_constant_override("separation", 12)
	add_child(root)

	make_label(root, "CO-OP CONTRACT BOARD — Marge Kowalski", 28, ACCENT)
	make_label(root, "Your standing with Marge: %s (%d) | County: %d" % [
		ReputationLedger.tier("marge"), ReputationLedger.get_rep("marge"), ReputationLedger.county,
	], 14)

	var panel := make_panel(root)
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_list = VBoxContainer.new()
	_list.add_theme_constant_override("separation", 10)
	panel.add_child(_list)

	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 10)
	root.add_child(nav)
	make_button(nav, "Talk to Marge", func(): EventBus.dialogue_started.emit("marge_talk"))
	make_button(nav, "Back to Map", func(): go("world_map"))
	_refresh()


func _refresh() -> void:
	for c in _list.get_children():
		c.queue_free()

	for contract in GameState.contracts_active:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		_list.add_child(row)
		var have: int = GameState.inventory.get(contract.commodity, 0)
		make_label(row, "ACTIVE: %d %s — due %s (Day %d) — you have %d" % [
			contract.units, contract.commodity,
			CalendarManager.weekday_of(contract.deadline_day), contract.deadline_day, have,
		], 15, Color(0.6, 0.85, 0.6) if have >= contract.units else Color(0.9, 0.75, 0.4))
		if have >= int(contract.units):
			make_button(row, "DELIVER", func():
				GameState.deliver_contract(contract.id)
				_refresh())
	if not GameState.contracts_active.is_empty():
		_list.add_child(HSeparator.new())

	for contract in DataLoader.contracts:
		if not GameState.active_contract(contract.get("id", "")).is_empty():
			continue
		var req: Dictionary = contract.get("requires", {})
		var available := true
		var reason := ""
		var bg_req: String = req.get("background", "")
		if bg_req != "" and bg_req != GameState.background_id:
			available = false
			reason = "Needs: %s" % DataLoader.get_background(bg_req).get("name", bg_req)
		var offered_by: String = contract.get("offered_by", "")
		if available and ReputationLedger.get_rep(offered_by) < int(req.get("min_reputation", 0)):
			available = false
			reason = "Reputation too low with %s" % DataLoader.get_npc(offered_by).get("name", offered_by)
		var flag_req: String = req.get("flag", "")
		if available and flag_req != "" and not GameState.has_flag(flag_req):
			available = false
			reason = "Something has to happen first..."

		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		_list.add_child(row)
		var color := Color.WHITE if available else Color(0.45, 0.45, 0.45)
		var terms: Dictionary = contract.get("terms", {})
		var desc: String = "[%s] %s" % [contract.type, contract.title]
		if contract.type in ["delivery", "legacy"]:
			desc += " — %d %s, %d days, $%d penalty" % [
				terms.get("units", 0), terms.get("commodity", ""),
				terms.get("deadline_days", 0), terms.get("penalty", 0),
			]
		make_label(row, desc, 15, color)
		if available:
			if contract.type in ["delivery", "legacy"]:
				make_button(row, "Shake on it", func():
					GameState.accept_contract(contract.id)
					_refresh())
			else:
				var tree_id: String = "hollis_baler" if offered_by == "hollis" else offered_by + "_talk"
				make_button(row, "Discuss with %s" % DataLoader.get_npc(offered_by).get("name", "..."),
					func(): EventBus.dialogue_started.emit(tree_id))
		else:
			make_label(row, "— " + reason, 13, Color(0.6, 0.45, 0.4))
