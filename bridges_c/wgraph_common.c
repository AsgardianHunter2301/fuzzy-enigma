/*
 * wgraph_common.c - implementation of the weighted-graph helper API declared in
 * wgraph.h (finding BRG-05: these helpers and types were assumed by the
 * Dijkstra, Kruskal and Prim bridges but existed nowhere in the repository).
 *
 * SOURCE LABEL: SUPPLEMENTAL ADAPTER (authored for the remediation).
 *
 * This translation unit is backend-independent. It calls the weighted Graph API
 * that every bundled weighted variant declares, and exactly one backend
 * translation unit (wgraph_undirected_adjlist.c or wgraph_directed_adjlist.c)
 * supplies those definitions at link time.
 */
#include "wgraph.h"

#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

/* The supplied implementation files are not accompanied by a header, so the
 * backend API is declared here. WeightedGraph is the same type as the backend's
 * own `Graph` typedef (struct graph *), so these declarations match exactly. */
WeightedGraph GraphNew(int nV);
void GraphFree(WeightedGraph g);
int GraphNumVertices(WeightedGraph g);
int GraphNumEdges(WeightedGraph g);
bool GraphIsAdjacent(WeightedGraph g, Vertex v, Vertex w);
Weight GraphGetWeight(WeightedGraph g, Vertex v, Vertex w);
void GraphInsertEdge(WeightedGraph g, Vertex v, Vertex w, Weight weight);
void GraphRemoveEdge(WeightedGraph g, Vertex v, Vertex w);

static void fail(const char *message) {
    fprintf(stderr, "error: %s\n", message);
    exit(EXIT_FAILURE);
}

static void *checkedMalloc(size_t bytes) {
    void *p = malloc(bytes == 0 ? 1 : bytes);
    if (p == NULL) {
        fail("out of memory");
    }
    return p;
}

WeightedGraph WGraphNew(int nV) {
    if (nV < 0) {
        fail("WGraphNew: nV must be non-negative");
    }
    return GraphNew(nV);
}

void WGraphFree(WeightedGraph g) {
    GraphFree(g);
}

int WGraphNumVertices(WeightedGraph g) {
    return GraphNumVertices(g);
}

int WGraphNumEdges(WeightedGraph g) {
    return GraphNumEdges(g);
}

bool WGraphIsAdjacent(WeightedGraph g, Vertex v, Vertex w) {
    return GraphIsAdjacent(g, v, w);
}

void WGraphInsertEdge(WeightedGraph g, Vertex v, Vertex w, Weight weight) {
    /* Declared weight domain: finite and non-negative. The sentinel
     * WGRAPH_NO_EDGE is infinite, so it can never be stored as a real weight
     * and can never be confused with one. */
    if (!isfinite(weight) || weight < 0.0) {
        fail("WGraphInsertEdge: weight must be finite and non-negative");
    }
    GraphInsertEdge(g, v, w, weight);
}

void WGraphRemoveEdge(WeightedGraph g, Vertex v, Vertex w) {
    GraphRemoveEdge(g, v, w);
}

bool WGraphEdgeWeight(WeightedGraph g, Vertex v, Vertex w, Weight *out) {
    if (!GraphIsAdjacent(g, v, w)) {
        return false;
    }
    /* Only now is GraphGetWeight's precondition satisfied. */
    Weight weight = GraphGetWeight(g, v, w);
    if (out != NULL) {
        *out = weight;
    }
    return true;
}

Weight WGraphWeight(WeightedGraph g, Vertex v, Vertex w) {
    Weight weight = WGRAPH_NO_EDGE;
    if (WGraphEdgeWeight(g, v, w, &weight)) {
        return weight;
    }
    return WGRAPH_NO_EDGE;
}

static Edge *collectEdges(WeightedGraph g, int *nE) {
    int nV = GraphNumVertices(g);
    int stored = GraphNumEdges(g);
    bool undirected = WGraphIsUndirected();

    *nE = 0;
    if (stored == 0) {
        return NULL; /* a valid "no edges" answer */
    }

    Edge *edges = checkedMalloc((size_t) stored * sizeof(*edges));
    int k = 0;

    for (Vertex v = 0; v < nV; v++) {
        /* On an undirected backend each edge is stored twice but must be
         * reported once, so only the half with w >= v is walked. A self-loop
         * (v == w) is reported exactly once by the same rule. */
        for (Vertex w = undirected ? v : 0; w < nV; w++) {
            if (!GraphIsAdjacent(g, v, w)) {
                continue;
            }
            if (k >= stored) {
                free(edges);
                fail("WGraphEdges: more adjacencies than nE reports");
            }
            edges[k].v = v;
            edges[k].w = w;
            edges[k].weight = GraphGetWeight(g, v, w);
            k++;
        }
    }

    if (k != stored) {
        free(edges);
        fail("WGraphEdges: fewer adjacencies than nE reports");
    }

    *nE = k;
    return edges;
}

Edge *WGraphEdges(WeightedGraph g, int *nE) {
    return collectEdges(g, nE);
}

static int compareByWeight(const void *a, const void *b) {
    const Edge *x = a;
    const Edge *y = b;

    if (x->weight < y->weight) return -1;
    if (x->weight > y->weight) return 1;
    /* Deterministic tie-break so equal weights give a reproducible order.
     * Any minimum spanning tree is a correct answer; the fixed order only
     * makes THIS implementation's answer repeatable. */
    if (x->v != y->v) return x->v < y->v ? -1 : 1;
    if (x->w != y->w) return x->w < y->w ? -1 : 1;
    return 0;
}

Edge *WGraphEdgesByWeight(WeightedGraph g, int *nE) {
    Edge *edges = collectEdges(g, nE);
    if (edges != NULL && *nE > 1) {
        qsort(edges, (size_t) *nE, sizeof(*edges), compareByWeight);
    }
    return edges;
}

static void reachFrom(WeightedGraph g, Vertex src, bool *seen) {
    int nV = GraphNumVertices(g);
    Vertex *stack = checkedMalloc((size_t) nV * sizeof(*stack));
    int top = 0;

    stack[top++] = src;
    seen[src] = true;

    while (top > 0) {
        Vertex v = stack[--top];
        for (Vertex w = 0; w < nV; w++) {
            if (GraphIsAdjacent(g, v, w) && !seen[w]) {
                seen[w] = true;
                stack[top++] = w;
            }
        }
    }

    free(stack);
}

bool WGraphHasPath(WeightedGraph g, Vertex v, Vertex w) {
    int nV = GraphNumVertices(g);
    if (v < 0 || v >= nV || w < 0 || w >= nV) {
        fail("WGraphHasPath: vertex out of range");
    }
    if (v == w) {
        return true; /* the zero-length walk; a self-loop is never a tree edge */
    }

    bool *seen = calloc((size_t) nV, sizeof(*seen));
    if (seen == NULL) {
        fail("out of memory");
    }
    reachFrom(g, v, seen);
    bool found = seen[w];
    free(seen);
    return found;
}

int WGraphNumComponents(WeightedGraph g) {
    int nV = GraphNumVertices(g);
    if (nV == 0) {
        return 0;
    }

    bool *seen = calloc((size_t) nV, sizeof(*seen));
    if (seen == NULL) {
        fail("out of memory");
    }

    int components = 0;
    for (Vertex v = 0; v < nV; v++) {
        if (!seen[v]) {
            components++;
            reachFrom(g, v, seen);
        }
    }

    free(seen);
    return components;
}
