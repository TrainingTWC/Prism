# QA Dynamic CAPA Checklists — Detailed Implementation Plan

## Overview

When a QA checklist is submitted, all points marked as **Non-Compliance** or **Partial Compliance** will automatically generate **two new dynamic checklists**:

1. **QA AM Review Checklist** — Assigned to the Area Manager (AM) of the audited store
2. **QA CAPA Checklist** — Assigned to the Store Manager / Shift Manager / Assistant Store Manager of the audited store

---

## Data Sources & Resolution

### 1. Area Manager (AM) — Already Available
- The QA checklist already captures `amName` and `amId` in the submission metadata
- Source: Store Mapping via `loadComprehensiveMapping()` → `ComprehensiveMapping.amId` / `ComprehensiveMapping.amName`
- No additional lookup needed

### 2. Store Manager / Shift Manager / ASM — From Employee Directory
- Source: `fetchEmployeeDirectory()` from `employeeDirectoryService.ts`
- Resolution path:
  - Take the `storeId` from the QA submission
  - Filter the Employee Directory where `store_code` matches `storeId`
  - Filter by `designation` containing: `"Store Manager"`, `"Shift Manager"`, `"Assistant Store Manager"` (case-insensitive)
- Returns: Array of `{ employee_code, empname, designation }` for the store's management team

---

## Architecture

### A. Frontend Flow (QAChecklist.tsx → handleSubmit)

```
QA Checklist Submitted
        │
        ▼
Extract Non-Compliance & Partial Compliance Items
        │
        ▼
┌───────┴────────┐
│                │
▼                ▼
POST to           POST to
QA_AM_Review      QA_CAPA
Google Sheet      Google Sheet
(AM endpoint)     (CAPA endpoint)
```

**Trigger Point:** Inside `handleSubmit()` in `QAChecklist.tsx`, immediately after the main QA submission succeeds (after `submitted = true`).

### B. What Gets Extracted

For each question where `response === 'not-compliant'` OR `response === 'partially-compliant'`:

| Field | Source |
|-------|--------|
| `questionId` | e.g., `ZeroTolerance_ZT_1`, `Store_S_5` |
| `questionText` | From `QA_SECTIONS[].items[].q` |
| `sectionName` | From `QA_SECTIONS[].title` (e.g., "Zero Tolerance", "Store") |
| `response` | `"not-compliant"` or `"partially-compliant"` |
| `weight` | From `QA_SECTIONS[].items[].w` |
| `remark` | From `questionRemarks[questionId]` (if any) |

### C. Shared Metadata (Included in Both Checklists)

| Field | Source |
|-------|--------|
| `qaSubmissionTime` | Timestamp of the original QA submission |
| `qaAuditorName` | `meta.qaName` |
| `qaAuditorId` | `meta.qaId` |
| `storeName` | `meta.storeName` |
| `storeId` | `meta.storeId` |
| `city` | `meta.city` |
| `region` | Detected from store mapping |
| `totalNonCompliance` | Count of non-compliant items |
| `totalPartialCompliance` | Count of partially-compliant items |
| `qaScorePercentage` | Original QA score % |

---

## Checklist 1: QA AM Review

### Purpose
The Area Manager reviews all non-compliance/partial compliance findings from the QA audit and acknowledges them. The AM can add their own observations and set priority/timeline.

### Assigned To
- **AM Name**: `meta.amName`
- **AM ID**: `meta.amId`

### Google Sheet: `QA AM Review`

#### Sheet Columns

| Column | Field | Description |
|--------|-------|-------------|
| A | `timestamp` | Auto-generated server timestamp |
| B | `qaSubmissionTime` | Original QA submission timestamp (links back) |
| C | `qaAuditorName` | Who performed the QA audit |
| D | `qaAuditorId` | QA auditor employee ID |
| E | `amName` | Area Manager name |
| F | `amId` | Area Manager ID |
| G | `storeName` | Audited store name |
| H | `storeId` | Audited store ID |
| I | `city` | City |
| J | `region` | Region |
| K | `qaScore` | Original QA score % |
| L | `totalFindings` | Total NC + PC items |
| M | `status` | `Open` / `In Progress` / `Closed` |
| N | `findingsJSON` | JSON array of all flagged items |

**findingsJSON structure:**
```json
[
  {
    "questionId": "Store_S_5",
    "section": "Store",
    "question": "Area below shelves and machinery is clean...",
    "response": "not-compliant",
    "weight": 2,
    "remark": "Dust accumulation noticed",
    "amAction": "",
    "amPriority": "",
    "amTargetDate": ""
  }
]
```

### UI Component: `QAAMReviewChecklist.tsx`

