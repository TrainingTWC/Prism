# Employee Data Integration

## Overview
The application now uses a centralized employee data source (`employee_data.json`) to display employee names alongside their IDs throughout the system.

## Data Source
**File**: `/public/employee_data.json`

This JSON file contains the complete employee directory with the following structure:
```json
[
  {"code": "h012", "name": "Debabrata Das"},
  {"code": "h535", "name": "Amar Debnath"},
  {"code": "h1350", "name": "Vishu Kumar"},
  {"code": "h2396", "name": "Atul Inderyas"}
  ...
]
```

## Where It's Used

### 1. Role Mapping Table (Admin Config)
- Displays employee names for all personnel columns:
  - **HRBP** (Purple) - varies by store
  - **Trainer** (Green) - varies by store
  - **AM** (Blue) - varies by store
  - **E-Learning Specialist** (Orange) - H541 (Amritanshu Prasad)
  - **Training Head** (Indigo) - H3237 (Karamjit Shemar)
  - **HR Head** (Pink) - H2081 (Swapna Sarit Padhi)
- Format: ID (colored, bold) on top, name (gray, small) below
- Example: 
  - **H2396** (blue)
  - *Atul Inderyas* (gray)

### 2. Future Uses
This data source can be extended to:
- MOD name dropdowns in audit forms
- Employee selection fields
- Reports and analytics
- User profile displays

## Case-Insensitive Matching
The system supports flexible ID matching:
- IDs in uppercase: `H1350`, `H2396`
- IDs in lowercase: `h1350`, `h2396`
- Mixed case: `h1350`, `H1350`

All formats will correctly resolve to the employee name.

## Updating Employee Data

### Adding New Employees
1. Open `/public/employee_data.json`
2. Add a new entry:
```json
{"code": "h9999", "name": "New Employee Name"}
```
3. Save the file
4. Refresh the application (no rebuild required)

### Updating Names
1. Find the employee code in `employee_data.json`
2. Update the name field
3. Save the file
4. Refresh the application

### Example Updates Made
- **H1350**: Updated from "Vinaykumar" to "Vishu Kumar"
- **H2396**: Confirmed as "Atul Inderyas"
- **H541**: Amritanshu Prasad (E-Learning Specialist for all stores)
- **H3237**: Karamjit Shemar (Training Head for all stores)
- **H2081**: Swapna Sarit Padhi (HR Head for all stores)

## Technical Implementation

### Loading in AdminConfig
```typescript
const [employeeData, setEmployeeData] = useState<Record<string, string>>({});

React.useEffect(() => {
  fetch('/Prism/employee_data.json')
    .then(res => res.json())
    .then((data: Array<{code: string, name: string}>) => {
      const mapping: Record<string, string> = {};
      data.forEach(emp => {
        mapping[emp.code.toUpperCase()] = emp.name;
        mapping[emp.code.toLowerCase()] = emp.name;
      });
      setEmployeeData(mapping);
    });
}, []);
```

### Display Helper
```typescript
const getPersonnelDisplay = (id: string) => {
  if (!id) return '';
  const name = employeeData[id] || employeeData[id.toUpperCase()] || employeeData[id.toLowerCase()];
  return name ? `${id} - ${name}` : id;
};
```

### In Table Cells
```tsx
<div className="flex flex-col">
  <span className="font-mono text-purple-600 font-semibold">{store['HRBP']}</span>
  {employeeData[store['HRBP']] && (
    <span className="text-xs text-gray-500">{employeeData[store['HRBP']]}</span>
  )}
</div>
```

## Benefits
1. **Single Source of Truth**: One file contains all employee data
2. **Easy Updates**: Change names in one place, reflects everywhere
3. **No Code Changes**: Update JSON file without rebuilding
4. **Scalable**: Can add thousands of employees
5. **Flexible**: Case-insensitive matching handles data inconsistencies

## Maintenance
- Source data from: `Emp. Name and id.csv` (provided by HR)
- Update frequency: As needed when new employees join or names change
- Backup: Keep a copy of the CSV file for reference
