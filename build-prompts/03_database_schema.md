# Phase 3 — Database schema

Supabase Postgres. Everything in one applied-once `supabase/schema.sql`, plus a script to
apply it. No ORM, no migration framework — this is six tables.

## Tables

**`subjects`** — a course the student is studying.
`id`, `user_id → auth.users`, `name`, `exam_date` (nullable date), `exam_time` (nullable
time), `archived` (bool, default false), `semester` (nullable free text — a label, not a
join table), `order_mode` (`adaptive` | `syllabus`, default adaptive), `created_at`.

**`documents`** — one source fed into a subject.
`id`, `subject_id`, `filename` (display label), `source_type` (`pdf` | `youtube` |
`topic`), `source_ref` (URL or the typed topic), `level` (1–5, how well the student knows
it), `storage_path` (nullable — PDFs only), `pages` (jsonb, cached extracted text),
`chunks_total`, `chunks_done`, `created_at`.

**`cards`** — the unit of the product.
`id`, `subject_id`, `document_id`, `type` (`concept` | `mcq` | `code_bite` | `exam_trap` |
`true_false`), `topic`, `difficulty` (1–5), `payload` (jsonb, shape varies by type),
**`source_page`** (int, not null), `brainrot` (jsonb, nullable), `created_at`.

`source_page` is not null on purpose. Grounding is a product promise; a card that cannot
say where it came from should not exist.

**`interactions`** — every signal the ranking engine learns from.
`id` (bigserial), `user_id`, `card_id`, `action` (`seen` | `correct` | `wrong` | `got_it` |
`confused` | `saved`), `dwell_ms` (nullable int), `created_at`.
Index `(user_id, card_id)`.

**`push_subscriptions`** — `user_id`, `endpoint` (unique), `p256dh`, `auth`.
Unique endpoint so re-subscribing on a device updates rather than duplicates.

**`sent_reminders`** — `subject_id`, `days_out`, `sent_at`, primary key
`(subject_id, days_out)`. The composite key *is* the deduplication: a cron that fires twice
cannot nag twice.

## Derived views — never stored tables

All three `WITH (security_invoker = on)` so the caller's RLS applies.

**`topic_mastery`** — per `(user, subject, topic)`: hits, misses, and a Laplace-smoothed
score `(hits + 1) / (attempts + 2)`. Smoothed so one lucky answer is not 100% mastery.

**Mastery is a view, not a column.** There is no update path to get wrong and nothing to
keep in sync. Resist every temptation to cache it.

**`subject_priority`** — how much of a mixed feed each subject deserves:
`urgency × weakness`, where urgency is `clamp(30 / days_until_exam, 1, 4)` (1 when no exam
is set) and weakness is `2 − avg(mastery)`. Excludes archived subjects.

**`topic_order`** — `(min(document.created_at), min(card.source_page))` per topic. This is
"syllabus order", and it needs no new data: the order a topic first appears in the uploaded
material *is* the order the course teaches it.

## RLS — on every table, no exceptions

Anonymous users are real `auth.users` rows, so every policy is the ordinary one:
`user_id = auth.uid()` on `subjects` and `interactions`; everything else joins through
`subject_id` to a subject the caller owns. Storage gets a matching policy confining each
user to a folder named for their uid.

**Prove it, don't assume it.** Close the phase by signing in as a second anonymous user and
confirming they see zero rows from every table *and every view* — a `security_invoker`
mistake leaks through a view while the tables look fine.

## Applying it

Write `supabase/apply.mjs`, run via `npm run db:push`, reading `DATABASE_URL` from
`.env.local` and executing `schema.sql` statement by statement, treating "already exists" as
a skip so it is safe to re-run.

**Its statement splitter must be `$$`-aware.** A naive split on `;` breaks inside a function
body, and the failure is silent: `create or replace function` never applies while the
script reports success. Verify by reading `pg_proc.prosrc` back after a push.

Keep a `-- migrations` block of `alter table … add column if not exists` immediately after
the `create table` statements and **before any view**, so a fresh database and an existing
one both work. Views reference columns the migrations add; ordering them wrong breaks the
fresh path.

## Deliverable

`schema.sql` applying cleanly to an empty database and to an existing one; `npm run
db:push`; a printed confirmation listing tables, views, functions and policies; and the
two-user RLS proof.
