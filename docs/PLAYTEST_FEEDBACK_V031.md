# Dirt Money v0.3.1 Playtest Feedback

## Field Action Consistency Bugs
- Batch buttons and individual field buttons can disagree.
- Fertilize All may be disabled while a field-detail Fertilize button is still available.
- Field actions need one shared rule source so UI screens cannot contradict each other.

## Fertilizer Realism
- Fertilizer should not be endlessly repeatable.
- Corn can justify more fertility support than soybeans, but only early enough to matter.
- Soybeans should have a smaller and stricter fertilizer response.
- Cover crop and fallow ground should usually rely on rotation/soil health instead of repeated fertilizer.

## Scouting Cost / Design
- Normal scouting is the player walking their own fields and should not cost cash.
- Scout Field and Scout All should be free information actions.
- Scouting should remain limited to once per field per week so it cannot be farmed for repeated benefits.

## Weed Timing Realism
- Weeds matter most while corn and soybeans are young.
- After canopy or maturity, weed treatment should usually be disabled or clearly described as not paying for yield.
- Ready crops should never gain yield from late spraying.

## Annual Crop Calendar
- Corn and soybeans should not be planted repeatedly in the same field within a year.
- After a corn or soybean harvest, the field should move into post-harvest status.
- Cover crop, fallow, and next-year rotation are the correct exits after annual cash crop harvest.

## Money-Loop Redesign
- The game should not rely on repeated corn/soybean planting for income.
- Mid-season income should come from hay cuttings, contracts, salvage, repair work, and later expansion.
- Hay is the simple recurring crop path for this pass.

## Balance Concerns
- Annual crop limits should add believability without making the game impossible.
- Fertilizer and weed rules should reduce exploits without making crop care feel pointless.
- Stress must be understandable and recoverable when the player acts at the right time.

## Required Tests
- Central field action availability rules.
- Batch and detail action consistency.
- Fertilizer application limits.
- Free scouting and duplicate scouting limits.
- Weed timing windows.
- Annual corn/soybean restrictions.
- Post-harvest cover crop option.
- Next-year planting reset.
- Hay recurring income.
- Stress causes, recovery, and save/load persistence.
