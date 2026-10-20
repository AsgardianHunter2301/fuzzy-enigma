#!/bin/sh
# package_site.sh - zip the built site folder and prove the zip round-trips.
#
# The folder is the primary deliverable (drag it onto a static host). The zip
# is for hosts and transfers that want a single file. A zip is only useful if
# what comes out equals what went in, so it is extracted to a fresh directory
# and every checksum in the folder's own SHA256SUMS.txt is re-verified there.
set -u
SITE=${1:?usage: package_site.sh <site-dir>}
DIST=$(dirname "$SITE")
LEAF=$(basename "$SITE")
ZIP="$DIST/$LEAF.zip"

rm -f "$ZIP"
( cd "$DIST" && zip -q -r -X "$LEAF.zip" "$LEAF" ) || { echo "zip failed"; exit 1; }

CHECK="$DIST/_ziptest"
rm -rf "$CHECK"; mkdir -p "$CHECK"
unzip -q "$ZIP" -d "$CHECK" || { echo "unzip failed"; exit 1; }

# SHA256SUMS.txt covers the payload and never itself, so it must verify in the
# extraction exactly as it does in the folder.
( cd "$CHECK/$LEAF" && sha256sum -c SHA256SUMS.txt >/dev/null 2>&1 ) || {
  echo "FAIL: checksums do not verify in a fresh extraction"; exit 1; }

IN=$(find "$SITE" -type f | wc -l)
OUT=$(find "$CHECK/$LEAF" -type f | wc -l)
[ "$IN" -eq "$OUT" ] || { echo "FAIL: $IN files in, $OUT files out"; exit 1; }

# the hidden Jekyll marker is easy to lose through a zip, and losing it breaks
# GitHub Pages for any underscore-prefixed path
[ -f "$CHECK/$LEAF/.nojekyll" ] || { echo "FAIL: .nojekyll did not survive the zip"; exit 1; }

printf 'zip        : %s (%s KiB)\n' "$ZIP" "$(( $(wc -c < "$ZIP") / 1024 ))"
printf 'files      : %s in, %s out\n' "$IN" "$OUT"
printf 'checksums  : every line of SHA256SUMS.txt verified in a fresh extraction\n'
printf '.nojekyll  : survived\n'
rm -rf "$CHECK"
