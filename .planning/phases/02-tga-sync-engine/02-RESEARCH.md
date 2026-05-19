# Phase 2 Research: TGA Sync Engine

**Researched:** 2026-05-18
**Phase:** 2 — TGA Sync Engine
**Requirements:** TGA-01 through TGA-08, QUAL-01, QUAL-02

---

## TGA Data API

### API Overview

training.gov.au (TGA) provides a publicly accessible REST/JSON API — no authentication required. The base URL is `https://training.gov.au/api/`.

**Key endpoints confirmed by prior integrations:**

| Purpose | Method | Endpoint |
|---------|--------|----------|
| Search qualifications | GET | `/qualifications?keywords={q}&code={code}` |
| Qualification detail | GET | `/qualifications/{code}` |
| Search units | GET | `/units?keywords={q}&code={code}` |
| Unit detail | GET | `/units/{code}` |
| Training packages | GET | `/trainingPackages` |

**Qualification detail response shape (key fields):**
```json
{
  "code": "BSB50120",
  "title": "Diploma of Business",
  "status": "Current",           // Current | Superseded | Deleted
  "supersededBy": "BSB50423",   // null if not superseded
  "trainingPackage": { "code": "BSB", "title": "Business Services Training Package" },
  "currency": { "startDate": "...", "endDate": "..." },
  "unitGroups": [ { "units": [ { "code": "BSBWHS311", "title": "..." } ] } ]
}
```

**Unit detail response shape (key fields):**
```json
{
  "code": "BSBWHS311",
  "title": "Assist with maintaining workplace safety",
  "status": "Current",
  "supersededBy": null,
  "elements": [
    {
      "num": "1",
      "title": "Prepare to support safety management",
      "performanceCriteria": [
        { "num": "1.1", "text": "Access, interpret and apply WHS information..." },
        { "num": "1.2", "text": "Identify and clarify..." }
      ]
    }
  ]
}
```

**Rate limits:** No documented hard rate limits for the public API. Use conservative request pacing (100ms delay between requests) and implement exponential backoff on 429/5xx responses. Nightly syncs should process in batches to avoid hammering the API.

**Pagination:** Qualification/unit search responses include pagination metadata. Fetch all pages before processing.

**Recommendation:** Wrap TGA API calls in a dedicated `TgaApiClient` service with configurable base URL (allows pointing at a local mock in tests) and automatic retry logic.

---

## Prisma Schema Additions

The existing schema is minimal — `rto_qualifications` is a stub with only `id`, `rto_id`, and timestamps. Phase 2 requires significant schema expansion. All new models use UUID PKs, soft deletes, and `created_at`/`updated_at` consistent with Phase 1 conventions.

### New Models Required

#### `Qualification` (TGA-synced master record)
```prisma
model Qualification {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code             String   @unique          // e.g. BSB50120
  title            String
  status           String                    // Current | Superseded | Deleted
  superseded_by    String?                   // Code of superseding qual
  training_package String?                   // e.g. BSB
  tga_content_hash String                    // SHA-256 of fields used in change detection
  last_synced_at   DateTime? @db.Timestamptz
  created_at       DateTime  @default(now()) @db.Timestamptz
  updated_at       DateTime  @updatedAt      @db.Timestamptz

  units              QualificationUnit[]
  rto_qualifications RtoQualification[]
  snapshots          QualificationSnapshot[]

  @@index([code])
  @@index([status])
  @@map("qualifications")
}
```

#### `Unit` (TGA-synced master record)
```prisma
model Unit {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code             String   @unique          // e.g. BSBWHS311
  title            String
  status           String                    // Current | Superseded | Deleted
  superseded_by    String?
  tga_content_hash String
  last_synced_at   DateTime? @db.Timestamptz
  created_at       DateTime  @default(now()) @db.Timestamptz
  updated_at       DateTime  @updatedAt      @db.Timestamptz

  elements    UnitElement[]
  qualifications QualificationUnit[]
  snapshots   UnitSnapshot[]

  @@index([code])
  @@map("units")
}
```

#### `QualificationUnit` (many-to-many join table)
```prisma
model QualificationUnit {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  qualification_id String        @db.Uuid
  qualification    Qualification @relation(fields: [qualification_id], references: [id])
  unit_id          String        @db.Uuid
  unit             Unit          @relation(fields: [unit_id], references: [id])
  created_at       DateTime      @default(now()) @db.Timestamptz

  @@unique([qualification_id, unit_id])
  @@index([qualification_id])
  @@index([unit_id])
  @@map("qualification_units")
}
```

