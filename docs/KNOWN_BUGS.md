# KNOWN BUGS & ROUGH EDGES (update every session; delete only when verified fixed)

## Open
- **UNTESTED ON THIS DEV BOX (2026-07-06):** the entire equipment/debt/breakdown pass was written
  on the Mac, which has no Godot install. Every changed file is GDScript-parse-clean (gdtoolkit)
  and logic-reviewed, but NOT run. First Windows action: `godot --headless res://tests/autoplay.tscn`
  (must complete 30 days for all three backgrounds) and `res://tests/smoke_test.tscn`, then hand-play
  a breakdown and a debt paydown.
- **BALANCE FLAG (needs Director call):** `baler_rusty` starts at `engine: 0` → once condition drives
  breakdowns, hay orders (baler-serviced) carry a high failure chance from day one, for OLD SCHOOL too
  (east field = hay), not just Mechanic. This is "the dead baler is a project" by design, but may make
  old_school hay feel punishing. Options: start the baler less-dead, gate hay behind a baler fix, or
  give non-Mechanics a functional baler. Deferred to Phase 5 economy re-derivation.
- Save/load does not persist `equipment_owned` (condition/neglect) — a loaded game reads all iron as
  "fine" with no breakdown history until a fresh run reseeds. No crash (accessors degrade to neutral),
  but mid-run saves lose equipment state. Same known gap class as salvage/event_last.
- The old `breakdown_choice.json` Roy dialogue is now unreachable (calendar no longer routes to it;
  the in-HUD breakdown panel replaced it). Left in /data for possible reuse as post-"Call Dealer"
  flavor — not wired. Delete or repurpose later.
- Marge's deadline call says "Friday" (canon line) but a contract accepted late can land on
  another weekday. Cosmetic; revisit if playtests notice.
- IT timing diagnostics show 0 holds on the single harness seed — need multi-seed runs before
  trusting IT drift numbers.
- Dialogue engine has no conditional TEXT within a node (only entry/goto routing) — Patti can't
  yet vary one line by flag mid-node; workaround is separate nodes/banks.
- Save/load does not persist salvage offers/projects mid-flip or event cooldown timestamps
  (event_last). Fine for single-sitting runs; fix before long-session playtests.
- Non-Mechanic breakdown call shows Mechanic-gated option grayed with "[needs Mechanic]" — by
  design for background options, but verify it reads okay in the shop-call context.

## Fixed (most recent first)
- 2026-07-04 — Salvage vanished after purchase (only visible back at the yard, no confirmation,
  buy button enabled while broke) → shared project block at shed + yard, confirmation, next
  actions, honest buy button.
- 2026-07-04 — Harvest hard-blocked by negative cash → harvest financeable on Earl's note up to
  CREDIT_LIMIT; tight credit adds a fee; planting stays cash-only.
- 2026-07-04 — Field panel plant/harvest buttons showed base cost and gated on it while IT pays
  1.5x labor (button could be enabled yet the order silently fail) → effective cost everywhere.
- 2026-07-03 — Field detail panel clipped at top-left with horizontal buttons (PRESET_CENTER on
  empty container) → stable right-side inspector for all panels.
- 2026-07-03 — Crops harvestable instantly (grow_days unenforced) → growth countdown + ready state.
- 2026-07-03 — Corn contract deadline (12d) shorter than corn cycle (14d) — impossible handshake.
- 2026-07-03 — IT labor_cost_mult never applied to order costs.
- 2026-07-03 — Flavor lines consumed seeded RNG streams (UI refreshes could desync seeded runs).
- 2026-07-03 — Double-cropping (model priced one cycle) → planting windows.
- 2026-07-03 — Old School's inherited county 10 auto-qualified "broke but beloved" → earned
  threshold 14.
