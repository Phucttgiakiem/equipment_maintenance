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

- [ ] Zod validation schemas for equipment create/update
- [ ] API routes: list (search + filter by status/category), get, create, update, delete
- [ ] Server-side enforcement: create/update/delete admin-only, read for both roles
- [ ] Equipment list UI with search/filter
- [ ] Equipment create/edit form, status change control
- [ ] Unit tests: validation, uniqueness handling, authorization rules

## Phase 4 — Maintenance Management

- [ ] Zod validation schemas for maintenance create/update
- [ ] API routes: list (by equipment/status/technician), get, create, update, delete
- [ ] Technician assignment (admin-only) and status/notes updates (assigned technician or admin)
- [ ] Maintenance list/detail UI, linked from equipment
- [ ] Unit tests: validation, status transitions, authorization rules

## Phase 5 — Dashboard

- [ ] Equipment statistics (counts by status, total)
- [ ] Maintenance statistics (counts by status, by type)
- [ ] Recent activity feed
- [ ] Dashboard UI assembling the above
- [ ] Unit tests: statistics aggregation logic

## Phase 6 — Polish & Hardening

- [ ] Consistent loading/error/empty states across list and form views
- [ ] Accessibility pass on forms and navigation
- [ ] Final review against CLAUDE.md Definition of Done (typecheck, lint, tests, build, no secrets, no scope creep)

---

## Notes

* Architecture and scope are fixed by `CLAUDE.md` and `docs/ARCHITECTURE.md`; do not introduce new patterns or dependencies without checking there first.
* If a phase reveals an unrelated problem, fix it only if it blocks the current phase; otherwise note it here under a "Known issues" section rather than expanding scope silently.
