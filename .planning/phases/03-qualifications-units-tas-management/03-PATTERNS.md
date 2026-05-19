# Phase 3: Qualifications, Units & TAS Management - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 16 new/modified files
**Analogs found:** 15 / 16

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/database/prisma/schema.prisma` | config/schema | CRUD | `packages/database/prisma/schema.prisma` (current) | exact — extend in place |
| `apps/api/src/qualification/qualification.controller.ts` | controller | request-response | `apps/api/src/tga/tga.controller.ts` | exact |
| `apps/api/src/qualification/qualification.service.ts` | service | CRUD | `apps/api/src/rto/rto.service.ts` | exact |
| `apps/api/src/qualification/qualification.module.ts` | config/module | — | `apps/api/src/tga/tga.module.ts` | exact |
| `apps/api/src/unit/unit.controller.ts` | controller | request-response | `apps/api/src/tga/tga.controller.ts` | exact |
| `apps/api/src/unit/unit.service.ts` | service | CRUD | `apps/api/src/rto/rto.service.ts` | exact |
| `apps/api/src/unit/unit.module.ts` | config/module | — | `apps/api/src/tga/tga.module.ts` | exact |
| `apps/api/src/tas/tas.controller.ts` | controller | request-response + file-I/O | `apps/api/src/tga/tga.controller.ts` | role-match |
| `apps/api/src/tas/tas.service.ts` | service | CRUD + file-I/O | `apps/api/src/rto/rto.service.ts` | role-match |
| `apps/api/src/tas/dto/create-tas.dto.ts` | utility/DTO | — | `apps/api/src/rto/dto/create-rto.dto.ts` | exact |
| `apps/api/src/tas/dto/presign-tas.dto.ts` | utility/DTO | — | `apps/api/src/tga/dto/import-qualification.dto.ts` | exact |
| `apps/api/src/tas/tas.module.ts` | config/module | — | `apps/api/src/tga/tga.module.ts` | exact |
| `apps/api/src/app.module.ts` | config/module | — | `apps/api/src/app.module.ts` (current) | exact — extend in place |
| `apps/web/app/(dashboard)/rto/[id]/qualifications/[qualId]/page.tsx` | component/page | request-response | `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` | role-match |
| `apps/web/app/(dashboard)/rto/[id]/units/[unitId]/page.tsx` | component/page | request-response | `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` | role-match |
| `apps/web/components/qualifications/QualificationsTab.tsx` | component | request-response | `apps/web/components/qualifications/QualificationsTab.tsx` (current) | exact — modify in place |
| `apps/web/components/qualifications/QualificationDetail.tsx` | component | request-response | `apps/web/components/qualifications/QualificationsTab.tsx` | role-match |
| `apps/web/components/units/UnitDetail.tsx` | component | request-response | `apps/web/components/qualifications/QualificationsTab.tsx` | role-match |
| `apps/web/components/units/UnitSnapshotTimeline.tsx` | component | event-driven | `apps/web/components/qualifications/ImportQualificationModal.tsx` | partial-match |
| `apps/web/components/tas/TasUploadForm.tsx` | component | file-I/O | `apps/web/components/qualifications/ImportQualificationModal.tsx` | role-match |
| `apps/web/components/tas/TasVersionList.tsx` | component | request-response | `apps/web/components/qualifications/QualificationsTab.tsx` | role-match |
| `apps/web/components/tas/TasTab.tsx` | component | request-response | `apps/web/components/qualifications/QualificationsTab.tsx` | exact |
| `apps/web/lib/api.ts` | utility | request-response | `apps/web/lib/api.ts` (current) | exact — extend in place |

---

## Pattern Assignments

### `packages/database/prisma/schema.prisma` (config/schema — extend in place)

**Analog:** Current `packages/database/prisma/schema.prisma`

**UUID PK pattern** (lines 12-14 on `User` model — copy for all new models):
```prisma
id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
```

**Soft-delete + timestamps pattern** (lines 17-19 on `User` model):
```prisma
created_at DateTime  @default(now()) @db.Timestamptz
updated_at DateTime  @updatedAt @db.Timestamptz
deleted_at DateTime? @db.Timestamptz
```

**Index pattern** (lines 22-23 on `User` model):
```prisma
@@index([email])
@@index([deleted_at])
@@map("table_name_snake_case")
```

**Junction table pattern** — copy from `QualificationUnit` (lines 217-228):
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

**Relation back-reference pattern** — the `TasDocument` expansion must add a `tas_documents TasDocument[]` relation to `Qualification` (see how `Rto` declares `tas_documents TasDocument[]` at line 41 and `qualifications RtoQualification[]` at line 39).

**Note on `snapshot_data` shape** — confirmed from `tga-sync.service.ts` lines 258-271: `snapshot_data` for `UnitSnapshot` is stored as `{ ...existingUnit, elements: currentElements }` where `currentElements` comes from `prisma.unitElement.findMany({ include: { performance_criteria: true } })`. Field names are Prisma snake_case column names: `element_num`, `title`, `performance_criteria` (array), `pc_num`, `text`. The snapshot viewer must use these exact field names.

---

### `apps/api/src/qualification/qualification.controller.ts` (controller, request-response)

**Analog:** `apps/api/src/tga/tga.controller.ts`

**Imports pattern** (lines 1-22):
```typescript
import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { QualificationService } from './qualification.service';

