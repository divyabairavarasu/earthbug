import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are EarthBug, an expert entomologist and soil ecologist.
A user will show you a photo of a bug/insect they found. Your job is to:

1. Identify the bug (common name and scientific name)
2. Explain how it helps plants and soil (benefits)
3. Explain any harm it causes to plants and soil (harms)
4. Give an overall verdict: "Mostly Helpful", "Mostly Harmful", "Context-Dependent", or "Neutral Visitor"
5. Share one fascinating "Did You Know?" fact about this bug
6. Provide a one-sentence nuance or caveat about the verdict
7. Suggest 2-4 concrete eco-friendly actions the user can take related to this bug

IMPORTANT: Respond ONLY in valid JSON format with this exact structure:
{
  "name": "Common Name",
  "scientificName": "Scientific name",
  "verdict": "Mostly Helpful" | "Mostly Harmful" | "Context-Dependent" | "Neutral Visitor",
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
  "plantImpact": "positive" | "negative" | "neutral",
  "nuance": "One sentence explaining the nuance or caveat to this verdict",
  "ecoActions": ["Action 1", "Action 2", "Action 3"]
}

If the image does not contain a recognizable bug or insect, respond with:
{
  "error": true,
  "message": "A friendly message explaining you couldn't find a bug in the image and asking them to try again"
}

Keep language accessible and friendly — imagine explaining to a curious gardener.`;

const GEMINI_MODEL = 'gemini-3-flash-preview';

let genAI = null;
let model = null;

const HTTP_STATUS_QUOTA_EXCEEDED = 429;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;

const QUOTA_EXCEEDED_PATTERN = /\b429\b/;
const AUTH_FAILED_PATTERN = /\b401\b|\b403\b/;
const MODEL_NOT_FOUND_PATTERN = /\b404\b|NOT_FOUND/i;
const CONTENT_BLOCKED_PATTERN = /CONTENT_BLOCKED/;
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
const CONTENT_BLOCKED_ERROR =
  "That image couldn't be processed — it may contain content that violates our safety guidelines. Please try a different photo of a garden bug.";
const RATE_LIMITED_ERROR_PREFIX = 'TOO_FAST:';

// Minimum gap between requests — prevents bots and accidental double-submissions
const MIN_REQUEST_INTERVAL_MS = 3_000;
// Auto-retry once on 429 after a short backoff
const MAX_RETRIES_ON_QUOTA = 1;
const MIN_RETRY_BACKOFF_MS = 2_000;

let lastRequestTime = 0;

// In dev mode, expose a reset hook so tests can clear the throttle state
// between successive uploads without waiting the full interval.
if (import.meta.env.DEV) {
  window.__earthbugResetRateLimit = () => {
    lastRequestTime = 0;
  };
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

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

  if (errorMessage.startsWith(RATE_LIMITED_ERROR_PREFIX)) {
    const secs = errorMessage.slice(RATE_LIMITED_ERROR_PREFIX.length);
    return `Please wait ${secs} more second${secs === '1' ? '' : 's'} before scanning again.`;
  }

  if (CONTENT_BLOCKED_PATTERN.test(errorMessage)) {
    return CONTENT_BLOCKED_ERROR;
  }

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
  model = genAI.getGenerativeModel({ model: GEMINI_MODEL, safetySettings: SAFETY_SETTINGS });
}

export function isInitialized() {
  return model !== null;
}

const ANALYSIS_TIMEOUT_MS = 30_000;

export async function identifyBug(imageBase64, mimeType = 'image/jpeg') {
  if (!model) {
    throw new Error('Gemini API not initialized. Please enter your API key.');
  }

  // Client-side throttle — reject requests that arrive too quickly
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    const waitSecs = Math.ceil((MIN_REQUEST_INTERVAL_MS - elapsed) / 1000);
    throw new Error(formatGeminiError(new Error(`${RATE_LIMITED_ERROR_PREFIX}${waitSecs}`)));
  }
  lastRequestTime = now;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  let text;
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES_ON_QUOTA; attempt++) {
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

      // Check if the response was blocked by safety filters
      const blockReason = response.promptFeedback?.blockReason;
      const finishReason = response.candidates?.[0]?.finishReason;
      if (blockReason === 'SAFETY' || finishReason === 'SAFETY') {
        throw new Error('CONTENT_BLOCKED');
      }

      text = response.text();
      lastError = null;
      break; // success — exit retry loop
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const is429 = QUOTA_EXCEEDED_PATTERN.test(msg) || QUOTA_KEYWORD_PATTERN.test(msg);

      if (is429 && attempt < MAX_RETRIES_ON_QUOTA) {
        // Auto-retry: honour Gemini's suggested delay or fall back to minimum
        // Auto-retry: use a short fixed backoff regardless of retry-after hint.
        // The retry-after value is surfaced in the user-facing error message (if
        // retries are exhausted) but we never block the UI for 30–60 seconds.
        const backoffMs = MIN_RETRY_BACKOFF_MS;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        lastError = error;
        continue;
      }

      console.error('Gemini request failed:', error);
      throw new Error(formatGeminiError(error));
    }
  }

  if (lastError) {
    // All retries exhausted on quota error
    console.error('Gemini request failed after retries:', lastError);
    throw new Error(formatGeminiError(lastError));
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = jsonMatch[1].trim();

const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

function isSafeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return true;
  return !Object.getOwnPropertyNames(obj).some((k) => FORBIDDEN_KEYS.includes(k));
}

  try {
    // Use reviver to catch __proto__ / constructor / prototype keys during parse
    const parsed = JSON.parse(jsonStr, (key, value) => {
      if (FORBIDDEN_KEYS.includes(key)) {
        throw new Error('Response contained unsafe keys.');
      }
      return value;
    });

    if (!isSafeObject(parsed)) {
      throw new Error('Response contained unsafe keys.');
    }

    if (parsed.error === true) {
      return parsed;
    }

    if (!parsed.name || !parsed.verdict) {
      throw new Error('The AI response was missing required fields.');
    }

    return parsed;
  } catch (e) {
    if (e.message === 'Response contained unsafe keys.' || e.message === 'The AI response was missing required fields.') {
      throw new Error(e.message);
    }
    console.error('Failed to parse Gemini response:', text);
    throw new Error('Could not parse the bug analysis. Please try again.');
  }
}

export function createBugChat(analysisResult, imageBase64, mimeType = 'image/jpeg') {
  if (!model) {
    throw new Error('Gemini API not initialized. Please enter your API key.');
  }

  const history = [
    {
      role: 'user',
      parts: [
        { text: SYSTEM_PROMPT },
        { inlineData: { data: imageBase64, mimeType } },
      ],
    },
    {
      role: 'model',
      parts: [{ text: JSON.stringify(analysisResult) }],
    },
  ];

  return model.startChat({ history, safetySettings: SAFETY_SETTINGS });
}

export async function askFollowUp(chat, question) {
  if (!question || !question.trim()) {
    throw new Error('Question cannot be empty.');
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Request timed out. Please try again.')),
        ANALYSIS_TIMEOUT_MS,
      ),
    );

    const result = await Promise.race([chat.sendMessage(question.trim()), timeoutPromise]);
    const response = await result.response;
    return response.text();
  } catch {
    return 'Could not get an answer. Please try again.';
  }
}
