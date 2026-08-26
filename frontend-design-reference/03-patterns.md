# Patterns

## The feed

The product. Everything else is support.

```
┌───────────────────────────────┐
│ [ For you ][ DSA ][ CN ]      │  fixed segmented control, translucent
│                               │
│   ┌───────────────────────┐   │
│   │              5 MARKS  │   │  .marks, absolute
│   │                       │   │
│   │  QUICK CHECK          │   │  .kicker
│   │  Which structure      │   │  .sheet h2
│   │  follows LIFO?        │   │
│   │  ┌─────────────────┐  │   │
│   │  │ A  Queue        │  │   │  .options — inset grouped list
│   │  │ B  Stack        │  │   │
│   │  └─────────────────┘  │   │
│   │ ───────────────────── │   │
│   │ Save  Lost me   p.37  │   │  sticky footer
│   └───────────────────────┘   │
│                               │
│  Home  Feed  Library  Exams   │  fixed tab bar
└───────────────────────────────┘
```

### The scroll

Native CSS scroll-snap. **No gesture library, no JavaScript scroll handling.**

```css
.feed { height: 100dvh; overflow-y: scroll;
        scroll-snap-type: y mandatory; scroll-snap-stop: always;
        overscroll-behavior-y: contain; scrollbar-width: none; }
.card { height: 100dvh; scroll-snap-align: start; scroll-snap-stop: always; }
html, body { height: 100%; overflow: hidden; overscroll-behavior: none; }
```

Each line earns its place:

- **`scroll-snap-stop: always` on both** — without it a fast flick skips four cards. This
  is the single line that makes it feel like Reels rather than a web page.
- **`overscroll-behavior-y: contain`** — no pull-to-refresh, no rubber-banding to the page
  behind.
- **`overflow: hidden` on body** — the page scrolling behind the snap container is what
  made early versions feel loose.
- **`100dvh`, never `100vh`** — `vh` ignores mobile browser chrome and the card is cut off.

### Instrumentation

Dwell time is measured with an `IntersectionObserver` at `threshold: 0.6`, logging on
*exit*. It is the strongest free signal available, so it is worth more than a simple
"seen" flag.

Two traps, both of which have already broken this:

1. **The dwell map lives in a `useRef`.** Appending cards re-attaches the observer, and a
   local `Map` would lose every card currently on screen.
2. **Top-up counts remaining cards** (`cards.length - index > 6`), not an absolute index.
   `index < cards.length - 6` is always true for a short list, so it refetched on every
   card, re-rendered, and tore down the observer before anything could register.

---

## Grouped lists

Every non-feed page is a stack of `.group` sections: an uppercase header, a `--surface`
group with hairline-separated rows, and optional helper text beneath.

```
SECTION HEADER
┌──────────────────────┐
│ Row            value │
└──────────────────────┘
Helper text.
```

**Helper text sits below its group, never inside a row.** A row does one job.

---

## Empty states

Never a blank screen, and never a dead end. An empty state names what is missing and
points at the fix.

```
No subjects yet. Add one above, then feed it a PDF,
a YouTube link or just a topic.

Nothing to measure yet — scroll a few cards and this fills in.
                        └── links to /feed
```

**The primary action changes with what's actually missing.** Home shows *Add your first
subject* when there are none, and *Start scrolling* otherwise — it never sends someone to
an empty feed.

Two shapes: `.empty` for a full screen (`padding: 40vh 16px`, centred) and `.empty-inline`
for a section that has nothing in it yet.

---

## Destructive actions

Deletion cascades — a document takes its cards, and cards take the interactions recorded
against them. The confirmation therefore **states the cost instead of asking "are you
sure"**:

```
Delete "Algorithms.pdf"?

15 cards made from it will go too, along with your
progress on them. This can't be undone.
```

Rules:
1. **Count what is lost.** Never a generic warning.
2. **Offer the softer option.** The subject dialog points at Archive.
3. **Separate the block.** Delete-subject sits in its own group, below the settings, not
   as one more row among them.
4. **`confirm()` is the right tool.** Unmissable, keyboard-dismissible, identical on
   mobile, zero code. A custom sheet would look nicer and be easier to dismiss by accident.

---

## Progress feedback

Long work reports live, in one line that keeps updating:

```
Reading it…
Generating… part 3/10, 27 cards so far. You can start scrolling now.
Done — 94 cards. Go scroll.
```

**Say what is usable now.** Generation streams into the feed, so the message tells you to
start rather than to wait. Errors replace the same line with the actual message — never a
spinner that stops.

---

## Theme

Three states: `light`, `dark`, and unset (follow the OS).

```js
document.documentElement.dataset.theme =
  localStorage.getItem('theme') ||
  (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
```

Inline in `<head>`, so it runs **before first paint** — otherwise the wrong theme flashes.

**Brainrot mode uses a cookie, not localStorage**, because `/feed` is server-rendered and
the server must know the setting to put the right wording in the first HTML. Rule of
thumb: *if the server renders it, it's a cookie; if only the client cares, localStorage.*
