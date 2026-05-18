---
phase: 3
slug: qualifications-units-tas-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-18
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (NestJS API) + Vitest (Next.js web) |
| **Config file** | `apps/api/jest.config.ts` / `apps/web/vitest.config.ts` |
| **Quick run command** | `pnpm --filter api test --testPathPattern=qualification\|unit\|tas` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter api test --testPathPattern=qualification\|unit\|tas`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | QUAL-03 | T-3-01 | Schema migration completes without data loss | integration | `npx prisma db push && npx prisma validate` | ✅ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | QUAL-03 | T-3-02 | GET /qualifications/:id returns 401 for unauthenticated requests | unit | `pnpm --filter api test qualification.controller` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | QUAL-04 | — | Qualification detail page renders without errors | e2e | `pnpm --filter web test qualification-detail` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | QUAL-05 | T-3-03 | GET /units/:id returns 401 for unauthenticated requests | unit | `pnpm --filter api test unit.controller` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | QUAL-05 | — | Unit snapshot timeline renders all versions in chronological order | unit | `pnpm --filter web test unit-detail` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 3 | TAS-01 | T-3-04 | POST /tas returns 401 for unauthenticated requests | unit | `pnpm --filter api test tas.controller` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 3 | TAS-02 | T-3-05 | S3 presigned URL generated without file bytes passing through backend | unit | `pnpm --filter api test tas.service` | ❌ W0 | ⬜ pending |
| 3-03-03 | 03 | 3 | TAS-03 | T-3-06 | Auto-archive runs in Prisma transaction (new Current → old Current becomes Archived) | unit | `pnpm --filter api test tas.service` | ❌ W0 | ⬜ pending |
| 3-03-04 | 03 | 3 | TAS-04 | — | Archived TAS records remain accessible (no deletion) | unit | `pnpm --filter api test tas.service` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 4 | TAS-06 | — | TAS records surface in RTO document library endpoint | unit | `pnpm --filter api test documents.controller` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/qualification/__tests__/qualification.controller.spec.ts` — stubs for QUAL-03, QUAL-04
- [ ] `apps/api/src/unit/__tests__/unit.controller.spec.ts` — stubs for QUAL-05
- [ ] `apps/api/src/tas/__tests__/tas.controller.spec.ts` — stubs for TAS-01 through TAS-06
- [ ] `apps/api/src/tas/__tests__/tas.service.spec.ts` — S3 presigned URL + auto-archive transaction tests
- [ ] `apps/web/__tests__/qualification-detail.test.tsx` — qualification detail page render test
- [ ] `apps/web/__tests__/unit-detail.test.tsx` — unit detail + snapshot timeline test

---

## Dimension Coverage

| Dimension | Status | Notes |
|-----------|--------|-------|
| D1: Unit tests | ⬜ | NestJS service + controller tests |
| D2: Integration tests | ⬜ | Prisma schema push validation |
| D3: API contract tests | ⬜ | Endpoint auth + response shape |
| D4: UI rendering tests | ⬜ | Qualification + unit detail pages |
| D5: Security tests | ⬜ | Auth guards on all new endpoints |
| D6: Business logic tests | ⬜ | Auto-archive transaction, snapshot ordering |
| D7: Data integrity tests | ⬜ | TasDocumentUnit junction, soft deletes |
| D8: Validation architecture | ⬜ | This document |
