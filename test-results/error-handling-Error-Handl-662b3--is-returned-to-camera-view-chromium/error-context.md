# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: error-handling.spec.js >> Error Handling — Gemini API failures >> after network error, user is returned to camera view
- Location: tests/error-handling.spec.js:171:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/could not reach gemini/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/could not reach gemini/i)

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
      - paragraph [ref=e13]: Something went wrong
      - paragraph [ref=e14]: Failed to fetch
      - button "Dismiss" [ref=e15] [cursor=pointer]
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]: 📸
        - paragraph [ref=e20]: Found a bug? Let's identify it!
        - paragraph [ref=e21]: Or drag and drop a bug photo here.
      - generic [ref=e22]:
        - button "Open Camera" [ref=e23] [cursor=pointer]:
          - img [ref=e24]
          - text: Open Camera
        - button "Upload Photo" [ref=e27] [cursor=pointer]:
          - img [ref=e28]
          - text: Upload Photo
  - contentinfo [ref=e30]:
    - paragraph [ref=e31]:
      - text: Built with 🌍 for
      - 'link "DEV Weekend Challenge: Earth Day Edition" [ref=e32] [cursor=pointer]':
        - /url: https://dev.to/challenges/weekend-2026-04-16
    - paragraph [ref=e33]: Powered by Google Gemini · Every bug matters · 🐛 EarthBug
    - paragraph [ref=e34]: Helping gardeners protect pollinators, one scan at a time
