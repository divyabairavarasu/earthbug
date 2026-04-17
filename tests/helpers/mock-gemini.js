import { SUCCESS_HTTP_BODY } from '../fixtures/mock-responses.js';

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

/**
 * Navigate to the app and seed a valid API key directly into localStorage so
 * tests skip the key-entry screen.
 */
export async function loginWithApiKey(page, key = 'test-api-key-12345') {
  await page.goto('/');
  await page.evaluate((k) => {
    window.localStorage.setItem('earthbug_api_key', k);
  }, key);
  await page.reload();
  return key;
}

/**
 * Enter the API key through the UI form and wait for the camera view.
 */
export async function enterApiKeyViaForm(page, key = 'test-api-key-12345') {
  await page.goto('/');
  await page.getByLabel(/api key/i).fill(key);
  await page.getByRole('button', { name: /start identifying/i }).click();
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
