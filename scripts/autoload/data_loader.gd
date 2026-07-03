extends Node
## Loads and validates every /data JSON at boot.
## Tolerates unknown keys and extra files (future mod support).

var crops: Dictionary = {}
var contracts: Array = []
var events: Array = []
var equipment: Dictionary = {}
var equipment_meta: Dictionary = {}
var market: Dictionary = {}
var perk_trees: Dictionary = {}
var npcs: Dictionary = {}
var reputation_tiers: Dictionary = {}
var backgrounds: Dictionary = {}
var dialogue_trees: Dictionary = {}
var strings: Dictionary = {}
var gossip_banks: Array = []


func pick_gossip() -> String:
	# The county remembers: banks gated on a flag the player earned outrank
	# general county talk. Director-authored lines only (law 6).
	var eligible: Array = []
	var flagged := false
	for bank in gossip_banks:
		if bank.get("lines", []).is_empty():
			continue
		var flag: String = bank.get("requires_flag", "")
		if flag != "":
			if GameState.has_flag(flag):
				if not flagged:
					eligible.clear()
					flagged = true
				eligible.append(bank)
		elif not flagged:
			eligible.append(bank)
	if eligible.is_empty():
		return ""
	var bank: Dictionary = eligible[randi() % eligible.size()]
	var lines: Array = bank.get("lines", [])
	return "" if lines.is_empty() else lines[randi() % lines.size()]

var load_errors: Array[String] = []


func _ready() -> void:
	load_all()


func load_all() -> void:
	load_errors.clear()
	var d := _read_json("res://data/crops.json")
	for c in d.get("crops", []):
		crops[c.id] = c
	d = _read_json("res://data/contracts.json")
	contracts = d.get("contracts", [])
	d = _read_json("res://data/events.json")
	events = d.get("events", [])
	d = _read_json("res://data/equipment.json")
	equipment_meta = {
		"subsystems": d.get("subsystems", []),
		"summary_thresholds": d.get("summary_thresholds", {}),
	}
	for e in d.get("equipment", []):
		equipment[e.id] = e
	market = _read_json("res://data/market.json")
	d = _read_json("res://data/perks.json")
	for t in d.get("trees", []):
		perk_trees[t.id] = t
	d = _read_json("res://data/npcs.json")
	reputation_tiers = d.get("reputation_tiers", {})
	for n in d.get("npcs", []):
		npcs[n.id] = n
	d = _read_json("res://data/backgrounds.json")
	for b in d.get("backgrounds", []):
		backgrounds[b.id] = b
	strings = _read_json("res://data/strings.json")
	gossip_banks = _read_json("res://data/gossip.json").get("banks", [])
	_load_dialogue_dir("res://data/dialogue")


func get_background(id: String) -> Dictionary:
	return backgrounds.get(id, {})


func get_npc(id: String) -> Dictionary:
	return npcs.get(id, {})


func get_dialogue(tree_id: String) -> Dictionary:
	return dialogue_trees.get(tree_id, {})


func _load_dialogue_dir(path: String) -> void:
	var dir := DirAccess.open(path)
	if dir == null:
		load_errors.append("Missing dialogue dir: " + path)
		return
	for f in dir.get_files():
		if f.ends_with(".json"):
			var tree := _read_json(path + "/" + f)
			if tree.has("id"):
				dialogue_trees[tree.id] = tree


func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		load_errors.append("Missing data file: " + path)
		return {}
	var text := FileAccess.get_file_as_string(path)
	var parsed = JSON.parse_string(text)
	if parsed == null or not (parsed is Dictionary):
		load_errors.append("Invalid JSON: " + path)
		return {}
	return parsed
