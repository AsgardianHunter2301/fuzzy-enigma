/*
 * bridges_weighted.c - see bridges_weighted.h.
 *
 * SOURCE LABEL: SUPPLEMENTAL C conversion of 26T2 manual pseudocode. The
 * pseudocode is in the manual; this C is not. Learn it separately. The
 * original, incomplete bodies are preserved unmodified in original/ so the
 * correction stays identifiable.
 */
#include "bridges_weighted.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>

/* ========================================================================
 * BRG-05  Dijkstra single-source shortest paths
 * ======================================================================== */

/* CORRECTION NOTE (BRG-05): the earlier conversion declared
 *   void dijkstraSSSP(WeightedGraph g, Vertex src, int dist[], int pred[])
 * and compared WGraphWeight(g, v, w) against NO_EDGE with int arithmetic and
 * INT_MAX as infinity. None of WeightedGraph, WGraphNumVertices, WGraphWeight,
 * NO_EDGE or Edge existed anywhere in the repository, and the six bundled
 * weighted Graph variants store double weights and accept zero and fractional
 * values, so an int distance type would have silently narrowed the lesson's own
 * input domain. The distance type is now Weight (double), infinity is the
 * explicit WGRAPH_INFINITY sentinel, and the missing-edge test uses the
 * documented WGRAPH_NO_EDGE contract from wgraph.h, which never collides with a
 * real weight because every accepted weight is finite. */
void dijkstraSSSP(WeightedGraph g, Vertex src, Weight dist[], Vertex pred[]) {
    int nV = WGraphNumVertices(g);
    if (src < 0 || src >= nV) {
        fprintf(stderr, "error: dijkstraSSSP: src out of range\n");
        exit(EXIT_FAILURE);
    }

    bool *inVSet = malloc(nV * sizeof(*inVSet));
    if (inVSet == NULL) exit(EXIT_FAILURE);

    for (Vertex v = 0; v < nV; v++) {
        dist[v] = WGRAPH_INFINITY;
        pred[v] = -1;
        inVSet[v] = true;
    }
    dist[src] = 0.0;

    for (int remaining = nV; remaining > 0; remaining--) {
        Vertex v = -1;
        for (Vertex candidate = 0; candidate < nV; candidate++) {
            if (inVSet[candidate] &&
                (v == -1 || dist[candidate] < dist[v])) {
                v = candidate;
            }
        }

        /* Every vertex still in vSet is unreachable, so no edge out of them can
         * shorten anything: stop. */
        if (v == -1 || !isfinite(dist[v])) break;
        inVSet[v] = false;

        for (Vertex w = 0; w < nV; w++) {
            Weight weight = WGraphWeight(g, v, w);
            if (weight == WGRAPH_NO_EDGE || !inVSet[w]) continue;
            /* No overflow guard is needed with a double accumulator: the
             * accepted weights are finite and non-negative. */
            if (dist[v] + weight < dist[w]) {
                dist[w] = dist[v] + weight;
                pred[w] = v;
            }
        }
    }

    free(inVSet);
}

int dijkstraFindPath(const Weight dist[], const Vertex pred[], int nV,
                     Vertex src, Vertex dest, Vertex path[]) {
    if (src < 0 || src >= nV || dest < 0 || dest >= nV) return -1;
    if (dist[src] != 0.0 || pred[src] != -1) return -1;  /* not this src */
    if (!isfinite(dist[dest])) return 0;                 /* unreachable */

    int length = 0;
    Vertex v = dest;
    while (v != src) {
        if (length >= nV) return -1;        /* malformed: no path is invented */
        path[length++] = v;
        Vertex p = pred[v];
        if (p < 0 || p >= nV) return -1;
        v = p;
    }
    path[length++] = src;

    for (int i = 0, j = length - 1; i < j; i++, j--) {
        Vertex t = path[i];
        path[i] = path[j];
        path[j] = t;
    }
    return length;
}

/* ========================================================================
 * BRG-03 / BRG-04  Minimum spanning tree result contract
 * ======================================================================== */

const char *MstStatusName(MstStatus status) {
    return status == MST_SPANNING_TREE ? "spanning tree"
                                       : "no spanning tree (forest)";
}

void MstResultFree(MstResult *result) {
    if (result == NULL) return;
    WGraphFree(result->tree);
    result->tree = NULL;
    result->nEdges = 0;
    result->nComponents = 0;
    result->totalWeight = 0.0;
    result->status = MST_NO_SPANNING_TREE;
}

/* Decide the explicit outcome from the finished tree. A one-vertex graph has a
 * spanning tree with zero edges and total weight 0.0 - the singleton case is
 * implemented, not excluded. A graph with no vertices has nothing to span, so
 * it is reported as no spanning tree rather than as a vacuous success. */
