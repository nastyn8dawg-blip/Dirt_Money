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
var contracts_missed: int = 0
var perks: Array = []
var pending_breakdown: Dictionary = {}   # {order} — one open breakdown at a time
var _breakdown_rng := RandomNumberGenerator.new()
# Equipment is owned, mutable state now — not just read-only content. Seeded from
# DataLoader.equipment each run; condition actually changes (wear, breakdowns,
# repairs) and feeds breakdown odds, yield, and work cost. neglect_streak tracks
# "keep running" abuse so ignoring a failure compounds.
var equipment_owned: Dictionary = {}     # eq_id -> {condition:{subsystem->0-100}, neglect_streak:int}

# Diagnostic ledger: every cash movement is categorized at the source so the
# balance harness can separate bad balance from incomplete identity.
var ledger: Dictionary = {}
var harvest_log: Dictionary = {}         # crop -> total units harvested
var downtime_days: int = 0               # working days lost to breakdowns

# Salvage flip loop (Director ruling: judgment, not guaranteed profit)
var salvage_offers: Array = []           # {deal_id, hold_until_day}
var salvage_projects: Array = []         # {deal_id, blocks_done, parts_paid, hidden_hit, extra_blocks}
var salvage_stats := {"bought": 0, "parts": 0, "sold": 0, "blocks": 0, "parts_harvested": 0}
var greenhorn_count: int = 0
var run_recorded: bool = false
var event_last: Dictionary = {}          # event_id -> last day fired (cooldowns)
var _event_rng := RandomNumberGenerator.new()

const STARTING_CASH := 1200
const STARTING_DEBT := 8000
const DEBT_DAILY_INTEREST := 0.004
const CREDIT_TIGHT_COUNTY := -3    # county standing at/below this → bank surcharge
const CREDIT_TIGHT_MULT := 1.25
# Director ruling 2026-07-04: cash shortage is pressure, not a dead end.
# Revenue-critical work (harvest v1) can go on Earl's note — up to a ceiling,
# with worse terms when the county has already tightened credit.
const CREDIT_LIMIT := 12000        # placeholder, DIAGNOSTIC ONLY (freeze)
const FINANCE_FEE_TIGHT := 0.10    # Earl's surcharge on financed work when tight
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
		fields[f] = _fresh_field()
	chickens = 12
	contracts_active = []
	contracts_completed = 0
	contracts_missed = 0
	perks = []
	pending_breakdown = {}
	equipment_owned = {}
	for eq_id in DataLoader.equipment.keys():
		var tmpl: Dictionary = DataLoader.equipment[eq_id]
		equipment_owned[eq_id] = {
			"condition": (tmpl.get("condition", {}) as Dictionary).duplicate(true),
			"neglect_streak": 0,
		}
	_breakdown_rng.seed = run_seed + 7
	ledger = {}
	harvest_log = {}
	downtime_days = 0
	salvage_offers = []
	salvage_projects = []
	salvage_stats = {"bought": 0, "parts": 0, "sold": 0, "blocks": 0, "parts_harvested": 0}
	greenhorn_count = 0
	run_recorded = false
	event_last = {}
	_event_rng.seed = run_seed + 13
	ReputationLedger.init_from_background(bg_id)
	CalendarManager.reset()
	WeatherManager.reset(run_seed)
	EconomyManager.reset(run_seed)
	morning_report = []
	snapshot_day()
	EventBus.game_started.emit(bg_id)
	EventBus.money_changed.emit(cash, debt)


func background() -> Dictionary:
	return DataLoader.get_background(background_id)


func interface_flag(key: String, default_value = false):
	return background().get("interface", {}).get(key, default_value)


func add_cash(amount: int, category: String = "misc") -> void:
	cash += amount
	ledger[category] = int(ledger.get(category, 0)) + amount
	EventBus.money_changed.emit(cash, debt)


func add_inventory(commodity: String, units: int) -> void:
	inventory[commodity] = inventory.get(commodity, 0) + units


func set_flag(flag: String) -> void:
	flags[flag] = true


func has_flag(flag: String) -> bool:
	return flags.get(flag, false)


func can_finish_by_season(crop_id: String, start_day: int) -> bool:
	# Honest calendar (playtest fix 2026-07-06): plant + grow + harvest must all
	# fit before the run ends, or the work is never offered in the first place.
	var crop: Dictionary = DataLoader.crops.get(crop_id, {})
	var need := int(crop.get("plant_order", {}).get("days", 1)) \
		+ int(crop.get("grow_days", 1)) \
		+ int(crop.get("harvest_order", {}).get("days", 1))
	return start_day + need <= CalendarManager.RUN_LENGTH_DAYS


func order_cost(crop_id: String, kind: String) -> int:
	# Single source of truth for what a plant/harvest order costs: the data
	# cost, times the background labor multiplier, times the equipment-condition
	# surcharge. The HUD and the charge must read this same number or the
	# affordability gate drifts from reality (the labor-mult bug, again).
	var crop: Dictionary = DataLoader.crops.get(crop_id, {})
	var order_info: Dictionary = crop.get(kind + "_order", {})
	var eq_id := _equipment_for_field_kind(crop_id, kind)
	return int(round(float(order_info.get("cost", 0))
		* float(background().get("labor_cost_mult", 1.0))
		* _equipment_work_cost_mult(eq_id)))


