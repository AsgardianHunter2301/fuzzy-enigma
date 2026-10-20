#!/bin/sh
# build_all.sh - compile and exercise each of the eleven alternative Graph ADTs.
#
# The eleven implementations define the SAME API, so they are never linked
# together: this script compiles ONE at a time against graph_driver.c, which
# includes it textually through -DSOURCE_FILE.
#
#   cd memorise_graph_c/drivers && ./build_all.sh
#
# Output goes to stdout and to RESULTS.txt. Exit status 0 means every stage
# passed. Stages:
#   1. strict object compile of each ADT                 (no -DNDEBUG)
#   2. the same compile with -DNDEBUG                    (must also be clean)
#   3. driver built and run, asserts build
#   4. driver built and run, -DNDEBUG build              (must match stage 3)
#   5. driver built and run under -fsanitize=address,undefined
#   6. the fatal precondition demonstrations, both builds (must exit 1)
#   7. driver run with LeakSanitizer ON, if a positive control proves LSan works
#
# Set CC to use a different compiler. Requires only a C11 toolchain and the
# standard headers; sanitizer stages are skipped if the toolchain lacks them.

set -u

CC=${CC:-gcc}
HERE=$(cd "$(dirname "$0")" && pwd)
ADT="$HERE/.."
OUT="$HERE/build"
RESULTS="$HERE/RESULTS.txt"

# Leak detection is disabled deliberately: the audit sandbox blocks
# LeakSanitizer's access to /proc. No leak-detection pass is claimed here.
ASAN_OPTIONS=detect_leaks=0:halt_on_error=1
UBSAN_OPTIONS=halt_on_error=1:print_stacktrace=1
export ASAN_OPTIONS UBSAN_OPTIONS

STRICT="-std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror"
SAN="-O1 -g -fsanitize=address,undefined -fno-sanitize-recover=all -fno-omit-frame-pointer"

rm -rf "$OUT"
mkdir -p "$OUT"
: > "$RESULTS"

fail_count=0
stage_count=0

say() {
    printf '%s\n' "$*" | tee -a "$RESULTS"
}

# run CMD..., record the command and its exit status, compare with expected
run() {
    expected=$1
    label=$2
    shift 2
    stage_count=$((stage_count + 1))
    say ""
    say "\$ $*"
    "$@" >"$OUT/.stdout" 2>"$OUT/.stderr"
    status=$?
    sed 's/^/  | /' "$OUT/.stdout" >>"$RESULTS"
    sed 's/^/  ! /' "$OUT/.stderr" >>"$RESULTS"
    sed 's/^/  | /' "$OUT/.stdout"
    sed 's/^/  ! /' "$OUT/.stderr"
    if [ "$status" -eq "$expected" ]; then
        say "  => exit $status (expected $expected) PASS   [$label]"
    else
        say "  => exit $status (expected $expected) FAIL   [$label]"
        fail_count=$((fail_count + 1))
    fi
}

say "=========================================================================="
say "memorise_graph_c/drivers/build_all.sh"
say "date (UTC): $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
say "compiler:   $($CC --version | head -1)"
say "uname:      $(uname -srm)"
say "strict:     $STRICT"
say "sanitizer:  $SAN"
say "=========================================================================="

# Does this toolchain have the sanitizers?
have_san=1
printf 'int main(void){return 0;}\n' > "$OUT/.san_probe.c"
if ! $CC $SAN "$OUT/.san_probe.c" -o "$OUT/.san_probe" 2>/dev/null; then
    have_san=0
    say ""
    say "NOTE: this toolchain cannot build -fsanitize=address,undefined;"
    say "      stage 5 is SKIPPED and no sanitizer pass is claimed."
fi

# Does LeakSanitizer actually detect a leak here? Prove it before claiming it.
have_lsan=0
if [ "$have_san" -eq 1 ]; then
    cat > "$OUT/.lsan_control.c" <<'CONTROL'
#include <stdlib.h>
int main(void) {
    void **holder = malloc(sizeof(void *));
    *holder = malloc(64);   /* reachable only through holder */
    free(holder);           /* now unreachable: a genuine 64-byte leak */
    return 0;
}
CONTROL
    if $CC -std=c11 -O0 -g -fsanitize=address "$OUT/.lsan_control.c" \
           -o "$OUT/.lsan_control" 2>/dev/null; then
        say ""
        say "LeakSanitizer positive control (a program that leaks 64 bytes):"
        say "\$ ASAN_OPTIONS=detect_leaks=1 $OUT/.lsan_control"
        if ASAN_OPTIONS=detect_leaks=1 "$OUT/.lsan_control" \
               >"$OUT/.lsan_out" 2>&1; then
            say "  => exit 0: the control leak was NOT reported."
            say "     LeakSanitizer is NOT working in this environment."
            say "     Stage 7 is SKIPPED and NO leak-detection pass is claimed."
        else
            if grep -q "detected memory leaks" "$OUT/.lsan_out"; then
                have_lsan=1
                say "  => exit 1 and 'detected memory leaks': control PASSED."
                say "     LeakSanitizer works here, so stage 7 is meaningful."
            else
                say "  => non-zero exit but no leak report; treating LSan as unusable."
                say "     Stage 7 is SKIPPED and NO leak-detection pass is claimed."
            fi
        fi
        sed 's/^/  | /' "$OUT/.lsan_out" >>"$RESULTS"
    fi
