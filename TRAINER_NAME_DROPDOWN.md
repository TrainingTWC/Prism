# Trainer Name Dropdown Feature

## Overview
Added a trainer name dropdown to the Training Calendar form, allowing users to select the trainer name for each calendar event individually.

## Changes Made

### 1. TrainingCalendar.tsx Component

#### Added State
```typescript
const [selectedTrainerName, setSelectedTrainerName] = useState('');
```

#### Added Trainer Names List
```typescript
const TRAINER_NAMES = [
    'Kailash',
    'Bhawna',
    'Sunil',
    'Viraj',
    'Priyanka',
    'Sheldon',
    'Mallika',
    'Mahadev',
    'Jagruti',
    'Sxoya'
];
```

#### Updated CalendarEvent Interface
```typescript
interface CalendarEvent {
    id: string;
    date: string;
    type: 'store' | 'outdoor' | 'campus';
    trainerName: string;  // ← NEW FIELD
    storeId?: string;
    storeName?: string;
    campusName?: string;
    task?: string;
    details: string;
}
```

#### Added Dropdown UI
- Positioned at the top of the form, right after the date display
- Styled consistently with the app's design system
- Required field validation before saving events

#### Updated Form Logic
- **Form Reset**: Clears `selectedTrainerName` when resetting the form
- **Validation**: Checks if trainer name is selected before saving event
- **Save Event**: Includes `trainerName` in the new event object
- **Edit Event**: Loads the trainer name when editing an existing event
- **Submit Calendar**: Each event's individual trainer name is sent to Google Sheets

### 2. Google Apps Script

#### Updated Event Processing
```javascript
// Use trainer name from the event if available, otherwise fall back to payload trainer name
const eventTrainerName = event.trainerName || trainerName;
Logger.log('  Trainer name for this event: ' + eventTrainerName);

sheet.appendRow([
    timestamp,
    trainerId,
    eventTrainerName,  // ← Uses event-specific trainer name
    month,
    event.date,
    event.type,
    event.location || '',
    event.task || '',
    event.details || '',
    region,
    storeName
]);
```

## How It Works

### User Flow
1. User selects a date on the calendar
2. **NEW**: User selects a trainer name from the dropdown
3. User selects event type (Store/Campus/Outdoor)
4. User fills in location, task, and details
5. User clicks "Add Event"
6. Event is saved with the selected trainer name

### Data Flow
1. **Frontend**: Each event stores its own `trainerName` field
2. **Submission**: Events are sent to Google Apps Script with individual trainer names
3. **Backend**: Script uses each event's specific `trainerName` when writing to sheet
4. **Dashboard**: Trainer name is displayed and can be filtered per event

## Benefits

1. **Flexibility**: Different events on the same calendar can be assigned to different trainers
2. **Multi-trainer Support**: Supports scenarios where multiple trainers share calendar management
3. **Accurate Attribution**: Each training event is properly attributed to the correct trainer
4. **Better Filtering**: Dashboard can filter by specific trainer names per event

## Validation

- Trainer name is **required** before saving an event
- Alert shown if user tries to save without selecting a trainer
- Form reset clears the trainer selection

## Next Steps (Optional Enhancements)

1. **Dynamic Trainer List**: Load trainer names from a configuration file or Google Sheet
2. **Trainer Auto-fill**: Pre-select the logged-in user's name if trainerId matches
3. **Multi-select**: Allow assigning multiple trainers to a single event
4. **Trainer Availability**: Show trainer availability when selecting dates
5. **Trainer Statistics**: Dashboard showing event count per trainer

## Testing Checklist

- [ ] Dropdown displays all 10 trainer names
- [ ] Validation prevents saving without trainer name selection
- [ ] Event saves with correct trainer name
- [ ] Edit event loads the trainer name correctly
- [ ] Form reset clears trainer name
- [ ] Calendar submission sends individual trainer names
- [ ] Google Sheet shows correct trainer name per event
- [ ] Dashboard displays and filters trainer names correctly