- **Access:** Area Managers see a new section in Checklists & Surveys (or a notification badge)
- **View:** Table of all flagged items from a specific QA audit
- **Actions per item:**
  - Acknowledge (checkbox)
  - Add AM Observation (text)
  - Set Priority (High / Medium / Low)
  - Set Target Closure Date
- **Bulk Actions:**
  - "Acknowledge All" button
  - "Submit Review" — updates the Google Sheet row status to `In Progress`

---

## Checklist 2: QA CAPA (Corrective & Preventive Action)

### Purpose
The Store Manager / Shift Manager / ASM fills in:
- **Root Cause** for each finding
- **Corrective Action** taken (immediate fix)
- **Preventive Action** planned (long-term fix)
- **Target Date** for closure
- **Evidence** (optional photo upload)

### Assigned To
Resolved dynamically from Employee Directory:

```typescript
const storeManagement = employeeDirectory.filter(emp =>
  emp.store_code === storeId &&
  ['store manager', 'shift manager', 'assistant store manager'].includes(
    (emp.designation || '').toLowerCase().trim()
  )
);
```

All matching employees are listed as assignees. Any of them can fill the CAPA.

### Google Sheet: `QA CAPA`

#### Sheet Columns

| Column | Field | Description |
|--------|-------|-------------|
| A | `timestamp` | Auto-generated server timestamp |
| B | `qaSubmissionTime` | Original QA submission time (linkage) |
| C | `qaAuditorName` | QA auditor name |
| D | `qaAuditorId` | QA auditor ID |
| E | `storeName` | Store name |
| F | `storeId` | Store ID |
| G | `city` | City |
| H | `region` | Region |
| I | `amName` | Area Manager name |
| J | `amId` | Area Manager ID |
| K | `assignedToNames` | Comma-separated SM/Shift/ASM names |
| L | `assignedToIds` | Comma-separated SM/Shift/ASM IDs |
| M | `qaScore` | Original QA score % |
| N | `totalFindings` | Total NC + PC items |
| O | `status` | `Open` / `In Progress` / `Closed` |
| P | `capaSubmittedBy` | Name of person who filled CAPA |
| Q | `capaSubmittedById` | ID of person who filled CAPA |
| R | `capaSubmissionTime` | When CAPA was submitted |
| S | `findingsJSON` | JSON array with CAPA details |

**findingsJSON structure:**
```json
[
  {
    "questionId": "Store_S_5",
    "section": "Store",
    "question": "Area below shelves and machinery is clean...",
    "response": "not-compliant",
    "weight": 2,
    "qaRemark": "Dust accumulation noticed",
    "rootCause": "",
    "correctiveAction": "",
    "preventiveAction": "",
    "targetDate": "",
    "evidenceImageCount": 0,
    "closedDate": "",
    "closedBy": ""
  }
]
```

### UI Component: `QACAPAChecklist.tsx`

- **Access:** Store Managers / Shift Managers / ASMs see pending CAPAs in their Checklists view
- **View:** Card-based or table layout showing each finding
- **For each finding, user fills:**
  - Root Cause (required text)
  - Corrective Action (required text)
  - Preventive Action (required text)
  - Target Closure Date (required date picker)
  - Evidence photo (optional — via ImageEditor component, already in codebase)
- **Submit CAPA:** Updates the Google Sheet row with filled data + sets status to `In Progress`
- **Close CAPA:** AM or QA auditor can close individual items or the entire CAPA after verification

---

## Implementation Steps

### Phase 1: Backend (Google Apps Script)

#### Step 1.1: Create `QA AM Review` Sheet + Script

New Google Apps Script (or add to existing QA script):

```javascript
function doPost(e) {
  const params = e.parameter;
  const action = params.action || 'create';

  if (action === 'createAMReview') {
    // Create new AM Review row
    const sheet = getOrCreateSheet('QA AM Review');
    const row = [
      new Date(),                    // timestamp
      params.qaSubmissionTime,
      params.qaAuditorName,
      params.qaAuditorId,
      params.amName,
      params.amId,
      params.storeName,
      params.storeId,
      params.city,
      params.region,
      params.qaScore,
      params.totalFindings,
      'Open',                        // initial status
      params.findingsJSON
    ];
    sheet.appendRow(row);
  }

  if (action === 'createCAPA') {
    // Create new CAPA row
    const sheet = getOrCreateSheet('QA CAPA');
    const row = [
      new Date(),
      params.qaSubmissionTime,
      params.qaAuditorName,
      params.qaAuditorId,
      params.storeName,
      params.storeId,
      params.city,
      params.region,
      params.amName,
      params.amId,
      params.assignedToNames,
      params.assignedToIds,
      params.qaScore,
      params.totalFindings,
      'Open',
      '', '', '',                    // CAPA submitter fields (filled later)
      params.findingsJSON
    ];
    sheet.appendRow(row);
  }

  if (action === 'updateAMReview' || action === 'updateCAPA') {
    // Find row by qaSubmissionTime + storeId, update findingsJSON and status
  }

  if (action === 'getAMReviews') {
    // Return all AM Reviews for a specific amId
  }

  if (action === 'getCAPAs') {
    // Return all CAPAs for a specific storeId or assignee
  }
}
```

