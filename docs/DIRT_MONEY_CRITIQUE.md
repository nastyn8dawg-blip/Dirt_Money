# DIRT MONEY — Critique Document (living)
**Purpose: continuously challenge the design. All ideas are guilty until proven valuable. New feature ideas land HERE, not in code.**
*Maintained throughout development. Every entry gets a verdict: Slice / Phase 3 / Version 2 / Killed.*

## Standing questions (ask of every proposal)
1. What systems are unnecessary?
2. What increases complexity without improving gameplay?
3. What is a likely scope trap?
4. What is proven by existing successful games?
5. What should be postponed? What belongs in V1 vs V2?

## Rulings to date (from roadmap v1.1)

| Proposal | Verdict | Reasoning |
|---|---|---|
| Stat-modified backgrounds (+15 yield / −20 tech) | **Killed** | A stat sheet doesn't drive replay; interface exclusivity does |
| Stylized realism art | **Killed (revisit if demo funds an artist)** | Solo+AI can't sustain it; pixel/flat-vector proven in genre |
| Six perk trees, 100–150 perks | **Phase 3** | Slice: one mini tree per background, ~8 perks, unlock systems not % |
| Full auction system | **Phase 3** | Slice: Mechanic-only scripted events |
| Construction | **Phase 3** | Pure scope trap for the hypothesis being tested |
| NPC schedules + gifting | **Killed for slice** | Single reputation number per NPC does the job |
| Chicken breeding | **Killed for slice** | Feed/collect/sell only |
| Fully dialogue-primary game (Disco Elysium model) | **Killed** | Niche; 60/40 hybrid keeps sim audience in comfort zone |
| Voice acting | **Killed** | Gibberish audio: zero cost, infinite rewrites, trailer personality |
| Online features in demo | **Killed permanently** | Zero-runtime-API is a structural advantage — protect it |
| Direct vehicle control / walking sim | **Killed** | Node travel + one-tap orders; Farm Sim's controller-hostility is the anti-goal |

## Active risks being watched (from risk register)

| Risk | Watch signal | Standing mitigation |
|---|---|---|
| Backgrounds feel samey (fatal) | Greybox screens looking alike; playtest restart rate <20% | Differentiation rule enforced per-screen; Phase 2 kill gate |
| Economy balancing black hole | Balancing in-engine before spreadsheet locks | Spreadsheet-first, numbers only in JSON |
| AI code drift / architecture rot | PRs touching autoload responsibilities, content in code | CLAUDE.md laws, human review every PR, headless tests |
| Motivation cliff ~month 3 | Sprint without a playable build | Playable-every-sprint rule; public devlog |
| Feature creep | Anything not in the sprint table appearing in a branch | This document is the only landing zone for ideas |

## Design threads (logged, not built — pacing law applies)
- **Dependability ≠ likability (Director, 2026-07-03).** Resentment of success is real: a player
  who buys up land and never misses a handshake should be *trusted* and *resented* at once. Would
  need a second social axis (warmth vs. reliability) or resentment events keyed to wealth/land
  flags. Phase 3 candidate — do not build until county memory v1 is proven in playtests.
- Storm damage to unprotected fields (weather_sensitivity data exists, no mechanic yet) — pairs
  with the sandbag choice's "protect your own planting" branch. Sprint 4 (crop/weather sprint).

## Balance drift log (harness: tests/autoplay.tscn vs design/economy_model.xlsx)
**STATUS: DIAGNOSTIC ONLY (Director order, 2026-07-03). Do not balance backgrounds yet. Do not
smooth them into the same economy — the point is not equal cash, it is different paths that feel
fair and replayable.** Identity principle: Old School earns through trust and steady farming; IT
earns through information, automation, and timing but suffers early from low practical competence
and low county trust; Mechanic earns through repairs, salvage, and equipment advantage — never
crop superiority (do not patch him with generic crop income).

**Post-harness build priority (Director):** 1) Mechanic repair contracts → 2) salvage/auction flip
loop → 3) IT practical-incompetence cost or starting-debt pressure → 4) IT market-timing mechanic
→ 5) re-run all three.

