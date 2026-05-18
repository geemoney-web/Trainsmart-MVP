# TrainSmart Internal Compliance Platform

## What This Is

An internal-only compliance operations platform for TrainSmart Solutions consultants managing multiple Registered Training Organisations (RTOs) under ASQA and SRTO 2025 requirements. The platform centralises and automates compliance operations — replacing spreadsheet-based tracking with structured compliance intelligence, TGA data sync, trainer monitoring, and workflow management. Internal TrainSmart staff only; not a public SaaS product.

## Core Value

Consultants can see the real-time compliance health of every RTO client in one place and act on issues before they become audit risks.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-RTO dashboard with traffic-light compliance status
- [ ] Isolated RTO workspace per client (qualifications, trainers, TAS, documents, tasks, alerts)
- [ ] TGA sync engine (qualifications, units, elements, performance criteria — nightly + manual)
- [ ] Historical snapshot preservation on every TGA change
- [ ] TAS management with versioning and status tracking
- [ ] Trainer compliance tracking (credentials, industry currency, PD, unit competency mappings)
- [ ] Compliance intelligence engine with automated alert generation
- [ ] Workflow and task management linked to compliance issues
- [ ] Hybrid document architecture (entity-linked + global RTO library)
- [ ] Validation scheduling and evidence tracking
- [ ] Notes, email records, and operational history per entity

### Out of Scope

- Learner-facing features — this is an internal operations tool, not an LMS or SMS
- Audit pack generation — data structures must support it but generation is post-MVP
- OCR / AI document analysis — post-MVP
- Role-based permissions — all users are Super Admin at MVP
- Client portals — post-MVP
- LMS/SMS integrations — post-MVP
- Advanced analytics and reporting — post-MVP

## Context

- TrainSmart Solutions is an RTO consulting firm managing multiple RTO clients under ASQA
- Current state: spreadsheet-based compliance tracking — the platform replaces this entirely
- Expected concurrent users at launch: <10 (all internal staff)
- Compliance framework: SRTO 2025 requirements
- TGA (training.gov.au) is the authoritative source for qualifications, units, elements, and performance criteria — the platform must sync from it and preserve its exact wording historically
- Compliance status uses a traffic-light model: Green / Amber / Red

## Constraints

- **Tech Stack**: Next.js + TypeScript + Tailwind CSS (frontend), FastAPI or NestJS (backend REST API), PostgreSQL (database), S3-compatible object storage (files), worker queue (background jobs) — decided in spec
- **File Storage**: Never store files directly in the database; always use object storage with metadata
- **Data Integrity**: Never overwrite historical records — TAS versions, qualification wording, unit wording, and evidence history must remain accessible forever
- **Architecture**: Must support future audit pack generation, OCR, AI analysis, and role-based permissions without requiring schema rewrites
- **Database**: UUID primary keys, timestamps, soft deletes on all major entities; heavy relational integrity

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PostgreSQL over NoSQL | Compliance data is highly relational; integrity constraints are critical | — Pending |
| Hybrid document model | Documents belong to entities AND appear in central library — both views needed for compliance work | — Pending |
| Trainer competency at unit level | ASQA requires unit-level evidence of competency, not qualification-level | — Pending |
| Historical snapshots on TGA change | TGA wording changes affect existing TAS and trainer mappings — must preserve what was current at time of delivery | — Pending |
| All users Super Admin at MVP | <10 internal users, RBAC adds complexity with no immediate benefit | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-18 after initialization*