static MstResult finishMst(WeightedGraph tree, int nV, int nEdges,
                           Weight totalWeight) {
    MstResult result;
    result.tree = tree;
    result.nVertices = nV;
    result.nEdges = nEdges;
    result.nComponents = WGraphNumComponents(tree);
    result.totalWeight = totalWeight;
    result.status = (nV >= 1 && result.nComponents == 1)
                        ? MST_SPANNING_TREE
                        : MST_NO_SPANNING_TREE;

    if (result.status == MST_SPANNING_TREE && nEdges != nV - 1) {
        fprintf(stderr,
                "error: MST invariant: a spanning tree needs nV-1 edges\n");
        exit(EXIT_FAILURE);
    }
    return result;
}

/* An MST is only defined for an undirected graph, so the bridge states which
 * backend it needs instead of guessing. */
static void requireUndirected(const char *who) {
    if (!WGraphIsUndirected()) {
        fprintf(stderr,
                "error: %s needs an undirected weighted backend; "
                "this program linked %s\n",
                who, WGraphBackendName());
        exit(EXIT_FAILURE);
    }
}

/* CORRECTION NOTE (BRG-03): the earlier conversion returned `Graph mst`
 * unconditionally. For three vertices and one edge it returned a one-edge graph
 * with no failure status, which a caller cannot tell from a real spanning tree,
 * while the lesson beside it reported no MST. It also depended on
 * WGraphEdgesByWeight, Edge, GraphHasPath, GraphNew, GraphInsertEdge and
 * GraphNumEdges, none of which existed. The result is now an MstResult that
 * states the outcome, the component count, the edge count and the total weight,
 * and names the caller's cleanup entry point. The tree keeps its weights, so a
 * caller can re-derive the total independently. */
MstResult kruskalMst(WeightedGraph g) {
    requireUndirected("kruskalMst");

    int nV = WGraphNumVertices(g);
    int nE = 0;
    Edge *sortedEdges = WGraphEdgesByWeight(g, &nE);
    WeightedGraph mst = WGraphNew(nV);
    Weight totalWeight = 0.0;
    int treeEdges = 0;

    for (int i = 0; i < nE; i++) {
        Edge e = sortedEdges[i];
        /* A self-loop is rejected here: a vertex always has a path to itself. */
        if (!WGraphHasPath(mst, e.v, e.w)) {
            WGraphInsertEdge(mst, e.v, e.w, e.weight);
            totalWeight += e.weight;
            treeEdges++;
            if (treeEdges == nV - 1) break;
        }
    }

    free(sortedEdges);
    return finishMst(mst, nV, treeEdges, totalWeight);
}

/* CORRECTION NOTE (BRG-04): the earlier conversion did
 * `if (best == -1) break;  // graph is disconnected` and then returned the
 * partial graph with no failure status, so a disconnected input produced
 * something that looked like a successful MST. The loop is unchanged; what it
 * returns is now an explicit MstResult, and the partial outcome is named a
 * forest. Note the shape of Prim's forest: it grows only from vertex 0, so on a
 * disconnected graph the other components stay empty. Kruskal's forest covers
 * every component. The missing WGraphEdges/Edge dependencies are supplied by
 * wgraph.h. The nV == 0 guard is new: the original wrote usedV[0] before any
 * bounds check, which is out of bounds for a graph with no vertices. */
MstResult primMst(WeightedGraph g) {
    requireUndirected("primMst");

    int nV = WGraphNumVertices(g);
    if (nV == 0) {
        return finishMst(WGraphNew(0), 0, 0, 0.0);
    }

    int nE = 0;
    Edge *unusedE = WGraphEdges(g, &nE);
    bool *usedV = calloc(nV, sizeof(*usedV));
    if (usedV == NULL) exit(EXIT_FAILURE);

    WeightedGraph mst = WGraphNew(nV);
    Weight totalWeight = 0.0;
    int treeEdges = 0;
    usedV[0] = true;
    int usedCount = 1;

    while (usedCount < nV) {
        int best = -1;
        for (int i = 0; i < nE; i++) {
            Vertex s = unusedE[i].v;
            Vertex t = unusedE[i].w;
            /* A self-loop never crosses the cut, so it is never chosen. */
            bool crosses = usedV[s] != usedV[t];
            if (crosses &&
                (best == -1 || unusedE[i].weight < unusedE[best].weight)) {
                best = i;
            }
        }

        if (best == -1) break;  // no edge leaves the grown part: not spanning
        Edge e = unusedE[best];
        WGraphInsertEdge(mst, e.v, e.w, e.weight);
        totalWeight += e.weight;
        treeEdges++;
        Vertex newVertex = usedV[e.v] ? e.w : e.v;
        if (!usedV[newVertex]) {
            usedV[newVertex] = true;
            usedCount++;
        }
        unusedE[best] = unusedE[--nE];
    }

    free(unusedE);
    free(usedV);
    return finishMst(mst, nV, treeEdges, totalWeight);
}
