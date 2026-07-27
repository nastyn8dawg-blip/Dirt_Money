# Work Preparedness Notes

## Design

Work slots still reset each week. Unused work does not fully roll over by default.

Preparedness is a capped perk:

- Base farm: cap 0.
- IT Nephew: cap 1.
- Farm Office Planning Board upgrade: cap 1.
- Organized Operation upgrade: cap 2.

## Behavior

At week advance, unused work can bank up to the current preparedness cap. Banked work appears as bonus work availability next week, for example `Work 6/5` with `Preparedness +1/1`.

The cap prevents stockpiling. If more unused work remains than the cap allows, the report explains that unused work was lost and better planning upgrades can bank more.

## Save / Load

Preparedness state is stored on `state.work` as `banked` and `bankedCap`.
