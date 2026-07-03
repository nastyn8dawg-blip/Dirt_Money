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

## 3. Field work abstraction

- **Issue an order:** *Plant corn, north field — 2 days, $340 fuel/seed.* Confirm. Done.
- Tractor animates in the background as ambient life.
- Tap/click a working field to zoom: progress bar, fuel burn, time remaining, weather risk, breakdown probability, and (Mechanic only) live condition readouts.
- Field work only interrupts when something goes wrong — and the interruption arrives as a **choice or conversation** (breakdown, neighbor drives up, storm warning).
- Design law: **no input requires a tutorial.**

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
