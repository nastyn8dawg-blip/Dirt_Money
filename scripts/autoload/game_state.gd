extends Node
## Run state: background, cash, debt, inventory, flags, field orders.
## Numbers are placeholders until the Phase 0 economy spreadsheet locks them.

var background_id: String = ""
var cash: int = 0
var debt: int = 0
var run_seed: int = 0
var inventory: Dictionary = {}   # commodity_id -> units
var flags: Dictionary = {}       # flag name -> true
var field_orders: Array = []     # {field, crop, kind, days_left, cost}
var fields: Dictionary = {}      # field_id -> {state, crop}
var chickens: int = 12
var contracts_active: Array = []
var contracts_completed: int = 0
var perks: Array = []

const STARTING_CASH := 1200
const STARTING_DEBT := 8000
const DEBT_DAILY_INTEREST := 0.004
const FIELD_IDS := ["north", "south", "east"]


func new_run(bg_id: String, seed_value: int = 0) -> void:
	background_id = bg_id
	cash = STARTING_CASH
	debt = STARTING_DEBT
	run_seed = seed_value if seed_value != 0 else randi()
	inventory = {}
	flags = {}
	field_orders = []
	fields = {}
	for f in FIELD_IDS:
		fields[f] = {"state": "fallow", "crop": ""}
	chickens = 12
	contracts_active = []
	contracts_completed = 0
	perks = []
	ReputationLedger.init_from_background(bg_id)
	CalendarManager.reset()
	WeatherManager.reset(run_seed)
	EconomyManager.reset(run_seed)
	EventBus.game_started.emit(bg_id)
	EventBus.money_changed.emit(cash, debt)


func background() -> Dictionary:
	return DataLoader.get_background(background_id)


func interface_flag(key: String, default_value = false):
	return background().get("interface", {}).get(key, default_value)


func add_cash(amount: int) -> void:
	cash += amount
	EventBus.money_changed.emit(cash, debt)


func add_inventory(commodity: String, units: int) -> void:
	inventory[commodity] = inventory.get(commodity, 0) + units


func set_flag(flag: String) -> void:
	flags[flag] = true


func has_flag(flag: String) -> bool:
	return flags.get(flag, false)


func issue_field_order(field: String, crop_id: String, kind: String) -> bool:
	var crop: Dictionary = DataLoader.crops.get(crop_id, {})
	if crop.is_empty() or not fields.has(field):
		return false
	var order_info: Dictionary = crop.get(kind + "_order", {})
	var cost := int(order_info.get("cost", 0))
	if cash < cost:
		return false
	cash -= cost
	var order := {
		"field": field, "crop": crop_id, "kind": kind,
		"days_left": int(order_info.get("days", 1)), "cost": cost,
	}
	field_orders.append(order)
	fields[field] = {"state": "working", "crop": crop_id}
	EventBus.money_changed.emit(cash, debt)
	EventBus.field_order_issued.emit(order)
	return true


func progress_field_orders() -> void:
	var done: Array = []
	for order in field_orders:
		order.days_left -= 1
		if order.days_left <= 0:
			done.append(order)
	for order in done:
		field_orders.erase(order)
		if order.kind == "plant":
			fields[order.field] = {"state": "growing", "crop": order.crop}
		elif order.kind == "harvest":
			var crop: Dictionary = DataLoader.crops.get(order.crop, {})
			add_inventory(order.crop, int(crop.get("base_yield_units", 0)))
			fields[order.field] = {"state": "fallow", "crop": ""}
		EventBus.field_order_completed.emit(order)


func tick_debt() -> void:
	if debt > 0:
		debt += int(ceil(debt * DEBT_DAILY_INTEREST))
		EventBus.money_changed.emit(cash, debt)


func run_summary() -> Dictionary:
	return {
		"background": background_id,
		"day": CalendarManager.day,
		"cash": cash,
		"debt": debt,
		"contracts_completed": contracts_completed,
		"reputation": ReputationLedger.snapshot(),
		"flags": flags.keys(),
	}
