#!/usr/bin/env bash
# Tell Bing and Yandex the site changed, immediately, rather than waiting for a
# crawler to wander past. Google does not take part in IndexNow; its equivalent
# is submitting the sitemap in Search Console, which needs an account login.
#
# Run after any deploy that adds or changes pages.
set -euo pipefail

KEY=f7587612536330be8bec6ca9bf0c46b6
HOST=analyticascent.com

BODY=$(curl -s "https://$HOST/sitemap.xml" | python3 -c "
import json, re, sys
urls = re.findall(r'<loc>([^<]+)</loc>', sys.stdin.read())
print(json.dumps({
    'host': '$HOST',
    'key': '$KEY',
    'keyLocation': 'https://$HOST/$KEY.txt',
    'urlList': [u.strip() for u in urls],
}))
")

echo "submitting $(python3 -c "import json,sys;print(len(json.loads(sys.stdin.read())['urlList']))" <<< "$BODY") URLs"
curl -s -X POST https://api.indexnow.org/IndexNow \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$BODY" -w "IndexNow: HTTP %{http_code}\n" -o /dev/null
