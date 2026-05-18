---
status: draft
phase: 01
phase_name: foundation-rto-dashboard
created: "2026-05-18"
tool: shadcn/ui 4.7.0
registry: shadcn official only
safety_gate: not applicable (official registry only)
---

# UI-SPEC: Phase 01 — Foundation & RTO Dashboard

**Phase boundary:** Database schema, auth, RTO CRUD, dashboard shell with card grid, RTO workspace with 8 tab stubs.

---

## 1. Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn/ui 4.7.0 (copy-into-project model) | D-11 CONTEXT.md |
| CSS framework | Tailwind CSS 4.3.0 | RESEARCH.md |
| Icon library | lucide-react 1.16.0 | RESEARCH.md |
| Registry | shadcn official only — no third-party registries | Default |
| Safety gate | Not applicable — official registry only | — |

### shadcn Components Required (Phase 1)

Install via:
```
pnpm dlx shadcn@latest add sidebar card badge button dialog form input label tabs
```

| Component | Use |
|-----------|-----|
| Sidebar | Dark left navigation shell |
| Card | RTO dashboard card grid items |
| Badge | Operating state chips, future status badge (hidden Phase 1) |
| Button | Primary CTA ("Add RTO"), form submit, destructive delete |
| Dialog | "Add RTO" modal form |
| Form | RTO create form (React Hook Form integration) |
| Input | Form fields within RTO create dialog |
| Label | Form field labels |
| Tabs | RTO workspace tab navigation |

---

## 2. Spacing

**Scale:** 8-point base. All spacing values must be multiples of 4px.

| Token | px | Tailwind Class | Use |
|-------|----|----------------|-----|
| xs | 4px | `p-1` / `gap-1` | Icon padding, tight badge gaps |
| sm | 8px | `p-2` / `gap-2` | Card internal tight spacing, badge row gaps |
| md | 16px | `p-4` / `gap-4` | Card padding, form field spacing |
| lg | 24px | `p-6` / `gap-6` | Card grid gap, section padding |
| xl | 32px | `p-8` / `gap-8` | Page content padding |
| 2xl | 48px | `p-12` / `gap-12` | Dashboard top padding |

**Touch target exception:** All clickable interactive elements minimum 44px height (WCAG 2.5.5). Use `min-h-[44px]` on RTO cards and tab triggers.

**Page content padding:** `px-8 py-6` on the main content area (inside sidebar shell).

---

## 3. Typography

**Font:** Inter (system UI fallback stack). Loaded via `next/font/google`.

```css
font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
```

### Type Scale — Exactly 4 sizes

| Role | Size | Weight | Line Height | Tailwind | Use |
|------|------|--------|-------------|----------|-----|
| Heading 1 | 28px | Semibold (600) | 1.2 | `text-2xl font-semibold leading-tight` | Page title ("RTO Dashboard") |
| Heading 2 | 20px | Semibold (600) | 1.2 | `text-xl font-semibold leading-tight` | Section titles, dialog headings, RTO name in card |
| Body | 16px | Regular (400) | 1.5 | `text-base font-normal leading-normal` | Body copy, tab content stubs, dialog descriptions |
| Caption | 14px | Regular (400) | 1.5 | `text-sm font-normal leading-normal` | ASQA code, metadata, alert/validation counts, muted labels |

**Weights declared:** Regular (400) and Semibold (600) only. No other weights used in Phase 1.

**Muted text:** `text-muted-foreground` (shadcn token) for secondary copy — ASQA code, counts, operating state labels.

---

## 4. Color

**Strategy:** 60 / 30 / 10 split. Internal ops tool — professional, low-distraction palette.

### 60% — Dominant Surface

| Area | Color | shadcn Token | Hex (dark mode default) |
|------|-------|--------------|------------------------|
| Main content area | Off-white / neutral-50 | `bg-background` | `hsl(0 0% 100%)` light / `hsl(240 10% 3.9%)` dark |
| Page body | Light neutral | `bg-muted` or `bg-background` | Tailwind `bg-zinc-50` in light mode |

### 30% — Secondary Surfaces

| Area | Color | shadcn Token / Class |
|------|-------|---------------------|
| Dark sidebar | Dark zinc / slate | `--sidebar-background: 240 5.9% 10%` (CSS var set in globals.css) |
| Sidebar text | Light | `--sidebar-foreground: 240 4.8% 95.9%` |
| Cards | White with border | `bg-card border border-border` (shadcn defaults) |
| Dialog overlay | Semi-transparent dark | shadcn Dialog default overlay |

### 10% — Accent

Accent is **reserved exclusively** for the following elements. Use nowhere else.

