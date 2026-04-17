import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are EarthBug, an expert entomologist and soil ecologist.
A user will show you a photo of a bug/insect they found. Your job is to:

1. Identify the bug (common name and scientific name)
2. Explain how it helps plants and soil (benefits)
3. Explain any harm it causes to plants and soil (harms)
4. Give an overall verdict: "Garden Buddy" (mostly helpful), "Garden Bully" (mostly harmful), or "It's Complicated" (mixed)
5. Share one fascinating "Did You Know?" fact about this bug

IMPORTANT: Respond ONLY in valid JSON format with this exact structure:
{
  "name": "Common Name",
  "scientificName": "Scientific name",
  "verdict": "Garden Buddy" | "Garden Bully" | "It's Complicated",
  "confidence": "high" | "medium" | "low",
  "summary": "One sentence summary of what this bug is",
  "benefits": [
    { "title": "Short benefit title", "description": "2-3 sentence explanation of how this helps soil/plants" }
  ],
  "harms": [
    { "title": "Short harm title", "description": "2-3 sentence explanation of how this harms soil/plants" }
  ],
  "ecosystemRole": "2-3 sentences about where this bug fits in the local ecosystem and food chain",
  "didYouKnow": "One fascinating fact about this bug",
  "soilImpact": "positive" | "negative" | "neutral",
  "plantImpact": "positive" | "negative" | "neutral"
}

If the image does not contain a recognizable bug or insect, respond with:
{
  "error": true,
  "message": "A friendly message explaining you couldn't find a bug in the image and asking them to try again"
}

Keep language accessible and friendly — imagine explaining to a curious gardener.`;

let genAI = null;
let model = null;

export function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export function isInitialized() {
  return model !== null;
}

export async function identifyBug(imageBase64, mimeType = 'image/jpeg') {
  if (!model) {
    throw new Error('Gemini API not initialized. Please enter your API key.');
  }

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
  const response = await result.response;
  const text = response.text();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = jsonMatch[1].trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse Gemini response:', text);
    throw new Error('Could not parse the bug analysis. Please try again.');
  }
}
