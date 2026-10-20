#!/bin/sh
# build.sh - compile and run every executable bridge driver, twice over:
#   strict    gcc -std=c11 -Wall -Wextra -Wpedantic -Werror
#   sanitize  gcc -std=c11 -O1 -g -fsanitize=address,undefined \
#                 -fno-sanitize-recover=all
# and against two copies of the read-only supplied Graph ADTs:
#   product   -I ../memorise_graph_c                        (the product copy)
#   pinned    -I ../../baseline_pristine/memorise_graph_c   (stable copy)
# The product copy is edited by another agent while this runs, so the pinned
# copy is what makes a result reproducible; both are recorded either way.
#
# Everything is written to RESULTS.txt with the ACTUAL exit statuses. Usage:
#   ./build.sh            build and run everything, rewrite RESULTS.txt
#   ./build.sh --quick    strict + pinned only, do not write RESULTS.txt
set -u

cd "$(dirname "$0")" || exit 1

OUT=${OUT:-./_build}
RESULTS=RESULTS.txt
QUICK=0
[ "${1:-}" = "--quick" ] && QUICK=1

STRICT="-std=c11 -Wall -Wextra -Wpedantic -Werror"
SANITIZE="-std=c11 -O1 -g -fsanitize=address,undefined -fno-sanitize-recover=all -Wall -Wextra -Wpedantic -Werror"

PRODUCT_ADT=../memorise_graph_c
# The pinned copy is an OPTIONAL external source dependency: it demonstrates
# that these bridges compile against the unmodified audited ADTs as well as
# against the product copy. It lives OUTSIDE this tree, so it is absent
# whenever the assurance package is relocated or extracted elsewhere. Override
# with DSA_PINNED_ADT=<dir>. When absent, the pinned half of the matrix is
# recorded as SKIPPED - never silently counted as a pass - and the build does
# not fail, because the product half is the gate that matters.
PINNED_ADT="${DSA_PINNED_ADT:-../../baseline_pristine/memorise_graph_c}"
if [ -d "$PINNED_ADT" ]; then HAVE_PINNED=1; else HAVE_PINNED=0; fi

# target | sources | expected exit status
TARGETS="
test_bfs_adjlist|test_bfs.c bridges_graph.c queue.c adt_undirected_adjlist.c|0
test_bfs_matrix|test_bfs.c bridges_graph.c queue.c adt_manual_undirected_matrix.c|0
test_cycle_adjlist|test_cycle.c bridges_graph.c queue.c adt_undirected_adjlist.c|0
test_cycle_matrix|test_cycle.c bridges_graph.c queue.c adt_manual_undirected_matrix.c|0
test_warshall|test_warshall.c bridges_graph.c queue.c adt_directed_matrix.c|0
test_unchanged|test_unchanged.c bridges_graph.c queue.c radix_sort.c adt_undirected_adjlist.c|0
test_dfspath_adjlist|test_dfspath.c bridges_graph.c queue.c adt_undirected_adjlist.c|0
test_dfspath_matrix|test_dfspath.c bridges_graph.c queue.c adt_manual_undirected_matrix.c|0
test_dfspath_directed|test_dfspath.c bridges_graph.c queue.c adt_directed_matrix.c|0
test_avl|test_avl.c avl.c|0
test_mst|test_mst.c bridges_weighted.c wgraph_common.c wgraph_undirected_adjlist.c|0
test_dijkstra|test_dijkstra.c bridges_weighted.c wgraph_common.c wgraph_directed_adjlist.c|0
test_mst_backend_guard|test_mst_backend_guard.c bridges_weighted.c wgraph_common.c wgraph_directed_adjlist.c|nonzero
"

failures=0
log() { printf '%s\n' "$*"; }

