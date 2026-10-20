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

#include <limits.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define INITIAL_CAPACITY 8

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
    int maxE;
    struct edge *edges;
};

struct edge {
    Vertex v;
    Vertex w;
};

static bool validVertex(Graph g, Vertex v);
static void requireGraph(Graph g);
static void requireVertex(Graph g, Vertex v);
static int edgeIndex(Graph g, Vertex v, Vertex w);
static void growEdges(Graph g);

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
    g->maxE = INITIAL_CAPACITY;
    g->edges = malloc((size_t)g->maxE * sizeof(struct edge));
    if (g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\n");
        exit(EXIT_FAILURE);
    }

    return g;
}

void GraphFree(Graph g) {
    if (g == NULL) {
        return;
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

    return edgeIndex(g, v, w) != -1;
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (v == w || GraphIsAdjacent(g, v, w)) {
        return;
    }

    if (g->nE == g->maxE) {
        growEdges(g);
    }

    g->edges[g->nE].v = v;
    g->edges[g->nE].w = w;
    g->nE++;
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    int i = edgeIndex(g, v, w);
    if (i == -1) {
        return;
    }

    for (int j = i; j < g->nE - 1; j++) {
        g->edges[j] = g->edges[j + 1];
    }
    g->nE--;
}

void GraphShow(Graph g) {
    requireGraph(g);

    printf("Number of vertices: %d\n", g->nV);
    printf("Number of edges: %d\n", g->nE);
    printf("Edges:\n");

    for (int i = 0; i < g->nE; i++) {
        printf("(%d, %d)\n", g->edges[i].v, g->edges[i].w);
    }
    printf("\n");
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

static int edgeIndex(Graph g, Vertex v, Vertex w) {
    for (int i = 0; i < g->nE; i++) {
        struct edge e = g->edges[i];
        if ((e.v == v && e.w == w) || (e.v == w && e.w == v)) {
            return i;
        }
    }
    return -1;
}

static void growEdges(Graph g) {
    if (g->maxE > INT_MAX / 2) {
        fprintf(stderr, "error: edge capacity would overflow int\n");
        exit(EXIT_FAILURE);
    }
    int newMaxE = g->maxE * 2;
    struct edge *newEdges = realloc(
        g->edges, (size_t)newMaxE * sizeof(struct edge)
    );
    if (newEdges == NULL) {
        fprintf(stderr, "error: out of memory\n");
        exit(EXIT_FAILURE);
    }

    g->edges = newEdges;
    g->maxE = newMaxE;
}
