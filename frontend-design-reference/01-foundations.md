# Foundations

## Colour

Every colour is a token defined twice, on `:root[data-theme='dark']` and
`:root[data-theme='light']`. **Never write a raw hex in a rule** — a hardcoded colour is a
bug that only shows up in one theme.

### Surfaces and ink

| token | dark | light | use |
|---|---|---|---|
| `--ground` | `#0E0E11` | `#F4F1EA` | the desk — page background |
| `--surface` | `#17171B` | `#FFFFFF` | a sheet on it — cards, list groups |
| `--raised` | `#202026` | `#FBFAF7` | something on the sheet — options, code |
| `--ink` | `#F4F1EA` | `#14141A` | primary text |
| `--ink-2` | `rgba(244,241,234,.62)` | `rgba(20,20,26,.64)` | secondary text, prose |
| `--ink-3` | `rgba(244,241,234,.34)` | `rgba(20,20,26,.36)` | placeholders, citations, kickers |
| `--rule` | `rgba(244,241,234,.14)` | `rgba(20,20,26,.14)` | hairlines and borders |
| `--fill` | `rgba(244,241,234,.07)` | `rgba(20,20,26,.05)` | recessed controls |

**Neither ground is neutral.** Dark is a warm near-black, light is paper. Pure `#000`/`#FFF`
is where every generic app lands and reads as a void rather than a desk at night.

### The marker set

There is **no single brand accent**. Accents are the pens a student marks a book with, used
semantically and never decoratively:

| token | dark | light | job |
|---|---|---|---|
| `--highlighter` | `#F2E14C` | `#D9C21F` | emphasis, correct answers, progress |
| `--marker` | `#FF4A38` | `#D93A28` | wrong answers, corrections, an exam inside 3 days |
| `--pen` | `#6E8BFF` | `#3355E0` | interactive — and nothing else |
| `--wash` | `rgba(242,225,76,.20)` | `rgba(242,225,76,.45)` | highlighter as a wash under ink |

Rules that keep it from becoming decoration:

- **Highlighter is a wash, never a fill.** It sits *under* ink at low alpha, the way a real
  highlighter does. Text stays `--ink`.
- **Marker is a stroke or a text colour, never a filled block.**
- **Pen is the only colour on interactive elements**, and it earns its meaning by being
  used for nothing else.

Three inks with distinct jobs read as a pen case. One accent on near-black is a current
AI-design cliché, and this exists partly to dodge it.

**Depth comes from layered surfaces, not shadow.** `--surface` on `--ground`, `--raised` on
`--surface`. There are no drop shadows in the stylesheet at all — separation is a hairline
(`inset 0 1px 0 var(--rule)`) or a change of surface.

### The brand blue is not a UI token

The icon's `#0A84FC → #0038EB` gradient lives in the manifest and the icon crops only.
Interface interaction is `--pen`.

## Type

A deliberate pairing, and exactly one webfont.

```css
--serif: Newsreader          /* card questions, page titles, stat numbers */
--ui:    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
--mono:  ui-monospace, 'SF Mono', Menlo, monospace
```

**Newsreader — an editorial serif — is used only on the card question, page titles and the
big numbers on Home.** Everything else is the system stack, which costs zero bytes and is
San Francisco or Roboto on the phones this audience carries.

**Why a serif on the question.** The product's tension is serious content in a frivolous
format. Setting the question in an editorial serif on a feed card makes that tension
typographic — it looks like something worth reading inside something built to be flicked
past. It is also the fastest way to stop looking like every other app.

One webfont, subset to latin, `display: swap`, on one element. That is the whole budget;
this audience is on mobile data. Do not add a second face.

### Scale

Hierarchy comes from **size**, not weight. Two things at 17px in different weights read as
one thing; 34px next to 13px reads as two.

