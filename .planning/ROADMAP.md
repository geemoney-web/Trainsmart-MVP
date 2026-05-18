# Roadmap: TrainSmart Internal Compliance Platform

**Created:** 2026-05-18
**Milestone:** MVP
**Phases:** 7
**Requirements covered:** 57 / 57 ✓

---

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Foundation & RTO Dashboard | Database schema, auth, RTO CRUD, dashboard shell | RTO-01–04, DASH-01–06 | 3 |
| 2 | TGA Sync Engine | Nightly sync, manual refresh, change detection, snapshots | TGA-01–08, QUAL-01–02 | 4 |
| 3 | Qualifications, Units & TAS | Qualification/unit workspace, TAS versioning | QUAL-03–05, TAS-01–06 | 4 |
| 4 | Trainer Compliance | Trainer profiles, credentials, currency, competency mapping | TRAIN-01–07 | 3 |
| 5 | Compliance Intelligence Engine | Rule evaluation, traffic-light status, automated alerts | COMP-01–10 | 4 |
| 6 | Tasks, Documents & Validations | Workflow tasks, hybrid document library, validation tracking | TASK-01–05, DOC-01–06, VAL-01–04 | 4 |
| 7 | Notes, History & Search | Notes/email logs, activity history, global search | NOTE-01–03, SRCH-01 | 3 |

---

## Phase 1: Foundation & RTO Dashboard

**Goal:** Establish the full technical foundation — database, auth, API scaffold — and deliver a working RTO dashboard with traffic-light status placeholders and RTO CRUD.
**Mode:** standard

**Requirements:**
- RTO-01, RTO-02, RTO-03, RTO-04
- DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06

**Success Criteria:**
1. Staff can log in and see a dashboard listing all RTOs with placeholder traffic-light status
2. Staff can create a new RTO and it appears on the dashboard with auto-provisioned workspace structure
3. Navigating into an RTO workspace shows tabbed sections (Qualifications, Trainers, Documents, Tasks, Alerts, Notes) — empty but structurally correct

**Plans:**
1. Database schema — all core entities with UUID PKs, timestamps, soft deletes, relational integrity
2. Backend scaffold — FastAPI or NestJS REST API with auth, RTO CRUD endpoints, workspace provisioning
3. Frontend shell — Next.js + Tailwind dashboard layout, RTO list, traffic-light indicators, RTO workspace tabs

---

## Phase 2: TGA Sync Engine

**Goal:** Build the TGA synchronisation engine that syncs qualifications, units, elements, and performance criteria from training.gov.au, detects changes, preserves historical snapshots, and creates compliance alerts on change.

**Requirements:**
- TGA-01, TGA-02, TGA-03, TGA-04, TGA-05, TGA-06, TGA-07, TGA-08
- QUAL-01, QUAL-02

**Success Criteria:**
1. Nightly background job runs and imports updated qualification/unit data from training.gov.au
2. Staff can manually trigger a sync from the RTO workspace and see it complete
3. When a unit's wording changes, the old snapshot is preserved and a compliance alert is created
4. Staff can search training.gov.au and import a qualification with all its units into an RTO

**Plans:**
1. TGA API integration — client for training.gov.au, qualification/unit/element/PC data fetch
2. Sync engine — change detection logic, historical snapshot storage, affected-entity flagging
3. Background job scheduler — nightly cron, manual trigger endpoint, sync status tracking
4. Qualification import UI — search, import flow, RTO qualification linking

---

## Phase 3: Qualifications, Units & TAS Management

**Goal:** Deliver the full qualification and unit detail views (including historical snapshots) and the complete TAS versioning workflow.

**Requirements:**
- QUAL-03, QUAL-04, QUAL-05
- TAS-01, TAS-02, TAS-03, TAS-04, TAS-05, TAS-06

**Success Criteria:**
1. Staff can open a qualification and see its TGA sync status, all linked units, associated TAS records, and linked documents
2. Staff can view a unit with exact element and performance criteria wording and compare against previous snapshot versions
3. Staff can upload a TAS, set version/review date/status, and see it appear in both the qualification view and the RTO document library
4. Archiving a TAS preserves it; uploading a new version marks the previous one as Archived

**Plans:**
1. Qualification detail page — TGA status, units list, linked TAS, linked trainers, linked docs
2. Unit detail page — elements, performance criteria, historical snapshot viewer
3. TAS upload and versioning — file upload to object storage, version management, status transitions
4. TAS document library integration — ensure TAS records surface in global RTO document library

