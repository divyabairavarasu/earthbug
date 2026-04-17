import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  mockGeminiSuccess,
  mockGeminiSafetyBlock,
  loginWithApiKey,
} from './helpers/mock-gemini.js';
import { NO_BUG_HTTP_BODY } from './fixtures/mock-responses.js';

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

// ─── API Key Visibility ────────────────────────────────────────────────────────

test.describe('Security — API key visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('API key input is type="password" by default (hidden)', async ({ page }) => {
    const input = page.getByLabel(/gemini api key/i);
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('Show button reveals the key as plain text', async ({ page }) => {
    const input = page.getByLabel(/gemini api key/i);
    await input.fill('AIza-secret-key');
    await page.getByRole('button', { name: /show api key/i }).click();
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('Hide button re-masks the key after reveal', async ({ page }) => {
    const input = page.getByLabel(/gemini api key/i);
    await input.fill('AIza-secret-key');
    await page.getByRole('button', { name: /show api key/i }).click();
    await page.getByRole('button', { name: /hide api key/i }).click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('API key input has autocomplete=off to prevent browser autofill', async ({ page }) => {
    const input = page.getByLabel(/gemini api key/i);
    await expect(input).toHaveAttribute('autocomplete', 'off');
  });
});

// ─── Content Safety — Obscene / Blocked Images ────────────────────────────────

test.describe('Security — Content safety (obscene/inappropriate images)', () => {
  test.beforeEach(async ({ page }) => {
    ensureTestJpeg();
    await loginWithApiKey(page);
  });

  test('safety-blocked response shows a friendly content-safety error', async ({ page }) => {
    await mockGeminiSafetyBlock(page);
    await uploadFile(page, ensureTestJpeg());

    // Should return to camera view with an error banner
    await expect(page.getByText(/safety guidelines/i)).toBeVisible({ timeout: 15_000 });
  });

  test('safety error does not navigate to results view', async ({ page }) => {
    await mockGeminiSafetyBlock(page);
    await uploadFile(page, ensureTestJpeg());

    // Should stay on / return to camera view — results heading must not appear
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /scan another bug/i })).not.toBeVisible();
  });

  test('safety error can be dismissed to allow a new upload', async ({ page }) => {
    await mockGeminiSafetyBlock(page);
    await uploadFile(page, ensureTestJpeg());

    await expect(page.getByText(/safety guidelines/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /dismiss/i }).click();
    await expect(page.getByText(/safety guidelines/i)).not.toBeVisible();
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();
  });

  test('safety-blocked scan is NOT added to scan history', async ({ page }) => {
    // First do a successful scan so history exists
    await mockGeminiSuccess(page);
    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /scan another bug/i }).click();
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();

    const historyBefore = await page.locator('.grid button').count();

    // Now do a safety-blocked scan
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await mockGeminiSafetyBlock(page);
    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByText(/safety guidelines/i)).toBeVisible({ timeout: 15_000 });

    // History count must not have increased
    const historyAfter = await page.locator('.grid button').count();
    expect(historyAfter).toBe(historyBefore);
  });
});

// ─── Content Safety — Non-bug Images ─────────────────────────────────────────

test.describe('Security — Non-bug / unrecognised image handling', () => {
  test.beforeEach(async ({ page }) => {
    ensureTestJpeg();
    await loginWithApiKey(page);
  });

  test('non-bug image response shows an error message in results', async ({ page }) => {
    await mockGeminiSuccess(page, NO_BUG_HTTP_BODY);
    await uploadFile(page, ensureTestJpeg());

    // The results view renders the error message from the API
    await expect(page.getByText(/couldn't spot a bug/i)).toBeVisible({ timeout: 15_000 });
  });

  test('non-bug result is NOT added to scan history', async ({ page }) => {
    await mockGeminiSuccess(page, NO_BUG_HTTP_BODY);
    await uploadFile(page, ensureTestJpeg());

    await expect(page.getByText(/couldn't spot a bug/i)).toBeVisible({ timeout: 15_000 });

    // Return to camera and verify no history thumbnails
    await page.getByRole('button', { name: /try again/i }).click();
    await expect(page.locator('.grid button')).toHaveCount(0);
  });
});
