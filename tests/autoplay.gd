extends Node
## Balance harness: a data-driven bot plays 30 days as each background and
## reports drift against the Phase 0 economy model (design/economy_model.xlsx).
## Run:  godot --headless res://tests/autoplay.tscn
## Informational, not pass/fail on values — it fails only if a run crashes
## or ends before Day 30. Sprint 10's balance pass reconciles the drift.

const SEED := 20260703
const SPREADSHEET_TARGETS := {
	"old_school": 4670,
	"it_nephew": 3832,
	"mechanic": 4012,
}
const MISSING_SYSTEMS := {
	"old_school": "legacy contract premium rarely reachable by bot (Marge >= 40); weather intuition has no mechanical value yet",
	"it_nephew": "market-timing edge (model prices 1.15x), automation perks, trust questline, incompetence costs beyond labor mult",
	"mechanic": "salvage/auction flip (~$750 in model), cheaper self-repair, restoration income; repair contracts LIVE as of 2026-07-03",
}
const INCOME_KEYS := ["crop_revenue", "contract_revenue", "livestock_revenue", "repair_salvage_revenue", "misc"]
const COST_KEYS := ["order_seed_fuel", "labor_premium", "repair_costs", "penalties", "travel_fuel"]

var _current_bg := ""


func _ready() -> void:
	EventBus.event_triggered.connect(_bot_handle_event)
	var failures := 0
	print("")
	print("DIRT MONEY BALANCE HARNESS — seed %d — DIAGNOSTIC ONLY (Director: do not balance yet)" % SEED)
	print("Old School is the reference run. Equal cash is NOT the goal; distinct fair paths are.")
	for bg in ["old_school", "it_nephew", "mechanic"]:
		var r := _run_sim(bg)
		if r.day < 31:
			failures += 1
		var target: int = SPREADSHEET_TARGETS[bg]
		print("")
		print("=== %-12s  end cash %d | model %d | drift %d%% | debt %d | handshakes %d/%d | \"%s\"" % [
			bg, r.cash, target, int(round(100.0 * (r.cash - target) / target)),
			r.debt, r.kept, r.kept + r.missed, r.verdict,
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
		print("  interest accrued (debt, not cash): $%d | downtime days: %d" % [-int(led.get("interest_accrued", 0)), r.downtime])
		var harvest_bits: Array[String] = []
		for crop in r.harvests.keys():
			harvest_bits.append("%s %d" % [crop, r.harvests[crop]])
		print("  harvested: " + (" | ".join(harvest_bits) if not harvest_bits.is_empty() else "nothing") + "  (untracked: missed-opportunity cost)")
		print("  MISSING SYSTEMS: " + MISSING_SYSTEMS.get(bg, ""))
	print("")
	get_tree().quit(failures)


func _run_sim(bg: String) -> Dictionary:
	_current_bg = bg
	GameState.new_run(bg, SEED)
	while CalendarManager.day <= 30:
		_bot_act()
		CalendarManager.advance_day()
	return {
		"day": CalendarManager.day,
		"cash": GameState.cash,
		"debt": GameState.debt,
		"kept": GameState.contracts_completed,
		"missed": GameState.contracts_missed,
		"verdict": DataLoader.pick_ending().get("title", "?"),
		"ledger": GameState.ledger.duplicate(),
		"harvests": GameState.harvest_log.duplicate(),
		"downtime": GameState.downtime_days,
	}


func _bot_act() -> void:
	# Breakdown on the line: pay if flush, wait if broke (mirrors a cautious player)
	if not GameState.pending_breakdown.is_empty():
		if GameState.cash >= 300:
			ReputationLedger.apply_effects([
				{"op": "cash_delta", "value": -150},
				{"op": "flag_set", "flag": "breakdown_paid_shop"},
				{"op": "rep_delta", "npc": "roy", "value": 2},
				{"op": "breakdown_resolve", "value": "resume"},
			])
		else:
			ReputationLedger.apply_effects([
				{"op": "flag_set", "flag": "breakdown_waited"},
				{"op": "breakdown_resolve", "value": "wait"},
			])
	# Harvest anything ready
	for field_id in GameState.fields.keys():
		var f: Dictionary = GameState.fields[field_id]
		if f.state == "ready":
			GameState.issue_field_order(field_id, f.crop, "harvest")
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
			GameState.issue_field_order(field_id, crop, "plant")
	# Contracts: shake on the corn delivery when eligible, deliver when stocked
	if GameState.active_contract("corn_delivery_t1").is_empty() and _current_bg != "mechanic":
		GameState.accept_contract("corn_delivery_t1")
	GameState.deliver_contract("corn_delivery_t1")
	# Mechanic identity: take the repair pipeline once the baler fix opens it
	if _current_bg == "mechanic":
		if GameState.has_flag("baler_fixed") and GameState.active_contract("baler_repair").is_empty() and not GameState.has_flag("repair_contract_done"):
			GameState.accept_contract("baler_repair")
		GameState.work_repair_job()
	# Sell whatever's left at today's prices
	for commodity in GameState.inventory.keys():
		var units: int = GameState.inventory[commodity]
		if units > 0:
			EconomyManager.sell(commodity, units)


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
