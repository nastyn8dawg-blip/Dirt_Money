# Dirt Money Stress System Notes

## What Stress Represents
Stress is not a generic punishment. It summarizes yield pressure from weather, weeds, fertility, rotation, storm damage, wet fields, equipment timing, and missed windows.

## Visible Stress Explanation
Each stressed field should show:
- Stress Cause.
- Effect on yield potential.
- Recommended action.

Examples:
- "Stress Cause: Dry weather and tired soil."
- "Effect: Yield potential reduced about 8%."
- "Recommended Action: Fertilizer helps soil pressure, but rain or rotation is needed for full recovery."

## Recovery Rules
- Soaking rain reduces drought-related stress.
- Weed treatment reduces weed pressure and lowers weed-related stress.
- Fertilizer reduces fertility stress before the crop is ready.
- Cover crops and rotation improve future stress resilience.
- Gravel lot helps wet-week machine pressure.
- Once a crop is ready, yield is mostly locked. Late inputs may clean up appearances, but they should not create new yield.

## Current Implementation Scope
The v0.3 pass uses derived stress causes plus stored field cause tags for recent events and actions. This is intentionally compact: enough clarity for players, without turning the farm into a full agronomy simulator.
