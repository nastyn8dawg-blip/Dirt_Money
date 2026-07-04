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
var _full_text: String = ""
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
	_enter_node(resolve_rules(_tree.get("entry", []), _tree.get("start", "")))


func resolve_rules(rules: Array, default_goto: String) -> String:
	# County memory routing: first matching rule wins. A rule with no
	# conditions is the fallback. Conditions: if_flag, if_not_flag,
	# if_rep_below {npc, value}, if_county_below.
	for rule in rules:
		if rule.has("if_flag") and not GameState.has_flag(rule.if_flag):
			continue
		if rule.has("if_not_flag") and GameState.has_flag(rule.if_not_flag):
			continue
		if rule.has("if_rep_below") and ReputationLedger.get_rep(rule.if_rep_below.get("npc", "")) >= int(rule.if_rep_below.get("value", 0)):
			continue
		if rule.has("if_rep_at_least") and ReputationLedger.get_rep(rule.if_rep_at_least.get("npc", "")) < int(rule.if_rep_at_least.get("value", 0)):
			continue
		if rule.has("if_county_below") and ReputationLedger.county >= int(rule.if_county_below):
			continue
		return rule.get("goto", default_goto)
	return default_goto


func _process(delta: float) -> void:
	if not _scrolling:
		return
	var rate: float = TEXT_SPEED * float(_npc.get("voice", {}).get("syllable_rate", 4.5)) / 4.5
	var prev := int(_chars_shown)
	_chars_shown = minf(_chars_shown + rate * delta, _full_text.length())
	_text_label.text = _full_text.substr(0, int(_chars_shown))
	_jaw.visible = int(_chars_shown / 4.0) % 2 == 0  # 2-frame jaw flap
	if int(_chars_shown) != prev and prev % 3 == 0:
		_play_blip()
	if int(_chars_shown) >= _full_text.length():
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
	# County paperwork, not RPG parchment: coffee stock, steel edge
	var style := StyleBoxFlat.new()
	style.bg_color = ScreenBase.PANEL_COLOR
	style.border_color = ScreenBase.PANEL_BORDER
	style.set_border_width_all(1)
	style.set_corner_radius_all(2)
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
	_portrait.custom_minimum_size = Vector2(150, 170)
	# Framed and reserved for the painted busts (ART_DIRECTION approval
	# pending) — gold frame on dark ground so the slot reads as intentional
	var frame := StyleBoxFlat.new()
	frame.bg_color = ScreenBase.BG_COLOR
	frame.border_color = ScreenBase.ACCENT
	frame.set_border_width_all(2)
	frame.set_corner_radius_all(2)
	_portrait.add_theme_stylebox_override("panel", frame)
	portrait_col.add_child(_portrait)
	_portrait_letter = Label.new()
	_portrait_letter.text = str(_npc.get("name", "?")).left(1)
	_portrait_letter.add_theme_font_size_override("font_size", 80)
	_portrait_letter.add_theme_color_override("font_color", Color(0.45, 0.40, 0.33))
	_portrait_letter.set_anchors_preset(Control.PRESET_CENTER)
	_portrait.add_child(_portrait_letter)
	_jaw = ColorRect.new()
	_jaw.color = ScreenBase.ACCENT
	_jaw.size = Vector2(40, 10)
	_jaw.position = Vector2(55, 138)
	_portrait.add_child(_jaw)
	_speaker_label = Label.new()
	_speaker_label.text = "%s — %s" % [_npc.get("name", "?"), _npc.get("role", "")]
	_speaker_label.add_theme_font_size_override("font_size", 13)
	_speaker_label.add_theme_color_override("font_color", ScreenBase.ACCENT)
	portrait_col.add_child(_speaker_label)

	var text_col := VBoxContainer.new()
	text_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_col.add_theme_constant_override("separation", 10)
	row.add_child(text_col)
	_text_label = Label.new()
	_text_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_text_label.add_theme_font_size_override("font_size", 16)
	_text_label.add_theme_color_override("font_color", ScreenBase.CREAM)
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
	_full_text = _resolve_text(node)
	for c in _options_box.get_children():
		c.queue_free()
	_chars_shown = 0.0
	_text_label.text = ""
	_scrolling = true


func _resolve_text(node: Dictionary) -> String:
	# Gossip nodes pull from the county-memory banks (data/gossip.json).
	if node.get("gossip_source", false):
		var line := DataLoader.pick_gossip()
		if line != "":
			return line
	# Director-provided variants rotate randomly so replays don't loop.
	var texts: Array = [node.get("text", "")]
	texts.append_array(node.get("variants", []))
	return texts[_rng.randi_range(0, texts.size() - 1)]


func _show_options() -> void:
	var node := _current_node()
	for option in node.get("options", []):
		var req: Dictionary = option.get("requires", {})
		# Memory-gated options are HIDDEN, not teased — the county's memory
		# should feel organic, never like menu content you're missing.
		if req.has("flag") and not GameState.has_flag(req.flag):
			continue
		if req.has("not_flag") and GameState.has_flag(req.not_flag):
			continue
		# Perks unlock conversation paths, not percentages (Pillar 3).
		# Hidden until earned — you don't see the doors you can't open.
		if req.has("perk") and not GameState.has_perk(req.perk):
			continue
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
	if option.has("goto_rules"):
		_enter_node(resolve_rules(option.goto_rules, "_end"))
	elif check.is_empty():
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
		_chars_shown = float(_full_text.length())
