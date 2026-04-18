# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: analysis-flow.spec.js >> Full Analysis Flow >> system prompt is included as first content part
- Location: tests/analysis-flow.spec.js:142:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
  59  |   });
  60  | 
  61  |   test('transitions from analyzing to results view', async ({ page }) => {
  62  |     await uploadAndWaitForResults(page);
  63  |     await expect(page.getByText(/analyzing/i)).not.toBeVisible();
  64  |   });
  65  | 
  66  |   // Note: SDK v0.21.0 sends the API key as the x-goog-api-key request header,
  67  |   // NOT as a query parameter — the URL has no ?key=... suffix.
  68  |   test('Gemini request hits the generateContent endpoint with correct URL', async ({ page }) => {
  69  |     let capturedUrl = '';
  70  |     let capturedHeaders = {};
  71  |     await page.unroute(GEMINI_URL_PATTERN);
  72  |     await page.route(GEMINI_URL_PATTERN, async (route) => {
  73  |       capturedUrl = route.request().url();
  74  |       capturedHeaders = route.request().headers();
  75  |       route.fulfill({
  76  |         status: 200,
  77  |         contentType: 'application/json',
  78  |         body: JSON.stringify(MOCK_BUG_ANALYSIS),
  79  |       });
  80  |     });
  81  | 
  82  |     await uploadAndWaitForResults(page);
  83  | 
  84  |     expect(capturedUrl).toContain('generateContent');
  85  |     // API key is delivered via header, not query string (SDK v0.21+ behaviour)
  86  |     const keyHeader = capturedHeaders['x-goog-api-key'] ?? capturedHeaders['authorization'] ?? '';
  87  |     expect(keyHeader).toContain('test-api-key-12345');
  88  |   });
  89  | 
  90  |   // Verifies the model name embedded in the URL — was Bug #1 (now fixed)
  91  |   test('CRITICAL-BUG: request URL uses gemini-1.5-flash which is 404 on v1beta', async ({ page }) => {
  92  |     let capturedUrl = '';
  93  |     await page.unroute(GEMINI_URL_PATTERN);
  94  |     await page.route(GEMINI_URL_PATTERN, async (route) => {
  95  |       capturedUrl = route.request().url();
  96  |       route.fulfill({
  97  |         status: 200,
  98  |         contentType: 'application/json',
  99  |         body: JSON.stringify(MOCK_BUG_ANALYSIS),
  100 |       });
  101 |     });
  102 | 
  103 |     await uploadAndWaitForResults(page);
  104 | 
  105 |     // Model has been updated to gemini-3-flash-preview
  106 |     expect(capturedUrl).toContain('gemini-3-flash-preview');
  107 |   });
  108 | 
  109 |   test('Gemini response wrapped in markdown fences is parsed correctly', async ({ page }) => {
  110 |     await page.unroute(GEMINI_URL_PATTERN);
  111 |     await page.route(GEMINI_URL_PATTERN, (route) =>
  112 |       route.fulfill({
  113 |         status: 200,
  114 |         contentType: 'application/json',
  115 |         body: JSON.stringify(MOCK_BUG_ANALYSIS),
  116 |       }),
  117 |     );
  118 | 
  119 |     await uploadAndWaitForResults(page);
  120 |     await expect(page.getByRole('heading', { name: MOCK_BUG_ANALYSIS.name })).toBeVisible();
  121 |   });
  122 | 
  123 |   test('image is included in the request payload (base64 inlineData)', async ({ page }) => {
  124 |     let hasImageData = false;
  125 |     await page.unroute(GEMINI_URL_PATTERN);
  126 |     await page.route(GEMINI_URL_PATTERN, async (route) => {
  127 |       const body = route.request().postDataJSON();
  128 |       hasImageData = body?.contents?.[0]?.parts?.some?.(
  129 |         p => p.inlineData?.data && p.inlineData.mimeType,
  130 |       );
  131 |       route.fulfill({
  132 |         status: 200,
  133 |         contentType: 'application/json',
  134 |         body: JSON.stringify(MOCK_BUG_ANALYSIS),
  135 |       });
  136 |     });
  137 | 
  138 |     await uploadAndWaitForResults(page);
  139 |     expect(hasImageData).toBe(true);
  140 |   });
  141 | 
  142 |   test('system prompt is included as first content part', async ({ page }) => {
  143 |     let hasSystemPrompt = false;
  144 |     await page.unroute(GEMINI_URL_PATTERN);
  145 |     await page.route(GEMINI_URL_PATTERN, async (route) => {
  146 |       const body = route.request().postDataJSON();
  147 |       const parts = body?.contents?.[0]?.parts ?? [];
  148 |       hasSystemPrompt = parts.some(
  149 |         p => typeof p.text === 'string' && p.text.includes('EarthBug'),
  150 |       );
  151 |       route.fulfill({
  152 |         status: 200,
  153 |         contentType: 'application/json',
  154 |         body: JSON.stringify(MOCK_BUG_ANALYSIS),
  155 |       });
  156 |     });
  157 | 
  158 |     await uploadAndWaitForResults(page);
> 159 |     expect(hasSystemPrompt).toBe(true);
      |                             ^ Error: expect(received).toBe(expected) // Object.is equality
  160 |   });
  161 | 
  162 |   test('"Scan Another Bug" returns to camera view', async ({ page }) => {
  163 |     await uploadAndWaitForResults(page);
  164 |     await page.getByRole('button', { name: /scan another bug/i }).click();
  165 |     await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
  166 |   });
  167 | 
  168 |   // BUG: handleScanAnother does not stop camera or clear the stream,
  169 |   // but since the camera was stopped before analysis, this is fine.
  170 |   // However, there is no auto-start of camera on return — user must click again.
  171 |   test('returning to camera view after analysis does not auto-start camera', async ({ page }) => {
  172 |     await uploadAndWaitForResults(page);
  173 |     await page.getByRole('button', { name: /scan another bug/i }).click();
  174 |     // Camera viewfinder should NOT be visible — user must click "Open Camera"
  175 |     await expect(page.locator('video')).not.toBeVisible();
  176 |   });
  177 | });
  178 | 
```