# Google Apps Script Deployment Steps

## Current Issue
Your Google Apps Script is still returning `percentageScore: 113` instead of `71`. This is because the old calculation logic is still deployed.

## What Needs to Be Done

1. **Open Google Apps Script Editor**
   - Go to your Google Sheets with "AM Ops Checklist"
   - Click Extensions > Apps Script

2. **Replace ALL existing code** with the updated code from:
   `AM_Operations_google-apps-script-FIXED-LOGGING.js`

3. **Save the project** (Ctrl+S)

4. **Deploy NEW version**:
   - Click "Deploy" button (top right)
   - Click "New deployment"
   - Choose "Web app" as type
   - Set "Execute as": Me
   - Set "Who has access": Anyone
   - Click "Deploy"
   - **IMPORTANT**: You'll get a new URL - update the frontend with this new URL

## Current Problem
The calculation in your deployed script is:
```javascript
// OLD (WRONG) - This gives 113%
var overallScore = parseFloat(obj['Overall Score'] || '0'); // = 71.4285714285714
var maxPossibleScore = 63;
obj.percentageScore = Math.round((overallScore / maxPossibleScore) * 100); // = 113
```

## Fixed Calculation
The updated script has:
```javascript
// NEW (CORRECT) - This gives 71%
var overallScore = parseFloat(obj['Overall Score'] || '0'); // = 71.4285714285714
obj.percentageScore = Math.round(overallScore); // = 71
```

## Test After Deployment
After deployment, test this URL (replace with your new URL):
```
https://script.google.com/macros/s/YOUR_NEW_URL/exec?action=getData
```

You should see `"percentageScore": 71` instead of `113`.

## If You Get a New URL
Update the frontend file: `services/dataService.ts`
Change the `AM_OPS_ENDPOINT` to your new URL.