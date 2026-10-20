/*
 * adt_undirected_adjlist.c - backend A.
 *
 * SOURCE LABEL: MEMORISE (supplied file, included verbatim and UNMODIFIED).
 *
 * The whole translation unit is the read-only supplied implementation
 * ../memorise_graph_c/COMP2521_memorise_graph_adjacency_list.c. Nothing is
 * copied or edited here; it is included so that the executable links the
 * actual supplied Graph ADT rather than a re-typed imitation.
 *
 * Declared contract of this backend (read from the supplied source):
 *   undirected, unweighted, ordered adjacency lists, nE counts undirected
 *   edges once, duplicate insertion is a no-op, and GraphInsertEdge(g, v, v)
 *   is REJECTED (the guard is `if (v == w || GraphIsAdjacent(g, v, w))`), so a
 *   self-loop can never exist in this representation.
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
#include "COMP2521_memorise_graph_adjacency_list.c"
