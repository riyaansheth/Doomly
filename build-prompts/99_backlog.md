# Backlog — not phases

Ideas parked deliberately. Numbered 99 so it sorts last and is never mistaken for a build
phase. Nothing here is in scope for v1; each needs its own phase file before it is built.

## Requested

### Habit tracker
Study as a habit, not just a session — a recurring commitment the student sets and Doomly
tracks against.

Open questions before this becomes a phase:
- **What is the unit?** Minutes scrolled, cards seen, or topics moved above a mastery
  threshold. Minutes are the easiest to game and the least connected to learning.
- **How does it avoid becoming a streak?** Streaks, badges and points are explicitly out of
  scope in phase 1, because they inflate engagement and hide whether the *content* is good —
  which is the only thing v1 measures. A habit tracker is the same idea wearing a calendar,
  and it needs a real answer for why it isn't.
- **Does it own a tab, or live on Home?** The tab bar is full at five.
- Interactions already carry timestamps and dwell, so the data exists; this is a product
  question, not a data one.

### AI notes creator from PDF
Generate structured revision notes from uploaded material — the condensed summary a student
would otherwise write by hand.

Open questions:
- **Phase 1 says Doomly is not an AI notes summariser**, because that market is crowded and
  the feed is the product. This feature contradicts that positioning directly. It needs a
  deliberate decision to widen the product, not a quiet addition.
- **Where do notes live?** A note is a document, not a card, and nothing in the current
  schema holds long-form output.
- **Reuses the pipeline**: the same chunks that produce cards can produce notes, so the
  marginal cost is one more call per document, not a new ingestion path.
- **Export matters more than display.** Notes that can't leave the app as PDF or markdown
  are worth much less than notes that can.

## Already identified, still unbuilt

- **"Lost me" should do something.** It currently logs a row and the confusing card stays
  confusing — a dead end in the middle of the core loop. The lazy version isn't a chat UI:
  regenerate *that card, simpler*, inline, using its own source chunk.
- **The feed dead-ends.** Generation only runs at upload, so once cards are exhausted the
  cooldown means nothing returns. Trigger a background chunk when the pool runs low.
- **Save has no destination.** You can save a card and never see it again. Either add a
  saved view — a filter on the existing feed — or remove the button. A feature that does
  nothing is worse than no feature.
- **Email sign-in**, when someone actually needs a second device.