func issue_field_order(field: String, crop_id: String, kind: String, on_credit: bool = false) -> bool:
	var crop: Dictionary = DataLoader.crops.get(crop_id, {})
	if crop.is_empty() or not fields.has(field):
		return false
	if kind == "plant" and fields[field].state != "fallow":
		return false
	# One-cycle season: planting windows are commitments (Director ruling).
	# Missing the window is a strategic consequence, not a bug.
	if kind == "plant" and CalendarManager.day > int(crop.get("plant_by_day", 30)):
		return false
	# Futility guard (playtest fix 2026-07-06): a plant that can't reach harvest
	# before the season ends is refused, not silently doomed.
	if kind == "plant" and not can_finish_by_season(crop_id, CalendarManager.day):
		return false
	if kind == "harvest" and fields[field].state != "ready":
		return false
	var order_info: Dictionary = crop.get(kind + "_order", {})
	# IT Nephew hires the labor he can't do himself; rough iron adds a surcharge.
	var cost := order_cost(crop_id, kind)
	# Production inputs go on Earl's note (Director ruling 2026-07-06, reversing
	# 2026-07-04's planting-stays-cash): seed, crew, and harvest are all the
	# operating loan's job — that's what an operating note IS. Speculation
	# (salvage, upgrades, comforts) stays cash.
	var financed := on_credit and kind in ["plant", "harvest"] and can_finance(cost)
	if cash < cost and not financed:
		return false
	var base_cost := int(order_info.get("cost", 0))
	if financed:
		var charge := finance_charge(cost)
		debt += charge
		ledger["orders_financed"] = int(ledger.get("orders_financed", 0)) - cost
		if charge > cost:
			ledger["financing_fees"] = int(ledger.get("financing_fees", 0)) - (charge - cost)
	else:
		# Ledger split: base = seed+fuel at data cost; the rest is hired labor
		cash -= cost
		ledger["order_seed_fuel"] = int(ledger.get("order_seed_fuel", 0)) - base_cost
		if cost > base_cost:
			ledger["labor_premium"] = int(ledger.get("labor_premium", 0)) - (cost - base_cost)
	var order := {
		"field": field, "crop": crop_id, "kind": kind,
		"days_left": int(order_info.get("days", 1)), "cost": cost,
		"financed": financed,
	}
	field_orders.append(order)
	fields[field].state = "working"
	fields[field].crop = crop_id
	EventBus.money_changed.emit(cash, debt)
	EventBus.field_order_issued.emit(order)
	return true


func progress_field_orders() -> void:
	var done: Array = []
	for order in field_orders:
		if order.get("paused", false):
			downtime_days += 1
			continue
		# Breakdown roll: the old tractor working in bad weather is how the
		# interruption-as-conversation design earns its keep.
		if pending_breakdown.is_empty():
			var eq_id := _equipment_for_field_kind(order.get("crop", ""), order.get("kind", ""))
			var chance := _breakdown_chance(eq_id)
			if WeatherManager.current in ["storm", "rain_light"]:
				chance = minf(1.0, chance * 2.0)
			if _breakdown_rng.randf() < chance:
				var sev := _roll_breakdown_severity(eq_id)
				var sub: String = _equipment_worst_subsystem(eq_id)[0]
				order.paused = true
				pending_breakdown = {"order": order, "equipment": eq_id, "severity": sev, "subsystem": sub}
				EventBus.breakdown_triggered.emit(eq_id, sev)
				continue
		order.days_left -= 1
		if order.days_left <= 0:
			# Practical incompetence (IT identity): a plant order can go
			# greenhorn-wrong once — redo cost, lost day. Data-driven per
			# background; zero for people who grew up doing this.
			if order.kind == "plant" and not order.get("greenhorn_checked", false):
				order.greenhorn_checked = true
				var gh := float(background().get("greenhorn_mistake_chance", 0.0))
				if gh > 0.0 and _breakdown_rng.randf() < gh:
					order.days_left = int(background().get("greenhorn_delay_days", 1))
					add_cash(-int(background().get("greenhorn_cost", 0)), "greenhorn_costs")
					set_flag("greenhorn_mistake")
					greenhorn_count += 1
					continue
			done.append(order)
	for order in done:
		field_orders.erase(order)
		if order.kind == "plant":
			var planted: Dictionary = DataLoader.crops.get(order.crop, {})
			fields[order.field].state = "growing"
			fields[order.field].days_to_ready = int(planted.get("grow_days", 1))
			fields[order.field].weeds = 0
			fields[order.field].scouted = false
		elif order.kind == "harvest":
			var crop: Dictionary = DataLoader.crops.get(order.crop, {})
			var f: Dictionary = fields[order.field]
			var units := field_yield_units(f)
			add_inventory(order.crop, units)
			harvest_log[order.crop] = int(harvest_log.get(order.crop, 0)) + units
			var cuts := int(f.get("cuts", 0)) + 1
			# Regrow only if the next cut can actually finish (playtest fix
			# 2026-07-06: no more "6 days to ready" on day 26 that can never
			# be harvested — the season's end is honest now).
			var regrow_days := int(crop.get("grow_days", 1)) + int(crop.get("harvest_order", {}).get("days", 1))
			var regrow_fits: bool = CalendarManager.day + regrow_days <= CalendarManager.RUN_LENGTH_DAYS
			if crop.get("multi_cut", false) and cuts < int(crop.get("max_harvests", 1)) and regrow_fits:
				# Hay regrows for another cutting — capped per season; field
				# care resets between cuts, fertility/lime persist
				f.state = "growing"
				f.days_to_ready = int(crop.get("grow_days", 1))
				f.cuts = cuts
				f.weeds = 0
				f.scouted = false
				f.stressed = false
			else:
				var fresh := _fresh_field()
				fresh.fertility = f.get("fertility", 60)
				fresh.limed = f.get("limed", false)
				fields[order.field] = fresh
		EventBus.field_order_completed.emit(order)


