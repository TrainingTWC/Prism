# Google Sheets Template for Audit Dashboard

## Quick Start

1. Create a new Google Sheet
2. Copy the headers and sample data below
3. Replace sample data with your actual audit data
4. Export as JSON or use the import feature in the dashboard

---

## Sheet Headers (Column Names)

Copy this first row to your Google Sheet:

```
store_id	store_name	metric_name	metric_value	period_type	observed_period	observed_local_time	store_timezone	submission_time_utc	source	notes
```

---

## Sample Data (Copy to Google Sheets)

### July 2025 Data

```
S122	Jubilee walk Mohali	score	69	monthly	2025-07	2025-07-10T18:00:00+05:30	Asia/Kolkata	2025-07-10T02:30:10Z	google_sheets	July audit
S122	Jubilee walk Mohali	percentage	78	monthly	2025-07	2025-07-10T18:00:00+05:30	Asia/Kolkata	2025-07-10T02:30:10Z	google_sheets	July audit
S068	Koramangala 8th block	score	59	monthly	2025-07	2025-07-10T18:00:00+05:30	Asia/Kolkata	2025-07-10T02:30:10Z	google_sheets	July audit
S068	Koramangala 8th block	percentage	66	monthly	2025-07	2025-07-10T18:00:00+05:30	Asia/Kolkata	2025-07-10T02:30:10Z	google_sheets	July audit
S087	EQUINOX - BKC	score	47	monthly	2025-07	2025-07-11T18:00:00+05:30	Asia/Kolkata	2025-07-11T02:30:10Z	google_sheets	July audit
S087	EQUINOX - BKC	percentage	54	monthly	2025-07	2025-07-11T18:00:00+05:30	Asia/Kolkata	2025-07-11T02:30:10Z	google_sheets	July audit
S048	Kalyani Nagar Pune	score	76	monthly	2025-07	2025-07-11T18:00:00+05:30	Asia/Kolkata	2025-07-11T02:30:10Z	google_sheets	July audit
S048	Kalyani Nagar Pune	percentage	84	monthly	2025-07	2025-07-11T18:00:00+05:30	Asia/Kolkata	2025-07-11T02:30:10Z	google_sheets	July audit
```

### August 2025 Data (Sample - Replace with your actual data)

```
S122	Jubilee walk Mohali	score	72	monthly	2025-08	2025-08-10T18:00:00+05:30	Asia/Kolkata	2025-08-10T02:30:10Z	google_sheets	August audit
S122	Jubilee walk Mohali	percentage	81	monthly	2025-08	2025-08-10T18:00:00+05:30	Asia/Kolkata	2025-08-10T02:30:10Z	google_sheets	August audit
S068	Koramangala 8th block	score	65	monthly	2025-08	2025-08-10T18:00:00+05:30	Asia/Kolkata	2025-08-10T02:30:10Z	google_sheets	August audit
S068	Koramangala 8th block	percentage	72	monthly	2025-08	2025-08-10T18:00:00+05:30	Asia/Kolkata	2025-08-10T02:30:10Z	google_sheets	August audit
S087	EQUINOX - BKC	score	52	monthly	2025-08	2025-08-11T18:00:00+05:30	Asia/Kolkata	2025-08-11T02:30:10Z	google_sheets	August audit
S087	EQUINOX - BKC	percentage	60	monthly	2025-08	2025-08-11T18:00:00+05:30	Asia/Kolkata	2025-08-11T02:30:10Z	google_sheets	August audit
S048	Kalyani Nagar Pune	score	78	monthly	2025-08	2025-08-11T18:00:00+05:30	Asia/Kolkata	2025-08-11T02:30:10Z	google_sheets	August audit
S048	Kalyani Nagar Pune	percentage	86	monthly	2025-08	2025-08-11T18:00:00+05:30	Asia/Kolkata	2025-08-11T02:30:10Z	google_sheets	August audit
```

### September 2025 Data (Sample - Replace with your actual data)

```
S122	Jubilee walk Mohali	score	75	monthly	2025-09	2025-09-10T18:00:00+05:30	Asia/Kolkata	2025-09-10T02:30:10Z	google_sheets	September audit
S122	Jubilee walk Mohali	percentage	83	monthly	2025-09	2025-09-10T18:00:00+05:30	Asia/Kolkata	2025-09-10T02:30:10Z	google_sheets	September audit
S068	Koramangala 8th block	score	68	monthly	2025-09	2025-09-10T18:00:00+05:30	Asia/Kolkata	2025-09-10T02:30:10Z	google_sheets	September audit
S068	Koramangala 8th block	percentage	76	monthly	2025-09	2025-09-10T18:00:00+05:30	Asia/Kolkata	2025-09-10T02:30:10Z	google_sheets	September audit
S087	EQUINOX - BKC	score	55	monthly	2025-09	2025-09-11T18:00:00+05:30	Asia/Kolkata	2025-09-11T02:30:10Z	google_sheets	September audit
S087	EQUINOX - BKC	percentage	64	monthly	2025-09	2025-09-11T18:00:00+05:30	Asia/Kolkata	2025-09-11T02:30:10Z	google_sheets	September audit
S048	Kalyani Nagar Pune	score	80	monthly	2025-09	2025-09-11T18:00:00+05:30	Asia/Kolkata	2025-09-11T02:30:10Z	google_sheets	September audit
S048	Kalyani Nagar Pune	percentage	88	monthly	2025-09	2025-09-11T18:00:00+05:30	Asia/Kolkata	2025-09-11T02:30:10Z	google_sheets	September audit
```

