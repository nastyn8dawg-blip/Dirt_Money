# Dirt Money Balance Notes

Date: 2026-07-07

## v0.2 Direction

The playtest showed that the first harvest could pay too much, too quickly. v0.2 tuning keeps the farm recoverable but makes a good first crop create breathing room instead of ending the pressure.

## Economy Changes

- Standard season length increased from 18 weeks to 36 weeks.
- Starting debt increased substantially by background.
- Credit limits increased slightly, but reputation now changes effective credit terms.
- Weekly interest increased from 1.2% to 1.6%, with low reputation worsening terms and high reputation improving them.
- Crop base yields and prices were tuned down.
- Planting and harvest costs were increased.
- Fertilizer, weed treatment, and soil testing costs were increased through shared balance knobs.
- Harvest cost now scales a little more with acres.

## Repair Credit

- Cash repair uses the normal repair estimate and subtracts cash only.
- Credit repair finances the whole amount and does not touch cash.
- Credit repair includes a 10% shop/credit premium.
- The Machine Shed button now shows the financed amount and the premium before click.

## Contract Balance

- Most contracts now take time after acceptance.
- Immediate jobs must be explicitly marked as instant.
- Contracts can wear equipment, require parts, require cash/fuel, expire, and affect reputation.
- Rewards can be slightly better at high reputation and slightly worse at low reputation.
- Completed and failed contracts leave the active board after a short delay.
- New contracts refresh over time to maintain a limited board.

## Reputation Effects

- Low standing reduces effective credit and limits some neighbor work.
- Medium standing keeps normal terms.
- High standing improves effective credit and contract reward value.
- Dashboard and bank screens now explain what standing does.

## Events

- Weekly events can now appear in reports.
- First event set includes wet fields, drought stretch, storm damage, neighbor request, and bank pressure.
- Wet fields can block harvest for a week.
- Drought and storm events can increase stress or reduce field condition.
- Events are rare enough to avoid constant punishment.

## Sanity Test

The test suite includes an early economy simulation that plants all starting fields in winter wheat, advances to harvest, sells stored crop, and asserts the first harvest does not leave cash above debt or create runaway cash.

## v0.2.1 Rule Tuning

- Soil Test costs $40, records a field-level result, and stays current for 6 weeks.
- Soil Test cannot be repurchased while current, preventing wasteful repeat clicks.
- Ready crops lock yield potential when they reach harvest-ready state.
- Fertilizer and weed treatment do not increase locked ready-crop yield.
- Fertilizer and weed treatment are limited to once per crop stage.
- Weed treatment no longer raises crop stress by default.
- Better Sprayer reduces weed treatment cost by 10% and improves weed reduction.
- Harvest Upgrade reduces harvest cost by 8% and softens weather loss on ready crops.
- Used Planter Upgrade gives a small standing-crop yield potential bump.

## Rotation and Year Structure

- Previous crop is tracked per field.
- Corn after corn applies a light fertility, stress, and yield penalty.
- Old School Farmer gets a smaller corn-after-corn penalty and clearer rotation warning text.
- Soybeans after corn, hay history, and cover crop history improve field outlook.
- Week 36 is now an end-of-year checkpoint with a continuation option into Year 2.

## Guidance and Event Tuning

- Dashboard priorities point players toward urgent harvest, contract deadlines, rough equipment, stale soil tests, weed pressure, and affordable upgrades.
- New events add input discounts, equipment warnings, market rumors, and rare severe-community storm pressure.
- Input discount events reduce planting, fertilizer, and spray costs for the current week only.

## v0.3.1 Ag Realism and Stress Tuning

- Field action availability now comes from one central rule engine so batch and field-detail buttons agree.
- Scout Field and Scout All are free information actions, limited to once per field per week.
- Fertilizer applications are capped by crop cycle: corn up to 2, soybeans and winter wheat 1, hay 3, cover crop normally 0.
- Fertilizer after crop maturity is disabled because yield is mostly set.
- Weed treatment is most useful in early crop stages and disabled once canopy/maturity makes yield response unlikely.
- Corn and soybeans are annual cash crops and cannot be replanted in the same field/year after annual planting or harvest.
- Hay can regrow after cutting when enough season remains, creating a smaller recurring income path.
- Post-harvest annual crop fields can move into cover crop, hay, fallow, or wait for next year.
- Weekly stress no longer climbs automatically for every field. It changes from causes such as dry weather, wet fields, weed pressure, fertility, rotation, and storm damage.
- Stress summaries show cause, effect, recovery, and whether the problem is recoverable this season.

## v0.3.2 Weekly Event Tuning

- Each week now generates 1-3 Ash Creek event cards.
- Second event chance is about 45%; third event chance is about 16%.
- Severe Storm Line is gated to later weeks, storm weather, and a rare roll.
- Events are state-aware: ready crops invite weather warnings, rough equipment invites Roy/breakdown pressure, high debt invites bank pressure, high reputation invites land opportunities, and quiet contract boards invite work leads.
- Many event choices consume 1 work slot, making neighbor help, salvage leads, weather response, and contract leads compete with field work.
- Expired events can apply small consequences and are recorded in weekly reports.
- Used Equipment Lead gives a temporary 8% equipment upgrade discount for the current week.

## v0.3.5 Weed / Contract / Economy Tuning

- Weed treatment is now repeatable in later weeks if weed pressure stays meaningful, but repeat spraying in the same week is blocked.
- Weed treatment effectiveness depends on crop timing: early windows have high yield value, mid-season treatment is moderate, late cleanup is low value, and ready crops cannot regain yield from spray.
- Repeated treatments have diminishing weed reduction so the player can respond to pressure without turning spray into a same-season yield exploit.
- The Fields UI exposes current weed pressure, projected reduction, yield-benefit label, work slot cost, and recommendation/disabled text before the player clicks.
- Contract regression coverage verifies that active work steps, work slots, deadlines, and one-time reward claims remain intact.
- Year-one economy simulations now run normal, aggressive, poor, contract-heavy, and salvage-heavy strategies with current work slots to catch obvious runaway outcomes.
- This pass intentionally avoids broad economy nerfs. Some feedback may have come from an older build, and the current work-slot economy needs fresh human playtesting before changing reward or upgrade pacing substantially.

## v0.3.6 Soil / Calendar / Preparedness Tuning

- Soil tests now create structured decision data instead of a long generic paragraph.
- Soil-test recommendations influence field recommendations, fertilizer ROI copy, priorities, and field-card status.
- Corn and soybean planting now obey calendar windows on both starting and leased fields.
- Late allowed planting carries explicit reduced-yield potential instead of silently giving full-season output.
- Cover crop and fallow remain available as late-season alternatives.
- Work slots still do not fully roll over by default.
- Preparedness is capped: IT Nephew can bank 1 unused slot, Farm Office can bank 1, and Organized Operation can bank 2.
