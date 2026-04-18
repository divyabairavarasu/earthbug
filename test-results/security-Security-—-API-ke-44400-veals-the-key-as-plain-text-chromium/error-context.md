# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.js >> Security — API key visibility >> Show button reveals the key as plain text
- Location: tests/security.spec.js:51:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/gemini api key/i)

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: 🐛
      - heading "EarthBug" [level=1] [ref=e7]
    - paragraph [ref=e8]: protect your local ecosystem
    - paragraph [ref=e9]: Snap a bug. Protect your local ecosystem.
    - generic [ref=e10]: 🌍 Earth Day · Citizen Science
  - main [ref=e11]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: 📸
        - paragraph [ref=e16]: Found a bug? Let's identify it!
        - paragraph [ref=e17]: Or drag and drop a bug photo here.
      - generic [ref=e18]:
        - button "Open Camera" [ref=e19] [cursor=pointer]:
          - img [ref=e20]
          - text: Open Camera
        - button "Upload Photo" [ref=e23] [cursor=pointer]:
          - img [ref=e24]
          - text: Upload Photo
  - contentinfo [ref=e26]:
    - paragraph [ref=e27]:
      - text: Built with 🌍 for
      - 'link "DEV Weekend Challenge: Earth Day Edition" [ref=e28] [cursor=pointer]':
        - /url: https://dev.to/challenges/weekend-2026-04-16
    - paragraph [ref=e29]: Powered by Google Gemini · Every bug matters · 🐛 EarthBug
    - paragraph [ref=e30]: Helping gardeners protect pollinators, one scan at a time
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import path from 'path';
  3   | import fs from 'fs';
  4   | import { fileURLToPath } from 'url';
  5   | import {
  6   |   mockGeminiSuccess,
  7   |   mockGeminiSafetyBlock,
  8   |   loginWithApiKey,
  9   |   GEMINI_URL_PATTERN,
  10  | } from './helpers/mock-gemini.js';
  11  | import { MOCK_NO_BUG_RESPONSE } from './fixtures/mock-responses.js';
  12  | 
  13  | const __dirname = path.dirname(fileURLToPath(import.meta.url));
  14  | const JPEG_PATH = path.join(__dirname, 'fixtures', 'test-bug.jpg');
  15  | 
  16  | function ensureTestJpeg() {
  17  |   if (!fs.existsSync(JPEG_PATH)) {
  18  |     const buf = Buffer.from(
  19  |       '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC' +
  20  |       'AABAAEDASIA/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EABoQAAMBAQEBAAAAAAAAAAAAAAECAwARBP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDJ' +
  21  |       '5OjPTK9xvt9GSSP/2Q==',
  22  |       'base64',
  23  |     );
  24  |     fs.writeFileSync(JPEG_PATH, buf);
  25  |   }
  26  |   return JPEG_PATH;
  27  | }
  28  | 
  29  | async function uploadFile(page, filePath) {
  30  |   const [chooser] = await Promise.all([
  31  |     page.waitForEvent('filechooser'),
  32  |     page.getByRole('button', { name: /upload photo/i }).click(),
  33  |   ]);
  34  |   await chooser.setFiles(filePath);
  35  | }
  36  | 
  37  | // ─── API Key Visibility ────────────────────────────────────────────────────────
  38  | 
  39  | test.describe('Security — API key visibility', () => {
  40  |   test.beforeEach(async ({ page }) => {
  41  |     await page.goto('/');
  42  |     await page.evaluate(() => window.localStorage.clear());
  43  |     await page.reload();
  44  |   });
  45  | 
  46  |   test('API key input is type="password" by default (hidden)', async ({ page }) => {
  47  |     const input = page.getByLabel(/gemini api key/i);
  48  |     await expect(input).toHaveAttribute('type', 'password');
  49  |   });
  50  | 
  51  |   test('Show button reveals the key as plain text', async ({ page }) => {
  52  |     const input = page.getByLabel(/gemini api key/i);
> 53  |     await input.fill('AIza-secret-key');
      |                 ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  54  |     await page.getByRole('button', { name: /show api key/i }).click();
  55  |     await expect(input).toHaveAttribute('type', 'text');
  56  |   });
  57  | 
  58  |   test('Hide button re-masks the key after reveal', async ({ page }) => {
  59  |     const input = page.getByLabel(/gemini api key/i);
  60  |     await input.fill('AIza-secret-key');
  61  |     await page.getByRole('button', { name: /show api key/i }).click();
  62  |     await page.getByRole('button', { name: /hide api key/i }).click();
  63  |     await expect(input).toHaveAttribute('type', 'password');
  64  |   });
  65  | 
  66  |   test('API key input has autocomplete=off to prevent browser autofill', async ({ page }) => {
  67  |     const input = page.getByLabel(/gemini api key/i);
  68  |     await expect(input).toHaveAttribute('autocomplete', 'off');
  69  |   });
  70  | });
  71  | 
  72  | // ─── Content Safety — Obscene / Blocked Images ────────────────────────────────
  73  | 
  74  | test.describe('Security — Content safety (obscene/inappropriate images)', () => {
  75  |   test.beforeEach(async ({ page }) => {
  76  |     ensureTestJpeg();
  77  |     await loginWithApiKey(page);
  78  |   });
  79  | 
  80  |   test('safety-blocked response shows a friendly content-safety error', async ({ page }) => {
  81  |     await mockGeminiSafetyBlock(page);
  82  |     await uploadFile(page, ensureTestJpeg());
  83  | 
  84  |     // Should return to camera view with an error banner
  85  |     await expect(page.getByText(/safety guidelines/i)).toBeVisible({ timeout: 15_000 });
  86  |   });
  87  | 
  88  |   test('safety error does not navigate to results view', async ({ page }) => {
  89  |     await mockGeminiSafetyBlock(page);
  90  |     await uploadFile(page, ensureTestJpeg());
  91  | 
  92  |     // Should stay on / return to camera view — results heading must not appear
  93  |     await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible({ timeout: 15_000 });
  94  |     await expect(page.getByRole('button', { name: /scan another bug/i })).not.toBeVisible();
  95  |   });
  96  | 
  97  |   test('safety error can be dismissed to allow a new upload', async ({ page }) => {
  98  |     await mockGeminiSafetyBlock(page);
  99  |     await uploadFile(page, ensureTestJpeg());
  100 | 
  101 |     await expect(page.getByText(/safety guidelines/i)).toBeVisible({ timeout: 15_000 });
  102 |     await page.getByRole('button', { name: /dismiss/i }).click();
  103 |     await expect(page.getByText(/safety guidelines/i)).not.toBeVisible();
  104 |     await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();
  105 |   });
  106 | 
  107 |   test('safety-blocked scan is NOT added to scan history', async ({ page }) => {
  108 |     // First do a successful scan so history exists
  109 |     await mockGeminiSuccess(page);
  110 |     await uploadFile(page, ensureTestJpeg());
  111 |     await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });
  112 |     await page.getByRole('button', { name: /scan another bug/i }).click();
  113 |     await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();
  114 | 
  115 |     const historyBefore = await page.locator('.grid button').count();
  116 | 
  117 |     // Now do a safety-blocked scan — reset throttle first
  118 |     await page.evaluate(() => window.__earthbugResetRateLimit?.());
  119 |     await page.unroute(GEMINI_URL_PATTERN);
  120 |     await mockGeminiSafetyBlock(page);
  121 |     await uploadFile(page, ensureTestJpeg());
  122 |     await expect(page.getByText(/safety guidelines/i)).toBeVisible({ timeout: 15_000 });
  123 | 
  124 |     // History count must not have increased
  125 |     const historyAfter = await page.locator('.grid button').count();
  126 |     expect(historyAfter).toBe(historyBefore);
  127 |   });
  128 | });
  129 | 
  130 | // ─── Content Safety — Non-bug Images ─────────────────────────────────────────
  131 | 
  132 | test.describe('Security — Non-bug / unrecognised image handling', () => {
  133 |   test.beforeEach(async ({ page }) => {
  134 |     ensureTestJpeg();
  135 |     await loginWithApiKey(page);
  136 |   });
  137 | 
  138 |   test('non-bug image response shows an error message in results', async ({ page }) => {
  139 |     await mockGeminiSuccess(page, MOCK_NO_BUG_RESPONSE);
  140 |     await uploadFile(page, ensureTestJpeg());
  141 | 
  142 |     // The results view renders the error message from the API
  143 |     await expect(page.getByText(/couldn't spot a bug/i)).toBeVisible({ timeout: 15_000 });
  144 |   });
  145 | 
  146 |   test('non-bug result is NOT added to scan history', async ({ page }) => {
  147 |     await mockGeminiSuccess(page, MOCK_NO_BUG_RESPONSE);
  148 |     await uploadFile(page, ensureTestJpeg());
  149 | 
  150 |     await expect(page.getByText(/couldn't spot a bug/i)).toBeVisible({ timeout: 15_000 });
  151 | 
  152 |     // Return to camera and verify no history thumbnails
  153 |     await page.getByRole('button', { name: /try again/i }).click();
```