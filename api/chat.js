import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, SAFETY_SETTINGS, FOLLOW_UP_PROMPT } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured — missing API key' });
  }

  const { analysisResult, question } = req.body ?? {};
  if (!question?.trim()) {
    return res.status(400).json({ error: 'Question required' });
  }
  if (!analysisResult?.name) {
    return res.status(400).json({ error: 'Analysis context required' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, safetySettings: SAFETY_SETTINGS });

  // Build trusted history server-side — client never controls the system context
  const history = [
    {
      role: 'user',
      parts: [{ text: `You previously identified this bug: ${JSON.stringify(analysisResult)}` }],
    },
    {
      role: 'model',
      parts: [{ text: JSON.stringify(analysisResult) }],
    },
    {
      role: 'user',
      parts: [{ text: FOLLOW_UP_PROMPT }],
    },
    {
      role: 'model',
      parts: [{ text: `Got it — I'll talk soil and bugs the way I would over a garden fence. What would you like to know about the ${analysisResult.name}?` }],
    },
  ];

  try {
    const chat = model.startChat({ history, safetySettings: SAFETY_SETTINGS });
    const result = await chat.sendMessage(question.trim());
    const response = await result.response;
    return res.status(200).json({ answer: response.text() });
  } catch (err) {
    console.error('[chat]', err);
    return res.status(500).json({ answer: 'Could not get an answer. Please try again.' });
  }
}