#### Step 1.2: Create `QA CAPA` Sheet + Script

Same script file, different action handlers (see above). Single endpoint, action-based routing.

**Google Apps Script Endpoint:** Deploy as new web app or add action routing to the existing QA endpoint.

### Phase 2: Frontend — Extraction & Submission Logic

#### Step 2.1: Create `qaCapaService.ts`

New service file: `services/qaCapaService.ts`

```typescript
import { QA_SECTIONS } from '../config/qaQuestions';
import { fetchEmployeeDirectory } from './employeeDirectoryService';

export interface QAFinding {
  questionId: string;
  section: string;
  question: string;
  response: 'not-compliant' | 'partially-compliant';
  weight: number;
  remark: string;
}

export function extractFindings(
  responses: Record<string, string>,
  questionRemarks: Record<string, string>
): QAFinding[] {
  const findings: QAFinding[] = [];

  for (const section of QA_SECTIONS) {
    for (const item of section.items) {
      const key = `${section.id}_${item.id}`;
      const response = responses[key];

      if (response === 'not-compliant' || response === 'partially-compliant') {
        findings.push({
          questionId: key,
          section: section.title,
          question: item.q,
          response,
          weight: item.w,
          remark: questionRemarks[key] || ''
        });
      }
    }
  }

  return findings;
}

export async function resolveStoreManagement(storeId: string) {
  const directory = await fetchEmployeeDirectory();
  const normalizedStoreId = storeId.toUpperCase().trim();

  const managers = Object.values(directory.byId).filter(emp => {
    const empStore = (emp.store_code || '').toUpperCase().trim();
    const designation = (emp.designation || '').toLowerCase().trim();
    return empStore === normalizedStoreId &&
      ['store manager', 'shift manager', 'assistant store manager'].includes(designation);
  });

  return managers;
}

export async function submitAMReview(payload: {
  qaSubmissionTime: string;
  qaAuditorName: string;
  qaAuditorId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
  city: string;
  region: string;
  qaScore: string;
  findings: QAFinding[];
}) {
  const CAPA_ENDPOINT = import.meta.env.VITE_QA_CAPA_SCRIPT_URL || '';
  const params = new URLSearchParams({
    action: 'createAMReview',
    qaSubmissionTime: payload.qaSubmissionTime,
    qaAuditorName: payload.qaAuditorName,
    qaAuditorId: payload.qaAuditorId,
    amName: payload.amName,
    amId: payload.amId,
    storeName: payload.storeName,
    storeId: payload.storeId,
    city: payload.city,
    region: payload.region,
    qaScore: payload.qaScore,
    totalFindings: String(payload.findings.length),
    findingsJSON: JSON.stringify(payload.findings)
  });

  await fetch(CAPA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    mode: 'no-cors'
  });
}

export async function submitCAPA(payload: {
  qaSubmissionTime: string;
  qaAuditorName: string;
  qaAuditorId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
  city: string;
  region: string;
  qaScore: string;
  findings: QAFinding[];
  assignedToNames: string;
  assignedToIds: string;
}) {
  const CAPA_ENDPOINT = import.meta.env.VITE_QA_CAPA_SCRIPT_URL || '';
  const params = new URLSearchParams({
    action: 'createCAPA',
    ...payload,
    totalFindings: String(payload.findings.length),
    findingsJSON: JSON.stringify(payload.findings)
  });

  await fetch(CAPA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    mode: 'no-cors'
  });
}
```

#### Step 2.2: Integrate into `handleSubmit` in `QAChecklist.tsx`

After the main QA submission succeeds:

```typescript
// --- After submitted = true ---

// Extract non-compliance / partial compliance findings
const findings = extractFindings(responses, questionRemarks);

if (findings.length > 0) {
  // 1. Submit AM Review checklist
  await submitAMReview({
    qaSubmissionTime: params.submissionTime,
    qaAuditorName: meta.qaName,
    qaAuditorId: meta.qaId,
    amName: meta.amName,
    amId: meta.amId,
    storeName: meta.storeName,
    storeId: correctedStoreId,
    city: meta.city,
    region: detectedRegion,
    qaScore: String(scorePercentage),
    findings
  });

  // 2. Resolve store management team
  const storeManagers = await resolveStoreManagement(correctedStoreId);
  const assignedNames = storeManagers.map(m => m.empname).join(', ');
  const assignedIds = storeManagers.map(m => m.employee_code).join(', ');

  // 3. Submit CAPA checklist
  await submitCAPA({
    qaSubmissionTime: params.submissionTime,
    qaAuditorName: meta.qaName,
    qaAuditorId: meta.qaId,
    amName: meta.amName,
    amId: meta.amId,
    storeName: meta.storeName,
    storeId: correctedStoreId,
    city: meta.city,
    region: detectedRegion,
    qaScore: String(scorePercentage),
    findings,
    assignedToNames: assignedNames,
    assignedToIds: assignedIds
  });

  console.log(`📋 Created AM Review (${findings.length} items) + QA CAPA for ${assignedNames}`);
}
```