fi

for src in "$ADT"/COMP2521_memorise_*.c; do
    name=$(basename "$src" .c)
    variant=${name#COMP2521_memorise_}

    weighted=0
    directed=0
    edgearr=0
    case "$variant" in
        *unweighted*) weighted=0 ;;
        *weighted*)   weighted=1 ;;
    esac
    case "$variant" in *_directed_*) directed=1 ;; esac
    case "$variant" in *edge_array*) edgearr=1 ;; esac
    # Self-loops: the two unweighted UNDIRECTED variants reject them; the other
    # nine accept and count them. See docs/C_LIBRARY_MATRIX.md.
    loops=1
    if [ "$weighted" -eq 0 ] && [ "$directed" -eq 0 ]; then
        loops=0
    fi

    say ""
    say "##########################################################################"
    say "# $variant  (weighted=$weighted directed=$directed loops=$loops edge_array=$edgearr)"
    say "##########################################################################"

    # 1 and 2: strict object compile, with and without -DNDEBUG
    run 0 "strict compile" \
        $CC $STRICT -c "$src" -o "$OUT/$name.o"
    run 0 "strict compile -DNDEBUG" \
        $CC $STRICT -DNDEBUG -c "$src" -o "$OUT/$name.ndebug.o"

    # 3: driver, asserts build
    run 0 "driver build" \
        $CC $STRICT -DSOURCE_FILE="\"$src\"" -DVARIANT="\"$variant\"" \
        -DWEIGHTED=$weighted -DDIRECTED=$directed -DALLOW_LOOPS=$loops \
        -DEDGE_ARRAY=$edgearr "$HERE/graph_driver.c" -o "$OUT/$variant"
    run 0 "driver run" "$OUT/$variant"

    # 4: driver, -DNDEBUG build - behaviour must be identical
    run 0 "driver build -DNDEBUG" \
        $CC $STRICT -DNDEBUG -DSOURCE_FILE="\"$src\"" -DVARIANT="\"$variant\"" \
        -DWEIGHTED=$weighted -DDIRECTED=$directed -DALLOW_LOOPS=$loops \
        -DEDGE_ARRAY=$edgearr "$HERE/graph_driver.c" -o "$OUT/$variant.ndebug"
    run 0 "driver run -DNDEBUG" "$OUT/$variant.ndebug"

    # 5: sanitizers
    if [ "$have_san" -eq 1 ]; then
        run 0 "driver build sanitized" \
            $CC $STRICT $SAN -DSOURCE_FILE="\"$src\"" -DVARIANT="\"$variant\"" \
            -DWEIGHTED=$weighted -DDIRECTED=$directed -DALLOW_LOOPS=$loops \
            -DEDGE_ARRAY=$edgearr "$HERE/graph_driver.c" -o "$OUT/$variant.san"
        run 0 "driver run sanitized (ASan+UBSan, leak detection OFF)" \
            "$OUT/$variant.san"
    fi

    # 6: fatal precondition demonstrations - each must exit 1 in BOTH builds
    fatals="fatal-vertex fatal-null fatal-nv"
    if [ "$weighted" -eq 1 ]; then
        fatals="$fatals fatal-absent-weight fatal-negative-weight"
    fi
    for mode in $fatals; do
        run 1 "$mode (asserts)" "$OUT/$variant" "$mode"
        run 1 "$mode (-DNDEBUG)" "$OUT/$variant.ndebug" "$mode"
    done

    # 7: LeakSanitizer, only if the positive control above proved it works
    if [ "$have_lsan" -eq 1 ]; then
        ASAN_OPTIONS=detect_leaks=1:halt_on_error=1
        export ASAN_OPTIONS
        run 0 "driver run with LeakSanitizer ON (control-verified)" \
            "$OUT/$variant.san"
        ASAN_OPTIONS=detect_leaks=0:halt_on_error=1
        export ASAN_OPTIONS
    fi
done

say ""
say "=========================================================================="
say "stages run: $stage_count   stages failed: $fail_count"
if [ "$have_san" -eq 0 ]; then
    say "sanitizer stages: SKIPPED (toolchain cannot build them)"
fi
if [ "$have_lsan" -eq 1 ]; then
    say "LeakSanitizer: RUN with detect_leaks=1 on all variants, after a positive"
    say "               control confirmed it reports a known 64-byte leak here."
else
    say "LeakSanitizer: NOT run or not working here. No leak-detection pass is claimed."
fi
say "Build artefacts (objects and binaries) are under $OUT."
say "Delete that directory before packaging a release; this script recreates it."
say "=========================================================================="

rm -f "$OUT/.stdout" "$OUT/.stderr" "$OUT/.san_probe" "$OUT/.san_probe.c" \
      "$OUT/.lsan_control" "$OUT/.lsan_control.c" "$OUT/.lsan_out"
[ "$fail_count" -eq 0 ]
