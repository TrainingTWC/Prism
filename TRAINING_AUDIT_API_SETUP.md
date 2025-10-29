# Training Audit API Setup - Direct Read from Training Audit Sheet

## Overview

The dashboard now reads **directly from the Training Audit sheet** instead of using the Monthly_Trends aggregation sheet. This provides real-time access to all audit records while still calculating summary metrics server-side.

## Architecture

### Old Approach (Monthly_Trends)
- ❌ Required manual sync via `syncMonthlyTrends()` function
- ❌ Data in dual-row format (score + percentage rows)
- ❌ Complex aggregation logic needed in frontend
- ❌ Sync errors blocked all data access

### New Approach (Direct Training Audit Read)
- ✅ Reads directly from Training Audit sheet
- ✅ No sync required - always current data
- ✅ Server-side summary calculations
- ✅ Simpler frontend code
- ✅ Single source of truth

## Google Apps Script Setup

### 1. Deploy the Training Audit API

**File:** `google-apps-script-training-audit-api.js`

**Steps:**
1. Open Google Apps Script editor for your spreadsheet
2. Create a new script file called "Training Audit API"
3. Copy the contents of `google-apps-script-training-audit-api.js`
4. Click **Deploy** > **New deployment**
5. Select type: **Web app**
6. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy**
8. Copy the deployment URL

**Current URL:**
```
https://script.google.com/macros/s/AKfycbwkHZB4r33bGfECY9YQQiCgTZE2qCHDgS62rzm2zF7nTiVuZ-OAVUp-yBus7k0aOA2SZA/exec
```

### 2. What the API Returns

**Endpoint:** GET request to deployment URL

**Response Structure:**
```json
{
  "ok": true,
  "summary": {
    "total_submissions": 156,
    "stores_covered": 45,
    "average_score": 75.3,
    "store_health": {
      "healthy": 12,
      "warning": 18,
      "critical": 15
    }
  },
  "records": [
    {
      "server_timestamp": "2025-10-15 10:30:00",
      "submission_time": "2025-10-15 10:25:00",
      "observed_period": "2025-10",
      "trainer_name": "John Doe",
      "trainer_id": "H1234",
      "am_name": "Jane Smith",
      "am_id": "H5678",
      "store_name": "Store Name",
      "store_id": "S001",
      "region": "North",
      "mod": "MOD Name",
      "total_score": 45,
      "percentage": 75.5
    }
  ],
  "metadata": {
    "totalRows": 156,
    "timestamp": "2025-10-29T12:00:00.000Z"
  }
}
```

## Frontend Integration

### Updated Files

**1. `src/components/dashboard/useTrendsData.ts`**
- Changed from `fetchGoogleSheets()` to `fetchTrainingAuditData()`
- Now returns both `records` and `summary`
- Records contain full audit data
- Summary contains pre-calculated metrics

**2. `src/components/dashboard/HeaderSummary.tsx`**
- Removed complex `computeSummary()` function
- Now uses API's `summary` object directly
- Simpler, cleaner code
- Metrics: Total Submissions, Average Score, Store Health, Stores Covered

### Data Structure

**Records Array:**
Each record contains:
- Metadata: timestamps, trainer, AM, store info
- Scoring: total_score, percentage
- Period: observed_period (YYYY-MM format)

**Summary Object:**
Pre-calculated on server:
- `total_submissions`: Count of all audits
- `stores_covered`: Unique store count
- `average_score`: Average percentage across all audits
- `store_health`: Breakdown by performance tier
  - `healthy`: Stores with avg ≥80%
  - `warning`: Stores with avg 60-79%
  - `critical`: Stores with avg <60%

## Column Positions (Training Audit Sheet)

The API reads from these specific columns:

| Column | Position | Field |
|--------|----------|-------|
| Server Timestamp | A (1) | Auto-generated |
| Submission Time | B (2) | User submitted |
| Trainer Name | C (3) | From form |
| Trainer ID | D (4) | From form |
| AM Name | E (5) | From form |
| AM ID | F (6) | From form |
| Store Name | G (7) | From mapping |
| Store ID | H (8) | From form |
| Region | I (9) | From mapping |
| MOD | J (10) | From form |
| HRBP ID | K (11) | From mapping |
| Regional HR ID | L (12) | From mapping |
| HR Head ID | M (13) | From mapping |
| LMS Head ID | N (14) | From mapping |
| ... | ... | Question columns |
| **Total Score** | **BQ (69)** | **Calculated** |
| Max Score | BR (70) | Calculated |
| **Percentage** | **BS (71)** | **Calculated** |

## Testing the API

### 1. Test in Browser
Open the deployment URL in your browser:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

You should see JSON response with summary and records.

### 2. Check Console Logs
In the dashboard, open browser DevTools Console to see:
- "Fetching data from Training Audit API..."
- "Training Audit API Response: { recordsCount: X, summary: {...} }"
- "Sample records: [...]"

### 3. Verify Metrics
Dashboard should display:
- Total Submissions > 0
- Average Score (percentage)
- Store Health distribution
- Stores Covered count

## Troubleshooting

### API Returns Error
**Error:** `Sheet "Training Audit" not found`
- Check sheet name exactly matches "Training Audit"
- Update `CONFIG.AUDIT_SHEET_NAME` if different

### No Data Showing
- Check browser console for errors
- Verify API URL is correct in `useTrendsData.ts`
- Test API URL directly in browser
- Check Training Audit sheet has data

### Wrong Columns Read
- Verify column positions match your sheet structure
- Update `COLS` object in the script if needed
- Columns are 0-indexed in arrays (subtract 1 from spreadsheet column number)

### Performance Issues
- Adjust `CONFIG.CHUNK_SIZE` (default: 50 rows per chunk)
- Consider reading fewer columns if not needed
- Current setup reads columns 1-71 (A-BS)

## Benefits of This Approach

1. **Real-time Data**: Always shows current audit records
2. **No Sync Required**: Eliminates manual sync step and errors
3. **Server-side Calculations**: Reduces frontend complexity
4. **Single Source**: Training Audit sheet is the only source
5. **Better Performance**: Chunked reading handles large datasets
6. **Easier Debugging**: Clear API response structure

## Monthly_Trends Sheet (Optional)

The `syncMonthlyTrends()` script is now **optional**. You can still use it if you want:
- Historical aggregations
- Month-over-month comparisons
- Separate analytics workflow

But the dashboard no longer depends on it.

## Next Steps

1. ✅ Deploy `google-apps-script-training-audit-api.js` as web app
2. ✅ Copy deployment URL
3. ✅ Update `TRAINING_AUDIT_API_URL` in `useTrendsData.ts`
4. ✅ Test in browser
5. ✅ Build and deploy frontend
6. ✅ Verify dashboard shows correct data

## Support

If you need to modify:
- **Column positions**: Update `COLS` object in the script
- **Summary calculations**: Update `calculateSummary()` function
- **Data filtering**: Update `readAuditData()` function
- **Performance tuning**: Adjust `CONFIG.CHUNK_SIZE`
