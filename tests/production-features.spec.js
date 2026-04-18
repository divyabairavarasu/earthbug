/**
 * Production-ready feature tests — covers:
 *   - App starts on camera view (no BYOK / API key entry removed)
 *   - New verdict labels: Mostly Helpful, Mostly Harmful, Context-Dependent
 *   - Nuance field rendered with ⚖️ icon
 *   - Eco-Actions "What You Can Do" section
 *   - iNaturalist "Contribute to Science" card
 *   - Backward-compatible verdict aliases (Garden Buddy, Garden Bully)
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginWithApiKey, GEMINI_URL_PATTERN } from './helpers/mock-gemini.js';
import {
  buildGeminiHttpResponse,
  MOCK_BUG_ANALYSIS,
  MOCK_HARMFUL_BUG,
  MOCK_CONTEXT_BUG,
} from './fixtures/mock-responses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PNG_PATH = path.join(__dirname, 'fixtures', 'test-bug.png');

async function uploadAndGetResult(page, bugData) {
  await page.route(GEMINI_URL_PATTERN, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildGeminiHttpResponse(JSON.stringify(bugData))),
    }),
  );

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photo/i }).click(),
  ]);
  await chooser.setFiles(PNG_PATH);
  await expect(page.getByRole('heading', { name: bugData.name })).toBeVisible({ timeout: 10_000 });
}

// ─── App entry point ────────────────────────────────────────────────────────

test.describe('No BYOK — app entry point', () => {
  test('app starts directly on camera view with no API key screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Open Camera/i })).toBeVisible();
    await expect(page.getByLabel(/api key/i)).not.toBeVisible();
  });

  test('"Change API key" button is not present on camera view', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Change API key/i })).not.toBeVisible();
  });
});

// ─── Verdict labels ──────────────────────────────────────────────────────────

test.describe('New verdict types', () => {
  test('Mostly Helpful verdict renders 🌱 badge', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
    await expect(page.getByText('Mostly Helpful')).toBeVisible();
    await expect(page.getByText('🌱').first()).toBeVisible();
  });

  test('Mostly Harmful verdict renders ⚠️ badge', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_HARMFUL_BUG);
    await expect(page.getByText('Mostly Harmful')).toBeVisible();
    await expect(page.getByText('⚠️').first()).toBeVisible();
  });

  test('Context-Dependent verdict renders 🤷 badge', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_CONTEXT_BUG);
    await expect(page.getByText('Context-Dependent')).toBeVisible();
    await expect(page.getByText('🤷').first()).toBeVisible();
  });

  test('legacy Garden Buddy verdict still renders correctly', async ({ page }) => {
    await loginWithApiKey(page);
    const legacyBug = { ...MOCK_BUG_ANALYSIS, verdict: 'Garden Buddy' };
    await uploadAndGetResult(page, legacyBug);
    await expect(page.getByText('Garden Buddy')).toBeVisible();
    await expect(page.getByText('🌱').first()).toBeVisible();
  });

  test('legacy Garden Bully verdict still renders correctly', async ({ page }) => {
    await loginWithApiKey(page);
    const legacyBug = { ...MOCK_HARMFUL_BUG, verdict: 'Garden Bully' };
    await uploadAndGetResult(page, legacyBug);
    await expect(page.getByText('Garden Bully')).toBeVisible();
    await expect(page.getByText('⚠️').first()).toBeVisible();
  });
});

// ─── Nuance field ────────────────────────────────────────────────────────────

test.describe('Nuance field', () => {
  test('nuance text is rendered with ⚖️ icon when present', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
    await expect(page.getByText('⚖️')).toBeVisible();
    await expect(page.getByText(MOCK_BUG_ANALYSIS.nuance)).toBeVisible();
  });

  test('nuance section absent when field is missing', async ({ page }) => {
    await loginWithApiKey(page);
    const { nuance: _n, ...bugWithoutNuance } = MOCK_BUG_ANALYSIS;
    await uploadAndGetResult(page, bugWithoutNuance);
    await expect(page.getByText('⚖️')).not.toBeVisible();
  });
});

// ─── Eco-Actions section ─────────────────────────────────────────────────────

test.describe('Eco-Actions "What You Can Do"', () => {
  test('section renders when ecoActions array is non-empty', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
    await expect(page.getByText('What You Can Do')).toBeVisible();
  });

  test('all eco-action items are listed', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
    for (const action of MOCK_BUG_ANALYSIS.ecoActions) {
      await expect(page.getByText(action)).toBeVisible();
    }
  });

  test('section absent when ecoActions is empty', async ({ page }) => {
    await loginWithApiKey(page);
    const bugNoActions = { ...MOCK_BUG_ANALYSIS, ecoActions: [] };
    await uploadAndGetResult(page, bugNoActions);
    await expect(page.getByText('What You Can Do')).not.toBeVisible();
  });

  test('section absent when ecoActions field is missing', async ({ page }) => {
    await loginWithApiKey(page);
    const { ecoActions: _e, ...bugNoActions } = MOCK_BUG_ANALYSIS;
    await uploadAndGetResult(page, bugNoActions);
    await expect(page.getByText('What You Can Do')).not.toBeVisible();
  });
});

// ─── iNaturalist card ────────────────────────────────────────────────────────

test.describe('iNaturalist "Contribute to Science" card', () => {
  test('card renders when scientificName is present', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
    await expect(page.getByText('Contribute to Science')).toBeVisible();
  });

  test('link points to iNaturalist with encoded scientific name', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
    const link = page.getByRole('link', { name: /Report on iNaturalist/i });
    const href = await link.getAttribute('href');
    expect(href).toContain('inaturalist.org/observations/new');
    expect(href).toContain(encodeURIComponent(MOCK_BUG_ANALYSIS.scientificName));
  });

  test('link includes EarthBug attribution in description param', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
    const href = await page
      .getByRole('link', { name: /Report on iNaturalist/i })
      .getAttribute('href');
    expect(href).toContain('EarthBug');
  });

  test('link opens in new tab with safe rel attribute', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
    const link = page.getByRole('link', { name: /Report on iNaturalist/i });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('card absent when scientificName is missing', async ({ page }) => {
    await loginWithApiKey(page);
    const { scientificName: _s, ...bugNoSci } = MOCK_BUG_ANALYSIS;
    await uploadAndGetResult(page, bugNoSci);
    await expect(page.getByText('Contribute to Science')).not.toBeVisible();
  });
});

// ─── Bug image alt text ──────────────────────────────────────────────────────

test.describe('Improved bug image alt text', () => {
  test('hero image alt is "Photo of <name>" when name is present', async ({ page }) => {
    await loginWithApiKey(page);
    await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
    const img = page.getByRole('img', { name: `Photo of ${MOCK_BUG_ANALYSIS.name}` });
    await expect(img).toBeVisible();
  });
});
