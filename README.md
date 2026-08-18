# Doomly

Doomscroll your syllabus. Upload your course PDFs, get an infinite vertical feed
of small cards generated from *your* material — concept cards, MCQs, code bites,
exam traps — ranked so the stuff you're weakest at surfaces first.

## Setup

1. Create a Supabase project. Run `supabase/schema.sql` in the SQL editor.
   It creates the tables, the mastery view, RLS policies, the `docs` storage
   bucket, and the `next_cards()` ranking function.
2. `cp .env.example .env.local` and fill in the four values.
3. `npm install && npm run dev`

## How it works

```
PDF → Supabase Storage → per-page text → chunks of 3 pages
    → one LLM call per chunk → cards (with topic, difficulty, source page)
    → next_cards() ranks them → you scroll → interactions feed back into the ranking
```

**Generation has no queue.** `POST /api/process` handles exactly one chunk and
returns progress; the browser loops it. No request approaches a serverless
timeout, the feed is scrollable from the first chunk, and closing the tab just
pauses generation — reopening resumes from `documents.chunks_done`.

**Every card cites its source** (`filename · p.N`) and is generated only from the
uploaded text. That's the grounding story, and it's why extraction is per-page.

**Ranking** lives entirely in `next_cards()` in `supabase/schema.sql`: weakest
topic first (Laplace-smoothed, bucketed so you don't get 40 cards of one topic),
difficulty tracking mastery, and a type-mix shift as the exam date approaches
(learn → recall → panic). Subject interleaving happens in `lib/feed.ts`.

## Tests

```
npm test                    # interleave + chunking
```

The SQL ranking isn't covered by `npm test` — it needs a live Postgres with your
data in it. Use `supabase/verify.sql` to eyeball it instead (instructions inside).

## Not built yet

pgvector/embeddings, concept graph, AI Explain chat, Doom Score, swipe gestures
(buttons instead), social features, Doom Packs. See `idea.md` for the full vision.
