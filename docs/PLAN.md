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

## Phase 7 — User Management (Registration & Approval)

Expands MVP scope per `docs/REQUIREMENTS.md` sections 1–3.

- [x] Schema: added a `registration_status` enum (`pending`, `approved`, `rejected`) and column on `users` (default `approved`, so existing/seeded rows are unaffected); new self-registered rows are created `pending`. Generated and applied a Drizzle migration (`drizzle/0001_uneven_blink.sql`).
- [x] Zod schema for self-registration (name, email, password) using `.strict()` so a client-supplied `role` (or any other extra field) is rejected with 400, not ignored — same pattern as `authorizeMaintenanceUpdate`'s technician self-update schema (see Phase 4 notes).
- [x] `POST /api/auth/register` (public route): creates a user with role `technician`, `registrationStatus: "pending"`, `isActive: false`; rejects duplicate emails with a clear validation error.
- [x] Admin-only user-management API routes: list users (filterable by registration status/role/active), approve, reject, activate, deactivate, change role. All server-side, admin-only, following the existing thin-route-handler + `src/lib/*/service.ts` pattern.
- [x] Extended `src/lib/users/service.ts` (previously just `listActiveTechnicians`) with the registration/approval/activation/role-change business logic; reuses `src/lib/auth/guard.ts` for session/role checks.
- [x] Confirmed the existing NextAuth Credentials check (`isActive` must be true) already covers `pending` and `rejected` accounts with no separate code path — pending/rejected users are `isActive = false` by construction; already exercised by `verify-credentials.test.ts`'s inactive-user case.
- [x] Server-side guard preventing an admin from deactivating or changing the role of their own account (REQUIREMENTS.md section 3).
- [x] UI: public registration page (`/register`); admin user-management page (`/admin/users`, admin-only, redirects non-admins) with filters, approve/reject on pending registrations, activate/deactivate, and a role-change select per row.
- [x] Unit tests: registration validation (including rejection of a client-supplied `role`), duplicate-email handling, approve/reject transitions, activate/deactivate, role assignment, and authorization guards (self-deactivation/self-role-change, invalid state transitions).
- [x] `docs/ARCHITECTURE.md` already documented the users table columns, new API routes, and auth section ahead of this implementation; verified the implementation matches it.

