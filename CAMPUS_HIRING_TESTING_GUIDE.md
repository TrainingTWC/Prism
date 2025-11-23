# Campus Hiring Assessment - URL Auto-fill Testing Guide

## Quick Test URLs

Use these URLs to test the auto-fill functionality:

### Test Candidate 1: Shreya Dasghosh
```
https://trainingtwc.github.io/Prism/?EMPID=shreya.dasghosh@gmail.com
```
Expected auto-fill:
- Name: Shreya Dasghosh
- Phone: 9831664676
- Email: shreya.dasghosh@gmail.com
- Campus: IHM Mumbai

### Test Candidate 2: Adhiraj Bhatnagar
```
https://trainingtwc.github.io/Prism/?EMPID=adhirajbhatnagar06@gmail.com
```
Expected auto-fill:
- Name: Adhiraj Bhatnagar
- Phone: 7017425065
- Email: adhirajbhatnagar06@gmail.com
- Campus: IHM Mumbai

### Test Candidate 3: Aditya Goyal
```
https://trainingtwc.github.io/Prism/?EMPID=Adityagoyalihm@gmail.com
```
Expected auto-fill:
- Name: Aditya Goyal
- Phone: 7477052749
- Email: Adityagoyalihm@gmail.com
- Campus: IHM Mumbai

### Test Invalid Email (Should NOT auto-fill)
```
https://trainingtwc.github.io/Prism/?EMPID=notfound@example.com
```
Expected behavior:
- Only email field pre-filled with "notfound@example.com"
- Other fields remain empty and editable
- No "Auto-loaded" badge
- No info message

## Testing Checklist

### ✅ Basic Functionality
- [ ] Valid email: All fields auto-populate correctly
- [ ] Invalid email: Only email field pre-filled, others editable
- [ ] Case insensitivity: `SHREYA.DASGHOSH@GMAIL.COM` works same as `shreya.dasghosh@gmail.com`
- [ ] No EMPID parameter: All fields remain empty and editable

### ✅ Field Protection
- [ ] Auto-loaded fields are disabled (grayed out)
- [ ] Green "Auto-loaded" badge appears next to heading
- [ ] Blue info message displays below form
- [ ] Dropdown selector hidden for campus field when auto-loaded

### ✅ User Experience
- [ ] Console logs show "Candidate found" message
- [ ] Page loads without errors
- [ ] Fields render correctly on mobile
- [ ] Proctoring can still be enabled normally

### ✅ Assessment Flow
- [ ] Assessment can be started after auto-fill
- [ ] Timer starts correctly
- [ ] Questions can be answered
- [ ] Assessment can be submitted
- [ ] Submission includes correct candidate info

## Browser Console Checks

Open Developer Tools (F12) and check Console for these messages:

### Successful Load:
```
Looking up candidate with email: shreya.dasghosh@gmail.com
✓ Candidate found: Shreya Dasghosh
✓ Candidate information auto-populated
```

### No Match:
```
Looking up candidate with email: notfound@example.com
⚠️ No candidate found with email: notfound@example.com
```

### Error Loading:
```
Error loading candidate data: [error message]
```

## URL Generator Tool

Access the URL generator at:
```
https://trainingtwc.github.io/Prism/campus-url-generator.html
```

Features:
- ✅ Load all 75 IHM Mumbai candidates
- ✅ Generate personalized URLs
- ✅ Copy individual URLs
- ✅ Copy all URLs (tab-separated for Excel)
- ✅ Download CSV with all candidate data and URLs
- ✅ Download email template with personalized messages
- ✅ Toggle between Production and Local URLs

## Common Issues & Solutions

### Issue: Fields not auto-filling
**Solutions:**
1. Check if `IHM_Mumbai.json` exists in `/public` folder
2. Verify email in URL matches candidate database (case-insensitive)
3. Check browser console for errors
4. Ensure URL parameter is `EMPID` (not `empid` or `email`)

### Issue: "Failed to load candidate data file"
**Solutions:**
1. Verify file is in `/public/IHM_Mumbai.json`
2. Check file permissions
3. Clear browser cache
4. Check network tab in DevTools for 404 errors

### Issue: Fields auto-fill but remain editable
**Solutions:**
1. Check `candidateDataLoaded` state in React DevTools
2. Verify the disabled conditions in input fields
3. Ensure component re-renders after state update

## Local Development Testing

For local testing (Vite dev server):

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Use local URLs:
   ```
   http://localhost:5173/?EMPID=shreya.dasghosh@gmail.com
   ```

3. Check browser console for logs

4. Use React DevTools to inspect component state

## Sample All Candidates

Here are URLs for the first 10 candidates:

1. Adhiraj Bhatnagar: `?EMPID=adhirajbhatnagar06@gmail.com`
2. Aditya Goyal: `?EMPID=Adityagoyalihm@gmail.com`
3. Aditya Paul: `?EMPID=adityapaul7004@gmail.com`
4. Advaith Adarsh: `?EMPID=advaith.adarsh@gmail.com`
5. Ajay Singh: `?EMPID=singhajay73085@gmail.com`
6. Akshat Sardana: `?EMPID=sardanaakshat1@gmail.com`
7. Anand Kumar: `?EMPID=go4anandkumar20@gmail.com`
8. Aradhya Gupta: `?EMPID=Aradhya2006gupta@gmail.com`
9. Arindam Prakash: `?EMPID=arindam.prakash23@gmail.com`
10. Arkaprabho Chattopadhyay: `?EMPID=arkaprabhoch.2005@gmail.com`

## Production Deployment

After deploying to GitHub Pages:

1. Test at least 5 different candidate URLs
2. Verify on different browsers (Chrome, Firefox, Safari, Edge)
3. Test on mobile devices (iOS, Android)
4. Check Analytics/Logs for any errors
5. Send test invitation to dummy email
6. Complete full assessment flow

---

**Testing Status:** ✅ Ready for Testing
**Last Updated:** November 23, 2025
