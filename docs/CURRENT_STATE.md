# CURRENT STATE — 2026-07-04 (update at end of every session)

## Shipped and working (all tests green, pushed to main)
- Farm view: clickable parcels (stage-colored) + farmhouse/barn/coop/shed + road/diner/Hollis
  buttons + warning badges. Stable right-side inspector panel for everything.
- Field care: weeds creep daily, storms stress, till/soil-test/scout/fertilize/treat/repair,
  yield math visible, late-season cover crop / lime / honest fallow (Director canon lines).
- One-cycle season with planting windows; hay capped at 3 cuts.
- County memory: gossip banks, entry routing (cold/warm doors for Hollis/Marge/Roy), credit
  tightening (county ≤ −3 → 1.25x interest + HUD warning), contract handshakes with weekday
  deadlines, missed-handshake ripples.
- Mechanic identity complete: repair contracts (gated on baler_fixed) + salvage flip (two deals,
  Friday holds, wrench-eye reads, Roy tier pricing, hidden damage).
- **Salvage legibility (2026-07-04):** post-purchase confirmation at the yard; shared project
  block (what/status/where/parts/time/buyer/next action) shown at Machine Shed AND yard; shed
  building badge; suggestion line; buy button disabled when broke. work/sell/ready take an
  index (multi-project safe).
- **Harvest on credit (2026-07-04):** cash-short harvest chargeable to Earl's note.
  CREDIT_LIMIT $12k + FINANCE_FEE_TIGHT 10% (placeholders, DIAGNOSTIC ONLY). Ledger keys
  orders_financed / financing_fees (debt-side — deliberately NOT in harness cash COST_KEYS).
  Planting stays cash-only. Bot unchanged — harness drift identical (OS −24/IT −28/ME −5).
- IT identity: greenhorn mistakes, 1.5x labor, honest pre-rolled market forecast. Field panel
  now shows/gates on effective (labor-mult) costs. Old School: storm/sandbag chain gates
  legacy contract (Marge ≥ 40 + flag).
- Morning contacts: state-driven (contract_due_in, credit_tight, cooldowns, priority slots).
- Diner leads: Patti reads live state. Perk proofs (Day 8): conversation doors.
- Report card: trust ledger, verdicts (5 Director titles), run history comparison (last 4 runs).
- Playtest panel (dev): ledger/flags/reps/perks + restart/switch/export.
- Balance harness with per-identity diagnostics; playtest script in PLAYTEST_SCRIPT_PHASE_1.md.

## Dialogue canon status
Every shipped line is Director-authored. Remaining placeholder-structure trees (scratch text,
awaiting future batches): earl_talk core, sandy_talk chat, dee_talk, gus_talk, marge_talk chat
node. **New 2026-07-04:** salvage panel + credit-prompt UI strings are Claude-drafted
placeholders (dry/functional, built from the Director's feedback wording) — need a Director
pass before they're canon.

## Parked
- Portraits + county map art (awaiting Director image-tool decision; prompt pack ready to write).
- Economy model re-derivation with field-care costs (post-freeze).
- Multi-seed harness runs (IT timing shows 0 holds on the single seed).
- Financed-orders reporting line in the harness (debt-side keys exist, not yet printed).
