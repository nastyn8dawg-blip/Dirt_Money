extends ScreenBase
## THE FARM VIEW (Director course correction, 2026-07-03): the player sees
## the farm, clicks fields and buildings, and makes field-stage decisions.
## Placeholder rectangles are fine; feeling like you own a place is not
## optional. "The field creates the pressure."

const STAGE_COLORS := {
	"empty": Color("6b5a43"),        # rough dirt
	"prepped": Color("7a6547"),      # tilled, darker rows
	"crew working": Color("857352"),
	"emerged": Color("6f7d4e"),      # first green
	"growing": Color("55703f"),      # committed green
	"stressed": Color("8a6a3a"),     # heat-bitten
	"ready": Color("b08d3c"),        # harvest gold
	"cover crop": Color("4c6350"),   # quiet green
}

var _status: Label
var _goal: Label
var _flavor: Label
var _suggest: Label
var _canvas: Control
var _detail: PanelContainer = null
var _pt_panel: PanelContainer = null


func _ready() -> void:
	add_background()
	EventBus.day_advanced.connect(func(_d): _refresh())
	EventBus.money_changed.connect(func(_c, _d): _refresh())
	EventBus.time_block_changed.connect(func(_b): _refresh())
	EventBus.dialogue_finished.connect(func(_t): _refresh())

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 24
	root.offset_right = -24
	root.offset_top = 16
	root.offset_bottom = -16
	root.add_theme_constant_override("separation", 10)
	add_child(root)

	var top := make_panel(root)
	var top_col := VBoxContainer.new()
	top.add_child(top_col)
	_status = make_label(top_col, "", 17, ACCENT)
	_goal = make_label(top_col, "", 12, Color(0.80, 0.75, 0.65))
	_flavor = make_label(top_col, "", 13, ScreenBase.INFO)
	_suggest = make_label(top_col, "", 13, ScreenBase.GOOD)

	_canvas = Control.new()
	_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(_canvas)

	_refresh()


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
	_goal.text = "GOAL: end Day %d solvent.   Barn: %d chickens%s" % [
		CalendarManager.RUN_LENGTH_DAYS, GameState.chickens,
		" | " + " · ".join(inv_bits) if not inv_bits.is_empty() else "",
	]
	# Interface exclusivity survives the farm view: each background reads
	# the same morning through a different instrument
	match GameState.background_id:
		"old_school":
			var bits: Array[String] = []
			var today := WeatherManager.today_line()
			if today != "":
				bits.append(today)
			var cue := WeatherManager.intuition_cue()
			if cue != "":
				bits.append("Something in your bones: " + cue)
			bits.append("At the diner: \"%s\"" % EconomyManager.gossip_line())
			_flavor.text = "  ".join(bits)
			_flavor.add_theme_color_override("font_color", Color(0.78, 0.60, 0.23))
		"it_nephew":
			var fc: Array = WeatherManager.forecast(int(GameState.interface_flag("weather_forecast_days", 0)))
			var fc_names: Array[String] = []
			for w in fc:
				fc_names.append(WeatherManager.display_name(w))
			var px: Array[String] = []
			for cid in ["corn", "soybeans", "hay"]:
				px.append("%s $%.2f→$%.2f" % [cid, EconomyManager.prices.get(cid, 0.0), EconomyManager.forecast_price(cid)])
			_flavor.text = "Forecast: %s   |   %s" % [" / ".join(fc_names), "  ".join(px)]
		"mechanic":
			var worst := 100
			var worst_name := ""
			for eq_id in DataLoader.equipment.keys():
				var cond: Dictionary = DataLoader.equipment[eq_id].get("condition", {})
				for sub in cond.keys():
					if int(cond[sub]) > 0 and int(cond[sub]) < worst:
						worst = int(cond[sub])
						worst_name = "%s %s" % [DataLoader.equipment[eq_id].name, sub]
			_flavor.text = "Shop ear: worst iron is %s at %d%%. You'd hear it going before anyone." % [worst_name, worst]
	_suggest.text = "▶ " + _suggestion()
	_rebuild_canvas()


