# PRISM Logo Update for PDFs

## Current Status
The PDF reports currently use the Third Wave Coffee logo. This guide will help you replace it with the PRISM logo.

## Quick Steps

### 1. Save the PRISM Logo
- Save the PRISM logo image (from chat) as PNG format
- Place it in: `assets/prism-logo-pdf.png`
- **Important**: Make sure it's a PNG file with transparent background for best results

### 2. Run the Conversion Script
```powershell
cd C:\Users\TWC\Downloads\Prism
.\scripts\convert-prism-logo.ps1
```

### 3. Rebuild/Restart the App
If the app is running, it should auto-reload. Otherwise:
```powershell
npm run dev
```

## What Gets Updated

All PDF reports will now show the PRISM logo in the top-right corner:

✅ **AM Scorecard PDFs** (`components/AMScorecard.tsx`)
✅ **Training Audit PDFs** (`src/utils/trainingReport.ts`)
✅ **HR Connect PDFs** (`src/utils/hrReport.ts`)
✅ **QA Checklist PDFs** (`src/utils/qaReport.ts`)
✅ **Operations Dashboard PDFs** (`src/utils/operationsReport.ts`)
✅ **Campus Hiring PDFs** (`src/utils/campusHiringReport.ts`)
✅ **Finance Audit PDFs** (all finance reports)

## Technical Details

### How It Works
1. The logo is converted to base64 format
2. Embedded directly in `src/assets/embeddedLogo.ts`
3. All PDF generators import from this single source
4. Logo appears in top-right corner of every PDF (162mm from left, 8mm from top)

### File Locations
- **Logo source**: `assets/prism-logo-pdf.png`
- **Embedded output**: `src/assets/embeddedLogo.ts`
- **PDF generators**: `src/utils/*.ts` and `components/AMScorecard.tsx`

### Logo Dimensions in PDFs
- Reserved area: 28mm × 28mm
- Inner padding: 4mm
- Automatically scaled to fit while maintaining aspect ratio

## Troubleshooting

### Logo doesn't appear in PDFs
- Check that `src/assets/embeddedLogo.ts` was updated
- Verify the base64 string starts with `data:image/png;base64,`
- Restart the dev server

### Logo looks blurry
- Use a higher resolution PNG (recommended: 400×400px minimum)
- Ensure transparent background for clean appearance

### Script fails
- Verify the logo file exists at `assets/prism-logo-pdf.png`
- Check file permissions
- Make sure it's a valid PNG file

## Alternative: Manual Update

If the script doesn't work, you can manually update the logo:

1. Convert your PNG to base64 (use online tool: https://base64.guru/converter/encode/image)
2. Open `src/assets/embeddedLogo.ts`
3. Replace the entire content with:
   ```typescript
   export const EMBEDDED_LOGO = 'data:image/png;base64,YOUR_BASE64_STRING_HERE';
   ```

## Verification

After updating, download a PDF report from any section and verify:
- PRISM logo appears in top-right corner
- Logo is clear and properly sized
- No overlapping with text or other elements

---

**Note**: The embedded logo is about 100-150KB in base64 format. This is normal and won't significantly impact performance since it's only loaded once and cached.
