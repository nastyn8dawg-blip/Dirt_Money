extends Node
## Market prices: bounded random walk per commodity + transactions.
## Chart/forecast/gossip VISIBILITY is a background flag enforced at UI.

var prices: Dictionary = {}       # commodity -> current price
var history: Dictionary = {}      # commodity -> Array[float]
var _future_prices: Dictionary = {}  # commodity -> next 3 prices, pre-rolled
var _rng := RandomNumberGenerator.new()

const FORECAST_DEPTH := 3


func reset(seed_value: int) -> void:
	_rng.seed = seed_value + 1
	prices.clear()
	history.clear()
	_future_prices.clear()
	for c in DataLoader.market.get("commodities", []):
		prices[c.id] = float(c.base_price)
		history[c.id] = [float(c.base_price)]
		_future_prices[c.id] = []
		var last := float(c.base_price)
		for i in range(FORECAST_DEPTH):
			last = _step(c, last)
			_future_prices[c.id].append(last)


func tick() -> void:
	# The walk is pre-rolled so a forecast is a real look at the future,
	# not a guess — IT's information edge has to be honest to be an edge.
	for c in DataLoader.market.get("commodities", []):
		var p: float = _future_prices[c.id].pop_front()
		prices[c.id] = p
		history[c.id].append(p)
		var last: float = _future_prices[c.id].back() if not _future_prices[c.id].is_empty() else p
		_future_prices[c.id].append(_step(c, last))
	EventBus.market_ticked.emit(prices)


func forecast_price(commodity: String, days_ahead: int = 1) -> float:
	# VISIBILITY is gated at the UI by the background's market_charts flag;
	# this service answers anyone who asks.
	var q: Array = _future_prices.get(commodity, [])
	if q.is_empty():
		return prices.get(commodity, 0.0)
	return q[clampi(days_ahead - 1, 0, q.size() - 1)]


func _step(c: Dictionary, from_price: float) -> float:
	var step: float = _rng.randf_range(-c.walk_step_max, c.walk_step_max)
	return clampf(from_price + step, float(c.floor), float(c.ceiling))


func sell(commodity: String, units: int) -> int:
	var have: int = GameState.inventory.get(commodity, 0)
	units = mini(units, have)
	if units <= 0:
		return 0
	var revenue := int(round(prices.get(commodity, 0.0) * units))
	GameState.inventory[commodity] = have - units
	GameState.add_cash(revenue, "livestock_revenue" if commodity == "eggs" else "crop_revenue")
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
