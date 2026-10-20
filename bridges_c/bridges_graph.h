/*
 * bridges_graph.h - the unweighted-graph supplemental bridges, as corrected by
 * findings BRG-01 (BFS root predecessor), BRG-02 (Warshall reachability) and
 * BRG-06 (undirected self-loop cycle), together with the bridges that were
 * reviewed and left unchanged.
 *
 * SOURCE LABEL: SUPPLEMENTAL C. The matching pseudocode is in the 26T2 manual;
 * this C conversion is not. Learn it separately.
 */
#ifndef BRIDGES_C_BRIDGES_GRAPH_H
#define BRIDGES_C_BRIDGES_GRAPH_H

#include <stdbool.h>

#include "graph_unweighted.h"

/* ------------------------------------------------------------------ BRG-01 */
/* Declared predecessor convention - ROOT IS ITS OWN PREDECESSOR:
 *   predecessor[src] == src                 the search root
 *   predecessor[w]   == -1                  w was never reached from src
 *   otherwise        == the vertex w was reached from
 * -1 therefore has exactly ONE meaning. Caller frees the returned array. */
int *bfs(Graph g, Vertex src);

/* Path reconstruction consumer for the array bfs() returns. Writes
 * src .. dest into path[] (which needs room for nV vertices) and returns the
 * number of vertices written:
 *    n > 0  a path was reconstructed (n == 1 means dest == src)
 *    0      dest was never reached from src
 *   -1      the predecessor array is malformed (out of range, or a cycle that
 *           is not the root's self-reference). No path is invented. */
int bfsFindPath(const int *predecessor, int nV, Vertex src, Vertex dest,
                Vertex path[]);

/* True when BFS reached v from src, i.e. a walk of zero or more edges exists.
 * bfsReached(pred, src, src) is true under the declared convention. */
bool bfsReached(const int *predecessor, int nV, Vertex v);

/* ----------------------------------------------- reviewed-unchanged: dfs */
bool *dfs(Graph g, Vertex src); /* caller frees */

/* ------------------------------------------------------------------ NEW-15 */
/* True when a walk of zero or more edges runs from src to dest.
 * dfsHasPath(g, v, v) is true, and an out-of-range vertex is false, never a
 * crash. */
bool dfsHasPath(Graph g, Vertex src, Vertex dest);

/* The first path DFS finds from src to dest under neighbour order - NOT the
 * shortest; use the BFS bridge for that. Writes src .. dest into path[], which
 * needs room for GraphNumVertices(g) vertices, and returns the number written:
 *    n > 0  a path was written (n == 1 means dest == src)
 *    0      dest was never reached from src
 *   -1      src or dest is out of range, or the predecessor chain is malformed.
 *           No path is invented. */
int dfsFindPath(Graph g, Vertex src, Vertex dest, Vertex path[]);

/* ------------------------------------------------------------------ BRG-06 */
/* True when g contains an undirected cycle. A self-loop at v IS a cycle when
 * the Graph backend accepts and counts one. */
bool hasCycle(Graph g);

/* -------------------------------------- reviewed-unchanged: components */
int *components(Graph g); /* caller frees */

/* ------------------------------ reviewed-unchanged: Hamiltonian search */
bool hasHamiltonianPath(Graph g);
bool hasHamiltonianCircuit(Graph g);

/* ------------------------------------------------------------------ BRG-02 */
/* Declared reachability convention - POSITIVE-LENGTH REACHABILITY:
 * tc[v][w] is true exactly when a walk of ONE OR MORE arcs runs from v to w.
 * The diagonal is therefore false unless v lies on a cycle or has a self-loop.
 * Caller owns the result and must release it with warshallFree(tc, nV). */
bool **warshall(Graph g);

/* Labelled alternative contract - REFLEXIVE closure: the same matrix with the
 * diagonal forced true, i.e. walks of ZERO or more arcs. Provided so the two
 * definitions are visibly different objects instead of one silent conversion.
 * Caller owns the result and must release it with warshallFree(tc, nV). */
bool **warshallReflexive(Graph g);

void warshallFree(bool **tc, int nV);

#endif /* BRIDGES_C_BRIDGES_GRAPH_H */
