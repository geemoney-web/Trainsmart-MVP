# Phase 3: Qualifications, Units & TAS Management - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver clickable qualification detail pages, unit detail pages with element/performance criteria wording and historical snapshots, and the complete TAS upload/versioning workflow. Trainer credential tracking and document management are separate phases — only placeholder sections appear here.

</domain>

<decisions>
## Implementation Decisions

### Detail Page Navigation
- **D-01:** Qualification detail opens as a dedicated Next.js page at `/rto/[id]/qualifications/[qualId]` — not a modal or slide-over. Full-page with shareable URL; back-button returns to qualifications tab.
- **D-02:** Unit detail opens as a dedicated Next.js page at `/rto/[id]/units/[unitId]` — consistent with qualification detail. Back-button returns to the qualification detail page.
- **D-03:** Qualification list rows become clickable links (wrapping the existing table rows with `<Link href="...">`).

### Qualification Detail Layout
- **D-04:** Single scrollable page with stacked sections — no nested tab bar within the qualification detail. Sections in order: Qualification Info (TGA status, code, title, training package, superseded_by), Units, TAS Documents, Trainers (placeholder), Documents (placeholder).
- **D-05:** Trainers and Documents sections are visible in the layout with a "Coming in Phase 4" note — same placeholder approach used for workspace tabs in Phase 1.

### TAS Upload & Versioning
- **D-06:** TAS upload form captures: file (required), qualification link (required, pre-filled when uploading from qualification detail), version label (e.g. "v3", "Jan 2026"), review date, and initial status (Draft / Current). This covers TAS-05.
- **D-07:** TAS is linked to both qualifications AND units. The unit multi-select shows all units belonging to the selected qualification. A `TasDocumentUnit` junction table is added to the schema now.
- **D-08:** Auto-archive on new version upload: when a new TAS is set to "Current", any existing "Current" TAS for the same qualification is automatically set to "Archived". Staff don't need to manually manage status transitions.
- **D-09:** TAS version history is visible on the qualification detail page (versioned list). All versions remain accessible (TAS-04 — never delete).

### Unit Detail Layout
- **D-10:** Unit detail page shows: unit info (code, title, status, superseded_by), a structured list of elements each containing their numbered performance criteria, and a Historical Snapshots section.
- **D-11:** Historical snapshot viewer uses a **timeline list** — chronological list of all snapshot dates, clicking a date expands/collapses the full wording (elements + PCs) for that snapshot. Good for audit trail visibility.

### TAS Document Library Integration
- **D-12:** TAS records surface in the global RTO document library (TAS-06) — the `Document` table or a shared view will include TAS records. The exact integration mechanism (extend `Document` model vs. union query) is Claude's discretion based on the existing schema shape.

### Schema Additions
- **D-13:** `TasDocument` model needs significant expansion: `qualification_id`, `version_label`, `review_date`, `status` (Draft/Current/Archived), `file_key`, `file_name`, `file_size`, `uploaded_by_id`. Add `TasDocumentUnit` junction table for unit links.

### Claude's Discretion
- Exact Prisma field names and indexes for expanded TasDocument model
- Whether to extend the existing `Document` model or use a union query for TAS-06 library integration
- Loading skeleton design for detail pages
- Breadcrumb navigation format (e.g. Dashboard > RTO Name > Qualifications > Qual Code)
- Exact shadcn/ui components for sections and timeline list

</decisions>

<specifics>
## Specific Ideas

- Keep the same shadcn/ui + dark sidebar aesthetic established in Phase 1
- The timeline snapshot list should expand/collapse each entry — good for audit work where you need to verify exact wording at a point in time
- TAS upload should be triggerable from both the qualification detail page (pre-fills the qualification) and a standalone TAS tab (no pre-fill)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirements; Phase 3 covers QUAL-03, QUAL-04, QUAL-05, TAS-01 through TAS-06
- `.planning/ROADMAP.md` §Phase 3 — Goal, success criteria, and plan breakdown

### Schema
- `packages/database/prisma/schema.prisma` — Current Prisma schema; `Qualification`, `Unit`, `UnitElement`, `PerformanceCriterion`, `QualificationUnit`, `UnitSnapshot`, `QualificationSnapshot`, `TasDocument` (stub), `RtoQualification` are all defined here — must read before any schema additions

### Existing Code Patterns
- `apps/api/src/tga/tga.controller.ts` — Existing NestJS controller pattern; GET/POST route structure, Prisma usage, error handling
- `apps/web/components/qualifications/QualificationsTab.tsx` — Existing qualifications tab; the table to be extended with clickable rows
- `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` — Tab routing structure; new qualification detail and unit detail routes follow the same Next.js App Router patterns
- `apps/web/lib/api.ts` — `apiFetch` helper and auth refresh pattern used by all frontend API calls

### Architecture
- `CLAUDE.md` — Tech stack, presigned S3 URL pattern for file uploads (backend never handles file bytes), soft delete conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/lib/api.ts` `apiFetch()` — Use for all new API calls with automatic token refresh
- `apps/web/components/qualifications/QualificationsTab.tsx` — Table pattern (thead/tbody with hover state, status badges) to replicate for units list and TAS list
- `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` — Tab page layout; breadcrumb + tab nav structure can be adapted for detail pages
- `apps/api/src/tga/tga.controller.ts` — Controller pattern to follow for new qualification, unit, and TAS controllers

### Established Patterns
- NestJS controllers: one controller per domain module, `@Get`/`@Post` decorators, `prisma` imported from `@repo/db`, `Logger` for error logging
- TanStack Query: `useQuery` for reads, `queryClient.invalidateQueries` after mutations, query key arrays like `['rto-qualifications', rtoId]`
- Presigned S3: backend generates presigned URL → frontend uploads directly to S3 → backend saves `file_key` and metadata (no file bytes through backend)
- Status badges: green for Current/active, red for superseded/expired (see `QualificationsTab.tsx` lines 92–100)
- Soft delete: `deleted_at` timestamp on all major entities; always filter `where: { deleted_at: null }`

### Integration Points
- New qualification detail routes: `/rto/[id]/qualifications/[qualId]` and `/rto/[id]/units/[unitId]` added to `apps/web/app/(dashboard)/rto/[id]/` directory
- New NestJS controllers needed: `QualificationController`, `UnitController`, `TasController` — register in `app.module.ts`
- TAS file upload: use the established presigned S3 pattern from Phase 1 (D-06)
- `TasDocument` in schema links to `RtoQualification` (or directly to `Qualification`) and through new `TasDocumentUnit` junction to `Unit`

</code_context>

<deferred>
## Deferred Ideas

- Trainer-to-unit mapping display on unit detail page — Phase 4 (trainer module)
- Document upload on qualification/unit detail — Phase 6 (documents module)
- TAS linked to units display on the TAS tab — deferred to Phase 4 when trainer module makes this relevant
- Full document library view for TAS records — Phase 6

</deferred>

---

*Phase: 03-qualifications-units-tas-management*
*Context gathered: 2026-05-18*
