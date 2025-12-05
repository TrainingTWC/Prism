# Trainer Calendar Dashboard - Google Apps Script Setup

## Overview
The Trainer Calendar Dashboard allows viewing and filtering all trainer calendar submissions with support for filtering by trainer name, store name, region, month, and year.

## Google Apps Script Setup

### 1. Update Existing Script
You need to update your existing Google Apps Script (the one already deployed for trainer calendar submissions) to support both POST (submit) and GET (fetch) requests.

### 2. Script Code
Replace your existing `google-apps-script-trainer-calendar.js` code with the contents of:
```
google-apps-script-trainer-calendar-dashboard.js
```

### 3. Key Features Added
The updated script now includes:
- **doPost()** - Handles calendar submissions (existing functionality)
- **doGet()** - NEW: Handles data fetching for the dashboard
- **getStoreRegions()** - Maps stores to regions for filtering

### 4. Deployment Steps
1. Open your Google Apps Script project: https://script.google.com
2. Replace the existing code with the new version from `google-apps-script-trainer-calendar-dashboard.js`
3. Click "Deploy" > "New deployment"
4. Select "Web app" as deployment type
5. Settings:
   - **Execute as**: Me (your Google account)
   - **Who has access**: Anyone
6. Click "Deploy"
7. Copy the deployment URL
8. The URL is already configured in `.env` as `VITE_TRAINER_CALENDAR_SCRIPT_URL`

### 5. Sheet Structure
The script creates/uses a sheet named "Trainer Calendar" with these columns:
- Timestamp
- Trainer ID
- Trainer Name
- Month
- Date
- Event Type
- Location
- Task
- Details
- Region
- Store Name

### 6. Optional: Store Mapping Sheet
For region filtering to work automatically, you can create a "Store Mapping" sheet with:
- Column A (Store ID)
- Column B (Store Name)
- Column C (Region)

## Dashboard Features

### Filters Available
1. **Search** - Free text search across all fields
2. **Trainer** - Filter by trainer name
3. **Region** - Filter by store region
4. **Store/Location** - Filter by specific store or location
5. **Month** - Filter by month (January, February, etc.)
6. **Year** - Filter by year (2024, 2025, etc.)

### Features
- **Real-time Filtering** - All filters work together
- **Export to CSV** - Export filtered results
- **Responsive Design** - Works on mobile and desktop
- **Dark Mode Support** - Matches application theme
- **Event Type Badges** - Color-coded by store/campus/outdoor
- **Grouped by Date** - Events organized by date
- **Refresh Button** - Manually reload data

### URL Parameters
The dashboard uses the EMPID URL parameter:
```
http://localhost:3000/Prism/?EMPID=h541
```

### Access
The "Trainer Calendar" tab is visible to all authenticated users in the main navigation.

## Testing

### 1. Test Data Fetch
```bash
curl "YOUR_SCRIPT_URL?action=fetch"
```

### 2. Test Data Submit (existing)
Use the Training Calendar form in the Checklists & Surveys tab to submit events.

### 3. Verify Dashboard
1. Navigate to the "Trainer Calendar" tab
2. Check that submitted events appear
3. Test all filters
4. Try exporting to CSV

## Troubleshooting

### No Data Showing
- Check that the Google Apps Script is deployed as "Anyone" can access
- Verify the URL in `.env` is correct
- Check browser console for CORS or network errors
- Ensure the "Trainer Calendar" sheet exists in your Google Sheet

### Filters Not Working
- Refresh the page to reload data
- Check that the data has the expected fields (region, storeName, etc.)
- Verify the data format in Google Sheets

### Export Not Working
- Ensure there are filtered entries (count > 0)
- Check browser's download settings
- Try a different browser

## Future Enhancements
- Add date range filtering
- Add trainer performance metrics
- Add calendar view visualization
- Add bulk export options
- Add email notifications for submissions
