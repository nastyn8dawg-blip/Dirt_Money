# Dirt Money v0.3.1 Changelog

## Added
- Central field action availability rules through `canPerformFieldAction`.
- Crop-year tracking for annual corn/soybean limits.
- Fertilizer application counters and stage/week history.
- Weed-treatment timing windows.
- Free Scout Field and Scout All Fields actions.
- Stress history, clearer cause/effect/recovery text, and recoverability labels.
- Hay regrowth after cutting when enough season remains.
- Ag realism rules documentation.

## Changed
- Field overview and field detail now use the same action rule engine.
- Fertilizer can no longer be spammed across crop stages.
- Corn and soybeans cannot be replanted in the same field/year after an annual cash crop.
- Scout All now shows Free instead of a cash total.
- Field cards show crop-year status, fertilizer usage, weed window, and stress recovery.
- Weekly stress changes now require an identifiable cause or recovery condition instead of climbing blindly.

## Fixed
- Batch field actions and individual field actions no longer disagree.
- Ready crop inputs explain that yield is mostly locked.
- Stress is no longer presented as a permanent hidden punishment.
