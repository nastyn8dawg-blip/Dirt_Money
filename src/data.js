export const STORAGE_KEY = "dirt-money-save-v1";
export const SETTINGS_KEY = "dirt-money-settings-v1";

export const PALETTE = {
  coffeeBlack: "#15110C",
  burntCoffee: "#241A12",
  darkWalnut: "#332418",
  weatheredLeather: "#4A3321",
  warmCream: "#E8D8B8",
  dustGray: "#9A907F",
  harvestGold: "#D6A73A",
  barnRed: "#A64A35",
  countyGreen: "#7FA36A",
  steelBlue: "#6F8794",
  agedBrass: "#8A6A35",
  ashGray: "#5D5850"
};

export const BALANCE = {
  maxWeeks: 36,
  interestEveryWeeks: 4,
  weeklyInterestRate: 0.016,
  operatingNoteWarning: 0.75,
  seedFertilityImpact: 8,
  weedGrowthBase: 6,
  stressWeatherImpact: 9,
  poorEquipmentThreshold: 42,
  minimumHarvestCondition: 22,
  maxLog: 100,
  fertilizerBase: 210,
  fertilizerPerAcre: 5,
  weedTreatmentBase: 165,
  weedTreatmentPerAcre: 3,
  soilTestCost: 40,
  repairCreditPremiumRate: 0.1,
  contractBoardTarget: 5,
  contractArchiveWeeks: 2,
  contractRefreshMinWeeks: 1,
  contractRefreshMaxWeeks: 3,
  eventChance: 0.38
};

export const BACKGROUNDS = {
  old_school: {
    id: "old_school",
    name: "Old School Farmer",
    subtitle: "Local trust, field sense, debt caution.",
    description:
      "You know soil by smell and older locals by first name. Markets and paperwork still grind at you.",
    startingCash: 1650,
    startingDebt: 38500,
    creditLimit: 8500,
    startingReputation: 58,
    modifiers: {
      cropYield: 1.06,
      cropInsight: 9,
      marketSight: -1,
      repairCost: 1,
      salvageValue: 1,
      startingParts: 1
    },
    perkText: "+6% crop yield, stronger local reputation, starts with 1 salvage part."
  },
  it_nephew: {
    id: "it_nephew",
    name: "IT Nephew",
    subtitle: "Better forecasts, weaker county trust.",
    description:
      "You inherited the place with spreadsheets and signal bars. The county has not decided what to make of you.",
    startingCash: 1950,
    startingDebt: 42000,
    creditLimit: 9500,
    startingReputation: 44,
    modifiers: {
      cropYield: 1,
      cropInsight: 3,
      marketSight: 2,
      repairCost: 1.05,
      salvageValue: 0.98,
      startingParts: 0
    },
    perkText: "Sees sharper market/weather notes and starts with a larger operating line."
  },
  mechanic: {
    id: "mechanic",
    name: "Mechanic",
    subtitle: "Cheaper repairs, better salvage judgment.",
    description:
      "Engines make sense to you. Crop timing is still a lesson the county keeps charging for.",
    startingCash: 1450,
    startingDebt: 36000,
    creditLimit: 8000,
    startingReputation: 50,
    modifiers: {
      cropYield: 0.98,
      cropInsight: 2,
      marketSight: 0,
      repairCost: 0.74,
      salvageValue: 1.18,
      startingParts: 3
    },
    perkText: "-26% equipment repair cost, better salvage flip odds, starts with 3 parts."
  }
};

export const CROP_TYPES = {
  corn: {
    id: "corn",
    name: "Corn",
    unit: "bu",
    plantCost: 420,
    harvestCost: 720,
    baseYield: 98,
    basePrice: 4.38,
    stages: [
      { name: "Seeded", weeks: 1 },
      { name: "Vegetative", weeks: 3 },
      { name: "Tasseling", weeks: 2 },
      { name: "Drydown", weeks: 2 },
      { name: "Ready to Harvest", weeks: 99 }
    ],
    recommendation: "Corn pays if fertility stays up and weather does not rough it up late."
  },
  soybeans: {
    id: "soybeans",
    name: "Soybeans",
    unit: "bu",
    plantCost: 330,
    harvestCost: 560,
    baseYield: 35,
    basePrice: 11.2,
    stages: [
      { name: "Seeded", weeks: 1 },
      { name: "Leafing", weeks: 2 },
      { name: "Pod Set", weeks: 3 },
      { name: "Maturing", weeks: 2 },
      { name: "Ready to Harvest", weeks: 99 }
    ],
    recommendation: "Beans tolerate rougher ground, but weeds steal the year from you."
  },
  winter_wheat: {
    id: "winter_wheat",
    name: "Winter Wheat",
    unit: "bu",
    plantCost: 260,
    harvestCost: 440,
    baseYield: 48,
    basePrice: 5.7,
    stages: [
      { name: "Seeded", weeks: 1 },
      { name: "Tillering", weeks: 2 },
      { name: "Heading", weeks: 2 },
      { name: "Drydown", weeks: 1 },
      { name: "Ready to Harvest", weeks: 99 }
    ],
    recommendation: "Wheat is modest money, but it gets cash moving sooner."
  },
  hay: {
    id: "hay",
    name: "Hay",
    unit: "tons",
    plantCost: 210,
    harvestCost: 360,
    baseYield: 3.4,
    basePrice: 105,
    stages: [
      { name: "Seeded", weeks: 1 },
      { name: "Standing", weeks: 2 },
      { name: "Heavy", weeks: 2 },
      { name: "Ready to Cut", weeks: 99 }
    ],
    recommendation: "Hay is steady work and plays well with neighbor contracts."
  }
};

