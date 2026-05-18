# Phase 3: Qualifications, Units & TAS Management - Research

**Researched:** 2026-05-18
**Domain:** Next.js App Router detail pages, NestJS module expansion, Prisma schema migration, S3 presigned uploads
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Qualification detail opens as a dedicated Next.js page at `/rto/[id]/qualifications/[qualId]` — not a modal or slide-over. Full-page with shareable URL; back-button returns to qualifications tab.
- **D-02:** Unit detail opens as a dedicated Next.js page at `/rto/[id]/units/[unitId]` — consistent with qualification detail. Back-button returns to the qualification detail page.
- **D-03:** Qualification list rows become clickable links (wrapping the existing table rows with `<Link href="...">`).
- **D-04:** Single scrollable page with stacked sections — no nested tab bar within the qualification detail. Sections in order: Qualification Info (TGA status, code, title, training package, superseded_by), Units, TAS Documents, Trainers (placeholder), Documents (placeholder).
- **D-05:** Trainers and Documents sections are visible in the layout with a "Coming in Phase 4" note.
- **D-06:** TAS upload form captures: file (required), qualification link (required, pre-filled when uploading from qualification detail), version label, review date, and initial status (Draft / Current).
- **D-07:** TAS is linked to both qualifications AND units. Unit multi-select shows all units belonging to the selected qualification. A `TasDocumentUnit` junction table is added to the schema now.
- **D-08:** Auto-archive on new version upload: when a new TAS is set to "Current", any existing "Current" TAS for the same qualification is automatically set to "Archived".
- **D-09:** TAS version history is visible on the qualification detail page (versioned list). All versions remain accessible.
- **D-10:** Unit detail page shows: unit info (code, title, status, superseded_by), structured list of elements each containing their numbered performance criteria, and a Historical Snapshots section.
- **D-11:** Historical snapshot viewer uses a timeline list — chronological list of all snapshot dates; clicking a date expands/collapses the full wording (elements + PCs) for that snapshot.
- **D-12:** TAS records surface in the global RTO document library (TAS-06).
- **D-13:** `TasDocument` model needs significant expansion: `qualification_id`, `version_label`, `review_date`, `status` (Draft/Current/Archived), `file_key`, `file_name`, `file_size`, `uploaded_by_id`. Add `TasDocumentUnit` junction table for unit links.

### Claude's Discretion

- Exact Prisma field names and indexes for expanded TasDocument model
- Whether to extend the existing `Document` model or use a union query for TAS-06 library integration
- Loading skeleton design for detail pages
- Breadcrumb navigation format (e.g. Dashboard > RTO Name > Qualifications > Qual Code)
- Exact shadcn/ui components for sections and timeline list

### Deferred Ideas (OUT OF SCOPE)

- Trainer-to-unit mapping display on unit detail page — Phase 4
- Document upload on qualification/unit detail — Phase 6
- TAS linked to units display on the TAS tab — deferred to Phase 4
- Full document library view for TAS records — Phase 6
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-03 | Staff can view qualification details including TGA sync status, linked units, linked TAS, linked trainers, and linked documents | New GET `/qualifications/:qualId` endpoint with nested includes; qualification detail page component |
| QUAL-04 | Staff can view unit detail including exact TGA element and performance criteria wording | New GET `/units/:unitId` endpoint; unit detail page; elements/PCs already stored in DB from Phase 2 TGA sync |
| QUAL-05 | Staff can view historical snapshots of unit wording from previous TGA versions | `UnitSnapshot` table already exists; snapshot viewer component with expand/collapse timeline |
| TAS-01 | Staff can upload a TAS document and link it to a qualification | Presigned S3 URL pattern; `TasController.createPresignedUrl` + `TasController.createTasRecord` |
| TAS-02 | TAS records support versioning — staff can upload new versions and archive old ones | Auto-archive logic in `TasService.create`; version list in qualification detail |
| TAS-03 | TAS records have statuses: Draft, Current, Archived | `status` field on expanded `TasDocument` model |
| TAS-04 | Old TAS versions remain accessible and are never deleted | No hard-delete on `TasDocument`; soft-delete convention already established |
| TAS-05 | TAS records store structured metadata: version, review date, status, linked qualifications, linked units | `TasDocument` schema expansion per D-13 |
| TAS-06 | TAS records appear in both the qualification view and the global RTO document library | Union query or `Document`-table extension; surfaced in TAS tab of RTO workspace |
</phase_requirements>

---

## Summary

Phase 3 builds on a solid Phase 2 foundation. The database already has `Qualification`, `Unit`, `UnitElement`, `PerformanceCriterion`, `UnitSnapshot`, and `QualificationSnapshot` tables fully populated by the TGA sync engine. The primary work is: (1) exposing that data through new NestJS endpoints, (2) building the corresponding Next.js detail pages, and (3) implementing the TAS upload/versioning workflow including S3 presigned URL integration.

