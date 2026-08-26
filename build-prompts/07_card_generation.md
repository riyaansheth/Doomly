# Phase 7 — Card generation

One OpenAI call per chunk, returning structured cards. This phase decides whether the
product teaches anything, so it matters more than any screen.

## Formats — five, and the mix is the point

| type | payload |
|---|---|
| `concept` | `{ title, body }` — the card that does the teaching |
| `mcq` | `{ question, options[4], answerIndex, why }` |
| `code_bite` | `{ code, question, answer }` |
| `exam_trap` | `{ claim, reality }` — a specific confusion that loses marks |
| `true_false` | `{ statement, isTrue, why }` |

**Why five and not two.** A feed of question/answer pairs is Anki with swiping. The format
has to keep changing shape or the scroll dies. Rotating formats is a product requirement,
not variety for its own sake — state it in the prompt.

## Teach before you test — the rule that matters most

An earlier build served an MCQ on Trees before ever explaining what a tree is. Students
were answering questions about concepts the app had never shown them, and the app felt
useless while looking fine.

Enforce it **twice**, because either alone fails:

1. **In the prompt.** For every topic it touches, the model writes the `concept` card that
   explains it from scratch *first*, and never asks something the concept cards in the same
   batch don't equip the student to answer.
2. **In the ranking** (phase 9). A non-concept card stays hidden until the student has
   actually *seen* a concept card for that same topic.

The prompt alone is not enough — generation order is not display order.

## The difficulty ladder

Difficulty is a rung, not a vibe:

```
1  what it is, in plain words
2  its parts, and the vocabulary for them
3  how it behaves
4  a subtlety, trade-off or comparison
5  apply it under exam pressure
```

Every new topic opens at 1. The student's **level** from phase 6 concentrates output in a
band (1–3 / 2–4 / 3–5) but never skips the opening explanation — an advanced student
skimming an unfamiliar topic still needs the definition, briefly.

## Grounding

Grounded mode: *use only the supplied text, never add outside facts, and set `source_page`
from the `[page N]` marker the content came from.* Fewer cards from thin text is correct
behaviour.

Topic mode: no source, so teach from your own knowledge and set `source_page` to 1.

Clamp the returned page into the document's real range before inserting. A hallucinated
page number breaks the citation link, which is the one promise the product makes about
accuracy.

## Structured output

Use a strict JSON schema. `topic` and `difficulty` come back as **fields on the same call**
— not a second classification pass. Two calls where one will do is the easiest place to
waste the one paid dependency.

The schema cannot tie `type` to its payload shape, so validate that in code and drop cards
whose payload doesn't match their type.

Ask for 6–10 cards per chunk.

## Card quality bar

- A `concept` body actually explains: 2–4 sentences, a concrete image or example, and it
  never restates its own title
- `code_bite` only when the material genuinely contains code
- `exam_trap` presumes the concept is understood, so it is never a topic's first card
- Every card readable in a few seconds on a phone

## Deliverable

Generation on a real PDF chunk returning 6–10 cards with a visible format mix; a level-1
run producing difficulties in the 1–2 band and opening with concept cards; correct page
citations; and a hand-check of ten cards against the source for anything invented.
