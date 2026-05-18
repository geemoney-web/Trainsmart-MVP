# Phase 3: Qualifications, Units & TAS Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-05-18
**Phase:** 03-qualifications-units-tas-management
**Mode:** discuss (default)
**Areas discussed:** Detail page navigation, TAS upload & versioning flow, Unit snapshot viewer, Qualification detail content & layout

---

## Discussion Log

### Area: Detail page navigation

| Question | Options presented | User selection |
|----------|-------------------|----------------|
| Where does qualification detail open? | Dedicated page / Slide-over panel / Modal dialog | Dedicated page (`/rto/[id]/qualifications/[qualId]`) |
| Where does unit detail open? | Dedicated page / Slide-over panel | Dedicated page (`/rto/[id]/units/[unitId]`) |

### Area: TAS upload & versioning flow

| Question | Options presented | User selection |
|----------|-------------------|----------------|
| Which fields to capture on TAS upload? | Version + review date + status / Version + review date only / Full metadata upfront | Version + review date + status |
| Should TAS link to units or just qualifications? | Qualification-level only (Phase 3) / Both qualification and units now | Both qualification and units now |
| Unit scope for TAS multi-select? | All units from linked qualification / All RTO units | All units from the linked qualification |
| How to handle old version on new upload? | Auto-archive previous Current / Manual transition | Auto-archive previous Current |

### Area: Unit snapshot viewer

| Question | Options presented | User selection |
|----------|-------------------|----------------|
| How to present historical snapshots? | Version dropdown / Side-by-side diff / Timeline list | Timeline list (chronological, expand/collapse per date) |

### Area: Qualification detail content & layout

| Question | Options presented | User selection |
|----------|-------------------|----------------|
| How to organise qualification detail page? | Stacked sections / Sub-tabs / Two-column layout | Stacked sections on one page |
| How to show Trainers/Documents sections in Phase 3? | Show header with 'Coming in Phase 4' note / Omit entirely | Show section header with 'Coming in Phase 4' note |

---

## Deferred Ideas

- Trainer-to-unit mapping on unit detail — Phase 4
- Document upload on qualification/unit detail — Phase 6
- Full TAS document library view — Phase 6
