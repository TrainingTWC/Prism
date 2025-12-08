# Troubleshooting: Calendar Not Logging to Google Sheets

## Changes Made to Fix Logging Issues

### 1. **Removed `no-cors` Mode**
   - Previously used `mode: 'no-cors'` which prevented error visibility
   - Now using standard CORS-enabled requests
   - Can now see actual server responses and errors

### 2. **Added Comprehensive Logging**
   - Google Apps Script now logs every step
   - Frontend logs payload and response
   - Easy to debug in both places

### 3. **Improved Error Handling**
   - Script validates incoming data
   - Returns detailed error messages
   - Shows exactly what went wrong

## How to Debug

### Step 1: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Submit a calendar
4. Look for these logs:
   ```
   Submitting calendar payload: {trainerId: "...", events: [...]}
   Submission result: {status: "success", entriesAdded: 5}
   ```

### Step 2: Check Google Apps Script Execution Log
1. Go to https://script.google.com
2. Open your Trainer Calendar project
3. Click "Executions" on the left sidebar
4. Find the most recent execution
5. Click on it to see detailed logs
6. Look for:
   ```
   === NEW POST REQUEST ===
   Request received at: 2025-12-05...
   Parsed data - Trainer ID: h541
   Parsed data - Events count: 5
   Processing event 1: store at 12345
   SUCCESS: Processed 5 events
   ```

### Step 3: Verify Google Sheet
1. Open your Google Sheet
2. Check the "Trainer Calendar" tab
3. Headers should be:
   - Timestamp | Trainer ID | Trainer Name | Month | Date | Event Type | Location | Task | Details | Region | Store Name
4. Data should appear after submission

## Common Issues & Solutions

### Issue 1: "No data received in POST request"
**Cause**: Script not receiving data from frontend
**Solutions**:
- Verify the script URL in `.env` is correct
- Check that script is deployed as "Web app"
- Ensure "Who has access" is set to "Anyone"
- Redeploy the script (may need new version)

### Issue 2: CORS Error in Browser
**Cause**: Script not configured for cross-origin requests
**Solutions**:
- In Google Apps Script, go to Project Settings
- Ensure script is deployed as Web app
- Access must be "Anyone" not "Only myself"
- Create NEW deployment (don't update old one)

### Issue 3: "Authorization required"
**Cause**: Script needs permission to access Google Sheets
**Solutions**:
- When deploying, click "Authorize access"
- Login with your Google account
- Grant all permissions
- If it fails, try in incognito mode

### Issue 4: Data Shows in Console But Not in Sheet
**Cause**: Wrong sheet name or permissions
**Solutions**:
- Check sheet is named exactly "Trainer Calendar"
- Ensure you have edit access to the sheet
- Check execution log for "Sheet now has X rows"
- Verify script is connected to correct Google Sheet

### Issue 5: Store Region Not Showing
**Cause**: Store Mapping sheet doesn't exist
**Solutions**:
- This is OPTIONAL - calendar works without it
- Create sheet named "Store Mapping" with:
  - Column A: Store ID
  - Column B: Store Name
  - Column C: Region
- Script will auto-detect and use it

## Testing Checklist

### Before Submitting:
- [ ] EMPID in URL (e.g., `?EMPID=h541`)
- [ ] Events added to calendar
- [ ] Browser console open (F12)
- [ ] Google Apps Script executions tab open

### During Submission:
- [ ] Click "Submit Calendar" button
- [ ] Watch browser console for logs
- [ ] Note the submission message (success/error)
- [ ] Check if message shows event count

### After Submission:
- [ ] Refresh Google Sheet
- [ ] Verify new rows appeared
- [ ] Check Google Apps Script execution log
- [ ] Verify all event details are correct

## Quick Test Commands

### Test Script Directly (GET Request)
```bash
# Test if script is accessible
curl "YOUR_SCRIPT_URL?action=fetch"
```

Expected response:
```json
{"status":"success","data":[...],"count":0}
```

### Test POST Request (Advanced)
```bash
curl -X POST "YOUR_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"trainerId":"test","trainerName":"Test User","month":"December 2025","events":[{"date":"2025-12-05","type":"store","location":"12345","task":"Store Visit","details":"Test"}]}'
```

## Getting Help

If issues persist:
1. Copy the browser console errors
2. Copy the Google Apps Script execution log
3. Check the sheet exists and has correct permissions
4. Verify the deployment URL is correct in `.env`
5. Try creating a NEW deployment (not updating existing)

## Updated Files
- ✅ `google-apps-script-trainer-calendar-dashboard.js` - Added extensive logging
- ✅ `components/checklists/TrainingCalendar.tsx` - Removed no-cors, added response handling
