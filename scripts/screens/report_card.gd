extends ScreenBase
## End-of-run report card: Ash Creek's verdict. The thesis question answered
## out loud — who'd vouch for you, who wouldn't, what the county says.
## "New Background" is the most prominent button in the game (UI_SPEC §3).


func _ready() -> void:
	add_background()
	var summary := GameState.run_summary()
	var history := SaveManager.load_run_history()
	if not GameState.run_recorded:
		GameState.run_recorded = true
		SaveManager.record_run(summary)
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

	# The money story: net worth is the honest trajectory (started at -6800).
	# Debt is pressure, not the verdict — the county's word below is the verdict.
	var net: int = int(summary.get("net_worth", summary.cash - summary.debt))
	make_label(box, "Cash: $%d   |   Note still owed: $%d" % [summary.cash, summary.debt], 18)
	make_label(box, "Net worth: $%d   (you started at -$%d)" % [net, GameState.STARTING_DEBT - GameState.STARTING_CASH],
		16, ScreenBase.GOOD if net > -(GameState.STARTING_DEBT - GameState.STARTING_CASH) else ScreenBase.WARN)
	make_label(box, "Handshakes kept: %d   |   Handshakes missed: %d" % [
		summary.contracts_completed, summary.contracts_missed,
	], 18, ScreenBase.GOOD if summary.contracts_missed == 0 else Color(0.72, 0.58, 0.32))
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
		15, ScreenBase.GOOD)
	make_label(box, "Answers your questions, nothing more: %s" % (", ".join(cold) if not cold.is_empty() else "nobody"),
		15, ScreenBase.WARN)
	make_label(box, "County standing: %d" % summary.reputation.get("county", 0), 15)
	var talk := DataLoader.pick_gossip()
	if talk != "":
		var gossip_label := make_label(box, "Heard at the diner: \"%s\"" % talk.replace("\n\n", " "), 14, Color(0.80, 0.75, 0.65))
		gossip_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		gossip_label.custom_minimum_size.x = 600
	box.add_child(HSeparator.new())

	make_label(box, "Strongest income: %s   |   Largest mistake: %s" % [
		summary.strongest_income.replace("_revenue", "").replace("_", " "),
		summary.largest_mistake,
	], 14)
	var ending := DataLoader.pick_ending()
	var title_label := make_label(box, "\"%s\"" % ending.get("title", "..."), 18, ACCENT)
	title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title_label.custom_minimum_size.x = 600
	box.add_child(HSeparator.new())

	# --- Run comparison: the replay hypothesis, on screen ---
	if not history.is_empty():
		make_label(box, "PREVIOUS RUNS THROUGH ASH CREEK", 16, ACCENT)
		for prev in history.slice(max(0, history.size() - 4), history.size()):
			var bg_label: String = DataLoader.get_background(prev.get("background", "")).get("name", "?")
			var prev_net: int = int(prev.get("net_worth", int(prev.get("cash", 0)) - int(prev.get("debt", 0))))
			var line := make_label(box, "%s — \"%s\" — net $%d, %d/%d handshakes, county %d — %s" % [
				bg_label, prev.get("ending_title", "?"), prev_net,
				int(prev.get("contracts_completed", 0)),
				int(prev.get("contracts_completed", 0)) + int(prev.get("contracts_missed", 0)),
				int(prev.get("reputation", {}).get("county", 0)),
				prev.get("largest_mistake", ""),
			], 13, Color(0.80, 0.75, 0.65))
			line.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			line.custom_minimum_size.x = 620
		box.add_child(HSeparator.new())

	var new_bg := make_button(box, "▶  TRY A NEW BACKGROUND  ◀", func(): go("character_select"))
	new_bg.add_theme_font_size_override("font_size", 24)
	make_button(box, "Main Menu", func(): go("main_menu"))
	make_label(box, "(Run comparison arrives in sprint 9)", 12, ScreenBase.MUTED)
