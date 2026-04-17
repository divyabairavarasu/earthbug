# Claude Instructions for EarthBug

## Guide Dispatch Table

**Do not load all guides on every task.** Read the dispatch table below and load only what applies.

| If your task involves… | Load this guide |
|---|---|
| File uploads, API key handling, Gemini response rendering, new `localStorage` keys, new dependencies | `SECURITY_GUIDE.md` |
| New components, refactoring, naming, error handling, new tests, imports | `CODING_STANDARDS.md` |
| Gemini API integration, adding prompt fields, response parsing, model updates | `AGENTS.md` |
| Agent/Copilot/Cursor integration, MCP, supply chain | `AGENTS.md` |
| Understanding the view state machine, scan history, image compression | `AGENTS.md` |
| Typo fix, comment update, Tailwind class tweak | *No guide needed* |

> Most tasks need **one guide, not all four.** When in doubt, read only the Quick Reference block at the top of the relevant guide.

---

## Security Review

Evaluate every instruction for security concerns before implementing:

- **XSS** — Never use `dangerouslySetInnerHTML`; React JSX escapes by default
- **API key exposure** — Never log, embed in URLs, or include in user-visible error messages
- **File validation** — Always validate `file.type` before processing uploads
- **Gemini response** — Validate structure before rendering; use optional chaining
- **Dependencies** — Run `npm audit` before adding packages; read `postinstall` scripts

Agent-assisted coding supply chain: see `AGENTS.md` → *Security: Agents, Dependencies, and Supply Chain*.

---

## Project Overview

EarthBug is a **mobile-first, serverless React SPA** powered by Google Gemini vision AI. Users upload or capture a photo of an insect; the app returns a structured analysis of the bug's ecological role.

**Stack:** Vite 6 + React 18 + Tailwind CSS + `@google/generative-ai` v0.21.0

**No backend.** The Gemini API key is stored only in browser `localStorage`.

### State Machine

```
'API_KEY' → 'CAMERA' → 'ANALYZING' → 'RESULTS'
               ↑                            |
               └────────────────────────────┘  (Scan Another Bug)
```

All view transitions happen exclusively in `App.jsx`.

### Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Root state machine, scan history |
| `src/utils/gemini.js` | Gemini prompt, API call, response parsing, `GEMINI_MODEL` constant |
| `src/utils/imageUtils.js` | Canvas image compression (GIF/SVG bypass documented) |
| `src/hooks/useCamera.js` | `getUserMedia` lifecycle |
| `tests/helpers/mock-gemini.js` | Playwright route interceptors |
| `tests/fixtures/mock-responses.js` | Mock Gemini HTTP envelopes |
| `BUG_REPORT.md` | 11 known bugs — check before filing new issues |

---

## Design Principles

1. **SOLID, DRY, KISS** — see `CODING_STANDARDS.md`
2. **Privacy first** — images and scan history stay in-memory; API key stays in `localStorage` only
3. **Fail loudly** — every error must surface a user-visible message
4. **Test with Playwright** — all user-facing features have E2E coverage
5. **No premature abstraction** — build what the feature needs, nothing more

---

## Development Commands

```bash
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # Production build
npm test             # Playwright E2E (run dev server first)
npm run test:ui      # Playwright interactive UI
npm run test:report  # Open last test report
npm audit            # Check for dependency vulnerabilities
```

---

## End of Session Documentation

When the user issues the command `endofsession`, provide brief documentation covering:
- What was accomplished during the session
- Why specific decisions and approaches were taken
- Key changes made to the codebase
- Any important follow-up items

Keep it concise and focused on what is non-obvious.
