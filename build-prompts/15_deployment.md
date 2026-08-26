# Phase 15 — Deployment

## This cannot be static

Four API routes and server components that read cookies. It needs a Node runtime — shared
hosting, a static export, or "upload the folder" will not work. Establish that before
choosing a host.

## Env

Set on the host, Production and Preview:

```
NEXT_PUBLIC_SUPABASE_URL          project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     the publishable key
NEXT_PUBLIC_SITE_URL              https://<subdomain>  — goes inside calendar events
OPENAI_API_KEY                    required at runtime
OPENAI_MODEL
NEXT_PUBLIC_VAPID_PUBLIC_KEY      push
VAPID_PRIVATE_KEY                 push
SUPABASE_SECRET_KEY               the scheduled route bypasses RLS; it has no user session
CRON_SECRET                       guards that route
```

**`OPENAI_API_KEY` never appears in the source** — the SDK reads it implicitly. A grep for
`process.env` will miss it, and generation fails silently in production. Check for it
explicitly.

**`DATABASE_URL` is deliberately absent.** It is only used by `npm run db:push` locally, so
that credential never leaves the laptop.

## The scheduled route

Phase 11's reminder route needs a daily trigger. Whatever the host calls it — a cron
declaration, a scheduled function — **it is host-specific**, so it is written last and
re-checked if the host changes. A config file for one platform is inert on another, and
the failure is silent: reminders simply never fire.

Fire it at a sensible **local** hour. Schedulers run in UTC; 09:00 UTC is 14:30 in IST,
which is not when anyone wants to be reminded about an exam.

## Custom subdomain

Hosting on a subdomain of a domain already serving something else is the normal case, and
subdomain records are independent — the existing site is unaffected.

1. Add the domain in the host's dashboard; it prints the exact record
2. Add that record at the **registrar's** DNS panel — a `CNAME` when the host gives a
   name, an `A` when it gives an IP
3. Leave the apex and `www` records alone

Some panels want the bare label (`doomly`), others the full hostname. Follow the panel's own
placeholder, then verify with `dig` rather than trusting the form.

## What only starts working on HTTPS

**Add to Home Screen and web push are inert on `http://localhost` and on a LAN IP.** They
can only be verified once deployed. Plan to test them here, not earlier, and do not treat
their absence in development as a bug.

## After the first deploy

1. Every route loads
2. Upload a PDF end to end — the one path that proves env, storage and OpenAI together
3. Install to a phone home screen; confirm the icon and standalone launch
4. Enable reminders, then trigger the route manually with the secret and confirm a
   notification arrives
5. Confirm a calendar link contains the deployed origin, not `localhost`

## Self-hosting later

If the free tier stops fitting: any VPS running `next build && next start` behind Caddy,
with a real crontab hitting the reminder route. Nothing in this build is host-specific
except the scheduler, which is why it is isolated to one file.

## Deliverable

The app live on its subdomain over HTTPS; all five post-deploy checks passing; the existing
site on the apex untouched; and a written record of the env vars set, so the next person
does not rediscover the `OPENAI_API_KEY` trap.
