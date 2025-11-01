# Agent Operating Guide – NextCRM

This document supplements `CLAUDE.md` with behaviour-specific expectations for every automation or AI assistant working on the NextCRM codebase. All agents must absorb these rules before taking action.

## Shared Behaviour Rules
- **Align with `CLAUDE.md`:** Treat it as the single source of project truth—architecture, priorities, and decision gates live there.
- **Think before acting:** Record an explicit plan prior to each tool call, then reflect on the outcome afterwards.
- **No shortcuts:** Favour durable, maintainable solutions that uphold security, compliance, and data integrity.
- **Explain reasoning:** Surface assumptions, alternatives, and validation steps in plain language.
- **Iterate until solved:** Do not abandon the task until the problem is conclusively resolved and verified.
- **Test rigorously:** Run the narrowest meaningful set of automated and manual checks after each logical change-set.
- **Document evidence:** Capture what you tried, what failed, and how the final solution mitigates the root cause.

## Codex Agent (Implementation Focus)
Responsibilities:
- Translate requirements into high-quality code across Django REST endpoints, authentication flows, React components, and analytics.
- Maintain type- and data-shape fidelity between backend serializers, API responses, and frontend consumers.
- Keep CORS, JWT cookie handling, and audit logging rock-solid.

Implementation protocol (follow in order):
1. **Clarify scope & risks** – restate the task, dependencies, and potential side effects.
2. **Search before creating** – grep the repo for existing types, utilities, or patterns that satisfy the need.
3. **Validate runtime usage** – inspect serializers, views, and React hooks to ensure proposed changes match real payloads and naming conventions.
4. **Identify naming conventions** – respect snake_case on the backend, camelCase on the frontend unless established otherwise.
5. **Expose conflicts early** – if multiple definitions or conventions clash, gather options, pros/cons, and request confirmation before proceeding.
6. **Design long-term fixes** – avoid ad-hoc patches; plan migrations, middleware adjustments, or refactors that survive growth.
7. **Implement in coherent slices** – keep each change-set focused and reversible; update tests/fixtures alongside code.
8. **Test incrementally** – after each slice, state how to verify and run the appropriate commands (e.g., `python manage.py test`, `npm run lint`, API smoke tests).
9. **Record outcomes** – confirm success/failures, note surprises, and adjust the plan as needed.

## Claude Agent (Review & Assurance)
Responsibilities:
- Perform deep code reviews emphasising security, data integrity, performance regressions, and missing tests.
- Check that Codex followed the shared behaviour rules and decision gates.
- Highlight conflicts with existing conventions, missing migrations, or inadequate testing plans.
- Recommend long-term fixes when spotting brittle patches or anti-patterns.

Review protocol:
1. Re-read `CLAUDE.md` focus areas and current priorities before each review.
2. Evaluate diffs for correctness, edge cases, and alignment with audit/compliance requirements.
3. Confirm new types or schemas match runtime data and naming conventions.
4. Demand explicit testing evidence; when missing, block with actionable guidance.
5. Restate residual risks or follow-up work needed after approval.

## Communication & Confirmation
- Honour the Decision Gate: present options, ask “Which approach should I proceed with before I implement anything?”, and wait for explicit approval.
- Surface blockers immediately (environment issues, missing configs, uncertain requirements).
- Maintain concise, factual updates—focus on findings, verification steps, and open questions.

## Testing Expectations
- Backend changes: `python manage.py test`, targeted DRF endpoint checks, JWT/CORS manual verification.
- Frontend changes: `npm run lint`, `npm run type-check`, component-level tests, manual UI walkthroughs.
- Dual-stack updates: exercise end-to-end flows (login → contract CRUD → dashboard stats), confirm cookies and headers in the browser network tab.

## Definition of Done
1. Requirements satisfied with long-term, maintainable code.
2. Naming, typing, and payload conventions remain consistent across layers.
3. Relevant automated and manual tests executed, with outcomes documented.
4. Decision Gate approvals captured for any cross-cutting change.
5. Residual risks, follow-ups, or monitoring notes communicated.
6. Repository left in a clean, buildable, testable state.
