import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Your frontend already POSTs here with { prompt, ... }
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt (string)' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = 'gemini-1.5-flash'; 

    const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 1.0,
        topK: 40,
        maxOutputTokens: 512
      }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const textBody = await r.text();
    if (!r.ok) {
      return res.status(r.status).send(textBody);
    }

    let json;
    try { json = JSON.parse(textBody); }
    catch { return res.status(502).send('Upstream parse error'); }

    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ??
      json?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') ??
      '(no response)';

    // Match your frontend expectation: data.response.content
    return res.json({ response: { content: text } });
  } catch (e) {
    console.error('Gemini proxy error:', e);
    return res.status(500).json({ error: 'Gemini request failed' });
  }
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  console.log(`Gemini proxy running on http://csai01:${port}/generate`);
});
