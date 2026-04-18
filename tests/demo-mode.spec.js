/**
 * Demo mode tests — ?demo=true loads a pre-seeded ladybug result with no API
 * call, no API key required, and no camera access needed.
 */
import { test, expect } from '@playwright/test';

test.describe('Demo mode (?demo=true)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
  });

  test('shows results view immediately without any API call', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Seven-Spot Ladybug' })).toBeVisible();
  });

  test('displays scientific name', async ({ page }) => {
    await expect(page.getByText('Coccinella septempunctata')).toBeVisible();
  });

  test('renders Mostly Helpful verdict badge', async ({ page }) => {
    await expect(page.getByText('Mostly Helpful')).toBeVisible();
  });

  test('renders eco-actions section', async ({ page }) => {
    await expect(page.getByText('What You Can Do')).toBeVisible();
    await expect(page.getByText(/Don't spray pesticides/i)).toBeVisible();
  });

  test('renders iNaturalist link with correct species', async ({ page }) => {
    const link = page.getByRole('link', { name: /Report on iNaturalist/i });
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toContain('inaturalist.org');
    expect(href).toContain(encodeURIComponent('Coccinella septempunctata'));
  });

  test('iNaturalist link opens in new tab', async ({ page }) => {
    const link = page.getByRole('link', { name: /Report on iNaturalist/i });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('no chat section rendered (no live chat session in demo)', async ({ page }) => {
    await expect(page.getByText('Ask About This Bug')).not.toBeVisible();
  });

  test('"Scan Another Bug" navigates to camera view', async ({ page }) => {
    await page.getByRole('button', { name: /Scan Another Bug/i }).click();
    await expect(page.getByRole('button', { name: /Open Camera/i })).toBeVisible();
  });


});

test('normal navigation (no ?demo param) starts on camera view', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Open Camera/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Seven-Spot Ladybug' })).not.toBeVisible();
});
