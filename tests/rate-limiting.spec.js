/**
 * Rate-limiting tests:
 *   1. Client throttle — second upload shortly after a cancel shows "Please wait N second(s)"
 *   2. Auto-retry     — 429 from Gemini triggers a transparent retry and succeeds on second attempt
 *   3. Quota exhausted — all retries return 429 → user-facing quota error shown
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginWithApiKey, GEMINI_URL_PATTERN } from './helpers/mock-gemini.js';
import { SUCCESS_HTTP_BODY, QUOTA_EXCEEDED_HTTP_BODY } from './fixtures/mock-responses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PNG_PATH = path.join(__dirname, 'fixtures', 'test-bug.png');

/** Open the file chooser and attach a test file. */
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

    // Slow mock — gives us time to cancel before the response arrives
    await page.route(GEMINI_URL_PATTERN, async (route) => {
      await new Promise((r) => setTimeout(r, 2_000));
      // Fulfill if the route is still pending; ignore if already aborted
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SUCCESS_HTTP_BODY),
      }).catch(() => {});
    });

    // First upload — starts analysis (sets lastRequestTime in gemini.js)
    await uploadFile(page);
    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5_000 });

    // Cancel immediately — returns to camera view
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();

    // Second upload right away — throttle window (3 s) still active
    // The throttle throws before any Gemini network request is made
    await uploadFile(page);

    // Expect the client-side throttle error message
    await expect(page.getByText(/Please wait \d+ more second/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Auto-retry on 429', () => {
  test('first Gemini 429 triggers transparent retry and succeeds on second attempt', async ({
    page,
  }) => {
    await loginWithApiKey(page);

    let requestCount = 0;
    await page.route(GEMINI_URL_PATTERN, (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First attempt → 429 with instant retry hint (0 s)
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify(QUOTA_EXCEEDED_HTTP_BODY),
        });
      } else {
        // Second attempt → success
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SUCCESS_HTTP_BODY),
        });
      }
    });

    await uploadFile(page);

    // App should show success after the transparent retry
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });
    expect(requestCount).toBe(2);
  });

  test('all retries returning 429 shows quota-limit error to user', async ({ page }) => {
    await loginWithApiKey(page);

    await page.route(GEMINI_URL_PATTERN, (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify(QUOTA_EXCEEDED_HTTP_BODY),
      }),
    );

    await uploadFile(page);

    // User should see a quota/rate-limit error
    await expect(
      page.getByText(/quota limit|wait a bit|rate limit/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
