#!/usr/bin/env bash
# Build a browser-playable itch.io package.
#
#   ./tools/build-itch.sh          -> build/dirt-money-itch.zip
#
# Two things make the build far lighter than the source tree:
#   1. assets/concept/ (122 MB) is skipped. Everything the game renders now
#      resolves to assets/final/; the only concept entries still referenced are
#      the six field overlays, which nothing draws — those are copied anyway so
#      nothing 404s.
#   2. The paintings are re-encoded PNG -> JPEG q82. They are opaque, so no
#      alpha is lost, and it cuts ~135 MB to roughly a tenth of that with no
#      visible difference. artManifest paths are rewritten to match IN THE
#      BUILD ONLY; the source tree stays PNG.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
OUT="$ROOT/build/itch"
QUALITY=82

rm -rf "$OUT" && mkdir -p "$OUT"
echo "staging..."
cp index.html "$OUT/"
cp favicon.svg "$OUT/" 2>/dev/null || true
cp -R src "$OUT/"
mkdir -p "$OUT/assets"
cp -R assets/placeholders "$OUT/assets/"
if [ -d assets/concept/fields/overlays ]; then
  mkdir -p "$OUT/assets/concept/fields/overlays"
  cp assets/concept/fields/overlays/* "$OUT/assets/concept/fields/overlays/" 2>/dev/null || true
fi

echo "re-encoding paintings to jpeg q$QUALITY..."
count=0
while IFS= read -r png; do
  rel="${png#assets/final/}"
  dest="$OUT/assets/final/${rel%.png}.jpg"
  mkdir -p "$(dirname "$dest")"
  sips -s format jpeg -s formatOptions "$QUALITY" "$png" --out "$dest" >/dev/null 2>&1
  count=$((count + 1))
done < <(find assets/final -name "*.png")
echo "  $count images"

# Point the manifest at the .jpg copies. Only assets/final paths are touched,
# so concept and placeholder (SVG) fallbacks keep working untouched.
sed -i '' -E 's|(\./assets/final/[^"]*)\.png|\1.jpg|g' "$OUT/src/artManifest.js"

echo "zipping..."
mkdir -p "$ROOT/build"
rm -f "$ROOT/build/dirt-money-itch.zip"
( cd "$OUT" && zip -qr "$ROOT/build/dirt-money-itch.zip" . -x ".*" -x "__MACOSX/*" )

echo ""
echo "source assets : $(du -sh "$ROOT/assets" | cut -f1)"
echo "build payload : $(du -sh "$OUT" | cut -f1)"
echo "zip           : $(du -h "$ROOT/build/dirt-money-itch.zip" | cut -f1)  -> build/dirt-money-itch.zip"
echo ""
echo "Upload that zip to itch.io, tick \"This file will be played in the browser\","
echo "and set the viewport to 1280x800 or larger."
