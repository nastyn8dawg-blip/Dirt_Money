# Dirt Money v0.2.1 Changelog

## Bugs and Exploits Fixed

- Soil Test now creates visible soil data, a recommendation, and a current-from-week UI state.
- Soil Test cannot be repeated while the result is current.
- Ready crops now lock yield potential. Fertilizer and weed treatment are blocked at harvest-ready stage.
- Fertilizer and weed treatment are limited by crop stage to prevent input stacking.
- Weed treatment no longer increases crop stress under normal conditions.
- NPC conversation rewards are limited to once per NPC per week.

## Contract Clarity

- Every contract has action text, next-step text, completion guidance, and failure reason text.
- Contract cards now show readable status labels, where to complete the job, risk, requirements, and next step.
- Failed contracts now report why they failed instead of silently expiring.

## Equipment Upgrades

- Added Used Planter Upgrade.
- Added Better Pull-Type Sprayer.
- Added Used Combine Heads and Belts.
- Equipment upgrades can be bought in the Machine Shed and are preserved by save/load.
- Selected upgrades can use operating credit if cash is short.

## Crop Rotation

- Fields now track previous crop.
- Corn after corn causes a small soil/stress/yield penalty.
- Soybeans after corn and cover crop before cash crop provide benefits.
- Old School Farmer gets clearer rotation warnings and a reduced repeat-corn penalty.

## Calendar and Year Flow

- Header and dashboard now show Year / Week / Season.
- Week 36 produces an end-of-year report with cash, debt, net position, reputation, contracts, crop income, upgrades, and events.
- Player can continue into Year 2 while keeping debt, equipment, relationships, reputation, upgrades, and rotation history.

## Guidance and Events

- Added This Week's Priorities panel for ready crops, urgent contracts, low equipment, soil tests, weeds, and upgrades.
- Added Co-op Input Discount, Roy's Equipment Warning, Patti's Market Rumor, and rare Tornado Warning events.
- Events now create visible report entries and practical effects.

## Tests

- Expanded from 37 to 47 tests.
- New coverage includes soil tests, input repeat blocking, ready-yield lock, weed spray stress behavior, NPC reward exploit prevention, contract next steps, equipment upgrades, crop rotation, calendar/year continuation, priorities, dynamic events, and save/load preservation.

## Known Remaining Issues

- Equipment purchases are still a small upgrade list, not a full dealership.
- Multi-year play exists, but deeper year-to-year economics and land ownership are still future work.
- Events are more visible, but the next content pass should add richer branching neighbor outcomes.
