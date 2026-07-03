# DIRT MONEY — Characters Specification
*The 3 player backgrounds and the 8 key NPCs. All dialogue text is DRAFT until the Creative Director approves per-NPC voice samples (approval gate).*

## 1. Player backgrounds

### Old School Farmer
Grew up on this land; came back to save it. Sees the world qualitatively — soil, sky, people's faces. NPCs start warm (+rep with Hollis, co-op, diner). Blind to charts and dashboards. Exclusive: **Read The Land** events, weather intuition, legacy contracts at Trusted reputation.

### IT Nephew
Inherited the farm from an uncle he barely visited. Sees everything as data — dashboards, forecasts, per-acre profit. NPCs start cold ("city kid with a laptop"); trust-earning questline. Manual labor slow/expensive. Exclusive: **Farm Dashboard**, market forecast bands, contract-arbitrage checks, automation build-out.

### Mechanic
Wrench-turner who took the farm for the shop space. Sees machines completely (6 subsystems); crops are "looks fine?". Exclusive: **Salvage/auction events**, restoration flipping, repair contracts as primary income, repair dialogue checks.

## 2. Key NPCs (8)

Voice profile params: `base_pitch` (0.5–2.0), `syllable_rate` (syl/sec), `volume`; emotion mods applied on top (excited/angry/sad).

| NPC | Node | Personality / voice | Base pitch | Rate | Checks by background (examples) |
|---|---|---|---|---|---|
| **Earl Dunphy**, loan officer | Bank | Dry, deliberate, unimpressed | 0.7 low | 3.0 slow | IT: "ran the numbers" rate argument · Old School: family-history appeal (Trusted) · Mechanic: collateral appraisal of restored equipment |
| **Marge Kowalski**, co-op manager | Co-op | Quick, clipped, fair but sharp | 1.3 | 6.5 fast | All: contract negotiation · Old School: legacy-tier access · IT: bulk-order data pitch |
| **Hollis Vann**, neighbor | Hollis place | Warm, slow drawl, long memory | 0.85 | 3.5 | Old School: shared-history favors · Mechanic: fix his baler (the canonical ripple) · IT: initially distrustful, gated |
| **Dee Tran**, vet | Vet supply | Warm, mid, practical | 1.2 | 5.0 | All: livestock events · chicken health calls |
| **Roy "Big Roy" Carver**, equipment dealer | Dealer | Booming salesman, friendly-predatory | 0.6 loud | 5.5 | Mechanic: see through a lemon · IT: financing terms audit · Old School: handshake-deal rep gate |
| **Sandy Alvarez**, elevator operator | Elevator | Matter-of-fact, tired | 1.0 | 4.5 | IT: delivery-timing data check · Old School: dock-priority favor |
| **Patti Lund**, diner waitress | Diner | Bright, chatty, hub of gossip | 1.5 high | 7.0 | All: rumor access; reputation echoes ("heard about the baler…") |
| **Gus Weaver**, salvage owner | Salvage yard | Gravelly, few words | 0.55 | 2.5 | Mechanic: haggle/spot-value checks · scripted auction events |

## 2b. Minor names (canon)
- **Caleb** — Roy's shop hand; "I'll send Caleb." (Director, 2026-07-03). Off-screen for the slice.
- **The 2010** — the inherited Harvestall tractor; Roy knows its sound over the phone.

## 3. Reputation ripple chains (one per background, written before code — Phase 0 exit criterion)

### Mechanic — the baler chain (canonical)
1. Hollis's baler breaks (event). Mechanic check `[Mechanic 40] — 65%` to fix it.
2. **Fail:** botched repair → Hollis −rep, Patti spreads it → county −, **Marge tightens contract tier**, **Roy demands cash up front**. Salvage-yard auction becomes the only equipment path → Gus questline opens.
3. **Succeed:** Hollis +rep → tells Marge → repair-contract tier unlocks at co-op → Roy offers trade-in credit.
*Both branches are content; failure routes the run toward the salvage/auction identity.*

### Old School — the storm chain
1. Storm warning (weather event). Choice: protect your own planting or help Hollis sandbag.
2. **Help:** lose a day's progress, Hollis +rep → at Trusted, **legacy contract** ("your father's rate") unlocks with Marge; Patti's gossip warms the county.
3. **Don't:** your field is fine, but the diner goes quiet on you → county −, legacy tier locked this run; Earl cites "community standing" in loan talks.

### IT Nephew — the numbers chain
1. Contract review: `[IT Nephew] "This contract underpays by 12%." — 45%, risky` with Marge.
2. **Succeed:** better rate, Marge respects the audit (+rep) but Sandy hears the co-op got shown up → elevator dock priority cools.
3. **Fail:** public correction — the math was missing the fuel surcharge → Marge −rep, diner laughs ("spreadsheet farmer") → trust questline lengthens; Earl, amused, offers a better bridge loan ("kid's trying").

## 4. Voice sample workflow (approval gate)

Before bulk dialogue writing: 3–5 sample lines per NPC in-voice → Creative Director approves/edits tone → then batch generation. Same for gibberish audio profiles: render sample blips per NPC before wiring into scenes.
