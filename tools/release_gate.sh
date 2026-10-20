#!/usr/bin/env bash
# AUD-12: one reproducible local release gate.
#
# The audited build published regression claims (812 checks / 152 cases) that
# no repository route could re-run: that suite lived in a private assurance
# package. This gate is the opposite - every number it reports comes from a
# command in this repository, run now, and a single failure STOPS packaging.
# It never enables a remote setting, pushes, or deploys.
#
# Pinned tooling is recorded in the report so a clean checkout can reproduce
# it. Usage:
#   tools/release_gate.sh <tree> <output-dir> [--skip-browser]
set -uo pipefail
TREE="${1:?usage: release_gate.sh <tree> <output-dir> [--skip-browser]}"
OUT="${2:?usage: release_gate.sh <tree> <output-dir> [--skip-browser]}"
SKIP_BROWSER="${3:-}"
REPLAY="${DSA_REPLAY:-/home/claude/work/replay}"
LOADER="$REPLAY/reproduce/algorithm/load_modules.cjs"
BASE_URL="${DSA_BASE_URL:-http://127.0.0.1:8137}"
mkdir -p "$OUT/logs"
export DSA_REPO_ROOT="$TREE" DSA_LOADER="$LOADER"

pass=0; fail=0; skipped=0
declare -a ROWS=()
run() {  # run <name> <expected-exit> <command...>
  local name="$1" expect="$2"; shift 2
  local log="$OUT/logs/${name}.log"
  "$@" >"$log" 2>&1; local ec=$?
  if [ "$ec" = "$expect" ]; then pass=$((pass+1)); printf '  PASS  %-46s exit=%s\n' "$name" "$ec"
    ROWS+=("{\"gate\":\"$name\",\"status\":\"PASS\",\"exit\":$ec,\"log\":\"logs/${name}.log\"}")
  else fail=$((fail+1)); printf '  FAIL  %-46s exit=%s (expected %s)\n' "$name" "$ec" "$expect"
    tail -5 "$log" | sed 's/^/          /'
    ROWS+=("{\"gate\":\"$name\",\"status\":\"FAIL\",\"exit\":$ec,\"expected\":$expect,\"log\":\"logs/${name}.log\"}")
  fi
}
skip() { skipped=$((skipped+1)); printf '  SKIP  %-46s %s\n' "$1" "$2"
  ROWS+=("{\"gate\":\"$1\",\"status\":\"SKIP\",\"reason\":\"$2\"}"); }

echo "=== toolchain (pinned versions recorded with the results) ==="
NODE_V=$(node --version); PY_V=$(python3 --version 2>&1); GCC_V=$(gcc --version | head -1); TAR_V=$(tar --version | head -1)
printf '  node=%s\n  python=%s\n  gcc=%s\n  tar=%s\n' "$NODE_V" "$PY_V" "$GCC_V" "$TAR_V"

echo ""
echo "=== application and algorithm gates ==="
run smoke                    0 node "$REPLAY/reproduce/root_smoke.cjs"
run oracles_successor        0 node "$TREE/tests/correctness_oracles.successor.cjs"
run defect_expectations      0 node "$REPLAY/reproduce/algorithm/reproduce_findings.cjs"
run snapshot_immutability    0 node "$TREE/tools/assert_no_frame_mutation.cjs"
run source_mapping_audit     0 python3 -I "$TREE/tools/audit_source_mapping.py" "$TREE"
run topic_index_in_sync      0 node "$TREE/tools/sync_topic_index.cjs" --check
run displayed_c_in_sync      0 node "$TREE/tools/sync_displayed_c.cjs" --check
run manifest_in_sync         0 node "$TREE/tools/refresh_manifest.cjs" "$TREE" --check

