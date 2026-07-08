# Dirt Money Stability Audit

Date: 2026-07-06

## Solid Systems

- New game creation reliably seeds backgrounds, fields, equipment, contracts, salvage, weather, market prices, and relationships.
- Field actions are pure state transitions returning a cloned state and player-facing result.
- Harvest-on-credit supports negative or insufficient cash as long as the operating line can cover the cost.
- Salvage has clear resolution paths: sell, strip, repair/flip, or use on equipment.
- Equipment repairs support cash, credit, and salvage parts.
- Contracts support accept, complete, deadline countdown, expiry, rewards, and reputation consequences.
- Core save/load stores the full state object and can now be tested through storage adapters.

## Fragile Systems

- `src/state.js` still owns most simulation domains. It is readable, but future expansion should split fields, economy, salvage, equipment, contracts, and county interactions.
- `src/render.js` still owns all screens. Reusable HTML helpers were extracted, but larger screen modules should wait until there are more screens or repeated layouts.
- Market/weather generation is deterministic enough for tests but still simple. Deeper season balance will need explicit scenario data.
- Save payloads do not yet have migration logic beyond accepting current and legacy state-shaped payloads.
- Visual assets are functional placeholders, not final painterly production art.

## Longer-Play Bugs Most Likely

- Balance drift: interest, machine wear, weather stress, and contract failures can stack hard if future content adds costs without more revenue outlets.
- UI overload: field, salvage, and contract cards may need filters once content grows.
- Persistence migration: future schema changes will need versioned migrations before saves can be considered durable across releases.
- Screen coupling: adding new mechanics directly to `render.js` will make it harder to review UI regressions.

## Feedback Loops Improved

- Financed harvest now states the approximate operating-line increase and current crop value.
- Salvage purchase cards now list all clear exits before the player buys.
- Storm damage to ready crops now persists after condition recalculation and is tested.

## Tests Added

- Harvest with cash and without credit usage
- Salvage sell and repair/flip exits
- Contract expiry
- Bank draw/paydown behavior
- Negative-cash harvest recovery through crop sale
- Multi-turn sanity checks for fields, finance, equipment, and reports
- Storm loss on ready crops
- NPC interaction stability
- Save/load and settings round trip through testable storage adapters

## Refactors Worth Doing Now

- Extract reusable UI helpers from `render.js`.
- Add storage adapters so save/load can be tested outside the browser.
- Fix the ready-crop storm-loss ordering bug.
- Expand behavior tests before major content growth.

## Refactors That Should Wait

- Splitting every state subsystem into separate files should wait until new mechanics force the boundaries. Doing it now would create churn around still-small systems.
- Splitting `src/data.js` into many content modules should wait until the content tables grow or multiple designers need isolated files.
- Breaking `src/styles.css` into component styles should wait until there is a build step or CSS import strategy.
- Introducing a framework or bundler should wait; the dependency-free browser build is currently a strength.