func _rebuild_canvas() -> void:
	for c in _canvas.get_children():
		c.queue_free()
	# Fields — the reason the place exists
	_parcel("north", Rect2(0, 10, 380, 220))
	_parcel("south", Rect2(0, 250, 380, 220))
	_parcel("east", Rect2(400, 10, 300, 220))
	# Buildings
	_building("FARMHOUSE\nsleep · save · end run", Rect2(400, 250, 145, 105), Color("4a3a2a"), _open_farmhouse)
	_building("BARN\ninventory", Rect2(565, 250, 135, 105), Color("5a3028"), _open_barn)
	_building("COOP\n%d hens · %d eggs" % [GameState.chickens, GameState.inventory.get("eggs", 0)], Rect2(400, 375, 145, 95), Color("55432c"), _open_coop)
	_building("MACHINE SHED\n%s" % ("⚠ BREAKDOWN" if not GameState.pending_breakdown.is_empty() else "iron's quiet"), Rect2(565, 375, 135, 95), Color("46464a"), _open_shed)
	# The county road
	_building("COUNTY ROAD →\ninto town", Rect2(730, 10, 180, 90), Color("3d3a35"), func(): go("world_map"))
	_building("STOP AT THE DINER\ncoffee and county news", Rect2(730, 120, 180, 90), Color("4d3b2c"), func():
		GameState.add_cash(-8, "travel_fuel")
		CalendarManager.spend_block()
		EventBus.dialogue_started.emit("patti_talk"))
	_building("HOLLIS'S PLACE\nnext door", Rect2(730, 230, 180, 90), Color("44503c"), func(): EventBus.dialogue_started.emit("hollis_baler"))
	_building("[playtest]", Rect2(730, 340, 180, 50), Color("30302c"), _toggle_playtest_panel)


func _parcel(field_id: String, rect: Rect2) -> void:
	var f: Dictionary = GameState.fields[field_id]
	var stage := GameState.field_stage_name(f)
	var b := Button.new()
	var style := StyleBoxFlat.new()
	style.bg_color = STAGE_COLORS.get(stage, Color("6b5a43"))
	style.border_color = PANEL_BORDER
	style.set_border_width_all(1)
	style.set_corner_radius_all(2)
	var style_hover := style.duplicate()
	style_hover.border_color = ACCENT
	b.add_theme_stylebox_override("normal", style)
	b.add_theme_stylebox_override("hover", style_hover)
	b.add_theme_stylebox_override("pressed", style)
	b.add_theme_color_override("font_color", CREAM)
	b.add_theme_font_size_override("font_size", 15)
	var warn := _field_warning(f, stage)
	b.text = "%s FIELD\n%s%s%s" % [
		field_id.to_upper(),
		stage if f.get("crop", "") == "" else "%s — %s" % [f.crop, stage],
		"\n%d day(s) to ready" % int(f.get("days_to_ready", 0)) if f.state == "growing" else "",
		"\n" + warn if warn != "" else "",
	]
	b.position = rect.position
	b.size = rect.size
	b.pressed.connect(_open_field_detail.bind(field_id))
	_canvas.add_child(b)


func _field_warning(f: Dictionary, stage: String) -> String:
	if stage == "ready":
		return "● READY"
	if f.get("stressed", false):
		return "▲ STRESSED"
	if f.state == "growing" and not f.get("scouted", false) and int(f.get("days_to_ready", 9)) <= 6:
		return "? needs scouting"
	for o in GameState.field_orders:
		if o.get("paused", false):
			return "⚠ machine down"
	return ""


