extends ScreenBase
## Home base. The proof-of-concept for interface-exclusive backgrounds:
## the info panel below is DIFFERENT per background, per UI_SPEC §1.

var _status: Label
var _goal: Label
var _suggest: Label
var _info_col: VBoxContainer
var _fields_col: VBoxContainer


func _ready() -> void:
	add_background()
	EventBus.day_advanced.connect(func(_d): _refresh())
	EventBus.money_changed.connect(func(_c, _d): _refresh())
	EventBus.time_block_changed.connect(func(_b): _refresh())
	EventBus.dialogue_finished.connect(func(_t): _refresh())

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 30
	root.offset_right = -30
	root.offset_top = 20
	root.offset_bottom = -20
	root.add_theme_constant_override("separation", 14)
	add_child(root)

	var top := make_panel(root)
	var top_col := VBoxContainer.new()
	top.add_child(top_col)
	_status = make_label(top_col, "", 18, ACCENT)
	_goal = make_label(top_col, "", 13, Color(0.80, 0.75, 0.65))
	_suggest = make_label(top_col, "", 14, ScreenBase.GOOD)

	var body := HBoxContainer.new()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 14)
	root.add_child(body)

	var fields_panel := make_panel(body)
	fields_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_fields_col = VBoxContainer.new()
	_fields_col.add_theme_constant_override("separation", 8)
	fields_panel.add_child(_fields_col)

	var info_panel := make_panel(body)
	info_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_info_col = VBoxContainer.new()
	_info_col.add_theme_constant_override("separation", 8)
	info_panel.add_child(_info_col)

	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 10)
	root.add_child(nav)
	make_button(nav, "County Map", func(): go("world_map"))
	make_button(nav, "Visit Hollis next door", func(): EventBus.dialogue_started.emit("hollis_baler"))
	make_button(nav, "Save", func(): SaveManager.save_game())
	make_button(nav, "Sleep → Next Day", func(): CalendarManager.advance_day())
	make_button(nav, "End Run", func(): go("report_card"))
	make_button(nav, "[Playtest]", _toggle_playtest_panel)

	_refresh()


var _pt_panel: PanelContainer = null


func _toggle_playtest_panel() -> void:
	if _pt_panel:
		_pt_panel.queue_free()
		_pt_panel = null
		return
	_pt_panel = make_panel(self)
	_pt_panel.set_anchors_preset(Control.PRESET_CENTER)
	_pt_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_pt_panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 6)
	_pt_panel.add_child(col)
	make_label(col, "PLAYTEST PANEL (dev only)", 16, ACCENT)
	var ledger_bits: Array[String] = []
	for k in GameState.ledger.keys():
		ledger_bits.append("%s: $%d" % [k, GameState.ledger[k]])
	var l1 := make_label(col, "LEDGER — " + ("; ".join(ledger_bits) if not ledger_bits.is_empty() else "empty"), 12)
	l1.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l1.custom_minimum_size.x = 560
	var l2 := make_label(col, "FLAGS — " + (", ".join(GameState.flags.keys()) if not GameState.flags.is_empty() else "none"), 12)
	l2.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l2.custom_minimum_size.x = 560
	var rep_bits: Array[String] = []
	for npc_id in ReputationLedger.rep.keys():
		rep_bits.append("%s %d (%s)" % [npc_id, ReputationLedger.get_rep(npc_id), ReputationLedger.tier(npc_id)])
	var l3 := make_label(col, "PEOPLE — " + "; ".join(rep_bits) + " | county %d" % ReputationLedger.county, 12)
	l3.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l3.custom_minimum_size.x = 560
	make_label(col, "PERKS — " + (", ".join(GameState.perks) if not GameState.perks.is_empty() else "none yet"), 12)
	var btns := HBoxContainer.new()
	btns.add_theme_constant_override("separation", 8)
	col.add_child(btns)
	make_button(btns, "Restart (same background)", func():
		GameState.new_run(GameState.background_id)
		go("farm_hud"))
	make_button(btns, "New background", func(): go("character_select"))
	make_button(btns, "Export summary", func():
		var f := FileAccess.open("user://playtest_export.txt", FileAccess.WRITE)
		if f:
			f.store_string(JSON.stringify(GameState.run_summary(), "  "))
		OS.shell_show_in_file_manager(ProjectSettings.globalize_path("user://")))
	make_button(btns, "Close", _toggle_playtest_panel)


