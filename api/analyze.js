import fetch from 'node-fetch';

// Vercel serverless function handler
// For Vercel place this file under /api/analyze.js
export default async function handler(req, res) {
  // Basic CORS + preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_MODELS_TOKEN;
  if (!token) {
    console.error('Server misconfigured: missing GitHub Models token (VITE_GITHUB_TOKEN / GITHUB_MODELS_TOKEN)');
    return res.status(500).json({ error: 'Server misconfigured: missing token' });
  }

  // Retry/backoff configuration
  const MAX_RETRIES = 3; // number of retries after the initial attempt
  const BASE_DELAY_MS = 700; // base backoff
  const MAX_BODY_LOG = 4096;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Helper to perform the upstream call with retries on 429/5xx/network errors
  async function callUpstreamWithRetries(payload) {
    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      attempt += 1;
      try {
        console.log(`[proxy] attempt=${attempt} POST https://models.github.ai/v1/chat/completions`);
        const upstream = await fetch('https://models.github.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'TWC-Prism-Dashboard'
          },
          body: JSON.stringify(payload),
          // Do not follow redirects automatically in serverless contexts
          redirect: 'manual'
        });

        const text = await upstream.text();
        const snippet = String(text).slice(0, MAX_BODY_LOG);
        console.log(`[proxy] upstream status=${upstream.status} attempt=${attempt} bodySnippet=${snippet}`);

        // Success path
        if (upstream.ok) {
          try {
            const data = JSON.parse(text);
            return { ok: true, status: upstream.status, data };
          } catch (parseErr) {
            // Upstream returned 200 but non-JSON body
            console.warn('[proxy] upstream returned 200 but body is not JSON');
            return { ok: false, status: 502, body: String(text).slice(0, 8192), error: 'Upstream returned non-JSON' };
          }
        }

        // Retryable status codes: 429 (rate limit), 502, 503, 504
        if ([429, 502, 503, 504].includes(upstream.status)) {
          if (attempt > MAX_RETRIES) {
            // give up and return the last non-ok response
            try {
              const errObj = JSON.parse(text);
              return { ok: false, status: upstream.status, body: errObj };
            } catch (_) {
              return { ok: false, status: upstream.status, body: String(text).slice(0, 8192) };
            }
          }

          // compute exponential backoff with jitter
          const backoff = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), 8000);
          const jitter = Math.floor(Math.random() * 300);
          const wait = backoff + jitter;
          console.warn(`[proxy] retryable status=${upstream.status} attempt=${attempt}, backing off ${wait}ms`);
          await sleep(wait);
          continue; // retry
        }

        // Non-retryable non-ok response: return parsed error if possible
        try {
          const errObj = JSON.parse(text);
          return { ok: false, status: upstream.status, body: errObj };
        } catch (parseErr) {
          return { ok: false, status: upstream.status, body: String(text).slice(0, 8192) };
        }
      } catch (networkErr) {
        // network-level error (e.g., connection reset) -> retry
        console.error(`[proxy] network error on attempt=${attempt}:`, networkErr && networkErr.message);
        if (attempt > MAX_RETRIES) {
          return { ok: false, status: 500, body: networkErr.message || String(networkErr) };
        }
        const wait = BASE_DELAY_MS * attempt + Math.floor(Math.random() * 200);
        await sleep(wait);
      }
    }
    return { ok: false, status: 500, body: 'Unknown proxy failure' };
  }

  try {
    const result = await callUpstreamWithRetries(req.body);

    if (result.ok) {
      return res.status(200).json(result.data);
    }

    // result not ok: forward status and body as-is where possible
    const status = result.status || 502;
    // If body is already an object (parsed JSON), forward it directly
    if (typeof result.body === 'object') {
      return res.status(status).json(result.body);
    }

    return res.status(status).json({ error: 'Upstream error', message: String(result.body).slice(0, 8192) });
  } catch (err) {
    console.error('[proxy] unexpected handler error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Proxy error', message: err && err.message ? err.message : String(err) });
  }
}
