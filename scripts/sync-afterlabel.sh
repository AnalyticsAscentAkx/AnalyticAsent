#!/usr/bin/env bash
# Refreshes public/afterlabel.html and public/afterlabel/ from the Afterlabel repo's site build.
#   scripts/sync-afterlabel.sh [path-to-afterlabel-repo]
# Default path: ../a/afterlabel next to this repo. The build reads CONTACT_EMAIL (src/lib/site.ts) and the
# GA4 id (src/components/Analytics.tsx) from this repo, so the page cannot drift from the site's settings.
# Review the diff and commit the result; nothing here pushes.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$(cd "${1:-$HERE/../a/afterlabel}" && pwd)"
node "$SRC/apps/web/build.mjs" --target=site --site-repo="$HERE"
# The page is public/afterlabel.html, served at /afterlabel by the rewrite in next.config.mjs; the font and
# licence sit in public/afterlabel/ (the page links /afterlabel/archivo.woff2).
mkdir -p "$HERE/public/afterlabel"
cp "$SRC/apps/web/dist-site/index.html" "$HERE/public/afterlabel.html"
cp "$SRC/apps/web/dist-site/"{archivo.woff2,OFL.txt} "$HERE/public/afterlabel/"
if grep -q $'\xe2\x80\x94' "$HERE/public/afterlabel.html"; then echo "em dash in built page" >&2; exit 1; fi
echo "synced $(git -C "$SRC" rev-parse --short HEAD) -> public/afterlabel.html, public/afterlabel/"
