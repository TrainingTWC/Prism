# Finance Historic Data Setup Guide

This guide walks you through setting up historic data tracking for Finance audits in your Prism Dashboard.

## Overview

The Finance Historic Data system:
- Stores historical audit scores (Store ID, Audit Date, Region, Percentage)
- Automatically appends new audits to the historic data sheet
- Displays trend charts in the Finance Dashboard and PDF reports
- Tracks performance over time for each store

---

## Step 1: Create Apps Script

### 1.1 Open Google Apps Script

1. Open your Finance Audits Google Spreadsheet
2. Click **Extensions** > **Apps Script**
3. Delete any existing code in the editor

### 1.2 Copy the Script

1. Open the file: `finance-historic-google-apps-script.js` in your project
2. Copy all the code
3. Paste it into the Apps Script editor

### 1.3 Configure the Script

Update these variables at the top of the script:

```javascript
const FINANCE_SHEET_NAME = 'Finance Audits'; // Your main audit sheet name
const HISTORIC_SHEET_NAME = 'Historic Data'; // Historic data sheet name
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your spreadsheet ID
```

**To find your Spreadsheet ID:**
- Look at the URL of your Google Sheet
- The ID is the long string between `/d/` and `/edit`
- Example: `https://docs.google.com/spreadsheets/d/1abc...xyz123/edit`
- Copy `1abc...xyz123` as your SPREADSHEET_ID

### 1.4 Save and Deploy

1. Click the **Save** icon (💾) or press `Ctrl+S`
2. Name your project: "Finance Historic Data Manager"
3. Click **Deploy** > **New deployment**
4. Click the gear icon ⚙️ next to "Select type"
5. Choose **Web app**
6. Configure deployment:
   - **Description**: "Finance Historic Data API"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
7. Click **Deploy**
8. **Copy the Web App URL** - you'll need this for Step 2

---

## Step 2: Create Historic Data Sheet

### 2.1 Run Setup Function

1. In Apps Script editor, select the function: `setupHistoricDataSheet`
2. Click the **Run** button (▶️)
3. You may need to authorize the script:
   - Click **Review Permissions**
   - Choose your Google account
   - Click **Advanced** > **Go to Finance Historic Data Manager (unsafe)**
   - Click **Allow**
4. The script will create a new sheet called "Historic Data" with headers

### 2.2 Import Existing Data (Optional)

If you have existing finance audit data to import:

1. In Apps Script editor, select the function: `migrateExistingDataToHistoric`
2. Click **Run**
3. Check the **Execution log** (View > Logs) to see how many records were migrated
4. Verify the data in the "Historic Data" sheet

**Manual Import Alternative:**

If you have the data in the format provided, you can copy it directly:

1. Open the "Historic Data" sheet
2. Copy your existing data (Store ID, Audit date, Region, Percentage)
3. Paste it starting from row 2 (below headers)

---

## Step 3: Configure Frontend

### 3.1 Update Endpoint URL

1. Open `services/dataService.ts` in your Prism project
2. Find the line:
   ```typescript
   const FINANCE_HISTORIC_ENDPOINT = 'YOUR_HISTORIC_ENDPOINT_URL_HERE';
   ```
3. Replace `'YOUR_HISTORIC_ENDPOINT_URL_HERE'` with the Web App URL you copied in Step 1.4
4. Save the file

Example:
```typescript
const FINANCE_HISTORIC_ENDPOINT = 'https://script.google.com/macros/s/AKfycby.../exec';
```

### 3.2 Rebuild Application

```bash
npm run build
```

Or if running in development:
```bash
npm run dev
```

---

## Step 4: Test the Setup

### 4.1 Test Data Fetching

1. Open your Prism Dashboard
2. Navigate to the Finance Dashboard
3. Apply a store filter
4. You should see a "Historic Performance Trend" chart if historic data exists for that store

### 4.2 Test Apps Script Directly

In Apps Script editor:

1. Select function: `testHistoricData`
2. Click **Run**
3. Check **Execution log** (View > Logs)
4. You should see JSON output with historic data

### 4.3 Test PDF Report

1. In Finance Dashboard, apply a store filter
2. Click **Generate PDF Report**
3. The PDF should include a "Historic Performance Trend" section showing the trend chart

---

## Step 5: Automatic Updates (Optional)

### 5.1 Set Up Trigger for Auto-Append

To automatically add new audits to historic data:

1. In Apps Script editor, click **Triggers** (clock icon ⏰) in left sidebar
2. Click **+ Add Trigger**
3. Configure:
   - **Function**: `onFinanceAuditSubmit`
   - **Deployment**: Head
   - **Event source**: From spreadsheet
   - **Event type**: On form submit (if using Google Forms) or On change
   - **Failure notification**: Notify me daily
4. Click **Save**

### 5.2 Verify Column Mapping

The script needs to find these columns in your Finance Audits sheet:
- Store ID (or StoreID, store_id)
- Submission Time (or Date, Audit Date)
- Region
- Score Percentage (or Percentage, scorePercentage)

If your column names differ, update the `onFinanceAuditSubmit` function:

```javascript
const storeIdIdx = findColumnIndex(headers, ['Your Column Name Here']);
```

---

## Usage

### Viewing Historic Trends

**In Dashboard:**
1. Navigate to Finance Dashboard
2. Apply a store filter from the filters dropdown
3. Historic trend chart appears above the audit list
4. Shows up to last 10 audits with trend line

**In PDF Reports:**
1. Apply store filter in Finance Dashboard
2. Click "Generate PDF Report"
3. PDF includes historic trend chart on first page
4. Shows trend analysis and summary statistics

### Data Format

Historic Data sheet format:

| Store ID | Audit date | Region | Percentage |
|----------|------------|--------|------------|
| S049     | 8/1/2025   | North  | 92.96      |
| S170     | 8/4/2025   | West   | 61.9       |

- **Store ID**: Store identifier (e.g., S049)
- **Audit date**: Date format M/D/YYYY (e.g., 8/1/2025)
- **Region**: North, South, East, West
- **Percentage**: Audit score percentage (0-100)

---

## Troubleshooting

### Problem: Historic data not showing in dashboard

**Solutions:**
1. Check if FINANCE_HISTORIC_ENDPOINT is configured in dataService.ts
2. Verify the Apps Script Web App URL is correct
3. Check browser console for errors
4. Ensure "Historic Data" sheet exists and has data
5. Apply a store filter - historic data only shows when viewing a specific store

### Problem: Apps Script returns error

**Solutions:**
1. Check SPREADSHEET_ID is correct
2. Verify sheet names (FINANCE_SHEET_NAME, HISTORIC_SHEET_NAME)
3. Check Apps Script execution logs for specific errors
4. Ensure all required columns exist in Finance sheet

### Problem: PDF doesn't show historic trend

**Solutions:**
1. Ensure historic data is loaded in dashboard first
2. Apply a store filter before generating PDF
3. Check if historic data exists for the selected store
4. Look for console errors during PDF generation

### Problem: New audits not automatically added

**Solutions:**
1. Check if trigger is set up (see Step 5)
2. Verify trigger function name is correct
3. Check execution logs for trigger failures
4. Ensure column names match in `onFinanceAuditSubmit` function

---

## API Endpoints

Your Apps Script provides these endpoints:

### Get All Historic Data
```
GET https://your-script-url/exec?action=getHistoricData
```

### Get Historic Data for Store
```
GET https://your-script-url/exec?action=getHistoricDataForStore&storeId=S049
```

### Append Historic Data
```
POST https://your-script-url/exec?action=appendHistoric
Content-Type: application/json

{
  "storeId": "S049",
  "auditDate": "1/15/2026",
  "region": "North",
  "percentage": 88.5
}
```

---

## Maintenance

### Cleaning Up Old Data

To remove old historic entries:

1. Open "Historic Data" sheet
2. Sort by "Audit date" column
3. Delete rows you want to remove
4. Keep headers in row 1

### Backing Up Data

Recommended:
1. Export "Historic Data" sheet as CSV monthly
2. Store backups in a separate location
3. Document any data corrections or adjustments

---

## Support

If you encounter issues:
1. Check the Execution log in Apps Script (View > Logs)
2. Check browser console for frontend errors (F12 > Console)
3. Verify all configuration steps were completed
4. Test the Apps Script functions directly using `testHistoricData`

---

## Summary Checklist

- [ ] Apps Script deployed and Web App URL copied
- [ ] FINANCE_HISTORIC_ENDPOINT configured in dataService.ts
- [ ] "Historic Data" sheet created with headers
- [ ] Existing data imported (if applicable)
- [ ] Frontend rebuilt (`npm run build`)
- [ ] Dashboard showing historic trends for stores with data
- [ ] PDF reports include historic trend charts
- [ ] Triggers configured for automatic updates (optional)

Once all steps are complete, your Finance Dashboard will display historic performance trends for each store!