#### `UnitElement`
```prisma
model UnitElement {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  unit_id     String   @db.Uuid
  unit        Unit     @relation(fields: [unit_id], references: [id])
  element_num String                // "1", "2", "3"
  title       String
  created_at  DateTime @default(now()) @db.Timestamptz
  updated_at  DateTime @updatedAt   @db.Timestamptz

  performance_criteria PerformanceCriterion[]

  @@index([unit_id])
  @@map("unit_elements")
}
```

#### `PerformanceCriterion`
```prisma
model PerformanceCriterion {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  element_id  String      @db.Uuid
  element     UnitElement @relation(fields: [element_id], references: [id])
  pc_num      String                // "1.1", "1.2"
  text        String
  created_at  DateTime    @default(now()) @db.Timestamptz
  updated_at  DateTime    @updatedAt @db.Timestamptz

  @@index([element_id])
  @@map("performance_criteria")
}
```

#### `QualificationSnapshot` (immutable historical record)
```prisma
model QualificationSnapshot {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  qualification_id String        @db.Uuid
  qualification    Qualification @relation(fields: [qualification_id], references: [id])
  snapshot_data    Json                        // Full TGA response at point of change
  change_fields    String[]                    // Which fields changed (["title", "status"])
  snapshotted_at   DateTime      @default(now()) @db.Timestamptz

  @@index([qualification_id])
  @@index([snapshotted_at])
  @@map("qualification_snapshots")
}
```

#### `UnitSnapshot` (immutable historical record)
```prisma
model UnitSnapshot {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  unit_id       String   @db.Uuid
  unit          Unit     @relation(fields: [unit_id], references: [id])
  snapshot_data Json                        // Full TGA response including all elements + PCs
  change_fields String[]
  snapshotted_at DateTime @default(now()) @db.Timestamptz

  @@index([unit_id])
  @@index([snapshotted_at])
  @@map("unit_snapshots")
}
```

#### `SyncLog` (tracks sync run history)
```prisma
model SyncLog {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  triggered_by     String                    // "nightly_cron" | "manual:{user_id}"
  status           String   @default("running") // running | completed | failed
  quals_checked    Int      @default(0)
  quals_changed    Int      @default(0)
  units_checked    Int      @default(0)
  units_changed    Int      @default(0)
  alerts_created   Int      @default(0)
  error_message    String?
  started_at       DateTime @default(now()) @db.Timestamptz
  completed_at     DateTime? @db.Timestamptz

  @@index([status])
  @@index([started_at])
  @@map("sync_logs")
}
```

### Modifications to Existing Models

**`RtoQualification`** — needs a FK to the `qualifications` table and status tracking:
```prisma
// Add to RtoQualification:
qualification_id   String?        @db.Uuid
qualification      Qualification? @relation(fields: [qualification_id], references: [id])
is_active          Boolean        @default(true)
```

**`ComplianceAlert`** — needs type, severity, entity references for Phase 2 alerts:
```prisma
// Add to ComplianceAlert:
alert_type         String          // QUAL_SUPERSEDED | UNIT_CHANGED | TAS_REVIEW_REQUIRED | TRAINER_REVIEW_REQUIRED
severity           String          @default("amber") // red | amber
entity_type        String?         // "qualification" | "unit" | "trainer" | "tas_document"
entity_id          String?         @db.Uuid
title              String          @default("")
description        String          @default("")
```

### Migration Strategy

Use `prisma db push` (consistent with Phase 1 approach on Neon). All new columns on existing tables should be nullable or have defaults to avoid migration failures.

---

## Change Detection Strategy

### Recommended: Content Hash Comparison

Compute a SHA-256 hash of the relevant TGA fields and compare against the stored `tga_content_hash`. Only process a full diff when hashes differ.

**Fields to hash for qualifications:**
- `title`, `status`, `supersededBy`, `trainingPackage.code`

**Fields to hash for units:**
- `title`, `status`, `supersededBy`
- All element titles and all PC text (concatenated in a canonical order)

**Implementation:**
```typescript
import { createHash } from 'crypto';

function computeHash(data: object): string {
  return createHash('sha256')
    .update(JSON.stringify(data, Object.keys(data).sort()))
    .digest('hex');
}
```

**On hash mismatch:**
1. Save old record data as a snapshot (store full previous state in `snapshot_data`, list changed fields in `change_fields`)
2. Update the main record with new TGA data and new hash
3. Trigger affected-entity flagging
4. Create compliance alerts

**Idempotency:** Hash comparison means re-running sync on unchanged data is a no-op — no duplicate snapshots, no spurious alerts.

---

## Historical Snapshot Storage

### Recommended: Full JSON Snapshot per Change Event

