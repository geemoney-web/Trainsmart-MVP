# Plan 03-05 Summary — TAS Frontend (Upload Form, Version List, Workspace Tab)

## Status: Complete (pending human E2E verification)

## What was built

### New components
- `apps/web/components/tas/TasUploadForm.tsx` — Modal upload form: presign request → direct S3 PUT → POST /tas metadata. Client-side validation (file required, 50MB max, PDF/DOC/DOCX only). Status radio (Draft/Current). `role="dialog" aria-modal` accessible. Calls `onUploaded({ autoArchived })` on success.
- `apps/web/components/tas/TasVersionList.tsx` — Read-only version list with status badges (Current=green, Draft=amber, Archived=muted), file name, review date, Download button placeholder.
- `apps/web/components/tas/TasTab.tsx` — Full workspace TAS tab: fetches documents via `['tas', rtoId]` query + RTO qualifications for code lookup. Table: Version | Qualification | Status | Review Date | Uploaded. "+ Upload TAS" button opens TasUploadForm. Auto-archive notice on upload.

### Modified
- `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` — Added `TasTab` import and `tab === 'tas'` routing branch
- `apps/web/lib/api.ts` — Added `getTasPresignedUrl`, `createTasDocument`, `getTasByRto`, `getRtoTasDocuments`, `getQualificationDetail`, `getUnitDetail`
- `apps/web/components/qualifications/QualificationDetail.tsx` — Integrated TasVersionList and TasUploadForm into the qualification detail TAS section

### Build verification
- `npx tsc --noEmit` — clean
- `pnpm --filter @trainsmart/web build` — clean

## Human checkpoint required
Task 4 requires E2E manual verification with S3 configured:
1. Set S3 env vars in `apps/api/.env` (or use MinIO locally)
2. Start dev servers: `pnpm dev`
3. Navigate to any RTO → TAS tab
4. Upload a PDF with status "Current" — verify it appears in the table
5. Upload a second PDF with status "Current" for the same qualification — verify the first is auto-archived
6. Navigate to a qualification detail page — verify the TAS section shows the uploaded documents
7. Test "Draft" upload — verify no auto-archive occurs
