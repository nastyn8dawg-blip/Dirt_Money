export const ART_STATUSES = ["placeholder", "concept", "approved", "final"];
export const ART_DEV_LABELS = false;

function artAsset({
  id,
  displayName,
  type,
  expectedPath,
  conceptPath,
  fallbackPath,
  dimensions,
  status = "placeholder",
  notes
}) {
  return {
    id,
    displayName,
    type,
    expectedPath,
    conceptPath,
    fallbackPath,
    dimensions,
    status,
    notes
  };
}

const farmFallback = "./assets/placeholders/farm/dm_farm_home_overview_placeholder.svg";

const importedFieldConceptIds = new Set([
  "rough",
  "prepped",
  "fallow",
  "harvested",
  "corn_planted",
  "corn_emerged",
  "corn_growing",
  "corn_stressed",
  "corn_ready",
  "corn_harvested",
  "soybeans_planted",
  "soybeans_emerged",
  "soybeans_growing",
  "soybeans_stressed",
  "soybeans_ready",
  "soybeans_harvested",
  "hay_growing",
  "hay_stressed",
  "hay_ready_to_cut",
  "hay_cut",
  "hay_baled",
  "hay_harvested",
  "cover_crop_emerged",
  "cover_crop_growing",
  "cover_crop_stressed",
  "cover_crop_terminated"
]);

const importedFieldOverlayConceptIds = new Set([
  "weeds",
  "drought",
  "storm_damage",
  "wet_muddy",
  "poor_fertility",
  "healthy_fertility"
]);

const importedFarmConceptIds = new Set(["home_overview"]);
const importedMapConceptIds = new Set(["ash_creek_county"]);
const importedLocationConceptSlugs = new Set([
  "pattis_diner",
  "ash_creek_coop",
  "grain_elevator",
  "gus_yard",
  "ash_creek_bank",
  "machine_shed"
]);
const importedCharacterConceptSlugs = new Set([
  "old_school_farmer",
  "it_nephew",
  "mechanic",
  "patti",
  "roy",
  "gus",
  "dee",
  "sandy"
]);

