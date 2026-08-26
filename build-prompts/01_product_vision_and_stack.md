# Phase 1 — Product vision and stack

No code in this phase. Produce a written `VISION.md` at the repo root that every later
phase can be checked against, and scaffold the empty project.

## What Doomly is

A student uploads their own course material — lecture PDFs, a YouTube link, or just a
topic they need to learn. Doomly turns it into hundreds of small learning cards and serves
them as an infinite vertical-scroll feed, ranked so the weakest thing they know comes next.

*"You're going to scroll anyway. Doomly makes the scroll useful."*

## The one bet

Studying loses to Instagram because of friction: open notes → find chapter → decide what to
study → get bored → switch apps. Doomly does not ask the student to stop scrolling. It
replaces what is in the feed.

**v1 exists to answer one question: will a student voluntarily scroll this for 20–30
minutes?** Nothing else is being measured. A feature that does not move that number is out
of scope, however good it sounds.

## Who it is for

Engineering and university students, roughly 18–24, mostly in India. They study on a phone,
at night, usually with an exam bearing down. They are fluent in internet culture and
allergic to anything resembling their college's portal. The product must feel like
something that belongs on a home screen next to Instagram.

## What Doomly is not

Say this in `VISION.md`, because it rules out a lot of tempting work:

- Not "ChatGPT for PDFs" — there is no chat box
- Not an AI flashcard generator — a feed of question/answer pairs is Anki with swiping
- Not an AI notes summariser

**The feed is the product; the AI is infrastructure.** If the app ever reads as a tool you
operate rather than a feed you fall into, it has failed.

## Grounding

Cards are generated **only from the student's uploaded material**, and every card stores
the file and page it came from, shown on the card. Traceability is a feature: a professor
expects specific content, and a hallucinated card is worse than no card.

The one exception is *typed topic* mode, where there is no source and the model teaches
from its own knowledge. That mode must be visibly different — no page citation to show.

## Stack

| | |
|---|---|
| Framework | Next.js, TypeScript, App Router |
| Styling | **Plain CSS with custom properties in one file.** No Tailwind, no component library |
| Database / auth / storage | Supabase (Postgres, Auth, Storage) |
| LLM | OpenAI, model behind an `OPENAI_MODEL` env var |
| Hosting | Free tier, deployed to a subdomain |

**Why no Tailwind or component library here.** This app is roughly a dozen components with
a strong, specific visual language. A utility framework buys reuse this codebase never
collects, and a component library ships defaults phase 2 exists to reject. One stylesheet
of tokens is smaller, faster on mobile data, and impossible to drift from.

## Scope

**In:** anonymous accounts, subjects, PDF/YouTube/topic ingestion, card generation, the
feed, interaction capture, a ranking engine, exam dates with calendar export and
reminders, progress, brainrot mode, PWA install.

**Out, and stay out:** social/shared decks/marketplace, streaks, badges, points,
leaderboards, a chat interface, image or video generation, embeddings and vector search
(one student's ten PDFs have nothing to retrieve — chunks go straight to the model), and
any spaced-repetition algorithm beyond the two-band cooldown in phase 09.

## Deliverable

1. `VISION.md` — the above, in the team's own words
2. `npx create-next-app` with TypeScript and App Router, **no Tailwind**
3. `npm run dev` serving, `npx tsc --noEmit` clean
4. A `.env.example` listing every variable later phases will need
