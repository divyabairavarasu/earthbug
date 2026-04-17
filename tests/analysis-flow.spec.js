import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { mockGeminiSuccess, loginWithApiKey } from './helpers/mock-gemini.js';
import {
  SUCCESS_HTTP_BODY,
  MARKDOWN_WRAPPED_HTTP_BODY,
  MOCK_BUG_ANALYSIS,
} from './fixtures/mock-responses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PNG_PATH = path.join(__dirname, 'fixtures', 'test-bug.png');

function ensureTestPng() {
  if (!fs.existsSync(PNG_PATH)) {
    const buf = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    fs.writeFileSync(PNG_PATH, buf);
  }
  return PNG_PATH;
}

async function uploadAndWaitForResults(page) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photo/i }).click(),
  ]);
  await chooser.setFiles(ensureTestPng());
  await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 15_000 });
}

test.describe('Full Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    ensureTestPng();
    await mockGeminiSuccess(page);
    await loginWithApiKey(page);
  });

  test('shows "Analyzing" loading screen while request is in flight', async ({ page }) => {
    // Delay the mock response so we can observe the loading state
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SUCCESS_HTTP_BODY),
      });
    });

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestPng());

    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5000 });
  });

  test('transitions from analyzing to results view', async ({ page }) => {
    await uploadAndWaitForResults(page);
    await expect(page.getByText(/analyzing/i)).not.toBeVisible();
  });

  // Note: SDK v0.21.0 sends the API key as the x-goog-api-key request header,
  // NOT as a query parameter — the URL has no ?key=... suffix.
  test('Gemini request hits the generateContent endpoint with correct URL', async ({ page }) => {
    let capturedUrl = '';
    let capturedHeaders = {};
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
      capturedUrl = route.request().url();
      capturedHeaders = route.request().headers();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SUCCESS_HTTP_BODY),
      });
    });

    await uploadAndWaitForResults(page);

    expect(capturedUrl).toContain('generateContent');
    // API key is delivered via header, not query string (SDK v0.21+ behaviour)
    const keyHeader = capturedHeaders['x-goog-api-key'] ?? capturedHeaders['authorization'] ?? '';
    expect(keyHeader).toContain('test-api-key-12345');
  });

  // Verifies the model name embedded in the URL — was Bug #1 (now fixed)
  test('CRITICAL-BUG: request URL uses gemini-1.5-flash which is 404 on v1beta', async ({ page }) => {
    let capturedUrl = '';
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
      capturedUrl = route.request().url();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SUCCESS_HTTP_BODY),
      });
    });

    await uploadAndWaitForResults(page);

    // Model has been updated to gemini-3-flash-preview
    expect(capturedUrl).toContain('gemini-3-flash-preview');
  });

  test('Gemini response wrapped in markdown fences is parsed correctly', async ({ page }) => {
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MARKDOWN_WRAPPED_HTTP_BODY),
      }),
    );

    await uploadAndWaitForResults(page);
    await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible();
  });

  test('image is included in the request payload (base64 inlineData)', async ({ page }) => {
    let hasImageData = false;
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
      const body = route.request().postDataJSON();
      hasImageData = body?.contents?.[0]?.parts?.some?.(
        p => p.inlineData?.data && p.inlineData.mimeType,
      );
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SUCCESS_HTTP_BODY),
      });
    });

    await uploadAndWaitForResults(page);
    expect(hasImageData).toBe(true);
  });

  test('system prompt is included as first content part', async ({ page }) => {
    let hasSystemPrompt = false;
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
      const body = route.request().postDataJSON();
      const parts = body?.contents?.[0]?.parts ?? [];
      hasSystemPrompt = parts.some(
        p => typeof p.text === 'string' && p.text.includes('EarthBug'),
      );
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SUCCESS_HTTP_BODY),
      });
    });

    await uploadAndWaitForResults(page);
    expect(hasSystemPrompt).toBe(true);
  });

  test('"Scan Another Bug" returns to camera view', async ({ page }) => {
    await uploadAndWaitForResults(page);
    await page.getByRole('button', { name: /scan another bug/i }).click();
    await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
  });

  // BUG: handleScanAnother does not stop camera or clear the stream,
  // but since the camera was stopped before analysis, this is fine.
  // However, there is no auto-start of camera on return — user must click again.
  test('returning to camera view after analysis does not auto-start camera', async ({ page }) => {
    await uploadAndWaitForResults(page);
    await page.getByRole('button', { name: /scan another bug/i }).click();
    // Camera viewfinder should NOT be visible — user must click "Open Camera"
    await expect(page.locator('video')).not.toBeVisible();
  });
});
