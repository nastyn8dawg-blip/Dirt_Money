# Dirt Money Generated Art Import Report

Date: 2026-07-07

## Summary

Imported the available generated non-field concept images into the manifest-driven art pipeline.

- Source folders checked: `assets/incoming/`, `assets/concept/`, `assets/final/`, and generated-art subfolders
- Result in incoming folders: no files found
- Additional repo image search found generated non-field concept PNGs in `assets/final/`
- Imported/moved usable non-field concepts to `assets/concept/`
- No generated concept images were marked final
- Existing SVG placeholders remain fallback-only
- Ambiguous or unmapped files: 0

## Counts

- Non-field generated images found: 16
- Farm images imported: 1
- Map images imported: 1
- Location images imported: 6
- Character images imported: 8
- UI/promo images imported: 0

## Images Imported

| Asset | Original Path | New Path | Manifest Key |
|---|---|---|---|
| Home Farm Overview | `assets/final/farm/assets:concept:farm:dm_farm_home_overview_v01_concept.png` | `assets/concept/farm/dm_farm_home_overview_v01_concept.png` | `farm.home_overview` |
| Ash Creek County Map | `assets/final/map/assets:concept:map:dm_map_ash_creek_county_v01_concept.png` | `assets/concept/map/dm_map_ash_creek_county_v01_concept.png` | `map.ash_creek_county` |
| Patti's Diner | `assets/final/locations/assets:concept:locations:dm_location_pattis_diner_v01_concept.png` | `assets/concept/locations/dm_location_pattis_diner_v01_concept.png` | `location.pattis_diner` |
| Ash Creek Farmers Co-op | `assets/final/locations/assets:concept:locations:dm_location_ash_creek_coop_v01_concept.png` | `assets/concept/locations/dm_location_ash_creek_coop_v01_concept.png` | `location.ash_creek_coop`, runtime alias `location.farmers_coop` |
| Grain Elevator | `assets/final/locations/assets:concept:locations:dm_location_grain_elevator_v01_concept.png` | `assets/concept/locations/dm_location_grain_elevator_v01_concept.png` | `location.grain_elevator` |
| Gus's Yard | `assets/final/locations/assets:concept:locations:dm_location_gus_yard_v01_concept.png` | `assets/concept/locations/dm_location_gus_yard_v01_concept.png` | `location.gus_yard`, runtime alias `location.guss_yard` |
| Ash Creek Savings / Bank | `assets/final/locations/assets:concept:locations:dm_location_ash_creek_bank_v01_concept.png` | `assets/concept/locations/dm_location_ash_creek_bank_v01_concept.png` | `location.ash_creek_bank`, runtime alias `location.bank` |
| Machine Shed | `assets/final/locations/assets:concept:locations:dm_location_machine_shed_v01_concept.png` | `assets/concept/locations/dm_location_machine_shed_v01_concept.png` | `location.machine_shed` |
| Old School Farmer | `assets/final/characters/assets:concept:characters:dm_character_old_school_farmer_portrait_v01_concept.png` | `assets/concept/characters/dm_character_old_school_farmer_portrait_v01_concept.png` | `character.old_school_farmer`, runtime alias `character.old_school` |
| IT Nephew | `assets/final/characters/assets:concept:characters:dm_character_it_nephew_portrait_v01_concept.png` | `assets/concept/characters/dm_character_it_nephew_portrait_v01_concept.png` | `character.it_nephew` |
| Mechanic | `assets/final/characters/assets:concept:characters:dm_character_mechanic_portrait_v01_concept.png` | `assets/concept/characters/dm_character_mechanic_portrait_v01_concept.png` | `character.mechanic` |
| Patti | `assets/final/characters/NPCS/PATTI.png` | `assets/concept/characters/dm_character_patti_portrait_v01_concept.png` | `character.patti` |
| Roy | `assets/final/characters/NPCS/ROY.png` | `assets/concept/characters/dm_character_roy_portrait_v01_concept.png` | `character.roy` |
| Gus | `assets/final/characters/NPCS/GUS.png` | `assets/concept/characters/dm_character_gus_portrait_v01_concept.png` | `character.gus` |
| Dee | `assets/final/characters/NPCS/DEE.png` | `assets/concept/characters/dm_character_dee_portrait_v01_concept.png` | `character.dee` |
| Sandy | `assets/final/characters/NPCS/SANDY.png` | `assets/concept/characters/dm_character_sandy_portrait_v01_concept.png` | `character.sandy` |

## Renamed Files

The imported files were normalized into Dirt Money concept-art names. The most important renames were:

- `assets:concept:*` path-like filenames were converted into normal asset filenames.
- Uppercase NPC files such as `PATTI.png` were renamed to `dm_character_patti_portrait_v01_concept.png`.

## Manifest Mapping

These non-field keys now use `status: "concept"`:

