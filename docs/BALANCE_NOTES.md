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
