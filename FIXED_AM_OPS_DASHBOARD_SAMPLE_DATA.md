# FIXED: AM Operations Dashboard Showing Sample Data

## 🔍 Problem Identified

The Google Apps Script is throwing a **syntax error**:
```
SyntaxError: Identifier 'CACHE_DURATION' has already been declared (line 1, file "Untitled")
```

This causes the script to fail, so the frontend falls back to static/sample data (9 submissions, 86% average, Michael Chen, Emily, etc.).

---

## ✅ Solution: Fix Google Apps Script

### Step 1: Open Google Apps Script Editor

1. Open your Google Sheet for AM Operations
2. Click **Extensions** → **Apps Script**
3. You should see the script editor

### Step 2: Check for Multiple Files

**Look at the left sidebar** - you might have multiple `.gs` files (e.g., "Code.gs", "Untitled.gs", etc.)

#### If you have multiple files:
- **Option A**: Delete extra files and keep only one
- **Option B**: Search for `var CACHE_DURATION` in all files and remove duplicates

#### If you have only one file:
- There might be duplicate code pasted multiple times in the same file
- Scroll through and look for duplicate variable declarations

### Step 3: Replace with Clean Script

**The easiest solution is to replace everything with the clean version:**

1. **Delete ALL existing code** in your Google Apps Script editor
2. **Copy the entire content** from the new file: `AM_Operations_google-apps-script-CLEAN.js`
3. **Paste it** into your Google Apps Script editor
4. **Save** the project (💾 icon or Ctrl+S)

### Step 4: Deploy the Script

1. Click **Deploy** → **New deployment**
2. Select **Web app** as the deployment type
3. Configure:
   - **Description**: "AM Operations API - Fixed"
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the Web App URL** (it should be the same as before: `https://script.google.com/macros/s/AKfycbxM2vdeIN26pcOl09xf-0CtKVHA5H2uqBgYEiJsFY0SDnYsPJDoqTHMw1XXx8pbKK4iEw/exec`)

### Step 5: Test the Script

Open this URL in your browser:
```
https://script.google.com/macros/s/AKfycbxM2vdeIN26pcOl09xf-0CtKVHA5H2uqBgYEiJsFY0SDnYsPJDoqTHMw1XXx8pbKK4iEw/exec?action=getData
```

**Expected Result**: You should see JSON data with your AM Operations submissions (or an empty array `[]` if you haven't submitted any data yet)

**Bad Result**: If you still see an error message, there's still a problem with the script

---

## 🧪 Verify the Fix

### Method 1: Browser Console

1. Open your Prism application
2. Go to the **Operations Dashboard**
3. Open browser console (F12)
4. Look for these logs:
   - `✅ Loaded AM Operations data: X submissions` ← This means it's working!
   - `🔄 Falling back to static AM Operations test data...` ← Still broken

### Method 2: Check Dashboard Data

- **Before fix**: Dashboard shows 9 submissions, 86% average, Michael Chen (88%), Emily (83%)
- **After fix**: Dashboard shows real data from your Google Sheet, OR shows 0 submissions if you haven't submitted any yet

---

## 📝 What Changed?

### Key Changes in the Clean Script:

1. **Moved global variable declarations to the top** (line 8-10):
   ```javascript
   var storeMappingCache = null;
   var cacheExpiry = null;
   var CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
   ```

2. **Removed duplicate declarations** that were causing the syntax error

3. **Everything else is identical** to the previous version - all functionality is preserved

---

## 🆘 Troubleshooting

### Issue 1: Still seeing syntax error after replacing code
**Solution**: Make sure you deleted ALL old code before pasting the new code. Check for hidden files in the left sidebar.

### Issue 2: Getting "No AM Operations sheet found"
**Solution**: 
- Create a sheet named exactly **"AM Ops Checklist"** in your Google Spreadsheet
- OR rename your existing sheet to match one of these: "AM Ops Checklist", "AM Operations", "AMOpsChecklist", "AM_Operations"

### Issue 3: Dashboard shows 0 submissions but I have data
**Solution**: 
- Check the sheet name matches one of the supported names
- Verify the sheet has data rows (not just header)
- Check the console logs for more details

### Issue 4: Still showing sample data after fix
**Solution**:
1. **Hard refresh** your Prism app (Ctrl+Shift+R)
2. **Clear browser cache** and reload
3. Check browser console for `✅ Loaded AM Operations data:` message

---

## 📊 Expected Behavior After Fix

### Dashboard Stats:
- **TOTAL SUBMISSIONS**: Real count from Google Sheets
- **AVERAGE SCORE**: Real average from Google Sheets
- **TRAINERS INVOLVED**: Real count of unique trainers
- **STORES COVERED**: Real count of unique stores

### Regional Performance:
- Shows actual data grouped by North/South/West regions

### AM Performance:
- Shows actual AMs from your submissions

### HR Performance:
- Shows actual HR personnel from your submissions

---

## 🎯 Next Steps After Fixing

1. **Test submission**: Fill out an AM Operations checklist to verify data is being saved
2. **Refresh dashboard**: Check if the new submission appears in the dashboard
3. **Verify region mapping**: Make sure regions are correctly detected from comprehensive_store_mapping.json

---

## 📞 Need Help?

If you're still seeing issues after following these steps, please provide:
1. Screenshot of the Google Apps Script editor (showing file names in left sidebar)
2. The exact error message you're seeing
3. Screenshot of your browser console when viewing the Operations Dashboard
