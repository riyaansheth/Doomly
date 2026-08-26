# Components

Every control that exists, with its real class and real measurements. Reuse these before
inventing anything — the fastest way to make this app look wrong is a second kind of
button.

---

## Buttons

Four kinds. There is no fifth.

### `.primary` — full-width filled
The single most important action on a page. **One per screen, at most.**
```
background: var(--blue); color: #fff
17px / 600 · radius 12px · padding 15px · display block, full width
:active → opacity .55
```
Used for: *Start scrolling*, *Add your first subject*.

### `.tap` — filled capsule
An action inside a card. Same blue fill, capsule shape.
```
background: var(--blue); color: #fff
15px / 600 · radius 999px · padding 11px 20px · align-self: flex-start
```
Used for: *Reveal*, *Where's the catch?*

### `.ghost` — recessed control
Every secondary action. **One rule serves them all** — `.ghost`, `.file`, `.danger`,
`form button`, `.source button` and `.sheet footer button` share a single declaration, and
only colour or radius varies:
```css
.ghost, .file, .danger, form button, .source button, .sheet footer button {
  background: var(--fill); color: var(--blue);
  font-size: 16px; font-weight: 600; border-radius: 10px;
  padding: 11px 16px; min-height: 44px;
}
.danger { color: var(--red); }
.sheet footer button { border-radius: 999px; }
```
These were five near-identical rules until they were merged. Add the class to that
selector list rather than writing a sixth — duplicated declarations are how a system
drifts apart one padding value at a time.

`.file` adds only `display: flex; gap: 7px` because it wraps a hidden
`<input type="file">`; the native control is never shown.

### `.danger` — destructive
`.ghost` with red text. **Only the text turns red; the background stays `--fill`.** A
solid red button is louder than anything in this app needs to be.

### Text-only links
`.cta` (17px/600) and `.back` (17px, with a `‹` prefix) — bare blue text, no background.
`.back` still carries `min-height: 44px` because a bare link is a tap target too.

---

## Lists — the core layout device

The iOS grouped-list pattern, and the backbone of every page except the feed.

```
SECTION HEADER                    ← .group-name, 13px uppercase, --label-2
┌─────────────────────────────┐
│ Row title            value  │   ← --surface, radius 12px
│ ─────────────────────────── │   ← inset hairline, not a border
│ Row title            value  │
└─────────────────────────────┘
Helper text explaining it.        ← .tag.foot, 13px, --label-2
```

```css
.subjects, .exams ul { background: var(--surface); border-radius: 12px; overflow: hidden; }
.subjects li + li    { box-shadow: inset 0 .5px 0 var(--separator); }
```

**Separators are `inset box-shadow`, not `border-top`.** A border shifts layout by half a
pixel and doubles at group edges; an inset shadow does neither. The `+` selector means the
first row never gets one.

**Row variants**

| class | shape |
|---|---|
| `.setting` | label left, control right, `min-height: 52px` |
| `.row-link` | title, optional value, `›` chevron — the whole row navigates |
| `.doc-row` | filename, count, delete button |
| `.mastery` | title and % on one line, progress bar beneath |

**`.row-link` carries its own padding, not the `<li>`.** With padding on the parent, the
anchor is only as tall as its text — a 23px tap target inside a row that looks 52px. This
was a real shipped bug.

---

## Form controls

All share: `font-size: 16px`, `min-height: 44px`, no border, `--fill` or `--surface`
background.

```css
input[name=name], .source input[name=src] {   /* on the page background */
  background: var(--surface); border-radius: 10px; padding: 12px 14px; font-size: 16px;
}
.setting select, .setting input {              /* inside a list row */
  background: var(--fill); border-radius: 8px; padding: 8px 12px;
  font-size: 16px; min-height: 44px;
}
```

Placeholders use `--label-3`. Native `<select>` and `<input type="date">` are used
unstyled beyond this — the OS pickers are better than anything worth building, and they
are already localised.

`.source input[name=src]` takes `flex: 1 1 100%` so it occupies its own line. Sharing a
wrapped flex row with a select crushed it to a sliver; `min-width: 0` let it collapse
entirely.

---

## Switch — `.switch`

