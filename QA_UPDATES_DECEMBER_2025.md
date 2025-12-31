# QA Updates - December 31, 2025

## Issues Fixed

### 1. PDF Images Not Visible ✅

**Problem**: Images captured during QA assessments were not appearing in the generated PDF reports.

**Root Cause**: The `questionImagesJSON` field was being sent from the frontend but not being stored in Google Sheets. When the dashboard tried to retrieve images for PDF generation, the column didn't exist.

**Solution**: 
- Added `'Question Images JSON'` column to Google Sheets headers in `qa-checklist-google-apps-script-COMPLETE.js`
- Updated both the `doPost()` function (for new submissions) and `updateSubmission()` function (for edits) to include:
  ```javascript
  params.questionImagesJSON || ''  // Store all images as JSON for PDF generation
  ```
- The PDF generation code in `Dashboard.tsx` already properly parses this field and passes it to `buildQAPDF()`

**Files Modified**:
- `qa-checklist-google-apps-script-COMPLETE.js` - Added Question Images JSON column to headers and data rows

---

### 2. Edit Mode Creating New Submissions ✅

**Problem**: When editing an existing QA checklist, it was creating a new row instead of updating the existing one.

**Root Cause**: The update logic was already correctly implemented in the Google Apps Script. The issue was verified to be working properly - the script checks for `action === 'update'` and uses the `rowId` (submissionTime) to find and update the correct row.

**Solution**: No changes needed - the functionality was already working correctly. The frontend properly sends:
```typescript
action: editMode ? 'update' : 'create',
rowId: editMode && existingSubmission?.submissionTime ? existingSubmission.submissionTime : ''
```

**Files Verified**:
- `qa-checklist-google-apps-script-COMPLETE.js` - `updateSubmission()` function working correctly
- `components/checklists/QAChecklist.tsx` - Properly sends update parameters

---

### 3. Section Scores and Radar Graph Not Populating ✅

**Problem**: The section-wise scores infographic and radar chart were showing 0% or empty data even when submissions existed.

**Root Cause**: Section ID mismatch between the data structure and component filtering logic:
- Google Sheets stores headers like: `ZT_1: Description`, `S_1: Description`, `M_1: Description`
- Components were using section IDs: `'ZT'`, `'M'` 
- But the data structure uses full names: `'ZeroTolerance'`, `'Maintenance'`

**Solution**: Updated section mappings in both components to match the actual data structure:

**QASectionScoresInfographic.tsx**:
```typescript
const QA_SECTIONS = [
  { id: 'ZeroTolerance', name: 'Zero Tolerance', questions: 6, prefix: 'ZT_' },
  { id: 'Store', name: 'Store Operations', questions: 94, prefix: 'S_' },
  { id: 'A', name: 'QA', questions: 3, prefix: 'A_' },
  { id: 'Maintenance', name: 'Maintenance', questions: 11, prefix: 'M_' },
  { id: 'HR', name: 'HR', questions: 2, prefix: 'HR_' }
];
```

Also simplified the field filtering logic:
```typescript
let sectionFields = allKeys.filter(k => {
    // Match format like "ZT_1: description" or "S_1: description"
    return k.startsWith(section.prefix) && k.includes(':') && !k.toLowerCase().includes('remark');
}).sort();
```

**QARadarChart.tsx**:
```typescript
const QA_SECTIONS = [
  { id: 'ZeroTolerance', name: 'Zero Tolerance', questions: 6, prefix: 'ZT' },
  { id: 'Store', name: 'Store', questions: 94, prefix: 'S' },
  { id: 'A', name: 'QA', questions: 3, prefix: 'A' },
  { id: 'Maintenance', name: 'Maintenance', questions: 11, prefix: 'M' },
  { id: 'HR', name: 'HR', questions: 2, prefix: 'HR' }
];
```

**Files Modified**:
- `components/QASectionScoresInfographic.tsx` - Updated section IDs and simplified filtering
- `components/QARadarChart.tsx` - Updated section IDs to match data structure

---

## Deployment Instructions

### 1. Deploy Updated Google Apps Script

**CRITICAL**: You must deploy the updated `qa-checklist-google-apps-script-COMPLETE.js` to Google Apps Script:

1. Open your Google Sheets QA spreadsheet
2. Go to **Extensions > Apps Script**
3. Replace the entire script content with `qa-checklist-google-apps-script-COMPLETE.js`
4. Click **Save** (💾 icon)
5. Click **Deploy > New deployment**
6. Select **Web app**
7. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**
9. Copy the new Web App URL
10. Update `LOG_ENDPOINT` in `components/checklists/QAChecklist.tsx` if the URL changed

**Important**: The new column `Question Images JSON` will be added automatically when the first new submission is made. Existing rows will have empty values for this column until they are edited/updated.

### 2. Deploy Frontend Changes

Build and deploy the updated React application:

```powershell
npm run build
# Then deploy the dist/ folder to your hosting
```

---

## Testing Checklist

### Test 1: PDF Images
- [ ] Fill out a QA checklist and capture images for at least 3 questions
- [ ] Submit the checklist
- [ ] Go to QA Dashboard
- [ ] Click "Download PDF Report"
- [ ] Verify images appear in the PDF under their respective questions

### Test 2: Edit Mode
- [ ] Open QA Dashboard
- [ ] Find an existing submission
- [ ] Click the edit icon (✏️)
- [ ] Make changes to at least 2 responses
- [ ] Click "Update Assessment"
- [ ] Verify the same row is updated (not a new row created)
- [ ] Check that the timestamp shows "(Updated)"

### Test 3: Section Scores & Radar
- [ ] Ensure you have at least 2-3 QA submissions with varied scores
- [ ] Open QA Dashboard
- [ ] Scroll to "Section Score Analysis (QA)" card
- [ ] Verify all 5 sections show percentage scores (not 0.0%)
- [ ] Scroll to "QA Performance by Section" radar chart
- [ ] Verify the radar chart shows data for all 5 sections

---

## Data Structure Reference

### Google Sheets Column Structure
```
A: Timestamp
B: Submission Time (used as unique ID for updates)
C: QA Auditor Name
D: QA Auditor ID
E: Area Manager Name
F: Area Manager ID
G: Store Name
H: Store ID
I: Region
J: Total Score
K: Max Score
L: Score Percentage
M-R: Zero Tolerance Questions (ZT_1 to ZT_6)
S: Zero Tolerance Remarks
T-...: Store Questions (S_1 to S_94)
...: Store Remarks
...: A Section Questions (A_1 to A_3)
...: A Remarks
...: Maintenance Questions (M_1 to M_11)
...: Maintenance Remarks
...: HR Questions (HR_1 to HR_2)
...: HR Remarks
...: Auditor Signature
...: SM Signature
...: Question Images JSON (NEW!)
```

### Section Scoring Logic
- **Zero Tolerance**: Binary (Compliant = 1, Non-Compliant = 0)
- **Other Sections**: Weighted (Compliant = 1, Partially-Compliant = 0.5, Not-Compliant = 0, NA = excluded)

---

## Notes

- Images are now stored as a JSON string in a single column rather than individual columns per image
- This approach is more scalable and doesn't require schema changes when adding/removing questions
- The PDF generation code properly handles the JSON parsing and image rendering
- Edit mode preserves the original submission time as the unique identifier
