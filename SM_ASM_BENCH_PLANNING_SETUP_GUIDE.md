# Shift Manager to Assistant Store Manager Bench Planning - Setup Guide

## 🎯 Overview

This module manages a 3-stage candidate assessment process for Shift Managers being promoted to Assistant Store Managers:

1. **Readiness Checklist** - Filled by Regional Manager (11 items, scored 1-5)
2. **Self Assessment** - Filled by Candidate (ONE attempt only, 15 MCQ questions, 80% to pass)
3. **Interview** - Filled by Panel (8 sections, scored 1-5)

---

## 📊 Google Sheets Setup

### Step 1: Create a New Google Sheet

1. Create a new Google Sheet named `SM_ASM_Bench_Planning` (or any name you prefer)
2. The script will automatically create these sheets:
   - `SM_ASM_Candidates` - Master list of candidates
   - `SM_ASM_Readiness` - Manager assessments
   - `SM_ASM_Assessments` - Candidate self-assessments  
   - `SM_ASM_Interviews` - Panel evaluations
3. You can use the same `Store_Mapping` sheet from the Barista-to-SM module

### Step 2: Add the Google Apps Script

1. In your Google Sheet, go to **Extensions** > **Apps Script**
2. Delete any existing code in `Code.gs`
3. Copy the entire contents of `sm-asm-bench-planning-google-apps-script.js`
4. Paste it into `Code.gs`
5. Click **Save** (💾 icon)

### Step 3: Initialize the Sheets

1. In the Apps Script editor, select `initializeSheets` from the function dropdown
2. Click **Run** (▶️ icon)
3. When prompted, click **Review Permissions**
4. Select your Google account
5. Click **Advanced** > **Go to [Your Project Name] (unsafe)**
6. Click **Allow**
7. Check your Google Sheet - it should now have a `SM_ASM_Candidates` sheet with sample data

### Step 4: Update Candidate Data

1. Go to the `SM_ASM_Candidates` sheet
2. Replace the sample data with your actual SM candidates:
   - Column A: Employee ID
   - Column B: Employee Name
   - Column C: Manager ID (Regional Manager)
   - Column D: Manager Name
   - Column E: Panelist ID
   - Column F: Panelist Name
   - Column G: Store ID (optional)
   - Column H: Region (optional)
   - Column I: Assessment Unlock Date/Time (optional - format: YYYY-MM-DD HH:MM:SS)

### Step 5: Deploy as Web App

1. In the Apps Script editor, click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Configure:
   - **Description**: "SM-ASM Bench Planning API"
   - **Execute as**: Me
   - **Who has access**: Anyone (or "Anyone with Google account" for more security)
5. Click **Deploy**
6. Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/...`)
7. Click **Done**

### Step 6: Update the Frontend

1. Open `components/checklists/BenchPlanningSMASMChecklist.tsx`
2. Find this line (around line 18):
   ```typescript
   const BENCH_PLANNING_SM_ASM_ENDPOINT = 'YOUR_SM_ASM_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `'YOUR_SM_ASM_GOOGLE_APPS_SCRIPT_URL_HERE'` with your Web app URL from Step 5

4. Open `components/BenchPlanningSMASMDashboard.tsx`
5. Find this line (around line 92):
   ```typescript
   const BENCH_PLANNING_SM_ASM_ENDPOINT = 'YOUR_SM_ASM_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
6. Replace with the same URL

---

## 🔐 Access Control & Workflow

### User Types Automatically Detected:

1. **Regional Manager**: Can fill Readiness Checklist
   - Identified when logged-in user's ID matches Manager ID in candidate data
   - Can score all 11 readiness items (1-5)
   - Must achieve 80% for candidate to pass

2. **Shift Manager (Candidate)**: Can fill Self Assessment
   - Identified when logged-in user's ID matches Employee ID
   - Can only access after passing Readiness Checklist
   - Has **ONE attempt only**
   - Must pass (80%+) to unlock Interview stage

3. **Panelist**: Can fill Interview
   - Identified when logged-in user's ID matches Panelist ID
   - Can only access after candidate passes Self Assessment
   - Scores 8 sections (1-5 each)

4. **Admin**: Has access to all stages

### Workflow Sequence:

```
Regional Manager fills Readiness Checklist
        ↓
   Scored 1-5 per item
        ↓
   Score ≥ 80%? 
        ↓ YES
Self Assessment UNLOCKED for SM Candidate
        ↓
SM Candidate completes Assessment (1 attempt)
        ↓
   Passed (≥80%)?
        ↓ YES
Interview UNLOCKED for Panelist
        ↓
