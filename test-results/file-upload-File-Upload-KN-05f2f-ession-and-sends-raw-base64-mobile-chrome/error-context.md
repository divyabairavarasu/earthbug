# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: file-upload.spec.js >> File Upload >> KNOWN-BUG: GIF upload bypasses compression and sends raw base64
- Location: tests/file-upload.spec.js:165:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "image/jpeg"
Received: "unknown"
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
  89  |     const [chooser] = await Promise.all([
  90  |       page.waitForEvent('filechooser'),
  91  |       page.getByRole('button', { name: /upload photo/i }).click(),
  92  |     ]);
  93  |     await chooser.setFiles(ensureTestPng());
  94  |     await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5000 });
  95  |   });
  96  | 
  97  |   test('uploading a PNG completes full analysis flow', async ({ page }) => {
  98  |     const [chooser] = await Promise.all([
  99  |       page.waitForEvent('filechooser'),
  100 |       page.getByRole('button', { name: /upload photo/i }).click(),
  101 |     ]);
  102 |     await chooser.setFiles(ensureTestPng());
  103 |     await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });
  104 |   });
  105 | 
  106 |   test('drag-and-drop a JPEG completes analysis', async ({ page }) => {
  107 |     const dropZone = page.locator('[class*="border-dashed"]');
  108 |     const buffer = fs.readFileSync(ensureTestJpeg());
  109 | 
  110 |     const dataTransfer = await page.evaluateHandle(
  111 |       ([b64]) => {
  112 |         const dt = new DataTransfer();
  113 |         const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  114 |         const file = new File([bytes], 'bug.jpg', { type: 'image/jpeg' });
  115 |         dt.items.add(file);
  116 |         return dt;
  117 |       },
  118 |       [buffer.toString('base64')],
  119 |     );
  120 | 
  121 |     await dropZone.dispatchEvent('dragover', { dataTransfer });
  122 |     await dropZone.dispatchEvent('drop', { dataTransfer });
  123 | 
  124 |     await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });
  125 |   });
  126 | 
  127 |   test('drag-and-drop highlights the drop zone', async ({ page }) => {
  128 |     const dropZone = page.locator('[class*="border-dashed"]');
  129 |     await dropZone.dispatchEvent('dragover', {
  130 |       dataTransfer: await page.evaluateHandle(() => new DataTransfer()),
  131 |     });
  132 |     await expect(dropZone).toHaveClass(/border-leaf-400/);
  133 |   });
  134 | 
  135 |   test('drag-leave removes highlight from drop zone', async ({ page }) => {
  136 |     const dropZone = page.locator('[class*="border-dashed"]');
  137 |     const dt = await page.evaluateHandle(() => new DataTransfer());
  138 |     await dropZone.dispatchEvent('dragover', { dataTransfer: dt });
  139 |     await dropZone.dispatchEvent('dragleave', { dataTransfer: dt });
  140 |     await expect(dropZone).not.toHaveClass(/border-leaf-400/);
  141 |   });
  142 | 
  143 |   test('uploading a non-image file shows an error', async ({ page }) => {
  144 |     const [chooser] = await Promise.all([
  145 |       page.waitForEvent('filechooser'),
  146 |       page.getByRole('button', { name: /upload photo/i }).click(),
  147 |     ]);
  148 |     await chooser.setFiles(ensureTextFile());
  149 |     await expect(page.getByText(/please choose an image file/i)).toBeVisible();
  150 |   });
  151 | 
  152 |   test('upload error auto-dismisses after ~2 seconds', async ({ page }) => {
  153 |     const [chooser] = await Promise.all([
  154 |       page.waitForEvent('filechooser'),
  155 |       page.getByRole('button', { name: /upload photo/i }).click(),
  156 |     ]);
  157 |     await chooser.setFiles(ensureTextFile());
  158 |     await expect(page.getByText(/please choose an image file/i)).toBeVisible();
  159 |     await expect(page.getByText(/please choose an image file/i)).not.toBeVisible({
  160 |       timeout: 4000,
  161 |     });
  162 |   });
  163 | 
  164 |   // GIF is now compressed to JPEG before sending to the API
  165 |   test('KNOWN-BUG: GIF upload bypasses compression and sends raw base64', async ({ page }) => {
  166 |     const requests = [];
  167 |     await page.route(GEMINI_URL_PATTERN, async (route) => {
  168 |       const body = route.request().postDataJSON();
  169 |       // Check the mimeType sent to the API
  170 |       const mimeType = body?.contents?.[0]?.parts?.find?.(
  171 |         p => p.inlineData,
  172 |       )?.inlineData?.mimeType;
  173 |       requests.push(mimeType ?? 'unknown');
  174 |       await route.fulfill({
  175 |         status: 200,
  176 |         contentType: 'application/json',
  177 |         body: JSON.stringify(MOCK_BUG_ANALYSIS),
  178 |       });
  179 |     });
  180 | 
  181 |     const [chooser] = await Promise.all([
  182 |       page.waitForEvent('filechooser'),
  183 |       page.getByRole('button', { name: /upload photo/i }).click(),
  184 |     ]);
  185 |     await chooser.setFiles(ensureTestGif());
  186 |     await expect(page.getByRole('heading', { name: 'Ladybug' })).toBeVisible({ timeout: 10_000 });
  187 | 
  188 |     // GIF is now compressed → mimeType sent is image/jpeg
> 189 |     expect(requests[0]).toBe('image/jpeg');
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  190 |   });
  191 | 
  192 |   // BUG: File input is not reset on error, so re-selecting the same file
  193 |   // fires no change event and the user appears stuck.
  194 |   test('KNOWN-BUG: re-selecting same file after error does not re-trigger upload', async ({ page }) => {
  195 |     const [chooser1] = await Promise.all([
  196 |       page.waitForEvent('filechooser'),
  197 |       page.getByRole('button', { name: /upload photo/i }).click(),
  198 |     ]);
  199 |     // Trigger the error path
  200 |     await chooser1.setFiles(ensureTextFile());
  201 |     await expect(page.getByText(/please choose an image file/i)).toBeVisible();
  202 | 
  203 |     // Wait for the auto-dismiss so we can attempt again
  204 |     await page.waitForTimeout(2500);
  205 | 
  206 |     // The file input value is now '' (the code clears it on success, not on error)
  207 |     // On success path fileInputRef.current.value = '' is called — but NOT on error
  208 |     // So: trying to pick the same file again would fire no 'change' event.
  209 |     // This test documents that the error-path clear is missing.
  210 |     // (Automated test cannot fully validate this without a real second file chooser)
  211 |     await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();
  212 |   });
  213 | 
  214 |   test('Gemini "no bug found" response shows friendly error, not crash', async ({ page }) => {
  215 |     await page.unroute(GEMINI_URL_PATTERN);
  216 |     await page.route(GEMINI_URL_PATTERN, (route) =>
  217 |       route.fulfill({
  218 |         status: 200,
  219 |         contentType: 'application/json',
  220 |         body: JSON.stringify(MOCK_NO_BUG_RESPONSE),
  221 |       }),
  222 |     );
  223 | 
  224 |     const [chooser] = await Promise.all([
  225 |       page.waitForEvent('filechooser'),
  226 |       page.getByRole('button', { name: /upload photo/i }).click(),
  227 |     ]);
  228 |     await chooser.setFiles(ensureTestJpeg());
  229 |     await expect(page.getByText(/couldn't find a bug/i)).toBeVisible({ timeout: 10_000 });
  230 |     await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  231 |   });
  232 | });
  233 | 
```