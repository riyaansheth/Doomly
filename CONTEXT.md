# Doomly — context for a fresh session

Everything a new Claude session needs to continue without re-deriving anything.
Written 2026-08-23. Repo: `git@github.com:riyaansheth/Doomly.git` (public), branch `main`.

---

## 1. What this is

Doomly turns a student's own course material into an infinite vertical-scroll feed of small
learning cards. *"You're going to scroll anyway. Doomly makes the scroll useful."*
Full original vision: `idea.md` (kept in repo, section numbers referenced throughout).

**The one thing v0.1 exists to validate:** will a student voluntarily scroll this feed for
20–30 minutes? Every scoping decision below traces back to that question.

**Positioning (§19):** not "ChatGPT for PDFs", not an AI flashcard generator. The feed is the
product; the AI is infrastructure.

---

## 2. Stack and external services

| | |
|---|---|
| Framework | Next.js 16.3.1, App Router, TypeScript, React 19 |
| Styling | one plain CSS file, `app/globals.css`. **No Tailwind, no UI library, no webfonts.** |
| DB / auth / storage | Supabase, project ref **`ofmwcufhxcwmggnjdrel`**, org `dizrupt`, free tier |
| LLM | **OpenAI** (user's explicit choice — do not switch to Anthropic), model via `OPENAI_MODEL`, currently `gpt-5` |
| Push | `web-push` + VAPID + a service worker |
| Deploy | **not deployed yet.** Target **doomly.riyaansheth.tech** via Netlify — see §11a. |

Runs locally at `http://localhost:3000`, LAN `http://192.168.1.4:3000`.

---

## 3. Routes

```
/               Home dashboard — today's cards/recall/minutes, weakest topic, exam banner
/feed           the feed. ?s=<subjectId> filters to one subject; absent = "For you"
/library        subjects grouped by semester
/library/[id]   one subject: add material + its settings. Bad id → redirect to /library
/exams          timetable upload, countdowns, Google Calendar links, .ics download
/progress       mastery bars per topic + lifetime totals
/settings       theme, push reminders, account info

/api/process    POST — processes EXACTLY ONE chunk, returns progress
/api/timetable  POST — reads an exam timetable PDF, dates subjects
/api/push/subscribe  POST — stores a push subscription
/api/notify     GET  — cron; sends due exam reminders. Guarded by CRON_SECRET.
```

Tab bar (`components/TabBar.tsx`, rendered in `app/layout.tsx`): Home · Feed · Library ·
Exams · Progress. Settings is a gear on Home, not a tab (five is the iOS ceiling).

---

## 4. Data model

Source of truth: `supabase/schema.sql`. Apply with `npm run db:push`.

**Tables:** `subjects`, `documents`, `cards`, `interactions`, `push_subscriptions`, `sent_reminders`

- `subjects` — `name`, `exam_date`, `exam_time`, `archived`, `semester`, `order_mode` (`adaptive` | `syllabus`)
- `documents` — `source_type` (`pdf` | `pptx` | `xlsx` | `youtube` | `topic`), `source_ref`, `level` 1–5,
  `storage_path` (pdf only, nullable), `pages` jsonb, `chunks_total`, `chunks_done`
- `cards` — `type` (`concept` | `mcq` | `code_bite` | `exam_trap` | `true_false`), `topic`,
  `difficulty` 1–5, `payload` jsonb (shape varies by type), **`source_page`** (the grounding story),
  `brainrot` jsonb `{title, body}` (null on cards made before the feature)
- `interactions` — `action` (`seen` | `correct` | `wrong` | `got_it` | `confused` | `saved`), `dwell_ms`

**Views** (all `security_invoker = on`, so RLS applies):
- `topic_mastery` — Laplace-smoothed score per (user, subject, topic). **Derived, never stored** — nothing to keep in sync.
- `subject_priority` — feed weight per subject = exam urgency (1–4) × weakness (1–2). Excludes archived.
- `topic_order` — `(min document created_at, min source_page)` per topic = syllabus order, needs no new data.

**Function `next_cards(p_subject_ids uuid[], p_limit int)`** — the entire recommender, ordering only:
1. **Teach before test** (WHERE): a non-concept card stays hidden until the student has *seen*
   a `concept` card for that same topic. Safety valve for topics with no concept card.
2. **Cooldown** (WHERE): a card you got wrong returns in 1 day; one you know is gone 30 days.
3. ORDER BY: syllabus branch if `order_mode='syllabus'`, else mastery bucket → concept-first
   while weak → difficulty tracking mastery → exam-phase type bias (`learn`/`recall`/`panic`).

**RLS is on every table.** 7 policies incl. storage. Verified: a second anonymous user sees
zero rows from every table and view.

---

## 5. The pipeline

```
PDF / YouTube URL / typed topic
  → documents row
  → text: unpdf per-page | pptx per-slide | xlsx per-sheet | captions per-minute | 4 ladder prompts
  → chunk (3 pages) → one OpenAI call per chunk → cards
  → next_cards() ranks → feed → interactions → back into the ranking
```

**Generation has no queue.** `/api/process` handles one chunk and returns `{done,total,added}`;
the browser loops it (`lib/ingest.ts`). No request nears a serverless timeout, no worker, and
closing the tab just pauses — reopening resumes from `chunks_done`.

---

## 6. Decisions already made — do not silently reverse

| Decision | Why |
|---|---|
| **Anonymous auth, no login** | User explicitly removed the magic-link step as friction. Anon users are real `auth.users` rows so RLS is unchanged. Account lives in browser cookies. |
| **OpenAI, not Claude** | User's explicit choice. The bundled `claude-api` skill does not apply here. |
| **No embeddings / pgvector** | One student's ~10 PDFs — nothing to retrieve. Chunks go straight to the model. |
| **Topic + difficulty are fields on the generation call** | Not separate pipeline passes. |
| **Mastery is a view, not a table** | No sync code, no update path to get wrong. |
| **Apple HIG design** | Replaced brutalism then neumorphism. SF via `-apple-system` — no webfonts at all. |
| **Buttons, not swipe gestures** | Scroll-snap already handles "next". Add gestures only if buttons feel wrong on a real phone. |
| **`.ics` + Google Calendar links, not OAuth** | User chose this: no Google Cloud project, no consent screen, no 100-tester cap. Google sends the reminders. |
| **Floating (non-UTC) calendar times** | An exam is at 9am *where the student is*. Verified identical across 4 timezones. |
| **Local-midnight range for "today"**, not a UTC day bucket | 2am IST = 20:30 UTC previous day; a UTC boundary would file late-night scrolling under yesterday. |
| **Brainrot is written in the same generation call**, not a second pass | The toggle is then instant and free. Regenerating on toggle would cost an API call per card. |
| **Brainrot never touches options, code or answers** | Only prose is retold. And a `true_false` statement is kept verbatim — it *is* the thing being judged, so restating it could flip its truth. Rule lives in `lib/brainrot.ts`, with tests. |
| **Brainrot state is a cookie, not localStorage** | `/feed` is server-rendered, so the server reads it and the right text ships in the first HTML — no flash, no hydration mismatch. |

---

## 7. Traps that have already bitten — do not reintroduce

1. **supabase-js query builders are lazy thenables.** An un-awaited `.insert()` is *built and
   never sent*. This silently dropped **every interaction** for most of the build — mastery,
   the cooldown and the teach-gate all ran on an empty table. Always `await` and check `error`.
2. **`supabase/apply.mjs` must stay `$$`-aware.** Its original splitter broke on function
   bodies, so `create or replace function` silently didn't apply while `db:push` reported
   success. Any schema-tooling change must be re-verified by reading `pg_proc.prosrc` back.
3. **Client components keep state across route changes.** `<Feed>` seeds `useState` from
   `initial`, so switching subject tabs reused the old cards until it was given a `key`.
4. **Feed top-up guard counts *remaining* cards.** `index < cards.length - 6` is always true
   for a short list → refetch on every card → observer torn down → dwell never recorded.
5. **iOS Safari zooms the page** when a focused input is under 16px. Every control is ≥16px.
6. **iOS only delivers web push to home-screen-installed sites.** Hence the PWA manifest.
7. **Next 16 renamed `middleware.ts` → `proxy.ts`** (exists at repo root; refreshes the Supabase session).

---

## 8. Environment

`.env.local` (gitignored; `.env.example` documents the shape):

| var | state |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | set — the **publishable** key `sb_publishable_…`, not legacy anon |
| `OPENAI_API_KEY` | set |
| `OPENAI_MODEL` | `gpt-5` |
| `DATABASE_URL` | set — Supabase **session pooler** (`aws-0-ap-southeast-1.pooler.supabase.com:5432`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | set (generated locally) |
| `CRON_SECRET` | set |
| **`SUPABASE_SECRET_KEY`** | **EMPTY — `/api/notify` cannot run until this is filled.** Supabase → Settings → API → Secret keys (`sb_secret_…`). A cron has no user session, so it needs the RLS-bypassing key. |

Supabase dashboard settings already changed by hand: **Anonymous sign-ins enabled** (Auth →
Sign In / Providers). Without it the app cannot sign anyone in.

---

## 9. Commands

```bash
npm run dev        # localhost:3000
npm test           # 13 tests, node --test, no framework
npm run db:push    # apply supabase/schema.sql (idempotent, safe to rerun)
npm run build
npx tsc --noEmit
```

Tests cover only the pure logic worth testing: subject interleaving/weighting, PDF chunking,
calendar/ics generation, timetable subject matching. **The SQL ranking is not unit-tested** —
it needs a live DB with real data. `supabase/verify.sql` is a diagnostic you run in the
Supabase SQL editor to eyeball whether weak topics really rank first.

---

## 10. Current database state (mixed real + test data)

| subject | user | contents |
|---|---|---|
| `dsa` | the user's own browser | **95 real cards** from "EndTerm - Intro to Algorithms.pdf" — this is the real data |
| `DSA`, `CN` | a Playwright browser session | 5 hand-seeded sample cards + a few test interactions; exam dates set for testing weights |

8 anonymous `auth.users` rows have accumulated from automated browser runs. 4 orphaned PDFs
sit in the `docs` storage bucket (Supabase blocks deleting storage rows via SQL).
**None of this is precious except `dsa`'s 95 cards.**

⚠️ Earlier in the build, 100 generated cards were destroyed by running a count and a `DELETE`
in the same command — the count was never read before the delete. **Read before you delete.**

---

## 11. Not built (deliberately)

Social features, Doom Packs, marketplace (§14–15) · Doom Sessions timers (§12) · AI Explain
chat (§13) · diagram/image cards · streaks, badges, points (they inflate engagement numbers
and hide whether the *content* is good) · nested folders and drag-to-reorder subjects ·
email reminders (would force back the login step that was deliberately removed).

Deferred shortcuts are marked `ponytail:` in code — currently 4:
`app/api/process/route.ts` (browser work loop → real queue), `lib/youtube.ts` (caption
scraping breaks if YouTube changes), `lib/session.ts` (cookie-bound account → email sign-in
for a 2nd device), `supabase/schema.sql` (2-band cooldown → SM-2).

---

## 11a. Deploying to doomly.riyaansheth.tech

Host is **Netlify** (the portfolio already lives there). `netlify.toml` and the scheduled
function are committed; nothing else is done.

**Blocked on one thing: authentication.** `netlify login` is browser OAuth and cannot be
completed by an agent. Either the user runs it once, or they create a personal access token
(Netlify → User settings → Applications → Personal access tokens) and put it in
`.env.local` as `NETLIFY_AUTH_TOKEN`, which makes the whole CLI work headlessly.

**Then:**
```bash
netlify init            # or: netlify link, if the site already exists
netlify deploy --prod
netlify domains:add doomly.riyaansheth.tech
```

**Env vars to set on Netlify** (Builds **and** Functions scope — SSR needs both).
`DATABASE_URL` is deliberately absent: only `npm run db:push` uses it, so it stays local.

```
NEXT_PUBLIC_SUPABASE_URL          NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL              https://doomly.riyaansheth.tech
OPENAI_API_KEY                    required at runtime — the SDK reads it implicitly,
                                  so it never appears in a grep for process.env
OPENAI_MODEL                      NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY                 CRON_SECRET
SUPABASE_SECRET_KEY               still empty; /api/notify 500s without it
```

Env values are injected **at build time**, so changing one needs a redeploy to take effect.

**DNS.** The record already exists at the registrar (get.tech panel, orderbox nameservers):
`doomly → cname.vercel-dns.com`. It must be repointed to whatever Netlify prints, usually
`<site>.netlify.app`. The apex and `www` serve the portfolio from Netlify and must not be
touched.

**The scheduled function.** `netlify/functions/exam-reminders.mts` runs at `30 3 * * *`
UTC — 09:00 IST — and fetches `/api/notify` with `CRON_SECRET`. Netlify schedules are UTC,
and 09:00 UTC would be 14:30 IST. Scheduled functions only fire on **published** deploys,
never on previews; use **Run now** in the UI to test. `vercel.json` was deleted — a cron
declaration for one host is inert on another, and the failure is silent.

**What only starts working on HTTPS:** Add to Home Screen, and web push (iOS delivers push
only to home-screen-installed sites). Both are inert on localhost.

---

## 12. Open threads

1. **Fill `SUPABASE_SECRET_KEY`**, then deploy — push reminders cannot fire from localhost
   with the tab closed, and Add to Home Screen needs HTTPS.
2. **Nobody has actually scrolled this for 20 minutes since interaction logging was fixed.**
   Every number and every claim about the ranking working predates that fix. This is the
   single most valuable next action, and it may reroute the whole roadmap.
3. Cards generated before the teach-before-test prompt landed still have an arbitrary
   difficulty ladder. Re-uploading a PDF regenerates them properly. Likewise only 10 of 110
   cards currently have `brainrot` text — older cards fall back to normal wording, which is
   handled, but brainrot mode will look half-applied until material is re-ingested.
4. Two features previously recommended and not yet built: **"Lost me" should regenerate that
   card simpler** (currently it logs a row and the confusing card stays confusing — a dead end
   in the core loop), and **the feed dead-ends** when cards run out because generation only
   runs at upload.

---

## 12a. Design system

`frontend-design-reference/` documents the frontend design system in detail — tokens,
every component with its real measurements, the feed's scroll mechanics, mobile
constraints, and interface voice. Read it before touching any UI.

Every value in it was read out of `app/globals.css`. **The stylesheet is the source of
truth**; if they disagree, the docs are stale.

---

## 12b. Backlog

`build-prompts/99_backlog.md` holds parked ideas with the open questions each one needs
answered before it becomes a phase. Currently: a habit tracker, an AI notes creator from
PDF, and four already-identified gaps ("Lost me" doing nothing, the feed dead-ending, Save
having no destination, email sign-in).

---

## 13. How the user likes to work

- **Ponytail mode is active** (a plugin): laziest solution that actually works. Reuse before
  writing, stdlib before dependency, one line before fifty. Never lazy about input validation,
  security, accessibility, or *understanding the problem*. Mark real corners cut with a
  `ponytail:` comment naming the ceiling and the upgrade path.
- **Commit and push finished work without being asked** — standing instruction ("git push always").
- Blunt, direct feedback; wants problems named plainly, not softened.
- Verify by actually looking — screenshots via Playwright, queries against the live DB —
  rather than asserting something works.

Plan files from this build live at `~/.claude/plans/plan-first-drifting-summit.md`
(most recent: the sections/navigation split).
