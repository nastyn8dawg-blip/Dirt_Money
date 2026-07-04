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

# Diagnostic ledger: every cash movement is categorized at the source so the
# balance harness can separate bad balance from incomplete identity.
var ledger: Dictionary = {}
var harvest_log: Dictionary = {}         # crop -> total units harvested
var downtime_days: int = 0               # working days lost to breakdowns

# Salvage flip loop (Director ruling: judgment, not guaranteed profit)
var salvage_offers: Array = []           # {deal_id, hold_until_day}
var salvage_projects: Array = []         # {deal_id, blocks_done, parts_paid, hidden_hit, extra_blocks}
var salvage_stats := {"bought": 0, "parts": 0, "sold": 0, "blocks": 0}
var greenhorn_count: int = 0
var run_recorded: bool = false

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
	contracts_missed = 0
	perks = []
	pending_breakdown = {}
	_breakdown_rng.seed = run_seed + 7
	ledger = {}
	harvest_log = {}
	downtime_days = 0
	salvage_offers = []
	salvage_projects = []
	salvage_stats = {"bought": 0, "parts": 0, "sold": 0, "blocks": 0}
	greenhorn_count = 0
	run_recorded = false
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


func issue_field_order(field: String, crop_id: String, kind: String) -> bool:
	var crop: Dictionary = DataLoader.crops.get(crop_id, {})
	if crop.is_empty() or not fields.has(field):
		return false
	if kind == "plant" and fields[field].state != "fallow":
		return false
	# One-cycle season: planting windows are commitments (Director ruling).
	# Missing the window is a strategic consequence, not a bug.
	if kind == "plant" and CalendarManager.day > int(crop.get("plant_by_day", 30)):
		return false
	if kind == "harvest" and fields[field].state != "ready":
		return false
	var order_info: Dictionary = crop.get(kind + "_order", {})
	# IT Nephew hires the labor he can't do himself (backgrounds.json mult)
	var cost := int(round(float(order_info.get("cost", 0)) * float(background().get("labor_cost_mult", 1.0))))
	if cash < cost:
		return false
	# Ledger split: base = seed+fuel at data cost; the rest is hired labor
	var base_cost := int(order_info.get("cost", 0))
	cash -= cost
	ledger["order_seed_fuel"] = int(ledger.get("order_seed_fuel", 0)) - base_cost
	if cost > base_cost:
		ledger["labor_premium"] = int(ledger.get("labor_premium", 0)) - (cost - base_cost)
	var order := {
		"field": field, "crop": crop_id, "kind": kind,
		"days_left": int(order_info.get("days", 1)), "cost": cost,
	}
	field_orders.append(order)
	fields[field] = {
		"state": "working", "crop": crop_id,
		"cuts": int(fields[field].get("cuts", 0)),
	}
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
			fields[order.field] = {
				"state": "growing", "crop": order.crop,
				"days_to_ready": int(planted.get("grow_days", 1)),
			}
		elif order.kind == "harvest":
			var crop: Dictionary = DataLoader.crops.get(order.crop, {})
			var units := int(crop.get("base_yield_units", 0))
			add_inventory(order.crop, units)
			harvest_log[order.crop] = int(harvest_log.get(order.crop, 0)) + units
			var cuts := int(fields[order.field].get("cuts", 0)) + 1
			if crop.get("multi_cut", false) and cuts < int(crop.get("max_harvests", 1)):
				# Hay regrows for another cutting — capped per season
				fields[order.field] = {
					"state": "growing", "crop": order.crop,
					"days_to_ready": int(crop.get("grow_days", 1)), "cuts": cuts,
				}
			else:
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
		var accrued := int(ceil(debt * rate))
		debt += accrued
		ledger["interest_accrued"] = int(ledger.get("interest_accrued", 0)) - accrued
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
				downtime_days += 2
	pending_breakdown = {}


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


func work_salvage() -> Dictionary:
	# One block of shop time. Parts get real on the first session; the
	# painted-over problem (if any) surfaces on the second.
	if salvage_projects.is_empty():
		return {}
	var p: Dictionary = salvage_projects[0]
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


func salvage_ready_to_sell() -> bool:
	if salvage_projects.is_empty():
		return false
	var p: Dictionary = salvage_projects[0]
	var deal := salvage_deal(p.deal_id)
	return int(p.blocks_done) >= int(deal.restore_blocks) + int(p.extra_blocks)


func roy_pricing_tier() -> Dictionary:
	# How Roy has you filed decides the check he writes.
	if has_flag("roy_marks_you_retail"):
		return {"tier": "retail", "mult": 0.85}
	if has_flag("roy_shows_real_stock") or ReputationLedger.get_rep("roy") >= 20:
		return {"tier": "respect", "mult": 1.15}
	return {"tier": "neutral", "mult": 1.0}


func sell_salvage() -> int:
	if not salvage_ready_to_sell():
		return 0
	var p: Dictionary = salvage_projects[0]
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
