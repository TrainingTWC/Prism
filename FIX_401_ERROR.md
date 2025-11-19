# 🔧 Fix 401 Unauthorized Error

## Current Issue
Getting `GitHub Models API error: 401 Unauthorized` even with token present.

## Root Cause
Your GitHub Personal Access Token may not have access to GitHub Models API, or needs different permissions.

---

## ✅ Solution 1: Use GitHub Models Token (Recommended)

GitHub Models requires a special token with model access:

### Step 1: Get Model Access
1. Go to **GitHub Models**: https://github.com/marketplace/models
2. Click **"Get started"** or **"Try GitHub Models"**
3. Sign in and accept the terms
4. You'll get access to the GitHub Models playground

### Step 2: Generate Token with Correct Permissions
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `TWC Prism AI Models`
4. Expiration: 90 days
5. **Select these scopes**:
   - ✅ `read:user`
   - ✅ `user:email`
6. Click **"Generate token"**
7. Copy the token immediately

### Step 3: Update .env File
```env
VITE_GITHUB_TOKEN=ghp_YOUR_NEW_TOKEN_HERE
```

### Step 4: Restart Dev Server
```powershell
# Press Ctrl+C to stop, then:
npm run dev
```

---

## ✅ Solution 2: Check Token Permissions

If you want to keep your current token:

1. Go to: https://github.com/settings/tokens
2. Find your token: `ghp_YOUR_TOKEN_REMOVED_FOR_SECURITY`
3. Click on it
4. Check if these are enabled:
   - ✅ `read:user`
   - ✅ `user:email`
5. If missing, click **"Update token"** and add them
6. If you can't update, generate a new one

---

## ✅ Solution 3: Try the Free Tier Alternative

If GitHub Models isn't available, use the free Azure OpenAI endpoint:

### Update aiInsightsService.ts

Replace the endpoint in both locations:

**Line ~147** and **Line ~890**:
```typescript
// OLD
const endpoint = 'https://models.inference.ai.azure.com/chat/completions';

// NEW - GitHub Models public endpoint
const endpoint = 'https://models.github.ai/v1/chat/completions';
```

---

## 🔍 Debug Steps

### 1. Test Your Token
Run this in PowerShell:

```powershell
$token = "ghp_YOUR_TOKEN_REMOVED_FOR_SECURITY"
$headers = @{
   "Authorization" = "Bearer $token"
   "Content-Type" = "application/json"
}

# Test endpoint
Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
```

**Success**: Shows your GitHub username and email  
**Fail**: Error about authentication

### 2. Check Browser Console
Look for these specific messages:

```
✅ Good:
🔍 Checking GitHub token availability: ✅ Token found
🚀 Attempting AI analysis with GitHub Models...
🌐 Using endpoint: https://models.inference.ai.azure.com/chat/completions

❌ Bad:
GitHub Models API error: 401 Unauthorized
```

### 3. Check Token Expiry
1. Go to: https://github.com/settings/tokens
2. Look at your token's expiration date
3. If expired or close to expiry, generate a new one

---

## 🎯 Quick Test

After fixing, you should see in console:

```
🔍 [NOVEMBER 2025] Checking GitHub token: ✅ Available
🚀 [NOVEMBER 2025] Attempting AI analysis...
🌐 [NOVEMBER 2025] Using endpoint: https://models.inference.ai.azure.com/chat/completions
✅ [NOVEMBER 2025] AI analysis successful!
```

And in the Monthly Analysis modal, instead of "Basic Analysis", you'll see actual AI-generated insights about TWC coffee shop operations.

---

## 🆘 Still Not Working?

If you've tried everything and still get 401:

### Option A: Use Fallback (Current State)
The app will automatically use "Basic Analysis" which still works, just without AI smarts.

### Option B: Use Different AI Service
We can switch to:
- OpenAI API (requires paid account)
- Azure OpenAI (free tier available)
- Claude API (Anthropic)
- Local LLM (free but slower)

Let me know which you prefer and I'll help you set it up!

---

## 📝 What's Happening

1. ✅ Token is present in .env
2. ✅ App reads token correctly
3. ✅ Code sends request to GitHub Models API
4. ❌ **GitHub API rejects it (401 Unauthorized)**
5. ⚠️ App falls back to "Basic Analysis"

The problem is between steps 3 and 4 - the token works for GitHub generally, but not for the Models API specifically.

---

## 💡 Recommended Action

**Generate a fresh token** with minimal permissions:
- `read:user`
- `user:email`

This often fixes permission issues better than trying to update an existing token.
