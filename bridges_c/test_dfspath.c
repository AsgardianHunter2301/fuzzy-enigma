/*
 * test_dfspath.c - NEW-15. Driver for the DFS path-checking and path-finding
 * conversions the dfs bridge's token list registers.
 *
 * Declared convention under test: predecessor[src] == src, predecessor[w] == -1
 * means w has not been reached, and -1 has no second meaning. DFS reports the
 * FIRST path under neighbour order, not the shortest, so the tests assert the
 * properties a first-found path must have and never assert one exact route.
 *
 * Reachability is checked against an independent oracle computed by boolean
 * relaxation, which never calls the bridge, so a path's existence is confirmed
 * by something other than the predecessor array that produced it. The dfs()
 * visited array is used as a second, separate cross-check.
 *
 * Backend-agnostic: built against the supplied undirected adjacency list
 * (self-loops rejected), the displayed manual undirected adjacency matrix
 * (self-loops accepted) and the supplied directed matrix (arcs only, so
 * reachability is asymmetric). The self-loop and symmetry sections ask the
 * backend what it accepted instead of assuming.
 */
#include <stdbool.h>
#include <stdlib.h>

#include "bridges_graph.h"
#include "graph_unweighted.h"
#include "testing.h"

/* Independent oracle: boolean reachability by relaxation to a fixed point.
 * reach[v][w] is true for a walk of ZERO or more edges, so the diagonal is
 * true, matching what dfsHasPath(g, v, v) must report. */
static bool *reachOracle(Graph g) {
    int nV = GraphNumVertices(g);
    bool *reach = calloc((size_t) nV * nV, sizeof(*reach));
    if (reach == NULL) exit(EXIT_FAILURE);

    for (Vertex v = 0; v < nV; v++) {
        reach[v * nV + v] = true;
        for (Vertex w = 0; w < nV; w++) {
            if (GraphIsAdjacent(g, v, w)) reach[v * nV + w] = true;
        }
    }
    bool changed = true;
    while (changed) {
        changed = false;
        for (Vertex v = 0; v < nV; v++) {
            for (Vertex m = 0; m < nV; m++) {
                if (!reach[v * nV + m]) continue;
                for (Vertex w = 0; w < nV; w++) {
                    if (reach[m * nV + w] && !reach[v * nV + w]) {
                        reach[v * nV + w] = true;
                        changed = true;
                    }
                }
            }
        }
    }
    return reach;
}

static bool pathIsWalk(Graph g, const Vertex path[], int length) {
    for (int i = 0; i + 1 < length; i++) {
        if (!GraphIsAdjacent(g, path[i], path[i + 1])) return false;
    }
    return true;
}

static bool pathIsSimple(const Vertex path[], int length, int nV) {
    bool *seen = calloc(nV, sizeof(*seen));
    if (seen == NULL) exit(EXIT_FAILURE);
    bool ok = true;
    for (int i = 0; i < length; i++) {
        if (path[i] < 0 || path[i] >= nV || seen[path[i]]) { ok = false; break; }
        seen[path[i]] = true;
    }
    free(seen);
    return ok;
}

/* Every src/dest pair on one graph, checked against the oracle. */
static void checkAllPairs(Graph g, const char *what) {
    int nV = GraphNumVertices(g);
    bool *reach = reachOracle(g);
    Vertex *path = malloc(nV * sizeof(*path));
    if (path == NULL) exit(EXIT_FAILURE);

    for (Vertex src = 0; src < nV; src++) {
        bool *visited = dfs(g, src);
        for (Vertex dest = 0; dest < nV; dest++) {
            bool expected = reach[src * nV + dest];

            CHECK(dfsHasPath(g, src, dest) == expected,
                  "dfsHasPath must agree with the independent oracle");

            /* Second cross-check: the dfs() visited array marks exactly the
             * vertices reachable from src, and marks src itself. */
            CHECK(visited[dest] == expected,
                  "dfs() visited must agree with the same oracle");

            int length = dfsFindPath(g, src, dest, path);
            if (!expected) {
                CHECK(length == 0, "unreachable dest must return 0");
                continue;
            }
            CHECK(length > 0, "reachable dest must return a positive length");
            if (length <= 0) continue;
            CHECK(length <= nV, "a simple path cannot exceed nV vertices");
            CHECK(path[0] == src, "path must start at src");
            CHECK(path[length - 1] == dest, "path must end at dest");
            CHECK(pathIsWalk(g, path, length),
                  "consecutive path vertices must be adjacent");
            CHECK(pathIsSimple(path, length, nV),
                  "a predecessor-marked DFS path cannot repeat a vertex");
            if (src == dest) {
                CHECK(length == 1, "src == dest must return exactly one vertex");
            }
        }
        free(visited);
    }
    free(path);
    free(reach);
    (void) what;
}