---

## Phase 4: Trainer Compliance

**Goal:** Build trainer profiles with full credential, industry currency, PD, and unit competency tracking, including expiry monitoring.

**Requirements:**
- TRAIN-01, TRAIN-02, TRAIN-03, TRAIN-04, TRAIN-05, TRAIN-06, TRAIN-07

**Success Criteria:**
1. Staff can create a trainer, upload TAE credentials, and see the trainer appear in the RTO trainer list
2. Staff can map a trainer to specific units with competency evidence and set expiry dates on credentials and industry currency
3. The trainer profile displays a compliance status (Green/Amber/Red) derived from evidence completeness and expiry dates
4. Staff can view a matrix of all trainers vs all units for the RTO

**Plans:**
1. Trainer profile CRUD — creation, credential upload, evidence management
2. Industry currency and PD records — evidence upload, expiry date tracking
3. Unit competency mapping — trainer-to-unit links, evidence attachment, hybrid approval model
4. Trainer compliance status evaluation — expiry logic, missing evidence detection, status display

---

## Phase 5: Compliance Intelligence Engine

**Goal:** Build the rule evaluation engine that continuously assesses all compliance data and produces traffic-light RTO status and categorised alerts.

**Requirements:**
- COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08, COMP-09, COMP-10

**Success Criteria:**
1. RTO dashboard traffic-light status (Green/Amber/Red) is computed from live data and updates when underlying records change
2. All alert types fire correctly: superseded qualifications, overdue TAS review, expired credentials, missing competency evidence, upcoming/overdue validations, missing linked documents
3. Staff can open the Compliance Alerts page and filter by severity, type, and status
4. Resolving an alert or creating a task from it updates the alert status and recalculates RTO health

**Plans:**
1. Compliance rules engine — rule definitions, evaluation logic, Green/Amber/Red calculation
2. Alert generation — all 10 alert types, deduplication, severity assignment
3. Background evaluation job — scheduled re-evaluation, triggered re-evaluation on data change
4. Alerts UI — alerts list page, filter/sort, create-task-from-alert, resolve-alert flow

---

## Phase 6: Tasks, Documents & Validations

**Goal:** Complete the workflow layer — task management linked to compliance issues, the full hybrid document library, and validation scheduling/evidence tracking.

**Requirements:**
- TASK-01, TASK-02, TASK-03, TASK-04, TASK-05
- DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06
- VAL-01, VAL-02, VAL-03, VAL-04

**Success Criteria:**
1. Staff can create a task, assign it, link it to a compliance alert, and progress it through all statuses
2. Staff can upload any document, attach it to an entity, and find it in both the entity view and the global RTO document library
3. Document library supports filtering by type, entity, status, and review date
4. Staff can schedule a validation, record completion evidence, and see it reflected in upcoming/overdue validation lists

**Plans:**
1. Task management — CRUD, status transitions, entity linking, comments
2. Document upload and library — object storage integration, metadata capture, entity attachment, library view with filters
3. Validation scheduling — validation CRUD, status management, evidence linking
4. Cross-entity document surfacing — ensure all entity views show their linked documents

---

## Phase 7: Notes, History & Search

**Goal:** Complete the platform with notes/email logging on any entity, full activity history per RTO, and global search across all entities.

**Requirements:**
- NOTE-01, NOTE-02, NOTE-03
- SRCH-01

**Success Criteria:**
1. Staff can add a note or log an email on any entity (RTO, qualification, trainer, task, alert, etc.) and see it in the entity's history tab
2. The RTO activity log shows a chronological operational history of all actions taken within the workspace
3. Global search returns relevant results across RTOs, qualifications, units, trainers, documents, and alerts

**Plans:**
1. Notes and email records — polymorphic note/email model, attach-to-any-entity UI
2. Activity logging — event capture on all major operations, activity log view per RTO
3. Global search — search index across core entities, search UI with categorised results

---

## Milestone: MVP Complete

All 57 v1 requirements delivered and verified. Platform is ready for internal TrainSmart staff use.

**Post-MVP backlog:** Audit pack generation, OCR, AI analysis, RBAC, client portals, LMS/SMS integrations.

---
*Created: 2026-05-18*
*Last updated: 2026-05-18 after initial roadmap creation*
