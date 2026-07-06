extends Node
## Day counter, time-of-day blocks, day-advance sequencing.
## Day-advance order matters (GAMEPLAY_SPEC §1).

const RUN_LENGTH_DAYS := 30
const BLOCKS := ["Morning", "Midday", "Evening"]
const WEEKDAYS := ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

var day: int = 1
var block: int = 0


func reset() -> void:
	day = 1
	block = 0


func block_name() -> String:
	return BLOCKS[block]


func weekday_name() -> String:
	return WEEKDAYS[(day - 1) % 7]


func weekday_of(d: int) -> String:
	return WEEKDAYS[(d - 1) % 7]


func spend_block() -> void:
	if block < BLOCKS.size() - 1:
		block += 1
		EventBus.time_block_changed.emit(block)
	else:
		advance_day()


func advance_day() -> void:
	# 1. Crops in the ground grow, then iron wears from the day's work, then
	# field orders progress (growth first so a plant completing today doesn't
	# also grow today; wear before the breakdown roll so today's work counts).
	GameState.tick_growth()
	GameState.tick_equipment_wear()
	GameState.progress_field_orders()
	# 2. Market tick
	EconomyManager.tick()
	# 3. Weather roll for tomorrow
	WeatherManager.roll_next()
	# 4. Loan/debt interest tick
	GameState.tick_debt()
	# 5. Event scheduler: at most one interrupt per day, surfaced as a
	# conversation (design law: interruptions arrive as people, not popups).
	# v1 is deterministic priority order; weighted rolls land in sprint 9.
	_schedule_event()
	# 6. Chicken output
	GameState.add_inventory("eggs", GameState.chickens)
	day += 1
	block = 0
	# 7. Contract deadlines checked against the new day; Gus's hold expires
	GameState.check_contract_deadlines()
	GameState.expire_salvage_offers()
	# 8. Perk proof: each background earns its signature eye on Day 8
	# (full perk trees are sprint 8; this is the unlocks-dialogue proof)
	if day == 8:
		GameState.grant_perk(GameState.background().get("proof_perk", ""))
	# Morning report: diff yesterday's snapshot into today's story, then
	# re-baseline for tomorrow (legibility keystone, 2026-07-06)
	GameState.build_morning_report()
	GameState.snapshot_day()
	EventBus.day_advanced.emit(day)
	EventBus.time_block_changed.emit(block)
	if day > RUN_LENGTH_DAYS:
		EventBus.run_ended.emit(GameState.run_summary())


func _schedule_event() -> void:
	# A machine down in your own field outranks everything — but it now arrives
	# as an immediate popup from the machine (farm_hud auto-opens the breakdown
	# panel on refresh), not a Roy phone call routed through the event system.
	if not GameState.pending_breakdown.is_empty():
		return
	# Higher priority wins the day's single interrupt slot (a storm arriving
	# tomorrow outranks a baler that can wait).
	var events := DataLoader.events.duplicate()
	events.sort_custom(func(a, b): return int(a.get("priority", 0)) > int(b.get("priority", 0)))
	for ev in events:
		var t: Dictionary = ev.get("trigger", {})
		if t.get("once", false) and GameState.has_flag("event_fired_" + ev.get("id", "")):
			continue
		if day < int(t.get("min_day", 1)):
			continue
		if t.has("background") and t.background != GameState.background_id:
			continue
		if t.has("weather_next") and WeatherManager.forecast(1)[0] != t.weather_next:
			continue
		# Morning-contact triggers: the county calls YOU when state warrants
		if t.has("contract_due_in"):
			var due_soon := false
			for c in GameState.contracts_active:
				if int(c.deadline_day) >= day and int(c.deadline_day) - day <= int(t.contract_due_in):
					due_soon = true
			if not due_soon:
				continue
		if t.get("credit_tight", false) and not GameState.credit_tight():
			continue
		if t.has("cooldown_days") and day - int(GameState.event_last.get(ev.get("id", ""), -99)) < int(t.cooldown_days):
			continue
		if t.has("chance") and GameState.event_roll() > float(t.chance):
			continue
		var blocked := false
		for f in t.get("not_flags", []):
			if GameState.has_flag(f):
				blocked = true
		if blocked:
			continue
		# Inline-choice events (no dialogue tree) wait for sprint 9
		var tree: String = ev.get("dialogue_tree", "")
		if tree == "" or not DataLoader.dialogue_trees.has(tree):
			continue
		if t.get("once", false):
			GameState.set_flag("event_fired_" + ev.get("id", ""))
		GameState.event_last[ev.get("id", "")] = day
		if ev.get("action", "") == "salvage_offers":
			GameState.create_salvage_offers()
		EventBus.event_triggered.emit(ev)
		return