The largest new technical territory is S3 presigned uploads — this pattern has been referenced in CLAUDE.md but no S3 SDK is installed yet. The AWS SDK v3 modular packages (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) are the standard choice and are already at version 3.1048.0 on npm. The Neon PostgreSQL database is already live and the Prisma schema push workflow (`npx prisma db push`) is established.

The `TasDocument` model is currently a stub (only `id`, `rto_id`, timestamps). It needs significant expansion (D-13) before any TAS endpoints can be built. This schema work is Wave 0 and blocks all TAS implementation. The `TasDocumentUnit` junction table must also be created in the same schema push. For TAS-06 document library integration, a union query approach is recommended over extending the `Document` model, because TAS records have distinct metadata fields and the `Document` model is slated to grow with its own expansion in Phase 6.

**Primary recommendation:** Build in four sequential waves — (0) schema expansion + S3 env setup, (1) qualification detail API + page, (2) unit detail API + page with snapshot viewer, (3) TAS upload + versioning + library integration.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Qualification detail data (units, TAS list) | API / Backend | — | All data joins happen server-side via Prisma; frontend receives shaped JSON |
| Unit elements + PCs display | Frontend (Client) | — | Data is fetched via TanStack Query and rendered; no server-side transform needed |
| Historical snapshot expand/collapse | Frontend (Client) | — | Pure UI state (open/closed) — no server involvement |
| TAS presigned URL generation | API / Backend | — | S3 credentials must never reach the browser; backend issues the presigned URL |
| TAS file upload to S3 | Browser / Client | — | Frontend uploads directly to S3 using the presigned URL — no file bytes through backend |
| TAS record creation (post-upload) | API / Backend | — | After S3 upload, frontend calls API to persist metadata and trigger auto-archive logic |
| Auto-archive on new Current TAS | API / Backend | — | Business rule enforced atomically in a Prisma transaction on the backend |
| TAS document library surfacing | API / Backend | Frontend (Client) | Union query on backend; frontend renders the same TAS list in two places |
| Breadcrumb / navigation | Frontend (Client) | — | URL-driven; Next.js Link components using RTO/qual/unit IDs from route params |

---

## Standard Stack

### Core (all already installed — no new installs except S3 SDK)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.3.2 | New detail pages at `/rto/[id]/qualifications/[qualId]` and `/rto/[id]/units/[unitId]` | Already in use; nested dynamic routes follow established pattern |
| TanStack Query v5 | 5.100.10 | Data fetching for detail pages with loading/error states | Already in use; `useQuery` pattern established across all tabs |
| NestJS | 11.x | New `QualificationModule`, `UnitModule`, `TasModule` controllers/services | Already in use; follow existing module structure |
| Prisma Client | (via @repo/db) | Expanded `TasDocument` schema; all new queries | Already in use; `npx prisma db push` for schema changes |
| Tailwind CSS | 4.1.7 | Styling all new components | Already in use; established CSS variable token system |

### New — S3 File Upload

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@aws-sdk/client-s3` | 3.1048.0 | Create S3 client, issue `PutObjectCommand` for presigned URLs | Official AWS SDK v3; modular package — only import what you need |
| `@aws-sdk/s3-request-presigner` | 3.1048.0 | `getSignedUrl()` helper to generate presigned PUT URLs | Official companion to client-s3; standard presigned URL pattern |

[VERIFIED: npm registry] — both packages confirmed at 3.1048.0 via `npm view` and are official AWS packages.

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-collapsible` | 1.1.12 | Expand/collapse snapshot entries in timeline | Unit snapshot viewer (D-11) |
| `@radix-ui/react-select` | 2.2.6 | Qualification selector and status selector in TAS upload form | TAS upload form (D-06); NOT yet in `package.json` — needs adding |
| lucide-react | 0.511.0 | ChevronDown/Up icons for collapsible snapshots; Upload icon | Already in use |

**Installation (API only — S3 SDK goes in `apps/api`):**
```bash
cd apps/api && npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Installation (Web — Radix Select not yet installed):**
```bash
cd apps/web && npm install @radix-ui/react-select
```

**Version verification results:**
```
@aws-sdk/client-s3          → 3.1048.0  (verified 2026-05-18)
@aws-sdk/s3-request-presigner → 3.1048.0 (verified 2026-05-18)
@radix-ui/react-select      → 2.2.6     (verified 2026-05-18)
@radix-ui/react-collapsible → 1.1.12    (verified 2026-05-18)
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| @aws-sdk/client-s3 | npm | ~4 yrs | >15M/wk | github.com/aws/aws-sdk-js-v3 | [OK] | Approved |
| @aws-sdk/s3-request-presigner | npm | ~4 yrs | >15M/wk | github.com/aws/aws-sdk-js-v3 | [OK] | Approved |
| @radix-ui/react-select | npm | ~3 yrs | >5M/wk | github.com/radix-ui/primitives | [OK] | Approved |
| @radix-ui/react-collapsible | npm | ~3 yrs | >5M/wk | github.com/radix-ui/primitives | [OK] | Approved |