Panelist completes Interview Evaluation
```

---

## 📝 Readiness Checklist Items (11 items) - SM to ASM Level

1. Has successfully managed full shifts independently with consistent quality standards
2. Demonstrates strong leadership in coaching and developing team members
3. Shows consistent ability to handle peak hours and complex operational challenges
4. Has completed all advanced training modules including P&L basics and inventory management
5. Exhibits strong problem-solving skills and decision-making capabilities
6. Maintains excellent communication with store team, AM, and support functions
7. Shows initiative in driving store performance metrics (sales, quality, guest satisfaction)
8. Has experience managing conflict resolution and challenging guest situations
9. Demonstrates understanding of cost control, wastage management, and labour scheduling
10. Can open and close the store independently following all protocols
11. Shows commitment to TWC values and acts as a role model for the team

**Scoring**: Each item scored 1-5  
**Passing**: 80% or higher (44/55 points)

---

## 🎤 Interview Sections (8 sections)

1. Operational Excellence & Process Management
2. Team Leadership & People Development
3. Guest Experience & Service Excellence
4. Business Acumen & Cost Management
5. Problem Solving & Decision Making
6. Communication & Stakeholder Management
7. Adaptability & Change Management
8. Strategic Thinking & Initiative

**Scoring**: Each section scored 1-5  
**Total**: 40 points possible

---

## 📱 Self-Assessment Questions (15 MCQ Questions)

Advanced operational and management scenarios focusing on:
- P&L understanding and cost management
- Team leadership and conflict resolution
- Strategic decision-making
- Problem-solving in complex situations
- Business acumen

**Scoring**: 15 questions  
**Passing**: 80% or higher (12/15 correct)  
**Attempts**: ONE attempt only

---

## 🔄 URL Parameters for Direct Access

### For SM Candidates:
```
https://your-app-url.com?EMPID=H1001
```

### For Regional Managers:
```
https://your-app-url.com?EMPID=H301
```

### For Panelists:
```
https://your-app-url.com?EMPID=H201
```

---

## 🔑 Authentication

### Role-Based Access:

**Role**: `bench-planning-sm-asm`  
**Password**: `BenchPlanSMASM2025!`

This role has access to:
- SM-ASM Bench Planning Module (checklist interface)
- Automatically detects user type (Manager/Candidate/Panelist)
- No dashboard access for candidates (dashboard only for admins/editors)

### Dashboard Access:

**Roles with Dashboard Access**:
- `editor` - Full dashboard access
- `hr` (hrconnect) - Dashboard access
- `training` (traininghub) - Dashboard access

Dashboard shows:
- Overall summary statistics
- Region-wise breakdown
- Store-wise breakdown
- Area Manager-wise breakdown
- Excel export functionality

---

## 📊 Dashboard Features

The SM-ASM Bench Planning Dashboard includes:

1. **Summary View**: Overall progress statistics
2. **Region-wise View**: Progress by region
3. **Store-wise View**: Progress by store
4. **AM-wise View**: Progress by Area Manager
5. **Search & Filter**: Find specific candidates or regions
6. **Excel Export**: Download complete data

---

## 🎯 Key Differences from Barista-to-SM

1. **More Advanced Content**: Questions and criteria are tailored for SM-to-ASM level
2. **Higher Expectations**: Focus on business acumen, strategic thinking, P&L management
3. **Separate Data**: Completely independent Google Sheet and database
4. **Separate Access**: Different role (`bench-planning-sm-asm` vs `bench-planning`)
5. **Different Endpoint**: Uses separate Google Apps Script deployment

---

## ⚙️ Configuration Files

### Files Created:
1. `sm-asm-bench-planning-google-apps-script.js` - Backend logic
2. `components/checklists/BenchPlanningSMASMChecklist.tsx` - Checklist interface
3. `components/BenchPlanningSMASMDashboard.tsx` - Dashboard interface

### Files Updated:
1. `App.tsx` - Added routing and tab for SM-ASM module
2. `components/ChecklistsAndSurveys.tsx` - Added SM-ASM checklist option
3. `config/auth.ts` - Added `bench-planning-sm-asm` role and permissions

---

## 🚀 Testing the Setup

### Step 1: Test as Candidate
1. Access: `https://your-app-url.com?EMPID=H1001`
2. Enter password: `BenchPlanSMASM2025!`
3. Should see readiness assessment locked initially

### Step 2: Test as Manager
1. Access: `https://your-app-url.com?EMPID=H301`
2. Enter password: `BenchPlanSMASM2025!`
3. Should be able to select and assess candidates
4. Complete readiness checklist

### Step 3: Test as Candidate Again
1. After manager completes assessment with 80%+
2. Candidate should see self-assessment unlocked
3. Complete assessment (one attempt)

### Step 4: Test as Panelist
1. Access: `https://your-app-url.com?EMPID=H201`
2. Enter password: `BenchPlanSMASM2025!`
3. Should see interview section unlocked after candidate passes

### Step 5: Test Dashboard
1. Access as editor/hr/training role
2. Navigate to "SM-ASM Bench Planning" tab
3. View progress statistics
4. Test search and filter functionality
5. Test Excel export

---

## 📞 Support & Troubleshooting

### Common Issues:

**Q: Checklist not unlocking for candidate?**  
A: Ensure manager's readiness assessment resulted in 80%+ score

**Q: Assessment already attempted but want to retry?**  
A: Delete the row from `SM_ASM_Assessments` sheet (admin access required)

**Q: Candidate not found?**  
A: Verify Employee ID matches exactly in `SM_ASM_Candidates` sheet (case-insensitive)

**Q: Dashboard showing no data?**  
A: Check that Google Apps Script endpoint URL is correctly configured

**Q: Need to change passing threshold?**  
A: Edit the percentage check in the Google Apps Script (currently 80%)

---

## ✅ Checklist Before Going Live

- [ ] Google Sheet created with proper name
- [ ] Google Apps Script deployed as web app
- [ ] Frontend endpoints updated with deployment URL
- [ ] Sample candidate data added to `SM_ASM_Candidates` sheet
- [ ] Store_Mapping sheet configured (if using store/region data)
- [ ] Tested workflow: Manager → Candidate → Panelist
- [ ] Dashboard accessible for authorized roles
- [ ] Excel export functionality tested
- [ ] Access control verified (only authorized users can access)

---

## 🔄 Maintenance

### Regular Tasks:
1. **Add new candidates**: Update `SM_ASM_Candidates` sheet
2. **Monitor progress**: Check dashboard regularly
3. **Review assessments**: Export data for analysis
4. **Update questions**: Modify assessment questions in Google Apps Script if needed
5. **Backup data**: Regularly download sheet as backup

---

**Note**: This setup is completely independent of the Barista-to-SM bench planning module. Both can run simultaneously without any conflicts.
