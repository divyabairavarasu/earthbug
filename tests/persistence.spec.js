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

  // Scan history is now persisted to localStorage
  test('KNOWN-BUG: scan history is not persisted to localStorage', async ({ page }) => {
    await page.evaluate(() =>
      window.localStorage.setItem('earthbug_api_key', 'AIza-key'),
    );
    await page.reload();

    const keys = await page.evaluate(() => Object.keys(window.localStorage));
    const hasHistoryKey = keys.some((k) => k.toLowerCase().includes('history'));
    expect(hasHistoryKey).toBe(true);
  });

  test('scan history in localStorage never contains image data (base64)', async ({ page }) => {
    // Seed API key and mock Gemini
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('earthbug_api_key', 'test-api-key-12345');
    });
    await page.reload();

    // Mock Gemini and upload a file to produce one history entry
    const { mockGeminiSuccess } = await import('./helpers/mock-gemini.js');
    await mockGeminiSuccess(page);

    const path = await import('path');
    const fs = await import('fs');
    const { fileURLToPath } = await import('url');
    const __dirname = path.default.dirname(fileURLToPath(import.meta.url));
    const jpegPath = path.default.join(__dirname, 'fixtures', 'test-bug.jpg');
    if (!fs.default.existsSync(jpegPath)) {
      const buf = Buffer.from(
        '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIA' +
        '/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EABoQAAMBAQEBAAAAAAAAAAAAAAECAwARBP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDJ' +
        '5OjPTK9xvt9GSSP/2Q==',
        'base64',
      );
      fs.default.writeFileSync(jpegPath, buf);
    }

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(jpegPath);
    await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });

    // Read what was actually stored in localStorage
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('earthbug_scan_history'),
    );
    expect(stored).not.toBeNull();
    expect(stored).not.toContain('data:image');
    expect(stored).not.toContain('base64');
  });
});
