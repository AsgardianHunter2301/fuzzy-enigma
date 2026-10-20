/*
 * wgraph.h - the weighted-graph helper/type API that the Dijkstra, Kruskal and
 * Prim bridges assume but that did not exist anywhere in the repository
 * (finding BRG-05).
 *
 * SOURCE LABEL: SUPPLEMENTAL ADAPTER (authored for the remediation; not course
 * source and not a quotation of the manual).
 *
 * ---------------------------------------------------------------------------
 * DECLARED NUMERIC AND MISSING-EDGE CONTRACT
 * ---------------------------------------------------------------------------
 * Weight is `double`, matching the six bundled weighted Graph variants in
 * ../memorise_graph_c. The accepted weight domain is therefore
 *
 *     every FINITE double w with w >= 0.0
 *
 * which keeps zero and fractional weights (0.0, 0.25, 2.5) inside the learning
 * domain. Weights are NOT narrowed to int.
 *
 * Because 0.0 is a legal weight, no finite value can act as an "absent edge"
 * marker. One single non-finite sentinel is used instead, and it is outside the
 * accepted weight domain by construction:
 *
 *     WGRAPH_NO_EDGE  == WGRAPH_INFINITY == +INFINITY
 *
 * Both names denote the same value on purpose: "there is no edge" and "no path
 * yet" are both represented by an infinite cost, so a relaxation across a
 * missing edge can never improve a distance. The two spellings exist so that
 * call sites say which idea they mean.
 *
 * Two query forms are provided, with identical meaning:
 *   WGraphEdgeWeight(g, v, w, &out)  -> bool; the unambiguous form. Returns
 *                                      false and leaves *out untouched when
 *                                      there is no edge v-w.
 *   WGraphWeight(g, v, w)            -> Weight; returns WGRAPH_NO_EDGE when
 *                                      there is no edge v-w. This is the form
 *                                      the displayed Dijkstra bridge uses.
 * Neither form may be replaced by calling the backend's GraphGetWeight
 * directly: the supplied weighted ADTs state that an existing edge is a
 * precondition of GraphGetWeight and they terminate the program when it is
 * violated.
 *
 * ---------------------------------------------------------------------------
 * OWNERSHIP
 * ---------------------------------------------------------------------------
 *   WGraphNew            caller owns the handle; release with WGraphFree once.
 *   WGraphEdges          caller owns the returned array; release with free().
 *   WGraphEdgesByWeight  caller owns the returned array; release with free().
 *   Both edge functions may return NULL when the graph has no edges; *nE is
 *   then 0. NULL is a valid "no edges" answer, not a failure.
 *
 * ---------------------------------------------------------------------------
 * BACKEND SELECTION
 * ---------------------------------------------------------------------------
 * Exactly one backend translation unit is linked per executable, because every
 * alternative weighted Graph implementation defines the same external names:
 *
 *   wgraph_undirected_adjlist.c   supplied weighted UNDIRECTED adjacency list
 *                                 (loops accepted; nE counts undirected edges)
 *   wgraph_directed_adjlist.c     supplied weighted DIRECTED adjacency list
 *                                 (loops accepted; nE counts arcs)
 *
 * WGraphBackendName() and WGraphIsUndirected() let a driver and the MST
 * bridges state which backend they are running on instead of guessing.
 * kruskalMst/primMst require an undirected backend: a minimum spanning tree is
 * only defined for an undirected graph.
 */
#ifndef BRIDGES_C_WGRAPH_H
#define BRIDGES_C_WGRAPH_H

#include <math.h>
#include <stdbool.h>

typedef struct graph *WeightedGraph;
typedef int Vertex;
typedef double Weight;

#define WGRAPH_INFINITY ((Weight) INFINITY)
#define WGRAPH_NO_EDGE  WGRAPH_INFINITY

/* One undirected edge, or one arc on a directed backend. */
typedef struct {
    Vertex v;
    Vertex w;
    Weight weight;
} Edge;

const char *WGraphBackendName(void);
bool WGraphIsUndirected(void);

WeightedGraph WGraphNew(int nV);
void WGraphFree(WeightedGraph g);
int WGraphNumVertices(WeightedGraph g);
int WGraphNumEdges(WeightedGraph g);
bool WGraphIsAdjacent(WeightedGraph g, Vertex v, Vertex w);

/* Insert or update edge v-w. Requires isfinite(weight) && weight >= 0.0. */
void WGraphInsertEdge(WeightedGraph g, Vertex v, Vertex w, Weight weight);
void WGraphRemoveEdge(WeightedGraph g, Vertex v, Vertex w);

bool WGraphEdgeWeight(WeightedGraph g, Vertex v, Vertex w, Weight *out);
Weight WGraphWeight(WeightedGraph g, Vertex v, Vertex w);

/* Every edge once, in (v, w) order; *nE receives the count. Caller frees. */
Edge *WGraphEdges(WeightedGraph g, int *nE);

/* Every edge once in non-decreasing weight order, ties broken by (v, w) so the
 * order is deterministic; *nE receives the count. Caller frees. */
Edge *WGraphEdgesByWeight(WeightedGraph g, int *nE);

/* True when some walk of zero or more edges joins v and w in g. A vertex
 * always has a path to itself, so a self-loop can never be a tree edge. */
bool WGraphHasPath(WeightedGraph g, Vertex v, Vertex w);

/* Number of connected components (undirected backend). nV == 0 gives 0. */
int WGraphNumComponents(WeightedGraph g);

#endif /* BRIDGES_C_WGRAPH_H */
