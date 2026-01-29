# Bench Planning - Panelist UI Update

## Overview
Updated the panelist interface with a dedicated dashboard showing all assigned candidates with their progress, and updated interview competencies to reflect core values.

## Changes Made

### 1. Updated Interview Competencies

**Previous Sections (8):**
- Product & Process Knowledge
- Food Safety Understanding
- Leadership & Initiative
- Guest Service Excellence
- Communication Skills
- Problem Solving
- Team Management
- Adaptability

**New Core Competencies (7):**
- Responsibility
- Empathy
- Service Excellence
- Performance with Purpose
- Ethics and Integrity
- Collaboration
- Trust

### 2. New Panelist Dashboard Component

**File:** `components/checklists/BenchPlanningPanelistDashboard.tsx`

**Features:**
- **Welcome Header:** Displays panelist name and assigned candidate count
- **Search Functionality:** Search candidates by name or ID
- **Candidate List:** Shows all assigned candidates with:
  - Employee ID and Name
  - AM/Trainer (Area Manager)
  - Store Name and Region
  - Readiness Score (with status badge)
  - Assessment Score (with status badge)
  - Interview Status
  - "Take Interview" button (enabled only if assessment passed)
- **Summary Statistics:**
  - Total candidates assigned
  - Readiness passed count
  - Ready for interview count
  - Interviews completed count
- **Responsive Design:** Desktop table view and mobile card view

### 3. Updated Backend (Google Apps Script)

**File:** `bench-planning-google-apps-script.js`

**Changes:**
- Updated `INTERVIEW_SECTIONS` array to new 7 core competencies
- Enhanced `getPanelistCandidates()` function to include:
  - Readiness scores and status
  - Assessment scores and status
  - Interview scores and status
  - Store and Area Manager information from Store_Mapping

### 4. Updated Frontend Components

**Files Updated:**
- `components/checklists/BenchPlanningChecklist.tsx`
- `components/checklists/BenchPlanningSMASMChecklist.tsx`

**Changes:**
- Updated `INTERVIEW_SECTIONS` constants to new competencies
- Added panelist dashboard integration
- Added "Back to Candidate List" button when in interview mode
- Separated panelist flow from manager flow
- Managers: Use dropdown to select team members
- Panelists: Use dashboard to view and select candidates

## User Experience Flow

### For Panelists:

1. **Login:** Access via URL with panelist ID
   ```
   ?id=H2155&name=Jagruti
   ```

2. **Dashboard View:**
   - See all assigned candidates
   - View progress at a glance (Readiness/Assessment/Interview)
   - Search for specific candidates

3. **Take Interview:**
   - Click "Take Interview" button (enabled only if candidate passed assessment)
   - Complete interview evaluation with 7 core competencies
   - Each scored 1-5
   - Add overall remarks
   - Submit

4. **Return to Dashboard:**
   - Click "Back to Candidate List" to return to overview
   - Review or update previous interviews

### Interview Evaluation Process:

**Scoring Scale:** 1 (Poor) to 5 (Excellent)

**Competencies to Evaluate:**
1. **Responsibility** - Accountability and ownership
2. **Empathy** - Understanding and relating to others
3. **Service Excellence** - Quality of customer service
4. **Performance with Purpose** - Goal-oriented work ethic
5. **Ethics and Integrity** - Honesty and moral principles
6. **Collaboration** - Teamwork and cooperation
7. **Trust** - Reliability and trustworthiness

**Total Score:** 35 points (7 sections × 5 points each)

## Technical Details

### API Endpoints Used:

```javascript
// Get panelist's assigned candidates with progress
GET ?action=getPanelistCandidates&panelistId=H2155

// Response includes:
{
  success: true,
  candidates: [
    {
      employeeId: "H3282",
      employeeName: "Madan V",
      managerId: "H546",
      managerName: "Ajay Hathmuria",
      storeId: "BLR001",
      storeName: "Bangalore Store 1",
      region: "South",
      readinessStatus: "Passed",
      readinessScore: 85.5,
      assessmentStatus: "Passed",
      assessmentScore: 86.7,
      interviewStatus: "Not Started",
      interviewScore: null
    },
    // ... more candidates
  ]
}
```

### Component Props:

```typescript
interface BenchPlanningPanelistDashboardProps {
  panelistId: string;        // Panelist employee ID
  panelistName: string;      // Panelist display name
  onTakeInterview: (candidate: Candidate) => void;  // Callback when interview button clicked
}
```

## Data Structure

### Bench_Candidates Sheet:
| Column | Field | Description |
|--------|-------|-------------|
| A | Employee ID | Candidate ID |
| B | Employee Name | Candidate name |
| C | Manager ID | Reporting manager/trainer |
| D | Manager Name | Manager display name |
| E | Panelist ID | **Interview panelist ID** |
| F | Panelist Name | Panelist display name |
| G | Store ID | Store identifier |
| H | Region | Geographic region |
| I | Assessment Unlock DateTime | When assessment becomes available |

### Interviews Sheet (Updated):
- 7 score columns (one per competency)
- Total Score: Sum of all 7 scores
- Max Score: 35 (7 × 5)
- Percentage: (Total Score / 35) × 100

## Benefits

1. **Better Overview:** Panelists see all candidates at once
2. **Search Capability:** Quickly find specific candidates
3. **Progress Tracking:** See readiness/assessment status before interview
4. **Clear Eligibility:** Interview button only enabled when ready
5. **Aligned Competencies:** Interview focuses on core company values
6. **Mobile Friendly:** Responsive design for phone/tablet access

## Deployment Steps

1. **Update Google Apps Script:**
   - Copy updated code from `bench-planning-google-apps-script.js`
   - Deploy as new version
   - Update endpoint URL if changed

2. **Deploy Frontend:**
   - Build and deploy updated React components
   - Ensure new dashboard component is included

3. **Test as Panelist:**
   ```
   URL: ?id=H2155&name=Jagruti
   ```
   - Verify dashboard loads with candidates
   - Test search functionality
   - Confirm interview flow works
   - Verify back button returns to dashboard

4. **Verify Interview Sections:**
   - Confirm 7 competencies display
   - Test scoring (1-5 for each)
   - Check submission and score calculation

## Notes

- Panelists can only interview candidates who have passed assessment (80%+)
- Interview evaluations can be updated after submission
- All previous functionality for managers and candidates remains unchanged
- The 7 core competencies align with TWC organizational values
