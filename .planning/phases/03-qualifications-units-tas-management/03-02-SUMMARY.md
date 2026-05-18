---
phase: 03-qualifications-units-tas-management
plan: "02"
subsystem: api
tags: [api, nestjs, qualification, unit, snapshot, tdd]
dependency_graph:
  requires: ["03-01"]
  provides: ["GET /qualifications/:qualId", "GET /units/:unitId"]
  affects: ["apps/api/src/app.module.ts", "Phase 04 frontend detail pages"]
tech_stack:
  added: []
  patterns: ["NestJS module/controller/service split", "TDD RED-GREEN", "Prisma nested include with orderBy"]
key_files:
  created:
    - apps/api/src/qualification/qualification.controller.ts
    - apps/api/src/qualification/qualification.service.ts
    - apps/api/src/qualification/qualification.module.ts
    - apps/api/src/qualification/__tests__/qualification.controller.spec.ts
    - apps/api/src/unit/unit.controller.ts
    - apps/api/src/unit/unit.service.ts
    - apps/api/src/unit/unit.module.ts
    - apps/api/src/unit/__tests__/unit.controller.spec.ts
  modified:
    - apps/api/src/app.module.ts
decisions:
  - "QualificationService fetches tasDocuments in a separate prisma.tasDocument.findMany call (not nested include) due to the soft-delete filter requirement — a nested include with a where clause on deleted_at is supported by Prisma but a separate call is cleaner and matches the plan spec"
  - "Both controllers follow the tga.controller.ts error pattern: log error, rethrow err.status HttpExceptions, wrap unknowns in InternalServerErrorException"
  - "No @Public() decorator on either controller — global AccessTokenGuard from AuthModule protects routes by default"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-19"
  tasks_completed: 3
  files_created: 8
  files_modified: 1
---

# Phase 03 Plan 02: Qualification and Unit Detail API Endpoints Summary

Two new NestJS modules — QualificationModule and UnitModule — providing authenticated REST endpoints for qualification and unit detail with nested relational data, including unit historical snapshots.

## Endpoints Delivered

### GET /qualifications/:qualId

Returns a qualification record with its linked units (via join table) and TAS documents (filtered to non-deleted rows).

**Response shape:**
```json
{
  "id": "uuid",
  "code": "BSB50120",
  "title": "Diploma of Business",
  "status": "Current",
  "superseded_by": null,
  "training_package": "BSB",
  "tga_content_hash": "...",
  "last_synced_at": "2025-01-01T00:00:00.000Z",
  "created_at": "...",
  "updated_at": "...",
  "units": [
    {
      "id": "uuid",
      "qualification_id": "uuid",
      "unit_id": "uuid",
      "is_core": true,
      "created_at": "...",
      "unit": {
        "id": "uuid",
        "code": "BSBWHS311",
        "title": "Assist with maintaining workplace safety",
        "status": "Current",
        "superseded_by": null
      }
    }
  ],
  "tasDocuments": [
    {
      "id": "uuid",
      "rto_id": "uuid",
      "qualification_id": "uuid",
      "uploaded_by_id": null,
      "version_label": "v1.0",
      "status": "Current",
      "file_key": "files/tas1.pdf",
      "file_name": "TAS_v1.pdf",
      "file_size": 1024,
      "review_date": null,
      "created_at": "...",
      "updated_at": "...",
      "deleted_at": null
    }
  ]
}
```

**Error responses:**
- `404 Not Found` — `{ "message": "Qualification not found", "statusCode": 404, "error": "Not Found" }` when qualId does not exist
- `401 Unauthorized` — when no valid JWT bearer token provided (global AccessTokenGuard)
- `500 Internal Server Error` — on unexpected Prisma or runtime errors

**Key implementation details:**
- `units` array comes from the `QualificationUnit` join table, ordered by `created_at: 'asc'`; each entry includes a `unit` sub-object with 5 selected fields (id, code, title, status, superseded_by)
- `tasDocuments` is fetched in a **separate** `prisma.tasDocument.findMany` call filtered by `qualification_id` and `deleted_at: null`, ordered by `created_at: 'desc'`

### GET /units/:unitId

Returns a unit record with its elements (containing performance criteria) and historical snapshots.

**Response shape:**
```json
{
  "id": "uuid",
  "code": "BSBWHS311",
  "title": "Assist with maintaining workplace safety",
  "status": "Current",
  "superseded_by": null,
  "tga_content_hash": "...",
  "last_synced_at": "2025-01-01T00:00:00.000Z",
  "created_at": "...",
  "updated_at": "...",
  "elements": [
    {
      "id": "uuid",
      "unit_id": "uuid",
      "element_num": "1",
      "title": "Identify safety hazards",
      "created_at": "...",
      "updated_at": "...",
      "performance_criteria": [
        {
          "id": "uuid",
          "element_id": "uuid",
          "pc_num": "1.1",
          "text": "Hazards are identified in accordance with WHS procedures",
          "created_at": "...",
          "updated_at": "..."
        }
      ]
    }
  ],
  "snapshots": [
    {
      "id": "uuid",
      "snapshotted_at": "2025-06-01T00:00:00.000Z",
      "change_fields": ["title"],
      "snapshot_data": {
        "id": "uuid",
        "code": "BSBWHS311",
        "title": "Previous title value",
        "status": "Current",
        "superseded_by": null,
        "elements": [
          {
            "element_num": "1",
            "title": "Element title at snapshot time",
            "performance_criteria": [
              { "pc_num": "1.1", "text": "PC text at snapshot time" }
            ]
          }
        ]
      }
    }
  ]
}
```

