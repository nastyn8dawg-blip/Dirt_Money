extends ScreenBase
## End-of-run report card: Ash Creek's verdict. The thesis question answered
## out loud — who'd vouch for you, who wouldn't, what the county says.
## "New Background" is the most prominent button in the game (UI_SPEC §3).


func _ready() -> void:
	add_background()
	var summary := GameState.run_summary()
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_CENTER)
	box.grow_horizontal = Control.GROW_DIRECTION_BOTH
	box.grow_vertical = Control.GROW_DIRECTION_BOTH
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 8)
	add_child(box)

	var bg_name: String = GameState.background().get("name", "?")
	make_label(box, "FARM REPORT CARD", 40, ACCENT)
	make_label(box, "%s — Day %d" % [bg_name, summary.day], 20)
	box.add_child(HSeparator.new())

	make_label(box, "Cash: $%d   |   Debt: $%d" % [summary.cash, summary.debt], 18)
	make_label(box, "Handshakes kept: %d   |   Handshakes missed: %d" % [
		summary.contracts_completed, summary.contracts_missed,
	], 18, Color(0.6, 0.85, 0.6) if summary.contracts_missed == 0 else Color(0.9, 0.75, 0.4))
	box.add_child(HSeparator.new())

	# --- Trust ledger ---
	make_label(box, "THE COUNTY'S LEDGER", 18, ACCENT)
	var vouchers: Array[String] = []
	var cold: Array[String] = []
	var reps: Dictionary = summary.reputation.get("npcs", {})
	for npc_id in reps.keys():
		var npc_name: String = DataLoader.get_npc(npc_id).get("name", npc_id)
		if int(reps[npc_id]) >= 20:
			vouchers.append(npc_name)
		elif int(reps[npc_id]) < 0:
			cold.append(npc_name)
	make_label(box, "Would vouch for you: %s" % (", ".join(vouchers) if not vouchers.is_empty() else "nobody yet"),
		15, Color(0.6, 0.85, 0.6))
	make_label(box, "Answers your questions, nothing more: %s" % (", ".join(cold) if not cold.is_empty() else "nobody"),
		15, Color(0.9, 0.6, 0.5))
	make_label(box, "County standing: %d" % summary.reputation.get("county", 0), 15)
	var talk := DataLoader.pick_gossip()
	if talk != "":
		var gossip_label := make_label(box, "Heard at the diner: \"%s\"" % talk.replace("\n\n", " "), 14, Color(0.75, 0.7, 0.6))
		gossip_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		gossip_label.custom_minimum_size.x = 600
	box.add_child(HSeparator.new())

	var ending := DataLoader.pick_ending()
	var title_label := make_label(box, "\"%s\"" % ending.get("title", "..."), 18, ACCENT)
	title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title_label.custom_minimum_size.x = 600
	box.add_child(HSeparator.new())

	var new_bg := make_button(box, "▶  TRY A NEW BACKGROUND  ◀", func(): go("character_select"))
	new_bg.add_theme_font_size_override("font_size", 24)
	make_button(box, "Main Menu", func(): go("main_menu"))
	make_label(box, "(Run comparison arrives in sprint 9)", 12, Color(0.5, 0.5, 0.5))
