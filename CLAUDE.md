# DIRT MONEY — AI Development Rules

Farm career RPG. Godot 4.7, GDScript. Solo dev (Creative Director) + Claude Code (Lead Engineer).
Source of truth: `docs/DIRT_MONEY_MASTER_SPEC.md`. Full spec set + decision/feedback history:
`docs/archive/`.

## SESSION PROTOCOL (mandatory — chat history is NOT the source of truth)
**At session start**, before editing any code, read **`docs/AI_CONTEXT.md`** — the single compressed
brain (status, next actions, open bugs, standing rulings). Then summarize the current priority back
to the Director in a few bullets. Pull deeper detail from the kept specs (VOICE_GUIDE, CHARACTERS,
CANON_LINES) or `docs/archive/` only when the task needs it.

**At session end** (or before a long pause), update `docs/AI_CONTEXT.md`: what changed, what shipped,
what's still broken, feedback, rulings, next task. Commit it with the code. **Tiny sessions** (small
tweaks): update it only if status/priority/rulings actually moved — don't churn the brain.

**Size discipline:** AI_CONTEXT stays under ~140 lines — a compressed brain, not a transcript. When it
outgrows that, distill (the full record already lives in `docs/archive/`). Hierarchy: AI_CONTEXT =
brain · kept specs + archive = detail · code = truth · chat = temporary steering.

## Hard laws
1. **Zero runtime APIs.** Single-player, offline, no accounts, no server, no telemetry SDKs (demo telemetry is local-file only, opt-in, Phase 2 decision). Never add a network call to the game.
2. **Scope discipline.** The Phase 1 scope freeze was lifted 2026-07-06 for the depth pass. New ideas still get noted in the brain (or `docs/archive/DIRT_MONEY_CRITIQUE.md`) and discussed — never smuggled into code mid-task. Respect the Director's stated priority order.
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
6. **AI drafts prose; the Director curates it. (Ruling 2026-07-06, supersedes the old author-all rule.)**
   Claude may DRAFT player-facing text at build time — dialogue, gossip, flavor, event text — voice-
   locked to `DIRT_MONEY_VOICE_GUIDE.md` + `CHARACTERS_SPEC`. Every AI-drafted file/section is tagged
   `ai_draft_needs_director_curation`; it is never final until the Director curates it. AI is a build-
   time tool only — the shipped game stays offline/deterministic (see law #1). The Director still owns
   the voice and the final word on every line.
7. **Interface-exclusive backgrounds.** If a screen looks identical across Old School Farmer / IT Nephew / Mechanic, the design has failed. Every screen must check `GameState.background`.

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
See `docs/AI_CONTEXT.md` for live status. In short: Phase 1 vertical slice, freeze lifted; the
depth/flesh-out pass is built + green on Godot 4.7 (branch `feedback-depth-stakes-life`), awaiting
Director hand-play + prose curation, then the economy re-derivation. Numbers still placeholder;
placeholder art (portraits parked on the image-tool decision).
