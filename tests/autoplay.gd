extends Node
## Balance harness: a data-driven bot plays 30 days as each background and
## reports drift against the Phase 0 economy model (design/economy_model.xlsx).
## Run:  godot --headless res://tests/autoplay.tscn
## Informational, not pass/fail on values — it fails only if a run crashes
## or ends before Day 30. Sprint 10's balance pass reconciles the drift.

const SEED := 20260703
const EXTRA_SEEDS := [20260707, 20260711]   # spread run: min/median/max NET
# STALE: targets pre-date input financing + equipment-matters + jobs
# (2026-07-06). Kept for drift context only — the flat ~$4k they encode was
# the Director's complaint, not a goal. Re-derive in the economy pass.
const SPREADSHEET_TARGETS := {
	"old_school": 4670,
	"it_nephew": 3832,
	"mechanic": 4012,
}
const MISSING_SYSTEMS := {
	"old_school": "legacy contract premium rarely reachable by bot (Marge >= 40); weather intuition has no mechanical value yet",
	"it_nephew": "market-timing edge (model prices 1.15x), automation perks, trust questline, incompetence costs beyond labor mult",
	"mechanic": "self-fix + salvaged-part repair used when broke; dealer purchase exercised when flush",
}
const INCOME_KEYS := ["crop_revenue", "contract_revenue", "livestock_revenue", "repair_salvage_revenue", "job_wages", "equipment_trade_in", "misc"]
const COST_KEYS := ["order_seed_fuel", "labor_premium", "greenhorn_costs", "repair_costs", "maintenance_costs", "penalties", "travel_fuel", "salvage_purchase_cost", "parts_cost", "field_care", "item_costs", "equipment_purchase"]

var _current_bg := ""
var _hold_anchor: Dictionary = {}   # commodity -> price when IT first held
var _timing_seen := 0
var _timing_used := 0
var _timing_value := 0.0


func _ready() -> void:
	EventBus.event_triggered.connect(_bot_handle_event)
	var failures := 0
	print("")
	print("DIRT MONEY BALANCE HARNESS — seed %d — DIAGNOSTIC ONLY (Director: do not balance yet)" % SEED)
	print("Old School is the reference run. Equal cash is NOT the goal; distinct fair paths are.")
	for bg in ["old_school", "it_nephew", "mechanic"]:
		var r := _run_sim(bg, SEED)
		if r.day < 31 or r.get("stuck_breakdown", false):
			failures += 1
		var target: int = SPREADSHEET_TARGETS[bg]
		print("")
		print("=== %-12s  end cash %d | model %d | drift %d%% | note %d | NET %d | handshakes %d/%d | \"%s\"" % [
			bg, r.cash, target, int(round(100.0 * (r.cash - target) / target)),
			r.debt, r.cash - r.debt, r.kept, r.kept + r.missed, r.verdict,
		])
		var led: Dictionary = r.ledger
		var income_bits: Array[String] = []
		for k in INCOME_KEYS:
			if int(led.get(k, 0)) != 0:
				income_bits.append("%s $%d" % [k, led[k]])
		var cost_bits: Array[String] = []
		for k in COST_KEYS:
			if int(led.get(k, 0)) != 0:
				cost_bits.append("%s $%d" % [k, -int(led[k])])
		print("  income:   " + (" | ".join(income_bits) if not income_bits.is_empty() else "none"))
		print("  costs:    " + (" | ".join(cost_bits) if not cost_bits.is_empty() else "none"))
		print("  interest accrued (debt): $%d | paid down: $%d | downtime days: %d" % [
			-int(led.get("interest_accrued", 0)), -int(led.get("debt_paid", 0)), r.downtime])
		var harvest_bits: Array[String] = []
		for crop in r.harvests.keys():
			harvest_bits.append("%s %d" % [crop, r.harvests[crop]])
		print("  harvested: " + (" | ".join(harvest_bits) if not harvest_bits.is_empty() else "nothing") + "  (untracked: missed-opportunity cost)")
		var s: Dictionary = r.salvage
		if int(s.get("bought", 0)) > 0:
			print("  salvage:  bought $%d | parts $%d | gross sale $%d | NET $%d | blocks %d | Roy tier: %s | Gus respect: %s" % [
				s.bought, s.parts, s.sold, int(s.sold) - int(s.bought) - int(s.parts),
				s.blocks, r.roy_tier, "yes" if r.gus_respect else "no",
			])
		match bg:
			"old_school":
				print("  identity: storm %s | legacy eligible: %s | verdict path: trust" % [
					"HELPED" if r.flags.has("storm_helped_hollis") else ("ignored" if r.flags.has("storm_ignored_hollis") else "never offered"),
					"YES" if r.legacy_eligible else "no (Marge %d/40, storm %s)" % [r.marge_rep, "yes" if r.flags.has("storm_helped_hollis") else "no"],
				])
			"it_nephew":
				print("  identity: greenhorn mistakes %d | timing: %d holds seen, %d cashed, $%d gained by waiting" % [
					r.greenhorn, _timing_seen, _timing_used, int(round(_timing_value)),
				])
			"mechanic":
				var repair_income: int = int(r.ledger.get("repair_salvage_revenue", 0)) - int(s.get("sold", 0))
				print("  identity: repair income $%d | flip NET $%d | blocks in the shop %d" % [
					repair_income, int(s.get("sold", 0)) - int(s.get("bought", 0)) - int(s.get("parts", 0)), s.get("blocks", 0),
				])
		print("  MISSING SYSTEMS: " + MISSING_SYSTEMS.get(bg, ""))
	# Outcome SPREAD (2026-07-06): the point is that choices move the number.
	# 3 seeds per background; watch min/median/max NET, not a single target.
	print("")
	print("--- SPREAD (3 seeds/background, end NET = cash - note) ---")
	for bg in ["old_school", "it_nephew", "mechanic"]:
		var nets: Array = []
		for s in [SEED] + EXTRA_SEEDS:
			var rr := _run_sim(bg, s)
			if rr.day < 31 or rr.get("stuck_breakdown", false):
				failures += 1
			nets.append(int(rr.cash) - int(rr.debt))
		nets.sort()
		print("  %-12s NET min %d | median %d | max %d" % [bg, nets[0], nets[1], nets[2]])
	print("")
	get_tree().quit(failures)


