/**
 * Simple proxy server for GitHub Models API
 * Handles CORS issues by proxying requests from browser to GitHub Models
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3002;

// Enable CORS for all origins (restrict in production)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server is running' });
});

// Proxy endpoint for GitHub Models API
app.post('/api/ai/analyze', async (req, res) => {
  const token = process.env.VITE_GITHUB_TOKEN;
  
  if (!token) {
    return res.status(500).json({ 
      error: 'GitHub token not configured',
      message: 'Please set VITE_GITHUB_TOKEN in .env file'
    });
  }

  try {
    console.log('🚀 Proxying request to GitHub Models API...');
    console.log('Request body size:', JSON.stringify(req.body).length, 'bytes');
    
    // Validate request body
    if (!req.body || !req.body.model || !req.body.messages) {
      console.error('❌ Invalid request body');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request must include model and messages'
      });
    }
    
    const response = await fetch('https://models.github.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'TWC-Prism-Dashboard'
      },
      body: JSON.stringify(req.body)
    });

    // Get response as text first to handle non-JSON errors
    const text = await response.text();
    
    if (!response.ok) {
      console.error(`❌ GitHub Models API error: ${response.status} ${response.statusText}`);
      console.error('Response:', text);
      
      // Try to parse as JSON, fallback to text
      try {
        const errorData = JSON.parse(text);
        return res.status(response.status).json(errorData);
      } catch {
        return res.status(response.status).json({ 
          error: response.statusText,
          message: text,
          status: response.status
        });
      }
    }

    // Parse successful response
    const data = JSON.parse(text);
    console.log('✅ GitHub Models API success');
    res.json(data);
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🤖 AI Insights Proxy Server                              ║
║                                                           ║
║  Status: ✅ Running on http://localhost:${PORT}            ║
║                                                           ║
║  This proxy forwards requests from your React app         ║
║  to GitHub Models API, solving CORS issues.               ║
║                                                           ║
║  Endpoints:                                               ║
║    GET  /health          - Health check                   ║
║    POST /api/ai/analyze  - AI analysis proxy              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
