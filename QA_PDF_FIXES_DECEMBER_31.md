# QA PDF Fixes - December 31, 2025

## Issues Fixed

### 1. Text Encoding Issue - "& & &" Characters ✅

**Problem**: The Zero Tolerance warning text was displaying as garbled characters: "& & &Z&E&R&O& &T&O&L&E&R&A&N&C&E&..."

**Root Cause**: The warning symbol `⚠` (Unicode U+26A0) was being incorrectly encoded by jsPDF, resulting in UTF-16 byte pairs being displayed as separate characters.

**Solution**: Replaced the Unicode warning symbol with ASCII exclamation mark `!`

**Code Change** (`src/utils/qaReport.ts`):
```typescript
// Before:
doc.text('⚠ ZERO TOLERANCE VIOLATION - Audit Failed', 18, y + 10);

// After:
doc.text('! ZERO TOLERANCE VIOLATION - Audit Failed', 18, y + 10);
```

---

### 2. Incorrect Scoring When Zero Tolerance Fails ✅

**Problem**: When Zero Tolerance was violated, the PDF showed:
- Overall score: 180.5/227
- Zero Tolerance section: 16/24 (67%)
- Other sections showing partial scores

According to QA rules: **If any Zero Tolerance item is Non-Compliant, the ENTIRE audit score must be 0.**

**Root Cause**: The code correctly set the total to 0 in the overall summary, but section-by-section scores were still calculated normally.

**Solution**: Updated scoring logic to ensure:
1. Total score is forced to 0 when Zero Tolerance fails
2. All section scores show 0 when Zero Tolerance fails
3. Individual responses still show actual values for transparency

**Code Changes** (`src/utils/qaReport.ts`):

1. **Overall Score Calculation**:
```typescript
// Calculate scores
const computed = computeOverall(first);
let total = totalFromSheet ? Number(first.totalScore) : computed.total;
const zeroToleranceFailed = computed.zeroToleranceFailed;

// If Zero Tolerance failed, total score must be 0
if (zeroToleranceFailed) {
  total = 0;
}
```

2. **Section Score Calculation**:
```typescript
// Only add to score if Zero Tolerance didn't fail
if (!zeroToleranceFailed) {
  sections[section.id].score += numeric;
}
```

**Now the PDF will correctly show:**
- Overall score: 0/227 (0%)
- Zero Tolerance: 0/24 (0%) - even if some items were compliant
- All other sections: 0/X (0%)
- Banner: "! ZERO TOLERANCE VIOLATION - Audit Failed"

---

### 3. Images Not Appearing in PDF ✅

**Problem**: Images captured during QA assessments were not appearing in the generated PDF.

**Root Cause**: Multiple potential issues:
1. The `Question Images JSON` column was recently added to Google Sheets, so existing submissions don't have image data
2. Image key format mismatch between what's stored and what the PDF generator looks for
3. Lack of debugging information to identify the issue

