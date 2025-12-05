# Trainer Calendar Dashboard - Google Apps Script Setup

## Overview
The Trainer Calendar Dashboard allows viewing and filtering all trainer calendar submissions with support for filtering by trainer name, store name, region, month, and year.

**IMPORTANT**: This is a **UNIFIED SCRIPT** that handles BOTH:
1. ✅ Collecting calendar submissions from the Training Calendar form
2. ✅ Sending data to the Trainer Calendar Dashboard

You only need ONE Google Apps Script deployment for both features.

## Google Apps Script Setup

### 1. Single Script for Both Features
The script `google-apps-script-trainer-calendar-dashboard.js` is a unified solution that:
- **Receives** calendar submissions via POST requests (from Training Calendar form)
- **Provides** calendar data via GET requests (to Trainer Calendar Dashboard)
- **Stores** all data in a single "Trainer Calendar" sheet
- **Maps** store IDs to regions automatically (if Store Mapping sheet exists)

### 2. Replace Existing Script
If you previously had `google-apps-script-trainer-calendar.js`, **REPLACE** it with:
```
google-apps-script-trainer-calendar-dashboard.js
```

This new script does everything the old one did PLUS adds dashboard fetching capabilities.

### 3. Deployment Steps (ONE SCRIPT, ONE DEPLOYMENT)
1. Open your Google Apps Script project: https://script.google.com
2. **IMPORTANT**: If you have an existing deployment for trainer calendar, you can update it OR create a new one
3. Copy ALL the code from `google-apps-script-trainer-calendar-dashboard.js`
4. Paste it into your Google Apps Script editor (replace existing code if any)
5. Click "Deploy" > "New deployment" (or "Manage deployments" to update existing)
6. Select "Web app" as deployment type
7. Settings:
   - **Execute as**: Me (your Google account)
   - **Who has access**: Anyone
8. Click "Deploy"
9. Copy the deployment URL
10. **IMPORTANT**: Use this SAME URL for BOTH:
    - The Training Calendar form (submitting events)
    - The Trainer Calendar Dashboard (fetching events)
11. Ensure the URL is configured in `.env` as `VITE_TRAINER_CALENDAR_SCRIPT_URL`

### 4. How It Works
**Same URL, Different Actions:**
- When Training Calendar form submits → POST request → Script stores data
- When Dashboard loads → GET request with `?action=fetch` → Script returns all data

**Example:**
- Submit: `POST https://script.google.com/macros/s/YOUR_ID/exec`
- Fetch: `GET https://script.google.com/macros/s/YOUR_ID/exec?action=fetch`

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
