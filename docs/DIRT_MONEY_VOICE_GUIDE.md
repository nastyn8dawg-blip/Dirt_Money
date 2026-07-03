# DIRT MONEY — Voice Guide
*Canonized from Director-authored lines and tone rulings, 2026-07-03. This is the reference for ALL
player-facing prose. The Director still signs off on every final line (CLAUDE.md law 6); this guide
exists so drafts and structure notes start in the right register.*

## The rule in one sentence
> Ash Creek should sound like a real rural county, not an RPG town.

## Tone — what it is NOT
- **Not caricatured Southern.** Dialect is light: "ain't", "don't" for "doesn't", dropped words —
  never phonetic spelling, never cornpone.
- **Not sitcom rural.** Nobody is a rube; everybody is competent at their own life.
- **Not Stardew whimsy.** No twee, no sparkle. Warmth comes from familiarity, not cuteness.
- **Not quest-giver speak.** Nobody explains mechanics, nobody says "I have a task for you."

## Tone — what it IS
People who have known each other for decades, where **favors, reputation, machinery, weather, and
coffee are the social currency of the county.**

## Canonical examples (Director-authored — study these)

**Stakes stated as facts, not drama:**
> "Baler quit on me halfway through the back forty. Hay's cut, rain's coming, and the dealer says
> maybe Thursday. Hay don't wait till Thursday."

**Competence is understated:**
> "No promises, but I've kept worse running."

**Failure lands dry, not cruel:**
> "Well...that wasn't the bad hose." · "Looks like we found the expensive problem first." ·
> "It ain't personal. Equipment's got a mean streak."

**The favor economy, said out loud:**
> "People remember who shows up." · "County's built on favors more than money." ·
> "I keep score on these things. In a good way."

**Gossip is short and travels fast:**
> "Diner's already heard it." · "Didn't take long for that story to get legs." ·
> "You can keep a secret in Ash Creek about as long as a milkshake lasts."

**Market talk without numbers:**
> "Corn's moving." · "Beans are soft." · "Might be worth waiting a few days." · "Might not."

**Money has weather, weather has money:**
> "Interest don't sleep." · "Payments don't care if it rained." · "Nobody's smarter than a drought."

## Craft rules extracted from the examples
1. **Short declaratives.** The longest canonical line is three sentences. Most are one.
2. **Concrete nouns** — hose, scale, back forty, second cutting, Thursday. Never abstractions.
3. **Time is always specific** — Thursday, Saturday auction, before supper. (Feeds the
   feel-the-calendar law.)
4. **Two-beat rhythm** for wisdom lines: setup, turn. "Bank loves good years. Bank remembers bad ones."
5. **Consequences are social before financial.** The worst outcome of failure is being *talked about*.
6. **Humor is deadpan and shared**, never at a character's expense from the writer's side.
7. **Per-character register** (see CHARACTERS_SPEC): Hollis = slow warmth, long memory. Patti =
   quick, delighted by information. Gus = three words. Earl = complete sentences, zero warmth.
   Marge = clipped efficiency. Roy = friendly words, predatory arithmetic. Sandy = tired precision.

## Environmental writing rules (Director, 2026-07-03)

Weather cues and ambient lines must:
- Describe **observations** — never poetic metaphor, fantasy language, or exposition.
- Never tell the player what to do.
- Speak like county residents.

| Good | Bad |
|---|---|
| "Wind's got somewhere to be." | "A tempest whispers through the valley." |
| "Heat's got teeth today." | "The relentless sun scorches the earth." |
| "Clouds are hanging around but don't seem committed." | "Gray skies threaten the weary farmer." |

> Ash Creek people do not narrate. They **notice. compare. remember. speculate. complain. tease.**
> They rarely lecture.

Structural corollary (locked in code): the gut-about-tomorrow cue is SILENT unless weather worth
sensing is coming. Absence of a line is a line.

## Relationship temperature (Director, 2026-07-03)

> **Friendship is not enthusiasm. Friendship is time.**

Temperature in Ash Creek is measured by **conversation length, not sentiment**:
- **Warm** people volunteer information.
- **Cold** people answer questions.
- **Trusted** people ask questions back.
- **Respected** people stop receiving sales pitches.
- **Forgiven** people receive humor again.

Nobody hates you. People simply decide how much of themselves they're willing to give you.

### Relationship grammar (Director, 2026-07-03 — FORMAL WRITING BUDGET)
Reputation isn't a +10 vendor discount. It's **people spending more of themselves on you.**

| Tier | Sentence budget | What the NPC gives |
|---|---|---|
| **Distrusted** | 1–2 sentences | No volunteered information. No humor. No stories. No questions. |
| **Neutral** | 2–4 sentences | Basic explanations. Practical advice. |
| **Trusted** | 4–7 sentences | Stories. Memories. Offers. Questions. Inside jokes. Warnings. Rumors. |
| **Friend** | NPC-initiated | NPC initiates topics, remembers previous years, asks about family, offers discounts, shares secrets, warns before opportunities disappear. |

These budgets are ENFORCEABLE at review time: a distrusted-tier node with four sentences is a
defect, same as a formula error. Engine hook: entry rules and goto_rules already route on
reputation — tier-length variants of greetings are the standing pattern for every tree.

**This is a structural rule, not just a writing rule.** Cold-door nodes get fewer words and fewer
options than warm-door nodes of the same NPC. When trust rises, trees literally get longer — more
volunteered lines, NPC questions directed at the player. Canonical proofs:
- Cold Hollis: "Morning. / Dealer got her going." (conversation already half over)
- Warm Hollis: "Morning. / Baler's still running, if that's what you're wondering." (humor returns)
- Respected Roy: "Alright. / Let's skip the sales pitch. / What are you actually looking for?" —
  Roy isn't becoming nicer; he's becoming honest. And he asks a question back.
- Tight-credit Earl: "Bank doesn't lend to spreadsheets. / We lend to people. / People come with
  reputations." — no gossip mentioned, no villain, just how risk works here.

## Workflow
Structure-first stays: flowchart + numbered blanks per conversation, Director fills them. With this
guide in hand, Claude may additionally attach *clearly marked draft suggestions* under a blank when
asked — the Director edits or discards them; nothing ships without his wording or explicit approval.
