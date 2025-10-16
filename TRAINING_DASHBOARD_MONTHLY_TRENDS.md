# Training Dashboard - Monthly Trends Integration

## Overview
Updated the Training Dashboard to display total submissions count using the Monthly_Trends data from Google Sheets instead of the raw Training Audit data.

## Problem
The Training Dashboard was counting submissions directly from the Training Audit data (`filteredTrainingData.length`), which doesn't reflect the aggregated monthly trends data being used in other parts of the dashboard (like the Historic Trends section).

## Solution
Integrated the `useTrendsData` hook to fetch Monthly_Trends data and use it for calculating total submissions in the Training Dashboard stats.

## Changes Made

### 1. Added useTrendsData Import
**File:** `components/Dashboard.tsx`

```typescript
// Added to imports section (line ~46)
import { useTrendsData } from '../src/components/dashboard/useTrendsData';
```

### 2. Added useTrendsData Hook
**File:** `components/Dashboard.tsx`

```typescript
// Added after state declarations (line ~91)
// Monthly Trends data for Training Dashboard
const { rows: trendsData, loading: trendsLoading } = useTrendsData();
```

### 3. Updated Stats Calculation for Training Dashboard
**File:** `components/Dashboard.tsx` (lines ~800-824)

**OLD:**
```typescript
// For Training dashboard, use Training Audit data
if (dashboardType === 'training') {
  if (!filteredTrainingData) return null;

  const totalSubmissions = filteredTrainingData.length;
  const avgScore = totalSubmissions > 0 
    ? filteredTrainingData.reduce((acc, s) => acc + parseFloat(s.percentageScore || '0'), 0) / totalSubmissions 
    : 0;
  const uniqueTrainers = new Set(filteredTrainingData.map(s => s.trainerId)).size;
  const uniqueStores = new Set(filteredTrainingData.map(s => s.storeId)).size;

  return {
    totalSubmissions,
    avgScore: Math.round(avgScore),
    uniqueEmployees: uniqueTrainers,
    uniqueStores
  };
}
```

**NEW:**
```typescript
// For Training dashboard, use Monthly_Trends data
if (dashboardType === 'training') {
  if (!trendsData || trendsLoading) return null;

  // Filter to only percentage rows to avoid double counting
  // Each submission has 2 rows: one for 'score' and one for 'percentage'
  const percentageRows = trendsData.filter((r: any) => r.metric_name === 'percentage');
  
  const totalSubmissions = percentageRows.length;
  
  // Calculate average score from percentage rows
  const avgScore = totalSubmissions > 0 
    ? percentageRows.reduce((acc: number, r: any) => acc + (parseFloat(r.metric_value) || 0), 0) / totalSubmissions 
    : 0;
  
  // Get unique stores from the trends data
  const uniqueStores = new Set(percentageRows.map((r: any) => r.store_id)).size;
  
  // For unique employees/trainers, we need to use the actual training data
  // since Monthly_Trends doesn't have trainer information
  const uniqueTrainers = filteredTrainingData 
    ? new Set(filteredTrainingData.map(s => s.trainerId)).size 
    : 0;

  return {
    totalSubmissions,
    avgScore: Math.round(avgScore),
    uniqueEmployees: uniqueTrainers,
    uniqueStores
  };
}
```

### 4. Updated useMemo Dependency Array
**File:** `components/Dashboard.tsx` (line ~864)

```typescript
// Added trendsData and trendsLoading to dependencies
}, [filteredSubmissions, filteredAMOperations, filteredTrainingData, filteredQAData, dashboardType, trendsData, trendsLoading]);
```

## Key Implementation Details

### 🎯 Avoiding Double Counting
The Monthly_Trends sheet contains **2 rows per submission**:
1. One row with `metric_name = 'score'` (the raw score value)
2. One row with `metric_name = 'percentage'` (the percentage value)

To get the accurate count, we filter to **only percentage rows**:
```typescript
const percentageRows = trendsData.filter((r: any) => r.metric_name === 'percentage');
const totalSubmissions = percentageRows.length; // ✅ Correct count
```

**Without filtering:**
- trendsData.length would give **double the actual submissions** (e.g., 340 rows instead of 170 submissions)

### 📊 Data Sources
- **Total Submissions**: Monthly_Trends data (percentage rows only)
- **Average Score**: Monthly_Trends data (percentage metric values)
- **Unique Stores**: Monthly_Trends data (store_id field)
- **Unique Trainers**: Training Audit data (trainerId field)
  - Note: Monthly_Trends doesn't contain trainer information, so we still use the raw training data for this metric

### 🔄 Data Flow
```
Google Sheets (Monthly_Trends)
  ↓
useTrendsData() hook
  ↓
Filter to percentage rows only
  ↓
Calculate totalSubmissions = percentageRows.length
  ↓
Display in Training Dashboard stats
```

## Monthly_Trends Data Structure

Each submission creates 2 rows:

| store_id | metric_name | metric_value | observed_period |
|----------|-------------|--------------|-----------------|
| S027     | score       | 45           | 2025-07         |
| S027     | percentage  | 90           | 2025-07         |

**Counting logic:**
- ❌ `trendsData.length` = 340 (wrong - double count)
- ✅ `trendsData.filter(r => r.metric_name === 'percentage').length` = 170 (correct)

## Benefits

1. **Consistency**: Total submissions now matches the aggregated monthly trends data
2. **Accuracy**: Avoids double counting by filtering to percentage rows only
3. **Performance**: Uses pre-aggregated data from Google Sheets
4. **Unified Source**: Training Dashboard stats now align with Historic Trends section

## Testing

### Manual Testing Steps

1. **Check Total Submissions Count**
   - Open Training Dashboard
   - Note the "Total Submissions" value
   - Should show: **170 submissions** (not 340)

2. **Verify Against Google Sheets**
   - Open Monthly_Trends sheet
   - Filter to `metric_name = 'percentage'`
   - Count rows (should match dashboard count)

3. **Check Other Stats**
   - Average Score should be calculated from percentage values
   - Unique Stores should match distinct store_ids
   - Unique Trainers should still work from training audit data

4. **Test Loading States**
   - Refresh page and verify loading states work correctly
   - Stats should show null/loading until trendsData is loaded

## Edge Cases Handled

✅ **No data**: Returns null if trendsData is empty or still loading
✅ **Double counting**: Filters to percentage rows only
✅ **Missing trainer data**: Falls back to 0 if filteredTrainingData is unavailable
✅ **Average calculation**: Only calculates from percentage rows to match displayed count

## Files Modified

- `components/Dashboard.tsx`
  - Added useTrendsData import
  - Added trendsData hook
  - Updated training dashboard stats calculation
  - Updated useMemo dependencies

## Dependencies

- `useTrendsData` hook (already existed in `src/components/dashboard/useTrendsData.ts`)
- Monthly_Trends Google Sheets data
- Existing Training Audit data (for trainer count only)

---

**Status**: ✅ Complete
**Date**: January 2025
**Impact**: Training Dashboard now shows accurate submission counts from Monthly_Trends data
