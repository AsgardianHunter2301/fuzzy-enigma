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
    struct adjNode **edges;
};

struct adjNode {
    Vertex v;
    struct adjNode *next;
};

static bool validVertex(Graph g, Vertex v);
static void requireGraph(Graph g);
static void requireVertex(Graph g, Vertex v);
static struct adjNode *newAdjNode(Vertex v);
static struct adjNode *insertAdjNode(struct adjNode *list, Vertex v);
static struct adjNode *removeAdjNode(struct adjNode *list, Vertex v);

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
    g->edges = calloc((size_t)nV, sizeof(struct adjNode *));
    if (nV > 0 && g->edges == NULL) {
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

    for (Vertex v = 0; v < g->nV; v++) {
        struct adjNode *curr = g->edges[v];
        while (curr != NULL) {
            struct adjNode *next = curr->next;
            free(curr);
            curr = next;
        }
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

    struct adjNode *curr = g->edges[v];
    while (curr != NULL && curr->v < w) {
        curr = curr->next;
    }
    return curr != NULL && curr->v == w;
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (v == w || GraphIsAdjacent(g, v, w)) {
        return;
    }

    g->edges[v] = insertAdjNode(g->edges[v], w);
    g->edges[w] = insertAdjNode(g->edges[w], v);
    g->nE++;
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (!GraphIsAdjacent(g, v, w)) {
        return;
    }

    g->edges[v] = removeAdjNode(g->edges[v], w);
    g->edges[w] = removeAdjNode(g->edges[w], v);
    g->nE--;
}

void GraphShow(Graph g) {
    requireGraph(g);

    printf("Number of vertices: %d\n", g->nV);
    printf("Number of edges: %d\n", g->nE);
    printf("Edges:\n");

    for (Vertex v = 0; v < g->nV; v++) {
        printf("%2d:", v);
        for (struct adjNode *curr = g->edges[v];
             curr != NULL;
             curr = curr->next) {
            Vertex w = curr->v;
            printf(" %d", w);
        }
        printf("\n");
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

static struct adjNode *newAdjNode(Vertex v) {
    struct adjNode *new = malloc(sizeof(struct adjNode));
    if (new == NULL) {
        fprintf(stderr, "error: out of memory\n");
        exit(EXIT_FAILURE);
    }

    new->v = v;
    new->next = NULL;
    return new;
}

static struct adjNode *insertAdjNode(struct adjNode *list, Vertex v) {
    struct adjNode *new = newAdjNode(v);

    if (list == NULL || v < list->v) {
        new->next = list;
        return new;
    }

    struct adjNode *curr = list;
    while (curr->next != NULL && curr->next->v < v) {
        curr = curr->next;
    }

    new->next = curr->next;
    curr->next = new;
    return list;
}

static struct adjNode *removeAdjNode(struct adjNode *list, Vertex v) {
    if (list == NULL) {
        return NULL;
    }

    if (list->v == v) {
        struct adjNode *newHead = list->next;
        free(list);
        return newHead;
    }

    struct adjNode *curr = list;
    while (curr->next != NULL && curr->next->v != v) {
        curr = curr->next;
    }

    if (curr->next != NULL) {
        struct adjNode *old = curr->next;
        curr->next = old->next;
        free(old);
    }

    return list;
}
