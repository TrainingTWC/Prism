# Training Audit Dashboard — Complete Documentation

> Comprehensive reference for the Training Audit Dashboard inside the **Prism** application. Covers UI structure, widgets, data flow, scoring rules, role-based access, navigation, modals, exports, the underlying Google Apps Script backend, and the audit checklist that feeds it.

---

## 1. Purpose & Scope

The Training Audit Dashboard is the analytics surface that visualizes data submitted through the **Training Audit Checklist** (filed by Trainers / Area Managers in stores). It tells the L&D and Operations teams:

- How well each **Region**, **Trainer**, **Store**, and **Section** is performing on the training audit.
- Where **zero-tolerance failures** are happening.
- Which stores need **CAPA / RCA** intervention (AI-driven).
- How scores trend over time (monthly / multi-month).
- The detailed breakdown of every audit submission down to the **question-by-question** evidence.

It is one of several dashboards (Operations, HR, QA, Finance, SHLP, Pre-Launch) hosted inside [components/Dashboard.tsx](components/Dashboard.tsx). It is selected when `dashboardType === 'training'`.

A second-generation drill-down version also lives under [src/audit-dashboard/](src/audit-dashboard/AuditDashboard.tsx) using Zustand state, breadcrumbs, and dedicated views (Region → Trainer → Section → Store → Question → Health). The main app integrates both — the Zustand navigation actions are bridged into the legacy training dashboard so clicks open both the modal and the drill-down chain.

---

## 2. Top-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        App.tsx (tabs)                            │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │  Dashboard.tsx  (dashboardType="training")                 │ │
│   │   ├─ DashboardFilters   (region/store/AM/trainer/health)   │ │
│   │   ├─ HeaderSummary      (KPI pills)                        │ │
│   │   ├─ StoreTrends        (multi-month chart)                │ │
│   │   ├─ RCACapaAnalysis    (AI insights)                      │ │
│   │   ├─ TrainingRegionPerformanceInfographic                  │ │
│   │   ├─ TrainingZeroToleranceSection                          │ │
│   │   ├─ TrainingHRPerformanceInfographic  (Trainers)          │ │
│   │   ├─ TrainingAverageScoreChart         (Sections)          │ │
│   │   ├─ TrainingRadarChart                (Sections radar)    │ │
│   │   ├─ TrainingScoreDistributionChart                        │ │
│   │   ├─ TrainingStorePerformanceChart                         │ │
│   │   ├─ TrainingHealthPieChart                                │ │
│   │   ├─ TrainingDetailModal               (drill-down modal)  │ │
│   │   ├─ TrainingHealthBreakdownModal                          │ │
│   │   └─ AuditScoreDetailsModal                                │ │
│   └────────────────────────────────────────────────────────────┘ │
│                              ▲                                   │
│                              │ navigationActions (Zustand)       │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │     src/audit-dashboard/  (drill-down v2)                  │ │
│   │       state.ts · types.ts · services/dataService.ts        │ │
│   │       views/Dashboard.tsx + Region/Trainer/Section/Store   │ │
│   └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

                ▼  fetch (URL-encoded form POST + GET reads)

