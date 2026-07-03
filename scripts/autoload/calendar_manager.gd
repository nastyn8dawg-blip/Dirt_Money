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
	# 5. Event scheduler (stub: sprint 9 wires the full interrupt picker)
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
