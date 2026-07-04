extends ScreenBase
## Character select — a role choice, not a debug tooltip (Director course
## correction, 2026-07-03). Card copy is Director canon in backgrounds.json:
## who you are, what you start with, what's harder, how the county sees you.


func _ready() -> void:
	add_background()
	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("separation", 16)
	root.offset_left = 40
	root.offset_right = -40
	root.offset_top = 26
	root.offset_bottom = -26
	add_child(root)

	make_label(root, "Who's taking over the farm?", 32, ACCENT)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 20)
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(row)

	for bg_id in ["old_school", "it_nephew", "mechanic"]:
		var bg: Dictionary = DataLoader.get_background(bg_id)
		var card: Dictionary = bg.get("card", {})
		var panel := make_panel(row)
		panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var col := VBoxContainer.new()
		col.add_theme_constant_override("separation", 8)
		panel.add_child(col)

		make_label(col, bg.get("name", bg_id), 24, ACCENT)
		var summary := make_label(col, card.get("summary", ""), 14)
		summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		col.add_child(HSeparator.new())

		make_label(col, "Starts with", 13, ScreenBase.GOOD)
		for line in card.get("starts_with", []):
			make_label(col, "  • " + line, 13)
		make_label(col, "Harder path", 13, ScreenBase.WARN)
		for line in card.get("harder_path", []):
			make_label(col, "  • " + line, 13)
		col.add_child(HSeparator.new())

		var read := make_label(col, "\"%s\"" % card.get("county_read", ""), 13, Color(0.80, 0.75, 0.65))
		read.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		col.add_child(Control.new())
		make_button(col, "Start as " + bg.get("name", bg_id), func():
			GameState.new_run(bg_id)
			go("farm_hud"))

	make_button(root, "Back", func(): go("main_menu"))