func tick_growth() -> void:
	for field_id in fields.keys():
		var f: Dictionary = fields[field_id]
		if f.state == "growing":
			f.days_to_ready = int(f.get("days_to_ready", 1)) - 1
			# The field pushes back: weeds creep daily, bad weather stresses
			f.weeds = mini(100, int(f.get("weeds", 0)) + _breakdown_rng.randi_range(4, 8))
			if WeatherManager.current in ["storm", "drought"]:
				f.stressed = true
				# Remember WHAT hit it — storm and drought read differently
				# in the field (playtest fix: "storm damage" was all one note)
				if not f.has("stress_cause") or f.get("stress_cause", "") == "":
					f.stress_cause = WeatherManager.current
			if f.days_to_ready <= 0:
				f.state = "ready"


func _fresh_field() -> Dictionary:
	return {
		"state": "fallow", "crop": "", "cuts": 0,
		"fertility": 60, "weeds": 0, "stressed": false,
		"tilled": false, "tested": false, "scouted": false,
		"fertilized": false, "limed": false,
	}


# Production inputs Earl's note will carry (Director ruling 2026-07-06)
const FINANCEABLE_ACTIONS := ["fertilize", "treat", "repair_field"]

const FIELD_ACTIONS := {
	# action: [cost, allowed_states]
	"soil_test": [30, ["fallow"]],
	"till": [40, ["fallow"]],
	"soil_prep": [40, ["fallow"]],
	"cover_crop": [50, ["fallow"]],
	"scout": [0, ["growing"]],
	"fertilize": [80, ["growing"]],
	"treat": [60, ["growing"]],
	"repair_field": [20, ["growing"]],
}


func field_action(field_id: String, action: String, on_credit: bool = false) -> bool:
	# Simple versions first (Director): the field needs to feel alive, not deep.
	if not fields.has(field_id) or not FIELD_ACTIONS.has(action):
		return false
	var f: Dictionary = fields[field_id]
	var spec: Array = FIELD_ACTIONS[action]
	var cost := int(spec[0])
	# Financeable ruling (Director 2026-07-06, widening 2026-07-04): production
	# inputs — fertilizer, treatment, emergency repair — all go on the note.
	# "No situation where farmers are not fertilizing." Prep/speculation stays cash.
	var financed := on_credit and action in FINANCEABLE_ACTIONS and can_finance(cost)
	if not f.state in spec[1] or (cash < cost and not financed):
		return false
	if cost > 0:
		if financed:
			var charge := finance_charge(cost)
			debt += charge
			ledger["orders_financed"] = int(ledger.get("orders_financed", 0)) - cost
			if charge > cost:
				ledger["financing_fees"] = int(ledger.get("financing_fees", 0)) - (charge - cost)
			EventBus.money_changed.emit(cash, debt)
		else:
			add_cash(-cost, "field_care")
	match action:
		"soil_test": f.tested = true
		"till": f.tilled = true
		"soil_prep": f.limed = true; f.fertility = mini(100, int(f.fertility) + 10)
		"cover_crop": f.state = "cover"; f.crop = "cover crop"; set_flag("cover_cropped")
		"scout": f.scouted = true
		"fertilize": f.fertilized = true
		"treat": f.weeds = 0; f.scouted = true
		"repair_field": f.stressed = false; f.stress_cause = ""
	return true


func field_stage_name(f: Dictionary) -> String:
	match f.state:
		"fallow": return "prepped" if f.get("tilled", false) else "empty"
		"cover": return "cover crop"
		"working": return "crew working"
		"ready": return "ready"
		"growing":
			if f.get("stressed", false):
				return "stressed"
			var crop: Dictionary = DataLoader.crops.get(f.crop, {})
			var total := int(crop.get("grow_days", 1))
			return "emerged" if int(f.get("days_to_ready", 0)) > total / 2 else "growing"
	return f.state


func field_yield_units(f: Dictionary) -> int:
	var crop: Dictionary = DataLoader.crops.get(f.get("crop", ""), {})
	var units := float(crop.get("base_yield_units", 0))
	if f.get("tilled", false):
		units *= 1.05
	if f.get("fertilized", false):
		units *= 1.10
	if int(f.get("weeds", 0)) > 50:
		units *= 0.80
	if f.get("stressed", false):
		units *= 0.90
	units *= _equipment_condition_factor(_equipment_for_field_kind(f.get("crop", ""), "harvest"))
	return int(round(units))


# --- Equipment condition: the good/better/best gradient made real ---
# These map owned-equipment condition to gameplay. All curves are PLACEHOLDER
# until the Phase 5 economy re-derivation; the shapes are the point, not the
# exact coefficients.

func _equipment_avg_condition(eq_id: String) -> float:
	var owned: Dictionary = equipment_owned.get(eq_id, {})
	var cond: Dictionary = owned.get("condition", {})
	if cond.is_empty():
		return 100.0
	var total := 0.0
	for v in cond.values():
		total += float(v)
	return total / float(cond.size())


func _equipment_worst_subsystem(eq_id: String) -> Array:
	# Returns [subsystem_name, value] of the worst-off subsystem (drives the
	# summary label and which part is most likely to fail next).
	var owned: Dictionary = equipment_owned.get(eq_id, {})
	var cond: Dictionary = owned.get("condition", {})
	var worst := ""
	var worst_v := 101.0
	for k in cond.keys():
		if float(cond[k]) < worst_v:
			worst_v = float(cond[k])
			worst = k
	return [worst, int(worst_v)] if worst != "" else ["", 100]


func equipment_summary_state(eq_id: String) -> String:
	# fine/worn/rough/failing off the worst subsystem, per equipment_meta.
	var worst: int = _equipment_worst_subsystem(eq_id)[1]
	var t: Dictionary = DataLoader.equipment_meta.get("summary_thresholds", {})
	if worst > int(t.get("fine", 60)):
		return "fine"
	if worst > int(t.get("worn", 35)):
		return "worn"
	if worst > int(t.get("rough", 15)):
		return "rough"
	return "failing"


