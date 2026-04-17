# Agent Instructions for EarthBug

This document provides guidance for AI agents working on the EarthBug codebase.

---

## Project Overview

EarthBug is a mobile-first web app that uses Google Gemini vision AI to identify insects from photos and explain their ecological role. Users upload or capture a photo; EarthBug returns a structured analysis — name, verdict (Garden Buddy / Garden Pest / Neutral), benefits, harms, and ecosystem context.

### Core Philosophy

| Principle | Application |
|-----------|-------------|
| Privacy-first | The Gemini API key is stored only in `localStorage`; no server-side key storage |
| Local image processing | Images are compressed in the browser via Canvas API before any API call |
| Fail loudly | API errors, safety blocks, and JSON parse failures surface a user-visible error — never silent failures |
| Stateless backend | The app has no backend; all state lives in React (in-memory) or `localStorage` |

---

## Architecture

```
earthbug/
├── src/
│   ├── App.jsx              # Root — state machine (API_KEY → CAMERA → ANALYZING → RESULTS)
│   ├── components/
│   │   ├── ApiKeyInput.jsx  # API key entry form + localStorage persistence
│   │   ├── CameraView.jsx   # Camera/upload/drag-drop UI
│   │   ├── AnalyzingView.jsx # Loading screen shown during Gemini request
│   │   ├── ResultsView.jsx  # Bug analysis display + share functionality
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── hooks/
│   │   └── useCamera.js     # Camera stream lifecycle (getUserMedia, stop, switch)
│   └── utils/
│       ├── gemini.js        # Gemini API call, prompt, response parsing
│       └── imageUtils.js    # Canvas-based image compression (skips GIF/SVG)
├── tests/
│   ├── fixtures/
│   │   └── mock-responses.js # Gemini HTTP envelope builders + image fixtures
│   ├── helpers/
│   │   └── mock-gemini.js   # Playwright route interceptors + loginWithApiKey
│   ├── analysis-flow.spec.js
│   ├── api-key.spec.js
│   ├── error-handling.spec.js
│   ├── file-upload.spec.js
│   ├── persistence.spec.js
│   ├── results-view.spec.js
│   ├── scan-history.spec.js
│   └── sharing.spec.js
├── playwright.config.js     # Chromium + Pixel 5 mobile
├── BUG_REPORT.md            # 11 documented bugs from initial audit
└── vite.config.js
```

---

## Key Design Decisions

### 1. View State Machine

`App.jsx` owns a single `view` string and drives the whole UI:

```
'API_KEY' → 'CAMERA' → 'ANALYZING' → 'RESULTS'
              ↑                              |
              └──────────────────────────────┘  (Scan Another Bug)
```

**Why:** Prevents impossible states (e.g., showing results while still analyzing). When adding features, check `view` transitions before touching unrelated state.

### 2. API Key in `localStorage` Only

```js
localStorage.setItem('earthbug_api_key', key);
```

**Why:** No server means no server-side secret storage. The key never leaves the browser. Do not add server-side key forwarding without a security review.

### 3. Image Compression Before API Call

`imageUtils.js` compresses all images to JPEG via Canvas before base64-encoding them for Gemini. GIF and SVG bypass compression (Canvas cannot decode them reliably).

**Why:** Gemini has a payload size limit. Raw camera frames or high-res uploads would exceed it.

### 4. Scan History Is In-Memory Only

`App.jsx` accumulates results in a `scanHistory` array capped at 10. It is **not** persisted to `localStorage`.

**Why:** Privacy — scan history includes images and bug analyses; persisting it requires explicit user consent.

---

## Adding New Features

### Adding a New View

1. Add the view name to the state machine in `App.jsx`
2. Create the component under `src/components/`
3. Add transition logic (what triggers entry/exit)
4. Add a Playwright test in `tests/`

### Adding a New Gemini Prompt Field

1. Update the prompt string in `src/utils/gemini.js`
2. Update the JSON schema documentation in the same file
3. Update `ResultsView.jsx` to render the new field
4. Update `MOCK_BUG_ANALYSIS` in `tests/fixtures/mock-responses.js`

### Adding a New Test

All tests use the shared helpers:

