import { test, expect } from '@playwright/test';

const apiKeyInput = (page) => page.getByRole('textbox', { name: /gemini api key/i });
const submitBtn   = (page) => page.getByRole('button', { name: /connect & start/i });
const changeBtn   = (page) => page.getByRole('button', { name: /change api key/i });

test.describe('localStorage Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('no stored key → shows API key form', async ({ page }) => {
    await expect(apiKeyInput(page)).toBeVisible();
  });

  test('stored key → skips to camera view on load', async ({ page }) => {
    await page.evaluate(() =>
      window.localStorage.setItem('earthbug_api_key', 'AIza-stored-key'),
    );
    await page.reload();
    await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
  });

  test('API key is stored under the key "earthbug_api_key"', async ({ page }) => {
    await apiKeyInput(page).fill('AIza-my-key');
    await submitBtn(page).click();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('earthbug_api_key'),
    );
    expect(stored).toBe('AIza-my-key');
  });

  test('changing API key removes old entry from localStorage', async ({ page }) => {
    await page.evaluate(() =>
      window.localStorage.setItem('earthbug_api_key', 'AIza-old-key'),
    );
    await page.reload();

    await changeBtn(page).click();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('earthbug_api_key'),
    );
    expect(stored).toBeNull();
  });

  test('entering a new key after clearing replaces old value', async ({ page }) => {
    await page.evaluate(() =>
      window.localStorage.setItem('earthbug_api_key', 'AIza-old-key'),
    );
    await page.reload();

    await changeBtn(page).click();
    await apiKeyInput(page).fill('AIza-new-key');
    await submitBtn(page).click();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('earthbug_api_key'),
    );
    expect(stored).toBe('AIza-new-key');
  });

  // BUG: Scan history lives only in React state — not in localStorage.
  // Refreshing the page destroys all scan history.
  test('KNOWN-BUG: scan history is not persisted to localStorage', async ({ page }) => {
    await page.evaluate(() =>
      window.localStorage.setItem('earthbug_api_key', 'AIza-key'),
    );
    await page.reload();

    const keys = await page.evaluate(() => Object.keys(window.localStorage));
    const hasHistoryKey = keys.some((k) => k.toLowerCase().includes('history'));
    expect(hasHistoryKey).toBe(false);
  });
});