func _equipment_condition_factor(eq_id: String) -> float:
	# Overall wear drag on yield and work cost. Good iron pays a little back;
	# worn iron drags. Catastrophic single-subsystem failure is the breakdown
	# system's job, not this smooth curve. PLACEHOLDER coefficients.
	if eq_id == "" or not equipment_owned.has(eq_id):
		return 1.0
	var avg := _equipment_avg_condition(eq_id)
	# avg 100 -> ~1.15 (capped), 60 -> ~1.0, 30 -> ~0.85, 0 -> 0.70
	return clampf(0.70 + avg * 0.005, 0.60, 1.15)


func _equipment_for_field_kind(crop_id: String, kind: String) -> String:
	# Which machine services this field work. Hay baling leans on the baler;
	# everything else runs off the old tractor. (Truck earns on hauling, wired
	# when hauling contracts land.)
	var crop: Dictionary = DataLoader.crops.get(crop_id, {})
	if kind == "harvest" and crop.get("multi_cut", false):
		return "baler_rusty"
	return "tractor_old"


func _equipment_work_cost_mult(eq_id: String) -> float:
	# Rough iron costs more to run — fuel, babying, extra passes. Roughly the
	# inverse of the yield factor. PLACEHOLDER.
	var f := _equipment_condition_factor(eq_id)   # ~0.60..1.15
	return clampf(2.0 - f, 0.85, 1.40)            # good iron ~0.85x, junk ~1.40x


func _breakdown_chance(eq_id: String) -> float:
	# Worse condition breaks down more; ignoring failures ("keep running")
	# compounds it. Three ignores and the machine picks the moment for you.
	if not equipment_owned.has(eq_id):
		return 0.0
	var eq: Dictionary = DataLoader.equipment.get(eq_id, {})
	var base := float(eq.get("breakdown_base_chance", 0.0))
	var neglect: int = int(equipment_owned[eq_id].get("neglect_streak", 0))
	if neglect >= 3:
		return 1.0   # forced-failure ceiling — you earned this one
	var worst: int = _equipment_worst_subsystem(eq_id)[1]
	var cond_mult := 1.0 + (100.0 - float(worst)) * 0.02   # worst 100 ->1.0, 0 ->3.0
	var neglect_mult := 1.0 + 0.35 * float(neglect)
	return clampf(base * cond_mult * neglect_mult, 0.0, 0.9)


func _roll_breakdown_severity(eq_id: String) -> String:
	# Weighted tier pick; worse condition biases toward the costly end, and a
	# neglected machine's forced failure is always the expensive one.
	var neglect: int = int(equipment_owned.get(eq_id, {}).get("neglect_streak", 0))
	if neglect >= 3:
		return "expensive"
	var worst: int = _equipment_worst_subsystem(eq_id)[1]
	var prof: Dictionary = DataLoader.equipment_meta.get("breakdown_profile", {})
	var cheap_w := float(prof.get("cheap", {}).get("weight", 60))
	var mid_w := float(prof.get("mid", {}).get("weight", 30))
	var exp_w := float(prof.get("expensive", {}).get("weight", 10))
	var bias := clampf((60.0 - float(worst)) * 0.02, 0.0, 2.0)
	exp_w *= (1.0 + bias)
	mid_w *= (1.0 + bias * 0.5)
	var total := cheap_w + mid_w + exp_w
	var r := _breakdown_rng.randf() * total
	if r < cheap_w:
		return "cheap"
	if r < cheap_w + mid_w:
		return "mid"
	return "expensive"


func _repair_subsystem(eq_id: String, sub: String, to_value: int) -> void:
	# Bring a failed part back up. to_value >= 999 means a full, proper fix.
	if sub == "" or not equipment_owned.has(eq_id):
		return
	var cond: Dictionary = equipment_owned[eq_id].get("condition", {})
	if cond.has(sub):
		cond[sub] = 100 if to_value >= 999 else mini(100, maxi(int(cond[sub]), to_value))
		EventBus.equipment_condition_changed.emit(eq_id, sub, int(cond[sub]))


func _damage_subsystem(eq_id: String, sub: String, amount: int) -> void:
	if sub == "" or not equipment_owned.has(eq_id):
		return
	var cond: Dictionary = equipment_owned[eq_id].get("condition", {})
	if cond.has(sub):
		cond[sub] = maxi(0, int(cond[sub]) - amount)
		EventBus.equipment_condition_changed.emit(eq_id, sub, int(cond[sub]))


func tick_equipment_wear() -> void:
	# Work wears iron. Only machines actually running an order today decay, so
	# idle equipment doesn't rot and the player's own usage drives the curve.
	var used := {}
	for order in field_orders:
		if order.get("paused", false):
			continue
		used[_equipment_for_field_kind(order.get("crop", ""), order.get("kind", ""))] = true
	for eq_id in used.keys():
		if not equipment_owned.has(eq_id):
			continue
		var cond: Dictionary = equipment_owned[eq_id].get("condition", {})
		var subs: Array = cond.keys()
		if subs.is_empty():
			continue
		var sub: String = subs[_breakdown_rng.randi_range(0, subs.size() - 1)]
		cond[sub] = maxi(0, int(cond[sub]) - 1)
		EventBus.equipment_condition_changed.emit(eq_id, sub, int(cond[sub]))


