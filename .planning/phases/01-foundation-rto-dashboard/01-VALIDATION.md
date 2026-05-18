---
phase: 1
slug: foundation-rto-dashboard
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (NestJS/API) + Vitest (Next.js/Web) |
| **Config file** | `apps/api/jest.config.ts` / `apps/web/vitest.config.ts` (Wave 0 creates) |
| **Quick run command** | `pnpm test --filter api -- --testPathPattern=rto` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --filter api -- --testPathPattern=rto`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | RTO-01 | — | N/A | schema | `pnpm prisma validate` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | RTO-02 | — | N/A | schema | `pnpm prisma validate` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | RTO-01 | T-1-01 | Auth guard rejects unauthenticated requests | unit | `pnpm test --filter api -- auth` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | RTO-02 | — | N/A | integration | `pnpm test --filter api -- rto` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | DASH-01..06, RTO-01, RTO-03 | T-03-01 | XSS-safe token storage; no localStorage | typecheck+build | `pnpm --filter @trainsmart/web exec tsc --noEmit` | ✅ | ⬜ pending |
| 1-03-02 | 03 | 2 | DASH-01, DASH-04..06, RTO-01 | T-03-06 | Status badge hidden until Phase 5 (D-09) | typecheck+build+grep | `pnpm --filter @trainsmart/web build` (plus PowerShell Select-String gates for Status Pending, superseded qualifications, no localStorage) | ✅ | ⬜ pending |
| 1-04-01 | 04 | 3 | — | T-04-02 | Seed user idempotent; placeholder credentials only | seed-run | `powershell -NoProfile -Command "$out = (pnpm --filter @trainsmart/api run seed 2>&1 | Out-String); if ($out -match 'operator@trainsmart.local') { exit 0 } else { exit 1 }"` | ✅ | ⬜ pending |
| 1-04-02 | 04 | 3 | RTO-04, DASH-01 | T-04-01, T-04-03 | Auth middleware redirect; tab allow-list 404 | build+grep | PowerShell Select-String gates on NextResponse.redirect, refresh_token, 8-tab list + `pnpm --filter @trainsmart/web build` | ✅ | ⬜ pending |
| 1-04-03 | 04 | 3 | RTO-04, DASH-01..06 | — | All 3 ROADMAP SCs verified end-to-end | human-verify | Blocking checkpoint (Task 3) — gate="blocking", not auto-skippable | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

These files are created by TDD tasks within Plan 01-02 — no separate Wave 0 plan is needed. They are listed here for traceability only.

- [x] `apps/api/jest.config.ts` — Created by Plan 01-02 Task 1 (NestJS scaffold)
- [x] `apps/api/test/jest.setup.ts` — Created by Plan 01-02 Task 2 (auth TDD task)
- [x] `apps/api/test/auth.e2e-spec.ts` — Created by Plan 01-02 Task 2 (auth TDD task)
- [x] `apps/api/test/rto.e2e-spec.ts` — Created by Plan 01-02 Task 3 (RTO CRUD TDD task)
- [x] `pnpm add -D jest @nestjs/testing ts-jest` — Installed in Plan 01-02 Task 1
- [x] `pnpm add -D vitest @testing-library/react` — Installed in Plan 01-02 Task 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard cards render correctly with dark sidebar | DASH-01 | Visual layout verification | Open http://localhost:3000, log in, verify card grid and sidebar |
| RTO workspace tabs navigate correctly | RTO-04 | Client-side routing | Click each tab in workspace, verify URL changes and stub content loads |
| JWT token refresh works on expiry | D-05 | Time-dependent behavior | Set access token TTL to 5s in test, verify silent refresh occurs |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (satisfied by TDD tasks in Plan 01-02)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed
