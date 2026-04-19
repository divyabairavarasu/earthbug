# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api-key.spec.js >> API Key Entry >> Show/Hide button toggles password field visibility
- Location: tests/api-key.spec.js:85:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('textbox', { name: /gemini api key/i })
Expected: "password"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for getByRole('textbox', { name: /gemini api key/i })

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
  3   | // Stable locator helpers matching the actual ApiKeyInput.jsx aria attributes
  4   | const apiKeyInput = (page) => page.getByRole('textbox', { name: /gemini api key/i });
  5   | const submitBtn   = (page) => page.getByRole('button', { name: /connect & start/i });
  6   | const changeBtn   = (page) => page.getByRole('button', { name: /change api key/i });
  7   | 
  8   | test.describe('API Key Entry', () => {
  9   |   test.beforeEach(async ({ page }) => {
  10  |     await page.goto('/');
  11  |     await page.evaluate(() => window.localStorage.clear());
  12  |     await page.reload();
  13  |   });
  14  | 
  15  |   test('shows the API key form on first load', async ({ page }) => {
  16  |     await expect(page.getByRole('heading', { name: /connect to google gemini/i })).toBeVisible();
  17  |     await expect(apiKeyInput(page)).toBeVisible();
  18  |     await expect(submitBtn(page)).toBeVisible();
  19  |   });
  20  | 
  21  |   // The submit button has disabled={!key.trim()} — should be disabled with empty input
  22  |   test('submit button is disabled when input is empty', async ({ page }) => {
  23  |     await apiKeyInput(page).clear();
  24  |     await expect(submitBtn(page)).toBeDisabled();
  25  |   });
  26  | 
  27  |   test('submitting a whitespace-only key does not proceed', async ({ page }) => {
  28  |     await apiKeyInput(page).fill('     ');
  29  |     // Button stays disabled because key.trim() is ''
  30  |     await expect(submitBtn(page)).toBeDisabled();
  31  |   });
  32  | 
  33  |   test('valid key enables the submit button', async ({ page }) => {
  34  |     await apiKeyInput(page).fill('AIza-test-key-abc123');
  35  |     await expect(submitBtn(page)).toBeEnabled();
  36  |   });
  37  | 
  38  |   test('valid key advances to camera view and stores it in localStorage', async ({ page }) => {
  39  |     await apiKeyInput(page).fill('AIza-test-key-abc123');
  40  |     await submitBtn(page).click();
  41  | 
  42  |     await expect(page.getByText(/open camera/i)).toBeVisible();
  43  | 
  44  |     const stored = await page.evaluate(() =>
  45  |       window.localStorage.getItem('earthbug_api_key'),
  46  |     );
  47  |     expect(stored).toBe('AIza-test-key-abc123');
  48  |   });
  49  | 
  50  |   test('stored key is loaded on page refresh, skipping API key screen', async ({ page }) => {
  51  |     await page.evaluate(() =>
  52  |       window.localStorage.setItem('earthbug_api_key', 'AIza-persisted-key'),
  53  |     );
  54  |     await page.reload();
  55  | 
  56  |     await expect(page.getByText(/open camera/i)).toBeVisible();
  57  |     await expect(apiKeyInput(page)).not.toBeVisible();
  58  |   });
  59  | 
  60  |   test('"Change API key" clears localStorage and returns to key form', async ({ page }) => {
  61  |     await page.evaluate(() =>
  62  |       window.localStorage.setItem('earthbug_api_key', 'AIza-persisted-key'),
  63  |     );
  64  |     await page.reload();
  65  | 
  66  |     await changeBtn(page).click();
  67  | 
  68  |     await expect(apiKeyInput(page)).toBeVisible();
  69  |     const stored = await page.evaluate(() =>
  70  |       window.localStorage.getItem('earthbug_api_key'),
  71  |     );
  72  |     expect(stored).toBeNull();
  73  |   });
  74  | 
  75  |   test('key input trims surrounding whitespace before storing', async ({ page }) => {
  76  |     await apiKeyInput(page).fill('  AIza-trimmed-key  ');
  77  |     await submitBtn(page).click();
  78  | 
  79  |     const stored = await page.evaluate(() =>
  80  |       window.localStorage.getItem('earthbug_api_key'),
  81  |     );
  82  |     expect(stored).toBe('AIza-trimmed-key');
  83  |   });
  84  | 
  85  |   test('Show/Hide button toggles password field visibility', async ({ page }) => {
  86  |     const input = apiKeyInput(page);
> 87  |     await expect(input).toHaveAttribute('type', 'password');
      |                         ^ Error: expect(locator).toHaveAttribute(expected) failed
  88  | 
  89  |     await page.getByRole('button', { name: /show api key/i }).click();
  90  |     await expect(input).toHaveAttribute('type', 'text');
  91  | 
  92  |     await page.getByRole('button', { name: /hide api key/i }).click();
  93  |     await expect(input).toHaveAttribute('type', 'password');
  94  |   });
  95  | 
  96  |   test('"Get a free Gemini API key" link is present', async ({ page }) => {
  97  |     const link = page.getByRole('link', { name: /get a free gemini api key/i });
  98  |     await expect(link).toBeVisible();
  99  |     await expect(link).toHaveAttribute('target', '_blank');
  100 |   });
  101 | });
  102 | 
```