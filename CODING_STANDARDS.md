# Coding Standards for EarthBug

This document defines the coding standards, architectural principles, and best practices for the EarthBug codebase.

**For AI agents:** Use the dispatch table in `CLAUDE.md` to decide if you need this guide. Read the Quick Reference below first — it covers the most common decisions.

---

## Quick Reference

| Decision | Rule |
|---|---|
| Component files | `.jsx` with named export; one component per file |
| Utility files | `.js` ES modules with named exports |
| Hooks | `use` prefix; live in `src/hooks/` |
| Naming — components | `PascalCase` |
| Naming — functions/variables | `camelCase`; booleans prefix `is`/`has`/`can` |
| Naming — constants | `UPPER_SNAKE_CASE` |
| State | Lift to `App.jsx` if shared; keep local if component-only |
| Async | `async/await` over `.then()`; always handle rejection |
| Error handling | Surface to the user — never swallow errors silently |
| Styling | Tailwind utility classes; use `leaf-*` color tokens |
| Tests | Playwright E2E in `tests/`; use shared helpers |
| Magic strings | Extract to a named constant (e.g., `GEMINI_MODEL`, `LOCAL_STORAGE_KEY`) |
| Comments | Only where the WHY is non-obvious |
| Security | User input and image data → check `SECURITY_GUIDE.md` |

---

## Core Principles

### 1. DRY (Don't Repeat Yourself)

Extract shared logic. The Gemini mock setup is a good example — every test uses `mockGeminiSuccess` and `loginWithApiKey` from `tests/helpers/mock-gemini.js` rather than duplicating the route setup inline.

```js
// BAD: duplicated setup in every test file
await page.route('https://generativelanguage.googleapis.com/**', (route) => {
  route.fulfill({ status: 200, body: JSON.stringify(body) });
});
await page.goto('/');
await page.evaluate(() => localStorage.setItem('earthbug_api_key', 'test-api-key'));

// GOOD: shared helper
await mockGeminiSuccess(page);
await loginWithApiKey(page);
```

### 2. KISS (Keep It Simple, Stupid)

EarthBug is intentionally a single-page app with no backend. Resist the urge to introduce abstractions that the app doesn't need. A `useGemini` hook is fine; a full state management library is not.

### 3. YAGNI (You Aren't Gonna Need It)

Do not add features "just in case." The scan history cap of 10 is intentional. Persistence of history is deliberately not implemented (privacy). Build what is asked for, then stop.

### 4. Separation of Concerns

```
src/
├── components/    → Rendering only — no API calls, no localStorage access
├── hooks/         → Browser API lifecycle (camera stream)
└── utils/         → Pure logic — Gemini calls, image compression
```

- **Components** must not call `fetch` or access `localStorage` directly
- **Utils** must not import React or render anything
- **Hooks** are for browser APIs with lifecycle concerns (`getUserMedia`, event listeners)

---

## SOLID Principles (applied to React/JS)

### Single Responsibility

Each module has one job:
- `gemini.js` → Gemini API communication and response parsing only
- `imageUtils.js` → Image compression only
- `useCamera.js` → Camera stream lifecycle only

### Open/Closed

New Gemini response fields should be added to the prompt in `gemini.js` and rendered in `ResultsView.jsx` — without changing the parsing logic. The parser reads from a known JSON schema; extend the schema, not the parser.

### Dependency Inversion

Components depend on props and hooks, not on direct `localStorage` or `fetch` calls. `ApiKeyInput.jsx` receives callbacks; it does not call `localStorage` from inside event handlers directly without going through `App.jsx`.

---

## Code Organization

### Project Structure

```
earthbug/
├── src/
│   ├── App.jsx              # Root state machine — the only place view transitions happen
│   ├── components/          # One file per component, named exports
│   ├── hooks/               # React hooks for browser API lifecycle
│   └── utils/               # Pure utility modules
├── tests/
│   ├── fixtures/            # Shared mock data
│   ├── helpers/             # Shared Playwright helpers
│   └── *.spec.js            # One spec file per feature area
├── public/                  # Static assets
└── index.html
```

