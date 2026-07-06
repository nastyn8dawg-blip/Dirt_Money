# NEXT ACTIONS — priority order (update at end of every session)

0. **RUN THE DEPTH PASS ON WINDOWS FIRST** (branch `feedback-depth-stakes-life`). It's written +
   parse-clean but never executed (no Godot on the Mac). Do: `godot --headless
   res://tests/autoplay.tscn` (all 3 backgrounds must reach Day 30) + `res://tests/smoke_test.tscn`,
   then hand-play: trigger a breakdown (see the popup + 3 choices), pay down the note at the
   farmhouse, watch net worth move. Fix any runtime errors, THEN playtest for feel.
1. **Director balance call:** `baler_rusty` engine starts at 0 → hay breakdowns hit old_school too,
   not just Mechanic (KNOWN_BUGS). Decide before Phase 5.
2. **Phase 5 — economy re-derivation** (the freeze-lift's real payoff): re-derive
   `tools/build_economy_model.py` for an outcome *spread* (skilled run claws toward net-positive;
   careless sinks), not the flat ~$4k. Replace all PLACEHOLDER numbers; retire the old
   SPREADSHEET_TARGETS (they're the symptom).
3. **Remaining plan phases** (see /Users/dnresources/.claude/plans/some-feedback-...-lovelace.md):
   Phase 6 inventory/consumables (`data/items.json` + effect hooks), Phase 7 AI-authored dialogue
   variety (engine already supports it — content gap), Phase 8 UI/animation juice (Tweens, no new art).
4. **Await Director playtest verdict** on the canon-worded salvage panel + credit prompts
   (his wording, wired verbatim — repair prompt now "Patch runs $20."), the field inspector
   panel, and the four scripted runs in PLAYTEST_SCRIPT_PHASE_1.md. Playtest notes outrank
   everything below.
2. Multi-seed balance harness runs (5+ seeds) — single seed gave IT zero timing opportunities.
3. Director decision: image-generation path (subscription vs. commission) → then Hollis portrait
   board prompt pack from ART_DIRECTION.md.
4. Remaining placeholder-structure trees need Director line batches when he's ready to write:
   earl_talk core beats, sandy/dee/gus chat nodes, marge chat node.
5. Post-freeze (Director must lift): re-derive economy model with field-care cost line; then
   revisit drift. Sprint 8-scale work waiting behind freeze: full perk trees, rotation-memory
   bonuses, tillage/no-till depth, weighted event pools.

## Standing session protocol
- Start: read AI_CONTEXT → CURRENT_STATE → NEXT_ACTIONS → PLAYER_FEEDBACK → KNOWN_BUGS, then
  give the Director a five-bullet priority summary before editing code.
- End: update those files + DECISION_LOG. Keep them tight — a bloated brain is no brain.
