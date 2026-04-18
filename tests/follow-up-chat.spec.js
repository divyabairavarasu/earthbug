/**
 * Follow-up chat tests — after a successful bug analysis, users can ask
 * follow-up questions via suggested chips or a free-text input.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginWithApiKey, GEMINI_URL_PATTERN } from './helpers/mock-gemini.js';
import { MOCK_BUG_ANALYSIS, buildGeminiHttpResponse } from './fixtures/mock-responses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PNG_PATH = path.join(__dirname, 'fixtures', 'test-bug.png');

const FOLLOW_UP_ANSWER = 'Ladybugs are attracted by planting dill, fennel, and marigolds nearby.';

async function uploadAndAnalyze(page) {
  // First call → analysis result; subsequent calls → follow-up chat answers
  let callCount = 0;
  await page.route(GEMINI_URL_PATTERN, (route) => {
    callCount++;
    if (callCount === 1) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildGeminiHttpResponse(JSON.stringify(MOCK_BUG_ANALYSIS))),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildGeminiHttpResponse(FOLLOW_UP_ANSWER)),
      });
    }
  });

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photo/i }).click(),
  ]);
  await chooser.setFiles(PNG_PATH);
  await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });
}

test.describe('Follow-up chat — section visibility', () => {
  test('chat section shown after successful analysis', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndAnalyze(page);
    await expect(page.getByText('Ask About This Bug')).toBeVisible();
  });

  test('suggested question chips are rendered', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndAnalyze(page);
    await expect(page.getByRole('button', { name: /How do I attract more/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /What eats this bug/i })).toBeVisible();
  });

  test('custom question input and Ask button are rendered', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndAnalyze(page);
    await expect(page.getByPlaceholder(/Ask anything about this bug/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Ask$/i })).toBeVisible();
  });

  test('Ask button disabled when input is empty', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndAnalyze(page);
    await expect(page.getByRole('button', { name: /^Ask$/i })).toBeDisabled();
  });

  test('no chat section in demo mode (no live chat session)', async ({ page }) => {
    await page.goto('/?demo=true');
    await expect(page.getByText('Ask About This Bug')).not.toBeVisible();
  });
});

test.describe('Follow-up chat — asking a question', () => {
  test('clicking a suggested question shows loading state then answer', async ({ page }) => {
    await loginWithApiKey(page);

    // Small delay on the follow-up so the loading indicator is reliably visible
    let callCount = 0;
    await page.route(GEMINI_URL_PATTERN, async (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildGeminiHttpResponse(JSON.stringify(MOCK_BUG_ANALYSIS))),
        });
      } else {
        await new Promise((r) => setTimeout(r, 500));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildGeminiHttpResponse(FOLLOW_UP_ANSWER)),
        });
      }
    });

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(PNG_PATH);
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /What eats this bug/i }).click();

    await expect(page.getByText(/Consulting the entomologist/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(FOLLOW_UP_ANSWER)).toBeVisible({ timeout: 10_000 });
  });

  test('typing a custom question and clicking Ask shows the answer', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndAnalyze(page);

    await page.getByPlaceholder(/Ask anything about this bug/i).fill('How long do ladybugs live?');
    await page.getByRole('button', { name: /^Ask$/i }).click();

    await expect(page.getByText(FOLLOW_UP_ANSWER)).toBeVisible({ timeout: 10_000 });
  });

  test('pressing Enter in the input submits the question', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndAnalyze(page);

    await page.getByPlaceholder(/Ask anything about this bug/i).fill('Where do ladybugs overwinter?');
    await page.getByPlaceholder(/Ask anything about this bug/i).press('Enter');

    await expect(page.getByText(FOLLOW_UP_ANSWER)).toBeVisible({ timeout: 10_000 });
  });

  test('suggested question populates the input field', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndAnalyze(page);

    const chip = page.getByRole('button', { name: /How do I attract more/i });
    await chip.click();

    const input = page.getByPlaceholder(/Ask anything about this bug/i);
    await expect(input).toHaveValue(/How do I attract more/i);
  });

  test('inputs disabled while question is in flight', async ({ page }) => {
    await loginWithApiKey(page);

    // Slow follow-up so we can assert disabled state before it resolves
    let callCount = 0;
    await page.route(GEMINI_URL_PATTERN, async (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildGeminiHttpResponse(JSON.stringify(MOCK_BUG_ANALYSIS))),
        });
      } else {
        await new Promise((r) => setTimeout(r, 3_000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildGeminiHttpResponse(FOLLOW_UP_ANSWER)),
        });
      }
    });

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(PNG_PATH);
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/Ask anything about this bug/i).fill('A question');
    await page.getByRole('button', { name: /^Ask$/i }).click();

    // Loading indicator appears while in-flight
    // Loading indicator confirms isAskingFollowUp is true
    await expect(page.getByText(/Consulting the entomologist/i)).toBeVisible({ timeout: 5_000 });
    // Button text flips to "..." and carries disabled attribute while in-flight
    await expect(page.getByRole('button', { name: '...' })).toBeDisabled();
    // Input also disabled while in-flight
    await expect(page.getByPlaceholder(/Ask anything about this bug/i)).toBeDisabled();
  });
});

test.describe('Follow-up chat — error handling', () => {
  test('network failure on follow-up shows error message', async ({ page }) => {
    await loginWithApiKey(page);

    let callCount = 0;
    await page.route(GEMINI_URL_PATTERN, (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildGeminiHttpResponse(JSON.stringify(MOCK_BUG_ANALYSIS))),
        });
      } else {
        route.abort('failed');
      }
    });

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(PNG_PATH);
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /What eats this bug/i }).click();

    await expect(page.getByText(/Could not get an answer/i)).toBeVisible({ timeout: 10_000 });
  });

  test('asking a second question replaces the previous answer', async ({ page }) => {
    await loginWithApiKey(page);

    const SECOND_ANSWER = 'Birds, spiders, and parasitic wasps are natural predators.';
    let callCount = 0;
    await page.route(GEMINI_URL_PATTERN, (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildGeminiHttpResponse(JSON.stringify(MOCK_BUG_ANALYSIS))),
        });
      } else if (callCount === 2) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildGeminiHttpResponse(FOLLOW_UP_ANSWER)),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildGeminiHttpResponse(SECOND_ANSWER)),
        });
      }
    });

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(PNG_PATH);
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });

    // First follow-up
    await page.getByRole('button', { name: /What eats this bug/i }).click();
    await expect(page.getByText(FOLLOW_UP_ANSWER)).toBeVisible({ timeout: 10_000 });

    // Second follow-up replaces the first answer
    await page.getByRole('button', { name: /How do I attract more/i }).click();
    await expect(page.getByText(SECOND_ANSWER)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(FOLLOW_UP_ANSWER)).not.toBeVisible();
  });
});
