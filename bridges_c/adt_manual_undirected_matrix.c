/*
 * adt_manual_undirected_matrix.c - backend B.
 *
 * SOURCE LABEL: EXACT QUOTATION of the undirected adjacency-matrix Graph ADT
 * that the app displays (assets/modules-graphs.js, const SRC_GADJ, shown as
 * "Graph adjacency-matrix implementation"). The quotation below is byte
 * identical to that displayed source and to the copy embedded in the audit
 * reproduction fixture
 * commission_pkg/.../reproduce/curriculum/bridge_cycle_characterisation.c
 * (sha256 of both: 171edda980288a8c2e84766ec2f5786eb8c821b3fe1f82016359e72caeb3305c).
 *
 * NOT A STANDALONE PROGRAM. It has no main(); it is the Graph backend half of
 * an executable. The four #include lines below are NOT part of the quotation:
 * the displayed block shows the ADT without its headers, and the headers are
 * the prerequisite dependency that finding BRG-05 asks to be made explicit.
 *
 * Declared contract of this backend, read from the quoted source:
 *   undirected, unweighted, nV x nV boolean matrix, nE counts each undirected
 *   edge once, duplicate insertion is a no-op, and self-loops ARE ACCEPTED and
 *   counted - GraphInsertEdge has no `v == w` guard, so GraphNew(1) followed by
 *   GraphInsertEdge(g, 0, 0) gives nE == 1 and GraphIsAdjacent(g, 0, 0) true.
 *   This is the backend that exposes finding BRG-06.
 */

/* --- prerequisite headers (adapter, not part of the quotation) --- */
#include <assert.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

/* --- begin exact quotation of the displayed manual adjacency-matrix ADT --- */
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

Graph GraphNew(int nV) {
    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;

    g->edges = malloc(nV * sizeof(bool *));
    for (int i = 0; i < g->nV; i++) {
        g->edges[i] = calloc(nV, sizeof(bool));
    }

    return g;
}

void GraphFree(Graph g) {
    for (int i = 0; i < g->nV; i++) {
        free(g->edges[i]);
    }
    free(g->edges);
    free(g);
}

int GraphNumVertices(Graph g) {
    return g->nV;
}

int GraphNumEdges(Graph g) {
    return g->nE;
}

bool GraphIsAdjacent(Graph g, Vertex v, Vertex w) {
    assert(validVertex(g, v));
    assert(validVertex(g, w));

    return g->edges[v][w];
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w) {
    assert(validVertex(g, v));
    assert(validVertex(g, w));

    if (g->edges[v][w]) {
        return;
    }

    g->edges[v][w] = true;
    g->edges[w][v] = true;
    g->nE++;
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    assert(validVertex(g, v));
    assert(validVertex(g, w));

    if (!g->edges[v][w]) {
        return;
    }

    g->edges[v][w] = false;
    g->edges[w][v] = false;
    g->nE--;
}

void GraphShow(Graph g) {
    printf("Number of vertices: %d\n", g->nV);
    printf("Number of edges: %d\n", g->nE);
    printf("Edges:\n");
    for (int i = 0; i < g->nV; i++) {
        printf("%2d:", i);
        for (int j = 0; j < g->nV; j++) {
            if (g->edges[i][j]) {
                printf(" %d", j);
            }
        }
        printf("\n");
    }
    printf("\n");
}

static bool validVertex(Graph g, Vertex v) {
    return (v >= 0 && v < g->nV);
}
/* --- end exact quotation --- */
