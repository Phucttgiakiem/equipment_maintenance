# Requirements

This document defines the functional and business requirements for the Maintenance Management System MVP. See `CLAUDE.md` for the overall MVP scope and out-of-scope list; this file expands each in-scope area into concrete rules.

---

## 1. Users and Roles

* Two roles: `admin` and `technician`.
* A user has a name, unique email, hashed password, role, and an `isActive` flag.
* Inactive users must not be able to log in.
* **Admin**: full access — manage equipment, manage maintenance records, assign technicians, view dashboard.
* **Technician**: can view equipment, view and update maintenance records assigned to them (status, dates, notes), and view the dashboard. Technicians cannot create/delete equipment or reassign maintenance to another technician.
* Role checks must be enforced server-side on every protected route/action, never only in the UI.

## 2. Authentication

* Users log in with email + password (credentials-based).
* Passwords are stored as bcrypt hashes, never in plain text.
* A session is established on successful login and must be verifiable on every request to a protected route.
* Logout invalidates the client-side session.
* Unauthenticated requests to protected pages or API routes must be rejected (redirect to login for pages, 401 for APIs).
* No self-service registration in the MVP; users are provisioned via seed/admin action.

## 3. Equipment Management

* Equipment fields: name, unique code, category (optional), location (optional), status, purchase date (optional), notes (optional), audit fields (created by, timestamps).
* Status values: `operational`, `under_maintenance`, `out_of_service`, `retired`.
* CRUD:
  * Create/update/delete: admin only.
  * Read: admin and technician.
* Search and filtering: users can search equipment by name/code and filter by status and category.
* Status changes must be explicit and validated against the allowed status values.
* Equipment code must be unique; creating/updating with a duplicate code is rejected with a clear error.

## 4. Maintenance Management

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

## 5. Dashboard

* Equipment statistics: counts by status (operational, under maintenance, out of service, retired), total equipment count.
* Maintenance statistics: counts by status (scheduled, in progress, completed, cancelled), and counts by type.
* Recent activity: a list of the most recently created/updated maintenance records (and equipment where relevant), most recent first.
* Dashboard data is read-only and available to both roles; content shown may be scoped by role where it makes sense (e.g., a technician's own upcoming maintenance) but this is not required for MVP.

## 6. Validation and Error Handling

* All API input is validated with Zod before touching the database.
* Invalid input returns 400 with a predictable error shape; no stack traces or internal details are exposed.
* Not-found resources return 404; forbidden actions return 403; unauthenticated requests return 401.

## 7. Out of Scope

See `CLAUDE.md` section 4. Do not implement notifications, reporting/analytics beyond the dashboard above, multi-tenancy, or any of the other listed exclusions unless explicitly requested.
