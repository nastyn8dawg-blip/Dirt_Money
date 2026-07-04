# DIRT MONEY — Gameplay Specification
*Elaborates MASTER_SPEC §4–§7.*

## 1. The day loop

A run = 30 days (demo). Each day has time-of-day blocks (Morning / Midday / Evening). Actions cost time blocks and/or days (field orders). Day advance sequence:
1. Field orders progress (weather-modified), breakdown/interrupt rolls
2. Market tick (EconomyManager)
3. Weather roll for tomorrow (forecast visibility depends on background)
4. Loan/debt interest tick
5. Event scheduler: pick 0–1 interrupts for tomorrow (choice/conversation form)
6. Chicken output; contract deadlines checked

Player spends blocks on: travel (node map), conversations, market/elevator, issuing field orders, repairs, chicken chores.

## 2. Conversation-as-gameplay (CORE SYSTEM)

**60/40 hybrid:** farm loop stays simple daily management; every situation involving a *person* resolves through dialogue — contracts, bargaining, loans, favors, emergencies, disputes, purchases.

### Skill checks with visible odds (Fallout-style)
- *[Mechanic 40] "Let me look at that baler myself." — 65% success*
- *[Old School — Reputation: Trusted] "My father did business with yours. Give me a fair rate."*
- *[IT Nephew] "I ran the numbers — your contract underpays by 12%." — 45%, risky*

Rules:
- Options are gated by background, perks, or reputation tier. Gates are visible (grayed with reason) unless flagged hidden.
- **Failed checks are content, not punishment.** A botched repair, an insulted banker, a rumor at the diner. Success and failure both branch; no dead-end failures.
- Odds shown honestly; the roll respects them (trust is a design feature).

### Reputation ripple (the replayability engine)
- One reputation value per key NPC + a county-wide standing.
- Outcomes propagate: fail the co-op manager publicly → dealer tightens credit; help a neighbor in a storm → legacy contracts unlock.
- Tomorrow's dialogue options are shaped by yesterday's outcomes — not stats.
- Ripple rules live in data (`effects` with `rep_delta` on *other* NPCs and `county_delta`), never hardcoded.

## 3. Field work abstraction — REVISED (Director ruling, 2026-07-03)

**The 30-day demo is a compressed farming season, not a literal month — and not a thin
plant/wait/harvest loop.** One committed cycle with planting windows; missing the window is a
strategic consequence, not a bug. *A compressed season is acceptable. A fake farming loop is not.*

- **Issue an order:** *Plant corn, north field — 2 days, $340 fuel/seed.* Confirm. Done.
- Field work only interrupts when something goes wrong — and the interruption arrives as a
  **choice or conversation** (Roy calls about The 2010; nobody gets a "Tractor broken" popup).
- Design law: **no input requires a tutorial.**

### Planting windows (v1 — implemented)
Corn: early window, closes Day 6 — punishes lateness, highest ceiling. Soybeans: flexible but
limited, closes Day 10. Hay: flexible (Day 18), multi-cut capped per season (no infinite money
loop). Once fields are committed, the middle of the month belongs to field care and county life.

### Field stages (target model — built across sprints 4 and 8)
States: rough → cleared → tilled → planted → emerged → growing → stressed → ready → harvested.
Actions: clear debris, till / no-till plant, fertilize, scout, treat pest/disease, repair weather
damage, harvest, haul/store/sell.
- **Tillage:** time/fuel/wear, better planting success, erosion risk in heavy rain — traditional.
- **No-till:** unlocked via skill/equipment, saves time/fuel, weathers storms better — Old School
  knows when tillage is worth it; IT optimizes no-till through data; Mechanic keeps old tillage
  iron running cheap.
- **Rotation memory:** fields remember last crop. Soy-after-corn, corn-after-soy bonuses; repeated
  corn = fertilizer + pest pressure. Surfaced in PLAIN LANGUAGE, never a spreadsheet wall:
  *"Good rotation: corn after soybeans. Fertilizer cost reduced."*
- Double-crop, cover crops, winter wheat, specialty crops: FUTURE unlocks (skill, co-op advice,
  extension events, field history). Designed-for, not built in the slice.

### The season arc (pacing target)
Days 1–5 prep + planting pressure · 6–12 emergence, scouting, county favors · 13–20 stress,
storms, deadlines, breakdowns · 21–27 harvest prep, market timing, memory coming due ·
28–30 harvest, delivery, debts, the verdict.

> **The field creates the pressure. The county creates the consequences. The people make it
> matter.** The county interrupts, supports, punishes, and remembers farming — it never replaces it.

## 4. Background-exclusive mechanics (slice)

| | Old School Farmer | IT Nephew | Mechanic |
|---|---|---|---|
| Info layer | Qualitative text cues | Dashboards, forecasts, per-acre profit | Equipment internals (6 subsystems) |
| Blind spot | No charts/dashboards | Labor slow/expensive; NPC distrust | Crop/livestock UI simplified |
| Exclusive content | Read The Land events, weather intuition, legacy contracts | Farm Dashboard, arbitrage, trust questline | Salvage/auction events, restoration flipping, repair contracts |
| Perk tree (~8 perks) | Unlocks land-reading depth, legacy contract tiers | Unlocks automation steps, forecast range | Unlocks subsystem diagnostics, repair contract tiers |

Perks unlock **systems and dialogue options**, never bare percentages.

## 5. Contracts

5 types in slice, delivered through NPC conversations, reputation-gated tiers. Negotiation (rate, deadline, penalty) via dialogue checks. Breach has reputation ripples, not just fines.

## 6. Events

10–12 random events in slice, all surfaced as choice/conversation interrupts (never silent modifiers). Each event references NPCs and can move reputation.

## 7. Equipment

Condition across 6 subsystems (engine, hydraulics, transmission, tires, electrical, attachments). Mechanic sees all; others see a single summary state. Repairs: DIY (Mechanic checks), hire (dialogue negotiation), or defer (breakdown risk on orders).

## 8. Chickens (slice)

Feed / collect / sell only. No breeding. A daily-rhythm cash trickle and event hook.

## 9. End of run

- **Report card:** cash, debt, contracts completed, specialization score, reputation summary, ending title. Shareable/screenshot-friendly.
- **Run comparison:** second playthrough onward, side-by-side with previous runs.
- **Seeded option:** identical weather/market across runs for fair background comparison.
