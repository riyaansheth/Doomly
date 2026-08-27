# Phase 6 — Ingestion pipeline

Three ways in, one pipeline. Everything becomes an array of "pages" and then chunks.

## The sources

**PDF** → upload to Supabase Storage, extract text **per page** (`unpdf`, not a
whole-document extractor). Per-page is non-negotiable: it is what lets a card cite `p.37`.

**YouTube** → fetch the caption track and bucket it into **one page per minute**, so a card
can cite `12:00` exactly as a PDF card cites a page.

**PowerPoint** → a `.pptx` is a zip of XML. Read `ppt/slides/slideN.xml` directly and take
one page per slide, so a card cites "slide 7". Sort the slide files **numerically** — a
string sort puts slide10 second and scrambles every citation. Read the **speaker notes**
too, resolved through each slide's own `_rels` file, because notesSlide numbering does not
track slide numbering — lecturers put real content there. Reject legacy `.ppt`: it is
binary, not a zip, so it would reach the parser and fail confusingly.

**Excel** → one page per worksheet, each headed by its sheet name.

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

**Chunk size is per format, and getting it wrong loses material silently.** A PDF page is
dense; a slide carries a fraction of that text; a worksheet is already a unit:

| format | pages per chunk | minimum characters |
|---|---|---|
| pdf | 3 | 200 |
| pptx | 5 | 60 |
| xlsx | 1 | 30 |

Using the PDF numbers for a deck discarded most of it — a real 7-slide deck came out as one
chunk *starting at slide 4*, with nothing said about the three that vanished. Whatever
computes `chunks_total` and whatever indexes into the chunks must use the same shape, or
the count and the content diverge.

Group pages, keeping page markers visible in the text so the model can attribute each card:

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
insert failed: …`. **Never let a library's own error reach the user** — `invalid zip data`
from a zip reader means nothing to a student; say what to do instead ("if it's an older
.ppt, save it as .pptx"). When a file's text can't be extracted at all, **delete the
document row and its uploaded file** rather than leaving a permanent 0-card entry in the
material list with an orphan in storage. Remove the storage object first, while the row
still knows its path. The loop reports live and bails out if progress stops advancing rather
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
