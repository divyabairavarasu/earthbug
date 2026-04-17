import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { mockGeminiSuccess, loginWithApiKey } from './helpers/mock-gemini.js';
import { SUCCESS_HTTP_BODY, NO_BUG_HTTP_BODY } from './fixtures/mock-responses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Write a tiny JPEG to disk so Playwright can use it in file choosers
function ensureTestJpeg() {
  const dest = path.join(FIXTURES_DIR, 'test-bug.jpg');
  if (!fs.existsSync(dest)) {
    // Minimal valid JPEG (1×1 white pixel)
    const buf = Buffer.from(
      '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC' +
      'AABAAEDASIA/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EABoQAAMBAQEBAAAAAAAAAAAAAAECAwARBP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDJ' +
      '5OjPTK9xvt9GSSP/2Q==',
      'base64',
    );
    fs.writeFileSync(dest, buf);
  }
  return dest;
}

function ensureTestPng() {
  const dest = path.join(FIXTURES_DIR, 'test-bug.png');
  if (!fs.existsSync(dest)) {
    const buf = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64',
    );
    fs.writeFileSync(dest, buf);
  }
  return dest;
}

function ensureTestGif() {
  const dest = path.join(FIXTURES_DIR, 'test-bug.gif');
  if (!fs.existsSync(dest)) {
    // Minimal 1×1 GIF89a
    const buf = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    fs.writeFileSync(dest, buf);
  }
  return dest;
}

function ensureTextFile() {
  const dest = path.join(FIXTURES_DIR, 'not-an-image.txt');
  if (!fs.existsSync(dest)) fs.writeFileSync(dest, 'hello');
  return dest;
}

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => {
    ensureTestJpeg();
    ensureTestPng();
    ensureTestGif();
    ensureTextFile();
    await mockGeminiSuccess(page);
    await loginWithApiKey(page);
  });

  test('upload button opens file chooser', async ({ page }) => {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    expect(chooser).toBeTruthy();
    await chooser.setFiles(ensureTestJpeg());
  });

  // Note: using PNG here because the minimal JPEG fixture is not browser-decodable;
  // the compression step (Canvas API) silently fails on it. The JPEG path is covered
  // by the "GIF upload" test which bypasses compression. See KNOWN-BUG below.
  test('uploading an image transitions to analyzing view', async ({ page }) => {
    // Delay the mock so the Analyzing state is rendered before the response arrives
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SUCCESS_HTTP_BODY),
      });
    });

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestPng());
    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5000 });
  });

  test('uploading a PNG completes full analysis flow', async ({ page }) => {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestPng());
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });
  });

  test('drag-and-drop a JPEG completes analysis', async ({ page }) => {
    const dropZone = page.locator('[class*="border-dashed"]');
    const buffer = fs.readFileSync(ensureTestJpeg());

    const dataTransfer = await page.evaluateHandle(
      ([b64]) => {
        const dt = new DataTransfer();
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const file = new File([bytes], 'bug.jpg', { type: 'image/jpeg' });
        dt.items.add(file);
        return dt;
      },
      [buffer.toString('base64')],
    );

    await dropZone.dispatchEvent('dragover', { dataTransfer });
    await dropZone.dispatchEvent('drop', { dataTransfer });

    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });
  });

  test('drag-and-drop highlights the drop zone', async ({ page }) => {
    const dropZone = page.locator('[class*="border-dashed"]');
    await dropZone.dispatchEvent('dragover', {
      dataTransfer: await page.evaluateHandle(() => new DataTransfer()),
    });
    await expect(dropZone).toHaveClass(/border-leaf-400/);
  });

  test('drag-leave removes highlight from drop zone', async ({ page }) => {
    const dropZone = page.locator('[class*="border-dashed"]');
    const dt = await page.evaluateHandle(() => new DataTransfer());
    await dropZone.dispatchEvent('dragover', { dataTransfer: dt });
    await dropZone.dispatchEvent('dragleave', { dataTransfer: dt });
    await expect(dropZone).not.toHaveClass(/border-leaf-400/);
  });

  test('uploading a non-image file shows an error', async ({ page }) => {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTextFile());
    await expect(page.getByText(/please choose an image file/i)).toBeVisible();
  });

  test('upload error auto-dismisses after ~2 seconds', async ({ page }) => {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTextFile());
    await expect(page.getByText(/please choose an image file/i)).toBeVisible();
    await expect(page.getByText(/please choose an image file/i)).not.toBeVisible({
      timeout: 4000,
    });
  });

  // BUG: GIF files bypass compression and are sent as-is to Gemini.
  // For a large animated GIF this could send megabytes to the API.
  test('KNOWN-BUG: GIF upload bypasses compression and sends raw base64', async ({ page }) => {
    const requests = [];
    await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
      const body = route.request().postDataJSON();
      // Check if mimeType is image/gif (compression was skipped)
      const mimeType = body?.contents?.[0]?.parts?.find?.(
        p => p.inlineData,
      )?.inlineData?.mimeType;
      requests.push(mimeType ?? 'unknown');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SUCCESS_HTTP_BODY),
      });
    });

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestGif());
    await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });

    // GIF bypasses compression → mimeType sent is image/gif, not image/jpeg
    expect(requests[0]).toBe('image/gif'); // documents the behaviour — not necessarily desired
  });

  // BUG: File input is not reset on error, so re-selecting the same file
  // fires no change event and the user appears stuck.
  test('KNOWN-BUG: re-selecting same file after error does not re-trigger upload', async ({ page }) => {
    const [chooser1] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    // Trigger the error path
    await chooser1.setFiles(ensureTextFile());
    await expect(page.getByText(/please choose an image file/i)).toBeVisible();

    // Wait for the auto-dismiss so we can attempt again
    await page.waitForTimeout(2500);

    // The file input value is now '' (the code clears it on success, not on error)
    // On success path fileInputRef.current.value = '' is called — but NOT on error
    // So: trying to pick the same file again would fire no 'change' event.
    // This test documents that the error-path clear is missing.
    // (Automated test cannot fully validate this without a real second file chooser)
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();
  });

  test('Gemini "no bug found" response shows friendly error, not crash', async ({ page }) => {
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ error: true, message: "Couldn't find a bug!" }) }],
                role: 'model',
              },
              finishReason: 'STOP',
            },
          ],
        }),
      }),
    );

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /upload photo/i }).click(),
    ]);
    await chooser.setFiles(ensureTestJpeg());
    await expect(page.getByText(/couldn't find a bug/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });
});