func _run_sim(bg: String, seed_value: int) -> Dictionary:
	_current_bg = bg
	_hold_anchor = {}
	_timing_seen = 0
	_timing_used = 0
	_timing_value = 0.0
	GameState.new_run(bg, seed_value)
	var stuck_days := 0
	var stuck := false
	while CalendarManager.day <= 30:
		_bot_act()
		# Watchdog: a breakdown nobody resolves for 5+ days means the interrupt
		# loop is broken — that's a harness FAILURE, not a balance note.
		if not GameState.pending_breakdown.is_empty():
			stuck_days += 1
			if stuck_days >= 5:
				stuck = true
		else:
			stuck_days = 0
		CalendarManager.advance_day()
	return {
		"stuck_breakdown": stuck,
		"day": CalendarManager.day,
		"cash": GameState.cash,
		"debt": GameState.debt,
		"kept": GameState.contracts_completed,
		"missed": GameState.contracts_missed,
		"verdict": DataLoader.pick_ending().get("title", "?"),
		"ledger": GameState.ledger.duplicate(),
		"harvests": GameState.harvest_log.duplicate(),
		"downtime": GameState.downtime_days,
		"salvage": GameState.salvage_stats.duplicate(),
		"roy_tier": GameState.roy_pricing_tier().tier,
		"gus_respect": GameState.has_flag("gus_respects_eye"),
		"flags": GameState.flags.keys(),
		"greenhorn": GameState.greenhorn_count,
		"marge_rep": ReputationLedger.get_rep("marge"),
		"legacy_eligible": ReputationLedger.get_rep("marge") >= 40 and GameState.has_flag("storm_helped_hollis"),
	}


