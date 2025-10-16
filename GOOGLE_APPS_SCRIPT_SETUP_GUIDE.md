# Google Apps Script Setup Guide for Monthly Trends

## 📋 Overview

This guide will help you set up Google Apps Script to automatically serve your monthly trends data to the dashboard.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create the Monthly_Trends Sheet

1. **Open your existing Google Sheet** (the one with training checklist data)
2. **Add a new tab** by clicking the "+" button at the bottom
3. **Rename the tab** to: `Monthly_Trends` (exact name, case-sensitive)
4. **Add headers** in the first row:
   ```
   store_id | store_name | metric_name | metric_value | period_type | observed_period | observed_local_time | store_timezone | submission_time_utc | source | notes | auditor_name | auditor_id | am_name | am_id | region
   ```

5. **Paste your historical data** starting from row 2

---

### Step 2: Install the Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. **Delete** any existing code in the editor
3. **Copy** the entire content of `google-apps-script-monthly-trends.js`
4. **Paste** it into the Apps Script editor
5. **Save** the project (Ctrl+S or File → Save)
6. **Name the project**: "Monthly Trends API" (or any name you like)

---

### Step 3: Deploy as Web App

1. In Apps Script editor, click **Deploy → New deployment**
2. Click the **gear icon** ⚙️ next to "Select type"
3. Choose **"Web app"**
4. Fill in the deployment settings:
   - **Description**: `Monthly Trends JSON API`
   - **Execute as**: `Me (your@email.com)`
   - **Who has access**: `Anyone` (for dashboard to access)
5. Click **"Deploy"**
6. **Authorize** the script:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to Monthly Trends API (unsafe)"
   - Click "Allow"
7. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/AKfy.../exec`)

---

### Step 4: Test the Endpoint

1. **Paste the Web App URL** in your browser
2. You should see JSON output like:
   ```json
   {
     "ok": true,
     "rows": [
       {
         "store_id": "S001",
         "store_name": "Koramangala",
         "metric_name": "score",
         "metric_value": 76,
         "observed_period": "2025-07",
         ...
       },
       ...
     ],
     "metadata": {
       "sheet_name": "Monthly_Trends",
       "last_updated": "2025-10-16T10:30:00.000Z",
       "total_rows": 500
     }
   }
   ```

3. If you see this, **SUCCESS!** Your API is working! ✅

---

## 🔧 Configure Dashboard to Use the Endpoint

Now update your dashboard to fetch from this endpoint instead of the embedded JSON.

### Option A: Replace Embedded JSON (Recommended)

Edit `src/components/dashboard/HeaderSummary.tsx`:

```typescript
// Change this line:
import localData from '../../data/audit_latest_responses_dual.json';

// To fetch from Google Sheets instead:
async function fetchGoogleSheetsData() {
  const SHEETS_API_URL = 'YOUR_WEB_APP_URL_HERE'; // Paste the URL from Step 3
  try {
    const response = await fetch(SHEETS_API_URL);
    const json = await response.json();
    return json.rows || [];
  } catch (error) {
    console.error('Failed to fetch from Google Sheets:', error);
    return [];
  }
}

// Update the useEffect:
useEffect(() => {
  Promise.all([
    fetchSheetSnapshot(),
    fetchGoogleSheetsData() // Add this
  ]).then(([sheet, googleData]) => {
    setSheet(sheet);
    // Merge googleData with sheet data here
  }).catch(() => setSheet([]))
    .finally(() => setLoading(false));
}, []);
```

### Option B: Import via ImportMetrics UI

1. Open your dashboard
2. Click **"Import Metrics"** button
3. Paste the Web App URL
4. The dashboard will fetch and import the data

---

## 🎯 Testing the Script

### Run Built-in Test Functions

In Apps Script editor, you can test the script before deploying:

1. **Select function**: `testGetData` from dropdown
2. **Click "Run"** (▶️ button)
3. **Check "Execution log"**: View → Logs
4. You should see: `Total rows: X` and sample data

### Test with Filters

```javascript
// In Apps Script editor, run:
testGetDataWithFilters()

// This tests filtering by store_id and metric
```

### View Summary Stats

```javascript
// In Apps Script editor, run:
getSummaryStats()

