# Requirements: Audit Dashboard & PDF Reports

**Milestone:** 1.0 — Initial dashboard and PDF feature for Vendor, Pre-Launch, Vehicle, CF audits  
**Status:** Active

---

## Functional Requirements

### FR-1: Data Fetching

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-1.1 | `fetchVendorAuditData(forceRefresh?)` in `services/dataService.ts` — calls `?action=getVendorAuditData`, returns `VendorAuditSubmission[]` | Must Have | Not Started |
| FR-1.2 | `fetchVehicleAuditData(forceRefresh?)` in `services/dataService.ts` — calls `?action=getData`, returns `VehicleAuditSubmission[]` | Must Have | Not Started |
| FR-1.3 | `fetchCFAuditData(forceRefresh?)` in `services/dataService.ts` — calls `?action=getData`, returns `CFAuditSubmission[]` | Must Have | Not Started |
| FR-1.4 | All fetch functions use existing `fetchWithRetry` + `getCached`/`setCache` pattern | Must Have | Not Started |
| FR-1.5 | Region enrichment via `loadStoreMapping()` for Vehicle and CF (use storeId/outletId as lookup) | Should Have | Not Started |
| FR-1.6 | `fetchPreLaunchData` already exists — no change needed | Done | Existing |

### FR-2: TypeScript Types

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-2.1 | `VendorAuditSubmission` interface: `submissionTime`, `auditorName`, `auditorId`, `vendorName`, `vendorLocation`, `city`, `region`, `totalScore`, `maxScore`, `scorePercentage`, `[key: string]: string` | Must Have | Not Started |
| FR-2.2 | `VehicleAuditSubmission` interface: `submissionTime`, `auditorName`, `auditorId`, `vehicleNumber`, `city`, `region`, `totalScore`, `maxScore`, `scorePercentage`, `[key: string]: string` | Must Have | Not Started |
| FR-2.3 | `CFAuditSubmission` interface: `submissionTime`, `auditorName`, `auditorId`, `outletName`, `city`, `region`, `totalScore`, `maxScore`, `scorePercentage`, `[key: string]: string` | Must Have | Not Started |

### FR-3: Unified Audit Dashboard Component

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-3.1 | `components/checklists/AuditsDashboard.tsx` — single component with 4 tabs: Vendor, Pre-Launch, Vehicle, CF | Must Have | Not Started |
| FR-3.2 | Each tab independently fetches and displays its audit type data | Must Have | Not Started |
| FR-3.3 | Filters per tab: date range, region, store/location name, auditor name, score range (0–100%) | Must Have | Not Started |
| FR-3.4 | Filter state is per-tab (switching tabs resets filters or maintains independently) | Should Have | Not Started |
| FR-3.5 | `onBack` prop for returning to checklist landing page | Must Have | Not Started |

### FR-4: Per-Record Display

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-4.1 | Score percentage shown per record | Must Have | Not Started |
| FR-4.2 | Pass/Fail badge (threshold: ≥80% = Pass for most audits; confirm per type) | Must Have | Not Started |
| FR-4.3 | Category score breakdown (where audit has categories) | Should Have | Not Started |
| FR-4.4 | Failed items list (questions scored 0 or non-compliant) | Must Have | Not Started |
| FR-4.5 | Expandable row / detail panel for viewing full audit result | Should Have | Not Started |

### FR-5: PDF Reports

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-5.1 | `src/utils/preLaunchReport.ts` — `buildPreLaunchPDF(submission, meta, options)` | Must Have | Not Started |
| FR-5.2 | `src/utils/vendorAuditReport.ts` — `buildVendorAuditPDF(submission, meta, options)` | Must Have | Not Started |
| FR-5.3 | `src/utils/vehicleAuditReport.ts` — `buildVehicleAuditPDF(submission, meta, options)` | Must Have | Not Started |
| FR-5.4 | `src/utils/cfAuditReport.ts` — `buildCFAuditPDF(submission, meta, options)` | Must Have | Not Started |
| FR-5.5 | All PDFs: company logo in header, audit title, store/location info, date, auditor name, score summary | Must Have | Not Started |
| FR-5.6 | All PDFs: full question list with responses, category sections, score per category | Must Have | Not Started |
| FR-5.7 | All PDFs: signature lines (auditor + store/vendor signatures) | Should Have | Not Started |
| FR-5.8 | PDF style matches QA audit report (same font, colors, table layout) | Must Have | Not Started |

### FR-6: PDF Trigger Points

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-6.1 | PDF download button in `PreLaunchAuditChecklist.tsx` — available after successful submission | Must Have | Not Started |
| FR-6.2 | PDF download button in `VendorAuditChecklist.tsx` — available after successful submission | Must Have | Not Started |
| FR-6.3 | PDF download button in `ComplianceAuditChecklist.tsx` — available after submission (for both Vehicle and CF types) | Must Have | Not Started |
| FR-6.4 | PDF download button on each dashboard tab — for any historical record | Must Have | Not Started |

### FR-7: Routing & Access

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-7.1 | `AuditsDashboard` registered as `dashboardType = 'audits'` in `Dashboard.tsx` | Must Have | Not Started |
| FR-7.2 | Added to `getAvailableDashboardTypes()` in `App.tsx` | Must Have | Not Started |
| FR-7.3 | Access gated via `hasDashboardAccess('audits-dashboard')` | Must Have | Not Started |
| FR-7.4 | Added to `getAvailableChecklists()` or sidebar nav as appropriate | Should Have | Not Started |

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Data fetching uses caching (same as existing `fetchPreLaunchData`) — no redundant API calls |
| NFR-2 | PDF generation is client-side only — no server calls |
| NFR-3 | Dashboard loads skeleton/spinner while data is fetching |
| NFR-4 | Mobile-responsive layout (existing Prism dashboard is mobile-first) |
| NFR-5 | No changes to existing QA/Store Audit dashboard behaviour |

---

## UAT Criteria

| Criterion | Pass Condition |
|-----------|---------------|
| UAT-1 | Navigating to Audits Dashboard shows 4 tabs; clicking each tab loads its data | Verified by inspection |
| UAT-2 | Filtering by region narrows displayed records | Records outside region disappear |
| UAT-3 | Each record shows score%, pass/fail badge, and expandable detail | Visible in UI |
| UAT-4 | Clicking "Download PDF" on a dashboard record downloads a formatted PDF | File downloads, opens correctly |
| UAT-5 | Completing a Pre-Launch audit shows PDF button; clicking downloads PDF | File downloads |
| UAT-6 | Completing a Vendor audit shows PDF button; clicking downloads PDF | File downloads |
| UAT-7 | Completing a Vehicle audit shows PDF button; clicking downloads PDF | File downloads |
| UAT-8 | Completing a CF audit shows PDF button; clicking downloads PDF | File downloads |
| UAT-9 | PDF contains company logo, store/location info, all questions with responses | Visual check |
| UAT-10 | Users without `audits-dashboard` access cannot see the dashboard tab | Tab hidden in sidebar |
