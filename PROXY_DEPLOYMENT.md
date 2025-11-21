Vercel / Serverless proxy deployment notes

This project uses a server-side proxy at `api/analyze.js` to call the GitHub Models endpoint so that the model token is never exposed to the browser.

Required secrets (do NOT commit these into the repository):
- `VERCEL_TOKEN` — API token for the Vercel GitHub Action (store in GitHub Secrets)
- `VERCEL_ORG_ID` — Your Vercel organization id (GitHub Secret)
- `VERCEL_PROJECT_ID` — Your Vercel project id (GitHub Secret)
- `VITE_GITHUB_TOKEN` or `GITHUB_MODELS_TOKEN` — GitHub Models token. Set this in your Vercel Project → Settings → Environment Variables for Production.

Quick steps
1. Add Vercel GitHub Action secrets
   - Go to your GitHub repo → Settings → Secrets → Actions and add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.
   - The workflow `.github/workflows/deploy-vercel.yml` will deploy on pushes to `main` using these secrets.

2. Add the GitHub Models token in Vercel
   - Go to your Vercel project → Settings → Environment Variables.
   - Add a new variable named `VITE_GITHUB_TOKEN` (or `GITHUB_MODELS_TOKEN`) with your GitHub Models token as the value. Set it for the Production environment.
   - Redeploy (push to `main` will also redeploy automatically once GitHub Actions runs).

3. Test the deployed endpoint
   - After the deployment completes, call the serverless endpoint to verify it returns model output.

PowerShell example (replace <DEPLOY_URL> with your Vercel URL):

```powershell
$body = @{
  model = 'gpt-4o-mini'
  messages = @(@{role='user'; content='Give me a 1-sentence summary: the shop had low staff and multiple training misses.'})
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method POST -Uri 'https://<DEPLOY_URL>/api/analyze' -ContentType 'application/json' -Body $body
```

If you get a 500 with message `Server misconfigured: missing token`, set the `VITE_GITHUB_TOKEN` in Vercel and redeploy.

If you get repeated 429 / rate-limit errors in logs, consider:
- Adding a centralized rate limiter (Redis token-bucket) used by the serverless calls.
- Running a single always-on proxy VM/container to hold a global in-process queue.
- Increasing caching for repeated prompts.

Notes
- The GitHub Action uses the `amondnet/vercel-action` which requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets. See the action's docs if you prefer a different deploy strategy.
- The `api/analyze.js` already includes retry/backoff logic to reduce transient 429 fallout — monitor Vercel function logs for repeated failures.
