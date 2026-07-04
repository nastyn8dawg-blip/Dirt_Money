extends Node
## JSON save/load, one file per slot in user://saves/. Versioned.

const SAVE_VERSION := 1
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
	for order in GameState.field_orders:
		if order.get("paused", false):
			GameState.pending_breakdown = {"order": order}
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
