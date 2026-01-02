# Employee Directory Google Sheets Setup

## Overview
The employee directory has been migrated from Supabase to Google Sheets for easier management and updates.

## Google Sheets Setup

### 1. Create/Prepare Your Sheet
- **Sheet Name**: `EMP. Master` (exact name required)
- **Required Columns**:
  - `Employee_Code` - Unique employee identifier (e.g., H097, H1039)
  - `EmpName` - Full employee name
  - `Date_Of_Joining` - Joining date
  - `Designation` - Job title (Shift Manager, Store Manager, etc.)
  - `Location` - Store location name
  - `Category` - Employee category (Store, etc.)
  - `Store_ID` - Store code (S051, S096, etc.)

### 2. Deploy Google Apps Script

1. Open your Google Sheet containing the "EMP. Master" sheet
2. Go to **Extensions → Apps Script**
3. Delete any existing code
4. Copy the contents of `employee-directory-google-apps-script.js`
5. Paste into the Apps Script editor
6. **Deploy as Web App**:
   - Click **Deploy → New deployment**
   - Select type: **Web app**
   - Description: "Employee Directory API"
   - Execute as: **Me**
   - Who has access: **Anyone** (required for the React app to access)
   - Click **Deploy**
7. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/.../exec`)

### 3. Configure Environment Variable

Add the Google Apps Script URL to your `.env` file:

```env
VITE_EMPLOYEE_DIRECTORY_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Replace `YOUR_SCRIPT_ID` with the actual script ID from step 2.

### 4. Test the Integration

1. Rebuild the application: `npm run build`
2. Restart dev server: `npm run dev`
3. Navigate to SHLP Dashboard
4. Check browser console for logs:
   - `[Employee Directory] Fetching from Google Sheets`
   - `[Employee Directory] Received X employees`
5. The employee filter dropdown should populate with all employees

## Data Structure

### Google Sheets Format (Input)
```
Employee_Code | EmpName           | Date_Of_Joining | Designation            | Location                | Category | Store_ID
H097          | Roopa M K         | 01 Oct 2018     | Shift Manager          | Sakra Hospital          | Store    | S051
H1039         | Gaurav Virendra   | 14 Mar 2022     | Store Manager          | Mahavir Nagar           | Store    | S096
```

### API Response Format
```json
{
  "employees": [
    {
      "employee_code": "H097",
      "empname": "Roopa M K",
      "date_of_joining": "01 Oct 2018",
      "designation": "Shift Manager",
      "location": "Sakra Hospital",
      "category": "Store",
      "store_code": "S051"
    }
  ],
  "count": 2,
  "timestamp": "2026-01-02T14:30:00.000Z"
}
```

### Application Format (Internal)
```typescript
{
  byId: {
    "H097": {
      employee_code: "H097",
      empname: "Roopa M K",
      date_of_joining: "01 Oct 2018",
      designation: "Shift Manager",
      location: "Sakra Hospital",
      category: "Store",
      store_code: "S051"
    }
  },
  nameById: {
    "H097": "Roopa M K"
  }
}
```

## Benefits of Google Sheets

✅ **Easy Updates**: HR can directly update employee data in Google Sheets
✅ **No Database Setup**: No need for Supabase or other database infrastructure
✅ **Version History**: Google Sheets tracks all changes automatically
✅ **Familiar Interface**: HR teams already know how to use Google Sheets
✅ **Real-time Sync**: Changes reflect immediately (after app refresh)
✅ **Access Control**: Manage who can edit the sheet via Google permissions

## Maintenance

### Adding New Employees
1. Open the Google Sheet
2. Add a new row with all required columns filled
3. Data will be available immediately (after app refresh)

### Updating Employee Information
1. Open the Google Sheet
2. Find the employee row
3. Update the necessary columns
4. Changes reflect after app refresh

### Removing Employees
- Option 1: Delete the row (permanent)
- Option 2: Add a "Status" column and mark as "Inactive" (recommended)

## Troubleshooting

### Employee dropdown is empty
1. Check browser console for error messages
2. Verify `VITE_EMPLOYEE_DIRECTORY_URL` is set in `.env`
3. Test the Google Apps Script URL directly in browser
4. Ensure sheet name is exactly "EMP. Master"
5. Check Google Apps Script deployment settings (must be "Anyone" access)

### Data not updating
1. Clear browser cache
2. Refresh the app (Ctrl+R or Cmd+R)
3. Check if Google Sheets API quota is exceeded
4. Verify Apps Script deployment is still active

### Permission errors
1. Redeploy the Google Apps Script
2. Ensure "Who has access" is set to "Anyone"
3. Check if the Google Sheet is accessible

## Migration Notes

### Changes from Supabase
- ✅ Removed Supabase dependency
- ✅ Simplified EmployeeRow type (removed unused fields)
- ✅ Direct Google Sheets integration
- ✅ No authentication required for read-only access
- ✅ Faster initial load (no database connection overhead)

### Backward Compatibility
- Employee codes are normalized to uppercase
- Employee filter dropdown works identically
- SHLP dashboard filtering unchanged
- Excel export includes employee data

## Security Considerations

⚠️ **Important**: The employee data is publicly accessible via the Google Apps Script URL. Do not include sensitive information like:
- Salaries
- Personal phone numbers
- Email addresses
- Government ID numbers
- Performance ratings

Only include operational data needed for dashboard functionality:
- Employee codes
- Names
- Store assignments
- Designations
- Locations

For sensitive data, continue using Supabase with proper authentication.
