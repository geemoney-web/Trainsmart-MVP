# Phase 1: Foundation & RTO Dashboard - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the full technical foundation — database schema, authentication, API scaffold — and deliver a working RTO dashboard with card-based RTO list and RTO CRUD. Includes the RTO workspace shell with all 8 tab stubs. Compliance intelligence (traffic-light computation) is NOT in scope — placeholders only where status fields exist.

</domain>

<decisions>
## Implementation Decisions

### Backend Framework
- **D-01:** NestJS (TypeScript) — full-stack TypeScript across frontend and backend
- **D-02:** Prisma as the ORM with PostgreSQL — schema-first, type-safe, migration tooling
- **D-03:** Single monorepo: `apps/web` (Next.js) + `apps/api` (NestJS) side by side
- **D-04:** All API routes prefixed `/api/v1/*` from day one

### Authentication
- **D-05:** In-house JWT auth with NestJS Passport — email/password login, JWT access + refresh tokens, no external auth service

### File Uploads
- **D-06:** Backend generates presigned S3 URLs; frontend uploads directly to object storage — backend never handles file bytes

### Dashboard Layout
- **D-07:** Cards grid layout for the RTO dashboard (not table rows)
- **D-08:** Each RTO card shows: RTO name, ASQA code, operating states, traffic-light status badge, unresolved alert count, upcoming validations count
- **D-09:** Traffic-light status badge is hidden in Phase 1 — it is only surfaced once the compliance engine exists (Phase 5)

### RTO Workspace
- **D-10:** All 8 workspace tabs present from day one (empty stubs): Qualifications, Trainers, TAS, Validations, Documents, Tasks, Alerts, Notes

### UI Component Foundation
- **D-11:** shadcn/ui (Radix UI + Tailwind) as the component system — copy-into-project, zero vendor lock-in
- **D-12:** Dark sidebar layout — dark left navigation, light content area (ops tool / SaaS aesthetic)
- **D-13:** TanStack Query (React Query) for all server state; React context for local UI state only — no Zustand or Redux at this stage

### Claude's Discretion
- Exact Prisma schema field names and indexes (follow established patterns: UUID PKs, snake_case, timestamps, soft delete with `deleted_at`)
- NestJS module structure (one module per domain: RTO, Auth, User)
- JWT token expiry durations (access: 15m, refresh: 7d is a sensible default)
- shadcn/ui theme colour tokens — dark sidebar colour palette
- Card grid responsive breakpoints

</decisions>

<specifics>
## Specific Ideas

- No specific design references given — shadcn/ui defaults with dark sidebar, professional ops-tool aesthetic
- All 8 workspace tabs visible immediately so navigation shape is stable through all 7 phases

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirements list; Phase 1 covers RTO-01–04 and DASH-01–06
- `.planning/ROADMAP.md` §Phase 1 — Goal, success criteria, and plan breakdown

### Architecture
- `CLAUDE.md` — Tech stack decisions, build principles, what to avoid, post-MVP feature list

No external specs or ADRs exist yet — all decisions are captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- None yet — patterns will be established in this phase

### Integration Points
- `apps/web` → `apps/api`: all data via REST `/api/v1/*` endpoints, TanStack Query for fetching
- `apps/api` → PostgreSQL: via Prisma client
- `apps/api` → S3-compatible storage: presigned URL generation for file uploads (Phase 6+)
- Auth guard on all API routes except `/api/v1/auth/login`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-rto-dashboard*
*Context gathered: 2026-05-18*
