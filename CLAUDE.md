# MAINTENANCE_MANAGEMENT

## 1. Project

This project is a Maintenance Management System for managing equipment and maintenance activities.

The project is built as a realistic full-stack web application and is also used to practice AI-assisted software development, testing, Git, Docker, and CI/CD.

---

## 2. Documentation

Detailed project information is stored in:

* `docs/REQUIREMENTS.md` — detailed functional and business requirements.
* `docs/ARCHITECTURE.md` — detailed architecture, database design, API design, data flow, and technical decisions.
* `docs/PLAN.md` — current implementation progress and planned work.

Do not duplicate detailed requirements or architecture information in this file.

Read documentation only when it is relevant to the current task.

Before substantial implementation work, check `docs/PLAN.md`.

Read `docs/REQUIREMENTS.md` when the task involves functionality or business rules.

Read `docs/ARCHITECTURE.md` when the task involves architecture, database, API, authentication, or system design.

---

## 3. MVP Scope

The MVP consists of:

* Authentication
* Login and logout
* Protected routes
* Basic session management
* Basic role-based authorization
* Equipment CRUD
* Equipment search and filtering
* Equipment status management
* Maintenance CRUD
* Maintenance records associated with equipment
* Technician assignment
* Maintenance status
* Maintenance dates
* Maintenance notes/history
* Dashboard
* Equipment statistics
* Maintenance statistics
* Recent activities

Do not implement functionality outside the defined scope unless explicitly requested.

---

## 4. Out of Scope

Do not introduce these features unless explicitly requested:

* Mobile applications
* Microservices
* Kubernetes
* Multi-tenant SaaS
* Payment systems
* Email notification systems
* Advanced analytics
* Complex reporting systems
* AI features
* Real-time communication
* External enterprise integrations
* Event-driven architecture

Avoid unnecessary infrastructure and architectural complexity.

---

## 5. Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js Route Handlers
* TypeScript
* Drizzle ORM

### Database

* PostgreSQL

### Infrastructure

* Docker
* Docker Compose
* GitHub Actions

### Testing

* Jest
* Unit tests only

Do not introduce alternative frameworks or libraries when the existing stack is sufficient.

---

## 6. Architecture Principles

Keep the architecture simple and appropriate for an MVP.

Prefer:

* Clear separation of responsibilities
* Reusable components
* Small focused modules
* Explicit data flow
* Simple solutions
* Existing project patterns

Avoid:

* Premature abstraction
* Over-engineering
* Unnecessary design patterns
* Unnecessary dependencies
* Duplicated business logic
* Large monolithic modules

Before introducing a new architectural pattern, verify that the existing architecture cannot solve the problem cleanly.

---

## 7. TypeScript

Use TypeScript throughout the application.

Prefer:

* Explicit types for important domain data
* Narrow types
* Reusable interfaces/types where appropriate
* Type-safe API boundaries

Avoid:

* `any` unless genuinely necessary
* Unsafe type assertions
* Duplicated type definitions
* Ignoring TypeScript errors

Do not disable type checking merely to make code compile.

---

## 8. Database

Use PostgreSQL with Drizzle ORM.

Database-related code must remain consistent with the schema and existing data model.

Before changing database structure:

1. Inspect the existing schema.
2. Check affected queries and relationships.
3. Update the appropriate schema/migration files.
4. Update dependent application code.
5. Verify the change with tests where applicable.

Do not change database structure unnecessarily.

---

## 9. API and Validation

Use Next.js Route Handlers for backend API endpoints.

API code should:

* Validate incoming data.
* Authenticate protected requests.
* Authorize actions where required.
* Return appropriate HTTP status codes.
* Return predictable error responses.
* Keep business logic separate from request-handling code when practical.

Never trust client-provided data.

Validate input before performing database operations.

---

## 10. Authentication and Authorization

Authentication must be handled consistently throughout the application.

Protected resources must verify authentication.

Authorization must be enforced on the server.

Do not rely on frontend UI restrictions as a security mechanism.

Users must only be allowed to perform actions permitted by their role.

Never expose secrets, credentials, tokens, or sensitive configuration to the client.

---

## 11. Frontend

