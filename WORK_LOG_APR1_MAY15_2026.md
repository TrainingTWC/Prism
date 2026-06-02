# Prism — Full Work Log: April 1 – May 15, 2026

> **Scope:** Every commit merged to `main` from 1 April 2026 through 15 May 2026.  
> **Repo:** `https://github.com/TrainingTWC/Prism` (branch: `main`)  
> **Deployed at:** `trainingtwc.github.io/Prism`

---

## Table of Contents

1. [Performance & Architecture](#1-performance--architecture)
2. [Training Audit](#2-training-audit)
3. [QA Audit & CAPA](#3-qa-audit--capa)
4. [Finance / Cash & Compliance Audit](#4-finance--cash--compliance-audit)
5. [Pre-Launch Audit](#5-pre-launch-audit)
6. [CF Audit & Vehicle Audit](#6-cf-audit--vehicle-audit)
7. [Vendor Audit](#7-vendor-audit)
8. [Audits Dashboard (Shared)](#8-audits-dashboard-shared)
9. [HR Dashboard & HR Audit](#9-hr-dashboard--hr-audit)
10. [TAT Tracker](#10-tat-tracker)
11. [Third Rush Feedback](#11-third-rush-feedback)
12. [Brew League / National Finals](#12-brew-league--national-finals)
13. [BT Bench Planning](#13-bt-bench-planning)
14. [Store Coordinates & Location Fixes](#14-store-coordinates--location-fixes)
15. [UI & Miscellaneous](#15-ui--miscellaneous)

---

## 1. Performance & Architecture

### Code Splitting & Lazy Loading (Apr 5)
- Split the `Dashboard` component and all 19 checklist components behind `React.lazy()` so the initial bundle no longer includes every checklist.
- Fixed the Apps Script backend to read from the correct main training sheet (was hitting a secondary sheet).

### Data Caching (Apr 5)
- Added in-memory cache to `dataService.ts` so navigating away and back to a dashboard does not re-fetch Google Sheets data.

### Map View Role Gate (Apr 5)
- Restricted the Map View tab to the `editor` role only — store/admin roles can no longer open it.

### Training Data Load Optimization (Apr 5)
- Rewrote the training data fetch to read only the main sheet with a JS-side date filter.
- Section images (heavy payload) are now skipped during the initial data load and fetched on demand when a PDF is generated.
- Also lazy-loads the store mapping instead of loading it upfront.

---

## 2. Training Audit

### Zero-Tolerance Scoring (Apr 7)
- Added zero-tolerance logic: Coffee Dial-In (`TM_5`) and all New Joiner Training questions (`NJ_1`–`NJ_7`) are now flagged as zero-tolerance items.
- If any zero-tolerance item is answered **No**, the entire audit score becomes **0%** regardless of all other answers.
- A red warning banner lists every failed ZT item at the top of the checklist.
- ZT items have an amber highlight that turns red when triggered, plus a visible **ZERO TOLERANCE** badge.
- The `zeroToleranceFailed` flag and `zeroToleranceItems` list are written to Google Sheets.
- GAS backend: added `Zero Tolerance Failed` and `Zero Tolerance Items` columns; increased `dataColCount` from 75 → 80.

### Split TM_5 → TM_5 + TM_10 (Apr 7)
- `TM_5` ("Dial-in one pager visible", weight 2) was split into two separate questions:
  - `TM_5` — "Dial-in one pager available" (weight 1)
  - `TM_10` — "Dial-in done" (weight 1)
- Both are now zero-tolerance items.
- GAS header and row-append updated; `getData` reads both new columns.

### Remarks, Images, Draft Load Fixes (Apr 7)
- **PDF**: Fixed remark key mismatch (`ZeroTolerance_ZT_1_remark` vs `ZeroTolerance_1_remark`) — now checks full `item.id` format first.
- **Edit mode**: Loads `questionRemarks` and `questionImages` from the saved submission's JSON fields instead of empty localStorage.
- **Draft load**: Fixed `data.data?.draft` → `data.draft` to match actual GAS response structure; parses JSON strings (`responsesJSON`, `questionRemarksJSON`, etc.) into objects.

### Zero-Tolerance in PDF Report (Apr 7)
- `trainingReport.ts`: `computeOverall()` now checks `ZERO_TOLERANCE_IDS` and the `zeroToleranceFailed` flag and zeros the total when ZT is triggered.

### QA PDF Image Key Mismatch Fix (Apr 8)
- Image upload used key `section.id + '_' + item.id` (e.g. `Store_S_2`) but PDF lookup used `section.id + '_' + item.id.split('_')[1]` (e.g. `Store_2`). Primary lookup never matched.
- Fixed: use `item.id` directly so the primary key matches the upload format.

### ZT Dashboard Integration (Apr 8)
- `recalculateTrainingScore` now checks ZT items and the `zeroToleranceFailed` field, forcing score to 0 when triggered.
- `TrainingHealthPieChart` updated to ZT-aware health categorization.
- All three dashboard health filter blocks and all four status computation blocks updated.
- Store Health Card Excel export also made ZT-aware.

### Training Zero-Tolerance Section in Dashboard (Apr 9)
- Added a dedicated **Training Zero Tolerance** section with filter controls, the actual raw score, and a responsive UI layout.

### Remove NJ_4 from ZT IDs (Apr 10)
- `NJ_4` was incorrectly included in `ZERO_TOLERANCE_IDS`, causing stores like DLF Avenue Mall to show 0% when `NJ_4` was answered No even though it is not a ZT item. Removed from the list.

### Remove FOSTAC (NJ_6) from ZT (Apr 9)
- `NJ_6` (FOSTAC certificate) removed from zero-tolerance items.

### Image Handling Improvements (Apr 15)
- Added auto-detect of image format from base64 header.
- Added error recovery when an image fails to render.
- Added remove button for uploaded images.
- Hid the upload button on time-based sections where images are not applicable.

### Training Audit PDF Images — On-Demand Fetch (Apr 15)
- `fetchSectionImages` is now called on demand at PDF generation time rather than at checklist open time, fixing blank images in downloaded PDFs.

### Hardened GAS Endpoint (Apr 23)
- Rewrote the training audit Apps Script with a v2 sheet strategy: uses header-name-driven column reads so column order changes in Google Sheets don't break data.
- Added `trainingAuditSubmit` client helper with retry + offline queue.
- Updated all endpoints (TrainingChecklist submit, `dataService` fetch, `useTrendsData`, AdminConfig StoreHealthExport) to the new `/exec` URL.

### Reliable Image Capture — iOS Safari Fix (May 13)
- On iOS Safari, resetting `e.target.value = ''` synchronously while a `FileReader` is still reading revokes the file handle mid-compression.
- Fixed: `URL.createObjectURL()` is now called to create a stable blob reference before clearing the input. Object URLs are revoked after `compressImage()` completes.

### Geofencing Disabled for Training Audit (May 13)
- Geolocation check bypassed for the training audit — auditors can now submit from anywhere without a GPS accuracy error.

### Store Dropdown Fix (May 13)
- The cascading trainer/AM filter on the store selector was broken, hiding stores that should have appeared. Removed the cascading filter; dropdown now shows all stores unconditionally.

### 30-Second Timeout on Image Fetch (Apr 20)
- Added a 30-second timeout to `fetchTrainingImages` so PDF generation doesn't hang forever on a slow or unresponsive GAS endpoint.

---

## 3. QA Audit & CAPA

### QA Submission Reaching Google Sheets (Apr 7)
- GAS URL (`VITE_QA_SCRIPT_URL`) was missing from GitHub Actions secrets — added to `deploy.yml`.
- Added a hardcoded fallback URL for `QA_ENDPOINT`.
- Removed `mode: 'no-cors'` from submission, draft save, and draft delete fetches.
- Added real response verification: read the GAS JSON and check the `success` flag; show actual error on failure.
- Added endpoint guard to block submission when the URL is not configured.

### QA Dashboard Data Fetch (Apr 6)
- Added `getData` handler to GAS `doGet`.
- Added `getQAData()` function with proper field mapping to the `QASubmission` TypeScript interface.
- Temporarily uncommented the autofill test button in `QAChecklist` for testing (removed later).

### CAPA/AM Review Fixes (Apr 8–9)
- Added `!authRole` guard to prevent CAPA/AM Review from fetching before the user role has been determined.
- `qa` role now sees all CAPAs/AM Reviews (same as admin/editor).
- `store` role now looks up its `store_code` from the employee directory to filter by `storeId`.
- Added `authRole` to the `useEffect` dependency array so CAPA/AM Review re-fetches after the role is set.
- Added fallback URL to `qaCapaService` for CAPA/AM Review data loading.
- Fixed dark mode hover visibility on CAPA/AM Review cards (`dark:hover:bg-slate-750` → `dark:hover:bg-slate-700`).

### Auto-Assign CAPAs to Store Managers (Apr 9)
- GAS `autoCreateFollowUps` now opens the **EMP. Master** sheet from the Employee Directory spreadsheet via `getActiveSpreadsheet().getSheetByName('EMP. Master')`.
- Expanded designation keywords to match all management roles (SM, ASM, shift incharge, cafe manager, outlet manager, etc.).
- Same fallback lookup added to the standalone `qa-capa-google-apps-script.js`.

### Consolidate CAPA into Unified GAS Script (Apr 9)
- Merged `createCAPA` and `createAMReview` as standalone POST actions into `qa-unified-google-apps-script.js`.
- Extracted `resolveStoreManagers()` into a reusable helper.
- The standalone `qa-capa-google-apps-script.js` is no longer needed.
- Frontend warning messages updated to reference `VITE_QA_SCRIPT_URL`.

### Zero Tolerance Findings in CAPA (Apr 9)
- **Root cause**: ZT questions used `'non-compliant'` while other sections used `'not-compliant'`. The frontend only checked for `'not-compliant'`, so ZT findings fell to the Partial Compliance branch.
- **GAS fix**: Normalize `'non-compliant'` → `'not-compliant'` in `autoCreateFollowUps`.
- **CAPA fix**: `normalizeFindings()` now normalizes the response before rendering.
- **AM Review fix**: Same normalization applied.
- **TypeScript**: Added `'non-compliant'` to `QAFinding.response` union type.

### QA Edit — Images, Remarks, A-Section Responses (Apr 9)
- Mapped `'Question Images JSON'` and `'Question Remarks JSON'` from Google Sheets to camelCase keys (`questionImagesJSON` / `questionRemarksJSON`).
- Fixed A-section response key mapping: `A_1` now correctly maps to `A_A_1` (matching `section.id + item.id` format used by `QA_SECTIONS`).
- Fixed the 'already formatted' detection to use `A_A_` prefix instead of `A_`.

### CAPA for Store Role (Apr 9)
- Added `qa-capa-dashboard` permission to the `store` role.
- Updated `Login.tsx` to show QA CAPA and CAPA Dashboard in the store permissions list.

### QA updateQAAudit Date Comparison Fix (Apr 13)
- Google Sheets auto-converts date strings to native `Date` objects. `updateQAAudit` used `String(dateObj)` which gives a JS-default format that never matches the `dd/MM/yyyy HH:mm:ss` rowId sent from the frontend.
- Fixed: use `Utilities.formatDate()` (same format as `getQAData`) before comparing. Also rebuilds the full row on update so question responses are saved.

### QA Success Check & Vendor Audit Fetch (Apr 13)
- Fixed QA edit/submit success check: GAS returns `status:'success'` not `success:true`, causing false failures and triple retries.
- Fixed vendor audit submission: removed `no-cors` mode, added proper response parsing and success verification.
- Fixed vendor audit draft save/delete: removed `no-cors` mode for reliable Google Sheets communication.

### Image + Remark Preservation on Edit (Apr 29)
- Fixed images and remarks disappearing when re-opening a saved QA or Training audit for editing.
- Made drafts more robust with proper error handling.
- Added PDF cache fallback for when section images can't be fetched.

### IndexedDB Image Cache for Drafts (May 8)
- Moved the QA checklist's image draft cache from `localStorage` (2–5 MB limit) to **IndexedDB** (hundreds of MB).
- Supports storing drafts with up to ~230 photos.

### CF Audit & Vehicle Audit Questions Added (May 11)
- Created `config/cfAuditQuestions.ts` — 48 questions (`CF_1`–`CF_48`) matching the GAS backend column layout.
- Created `config/vehicleAuditQuestions.ts` — 25 questions (`VA_1`–`VA_25`) matching the GAS backend.
- Replaced the broken `QA_SECTIONS` filter in `ComplianceAuditChecklist` with dedicated CF/Vehicle configs.

### QA Draft Visibility & Date Format (May 11)
- Fixed draft visibility: normalized IndexedDB key so `getDrafts` handler reliably finds saved drafts.
- Fixed incorrect dates in recent submissions: removed comma from timestamp format so `dd/MM/yyyy HH:mm:ss` is stored consistently.

### Remove CF/Vehicle Questions from QA Section (May 4)
- CF Audit and Vehicle Audit questions were erroneously rendering in the QA checklist section — removed them. QA section now shows only its 3 core QA questions.

### Hide QA CAPA and CAPA Dashboard from Store Role (Apr 16)
- Store role users can no longer see the QA CAPA list or the CAPA Dashboard tabs — they only see their store's own checklist.

### Audit Coverage Filter Fix (Apr 17)
- The **Audit Coverage & Compliance** section was initializing *all* stores from the mapping regardless of the active region/AM/trainer/store filters. This caused stores like Iris Broadway to appear as "Overdue" when a region filter was applied.
- Fixed in both the **Current Status** and **Monthly History** views by passing the main dashboard filters when building the initial store list.

---

## 4. Finance / Cash & Compliance Audit

### Rename PDF (May 6)
- The Finance audit PDF was renamed from "Finance Audit" to **"Cash and Compliance Audit"** on the cover page and in the downloaded file name.

### Mobile Layout & Camera Upload Crash (May 6)
- Fixed cramped mobile layout: added proper padding to all sections.
- Fixed a camera upload crash on mobile where the `FileList` was accessed after it had been cleared by the async geolocation call. Fixed by snapshotting the `FileList` before the `await`.

### Response Options Overhaul (May 6)
- Changed all response options from Yes/No/N-A to **Compliant / Non-Compliant / N/A** across the entire checklist.

### Zero Tolerance Removal (May 6)
- Removed all zero-tolerance criteria from the Finance checklist entirely — no ZT scoring, no ZT banner.

### PDF Score & Label Fixes (May 6)
- Fixed answer/score text overlap in the PDF — right-aligned scores with proper spacing.
- Fixed incorrect section labels appearing in the PDF.
- Fixed AM free-text field not saving.
- Fixed the review modal not closing properly.
- Session extended from 1 day → 7 days.
- Removed the automatic PDF generation that triggered on submission.

### Image Editor / Annotation (May 6)
- Added a **pencil button** on every uploaded image in the Finance checklist.
- Clicking it opens a canvas-based annotation editor (draw, mark, highlight on the image).

### Timestamp + Geotag Watermark on Images (May 6)
- Each uploaded image now has a watermark baked in at upload time showing:
  - Store name and store ID
  - Date and time of upload
  - GPS coordinates (if available)

### Finance Image Upload Fix (May 6)
- `FileList` snapshot taken before the async geolocation call prevents the "empty files" crash on iOS.

### PDF Image Aspect Ratio (May 6)
- Images in the Finance PDF now render in a **3-per-row** grid, each fitted into a 58×70 mm bounding box with correct aspect ratio (no stretching).

### ZT Questions & Grade Thresholds (May 5)
- Added `Q1` and `Q7` as zero-tolerance questions.
- Updated grade metric thresholds: green at ≥91%, amber at ≥71%, red below 71%.

### N/A Exclusion from Scoring (May 8)
- Responses marked **N/A** are now excluded from both the total achievable score and the item count. Only answered items (Compliant/Non-Compliant) affect the final percentage.

---

## 5. Pre-Launch Audit

### Initial Build (Apr 14)
- Created `config/preLaunchQuestions.ts` — 40 questions, all weight 2, max score 80.
- Created `pre-launch-audit-google-apps-script.js` — full CRUD, drafts, logging, fetch.
- Created `PreLaunchAuditChecklist.tsx` — indigo theme, signature capture, image upload.
- Wired routing in `ChecklistsAndSurveys.tsx` — added 3rd QA button with lazy import.
- Added `fetchPreLaunchData` + `PreLaunchSubmission` interface to `dataService.ts`.
- Added QA subtab selector in `Dashboard.tsx` (Store QA / Pre-Launch Audit tabs).
- Built pre-launch dashboard: regional performance, score distribution, auditor performance table.
- Added `VITE_PRE_LAUNCH_AUDIT_SCRIPT_URL` to `.env.example`.

### Connect to GAS Backend (May 1)
- Wired the checklist submission to the real GAS script URL.
- Fixed vendor audit edit mode sending the wrong action (`update` instead of `updateVendorAudit`).

### Pre-Launch Data Load Fixes (May 14)
- GAS: Added auto-insert of missing header rows so a blank sheet doesn't break fetch.
- Frontend: Fetch is now non-blocking (dashboard loads without waiting for pre-launch data).
- Shorter mobile timeout added.

### Independent Dashboard Filters (May 14)
- Pre-Launch Audit dashboard tab now has its own independent region/date/auditor filters — changing the Training or QA dashboard filters no longer affects it.

### Edit Checklist Button (May 14)
- Added an **Edit Checklist** button on the Pre-Launch Audit dashboard row so an auditor can open any past submission in edit mode directly from the dashboard.

### PDF Download on Dashboard (May 14)
- Added a **Download PDF** button on the Pre-Launch Audit dashboard that generates a formatted PDF of the selected submission.

### Fix Draft Not Appearing in Pre-Launch Audits Sheet (May 14)
- After submitting a draft, the frontend was only removing the draft from local state but never calling `deletePreLaunchAuditDraft` on the backend. The draft row remained in the "Pre-Launch Audit Drafts" sheet.
- Fixed: after a successful submission, `deletePreLaunchAuditDraft` is called on the backend.

### Submit Draft Button (May 14)
- Loading a draft set `editMode = true`, so submission called `action: 'update'` — which looked for a matching row in Pre-Launch Audits that didn't exist (the draft was only in the Drafts sheet).
- Added `forceCreate` parameter to `handleSubmit`. A new green **"Submit Draft"** button calls `handleSubmit(true)`, which always creates a new row regardless of `editMode`.

### CORS Error Treated as Success (May 14)
- GAS processes the POST and then returns a redirect. Browsers block reading the redirect response (no CORS headers) and throw `Failed to fetch`. Old code retried up to 2 times (causing duplicate rows) and eventually showed a failure alert — even though the data was already written.
- Fixed: on the *first attempt*, `Failed to fetch` is treated as a success. Retries only happen on subsequent attempts.

### Images Always Included in POST (May 14)
- Ensured `params.questionImagesJSON` is always set in the payload when images exist, even in update mode.
- On update with no new images, the field is left unset so GAS preserves the existing stored URLs.

### Images Disappearing After Refresh — Drive Upload Fix (May 14)
- **Root cause**: Google Sheets has a ~50,000 character cell limit. A single 3.6 MB base64 image JSON (~3.6M chars) silently fails to write — no error, data is just dropped.
- **Fix**: GAS now uploads images to **Google Drive** and stores the public view URL (`https://drive.google.com/uc?export=view&id=...`) in the sheet instead of the raw base64.
- New GAS functions:
  - `DRIVE_FOLDER_NAME = 'PreLaunchAuditImages'` — target folder name.
  - `getDriveFolder()` — returns or creates the Drive folder.
  - `persistImagesToDrive(questionImagesJSON, storeId, submissionRef)` — detects `data:` URLs, uploads each to Drive, returns updated JSON with Drive URLs. Already-uploaded Drive URLs pass through unchanged.
  - `uploadBase64ToDrive(dataUrl, folder, filename)` — decodes base64, creates a blob, uploads, sets sharing to `ANYONE_WITH_LINK VIEW`, returns public URL.
- `createPreLaunchAudit` and `updatePreLaunchAudit` both call `persistImagesToDrive` before writing to the sheet.
- Frontend: simplified image logic, removed `localStorage` image cache (no longer needed).

> ⚠️ **Pending**: The GAS script must be redeployed as a **New Version** in the Google Apps Script console for the Drive upload code to activate.

### Date Format Fix (May 11)
- Fixed comma in the timestamp saved by draft save and submit — now uses consistent `dd/MM/yyyy HH:mm:ss` format.

---

## 6. CF Audit & Vehicle Audit

### Initial Checklists (May 1)
- Added **CF Audit** checklist (`ComplianceAuditChecklist.tsx`) with full question set, image upload, draft management, signatures.
- Added **Vehicle Audit** checklist with same features.
- Both backed by the unified `qa-unified-google-apps-script.js` GAS backend.
- Added `VITE_CF_AUDIT_SCRIPT_URL` and `VITE_VEHICLE_AUDIT_SCRIPT_URL` to `.env.example`.

### Question Configs (May 11)
- `config/cfAuditQuestions.ts`: 48 CF questions (`CF_1`–`CF_48`).
- `config/vehicleAuditQuestions.ts`: 25 Vehicle questions (`VA_1`–`VA_25`).
- Both align with the GAS backend column definitions.

### Auto-Header Fix in GAS (May 14)
- Added auto-header insertion to CF, Vehicle, and Vendor GAS scripts — a blank sheet without a header row no longer breaks the data fetch.

---

## 7. Vendor Audit

### Image + Remark Preservation on Edit (Apr 29)
- Applied the same image and remark preservation fix from QA to the Vendor Audit checklist.

### Draft Robustness (Apr 29)
- Applied the robust draft load/save patterns from QA to the Vendor Audit checklist.

### No-CORS Removal (Apr 13)
- Removed `mode: 'no-cors'` from vendor audit draft save and delete fetches so the browser can read the GAS response and verify success.

### Edit Mode Action Fix (May 1)
- Fixed: vendor audit in edit mode was sending `action: 'update'` instead of `action: 'updateVendorAudit'`, causing the GAS to not find the update handler.

### Date Format Fix (May 11)
- Consistent `dd/MM/yyyy HH:mm:ss` timestamp format in draft save and submit.

---

## 8. Audits Dashboard (Shared)

### Initial AuditsDashboard Shell (May 1)
- Created `AuditsDashboard` component with a 4-tab shell (tab placeholders), a shared filter row (region, date, auditor), and a table skeleton.
- Added `fetchVendorAuditData`, `fetchVehicleAuditData`, `fetchCFAuditData` functions and TypeScript interfaces to `dataService.ts`.

### Vendor / Vehicle / CF Dashboards Live (May 14)
- Wired all three data sources into `Dashboard.tsx` with smart-load fetch calls.
- Added `filteredVendorAuditData`, `filteredVehicleAuditData`, `filteredCFAuditData` `useMemo` blocks with region/date/auditor filters.
- Added full dashboard UI for each:
  - 4 summary stat cards (Total Audits, Avg Score, Passing Rate, Issues Found)
  - Recent Audits table (top 50 rows) with sortable Date, Subject, Score badge
  - Color themes: teal (Vendor), sky (Vehicle), rose (CF)
  - Tab icons: building, truck, house
  - Empty state messages per type
  - Loading text for each type

---

## 9. HR Dashboard & HR Audit

### HR Audit Checklist — New Feature (Apr 14)
- Built a new **HR Audit** subsection with 5 dimensions: Attrition, Capability, Culture, Engagement, Pressure.
- 28 observation points with mixed input types (Yes/No, numeric counts, ratings, percentages).
- Real-time scoring engine with weighted composite **Store Health** score.
- Prediction engine with 4 risk alert types (e.g., "High Attrition Risk").
- HR section now has a subsection selector: **HR Connect** and **HR Audit**.
- Full draft management, signature capture, and autofill support.
- Dashboard integration: dimension averages and a submissions table.
- GAS backend with full CRUD, scoring mirroring, and draft management.

### Store Health Pie Chart (Apr 8)
- Increased pie chart size, made legend dots and text larger for better readability.

### Date Range Filter (May 11)
- Replaced the single month picker on the HR Dashboard with **From Date / To Date** pickers.
- Updated `DashboardFilters` interface: removed `month`, added `dateFrom` + `dateTo`.
- All 7 `filteredData` blocks updated to use inclusive date range comparison.
- Connect Targets and HRBP Leaderboard badge logic updated to use date range.

### Date Range in PDF Header (May 11)
- Added the selected date range to the HR PDF report header so printed reports show the exact period covered.

### Individual Submissions Table in HR PDF (May 11)
- Added a per-store submissions listing table to the HR PDF report.

### Per-Submission Q&A in HR PDF (May 11)
- Added a detailed Q&A breakdown section to the HR PDF — one block per submission showing every question, response, and score.

---

## 10. TAT Tracker

### Full TAT Dashboard (Apr 27)
- Built `TATTrackerDashboard` component with:
  - Summary stats (Total TAT entries, On-Time %, Avg days)
  - Click-through drill-downs (click a store/HRBP row to see individual entries)
  - Position Type breakdown table
  - Aligned column headers and numeric tables

### TAT Data Repair Utility (Apr 27)
- Added `repairTATData()` Apps Script function that back-fills `HRBP` and `Store` columns on existing rows by looking them up from the `Store_Mapping` sheet.
- Also upgrades old sheet headers and re-keys rows to the new header-name-driven format.

### Header-Name-Driven GAS Reads (Apr 27)
- Rewrote the TAT GAS script to read by column header name rather than by index, so column reordering in the sheet doesn't break data.

### Scorecard Crash Fix (Apr 27)
- The TAT scorecard crashed when `hrbpId` was a number instead of a string. Fixed: coerce `hrbpId` to `String` before calling `.trim()`.

### Sidebar Visibility Fix (Apr 27)
- TAT Tracker now correctly appears in the Checklists sidebar when the user has `tat-dashboard` access (was conditionally hidden).

### New GAS Deployment (Apr 27)
- Pointed the TAT dashboard to the new hardened Apps Script deployment URL.

---

## 11. Third Rush Feedback

### Full Feature Build (Apr 27)
- Built **Third Rush Feedback** checklist with three sub-sections:
  - Full Audit
  - Miscellaneous
  - Store Team Feedback
- Universal role access — all roles (admin, editor, store, qa) can submit.
- Built a **Third Rush Dashboard** showing aggregated feedback by store, region, and date.
- Wired the deployed Apps Script URL.

### Pilot Store Restriction (Apr 27)
- Store selector restricted to 4 pilot locations: Koramangala, CMH Indira Nagar, Sadashiv Nagar, Vijaya Bank Layout.

### Top-Level Tile (Apr 27)
- Surfaced Third Rush Feedback as a top-level tile in the **Checklists & Surveys** home screen alongside other audit types.

---

## 12. Brew League / National Finals

### National Finals Sensory Scoresheet (Apr 14)
- Added a sensory scoresheet component for the National Finals round of Brew League.

### Technical Scoresheet (Apr 15)
- Added a **Technical Scoresheet** tab to the National Finals section with a toggle between Sensory and Technical views.
- Rebuilt the production `dist` with the new National Finals GAS endpoint.

---

## 13. BT Bench Planning

### Candidate Self-Assessment + Trainer Skill Check (Apr 16)
- Updated BT Bench Planning workflow:
  - Candidate fills out their own self-assessment form.
  - Trainer marks attendance and completes the skill check section.
- Both steps tracked and stored via the bench planning GAS backend.

---

## 14. Store Coordinates & Location Fixes

| Date | Store | Change |
|------|-------|--------|
| Apr 7 | Forum South Bangalore | Corrected lat/lng |
| Apr 8 | Churchgate | Corrected lat/lng |
| Apr 8 | Store S240 | Updated coordinates and name |
| Apr 9 | Noida Spectrum Mall | Updated coordinates |
| Apr 10 | NXT Whitefield | Corrected coordinates |
| Apr 10 | Store S247 | Updated coordinates and name |
| Apr 13 | Store S247 | Further coordinate update |
| Apr 13 | Eco World Bay | Corrected lat/lng |
| Apr 14 | Khan Market | Updated coordinates |
| Apr 15 | Phoenix Palladium Chennai | Updated lat/lng |
| Apr 17 | Express Avenue Mall | Updated coordinates |
| Apr 17 | Various locations | Updated coordinates and names (batch) |
| Apr 17 | Store S228 | Added new coordinates |
| Apr 18 | Ashok Nagar | Added new coordinates |
| Apr 20 | Store S186 | Corrected lat/lng |
| Apr 20 | Store S193 | Corrected lat/lng |
| Apr 21 | FC Road | Updated coordinates |
| Apr 21 | PMC-Bangalore | Corrected lat/lng |
| Apr 22 | Batch update | `storeCoordinates.ts` bulk update |
| Apr 22 | Advant Noida | Updated lat/lng |
| Apr 22 | Capital CyberScape (S176) | Corrected lat/lng |
| Apr 23 | S100, S104 | Updated coordinates |
| Apr 26 | Omaxe World Street | Corrected lat/lng |
| Apr 27 | Fortis Hospital - Gurugram (S102) | Updated lat/lng |
| Apr 27 | EcoWorld 4AB | Updated coordinates |
| May 2 | Batch update | `storeCoordinates.ts` bulk update |
| May 4 | Rohini Sec 14 | Fixed coordinates |
| May 6 | Sakra Hospital | Updated coordinates |
| May 8 | Nexus Vega City | Added new coordinates |
| May 8 | Koregaan Park | Corrected coordinates |
| May 11 | Phoenix Market City - Pune | Corrected lat/lng |
| May 12 | Agra Store | Added new coordinates |
| May 13 | Inorbit Mall - Vashi | Updated coordinates |

---

## 15. UI & Miscellaneous

### Dark Mode Theme Toggle (Apr 28)
- Replaced the SVG-art sun/moon graphic with minimal `lucide-react` Sun/Moon icons for a cleaner, more consistent dark mode toggle button.

### Live Score Grid → Compact Progress Bar (Apr 15)
- Replaced the live score grid (which showed individual item scores in real time) with a compact progress bar showing overall completion percentage — cleaner and faster to render on mobile.

### PDF Remarks Overlap Fix (Apr 8)
- QA PDF: fixed remarks text overlapping answers — separated label and text lines, increased row spacing.

### Dark Mode CAPA Cards (Apr 9)
- Fixed `dark:hover:bg-slate-750` (invalid Tailwind class) → `dark:hover:bg-slate-700` on CAPA and AM Review cards. Hover was invisible in dark mode.

---

## Build & Deployment Notes

- All changes deployed to **GitHub Pages** via the `deploy.yml` GitHub Actions workflow.
- Build command: `npm run build` → `dist/` (the `dist/index.html` is committed separately for Pages).
- All GAS script URLs are set as Vite env vars (`VITE_*_SCRIPT_URL`) in GitHub Actions secrets.
- **GAS changes require a manual New Version redeployment** in the Google Apps Script console — changing the script file alone is not enough.

---

*Generated: May 15, 2026*
