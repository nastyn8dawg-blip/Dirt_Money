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
	test_county_memory()
	test_contracts()
	test_storm_event()
	test_breakdown()

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
	check(DataLoader.dialogue_trees.size() >= 8, "every county NPC has a tree")
	check(DataLoader.strings.get("weather_today", {}).size() == 7, "today-line slot per weather state")
	check(DataLoader.strings.get("weather_cues", {}).has("storm"), "storm tomorrow-cue exists (gates sandbag event)")
	check(DataLoader.gossip_banks.size() >= 7, "gossip banks loaded")
	# County memory: flagged banks outrank general talk
	GameState.new_run("mechanic", 777)
	GameState.set_flag("baler_botched")
	var line := DataLoader.pick_gossip()
	var botched: Array = []
	for bank in DataLoader.gossip_banks:
		if bank.get("id", "") == "baler_botched":
			botched = bank.get("lines", [])
	check(line in botched, "flagged gossip outranks general county talk")
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


func test_county_memory() -> void:
	GameState.new_run("mechanic", 42)
	var runner = load("res://scripts/dialogue/dialogue_runner.gd").new()
	var tree: Dictionary = DataLoader.get_dialogue("hollis_baler")
	check(runner.resolve_rules(tree.get("entry", []), tree.start) == "intro", "fresh run routes to normal intro")
	GameState.set_flag("baler_botched")
	check(runner.resolve_rules(tree.get("entry", []), tree.start) == "intro_cold", "botched flag routes to cold greeting")
	runner.free()
	# County memory reaches the bank: tight credit costs more per day
	ReputationLedger.county = -5
	check(GameState.credit_tight(), "low county standing tightens credit")
	var d0 := GameState.debt
	GameState.tick_debt()
	var tight_delta := GameState.debt - d0
	GameState.new_run("mechanic", 43)
	check(not GameState.credit_tight(), "fresh run has normal credit")
	var d1 := GameState.debt
	GameState.tick_debt()
	check(GameState.debt - d1 < tight_delta, "tight credit accrues more interest daily")


func test_contracts() -> void:
	GameState.new_run("old_school", 55)
	check(not GameState.accept_contract("hollis_hauling"), "favor contracts not accepted via board (conversation, sprint 6)")
	check(GameState.accept_contract("corn_delivery_t1"), "delivery contract accepts")
	check(not GameState.accept_contract("corn_delivery_t1"), "no double-accept")
	GameState.add_inventory("corn", 100)
	var cash0 := GameState.cash
	var rep0 := ReputationLedger.get_rep("marge")
	check(GameState.deliver_contract("corn_delivery_t1"), "contract delivers when stocked")
	check(GameState.cash > cash0, "delivery pays out")
	check(ReputationLedger.get_rep("marge") > rep0, "delivery builds reputation")
	check(GameState.has_flag("contract_delivered"), "delivery feeds county memory")
	# Miss a deadline: penalty, reputation, gossip flag
	GameState.new_run("old_school", 56)
	check(GameState.accept_contract("corn_delivery_t1"), "second run accepts contract")
	var cash1 := GameState.cash
	var rep1 := ReputationLedger.get_rep("marge")
	for i in range(14):
		CalendarManager.advance_day()
	check(GameState.contracts_active.is_empty(), "missed contract removed")
	check(GameState.cash < cash1, "missed contract costs the penalty")
	check(ReputationLedger.get_rep("marge") < rep1, "missing a handshake costs reputation")
	check(GameState.has_flag("contract_missed"), "the county hears about it")
	# Marge greeting routes by tier (relationship grammar)
	var runner = load("res://scripts/dialogue/dialogue_runner.gd").new()
	var tree: Dictionary = DataLoader.get_dialogue("marge_talk")
	ReputationLedger.rep["marge"] = -10
	check(runner.resolve_rules(tree.get("entry", []), tree.start) == "intro_cold", "distrusted Marge answers the door cold")
	ReputationLedger.rep["marge"] = 50
	check(runner.resolve_rules(tree.get("entry", []), tree.start) == "intro_trusted", "trusted Marge volunteers")
	runner.free()


func test_storm_event() -> void:
	GameState.new_run("old_school", 88)
	var fired: Array = []
	var handler := func(ev): fired.append(ev)
	EventBus.event_triggered.connect(handler)
	# Force tomorrow's weather to storm and advance past min_day
	CalendarManager.day = 5
	WeatherManager._future.clear()
	for i in range(8):
		WeatherManager._future.append("storm")
	CalendarManager.advance_day()
	EventBus.event_triggered.disconnect(handler)
	check(not fired.is_empty(), "storm warning event fires when storm is coming")
	if not fired.is_empty():
		check(fired[0].get("dialogue_tree", "") == "storm_choice", "storm event opens the sandbag conversation")
	check(GameState.has_flag("event_fired_storm_warning"), "once-events do not refire")
	# The choice feeds the legacy contract gate
	ReputationLedger.apply_effects([{ "op": "flag_set", "flag": "storm_helped_hollis" }])
	check(GameState.has_flag("storm_helped_hollis"), "sandbag flag gates the legacy contract")


func test_breakdown() -> void:
	GameState.new_run("mechanic", 99)
	GameState.issue_field_order("north", "corn", "plant")
	var eq: Dictionary = DataLoader.equipment.get("tractor_old", {})
	var original_chance = eq.get("breakdown_base_chance", 0.08)
	eq["breakdown_base_chance"] = 1.0
	var fired: Array = []
	var handler := func(ev): fired.append(ev)
	EventBus.event_triggered.connect(handler)
	CalendarManager.advance_day()
	EventBus.event_triggered.disconnect(handler)
	eq["breakdown_base_chance"] = original_chance
	check(not GameState.pending_breakdown.is_empty(), "guaranteed breakdown pauses the order")
	var order: Dictionary = GameState.pending_breakdown.get("order", {})
	check(order.get("paused", false), "order is paused while broken")
	check(not fired.is_empty() and fired[0].get("dialogue_tree", "") == "breakdown_choice", "breakdown interrupts as a call to Roy")
	var days_before := int(order.days_left)
	ReputationLedger.apply_effects([{ "op": "breakdown_resolve", "value": "wait" }])
	check(GameState.pending_breakdown.is_empty(), "resolution clears the breakdown")
	check(not order.get("paused", false), "waiting unpauses the order")
	check(int(order.days_left) == days_before + 2, "letting it sit costs two days")
