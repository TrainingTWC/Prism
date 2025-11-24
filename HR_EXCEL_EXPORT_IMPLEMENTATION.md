# HR Connect Excel Export Implementation

## Overview
Added Excel export functionality to the HR Connect dashboard, allowing users to download survey data in the exact format matching the Google Sheet structure.

## Features Implemented

### 1. Excel Export Function (`Dashboard.tsx`)
- **Function**: `generateExcelReport()`
- **Location**: After `generatePDFReport()` function (around line 2686)
- **Functionality**:
  - Exports all filtered HR survey submissions
  - Matches exact Google Sheet column structure
  - Auto-sizes columns for readability
  - Generates filename with filter context and date
  - Only available for HR dashboard (validates `dashboardType === 'hr'`)

### 2. Download Buttons (`DashboardFilters.tsx`)
- **Desktop View**: 
  - Green "Download Excel" button appears next to the PDF download button
  - Only visible when viewing HR Connect dashboard
  - Located in the desktop action bar

- **Mobile View**:
  - Compact "Excel" button appears next to "PDF" button
  - Maintains responsive layout
  - Same conditional visibility (HR dashboard only)

## Excel File Format

### Column Headers (Matching Google Sheet)
```
1. Server Timestamp
2. Submission Time
3. HR Name
4. HR ID
5. AM Name
6. AM ID
7. Emp Name
8. Emp ID
9. Store Name
10. Store ID
11. Region
12-35. Q1-Q12 with Remarks columns
36. Total Score
37. Max Score
38. Percent
```

### File Naming Convention
```
HR_Connect_{FilterContext}_{Date}.xlsx
```

Examples:
- `HR_Connect_All_2024-01-15.xlsx` (No filters)
- `HR_Connect_North_2024-01-15.xlsx` (Region filter)
- `HR_Connect_Store123_2024-01-15.xlsx` (Store filter)
- `HR_Connect_John_Doe_2024-01-15.xlsx` (AM filter)

## Technical Details

### Dependencies
- **Library**: `xlsx` (already installed in package.json v0.18.5)
- **Import**: `import * as XLSX from 'xlsx';`

### Key Functions Used
- `XLSX.utils.json_to_sheet()` - Converts JSON data to worksheet
- `XLSX.utils.book_new()` - Creates new workbook
- `XLSX.utils.book_append_sheet()` - Adds worksheet to workbook
- `XLSX.writeFile()` - Downloads the Excel file

### Auto-sizing Logic
- Calculates maximum width for each column based on:
  - Header length
  - Cell content length across all rows
- Applies maximum width cap of 50 characters for readability

## User Experience

### Haptic Feedback
- `hapticFeedback.confirm()` - When starting export
- `hapticFeedback.ultraStrong()` - On successful export
- `hapticFeedback.error()` - On error

### Notifications
- "Excel Downloaded" (success)
- "Error generating Excel" (error)

### Validation
- Checks if dashboard type is HR
- Validates that filtered submissions exist
- Provides clear error messages for invalid states

## Filter Integration

The export respects all active filters:
- ✅ Region filter
- ✅ Store filter
- ✅ Area Manager filter
- ✅ HR Person filter

Only filtered/visible data is exported, matching what the user sees in the dashboard.

## Component Changes

### `Dashboard.tsx`
1. Added `import * as XLSX from 'xlsx';`
2. Created `generateExcelReport()` function
3. Added `onDownloadExcel={generateExcelReport}` prop to DashboardFilters

### `DashboardFilters.tsx`
1. Added `onDownloadExcel?: () => void;` to props interface
2. Added `onDownloadExcel` to destructured props
3. Added conditional Excel button to desktop view
4. Added conditional Excel button to mobile view

## Testing Recommendations

1. **Basic Export**: Test exporting all HR data without filters
2. **Filtered Export**: Test each filter type (Region, Store, AM, HR Person)
3. **Multiple Filters**: Test combinations of filters
4. **Column Format**: Verify all 38 columns match Google Sheet exactly
5. **Mobile/Desktop**: Test buttons on both desktop and mobile views
6. **Edge Cases**: 
   - No data available
   - Single submission
   - Large datasets (100+ submissions)
7. **Other Dashboards**: Verify Excel button doesn't appear on Training/QA/Operations dashboards

## Notes

- Excel export is HR dashboard exclusive (by design)
- Server Timestamp is set to current time on export (not original submission timestamp)
- Submission Time preserves original format from Google Sheets
- Percentage scores are exported as-is (not converted to 1-5 scale for Excel)
- All 12 questions include both answer and remarks columns
