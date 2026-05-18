---
plan: 02-02
status: complete
completed: 2026-05-18
---

# Plan 02-02 Summary: TGA Sync Engine

## What was built

- **TgaSyncService** (`apps/api/src/tga/tga-sync.service.ts`) — full sync engine:
  - `computeQualificationHash` and `computeUnitHash` — public methods (called by Plan 04 TgaImportService) using SHA-256 over canonical field sets
  - `syncQualification(qualCode, syncLogId)` — fetches from TGA, compares hash, creates QualificationSnapshot on change, raises `QUAL_SUPERSEDED` (red) and `QUAL_WORDING_CHANGED` (amber) alerts, updates RTO status_color
  - `syncUnit(unitCode, syncLogId)` — fetches from TGA, compares hash, creates UnitSnapshot on change, replaces UnitElements and PerformanceCriteria, raises `UNIT_WORDING_CHANGED` (amber) alerts via QualificationUnit → RtoQualification chain
  - `createAlertIfNotExists` (private) — deduplicates open alerts by rto_id + alert_type + entity_id
  - `updateRtoStatusColor` (private) — recalculates green/amber/red from all open alerts for an RTO
  - `syncAll(triggeredBy, existingSyncLogId?)` — iterates all known quals and units, 100ms delay between calls, updates SyncLog on completion or failure
  - `getRunningSync`, `startSync`, `getSyncStatus`, `getSyncHistory` — sync log helpers for Plan 03 controller

- **TgaModule updated** (`apps/api/src/tga/tga.module.ts`) — TgaSyncService added to providers and exports

- **Unit tests** (`apps/api/src/tga/__tests__/tga-sync.service.spec.ts`) — 8 tests:
  - Hash stability (same data → same hash)
  - Title sensitivity (different title → different hash)
  - Status sensitivity (different status → different hash)
  - Unit hash stability
  - PC text sensitivity
  - Element title sensitivity
  - Alert deduplication: skip create when existing unresolved alert matches
  - Alert deduplication: create when no existing alert

- **Jest configuration** (`apps/api/jest.config.js`) — ts-jest preset scoped to `src/` directory; added `@types/jest` devDependency to fix TypeScript globals in test files

## TypeScript Compilation

Clean — 0 errors (`npx tsc --noEmit` exits 0).

## Test Results

```
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Time:        ~7s
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong import path for TgaUnitDetail**
- **Found during:** Task 1 TypeScript check
- **Issue:** Plan specified `import type { TgaQualificationDetail, TgaUnitDetail } from './dto/tga-qualification.dto'` but `TgaUnitDetail` lives in `tga-unit.dto.ts`
- **Fix:** Split into two type imports from their correct files
- **Files modified:** `apps/api/src/tga/tga-sync.service.ts`

**2. [Rule 1 - Bug] Implicit any in computeUnitHash arrow functions**
- **Found during:** Task 1 TypeScript check (noImplicitAny is enabled)
- **Issue:** Arrow function parameters in `computeUnitHash` lacked explicit types
- **Fix:** Added inline type annotations on element and pc parameters
- **Files modified:** `apps/api/src/tga/tga-sync.service.ts`

**3. [Rule 3 - Blocking] Jest not configured for TypeScript source files**
- **Found during:** Task 2 test run
- **Issue:** No `jest.config.js` existed; jest used Babel (no TS support) and ran both `src/` and `dist/` files. The `src/` TypeScript specs failed with a Babel parse error on TS type annotations.
- **Fix:** Created `jest.config.js` with ts-jest preset scoped to `src/`; installed `@types/jest` devDependency for jest globals
- **Files modified:** `apps/api/jest.config.js`, `apps/api/package.json`, `pnpm-lock.yaml`

## Schema Notes

Key schema field names used (differ from plan pseudo-code):
- `UnitElement`: uses `element_num` (not `num`) for the element number field
- `PerformanceCriterion`: uses `pc_num` (not `num`) and `text`
- `ComplianceAlert.entity_id` is `@db.Uuid` — the service correctly passes the Qualification/Unit UUID (not the code string)

## Self-Check

- [x] `apps/api/src/tga/tga-sync.service.ts` — created
- [x] `apps/api/src/tga/tga.module.ts` — updated
- [x] `apps/api/src/tga/__tests__/tga-sync.service.spec.ts` — created
- [x] `apps/api/jest.config.js` — created
- [x] Commits: `12e80cf` (feat), `3463503` (test)
- [x] TypeScript: 0 errors
- [x] Tests: 8/8 passed
