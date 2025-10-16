# Quick Fix for Apps Script Error

## ✅ What You're Seeing
```json
{
  "ok": false,
  "error": "Exception: Argument too large: value",
  "message": "Failed to fetch monthly trends data"
}
```

## 🔍 Root Cause
Your Google Sheet doesn't have the **"Monthly_Trends"** tab yet, or it's empty. The script was trying to process too many empty cells.

## ✅ Solution (3 Steps)

### Step 1: Update the Apps Script Code

I just fixed the code to handle empty sheets gracefully. **Copy the updated code** from `google-apps-script-monthly-trends.js` and paste it again in your Apps Script editor:

1. Go to your Apps Script project
2. **Select all** the existing code (Ctrl+A)
3. **Delete** it
4. **Paste** the updated code from `google-apps-script-monthly-trends.js`
5. **Save** (Ctrl+S)

### Step 2: Create the "Monthly_Trends" Sheet Tab

In your Google Sheet:

1. **Create a new sheet tab** (click the + icon at the bottom)
2. **Rename it** to exactly: `Monthly_Trends` (case-sensitive)
3. **Add the header row** (first row):
   ```
   store_id | store_name | metric_name | metric_value | period_type | observed_period | auditor_name | auditor_id | am_name | am_id | region | source | notes
   ```

### Step 3: Add Sample Data (Temporary Test)

Add just **one row** of data to test:

```
S001 | Koramangala | score | 85 | monthly | 2025-07 | John Doe | A001 | Mike Manager | M001 | South | initial_load | Test row
```

Now **refresh your web app URL**: https://script.google.com/macros/s/AKfycbyHZhwc0Lf8ZhlR4sMlDDN0AGpiXNj0QsvX4yE-yJCYkW96QVQoABEVC1xGgXa4gSb69g/exec

## 🎯 Expected Result

You should now see:

```json
{
  "ok": true,
  "rows": [
    {
      "store_id": "S001",
      "store_name": "Koramangala",
      "metric_name": "score",
      "metric_value": 85,
      "period_type": "monthly",
      "observed_period": "2025-07",
      "auditor_name": "John Doe",
      "auditor_id": "A001",
      "am_name": "Mike Manager",
      "am_id": "M001",
      "region": "South",
      "source": "initial_load",
      "notes": "Test row"
    }
  ],
  "metadata": {
    "sheet_name": "Monthly_Trends",
    "last_updated": "2025-10-16T...",
    "total_rows": 1,
    "filters_applied": null
  }
}
```

## 📋 Next Steps

Once you see the JSON working:

1. **Remove the test row**
2. **Add your processed historic data** (we still need to create this)
3. Dashboard will automatically fetch from this URL

## ❓ Still Not Working?

If you still see an error:

1. **Check the sheet tab name** is exactly `Monthly_Trends`
2. **Re-deploy the web app**:
   - Click "Deploy" → "Manage deployments"
   - Click the pencil icon (edit)
   - Click "Deploy"
   - Copy the **new URL** (it might change)

3. **Check the execution log**:
   - In Apps Script editor, click "Executions" (left sidebar)
   - Look for error details

---

Need help? Share:
- Screenshot of your sheet tabs
- Screenshot of the Apps Script editor
- The error from "Executions" log
