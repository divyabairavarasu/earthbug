import { MOCK_BUG_ANALYSIS } from '../fixtures/mock-responses.js';

// API route patterns (same-origin proxy — no external URL)
export const IDENTIFY_URL = '/api/identify';
export const CHAT_URL = '/api/chat';

// Legacy alias used by existing specs — points to the identify endpoint
export const GEMINI_URL_PATTERN = IDENTIFY_URL;

export async function mockGeminiSuccess(page, body = MOCK_BUG_ANALYSIS) {
  await page.route(IDENTIFY_URL, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

export async function mockGeminiError(page, status) {
  await page.route(IDENTIFY_URL, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: status === 400 ? 'CONTENT_BLOCKED' : `Error ${status}` }),
    });
  });
}

export async function mockGeminiNetworkFailure(page) {
  await page.route(IDENTIFY_URL, (route) => route.abort('failed'));
}

export async function mockGeminiTimeout(page) {
  await page.route(IDENTIFY_URL, (_route) => {
    // Never fulfills — simulates a hung request
  });
}

export async function mockGeminiSafetyBlock(page) {
  await page.route(IDENTIFY_URL, (route) => {
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'CONTENT_BLOCKED' }),
    });
  });
}

/**
 * Navigate to the camera view. The proxy handles the key server-side
 * so no localStorage seeding is needed.
 */
export async function loginWithApiKey(page) {
  await page.goto('/');
  await page.waitForSelector('text=Open Camera');
}
