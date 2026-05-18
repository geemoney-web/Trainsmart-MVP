---
plan: 01-04
status: complete
completed: 2026-05-18
---

# Plan 01-04 Summary: Workspace Routes + Human Verify

## What was built

- RTO workspace tab routes: `/rto/[id]/[tab]` for all 8 tabs
- `/rto/[id]` redirects to `/rto/[id]/qualifications`
- Invalid tab segment returns 404
- Next.js middleware auth gate (checks refresh_token cookie)
- RTO workspace header with back link, RTO name, ASQA badge
- Seed script confirmed idempotent

## Human Verification Results

**SC-1 ✓** Login → dashboard shows empty state → "Status Pending" badge visible on created RTO
**SC-2 ✓** Add RTO dialog → RTO created and appears on dashboard card grid
**SC-3 ✓** All 8 tabs navigate correctly with "— Coming Soon" stub copy; no logout on tab switch

## Deviations

- Tab links changed from `<a>` to `<Link>` during verification (logout-on-tab-switch bug)
- Refresh token strategy reads from httpOnly cookie instead of Bearer header
