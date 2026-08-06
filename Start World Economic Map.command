#!/bin/bash
# One-click launcher for the World Economic Map (macOS).
# Starts the app locally and opens it in your browser.
# Stop: press Ctrl+C in this window or close the window.

cd "$(dirname "$0")/app" || { echo "app/ folder not found"; read -r; exit 1; }

# Node installed?
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ Node.js/npm is not installed. Please install it from https://nodejs.org"
  read -r -p "Press Enter to close…"
  exit 1
fi

# Install dependencies on first run.
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies (first run only)…"
  npm install || { echo "Installation failed"; read -r; exit 1; }
fi

if [ -d dist ]; then
  echo "🌍 Starting World Economic Map (production build) — the browser will open automatically."
  echo "   (Press Ctrl+C here to stop.)"
  echo
  npm run preview -- --open
else
  echo "🌍 Starting World Economic Map (dev server) — the browser will open automatically."
  echo "   (Press Ctrl+C here to stop.)"
  echo
  npm run dev -- --open
fi
