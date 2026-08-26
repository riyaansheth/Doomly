# Phase 5 — Auth and session

## Anonymous, with no login step

The student never signs in. On first load the app calls Supabase's anonymous sign-in and
gets a real `auth.users` row. There is no email, no magic link, no password, no
"continue as guest" button — **there is no auth screen at all.**

**Why.** An email round-trip before you can upload your first PDF is the exact friction this
product exists to remove. An earlier build shipped magic links and the login step was the
first thing cut after using it once.

An anonymous user is a real user, so **every RLS policy is unchanged** — this buys the
frictionlessness for free rather than by weakening the security model.

Requires *Allow anonymous sign-ins* enabled in the Supabase dashboard. If it is off, the
app cannot sign anyone in — surface that as a specific message naming the setting, not a
generic failure.

## The cost, stated honestly

The account lives in this browser's cookies. Clearing site data loses everything, and there
is no second device. That is an acceptable v1 trade because the thing being tested is
whether anyone scrolls, not whether they come back on a laptop.

Say so plainly in Settings — *"Your account lives in this browser. Clearing site data loses
your subjects and progress."* Do not hide it.

Add email sign-in only when someone actually asks for a second device.

## One session hook

Every page needs the user and the subject list, so write it once:

```ts
useSession() → { db, user, subjects, error, ready, refresh, patch }
```

- bootstraps the anonymous user
- fetches subjects
- `ready` flips true once the first fetch resolves **whether or not it returned rows**
- `patch(id, fields)` for subject updates, refreshing after

Do not copy this bootstrap into individual pages.

## The trap that will cost you a week

**supabase-js query builders are lazy thenables.** They only issue a request when awaited.

```ts
db.from('interactions').insert(row)          // built, never sent. No error. No warning.
await db.from('interactions').insert(row)    // actually sent
```

An earlier build shipped the first form. Every interaction was silently dropped, so
mastery, the cooldown and the teach-gate all ran on an empty table — and the app *looked*
like it was working. **Always await, always destructure `error`, and log it.**

Adopt the rule now, in phase 5, because phase 8 writes the code that depends on it.

## Server vs browser clients

Two files, deliberately:

- `lib/supabase.ts` — the browser client
- `lib/supabase-server.ts` — the server client, reading cookies

They must be separate. Anything importing `next/headers` cannot be imported by a client
component, and the build error when that happens points somewhere unhelpful.

Middleware refreshes the session so server components see a live token. In Next 16 that
file is `proxy.ts`, not `middleware.ts`.

## Deliverable

First load signs in silently and lands on Home; a second browser profile gets a distinct
account and — proven, not assumed — sees zero of the first account's rows; `ready` is true
on an account with no subjects; and disabling anonymous sign-ins produces the specific
message naming the dashboard setting.