**Error responses:**
- `404 Not Found` — `{ "message": "Unit not found", "statusCode": 404, "error": "Not Found" }` when unitId does not exist
- `401 Unauthorized` — when no valid JWT bearer token provided (global AccessTokenGuard)
- `500 Internal Server Error` — on unexpected Prisma or runtime errors

**Key implementation details:**
- `elements` ordered by `element_num: 'asc'`; each element's `performance_criteria` ordered by `pc_num: 'asc'`
- `snapshots` ordered by `snapshotted_at: 'desc'` (most recent first); fields selected: `id`, `snapshotted_at`, `change_fields`, `snapshot_data` — NOT `unit_id` (excluded from select to keep payload clean)
- `snapshot_data` is JSON — confirmed shape from `tga-sync.service.ts`: `{ id, code, title, status, superseded_by, tga_content_hash, last_synced_at, created_at, updated_at, elements: [{ element_num, title, performance_criteria: [{ pc_num, text }] }] }`. Snake_case field names throughout.

## snapshot_data Field Shape (confirmed for Plan 04 frontend)

The `snapshot_data` JSON stored by `TgaSyncService` has this shape (snake_case, same as DB column names):

```typescript
{
  id: string;
  code: string;
  title: string;
  status: string;
  superseded_by: string | null;
  tga_content_hash: string;
  last_synced_at: string | null;  // ISO datetime string
  created_at: string;             // ISO datetime string
  updated_at: string;             // ISO datetime string
  elements: Array<{
    element_num: string;
    title: string;
    performance_criteria: Array<{
      pc_num: string;
      text: string;
    }>;
  }>;
}
```

Plan 04 frontend components can safely destructure `snapshot_data` using these snake_case keys.

## AppModule Registration

Both modules registered in `apps/api/src/app.module.ts` imports array, adjacent to `TgaModule`:

```typescript
import { QualificationModule } from './qualification/qualification.module';
import { UnitModule } from './unit/unit.module';
// ...
imports: [
  // ...
  TgaModule,
  QualificationModule,
  UnitModule,
]
```

## Test Results

| Suite | Tests | Result |
|-------|-------|--------|
| qualification.controller.spec.ts | 4 | PASS |
| unit.controller.spec.ts | 4 | PASS |
| **Total** | **8** | **PASS** |

Test coverage per spec:
- Happy path (returns service result)
- NotFoundException propagation (404 on unknown ID)
- Soft-delete filtering assertion (qualification only — unit has no soft-deleted sub-resources)
- Auth guard assertion (no @Public() decorator on controller or handler)

## Deviations from Plan

None — plan executed exactly as written.

The only implementation decision worth noting: `qualification.service.ts` uses a separate `prisma.tasDocument.findMany` for `tasDocuments` (as specified in the plan) rather than a nested Prisma include. This is intentional because it makes the soft-delete filter (`deleted_at: null`) explicit and easy to read.

## Threat Model Compliance

| Threat ID | Status |
|-----------|--------|
| T-03-02 Spoofing (GET /qualifications/:qualId) | Mitigated — no @Public() decorator, global AccessTokenGuard applies; verified in qualification.controller.spec.ts |
| T-03-03 Spoofing (GET /units/:unitId) | Mitigated — same guard inheritance; verified in unit.controller.spec.ts |
| T-03-04 Information Disclosure (qualification include block) | Accepted — qualification/unit data is publicly available from training.gov.au; no PII returned |
| T-03-05 Tampering (URL params) | Mitigated — Prisma findUnique with UUID param returns null for invalid UUIDs, leading to NotFoundException |

## Self-Check: PASSED

All created files confirmed to exist:
- apps/api/src/qualification/qualification.controller.ts - FOUND
- apps/api/src/qualification/qualification.service.ts - FOUND
- apps/api/src/qualification/qualification.module.ts - FOUND
- apps/api/src/qualification/__tests__/qualification.controller.spec.ts - FOUND
- apps/api/src/unit/unit.controller.ts - FOUND
- apps/api/src/unit/unit.service.ts - FOUND
- apps/api/src/unit/unit.module.ts - FOUND
- apps/api/src/unit/__tests__/unit.controller.spec.ts - FOUND
- apps/api/src/app.module.ts (modified) - FOUND

Build: `pnpm run build` in apps/api — PASS (no TypeScript errors)
Tests: 8/8 passing — PASS
