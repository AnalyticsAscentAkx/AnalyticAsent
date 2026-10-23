#!/usr/bin/env bash
# Copies the Afterlabel engine source into src/lib/afterlabel/engine/, which the /afterlabel route imports.
#   scripts/sync-afterlabel.sh [path-to-afterlabel-repo]           write the synced copy
#   scripts/sync-afterlabel.sh --check [path-to-afterlabel-repo]   regenerate into a temp dir and diff; exit 1 on any difference
# Default path: ../a/afterlabel next to this repo. Each file gets a header naming the commit it came from, so
# the copy is reviewable in this repo's diff and regenerable. Review the diff and commit; nothing here pushes.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK=0
if [[ "${1:-}" == "--check" ]]; then CHECK=1; shift; fi
SRC="$(cd "${1:-$HERE/../a/afterlabel}" && pwd)"
DEST="$HERE/src/lib/afterlabel/engine"

SHA="$(git -C "$SRC" rev-parse HEAD)"
SHORT="$(git -C "$SRC" rev-parse --short HEAD)"
# The commit's date rather than today's, so --check regenerates identical headers on any day.
DAY="$(git -C "$SRC" log -1 --format=%cs HEAD)"

OUT="$DEST"
if (( CHECK )); then OUT="$(mktemp -d)"; trap 'rm -rf "$OUT"' EXIT; fi
mkdir -p "$OUT"
if (( ! CHECK )); then rm -f "$OUT"/*.ts; fi

for f in "$SRC"/packages/engine/src/*.ts; do
  name="$(basename "$f")"
  {
    echo "// Synced from afterlabel packages/engine/src/$name at $SHA ($DAY). Do not edit here: change it in the afterlabel repo and run scripts/sync-afterlabel.sh."
    echo "/* eslint-disable */"
    cat "$f"
  } > "$OUT/$name"
done

if grep -l $'\xe2\x80\x94' "$OUT"/*.ts >&2; then echo "em dash in synced engine" >&2; exit 1; fi
if perl -ne 'if (/(?<!cr)aakash|ravindranath|chavan|enviolo/i) { print "$ARGV: $_"; $hit = 1 } END { exit($hit ? 0 : 1) }' "$OUT"/*.ts >&2; then
  echo "name guard hit in synced engine" >&2; exit 1
fi

if (( CHECK )); then
  if diff -r "$OUT" "$DEST"; then echo "in sync with $SHORT"; else echo "src/lib/afterlabel/engine/ differs from afterlabel $SHORT: run scripts/sync-afterlabel.sh" >&2; exit 1; fi
else
  echo "synced $SHORT -> src/lib/afterlabel/engine/"
fi
