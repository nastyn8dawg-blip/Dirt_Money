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
var pending_breakdown: Dictionary = {}   # {order} — one open breakdown at a time
var _breakdown_rng := RandomNumberGenerator.new()

const STARTING_CASH := 1200
const STARTING_DEBT := 8000
const DEBT_DAILY_INTEREST := 0.004
const CREDIT_TIGHT_COUNTY := -3    # county standing at/below this → bank surcharge
const CREDIT_TIGHT_MULT := 1.25
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
	pending_breakdown = {}
	_breakdown_rng.seed = run_seed + 7
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
	if kind == "plant" and fields[field].state != "fallow":
		return false
	if kind == "harvest" and fields[field].state != "ready":
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
		if order.get("paused", false):
			continue
		# Breakdown roll: the old tractor working in bad weather is how the
		# interruption-as-conversation design earns its keep.
		if pending_breakdown.is_empty():
			var eq: Dictionary = DataLoader.equipment.get("tractor_old", {})
			var chance := float(eq.get("breakdown_base_chance", 0.0))
			if WeatherManager.current in ["storm", "rain_light"]:
				chance *= 2.0
			if _breakdown_rng.randf() < chance:
				order.paused = true
				pending_breakdown = {"order": order}
				continue
		order.days_left -= 1
		if order.days_left <= 0:
			done.append(order)
	for order in done:
		field_orders.erase(order)
		if order.kind == "plant":
			var planted: Dictionary = DataLoader.crops.get(order.crop, {})
			fields[order.field] = {
				"state": "growing", "crop": order.crop,
				"days_to_ready": int(planted.get("grow_days", 1)),
			}
		elif order.kind == "harvest":
			var crop: Dictionary = DataLoader.crops.get(order.crop, {})
			add_inventory(order.crop, int(crop.get("base_yield_units", 0)))
			fields[order.field] = {"state": "fallow", "crop": ""}
		EventBus.field_order_completed.emit(order)


func tick_growth() -> void:
	for field_id in fields.keys():
		var f: Dictionary = fields[field_id]
		if f.state == "growing":
			f.days_to_ready = int(f.get("days_to_ready", 1)) - 1
			if f.days_to_ready <= 0:
				f.state = "ready"


func credit_tight() -> bool:
	# County memory reaching the bank: public failures tighten credit.
	return ReputationLedger.county <= CREDIT_TIGHT_COUNTY


func tick_debt() -> void:
	if debt > 0:
		var rate := DEBT_DAILY_INTEREST
		if credit_tight():
			rate *= CREDIT_TIGHT_MULT
		debt += int(ceil(debt * rate))
		EventBus.money_changed.emit(cash, debt)


func resolve_breakdown(mode: String) -> void:
	var order: Dictionary = pending_breakdown.get("order", {})
	if not order.is_empty():
		match mode:
			"resume":
				order.paused = false
			"wait":
				# It sits: the machine gets looked at eventually, the work
				# loses two days, and the weather keeps its opinions.
				order.paused = false
				order.days_left = int(order.days_left) + 2
	pending_breakdown = {}


func find_contract_template(contract_id: String) -> Dictionary:
	for c in DataLoader.contracts:
		if c.get("id", "") == contract_id:
			return c
	return {}


func active_contract(contract_id: String) -> Dictionary:
	for c in contracts_active:
		if c.get("id", "") == contract_id:
			return c
	return {}


func accept_contract(contract_id: String) -> bool:
	# v1: delivery/legacy only — supply, repair, and favor contracts resolve
	# through conversation flows landing in sprints 6-7.
	var tpl := find_contract_template(contract_id)
	if tpl.is_empty() or not tpl.get("type", "") in ["delivery", "legacy"]:
		return false
	if not active_contract(contract_id).is_empty():
		return false
	var terms: Dictionary = tpl.get("terms", {})
	contracts_active.append({
		"id": contract_id,
		"offered_by": tpl.get("offered_by", ""),
		"commodity": terms.get("commodity", ""),
		"units": int(terms.get("units", 0)),
		"rate_mult": float(terms.get("rate_mult", 1.0)),
		"penalty": int(terms.get("penalty", 0)),
		"accepted_day": CalendarManager.day,
		"deadline_day": CalendarManager.day + int(terms.get("deadline_days", 7)),
	})
	set_flag("contract_accepted")
	EventBus.contract_accepted.emit(contract_id)
	return true


func deliver_contract(contract_id: String) -> bool:
	var c := active_contract(contract_id)
	if c.is_empty():
		return false
	if inventory.get(c.commodity, 0) < c.units:
		return false
	inventory[c.commodity] -= c.units
	var payout := int(round(c.units * EconomyManager.prices.get(c.commodity, 0.0) * c.rate_mult))
	add_cash(payout)
	contracts_completed += 1
	contracts_active.erase(c)
	ReputationLedger.apply_effects([
		{"op": "rep_delta", "npc": c.offered_by, "value": 5},
		{"op": "county_delta", "value": 1},
		{"op": "flag_set", "flag": "contract_delivered"},
	])
	EventBus.contract_delivered.emit(contract_id)
	return true


func check_contract_deadlines() -> void:
	# A missed handshake is county memory: penalty, reputation, gossip flag.
	var missed: Array = []
	for c in contracts_active:
		if CalendarManager.day > int(c.deadline_day):
			missed.append(c)
	for c in missed:
		contracts_active.erase(c)
		cash -= int(c.penalty)
		ReputationLedger.apply_effects([
			{"op": "rep_delta", "npc": c.offered_by, "value": -6},
			{"op": "county_delta", "value": -2},
			{"op": "flag_set", "flag": "contract_missed"},
		])
		EventBus.money_changed.emit(cash, debt)
		EventBus.contract_missed.emit(c.id)


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
