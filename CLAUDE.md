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
status, bio, pricing table in PHP). Pricing is per art-type × style (sketch/flat/rendered).

**The `siteSettings` row is the live price list.** `pricingFromSettings()` in `src/lib/schemas.ts`
turns it into a `PricingTable`; the public rate cards (`index.astro`) and the commission-form
estimate both read it, and `submitCommission` uses it to derive `estimatedPrice`. `DEFAULT_PRICING`
is a fallback for a missing row, *not* the price list — it was previously a hardcoded const that
the admin dashboard could not affect, so editing prices silently did nothing to quotes.

Adding an art type or style needs: a column here, an entry in `PRICED_ART_TYPES` / `STYLES`, a
label in `index.astro`, and a field in `SiteSettingsUpdateSchema`.

`art_type` no longer accepts `headshot` (removed 2026-07-26 — the form quoted ₱60/100/150 while the
public card advertised bust prices). Existing rows with that value still display fine; only new
submissions are constrained.

## Auth — the pattern to follow, not reinvent

`src/lib/auth.ts` implements a single check: `checkAuth(request)` — HTTP Basic Auth, hardcoded
username `admin`, password from `ADMIN_PASSWORD` env var. That's the entire auth system; there
is no session, no user table, no per-user anything. This is correct for the project's actual
shape (one admin) — don't "improve" it into a real auth provider unless the shape changes.

`admin.astro` uses the same helper (it used to reimplement the check inline, minus the try/catch,
so a malformed base64 header threw out of `atob()` and surfaced as a 500 instead of a 401). It
passes the realm `'Admin Area'`; API routes use the default `'Admin API'`.

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

## Input allowlists on write routes

`PUT /api/settings` used to spread `...body` straight into the update, so a client could write
`id`, `updatedAt` or any column (and a non-numeric price produced a 500). It now validates against
`SiteSettingsUpdateSchema`, which doubles as the allowlist — the same explicit-field discipline
`gallery/[id]` and `commissions/[id]` already used. Don't replace it with a spread.

Free-text settings fields also pass through `cleanText()` (`src/lib/utils.ts`), which repairs
SQL-style doubled quotes (`I''m` → `I'm`) left behind by hand-seeded rows, on both read and write.

## Repo hygiene

Cleaned up 2026-07-26: the eight tracked `SESSION_LOG_*` files were untracked (`git rm --cached`;
they remain on disk and the pattern was already gitignored), the four stray `test_debug_*` scripts
and `debug_investigation.log` were deleted, and `V0_INTEGRATION_PLAN.md` moved into `docs/`.
`.gitignore` now also covers `test_debug_*` and `debug_*.log` so the pattern can't come back.

**Don't add new files in that pattern.** Session notes go in `docs/` (they stay gitignored via
`SESSION_LOG_*`); throwaway debugging scripts go outside the repo (`/tmp`) or get deleted when
done.

Where a document belongs:

| Location | For | Tracked |
| --- | --- | --- |
| `README.md`, `CLAUDE.md` | Things every contributor needs | yes |
| `docs/` | Design notes and plans worth keeping | yes (except `SESSION_LOG_*`) |
| `notes/` | One-off local material — evaluation reports, shopping lists, superseded plans | **no** |

`notes/` was added 2026-07-28 when five unreferenced root-level docs were untracked
(`JULES_EVALUATION_REPORT.md`, `PROJECT_MEMO.md`, `domain-options.md`, `v0-INTEGRATION.md`,
`v0 UI-UX Analysis.md`). They remain on disk. The remaining root docs are kept because README or
this file links to them — check for references before untracking anything else.

**Secrets:** a live Neon connection string was committed to this *public* repo in
`NEONDB_BRANCH_SETUP.md` and two session logs. The working tree was redacted on 2026-07-26, but
the credential remains in git history (commits `2090193`, `83fbeaf`, `cb35f11`) and must be treated
as compromised until rotated. Never put a connection string or API key in a doc, a session log, or
a commit — `.env.example` is the only env file that may be tracked.

## Styling — the rule that explains the whole patch history

**Page CSS lives in `src/styles/*.css` and is imported from page frontmatter. Never put page
styles in an Astro `<style>` block.**

Astro scopes `<style>` blocks by stamping `data-astro-cid-*` onto elements in the `.astro`
template. React islands (`client:load`, `client:only`) render their own DOM and never get that
attribute, so scoped rules targeting island markup match *nothing*. Both islands in this repo were
styled that way: ~700 lines of admin CSS and the entire `.commission-form` block were dead code,
and the admin dashboard rendered with browser-default buttons and unstyled tables.

That is the actual cause of the reactive patch history this file used to describe — the floating
nav shipping malformed twice (`33a4624`, `03274ab`), and the tab-visibility "fixes" that layered
`!important` and inline styles (`e7a85b5`, `9e75476`, `b32a7d7`). The `!important` never worked;
the inline styles did, because inline styles were the only thing that could reach the island.

Fixed 2026-07-26:

