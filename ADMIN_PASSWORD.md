# Admin Access Configuration

## Admin Tab Password

To see the **Admin** tab in the dashboard, users must log in with the **Editor** password.

### Editor Password (Full Admin Access)
```
Editornotcreator2025!
```

### Admin Password (View-Only Access)
```
AdminView2024!
```

## How It Works

1. **EMPID Validation**: User accesses with valid EMPID in URL
   - Example: `?EMPID=h541`
   - Shows login page with employee name
3. **Admin Tab Visibility**
   - Only visible when `userRole === 'editor'`
   - Admin and other roles will NOT see the Admin tab

## All Role Passwords (from config/auth.ts)

| Role | Password | Admin Tab? | Access Level |
|------|----------|------------|--------------|
| Operations | `OpsAccess2024!` | ❌ No | Operations dashboards only |
| HR | `HRConnect2024!` | ❌ No | HR dashboards only |
| QA | `QualityCheck2024!` | ❌ No | QA dashboards only |
| Training | `TrainingHub2024!` | ❌ No | Training dashboards only |
| Finance | `FinanceSecure2024!` | ❌ No | Finance dashboards only |
| **Admin** | `AdminView2024!` | ❌ No | All dashboards (view-only) |
| **Editor** | `Editornotcreator2025!` | ✅ **Yes** | Full access + configuration |
| Operations | `OpsAccess2024!` | ❌ No |
| HR | `HRConnect2024!` | ❌ No |
| QA | `QualityCheck2024!` | ❌ No |
| Training | `TrainingHub2024!` | ❌ No |
| Finance | `FinanceSecure2024!` | ❌ No |
| **Admin** | `Editornotcreator2025!` | ✅ **Yes** |

## Test Flow

### Without Admin Password
```
1. Visit: http://localhost:3000/Prism/?EMPID=h541
2. Enter password: TrainingHub2024!
3. Result: See Dashboard + Checklists tabs only (NO Admin tab)
```
### With Admin Password (View-Only)
```
1. Visit: http://localhost:3000/Prism/?EMPID=h541
2. Enter password: AdminView2024!
3. Result: See Dashboard + Checklists tabs (NO Admin tab)
```

### With Editor Password (Full Access)
```
1. Visit: http://localhost:3000/Prism/?EMPID=h541
2. Enter password: Editornotcreator2025!
3. Result: See Dashboard + Checklists + Admin tabs
```Result: See Dashboard + Checklists + Admin tabs
```

## Session Management

### 24-Hour Persistent Sessions
- Sessions are stored in **localStorage** (persists across browser restarts)
- Session duration: **24 hours** from login
- After 24 hours, user must re-enter password
- Closing browser does NOT logout user
- Session includes:
  - Employee validation status
  - User role (admin, training, hr, etc.)
  - Authentication timestamp

### Session Behavior
1. **First visit with EMPID**: Validates employee → Shows login
2. **Enter password**: Creates 24-hour session
3. **Return within 24 hours**: Automatically logged in (no re-auth needed)
4. **After 24 hours**: Session expired, must re-enter password

## Role Differences

### Admin Role
- **Access**: View all dashboards and reports
- **Permissions**: Read-only access to all data
- **Admin Tab**: ❌ Cannot configure system
- **Use Case**: Senior management who need visibility but not configuration rights

### Editor Role
- **Access**: Full system access
- **Permissions**: Configure checklists, audit details, mappings
- **Admin Tab**: ✅ Full configuration rights
- **Use Case**: System administrators and technical team

## Security Notes

- All passwords are stored in `config/auth.ts`
- Session lasts 24 hours (configurable in `AUTH_CONFIG.sessionDuration`)
- EMPID must be valid in `employee_data.json`
- Both EMPID validation AND role password required for access
- Sessions persist in localStorage (survives browser restart)
- Editor password should be kept highly confidential

## Security Notes

- Admin password is stored in `config/auth.ts`
- Session lasts 24 hours (configurable in `AUTH_CONFIG.sessionDuration`)
- EMPID must be valid in `employee_data.json`
- Both EMPID validation AND admin password required for admin access
- Sessions persist in localStorage (survives browser restart)
