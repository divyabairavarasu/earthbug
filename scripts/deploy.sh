#!/usr/bin/env bash
# EarthBug — Vercel production deployment script
# Usage: bash scripts/deploy.sh

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

step() { echo -e "\n${BOLD}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}✔ $1${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $1${RESET}"; }
die()  { echo -e "${RED}✖ $1${RESET}"; exit 1; }

echo -e "${BOLD}╔══════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   EarthBug  →  Vercel Production     ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════╝${RESET}"

# ── 1. Prerequisites ─────────────────────────────────────────────────────────
step "Checking prerequisites"

command -v node  >/dev/null 2>&1 || die "Node.js not found. Install from https://nodejs.org"
command -v npm   >/dev/null 2>&1 || die "npm not found."
ok "Node $(node -v)  /  npm $(npm -v)"

if ! command -v vercel >/dev/null 2>&1; then
  warn "Vercel CLI not found. Installing globally..."
  npm i -g vercel@latest
fi
ok "Vercel CLI $(vercel --version)"

# ── 2. Install dependencies ───────────────────────────────────────────────────
step "Installing dependencies"
npm ci --silent
ok "Dependencies installed"

# ── 3. Security audit ────────────────────────────────────────────────────────
step "Security audit"
npm audit --audit-level=high || warn "High-severity vulnerabilities found — review before shipping"

# ── 4. Production build ───────────────────────────────────────────────────────
step "Production build"
npm run build
ok "Build succeeded → dist/"

# ── 5. Environment variable check ────────────────────────────────────────────
step "Environment variable setup"

if vercel env ls production 2>/dev/null | grep -q "VITE_GEMINI_API_KEY"; then
  ok "VITE_GEMINI_API_KEY already set in Vercel (production)"
else
  warn "VITE_GEMINI_API_KEY not found in Vercel production env."
  echo ""
  echo "  Set it now with:"
  echo "    vercel env add VITE_GEMINI_API_KEY production"
  echo ""
  echo "  Then paste your key from .env when prompted."
  echo ""
  read -rp "  Press Enter once you've set it (or skip if already done)..."
fi

# ── 6. Deploy ─────────────────────────────────────────────────────────────────
step "Deploying to Vercel (production)"
vercel --prod

echo ""
ok "Deployed! Your live URLs:"
echo ""
echo "  Main:  https://earthbug.vercel.app"
echo "  Demo:  https://earthbug.vercel.app/?demo=true   ← link this in your DEV post"
echo ""
echo -e "${BOLD}Competition checklist${RESET}"
echo "  ✔ Demo mode URL ready for judges"
echo "  ✔ Google Gemini multi-turn chat"
echo "  ✔ iNaturalist citizen-science link"
echo "  ✔ Eco-actions for every result"
echo "  ✔ Mobile-first, no backend"
echo ""
echo -e "${YELLOW}Still needed:${RESET}"
echo "  □ Record 60-90 s screen demo → upload to YouTube (unlisted)"
echo "  □ Write DEV post (see COMPETITION_IMPROVEMENTS.md for structure)"
echo "  □ Submit before Apr 20, 06:59 UTC"
echo ""
