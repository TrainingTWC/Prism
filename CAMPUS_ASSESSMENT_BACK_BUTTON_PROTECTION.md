# Campus Hire Assessment - Back Button Protection

## Overview
Added comprehensive protection against accidental navigation during the campus hiring assessment, preventing loss of progress when users press back button or swipe back on mobile devices.

## Features Implemented

### 1. **Browser Back Button Warning**
- Intercepts browser back button navigation
- Shows confirmation dialog warning about data loss
- Allows user to cancel navigation and stay on assessment
- If user confirms leaving, clears saved draft data

```
⚠️ WARNING: Going back will reset your assessment!

All your answers will be lost and you will need to start over.

Are you sure you want to leave?
```

### 2. **Page Refresh/Close Warning**
- Prevents accidental page close or refresh
- Shows browser's native confirmation dialog
- Standard browser message: "Your assessment progress will be lost if you leave this page. Are you sure?"

### 3. **Auto-Save Draft System**
- Automatically saves answers to browser localStorage
- Saves every time user answers a question
- Includes candidate information and timestamp
- Visual indicator shows "Auto-saved" when data is saved
- Draft expires after 1 hour for security

### 4. **Draft Recovery**
- On page load, checks for incomplete assessment
- Offers to restore previous session if found
- Only restores drafts less than 1 hour old
- Smart recovery: doesn't override auto-loaded candidate data

```
📝 Found an incomplete assessment from your previous session.

Would you like to restore your answers?
```

### 5. **Visual Indicators**
- **Auto-save indicator**: Green badge appears briefly after each save
- **Timer display**: Shows remaining time prominently
- **Warning notice**: Added to rules page about back button usage

### 6. **User Education**
Added clear warning in the rules section:
> ⚠️ **Do Not Press Back Button**
> 
> Using the browser back button or swiping back will trigger a warning as it may reset your progress. Your answers are auto-saved, but stay on this page to avoid disruption.

## Technical Implementation

### Event Listeners
1. **`popstate` event**: Detects browser back/forward button
2. **`beforeunload` event**: Detects page refresh/close attempts

### LocalStorage Schema
```typescript
{
  answers: Record<string, string>,
  candidateName: string,
  candidatePhone: string,
  candidateEmail: string,
  campusName: string,
  timestamp: string (ISO format)
}
```

### Cleanup
- Draft cleared on successful submission
- Draft cleared if user confirms leaving
- Old drafts (>1 hour) automatically removed

## User Experience Flow

### Scenario 1: Accidental Back Button Press
1. User presses browser back button
2. System shows warning dialog
3. User clicks "Cancel" → stays on assessment, no data lost
4. User clicks "OK" → navigates away, draft cleared

### Scenario 2: Browser Crash or Accidental Close
1. User accidentally closes browser/tab
2. User reopens assessment link
3. System detects incomplete draft
4. User clicks "Yes" → all answers restored
5. User clicks "No" → starts fresh, draft cleared

### Scenario 3: Mobile Swipe Back Gesture
1. User swipes back on mobile device
2. Triggers `popstate` event (same as back button)
3. Shows warning dialog
4. User can cancel or confirm

## Benefits

✅ **Prevents Data Loss**: Answers preserved even if user navigates away accidentally  
✅ **User-Friendly**: Clear warnings with option to cancel  
✅ **Secure**: Drafts expire after 1 hour  
✅ **Visual Feedback**: Auto-save indicator confirms progress is saved  
✅ **Mobile Compatible**: Works with swipe gestures on mobile browsers  
✅ **Smart Recovery**: Respects auto-loaded candidate data from URL  

## Testing

### Test Case 1: Back Button
- Start assessment, answer some questions
- Press browser back button
- Verify warning appears
- Click "Cancel" → should stay on page

### Test Case 2: Draft Recovery
- Start assessment, answer questions
- Close browser tab (confirm leaving)
- Reopen assessment link within 1 hour
- Verify recovery prompt appears
- Click "Yes" → answers should be restored

### Test Case 3: Auto-save Indicator
- Answer a question
- Verify green "Auto-saved" badge appears briefly
- Badge should fade out after 2 seconds

### Test Case 4: Page Refresh
- Start assessment
- Press F5 or Cmd+R to refresh
- Verify browser warning appears
- Click "Cancel" → page stays, no refresh

## Browser Compatibility

✅ Chrome/Edge (Chromium)  
✅ Firefox  
✅ Safari (desktop & mobile)  
✅ Mobile browsers (iOS Safari, Chrome, Samsung Internet)  

## Notes

- Draft data stored locally in browser (not sent to server)
- Each browser/device has separate draft storage
- Drafts don't sync across devices
- After successful submission, draft is cleared automatically
- Assessment lockout (violations) also clears draft

## Future Enhancements (Optional)

- [ ] Server-side draft saving for cross-device sync
- [ ] Periodic auto-save (every 30 seconds) in addition to on-change
- [ ] Draft encryption for sensitive data
- [ ] Multiple draft slots (if user has multiple attempts)
- [ ] Visual draft age indicator ("Saved 5 minutes ago")

---

**Status**: ✅ Implemented and Ready for Testing  
**Last Updated**: November 23, 2025
