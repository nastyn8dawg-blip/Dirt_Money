# Dirt Money Field Art Import Report

Date: 2026-07-07

## Summary

Imported the available generated field concept images into the manifest-driven art pipeline.

- Source folder checked: `assets/incoming/generated_fields/`
- Result: no files found there
- Additional repo image search found generated field concept PNGs in `assets/final/fields/`
- Imported/moved usable field concepts to: `assets/concept/fields/`
- Overlay destination prepared: `assets/concept/fields/overlays/`
- Unmapped destination prepared: `assets/concept/fields/unmapped/`
- No generated concept images were marked final
- Existing SVG placeholders remain fallback-only

## Images Found

Found 21 generated field concept PNGs:

- `dm_field_rough_v01_concept.png`
- `dm_field_prepped_v01_concept.png`
- `dm_field_fallow_v01_concept.png`
- `dm_field_harvested_v01_concept.png`
- `dm_field_corn_planted_v01_concept.png`
- `dm_field_corn_emerged_v01_concept.png`
- `dm_field_corn_growing_v01_concept.png`
- `dm_field_corn_stressed_v01_concept.png`
- `dm_field_corn_ready_v01_concept.png`
- `dm_field_corn_harvested_v01_concept.png`
- `dm_field_soybeans_planted_v01_concept.png`
- `dm_field_soybeans_emerged_v01_concept.png`
- `dm_field_soybeans_growing_v01_concept.png`
- `dm_field_soybeans_stressed_v01_concept.png`
- `dm_field_soybeans_ready_v01_concept.png`
- `dm_field_soybeans_harvested_v01_concept.png`
- `dm_field_hay_growing_v01_concept.png`
- `dm_field_hay_stressed_v01_concept.png`
- `dm_field_hay_ready_to_cut_v01_concept.png`
- `dm_field_hay_cut_v01_concept.png`
- `dm_field_hay_baled_v01_concept.png`

The files are 1672x941 PNGs. The manifest recommends 1920x1080 for future field art, but the current files are close to 16:9 and render through `object-fit: cover`.

## Images Imported

Imported 21 images into `assets/concept/fields/`.

Renamed images: 0. The available images already matched the required field concept naming convention.

Ambiguous or unmapped files: 0.

## Manifest Mapping

These field keys now use `status: "concept"`:

- `field.rough`
- `field.prepped`
- `field.fallow`
- `field.harvested`
- `field.corn_planted`
- `field.corn_emerged`
- `field.corn_growing`
- `field.corn_stressed`
- `field.corn_ready`
- `field.corn_harvested`
- `field.soybeans_planted`
- `field.soybeans_emerged`
- `field.soybeans_growing`
- `field.soybeans_stressed`
- `field.soybeans_ready`
- `field.soybeans_harvested`
- `field.hay_growing`
- `field.hay_stressed`
- `field.hay_ready_to_cut`
- `field.hay_cut`
- `field.hay_baled`

These expected field keys still use placeholder fallback art:

- `field.hay_harvested`
- `field.cover_crop_emerged`
- `field.cover_crop_growing`
- `field.cover_crop_stressed`
- `field.cover_crop_terminated`

The older generic internal fallback keys also remain placeholder-only:

- `field.planted`
- `field.emerged`
- `field.growing`
- `field.stressed`
- `field.ready`

## Optional Overlays

No overlay images were found or imported.

These optional overlay keys remain placeholder-safe:

- `field_overlay.weeds`
- `field_overlay.drought`
- `field_overlay.storm_damage`
- `field_overlay.wet_muddy`
- `field_overlay.poor_fertility`
- `field_overlay.healthy_fertility`

Future overlay concepts should be placed under `assets/concept/fields/overlays/` with names like:

- `dm_overlay_weeds_v01_concept.png`
- `dm_overlay_drought_v01_concept.png`

## Fallback Behavior

The renderer still resolves art through the manifest:

1. final/approved art when an entry is marked final or approved
2. concept art when an entry is marked concept
3. SVG placeholder fallback when concept/final art is missing

Crop-specific harvested art now falls back to generic harvested art when the crop-specific concept is missing. In this batch, `hay_harvested` is missing, so harvested hay currently displays `field.harvested` concept art before falling back to SVG.

## Next Images Needed

Priority missing field concepts:

- `dm_field_hay_harvested_v01_concept.png`
- `dm_field_cover_crop_emerged_v01_concept.png`
- `dm_field_cover_crop_growing_v01_concept.png`
- `dm_field_cover_crop_stressed_v01_concept.png`
- `dm_field_cover_crop_terminated_v01_concept.png`

Optional overlay concepts still needed:

- `dm_overlay_weeds_v01_concept.png`
- `dm_overlay_drought_v01_concept.png`
- `dm_overlay_storm_damage_v01_concept.png`
- `dm_overlay_wet_muddy_v01_concept.png`
- `dm_overlay_poor_fertility_v01_concept.png`
- `dm_overlay_healthy_fertility_v01_concept.png`

## Verification

Added tests for imported concept paths, missing concept fallback safety, crop-specific harvested fallback, and field-detail rendering through missing concept cases.

Run:

```bash
npm test
```
