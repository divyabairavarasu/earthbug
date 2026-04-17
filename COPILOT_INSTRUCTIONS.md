# Copilot Instructions for EarthBug

This file provides specific instructions for GitHub Copilot and Cursor when working on EarthBug.

---

## Project Context

EarthBug is a **mobile-first, serverless React SPA** that uses Google Gemini vision AI to identify insects from photos. There is no backend — all processing happens in the browser. The Gemini API key is stored in `localStorage`.

**Core data flow:**
```
User uploads/captures photo
  → imageUtils.js compresses to JPEG (Canvas API)
  → gemini.js encodes to base64 + sends to Gemini generateContent
  → Response parsed as JSON bug analysis
  → ResultsView.jsx renders result
```

**State machine:** `API_KEY → CAMERA → ANALYZING → RESULTS`

---

## When Editing Gemini Integration

The SDK is `@google/generative-ai` v0.21.0. This version:
- Sends the API key as `x-goog-api-key` **header** (not `?key=` query param)
- Uses the `generateContent` endpoint

The model name is in the `GEMINI_MODEL` constant in `src/utils/gemini.js`. Change it there only — never hardcode it elsewhere.

**Before touching `gemini.js`:**
1. Check `BUG_REPORT.md` — several known issues relate to the API response parsing
2. Run `npm test` — 8 test files cover the analysis flow extensively

---

## When Editing Image Handling

`imageUtils.js` compresses images via `canvas.toBlob()` before sending to Gemini. Key constraint: **GIF and SVG bypass compression** because Canvas cannot decode their pixel data. This is intentional — do not "fix" it without considering Gemini's MIME type support.

---

## When Adding UI Components

- Use Tailwind CSS — the design system uses `leaf-*` color tokens (defined in `tailwind.config.js`)
- Test drag-and-drop with `page.locator('[class*="border-dashed"]')` in Playwright
- The drop zone highlights with `border-leaf-400` on `dragover`

---

## Testing Conventions

Always run `npm run dev` in a separate terminal before running `npm test`.

```js
// Standard test setup — use these helpers, not manual page.goto + localStorage
import { mockGeminiSuccess, loginWithApiKey } from './helpers/mock-gemini.js';

test.beforeEach(async ({ page }) => {
  await mockGeminiSuccess(page);
  await loginWithApiKey(page);  // seeds localStorage + reloads to home
});
```

**Common gotchas:**
- Use `getByRole('heading', { name: 'Ladybug' })` not `getByText('Ladybug')` — text appears in multiple elements
- Add ≥600 ms mock delay to observe the `ANALYZING` intermediate state (React 18 batches state updates)
- Use PNG fixtures for upload tests — the minimal JPEG bytes in test fixtures are not Canvas-decodable

---

## Error-Specific Guidance

### Gemini 404 / Model Not Found

**DON'T say:** "Switch to gemini-pro"

**DO:** Update `GEMINI_MODEL` constant in `src/utils/gemini.js` and check the Gemini model availability docs

### JSON Parse Failure on Gemini Response

**DON'T say:** "The API returned invalid JSON"

**DO ask:** "Is the response wrapped in markdown fences? `gemini.js` should strip them — check the regex in `parseGeminiResponse`."

### Camera Not Starting

**DON'T say:** "Add `autoplay` to the video element"

**DO ask:** "`useCamera.js` manages the stream lifecycle. Is `startCamera()` being called? What does the browser console show for `getUserMedia`?"

### `localStorage` Key Not Persisting

**DON'T say:** "Use `sessionStorage` instead"

**DO ask:** "Is the key name `earthbug_api_key`? The app reads this exact key on load."

---

## Socratic Debugging Approach

When a test fails, before suggesting a fix:

1. "What does `page.pause()` show at the failing assertion?"
2. "Is the mock route intercepting? Add `console.log` inside the route handler."
3. "Is `loginWithApiKey` being called before the failing action?"
4. "Does the element exist but have the wrong locator, or does it not exist at all?"

---

## Token Efficiency Tips

- Playwright tests mock all Gemini API calls — no real API key needed for testing
- The fixture `SUCCESS_HTTP_BODY` in `tests/fixtures/mock-responses.js` is the single source of truth for mock responses; update it there, not inline in individual tests
- Use `buildGeminiHttpResponse(text)` from the fixtures file to construct custom mock responses

---

## Relevant Files

| File | What Copilot Should Know |
|------|--------------------------|
| `src/utils/gemini.js` | Prompt, model constant, response parsing, error classification |
| `src/utils/imageUtils.js` | Canvas compression, GIF/SVG bypass |
| `src/App.jsx` | State machine, scan history (capped at 10, not persisted) |
| `src/hooks/useCamera.js` | getUserMedia, stop, facingMode switch |
| `tests/fixtures/mock-responses.js` | `MOCK_BUG_ANALYSIS`, `SUCCESS_HTTP_BODY`, `buildGeminiHttpResponse` |
| `tests/helpers/mock-gemini.js` | `mockGeminiSuccess`, `mockGeminiError`, `loginWithApiKey` |
| `BUG_REPORT.md` | 11 known bugs — read before filing new issues |

---

## Key Principles

1. **No server** — everything runs in the browser; do not introduce a backend without discussion
2. **API key is user-supplied** — never embed or log it; treat it like a password
3. **State machine first** — new views must fit the `view` transitions in `App.jsx`
4. **Test with Playwright** — all new features need E2E coverage using the existing helpers
5. **Compression before upload** — always pass images through `imageUtils.js` before Gemini

---

## Security: Dependencies and Agent-Assisted Coding

- **No new dependencies without justification** — this is a simple SPA; avoid dependency sprawl
- **Show the diff** — manifest and lockfile changes should be visible before `npm install` runs
- **`npm audit`** — run before every PR; fix high/critical findings
- **Never commit the API key** — it is user-supplied at runtime; check `.gitignore` includes `.env`
- For full agent security guidance, see `AGENTS.md` and `SECURITY_GUIDE.md`