@Controller('qualifications')
export class QualificationController {
  private readonly logger = new Logger(QualificationController.name);
  constructor(private readonly qualificationService: QualificationService) {}
```

**GET by ID pattern** (lines 48-55 of tga.controller.ts — getSyncStatus):
```typescript
@Get(':qualId')
async getQualificationDetail(@Param('qualId') qualId: string) {
  try {
    return await this.qualificationService.findOne(qualId);
  } catch {
    throw new NotFoundException('Qualification not found');
  }
}
```

**Error handling pattern** (lines 75-82 of tga.controller.ts — importQualification):
```typescript
} catch (err: any) {
  this.logger.error(`Failed for ${qualId}: ${err.message}`, err.stack);
  if (err.status) throw err; // rethrow NestJS HttpExceptions as-is
  throw new InternalServerErrorException(err.message ?? 'Request failed');
}
```

---

### `apps/api/src/qualification/qualification.service.ts` (service, CRUD)

**Analog:** `apps/api/src/rto/rto.service.ts`

**Imports + Injectable pattern** (lines 1-6):
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';

@Injectable()
export class QualificationService {
```

**findOne with includes pattern** (lines 32-53 of rto.service.ts):
```typescript
async findOne(qualId: string) {
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
    },
  });
  if (!qualification) throw new NotFoundException('Qualification not found');
  return qualification;
}
```

**Soft-delete filter pattern** — always `where: { deleted_at: null }` on every findMany (see rto.service.ts lines 10-21). Apply to TAS document sub-queries: `where: { qualification_id: qualId, deleted_at: null }`.

---

### `apps/api/src/qualification/qualification.module.ts` (module)

**Analog:** `apps/api/src/tga/tga.module.ts` (lines 1-13)

```typescript
import { Module } from '@nestjs/common';
import { QualificationController } from './qualification.controller';
import { QualificationService } from './qualification.service';

@Module({
  controllers: [QualificationController],
  providers: [QualificationService],
})
export class QualificationModule {}
```

---

### `apps/api/src/unit/unit.controller.ts` (controller, request-response)

**Analog:** `apps/api/src/tga/tga.controller.ts`

Same pattern as `qualification.controller.ts` above. Route: `@Controller('units')`. Single `@Get(':unitId')` handler delegating to `UnitService.findOne(unitId)`.

---

### `apps/api/src/unit/unit.service.ts` (service, CRUD)

**Analog:** `apps/api/src/rto/rto.service.ts`