export const ART_MANIFEST = {
  farm: {
    homeOverview: artAsset({
      id: "farm.home_overview",
      displayName: "Home Farm Overview",
      type: "farm_hero",
      expectedPath: "./assets/final/farm/dm_farm_home_overview.png",
      conceptPath: "./assets/concept/farm/dm_farm_home_overview_v01_concept.png",
      fallbackPath: farmFallback,
      dimensions: "1920x1080",
      status: importedFarmConceptIds.has("home_overview") ? "concept" : "placeholder",
      notes: "Imported generated home farm concept art. Fallback SVG remains wired if the image fails to load."
    }),
    dashboardHero: artAsset({
      id: "farm.dashboard_hero",
      displayName: "Farm Dashboard Hero",
      type: "farm_hero",
      expectedPath: "./assets/final/farm/dm_farm_dashboard_hero.png",
      conceptPath: "./assets/concept/farm/dm_farm_dashboard_hero_v01_concept.png",
      fallbackPath: farmFallback,
      dimensions: "1920x1080",
      notes: "Dashboard-specific concept art not imported yet. The dashboard may use farm.home_overview as its preferred fallback."
    }),
    farmhouse: artAsset({
      id: "farm.farmhouse",
      displayName: "Farmhouse",
      type: "farm_detail",
      expectedPath: "./assets/final/farm/dm_farm_farmhouse.png",
      conceptPath: "./assets/concept/farm/dm_farm_farmhouse.png",
      fallbackPath: farmFallback,
      dimensions: "1024x768",
      notes: "Weathered working farmhouse, not cozy fantasy cottage."
    }),
    barn: artAsset({
      id: "farm.barn",
      displayName: "Barn",
      type: "farm_detail",
      expectedPath: "./assets/final/farm/dm_farm_barn.png",
      conceptPath: "./assets/concept/farm/dm_farm_barn.png",
      fallbackPath: farmFallback,
      dimensions: "1024x768",
      notes: "Old barn with barn-red accents and practical wear."
    }),
    machineShed: artAsset({
      id: "farm.machine_shed",
      displayName: "Machine Shed",
      type: "farm_detail",
      expectedPath: "./assets/final/farm/dm_farm_machine_shed.png",
      conceptPath: "./assets/concept/farm/dm_farm_machine_shed_v01_concept.png",
      fallbackPath: "./assets/placeholders/locations/dm_location_machine_shed_placeholder.svg",
      dimensions: "1920x1080",
      notes: "Farm-detail machine shed concept art not imported yet. The location machine shed hero has concept art."
    }),
    drivewayRoad: artAsset({
      id: "farm.driveway_road",
      displayName: "Driveway and Road",
      type: "farm_detail",
      expectedPath: "./assets/final/farm/dm_farm_driveway_road.png",
      conceptPath: "./assets/concept/farm/dm_farm_driveway_road.png",
      fallbackPath: farmFallback,
      dimensions: "1280x720",
      notes: "Gravel drive and county road connection."
    }),
    fieldOverview: artAsset({
      id: "farm.field_overview",
      displayName: "Field Overview",
      type: "farm_detail",
      expectedPath: "./assets/final/farm/dm_farm_field_overview.png",
      conceptPath: "./assets/concept/farm/dm_farm_field_overview.png",
      fallbackPath: farmFallback,
      dimensions: "1280x720",
      notes: "Wide view of fields in the distance for farm overview overlays."
    })
  },
  map: {
    ashCreekCounty: artAsset({
      id: "map.ash_creek_county",
      displayName: "Ash Creek County Map",
      type: "county_map",
      expectedPath: "./assets/final/map/dm_map_ash_creek_county.png",
      conceptPath: "./assets/concept/map/dm_map_ash_creek_county_v01_concept.png",
      fallbackPath: "./assets/placeholders/map/dm_map_ash_creek_county_placeholder.svg",
      dimensions: "1920x1080",
      status: importedMapConceptIds.has("ash_creek_county") ? "concept" : "placeholder",
      notes: "Imported generated Ash Creek County map concept art. UI-rendered location nodes remain layered on top."
    }),
    markers: artAsset({
      id: "map.markers",
      displayName: "Map Markers and Nodes",
      type: "map_marker",
      expectedPath: "./assets/final/map/dm_map_markers.png",
      conceptPath: "./assets/concept/map/dm_map_markers.png",
      fallbackPath: "./assets/placeholders/icons/field.svg",
      dimensions: "512x512",
      notes: "Optional marker art. Current map nodes are rendered by the UI."
    })
  },
  locations: {
    home_farm: location("home_farm", "Home Farm", "dm_location_home_farm_placeholder.svg"),
    pattis_diner: location("pattis_diner", "Patti's Diner", "dm_location_pattis_diner_placeholder.svg"),
    ash_creek_coop: location("ash_creek_coop", "Ash Creek Farmers Co-op", "dm_location_farmers_coop_placeholder.svg"),
    farmers_coop: location("farmers_coop", "Ash Creek Farmers Co-op", "dm_location_farmers_coop_placeholder.svg", {
      conceptSlug: "ash_creek_coop"
    }),
    grain_elevator: location("grain_elevator", "Grain Elevator", "dm_location_grain_elevator_placeholder.svg"),
    roys_place: location("roys_place", "Roy's Place", "dm_location_roys_place_placeholder.svg"),
    gus_yard: location("gus_yard", "Gus's Yard", "dm_location_guss_yard_placeholder.svg"),
    guss_yard: location("guss_yard", "Gus's Yard", "dm_location_guss_yard_placeholder.svg", {
      conceptSlug: "gus_yard"
    }),
    hollis_place: location("hollis_place", "Hollis's Place", "dm_location_hollis_place_placeholder.svg"),
    ash_creek_bank: location("ash_creek_bank", "Ash Creek Savings / Bank", "dm_location_bank_placeholder.svg"),
    bank: location("bank", "Ash Creek Savings / Bank", "dm_location_bank_placeholder.svg", {
      conceptSlug: "ash_creek_bank"
    }),
    grange_hall: location("grange_hall", "Grange Hall", "dm_location_grange_hall_placeholder.svg"),
    machine_shed: location("machine_shed", "Machine Shed", "dm_location_machine_shed_placeholder.svg")
  },
  characters: {
    old_school_farmer: character(
      "old_school_farmer",
      "Old School Farmer",
      "dm_character_old_school_farmer_portrait_placeholder.svg"
    ),
    old_school: character("old_school", "Old School Farmer", "dm_character_old_school_farmer_portrait_placeholder.svg", {
      conceptSlug: "old_school_farmer"
    }),
    it_nephew: character("it_nephew", "IT Nephew", "dm_character_it_nephew_portrait_placeholder.svg"),
    mechanic: character("mechanic", "Mechanic", "dm_character_mechanic_portrait_placeholder.svg"),
    patti: character("patti", "Patti", "dm_character_patti_portrait_placeholder.svg"),
    hollis: character("hollis", "Hollis", "dm_character_hollis_portrait_placeholder.svg"),
    marge: character("marge", "Marge", "dm_character_marge_portrait_placeholder.svg"),
    earl: character("earl", "Earl", "dm_character_earl_portrait_placeholder.svg"),
    roy: character("roy", "Roy", "dm_character_roy_portrait_placeholder.svg"),
    gus: character("gus", "Gus", "dm_character_gus_portrait_placeholder.svg"),
    dee: character("dee", "Dee", "dm_character_dee_portrait_placeholder.svg"),
    sandy: character("sandy", "Sandy", "dm_character_sandy_portrait_placeholder.svg")
  },
  fields: {
    rough: field("rough", "Rough Field", "dm_field_rough_placeholder.svg"),
    prepped: field("prepped", "Prepped Field", "dm_field_prepped_placeholder.svg"),
    fallow: field("fallow", "Fallow Field", "dm_field_fallow_placeholder.svg"),
    harvested: field("harvested", "Harvested Field", "dm_field_harvested_placeholder.svg"),

    planted: field("planted", "Generic Planted Field", "dm_field_planted_placeholder.svg"),
    emerged: field("emerged", "Generic Emerged Field", "dm_field_emerged_placeholder.svg"),
    growing: field("growing", "Generic Growing Field", "dm_field_growing_placeholder.svg"),
    stressed: field("stressed", "Generic Stressed Field", "dm_field_stressed_placeholder.svg"),
    ready: field("ready", "Generic Ready Field", "dm_field_ready_placeholder.svg"),

    corn_planted: field("corn_planted", "Corn Planted", "dm_field_planted_placeholder.svg"),
    corn_emerged: field("corn_emerged", "Corn Emerged", "dm_field_emerged_placeholder.svg"),
    corn_growing: field("corn_growing", "Corn Growing", "dm_field_growing_placeholder.svg"),
    corn_stressed: field("corn_stressed", "Corn Stressed", "dm_field_stressed_placeholder.svg"),
    corn_ready: field("corn_ready", "Ready Corn", "dm_field_corn_ready_placeholder.svg"),
    corn_harvested: field("corn_harvested", "Corn Harvested", "dm_field_harvested_placeholder.svg"),

    soybeans_planted: field("soybeans_planted", "Soybeans Planted", "dm_field_planted_placeholder.svg"),
    soybeans_emerged: field("soybeans_emerged", "Soybeans Emerged", "dm_field_emerged_placeholder.svg"),
    soybeans_growing: field("soybeans_growing", "Soybeans Growing", "dm_field_growing_placeholder.svg"),
    soybeans_stressed: field("soybeans_stressed", "Soybeans Stressed", "dm_field_stressed_placeholder.svg"),
    soybeans_ready: field("soybeans_ready", "Ready Soybeans", "dm_field_soybeans_ready_placeholder.svg"),
    soybeans_harvested: field("soybeans_harvested", "Soybeans Harvested", "dm_field_harvested_placeholder.svg"),

    hay_growing: field("hay_growing", "Hay Growing", "dm_field_growing_placeholder.svg"),
    hay_stressed: field("hay_stressed", "Hay Stressed", "dm_field_stressed_placeholder.svg"),
    hay_ready_to_cut: field("hay_ready_to_cut", "Hay Ready to Cut", "dm_field_hay_ready_placeholder.svg"),
    hay_cut: field("hay_cut", "Hay Cut", "dm_field_hay_ready_placeholder.svg"),
    hay_baled: field("hay_baled", "Hay Baled", "dm_field_hay_ready_placeholder.svg"),
    hay_harvested: field("hay_harvested", "Hay Harvested", "dm_field_harvested_placeholder.svg"),

    cover_crop_emerged: field("cover_crop_emerged", "Cover Crop Emerged", "dm_field_emerged_placeholder.svg"),
    cover_crop_growing: field("cover_crop_growing", "Cover Crop Growing", "dm_field_growing_placeholder.svg"),
    cover_crop_stressed: field("cover_crop_stressed", "Cover Crop Stressed", "dm_field_stressed_placeholder.svg"),
    cover_crop_terminated: field("cover_crop_terminated", "Cover Crop Terminated", "dm_field_harvested_placeholder.svg")
  },
  fieldOverlays: {
    weeds: fieldOverlay("weeds", "Weeds Overlay", "dm_field_rough_placeholder.svg"),
    drought: fieldOverlay("drought", "Drought Overlay", "dm_field_stressed_placeholder.svg"),
    storm_damage: fieldOverlay("storm_damage", "Storm Damage Overlay", "dm_field_stressed_placeholder.svg"),
    wet_muddy: fieldOverlay("wet_muddy", "Wet Muddy Overlay", "dm_field_rough_placeholder.svg"),
    poor_fertility: fieldOverlay("poor_fertility", "Poor Fertility Overlay", "dm_field_stressed_placeholder.svg"),
    healthy_fertility: fieldOverlay("healthy_fertility", "Healthy Fertility Overlay", "dm_field_growing_placeholder.svg")
  }
};

