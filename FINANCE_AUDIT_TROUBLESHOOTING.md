# Finance Audit - Troubleshooting Data Not Logging

## Issue: Data not appearing in Google Sheet

### Quick Fixes to Try:

## 1️⃣ **FIRST: Deploy the DEBUG Script**

**Steps:**
1. Copy the contents of `finance-audit-google-apps-script-DEBUG.js`
2. Go to your Google Sheet → Extensions → Apps Script
3. **REPLACE** all existing code with the DEBUG version
4. Click "Save" (💾)
5. Click "Deploy" → "Manage deployments"
6. Click the "Edit" icon (pencil) on your existing deployment
7. Under "Version", select "New version"
8. Click "Deploy"
9. **Copy the NEW deployment URL** (it might be the same)

**Test it:**
- Open browser console (F12)
- Submit a Finance audit form
- Check the Console logs for the response
- Check Google Sheet for a new row

---

## 2️⃣ **Check Apps Script Execution Logs**

1. In Apps Script editor, click "Executions" (⏱️ icon on left sidebar)
2. Look for recent executions when you submitted the form
3. Click on any execution to see detailed logs
4. Look for:
   - ✅ "Successfully parsed JSON"
   - ✅ "Row written successfully"
   - ❌ Any error messages

**Common errors you might see:**
- "JSON parse failed" → Frontend sending wrong format
- "Permission denied" → Script needs authorization
- "Sheet not found" → Sheet name mismatch

---

## 3️⃣ **Authorize the Script**

The script needs permissions to:
- Access Google Sheets
- Access Google Drive (for images)

**Steps:**
1. In Apps Script editor, click "Run" at the top
2. Select the function `doPost` or `testScript`
3. Click "Run"
4. If prompted, click "Review Permissions"
5. Choose your Google account
6. Click "Advanced" → "Go to [Project Name] (unsafe)"
7. Click "Allow"

---

## 4️⃣ **Test with Manual Function**

In Apps Script editor:

1. Click on the function dropdown (top, near "Run")
2. Select `testScript`
3. Click "Run" (▶️)
4. Check "Execution log" at bottom
5. Check if a test row appeared in your sheet

If this works → Issue is with the deployment URL or CORS
If this fails → Issue is with the script itself (check logs)

---

## 5️⃣ **Verify Frontend is Sending Correct Data**

Open browser console (F12) when submitting:

**You should see:**
```
Finance Survey data being sent: {financeAuditorName: "...", ...}
Images to upload: 0
Response status: 200
Response text: {"status":"success",...}
```

**If you see:**
- Response status: 405 → Wrong HTTP method
- Response status: 403 → Permission/CORS issue
- Response status: 500 → Script error (check Apps Script logs)
- Network error → Wrong endpoint URL

---

## 6️⃣ **Check Endpoint URL**

In `components/checklists/FinanceChecklist.tsx`, line 11:

```typescript
const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx.../exec';
```

**Verify:**
- URL ends with `/exec` (not `/dev`)
- URL is your latest deployment
- No typos or missing characters

**Test the endpoint directly:**
Open this URL in browser:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

You should see:
```json
{"status":"success","message":"Finance Audit API is ACTIVE","timestamp":"..."}
```

---

## 7️⃣ **Check Sheet Name**

In Google Apps Script, line 14:
```javascript
const SHEET_NAME = 'Finance Audit';
```

**Make sure:**
- Your Google Sheet has a tab named exactly "Finance Audit"
- No extra spaces before/after
- Exact capitalization

---

## 8️⃣ **Update to Full Script After Testing**

Once the DEBUG version works:

1. Copy `finance-audit-google-apps-script.js` (the full version)
2. Replace DEBUG script with full script
3. Deploy as new version
4. Update endpoint URL in frontend if it changed

---

## Common Issues & Solutions:

### Issue: "Cannot read property 'contents' of undefined"
**Solution:** The script isn't receiving any POST data
- Check if frontend is actually sending the request
- Verify Content-Type header is set
- Check browser console for CORS errors

### Issue: "JSON.parse error"
**Solution:** Data format is wrong
- Use the DEBUG script to see raw contents
- Verify frontend is sending JSON.stringify(payload)
- Check for special characters breaking JSON

### Issue: "Permission denied"
**Solution:** Script not authorized
- Run authorization steps (#3 above)
- Make sure you're the owner of the spreadsheet
- Check sharing settings on the Sheet

### Issue: "Sheet not found"
**Solution:** Sheet name mismatch
- Check exact sheet tab name
- Update SHEET_NAME constant in script
- Create the sheet tab if missing

### Issue: Row appears but columns are wrong
**Solution:** Column mapping issue
- The DEBUG script uses simple columns
- The full script expects specific parameter names
- Check frontend parameter names match script expectations

---

## Testing Checklist:

✅ **Step 1:** Deploy DEBUG script and get URL
✅ **Step 2:** Update frontend with new URL (if different)
✅ **Step 3:** Open browser console (F12)
✅ **Step 4:** Fill Finance audit form (just a few fields for testing)
✅ **Step 5:** Click Submit
✅ **Step 6:** Check console logs for response
✅ **Step 7:** Check Google Sheet for new row
✅ **Step 8:** Check Apps Script Execution logs
✅ **Step 9:** If working, deploy full script
✅ **Step 10:** Test with images and full data

---

## What Each File Does:

### `finance-audit-google-apps-script.js`
- **Full production script**
- Handles all 30 questions with answers, remarks, images
- 98 columns in sheet
- Image upload to Drive
- Complex data mapping

### `finance-audit-google-apps-script-DEBUG.js`
- **Simplified testing script**
- Only 14 columns for basic data
- Extensive logging
- No image processing (just counts them)
- Easier to debug

### `FinanceChecklist.tsx`
- **Frontend React component**
- Sends JSON payload to Google Apps Script
- Handles image upload (base64)
- Manages form state

---

## Need More Help?

**Check these logs in order:**

1. **Browser Console** (F12 in browser)
   - Shows frontend errors
   - Shows fetch response
   - Shows payload being sent

2. **Apps Script Executions** (In Apps Script editor)
   - Shows if request was received
   - Shows parsing errors
   - Shows write errors

3. **Apps Script Logs** (Logger.log outputs)
   - Click on execution to see logs
   - Shows detailed processing steps

**Share these if asking for help:**
- Browser console screenshot
- Apps Script execution log
- Current endpoint URL
- Sheet tab name
