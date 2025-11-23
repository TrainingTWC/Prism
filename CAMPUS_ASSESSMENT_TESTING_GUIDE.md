# Testing Guide: Campus Assessment Back Button Protection

## Quick Test Checklist

### ✅ Test 1: Back Button Warning (Desktop)
1. Open campus hiring assessment
2. Enable proctoring and start assessment
3. Answer 5-10 questions
4. **Action**: Press browser back button (← arrow or Backspace key)
5. **Expected**: Warning dialog appears:
   ```
   ⚠️ WARNING: Going back will reset your assessment!
   
   All your answers will be lost and you will need to start over.
   
   Are you sure you want to leave?
   ```
6. Click "Cancel"
7. **Expected**: Stay on assessment page, no data lost
8. Verify all answers are still there

### ✅ Test 2: Mobile Swipe Back (Mobile/Tablet)
1. Open assessment on mobile device (iOS/Android)
2. Start assessment and answer questions
3. **Action**: Swipe from left edge to go back
4. **Expected**: Same warning dialog appears
5. Tap "Cancel"
6. **Expected**: Stays on page, answers preserved

### ✅ Test 3: Auto-Save Indicator
1. Start assessment
2. Answer a question
3. **Expected**: Green "Auto-saved" badge appears in top-right area
4. Wait 2 seconds
5. **Expected**: Badge fades out automatically
6. Answer another question
7. **Expected**: Badge appears again

### ✅ Test 4: Draft Recovery (Browser Close)
1. Start assessment
2. Answer 10 questions
3. **Action**: Close browser tab/window (confirm leaving when prompted)
4. Wait 10 seconds
5. Reopen assessment URL with same EMPID parameter
6. **Expected**: Dialog appears:
   ```
   📝 Found an incomplete assessment from your previous session.
   
   Would you like to restore your answers?
   ```
7. Click "Yes"
8. **Expected**: All 10 answers are restored
9. Verify question numbers match your previous answers

### ✅ Test 5: Page Refresh Warning
1. Start assessment
2. Answer some questions
3. **Action**: Press F5, Ctrl+R, or Cmd+R to refresh
4. **Expected**: Browser's native warning:
   ```
   Your assessment progress will be lost if you leave this page. Are you sure?
   ```
5. Click "Cancel" or "Stay on page"
6. **Expected**: Page doesn't refresh, answers intact

### ✅ Test 6: Draft Expiration (1 Hour)
1. Start assessment, answer questions
2. Close tab (save draft)
3. **Wait 61+ minutes** (or modify browser time)
4. Reopen assessment
5. **Expected**: NO recovery prompt (draft expired)
6. Assessment starts fresh

### ✅ Test 7: Successful Submission Clears Draft
1. Complete entire assessment
2. Submit successfully
3. **Expected**: See thank you message
4. Open browser DevTools (F12)
5. Go to Application/Storage → Local Storage
6. Look for `campusHiringDraft` key
7. **Expected**: Key should be deleted (draft cleared)

### ✅ Test 8: Rules Page Warning Visibility
1. Open assessment
2. Before enabling proctoring, scroll down rules page
3. **Expected**: See yellow warning box:
   ```
   ⚠️ Do Not Press Back Button
   
   Using the browser back button or swiping back will trigger 
   a warning as it may reset your progress. Your answers are 
   auto-saved, but stay on this page to avoid disruption.
   ```

## Advanced Testing

### Test A: Multiple Tabs (Edge Case)
1. Open assessment in Tab 1, answer 5 questions
2. Open same assessment URL in Tab 2
3. In Tab 2, answer different questions
4. Return to Tab 1
5. Answer more questions
6. **Expected**: Tab 1's answers override Tab 2 (last write wins)
7. **Note**: This is expected localStorage behavior

### Test B: Incognito/Private Mode
1. Open assessment in incognito/private browsing
2. Answer questions, close tab
3. Reopen in new incognito window
4. **Expected**: No draft recovery (incognito doesn't persist localStorage)

### Test C: Different Browsers
1. Start assessment in Chrome, answer questions, close
2. Open same URL in Firefox
3. **Expected**: No draft recovery (localStorage is browser-specific)

### Test D: Back Button After Submission
1. Complete and submit assessment
2. Press back button
3. **Expected**: No warning (assessment complete)
4. Should see thank you screen or be logged out

## Browser Console Checks

Open DevTools Console (F12) and check for these logs:

### During Assessment:
```
✓ Draft restored: 10 answers
Auto-saved draft with 15 answers
```

### On Back Button Press:
```
Preventing navigation - showing warning
User chose to stay on page
```

### On Successful Submit:
```
Draft cleared after successful submission
```

## Common Issues & Fixes

### Issue 1: Warning Doesn't Appear
- **Check**: Is assessment started? (warnings only after proctoring enabled)
- **Fix**: Ensure `assessmentStarted` is true

### Issue 2: Draft Not Restoring
- **Check**: DevTools → Application → Local Storage → `campusHiringDraft`
- **Check**: Draft timestamp (must be < 1 hour old)
- **Fix**: Clear old drafts, start fresh

### Issue 3: Auto-save Badge Not Visible
- **Check**: Is at least one question answered?
- **Check**: Browser console for React errors
- **Fix**: Hard refresh (Ctrl+Shift+R)

### Issue 4: Mobile Swipe Not Working
- **Check**: Browser supports `popstate` event
- **Note**: Some mobile browsers handle swipes differently
- **Workaround**: Use browser back button instead

## Success Criteria

✅ All 8 basic tests pass  
✅ Warning dialog shows correct message  
✅ Auto-save indicator appears and disappears  
✅ Draft recovery works within 1 hour  
✅ Drafts cleared after submission  
✅ Mobile swipe gestures trigger warnings  

## Reporting Bugs

If you find issues, report with:
1. Browser & version
2. Device type (desktop/mobile/tablet)
3. Steps to reproduce
4. Screenshot/screen recording if possible
5. Browser console logs

---

**Testing Status**: Ready for QA  
**Priority**: High (User Data Protection)  
**Test Completion Time**: ~15-20 minutes for full suite