export const FIELD_TEMPLATES = [
  {
    id: "south_40",
    name: "South 40",
    acres: 40,
    soil: 72,
    fertility: 58,
    weeds: 22,
    stress: 18,
    condition: 68,
    note: "Good loam, but last year left it hungry."
  },
  {
    id: "creek_bottom",
    name: "Creek Bottom",
    acres: 28,
    soil: 63,
    fertility: 66,
    weeds: 34,
    stress: 14,
    condition: 64,
    note: "Productive ground when rain does not sit in it."
  },
  {
    id: "hill_patch",
    name: "Hill Patch",
    acres: 22,
    soil: 49,
    fertility: 45,
    weeds: 29,
    stress: 31,
    condition: 47,
    note: "Thin hillside ground. Cheap to work, easy to punish."
  }
];

export const EQUIPMENT_TEMPLATES = [
  {
    id: "tractor",
    name: "1978 Row-Crop Tractor",
    role: "planting, spraying, and hauling",
    condition: 61,
    repairBase: 360,
    risk: "Low gears slip under load. Field work costs more below 40%."
  },
  {
    id: "combine",
    name: "Faded Gleaner Combine",
    role: "harvest",
    condition: 46,
    repairBase: 620,
    risk: "Below 42%, harvest losses climb and breakdown warnings start."
  },
  {
    id: "grain_truck",
    name: "Single-Axle Grain Truck",
    role: "grain hauling and delivery contracts",
    condition: 54,
    repairBase: 420,
    risk: "Rattles hard. Delivery jobs may fail if it drops too low."
  }
];

export const SALVAGE_MARKET_TEMPLATES = [
  {
    id: "baler_needle",
    name: "Box of Baler Needles",
    cost: 95,
    condition: 64,
    scrapValue: 80,
    flipValue: 215,
    repairCost: 55,
    partsYield: 2,
    risk: 0.18,
    helps: ["tractor"],
    note: "Ugly parts, but the steel is honest."
  },
  {
    id: "truck_axle",
    name: "Salvaged Truck Axle",
    cost: 180,
    condition: 48,
    scrapValue: 155,
    flipValue: 420,
    repairCost: 120,
    partsYield: 3,
    risk: 0.32,
    helps: ["grain_truck"],
    note: "Gus says it came off running. Gus says a lot."
  },
  {
    id: "combine_belt_lot",
    name: "Combine Belt Lot",
    cost: 140,
    condition: 52,
    scrapValue: 90,
    flipValue: 310,
    repairCost: 80,
    partsYield: 3,
    risk: 0.26,
    helps: ["combine"],
    note: "Half useful, half mystery rubber."
  },
  {
    id: "irrigation_pump",
    name: "Old Irrigation Pump",
    cost: 240,
    condition: 41,
    scrapValue: 185,
    flipValue: 520,
    repairCost: 165,
    partsYield: 4,
    risk: 0.42,
    helps: ["tractor", "grain_truck"],
    note: "Could be a profit. Could be a lesson."
  }
];

