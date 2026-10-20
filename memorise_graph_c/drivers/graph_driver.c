/*
 * graph_driver.c - one driver for all eleven alternative Graph ADTs.
 *
 * The eleven implementations in the parent directory all define the SAME
 * Graph API, so they cannot be linked together. Exactly one is compiled at a
 * time, textually included through -DSOURCE_FILE, and the contract knobs are
 * passed on the command line:
 *
 *   gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow \
 *       -Wstrict-prototypes -Werror \
 *       -DSOURCE_FILE='"../COMP2521_memorise_weighted_undirected_edge_array.c"' \
 *       -DVARIANT='"weighted_undirected_edge_array"' \
 *       -DWEIGHTED=1 -DDIRECTED=0 -DALLOW_LOOPS=1 -DEDGE_ARRAY=1 \
 *       graph_driver.c -o demo
 *
 * build_all.sh sets those knobs for each variant and records the results.
 *
 * The driver does not merely print: every step states what the documented
 * contract requires and exits 2 if the implementation disagrees. The default
 * run therefore exits 0 only if the variant behaves as docs/C_LIBRARY_MATRIX.md
 * says it does.
 *
 * Subcommands run the deliberately fatal precondition demonstrations, each of
 * which must terminate with exit status 1 (the ADT's own error convention):
 *   fatal-vertex          vertex outside 0..nV-1
 *   fatal-null            accessor on a NULL graph
 *   fatal-nv              GraphNew with a negative order
 *   fatal-absent-weight   GraphGetWeight on an edge that is not there (weighted)
 *   fatal-negative-weight GraphInsertEdge with a negative weight  (weighted)
 */

#include <stdio.h>
#include <string.h>

#if !defined(WEIGHTED) || !defined(DIRECTED) || !defined(ALLOW_LOOPS)
#error "define WEIGHTED, DIRECTED and ALLOW_LOOPS on the command line"
#endif
#ifndef EDGE_ARRAY
#define EDGE_ARRAY 0
#endif
#ifndef VARIANT
#define VARIANT "unnamed variant"
#endif

#include SOURCE_FILE

static int drv_failures = 0;

static void drv_check(int ok, const char *what) {
    printf("    [%s] %s\n", ok ? "ok" : "FAIL", what);
    if (!ok) {
        drv_failures++;
    }
}

static void drv_insert(Graph g, Vertex v, Vertex w, double weight) {
#if WEIGHTED
    GraphInsertEdge(g, v, w, (Weight)weight);
#else
    (void)weight;
    GraphInsertEdge(g, v, w);
#endif
}

#if WEIGHTED
static int drv_weight_is(Graph g, Vertex v, Vertex w, double expected) {
    return GraphGetWeight(g, v, w) == (Weight)expected;
}
#endif

static void drv_capacity(Graph g, const char *when) {
#if EDGE_ARRAY
    printf("    capacity %-18s nE=%d maxE=%d\n", when, g->nE, g->maxE);
#else
    (void)g;
    (void)when;
#endif
}

