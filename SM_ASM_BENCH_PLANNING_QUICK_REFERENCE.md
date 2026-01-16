# SM-ASM Bench Planning Quick Reference

## 📋 Quick Links

**Frontend Files:**
- Checklist Component: `components/checklists/BenchPlanningSMASMChecklist.tsx`
- Dashboard Component: `components/BenchPlanningSMASMDashboard.tsx`
- Backend Script: `sm-asm-bench-planning-google-apps-script.js`

**Configuration Files:**
- App Integration: `App.tsx`
- Checklist Router: `components/ChecklistsAndSurveys.tsx`
- Auth Config: `config/auth.ts`

---

## 🔑 Access Credentials

**Role**: `bench-planning-sm-asm`  
**Password**: `BenchPlanSMASM2025!`

**URL Format**: `https://your-app-url.com?EMPID=EMPLOYEE_ID`

---

## 📊 Google Sheets Structure

**Main Sheets:**
1. `SM_ASM_Candidates` - Master data (Employee, Manager, Panelist)
2. `SM_ASM_Readiness` - Manager assessments
3. `SM_ASM_Assessments` - Candidate self-assessments
4. `SM_ASM_Interviews` - Panelist evaluations
5. `Store_Mapping` - Store/AM lookup (shared with Barista-to-SM)

---

## ⚡ Key Features

### Readiness Checklist (11 Items)
- **Who**: Regional Managers
- **Scoring**: 1-5 per item
- **Passing**: 80% (44/55 points)
- **Focus**: Leadership, operations, business acumen

### Self Assessment (15 MCQs)
- **Who**: SM Candidates
- **Attempts**: ONE only
- **Passing**: 80% (12/15 correct)
- **Focus**: P&L, cost management, strategic thinking

### Interview (8 Sections)
- **Who**: Panelists
- **Scoring**: 1-5 per section
- **Total**: 40 points
- **Focus**: Comprehensive ASM readiness

---

## 🎯 Scoring Criteria

| Stage | Items/Questions | Points Each | Total | Passing |
|-------|----------------|-------------|-------|---------|
| Readiness | 11 items | 1-5 | 55 | 44 (80%) |
| Assessment | 15 MCQs | Pass/Fail | 15 | 12 (80%) |
| Interview | 8 sections | 1-5 | 40 | N/A |

---

## 🔄 Workflow at a Glance

```
1️⃣ Regional Manager → Fills Readiness (11 items, 1-5 each)
                      ↓ Must score 80%+
                      
2️⃣ SM Candidate    → Self Assessment (15 MCQs)
                      ↓ ONE attempt, must pass 80%+
                      
3️⃣ Panelist        → Interview (8 sections, 1-5 each)
                      ✅ Complete
```

---

## 🚨 Important Notes

1. **One Attempt Rule**: Candidates get ONE attempt on self-assessment
2. **Time Lock**: Optional assessment unlock date/time can be set
3. **Auto-Detection**: System automatically detects Manager/Candidate/Panelist roles
4. **Independent**: Completely separate from Barista-to-SM module
5. **No Resubmission**: Readiness checklist cannot be resubmitted once completed

---

## 📱 User Interface

**For Managers:**
- Select candidate from dropdown (auto-loaded team members)
- Score 11 readiness items
- Add remarks
- Submit (one-time only)

**For Candidates:**
- See readiness status
- Access self-assessment when unlocked
- Answer 15 MCQ questions
- Submit (one attempt only)

**For Panelists:**
- Select candidate
- Score 8 interview sections
- Add overall comments
- Submit/Update

**For Admins/Dashboard Users:**
- View summary statistics
- Filter by region/status
- Export to Excel
- Track progress by store/AM

---

## 🔧 Endpoint Configuration

**Update these files with your Google Apps Script URL:**

1. `BenchPlanningSMASMChecklist.tsx` (line ~18):
```typescript
const BENCH_PLANNING_SM_ASM_ENDPOINT = 'YOUR_URL_HERE';
```

2. `BenchPlanningSMASMDashboard.tsx` (line ~92):
```typescript
const BENCH_PLANNING_SM_ASM_ENDPOINT = 'YOUR_URL_HERE';
```

---

## 📊 Dashboard Access

**Roles with Dashboard Access:**
- `editor` - Full access to both modules
- `hr` - Can view both dashboards
- `training` - Can view both dashboards

**Tabs Available:**
- "Bench Planning Dashboard" - Barista to SM
- "SM-ASM Bench Planning" - SM to ASM

---

## 🎨 Visual Indicators

**Status Colors:**
- 🟢 **Passed** - Green badge
- 🔴 **Failed** - Red badge  
- ⏳ **Pending** - Gray badge
- 🔵 **Completed** - Blue badge

**Lock Icons:**
- 🔒 **Locked** - Assessment not yet available
- 🔓 **Unlocked** - Assessment available

---

## 🔄 Data Flow

```
Google Sheets (Source)
    ↓
Google Apps Script (API)
    ↓
Frontend (React Components)
    ↓
User Interface
```

**API Actions:**
- `getCandidateData` - Load candidate info & progress
- `getManagerCandidates` - Load manager's team
- `submitReadiness` - Submit readiness checklist
- `submitAssessment` - Submit self-assessment
- `submitInterview` - Submit interview
- `getDashboardData` - Load dashboard stats
- `getAssessmentQuestions` - Load MCQ questions

---

## 📝 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Assessment not unlocking | Check readiness score ≥ 80% |
| Candidate not found | Verify Employee ID in SM_ASM_Candidates |
| Already attempted error | Delete row from SM_ASM_Assessments sheet |
| Dashboard empty | Verify endpoint URL is configured |
| No team members showing | Check Manager ID matches in data |

---

## 🎯 Sample Data Format

**SM_ASM_Candidates Sheet:**
```
| Employee ID | Name      | Manager ID | Manager Name | Panelist ID | Panelist Name | Store | Region | Unlock Time |
|-------------|-----------|------------|--------------|-------------|---------------|-------|--------|-------------|
| H1001       | Rahul SM  | H301       | RM Name      | H201        | Panel Name    | S101  | North  |             |
```

---

## 🔐 Permissions Summary

**auth.ts Configuration:**
```typescript
'bench-planning-sm-asm': {
  password: 'BenchPlanSMASM2025!',
  permissions: ['bench-planning-sm-asm'],
  dashboardAccess: []
}
```

**Dashboard Access Added To:**
- `hr` role
- `training` role
- `editor` role
- `admin` role

---

## ✨ Features Unique to SM-ASM

1. **Advanced Questions**: P&L, cost management, strategic scenarios
2. **Higher Bar**: 80% passing (vs other thresholds)
3. **Business Focus**: ASM-level competencies
4. **Independent Module**: Separate from Barista-to-SM
5. **Dedicated Dashboard**: Own tab in main interface

---

## 📞 Need Help?

1. Check `SM_ASM_BENCH_PLANNING_SETUP_GUIDE.md` for detailed setup
2. Verify Google Apps Script deployment
3. Confirm endpoint URLs are configured
4. Test with sample data first
5. Review console for errors

---

**Created**: January 2026  
**Version**: 1.0  
**Module**: SM-ASM Bench Planning
