# Dirt Money v0.3 Playtest Feedback

## Boring Loop / Lack of Engagement
- The core loop works, but it feels too passive: field action, contract, advance week, read ledger, repeat.
- The farm needs interruptions that force a response, not only quiet ledger changes.
- The player needs more reasons to think each week is different.

## Missing Event Popups
- Weather, neighbor calls, county notices, and opportunities are mostly buried in reports.
- Important events should appear as visible cards before or alongside the dashboard.
- Results from major actions need immediate feedback instead of requiring ledger hunting.

## Passive Contracts
- Contracts still feel like accept, wait, complete.
- Marge's seed delivery can fail without the player understanding the missing action.
- Each accepted contract should have an explicit active step, location, deadline, and failure explanation.

## Field Management Tedium
- Managing fields one by one creates chores instead of decisions.
- The Fields page needs to show all important field status at once.
- Batch actions should make common management affordable, readable, and less click-heavy.

## Unclear Stress System
- Stress feels constant and mysterious.
- The player needs a visible cause, yield effect, and recovery path.
- Stress should recover through the right action or weather, but ready crop losses should remain mostly locked.

## Lack of Neighbor Interaction
- Ash Creek does not feel active enough week to week.
- Patti, Hollis, Marge, Gus, Roy, Dee, Sandy, and Earl should create advice, warnings, opportunities, and consequences.
- Not every neighbor item should become a contract.

## Weak End-Of-Season Feedback
- The end report can sound bleak even when the player is clearly thriving.
- Week 36 flow should not imply the player is starting Week 36 again.
- Continuing to Year 2 should feel intentional and clear.

## Narrative / State Mismatch
- Cash, debt, reputation, and equipment condition need to drive the season outcome tone.
- Strong, stable, struggling, and bad outcomes should read differently.
- Weekly events must not offer actions whose premise is false. Week 1 rain should not ask the player to check ready crops when nothing is planted or ready.
- Any weekly event choice that costs a work slot needs a concrete result; otherwise it feels like the game wasted the player's limited week.

## UI Flow Problems
- Dashboard priorities should be specific and actionable, not filler.
- Fields overview needs quick buttons, current soil/scout status, and warnings.
- Result cards should make action outcomes visible immediately.
- Salvage direct-use must show exactly what machine it helps and the before/after condition. A playtest found a Faded Gleaner direct-use action that appeared to complete without visible improvement.

## v0.3.5 Follow-Up: Weeds, Contracts, and Economy
- A later note reported that weeds felt too easy to clear and contracts/economy might still be too generous.
- This feedback may have come from an older build before work slots, active contract steps, and the current stress rules were fully visible.
- Weed treatment now remains repeatable in later weeks when pressure is still meaningful, but same-week repeat spraying is blocked.
- Weed treatment value is stage-based: early treatment is strongest, mid-season treatment is moderate, late cleanup is low value, and ready crops do not recover yield from spraying.
- UI copy now shows current weed pressure, expected reduction, yield benefit, and why late or blocked spraying is not recommended.
- Contract regression tests now protect against accept/complete free rewards, duplicate completion claims, and bypassing active work steps.
- Economy sanity simulations now compare normal, aggressive, poor, contract-heavy, and salvage-heavy play under the current work-slot system.
- No broad nerfs were made from this note alone. The work-slot economy needs fresh human testing before major reward, cost, or upgrade pacing changes.

## Needed v0.3 Fixes
- Weekly event inbox: "This Week in Ash Creek."
- Result cards for important action outcomes.
- Active contract steps with quick actions and abandonment.
- Field overview with batch scouting, soil testing, spray, fertilize, and harvest actions.
- Stress causes, yield effect, and recovery guidance.
- Reputation-triggered opportunities.
- End-of-season report classification based on actual farm state.
