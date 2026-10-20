const SRC_GADJLIST_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * This complete C implementation is NOT supplied in the COMP2521 26T2
 * Data Structures and Algorithms Manual and is NOT supplied as complete
 * operation code in the attached COMP2521 25T3 graph-introduction lecture.
 *
 * It is a course-consistent study bridge built from:
 *   - the lecture Graph ADT interface;
 *   - the lecture adjacency-list concrete representation; and
 *   - the simple, undirected, unweighted graph model used in that lecture.
 *
 * Study assumption: neighbour lists are kept in ascending vertex order.
 * Understand the representation invariant and pointer-update pattern; do not
 * describe this file as verbatim manual or lecture code.
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
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->edges = calloc((size_t)nV, sizeof(struct adjNode *));
    if (nV > 0 && g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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

    printf("Number of vertices: %d\\n", g->nV);
    printf("Number of edges: %d\\n", g->nE);
    printf("Edges:\\n");

    for (Vertex v = 0; v < g->nV; v++) {
        printf("%2d:", v);
        for (struct adjNode *curr = g->edges[v];
             curr != NULL;
             curr = curr->next) {
            Vertex w = curr->v;
            printf(" %d", w);
        }
        printf("\\n");
    }
    printf("\\n");
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static struct adjNode *newAdjNode(Vertex v) {
    struct adjNode *new = malloc(sizeof(struct adjNode));
    if (new == NULL) {
        fprintf(stderr, "error: out of memory\\n");
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
}`;
const LGL = lines(SRC_GADJLIST_MEM, {
  graphAlloc:'Graph g = malloc(sizeof(struct graph));',
  headsAlloc:'g->edges = calloc((size_t)nV, sizeof(struct adjNode *));',
  graphReturn:'return g;',
  freeOuter:'for (Vertex v = 0; v < g->nV; v++) {',
  freeNode:'free(curr);',
  freeHeads:'free(g->edges);',
  freeGraph:['free(g);',2],
  adjacentCurr:['struct adjNode *curr = g->edges[v];',2],
  adjacentLoop:'while (curr != NULL && curr->v < w) {',
  adjacentReturn:'return curr != NULL && curr->v == w;',
  insertGuard:'if (v == w || GraphIsAdjacent(g, v, w)) {',
  insertForward:'g->edges[v] = insertAdjNode(g->edges[v], w);',
  insertReverse:'g->edges[w] = insertAdjNode(g->edges[w], v);',
  increment:'g->nE++;',
  removeGuard:'if (!GraphIsAdjacent(g, v, w)) {',
  removeForward:'g->edges[v] = removeAdjNode(g->edges[v], w);',
  removeReverse:'g->edges[w] = removeAdjNode(g->edges[w], v);',
  decrement:'g->nE--;',
  showLoop:'for (struct adjNode *curr = g->edges[v];',
  newNode:'struct adjNode *new = malloc(sizeof(struct adjNode));',
  newNext:'new->next = NULL;',
  insertHead:'new->next = list;',
  insertLink:'curr->next = new;',
  removeHead:'struct adjNode *newHead = list->next;',
  unlink:'curr->next = old->next;',
  freeOld:'free(old);'
});

const SRC_GEDGEARRAY_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * This complete C implementation is NOT supplied in the COMP2521 26T2
 * Data Structures and Algorithms Manual and is NOT supplied as complete
 * operation code in the attached COMP2521 25T3 graph-introduction lecture.
 *
 * It is a course-consistent study bridge built from:
 *   - the lecture Graph ADT interface;
 *   - the lecture array-of-edges concrete representation; and
 *   - the simple, undirected, unweighted graph model used in that lecture.
 *
 * The lecture shows maxE in the representation but does not prescribe a
 * growth rule. INITIAL_CAPACITY = 8 and doubling by realloc are explicit
 * supplemental choices made by this learning tool.
 *
 * Understand the representation invariant, linear scan, compaction and resize
 * pattern; do not describe this file as verbatim manual or lecture code.
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
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->maxE = INITIAL_CAPACITY;
    g->edges = malloc((size_t)g->maxE * sizeof(struct edge));
    if (g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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

    printf("Number of vertices: %d\\n", g->nV);
    printf("Number of edges: %d\\n", g->nE);
    printf("Edges:\\n");

    for (int i = 0; i < g->nE; i++) {
        printf("(%d, %d)\\n", g->edges[i].v, g->edges[i].w);
    }
    printf("\\n");
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
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
        fprintf(stderr, "error: edge capacity would overflow int\\n");
        exit(EXIT_FAILURE);
    }
    int newMaxE = g->maxE * 2;
    struct edge *newEdges = realloc(
        g->edges, (size_t)newMaxE * sizeof(struct edge)
    );
    if (newEdges == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->edges = newEdges;
    g->maxE = newMaxE;
}`;
const LGE = lines(SRC_GEDGEARRAY_MEM, {
  graphAlloc:'Graph g = malloc(sizeof(struct graph));',
  capacity:'g->maxE = INITIAL_CAPACITY;',
  arrayAlloc:'g->edges = malloc((size_t)g->maxE * sizeof(struct edge));',
  graphReturn:'return g;',
  freeArray:'free(g->edges);',
  freeGraph:['free(g);',2],
  adjacentReturn:'return edgeIndex(g, v, w) != -1;',
  insertGuard:'if (v == w || GraphIsAdjacent(g, v, w)) {',
  growCall:'growEdges(g);',
  appendV:'g->edges[g->nE].v = v;',
  appendW:'g->edges[g->nE].w = w;',
  increment:'g->nE++;',
  removeIndex:'int i = edgeIndex(g, v, w);',
  shift:'g->edges[j] = g->edges[j + 1];',
  decrement:'g->nE--;',
  showLoop:['for (int i = 0; i < g->nE; i++) {',1],
  edgeScan:['for (int i = 0; i < g->nE; i++) {',2],
  realloc:'struct edge *newEdges = realloc(',
  setArray:'g->edges = newEdges;',
  setCapacity:'g->maxE = newMaxE;'
});

const SRC_GMATRIX_DW_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * NOT verbatim manual or lecture code. The lecture says a weighted adjacency
 * matrix stores a weight in each cell and needs a no-edge value. This study
 * implementation uses -1.0 as NO_EDGE and therefore assumes non-negative
 * edge weights, matching the Dijkstra precondition taught in the course.
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
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->edges = malloc((size_t)nV * sizeof(Weight *));
    if (nV > 0 && g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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
            fprintf(stderr, "error: out of memory\\n");
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
        fprintf(stderr, "error: GraphGetWeight: no edge (%d, %d)\\n", v, w);
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
        printf("\\n");
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static void requireWeight(Weight weight) {
    /* !(weight >= 0.0) also rejects NaN, matching the accepted domain. */
    if (!(weight >= 0.0)) {
        fprintf(stderr, "error: weight must be non-negative\\n");
        exit(EXIT_FAILURE);
    }
}`;
const LGMW = lines(SRC_GMATRIX_DW_MEM, {
  graphAlloc:'Graph g = malloc(sizeof(struct graph));',
  rowsAlloc:'g->edges = malloc((size_t)nV * sizeof(Weight *));',
  rowAlloc:'g->edges[v] = malloc((size_t)nV * sizeof(Weight));',
  noEdge:'g->edges[v][w] = NO_EDGE;',
  adjacent:'return g->edges[v][w] != NO_EDGE;',
  insert:'g->edges[v][w] = weight;',
  remove:'g->edges[v][w] = NO_EDGE;',
  showLoop:'for (Vertex w = 0; w < g->nV; w++) {',
  freeRow:'free(g->edges[v]);',
  freeRows:'free(g->edges);',
  freeGraph:['free(g);',3]
});

const SRC_GADJLIST_DW_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * NOT verbatim manual or lecture code. The lecture states that directed
 * graphs use the same three representations and that a weighted adjacency
 * list adds a weight to each list node. This complete directed, weighted
 * implementation is the learning tool's explicit study bridge.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

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
    struct adjNode **edges;
};

struct adjNode {
    Vertex v;
    Weight weight;
    struct adjNode *next;
};

static bool validVertex(Graph g, Vertex v);
static void requireGraph(Graph g);
static void requireVertex(Graph g, Vertex v);
static void requireWeight(Weight weight);
static struct adjNode *newAdjNode(Vertex v, Weight weight);
static struct adjNode *findAdjNode(struct adjNode *list, Vertex v);
static struct adjNode *insertAdjNode(
    struct adjNode *list, Vertex v, Weight weight
);
static struct adjNode *removeAdjNode(struct adjNode *list, Vertex v);

Graph GraphNew(int nV) {
    if (nV < 0) {
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }
    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
    g->nV = nV;
    g->nE = 0;
    g->edges = calloc((size_t)nV, sizeof(struct adjNode *));
    if (nV > 0 && g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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
    return findAdjNode(g->edges[v], w) != NULL;
}

Weight GraphGetWeight(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);
    /* Precondition: the edge must exist. */
    struct adjNode *node = findAdjNode(g->edges[v], w);
    if (node == NULL) {
        fprintf(stderr, "error: GraphGetWeight: no edge (%d, %d)\\n", v, w);
        exit(EXIT_FAILURE);
    }
    return node->weight;
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w, Weight weight) {
    requireVertex(g, v);
    requireVertex(g, w);
    requireWeight(weight);

    struct adjNode *node = findAdjNode(g->edges[v], w);
    if (node != NULL) {
        node->weight = weight;
        return;
    }

    g->edges[v] = insertAdjNode(g->edges[v], w, weight);
    g->nE++;
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (!GraphIsAdjacent(g, v, w)) {
        return;
    }
    g->edges[v] = removeAdjNode(g->edges[v], w);
    g->nE--;
}

void GraphShow(Graph g) {
    requireGraph(g);

    for (Vertex v = 0; v < g->nV; v++) {
        printf("%2d:", v);
        for (struct adjNode *curr = g->edges[v];
             curr != NULL;
             curr = curr->next) {
            Vertex w = curr->v;
            Weight weight = curr->weight;
            printf(" %d(%.2f)", w, weight);
        }
        printf("\\n");
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static void requireWeight(Weight weight) {
    /* !(weight >= 0.0) also rejects NaN, matching the accepted domain. */
    if (!(weight >= 0.0)) {
        fprintf(stderr, "error: weight must be non-negative\\n");
        exit(EXIT_FAILURE);
    }
}

static struct adjNode *newAdjNode(Vertex v, Weight weight) {
    struct adjNode *new = malloc(sizeof(struct adjNode));
    if (new == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
    new->v = v;
    new->weight = weight;
    new->next = NULL;
    return new;
}

static struct adjNode *findAdjNode(struct adjNode *list, Vertex v) {
    struct adjNode *curr = list;
    while (curr != NULL && curr->v < v) {
        curr = curr->next;
    }
    return curr != NULL && curr->v == v ? curr : NULL;
}

static struct adjNode *insertAdjNode(
    struct adjNode *list, Vertex v, Weight weight
) {
    struct adjNode *new = newAdjNode(v, weight);
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
}`;
const LGLW = lines(SRC_GADJLIST_DW_MEM, {
  graphAlloc:'Graph g = malloc(sizeof(struct graph));',
  headsAlloc:'g->edges = calloc((size_t)nV, sizeof(struct adjNode *));',
  graphReturn:'return g;',
  freeOuter:'for (Vertex v = 0; v < g->nV; v++) {',
  freeNode:'free(curr);',
  freeHeads:'free(g->edges);',
  freeGraph:['free(g);',2],
  adjacentReturn:'return findAdjNode(g->edges[v], w) != NULL;',
  findLoop:'while (curr != NULL && curr->v < v) {',
  update:'node->weight = weight;',
  insertForward:'g->edges[v] = insertAdjNode(g->edges[v], w, weight);',
  increment:'g->nE++;',
  removeGuard:'if (!GraphIsAdjacent(g, v, w)) {',
  removeForward:'g->edges[v] = removeAdjNode(g->edges[v], w);',
  decrement:'g->nE--;',
  showLoop:'for (struct adjNode *curr = g->edges[v];',
  newNode:'struct adjNode *new = malloc(sizeof(struct adjNode));',
  insertHead:'new->next = list;',
  insertLink:'curr->next = new;',
  unlink:'curr->next = old->next;',
  freeOld:'free(old);'
});

const SRC_GEDGEARRAY_DW_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * NOT verbatim manual or lecture code. The lecture states that directed
 * graphs use the same three representations and that a weighted edge array
 * adds a weight to each edge. This complete directed, weighted implementation
 * is the learning tool's explicit study bridge.
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
static int edgeIndex(Graph g, Vertex v, Vertex w);
static void growEdges(Graph g);

Graph GraphNew(int nV) {
    if (nV < 0) {
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }
    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
    g->nV = nV;
    g->nE = 0;
    g->maxE = INITIAL_CAPACITY;
    g->edges = malloc((size_t)g->maxE * sizeof(struct edge));
    if (g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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
        fprintf(stderr, "error: GraphGetWeight: no edge (%d, %d)\\n", v, w);
        exit(EXIT_FAILURE);
    }
    return g->edges[i].weight;
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w, Weight weight) {
    requireVertex(g, v);
    requireVertex(g, w);
    requireWeight(weight);

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
        struct edge e = g->edges[i];
        printf("(%d, %d, %.2f)\\n", e.v, e.w, e.weight);
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static void requireWeight(Weight weight) {
    /* !(weight >= 0.0) also rejects NaN, matching the accepted domain. */
    if (!(weight >= 0.0)) {
        fprintf(stderr, "error: weight must be non-negative\\n");
        exit(EXIT_FAILURE);
    }
}

static int edgeIndex(Graph g, Vertex v, Vertex w) {
    for (int i = 0; i < g->nE; i++) {
        if (g->edges[i].v == v && g->edges[i].w == w) {
            return i;
        }
    }
    return -1;
}

static void growEdges(Graph g) {
    if (g->maxE > INT_MAX / 2) {
        fprintf(stderr, "error: edge capacity would overflow int\\n");
        exit(EXIT_FAILURE);
    }
    int newMaxE = g->maxE * 2;
    struct edge *newEdges = realloc(
        g->edges, (size_t)newMaxE * sizeof(struct edge)
    );
    if (newEdges == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
    g->edges = newEdges;
    g->maxE = newMaxE;
}`;
const LGEW = lines(SRC_GEDGEARRAY_DW_MEM, {
  graphAlloc:'Graph g = malloc(sizeof(struct graph));',
  capacity:'g->maxE = INITIAL_CAPACITY;',
  arrayAlloc:'g->edges = malloc((size_t)g->maxE * sizeof(struct edge));',
  graphReturn:'return g;',
  freeArray:'free(g->edges);',
  freeGraph:['free(g);',2],
  adjacentReturn:'return edgeIndex(g, v, w) != -1;',
  update:'g->edges[i].weight = weight;',
  growCall:'growEdges(g);',
  appendV:'g->edges[g->nE].v = v;',
  appendW:'g->edges[g->nE].w = w;',
  appendWeight:'g->edges[g->nE].weight = weight;',
  increment:'g->nE++;',
  removeIndex:['int i = edgeIndex(g, v, w);',3],
  shift:'g->edges[j] = g->edges[j + 1];',
  decrement:'g->nE--;',
  showLoop:['for (int i = 0; i < g->nE; i++) {',1],
  edgeScan:['for (int i = 0; i < g->nE; i++) {',2],
  realloc:'struct edge *newEdges = realloc(',
  setArray:'g->edges = newEdges;',
  setCapacity:'g->maxE = newMaxE;'
});

/* ---------- complete graph mode × representation study set ---------- */
const SRC_GMATRIX_DU_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * This complete C implementation is NOT supplied in the COMP2521 26T2
 * Data Structures and Algorithms Manual and is NOT supplied as complete
 * operation code in the attached COMP2521 25T3 directed-graphs lecture.
 *
 * It is a course-consistent study bridge obtained by applying the lecture's
 * directed-edge rule to the manual's adjacency-matrix control flow.
 *
 * Mode: directed and unweighted. One arc writes one matrix cell. Loops are
 * allowed and duplicate arcs do not increase nE.
 *
 * Understand the row-scan and one-direction update pattern; do not describe
 * this file as verbatim manual or lecture code.
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
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->edges = malloc((size_t)nV * sizeof(bool *));
    if (nV > 0 && g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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
            fprintf(stderr, "error: out of memory\\n");
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
        printf("\\n");
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}`;
const LGMATRIX_DU = {"graphAlloc":46,"insert":103,"remove":114,"show":125};
const SRC_GMATRIX_UW_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * This complete C implementation is NOT supplied in the COMP2521 26T2
 * Data Structures and Algorithms Manual and is NOT supplied as complete
 * operation code in the attached COMP2521 25T3 weighted-graphs lecture.
 *
 * It is a course-consistent study bridge obtained by applying the lecture's
 * weighted-cell rule to the manual's undirected adjacency-matrix control flow.
 *
 * Supplemental choice: NO_EDGE is -1.0, so stored weights are non-negative.
 * A non-loop undirected edge writes symmetric cells but increments nE once.
 *
 * Understand the sentinel, symmetry and count invariant; do not describe this
 * file as verbatim manual or lecture code.
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
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->edges = malloc((size_t)nV * sizeof(Weight *));
    if (nV > 0 && g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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
            fprintf(stderr, "error: out of memory\\n");
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
        fprintf(stderr, "error: GraphGetWeight: no edge (%d, %d)\\n", v, w);
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
    if (v != w) {
        g->edges[w][v] = weight;
    }
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (!GraphIsAdjacent(g, v, w)) {
        return;
    }
    g->edges[v][w] = NO_EDGE;
    if (v != w) {
        g->edges[w][v] = NO_EDGE;
    }
    g->nE--;
}

void GraphShow(Graph g) {
    requireGraph(g);

    for (Vertex v = 0; v < g->nV; v++) {
        printf("%2d:", v);
        for (Vertex w = 0; w < g->nV; w++) {
            if (g->edges[v][w] != NO_EDGE) {
                printf(" %d(%.2f)", w, g->edges[v][w]);
            }
        }
        printf("\\n");
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static void requireWeight(Weight weight) {
    /* !(weight >= 0.0) also rejects NaN, matching the accepted domain. */
    if (!(weight >= 0.0)) {
        fprintf(stderr, "error: weight must be non-negative\\n");
        exit(EXIT_FAILURE);
    }
}`;
const LGMATRIX_UW = {"graphAlloc":50,"insert":115,"remove":129,"show":143};
const SRC_GADJLIST_DU_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * This complete C implementation is NOT supplied in the COMP2521 26T2
 * Data Structures and Algorithms Manual and is NOT supplied as complete
 * operation code in the attached COMP2521 25T3 directed-graphs lecture.
 *
 * It is a course-consistent study bridge built from the lecture Graph ADT,
 * the lecture adjacency-list structure and the directed-edge rule.
 *
 * Study assumption: outgoing-neighbour lists are kept in ascending vertex
 * order. One node stores one arc; loops are allowed; duplicate arcs are not.
 * Understand the one-way pointer-update pattern and do not describe this file
 * as verbatim manual or lecture code.
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
static struct adjNode *findAdjNode(struct adjNode *list, Vertex v);
static struct adjNode *insertAdjNode(struct adjNode *list, Vertex v);
static struct adjNode *removeAdjNode(struct adjNode *list, Vertex v);

Graph GraphNew(int nV) {
    if (nV < 0) {
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->edges = calloc((size_t)nV, sizeof(struct adjNode *));
    if (nV > 0 && g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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
    return findAdjNode(g->edges[v], w) != NULL;
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (GraphIsAdjacent(g, v, w)) {
        return;
    }
    g->edges[v] = insertAdjNode(g->edges[v], w);
    g->nE++;
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (!GraphIsAdjacent(g, v, w)) {
        return;
    }
    g->edges[v] = removeAdjNode(g->edges[v], w);
    g->nE--;
}

void GraphShow(Graph g) {
    requireGraph(g);

    for (Vertex v = 0; v < g->nV; v++) {
        printf("%2d:", v);
        for (struct adjNode *curr = g->edges[v];
             curr != NULL;
             curr = curr->next) {
            printf(" %d", curr->v);
        }
        printf("\\n");
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static struct adjNode *newAdjNode(Vertex v) {
    struct adjNode *new = malloc(sizeof(struct adjNode));
    if (new == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
    new->v = v;
    new->next = NULL;
    return new;
}

static struct adjNode *findAdjNode(struct adjNode *list, Vertex v) {
    struct adjNode *curr = list;
    while (curr != NULL && curr->v < v) {
        curr = curr->next;
    }
    return curr != NULL && curr->v == v ? curr : NULL;
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
}`;
const LGADJLIST_DU = {"graphAlloc":54,"headsAlloc":62,"graphReturn":69,"freeOuter":77,"freeNode":81,"freeHeads":86,"freeGraph":87,"adjacentCurr":0,"adjacentLoop":0,"adjacentReturn":101,"insertGuard":108,"update":104,"insertForward":111,"insertReverse":0,"increment":112,"removeGuard":119,"removeForward":122,"removeReverse":0,"decrement":123,"showLoop":129,"newNode":143,"newNext":149,"insertHead":164,"insertLink":173,"removeHead":182,"unlink":193,"freeOld":194};
const SRC_GADJLIST_UW_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * This complete C implementation is NOT supplied in the COMP2521 26T2
 * Data Structures and Algorithms Manual and is NOT supplied as complete
 * operation code in the attached COMP2521 25T3 weighted-graphs lecture.
 *
 * It is a course-consistent study bridge built from the lecture Graph ADT,
 * the lecture adjacency-list structure and the weighted-edge rule.
 *
 * Study assumptions: neighbour lists are kept in ascending vertex order;
 * a non-loop undirected edge uses two nodes but increments nE once; loops
 * use one node; inserting an existing edge replaces its weight.
 * Understand the symmetry, weight-update and pointer-update invariants; do not
 * describe this file as verbatim manual or lecture code.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

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
    struct adjNode **edges;
};

struct adjNode {
    Vertex v;
    Weight weight;
    struct adjNode *next;
};

static bool validVertex(Graph g, Vertex v);
static void requireGraph(Graph g);
static void requireVertex(Graph g, Vertex v);
static void requireWeight(Weight weight);
static struct adjNode *newAdjNode(Vertex v, Weight weight);
static struct adjNode *findAdjNode(struct adjNode *list, Vertex v);
static struct adjNode *insertAdjNode(
    struct adjNode *list, Vertex v, Weight weight
);
static struct adjNode *removeAdjNode(struct adjNode *list, Vertex v);

Graph GraphNew(int nV) {
    if (nV < 0) {
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->edges = calloc((size_t)nV, sizeof(struct adjNode *));
    if (nV > 0 && g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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
    return findAdjNode(g->edges[v], w) != NULL;
}

Weight GraphGetWeight(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    /* Precondition: the edge must exist. */
    struct adjNode *node = findAdjNode(g->edges[v], w);
    if (node == NULL) {
        fprintf(stderr, "error: GraphGetWeight: no edge (%d, %d)\\n", v, w);
        exit(EXIT_FAILURE);
    }
    return node->weight;
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w, Weight weight) {
    requireVertex(g, v);
    requireVertex(g, w);
    requireWeight(weight);

    struct adjNode *node = findAdjNode(g->edges[v], w);
    if (node != NULL) {
        node->weight = weight;
        if (v != w) {
            /* Symmetry invariant: if list[v] holds w then list[w] holds v. */
            struct adjNode *back = findAdjNode(g->edges[w], v);
            if (back == NULL) {
                fprintf(stderr,
                        "error: GraphInsertEdge: adjacency symmetry broken\\n");
                exit(EXIT_FAILURE);
            }
            back->weight = weight;
        }
        return;
    }

    g->edges[v] = insertAdjNode(g->edges[v], w, weight);
    if (v != w) {
        g->edges[w] = insertAdjNode(g->edges[w], v, weight);
    }
    g->nE++;
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    requireVertex(g, v);
    requireVertex(g, w);

    if (!GraphIsAdjacent(g, v, w)) {
        return;
    }
    g->edges[v] = removeAdjNode(g->edges[v], w);
    if (v != w) {
        g->edges[w] = removeAdjNode(g->edges[w], v);
    }
    g->nE--;
}

void GraphShow(Graph g) {
    requireGraph(g);

    for (Vertex v = 0; v < g->nV; v++) {
        printf("%2d:", v);
        for (struct adjNode *curr = g->edges[v];
             curr != NULL;
             curr = curr->next) {
            printf(" %d(%.2f)", curr->v, curr->weight);
        }
        printf("\\n");
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static void requireWeight(Weight weight) {
    /* !(weight >= 0.0) also rejects NaN, matching the accepted domain. */
    if (!(weight >= 0.0)) {
        fprintf(stderr, "error: weight must be non-negative\\n");
        exit(EXIT_FAILURE);
    }
}

static struct adjNode *newAdjNode(Vertex v, Weight weight) {
    struct adjNode *new = malloc(sizeof(struct adjNode));
    if (new == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
    new->v = v;
    new->weight = weight;
    new->next = NULL;
    return new;
}

static struct adjNode *findAdjNode(struct adjNode *list, Vertex v) {
    struct adjNode *curr = list;
    while (curr != NULL && curr->v < v) {
        curr = curr->next;
    }
    return curr != NULL && curr->v == v ? curr : NULL;
}

static struct adjNode *insertAdjNode(
    struct adjNode *list, Vertex v, Weight weight
) {
    struct adjNode *new = newAdjNode(v, weight);
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
}`;
const LGADJLIST_UW = {"graphAlloc":60,"headsAlloc":68,"graphReturn":75,"freeOuter":83,"freeNode":87,"freeHeads":92,"freeGraph":93,"adjacentCurr":0,"adjacentLoop":0,"adjacentReturn":107,"insertGuard":125,"update":126,"insertForward":133,"insertReverse":135,"increment":137,"removeGuard":144,"removeForward":147,"removeReverse":149,"decrement":151,"showLoop":157,"newNode":171,"newNext":178,"insertHead":195,"insertLink":204,"removeHead":213,"unlink":224,"freeOld":225};
const SRC_GEDGEARRAY_DU_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * This complete C implementation is NOT supplied in the COMP2521 26T2
 * Data Structures and Algorithms Manual and is NOT supplied as complete
 * operation code in the attached COMP2521 25T3 directed-graphs lecture.
 *
 * It is a course-consistent study bridge built from the lecture Graph ADT,
 * the lecture edge-array representation and the directed-edge rule.
 *
 * Supplemental choices: INITIAL_CAPACITY is 8; a full array doubles through
 * realloc; deletion shifts later records left. One record stores one arc.
 * Understand the ordered-pair scan, append, compaction and growth patterns; do
 * not describe this file as verbatim manual or lecture code.
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
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->maxE = INITIAL_CAPACITY;
    g->edges = malloc((size_t)g->maxE * sizeof(struct edge));
    if (g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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

    if (GraphIsAdjacent(g, v, w)) {
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

    for (int i = 0; i < g->nE; i++) {
        printf("(%d, %d)\\n", g->edges[i].v, g->edges[i].w);
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static int edgeIndex(Graph g, Vertex v, Vertex w) {
    for (int i = 0; i < g->nE; i++) {
        if (g->edges[i].v == v && g->edges[i].w == w) {
            return i;
        }
    }
    return -1;
}

static void growEdges(Graph g) {
    if (g->maxE > INT_MAX / 2) {
        fprintf(stderr, "error: edge capacity would overflow int\\n");
        exit(EXIT_FAILURE);
    }
    int newMaxE = g->maxE * 2;
    struct edge *newEdges = realloc(
        g->edges, (size_t)newMaxE * sizeof(struct edge)
    );
    if (newEdges == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
    g->edges = newEdges;
    g->maxE = newMaxE;
}`;
const LGEDGEARRAY_DU = {"graphAlloc":55,"capacity":63,"arrayAlloc":64,"graphReturn":71,"freeArray":78,"freeGraph":79,"adjacentReturn":93,"insertGuard":100,"update":96,"growCall":104,"appendV":107,"appendW":108,"appendWeight":0,"increment":109,"removeIndex":116,"shift":121,"decrement":123,"showLoop":127,"edgeScan":137,"realloc":147,"setArray":154,"setCapacity":155};
const SRC_GEDGEARRAY_UW_MEM = `/*
 * SUPPLEMENTAL IMPLEMENTATION
 *
 * SOURCE STATUS: SUPPLEMENTAL C — NOT COURSE SOURCE.
 * This complete implementation is not printed in the attached COMP2521
 * 26T2 manual and is not supplied as complete C in the attached COMP2521
 * 25T3 lecture material. Read it alongside the algorithm that uses it.
 * Keep every declared assumption and supplemental design choice with it.
 *
 * This complete C implementation is NOT supplied in the COMP2521 26T2
 * Data Structures and Algorithms Manual and is NOT supplied as complete
 * operation code in the attached COMP2521 25T3 weighted-graphs lecture.
 *
 * It is a course-consistent study bridge built from the lecture Graph ADT,
 * the lecture edge-array representation and the weighted-edge rule.
 *
 * Supplemental choices: undirected endpoints are stored canonically with
 * v <= w; INITIAL_CAPACITY is 8; a full array doubles through realloc;
 * deletion shifts later records left; duplicate insertion replaces weight.
 * Understand the canonical-pair, scan, append, compaction and growth patterns;
 * do not describe this file as verbatim manual or lecture code.
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
        fprintf(stderr, "error: GraphNew: nV must be non-negative\\n");
        exit(EXIT_FAILURE);
    }

    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;
    g->maxE = INITIAL_CAPACITY;
    g->edges = malloc((size_t)g->maxE * sizeof(struct edge));
    if (g->edges == NULL) {
        free(g);
        fprintf(stderr, "error: out of memory\\n");
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
        fprintf(stderr, "error: GraphGetWeight: no edge (%d, %d)\\n", v, w);
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
        printf("(%d, %d, %.2f)\\n",
               g->edges[i].v, g->edges[i].w,
               g->edges[i].weight);
    }
}

static bool validVertex(Graph g, Vertex v) {
    return g != NULL && v >= 0 && v < g->nV;
}

static void requireGraph(Graph g) {
    if (g == NULL) {
        fprintf(stderr, "error: graph is NULL\\n");
        exit(EXIT_FAILURE);
    }
}

static void requireVertex(Graph g, Vertex v) {
    requireGraph(g);
    if (!validVertex(g, v)) {
        fprintf(stderr, "error: vertex %d is outside 0..%d\\n", v, g->nV - 1);
        exit(EXIT_FAILURE);
    }
}

static void requireWeight(Weight weight) {
    /* !(weight >= 0.0) also rejects NaN, matching the accepted domain. */
    if (!(weight >= 0.0)) {
        fprintf(stderr, "error: weight must be non-negative\\n");
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
        fprintf(stderr, "error: edge capacity would overflow int\\n");
        exit(EXIT_FAILURE);
    }
    int newMaxE = g->maxE * 2;
    struct edge *newEdges = realloc(
        g->edges, (size_t)newMaxE * sizeof(struct edge)
    );
    if (newEdges == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
    g->edges = newEdges;
    g->maxE = newMaxE;
}`;
const LGEDGEARRAY_UW = {"graphAlloc":60,"capacity":68,"arrayAlloc":69,"graphReturn":76,"freeArray":83,"freeGraph":84,"adjacentReturn":98,"insertGuard":114,"update":115,"growCall":119,"appendV":122,"appendW":123,"appendWeight":124,"increment":125,"removeIndex":132,"shift":137,"decrement":139,"showLoop":143,"edgeScan":164,"realloc":174,"setArray":181,"setCapacity":182};

function graphModeKey(directed,weighted){
  return directed ? (weighted?'dw':'du') : (weighted?'uw':'uu');
}
const GRAPH_LIST_VARIANTS={
  uu:{src:SRC_GADJLIST_MEM,lines:LGL,label:'undirected / unweighted'},
  du:{src:SRC_GADJLIST_DU_MEM,lines:LGADJLIST_DU,label:'directed / unweighted'},
  uw:{src:SRC_GADJLIST_UW_MEM,lines:LGADJLIST_UW,label:'undirected / weighted'},
  dw:{src:SRC_GADJLIST_DW_MEM,lines:LGLW,label:'directed / weighted'}
};
const GRAPH_EDGE_VARIANTS={
  uu:{src:SRC_GEDGEARRAY_MEM,lines:LGE,label:'undirected / unweighted'},
  du:{src:SRC_GEDGEARRAY_DU_MEM,lines:LGEDGEARRAY_DU,label:'directed / unweighted'},
  uw:{src:SRC_GEDGEARRAY_UW_MEM,lines:LGEDGEARRAY_UW,label:'undirected / weighted'},
  dw:{src:SRC_GEDGEARRAY_DW_MEM,lines:LGEW,label:'directed / weighted'}
};
const GRAPH_MATRIX_VARIANTS={
  uu:{src:SRC_GADJ,lines:LGA,label:'undirected / unweighted',source:'manual'},
  du:{src:SRC_GMATRIX_DU_MEM,lines:LGMATRIX_DU,label:'directed / unweighted',source:'memorise'},
  uw:{src:SRC_GMATRIX_UW_MEM,lines:LGMATRIX_UW,label:'undirected / weighted',source:'memorise'},
  dw:{src:SRC_GMATRIX_DW_MEM,lines:LGMW,label:'directed / weighted',source:'memorise'}
};
function graphVariant(rep,directed,weighted){
  const key=graphModeKey(directed,weighted);
  if(rep==='adjacency list')return {...GRAPH_LIST_VARIANTS[key],key,rep,source:'memorise'};
  if(rep==='array of edges')return {...GRAPH_EDGE_VARIANTS[key],key,rep,source:'memorise'};
  return {...GRAPH_MATRIX_VARIANTS[key],key,rep:'adjacency matrix'};
}


const MEM_MATRIX_OVERVIEW = `struct graph {
    int nV;
    int nE;
    bool **edges;
};`;
const MEM_ADJLIST_OVERVIEW = `struct graph {
    int nV;
    int nE;
    struct adjNode **edges;
};

struct adjNode {
    Vertex v;
    struct adjNode *next;
};

/* Full GraphNew/Free/NumVertices/NumEdges/
   IsAdjacent/InsertEdge/RemoveEdge/Show code:
   see the MEMORISE source block. */`;
const MEM_EDGEARRAY_OVERVIEW = `#define INITIAL_CAPACITY 8 /* supplemental choice */

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

/* Full lifecycle, scan, compact and realloc code:
   see the MEMORISE source block. */`;
const MEM_ADJLIST_NEIGHBOUR_LOOP = `for (struct adjNode *curr = g->edges[v];
     curr != NULL;
     curr = curr->next) {
    Vertex w = curr->v;
    /* process neighbour w */
}`;
const MEM_ADJLIST_WEIGHTED_NEIGHBOUR_LOOP = `for (struct adjNode *curr = g->edges[v];
     curr != NULL;
     curr = curr->next) {
    Vertex w = curr->v;
    Weight weight = curr->weight;
    /* process edge (v, w, weight) */
}`;
const MEM_EDGEARRAY_NEIGHBOUR_LOOP = `for (int i = 0; i < g->nE; i++) {
    struct edge e = g->edges[i];
    if (e.v == v) {
        Vertex w = e.w;
        /* process neighbour w */
    } else if (e.w == v) {
        Vertex w = e.v;
        /* process neighbour w */
    }
}`;
const MEM_EDGEARRAY_WEIGHTED_NEIGHBOUR_LOOP = `for (int i = 0; i < g->nE; i++) {
    struct edge e = g->edges[i];
    if (e.v == v) {
        Vertex w = e.w;
        Weight weight = e.weight;
        /* process edge (v, w, weight) */
    }
}`;
const MEM_EDGEARRAY_DIRECTED_NEIGHBOUR_LOOP = `for (int i = 0; i < g->nE; i++) {
    struct edge e = g->edges[i];
    if (e.v == v) {
        Vertex w = e.w;
        /* process outgoing neighbour w */
    }
}`;
const MEM_EDGEARRAY_WEIGHTED_UNDIRECTED_NEIGHBOUR_LOOP = `for (int i = 0; i < g->nE; i++) {
    struct edge e = g->edges[i];
    if (e.v == v || e.w == v) {
        Vertex w = (e.v == v) ? e.w : e.v;
        Weight weight = e.weight;
        /* process incident edge (v, w, weight) */
    }
}`;
const MEM_MATRIX_DIRECTED_NEIGHBOUR_LOOP = `for (Vertex w = 0; w < g->nV; w++) {
    if (g->edges[v][w]) {
        /* process outgoing neighbour w */
    }
}`;
const MEM_MATRIX_WEIGHTED_NEIGHBOUR_LOOP = `for (Vertex w = 0; w < g->nV; w++) {
    if (g->edges[v][w] != NO_EDGE) {
        Weight weight = g->edges[v][w];
        /* process edge (v, w, weight) */
    }
}`;

const LEC_GRAPH_FUND = `A graph consists of:
- a set of vertices V (also called nodes)
- a set of edges E between pairs of vertices

Course terminology:
- vertices are usually integers from 0 to |V| - 1
- edges may be directed, weighted and/or labelled
- a loop is an edge from a vertex to itself
- a simple graph is undirected, has no loops and has no multiple edges
- vertices are adjacent when an edge connects them; degree counts incident edges
- a path follows edges; a simple path has no repeating vertices; a cycle starts and ends at the same vertex
- a complete graph connects every pair of vertices
- a connected graph has a path between every pair of vertices
- a tree is connected and has no cycles
- a connected component is a maximally connected subgraph
- a spanning tree contains all vertices and is a single tree
- a spanning forest contains one tree for each connected component
- a clique is a complete subgraph`;