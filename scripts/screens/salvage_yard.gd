extends ScreenBase
## Gus's yard. The Mechanic's fantasy: "There's money in that if I know what
## I'm looking at." Anyone can buy; only the wrench-eye sees the real read.

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

	make_label(root, "WEAVER SALVAGE YARD — Gus", 28, ACCENT)
	var panel := make_panel(root)
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_list = VBoxContainer.new()
	_list.add_theme_constant_override("separation", 10)
	panel.add_child(_list)

	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 10)
	root.add_child(nav)
	make_button(nav, "Talk to Gus", func(): EventBus.dialogue_started.emit("gus_talk"))
	make_button(nav, "Back to Map", func(): go("world_map"))
	_refresh()


func _refresh() -> void:
	for c in _list.get_children():
		c.queue_free()

	# Projects in the shop
	for p in GameState.salvage_projects:
		var deal: Dictionary = GameState.salvage_deal(p.deal_id)
		var needed: int = int(deal.restore_blocks) + int(p.extra_blocks)
		var col := VBoxContainer.new()
		_list.add_child(col)
		make_label(col, "IN YOUR SHOP: %s — %d/%d work sessions" % [deal.name, p.blocks_done, needed], 15, ACCENT)
		if p.hidden_hit:
			make_label(col, "   Found the painted-over problem. Parts and time both got worse.", 13, ScreenBase.WARN)
		if GameState.salvage_ready_to_sell():
			var tier := GameState.roy_pricing_tier()
			make_button(col, "Truck it to Roy — his offer: $%d (%s pricing)" % [
				int(round(float(deal.base_sale_value) * float(tier.mult))), tier.tier],
				func():
					GameState.sell_salvage()
					_refresh())
		else:
			make_button(col, "Put in a work session (costs a time block)", func():
				CalendarManager.spend_block()
				GameState.work_salvage()
				_refresh())
		_list.add_child(HSeparator.new())

	# Offers on the lot
	if GameState.salvage_offers.is_empty() and GameState.salvage_projects.is_empty():
		make_label(_list, "Nothing worth saving on the lot right now.", 14, ScreenBase.MUTED)
	for o in GameState.salvage_offers:
		var deal: Dictionary = GameState.salvage_deal(o.deal_id)
		var col := VBoxContainer.new()
		_list.add_child(col)
		make_label(col, "%s — $%d. Gus holds it through %s (Day %d)." % [
			deal.name, deal.buy_price, CalendarManager.weekday_of(o.hold_until_day), o.hold_until_day], 15)
		for read in deal.get("condition_reads", []):
			make_label(col, "   \"%s\"" % read, 13, Color(0.80, 0.75, 0.65))
		if GameState.background_id == "mechanic":
			var m: Dictionary = deal.get("mechanic_read", {})
			make_label(col, "   Your eye: parts %s | risk %s | resale %s | hidden damage %s" % [
				m.get("parts_range", "?"), m.get("risk", "?"),
				m.get("resale_confidence", "?"), m.get("hidden_damage", "?"),
			], 13, ScreenBase.GOOD)
		else:
			make_label(col, "   (Looks like a machine. Probably has parts in it.)", 12, ScreenBase.MUTED)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		col.add_child(row)
		make_button(row, "Buy it — $%d" % deal.buy_price, func():
			GameState.buy_salvage(o.deal_id)
			_refresh())
		make_label(row, "or walk away — that's a skill too", 12, ScreenBase.MUTED)
