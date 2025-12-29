# Supabase Integration Complete ✅

Your Prism dashboard now uses **Supabase** as the primary data source for employees (with automatic fallback to the JSON file if Supabase isn't configured).

## What Changed

### 1. **Employee Data Source**
- **Before**: Loaded from `/public/employee_data.json`
- **After**: Fetches from Supabase `employee_master` table (falls back to JSON if not configured)

### 2. **Files Modified**
- [services/employeeDirectoryService.ts](services/employeeDirectoryService.ts) - Extended to support store, designation, tenure fields
- [contexts/AuthContext.tsx](contexts/AuthContext.tsx) - Employee validation now uses Supabase first
- [components/AdminConfig.tsx](components/AdminConfig.tsx) - Role mapping editor uses Supabase employee directory

### 3. **New Files Created**
- [supabase_employee_setup.sql](supabase_employee_setup.sql) - SQL to create the table + RLS policies
- [import_employees_to_supabase.js](import_employees_to_supabase.js) - Script to bulk-import existing JSON data

---

## Setup Steps (Complete These Now)

### Step 1: Create the Supabase Table

1. Open **Supabase Dashboard** → SQL Editor → New Query
2. Copy/paste the contents of [supabase_employee_setup.sql](supabase_employee_setup.sql)
3. Click **Run** to create the `employee_master` table

### Step 2: Import Your Existing Employee Data

**Option A: Use the Import Script (Recommended for 100+ employees)**
```bash
npm install @supabase/supabase-js
node import_employees_to_supabase.js
```
⚠️ **Before running**: Edit the script and add your `service_role` key from Supabase Dashboard → Settings → API

**Option B: Manual CSV Import (Good for small datasets)**
1. Convert `employee_data.json` to CSV
2. Supabase Dashboard → Table Editor → employee_master → Insert → Import CSV

**Option C: Manual SQL Inserts (For < 20 employees)**
```sql
INSERT INTO employee_master (
  employee_code, empname, employee_status
) VALUES
  ('h012', 'Debabrata Das', 'Existing'),
  ('h081', 'Santhosh B', 'Existing');
```

### Step 3: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

The app will automatically detect the Supabase credentials from [.env](.env) and start using the database!

---

## Database Schema

The `employee_master` table includes these columns:

| Column | Type | Description |
|--------|------|-------------|
| `employee_code` | TEXT (unique) | Employee ID (e.g., h012, h1234) |
| `empname` | TEXT | Full name |
| `employee_status` | TEXT | "Existing", "Inactive", etc. |
| `region` | TEXT | Geographic region |
| `location` | TEXT | Office/store location |
| `city` | TEXT | City name |
| `state` | TEXT | State name |
| `store_code` | TEXT | Store identifier |
| `designation` | TEXT | Job title/role |
| `tenure` | TEXT | Time at company |
| `official_email` | TEXT | Work email |
| `join_date` | DATE | Start date |

---

## How It Works

### Authentication Flow
1. User visits with `?EMPID=h012`
2. App checks Supabase for employee_code = 'h012'
3. If found: Uses name from database
4. If not found in Supabase: Falls back to JSON file
5. If not in JSON: Shows generic "Employee h012"

### Data Loading
- **useEmployeeDirectory hook**: Automatically loads all `employee_status = 'Existing'` employees on app load
- **Caching**: Employee list is cached in memory after first fetch
- **Performance**: Indexed lookups by employee_code are fast

### Security (Row Level Security)
- **Anonymous users** (browser): Can only SELECT where `employee_status = 'Existing'`
- **Authenticated users**: Can read all employees (optional policy - currently commented out)
- **Admin operations**: Use `service_role` key to bypass RLS for inserts/updates

---

## Testing

### Verify Supabase Connection
1. Open browser console (F12)
2. Look for logs: `[Auth] Fetching employee from Supabase...`
3. Should see: `[Auth] ✅ Found employee in Supabase: {code, name}`

### Test Employee Lookup
```sql
-- Run in Supabase SQL Editor
SELECT employee_code, empname, designation, store_code
FROM employee_master
WHERE employee_status = 'Existing'
LIMIT 10;
```

### Check RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'employee_master';
```

---

## Adding More Employee Fields

Need to track more data (phone, department, salary band)?

1. **Add column to Supabase**:
   ```sql
   ALTER TABLE employee_master ADD COLUMN department TEXT;
   ```

2. **Update the type** in [services/employeeDirectoryService.ts](services/employeeDirectoryService.ts):
   ```typescript
   export type EmployeeRow = {
     // ... existing fields
     department?: string | null;
   };
   ```

3. **Update the SELECT** in same file:
   ```typescript
   .select('employee_code, empname, ..., department')
   ```

---

## Fallback Behavior

The app gracefully handles missing Supabase:
- ✅ **Supabase configured + has data**: Uses Supabase
- ⚠️ **Supabase configured but empty**: Falls back to JSON
- ⚠️ **Supabase not configured**: Uses JSON file
- ❌ **Neither available**: Shows generic employee names

This ensures the app works even during Supabase downtime!

---

## Next Steps (Optional Enhancements)

1. **Sync submissions to Supabase**: Store assessment responses, not just employee data
2. **Real-time updates**: Use Supabase realtime subscriptions for live employee changes
3. **Admin panel**: Add UI to manage employees directly in the app
4. **Authentication**: Use Supabase Auth for password-based login
5. **File uploads**: Store employee photos/documents in Supabase Storage

---

## Troubleshooting

### "No employees loading"
- Check [.env](.env) has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Verify RLS policy allows SELECT for anonymous users
- Run test query in Supabase SQL Editor

### "RLS policy error"
- Temporarily disable RLS: `ALTER TABLE employee_master DISABLE ROW LEVEL SECURITY;`
- Test if data loads
- Re-enable and fix policy

### "Employee not found"
- Check `employee_code` matches exactly (case-insensitive in app but case-sensitive in DB)
- Verify `employee_status = 'Existing'`
- Check if employee exists: `SELECT * FROM employee_master WHERE employee_code = 'h012';`

---

## Questions?

- Supabase Docs: https://supabase.com/docs
- Your table: Supabase Dashboard → Table Editor → employee_master
- SQL Editor: Supabase Dashboard → SQL Editor

**Your Supabase database is now the single source of truth for employee data!** 🎉