**findOne with nested includes for elements + PCs + snapshots:**
```typescript
async findOne(unitId: string) {
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

**Snapshot data shape note** — `snapshot_data` stored by TGA sync service is `{ ...existingUnit, elements: [{ id, unit_id, element_num, title, created_at, updated_at, performance_criteria: [{ id, element_id, pc_num, text, ... }] }] }`. Use snake_case field names in the frontend snapshot viewer.

---

### `apps/api/src/unit/unit.module.ts` (module)

Same pattern as `qualification.module.ts`. Replace `Qualification` with `Unit`.

---

### `apps/api/src/tas/tas.controller.ts` (controller, request-response + file-I/O)

**Analog:** `apps/api/src/tga/tga.controller.ts`

**Imports pattern** (lines 1-22 of tga.controller.ts, extended):
```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { TasService } from './tas.service';
import { CreateTasDto } from './dto/create-tas.dto';
import { PresignTasDto } from './dto/presign-tas.dto';

@Controller('tas')
export class TasController {
  private readonly logger = new Logger(TasController.name);
  constructor(private readonly tasService: TasService) {}
```

**POST with HttpStatus.CREATED** (lines 69-82 of tga.controller.ts):
```typescript
@Post('presign')
@HttpCode(HttpStatus.OK)
async presign(@Body() dto: PresignTasDto) {
  return this.tasService.generatePresignedUrl(dto);
}

@Post()
@HttpCode(HttpStatus.CREATED)
async createTas(@Body() dto: CreateTasDto) {
  try {
    return await this.tasService.create(dto);
  } catch (err: any) {
    this.logger.error(`TAS create failed: ${err.message}`, err.stack);
    throw new InternalServerErrorException(err.message ?? 'TAS creation failed');
  }
}

@Get('rtos/:rtoId')
async getTasByRto(@Param('rtoId') rtoId: string) {
  return this.tasService.findByRto(rtoId);
}
```

---

### `apps/api/src/tas/tas.service.ts` (service, CRUD + file-I/O)

**Analog:** `apps/api/src/rto/rto.service.ts`

**Injectable + prisma import** (lines 1-6 of rto.service.ts):
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';

@Injectable()
export class TasService {
```

**Prisma transaction pattern for auto-archive** (lines 55-69 of rto.service.ts — `$transaction`):
```typescript
async create(dto: CreateTasDto) {
  return prisma.$transaction(async (tx) => {
    if (dto.status === 'Current') {
      await tx.tasDocument.updateMany({
        where: {
          rto_id: dto.rtoId,
          qualification_id: dto.qualificationId,
          status: 'Current',
          deleted_at: null,
        },
        data: { status: 'Archived' },
      });
    }
    const tas = await tx.tasDocument.create({
      data: {
        rto_id: dto.rtoId,
        qualification_id: dto.qualificationId,
        uploaded_by_id: dto.uploadedById ?? null,
        version_label: dto.versionLabel,
        status: dto.status,
        file_key: dto.fileKey,
        file_name: dto.fileName,
        file_size: dto.fileSize,
        review_date: dto.reviewDate ? new Date(dto.reviewDate) : null,
      },
    });
    if (dto.unitIds?.length) {
      await tx.tasDocumentUnit.createMany({
        data: dto.unitIds.map((unitId) => ({
          tas_document_id: tas.id,
          unit_id: unitId,
        })),
      });
    }
    return tas;
  });
}
```

**findByRto with soft-delete filter** (lines 9-21 of rto.service.ts):
```typescript
async findByRto(rtoId: string) {
  return prisma.tasDocument.findMany({
    where: { rto_id: rtoId, deleted_at: null },
    include: {
      units: { include: { unit: { select: { id: true, code: true, title: true } } } },
    },
    orderBy: { created_at: 'desc' },
  });
}
```

---

### `apps/api/src/tas/dto/create-tas.dto.ts` (DTO, utility)

**Analog:** `apps/api/src/rto/dto/create-rto.dto.ts`

**class-validator import + field decorators pattern** (lines 1-33):
```typescript
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsIn,
  IsOptional,
  IsInt,
  IsDateString,
  IsArray,
  Max,
} from 'class-validator';

export class CreateTasDto {
  @IsUUID()
  rtoId: string;

  @IsUUID()
  qualificationId: string;

  @IsString()
  @IsNotEmpty()
  versionLabel: string;

  @IsIn(['Draft', 'Current', 'Archived'])
  status: 'Draft' | 'Current' | 'Archived';

  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsInt()
  @Max(52_428_800) // 50 MB
  fileSize: number;

  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  unitIds?: string[];

  @IsOptional()
  @IsUUID()
  uploadedById?: string;
}
```

---

### `apps/api/src/tas/dto/presign-tas.dto.ts` (DTO, utility)

**Analog:** `apps/api/src/tga/dto/import-qualification.dto.ts` (lines 1-7)

```typescript
import { IsString, IsNotEmpty, IsInt, IsIn, Max } from 'class-validator';

export class PresignTasDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsInt()
  @Max(52_428_800)
  fileSize: number;

  @IsIn([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ])
  contentType: string;
}
```

---

### `apps/api/src/tas/tas.module.ts` (module)

**Analog:** `apps/api/src/tga/tga.module.ts` (lines 1-13)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TasController } from './tas.controller';
import { TasService } from './tas.service';

