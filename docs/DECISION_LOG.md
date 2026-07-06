# DECISION LOG (append-only, one line per ruling; rationale lives in CRITIQUE/specs)

- 2026-07-02 — Director writes ALL player-facing prose; Claude ships structure + [BLANK]s (law 6).
- 2026-07-02 — Design laws: downtime is the point; grounded voice; 6-beat conversations; good
  failures; feel the calendar (law 5).
- 2026-07-03 — County Memory = headline feature ("Ash Creek remembers"); pacing law: no mechanic
  outpaces county memory.
- 2026-07-03 — Thesis: accumulated trust; hidden variable "can people depend on you." Corollary:
  dependability ≠ likability (resentment axis = Phase 3 thread).
- 2026-07-03 — Relationship grammar: sentence budgets by tier; length IS warmth; enforceable.
- 2026-07-03 — Ending titles are verdicts, not badges. Five canon titles locked.
- 2026-07-03 — Art direction locked: 80% Fallout / 20% Rockwell painted portraits, "1988
  coffee-stained county brochure," 12-color palette; portraits react to reputation via tiny deltas.
- 2026-07-03 — One-cycle season with planting windows (corn D6/soy D10/hay D18, 3 cuts);
  compressed season yes, fake farming loop no; field stages required.
- 2026-07-03 — Salvage = judgment, not profit machine; one core deal + one trap per slice;
  Roy tiers price the exit; Mechanic never patched via crops.
- 2026-07-03 — Balance numbers DIAGNOSTIC ONLY; identities before balancing; never smooth the
  three economies together. Build order: repairs → flip → IT pressure → IT timing → re-run.
- 2026-07-03 — Phase 1 scope freeze; goal = playtest readiness; replay-itch is the kill metric.
- 2026-07-03 — UI dress pass before portraits; county paperwork aesthetic; perk doors sound
  like competence, not magic.
- 2026-07-03 — Course correction: fix the field (farm view, field care, morning contacts,
  diner leads, late-season choices). Field interaction readability before portraits.
- 2026-07-03 — Repo-local project memory adopted (AI_CONTEXT/CURRENT_STATE/NEXT_ACTIONS/
  PLAYER_FEEDBACK/KNOWN_BUGS/DECISION_LOG); session protocol in CLAUDE.md; chat is temporary.
- 2026-07-04 — Cash shortage is pressure, not a dead end: revenue-critical production costs
  (harvest v1) chargeable to Earl's note up to a credit limit; tight credit adds a fee;
  collapsed credit refuses; planting stays cash-only. Not free money — routes through
  county/credit standing.
- 2026-07-04 — Salvage legibility law: after any purchase the player always sees what was
  bought, where it sits, its status, parts/time estimate, buyer, and next action — at both
  the yard and the machine shed. Never buy a thing and wonder where it went.
- 2026-07-04 — Financeable actions locked: harvest YES; contract-linked hauling YES (when
  hauling exists); emergency repair YES only when it protects an active crop/contract/deadline.
  NEVER: planting, salvage buys, upgrades, optional repairs, equipment, livestock, speculation.
  "Credit rescues production in motion, not gambles." Pressure → note → door closes.
- 2026-07-04 — Language law: "note", never "credit balance." Ash Creek, not software.
  ("Earl will carry it, but not clean" — not "credit surcharge applied.")
- 2026-07-04 — Director wording pass delivered: salvage confirmation/badge/suggestion/panel
  + all three credit prompts are canon, wired verbatim. Repair prompt: "Patch runs $20."
  (field-damage register; "cost is" reads like software).
- 2026-07-04 — Process ruling: tiny sessions skip the full five-file update — NEXT_ACTIONS
  only on priority change, DECISION_LOG only on real rulings (now in CLAUDE.md protocol).