**Solution**: 
1. **Enhanced Debugging**: Added comprehensive console logging to track image loading process
2. **Multiple Key Format Matching**: Try alternate image key formats if primary format doesn't work
3. **Better Error Messages**: Console logs now show exactly where images are coming from (or why they're missing)

**Code Changes**:

1. **Dashboard.tsx** - Enhanced image loading with debug logs:
```typescript
let questionImages: Record<string, string[]> = {};
try {
  console.log('🔍 Attempting to load question images...');
  
  if (reportData.length > 0) {
    const firstRecord = reportData[0] as any;
    console.log('📊 First record keys:', Object.keys(firstRecord));
    
    if (firstRecord.questionImagesJSON || firstRecord['Question Images JSON']) {
      const imagesJSON = firstRecord.questionImagesJSON || firstRecord['Question Images JSON'];
      console.log('✅ Found images JSON:', imagesJSON?.substring(0, 100));
      questionImages = JSON.parse(imagesJSON);
      console.log('✅ Loaded from submission:', Object.keys(questionImages).length, 'image sets');
    } else {
      console.warn('⚠️ No questionImagesJSON field found');
    }
  }
  
  // Fallback to localStorage
  if (Object.keys(questionImages).length === 0) {
    const storedImages = localStorage.getItem('qa_images');
    if (storedImages) {
      questionImages = JSON.parse(storedImages);
      console.log('✅ Loaded from localStorage:', Object.keys(questionImages).length);
    }
  }
} catch (error) {
  console.error('❌ Could not load images:', error);
}
```

2. **qaReport.ts** - Multiple key format matching:
```typescript
// Try multiple image key formats
const imageKey = rowData.questionId; // e.g., "ZeroTolerance_ZT_1"
let images = questionImages[imageKey];

// Try alternate formats if not found
if (!images || images.length === 0) {
  const altKey = imageKey.replace(/_([A-Z]+)_/, '_$1');
  images = questionImages[altKey];
}

if (!images || images.length === 0) {
  const parts = rowData.id.split('_');
  if (parts.length >= 2) {
    const sectionImageKey = `${sec.title.replace(/\s+/g, '')}_${rowData.id}`;
    images = questionImages[sectionImageKey];
  }
}
```

3. **Added Debug Logging at PDF Generation**:
```typescript
export const buildQAPDF = async (...) => {
  console.log('🖼️ Building QA PDF with images:', Object.keys(questionImages).length, 'image sets');
  console.log('📸 Image keys:', Object.keys(questionImages));
  if (Object.keys(questionImages).length > 0) {
    console.log('📷 Sample:', Object.keys(questionImages)[0], '- Images:', questionImages[Object.keys(questionImages)[0]]?.length);
  }
  // ... rest of code
}
```

---

## Testing Instructions

### Test 1: Zero Tolerance Scoring
1. Fill out a QA checklist
2. Mark at least ONE Zero Tolerance item as "Non-Compliant"
3. Mark other sections as "Compliant" or "Partially Compliant"
4. Submit the assessment
5. Download PDF report
6. **Expected Result**:
   - Overall score shows: 0/227 (0%)
   - Zero Tolerance shows: 0/24 (0%)
   - All sections show: 0/X (0%)
   - Red banner shows: "! ZERO TOLERANCE VIOLATION - Audit Failed"
   - Text is clean (no & & & characters)

### Test 2: Images in PDF
1. **For NEW submissions** (after Google Apps Script update):
   - Fill out QA checklist
   - Capture images for at least 3 questions
   - Submit
   - Open browser console (F12)
   - Download PDF
   - Check console logs to see if images were loaded
   - Check PDF for images under respective questions

2. **For EXISTING submissions** (before script update):
   - These will NOT have images yet (column didn't exist)
   - Console will show: "⚠️ No questionImagesJSON field found"
   - Images will only appear in localStorage for current session

3. **To add images to existing submission**:
   - Edit the submission
   - Re-submit (this will update with new column)
   - Images will now be saved and appear in future PDFs

### Test 3: Text Encoding
1. Download any QA PDF report
2. Look for the Zero Tolerance failure banner (if applicable)
3. **Expected**: "! ZERO TOLERANCE VIOLATION - Audit Failed"
4. **Not Expected**: "& & &Z&E&R&O..." or other garbled text

---

## Important Notes

### About Images

**Why aren't my images showing?**

Images will only appear in PDFs for submissions that include the `Question Images JSON` field. This requires:

1. ✅ Google Apps Script must be updated with the new column (already done)
2. ✅ The submission must be created/edited AFTER the script update
3. ✅ Images were captured during the assessment

**For old submissions**: Images won't appear until you edit and re-submit them (which will add the image data).

**For new submissions**: Images will automatically be included.

**Debug Process**:
- Open browser console (F12) before downloading PDF
- Look for console messages starting with 🔍, 📊, ✅, or ⚠️
- These will tell you exactly what's happening with images

### Console Messages You Might See

```
🔍 Attempting to load question images...
📊 First record keys: [...]
⚠️ No questionImagesJSON field found in submission data
⚠️ No images in localStorage either
📸 Final question images object: 0 image sets
🖼️ Building QA PDF with images: 0 image sets
```
This means: The submission doesn't have image data (it's an old submission).

```
✅ Found images JSON in submission: string {...}
✅ Loaded images from submission data: 5 image sets
📸 Final question images object: 5 image sets
🖼️ Building QA PDF with images: 5 image sets
📸 Image keys: ["ZeroTolerance_ZT_1", "Store_S_5", ...]
```
This means: Images found and loaded successfully!

---

## Files Modified

1. `src/utils/qaReport.ts` - PDF generation with scoring fixes and image handling
2. `components/Dashboard.tsx` - Enhanced image loading with debugging
3. `qa-checklist-google-apps-script-COMPLETE.js` - Already updated with Question Images JSON column

---

## Deployment

```powershell
npm run build
```

No Google Apps Script changes needed - that was done in the previous update.

---

## Summary

✅ **Text Encoding**: Fixed - No more garbled "&" characters  
✅ **Zero Tolerance Scoring**: Fixed - Shows 0 when ZT fails  
✅ **Images Debug**: Added - Console shows exactly what's happening  
✅ **Image Key Matching**: Enhanced - Tries multiple formats  

The PDF will now correctly enforce the Zero Tolerance rules and display clean, readable text. Images will appear for new submissions going forward, with helpful console messages to debug any issues.
