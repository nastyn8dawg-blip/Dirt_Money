extends Control
## Root screen manager. Screens are code-built Controls (greybox phase);
## swap requests arrive via EventBus.screen_change_requested.

const SCREENS := {
	"main_menu": "res://scripts/screens/main_menu.gd",
	"character_select": "res://scripts/screens/character_select.gd",
	"farm_hud": "res://scripts/screens/farm_hud.gd",
	"world_map": "res://scripts/screens/world_map.gd",
	"market": "res://scripts/screens/market_screen.gd",
	"contracts": "res://scripts/screens/contracts_screen.gd",
	"report_card": "res://scripts/screens/report_card.gd",
}

var _current: Control = null
var _dialogue_layer: Control = null


func _ready() -> void:
	EventBus.screen_change_requested.connect(_on_screen_change)
	EventBus.dialogue_started.connect(_on_dialogue_started)
	EventBus.run_ended.connect(func(_summary): _on_screen_change("report_card", {}))
	if not DataLoader.load_errors.is_empty():
		push_warning("Data load errors: %s" % str(DataLoader.load_errors))
	_on_screen_change("main_menu", {})


func _on_screen_change(screen_id: String, payload: Dictionary = {}) -> void:
	if not SCREENS.has(screen_id):
		push_warning("Unknown screen: " + screen_id)
		return
	if _current:
		_current.queue_free()
	var script: GDScript = load(SCREENS[screen_id])
	_current = Control.new()
	_current.set_script(script)
	_current.set_anchors_preset(Control.PRESET_FULL_RECT)
	if _current.has_method("setup"):
		_current.setup(payload)
	add_child(_current)


func _on_dialogue_started(tree_id: String) -> void:
	if _dialogue_layer:
		_dialogue_layer.queue_free()
	var script: GDScript = load("res://scripts/dialogue/dialogue_runner.gd")
	_dialogue_layer = Control.new()
	_dialogue_layer.set_script(script)
	_dialogue_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_dialogue_layer.tree_id = tree_id
	add_child(_dialogue_layer)
	_dialogue_layer.tree_exited.connect(func(): _dialogue_layer = null)
