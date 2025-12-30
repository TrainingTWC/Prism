# GitHub Secrets Setup Guide

To make the employee list and other features work on GitHub Pages, you need to configure GitHub Secrets with your environment variables.

## Steps to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button

## Required Secrets

Add each of the following secrets one by one:

### 1. VITE_SUPABASE_URL
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `<your_supabase_project_url>`
- **Note:** Get from your Supabase project settings
- Click **Add secret**

### 2. VITE_SUPABASE_ANON_KEY
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `<your_supabase_anon_key>`
- **Note:** Get from your Supabase project API settings
- Click **Add secret**

### 3. VITE_GITHUB_TOKEN
- **Name:** `VITE_GITHUB_TOKEN`
- **Value:** `<your_github_personal_access_token>`
- **Note:** Get your token from: https://github.com/settings/tokens
- Click **Add secret**

### 4. VITE_TRAINER_CALENDAR_SCRIPT_URL
- **Name:** `VITE_TRAINER_CALENDAR_SCRIPT_URL`
- **Value:** `<your_trainer_calendar_apps_script_url>`
- **Note:** Deploy your Google Apps Script and copy the web app URL
- Click **Add secret**

### 5. VITE_STORE_MAPPING_SCRIPT_URL
- **Name:** `VITE_STORE_MAPPING_SCRIPT_URL`
- **Value:** `<your_store_mapping_apps_script_url>`
- **Note:** Deploy your Google Apps Script and copy the web app URL
- Click **Add secret**

### 6. VITE_SUPABASE_EMPLOYEE_TABLE
- **Name:** `VITE_SUPABASE_EMPLOYEE_TABLE`
- **Value:** `Emp. Master 2`
- Click **Add secret**

## Verify Secrets

After adding all secrets, you should see them listed under "Repository secrets". They will show as:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_SUPABASE_EMPLOYEE_TABLE
- VITE_GITHUB_TOKEN
- VITE_TRAINER_CALENDAR_SCRIPT_URL
- VITE_STORE_MAPPING_SCRIPT_URL

## Re-deploy

After adding the secrets:

1. Go to **Actions** tab
2. Click on the latest workflow run
3. Click **Re-run all jobs**

OR

1. Make any small change to your code (add a comment)
2. Commit and push to trigger a new deployment

The employee list should now load correctly on GitHub Pages!

## Troubleshooting

**Employee list still not showing?**
- Check browser console for errors (F12)
- Verify all secrets are added correctly (no extra spaces)
- Make sure the workflow ran after adding secrets
- Check if Supabase database has employee data

**How to check if secrets are working?**
- In the Actions tab, click on a workflow run
- Expand the "Build" step
- You should see the build complete without errors
- The environment variables will not be visible in logs (they're masked for security)