export const CONTRACT_TEMPLATES = [
  {
    id: "hollis_hay",
    title: "Custom Hay Work for Hollis",
    source: "Hollis",
    locationId: "hollis_place",
    npcId: "hollis",
    description: "Hollis needs a small hay field cut before weather turns.",
    deadlineWeeks: 3,
    durationWeeks: 1,
    reward: 520,
    reputation: 4,
    requirementText: "Tractor condition 38% or better; $70 fuel.",
    requirements: { equipment: { tractor: 38 }, cashCost: 70 },
    wear: { tractor: 4 },
    risk: "Weather can take this away if you let it sit.",
    minReputation: 35,
    consequence: "Failing costs local trust with older farmers."
  },
  {
    id: "coop_delivery",
    title: "Co-op Seed Delivery",
    source: "Marge",
    locationId: "farmers_coop",
    npcId: "marge",
    description: "Marge needs seed hauled out to three farms before Friday.",
    deadlineWeeks: 2,
    durationWeeks: 1,
    reward: 380,
    reputation: 3,
    requirementText: "Grain truck condition 45% or better; $45 fuel.",
    requirements: { equipment: { grain_truck: 45 }, cashCost: 45 },
    wear: { grain_truck: 5 },
    risk: "A rough truck can turn a simple favor into a missed route.",
    minReputation: 30,
    consequence: "The co-op remembers missed favors."
  },
  {
    id: "roy_repair_favor",
    title: "Roy's Repair Favor",
    source: "Roy",
    locationId: "roys_place",
    npcId: "roy",
    description: "Roy found an old drill press motor. Help him rebuild it for future parts access.",
    deadlineWeeks: 4,
    durationWeeks: 1,
    reward: 260,
    reputation: 4,
    requirementText: "2 salvage parts.",
    requirements: { parts: 2 },
    risk: "Low cash, good relationship value.",
    minReputation: 25,
    consequence: "Roy keeps the good shelves closed for a while."
  },
  {
    id: "elevator_emergency",
    title: "Emergency Harvest Help",
    source: "Dee",
    locationId: "grain_elevator",
    npcId: "dee",
    description: "A neighbor's truck broke down at the elevator. Run a short harvest haul.",
    deadlineWeeks: 2,
    durationWeeks: 1,
    reward: 680,
    reputation: 5,
    requirementText: "Combine 42% and grain truck 40% or better; $90 fuel.",
    requirements: { equipment: { combine: 42, grain_truck: 40 }, cashCost: 90 },
    wear: { combine: 5, grain_truck: 4 },
    risk: "Good pay, but it wears the machines you need for your own crop.",
    minReputation: 45,
    consequence: "People stop calling when help matters."
  },
  {
    id: "grange_supper",
    title: "Grange Hall Supper Setup",
    source: "Sandy",
    locationId: "grange_hall",
    npcId: "sandy",
    description: "Sandy needs tables hauled and coolers repaired before the county supper.",
    deadlineWeeks: 3,
    durationWeeks: 0,
    instant: true,
    reward: 210,
    reputation: 6,
    requirementText: "1 salvage part or $80 cash.",
    requirements: { partsOrCash: { parts: 1, cash: 80 } },
    risk: "Small money, strong county standing.",
    minReputation: 0,
    consequence: "No one starves, but they know who showed up."
  },
  {
    id: "bank_records",
    title: "Bank Records Cleanup",
    source: "Earl",
    locationId: "bank",
    npcId: "earl",
    description: "Earl needs old lien records hauled from storage and sorted before audit week.",
    deadlineWeeks: 3,
    durationWeeks: 1,
    reward: 300,
    reputation: 2,
    requirementText: "No equipment required; $35 fuel.",
    requirements: { cashCost: 35 },
    risk: "Not glamorous, but it softens the bank conversation.",
    minReputation: 20,
    consequence: "Earl keeps the note conversation short."
  },
  {
    id: "drought_water_run",
    title: "Drought Water Run",
    source: "Patti",
    locationId: "pattis_diner",
    npcId: "patti",
    description: "A few neighbors need water hauled to tanks before the heat gets worse.",
    deadlineWeeks: 2,
    durationWeeks: 1,
    reward: 430,
    reputation: 5,
    requirementText: "Grain truck condition 42% or better; $75 fuel.",
    requirements: { equipment: { grain_truck: 42 }, cashCost: 75 },
    wear: { grain_truck: 4 },
    risk: "Useful work when drought is already stressing fields.",
    minReputation: 40,
    consequence: "Neighbors remember who stayed home."
  },
  {
    id: "salvage_flip_order",
    title: "Salvage Flip Order",
    source: "Gus",
    locationId: "guss_yard",
    npcId: "gus",
    description: "Gus knows a buyer for cleaned-up parts if you bring enough useful salvage.",
    deadlineWeeks: 4,
    durationWeeks: 1,
    reward: 620,
    reputation: 2,
    requirementText: "3 salvage parts.",
    requirements: { parts: 3 },
    risk: "Good cash if you have parts; bad timing if the shed is empty.",
    minReputation: 25,
    consequence: "Gus stops holding the better junk behind the office."
  }
];

