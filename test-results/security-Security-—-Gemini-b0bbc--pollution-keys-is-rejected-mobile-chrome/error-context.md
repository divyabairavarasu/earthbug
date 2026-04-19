# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.js >> Security — Gemini response validation >> response containing prototype pollution keys is rejected
- Location: tests/security.spec.js:180:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/unsafe keys/i)
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText(/unsafe keys/i)

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
          - img "Photo of Hack" [ref=e15]
          - generic [ref=e16]:
            - heading "Hack" [active] [level=2] [ref=e17]
            - paragraph
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]:
              - generic [ref=e21]: 🌱
              - text: Garden Buddy
            - button "Share Find 🔗" [ref=e22] [cursor=pointer]
          - paragraph
          - generic [ref=e23]:
            - generic [ref=e24]:
              - generic [ref=e25]: ➖
              - generic [ref=e26]: Soil impact is .
              - generic [ref=e27]: "Soil:"
            - generic [ref=e28]:
              - generic [ref=e29]: ➖
              - generic [ref=e30]: Plant impact is .
              - generic [ref=e31]: "Plants:"
      - generic [ref=e32]:
        - heading "💬 Ask About This Bug" [level=3] [ref=e33]:
          - generic [ref=e34]: 💬
          - text: Ask About This Bug
        - generic [ref=e35]:
          - button "How do I attract more Hacks?" [ref=e36] [cursor=pointer]
          - button "What eats this bug?" [ref=e37] [cursor=pointer]
          - button "Is this bug affected by climate change?" [ref=e38] [cursor=pointer]
          - button "How can I protect this bug in my garden?" [ref=e39] [cursor=pointer]
        - generic [ref=e40]:
          - textbox "Ask anything about this bug..." [ref=e41]
          - button "Ask" [disabled] [ref=e42]
      - button "🐛 Scan Another Bug" [ref=e44] [cursor=pointer]
  - contentinfo [ref=e45]:
    - paragraph [ref=e46]:
      - text: Built with 🌍 for
      - 'link "DEV Weekend Challenge: Earth Day Edition" [ref=e47] [cursor=pointer]':
        - /url: https://dev.to/challenges/weekend-2026-04-16
    - paragraph [ref=e48]: Powered by Google Gemini · Every bug matters · 🐛 EarthBug
    - paragraph [ref=e49]: Helping gardeners protect pollinators, one scan at a time
