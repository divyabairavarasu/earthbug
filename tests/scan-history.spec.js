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

async function runOneScan(page) {
  // Reset client-side throttle so successive scans within the same test aren't blocked
  await page.evaluate(() => window.__earthbugResetRateLimit?.());

  await page.unroute('https://generativelanguage.googleapis.com/**');
  await page.route('https://generativelanguage.googleapis.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SUCCESS_HTTP_BODY),
    }),
  );

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photo/i }).click(),
  ]);
  await chooser.setFiles(ensureTestJpeg());
  await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /scan another bug/i }).click();
  await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
}

test.describe('Scan History', () => {
  test.beforeEach(async ({ page }) => {
    ensureTestJpeg();
    await mockGeminiSuccess(page);
    await loginWithApiKey(page);
  });

  test('no history strip shown before any scan', async ({ page }) => {
    await expect(page.getByText(/recent scans/i)).not.toBeVisible();
  });

  test('history strip appears after first successful scan', async ({ page }) => {
    await runOneScan(page);
    await expect(page.getByText(/recent scans/i)).toBeVisible();
  });

  test('history thumbnail shows bug name', async ({ page }) => {
    await runOneScan(page);
    const thumbnail = page.locator('.grid button').first();
    await expect(thumbnail.getByText(MOCK_BUG_ANALYSIS.name)).toBeVisible();
  });

  test('clicking a history thumbnail navigates to results view', async ({ page }) => {
    await runOneScan(page);
    const thumbnail = page.locator('.grid button').first();
    await thumbnail.click();
    await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible();
    await expect(page.getByText('Garden Buddy')).toBeVisible();
  });

  test('history thumbnails show verdict emoji', async ({ page }) => {
    await runOneScan(page);
    // Garden Buddy = 🌱
    const thumb = page.locator('.grid button').first();
    await expect(thumb.getByText('🌱')).toBeVisible();
  });

  test('history is limited to 10 entries', async ({ page }) => {
    // Run 11 scans with distinct bug names so deduplication doesn't interfere
    for (let i = 0; i < 11; i++) {
      const bugName = `TestBug${i}`;
      // Reset throttle so successive uploads in this loop aren't blocked
      await page.evaluate(() => window.__earthbugResetRateLimit?.());
      await page.unroute('https://generativelanguage.googleapis.com/**');
      await page.route('https://generativelanguage.googleapis.com/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            candidates: [{
              content: { parts: [{ text: JSON.stringify({ ...MOCK_BUG_ANALYSIS, name: bugName }) }], role: 'model' },
              finishReason: 'STOP',
            }],
          }),
        }),
      );
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByRole('button', { name: /upload photo/i }).click(),
      ]);
      await chooser.setFiles(ensureTestJpeg());
      await expect(page.getByRole('heading', { name: bugName })).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: /scan another bug/i }).click();
      await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
    }
    const thumbs = page.locator('.grid button');
    await expect(thumbs).toHaveCount(10);
  });

  // Scan history is now persisted to localStorage — survives page refresh
  test('KNOWN-BUG: scan history is lost on page refresh', async ({ page }) => {
    await runOneScan(page);
    await expect(page.getByText(/recent scans/i)).toBeVisible();

    await page.reload();

    // After reload, history is restored from localStorage
    await expect(page.getByText(/recent scans/i)).toBeVisible({ timeout: 5000 });
  });

  // Scan history is now deduplicated by bug name
  test('KNOWN-BUG: scanning same bug multiple times adds duplicate history entries', async ({ page }) => {
    await runOneScan(page);
    await runOneScan(page);

    const thumbs = page.locator('.grid button');
    const count = await thumbs.count();
    // After deduplication, only 1 entry for the same bug name
    expect(count).toBe(1);

    const names = await thumbs.allInnerTexts();
    expect(names.filter((n) => n.includes(MOCK_BUG_ANALYSIS.name))).toHaveLength(1);
  });

  // BUG: Gemini "error" responses (no bug found) are NOT added to history,
  // which is correct — but re-viewing a history item that previously errored
  // is impossible since they're never stored. This test confirms the guard works.
  test('"no bug found" result is not added to scan history', async ({ page }) => {
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ error: true, message: "No bug found!" }) }],
                role: 'model',
              },
              finishReason: 'STOP',
            },
          ],
        }),
      }),
    );

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestJpeg());
    await expect(page.getByText(/no bug found/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /try again/i }).click();

    await expect(page.getByText(/recent scans/i)).not.toBeVisible();
  });
});
