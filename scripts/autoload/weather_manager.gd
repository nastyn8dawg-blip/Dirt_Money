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


func today_line() -> String:
	# Old School's observation of today's weather (Director canon v1).
	# Picked by day, NOT by _rng — seeded-run safety.
	var lines: Array = DataLoader.strings.get("weather_today", {}).get(current, [])
	if lines.is_empty():
		return ""
	return lines[CalendarManager.day % lines.size()]


func intuition_cue() -> String:
	# Old School's gut about TOMORROW (Read The Land). Empty string = the gut
	# is quiet; only weather worth sensing has cues. Picked by day, NOT _rng.
	var next: String = forecast(1)[0]
	var cues: Array = DataLoader.strings.get("weather_cues", {}).get(next, [])
	if cues.is_empty():
		return ""
	return cues[CalendarManager.day % cues.size()]


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
