# Implementation Plan

Tracks progress against the MVP scope in `CLAUDE.md`. Check this file before starting substantial work; update it as phases complete. Do not reorder or skip phases without an explicit reason noted here.

---

## Phase 1 — Project Setup & Infrastructure

- [x] Next.js 16 app scaffolded (App Router, TypeScript strict, `src/` layout)
- [x] Tailwind CSS v4 configured
- [x] ESLint configured (`eslint.config.mjs`)
- [x] Drizzle ORM + PostgreSQL schema defined (`users`, `equipment`, `maintenance_records`, enums, indexes) — `src/db/schema.ts`
- [x] Drizzle client and config (`src/db/index.ts`, `drizzle.config.ts`)
- [x] Seed script for demo users (`src/db/seed.ts`)
- [x] Jest configured with `ts-jest` and a passing smoke test
- [x] Docker: multi-stage `Dockerfile` (standalone output) + `docker-compose.yml` (`db` + `app`)
- [x] `.env.example` documenting required environment variables
- [x] Core dependencies installed: `next-auth`, `bcryptjs`, `zod`, `drizzle-orm`, `postgres`
- [x] Requirements/architecture/plan documented (`docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, this file)
- [x] Git repository initialized with an initial commit
- [x] Initial Drizzle migration generated from the schema (`drizzle/`)
- [x] GitHub Actions CI workflow (install → typecheck → lint → test → build)

Phase 1 is complete once the items above are done and `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` all pass.

## Phase 2 — Authentication & Authorization

- [x] NextAuth v5 Credentials provider (email + password, bcrypt compare, reject inactive users)
- [x] JWT session strategy carrying `userId` and `role`
- [x] Login page and logout action
- [x] Route/proxy (middleware) protection for authenticated-only pages and API routes
- [x] Server-side role checks (admin vs technician) reusable across route handlers
- [x] Unit tests: credential verification, session/role checks, inactive-user rejection

Phase 2 is complete: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` all pass.

Notes:
* Route protection uses Next.js 16's `proxy.ts` file convention (the renamed successor to `middleware.ts`).
* `src/lib/auth/guard.ts` (`requireSession`, `requireRole`) is the reusable server-side check for Phase 3/4 route handlers.

## Phase 3 — Equipment Management

- [x] Zod validation schemas for equipment create/update
- [x] API routes: list (search + filter by status/category), get, create, update, delete
- [x] Server-side enforcement: create/update/delete admin-only, read for both roles
- [x] Equipment list UI with search/filter
- [x] Equipment create/edit form, status change control
- [x] Unit tests: validation, uniqueness handling, authorization rules

Phase 3 is complete: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` all pass.

Notes:
* `src/lib/equipment/service.ts` holds the business logic (list/get/create/update/delete); route handlers under `src/app/api/equipment/**` stay thin and use `src/lib/auth/guard.ts` for session/role checks.
* Introduced small reusable UI primitives (`src/components/ui/button.tsx`, `form-controls.tsx`) and an equipment status badge, intended for reuse in Phase 4/5 UI.
* Search/filter on the equipment list uses a plain GET `<form>` (server component reads `searchParams`) — no client-side JS needed for that interaction.

## Phase 4 — Maintenance Management

- [x] Zod validation schemas for maintenance create/update
- [x] API routes: list (by equipment/status/technician), get, create, update, delete
- [x] Technician assignment (admin-only) and status/notes updates (assigned technician or admin)
- [x] Maintenance list/detail UI, linked from equipment
- [x] Unit tests: validation, status transitions, authorization rules

Phase 4 is complete: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` all pass.

Notes:
* `src/lib/maintenance/authorize.ts` (`authorizeMaintenanceUpdate`) resolves whether a PATCH request gets the full admin field set or the restricted technician self-update set (status/completedDate/notes, enforced via a `.strict()` Zod schema so extra fields 400 instead of being silently dropped) — reconciles REQUIREMENTS.md sections 1 and 4 on what an assigned technician may edit.
* Maintenance records are reached from their equipment (`/equipment/[id]` lists them and links to `/equipment/[id]/maintenance/new`); there is no separate top-level maintenance list page, per the "linked from equipment" scope.
* `src/lib/users/service.ts` (`listActiveTechnicians`) is a small addition needed for the technician-assignment dropdown.

## Phase 5 — Dashboard

- [x] Equipment statistics (counts by status, total)
- [x] Maintenance statistics (counts by status, by type)
- [x] Recent activity feed
- [x] Dashboard UI assembling the above
- [x] Unit tests: statistics aggregation logic

Phase 5 is complete: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` all pass. Manually verified against a seeded local database (empty state and populated state, via `/api/dashboard` and the rendered `/` page).

Notes:
* `src/lib/dashboard/service.ts` holds the aggregation logic (`getEquipmentStatistics`, `getMaintenanceStatistics`, `getRecentActivity`); counts are zero-filled for every enum value so the UI never has to guard against missing keys.
* The dashboard replaces the placeholder Next.js template at `src/app/page.tsx` — it's the first page a logged-in user lands on (`/` is already protected by `proxy.ts`, and login's default `callbackUrl` is `/`).
* `GET /api/dashboard` (`src/app/api/dashboard/route.ts`) exposes the same data per `docs/ARCHITECTURE.md` section 5, but the page itself calls the service functions directly, consistent with how the equipment/maintenance list pages read data.
* Recent activity is maintenance records joined with their equipment name, ordered by `updatedAt` descending — the simplest reading of REQUIREMENTS.md section 5's "maintenance records (and equipment where relevant)".

## Phase 6 — Polish & Hardening

- [x] Consistent loading/error/empty states across list and form views
- [x] Accessibility pass on forms and navigation
- [x] Final review against CLAUDE.md Definition of Done (typecheck, lint, tests, build, no secrets, no scope creep)

Phase 6 is complete: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` all pass. Manually verified against a seeded local database, including a full production run via the standalone server build (as `Dockerfile` runs it).

Notes:
* Loading states: `src/components/ui/loading.tsx` (`LoadingState`, `role="status"`/`aria-live="polite"`) backs three route-level `loading.tsx` files — `src/app/loading.tsx` (dashboard), `src/app/equipment/loading.tsx` (covers the whole `/equipment/**` subtree, since a segment's `loading.tsx` wraps all nested routes), and `src/app/maintenance/[id]/loading.tsx`. No `loading.tsx` was needed elsewhere.
* Error states: `src/app/error.tsx` (root error boundary, generic message only — no `error.message`/stack shown to the client, per CLAUDE.md section 13) and `src/app/not-found.tsx` (styled 404, replacing the Next.js default) were added; existing inline form/field error states (`FormField`, `ConfirmDeleteButton`, login) were already consistent and untouched.
* Empty states (equipment list, equipment's maintenance list, dashboard's recent activity) were already consistent; no changes needed.
* Accessibility: added a "skip to main content" link and a `<main id="main-content">` landmark in `src/app/layout.tsx`; nav now uses `src/components/nav-link.tsx` (`aria-current="page"` on the active link) and the `<nav>` has `aria-label="Primary"`; data table headers got `scope="col"`; `FormField` (`src/components/ui/form-controls.tsx`) now wires `aria-invalid`/`aria-describedby` from field errors onto its child control via `cloneElement`; focus-visible rings were added to `buttonClasses` and form field classes (both previously suppressed the native outline on focus without a visible replacement).
* Known issue (pre-existing, not introduced by this phase): calling `notFound()` from a dynamic route (e.g. `/equipment/[id]` with an unknown id) renders the correct not-found content but the response status stays 200 instead of 404, verified against the real standalone production server. A genuinely unmatched route (e.g. a typo'd URL) correctly returns 404. Left unfixed per CLAUDE.md section 20 (out of Phase 6's scope; investigate separately if it starts to matter, e.g. for SEO or API consumers).

---

## Notes

* Architecture and scope are fixed by `CLAUDE.md` and `docs/ARCHITECTURE.md`; do not introduce new patterns or dependencies without checking there first.
* If a phase reveals an unrelated problem, fix it only if it blocks the current phase; otherwise note it here under a "Known issues" section rather than expanding scope silently.
