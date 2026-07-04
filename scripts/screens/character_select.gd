extends ScreenBase
## Background choice sets the entire run's interface (MASTER_SPEC pillar 1).
## Panels preview the INTERFACE, not stats.


func _ready() -> void:
	add_background()
	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("separation", 20)
	root.offset_left = 40
	root.offset_right = -40
	root.offset_top = 30
	root.offset_bottom = -30
	add_child(root)

	make_label(root, "Who's taking over the farm?", 32, ACCENT)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 20)
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(row)

	for bg_id in ["old_school", "it_nephew", "mechanic"]:
		var bg: Dictionary = DataLoader.get_background(bg_id)
		var panel := make_panel(row)
		panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var col := VBoxContainer.new()
		col.add_theme_constant_override("separation", 10)
		panel.add_child(col)

		make_label(col, bg.get("name", bg_id), 24, ACCENT)
		var blurb := make_label(col, bg.get("blurb", ""), 14)
		blurb.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		col.add_child(HSeparator.new())
		make_label(col, "You will see:", 13, ScreenBase.GOOD)
		for line in _sees(bg):
			make_label(col, "  + " + line, 13)
		make_label(col, "You won't see:", 13, ScreenBase.WARN)
		for line in _blind(bg):
			make_label(col, "  - " + line, 13)
		col.add_child(Control.new())
		make_button(col, "Start as " + bg.get("name", bg_id), func():
			GameState.new_run(bg_id)
			go("farm_hud"))

	make_button(root, "Back", func(): go("main_menu"))


func _sees(bg: Dictionary) -> Array[String]:
	var i: Dictionary = bg.get("interface", {})
	var out: Array[String] = []
	if i.get("market_charts", false): out.append("Market charts & forecasts")
	if i.get("market_gossip", false): out.append("Market gossip at the diner")
	if int(i.get("weather_forecast_days", 0)) > 0: out.append("%d-day weather forecast" % i.weather_forecast_days)
	if i.get("weather_intuition", false): out.append("Weather in your bones")
	if i.get("farm_dashboard", false): out.append("Full farm dashboard")
	if i.get("equipment_subsystems", false): out.append("Every bolt of every machine")
	if i.get("qualitative_field_cues", false): out.append("What the land is telling you")
	return out


func _blind(bg: Dictionary) -> Array[String]:
	var i: Dictionary = bg.get("interface", {})
	var out: Array[String] = []
	if not i.get("market_charts", false): out.append("No charts, no dashboards")
	if not i.get("equipment_subsystems", false): out.append("Machines: \"sounds fine?\"")
	if not i.get("qualitative_field_cues", false) and not i.get("farm_dashboard", false):
		out.append("Crops: \"looks fine?\"")
	if bg.get("id", "") == "it_nephew": out.append("The county doesn't trust you yet")
	return out
