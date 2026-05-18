---
plan: 02-04
status: awaiting-human-verification
completed: (pending Task 4 human verification)
---

# Phase 02 Plan 04: Qualification Import UI Summary

## What was built

- **TgaImportService** (`apps/api/src/tga/tga-import.service.ts`): full qualification tree import — fetches from TGA API, upserts Qualification, Units, UnitElements, PerformanceCriteria, QualificationUnit, and RtoQualification. Soft-deletes stub RtoQualification rows (null qualification_id). Rate-limited with 50ms inter-unit delays.
- **Import endpoint**: `POST /api/v1/tga/rtos/:rtoId/qualifications/import` — body: `{ qualificationCode: string }`
- **List endpoint**: `GET /api/v1/tga/rtos/:rtoId/qualifications` — returns active RtoQualifications with embedded qualification detail
- **ImportQualificationModal** (`apps/web/components/qualifications/ImportQualificationModal.tsx`): debounced TGA search (300ms), result selection, import trigger with loading state and error display
- **QualificationsTab** (`apps/web/components/qualifications/QualificationsTab.tsx`): React Query data fetching, table view of imported qualifications, status badges (current/superseded), last synced date
- **[tab]/page.tsx updated**: Qualifications tab now renders `QualificationsTab` instead of "Coming Soon"; all other tabs unchanged

## TypeScript Compilation

API (`apps/api`): PASSED — no errors  
Web (`apps/web`): PASSED — no errors

## Token Access Pattern

The frontend uses `apiFetch()` from `apps/web/lib/api.ts` — this function holds the access token in a module-level variable (`let accessToken`), automatically injects it as `Authorization: Bearer <token>` on every request, and silently refreshes via httpOnly cookie on 401. No token passing needed in component props. The three new TGA helper functions (`searchTgaQualifications`, `importTgaQualification`, `getRtoQualifications`) all delegate to `apiFetch()`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Next.js 15 async params type error**
- **Found during:** Task 3 TypeScript check
- **Issue:** `[tab]/page.tsx` and `[id]/page.tsx` used synchronous `params: { id: string; tab: string }` but Next.js 15 requires `params: Promise<{...}>` and an async component. This caused a pre-existing TypeScript error from `.next/types` generated types.
- **Fix:** Made `RtoTabPage` and `RtoIndexPage` async, typed params as `Promise<{...}>`, and awaited `params` before use.
- **Files modified:** `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx`, `apps/web/app/(dashboard)/rto/[id]/page.tsx`
- **Commit:** b553fd8

**2. [Adaptation] Used apiFetch instead of manual fetch with token param**
- **Found during:** Task 3 — reading Phase 1 auth pattern
- **Issue:** The plan specified helper functions with a `token: string` parameter and manual `Authorization` header construction. The actual codebase uses `apiFetch()` which handles auth automatically via in-memory token.
- **Fix:** Implemented `searchTgaQualifications`, `importTgaQualification`, `getRtoQualifications` as wrappers around `apiFetch()` with no token parameter. `ImportQualificationModal` and `QualificationsTab` props do not include `token`.
- **Files modified:** `apps/web/lib/api.ts`, `apps/web/components/qualifications/ImportQualificationModal.tsx`, `apps/web/components/qualifications/QualificationsTab.tsx`

**3. [Adaptation] Used QualificationsTab component instead of standalone page**
- **Found during:** Task 3 — reading actual workspace route structure
- **Issue:** The plan described a standalone `apps/web/src/app/rto/[id]/qualifications/page.tsx` but the actual workspace uses a single `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` routing pattern.
- **Fix:** Created `QualificationsTab` as a client component and rendered it conditionally inside the existing `[tab]/page.tsx`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 3b5af3b | feat(02-04): add TgaImportService for full qualification tree import |
| 2 | 63bf125 | feat(02-04): add qualification import and list endpoints to TgaController |
| 3 | b553fd8 | feat(02-04): build Qualifications page with TGA import modal |

## Awaiting Human Verification

Task 4 requires manual end-to-end testing of the import flow with both servers running.

**Steps to verify:**
1. Start API: `pnpm --filter @trainsmart/api dev` (port 3001)
2. Start web: `pnpm --filter @trainsmart/web dev` (port 3000)
3. Log in at `http://localhost:3000/login`
4. Navigate to any RTO workspace — the Qualifications tab should load (not "Coming Soon")
5. Click "+ Add Qualification" — modal should open
6. Type `BSB50120` — should see TGA search results appear after ~300ms debounce
7. Select a result and click Import — should show "Importing..." for 30-60 seconds
8. After import: modal closes, table updates with the imported qualification
9. Verify in DB: qualification, units, elements, performance criteria, and rto_qualification rows exist

See `02-04-PLAN.md` Task 4 for full verification checklist.
