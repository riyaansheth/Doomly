# Phase 13 — Brainrot mode

A toggle that retells every card in the voice of a chronically-online narrator. Off by
default.

It sounds like a joke feature. It is the clearest expression of the product's thesis: the
same syllabus, delivered in the register the audience actually reads all day.

## Generate both versions in one call

The slang retelling is written **in the same OpenAI call as the card**, into a `brainrot`
jsonb column: `{ title, body }`.

This is the whole design. Both versions live on the card, so the toggle is instant and free
and nothing is ever overwritten. Regenerating on toggle would mean an API call per card,
every time — and this is the one paid dependency.

Cards made before the feature have no retelling and must fall back to their normal wording,
handled, not crashing.

## What it may never change

Brainrot must not be able to make a student get a question wrong.

- **MCQ options and which is correct** — untouched
- **Code blocks and stored answers** — untouched
- **A `true_false` statement — untouched.** That sentence *is* the thing being judged;
  restating it could flip its truth. Only its explanation is retold.

Put that rule in one pure function with tests, not scattered through the renderer:

```ts
retell(on, type, brainrot, title, body) → { title, body }
```

Four cases worth testing: off returns the original; on returns the retelling; a
`true_false` statement is never restated; a card with no retelling falls back cleanly.

## The register

```
normal:   A stack is a Last-In-First-Out data structure.
brainrot: stack is lifo coded 🍽️ last one in is first one out,
          it's giving pile of plates
```

All lowercase, short clauses, real slang used naturally rather than sprayed on, one or two
emoji at most, **shorter than the original, never longer**.

Prompt rules: identical meaning, no new claims, no invented examples, and never a joke that
replaces the explanation. It changes the delivery, never the facts.

**Calibrate the tone deliberately.** A first pass will come back too mild — a textbook that
shortened a sentence. Push it with an explicit example of the register in the prompt. But
full unhinged wins the aesthetic and loses the comprehension, which defeats the app. Stop
where the meaning is still obvious on one read.

## State lives in a cookie

Not `localStorage`. The feed is server-rendered, so the server must know the setting to put
the right wording in the first HTML — otherwise the page renders normal text and flips
after hydration.

The general rule, worth writing down: **if the server renders it, it's a cookie; if only
the client cares, `localStorage`.** The theme uses `localStorage` for exactly that reason.

## Deliverable

Cards carrying both versions from one generation call; the toggle in Settings flipping the
feed with no regeneration and no flash; a `true_false` statement provably unchanged in both
modes; older cards falling back; and the four tests passing.
