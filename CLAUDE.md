# CLAUDE.md — ArtPortfolio

Personal project: a commission-tracking portfolio site for an artist (family member). Astro CMS,
single-admin, small enough that architecture decisions favor "obvious and correct" over
"scalable" — there is one artist, one admin, no multi-tenancy anywhere in this codebase.

## Stack

- **Astro 5** (SSR, `@astrojs/vercel` adapter) + **React 19** islands where interactivity is needed
- **Drizzle ORM** over **Neon** (serverless Postgres)
- **Cloudinary** for image hosting (uploads, thumbnails, comparison-slider variants)
- **Resend** for commission-notification emails
- **Zod** for input validation (`src/lib/schemas.ts`)
- **Playwright** for e2e (`e2e/`) — this is the *only* test layer; there is no unit-test runner
  configured (no Vitest, no `*.test.ts`). One historical commit message claims a fix was
  "verified with unit tests" — that verification, if it happened, was never committed to this
  repo. Don't trust commit-message test claims here without checking `e2e/` yourself.

## Data model (`src/db/schema.ts`)

Three tables: `portfolioItems` (the gallery), `commissionRequests` (the business — client PII:
name, email, Discord, reference images), `siteSettings` (single-row global config: commission
status, bio, pricing table in PHP). Pricing is per art-type × style (sketch/flat/rendered) —
if you add a new art type or style, it needs a column here *and* corresponding calculation logic
wherever `estimatedPrice` gets derived.

## Auth — the pattern to follow, not reinvent

`src/lib/auth.ts` implements a single check: `checkAuth(request)` — HTTP Basic Auth, hardcoded
username `admin`, password from `ADMIN_PASSWORD` env var. That's the entire auth system; there
is no session, no user table, no per-user anything. This is correct for the project's actual
shape (one admin) — don't "improve" it into a real auth provider unless the shape changes.

**The rule every API route follows, and any new route must too:**
- Every mutating verb (POST / PUT / PATCH / DELETE) calls `checkAuth(request)` first and
  returns `unauthorizedResponse()` on failure.
- GET is public *except* `commissions` (contains client PII — GET there requires auth too).
- This is already consistent across all five current routes
  (`settings`, `commissions/index`, `commissions/[id]`, `gallery/index`, `gallery/[id]`) — but
  commit `0d31a86` shows a public, unauthenticated POST endpoint existed and had to be removed
  after the fact. Check auth coverage explicitly when adding or reviewing any new route; it has
  regressed once already.

## The XSS fix — don't reintroduce this class of bug

Commit `7019769` fixed a stored-XSS hole in `src/lib/email.ts`: commission form fields
(client name, email, Discord, reference-image URLs) were interpolated directly into HTML email
templates with no escaping. Fixed with an `escapeHtml()` utility in `src/lib/utils.ts`, now
applied to every user-supplied field in the notification email.

**If you add a new field to the commission form or the email template, it must go through
`escapeHtml()` before landing in the HTML string.** This is the one security pattern in the
codebase most likely to regress silently, since it's easy to add a field and forget the escape.

## Repo hygiene — known clutter, don't add to it

The repo root currently holds a lot of one-off artifacts from earlier work sessions:
`SESSION_LOG_2026-01-*.md` (nine of them, one duplicated as a 19KB `.docx`), a 164KB
`SESSION_LOG_2026-01-19-shell.md`, four stray `test_debug_*.ts`/`.mjs` scripts sitting outside
`e2e/`, and a `debug_investigation.log`. None of this is being cleaned up as part of writing
this file — that's a separate, larger decision — but **don't add new files in this pattern.**
If you need to leave notes for a future session, prefer `docs/` (already exists, currently
near-empty) over loose root-level `SESSION_LOG_*` files, and don't leave debug scripts in the
repo root — put throwaway debugging scripts outside the repo (e.g. `/tmp`) or delete them once
done, the same way `debug_investigation.log` should probably have been.

## Recommended next audit: UI/UX consistency across screens

Only two pages exist (`index.astro` — public site, `admin.astro` — admin dashboard), but the
commit history shows a long *reactive* pattern of visual patches rather than a coherent design
system: a floating nav that shipped malformed twice (`33a4624`, `03274ab`), a header missing the
artist's name, an SSR title leak into the body, and tab-visibility bugs that got fixed by
layering `!important` and inline styles on top (`e7a85b5`, `9e75476`, `b32a7d7`) instead of
fixing the underlying style source. That pattern — visible bug, inline patch, next visible bug —
usually means there's no shared source of truth for spacing/color/typography between the two
pages, not that either page is individually broken.

**If a session opens in this repo to work on styling, UI, or either page:** don't jump straight
to fixing whatever's visibly broken. First audit both pages for consistency (spacing scale,
color usage, typography, component patterns between the public site and the admin dashboard),
and **present the findings and a proposed improvement plan for approval before making changes** —
this is a personal project with a specific look already decided on, not a blank slate, and the
patch history suggests earlier fixes may have been made under time pressure without stepping
back to look at the whole picture first.

## Environment

See `.env.example` for the full list. Two worth calling out:
- `ADMIN_PASSWORD` — a single shared plaintext password checked in `auth.ts`. Fine for this
  project's scale; don't be tempted to add password hashing/sessions without a reason tied to
  an actual new requirement (e.g., a second admin).
- `RESEND_API_KEY` / `ARTIST_EMAIL` — optional; `src/lib/email.ts` lazy-initializes the Resend
  client and the app should degrade gracefully (no crash) if these aren't set. Verify this still
  holds if you touch the email path.

## Commands

```
npm run dev              # astro dev
npm run build             # astro build
npm run test:e2e          # playwright test
npm run test:e2e:ui       # playwright test --ui (interactive)
npm run test:e2e:report   # view last report
```

No lint or unit-test script exists in `package.json` — don't assume `npm test` or `npm run lint`
work here; they don't.