func _building(label: String, rect: Rect2, color: Color, on_press: Callable) -> void:
	var b := Button.new()
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = PANEL_BORDER
	style.set_border_width_all(1)
	style.set_corner_radius_all(2)
	var style_hover := style.duplicate()
	style_hover.border_color = ACCENT
	b.add_theme_stylebox_override("normal", style)
	b.add_theme_stylebox_override("hover", style_hover)
	b.add_theme_stylebox_override("pressed", style)
	b.add_theme_color_override("font_color", CREAM)
	b.add_theme_font_size_override("font_size", 13)
	b.text = label
	b.position = rect.position
	b.size = rect.size
	b.pressed.connect(on_press)
	_canvas.add_child(b)


# ---------- field detail panel ----------

func _close_detail() -> void:
	if _detail:
		_detail.queue_free()
		_detail = null


func _open_field_detail(field_id: String) -> void:
	_close_detail()
	var f: Dictionary = GameState.fields[field_id]
	var stage := GameState.field_stage_name(f)
	_detail = make_panel(self)
	_detail.set_anchors_preset(Control.PRESET_CENTER)
	_detail.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_detail.grow_vertical = Control.GROW_DIRECTION_BOTH
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 6)
	_detail.add_child(col)

	make_label(col, "%s FIELD" % field_id.to_upper(), 20, ACCENT)
	make_label(col, "Crop: %s   |   Stage: %s%s" % [
		f.crop if f.get("crop", "") != "" else "none", stage,
		"   |   %d day(s) to ready" % int(f.get("days_to_ready", 0)) if f.state == "growing" else "",
	], 14)
	make_label(col, "Soil: %s   |   Weather risk: %s" % [
		"fertility %d%%" % int(f.fertility) if f.get("tested", false) else "untested",
		WeatherManager.display_name(WeatherManager.current) + (" — field is stressed" if f.get("stressed", false) else ""),
	], 13)
	if f.state == "growing":
		make_label(col, "Weed/pest pressure: %s" % (
			"%d%%%s" % [int(f.weeds), " — costing yield" if int(f.weeds) > 50 else ""] if f.get("scouted", false) else "unknown — scout to find out"
		), 13, ScreenBase.WARN if f.get("scouted", false) and int(f.weeds) > 50 else CREAM)
		make_label(col, "Expected yield: %d units%s" % [
			GameState.field_yield_units(f),
			"" if f.get("scouted", false) else " (assumes what you can see)",
		], 13)
	make_label(col, "Recommended: " + _recommend(f, stage), 13, ScreenBase.GOOD)
	col.add_child(HSeparator.new())

	var acted := func(action: String):
		GameState.field_action(field_id, action)
		CalendarManager.spend_block()
		_close_detail()
		_refresh()

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	col.add_child(row)
	if f.state == "fallow":
		var planted_any := false
		for crop_id in DataLoader.crops.keys():
			var crop: Dictionary = DataLoader.crops[crop_id]
			if CalendarManager.day > int(crop.get("plant_by_day", 30)):
				continue
			planted_any = true
			var order: Dictionary = crop.get("plant_order", {})
			make_button(row, "Plant %s ($%d, by Day %d)" % [crop.name, order.get("cost", 0), crop.get("plant_by_day", 30)],
				func():
					GameState.issue_field_order(field_id, crop_id, "plant")
					_close_detail()
					_refresh())
		if not f.get("tilled", false):
			make_button(row, "Till ($40)", func(): acted.call("till"))
		if not f.get("tested", false):
			make_button(row, "Soil test ($30)", func(): acted.call("soil_test"))
		var row2 := HBoxContainer.new()
		row2.add_theme_constant_override("separation", 8)
		col.add_child(row2)
		# Late-season choices (Director canon lines) — hay is never the default
		if not planted_any:
			make_label(row2, "Too late for corn. Soybeans would be a gamble this late.", 12, ScreenBase.MUTED)
			var row3 := HBoxContainer.new()
			row3.add_theme_constant_override("separation", 8)
			col.add_child(row3)
			make_button(row3, "Cover crop ($50)", func(): acted.call("cover_crop"))
			make_label(row3, "improves next season's soil", 12, ScreenBase.MUTED)
			if not f.get("limed", false):
				make_button(row3, "Lime & prep ($40)", func(): acted.call("soil_prep"))
			make_label(row3, "· Fallow preserves time but earns nothing.", 12, ScreenBase.MUTED)
			if CalendarManager.day <= int(DataLoader.crops.get("hay", {}).get("plant_by_day", 18)):
				make_button(row3, "Plant hay ($90)", func():
					GameState.issue_field_order(field_id, "hay", "plant")
					_close_detail()
					_refresh())
	elif f.state == "growing":
		if not f.get("scouted", false):
			make_button(row, "Scout field (a block)", func(): acted.call("scout"))
		if not f.get("fertilized", false):
			make_button(row, "Fertilize ($80)", func(): acted.call("fertilize"))
		if f.get("scouted", false) and int(f.weeds) > 20:
			make_button(row, "Treat weeds/pests ($60)", func(): acted.call("treat"))
		if f.get("stressed", false):
			make_button(row, "Repair storm damage ($20)", func(): acted.call("repair_field"))
	elif f.state == "ready":
		var crop2: Dictionary = DataLoader.crops.get(f.crop, {})
		var h: Dictionary = crop2.get("harvest_order", {})
		make_button(row, "HARVEST — %dd, $%d" % [h.get("days", 0), h.get("cost", 0)], func():
			GameState.issue_field_order(field_id, f.crop, "harvest")
			_close_detail()
			_refresh())
		make_label(row, "Then: sell at the elevator, or fill a contract at the Co-op.", 12, ScreenBase.MUTED)
	elif f.state == "working":
		for o in GameState.field_orders:
			if o.field == field_id:
				make_label(row, "Crew %s — %d day(s) left%s" % [
					o.kind, o.days_left, "  (BROKEN DOWN)" if o.get("paused", false) else ""],
					13, ScreenBase.WARN if o.get("paused", false) else ScreenBase.INFO)
	make_button(col, "Close", _close_detail)