echo ""
echo "=== successor test suites ==="
for t in "$TREE"/tests/*.test.cjs; do
  run "$(basename "$t" .test.cjs)" 0 node "$t"
done

echo ""
echo "=== C gates ==="
CRES="$OUT/c-results"; rm -rf "$CRES"
run c_adt_strict_and_sanitizer 0 python3 -I "$REPLAY/reproduce/c/audit_c.py" "$TREE" "$CRES"
run c_adt_ndebug_strict         0 bash -c 'cd "$1/memorise_graph_c" && for f in *.c; do gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DNDEBUG -c "$f" -o /dev/null || exit 1; done' _ "$TREE"
if [ -x "$TREE/bridges_c/build.sh" ] || [ -f "$TREE/bridges_c/build.sh" ]; then
  run c_bridges                 0 bash "$TREE/bridges_c/build.sh"
  run c_bridges_displayed_parity 0 bash "$TREE/bridges_c/verify_displayed_bridges.sh"
else skip c_bridges "bridges_c/build.sh not present"; fi

echo ""
echo "=== real-browser gate ==="
if [ "$SKIP_BROWSER" = "--skip-browser" ]; then
  skip browser_acceptance "explicitly skipped; a skip is NOT a pass"
elif curl -s -o /dev/null --max-time 4 "$BASE_URL/index.html"; then
  run browser_acceptance 0 node "$TREE/tests/browser/acceptance.cjs"
  # Four further real-browser gates. Each drives Chromium against the served
  # app rather than inspecting source text, and each fails the release.
  #   axe_wcag             automated WCAG 2.0/2.1 A and AA sweep of every page,
  #                        loaded and after Run. Does NOT establish screen-reader
  #                        usability; that remains an open human check.
  #   manual_bridge_render every module on every page: no manual pseudocode block
  #                        may render without a C conversion, and no conversion
  #                        may omit the routine its pseudocode names.
  #   capability_destinations re-tests the exact condition each closed coverage
  #                        finding recorded, recomputing stated quantities.
  run axe_wcag               0 node "$TREE/tools/axe_audit.cjs"
  run manual_bridge_render   0 node "$TREE/tools/audit_manual_bridges.cjs"
  run capability_destinations 0 node "$TREE/tools/verify_capabilities.cjs"
else
  skip browser_acceptance "no server reachable at $BASE_URL; a skip is NOT a pass"
  skip axe_wcag "no server reachable at $BASE_URL; a skip is NOT a pass"
  skip manual_bridge_render "no server reachable at $BASE_URL; a skip is NOT a pass"
  skip capability_destinations "no server reachable at $BASE_URL; a skip is NOT a pass"
fi

echo ""
echo "=== deployable site folder ==="
run site_build 0 node "$TREE/tools/build_site.cjs" "$TREE" "$OUT/site"
if [ "$SKIP_BROWSER" = "--skip-browser" ]; then
  skip site_serves_from_root_and_subpath "browser gates skipped; a skip is NOT a pass"
else
  # The folder is served twice - as a whole domain and inside a subdirectory -
  # and the full acceptance suite is run against each, because a static folder
  # can look complete and still only work when served from a domain root.
  run site_serves_from_root_and_subpath 0 bash "$TREE/tools/verify_site.sh" "$TREE" "$OUT/site/dsa_guide"
fi
# The zip is only useful if what comes out equals what went in, so it is
# extracted to a fresh directory and every checksum re-verified there.
run site_zip_round_trips 0 bash "$TREE/tools/package_site.sh" "$OUT/site/dsa_guide"

echo ""
printf '  GATE TOTAL: passed=%s failed=%s skipped=%s\n' "$pass" "$fail" "$skipped"
{ printf '{\n "tree":"%s",\n "toolchain":{"node":"%s","python":"%s","gcc":"%s","tar":"%s"},\n' \
    "$TREE" "$NODE_V" "$PY_V" "$GCC_V" "$TAR_V"
  printf ' "passed":%s,"failed":%s,"skipped":%s,\n "gates":[%s]\n}\n' \
    "$pass" "$fail" "$skipped" "$(IFS=,; echo "${ROWS[*]}")"; } > "$OUT/gate_report.json"

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "  RELEASE REFUSED: $fail gate(s) failed. No package was produced."
  exit 1
fi
if [ "$skipped" -ne 0 ]; then
  echo "  NOTE: $skipped gate(s) were skipped. A skip is recorded, never counted as a pass."
fi
echo ""
echo "=== packaging (only reached because every gate passed) ==="
node "$TREE/tools/build_release.cjs" --out "$OUT/release" > "$OUT/logs/build_release.log" 2>&1 || { echo "  packaging failed"; exit 1; }
node "$TREE/tools/verify_release.cjs" --dir "$OUT/release" --work "$OUT/release_verify" || { echo "  release verification failed"; exit 1; }
echo ""
echo "  release built and verified: $OUT/release"
