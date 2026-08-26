# Foundations

## Colour

Every colour is a token defined twice, on `:root[data-theme='light']` and
`:root[data-theme='dark']`. **Never write a raw hex in a rule** — a hardcoded colour is a
bug that only appears in one theme.

| token | light | dark | use |
|---|---|---|---|
| `--grouped` | `#F2F2F7` | `#000000` | page background, the layer everything sits on |
| `--surface` | `#FFFFFF` | `#1C1C1E` | elevated content: cards, list groups, the sheet |
| `--label` | `#000000` | `#FFFFFF` | primary text |
| `--label-2` | `rgba(60,60,67,.60)` | `rgba(235,235,245,.60)` | secondary text, explanations, captions |
| `--label-3` | `rgba(60,60,67,.30)` | `rgba(235,235,245,.30)` | placeholders, source citations, chevrons |
| `--separator` | `rgba(60,60,67,.29)` | `rgba(84,84,88,.65)` | hairlines between rows |
| `--fill` | `rgba(118,118,128,.12)` | `rgba(118,118,128,.24)` | recessed surfaces: inputs, secondary buttons, code |
| `--blue` | `#007AFF` | `#0A84FF` | the only accent. Interactive means blue; blue means interactive |
| `--red` | `#FF3B30` | `#FF453A` | wrong answers, destructive actions, urgent exams |
| `--green` | `#34C759` | `#30D158` | correct answers, on-state |
| `--material` | `rgba(242,242,247,.72)` | `rgba(28,28,30,.72)` | translucent bars, paired with `backdrop-filter` |

**Depth comes from layering, not shadow.** `--surface` on `--grouped` is what makes
something look raised. There are exactly two non-inset `box-shadow`s in the whole
stylesheet, both on small controls that need to read as physically on top of their track:

```css
.tab.on      { box-shadow: 0 1px 3px rgba(0,0,0,.12); }   /* segmented thumb */
.switch-knob { box-shadow: 0 2px 4px rgba(0,0,0,.2);  }   /* toggle knob */
```

Everything else uses `inset 0 .5px 0 var(--separator)` as a hairline. If you reach for a
drop shadow, you almost certainly want `--surface` or `--fill` instead.

**The label alphas are the accessibility mechanism.** `--label-2` at 60% opacity is not an
arbitrary grey; it is Apple's `secondaryLabel`, chosen to clear contrast targets on both
grounds. Substituting a flat grey silently breaks that.

**Answer states tint rather than fill**, via
`color-mix(in srgb, var(--green) 18%, transparent)`. An 18% wash reads unmistakably as
right or wrong while leaving the option text legible — a solid fill would force white text
and make the card shout.

### The brand blue

The icon uses a slightly different gradient — `#0A84FC → #0038EB` — sampled from the
artwork itself. That lives in the manifest's `theme_color` and the icon crops. **It is not
a UI token.** Interface blue stays `--blue`.

---

## Type

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
```

San Francisco, supplied by the OS. **No webfonts load, anywhere.** Two Google fonts were
removed to get here — that is a page-weight win on mobile data, and it should not be
undone for a typographic preference.

Monospace is `ui-monospace, 'SF Mono', Menlo, monospace`, and it appears in exactly one
place: code blocks inside `code_bite` cards.

### Scale

Hierarchy comes from **size**, not weight. Two things at 17px in different weights read as
one thing; 34px next to 13px reads as two.

| role | size | weight | tracking | where |
|---|---|---|---|---|
| Large Title | 34px | 700 | −.025em | page `h1` |
| Card title | clamp(24, 5.6vw, 30) | 700 | −.024em | the question on a card |
| Body | 17px | 400 | −.01em | default, list row titles, card prose |
| Callout | 16px | 400 | — | answer options, all form inputs |
| Subhead | 15px | 400/600 | — | explanations, banners, secondary buttons |
| Footnote | 13px | 400 | −.005em | `.tag`, captions, helper text |
| Caption | 12px | 600 | — | marks pill, source citation |
| Section header | 13px | 400 | +.04em, uppercase | `.group-name` above a list |

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

| radius | use |
|---|---|
| `999px` | pills — capsule buttons, the marks badge, switches, `.tab` |
| `22px` | the card sheet, the largest surface in the app |
| `12px` | the default. List groups, banners, inputs on a surface, code blocks |
| `10px` | inputs and buttons that sit directly on the page background |
| `8px` | small inline controls inside a settings row |
| `50%` | circles — the option letter, the theme toggle |

**Nothing is square.** A 0px radius is a deliberate departure and needs a reason.

---

## Motion

Restrained on purpose. This is a feed people scroll for twenty minutes; ambient animation
becomes noise on the second minute.

| what | duration | easing |
|---|---|---|
| theme change | .25s | ease |
| option answered | .15s | ease |
| switch knob | .2s | ease |
| everything else | none | — |

Presses use `opacity: .5` on `:active` rather than a transform — that is the iOS
convention, and it costs nothing.

`prefers-reduced-motion: reduce` kills every transition and animation globally. That block
already exists at the bottom of the stylesheet; keep new animation above it so it is
covered.

**The scroll itself is the app's only real motion**, and it is native — CSS scroll-snap,
no JavaScript. Nothing should compete with it.
