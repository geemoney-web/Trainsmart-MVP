---
phase: 03
phase_name: qualifications-units-tas-management
status: draft
created: "2026-05-18"
tool: none
design_system: Radix UI primitives + Tailwind CSS v4, manual CSS custom properties (no shadcn CLI, no components.json)
---

# UI-SPEC: Phase 03 — Qualifications, Units & TAS Management

## Design System State

No `components.json` found. The project uses Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-label`, `@radix-ui/react-slot`) combined with Tailwind CSS v4 and manually authored CSS custom properties in `globals.css`. All styling follows the existing hand-crafted token and class pattern. Do NOT initialise shadcn CLI for this phase.

Registry safety gate: not applicable.

---

## Token Reference (from globals.css — use these everywhere)

| Token | HSL value | Usage |
|-------|-----------|-------|
| `--background` | `0 0% 100%` | Main content area background |
| `--foreground` | `240 10% 3.9%` | Primary text |
| `--card` | `0 0% 100%` | Card and panel backgrounds |
| `--card-foreground` | `240 10% 3.9%` | Text on cards |
| `--primary` | `240 5.9% 10%` | CTA button background, active tab indicator |
| `--primary-foreground` | `0 0% 98%` | Text on primary buttons |
| `--secondary` | `240 4.8% 95.9%` | Secondary surfaces |
| `--muted` | `240 4.8% 95.9%` | Skeleton loaders, disabled surfaces |
| `--muted-foreground` | `240 3.8% 46.1%` | Secondary text, breadcrumb separators, placeholders |
| `--accent` | `240 4.8% 95.9%` | Hover states on table rows (`bg-muted/50`) |
| `--destructive` | `0 84.2% 60.2%` | Error text, destructive button background |
| `--border` | `240 5.9% 90%` | All borders, dividers |
| `--input` | `240 5.9% 90%` | Input field borders |
| `--ring` | `240 5.9% 10%` | Focus ring |
| `--radius` | `0.5rem` | Base border radius |
| `--sidebar-background` | `240 5.9% 10%` | Sidebar background only |

---

## Spacing

Scale: 4px base unit, multiples of 4 only.

| Step | px | Tailwind class | Primary use |
|------|----|----------------|-------------|
| 1 | 4px | `gap-1`, `p-1` | Icon padding, tight badge gaps |
| 2 | 8px | `gap-2`, `p-2` | Inline element gaps, small padding |
| 3 | 12px | `gap-3`, `p-3` | Nav item padding, breadcrumb separators |
| 4 | 16px | `gap-4`, `p-4` | Card internal padding (compact) |
| 5 | 20px | `gap-5`, `p-5` | RTO card padding (established pattern) |
| 6 | 24px | `gap-6`, `mb-6` | Section spacing, tab nav margin-bottom |
| 8 | 32px | `px-8 py-6` | Page container padding (established pattern — DO NOT change) |
| 12 | 48px | `py-12` | Empty state vertical padding |
| 16 | 64px | `py-16` | Large empty state vertical padding |

Touch targets: minimum `min-h-[44px]` on all interactive elements — tabs, buttons, table rows used as links. This is an established pattern in the sidebar nav and tab links.

---

## Typography

Font family: Inter (declared in `globals.css` `@theme { --font-sans: 'Inter' }`)

| Role | Size | Weight | Line-height | Tailwind classes | Used for |
|------|------|--------|-------------|------------------|----------|
| Page heading | 24px (1.5rem) | 600 semibold | 1.25 (`leading-tight`) | `text-2xl font-semibold leading-tight` | Page H1 (established: "RTO Dashboard") |
| Section heading | 20px (1.25rem) | 600 semibold | 1.2 | `text-xl font-semibold` | Section H2 within pages, "Qualifications", "Units" |
| Subsection heading | 16px (1rem) | 600 semibold | 1.25 | `text-base font-semibold leading-tight` | Element group headings, detail section titles |
| Body / table | 14px (0.875rem) | 400 regular | 1.5 | `text-sm` | Table cells, description text, badge labels, form labels, body content |

Only two weights in use: 400 (regular) and 600 (semibold). Do not introduce 500 or 700.

Monospace exception: qualification codes and unit codes use `font-mono text-sm` — established pattern in `QualificationsTab.tsx`.

---

## Color Contract

### 60 / 30 / 10 Split

- **60% — dominant surface:** `bg-background` (white) for main content area. All new pages use `px-8 py-6` on a white background.
- **30% — secondary surfaces:** `bg-card border border-border` for cards, panels, modal dialogs, section containers.
- **10% — accent / interactive:** `bg-primary text-primary-foreground` reserved exclusively for: primary CTA buttons, active tab underline (`border-primary`), focus rings.

### Semantic Colors

These are ADDITIONS to the 60/30/10 for compliance-specific meaning. Use ONLY for the stated purpose.

| Color | Tailwind (light) | Tailwind (dark) | Reserved for |
|-------|-----------------|-----------------|--------------|
| Green | `bg-green-100 text-green-800` | `dark:bg-green-900/40 dark:text-green-300` | TAS status = "Current"; Qualification TGA status = "Current" |
| Red | `bg-red-100 text-red-800` | `dark:bg-red-900/40 dark:text-red-300` | TAS status = "Archived" when superseded; Qualification TGA status = "Superseded" |
| Amber | `bg-amber-100 text-amber-800` | `dark:bg-amber-900/40 dark:text-amber-800` | TAS status = "Draft"; TAS review date overdue warning |
| Muted/neutral | `bg-muted text-muted-foreground` | (same token) | Placeholder sections ("Coming in Phase 4"), secondary metadata |

**Destructive color** (`text-destructive` / `bg-destructive`): error messages only — form validation errors, API error states.

---

## Status Badges

Badges follow the existing pattern from `QualificationsTab.tsx` (lines 92–100): `px-2 py-0.5 rounded text-xs font-medium`.

| Badge label | Background + text classes | When shown |
|-------------|--------------------------|------------|
| Current | `bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300` | TGA qual status = Current; TAS status = Current |
| Superseded | `bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300` | TGA qual/unit status = Superseded |
| Draft | `bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-800` | TAS status = Draft |
| Archived | `bg-muted text-muted-foreground` | TAS status = Archived (neutral — not an error) |

---

## Breadcrumb Navigation

Pattern: `text-sm text-muted-foreground` links with `/` separators, final item in `text-foreground` (non-link).

Established in `rto-workspace-header.tsx`: `← Back / RTO Name`. Extend this pattern for detail pages.

**Qualification detail breadcrumb:**
```
← Back  /  {RTO Name}  /  Qualifications  /  {Qual Code}
```
- "← Back" links to `/rto/[id]/qualifications`
- "{RTO Name}" links to `/rto/[id]/qualifications`
- "Qualifications" links to `/rto/[id]/qualifications`
- "{Qual Code}" is the current page — no link, `text-foreground font-medium`

**Unit detail breadcrumb:**
```
← Back  /  {RTO Name}  /  Qualifications  /  {Qual Code}  /  Units  /  {Unit Code}
```
- "← Back" links to `/rto/[id]/qualifications/[qualId]`
- "{Qual Code}" links to `/rto/[id]/qualifications/[qualId]`
- "{Unit Code}" is current page — no link

Separator: `<span className="text-muted-foreground">/</span>` with `gap-3` between items. Breadcrumb container: `flex items-center gap-3 mb-6`.

---

## Page Layouts

### Qualification Detail Page (`/rto/[id]/qualifications/[qualId]`)

Container: `px-8 py-6` (matches workspace pages).

Structure (top to bottom, single scrollable column):

```
[Breadcrumb row]                        ← flex items-center gap-3 mb-6

