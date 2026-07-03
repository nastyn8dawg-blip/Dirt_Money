extends ScreenBase
## End-of-run report card: the replay trigger and the screenshot players post.
## "New Background" is the most prominent button in the entire game (UI_SPEC §3).


func _ready() -> void:
	add_background()
	var summary := GameState.run_summary()
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_CENTER)
	box.grow_horizontal = Control.GROW_DIRECTION_BOTH
	box.grow_vertical = Control.GROW_DIRECTION_BOTH
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 10)
	add_child(box)

	var bg_name: String = GameState.background().get("name", "?")
	make_label(box, "FARM REPORT CARD", 40, ACCENT)
	make_label(box, "%s — Day %d" % [bg_name, summary.day], 20)
	box.add_child(HSeparator.new())
	make_label(box, "Cash: $%d" % summary.cash, 18)
	make_label(box, "Debt: $%d" % summary.debt, 18)
	make_label(box, "Contracts completed: %d" % summary.contracts_completed, 18)
	var reps: Dictionary = summary.reputation.get("npcs", {})
	var best := ""
	var worst := ""
	var best_v := -999
	var worst_v := 999
	for npc_id in reps.keys():
		if reps[npc_id] > best_v:
			best_v = reps[npc_id]
			best = npc_id
	for npc_id in reps.keys():
		if reps[npc_id] < worst_v:
			worst_v = reps[npc_id]
			worst = npc_id
	make_label(box, "Best friend: %s (%d) | Worst enemy: %s (%d)" % [
		DataLoader.get_npc(best).get("name", best), best_v,
		DataLoader.get_npc(worst).get("name", worst), worst_v,
	], 16)
	make_label(box, "County standing: %d" % summary.reputation.get("county", 0), 16)
	make_label(box, "Ending title: \"%s\"" % _ending_title(summary), 18, ACCENT)
	box.add_child(HSeparator.new())

	var new_bg := make_button(box, "▶  TRY A NEW BACKGROUND  ◀", func(): go("character_select"))
	new_bg.add_theme_font_size_override("font_size", 24)
	make_button(box, "Main Menu", func(): go("main_menu"))
	make_label(box, "(Run comparison arrives in sprint 9)", 12, Color(0.5, 0.5, 0.5))


func _ending_title(summary: Dictionary) -> String:
	# Placeholder title table; data-driven ending titles come with sprint 9.
	if summary.cash > summary.debt:
		return "Solvent, Somehow"
	if summary.reputation.get("county", 0) > 10:
		return "Broke but Beloved"
	return "The Bank Owns the Sunset"