- `farm.home_overview`
- `map.ash_creek_county`
- `location.pattis_diner`
- `location.ash_creek_coop`
- `location.farmers_coop`
- `location.grain_elevator`
- `location.gus_yard`
- `location.guss_yard`
- `location.ash_creek_bank`
- `location.bank`
- `location.machine_shed`
- `character.old_school_farmer`
- `character.old_school`
- `character.it_nephew`
- `character.mechanic`
- `character.patti`
- `character.roy`
- `character.gus`
- `character.dee`
- `character.sandy`

The dashboard now prefers `farm.dashboard_hero` and falls back to the imported `farm.home_overview` concept while the dashboard-specific concept image is missing.

## Missing Expected Images

These expected non-field assets remain placeholder-backed:

- `farm.dashboard_hero`
- `farm.machine_shed`
- `location.home_farm`
- `location.roys_place`
- `location.hollis_place`
- `location.grange_hall`
- `character.hollis`
- `character.marge`
- `character.earl`

Generated UI and promo images were not found.

## Fallback Behavior

The renderer still resolves art through the manifest:

1. final/approved art when an entry is marked final or approved
2. concept art when an entry is marked concept
3. SVG placeholder fallback when concept/final art is missing

If an imported image fails to load in the browser, the image tag falls back to the original placeholder SVG.

## Verification

Added tests for required non-field art keys, imported concept paths, runtime aliases, and placeholder-safe missing assets.

Run:

```bash
npm test
```

## Follow-up Import: Missing Field Concepts and Overlays

Date: 2026-07-07

Searched `assets/incoming/`, `assets/incoming/generated_art/`, `assets/concept/`, `assets/final/`, and repo image paths for the requested follow-up concept art.

### Images Found

Found 11 new generated field/overlay concept images already in their correct concept folders:

- `assets/concept/fields/dm_field_hay_harvested_v01_concept.png`
- `assets/concept/fields/dm_field_cover_crop_emerged_v01_concept.png`
- `assets/concept/fields/dm_field_cover_crop_growing_v01_concept.png`
- `assets/concept/fields/dm_field_cover_crop_stressed_v01_concept.png`
- `assets/concept/fields/dm_field_cover_crop_terminated_v01_concept.png`
- `assets/concept/fields/overlays/dm_overlay_weeds_v01_concept.png`
- `assets/concept/fields/overlays/dm_overlay_drought_v01_concept.png`
- `assets/concept/fields/overlays/dm_overlay_storm_damage_v01_concept.png`
- `assets/concept/fields/overlays/dm_overlay_wet_muddy_v01_concept.png`
- `assets/concept/fields/overlays/dm_overlay_poor_fertility_v01_concept.png`
- `assets/concept/fields/overlays/dm_overlay_healthy_fertility_v01_concept.png`

No matching follow-up location or character files were found for:

- `dm_location_home_farm_v01_concept.png`
- `dm_location_roys_place_v01_concept.png`
- `dm_location_hollis_place_v01_concept.png`
- `dm_location_grange_hall_v01_concept.png`
- `dm_character_hollis_portrait_v01_concept.png`
- `dm_character_marge_portrait_v01_concept.png`
- `dm_character_earl_portrait_v01_concept.png`

### Images Imported

The 11 found images were already in the correct concept folders, so no file move or rename was required.

### Manifest Keys Updated

These field keys now use `status: "concept"`:

- `field.hay_harvested`
- `field.cover_crop_emerged`
- `field.cover_crop_growing`
- `field.cover_crop_stressed`
- `field.cover_crop_terminated`

These field overlay keys now use `status: "concept"`:

- `field_overlay.weeds`
- `field_overlay.drought`
- `field_overlay.storm_damage`
- `field_overlay.wet_muddy`
- `field_overlay.poor_fertility`
- `field_overlay.healthy_fertility`

### Remaining Placeholders

These requested follow-up assets remain placeholder-backed because no matching image was found:

- `location.home_farm`
- `location.roys_place`
- `location.hollis_place`
- `location.grange_hall`
- `character.hollis`
- `character.marge`
- `character.earl`

Existing fallbacks remain wired for every missing asset.

### Verification

- Source repo: `npm test` passed 26/26 tests.
- Source repo syntax checks: `node --check src/artManifest.js` and `node --check src/ui/worldArt.js` passed.
- Runtime copy: synced to `/private/tmp/DirtMoney_Run`, then `npm test` passed 26/26 tests there.
- Browser smoke: character select, dashboard, county map, requested location pages, Hollis/Marge/Earl portrait fallbacks, hay harvested art, and save/load were checked at `http://127.0.0.1:5173/index.html`.
- Cover crop visuals are manifest/test verified. They are not currently reachable through the browser UI because `cover_crop` is not a plantable crop in `CROP_TYPES`.
