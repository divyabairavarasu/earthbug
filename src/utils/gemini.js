// All Gemini API calls are proxied through /api/* serverless functions.
// The API key never reaches the browser.

const DEFAULT_ANALYSIS_ERROR =
  'EarthBug could not analyze that photo right now. Please try again.';
const QUOTA_ERROR =
  'Your Gemini API key has hit its current quota limit. Please wait a bit and try again, or check your Gemini plan and billing.';
const INVALID_API_KEY_ERROR =
  'That Gemini API key was rejected. Please check the key and try again.';
const NETWORK_ERROR =
  'EarthBug could not reach the server. Please check your connection and try again.';
const MODEL_NOT_FOUND_ERROR =
  'The AI model is unavailable or misconfigured. Please contact support.';
const CONTENT_BLOCKED_ERROR =
  "That image couldn't be processed — it may contain content that violates our safety guidelines. Please try a different photo of a garden bug.";
const RATE_LIMITED_ERROR_PREFIX = 'TOO_FAST:';

const MIN_REQUEST_INTERVAL_MS = 3_000;
const MAX_RETRIES_ON_QUOTA = 1;
const MIN_RETRY_BACKOFF_MS = 2_000;
const ANALYSIS_TIMEOUT_MS = 30_000;

let lastRequestTime = 0;

if (import.meta.env.DEV) {
  window.__earthbugResetRateLimit = () => { lastRequestTime = 0; };
}

function formatClientError(errorText) {
  if (errorText?.startsWith(RATE_LIMITED_ERROR_PREFIX)) {
    const secs = errorText.slice(RATE_LIMITED_ERROR_PREFIX.length);
    return `Please wait ${secs} more second${secs === '1' ? '' : 's'} before scanning again.`;
  }
  return errorText || DEFAULT_ANALYSIS_ERROR;
}

function formatServerError(status, errorBody) {
  if (errorBody === 'CONTENT_BLOCKED') return CONTENT_BLOCKED_ERROR;
  switch (status) {
    case 429: return QUOTA_ERROR;
    case 401:
    case 403: return INVALID_API_KEY_ERROR;
    case 404: return MODEL_NOT_FOUND_ERROR;
    default:  return DEFAULT_ANALYSIS_ERROR;
  }
}

export async function identifyBug(imageBase64, mimeType = 'image/jpeg') {
  // Client-side throttle — reject requests that arrive too quickly
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    const waitSecs = Math.ceil((MIN_REQUEST_INTERVAL_MS - elapsed) / 1000);
    throw new Error(formatClientError(`${RATE_LIMITED_ERROR_PREFIX}${waitSecs}`));
  }
  lastRequestTime = now;

  let lastStatus = 500;
  let lastErrorBody = null;

  for (let attempt = 0; attempt <= MAX_RETRIES_ON_QUOTA; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      const response = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: imageBase64, mimeType }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) return data;

      lastStatus = response.status;
      lastErrorBody = data.error ?? null;

      if (response.status === 429 && attempt < MAX_RETRIES_ON_QUOTA) {
        await new Promise((r) => setTimeout(r, MIN_RETRY_BACKOFF_MS));
        continue;
      }

      throw new Error(formatServerError(response.status, data.error));
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new Error('Analysis timed out. Please try again.');
      }

      // Re-throw errors we already formatted
      if (err.message !== DEFAULT_ANALYSIS_ERROR) {
        throw err;
      }

      if (NETWORK_ERROR && /fetch|network/i.test(err.message)) {
        throw new Error(NETWORK_ERROR);
      }

      throw err;
    }
  }

  // All retries exhausted
  throw new Error(formatServerError(lastStatus, lastErrorBody));
}

// Returns the analysis result itself as the "chat session token" —
// the server reconstructs context from it on each follow-up request.
export function createBugChat(analysisResult) {
  if (!analysisResult || analysisResult.error) return null;
  return analysisResult;
}

export async function askFollowUp(analysisResult, question) {
  if (!question?.trim()) return 'Could not get an answer. Please try again.';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisResult, question: question.trim() }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    return data.answer || 'Could not get an answer. Please try again.';
  } catch (err) {
    clearTimeout(timeoutId);
    return 'Could not get an answer. Please try again.';
  }
}