func has_salvaged_parts(subsystem: String) -> bool:
	# A restored-but-unsold salvage project can donate a cheap part.
	for i in range(salvage_projects.size()):
		if salvage_ready_to_sell(i):
			var deal := salvage_deal(salvage_projects[i].deal_id)
			if subsystem in deal.get("yields_parts_for", []):
				return true
	return false


func consume_salvaged_part(subsystem: String) -> bool:
	# Strip a restored project for the part instead of selling it — the
	# sell-for-cash vs. keep-for-parts tension the salvage yard was missing.
	for i in range(salvage_projects.size()):
		if salvage_ready_to_sell(i):
			var deal := salvage_deal(salvage_projects[i].deal_id)
			if subsystem in deal.get("yields_parts_for", []):
				salvage_projects.remove_at(i)
				salvage_stats["parts_harvested"] = int(salvage_stats.get("parts_harvested", 0)) + 1
				return true
	return false


func event_roll() -> float:
	return _event_rng.randf()


func credit_tight() -> bool:
	# County memory reaching the bank: public failures tighten credit.
	return ReputationLedger.county <= CREDIT_TIGHT_COUNTY


func credit_room() -> int:
	return maxi(0, CREDIT_LIMIT - debt)


func finance_charge(cost: int) -> int:
	# What actually lands on the note: the cost, plus Earl's fee when credit
	# is already tight. Denial only happens when the note is truly maxed.
	var fee := int(ceil(cost * FINANCE_FEE_TIGHT)) if credit_tight() else 0
	return cost + fee


func can_finance(cost: int) -> bool:
	return finance_charge(cost) <= credit_room()


func tick_debt() -> void:
	if debt > 0:
		var rate := DEBT_DAILY_INTEREST
		if credit_tight():
			rate *= CREDIT_TIGHT_MULT
		var accrued := int(ceil(debt * rate))
		debt += accrued
		ledger["interest_accrued"] = int(ledger.get("interest_accrued", 0)) - accrued
		EventBus.money_changed.emit(cash, debt)


func pay_debt(amount: int) -> int:
	# The missing bridge between cash and debt. Until now the note only grew —
	# you could pile up cash and still "maintain your 8k." This is progress you
	# can feel: every dollar down is interest you never pay again. You can only
	# pay what you have, and only what you owe.
	if amount <= 0 or cash <= 0 or debt <= 0:
		return 0
	var paid := mini(amount, mini(cash, debt))
	if paid <= 0:
		return 0
	cash -= paid
	debt -= paid
	# Debt-side ledger key (like orders_financed / interest_accrued): deleveraging,
	# not an operating cost — kept out of the harness COST_KEYS.
	ledger["debt_paid"] = int(ledger.get("debt_paid", 0)) - paid
	# Milestone flags: the county notices a note getting smaller (gossip banks
	# and Earl's greeting key off these)
	if debt < 6000:
		set_flag("note_under_6000")
	if debt < 4000:
		set_flag("note_under_4000")
	if debt <= 0:
		set_flag("note_cleared")
	EventBus.money_changed.emit(cash, debt)
	return paid


func net_worth() -> int:
	# The number that actually tells the story of a run: cash minus what you
	# still owe. Starts at -6800. A great season should claw toward zero.
	return cash - debt


# ---------- Morning report: the day tells you its story ----------
# (Playtest fix 2026-07-06: pay_debt worked and the Director never noticed.
# Every invisible system gets a voice here, once a day, skimmable.)

var day_snapshot: Dictionary = {}
var morning_report: Array = []   # [{text, tone}] — tone: good/warn/info/muted

# Ledger keys → plain speech for the report. [AI prose — Director curation]
const _LEDGER_SPEECH := {
	"crop_revenue": "Sold crops",
	"livestock_revenue": "Egg money",
	"contract_revenue": "Contract paid out",
	"repair_salvage_revenue": "Shop money in",
	"job_wages": "Day wages",
	"order_seed_fuel": "Seed and fuel",
	"labor_premium": "Hired labor",
	"field_care": "Field work",
	"repair_costs": "Repairs",
	"maintenance_costs": "Shop upkeep",
	"greenhorn_costs": "Greenhorn mistakes",
	"penalties": "Penalties",
	"travel_fuel": "Road fuel",
	"salvage_purchase_cost": "Salvage bought",
	"parts_cost": "Parts",
	"item_costs": "Supplies",
	"equipment_purchase": "Iron bought",
	"equipment_trade_in": "Trade-in credit",
}


func snapshot_day() -> void:
	var eq_states := {}
	for eq_id in equipment_owned.keys():
		eq_states[eq_id] = equipment_summary_state(eq_id)
	day_snapshot = {
		"ledger": ledger.duplicate(true),
		"cash": cash,
		"debt": debt,
		"eq_states": eq_states,
	}