[Page heading]                          ← text-2xl font-semibold leading-tight
{Qual Title}
{Qual Code}  [TGA Status Badge]  [Superseded badge if applicable]   ← mt-1 flex items-center gap-2

[Metadata row]                          ← mt-2 text-sm text-muted-foreground flex gap-6
Training Package: {code}  |  Last Synced: {date}  |  Superseded by: {code} (if applicable)

─────────────────────────────────────────────────────────────────────
[Section: Units]                        ← mt-8
  Section header: text-lg font-semibold mb-4 + unit count badge (muted, text-xs)
  Units table (same pattern as QualificationsTab):
    Columns: Code | Title | Status | [arrow icon →]
    Rows: hover:bg-muted/50, entire row is a Link to /rto/[id]/units/[unitId]
    Code cell: font-mono text-sm
    min-h-[44px] on each row (touch target)

─────────────────────────────────────────────────────────────────────
[Section: TAS Documents]               ← mt-8
  Section header: text-lg font-semibold mb-4 + "Upload TAS" button (primary, right-aligned)
  TAS version history list (see TAS Version History List spec below)

─────────────────────────────────────────────────────────────────────
[Section: Trainers]                    ← mt-8
  [Placeholder block]
  bg-muted/50 rounded-lg border border-border border-dashed p-8 text-center
  text-muted-foreground text-sm: "Trainer mapping coming in Phase 4"

