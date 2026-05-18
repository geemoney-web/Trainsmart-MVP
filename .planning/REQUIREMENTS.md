# Requirements: TrainSmart Internal Compliance Platform

**Defined:** 2026-05-18
**Core Value:** Consultants can see the real-time compliance health of every RTO client in one place and act on issues before they become audit risks.

## v1 Requirements

### RTO Management (RTO)

- [ ] **RTO-01**: Staff can create a new RTO profile with name, identifiers, contacts, and operating states
- [ ] **RTO-02**: Creating an RTO automatically provisions default folders, compliance registers, validation schedules, documents area, and task area
- [ ] **RTO-03**: Staff can view a list of all RTOs on the main dashboard
- [ ] **RTO-04**: Each RTO has an isolated workspace containing qualifications, units, TAS, trainers, validations, documents, tasks, notes, and alerts

### Dashboard (DASH)

- [ ] **DASH-01**: Dashboard displays all RTOs with traffic-light compliance status (Green / Amber / Red)
- [ ] **DASH-02**: Dashboard shows unresolved alert count per RTO
- [ ] **DASH-03**: Dashboard shows upcoming validation deadlines across all RTOs
- [ ] **DASH-04**: Dashboard shows superseded qualifications requiring attention
- [ ] **DASH-05**: Dashboard shows TAS review items due
- [ ] **DASH-06**: Dashboard shows trainer compliance alerts

### TGA Sync (TGA)

- [ ] **TGA-01**: System syncs qualification data from training.gov.au on a nightly schedule
- [ ] **TGA-02**: System syncs unit data, elements, and performance criteria from training.gov.au
- [ ] **TGA-03**: Staff can manually trigger a force-refresh sync for any RTO
- [ ] **TGA-04**: On any qualification or unit change, system preserves a historical snapshot of the previous wording
- [ ] **TGA-05**: On change detection, system flags all affected TAS records
- [ ] **TGA-06**: On change detection, system flags all affected trainers mapped to changed units
- [ ] **TGA-07**: On change detection, system creates unresolved compliance alerts and updates RTO traffic-light status
- [ ] **TGA-08**: System tracks and surfaces superseded qualification status

### Qualifications & Units (QUAL)

- [ ] **QUAL-01**: Staff can search training.gov.au and import a qualification into an RTO workspace
- [ ] **QUAL-02**: Importing a qualification automatically imports all linked units, elements, and performance criteria
- [ ] **QUAL-03**: Staff can view qualification details including TGA sync status, linked units, linked TAS, linked trainers, and linked documents
- [ ] **QUAL-04**: Staff can view unit detail including exact TGA element and performance criteria wording
- [ ] **QUAL-05**: Staff can view historical snapshots of unit wording from previous TGA versions

### TAS Management (TAS)

- [ ] **TAS-01**: Staff can upload a TAS document and link it to a qualification
- [ ] **TAS-02**: TAS records support versioning — staff can upload new versions and archive old ones
- [ ] **TAS-03**: TAS records have statuses: Draft, Current, Archived
- [ ] **TAS-04**: Old TAS versions remain accessible and are never deleted
- [ ] **TAS-05**: TAS records store structured metadata: version, review date, status, linked qualifications, linked units
- [ ] **TAS-06**: TAS records appear in both the qualification view and the global RTO document library

### Trainer Compliance (TRAIN)

- [ ] **TRAIN-01**: Staff can create a trainer profile and upload formal credentials (TAE evidence)
- [ ] **TRAIN-02**: Staff can record industry currency evidence with expiry dates for each trainer
- [ ] **TRAIN-03**: Staff can record professional development records for each trainer
- [ ] **TRAIN-04**: Staff can map a trainer to specific units, recording vocational competency evidence at unit level
- [ ] **TRAIN-05**: System tracks expiry dates for credentials, industry currency, and other time-limited evidence
- [ ] **TRAIN-06**: System evaluates and displays trainer compliance status based on evidence and expiry dates
- [ ] **TRAIN-07**: Staff can view which trainers are mapped to which units across the RTO

