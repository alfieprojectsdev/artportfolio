# DementedBred Art Portfolio 🎨✨

A professional, database-driven art portfolio and custom CMS built for DementedBred. This project
represents a major upgrade from previous static and Carrd-based iterations, offering a fully
dynamic gallery and streamlined content management.

## 🚀 Features

* **Dynamic Gallery:** Artwork, commission prices, and bio information are stored in a database,
  allowing for instant site updates without editing raw code.
* **Commission Requests Manager:** Clients submit commission requests through the site; requests
  land in an administrative dashboard where they can be triaged, priced, annotated and accepted
  or declined.
* **High-Performance Image Hosting:** Integrates with Cloudinary for fast, professional image
  delivery, including before/after comparison sliders for rendered work.
* **Modern Tech Stack:** Built with an Astro server-side rendered core and React components.
* **Robust Testing:** Includes end-to-end testing powered by Playwright.

## 🛠️ Tech Stack

* **Framework:** Astro 5 (SSR) & React 19 islands
* **Database:** Neon (Serverless Postgres)
* **ORM:** Drizzle ORM
* **Validation:** Zod
* **Media & Services:** Cloudinary (Images) & Resend (Email APIs)
* **Testing:** Playwright (end-to-end; this is the only test layer)

## 🗺️ Roadmap

**Current Status:** The site serves as a professional showcase for Adie's portfolio and commission
prices, and now accepts commission requests directly rather than only via Discord and Instagram
DMs.

**Upcoming:**
* Verified sending domain so client-facing confirmation email is delivered, not just artist
  notifications (see Environment below).
* Artist name threaded into email templates, which currently hardcode "Bred".

*See `IMPLEMENTATION-NOTES.md` for code structure and `MIGRATION_GUIDE.md` for resetting database
seeds. `CLAUDE.md` carries the conventions and the traps worth knowing before changing anything.*

---

## Quick start

```bash
npm install
cp .env.example .env.local      # then fill in the values (see Environment below)
npm run dev                     # http://localhost:4321
```

The dev server needs a reachable `DATABASE_URL`. Without one the public page still renders from
built-in defaults (the DB read is wrapped in a try/catch), but the gallery will be empty and the
admin dashboard will show a load error.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Astro dev server on port 4321 |
| `npm run build` | Production build (Vercel adapter) |
| `npm run preview` | Serve the production build locally |
| `npm run test:e2e` | Playwright end-to-end suite |
| `npm run test:e2e:ui` | Playwright in interactive UI mode |
| `npm run test:e2e:report` | Open the last HTML report |

There is no lint script and no unit-test runner. Playwright (`e2e/`) is the only test layer —
`npm test` and `npm run lint` do not exist.

## Environment

All config is read in one place — `src/lib/env.ts` — validated with Zod. Nothing else in the
codebase touches `import.meta.env` directly. Add a variable there, not inline.