func _bot_act() -> void:
	# Breakdown popup, played like a sensible farmer: Mechanic strips a
	# salvaged part or self-fixes; everyone else calls the shop when flush
	# and lets it sit when broke.
	if not GameState.pending_breakdown.is_empty():
		var sub: String = GameState.pending_breakdown.get("subsystem", "")
		if _current_bg == "mechanic" and sub != "" and GameState.has_salvaged_parts(sub):
			GameState.resolve_breakdown("salvage")
		elif _current_bg == "mechanic" and GameState.cash >= 200:
			GameState.resolve_breakdown("self")
		elif GameState.cash >= 300:
			GameState.resolve_breakdown("dealer")
		else:
			GameState.resolve_breakdown("wait")
	# Upkeep: service the worst machine when it's gone rough (habit loop)
	for eq_id in GameState.equipment_owned.keys():
		if GameState.equipment_summary_state(eq_id) in ["rough", "failing"] and GameState.cash >= 100:
			GameState.service_equipment(eq_id)
			break
	# Better iron when flush: the mechanic trades the 2010 on the 2014
	if _current_bg == "mechanic" and GameState.cash > 3200 and not GameState.has_flag("bought_better_iron"):
		GameState.buy_equipment("tractor_used_2014", false)
	# IT reads the forecast and tarps ahead of a storm (items loop)
	if _current_bg == "it_nephew" and WeatherManager.forecast(1)[0] in ["storm", "drought"]:
		for field_id in GameState.fields.keys():
			var ff: Dictionary = GameState.fields[field_id]
			if ff.state == "growing" and not ff.get("tarped", false):
				if int(GameState.items_owned.get("row_tarps", 0)) == 0 and GameState.cash >= 35:
					GameState.buy_item("row_tarps")
				GameState.use_item_on_field("row_tarps", field_id)
				break
	# Grange: an idle-ish day earns a wage (one job per bot-day)
	if GameState.cash < 3000:
		var jobs := GameState.available_jobs()
		if not jobs.is_empty():
			GameState.work_job(jobs[0].get("id", ""))
	# Field care: a competent player scouts, treats, fertilizes, repairs —
	# on the note when the wallet's thin (input financing, 2026-07-06)
	for field_id in GameState.fields.keys():
		var f: Dictionary = GameState.fields[field_id]
		if f.state == "growing":
			if int(f.get("weeds", 0)) > 45:
				GameState.field_action(field_id, "treat", GameState.cash < 60)
			if f.get("stressed", false):
				GameState.field_action(field_id, "repair_field", GameState.cash < 20)
			if not f.get("fertilized", false):
				GameState.field_action(field_id, "fertilize", GameState.cash < 80)
	# Harvest anything ready (financed when short)
	for field_id in GameState.fields.keys():
		var f: Dictionary = GameState.fields[field_id]
		if f.state == "ready":
			GameState.issue_field_order(field_id, f.crop, "harvest",
				GameState.cash < GameState.order_cost(f.crop, "harvest"))
	# Plant fallow fields per background strategy (mirrors the spreadsheet)
	var plan: Dictionary
	match _current_bg:
		"old_school":
			plan = {"north": "corn", "south": "corn", "east": "hay"}
		"it_nephew":
			plan = {"north": "corn", "south": "soybeans", "east": ""}
		"mechanic":
			plan = {"north": "", "south": "", "east": "hay"}
	for field_id in plan.keys():
		var crop: String = plan[field_id]
		if crop != "" and GameState.fields[field_id].state == "fallow":
			GameState.issue_field_order(field_id, crop, "plant",
				GameState.cash < GameState.order_cost(crop, "plant"))
	# Contracts: shake on the corn delivery when eligible, deliver when stocked
	if GameState.active_contract("corn_delivery_t1").is_empty() and _current_bg != "mechanic":
		GameState.accept_contract("corn_delivery_t1")
	GameState.deliver_contract("corn_delivery_t1")
	# Mechanic identity: take the repair pipeline once the baler fix opens it
	if _current_bg == "mechanic":
		if GameState.has_flag("baler_fixed") and GameState.active_contract("baler_repair").is_empty() and not GameState.has_flag("repair_contract_done"):
			GameState.accept_contract("baler_repair")
		GameState.work_repair_job()
		# Judgment call, botted: buy the straight-framed rake, walk away
		# from the painted-over mower
		for o in GameState.salvage_offers.duplicate():
			if o.deal_id == "hay_rake":
				GameState.buy_salvage("hay_rake")
		if GameState.salvage_ready_to_sell():
			GameState.sell_salvage()
		elif not GameState.salvage_projects.is_empty():
			GameState.work_salvage()
	# Sell: IT reads the terminal and holds when tomorrow pays better —
	# the information edge is a DECISION, not a multiplier. Everyone else
	# sells at whatever today says.
	for commodity in GameState.inventory.keys():
		var units: int = GameState.inventory[commodity]
		if units <= 0:
			continue
		if _current_bg == "it_nephew" and commodity != "eggs":
			if EconomyManager.forecast_price(commodity) > EconomyManager.prices.get(commodity, 0.0) and CalendarManager.day < 29:
				_timing_seen += 1
				if not _hold_anchor.has(commodity):
					_hold_anchor[commodity] = EconomyManager.prices.get(commodity, 0.0)
				continue
			if _hold_anchor.has(commodity):
				_timing_used += 1
				_timing_value += (EconomyManager.prices.get(commodity, 0.0) - float(_hold_anchor[commodity])) * units
				_hold_anchor.erase(commodity)
		EconomyManager.sell(commodity, units)
	# Put surplus against the note when truly flush (exercises pay_debt). Only
	# from cash above a working buffer, so it never tanks its own verdict.
	if GameState.debt > 0 and GameState.cash > 3000:
		GameState.pay_debt(GameState.cash - 3000)


func _bot_handle_event(ev: Dictionary) -> void:
	# The bot answers conversations by applying tree option effects directly.
	match ev.get("dialogue_tree", ""):
		"storm_choice":
			if _current_bg == "old_school":
				ReputationLedger.apply_effects([
					{"op": "rep_delta", "npc": "hollis", "value": 8},
					{"op": "county_delta", "value": 3},
					{"op": "flag_set", "flag": "storm_helped_hollis"},
				])
			else:
				ReputationLedger.apply_effects([
					{"op": "rep_delta", "npc": "hollis", "value": -4},
					{"op": "county_delta", "value": -2},
					{"op": "flag_set", "flag": "storm_ignored_hollis"},
				])
		"hollis_baler":
			if _current_bg == "mechanic":
				# Bot takes the fix and wins it (deterministic optimism)
				ReputationLedger.apply_effects([
					{"op": "rep_delta", "npc": "hollis", "value": 10},
					{"op": "rep_delta", "npc": "marge", "value": 5},
					{"op": "county_delta", "value": 3},
					{"op": "flag_set", "flag": "baler_fixed"},
				])
			else:
				ReputationLedger.apply_effects([
					{"op": "rep_delta", "npc": "hollis", "value": 4},
				])
