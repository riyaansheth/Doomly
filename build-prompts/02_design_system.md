# Phase 2 — Design system

**Load the `frontend-design` skill before doing anything in this phase.** This phase fixes
the language every later screen inherits. Get it wrong and fifteen phases inherit it.

## Brand anchor

Read `public/logo.png` first — the real app icon. A blue squircle (`#0A84FC` top →
`#0038EB` bottom) carrying a stack of white cards, the top one lifting and curling out of
the frame mid-swipe.

**"A card rising out of an endless stack"** is the product's one visual metaphor. Let it
recur — in how a card sits on the ground, in empty states, in the way progress accumulates
— rather than living only in the icon.

## The direction: *the night desk*

Doomly is a collision. The format is a doomscroll feed; the content is a question paper.
The visual language should hold both, and should come from the student's own world —
markers, highlighters, photocopied handouts, the margin of a textbook at 1am — not from a
generic app aesthetic.

**Commit to this. Do not substitute a system-default look.** Familiar OS chrome is a
default, not a choice; it makes the product invisible and interchangeable.

### Ground and paper

A warm near-black, not pure black, and a warm off-white, not pure white. Pure `#000`/`#FFF`
is where every generic dark app lands and it reads as a void rather than a desk at night.

```
--ground   #0E0E11   the desk
--surface  #17171B    a sheet on it
--raised   #202026    something on top of the sheet
--ink      #F4F1EA    text — warm paper white, never #FFF
--ink-2    rgba(244,241,234,.62)
--ink-3    rgba(244,241,234,.34)
--rule     rgba(244,241,234,.14)
```

Light mode inverts to real paper: `--ground #F4F1EA`, `--surface #FFFFFF`,
`--ink #14141A`. Both modes ship in this phase; dark is the default and the common case.

### The marker set — this is the distinctive move

Doomly has **no single brand accent colour**. Its accents are the pens a student actually
marks a book with, used semantically and never decoratively:

```
--highlighter  #F2E14C   emphasis, correct answers, progress
--marker       #FF4A38   wrong answers, corrections, an exam that is close
--pen          #6E8BFF   interactive — links, controls, the active tab
```

Rules:
- **Highlighter is a wash, never a fill.** Use it at 18–22% alpha behind text, the way a
  real highlighter sits *under* ink. Text stays `--ink`.
- **Marker is a stroke or a text colour, never a filled block.** A solid red button is
  louder than anything here needs.
- **Pen is the only colour on interactive elements**, and it earns its meaning by being
  used for nothing else.

This deliberately avoids the "near-black plus one acid accent" cliché: three inks with
distinct jobs read as a pen case, not as a brand colour.

### Type

A deliberate pairing, and the one place to spend a webfont.

- **Question face — an editorial serif** (Newsreader, Literata or Source Serif, variable,
  subset to Latin). Used *only* for the question on a card and for page titles.
- **UI face — the system stack.** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`.
  Zero bytes, and on the phones this audience carries it is San Francisco or Roboto —
  already the most legible option available.
- **Code — the system mono stack.** `ui-monospace, 'SF Mono', Menlo`.

**Why a serif for the question.** The product's tension is serious content in a frivolous
format. Setting the question in an editorial serif on a feed card makes that tension
typographic: it looks like something worth reading inside something built to be flicked
past. It is also the fastest way to stop looking like every other app.

One webfont, subset, `font-display: swap`, used on one element. That is the entire budget —
this audience is on mobile data.

Define a full scale — display, card question, body, callout, subhead, footnote, caption —
with real line-heights and negative tracking above 20px.

### Shape

Corner language comes from the icon's squircle: **generous and continuous**, not 4px
Tailwind defaults. A base scale of roughly `8 / 14 / 20 / 28 / 999`. The card sheet takes
the largest radius in the app, because it is the icon's shape at full size.

### Elevation

**Depth comes from layered surfaces, not drop shadows** — `--surface` on `--ground`, and
`--raised` on `--surface`. The icon has exactly one soft shadow directly below its cards;
match that restraint. Any shadow you do use is short, tight, and directly below, from a
single light source above. No long dramatic shadows, no glow.

### Motion

The scroll is the app's only real motion and it is native. Everything else stays out of its
way: 150–250ms, ease, no bounce, no springs. Presses use opacity, not transforms.

**One orchestrated moment, and only one — the highlighter sweep.** When an answer is
confirmed correct, a translucent highlighter wash sweeps left-to-right across it, the way
you would mark a right answer in a book. Roughly 260ms, `ease-out`, `transform: scaleX` on
a pseudo-element so it composites cheaply.

This is the signature. It encodes what the product does — marking up your own material —
and it is the one place boldness is spent. Everything around it stays quiet.

Respect `prefers-reduced-motion: reduce` globally, including the sweep.

## Anti-patterns — actively avoid

- Inter-only, or any single-face type with no pairing
- Mesh gradients, glassmorphism, glow effects
- Unstyled component-library defaults
- Emoji standing in for icons
- Pure `#000` or `#FFF` anywhere
- A single acid accent on near-black — the cliché this direction exists to dodge
- Cream + serif + terracotta, and broadsheet hairline columns — the other two clichés

## Accessibility floor

Not optional, and not a later pass. Body text ≥ 4.5:1 against its ground in both modes;
visible `:focus-visible` on every control; the highlighter wash must never be the *only*
signal that an answer is right — pair it with a mark or a weight change, because a wash
alone fails for colour-blind users.

## Deliverable

1. `app/globals.css` — every token above, defined twice for light and dark, on
   `:root[data-theme='…']`. **Never a raw hex in a rule.**
2. A theme resolver that runs before first paint (inline in `<head>`), reading a stored
   choice and falling back to `prefers-color-scheme`. No flash of the wrong theme.
3. `/design-system` — a dev-only route rendering every token, the full type scale, and each
   core component (button variants, input, list row, card sheet, option row, switch,
   progress bar) in both themes, so later phases build against a reference instead of
   guessing.
4. Screenshots of that route in both themes at 390px, checked before the phase is closed.
