extends Node
## 7-state weather with seeded RNG. Forecast VISIBILITY is a background
## interface flag enforced at the UI layer — this service answers anyone.

const STATES := ["clear", "overcast", "rain_light", "storm", "drought", "wind", "fog"]
const WEIGHTS := [30, 20, 18, 8, 8, 10, 6]
const DISPLAY := {
	"clear": "Clear", "overcast": "Overcast", "rain_light": "Light rain",
	"storm": "Storm", "drought": "Dry heat", "wind": "Windy", "fog": "Fog",
}

var current: String = "clear"
var _rng := RandomNumberGenerator.new()
var _future: Array[String] = []   # pre-rolled so forecasts stay stable


func reset(seed_value: int) -> void:
	_rng.seed = seed_value
	_future.clear()
	current = _roll()
	_ensure_future(5)


func roll_next() -> void:
	_ensure_future(6)
	current = _future.pop_front()
	EventBus.weather_changed.emit(current)


func display_name(state: String) -> String:
	return DISPLAY.get(state, state)


func forecast(days: int) -> Array[String]:
	_ensure_future(days)
	var out: Array[String] = []
	for i in range(days):
		out.append(_future[i])
	return out


func intuition_cue() -> String:
	# Old School flavor: qualitative hint about tomorrow (Read The Land).
	# Lines live in data/strings.json — Director-authored per CLAUDE.md law 6.
	var next: String = forecast(1)[0]
	return DataLoader.strings.get("weather_cues", {}).get(next, "[Cue missing for %s]" % next)


func _ensure_future(n: int) -> void:
	while _future.size() < n:
		_future.append(_roll())


func _roll() -> String:
	var total := 0
	for w in WEIGHTS:
		total += w
	var pick := _rng.randi_range(1, total)
	var acc := 0
	for i in range(STATES.size()):
		acc += WEIGHTS[i]
		if pick <= acc:
			return STATES[i]
	return STATES[0]
