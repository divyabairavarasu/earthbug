# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sharing.spec.js >> Share Functionality >> clipboard text includes bug name and hashtags
- Location: tests/sharing.spec.js:69:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "Garden Buddy"
Received string:    "I found a Mostly Helpful! A beloved beetle known for devouring aphids and protecting gardens. #EarthBug #EarthDay
http://localhost:5173/"
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
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - img "Photo of Ladybug" [ref=e15]
          - generic [ref=e16]:
            - heading "Ladybug" [level=2] [ref=e17]
            - paragraph [ref=e18]: Coccinella septempunctata
          - img "high confidence" [ref=e19]
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]:
              - generic [ref=e23]: 🌱
              - text: Mostly Helpful
            - button "Share Find 🔗" [active] [ref=e24] [cursor=pointer]
          - paragraph [ref=e25]:
            - generic [ref=e26]: ⚖️
            - generic [ref=e27]: Non-native species can outcompete native ladybug populations.
          - paragraph [ref=e28]: A beloved beetle known for devouring aphids and protecting gardens.
          - generic [ref=e29]:
            - generic [ref=e30]:
              - generic [ref=e31]: ✅
              - generic [ref=e32]: Soil impact is positive.
              - generic [ref=e33]: "Soil: positive"
            - generic [ref=e34]:
              - generic [ref=e35]: ✅
              - generic [ref=e36]: Plant impact is positive.
              - generic [ref=e37]: "Plants: positive"
      - status [ref=e38]: Copied to clipboard!
      - generic [ref=e39]:
        - heading "🌿 How It Helps" [level=3] [ref=e40]:
          - generic [ref=e41]: 🌿
          - text: How It Helps
        - generic [ref=e42]:
          - generic [ref=e43]:
            - paragraph [ref=e44]: Aphid Control
            - paragraph [ref=e45]: Ladybugs consume hundreds of aphids per day, keeping pest populations in check naturally.
          - generic [ref=e46]:
            - paragraph [ref=e47]: Pollinator Support
            - paragraph [ref=e48]: Adult ladybugs feed on pollen and nectar, supporting plant reproduction.
      - generic [ref=e49]:
        - heading "🚨 Potential Harms" [level=3] [ref=e50]:
          - generic [ref=e51]: 🚨
          - text: Potential Harms
        - generic [ref=e53]:
          - paragraph [ref=e54]: Occasional Overcrowding
          - paragraph [ref=e55]: In very high numbers they can become a nuisance indoors during overwintering.
      - generic [ref=e56]:
        - heading "🌍 Ecosystem Role" [level=3] [ref=e57]:
          - generic [ref=e58]: 🌍
          - text: Ecosystem Role
        - paragraph [ref=e59]: Ladybugs are a key predatory insect in garden and agricultural ecosystems, controlling soft-bodied pests.
      - generic [ref=e60]:
        - heading "💡 Did You Know?" [level=3] [ref=e61]:
          - generic [ref=e62]: 💡
          - text: Did You Know?
        - paragraph [ref=e63]: A single ladybug can eat up to 5,000 aphids in its lifetime.
      - generic [ref=e64]:
        - heading "🌍 What You Can Do" [level=3] [ref=e65]:
          - generic [ref=e66]: 🌍
          - text: What You Can Do
        - list [ref=e67]:
          - listitem [ref=e68]:
            - generic [ref=e69]: →
            - generic [ref=e70]: Don't spray pesticides — ladybugs naturally control aphids
          - listitem [ref=e71]:
            - generic [ref=e72]: →
            - generic [ref=e73]: Plant marigolds and fennel to attract ladybugs
          - listitem [ref=e74]:
            - generic [ref=e75]: →
            - generic [ref=e76]: Report your sighting to iNaturalist
      - generic [ref=e77]:
        - heading "🔭 Contribute to Science" [level=3] [ref=e78]:
          - generic [ref=e79]: 🔭
          - text: Contribute to Science
        - paragraph [ref=e80]: Help scientists track biodiversity by reporting your sighting to iNaturalist.
        - link "🌿 Report on iNaturalist →" [ref=e81] [cursor=pointer]:
          - /url: https://www.inaturalist.org/observations/new?taxon_name=Coccinella%20septempunctata&description=Identified+via+EarthBug+%F0%9F%90%9B
          - generic [ref=e82]: 🌿
          - text: Report on iNaturalist →
      - generic [ref=e83]:
        - heading "💬 Ask About This Bug" [level=3] [ref=e84]:
          - generic [ref=e85]: 💬
          - text: Ask About This Bug
        - generic [ref=e86]:
          - button "How do I attract more Ladybugs?" [ref=e87] [cursor=pointer]
          - button "What eats this bug?" [ref=e88] [cursor=pointer]
          - button "Is this bug affected by climate change?" [ref=e89] [cursor=pointer]
          - button "How can I protect this bug in my garden?" [ref=e90] [cursor=pointer]
        - generic [ref=e91]:
          - textbox "Ask anything about this bug..." [ref=e92]
          - button "Ask" [disabled] [ref=e93]
      - button "🐛 Scan Another Bug" [ref=e95] [cursor=pointer]
  - contentinfo [ref=e96]:
    - paragraph [ref=e97]:
      - text: Built with 🌍 for
      - 'link "DEV Weekend Challenge: Earth Day Edition" [ref=e98] [cursor=pointer]':
        - /url: https://dev.to/challenges/weekend-2026-04-16
    - paragraph [ref=e99]: Powered by Google Gemini · Every bug matters · 🐛 EarthBug
    - paragraph [ref=e100]: Helping gardeners protect pollinators, one scan at a time
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import path from 'path';
  3   | import fs from 'fs';
  4   | import { fileURLToPath } from 'url';
  5   | import { mockGeminiSuccess, loginWithApiKey } from './helpers/mock-gemini.js';
  6   | import { MOCK_BUG_ANALYSIS } from './fixtures/mock-responses.js';
  7   | 
  8   | const __dirname = path.dirname(fileURLToPath(import.meta.url));
  9   | const JPEG_PATH = path.join(__dirname, 'fixtures', 'test-bug.jpg');
  10  | 
  11  | function ensureTestJpeg() {
  12  |   if (!fs.existsSync(JPEG_PATH)) {
  13  |     const buf = Buffer.from(
  14  |       '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIA/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EABoQAAMBAQEBAAAAAAAAAAAAAAECAwARBP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDJ5OjPTK9xvt9GSSP/2Q==',
  15  |       'base64',
  16  |     );
  17  |     fs.writeFileSync(JPEG_PATH, buf);
  18  |   }
  19  |   return JPEG_PATH;
  20  | }
  21  | 
  22  | async function goToResults(page) {
  23  |   const [chooser] = await Promise.all([
  24  |     page.waitForEvent('filechooser'),
  25  |     page.getByRole('button', { name: /upload photo/i }).click(),
  26  |   ]);
  27  |   await chooser.setFiles(ensureTestJpeg());
  28  |   await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible({ timeout: 15_000 });
  29  | }
  30  | 
  31  | test.describe('Share Functionality', () => {
  32  |   test.beforeEach(async ({ page }) => {
  33  |     ensureTestJpeg();
  34  |     await mockGeminiSuccess(page);
  35  |     await loginWithApiKey(page);
  36  |     await goToResults(page);
  37  |   });
  38  | 
  39  |   test('share button is present on results page', async ({ page }) => {
  40  |     await expect(page.getByRole('button', { name: /share find/i })).toBeVisible();
  41  |   });
  42  | 
  43  |   test('clipboard fallback: clicking share copies text and shows toast', async ({ page }) => {
  44  |     // Disable native Web Share API so the clipboard fallback is exercised
  45  |     await page.evaluate(() => {
  46  |       Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  47  |     });
  48  | 
  49  |     // Grant clipboard-write permission and track written text
  50  |     await page.context().grantPermissions(['clipboard-write']);
  51  | 
  52  |     await page.getByRole('button', { name: /share find/i }).click();
  53  | 
  54  |     // Toast should appear
  55  |     await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
  56  |   });
  57  | 
  58  |   test('share toast auto-dismisses after ~2 seconds', async ({ page }) => {
  59  |     await page.evaluate(() => {
  60  |       Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  61  |     });
  62  |     await page.context().grantPermissions(['clipboard-write']);
  63  | 
  64  |     await page.getByRole('button', { name: /share find/i }).click();
  65  |     await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
  66  |     await expect(page.getByText(/copied to clipboard/i)).not.toBeVisible({ timeout: 4000 });
  67  |   });
  68  | 
  69  |   test('clipboard text includes bug name and hashtags', async ({ page }) => {
  70  |     await page.evaluate(() => {
  71  |       Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  72  |     });
  73  |     await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
  74  | 
  75  |     await page.getByRole('button', { name: /share find/i }).click();
  76  |     await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
  77  | 
  78  |     const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
> 79  |     expect(clipboardText).toContain('Garden Buddy');
      |                           ^ Error: expect(received).toContain(expected) // indexOf
  80  |     expect(clipboardText).toContain('#EarthBug');
  81  |     expect(clipboardText).toContain('#EarthDay');
  82  |   });
  83  | 
  84  |   test('toast shows error message when clipboard API is unavailable', async ({ page }) => {
  85  |     await page.evaluate(() => {
  86  |       Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  87  |       Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  88  |     });
  89  | 
  90  |     await page.getByRole('button', { name: /share find/i }).click();
  91  |     await expect(page.getByText(/not supported in this browser/i)).toBeVisible();
  92  |   });
  93  | 
  94  |   test('AbortError from Web Share API (user cancelled) shows no toast', async ({ page }) => {
  95  |     await page.evaluate(() => {
  96  |       const err = new DOMException('User cancelled', 'AbortError');
  97  |       Object.defineProperty(navigator, 'share', {
  98  |         value: () => Promise.reject(err),
  99  |         configurable: true,
  100 |       });
  101 |     });
  102 | 
  103 |     await page.getByRole('button', { name: /share find/i }).click();
  104 |     // No share toast should appear — AbortError is silently swallowed.
  105 |     // (The confidence badge also has role="status", so check toast text only.)
  106 |     await page.waitForTimeout(500);
  107 |     await expect(page.getByText(/copied to clipboard|could not copy|not supported/i)).not.toBeVisible();
  108 |   });
  109 | 
  110 |   // Confidence badge now uses role="img" — only the toast has role="status"
  111 |   test('KNOWN-BUG: page has multiple role="status" elements (accessibility)', async ({ page }) => {
  112 |     await page.evaluate(() => {
  113 |       Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  114 |     });
  115 |     await page.context().grantPermissions(['clipboard-write']);
  116 |     await page.getByRole('button', { name: /share find/i }).click();
  117 |     await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
  118 | 
  119 |     const statusCount = await page.getByRole('status').count();
  120 |     // After fix: only the share toast has role="status" (confidence badge uses role="img")
  121 |     expect(statusCount).toBe(1);
  122 |   });
  123 | });
  124 | 
```