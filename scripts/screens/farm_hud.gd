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
	var shed_note := "iron's quiet"
	if not GameState.pending_breakdown.is_empty():
		shed_note = "⚠ BREAKDOWN"
	elif GameState.salvage_ready_to_sell():
		shed_note = "Salvage ready"
	elif not GameState.salvage_projects.is_empty():
		shed_note = "Salvage inside"
	_building("MACHINE SHED\n%s" % shed_note, Rect2(565, 375, 135, 95), Color("46464a"), _open_shed)
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


# ---------- side panel system (Director: stable, in-viewport, vertical) ----------

func _close_detail() -> void:
	if _detail:
		_detail.queue_free()
		_detail = null


func _open_side_panel(title: String) -> VBoxContainer:
	# One stable right-side inspector for everything: fully inside the
	# screen, actions stack vertically, long text wraps, clear close.
	_close_detail()
	_detail = make_panel(self)
	_detail.set_anchors_preset(Control.PRESET_RIGHT_WIDE)
	_detail.offset_left = -420
	_detail.offset_right = -12
	_detail.offset_top = 12
	_detail.offset_bottom = -12
	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 8)
	_detail.add_child(outer)
	var head := HBoxContainer.new()
	outer.add_child(head)
	var t := make_label(head, title, 20, ACCENT)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	make_button(head, "✕ Close", _close_detail)
	outer.add_child(HSeparator.new())
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	outer.add_child(scroll)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 6)
	scroll.add_child(col)
	return col


func _wrap(parent: Control, text: String, size: int = 13, color: Color = CREAM) -> Label:
	var l := make_label(parent, text, size, color)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 360
	return l


func _note_prompt(col: Control, cost: int, cost_line: String, on_confirm: Callable) -> void:
	# Canon credit prompt (Director wording pass 2026-07-04). "Note", never
	# "credit balance" — Ash Creek, not software. One helper so harvest and
	# emergency repair can't drift apart.
	_wrap(col, cost_line, 13, ScreenBase.WARN)
	_wrap(col, "Cash isn't there.", 13, ScreenBase.WARN)
	if not GameState.can_finance(cost):
		_wrap(col, "Earl won't carry any more.", 13, ScreenBase.WARN)
		_wrap(col, "Not until something gets paid down.", 12, ScreenBase.MUTED)
		return
	var charge := GameState.finance_charge(cost)
	if charge > cost:
		_wrap(col, "Earl will carry it, but not clean.", 13, ScreenBase.MUTED)
		_action(col, "Charge to credit — $%d with fee" % charge, true, on_confirm)
	else:
		_wrap(col, "Charge it to the note?", 13, ScreenBase.MUTED)
		_action(col, "Charge to credit — $%d" % charge, true, on_confirm)


