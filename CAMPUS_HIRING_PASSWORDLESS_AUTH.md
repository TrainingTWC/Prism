# Campus Hiring - Password-Free Authentication

## Overview
Campus hiring candidates with valid email addresses in the IHM_Mumbai.json database now have **passwordless authentication** - they are automatically logged in and taken directly to the assessment.

## How It Works

### Previous Flow (With Password):
1. Candidate clicks URL: `?EMPID=shreya.dasghosh@gmail.com`
2. System validates employee ID
3. **Login screen appears** ⚠️
4. User must enter password
5. After password, access to assessment

### New Flow (Passwordless):
1. Candidate clicks URL: `?EMPID=shreya.dasghosh@gmail.com`
2. System checks if email exists in IHM_Mumbai.json
3. ✅ **If found: Auto-authenticate as 'campus-hiring' role**
4. 🚀 **Directly taken to assessment** (no password required!)
5. Candidate information auto-populated

### For Non-Candidates:
- Other employee IDs still require password authentication
- Regular employees follow normal login flow
- Campus hiring candidates are the only exception

## Technical Implementation

### Authentication Logic (AuthContext.tsx)

```typescript
// When user accesses with EMPID parameter:
1. Check if email exists in IHM_Mumbai.json candidates list
2. If YES:
   - Auto-authenticate with 'campus-hiring' role
   - Set authentication tokens in localStorage
   - Mark as authenticated (bypass password)
   - Mark employee as validated
   - Direct to assessment
3. If NO:
   - Follow normal employee validation flow
   - Require password for authentication
```

### Security Features

✅ **Candidate Verification**
- Email must exactly match IHM_Mumbai.json database
- Case-insensitive matching
- Prevents unauthorized access

✅ **Role-Based Access**
- Authenticated as 'campus-hiring' role only
- Limited to assessment features
- Cannot access other dashboards

✅ **Session Management**
- Session tokens stored in localStorage
- Standard session expiration applies
- Secure logout functionality

## Benefits

### For Candidates
- ✅ **Zero friction** - Click link and start assessment immediately
- ✅ **No password to remember** - Eliminates password complexity
- ✅ **Faster start time** - Reduces abandonment rate
- ✅ **Better experience** - Professional and streamlined

### For Administrators
- ✅ **Reduced support queries** - No "forgot password" issues
- ✅ **Higher completion rates** - Fewer barriers to entry
- ✅ **Simplified process** - Easier to explain to candidates
- ✅ **Better tracking** - Direct link to candidate identity

### For System
- ✅ **Controlled access** - Only verified candidates auto-authenticate
- ✅ **Secure** - Database-backed verification
- ✅ **Auditable** - All authentication events logged
- ✅ **Scalable** - Easy to add more campus databases

## URL Examples

### Campus Hiring Candidates (Passwordless)
```
https://trainingtwc.github.io/Prism/?EMPID=shreya.dasghosh@gmail.com
→ Auto-authenticated, direct to assessment ✅

https://trainingtwc.github.io/Prism/?EMPID=adhirajbhatnagar06@gmail.com
→ Auto-authenticated, direct to assessment ✅

https://trainingtwc.github.io/Prism/?EMPID=Adityagoyalihm@gmail.com
→ Auto-authenticated, direct to assessment ✅
```

### Regular Employees (Requires Password)
```
https://trainingtwc.github.io/Prism/?EMPID=employee123@company.com
→ Employee validated, password required ⚠️

https://trainingtwc.github.io/Prism/?EMPID=manager@company.com
→ Employee validated, password required ⚠️
```

## Database Structure

### IHM_Mumbai.json
```json
{
  "institution": "IHM Mumbai",
  "candidates": [
    {
      "name": "Shreya Dasghosh",
      "phone": "9831664676",
      "email": "shreya.dasghosh@gmail.com",
      "institution": "IHM Mumbai"
    }
  ],
  "totalCandidates": 75,
  "accessLevel": "campus_hire_assessment"
}
```

