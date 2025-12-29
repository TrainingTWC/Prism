# Bench Planning - Quick Reference

## ✅ What's Been Implemented

### 1. **New Module Added**: Bench Planning
- Located in "Checklists & Surveys" tab
- Violet-colored card with Users icon
- Fully integrated into your existing system

### 2. **Three Sub-Modules with Sequential Workflow**

#### 📋 Readiness Checklist
- **Filled by**: Reporting Manager only
- **Access**: Manager can see and edit
- **Items**: 11 criteria items
- **Scoring**: Each item scored 1-5
- **Passing**: 60% or higher (33/55 points)
- **Effect**: Unlocks Self Assessment for candidate when passed

#### 🧠 Self Assessment  
- **Filled by**: Candidate only
- **Access**: Unlocked after passing Readiness Checklist
- **Attempts**: ONE attempt only (strict enforcement)
- **Questions**: Placeholder ready for your questions
- **Effect**: Unlocks Interview when passed

#### 💬 Interview
- **Filled by**: Panelist only
- **Access**: Unlocked after candidate passes Self Assessment
- **Sections**: 8 evaluation areas
- **Scoring**: Each section scored 1-5

### 3. **Role-Based Access Control**
The system automatically detects user type based on Google Sheet data:
- If user ID = Manager ID → Manager access
- If user ID = Employee ID → Candidate access
- If user ID = Panelist ID → Panelist access
- Admin role → Full access

### 4. **Visual Status Indicators**
- 🔒 Lock icon = Stage locked (requirements not met)
- 🔓 Unlock icon = Stage unlocked and accessible
- ✅ Check mark = Stage completed and passed
- ⚠️ Alert icon = Needs attention or failed

### 5. **Data Storage**
- **Google Sheet**: 4 separate sheets created automatically
  1. `Bench_Candidates` - Master list
  2. `Readiness_Checklists` - Manager assessments
  3. `Self_Assessments` - Candidate responses
  4. `Interviews` - Panel evaluations

## 📝 Files Created/Modified

### New Files:
1. `components/checklists/BenchPlanningChecklist.tsx` - Main component
2. `bench-planning-google-apps-script.js` - Backend data handler
3. `BENCH_PLANNING_SETUP_GUIDE.md` - Detailed setup instructions
4. `BENCH_PLANNING_QUICK_REFERENCE.md` - This file

### Modified Files:
1. `types.ts` - Added Bench Planning interfaces
2. `components/ChecklistsAndSurveys.tsx` - Added module to navigation

## 🚀 Next Steps to Make It Live

### Step 1: Deploy Google Apps Script (5 minutes)
1. Open your Google Sheet
2. Go to Extensions → Apps Script
3. Copy-paste `bench-planning-google-apps-script.js`
4. Run `initializeSheets` function (authorize when prompted)
5. Deploy as Web App
6. Copy the deployment URL

### Step 2: Update Frontend (1 minute)
1. Open `components/checklists/BenchPlanningChecklist.tsx`
2. Find line 18: `const BENCH_PLANNING_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';`
3. Replace with your actual URL from Step 1

### Step 3: Add Your Candidate Data
1. Go to `Bench_Candidates` sheet in Google Sheets
2. Replace sample data with real employee/manager/panelist info
3. Format: Employee ID | Name | Manager ID | Name | Panelist ID | Name

### Step 4: Add Assessment Questions (When Ready)
When you provide the self-assessment questions, I'll integrate them into the Assessment tab.

## 🎯 How Users Access It

### For Managers:
```
URL: https://your-app.com?id=H546&name=Ajay%20Hathmuria
```
- Loads to Bench Planning
- Can search for employees
- Fill readiness checklists

### For Candidates:
```
URL: https://your-app.com?id=H3282&name=Madan%20V
```
- Sees their readiness status
- Can access assessment when unlocked
- Limited to ONE attempt

### For Panelists:
```
URL: https://your-app.com?id=H2155&name=Jagruti
```
- Can search for candidates
- Fill interview evaluations
- Only for candidates who passed assessment

## 📊 Sample Workflow

1. **Manager logs in** with `?id=H546` (Ajay Hathmuria)
   - Searches for employee H3282 (Madan V)
   - Fills 11-item readiness checklist, scoring 1-5 each
   - Submits → Total: 38/55 (69%) → **PASSED** ✅

2. **Candidate logs in** with `?id=H3282` (Madan V)
   - Sees "Readiness Assessment Passed"
   - Self Assessment now **unlocked** 🔓
   - Completes assessment (one attempt)
   - Submits → **PASSED** ✅

3. **Panelist logs in** with `?id=H2155` (Jagruti)
   - Searches for employee H3282
   - Interview now **unlocked** 🔓
   - Fills 8-section evaluation, scoring 1-5 each
   - Submits interview

## 🔒 Security Features

- Candidates **cannot** fill their own readiness checklist
- Assessment has **strict ONE-attempt** enforcement
- Interview can only be filled by designated panelist
- All locked stages show clear messaging
- Role detection is automatic based on ID matching

## 📱 Mobile Friendly

- Fully responsive design
- Works on phones, tablets, desktops
- Touch-friendly buttons
- Optimized layouts for small screens

## ⚙️ Configuration

### Passing Thresholds (can be adjusted):
- Readiness: 60% (line 156 in BenchPlanningChecklist.tsx)
- Assessment: 60% (in Google Apps Script, line 410)

### Score Ranges:
- Readiness: 11 items × 5 points = 55 max
- Interview: 8 sections × 5 points = 40 max

## 🐛 Testing Checklist

- [ ] Google Apps Script deployed and URL updated
- [ ] Candidate data loaded in Google Sheet
- [ ] Manager can access and fill readiness checklist
- [ ] Candidate sees locked assessment before passing readiness
- [ ] Assessment unlocks after readiness passes
- [ ] ONE attempt enforcement works
- [ ] Interview unlocks after assessment passes
- [ ] Panelist can fill interview
- [ ] All data saves to Google Sheets correctly

## 📞 Questions?

When you're ready to:
- Add the self-assessment questions
- Adjust passing thresholds
- Customize scoring
- Add more features

Just let me know and I'll help integrate them!
