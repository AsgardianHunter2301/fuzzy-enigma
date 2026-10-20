/*
 * test_warshall.c - BRG-02. Driver for the corrected Warshall bridge.
 *
 * Declared convention under test: POSITIVE-LENGTH reachability. tc[v][w] is
 * true exactly when a walk of one or more arcs runs from v to w, so the
 * diagonal is false unless the vertex lies on a cycle. The separately named
 * warshallReflexive() is the zero-or-more-arcs alternative, and the two must
 * differ only on the diagonal.
 *
 * Backend: the supplied directed adjacency matrix, because the Warshall lesson
 * takes directed arcs. That backend also accepts self-loops, so the
 * self-reachability cases are real.
 */
#include <stdbool.h>
#include <stdlib.h>

#include "bridges_graph.h"
#include "graph_unweighted.h"
#include "testing.h"

/* Independent oracle: positive-length reachability by repeated relaxation over
 * the arcs, computed without Warshall's k-i-j loop. */
static bool **reachabilityOracle(Graph g) {
    int nV = GraphNumVertices(g);
    bool **r = malloc((size_t) nV * sizeof(*r));
    if (r == NULL) exit(EXIT_FAILURE);
    for (Vertex v = 0; v < nV; v++) {
        r[v] = calloc((size_t) nV, sizeof(*r[v]));
        if (r[v] == NULL) exit(EXIT_FAILURE);
    }

    for (Vertex v = 0; v < nV; v++) {
        /* seed with the out-arcs of v: the first step is mandatory */
        for (Vertex w = 0; w < nV; w++) r[v][w] = GraphIsAdjacent(g, v, w);

        bool changed = true;
        while (changed) {
            changed = false;
            for (Vertex x = 0; x < nV; x++) {
                if (!r[v][x]) continue;
                for (Vertex y = 0; y < nV; y++) {
                    if (GraphIsAdjacent(g, x, y) && !r[v][y]) {
                        r[v][y] = true;
                        changed = true;
                    }
                }
            }
        }
    }
    return r;
}

static void compareWithOracle(Graph g, const char *what) {
    int nV = GraphNumVertices(g);
    bool **tc = warshall(g);
    bool **oracle = reachabilityOracle(g);
    bool same = true;
    for (Vertex v = 0; v < nV; v++) {
        for (Vertex w = 0; w < nV; w++) {
            if (tc[v][w] != oracle[v][w]) same = false;
        }
    }
    CHECK(same, what);
    warshallFree(tc, nV);
    warshallFree(oracle, nV);
}

int main(void) {
    SECTION("the audited case: empty two-vertex graph");
    {
        Graph g = GraphNew(2);
        bool **tc = warshall(g);
        CHECK(!tc[0][0] && !tc[1][1],
              "the diagonal is FALSE with no arcs (positive-length convention)");
        CHECK(!tc[0][1] && !tc[1][0], "no off-diagonal reachability either");
        warshallFree(tc, 2);

        bool **ref = warshallReflexive(g);
        CHECK(ref[0][0] && ref[1][1],
              "the labelled reflexive alternative forces the diagonal true");
        CHECK(!ref[0][1] && !ref[1][0],
              "the alternative differs on the diagonal only");
        warshallFree(ref, 2);
        GraphFree(g);
    }

    SECTION("an unreachable pair and a reachable pair");
    {
        Graph g = GraphNew(4);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        /* vertex 3 is isolated */

        bool **tc = warshall(g);
        CHECK(tc[0][2], "0 reaches 2 through 1");
        CHECK(!tc[2][0], "the arcs are directed: 2 does not reach 0");
        CHECK(!tc[0][3] && !tc[3][0], "the isolated vertex is unreachable");
        CHECK(!tc[0][0] && !tc[1][1] && !tc[2][2] && !tc[3][3],
              "no vertex lies on a cycle, so the whole diagonal is false");
        warshallFree(tc, 4);

        compareWithOracle(g, "tc matches the independent reachability oracle");
        GraphFree(g);
    }

    SECTION("self-reachability through a cycle");
    {
        Graph g = GraphNew(3);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 0);
        /* vertex 2 is isolated */

        bool **tc = warshall(g);
        CHECK(tc[0][0] && tc[1][1],
              "vertices on a two-cycle reach themselves by a positive walk");
        CHECK(!tc[2][2], "the isolated vertex still does not reach itself");
        warshallFree(tc, 3);

        compareWithOracle(g, "tc matches the oracle on the cyclic case");
        GraphFree(g);
    }

    SECTION("self-reachability through a self-loop");
    {
        Graph g = GraphNew(2);
        GraphInsertEdge(g, 0, 0);
        bool loopsAccepted = GraphIsAdjacent(g, 0, 0);
        printf("   backend %s self-loops; nE = %d\n",
               loopsAccepted ? "ACCEPTS" : "REJECTS", GraphNumEdges(g));

        bool **tc = warshall(g);
        CHECK(tc[0][0] == loopsAccepted,
              "a self-loop makes exactly that diagonal entry true");
        CHECK(!tc[1][1], "the other diagonal entry stays false");
        warshallFree(tc, 2);
        GraphFree(g);
    }

    SECTION("single vertex and no vertices");
    {
        Graph g = GraphNew(1);
        bool **tc = warshall(g);
        CHECK(!tc[0][0], "a lone vertex does not reach itself by a positive walk");
        warshallFree(tc, 1);
        bool **ref = warshallReflexive(g);
        CHECK(ref[0][0], "under the reflexive alternative it does");
        warshallFree(ref, 1);
        GraphFree(g);

        g = GraphNew(0);
        bool **empty = warshall(g);
        warshallFree(empty, 0);
        CHECK(true, "a graph with no vertices allocates and frees cleanly");
        GraphFree(g);
    }

    SECTION("a bank of deterministic graphs against the oracle");
    {
        /* every arc set on 3 vertices that the loop below enumerates */
        for (int mask = 0; mask < 64; mask++) {
            Graph g = GraphNew(3);
            int bit = 0;
            for (Vertex v = 0; v < 3; v++) {
                for (Vertex w = 0; w < 3; w++) {
                    if (v == w) continue;
                    if (mask & (1 << bit)) GraphInsertEdge(g, v, w);
                    bit++;
                }
            }
            compareWithOracle(g, "tc matches the oracle on a generated graph");
            GraphFree(g);
        }
    }

    return testReport("test_warshall");
}
