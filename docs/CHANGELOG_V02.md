# Dirt Money v0.2 Changelog

Date: 2026-07-07

## Bugs Fixed

- Fixed Machine Shed repair-on-credit so it no longer silently spends cash.
- Added predictable repair estimates for cash, credit, and parts repairs.
- Repair-on-credit now clearly labels the financed amount and shop/credit premium.

## Engagement / UX

- Changed the main time button from `Advance Week` to `End Week`.
- Weekly report now functions as the transition into the next week with a `Start Week X` button.
- Weekly reports include weather, events, field changes, contract progress, interest, warnings, and ledger movement.
- Field detail now has Previous/Next field buttons and shows field index.
- Left/right keyboard arrows cycle fields while on field detail.

## Contracts

- Contracts now support `available`, `in_progress`, `ready_to_complete`, `completed`, `failed`, and `archived` states.
- Most contracts cannot be completed immediately after acceptance.
- Contract board refreshes over time and clears completed/failed jobs.
- Contracts can require equipment, parts, cash/fuel, time, reputation, and can add equipment wear.
- Rewards and availability now interact with reputation.

## Economy / Balance

- Extended standard campaign length to 36 weeks.
- Increased starting debt and early input/harvest costs.
- Reduced early crop runaway potential.
- Added balance sanity coverage for first-harvest outcomes.

## Scouting

- Scouting now writes an actionable scout report to field state.
- Scout reports can call out weeds, fertility, stress, harvest timing, and expected yield range.
- Field detail displays the latest scout report or explains that the field is unscouted.

## Reputation

- Reputation now maps to standing labels: `Watched`, `Known`, and `Trusted`.
- Standing affects effective credit terms and contract reward value.
- Dashboard and bank screens explain standing effects.

## Events

- Added initial weekly event hooks for wet fields, drought, storm damage, neighbor requests, and bank pressure.
- Events are recorded in state and shown in weekly reports / dashboard notices.
- Wet fields can delay harvest.

## Progression

- Added early progression purchases:
  - Better shop tools
  - Gravel machine lot
  - Old grain storage patch
  - Lease Hollis's Back 20
- The Back 20 lease unlocks a new field when purchased.

## Sound

- Added a safe generated-tone sound manager.
- Added mute and volume settings.
- Sounds play only after user interaction.

## Tests Added

- Repair with cash and repair on credit behavior.
- Repair label / actual financed amount consistency.
- Contract time gating, refresh, archival, and deadlines.
- Economy sanity simulation.
- Scouting report state and UI.
- Reputation effects on bank terms and visible standing text.
- Weekly events and wet harvest delay.
- Longer season behavior beyond the prior 18-week mark.
- Progression purchase requirements and effects.
- Sound setting persistence.

## Known Remaining Issues

- Events are still simple deterministic hooks, not a full event deck.
- Cover crops are manifest/test mapped but not yet plantable.
- Progression is intentionally small and needs more late-game hooks later.
- Sound uses generated placeholder tones, not final audio assets.
- Weekly report animation is text/staged flow only; no timed animation pass yet.

## Manual Test Checklist

- Title and new game.
- Dashboard standing explanation and morning notice.
- Machine Shed repair with cash.
- Machine Shed repair on credit.
- Field Previous/Next buttons and left/right arrows.
- Scout field and verify report text.
- Accept a normal contract, end week, complete when ready.
- Let a contract expire.
- Confirm board refreshes.
- Verify reputation changes visible standing/bank terms.
- End weeks until an event appears in report.
- Verify wet fields can block harvest when event is active.
- Reach week 18 and continue toward 36 weeks.
- Purchase a progression upgrade.
- Toggle mute / volume in settings.
- Save/load after v0.2 state changes.