The frontend should use a custom project-specific design.

Do not copy an existing dashboard template or introduce a prebuilt admin UI as the project's visual design.

Tailwind CSS may be used to implement the design.

Prioritize:

* Clear navigation
* Consistent spacing
* Consistent typography
* Reusable UI components
* Responsive layouts
* Accessible forms
* Clear loading states
* Clear error states
* Good usability

Prefer reusable components for common elements such as:

* Buttons
* Inputs
* Forms
* Modals
* Tables
* Cards
* Status badges
* Navigation
* Loading states
* Error states

Do not create abstractions merely for the sake of reuse.

---

## 12. Business Logic

Business rules should have a clear and predictable location.

Avoid duplicating the same business logic across frontend and backend.

Security-sensitive and business-critical rules must be enforced on the server.

Keep business logic independent from presentation whenever practical.

---

## 13. Error Handling

Handle expected errors explicitly.

Do not silently ignore errors.

Error messages should be useful for debugging while avoiding exposure of sensitive information.

Do not expose:

* Database credentials
* Internal secrets
* Authentication secrets
* Stack traces
* Sensitive internal implementation details

---

## 14. Testing

Use Jest for unit testing.

Focus unit tests on:

* Business logic
* Utility functions
* Validation
* Authentication logic
* Authorization logic
* Important edge cases

Use Arrange → Act → Assert.

Do not write tests only to increase coverage numbers.

Do not mock everything unnecessarily.

External dependencies should be mocked when they are outside the unit being tested.

Integration tests and end-to-end tests are not part of the current project scope unless explicitly requested.

---

## 15. Docker

Use Docker and Docker Compose where appropriate for local development and deployment.

Keep Docker configuration simple.

Do not add containers or services that are not required by the application.

Environment-specific configuration must not be hardcoded into images or source code.

Secrets must be supplied through environment variables or the appropriate deployment configuration.

---

## 16. Git

Use Git with clear, focused commits.

Prefer commits that represent one logical change.

Do not mix unrelated changes in the same commit.

Do not rewrite or delete existing user work without explicit permission.

Before making large changes, inspect the current Git state.

Never commit secrets, credentials, `.env` files, or generated sensitive files.

---

## 17. CI/CD

GitHub Actions should verify the application before deployment.

The CI pipeline should include:

1. Install dependencies
2. Type checking
3. Linting
4. Unit tests
5. Production build

Do not add integration or end-to-end testing to CI unless explicitly requested.

CI failures should be investigated rather than bypassed.

---

## 18. Dependencies

Before adding a dependency:

1. Check whether the existing stack already provides the required functionality.
2. Prefer the simplest existing solution.
3. Add a dependency only when it provides meaningful value.
4. Avoid dependencies that introduce unnecessary complexity.

Do not install libraries merely because they are popular.

---

## 19. AI Coding Rules

Before modifying code:

1. Understand the relevant existing code.
2. Check related types, APIs, database models, and components.
3. Check project conventions.
4. Determine the smallest appropriate change.
5. Implement the change.
6. Run relevant validation or tests.

Do not blindly rewrite working code.

Do not make unrelated improvements while implementing a task.

Do not change architecture without a clear reason.

When encountering an error, investigate the root cause instead of applying repeated speculative fixes.

---

## 20. Scope Control

Stay within the requested task.

If a requested change reveals an unrelated problem:

* Fix it only if it blocks the current task.
* Otherwise, leave it unchanged and mention it.

Do not silently expand the project's scope.

Do not introduce new features without explicit approval.

---

## 21. Definition of Done

A task is considered complete when:

* The requested functionality is implemented.
* Existing functionality is not unnecessarily broken.
* Type checking passes.
* Linting passes.
* Relevant unit tests pass.
* The production build succeeds when applicable.
* No secrets are exposed.
* The implementation follows the existing project architecture.
* No unnecessary dependencies or complexity were introduced.

---

## 22. Final Rule

Prefer simple, maintainable, secure, and understandable solutions.

Follow the existing project structure before creating new abstractions.

Read the relevant documentation when necessary, but do not load unrelated project documentation into context.

When requirements are unclear, inspect the existing project and relevant documentation before making assumptions.