func _refresh() -> void:
	_status.text = "Day %d of %d (%s) — %s | %s | Cash: $%d | Debt: $%d%s" % [
		CalendarManager.day, CalendarManager.RUN_LENGTH_DAYS,
		CalendarManager.weekday_name(), CalendarManager.block_name(),
		WeatherManager.display_name(WeatherManager.current), GameState.cash, GameState.debt,
		" ⚠ credit tight" if GameState.credit_tight() else "",
	]
	var inv_bits: Array[String] = []
	for item in GameState.inventory.keys():
		if GameState.inventory[item] > 0:
			inv_bits.append("%s %d" % [item, GameState.inventory[item]])
	_goal.text = "GOAL: end Day %d solvent — debt grows daily; sell crops, work contracts.   Barn: %d chickens%s" % [
		CalendarManager.RUN_LENGTH_DAYS, GameState.chickens,
		" | " + " · ".join(inv_bits) if not inv_bits.is_empty() else "",
	]
	_suggest.text = "▶ " + _suggestion()
	_rebuild_fields()
	_rebuild_info()


func _suggestion() -> String:
	if not GameState.pending_breakdown.is_empty():
		return "Machine's down in the field. Roy's shop is on the line — deal with it."
	for c in GameState.contracts_active:
		if GameState.inventory.get(c.commodity, 0) >= int(c.units):
			return "You can fill Marge's contract — deliver at the Co-op before %s (Day %d)." % [
				CalendarManager.weekday_of(c.deadline_day), c.deadline_day]
		if int(c.deadline_day) - CalendarManager.day <= 2:
			return "Contract due %s (Day %d) and you're short %s — move." % [
				CalendarManager.weekday_of(c.deadline_day), c.deadline_day, c.commodity]
	for f in GameState.fields.values():
		if f.state == "ready":
			return "A crop is READY — order the harvest, then sell it at the Grain Elevator."
	var cheapest := 90
	for f in GameState.fields.values():
		if f.state == "fallow" and GameState.cash >= cheapest:
			return "You have an empty field and cash to plant it. Pick a crop below."
	for item in ["corn", "soybeans", "hay"]:
		if GameState.inventory.get(item, 0) > 0:
			return "You're sitting on unsold %s — County Map → Grain Elevator." % item
	for f in GameState.fields.values():
		if f.state == "growing" or f.state == "working":
			return "Fields are working themselves. Use the day: contracts at the Co-op, talk to neighbors, or Sleep."
	return "Nothing urgent. Check the contract board at the Co-op, or Sleep to the next day."