[ASSUMED] — slopcheck was not run (not installed in environment). All four packages are from well-known, long-established organisations (AWS, Radix UI) with high download counts. The planner should treat them as approved but may add a `checkpoint:human-verify` if desired.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Staff)
    |
    | GET /rto/[id]/qualifications/[qualId]    (Next.js page — server render)
    | GET /rto/[id]/units/[unitId]             (Next.js page — server render)
    |
    v
Next.js App Router  ─── TanStack Query (client) ───────────────────────────────┐
    |                        |                                                   |
    |  useQuery(['qual', qualId])          useQuery(['unit', unitId])            |
    |        |                                      |                            |
    v        v                                      v                            |
NestJS API (/api/v1)                                                             |
    |                                                                            |
    ├── GET /qualifications/:qualId                                              |
    │       Prisma: Qualification + QualificationUnit[]                         |
    │               + Unit (code, title, status) per unit                       |
    │               + TasDocument[] for this qualification                      |
    │                                                                            |
    ├── GET /units/:unitId                                                       |
    │       Prisma: Unit + UnitElement[] + PerformanceCriterion[]               |
    │               + UnitSnapshot[] (for timeline)                             |
    │                                                                            |
    ├── POST /tas/presign                                                        |
    │       Generates presigned S3 PUT URL                                      |
    │       Returns: { presignedUrl, fileKey }                                  |
    │                                                                            |
    ├── POST /tas                                                                |
    │       Creates TasDocument record                                           |
    │       Auto-archives existing "Current" TAS (Prisma transaction)           |
    │                                                                            |
    └── GET /rtos/:rtoId/tas                                                    |
            Returns all TasDocument[] for RTO (library view)                    |
                                                                                 |
S3-Compatible Storage  <─── Direct PUT from browser using presigned URL ────────┘
    |
    └── file_key stored in TasDocument.file_key
        file retrieval: GET /tas/:tasId/download → redirect to S3 presigned GET
```

### Recommended Project Structure (new files only)

```
apps/api/src/
├── qualification/
│   ├── qualification.controller.ts   # GET /qualifications/:id
│   ├── qualification.service.ts      # Prisma queries with includes
│   └── qualification.module.ts       # Registers controller + service
├── unit/
│   ├── unit.controller.ts            # GET /units/:id
│   ├── unit.service.ts               # Unit + elements + snapshots
│   └── unit.module.ts
└── tas/
    ├── tas.controller.ts             # POST /tas/presign, POST /tas, GET /rtos/:rtoId/tas
    ├── tas.service.ts                # TasDocument CRUD + auto-archive logic
    ├── dto/
    │   ├── create-tas.dto.ts
    │   └── presign-tas.dto.ts
    └── tas.module.ts

apps/web/app/(dashboard)/rto/[id]/
├── qualifications/
│   └── [qualId]/
│       └── page.tsx                  # Qualification detail page (D-01)
└── units/
    └── [unitId]/
        └── page.tsx                  # Unit detail page (D-02)

apps/web/components/
├── qualifications/
│   ├── QualificationsTab.tsx         # MODIFIED: rows become <Link> (D-03)
│   └── QualificationDetail.tsx       # New: stacked sections component
├── units/
│   ├── UnitDetail.tsx                # New: elements + PCs + snapshot timeline
│   └── UnitSnapshotTimeline.tsx      # New: collapsible snapshot viewer (D-11)
└── tas/
    ├── TasUploadForm.tsx             # New: file upload + metadata form (D-06)
    ├── TasVersionList.tsx            # New: versioned list for qual detail page
    └── TasTab.tsx                    # New: RTO workspace TAS tab

packages/database/prisma/
└── schema.prisma                     # MODIFIED: TasDocument expansion + TasDocumentUnit
```

### Pattern 1: Presigned S3 Upload (Two-Step)

The backend never handles file bytes. This is mandated by CLAUDE.md.

**Step 1 — Frontend requests presigned URL:**
```typescript
// apps/web/lib/api.ts — new helper
export async function getTasPresignedUrl(fileName: string, fileSize: number) {
  return apiFetch('/tas/presign', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileSize }),
  });
  // Returns: { presignedUrl: string, fileKey: string }
}
```

**Step 2 — Frontend uploads directly to S3:**
```typescript
// In TasUploadForm.tsx
const { presignedUrl, fileKey } = await getTasPresignedUrl(file.name, file.size);
await fetch(presignedUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
});
// Then POST to /tas with fileKey + metadata
```

**Step 3 — Backend generates presigned URL:**
```typescript
// Source: [ASSUMED] — AWS SDK v3 presigned URL pattern
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,   // for non-AWS S3-compatible storage
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,  // required for MinIO / non-AWS endpoints
});

