#!/usr/bin/env bash
# Tell Bing and Yandex the site changed, immediately rather than whenever a
# crawler next wanders past. Google does not participate in IndexNow; its
# equivalent is submitting the sitemap in Search Console, which needs a login.
set -euo pipefail
KEY=f7587612536330be8bec6ca9bf0c46b6
HOST=analyticascent.com
URLS=$(curl -s https://$HOST/sitemap.xml | grep -oE '<loc>[^<]*</loc>' | sed 's|</\?loc>||g')
BODY=$(python3 -c "
import json,sys
urls=[u.strip() for u in sys.stdin.read().split() if u.strip()]
print(json.dumps({'host':'$HOST','key':'$KEY','keyLocation':'https://$HOST/$KEY.txt','urlList':urls}))
" <<< "$URLS")
curl -s -X POST https://api.indexnow.org/IndexNow \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$BODY" -o /dev/null -w "IndexNow: HTTP %{http_code}\n"
