# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: results-view.spec.js >> Results View >> uploaded image is shown in hero card
- Location: tests/results-view.spec.js:95:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('img[alt="Ladybug"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('img[alt="Ladybug"]').first()

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
      - generic [ref=e82]:
        - heading "💬 Ask About This Bug" [level=3] [ref=e83]:
          - generic [ref=e84]: 💬
          - text: Ask About This Bug
        - generic [ref=e85]:
          - button "How do I attract more Ladybugs?" [ref=e86] [cursor=pointer]
          - button "What eats this bug?" [ref=e87] [cursor=pointer]
          - button "Is this bug affected by climate change?" [ref=e88] [cursor=pointer]
          - button "How can I protect this bug in my garden?" [ref=e89] [cursor=pointer]
        - generic [ref=e90]:
          - textbox "Ask anything about this bug..." [ref=e91]
          - button "Ask" [disabled] [ref=e92]
      - button "🐛 Scan Another Bug" [ref=e94] [cursor=pointer]
  - contentinfo [ref=e95]:
    - paragraph [ref=e96]:
      - text: Built with 🌍 for
      - 'link "DEV Weekend Challenge: Earth Day Edition" [ref=e97] [cursor=pointer]':
        - /url: https://dev.to/challenges/weekend-2026-04-16
    - paragraph [ref=e98]: Powered by Google Gemini · Every bug matters · 🐛 EarthBug
    - paragraph [ref=e99]: Helping gardeners protect pollinators, one scan at a time
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
  9   | const PNG_PATH = path.join(__dirname, 'fixtures', 'test-bug.png');
  10  | 
  11  | function ensureTestPng() {
  12  |   if (!fs.existsSync(PNG_PATH)) {
  13  |     const buf = Buffer.from(
  14  |       'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  15  |       'base64',
  16  |     );
  17  |     fs.writeFileSync(PNG_PATH, buf);
  18  |   }
  19  |   return PNG_PATH;
  20  | }
  21  | 
  22  | async function goToResults(page, responseBody = MOCK_BUG_ANALYSIS) {
  23  |   await page.unroute(GEMINI_URL_PATTERN);
  24  |   await page.route(GEMINI_URL_PATTERN, (route) =>
  25  |     route.fulfill({
  26  |       status: 200,
  27  |       contentType: 'application/json',
  28  |       body: JSON.stringify(responseBody),
  29  |     }),
  30  |   );
  31  | 
  32  |   const [chooser] = await Promise.all([
  33  |     page.waitForEvent('filechooser'),
  34  |     page.getByRole('button', { name: /upload photo/i }).click(),
  35  |   ]);
  36  |   await chooser.setFiles(ensureTestPng());
  37  |   await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible({ timeout: 15_000 });
  38  | }
  39  | 
  40  | test.describe('Results View', () => {
  41  |   test.beforeEach(async ({ page }) => {
  42  |     ensureTestPng();
  43  |     await mockGeminiSuccess(page);
  44  |     await loginWithApiKey(page);
  45  |     await goToResults(page);
  46  |   });
  47  | 
  48  |   test('displays common name and scientific name', async ({ page }) => {
  49  |     await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible();
  50  |     await expect(page.getByText(MOCK_BUG_ANALYSIS.scientificName)).toBeVisible();
  51  |   });
  52  | 
  53  |   test('displays verdict badge', async ({ page }) => {
  54  |     await expect(page.getByText('Garden Buddy')).toBeVisible();
  55  |   });
  56  | 
  57  |   test('displays confidence level', async ({ page }) => {
  58  |     await expect(page.getByText(/high confidence/i)).toBeVisible();
  59  |   });
  60  | 
  61  |   test('displays summary text', async ({ page }) => {
  62  |     await expect(page.getByText(MOCK_BUG_ANALYSIS.summary)).toBeVisible();
  63  |   });
  64  | 
  65  |   test('displays soil and plant impact indicators', async ({ page }) => {
  66  |     // Use exact text to avoid strict-mode ambiguity from SR-only spans
  67  |     await expect(page.getByText('Soil: ', { exact: false }).first()).toBeVisible();
  68  |     await expect(page.getByText('Plants: ', { exact: false }).first()).toBeVisible();
  69  |   });
  70  | 
  71  |   test('displays benefits section with all benefit items', async ({ page }) => {
  72  |     await expect(page.getByText('How It Helps')).toBeVisible();
  73  |     for (const benefit of MOCK_BUG_ANALYSIS.benefits) {
  74  |       await expect(page.getByText(benefit.title)).toBeVisible();
  75  |     }
  76  |   });
  77  | 
  78  |   test('displays harms section with all harm items', async ({ page }) => {
  79  |     await expect(page.getByText('Potential Harms')).toBeVisible();
  80  |     for (const harm of MOCK_BUG_ANALYSIS.harms) {
  81  |       await expect(page.getByText(harm.title)).toBeVisible();
  82  |     }
  83  |   });
  84  | 
  85  |   test('displays ecosystem role card', async ({ page }) => {
  86  |     await expect(page.getByText('Ecosystem Role')).toBeVisible();
  87  |     await expect(page.getByText(MOCK_BUG_ANALYSIS.ecosystemRole)).toBeVisible();
  88  |   });
  89  | 
  90  |   test('displays "Did You Know?" section', async ({ page }) => {
  91  |     await expect(page.getByText('Did You Know?')).toBeVisible();
  92  |     await expect(page.getByText(MOCK_BUG_ANALYSIS.didYouKnow)).toBeVisible();
  93  |   });
  94  | 
  95  |   test('uploaded image is shown in hero card', async ({ page }) => {
  96  |     const img = page.locator('img[alt="Ladybug"]').first();
> 97  |     await expect(img).toBeVisible();
      |                       ^ Error: expect(locator).toBeVisible() failed
  98  |   });
  99  | 
  100 |   test('"Garden Buddy" verdict renders green badge', async ({ page }) => {
  101 |     const badge = page.getByText('Garden Buddy');
  102 |     await expect(badge).toHaveClass(/bg-leaf-100/);
  103 |   });
  104 | 
  105 |   test('"Garden Bully" verdict renders red badge', async ({ page, browser }) => {
  106 |     const ctx = await browser.newContext();
  107 |     const p = await ctx.newPage();
  108 |     await loginWithApiKey(p);
  109 | 
  110 |     const bullyBody = { ...MOCK_BUG_ANALYSIS, verdict: 'Garden Bully' };
  111 | 
  112 |     await p.route(GEMINI_URL_PATTERN, (route) =>
  113 |       route.fulfill({
  114 |         status: 200,
  115 |         contentType: 'application/json',
  116 |         body: JSON.stringify(bullyBody),
  117 |       }),
  118 |     );
  119 | 
  120 |     const [chooser] = await Promise.all([
  121 |       p.waitForEvent('filechooser'),
  122 |       p.getByRole('button', { name: /upload photo/i }).click(),
  123 |     ]);
  124 |     await chooser.setFiles(ensureTestPng());
  125 |     await expect(p.getByText('Garden Bully')).toBeVisible({ timeout: 15_000 });
  126 |     const badge = p.getByText('Garden Bully');
  127 |     await expect(badge).toHaveClass(/bg-red-50/);
  128 |     await ctx.close();
  129 |   });
  130 | 
  131 |   test('unknown verdict falls back to "It\'s Complicated" style', async ({ page, browser }) => {
  132 |     const ctx = await browser.newContext();
  133 |     const p = await ctx.newPage();
  134 |     await loginWithApiKey(p);
  135 | 
  136 |     const body = { ...MOCK_BUG_ANALYSIS, verdict: 'UnknownVerdict' };
  137 | 
  138 |     await p.route(GEMINI_URL_PATTERN, (route) =>
  139 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }),
  140 |     );
  141 | 
  142 |     const [chooser] = await Promise.all([
  143 |       p.waitForEvent('filechooser'),
  144 |       p.getByRole('button', { name: /upload photo/i }).click(),
  145 |     ]);
  146 |     await chooser.setFiles(ensureTestPng());
  147 |     await expect(p.getByText('UnknownVerdict')).toBeVisible({ timeout: 15_000 });
  148 |     // Should use amber (It's Complicated) fallback style
  149 |     const badge = p.getByText('UnknownVerdict');
  150 |     await expect(badge).toHaveClass(/bg-amber-50/);
  151 |     await ctx.close();
  152 |   });
  153 | 
  154 |   test('result with empty benefits array hides "How It Helps" section', async ({ page, browser }) => {
  155 |     const ctx = await browser.newContext();
  156 |     const p = await ctx.newPage();
  157 |     await loginWithApiKey(p);
  158 | 
  159 |     const body = { ...MOCK_BUG_ANALYSIS, benefits: [] };
  160 |     await p.route(GEMINI_URL_PATTERN, (route) =>
  161 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }),
  162 |     );
  163 | 
  164 |     const [chooser] = await Promise.all([
  165 |       p.waitForEvent('filechooser'),
  166 |       p.getByRole('button', { name: /upload photo/i }).click(),
  167 |     ]);
  168 |     await chooser.setFiles(ensureTestPng());
  169 |     await expect(p.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible({ timeout: 15_000 });
  170 |     await expect(p.getByText('How It Helps')).not.toBeVisible();
  171 |     await ctx.close();
  172 |   });
  173 | 
  174 |   test('heading receives focus when results load (accessibility)', async ({ page }) => {
  175 |     // The heading ref gets .focus() in useEffect — verify it is focused
  176 |     const focused = await page.evaluate(() => document.activeElement?.textContent);
  177 |     expect(focused).toContain(MOCK_BUG_ANALYSIS.name);
  178 |   });
  179 | 
  180 |   test('share button is visible', async ({ page }) => {
  181 |     await expect(page.getByRole('button', { name: /share find/i })).toBeVisible();
  182 |   });
  183 | 
  184 |   // Response validation now rejects a missing name field before reaching the UI
  185 |   test('KNOWN-BUG: missing name in result renders img alt as "undefined"', async ({ page, browser }) => {
  186 |     const ctx = await browser.newContext();
  187 |     const p = await ctx.newPage();
  188 |     await loginWithApiKey(p);
  189 | 
  190 |     const partialResult = { ...MOCK_BUG_ANALYSIS };
  191 |     delete partialResult.name;
  192 | 
  193 |     await p.route(GEMINI_URL_PATTERN, (route) =>
  194 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(partialResult) }),
  195 |     );
  196 | 
  197 |     const [chooser] = await Promise.all([
```