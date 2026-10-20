/*
 * adt_directed_matrix.c - backend C.
 *
 * SOURCE LABEL: MEMORISE (supplied file, included verbatim and UNMODIFIED).
 *
 * The whole translation unit is the read-only supplied implementation
 * ../memorise_graph_c/COMP2521_memorise_unweighted_directed_adjacency_matrix.c.
 *
 * Declared contract of this backend (read from the supplied source):
 *   directed, unweighted, nV x nV boolean matrix, nE counts ARCS, duplicate
 *   insertion is a no-op, and self-loops ARE accepted and counted
 *   (GraphInsertEdge has no `v == w` guard). GraphIsAdjacent(g, v, w) tests the
 *   arc v -> w only.
 *
 * Used by the Warshall driver because the Warshall lesson takes directed arcs.
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
#include "COMP2521_memorise_unweighted_directed_adjacency_matrix.c"
