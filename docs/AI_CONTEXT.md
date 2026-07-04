# DIRT MONEY — AI CONTEXT (compressed project brain)
*Read this first, cold-start. Keep under ~120 lines. Details live in specs; truth lives in code.
Chat is temporary steering. Updated: 2026-07-03.*

## What this is
Farm career RPG, Godot 4.7, C:\dev\Dirt_Money, repo nastyn8dawg-blip/Dirt_Money.
Human = Creative Director (writes ALL player-facing prose). Claude = Lead Engineer.

## Thesis
The field creates the pressure. The county creates the consequences. The people make it matter.
Hidden variable every system measures: **can people depend on you?**
Headline feature: **County Memory — "Ash Creek remembers."** Distillation: *Friendship is not
enthusiasm. Friendship is time.* Pacing law: no mechanic expands faster than county memory.

## Phase
Phase 1 vertical slice. **SCOPE FREEZE ACTIVE**: no new crops, NPCs, locations, livestock, or
economic identities without explicit Director approval. No background rebalancing (numbers are
DIAGNOSTIC ONLY). Goal: prove three runs through the same county feel different enough to replay.

## Backgrounds (identities, not stat sheets)
- Old School: trust + steady farming; legacy contracts; reads fields/weather; starts liked, poor.
- IT Nephew: information + timing; greenhorn mistakes + 1.5x labor + county distrust early.
- Mechanic: machines earn (repair contracts + salvage flips), never crop superiority.

## Hard rules (full text in CLAUDE.md — these are the ones sessions forget)
- Director authors every player-facing word. Claude ships structure + numbered [BLANK]s.
- One-cycle season: plant windows corn D6 / soy D10 / hay D18 (3 cuts max). Missing = strategy.
- Conversations: situation → choice → check → result → reputation → gossip. Failures are content.
- Relationship grammar: distrusted 1-2 sentences … friend initiates. Length IS warmth.
- Endings are verdicts Patti could say aloud, never achievement badges.
- Events arrive as conversations with a human face, one interrupt slot per day, priority-ordered.
- Perk doors sound like competence, not magic.
- UI: county office paperwork, not parchment, not slick. Palette in ART_DIRECTION.md.

## Current status (one paragraph)
Farm view shipped: clickable field parcels + buildings, stable right-side inspector panel
(status / recommendation / what-if-ignored / vertical actions with costs). Field care live
(weeds, stress, till/test/scout/fertilize/treat/repair, late-season cover crop/lime/fallow).
Morning contacts live (Marge deadline call, Earl credit notice + storm/breakdown/salvage).
Diner is a lead generator. All Director canon wired verbatim; zero prose blanks outstanding.
Awaiting Director playtest verdict on the fixed field panel.

## Do not waste time rediscovering
- Balance harness: `godot --headless --path . res://tests/autoplay.tscn` (drift + ledger +
  identity diagnostics). Smoke: `res://tests/smoke_test.tscn`. Godot at
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
