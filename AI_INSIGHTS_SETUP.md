# AI Insights Setup Guide

## Overview
The Area Manager Scorecards now use AI to analyze employee survey remarks and generate actionable insights automatically.

## Features
- **Automatic Analysis**: AI analyzes all employee remarks and survey responses
- **3 Positive Points**: Highlights key strengths and positive feedback
- **3 Improvement Areas**: Identifies actionable areas for improvement
- **Smart Caching**: Results are cached for 30 minutes to reduce API calls
- **Fallback Analysis**: If AI is unavailable, uses statistical analysis

## AI Provider Options

### Option 1: GitHub Models (Recommended)
GitHub provides free access to GPT-4o and other models for testing.

**Setup Steps:**
1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "Prism AI Insights"
4. Set expiration and select scopes (basic read permissions sufficient)
5. Copy the generated token

**Environment Variable Setup:**
1. Create a `.env` file in your project root (copy from `.env.example`)
2. Add your token: `GITHUB_TOKEN=your_token_here`
3. Never commit the `.env` file to version control
4. Select scopes: `repo` (if using private repos) or no special scopes needed for public
5. Generate and copy the token (starts with `ghp_`)

**To Use in Prism:**
1. Open Prism dashboard
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run: `localStorage.setItem('github_token', 'ghp_YOUR_TOKEN_HERE')`
5. Refresh the page

**Endpoint:** `https://models.inference.ai.azure.com/chat/completions`
**Model:** GPT-4o
**Cost:** Free (with rate limits)

### Option 2: Local Analysis (Automatic Fallback)
If no AI token is configured, the system automatically uses statistical analysis based on:
- Average scores per question
- Response patterns
- Keyword frequency
- Score thresholds

**No setup required** - works out of the box!

## How It Works

### Data Collection
The system analyzes:
- Question remarks (q1_remarks through q12_remarks)
- Question 11 (suggestions textarea)
- Survey scores for context
- Response patterns across all submissions

### AI Analysis (with GitHub Models)
1. Collects up to 30 most recent remarks
2. Sends to GPT-4o with context about average scores
3. AI identifies themes and patterns
4. Returns exactly 3 positives and 3 negatives
5. Results are cached for 30 minutes

### Local Analysis (Fallback)
1. Calculates average score per question
2. Maps high-scoring questions (≥3.5) to positive themes
3. Maps low-scoring questions (≤2.5) to improvement themes
4. Prioritizes by frequency and severity

## Question Theme Mapping

| Question | Positive Theme | Negative Theme |
|----------|---------------|----------------|
| Q1 | Manageable workload | High work pressure |
| Q2 | Strong empowerment | Limited autonomy |
| Q3 | Regular feedback | Inconsistent feedback |
| Q4 | Fair treatment | Partiality concerns |
| Q5 | Effective training | Training gaps |
| Q6 | Smooth operations | Technical issues |
| Q7 | Good policy awareness | Policy communication needed |
| Q8 | Satisfied with schedule | Schedule issues |
| Q9 | Excellent collaboration | Coordination needed |
| Q12 | Positive TWC experience | Experience needs enhancement |

## Customization

### Adjust Cache Duration
Edit `aiInsightsService.ts`:
```typescript
const CACHE_DURATION = 30 * 60 * 1000; // Change to desired milliseconds
```

### Use Different AI Model
Edit `aiInsightsService.ts`:
```typescript
model: 'gpt-4o', // Change to 'gpt-4', 'gpt-3.5-turbo', etc.
```

### Adjust Analysis Prompt
Edit the prompt in `analyzeWithGitHubModels()` function to customize how the AI analyzes data.

## Troubleshooting

### "Analyzing employee feedback..." shows indefinitely
- Check browser console for errors
- Verify GitHub token is valid: `localStorage.getItem('github_token')`
- System will use fallback analysis after timeout

### Getting default insights instead of AI insights
- AI analysis may have failed (check console)
- GitHub token might be invalid or expired
- Rate limit may have been reached
- System automatically uses fallback - no action needed

### Want to force refresh insights
Clear the cache:
```javascript
// In browser console
localStorage.removeItem('insights_cache');
```

Or wait 30 minutes for automatic cache expiry.

## Security Notes

⚠️ **Important Security Considerations:**

1. **GitHub Token Storage**: 
   - Currently stored in localStorage (client-side)
   - Consider moving to secure backend in production
   - Never commit tokens to version control

2. **Rate Limits**:
   - GitHub Models has rate limits
   - Caching reduces API calls
   - Fallback analysis always available

3. **Data Privacy**:
   - Employee remarks are sent to AI for analysis
   - Ensure compliance with data privacy policies
   - Consider anonymizing sensitive data

## Future Enhancements

Potential improvements:
- [ ] Backend API for secure token management
- [ ] Support for other AI providers (OpenAI, Anthropic, etc.)
- [ ] Sentiment analysis visualization
- [ ] Trend analysis across multiple months
- [ ] Customizable insight templates
- [ ] Multi-language support

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify token setup
3. Try clearing cache and refreshing
4. System will always work with fallback analysis

## API Reference

### `generateAMInsights(submissions)`
Generates insights for a given set of submissions.

**Parameters:**
- `submissions` (Array): Array of submission objects

**Returns:**
- `Promise<InsightResult>`: Object with `positives` and `negatives` arrays

### `getCachedAMInsights(amId, submissions)`
Gets insights with caching support.

**Parameters:**
- `amId` (string): Area Manager ID
- `submissions` (Array): Array of submission objects

**Returns:**
- `Promise<InsightResult>`: Cached or newly generated insights

## Example Output

### With AI (GitHub Models):
```json
{
  "positives": [
    "Team shows strong collaboration and mutual support",
    "Effective handling of customer issues",
    "Good adherence to operational standards"
  ],
  "negatives": [
    "Training schedule needs better coordination",
    "Break timing adjustments required",
    "Communication about policy changes can improve"
  ]
}
```

### With Fallback Analysis:
```json
{
  "positives": [
    "Fair and equal treatment across team",
    "Satisfied with work schedules and timings",
    "Excellent team collaboration and support"
  ],
  "negatives": [
    "Gaps in training delivery and frequency",
    "High work pressure affecting employee wellbeing",
    "Team coordination needs improvement"
  ]
}
```