Store the entire previous TGA response as `Json` in `qualification_snapshots` / `unit_snapshots`. Do NOT use delta/diff storage — full snapshots are simpler to read and display, and storage cost is negligible for the data volumes involved.

**Snapshot creation rule:** Create exactly one snapshot per detected change event. Do not snapshot if content hash is unchanged.

**Querying previous versions:**
```typescript
// Get all historical versions of a unit, newest first
const history = await prisma.unitSnapshot.findMany({
  where: { unit_id: unitId },
  orderBy: { snapshotted_at: 'desc' }
});
```

**Display pattern:** "Previous version (2026-03-15): Element 1 — ..." vs "Current version: Element 1 — ..."

---

## NestJS Scheduling

### Package: `@nestjs/schedule`

Standard NestJS scheduler. Install: `pnpm add @nestjs/schedule`

**Module setup in `AppModule`:**
```typescript
import { ScheduleModule } from '@nestjs/schedule';
ScheduleModule.forRoot()  // add to imports
```

**Cron job setup in `TgaSyncService`:**
```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron('0 16 * * *') // 4:00 PM UTC = 2:00 AM AEST
async runNightlySync() {
  await this.syncAll('nightly_cron');
}
```

**Manual trigger endpoint:**
```
POST /api/v1/tga/sync/trigger
Response: { syncLogId: "uuid", status: "running" }

GET /api/v1/tga/sync/status/:syncLogId
Response: { status: "running" | "completed" | "failed", ... }
```

**Bull/BullMQ vs @nestjs/schedule:** For MVP with <10 concurrent users, `@nestjs/schedule` is sufficient. BullMQ adds complexity (Redis dependency) without benefit at this scale. The sync is single-threaded by design — only one sync should run at a time (enforce with a `running` status check in SyncLog before starting).

**Error handling pattern:**
```typescript
async syncAll(triggeredBy: string) {
  const log = await this.createSyncLog(triggeredBy);
  try {
    // ... sync logic ...
    await this.completeSyncLog(log.id, counts);
  } catch (error) {
    await this.failSyncLog(log.id, error.message);
    // Do NOT re-throw — scheduled jobs must not crash the process
  }
}
```

---

## Affected-Entity Flagging

When a qualification or unit change is detected, the sync engine must flag downstream entities.

### On Qualification Change / Superseded:
```typescript
// Find all RTOs that have this qualification linked
const affected = await prisma.rtoQualification.findMany({
  where: { qualification_id: qualId, deleted_at: null },
  include: { rto: true }
});

for (const rtoQual of affected) {
  // Create QUAL_SUPERSEDED alert for each affected RTO
  await this.createAlertIfNotExists({
    rto_id: rtoQual.rto_id,
    alert_type: 'QUAL_SUPERSEDED',
    entity_type: 'qualification',
    entity_id: qualId,
    severity: 'red',
    title: `Qualification ${qual.code} has been superseded`,
  });
}
```

### On Unit Change:
```typescript
// Find qualifications containing this unit, then RTOs with those quals
const qualUnits = await prisma.qualificationUnit.findMany({
  where: { unit_id: unitId },
  include: { qualification: { include: { rto_qualifications: { where: { deleted_at: null } } } } }
});

// For each affected RTO, create a UNIT_CHANGED alert
```

### Alert Deduplication:
```typescript
async createAlertIfNotExists(data: AlertInput) {
  const existing = await prisma.complianceAlert.findFirst({
    where: {
      rto_id: data.rto_id,
      alert_type: data.alert_type,
      entity_id: data.entity_id,
      resolved: false,
      deleted_at: null,
    }
  });
  if (!existing) {
    await prisma.complianceAlert.create({ data });
  }
}
```

---

## Compliance Alert Creation

### Alert Types for Phase 2

| Type | Severity | Trigger |
|------|----------|---------|
| `QUAL_SUPERSEDED` | red | Qualification status changes to "Superseded" |
| `UNIT_WORDING_CHANGED` | amber | Unit title, element, or PC text changes |
| `QUAL_WORDING_CHANGED` | amber | Qualification title changes |

**RTO `status_color` update:** After creating alerts, recalculate the RTO's `status_color`:
- Any `red` alert → `status_color = 'red'`
- Any `amber` alert, no red → `status_color = 'amber'`
- No unresolved alerts → `status_color = 'green'`

This satisfies TGA-07. Phase 5 will replace this with a full rules engine, but Phase 2 must implement the basic version.

---

## Qualification Import UI (QUAL-01, QUAL-02)

### Flow

