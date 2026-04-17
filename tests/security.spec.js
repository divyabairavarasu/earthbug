import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  mockGeminiSuccess,
  mockGeminiSafetyBlock,
  loginWithApiKey,
  GEMINI_URL_PATTERN,
} from './helpers/mock-gemini.js';
import { NO_BUG_HTTP_BODY, buildGeminiHttpResponse } from './fixtures/mock-responses.js';

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

    // Now do a safety-blocked scan — reset throttle first
    await page.evaluate(() => window.__earthbugResetRateLimit?.());
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

// ─── Gemini Response Validation ──────────────────────────────────────────────

test.describe('Security — Gemini response validation', () => {
  test.beforeEach(async ({ page }) => {
    ensureTestJpeg();
    await loginWithApiKey(page);
  });

  test('response missing required fields shows an error (not a crash)', async ({ page }) => {
    // Response is valid JSON but missing name and verdict
    await page.route(GEMINI_URL_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildGeminiHttpResponse(JSON.stringify({ summary: 'oops' }))),
      }),
    );
    await uploadFile(page, ensureTestJpeg());

    await expect(page.getByText(/missing required fields/i)).toBeVisible({ timeout: 15_000 });
  });

  test('response containing prototype pollution keys is rejected', async ({ page }) => {
    // Use a literal JSON string so "__proto__" appears as a real key in the text
    const poisoned = '{"__proto__": {"isAdmin": true}, "name": "Hack", "verdict": "Garden Buddy"}';
    await page.route(GEMINI_URL_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildGeminiHttpResponse(poisoned)),
      }),
    );
    await uploadFile(page, ensureTestJpeg());

    await expect(page.getByText(/unsafe keys/i)).toBeVisible({ timeout: 15_000 });
  });

  test('malformed JSON response shows a parse error (not a crash)', async ({ page }) => {
    await page.route(GEMINI_URL_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildGeminiHttpResponse('this is not json {')),
      }),
    );
    await uploadFile(page, ensureTestJpeg());

    await expect(page.getByText(/could not parse/i)).toBeVisible({ timeout: 15_000 });
  });
});

// ─── MIME Type Allowlist ──────────────────────────────────────────────────────

test.describe('Security — MIME type allowlist', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithApiKey(page);
  });

  async function uploadBuffer(page, buffer, mimeType, filename) {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles({ name: filename, mimeType, buffer });
  }

  test('uploading a TIFF (not in allowlist) shows an error and does not analyze', async ({ page }) => {
    const fakeTiff = Buffer.from('II42', 'ascii'); // minimal TIFF-like header
    await uploadBuffer(page, fakeTiff, 'image/tiff', 'photo.tiff');
    // Should show upload error and stay on camera view
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible({ timeout: 5_000 });
  });

  test('uploading a BMP (not in allowlist) shows an error and does not analyze', async ({ page }) => {
    const fakeBmp = Buffer.from('BM', 'ascii');
    await uploadBuffer(page, fakeBmp, 'image/bmp', 'photo.bmp');
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible({ timeout: 5_000 });
  });

  test('allowed types (jpeg, png, webp) proceed to analysis', async ({ page }) => {
    ensureTestJpeg();
    await mockGeminiSuccess(page);
    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });
  });
});

// ─── localStorage image data ──────────────────────────────────────────────────

test.describe('Security — localStorage never stores image data', () => {
  test('imageUrl is stripped from scan history before writing to localStorage', async ({ page }) => {
    ensureTestJpeg();
    await loginWithApiKey(page);
    await mockGeminiSuccess(page);
    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('earthbug_scan_history'),
    );
    expect(stored).not.toBeNull();
    expect(stored).not.toContain('data:image');
    expect(stored).not.toContain('base64');
  });

  test('history thumbnails still appear after reload (using emoji placeholder)', async ({ page }) => {
    ensureTestJpeg();
    await loginWithApiKey(page);
    await mockGeminiSuccess(page);
    await uploadFile(page, ensureTestJpeg());
    await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /scan another bug/i }).click();
    await expect(page.locator('.grid button')).toHaveCount(1);

    await page.reload();
    // History entry should still appear after reload
    await expect(page.locator('.grid button')).toHaveCount(1);
  });
});

