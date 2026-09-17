# Architecture

This document describes the technical architecture of the Maintenance Management System as implemented, so future work stays consistent with it. See `docs/REQUIREMENTS.md` for business rules and `docs/PLAN.md` for phased progress.

Some parts of this document describe **planned/target design** that is not yet implemented (clearly marked as such) — this happens when documentation is updated ahead of the corresponding code change, consistent with how Phase 7's user-management design was documented here before it was built. Check `docs/PLAN.md` for what has actually been implemented.

---

## 1. Stack

* **Framework**: Next.js 16 (App Router, `src/app`), React 19, TypeScript (strict mode).
* **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`).
* **Backend**: Next.js Route Handlers under `src/app/api/**` (no separate backend service).
* **ORM / DB**: Drizzle ORM (`drizzle-orm/postgres-js`) against PostgreSQL 16.
* **Auth**: NextAuth (Auth.js) v5 beta, Credentials provider, passwords hashed with `bcryptjs`.
* **Validation**: Zod schemas at API boundaries.
* **Testing**: Jest + `ts-jest`, unit tests only (no integration/E2E in scope).
* **Infra**: Docker + Docker Compose for local dev/deployment; GitHub Actions for CI.

## 2. Project Structure

```
src/
  app/            Next.js App Router pages, layouts, and API route handlers
  db/
    schema.ts     Drizzle table/enum definitions (source of truth for DB structure)
    index.ts      Drizzle client (postgres-js), reads DATABASE_URL
    seed.ts       Idempotent demo-data seed script (users)
  lib/            Shared utilities, validation schemas, business logic
drizzle/          Generated SQL migrations (drizzle-kit generate/migrate)
docs/             REQUIREMENTS.md, ARCHITECTURE.md, PLAN.md
```

Route handlers should stay thin: validate input (Zod) → call a function in `src/lib` that holds the business rule → map the result to an HTTP response. This keeps business logic testable in isolation from Next.js request/response plumbing, per CLAUDE.md section 12.

## 3. Database Schema

Defined in `src/db/schema.ts`, PostgreSQL via Drizzle.

### Enums
* `user_role`: `admin`, `technician`
* `equipment_status`: `operational`, `under_maintenance`, `out_of_service`, `retired`
* `maintenance_status`: `scheduled`, `in_progress`, `completed`, `cancelled`
* `maintenance_type`: `preventive`, `corrective`, `inspection`
* `registration_status`: `pending`, `approved`, `rejected`

`user_role` has exactly two values and there is no plan to add a third; there is no separate roles/permissions table and none should be introduced (see section 4).

### Tables

**`users`**
| column | type | notes |
|---|---|---|
| id | uuid, PK | `defaultRandom()` |
| name | varchar(120) | |
| email | varchar(255) | unique |
| password_hash | text | bcrypt hash |
| role | user_role | default `technician`; fixed at creation, never changed after (see section 4) |
| is_active | boolean | default `true` |
| registration_status | registration_status | default `approved` |
| created_at / updated_at | timestamptz | default now |

Self-registered accounts are created with `registration_status: pending` and `is_active: false`. Accounts created via seed data or directly by an admin default to `approved`/active, so the column's default keeps existing rows unaffected.

**`categories`** — separate master-data table backing equipment categorization (REQUIREMENTS.md section 5):
| column | type | notes |
|---|---|---|
| id | uuid, PK | `defaultRandom()` |
| name | varchar(100) | unique |
| created_at / updated_at | timestamptz | default now |

**`equipment`**
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| name | varchar(200) | |
| code | varchar(50) | unique |
| category_id | uuid, FK → categories.id | nullable |
| location | varchar(200) | nullable |
| status | equipment_status | default `operational`, indexed |
| purchase_date | date | nullable |
| notes | text | nullable |
| created_by_id | uuid, FK → users.id | nullable |
| created_at / updated_at | timestamptz | default now |

**`maintenance_records`**
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| equipment_id | uuid, FK → equipment.id | `onDelete: cascade`, indexed |
| technician_id | uuid, FK → users.id | nullable |
| type | maintenance_type | default `preventive` |
| status | maintenance_status | default `scheduled`, indexed |
| scheduled_date | timestamptz | required, indexed |
| completed_date | timestamptz | nullable |
| description | text | required |
| notes | text | nullable |
| created_by_id | uuid, FK → users.id | nullable |
| created_at / updated_at | timestamptz | default now |

Relationships: one equipment → many maintenance records (cascade delete). A maintenance record optionally references an assigned technician and the creating user, both from `users`. One category → many equipment (nullable reference; deleting a category in use is blocked at the service layer, not relied on as a DB constraint, so a clear 409 can be returned — see section 5).

Schema changes must follow CLAUDE.md section 8: inspect schema → check affected queries/relations → update schema/migration → update app code → verify with tests. Migration `0002_category_master_data.sql` introduces `categories`, backfills one row per distinct existing free-text `equipment.category` value, populates the new `equipment.category_id` from that mapping, then drops the old `category` column — preserving existing equipment/category associations rather than discarding them.

## 4. Authentication & Authorization

* NextAuth v5 with a Credentials provider: looks up the user by email, verifies the password with `bcryptjs.compare`, rejects if `isActive` is false.
* Session strategy: JWT (no database adapter) — keeps the auth layer simple and avoids an extra dependency, per CLAUDE.md section 18. The JWT carries `userId` and `role`; the role is read from the token on the server, never trusted from the client.
* Route protection: server-side checks (`src/proxy.ts` — Next.js 16's renamed successor to `middleware.ts` — and/or per-route handler checks via `src/lib/auth/guard.ts`) verify a valid session before running any protected logic; role checks gate admin-only actions (equipment/maintenance writes, category management, technician assignment, user management).
* Secrets (`AUTH_SECRET`, `DATABASE_URL`, etc.) are supplied via environment variables (`.env`, never committed) and Docker Compose env vars; `.env.example` documents the required keys with placeholder values.
* **Login gate for pending/rejected/inactive users**: `verifyCredentials` already rejects any user with `isActive = false` before comparing passwords. Since `pending` and `rejected` registrations are `isActive = false` by construction, blocking their login is a consequence of this existing check, not a new code path.
* **Registration flow**: `POST /api/auth/register` is the only public (unauthenticated) write endpoint in the app. It accepts name/email/password/confirm-password only, validated with a `.strict()` Zod schema (same pattern as `loginSchema` and the maintenance technician self-update schema) so a client-supplied `role` or any other field is rejected with 400 rather than ignored. The created row is always `role: technician`, `registrationStatus: pending`, `isActive: false`.
* **Approval/rejection flow**: only an admin (`requireRole(["admin"])`) may approve or reject a `pending` registration. Approve sets `registrationStatus: approved` and `isActive: true`. Reject sets `registrationStatus: rejected` and leaves `isActive: false`. Both are valid only when the target's current `registrationStatus` is `pending`; calling either on a non-pending user returns 409 Conflict.
* **Activation/deactivation flow**: separate from approval — only applies to already-`approved` users. Admin-only. Deactivate sets `isActive: false` without touching `registrationStatus`; activate reverses it. An admin cannot deactivate their own account (403).
* **No role-change functionality**: a user's `role` is set once at account creation and is never changed afterward by any API, service function, or UI control. There is no `PATCH .../role`-style endpoint and none should be added — `admin` accounts are provisioned only via seed data or direct database provisioning, never through the application. (An earlier phase of this project did implement a role-change endpoint and UI; per `docs/PLAN.md`, removing that code is planned work, not yet done — this section describes the target design going forward.)
* **Password management** — **planned, not yet implemented**:
  * Self-service change: an authenticated user calls an endpoint with their current password, a new password, and a confirmation; the service verifies the current password against the stored hash, validates the new password, confirms the two new-password inputs match, then re-hashes and stores it. The current password is never returned in any response.
  * Admin-assisted reset: an admin supplies a new temporary password for another user's account; the service hashes and stores it directly. The target user's old password hash is never read back to the admin or included in any response — the endpoint is write-only with respect to the password field. The affected user is expected to log in with the temporary password and then use the self-service change endpoint above.
  * No email or token-based reset flow exists or is planned for this phase.
* **Server-side RBAC**: every user-management action (list with filters, approve, reject, activate, deactivate, reset password) is gated by `requireRole(["admin"])` from `src/lib/auth/guard.ts` — the same guard already used for equipment/maintenance/category admin-only actions. **No RBAC/permission system exists or should be introduced** — authorization throughout the application is a direct check of the single `role` value (`admin` or `technician`), never a granular permission table or policy engine.

### Access Boundaries

A concise summary of who can do what, consolidating the rules above and in `docs/REQUIREMENTS.md`:

| Action | Admin | Technician |
|---|---|---|
| View equipment (list/detail), maintenance history | ✔ | ✔ |
| Create/edit/delete equipment | ✔ | ✘ |
| List/create/edit/delete categories | ✔ | ✘ |
| Select an existing category (e.g. filtering, equipment forms) | ✔ | ✔ |
| Create/edit/delete maintenance records, assign technician | ✔ | ✘ |
| Update status/notes on a maintenance record assigned to them, within valid transitions | ✔ (any record) | ✔ (only their own) |
| Approve/reject registrations, activate/deactivate users, reset another user's password | ✔ | ✘ |
| Change own password | ✔ | ✔ |
| View dashboard | ✔ | ✔ |
| Change any user's role | — (does not exist) | — (does not exist) |

## 5. Maintenance Workflow

* Status transitions are validated in the service layer (`src/lib/maintenance/service.ts`), not left to the database or the client. The allowed transitions, per `docs/REQUIREMENTS.md` section 7, are:
  * `scheduled → in_progress`
  * `in_progress → completed`
  * `scheduled → cancelled`
  * `in_progress → cancelled`
* Any other requested transition is rejected before any write, using the same pattern already established by `InvalidRegistrationStateError` (a custom `Error` subclass caught in the route handler and mapped to a 409 response) — conceptually an `InvalidMaintenanceTransitionError`, without introducing a new generic error-handling abstraction beyond that existing pattern.
* Authorization for maintenance updates continues to use `authorizeMaintenanceUpdate` (`src/lib/maintenance/authorize.ts`): an admin may update any record; a technician may only update a record where they are the assigned `technician_id`, and only within the allowed transitions above and the already-restricted field set (status/completedDate/notes).
* Technicians read equipment maintenance history in full (all records for a piece of equipment) but the set of records they can *update* is scoped to their own assignments — this is an authorization check on write, not a filter on read.

## 6. Dashboard

* `src/lib/dashboard/service.ts` computes all dashboard data from real queries against `equipment` and `maintenance_records` — nothing is hard-coded.
* `getEquipmentStatistics()`: counts grouped by `equipment_status`, plus a total, zero-filled for every status value.
* `getMaintenanceStatistics()`: counts grouped by `maintenance_status` ("By Status") and, separately, counts grouped by `maintenance_type` ("By Type" — exactly `preventive`/`corrective`/`inspection`), both zero-filled so the UI never has to guard against a missing key; an empty `maintenance_records` table yields all-zero counts, which is the correct rendering, not an error state.
* `getRecentActivity(limit)`: reads recent maintenance records joined with their equipment (and, where applicable, the responsible user), ordered by `updated_at` descending, to represent activity such as scheduling, starting, completing, cancelling, or otherwise updating a maintenance record. When there are no matching records, the UI renders the empty-state copy "No maintenance activity yet." instead of an empty list.
* `GET /api/dashboard` exposes the same service data (see section 7); the dashboard page itself calls the service functions directly, consistent with how the equipment/maintenance list pages read data.
* Dashboard data is read-only for both roles; no role-specific filtering is required for MVP.

## 7. API Design

* Route handlers live under `src/app/api/**`, one resource per route segment (e.g. `api/equipment`, `api/equipment/[id]`, `api/categories`, `api/categories/[id]`, `api/maintenance`, `api/maintenance/[id]`, `api/dashboard`, `api/auth/register` (public), `api/users` (admin-only list), `api/users/[id]/approve`, `api/users/[id]/reject`, `api/users/[id]/activate`, `api/users/[id]/deactivate`).
* Every handler: validates input with Zod, authenticates the session, authorizes the action against the user's role, performs the DB operation via Drizzle, and returns a predictable JSON shape with the correct HTTP status.
* Errors follow a consistent shape (e.g. `{ error: string }`) and never leak stack traces, credentials, or internal details (CLAUDE.md section 13).
* There is no `PATCH /api/users/[id]/role` route (or equivalent) — role-change is not a supported action (see section 4).
* **Planned, not yet implemented** — password management: `PATCH /api/users/me/password` (self-service change: current password, new password, confirmation, authenticated user only) and `POST /api/users/[id]/reset-password` (admin-only temporary reset for another user).
* Category management: `GET/POST /api/categories` (list is open to both roles for populating dropdowns; create is admin-only) and `PATCH/DELETE /api/categories/[id]` (admin-only); a delete on a category still referenced by equipment returns 409 (`CategoryInUseError`), using the same custom-error-mapped-to-status pattern as `EquipmentCodeConflictError`/`InvalidRegistrationStateError`. Business logic lives in `src/lib/categories/service.ts` (`listCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory`); validation in `src/lib/categories/schema.ts`.
* User-management business logic lives in `src/lib/users/service.ts` (already home to `listActiveTechnicians`), extended with `listUsers` (filter by `registrationStatus`/`role`/`isActive`), `registerUser`, `approveUser`, `rejectUser`, `activateUser`, `deactivateUser`. Conflict/guard conditions are custom `Error` subclasses caught in the route handler and mapped to HTTP status, matching `EquipmentCodeConflictError`'s pattern: a duplicate registration email and an approve/reject call on a non-`pending` user both map to 409; an admin acting on their own account for deactivate maps to 403. Validation schemas live in a new `src/lib/users/schema.ts`, alongside the existing `src/lib/auth/schema.ts` (`loginSchema`).

## 8. Docker

* `Dockerfile`: multi-stage build (`deps` → `builder` → `runner`) producing a Next.js standalone server (`next.config.ts` sets `output: "standalone"`).
* `docker-compose.yml`: two services — `db` (postgres:16-alpine, healthchecked) and `app` (built from the Dockerfile, waits on `db` healthy, reads `DATABASE_URL` built from the Postgres env vars).
* No additional containers/services beyond what the app needs, per CLAUDE.md section 15.

## 9. Testing

* Jest configured with `ts-jest`, `testEnvironment: "node"`, and the `@/` path alias mapped to `src/`.
* Unit tests target business logic, validation, and auth/authorization logic in `src/lib` (and colocated with the code they test), per CLAUDE.md section 14.
* Integration/E2E tests are out of scope unless explicitly requested.

## 10. CI/CD

* GitHub Actions workflow runs on push/PR: install dependencies → typecheck (`next typegen && tsc --noEmit`) → lint (`eslint .`) → unit tests (`jest`) → production build (`next build`).
* No integration/E2E stage in CI, per CLAUDE.md section 17.
