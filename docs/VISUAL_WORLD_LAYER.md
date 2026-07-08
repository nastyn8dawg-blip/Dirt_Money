# Visual World Layer Pass

Date: 2026-07-06

## Purpose

This pass adds a visible Ash Creek County game world on top of the existing ledger systems. The UI still uses dark coffee panels, brass borders, cream text, barn red warnings, county green positives, and harvest gold actions, but core screens now include scene art, field visuals, map nodes, location hero images, and portrait-backed dialogue cards.

## Added Visual Systems

- Home farm overview hero on the dashboard
- Field-state visual panel and field card thumbnails
- Illustrated county map placeholder with clickable location nodes
- Location hero images for major Ash Creek places
- Character portrait placeholders for backgrounds and NPCs
- CRPG-style NPC dialogue cards with portrait, role, quote, action, and relationship indicator
- Render-level test coverage to catch accidental removal of visual-world assets

## Placeholder Asset Folders

- `assets/placeholders/farm/`
- `assets/placeholders/fields/`
- `assets/placeholders/map/`
- `assets/placeholders/locations/`
- `assets/placeholders/characters/`
- `assets/source/prompts/`

## Still Placeholder

All newly added art is implementation-ready placeholder SVG, not final production art. It is intentionally organized and named so final painterly art can replace it later without changing game logic.

## Final Art Priority

1. Home farm overview
2. Ash Creek County map
3. Location backgrounds for Gus's Yard, Grain Elevator, Patti's Diner, and Machine Shed
4. NPC portraits for Gus, Patti, Hollis, Earl, and Roy
5. Crop/field state illustrations for ready, stressed, harvested, and rough states

