# Audit Details Per Checklist - Implementation Guide

## Overview
The Audit Details system has been restructured to support **checklist-specific audit information fields**. Each checklist type (Training, Operations, HR, QA, Finance) now has its own set of configurable audit detail fields.

## Structure

### Config.json Format
```json
{
  "AUDIT_DETAILS": {
    "TRAINING": [
      { "id": "AREA_MANAGER", "label": "Area Manager", "type": "text", "required": true },
      { "id": "TRAINER", "label": "Trainer (Auditor)", "type": "text", "required": true },
      { "id": "STORE_LOCATION", "label": "Store Location", "type": "text", "required": true },
      { "id": "MOD", "label": "MOD (Manager on Duty)", "type": "text", "required": false }
    ],
    "OPERATIONS": [
      { "id": "HR_NAME", "label": "HR Name:", "type": "dropdown", "source": "HR_PERSONNEL" },
      { "id": "AREA_MANAGER", "label": "Area Manager:", "type": "dropdown", "source": "AREA_MANAGERS" },
      // ... more fields
    ],
    "HR": [ /* ... */ ],
    "QA": [ /* ... */ ],
    "FINANCE": [ /* ... */ ]
  }
}
```

## Default Field Configurations

### 1. TRAINING Audit Details
Based on the Training Audit Checklist interface:
- **Area Manager** - Text input, required
- **Trainer (Auditor)** - Text input, required (auto-filled from login)
- **Store Location** - Text input, required
- **MOD (Manager on Duty)** - Text input, optional

### 2. OPERATIONS Audit Details  
Based on the AM Operations Checklist interface:
- **HR Name** - Dropdown from HR_PERSONNEL, required
- **Area Manager** - Dropdown from AREA_MANAGERS, required
- **Trainer Name** - Dropdown from TRAINERS, required
- **Store** - Dropdown from STORES, required
- **BSC Achievement %** - Number input, optional
- **No. of people on shift** - Number input, optional
- **Man power fulfilment** - Dropdown (High/Med/Low), optional
- **Café Type** - Dropdown (REGULAR/PREMIUM/PREMIUM+), optional
- **Store Type** - Dropdown (Mall/Highstreet/Hospital/etc), optional
- **Concept** - Dropdown (Experience/Premium/Kiosk), optional

### 3. HR Audit Details
Based on the HR Employee Satisfaction Survey interface:
- **HR Name** - Dropdown from HR_PERSONNEL, required
- **Area Manager** - Text input, optional (read-only display)
- **Employee Name** - Text input, required
- **Employee ID** - Text input, required
- **Store Location** - Dropdown from STORES, required

### 4. QA Audit Details
Based on the Quality Assurance Assessment interface:
- **QA Auditor Name** - Text input, required
- **QA Auditor ID** - Text input, required
- **Area Manager** - Dropdown from AREA_MANAGERS, required
- **Store** - Dropdown from STORES, required

### 5. FINANCE Audit Details
Based on the Financial Controls Assessment interface:
- **Finance Auditor Name** - Text input, required
- **Finance Auditor ID** - Text input, required
- **Area Manager** - Dropdown from AREA_MANAGERS, required
- **Store** - Dropdown from STORES, required

## Admin UI Features

### Tabbed Interface
The Audit Details tab in Admin now shows 5 sub-tabs:
- **TRAINING Audit Details**
- **OPERATIONS Audit Details**
- **HR Audit Details**
- **QA Audit Details**
- **FINANCE Audit Details**

### Per-Checklist Configuration
Each tab allows administrators to:
1. ✅ **View** all audit fields for that specific checklist
2. ✅ **Add** new fields with custom properties
3. ✅ **Edit** existing fields (label, type, required status)
4. ✅ **Delete** fields that are no longer needed
5. ✅ **Reorder** fields using up/down arrows
6. ✅ **Configure** field types:
   - Text input
   - Textarea
   - Dropdown (with custom choices or data sources)
   - Date picker
   - Time picker
   - Number input

### Field Properties
Each field can be configured with:
- **Field ID** - Unique identifier (e.g., `AREA_MANAGER`)
- **Display Label** - User-facing text (e.g., "Area Manager:")
- **Type** - Input type (text, dropdown, date, etc.)
- **Required** - Whether the field is mandatory
- **Source** - For dropdowns, data source (STORES, AREA_MANAGERS, etc.)
- **Choices** - For dropdowns, custom options array

## Data Sources Available

The following data sources can be used for dropdown fields:

| Source | Description | Example Values |
|--------|-------------|----------------|
| `STORES` | All store locations | Koramangala, HSR-1, etc. |
| `AREA_MANAGERS` | All Area Managers | Amar (H535), Atul (H2396), etc. |
| `HR_PERSONNEL` | All HR staff | Sarit (H2081), Monica (H2165), etc. |
| `TRAINERS` | All Trainers | Mahadev (H1761), Sheldon (H1697), etc. |
| `REGIONS` | Geographic regions | North, South, West, East |
| `EMPLOYEE_LIST` | **Complete employee directory** | **750+ employees from employee_data.json** |

**NEW:** The `EMPLOYEE_LIST` source provides access to all employees across the organization (see `EMPLOYEE_LIST_DATA_SOURCE.md` for details).

Or use **custom choices** for static lists like:
- `["High", "Med", "Low"]`
- `["REGULAR", "PREMIUM", "PREMIUM+"]`
- `["Mall", "Highstreet", "Hospital", "Corporate", "Airport", "Highway"]`

## Usage in Checklist Components

When rendering a checklist, the component will:
1. Detect which checklist type it is (e.g., TRAINING)
2. Load `config.AUDIT_DETAILS.TRAINING`
3. Render those specific fields at the top of the form
4. Validate required fields before submission

Example:
```tsx
const checklistType = 'TRAINING';
const auditFields = config?.AUDIT_DETAILS?.[checklistType] || [];

// Render audit info section
{auditFields.map(field => (
  <FormField key={field.id} {...field} />
))}
```

## Migration Notes

**Previous Structure:**
```json
{
  "AUDIT_DETAILS": {
    "fields": [/* single array for all checklists */]
  }
}
```

**New Structure:**
```json
{
  "AUDIT_DETAILS": {
    "TRAINING": [/* fields */],
    "OPERATIONS": [/* fields */],
    "HR": [/* fields */],
    "QA": [/* fields */],
    "FINANCE": [/* fields */]
  }
}
```

## Benefits

1. **Flexibility** - Each checklist can have unique fields matching its specific requirements
2. **Clarity** - Admins see only relevant fields when configuring each checklist type
3. **Consistency** - Field configurations match the actual survey/checklist interfaces
4. **Maintainability** - Changes to one checklist don't affect others
5. **Scalability** - Easy to add new checklist types with their own audit details

## Example Customizations

### Add a Custom Field to Training
1. Go to Admin → Audit Details
2. Click "TRAINING Audit Details" tab
3. Click "+ Add New Audit Field"
4. Configure:
   - ID: `ATTENDANCE_COUNT`
   - Label: `Number of Attendees`
   - Type: `number`
   - Required: `false`
5. Click "Save All Changes"

### Change Operations Field to Dropdown
1. Go to "OPERATIONS Audit Details" tab
2. Find the field you want to modify
3. Change Type from `text` to `dropdown`
4. Select Source (e.g., `STORES`) or add custom Choices
5. Save changes

## Future Enhancements

Potential additions:
- Field validation rules (min/max for numbers, regex for text)
- Conditional fields (show field X only if field Y has value Z)
- Field dependencies (auto-populate field based on another field's value)
- Field groups/sections for complex audit forms
- Import/export audit field templates
