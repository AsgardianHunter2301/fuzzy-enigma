#!/bin/sh
# verify_site.sh - prove the built site folder actually deploys.
#
# A static folder can look complete and still fail on a real host: a path that
# only resolves because the app was served from a domain root, an asset the
# build never copied, a page that 404s. So the built folder is served TWICE -
# once as a whole domain, once inside a subdirectory, which is what a GitHub
# Pages project site or any /subpath deployment looks like - and the full
# real-browser acceptance suite is run against each. Nothing here inspects the
# folder's text; both runs drive Chromium against a served copy.
set -u
TREE=${1:?usage: verify_site.sh <tree> <site-dir>}
SITE=${2:?usage: verify_site.sh <tree> <site-dir>}
PARENT=$(dirname "$SITE")
LEAF=$(basename "$SITE")
PORT_ROOT=${PORT_ROOT:-8141}
PORT_SUB=${PORT_SUB:-8142}
fails=0

python3 -m http.server "$PORT_ROOT" --bind 127.0.0.1 --directory "$SITE"   >/dev/null 2>&1 &
ROOT_PID=$!
python3 -m http.server "$PORT_SUB"  --bind 127.0.0.1 --directory "$PARENT" >/dev/null 2>&1 &
SUB_PID=$!
trap 'kill $ROOT_PID $SUB_PID 2>/dev/null' EXIT INT TERM
sleep 2

# One run per layout. The suite's own exit status is the gate; its summary
# line is printed for the record.
echo "=== served as a whole domain: http://127.0.0.1:$PORT_ROOT ==="
DSA_BASE_URL="http://127.0.0.1:$PORT_ROOT" node "$TREE/tests/browser/acceptance.cjs" > "$PARENT/site_root.log" 2>&1
root_status=$?
tail -2 "$PARENT/site_root.log"
[ $root_status -eq 0 ] || fails=$((fails+1))

echo ""
echo "=== served inside a subdirectory: http://127.0.0.1:$PORT_SUB/$LEAF ==="
DSA_BASE_URL="http://127.0.0.1:$PORT_SUB/$LEAF" node "$TREE/tests/browser/acceptance.cjs" > "$PARENT/site_sub.log" 2>&1
sub_status=$?
tail -2 "$PARENT/site_sub.log"
[ $sub_status -eq 0 ] || fails=$((fails+1))

echo ""
echo "=== every shipped page returns 200 on both layouts ==="
for f in "$SITE"/*.html; do
  p=$(basename "$f")
  for u in "http://127.0.0.1:$PORT_ROOT/$p" "http://127.0.0.1:$PORT_SUB/$LEAF/$p"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$u")
    [ "$code" = "200" ] || { echo "  FAIL $u -> $code"; fails=$((fails+1)); }
  done
done
echo "  checked $(ls "$SITE"/*.html | wc -l) pages on 2 layouts"

echo ""
if [ "$fails" -eq 0 ]; then echo "SITE VERIFY: PASS (root and subdirectory)"; else echo "SITE VERIFY: FAIL ($fails)"; fi
exit $([ "$fails" -eq 0 ] && echo 0 || echo 1)
