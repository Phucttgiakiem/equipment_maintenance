# Requirements

This document defines the functional and business requirements for the Maintenance Management System MVP. See `CLAUDE.md` for the overall MVP scope and out-of-scope list; this file expands each in-scope area into concrete rules.

---

## 1. Users and Roles

* Exactly two roles: `admin` and `technician`. No other roles exist, and no permission/RBAC system is introduced — every authorization check is a direct check of this single role value.
* A user has a name, unique email, hashed password, role, an `isActive` flag, and a registration status (`pending`, `approved`, `rejected`) — see section 3.
* Inactive users must not be able to log in. A `pending` or `rejected` registration is always `isActive = false`, so it is covered by the same inactive-user login rule.
* **A user's role is fixed once the account is created and there is no role-change functionality anywhere in the system** — no API, service function, or UI control for changing a user's role exists or may be added. Self-registration always creates a `technician` (see section 3). Any `admin` account is provisioned outside the self-service flow (seed data or direct database provisioning); there is no supported way to promote a `technician` to `admin` (or vice versa) through the application.
* **Admin**: full access — manage equipment, manage categories, manage maintenance records, assign technicians, view dashboard, manage users (approve/reject registrations, activate/deactivate users, reset another user's password). Admin does **not** have a role-change action, because none exists.
* **Technician**: can view equipment (list and detail), view maintenance history for equipment, view maintenance records assigned to them, update maintenance records assigned to them (status, dates, notes, within the allowed transitions in section 7), select existing categories where a category input is needed (e.g. equipment filtering), and view the dashboard. Technicians cannot create/edit/delete equipment, manage categories, reassign maintenance to another technician, or perform any user-management action.
* Role checks must be enforced server-side on every protected route/action, never only in the UI.

## 2. Authentication

* Users log in with email + password (credentials-based).
* Passwords are stored as bcrypt hashes, never in plain text, and a stored password hash is never returned by any API response or shown in any UI, including to an admin.
* The login form has a show/hide control for the password field so a user can optionally view what they typed.
* A session is established on successful login and must be verifiable on every request to a protected route.
* Logout invalidates the client-side session.
* Unauthenticated requests to protected pages or API routes must be rejected (redirect to login for pages, 401 for APIs).
* Self-service registration is supported (see section 3). A newly registered account cannot log in until an admin approves it; users may also still be provisioned directly via seed data or admin action.

## 3. User Registration and Approval

* A prospective user may self-register via a public registration form/endpoint, submitting name, email, password, and password confirmation.
* The sign-up form has independent show/hide controls for the password field and the confirm-password field.
* The password and confirm-password values must match; a mismatch is rejected with a clear validation error before any account is created.
* Every self-registered account is created with role `technician` and registration status `pending`, `isActive = false`. The client cannot set `role` or registration status on registration; a registration request that includes a `role` field (or any field beyond name/email/password/confirm-password) is rejected with a 400 validation error rather than silently accepted or ignored. This is the only mechanism by which self-registration is blocked from creating an `admin` account.
* Registration email must be unique, enforced the same way as the existing unique-email constraint on `users`; a duplicate-email registration is rejected with a clear validation error.
* Registration statuses:
  * `pending` — awaiting admin review; cannot log in.
  * `approved` — an admin has approved the registration; `isActive` is set to `true` so the user can log in.
  * `rejected` — an admin has rejected the registration; `isActive` remains `false` and the user cannot log in.
* Only an admin may approve or reject a pending registration, list users, activate/deactivate a user, and reset another user's password. All are admin-only actions and must be enforced server-side, never only in the UI.
* Approving or rejecting a registration is only valid when the target user's current registration status is `pending`; calling either action on a user who is not `pending` is rejected with a 409 conflict response.
* Deactivating a user (e.g., an employee leaving) is a separate action from rejecting a registration: it sets `isActive = false` on an already-`approved` user **without changing their registration status**. An admin can also reactivate a previously deactivated user, restoring `isActive = true` without touching `registrationStatus`.
* An admin cannot deactivate their own account through this flow (prevents an admin from accidentally locking themselves out); this restriction is enforced server-side.
* There is no role-change action in registration or user management — see section 1.

## 4. Password Management

* Authenticated users can change their own password at any time:
  * The current password must be verified before the change is accepted.
  * The new password must pass the same validation rules as at sign-up (e.g. minimum length).
  * The new password must be entered twice (new password + confirmation) and the two must match.
  * The current password is never echoed back or exposed in any response.
* Forgotten passwords are handled through an admin-assisted reset, not an email/token flow:
  * An admin can set a temporary password for another user's account.
  * The user's previous password hash is never exposed to the admin or in any API response — the admin only supplies a new temporary password, they do not see the old one.
  * The affected user logs in with the temporary password and is expected to change it to a password of their own choosing via the self-service change-password flow above.
* There is no email-based or token-based password reset flow in this phase; the admin-assisted reset above is the only recovery path for a forgotten password.
* An admin cannot use the reset-password action, or any other action, to view a user's actual stored password — passwords are never stored or transmitted in a recoverable form.

## 5. Category Management

* Equipment categories are separate master data, not free text on the equipment record.
* A category has, at minimum, a unique name and audit timestamps.
* Only an admin may list, create, edit, or delete categories. This is enforced server-side.
* A category that is currently referenced by at least one piece of equipment cannot be deleted; the attempt is rejected with a clear conflict/validation error (409) rather than silently failing or cascading the delete.
* Technicians can select from the existing list of categories wherever a category input appears (e.g. filtering the equipment list) but cannot create, edit, or delete categories, and have no access to a category-management page.

## 6. Equipment Management

* Equipment fields: name, unique code, category (optional, selected from existing categories — see section 5), location (optional), status, purchase date (optional), notes (optional), audit fields (created by, timestamps).
* Category is never entered as free text: equipment create, edit, and filter forms must present categories as a select/dropdown populated from the existing category list.
* Status values: `operational`, `under_maintenance`, `out_of_service`, `retired`.
* CRUD:
  * Create/update/delete: admin only.
  * Read (list and detail): admin and technician.
* Search and filtering: users can search equipment by name/code and filter by status and category.
* Status changes must be explicit and validated against the allowed status values.
* Equipment code must be unique; creating/updating with a duplicate code is rejected with a clear error.
* Technicians have full read access to the equipment list and equipment detail (including that equipment's maintenance history) but cannot create, edit, or delete equipment, and cannot manage categories.

## 7. Maintenance Management

* A maintenance record belongs to exactly one piece of equipment (foreign key, cascade delete with the equipment).
* Fields: equipment reference, assigned technician (optional), type, status, scheduled/planned date, completed date (optional), maintenance details/description, result/notes (optional), audit fields (created by, timestamps).
* Type values: `preventive`, `corrective`, `inspection`.
* Status values: `scheduled`, `in_progress`, `completed`, `cancelled`.
* Allowed status transitions are:
  * `scheduled` → `in_progress`
  * `in_progress` → `completed`
  * `scheduled` → `cancelled`
  * `in_progress` → `cancelled`
  * Any other transition (including moving out of `completed` or `cancelled`, or skipping a step) is invalid and must be rejected with a clear validation error.
* CRUD:
  * Create/update/delete: admin only.
  * Read (list, detail, and history): admin and technician.
  * Status/notes update on an assigned record, within the allowed transitions above: the assigned technician or an admin.
* Technician assignment: only an admin can assign or reassign a technician to a maintenance record.
* A completed date is only meaningful once status is `completed`; the API must not require it for other statuses.
* Maintenance history/notes: each record keeps a free-text notes field for progress/history; the MVP does not require a separate audit-log table.
* Technicians can view maintenance history for any equipment and can view maintenance records assigned to them, but may only update (status, dates, notes) the records assigned to them, and only within the allowed transitions above. Admins may manage any maintenance record per the CRUD rules above.

## 8. Dashboard

* Equipment statistics: counts by status (operational, under maintenance, out of service, retired), total equipment count.
* Maintenance statistics — **By Status**: counts by status (scheduled, in progress, completed, cancelled).
* Maintenance statistics — **By Type**: counts grouped by exactly the three maintenance types — Preventive, Corrective, Inspection — computed from real maintenance data. When there are no maintenance records (or none of a given type), the count for that type is `0`; counts are never hard-coded.
* Recent activity: a list of recent maintenance-related activity based on real data, such as a maintenance record being scheduled, started, completed, cancelled, or otherwise updated. Each entry must include enough information to understand what happened: the affected equipment, the affected maintenance record, the responsible user (where applicable), and when it happened.
* When there is no maintenance activity to show, the recent activity section displays the empty-state message "No maintenance activity yet." instead of an empty list or table.
* Dashboard data is read-only and available to both roles; content shown may be scoped by role where it makes sense (e.g., a technician's own upcoming maintenance) but this is not required for MVP.

## 9. Validation and Error Handling

* All API input is validated with Zod before touching the database.
* Invalid input returns 400 with a predictable error shape; no stack traces or internal details are exposed.
* Not-found resources return 404; forbidden actions return 403; unauthenticated requests return 401; a valid action performed against a resource in the wrong state (e.g. approving a non-pending user, deleting a category still in use, an invalid maintenance status transition) returns 409.
* Registration and user-management input follow the same rules; a registration request is validated with a `.strict()` schema so unexpected fields (e.g. `role`) are rejected outright rather than silently dropped, consistent with the existing precedent for technician self-updates on maintenance records.

## 10. Out of Scope

See `CLAUDE.md` section 4. Do not implement notifications, reporting/analytics beyond the dashboard above, multi-tenancy, or any of the other listed exclusions unless explicitly requested. In particular, do not introduce a role-change API/service/UI or any permission/RBAC system beyond the fixed two-value `admin`/`technician` role check described in section 1.