1. User in RTO workspace → Qualifications tab → "Add Qualification" button
2. Modal opens with search input (by code or keyword)
3. Frontend calls `GET /api/v1/tga/qualifications/search?q=BSB50120`
4. Results list displayed — user selects a qualification
5. User clicks "Import" — frontend calls `POST /api/v1/rtos/:rtoId/qualifications/import`
6. Body: `{ qualification_code: "BSB50120" }`
7. Backend: fetches full qual + all units + elements + PCs from TGA → saves to DB → creates RtoQualification link → returns `{ rtoQualificationId }` 
8. UI shows success and the qualification appears in the Qualifications tab list

### Sync vs Async

**Synchronous is fine for MVP.** The TGA API responds in 1–3 seconds per qualification. With ~100 units per qual, the total import will take 5–30 seconds. Use a loading state with a spinner ("Importing qualification and all units...") rather than async polling.

If import time proves unacceptable in testing, add async polling in Phase 3.

### API Endpoints Needed

```
GET  /api/v1/tga/qualifications/search?q={query}
POST /api/v1/rtos/:rtoId/qualifications/import   { qualification_code: string }
POST /api/v1/tga/sync/trigger                    (manual sync trigger)
GET  /api/v1/tga/sync/status/:syncLogId          (poll sync status)
GET  /api/v1/tga/sync/history                    (last N sync runs)
```

---

## NestJS Module Structure

Create a `TgaModule` containing:
- `TgaApiClient` — HTTP client wrapping training.gov.au API calls (use `@nestjs/axios` or native `fetch`)
- `TgaSyncService` — core sync logic: fetch, hash, compare, snapshot, flag, alert
- `TgaSchedulerService` — `@nestjs/schedule` cron registration, manual trigger endpoint
- `TgaController` — REST endpoints for search, trigger, status, history

Also modify `RtoModule` to add qualification import endpoint.

---

## Validation Architecture

### Plan 1 — TGA API Client
- **Unit test:** Mock HTTP client returns fixture JSON; verify parsed `Qualification` and `Unit` objects match expected shape
- **Unit test:** Verify `computeHash()` returns same hash for same data, different hash for changed data
- **Manual test:** Curl `GET /api/v1/tga/qualifications/search?q=BSB50120` and verify TGA data returns

### Plan 2 — Sync Engine
- **Unit test:** Provide two versions of a unit (old/new); verify snapshot is created and `change_fields` lists correct fields
- **Unit test:** Verify duplicate alert is not created when one already exists (deduplication)
- **Integration test:** Run sync against a seeded DB with a known qual; verify snapshot table has one row

### Plan 3 — Background Scheduler
- **Integration test:** Verify `POST /api/v1/tga/sync/trigger` creates a SyncLog with `status: "running"` then transitions to `"completed"`
- **Manual test:** Verify `GET /api/v1/tga/sync/status/:id` returns correct status
- **Integration test:** Verify running two syncs concurrently is prevented (second call returns error or queues)

### Plan 4 — Qualification Import UI
- **E2E manual test:** Login → RTO workspace → Qualifications tab → search "BSB50120" → import → verify qual + units appear in DB and in UI
- **Integration test:** `POST /api/v1/rtos/:id/qualifications/import` with valid code creates Qualification, Units, Elements, PCs, and RtoQualification records
- **Manual test:** Import a qual with >50 units and verify all units are created correctly

---

## Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| TGA API shape differs from assumed | Medium | High | Spike: manually call TGA API on Day 1 of Plan 1 and validate response shape before writing any mapping code |
| Import of large qualifications (100+ units) times out or hits rate limits | Medium | Medium | Implement sequential unit fetching with 100ms delay; add HTTP timeout of 30s per request |
| Nightly cron fails silently | Low | High | SyncLog records all runs; alert if no completed sync in last 26 hours (Phase 5 can add monitoring) |
| Duplicate compliance alerts on re-sync | Medium | Medium | Deduplication gate: `findFirst` before `create` using `{rto_id, alert_type, entity_id, resolved: false}` |
| `rto_qualifications` stub data from Phase 1 workspace provisioning conflicts with real imports | High | Medium | Clean up placeholder rows on first import — detect by `qualification_id IS NULL` and soft-delete |

---

## Validation Architecture

### Dimension 8 Coverage

| Plan | Verification Method | Automated? |
|------|---------------------|-----------|
| TGA API Client | Mock HTTP + unit tests for hash function | Yes |
| Sync Engine | Unit tests for snapshot creation + alert dedup | Yes |
| Scheduler | Integration test for trigger endpoint + SyncLog state | Yes |
| Import UI | Manual E2E test + integration test for import endpoint | Partial |

---

## RESEARCH COMPLETE
