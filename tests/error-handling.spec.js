import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  mockGeminiError,
  mockGeminiNetworkFailure,
  mockGeminiTimeout,
  loginWithApiKey,
} from './helpers/mock-gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JPEG_PATH = path.join(__dirname, 'fixtures', 'test-bug.jpg');

function ensureTestJpeg() {
  if (!fs.existsSync(JPEG_PATH)) {
    const buf = Buffer.from(
      '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC' +
      'AABAAEDASIA/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EABoQAAMBAQEBAAAAAAAAAAAAAAECAwARBP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDJ' +
      '5OjPTK9xvt9GSSP/2Q==',
      'base64',
    );
    fs.writeFileSync(JPEG_PATH, buf);
  }
  return JPEG_PATH;
}

async function uploadFile(page, filePath) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photo/i }).click(),
  ]);
  await chooser.setFiles(filePath);
}

test.describe('Error Handling — Gemini API failures', () => {
  test.beforeEach(async ({ page }) => {
    ensureTestJpeg();
    await loginWithApiKey(page);
  });

  // ── Critical Bug ─────────────────────────────────────────────────────────
  // The deployed model "gemini-1.5-flash" returns HTTP 404 from the v1beta
  // endpoint. The error falls through all pattern checks (no "429", "401",
  // "403", "api key", "network") and surfaces as the generic message.
  test('CRITICAL-BUG: 404 (model not found) shows unhelpful generic error', async ({ page }) => {
    await mockGeminiError(page, 404, {
      error: {
        code: 404,
        message:
          'models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent.',
        status: 'NOT_FOUND',
      },
    });

    await uploadFile(page, ensureTestJpeg());
    // (The Analyzing view may appear and disappear faster than Playwright can
    // poll for it when the mock responds synchronously — skip that assertion.)

    // The app returns the generic message — no mention of model/configuration
    await expect(
      page.getByText(/earthbug could not analyze that photo right now/i),
    ).toBeVisible({ timeout: 10_000 });

    // WHAT SHOULD HAPPEN: a message like "The AI model is unavailable or
    // misconfigured. Please contact support." Users currently have no way
    // to understand or resolve this error.
  });

  // ── Quota / Rate Limit ────────────────────────────────────────────────────
  test('quota exceeded (HTTP 429) shows quota error message', async ({ page }) => {
    await mockGeminiError(page, 429, {
      error: {
        code: 429,
        message: 'Quota exceeded for quota metric. Please retry in 30s.',
        status: 'RESOURCE_EXHAUSTED',
      },
    });

    await uploadFile(page, ensureTestJpeg());
    await expect(
      page.getByText(/quota limit/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('quota error with retry-after includes seconds in message', async ({ page }) => {
    await mockGeminiError(page, 429, {
      error: {
        code: 429,
        message: 'Quota exceeded. Please retry in 45.0s.',
        status: 'RESOURCE_EXHAUSTED',
      },
    });

    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByText(/45 second/i)).toBeVisible({ timeout: 10_000 });
  });

  // ── Authentication ────────────────────────────────────────────────────────
  test('HTTP 401 (invalid API key) shows auth error message', async ({ page }) => {
    await mockGeminiError(page, 401, {
      error: {
        code: 401,
        message: 'API key not valid. Please pass a valid API key.',
        status: 'UNAUTHENTICATED',
      },
    });

    await uploadFile(page, ensureTestJpeg());
    await expect(
      page.getByText(/api key was rejected/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('HTTP 403 (forbidden) shows auth error message', async ({ page }) => {
    await mockGeminiError(page, 403, {
      error: {
        code: 403,
        message: 'The caller does not have permission.',
        status: 'PERMISSION_DENIED',
      },
    });

    await uploadFile(page, ensureTestJpeg());
    await expect(
      page.getByText(/api key was rejected/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  // BUG: AUTH_FAILED_PATTERN = /401|403/ matches *any* string containing
  // those digits (e.g. "error 4013", response with id "403abc").
  test('KNOWN-BUG: AUTH_FAILED_PATTERN falsely matches strings containing "401"', async ({ page }) => {
    // Craft an error whose message contains "401" in a non-status context
    await mockGeminiError(page, 500, {
      error: {
        code: 500,
        message: 'Internal error: batch 40138 failed.',
        status: 'INTERNAL',
      },
    });

    await uploadFile(page, ensureTestJpeg());

    // Should show generic error — but the regex will match "401" inside "40138"
    // and incorrectly show the "API key rejected" message.
    await expect(
      page.getByText(/api key was rejected/i),
    ).toBeVisible({ timeout: 10_000 });
    // ^ This is the BUG: should show generic error, not auth error.
  });

  // BUG: QUOTA_EXCEEDED_PATTERN = /429/ matches any string containing "429"
  test('KNOWN-BUG: QUOTA_EXCEEDED_PATTERN falsely matches strings containing "429"', async ({ page }) => {
    await mockGeminiError(page, 500, {
      error: {
        code: 500,
        message: 'Batch job 4299 encountered an unexpected error.',
        status: 'INTERNAL',
      },
    });

    await uploadFile(page, ensureTestJpeg());

    // Should show generic error — but regex matches "429" inside "4299"
    await expect(
      page.getByText(/quota limit/i),
    ).toBeVisible({ timeout: 10_000 });
    // ^ BUG: should show generic error, not quota error.
  });

  // ── Network failures ──────────────────────────────────────────────────────
  test('network failure shows connection error message', async ({ page }) => {
    await mockGeminiNetworkFailure(page);

    await uploadFile(page, ensureTestJpeg());
    await expect(
      page.getByText(/could not reach gemini/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('after network error, user is returned to camera view', async ({ page }) => {
    await mockGeminiNetworkFailure(page);

    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByText(/could not reach gemini/i)).toBeVisible({ timeout: 10_000 });

    // Error banner in App.jsx — dismiss it
    await page.getByRole('button', { name: /dismiss/i }).click();
    await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
  });

  // ── Malformed AI response ─────────────────────────────────────────────────
  test('malformed JSON from Gemini shows parse error', async ({ page }) => {
    await page.route('https://generativelanguage.googleapis.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: '{ this is NOT valid JSON }' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      }),
    );

    await uploadFile(page, ensureTestJpeg());
    await expect(
      page.getByText(/could not parse/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  // BUG: Empty string response from Gemini causes JSON.parse('') to throw
  // SyntaxError, which IS caught and shows the parse error. But the root cause
  // (empty text) is not separately detected/reported.
  test('empty text response from Gemini shows parse error', async ({ page }) => {
    await page.route('https://generativelanguage.googleapis.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: '' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      }),
    );

    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByText(/could not parse/i)).toBeVisible({ timeout: 10_000 });
  });

  // BUG: No way to cancel or timeout a hung analysis.
  // If Gemini never responds, the user is permanently stuck on AnalyzingView.
  test('KNOWN-BUG: hung Gemini request leaves user permanently on analyzing screen', async ({ page }) => {
    await mockGeminiTimeout(page);

    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5000 });

    // After 5 seconds user is still stuck — no cancel button, no timeout
    await page.waitForTimeout(5000);
    await expect(page.getByText(/analyzing/i)).toBeVisible();
    // No cancel button exists
    await expect(page.getByRole('button', { name: /cancel/i })).not.toBeVisible();
  });

  // ── Error banner UX ───────────────────────────────────────────────────────
  test('error banner can be dismissed', async ({ page }) => {
    await mockGeminiNetworkFailure(page);
    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByText(/something went wrong/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /dismiss/i }).click();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });
});
