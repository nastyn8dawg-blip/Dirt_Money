# Dirt Money v0.3.4 Changelog

## Salvage Direct-Use Repair Fix

- Fixed direct salvage use on equipment so compatible salvage visibly improves the selected machine's condition.
- Added a central salvage/equipment preview helper that reports compatibility, previous condition, projected condition, repair amount, work slot cost, and whether the salvage item will be consumed.
- Incompatible salvage can no longer be used on the wrong machine. The UI disables the action and explains that the item should be stripped for parts or sold instead.
- Salvage direct-use result messages now include before/after equipment condition, for example: `Condition improved from 42% to 56%.`
- The salvage screen now shows compatible equipment and direct-use projected repair amounts before the player commits.

## Tests

- Added coverage for buying salvage, direct use on the Faded Gleaner, incompatible equipment, condition cap at 100, work slot consumption, save/load persistence, UI projection text, stripping salvage, and parts-based equipment repair.