```

# Test source

```ts
  75  |     await expect(
  76  |       page.getByText(/quota limit/i),
  77  |     ).toBeVisible({ timeout: 10_000 });
  78  |   });
  79  | 
  80  |   test('quota error with retry-after includes seconds in message', async ({ page }) => {
  81  |     await mockGeminiError(page, 429, {
  82  |       error: {
  83  |         code: 429,
  84  |         message: 'Quota exceeded. Please retry in 45.0s.',
  85  |         status: 'RESOURCE_EXHAUSTED',
  86  |       },
  87  |     });
  88  | 
  89  |     await uploadFile(page, ensureTestJpeg());
  90  |     await expect(page.getByText(/45 second/i)).toBeVisible({ timeout: 10_000 });
  91  |   });
  92  | 
  93  |   // ── Authentication ────────────────────────────────────────────────────────
  94  |   test('HTTP 401 (invalid API key) shows auth error message', async ({ page }) => {
  95  |     await mockGeminiError(page, 401, {
  96  |       error: {
  97  |         code: 401,
  98  |         message: 'API key not valid. Please pass a valid API key.',
  99  |         status: 'UNAUTHENTICATED',
  100 |       },
  101 |     });
  102 | 
  103 |     await uploadFile(page, ensureTestJpeg());
  104 |     await expect(
  105 |       page.getByText(/api key was rejected/i),
  106 |     ).toBeVisible({ timeout: 10_000 });
  107 |   });
  108 | 
  109 |   test('HTTP 403 (forbidden) shows auth error message', async ({ page }) => {
  110 |     await mockGeminiError(page, 403, {
  111 |       error: {
  112 |         code: 403,
  113 |         message: 'The caller does not have permission.',
  114 |         status: 'PERMISSION_DENIED',
  115 |       },
  116 |     });
  117 | 
  118 |     await uploadFile(page, ensureTestJpeg());
  119 |     await expect(
  120 |       page.getByText(/api key was rejected/i),
  121 |     ).toBeVisible({ timeout: 10_000 });
  122 |   });
  123 | 
  124 |   // AUTH_FAILED_PATTERN now uses word boundaries — no false positives
  125 |   test('KNOWN-BUG: AUTH_FAILED_PATTERN falsely matches strings containing "401"', async ({ page }) => {
  126 |     // Craft an error whose message contains "401" in a non-status context
  127 |     await mockGeminiError(page, 500, {
  128 |       error: {
  129 |         code: 500,
  130 |         message: 'Internal error: batch 40138 failed.',
  131 |         status: 'INTERNAL',
  132 |       },
  133 |     });
  134 | 
  135 |     await uploadFile(page, ensureTestJpeg());
  136 | 
  137 |     // After fix: shows generic error, not auth error (word boundary prevents false positive)
  138 |     await expect(
  139 |       page.getByText(/earthbug could not analyze that photo right now/i),
  140 |     ).toBeVisible({ timeout: 10_000 });
  141 |   });
  142 | 
  143 |   // QUOTA_EXCEEDED_PATTERN now uses word boundaries — no false positives
  144 |   test('KNOWN-BUG: QUOTA_EXCEEDED_PATTERN falsely matches strings containing "429"', async ({ page }) => {
  145 |     await mockGeminiError(page, 500, {
  146 |       error: {
  147 |         code: 500,
  148 |         message: 'Batch job 4299 encountered an unexpected error.',
  149 |         status: 'INTERNAL',
  150 |       },
  151 |     });
  152 | 
  153 |     await uploadFile(page, ensureTestJpeg());
  154 | 
  155 |     // After fix: shows generic error, not quota error (word boundary prevents false positive)
  156 |     await expect(
  157 |       page.getByText(/earthbug could not analyze that photo right now/i),
  158 |     ).toBeVisible({ timeout: 10_000 });
  159 |   });
  160 | 
  161 |   // ── Network failures ──────────────────────────────────────────────────────
  162 |   test('network failure shows connection error message', async ({ page }) => {
  163 |     await mockGeminiNetworkFailure(page);
  164 | 
  165 |     await uploadFile(page, ensureTestJpeg());
  166 |     await expect(
  167 |       page.getByText(/could not reach gemini/i),
  168 |     ).toBeVisible({ timeout: 10_000 });
  169 |   });
  170 | 
  171 |   test('after network error, user is returned to camera view', async ({ page }) => {
  172 |     await mockGeminiNetworkFailure(page);
  173 | 
  174 |     await uploadFile(page, ensureTestJpeg());
> 175 |     await expect(page.getByText(/could not reach gemini/i)).toBeVisible({ timeout: 10_000 });
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  176 | 
  177 |     // Error banner in App.jsx — dismiss it
  178 |     await page.getByRole('button', { name: /dismiss/i }).click();
  179 |     await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
  180 |   });
  181 | 
  182 |   // ── Malformed AI response ─────────────────────────────────────────────────
  183 |   test('malformed JSON from Gemini shows parse error', async ({ page }) => {
  184 |     await page.route('https://generativelanguage.googleapis.com/**', (route) =>
  185 |       route.fulfill({
  186 |         status: 200,
  187 |         contentType: 'application/json',
  188 |         body: JSON.stringify({
  189 |           candidates: [
  190 |             {
  191 |               content: { parts: [{ text: '{ this is NOT valid JSON }' }], role: 'model' },
  192 |               finishReason: 'STOP',
  193 |             },
  194 |           ],
  195 |         }),
  196 |       }),
  197 |     );
  198 | 
  199 |     await uploadFile(page, ensureTestJpeg());
  200 |     await expect(
  201 |       page.getByText(/could not parse/i),
  202 |     ).toBeVisible({ timeout: 10_000 });
  203 |   });
  204 | 
  205 |   // BUG: Empty string response from Gemini causes JSON.parse('') to throw
  206 |   // SyntaxError, which IS caught and shows the parse error. But the root cause
  207 |   // (empty text) is not separately detected/reported.
  208 |   test('empty text response from Gemini shows parse error', async ({ page }) => {
  209 |     await page.route('https://generativelanguage.googleapis.com/**', (route) =>
  210 |       route.fulfill({
  211 |         status: 200,
  212 |         contentType: 'application/json',
  213 |         body: JSON.stringify({
  214 |           candidates: [
  215 |             {
  216 |               content: { parts: [{ text: '' }], role: 'model' },
  217 |               finishReason: 'STOP',
  218 |             },
  219 |           ],
  220 |         }),
  221 |       }),
  222 |     );
  223 | 
  224 |     await uploadFile(page, ensureTestJpeg());
  225 |     await expect(page.getByText(/could not parse/i)).toBeVisible({ timeout: 10_000 });
  226 |   });
  227 | 
  228 |   // Cancel button is now available on the analyzing screen
  229 |   test('KNOWN-BUG: hung Gemini request leaves user permanently on analyzing screen', async ({ page }) => {
  230 |     await mockGeminiTimeout(page);
  231 | 
  232 |     await uploadFile(page, ensureTestJpeg());
  233 |     await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5000 });
  234 | 
  235 |     // Cancel button is now present
  236 |     await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  237 | 
  238 |     // Clicking cancel returns user to camera view
  239 |     await page.getByRole('button', { name: /cancel/i }).click();
  240 |     await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
  241 |   });
  242 | 
  243 |   // ── Error banner UX ───────────────────────────────────────────────────────
  244 |   test('error banner can be dismissed', async ({ page }) => {
  245 |     await mockGeminiNetworkFailure(page);
  246 |     await uploadFile(page, ensureTestJpeg());
  247 |     await expect(page.getByText(/something went wrong/i)).toBeVisible({ timeout: 10_000 });
  248 | 
  249 |     await page.getByRole('button', { name: /dismiss/i }).click();
  250 |     await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  251 |   });
  252 | });
  253 | 
```