func _recommend(f: Dictionary, stage: String) -> String:
	if stage == "ready":
		return "harvest before the weather gets a vote."
	if f.get("stressed", false):
		return "repair the storm damage — it's costing yield."
	if f.state == "growing" and f.get("scouted", false) and int(f.weeds) > 40:
		return "treat the weeds before they take their cut."
	if f.state == "growing" and not f.get("scouted", false):
		return "walk it. You can't fix what you haven't seen."
	if f.state == "fallow" and CalendarManager.day <= 6:
		return "corn window's open — commit or till."
	if f.state == "fallow" and CalendarManager.day > int(DataLoader.crops.get("hay", {}).get("plant_by_day", 18)):
		return "season's set. Cover crop pays next year; town pays this one."
	if f.state == "fallow":
		return "plant inside the window, or prep and wait."
	return "let it work."


# ---------- buildings ----------

func _open_farmhouse() -> void:
	_close_detail()
	_detail = make_panel(self)
	_detail.set_anchors_preset(Control.PRESET_CENTER)
	_detail.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_detail.grow_vertical = Control.GROW_DIRECTION_BOTH
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	_detail.add_child(col)
	make_label(col, "FARMHOUSE", 20, ACCENT)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	col.add_child(row)
	make_button(row, "Sleep → Next Day", func():
		_close_detail()
		CalendarManager.advance_day())
	make_button(row, "Save", func(): SaveManager.save_game())
	make_button(row, "End Run", func(): go("report_card"))
	make_button(col, "Close", _close_detail)


func _open_barn() -> void:
	_close_detail()
	_detail = make_panel(self)
	_detail.set_anchors_preset(Control.PRESET_CENTER)
	_detail.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_detail.grow_vertical = Control.GROW_DIRECTION_BOTH
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 6)
	_detail.add_child(col)
	make_label(col, "BARN", 20, ACCENT)
	var any := false
	for item in GameState.inventory.keys():
		if GameState.inventory[item] > 0:
			any = true
			make_label(col, "%s — %d units" % [item, GameState.inventory[item]], 14)
	if not any:
		make_label(col, "Empty. Fields fix that.", 14, ScreenBase.MUTED)
	make_label(col, "Sell at the Grain Elevator, or deliver against a contract at the Co-op.", 12, ScreenBase.MUTED)
	make_button(col, "Close", _close_detail)