Phase 7 is complete: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` all pass.

Notes:
* Action-style routes (`/api/users/[id]/approve`, `/reject`, `/activate`, `/deactivate`) are POST with no body, following `docs/ARCHITECTURE.md` section 5's route list; role change is `PATCH /api/users/[id]/role` since it takes a body.
* Activate/deactivate both require the target's `registrationStatus` to be `approved` (`InvalidRegistrationStateError`, 409) — a pending/rejected account must go through approve first, matching REQUIREMENTS.md section 3's framing of activation/deactivation as an approved-user-only action.
* `src/lib/users/service.ts` selects/returns a fixed `userColumns` projection everywhere (including on `insert(...).returning()` and `update(...).returning()`) so `passwordHash` never reaches a route handler's JSON response.
* Manual verification against a running Postgres instance (`docker compose up db`, migrate, seed, exercise `/register` and `/admin/users` in the browser) was not completed this session — Docker Desktop would not stay running in this environment. Automated checks (typecheck/lint/test/build) all pass; a manual pass is recommended before merging.

## Phase 8 — Access Model Cleanup

Removes the role-change capability so the access model matches `docs/REQUIREMENTS.md` section 1 and `docs/ARCHITECTURE.md` section 4 (a user's role is fixed at creation, with no change path).

- [x] Remove `PATCH /api/users/[id]/role` route
- [x] Remove `changeUserRole` from `src/lib/users/service.ts` (and the now-unused `changeRoleSchema` from `src/lib/users/schema.ts`)
- [x] Remove the `UserRoleSelect` UI component and its use on `/admin/users`
- [x] Remove/update unit tests that exercised role-change (service and schema tests)
- [x] Confirm the remaining registration/approval/activation flows are unaffected and still pass their existing tests
- [x] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass

Phase 8 is complete: `npm run typecheck`, `npm run lint`, `npm test` (86 tests, 12 suites), and `npm run build` all pass.

Notes:
* `/admin/users` now renders each user's role as plain text (`item.role`) instead of the removed `UserRoleSelect` dropdown; the role column is otherwise unchanged.
* `SelfActionError` in `src/lib/users/service.ts` is still used by `deactivateUser` (self-deactivation guard), so it was kept.

## Phase 9 — Password Management

Implements `docs/REQUIREMENTS.md` section 4 and the password-management design in `docs/ARCHITECTURE.md` section 4.

- [x] Show/hide toggle on the login page's password field
- [x] Show/hide toggles on the sign-up page's password and confirm-password fields
- [x] Self-service change-password: API route, service function (verify current password, validate new password, confirm match), UI form
- [x] Admin reset-password-for-another-user: API route, service function (never reads back the old hash), UI action on `/admin/users`
- [x] Unit tests: current-password verification failure, new-password validation, confirmation mismatch, admin reset happy path and authorization (admin-only)
- [x] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass

Phase 9 is complete: `npm run typecheck`, `npm run lint`, `npm test` (100 tests, 12 suites), and `npm run build` all pass. Manually verified via the dev server: login/register pages render the show/hide control and confirm-password field, and `POST /api/auth/register` correctly rejects a password/confirm-password mismatch with a `confirmPassword` field error.

Notes:
* `src/components/ui/password-input.tsx` (`PasswordInput`) wraps the existing `Input` primitive with a text-label show/hide toggle button (no icon library added, per CLAUDE.md section 18); used on the login, register, and new self-service change-password pages.
* `registerSchema` (`src/lib/users/schema.ts`) now requires `confirmPassword` and `.refine()`s that it matches `password` (REQUIREMENTS.md §3, previously undocumented-but-unimplemented) — this was necessary for the sign-up page's new confirm-password field to have any validation effect, so it was included in this phase rather than deferred. A shared `passwordSchema` (min 8 characters) is reused by `registerSchema`, the new `changePasswordSchema`, and `resetPasswordSchema`.
* `src/lib/users/service.ts` adds `changePassword` (verifies the current password via `bcrypt.compare` against a direct `passwordHash` select, never routed through the `userColumns`-projected `UserSummary` type) and `resetPassword` (admin-only write path; blocks self-targeting via the existing `SelfActionError`, since an admin resetting their own password would bypass the current-password check that the self-service flow requires).
* New routes: `PATCH /api/users/me/password` (self-service, any authenticated user) and `POST /api/users/[id]/reset-password` (admin-only), both following the existing thin-route-handler pattern.
* New page `/account/password` (self-service change-password form) linked from a "Change password" entry next to the user's name in the header (`src/app/layout.tsx`); no dedicated nav section existed for account actions, so it was added alongside the existing sign-out control rather than as a primary nav item.
* Admin reset-password UI (`src/components/users/reset-password-button.tsx`) uses `window.prompt` for the temporary password, consistent with the existing `window.confirm`-based pattern in `UserActionButton`/`ConfirmDeleteButton` rather than introducing a modal component that nothing else in the project uses yet.

## Phase 10 — Category Master Data

Status: Not started.

Implements `docs/REQUIREMENTS.md` section 5 and the schema/API design in `docs/ARCHITECTURE.md` sections 3 and 7.

- [ ] `categories` table + Drizzle migration; `equipment.category` (free-text) replaced with `equipment.category_id` (nullable FK to `categories.id`)
- [ ] Category service (list/create/edit/delete) and admin-only API routes (`/api/categories`, `/api/categories/[id]`); delete blocked with 409 when a category is referenced by any equipment
- [ ] Admin-only Categories page/tab (list, create, edit, delete)
- [ ] Equipment create/edit/filter forms switched from free-text category input to a select/dropdown sourced from the categories list
- [ ] Data-migration plan for existing free-text `equipment.category` values (map existing distinct values to new category rows before dropping the old column) — scope this out fully at implementation time, not here
- [ ] Unit tests: category CRUD validation, in-use delete conflict, equipment category dropdown wiring
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass

## Phase 11 — Maintenance Workflow & Technician Access Hardening

Status: Not started.

Implements the explicit status-transition and technician-access rules in `docs/REQUIREMENTS.md` section 7 and `docs/ARCHITECTURE.md` section 5.

- [ ] Enforce the explicit status-transition table (`scheduled → in_progress`, `in_progress → completed`, `scheduled → cancelled`, `in_progress → cancelled`; all others rejected) in the maintenance service layer
- [ ] Confirm/add an equipment detail view accessible to technicians (read-only) showing equipment info and its maintenance history
- [ ] Confirm technicians can see maintenance records assigned to them distinctly from general equipment maintenance history
- [ ] Unit tests: valid/invalid transition matrix, technician-scoped update authorization edge cases
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass

## Phase 12 — Dashboard Verification

Status: Not started.

Confirms `docs/REQUIREMENTS.md` section 8 ("By Type" and "Recent Activity") still holds after Phases 8–11 change the underlying data.

- [ ] Confirm "By Type" continues to report real counts for Preventive/Corrective/Inspection (including the all-zero case) after the transition-validation changes in Phase 11
- [ ] Confirm "Recent Activity" entries remain accurate and that the "No maintenance activity yet." empty state still renders correctly
- [ ] Adjust dashboard service/UI only if a gap is found; add unit tests if logic changes
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass

## Phase 13 — Final Verification

Status: Not started.

- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass across the full set of changes from Phases 8–12
- [ ] Manual regression pass against a seeded local database
- [ ] Re-check against `CLAUDE.md`'s Definition of Done (no secrets exposed, no unnecessary dependencies/complexity, architecture unchanged)

---

## Notes

* Architecture and scope are fixed by `CLAUDE.md` and `docs/ARCHITECTURE.md`; do not introduce new patterns or dependencies without checking there first.
* If a phase reveals an unrelated problem, fix it only if it blocks the current phase; otherwise note it here under a "Known issues" section rather than expanding scope silently.
* 2026-09-14: Documentation updated (this file, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`) to tighten the access model (no role-change functionality, ever), add category master data, password management, explicit maintenance status transitions, and clarify dashboard/technician-access rules, and to add Phases 8–13 covering the not-yet-implemented work. Phases 1–7 above are left unchanged as an accurate historical record — Phase 7's role-change feature was genuinely built and is now scheduled for removal in Phase 8, not retroactively erased from this history.
