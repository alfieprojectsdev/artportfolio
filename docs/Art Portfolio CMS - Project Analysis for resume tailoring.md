  Art Portfolio CMS - Project Analysis for Resume Tailoring                                                                                                                                           
                                                                                                                                                                                                    
  1. Project Overview                                                                                                                                                                                 
                                                                                                                                                                                                      
  A full-stack art portfolio and commission management platform built for a digital artist. Replaces a previous static Carrd site with a dynamic, database-driven application featuring a public      
  gallery with lightbox, commission request form with real-time pricing, and a full admin dashboard for managing gallery items, commissions, and site settings.

  Architecture: Astro 5 SSR + React 19 islands + Neon PostgreSQL + Drizzle ORM + Cloudinary + Resend email + Vercel deployment.

  ---
  2. Technology Stack
  ┌────────────────────┬────────────────────────────────────────────────────────┬─────────┐
  │       Layer        │                       Technology                       │ Version │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ Meta-framework     │ Astro                                                  │ 5.16    │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ Frontend framework │ React                                                  │ 19.2    │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ Deployment adapter │ @astrojs/vercel                                        │ 9.0     │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ Database           │ Neon PostgreSQL (serverless)                           │ 1.0     │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ ORM                │ Drizzle ORM                                            │ 0.45    │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ Schema validation  │ Zod                                                    │ 3.25    │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ Email service      │ Resend                                                 │ 6.8     │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ E2E testing        │ Playwright                                             │ 1.57    │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ Image hosting/CDN  │ Cloudinary (Upload Widget v2.0)                        │ --      │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ Analytics          │ GoatCounter                                            │ --      │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ TypeScript         │ Strict mode (astro/tsconfigs/strict)                   │ --      │
  ├────────────────────┼────────────────────────────────────────────────────────┼─────────┤
  │ Styling            │ Hand-crafted CSS with custom properties (no framework) │ --      │
  └────────────────────┴────────────────────────────────────────────────────────┴─────────┘
  ---
  3. React Usage (3 components, ~1,134 lines of TSX)

  AdminDashboard (695 lines)

  - Complete admin SPA with tabbed navigation (Gallery, Commissions, Settings)
  - Full CRUD for gallery items, commission status management with filtering/sorting
  - Detail modal for commissions, dynamic pricing grid
  - Patterns: 10 useState hooks, useEffect for data fetching, Promise.all parallel API fetching, loading/error states, optimistic UI updates, functional state updates (immutable prev pattern),
  React.FormEvent handling, conditional rendering, sortable table with toggle, modal with overlay dismiss, controlled form inputs, dynamic styles, nested .map() rendering

  CommissionForm (282 lines)

  - Public-facing commission request form with real-time price estimation
  - Cloudinary image upload for references (up to 5 images)
  - Server-side validation via Astro Actions with per-field error display
  - Patterns: Complex form state object, useCallback memoization, FormData construction, Astro Actions integration, conditional early return, accessible form labels, character counter, form reset on
   success, try/catch error boundaries

  CloudinaryUploadWidget (157 lines)

  - Reusable wrapper for Cloudinary Upload Widget SDK
  - Script loading singleton pattern, widget lifecycle management
  - Patterns: useRef for instance management (3 refs), ref-based callback stability, script loading singleton with promise caching, async initialization in useEffect, cleanup on unmount, global type
   augmentation for SDK typing

  ---
  4. Astro Usage

  - SSR mode (output: 'server') with Vercel adapter
  - Islands architecture: client:load for public CommissionForm (immediate interactivity), client:only="react" for AdminDashboard (client-only, behind auth)
  - API routes: 5 files with typed APIRoute handlers including dynamic [id].ts patterns
  - Astro Actions: defineAction with accept: 'form' and Zod validation
  - Astro components: ArtSlider.astro -- CSS-only interactive before/after image slider using clip-path and CSS custom properties (demonstrates knowing when NOT to use React)
  - Features used: import.meta.env, class:list directive, scoped <style>, <script is:inline>, Astro.request for auth, server-side data fetching in frontmatter

  ---
  5. Full-Stack Capabilities

  API Design (10 endpoints)
  ┌──────────────┬────────────────────────────┬──────────────────────────┐
  │    Method    │          Endpoint          │           Auth           │
  ├──────────────┼────────────────────────────┼──────────────────────────┤
  │ GET/POST     │ /api/gallery               │ Public read / Auth write │
  ├──────────────┼────────────────────────────┼──────────────────────────┤
  │ DELETE/PATCH │ /api/gallery/:id           │ Auth                     │
  ├──────────────┼────────────────────────────┼──────────────────────────┤
  │ GET          │ /api/commissions           │ Auth                     │
  ├──────────────┼────────────────────────────┼──────────────────────────┤
  │ PATCH/DELETE │ /api/commissions/:id       │ Auth                     │
  ├──────────────┼────────────────────────────┼──────────────────────────┤
  │ GET/PUT      │ /api/settings              │ Public read / Auth write │
  ├──────────────┼────────────────────────────┼──────────────────────────┤
  │ POST         │ /_actions/submitCommission │ Public                   │
  └──────────────┴────────────────────────────┴──────────────────────────┘
  RESTful conventions, proper status codes (200, 201, 400, 401, 404, 500), mass-assignment protection, input validation, upsert logic.

  Database (3 tables, 39 columns total)

  - portfolio_items -- gallery with thumbnails, flat images for comparison slider, featured flag, display ordering
  - commission_requests -- full commission lifecycle with JSONB for reference images, timestamps
  - site_settings -- artist profile, social links, 4x3 pricing matrix

  Authentication

  - HTTP Basic Auth with reusable checkAuth() / unauthorizedResponse() utilities
  - Applied to all mutation endpoints and admin page
  - Admin page has noindex, nofollow meta

  Email (3 templates, 262 lines)

  - sendNewCommissionNotification() -- artist notification
  - sendCommissionConfirmation() -- client confirmation
  - sendStatusUpdateEmail() -- status change notifications
  - HTML templates with inline styling, fire-and-forget pattern

  ---
  6. Code Quality

  - TypeScript strict mode throughout with Zod runtime validation
  - Shared schemas between frontend and backend (single source of truth)
  - Input sanitization utility for zero-width character attacks
  - Responsive design at 480px, 768px, 1024px breakpoints using CSS Grid with auto-fit / minmax()
  - Accessibility: alt text, aria labels, keyboard navigation, semantic HTML, form label pairing
  - 8 E2E test files (~1,906 lines of Playwright tests) covering auth, forms, UI interactions, responsive layouts, APIs
  - 43 commits with disciplined conventional commit messages

  ---
  7. Quantifiable Metrics
  ┌──────────────────────────┬───────────────────────────────────────────────────┐
  │          Metric          │                       Count                       │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ React components         │ 3 (1,134 lines TSX)                               │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ Astro pages              │ 2                                                 │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ Astro components         │ 1                                                 │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ API endpoints            │ 10                                                │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ Database tables          │ 3 (39 columns)                                    │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ E2E test files           │ 8 (~1,906 lines)                                  │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ Total source lines       │ ~2,876                                            │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ Third-party integrations │ 5 (Cloudinary, Neon, Resend, GoatCounter, Vercel) │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ Environment variables    │ 8                                                 │
  └──────────────────────────┴───────────────────────────────────────────────────┘
  ---
  8. Key Talking Points for Epoch AI Role

  1. Direct React + Astro experience -- built production app using React 19 inside Astro 5's islands architecture, choosing appropriate hydration strategies (client:load vs client:only)
  2. Figma-to-code capability -- hand-crafted CSS with design tokens, two distinct design systems (client-facing earth tones, admin purple/indigo), responsive layouts without CSS frameworks
  3. Serverless full-stack architecture -- Astro SSR on Vercel serverless, Neon PostgreSQL, Cloudinary CDN, Resend email -- all serverless, no persistent servers
  4. Third-party SDK integration -- wrapped Cloudinary Upload Widget SDK in a reusable React component with proper lifecycle management, singleton script loading, and ref-based callback stability
  5. Form handling expertise -- commission form with Astro Actions, Zod validation, FormData construction, per-field error mapping, loading states -- directly applicable to implementing Figma
  designs
  6. CSS-only interactive components -- ArtSlider uses CSS custom properties and clip-path for a performant comparison slider, demonstrating judgment on when to use React vs native web capabilities

