# DIRT MONEY — Technical Specification
*Elaborates MASTER_SPEC §9. Godot 4.x / GDScript.*

## 1. Engine & project

- Godot 4.x (standard build, GDScript). Compatibility renderer (GL) for broad hardware — this is a 2D UI-heavy game.
- Base resolution 1280×720, `canvas_items` stretch, `expand` aspect. UI-first design; controller support deferred to Phase 4.
- Repo layout (locked):
  `/docs /design /assets /audio /ui /scenes /scripts /data /tests /builds /tools /prompts`

## 2. Architecture

### Autoload singletons (`scripts/autoload/`, load order matters)
| Autoload | Responsibility |
|---|---|
| `EventBus` | Global signal hub. All cross-system communication. No gameplay logic. |
| `DataLoader` | Loads/validates every `/data/*.json` at boot. Tolerates unknown keys/extra files (mod support). |
| `GameState` | Run state: background, day, cash, debt, inventory, flags, field orders. |
| `CalendarManager` | Day counter, time-of-day blocks, day-advance sequencing (emits through EventBus). |
| `WeatherManager` | 7-state weather, seeded RNG option, forecast access gated by background. |
| `EconomyManager` | Market prices, fluctuation model, transactions, loan/debt tick. |
| `ReputationLedger` | Per-NPC reputation + county standing. Ripple propagation rules. The replayability engine. |
| `SaveManager` | JSON save/load of GameState + ledger + calendar + weather seed. |

### Rules
- Systems never call each other's scene nodes directly; they emit/listen on `EventBus`.
- All content is data: code that would hardcode a crop price, contract payout, or dialogue line is a defect.
- Every screen queries `GameState.background` — interface exclusivity is enforced at the UI layer, availability at the data layer (`visible_to`, `checks` fields).

## 3. Data layer (`/data`)

JSON files, schema documented in file headers (`_schema` key). Sample-driven: every schema ships with 2–3 real entries.
`crops.json` · `contracts.json` · `events.json` · `equipment.json` · `market.json` · `perks.json` · `npcs.json` (incl. voice profiles) · `backgrounds.json` · `dialogue/*.json`.

### Dialogue format (core system)
Node-based trees: each node = speaker line + options. Options carry:
- `requires`: background / perk / reputation gates (hidden or shown-locked per flag)
- `check`: `{skill, difficulty, odds_formula}` → displayed as visible odds
- `success` / `failure`: next node ids — **both must exist and both branch content**
- `effects`: list of consequence ops (`rep_delta`, `flag_set`, `cash_delta`, `unlock`, `county_delta`)

### Voice profiles (in `npcs.json`)
`{base_pitch, syllable_rate, volume, emotion_mods: {excited, angry, sad}}` — consumed by the gibberish audio component.

## 4. Dialogue runtime

- One `DialogueRunner` scene (`scenes/dialogue/`) plays every tree: portrait pane (bust + jaw-flap frames), scrolling text with per-syllable blip trigger, options list with odds labels.
- Audio: single `AudioStreamPlayer` + pitch/tempo from the NPC's voice profile. Animalese-style synthesis; placeholder blips until profiles are director-approved (approval gate).
- Check resolution: roll vs displayed odds; emit `effects` through `EventBus` → `ReputationLedger` / `GameState`.

## 5. Save format

Single JSON per slot in `user://saves/`. Versioned (`save_version`), forward-migratable. Contains: GameState snapshot, ReputationLedger, calendar, weather/market seeds, dialogue flags. No binary resources in saves.

## 6. Testing & CI

- Smoke tests run headless: `godot --headless -s tests/run_tests.gd` (custom lightweight runner now; gdUnit4 adoption when test count justifies it).
- Minimum bar: data files parse + validate, calendar advances, reputation ripple writes, save round-trips.
- GitHub Actions (later): headless import + tests on PR; export builds on tag. **Claude Code subscription must not be used in CI** — API pay-per-token only for anything scripted.

## 7. Constraints

- **Zero runtime APIs.** No HTTPRequest in gameplay code, ever. Demo telemetry (Phase 2) is a local file the player can opt to share.
- No third-party addons without a reason written in CRITIQUE doc.
- Placeholder assets live in `assets/placeholder/` and are trivially greppable for later purge.