function location(id, displayName, placeholderFile, { conceptSlug = id, expectedSlug = conceptSlug } = {}) {
  const hasConcept = importedLocationConceptSlugs.has(conceptSlug);
  return artAsset({
    id: `location.${id}`,
    displayName,
    type: "location_hero",
    expectedPath: `./assets/final/locations/dm_location_${expectedSlug}.png`,
    conceptPath: `./assets/concept/locations/dm_location_${conceptSlug}_v01_concept.png`,
    fallbackPath: `./assets/placeholders/locations/${placeholderFile}`,
    dimensions: "1920x1080",
    status: hasConcept ? "concept" : "placeholder",
    notes: hasConcept
      ? "Imported generated location concept art. Keep functional names and labels rendered by the UI."
      : "Location concept art not imported yet. Uses placeholder fallback until generated art is available."
  });
}

function character(id, displayName, placeholderFile, { conceptSlug = id, expectedSlug = conceptSlug } = {}) {
  const hasConcept = importedCharacterConceptSlugs.has(conceptSlug);
  return artAsset({
    id: `character.${id}`,
    displayName,
    type: "character_portrait",
    expectedPath: `./assets/final/characters/dm_character_${expectedSlug}_portrait.png`,
    conceptPath: `./assets/concept/characters/dm_character_${conceptSlug}_portrait_v01_concept.png`,
    fallbackPath: `./assets/placeholders/characters/${placeholderFile}`,
    dimensions: "768x1024",
    status: hasConcept ? "concept" : "placeholder",
    notes: hasConcept
      ? "Imported generated portrait concept art. Use approved references later to avoid character drift."
      : "Portrait concept art not imported yet. Uses placeholder fallback until generated art is available."
  });
}

