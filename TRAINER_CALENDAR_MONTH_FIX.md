# Trainer Calendar Month Fix

## Problem
Events were showing the wrong month because the month was based on the calendar view, not the actual event date.

Example: Clicking November 30 while viewing December saved:
- Date: 2025-11-30
- Month: "December 2025" ❌ (incorrect)

## Solution
Each event now calculates its own month from its actual date.

## Files Updated

### 1. TrainingCalendar.tsx
- Events now include a `month` field derived from the event date
- Location: `components/checklists/TrainingCalendar.tsx`

### 2. google-apps-script-trainer-calendar-dashboard.js
- Script now uses event-specific month instead of payload month
- Location: `google-apps-script-trainer-calendar-dashboard.js`

## Google Apps Script Update

**Script URL:** https://script.google.com/macros/s/AKfycbxqFEJkLugYrNs_UAGNH7ZSqG0W9t8Eljz_bbkLzN8YR9v4RyUAlkCGwZuVojk3Np96yA/exec

**Steps to update:**
1. Go to https://script.google.com/home
2. Find your "Trainer Calendar Dashboard" project
3. Open `Code.gs`
4. Copy the entire contents of `google-apps-script-trainer-calendar-dashboard.js`
5. Replace everything in `Code.gs` with the new code
6. Click "Deploy" → "Manage deployments"
7. Click the edit icon (pencil) next to your active deployment
8. Change "Version" to "New version"
9. Click "Deploy"

## Fixing Existing Data

Your current spreadsheet has 2 entries with incorrect months:
- Row 1 & 2: Date is `2025-11-30` but Month shows "December 2025"

**Option 1: Manual fix**
- Change column D (Month) from "December 2025" to "November 2025" for these rows

**Option 2: Delete and recreate**
- Delete these 2 rows
- Create the events again using the fixed calendar

## Result
✅ Future events will automatically have the correct month
✅ Calendar dashboard will show events in the correct month
✅ No more confusion between viewed month and event month
