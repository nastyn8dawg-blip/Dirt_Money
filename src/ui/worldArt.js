import { resolveArtAsset } from "../artManifest.js";

export const FARM_OVERVIEW_ART = resolvePreferredArt("farm.dashboard_hero", "farm.home_overview");
export const COUNTY_MAP_ART = resolveArtAsset("map.ash_creek_county");

const FIELD_STATE_IDS = {
  rough: "field.rough",
  prepped: "field.prepped",
  harvested: "field.harvested",
  fallow: "field.fallow"
};

const GENERIC_CROP_ART = {
  planted: "field.planted",
  emerged: "field.emerged",
  growing: "field.growing",
  stressed: "field.stressed",
  ready: "field.ready",
  harvested: "field.harvested"
};

const CROP_ART_IDS = {
  corn: {
    planted: "field.corn_planted",
    emerged: "field.corn_emerged",
    growing: "field.corn_growing",
    stressed: "field.corn_stressed",
    ready: "field.corn_ready",
    harvested: "field.corn_harvested"
  },
  soybeans: {
    planted: "field.soybeans_planted",
    emerged: "field.soybeans_emerged",
    growing: "field.soybeans_growing",
    stressed: "field.soybeans_stressed",
    ready: "field.soybeans_ready",
    harvested: "field.soybeans_harvested"
  },
  hay: {
    planted: "field.hay_growing",
    emerged: "field.hay_growing",
    growing: "field.hay_growing",
    stressed: "field.hay_stressed",
    ready: "field.hay_ready_to_cut",
    harvested: "field.hay_harvested"
  },
  cover_crop: {
    planted: "field.cover_crop_emerged",
    emerged: "field.cover_crop_emerged",
    growing: "field.cover_crop_growing",
    stressed: "field.cover_crop_stressed",
    ready: "field.cover_crop_terminated",
    harvested: "field.cover_crop_terminated"
  },
  winter_wheat: GENERIC_CROP_ART
};

export function fieldArtFor(field) {
  if (!field.cropId) {
    const harvestedArtId = harvestedCropArtId(field.lastAction);
    if (harvestedArtId) return resolvePreferredArt(harvestedArtId, GENERIC_CROP_ART.harvested);
    if (field.lastAction?.includes("Harvested")) return resolveArtAsset(FIELD_STATE_IDS.harvested);
    if (field.condition < 45 || field.weeds > 45) return resolveArtAsset(FIELD_STATE_IDS.rough);
    return resolveArtAsset(FIELD_STATE_IDS.fallow);
  }

  const cropArt = CROP_ART_IDS[field.cropId] ?? GENERIC_CROP_ART;
  if (field.ready) return resolvePreferredArt(cropArt.ready, GENERIC_CROP_ART.ready);
  if (field.stress > 60 || field.condition < 42) return resolvePreferredArt(cropArt.stressed, GENERIC_CROP_ART.stressed);
  if (field.stageIndex === 0) return resolvePreferredArt(cropArt.planted, GENERIC_CROP_ART.planted);
  if (field.stageIndex === 1) return resolvePreferredArt(cropArt.emerged, GENERIC_CROP_ART.emerged);
  return resolvePreferredArt(cropArt.growing, GENERIC_CROP_ART.growing);
}

function harvestedCropArtId(lastAction = "") {
  const normalized = lastAction.toLowerCase();
  if (!normalized.includes("harvested")) return null;
  if (normalized.includes("corn")) return CROP_ART_IDS.corn.harvested;
  if (normalized.includes("soybean")) return CROP_ART_IDS.soybeans.harvested;
  if (normalized.includes("hay")) return CROP_ART_IDS.hay.harvested;
  return null;
}

function resolvePreferredArt(primaryId, fallbackId) {
  const primary = resolveArtAsset(primaryId);
  if (!primary.isPlaceholder || !fallbackId) return primary;

  const fallback = resolveArtAsset(fallbackId);
  return fallback.isPlaceholder ? primary : fallback;
}

export function locationArtFor(locationId) {
  return resolveArtAsset(`location.${locationId}`);
}

export function characterArtFor(id) {
  return resolveArtAsset(`character.${id}`);
}
