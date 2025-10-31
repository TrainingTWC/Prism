/** Simple proxy server to handle Apps Script CORS issues
 * Run this with Node.js and point the form submissions here instead.
 * The proxy will handle preflight and forward requests to Apps Script.
 */
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGWl1Il2M5ZIqpeIOmLa5Nh8Hht-JS2A2z267-0i93-lcQxGmMJU6fN19Fx-JL7mx02A/exec';
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Forward POST requests to Apps Script
app.post('/submit', async (req, res) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Forward GET requests (for response fetching)
app.get('/*', async (req, res) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL + req.url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`CORS proxy running on http://localhost:${PORT}`);
  console.log(`Point your form submissions to http://localhost:${PORT}/submit`);
});