The iOS toggle, at Apple's real dimensions.
```
track 51×31px, radius 999px · --fill off, --green on
knob 27px circle, white, 2px inset, translateX(20px) when on
transition .2s ease
```
`role="switch"` and `aria-checked` are required — it is a `<button>`, not a checkbox.

---

## Segmented control — `.tabs` / `.tab`

Switches which subject the feed shows. Fixed at the top of the feed, translucent.
```
container: --material + backdrop-filter: saturate(180%) blur(20px)
           radius 9px, padding 2px, overflow-x auto, scrollbar hidden
tab:       flex 1 0 auto, 14px/500, radius 7px, padding 9px 16px, min-height 40px
tab.on:    background --surface, weight 600, box-shadow 0 1px 3px rgba(0,0,0,.12)
```

**40px is a deliberate exception to the 44pt rule.** Apple's own segmented controls are
32pt; enforcing 44 here would crowd the feed. It is the only exception in the app.

Hidden entirely when there are fewer than two subjects — a switcher with one option is
furniture.

---

## Tab bar — `.tabbar`

Five destinations: Home · Feed · Library · Exams · Progress. Five is the iOS ceiling;
Settings is a gear on Home rather than a sixth tab.
```
fixed bottom, z-index 20, --material + backdrop blur
padding-bottom: env(safe-area-inset-bottom)
inset 0 .5px 0 var(--separator) as the top hairline
item: 46px min-height, glyph 19px above a 10px label
item.on: color var(--blue)
```
Every page reserves space for it via `--tabbar: calc(52px + env(safe-area-inset-bottom))`.
**Any new full-height surface must subtract that**, or its bottom controls sit underneath
the bar and cannot be tapped.

---

## Card sheet — `.sheet`

The feed's single card. See `03-patterns.md` for the surrounding mechanics.
```
--surface, radius 22px, max-width 600px
height: calc(100dvh - 62px - env(safe-area-inset-top) - var(--tabbar) - 8px)
padding 22px 20px 0 · flex column
```
Inside: `.sheet-body` takes the remaining space and centres its content; the footer is
sticky to the bottom. **Content is centred by a flex child, not by the sheet.** Centring
the sheet itself fights `margin-top: auto` on the footer and silently wins.

---

## Card content

| class | role |
|---|---|
| `.kicker` | 13px uppercase blue — the card type, or the topic on a concept card |
| `.marks` | absolute top-right pill, 12px/600, `--fill` — difficulty as `5 MARKS` |
| `.sheet h2` | the question |
| `.prose` | 17px `--label-2` — a concept card's body |
| `.why` | 15px on `--fill`, radius 12 — the explanation after answering |
| `.code` | monospace 14px on `--fill`, `overflow-x: auto`, `white-space: pre` |
| `.src` | 12px `--label-3` bottom-right — `filename — p.37` |

**`.marks` is the signature element.** Difficulty 1–5 is rendered as exam marks
(1, 2, 5, 8, 10) because that is the unit the audience actually thinks in. It is the one
piece of structure that encodes something true rather than decorating — keep it.

---

## Answer options — `.options` / `.opt`

An inset grouped list, same pattern as everywhere else.
```css
.options { background: var(--fill); border-radius: 12px; overflow: hidden; }
.options:not(.row) .opt + .opt { box-shadow: inset 0 .5px 0 var(--separator); }
.opt  { padding: 14px 15px; font-size: 16px; }
.letter { 24px circle, --fill, 12px/600 }
.opt.right { background: color-mix(in srgb, var(--green) 18%, transparent); color: var(--green) }
.opt.wrong { background: color-mix(in srgb, var(--red)   18%, transparent); color: var(--red)   }
.opt.dim   { opacity: .38 }
```
`.options.row` is the two-up True/False variant.

After an answer, **every** option is disabled, the correct one turns green regardless of
what was picked, a wrong pick turns red, and the rest dim. The student always sees the
right answer.

---

## Progress bar — `.bar-track` / `.bar-fill`

```
track: 6px, radius 3px, --fill
fill:  --blue, or --red via [data-weak] below 40%
```
Weak topics turn red because the point of the Progress page is to show you where to go
next, not to congratulate you.
