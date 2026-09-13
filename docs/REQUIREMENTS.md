# Requirements

This document defines the functional and business requirements for the Maintenance Management System MVP. See `CLAUDE.md` for the overall MVP scope and out-of-scope list; this file expands each in-scope area into concrete rules.

---

## 1. Users and Roles

* Two roles: `admin` and `technician`.
* A user has a name, unique email, hashed password, role, an `isActive` flag, and a registration status (`pending`, `approved`, `rejected`) — see section 3.
* Inactive users must not be able to log in. A `pending` or `rejected` registration is always `isActive = false`, so it is covered by the same inactive-user login rule.
* Accounts created via seed data or directly by an admin are `approved` and active by default; only self-registered accounts start `pending`.
* **Admin**: full access — manage equipment, manage maintenance records, assign technicians, view dashboard, manage users (approve/reject registrations, activate/deactivate users, assign/change roles).
* **Technician**: can view equipment, view and update maintenance records assigned to them (status, dates, notes), and view the dashboard. Technicians cannot create/delete equipment, reassign maintenance to another technician, or perform any user-management action.
* Role checks must be enforced server-side on every protected route/action, never only in the UI.

## 2. Authentication

* Users log in with email + password (credentials-based).
* Passwords are stored as bcrypt hashes, never in plain text.
* A session is established on successful login and must be verifiable on every request to a protected route.
* Logout invalidates the client-side session.
* Unauthenticated requests to protected pages or API routes must be rejected (redirect to login for pages, 401 for APIs).
* Self-service registration is supported (see section 3). A newly registered account cannot log in until an admin approves it; users may also still be provisioned directly via seed data or admin action.

## 3. User Registration and Approval

* A prospective user may self-register via a public registration form/endpoint, submitting name, email, and password only.
* Every self-registered account is created with role `technician` and registration status `pending`, `isActive = false`. The client cannot set `role` or registration status on registration; a registration request that includes a `role` field (or any field beyond name/email/password) is rejected with a 400 validation error rather than silently accepted or ignored. This is the only mechanism by which self-registration is blocked from creating an `admin` account.
* Registration email must be unique, enforced the same way as the existing unique-email constraint on `users`; a duplicate-email registration is rejected with a clear validation error.
* Registration statuses:
  * `pending` — awaiting admin review; cannot log in.
  * `approved` — an admin has approved the registration; `isActive` is set to `true` so the user can log in.
  * `rejected` — an admin has rejected the registration; `isActive` remains `false` and the user cannot log in.
* Only an admin may approve or reject a pending registration. Approval/rejection, activating/deactivating a user, and assigning/changing a user's role are all admin-only actions and must be enforced server-side, never only in the UI.
* Deactivating a user (e.g., an employee leaving) is a separate action from rejecting a registration: it sets `isActive = false` on an already-`approved` user without changing their registration status. An admin can also reactivate a previously deactivated user.
* An admin may assign or change any user's role between `admin` and `technician` at any time after the account exists. A user can never change their own role.
* An admin cannot deactivate or change the role of their own account through this flow (prevents an admin from accidentally locking themselves out); this restriction is enforced server-side.

## 4. Equipment Management

* Equipment fields: name, unique code, category (optional), location (optional), status, purchase date (optional), notes (optional), audit fields (created by, timestamps).
* Status values: `operational`, `under_maintenance`, `out_of_service`, `retired`.
* CRUD:
  * Create/update/delete: admin only.
  * Read: admin and technician.
* Search and filtering: users can search equipment by name/code and filter by status and category.
* Status changes must be explicit and validated against the allowed status values.
* Equipment code must be unique; creating/updating with a duplicate code is rejected with a clear error.

## 5. Maintenance Management

* A maintenance record belongs to exactly one piece of equipment (foreign key, cascade delete with the equipment).
* Fields: equipment reference, assigned technician (optional), type, status, scheduled date, completed date (optional), description, notes (optional), audit fields.
* Type values: `preventive`, `corrective`, `inspection`.
* Status values: `scheduled`, `in_progress`, `completed`, `cancelled`.
* CRUD:
  * Create/update/delete: admin only.
  * Read: admin and technician.
  * Status/notes update on an assigned record: the assigned technician or an admin.
* Technician assignment: only an admin can assign or reassign a technician to a maintenance record.
* A completed date is only meaningful once status is `completed`; the API must not require it for other statuses.
* Maintenance history/notes: each record keeps a free-text notes field for progress/history; the MVP does not require a separate audit-log table.

## 6. Dashboard

* Equipment statistics: counts by status (operational, under maintenance, out of service, retired), total equipment count.
* Maintenance statistics: counts by status (scheduled, in progress, completed, cancelled), and counts by type.
* Recent activity: a list of the most recently created/updated maintenance records (and equipment where relevant), most recent first.
* Dashboard data is read-only and available to both roles; content shown may be scoped by role where it makes sense (e.g., a technician's own upcoming maintenance) but this is not required for MVP.

## 7. Validation and Error Handling

* All API input is validated with Zod before touching the database.
* Invalid input returns 400 with a predictable error shape; no stack traces or internal details are exposed.
* Not-found resources return 404; forbidden actions return 403; unauthenticated requests return 401.
* Registration and user-management input follow the same rules; a registration request is validated with a `.strict()` schema so unexpected fields (e.g. `role`) are rejected outright rather than silently dropped, consistent with the existing precedent for technician self-updates on maintenance records.

## 8. Out of Scope

See `CLAUDE.md` section 4. Do not implement notifications, reporting/analytics beyond the dashboard above, multi-tenancy, or any of the other listed exclusions unless explicitly requested.
