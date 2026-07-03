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
	# 1. Crops in the ground grow, then field orders progress
	# (growth first so a plant completing today doesn't also grow today)
	GameState.tick_growth()
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
	# 7. Contract deadlines checked against the new day
	GameState.check_contract_deadlines()
	EventBus.day_advanced.emit(day)
	EventBus.time_block_changed.emit(block)
	if day > RUN_LENGTH_DAYS:
		EventBus.run_ended.emit(GameState.run_summary())


func _schedule_event() -> void:
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
		EventBus.event_triggered.emit(ev)
		return