─────────────────────────────────────────────────────────────────────
[Section: Documents]                   ← mt-8
  [Placeholder block]
  Same dashed placeholder style: "Document management coming in Phase 6"
```

Section separator: `mt-8` top margin only. No horizontal rules. The visual break comes from the section heading.

### Unit Detail Page (`/rto/[id]/units/[unitId]`)

Container: `px-8 py-6`.

Structure:

```
[Breadcrumb row]                        ← flex items-center gap-3 mb-6

[Page heading]                          ← text-2xl font-semibold leading-tight
{Unit Title}
{Unit Code}  [TGA Status Badge]         ← mt-1 flex items-center gap-2

[Metadata row]                          ← mt-2 text-sm text-muted-foreground
Superseded by: {code} (if applicable)

─────────────────────────────────────────────────────────────────────
[Section: Elements & Performance Criteria]   ← mt-8
  Section header: text-lg font-semibold mb-4

  Per element — a stacked card block:
  ┌────────────────────────────────────────────────────────┐
  │  Element N: {Element title}                            │  ← text-base font-semibold, bg-card, p-4, rounded-lg, border border-border
  │                                                        │
  │  N.1  {Performance criterion text}                     │  ← text-sm, pl-4 indent, py-1.5
  │  N.2  {Performance criterion text}                     │
  │  N.3  {Performance criterion text}                     │
  └────────────────────────────────────────────────────────┘

  Element blocks: `space-y-3` between each element card.
  PC number: `font-mono text-xs text-muted-foreground w-8 shrink-0` (right-padded).
  PC text: `text-sm text-foreground`.
  Each PC row: `flex items-start gap-2`.

─────────────────────────────────────────────────────────────────────
[Section: Historical Snapshots]        ← mt-8
  Section header: text-lg font-semibold mb-4 + snapshot count (muted badge, e.g. "3 snapshots")

  Timeline list (see Historical Snapshot Timeline spec below)
```

---

## Component Specifications

### TAS Version History List (on Qualification Detail)

Renders within the TAS Documents section. Each TAS record is a row.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [Status Badge]  {version_label}  ·  {file_name}        Review: {date}   [↓] │  ← hover:bg-muted/50
└──────────────────────────────────────────────────────────────────────────────┘
```

- Container: `divide-y divide-border rounded-lg border border-border overflow-hidden`
- Each row: `flex items-center gap-3 px-4 py-3 text-sm`
- Status badge: per badge spec above (Current = green, Draft = amber, Archived = muted)
- Version label: `font-medium text-foreground`
- File name: `text-muted-foreground text-xs`
- Review date: `ml-auto text-xs text-muted-foreground` (right-aligned)
- Download icon: `ml-2 h-4 w-4 text-muted-foreground hover:text-foreground` (Lucide `Download`)
- Rows are NOT links — download triggers file fetch via presigned URL
- Empty state within section: `py-8 text-center text-sm text-muted-foreground` — "No TAS documents uploaded yet."

