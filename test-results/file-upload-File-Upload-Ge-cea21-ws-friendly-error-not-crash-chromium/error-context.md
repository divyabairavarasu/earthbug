# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: file-upload.spec.js >> File Upload >> Gemini "no bug found" response shows friendly error, not crash
- Location: tests/file-upload.spec.js:214:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/couldn't find a bug/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/couldn't find a bug/i)

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
      - generic [ref=e13]: 🤔
      - paragraph [ref=e14]: I couldn't spot a bug in that photo. Try getting closer or make sure the bug is visible!
      - button "Try Again" [ref=e15] [cursor=pointer]
  - contentinfo [ref=e16]:
    - paragraph [ref=e17]:
      - text: Built with 🌍 for
      - 'link "DEV Weekend Challenge: Earth Day Edition" [ref=e18] [cursor=pointer]':
        - /url: https://dev.to/challenges/weekend-2026-04-16
    - paragraph [ref=e19]: Powered by Google Gemini · Every bug matters · 🐛 EarthBug
    - paragraph [ref=e20]: Helping gardeners protect pollinators, one scan at a time
```

# Test source

```ts
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
  189 |     expect(requests[0]).toBe('image/jpeg');
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
> 229 |     await expect(page.getByText(/couldn't find a bug/i)).toBeVisible({ timeout: 10_000 });
      |                                                          ^ Error: expect(locator).toBeVisible() failed
  230 |     await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  231 |   });
  232 | });
  233 | 
```