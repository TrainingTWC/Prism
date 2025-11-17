# Campus Hiring - Checklist-Only Access

## Overview
Configured the Campus Hiring role to provide a streamlined, checklist-only experience. Users with the `campus-hiring` role can log in with a password and are taken directly to the Campus Hiring checklist without any dashboard or navigation options.

## Changes Made

### 1. Added Campus Hiring Role Support
**Files Modified:**
- `contexts/AuthContext.tsx`
- `roleMapping.ts`

**Changes:**
- Added `'campus-hiring'` to the UserRole type definitions
- Campus hiring role now properly recognized throughout the application

### 2. Checklist-Only Flow in App.tsx
**File:** `App.tsx`

**Added:**
```typescript
// If user has campus-hiring role, only show the campus hiring checklist
if (authUserRole === 'campus-hiring') {
  const campusHiringRole = {
    userId: 'campus-hiring',
    name: 'Campus Hiring Access',
    role: 'campus-hiring' as const,
    allowedStores: [],
    allowedAMs: [],
    allowedHRs: []
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
      <Header />
      <main className="p-2 sm:p-4 lg:p-8">
        <ChecklistsAndSurveys userRole={campusHiringRole} />
      </main>
    </div>
  );
}
```

**Result:**
- Campus hiring users bypass the dashboard and tab navigation
- They see only the Header and Checklists component

### 3. Auto-Open Campus Hiring Checklist
**File:** `components/ChecklistsAndSurveys.tsx`

**Added:**
```typescript
// Auto-open campus hiring checklist for campus-hiring role users
useEffect(() => {
  if (authUserRole === 'campus-hiring' && !activeChecklist) {
    setActiveChecklist('campus-hiring');
  }
}, [authUserRole]);
```

**Result:**
- When a campus-hiring user lands on the Checklists page, the Campus Hiring checklist automatically opens
- No checklist selection screen is shown

### 4. Hide Navigation Elements
**File:** `components/ChecklistsAndSurveys.tsx`

**Modified:**
- Hidden the "Back to Checklists" arrow button for campus-hiring users
- Hidden the breadcrumb navigation for campus-hiring users
- Users can only interact with the checklist itself

## User Experience

### For Campus Hiring Users:
1. **Access URL:** `http://your-app-url/?EMPID=<employee-id>`
2. **Login Screen:** Enter the campus hiring password (`CampusHire2024!` by default)
3. **Landing:** Immediately see the Campus Hiring psychometric assessment checklist
4. **Interface:** Clean view with only:
   - Header (with logo and sign-out)
   - Campus Hiring checklist title
   - Checklist progress indicator
   - The assessment form

### What They DON'T See:
- ❌ Dashboard tab
- ❌ AI Insights tab
- ❌ Checklists selection screen
- ❌ Back button or breadcrumbs
- ❌ Other department checklists
- ❌ Any analytics or reports

## Password Configuration

The campus hiring password is configured in `config/auth.ts`:

```typescript
'campus-hiring': {
  password: 'CampusHire2024!',
  permissions: ['campus-hiring', 'dashboard'],
  dashboardAccess: ['campus-hiring-dashboard']
}
```

**To change the password:**
1. Edit the `password` field in `config/auth.ts`
2. Rebuild the application: `npm run build`
3. Deploy the updated files

## Testing

### Test Campus Hiring Access:
1. Navigate to: `http://localhost:3001/Prism/?EMPID=test123`
2. Enter password: `CampusHire2024!`
3. Verify:
   - ✅ Immediately see Campus Hiring checklist
   - ✅ No dashboard tabs visible
   - ✅ No back button visible
   - ✅ Can only interact with the assessment
   - ✅ Can sign out using header button

### Compare with Other Roles:
- **Forms Role:** Similar flow, only sees Forms & Surveys checklist
- **Admin Role:** Full access to all dashboards and checklists
- **Campus Hiring Role:** Only sees Campus Hiring assessment

## Technical Details

### Role Hierarchy:
```
campus-hiring role → permissions: ['campus-hiring', 'dashboard']
                  → dashboardAccess: ['campus-hiring-dashboard']
                  → Rendered: Checklist ONLY (no dashboard shown)
```

### Authentication Flow:
```
1. URL with EMPID → Employee validation
2. Login screen → Password check
3. Role detection → campus-hiring
4. App.tsx → Special rendering for campus-hiring
5. ChecklistsAndSurveys → Auto-open campus-hiring checklist
6. Result → Checklist-only view
```

### Session Management:
- Session duration: 24 hours (configurable in `config/auth.ts`)
- Session stored in browser's localStorage
- Auto-logout after session expiration
- Manual logout via header button

## Files Modified

| File | Changes | Lines Modified |
|------|---------|----------------|
| `contexts/AuthContext.tsx` | Added 'campus-hiring' to UserRole type | ~1 |
| `roleMapping.ts` | Added 'campus-hiring' to role interface | ~1 |
| `App.tsx` | Added campus-hiring special rendering | ~20 |
| `components/ChecklistsAndSurveys.tsx` | Auto-open & hide navigation for campus-hiring | ~25 |

## Future Enhancements

Potential improvements for campus hiring experience:
- [ ] Custom welcome message for campus hiring candidates
- [ ] Progress auto-save indicators
- [ ] Completion confirmation screen
- [ ] Email notification on submission
- [ ] Results preview after completion
- [ ] Multi-language support for assessments

## Support

If candidates experience issues:
1. Verify they have a valid EMPID
2. Check the password is correct: `CampusHire2024!`
3. Clear browser cache and cookies
4. Try in incognito/private browsing mode
5. Ensure JavaScript is enabled
6. Check browser console for errors

---

**Note:** This configuration ensures campus hiring candidates have a focused, distraction-free assessment experience without access to operational dashboards or administrative features.
