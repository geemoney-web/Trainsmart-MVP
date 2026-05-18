# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TrainSmart Internal Compliance Platform** — an internal-only compliance operations platform for managing Registered Training Organisation (RTO) clients under ASQA and SRTO 2025 requirements.

This is NOT an LMS, SMS, or learner-facing product. It is a **compliance intelligence platform** for internal TrainSmart staff only (<10 concurrent users initially).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | FastAPI or NestJS (REST API) |
| Database | PostgreSQL (UUID PKs, soft deletes, relational integrity) |
| File Storage | S3-compatible object storage (never store files in DB) |
| Background Jobs | Worker queue (TGA sync, compliance evaluations, alerts, reminders) |
| Deployment | Dockerised, VPS or cloud |

## MVP Build Order

Build in this sequence — each layer depends on the previous:

1. Database schema
2. Authentication
3. RTO dashboard
4. RTO workspace
5. TGA sync engine
6. Qualification/unit pages
7. TAS management
8. Trainer management
9. Compliance rules engine
10. Alerts
11. Tasks
12. Documents
13. Notes/history
14. Validation tracking

## Architecture

### Core Modules

- **Dashboard** — RTO list with traffic-light compliance status, unresolved alerts, upcoming validations
- **RTO Workspace** — isolated compliance workspace per RTO (qualifications, units, TAS, trainers, validations, documents, tasks, notes, alerts)
- **TGA Sync Engine** — nightly + manual sync of qualifications, units, training packages, elements, and performance criteria from training.gov.au; preserves historical snapshots on every change
- **TAS Management** — versioned TAS uploads with statuses: `Draft`, `Current`, `Archived`; old versions remain accessible
- **Trainer Compliance** — credentials, TAE evidence, vocational competency, industry currency, PD records, unit competency mappings at the UNIT level with expiry tracking
- **Compliance Intelligence Engine** — evaluates superseded qualifications, TAS review dates, trainer expiry, missing mappings; outputs traffic-light status (`Green`/`Amber`/`Red`) and unresolved alerts
- **Workflow & Tasks** — internal tasks with statuses: `Open`, `In Progress`, `Waiting on Client`, `Completed`, `Overdue`, `Cancelled`
- **Documents & Evidence** — hybrid model: documents belong to entities AND appear in a central RTO document library

### Database Key Entities

RTOs → RTO Qualifications → Qualifications (TGA-synced) → Units → Unit Elements → Performance Criteria

Trainers → Trainer Credentials, Trainer Unit Competencies, Industry Currency Records, PD Records

TAS Documents → linked to Qualifications + Units

Validations, Documents, Files, Compliance Rules, Compliance Alerts, Tasks, Notes, Activity Logs

All entities: UUID PKs, created/updated timestamps, soft delete where appropriate.

### Compliance Logic

- **Green**: no critical alerts, no overdue issues
- **Amber**: upcoming review dates, upcoming expiries, warnings
- **Red**: critical unresolved issues, overdue validations, expired credentials, unresolved superseded qualifications

### TGA Sync Behaviour

On detecting a qualification/unit change: preserve historical snapshot → flag affected TAS → flag affected trainers → flag affected documents → create unresolved alerts → update RTO compliance status.

### Document Architecture

Hybrid: documents are attached to a specific entity (qualification, unit, TAS, trainer, validation, task, alert, or general RTO record) AND surfaced in the global RTO document library. Every document stores: version, status, review date, expiry date, linked entity, uploaded by, upload date.

## Build Principles

1. **Structured data over generic files** — model relationships between qualifications, units, TAS, trainers, validations, documents, and alerts explicitly.
2. **Compliance intelligence first** — the system actively evaluates health; do not build a passive document store.
3. **Never overwrite historical records** — TAS versions, qualification wording, unit wording, and evidence history must remain accessible.
4. **Relational linking** — documents, alerts, tasks, and notes must be attachable to any entity type.
5. **Future-proof architecture** — data structures must support future OCR, AI analysis, audit pack generation, and role-based permissions without requiring schema rewrites.

## What to Avoid

- Generic CMS-style structures
- Storing files directly in the database
- Hardcoding assumptions that prevent future scaling
- Premature microservices or over-engineering for MVP
- Audit pack generation (post-MVP, but data structures must support it)

## Post-MVP Features (Do Not Build Yet — Architecture Must Support)

OCR document extraction, AI-assisted compliance analysis, audit pack generation, automated trainer matrix generation, role-based permissions, client portals, LMS/SMS integrations, email integration, advanced search, analytics and reporting.