func build_morning_report() -> void:
	morning_report = []
	if day_snapshot.is_empty():
		return
	var prev_ledger: Dictionary = day_snapshot.get("ledger", {})
	# Money that moved yesterday, in plain speech
	for k in _LEDGER_SPEECH.keys():
		var delta: int = int(ledger.get(k, 0)) - int(prev_ledger.get(k, 0))
		if delta == 0:
			continue
		if delta > 0:
			morning_report.append({"text": "%s — +$%d" % [_LEDGER_SPEECH[k], delta], "tone": "good"})
		else:
			morning_report.append({"text": "%s — $%d" % [_LEDGER_SPEECH[k], delta], "tone": "info"})
	var financed_delta: int = int(ledger.get("orders_financed", 0)) - int(prev_ledger.get("orders_financed", 0))
	if financed_delta < 0:
		morning_report.append({"text": "Put on the note — $%d" % -financed_delta, "tone": "warn"})
	var interest: int = int(ledger.get("interest_accrued", 0)) - int(prev_ledger.get("interest_accrued", 0))
	if interest < 0:
		morning_report.append({"text": "Interest crept — $%d onto the note" % -interest, "tone": "muted"})
	var paid: int = int(ledger.get("debt_paid", 0)) - int(prev_ledger.get("debt_paid", 0))
	if paid < 0:
		morning_report.append({"text": "Note paid down — $%d. It shows." % -paid, "tone": "good"})
	# The fields, one line each
	for field_id in fields.keys():
		var f: Dictionary = fields[field_id]
		match f.get("state", ""):
			"ready":
				morning_report.append({"text": "%s %s is READY." % [field_id.to_upper(), f.get("crop", "")], "tone": "good"})
			"growing":
				if f.get("stressed", false):
					var cause: String = f.get("stress_cause", "storm")
					var label: String = DataLoader.strings.get("field_stress", {}).get(cause, {}).get("label", "weather-hit")
					morning_report.append({"text": "%s field is %s — it's costing yield." % [field_id.capitalize(), label], "tone": "warn"})
				else:
					morning_report.append({"text": "%s %s — %d day(s) out." % [field_id.capitalize(), f.get("crop", ""), int(f.get("days_to_ready", 0))], "tone": "muted"})
	# Iron that changed for the worse (or better)
	var prev_eq: Dictionary = day_snapshot.get("eq_states", {})
	for eq_id in equipment_owned.keys():
		var now := equipment_summary_state(eq_id)
		var before: String = prev_eq.get(eq_id, now)
		if now != before:
			var eq_name: String = DataLoader.equipment.get(eq_id, {}).get("name", eq_id)
			morning_report.append({"text": "%s slipped from %s to %s." % [eq_name, before, now],
				"tone": "warn" if now in ["rough", "failing"] else "info"})
	# Warnings worth waking up to
	for c in contracts_active:
		var days_left: int = int(c.get("deadline_day", 99)) - CalendarManager.day
		if days_left >= 0 and days_left <= 2:
			morning_report.append({"text": "Contract due %s (Day %d) — %d %s to Marge's window." % [
				CalendarManager.weekday_of(int(c.deadline_day)), int(c.deadline_day),
				days_left, "day" if days_left == 1 else "days"], "tone": "warn"})
	for crop_id in DataLoader.crops.keys():
		var crop: Dictionary = DataLoader.crops[crop_id]
		var window_left: int = int(crop.get("plant_by_day", 30)) - CalendarManager.day
		if window_left >= 0 and window_left <= 2 and can_finish_by_season(crop_id, CalendarManager.day):
			for field_id in fields.keys():
				if fields[field_id].get("state", "") == "fallow":
					morning_report.append({"text": "%s window closes Day %d — you've got ground open." % [
						str(crop.get("name", crop_id)).capitalize(), int(crop.get("plant_by_day", 30))], "tone": "warn"})
					break
	if credit_tight():
		morning_report.append({"text": "Credit's tight — Earl's watching the county ledger.", "tone": "warn"})
	if morning_report.is_empty():
		morning_report.append({"text": "Quiet morning. They don't come often — use it.", "tone": "muted"})


func resolve_breakdown(mode: String) -> void:
	# The breakdown popup's choices land here. Severity (cheap/mid/expensive)
	# sets the cost, downtime, and condition damage; the player's choice sets
	# who pays and how much it compounds. "resume" stays for the legacy Roy
	# dialogue path (a fix already paid for elsewhere).
	var order: Dictionary = pending_breakdown.get("order", {})
	var eq_id: String = pending_breakdown.get("equipment", "tractor_old")
	var sev_name: String = pending_breakdown.get("severity", "mid")
	var sub: String = pending_breakdown.get("subsystem", "")
	var prof: Dictionary = DataLoader.equipment_meta.get("breakdown_profile", {}).get(sev_name, {})
	var hit := int(prof.get("condition_hit", 10))
	var downtime := int(prof.get("downtime_days", 2))
	match mode:
		"resume":
			# Legacy path: a fix was already handled — get moving, part restored.
			_repair_subsystem(eq_id, sub, 999)
			_reset_neglect(eq_id)
			if not order.is_empty():
				order.paused = false
		"dealer":
			# Call Roy's shop. Costs the most, but it's made right and running today.
			add_cash(-int(prof.get("cost_dealer", 160)), "repair_costs")
			_repair_subsystem(eq_id, sub, 999)
			_reset_neglect(eq_id)
			if not order.is_empty():
				order.paused = false
			ReputationLedger.apply_effects([
				{"op": "rep_delta", "npc": "roy", "value": 1},
				{"op": "flag_set", "flag": "breakdown_paid_shop"},
			])
		"self":
			# Fix it yourself (Mechanic). Cheaper, good-enough field fix.
			add_cash(-int(prof.get("cost_self_parts", 65)), "repair_costs")
			_repair_subsystem(eq_id, sub, 72)
			_reset_neglect(eq_id)
			if not order.is_empty():
				order.paused = false
			ReputationLedger.apply_effects([
				{"op": "rep_delta", "npc": "gus", "value": 1},
				{"op": "flag_set", "flag": "breakdown_fixed_self"},
			])
		"salvage":
			# Strip a restored salvage project for the part. Near-free, no warranty.
			if sub != "" and consume_salvaged_part(sub):
				var iffy := _breakdown_rng.randf() < 0.35
				_repair_subsystem(eq_id, sub, 48 if iffy else 66)
				_reset_neglect(eq_id)
				set_flag("salvage_parts_used")
				if iffy:
					set_flag("salvage_part_iffy")
				if not order.is_empty():
					order.paused = false
			elif not order.is_empty():
				# No usable part after all — it sits.
				_damage_subsystem(eq_id, sub, hit)
				order.paused = false
				order.days_left = int(order.days_left) + downtime
				downtime_days += downtime
		"keep_running":
			# Push it. Work continues now, but the damage compounds and the next
			# failure comes sooner and harder (neglect_streak).
			_damage_subsystem(eq_id, sub, int(round(hit * 1.5)))
			equipment_owned[eq_id]["neglect_streak"] = int(equipment_owned[eq_id].get("neglect_streak", 0)) + 1
			set_flag("breakdown_kept_running")
			if not order.is_empty():
				order.paused = false
		"wait", _:
			# It sits: lose the tier's downtime, and the strain takes some wear.
			_damage_subsystem(eq_id, sub, hit)
			if not order.is_empty():
				order.paused = false
				order.days_left = int(order.days_left) + downtime
				downtime_days += downtime
			set_flag("breakdown_waited")
	pending_breakdown = {}


