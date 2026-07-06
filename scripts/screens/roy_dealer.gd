extends ScreenBase
## Carver Equipment — Roy's floor (2026-07-06): the good/better/best answer.
## Your iron per slot with a trade-in quote, Roy's stock with his sales line,
## purchase via cash or Earl's note (trade-in mandatory, replace-in-slot).
## [AI prose throughout — Director curation]

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

	make_label(root, "CARVER EQUIPMENT", 32, ACCENT)
	make_label(root, "Roy sells iron and files people. Trade-in comes off the sticker; the rest is cash or Earl's note.", 13, ScreenBase.MUTED)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	root.add_child(scroll)
	_list = VBoxContainer.new()
	_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_list.add_theme_constant_override("separation", 10)
	scroll.add_child(_list)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	root.add_child(row)
	make_button(row, "Talk to Roy", func(): EventBus.dialogue_started.emit("roy_talk"))
	make_button(row, "Back to Farm", func(): go("farm_hud"))
	_rebuild()


func _rebuild() -> void:
	for c in _list.get_children():
		c.queue_free()

	# Your iron, slot by slot, with Roy's trade-in quote
	var yours := make_panel(_list)
	var ycol := VBoxContainer.new()
	ycol.add_theme_constant_override("separation", 4)
	yours.add_child(ycol)
	make_label(ycol, "YOUR IRON (Roy's trade-in quote, at your standing)", 14, ACCENT)
	for slot in GameState.equipment_slots.keys():
		var eq_id: String = GameState.equipment_slots[slot]
		var eq: Dictionary = DataLoader.equipment.get(eq_id, {})
		make_label(ycol, "%s — %s — trade-in $%d" % [
			eq.get("name", eq_id), GameState.equipment_summary_state(eq_id),
			GameState.trade_in_value(eq_id)], 13, CREAM)

	# The counter rack: supplies Roy stocks (items.json, cash only)
	var rack := make_panel(_list)
	var rcol := VBoxContainer.new()
	rcol.add_theme_constant_override("separation", 4)
	rack.add_child(rcol)
	make_label(rcol, "THE COUNTER RACK", 14, ACCENT)
	for item in DataLoader.items:
		if item.get("sold_at", "") != "dealer":
			continue
		var irow := HBoxContainer.new()
		irow.add_theme_constant_override("separation", 10)
		rcol.add_child(irow)
		make_label(irow, "%s — $%d — %s (you have %d)" % [
			item.get("name", "?"), int(item.get("price", 0)), item.get("blurb", ""),
			int(GameState.items_owned.get(item.get("id", ""), 0))], 13)
		if GameState.cash >= int(item.get("price", 0)):
			make_button(irow, "Buy", func():
				GameState.buy_item(item.get("id", ""))
				_rebuild())

	# Roy's floor
	var stock := GameState.dealer_stock_available()
	if stock.is_empty():
		var l := make_label(_list, "The floor's picked clean. Roy says something's coming on a truck. Roy always says that.", 14, ScreenBase.MUTED)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		return
	for s in stock:
		var panel := make_panel(_list)
		var col := VBoxContainer.new()
		col.add_theme_constant_override("separation", 4)
		panel.add_child(col)
		var slot: String = s.get("slot", "")
		var old_id: String = GameState.equipment_slots.get(slot, "")
		var trade := GameState.trade_in_value(old_id)
		var net: int = maxi(0, int(s.get("price", 0)) - trade)
		make_label(col, "%s   —   $%d sticker" % [s.get("name", "?"), int(s.get("price", 0))], 16, ACCENT)
		make_label(col, "Roy: \"%s\"" % s.get("roy_line", ""), 13, CREAM)
		make_label(col, "Replaces your %s (trade-in −$%d) → $%d out the door" % [
			DataLoader.equipment.get(old_id, {}).get("name", old_id), trade, net], 12, ScreenBase.MUTED)
		if GameState.cash >= net:
			var b := make_button(col, "Buy it — $%d cash, trade rolls in" % net, _buy.bind(s.get("id", ""), false))
			b.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
		elif s.get("financeable", false) and GameState.can_finance(net):
			var charge := GameState.finance_charge(net)
			var note_label := "Put it on the note — $%d" % charge
			if charge > net:
				note_label += " (Earl's fee included, credit's tight)"
			var b2 := make_button(col, note_label, _buy.bind(s.get("id", ""), true))
			b2.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
		else:
			make_label(col, "Cash isn't there and Earl won't carry it. Not this month.", 12, ScreenBase.WARN)


func _buy(stock_id: String, on_credit: bool) -> void:
	if GameState.buy_equipment(stock_id, on_credit):
		CalendarManager.spend_block()
	_rebuild()