### Phase 3: Frontend — New Checklist UI Components

#### Step 3.1: `QAAMReviewChecklist.tsx`

- Fetches open AM Reviews for the logged-in AM (`action=getAMReviews&amId=XXX`)
- Displays as a list of audits (grouped by store + date)
- Expanding an audit shows the table of findings
- AM can acknowledge, add observations, set priority/timeline per item
- Submit updates back to Google Sheet

#### Step 3.2: `QACAPAChecklist.tsx`

- Fetches open CAPAs for the logged-in user or their store (`action=getCAPAs&storeId=XXX`)
- Displays findings with input fields for:
  - Root Cause
  - Corrective Action
  - Preventive Action
  - Target Date
  - Evidence Photo (reuses `ImageEditor` component)
- Submit CAPA back to Google Sheet
- Status progression: `Open` → `In Progress` → `Closed`

#### Step 3.3: Register in `ChecklistsAndSurveys.tsx`

Add the two new checklist types to `ChecklistType` union and the checklist array:

```typescript
type ChecklistType = '... | qa-am-review | qa-capa';

// In getAvailableChecklists():
{ id: 'qa-am-review', label: 'QA AM Review', icon: ClipboardCheck, color: 'bg-rose-500' },
{ id: 'qa-capa', label: 'QA CAPA', icon: AlertTriangle, color: 'bg-amber-500' },
```

**Visibility Rules:**
- `qa-am-review`: Visible to users with `Operations` or `Admin` role (AM-facing)
- `qa-capa`: Visible to all users with `qa` access (store team fills it)

### Phase 4: Dashboard Integration

#### Step 4.1: QA Dashboard — CAPA Tracking Tab

Add a new tab to the existing QA Dashboard showing:
- Total open CAPAs by store
- CAPA aging (days since creation)
- Closure rate (% of findings closed)
- AM Review completion rate

#### Step 4.2: Notification Badge

On the Checklists & Surveys main page, show a badge on "QA AM Review" and "QA CAPA" tiles indicating the count of open/pending items for the logged-in user.

---

## Environment Variables

Add to `.env`:

```
VITE_QA_CAPA_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec
```

This single endpoint handles both AM Review and CAPA operations via the `action` parameter.

---

## New Files to Create

| File | Purpose |
|------|---------|
| `services/qaCapaService.ts` | Extraction logic, employee resolution, API calls |
| `components/checklists/QAAMReviewChecklist.tsx` | AM Review UI component |
| `components/checklists/QACAPAChecklist.tsx` | CAPA fill-in UI component |
| `qa-capa-google-apps-script.js` | Google Apps Script for both sheets |

## Files to Modify

| File | Change |
|------|--------|
| `components/checklists/QAChecklist.tsx` | Add finding extraction + auto-submission after QA submit |
| `components/ChecklistsAndSurveys.tsx` | Register 2 new checklist types + imports |
| `.env` | Add `VITE_QA_CAPA_SCRIPT_URL` |
| `components/Dashboard.tsx` | Add CAPA tracking tab (Phase 4) |

---

## Status Lifecycle

```
QA Submitted
    │
    ▼
AM Review: Open ──→ In Progress ──→ Closed
                     (AM acknowledges)  (All items reviewed)
    │
    ▼
QA CAPA: Open ──→ In Progress ──→ Closed
                  (SM fills CAPA)    (AM/QA verifies & closes)
```

**Closure Authority:**
- AM Review: Auto-closes when all items acknowledged
- QA CAPA: Closed by the AM or QA Auditor after verifying corrective actions are implemented

---

## Summary

| Aspect | Detail |
|--------|--------|
| **Trigger** | QA checklist submission with any NC/PC items |
| **Checklist 1** | QA AM Review → assigned to AM from store mapping |
| **Checklist 2** | QA CAPA → assigned to SM/Shift/ASM from employee directory |
| **Storage** | 2 new Google Sheet tabs via single Apps Script endpoint |
| **Linkage** | `qaSubmissionTime` + `storeId` ties everything to the original QA audit |
| **Status Flow** | Open → In Progress → Closed |
| **Data Resolution** | AM: already in QA meta | SM/Shift/ASM: Employee Directory filtered by store_code + designation |
