// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

// CORS + JSON
app.use(cors({ origin: true, methods: ['POST', 'GET', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '1mb' }));

// --- sanity route (helps verify Cloud Run is serving your app) ---
app.get('/', (_req, res) => res.send('gemini-proxy OK'));

// Return 405 if someone hits /generate with anything but POST
app.all('/generate', (req, res, next) => {
  if (req.method === 'POST') return next();
  return res.status(405).send('Use POST on /generate');
});

// ---- config ----
const API_VERSION = 'v1';               // keep v1 unless your key only lists v1beta
const MODEL       = 'gemini-2.5-flash'; // you said 2.5 works for you
// -----------------

// quick visibility that the env var is present (check Cloud Run logs)
console.log('GEMINI_API_KEY prefix:', String(process.env.GEMINI_API_KEY || '').slice(0, 6) || 'MISSING');

// Extract readable text from Gemini 2.5 responses (handles non-text parts)
function extractTextFromGemini(json) {
  const blockReason = json?.promptFeedback?.blockReason;
  if (blockReason) return `Response was blocked: ${blockReason}`;

  const cands = json?.candidates;
  if (!Array.isArray(cands) || !cands.length) return '(no response)';

  const parts = cands[0]?.content?.parts || [];
  const out = [];

  for (const p of parts) {
    if (!p) continue;

    // Text part
    if (typeof p.text === 'string' && p.text.trim()) {
      out.push(p.text.trim());
      continue;
    }

    // Inline text data (e.g., base64 text/*)
    if (p.inlineData?.mimeType?.startsWith('text/') && p.inlineData?.data) {
      try {
        const decoded = Buffer.from(p.inlineData.data, 'base64').toString('utf8').trim();
        if (decoded) out.push(decoded);
      } catch {}
      continue;
    }

    // Tool / function call — render a readable stub
    if (p.functionCall) {
      const { name, args } = p.functionCall;
      out.push(`(tool call) ${name || 'function'} ${args ? JSON.stringify(args) : ''}`.trim());
      continue;
    }

    // Executable code (some modes return code blocks)
    if (p.executableCode?.language || p.executableCode?.code) {
      const lang = p.executableCode.language || 'code';
      const code = p.executableCode.code || '';
      out.push(`\`\`\`${lang}\n${code}\n\`\`\``);
      continue;
    }

    // Other inline data — acknowledge
    if (p.inlineData?.mimeType && p.inlineData?.data) {
      out.push(`(inline ${p.inlineData.mimeType}, ${p.inlineData.data.length} bytes)`);
    }
  }

  if (!out.length) {
    const candBlock = cands[0]?.safetyRatings?.find(r => r.blocked)?.category;
    if (candBlock) return `Response was blocked by safety: ${candBlock}`;
  }

  return out.join('\n').trim() || '(no response)';
}

// Main endpoint your frontend calls
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt (string)' });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      // Make it obvious in logs if Cloud Run env is missing
      console.error('Missing GEMINI_API_KEY on server');
      return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    }

    const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${encodeURIComponent(MODEL)}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 1.0,
        topK: 40,
        maxOutputTokens: 768
      }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const textBody = await r.text();
    if (!r.ok) {
      // Bubble up Gemini error body for easier debugging in the browser console
      return res.status(r.status).send(textBody);
    }

    let json;
    try {
      json = JSON.parse(textBody);
    } catch {
      return res.status(502).send('Upstream parse error');
    }

    const text = extractTextFromGemini(json);
    return res.json({ response: { content: text } });
  } catch (e) {
    console.error('Gemini proxy error:', e);
    return res.status(500).json({ error: 'Gemini request failed' });
  }
});

// Start server (PORT provided by Cloud Run; 8000 for local)
const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  console.log(`gemini-proxy listening on port ${port}  (POST /generate, GET /)`);
});
