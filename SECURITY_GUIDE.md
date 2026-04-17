# Security Guide for EarthBug

This guide documents the security threat model, trust boundaries, and safe coding patterns for EarthBug.

**For AI agents:** Use the dispatch table in `CLAUDE.md` to decide if you need this guide. Read the Quick Reference below first — it covers the most common decisions.

---

## Quick Reference

| Situation | What to do |
|---|---|
| Rendering user-supplied content | `textContent` or React text nodes — never `innerHTML` |
| Reading the API key from `localStorage` | Read it; never log it; never expose it in error messages |
| Accepting a file from the user | Validate `file.type` is an image MIME type before processing |
| Processing an image | Pass through `imageUtils.compressImage()` before base64 encoding |
| Handling Gemini JSON response | Parse with `JSON.parse()`, then validate the structure before rendering |
| Adding a new `localStorage` key | Use the existing `LOCAL_STORAGE_KEY` constant; never store sensitive data as JSON without sanitization |
| Adding a new npm dependency | Check `npm audit`; justify the addition; avoid packages with `postinstall` scripts |
| Sending data to Gemini | Only image base64 + the hardcoded prompt — never user-typed text |

---

## 1. Security Mindset

```
TRUST BOUNDARIES IN EARTHBUG
─────────────────────────────
High Trust:   React state, compiled app code
Medium Trust: Gemini API response (external service, well-defined schema)
Low Trust:    User-uploaded file, user-typed API key, browser localStorage
Untrusted:    File contents (may be anything — validate MIME type)
```

### Threat Model

| Threat | Surface | Mitigation |
|--------|---------|------------|
| XSS via Gemini response | `ResultsView.jsx` rendering bug name/summary | React JSX escapes by default; never use `dangerouslySetInnerHTML` |
| API key exfiltration | `localStorage`, error messages, logs | Never log the key; never embed in URLs; no server-side key storage |
| Malicious file upload | `file.type`, image data | Validate MIME type before processing; compress via Canvas (strips metadata) |
| Prototype pollution | `JSON.parse` of Gemini response | Validate response structure before accessing properties |
| Supply chain | `npm install` | Lockfile committed; `npm audit` before PRs; no unreviewed new dependencies |

---

## 2. XSS Prevention

EarthBug renders Gemini API responses directly in the UI. This content comes from an external service and must be treated as untrusted.

### Rule: Never Use `dangerouslySetInnerHTML`

```jsx
// BAD — any malicious string in analysis.summary becomes executable HTML
<div dangerouslySetInnerHTML={{ __html: analysis.summary }} />

// GOOD — React escapes the string
<p>{analysis.summary}</p>
```

### Rule: No Markdown-to-HTML Rendering of API Responses

If you add a markdown renderer for Gemini output, ensure it sanitizes HTML. The Gemini prompt instructs the model to return plain JSON — keep it that way.

### Rule: `textContent` in Any DOM Manipulation

If you use `useEffect` + direct DOM access, never use `innerHTML`:

```js
// BAD
element.innerHTML = analysis.name;

// GOOD
element.textContent = analysis.name;
```

---

## 3. API Key Security

The Gemini API key is the most sensitive data EarthBug handles.

### What Is Safe

```js
// Read from localStorage (user set it themselves)
const key = localStorage.getItem('earthbug_api_key');

// Pass to the SDK (it goes in the x-goog-api-key header)
const genAI = new GoogleGenerativeAI(key);

// Check if it exists (for UI state)
const hasKey = Boolean(key);
```

### What Is Never Safe

```js
// BAD: Logged — appears in browser devtools, server logs, error tracking
console.log('Using API key:', key);
console.error('Failed with key:', key);

// BAD: In an error message shown to the user
setError(`Request failed for key ${key}`);

// BAD: In a URL (appears in browser history, server logs, referrer headers)
fetch(`https://api.example.com/proxy?key=${key}`);

// BAD: In source code
const API_KEY = 'AIzaSy...';  // NEVER — even in tests
```

### API Key in Tests

Tests use `'test-api-key-12345'` seeded via `loginWithApiKey()`. This is not a real key — it is only used to satisfy the app's "has a key" check. Playwright intercepts all Gemini API calls so no real request is made.

```js
// tests/helpers/mock-gemini.js
export async function loginWithApiKey(page, key = 'test-api-key-12345') {
  await page.goto('/');
  await page.evaluate((k) => window.localStorage.setItem('earthbug_api_key', k), key);
  await page.reload();
}
```

---

## 4. File Upload Validation

Users can upload arbitrary files. Validate before processing.

### Rule: Validate MIME Type Before Processing

```js
// imageUtils.js — validate at the entry point
export async function compressImage(file) {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please choose an image file.');
  }
  // ... proceed with compression
}
```

### Rule: Never Trust `file.name` Extensions

An attacker can name a `.js` file `photo.jpg`. The MIME type from the browser is more reliable (though still spoofable). The Canvas compression step provides an additional layer — non-image data will fail at `drawImage()`.

### Rule: Compress Before Sending

`imageUtils.compressImage()` re-encodes the image through the Canvas API, which:
- Strips EXIF metadata (which can contain GPS coordinates, device info)
- Rejects data that the Canvas cannot decode as a valid image
- Reduces payload size to stay within Gemini's limits

Always call `compressImage()` before building the Gemini request.

---

## 5. Gemini Response Handling

The Gemini API returns structured JSON, but we must validate it before rendering.

### Rule: Validate Response Structure

```js
// gemini.js — validate before accessing properties
function parseGeminiResponse(responseText) {
  let parsed;
  try {
    // Strip markdown fences if present
    const cleaned = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('The AI returned an unreadable response. Please try again.');
  }

  // Validate required fields before accessing
  if (parsed.error === true) {
    throw new GeminiNoBugError(parsed.message || 'No bug identified.');
  }

  if (!parsed.name || !parsed.verdict) {
    throw new Error('The AI response was missing required fields.');
  }

  return parsed;
}
```

### Rule: Never Access Nested Properties Without Guards

```js
// BAD — throws if Gemini changes response shape
const name = response.candidates[0].content.parts[0].text;

