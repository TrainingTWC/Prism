# Quick Start: Unified Google Apps Script

## ✅ ONE SCRIPT FOR EVERYTHING

The file `google-apps-script-trainer-calendar-dashboard.js` is your **SINGLE SOURCE** for:

1. ✅ Receiving calendar submissions from Training Calendar form
2. ✅ Storing data in Google Sheets
3. ✅ Sending data to Trainer Calendar Dashboard

## 🚀 Setup (5 Minutes)

### Step 1: Open Google Apps Script
1. Go to https://script.google.com
2. Click "New Project"

### Step 2: Paste The Code
1. Copy ALL code from `google-apps-script-trainer-calendar-dashboard.js`
2. Paste into the script editor
3. Save (Ctrl+S)

### Step 3: Deploy
1. Click "Deploy" → "New deployment"
2. Click gear icon ⚙️ → Select "Web app"
3. Settings:
   - **Description**: Trainer Calendar API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click "Deploy"
5. Click "Authorize access" (login with your Google account)
6. Copy the Web app URL

### Step 4: Configure Prism
1. Open `.env` file in Prism project
2. Set: `VITE_TRAINER_CALENDAR_SCRIPT_URL=your_web_app_url`
3. Save file
4. Restart dev server if running

## ✅ Done!

Both features now work:
- **Training Calendar** → Submit events → Stored in Google Sheets
- **Trainer Calendar Dashboard** → View/filter all events

## 📊 Google Sheet Structure

The script auto-creates a sheet named **"Trainer Calendar"** with these columns:
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

## 🎯 Optional: Add Store Mapping

To enable automatic region filtering, create a sheet named **"Store Mapping"** with:
- Column A: Store ID
- Column B: Store Name
- Column C: Region

The script will automatically use this to populate region data.

## 🧪 Testing

### Test Submission
1. Go to Checklists & Surveys → Training Calendar
2. Add events for a month
3. Click "Submit Calendar"
4. Check your Google Sheet - data should appear

### Test Dashboard
1. Go to Trainer Calendar tab
2. Click "Refresh" button
3. Your submitted events should appear
4. Try the filters

## 🔧 Troubleshooting

**No data showing in dashboard?**
- Check the Web app URL is correct in `.env`
- Verify deployment is set to "Anyone" can access
- Check browser console for errors

**Submission failing?**
- Same URL should work for both submission and dashboard
- Check Google Apps Script execution log for errors
- Verify you authorized the script

**Region data missing?**
- Create the "Store Mapping" sheet (optional)
- Events will still work without it

## 📝 Technical Details

**How it works:**
- **POST request** (no query params) → Stores calendar data
- **GET request** with `?action=fetch` → Returns all calendar data

**Example URLs:**
```
Submit: POST https://script.google.com/macros/s/YOUR_ID/exec
Fetch:  GET  https://script.google.com/macros/s/YOUR_ID/exec?action=fetch
```

Both use the SAME URL!