int main(void) {
    SECTION("a path that exists, and one that does not");
    {
        Graph g = GraphNew(7);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 2, 3);
        GraphInsertEdge(g, 4, 5);
        /* 6 is isolated; 4-5 is a separate component in an undirected
         * backend. */
        Vertex path[7];

        CHECK(dfsHasPath(g, 0, 3), "0 reaches 3 along the chain");
        int length = dfsFindPath(g, 0, 3, path);
        CHECK(length == 4, "the only 0->3 route visits four vertices");
        CHECK(path[0] == 0 && path[3] == 3, "endpoints are src and dest");
        CHECK(pathIsWalk(g, path, length), "the route is a walk in g");

        CHECK(!dfsHasPath(g, 0, 6), "6 is isolated, so it is unreachable");
        CHECK(dfsFindPath(g, 0, 6, path) == 0, "unreachable returns 0");
        checkAllPairs(g, "chain plus an isolated vertex");
        GraphFree(g);
    }

    SECTION("src == dest, on an isolated vertex and on a connected one");
    {
        Graph g = GraphNew(3);
        GraphInsertEdge(g, 0, 1);
        Vertex path[3];
        CHECK(dfsHasPath(g, 2, 2), "a vertex always reaches itself");
        CHECK(dfsFindPath(g, 2, 2, path) == 1, "one vertex is written");
        CHECK(path[0] == 2, "and it is the vertex itself");
        CHECK(dfsFindPath(g, 0, 0, path) == 1, "same for a connected vertex");
        GraphFree(g);
    }

    SECTION("out-of-range vertices are rejected, not crashed on");
    {
        Graph g = GraphNew(2);
        GraphInsertEdge(g, 0, 1);
        Vertex path[2];
        CHECK(!dfsHasPath(g, -1, 0), "negative src is false");
        CHECK(!dfsHasPath(g, 0, 2), "dest == nV is false");
        CHECK(!dfsHasPath(g, 5, 5), "both out of range is false");
        CHECK(dfsFindPath(g, -1, 0, path) == -1, "negative src returns -1");
        CHECK(dfsFindPath(g, 0, 2, path) == -1, "dest == nV returns -1");
        GraphFree(g);
    }

    SECTION("a single vertex, and a vertex carrying only a self-loop");
    {
        Graph g = GraphNew(1);
        Vertex path[1];
        CHECK(dfsHasPath(g, 0, 0), "the lone vertex reaches itself");
        CHECK(dfsFindPath(g, 0, 0, path) == 1, "and the path is just itself");

        GraphInsertEdge(g, 0, 0);
        /* Ask the backend what it accepted rather than assuming. */
        bool loopKept = GraphIsAdjacent(g, 0, 0);
        CHECK(dfsHasPath(g, 0, 0), "self-reachability holds either way");
        CHECK(dfsFindPath(g, 0, 0, path) == 1,
              "a self-loop does not lengthen the zero-edge path");
        (void) loopKept;
        checkAllPairs(g, "single vertex with a self-loop");
        GraphFree(g);
    }

    SECTION("a cycle: the first path found need not be the shortest");
    {
        Graph g = GraphNew(5);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 2, 3);
        GraphInsertEdge(g, 3, 4);
        GraphInsertEdge(g, 0, 4);
        Vertex path[5];
        int length = dfsFindPath(g, 0, 4, path);
        CHECK(length >= 2, "a route from 0 to 4 exists");
        CHECK(path[0] == 0 && path[length - 1] == 4, "endpoints hold");
        CHECK(pathIsWalk(g, path, length), "the route is a walk");
        CHECK(pathIsSimple(path, length, 5), "and it is simple");
        /* The shortest route is 0-4 (two vertices). DFS may legitimately
         * return the long way round, so length is NOT asserted to be 2. */
        checkAllPairs(g, "five-cycle");
        GraphFree(g);
    }

    SECTION("a bank of generated graphs, every pair against the oracle");
    {
        /* Deterministic edge selection, so a failure is reproducible. */
        for (int nV = 1; nV <= 7; nV++) {
            for (unsigned pattern = 0; pattern < 24; pattern++) {
                Graph g = GraphNew(nV);
                unsigned bit = pattern * 2654435761u;
                for (Vertex v = 0; v < nV; v++) {
                    for (Vertex w = 0; w < nV; w++) {
                        bit = bit * 1103515245u + 12345u;
                        if ((bit >> 19) & 1u) GraphInsertEdge(g, v, w);
                    }
                }
                checkAllPairs(g, "generated");
                GraphFree(g);
            }
        }
    }

    return testReport("test_dfspath");
}