---

## Simplified Template (Minimum Required Fields)

If you want to keep it simple, use only these columns:

```
store_id	store_name	metric_name	metric_value	observed_period
```

Sample rows:
```
S122	Jubilee walk Mohali	score	69	2025-07
S122	Jubilee walk Mohali	percentage	78	2025-07
S068	Koramangala 8th block	score	59	2025-07
S068	Koramangala 8th block	percentage	66	2025-07
```

---

## Column Descriptions

| Column | Type | Format | Required | Description |
|--------|------|--------|----------|-------------|
| `store_id` | Text | S001, S122, etc. | ✅ YES | Unique store identifier |
| `store_name` | Text | Any text | ✅ YES | Human-readable store name |
| `metric_name` | Text | score OR percentage | ✅ YES | Type of metric |
| `metric_value` | Number | 0-100 | ✅ YES | Numeric value of the metric |
| `period_type` | Text | monthly, weekly, daily | ⚠️ Optional | Type of reporting period |
| `observed_period` | Text | YYYY-MM | ✅ YES | Period identifier (e.g., 2025-07) |
| `observed_local_time` | Text | ISO 8601 | ⚠️ Optional | Local timestamp with timezone |
| `store_timezone` | Text | Asia/Kolkata, etc. | ⚠️ Optional | IANA timezone identifier |
| `submission_time_utc` | Text | ISO 8601 UTC | ⚠️ Optional | UTC submission timestamp |
| `source` | Text | google_sheets, etc. | ⚠️ Optional | Data source identifier |
| `notes` | Text | Any text | ⚠️ Optional | Additional notes or comments |

---

## Expected MoM Growth with Sample Data

With the sample data above (July → August → September), you'll see:

### Jubilee walk Mohali (S122)
- July: 69 → August: 72 → September: 75
- MoM: +4.3% (July→Aug), +4.2% (Aug→Sept)

### Koramangala 8th block (S068)
- July: 59 → August: 65 → September: 68
- MoM: +10.2% (July→Aug), +4.6% (Aug→Sept)

### EQUINOX - BKC (S087)
- July: 47 → August: 52 → September: 55
- MoM: +10.6% (July→Aug), +5.8% (Aug→Sept)

### Kalyani Nagar Pune (S048)
- July: 76 → August: 78 → September: 80
- MoM: +2.6% (July→Aug), +2.6% (Aug→Sept)

**Top Gainer:** EQUINOX - BKC (+10.6% MoM in August)  
**Steady Performer:** Kalyani Nagar Pune (consistent +2.6%)

---

## How to Use This Data

### Option 1: Export from Google Sheets as JSON

1. Use a Google Sheets to JSON converter or Apps Script
2. Copy the JSON output
3. Use the "Import Metrics" button in the dashboard
4. Paste and import

### Option 2: Manual JSON Export

Use this Google Apps Script to export as JSON:

```javascript
function exportToJSON() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  
  Logger.log(JSON.stringify(rows, null, 2));
}
```

### Option 3: Direct Import (If you set up Google Sheets API)

- Use the existing Google Apps Script endpoint we created
- Configure the script to read from your sheets
- Dashboard will auto-fetch the latest data

---

## Quick Copy Template for Excel/Sheets

Headers row:
```
store_id	store_name	metric_name	metric_value	observed_period
```

Then add your data rows. Each store needs TWO rows per month:
1. One for `score`
2. One for `percentage`

Example pattern:
```
S001	Store Name Here	score	75	2025-10
S001	Store Name Here	percentage	82	2025-10
```

---

## Date Format Quick Reference

| Month | observed_period |
|-------|----------------|
| January 2025 | 2025-01 |
| February 2025 | 2025-02 |
| March 2025 | 2025-03 |
| April 2025 | 2025-04 |
| May 2025 | 2025-05 |
| June 2025 | 2025-06 |
| July 2025 | 2025-07 |
| August 2025 | 2025-08 |
| September 2025 | 2025-09 |
| October 2025 | 2025-10 |
| November 2025 | 2025-11 |
| December 2025 | 2025-12 |

---

## Validation Rules

✅ **Valid metric_name values:** `score`, `percentage`  
✅ **Valid metric_value range:** 0 to 100  
✅ **Date format:** YYYY-MM (e.g., 2025-07, 2025-08)  
✅ **Each store needs:** Both score AND percentage rows for each period

⚠️ **Common mistakes to avoid:**
- Don't use slashes in dates (2025/07 ❌ → 2025-07 ✅)
- Don't skip percentage or score rows
- Don't use spaces in metric_name (use "score", not "Score" or "SCORE")
- Ensure store_id is consistent across all rows for the same store

---

## Need Help?

If you encounter issues:
1. Check the column names match exactly (case-sensitive)
2. Verify dates are in YYYY-MM format
3. Ensure each store has both score and percentage
4. Check metric_value is a number between 0-100

**Next Step:** Copy the template above to Google Sheets, replace with your actual data, and use the Import Metrics feature in the dashboard!
