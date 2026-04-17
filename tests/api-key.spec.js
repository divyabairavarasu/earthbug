import { test, expect } from '@playwright/test';

// Stable locator helpers matching the actual ApiKeyInput.jsx aria attributes
const apiKeyInput = (page) => page.getByRole('textbox', { name: /gemini api key/i });
const submitBtn   = (page) => page.getByRole('button', { name: /connect & start/i });
const changeBtn   = (page) => page.getByRole('button', { name: /change api key/i });

test.describe('API Key Entry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('shows the API key form on first load', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /connect to google gemini/i })).toBeVisible();
    await expect(apiKeyInput(page)).toBeVisible();
    await expect(submitBtn(page)).toBeVisible();
  });

  // The submit button has disabled={!key.trim()} — should be disabled with empty input
  test('submit button is disabled when input is empty', async ({ page }) => {
    await apiKeyInput(page).clear();
    await expect(submitBtn(page)).toBeDisabled();
  });

  test('submitting a whitespace-only key does not proceed', async ({ page }) => {
    await apiKeyInput(page).fill('     ');
    // Button stays disabled because key.trim() is ''
    await expect(submitBtn(page)).toBeDisabled();
  });

  test('valid key enables the submit button', async ({ page }) => {
    await apiKeyInput(page).fill('AIza-test-key-abc123');
    await expect(submitBtn(page)).toBeEnabled();
  });

  test('valid key advances to camera view and stores it in localStorage', async ({ page }) => {
    await apiKeyInput(page).fill('AIza-test-key-abc123');
    await submitBtn(page).click();

    await expect(page.getByText(/open camera/i)).toBeVisible();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('earthbug_api_key'),
    );
    expect(stored).toBe('AIza-test-key-abc123');
  });

  test('stored key is loaded on page refresh, skipping API key screen', async ({ page }) => {
    await page.evaluate(() =>
      window.localStorage.setItem('earthbug_api_key', 'AIza-persisted-key'),
    );
    await page.reload();

    await expect(page.getByText(/open camera/i)).toBeVisible();
    await expect(apiKeyInput(page)).not.toBeVisible();
  });

  test('"Change API key" clears localStorage and returns to key form', async ({ page }) => {
    await page.evaluate(() =>
      window.localStorage.setItem('earthbug_api_key', 'AIza-persisted-key'),
    );
    await page.reload();

    await changeBtn(page).click();

    await expect(apiKeyInput(page)).toBeVisible();
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('earthbug_api_key'),
    );
    expect(stored).toBeNull();
  });

  test('key input trims surrounding whitespace before storing', async ({ page }) => {
    await apiKeyInput(page).fill('  AIza-trimmed-key  ');
    await submitBtn(page).click();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('earthbug_api_key'),
    );
    expect(stored).toBe('AIza-trimmed-key');
  });

  test('Show/Hide button toggles password field visibility', async ({ page }) => {
    const input = apiKeyInput(page);
    await expect(input).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: /show api key/i }).click();
    await expect(input).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: /hide api key/i }).click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('"Get a free Gemini API key" link is present', async ({ page }) => {
    const link = page.getByRole('link', { name: /get a free gemini api key/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
  });
});