### Component File Template

```jsx
// Named export, not default — allows tree shaking and explicit imports
export function ResultsView({ analysis, onScanAnother, onShare }) {
  // Hooks at the top
  // Derived state next
  // Event handlers
  // Return JSX
}
```

### Constants

Extract magic strings and numbers to named constants in the same file or a shared constants module:

```js
// gemini.js
const GEMINI_MODEL = 'gemini-1.5-flash';           // GOOD
const LOCAL_STORAGE_KEY = 'earthbug_api_key';

// NOT
const model = generativeAI.getGenerativeModel({ model: 'gemini-1.5-flash' });  // BAD — hardcoded
```

---

## Naming Conventions

### Components
```jsx
// PascalCase, describes what it renders
export function AnalyzingView() {}
export function ResultsView() {}
export function CameraView() {}
```

### Hooks
```js
// camelCase with 'use' prefix, describes what it manages
export function useCamera() {}
```

### Utilities
```js
// camelCase, verb-first, describes what it does
export async function analyzeImage(apiKey, imageData) {}
export async function compressImage(file) {}
```

### Variables
```js
// camelCase; booleans prefix is/has/can/should
const isLoading = view === 'ANALYZING';
const hasApiKey = Boolean(localStorage.getItem(LOCAL_STORAGE_KEY));
const canShare = Boolean(navigator.share || navigator.clipboard);
```

### Constants
```js
// UPPER_SNAKE_CASE for module-level constants
const GEMINI_MODEL = 'gemini-1.5-flash';
const MAX_SCAN_HISTORY = 10;
const LOCAL_STORAGE_KEY = 'earthbug_api_key';
```

---

## Error Handling

### Principles

1. **Surface errors to the user** — show a message, not a blank screen
2. **Classify before displaying** — distinguish network errors, safety blocks, parse failures, "no bug found"
3. **Never swallow errors silently** — an empty `catch` block is always wrong
4. **Clean up resources** — camera streams must be stopped even when analysis fails

### Pattern

```js
// gemini.js — classify and re-throw with context
async function analyzeImage(apiKey, imageData) {
  try {
    const response = await model.generateContent(parts);
    return parseResponse(response);
  } catch (err) {
    if (err.status === 429) throw new Error('Rate limit exceeded. Try again in a moment.');
    if (err.status === 401) throw new Error('Invalid API key. Please check your Gemini key.');
    throw new Error(`Analysis failed: ${err.message}`);
  }
}
```

```jsx
// App.jsx — catch and show error in results view
try {
  const result = await analyzeImage(apiKey, imageData);
  setAnalysis(result);
  setView('RESULTS');
} catch (err) {
  setError(err.message);
  setView('RESULTS');  // ResultsView handles both success and error states
}
```

### Never Do This

```js
// BAD: Silent failure
try {
  const result = await analyzeImage(apiKey, data);
} catch {
  // nothing — user sees a frozen screen
}

// BAD: Exposing internal errors
setError(err.stack);  // Don't show stack traces to users

// BAD: Generic message for a classifiable error
setError('Something went wrong');
```

---

## Testing Requirements

### Test Organization

```
tests/
├── api-key.spec.js          # API key entry, validation, persistence
├── analysis-flow.spec.js    # Full upload → Gemini → results pipeline
├── file-upload.spec.js      # Upload variants (PNG, GIF, drag-drop, invalid)
├── error-handling.spec.js   # Network errors, 404, malformed JSON, safety block
├── results-view.spec.js     # All fields rendered correctly
├── scan-history.spec.js     # History accumulation, 10-entry cap
├── sharing.spec.js          # Web Share API + clipboard fallback
├── persistence.spec.js      # localStorage read/write on reload
├── fixtures/
│   └── mock-responses.js    # Single source of truth for mock data
└── helpers/
    └── mock-gemini.js       # Route interceptors, loginWithApiKey
```

