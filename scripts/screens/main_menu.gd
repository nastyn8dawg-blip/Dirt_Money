extends ScreenBase


func _ready() -> void:
	add_background()
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_CENTER)
	box.grow_horizontal = Control.GROW_DIRECTION_BOTH
	box.grow_vertical = Control.GROW_DIRECTION_BOTH
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 16)
	add_child(box)

	make_label(box, "DIRT MONEY", 64, ACCENT)
	make_label(box, "Inherit a struggling farm. Survive 30 days your way.", 18)
	box.add_child(Control.new())  # spacer

	make_button(box, "New Run", func(): go("character_select"))
	var cont := make_button(box, "Continue", func():
		if SaveManager.load_game():
			go("farm_hud"))
	cont.disabled = not SaveManager.has_save()
	make_button(box, "Quit", func(): get_tree().quit())

	make_label(box, "greybox build — foundation session", 12, Color(0.5, 0.5, 0.5))
