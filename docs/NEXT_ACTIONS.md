# NEXT ACTIONS — priority order (update at end of every session)

0. **DIRECTOR HAND-PLAY the flesh-out pass** (branch `feedback-depth-stakes-life`, pull to Windows;
   both test suites already exit 0 on the Mac). Walk this list — it maps to your feedback:
   1. Breakdown pops up FROM the machine and takes over even with a panel open; the warning shows
      only on the field that actually broke; you can fix it right in the field panel.
   2. Day 4 old_school: fertilize with cash short → goes on Earl's note (canon prompt). Next morning's
      report shows the charge + interest.
   3. Day 26 hay: no phantom "6 days to ready" — the field won't offer a cut it can't finish.
   4. Storm vs drought damage read differently (lodged rows vs heat-bitten), different repair verb.
   5. Days 10–20: Grange Hall has 2–3 jobs; a work day nets ~$120–200 + rep; gossip after 3 jobs.
   6. Roy's floor: trade the 2010 on the 2014/2018 → cheaper orders, quieter iron, fewer breakdowns.
   7. Morning Report every day: 6–10 skimmable lines telling the day's story (the "I couldn't notice
      anything" fix).
   8. Pay the note under $6000 → Earl's greeting warms; gossip changes.
   9. Motion: crossfades, the "Day N — Weekday" card, panels sliding in.
   → Note anything that feels wrong; **playtest notes outrank everything below.**
1. **CURATE THE AI-DRAFTED PROSE.** Everything tagged `ai_draft_needs_director_curation`: all of
   `data/jobs.json`, `data/items.json`, `data/strings.json` field_stress block, the morning-report
   line templates (in `game_state.gd` `_LEDGER_SPEECH` + `build_morning_report`, marked `[AI prose]`),
   the breakdown/farmhouse/goal HUD lines in `farm_hud.gd` (marked `[Prose wants a Director voice
   pass]`), and the finished dialogue trees + gossip banks. It's voice-matched drafts, not final.
2. **Economy re-derivation** (the real payoff): re-derive `tools/build_economy_model.py` for an
   outcome *spread* where a skilled run approaches net-positive and a careless one sinks. Replace
   every PLACEHOLDER (equipment costs, breakdown tiers, job pay, item prices, dealer stock, financing
   fee). Retire `SPREADSHEET_TARGETS` (they encode the flat-outcome bug). Current bot spread for
   reference: old_school/it/mech NET medians −4598/−5298/−4937 from −6800 start.
3. **Director balance calls surfaced by the pass** (see KNOWN_BUGS): baler starts near-dead (the
   Mechanic's project — but it services old_school hay too); should hay require a working baler?
4. Image-generation path (subscription vs commission) → Hollis portrait board prompt pack.

## Standing session protocol
- Start: read AI_CONTEXT → CURRENT_STATE → NEXT_ACTIONS → PLAYER_FEEDBACK → KNOWN_BUGS, then
  give the Director a five-bullet priority summary before editing code.
- End: update those files + DECISION_LOG. Keep them tight — a bloated brain is no brain.
