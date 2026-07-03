# DIRT MONEY — Economy Specification
*Elaborates MASTER_SPEC §6. **Phase 0 exit criterion:** a spreadsheet must prove three distinct viable strategies before gameplay-economy code is balanced.*

## 1. Design intent

Each background has a **viable but different** path to Day-30 solvency:
- **Old School:** low input costs, reputation-gated legacy contracts pay above market, weather intuition avoids losses.
- **IT Nephew:** information advantage — buy/sell timing, contract arbitrage, automation reduces labor cost late.
- **Mechanic:** income mostly *off* the crops — repair contracts, restoration flips; farms lightly to feed contracts.

If the spreadsheet shows two backgrounds converging on the same strategy, the design has failed before code is written.

## 2. Starting state (all backgrounds)

- Inherited struggling farm: fields (north/south/east), aging equipment set, coop with a few chickens.
- Opening debt with a daily interest tick; a loan officer NPC controls terms (negotiable via dialogue).
- Starting cash small enough that the first field order is a real decision.
- Numbers are **placeholders until the Phase 0 spreadsheet locks them.**

## 3. Crops (slice)

| Crop | Cycle | Cost profile | Role |
|---|---|---|---|
| Corn | mid | high input, high yield value | volume play |
| Soybeans | mid | lower input | flexible/rotation play |
| Hay | short, multi-cut | low input | steady trickle + livestock tie-in |

Yield = f(base, weather over cycle, background modifiers via *systems* not flat stats — e.g., Old School's Read The Land avoids a bad-planting event; IT's forecast times planting).

## 4. Market

- Elevator buy prices fluctuate daily (bounded random walk + event shocks).
- **Visibility is the mechanic:** IT Nephew sees charts + forecast bands; Old School hears qualitative gossip ("elevator's been busy"); Mechanic sees today's number only.
- Seeded mode: same walk across runs for comparison.

## 5. Contracts

5 slice types: delivery (grain), supply (eggs/hay), repair (Mechanic-primary), hauling/favor, legacy (Old School, reputation-gated). Tiered by reputation; terms negotiated in dialogue; breach ripples reputation.

## 6. Loans & debt

- Opening debt ticks daily. Bank NPC offers restructure/extension/short bridge loans through dialogue checks (IT can argue numbers; Old School can invoke family history at Trusted rep).
- Missing payments → credit tightening ripples (dealer stops financing parts, co-op demands cash up front).

## 7. Chickens

Feed cost vs egg output; sell at co-op or via supply contract. Deliberately small — rhythm and event fodder, not an economy pillar.

## 8. Money sinks

Fuel/seed per order, repairs/parts, feed, loan interest, travel (fuel/time), contract penalties.

## 9. Balancing workflow

1. Spreadsheet 30-day cash-flow model per background (next session deliverable) — three solvent-but-different curves.
2. Numbers transcribed into `/data/*.json` (never into code).
3. Sprint-10 balance pass replays spreadsheet scenarios in-game and reconciles drift.
