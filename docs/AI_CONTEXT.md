# DIRT MONEY — AI CONTEXT (compressed project brain)
*Read this first, cold-start. Keep under ~120 lines. Details live in specs; truth lives in code.
Chat is temporary steering. Updated: 2026-07-04.*

## What this is
Farm career RPG, Godot 4.7, C:\dev\Dirt_Money, repo nastyn8dawg-blip/Dirt_Money.
Human = Creative Director (writes ALL player-facing prose). Claude = Lead Engineer.

## Thesis
The field creates the pressure. The county creates the consequences. The people make it matter.
Hidden variable every system measures: **can people depend on you?**
Headline feature: **County Memory — "Ash Creek remembers."** Distillation: *Friendship is not
enthusiasm. Friendship is time.* Pacing law: no mechanic expands faster than county memory.

## Phase
Phase 1 vertical slice. **SCOPE FREEZE LIFTED 2026-07-06** for the depth/flesh-out pass (this WAS the
post-freeze work). Numbers still DIAGNOSTIC/PLACEHOLDER until the economy re-derivation. Goal: prove
three runs through the same county feel different enough to replay — and now, that choices move the
outcome (debt, iron, jobs).

## Backgrounds (identities, not stat sheets)
- Old School: trust + steady farming; legacy contracts; reads fields/weather; starts liked, poor.
- IT Nephew: information + timing; greenhorn mistakes + 1.5x labor + county distrust early.
- Mechanic: machines earn (repair contracts + salvage flips), never crop superiority.

## Hard rules (full text in CLAUDE.md — these are the ones sessions forget)
- Prose: AI may now DRAFT player-facing text at build time (ruling 2026-07-06), tagged
  `ai_draft_needs_director_curation` — Director still curates every word before it's final. Runtime
  stays zero-AI/offline (law #1 intact).
- One-cycle season: plant windows corn D6 / soy D10 / hay D18 (3 cuts max). Missing = strategy.
- Conversations: situation → choice → check → result → reputation → gossip. Failures are content.
- Relationship grammar: distrusted 1-2 sentences … friend initiates. Length IS warmth.
- Endings are verdicts Patti could say aloud, never achievement badges.
- Events arrive as conversations with a human face, one interrupt slot per day, priority-ordered.
- Perk doors sound like competence, not magic.
- UI: county office paperwork, not parchment, not slick. Palette in ART_DIRECTION.md.

## Current status (2026-07-06 flesh-out pass — RUN + GREEN on Godot 4.7)
Branch `feedback-depth-stakes-life`. The Director's two playtest rounds are addressed AND executed
(smoke + autoplay exit 0; Godot 4.7 now installed on the Mac via brew). Shipped: debt is payable
(`pay_debt`/`net_worth`), equipment condition drives breakdowns/yield/cost, breakdown is an in-HUD
popup from the machine, the calendar can't lie (no doomed plants/regrows), input financing on Earl's
note, a **Morning Report** (the legibility keystone), a **Grange jobs board** + shed maintenance for
the mid-game, **Roy's dealer floor** (buy/trade iron), consumables, finished dialogue + gossip banks,
and UI motion. ALL new prose is `ai_draft_needs_director_curation`. Next: Director hand-play +
curation, then the economy re-derivation (numbers are still placeholder; bot NET spread ~−4500/−5300/
−4900 from −6800 start — the spread exists, tuning it toward net-positive is the remaining lever).

## (prior) Current status (one paragraph)
Farm view shipped: clickable field parcels + buildings, stable right-side inspector panel.
Field care, morning contacts, diner leads live. 2026-07-04: salvage fully legible (shared
project block at shed + yard, purchase confirmation, badges — Director canon wording) and
credit-on-the-note live per Director ruling: harvest + crop-protecting emergency repair
financeable ($12k ceiling, tight-credit fee — placeholder numbers); NEVER planting/salvage/
speculation. Language law: "note", not "credit balance". Canon prompts share _note_prompt()
in farm_hud. Verdict "right direction"; awaiting next playtest + confirm on one adapted line
("Repair cost is $20.").

## Do not waste time rediscovering
- Balance harness: `godot --headless --path . res://tests/autoplay.tscn` (drift + ledger +
  identity diagnostics). Smoke: `res://tests/smoke_test.tscn`. Godot 4.7 runs on the Mac now (brew --cask godot) AND at
  `%LOCALAPPDATA%\Microsoft\WinGet\Links\godot_console.exe`.
- Drift is expected: OS −24% (legacy premium unreached by bot), IT −28% (care costs + zero
  timing holds on harness seed), ME −5% (identity complete). Field-care costs are unmodeled in
  the spreadsheet — re-derive AFTER freeze lifts, not before.
- git push is silent (credential stored). Elicitation/browser forms don't transmit — collect
  Director lines via plain chat.
- Portraits are PARKED until Director picks an image tool. Art direction locked: 80% Fallout /
  20% Rockwell, "1988 coffee-stained county brochure," palette hexes in ART_DIRECTION.md.

## Read next (session start order)
CURRENT_STATE.md → NEXT_ACTIONS.md → PLAYER_FEEDBACK.md → KNOWN_BUGS.md. Then summarize the
current priority back to the Director in five bullets before touching code.
