extends ScreenBase
## Grange Hall jobs board (2026-07-06): county day labor. Downtime is the
## point — and downtime is choosing WHICH work, not having none. A block of
## work pays cash today and a handshake the county remembers.
## [AI prose throughout — Director curation]

var _list: VBoxContainer


func _ready() -> void:
	add_background()
	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 40
	root.offset_right = -40
	root.offset_top = 30
	root.offset_bottom = -30
	root.add_theme_constant_override("separation", 12)
	add_child(root)

	make_label(root, "GRANGE HALL — WORK POSTED", 32, ACCENT)
	make_label(root, "Day %d (%s) — a job takes a block of the day. Cash on the spot; the county keeps its own books." % [
		CalendarManager.day, CalendarManager.weekday_name()], 13, ScreenBase.MUTED)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	root.add_child(scroll)
	_list = VBoxContainer.new()
	_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_list.add_theme_constant_override("separation", 10)
	scroll.add_child(_list)

	make_button(root, "Back to Farm", func(): go("farm_hud"))
	_rebuild()


func _rebuild() -> void:
	for c in _list.get_children():
		c.queue_free()
	var jobs := GameState.available_jobs()
	if jobs.is_empty():
		var l := make_label(_list, "Nothing on the board today. The corkboard's mostly church suppers and a lost dog.", 14, ScreenBase.MUTED)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		return
	for job in jobs:
		var panel := make_panel(_list)
		var col := VBoxContainer.new()
		col.add_theme_constant_override("separation", 4)
		panel.add_child(col)
		var giver_name: String = DataLoader.get_npc(job.get("giver", "")).get("name", job.get("giver", ""))
		make_label(col, "%s   —   $%d" % [job.get("name", "?"), GameState.job_pay(job)], 16, ACCENT)
		var blurb := make_label(col, "%s   (posted by %s)" % [job.get("blurb", ""), giver_name], 13, CREAM)
		blurb.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		var b := make_button(col, "Take it — a block of work", _work.bind(job))
		b.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN


func _work(job: Dictionary) -> void:
	var result := GameState.work_job(job.get("id", ""))
	if result.is_empty():
		_rebuild()
		return
	CalendarManager.spend_block()
	for c in _list.get_children():
		c.queue_free()
	var panel := make_panel(_list)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 6)
	panel.add_child(col)
	make_label(col, "+$%d" % int(result.get("pay", 0)), 22, ScreenBase.GOOD)
	var line := make_label(col, str(result.get("done_line", "")), 14, CREAM)
	line.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	make_button(col, "Back to the board", func(): _rebuild())
