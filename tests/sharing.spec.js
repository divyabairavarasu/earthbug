import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { mockGeminiSuccess, loginWithApiKey } from './helpers/mock-gemini.js';
import { SUCCESS_HTTP_BODY, MOCK_BUG_ANALYSIS } from './fixtures/mock-responses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JPEG_PATH = path.join(__dirname, 'fixtures', 'test-bug.jpg');

function ensureTestJpeg() {
  if (!fs.existsSync(JPEG_PATH)) {
    const buf = Buffer.from(
      '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIA/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EABoQAAMBAQEBAAAAAAAAAAAAAAECAwARBP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDJ5OjPTK9xvt9GSSP/2Q==',
      'base64',
    );
    fs.writeFileSync(JPEG_PATH, buf);
  }
  return JPEG_PATH;
}

async function goToResults(page) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photo/i }).click(),
  ]);
  await chooser.setFiles(ensureTestJpeg());
  await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible({ timeout: 15_000 });
}

test.describe('Share Functionality', () => {
  test.beforeEach(async ({ page }) => {
    ensureTestJpeg();
    await mockGeminiSuccess(page);
    await loginWithApiKey(page);
    await goToResults(page);
  });

  test('share button is present on results page', async ({ page }) => {
    await expect(page.getByRole('button', { name: /share find/i })).toBeVisible();
  });

  test('clipboard fallback: clicking share copies text and shows toast', async ({ page }) => {
    // Disable native Web Share API so the clipboard fallback is exercised
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });

    // Grant clipboard-write permission and track written text
    await page.context().grantPermissions(['clipboard-write']);

    await page.getByRole('button', { name: /share find/i }).click();

    // Toast should appear
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
  });

  test('share toast auto-dismisses after ~2 seconds', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });
    await page.context().grantPermissions(['clipboard-write']);

    await page.getByRole('button', { name: /share find/i }).click();
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
    await expect(page.getByText(/copied to clipboard/i)).not.toBeVisible({ timeout: 4000 });
  });

  test('clipboard text includes bug name and hashtags', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

    await page.getByRole('button', { name: /share find/i }).click();
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('Garden Buddy');
    expect(clipboardText).toContain('#EarthBug');
    expect(clipboardText).toContain('#EarthDay');
  });

  test('toast shows error message when clipboard API is unavailable', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });

    await page.getByRole('button', { name: /share find/i }).click();
    await expect(page.getByText(/not supported in this browser/i)).toBeVisible();
  });

  test('AbortError from Web Share API (user cancelled) shows no toast', async ({ page }) => {
    await page.evaluate(() => {
      const err = new DOMException('User cancelled', 'AbortError');
      Object.defineProperty(navigator, 'share', {
        value: () => Promise.reject(err),
        configurable: true,
      });
    });

    await page.getByRole('button', { name: /share find/i }).click();
    // No share toast should appear — AbortError is silently swallowed.
    // (The confidence badge also has role="status", so check toast text only.)
    await page.waitForTimeout(500);
    await expect(page.getByText(/copied to clipboard|could not copy|not supported/i)).not.toBeVisible();
  });

  // Confidence badge now uses role="img" — only the toast has role="status"
  test('KNOWN-BUG: page has multiple role="status" elements (accessibility)', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });
    await page.context().grantPermissions(['clipboard-write']);
    await page.getByRole('button', { name: /share find/i }).click();
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible();

    const statusCount = await page.getByRole('status').count();
    // After fix: only the share toast has role="status" (confidence badge uses role="img")
    expect(statusCount).toBe(1);
  });
});
