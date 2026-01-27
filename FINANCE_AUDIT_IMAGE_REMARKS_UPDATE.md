# Finance Audit - Image Upload & Per-Question Remarks Feature

## Overview
Added image upload and per-question remarks functionality to Finance Audit checklist, matching the QA Audit implementation.

## Changes Made

### 1. Frontend Changes (FinanceChecklist.tsx)

#### State Management
- **Added States:**
  - `questionImages: Record<string, string[]>` - Stores array of base64 images per question
  - `questionRemarks: Record<string, string>` - Stores text remarks per question
  
- **localStorage Integration:**
  - Images saved to: `finance_images`
  - Remarks saved to: `finance_remarks`
  - Auto-persisted on every change

#### Image Handling Functions
- **handleImageUpload(questionId, files)**
  - Compresses images using HTML5 Canvas
  - Max dimension: 800px
  - JPEG quality: 0.6
  - Checks 5MB localStorage limit
  - Stores as base64 in questionImages state

- **removeImage(questionId, imageIndex)**
  - Removes specific image from question's image array
  - Deletes question key if no images remain

#### UI Components Added per Question
1. **Camera Button**
   - Blue button with camera icon
   - Uses `capture="environment"` for rear camera
   - Accepts single image

2. **Gallery Button** 
   - Green button with gallery icon
   - `multiple` attribute allows multiple selections
   - Batch image upload support

3. **Image Preview Grid**
   - 1-2 column responsive grid
   - 48px height images with object-cover
   - Delete button (red, top-right) for each image
   - Image counter badge (bottom-left) showing "X of Y"

4. **Per-Question Remarks Textarea**
   - Label: "💬 Comments / Remarks for Question {N}"
   - 2 rows height
   - Placeholder text
   - Emerald focus ring

#### Submission Updates
- **Added to params:**
  - Per question:
    - `{section}_{question}_remark` - Individual question remark
    - `{section}_{question}_imageCount` - Number of images for question
  - Bulk data:
    - `questionImagesJSON` - JSON string of all images
    - `questionRemarksJSON` - JSON string of all remarks

#### Reset Function Updates
- Clears `questionImages` state
- Clears `questionRemarks` state  
- Removes `finance_images` from localStorage
- Removes `finance_remarks` from localStorage

### 2. Backend Changes (finance-audit-google-apps-script-QA-PATTERN.js)

#### Updated Structure
- **Previous:** 48 columns (12 metadata + 30 questions + 4 section remarks + 2 signatures)
- **New:** 110 columns (12 metadata + 90 question fields + 4 section remarks + 2 signatures + 2 JSON fields)

#### Per-Question Data (30 questions × 3 fields = 90 columns)
Each question now has:
1. Answer (yes/no/na)
2. Remark (text)
3. Image Count (number)

#### Section Breakdown
**Cash Management (8 questions):**
- Columns M-AJ: CM_1 to CM_8 (each with answer, remark, imageCount)
- Column AK: Section remarks

**Sales Revenue (7 questions):**
- Columns AL-BG: SR_1 to SR_7 (each with answer, remark, imageCount)
- Column BG: Section remarks

**Inventory Finance (8 questions):**
- Columns BH-CF: IF_1 to IF_8 (each with answer, remark, imageCount)
- Column CF: Section remarks

**Compliance Reporting (7 questions):**
- Columns CG-DB: CR_1 to CR_7 (each with answer, remark, imageCount)
- Column DB: Section remarks

**Signatures & JSON:**
- Column DC: Auditor Signature
- Column DD: SM Signature
- Column DE: Question Images JSON (all images as JSON string)
- Column DF: Question Remarks JSON (all remarks as JSON string)

#### doPost() Updates
- Reads per-question remarks: `params.{section}_{question}_remark`
- Reads per-question image counts: `params.{section}_{question}_imageCount`
- Reads JSON data: `params.questionImagesJSON` and `params.questionRemarksJSON`
- Appends all 110 columns to sheet

#### setupFinanceHeaders() Updates
- Creates 110 column headers
- Includes per-question remark and image count columns
- Adds JSON data columns at the end
- Maintains same formatting (blue header, white text)

## Feature Parity with QA Audit

### Matching Functionality ✅
- Multiple image upload per question
- Image compression (800px max, 0.6 quality)
- Per-question text remarks
- localStorage persistence
- Image preview with delete
- Image counter badges
- Camera capture support
- Gallery multi-select support
- Submit with JSON data
- Reset clears all data

### Differences
- **QA has:** Edit image functionality (drawing/markup)
- **Finance has:** Simplified version without image editing (can add later if needed)

## Testing Checklist

### Frontend Testing
- [ ] Upload images via camera button
- [ ] Upload multiple images via gallery button
- [ ] Remove individual images
- [ ] Add remarks to each question
- [ ] Verify localStorage persistence (refresh page)
- [ ] Submit form with images and remarks
- [ ] Reset form clears images and remarks
- [ ] Check 5MB storage limit warning

### Backend Testing
- [ ] Verify all 110 columns created in Google Sheet
- [ ] Check per-question remarks appear in correct columns
- [ ] Check per-question image counts appear in correct columns
- [ ] Verify questionImagesJSON column contains JSON data
- [ ] Verify questionRemarksJSON column contains JSON data
- [ ] Test with multiple submissions
- [ ] Verify doGet() retrieves data correctly

## Deployment Steps

### 1. Update Frontend
```bash
# Changes already made to FinanceChecklist.tsx
# No additional steps needed - already in codebase
```

### 2. Update Google Apps Script
1. Open Google Apps Script editor for Finance Audit sheet
2. Replace entire script with updated `finance-audit-google-apps-script-QA-PATTERN.js`
3. Click "Deploy" → "Manage deployments"
4. Click "Edit" (pencil icon) on existing deployment
5. Change "Version" to "New version"
6. Add description: "Added image upload and per-question remarks support (110 columns)"
7. Click "Deploy"
8. Copy the new deployment URL (should be same as before)
9. If URL changed, update `FINANCE_ENDPOINT` in code

### 3. Test Submission
1. Open Finance Audit in browser
2. Fill out form with images and remarks
3. Submit
4. Check Google Sheet to verify:
   - All 110 columns present
   - Per-question remarks in correct columns
   - Image counts in correct columns
   - JSON data in last 2 columns

## Notes

### Storage Considerations
- Base64 images stored in localStorage (5MB browser limit)
- Images also sent to Google Sheet as JSON
- Consider future optimization if storage becomes issue

### Image Quality
- 800px max dimension balances quality vs size
- 0.6 JPEG quality provides good compression
- Average image ~50-100KB after compression

### Future Enhancements
- Add image editing/markup (like QA checklist)
- Add ability to view images from dashboard
- Consider cloud storage for images instead of base64

## Files Modified

1. `components/checklists/FinanceChecklist.tsx` - Frontend implementation
2. `finance-audit-google-apps-script-QA-PATTERN.js` - Backend Google Apps Script

## Summary

Finance Audit now has full image upload and per-question remarks functionality matching QA Audit. Each of the 30 questions can have:
- Multiple images (compressed, stored as base64)
- Text remarks/comments
- All data persisted in localStorage
- All data submitted to Google Sheet (110 columns total)

The implementation follows the exact same pattern as QA Audit, ensuring consistency across the codebase.
