# TMQ Scoring Algorithm v3 (Calibrated on 10 real TMQ pieces)

This version replaces v1 and v2. It is built on ten real pieces from the TMQ history (all supplied by the founder for review). The ten are the calibration library: the detector must reproduce their scores before it is trusted on anything new. The companion file `TMQ_calibration_library.json` holds the texts, levels, points and scores.

Important: the ladder below is one scorer's calibrated judgement (Claude's, with the founder). It is not ground truth. Re-rate the pieces by hand with the co-founders, overrule anything you disagree with, and update the JSON. The tiers rank pieces within this set. They are not a judgement of the writers.

## 1. What went wrong before

**The old scale compressed everything.** The v1 scores (out of 70) given earlier in this project for the same pieces were:

| Piece | Old v1 score | As a percent |
|---|---|---|
| If Walls Could Speak | 60.5/70 | 86% |
| Soul of Dead Ink | 53/70 | 76% |
| The Great Separation | 54/70 | 77% |
| What Is Love? (Diya) | 50/70 | 71% |
| Jantar Mantar poem | 49.5/70 | 71% |
| Unsent letter v1 / v2 | 56.5 / 59 (plus +15 / +17 bias, 65 and 67.5 of 70) | 81% to 96% |

Every piece landed between 71% and 96%, so the scale could not tell a masterpiece from a protest poem full of filler. Two further errors: Emotional Bias was added as raw points on top of the total, and there were no anchors, so the score depended on how generous the scorer felt.

**Your site then swung both ways.** It gave 85/100 to the Kashi poem (over-scored) and 47/100 to the war-survivor poem (under-scored). That is what an LLM-only scorer without anchors does: it varies with the topic's mood, not with the writing.

## 2. Design: three layers

1. **Layer A: mechanical features** (computed by code, never by the LLM). These set hard caps.
2. **Layer B: anchored levels** (LLM, with the real examples in section 5 as few-shot anchors and an evidence rule).
3. **Layer C: calibration gate** (regression test against the ten-piece library; see section 8).

The authenticity (AI-likelihood) verdict stays separate, as defined in Part 1 of the earlier algorithm. It never uses Emotional Bias.

## 3. Scale, tiers and N/A rule

**Levels.** Each metric is scored at a level from 0 to 4, half-points allowed. Points = metric max × level ÷ 4.

| Level | Meaning |
|---|---|
| 0 | Absent or failing |
| 1 | Weak, visible on first read |
| 2 | Competent: no real fault, nothing distinctive |
| 3 | Strong: clear craft |
| 4 | Exceptional: quotable, shapes the whole piece |

**Metric maxima (70 raw points):** Meter 4, Rhyme 4, Syllabic 3, Musical-Emotional Fit 6, Iceberg Depth 8, Subtext 6, Emotion Containment 6, Voice 7, Specificity 7, Cliché Density 5, Discovery Arc 5, Pivot 5, AI-Likelihood (inverted) 4.

**N/A rule.** Meter, Rhyme and Syllabic are N/A when end-rhyme appears in fewer than half of the stanzas. Then the available total is 59 and the percent is earned ÷ 59. This is why free verse and prose are not punished for lacking rhyme.

**Tiers:**
- Very good: 80 and above
- Good: 65 to 79
- Average: 50 to 64
- Bad: 40 to 49
- Worst: below 40

**Distribution target for real submissions:** the median should be about 55 to 60. If the tool gives 80 or more to more than 1 in 10 pieces, or gives most pieces 70 or above, it is inflating.

## 4. Layer A: mechanical features and caps

Compute these in code, then pass the numbers to the scorer.

| Feature | How to compute | Cap if triggered |
|---|---|---|
| Told-emotion density | Words from the told-emotion lexicon (love, heart, soul, light, strength, forever, eternal, sacred, divine, holy, pain, prayer, faith, hope, sorrow, tears, grief, fear, scared, regret, guilt, beauty, angel, heaven and similar) per 100 words | 6 or more per 100: Iceberg ≤ 3/8 and Containment ≤ 2/6 |
| Repetition | Most repeated 3-word phrase | 5 or more times with no escalation: Iceberg ≤ 3/8 and Cliché ≤ 2/5 (see refrain test) |
| Personal moments | Count unrepeatable moments: something someone actually said, a specific gesture, an object, a sensory detail one person would have. Place names and famous rituals do not count | 0 moments: Specificity ≤ 2/7. 1 to 2: ≤ 4/7 |
| Stock phrases | Matches against the TMQ cliché list | 6 or more: Cliché ≤ 1/5 |
| Rhyme padding | End-rhymes where the rhyme word adds no meaning | 3 or more: Rhyme ≤ 2/4 |
| Syllable or line spread | Standard deviation of syllables per line (poems with end-rhyme) | Above 3 with no deliberate pattern: Meter ≤ 2/4 and Syllabic ≤ 1/3 |
| Ending check | Final stanza closes on "forever" or "eternal" without reframing | Discovery Arc ≤ 3/5 |
| Register check | Archaic and modern diction mixed with no purpose | Voice ≤ 4/7 |

