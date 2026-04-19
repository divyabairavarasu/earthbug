# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scan-history.spec.js >> Scan History >> clicking a history thumbnail navigates to results view
- Location: tests/scan-history.spec.js:67:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Garden Buddy')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Garden Buddy')

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
            - heading "Ladybug" [active] [level=2] [ref=e17]
            - paragraph [ref=e18]: Coccinella septempunctata
          - img "high confidence" [ref=e19]
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]:
              - generic [ref=e23]: 🌱
              - text: Mostly Helpful
            - button "Share Find 🔗" [ref=e24] [cursor=pointer]
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
      - generic [ref=e38]:
        - heading "🌿 How It Helps" [level=3] [ref=e39]:
          - generic [ref=e40]: 🌿
          - text: How It Helps
        - generic [ref=e41]:
          - generic [ref=e42]:
            - paragraph [ref=e43]: Aphid Control
            - paragraph [ref=e44]: Ladybugs consume hundreds of aphids per day, keeping pest populations in check naturally.
          - generic [ref=e45]:
            - paragraph [ref=e46]: Pollinator Support
            - paragraph [ref=e47]: Adult ladybugs feed on pollen and nectar, supporting plant reproduction.
      - generic [ref=e48]:
        - heading "🚨 Potential Harms" [level=3] [ref=e49]:
          - generic [ref=e50]: 🚨
          - text: Potential Harms
        - generic [ref=e52]:
          - paragraph [ref=e53]: Occasional Overcrowding
          - paragraph [ref=e54]: In very high numbers they can become a nuisance indoors during overwintering.
      - generic [ref=e55]:
        - heading "🌍 Ecosystem Role" [level=3] [ref=e56]:
          - generic [ref=e57]: 🌍
          - text: Ecosystem Role
        - paragraph [ref=e58]: Ladybugs are a key predatory insect in garden and agricultural ecosystems, controlling soft-bodied pests.
      - generic [ref=e59]:
        - heading "💡 Did You Know?" [level=3] [ref=e60]:
          - generic [ref=e61]: 💡
          - text: Did You Know?
        - paragraph [ref=e62]: A single ladybug can eat up to 5,000 aphids in its lifetime.
      - generic [ref=e63]:
        - heading "🌍 What You Can Do" [level=3] [ref=e64]:
          - generic [ref=e65]: 🌍
          - text: What You Can Do
        - list [ref=e66]:
          - listitem [ref=e67]:
            - generic [ref=e68]: →
            - generic [ref=e69]: Don't spray pesticides — ladybugs naturally control aphids
          - listitem [ref=e70]:
            - generic [ref=e71]: →
            - generic [ref=e72]: Plant marigolds and fennel to attract ladybugs
          - listitem [ref=e73]:
            - generic [ref=e74]: →
            - generic [ref=e75]: Report your sighting to iNaturalist
      - generic [ref=e76]:
        - heading "🔭 Contribute to Science" [level=3] [ref=e77]:
          - generic [ref=e78]: 🔭
          - text: Contribute to Science
        - paragraph [ref=e79]: Help scientists track biodiversity by reporting your sighting to iNaturalist.
        - link "🌿 Report on iNaturalist →" [ref=e80] [cursor=pointer]:
          - /url: https://www.inaturalist.org/observations/new?taxon_name=Coccinella%20septempunctata&description=Identified+via+EarthBug+%F0%9F%90%9B
          - generic [ref=e81]: 🌿
          - text: Report on iNaturalist →
      - button "🐛 Scan Another Bug" [ref=e83] [cursor=pointer]
  - contentinfo [ref=e84]:
    - paragraph [ref=e85]:
      - text: Built with 🌍 for
      - 'link "DEV Weekend Challenge: Earth Day Edition" [ref=e86] [cursor=pointer]':
        - /url: https://dev.to/challenges/weekend-2026-04-16
    - paragraph [ref=e87]: Powered by Google Gemini · Every bug matters · 🐛 EarthBug
    - paragraph [ref=e88]: Helping gardeners protect pollinators, one scan at a time
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import path from 'path';
  3   | import fs from 'fs';
  4   | import { fileURLToPath } from 'url';
  5   | import { mockGeminiSuccess, loginWithApiKey, GEMINI_URL_PATTERN } from './helpers/mock-gemini.js';
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
  22  | async function runOneScan(page) {
  23  |   // Reset client-side throttle so successive scans within the same test aren't blocked
  24  |   await page.evaluate(() => window.__earthbugResetRateLimit?.());
  25  | 
  26  |   await page.unroute(GEMINI_URL_PATTERN);
  27  |   await page.route(GEMINI_URL_PATTERN, (route) =>
  28  |     route.fulfill({
  29  |       status: 200,
  30  |       contentType: 'application/json',
  31  |       body: JSON.stringify(MOCK_BUG_ANALYSIS),
  32  |     }),
  33  |   );
  34  | 
  35  |   const [chooser] = await Promise.all([
  36  |     page.waitForEvent('filechooser'),
  37  |     page.getByRole('button', { name: /upload photo/i }).click(),
  38  |   ]);
  39  |   await chooser.setFiles(ensureTestJpeg());
  40  |   await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible({ timeout: 15_000 });
  41  |   await page.getByRole('button', { name: /scan another bug/i }).click();
  42  |   await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
  43  | }
  44  | 
  45  | test.describe('Scan History', () => {
  46  |   test.beforeEach(async ({ page }) => {
  47  |     ensureTestJpeg();
  48  |     await mockGeminiSuccess(page);
  49  |     await loginWithApiKey(page);
  50  |   });
  51  | 
  52  |   test('no history strip shown before any scan', async ({ page }) => {
  53  |     await expect(page.getByText(/recent scans/i)).not.toBeVisible();
  54  |   });
  55  | 
  56  |   test('history strip appears after first successful scan', async ({ page }) => {
  57  |     await runOneScan(page);
  58  |     await expect(page.getByText(/recent scans/i)).toBeVisible();
  59  |   });
  60  | 
  61  |   test('history thumbnail shows bug name', async ({ page }) => {
  62  |     await runOneScan(page);
  63  |     const thumbnail = page.locator('.grid button').first();
  64  |     await expect(thumbnail.getByText(MOCK_BUG_ANALYSIS.name)).toBeVisible();
  65  |   });
  66  | 
  67  |   test('clicking a history thumbnail navigates to results view', async ({ page }) => {
  68  |     await runOneScan(page);
  69  |     const thumbnail = page.locator('.grid button').first();
  70  |     await thumbnail.click();
  71  |     await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible();
> 72  |     await expect(page.getByText('Garden Buddy')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  73  |   });
  74  | 
  75  |   test('history thumbnails show verdict emoji', async ({ page }) => {
  76  |     await runOneScan(page);
  77  |     // Garden Buddy = 🌱
  78  |     const thumb = page.locator('.grid button').first();
  79  |     await expect(thumb.getByText('🌱')).toBeVisible();
  80  |   });
  81  | 
  82  |   test('history is limited to 10 entries', async ({ page }) => {
  83  |     // Run 11 scans with distinct bug names so deduplication doesn't interfere
  84  |     for (let i = 0; i < 11; i++) {
  85  |       const bugName = `TestBug${i}`;
  86  |       // Reset throttle so successive uploads in this loop aren't blocked
  87  |       await page.evaluate(() => window.__earthbugResetRateLimit?.());
  88  |       await page.unroute(GEMINI_URL_PATTERN);
  89  |       await page.route(GEMINI_URL_PATTERN, (route) =>
  90  |         route.fulfill({
  91  |           status: 200,
  92  |           contentType: 'application/json',
  93  |           body: JSON.stringify({ ...MOCK_BUG_ANALYSIS, name: bugName }),
  94  |         }),
  95  |       );
  96  |       const [chooser] = await Promise.all([
  97  |         page.waitForEvent('filechooser'),
  98  |         page.getByRole('button', { name: /upload photo/i }).click(),
  99  |       ]);
  100 |       await chooser.setFiles(ensureTestJpeg());
  101 |       await expect(page.getByRole('heading', { name: bugName })).toBeVisible({ timeout: 15_000 });
  102 |       await page.getByRole('button', { name: /scan another bug/i }).click();
  103 |       await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
  104 |     }
  105 |     const thumbs = page.locator('.grid button');
  106 |     await expect(thumbs).toHaveCount(10);
  107 |   });
  108 | 
  109 |   // Scan history is now persisted to localStorage — survives page refresh
  110 |   test('KNOWN-BUG: scan history is lost on page refresh', async ({ page }) => {
  111 |     await runOneScan(page);
  112 |     await expect(page.getByText(/recent scans/i)).toBeVisible();
  113 | 
  114 |     await page.reload();
  115 | 
  116 |     // After reload, history is restored from localStorage
  117 |     await expect(page.getByText(/recent scans/i)).toBeVisible({ timeout: 5000 });
  118 |   });
  119 | 
  120 |   // Scan history is now deduplicated by bug name
  121 |   test('KNOWN-BUG: scanning same bug multiple times adds duplicate history entries', async ({ page }) => {
  122 |     await runOneScan(page);
  123 |     await runOneScan(page);
  124 | 
  125 |     const thumbs = page.locator('.grid button');
  126 |     const count = await thumbs.count();
  127 |     // After deduplication, only 1 entry for the same bug name
  128 |     expect(count).toBe(1);
  129 | 
  130 |     const names = await thumbs.allInnerTexts();
  131 |     expect(names.filter((n) => n.includes(MOCK_BUG_ANALYSIS.name))).toHaveLength(1);
  132 |   });
  133 | 
  134 |   // BUG: Gemini "error" responses (no bug found) are NOT added to history,
  135 |   // which is correct — but re-viewing a history item that previously errored
  136 |   // is impossible since they're never stored. This test confirms the guard works.
  137 |   test('"no bug found" result is not added to scan history', async ({ page }) => {
  138 |     await page.unroute(GEMINI_URL_PATTERN);
  139 |     await page.route(GEMINI_URL_PATTERN, (route) =>
  140 |       route.fulfill({
  141 |         status: 200,
  142 |         contentType: 'application/json',
  143 |         body: JSON.stringify({ error: true, message: "No bug found!" }),
  144 |       }),
  145 |     );
  146 | 
  147 |     const [chooser] = await Promise.all([
  148 |       page.waitForEvent('filechooser'),
  149 |       page.getByRole('button', { name: /upload photo/i }).click(),
  150 |     ]);
  151 |     await chooser.setFiles(ensureTestJpeg());
  152 |     await expect(page.getByText(/no bug found/i)).toBeVisible({ timeout: 15_000 });
  153 |     await page.getByRole('button', { name: /try again/i }).click();
  154 | 
  155 |     await expect(page.getByText(/recent scans/i)).not.toBeVisible();
  156 |   });
  157 | });
  158 | 
```