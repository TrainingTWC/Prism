# Project: Audit Dashboard & PDF Reports

## What This Is

A unified Audit Dashboard tab and per-audit PDF report feature for the **Prism** internal tools SPA. Covers four audit types: **Vendor Audit**, **Pre-Launch Audit**, **Vehicle Audit**, and **CF Audit**.

The Store Audit (QA) already has a fully working dashboard and PDF export — this project replicates and adapts that proven pattern for the four new audit types.

## Core Value

Operations and area managers can review historical audit scores, filter by region/store/date/auditor, identify failing areas at a glance, and download branded PDF reports — all within the same Prism interface they already use.

## Context

**Tech stack:**
- React/Vite SPA deployed to GitHub Pages at `https://TrainingTWC.github.io/Prism/`
- Google Apps Script Web Apps as backends — one per audit type
- `jsPDF` + `jspdf-autotable` for PDF generation (already in-use for QA audit)
- Supabase for auth/employee data
- Role-based access via `AuthContext`

**Existing scripts:**
| Audit | Script endpoint | getData action |
|-------|----------------|---------------|
| Pre-Launch | `VITE_PRE_LAUNCH_AUDIT_SCRIPT_URL` | `getData` |
| Vendor | `VITE_VENDOR_AUDIT_SCRIPT_URL` | `getVendorAuditData` |
| Vehicle | `VITE_VEHICLE_AUDIT_SCRIPT_URL` | `getData` |
| CF | `VITE_CF_AUDIT_SCRIPT_URL` | `getData` |

**Reference implementation:** `components/checklists/QAChecklist.tsx` + `components/Dashboard.tsx` + `src/utils/qaReport.ts`

**Routing model:**
- All dashboards are rendered inside `components/Dashboard.tsx` keyed by `dashboardType` string
- Available types registered in `App.tsx → getAvailableDashboardTypes()`
- Access controlled via `hasDashboardAccess(type.id + '-dashboard')`

## Requirements

### Validated

- ✓ Google Apps Script backends deployed and returning data via `getData` — existing
- ✓ jsPDF + jspdf-autotable installed and working — existing (QA PDF)
- ✓ Store mapping service (`loadStoreMapping`) exists and enriches region — existing
- ✓ Auth + role system (`useAuth`, `hasDashboardAccess`) exists — existing
- ✓ Pre-Launch data fetch (`fetchPreLaunchData`) exists in `dataService.ts` — existing
- ✓ `ComplianceAuditChecklist.tsx` handles both Vehicle and CF — existing

### Active

- [ ] `fetchVendorAuditData` fetch function in `dataService.ts`
- [ ] `fetchVehicleAuditData` fetch function in `dataService.ts`
- [ ] `fetchCFAuditData` fetch function in `dataService.ts`
- [ ] Unified `AuditsDashboard` component with 4 tabs (Vendor / Pre-Launch / Vehicle / CF)
- [ ] Per-tab: date range filter, region filter, store/location filter, auditor name filter, score range filter
- [ ] Per-record display: percentage score, pass/fail badge, category breakdown, failed items list
- [ ] Dashboard registered in `App.tsx` routing and sidebar
- [ ] PDF report for Pre-Launch Audit (matches QA PDF style — header, scores, all questions)
- [ ] PDF report for Vendor Audit (matches QA PDF style)
- [ ] PDF report for Vehicle Audit (matches QA PDF style)
- [ ] PDF report for CF Audit (matches QA PDF style)
- [ ] PDF download button in each audit checklist (on completion/from results screen)
- [ ] PDF download button on each dashboard tab (for any historical record)
- [ ] Access control: same role gating as existing audit form access

### Out of Scope

- Supabase storage for audit data — Google Sheets is the primary store
- Edit/delete audits from the dashboard — read-only view only
- Email/share PDF — local download only
- Modifying existing QA/Store Audit dashboard — reference only
- New Google Apps Script features — scripts already have `getData`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Unified dashboard with tabs | User preference; one entry in the sidebar, switch between audit types | AuditsDashboard component with internal tab state |
| PDF style matches QA audit | User preference; consistent look across all audit PDFs | Reuse `qaReport.ts` patterns, create per-audit report utils |
| PDF in both checklist and dashboard | User preference; generate right after completion AND replay from history | Both trigger `generatePDF` — checklist uses in-memory state, dashboard fetches row data |
| Pull data from Google Sheets | User preference; scripts already deployed and tested | Fetch functions in `dataService.ts` using existing `fetchWithRetry` + cache pattern |
| Vendor audit action is `getVendorAuditData` not `getData` | Vendor script is a combined QA+Vendor script; `getData` returns QA data | `fetchVendorAuditData` calls `?action=getVendorAuditData` |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2025-07-01 after initialization*
