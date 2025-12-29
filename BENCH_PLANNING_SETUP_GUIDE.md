# Bench Planning Module - Setup & Deployment Guide

## 🎯 Overview

The Bench Planning module manages a 3-stage candidate assessment process:
1. **Readiness Checklist** - Filled by Reporting Manager (11 items, scored 1-5)
2. **Self Assessment** - Filled by Candidate (ONE attempt only, unlocked after passing readiness)
3. **Interview** - Filled by Panel (8 sections, scored 1-5, unlocked after passing assessment)

## 📊 Google Sheets Setup

### Step 1: Create or Open Your Google Sheet

1. Open the Google Sheet where you want to store Bench Planning data
2. The script will automatically create these sheets:
   - `Bench_Candidates` - Master list of candidates
   - `Readiness_Checklists` - Manager assessments
   - `Self_Assessments` - Candidate self-assessments
   - `Interviews` - Panel evaluations

### Step 2: Add the Google Apps Script

1. In your Google Sheet, go to **Extensions** > **Apps Script**
2. Delete any existing code in `Code.gs`
3. Copy the entire contents of `bench-planning-google-apps-script.js`
4. Paste it into `Code.gs`
5. Click **Save** (💾 icon)

### Step 3: Initialize the Sheets

1. In the Apps Script editor, select `initializeSheets` from the function dropdown
2. Click **Run** (▶️ icon)
3. When prompted, click **Review Permissions**
4. Select your Google account
5. Click **Advanced** > **Go to [Your Project Name] (unsafe)**
6. Click **Allow**
7. Check your Google Sheet - it should now have a `Bench_Candidates` sheet with sample data

### Step 4: Update Candidate Data

1. Go to the `Bench_Candidates` sheet
2. Replace the sample data with your actual candidates:
   - Column A: Employee ID
   - Column B: Employee Name
   - Column C: Manager ID
   - Column D: Manager Name
   - Column E: Panelist ID
   - Column F: Panelist Name

### Step 5: Deploy as Web App

1. In the Apps Script editor, click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Configure:
   - **Description**: "Bench Planning API"
   - **Execute as**: Me
   - **Who has access**: Anyone (or "Anyone with Google account" for more security)
5. Click **Deploy**
6. Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/...`)
7. Click **Done**

### Step 6: Update the Frontend

1. Open `components/checklists/BenchPlanningChecklist.tsx`
2. Find this line (around line 18):
   ```typescript
   const BENCH_PLANNING_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` with your Web app URL from Step 5

## 🔐 Access Control & Workflow

### User Types Automatically Detected:

1. **Manager**: Can fill Readiness Checklist
   - Identified when logged-in user's ID matches Manager ID in candidate data
   - Can score all 11 readiness items (1-5)
   - Must achieve 60% for candidate to pass

2. **Candidate**: Can fill Self Assessment
   - Identified when logged-in user's ID matches Employee ID
   - Can only access after passing Readiness Checklist
   - Has **ONE attempt only**
   - Must pass to unlock Interview stage

3. **Panelist**: Can fill Interview
   - Identified when logged-in user's ID matches Panelist ID
   - Can only access after candidate passes Self Assessment
   - Scores 8 sections (1-5 each)

4. **Admin**: Has access to all stages

### Workflow Sequence:

```
Manager fills Readiness Checklist
        ↓
   Scored 1-5 per item
        ↓
   Score ≥ 60%? 
        ↓ YES
Self Assessment UNLOCKED for Candidate
        ↓
Candidate completes Assessment (1 attempt)
        ↓
   Passed?
        ↓ YES
Interview UNLOCKED for Panelist
        ↓
