---
plan: 01-03
status: complete
completed: 2026-05-18
---

# Plan 01-03 Summary: Next.js Frontend Shell

## What was built

- Next.js 15 app at `apps/web` on port 3000
- Dark sidebar layout + light content area
- Login page (email/password, Zod validation)
- RTO dashboard with responsive card grid
- RTO card with Status Pending badge, alerts/validations counts, DASH-04/05/06 placeholder rows
- Add RTO dialog with form validation
- Token stored in memory (never localStorage) — XSS safe
- Silent refresh on 401 via httpOnly cookie

## Deviations

- Used plain Tailwind CSS instead of shadcn/ui components (shadcn init skipped to avoid conflicts with Tailwind v4 setup)
- Tab navigation changed from `<a>` to Next.js `<Link>` to prevent full page reloads clearing in-memory token
- Empty optional form fields stripped before POST to avoid API validation errors on empty strings
