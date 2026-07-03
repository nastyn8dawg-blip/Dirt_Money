extends Node
## Global signal hub. All cross-system communication goes through here.
## No gameplay logic in this file, ever.

signal game_started(background_id: String)
signal day_advanced(day: int)
signal time_block_changed(block: int)
signal weather_changed(state: String)
signal money_changed(cash: int, debt: int)
signal reputation_changed(npc_id: String, value: int)
signal county_changed(value: int)
signal market_ticked(prices: Dictionary)
signal field_order_issued(order: Dictionary)
signal field_order_completed(order: Dictionary)
signal contract_accepted(contract_id: String)
signal contract_delivered(contract_id: String)
signal contract_missed(contract_id: String)
signal dialogue_started(tree_id: String)
signal dialogue_finished(tree_id: String)
signal screen_change_requested(screen_id: String, payload: Dictionary)
signal run_ended(summary: Dictionary)