┌──────────────────────────────────────────────────────────────────┐
│  Google Apps Script Web App  (training-audit-google-apps-script) │
│   doPost  → write to "Training Audit" sheet (full archive)       │
│            + "Training Audit - Last 90 Days" (working copy)      │
│   doGet   → return JSON for the dashboard                        │
└──────────────────────────────────────────────────────────────────┘
```

Endpoint used by the client (single source of truth):

```
https://script.google.com/macros/s/AKfycbw…/exec
```

Defined in [components/checklists/TrainingChecklist.tsx](components/checklists/TrainingChecklist.tsx) as `TRAINING_AUDIT_ENDPOINT`.

---

## 3. Authentication & Role-Based Access Control

User role is established at [components/Login.tsx](components/Login.tsx) and applied inside the dashboard's filter pipelines. Roles relevant to Training:

| Role | What they see |
|---|---|
| `admin` / L&D Head | All regions, all trainers, all stores |
| `training` | All regions (Training Dashboard, Training Audit, Bench Planning, Learning Analytics, Training Reports) |
| `area_manager` | Only stores under their AM ID — enforced via `canAccessAM()` |
| `hrbp` / `regional_hr` / `hr_head` | Stores covered by their HR mapping — `canAccessHR()` |
| `store` | Their own store only — `canAccessStore()` |

Role-gating happens inside the `filteredTrainingData` `useMemo` in [components/Dashboard.tsx](components/Dashboard.tsx) (around L1450).

---

## 4. The Filter Bar

Component: [components/DashboardFilters.tsx](components/DashboardFilters.tsx)

Available filters (all persistable, stack-combinable):

- **Region** — dropdown from `filtered Region list`
- **Store** — searchable dropdown of mapped stores
- **Area Manager** — AM list filtered by region
- **Trainer** — list of trainers for the **Training** dashboard (different list per dashboard type)
- **Health** — `Needs Attention` (<71%) · `Brewing` (71–85%) · `Perfect Shot` (≥86%)
- **Month** — `YYYY-MM` filter

Special CTA only on Training: **Download Store Health Card** button (visible only when `dashboardType === 'training'`).

---

## 5. KPI Header — `HeaderSummary`

Source: [src/components/dashboard/HeaderSummary.tsx](src/components/dashboard/HeaderSummary.tsx)

Four pills shown at the top of the dashboard, computed from the **multi-month trends dataset**:

| Pill | Formula |
|---|---|
| **Historic Audits** | Count of `score` rows across all observed periods |
| **Average Score** | Mean of `metric_value` across all `score` rows |
| **Store Health** | Per-store average `score` bucketed: `≥80 = healthy (green)`, `60–79 = warning (amber)`, `<60 = critical (red)` |
| **Stores Covered** | Count of unique `store_id` |

In addition the header includes:
- `ImportMetrics` (data ingestion status / CSV import button)
- Live **date range** subtitle (first → last observed period)
- Implicit gainers/losers calc (top 3 MoM up & down — used inside drill-downs)

---

## 6. Multi-Month Trends — `StoreTrends`

Source: [src/components/dashboard/StoreTrends.tsx](src/components/dashboard/StoreTrends.tsx)

Recharts line chart driven by `useTrendsData()`. Aggregates per period:

- **Avg %** line — `computePerPeriodLatestAverages(rows, 'percentage')`
- **Score Trend** — `aggregatePeriodAverages(rows, 'score')`
- **Cumulative Health Categories** per period:
  - `< 71` → Needs Attention
  - `71–85` → Brewing
  - `> 85` → Perfect Shot

The chart is **cumulative**: each month carries forward the latest known % per store, so the buckets only ever change when a new audit is filed.

Sparklines (`<Sparkline />`) are rendered inline next to each store row in drill-down lists.

---

## 7. AI Layer — `RCACapaAnalysis`

Component: `RCACapaAnalysis` (imported into Dashboard.tsx, used for `dashboardType === 'training'` and others).

Receives `trainingData` and produces:

- **Root Cause Analysis (RCA)** for low-scoring stores / sections
- **CAPA (Corrective And Preventive Action) recommendations**
- Voice-transcript interpretation hooks (see [AI_INTEGRATION_MAP.md](AI_INTEGRATION_MAP.md))

Backed by Gemini (per the AI integration map). Output is rendered as ranked, actionable cards above the visualization grid.

Other AI touch-points used in the Training dashboard family:
- `AM_SCORECARD_AI_ANALYSIS_FIX.md` patterns reused for cross-checklist scorecards.
- `AI_INSIGHTS_SETUP.md` describes the Gemini wiring and prompt strategies.

---

## 8. Visualization Widgets

All training-specific charts live in [components/](components/) and consume `filteredTrainingData`.

### 8.1 Region Performance — `TrainingRegionPerformanceInfographic`

- Card-grid of regions with average **Training % score**.
- Color thresholds: ≥80 green · 70–79 amber · <70 red.
- **Click** → opens `TrainingDetailModal` filtered by that region AND fires `navigationActions.handleRegionPerfClick(regionId)`.
- Widget id: `region-breakdown` (per spec).

### 8.2 Zero Tolerance — `TrainingZeroToleranceSection`

- Lists every audit row where `Zero Tolerance Failed === "yes"`.
- Shows store, AM, trainer, the **specific ZT items failed**, and date.
- Critical items typically include: `LMS_1` (Orientation completed in 3 days), `LMS_2` (LMS assessments), `PK_7` (key topic awareness — COFFEE / LEAST / ROAST / Dial-in / MSDS / Food Safety).

### 8.3 Trainer Performance — `TrainingHRPerformanceInfographic`

- Per-trainer aggregate: # audits, average %, last audit date.
- Sortable, top-N by score.
- Click → modal + `handleTopTrainerClick(trainerId, trainerName)`.
- Widget id: `trainer-performance`.

### 8.4 Section Average — `TrainingAverageScoreChart`

Bar chart with one bar per audit section:

| Section ID | Title | Max raw weight |
|---|---|---|
| `TrainingMaterials` | Training Materials | 9 |
| `LMS` | LMS Usage | 10 (with negative weights on LMS_1, LMS_2) |
| `Buddy` | Buddy Trainer Availability & Capability | 10 |
| `NewJoiner` | New Joiner Training & Records | 11 |
| `PartnerKnowledge` | Partner Knowledge | 16 (PK_7 has negative weight –3) |
| `TSA_Food` | TSA – Food Skill Assessment | 0 / 5 / 10 (single score) |
| `TSA_Coffee` | TSA – Coffee Skill Assessment | 0 / 5 / 10 |
| `TSA_CX` | TSA – Customer Experience | 0 / 5 / 10 |
| `CustomerExperience` | CX (CX_1 … CX_9) | 9 |
| `ActionPlan` | Action Plan (AP_1 … AP_3) | text — no score |

Click bar → modal filtered by section + `handleSectionPerfClick(sectionId)`.

### 8.5 Section Radar — `TrainingRadarChart`

Recharts radar where each axis is a section and the polygon is the audit average %. Useful for spotting balance issues.

### 8.6 Score Distribution — `TrainingScoreDistributionChart`

Histogram of `percentageScore` bands:

| Band | Bucket |
|---|---|
| 90–100 | Excellent |
| 80–89 | Good |
| 70–79 | Average |
| 60–69 | Below Average |
| 0–59 | Critical |

Click band → modal filtered by `scoreRange` + `handleScoreDistribClick(range)`.

### 8.7 Store Performance — `TrainingStorePerformanceChart`

Recharts bar chart, one bar per store, sorted descending. Click bar → store drill-down + `handleRegionStoreClick(storeId, storeName)`.

### 8.8 Store Health Pie — `TrainingHealthPieChart`

Three-slice pie:
- 🟢 Perfect Shot (≥86%)
- 🟡 Brewing (71–85%)
- 🔴 Needs Attention (<71% **or** Zero Tolerance failed)

Click slice → opens `TrainingHealthBreakdownModal`.

---

## 9. Modals

### 9.1 `TrainingDetailModal`

File: [components/TrainingDetailModal.tsx](components/TrainingDetailModal.tsx)

Universal drill-down modal. Driven by `filterType ∈ {region, trainer, section, scoreRange, store, am, hr}` and `filterValue`. Computes:

- Total submissions (filtered)
- Average %, average raw score
- Average TSA Food / Coffee / CX
- Distribution buckets (excellent/good/average/below-average)
- Region & trainer rollups
- **Section breakdown** — per-section average %
- **Question breakdown** — every question with its yes/no/% rate
- List of underlying submissions

Mobile UX:
- Swipe-down gesture closes modal (>150 px)
- Backdrop click closes
- `Esc` key closes
- Body scroll lock while open

### 9.2 `TrainingHealthBreakdownModal`

Slice-specific drill-down for the health pie (lists the stores in that bucket with their last-audit %).

### 9.3 `AuditScoreDetailsModal`

Raw-row inspector. Shows every `TrainingAuditSubmission` with its full per-question answers, signatures, and section images — used for evidence review.

---

## 10. Drill-Down Navigation (v2)

Source: [src/audit-dashboard/state.ts](src/audit-dashboard/state.ts), [src/audit-dashboard/AuditDashboard.tsx](src/audit-dashboard/AuditDashboard.tsx)

Zustand store with:

```ts
type ViewType =
  | 'DASHBOARD' | 'REGION' | 'TRAINER' | 'SECTION'
  | 'DISTRIBUTION' | 'STORE' | 'QUESTION' | 'HEALTH';

