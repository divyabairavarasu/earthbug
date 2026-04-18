/**
 * Follow-up chat tests — after a successful bug analysis, users can ask
 * follow-up questions via suggested chips or a free-text input.
 *
 * Analysis calls go to /api/identify; chat calls go to /api/chat.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginWithApiKey, IDENTIFY_URL, CHAT_URL } from './helpers/mock-gemini.js';
import { MOCK_BUG_ANALYSIS } from './fixtures/mock-responses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PNG_PATH = path.join(__dirname, 'fixtures', 'test-bug.png');

const FOLLOW_UP_ANSWER = 'Ladybugs are attracted by planting dill, fennel, and marigolds nearby.';

async function mockAnalysis(page) {
  await page.route(IDENTIFY_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_BUG_ANALYSIS),
    }),
  );
}

async function mockChat(page, answer = FOLLOW_UP_ANSWER, { delay = 0 } = {}) {
  await page.route(CHAT_URL, async (route) => {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answer }),
    });
  });
}

async function uploadAndAnalyze(page) {
  await mockAnalysis(page);
  await mockChat(page);

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photo/i }).click(),
  ]);
  await chooser.setFiles(PNG_PATH);
  await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });
}

// ─── Section visibility ───────────────────────────────────────────────────────

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

// ─── Asking a question ────────────────────────────────────────────────────────

test.describe('Follow-up chat — asking a question', () => {
  test('clicking a suggested question shows loading state then answer', async ({ page }) => {
    await loginWithApiKey(page);
    await mockAnalysis(page);
    await mockChat(page, FOLLOW_UP_ANSWER, { delay: 500 });

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

    await page.getByRole('button', { name: /How do I attract more/i }).click();
    await expect(page.getByPlaceholder(/Ask anything about this bug/i)).toHaveValue(
      /How do I attract more/i,
    );
  });

  test('inputs disabled while question is in flight', async ({ page }) => {
    await loginWithApiKey(page);
    await mockAnalysis(page);
    await mockChat(page, FOLLOW_UP_ANSWER, { delay: 3_000 });

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(PNG_PATH);
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/Ask anything about this bug/i).fill('A question');
    await page.getByRole('button', { name: /^Ask$/i }).click();

    await expect(page.getByText(/Consulting the entomologist/i)).toBeVisible({ timeout: 5_000 });
    // Button text changes to "..." while in-flight
    await expect(page.getByRole('button', { name: '...' })).toBeDisabled();
    await expect(page.getByPlaceholder(/Ask anything about this bug/i)).toBeDisabled();
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

test.describe('Follow-up chat — error handling', () => {
  test('network failure on follow-up shows error message', async ({ page }) => {
    await loginWithApiKey(page);
    await mockAnalysis(page);
    await page.route(CHAT_URL, (route) => route.abort('failed'));

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
    const SECOND_ANSWER = 'Birds, spiders, and parasitic wasps are natural predators.';
    await loginWithApiKey(page);
    await mockAnalysis(page);

    let chatCount = 0;
    await page.route(CHAT_URL, (route) => {
      chatCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: chatCount === 1 ? FOLLOW_UP_ANSWER : SECOND_ANSWER }),
      });
    });

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(PNG_PATH);
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /What eats this bug/i }).click();
    await expect(page.getByText(FOLLOW_UP_ANSWER)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /How do I attract more/i }).click();
    await expect(page.getByText(SECOND_ANSWER)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(FOLLOW_UP_ANSWER)).not.toBeVisible();
  });
});
