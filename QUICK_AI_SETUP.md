# 🚀 Quick Setup - AI Insights

## You're seeing "Basic Analysis" because the GitHub token is not set.

### Fix in 3 Steps:

1️⃣ **Get GitHub Token**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select permissions: `repo`, `read:user`, `user:email`
   - Copy the token (starts with `ghp_`)

2️⃣ **Create .env File**
   ```
   VITE_GITHUB_TOKEN=ghp_your_token_here
   ```
   - Create file named `.env` in Prism folder
   - Paste your token

3️⃣ **Restart Dev Server**
   ```powershell
   # Stop server (Ctrl+C), then:
   npm run dev
   ```

---

## Check Browser Console (F12)

**Working**: `🔍 Checking GitHub token availability: ✅ Token found`  
**Not Working**: `⚠️ No GitHub token found. Set VITE_GITHUB_TOKEN in .env file`

---

## What Changes?

**Before (Current)**:
- ❌ "Positive feedback during NOVEMBER 2025"
- ❌ "Standard performance maintained"

**After (AI Enabled)**:
- ✅ "Not enough baristas during morning coffee rush"
- ✅ "Espresso machine maintenance improving quality"
- ✅ "RESPECT badges boosting team morale"
- ✅ "ZingLearn latte art training showing results"

---

**Full Guide**: See `AI_INSIGHTS_SETUP_GUIDE.md`