export const PROGRESSION_UPGRADES = [
  {
    id: "shop_tools",
    title: "Buy Better Shop Tools",
    type: "Farm improvement",
    locationId: "roys_place",
    cost: 2400,
    reputationRequired: 35,
    description: "A real press, better jacks, and enough organization to stop losing half the afternoon.",
    benefit: "Future repair bills are 8% cheaper."
  },
  {
    id: "gravel_lot",
    title: "Gravel the Machine Lot",
    type: "Farm improvement",
    locationId: "home_farm",
    cost: 1800,
    reputationRequired: 30,
    description: "Less mud around the shed and fewer stuck mornings after rain.",
    benefit: "Wet-week equipment wear is reduced."
  },
  {
    id: "grain_storage",
    title: "Patch Old Grain Storage",
    type: "Farm improvement",
    locationId: "grain_elevator",
    cost: 3200,
    reputationRequired: 40,
    description: "Enough tight storage to stop selling every bushel the minute it hits the truck.",
    benefit: "Stored grain value gets a small basis bump in reports and planning."
  },
  {
    id: "lease_back_20",
    title: "Lease Hollis's Back 20",
    type: "Land opportunity",
    locationId: "hollis_place",
    cost: 5200,
    reputationRequired: 62,
    description: "Hollis will lease twenty usable acres if the county trusts you to care for it.",
    benefit: "Unlocks a new Back 20 field."
  }
];

export const EVENT_TEMPLATES = [
  {
    id: "wet_fields",
    title: "Wet Fields",
    type: "weather",
    weatherIds: ["soaking_rain", "storm_line"],
    minWeek: 2,
    note: "Low ground is too wet to work clean. Harvest and heavy fieldwork should wait.",
    effect: "harvest_delay"
  },
  {
    id: "drought_stretch",
    title: "Drought Stretch",
    type: "weather",
    weatherIds: ["hot_wind", "fair"],
    minWeek: 3,
    note: "The county missed another rain. Stressed crops need attention.",
    effect: "drought"
  },
  {
    id: "storm_damage",
    title: "Storm Damage",
    type: "weather",
    weatherIds: ["storm_line"],
    minWeek: 4,
    note: "Wind and hard rain roughed up the most exposed ready crop.",
    effect: "storm_damage"
  },
  {
    id: "neighbor_request",
    title: "Neighbor Request",
    type: "county",
    weatherIds: ["fair", "cool_snap", "soaking_rain"],
    minWeek: 2,
    note: "A neighbor asked around for help. The contract board should have fresh work.",
    effect: "contract_push"
  },
  {
    id: "bank_pressure",
    title: "Bank Pressure",
    type: "county",
    weatherIds: ["fair", "hot_wind", "cool_snap"],
    minWeek: 5,
    note: "Earl wants the operating note kept honest before it gets away from you.",
    effect: "bank_pressure"
  }
];

export const NPCS = {
  patti: {
    id: "patti",
    name: "Patti",
    role: "Diner owner and county switchboard",
    locationId: "pattis_diner",
    dialogue:
      "Coffee's fresh. If Hollis says the west wind smells wrong, listen before the radio catches up.",
    interaction: "Buy pie for the counter crowd. Reputation +1, Patti relationship +2.",
    effect: "reputation"
  },
  hollis: {
    id: "hollis",
    name: "Hollis",
    role: "Old neighbor with sharp field sense",
    locationId: "hollis_place",
    dialogue:
      "That field is ready. Waiting longer is gambling with weather, and weather does not owe you manners.",
    interaction: "Walk the worst field with Hollis. Field stress -5, relationship +2.",
    effect: "field_stress"
  },
  marge: {
    id: "marge",
    name: "Marge",
    role: "Farmers co-op manager",
    locationId: "farmers_coop",
    dialogue:
      "Fertilizer is not cheap, but neither is starving a field and acting surprised in October.",
    interaction: "Ask for input bids. Market notes improve this week, relationship +2.",
    effect: "market_note"
  },
  earl: {
    id: "earl",
    name: "Earl",
    role: "Ash Creek Savings loan officer",
    locationId: "bank",
    dialogue:
      "I can work with honest numbers. I cannot work with surprises brought in after closing.",
    interaction: "Review the operating note. Debt warning becomes clearer, relationship +2.",
    effect: "bank_note"
  },
  roy: {
    id: "roy",
    name: "Roy",
    role: "Machine shed mechanic",
    locationId: "roys_place",
    dialogue:
      "The part is ugly, not useless. There's a difference, and the difference is usually money.",
    interaction: "Roy adjusts the roughest machine. Lowest equipment condition +4.",
    effect: "equipment_bump"
  },
  gus: {
    id: "gus",
    name: "Gus",
    role: "Salvage yard owner",
    locationId: "guss_yard",
    dialogue:
      "It'll run if you don't ask too many questions. Costs extra if you do.",
    interaction: "Gus drags one more item into view. Salvage yard refreshes.",
    effect: "salvage_refresh"
  },
  dee: {
    id: "dee",
    name: "Dee",
    role: "Grain elevator clerk and weather watcher",
    locationId: "grain_elevator",
    dialogue:
      "The elevator bid moved against you overnight. Might come back. Might not.",
    interaction: "Get the elevator sheet. Crop prices display practical notes.",
    effect: "price_note"
  },
  sandy: {
    id: "sandy",
    name: "Sandy",
    role: "Grange Hall organizer",
    locationId: "grange_hall",
    dialogue:
      "County trust is not a speech. It is showing up twice when the first time was inconvenient.",
    interaction: "Help with a notice board. Reputation +2, relationship +1.",
    effect: "reputation_big"
  }
};