```

# Test source

```ts
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
  154 |     await expect(page.locator('.grid button')).toHaveCount(0);
  155 |   });
  156 | });
  157 | 
  158 | // ─── Gemini Response Validation ──────────────────────────────────────────────
  159 | 
  160 | test.describe('Security — Gemini response validation', () => {
  161 |   test.beforeEach(async ({ page }) => {
  162 |     ensureTestJpeg();
  163 |     await loginWithApiKey(page);
  164 |   });
  165 | 
  166 |   test('response missing required fields shows an error (not a crash)', async ({ page }) => {
  167 |     // Response is valid JSON but missing name and verdict
  168 |     await page.route(GEMINI_URL_PATTERN, (route) =>
  169 |       route.fulfill({
  170 |         status: 200,
  171 |         contentType: 'application/json',
  172 |         body: JSON.stringify({ summary: 'oops' }),
  173 |       }),
  174 |     );
  175 |     await uploadFile(page, ensureTestJpeg());
  176 | 
  177 |     await expect(page.getByText(/missing required fields/i)).toBeVisible({ timeout: 15_000 });
  178 |   });
  179 | 
  180 |   test('response containing prototype pollution keys is rejected', async ({ page }) => {
  181 |     // Use a literal JSON string so "__proto__" appears as a real key in the text
  182 |     const poisoned = '{"__proto__": {"isAdmin": true}, "name": "Hack", "verdict": "Garden Buddy"}';
  183 |     await page.route(GEMINI_URL_PATTERN, (route) =>
  184 |       route.fulfill({
  185 |         status: 200,
  186 |         contentType: 'application/json',
  187 |         body: poisoned,
  188 |       }),
  189 |     );
  190 |     await uploadFile(page, ensureTestJpeg());
  191 | 
> 192 |     await expect(page.getByText(/unsafe keys/i)).toBeVisible({ timeout: 15_000 });
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  193 |   });
  194 | 
  195 |   test('malformed JSON response shows a parse error (not a crash)', async ({ page }) => {
  196 |     await page.route(GEMINI_URL_PATTERN, (route) =>
  197 |       route.fulfill({
  198 |         status: 200,
  199 |         contentType: 'application/json',
  200 |         body: 'this is not json {',
  201 |       }),
  202 |     );
  203 |     await uploadFile(page, ensureTestJpeg());
  204 | 
  205 |     await expect(page.getByText(/could not parse/i)).toBeVisible({ timeout: 15_000 });
  206 |   });
  207 | });
  208 | 
  209 | // ─── MIME Type Allowlist ──────────────────────────────────────────────────────
  210 | 
  211 | test.describe('Security — MIME type allowlist', () => {
  212 |   test.beforeEach(async ({ page }) => {
  213 |     await loginWithApiKey(page);
  214 |   });
  215 | 
  216 |   async function uploadBuffer(page, buffer, mimeType, filename) {
  217 |     const [chooser] = await Promise.all([
  218 |       page.waitForEvent('filechooser'),
  219 |       page.getByRole('button', { name: /upload photo/i }).click(),
  220 |     ]);
  221 |     await chooser.setFiles({ name: filename, mimeType, buffer });
  222 |   }
  223 | 
  224 |   test('uploading a TIFF (not in allowlist) shows an error and does not analyze', async ({ page }) => {
  225 |     const fakeTiff = Buffer.from('II42', 'ascii'); // minimal TIFF-like header
  226 |     await uploadBuffer(page, fakeTiff, 'image/tiff', 'photo.tiff');
  227 |     // Should show upload error and stay on camera view
  228 |     await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible({ timeout: 5_000 });
  229 |   });
  230 | 
  231 |   test('uploading a BMP (not in allowlist) shows an error and does not analyze', async ({ page }) => {
  232 |     const fakeBmp = Buffer.from('BM', 'ascii');
  233 |     await uploadBuffer(page, fakeBmp, 'image/bmp', 'photo.bmp');
  234 |     await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible({ timeout: 5_000 });
  235 |   });
  236 | 
  237 |   test('allowed types (jpeg, png, webp) proceed to analysis', async ({ page }) => {
  238 |     ensureTestJpeg();
  239 |     await mockGeminiSuccess(page);
  240 |     await uploadFile(page, ensureTestJpeg());
  241 |     await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });
  242 |   });
  243 | });
  244 | 
  245 | // ─── localStorage image data ──────────────────────────────────────────────────
  246 | 
  247 | test.describe('Security — localStorage never stores image data', () => {
  248 |   test('imageUrl is stripped from scan history before writing to localStorage', async ({ page }) => {
  249 |     ensureTestJpeg();
  250 |     await loginWithApiKey(page);
  251 |     await mockGeminiSuccess(page);
  252 |     await uploadFile(page, ensureTestJpeg());
  253 |     await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });
  254 | 
  255 |     const stored = await page.evaluate(() =>
  256 |       window.localStorage.getItem('earthbug_scan_history'),
  257 |     );
  258 |     expect(stored).not.toBeNull();
  259 |     expect(stored).not.toContain('data:image');
  260 |     expect(stored).not.toContain('base64');
  261 |   });
  262 | 
  263 |   test('history thumbnails still appear after reload (using emoji placeholder)', async ({ page }) => {
  264 |     ensureTestJpeg();
  265 |     await loginWithApiKey(page);
  266 |     await mockGeminiSuccess(page);
  267 |     await uploadFile(page, ensureTestJpeg());
  268 |     await expect(page.getByRole('heading', { name: /ladybug/i })).toBeVisible({ timeout: 15_000 });
  269 |     await page.getByRole('button', { name: /scan another bug/i }).click();
  270 |     await expect(page.locator('.grid button')).toHaveCount(1);
  271 | 
  272 |     await page.reload();
  273 |     // History entry should still appear after reload
  274 |     await expect(page.locator('.grid button')).toHaveCount(1);
  275 |   });
  276 | });
  277 | 
  278 | 
```