| role | size | weight | tracking | where |
|---|---|---|---|---|
| Large Title | 34px | 600 | −.02em | page `h1` — **serif** |
| Card title | clamp(25, 6vw, 32) | 500 | −.014em | the question — **serif** |
| Body | 17px | 400 | −.01em | default, list row titles, card prose |
| Callout | 16px | 400 | — | answer options, all form inputs |
| Subhead | 15px | 400/600 | — | explanations, banners, secondary buttons |
| Footnote | 13px | 400 | −.005em | `.tag`, captions, helper text |
| Caption | 12px | 600 | — | marks pill, source citation |
| Section header | 13px | 400 | +.04em, uppercase | `.group-name` above a list |
| Tab bar label | 10px | 400 | −.005em | `.tabbar-item` |

**14px is not on this scale.** iOS goes 15 (Subhead) → 13 (Footnote) with nothing between,
and five stray 14px values were migrated to 15 or 13 to match. The one survivor is `.code`,
which stays 14px because monospace reads optically larger at the same size.

Sizes outside the text ramp, because they are objects rather than type: `.tabbar-glyph`
19px, `.gear` and `.chevron` 20px, `.stats strong` 24px.

**Negative tracking above 20px is what makes it look like SF and not Helvetica.** Large
text set at default tracking reads loose and generic.

**Two things are uppercase, and only two:** section headers and the card kicker. Uppercase
is a structural signal here — "this labels the thing below it" — not emphasis. Never
uppercase a sentence.

**16px is the floor for anything focusable.** See `04-mobile.md`; this is a functional
rule, not a stylistic one.

---

## Spacing

There is no formal scale, and inventing one now would be a refactor with no user-visible
payoff. The values in practice:

| gap | use |
|---|---|
| 8–10px | between adjacent controls in a row |
| 12–14px | inside a list row; between stacked options |
| 16px | page gutter; horizontal padding inside a row |
| 20–26px | between sections |
| 40vh | vertical centring for full-screen empty states |

Page gutter is **16px**, set once on `main`. Content is capped at **600px** and centred,
so the phone layout is the true layout and desktop is the same column with more air.

---

## Radius

A named scale, from the icon's squircle — generous and continuous:

| token | value | use |
|---|---|---|
| `--r-pill` | `999px` | capsules — filled buttons, the switch, the toggle |
| `--r-xl` | `28px` | the card sheet, the largest surface in the app |
| `--r-lg` | `20px` | list groups, stat rows, content blocks |
| `--r-md` | `14px` | the default — buttons, inputs, banners, code |
| `--r-sm` | `8px` | small inline controls, colour chips, the marks box |

**Nothing is square.** A 0px radius is a deliberate departure and needs a reason.

**Two raw colours exist on purpose**, both `#fff`: the switch knob and the text on a
filled blue button. Neither flips with theme — an iOS toggle knob is white on both — so a
token would be a lie.

---

## Motion

Restrained on purpose. This is a feed people scroll for twenty minutes; ambient animation
becomes noise on the second minute.

| what | duration | easing |
|---|---|---|
| **the highlighter sweep** | .26s | ease-out |
| theme change | .25s | ease |
| option hover | .15s | ease |
| switch knob | .2s | ease |
| everything else | none | — |

**The sweep is the signature and the only orchestrated moment.** When an answer is
confirmed correct, a `--wash` pseudo-element scales from `scaleX(0)` to `scaleX(1)` across
it — a highlighter marking a right answer in a book. `transform` only, so it composites on
the GPU.

It is never the sole signal: the correct option also gains weight and its letter takes a
highlighter border, because a colour wash alone fails for colour-blind students.

Presses use `opacity: .5` on `:active` rather than a transform — that is the iOS
convention, and it costs nothing.

`prefers-reduced-motion: reduce` kills every transition and animation globally. That block
already exists at the bottom of the stylesheet; keep new animation above it so it is
covered.

**The scroll itself is the app's only real motion**, and it is native — CSS scroll-snap,
no JavaScript. Nothing should compete with it.
