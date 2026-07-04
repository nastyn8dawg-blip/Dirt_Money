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
	test_endings()
	test_one_cycle_season()
	test_repair_contracts()
	test_salvage_flip()
	test_it_identity()
	test_perks_and_history()
	test_field_care()
	test_morning_contacts()
	test_harvest_on_credit()

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
	# old_school: no greenhorn rolls to muddy generic order mechanics
	GameState.new_run("old_school", 12345)
	var cash_before := GameState.cash
	check(GameState.issue_field_order("north", "hay", "plant"), "field order issues")
	check(GameState.cash < cash_before, "order costs cash")
	check(GameState.fields["north"].state == "working", "field goes to working")
	CalendarManager.advance_day()
	if not GameState.pending_breakdown.is_empty():
		ReputationLedger.apply_effects([{ "op": "breakdown_resolve", "value": "resume" }])
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
	for i in range(20):
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


func test_endings() -> void:
	GameState.new_run("mechanic", 111)
	check(DataLoader.endings.size() >= 5, "ending table loaded")
	# Fallback when nothing's proven (mechanic starts at county 0;
	# old_school starts at 10 - inherited goodwill must not trigger verdicts)
	check(DataLoader.pick_ending().get("id", "") == "still_standing", "fresh run gets the fallback verdict")
	GameState.new_run("old_school", 115)
	check(DataLoader.pick_ending().get("id", "") == "still_standing", "inherited goodwill alone earns no verdict")
	# Missed handshakes + sour county = the county stopped calling
	GameState.set_flag("contract_missed")
	ReputationLedger.county = -4
	check(DataLoader.pick_ending().get("id", "") == "word_is_no_good", "broken word ending wins")
	# Dependable: delivered handshakes + county respect
	GameState.new_run("old_school", 112)
	GameState.contracts_completed = 3
	ReputationLedger.county = 6
	check(DataLoader.pick_ending().get("id", "") == "dependable", "dependable ending wins")
	# Rich but cold: the resentment thread's first surface
	GameState.new_run("mechanic", 113)
	GameState.cash = 5000
	ReputationLedger.county = 0
	check(DataLoader.pick_ending().get("id", "") == "solvent_stranger", "solvent stranger ending wins")


func test_one_cycle_season() -> void:
	GameState.new_run("old_school", 200)
	CalendarManager.day = 7
	check(not GameState.issue_field_order("north", "corn", "plant"), "corn window closes Day 6")
	check(GameState.issue_field_order("north", "soybeans", "plant"), "soy window still open Day 7")
	CalendarManager.day = 19
	check(not GameState.issue_field_order("south", "hay", "plant"), "hay window closes Day 18")
	# Hay: multi-cut capped, no infinite loop
	GameState.new_run("old_school", 201)
	GameState.issue_field_order("east", "hay", "plant")
	var cuts := 0
	for i in range(30):
		CalendarManager.advance_day()
		if not GameState.pending_breakdown.is_empty():
			ReputationLedger.apply_effects([{ "op": "breakdown_resolve", "value": "resume" }])
		if GameState.fields["east"].state == "ready":
			GameState.issue_field_order("east", "hay", "harvest")
			cuts += 1
	check(cuts == 3, "hay gives exactly max_harvests cuts (got %d)" % cuts)
	check(GameState.fields["east"].state == "fallow", "hay field retires after final cut")


func test_repair_contracts() -> void:
	GameState.new_run("mechanic", 202)
	check(not GameState.accept_contract("baler_repair"), "repair pipeline locked until the baler story")
	GameState.set_flag("baler_fixed")
	check(GameState.accept_contract("baler_repair"), "repair contract accepts for mechanic")
	GameState.new_run("old_school", 203)
	GameState.set_flag("baler_fixed")
	check(not GameState.accept_contract("baler_repair"), "repair contract refuses non-mechanic")
	GameState.new_run("mechanic", 204)
	GameState.set_flag("baler_fixed")
	GameState.accept_contract("baler_repair")
	var earned_before := int(GameState.ledger.get("repair_salvage_revenue", 0))
	var worked := 0
	while not GameState.active_contract("baler_repair").is_empty() and worked < 10:
		GameState.work_repair_job()
		worked += 1
	check(worked == 3, "three jobs complete the contract (worked %d)" % worked)
	check(GameState.contracts_completed == 1, "repair contract counts as a kept handshake")
	check(GameState.has_flag("repair_contract_done"), "county hears the wrench")
	check(int(GameState.ledger.get("repair_salvage_revenue", 0)) > earned_before, "wrench income lands in its own ledger line")


