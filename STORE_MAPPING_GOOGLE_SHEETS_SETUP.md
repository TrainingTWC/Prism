# Store Mapping Google Sheets Setup Guide

This guide explains how to set up the store mapping to use Google Sheets as the data source, similar to the bench planning dashboard.

## Overview

The store mapping system now supports loading data from Google Sheets in real-time, allowing you to manage store-AM-HR-Region assignments directly in a Google Sheet without code changes.

## Sheet Structure

Create a Google Sheet with a tab named **"Store_Mapping"** with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| Store ID | Unique store identifier | S027 |
| Store Name | Full store name | Defence Colony |
| AM ID | Area Manager employee ID | H1766 |
| AM Name | Area Manager full name | Vishu |
| Region | North/South/West | North |
| HRBP ID | HR Business Partner ID | H3728 |
| HRBP Name | HRBP full name | Siddhant |
| Regional HR ID | Regional HR ID | H3603 |
| Regional HR Name | Regional HR name | Manasi |
| HR Head ID | HR Head ID | HC002 |
| HR Head Name | HR Head name | Pooja |

## Setup Instructions

### 1. Create the Google Sheet

1. Create a new Google Sheet or use an existing one
2. Create a tab named exactly **"Store_Mapping"**
3. Add the column headers in row 1 (see table above)
4. Fill in your store data starting from row 2

**Example Data:**
```
Store ID | Store Name      | AM ID | AM Name | Region | HRBP ID | HRBP Name | Regional HR ID | Regional HR Name | HR Head ID | HR Head Name
S027     | Defence Colony  | H1766 | Vishu   | North  | H3728   | Siddhant  | H3603          | Manasi           | HC002      | Pooja
S096     | Mahavir Nagar   | H1575 | Vruchika| West   | H3603   | Manasi    | HC002          | Pooja            | H3730      | Sumanjali
```

### 2. Deploy the Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code
4. Copy ALL the code from `store-mapping-google-apps-script.js`
5. Paste it into the script editor
6. Click **Save** (💾 icon)
7. Name your project (e.g., "Store Mapping API")

### 3. Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "Store Mapping API v1"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone (or "Anyone with the link")
5. Click **Deploy**
6. **Authorize** the script (click "Authorize access")
7. Review permissions and click **Allow**
8. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### 4. Configure Environment Variable

1. Open your `.env` file (or create from `.env.example`)
2. Add/update this line:
   ```env
   VITE_STORE_MAPPING_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. Replace `YOUR_SCRIPT_ID` with your actual script URL
4. Save the file
5. Restart your dev server: `npm run dev`

### 5. Verify Setup

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Reload your Prism Dashboard
4. Look for these log messages:
   ```
   🔍 Loading store mapping from Google Sheets...
   ✅ Loaded store mapping from Google Sheets: 150 stores
   ```

## API Endpoints

The Google Apps Script provides these endpoints:

### Get All Stores
```
GET ?action=getStoreMapping
```
Returns all store mapping data

### Get Store by ID
```
GET ?action=getStoreById&storeId=S027
```
Returns a specific store's data

### Get Stores by Area Manager
```
GET ?action=getStoresByAM&amId=H1766
```
Returns all stores for a specific AM

### Get Stores by Region
```
GET ?action=getStoresByRegion&region=North
```
Returns all stores in a region

## Fallback Strategy

The system uses a smart fallback strategy:

1. **Primary**: Google Sheets (if VITE_STORE_MAPPING_SCRIPT_URL is configured)
2. **Secondary**: Static `comprehensive_store_mapping.json`
3. **Tertiary**: Fallback `twc_store_mapping.json`
4. **Last Resort**: Hardcoded fallback stores

This ensures the app works even if Google Sheets is unavailable.

## Benefits of Using Google Sheets

✅ **Real-time Updates**: Changes in the sheet reflect immediately (no code deployment)
✅ **Easy Management**: Non-technical staff can update store assignments
✅ **Centralized**: One source of truth for all store mappings
✅ **Audit Trail**: Google Sheets tracks all changes
✅ **Collaboration**: Multiple people can manage the data
✅ **Backup**: Google Sheets auto-saves and has version history

## Updating Data

To update store mappings:

1. Open your Google Sheet
2. Edit the Store_Mapping tab
3. Save (auto-saves)
4. Reload the Prism Dashboard
5. Changes appear immediately!

No code changes or deployments needed.

## Troubleshooting

### "Google Sheets not available" in console

**Solution**: Check that:
- VITE_STORE_MAPPING_SCRIPT_URL is set in `.env`
- The script is deployed as a Web App
- "Who has access" is set to "Anyone" or "Anyone with the link"
- You've restarted the dev server after changing `.env`

### "Store_Mapping sheet not found"

**Solution**: 
- Verify the tab name is exactly "Store_Mapping" (case-sensitive)
- The sheet is in the same Google Sheet as the script

### Changes not appearing

**Solution**:
- Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check the Console for loading messages
- Verify the data is correct in Google Sheets

### CORS errors

**Solution**:
- Redeploy the script with "Who has access" set to "Anyone"
- Make sure you copied the Web App URL, not the script editor URL

## Security Notes

- The script runs with your Google account permissions
- "Anyone with the link" means the URL must be known to access data
- For production, consider using authentication or a private Google Workspace
- Never commit your `.env` file with real URLs to public repositories

## Maintenance

### To Update the Script

1. Open Apps Script editor
2. Make changes to the code
3. Click **Deploy** → **Manage deployments**
4. Click ✏️ Edit icon next to your deployment
5. Change "Version" to "New version"
6. Add description of changes
7. Click **Deploy**

The URL stays the same, so no `.env` changes needed!

### To Add More Columns

1. Add column to Google Sheet
2. Update the script to read the new column
3. Update the store object in the `getStoreMapping()` function
4. Redeploy the script (new version)

## Example Use Cases

### Reassign Store to New AM
1. Open Google Sheet
2. Find the store row
3. Update AM ID and AM Name columns
4. Save
5. Dashboard updates instantly!

### Add New Store
1. Add new row with all store details
2. Save
3. New store appears in all dropdowns!

### Change Region
1. Update Region column for store(s)
2. Save
3. Regional filtering updates immediately!

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify the Google Sheet structure matches exactly
3. Test the script URL directly in browser
4. Check Apps Script execution logs (View → Executions)
