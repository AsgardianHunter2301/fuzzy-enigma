/*
 * Supplemental study implementation - NOT course source.
 *
 * One of eleven alternative Graph ADTs in this directory. They all declare the
 * same API, so exactly one is compiled at a time together with a driver:
 *   gcc -std=c11 -DSOURCE_FILE='"<this file>"' drivers/graph_driver.c -o demo
 * Per-variant contract, invariants, nE meaning and complexity:
 *   docs/C_LIBRARY_MATRIX.md
 * Learning path and source status: MEMORISE_GRAPH_C_GUIDE.md
 *
 * Public preconditions (valid graph, vertex in 0..nV-1, non-negative weight,
 * existing edge for GraphGetWeight) are enforced unconditionally, so -DNDEBUG
 * does not change this file's behaviour.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define NO_EDGE (-1.0)

typedef struct graph *Graph;
typedef int Vertex;
typedef double Weight;

Graph GraphNew(int nV);
void GraphFree(Graph g);
int GraphNumVertices(Graph g);
int GraphNumEdges(Graph g);
bool GraphIsAdjacent(Graph g, Vertex v, Vertex w);
Weight GraphGetWeight(Graph g, Vertex v, Vertex w);
void GraphInsertEdge(Graph g, Vertex v, Vertex w, Weight weight);
void GraphRemoveEdge(Graph g, Vertex v, Vertex w);
void GraphShow(Graph g);

struct graph {
    int nV;
    int nE;
    Weight **edges;
};

static bool validVertex(Graph g, Vertex v);
static void requireGraph(Graph g);
static void requireVertex(Graph g, Vertex v);
static void requireWeight(Weight weight);

Graph GraphNew(int nV) {
    if (nV < 0) {
        fprintf(stderr, "error: GraphNew: nV must be non-negative\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->edges = malloc((size_t)nV * sizeof(Weight *));
    if (nV > 0 && g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\n");
        exit(EXIT_FAILURE);
    }

    for (Vertex v = 0; v < nV; v++) {
        g->edges[v] = malloc((size_t)nV * sizeof(Weight));
        if (g->edges[v] == NULL) {
            while (v > 0) {
                free(g->edges[--v]);
            }
            free(g->edges);
            free(g);
            fprintf(stderr, "error: out of memory\n");
            exit(EXIT_FAILURE);
        }
        for (Vertex w = 0; w < nV; w++) {
            g->edges[v][w] = NO_EDGE;
        }
    }

    return g;
}

void GraphFree(Graph g) {
    if (g == NULL) {
        return;
    }
    for (Vertex v = 0; v < g->nV; v++) {
        free(g->edges[v]);
    }
    free(g->edges);
    free(g);
}

int GraphNumVertices(Graph g) {
    requireGraph(g);
    return g->nV;
}

int GraphNumEdges(Graph g) {
    requireGraph(g);
    return g->nE;
}

bool GraphIsAdjacent(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);
    return g->edges[v][w] != NO_EDGE;
}

Weight GraphGetWeight(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    /* Precondition: the edge must exist. NO_EDGE is a storage sentinel, never
     * a weight, so it is never handed back to a caller. */
    if (g->edges[v][w] == NO_EDGE) {
        fprintf(stderr, "error: GraphGetWeight: no edge (%d, %d)\n", v, w);
        exit(EXIT_FAILURE);
    }
    return g->edges[v][w];
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w, Weight weight) {
    requireVertex(g, v);
    requireVertex(g, w);
    requireWeight(weight);

    if (!GraphIsAdjacent(g, v, w)) {
        g->nE++;
    }
    g->edges[v][w] = weight;
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (!GraphIsAdjacent(g, v, w)) {
        return;
    }
    g->edges[v][w] = NO_EDGE;
    g->nE--;
}

void GraphShow(Graph g) {
    requireGraph(g);

    for (Vertex v = 0; v < g->nV; v++) {
        printf("%2d:", v);
        for (Vertex w = 0; w < g->nV; w++) {
            if (g->edges[v][w] != NO_EDGE) {
                Weight weight = g->edges[v][w];
                printf(" %d(%.2f)", w, weight);
            }
        }
        printf("\n");
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static void requireWeight(Weight weight) {
    /* !(weight >= 0.0) also rejects NaN, matching the accepted domain. */
    if (!(weight >= 0.0)) {
        fprintf(stderr, "error: weight must be non-negative\n");
        exit(EXIT_FAILURE);
    }
}
