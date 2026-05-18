---
plan: 01-01
status: complete
completed: 2026-05-18
---

# Plan 01-01 Summary: Monorepo + Prisma Schema

## What was built

- pnpm + Turborepo monorepo root (package.json, pnpm-workspace.yaml, turbo.json, .gitignore, .env.example, docker-compose.yml)
- `packages/database` package (`@repo/db`) with Prisma schema, client singleton, and index exports

## Database

- All 10 tables created in Neon PostgreSQL 16 via `prisma db push`
- Prisma client generated at `packages/database/generated/client/`
- Partial unique index applied: `rtos_asqa_code_active_unique` on `rtos(asqa_code) WHERE deleted_at IS NULL`

## Tables created

users, rtos, rto_qualifications, trainers, tas_documents, validations, documents, tasks, compliance_alerts, notes

## Versions resolved

- pnpm: 11.1.2
- Prisma: 6.19.3
- Turbo: 2.9.14
- Node: 24.14.1

## Deviations

- Used `prisma db push` instead of `prisma migrate dev` — Neon cloud DB works better with push for initial setup
- `.env` file created in both project root and `packages/database/` (Prisma 6 looks for .env relative to schema location)
- Git repository connected to https://github.com/geemoney-web/Trainsmart-MVP
