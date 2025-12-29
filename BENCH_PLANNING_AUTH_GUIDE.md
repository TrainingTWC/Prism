# Bench Planning Authentication - Setup Guide

## 🔐 Overview

The Bench Planning module now uses **passwordless authentication** based on Employee ID verification against the Google Sheet. This provides secure, role-specific access without requiring users to remember passwords.

## 🎯 How It Works

### Authentication Flow:

1. **User accesses URL with Employee ID**: `?id=H3282&name=Madan%20V`
2. **System checks Google Sheet**: Verifies if Employee ID exists in `Bench_Candidates` sheet
3. **Auto-authentication**: If found, user is automatically logged in with `bench-planning` role
4. **Role detection**: System determines if user is Manager/Candidate/Panelist based on ID match
5. **Access granted**: User sees appropriate interface based on their role

### No Password Required ✅

- Bench Planning users are authenticated directly via Employee ID
- Google Sheet acts as the source of truth
- Security through ID verification, not passwords

## 📋 Setup Steps

### Step 1: Configure Google Apps Script Endpoint

1. Open `contexts/AuthContext.tsx`
2. Find line ~110 (in the `checkBenchPlanningEmployee` function):
   ```typescript
   const BENCH_PLANNING_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace with your deployed Google Apps Script URL from `bench-planning-google-apps-script.js`

### Step 2: Ensure Google Sheet Has Candidate Data

Your `Bench_Candidates` sheet must have:
- Column A: Employee ID (e.g., H3282)
- Column B: Employee Name (e.g., Madan V)
- Column C: Manager ID (e.g., H546)
- Column D: Manager Name (e.g., Ajay Hathmuria)
- Column E: Panelist ID (e.g., H2155)
- Column F: Panelist Name (e.g., Jagruti)

### Step 3: Test Access

Test with different employee IDs to verify role-based access:

#### Test as Manager:
```
https://your-app.com/?id=H546&name=Ajay%20Hathmuria
```
Expected: Access to fill Readiness Checklists

#### Test as Candidate:
```
https://your-app.com/?id=H3282&name=Madan%20V
```
Expected: View readiness status, access self-assessment when unlocked

#### Test as Panelist:
```
https://your-app.com/?id=H2155&name=Jagruti
```
Expected: Access to fill Interview evaluations

## 🔑 Role Detection Logic

The system automatically detects user role by matching their Employee ID:

```typescript
if (userId === managerId) → User is Manager
if (userId === employeeId) → User is Candidate  
if (userId === panelistId) → User is Panelist
```

## 🛡️ Security Features

### ✅ Implemented:
- Employee ID must exist in Google Sheet to access
- Role-based access control (Manager/Candidate/Panelist)
- Automatic session management
- No passwords stored or required
- Google Sheet as single source of truth

### 🔒 Access Control:
- **Managers**: Can only fill Readiness Checklists for their assigned employees
- **Candidates**: Can only view their own status and fill their assessment
- **Panelists**: Can only fill Interviews for assigned candidates
- **Editors**: Have full access to all roles and features

## 👥 Who Can Access

### Automatic Bench Planning Access:
- Any Employee ID listed in `Bench_Candidates` sheet
- Role determined automatically based on ID match

### Editor Access:
- Users with `editor` role can access bench planning
- Editors have full permissions across all modules
- Can view/edit as any role (Manager/Candidate/Panelist)

## 🔄 Authentication States

### For Bench Planning Users:
```
1. User visits URL with ?id=H3282
2. System checks: Is H3282 in Bench_Candidates sheet?
3. If YES: Auto-login as 'bench-planning' role → Direct to module
4. If NO: Show password screen (not a bench planning user)
```

### For Editor Users:
```
1. User logs in with Editor password
2. Editor role has 'bench-planning' in permissions
3. Editor can access all modules including Bench Planning
4. Full admin capabilities
```

## 🚫 Users Who Need Passwords

If Employee ID is NOT in the Bench_Candidates sheet:
- User must enter a valid role password
- Available roles: operations, hr, qa, training, finance, admin, editor
- Cannot access Bench Planning without being in the sheet

## 📱 URL Format

### Required Parameters:
- `id` or `empId` = Employee ID (e.g., H3282)
- `name` or `empName` = Employee Name (optional but recommended)

### Example URLs:
```
// Manager accessing
?id=H546&name=Ajay%20Hathmuria

