# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-features.spec.js >> Eco-Actions "What You Can Do" >> section absent when ecoActions is empty
- Location: tests/production-features.spec.js:132:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Ladybug' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Ladybug' })

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
          - img "Identified insect" [ref=e15]
          - generic [ref=e16]:
            - heading [active] [level=2]
            - paragraph
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e20]: 🤷
            - button "Share Find 🔗" [ref=e21] [cursor=pointer]
          - paragraph
          - generic [ref=e22]:
            - generic [ref=e23]:
              - generic [ref=e24]: ➖
              - generic [ref=e25]: Soil impact is .
              - generic [ref=e26]: "Soil:"
            - generic [ref=e27]:
              - generic [ref=e28]: ➖
              - generic [ref=e29]: Plant impact is .
              - generic [ref=e30]: "Plants:"
      - generic [ref=e31]:
        - heading "💬 Ask About This Bug" [level=3] [ref=e32]:
          - generic [ref=e33]: 💬
          - text: Ask About This Bug
        - generic [ref=e34]:
          - button "How do I attract more undefineds?" [ref=e35] [cursor=pointer]
          - button "What eats this bug?" [ref=e36] [cursor=pointer]
          - button "Is this bug affected by climate change?" [ref=e37] [cursor=pointer]
          - button "How can I protect this bug in my garden?" [ref=e38] [cursor=pointer]
        - generic [ref=e39]:
          - textbox "Ask anything about this bug..." [ref=e40]
          - button "Ask" [disabled] [ref=e41]
      - button "🐛 Scan Another Bug" [ref=e43] [cursor=pointer]
  - contentinfo [ref=e44]:
    - paragraph [ref=e45]:
      - text: Built with 🌍 for
      - 'link "DEV Weekend Challenge: Earth Day Edition" [ref=e46] [cursor=pointer]':
        - /url: https://dev.to/challenges/weekend-2026-04-16
    - paragraph [ref=e47]: Powered by Google Gemini · Every bug matters · 🐛 EarthBug
    - paragraph [ref=e48]: Helping gardeners protect pollinators, one scan at a time