func _rebuild_fields() -> void:
	for c in _fields_col.get_children():
		c.queue_free()
	make_label(_fields_col, "FIELDS — one-tap orders", 16, ACCENT)
	for field_id in GameState.fields.keys():
		var f: Dictionary = GameState.fields[field_id]
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		_fields_col.add_child(row)
		var state_txt: String
		match f.state:
			"fallow": state_txt = "%s field — empty" % field_id.capitalize()
			"working": state_txt = "%s field — crew working" % field_id.capitalize()
			"growing": state_txt = "%s field — %s growing" % [field_id.capitalize(), f.crop]
			"ready": state_txt = "%s field — %s READY" % [field_id.capitalize(), f.crop]
			_: state_txt = "%s field — %s" % [field_id.capitalize(), f.state]
		make_label(row, state_txt, 14)
		if f.state == "fallow":
			var any_open := false
			for crop_id in DataLoader.crops.keys():
				var crop: Dictionary = DataLoader.crops[crop_id]
				if CalendarManager.day > int(crop.get("plant_by_day", 30)):
					continue
				any_open = true
				var order: Dictionary = crop.get("plant_order", {})
				make_button(row, "Plant %s — %dd, $%d (window closes Day %d)" % [
					crop.name, order.get("days", 0), order.get("cost", 0), crop.get("plant_by_day", 30)],
					func():
						GameState.issue_field_order(field_id, crop_id, "plant")
						_refresh())
			if not any_open:
				make_label(row, "— planting windows closed for the season", 13, ScreenBase.MUTED)
		elif f.state == "growing":
			make_label(row, "— ready in %d day(s)" % int(f.get("days_to_ready", 0)), 13, ScreenBase.GOOD)
		elif f.state == "ready":
			var crop2: Dictionary = DataLoader.crops.get(f.crop, {})
			var h: Dictionary = crop2.get("harvest_order", {})
			make_button(row, "HARVEST — %dd, $%d" % [h.get("days", 0), h.get("cost", 0)],
				func():
					GameState.issue_field_order(field_id, f.crop, "harvest")
					_refresh())
		elif f.state == "working":
			for o in GameState.field_orders:
				if o.field == field_id:
					if o.get("paused", false):
						make_label(row, "→ BROKEN DOWN — %s stalled" % o.kind, 13, ScreenBase.WARN)
					else:
						make_label(row, "→ %s, %d day(s) left" % [o.kind, o.days_left], 13, ScreenBase.INFO)


func _rebuild_info() -> void:
	for c in _info_col.get_children():
		c.queue_free()
	match GameState.background_id:
		"old_school":
			make_label(_info_col, "THE LAND", 16, ACCENT)
			var today := WeatherManager.today_line()
			if today != "":
				make_label(_info_col, today, 14)
			var cue := WeatherManager.intuition_cue()
			if cue != "":
				make_label(_info_col, "Something in your bones: " + cue, 14, Color(0.78, 0.60, 0.23))
			make_label(_info_col, "At the diner: \"%s\"" % EconomyManager.gossip_line(), 14)
			make_label(_info_col, "(No charts. No dashboards. You read people and sky.)", 12, ScreenBase.MUTED)
		"it_nephew":
			make_label(_info_col, "FARM DASHBOARD v0.1", 16, ACCENT)
			var fc: Array = WeatherManager.forecast(int(GameState.interface_flag("weather_forecast_days", 0)))
			var fc_names: Array[String] = []
			for w in fc:
				fc_names.append(WeatherManager.display_name(w))
			make_label(_info_col, "Forecast: %s" % " / ".join(fc_names), 14)
			for cid in EconomyManager.prices.keys():
				make_label(_info_col, "%s: $%.2f (%s) → tomorrow $%.2f" % [
					cid, EconomyManager.prices[cid], EconomyManager.trend(cid),
					EconomyManager.forecast_price(cid),
				], 14)
			make_label(_info_col, "(All the data. None of the trust.)", 12, ScreenBase.MUTED)
		"mechanic":
			make_label(_info_col, "EQUIPMENT STATUS", 16, ACCENT)
			for eq_id in DataLoader.equipment.keys():
				var eq: Dictionary = DataLoader.equipment[eq_id]
				make_label(_info_col, eq.name, 14)
				var cond: Dictionary = eq.get("condition", {})
				for sub in DataLoader.equipment_meta.get("subsystems", []):
					if int(cond.get(sub, 0)) > 0:
						make_label(_info_col, "   %s: %d%%" % [sub, cond[sub]], 12,
							ScreenBase.WARN if int(cond[sub]) < 35 else ScreenBase.GOOD)
			make_label(_info_col, "(Crops? They look... fine?)", 12, ScreenBase.MUTED)
