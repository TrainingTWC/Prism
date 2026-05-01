# Roadmap: Audit Dashboard & PDF Reports

**Milestone:** 1.0  
**Granularity:** Fine  
**Phases:** 12

---

## Phase 1 — Data Service: Fetch Functions

**Goal:** Add `fetchVendorAuditData`, `fetchVehicleAuditData`, and `fetchCFAuditData` to `services/dataService.ts`, following the exact same pattern as the existing `fetchPreLaunchData`.

**Scope:**
- `services/dataService.ts` — 3 new export functions + 3 new interfaces
- `VendorAuditSubmission` interface (vendorName, vendorLocation, 63 `VA_*` question keys)
- `VehicleAuditSubmission` interface (vehicleNumber, 25 `VA_*` question keys)
- `CFAuditSubmission` interface (outletName, 48 `CF_*` question keys)
- Each function: endpoint constant, cache key, `fetchWithRetry`, `loadStoreMapping` region enrichment

**Does not touch:** Components, PDF, routing

**Depends on:** Nothing — first phase

**UAT:** Call each fetch function from browser console via `/gsd-verify-work`; confirm array of objects returned with correct fields.

---

## Phase 2 — Shared Dashboard Infrastructure

**Goal:** Create the `AuditsDashboard` shell component with tab navigation, shared filter UI, shared table layout, and loading/empty states — no real data yet (uses mock or empty arrays).

**Scope:**
- `components/checklists/AuditsDashboard.tsx` — new file
- Tab bar: Vendor | Pre-Launch | Vehicle | CF
- Shared filter row: date range, region, store/location, auditor name, score range
- Shared results table: columns vary per tab but layout is consistent
- Loading spinner + empty state message
- `onBack` prop wired to back button

**Does not touch:** Data service, routing, PDF

**Depends on:** Phase 1 (types needed for props)

---

## Phase 3 — Pre-Launch Audit Tab (Data + Display)

**Goal:** Wire the Pre-Launch tab in `AuditsDashboard` to `fetchPreLaunchData` and display real records with filtering.

**Scope:**
- Pre-Launch tab data fetching inside `AuditsDashboard`
- Filter logic: date range, region, store name, auditor name, score range
- Table columns: Date, Store Name, Store ID, Auditor, Score %, Pass/Fail
- Expandable row detail: full score breakdown by section (PL_1–PL_40 grouped)
- Failed items list in expanded view

**Does not touch:** Other tabs, PDF, routing

**Depends on:** Phase 1, Phase 2

---

## Phase 4 — Vendor Audit Tab (Data + Display)

**Goal:** Wire the Vendor tab in `AuditsDashboard` to `fetchVendorAuditData` and display real records.

**Scope:**
- Vendor tab data fetching inside `AuditsDashboard`
- Filter logic: date range, region, vendor location, auditor name, score range
- Table columns: Date, Vendor Name, Location, Auditor, Score %, Pass/Fail
- Expandable row detail: category breakdown (Zero Tolerance, Design/Facilities, etc.), failed items
- Pass threshold: configurable (suggest ≥80%)

**Does not touch:** Other tabs, PDF, routing

**Depends on:** Phase 1, Phase 2

---

## Phase 5 — Vehicle Audit Tab (Data + Display)

**Goal:** Wire the Vehicle tab in `AuditsDashboard` to `fetchVehicleAuditData` and display real records.

**Scope:**
- Vehicle tab data fetching inside `AuditsDashboard`
- Filter logic: date range, region, vehicle number, auditor name, score range
- Table columns: Date, Vehicle Number, City, Auditor, Score %, Pass/Fail
- Expandable row detail: 25 question breakdown, failed items

**Does not touch:** Other tabs, PDF, routing

**Depends on:** Phase 1, Phase 2

---

## Phase 6 — CF Audit Tab (Data + Display)

**Goal:** Wire the CF tab in `AuditsDashboard` to `fetchCFAuditData` and display real records.

**Scope:**
- CF tab data fetching inside `AuditsDashboard`
- Filter logic: date range, region, outlet/CF name, auditor name, score range
- Table columns: Date, Outlet/CF Name, City, Auditor, Score %, Pass/Fail
- Expandable row detail: 48 question breakdown by section, failed items

**Does not touch:** Other tabs, PDF, routing

**Depends on:** Phase 1, Phase 2

---

## Phase 7 — Routing & Access Control

**Goal:** Register `AuditsDashboard` in the app's routing system and add it to the sidebar navigation with correct access gating.

**Scope:**
- `components/Dashboard.tsx` — add `audits` case to dashboard type switch, render `<AuditsDashboard>`
- `App.tsx → getAvailableDashboardTypes()` — add `{ id: 'audits', label: 'Audit Reports' }`
- `App.tsx → getAvailableChecklists()` — add `{ id: 'audits-dashboard', label: 'Audit Dashboard' }` (checklist route to open dashboard)
- Access check: `hasDashboardAccess('audits-dashboard')`
- Confirm sidebar entry appears and navigation works end-to-end

