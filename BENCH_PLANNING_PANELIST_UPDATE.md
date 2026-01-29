# Bench Planning - Panelist Access Update

## Changes Required

### 1. Add Panelist Candidates Loading Function

After `loadManagerCandidates` function (around line 270), add:

```typescript
// Load panelist's candidates from Google Sheets
const loadPanelistCandidates = async (panelistId: string) => {
  try {
    setLoadingCandidates(true);
    const response = await fetch(`${BENCH_PLANNING_ENDPOINT}?action=getPanelistCandidates&panelistId=${panelistId}&_t=${new Date().getTime()}`);
    const data = await response.json();
    
    if (data.success && data.candidates) {
      setManagerCandidates(data.candidates); // Reuse same state
      setUserType('panelist');
    } else {
      console.error('Failed to load panelist candidates:', data.message);
    }
  } catch (error) {
    console.error('Error loading panelist candidates:', error);
  } finally {
    setLoadingCandidates(false);
  }
};
```

### 2. Update Initial Load useEffect

Change the useEffect around line 295 from:

```typescript
// Initial load: check if user is a candidate or manager
useEffect(() => {
  if (!userId) return;
  
  // Try loading as candidate first
  loadCandidateData(userId);
  
  // Also try loading as manager
  loadManagerCandidates(userId);
}, [userId]);
```

To:

```typescript
// Initial load: check if user is a candidate, manager, or panelist
useEffect(() => {
  if (!userId) return;
  
  // Try loading as candidate first
  loadCandidateData(userId);
  
  // Also try loading as manager
  loadManagerCandidates(userId);
  
  // Also try loading as panelist
  loadPanelistCandidates(userId);
}, [userId]);
```

### 3. Add Pie Chart Component

Add before `renderReadinessTab()` function (around line 550):

```typescript
// Pie Chart Component for Score Visualization
const PieChart: React.FC<{ percentage: number; label: string }> = ({ percentage, label }) => {
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="flex flex-col items-center">
      <svg className="w-32 h-32" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dy="7"
          className="text-2xl font-bold"
          fill="currentColor"
        >
          {percentage}%
        </text>
      </svg>
      <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mt-2">{label}</p>
    </div>
  );
};
```

### 4. Add Candidate Info Section with Pie Charts

In `renderReadinessTab()`, after the status banner (around line 580), add:

```typescript
{/* Candidate Info with Pie Charts */}
{candidateData && (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Candidate Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="space-y-2 mb-4">
          <div>
            <span className="text-sm text-gray-600 dark:text-slate-400">Name:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{candidateData.employeeName}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-slate-400">Employee ID:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{candidateData.employeeId}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-slate-400">Manager:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{candidateData.managerName}</span>
          </div>
          {(userType === 'panelist' || userType === 'admin') && (
            <div>
              <span className="text-sm text-gray-600 dark:text-slate-400">Panelist:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{candidateData.panelistName}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-8 justify-center items-center">
        {candidateData.readinessScore !== undefined && candidateData.readinessScore > 0 && (
          <PieChart 
            percentage={Math.round(candidateData.readinessScore)} 
            label="Readiness Score" 
          />
        )}
        {candidateData.assessmentScore !== undefined && candidateData.assessmentScore > 0 && (
          <PieChart 
            percentage={Math.round(candidateData.assessmentScore)} 
            label="Assessment Score" 
          />
        )}
      </div>
    </div>
  </div>
)}
```

### 5. Update Tab Navigation for Panelists

Around line 1270, change:

```typescript
{/* Only show Assessment and Interview tabs for candidates */}
{userType === 'candidate' && (
```

To:

```typescript
{/* Show Assessment and Interview tabs for candidates and panelists */}
{(userType === 'candidate' || userType === 'panelist' || userType === 'admin') && (
```

### 6. Update Interview Tab Access

In `renderInterviewTab()` function, change the lock condition to allow panelist access even if locked for candidates.

### 7. Update Candidate Selection UI

Around line 1185, update the heading to show "Select Candidate to Interview" for panelists.

### 8. Update Google Apps Script

Add new endpoint to handle panelist candidates. In `bench-planning-google-apps-script.js`, add:

```javascript
// Get candidates assigned to a specific panelist
function getPanelistCandidates(panelistId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const candidateSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!candidateSheet) {
      return createJsonResponse({
        success: false,
        message: 'Candidates sheet not found'
      });
    }
    
    const data = candidateSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filter candidates where panelistId matches (column index 4)
    const panelistCandidates = rows
      .filter(row => row[4] === panelistId)
      .map(row => ({
        employeeId: row[0],
        employeeName: row[1],
        managerId: row[2],
        managerName: row[3],
        panelistId: row[4],
        panelistName: row[5],
        assessmentScheduledTime: row[6],
        interviewScheduledTime: row[7]
      }));
    
    return createJsonResponse({
      success: true,
      candidates: panelistCandidates
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: error.toString()
    });
  }
}
```

And in the `doGet` function, add the new action handler:

```javascript
case 'getPanelistCandidates':
  return getPanelistCandidates(e.parameter.panelistId);
```

## Summary

These changes will:
1. ✅ Allow panelists from Google Sheet to access the system
2. ✅ Show candidate dropdown for panelists
3. ✅ Display pie charts for readiness and assessment scores
4. ✅ Show all interview questions with 1-5 scoring for panelists
5. ✅ Make interview panel accessible and functional for panelists
