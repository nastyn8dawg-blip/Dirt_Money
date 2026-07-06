# DIRT MONEY — THE BRAIN (single compressed context file)
*Read this first, cold-start. Keep under ~140 lines. This is the whole working brain — status,
next actions, open bugs, standing rulings. Details live in the 4 kept specs (MASTER, VOICE_GUIDE,
CHARACTERS, CANON_LINES); the full spec set + decision/feedback history is in `docs/archive/`.
Truth lives in code; chat is temporary steering. Updated: 2026-07-06.*

## What this is
Farm career RPG, Godot 4.7, repo nastyn8dawg-blip/Dirt_Money. Human = Creative Director (owns the
vision + curates all prose). Claude = Lead Engineer (builds systems, drafts prose for curation).
Dev: edits on Mac (Godot 4.7 installed via brew) or Windows; both run the game headless.

## Thesis
The field creates the pressure. The county creates the consequences. The people make it matter.
Hidden variable every system measures: **can people depend on you?** Headline feature: **County
Memory — "Ash Creek remembers."** Distillation: *Friendship is not enthusiasm. Friendship is time.*
Pacing law: no mechanic expands faster than county memory.

## Phase
Phase 1 vertical slice, **scope freeze LIFTED 2026-07-06** (the depth/flesh-out pass was the
post-freeze work). Numbers are PLACEHOLDER until the economy re-derivation. Goal: three runs through
the same county feel different enough to replay — and choices visibly move the outcome (debt, iron, jobs).

## Backgrounds (identities, not stat sheets)
- Old School: trust + steady farming; legacy contracts; reads fields/weather; starts liked, poor.
- IT Nephew: information + timing; greenhorn mistakes + 1.5x labor + county distrust early.
- Mechanic: machines earn (repair contracts + salvage flips + self-fix), never crop superiority.

## Design laws (the vision guardrails — full text in MASTER_SPEC; these are the ones sessions forget)
- **Downtime is the point.** Crop growth creates a mid-month gap that pushes the player into the
  county: jobs, contracts, people, repairs, choices. Never let plant→harvest collapse.
- **Grounded voice.** Rural, plainspoken, character-specific. No RPG-fantasy tone, no quest-giver
  speak. People sound like they live in Ash Creek. (Register + sentence budgets: VOICE_GUIDE.)
- **Conversation structure:** situation → choice → skill/background check → result → reputation →
  future gossip/memory. Good failures are content (gossip, tighter credit, colder dialogue), not just −points.
- **Feel the calendar.** Day 8 ≠ Day 22. Weather, timers, deadlines, gossip, debt, equipment wear
  all anchor to the date. The calendar can't lie (no plant/regrow that can't finish).
- **Interface-exclusive backgrounds.** Every screen checks `GameState.background`; if it looks the
  same across the three, the design failed.
- **Endings are verdicts** Patti could say aloud, never achievement badges.

## Standing rulings (active — full history in docs/archive/DECISION_LOG.md)
- **Prose:** AI may DRAFT player-facing text at build time, tagged `ai_draft_needs_director_curation`;
  Director curates before it's final. Runtime stays zero-AI/offline (hard law #1). *(supersedes the
  old "Director authors every word" rule)*
- **The note is the win-pressure, not the scoreboard.** Verdict (reputation/dependability) is the win;
  debt is payable (`pay_debt`) and `net_worth` is the honest trajectory. Language law: "note," never
  "credit balance."
- **Input financing:** plant/harvest/fertilize/treat/repair ride Earl's note; prep + speculation
  (salvage, upgrades, consumables) stay cash. Revert switch = `FINANCEABLE_ACTIONS`.
- **Equipment:** condition drives breakdown odds/severity, yield, and work cost. Roy sells better iron
  (trade-in mandatory, replace-in-slot). Condition 0 = subsystem N/A to that machine.
- **Breakdown = popup from the machine** (in-HUD, evicts other panels), not a Roy call. Keep Running
  compounds; 3 ignores force an expensive failure.

## Current status (flesh-out pass — RUN + GREEN on Godot 4.7; branch feedback-depth-stakes-life)
Both suites exit 0. Shipped this pass: pay_debt/net_worth; equipment-matters; in-HUD breakdown popup;
honest calendar; input financing; **Morning Report** (daily legibility keystone); **Grange jobs board**
+ shed maintenance (mid-game work); **Roy's dealer floor**; consumables (items.json); finished dialogue
+ 7 flag-keyed gossip banks; UI motion (crossfade, day-card, panel fades, hover). ALL new prose tagged
`ai_draft_needs_director_curation`. 5 commits, local-only (branch not yet pushed).
Harness NET spread (cash−note, from −6800 start), 3 seeds/bg: OS −5160/−4598/−4441 · IT −5640/−5298/
−4861 · ME −4945/−4937/−4817. Spread exists (choices move it); still negative (bot plays sensibly not
optimally, numbers placeholder).

## Next actions (priority)
1. **Director hand-play** the branch (checklist mirrors his feedback: breakdown popup, input financing,
   honest hay, storm/drought text, Grange jobs, Roy's floor, Morning Report, note paydown). Playtest
   notes outrank everything.
2. **Curate the AI-drafted prose** (everything tagged `ai_draft_needs_director_curation`): jobs.json,
   items.json, strings.json field_stress, morning-report line templates (game_state `_LEDGER_SPEECH` +
   `build_morning_report`), HUD lines in farm_hud, the finished dialogue trees + gossip banks.
3. **Economy re-derivation** — re-derive `tools/build_economy_model.py` (read
   `docs/archive/DIRT_MONEY_ECONOMY_SPEC.md`) for an outcome SPREAD where a skilled run approaches
   net-positive; replace every PLACEHOLDER; retire the stale SPREADSHEET_TARGETS.
4. **Baler balance call** (below). Then image-gen path → Hollis portrait pack (ART_DIRECTION in archive).
5. Push the branch when the Director's ready to pull to Windows.

## Open bugs / rough edges (full/fixed list in docs/archive/KNOWN_BUGS.md)
- **BALANCE (needs Director call):** baler starts near-dead → hay carries a high early breakdown chance
  for Old School too (east = hay), not just Mechanic. By design ("the Mechanic's project") but may feel
  punishing; options: less-dead start / gate hay on a baler fix / buy the $1600 working baler on Roy's floor.
- `breakdown_choice.json` (old Roy dialogue) is now unreachable — delete or repurpose as post-dealer flavor.
- Marge's deadline call says "Friday" but a late contract can land another weekday (cosmetic).

## Latest player verdict (full trail in docs/archive/PLAYER_FEEDBACK.md)
2026-07-06: harsh but right — the depth pass "landed badly" because systems were invisible + buggy
("couldn't notice anything you did other than take away the pictures"). This flesh-out pass answers each
point; re-play verdict pending. Full reins granted for the flesh-out.

## Do not waste time rediscovering
- Harness: `godot --headless --path . res://tests/autoplay.tscn` (spread + ledger + identity). Smoke:
  `res://tests/smoke_test.tscn`. Both exit 0 = pass. Godot 4.7 on the Mac (brew --cask godot) and Windows.
- GDScript parse-check without engine: `/tmp/gdt-venv/bin/gdparse <file>` (pip gdtoolkit in a venv).
- git push is silent (credential stored). Numbers are DIAGNOSTIC/placeholder — don't hand-tune before
  the economy re-derivation. Portraits PARKED (image-tool decision); art direction in archive.
