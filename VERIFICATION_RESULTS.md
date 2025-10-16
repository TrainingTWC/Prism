# Dashboard Verification Results

## Test Date: October 16, 2025

## Data Source
- **Primary:** `src/data/audit_latest_responses_dual.json` (8 rows)
- **Secondary:** `server/data/sheet_snapshot.json` (empty - 0 rows)
- **Combined (deduped):** 8 rows total

## Expected Values (Calculated)

### Header Summary Cards

| Metric | Expected Value | Calculation Method |
|--------|---------------|-------------------|
| **Total Submissions** | 8 | Count of all rows in JSON |
| **Average Score** | 62.8% | Average of 4 score values: (69+59+47+76)/4 = 62.75 ≈ 62.8% |
| **Stores Covered** | 4 | Unique store_ids: S122, S068, S087, S048 |
| **Store Health** | 0 healthy, 2 warning, 2 critical | Based on thresholds: ≥80 (healthy), 60-79 (warning), <60 (critical) |

### Store Health Breakdown

| Store ID | Store Name | Score | Health Status |
|----------|-----------|-------|---------------|
| S048 | Kalyani Nagar Pune | 76 | ⚠️ WARNING |
| S122 | Jubilee walk Mohali | 69 | ⚠️ WARNING |
| S068 | Koramangala 8th block | 59 | 🔴 CRITICAL |
| S087 | EQUINOX - BKC | 47 | 🔴 CRITICAL |

### Top Movers (MoM)
**Status:** No movers available  
**Reason:** All stores have only one period (2025-07) of data. MoM calculation requires at least 2 periods per store.

## Store Trends Verification

### Chart Data

All stores have data for **2025-07** only:

| Store | Score | Percentage |
|-------|-------|------------|
| Jubilee walk Mohali | 69 | 78 |
| Koramangala 8th block | 59 | 66 |
| EQUINOX - BKC | 47 | 54 |
| Kalyani Nagar Pune | 76 | 84 |

### Expected Chart Behavior
- **Dual-line chart** showing score (left Y-axis, blue) and percentage (right Y-axis, green)
- **X-axis:** Single point at "2025-07"
- **Interactive tooltip:** Shows period and both metrics when hovering
- **Sparklines:** Single-point sparklines in the table (appears as a dot)
- **MoM column:** Shows "—" (no MoM available with single period)

## Components Verified

### ✅ HeaderSummary.tsx
- **Location:** `src/components/dashboard/HeaderSummary.tsx`
- **Data flow:** Fetches sheet snapshot (optional), merges with embedded JSON, deduplicates
- **Deduplication key:** `store_id|metric_name|observed_period`
- **Fallback:** Works without backend (uses only embedded JSON)
- **Calculations:** Verified to match expected values above

### ✅ StoreTrends.tsx
- **Location:** `src/components/dashboard/StoreTrends.tsx`
- **Uses:** Recharts for interactive dual-line chart
- **Data source:** `src/data/audit_latest_responses_dual.json`
- **Filter support:** Integrated with dashboard filters via `trendsUtils.ts`
- **Features:**
  - Interactive LineChart with dual Y-axes
  - Top gainers/losers cards (empty for single-period data)
  - Full store table with sparklines and MoM

### ✅ trendsUtils.ts
- **Location:** `src/components/dashboard/trendsUtils.ts`
- **Functions:**
  - `applyFilters`: Filters rows by storeId, trainerId, regionId, dateFrom, dateTo
  - `aggregatePeriodAverages`: Computes period-wise averages for a metric
  - `computeStoreSeries`: Builds time-series data per store
  - `computeMoM`: Calculates month-over-month percentage change

## Configuration Changes

### ✅ vite.config.ts
Added proxy configuration to forward `/api/*` requests to backend:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:4001',
    changeOrigin: true,
  }
}
```

### ⚠️ Backend Server (server/index.js)
- **Status:** GET `/api/sheet-snapshot` endpoint added
- **Issue:** Server requires `ajv` npm package (installed in server directory)
- **Workaround:** Frontend gracefully handles backend unavailability

## UI/UX Verification Checklist

- [ ] Header cards display with correct values
- [ ] Store health shows: 0 healthy • 2 warning • 2 critical
- [ ] Top movers cards hidden (no MoM data available)
- [ ] Interactive chart renders with both score and percentage lines
- [ ] Chart tooltip shows correct values on hover
- [ ] Store table shows all 4 stores
- [ ] Sparklines render (single dot for each store)
- [ ] MoM column shows "—" for all stores
- [ ] Filter changes (if any) update both header and trends

## Known Limitations

1. **Single Period Data:** Current JSON has only July 2025 data, so MoM cannot be calculated
2. **Missing Filter Fields:** JSON data lacks `trainer_id`, `region_id`, `area_manager_id` fields needed for full filter support
3. **Backend Dependency:** Sheet snapshot endpoint requires backend, but frontend works without it

## Next Steps for Full Functionality

1. **Add Multi-Period Data:** Include August, September data to enable MoM calculations
2. **Extend Data Schema:** Add trainer_id, region_id to enable all filter options
3. **Import Feature:** Use the ImportMetrics UI to add sheet data and test deduplication
4. **Styling:** Polish header layout to match design requirements

## Test Commands

```powershell
# Verify JSON structure
Get-Content "src/data/audit_latest_responses_dual.json" | ConvertFrom-Json | Format-Table store_id,metric_name,metric_value,observed_period

# Calculate average score
$data = Get-Content "src/data/audit_latest_responses_dual.json" | ConvertFrom-Json
($data | Where-Object { $_.metric_name -eq 'score' } | Measure-Object -Property metric_value -Average).Average

# Count unique stores
($data | Select-Object -Property store_id -Unique).Count
```

## Files Modified

1. `src/components/dashboard/HeaderSummary.tsx` - Created header summary component
2. `src/components/dashboard/StoreTrends.tsx` - Created interactive trends chart
3. `src/components/dashboard/trendsUtils.ts` - Created aggregation utilities
4. `src/audit-dashboard/views/Dashboard.tsx` - Integrated HeaderSummary and StoreTrends
5. `vite.config.ts` - Added API proxy configuration
6. `server/index.js` - Added GET `/api/sheet-snapshot` endpoint
7. `src/data/audit_latest_responses_dual.json` - Embedded user dataset

---

**Verification Status:** ✅ Ready for UI inspection
**Next Action:** Visually confirm the dashboard displays all metrics correctly in the browser