// Candidate accessing
?id=H3282&name=Madan%20V

// Panelist accessing  
?id=H2155&name=Jagruti

// Alternative parameter names (all work)
?empId=H3282&empName=Madan%20V
```

## 🧪 Testing Checklist

- [ ] Google Apps Script URL updated in AuthContext.tsx
- [ ] Bench_Candidates sheet populated with test data
- [ ] Test Manager access (can fill readiness checklist)
- [ ] Test Candidate access (sees status, can do assessment)
- [ ] Test Panelist access (can fill interview)
- [ ] Test Editor access (full permissions)
- [ ] Test invalid Employee ID (shows password screen)
- [ ] Verify role detection works correctly
- [ ] Check that candidates can only see their own data

## 🔧 Troubleshooting

### "Employee not found" or Password Screen Shows

**Possible causes:**
1. Employee ID not in `Bench_Candidates` sheet
2. Google Apps Script URL not configured in AuthContext.tsx
3. Typo in Employee ID (case-sensitive)
4. Google Apps Script not deployed or not accessible

**Solution:**
1. Verify Employee ID exists in sheet (exact match)
2. Check AuthContext.tsx has correct endpoint URL
3. Test Google Apps Script directly in browser
4. Check Apps Script deployment permissions

### User Can't Access Even Though in Sheet

**Possible causes:**
1. Google Apps Script endpoint returns error
2. Network/CORS issues
3. Script not deployed as "Execute as: Me"

**Solution:**
1. Test endpoint directly: `YOUR_URL?action=getCandidateData&employeeId=H3282`
2. Check browser console for errors
3. Redeploy Apps Script with correct permissions

### Wrong Role Detected

**Possible causes:**
1. Multiple entries with same Employee ID in different roles
2. ID mismatch in Google Sheet

**Solution:**
1. Ensure each Employee ID appears only once
2. Verify Manager ID, Employee ID, Panelist ID are correct
3. Clear browser cache and localStorage

## 📊 Access Matrix

| User Type | Has Password? | Auto-Login? | Bench Planning Access | Role Detection |
|-----------|---------------|-------------|----------------------|----------------|
| Manager (in sheet) | ❌ No | ✅ Yes | ✅ Yes (Manager view) | By Manager ID |
| Candidate (in sheet) | ❌ No | ✅ Yes | ✅ Yes (Candidate view) | By Employee ID |
| Panelist (in sheet) | ❌ No | ✅ Yes | ✅ Yes (Panelist view) | By Panelist ID |
| Editor | ✅ Yes | ❌ No | ✅ Yes (Full access) | Password login |
| Other Employees | ✅ Yes | ❌ No | ❌ No | Password login |

## 💡 Best Practices

1. **Keep Sheet Updated**: Regularly update `Bench_Candidates` sheet with current employees
2. **Unique IDs**: Ensure all Employee/Manager/Panelist IDs are unique
3. **Test Before Sharing**: Test URLs before sending to users
4. **Monitor Access**: Check Google Sheets access logs periodically
5. **Clear Instructions**: Provide users with correct URL format

## 🔄 Session Management

- Sessions last **24 hours** by default
- Auto-refresh on page reload if valid
- Cleared on logout
- Separate from password-based sessions

## 📞 Need Help?

If you encounter issues:
1. Check browser console for error messages
2. Verify Google Apps Script is accessible
3. Test with known good Employee IDs
4. Ensure all setup steps completed

## 🎉 Advantages of Passwordless Auth

✅ **No passwords to remember** - Users just need their Employee ID
✅ **Automatic role detection** - System determines access level
✅ **Single source of truth** - Google Sheet manages all access
✅ **Easy to update** - Add/remove access by updating sheet
✅ **Secure** - Only authorized Employee IDs can access
✅ **User-friendly** - Just click a link to access