| Element | Color | Class |
|---------|-------|-------|
| Primary CTA button ("Add RTO") | Brand blue | `bg-primary text-primary-foreground` (shadcn default blue) |
| Active sidebar nav item | Accent highlight | `bg-sidebar-accent text-sidebar-accent-foreground` |
| Tab active indicator | Underline/fill | shadcn Tabs default active state |
| Form focus ring | Blue ring | Tailwind `ring-ring` via shadcn |

### Semantic Colors (Phase 1 only)

| Purpose | Color | Class | Reserved For |
|---------|-------|-------|-------------|
| Destructive action | Red | `bg-destructive text-destructive-foreground` | Delete RTO confirmation button only |
| Traffic-light Green | — | `bg-green-500` | HIDDEN Phase 1 — do not render |
| Traffic-light Amber | — | `bg-amber-400` | HIDDEN Phase 1 — do not render |
| Traffic-light Red | — | `bg-red-500` | HIDDEN Phase 1 — do not render |

**Note (D-09):** Traffic-light status badges exist in the data model (`status_color` field) but MUST NOT be rendered in Phase 1 UI. The badge element is commented out in the RTO card component pending Phase 5.

---

## 5. Layout

### App Shell

```
┌─────────────────────────────────────────────────────────┐
│  Dark Sidebar (240px fixed)  │  Light Content Area       │
│  ─────────────────────────   │  ────────────────────     │
│  [Logo / App name]           │  [Page heading]           │
│  ─────────────────────────   │  [Content / cards]        │
│  Nav: Dashboard (active)     │                           │
│  ─────────────────────────   │                           │
│  [RTO list items — Phase 2+] │                           │
└─────────────────────────────────────────────────────────┘
```

**Implementation:** shadcn SidebarProvider wraps the entire dashboard layout. Sidebar uses `variant="sidebar"` with dark CSS variables applied via `globals.css`. Content area uses `flex-1 overflow-auto bg-background`.

**Sidebar width:** 240px expanded, 48px icon-only collapsed (shadcn default). Collapsible via shadcn built-in cookie persistence — no custom state needed.

**Mobile:** Sidebar collapses to a Sheet (shadcn built-in). Content area becomes full-width. Breakpoint: `md` (768px).

### Dashboard Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Page title: "RTO Dashboard"]          [+ Add RTO]     │
│  ─────────────────────────────────────────────────────  │
│  [RTO Card]  [RTO Card]  [RTO Card]  [RTO Card]         │
│  [RTO Card]  [RTO Card]  ...                            │
└─────────────────────────────────────────────────────────┘
```

**Primary focal point:** The "Add RTO" button (accent blue, top-right of the page header) against the neutral dashboard header background serves as the primary visual anchor, drawing the eye to the single primary action on this screen.

**Card grid breakpoints:**

| Breakpoint | Columns | Tailwind |
|------------|---------|----------|
| < 640px (mobile) | 1 | `grid-cols-1` |
| 640px–1023px (sm–md) | 2 | `sm:grid-cols-2` |
| 1024px–1279px (lg) | 3 | `lg:grid-cols-3` |
| 1280px+ (xl) | 4 | `xl:grid-cols-4` |

Grid class: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`

### RTO Card Anatomy

```
┌────────────────────────────────────┐
│  [RTO Name]              [badge — HIDDEN Phase 1]  │
│  [ASQA Code — muted]                               │
│  ─────────────────────────────────────────────     │
│  [NSW] [VIC] [QLD]  (operating state badges)       │
│  ─────────────────────────────────────────────     │
│  ⚠ 3 alerts    📅 2 upcoming validations           │
└────────────────────────────────────────────────────┘
```

- Card is fully clickable (wraps in Next.js `<Link>` to `/rto/[id]/qualifications`)
- Hover state: `hover:shadow-md transition-shadow`
- Cursor: `cursor-pointer`

