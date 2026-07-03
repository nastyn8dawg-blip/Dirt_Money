# DIRT MONEY — AI Development Rules

Farm career RPG. Godot 4.x, GDScript. Solo dev (Creative Director) + Claude Code (Lead Engineer).
Source of truth: `docs/DIRT_MONEY_MASTER_SPEC.md`. Scope contract: `docs/DIRT_MONEY_VERTICAL_SLICE.md`.

## Hard laws
1. **Zero runtime APIs.** Single-player, offline, no accounts, no server, no telemetry SDKs (demo telemetry is local-file only, opt-in, Phase 2 decision). Never add a network call to the game.
2. **Scope guardrail.** Nothing enters the vertical slice that is not in the Phase 1 sprint table in `DIRT_MONEY_VERTICAL_SLICE.md`. New ideas go to `DIRT_MONEY_CRITIQUE.md`, not into code.
3. **No input requires a tutorial.** Complexity lives in outcomes, never in controls. Field work = one-tap orders.
4. **Approval gates (human sign-off required, never auto-generate in bulk):**
   - Portrait/visual style: 2–3 art direction options approved before batch asset production.
   - Gibberish voice profiles: audio samples per NPC approved before wiring in.
   - Capsule art, UI theme, report card design.
5. **Design laws (Director rulings, 2026-07-03):**
   - **Downtime is the point.** Crop growth must create a middle-of-the-month gap that pushes the
     player into the county: contracts, people, repairs, choices. Never let plant→harvest collapse.
   - **Grounded voice.** Rural, plainspoken, character-specific. No RPG-fantasy tone, no
     "quest giver" speak. People sound like they live in Ash Creek.
   - **Conversation structure (every county conversation):** situation → player choice →
     skill/background check if relevant → result → reputation consequence → future memory/gossip
     consequence.
   - **Good failures.** A botched check or refused favor is never just "minus points" — it becomes
     gossip, tighter credit, lost trust, colder future dialogue.
   - **Feel the calendar.** Day 8 must feel different from Day 22. Weather, crop timers, contract
     deadlines, gossip, debt, and equipment wear all anchor to the date. Any system that ignores
     the calendar is suspect.
6. **The Director writes ALL player-facing prose. (Director ruling, 2026-07-03.)**
   Dialogue lines, flavor cues, gossip, event text — every word the player reads is authored by
   the Director, not the AI. Claude delivers *structure only*: dialogue trees as flowcharts with
   checks, odds, branches, and effects, where every line of prose is a numbered [BLANK] with a
   context note ("Hollis, angry, just watched the repair fail"). Claude then asks the Director to
   fill every blank. Any Claude-drafted text in the build is a tagged placeholder awaiting
   replacement — it is never final content.
5. **Interface-exclusive backgrounds.** If a screen looks identical across Old School Farmer / IT Nephew / Mechanic, the design has failed. Every screen must check `GameState.background`.

## Architecture
- **Data-driven everything.** Game data (crops, prices, contracts, events, perks, NPCs, dialogue) lives in `/data/*.json`. Code never hardcodes content. Balance changes must be possible without touching a `.gd` file.
- **Autoload singletons** in `scripts/autoload/`: `EventBus` (all cross-system signals), `DataLoader`, `GameState`, `CalendarManager`, `EconomyManager`, `WeatherManager`, `ReputationLedger`, `SaveManager`.
- **Decoupled systems.** Systems communicate via `EventBus` signals, never direct references between gameplay scenes.
- **Dialogue as data.** JSON trees with check conditions, odds formulas, consequence flags. One `DialogueRunner` scene plays all of them.
- Assume future mod support: loading from `/data` must tolerate extra files/keys.
- Favor maintainability over cleverness. No premature optimization. No overengineering.

## Conventions
- GDScript: typed where practical, `snake_case` files/functions, `PascalCase` classes/nodes.
- Scenes greybox-first: build UI in code where it's simpler than deep `.tscn` trees.
- One GitHub Issue = one work unit. Human writes acceptance criteria; work happens on a branch; human reviews and playtests before merge.
- Tests in `/tests`, runnable headless (`godot --headless`). New systems ship with at least a smoke test.

## Current phase
Phase 0/1 foundation. Placeholder art only. No balancing (economy spreadsheet comes first), no music, no polish.
