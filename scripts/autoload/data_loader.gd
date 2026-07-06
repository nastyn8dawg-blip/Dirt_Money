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
var endings: Array = []
var salvage_deals: Array = []
var leads: Array = []
var jobs: Array = []
var items: Array = []
var equipment_dealer_stock: Array = []


func pick_lead() -> String:
	# The diner tells the player something USEFUL when the county has
	# something to say — and just pours coffee when it doesn't.
	for lead in leads:
		var ok := false
		match lead.get("condition", ""):
			"contract_available":
				ok = GameState.contracts_active.is_empty()
			"salvage_offer":
				ok = not GameState.salvage_offers.is_empty()
			"market_rising":
				ok = EconomyManager.trend("corn") == "rising"
			"":
				ok = true
		if ok and not lead.get("lines", []).is_empty():
			var lines: Array = lead.lines
			return lines[randi() % lines.size()]
	return ""


func pick_ending() -> Dictionary:
	# The run's verdict, measured in dependability. First match wins.
	for e in endings:
		if e.has("if_flag") and not GameState.has_flag(e.if_flag):
			continue
		if e.has("if_not_flag") and GameState.has_flag(e.if_not_flag):
			continue
		if e.has("if_county_at_least") and ReputationLedger.county < int(e.if_county_at_least):
			continue
		if e.has("if_county_below") and ReputationLedger.county >= int(e.if_county_below):
			continue
		if e.has("if_cash_at_least") and GameState.cash < int(e.if_cash_at_least):
			continue
		if e.has("if_contracts_at_least") and GameState.contracts_completed < int(e.if_contracts_at_least):
			continue
		return e
	return {}


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
		"breakdown_profile": d.get("breakdown_profile", {}),
	}
	for e in d.get("equipment", []):
		equipment[e.id] = e
	equipment_dealer_stock = d.get("dealer_stock", [])
	# Dealer stock is also equipment (once bought) — register templates so
	# condition/summary math works the moment a machine changes hands
	for e in equipment_dealer_stock:
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
	jobs = _read_json("res://data/jobs.json").get("jobs", [])
	items = _read_json("res://data/items.json").get("items", [])
	gossip_banks = _read_json("res://data/gossip.json").get("banks", [])
	endings = _read_json("res://data/endings.json").get("endings", [])
	salvage_deals = _read_json("res://data/salvage.json").get("deals", [])
	leads = _read_json("res://data/leads.json").get("leads", [])
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
