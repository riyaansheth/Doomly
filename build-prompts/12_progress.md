# Phase 12 — Progress

Two audiences: the student, who wants to know where they stand, and **you**, who needs to
know whether the app works at all.

## Home — today

Answers *what should I do right now* in one screen: the exam banner, three numbers, and the
weakest topic.

```
23 cards   ·   74% recall   ·   11 min
```

**Query "today" over a client-computed local-midnight range, never a UTC day bucket.**
2am in IST is 20:30 UTC the previous day — a UTC boundary files late-night scrolling, the
exact habit this app is built around, under yesterday. Computing the range in the browser
sidesteps timezones entirely and needs no new SQL.

## `/progress`

Mastery per topic, grouped by subject, **weakest first** — the page exists to show where to
go next, not to congratulate. Bars below 40% render in `--marker`.

Draw them as **highlighter strokes**, not progress bars: a wash of `--highlighter` with a
slightly uneven end, the way a real highlighter runs out. This is the phase-2 language
doing work rather than decorating.

Plus lifetime totals: cards seen, recall, minutes.

## Honest numbers

- **No streaks, badges, points or leaderboards.** They inflate engagement and hide whether
  the *content* is good, which is the only thing v1 is testing. Stated as out of scope in
  phase 1; this is where the temptation actually arrives.
- Show `—` for a metric with no data. Never a zero that reads as failure, never a
  fabricated baseline.
- The empty state links into the feed: *"Nothing to measure yet — scroll a few cards and
  this fills in."*

## No new SQL

`topic_mastery` (phase 3) plus counts over `interactions`. No daily chart — that would
reintroduce the timezone-bucketing problem for a chart nobody asked for.

## The check that matters

**Confirm mastery actually moves.** Answer a topic wrong several times, reload, and verify
the score drops *and* that topic surfaces sooner in the feed.

This is the only end-to-end proof that instrumentation, storage and ranking are connected.
In an earlier build every number on this page was fiction for days, because interactions
were never being written (phase 5). Numbers that look plausible are not evidence.

## Deliverable

Home's today numbers changing after answering cards; a card answered at 23:50 local still
counting as today; mastery bars ordered weakest-first; a topic answered wrong dropping and
resurfacing; and both empty states linking somewhere useful.