run_matrix() {
    mode=$1; flags=$2; adtname=$3; adtdir=$4

    log ""
    log "=============================================================="
    log "MODE $mode   ADT COPY $adtname ($adtdir)"
    log "FLAGS gcc $flags"
    log "=============================================================="

    echo "$TARGETS" | while IFS='|' read -r target sources expect; do
        [ -z "$target" ] && continue
        bin="$OUT/${mode}_${adtname}_${target}"

        # shellcheck disable=SC2086
        gcc $flags -I "$adtdir" $sources -lm -o "$bin" 2>"$bin.cc.log"
        cc=$?
        if [ -s "$bin.cc.log" ]; then
            log "COMPILE DIAGNOSTICS for $target:"
            sed 's/^/    /' "$bin.cc.log"
        fi
        log "compile $target: exit $cc"
        if [ $cc -ne 0 ]; then
            log "RESULT $target: COMPILE FAILED"
            echo x >> "$OUT/.failed"
            continue
        fi

        if [ "$target" = "test_mst_backend_guard" ] && [ "$mode" = "sanitize" ]; then
            ASAN_OPTIONS=detect_leaks=0 "$bin" > "$bin.out" 2>&1
        else
            "$bin" > "$bin.out" 2>&1
        fi
        rc=$?
        sed 's/^/    /' "$bin.out"
        log "run $target: exit $rc (expected $expect)"

        ok=0
        if [ "$expect" = "nonzero" ]; then
            [ $rc -ne 0 ] && ok=1
        else
            [ "$rc" = "$expect" ] && ok=1
        fi
        if [ $ok -eq 1 ]; then
            log "RESULT $target: PASS"
        else
            log "RESULT $target: FAIL"
            echo x >> "$OUT/.failed"
        fi
    done
}

mkdir -p "$OUT"
rm -f "$OUT/.failed"

{
    log "bridges_c build and test record"
    log "generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ') UTC"
    log "gcc: $(gcc --version | head -1)"
    log "host: $(uname -srm)"
    log ""
    log "sha256 of the read-only supplied Graph ADTs this run compiled against:"
    for d in "$PRODUCT_ADT" "$PINNED_ADT"; do
        for f in COMP2521_memorise_graph_adjacency_list.c \
                 COMP2521_memorise_unweighted_directed_adjacency_matrix.c \
                 COMP2521_memorise_weighted_undirected_adjacency_list.c \
                 COMP2521_memorise_weighted_directed_adjacency_list.c; do
            [ -f "$d/$f" ] && sha256sum "$d/$f" | sed 's/^/  /'
        done
    done

    log ""
    log "=============================================================="
    log "PARITY: the bridge text the app displays, compiled as C"
    log "=============================================================="
    if [ "$HAVE_PINNED" -eq 1 ]; then
        ADT="$PINNED_ADT" ./verify_displayed_bridges.sh 2>&1
        log "verify_displayed_bridges.sh: exit $?"
    else
        ADT="$PRODUCT_ADT" ./verify_displayed_bridges.sh 2>&1
        log "verify_displayed_bridges.sh (product ADT; pinned copy absent): exit $?"
    fi

    run_matrix strict "$STRICT" product "$PRODUCT_ADT"
    if [ $QUICK -eq 0 ]; then
        run_matrix sanitize "$SANITIZE" product "$PRODUCT_ADT"
    fi
    if [ "$HAVE_PINNED" -eq 1 ]; then
        run_matrix strict "$STRICT" pinned "$PINNED_ADT"
        [ $QUICK -eq 0 ] && run_matrix sanitize "$SANITIZE" pinned "$PINNED_ADT"
    else
        log ""
        log "SKIPPED: no pinned audited ADT copy at $PINNED_ADT."
        log "         The pinned half of the matrix did NOT run. Recorded as"
        log "         skipped, not as a pass. Set DSA_PINNED_ADT to a checkout"
        log "         of commit 37ada3235c4d67f8b98c46afdb31c092b44419ed to run it."
    fi

    log ""
    if [ -f "$OUT/.failed" ]; then
        failures=$(wc -l < "$OUT/.failed")
        log "OVERALL: $failures target run(s) did not meet expectations"
    else
        log "OVERALL: every target compiled and met its expected exit status"
    fi
} 2>&1 | if [ $QUICK -eq 0 ]; then tee "$RESULTS"; else cat; fi

if [ -f "$OUT/.failed" ]; then
    exit 1
fi
exit 0