- **2026-07-03 (ledger run) — ROOT CAUSE of IT drift: DOUBLE-CROPPING.** Ledger breakdown shows IT
  harvested 2 full cycles per field (600 corn + 400 soy); the model priced ONE cycle. The second
  12-day soy cycle (~$2,100 revenue) is the entire overshoot. **Old School's −7% is two errors
  canceling:** he also double-cropped (1,200 corn) which happens to offset his missing legacy
  premium — he is a valid PACING reference but not yet an ECONOMIC one. **Open Director ruling:
  is the 30-day month a one-cycle season or a two-cycle season?** Options: (a) planting windows
  ("nobody plants corn past Day X") — rural-authentic, enforces one cycle, STRENGTHENS the
  downtime law by protecting the mid-month county-work gap; (b) accept two cycles and re-derive
  the spreadsheet. Recommendation: (a).
- **2026-07-03 — RULED (Director): (a) one-cycle season, with teeth.** Planting windows: corn by
  Day 6, soybeans by Day 10, hay by Day 18 with cuts capped at 3/season. But NOT a thin
  plant/wait/harvest loop: farming depth directive canonized in GAMEPLAY_SPEC §3 (field prep
  stages, rotation memory, mid-growth care — sprints 4/8), county events come to the player
  weighted by state (sprint 9), dealer pop-ins parked in CANON_LINES.md. One-cycle model math
  stands; spreadsheet targets remain valid.
- **2026-07-03 (first run)** — OS −40% / IT +43% / ME −47%. Diagnosed: (1) corn contract deadline
  12d < corn cycle 14d — impossible contract, FIXED to 18d; (2) IT labor_cost_mult never applied to
  order costs — FIXED; (3) OS gap is mostly the legacy contract (needs Marge ≥40, hard to reach in
  a bot run — watch in human playtests); (4) ME gap is expected: repair contracts + salvage flip
  (his income identity) are sprints 7–8; (5) IT's tight-credit spiral (starts county −5, declines
  storm, pays 1.25× interest all run, verdict "The County Quit Calling") is EMERGENT and on-thesis
  — keep it.

- **2026-07-03 (post-ruling run)** — One-cycle season enforced (windows corn D6 / soy D10 / hay D18,
  hay capped 3 cuts) + Mechanic repair pipeline live (gated on baler_fixed per the ripple chain,
  $750 landed in repair_salvage_revenue = exactly the model's repair-jobs line). Drift now maps
  1:1 to missing identity systems: OS −21% ≈ legacy premium; IT −11% ≈ timing edge (Director's
  suspicion CONFIRMED — without the edge he undershoots); ME −22% ≈ salvage flip. The harness
  reads clean. Next per Director order: flip loop → IT pressure → IT timing → re-run.

- **2026-07-03 (flip live)** — Salvage loop shipped per Director ruling: two deals (honest rake,
  painted-over mower trap), Friday hold windows, plain-language reads for everyone + wrench-eye
  detail for Mechanic, hidden damage surfacing mid-restoration, Roy's tier pricing the sale.
  Harness: Mechanic −3% (flip NET $780 vs model $750), wrench income $2,150 vs crops $1,367 —
  identity complete without touching his crops. Remaining drift: OS legacy premium (trust climb),
  IT timing edge (next per Director order: IT pressure, then IT timing).

## Open questions (unresolved, need director ruling)
- Telemetry implementation for demo (local opt-in file vs none) — decide in Phase 2 planning.
- gdUnit4 vs lightweight custom test runner — start custom, adopt gdUnit4 when test count justifies (tech spec §6); revisit at sprint 3.
- Weekday-named calendar vs plain day numbers — currently weekday-named (WORLD_SPEC §3); confirm it reads well in greybox.

## Log
- **2026-07-02** — Document created; seeded from roadmap v1.1 rulings and risk register.
- **2026-07-03** — Economy model v1 locked. First tuning: IT timing edge 1.12→1.15 (fairness band
  was 1.252, over the 1.25 cap). Watch: Old School still richest; if playtests read legacy contracts
  as strictly better, cut legacy units (450) before touching the premium multiplier.
- **2026-07-03 (playtest 1)** — Director rulings codified as CLAUDE.md law #5: downtime, grounded
  voice, 6-beat conversation structure, good failures, calendar-feel. Grow-time bug fixed (crops
  matured instantly). Open: calendar-feel needs mechanics, not just display — contract deadlines on
  named days, weekend county rhythm, equipment wear over time. Schedule into sprints 4–7.
- **2026-07-03 (canon v1)** — County Memory elevated to HEADLINE feature ("Ash Creek remembers").
  New pacing law: no mechanic expands faster than county memory — every system must emit flags the
  county can talk about, or it waits. This is now the first question this document asks of any
  proposal: *what will the diner say about it?*
