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

typedef struct graph *Graph;
typedef int Vertex;

Graph GraphNew(int nV);
void GraphFree(Graph g);
int GraphNumVertices(Graph g);
int GraphNumEdges(Graph g);
bool GraphIsAdjacent(Graph g, Vertex v, Vertex w);
void GraphInsertEdge(Graph g, Vertex v, Vertex w);
void GraphRemoveEdge(Graph g, Vertex v, Vertex w);
void GraphShow(Graph g);

struct graph {
    int nV;
    int nE;
    bool **edges;
};

static bool validVertex(Graph g, Vertex v);
static void requireGraph(Graph g);
static void requireVertex(Graph g, Vertex v);

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
    g->edges = malloc((size_t)nV * sizeof(bool *));
    if (nV > 0 && g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\n");
        exit(EXIT_FAILURE);
    }

    for (Vertex v = 0; v < nV; v++) {
        g->edges[v] = calloc((size_t)nV, sizeof(bool));
        if (g->edges[v] == NULL) {
            while (v > 0) {
                free(g->edges[--v]);
            }
            free(g->edges);
            free(g);
            fprintf(stderr, "error: out of memory\n");
            exit(EXIT_FAILURE);
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
    return g->edges[v][w];
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (g->edges[v][w]) {
        return;
    }
    g->edges[v][w] = true;
    g->nE++;
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (!g->edges[v][w]) {
        return;
    }
    g->edges[v][w] = false;
    g->nE--;
}

void GraphShow(Graph g) {
    requireGraph(g);

    for (Vertex v = 0; v < g->nV; v++) {
        printf("%2d:", v);
        for (Vertex w = 0; w < g->nV; w++) {
            if (g->edges[v][w]) {
                printf(" %d", w);
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
