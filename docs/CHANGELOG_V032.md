# Dirt Money v0.3.2 Changelog

## Weekly Event Cards

- Expanded the dashboard event panel into a fuller "This Week in Ash Creek" system.
- Added richer event metadata: category, source, location, deadline, visible consequence, result text, seen/resolved/expired state, and report visibility.
- Added state-aware events for weather, neighbors, bank pressure, salvage leads, equipment warnings, contract leads, co-op notices, land opportunities, and used equipment leads.
- Tuned event generation to produce 1 to 3 events per week without making severe events constant.
- Added expiration consequences for unresolved events.

## Work Slot Integration

- Event choices can consume weekly work slots.
- Event buttons show work slot cost.
- Choices disable with the shared "not enough work slots" reason when the week is already full.

## Gameplay Effects

- Dry stretch and heavy rain event outcomes can affect field stress.
- Severe storm line can damage ready crops or equipment, but is rare and gated.
- Grange/Hollis/community choices can affect reputation.
- Bank events react to credit/debt pressure and can slightly improve terms at high reputation.
- Gus salvage events can create temporary salvage opportunities.
- Roy used equipment lead can discount equipment upgrades for the week.
- Expired events appear in reports and recent ledger history.

## Tests

- Added coverage for event metadata, dashboard rendering, work slot event choices, weather/neighbor/bank/salvage/equipment effects, expiration outcomes, high-reputation opportunities, and severe event rarity/gating.