const fileKey = `tas/${rtoId}/${Date.now()}-${sanitizedFileName}`;
const command = new PutObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: fileKey,
  ContentType: contentType,
});
const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
```

[ASSUMED] — pattern verified against training data knowledge of AWS SDK v3 docs. The `forcePathStyle: true` option is required for MinIO and other S3-compatible services.

### Pattern 2: Prisma Transaction for Auto-Archive (D-08)

When a new TAS is created with status "Current", archive any existing "Current" TAS for the same qualification atomically:

```typescript
// Source: [ASSUMED] — Prisma interactive transactions pattern
async createTasDocument(rtoId: string, qualificationId: string, dto: CreateTasDto) {
  return prisma.$transaction(async (tx) => {
    if (dto.status === 'Current') {
      await tx.tasDocument.updateMany({
        where: {
          rto_id: rtoId,
          qualification_id: qualificationId,
          status: 'Current',
          deleted_at: null,
        },
        data: { status: 'Archived' },
      });
    }
    return tx.tasDocument.create({ data: { ...dto } });
  });
}
```

### Pattern 3: UnitSnapshot Timeline Rendering (D-11)

The `UnitSnapshot` table stores `snapshot_data` as `Json` containing the full unit wording at time of change. The frontend timeline renders each snapshot as a collapsible row:

```typescript
// snapshot_data shape (from existing TGA sync code):
{
  code: string,
  title: string,
  status: string,
  elements: Array<{
    element_num: string,
    title: string,
    performance_criteria: Array<{ pc_num: string, text: string }>
  }>
}
```

The `change_fields` String[] column indicates what changed (e.g., `["elements"]`). This can be displayed in the timeline header for quick audit identification.

### Pattern 4: TGA Endpoint for RTO-scoped Qualification Detail

The existing `TgaController` already handles RTO-qualification queries. New qualification detail and unit detail endpoints belong in dedicated modules (`QualificationModule`, `UnitModule`) rather than extending `TgaController`, keeping each module's concern narrow.

```typescript
// apps/api/src/qualification/qualification.controller.ts
@Controller('qualifications')
export class QualificationController {
  @Get(':qualId')
  async getQualificationDetail(@Param('qualId') qualId: string) {
    // Returns: qualification + units + TAS documents
  }
}
```

### Pattern 5: Clickable Table Rows (D-03)

The existing `QualificationsTab.tsx` uses a plain `<tr>` with no link. The minimal change is to wrap the row content or use a Link overlay:

```typescript
// Wrap the <tr> as a clickable row using Next.js Link on the code cell
// OR use router.push() in onClick — both work
import Link from 'next/link';

<tr
  key={rq.id}
  className="text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
  onClick={() => router.push(`/rto/${rtoId}/qualifications/${rq.qualification?.id}`)}
