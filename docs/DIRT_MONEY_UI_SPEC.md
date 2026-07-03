# DIRT MONEY — UI Specification
*Elaborates MASTER_SPEC §4 pillar 1 and §7. Differentiation rule: **if a screen looks identical across all three backgrounds, it is a failed screen.***

## 1. Screen inventory (vertical slice)

| Screen | Purpose | Background differentiation |
|---|---|---|
| Main menu | New run / continue / options | — (exempt: pre-character) |
| Character select | Pick background; sets the whole run's interface | Shows each background's *interface preview*, not stats |
| World map (Ash Creek County) | Node travel, ~10 locations, fuel/time costs | Old School: hand-drawn feel, gossip markers. IT: overlay data pins. Mechanic: breakdown/salvage markers |
| Farm HUD (home base) | Day/time, cash/debt, weather, field states, orders | Old School: qualitative field text. IT: dashboard tiles + forecast. Mechanic: equipment status rail |
| Field order dialog | One-tap order: crop, field, duration, cost. Confirm | Mechanic adds breakdown-probability detail; IT adds profit projection |
| Field zoom | Progress, fuel burn, time left, weather risk | Mechanic only: live condition readouts |
| Market/elevator | Sell crops, see prices | IT: charts + forecast bands. Old School: today's price + gossip line. Mechanic: price only |
| Contract board (co-op) | Available contracts by reputation tier | Tier visibility varies; repair contracts Mechanic-only; legacy contracts Old School-only |
| Equipment screen | Machine list + condition | Mechanic: 6 subsystems. Others: single summary ("looks fine?") |
| Dialogue view | Talking portrait + text + options | Options gated/labeled per background (visible odds) |
| End-of-run report card | Cash, debt, contracts, specialization score, rep summary, ending title | Card styling reflects background; shareable layout |
| Run comparison | Side-by-side of two+ runs | — (cross-run) |

## 2. Dialogue presentation (locked)

- **Punch-Out-style talking portraits:** character bust, 2–3 frame jaw-flap while text scrolls.
- **Gibberish audio:** Animalese-style syllable blips from per-NPC pitch/tempo profiles; emotion modulation (excited = faster+up, angry = louder+down+hard stops, sad = slow+quiet).
- Check options rendered as: `[Mechanic 40] "Let me look at that baler myself." — 65%` with a risk tag when variance is high.
- Failed-gate options shown grayed with the reason (unless data flags them hidden).

## 3. Report card (replay trigger)

The screenshot players post. One screen: run title + background emblem, headline numbers (cash, debt delta), contract record, specialization score, top/bottom reputation, ending title (data-driven from run flags). "Compare runs" and "New background" buttons — **"New background" is the most prominent button in the entire game.**

## 4. Principles

- No input requires a tutorial. If a screen needs explanation, redesign the screen.
- Greybox first: ColorRect + Label quality until systems prove out. UI theme is an approval-gated deliverable.
- Text-heavy, animation-light. Readability at 1280×720 minimum.
- Every screen script starts by reading `GameState.background` — exemptions (main menu, run comparison) are listed here and nowhere else.

## 5. Approval gates (from CLAUDE.md)

UI theme, portrait style, report card design, capsule art: 2–3 options presented to the Creative Director before batch production.
