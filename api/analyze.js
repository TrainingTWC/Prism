import fetch from 'node-fetch';

// Vercel serverless function handler
// For Vercel place this file under /api/analyze.js
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // allow simple CORS preflight if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_MODELS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server misconfigured: missing token' });
  }

  try {
    // Forward incoming body to GitHub Models endpoint
    const upstream = await fetch('https://models.github.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'TWC-Prism-Dashboard'
      },
      body: JSON.stringify(req.body)
    });

    const text = await upstream.text();
    // Log a short snippet for debugging (will appear in provider logs)
    console.log('Upstream status', upstream.status, String(text).slice(0, 1024));

    if (!upstream.ok) {
      // Try parse JSON error, otherwise return raw text snippet
      try {
        const errObj = JSON.parse(text);
        return res.status(upstream.status).json(errObj);
      } catch (parseErr) {
        return res.status(upstream.status).json({
          error: upstream.statusText || 'Upstream error',
          message: String(text).slice(0, 8192)
        });
      }
    }

    // Parse and forward successful JSON response
    try {
      const data = JSON.parse(text);
      // Set permissive CORS for now; lock to your frontend origin in production
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(data);
    } catch (parseErr) {
      return res.status(502).json({ error: 'Upstream returned non-JSON', message: String(text).slice(0, 8192) });
    }
  } catch (err) {
    console.error('Proxy error', err);
    return res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}
