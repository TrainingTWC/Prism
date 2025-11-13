# QA PDF Report Implementation

## Overview
Created a comprehensive PDF report generator for QA Assessment checklists, matching the style and format of the Training Audit Report.

## Files Created/Modified

### 1. New File: `src/utils/qaReport.ts`
**Purpose**: PDF generation utility for QA Assessment reports

**Key Features**:
- **Professional Layout**: Matches Training Audit report design with header, logo, and styled sections
- **Complete Question Coverage**: All 116 questions across 5 sections (Zero Tolerance, Store, A, Maintenance, HR)
- **Smart Scoring**: 
  - Zero Tolerance: Binary pass/fail (any non-compliant = entire audit fails)
  - Other Sections: Compliant (full points), Partially Compliant (half points), Not Compliant (0), NA (excluded)
- **Visual Indicators**:
  - Color-coded responses (green for compliant, red for non-compliant, amber for partially compliant)
  - Progress bars showing percentage scores
  - Zero Tolerance violation warning banner (red alert if failed)
- **Section Breakdown**:
  - Each section displays score and percentage
  - Questions shown in table format with response, score, and max columns
  - Remarks section for each category (if available)
- **Metadata Support**:
  - Store name and ID
  - Auditor name
  - Date and region
  - Auto-extracted from submission data

### 2. Modified: `components/Dashboard.tsx`
**Changes**:
- Added import for `buildQAPDF` utility
- Added QA PDF generation case in `generatePDFReport()` function
- Extracts metadata from filters or submission data
- Generates filename: `QA_Assessment_[StoreName]_[Date].pdf`
- Success notification on completion

## Report Structure

```
┌─────────────────────────────────────────────────────┐
│ QA Assessment Report              [COMPANY LOGO]     │
│ Store Name                                          │
│ Date | Auditor | Store ID | Region                 │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐                 │
│ │ Overall Score│  │ Percentage   │                 │
│ │   92 / 155   │  │    88%       │                 │
│ │              │  │ ████████░░   │                 │
│ └──────────────┘  └──────────────┘                 │
├─────────────────────────────────────────────────────┤
│ ⚠ ZERO TOLERANCE VIOLATION (if applicable)         │
├─────────────────────────────────────────────────────┤
│ █ Zero Tolerance          Score: 20/24 (83%)       │
│ ┌───────────────────────────────────────────────┐  │
│ │ Question          │ Response  │ Score │ Max   │  │
│ │ No expired food   │ Compliant │   4   │  4    │  │
│ │ ...               │ ...       │ ...   │ ...   │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ Remarks: [Any section remarks here]                │
├─────────────────────────────────────────────────────┤
│ █ Store                   Score: 140/155 (90%)     │
│ [94 questions with responses and scores...]        │
├─────────────────────────────────────────────────────┤
│ █ A Section               Score: 6/6 (100%)        │
│ [3 questions...]                                   │
├─────────────────────────────────────────────────────┤
│ █ Maintenance             Score: 15/17 (88%)       │
│ [11 questions...]                                  │
├─────────────────────────────────────────────────────┤
│ █ HR                      Score: 4/4 (100%)        │
│ [2 questions...]                                   │
├─────────────────────────────────────────────────────┤
│              Page 1 of 4                           │
└─────────────────────────────────────────────────────┘
```

## How to Use

### From QA Dashboard:
1. Navigate to QA Assessments dashboard
2. Apply filters (optional):
   - Store filter → Generates store-specific report
   - Auditor filter → Includes auditor name in metadata
   - Region filter → Shows region in header
3. Click "Download PDF" button
4. PDF automatically downloads as `QA_Assessment_[StoreName]_[Date].pdf`

### PDF Content:
- **Header**: Title, store name, logo
- **Metadata Bar**: Date, auditor, store ID, region
- **Summary Cards**: Overall score and percentage with visual progress bar
- **Zero Tolerance Alert**: Red warning banner if any ZT question is non-compliant
- **Section Tables**: All questions grouped by section with:
  - Question text
  - Response (Compliant/Partially Compliant/Not Compliant/NA)
  - Score earned
  - Maximum possible score
- **Remarks**: Yellow highlighted boxes for any section-specific comments
- **Footer**: Page numbers on every page

## Scoring Logic

### Zero Tolerance (24 points max)
- **Compliant**: Full points (4 per question)
- **Non-Compliant**: 0 points AND entire audit fails (total score = 0)
- **NA**: Excluded from calculation

### Other Sections (Store, A, Maintenance, HR)
- **Compliant**: Full weight (typically 2 points)
- **Partially Compliant**: Half weight (typically 1 point)
- **Not Compliant**: 0 points
- **NA**: Excluded from max score calculation

### Overall Score
```
Total Score = Sum of all earned points
Max Score = Sum of applicable question weights (excludes NA)
Percentage = (Total Score / Max Score) × 100

If Zero Tolerance failed:
  Total Score = 0
  Percentage = 0%
```

## Color Coding

| Status | Text Color | Background | Usage |
|--------|-----------|------------|-------|
| Compliant | Green (#22C55E) | Light Green | Positive responses |
| Not Compliant | Red (#EF4444) | Light Red | Failed checks |
| Partially Compliant | Amber (#F59E0B) | Light Yellow | Partial credit |
| NA | Gray | White | Not applicable |
| Remarks | Dark Orange | Light Yellow | Section comments |

## Technical Details

**Dependencies**:
- `jspdf`: PDF generation
- `jspdf-autotable`: Table rendering
- `QA_SECTIONS` from `config/qaQuestions.ts`: Question structure
- `EMBEDDED_LOGO` from `src/assets/embeddedLogo`: Company branding

**Field Resolution**:
- Handles both direct field names (`S_1`) and Google Sheets colon format (`S_1: Description`)
- Fallback chain for metadata (filter → submission → empty)

**Multi-page Support**:
- Automatic page breaks when content exceeds page height
- Consistent footer with page numbers
- Sections never split mid-table

## Testing Checklist

- ✅ PDF generation works from QA dashboard
- ✅ All 116 questions included in report
- ✅ Scoring calculation correct (with NA exclusion)
- ✅ Zero Tolerance violation shows red alert
- ✅ Section scores and percentages accurate
- ✅ Color coding for responses (green/red/amber)
- ✅ Logo displays in header
- ✅ Metadata extracted from filters/submission
- ✅ Remarks sections display when present
- ✅ Multi-page layout works correctly
- ✅ Page numbers on all pages
- ✅ Success notification after generation

## Example Usage

```typescript
// From Dashboard component:
const pdf = await buildQAPDF(
  filteredQAData,           // Array of QA submissions
  {
    storeName: 'Store 123',
    storeId: '123',
    auditorName: 'John Doe',
    region: 'North',
    date: '2025-11-13'
  },
  { title: 'QA Assessment Report' }
);
pdf.save('QA_Assessment_Store123_2025-11-13.pdf');
```

## Notes

- Report automatically handles single or multiple submissions (uses first submission for single-store reports)
- If store filter applied, metadata uses filter data
- Supports both legacy field names and new colon-separated format from Google Sheets
- Zero Tolerance failure overrides all other scoring (total = 0)
- NA responses properly excluded from denominator in percentage calculations
