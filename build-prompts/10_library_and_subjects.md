# Phase 10 — Library and subjects

Where material is managed. Two screens.

## `/library`

Subjects grouped by semester (a free-text label; null groups under a default heading), each
row navigating to its subject. Add a subject with one inline field.

Archived subjects sink into their own group at the bottom, never disappearing — "gone" and
"hidden" must look different.

**Row padding belongs on the link, not the list item.** With padding on the parent, the
anchor is only as tall as its text — a 23px tap target inside a row that looks 52px. This
shipped once and is invisible on a laptop.

## `/library/[id]`

Three sections, in this order — add before manage before configure:

**Add material** — the single link-or-topic box, the level select, and a PDF button.
Progress reports live beneath it (phase 6).

**Material** — every source fed in, with its card count, and a delete on each.

**Settings** — exam date, card order (*Adapt to me* / *Follow my syllabus*), semester,
archive. Rename by editing the title in place; blur commits.

Then, in its own block below, separated from the settings: **delete this subject.**

## Deletion

Deletion cascades: a document takes its cards, and cards take the interactions recorded
against them. So **the confirmation states the cost instead of asking "are you sure"**:

```
Delete "Algorithms.pdf"?

15 cards made from it will go too, along with your
progress on them. This can't be undone.
```

Count what is lost, from a real query. Point at Archive in the subject dialog as the softer
option. Keep the destructive block visually separate from the settings rows.

**Delete the storage file before the row** — deleting the row first loses `storage_path`
and orphans the file, and Supabase blocks removing storage objects via SQL, so it becomes
unreachable.

Native `confirm()` is the right tool: unmissable, keyboard-dismissible, identical on mobile,
and impossible to dismiss by accident the way a custom sheet is.

**Verify cancel actually cancels.** Test both branches against the database before closing
the phase.

## Deliverable

Subjects group by semester; archive hides from Library, the feed and the weights while
keeping the cards; rename persists; every row is a full-height tap target; both delete
paths confirmed with real counts; cancel proven to remove nothing.
