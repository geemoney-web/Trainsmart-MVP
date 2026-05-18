---
plan: 03-01
phase: 03-qualifications-units-tas-management
status: complete
completed_at: "2026-05-19"
---

# Plan 03-01 Summary: Schema + S3 Environment Foundation

## What Was Built

Expanded the `TasDocument` stub model and added the `TasDocumentUnit` junction table. Installed AWS SDK v3 and Radix UI primitives. Documented and scaffolded S3 environment variables. Pushed schema to Neon and regenerated the Prisma client.

## TasDocument Final Field List

| Field | Type | Nullable | Default |
|-------|------|----------|---------|
| id | String (UUID) | no | gen_random_uuid() |
| rto_id | String (UUID) | no | — |
| qualification_id | String (UUID) | yes | null |
| uploaded_by_id | String (UUID) | yes | null |
| version_label | String | no | "" |
| status | String | no | "Draft" |
| file_key | String | no | "" |
| file_name | String | no | "" |
| file_size | Int | no | 0 |
| review_date | DateTime (Date) | yes | null |
| created_at | DateTime | no | now() |
| updated_at | DateTime | no | updatedAt |
| deleted_at | DateTime | yes | null |

## Nullability Strategy

`qualification_id` and `uploaded_by_id` are nullable so the existing `rto.service.ts` placeholder `prisma.tasDocument.create({ data: { rto_id: rto.id } })` continues to compile without modification. All other new fields use string/int defaults so they are never null on create.

## New Models

- `TasDocument` — expanded with all D-13 fields; back-relations on `Rto`, `Qualification`, `User`
- `TasDocumentUnit` — junction table linking TasDocument ↔ Unit; unique constraint on `(tas_document_id, unit_id)`; back-relations on `Unit`

## Back-relations Added

| Model | Field | Type |
|-------|-------|------|
| User | tas_uploads | TasDocument[] |
| Qualification | tas_documents | TasDocument[] |
| Unit | tas_document_units | TasDocumentUnit[] |

## Packages Installed

| Package | Workspace | Version |
|---------|-----------|---------|
| @aws-sdk/client-s3 | apps/api | 3.1048.0 |
| @aws-sdk/s3-request-presigner | apps/api | 3.1048.0 |
| @radix-ui/react-select | apps/web | 2.2.6 |
| @radix-ui/react-collapsible | apps/web | 1.1.12 |

## Deviations

None. Schema matches the plan exactly.

## Downstream Clearance

Plans 03-02 through 03-05 may now import from `@repo/db` with full `TasDocument` and `TasDocumentUnit` types. The generated client (`packages/database/generated/client/index.d.ts`) contains 573 references to `TasDocumentUnit` and is deployed to Neon.