static int drv_contract(void) {
    printf("variant: %s\n", VARIANT);
    printf("flags:   WEIGHTED=%d DIRECTED=%d ALLOW_LOOPS=%d EDGE_ARRAY=%d\n",
           WEIGHTED, DIRECTED, ALLOW_LOOPS, EDGE_ARRAY);

    printf("  1. GraphFree(NULL) is safe\n");
    GraphFree(NULL);
    drv_check(1, "GraphFree(NULL) returned");

    printf("  2. GraphNew(0) is a legal empty graph\n");
    Graph empty = GraphNew(0);
    drv_check(GraphNumVertices(empty) == 0, "nV == 0");
    drv_check(GraphNumEdges(empty) == 0, "nE == 0");
    GraphFree(empty);

    Graph g = GraphNew(5);
    int expected_nE = 0;
    printf("  3. GraphNew(5): vertex domain is 0..4\n");
    drv_check(GraphNumVertices(g) == 5, "nV == 5");
    drv_check(GraphNumEdges(g) == 0, "nE == 0");
    drv_capacity(g, "after GraphNew");

    printf("  4. insert (1,2) weight 2.50\n");
    drv_insert(g, 1, 2, 2.5);
    expected_nE = 1;
    drv_check(GraphIsAdjacent(g, 1, 2), "(1,2) is adjacent");
    drv_check(GraphIsAdjacent(g, 2, 1) == (DIRECTED ? false : true),
              DIRECTED ? "(2,1) is NOT adjacent (directed)"
                       : "(2,1) is adjacent (undirected, symmetric query)");
    drv_check(GraphNumEdges(g) == expected_nE, "nE == 1");
#if WEIGHTED
    drv_check(drv_weight_is(g, 1, 2, 2.5), "weight (1,2) == 2.50");
#endif

    printf("  5. duplicate insert (1,2) weight 4.50\n");
    drv_insert(g, 1, 2, 4.5);
    drv_check(GraphNumEdges(g) == expected_nE, "nE unchanged by a duplicate");
#if WEIGHTED
    drv_check(drv_weight_is(g, 1, 2, 4.5),
              "weight (1,2) updated in place to 4.50");
#else
    drv_check(GraphIsAdjacent(g, 1, 2), "duplicate ignored, edge still there");
#endif

    printf("  6. reverse insert (2,1) weight 7.00 - this is what nE means\n");
    drv_insert(g, 2, 1, 7.0);
#if DIRECTED
    expected_nE = 2;
    drv_check(GraphNumEdges(g) == expected_nE,
              "nE == 2: nE counts directed arcs, (1,2) and (2,1) are distinct");
#if WEIGHTED
    drv_check(drv_weight_is(g, 1, 2, 4.5), "weight (1,2) still 4.50");
    drv_check(drv_weight_is(g, 2, 1, 7.0), "weight (2,1) == 7.00");
#endif
#else
    drv_check(GraphNumEdges(g) == expected_nE,
              "nE == 1: nE counts logical undirected edges, (2,1) is the same edge");
#if WEIGHTED
    drv_check(drv_weight_is(g, 1, 2, 7.0),
              "weight (1,2) updated to 7.00 by the reverse-order insert");
    drv_check(drv_weight_is(g, 2, 1, 7.0), "weight (2,1) reads the same record");
#endif
#endif

    printf("  7. self-loop insert (3,3) weight 1.50\n");
    drv_insert(g, 3, 3, 1.5);
#if ALLOW_LOOPS
    expected_nE++;
    drv_check(GraphIsAdjacent(g, 3, 3), "self-loop accepted");
    drv_check(GraphNumEdges(g) == expected_nE, "self-loop counted once in nE");
#if WEIGHTED
    drv_check(drv_weight_is(g, 3, 3, 1.5), "weight (3,3) == 1.50");
#endif
#else
    drv_check(!GraphIsAdjacent(g, 3, 3), "self-loop ignored by this variant");
    drv_check(GraphNumEdges(g) == expected_nE, "nE unchanged by the self-loop");
#endif

    printf("  8. absent-edge query (0,4)\n");
    drv_check(!GraphIsAdjacent(g, 0, 4), "GraphIsAdjacent is false, total, no error");
#if WEIGHTED
    printf("    GraphGetWeight(0,4) is a PRECONDITION VIOLATION, not a query:\n");
    printf("    it is demonstrated by './demo fatal-absent-weight' (exit 1).\n");
#endif

    printf("  9. GraphShow (format is per-variant, see docs/C_LIBRARY_MATRIX.md)\n");
    GraphShow(g);

    printf(" 10. remove (1,2)\n");
    GraphRemoveEdge(g, 1, 2);
    expected_nE--;
    drv_check(!GraphIsAdjacent(g, 1, 2), "(1,2) gone");
    drv_check(GraphIsAdjacent(g, 2, 1) == (DIRECTED ? true : false),
              DIRECTED ? "(2,1) survives: it is a separate arc"
                       : "(2,1) gone too: one logical edge was removed");
    drv_check(GraphNumEdges(g) == expected_nE, "nE decremented by exactly 1");

    printf(" 11. remove (1,2) again - absent removal is a no-op\n");
    GraphRemoveEdge(g, 1, 2);
    drv_check(GraphNumEdges(g) == expected_nE, "nE unchanged");

    printf(" 12. fill the graph, then empty it: capacity does not shrink\n");
    for (Vertex v = 0; v < 5; v++) {
        for (Vertex w = 0; w < 5; w++) {
            drv_insert(g, v, w, 1.0);
        }
    }
    drv_capacity(g, "when full");
    for (Vertex v = 0; v < 5; v++) {
        for (Vertex w = 0; w < 5; w++) {
            GraphRemoveEdge(g, v, w);
        }
    }
    drv_capacity(g, "when emptied");
    drv_check(GraphNumEdges(g) == 0, "nE back to 0 after removing every edge");
#if EDGE_ARRAY
    drv_check(g->maxE > INITIAL_CAPACITY,
              "maxE grew past INITIAL_CAPACITY and was never given back:"
              " edge-array memory follows PEAK edge count, not nE");
#endif

    printf(" 13. GraphFree releases everything it owns\n");
    GraphFree(g);
    drv_check(1, "GraphFree returned (run under ASan for the real verdict)");

    printf("%s: %d contract check(s) failed\n", VARIANT, drv_failures);
    return drv_failures == 0 ? 0 : 2;
}