func _reset_neglect(eq_id: String) -> void:
	if equipment_owned.has(eq_id):
		equipment_owned[eq_id]["neglect_streak"] = 0


func salvage_deal(deal_id: String) -> Dictionary:
	for d in DataLoader.salvage_deals:
		if d.get("id", "") == deal_id:
			return d
	return {}


func create_salvage_offers() -> void:
	# Gus holds machines until Friday. After that, someone else brings a check.
	var wd := (CalendarManager.day - 1) % 7   # 0 = Monday, 4 = Friday
	var delta := (4 - wd + 7) % 7
	if delta < 2:
		delta += 7
	for d in DataLoader.salvage_deals:
		salvage_offers.append({"deal_id": d.id, "hold_until_day": CalendarManager.day + delta})


func expire_salvage_offers() -> void:
	var gone: Array = []
	for o in salvage_offers:
		if CalendarManager.day > int(o.hold_until_day):
			gone.append(o)
	for o in gone:
		salvage_offers.erase(o)


func buy_salvage(deal_id: String) -> bool:
	var deal := salvage_deal(deal_id)
	if deal.is_empty():
		return false
	var offer: Dictionary = {}
	for o in salvage_offers:
		if o.deal_id == deal_id:
			offer = o
	if offer.is_empty() or cash < int(deal.buy_price):
		return false
	salvage_offers.erase(offer)
	add_cash(-int(deal.buy_price), "salvage_purchase_cost")
	salvage_stats.bought += int(deal.buy_price)
	salvage_projects.append({
		"deal_id": deal_id, "blocks_done": 0, "parts_paid": false,
		"hidden_hit": false, "extra_blocks": 0,
	})
	return true


func work_salvage(idx: int = 0) -> Dictionary:
	# One block of shop time. Parts get real on the first session; the
	# painted-over problem (if any) surfaces on the second.
	if idx < 0 or idx >= salvage_projects.size():
		return {}
	var p: Dictionary = salvage_projects[idx]
	var deal := salvage_deal(p.deal_id)
	p.blocks_done = int(p.blocks_done) + 1
	salvage_stats.blocks += 1
	if not p.parts_paid:
		p.parts_paid = true
		add_cash(-int(deal.true_parts_cost), "parts_cost")
		salvage_stats.parts += int(deal.true_parts_cost)
	if int(p.blocks_done) == 2 and not p.hidden_hit:
		if _breakdown_rng.randf() < float(deal.get("hidden_damage_chance", 0.0)):
			p.hidden_hit = true
			p.extra_blocks = 2
			add_cash(-int(deal.get("hidden_damage_cost", 0)), "parts_cost")
			salvage_stats.parts += int(deal.get("hidden_damage_cost", 0))
	return {
		"blocks_done": int(p.blocks_done),
		"blocks_needed": int(deal.restore_blocks) + int(p.extra_blocks),
		"hidden_hit": p.hidden_hit,
	}


func salvage_ready_to_sell(idx: int = 0) -> bool:
	if idx < 0 or idx >= salvage_projects.size():
		return false
	var p: Dictionary = salvage_projects[idx]
	var deal := salvage_deal(p.deal_id)
	return int(p.blocks_done) >= int(deal.restore_blocks) + int(p.extra_blocks)


func roy_pricing_tier() -> Dictionary:
	# How Roy has you filed decides the check he writes.
	if has_flag("roy_marks_you_retail"):
		return {"tier": "retail", "mult": 0.85}
	if has_flag("roy_shows_real_stock") or ReputationLedger.get_rep("roy") >= 20:
		return {"tier": "respect", "mult": 1.15}
	return {"tier": "neutral", "mult": 1.0}