- `src/styles/tokens.css` — one token set: shared spacing/radius/type/shadow scales, plus
  `.theme-public` and `.theme-admin` defining the *same* colour token names. `BaseLayout.astro`
  puts the theme class on `<body>`.
- `src/styles/public.css`, `src/styles/admin.css` — imported, global, island-reachable.
- `src/layouts/BaseLayout.astro` — one document shell (head, fonts, tokens, theme) for both pages.
- Zero `!important` in either stylesheet; zero inline style objects in `AdminDashboard.tsx`.
  The active tab is styled via `[aria-selected='true']`.

**Working rules:**

1. No hardcoded hex in page CSS — add a token to `tokens.css`.
2. Class names are load-bearing: the Playwright suite selects on them. Restyle freely, rename
   carefully (and update `e2e/` in the same change).
3. Reaching for `!important` or a React `style={{...}}` to make a rule stick means the rule is
   probably in the wrong place. Check the stylesheet is imported, not scoped.
4. This is a personal project with a look already decided on. For anything beyond a bug fix,
   **present findings and a plan for approval before changing the design.**

## Environment — all config goes through `src/lib/env.ts`

Config is read, validated (Zod) and defaulted in exactly one module. **Nothing else in `src/`
touches `import.meta.env`** — if you add a variable, add it there. Reintroducing a scattered
`import.meta.env.X || 'some-default'` is the regression to watch for; that pattern is what hid a
non-delivering email address for months.

`env.ts` is server-only and reads secrets. **Never import it from a React island** or anything in
the client bundle. Islands get what they need as props (Cloudinary config comes from the page).

It **does not throw**. A missing `RESEND_API_KEY` must not take the gallery down. Problems are
logged once at startup, tagged `[env]`, at `error` or `warn`. Keep that property.

- `ADMIN_PASSWORD` — single shared plaintext password checked in `auth.ts`. Fine for this
  project's scale; don't be tempted to add password hashing/sessions without a reason tied to
  an actual new requirement (e.g., a second admin). Unset means `password === undefined`, which
  no supplied string can match — unset locks the dashboard rather than opening it.
- `ARTIST_EMAIL` — **no fallback, deliberately.** It defaulted to `bred@example.com`, an
  IANA-reserved domain that never delivers, so an unset value meant Resend accepted the send,
  returned an id, `sendNewCommissionNotification` returned `true`, and the artist never heard
  about the commission. Now: log an error and skip. The request is still saved and visible in
  `/admin`. Do not add a placeholder default back.
- `FROM_EMAIL` — defaults to `commissions@resend.dev`, Resend's shared **sandbox** domain. It only
  delivers to the account owner's verified address, so client-facing confirmation and
  status-update emails will be rejected until a custom domain is verified.
- `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` / `CLOUDINARY_URL` — not used. Uploads are
  unsigned and need only `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_UPLOAD_PRESET`. Removed from
  `.env.example`; they linger in some local `.env.local` files and can be deleted.

`drizzle.config.ts` loads `.env.local` (plain `dotenv/config` reads `.env` only, which doesn't
exist here). Drizzle commands no longer need an inline `DATABASE_URL=...` prefix — that workaround
is how a live connection string ended up pasted into `NEONDB_BRANCH_SETUP.md`.

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

## Database branches — which is which

Two Neon branches. As of 2026-07-26 the roles are:

| Role | Holds | Used by |
| --- | --- | --- |
| **Production** | the live gallery, settings | Vercel Production; `PRODUCTION_DB_HOST` in `.env.local` |
| **Development** | same content plus accumulated e2e test rows | local `npm run dev`, the Playwright suite |

`NEONDB_BRANCH_SETUP.md` labelled these the *other way around* and was wrong — verify against the
Neon console, never against a doc or a filename. Endpoint IDs are deliberately not written down in
tracked files; `.env.local` holds both connection strings, one commented out.

**The suite writes real rows** — `commission-form.spec.ts` submits actual commission requests. It
ran for months against the branch the live site was reading; the twelve `@example.com` requests
in the development branch are the residue. `e2e/guard.setup.ts` now blocks that:

- Aborts if `DATABASE_URL` resolves to `PRODUCTION_DB_HOST`.
- Aborts if `PRODUCTION_DB_HOST` is unset — it will not assume the target is safe.
- Aborts if `RESEND_API_KEY` is set, so tests can never send real mail.
- Overrides are explicit: `ALLOW_PROD_E2E=1`, `ALLOW_E2E_EMAIL=1`. Never default these on in CI.

All three failure modes were verified to abort. Keep the guard failing closed if you touch it.

**Two more things to know before running the e2e suite:**

- `playwright.config.ts` sets `reuseExistingServer: !CI` against a hardcoded `localhost:4321`. If
  another project's dev server already holds that port, Playwright will happily test *that app* and
  report a wall of confusing failures. Check what's on 4321 first.
- The webServer entry sets `PLAYWRIGHT=1`, which disables the Astro dev toolbar
  (`astro.config.mjs`). The toolbar sits bottom-centre and intercepts clicks on the lightbox
  prev/next controls. Don't remove it.

Full suite: 159 tests, all passing as of 2026-07-26.
