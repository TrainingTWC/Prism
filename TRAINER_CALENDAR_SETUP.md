# TRAINER CALENDAR - GOOGLE SHEETS INTEGRATION SETUP

## Overview
This guide explains how to set up the Trainer Calendar feature that syncs with Google Sheets.

---

## 📋 Features

### Trainer Calendar Component (Training Tab)
- Monthly calendar view for trainers
- Add/Edit/Delete events (Store Visits & Outdoor Activities)
- Task type dropdown with predefined options
- **Submit button** to push data to Google Sheets
- Trainer name auto-populated from EMPID in URL

### Dashboard Calendar Tab
- View all trainer calendars in one place
- Filter by trainer and month
- Statistics dashboard (Total trainers, events, store visits, outdoor activities)
- Real-time data from Google Sheets

---

## 🔧 Setup Instructions

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. **Rename it to: "Trainer Calendar"**
4. Leave it blank (the script will create headers automatically)

### Step 2: Deploy Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code
3. Copy the entire content from `google-apps-script-trainer-calendar.js`
4. Paste it into the Apps Script editor
5. **Save the project** (Ctrl+S or Cmd+S)
6. Name it: "Trainer Calendar API"

### Step 3: Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the **gear icon** next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: Trainer Calendar API
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Authorize** the script (you may see a warning - click "Advanced" then "Go to ... (unsafe)")
7. **Copy the Web App URL** (it will look like: `https://script.google.com/macros/s/...../exec`)

### Step 4: Configure Environment Variable

1. In your Prism project, open `.env` or `.env.local`
2. Add this line (replace with your actual URL):
   ```env
   VITE_TRAINER_CALENDAR_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. **Save the file**
4. **Restart your dev server** (`npm run dev`)

---

## 📊 Google Sheet Structure

The script automatically creates headers:

| Trainer ID | Trainer Name | Date | Event Type | Store ID | Store Name | Task Type | Additional Notes | Submitted At |
|------------|-------------|------|------------|----------|------------|-----------|------------------|--------------|
| h2595 | Kailash | 2025-12-04 | store | S153 | Lajpat Nagar | Store Visits | Monthly audit | 2025-12-03T10:30:00Z |

---

## 🧪 Testing

### Test the Apps Script

1. In Apps Script editor, select the function: `testSubmitCalendar`
2. Click **Run** (▶️ button)
3. Check **Execution log** (View > Logs)
4. Should see success message
5. Check your Google Sheet - should have 2 test rows

### Test from the App

1. Open Prism app: `http://localhost:3000/Prism/?EMPID=h2595`
2. Go to **Checklists & Surveys > Training**
3. Click **Training Calendar** tab
4. Add some events
5. Click **Submit Calendar** button
6. Should see "Calendar submitted successfully!" message
7. Check your Google Sheet - events should appear

### Test Dashboard View

1. Add the dashboard tab (see instructions below)
2. Click the new "Trainer Calendar" tab
3. Should see all submitted events
4. Test filters (trainer, month)

---

## 🎨 Add Dashboard Tab

### Option A: Add to Main Dashboard

Edit `components/Dashboard.tsx`:

1. Import the component:
```typescript
import TrainerCalendarDashboard from './dashboard/TrainerCalendarDashboard';
```

2. Add tab button (find the tabs section, around line 300-400):
```typescript
{hasDashboardAccess('training') && (
  <button
    onClick={() => handleDashboardChange('trainer-calendar')}
    className={`...existing classes... ${
      selectedDashboard === 'trainer-calendar' ? 'active classes' : 'inactive classes'
    }`}
  >
    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
    <span>Trainer Calendar</span>
  </button>
)}
```

3. Add to render section (find where other dashboards are rendered):
```typescript
{selectedDashboard === 'trainer-calendar' && (
  <TrainerCalendarDashboard />
)}
```

### Option B: Standalone Route (Simpler)

Add directly to App.tsx as a new main tab (next to Dashboard, Checklists, etc.)

---

## 🔍 Troubleshooting

### "Calendar configuration not found"
- Check `.env` file has `VITE_TRAINER_CALENDAR_SCRIPT_URL`
- Restart dev server after adding environment variable

### "Failed to submit calendar"
- Verify Apps Script is deployed as Web App
- Check "Who has access" is set to "Anyone"
- Verify the URL in `.env` is correct (must end with `/exec`)

### "Authorization required" when running script
- In Apps Script, go to Project Settings
- Check "Show 'appsscript.json' manifest file in editor"
- Click **Run** on any function to authorize

### Events not appearing in Google Sheet
- Open Apps Script > Executions
- Check for error messages
- Verify sheet name is exactly "Trainer Calendar"

### Dashboard shows "No data available"
- Ensure at least one calendar has been submitted
- Check Google Sheet has data
- Try clicking Refresh button

---

## 📱 Usage Guide

### For Trainers:

1. **Access Calendar**:
   - Open URL: `https://your-app.com/Prism/?EMPID=h2595`
   - Go to: Checklists & Surveys > Training
   - Click: Training Calendar tab

2. **Add Events**:
   - Click any date on calendar
   - Choose: Store Visit or Outdoor
   - Select: Store (if Store Visit)
   - Select: Task Type from dropdown
   - Add: Additional notes (optional)
   - Click: Save Event

3. **Edit/Delete**:
   - Hover over event
   - Click: Edit (pencil icon) or Delete (trash icon)

4. **Submit to System**:
   - Click: **Submit Calendar** button (top right)
   - Wait for success message
   - Data is now in Google Sheets and visible on dashboard

### For Managers/Admin:

1. **View All Calendars**:
   - Go to Dashboard
   - Click: Trainer Calendar tab
   - See: All trainer schedules

2. **Filter Data**:
   - Select specific trainer from dropdown
   - Select specific month
   - View filtered events

3. **Export Data**:
   - Open Google Sheet directly
   - Use Google Sheets export (File > Download)
   - All data is in spreadsheet format

---

## 🔐 Security Notes

- Apps Script runs as your account (the one who deployed it)
- "Anyone" access means anyone with the URL can submit data
- For production, consider adding authentication to Apps Script
- Data is stored in your Google Drive
- Only you can access the Google Sheet (unless you share it)

---

## 🚀 Next Steps / Enhancements

### Possible Future Features:
1. **Email Notifications**: Send reminder emails for upcoming events
2. **Recurring Events**: Support weekly/monthly recurring tasks
3. **Approval Workflow**: Manager approval before submission
4. **Calendar Sync**: Integrate with Google Calendar
5. **Mobile App**: React Native version
6. **Offline Mode**: Store events locally when offline
7. **Bulk Upload**: Upload entire month from Excel/CSV
8. **Analytics**: Generate reports on trainer coverage, workload, etc.

---

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review Apps Script execution logs
3. Check browser console for errors (F12)
4. Verify environment variables are set correctly
5. Ensure Google Sheet is accessible

---

## ✅ Checklist

- [ ] Google Sheet created and named "Trainer Calendar"
- [ ] Apps Script code copied and saved
- [ ] Web App deployed with "Anyone" access
- [ ] Deployment URL copied
- [ ] `.env` file updated with `VITE_TRAINER_CALENDAR_SCRIPT_URL`
- [ ] Dev server restarted
- [ ] Test script runs successfully
- [ ] Test event submission works
- [ ] Dashboard displays data correctly
- [ ] Filters work as expected

---

**Setup Complete! 🎉**

Your Trainer Calendar system is now fully integrated with Google Sheets!
