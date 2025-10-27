# Checklist Autofill by Role

## Overview
Auditor fields are now automatically filled based on the user's role when they open a checklist.

## Autofill Mapping

| Role | Password | Autofilled Field | Field Name in Checklist |
|------|----------|------------------|-------------------------|
| **Training** | `TrainingHub2024!` | Trainer Name & ID | `TRAINER` - "Trainer (Auditor)" |
| **Operations** | `OpsAccess2024!` | Area Manager Name & ID | `AREA_MANAGER` - "Area Manager" |
| **HR** | `HRConnect2024!` | HR Name & ID | `HR_NAME` & `HR_ID` - "HR Name" |
| **QA** | `QualityCheck2024!` | QA Auditor Name & ID | `QA_AUDITOR_NAME` & `QA_AUDITOR_ID` |
| **Finance** | `FinanceSecure2024!` | Finance Auditor Name & ID | `FINANCE_AUDITOR_NAME` & `FINANCE_AUDITOR_ID` |
| **Admin** | `Editornotcreator2025!` | *(No autofill - admin can select any)* | N/A |

## How It Works

### 1. Login Flow
```
User visits: https://trainingtwc.github.io/Prism/?EMPID=h541
↓
App validates EMPID against employee_data.json
↓
Shows login page with "Welcome, [Employee Name]!"
↓
User enters role-based password
↓
System identifies role and stores employee data
```

### 2. Checklist Autofill
```
User opens Checklist tab
↓
Checklist reads:
  - employeeData (name + code from Auth context)
  - userRole (from password authentication)
↓
If role matches checklist type:
  Autofills appropriate auditor field with employee name + ID
↓
User can still edit/change the value if needed
```

## Example Scenarios

### Scenario 1: Training Manager
```
1. Login URL: ?EMPID=h541 (Amritanshu Prasad)
2. Password: TrainingHub2024!
3. Opens: Training Checklist
4. Result: "Trainer (Auditor)" field shows "Amritanshu Prasad (h541)"
```

### Scenario 2: Area Manager
```
1. Login URL: ?EMPID=h3237 (Karam Singh)
2. Password: OpsAccess2024!
3. Opens: AM Operations Checklist
4. Result: "Area Manager" field shows "Karam Singh (h3237)"
```

### Scenario 3: HR Manager
```
1. Login URL: ?EMPID=h2081 (Sarit Kumar)
2. Password: HRConnect2024!
3. Opens: HR Survey Checklist
4. Result: "HR Name" field shows "Sarit Kumar (h2081)"
```

### Scenario 4: QA Auditor
```
1. Login URL: ?EMPID=h9876 (QA Auditor Name)
2. Password: QualityCheck2024!
3. Opens: QA Checklist
4. Result: "QA Auditor Name" field shows "QA Auditor Name (h9876)"
```

### Scenario 5: Finance Auditor
```
1. Login URL: ?EMPID=h5432 (Finance Manager)
2. Password: FinanceSecure2024!
3. Opens: Finance Checklist
4. Result: "Finance Auditor Name" field shows "Finance Manager (h5432)"
```

### Scenario 6: Admin
```
1. Login URL: ?EMPID=h541 (Any Employee)
2. Password: Editornotcreator2025!
3. Opens: Any Checklist
4. Result: Fields are empty - admin manually selects values
```

## Technical Implementation

### Files Modified
1. `components/checklists/TrainingChecklist.tsx`
   - Added `useAuth()` hook
   - Autofills `trainerName` and `trainerId` when `userRole === 'training'`

2. `components/checklists/OperationsChecklist.tsx`
   - Added `useAuth()` hook
   - Autofills `amName` and `amId` when `userRole === 'operations'`

3. `components/checklists/HRChecklist.tsx`
   - Added `useAuth()` hook
   - Autofills `hrName` and `hrId` when `userRole === 'hr'`

4. `components/checklists/QAChecklist.tsx`
   - Added `useAuth()` hook
   - Autofills `qaName` and `qaId` when `userRole === 'qa'`

5. `components/checklists/FinanceChecklist.tsx`
   - Added `useAuth()` hook
   - Autofills `financeAuditorName` and `financeAuditorId` when `userRole === 'finance'`

### Data Source
- Employee name & code from: `employeeData` (stored in Auth context after EMPID validation)
- User role from: `userRole` (set after password authentication)

## User Experience

### Before Autofill
User had to manually:
1. Remember their employee ID
2. Type their name correctly
3. Match the format expected by the system

### After Autofill
1. Fields pre-populated with correct name & ID
2. User can immediately start filling checklist
3. Reduces errors and saves time
4. Still editable if user needs to change (e.g., someone filling on behalf)

## Notes
- Autofill only works when user logs in with matching role password
- Admin users see empty fields (can select any auditor)
- Fields remain editable after autofill
- Values persist in localStorage for session continuation
- Employee must exist in `employee_data.json` for EMPID validation
