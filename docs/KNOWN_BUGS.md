# KNOWN BUGS & ROUGH EDGES (update every session; delete only when verified fixed)

## Open
- **BALANCE FLAG (needs Director call):** `baler_rusty` starts near-dead → hay orders carry a high
  early breakdown chance, for OLD SCHOOL too (east = hay), not just Mechanic. By design ("dead baler
  = the Mechanic's project") but may feel punishing for a lifer. Options: less-dead start, gate hay
  behind a baler fix, or buy the working baler on Roy's floor ($1600, stocked). Decide in re-derivation.
- Bot spread is still deeply negative (NET ~−4500 to −5600 from −6800). Expected — the bot plays
  sensibly not optimally, and numbers are placeholder. It's the re-derivation's input, not a bug.
- Old `breakdown_choice.json` Roy dialogue is unreachable now (in-HUD panel replaced it). Left in
  /data unused; delete or repurpose as post-"Call Dealer" flavor later.

## Fixed 2026-07-06 (flesh-out pass, verified on Godot 4.7 — both suites exit 0)
- Breakdown popup never surfaced (hidden behind any open panel) → `_detail_kind`, force-open/evict.
- One breakdown stamped "machine down" on every field → `_field_warning` filters by field.
- Literal `%%` in field-care buttons → `%`.
- Hay regrew into a window it could never harvest → `can_finish_by_season` guard; doomed plants unoffered.
- Cash-starved by day 4, couldn't fertilize → input financing on the note.
- Grange charged fuel for nothing → jobs board.
- "Storm damage" was one flat note → data-driven per-cause stress language.
- Day-to-day changes invisible → Morning Report.
- Save/load dropped equipment/ledger/salvage/etc. → save v2 (v1 still loads).
- Condition 0 read as "failing" for machines that lack a subsystem → 0 = N/A, excluded from math.
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