func test_salvage_flip() -> void:
	GameState.new_run("mechanic", 300)
	CalendarManager.day = 6
	GameState.create_salvage_offers()
	check(GameState.salvage_offers.size() == 2, "two deals on the lot")
	var hold: int = GameState.salvage_offers[0].hold_until_day
	check(CalendarManager.weekday_of(hold) == "Friday", "Gus holds until Friday")
	check(GameState.buy_salvage("hay_rake"), "rake purchase goes through")
	check(int(GameState.ledger.get("salvage_purchase_cost", 0)) == -400, "purchase categorized")
	var sessions := 0
	while not GameState.salvage_ready_to_sell() and sessions < 12:
		GameState.work_salvage()
		sessions += 1
	check(GameState.salvage_ready_to_sell(), "restoration completes")
	check(int(GameState.ledger.get("parts_cost", 0)) < 0, "parts categorized")
	var sale := GameState.sell_salvage()
	check(sale > 0, "Roy writes a check")
	check(GameState.salvage_projects.is_empty(), "project leaves the shop")
	var net: int = GameState.salvage_stats.sold - GameState.salvage_stats.bought - GameState.salvage_stats.parts
	if net > 0:
		check(GameState.has_flag("gus_respects_eye"), "profitable flip earns Gus's respect")
	else:
		check(GameState.has_flag("salvage_flip_bust"), "losing flip becomes a story")
	# Hold expires: offers vanish after Friday
	GameState.new_run("mechanic", 301)
	CalendarManager.day = 6
	GameState.create_salvage_offers()
	CalendarManager.day = GameState.salvage_offers[0].hold_until_day + 1
	GameState.expire_salvage_offers()
	check(GameState.salvage_offers.is_empty(), "unclaimed machines leave the yard")


func test_it_identity() -> void:
	# The market forecast is honest: tomorrow's shown price IS tomorrow's price
	GameState.new_run("it_nephew", 400)
	var promised := EconomyManager.forecast_price("corn")
	EconomyManager.tick()
	check(is_equal_approx(EconomyManager.prices["corn"], promised), "forecast is a real look at the future")
	# Greenhorn mistakes: guaranteed roll delays the plant and costs a redo
	var bg: Dictionary = DataLoader.backgrounds["it_nephew"]
	var original = bg.get("greenhorn_mistake_chance", 0.35)
	bg["greenhorn_mistake_chance"] = 1.0
	GameState.new_run("it_nephew", 401)
	GameState.issue_field_order("north", "corn", "plant")
	for i in range(5):
		CalendarManager.advance_day()
		if not GameState.pending_breakdown.is_empty():
			ReputationLedger.apply_effects([{ "op": "breakdown_resolve", "value": "resume" }])
		if GameState.has_flag("greenhorn_mistake"):
			break
	check(GameState.has_flag("greenhorn_mistake"), "guaranteed greenhorn mistake fires")
	check(int(GameState.ledger.get("greenhorn_costs", 0)) < 0, "redo cost lands in its own ledger line")
	bg["greenhorn_mistake_chance"] = original
	# Old School never fumbles a planter
	GameState.new_run("old_school", 402)
	GameState.issue_field_order("north", "corn", "plant")
	for i in range(3):
		CalendarManager.advance_day()
		if not GameState.pending_breakdown.is_empty():
			ReputationLedger.apply_effects([{ "op": "breakdown_resolve", "value": "resume" }])
	check(int(GameState.ledger.get("greenhorn_costs", 0)) == 0, "no greenhorn costs for a lifer")


func test_perks_and_history() -> void:
	# Proof perk lands on Day 8 and gates a conversation path
	GameState.new_run("mechanic", 500)
	check(not GameState.has_perk("diagnostics_1"), "no perks at start")
	while CalendarManager.day < 8:
		CalendarManager.advance_day()
		if not GameState.pending_breakdown.is_empty():
			ReputationLedger.apply_effects([{ "op": "breakdown_resolve", "value": "resume" }])
	check(GameState.has_perk("diagnostics_1"), "proof perk granted Day 8")
	var roy_tree: Dictionary = DataLoader.get_dialogue("roy_talk")
	var found_perk_option := false
	for option in roy_tree.nodes.intro.get("options", []):
		if option.get("requires", {}).get("perk", "") == "diagnostics_1":
			found_perk_option = true
	check(found_perk_option, "perk unlocks a conversation path, not a bonus")
	# Run history round-trips with the comparison fields
	var summary := GameState.run_summary()
	check(summary.has("ending_title") and summary.has("strongest_income") and summary.has("largest_mistake"), "summary carries comparison fields")
	var before := SaveManager.load_run_history().size()
	SaveManager.record_run(summary)
	var after := SaveManager.load_run_history()
	check(after.size() == before + 1, "run recorded to history")
	check(after.back().get("background", "") == "mechanic", "history preserves the run")


