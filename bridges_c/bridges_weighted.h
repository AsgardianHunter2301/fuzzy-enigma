/*
 * bridges_weighted.h - the weighted-graph supplemental bridges, as corrected by
 * findings BRG-03 and BRG-04 (MST result contract) and BRG-05 (missing and
 * incompatible dependencies, numeric domain).
 *
 * SOURCE LABEL: SUPPLEMENTAL C. The matching pseudocode is in the 26T2 manual;
 * this C conversion is not. Learn it separately.
 */
#ifndef BRIDGES_C_BRIDGES_WEIGHTED_H
#define BRIDGES_C_BRIDGES_WEIGHTED_H

#include <stdbool.h>

#include "wgraph.h"

/* ------------------------------------------------------------------ BRG-05 */
/* Single-source shortest paths.
 *
 * Declared numeric contract: Weight is double and the accepted weight domain
 * is the finite non-negative doubles, so zero and fractional weights are
 * supported. dist[] is a Weight array, NOT an int array, and the unreachable
 * value is WGRAPH_INFINITY, not INT_MAX.
 *
 * Declared predecessor contract: dist[] decides reachability
 * (dist[v] == WGRAPH_INFINITY means "no path from src"), and pred[src] stays
 * -1. This differs on purpose from the BFS bridge, where predecessor[] is the
 * only reached-marker and so the root is its own predecessor; Dijkstra has a
 * dist array and BFS does not. The difference is declared here so the two
 * lessons are not read as one convention.
 *
 * Ownership: the caller owns dist[] and pred[] and must provide room for
 * WGraphNumVertices(g) entries in each. Nothing is allocated for the caller. */
void dijkstraSSSP(WeightedGraph g, Vertex src, Weight dist[], Vertex pred[]);

/* Path reconstruction consumer for the arrays dijkstraSSSP() fills. Writes
 * src .. dest into path[] (room for nV vertices) and returns the number of
 * vertices written:
 *    n > 0  a path was reconstructed (n == 1 means dest == src)
 *    0      dest is unreachable from src
 *   -1      the dist/pred pair is malformed (out of range, or a predecessor
 *           cycle). No path is invented. */
int dijkstraFindPath(const Weight dist[], const Vertex pred[], int nV,
                     Vertex src, Vertex dest, Vertex path[]);

/* ------------------------------------------------------------ BRG-03/BRG-04 */
/* Declared MST result contract.
 *
 * A caller must be able to tell a spanning tree from a partial forest, so the
 * outcome is reported explicitly instead of being inferred from a returned
 * graph:
 *
 *   MST_SPANNING_TREE      `tree` spans every vertex: nEdges == nVertices - 1
 *                          and nComponents == 1. Requires nVertices >= 1; a
 *                          one-vertex graph succeeds with 0 edges and total
 *                          weight 0.0.
 *   MST_NO_SPANNING_TREE   no spanning tree exists (the graph is disconnected,
 *                          or has no vertices at all). `tree` then holds a
 *                          minimum spanning FOREST, which is NOT an MST:
 *                            - kruskalMst leaves a minimum spanning forest of
 *                              every component;
 *                            - primMst leaves a minimum spanning tree of the
 *                              component containing vertex 0 only, with the
 *                              other vertices isolated.
 *                          nComponents says how many components the forest has.
 *
 * Ownership: the caller owns the result and must release it exactly once with
 * MstResultFree(&result), in both the success and the failure case. The
 * returned graph is a NEW graph of the same weighted backend; the input graph
 * is not modified and is still owned by its own caller.
 *
 * Weight domain: the bundled weighted ADTs accept finite non-negative weights
 * only, so negative-weight MST inputs are outside this representation's
 * domain. Zero and fractional weights are inside it. Self-loops may exist in
 * the input and can never be chosen: a vertex already has a path to itself. */
typedef enum {
    MST_SPANNING_TREE = 0,
    MST_NO_SPANNING_TREE = 1
} MstStatus;

typedef struct {
    MstStatus status;
    WeightedGraph tree;   /* owned by the caller; see MstResultFree */
    int nVertices;
    int nEdges;
    int nComponents;
    Weight totalWeight;
} MstResult;

MstResult kruskalMst(WeightedGraph g);
MstResult primMst(WeightedGraph g);
void MstResultFree(MstResult *result);

/* Human-readable status, for drivers and lesson text. */
const char *MstStatusName(MstStatus status);

#endif /* BRIDGES_C_BRIDGES_WEIGHTED_H */