Only emails in this list get passwordless authentication.

## Console Logs

When a campus candidate accesses the system:

```
[Auth] Attempting login with EMPID: shreya.dasghosh@gmail.com
[Auth] Checking if email is campus hiring candidate: shreya.dasghosh@gmail.com
[Auth] Loaded campus candidates from: /IHM_Mumbai.json
[Auth] ✅ Found campus candidate: Shreya Dasghosh
[Auth] ✅ Campus hiring candidate detected - auto-authenticating
[Auth] Campus hiring candidate auto-authenticated successfully
```

## Adding More Campuses

To extend passwordless authentication to other campuses:

1. **Create new JSON file** (e.g., `IHM_Bangalore.json`)
2. **Place in `/public` folder**
3. **Update `checkCampusHiringCandidate` function** to check multiple files:

```typescript
const candidateDatabases = [
  '/IHM_Mumbai.json',
  '/IHM_Bangalore.json',
  '/IHM_Chennai.json'
];
```

## Testing

### Test Passwordless Authentication:
1. Open browser in incognito/private mode
2. Navigate to: `http://localhost:5173/?EMPID=shreya.dasghosh@gmail.com`
3. ✅ Should go directly to assessment (no password prompt)
4. ✅ Candidate info should be auto-populated
5. ✅ Assessment should be accessible immediately

### Test Regular Employee:
1. Open browser in incognito/private mode
2. Navigate to: `http://localhost:5173/?EMPID=notinlist@example.com`
3. ⚠️ Should show login screen (password required)
4. ⚠️ Cannot proceed without valid password

## Security Considerations

### ✅ Strengths:
- Database-backed verification
- Limited to specific role
- Session management maintained
- All access logged
- Cannot access other features

### ⚠️ Considerations:
- Email in URL is visible (not encrypted)
- Anyone with the link can access that candidate's assessment
- Consider link expiration for production
- Monitor for shared links

### 🔒 Best Practices:
- Send links via secure email only
- Use HTTPS in production
- Monitor access logs
- Implement link expiration (future enhancement)
- Track submission timestamps

## Future Enhancements

Potential improvements:

1. **Time-limited URLs**
   - Add expiration timestamp to URL
   - Validate link hasn't expired
   - Automatic invalidation after deadline

2. **One-time Use Links**
   - Mark link as "used" after assessment submission
   - Prevent multiple submissions with same link

3. **IP Tracking**
   - Log IP address of assessment taker
   - Detect suspicious activity
   - Alert on multiple IP usage

4. **Email Verification**
   - Send OTP to candidate's email
   - Verify email ownership before assessment
   - Additional security layer

5. **Multiple Campus Support**
   - Auto-detect campus from email domain
   - Support multiple campus databases
   - Unified reporting across campuses

## Troubleshooting

### Issue: Candidate still seeing login screen
**Cause:** Email not found in IHM_Mumbai.json
**Solution:** 
- Verify email spelling matches exactly
- Check IHM_Mumbai.json file is accessible
- Check browser console for error messages

### Issue: Auto-authentication not working
**Cause:** JSON file not loading
**Solution:**
- Verify file is in `/public/IHM_Mumbai.json`
- Check browser console for fetch errors
- Try different path in `checkCampusHiringCandidate`

### Issue: Redirected after authentication
**Cause:** Role mapping issue
**Solution:**
- Verify 'campus-hiring' role exists in AUTH_CONFIG
- Check roleMapping.ts configuration
- Review console logs for errors

## Support

For issues or questions:
- Check browser console (F12) for detailed logs
- Verify candidate email in IHM_Mumbai.json
- Test with known working email
- Contact system administrator

---

**Feature Version:** 2.0 - Passwordless Authentication
**Last Updated:** November 23, 2025
**Status:** ✅ Active
