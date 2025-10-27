# Role System Update: Editor vs Admin

## Summary of Changes

### New Role Structure

```
Editor (NEW) → Full Access + Admin Tab
Admin (MODIFIED) → View-All Access (NO Admin Tab)
```

## Password Changes

| Role | Old Password | New Password | Admin Tab |
|------|--------------|--------------|-----------|
| Editor (NEW) | N/A | `Editornotcreator2025!` | ✅ Yes |
| Admin | `Editornotcreator2025!` | `AdminView2024!` | ❌ No |

## Role Comparison

### 🔧 Editor Role (NEW)
- **Password**: `Editornotcreator2025!`
- **Permissions**: Full system access + configuration
- **Admin Tab**: ✅ **YES** - Can edit checklists, audit details, mappings
- **Purpose**: System administrators and configuration managers
- **Access**: Everything (create, read, update, delete)

### 👁️ Admin Role (MODIFIED)
- **Password**: `AdminView2024!` (changed from previous)
- **Permissions**: View all dashboards and data
- **Admin Tab**: ❌ **NO** - Cannot configure system
- **Purpose**: Senior management, observers, auditors
- **Access**: Read-only across all departments

### Other Roles (Unchanged)
- **Operations**: `OpsAccess2024!` - Operations dashboards only
- **HR**: `HRConnect2024!` - HR dashboards only
- **QA**: `QualityCheck2024!` - QA dashboards only
- **Training**: `TrainingHub2024!` - Training dashboards only
- **Finance**: `FinanceSecure2024!` - Finance dashboards only

## Use Cases

### When to use Editor
```
✅ Need to add/edit checklists
✅ Need to configure audit details
✅ Need to update role mappings
✅ Need to manage system settings
✅ IT/Technical team members
```

### When to use Admin
```
✅ Need to view all department data
✅ Need dashboard access across all areas
✅ Don't need to modify configuration
✅ Senior management oversight
✅ Cross-departmental reporting
```

## Testing

### Test Editor Access
```bash
URL: http://localhost:3000/Prism/?EMPID=h541
Password: Editornotcreator2025!
Expected: Dashboard + Checklists + Admin tabs visible
```

### Test Admin Access (View-Only)
```bash
URL: http://localhost:3000/Prism/?EMPID=h541
Password: AdminView2024!
Expected: Dashboard + Checklists tabs (NO Admin tab)
```

### Test Regular Role
```bash
URL: http://localhost:3000/Prism/?EMPID=h541
Password: TrainingHub2024!
Expected: Dashboard + Checklists tabs (NO Admin tab)
```

## Migration Notes

### For Existing Users

**If you were previously using "Admin" password:**
- Old: `Editornotcreator2025!` gave admin access
- **New**: Use `Editornotcreator2025!` for **Editor** role (same password, different role name)
- Or use `AdminView2024!` for view-only admin access

### Security Recommendations

1. **Editor Password** (`Editornotcreator2025!`)
   - Share only with authorized configuration managers
   - This is the most powerful role
   - Change password if compromised

2. **Admin Password** (`AdminView2024!`)
   - Share with senior management and auditors
   - Provides visibility without modification rights
   - Safer for non-technical users

## Technical Changes

### Files Modified
1. `config/auth.ts`
   - Added `editor` role with full permissions
   - Modified `admin` role (removed 'admin' permission)
   - Updated password for admin role

2. `contexts/AuthContext.tsx`
   - Added `'editor'` to UserRole type

3. `App.tsx`
   - Changed Admin tab check from `authUserRole === 'admin'` to `authUserRole === 'editor'`

4. `components/Login.tsx`
   - Added editor role to roleConfig with full permissions
   - Updated admin role description

5. `ADMIN_PASSWORD.md`
   - Updated documentation with new role structure

## FAQ

**Q: Who should have the Editor password?**
A: Only IT administrators and authorized configuration managers.

**Q: Can Admin users edit checklists?**
A: No, Admin role is view-only. Use Editor role for configuration.

**Q: What if I forget which password is which?**
A: Check `config/auth.ts` or this document for the current passwords.

**Q: Can I have both Editor and Admin access?**
A: You can log in with either password, but you'll have one role per session.

**Q: Is the old admin password still valid?**
A: Yes! The password `Editornotcreator2025!` now logs you in as **Editor** (full access).