### Test Patterns

```js
// Use shared beforeEach — never duplicate mock setup
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await mockGeminiSuccess(page);
    await loginWithApiKey(page);
  });

  test('describes the expected behavior', async ({ page }) => {
    // Arrange — set up any additional state
    // Act — perform the user action
    // Assert — verify the outcome
  });
});
```

### Locator Rules

| Situation | Use |
|-----------|-----|
| Headings | `getByRole('heading', { name: '...' })` |
| Buttons | `getByRole('button', { name: /text/i })` |
| Inputs | `getByRole('textbox', { name: /label/i })` |
| Drop zone | `locator('[class*="border-dashed"]')` |
| Multiple-element text | `.first()` or more specific role |

### Coverage Expectations

| Area | Expectation |
|------|-------------|
| Happy path (upload → results) | Covered in `analysis-flow.spec.js` |
| Every error type | Covered in `error-handling.spec.js` |
| New components | Add test to relevant spec file |
| New utility functions | Test the output, not the implementation |

---

## Styling

- Use **Tailwind CSS utility classes** only — no inline styles, no CSS modules
- Color tokens: `leaf-*` (greens), `earth-*` (browns), `sky-*` (blues) — defined in `tailwind.config.js`
- Responsive: use `sm:`, `md:`, `lg:` prefixes; the base design targets mobile-first
- Interactive states: use `hover:`, `focus:`, `disabled:` variants

```jsx
// GOOD
<button className="bg-leaf-500 hover:bg-leaf-600 text-white rounded-full px-6 py-3">
  Upload Photo
</button>

// BAD
<button style={{ backgroundColor: '#4ade80' }}>Upload Photo</button>
```

---

## Git Workflow

### Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/description` | `feat/camera-zoom` |
| Bugfix | `fix/description` | `fix/gif-compression` |
| Docs | `docs/description` | `docs/project-guides` |
| Refactor | `refactor/description` | `refactor/gemini-client` |
| Test | `test/description` | `test/error-handling-coverage` |

### Commit Messages

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scope: gemini, camera, upload, results, history, share, tests

Examples:
feat(gemini): add retry logic for 503 responses
fix(upload): clear file input after error to allow re-selection
test(sharing): add AbortError clipboard fallback test
refactor(gemini): extract model name to GEMINI_MODEL constant
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Run `npm test` — all tests must pass
4. Run `npm run build` — no build errors
5. Check `npm audit` — no new high/critical vulnerabilities
6. Open PR with description, related issues, and test plan
7. Address review feedback
8. Squash and merge

---

## Code Review Checklist

### Functionality
- [ ] Does the code handle the happy path?
- [ ] Are error states handled and shown to the user?
- [ ] Are edge cases covered (empty input, network failure, safety block)?

### Design
- [ ] Does each module have a single responsibility?
- [ ] Are magic strings/numbers extracted to constants?
- [ ] Are new components free of direct `localStorage`/`fetch` calls?

### Security
- [ ] Is the API key never logged or exposed?
- [ ] Is user-provided content treated as untrusted?
- [ ] Are file type and size validated before processing?

### Testing
- [ ] Is there a Playwright test for the new behavior?
- [ ] Does the test use the shared helpers (`mockGeminiSuccess`, `loginWithApiKey`)?
- [ ] Are both the happy path and error path covered?

### Accessibility
- [ ] Do interactive elements have accessible labels?
- [ ] Is `role="status"` used sparingly (one per functional toast/alert)?
- [ ] Are images given meaningful `alt` text?

### Code Quality
- [ ] Are names clear and self-documenting?
- [ ] Are comments reserved for non-obvious WHY (not WHAT)?
- [ ] Is formatting consistent with the rest of the file?
