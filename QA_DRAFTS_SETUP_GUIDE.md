# QA Checklist Drafts - Google Apps Script Setup Guide

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: **"QA Checklist Drafts"**
4. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
   ```

## Step 2: Open Apps Script Editor

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code in the editor
3. Copy all code from `qa-drafts-google-apps-script.js`
4. Paste it into the Apps Script editor

## Step 3: Configure the Script

1. Find this line at the top:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```
2. Replace `YOUR_SPREADSHEET_ID_HERE` with your actual Spreadsheet ID
3. Save the project (Ctrl+S or File → Save)
4. Name the project: **"QA Drafts API"**

## Step 4: Test the Setup

1. In Apps Script, select the function **`testSetup`** from the dropdown
2. Click **Run** (▶️)
3. **First time only:** Authorize the script when prompted
4. Check the **Execution log** - should see: "Sheet created/verified: QA_Drafts"
5. Go back to your spreadsheet - you should see a new sheet called **"QA_Drafts"** with headers

## Step 5: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description:** QA Drafts API
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
5. Click **Deploy**
6. **Important:** Copy the **Web app URL** (looks like: `https://script.google.com/macros/s/ABCD.../exec`)
7. Click **Done**

## Step 6: Update Frontend Code

The Web app URL from Step 5 needs to be added to your React code. I'll update the QAChecklist component now.

## Sheet Structure (Auto-created)

| Column | Field | Description |
|--------|-------|-------------|
| A | Draft ID | Unique identifier |
| B | QA Auditor ID | Employee ID of auditor |
| C | QA Auditor Name | Name of auditor |
| D | Store ID | Store being audited |
| E | Store Name | Store name |
| F | Area Manager ID | AM responsible |
| G | Area Manager Name | AM name |
| H | Timestamp | Last saved time |
| I | Completion % | Progress percentage |
| J | Responses | JSON of answers |
| K | Question Images | JSON of images |
| L | Question Remarks | JSON of comments |
| M | Signatures | JSON of signatures |
| N | Meta Data | JSON of metadata |

## API Endpoints

### GET Requests:
- `?action=getDrafts&qaId=H3301` - Get all drafts for QA auditor
- `?action=loadDraft&draftId=draft_123` - Load specific draft

### POST Requests:
- `action=saveDraft` - Save/update draft (with all parameters)
- `action=deleteDraft&draftId=draft_123` - Delete draft

## Optional: Cleanup Old Drafts

Run the `cleanupOldDrafts()` function manually or set up a trigger:
1. Click **Triggers** (clock icon) in left sidebar
2. Click **Add Trigger**
3. Choose function: `cleanupOldDrafts`
4. Event source: Time-driven
5. Type: Week timer
6. Day: Sunday
7. Time: 12am to 1am
8. Save

This will automatically delete drafts older than 30 days.

## Troubleshooting

**"Exception: You do not have permission to call SpreadsheetApp.openById"**
- Make sure you authorized the script (run testSetup first)

**"Sheet not found"**
- Check the SPREADSHEET_ID is correct
- Run testSetup function

**"Draft not saving"**
- Check execution logs in Apps Script
- Verify all required parameters are being sent

**"Cannot access deployment"**
- Make sure "Who has access" is set to "Anyone"
- Re-deploy if you changed settings

## Security Notes

- Drafts are tied to QA Auditor ID (only they can see their drafts)
- No authentication on the endpoint (public access)
- For production, consider adding authentication/verification
- Data is stored in your Google account (you own it)

## Next Step

After deployment, provide me with the Web App URL so I can update the React component to use it instead of localStorage.