// Shows: total rows, unique stores, average score, etc.
```

---

## 🔍 Using Query Parameters

Your Web App supports filtering via URL parameters:

### Filter by Store
```
https://script.google.com/.../exec?store_id=S001
```

### Filter by Period
```
https://script.google.com/.../exec?period=2025-07
```

### Filter by Metric
```
https://script.google.com/.../exec?metric=score
```

### Multiple Filters
```
https://script.google.com/.../exec?store_id=S001&period=2025-07&metric=score
```

### Bypass Cache
```
https://script.google.com/.../exec?nocache=1
```

---

## ⚡ Performance & Caching

The script includes built-in caching:
- **Cache Duration**: 5 minutes (300 seconds)
- **Cache Key**: Based on query parameters
- **Auto-Clear**: Optionally clears when sheet is edited

### Manually Clear Cache

In Apps Script editor:
```javascript
clearCache() // Run this function
```

### Enable Auto-Cache Clearing

1. In Apps Script, click **Triggers** (clock icon ⏰)
2. Click **"Add Trigger"**
3. Settings:
   - Choose function: `onSheetEdit`
   - Choose event source: `From spreadsheet`
   - Choose event type: `On edit`
4. Click **"Save"**

Now cache clears automatically when you edit the sheet!

---

## 📊 Data Format Expected

The script expects your `Monthly_Trends` sheet to have these columns:

### Required Columns
- `store_id` - Store identifier (e.g., "S001")
- `store_name` - Store display name
- `metric_name` - "score" or "percentage"
- `metric_value` - Numeric value (0-100)
- `observed_period` - Period in YYYY-MM format (e.g., "2025-07")

### Optional Columns (for enhanced filtering)
- `period_type` - "monthly", "weekly", etc.
- `observed_local_time` - ISO 8601 timestamp
- `store_timezone` - IANA timezone
- `submission_time_utc` - UTC timestamp
- `source` - Data source identifier
- `notes` - Additional notes
- `auditor_name` - Who conducted the audit
- `auditor_id` - Auditor identifier
- `am_name` - Area Manager name
- `am_id` - Area Manager ID
- `region` - Region name (North, South, East, West)

---

## 🐛 Troubleshooting

### Error: "Sheet 'Monthly_Trends' not found"

**Solution**: Make sure the sheet tab is named exactly `Monthly_Trends` (case-sensitive)

### Error: "Authorization required"

**Solution**:
1. Go to Deploy → Test deployments
2. Click "Authorize" again
3. Re-deploy

### Empty `rows` Array

**Solution**:
1. Check that your sheet has data starting from row 2
2. Run `testGetData()` in Apps Script to see logs
3. Verify headers in row 1 match expected column names

### CORS Errors in Browser

**Solution**: Apps Script handles CORS automatically. If you see CORS errors:
1. Make sure deployment is set to "Anyone" access
2. Try using the exact deployment URL (not test URL)

### Stale Data

**Solution**:
1. Add `?nocache=1` to URL to bypass cache
2. Or run `clearCache()` in Apps Script
3. Or set up auto-cache clearing (see Performance section)

---

## 🔐 Security Notes

### Current Setup (Simple)
- **Access**: Anyone with the URL can read data
- **Security**: URL is hard to guess but not private
- **Best for**: Internal dashboards, non-sensitive data

### Enhanced Security (Optional)

If you need authentication:

1. **Change deployment settings**:
   - "Who has access": `Only myself`
   - Use Apps Script's built-in auth

2. **Add API Key** to script:
   ```javascript
   function doGet(e) {
     const apiKey = e.parameter.key;
     if (apiKey !== 'YOUR_SECRET_KEY') {
       return createJsonResponse({
         ok: false,
         error: 'Unauthorized'
       });
     }
     // ... rest of code
   }
   ```

3. **Call with key**:
   ```
   https://script.google.com/.../exec?key=YOUR_SECRET_KEY
   ```

---

## 🎨 Customization

### Change Sheet Name

Edit line 19 in the script:
```javascript
const SHEET_NAME = 'Your_Custom_Name';
```

### Change Cache Duration

Edit line 22:
```javascript
const CACHE_DURATION = 600; // 10 minutes
```

### Add Custom Filters

Add to `getMonthlyTrendsData` function:
```javascript
if (filters.region && rowObj.region !== filters.region) continue;
if (filters.am_id && rowObj.am_id !== filters.am_id) continue;
```

### Add Computed Fields

```javascript
rowObj.month = rowObj.observed_period ? rowObj.observed_period.split('-')[1] : null;
rowObj.year = rowObj.observed_period ? rowObj.observed_period.split('-')[0] : null;
```

---

## 📞 Next Steps

1. ✅ Create `Monthly_Trends` sheet
2. ✅ Add historical data
3. ✅ Install Apps Script
4. ✅ Deploy as Web App
5. ✅ Test the endpoint
6. ✅ Update dashboard to fetch from endpoint
7. 🎉 **Enjoy auto-updating trends!**

---

## 💡 Pro Tips

1. **Keep embedded JSON as fallback**: If Google Sheets is down, dashboard still works
2. **Set up auto-sync**: Add new monthly data to sheet, dashboard updates automatically
3. **Use caching**: Reduces API quota usage and improves performance
4. **Add trigger**: Auto-clear cache on sheet edit for instant updates
5. **Monitor logs**: View → Logs in Apps Script to debug issues

---

## 🚀 Advanced: Push to Backend

If you want to push data to your Node backend instead of pulling:

1. Uncomment the `sendDataToBackend()` function in the script
2. Update the `backendUrl` to your server
3. Add a trigger to call this function on sheet edit
4. Backend receives and stores data in `sheet_snapshot.json`

This way, your dashboard always has the latest data without calling Google Sheets!

---

## 📚 Additional Resources

- [Apps Script Documentation](https://developers.google.com/apps-script)
- [Web Apps Guide](https://developers.google.com/apps-script/guides/web)
- [Caching Service](https://developers.google.com/apps-script/reference/cache)
- [Triggers Guide](https://developers.google.com/apps-script/guides/triggers)

---

**Questions?** Check the troubleshooting section or run the test functions in Apps Script!
