extends ScreenBase
## Ash Creek County node map. A menu with atmosphere (WORLD_SPEC §4).
## Greybox: node buttons; painted map illustration comes later (art gate).

const NODES := [
	{"id": "home", "name": "Home Farm", "screen": "farm_hud"},
	{"id": "elevator", "name": "Grain Elevator", "screen": "market"},
	{"id": "coop", "name": "Co-op / Feed Store", "screen": "contracts"},
	{"id": "bank", "name": "Ash Creek Savings", "tree": "earl_talk"},
	{"id": "dealer", "name": "Carver Equipment", "tree": "roy_talk"},
	{"id": "diner", "name": "The Diner", "tree": "patti_talk"},
	{"id": "neighbor_farm", "name": "Hollis's Place", "tree": "hollis_baler"},
	{"id": "vet", "name": "Vet / Livestock Supply", "tree": "dee_talk"},
	{"id": "salvage", "name": "Weaver Salvage Yard", "tree": "gus_talk"},
	{"id": "grange", "name": "Grange Hall"},
]
const TRAVEL_FUEL_COST := 8


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

	make_label(root, "ASH CREEK COUNTY", 32, ACCENT)
	make_label(root, "Travel costs $%d fuel and a time block. (Greybox — painted map comes later.)" % TRAVEL_FUEL_COST, 13, Color(0.6, 0.6, 0.6))

	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 10)
	grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(grid)

	for node in NODES:
		var b := make_button(grid, node.name, _travel_to.bind(node))
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		# Background-flavored map annotations (UI_SPEC: maps differ per background)
		match GameState.background_id:
			"old_school":
				if node.id == "diner":
					b.text += "   [gossip's fresh]"
			"it_nephew":
				if node.id == "elevator":
					b.text += "   [corn $%.2f]" % EconomyManager.prices.get("corn", 0.0)
			"mechanic":
				if node.id == "salvage":
					b.text += "   [something rusty came in]"

	make_button(root, "Back to Farm", func(): go("farm_hud"))


func _travel_to(node: Dictionary) -> void:
	if node.id != "home":
		GameState.add_cash(-TRAVEL_FUEL_COST)
		CalendarManager.spend_block()
	if node.has("screen"):
		go(node.screen)
	elif node.has("tree"):
		EventBus.dialogue_started.emit(node.tree)
