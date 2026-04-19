#!/usr/bin/env bash
# EarthBug — Vercel production deployment script
# Usage: bash scripts/deploy.sh
#
# Pass your Gemini key as an env var to skip the prompt:
#   GEMINI_API_KEY=AIza... bash scripts/deploy.sh

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

# ── 1. Prerequisites ──────────────────────────────────────────────
step "Checking prerequisites"
command -v node >/dev/null 2>&1 || die "Node.js not found."
command -v npm  >/dev/null 2>&1 || die "npm not found."
ok "Node $(node -v)  /  npm $(npm -v)"

if ! command -v vercel >/dev/null 2>&1; then
  warn "Vercel CLI not found — installing..."
  npm i -g vercel@latest
fi
ok "Vercel CLI $(vercel --version)"

# ── 2. Auth check ─────────────────────────────────────────────────
step "Vercel auth check"
if ! vercel whoami >/dev/null 2>&1; then
  die "Not logged in to Vercel. Run: vercel login"
fi
ok "Logged in as $(vercel whoami)"

# ── 3. Install & build ────────────────────────────────────────────
step "Installing dependencies"
npm ci --silent
ok "Dependencies installed"

step "Production build"
npm run build
ok "Build succeeded → dist/"

# ── 4. Link or create the Vercel project (non-interactive) ────────
step "Linking Vercel project"

if [ ! -f ".vercel/project.json" ]; then
  warn "No .vercel/project.json — creating and linking project 'earthbug'..."
  # --yes accepts all defaults; --name sets the project name
  vercel link --yes --project earthbug 2>/dev/null || \
    vercel link --yes 2>/dev/null || true
fi

# If still not linked, do a silent first deploy which creates the project
if [ ! -f ".vercel/project.json" ]; then
  warn "Performing initial deploy to create project..."
  vercel --yes --name earthbug 2>&1 | tail -5
fi

ok "Project linked"

# ── 5. Set GEMINI_API_KEY ─────────────────────────────────────────
step "Setting GEMINI_API_KEY"

# Accept key from env var, .env file, or prompt — only once
if [ -z "$GEMINI_API_KEY" ] && [ -f ".env" ]; then
  GEMINI_API_KEY=$(grep -E '^GEMINI_API_KEY=' .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo ""
  read -rsp "  Paste your Gemini API key (input hidden): " GEMINI_API_KEY
  echo ""
fi

[ -z "$GEMINI_API_KEY" ] && die "GEMINI_API_KEY is required."

# Remove existing key then add fresh (avoids "already exists" error)
vercel env rm GEMINI_API_KEY production --yes 2>/dev/null || true
echo "$GEMINI_API_KEY" | vercel env add GEMINI_API_KEY production
ok "GEMINI_API_KEY set in Vercel production"

# ── 6. Deploy to production ───────────────────────────────────────
step "Deploying to production"
DEPLOY_URL=$(vercel --prod --yes 2>&1 | grep -E 'https://' | tail -1)
ok "Deployed!"

echo ""
echo -e "${BOLD}Live URLs:${RESET}"
echo "  App:   $DEPLOY_URL"
echo "  Demo:  ${DEPLOY_URL}?demo=true   ← paste this in your DEV post"
echo ""
echo "  Alias: https://earthbug.vercel.app"
echo "  Demo:  https://earthbug.vercel.app/?demo=true"
echo ""
echo -e "${BOLD}Competition checklist:${RESET}"
echo "  ✔ Demo mode live for judges"
echo "  ✔ GEMINI_API_KEY set server-side (never exposed to client)"
echo "  ✔ Google Gemini multi-turn chat"
echo "  ✔ iNaturalist citizen-science link"
echo "  ✔ Eco-actions for every result"
echo "  ✔ Mobile-first, no backend"
echo ""
echo -e "${YELLOW}Still needed:${RESET}"
echo "  □ Upload screen recording to YouTube (unlisted)"
echo "  □ Paste video URL into DEV post draft"
echo "  □ Submit before Apr 20, 06:59 UTC"
echo ""