### Compliance Intelligence (COMP)

- [ ] **COMP-01**: System evaluates compliance status and assigns Green / Amber / Red traffic-light to each RTO
- [ ] **COMP-02**: System generates alerts for superseded qualifications linked to active RTOs
- [ ] **COMP-03**: System generates alerts when TAS review dates are overdue
- [ ] **COMP-04**: System generates alerts when TAS is linked to a superseded qualification
- [ ] **COMP-05**: System generates alerts when trainer credentials expire
- [ ] **COMP-06**: System generates alerts when industry currency is overdue
- [ ] **COMP-07**: System generates alerts when trainer competency evidence is missing for mapped units
- [ ] **COMP-08**: System generates alerts when validations are upcoming or overdue
- [ ] **COMP-09**: System generates alerts when required linked documents are missing or overdue for review
- [ ] **COMP-10**: Staff can view all compliance alerts per RTO with severity, type, linked entity, due date, and status

### Tasks & Workflow (TASK)

- [ ] **TASK-01**: Staff can create internal tasks with title, description, due date, and assignee
- [ ] **TASK-02**: Tasks support statuses: Open, In Progress, Waiting on Client, Completed, Overdue, Cancelled
- [ ] **TASK-03**: Tasks can be linked to compliance alerts, qualifications, trainers, TAS, or other entities
- [ ] **TASK-04**: Staff can add comments to tasks
- [ ] **TASK-05**: Staff can view all tasks per RTO filtered by status

### Documents & Evidence (DOC)

- [ ] **DOC-01**: Staff can upload documents and link them to any entity (qualification, unit, TAS, trainer, validation, task, alert, or general RTO record)
- [ ] **DOC-02**: All documents appear in the global RTO document library regardless of which entity they are attached to
- [ ] **DOC-03**: Documents store metadata: type, version, status, review date, expiry date, linked entity, uploaded by, upload date
- [ ] **DOC-04**: Documents support the following types: TAS, Assessment Tool, Mapping Matrix, Validation Evidence, Trainer Credential, Industry Currency Evidence, PD Evidence, Policies, Procedures, General Evidence, Email Records
- [ ] **DOC-05**: Staff can archive documents; archived documents remain accessible
- [ ] **DOC-06**: Staff can filter the document library by type, entity, status, and review date

### Validations (VAL)

- [ ] **VAL-01**: Staff can schedule validations with a planned date linked to an RTO and qualification
- [ ] **VAL-02**: Staff can record completed validation evidence and mark validations as complete
- [ ] **VAL-03**: Validations support statuses: Scheduled, Completed, Archived
- [ ] **VAL-04**: Staff can view overdue and upcoming validations across the RTO

### Notes & History (NOTE)

- [ ] **NOTE-01**: Staff can add notes attached to any entity (RTO, qualification, trainer, TAS, task, alert, etc.)
- [ ] **NOTE-02**: Staff can record email correspondence linked to any entity
- [ ] **NOTE-03**: System maintains an activity log of operational history per RTO

### Search (SRCH)

- [ ] **SRCH-01**: Staff can search across RTOs, qualifications, units, trainers, documents, and alerts from a global search

## v2 Requirements

### Audit Readiness

- **AUDIT-01**: System can generate an audit pack export for an RTO
- **AUDIT-02**: System can export trainer competency matrix
- **AUDIT-03**: System can export validation evidence summary
- **AUDIT-04**: System can export TAS history per qualification

### Advanced Features

- **ADV-01**: OCR extraction of uploaded documents
- **ADV-02**: AI-assisted compliance gap analysis
- **ADV-03**: Role-based permissions (beyond Super Admin)
- **ADV-04**: Client portal for RTO clients to view their own compliance status
- **ADV-05**: LMS/SMS integration
- **ADV-06**: Email integration (auto-log inbound emails to entities)
- **ADV-07**: Advanced analytics and reporting dashboard

