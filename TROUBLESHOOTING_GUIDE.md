# 🔧 AM Operations Dashboard Troubleshooting Guide

## ✅ What's Working

1. **Google Apps Script Updated** ✅
   - New URL: `AKfycbyoZ_SiTlifm6aTyf87i8e-dpjVpf5nLeyOOQa5GEbx7aWADJK0Oj7fMOoc1RvBQSIztQ`
   - Returns data with all individual question responses (CG_1, OTA_1, FAS_1, etc.)
   - Tested successfully with curl - 2 submissions returned

2. **Data Service Updated** ✅
   - `dataService.ts` using correct endpoint
   - Individual responses being captured correctly

3. **Dashboard Component Enhanced** ✅
   - Fixed AI regex pattern to include all sections: `CG|OTA|FAS|FWS|ENJ|EX`
   - Added comprehensive console logging
   - Added data status debugging

---

## ❌ Known Issues & Fixes

### Issue 1: Dashboard Shows No Data

**Symptoms:**
- Dashboard appears empty
- No submissions visible in table

**Root Causes:**
1. **Date Range Filter** - Default date range excludes submissions
2. **Store/AM/HR Filters** - Active filters hiding data
3. **Cached State** - Old state preventing refresh

**How to Fix:**
1. Open browser (F12) → Console tab
2. Look for:
   ```
   ✅ Loaded AM Operations data: X submissions
   🔍 AM Operations Data Status: { total: X, filtered: Y }
   ```
3. If `total > 0` but `filtered = 0`:
   - Click **Reset Filters** button
   - Adjust date range to include recent dates
   - Clear AM/Store/HR dropdown filters

4. If `total = 0`:
   - Check if data is in Google Sheet
   - Verify script deployment is correct
   - Try hard refresh (Ctrl+Shift+R)

---

### Issue 2: AI Analysis Not Working

**Symptoms:**
- Shows "Excellent Performance" even with NO responses
- No 5-Why analysis appearing

**Root Cause:**
```
http proxy error: /api/analyze
ECONNREFUSED
```
**The AI backend server is NOT running!**

**Solution:**
The AI analysis requires a backend server running on `localhost:3000` (or configured port).

**Workaround (if backend not available):**
AI analysis will gracefully degrade to showing "Excellent Performance" when it can't connect to the backend.

**To Enable AI:**
1. Start the AI backend server (separate Node.js service)
2. Configure API endpoint in `vite.config.ts`
3. Ensure `/api/analyze` proxy is working

---

### Issue 3: PDF Reports Not Generating

**Symptoms:**
- PDF button doesn't work
- PDF shows incomplete data

**Potential Causes:**
1. PDF template looking for old field names
2. Missing individual question responses

**How to Debug:**
1. Click on a submission row
2. Click "Generate PDF" button  
3. Open browser console (F12)
4. Look for errors related to PDF generation

**If PDF shows incomplete data:**
- Check if PDF template is using correct field names (`CG_1` not `CG1`)
- Verify all required fields are present in submission data

---

## 🎯 Quick Testing Steps

### 1. Verify Data is Loading

Open browser console and look for:
```javascript
✅ Loaded AM Operations data: 2 submissions
📊 First submission sample: { submissionTime: "12/12/2025...", CG_1: "no", ... }
🔑 First submission keys: ["submissionTime", "hrName", "CG_1", "OTA_1", ...]
```

### 2. Check Filtered Data

Look for:
```javascript
🔍 AM Operations Data Status: {
  total: 2,
  filtered: 2,  // ← Should match total if no filters active
  filters: { ... },
  sample: { ... }
}
```

### 3. Test AI Analysis

Look for:
```javascript
// If backend is running:
✅ AI Analysis generated

// If backend NOT running (expected):
http proxy error: /api/analyze
ECONNREFUSED
```

---

## 📝 What Changed

### Files Modified:

1. **services/dataService.ts**
   - Line 11: Updated AM_OPS_ENDPOINT to new Google Apps Script URL

2. **components/Dashboard.tsx**
   - Line ~1099: Fixed AI regex to include FWS, ENJ, EX sections
   - Line ~614: Enhanced console logging for data loading
   - Line ~1093: Added filtered data status debugging

3. **AM_Operations_google-apps-script-AI-READY.js** (Ready for deployment)
   - Uses correct field names: CG_1, OTA_1, FAS_1 (not CG_101, OTA_101)
   - Captures all 63 individual question responses
   - Saves section remarks and metadata

---

## 🚀 Next Steps

### Immediate:
1. ✅ **Test Dashboard** - Open browser, go to Operations dashboard
2. ✅ **Check Console** - Verify data is loading (look for green checkmarks)
3. ✅ **Try Filters** - Test reset filters if data not showing
4. ✅ **Test PDF** - Try generating a PDF report

### Optional (for AI Analysis):
- Set up AI backend server
- Configure API proxy
- Test 5-Why analysis feature

---

## 🆘 Still Not Working?

**Check these:**

1. **Browser Console Errors**
   ```
   F12 → Console tab → Look for red errors
   ```

2. **Network Tab**
   ```
   F12 → Network tab → Filter by "exec"
   Look for Google Apps Script requests
   Status should be 200 OK
   ```

3. **Google Sheet**
   ```
   Verify new submissions exist in "AM Ops Checklist" sheet
   Check if headers match expected format
   ```

4. **Script Deployment**
   ```
   Make sure you deployed the CORRECT Google Apps Script
   File: AM_Operations_google-apps-script-AI-READY.js
   ```

---

## 📞 Support Information

If issues persist, provide:
1. Browser console screenshot (with errors)
2. Network tab screenshot (Google Apps Script request)
3. Dashboard screenshot (showing empty state)
4. Google Sheet screenshot (showing data exists)
