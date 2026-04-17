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

const GEMINI_MODEL = 'gemini-2.5-flash';

let genAI = null;
let model = null;

const HTTP_STATUS_QUOTA_EXCEEDED = 429;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;

const QUOTA_EXCEEDED_PATTERN = /\b429\b/;
const AUTH_FAILED_PATTERN = /\b401\b|\b403\b/;
const MODEL_NOT_FOUND_PATTERN = /\b404\b|NOT_FOUND/i;
const QUOTA_KEYWORD_PATTERN = /quota exceeded/i;
const API_KEY_KEYWORD_PATTERN = /api key/i;
const NETWORK_FAILURE_PATTERN = /network|fetch failed|failed to fetch/i;
const RETRY_DELAY_PATTERN = /Please retry in\s+([\d.]+)s/i;

const DEFAULT_ANALYSIS_ERROR =
  'EarthBug could not analyze that photo right now. Please try again.';
const QUOTA_ERROR =
  'Your Gemini API key has hit its current quota limit. Please wait a bit and try again, or check your Gemini plan and billing.';
const INVALID_API_KEY_ERROR =
  'That Gemini API key was rejected. Please check the key and try again.';
const NETWORK_ERROR =
  'EarthBug could not reach Gemini. Please check your connection and try again.';
const MODEL_NOT_FOUND_ERROR =
  'The AI model is unavailable or misconfigured. Please contact support.';

function parseRetryDelaySeconds(errorMessage) {
  const retryMatch = errorMessage.match(RETRY_DELAY_PATTERN);

  if (!retryMatch) {
    return null;
  }

  const retrySeconds = Math.ceil(Number(retryMatch[1]));

  return Number.isFinite(retrySeconds) ? retrySeconds : null;
}

function formatGeminiError(error) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (QUOTA_EXCEEDED_PATTERN.test(errorMessage) || QUOTA_KEYWORD_PATTERN.test(errorMessage)) {
    const retrySeconds = parseRetryDelaySeconds(errorMessage);

    if (retrySeconds) {
      return `${QUOTA_ERROR} Retry in about ${retrySeconds} seconds.`;
    }

    return QUOTA_ERROR;
  }

  if (MODEL_NOT_FOUND_PATTERN.test(errorMessage)) {
    return MODEL_NOT_FOUND_ERROR;
  }

  if (AUTH_FAILED_PATTERN.test(errorMessage) || API_KEY_KEYWORD_PATTERN.test(errorMessage)) {
    return INVALID_API_KEY_ERROR;
  }

  if (NETWORK_FAILURE_PATTERN.test(errorMessage)) {
    return NETWORK_ERROR;
  }

  return DEFAULT_ANALYSIS_ERROR;
}

export function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

export function isInitialized() {
  return model !== null;
}

const ANALYSIS_TIMEOUT_MS = 30_000;

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

  let text;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Analysis timed out. Please try again.')),
        ANALYSIS_TIMEOUT_MS,
      ),
    );
    const result = await Promise.race([
      model.generateContent([SYSTEM_PROMPT, imagePart]),
      timeoutPromise,
    ]);
    const response = await result.response;
    text = response.text();
  } catch (error) {
    console.error('Gemini request failed:', error);
    throw new Error(formatGeminiError(error));
  }

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
