# Monthly Trends Sync - Complete Setup Guide

## What This Does
Automatically syncs training audit data from your "Training Audit" sheet to "Monthly_Trends" sheet. It groups audits by store + month and keeps only the LATEST audit for each combination.

---

## Step-by-Step Setup

### Step 1: Open Your Google Sheet
1. Go to your Google Sheet that contains:
   - **Training Audit** sheet (with form responses)
   - **Monthly_Trends** sheet (where aggregated data will go)

### Step 2: Open Apps Script Editor
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. You'll see a new tab open with the script editor
3. Delete any existing code in the editor

### Step 3: Copy the Script
1. Open the file `google-apps-script-sync-monthly-trends.js` from this folder
2. **Copy the entire script** (all 364 lines)
3. **Paste it** into the Apps Script editor
4. The script should now be in your sheet's script editor

### Step 4: Configure the Script (IMPORTANT)
Look for the `CONFIG` section at the top of the script (around line 24). You need to verify these settings:

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',  // ← Leave this as-is (not needed when container-bound)
  
  AUDIT_SHEET_NAME: 'Training Audit',          // ← Your audit sheet name
  TRENDS_SHEET_NAME: 'Monthly_Trends',         // ← Your trends sheet name
  
  AUDIT_COLUMNS: {
    STORE_ID: 8,        // Column H - Store ID
    STORE_NAME: 7,      // Column G - Store Name
    SCORE: 70,          // Column BR - Total Score
    PERCENTAGE: 72,     // Column BT - Percentage
    SUBMISSION_DATE: 2, // Column B - Submission Time
  },
  
  TIMEZONE: 'Asia/Kolkata',
  START_MONTH: '2025-07', // Only sync audits from July 2025 onwards
};
```

**To verify column numbers:**
- Open your "Training Audit" sheet
- Count columns from left to right (A=1, B=2, C=3... H=8, etc.)
- Make sure:
  - Column **H** (8) has Store ID
  - Column **G** (7) has Store Name
  - Column **BR** (70) has Total Score
  - Column **BT** (72) has Percentage
  - Column **B** (2) has Submission Time/Date

### Step 5: Save the Script
1. Click the **disk icon** (💾) or press **Ctrl+S** (Windows) / **Cmd+S** (Mac)
2. Give your project a name (e.g., "Monthly Trends Sync")
3. Click **OK**

### Step 6: Run the Script for the First Time
1. At the top of the editor, find the function dropdown
2. Select **`syncMonthlyTrends`** from the dropdown
3. Click the **▶ Run** button

**You'll see an authorization popup:**

4. Click **Review permissions**
5. Choose your Google account
6. Click **Advanced** → **Go to [project name] (unsafe)**
   - Don't worry - this is YOUR script, it's safe
7. Click **Allow**

### Step 7: Check the Results
1. Go back to your Google Sheet
2. Open the **Monthly_Trends** sheet
3. You should see new rows with:
   - store_id
   - store_name
   - metric_name (score or percentage)
   - metric_value (the latest audit value)
   - observed_period (format: 2025-07, 2025-08, etc.)
   - source: "auto_sync"

### Step 8: Check the Execution Log
1. In the Apps Script editor, click **Execution log** tab at the bottom
2. You should see messages like:
   ```
   ✅ Starting monthly trends sync...
   ✅ Spreadsheet found: [Your Sheet Name]
   ✅ Read X audit records
   ✅ Aggregated into Y store-month combinations
   ✅ Wrote Z total rows to Monthly_Trends
   ✅ Monthly trends sync completed successfully!
   ```

---

## Step 9: Set Up Automatic Sync (Optional but Recommended)

To run this automatically every hour:

1. In the Apps Script editor, click the **clock icon** ⏰ (Triggers) on the left sidebar
2. Click **+ Add Trigger** (bottom right)
3. Configure:
   - **Choose which function to run:** `syncMonthlyTrends`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `Time-driven`
   - **Select type of time based trigger:** `Hour timer`
   - **Select hour interval:** `Every hour` (or your preference)
4. Click **Save**

Now the script will run automatically every hour!

---

## Troubleshooting

### Error: "No spreadsheet found"
**Solution:** Make sure you opened Apps Script from **Extensions → Apps Script** in your Google Sheet (not from script.google.com directly).

### Error: "Audit sheet 'Training Audit' not found"
**Solution:** Check that your sheet is named exactly "Training Audit" (case-sensitive). Update `CONFIG.AUDIT_SHEET_NAME` if it's different.

### Error: "Trends sheet 'Monthly_Trends' not found"
**Solution:** Create a sheet named "Monthly_Trends" or update `CONFIG.TRENDS_SHEET_NAME` to match your sheet name.

### No data appears in Monthly_Trends
**Possible causes:**
1. **Empty Training Audit sheet:** Add some audit data first
2. **Wrong column numbers:** Verify the column mappings in CONFIG
3. **Date filtering:** Check if your audits are from July 2025 onwards (CONFIG.START_MONTH)
4. **Check execution log:** Look for error messages in the Execution log tab

### Data looks wrong
1. Go to Apps Script editor
2. Select **`testReadAuditData`** from the function dropdown
3. Click Run
4. Check the **Execution log** to see sample data being read
5. Verify column numbers match your actual sheet layout

---

## How the Sync Works

### Data Flow:
1. **Reads** all rows from "Training Audit" sheet
2. **Groups** audits by Store ID + Month (e.g., "S001 + 2025-07")
3. **Keeps** only the LATEST audit for each store-month combination
4. **Writes** to "Monthly_Trends" with two rows per store-month:
   - One row for "score" metric
   - One row for "percentage" metric

### What Gets Preserved:
- **Manual entries** in Monthly_Trends (rows where source ≠ "auto_sync") are kept
- **Auto-sync entries** are refreshed with latest data each run

### Example Output:
```
store_id | store_name  | metric_name | metric_value | observed_period | source
---------|-------------|-------------|--------------|-----------------|----------
S001     | Koramangala | score       | 85          | 2025-07         | auto_sync
S001     | Koramangala | percentage  | 95.5        | 2025-07         | auto_sync
S002     | HSR Layout  | score       | 78          | 2025-07         | auto_sync
S002     | HSR Layout  | percentage  | 87.6        | 2025-07         | auto_sync
```

---

## Quick Reference Commands

### Manual Sync (Run anytime)
1. Open Apps Script editor
2. Select `syncMonthlyTrends`
3. Click Run

### View Execution History
1. Apps Script editor → Triggers (⏰ icon)
2. Click "Executions" in the left sidebar

### Disable Auto-Sync
1. Apps Script editor → Triggers (⏰ icon)
2. Click the three dots (⋮) next to your trigger
3. Click "Delete trigger"

---

## Need Help?

Check the execution log first:
1. Apps Script editor → **Execution log** tab
2. Look for error messages in red
3. The error will tell you what needs to be fixed

Common fixes:
- Update CONFIG sheet names
- Verify column numbers
- Check date format in submission column
- Ensure sheets exist in your workbook

---

## Testing Functions Included

The script includes helper functions for testing:

- **`testReadAuditData()`** - Shows sample audit records being read
- **`testAggregation()`** - Shows how data is grouped by store+month
- **`onOpen()`** - Adds a custom menu to your Google Sheet

To use the custom menu:
1. Close and reopen your Google Sheet
2. You'll see a new menu: **📊 Training Data**
3. Click it to access:
   - 🔄 Sync Monthly Trends (run sync manually)
   - 🧪 Test Read Audits
   - 🧪 Test Aggregation

---

## Summary Checklist

- [ ] Opened Google Sheet
- [ ] Went to Extensions → Apps Script
- [ ] Pasted the script
- [ ] Verified CONFIG settings (sheet names, column numbers)
- [ ] Saved the script
- [ ] Ran `syncMonthlyTrends` function
- [ ] Authorized the script
- [ ] Checked Monthly_Trends sheet for data
- [ ] (Optional) Set up hourly trigger
- [ ] (Optional) Tested with custom menu

✅ You're done! The sync should now work automatically.