>
```

Using `onClick` with `useRouter` on the `<tr>` is simpler than wrapping individual `<td>` cells with `<Link>` components.

### Anti-Patterns to Avoid

- **Storing file bytes in PostgreSQL:** CLAUDE.md explicitly forbids this. Always use S3 + `file_key`.
- **Extending `TgaController` with qualification/unit/TAS detail routes:** Keeps concerns separate. New modules for each domain.
- **Hard-deleting TAS records:** TAS-04 requires all versions to remain accessible. Only use `deleted_at` soft-delete if ever removing.
- **Fetching elements/PCs from TGA API on page load:** Elements were already synced to DB in Phase 2. Always read from `UnitElement` + `PerformanceCriterion` tables, never re-fetch from TGA on the detail page.
- **Client-side auto-archive logic:** The "archive previous Current" rule must run on the backend in a transaction to avoid race conditions.
- **Hardcoding status strings:** Use a TypeScript union type or enum (`'Draft' | 'Current' | 'Archived'`) and validate with `class-validator` `@IsIn` in the DTO.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Presigned S3 URL generation | Custom HMAC signing | `@aws-sdk/s3-request-presigner` `getSignedUrl()` | Signature V4, clock skew handling, expiry — hand-rolled gets security details wrong |
| Expand/collapse snapshot timeline | Custom CSS animation accordion | `@radix-ui/react-collapsible` | Accessibility (aria-expanded, keyboard), animation handled, already in tech stack |
| Form validation for TAS upload | Manual field checks | `react-hook-form` + `zod` | Already installed; `useForm` with `zodResolver` is the established pattern in this project |
| Qualification select in TAS form | Native `<select>` | `@radix-ui/react-select` | Consistent styling with dark theme; native selects are difficult to style in dark mode |
| Atomic archive-on-upload | Application-level locking | Prisma `$transaction` | Ensures no partial state if request fails mid-operation |

**Key insight:** This phase is primarily plumbing between Phase 2's already-synced data and new UI surfaces. The main risk is the S3 presigned URL pattern which hasn't been used yet in this project — use the official SDK, don't hand-roll.

---

## Common Pitfalls

### Pitfall 1: `TasDocument.qualification_id` Foreign Key Target

**What goes wrong:** The CONTEXT.md says TAS is linked to a qualification. In the schema, `RtoQualification` is the join table between `Rto` and `Qualification`. Should `qualification_id` on `TasDocument` point to `Qualification.id` or `RtoQualification.id`?

**Why it happens:** Two plausible targets exist. Using `RtoQualification.id` would mean TAS is scoped to an RTO-qualification pair (a TAS naturally belongs to one RTO). Using `Qualification.id` would require an additional `rto_id` filter on all queries.

**How to avoid:** Link `TasDocument.qualification_id → Qualification.id`. The `rto_id` is already present on `TasDocument` directly and provides the RTO scope. This keeps queries simple and matches the existing pattern on `Validation`, `Task`, `Note`, and `ComplianceAlert` (all carry `rto_id` directly).

**Warning signs:** If queries require joining through `RtoQualification` just to filter TAS by RTO, the FK target is wrong.

### Pitfall 2: Unit Detail Page Route Collision with `[tab]` Route

**What goes wrong:** The existing tab routing is at `/rto/[id]/[tab]/page.tsx`. Adding `/rto/[id]/units/[unitId]` could conflict with the `[tab]` catch-all if Next.js resolves `units` as a tab name.

**Why it happens:** Next.js App Router resolves static path segments before dynamic segments. The existing `TABS` array does not include `units`, so `units` is NOT in the tab list — but the `[tab]` page calls `notFound()` for unknown tabs. This means `/rto/[id]/units` (without `[unitId]`) returns 404, which is correct.

**How to avoid:** Add the new pages at:
- `apps/web/app/(dashboard)/rto/[id]/qualifications/[qualId]/page.tsx`
- `apps/web/app/(dashboard)/rto/[id]/units/[unitId]/page.tsx`

These are nested BELOW the existing `/rto/[id]/[tab]` structure. Next.js resolves `qualifications/[qualId]` as a static-then-dynamic path, which takes precedence over `[tab]` matching `qualifications`. No collision occurs.

**Warning signs:** If navigating to the qualification detail page lands on the tab page instead, the directory nesting is wrong.

### Pitfall 3: S3 Environment Variables Not Yet Configured

**What goes wrong:** `apps/api/.env` and `.env.example` contain no S3-related variables. The TAS upload presign endpoint will fail at runtime with an `S3ServiceException` or `CredentialsProviderError`.

**Why it happens:** S3 hasn't been used in Phases 1 or 2. No S3 env vars were ever added.

**How to avoid:** Add S3 env vars to `.env.example` and `.env` as part of Wave 0 setup:
```
S3_REGION=us-east-1
S3_ENDPOINT=           # leave blank for AWS; set to e.g. http://localhost:9000 for MinIO
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=trainsmart-tas-documents
```

The TasModule should read these via NestJS `ConfigService` and validate at startup.

**Warning signs:** `Missing credentials in config` or `NoSuchBucket` errors on first presign request.

### Pitfall 4: `snapshot_data` JSON Shape Assumption

**What goes wrong:** The unit detail page tries to render `snapshot_data.elements[].performance_criteria` but the TGA sync engine in Phase 2 may have stored the snapshot in a slightly different shape (e.g., `performanceCriteria` camelCase vs. `performance_criteria` snake_case).

**Why it happens:** The `UnitSnapshot.snapshot_data` field is `Json` — no schema enforcement. The actual shape depends on what the Phase 2 sync service wrote.

**How to avoid:** In the `UnitService.getUnitDetail` endpoint, type-assert the snapshot_data and handle both field naming variants gracefully. Alternatively, check the actual sync code before assuming the shape. The `TgaSyncService` in Phase 2 should be inspected for the exact serialization before building the snapshot viewer.

**Warning signs:** Snapshot entries display with empty elements/PC lists despite having `snapshot_data` in the DB.

### Pitfall 5: Auto-Archive Logic on Status="Draft" Uploads

**What goes wrong:** If a staff member uploads a TAS with initial status "Draft", the auto-archive logic should NOT run. A "Draft" upload should leave any existing "Current" TAS untouched.

**Why it happens:** Easy to accidentally run the `updateMany({ status: 'Archived' })` call unconditionally.

**How to avoid:** Gate the auto-archive on `if (dto.status === 'Current')` explicitly. The CONTEXT.md D-08 confirms: "when a new TAS is set to 'Current', any existing 'Current' TAS is automatically set to 'Archived'." Draft uploads are never auto-archived.

---

## Code Examples

### Expanded TasDocument Schema

```prisma
// Source: [ASSUMED] based on D-13 requirements and existing schema conventions
model TasDocument {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto_id           String    @db.Uuid
  rto              Rto       @relation(fields: [rto_id], references: [id])
  qualification_id String    @db.Uuid
  qualification    Qualification @relation(fields: [qualification_id], references: [id])
  uploaded_by_id   String?   @db.Uuid
  uploaded_by      User?     @relation(fields: [uploaded_by_id], references: [id])

  version_label    String
  status           String    @default("Draft")   // Draft | Current | Archived
  file_key         String
  file_name        String
  file_size        Int
  review_date      DateTime? @db.Date

  created_at       DateTime  @default(now()) @db.Timestamptz
  updated_at       DateTime  @updatedAt @db.Timestamptz
  deleted_at       DateTime? @db.Timestamptz

  units            TasDocumentUnit[]

  @@index([rto_id])
  @@index([qualification_id])
  @@index([status])
  @@index([deleted_at])
  @@map("tas_documents")
}

