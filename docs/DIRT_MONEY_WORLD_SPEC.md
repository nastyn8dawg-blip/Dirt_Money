# DIRT MONEY — World Specification
*Ash Creek County. Node-travel world — the map is an illustration, not tiled terrain.*

## 1. Ash Creek County — travel nodes (~10, slice)

| Node | Function | Key NPC(s) |
|---|---|---|
| **Home Farm** | Player base: fields (North/South/East), barn, coop, equipment shed | — |
| **Grain Elevator** | Sell crops, market prices, hauling gossip | Elevator operator |
| **Co-op / Feed Store** | Contract board, feed/seed purchase, county social hub | Co-op manager |
| **Bank (Ash Creek Savings)** | Loans, debt restructuring | Loan officer |
| **Equipment Dealer** | Parts, machines, financing | Dealer |
| **Diner** | Rumor mill: gossip = Old School's market data; reputation echoes surface here | Waitress/regulars |
| **Neighbor Farm (Hollis place)** | Favor economy, storm-help events, legacy contract origin | Neighbor Hollis |
| **Vet / Livestock Supply** | Chicken supplies, livestock events | Vet |
| **Salvage Yard** | Mechanic-primary: parts scrounging, restoration candidates, scripted auction events | Salvage owner |
| **Church / Grange Hall** | County-standing events, community interrupts | Rotating |

Travel costs fuel + a time block; costs shown before confirming (no-tutorial law).

## 2. Weather (7 states)

Clear · Overcast · Light rain · Heavy rain/storm · Drought/heat · Wind · Fog

- Daily roll, seasonal weighting (single late-spring/summer window in slice).
- Affects: field-order progress, breakdown probability, event pool (storm → neighbor-help event), travel flavor.
- **Forecast visibility is background content:** IT Nephew gets a 3-day forecast band; Old School gets intuition cues ("knee's acting up — rain coming") via Read The Land; Mechanic gets today only.
- Seeded mode reuses the run seed for fair cross-background comparison.

## 3. Calendar

- Demo run: 30 days, Day 1 = first Monday. Weekday names shown (contract deadlines land on named days — "Friday" reads better than "Day 12").
- Day blocks: Morning / Midday / Evening. Sleep advances the day (see GAMEPLAY_SPEC §1 sequence).
- Full game (Phase 3+): seasons; out of slice scope.

## 4. Map philosophy

- One painted county map with clickable nodes. No walking simulator, no vehicle driving.
- The map is a *menu with atmosphere*: ambient animation (tractor working your field is visible from the map), weather rendered as an overlay.
- Locations open as screens/conversations, not explorable interiors.

## 5. County standing

A single county-wide reputation value alongside per-NPC values. Public failures/successes move it; it gates community events and the ending-title pool.