int main(int argc, char **argv) {
    if (argc < 2) {
        return drv_contract();
    }

    const char *mode = argv[1];

    if (strcmp(mode, "fatal-nv") == 0) {
        printf("GraphNew(-1) must fail, not return a broken graph\n");
        fflush(stdout);
        Graph bad = GraphNew(-1);
        printf("NOT REACHED: GraphNew(-1) returned nV=%d\n",
               GraphNumVertices(bad));
        return 3;
    }

    if (strcmp(mode, "fatal-null") == 0) {
        printf("GraphNumEdges(NULL) must fail, not dereference NULL\n");
        fflush(stdout);
        printf("NOT REACHED: returned %d\n", GraphNumEdges(NULL));
        return 3;
    }

    if (strcmp(mode, "fatal-vertex") == 0) {
        Graph g = GraphNew(5);
        printf("GraphIsAdjacent(g, 0, 99) must fail: 99 is outside 0..4\n");
        fflush(stdout);
        printf("NOT REACHED: returned %d\n", (int)GraphIsAdjacent(g, 0, 99));
        GraphFree(g);
        return 3;
    }

#if WEIGHTED
    if (strcmp(mode, "fatal-absent-weight") == 0) {
        Graph g = GraphNew(5);
        GraphInsertEdge(g, 1, 2, (Weight)2.5);
        printf("GraphGetWeight(g, 0, 4) must fail: there is no such edge\n");
        fflush(stdout);
        printf("NOT REACHED: returned %.2f\n", (double)GraphGetWeight(g, 0, 4));
        GraphFree(g);
        return 3;
    }

    if (strcmp(mode, "fatal-negative-weight") == 0) {
        Graph g = GraphNew(5);
        printf("GraphInsertEdge(g, 1, 2, -1.0) must fail: weights are >= 0.0\n");
        fflush(stdout);
        GraphInsertEdge(g, 1, 2, (Weight)-1.0);
        printf("NOT REACHED: accepted, nE=%d isAdjacent=%d\n",
               GraphNumEdges(g), (int)GraphIsAdjacent(g, 1, 2));
        GraphFree(g);
        return 3;
    }
#endif

    fprintf(stderr, "driver: unknown subcommand '%s'\n", mode);
    return 4;
}
