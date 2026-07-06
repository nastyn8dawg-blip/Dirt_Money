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
	"salvage_yard": "res://scripts/screens/salvage_yard.gd",
	"grange": "res://scripts/screens/grange_jobs.gd",
	"roy_dealer": "res://scripts/screens/roy_dealer.gd",
}

var _current: Control = null
var _dialogue_layer: Control = null
var _fade: ColorRect = null          # screen-change crossfade veil
var _day_card: Label = null          # day-advance interstitial


func _ready() -> void:
	theme = ScreenBase.build_theme()
	EventBus.screen_change_requested.connect(_on_screen_change)
	EventBus.dialogue_started.connect(_on_dialogue_started)
	EventBus.event_triggered.connect(func(ev): EventBus.dialogue_started.emit(ev.dialogue_tree))
	EventBus.run_ended.connect(func(_summary): _on_screen_change("report_card", {}))
	EventBus.day_advanced.connect(_on_day_advanced)
	if not DataLoader.load_errors.is_empty():
		push_warning("Data load errors: %s" % str(DataLoader.load_errors))
	# Crossfade veil + day card live above all screens (UI juice, 2026-07-06)
	_fade = ColorRect.new()
	_fade.color = Color(0, 0, 0, 0)
	_fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade.z_index = 100
	add_child(_fade)
	_day_card = Label.new()
	_day_card.add_theme_font_size_override("font_size", 42)
	_day_card.add_theme_color_override("font_color", ScreenBase.ACCENT)
	_day_card.set_anchors_preset(Control.PRESET_CENTER)
	_day_card.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_day_card.modulate.a = 0.0
	_day_card.z_index = 101
	_day_card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_day_card)
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
	# New screen settles in through a quick fade — county paperwork sliding
	# across the desk, not a hard cut
	if _current is CanvasItem:
		ScreenBase.fade_in(_current, 0.15)
	move_child(_fade, get_child_count() - 2)
	move_child(_day_card, get_child_count() - 1)


func _on_day_advanced(day: int) -> void:
	# Brief day-card beat so a new morning FEELS like a new morning
	if _day_card == null:
		return
	_day_card.text = "Day %d — %s" % [day, CalendarManager.weekday_name()]
	var tw := _day_card.create_tween()
	tw.tween_property(_day_card, "modulate:a", 1.0, 0.15)
	tw.tween_interval(0.55)
	tw.tween_property(_day_card, "modulate:a", 0.0, 0.25)


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
