import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors({ origin: true, methods: ['POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '1mb' }));

// ---- config ----
const API_VERSION = 'v1';                 // keep the version that works with your key
const MODEL       = 'gemini-2.5-flash';   // you said this works via curl
// ----------------

// helper: extract as much readable text as possible from Gemini 2.x/1.5 responses
function extractTextFromGemini(json) {
  // 1) prompt-level block?
  const blockReason = json?.promptFeedback?.blockReason;
  if (blockReason) return `Response was blocked: ${blockReason}`;

  const cands = json?.candidates;
  if (!Array.isArray(cands) || cands.length === 0) return '(no response)';

  const parts = cands[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    // sometimes 2.5 returns top-level text
    const topText = cands[0]?.content?.text || cands[0]?.text;
    return topText ? String(topText) : '(no response)';
  }

  const out = [];
  for (const p of parts) {
    if (!p) continue;
    if (typeof p.text === 'string' && p.text.trim()) {
      out.push(p.text.trim());
      continue;
    }
    // inline text payloads
    if (p.inlineData?.mimeType?.startsWith('text/') && p.inlineData?.data) {
      try {
        const decoded = Buffer.from(p.inlineData.data, 'base64').toString('utf8');
        if (decoded.trim()) out.push(decoded.trim());
      } catch {}
      continue;
    }
    // tool / function call (render something human-readable)
    if (p.functionCall) {
      const { name, args } = p.functionCall;
      out.push(`(tool call) ${name || 'function'} ${args ? JSON.stringify(args) : ''}`.trim());
      continue;
    }
    // code blocks (some 2.x modes return these)
    if (p.executableCode?.language || p.executableCode?.code) {
      const lang = p.executableCode.language || 'code';
      const code = p.executableCode.code || '';
      out.push(`\`\`\`${lang}\n${code}\n\`\`\``);
      continue;
    }
    // images / data: ignore or label
    if (p.inlineData?.mimeType && p.inlineData?.data) {
      out.push(`(inline ${p.inlineData.mimeType}, ${p.inlineData.data.length} bytes)`);
      continue;
    }
  }

  // safety at candidate level?
  if (out.length === 0) {
    const candBlock = cands[0]?.safetyRatings?.find(r => r.blocked)?.category;
    if (candBlock) return `Response was blocked by safety: ${candBlock}`;
  }

  return out.join('\n').trim() || '(no response)';
}

// Your frontend already POSTs here with { prompt, ... }
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt (string)' });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });

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
      // bubble up Gemini error so you can see it in the browser console
      return res.status(r.status).send(textBody);
    }

    let json;
    try { json = JSON.parse(textBody); }
    catch { return res.status(502).send('Upstream parse error'); }

    const text = extractTextFromGemini(json);
    return res.json({ response: { content: text } });
  } catch (e) {
    console.error('Gemini proxy error:', e);
    return res.status(500).json({ error: 'Gemini request failed' });
  }
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  console.log(`Gemini proxy running on /generate (port ${port})`);
});