### Historical Snapshot Timeline (on Unit Detail)

Each snapshot entry in the timeline is a collapsible block.

```
[▶ / ▼]  {ISO date formatted as DD MMM YYYY}  ·  {change summary if available}
─ when expanded ──────────────────────────────────────────────────────
  Element 1: {element wording at snapshot time}
    1.1  {PC wording}
    1.2  {PC wording}
  Element 2: ...
```

Implementation:

- Container: `space-y-2`
- Each entry trigger row: `flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors text-sm`
- Chevron icon: Lucide `ChevronRight` (collapsed) / `ChevronDown` (expanded), `h-4 w-4 text-muted-foreground`
- Date: `font-medium text-foreground`
- Change summary (if present): `text-muted-foreground`
- Expanded content: `mt-1 px-4 pb-4 pt-2 rounded-b-lg border-x border-b border-border bg-card` — renders same element/PC structure as current version section but in `text-sm text-muted-foreground` (visually subdued to distinguish from live data)
- No animations on expand/collapse — instant toggle. Keep it simple for internal tool.
- Snapshots ordered most-recent-first.
- Empty state: `py-8 text-center text-sm text-muted-foreground` — "No historical snapshots recorded yet."

### TAS Upload Form (Modal)

Decision: **modal dialog**, consistent with the established `ImportQualificationModal` and `AddRtoDialog` patterns. The form is triggered from the qualification detail page (qualification pre-filled) OR from the TAS tab (no pre-fill). A slide-over is not used — the project has no slide-over pattern.

Modal container follows `AddRtoDialog` pattern exactly:
- Backdrop: `fixed inset-0 z-50 flex items-center justify-center bg-black/60`
- Panel: `bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto`
- Header: `flex items-center justify-between p-6 border-b border-border`
- Title: `text-lg font-semibold` — "Upload TAS Document"
- Close button: `text-muted-foreground hover:text-foreground transition-colors` — Lucide `X` icon, `h-4 w-4`
- Form body: `px-6 pb-6 space-y-4 mt-4`

Form fields in order:

| Field | Input type | Required | Notes |
|-------|-----------|----------|-------|
| File | `<input type="file" accept=".pdf,.doc,.docx">` | Yes | Styled as a full-width bordered drop zone: `border-2 border-dashed border-input rounded-md p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-ring transition-colors` |
| Qualification | Select / pre-filled read-only display | Yes | When pre-filled from qualification detail: `bg-muted px-3 py-2 rounded-md text-sm border border-input` read-only display. When from TAS tab: `<select>` using same class pattern as other inputs |
| Version Label | `<input type="text">` | Yes | Placeholder: `e.g. v3 or Jan 2026`. Class: `w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring` |
| Review Date | `<input type="date">` | No | Same input class. Label: "Review Date (optional)" |
| Initial Status | Two radio buttons or segmented toggle | Yes | Options: Draft / Current. Default: Draft. Render as: `flex gap-4` with `<label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio"> Draft</label>` pattern |

Validation errors: `text-xs text-destructive mt-1` below each field — established pattern from `AddRtoDialog`.

Form footer (action row):
- `flex justify-end gap-3 pt-2`
- Cancel: `rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors`
- Submit CTA: `rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50`
- Submit label: "Upload TAS" (idle) / "Uploading..." (in-progress, button disabled)
- Upload progress: show a simple `text-sm text-muted-foreground` status line below the form inputs: "Uploading file... please wait." No progress bar required for MVP.

### Placeholder Section Block

Used for Trainers (Phase 4) and Documents (Phase 6) sections on qualification detail.

```html
<div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
  <p className="text-sm text-muted-foreground">{placeholder text}</p>
</div>
```

Placeholder copy:
- Trainers section: "Trainer mapping will be available in Phase 4."
- Documents section: "Document management will be available in Phase 6."

### Loading Skeletons

Follow the established `animate-pulse bg-muted rounded-lg` pattern.

