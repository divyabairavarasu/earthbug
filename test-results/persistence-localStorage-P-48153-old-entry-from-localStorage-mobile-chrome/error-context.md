# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: persistence.spec.js >> localStorage Persistence >> changing API key removes old entry from localStorage
- Location: tests/persistence.spec.js:36:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /change api key/i })

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
  2   | 
  3   | const apiKeyInput = (page) => page.getByRole('textbox', { name: /gemini api key/i });
  4   | const submitBtn   = (page) => page.getByRole('button', { name: /connect & start/i });
  5   | const changeBtn   = (page) => page.getByRole('button', { name: /change api key/i });
  6   | 
  7   | test.describe('localStorage Persistence', () => {
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await page.goto('/');
  10  |     await page.evaluate(() => window.localStorage.clear());
  11  |     await page.reload();
  12  |   });
  13  | 
  14  |   test('no stored key → shows API key form', async ({ page }) => {
  15  |     await expect(apiKeyInput(page)).toBeVisible();
  16  |   });
  17  | 
  18  |   test('stored key → skips to camera view on load', async ({ page }) => {
  19  |     await page.evaluate(() =>
  20  |       window.localStorage.setItem('earthbug_api_key', 'AIza-stored-key'),
  21  |     );
  22  |     await page.reload();
  23  |     await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
  24  |   });
  25  | 
  26  |   test('API key is stored under the key "earthbug_api_key"', async ({ page }) => {
  27  |     await apiKeyInput(page).fill('AIza-my-key');
  28  |     await submitBtn(page).click();
  29  | 
  30  |     const stored = await page.evaluate(() =>
  31  |       window.localStorage.getItem('earthbug_api_key'),
  32  |     );
  33  |     expect(stored).toBe('AIza-my-key');
  34  |   });
  35  | 
  36  |   test('changing API key removes old entry from localStorage', async ({ page }) => {
  37  |     await page.evaluate(() =>
  38  |       window.localStorage.setItem('earthbug_api_key', 'AIza-old-key'),
  39  |     );
  40  |     await page.reload();
  41  | 
> 42  |     await changeBtn(page).click();
      |                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
  43  | 
  44  |     const stored = await page.evaluate(() =>
  45  |       window.localStorage.getItem('earthbug_api_key'),
  46  |     );
  47  |     expect(stored).toBeNull();
  48  |   });
  49  | 
  50  |   test('entering a new key after clearing replaces old value', async ({ page }) => {
  51  |     await page.evaluate(() =>
  52  |       window.localStorage.setItem('earthbug_api_key', 'AIza-old-key'),
  53  |     );
  54  |     await page.reload();
  55  | 
  56  |     await changeBtn(page).click();
  57  |     await apiKeyInput(page).fill('AIza-new-key');
  58  |     await submitBtn(page).click();
  59  | 
  60  |     const stored = await page.evaluate(() =>
  61  |       window.localStorage.getItem('earthbug_api_key'),
  62  |     );
  63  |     expect(stored).toBe('AIza-new-key');
  64  |   });
  65  | 
  66  |   // Scan history is now persisted to localStorage
  67  |   test('KNOWN-BUG: scan history is not persisted to localStorage', async ({ page }) => {
  68  |     await page.evaluate(() =>
  69  |       window.localStorage.setItem('earthbug_api_key', 'AIza-key'),
  70  |     );
  71  |     await page.reload();
  72  | 
  73  |     const keys = await page.evaluate(() => Object.keys(window.localStorage));
  74  |     const hasHistoryKey = keys.some((k) => k.toLowerCase().includes('history'));
  75  |     expect(hasHistoryKey).toBe(true);
  76  |   });
  77  | 
  78  |   test('scan history in localStorage never contains image data (base64)', async ({ page }) => {
  79  |     // Seed API key and mock Gemini
  80  |     await page.goto('/');
  81  |     await page.evaluate(() => {
  82  |       window.localStorage.setItem('earthbug_api_key', 'test-api-key-12345');
  83  |     });
  84  |     await page.reload();
  85  | 
  86  |     // Mock Gemini and upload a file to produce one history entry
  87  |     const { mockGeminiSuccess } = await import('./helpers/mock-gemini.js');
  88  |     await mockGeminiSuccess(page);
  89  | 
  90  |     const path = await import('path');
  91  |     const fs = await import('fs');
  92  |     const { fileURLToPath } = await import('url');
  93  |     const __dirname = path.default.dirname(fileURLToPath(import.meta.url));
  94  |     const jpegPath = path.default.join(__dirname, 'fixtures', 'test-bug.jpg');
  95  |     if (!fs.default.existsSync(jpegPath)) {
  96  |       const buf = Buffer.from(
  97  |         '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIA' +
  98  |         '/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EABoQAAMBAQEBAAAAAAAAAAAAAAECAwARBP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDJ' +
  99  |         '5OjPTK9xvt9GSSP/2Q==',
  100 |         'base64',
  101 |       );
  102 |       fs.default.writeFileSync(jpegPath, buf);
  103 |     }
  104 | 
  105 |     const [chooser] = await Promise.all([
  106 |       page.waitForEvent('filechooser'),
  107 |       page.getByRole('button', { name: /upload photo/i }).click(),
  108 |     ]);
  109 |     await chooser.setFiles(jpegPath);
  110 |     await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });
  111 | 
  112 |     // Read what was actually stored in localStorage
  113 |     const stored = await page.evaluate(() =>
  114 |       window.localStorage.getItem('earthbug_scan_history'),
  115 |     );
  116 |     expect(stored).not.toBeNull();
  117 |     expect(stored).not.toContain('data:image');
  118 |     expect(stored).not.toContain('base64');
  119 |   });
  120 | });
  121 | 
```