@Module({
  imports: [ConfigModule],   // needed for S3 env vars via ConfigService
  controllers: [TasController],
  providers: [TasService],
})
export class TasModule {}
```

---

### `apps/api/src/app.module.ts` (extend in place)

**Analog:** Current `apps/api/src/app.module.ts` (lines 1-19)

Add three new imports to the existing imports array — follow exact pattern of `TgaModule`:
```typescript
import { QualificationModule } from './qualification/qualification.module';
import { UnitModule } from './unit/unit.module';
import { TasModule } from './tas/tas.module';

// In @Module imports array:
QualificationModule,
UnitModule,
TasModule,
```

---

### `apps/web/app/(dashboard)/rto/[id]/qualifications/[qualId]/page.tsx` (page, request-response)

**Analog:** `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx`

**Server component with async params pattern** (lines 27-32):
```typescript
export default async function QualificationDetailPage({
  params,
}: {
  params: Promise<{ id: string; qualId: string }>;
}) {
  const { id, qualId } = await params;  // Next.js 15: params is a Promise
  return (
    <div className="px-8 py-6">
      {/* RtoWorkspaceHeader + breadcrumb */}
      <QualificationDetail rtoId={id} qualId={qualId} />
    </div>
  );
}
```

**Link back-button pattern** (lines 43-46 of rto-workspace-header.tsx):
```typescript
<Link
  href={`/rto/${id}/qualifications`}
  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
>
  ← Back to Qualifications
</Link>
```

---

### `apps/web/app/(dashboard)/rto/[id]/units/[unitId]/page.tsx` (page, request-response)

Same server component pattern as the qualification detail page above. Use `{ id, unitId }` from params. The back-link points to `/rto/${id}/qualifications/${qualId}` — qualId must be passed as a query param or read from browser history.

---

### `apps/web/components/qualifications/QualificationsTab.tsx` (modify in place)

**Analog:** Current file — minimal modification.

**Add `useRouter` import and `cursor-pointer` + `onClick` to `<tr>`** — follow RESEARCH.md Pattern 5:

Current `<tr>` at line 83-86:
```typescript
<tr
  key={rq.id}
  className="text-foreground hover:bg-muted/50 transition-colors"
>
```

Replace with:
```typescript
<tr
  key={rq.id}
  className="text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
  onClick={() => router.push(`/rto/${rtoId}/qualifications/${rq.qualification?.id}`)}
