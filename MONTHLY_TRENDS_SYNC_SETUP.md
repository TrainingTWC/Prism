# Monthly Trends Auto-Sync Setup Guide

This guide explains how to automatically sync your live Training Audit data to the Monthly_Trends sheet.

## 📋 Overview

**Current Problem:** You manually update Monthly_Trends sheet when you want to see historic data.

**Solution:** Automatic sync script that:
- Reads all audits from your live training audit sheet
- Groups by store + month
- Calculates average score and percentage per store per month  
- Updates Monthly_Trends sheet automatically
- Runs hourly (or your preferred schedule)

---

## 🛠️ Setup Instructions

### Step 1: Update the Configuration

Before deploying, you need to tell the script where your data is:

1. Open the file `google-apps-script-sync-monthly-trends.js`

2. Find the **CONFIG section** (around line 28):

```javascript
const CONFIG = {
  // Name of your live training audit sheet (where form submissions go)
  AUDIT_SHEET_NAME: 'Training_Audits', // TODO: Change to your actual sheet name
  
  // Column mappings for AUDIT sheet (1-based index)
  AUDIT_COLUMNS: {
    STORE_ID: 1,        // Column A - store_id
    STORE_NAME: 2,      // Column B - store_name
    SCORE: 3,           // Column C - score
    PERCENTAGE: 4,      // Column D - percentage
    SUBMISSION_DATE: 5, // Column E - submission date/timestamp
  },
  
  TIMEZONE: 'Asia/Kolkata',
  START_MONTH: '2025-07',
};
```

3. **Update these values:**

   **AUDIT_SHEET_NAME:** What's the name of your live training audit sheet?
   - If it's "Form Responses 1" → change to `'Form Responses 1'`
   - If it's "Training_Audits" → change to `'Training_Audits'`
   - If it's something else → change accordingly

   **AUDIT_COLUMNS:** Which columns contain what data?
   - Open your training audit sheet
   - Count from left (A=1, B=2, C=3, etc.)
   - Update the numbers to match your columns:
     - `STORE_ID`: Which column has store ID?
     - `STORE_NAME`: Which column has store name?
     - `SCORE`: Which column has the audit score (out of 100)?
     - `PERCENTAGE`: Which column has the percentage score?
     - `SUBMISSION_DATE`: Which column has the submission timestamp?

   **Example:** If your sheet looks like:
   ```
   A: Timestamp | B: Store ID | C: Store Name | D: Score | E: Percentage
   ```
   Then your config should be:
   ```javascript
   AUDIT_COLUMNS: {
     STORE_ID: 2,        // Column B
     STORE_NAME: 3,      // Column C
     SCORE: 4,           // Column D
     PERCENTAGE: 5,      // Column E
     SUBMISSION_DATE: 1, // Column A
   }
   ```

### Step 2: Deploy to Google Apps Script

1. **Open your Google Sheet** (the one with both Training_Audits and Monthly_Trends)

2. Go to **Extensions** → **Apps Script**

3. **Create a new script file:**
   - Click the **+** next to "Files"
   - Name it: `MonthlyTrendsSync`

4. **Copy-paste** the entire contents of `google-apps-script-sync-monthly-trends.js` into this new file

5. **Save** (Ctrl+S or Cmd+S)

### Step 3: Test It Manually

Before automating, test that it works:

1. In the Apps Script editor, select the function **`syncMonthlyTrends`** from the dropdown at the top

2. Click **Run** (▶️ button)

3. **Grant permissions** when prompted:
   - Google will ask to review permissions
   - Click "Advanced" → "Go to [Your Project]"
   - Click "Allow"

4. Check the **Execution log** (bottom panel):
   - Should see: "Monthly trends sync completed successfully!"
   - Check for any errors

5. **Go back to your Google Sheet** → Open the **Monthly_Trends** tab:
   - Should see updated data
   - Check that `observed_period` column shows `2025-07`, `2025-08`, etc. (not dates with times)

### Step 4: Set Up Automatic Triggers

Once manual test works, automate it:

1. In Apps Script editor, click the **⏰ Triggers** icon (left sidebar, looks like a clock)

2. Click **+ Add Trigger** (bottom right)

3. Configure the trigger:
   - **Function to run:** `syncMonthlyTrends`
   - **Deployment:** Head
   - **Event source:** Time-driven
   - **Type of time based trigger:** Hour timer
   - **Select hour interval:** Every hour (or choose: Every 6 hours, Daily, etc.)

4. Click **Save**

5. **Done!** The script will now run automatically on your schedule.

### Step 5: Add Custom Menu (Optional but Recommended)

To manually trigger sync from your Google Sheet menu:

1. In Apps Script, make sure the `onOpen()` function is in your script (it's included)

2. **Refresh your Google Sheet** (close and reopen)

3. You should see a new menu: **📊 Training Data**

4. Click it to see options:
   - **🔄 Sync Monthly Trends** - Run sync manually
   - **🧪 Test Read Audits** - Test reading your audit data
   - **🧪 Test Aggregation** - Test aggregation logic

---

## 🔍 How It Works

### Data Flow

```
Training Audit Sheet (Live Data)
         ↓
   [Sync Script Runs]
         ↓
    Read all audits
         ↓
  Group by Store + Month
         ↓
Calculate avg Score & Percentage
         ↓
   Monthly_Trends Sheet
         ↓
  [Google Apps Script API]
         ↓
    Your Dashboard
```

### Aggregation Logic

- **One audit per store per month?** → Uses that score/percentage
- **Multiple audits per store per month?** → Uses the **LATEST** audit (by submission date)
  - Example: If S001 has 3 audits in July:
    - July 10: score 70
    - July 15: score 80
    - July 20: score 90
  - Monthly_Trends will show: **score: 90, percentage: (from July 20 audit)**
  - The notes column will indicate "Latest of 3 audits"

### What Gets Written to Monthly_Trends

For each store-month combination, it writes **2 rows**:

```
store_id | store_name | metric_name | metric_value | period_type | observed_period | ... | notes
---------|------------|-------------|--------------|-------------|-----------------|-----|-------
S001     | Store A    | score       | 76           | monthly     | 2025-07         | ... | Auto-synced...
S001     | Store A    | percentage  | 89           | monthly     | 2025-07         | ... | Auto-synced...
```

This matches your existing Monthly_Trends structure perfectly!

---

## 🐛 Troubleshooting

### Script fails with "Sheet not found"
- Check that `CONFIG.AUDIT_SHEET_NAME` exactly matches your sheet name (case-sensitive!)
- Make sure you're running the script in the correct Google Sheet file

### Data looks wrong / missing stores
- Check `CONFIG.AUDIT_COLUMNS` - the column numbers must match your actual sheet
- Run `testReadAuditData()` function to see what the script is reading
- Check the Apps Script logs (View → Logs)

### observed_period shows as dates with times instead of "2025-07"
- The script formats column F as text automatically
- If still showing dates: Manually format column F as **Plain text** in Google Sheets
- Then re-run the sync

### Trigger doesn't run automatically
- Check that trigger was saved successfully (Triggers page in Apps Script)
- Check your Google account's trigger quota (shouldn't be an issue for hourly triggers)
- Check Execution log for any errors

### Want to run sync more/less frequently
- Go to Triggers page in Apps Script
- Click the three dots on your trigger → Edit
- Change the interval (Every hour / Every 6 hours / Daily, etc.)

---

## 📊 Viewing Sync Results

After sync runs (manually or automatically):

1. **Check Monthly_Trends sheet:**
   - Should have 2 rows per store per month (score + percentage)
   - `observed_period` should be text format: `2025-07`, `2025-08`, etc.
   - `source` column should say `auto_sync`
   - `notes` will say how many audits were aggregated

2. **Check your Dashboard:**
   - Refresh: http://localhost:3004/Prism/
   - Open Training Dashboard
   - Expand "Historic Trends" section
   - Should see updated store counts and trends

3. **Check Apps Script Execution Log:**
   - Apps Script Editor → Executions (left sidebar, ⚡ icon)
   - Shows history of all runs (manual + automatic)
   - Click any run to see logs and check for errors

---

## 🎯 Next Steps

Once this is working:

1. **Test with new audit submission:**
   - Submit a new training audit through your form
   - Wait for next hourly sync (or run manually via menu)
   - Check that Monthly_Trends updated
   - Check that dashboard reflects the new data

2. **Adjust sync frequency:**
   - If hourly is too often → change to every 6 hours or daily
   - If you want real-time → change to form submit trigger (see advanced below)

3. **Monitor for a few days:**
   - Check Execution logs to ensure triggers are working
   - Verify data accuracy

---

## 🚀 Advanced: Real-Time Sync on Form Submit

If you want **instant updates** instead of hourly:

1. Go to Apps Script → Triggers
2. Add new trigger:
   - Function: `syncMonthlyTrends`
   - Event source: **From spreadsheet**
   - Event type: **On form submit**
3. Save

Now every time someone submits the training audit form, Monthly_Trends updates immediately!

**Note:** This only works if your audits come from a Google Form. If you manually enter data, stick with time-based triggers.

---

## ❓ Questions?

If you run into issues:
1. Check the Troubleshooting section above
2. Run the test functions (`testReadAuditData`, `testAggregation`)
3. Check Apps Script execution logs for detailed error messages
4. Make sure column mappings in CONFIG are correct

Happy automating! 🎉
