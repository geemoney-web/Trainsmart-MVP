---
plan: 03-03
phase: 03-qualifications-units-tas-management
status: complete
completed_at: "2026-05-19"
---

# Plan 03-03 Summary: TAS API Endpoints

## Endpoints Built

| Method | Path | Description |
|--------|------|-------------|
| POST | `/tas/presign` | Returns `{ presignedUrl, fileKey }` for direct S3 upload |
| POST | `/tas` | Creates TasDocument row with optional auto-archive |
| GET | `/tas/rtos/:rtoId` | Returns all non-deleted TAS records for an RTO |

## Request/Response Shapes

**POST /tas/presign** body:
```json
{ "rtoId": "uuid", "fileName": "doc.pdf", "fileSize": 1024, "contentType": "application/pdf" }
```
Response: `{ "presignedUrl": "https://...", "fileKey": "tas/{rtoId}/{timestamp}-{sanitized}" }`

**POST /tas** body (CreateTasDto):
```json
{
  "rtoId": "uuid", "qualificationId": "uuid", "versionLabel": "v1",
  "status": "Draft|Current|Archived", "fileKey": "tas/...", "fileName": "doc.pdf",
  "fileSize": 1024, "reviewDate": "2026-06-01", "unitIds": ["uuid"], "uploadedById": "uuid"
}
```
Response: created TasDocument row.

**GET /tas/rtos/:rtoId** response: TasDocument[] with nested `units[].unit` (id, code, title).

## Auto-Archive Transaction

When `status = 'Current'`, `TasService.create` uses `prisma.$transaction` to:
1. `updateMany` all prior `status: 'Current'` rows for same `(rto_id, qualification_id)` → `status: 'Archived'`
2. `create` the new TasDocument row
3. `createMany` TasDocumentUnit junction rows if `unitIds` provided

When `status = 'Draft'` — no updateMany called (verified by test).

## No Hard-Delete

No `tasDocument.delete` or `tasDocument.deleteMany` exists anywhere in tas.service.ts (TAS-04 compliant). Removal is via soft-delete (`deleted_at`).

## Environment Variables Required

| Key | Purpose |
|-----|---------|
| S3_REGION | AWS region (default: us-east-1) |
| S3_ENDPOINT | Optional: MinIO or custom S3-compatible endpoint |
| S3_ACCESS_KEY_ID | AWS/MinIO access key |
| S3_SECRET_ACCESS_KEY | AWS/MinIO secret key |
| S3_BUCKET | Target bucket name |

S3_ENDPOINT empty → standard AWS S3. Non-empty → `forcePathStyle: true` for MinIO compatibility.

## Content-Type Whitelist

`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`

## Deviations

None.

## Test Coverage

12 tests across 2 spec files (7 service + 5 controller). All green.