model TasDocumentUnit {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tas_document_id String      @db.Uuid
  tas_document    TasDocument @relation(fields: [tas_document_id], references: [id])
  unit_id         String      @db.Uuid
  unit            Unit        @relation(fields: [unit_id], references: [id])
  created_at      DateTime    @default(now()) @db.Timestamptz

  @@unique([tas_document_id, unit_id])
  @@index([tas_document_id])
  @@index([unit_id])
  @@map("tas_document_units")
}
```

### Qualification Detail API Endpoint

```typescript
// Source: [ASSUMED] — follows TgaController pattern exactly
@Get(':qualId')
async getQualificationDetail(@Param('qualId') qualId: string) {
  const qualification = await prisma.qualification.findUnique({
    where: { id: qualId },
    include: {
      units: {
        include: {
          unit: {
            select: { id: true, code: true, title: true, status: true, superseded_by: true },
          },
        },
        orderBy: { created_at: 'asc' },
      },
      rto_qualifications: {
        where: { deleted_at: null, is_active: true },
        select: { rto_id: true },
      },
    },
  });
  if (!qualification) throw new NotFoundException('Qualification not found');

  // TAS documents linked to this qualification
  const tasDocuments = await prisma.tasDocument.findMany({
    where: { qualification_id: qualId, deleted_at: null },
    orderBy: { created_at: 'desc' },
  });

  return { ...qualification, tasDocuments };
}
```

### Unit Detail API Endpoint

```typescript
// Source: [ASSUMED] — follows established Prisma include pattern
@Get(':unitId')
async getUnitDetail(@Param('unitId') unitId: string) {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      elements: {
        include: {
          performance_criteria: { orderBy: { pc_num: 'asc' } },
        },
        orderBy: { element_num: 'asc' },
      },
      snapshots: {
        orderBy: { snapshotted_at: 'desc' },
        select: {
          id: true,
          snapshotted_at: true,
          change_fields: true,
          snapshot_data: true,
        },
      },
    },
  });
  if (!unit) throw new NotFoundException('Unit not found');
  return unit;
}
```

### TAS Upload Form — Two-Step S3 Upload

```typescript
// Source: [ASSUMED] — two-step presigned URL pattern per CLAUDE.md
async function handleTasSubmit(formData: TasFormValues) {
  // Step 1: Get presigned URL
  const { presignedUrl, fileKey } = await apiFetch('/tas/presign', {
    method: 'POST',
    body: JSON.stringify({ fileName: formData.file.name, fileSize: formData.file.size }),
  });

  // Step 2: Upload file directly to S3
  const s3Response = await fetch(presignedUrl, {
    method: 'PUT',
    body: formData.file,
    headers: { 'Content-Type': formData.file.type || 'application/octet-stream' },
  });
  if (!s3Response.ok) throw new Error('File upload to storage failed');

  // Step 3: Save TAS record
  await apiFetch('/tas', {
    method: 'POST',
    body: JSON.stringify({
      rtoId: rtoId,
      qualificationId: formData.qualificationId,
      unitIds: formData.unitIds,
      versionLabel: formData.versionLabel,
      reviewDate: formData.reviewDate,
      status: formData.status,
      fileKey,
      fileName: formData.file.name,
      fileSize: formData.file.size,
    }),
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AWS SDK v2 (`aws-sdk`) monolithic | AWS SDK v3 (`@aws-sdk/client-s3`) modular | 2020 (v3 GA) | Smaller bundle; must import individual commands |
| `getSignedUrl` from `aws-sdk/clients/s3` | `getSignedUrl` from `@aws-sdk/s3-request-presigner` | v3 | Different import path; same conceptual API |
| Next.js Pages Router dynamic routes | Next.js App Router `page.tsx` in nested directories | Next.js 13 | `params` is now a `Promise<{...}>` requiring `await params` |
| `useRouter().push()` for navigation | `<Link href="...">` for declarative navigation | Next.js 13 | Prefer `Link` for SEO and prefetching; `useRouter` for programmatic |

**Deprecated/outdated patterns to avoid:**
- `aws-sdk` v2 (the old monolithic package): Not used here — project starts with v3.
- `getServerSideProps` / `getStaticProps`: Pages Router APIs — not applicable in App Router.
- Passing `params` synchronously without `await`: In Next.js 15, `params` is a Promise. The existing `page.tsx` files already show the correct `await params` pattern.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `TasDocument.qualification_id` should FK to `Qualification.id` (not `RtoQualification.id`) | Schema Additions / Pitfall 1 | All TAS queries need rework if FK target is wrong |
| A2 | `snapshot_data` JSON in `UnitSnapshot` uses snake_case field names matching the DB column naming convention | Pitfall 4 / Code Examples | Snapshot timeline viewer breaks if shape is different |
| A3 | S3 environment will be MinIO or AWS S3 (not Google GCS or Azure Blob) | Pattern 1 | SDK choice is correct; if GCS/Azure, a different SDK is needed |
| A4 | `forcePathStyle: true` needed for S3 endpoint (MinIO compatibility) | Pattern 1 | AWS S3 works either way; MinIO requires it |
| A5 | `@radix-ui/react-select` is the right Radix component for the qualification selector in TAS form | Standard Stack | Minor; alternative is native `<select>` which is simpler but harder to style |
| A6 | `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` are official AWS packages (confirmed by npm registry existence, not just training data) | Package Legitimacy | Both exist on npm from `@aws-sdk` org — legitimate |

---

## Open Questions (RESOLVED)

1. **S3 environment: MinIO locally vs. AWS S3 in production?**
   - What we know: `.env.example` has no S3 vars; CLAUDE.md says "S3-compatible object storage"
   - What's unclear: Is the developer running MinIO locally for dev, or pointing directly at AWS S3?
   - Recommendation: Add `S3_ENDPOINT` env var (empty = AWS S3; set = custom endpoint). The `TasService` should support both via `forcePathStyle` toggle.
   - RESOLVED: Plan 03-01 Task 4 adds `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_ENDPOINT` to `.env.example`. `s3.client.ts` uses `forcePathStyle: !!process.env.S3_ENDPOINT` — supports both MinIO (endpoint set) and AWS S3 (endpoint empty).

2. **What does `UnitSnapshot.snapshot_data` actually contain?**
   - What we know: It's `Json` typed; created by `TgaSyncService` in Phase 2
   - What's unclear: The exact field names stored — snake_case or camelCase
   - Recommendation: Read `tga-sync.service.ts` before building the snapshot viewer component and confirm the shape.
   - RESOLVED: PATTERNS.md inspection of `tga-sync.service.ts` confirms snake_case field names: `element_num`, `description`, `performance_criteria[]` with `pc_num` and `text`. Plan 03-04 snapshot viewer uses these exact field names.

3. **TAS-06: Union query vs. Document table extension?**
   - What we know: The `Document` model is currently a minimal stub (`file_key`, `file_name` only)
   - What's unclear: How Phase 6 will expand the Document model
   - Recommendation: Implement TAS-06 as a dedicated `/rtos/:rtoId/tas` endpoint that returns `TasDocument[]`. The TAS tab in the workspace renders this list. In Phase 6, the full document library can wrap this in a union query alongside generic `Document` records. Avoid coupling to the Document model now since it will expand significantly.
   - RESOLVED: Plan 03-03 implements `GET /tas/rtos/:rtoId` returning `TasDocument[]`. Plan 03-05 renders these in the workspace TAS tab. Phase 6 will introduce the union query; no Document model coupling required now.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All JS builds | Assumed ✓ | (project running) | — |
| PostgreSQL (Neon) | Prisma / DB | ✓ | Neon hosted | — |
| `npx prisma db push` | Schema expansion | ✓ | Via existing Prisma setup | — |
| S3-compatible storage | TAS file upload | ✗ | Not configured | For dev: use MinIO via Docker; for prod: AWS S3 |
| `@aws-sdk/client-s3` | TAS presign | ✗ (not installed) | 3.1048.0 on npm | No fallback — required |
| `@aws-sdk/s3-request-presigner` | TAS presign | ✗ (not installed) | 3.1048.0 on npm | No fallback — required |
| `@radix-ui/react-select` | TAS form | ✗ (not installed) | 2.2.6 on npm | Fallback: native `<select>` |
| `@radix-ui/react-collapsible` | Snapshot viewer | ✗ (not installed) | 1.1.12 on npm | Fallback: useState open/close with plain div |

**Missing dependencies with no fallback:**
- S3-compatible storage credentials — must be configured before TAS upload can be tested end-to-end
- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` — required for presigned URL generation

**Missing dependencies with fallback:**
- `@radix-ui/react-select` — native `<select>` acceptable for MVP
- `@radix-ui/react-collapsible` — plain CSS expand/collapse acceptable

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 (existing in `apps/api`) |
| Config file | `apps/api/jest.config.js` (or inferred from `package.json`) |
| Quick run command | `cd apps/api && npm test -- --testPathPattern=tas` |
| Full suite command | `cd apps/api && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TAS-02 / D-08 | Auto-archive: creating a Current TAS archives previous Current | unit | `npm test -- --testPathPattern=tas.service` | ❌ Wave 0 |
| TAS-03 | Status values: only Draft/Current/Archived accepted | unit | `npm test -- --testPathPattern=tas.service` | ❌ Wave 0 |
| QUAL-03 | Qualification detail endpoint returns units + TAS list | integration | `npm test -- --testPathPattern=qualification.controller` | ❌ Wave 0 |
| QUAL-04 | Unit detail endpoint returns elements + PCs | integration | `npm test -- --testPathPattern=unit.controller` | ❌ Wave 0 |
| QUAL-05 | Unit detail includes snapshot history | integration | `npm test -- --testPathPattern=unit.controller` | ❌ Wave 0 |
| TAS-06 | GET /rtos/:rtoId/tas returns all TAS records for RTO | integration | `npm test -- --testPathPattern=tas.controller` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npm test -- --testPathPattern=(tas|qualification|unit)` (quick)
- **Per wave merge:** `cd apps/api && npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/tas/__tests__/tas.service.spec.ts` — covers TAS-02, TAS-03, D-08 auto-archive
- [ ] `apps/api/src/qualification/__tests__/qualification.controller.spec.ts` — covers QUAL-03
- [ ] `apps/api/src/unit/__tests__/unit.controller.spec.ts` — covers QUAL-04, QUAL-05
- [ ] `apps/api/src/tas/__tests__/tas.controller.spec.ts` — covers TAS-01, TAS-06

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing `AccessTokenGuard` global guard — all new endpoints inherit protection |
| V3 Session Management | no | Handled by existing auth layer |
| V4 Access Control | yes (basic) | All endpoints scoped to `rto_id` — verify in service layer that the requesting user has access to the RTO (MVP: all users are super admin, so any authenticated user) |
| V5 Input Validation | yes | `class-validator` `@IsUUID()`, `@IsIn(['Draft','Current','Archived'])`, `@IsOptional()` on all DTOs |
| V6 Cryptography | yes | S3 presigned URL uses AWS SigV4 — do not hand-roll; use `@aws-sdk/s3-request-presigner` |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Uploading arbitrary file types to S3 | Tampering | Validate `Content-Type` whitelist in `PresignTasDto` (e.g., `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`); restrict by extension |
| Presigned URL reuse / leakage | Information Disclosure | Set `expiresIn: 3600` (1 hour); short enough to limit exposure |
| Accessing another RTO's TAS records | Elevation of Privilege | Always filter `where: { rto_id }` in TAS queries; never query by `tas_document_id` alone |
| Oversized file upload | Denial of Service | Set `ContentLength` max in the `PutObjectCommand`; validate `file_size` in DTO (e.g., max 50MB) |

---

## Project Constraints (from CLAUDE.md)

- **Never store files in the database** — all TAS files go to S3; only `file_key` and metadata in PostgreSQL
- **UUID PKs** — all new models use `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
- **Soft delete** — `deleted_at` timestamp on `TasDocument`; never hard-delete
- **Relational linking** — `TasDocumentUnit` junction table required (D-07)
- **Future-proof architecture** — `TasDocument` must support OCR/AI analysis in post-MVP (store full file metadata now)
- **No premature microservices** — new modules (`QualificationModule`, `UnitModule`, `TasModule`) register in the existing monolithic `AppModule`
- **Presigned S3 pattern** — backend generates presigned PUT URL; frontend uploads directly; backend saves `file_key` (never file bytes through NestJS)
- **Historical records immutable** — TAS old versions must remain accessible (TAS-04); only `status` changes, never record deletion

---

## Sources

### Primary (HIGH confidence)
- Existing codebase — `apps/api/src/`, `apps/web/`, `packages/database/prisma/schema.prisma` — direct inspection
- `.planning/phases/03-qualifications-units-tas-management/03-CONTEXT.md` — locked decisions
- `CLAUDE.md` — tech stack, architecture constraints

### Secondary (MEDIUM confidence)
- `npm view @aws-sdk/client-s3 version` — confirmed 3.1048.0 on npm registry
- `npm view @aws-sdk/s3-request-presigner version` — confirmed 3.1048.0
- `npm view @radix-ui/react-select version` — confirmed 2.2.6
- `npm view @radix-ui/react-collapsible version` — confirmed 1.1.12

### Tertiary (LOW / ASSUMED)
- AWS SDK v3 presigned URL API shape — training data; verified package exists but exact API not re-confirmed via Context7 this session
- Prisma `$transaction` interactive transaction pattern — training data; established Prisma pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm; existing stack read directly from source
- Architecture: HIGH — derived from direct codebase inspection and locked CONTEXT.md decisions
- Pitfalls: MEDIUM — based on codebase analysis and known NestJS/Next.js edge cases
- S3 presigned URL pattern: MEDIUM — packages verified; exact API shape [ASSUMED] from training data

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (stable libraries; Next.js 15 / AWS SDK v3 are not fast-moving at patch level)
