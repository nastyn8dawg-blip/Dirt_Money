extends Control
## THE core system (MASTER_SPEC pillar 2). One runner plays every data-driven
## tree: talking portrait + jaw-flap, scrolling text with gibberish blips,
## visible-odds check options. Effects route through ReputationLedger.
## Portrait busts and real Animalese synthesis are approval-gated (CLAUDE.md #4);
## this greybox uses an initial-letter bust and sine-wave blips.

var tree_id: String = ""

var _tree: Dictionary = {}
var _npc: Dictionary = {}
var _node_id: String = ""
var _text_label: Label
var _options_box: VBoxContainer
var _portrait: Panel
var _portrait_letter: Label
var _jaw: ColorRect
var _speaker_label: Label
var _blip_player: AudioStreamPlayer
var _chars_shown: float = 0.0
var _scrolling := false
var _rng := RandomNumberGenerator.new()

const TEXT_SPEED := 40.0  # chars/sec baseline; NPC syllable_rate scales it


func _ready() -> void:
	_tree = DataLoader.get_dialogue(tree_id)
	if _tree.is_empty():
		push_warning("Unknown dialogue tree: " + tree_id)
		queue_free()
		return
	_npc = DataLoader.get_npc(_tree.get("npc", ""))
	_build_ui()
	_enter_node(_tree.get("start", ""))


func _process(delta: float) -> void:
	if not _scrolling:
		return
	var full: String = _current_node().get("text", "")
	var rate: float = TEXT_SPEED * float(_npc.get("voice", {}).get("syllable_rate", 4.5)) / 4.5
	var prev := int(_chars_shown)
	_chars_shown = minf(_chars_shown + rate * delta, full.length())
	_text_label.text = full.substr(0, int(_chars_shown))
	_jaw.visible = int(_chars_shown / 4.0) % 2 == 0  # 2-frame jaw flap
	if int(_chars_shown) != prev and prev % 3 == 0:
		_play_blip()
	if int(_chars_shown) >= full.length():
		_scrolling = false
		_jaw.visible = false
		_show_options()


func _build_ui() -> void:
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(dim)

	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	panel.offset_top = -280
	panel.offset_left = 60
	panel.offset_right = -60
	panel.offset_bottom = -30
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.14, 0.13, 0.11)
	style.set_content_margin_all(16)
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 16)
	panel.add_child(row)

	# Talking portrait (greybox bust: initial letter + jaw-flap rect)
	var portrait_col := VBoxContainer.new()
	row.add_child(portrait_col)
	_portrait = Panel.new()
	_portrait.custom_minimum_size = Vector2(140, 160)
	portrait_col.add_child(_portrait)
	_portrait_letter = Label.new()
	_portrait_letter.text = str(_npc.get("name", "?")).left(1)
	_portrait_letter.add_theme_font_size_override("font_size", 80)
	_portrait_letter.set_anchors_preset(Control.PRESET_CENTER)
	_portrait.add_child(_portrait_letter)
	_jaw = ColorRect.new()
	_jaw.color = Color(0.85, 0.72, 0.35)
	_jaw.size = Vector2(40, 10)
	_jaw.position = Vector2(50, 130)
	_portrait.add_child(_jaw)
	_speaker_label = Label.new()
	_speaker_label.text = "%s — %s" % [_npc.get("name", "?"), _npc.get("role", "")]
	_speaker_label.add_theme_font_size_override("font_size", 13)
	portrait_col.add_child(_speaker_label)

	var text_col := VBoxContainer.new()
	text_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_col.add_theme_constant_override("separation", 10)
	row.add_child(text_col)
	_text_label = Label.new()
	_text_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_text_label.add_theme_font_size_override("font_size", 16)
	_text_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	text_col.add_child(_text_label)
	_options_box = VBoxContainer.new()
	_options_box.add_theme_constant_override("separation", 6)
	text_col.add_child(_options_box)

	_blip_player = AudioStreamPlayer.new()
	add_child(_blip_player)


func _current_node() -> Dictionary:
	return _tree.get("nodes", {}).get(_node_id, {})


func _enter_node(node_id: String) -> void:
	if node_id == "_end" or node_id == "":
		_finish()
		return
	_node_id = node_id
	var node := _current_node()
	if node.is_empty():
		push_warning("Missing dialogue node: " + node_id)
		_finish()
		return
	ReputationLedger.apply_effects(node.get("on_enter_effects", []))
	for c in _options_box.get_children():
		c.queue_free()
	_chars_shown = 0.0
	_text_label.text = ""
	_scrolling = true


func _show_options() -> void:
	var node := _current_node()
	for option in node.get("options", []):
		var req: Dictionary = option.get("requires", {})
		var bg_req: String = req.get("background", "")
		var gated := bg_req != "" and bg_req != GameState.background_id
		var label: String = option.get("text", "")
		var check: Dictionary = option.get("check", {})
		if option.has("label"):
			label = "%s %s" % [option.label, label]
		if not check.is_empty():
			label += "  — %d%% success" % int(check.get("odds", 0.5) * 100)
		var b := Button.new()
		b.text = label
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		if gated:
			# Visible-but-locked, with the reason (UI_SPEC §2)
			b.disabled = true
			b.text += "   [needs %s]" % DataLoader.get_background(bg_req).get("name", bg_req)
		else:
			b.pressed.connect(_choose.bind(option))
		_options_box.add_child(b)


func _choose(option: Dictionary) -> void:
	ReputationLedger.apply_effects(option.get("effects", []))
	var check: Dictionary = option.get("check", {})
	if check.is_empty():
		_enter_node(option.get("goto", "_end"))
	else:
		# Odds shown are odds rolled — trust is a design feature (GAMEPLAY_SPEC §2)
		var success := _rng.randf() < float(check.get("odds", 0.5))
		_enter_node(option.get("success" if success else "failure", "_end"))


func _play_blip() -> void:
	# Gibberish audio stub: per-NPC pitch via generator tone. Real Animalese
	# synthesis lands after director approves voice samples (gate #3).
	var voice: Dictionary = _npc.get("voice", {})
	var pitch: float = float(voice.get("base_pitch", 1.0))
	var gen := AudioStreamGenerator.new()
	gen.mix_rate = 22050
	gen.buffer_length = 0.06
	_blip_player.stream = gen
	_blip_player.pitch_scale = pitch * _rng.randf_range(0.95, 1.05)
	_blip_player.volume_db = float(voice.get("volume_db", 0)) - 12.0
	_blip_player.play()
	var playback: AudioStreamGeneratorPlayback = _blip_player.get_stream_playback()
	if playback:
		var frames := int(22050 * 0.05)
		for i in range(mini(frames, playback.get_frames_available())):
			var v := sin(i * 0.35) * 0.25
			playback.push_frame(Vector2(v, v))


func _finish() -> void:
	EventBus.dialogue_finished.emit(tree_id)
	queue_free()


func _gui_input(event: InputEvent) -> void:
	# Click to skip text scroll
	if event is InputEventMouseButton and event.pressed and _scrolling:
		_chars_shown = float(_current_node().get("text", "").length())
