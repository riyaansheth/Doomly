# Phase 4 — Information architecture and navigation shell

Routes and the navigation frame, before any of them have content. Getting this wrong
produces the failure this phase exists to prevent: **one page that accumulates every
feature until nothing on it is findable.**

## Routes

```
/               Home — what to do right now
/feed           the feed. ?s=<subjectId> filters to one subject; absent = "For you"
/library        subjects, grouped by semester
/library/[id]   one subject: its material and its settings
/exams          timetable upload, countdowns, calendar export
/progress       mastery per topic, honest totals
/settings       theme, brainrot mode, reminders, account
```

## Tab bar

**Home · Feed · Library · Exams · Progress.** Five, which is the iOS ceiling. Settings is
reached from a control on Home, not a sixth tab — it is a place you visit rarely.

Fixed to the bottom, translucent over content, `padding-bottom: env(safe-area-inset-bottom)`.

Expose its height as a custom property:
```css
:root { --tabbar: calc(52px + env(safe-area-inset-bottom)); }
```
**Every full-height surface must subtract it.** The failure mode is invisible on a laptop
and fatal on a phone: controls sitting under the bar cannot be tapped at all.

## Landing on Home, not the feed

Tempting to open straight into the feed — the feed is the product. Don't. Home answers
*what should I do right now* in one screen: the next exam, today's numbers, the weakest
topic, and one button into the feed.

**The primary action changes with what is actually missing.** No subjects → *Add your first
subject*, pointing at Library. Subjects but no cards → say so, and link to the subject.
Never a button that leads to an empty feed.

## Rules for every page

- Page content is capped at **600px** and centred. The phone layout is the real layout.
- Page gutter is 16px, set once.
- One `<h1>` per page.
- Every screen has a defined empty state that **names what is missing and links to the
  fix**. "Nothing here" is not an empty state.
- An unknown or foreign `[id]` redirects to its list page rather than rendering blank.

## The redirect trap

Guard that redirect on *"the data has loaded"*, never on *"the list is non-empty"*. A
student with zero subjects who opens a subject URL will otherwise sit on a loading message
forever, because the list never becomes non-empty. Expose an explicit `ready` flag that
flips once the first fetch resolves, whether or not it returned anything: **an empty
library is a loaded library.**

## Deliverable

All seven routes rendering a titled placeholder, the tab bar marking the active route and
surviving navigation, `--tabbar` respected by every page, `[id]` redirect proven with a
junk id on an empty account, and the whole thing checked at 390×844 in both themes.