**Qualification detail page skeleton:**
```
h-6 w-48 rounded  ← breadcrumb placeholder
h-8 w-96 rounded mt-4  ← heading
h-4 w-64 rounded mt-2  ← metadata row
[3× h-12 rounded-lg border border-border mt-6]  ← units table rows
[2× h-12 rounded-lg border border-border mt-2]  ← TAS rows
```

**Unit detail page skeleton:**
```
h-6 w-64 rounded  ← breadcrumb
h-8 w-96 rounded mt-4  ← heading
[4× rounded-lg border border-border p-4 mt-6 space-y-2]  ← element cards with inner pulse lines
[3× h-10 rounded-lg border border-border mt-2]  ← snapshot entries
```

All skeleton containers: `space-y-3` and individual items `animate-pulse`.

---

## Interaction Contracts

### Qualification List Rows (QualificationsTab — D-03)

Wrap each `<tr>` content in a `<Link href="/rto/[id]/qualifications/[qualId]">` rendered inside a `<td colSpan={4}>` block, OR apply `cursor-pointer` to the `<tr>` and use `router.push()` on row click. Use the `<tr onClick>` + `router.push` pattern — easier with Next.js App Router and matches the pattern already in `rto-card.tsx`.

Row hover: `hover:bg-muted/50 cursor-pointer transition-colors` — already present in `QualificationsTab.tsx`.

Add a `ChevronRight` icon (`h-4 w-4 text-muted-foreground`) as a 5th column to signal clickability. Column header: empty string.

### Back Navigation

All detail pages must render a "← Back" link using the existing `rto-workspace-header.tsx` breadcrumb visual language. The back link always points to the parent page (not `history.back()`) so it works on direct URL access.

### TAS Auto-Archive Feedback (D-08)

When a TAS is uploaded with status "Current" and the backend auto-archives the previous Current TAS, the success state must communicate this. After successful upload, the TAS version list should refresh (via `queryClient.invalidateQueries`) and a `text-sm text-muted-foreground` inline notice is displayed for 4 seconds below the section header: "Previous version has been archived automatically." No toast/notification system exists yet — use inline notice only.

### Snapshot Expand/Collapse

- State: managed with `useState<string | null>` — stores the expanded snapshot ID, or null.
- Clicking the trigger row of an expanded snapshot collapses it (sets state to null).
- Clicking a different snapshot collapses the current one and expands the new one (only one open at a time).
- The chevron icon rotates: `transition-transform duration-200` — no custom CSS, use `rotate-90` class when expanded.

### File Upload Flow

Follows the presigned S3 pattern from Phase 1 (CLAUDE.md):
1. User selects file in the TAS upload modal.
2. On submit: frontend calls backend to get a presigned PUT URL.
3. Frontend uploads file bytes directly to S3 using the presigned URL.
4. Frontend calls backend to save `file_key`, metadata, and TasDocument record.
5. Success: close modal, invalidate queries, show inline archive notice if applicable.
6. Error at any step: `setServerError("Upload failed. Please try again.")` — same pattern as `AddRtoDialog`.

---

## Copywriting Contract

### Primary CTA Labels

| Context | Label |
|---------|-------|
| Add TAS from qualification detail | "Upload TAS" |
| Submit TAS upload form | "Upload TAS" (idle) / "Uploading..." (in-progress) |
| Cancel modal | "Discard" (matches existing pattern from AddRtoDialog) |

### Empty States

| Context | Copy |
|---------|------|
| Units list on qualification detail | "No units linked to this qualification." |
| TAS list on qualification detail | "No TAS documents uploaded yet." |
| Historical snapshots on unit detail | "No historical snapshots recorded yet." |
| Qualification list (existing, do not change) | "No qualifications imported yet. Click 'Add Qualification' to search TGA and import." |

### Error States

