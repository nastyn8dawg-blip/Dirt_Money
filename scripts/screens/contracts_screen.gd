extends ScreenBase
## Co-op contract board. Contracts are DELIVERED through conversation in the
## real slice (sprint 6); greybox lists availability so gating is visible now.


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
	var list := VBoxContainer.new()
	list.add_theme_constant_override("separation", 10)
	panel.add_child(list)

	for contract in DataLoader.contracts:
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
		list.add_child(row)
		var color := Color.WHITE if available else Color(0.45, 0.45, 0.45)
		make_label(row, "[%s] %s" % [contract.type, contract.title], 15, color)
		if available:
			var tree_id: String = "hollis_baler" if offered_by == "hollis" else offered_by + "_talk"
			make_button(row, "Discuss with %s" % DataLoader.get_npc(offered_by).get("name", "..."),
				func(): EventBus.dialogue_started.emit(tree_id))  # full negotiation flow: sprint 6
		else:
			make_label(row, "— " + reason, 13, Color(0.6, 0.45, 0.4))

	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 10)
	root.add_child(nav)
	make_button(nav, "Talk to Marge", func(): EventBus.dialogue_started.emit("marge_talk"))
	make_button(nav, "Back to Map", func(): go("world_map"))