>
```

Add at top: `import { useRouter } from 'next/navigation';` and `const router = useRouter();` inside the component.

---

### `apps/web/components/qualifications/QualificationDetail.tsx` (component, request-response)

**Analog:** `apps/web/components/qualifications/QualificationsTab.tsx`

**'use client' + TanStack Query useQuery pattern** (lines 1-31):
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface Props {
  rtoId: string;
  qualId: string;
}

export function QualificationDetail({ rtoId, qualId }: Props) {
  const { data: qualification, isPending, isError } = useQuery({
    queryKey: ['qualification', qualId],
    queryFn: () => apiFetch(`/qualifications/${qualId}`),
  });
```

**Loading skeleton pattern** (lines 49-55 of QualificationsTab.tsx):
```typescript
{isPending && (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-12 rounded-lg border border-border bg-muted animate-pulse" />
    ))}
  </div>
)}
```

**Error state pattern** (lines 57-59 of QualificationsTab.tsx):
```typescript
{isError && (
  <p className="text-destructive">Could not load qualification. Refresh the page to try again.</p>
)}
```

**Status badge pattern** (lines 90-99 of QualificationsTab.tsx):
```typescript
<span
  className={`px-2 py-0.5 rounded text-xs font-medium ${
    qualification.status.toLowerCase() === 'current'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  }`}
>
  {qualification.status}
</span>
```

**Placeholder section pattern** (lines 62-65 of tab page.tsx — "Coming Soon"):
```typescript
<section>
  <h3 className="text-lg font-semibold mb-2">Trainers</h3>
  <p className="text-muted-foreground text-sm">Coming in Phase 4.</p>
</section>
```

---

### `apps/web/components/units/UnitDetail.tsx` (component, request-response)

**Analog:** `apps/web/components/qualifications/QualificationsTab.tsx`

Same `useQuery` + loading/error pattern as `QualificationDetail.tsx`. Query key: `['unit', unitId]`. Endpoint: `/units/${unitId}`.

**Elements + PCs nested list** — render `unit.elements` sorted by `element_num`, each containing `performance_criteria` sorted by `pc_num`. No analog exists for nested structured list; use plain `<ul>/<li>` with Tailwind spacing (e.g., `space-y-4` for elements, `ml-4 space-y-1` for PCs).

---

### `apps/web/components/units/UnitSnapshotTimeline.tsx` (component, event-driven)

**Analog:** `apps/web/components/qualifications/ImportQualificationModal.tsx` (expand/collapse state pattern, lines 21-25)

**useState for expand/collapse** (partial-match analog — ImportQualificationModal uses `useState` for UI state):
```typescript
'use client';
import { useState } from 'react';

interface Props {
  snapshots: Array<{
    id: string;
    snapshotted_at: string;
    change_fields: string[];
    snapshot_data: any;
  }>;
}

export function UnitSnapshotTimeline({ snapshots }: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
```

**snapshot_data field names** — confirmed snake_case from tga-sync.service.ts line 268:
- `snapshot_data.elements` — array of `UnitElement` records
- `snapshot_data.elements[n].element_num` — element number string
- `snapshot_data.elements[n].title` — element title
- `snapshot_data.elements[n].performance_criteria` — array
- `snapshot_data.elements[n].performance_criteria[m].pc_num` — PC number string
- `snapshot_data.elements[n].performance_criteria[m].text` — PC text

**Collapsible row pattern** — use `@radix-ui/react-collapsible` `<Collapsible>` + `<CollapsibleTrigger>` + `<CollapsibleContent>` if installed. Fallback: plain `{openIds.has(s.id) && <div>...</div>}` conditional render.

---

### `apps/web/components/tas/TasUploadForm.tsx` (component, file-I/O)

**Analog:** `apps/web/components/qualifications/ImportQualificationModal.tsx`

