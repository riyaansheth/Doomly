# Voice

Words are design material. The audience is an engineering student, roughly 18–24, mostly
in India, reading on a phone at night with an exam coming. They are fluent in internet
culture and allergic to anything that sounds like their college's portal.

**The register:** a capable friend who has already read the syllabus. Direct, unfussy,
never chirpy. It should not sound like edtech, and it should not sound like a startup
either.

---

## Rules

**Say what happens.** A control is named for its effect. *Start scrolling*, not *Continue*.
*Upload exam timetable*, not *Import*. The name stays the same through the whole flow — the
button that says Archive produces a row that says Archived.

**Sentence case everywhere.** Two exceptions, both structural: section headers and the card
kicker, which are uppercase to mark them as labels rather than content.

**Name things as the student experiences them.** *Card order*, not `order_mode`. *Hidden
from your feed*, not `archived: true`. Nothing in the interface is named after a column.

**Numbers over adjectives.** *23 cards · 11 min · 74% recall* beats *Great progress!* The
whole point of the Progress page is to be checkable.

**Errors say what happened.** They don't apologise and they aren't vague:
- `That video has no captions to read.`
- `No exams found in that file.`
- `Stopped: generation is not advancing.`

**Empty states are invitations.** They name what's missing and link to the fix. Never
"Nothing here."

**Helper text goes under its group, not inside a row**, and only where the behaviour isn't
self-evident:
> Archiving hides a subject and keeps everything in it.

---

## Vocabulary

Fixed terms. Using two words for one thing is how an interface stops being learnable.

| use | never |
|---|---|
| **card** | question, item, post, flashcard |
| **material** | content, resources, documents, files |
| **subject** | course, class, module |
| **Lost me** | I don't understand, Confused, Help |
| **Save** | Bookmark, Favourite, Star |
| **marks** | points, difficulty, level |
| **Archive** | Hide, Disable, Deactivate |
| **Brainrot mode** | Casual mode, Fun mode |

*Lost me* is worth defending. *I don't understand* asks a student to admit something about
themselves; *Lost me* puts it on the card. Same signal, no cost to admit it.

---

## Brainrot mode

A view toggle, off by default. Both versions live on the card — the slang retelling is
written in the same generation call — so switching is instant and reversible, and nothing
is overwritten.

**What it changes:** the card's headline and its explanation.

**What it must never change:**
- MCQ options and which one is correct
- code blocks and stored answers
- a `true_false` statement — that sentence *is* the thing being judged, so restating it
  could flip its truth. Only its explanation is retold. The rule lives in `lib/brainrot.ts`
  with tests.

**The register:**
```
normal:   A stack is a Last-In-First-Out data structure.
brainrot: stack is lifo coded 🍽️ last one in is first one out,
          it's giving pile of plates
```

All lowercase, short clauses, real slang used naturally, one or two emoji at most. Shorter
than the original, never longer.

**The line it must not cross:** it changes the delivery, never the facts. No new claims, no
invented examples, and no joke that replaces the explanation. Tone was deliberately dialled
back from maximum — full unhinged wins the aesthetic and loses the comprehension, which
defeats the point of the app.

Cards generated before the feature simply have none, and fall back to their normal wording.
