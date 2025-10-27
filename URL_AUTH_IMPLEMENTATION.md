# URL-Based Employee Authentication

## Overview
The app now validates users via `EMPID` URL parameter against `employee_data.json`. Only valid employees can access the app.

## Implementation

### Authentication Flow
1. User accesses URL with EMPID: `https://trainingtwc.github.io/Prism/?EMPID=h541`
2. App extracts `EMPID` from URL query string
3. Validates against `/public/employee_data.json` (case-insensitive)
4. **Valid employee** → Logs in with admin privileges, shows normal UI
5. **Invalid/missing EMPID** → Shows dramatic ACCESS DENIED screen

### Modified Files

#### `contexts/AuthContext.tsx`
- Added `employeeData` state and `Employee` interface
- Added `loginWithEmpId(empId: string)` method
- Validates EMPID against employee_data.json
- Stores employee data in sessionStorage
- Auto-assigns admin role to valid employees

#### `App.tsx`
- Imported `AccessDenied` component
- Added URL EMPID check on mount
- Calls `loginWithEmpId()` with URL parameter
- Shows `<AccessDenied />` if validation fails
- Shows `<AccessDenied />` if no EMPID in URL

#### `components/AccessDenied.tsx` (NEW)
- Dramatic red/black gradient UI
- Warning icon with pulsing glow
- Custom message: "The firewall just whispered your name to the admin. Good luck..."
- Hover glitch animation effect
- Centered, responsive design

## Testing

### Valid Employee (Should Grant Access)
```
http://localhost:3000/Prism/?EMPID=h541
```
- Employee: Amritanshu Prasad
- Should: Load app normally with admin access

### Invalid Employee (Should Show Access Denied)
```
http://localhost:3000/Prism/?EMPID=invalid123
```
- Should: Show dramatic access denied screen

### No EMPID Parameter (Should Show Access Denied)
```
http://localhost:3000/Prism/
```
- Should: Show dramatic access denied screen

## LMS Integration

Your LMS can now generate links with the EMPID variable:
```
https://trainingtwc.github.io/Prism/?EMPID={employee_code}&serv={lms_url}
```

The `serv` parameter is preserved for LMS tracking but not used for authentication.

## Security Notes

1. **Case-insensitive matching**: h541, H541, H541 all work
2. **Session persistence**: Valid login stored in sessionStorage (survives page refresh)
3. **Immediate validation**: No bypass - checks on every app load
4. **Employee-only access**: Only codes in employee_data.json are allowed
5. **No password required**: EMPID alone grants access (assumes LMS link is secure/authenticated)

## Future Enhancements (Optional)

If you need stronger security:
- Add HMAC-signed token alongside EMPID
- Add expiry timestamp to prevent link reuse
- Add IP whitelisting
- Add LMS server-to-server validation
