# Dirt Money Project Audit

Date: 2026-07-06

## Current Project State

The repository was empty at inspection time. It contained only `.git`, with no commits, branches, remotes, source files, assets, package manifest, scenes, tests, or visual production plan file.

The requested `DIRT_MONEY_VISUAL_PRODUCTION_PLAN.md` was not present in the workspace, attachment directory, or nearby `Documents` search. The implementation therefore follows the visual rules included in the request as the active production direction.

## Working Features Found

None. No existing game code or assets were present.

## Broken or Incomplete Features Found

All gameplay, UI, asset, persistence, and test systems were missing because the repo was blank.

## Missing Features

- Title screen and menu flow
- New game and background selection
- Farm dashboard
- Field and crop systems
- Economy, debt, credit, and bank systems
- Harvest-on-credit behavior
- Salvage buy/use/sell/strip/flip loop
- Equipment condition and repair
- Contracts and deadlines
- Ash Creek County locations and NPCs
- Save/load
- Settings
- End-of-period reporting
- Visual asset placeholders and final-art prompt sources
- Automated checks

## Highest-Risk Systems

- Credit/debt handling, because it must avoid negative-cash soft locks while preserving pressure.
- Salvage, because purchases must always have clear exits and consequences.
- Field action UI, because the field detail panel must fit and show costs clearly.
- Save/load, because core game state must round-trip.

## Implementation Order Used

1. Scaffold a dependency-free browser app.
2. Build tunable data tables for crops, backgrounds, fields, equipment, salvage, contracts, NPCs, locations, and weather.
3. Implement game-state actions for the core loop and required systems.
4. Build UI screens and navigation.
5. Add Dirt Money visual styling and placeholder assets.
6. Add tests and launch verification.

## Files Created or Modified

- `index.html`
- `package.json`
- `src/data.js`
- `src/state.js`
- `src/storage.js`
- `src/render.js`
- `src/main.js`
- `src/styles.css`
- `assets/placeholders/`
- `assets/source/prompts/`
- `tests/`
- `docs/`

