class_name ScreenBase
extends Control
## Shared greybox helpers. ColorRect + Label quality by design (UI_SPEC §4).

const BG_COLOR := Color(0.12, 0.11, 0.09)
const PANEL_COLOR := Color(0.18, 0.17, 0.14)
const ACCENT := Color(0.85, 0.72, 0.35)


func setup(_payload: Dictionary) -> void:
	pass


func add_background() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)


func make_panel(parent: Control) -> PanelContainer:
	var p := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL_COLOR
	style.set_content_margin_all(12)
	p.add_theme_stylebox_override("panel", style)
	parent.add_child(p)
	return p


func make_label(parent: Control, text: String, size: int = 16, color: Color = Color.WHITE) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	parent.add_child(l)
	return l


func make_button(parent: Control, text: String, callback: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.pressed.connect(callback)
	parent.add_child(b)
	return b


func go(screen_id: String, payload: Dictionary = {}) -> void:
	EventBus.screen_change_requested.emit(screen_id, payload)
