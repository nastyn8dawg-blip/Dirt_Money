# DIRT MONEY — Master Specification
**Single source of truth. All other specs elaborate this document; on conflict, this document wins.**
*v1.0 — July 2026. Derived from Production Roadmap v1.1 + Project Bootstrap Instructions.*

---

## 1. Vision

> **Choose your farming background — traditionalist, technologist, or wrench-turner — inherit a struggling farm, and survive 30 days your way.**

Every store asset, trailer beat, and screenshot serves this sentence.

Dirt Money is a **farm career RPG**: the player's background determines their economic path through a 30-day (demo) / multi-season (full) rural economy. Fallout-inspired progression and dialogue, background-driven gameplay, economic decision making, player identity, specialization, emergent storytelling.

We are **not** building: a Farming Simulator clone, a Stardew clone, or a spreadsheet simulator.

## 2. Core hypothesis

**Players voluntarily replay the same 30 days as a different archetype.**

Replayability is the core KPI. Not content quantity. Not map size. Not crop count.

## 3. Genre & audience

- Genre: farm/life-sim × CRPG (management loop with consequential dialogue).
- Audience: Stardew/Graveyard Keeper players who want more economic teeth; CRPG players curious about a grounded setting; Farm Sim-curious players repelled by its controller-hostility.
- Tone: grounded, slightly nostalgic, dry rural humor.

## 4. Game pillars

1. **Background is identity.** Backgrounds are interface-exclusive, not stat-modified. Each changes what the player can *see and do*. Rule: if a screen looks identical across all three characters, it isn't differentiated enough.
2. **People are the complexity.** Every situation involving a person resolves through dialogue with visible-odds skill checks and rippling reputation consequences (60/40 farm-loop/dialogue hybrid). Menus are simple; people are not.
3. **Perks unlock systems, not percentages.**
4. **No input requires a tutorial.** Field work is one-tap orders with ambient results; complexity lives in outcomes.

## 5. The three backgrounds (vertical slice)

| Background | Sees | Cannot see / do | Exclusive loop |
|---|---|---|---|
| **Old School Farmer** | Qualitative cues ("soil feels dry", "elevator's been busy") | No market charts, dashboards, or drone data | Read The Land events; weather intuition; reputation-gated legacy contracts |
| **IT Nephew** | Full dashboards, price forecasts, per-acre profit | Manual labor slow/expensive; NPCs distrust him early | Automation build-out; data-driven arbitrage; trust-earning questline |
| **Mechanic** | Full equipment internals (all condition subsystems) | Crop/livestock UIs simplified ("looks fine?") | Auction sniping (scripted events in slice), restoration flipping, repair contracts as primary income |

Full game adds (Phase 3, only if demo validates): Ranch Daughter, Market Operator.

## 6. Core systems (vertical slice)

Movement (node travel) · Calendar/day loop · Weather (7 states) · Economy & market fluctuation · Inventory · Contracts (5 types, delivered through NPC conversation, reputation-gated tiers) · Equipment condition & repair (6 subsystems) · Random events (10–12, as choice/conversation interrupts) · Travel (Ash Creek County, ~10 nodes) · Skill progression (one mini tree per background, ~8 perks) · Save/load · Dialogue/skill-check engine with ReputationLedger · Chickens (feed/collect/sell only).

Crops: corn, soybeans, hay. Map: Ash Creek County.

**Cut from slice:** full auction system, construction, NPC schedules/gifting (single reputation number per NPC), chicken breeding, six-tree perk system.

## 7. Signature mechanics (locked)

- **Conversation-as-gameplay (§2.6 roadmap):** dialogue-driven skill checks with visible odds, Fallout-style background gating. Failed checks are content, not punishment — both branches produce consequences. Reputation ripples: one value per key NPC + county-wide standing; outcomes propagate across NPCs and shape tomorrow's options.
- **Field work abstraction (§2.7):** one-tap orders (*Plant corn, north field — 2 days, $340*), ambient animation, tap-to-zoom progress, interruptions arrive only as choices/conversations.
- **Talking portraits + gibberish audio (§2.8):** Punch-Out-style busts, 2–3 frame jaw-flap, Animalese-style synthesized speech from per-NPC pitch/tempo profiles. Zero voice acting cost, infinite rewrites.
- **End-of-run report card:** shareable summary (cash, debt, contracts, specialization score, ending title) + run comparison across playthroughs + optional seeded weather/market.

## 8. Art direction

**Clean pixel art or flat vector isometric** (locked pivot from "stylized realism"). Node travel means the world map can be a painted illustration, not tiled terrain. Revisit realism only if the demo funds an artist. Capsule art is the one asset worth paying a human for (~$100–300).

## 9. Technical goals

- Godot 4.x, GDScript, data-driven (all content in `/data/*.json`).
- **Zero runtime APIs** — single-player, offline, no accounts/server.
- Headless-testable (gdUnit4/smoke tests), CI-exportable.
- Assume future mod support.

## 10. Development phases

- **Phase 0 (wk 1–2):** repo, specs, data schemas, greybox UI, economy spreadsheet proving 3 distinct viable strategies, dialogue content plan (~8 NPCs, ripple chains).
- **Phase 1 (wk 3–16):** vertical slice, 10 sprints (see VERTICAL_SLICE doc). Dialogue engine built in sprint 2 — it is the core system.
- **Phase 2 (wk 17–24):** Steam page early, private playtests, Next Fest demo, telemetry review. **Kill/pivot gate:** <20% of playtesters voluntarily starting a second background = fix backgrounds before adding content.
- **Phase 3 (mo 7–12, gated):** new backgrounds, cattle, full auctions, more crops, full perks, construction, seasons.
- **Phase 4 (mo 12–16):** polish, accessibility, controller, launch.

## 11. Success criteria (measured, not vibes)

- ≥30% of demo players who finish one run start a second background ← **the** metric
- Median session ≥45 min
- Day-30 completion ≥25% of players reaching Day 5
- Organic build-comparison threads
- Wishlist conversion ≥8% of demo players

## 12. Roles

- **Human:** Creative Director / Producer. Approves dialogue voice, art direction, audio profiles, capsule/UI/report-card design *before* bulk production. Playtests every sprint. Owns marketing (~4 hrs/wk from Phase 2).
- **Claude Code:** Lead Engineer, Technical Architect, Gameplay Programmer, Documentation Author. Drafts; never auto-commits past approval gates.