func sell_salvage(idx: int = 0) -> int:
	if not salvage_ready_to_sell(idx):
		return 0
	var p: Dictionary = salvage_projects[idx]
	var deal := salvage_deal(p.deal_id)
	var tier := roy_pricing_tier()
	var sale := int(round(float(deal.base_sale_value) * float(tier.mult)))
	add_cash(sale, "repair_salvage_revenue")
	salvage_stats.sold += sale
	salvage_projects.erase(p)
	var net: int = salvage_stats.sold - salvage_stats.bought - salvage_stats.parts
	if net > 0:
		ReputationLedger.apply_effects([
			{"op": "rep_delta", "npc": "gus", "value": 4},
			{"op": "rep_delta", "npc": "roy", "value": 2},
			{"op": "flag_set", "flag": "salvage_flip_success"},
			{"op": "flag_set", "flag": "gus_respects_eye"},
		])
	else:
		ReputationLedger.apply_effects([
			{"op": "flag_set", "flag": "salvage_flip_bust"},
		])
	return sale


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
	# v1: delivery/legacy/repair — supply and favor contracts resolve
	# through conversation flows landing in sprint 6.
	var tpl := find_contract_template(contract_id)
	var kind: String = tpl.get("type", "")
	if tpl.is_empty() or not kind in ["delivery", "legacy", "repair"]:
		return false
	if kind == "repair" and background_id != "mechanic":
		return false
	if not active_contract(contract_id).is_empty():
		return false
	# Enforce requires here too — the board grays these out, but direct
	# callers (bot, future dialogue effects) must hit the same gates
	var req: Dictionary = tpl.get("requires", {})
	if req.get("background", "") != "" and req.background != background_id:
		return false
	if req.get("flag", "") != "" and not has_flag(req.flag):
		return false
	if ReputationLedger.get_rep(tpl.get("offered_by", "")) < int(req.get("min_reputation", 0)):
		return false
	var terms: Dictionary = tpl.get("terms", {})
	contracts_active.append({
		"id": contract_id,
		"type": kind,
		"offered_by": tpl.get("offered_by", ""),
		"commodity": terms.get("commodity", ""),
		"units": int(terms.get("units", 0)),
		"rate_mult": float(terms.get("rate_mult", 1.0)),
		"jobs_left": int(terms.get("jobs", 0)),
		"pay_per_job": int(terms.get("pay_per_job", 0)),
		"penalty": int(terms.get("penalty", 0)),
		"accepted_day": CalendarManager.day,
		"deadline_day": CalendarManager.day + int(terms.get("deadline_days", 7)),
	})
	set_flag("contract_accepted")
	EventBus.contract_accepted.emit(contract_id)
	return true


func work_repair_job() -> Dictionary:
	# The Mechanic's income identity: a day's wrench work on a co-op member's
	# machine. Returns {} if there's nothing to work.
	if background_id != "mechanic":
		return {}
	for c in contracts_active:
		if c.get("type", "") != "repair" or int(c.get("jobs_left", 0)) <= 0:
			continue
		var success := _breakdown_rng.randf() < 0.8
		if success:
			add_cash(int(c.pay_per_job), "repair_salvage_revenue")
		else:
			# The stubborn one: parts eat the day's pay (still content, not
			# punishment — the county hears you kept at it)
			add_cash(-40, "repair_costs")
		c.jobs_left = int(c.jobs_left) - 1
		if int(c.jobs_left) <= 0:
			contracts_active.erase(c)
			contracts_completed += 1
			ReputationLedger.apply_effects([
				{"op": "rep_delta", "npc": "marge", "value": 4},
				{"op": "county_delta", "value": 1},
				{"op": "flag_set", "flag": "repair_contract_done"},
			])
			EventBus.contract_delivered.emit(c.id)
		return {"success": success, "jobs_left": int(c.get("jobs_left", 0))}
	return {}


func deliver_contract(contract_id: String) -> bool:
	var c := active_contract(contract_id)
	if c.is_empty():
		return false
	if inventory.get(c.commodity, 0) < c.units:
		return false
	inventory[c.commodity] -= c.units
	var payout := int(round(c.units * EconomyManager.prices.get(c.commodity, 0.0) * c.rate_mult))
	add_cash(payout, "contract_revenue")
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
		contracts_missed += 1
		cash -= int(c.penalty)
		ledger["penalties"] = int(ledger.get("penalties", 0)) - int(c.penalty)
		ReputationLedger.apply_effects([
			{"op": "rep_delta", "npc": c.offered_by, "value": -6},
			{"op": "county_delta", "value": -2},
			{"op": "flag_set", "flag": "contract_missed"},
		])
		EventBus.money_changed.emit(cash, debt)
		EventBus.contract_missed.emit(c.id)


func grant_perk(perk_id: String) -> void:
	if not perk_id in perks:
		perks.append(perk_id)


func has_perk(perk_id: String) -> bool:
	return perk_id in perks


func strongest_income() -> String:
	var best := ""
	var best_v := 0
	for k in ["crop_revenue", "contract_revenue", "livestock_revenue", "repair_salvage_revenue"]:
		if int(ledger.get(k, 0)) > best_v:
			best_v = int(ledger.get(k, 0))
			best = k
	return best if best != "" else "none"


func largest_mistake() -> String:
	# Dry factual labels, not voice lines (pending Director review)
	if contracts_missed > 0:
		return "missed %d handshake(s)" % contracts_missed
	if has_flag("baler_botched"):
		return "botched Hollis's baler"
	if has_flag("salvage_flip_bust"):
		return "bought the painted-over problem"
	if has_flag("storm_ignored_hollis"):
		return "left Hollis to the storm"
	if greenhorn_count > 0:
		return "%d greenhorn planting mistake(s)" % greenhorn_count
	return "nothing the county talks about"


func run_summary() -> Dictionary:
	var starting: Dictionary = background().get("starting_reputation", {})
	var vouchers: Array = []
	var cooled: Array = []
	for npc_id in ReputationLedger.rep.keys():
		if ReputationLedger.get_rep(npc_id) >= 20:
			vouchers.append(npc_id)
		if ReputationLedger.get_rep(npc_id) < int(starting.get(npc_id, 0)):
			cooled.append(npc_id)
	return {
		"background": background_id,
		"day": CalendarManager.day,
		"cash": cash,
		"debt": debt,
		"net_worth": net_worth(),
		"contracts_completed": contracts_completed,
		"contracts_missed": contracts_missed,
		"reputation": ReputationLedger.snapshot(),
		"flags": flags.keys(),
		"vouchers": vouchers,
		"cooled": cooled,
		"ending_title": DataLoader.pick_ending().get("title", "?"),
		"gossip_line": DataLoader.pick_gossip(),
		"strongest_income": strongest_income(),
		"largest_mistake": largest_mistake(),
	}
