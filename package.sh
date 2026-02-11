#!/bin/bash
# Package SnapType for Chrome Web Store submission
# Creates a ZIP file ready to upload

set -e

DIST_DIR="dist"
ZIP_NAME="snaptype-extension.zip"

# Clean previous build
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy extension files
cp manifest.json "$DIST_DIR/"
cp background.js "$DIST_DIR/"
cp content.js "$DIST_DIR/"
cp license.js "$DIST_DIR/"
cp -r popup "$DIST_DIR/"
cp -r options "$DIST_DIR/"
cp -r icons "$DIST_DIR/"

# Remove any dev files from dist
find "$DIST_DIR" -name '.DS_Store' -delete
find "$DIST_DIR" -name '*.map' -delete

# Create ZIP
cd "$DIST_DIR"
zip -r "../$ZIP_NAME" . -x '.*'
cd ..

echo ""
echo "✅ Extension packaged: $ZIP_NAME"
echo ""
echo "📋 Upload checklist:"
echo "  1. Go to https://chrome.google.com/webstore/devconsole"
echo "  2. Pay \$5 one-time developer fee (if not already)"
echo "  3. Click 'New Item' and upload $ZIP_NAME"
echo "  4. Fill in listing details from store-listing.md"
echo "  5. Upload screenshots (1280x800 or 640x400)"
echo "  6. Submit for review"
echo ""
echo "🌐 Website deployment:"
echo "  1. Push website/ folder to GitHub"
echo "  2. Connect to Netlify or Vercel (free hosting)"
echo "  3. Set custom domain: snaptype.app (\$10-12/year)"
echo ""
echo "💰 Payment setup:"
echo "  1. Create Lemon Squeezy account (free)"
echo "  2. Create product: SnapType Pro, \$4.99/mo subscription"
echo "  3. Enable license key generation"
echo "  4. Copy checkout URL into license.js CHECKOUT_URL"
echo "  5. Copy store slug into license.js STORE_SLUG"
