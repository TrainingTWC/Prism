# QA Checklist Submission Fix - Deployment Guide

## Problem
The QA checklist submissions were not working because the Google Apps Script only had **partial questions** (about 50) instead of the complete **116 questions** across all 5 sections.

## Solution
Created a new complete Google Apps Script that handles all 116 questions:
- **Zero Tolerance** (6 questions): ZT_1 to ZT_6
- **Store** (94 questions): S_1 to S_94
- **A/QA** (3 questions): A_1 to A_3
- **Maintenance** (11 questions): M_1 to M_11
- **HR** (2 questions): HR_1 to HR_2

## Deployment Steps

### 1. Open Google Apps Script
1. Go to your Google Sheet for QA submissions
2. Click **Extensions** → **Apps Script**
3. You should see the existing script

### 2. Replace the Code
1. **Delete all existing code** in the script editor
2. **Copy the entire content** from: `qa-checklist-google-apps-script-UPDATED.js`
3. **Paste** it into the script editor

### 3. Deploy
1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "QA Checklist - All 116 Questions"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Authorize** the script if prompted
7. **Copy the Web App URL** - it should look like:
   ```
   https://script.google.com/macros/s/AKfycbw...../exec
   ```

### 4. Update the Frontend
1. Open `components/checklists/QAChecklist.tsx`
2. Find line 12 (LOG_ENDPOINT)
3. Replace the URL with your new deployment URL:
   ```typescript
   const LOG_ENDPOINT = 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_URL/exec';
   ```

### 5. Test the Submission
1. Run the app locally: `npm run dev`
2. Fill out a QA checklist (use autofill test data button if available)
3. Submit the assessment
4. Check your Google Sheet - you should see a new row with ALL 116 question responses

## What Changed in the Script

### Old Script (BROKEN)
- Only had ~50 questions from Store section
- Missing sections: A/QA and HR completely
- Missing S_17 through S_94 (78 Store questions)

### New Script (COMPLETE)
- ✅ All 6 Zero Tolerance questions
- ✅ All 94 Store questions (S_1 to S_94)
- ✅ All 3 A/QA questions
- ✅ All 11 Maintenance questions
- ✅ All 2 HR questions
- ✅ Section remarks for each section
- ✅ Images stored as JSON
- ✅ Signatures included

## Column Mapping in Google Sheet

The script creates a sheet with these columns:

**Columns A-N**: Metadata
- A: Timestamp
- B: Submission Time
- C: QA Auditor Name
- D: QA Auditor ID
- E: Area Manager Name
- F: Area Manager ID
- G: Store Name
- H: Store ID
- I: Region
- J: Total Score
- K: Max Score
- L: Score Percentage
- M: Auditor Signature
- N: SM Signature

**Columns O-U**: Zero Tolerance (6 questions + remarks)
**Columns V-DL**: Store (94 questions + remarks)
**Columns DM-DP**: A/QA (3 questions + remarks)
**Columns DQ-EB**: Maintenance (11 questions + remarks)
**Columns EC-EE**: HR (2 questions + remarks)
**Column EF**: Images (JSON)

Total: 142 columns

## Verification Checklist

After deployment, verify:
- [ ] New deployment URL copied
- [ ] Frontend updated with new URL
- [ ] App rebuilt (`npm run build`)
- [ ] Test submission completed
- [ ] Google Sheet shows new row
- [ ] All 116 question responses are present (columns O through EE)
- [ ] Score calculation is correct
- [ ] Images JSON is present in column EF

## Troubleshooting

### Submission Not Appearing in Sheet
1. Check browser console for errors
2. Verify the LOG_ENDPOINT URL is correct
3. Ensure Google Apps Script is deployed as "Anyone" can access
4. Check Google Apps Script execution logs: **Executions** tab in Apps Script

### Missing Questions in Sheet
1. Verify you deployed the UPDATED script (not the old one)
2. Check the column count - should be 142 columns total
3. Look at the setupQAHeaders function in the script

### Authorization Errors
1. Re-deploy the script
2. Authorize it when prompted
3. Make sure "Execute as: Me" is selected

## Files Reference

- **New Script**: `qa-checklist-google-apps-script-UPDATED.js` ← Use this one!
- **Old Script**: `qa-checklist-google-apps-script.js` (incomplete, don't use)
- **Frontend**: `components/checklists/QAChecklist.tsx` (line 12)

## Next Steps

After successful deployment:
1. Test with multiple submissions
2. Verify all data appears correctly
3. Test PDF generation from the dashboard
4. Update any audit dashboards that read from this sheet