`src/lib/env.ts` is **server-only**; it holds secrets. Never import it from a React island.
Components that need Cloudinary config receive it as props from the page.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon Postgres connection string |
| `ADMIN_PASSWORD` | yes | Password for `/admin` (username is always `admin`). Unset **locks** the dashboard, never opens it |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_UPLOAD_PRESET` | yes | Unsigned upload widget config. No API key/secret needed |
| `RESEND_API_KEY` | no | Unset disables all commission email; the app runs fine |
| `ARTIST_EMAIL` | if `RESEND_API_KEY` is set | Inbox for new commission requests. **No fallback** — see below |
| `FROM_EMAIL` | no | Defaults to Resend's sandbox domain, which only delivers to your own verified address |
| `SITE_URL` | no | Absolute links in email |

It does **not** throw on missing config. A missing `RESEND_API_KEY` should not take the gallery
down. Instead every problem is logged once at startup, tagged `[env]`, at `error` or `warn`:

```
[env] RESEND_API_KEY not set — commission emails are disabled (the app runs fine without them).
```

Check those lines first when something works locally but not in production.

**`ARTIST_EMAIL` has no default on purpose.** It used to fall back to `bred@example.com` —
an IANA-reserved domain that never delivers. Resend accepted the send, returned an id, the code
reported success, and the artist never learned a commission had arrived. Unset now logs an error
and skips the send; the request is still saved and visible in `/admin`.

**Never commit a real value.** `.env.example` is the only env file that may be tracked; every
other `.env*` is gitignored. `drizzle.config.ts` reads `.env.local` too, so drizzle-kit commands
do not need an inline `DATABASE_URL=...` prefix — that workaround is how a live connection string
ended up in the setup docs.

## Project layout

```
src/
  layouts/BaseLayout.astro     Document shell (head, fonts, theme class) for every page
  styles/
    tokens.css                 Design tokens: shared scales + .theme-public / .theme-admin
    public.css                 Public site styles
    admin.css                  Admin dashboard styles
  pages/
    index.astro                Public site (SSR)
    admin.astro                Admin dashboard shell (Basic Auth)
    api/                       JSON API: settings, gallery, commissions
  components/
    ArtSlider.astro            Before/after comparison slider
    CommissionForm.tsx         Public request form (React island)
    admin/AdminDashboard.tsx   Admin UI (React island)
  lib/
    auth.ts                    checkAuth() / unauthorizedResponse()
    schemas.ts                 Zod schemas, art types, pricing helpers
    settings.ts                Site-settings defaults + resolution
    email.ts                   Resend templates
    utils.ts                   sanitizeString, escapeHtml, phpToUsd
  db/schema.ts                 Drizzle tables
e2e/                           Playwright specs
docs/                          Design notes and plans
```

## Styling: read this before adding CSS

Page styles live in `src/styles/*.css` and are **imported** from page frontmatter, not written
in an Astro `<style>` block.

This is not a preference. Astro scopes `<style>` blocks by stamping `data-astro-cid-*` onto
elements in the `.astro` template. React islands (`client:load`, `client:only`) render their own
DOM and never receive that attribute, so a scoped rule targeting island markup silently matches
nothing. The admin dashboard and the commission form were both styled this way and both rendered
unstyled for months; the visible symptom was patched with `!important` and inline styles, which
treated the symptom rather than the cause.

**Rules:**

1. Shared values (spacing, radius, type, colour) go in `tokens.css`. Do not hardcode hex values
   in page CSS — add a token.
2. `tokens.css` defines the same token names under `.theme-public` and `.theme-admin`. A
   component styled against `--color-accent` works on either screen.
3. Class names are load-bearing: the Playwright suite selects on them. Restyle freely, rename
   carefully.
4. If you reach for `!important` or a React `style={{...}}` prop to make a rule stick, the rule
   is probably in the wrong place. Check that the stylesheet is imported, not scoped.

## Pricing

Prices are stored in PHP on the single `site_settings` row and edited from the admin dashboard.
Both the public rate cards and the commission-form estimate read that row via
`pricingFromSettings()`, so they cannot disagree. `DEFAULT_PRICING` in `src/lib/schemas.ts` is a
fallback for when the row is missing — not the live price list.

Adding an art type or style means: a column on `siteSettings`, an entry in `PRICED_ART_TYPES` /
`STYLES`, a label in `index.astro`, and a field in `SiteSettingsUpdateSchema`.

## Auth

`/admin` and every mutating API route use HTTP Basic Auth via `checkAuth(request)` — username
`admin`, password from `ADMIN_PASSWORD`. There is no session, no user table. That is correct for
a one-admin site.

The rule every route follows:

- Every mutating verb (POST / PUT / PATCH / DELETE) calls `checkAuth()` first and returns
  `unauthorizedResponse()` on failure.
- `GET` is public **except** `/api/commissions`, which contains client PII.

## Security notes

- Commission fields are user-supplied and land in HTML email templates. Every one of them must
  go through `escapeHtml()` from `src/lib/utils.ts`. This has regressed once already.
- `PUT /api/settings` validates against `SiteSettingsUpdateSchema`, which acts as an allowlist.
  Do not replace it with a spread of the request body.
- Never commit connection strings or API keys, including inside documentation and session logs.
