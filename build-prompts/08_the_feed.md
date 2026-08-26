# Phase 8 — The feed

The product. Everything else is support. It must feel like Reels, not like a web page with
cards on it.

## Scroll — native, no JavaScript

```css
.feed { height: 100dvh; overflow-y: scroll;
        scroll-snap-type: y mandatory; scroll-snap-stop: always;
        overscroll-behavior-y: contain; scrollbar-width: none; }
.card { height: 100dvh; scroll-snap-align: start; scroll-snap-stop: always; }
html, body { height: 100%; overflow: hidden; overscroll-behavior: none; }
```

Every line earns its place:

- **`scroll-snap-stop: always` on both** — without it a fast flick skips four cards. This
  single line is most of the difference between "feels like Reels" and "feels like a web
  page".
- **`overscroll-behavior`** — no pull-to-refresh, no rubber-banding to the page behind.
- **`overflow: hidden` on body** — the page scrolling behind the snap container is what
  makes a snap feed feel loose.
- **`100dvh`, never `100vh`** — `vh` ignores mobile browser chrome and the card is cut off.

No gesture library. Native scroll-snap *is* the mechanism; anything else fights it.

## The card

One sheet, filling the viewport minus the tab bar and the safe areas. Content centres in
the space the footer leaves — **centre a flex child, not the sheet itself**, or the footer's
`margin-top: auto` and the sheet's centring fight and the centring silently loses.

On it: a kicker naming the format, the question in the serif display face, the format's own
body, a sticky footer with **Save** and **Lost me**, and the source citation
(`filename — p.37`, or `12:00` for a video, or nothing for a typed topic).

**The marks badge is the signature.** Difficulty renders as exam marks — 1, 2, 5, 8, 10 —
because that is the unit this audience actually thinks in. It is the one structural device
that encodes something true rather than decorating.

## Answering

Options are an inset grouped list. On answer: every option disables, the correct one is
marked *whatever was picked*, a wrong pick is marked in `--marker`, the rest dim, and the
explanation appears.

The correct answer gets **the highlighter sweep** from phase 2 — a translucent wash
travelling across it. It must not be the only signal: pair it with a weight change or a
mark, or the feedback fails for colour-blind students.

The student always sees the right answer. Never just "wrong".

## Instrumentation — this is what the ranking eats

Log `seen` with **dwell time**, measured by `IntersectionObserver` at `threshold: 0.6`,
recorded when the card *leaves*. Dwell is the strongest free signal available; a boolean
"seen" throws it away.

Two traps, both of which have already broken this exact feature:

1. **Keep the dwell map in a ref.** Appending cards re-attaches the observer, and a map
   held in effect scope loses every card currently on screen.
2. **Top-up must count remaining cards** (`cards.length - index > 6`), never an absolute
   index. `index < cards.length - 6` is always true for a short list, so it refetched on
   every card, re-rendered, and tore down the observer before anything could register.

And from phase 5: **await the insert.** An un-awaited supabase insert is never sent.

## Infinite scroll

Top up from the observer, not from `onMouseEnter` — mouse events never fire on a phone, so
the feed simply dead-ends. When a top-up returns nothing new, mark the pool exhausted and
stop asking on every scroll.

## Subject switching

A segmented control fixed at the top switches between *For you* and each subject, via
`?s=<id>`. Hide it entirely below two subjects.

**Give the feed component a `key` tied to the active subject.** A client component seeded
from a prop keeps its state across a client-side navigation, so without a key, switching
tabs shows the previous tab's cards. This shipped once.

## Deliverable

Scrolling stops one card at a time on a real phone; footer controls clear the tab bar;
answering marks correctly and sweeps; `interactions` rows appear with plausible dwell times
— **verified in the database, not assumed**; switching subjects actually changes the cards;
and the feed keeps going past the first batch.
