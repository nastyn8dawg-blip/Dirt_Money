# DIRT MONEY — Art Direction
*Director ruling, 2026-07-03. Style locked; per approval gate, sample boards within this direction
still get Director veto before any batch production.*

## The brief, in one line
> **A county brochure from 1988 somebody spilled coffee on.**

## Style: Fallout-inspired painted portraits
**The formula: 80% Fallout portrait / 20% Norman Rockwell.**
Touchstones: Fallout 1/2, Disco Elysium (lite), Kentucky Route Zero.

Characteristics: painterly · semi-realistic · expressive faces · muted colors · warm lighting ·
rough brush texture · portrait occupies **~25% of the dialogue screen**.

Portraits must communicate: sun, wind, work, history, weather, age, wear, trustworthiness,
suspicion, fatigue, pride.

## Palette
Avoid: bright saturation, anime colors, pure black, pure white, neon.

Target palette (Director names; hex values are Claude's PROPOSED anchors, Director veto pending):

| Name | Proposed hex | | Name | Proposed hex |
|---|---|---|---|---|
| Harvest Gold | `#C79A3B` | | Cream | `#F2E9D8` |
| Wheat | `#E8D5A3` | | Rust | `#A85C32` |
| Dust Brown | `#9B7E5B` | | Warm Gray | `#8C8478` |
| Oxide Red | `#8B3A2E` | | Weathered Steel | `#7A8288` |
| Faded Denim | `#6E86A0` | | Barn Red | `#7E2D26` |
| Forest Green | `#3E5C44` | | Coffee | `#4E3B2B` |

## Reputation-reactive portraits (design principle, locked)
**Portraits change with reputation — tiny changes, never dramatic:** warmth, lighting, smile,
eye direction, body angle. Props toggle: coffee mug appears, hat comes off, jacket unzipped,
dealer clipboard disappears. Those little things are enough.

### Implementation note (engine)
Portrait = layered states: base bust + expression layer + prop toggles, selected by reputation
tier / flags (DialogueRunner already routes on both). Pairs with the 2–3 frame jaw-flap. Budget:
one base painting per NPC + small overlay set — not separate paintings per mood.

## Portrait concepts (Director canon)

### Hollis Vann — 62, hay producer, second-generation
Worn cap, sun lines, silver stubble, weathered Carhartt jacket, half smile. Looks like he fixes
everything himself. **Warm:** eyes softer, slight grin. **Cold:** eyes unchanged, smile gone,
mouth flatter.

### Patti — late 50s, runs the diner, knows everything
Reading glasses, coffee mug, hair pinned up. Kind face, dangerous memory. **Warm:** leaning
forward, smile. **Cold:** still smiling — but asking questions instead of telling stories.

### Earl — early 60s, bank manager
Not villain, not friend — risk professional. Tie loosened, reading glasses, rolled sleeves,
stacks of paper. **Warm:** "Sit down." **Cold:** "Let's review the numbers."

### Roy — 50, equipment dealer, salesman who understands machinery
Ball cap, dealership jacket, clipboard. **Retail:** big smile, relaxed posture. **Professional:**
smile reduced, posture straighter, eye contact stronger.

*(Marge, Sandy, Dee, Gus: concepts pending Director notes; same warm/cold delta system.)*

## Production order
1. Sample boards: Hollis rendered 2–3 ways inside the 80/20 formula → Director picks the anchor.
2. Remaining 7 NPCs painted to the anchor, base + overlays.
3. County map illustration in the same palette.
4. Capsule art: paid human artist, Phase 2 (~$100–300) — the one non-negotiable art spend.