```js
import { mockGeminiSuccess, loginWithApiKey } from './helpers/mock-gemini.js';
import { SUCCESS_HTTP_BODY, MOCK_BUG_ANALYSIS } from './fixtures/mock-responses.js';

test.beforeEach(async ({ page }) => {
  await mockGeminiSuccess(page);  // intercepts all Gemini API calls
  await loginWithApiKey(page);    // seeds localStorage + reloads
});
```

---

## Critical Rules

### Never Add Server-Side Key Handling

The app is intentionally serverless. Do not introduce a backend that proxies Gemini calls or stores API keys. If this changes, a full security review is required first.

### Gemini SDK Version Matters

We use `@google/generative-ai` v0.21.0. This SDK sends the API key as the `x-goog-api-key` request header — **not** as a `?key=` query parameter. Tests that capture headers rely on this.

### GIF/SVG Bypass in `imageUtils.js`

Canvas cannot encode GIF or SVG pixel data. `imageUtils.js` skips compression for these types and sends the raw base64 to Gemini. This is documented in `BUG_REPORT.md` as a known limitation.

### React 18 Batching

React 18 automatically batches state updates. In tests, if a mock resolves synchronously (no delay), the `ANALYZING` view may never paint before `RESULTS`. Always add a mock delay (≥600 ms) when a test needs to observe the `ANALYZING` state.

### Model Name Constant

The Gemini model name is extracted to a `GEMINI_MODEL` constant in `src/utils/gemini.js`. Never hardcode the model string in multiple places.

---

## Playwright Test Conventions

- **File chooser tests**: use `page.waitForEvent('filechooser')` + `Promise.all` — never click first
- **Heading assertions**: `page.getByRole('heading', { name: '...' })` — avoids strict-mode violations from text appearing in multiple elements
- **API route interception**: always `await page.unroute(...)` before overriding in individual tests that need custom behavior
- **Mobile viewport**: tests run in Pixel 5 mobile viewport (defined in `playwright.config.js`)

---

## Security: Agents, Dependencies, and Supply Chain

Dependencies installed by agents or automation are a real attack surface. Follow these rules:

- **Minimize new dependencies** — add only what the task requires; no drive-by upgrades
- **Prefer a reviewable diff** — show manifest + lockfile changes before running `npm install`
- **Flag suspicious packages** — typosquat names, unexpected `postinstall` scripts, binary blobs
- **Never commit secrets** — the API key is user-supplied at runtime; it must never appear in source
- **`npm audit` before PRs** — run it and address any high/critical findings
- **Lockfile discipline** — `package-lock.json` is committed; do not use floating versions

### What the human should assume

- All image data and bug analyses happen in the browser — Gemini is the only external service
- The API key is only as safe as the user's browser `localStorage`
- There is no authentication layer; the app trusts whoever has the API key

---

## Development Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # Production build to dist/
npm run test         # Playwright E2E tests (requires dev server running)
npm run test:ui      # Playwright interactive UI
npm run test:headed  # Headed browser for debugging
npm run test:report  # Open last test report
```

---

## File Responsibilities

| File | Responsibility |
|------|----------------|
| `src/App.jsx` | View state machine, scan history accumulation |
| `src/components/ApiKeyInput.jsx` | Key entry form, localStorage read/write |
| `src/components/CameraView.jsx` | Camera, file upload, drag-drop |
| `src/components/AnalyzingView.jsx` | Loading UI during Gemini request |
| `src/components/ResultsView.jsx` | Bug analysis display, share |
| `src/hooks/useCamera.js` | Camera stream lifecycle |
| `src/utils/gemini.js` | Gemini prompt, API call, response parsing |
| `src/utils/imageUtils.js` | Canvas image compression |
| `tests/helpers/mock-gemini.js` | Playwright route interceptors |
| `tests/fixtures/mock-responses.js` | Mock Gemini HTTP envelopes |
| `BUG_REPORT.md` | Known bugs — check before filing new issues |

---

## Getting Help

- Known bugs: `BUG_REPORT.md`
- Coding standards: `CODING_STANDARDS.md`
- Security rules: `SECURITY_GUIDE.md`
- Copilot/Cursor context: `COPILOT_INSTRUCTIONS.md`
