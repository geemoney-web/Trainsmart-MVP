---
plan: 01-02
status: complete
completed: 2026-05-18
---

# Plan 01-02 Summary: NestJS API

## What was built

- NestJS app at `apps/api` on port 3001 with `/api/v1` prefix
- JWT auth: login, refresh (cookie-based), logout
- Global AccessTokenGuard with `@Public()` escape hatch
- Full RTO CRUD with workspace auto-provisioning (7 stub tables per RTO)
- Dashboard counts (alerts, validations) + 3 placeholder count fields for Phase 5
- Seed script: `operator@trainsmart.local / Password123!`

## Deviations

- Refresh token strategy updated to extract from httpOnly cookie (not Bearer header) — required for page-reload sessions to work correctly
- `apps/api/.env` created alongside root `.env` (NestJS ConfigModule reads from CWD)
- `@repo/db` package compiled to JS (`dist/`) before being consumable by the compiled NestJS app
