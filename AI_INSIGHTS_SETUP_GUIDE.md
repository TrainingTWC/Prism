# 🤖 AI Insights Setup Guide

**Current Status**: ❌ AI Insights Disabled (showing "Basic Analysis")

## Why You're Seeing "Basic Analysis"

The app is currently using **fallback analysis** instead of AI because the GitHub token is not configured. AI-powered insights require a GitHub Personal Access Token to access GitHub Models API.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your GitHub Token

1. Go to **GitHub Settings**: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a name like `"TWC Prism AI Insights"`
4. Select **expiration** (90 days recommended)
5. **Required permissions**:
   - ✅ `repo` (if private repo)
   - ✅ `read:user`
   - ✅ `user:email`
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't see it again!)
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Create .env File

1. In the Prism folder, create a new file named **`.env`** (no extension)
2. Add this line:
   ```
   VITE_GITHUB_TOKEN=ghp_your_actual_token_here
   ```
3. Replace `ghp_your_actual_token_here` with your actual token
4. Save the file

**Example .env file:**
```env
VITE_GITHUB_TOKEN=ghp_Ab3Cd4Ef5Gh6Ij7Kl8Mn9Op0Qr1St2Uv3Wx4Yz5
```

### Step 3: Restart the Development Server

1. **Stop** the current dev server (Ctrl+C in terminal)
2. **Start** it again:
   ```powershell
   npm run dev
   ```
3. Refresh your browser

---

## ✅ Verify AI is Working

After setup, check the browser console (F12):

**With AI enabled:**
```
🔍 Checking GitHub token availability: ✅ Token found
🚀 Attempting AI analysis with GitHub Models...
```

**Without AI (current state):**
```
⚠️ No GitHub token found. Set VITE_GITHUB_TOKEN in .env file. Using basic fallback analysis.
```

---

## 🎯 What Changes When AI is Enabled?

### Current Output (Basic Analysis)
❌ Generic insights:
- "Positive feedback during NOVEMBER 2025"
- "Standard performance maintained"

### With AI (GitHub Models)
✅ **Coffee-specific insights**:
- "Not enough baristas during morning coffee rush (7-11 AM)"
- "Espresso machine maintenance improving service quality"
- "RESPECT badge recognition boosting team morale"
- "ZingLearn training on latte art showing results"
- "Weekly offs (4/month) being scheduled fairly"
- "Good AM support during peak hours"

---

## 🔧 Troubleshooting

### Problem: Still showing "Basic Analysis"

**Check 1: Token is in .env file**
```powershell
Get-Content .env
```
Should show: `VITE_GITHUB_TOKEN=ghp_...`

**Check 2: Variable name is correct**
- Must be `VITE_GITHUB_TOKEN` (not `GITHUB_TOKEN`)
- Vite requires `VITE_` prefix for browser access

**Check 3: Server was restarted**
- Stop dev server (Ctrl+C)
- Start again (`npm run dev`)
- Changes to .env require restart

**Check 4: Token is valid**
- Test token at: https://github.com/settings/tokens
- Should show "Active" status
- Not expired

### Problem: API Error in Console

**Error: 401 Unauthorized**
- Token is invalid or expired
- Generate a new token from GitHub

**Error: 403 Forbidden**
- Token doesn't have required permissions
- Regenerate with correct scopes

**Error: 429 Too Many Requests**
- Rate limit exceeded
- Wait 1 hour or use different token

---

## 📊 AI vs Basic Analysis Comparison

| Feature | Basic Analysis | AI Analysis |
|---------|---------------|-------------|
| **Context** | Generic workplace | TWC coffee shops |
| **Terminology** | General terms | Barista, espresso, ZingLearn |
| **Specificity** | Vague ("issues exist") | Specific ("espresso machine breakdowns") |
| **Programs** | None mentioned | RESPECT badges, Bench Planning, HR Connect |
| **Root Causes** | Surface level | Deep operational insights |
| **Actionability** | Low | High (specific recommendations) |
| **Monthly Trends** | Basic scoring | Seasonal patterns, specific incidents |

---

## 🔐 Security Notes

### ⚠️ Keep Your Token Safe
- **Never** commit `.env` file to Git (it's in .gitignore)
- **Never** share your token in screenshots or messages
- **Never** push to public repositories
- Token gives access to your GitHub account

### ✅ Best Practices
- Use short expiration (30-90 days)
- Regenerate periodically
- Revoke immediately if exposed
- Use token only for this app

---

## 💰 GitHub Models API Pricing

**Current Model**: `gpt-4o-mini`
- ✅ **FREE tier available** for personal use
- ✅ No credit card required initially
- ✅ Generous rate limits for development

Check GitHub Models pricing: https://github.com/marketplace/models

---

## 📝 Example: Before & After

### Before (Current - Basic Analysis)
```
WHAT WENT WELL
1. Positive feedback during NOVEMBER 2025
   Staff specifically mentioned positive experiences in their comments during 
   NOVEMBER 2025. This indicates good management support and work environment 
   during this period.

2. Standard performance maintained
   Basic work standards and procedures were followed during NOVEMBER 2025, 
   ensuring consistent service delivery and operational continuity.
```

### After (With AI)
```
WHAT WENT WELL
1. Good barista staffing during morning rush
   Area Manager scheduled enough baristas for the 7-11 AM coffee rush in 
   November. This reduced work pressure and allowed staff to maintain quality 
   espresso preparation and customer service without feeling overwhelmed.

2. RESPECT badge program boosting morale
   Staff received RESPECT badges for Service Excellence and Collaboration during 
   November. This recognition program is working well and making employees feel 
   valued for their coffee expertise and teamwork.

3. ZingLearn training improving latte art skills
   New ZingLearn training modules on latte art and milk steaming helped baristas 
   improve their coffee preparation skills. Staff mentioned they feel more 
   confident serving specialty drinks after completing the training.
```

---

## 🚀 Next Steps

1. ✅ **Create .env file** with your GitHub token
2. ✅ **Restart dev server** to load the token
3. ✅ **Check browser console** for AI status messages
4. ✅ **View Monthly Analysis modal** - should show AI-powered insights
5. ✅ **Review insights** - should mention TWC-specific terms (barista, espresso, ZingLearn)

---

## 📞 Need Help?

If you're still seeing "Basic Analysis" after following these steps:

1. Open browser console (F12)
2. Look for AI status messages (🔍, 🚀, ❌, ⚠️)
3. Share the console output for debugging

The console logs will clearly show:
- ✅ Token found / ❌ Token missing
- 🚀 AI attempt / ⚠️ Using fallback
- ❌ Any API errors with details

---

## ✨ Summary

**Current State**: Basic fallback analysis (generic insights)  
**With AI**: Context-aware, coffee-specific insights using TWC operations knowledge  
**Setup Time**: ~5 minutes  
**Cost**: Free (GitHub Models API)  
**Benefit**: Much better, actionable insights for TWC café management
