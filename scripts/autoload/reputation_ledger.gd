extends Node
## Per-NPC reputation + county standing. The replayability engine.
## Ripple rules live in dialogue/event data (`effects`), never hardcoded here.

var rep: Dictionary = {}   # npc_id -> int
var county: int = 0


func init_from_background(bg_id: String) -> void:
	rep.clear()
	county = 0
	var starting: Dictionary = DataLoader.get_background(bg_id).get("starting_reputation", {})
	for npc_id in DataLoader.npcs.keys():
		rep[npc_id] = int(starting.get(npc_id, 0))
	county = int(starting.get("county", 0))


func get_rep(npc_id: String) -> int:
	return rep.get(npc_id, 0)


func tier(npc_id: String) -> String:
	var value := get_rep(npc_id)
	var tiers: Dictionary = DataLoader.reputation_tiers
	for t in ["hostile", "cold", "neutral", "warm", "trusted"]:
		if value < int(tiers.get(t, 999)):
			return t
	return "trusted"


func apply_effects(effects: Array) -> void:
	for e in effects:
		match e.get("op", ""):
			"rep_delta":
				var npc: String = e.get("npc", "")
				rep[npc] = get_rep(npc) + int(e.get("value", 0))
				EventBus.reputation_changed.emit(npc, rep[npc])
			"county_delta":
				county += int(e.get("value", 0))
				EventBus.county_changed.emit(county)
			"flag_set":
				GameState.set_flag(e.get("flag", ""))
			"cash_delta":
				GameState.add_cash(int(e.get("value", 0)))
			"chickens_delta":
				GameState.chickens = maxi(0, GameState.chickens + int(e.get("value", 0)))
			"time_block":
				CalendarManager.spend_block()
			"unlock":
				GameState.set_flag("unlock_" + str(e.get("value", "")))
			"breakdown_resolve":
				GameState.resolve_breakdown(str(e.get("value", "resume")))
			_:
				push_warning("Unknown effect op: %s" % str(e))


func snapshot() -> Dictionary:
	return {"npcs": rep.duplicate(), "county": county}