**Async mutation with loading/error state** (lines 46-58 of ImportQualificationModal.tsx):
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleSubmit(formData: TasFormValues) {
  setIsSubmitting(true);
  setError(null);
  try {
    // Step 1: presign
    const { presignedUrl, fileKey } = await apiFetch('/tas/presign', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, fileSize: file.size, contentType: file.type }),
    });
    // Step 2: upload to S3 directly
    const s3Res = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    if (!s3Res.ok) throw new Error('File upload failed');
    // Step 3: save TAS record
    await apiFetch('/tas', { method: 'POST', body: JSON.stringify({ ...metadata, fileKey }) });
    onUploaded();
  } catch (err: any) {
    setError(err.message ?? 'Upload failed');
  } finally {
    setIsSubmitting(false);
  }
}
```

**Error display pattern** (lines 128-131 of ImportQualificationModal.tsx):
```typescript
{error && (
  <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
    <p className="text-sm text-destructive">{error}</p>
  </div>
)}
```

**Input field styling pattern** (lines 80-86 of ImportQualificationModal.tsx):
```typescript
className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
```

**Two-button footer pattern** (lines 140-155 of ImportQualificationModal.tsx):
```typescript
<div className="flex gap-3 p-6 border-t border-border">
  <button
    onClick={onClose}
    disabled={isSubmitting}
    className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
  >
    Cancel
  </button>
  <button
    type="submit"
    disabled={isSubmitting}
    className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isSubmitting ? 'Uploading...' : 'Upload TAS'}
  </button>
</div>
```

**queryClient.invalidateQueries after mutation** (lines 33-35 of QualificationsTab.tsx):
```typescript
const queryClient = useQueryClient();
// After successful upload:
void queryClient.invalidateQueries({ queryKey: ['rto-qualifications', rtoId] });
// Also invalidate: ['tas', rtoId]
```

---

### `apps/web/components/tas/TasVersionList.tsx` (component, request-response)

**Analog:** `apps/web/components/qualifications/QualificationsTab.tsx`

**Table pattern** — same `<table>` structure (lines 72-114 of QualificationsTab.tsx). Columns: Version Label, Status (badge), Review Date, Uploaded At, Actions.

**Status badge pattern** — reuse status badge from QualificationsTab.tsx lines 90-99 but with three states:
```typescript
const statusColors: Record<string, string> = {
  Current: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Draft:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  Archived:'bg-muted text-muted-foreground',
};
```

---

### `apps/web/components/tas/TasTab.tsx` (component, request-response)

**Analog:** `apps/web/components/qualifications/QualificationsTab.tsx` — exact structural match.

**Header + button + table + modal pattern** (lines 37-125 of QualificationsTab.tsx):
- Replace "qualifications" nouns with "TAS"
- `useQuery({ queryKey: ['tas', rtoId], queryFn: () => apiFetch(`/tas/rtos/${rtoId}`) })`
- "Upload TAS" button opens `TasUploadForm` (instead of ImportQualificationModal)
- Table shows: Version, Qualification, Status badge, Review Date, Uploaded At
- Loading skeleton + error state + empty state — exact same pattern

---

### `apps/web/lib/api.ts` (utility — extend in place)

**Analog:** Current file (lines 1-77). Add new helper functions following the existing named-export pattern (lines 13-29):

```typescript
// --- Qualification API helpers ---
export async function getQualificationDetail(qualId: string) {
  return apiFetch(`/qualifications/${qualId}`);
}

// --- Unit API helpers ---
export async function getUnitDetail(unitId: string) {
  return apiFetch(`/units/${unitId}`);
}

// --- TAS API helpers ---
export async function getRtoTasDocuments(rtoId: string) {
  return apiFetch(`/tas/rtos/${rtoId}`);
}

export async function getTasPresignedUrl(fileName: string, fileSize: number, contentType: string) {
  return apiFetch('/tas/presign', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileSize, contentType }),
  });
}

