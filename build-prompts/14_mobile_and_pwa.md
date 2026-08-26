# Phase 14 — Mobile and PWA

Not a polish phase. Mobile is the design target — this phase is where it gets *proven*, and
where the app becomes installable so push can work at all.

## The two functional rules

**Nothing focusable below 16px.** iOS Safari zooms the whole page when a smaller input
takes focus, and does not zoom back. Every `input`, `select`, `textarea` is 16px minimum.
This is a functional constraint wearing a typography costume.

**Nothing tappable below 44×44pt**, and the tap target must be the interactive element
itself:

```css
/* wrong — the anchor is 23px inside a 52px row */
li { padding: 14px 16px; }
.row-link { display: flex; }

/* right — the anchor is the row */
li:has(> .row-link) { padding: 0; }
.row-link { padding: 14px 16px; min-height: 52px; }
```

Document any exception. A segmented control at 40px is defensible — Apple's own is 32pt —
but write down why.

## Safe areas

Requires `viewportFit: 'cover'`, or every inset resolves to zero and the bug is invisible
until someone opens it on a notched phone.

```css
:root { --tabbar: calc(52px + env(safe-area-inset-bottom)); }
main   { padding: calc(20px + env(safe-area-inset-top)) 16px calc(var(--tabbar) + 24px); }
.tabbar{ padding-bottom: env(safe-area-inset-bottom); }
```

Every fixed or full-height element accounts for both insets **and** `--tabbar`.

## Touch behaviour

```css
button, a, select, label, .opt, .tab {
  -webkit-tap-highlight-color: transparent;   /* no grey flash box */
  touch-action: manipulation;                 /* no 300ms double-tap delay */
  -webkit-user-select: none; user-select: none;
}
input, textarea, .prose, .why, .code, .card h2 { user-select: text; }
```

Controls are not selectable; **card prose is** — copying a definition is reasonable.

Leave `maximumScale` unset. Capping zoom is an accessibility regression.

## Units

`100dvh`, never `100vh`. `clamp()` for the card question so it survives 320px. `px`
elsewhere — there is no root-size scaling here and `rem` would add indirection for nothing.

## PWA icons — two crops of one artwork

| file | crop | why |
|---|---|---|
| `favicon` | squircle with its transparent margin | correct in a browser tab |
| `apple-touch-icon` (180) | **full-bleed** | iOS applies its own mask |
| `icon-192`, `icon-512` | full-bleed | Android maskable |

**Never hand iOS a pre-rounded icon** — it rounds the rounded corners again, leaving a
small shape floating in a thick border.

To build the full-bleed crop, **measure the artwork** rather than guessing a percentage:
find the squircle's bounding box, scale by `canvas ÷ squircle`, and back it with the
squircle's own sampled edge colours so the corners blend.

Manifest: `display: standalone`, `orientation: portrait`, theme and background sampled from
the icon so the splash and status bar don't clash with it.

## Why the manifest is load-bearing

**iOS delivers web push only to home-screen-installed sites.** Without the manifest, phase
11's reminders can never fire on an iPhone. Add to Home Screen and push both also require
HTTPS, so neither can be verified until phase 15 — say so rather than letting them look
broken.

## Scripted audit, not eyeballing

Close the phase with a script, run on every route in both themes at 390×844, asserting:

1. no horizontal overflow — `scrollWidth === innerWidth`
2. every control ≥44px tall
3. every focusable control ≥16px font
4. on the feed: footer controls clear the tab bar

Eyeballing misses the 23px-anchor-in-a-52px-row class of bug every time.

## Deliverable

The audit passing on all seven routes in both themes; the feed usable one-handed on a real
phone; the app installing to a home screen with the right icon; and a written list of every
documented exception.
