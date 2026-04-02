#!/bin/bash
# Screenshot Capture Script
# Usage: ./scripts/capture-screenshots.sh

set -e

SCREENSHOTS_DIR="docs/assets/screenshots"
BASE_URL="http://localhost:3000"

echo "📸 WhatsApp AI Platform - Screenshot Capture"
echo "============================================"

if [ ! -d "$SCREENSHOTS_DIR" ]; then
    mkdir -p "$SCREENSHOTS_DIR"
fi

echo "Checking if dev server is running..."
if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
    echo "❌ Dev server not running. Please run 'pnpm dev' first."
    exit 1
fi

echo "✅ Dev server is running at $BASE_URL"
echo ""
echo "Opening browser to capture screenshots..."
echo ""

# Check if playwright is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js."
    exit 1
fi

# Use playwright to capture screenshots
npx playwright screenshot \
    --viewport-size="1920,1080" \
    "$BASE_URL/" \
    "$SCREENSHOTS_DIR/landing-hero.png" \
    --full-page

npx playwright screenshot \
    --viewport-size="1920,1080" \
    "$BASE_URL/#features" \
    "$SCREENSHOTS_DIR/landing-features.png" \
    --full-page

npx playwright screenshot \
    --viewport-size="1920,1080" \
    "$BASE_URL/#pricing" \
    "$SCREENSHOTS_DIR/landing-pricing.png" \
    --full-page

npx playwright screenshot \
    --viewport-size="1440,900" \
    "$BASE_URL/dashboard" \
    "$SCREENSHOTS_DIR/user-dashboard.png" \
    --full-page

npx playwright screenshot \
    --viewport-size="1440,900" \
    "$BASE_URL/admin" \
    "$SCREENSHOTS_DIR/admin-overview.png" \
    --full-page

npx playwright screenshot \
    --viewport-size="1200,1600" \
    "$BASE_URL/privacy" \
    "$SCREENSHOTS_DIR/privacy-policy.png" \
    --full-page

npx playwright screenshot \
    --viewport-size="1200,1600" \
    "$BASE_URL/terms" \
    "$SCREENSHOTS_DIR/terms-of-service.png" \
    --full-page

npx playwright screenshot \
    --viewport-size="1920,1080" \
    "$BASE_URL/about" \
    "$SCREENSHOTS_DIR/about-page.png" \
    --full-page

echo ""
echo "✅ Screenshots captured successfully!"
echo "📁 Saved to: $SCREENSHOTS_DIR/"
ls -la "$SCREENSHOTS_DIR/"
