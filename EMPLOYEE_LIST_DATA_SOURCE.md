# Employee List Data Source

## Overview
The "Emp. List" data source has been added to the Audit Details editor, allowing administrators to configure dropdown fields that pull from the complete employee directory.

## Data Source

**File:** `public/employee_data.json`

**Source CSV:** `Emp. Name and id.csv` (750+ employees)

**Structure:**
```json
[
  {
    "code": "H541",
    "name": "Amritanshu Prasad"
  },
  {
    "code": "H3237",
    "name": "Karam Pal Singh"
  },
  ...
]
```

## Configuration

### In Admin → Audit Details

When creating or editing an audit field:

1. **Field Type:** Select "dropdown"
2. **Data Source:** Select "Emp. List"
3. **Required:** Check if mandatory

Example configuration:
```json
{
  "id": "EMPLOYEE_NAME",
  "label": "Employee Name",
  "type": "dropdown",
  "required": true,
  "source": "EMPLOYEE_LIST"
}
```

## Available Data Sources

| Source Value | Display Name | Data File | Use Case |
|--------------|--------------|-----------|----------|
| `STORES` | Stores List | `comprehensive_store_mapping.json` | Store selection |
| `AREA_MANAGERS` | Area Managers | `config.json` → AREA_MANAGERS | AM selection |
| `HR_PERSONNEL` | HR Personnel | `config.json` → HR_PERSONNEL | HR selection |
| `REGIONS` | Regions | Derived from stores | Region filtering |
| `EMPLOYEE_LIST` | **Emp. List** | **`employee_data.json`** | **Any employee selection** |
| *(empty)* | Custom Choices | Manual comma-separated | Custom options |

## Implementation in Checklists

When a checklist component renders an audit field with `source: "EMPLOYEE_LIST"`, it should:

1. Load `employee_data.json`
2. Display employees in format: `{code} - {name}`
3. Allow search/filter by both code and name
4. Store selected value as employee code (e.g., "H541")

### Example Rendering Logic

```typescript
// Load employee data
const [employees, setEmployees] = useState<Array<{code: string, name: string}>>([]);

useEffect(() => {
  fetch('/Prism/employee_data.json')
    .then(res => res.json())
    .then(data => setEmployees(data));
}, []);

// Render dropdown
{field.source === 'EMPLOYEE_LIST' && (
  <select>
    <option value="">Select Employee</option>
    {employees.map(emp => (
      <option key={emp.code} value={emp.code}>
        {emp.code} - {emp.name}
      </option>
    ))}
  </select>
)}
```

## Benefits

✅ **Centralized Data:** All employee records in one place  
✅ **Auto-complete Ready:** Easy to add search/filter functionality  
✅ **Consistent IDs:** Uses standard H-codes across system  
✅ **Up-to-date:** Single source of truth for employee directory  
✅ **Scalable:** Handles 750+ employees efficiently

## Use Cases

- **HR Audits:** Employee being audited
- **Training:** Trainee selection
- **Operations:** Staff on duty
- **Performance Reviews:** Employee identification
- **Any form requiring employee selection**

## Updating Employee Data

To update the employee list:

1. Export fresh data to CSV with columns: `Emp. Code`, `Emp. Name`
2. Convert to JSON format:
   ```powershell
   $csv = Import-Csv "Emp. Name and id.csv"
   $json = $csv | ForEach-Object {
     @{
       code = $_.'Emp. Code'
       name = $_.'Emp. Name'
     }
   }
   $json | ConvertTo-Json -Depth 3 | Out-File "public/employee_data.json"
   ```
3. Restart the application to pick up changes

## Related Files

- `public/employee_data.json` - Employee directory
- `components/AdminConfig.tsx` - Audit Details editor (line ~915)
- `server/data/config.json` - Stores audit field configurations
