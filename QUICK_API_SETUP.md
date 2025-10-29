# QUICK SETUP GUIDE - Training Audit Direct API

## What Changed?

✅ **Before:** Dashboard read from Monthly_Trends sheet (needed sync)  
✅ **After:** Dashboard reads **directly from Training Audit sheet** (no sync needed)

## What You Need To Do

### 1. Deploy New Google Apps Script

1. Open your Google Sheets file
2. Go to **Extensions** > **Apps Script**
3. Create a **new file** called "Training Audit API"
4. Copy/paste the contents of: `google-apps-script-training-audit-api.js`
5. Click **Deploy** > **New deployment**
6. Settings:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** and copy the URL

### 2. Update the URL (Already Done!)

The frontend code has been updated with your URL:
```
https://script.google.com/macros/s/AKfycbwkHZB4r33bGfECY9YQQiCgTZE2qCHDgS62rzm2zF7nTiVuZ-OAVUp-yBus7k0aOA2SZA/exec
```

### 3. Test the API

Open this URL in your browser (replace with your actual deployment URL):
```
https://script.google.com/macros/s/AKfycbwkHZB4r33bGfECY9YQQiCgTZE2qCHDgS62rzm2zF7nTiVuZ-OAVUp-yBus7k0aOA2SZA/exec
```

You should see JSON with:
- `summary`: Total submissions, stores covered, average score, store health
- `records`: All audit records with full details

### 4. Deploy Frontend

```powershell
npm run build
git add .
git commit -m "Switch to direct Training Audit API"
git push origin main
```

## What You Get

✅ **Total Submissions** - From Training Audit sheet directly  
✅ **Stores Covered** - Unique stores in Training Audit  
✅ **Store Health** - Calculated from Training Audit percentages  
✅ **Average Score** - Average of all Training Audit percentages  
✅ **All Records** - Every audit with full details for charts/filters

## No More Monthly_Trends Issues!

- ❌ No more "Cannot read properties of null" errors
- ❌ No need to run syncMonthlyTrends()
- ❌ No dual-row format complexity
- ✅ Direct access to Training Audit data
- ✅ Real-time updates
- ✅ Single source of truth

## Verify It's Working

1. Open dashboard
2. Check browser console (F12)
3. Look for: "Training Audit API Response: { recordsCount: X, summary: {...} }"
4. Summary should show your metrics with actual numbers (not 0)

## Files Changed

- ✅ `src/components/dashboard/useTrendsData.ts` - New API fetch function
- ✅ `src/components/dashboard/HeaderSummary.tsx` - Use API summary
- ✅ `google-apps-script-training-audit-api.js` - NEW API script (deploy this!)
- 📄 `TRAINING_AUDIT_API_SETUP.md` - Detailed documentation