function field(id, displayName, placeholderFile) {
  const hasConcept = importedFieldConceptIds.has(id);
  return artAsset({
    id: `field.${id}`,
    displayName,
    type: "field_state",
    expectedPath: `./assets/final/fields/dm_field_${id}.png`,
    conceptPath: `./assets/concept/fields/dm_field_${id}_v01_concept.png`,
    fallbackPath: `./assets/placeholders/fields/${placeholderFile}`,
    dimensions: "1920x1080",
    status: hasConcept ? "concept" : "placeholder",
    notes: hasConcept
      ? "Imported generated field concept art. Fallback SVG remains wired if the image fails to load."
      : "Concept art not imported yet. Uses placeholder fallback until generated art is available."
  });
}

function fieldOverlay(id, displayName, placeholderFile) {
  const hasConcept = importedFieldOverlayConceptIds.has(id);
  return artAsset({
    id: `field_overlay.${id}`,
    displayName,
    type: "field_overlay",
    expectedPath: `./assets/final/fields/overlays/dm_overlay_${id}.png`,
    conceptPath: `./assets/concept/fields/overlays/dm_overlay_${id}_v01_concept.png`,
    fallbackPath: `./assets/placeholders/fields/${placeholderFile}`,
    dimensions: "1920x1080",
    status: hasConcept ? "concept" : "placeholder",
    notes: hasConcept
      ? "Imported generated field-condition overlay concept art. Prefer transparent PNG art when final overlays are introduced."
      : "Optional field-condition overlay not imported yet. Prefer transparent PNG art when final overlays are introduced."
  });
}

export function allArtAssets() {
  return Object.values(ART_MANIFEST).flatMap((group) => Object.values(group));
}

export function getArtAsset(id) {
  return allArtAssets().find((asset) => asset.id === id) ?? null;
}

export function resolveArtAsset(id) {
  const asset = getArtAsset(id);
  if (!asset) {
    return {
      id,
      displayName: "Missing Art Asset",
      type: "missing",
      expectedPath: "",
      conceptPath: "",
      fallbackPath: ART_MANIFEST.farm.homeOverview.fallbackPath,
      dimensions: "1920x1080",
      status: "placeholder",
      notes: "Unknown asset id; using home farm placeholder.",
      src: ART_MANIFEST.farm.homeOverview.fallbackPath,
      isPlaceholder: true
    };
  }

  const src =
    asset.status === "final" || asset.status === "approved"
      ? asset.expectedPath
      : asset.status === "concept"
        ? asset.conceptPath
        : asset.fallbackPath;

  return {
    ...asset,
    src,
    isPlaceholder: src === asset.fallbackPath || asset.status === "placeholder"
  };
}