interface Filters  { regionId, areaManagerId, storeId, hrId, trainerId, dateFrom, dateTo }
interface Selection { regionId, storeId, trainerId, sectionKey, scoreRange, questionId }
```

`buildBreadcrumbs(view, params)` renders the navigation path:

```
Dashboard › Region: NORTH › Trainer: H1761 Mahadev › Store: ST123 › Section: PK › Question: PK_7
```

Click handlers exposed via `navigationActions`:

- `handleRegionPerfClick(regionId)`
- `handleTopTrainerClick(trainerId, trainerName?)`
- `handleSectionPerfClick(sectionKey)`
- `handleScoreDistribClick(range)`
- `handleRegionStoreClick(storeId, storeName?)`
- `handleQuestionDrill(questionId)`
- `handleHealthClick(storeId?)`

Documented in [TRAINING_AUDIT_CLICKABLE_FEATURES.md](TRAINING_AUDIT_CLICKABLE_FEATURES.md) and [AUDIT_DASHBOARD_IMPLEMENTATION.md](AUDIT_DASHBOARD_IMPLEMENTATION.md).

---

## 11. The Underlying Audit Checklist

Source: [components/checklists/TrainingChecklist.tsx](components/checklists/TrainingChecklist.tsx). The dashboard exists to visualize what this form captures.

### 11.1 Header / Audit Details

- **Trainer (Auditor)** — auto-filled from login (`auditorName` / `auditorId`)
- **Mapped Trainer** — designated trainer pulled from the store mapping (`mappedTrainerName` / `mappedTrainerId`)
- **Area Manager** — auto-filled from store mapping
- **Store** — searchable, geofenced (`TRAINING_GEOFENCE_RADIUS = 50 m`, `STORE_COORDINATES` source)
- **MOD (Manager on Duty)** — manual text from form (never overridden by mapping)
- **Submission Time** + **Submission ID** (UUID, idempotency key)

### 11.2 Sections (the same names you see on the dashboard)

The full question list is in [components/checklists/TrainingChecklist.tsx](components/checklists/TrainingChecklist.tsx) and summarized in [ALL_ASSESSMENT_QUESTIONS.md](ALL_ASSESSMENT_QUESTIONS.md). High-level:

1. **Training Materials** (`TM_1`–`TM_10`) — FRM/BRM availability, hot/cold cue cards, dial-in pager, playbook, MSDS, career chart.
2. **LMS Usage** (`LMS_1`–`LMS_3`) — Orientation in 3 days (w=4, **wneg=–4** ⇒ Zero Tolerance), LMS assessments (w=4 / wneg=–4), LMS habit (w=2).
3. **Buddy Trainer** (`Buddy_1`–`Buddy_6`) — 20% Buddy ratio, skill check, roster, BT workshop, 4-step training, LMS navigation.
4. **New Joiner** (`NJ_1`–`NJ_7`) — OJT book, training calendar, SHLP, FOSTAC, ASM/SM training.
5. **Partner Knowledge** (`PK_1`–`PK_7`) — comms awareness, coffee tasting, sampling, manual brewing, grooming, key topics (PK_7 ZT, w=3, wneg=–3).
6. **TSA – Food** — Personal Hygiene (3) · Station Readiness (8) · Food Prep (12) · Standards Ownership (1).
7. **TSA – Coffee** — Personal Hygiene (3) · Station Readiness (13) · Coffee Prep (26).
8. **TSA – Customer Experience** — Personal Hygiene (3) · Station Readiness (8) · Customer Handling (12).
9. **CX** (`CX_1`–`CX_9`) — service-floor checks complementing TSA-CX.
10. **Action Plan** (`AP_1`–`AP_3`) — free-text remediation plan (not scored).

### 11.3 Scoring Formula

```
sectionScore   = Σ (yes ? w : 0) − Σ (no ? |wneg| : 0)            // when wneg defined
totalScore     = Σ sectionScore  +  TSA_Food + TSA_Coffee + TSA_CX
maxScore       = Σ |w|  +  30                                     // 3 TSAs × 10
percentage     = round( totalScore / maxScore * 100 )
```

TSA values are categorical: **0 / 5 / 10** (chosen by auditor based on the per-section TSA item completion).

### 11.4 Zero Tolerance Logic

A submission is flagged `Zero Tolerance Failed = yes` if **any** of the following are answered "No":
- `LMS_1`, `LMS_2`
- `PK_7`

When flagged, the dashboard treats the store as **Needs Attention** regardless of percentage (the health pie & filter both apply this rule).

### 11.5 Evidence

Each section can attach **section images** (uploaded & saved alongside the submission). The auditor and Store Manager both **sign** the audit. Feature list per [ALL_ASSESSMENT_QUESTIONS.md](ALL_ASSESSMENT_QUESTIONS.md):

> Per-question images · Image Editor · Per-question remarks · Dual signatures (auditor + SM) · Cloud draft saving · Edit mode · Zero Tolerance · LocalStorage auto-save · Haptic feedback · Auto-fill from mapping

---

## 12. Submission Pipeline (Client → Sheet)

Client: [services/trainingAuditSubmit.ts](services/trainingAuditSubmit.ts)

| Concern | Implementation |
|---|---|
| Idempotency | `submissionId` (UUID via `crypto.randomUUID`) — server dedupes |
| Timeout | `AbortController` @ **90 s** (`DEFAULT_TIMEOUT_MS`) |
| Retries | Exponential back-off, **3 attempts**, base `4 s` ⇒ `0s, 4s, 16s` |
| Offline queue | `localStorage` key `training_audit_queue_v1` — auto-flushed on reconnect |
| Pending count | `getPendingTrainingCount()` exposed for badge UI |
| Listeners | `registerTrainingQueueListeners()` for queue change notifications |

Server: [training-audit-google-apps-script.js](training-audit-google-apps-script.js)

- `doPost(e)` parses URL-encoded form; falls back to `postData.contents`.
- Resolves the sheet (tries `Training Audit`, `Training Checklist`, `TrainingAudit`, `Training`).
- **Two-sheet architecture**:
  - `Training Audit` — full historical archive (never pruned)
  - `Training Audit - Last 90 Days` — auto-pruned working copy used by the dashboard (fast reads).
- Auto-populates Region, Store Name, Trainer Name/ID, AM Name/ID, HRBP/Regional HR/HR Head/LMS Head IDs from the **Store_mapping sheet** (single source of truth). MOD is preserved from the form input.
- Writes a fixed header row including: timestamps, identity columns, all `TM_*` `LMS_*` `Buddy_*` `NJ_*` `PK_*` `TSA_*` `CX_*` `AP_*` columns, section remarks, scoring totals, TSA remarks, auditor identity, section images URL list, `Zero Tolerance Failed` flag and items, and `TM_10`.
- Setup helper: `setupTrainingAudit()` — run once from the Apps Script editor.

---

## 13. Data Model the Dashboard Reads

Type: `TrainingAuditSubmission` (in [services/dataService.ts](services/dataService.ts))

Key fields consumed by the dashboard:

```
submissionTime  · region · storeId · storeName · amId · amName
trainerId · trainerName · auditorId · auditorName · mod
TM_1..TM_10  LMS_1..LMS_3  Buddy_1..Buddy_6
NJ_1..NJ_7   PK_1..PK_7
TSA_1 (Food) TSA_2 (Coffee) TSA_3 (CX)         // 0/5/10
CX_1..CX_9   AP_1..AP_3
TM_remarks LMS_remarks Buddy_remarks NJ_remarks PK_remarks CX_remarks AP_remarks
TSA_Food_remarks TSA_Coffee_remarks TSA_CX_remarks
totalScore · maxScore · percentageScore
zeroToleranceFailed (yes|no) · zeroToleranceItems
sectionImages (URLs)
```

The multi-month trends widgets consume a separate denormalized stream where each row has `metric_name ∈ {score, percentage}`, `metric_value`, `observed_period (YYYY-MM)`, `store_id`, `store_name`. See [src/components/dashboard/useTrendsData.ts](src/components/dashboard/useTrendsData.ts).

---

## 14. Filters Applied to `filteredTrainingData`

Implemented in `useMemo` inside [components/Dashboard.tsx](components/Dashboard.tsx) (around L1430–L1500):

1. **Role gate** — store / AM / HR access checks (`canAccessStore` / `canAccessAM` / `canAccessHR`).
2. **Region** — exact match.
3. **Store** — exact match on `storeId`.
4. **Area Manager** — normalized id match across `amId` and `am`.
5. **Trainer** — normalized id match across `trainerId`, `trainer`, fallback `hrId`.
6. **Health** — derived from `percentageScore` ± `zeroToleranceFailed`.
7. **Month** — robust date parsing (ISO, `dd/mm/yyyy ,hh:mm`) → bucketed `YYYY-MM`.

When **any filter** is active the dashboard prefers **filtered Training Audit records** over the trends roll-up to keep the visuals consistent with the user's lens.

---

## 15. Exports & Reports

- **Store Health Card** (PDF/PNG) — Training-only CTA in `DashboardFilters`. Generates a per-store health summary card (region, AM, trainer, last audit %, ZT status, top weak sections).
- **Submissions Excel/CSV export** — accessible from `AuditScoreDetailsModal` for the filtered dataset.
- **Per-store PDF** generated from the same modal (uses the existing PDF utilities used by the Campus Hiring & QA dashboards).

---

## 16. Mobile / UX Considerations

- All modals use swipe-down to close + body-scroll lock.
- Haptic feedback on form submission (`utils/haptics.ts`).
- Geofence pre-check before audit can be submitted (50 m radius, distance shown to user).
- Offline-tolerant submission queue (sec. 12).
- Cards & charts collapse to single column under `md` breakpoint.
- Dark mode supported on every widget (Tailwind `dark:` classes).

---

## 17. Permissions & Admin Configuration

- **Admin** can configure the audit fields per checklist via the Admin → **Audit Details** tab. Training-specific defaults (Area Manager, Trainer, Store Location, MOD) are documented in [AUDIT_DETAILS_PER_CHECKLIST.md](AUDIT_DETAILS_PER_CHECKLIST.md).
- Question bank for the dashboard / form lives in `TRAINING_QUESTIONS` under the runtime config (see [ADMIN_SYSTEM_CONNECTED.md](ADMIN_SYSTEM_CONNECTED.md)).
- Mappings (store ↔ AM ↔ trainer ↔ region) sourced from `comprehensive_store_mapping.json` + `trainerMapping.json`.

---

## 18. File Map (Quick Reference)

**Dashboard host & widgets**
- [components/Dashboard.tsx](components/Dashboard.tsx) — main container, `dashboardType === 'training'` branch
- [components/DashboardFilters.tsx](components/DashboardFilters.tsx) — filter bar
- [components/TrainingRegionPerformanceInfographic.tsx](components/TrainingRegionPerformanceInfographic.tsx)
- [components/TrainingHRPerformanceInfographic.tsx](components/TrainingHRPerformanceInfographic.tsx)
- [components/TrainingAverageScoreChart.tsx](components/TrainingAverageScoreChart.tsx)
- [components/TrainingRadarChart.tsx](components/TrainingRadarChart.tsx)
- [components/TrainingScoreDistributionChart.tsx](components/TrainingScoreDistributionChart.tsx)
- [components/TrainingStorePerformanceChart.tsx](components/TrainingStorePerformanceChart.tsx)
- [components/TrainingHealthPieChart.tsx](components/TrainingHealthPieChart.tsx)
- [components/TrainingZeroToleranceSection.tsx](components/TrainingZeroToleranceSection.tsx)
- [components/TrainingDetailModal.tsx](components/TrainingDetailModal.tsx)
- [components/TrainingHealthBreakdownModal.tsx](components/TrainingHealthBreakdownModal.tsx)
- [components/AuditScoreDetailsModal.tsx](components/AuditScoreDetailsModal.tsx)

**Shared header / trends**
- [src/components/dashboard/HeaderSummary.tsx](src/components/dashboard/HeaderSummary.tsx)
- [src/components/dashboard/StoreTrends.tsx](src/components/dashboard/StoreTrends.tsx)
- [src/components/dashboard/useTrendsData.ts](src/components/dashboard/useTrendsData.ts)

**Drill-down v2**
- [src/audit-dashboard/AuditDashboard.tsx](src/audit-dashboard/AuditDashboard.tsx)
- [src/audit-dashboard/state.ts](src/audit-dashboard/state.ts)
- [src/audit-dashboard/types.ts](src/audit-dashboard/types.ts)
- [src/audit-dashboard/services/dataService.ts](src/audit-dashboard/services/dataService.ts)
- [src/audit-dashboard/views/Dashboard.tsx](src/audit-dashboard/views/Dashboard.tsx)

**Submission pipeline & checklist**
- [components/checklists/TrainingChecklist.tsx](components/checklists/TrainingChecklist.tsx)
- [services/trainingAuditSubmit.ts](services/trainingAuditSubmit.ts)
- [training-audit-google-apps-script.js](training-audit-google-apps-script.js)
- [training-audit-google-apps-script-HARDENED.js](training-audit-google-apps-script-HARDENED.js)
- [google-apps-script-training-audit-api.js](google-apps-script-training-audit-api.js)

**Reference docs**
- [TRAINING_AUDIT_QUESTIONS_COMPLETE.md](TRAINING_AUDIT_QUESTIONS_COMPLETE.md)
- [TRAINING_AUDIT_CLICKABLE_FEATURES.md](TRAINING_AUDIT_CLICKABLE_FEATURES.md)
- [TRAINING_AUDIT_API_SETUP.md](TRAINING_AUDIT_API_SETUP.md)
- [AUDIT_DASHBOARD_IMPLEMENTATION.md](AUDIT_DASHBOARD_IMPLEMENTATION.md)
- [AUDIT_DETAILS_PER_CHECKLIST.md](AUDIT_DETAILS_PER_CHECKLIST.md)
- [ALL_ASSESSMENT_QUESTIONS.md](ALL_ASSESSMENT_QUESTIONS.md)
- [AI_INTEGRATION_MAP.md](AI_INTEGRATION_MAP.md)
- [4P_FRAMEWORK_MAPPING.md](4P_FRAMEWORK_MAPPING.md)

---

## 19. Health-Status Reference Card

| Status | Trigger |
|---|---|
| 🟢 **Perfect Shot** | `% ≥ 86` AND no Zero Tolerance failure |
| 🟡 **Brewing** | `71 ≤ % ≤ 85` AND no ZT failure |
| 🔴 **Needs Attention** | `% < 71` **OR** any of `LMS_1`, `LMS_2`, `PK_7` answered "No" |

These thresholds are referenced everywhere — filter bar, pie chart, store cards, RCA prioritization, and the Store Health Card export.

---

## 20. Glossary

- **TSA** — Training Skill Assessment (Food / Coffee / CX), scored 0/5/10.
- **OJT** — On-the-Job Training (book carried by trainees).
- **LMS** — Zing Learning Management System.
- **Buddy Trainer** — Certified store partner who trains new joiners.
- **MOD** — Manager on Duty at the time of the audit.
- **CAPA / RCA** — Corrective And Preventive Action / Root Cause Analysis (AI-generated).
- **Zero Tolerance** — Audit items where a "No" answer flips the entire audit to *Needs Attention*.
- **FRM / BRM** — Front-of-house / Back-of-house Resource Manuals.
- **Dial-in** — Daily espresso calibration ritual.
- **Cue Cards** — One-page hot/cold beverage build references.
- **SHLP** — Store Hospitality Leadership Programme.
- **FOSTAC** — Food Safety Training and Certification (FSSAI).
