/*
 * wgraph_undirected_adjlist.c - weighted backend U.
 *
 * SOURCE LABEL: MEMORISE supplied file, included verbatim and UNMODIFIED, plus
 * two SUPPLEMENTAL descriptor functions authored for the remediation.
 *
 * Contract of this backend (read from the supplied source):
 *   undirected, Weight = double, finite non-negative weights only, zero and
 *   fractional weights accepted, ordered adjacency lists, nE counts each
 *   undirected edge once, re-inserting an existing edge UPDATES its weight,
 *   self-loops ARE accepted and counted once, and GraphGetWeight requires an
 *   existing edge (it terminates the program otherwise) - which is why
 *   wgraph_common.c always tests adjacency first.
 */
/*
 * BACKEND SOURCE SELECTION: the supplied file is included by bare name, so the
 * directory comes from the compiler's -I flag and one flag chooses which copy
 * of the read-only ADTs this build compiles against:
 *   -I ../memorise_graph_c                        the product copy
 *   -I ../../baseline_pristine/memorise_graph_c   the pinned baseline copy
 * build.sh builds and runs both and records both exit statuses, because the
 * product copy is being edited concurrently by another agent while the pinned
 * copy cannot change under the build. The two copies declare the same API.
 */
#include "COMP2521_memorise_weighted_undirected_adjacency_list.c"
#include "wgraph.h"

const char *WGraphBackendName(void) {
    return "memorise_graph_c/COMP2521_memorise_weighted_undirected_adjacency_list.c";
}

bool WGraphIsUndirected(void) {
    return true;
}
