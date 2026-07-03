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

## Open questions (unresolved, need director ruling)
- Telemetry implementation for demo (local opt-in file vs none) — decide in Phase 2 planning.
- gdUnit4 vs lightweight custom test runner — start custom, adopt gdUnit4 when test count justifies (tech spec §6); revisit at sprint 3.
- Weekday-named calendar vs plain day numbers — currently weekday-named (WORLD_SPEC §3); confirm it reads well in greybox.

## Log
- **2026-07-02** — Document created; seeded from roadmap v1.1 rulings and risk register.
- **2026-07-03** — Economy model v1 locked. First tuning: IT timing edge 1.12→1.15 (fairness band
  was 1.252, over the 1.25 cap). Watch: Old School still richest; if playtests read legacy contracts
  as strictly better, cut legacy units (450) before touching the premium multiplier.
