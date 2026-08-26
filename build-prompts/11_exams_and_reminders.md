# Phase 11 — Exams, calendar and reminders

Exam dates already drive the ranking's phase banding (phase 9). This phase gets them in
without typing, and gets the student to show up.

## Timetable upload

Colleges hand out an exam timetable as a PDF table. Upload it; Doomly reads it, dates the
subjects that already exist, and creates the ones that don't.

Reuses phase 6's extraction, but **a timetable is one small table — it skips the chunk
loop entirely.** One call, structured output: `{ subject, date, time|null }[]`.

Prompt notes that matter:
- Return ISO dates. Timetables print the year once in a header, so supply the current year
  as a fallback — and if that lands the exam more than a month in the past, use next year.
- `time` is null when the sheet doesn't give one.
- Use the subject name exactly as printed.
- Ignore holidays, room lists, invigilators, instructions.
- Not a timetable at all → return nothing, and say so.

**Match printed names to what the student typed.** *Computer Networks* must find the subject
they called *CN*: exact match, then substring either way, then initials. No false positives
— an unmatched subject is created, which is recoverable; a wrong match silently dates the
wrong exam.

## Calendar export — no OAuth

Each exam gets a prefilled **Add to Google Calendar** link, plus one `.ics` for all of
them.

This is deliberate. OAuth would mean a Google Cloud project, a consent screen, a sensitive
scope capped at 100 unverified testers, and token storage — to deliver something the
student's calendar already does. With links, **Google sends the reminders**, which is most
of "get updates" for free.

**Times must be floating — no trailing `Z`.** An exam is at 9am *where the student is*, not
at an absolute instant. A UTC stamp also makes the output depend on whether it rendered on
the server or the client. Build the timestamp from the date and time strings directly,
touching no timezone. Verify the output is byte-identical under several `TZ` values.

The link inside a calendar event must point at the **deployed site**, never `localhost` —
that event outlives the session that made it. Read it from an env var.

## Reminders

**In-app**: a banner on Home — *"CN exam in 3 days — you're weakest on Graphs"* — hidden
past 14 days out, urgent inside 3. That single line does more than any notification.

**Push**: at 7, 3, 1 and 0 days, via a service worker and a scheduled route.

- Guard the route with a shared secret.
- It runs on a schedule with no user session, so it needs the service key that bypasses RLS.
- **Dedupe with a primary key on `(subject_id, days_out)`** — insert first, skip on
  conflict. A cron that fires twice cannot nag twice.
- Drop subscriptions that return 404 or 410; the browser has thrown them away.

**iOS delivers web push only to home-screen-installed sites**, so this cannot work until
phase 14 ships the manifest and phase 15 puts it on HTTPS. Say so rather than letting it
look broken.

## Deliverable

A real timetable PDF dating existing subjects and creating missing ones; calendar links
opening a correctly-timed event; the `.ics` importing cleanly; identical output under four
timezones; the banner appearing and turning urgent; and the reminder route sending once,
then no-oping on a second run the same day.