**Does not touch:** PDF, data fetching internals

**Depends on:** Phase 2 (AuditsDashboard component must exist)

---

## Phase 8 — Pre-Launch PDF Report

**Goal:** Create `src/utils/preLaunchReport.ts` — `buildPreLaunchPDF()` — and add a "Download PDF" button to `PreLaunchAuditChecklist.tsx` (post-submission) and to the Pre-Launch tab in `AuditsDashboard`.

**Scope:**
- `src/utils/preLaunchReport.ts` — new file modeled on `qaReport.ts`
  - Header: company logo, "Pre-Launch Audit Report", store name/ID, date, auditor
  - Score summary table: total score, max score, percentage, pass/fail
  - Questions table: all 40 PL_* questions, each row: question text + response + remarks
- `PreLaunchAuditChecklist.tsx` — add `generatePDF` after submission success, using in-memory state
- `AuditsDashboard.tsx` Pre-Launch tab — add per-row "Download PDF" button, fetch full row data from script

**Depends on:** Phase 3 (data structure must be known)

---

## Phase 9 — Vendor Audit PDF Report

**Goal:** Create `src/utils/vendorAuditReport.ts` — `buildVendorAuditPDF()` — and add PDF button to `VendorAuditChecklist.tsx` and Vendor tab in `AuditsDashboard`.

**Scope:**
- `src/utils/vendorAuditReport.ts` — new file
  - Header: logo, "Vendor Audit Report", vendor name, location, date, auditor
  - Score summary by category (Zero Tolerance, Design/Facilities, etc.)
  - Full 63-question table grouped by category
- `VendorAuditChecklist.tsx` — add `generatePDF` after submission success
- `AuditsDashboard.tsx` Vendor tab — add per-row PDF button

**Depends on:** Phase 4

---

## Phase 10 — Vehicle Audit PDF Report

**Goal:** Create `src/utils/vehicleAuditReport.ts` — `buildVehicleAuditPDF()` — and add PDF button to `ComplianceAuditChecklist.tsx` (Vehicle type) and Vehicle tab in `AuditsDashboard`.

**Scope:**
- `src/utils/vehicleAuditReport.ts` — new file
  - Header: logo, "Vehicle Audit Report", vehicle number, city, date, auditor
  - Score summary + full 25-question table
- `ComplianceAuditChecklist.tsx` — add `generatePDF` when `auditType === 'vehicle'`, available after submission
- `AuditsDashboard.tsx` Vehicle tab — add per-row PDF button

**Depends on:** Phase 5

---

## Phase 11 — CF Audit PDF Report

**Goal:** Create `src/utils/cfAuditReport.ts` — `buildCFAuditPDF()` — and add PDF button to `ComplianceAuditChecklist.tsx` (CF type) and CF tab in `AuditsDashboard`.

**Scope:**
- `src/utils/cfAuditReport.ts` — new file
  - Header: logo, "CF Audit Report", outlet/CF name, city, date, auditor
  - Score summary + full 48-question table grouped by section
- `ComplianceAuditChecklist.tsx` — add `generatePDF` when `auditType === 'cf'`, available after submission
- `AuditsDashboard.tsx` CF tab — add per-row PDF button

**Depends on:** Phase 6

---

## Phase 12 — Integration Verification & Polish

**Goal:** End-to-end verification of all tabs + PDFs + routing. Fix any integration issues, add loading error states, and confirm all UAT criteria pass.

**Scope:**
- Test all 4 dashboard tabs render with real data
- Test all 4 PDF downloads (from checklist + from dashboard)
- Test filter combinations across all tabs
- Verify access control (unauthorized users can't see dashboard)
- Fix any issues surfaced during testing
- Update `PROJECT.md` — move Active requirements to Validated

**Depends on:** All previous phases

---

## Phase Status

| # | Phase | Status | Plans |
|---|-------|--------|-------|
| 1 | Data Service: Fetch Functions | ✅ Complete | 01-01-PLAN.md |
| 2 | Shared Dashboard Infrastructure | Not Started | 02-01-PLAN.md |
| 3 | Pre-Launch Audit Tab (Data + Display) | Not Started | 03-01-PLAN.md |
| 4 | Vendor Audit Tab (Data + Display) | Not Started | — |
| 5 | Vehicle Audit Tab (Data + Display) | Not Started | — |
| 6 | CF Audit Tab (Data + Display) | Not Started | — |
| 7 | Routing & Access Control | Not Started | — |
| 8 | Pre-Launch PDF Report | Not Started | — |
| 9 | Vendor Audit PDF Report | Not Started | — |
| 10 | Vehicle Audit PDF Report | Not Started | — |
| 11 | CF Audit PDF Report | Not Started | — |
| 12 | Integration Verification & Polish | Not Started | — |