```

# Test source

```ts
  1   | /**
  2   |  * Production-ready feature tests — covers:
  3   |  *   - App starts on camera view (no BYOK / API key entry removed)
  4   |  *   - New verdict labels: Mostly Helpful, Mostly Harmful, Context-Dependent
  5   |  *   - Nuance field rendered with ⚖️ icon
  6   |  *   - Eco-Actions "What You Can Do" section
  7   |  *   - iNaturalist "Contribute to Science" card
  8   |  *   - Backward-compatible verdict aliases (Garden Buddy, Garden Bully)
  9   |  */
  10  | import { test, expect } from '@playwright/test';
  11  | import path from 'path';
  12  | import { fileURLToPath } from 'url';
  13  | import { loginWithApiKey, GEMINI_URL_PATTERN } from './helpers/mock-gemini.js';
  14  | import {
  15  |   buildGeminiHttpResponse,
  16  |   MOCK_BUG_ANALYSIS,
  17  |   MOCK_HARMFUL_BUG,
  18  |   MOCK_CONTEXT_BUG,
  19  | } from './fixtures/mock-responses.js';
  20  | 
  21  | const __dirname = path.dirname(fileURLToPath(import.meta.url));
  22  | const PNG_PATH = path.join(__dirname, 'fixtures', 'test-bug.png');
  23  | 
  24  | async function uploadAndGetResult(page, bugData) {
  25  |   await page.route(GEMINI_URL_PATTERN, (route) =>
  26  |     route.fulfill({
  27  |       status: 200,
  28  |       contentType: 'application/json',
  29  |       body: JSON.stringify(buildGeminiHttpResponse(JSON.stringify(bugData))),
  30  |     }),
  31  |   );
  32  | 
  33  |   const [chooser] = await Promise.all([
  34  |     page.waitForEvent('filechooser'),
  35  |     page.getByRole('button', { name: /upload photo/i }).click(),
  36  |   ]);
  37  |   await chooser.setFiles(PNG_PATH);
> 38  |   await expect(page.getByRole('heading', { name: bugData.name })).toBeVisible({ timeout: 10_000 });
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  39  | }
  40  | 
  41  | // ─── App entry point ────────────────────────────────────────────────────────
  42  | 
  43  | test.describe('No BYOK — app entry point', () => {
  44  |   test('app starts directly on camera view with no API key screen', async ({ page }) => {
  45  |     await page.goto('/');
  46  |     await expect(page.getByRole('button', { name: /Open Camera/i })).toBeVisible();
  47  |     await expect(page.getByLabel(/api key/i)).not.toBeVisible();
  48  |   });
  49  | 
  50  |   test('"Change API key" button is not present on camera view', async ({ page }) => {
  51  |     await page.goto('/');
  52  |     await expect(page.getByRole('button', { name: /Change API key/i })).not.toBeVisible();
  53  |   });
  54  | });
  55  | 
  56  | // ─── Verdict labels ──────────────────────────────────────────────────────────
  57  | 
  58  | test.describe('New verdict types', () => {
  59  |   test('Mostly Helpful verdict renders 🌱 badge', async ({ page }) => {
  60  |     await loginWithApiKey(page);
  61  |     await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
  62  |     await expect(page.getByText('Mostly Helpful')).toBeVisible();
  63  |     await expect(page.getByText('🌱').first()).toBeVisible();
  64  |   });
  65  | 
  66  |   test('Mostly Harmful verdict renders ⚠️ badge', async ({ page }) => {
  67  |     await loginWithApiKey(page);
  68  |     await uploadAndGetResult(page, MOCK_HARMFUL_BUG);
  69  |     await expect(page.getByText('Mostly Harmful')).toBeVisible();
  70  |     await expect(page.getByText('⚠️').first()).toBeVisible();
  71  |   });
  72  | 
  73  |   test('Context-Dependent verdict renders 🤷 badge', async ({ page }) => {
  74  |     await loginWithApiKey(page);
  75  |     await uploadAndGetResult(page, MOCK_CONTEXT_BUG);
  76  |     await expect(page.getByText('Context-Dependent')).toBeVisible();
  77  |     await expect(page.getByText('🤷').first()).toBeVisible();
  78  |   });
  79  | 
  80  |   test('legacy Garden Buddy verdict still renders correctly', async ({ page }) => {
  81  |     await loginWithApiKey(page);
  82  |     const legacyBug = { ...MOCK_BUG_ANALYSIS, verdict: 'Garden Buddy' };
  83  |     await uploadAndGetResult(page, legacyBug);
  84  |     await expect(page.getByText('Garden Buddy')).toBeVisible();
  85  |     await expect(page.getByText('🌱').first()).toBeVisible();
  86  |   });
  87  | 
  88  |   test('legacy Garden Bully verdict still renders correctly', async ({ page }) => {
  89  |     await loginWithApiKey(page);
  90  |     const legacyBug = { ...MOCK_HARMFUL_BUG, verdict: 'Garden Bully' };
  91  |     await uploadAndGetResult(page, legacyBug);
  92  |     await expect(page.getByText('Garden Bully')).toBeVisible();
  93  |     await expect(page.getByText('⚠️').first()).toBeVisible();
  94  |   });
  95  | });
  96  | 
  97  | // ─── Nuance field ────────────────────────────────────────────────────────────
  98  | 
  99  | test.describe('Nuance field', () => {
  100 |   test('nuance text is rendered with ⚖️ icon when present', async ({ page }) => {
  101 |     await loginWithApiKey(page);
  102 |     await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
  103 |     await expect(page.getByText('⚖️')).toBeVisible();
  104 |     await expect(page.getByText(MOCK_BUG_ANALYSIS.nuance)).toBeVisible();
  105 |   });
  106 | 
  107 |   test('nuance section absent when field is missing', async ({ page }) => {
  108 |     await loginWithApiKey(page);
  109 |     const { nuance: _n, ...bugWithoutNuance } = MOCK_BUG_ANALYSIS;
  110 |     await uploadAndGetResult(page, bugWithoutNuance);
  111 |     await expect(page.getByText('⚖️')).not.toBeVisible();
  112 |   });
  113 | });
  114 | 
  115 | // ─── Eco-Actions section ─────────────────────────────────────────────────────
  116 | 
  117 | test.describe('Eco-Actions "What You Can Do"', () => {
  118 |   test('section renders when ecoActions array is non-empty', async ({ page }) => {
  119 |     await loginWithApiKey(page);
  120 |     await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
  121 |     await expect(page.getByText('What You Can Do')).toBeVisible();
  122 |   });
  123 | 
  124 |   test('all eco-action items are listed', async ({ page }) => {
  125 |     await loginWithApiKey(page);
  126 |     await uploadAndGetResult(page, MOCK_BUG_ANALYSIS);
  127 |     for (const action of MOCK_BUG_ANALYSIS.ecoActions) {
  128 |       await expect(page.getByText(action)).toBeVisible();
  129 |     }
  130 |   });
  131 | 
  132 |   test('section absent when ecoActions is empty', async ({ page }) => {
  133 |     await loginWithApiKey(page);
  134 |     const bugNoActions = { ...MOCK_BUG_ANALYSIS, ecoActions: [] };
  135 |     await uploadAndGetResult(page, bugNoActions);
  136 |     await expect(page.getByText('What You Can Do')).not.toBeVisible();
  137 |   });
  138 | 
```