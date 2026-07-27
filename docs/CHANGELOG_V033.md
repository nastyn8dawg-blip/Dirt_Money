# Dirt Money v0.3.3 Changelog

## Event Eligibility Guardrails

- Added state-aware eligibility checks for weekly events and weekly event choices.
- Heavy Rain Coming now adapts its choices to the farm:
  - no crops planted: walk low ground, delay planting, check equipment indoors, or wait
  - growing crops: scout wet fields, watch weeds only in a valid weed window, or wait
  - ready crops: check ready crops, push one harvest before rain, or wait
- Removed invalid Week 1 ready-crop choices when no crops are planted or ready.
- Dry Stretch no longer damages nonexistent crops; without planted crops, it becomes a planting-outlook event.
- Stale save data with invalid event choices is hidden from the dashboard and blocked with a clear reason if invoked.
- Event choices with work-slot costs now have concrete results such as scouting fields, changing stress, harvesting, or changing farm state.

## Tests

- Added regression coverage for Week 1 rain events, rain-choice adaptation, stale invalid choices, drought with no crops, save/load event safety, and work-slot event result feedback.