| Context | Copy |
|---------|------|
| Failed to load qualification detail | "Could not load qualification. Refresh the page to try again." |
| Failed to load unit detail | "Could not load unit. Refresh the page to try again." |
| Failed to load units list | "Could not load units. Refresh the page to try again." |
| Failed to load TAS list | "Could not load TAS documents. Refresh the page to try again." |
| Failed to load snapshots | "Could not load historical snapshots. Refresh the page to try again." |
| TAS upload fails | "Upload failed. Please try again." |
| File too large (client-side, >50MB) | "File is too large. Maximum size is 50MB." |

All error text: `text-sm text-destructive` — matches existing pattern.

### Inline Status Notice (auto-archive)

"Previous version has been archived automatically."
Style: `text-sm text-muted-foreground` displayed for 4 seconds then hidden via `setTimeout + useState`.

### Destructive Actions

No destructive actions in Phase 3. TAS records are never deleted (D-09, TAS-04). Status transitions (Draft → Current → Archived) happen automatically or via future Phase 6 document management. No delete buttons, no confirmation dialogs.

---

## Accessibility Requirements

- All interactive rows (`<tr>` used as links): add `role="link"` and `tabIndex={0}` with `onKeyDown` Enter handler.
- All modal dialogs: `role="dialog"` `aria-modal="true"` `aria-labelledby="{heading-id}"` — matches existing `AddRtoDialog`.
- Close buttons: `aria-label="Close"`.
- Expand/collapse trigger rows: `aria-expanded={isOpen}` `aria-controls="{content-id}"`.
- Status badges: not interactive, no ARIA required — purely visual.
- Skeleton loaders: wrap in `aria-busy="true"` on the containing region.
- Breadcrumb nav: `aria-label="Breadcrumb"` on the containing `<nav>`.
- Form labels: `<label htmlFor="{id}">` — matches existing dialog patterns.

---

## Icon Library

Lucide React (`lucide-react` v0.511.0 — already in `package.json`). All icons `h-4 w-4` unless stated.

| Icon | Component | Usage |
|------|-----------|-------|
| Row chevron | `ChevronRight` | Qualification/unit list rows |
| Snapshot expand | `ChevronRight` (collapsed) `ChevronDown` (expanded) | Snapshot timeline trigger |
| Close modal | `X` | Modal close button |
| Download TAS | `Download` | TAS row download action |
| Back arrow | Text "←" | Breadcrumb back link (matches existing `rto-workspace-header.tsx` pattern — text, not icon) |

Do not use any icon not already available in `lucide-react`.

---

## Registry

No third-party registries. No new npm packages required for Phase 3 UI. All dependencies (`react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`, Radix UI primitives, TanStack Query) are already in `package.json`.

---

## Pre-Population Sources

| Section | Source |
|---------|--------|
| Page URLs and layout structure | 03-CONTEXT.md D-01 to D-12 |
| Design token values | `apps/web/app/globals.css` |
| Badge color pattern | `apps/web/components/qualifications/QualificationsTab.tsx` lines 92–100 |
| Modal pattern | `apps/web/components/rto/add-rto-dialog.tsx` + `ImportQualificationModal.tsx` |
| Form input class pattern | `apps/web/components/rto/add-rto-dialog.tsx` |
| Loading skeleton pattern | `apps/web/components/qualifications/QualificationsTab.tsx` lines 48–55 |
| Empty state pattern | `apps/web/components/qualifications/QualificationsTab.tsx` lines 61–68 |
| Breadcrumb pattern | `apps/web/components/rto/rto-workspace-header.tsx` |
| Page container padding | `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` — `px-8 py-6` |
| Typography scale | `apps/web/app/(dashboard)/page.tsx` + workspace tab page |
| Icon library | `apps/web/package.json` |
| Touch target minimum | `apps/web/components/layout/app-sidebar.tsx` `min-h-[44px]` |
| TAS modal trigger decision | Researcher decision — consistent with existing modal-only dialog pattern; no slide-over exists in codebase |
| Snapshot one-at-a-time expand | Researcher decision — reduces visual complexity for audit scanning workflow |

---

*Phase: 03-qualifications-units-tas-management*
*UI-SPEC written: 2026-05-18*
*Status: draft — awaiting gsd-ui-checker validation*