### RTO Workspace Layout

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]  [RTO Name]  [ASQA Code badge]                │
│  ─────────────────────────────────────────────────────  │
│  [Qualifications] [Trainers] [TAS] [Validations]        │
│  [Documents] [Tasks] [Alerts] [Notes]                   │
│  ─────────────────────────────────────────────────────  │
│  [Tab content — stub message for all tabs in Phase 1]   │
└─────────────────────────────────────────────────────────┘
```

**Tab order (D-10):** Qualifications, Trainers, TAS, Validations, Documents, Tasks, Alerts, Notes.

**Tab routing:** URL segment `/rto/[id]/[tab]`. Default redirect: `/rto/[id]` → `/rto/[id]/qualifications`.

**Tab stub content:** Each stub tab renders the body copy defined in Section 7 (Copywriting — Tab Stub).

### Login Page Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              [Logo / TrainSmart wordmark]                │
│                                                         │
│         ┌──────────────────────────────────┐           │
│         │  Email address                    │           │
│         │  [Input]                          │           │
│         │                                   │           │
│         │  Password                         │           │
│         │  [Input]                          │           │
│         │                                   │           │
│         │  [Sign in]                        │           │
│         └──────────────────────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Centred card on full-height neutral background. No sidebar on login page.

---

## 6. Interaction Contracts

### Loading States

| Scenario | Behaviour | Implementation |
|----------|-----------|---------------|
| Dashboard RTO list loading | Skeleton cards (same grid layout, shimmer effect) | `Skeleton` component from shadcn — 4 placeholder cards at all breakpoints |
| RTO create submitting | Button enters disabled + loading state | Button `disabled` prop + spinner icon replacing button label |
| RTO card click navigating | Immediate navigation (Next.js Link) | No loader needed — Next.js prefetching |

### Error States

| Scenario | Behaviour |
|----------|-----------|
| Dashboard fetch fails | Inline error message in content area (see Section 7) |
| Create RTO API error | Toast notification (shadcn Sonner or Dialog error state — see Section 7) |
| Form validation error | Inline field-level error messages (React Hook Form + shadcn Form components) |
| Login failure | Inline error below the form (see Section 7) |

### Empty States

| Scenario | Behaviour |
|----------|-----------|
| No RTOs exist yet | Centred empty state in content area (see Section 7) |
| Workspace tab (all 8 stubs) | Centred stub message per tab (see Section 7) |

### Focus & Keyboard

- All interactive elements must be reachable by keyboard (`Tab` key navigation).
- RTO cards: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Dialog: focus trap on open, returns focus to trigger on close (shadcn Dialog handles this natively).
- Sidebar: keyboard shortcut `Cmd/Ctrl + B` toggles sidebar (shadcn built-in).

### Hover States

- RTO cards: `hover:shadow-md transition-shadow duration-150`
- Buttons: shadcn default hover states (built in)
- Sidebar nav items: `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground` (shadcn default)
- Tab triggers: shadcn default hover states

### Transitions

- Card shadow: `transition-shadow duration-150`
- Dialog open/close: shadcn built-in fade + scale animation
- Sidebar collapse: shadcn built-in slide animation with cookie persistence

---

## 7. Copywriting Contract

### Primary CTA

| Element | Copy |
|---------|------|
| Dashboard page CTA button | **"Add RTO"** |
| Dialog title | **"Add New RTO"** |
| Dialog submit button | **"Create RTO"** |
| Dialog cancel button | **"Discard"** |

### Form Field Labels (Create RTO Dialog)

| Field | Label | Placeholder | Required |
|-------|-------|-------------|----------|
| RTO Name | "RTO Name" | "e.g. Acme Training Pty Ltd" | Yes |
| ASQA Code | "ASQA Code" | "e.g. 12345" | Yes |
| Operating States | "Operating States" | — (multi-select checkboxes: NSW, VIC, QLD, SA, WA, TAS, ACT, NT) | Yes (at least 1) |
| Contact Name | "Contact Name" | "e.g. Jane Smith" | No |
| Contact Email | "Contact Email" | "e.g. jane@example.com" | No |
| Contact Phone | "Contact Phone" | "e.g. +61 2 9000 0000" | No |

### Login Form

| Element | Copy |
|---------|------|
| Page title | **"TrainSmart"** |
| Page subtitle | **"Compliance Operations Platform"** |
| Email field label | "Email address" |
| Password field label | "Password" |
| Submit button | **"Sign in"** |

### Empty States

| Context | Heading | Body | Action |
|---------|---------|------|--------|
| Dashboard — no RTOs | "No RTOs yet" | "Add your first RTO client to get started." | "Add RTO" button |
| Workspace tab stub (all 8) | "[Tab name] — Coming Soon" | "This section will be available in a future update." | None |

**Tab stub heading pattern:** Replace `[Tab name]` with the exact tab label:
- "Qualifications — Coming Soon"
- "Trainers — Coming Soon"
- "TAS — Coming Soon"
- "Validations — Coming Soon"
- "Documents — Coming Soon"
- "Tasks — Coming Soon"
- "Alerts — Coming Soon"
- "Notes — Coming Soon"

### Error States

| Context | Copy |
|---------|------|
| Login — invalid credentials | "Invalid email or password. Please try again." |
| Login — server error | "Unable to sign in. Please try again in a moment." |
| Dashboard fetch failed | "Could not load RTO list. Refresh the page to try again." |
| Create RTO — ASQA code already exists | "An RTO with this ASQA code already exists." |
| Create RTO — server error | "Could not create the RTO. Please try again." |
| Form field — required empty | "[Field name] is required." (inline, below field) |
| Form field — invalid email | "Enter a valid email address." |
| Form field — ASQA code format | "ASQA code must be a 5-digit number." |

### Destructive Actions

| Action | Trigger | Confirmation copy | Confirm button | Cancel button |
|--------|---------|-------------------|---------------|---------------|
| Delete RTO | "Delete RTO" option (accessible from RTO workspace — if included in Phase 1 scope) | "Are you sure you want to delete [RTO Name]? This action cannot be undone." | "Delete RTO" (destructive red) | "Keep RTO" |

**Note:** RTO delete is a soft delete (`deleted_at` timestamp). The confirmation copy says "cannot be undone" from the user's perspective — the record is archived not destroyed, but that is an implementation detail the user does not need.

### RTO Card Metadata Labels

| Data | Label format |
|------|-------------|
| Unresolved alerts | "N alerts" (e.g. "3 alerts") — if 0: "No alerts" |
| Upcoming validations | "N upcoming" (e.g. "2 upcoming") — if 0: "No upcoming validations" |
| Operating states | Displayed as individual `Badge` chips: "NSW", "VIC", etc. |

---

## 8. Sidebar Navigation (Phase 1)

| Item | Icon (lucide-react) | Route | Active in Phase 1 |
|------|---------------------|-------|-------------------|
| Dashboard | `LayoutDashboard` | `/` | Yes |
| *(No other top-level nav in Phase 1)* | — | — | — |

**Sidebar header:** App name "TrainSmart" with a small logo mark (use a placeholder SVG icon in Phase 1 — no brand assets yet).

**Sidebar footer:** Logged-in user's full name + email. Logout button (icon: `LogOut`).

---

## 9. Responsive Behaviour Summary

| Screen | Sidebar | Card Grid | Tabs |
|--------|---------|-----------|------|
| < 768px | Hidden → Sheet on hamburger tap | 1 column | Scrollable horizontal |
| 768px–1023px | Collapsed (icon-only, 48px) | 2 columns | All tabs visible |
| 1024px–1279px | Expanded (240px) | 3 columns | All tabs visible |
| 1280px+ | Expanded (240px) | 4 columns | All tabs visible |

---

## 10. Accessibility Contract

- All images / icons: `aria-hidden="true"` unless conveying meaning
- Buttons with icon-only: `aria-label` required (e.g. `aria-label="Add RTO"`)
- Dialog: `aria-labelledby` pointing to dialog title, `aria-describedby` pointing to dialog description
- Error messages: `role="alert"` on inline API error messages
- Form fields: `htmlFor` / `id` pairing via shadcn Form component (built in)
- Colour is never the only differentiator (operating state badges use text, not colour alone)
- Minimum contrast: 4.5:1 for body text, 3:1 for large text — shadcn defaults meet WCAG AA

---

## 11. Pre-Population Audit

| Field | Source | Status |
|-------|--------|--------|
| Component system (shadcn/ui) | D-11 CONTEXT.md | Pre-populated |
| Dark sidebar layout | D-12 CONTEXT.md | Pre-populated |
| Card grid layout | D-07 CONTEXT.md | Pre-populated |
| Card content fields | D-08 CONTEXT.md | Pre-populated |
| Traffic-light badge hidden | D-09 CONTEXT.md | Pre-populated |
| 8 workspace tabs | D-10 CONTEXT.md | Pre-populated |
| TanStack Query for state | D-13 CONTEXT.md | Noted (implementation detail, not UI contract) |
| shadcn component list | RESEARCH.md installation block | Pre-populated |
| Sidebar CSS variables | RESEARCH.md Pattern 4 | Pre-populated |
| Sidebar breakpoints | Claude discretion (CONTEXT.md) | Defaulted (shadcn standard) |
| Card grid breakpoints | Claude discretion (CONTEXT.md) | Defaulted (1/2/3/4 responsive) |
| Colour tokens | Claude discretion (CONTEXT.md) | Defaulted (shadcn system + zinc sidebar) |
| Typography scale | Not specified upstream | Defaulted (Inter, 4-size scale, 2 weights) |
| Spacing scale | Not specified upstream | Defaulted (8-point scale) |
| Copywriting | Not specified upstream | Derived from requirements + conventions |
| Registry | D-11 (shadcn only) | Pre-populated — official registry only |

---

## 12. Out of Scope (Phase 1)

These elements must NOT be built, even as placeholders, in Phase 1:

- Traffic-light status badge rendering (D-09 — Phase 5 only)
- Compliance alert detail pages
- Any qualification, trainer, TAS, validation, document, task, alert, or notes content (tabs are stubs only)
- Search UI
- Role-based UI variations (all users are Super Admin in MVP)
- Dark mode toggle (sidebar is dark by design; content area is light — this is the fixed aesthetic)

---

*Phase: 01-foundation-rto-dashboard*
*UI-SPEC status: draft*
*Created: 2026-05-18*
*Checker: gsd-ui-checker will upgrade status to `approved`*
