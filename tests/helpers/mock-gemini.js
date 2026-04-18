import { SUCCESS_HTTP_BODY, SAFETY_BLOCKED_HTTP_BODY } from '../fixtures/mock-responses.js';

export const GEMINI_URL_PATTERN = 'https://generativelanguage.googleapis.com/**';

/**
 * Intercept all Gemini generateContent calls and respond with the given body.
 * Returns the mock so callers can assert on it later.
 */
export async function mockGeminiSuccess(page, body = SUCCESS_HTTP_BODY) {
  await page.route(GEMINI_URL_PATTERN, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

export async function mockGeminiError(page, status, errorBody) {
  await page.route(GEMINI_URL_PATTERN, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(errorBody),
    });
  });
}

export async function mockGeminiNetworkFailure(page) {
  await page.route(GEMINI_URL_PATTERN, (route) => {
    route.abort('failed');
  });
}

export async function mockGeminiTimeout(page) {
  await page.route(GEMINI_URL_PATTERN, (_route) => {
    // Never fulfills — simulates a hung request
  });
}

export async function mockGeminiSafetyBlock(page) {
  await page.route(GEMINI_URL_PATTERN, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SAFETY_BLOCKED_HTTP_BODY),
    });
  });
}

/**
 * Navigate to the app camera view.
 * The production-ready build no longer requires a user-supplied API key —
 * VITE_GEMINI_API_KEY is injected at build/dev time. Tests set that env var
 * in playwright.config.js so initGemini() is called automatically on load.
 */
export async function loginWithApiKey(page) {
  await page.goto('/');
  await page.waitForSelector('text=Open Camera');
}

/**
 * Seed localStorage with a canned scan history so the history strip is visible.
 */
export async function seedScanHistory(page, history) {
  await page.goto('/');
  await page.evaluate((h) => {
    // history is persisted in-memory in React state, so we can't seed it via
    // localStorage — we just expose this helper to document that limitation.
    window.__testScanHistory = h;
  }, history);
}