- 2026-07-06 — SCOPE FREEZE LIFTED (deliberate, this feedback pass = the freeze-lift event
  NEXT_ACTIONS #5 anticipated). Director greenlit the ambitious depth pass "if it maintains
  the vision and runs with it."
- 2026-07-06 — AI usage ruling: AI is a BUILD-TIME authoring tool only. Hard law #1 STANDS —
  the shipped game makes zero runtime AI/network calls; stays offline + deterministic. Hard
  law #6 relaxed for authoring: AI may draft player-facing prose, baked into /data as static
  content, gated by a Director voice/canon curation pass. No live AI for the end user, ever.
- 2026-07-06 — Root diagnosis (Opus review): the debt was mechanically UN-PAYABLE (only grew);
  it isn't even the win condition (endings key off reputation/cash/contracts, never debt);
  and outcomes were flat (~$4k every run = the bot's spreadsheet target). Through-line for the
  pass: every feature must create meaningful outcome variance; progress on the note must be felt.
- 2026-07-06 — pay_debt() shipped: cash→note bridge, reduces future interest. net_worth() is the
  honest trajectory number (starts -6800); surfaced on HUD + report card. Verdict framed as the
  win, note as pressure (not a scoreboard).
- 2026-07-06 — Equipment now MATTERS: condition drives breakdown odds + severity, field yield, and
  work cost (single source of truth: order_cost()). Daily wear on machines actually used. The
  hidden good/bad gradient in the 3 owned items finally has teeth. Numbers PLACEHOLDER → Phase 5.
- 2026-07-06 — Breakdown redesigned per Director: arrives as an immediate popup FROM THE MACHINE
  (auto-opening farm_hud panel), not a Roy phone call. Choices: Keep Running / Call Dealer / Fix
  It Yourself (+ salvaged part). Multiple severity tiers (cheap/mid/expensive). "Keep running"
  compounds damage + neglect_streak; 3 ignores force an expensive failure. Downtime is real.
  IMPLEMENTATION NOTE: built as an in-HUD side panel (reuses proven UI) rather than the separate
  breakdown_modal.gd the plan specced — lower risk given no Godot on the Mac dev box.
- 2026-07-06 — Salvage yard given a purpose: a RESTORED-but-unsold project can be stripped for a
  cheap repair part (yields_parts_for) — sell-for-cash vs. keep-for-parts tension. Ties salvage ↔
  equipment ↔ breakdowns into one loop (the dead baler is the Mechanic's project).
- 2026-07-06 (playtest 2) — Full creative reins granted ("you know what I want; flesh it out").
  Root of the bad playtest: the depth systems were INVISIBLE (no morning legibility) and buggy
  (breakdown popup hidden behind panels, one breakdown flagged every field, hay lied about regrow,
  cash-starved by day 4). Fixed all; added the missing loops.
- 2026-07-06 — Input financing: ALL production inputs ride Earl's note (plant, harvest, fertilize,
  treat, repair) — reverses the 2026-07-04 planting-stays-cash rule. Director: "no situation where
  farmers are not fertilizing." Speculation (salvage, prep, upgrades, consumables) stays cash.
  Revert switch = FINANCEABLE_ACTIONS list + the kind check in issue_field_order.
- 2026-07-06 — The calendar never lies: no plant/regrow is offered that can't finish by Day 30
  (can_finish_by_season). Hard block, not a warning.
- 2026-07-06 — Morning Report adopted as the legibility keystone: every day narrates money, interest,
  crops, iron, and warnings. The answer to "I couldn't notice anything you did."
- 2026-07-06 — Grange Hall is a day-labor jobs board (was non-functional); downtime becomes choosing
  which work. Shed maintenance (grease & service) is the equipment-care habit loop.
- 2026-07-06 — Roy sells equipment: buy better iron, trade-in MANDATORY, replace-in-slot (no fleets,
  no parts-mules). Financeable on the note (it's production). equipment.json condition 0 = subsystem
  not applicable to that machine (baler has no engine), excluded from all condition math.
- 2026-07-06 — AI authored player-facing prose this pass (jobs, items, stress language, morning-report
  templates, finished dialogue trees, gossip banks) — ALL tagged ai_draft_needs_director_curation.
  Build-time only; shipped game still offline/deterministic (law #1 intact).
- 2026-07-06 — Godot 4.7 installed on the Mac dev box; the pass is RUN-verified (smoke + autoplay
  exit 0), ending the parse-only-on-Mac risk from the first depth pass.
