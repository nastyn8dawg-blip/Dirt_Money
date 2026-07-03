extends Node
## Foundation smoke tests. Run headless:
##   godot --headless res://tests/smoke_test.tscn
## Exits 0 on pass, 1 on failure. Runs as a scene so autoloads are live.

var failures: Array[String] = []


func _ready() -> void:
	test_data_loads()
	test_calendar_advances()
	test_reputation_ripple()
	test_field_order_lifecycle()
	test_save_roundtrip()

	if failures.is_empty():
		print("SMOKE TESTS PASSED")
		get_tree().quit(0)
	else:
		for f in failures:
			printerr("FAIL: " + f)
		get_tree().quit(1)


func check(condition: bool, name: String) -> void:
	if not condition:
		failures.append(name)


func test_data_loads() -> void:
	check(DataLoader.load_errors.is_empty(), "data files parse without errors: %s" % str(DataLoader.load_errors))
	check(DataLoader.backgrounds.size() == 3, "3 backgrounds loaded")
	check(DataLoader.npcs.size() == 8, "8 NPCs loaded")
	check(DataLoader.crops.size() == 3, "3 crops loaded")
	check(DataLoader.dialogue_trees.has("hollis_baler"), "sample dialogue tree loaded")
	# Every check option must have both success and failure branches (design law)
	for tree_id in DataLoader.dialogue_trees.keys():
		var tree: Dictionary = DataLoader.dialogue_trees[tree_id]
		for node_id in tree.get("nodes", {}).keys():
			for option in tree.nodes[node_id].get("options", []):
				if option.has("check"):
					check(option.has("success") and option.has("failure"),
						"%s/%s check option has both branches" % [tree_id, node_id])


func test_calendar_advances() -> void:
	GameState.new_run("old_school", 12345)
	check(CalendarManager.day == 1, "run starts on day 1")
	CalendarManager.advance_day()
	check(CalendarManager.day == 2, "day advances")
	check(GameState.debt > GameState.STARTING_DEBT, "debt ticks interest")
	check(GameState.inventory.get("eggs", 0) > 0, "chickens produce eggs")


func test_reputation_ripple() -> void:
	GameState.new_run("mechanic", 12345)
	var before_hollis := ReputationLedger.get_rep("hollis")
	var before_marge := ReputationLedger.get_rep("marge")
	# Simulate the botched-baler ripple: one event moves MULTIPLE NPCs + county
	ReputationLedger.apply_effects([
		{"op": "rep_delta", "npc": "hollis", "value": -8},
		{"op": "rep_delta", "npc": "marge", "value": -5},
		{"op": "county_delta", "value": -3},
		{"op": "flag_set", "flag": "baler_botched"},
	])
	check(ReputationLedger.get_rep("hollis") == before_hollis - 8, "direct rep delta applies")
	check(ReputationLedger.get_rep("marge") == before_marge - 5, "ripple hits a second NPC")
	check(ReputationLedger.county == -3, "county standing moves")
	check(GameState.has_flag("baler_botched"), "consequence flag set")


func test_field_order_lifecycle() -> void:
	GameState.new_run("it_nephew", 12345)
	var cash_before := GameState.cash
	check(GameState.issue_field_order("north", "hay", "plant"), "field order issues")
	check(GameState.cash < cash_before, "order costs cash")
	check(GameState.fields["north"].state == "working", "field goes to working")
	CalendarManager.advance_day()
	check(GameState.fields["north"].state == "growing", "1-day hay plant completes")
	check(int(GameState.fields["north"].days_to_ready) == 6, "grow time starts at crop grow_days")
	check(not GameState.issue_field_order("north", "hay", "harvest"), "cannot harvest before ready")
	for i in range(6):
		CalendarManager.advance_day()
	check(GameState.fields["north"].state == "ready", "crop matures after grow_days")
	check(GameState.issue_field_order("north", "hay", "harvest"), "harvest allowed when ready")


func test_save_roundtrip() -> void:
	GameState.new_run("old_school", 99)
	GameState.add_cash(555)
	GameState.set_flag("test_flag")
	ReputationLedger.apply_effects([{"op": "rep_delta", "npc": "patti", "value": 7}])
	var cash := GameState.cash
	var patti := ReputationLedger.get_rep("patti")
	check(SaveManager.save_game(9), "save writes")
	GameState.new_run("mechanic", 1)
	check(SaveManager.load_game(9), "save loads")
	check(GameState.cash == cash, "cash round-trips")
	check(GameState.background_id == "old_school", "background round-trips")
	check(GameState.has_flag("test_flag"), "flags round-trip")
	check(ReputationLedger.get_rep("patti") == patti, "reputation round-trips")