export async function createTasDocument(data: object) {
  return apiFetch('/tas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

---

## Shared Patterns

### Authentication Guard
**Source:** `apps/api/src/tga/tga.controller.ts` (no explicit guard — global `AccessTokenGuard` is registered in auth module and applies automatically to all controllers)
**Apply to:** All new controllers (`QualificationController`, `UnitController`, `TasController`)
**Pattern:** No per-controller guard annotation needed. The global guard in `AuthModule` already protects all routes. Verify this is still the case when registering new modules in `AppModule`.

### Error Handling (API)
**Source:** `apps/api/src/tga/tga.controller.ts` lines 74-82 + `apps/api/src/rto/rto.service.ts` lines 46-47
```typescript
// In service: throw NestJS HttpException for known errors
if (!record) throw new NotFoundException('Record not found');

// In controller: catch + rethrow with logging
} catch (err: any) {
  this.logger.error(`Operation failed: ${err.message}`, err.stack);
  if (err.status) throw err;
  throw new InternalServerErrorException(err.message ?? 'Operation failed');
}
```

### Soft Delete Filter
**Source:** `apps/api/src/rto/rto.service.ts` lines 10-12 + `apps/api/src/tga/tga.controller.ts` lines 86-89
**Apply to:** All service `findMany` calls
```typescript
where: { deleted_at: null }
```
Never query without this filter on any model that has `deleted_at`.

### TanStack Query Pattern (Frontend)
**Source:** `apps/web/components/qualifications/QualificationsTab.tsx` lines 28-31 + `apps/web/components/rto/rto-workspace-header.tsx` lines 8-11
**Apply to:** All new client components that fetch data
```typescript
const { data, isPending, isError } = useQuery({
  queryKey: ['entity-name', id],
  queryFn: () => apiFetch(`/entity-name/${id}`),
});
```
Query key arrays must be unique per entity type. After mutations: `queryClient.invalidateQueries({ queryKey: ['entity-name', id] })`.

### Loading Skeleton
**Source:** `apps/web/components/qualifications/QualificationsTab.tsx` lines 49-55
**Apply to:** All new page-level client components
```typescript
{isPending && (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-12 rounded-lg border border-border bg-muted animate-pulse" />
    ))}
  </div>
)}
```

### apiFetch Auth Refresh
**Source:** `apps/web/lib/api.ts` lines 33-77
**Apply to:** All new API calls — always use `apiFetch()`, never raw `fetch()` for API calls (raw `fetch` is only appropriate for the direct S3 PUT with presigned URL).

### Page Layout Container
**Source:** `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` lines 39-40
**Apply to:** All new detail pages
```typescript
<div className="px-8 py-6">
  {/* content */}
</div>
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/api/src/tas/tas.service.ts` (S3 presign logic only) | service | file-I/O | No S3 integration exists anywhere in the codebase yet. Use RESEARCH.md Pattern 1 (AWS SDK v3 `getSignedUrl`). |

---

## Key Observations for Planner

1. **snapshot_data shape confirmed** — `UnitSnapshot.snapshot_data` stores the full `existingUnit` Prisma record spread plus `elements` array (snake_case column names). The snapshot viewer must use `element_num`, `performance_criteria`, `pc_num`, `text` — not camelCase variants.

2. **TasDocument FK target** — confirmed correct: `qualification_id → Qualification.id`. All other stub models (`Validation`, `Task`, etc.) carry `rto_id` directly, matching the recommended approach in RESEARCH.md Pitfall 1.

3. **Existing `TasDocument` stub** — the schema currently has a stub `TasDocument` with only `id`, `rto_id`, and timestamps (lines 84-95 of schema.prisma). Wave 0 must expand this model AND ensure the `rto.service.ts` placeholder `tasDocument.create({ data: { rto_id: rto.id } })` still compiles after the expansion (all new fields must be `@default` or nullable).

4. **`Qualification` model has no `tas_documents` back-relation** — must be added to the schema when expanding `TasDocument` (Prisma requires both sides of a relation to be declared).

5. **No existing NestJS service pattern** — `TgaController` directly uses `prisma` without a separate service. `RtoController` delegates to `RtoService`. New modules should follow the `RtoController`/`RtoService` split pattern for testability.

---

## Metadata

**Analog search scope:** `apps/api/src/`, `apps/web/app/`, `apps/web/components/`, `apps/web/lib/`, `packages/database/prisma/`
**Files read:** 15
**Pattern extraction date:** 2026-05-18
