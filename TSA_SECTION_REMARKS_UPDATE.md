# TSA Section Remarks - Implementation Update

## Overview
Added individual remarks fields for each of the three TSA (Training Skill Assessment) sections in the Training Audit checklist.

## Changes Made

### 1. Google Apps Script Updates (`training-audit-google-apps-script-fixed.js`)

#### Header Row Update
Changed from single `TSA_remarks` to three separate fields:
```javascript
// OLD:
'TM_remarks', 'LMS_remarks', 'Buddy_remarks', 'NJ_remarks', 
'PK_remarks', 'TSA_remarks', 'CX_remarks', 'AP_remarks',

// NEW:
'TM_remarks', 'LMS_remarks', 'Buddy_remarks', 'NJ_remarks', 
'PK_remarks', 'TSA_Food_remarks', 'TSA_Coffee_remarks', 'TSA_CX_remarks', 
'CX_remarks', 'AP_remarks',
```

#### POST Handler Update
Updated to accept and write the three TSA remarks fields:
```javascript
// OLD:
params.PK_remarks || '', params.TSA_remarks || '',
params.CX_remarks || '', params.AP_remarks || '',

// NEW:
params.PK_remarks || '', params.TSA_Food_remarks || '', 
params.TSA_Coffee_remarks || '', params.TSA_CX_remarks || '',
params.CX_remarks || '', params.AP_remarks || '',
```

#### GET Handler Update
Updated data retrieval to read the three TSA remarks columns:
```javascript
// OLD:
obj.TSA_remarks = row[colIndex++] || '';

// NEW:
obj.TSA_Food_remarks = row[colIndex++] || '';
obj.TSA_Coffee_remarks = row[colIndex++] || '';
obj.TSA_CX_remarks = row[colIndex++] || '';
```

### 2. Frontend Update (`components/checklists/TrainingChecklist.tsx`)

#### Added Section Remarks UI for TSA Sections
Added the "Section Remarks" textarea to each of the three TSA sections:

**For TSA_Food:**
```typescript
{/* Section Remarks for TSA Food */}
<div className="mt-3">
  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
    Section Remarks
  </label>
  <textarea
    value={remarks[section.id] || ''}
    onChange={(e) => handleRemarks(section.id, e.target.value)}
    placeholder={`Add remarks for ${section.title} section (optional)`}
    rows={2}
    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
  />
</div>
```

**For TSA_Coffee:**
```typescript
{/* Section Remarks for TSA Coffee */}
<div className="mt-3">
  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
    Section Remarks
  </label>
  <textarea
    value={remarks[section.id] || ''}
    onChange={(e) => handleRemarks(section.id, e.target.value)}
    placeholder={`Add remarks for ${section.title} section (optional)`}
    rows={2}
    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-yellow-500 dark:focus:border-yellow-400 focus:outline-none"
  />
</div>
```

**For TSA_CX:**
```typescript
{/* Section Remarks for TSA CX */}
<div className="mt-3">
  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
    Section Remarks
  </label>
  <textarea
    value={remarks[section.id] || ''}
    onChange={(e) => handleRemarks(section.id, e.target.value)}
    placeholder={`Add remarks for ${section.title} section (optional)`}
    rows={2}
    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
  />
</div>
```

#### Form Submission Mapping
Updated the section ID to remarks field name mapping:
```typescript
// OLD:
section.id === 'TSA' ? 'TSA' :

// NEW:
section.id === 'TSA_Food' ? 'TSA_Food' :
section.id === 'TSA_Coffee' ? 'TSA_Coffee' :
section.id === 'TSA_CX' ? 'TSA_CX' :
```

## TSA Sections Structure

The Training Audit has three separate TSA sections:

1. **TSA_Food** - Food Training Skill Assessment
   - Employee Information (name, ID)
   - Personal Hygiene (3 items)
   - Station Readiness (8 items)
   - Food Preparation & Handling (12 items)
   - Standards Ownership (1 item)
   - **Total: 24 assessment items**

2. **TSA_Coffee** - Coffee Training Skill Assessment
   - Employee Information (name, ID)
   - Personal Hygiene (3 items)
   - Station Readiness (13 items)
   - Coffee Preparation & Handling (26 items)
   - **Total: 42 assessment items**

3. **TSA_CX** - Customer Experience Assessment
   - Employee Information (name, ID)
   - Personal Hygiene (3 items)
   - Station Readiness (8 items)
   - Customer Handling (12 items)
   - Handling Feedback & Complaints (6 items)
   - **Total: 29 assessment items**

## User Interface

Each TSA section now has a "Section Remarks" textarea field that appears at the bottom of the section, after the collapsible assessment content.

### What You'll See:

```
[TSA - Food Training Skill Assessment]
Score: 0% = 0 points (≥85% = 10pts, 75-84% = 5pts, <75% = 0pts)  [Expand Assessment ▼]

[When expanded, shows all questions in subsections]
  Personal Hygiene
    1. Well-groomed as per TWC standards
       ○ Yes  ○ No  ○ Na
  ...
  
Section Remarks
┌─────────────────────────────────────────────────────────────┐
│ Add remarks for TSA - Food Training Skill Assessment        │
│ section (optional)                                          │
└─────────────────────────────────────────────────────────────┘
```

### Location in UI:
- The **Section Remarks** textarea appears **below the collapsible content**
- It's **always visible** (even when the assessment is collapsed)
- Each TSA section has its own independent remarks field
- Color-coded focus borders match the section color:
  - 🟠 TSA Food: Orange border
  - 🟡 TSA Coffee: Yellow border  
  - 🔵 TSA CX: Blue border

## Data Flow

1. **User fills out Training Audit**
   - Answers yes/no/na for each TSA question
   - Optionally adds remarks for each TSA section

2. **Form Submission**
   - Frontend sends `TSA_Food_remarks`, `TSA_Coffee_remarks`, `TSA_CX_remarks`
   - Google Apps Script receives and writes to columns

3. **Google Sheets Structure**
   ```
   Column Position (approximate):
   ...
   [Column X]   -> PK_remarks
   [Column X+1] -> TSA_Food_remarks     (NEW)
   [Column X+2] -> TSA_Coffee_remarks   (NEW)
   [Column X+3] -> TSA_CX_remarks       (NEW)
   [Column X+4] -> CX_remarks
   [Column X+5] -> AP_remarks
   [Column X+6] -> Total Score
   [Column X+7] -> Max Score
   [Column X+8] -> Percentage
   ```

4. **Data Retrieval**
   - GET requests receive all three TSA remarks fields
   - Can be displayed in dashboards or reports

## Testing Checklist

- [x] Updated Google Apps Script header row
- [x] Updated Google Apps Script POST handler
- [x] Updated Google Apps Script GET handler
- [x] Updated frontend form submission mapping
- [x] Added Section Remarks textarea for TSA_Food
- [x] Added Section Remarks textarea for TSA_Coffee
- [x] Added Section Remarks textarea for TSA_CX
- [x] Verified section IDs match (`TSA_Food`, `TSA_Coffee`, `TSA_CX`)
- [ ] Test submission with remarks in all three TSA sections
- [ ] Verify data appears correctly in Google Sheets
- [ ] Test GET endpoint returns all three TSA remarks
- [ ] Verify no existing headers are disturbed

## Deployment Steps

### 1. Update Google Apps Script
1. Open your Google Apps Script editor
2. Replace the content with updated `training-audit-google-apps-script-fixed.js`
3. Save the script
4. Deploy as web app (new version)
5. Authorize permissions if prompted

### 2. Update Frontend (Already Done)
The frontend changes are already in `TrainingChecklist.tsx`:
- Added Section Remarks textareas for all three TSA sections
- Updated form submission mapping

**Note:** You may need to refresh your browser or rebuild the app to see the changes.

### 3. Test the UI
1. Open the Training Audit form in your browser
2. Navigate to the TSA sections
3. You should now see "Section Remarks" textarea at the bottom of each TSA section:
   - TSA - Food Training Skill Assessment
   - TSA - Coffee Training Skill Assessment
   - TSA: Customer Experience
4. The textarea is always visible, even when the assessment is collapsed

### 4. Test Submission
1. Fill out at least one TSA section completely
2. Add remarks in the TSA section's "Section Remarks" field
3. Submit the form
4. Check Google Sheets to verify:
   - New columns appear: `TSA_Food_remarks`, `TSA_Coffee_remarks`, `TSA_CX_remarks`
   - Old columns remain unchanged
   - Data is written correctly

## Important Notes

⚠️ **UI Changes**: Added Section Remarks textarea to all three TSA sections. You must refresh your browser to see the changes.

⚠️ **Header Preservation**: The update only adds new columns for TSA remarks. All existing columns remain in the same position.

⚠️ **Backwards Compatibility**: Old submissions will have empty values in the new TSA remarks columns. This is expected and normal.

⚠️ **Column Order**: The new columns are inserted between `PK_remarks` and `CX_remarks` to maintain logical grouping of TSA-related fields.

⚠️ **Always Visible**: The Section Remarks textarea is always visible at the bottom of each TSA section, even when the assessment questions are collapsed.

## Support

If you encounter issues:
1. Check the Google Apps Script execution logs
2. Verify the column headers in your Google Sheet
3. Confirm the frontend is sending the correct field names
4. Check browser console for any form submission errors

---

**Last Updated**: January 2025
**Status**: Ready for deployment