export const LOCATIONS = [
  {
    id: "home_farm",
    name: "Home Farm",
    type: "Farmstead",
    description: "A worn kitchen table, a machine shed, and fields that do not care about excuses.",
    npcIds: [],
    actions: ["dashboard", "fields", "equipment"]
  },
  {
    id: "pattis_diner",
    name: "Patti's Diner",
    type: "County talk",
    description: "Coffee, pie, local news, and the kind of advice that arrives sideways.",
    npcIds: ["patti"],
    actions: ["talk"]
  },
  {
    id: "farmers_coop",
    name: "Ash Creek Farmers Co-op",
    type: "Inputs and job board",
    description: "Seed, fertilizer, chemical, and practical favors pinned beside the coffee pot.",
    npcIds: ["marge"],
    actions: ["contracts", "talk"]
  },
  {
    id: "grain_elevator",
    name: "Grain Elevator",
    type: "Market",
    description: "Scale tickets, bids, dust, and the hard truth of today's price.",
    npcIds: ["dee"],
    actions: ["market", "talk"]
  },
  {
    id: "roys_place",
    name: "Roy's Place",
    type: "Machine work",
    description: "A shop full of old manuals, useful shelves, and machinery language.",
    npcIds: ["roy"],
    actions: ["equipment", "talk"]
  },
  {
    id: "guss_yard",
    name: "Gus's Yard",
    type: "Salvage",
    description: "Rows of sun-faded metal where mistakes and opportunity share a fence line.",
    npcIds: ["gus"],
    actions: ["salvage", "talk"]
  },
  {
    id: "hollis_place",
    name: "Hollis's Place",
    type: "Neighbor farm",
    description: "A careful farmstead where every fix was done twice and paid for once.",
    npcIds: ["hollis"],
    actions: ["talk", "contracts"]
  },
  {
    id: "bank",
    name: "Ash Creek Savings / Bank",
    type: "Debt and credit",
    description: "Quiet carpet, old brass lamps, and numbers that follow you home.",
    npcIds: ["earl"],
    actions: ["bank", "talk"]
  },
  {
    id: "grange_hall",
    name: "Grange Hall",
    type: "Community board",
    description: "County notices, folding chairs, and work that buys more than money.",
    npcIds: ["sandy"],
    actions: ["contracts", "talk"]
  }
];

export const WEATHER_PATTERNS = [
  {
    id: "fair",
    name: "Fair and Dry",
    stress: 3,
    weed: 2,
    fertility: -1,
    note: "Good work weather. Dry enough to move."
  },
  {
    id: "soaking_rain",
    name: "Soaking Rain",
    stress: -3,
    weed: 8,
    fertility: -2,
    note: "Moisture helps crops and wakes every weed in the county."
  },
  {
    id: "hot_wind",
    name: "Hot South Wind",
    stress: 11,
    weed: 1,
    fertility: -3,
    note: "Plants curl, machinery runs hot, and patience gets expensive."
  },
  {
    id: "storm_line",
    name: "Storm Line",
    stress: 8,
    weed: 5,
    fertility: -4,
    harvestLoss: 0.07,
    note: "Waiting on ready crops risks weather loss."
  },
  {
    id: "cool_snap",
    name: "Cool Snap",
    stress: 4,
    weed: -1,
    fertility: -1,
    note: "Slow growth, fewer weeds, and a little time to think."
  }
];
