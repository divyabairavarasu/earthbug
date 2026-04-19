import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, SAFETY_SETTINGS, SYSTEM_PROMPT, FORBIDDEN_KEYS } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured — missing API key' });
  }

  const { base64, mimeType = 'image/jpeg' } = req.body ?? {};
  if (!base64 || typeof base64 !== 'string') {
    return res.status(400).json({ error: 'base64 image string required' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, safetySettings: SAFETY_SETTINGS });

  try {
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      { inlineData: { data: base64, mimeType } },
    ]);
    const response = await result.response;

    const blockReason = response.promptFeedback?.blockReason;
    const finishReason = response.candidates?.[0]?.finishReason;
    if (blockReason === 'SAFETY' || finishReason === 'SAFETY') {
      return res.status(400).json({ error: 'CONTENT_BLOCKED' });
    }

    const rawText = response.text();
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawText];
    const jsonStr = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonStr, (key, value) => {
      if (FORBIDDEN_KEYS.includes(key)) throw new Error('Unsafe key in response');
      return value;
    });

    if (!parsed.error && (!parsed.name || !parsed.verdict)) {
      return res.status(502).json({ error: 'Incomplete response from AI' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    const msg = String(err?.message ?? err);
    if (/429|RESOURCE_EXHAUSTED/i.test(msg)) return res.status(429).json({ error: msg });
    if (/401|403|api.key/i.test(msg))        return res.status(401).json({ error: 'Invalid API key' });
    if (/404|NOT_FOUND/i.test(msg))          return res.status(404).json({ error: 'Model not found' });
    if (/CONTENT_BLOCKED/i.test(msg))        return res.status(400).json({ error: 'CONTENT_BLOCKED' });
    console.error('[identify]', err);
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
