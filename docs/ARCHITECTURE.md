# Architecture

This document describes the technical architecture of the Maintenance Management System as implemented, so future work stays consistent with it. See `docs/REQUIREMENTS.md` for business rules and `docs/PLAN.md` for phased progress.

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

### Tables

**`users`**
| column | type | notes |
|---|---|---|
| id | uuid, PK | `defaultRandom()` |
| name | varchar(120) | |
| email | varchar(255) | unique |
| password_hash | text | bcrypt hash |
| role | user_role | default `technician` |
| is_active | boolean | default `true` |
| registration_status | registration_status | default `approved` |
| created_at / updated_at | timestamptz | default now |

Self-registered accounts are created with `registration_status: pending` and `is_active: false`. Accounts created via seed data or directly by an admin default to `approved`/active, so the column's default keeps existing rows unaffected.

**`equipment`**
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| name | varchar(200) | |
| code | varchar(50) | unique |
| category | varchar(100) | nullable |
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

Relationships: one equipment → many maintenance records (cascade delete). A maintenance record optionally references an assigned technician and the creating user, both from `users`.

Schema changes must follow CLAUDE.md section 8: inspect schema → check affected queries/relations → update schema/migration → update app code → verify with tests.

## 4. Authentication & Authorization

* NextAuth v5 with a Credentials provider: looks up the user by email, verifies the password with `bcryptjs.compare`, rejects if `isActive` is false.
* Session strategy: JWT (no database adapter) — keeps the auth layer simple and avoids an extra dependency, per CLAUDE.md section 18. The JWT carries `userId` and `role`; the role is read from the token on the server, never trusted from the client.
* Route protection: server-side checks (`src/proxy.ts` — Next.js 16's renamed successor to `middleware.ts` — and/or per-route handler checks via `src/lib/auth/guard.ts`) verify a valid session before running any protected logic; role checks gate admin-only actions (equipment/maintenance writes, technician assignment, user management).
* Secrets (`AUTH_SECRET`, `DATABASE_URL`, etc.) are supplied via environment variables (`.env`, never committed) and Docker Compose env vars; `.env.example` documents the required keys with placeholder values.
* **Login gate for pending/rejected/inactive users**: `verifyCredentials` already rejects any user with `isActive = false` before comparing passwords. Since `pending` and `rejected` registrations are `isActive = false` by construction, blocking their login is a consequence of this existing check, not a new code path.
* **Registration flow**: `POST /api/auth/register` is the only public (unauthenticated) write endpoint in the app. It accepts name/email/password only, validated with a `.strict()` Zod schema (same pattern as `loginSchema` and the maintenance technician self-update schema) so a client-supplied `role` or any other field is rejected with 400 rather than ignored. The created row is always `role: technician`, `registrationStatus: pending`, `isActive: false`.
* **Approval/rejection flow**: only an admin (`requireRole(["admin"])`) may approve or reject a `pending` registration. Approve sets `registrationStatus: approved` and `isActive: true`. Reject sets `registrationStatus: rejected` and leaves `isActive: false`. Both are valid only when the target's current `registrationStatus` is `pending`; calling either on a non-pending user returns 409 Conflict.
* **Activation/deactivation flow**: separate from approval — only applies to already-`approved` users. Admin-only. Deactivate sets `isActive: false` without touching `registrationStatus`; activate reverses it. An admin cannot deactivate their own account (403).
* **Role management**: admin-only, changes `role` between `admin`/`technician` on any existing user. An admin cannot change their own role (403). A user can never change their own role through any endpoint.
* **Server-side RBAC**: every user-management action (list with filters, approve, reject, activate, deactivate, change role) is gated by `requireRole(["admin"])` from `src/lib/auth/guard.ts` — the same guard already used for equipment/maintenance admin-only actions. No new authorization primitive is introduced.

## 5. API Design

* Route handlers live under `src/app/api/**`, one resource per route segment (e.g. `api/equipment`, `api/equipment/[id]`, `api/maintenance`, `api/maintenance/[id]`, `api/dashboard`, `api/auth/register` (public), `api/users` (admin-only list), `api/users/[id]/approve`, `api/users/[id]/reject`, `api/users/[id]/activate`, `api/users/[id]/deactivate`, `api/users/[id]/role`).
* Every handler: validates input with Zod, authenticates the session, authorizes the action against the user's role, performs the DB operation via Drizzle, and returns a predictable JSON shape with the correct HTTP status.
* Errors follow a consistent shape (e.g. `{ error: string }`) and never leak stack traces, credentials, or internal details (CLAUDE.md section 13).
* User-management business logic lives in `src/lib/users/service.ts` (already home to `listActiveTechnicians`), extended with `listUsers` (filter by `registrationStatus`/`role`/`isActive`), `registerUser`, `approveUser`, `rejectUser`, `activateUser`, `deactivateUser`, and `changeUserRole`. Conflict/guard conditions are custom `Error` subclasses caught in the route handler and mapped to HTTP status, matching `EquipmentCodeConflictError`'s pattern: a duplicate registration email and an approve/reject call on a non-`pending` user both map to 409; an admin acting on their own account for deactivate/role-change maps to 403. Validation schemas live in a new `src/lib/users/schema.ts`, alongside the existing `src/lib/auth/schema.ts` (`loginSchema`).

## 6. Docker

* `Dockerfile`: multi-stage build (`deps` → `builder` → `runner`) producing a Next.js standalone server (`next.config.ts` sets `output: "standalone"`).
* `docker-compose.yml`: two services — `db` (postgres:16-alpine, healthchecked) and `app` (built from the Dockerfile, waits on `db` healthy, reads `DATABASE_URL` built from the Postgres env vars).
* No additional containers/services beyond what the app needs, per CLAUDE.md section 15.

## 7. Testing

* Jest configured with `ts-jest`, `testEnvironment: "node"`, and the `@/` path alias mapped to `src/`.
* Unit tests target business logic, validation, and auth/authorization logic in `src/lib` (and colocated with the code they test), per CLAUDE.md section 14.
* Integration/E2E tests are out of scope unless explicitly requested.

## 8. CI/CD

* GitHub Actions workflow runs on push/PR: install dependencies → typecheck (`next typegen && tsc --noEmit`) → lint (`eslint .`) → unit tests (`jest`) → production build (`next build`).
* No integration/E2E stage in CI, per CLAUDE.md section 17.