func _open_coop() -> void:
	_close_detail()
	_detail = make_panel(self)
	_detail.set_anchors_preset(Control.PRESET_CENTER)
	_detail.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_detail.grow_vertical = Control.GROW_DIRECTION_BOTH
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 6)
	_detail.add_child(col)
	make_label(col, "CHICKEN COOP", 20, ACCENT)
	make_label(col, "%d hens, laying daily. Eggs on hand: %d." % [GameState.chickens, GameState.inventory.get("eggs", 0)], 14)
	make_button(col, "Close", _close_detail)


func _open_shed() -> void:
	_close_detail()
	_detail = make_panel(self)
	_detail.set_anchors_preset(Control.PRESET_CENTER)
	_detail.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_detail.grow_vertical = Control.GROW_DIRECTION_BOTH
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 6)
	_detail.add_child(col)
	make_label(col, "MACHINE SHED", 20, ACCENT)
	for eq_id in DataLoader.equipment.keys():
		var eq: Dictionary = DataLoader.equipment[eq_id]
		make_label(col, eq.name, 14)
		if GameState.interface_flag("equipment_subsystems", false):
			var cond: Dictionary = eq.get("condition", {})
			for sub in DataLoader.equipment_meta.get("subsystems", []):
				if int(cond.get(sub, 0)) > 0:
					make_label(col, "   %s: %d%%" % [sub, cond[sub]], 12,
						ScreenBase.WARN if int(cond[sub]) < 35 else ScreenBase.GOOD)
	if not GameState.pending_breakdown.is_empty():
		make_label(col, "⚠ Machine down in the field — Roy's shop is on the line.", 13, ScreenBase.WARN)
		make_button(col, "Take the call", func():
			_close_detail()
			EventBus.dialogue_started.emit("breakdown_choice"))
	make_button(col, "Close", _close_detail)


# ---------- suggestion + playtest (unchanged logic) ----------

func _suggestion() -> String:
	if not GameState.pending_breakdown.is_empty():
		return "Machine's down in the field. Roy's shop is on the line — deal with it."
	for c in GameState.contracts_active:
		if GameState.inventory.get(c.get("commodity", ""), 0) >= int(c.get("units", 0)) and c.get("type", "") != "repair":
			return "You can fill Marge's contract — deliver at the Co-op before %s (Day %d)." % [
				CalendarManager.weekday_of(c.deadline_day), c.deadline_day]
		if int(c.deadline_day) - CalendarManager.day <= 2:
			return "Contract due %s (Day %d) — move." % [
				CalendarManager.weekday_of(c.deadline_day), c.deadline_day]
	for field_id in GameState.fields.keys():
		var f: Dictionary = GameState.fields[field_id]
		if f.state == "ready":
			return "%s field is READY — click it and order the harvest." % field_id.capitalize()
		if f.get("stressed", false):
			return "%s field took weather damage — click it." % field_id.capitalize()
	for field_id in GameState.fields.keys():
		var f: Dictionary = GameState.fields[field_id]
		if f.state == "fallow" and GameState.cash >= 90 and CalendarManager.day <= 18:
			return "%s field is empty and the window's open — click it." % field_id.capitalize()
		if f.state == "growing" and not f.get("scouted", false):
			return "Crops are in. Walk your fields, then work the county."
	for item in ["corn", "soybeans", "hay"]:
		if GameState.inventory.get(item, 0) > 0:
			return "You're sitting on unsold %s — County Road → Grain Elevator." % item
	return "Fields are working themselves. The county's where the day pays now."


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
