# Phase 1: Foundation & RTO Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-05-18
**Phase:** 01-foundation-rto-dashboard
**Mode:** discuss (default, interactive)
**Areas discussed:** Backend framework, Dashboard layout, UI component foundation

---

## Backend Framework

| Question | Options Presented | User Selection |
|----------|------------------|----------------|
| Which backend framework? | NestJS (TypeScript) / FastAPI (Python) | NestJS (TypeScript) |
| Which ORM? | Prisma / TypeORM / Drizzle ORM | Prisma |
| Monorepo or separate repos? | Single monorepo / Separate repos / You decide | Single monorepo (apps/web + apps/api) |
| API versioning? | /api/v1/* from start / No versioning / You decide | /api/v1/* from the start |
| Auth strategy? | In-house JWT with NestJS Passport / Managed auth service / You decide | In-house JWT with NestJS Passport |
| File upload approach? | Backend generates presigned S3 URLs / Backend proxies uploads | Backend generates presigned S3 URLs |

## Dashboard Layout

| Question | Options Presented | User Selection |
|----------|------------------|----------------|
| RTO display format? | Table/list rows / Cards grid / You decide | Cards grid |
| What each card shows? (multiselect) | Traffic-light badge / Alert count / Validations count / Name+code+states | All four selected |
| Traffic-light placeholder? | "Not evaluated" badge / Default Green / Hidden until Phase 5 | Hidden until Phase 5 |
| Workspace tabs? | All 8 tabs from day one / Only Phase 1-relevant tabs / You decide | All 8 tabs from day one |

## UI Component Foundation

| Question | Options Presented | User Selection |
|----------|------------------|----------------|
| Component approach? | shadcn/ui / Pure Tailwind / Headless UI | shadcn/ui |
| Visual tone? | Dark sidebar / Minimal light UI / You decide | Clean, professional dark sidebar |
| State management? | TanStack Query only / Zustand + TanStack Query / Redux Toolkit | TanStack Query only |

## Corrections / Notes

None — all recommended options accepted or deliberate choices made.

## Deferred Ideas

None surfaced during discussion.
