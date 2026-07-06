extends Node
## JSON save/load, one file per slot in user://saves/. Versioned.

# v2 (2026-07-06): adds equipment_owned, ledger, salvage state, pending
# breakdown detail, event cooldowns, day snapshot — several were silently
# missing from v1 (KNOWN_BUGS). v1 saves still load; missing fields default.
const SAVE_VERSION := 2
const SAVE_DIR := "user://saves"


func save_game(slot: int = 0) -> bool:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)
	var data := {
		"save_version": SAVE_VERSION,
		"background_id": GameState.background_id,
		"cash": GameState.cash,
		"debt": GameState.debt,
		"run_seed": GameState.run_seed,
		"inventory": GameState.inventory,
		"flags": GameState.flags,
		"field_orders": GameState.field_orders,
		"fields": GameState.fields,
		"chickens": GameState.chickens,
		"contracts_completed": GameState.contracts_completed,
		"contracts_missed": GameState.contracts_missed,
		"contracts_active": GameState.contracts_active,
		"perks": GameState.perks,
		"day": CalendarManager.day,
		"block": CalendarManager.block,
		"reputation": ReputationLedger.rep,
		"county": ReputationLedger.county,
		# v2 fields
		"equipment_owned": GameState.equipment_owned,
		"ledger": GameState.ledger,
		"harvest_log": GameState.harvest_log,
		"downtime_days": GameState.downtime_days,
		"greenhorn_count": GameState.greenhorn_count,
		"salvage_offers": GameState.salvage_offers,
		"salvage_projects": GameState.salvage_projects,
		"salvage_stats": GameState.salvage_stats,
		"pending_breakdown_meta": {
			"equipment": GameState.pending_breakdown.get("equipment", ""),
			"severity": GameState.pending_breakdown.get("severity", ""),
			"subsystem": GameState.pending_breakdown.get("subsystem", ""),
		} if not GameState.pending_breakdown.is_empty() else {},
		"event_last": GameState.event_last,
		"day_snapshot": GameState.day_snapshot,
		"jobs_worked": GameState.jobs_worked,
		"items_owned": GameState.items_owned,
		"equipment_slots": GameState.equipment_slots,
	}
	var f := FileAccess.open(_slot_path(slot), FileAccess.WRITE)
	if f == null:
		return false
	f.store_string(JSON.stringify(data, "  "))
	return true


func load_game(slot: int = 0) -> bool:
	var path := _slot_path(slot)
	if not FileAccess.file_exists(path):
		return false
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if parsed == null or not (parsed is Dictionary):
		return false
	if int(parsed.get("save_version", 0)) > SAVE_VERSION:
		return false
	GameState.background_id = parsed.get("background_id", "")
	GameState.cash = int(parsed.get("cash", 0))
	GameState.debt = int(parsed.get("debt", 0))
	GameState.run_seed = int(parsed.get("run_seed", 0))
	GameState.inventory = parsed.get("inventory", {})
	GameState.flags = parsed.get("flags", {})
	GameState.field_orders = parsed.get("field_orders", [])
	GameState.pending_breakdown = {}
	var pb_meta: Dictionary = parsed.get("pending_breakdown_meta", {})
	for order in GameState.field_orders:
		if order.get("paused", false):
			GameState.pending_breakdown = {
				"order": order,
				"equipment": pb_meta.get("equipment", "tractor_old"),
				"severity": pb_meta.get("severity", "mid"),
				"subsystem": pb_meta.get("subsystem", ""),
			}
	GameState.fields = parsed.get("fields", {})
	GameState.chickens = int(parsed.get("chickens", 0))
	GameState.contracts_completed = int(parsed.get("contracts_completed", 0))
	GameState.contracts_missed = int(parsed.get("contracts_missed", 0))
	GameState.contracts_active = parsed.get("contracts_active", [])
	GameState.perks = parsed.get("perks", [])
	CalendarManager.day = int(parsed.get("day", 1))
	CalendarManager.block = int(parsed.get("block", 0))
	ReputationLedger.rep = parsed.get("reputation", {})
	ReputationLedger.county = int(parsed.get("county", 0))
	# v2 fields — v1 saves fall back to sane defaults (fresh equipment seed)
	var eq_owned: Dictionary = parsed.get("equipment_owned", {})
	if eq_owned.is_empty():
		for eq_id in DataLoader.equipment.keys():
			eq_owned[eq_id] = {
				"condition": (DataLoader.equipment[eq_id].get("condition", {}) as Dictionary).duplicate(true),
				"neglect_streak": 0,
			}
	GameState.equipment_owned = eq_owned
	GameState.ledger = parsed.get("ledger", {})
	GameState.harvest_log = parsed.get("harvest_log", {})
	GameState.downtime_days = int(parsed.get("downtime_days", 0))
	GameState.greenhorn_count = int(parsed.get("greenhorn_count", 0))
	GameState.salvage_offers = parsed.get("salvage_offers", [])
	GameState.salvage_projects = parsed.get("salvage_projects", [])
	GameState.salvage_stats = parsed.get("salvage_stats",
		{"bought": 0, "parts": 0, "sold": 0, "blocks": 0, "parts_harvested": 0})
	GameState.event_last = parsed.get("event_last", {})
	GameState.day_snapshot = parsed.get("day_snapshot", {})
	GameState.jobs_worked = parsed.get("jobs_worked", {})
	GameState.items_owned = parsed.get("items_owned", {})
	GameState.equipment_slots = parsed.get("equipment_slots",
		{"tractor": "tractor_old", "baler": "baler_rusty", "truck": "truck_farm"})
	GameState.morning_report = []
	if GameState.day_snapshot.is_empty():
		GameState.snapshot_day()
	WeatherManager.reset(GameState.run_seed)
	EconomyManager.reset(GameState.run_seed)
	EventBus.money_changed.emit(GameState.cash, GameState.debt)
	return true


func has_save(slot: int = 0) -> bool:
	return FileAccess.file_exists(_slot_path(slot))


const RUN_HISTORY_PATH := "user://run_history.json"


func record_run(summary: Dictionary) -> void:
	var runs := load_run_history()
	runs.append(summary)
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)
	var f := FileAccess.open(RUN_HISTORY_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(runs, "  "))


func load_run_history() -> Array:
	if not FileAccess.file_exists(RUN_HISTORY_PATH):
		return []
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(RUN_HISTORY_PATH))
	return parsed if parsed is Array else []


func _slot_path(slot: int) -> String:
	return "%s/slot_%d.json" % [SAVE_DIR, slot]
