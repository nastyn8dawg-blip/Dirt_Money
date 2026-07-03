extends Node
## Market prices: bounded random walk per commodity + transactions.
## Chart/forecast/gossip VISIBILITY is a background flag enforced at UI.

var prices: Dictionary = {}       # commodity -> current price
var history: Dictionary = {}      # commodity -> Array[float]
var _rng := RandomNumberGenerator.new()


func reset(seed_value: int) -> void:
	_rng.seed = seed_value + 1
	prices.clear()
	history.clear()
	for c in DataLoader.market.get("commodities", []):
		prices[c.id] = float(c.base_price)
		history[c.id] = [float(c.base_price)]


func tick() -> void:
	for c in DataLoader.market.get("commodities", []):
		var step: float = _rng.randf_range(-c.walk_step_max, c.walk_step_max)
		var p: float = clampf(prices[c.id] + step, float(c.floor), float(c.ceiling))
		prices[c.id] = p
		history[c.id].append(p)
	EventBus.market_ticked.emit(prices)


func sell(commodity: String, units: int) -> int:
	var have: int = GameState.inventory.get(commodity, 0)
	units = mini(units, have)
	if units <= 0:
		return 0
	var revenue := int(round(prices.get(commodity, 0.0) * units))
	GameState.inventory[commodity] = have - units
	GameState.add_cash(revenue)
	return revenue


func trend(commodity: String) -> String:
	var h: Array = history.get(commodity, [])
	if h.size() < 2:
		return "flat"
	var delta: float = h[-1] - h[max(0, h.size() - 4)]
	if delta > 0.05:
		return "rising"
	if delta < -0.05:
		return "falling"
	return "flat"


func gossip_line(commodity: String = "corn") -> String:
	# Old School's market data: a line at the diner, not a chart.
	# Picked by day, NOT by _rng: consuming the seeded stream on UI refresh
	# would desync the market walk between seeded runs.
	var lines: Array = DataLoader.market.get("gossip_lines", {}).get(trend(commodity), [])
	if lines.is_empty():
		return "[Gossip missing]"
	return lines[CalendarManager.day % lines.size()]
