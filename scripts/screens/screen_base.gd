class_name ScreenBase
extends Control
## Shared UI base. Dress-pass rules (Director, 2026-07-03): readability first,
## Ash Creek tone second, style third, animation last. County office paperwork,
## farm ledger, co-op board — worn, practical, legible. Never parchment,
## never slick, never cute. Palette: docs/DIRT_MONEY_ART_DIRECTION.md.

const BG_COLOR := Color("241c14")        # deep coffee — the desk
const PANEL_COLOR := Color("362a1e")     # coffee — the paperwork
const PANEL_BORDER := Color("5c5f63")    # weathered steel, dimmed
const ACCENT := Color("c79a3b")          # harvest gold — stamps and headers
const CREAM := Color("f2e9d8")           # ink on dark stock
const WARN := Color("c75a4a")            # barn red, lifted for dark ground
const GOOD := Color("8faf8a")            # sage — things going right
const INFO := Color("6e86a0")            # faded denim — data and dashboards
const MUTED := Color("8c8478")           # warm gray — margin notes


static func build_theme() -> Theme:
	var t := Theme.new()
	var btn := StyleBoxFlat.new()
	btn.bg_color = Color("463421")
	btn.border_color = PANEL_BORDER
	btn.set_border_width_all(1)
	btn.set_corner_radius_all(2)
	btn.set_content_margin_all(8)
	btn.content_margin_left = 12
	btn.content_margin_right = 12
	var btn_hover := btn.duplicate()
	btn_hover.bg_color = Color("57452c")
	btn_hover.border_color = ACCENT
	var btn_pressed := btn.duplicate()
	btn_pressed.bg_color = Color("2c2115")
	var btn_disabled := btn.duplicate()
	btn_disabled.bg_color = Color("32281d")
	btn_disabled.border_color = Color("4a453e")
	t.set_stylebox("normal", "Button", btn)
	t.set_stylebox("hover", "Button", btn_hover)
	t.set_stylebox("pressed", "Button", btn_pressed)
	t.set_stylebox("disabled", "Button", btn_disabled)
	t.set_stylebox("focus", "Button", StyleBoxEmpty.new())
	t.set_color("font_color", "Button", CREAM)
	t.set_color("font_hover_color", "Button", CREAM)
	t.set_color("font_pressed_color", "Button", ACCENT)
	t.set_color("font_disabled_color", "Button", MUTED)
	t.set_color("font_color", "Label", CREAM)
	var sep := StyleBoxLine.new()
	sep.color = Color("4a453e")
	sep.thickness = 1
	t.set_stylebox("separator", "HSeparator", sep)
	return t


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
	style.border_color = PANEL_BORDER
	style.set_border_width_all(1)
	style.set_corner_radius_all(2)
	style.set_content_margin_all(14)
	p.add_theme_stylebox_override("panel", style)
	parent.add_child(p)
	return p


func make_label(parent: Control, text: String, size: int = 16, color: Color = CREAM) -> Label:
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


func add_salvage_project_block(parent: Control, idx: int, wrap_width: int, on_change: Callable) -> void:
	# Director required fix (2026-07-04): after buying salvage the player must
	# always see what they own, where it sits, what it needs, and who buys it.
	# One renderer, shown identically at Gus's yard and the machine shed.
	# [Claude-drafted strings — placeholder pending Director pass]
	var p: Dictionary = GameState.salvage_projects[idx]
	var deal: Dictionary = GameState.salvage_deal(p.deal_id)
	var needed: int = int(deal.restore_blocks) + int(p.extra_blocks)
	var left: int = maxi(0, needed - int(p.blocks_done))
	var ready := GameState.salvage_ready_to_sell(idx)
	var tier := GameState.roy_pricing_tier()
	var offer := int(round(float(deal.base_sale_value) * float(tier.mult)))

	var line := func(text: String, size: int, color: Color) -> void:
		var l := make_label(parent, text, size, color)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		if wrap_width > 0:
			l.custom_minimum_size.x = wrap_width

	line.call("%s — bought from Gus, $%d" % [deal.name, int(deal.buy_price)], 15, ACCENT)
	var status := "restored — ready to sell"
	if not ready:
		status = "unrestored" if int(p.blocks_done) == 0 else "restoring — %d of %d sessions done" % [int(p.blocks_done), needed]
	line.call("Status: %s" % status, 13, GOOD if ready else CREAM)
	line.call("Where: your machine shed", 13, CREAM)
	if p.hidden_hit:
		line.call("Found the painted-over problem. Parts and time both got worse.", 13, WARN)
	if GameState.background_id == "mechanic":
		line.call("Estimated parts: %s%s" % [
			deal.get("mechanic_read", {}).get("parts_range", "?"),
			" — already paid" if p.parts_paid else ""], 13, INFO)
	else:
		line.call("Parts: %s" % ("paid" if p.parts_paid else "unknown till you open it up"), 13, INFO)
	if not ready:
		line.call("Time: %d work session(s) left, one time block each" % left, 13, INFO)
	line.call("Buyer: Roy — his offer today: $%d (%s pricing)" % [offer, tier.tier], 13, INFO)
	if ready:
		make_button(parent, "Next action: truck it to Roy — $%d" % offer, func():
			GameState.sell_salvage(idx)
			on_change.call())
	else:
		make_button(parent, "Next action: put in a work session — costs a time block", func():
			CalendarManager.spend_block()
			GameState.work_salvage(idx)
			on_change.call())
