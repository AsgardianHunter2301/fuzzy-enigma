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
    int maxE;
    struct edge *edges;
};

struct edge {
    Vertex v;
    Vertex w;
    Weight weight;
};

static bool validVertex(Graph g, Vertex v);
static void requireGraph(Graph g);
static void requireVertex(Graph g, Vertex v);
static void requireWeight(Weight weight);
static void normalise(Vertex *v, Vertex *w);
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

Weight GraphGetWeight(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    /* Precondition: the edge must exist. edgeIndex returns -1 when it does
     * not, and -1 must never reach g->edges[i]. */
    int i = edgeIndex(g, v, w);
    if (i == -1) {
        fprintf(stderr, "error: GraphGetWeight: no edge (%d, %d)\n", v, w);
        exit(EXIT_FAILURE);
    }
    return g->edges[i].weight;
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w, Weight weight) {
    requireVertex(g, v);
    requireVertex(g, w);
    requireWeight(weight);

    normalise(&v, &w);
    int i = edgeIndex(g, v, w);
    if (i != -1) {
        g->edges[i].weight = weight;
        return;
    }
    if (g->nE == g->maxE) {
        growEdges(g);
    }

    g->edges[g->nE].v = v;
    g->edges[g->nE].w = w;
    g->edges[g->nE].weight = weight;
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

    for (int i = 0; i < g->nE; i++) {
        printf("(%d, %d, %.2f)\n",
               g->edges[i].v, g->edges[i].w,
               g->edges[i].weight);
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

static void normalise(Vertex *v, Vertex *w) {
    if (*v > *w) {
        Vertex temp = *v;
        *v = *w;
        *w = temp;
    }
}

static int edgeIndex(Graph g, Vertex v, Vertex w) {
    normalise(&v, &w);
    for (int i = 0; i < g->nE; i++) {
        if (g->edges[i].v == v && g->edges[i].w == w) {
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