func _action(parent: Control, text: String, enabled: bool, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.disabled = not enabled
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	b.pressed.connect(cb)
	parent.add_child(b)
	return b


func _open_field_detail(field_id: String) -> void:
	var f: Dictionary = GameState.fields[field_id]
	var stage := GameState.field_stage_name(f)
	var col := _open_side_panel("%s FIELD" % field_id.to_upper())

	_wrap(col, "%s — %s%s" % [
		f.crop if f.get("crop", "") != "" else "no crop", stage,
		" — %d day(s) to ready" % int(f.get("days_to_ready", 0)) if f.state == "growing" else "",
	], 14)
	col.add_child(HSeparator.new())
	_wrap(col, "Status", 13, ACCENT)
	_wrap(col, "• Soil: %s" % ("tested" if f.get("tested", false) else "untested — $30 tells you"))
	_wrap(col, "• Fertility: %s" % ("%d%%" % int(f.fertility) if f.get("tested", false) else "unknown"))
	if f.state == "growing":
		var weeds_known: bool = f.get("scouted", false)
		_wrap(col, "• Weeds/pests: %s" % (
			"%d%%%s" % [int(f.weeds), " — over 50% costs a fifth of the crop" if int(f.weeds) > 50 else ""] if weeds_known else "unknown — walk the field"
		), 13, ScreenBase.WARN if weeds_known and int(f.weeds) > 50 else CREAM)
		_wrap(col, "• Stress: %s" % ("storm-bitten — costing 10%" if f.get("stressed", false) else "none showing"),
			13, ScreenBase.WARN if f.get("stressed", false) else CREAM)
		_wrap(col, "• Expected yield: %d units%s" % [
			GameState.field_yield_units(f), "" if weeds_known else " (going by looks)"])
	col.add_child(HSeparator.new())
	_wrap(col, "Recommendation", 13, ACCENT)
	_wrap(col, _recommend(f, stage), 13, ScreenBase.GOOD)
	_wrap(col, _ignore_cost(f, stage), 12, ScreenBase.MUTED)
	col.add_child(HSeparator.new())
	_wrap(col, "Actions", 13, ACCENT)

	var acted := func(action: String):
		GameState.field_action(field_id, action)
		CalendarManager.spend_block()
		_close_detail()
		_refresh()
	var plant := func(crop_id: String):
		GameState.issue_field_order(field_id, crop_id, "plant")
		_close_detail()
		_refresh()

	if f.state == "fallow":
		var window_open := false
		for crop_id in DataLoader.crops.keys():
			var crop: Dictionary = DataLoader.crops[crop_id]
			if CalendarManager.day > int(crop.get("plant_by_day", 30)):
				continue
			window_open = true
			var order: Dictionary = crop.get("plant_order", {})
			var pcost := int(round(float(order.get("cost", 0)) * float(GameState.background().get("labor_cost_mult", 1.0))))
			_action(col, "Plant %s — $%d — by Day %d (%d-day job)" % [
				crop.name, pcost, crop.get("plant_by_day", 30), order.get("days", 1)],
				GameState.cash >= pcost, plant.bind(crop_id))
		if not window_open:
			_wrap(col, "Too late for corn. Soybeans would be a gamble this late.", 12, ScreenBase.MUTED)
		if not f.get("tested", false):
			_action(col, "Soil test — $30 — know before you spend", GameState.cash >= 30, func(): acted.call("soil_test"))
		if not f.get("tilled", false):
			_action(col, "Till — $40 + a block — +5%% yield when planted", GameState.cash >= 40, func(): acted.call("till"))
		_action(col, "Cover crop — $50 + a block — improves next season's soil", GameState.cash >= 50, func(): acted.call("cover_crop"))
		if not f.get("limed", false):
			_action(col, "Lime & prep — $40 — fertility up for next planting", GameState.cash >= 40, func(): acted.call("soil_prep"))
		_action(col, "Leave fallow — preserves time but earns nothing", true, _close_detail)
	elif f.state == "growing":
		if not f.get("scouted", false):
			_action(col, "Scout field — a time block — see the real weed number", true, func(): acted.call("scout"))
		if not f.get("fertilized", false):
			_action(col, "Fertilize — $80 + a block — +10%% yield", GameState.cash >= 80, func(): acted.call("fertilize"))
		_action(col, "Treat weeds/pests — $60 + a block — clears the pressure", GameState.cash >= 60, func(): acted.call("treat"))
		if f.get("stressed", false):
			# Emergency repair protects an active crop → financeable (ruling
			# 2026-07-04). "Patch runs" — canon, field-damage register.
			if GameState.cash >= 20:
				_action(col, "Repair storm damage — $20 + a block — saves 10%% of the crop", true, func(): acted.call("repair_field"))
			else:
				_note_prompt(col, 20, "Patch runs $20.", func():
					GameState.field_action(field_id, "repair_field", true)
					CalendarManager.spend_block()
					_close_detail()
					_refresh())
	elif f.state == "ready":
		var crop2: Dictionary = DataLoader.crops.get(f.crop, {})
		var h: Dictionary = crop2.get("harvest_order", {})
		var hcost := int(round(float(h.get("cost", 0)) * float(GameState.background().get("labor_cost_mult", 1.0))))
		var do_harvest := func(on_credit: bool):
			GameState.issue_field_order(field_id, f.crop, "harvest", on_credit)
			_close_detail()
			_refresh()
		if GameState.cash >= hcost:
			_action(col, "HARVEST — $%d — %d day(s) of crew work" % [hcost, h.get("days", 1)],
				true, do_harvest.bind(false))
		else:
			_note_prompt(col, hcost, "Harvest cost is $%d." % hcost, do_harvest.bind(true))
		_wrap(col, "Then sell at the elevator, or fill a contract at the Co-op.", 12, ScreenBase.MUTED)
	elif f.state == "working":
		for o in GameState.field_orders:
			if o.field == field_id:
				_wrap(col, "Crew %s — %d day(s) left%s" % [
					o.kind, o.days_left, "  (BROKEN DOWN — machine shed)" if o.get("paused", false) else ""],
					13, ScreenBase.WARN if o.get("paused", false) else ScreenBase.INFO)
	elif f.state == "cover":
		_wrap(col, "Cover crop's in. It pays next season, not this one.", 13, ScreenBase.MUTED)


func _ignore_cost(f: Dictionary, stage: String) -> String:
	# The Director's question: what happens if I ignore it?
	if stage == "ready":
		return "If you wait: the weather gets a vote on your harvest."
	if f.get("stressed", false):
		return "If you ignore it: storm damage takes 10% at harvest."
	if f.state == "growing" and f.get("scouted", false) and int(f.weeds) > 40:
		return "If you ignore it: weeds over 50% take a fifth of the crop."
	if f.state == "growing" and not f.get("scouted", false):
		return "If you don't look: whatever's out there works for free."
	if f.state == "fallow" and CalendarManager.day > 18:
		return "If you do nothing: no harm, no income. That can be a choice."
	if f.state == "fallow":
		return "If you wait: planting windows don't."
	return "Nothing here punishes patience today."


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
	var col := _open_side_panel("FARMHOUSE")
	_action(col, "Sleep → Next Day", true, func():
		_close_detail()
		CalendarManager.advance_day())
	_action(col, "Save game", true, func(): SaveManager.save_game())
	_action(col, "End the run — face the county's verdict", true, func(): go("report_card"))


func _open_barn() -> void:
	var col := _open_side_panel("BARN")
	var any := false
	for item in GameState.inventory.keys():
		if GameState.inventory[item] > 0:
			any = true
			_wrap(col, "%s — %d units" % [item, GameState.inventory[item]], 14)
	if not any:
		_wrap(col, "Empty. Fields fix that.", 14, ScreenBase.MUTED)
	_wrap(col, "Sell at the Grain Elevator, or deliver against a contract at the Co-op.", 12, ScreenBase.MUTED)


func _open_coop() -> void:
	var col := _open_side_panel("CHICKEN COOP")
	_wrap(col, "%d hens, laying daily. Eggs on hand: %d." % [GameState.chickens, GameState.inventory.get("eggs", 0)], 14)


func _open_shed() -> void:
	var col := _open_side_panel("MACHINE SHED")
	# Salvage projects live here — the answer to "I bought it, where did it go?"
	if not GameState.salvage_projects.is_empty():
		_wrap(col, "SALVAGE PROJECTS", 13, ACCENT)
		for i in range(GameState.salvage_projects.size()):
			add_salvage_project_block(col, i, 360, _open_shed)
		col.add_child(HSeparator.new())
	for eq_id in DataLoader.equipment.keys():
		var eq: Dictionary = DataLoader.equipment[eq_id]
		_wrap(col, eq.name, 14)
		if GameState.interface_flag("equipment_subsystems", false):
			var cond: Dictionary = eq.get("condition", {})
			for sub in DataLoader.equipment_meta.get("subsystems", []):
				if int(cond.get(sub, 0)) > 0:
					_wrap(col, "   %s: %d%%" % [sub, cond[sub]], 12,
						ScreenBase.WARN if int(cond[sub]) < 35 else ScreenBase.GOOD)
	if not GameState.pending_breakdown.is_empty():
		_wrap(col, "⚠ Machine down in the field — Roy's shop is on the line.", 13, ScreenBase.WARN)
		_action(col, "Take the call", true, func():
			_close_detail()
			EventBus.dialogue_started.emit("breakdown_choice"))


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
	for i in range(GameState.salvage_projects.size()):
		if GameState.salvage_ready_to_sell(i):
			return "That salvage project is ready for Roy."
	if not GameState.salvage_projects.is_empty():
		return "That salvage project is waiting in the shed."
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
	if _detail:
		_close_detail()
		return
	var col := _open_side_panel("PLAYTEST (dev)")
	var ledger_bits: Array[String] = []
	for k in GameState.ledger.keys():
		ledger_bits.append("%s: $%d" % [k, GameState.ledger[k]])
	_wrap(col, "LEDGER — " + ("; ".join(ledger_bits) if not ledger_bits.is_empty() else "empty"), 12)
	_wrap(col, "FLAGS — " + (", ".join(GameState.flags.keys()) if not GameState.flags.is_empty() else "none"), 12)
	var rep_bits: Array[String] = []
	for npc_id in ReputationLedger.rep.keys():
		rep_bits.append("%s %d (%s)" % [npc_id, ReputationLedger.get_rep(npc_id), ReputationLedger.tier(npc_id)])
	_wrap(col, "PEOPLE — " + "; ".join(rep_bits) + " | county %d" % ReputationLedger.county, 12)
	_wrap(col, "PERKS — " + (", ".join(GameState.perks) if not GameState.perks.is_empty() else "none yet"), 12)
	col.add_child(HSeparator.new())
	_action(col, "Restart (same background)", true, func():
		GameState.new_run(GameState.background_id)
		go("farm_hud"))
	_action(col, "New background", true, func(): go("character_select"))
	_action(col, "Export run summary", true, func():
		var f := FileAccess.open("user://playtest_export.txt", FileAccess.WRITE)
		if f:
			f.store_string(JSON.stringify(GameState.run_summary(), "  "))
		OS.shell_show_in_file_manager(ProjectSettings.globalize_path("user://")))
