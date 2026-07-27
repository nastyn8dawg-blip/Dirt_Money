# Dirt Money v0.3.5 Changelog

## Weed Treatment Tuning

- Weed treatment can now be used again in later weeks if weed pressure remains meaningful.
- Same-week repeat spraying is blocked to prevent spam.
- Treatment value now depends on crop timing: early treatment is high value, mid-season is moderate, late cleanup is low value, and ready crops do not regain yield from spraying.
- Repeated spray applications have diminishing weed reduction.
- Field overview and detail UI now show weed pressure, projected reduction, yield-benefit label, work slot cost, and recommendation/disabled reasons.

## Regression Coverage

- Added contract tests for active work steps, work slot consumption, deadlines, no instant free completion, and no duplicate reward claims.
- Added economy sanity simulations for normal, aggressive, poor, contract-heavy, and salvage-heavy play under the current work-slot system.
- Added weed tests for later-week repeat treatment, same-week blocking, timing-based effectiveness, ready-crop yield protection, save/load persistence, and UI helper text.

## Balance Note

- No broad reward, cost, or upgrade nerfs were made in this pass.
- The playtest note may have come from an older build, so the current work-slot economy should get fresh human testing before major balance changes.
