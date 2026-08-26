# Doomly — frontend design reference

The design system as it actually ships, not as a wish-list. Every value here was read
out of `app/globals.css`; if the two ever disagree, the stylesheet is right and this
file is stale.

| file | what's in it |
|---|---|
| `01-foundations.md` | colour, type, spacing, radius, elevation, motion |
| `02-components.md` | every control, with its real class name and measurements |
| `03-patterns.md` | the feed, grouped lists, empty states, destructive actions |
| `04-mobile.md` | touch targets, safe areas, iOS traps, PWA icons |
| `05-voice.md` | how the interface talks, including brainrot mode |

---

## The one idea

Doomly is a collision: the mindless thumb-scroll of Reels, pointed at the thing students
avoid — their own syllabus. The interface's whole job is to make studying feel like the
former while remaining the latter.

That produces one rule everything else follows from:

> **The card is the app. Everything else gets out of its way.**

A learning card is dense text read on a phone, at night, by someone who is one dull
moment away from switching to Instagram. So the UI spends nothing on itself. No
decoration competes with the sentence being read.

---

## Why Apple's system, specifically

Three directions were built and two were thrown away. That history is the argument:

**Brutalism** — bone paper on black, 3px rules, hard offset shadows, everything mono.
Legible and genuinely memorable. Killed because the framing (borders, shadows, an inset
sheet) ate roughly 15% of a phone screen to say nothing, and mono prose is tiring over a
twenty-minute session.

**Neumorphism** — one surface colour, shape from paired light/dark shadows. Killed
because its entire premise is *low contrast between an element and its background*, and
this app is dense text at 2am. It traded the only thing that matters for a soft look, and
it visibly dates the product to 2020.

**Apple HIG** — built, shipped, then replaced. It was the right call for getting to a
working app: familiar, contrast pre-solved, and free San Francisco. But a familiar system
chrome is a *default*, not a choice — it made Doomly look like every other iOS-derived web
app, with nothing of its own subject in it.

Its three arguments, kept because they still constrain the current system:

1. **San Francisco is free here.** `-apple-system` resolves to SF on the exact devices
   the audience uses. Zero webfonts load. On a phone on Indian mobile data, that is a
   real performance decision, not an aesthetic one.
2. **Its contrast is pre-solved.** Apple's label alphas are built to hit contrast targets
   on both grounds. That is precisely what neumorphism gave away.
3. **It disappears.** The audience already reads iOS all day. A familiar chrome is chrome
   nobody looks at — which is the goal, because the card is the app.

**The direction now: *the night desk*.** The visual language comes from the student's own
world — markers, highlighters, a photocopied handout, the margin of a textbook at 1am —
rather than from an operating system. Warm near-black instead of pure black, an editorial
serif for the question against a system UI face, and no brand accent at all: a marker set
where highlighter, marker and pen each carry one meaning. Full specification in
`build-prompts/02_design_system.md`.

**The risk taken deliberately:** committing to `overflow: hidden` on `body`. Nothing on
any screen scrolls except the panel that is supposed to. It makes the feed feel native and
permanently forecloses long scrolling pages. That trade was made on purpose.

---

## Non-negotiables

Break these and the product stops working, regardless of how it looks.

1. **Mobile is the design target.** Desktop is a courtesy. Every decision is checked at
   390×844 before it is checked anywhere else.
2. **Nothing focusable under 16px.** iOS Safari zooms the page when a smaller input takes
   focus. This is a functional constraint wearing a typography costume.
3. **Nothing tappable under 44×44pt.** The one documented exception is the segmented
   control, because Apple's own is 32pt.
4. **Both themes, every time.** Dark is the default and the common case; light must be
   checked before anything ships.
5. **Never style with a raw hex.** Every colour is a token, because every colour has two
   values.
