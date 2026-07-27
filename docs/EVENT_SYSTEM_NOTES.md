# Weekly Event System Notes

## Goal

Weekly Event Cards make Ash Creek feel alive without turning Dirt Money into a disaster simulator. Each week should give the player a reason to look up from the ledger: a warning, a favor, a lead, a pressure point, or an opportunity.

## Event Model

Active weekly events are stored in `game.weeklyEvents`. Each event includes:

- `id` and `templateId`
- `title`
- `source` / `sourcePerson`
- `category`
- `locationId`
- `message`
- `urgency`
- `weekGenerated`
- `expiresWeek`
- `choices`
- `visibleConsequence`
- `resultText`
- `seen`, `resolved`, `handled`, and `expired`
- `appearsInReport`

Resolved and expired outcomes are also copied into `game.events` for recent ledger history.

## Categories

The first full pass supports:

- weather
- neighbor
- bank
- market
- salvage
- equipment
- contract
- reputation
- land
- community

## Weekly Flow

At week start, the game generates 1 to 3 events:

- 1 guaranteed event if any candidate exists
- 45% chance of a second event
- 16% chance of a third event
- severe storm events are gated by season, storm weather, and a rare roll

Unresolved events expire on week advance. Expiration can be harmless, but some events apply a small consequence, such as equipment wear, dry-weather stress, missed discounts, or reputation pressure.

## Work Slot Integration

Some event choices consume weekly work slots:

- helping Hollis or the Grange
- hauling seed
- listening to Roy or doing quick repair response
- visiting Gus or inspecting questionable salvage
- checking ready crops before rain
- running water in a dry stretch
- securing the yard before a severe storm
- offering your name for county work
- inspecting a used equipment lead

If the player does not have enough slots, the event choice is disabled by the shared work-slot helper.

## Event Eligibility Rules

Weekly events and event choices must be state-aware. An event can only generate when its premise is true for the current farm, and a choice can only appear when it has a useful target.

- Ready-crop choices only appear when at least one field has a ready crop.
- Heavy rain adapts by field state: no crops means field-condition and planting choices; growing crops means wet-field or weed-window choices; ready crops means harvest-timing choices.
- Drought events only damage or water growing crops. With no crops planted, dry weather is a planting-outlook warning.
- Weed/spray language only appears while a field is in a useful weed-control window.
- Equipment warnings need early-season onboarding value, poor machine condition, or near-term fieldwork relevance.
- Bank pressure needs debt, credit, or cash pressure.

Choices that cost a work slot must produce a concrete result, such as scouting a field, changing stress, harvesting a crop, improving equipment, creating a contract lead, or changing relationship/reputation. Pure information should usually cost 0 slots.

Old saves are also protected: if a stale event contains an invalid choice, the choice is hidden from the dashboard and blocked at resolution with a clear reason.

## Current Event Families

- Weather: Heavy Rain Coming, Rain Window, Dry Stretch, Severe Storm Line
- Neighbor/community: Hollis Called Before Breakfast, Marge Needs Grange Help
- Market: Patti Has Elevator Talk, Earl Mentions Crop Timing, Co-op Discount Notice
- Salvage: Gus Found Something In The Yard, Questionable Deal Behind Gus's Shed
- Equipment: Roy Heard Something Ugly, Breakdown Risk, Used Equipment Lead
- Bank: Dee Says Earl Is Watching Notes, Payment Pressure
- Contract: Sandy Needs Names For County Work, Marge Is Short On Drivers
- Land/progression: Ash Creek Trusts You Now, Lease Opportunity
- Fallback texture: Quiet Morning

## Tuning Intent

Events should add choice pressure, not bury the player. Most effects are small. Severe weather is rare. Helpful events exist alongside stressful ones. A quiet week is still allowed, but it should now feel like an opportunity rather than empty UI.
