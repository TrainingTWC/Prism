# Campus Assessment - Screenshot & Screen Recording Protection

## Overview
Comprehensive anti-screenshot and anti-screen-recording measures implemented to protect assessment integrity and prevent cheating.

## Protection Measures Implemented

### 1. **Keyboard Shortcut Prevention**
Blocks all common screenshot keyboard shortcuts:

**Windows:**
- `Print Screen` key
- `Windows + Shift + S` (Snipping Tool)
- `Windows + PrtScn`

**macOS:**
- `Cmd + Shift + 3` (Full screenshot)
- `Cmd + Shift + 4` (Partial screenshot)
- `Cmd + Shift + 5` (Screenshot utility)

**Action:** Shows alert and logs violation when detected

### 2. **Visual Watermark Overlay**
- Diagonal watermark with candidate info: `Name • Timestamp • CONFIDENTIAL`
- Semi-transparent, repeating pattern
- Makes screenshots less useful/identifiable
- Candidate-specific (includes name/email and timestamp)

### 3. **CSS Protection**
- `user-select: none` - Prevents text selection
- Invisible overlay layer - Complicates screen capture
- Applied only during active assessment

### 4. **Right-Click & Copy Protection**
- Context menu disabled (no right-click)
- Copy/Cut operations blocked
- Prevents text copying from questions

### 5. **Window Focus Detection**
- Logs violation when window loses focus
- Detects when user switches to screenshot tools
- Integrated with existing proctoring violation system

### 6. **Screen Recording Detection**
- Monitors media device permissions
- Logs suspicious activity
- Warning message on detection

## User Experience

### What Users See:

**Before Assessment:**
Added rule in instructions:
> 🚫 **Screenshots & Screen Recording Prohibited**
>
> Screenshots, screen recordings, and screen sharing are strictly prohibited and will be detected. Any attempt will be logged as a violation and may result in disqualification.

**During Assessment:**
- Subtle watermark overlay (barely visible)
- Text cannot be selected
- Right-click menu disabled
- Print Screen key blocked with alert

**On Screenshot Attempt:**
```
⚠️ Screenshots are not allowed during the assessment!
```

## Technical Details

### Violation Logging
All screenshot attempts are logged with:
- Type: `window-blur` 
- Details: "Screenshot attempt detected"
- Timestamp (IST)
- Added to violation history

### Browser Compatibility
✅ Chrome/Edge - Full protection  
✅ Firefox - Full protection  
✅ Safari - Keyboard blocking, CSS protection  
⚠️ Mobile browsers - Limited (OS-level screenshots harder to block)

### Limitations

**Cannot be blocked 100%:**
1. **Mobile OS screenshots** - System-level (volume+power button)
2. **External cameras** - Taking photo of screen
3. **Virtual machines** - Screenshot from host OS
4. **Hardware capture cards** - External recording devices

**Deterrents in place:**
- Watermark makes screenshots identifiable
- Violation logging creates audit trail
- Warning message acts as deterrent
- Proctoring camera may capture user taking photos

## UI Changes

### Submit Button Simplified
**Before:**
```
30 question(s) remaining (unanswered = 0 points)
Time remaining: 29:45
[Submit Assessment]
```

**After:**
```
[Submit Assessment]
```

- Cleaner interface
- Timer still visible in header
- Less distraction
- Centered button

## Testing

### Test Case 1: Keyboard Shortcuts
1. Start assessment
2. Press `Print Screen` key
3. **Expected:** Alert appears, violation logged
4. Try `Cmd+Shift+3` (Mac) or `Win+Shift+S` (Windows)
5. **Expected:** Blocked with alert

### Test Case 2: Watermark Visibility
1. Start assessment
2. Look for diagonal watermark with your name
3. **Expected:** Faint watermark visible across screen
4. Take test screenshot (if testing environment)
5. **Expected:** Watermark appears in screenshot

### Test Case 3: Right-Click Protection
1. Start assessment
2. Right-click on question text
3. **Expected:** Context menu doesn't appear
4. Try to select text with mouse
5. **Expected:** Text cannot be selected

### Test Case 4: Copy Protection
1. Try `Ctrl+C` or `Cmd+C` on question
2. **Expected:** Nothing copied
3. Try `Ctrl+A` to select all
4. **Expected:** Nothing selected

## Security Notes

### What This Protection Does:
✅ Deters casual screenshot attempts  
✅ Makes screenshots traceable (watermark)  
✅ Logs all violation attempts  
✅ Provides audit trail  
✅ Warns users about consequences  

### What It Cannot Prevent:
❌ Determined user with external camera  
❌ Mobile OS-level screenshots  
❌ VM host screenshots  
❌ Screen recording from another device  

### Best Used With:
- Proctoring (camera monitoring)
- Time limits (less opportunity)
- Question randomization
- Violation tracking and review
- Warning users about consequences

## Configuration

Protection automatically enables when:
- `proctoringEnabled === true`
- `assessmentStarted === true`

Protection automatically disables when:
- Assessment submitted
- User locked out
- Proctoring stopped

## Maintenance

### To Adjust Watermark:
Edit the watermark div styling in the component:
```typescript
opacity-5  // Watermark opacity (5%)
rotate-[-30deg]  // Rotation angle
text-6xl  // Text size
```

### To Add More Keyboard Shortcuts:
Add to the `preventPrintScreen` function:
```typescript
if (e.key === 'YourKey' && e.ctrlKey) {
  e.preventDefault();
  // ... handle violation
}
```

### To Disable Protection (Testing Only):
Comment out the entire `useEffect` hook for screenshot protection.

## Compliance & Legal

⚠️ **Important:** 
- Users are warned in rules before starting
- Protection is transparent (not hidden)
- Violation logging disclosed in privacy notice
- Watermark clearly shows "CONFIDENTIAL"

Users consent to these measures by:
1. Reading the rules page
2. Clicking "Start Proctoring & Begin"
3. Acknowledging screenshot prohibition

---

**Status**: ✅ Implemented  
**Effectiveness**: High deterrent, moderate technical blocking  
**Last Updated**: November 23, 2025