Panelist completes Interview Evaluation
```

## 📝 Readiness Checklist Items (11 items)

1. Has completed all product and process knowledge modules on LMS
2. Demonstrates strong understanding of SOPs and stays updated with any changes
3. Has completed Food Safety module and consistently applies standards
4. Maintains punctuality and regular attendance
5. Consistently maintains high personal grooming and hygiene standards
6. Proactively leads pre-shift huddles and supports in store training
7. Takes initiative to support store operations beyond assigned tasks
8. Shows positive influence and motivates team members during service
9. Has experience in coaching or mentoring new team members
10. Can independently manage short shifts with minimal supervision
11. Handles guest concerns or complaints calmly and confidently

**Scoring**: Each item scored 1-5
**Passing**: 60% or higher (33/55 points)

## 🎤 Interview Sections (8 sections)

1. Product & Process Knowledge
2. Food Safety Understanding
3. Leadership & Initiative
4. Guest Service Excellence
5. Communication Skills
6. Problem Solving
7. Team Management
8. Adaptability

**Scoring**: Each section scored 1-5
**Total**: 40 points possible

## 🔄 URL Parameters for Direct Access

### For Candidates:
```
https://your-app-url.com?id=H3282&name=Madan%20V
```

### For Managers/Panelists:
They can search for candidates by Employee ID within the interface.

## 📊 Data Storage Structure

### Readiness_Checklists Sheet:
| Timestamp | Employee ID | Employee Name | Manager ID | Manager Name | Scores (JSON) | Total Score | Max Score | Passed | Percentage | Remarks | Item 1 Score | Item 2 Score | ... |
|-----------|-------------|---------------|------------|--------------|---------------|-------------|-----------|--------|------------|---------|--------------|--------------|-----|

### Self_Assessments Sheet:
| Timestamp | Employee ID | Employee Name | Answers (JSON) | Total Score | Passed | Attempt Number |
|-----------|-------------|---------------|----------------|-------------|--------|----------------|

### Interviews Sheet:
| Timestamp | Employee ID | Employee Name | Panelist ID | Panelist Name | Scores (JSON) | Total Score | Max Score | Percentage | Remarks | Section 1 Score | ... |
|-----------|-------------|---------------|-------------|---------------|---------------|-------------|-----------|------------|---------|-----------------|-----|

## ✅ Testing the Module

### 1. Test as Manager:
- Use URL with manager's ID: `?id=H546&name=Ajay%20Hathmuria`
- Should be able to:
  - Load candidate data (e.g., H3282 - Madan V)
  - Fill Readiness Checklist
  - Submit scores
  - See status update

### 2. Test as Candidate:
- Use URL with employee ID: `?id=H3282&name=Madan%20V`
- Should see:
  - Readiness Checklist status (locked until manager completes)
  - Self Assessment tab (locked until passed readiness)
  - Interview tab (locked until passed assessment)

### 3. Test as Panelist:
- Use URL with panelist ID: `?id=H2155&name=Jagruti`
- Should be able to:
  - Search for candidates
  - Access Interview tab (only if assessment passed)
  - Submit evaluation

## 🎨 Visual Indicators

- 🔒 **Lock Icon**: Stage is locked (requirements not met)
- 🔓 **Unlock Icon**: Stage is unlocked and accessible
- ✅ **Check Icon**: Stage is completed and passed
- ⚠️ **Alert Icon**: Stage attempted but not passed

## 🔧 Troubleshooting

### Issue: "Candidate not found"
- Ensure the employee ID exists in `Bench_Candidates` sheet
- Check for exact match (case-sensitive)

### Issue: Assessment not unlocking
- Verify Readiness Checklist has been submitted
- Check that total score ≥ 60% (33/55 points)
- Refresh the page

### Issue: Script authorization errors
- Re-run the authorization flow (Step 3 above)
- Ensure script is deployed as "Execute as: Me"

### Issue: CORS errors
- Verify the Web app URL is correct
- Check "Who has access" is set to "Anyone"
- May need to redeploy the script

## 📱 Mobile Responsive

The module is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones

## 🚀 Next Steps

1. **Add Self Assessment Questions**: When you provide the questions, I'll integrate them into the Assessment tab
2. **Configure Permissions**: Set up role-based access in your admin config
3. **Test Workflow**: Run through complete workflow with test data
4. **Train Users**: Share this guide with managers, candidates, and panelists

## 📞 Need Help?

If you encounter any issues or need modifications, feel free to ask!