**Refrain test.** Repetition is acceptable when it escalates or changes meaning (Gaza poem: the victims grow more vulnerable each stanza; Diya's "to love is": each time a new definition). It is penalised when it only swaps an adverb (Kashi poem: "held your hand tightly / firmly / tighter").

**Overall caps.** Final ≤ 69 if Specificity or Iceberg is below 4/8 (scaled). Final ≤ 59 if both are at level 1 or lower. A score of 90 or more also needs Voice ≥ 6/7, Specificity ≥ 5/7 and Iceberg ≥ 6/8.

**Emotional Bias.** `EB = Impact − Earned`, where Impact (0 to 10) is how strongly the topic alone would move a reader and Earned is the average of Containment, Specificity and Subtext converted to 0 to 10. Topic-prestige guard: Impact starts at 6 for sacred, romantic, grief and protest subjects, and 8 to 9 for war, violence and death.
- EB above +2: subtract 2.5 points for every EB point above 2, to a maximum of 5.
- EB between −2 and +2: no change.
- EB below −2: add 2.5 points for every EB point below −2, to a maximum of 5.
Emotional Bias is applied to the percent, never as raw points on the total.

## 5. Layer B: anchored examples from real pieces

Use these as few-shot anchors. Each level 4 or level 1 judgement must quote evidence like these.

| Metric | Level 4 example | Level 1 example |
|---|---|---|
| Iceberg Depth | "Not pain. Not panic. / Just… weight." (Nothing's wrong) | "you were my strength, my heart, my light" (Kashi) |
| Emotion Containment | "Just silence. / No, noise... / Nothing" (Nothing's wrong): the feeling is never named | The rip-peel-tear stanza and "Won when life just gives up" (Ghost): melodrama states the feeling |
| Specificity | "Subway surfer on tabs… Peeling food without being asked to" (If Walls Could Speak); "my mother saving the last piece of cake for me when she absolutely loves it more than me" (Diya) | "Faith began to shine"; "Assi… Manikarnika" used only as scenery, with no personal moment (Kashi) |
| Voice | "your extremely high pitched laugh almost pricking our ears but never in an annoying way, it felt like home" (If Walls Could Speak) | "fierceful," "red noses to the grindstone's soil," brief-driven pastiche (The Great Separation) |
| Cliché Density | "Maybe because he was insect, they carry pesticide" (Gaza poem) | "faith began to shine," "my heart, my light," "forever" ×4 (Kashi) |
| Pivot | "They wouldn't only talk about your death…" (If Walls Could Speak); "that's what scares me" (Nothing's wrong) | No turn at all: ten "I wish…" stanzas in the same key (Jantar Mantar) |
| Discovery Arc | "every one of us still speaks a little like you" (If Walls Could Speak) | "I wish I could speak of better tomorrow…" repeats the start (Jantar Mantar) |
| Musical-Emotional Fit | The stalling line breaks of "I don't know / What's wrong / With me" (Nothing's wrong); the interrogation rhythm of the Why/Was/Maybe template (Gaza poem) | A prosy, padded beat under a prayer (Kashi) |
| Rhyme | ABABCC held across six stanzas (The Great Separation) | "age / rage," "race / pace" strain (Jantar Mantar) |
| Subtext | "Maybe because letting her live was heavy toil" (Gaza poem): the cruelty is in the understatement | Only literal meaning, e.g. "Be my aarti, be my Kashi, be my love language" (Kashi) |

## 6. The calibration library (final v3 scores)

| # | Piece | Form | Tier | Final | Why |
|---|---|---|---|---|---|
| 1 | If Walls Could Speak (eulogy) | prose-poem | **Very good** | 83.7 | Eight personal moments, death withheld until late, a real pivot and an earned ending; only typos and a few tells hold it back |
| 2 | Nothing's wrong (monologue) | free verse | **Good** | 76.8 | Best restraint and iceberg in the set, but zero personal moments, so Specificity is capped at 2/7 |
| 3 | What Is Love? (Diya) | essay | **Good** | 66.5 | Real specifics (cake, coffee, dog) and an honest reversal ("I would live for them"); loose structure and told definitions |
| 4 | Why am I still alive? (war-survivor poem) | free verse | Average | 63.2 | Escalating refrain and vivid bread-in-hand image; grammar slips break key lines and the last stanza states the feeling |
| 5 | Ghost | free verse | Average | 62.4 | Strong kid/adult contrast and pivot ("But adult me?"); the gore stanza and ending are melodramatic |
| 6 | Unsent love letter (v2) | rhymed | Average | 57.1 | The unsent-letter idea and the parentheses voice work; forced rhymes and generic imagery |
| 7 | The Great Separation | rhymed | Average | 55.7 | Perfect ABABCC and a staged illness arc; borrowed voice and no personal moments |
| 8 | Love Letter to Kashi | rhymed | Bad | 42.9 | "Held" ×12, told-emotion 7.3 per 100 words, stacked adjectives; one real idea in the moksha turn |
| 9 | Soul of Dead Ink | rhymed | Bad | 42.2 | A distinct, self-aware voice, but forced rhyme, mixed registers and many errors |
| 10 | Jantar Mantar protest poem | rhymed | **Worst** | 36.8 | "I wish I" ×6 with no turn, forced rhymes, generic grievances; the stroke stanza is the one strong moment |

**Per-metric points (blank means N/A):**

| # | Met | Rhy | Syl | MEF | Ice | Sub | Con | Voi | Spe | Cli | Arc | Piv | AI | Pts / avail | EB adj |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | 4.5 | 6.5 | 4.5 | 4.5 | 6.1 | 6.1 | 4.1 | 4.4 | 4.7 | 4.0 | 49.4 / 59 | 0 |
| 2 | | | | 5.2 | 7.0 | 4.5 | 5.6 | 5.7 | 2.0 | 3.8 | 3.1 | 4.4 | 4.0 | 45.3 / 59 | 0 |
| 3 | | | | 3.4 | 4.0 | 3.0 | 3.8 | 5.2 | 5.2 | 3.1 | 3.8 | 3.8 | 4.0 | 39.2 / 59 | 0 |
| 4 | | | | 3.8 | 4.5 | 3.8 | 3.4 | 4.8 | 4.8 | 3.1 | 3.1 | 3.1 | 4.0 | 38.4 / 59 | −1.9 |
| 5 | | | | 3.8 | 4.0 | 3.4 | 2.6 | 4.8 | 4.8 | 2.5 | 3.4 | 4.1 | 4.0 | 37.4 / 59 | −0.9 |
| 6 | 1.5 | 2.5 | 1.1 | 3.4 | 4.0 | 3.4 | 3.0 | 5.2 | 3.1 | 2.5 | 3.1 | 3.1 | 4.0 | 39.9 / 70 | 0 |
| 7 | 2.0 | 3.2 | 1.1 | 3.8 | 4.0 | 3.4 | 3.8 | 3.1 | 2.0 | 2.5 | 4.1 | 3.1 | 3.0 | 39.0 / 70 | 0 |
| 8 | 1.0 | 2.0 | 0.8 | 3.0 | 2.5 | 3.0 | 2.2 | 3.1 | 3.1 | 1.6 | 2.8 | 3.0 | 2.0 | 30.0 / 70 | 0 |
| 9 | 1.0 | 1.5 | 0.8 | 2.2 | 3.0 | 3.0 | 1.9 | 4.8 | 1.8 | 1.6 | 3.1 | 3.4 | 4.0 | 32.1 / 70 | −3.6 |
| 10 | 1.2 | 1.5 | 1.1 | 2.6 | 2.5 | 2.2 | 2.2 | 3.5 | 2.0 | 1.9 | 1.9 | 2.5 | 4.0 | 29.2 / 70 | −5.0 |

## 8. Layer C: the calibration gate (regression test)

Before any scoring release, run all ten pieces from `TMQ_calibration_library.json` through the detector. Ship only if both checks pass:

1. **Rank order holds:** 1 > 2 > 3 > (4, 5, 6, 7 in any order) > (8, 9 in either order) > 10, so the very good piece scores above both good pieces, and the worst scores below everything else.
2. **Every piece lands within ±6 points of its library score.**

## 9. Output format

Return, in this order:
1. Three biggest flaws with one quoted line each.
2. The mechanical numbers and any caps they triggered.
3. Each metric: level, points, one or two quoted lines.
4. Raw points over available points (59 or 70), then percent.
5. Emotional Bias: Impact, Earned, EB, and the adjustment in percent points.
6. The gates applied, then the final score and tier.
7. The nearest library piece ("closest to #4, the war-survivor poem") so a reader can sanity-check the score.
8. Three questions for the writer, so any revision stays theirs.
