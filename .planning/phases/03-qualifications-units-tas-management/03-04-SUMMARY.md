# Plan 03-04 Summary — Qualification & Unit Detail Pages

## Status: Complete (pending human visual verification)

## What was built

### New routes
- `apps/web/app/(dashboard)/rto/[id]/qualifications/[qualId]/page.tsx` — server component wrapping `QualificationDetail`
- `apps/web/app/(dashboard)/rto/[id]/units/[unitId]/page.tsx` — server component wrapping `UnitDetail`

### New components
- `apps/web/components/qualifications/QualificationDetail.tsx` — Full qualification detail view: breadcrumb, title/code/status badge, superseded indicator, units table (clickable rows → unit detail), TAS documents section (TasVersionList + TasUploadForm), trainers placeholder, documents placeholder
- `apps/web/components/units/UnitDetail.tsx` — Unit detail view: breadcrumb, title/code/status, elements & performance criteria table (ordered by element_num/pc_num)
- `apps/web/components/units/UnitSnapshotTimeline.tsx` — Collapsible snapshot history; single-open accordion; defensive rendering if snapshot_data malformed

### Modified
- `apps/web/components/qualifications/QualificationsTab.tsx` — Added row click navigation to `/rto/${rtoId}/qualifications/${qual.id}`; ChevronRight icon in 5th column

### Build verification
- `npx tsc --noEmit` — clean
- `pnpm --filter @trainsmart/web build` — clean; all 7 routes compiled

## Human checkpoint required
Task 4 requires manual visual verification:
1. Start dev servers: `pnpm dev`
2. Navigate to any RTO → Qualifications tab → click a qualification row
3. Verify detail page loads with units table and TAS section
4. Click a unit row from the qualification detail page
5. Verify unit detail loads with elements and performance criteria
6. Verify snapshot timeline collapses/expands correctly