// GOOD — optional chaining with fallback
const text = response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
```

### Rule: Prototype Pollution Prevention

When parsing Gemini responses:

```js
// BAD — `__proto__` injection from a compromised response would pollute Object.prototype
const parsed = JSON.parse(text);

// GOOD — check for prototype keys if the response schema is sensitive
const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];
function isSafeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return true;
  return !Object.keys(obj).some(k => FORBIDDEN_KEYS.includes(k));
}
```

---

## 6. Content Security Policy

EarthBug is served as a static SPA. The Vite dev server does not set CSP headers by default. For production deployment:

### Recommended CSP Headers

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src https://generativelanguage.googleapis.com;
  font-src 'self';
  frame-ancestors 'none';
```

**Why `connect-src` is restricted:** The only external connection EarthBug should make is to the Gemini API. This prevents exfiltration of user data or API keys to third-party domains.

**Why `img-src data: blob:`:** Camera captures and uploaded images are handled as `data:` URLs and `blob:` URLs in-browser.

### No `eval`, No Dynamic Script Loading

```js
// BAD — opens eval-based XSS
new Function(userInput)();
eval(userInput);

// BAD — loads external scripts at runtime
const script = document.createElement('script');
script.src = someUrl;
document.head.appendChild(script);
```

---

## 7. localStorage Security

### What Is Stored

| Key | Value | Sensitivity |
|-----|-------|-------------|
| `earthbug_api_key` | Gemini API key string | High — treat like a password |

### Rules

- **Never store image data in `localStorage`** — blobs and base64 images belong in memory only
- **Never store scan results in `localStorage`** without explicit user consent (privacy)
- **The API key is user-provided** — they chose to store it; the app must protect it from inadvertent exposure
- **`localStorage` is origin-scoped** — cross-origin access is not possible, but XSS on the same origin can read it

### Clearing on Logout

When the user removes their API key:

```js
localStorage.removeItem('earthbug_api_key');
// Also clear in-memory state
setApiKey('');
setView('API_KEY');
```

---

## 8. Dependency Security

### Before Adding a New Package

1. Check if the feature can be done without a new dependency
2. Search npm for the package — verify author, download count, GitHub stars
3. Read the package's `postinstall` script in `package.json` — reject if it runs arbitrary code
4. Run `npm install <package> --dry-run` first to see the dependency tree
5. Run `npm audit` after installing — fix any high/critical findings

### Keeping Dependencies Updated

```bash
npm audit              # Check for known vulnerabilities
npm audit fix          # Auto-fix where safe
npm outdated           # See what has updates
```

The lockfile (`package-lock.json`) is committed. Do not delete it or add packages with `--legacy-peer-deps` without understanding why.

### Current Dependency Surface

| Package | Purpose | Risk |
|---------|---------|------|
| `@google/generative-ai` | Gemini SDK | Medium — sends data to Google |
| `react`, `react-dom` | UI framework | Low — well-maintained |
| `vite`, `@vitejs/plugin-react` | Build tool | Low — dev only |
| `tailwindcss` | Styling | Low — build-time only |
| `@playwright/test` | Testing | Low — dev only |

---

## 9. Security Checklist for Code Review

Run this checklist on any PR that touches rendering, API calls, file handling, or localStorage.

### Rendering

- [ ] Is any Gemini response content rendered via JSX (not `innerHTML`)?
- [ ] Is `dangerouslySetInnerHTML` absent from new components?
- [ ] Are user-visible error messages free of internal state or API keys?

### API Key

- [ ] Is the API key never logged (`console.log`, `console.error`)?
- [ ] Is the API key never included in error messages shown to users?
- [ ] Is the API key never added to a URL as a query parameter?

### File Handling

- [ ] Is `file.type` validated against an allowlist before processing?
- [ ] Does the upload path call `compressImage()` before Gemini encoding?

### Gemini Response

- [ ] Is the JSON response validated for required fields before rendering?
- [ ] Are optional properties accessed with `?.` optional chaining?
- [ ] Is the safety block (`finishReason: 'SAFETY'`) handled gracefully?

### Dependencies

- [ ] Were new packages checked for `postinstall` scripts?
- [ ] Was `npm audit` run and are there no new high/critical findings?
- [ ] Is `package-lock.json` committed with the change?

### localStorage

- [ ] Are no images or large blobs written to `localStorage`?
- [ ] Is scan history still in-memory only (not persisted without consent)?

---

## Note for AI Agents

The most common EarthBug security mistakes to avoid:

- Using `dangerouslySetInnerHTML` to render Gemini text responses → XSS
- Logging the API key in error handlers → key exposure in DevTools/logs
- Skipping `compressImage()` and sending raw file data → metadata leakage + payload size
- Accessing `response.candidates[0].content.parts[0].text` without optional chaining → crash on safety-blocked responses
- Adding a dependency without checking `npm audit` → supply chain vulnerability

**One validation step at each trust boundary prevents the most common vulnerabilities.**
