# Phase 6 — Ingestion pipeline

Three ways in, one pipeline. Everything becomes an array of "pages" and then chunks.

## The three sources

**PDF** → upload to Supabase Storage, extract text **per page** (`unpdf`, not a
whole-document extractor). Per-page is non-negotiable: it is what lets a card cite `p.37`.

**YouTube** → fetch the caption track and bucket it into **one page per minute**, so a card
can cite `12:00` exactly as a PDF card cites a page.

**Typed topic** → no source text at all. The "pages" are four prompts walking a ladder:
foundations → mechanics → trade-offs → application. The model teaches from its own
knowledge, and these cards have nothing to cite.

## One input, not a mode switch

The UI is a single text box: *"Paste a YouTube link, or type a topic…"*. A URL is a link;
anything else is a topic. One regex, no mode toggle for the user to get wrong. PDFs come
from a separate file button beside it.

Alongside it, a **level** control — *New to this* / *Know the basics* / *Revising for an
exam* — mapping to 1 / 3 / 5, passed to generation in phase 7.

## Chunking

Group pages three at a time, keeping page markers visible in the text so the model can
attribute each card:

```
[page 4]
…text…

[page 5]
…text…
```

Drop chunks with almost no text — blank pages cost money and produce nothing.

## Generation runs one chunk per request

`POST /api/process` handles **exactly one chunk** and returns `{ done, total, added }`.
**The browser loops it.**

This is the architectural decision of the phase. It means:

- no job queue, no worker, no scheduler
- no request anywhere near a serverless timeout
- the feed is scrollable from the first chunk — generation streams in behind it
- closing the tab pauses; reopening resumes from `chunks_done`

Extracted text is cached on the `documents` row on the first call, so re-entering the loop
is cheap.

The known ceiling: generation stops when the tab closes. Accept it for v1; move to a real
queue only when someone needs generation to continue in the background.

## Surface every failure

An earlier build left the card insert and the progress update unchecked and had no catch in
the browser loop. A failure anywhere produced **no progress line and no error** — a dead
screen.

Every step returns its own message: `download failed: …`, `generation failed: …`, `card
insert failed: …`. The loop reports live and bails out if progress stops advancing rather
than looping forever:

```
Reading it…
Generating… part 3/10, 27 cards so far. You can start scrolling now.
Done — 94 cards. Go scroll.
```

**Say what is usable now**, not what is still pending.

## Deliverable

All three sources produce cards end to end; a PDF card cites the right page and a YouTube
card the right minute; the progress line ticks; closing the tab mid-run and reopening
resumes; and a deliberately broken key produces a readable message rather than silence.
