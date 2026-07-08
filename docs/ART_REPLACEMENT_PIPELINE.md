# Dirt Money Art Replacement Pipeline

Date: 2026-07-06

## Purpose

Dirt Money now has a manifest-driven art pipeline. The current simple SVG drawings remain fallback placeholders only. Real generated or painted art should be dropped into `assets/concept/` first, reviewed, then promoted to `assets/final/` when approved.

## Source of Truth

Use `src/artManifest.js` as the asset checklist. Every major visual asset has:

- `id`
- `displayName`
- `type`
- `expectedPath` for final art
- `conceptPath` for review art
- `fallbackPath` for the current SVG placeholder
- `dimensions`
- `status`
- `notes`

The renderer resolves art in this order:

- `status: "final"` or `"approved"` uses `expectedPath`
- `status: "concept"` uses `conceptPath`
- `status: "placeholder"` uses `fallbackPath`
- if a selected file fails to load in the browser, the image falls back to `fallbackPath`

## Folder Structure

Concept art:

- `assets/concept/farm/`
- `assets/concept/locations/`
- `assets/concept/characters/`
- `assets/concept/fields/`
- `assets/concept/map/`
- `assets/concept/ui/`
- `assets/concept/promo/`
- `assets/concept/unmapped/`

Final approved art:

- `assets/final/farm/`
- `assets/final/locations/`
- `assets/final/characters/`
- `assets/final/fields/`
- `assets/final/map/`
- `assets/final/ui/`
- `assets/final/promo/`

Fallback wireframes:

- `assets/placeholders/`

Do not mix final art into `assets/placeholders/`.

## Naming Convention

Use the manifest path exactly. Examples:

- `assets/concept/farm/dm_farm_home_overview_v01_concept.png`
- `assets/concept/map/dm_map_ash_creek_county_v01_concept.png`
- `assets/concept/locations/dm_location_gus_yard_v01_concept.png`
- `assets/concept/characters/dm_character_patti_portrait_v01_concept.png`
- `assets/concept/fields/dm_field_corn_growing_v01_concept.png`
- `assets/final/fields/dm_field_corn_growing.png`
- `assets/concept/fields/overlays/dm_overlay_weeds_v01_concept.png`
- `assets/final/map/dm_map_ash_creek_county.png`

Prefer `.png` for generated painterly raster art unless there is a strong reason to use `.webp`.

## Expected Dimensions

- Farm and location heroes: `1920x1080`
- County map: `1920x1080`
- Character portraits: `768x1024`
- Field visuals: `1920x1080`
- Optional field overlays: `1920x1080`
- Optional marker/icon art: `512x512`

The UI uses `object-fit: cover`, brass frames, dark vignette overlays, and responsive scaling, so art should be composed with important subjects near the center.

## Importing Generated Art

1. Search `assets/incoming/`, `assets/concept/`, and `assets/final/` for generated `.png`, `.jpg`, `.jpeg`, or `.webp` files.
2. Move unapproved generated art into the correct `assets/concept/` folder. Do not leave concept art in `assets/final/`.
3. Normalize filenames to the manifest convention:
   - farm: `assets/concept/farm/dm_farm_home_overview_v01_concept.png`
   - map: `assets/concept/map/dm_map_ash_creek_county_v01_concept.png`
   - locations: `assets/concept/locations/dm_location_pattis_diner_v01_concept.png`
   - playable portraits: `assets/concept/characters/dm_character_old_school_farmer_portrait_v01_concept.png`
   - NPC portraits: `assets/concept/characters/dm_character_patti_portrait_v01_concept.png`
4. If the file cannot be confidently mapped by filename or folder context, move it to `assets/concept/unmapped/`.
5. Update `src/artManifest.js` so imported entries use `status: "concept"` and missing entries remain `status: "placeholder"`.
6. Record the pass in `docs/GENERATED_ART_IMPORT_REPORT.md` or a dated follow-up report.

## Switching Status

1. Generate an image from `assets/source/prompts/art-manifest-final-prompts.md`.
2. Save it to the asset's `conceptPath`.
3. Change that asset's `status` in `src/artManifest.js` from `"placeholder"` to `"concept"`.
4. Run the game and review it in context.
5. Once approved, copy the image to the asset's `expectedPath`.
6. Change `status` to `"final"` or `"approved"`.
7. Run tests and smoke-test the screens.

## Character Drift Rules

- Generate one character at a time.
- Keep approved portrait references for future iterations.
- Do not regenerate the whole cast in one prompt.
- Keep age, clothing identity, posture, and role consistent.
- Use the same visual bible language every time: rustic painterly realism, rural Americana, warm harvest palette, practical farm-business mood, Ash Creek County grit.

## Text Rules

Do not bake functional text into images.

Allowed:

- subtle unreadable signage shapes
- abstract notice-board marks
- labels rendered by the game UI

Avoid:

- readable button text inside images
- contract text baked into boards
- map labels that the player must rely on
- external logos or branded equipment marks

## Testing After Art Replacement

Run:

```bash
npm test
```

Then browser-check:

- title screen
- character select
- dashboard hero
- field detail visual
- county map nodes
- location hero and NPC dialogue card
- salvage yard
- save/load
- mobile width layout

Verify:

- no missing images
- no horizontal overflow
- no clipped buttons
- text remains readable over images
- portraits are not cropped at the face
- map nodes remain clickable
