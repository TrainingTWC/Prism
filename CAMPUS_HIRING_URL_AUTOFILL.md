# Campus Hiring Assessment - URL Auto-fill Feature

## Overview
The campus hiring assessment now supports automatic population of candidate information via URL parameters. This makes it easy to send personalized assessment links to candidates.

## How It Works

### URL Format
```
https://trainingtwc.github.io/Prism/?EMPID=<candidate-email>
```

### Example URLs
```
https://trainingtwc.github.io/Prism/?EMPID=shreya.dasghosh@gmail.com
https://trainingtwc.github.io/Prism/?EMPID=adhirajbhatnagar06@gmail.com
https://trainingtwc.github.io/Prism/?EMPID=adityagoyalihm@gmail.com
```

## Features

### 1. **Automatic Data Loading**
When a candidate clicks on their personalized link:
- The system reads the email from the `EMPID` URL parameter
- Looks up the candidate in the `IHM_Mumbai.json` database
- Auto-populates all candidate information fields:
  - Candidate Name
  - Phone Number
  - Email Address
  - Campus Name

### 2. **Field Protection**
Once data is auto-loaded:
- All candidate information fields become read-only
- Fields are visually marked with a green "Auto-loaded" badge
- An informational message explains that fields cannot be modified
- Prevents candidates from tampering with their identity

### 3. **Fallback Behavior**
If no matching candidate is found:
- The email field is still pre-filled with the URL parameter
- Other fields remain editable for manual entry
- Assessment can still be completed

## Data Source

### IHM Mumbai Candidates (`IHM_Mumbai.json`)
Location: `/public/IHM_Mumbai.json`

The JSON file contains:
- **Total Candidates:** 75 students from IHM Mumbai
- **Fields:** name, phone, email, institution

Example structure:
```json
{
  "institution": "IHM Mumbai",
  "candidates": [
    {
      "name": "Adhiraj Bhatnagar",
      "phone": "7017425065",
      "email": "adhirajbhatnagar06@gmail.com",
      "institution": "IHM Mumbai"
    }
  ],
  "totalCandidates": 75,
  "accessLevel": "campus_hire_assessment"
}
```

## Adding More Campuses

To add candidates from other campuses:

1. **Create a new JSON file** (e.g., `IHM_Bangalore.json`)
2. **Place it in the `/public` folder**
3. **Update the component** to load from multiple sources or merge data
4. **Maintain the same JSON structure**

## Security Considerations

✅ **Benefits:**
- Prevents identity fraud during assessment
- Ensures accurate candidate tracking
- Simplifies the assessment process

⚠️ **Note:**
- Email addresses in URLs are case-insensitive
- The system validates against the candidate database
- Only authorized candidates with matching emails can have auto-filled forms

## Implementation Details

### Component: `CampusHiringChecklist.tsx`
- Auto-load runs on component mount
- Uses `useEffect` hook with empty dependency array
- Fetches JSON file from public folder
- Case-insensitive email matching
- State variable `candidateDataLoaded` tracks auto-fill status

### Files Modified:
1. `components/checklists/CampusHiringChecklist.tsx` - Auto-fill logic
2. `public/IHM_Mumbai.json` - Candidate database

## Testing

To test the feature:

1. **Local Development:**
   ```
   http://localhost:5173/?EMPID=shreya.dasghosh@gmail.com
   ```

2. **Production:**
   ```
   https://trainingtwc.github.io/Prism/?EMPID=shreya.dasghosh@gmail.com
   ```

3. **Verify:**
   - Fields should auto-populate
   - Green "Auto-loaded" badge appears
   - Fields are disabled/read-only
   - Blue info message displays at bottom

## Future Enhancements

- [ ] Support multiple campus JSON files
- [ ] QR code generation for each candidate link
- [ ] Email invitation system with personalized links
- [ ] Admin interface to manage candidate lists
- [ ] Bulk URL generation tool
- [ ] Access logging and analytics

## Support

For issues or questions:
- Check browser console for error messages
- Verify email matches exactly (case-insensitive)
- Ensure `IHM_Mumbai.json` is accessible
- Contact system administrator

---

**Last Updated:** November 23, 2025
**Feature Version:** 1.0
