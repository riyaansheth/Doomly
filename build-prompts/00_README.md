# Doomly — Build Prompt Set

Ordered prompts for building Doomly from nothing: an app that turns a student's own
syllabus into an infinite vertical-scroll feed of small learning cards. Feed them to
Claude Code one at a time, in numeric order.

Each file is self-contained — it restates the constraints it needs, so a fresh session can
pick up any single file without reading the others. **Verify each phase runs before moving
on**: dev server up, `npx tsc --noEmit` clean, feature actually usable in a browser at a
390×844 viewport.

## The product in one line

*"You're going to scroll anyway. Doomly makes the scroll useful."* Upload your PDFs, paste
a YouTube link, or type a topic; Doomly generates learning cards and ranks them so the
weakest thing you know surfaces next.

**The single thing v1 has to prove:** will a student voluntarily scroll this for 20–30
minutes? Every decision below is subordinate to that question. If a feature does not move
that number, it is out of scope.

## Global rules — apply to every phase

1. **Load the `frontend-design` skill before writing or restyling any UI.** Phase 2 fixes
   the visual language; every later phase inherits it and must not improvise a new one.
2. **Every screen is built mobile-first *and* desktop in the same pass.** No "we'll adapt
   it later." The target is a **390×844** phone. Desktop is the same 600px column with
   more air around it. A screen that has not been checked at 390px is not done.
3. **Two hard constraints that are functional, not stylistic.** Break either and the app
   is broken on the device it is built for:
   - Nothing focusable below **16px** — iOS Safari zooms the page on focus and does not
     zoom back.
   - Nothing tappable below **44×44pt**, and the tap target must be the interactive
     element itself, not its padded parent.
4. **Must not look AI-generated.** Concretely avoid: Inter-only type with no pairing;
   purple-to-pink or teal mesh gradients; glassmorphism with no function; unstyled shadcn
   defaults; stock blob illustrations; emoji standing in for icons; and the three current
   AI-design clichés — cream background + high-contrast serif + terracotta accent,
   near-black + one acid-green accent, and broadsheet hairline columns.
5. **Stack**: Next.js (TypeScript, App Router) + Supabase (Postgres, Auth, Storage) +
   OpenAI. Everything on free tiers except the OpenAI API, which is the one paid
   dependency — spend it deliberately, never per keystroke.
6. **No scope creep.** Explicitly out of scope for this build: social feeds, shared decks
   or a marketplace, streaks/badges/points, a chat interface, video generation, and any
   spaced-repetition scheme more elaborate than the two-band cooldown in phase 09.

## Brand anchor

The app icon is the source of truth for colour and shape: **`public/logo.png`** — a blue
squircle (`#0A84FC` top → `#0038EB` bottom) carrying a stack of white cards, the top one
lifting and curling out of the frame mid-swipe.

**Read it before starting phase 2.** "A card rising out of an endless stack" is the one
visual metaphor for the whole product; let it recur deliberately rather than living only
in the icon.

## Phase order

| | file | builds |
|---|---|---|
| 01 | `01_product_vision_and_stack.md` | scope, audience, stack, what's in and out |
| 02 | `02_design_system.md` | visual identity, tokens, type, motion |
| 03 | `03_database_schema.md` | Postgres schema, RLS, the derived views |
| 04 | `04_information_architecture.md` | routes, tab bar, navigation shell |
| 05 | `05_auth_and_session.md` | anonymous auth, session hook, RLS proof |
| 06 | `06_ingestion_pipeline.md` | PDF / YouTube / typed topic → chunks |
| 07 | `07_card_generation.md` | card formats, the generation contract, teach-before-test |
| 08 | `08_the_feed.md` | scroll mechanics, interactions, instrumentation |
| 09 | `09_ranking_engine.md` | mastery, cooldown, exam banding, subject mixing |
| 10 | `10_library_and_subjects.md` | subject CRUD, material management, deletion |
| 11 | `11_exams_and_reminders.md` | timetable parsing, calendar export, push |
| 12 | `12_progress.md` | mastery bars, honest stats |
| 13 | `13_brainrot_mode.md` | the slang retelling and its limits |
| 14 | `14_mobile_and_pwa.md` | touch, safe areas, installability |
| 15 | `15_deployment.md` | hosting, env, custom domain, cron |

## Traps that have already cost real time

Each is spelled out again in the phase it belongs to. Collected here because a fresh
session will otherwise rediscover them the expensive way.

- **supabase-js query builders are lazy thenables.** An un-awaited `.insert()` is built and
  never sent, silently. This dropped *every* interaction in an earlier build — mastery, the
  cooldown and the teach-gate all ran on an empty table for days.
- **`100dvh`, never `100vh`.** `vh` ignores mobile browser chrome and cuts the card off.
- **`scroll-snap-stop: always`** on container *and* child, or a fast flick skips four cards.
- **Client components keep state across route changes.** A feed seeded from a prop needs a
  `key` or it shows the previous tab's cards.
- **Calendar times must be floating, not UTC.** An exam is at 9am *where the student is*.
- **iOS delivers web push only to home-screen-installed sites** — the PWA manifest is
  load-bearing, not decoration.