func test_field_care() -> void:
	GameState.new_run("old_school", 600)
	check(GameState.field_action("north", "till"), "till works on empty field")
	check(GameState.fields["north"].tilled, "till marks the field")
	check(GameState.field_action("north", "soil_test"), "soil test works")
	check(GameState.fields["north"].tested, "soil test reveals fertility")
	GameState.issue_field_order("north", "corn", "plant")
	check(not GameState.field_action("north", "till"), "cannot till a working field")
	# Simulate mid-growth care and its yield math
	var f: Dictionary = GameState.fields["north"]
	f.state = "growing"
	f.days_to_ready = 5
	f.weeds = 60
	check(GameState.field_action("north", "scout"), "scouting a growing field")
	var dirty_yield := GameState.field_yield_units(f)
	check(GameState.field_action("north", "treat"), "treating weeds")
	check(int(f.weeds) == 0, "treatment clears pressure")
	check(GameState.field_yield_units(f) > dirty_yield, "clean field out-yields weedy field")
	check(GameState.field_action("north", "fertilize"), "fertilizing")
	var boosted := GameState.field_yield_units(f)
	f.stressed = true
	check(GameState.field_yield_units(f) < boosted, "storm stress costs yield")
	check(GameState.field_action("north", "repair_field"), "repairing storm damage")
	check(not f.stressed, "repair clears stress")
	# Late-season: cover crop instead of default hay
	GameState.new_run("old_school", 601)
	CalendarManager.day = 20
	check(not GameState.issue_field_order("south", "hay", "plant"), "hay window closed Day 20")
	check(GameState.field_action("south", "cover_crop"), "cover crop is the late-season answer")
	check(GameState.fields["south"].state == "cover", "field carries the cover crop")


func test_morning_contacts() -> void:
	GameState.new_run("mechanic", 700)
	GameState.set_flag("baler_fixed")   # keeps the baler event from claiming the slot
	ReputationLedger.county = -5        # credit tight
	CalendarManager.day = 3
	var fired: Array = []
	var handler := func(ev): fired.append(ev.get("id", ""))
	EventBus.event_triggered.connect(handler)
	CalendarManager.advance_day()
	EventBus.event_triggered.disconnect(handler)
	check("earl_credit_notice" in fired, "the bank notice arrives when credit tightens")
	# Deadline reminder fires when a handshake is due within 2 days
	GameState.new_run("old_school", 701)
	GameState.set_flag("event_fired_baler_breakdown_hollis")
	GameState.set_flag("event_fired_storm_warning")   # keep the slot free
	GameState.accept_contract("corn_delivery_t1")
	CalendarManager.day = int(GameState.contracts_active[0].deadline_day) - 2
	fired.clear()
	EventBus.event_triggered.connect(handler)
	CalendarManager.advance_day()
	EventBus.event_triggered.disconnect(handler)
	check("marge_deadline_call" in fired, "Marge calls before the deadline lands")


func test_harvest_on_credit() -> void:
	# Director ruling 2026-07-04: a ready crop is never lost to a thin wallet
	# unless credit has truly collapsed.
	GameState.new_run("old_school", 800)
	var f: Dictionary = GameState.fields["north"]
	f.state = "ready"
	f.crop = "hay"
	GameState.cash = -54
	var debt0 := GameState.debt
	check(not GameState.issue_field_order("north", "hay", "harvest"), "broke harvest still blocked without asking for credit")
	check(GameState.issue_field_order("north", "hay", "harvest", true), "harvest goes on the note when cash is short")
	check(GameState.debt == debt0 + 80, "harvest cost lands on debt, no fee at normal standing")
	check(GameState.cash == -54, "cash untouched when financed")
	check(int(GameState.ledger.get("orders_financed", 0)) == -80, "financed order categorized in the ledger")
	check(not GameState.issue_field_order("south", "hay", "plant", true), "planting is never financeable — credit is for revenue work")
	# Tight credit: Earl's terms add a fee
	GameState.new_run("old_school", 801)
	ReputationLedger.county = -5
	var f2: Dictionary = GameState.fields["south"]
	f2.state = "ready"
	f2.crop = "hay"
	GameState.cash = 0
	var debt1 := GameState.debt
	check(GameState.issue_field_order("south", "hay", "harvest", true), "tight credit still allows the harvest")
	check(GameState.debt == debt1 + 80 + 8, "tight credit adds Earl's fee to the note")
	check(int(GameState.ledger.get("financing_fees", 0)) == -8, "fee categorized separately")
	# Collapsed credit: the note has a ceiling
	GameState.new_run("old_school", 802)
	GameState.debt = GameState.CREDIT_LIMIT
	var f3: Dictionary = GameState.fields["east"]
	f3.state = "ready"
	f3.crop = "hay"
	GameState.cash = 0
	check(not GameState.can_finance(80), "maxed note leaves no credit room")
	check(not GameState.issue_field_order("east", "hay", "harvest", true), "maxed note refuses new credit")
