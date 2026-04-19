import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { mockGeminiSuccess, loginWithApiKey, GEMINI_URL_PATTERN } from './helpers/mock-gemini.js';
import { MOCK_BUG_ANALYSIS } from './fixtures/mock-responses.js';

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

async function goToResults(page, responseBody = MOCK_BUG_ANALYSIS) {
  await page.unroute(GEMINI_URL_PATTERN);
  await page.route(GEMINI_URL_PATTERN, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    }),
  );

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photo/i }).click(),
  ]);
  await chooser.setFiles(ensureTestPng());
  await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible({ timeout: 15_000 });
}

test.describe('Results View', () => {
  test.beforeEach(async ({ page }) => {
    ensureTestPng();
    await mockGeminiSuccess(page);
    await loginWithApiKey(page);
    await goToResults(page);
  });

  test('displays common name and scientific name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible();
    await expect(page.getByText(MOCK_BUG_ANALYSIS.scientificName)).toBeVisible();
  });

  test('displays verdict badge', async ({ page }) => {
    await expect(page.getByText('Garden Buddy')).toBeVisible();
  });

  test('displays confidence level', async ({ page }) => {
    await expect(page.getByText(/high confidence/i)).toBeVisible();
  });

  test('displays summary text', async ({ page }) => {
    await expect(page.getByText(MOCK_BUG_ANALYSIS.summary)).toBeVisible();
  });

  test('displays soil and plant impact indicators', async ({ page }) => {
    // Use exact text to avoid strict-mode ambiguity from SR-only spans
    await expect(page.getByText('Soil: ', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Plants: ', { exact: false }).first()).toBeVisible();
  });

  test('displays benefits section with all benefit items', async ({ page }) => {
    await expect(page.getByText('How It Helps')).toBeVisible();
    for (const benefit of MOCK_BUG_ANALYSIS.benefits) {
      await expect(page.getByText(benefit.title)).toBeVisible();
    }
  });

  test('displays harms section with all harm items', async ({ page }) => {
    await expect(page.getByText('Potential Harms')).toBeVisible();
    for (const harm of MOCK_BUG_ANALYSIS.harms) {
      await expect(page.getByText(harm.title)).toBeVisible();
    }
  });

  test('displays ecosystem role card', async ({ page }) => {
    await expect(page.getByText('Ecosystem Role')).toBeVisible();
    await expect(page.getByText(MOCK_BUG_ANALYSIS.ecosystemRole)).toBeVisible();
  });

  test('displays "Did You Know?" section', async ({ page }) => {
    await expect(page.getByText('Did You Know?')).toBeVisible();
    await expect(page.getByText(MOCK_BUG_ANALYSIS.didYouKnow)).toBeVisible();
  });

  test('uploaded image is shown in hero card', async ({ page }) => {
    const img = page.locator('img[alt="Ladybug"]').first();
    await expect(img).toBeVisible();
  });

  test('"Garden Buddy" verdict renders green badge', async ({ page }) => {
    const badge = page.getByText('Garden Buddy');
    await expect(badge).toHaveClass(/bg-leaf-100/);
  });

  test('"Garden Bully" verdict renders red badge', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginWithApiKey(p);

    const bullyBody = { ...MOCK_BUG_ANALYSIS, verdict: 'Garden Bully' };

    await p.route(GEMINI_URL_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(bullyBody),
      }),
    );

    const [chooser] = await Promise.all([
      p.waitForEvent('filechooser'),
      p.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestPng());
    await expect(p.getByText('Garden Bully')).toBeVisible({ timeout: 15_000 });
    const badge = p.getByText('Garden Bully');
    await expect(badge).toHaveClass(/bg-red-50/);
    await ctx.close();
  });

  test('unknown verdict falls back to "It\'s Complicated" style', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginWithApiKey(p);

    const body = { ...MOCK_BUG_ANALYSIS, verdict: 'UnknownVerdict' };

    await p.route(GEMINI_URL_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }),
    );

    const [chooser] = await Promise.all([
      p.waitForEvent('filechooser'),
      p.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestPng());
    await expect(p.getByText('UnknownVerdict')).toBeVisible({ timeout: 15_000 });
    // Should use amber (It's Complicated) fallback style
    const badge = p.getByText('UnknownVerdict');
    await expect(badge).toHaveClass(/bg-amber-50/);
    await ctx.close();
  });

  test('result with empty benefits array hides "How It Helps" section', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginWithApiKey(p);

    const body = { ...MOCK_BUG_ANALYSIS, benefits: [] };
    await p.route(GEMINI_URL_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }),
    );

    const [chooser] = await Promise.all([
      p.waitForEvent('filechooser'),
      p.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestPng());
    await expect(p.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible({ timeout: 15_000 });
    await expect(p.getByText('How It Helps')).not.toBeVisible();
    await ctx.close();
  });

  test('heading receives focus when results load (accessibility)', async ({ page }) => {
    // The heading ref gets .focus() in useEffect — verify it is focused
    const focused = await page.evaluate(() => document.activeElement?.textContent);
    expect(focused).toContain(MOCK_BUG_ANALYSIS.name);
  });

  test('share button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /share find/i })).toBeVisible();
  });

  // Response validation now rejects a missing name field before reaching the UI
  test('KNOWN-BUG: missing name in result renders img alt as "undefined"', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginWithApiKey(p);

    const partialResult = { ...MOCK_BUG_ANALYSIS };
    delete partialResult.name;

    await p.route(GEMINI_URL_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(partialResult) }),
    );

    const [chooser] = await Promise.all([
      p.waitForEvent('filechooser'),
      p.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestPng());
    // After security fix: missing 'name' is rejected as an invalid response
    await expect(p.getByText(/missing required fields/i)).toBeVisible({ timeout: 15_000 });
    await ctx.close();
  });
});