## Out of Scope

| Feature | Reason |
|---------|--------|
| Learner-facing features | This is an internal operations tool, not an LMS or SMS |
| Audit pack generation | Post-MVP; data structures support it but generation is deferred |
| OCR / AI document analysis | Post-MVP |
| Role-based permissions | All MVP users are Super Admin; RBAC deferred |
| Client portals | Post-MVP |
| LMS/SMS integrations | Post-MVP |
| Student management | Out of scope by design |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RTO-01 | Phase 1 | Pending |
| RTO-02 | Phase 1 | Pending |
| RTO-03 | Phase 1 | Pending |
| RTO-04 | Phase 1 | Pending |
| DASH-01 | Phase 1 | Pending |
| DASH-02 | Phase 1 | Pending |
| DASH-03 | Phase 1 | Pending |
| DASH-04 | Phase 1 | Pending |
| DASH-05 | Phase 1 | Pending |
| DASH-06 | Phase 1 | Pending |
| TGA-01 | Phase 2 | Pending |
| TGA-02 | Phase 2 | Pending |
| TGA-03 | Phase 2 | Pending |
| TGA-04 | Phase 2 | Pending |
| TGA-05 | Phase 2 | Pending |
| TGA-06 | Phase 2 | Pending |
| TGA-07 | Phase 2 | Pending |
| TGA-08 | Phase 2 | Pending |
| QUAL-01 | Phase 2 | Pending |
| QUAL-02 | Phase 2 | Pending |
| QUAL-03 | Phase 3 | Pending |
| QUAL-04 | Phase 3 | Pending |
| QUAL-05 | Phase 3 | Pending |
| TAS-01 | Phase 3 | Pending |
| TAS-02 | Phase 3 | Pending |
| TAS-03 | Phase 3 | Pending |
| TAS-04 | Phase 3 | Pending |
| TAS-05 | Phase 3 | Pending |
| TAS-06 | Phase 3 | Pending |
| TRAIN-01 | Phase 4 | Pending |
| TRAIN-02 | Phase 4 | Pending |
| TRAIN-03 | Phase 4 | Pending |
| TRAIN-04 | Phase 4 | Pending |
| TRAIN-05 | Phase 4 | Pending |
| TRAIN-06 | Phase 4 | Pending |
| TRAIN-07 | Phase 4 | Pending |
| COMP-01 | Phase 5 | Pending |
| COMP-02 | Phase 5 | Pending |
| COMP-03 | Phase 5 | Pending |
| COMP-04 | Phase 5 | Pending |
| COMP-05 | Phase 5 | Pending |
| COMP-06 | Phase 5 | Pending |
| COMP-07 | Phase 5 | Pending |
| COMP-08 | Phase 5 | Pending |
| COMP-09 | Phase 5 | Pending |
| COMP-10 | Phase 5 | Pending |
| TASK-01 | Phase 6 | Pending |
| TASK-02 | Phase 6 | Pending |
| TASK-03 | Phase 6 | Pending |
| TASK-04 | Phase 6 | Pending |
| TASK-05 | Phase 6 | Pending |
| DOC-01 | Phase 6 | Pending |
| DOC-02 | Phase 6 | Pending |
| DOC-03 | Phase 6 | Pending |
| DOC-04 | Phase 6 | Pending |
| DOC-05 | Phase 6 | Pending |
| DOC-06 | Phase 6 | Pending |
| VAL-01 | Phase 6 | Pending |
| VAL-02 | Phase 6 | Pending |
| VAL-03 | Phase 6 | Pending |
| VAL-04 | Phase 6 | Pending |
| NOTE-01 | Phase 7 | Pending |
| NOTE-02 | Phase 7 | Pending |
| NOTE-03 | Phase 7 | Pending |
| SRCH-01 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 57 total
- Mapped to phases: 57
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after initial definition*
