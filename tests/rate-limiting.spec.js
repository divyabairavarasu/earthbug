/**
 * Rate-limiting tests:
 *   1. Client throttle — second upload shortly after a cancel shows "Please wait N second(s)"
 *   2. Auto-retry     — 429 from /api/identify triggers a transparent retry and succeeds
 *   3. Quota exhausted — all retries return 429 → user-facing quota error shown
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginWithApiKey, IDENTIFY_URL } from './helpers/mock-gemini.js';
import { MOCK_BUG_ANALYSIS, QUOTA_EXCEEDED_BODY } from './fixtures/mock-responses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PNG_PATH = path.join(__dirname, 'fixtures', 'test-bug.png');

async function uploadFile(page) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photo/i }).click(),
  ]);
  await chooser.setFiles(PNG_PATH);
}

test.describe('Client-side throttle', () => {
  test('uploading immediately after a cancelled scan shows throttle error', async ({ page }) => {
    await loginWithApiKey(page);

    await page.route(IDENTIFY_URL, async (route) => {
      await new Promise((r) => setTimeout(r, 2_000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BUG_ANALYSIS),
      }).catch(() => {});
    });

    await uploadFile(page);
    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();

    await uploadFile(page);
    await expect(page.getByText(/Please wait \d+ more second/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Auto-retry on 429', () => {
  test('first 429 from /api/identify triggers transparent retry and succeeds', async ({ page }) => {
    await loginWithApiKey(page);

    let requestCount = 0;
    await page.route(IDENTIFY_URL, (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify(QUOTA_EXCEEDED_BODY) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BUG_ANALYSIS) });
      }
    });

    await uploadFile(page);
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });
    expect(requestCount).toBe(2);
  });

  test('all retries returning 429 shows quota-limit error to user', async ({ page }) => {
    await loginWithApiKey(page);

    await page.route(IDENTIFY_URL, (route) =>
      route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify(QUOTA_EXCEEDED_BODY) }),
    );

    await uploadFile(page);
    await expect(page.getByText(/quota limit|wait a bit|rate limit/i)).toBeVisible({ timeout: 10_000 });
  });
});
