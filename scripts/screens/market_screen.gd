extends ScreenBase
## Grain elevator. THE showcase of market-visibility differentiation:
## IT sees charts+forecast bands, Old School gets gossip, Mechanic today-only.

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

	make_label(root, "GRAIN ELEVATOR — Sandy Alvarez", 28, ACCENT)
	var panel := make_panel(root)
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_list = VBoxContainer.new()
	_list.add_theme_constant_override("separation", 8)
	panel.add_child(_list)
	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 10)
	root.add_child(nav)
	make_button(nav, "Talk to Sandy", func(): EventBus.dialogue_started.emit("sandy_talk"))
	make_button(nav, "Back to Map", func(): go("world_map"))
	_refresh()


func _refresh() -> void:
	for c in _list.get_children():
		c.queue_free()

	match GameState.background_id:
		"old_school":
			make_label(_list, "Sandy says: \"%s\"" % EconomyManager.gossip_line(), 15)
			make_label(_list, "(You don't do charts. You do handshakes.)", 12, Color(0.5, 0.5, 0.5))
		"it_nephew":
			make_label(_list, "MARKET TERMINAL", 15, Color(0.5, 0.9, 0.6))
			for cid in EconomyManager.prices.keys():
				var h: Array = EconomyManager.history.get(cid, [])
				var spark := ""
				for i in range(max(0, h.size() - 12), h.size()):
					spark += "▁▂▃▄▅▆▇█"[clampi(int(remap(h[i], 0.0, 16.0, 0, 7)), 0, 7)]
				make_label(_list, "%s  %s  (%s) → tomorrow $%.2f" % [
					cid, spark, EconomyManager.trend(cid), EconomyManager.forecast_price(cid)], 13)
		"mechanic":
			make_label(_list, "(Board out front says:)", 12, Color(0.5, 0.5, 0.5))

	_list.add_child(HSeparator.new())
	for cid in EconomyManager.prices.keys():
		var have: int = GameState.inventory.get(cid, 0)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		_list.add_child(row)
		var price_txt: String = "$%.2f" % EconomyManager.prices[cid]
		if GameState.background_id == "old_school":
			price_txt = "$%.0f-ish" % EconomyManager.prices[cid]  # qualitative even here
		make_label(row, "%s — %s | you have %d" % [cid, price_txt, have], 14)
		if have > 0:
			make_button(row, "Sell all", func():
				EconomyManager.sell(cid, have)
				_refresh())
