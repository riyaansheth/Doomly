# Phase 9 — Ranking engine

What card comes next. One SQL function, `next_cards(subject_ids[], limit)`, returning rows
from `cards`. **Ordering and filtering only — no ML, no service, no embeddings.**

Keeping it in SQL means it runs where the data is, stays inspectable, and can be reasoned
about by reading forty lines.

## Two filters — correctness, not preference

These apply in **every** mode. They are in the `WHERE` clause and nothing may bypass them.

**Teach before test.** A non-`concept` card stays hidden until the student has *seen* a
`concept` card for that same topic. Include a safety valve: if a topic has no concept card
at all, its other cards must not be stranded forever.

**A two-band cooldown.** A card answered wrong returns after **1 day**; one the student
knows is gone for **30 days**. Compute from the card's *latest* interaction and whether it
was *ever* missed — otherwise the `seen` row logged alongside a wrong answer wins and the
card vanishes for a month.

Deliberately not SM-2. Two bands is enough to prove the loop; upgrade only when retention
data says otherwise.

## The ordering

1. **Mastery bucket, weakest first** — bucketed (`floor(score × 3)`), not raw. Raw score
   serves forty cards of one topic in a row.
2. **Concept first while weak** — below 0.6 mastery, explanation precedes interrogation.
3. **Difficulty tracking mastery** — aim at `1 + mastery × 4`, order by distance from it.
4. **Exam phase** reweights the *format mix*, never restricting it:
   - more than 14 days out, or no exam → learn: everything
   - 3–14 days → recall: prefer `mcq` and `true_false`
   - under 3 days → panic: prefer `exam_trap` and `concept`
5. `random()` last, to break ties.

## Syllabus mode

`subjects.order_mode = 'syllabus'` swaps the ordering for
`(first_document, first_page, difficulty)` from the `topic_order` view — walking the
material in the order the course teaches it.

**Only the `ORDER BY` changes.** Teach-before-test and the cooldown stay. "Follow my
syllabus" changes what order you see things in, not whether you get quizzed on something
you were never taught.

## Mixing subjects

`next_cards` returns per-subject ranking; the client mixes. Weight each subject by
`subject_priority` (urgency × weakness) and fill each slot from whichever subject has the
best **weight ÷ cards-already-served** ratio.

Proportional in aggregate, self-correcting slot by slot, deterministic, and it never runs
one subject in a block. Roughly ten lines, and the only part of ranking worth unit-testing:
assert the share is proportional *and* that no subject runs more than three in a row.

Even round-robin is the thing to avoid — it gives a Computer Networks exam in three days
exactly the same share as a Data Structures exam in forty.

## Batch size

Fetch ~15 at a time, topping up before the end. Large batches make the teach-then-test
rhythm turn over too slowly — with the gate in place, the first batch is nearly all concept
cards, and questions only unlock on the next fetch.

## Deliverable

`next_cards` applied and confirmed present in `pg_proc`; a fresh subject opening with
concept cards, not questions; a deliberately-wrong card reappearing the next day and a
correct one not; two subjects with exams 3 and 40 days out visibly leaning toward the near
one, checked against `subject_priority`; syllabus mode tracking document and page order;
and unit tests for the mixing function.
