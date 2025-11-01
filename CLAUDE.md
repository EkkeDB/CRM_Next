# NextCRM – Context for Claude

## Project Overview
NextCRM is a security-focused Commodity Trading CRM that pairs a Django REST backend with a Next.js 14 frontend to manage contracts, counterparties, commodities, traders, and compliance workflows. The platform must stay audit-ready, GDPR-compliant, and resilient against auth or CORS regressions while providing a responsive dashboard for trading teams.

## Architecture Snapshot
- **Backend:** Django 4.2 + DRF, SimpleJWT with HttpOnly cookies, PostgreSQL, extensive audit logging.
- **Frontend:** Next.js 14 App Router, TypeScript, React Query, Zustand, Tailwind UI.
- **Infrastructure:** Docker-based deployments for dev/prod, Nginx reverse proxy, static asset handling via WhiteNoise.
- **Analytics:** REST endpoints aggregate contract KPIs, revenue trends, and portfolio insights.

## Core Principles
1. **Compliance & Security First:** Enforce GDPR consent tracking, audit trails, account lockouts, and strict CORS/auth cookie handling.
2. **Contract Lifecycle Integrity:** Preserve contract/amendment histories and prevent race conditions that could duplicate identifiers or corrupt totals.
3. **Reliability Over Shortcuts:** Prioritize long-term, proven fixes instead of patchy workarounds—especially for authentication, CORS, and financial calculations.
4. **Observability & Traceability:** Every significant action must be auditable; logging middleware and analytics cannot be optional.
5. **User Experience:** Keep dashboards fast, predictable, and accurate across currencies and statuses.

## Current Focus (Oct 31 2025)
- Harden JWT rotation & logout flows (cookie blacklisting, middleware ordering).
- Stabilize CORS/debug tooling without leaking sensitive metadata outside development.
- Ensure dashboard analytics (monthly rollups, overdue counts) remain accurate and performant.
- Maintain multi-currency and audit reporting fidelity as datasets grow.

## Behavioural Expectations (ABSOLUTE MUST)
Before implementing any fix or feature:
1. **Search for existing types:** For every type, schema, or interface you plan to add, grep the entire codebase to ensure it doesn’t already exist.
2. **Verify runtime usage:** Inspect actual object construction, serializers, API responses, and frontend consumption to confirm definitions match reality.
3. **Identify layer conventions:** Understand naming and casing rules (snake_case vs camelCase) per layer before touching data structures.
4. **Surface conflicts:** If you discover multiple definitions or conventions, present the options and consequences—get confirmation before choosing.
5. **Test incrementally:** After each logical group of changes, explain how to verify them together and run the relevant automated checks.
6. **Interrogate prior failures:** Investigate why earlier attempts broke, document the root cause, and prove the new solution addresses it.
7. **Think, analyze, test:** No assumptions without evidence—reason explicitly, implement cleanly, and validate with repeatable tests.
8. **Prefer long-term fixes:** Avoid temporary hacks; align every change with the platform’s compliance, reliability, and maintainability goals.

## Non-Negotiable Workflow
1. **Plan deeply** before each tool call—capture intent, scope, and validation steps.
2. **Reflect after every action**—confirm outcomes, adjust the plan, and document observations.
3. **Iterate until solved**—never stop mid-problem; keep refining until the issue is definitively resolved.
4. **Run substantive tests** whenever code changes affect runtime behaviour (e.g., `python manage.py test`, `npm run lint`, `npm run type-check`, endpoint-specific checks).

## Decision Gate — Mandatory Confirmation
Before making any non-trivial architectural or system-wide change, pause and gather explicit user approval. This includes:
- Modifying global middleware ordering or behaviour.
- Changing authentication/session/data flow.
- Renaming or redefining shared types, schemas, or API contracts.
- Introducing/removing significant dependencies or cross-cutting patterns.
- Altering conventions that impact multiple services or layers.

**Procedure:** Present viable options with pros, cons, and long-term implications, then ask: “Which approach should I proceed with before I implement anything?” Do not act until the user replies.

## Key References
- `README.md` – high-level features and setup.
- `backend/core/settings/base.py` – auth, CORS, middleware configuration.
- `backend/apps/authentication/` – JWT cookies, audit logging, GDPR flows.
- `backend/apps/nextcrm/` – contract and analytics domain logic.
- `frontend/src/lib/api.ts` – Axios client, token refresh handling.
- `frontend/src/hooks/` – React Query abstractions for domain entities.

## Testing & Verification
- Backend: `python manage.py test`, targeted unit tests, manual API calls via HTTP client.
- Frontend: `npm run lint`, `npm run type-check`, feature-specific Playwright/Cypress plans when available.
- Integration: Exercise login/refresh/logout, contract CRUD, dashboard stats, and CORS debug endpoints in browsers with credentials included.

## Always Prioritize
1. **User trust and data integrity** over feature speed.
2. **Security posture** (audit, GDPR, auth) over convenience.
3. **Maintainable, traceable solutions** that future engineers can reason about.
4. **Transparent communication** with stakeholders—surface risks, assumptions, and validation evidence.
