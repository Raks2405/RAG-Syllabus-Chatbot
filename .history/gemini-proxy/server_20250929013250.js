import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

console.log('GEMINI_API_KEY prefix:', String(process.env.GEMINI_API_KEY||'').slice(0,6) || 'MISSING');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt (string)' });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const model = 'gemini-2.5-flash-latest'; // ✅ known-good

    const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, topP: 1.0, topK: 40, maxOutputTokens: 512 }
      })
    });

    const textBody = await r.text();
    if (!r.ok) return res.status(r.status).send(textBody);

    const json = JSON.parse(textBody);
    const text =
      json?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') ??
      '(no response)';

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
