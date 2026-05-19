---
plan: 02-01
status: complete
completed: 2026-05-18
---

# Plan 02-01 Summary: TGA API Client + Prisma Schema

## What was built

### Created files
- `apps/api/src/tga/dto/tga-qualification.dto.ts` — TypeScript interfaces for qualification search results and detail
- `apps/api/src/tga/dto/tga-unit.dto.ts` — TypeScript interfaces for unit search results and detail
- `apps/api/src/tga/tga-api.client.ts` — Injectable NestJS service wrapping the TGA National Register API
- `apps/api/src/tga/tga.module.ts` — NestJS module providing and exporting TgaApiClient
- `apps/api/scripts/test-tga-api.ts` — Smoke test script

### Modified files
- `packages/database/prisma/schema.prisma` — Added 8 new models + expanded 2 existing models
- `apps/api/src/app.module.ts` — Added TgaModule to imports

## Database

### Tables created (8 new)
- `qualifications` — TGA-synced qualification records with content hash and last-synced timestamp
- `units` — TGA-synced unit records with content hash and last-synced timestamp
- `qualification_units` — Many-to-many join table (qualification ↔ unit), unique constraint on pair
- `unit_elements` — Numbered elements within a unit
- `performance_criteria` — Performance criteria within an element
- `qualification_snapshots` — Immutable historical snapshots of qualification data
- `unit_snapshots` — Immutable historical snapshots of unit data
- `sync_logs` — Sync run audit trail with counts and status

### Existing tables modified
- `rto_qualifications` — Added `qualification_id` (FK to qualifications), `is_active` (bool)
- `compliance_alerts` — Added `alert_type`, `severity`, `entity_type`, `entity_id`, `title`, `description`

### Push result
`npx prisma db push` succeeded: "Your database is now in sync with your Prisma schema. Done in 20.93s"
Neon DB: `ep-lively-sun-aqxww5hg.c-8.us-east-1.aws.neon.tech`
`npx prisma generate` succeeded (required manual deletion of locked DLL on Windows/OneDrive).
`npx tsc` (packages/database) — clean, no errors.

## TGA API Smoke Test

```
Testing qualification search...
Search results count: 5

Testing qualification detail...
Qual code: BSB50120
Qual title: Diploma of Business
Qual status: current
Unit count: 99

Testing unit detail for: BSBAUD411
Unit code: BSBAUD411
Element count: 6
First element PCs: 6
```

All assertions passed. The smoke test confirms:
- Qualification detail fetch works and returns accurate data
- Unit grid fetch returns all 99 units for BSB50120
- Unit detail fetch works including element/PC extraction from HTML content bundle

## Deviations

### API endpoint discovery required

The plan specified `BASE_URL = 'https://training.gov.au/api'` with endpoints `/qualifications?keywords={q}` and `/qualifications/{code}` — these all returned 404.

**Investigation:** Fetched and analysed the TGA Nuxt3 frontend JS bundles (~1.8MB) to discover the actual API routes.

**Actual TGA API endpoints:**
| Operation | Endpoint |
|---|---|
| Search (prefix match on TP codes) | `GET /api/search/training/preview?query={q}` |
| Qualification/unit detail | `GET /api/training/{code}` |
| Units for a qualification | `GET /api/training/{code}/releases/{releaseId}/unitgrid` |
| Unit elements/PCs (HTML) | `GET /api/content/bundle/{bundleId}` → parse type `0118` HTML |

**Response shape differences:**
- `status` is not a field — instead the API returns `usageRecommendation` (`"current"`, `"superseded"`, etc.)
- `trainingPackage` is not a field — it's `parent: { code, title }` (the parent training package)
- `unitGroups` does not exist — units come from the `/unitgrid` endpoint as a numbered object `{ "0": {...}, "1": {...} }`
- `elements` and `performanceCriteria` are not structured JSON — they are inside HTML table content (content type `0118`) in a content bundle. Extracted via regex HTML parsing.
- Search results include training package names (e.g. "BSB Business Services") not individual qualifications — TGA search is a prefix match on TP codes, not a full-text search across individual quals/units.

**Client updated** to map all of these correctly. All DTOs preserved their interface shapes so downstream consumers are unaffected.

### Prisma generate — Windows file lock (OneDrive)

`npx prisma generate` failed twice with `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp* -> query_engine-windows.dll.node`. The existing DLL was locked by a running Node process (likely the NestJS dev server). Fixed by manually deleting the existing DLL and temp files before re-running generate. This is a Windows/OneDrive environment issue, not a schema issue.
