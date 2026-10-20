/*
 * test_bfs.c - BRG-01. Driver for the corrected BFS bridge and its path
 * reconstruction consumer.
 *
 * Declared convention under test: predecessor[src] == src, predecessor[w] == -1
 * means w was never reached, and -1 has no second meaning.
 *
 * Backend-agnostic: build once against the supplied undirected adjacency list
 * (self-loops rejected) and once against the displayed manual adjacency matrix
 * (self-loops accepted). The self-loop section asks the backend what it
 * accepted instead of assuming, so one source covers both contracts.
 */
#include <stdbool.h>
#include <stdlib.h>

#include "bridges_graph.h"
#include "graph_unweighted.h"
#include "testing.h"

/* Independent oracle: BFS layer distances computed separately from the bridge,
 * so the reconstructed path length can be checked against something that is not
 * the predecessor array itself. */
static void shortestLayers(Graph g, Vertex src, int dist[]) {
    int nV = GraphNumVertices(g);
    for (Vertex v = 0; v < nV; v++) dist[v] = -1;
    dist[src] = 0;

    bool changed = true;
    while (changed) {
        changed = false;
        for (Vertex v = 0; v < nV; v++) {
            if (dist[v] < 0) continue;
            for (Vertex w = 0; w < nV; w++) {
                if (GraphIsAdjacent(g, v, w) &&
                    (dist[w] < 0 || dist[w] > dist[v] + 1)) {
                    dist[w] = dist[v] + 1;
                    changed = true;
                }
            }
        }
    }
}

static bool pathIsWalk(Graph g, const Vertex path[], int length) {
    for (int i = 0; i + 1 < length; i++) {
        if (!GraphIsAdjacent(g, path[i], path[i + 1])) return false;
    }
    return true;
}

int main(void) {
    printf("test_bfs (BRG-01) backend nE/loop behaviour probed at run time\n");

    /* ---------------------------------------------------------------- */
    SECTION("the audited case: empty two-vertex graph, source 0");
    {
        Graph g = GraphNew(2);
        int *pred = bfs(g, 0);

        CHECK(pred[0] == 0, "root is its own predecessor (declared convention)");
        CHECK(pred[1] == -1, "unreached vertex keeps -1");
        CHECK(bfsReached(pred, 2, 0), "source is reachable from itself");
        CHECK(!bfsReached(pred, 2, 1), "vertex 1 is not reachable");

        Vertex path[2];
        CHECK(bfsFindPath(pred, 2, 0, 0, path) == 1, "src to src is one vertex");
        CHECK(path[0] == 0, "src to src path is just src");
        CHECK(bfsFindPath(pred, 2, 0, 1, path) == 0,
              "unreachable destination yields no path, not an invented one");

        free(pred);
        GraphFree(g);
    }

    /* ---------------------------------------------------------------- */
    SECTION("reachable vertices agree with an independent layer oracle");
    {
        Graph g = GraphNew(6);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 2, 3);
        GraphInsertEdge(g, 0, 3);
        GraphInsertEdge(g, 3, 4);
        /* vertex 5 is isolated */

        int *pred = bfs(g, 0);
        int dist[6];
        shortestLayers(g, 0, dist);

        Vertex path[6];
        for (Vertex v = 0; v < 6; v++) {
            bool reached = bfsReached(pred, 6, v);
            CHECK(reached == (dist[v] >= 0),
                  "reached-marker agrees with the layer oracle");
            int length = bfsFindPath(pred, 6, 0, v, path);
            if (dist[v] < 0) {
                CHECK(length == 0, "isolated vertex has no path");
            } else {
                CHECK(length == dist[v] + 1,
                      "path vertex count is the BFS distance plus one");
                CHECK(path[0] == 0, "path starts at the source");
                CHECK(path[length - 1] == v, "path ends at the destination");
                CHECK(pathIsWalk(g, path, length),
                      "every consecutive pair in the path is an edge");
            }
        }

        CHECK(pred[5] == -1, "the isolated vertex is the only -1 left");
        free(pred);
        GraphFree(g);
    }

    /* ---------------------------------------------------------------- */
    SECTION("self-reachability: a vertex the backend may give a self-loop");
    {
        Graph g = GraphNew(1);
        GraphInsertEdge(g, 0, 0);
        bool loopsAccepted = GraphIsAdjacent(g, 0, 0);
        printf("   backend %s self-loops; nE = %d\n",
               loopsAccepted ? "ACCEPTS" : "REJECTS", GraphNumEdges(g));

        int *pred = bfs(g, 0);
        Vertex path[1];
        CHECK(pred[0] == 0,
              "the root stays its own predecessor whether or not a loop exists");
        CHECK(bfsReached(pred, 1, 0), "the source reaches itself");
        CHECK(bfsFindPath(pred, 1, 0, 0, path) == 1,
              "the source-to-source path is one vertex, never a loop edge");
        free(pred);
        GraphFree(g);
    }

    /* ---------------------------------------------------------------- */
    SECTION("the consumer refuses a malformed predecessor array");
    {
        int bad[3] = {1, 2, 0};     /* a cycle; no vertex is its own root */
        Vertex path[3];
        CHECK(bfsFindPath(bad, 3, 0, 2, path) == -1,
              "a predecessor array that is not bfs(g, src) is rejected");

        int seeded[3] = {0, 2, 1};  /* root is correct, but 1 and 2 cycle */
        CHECK(bfsFindPath(seeded, 3, 0, 1, path) == -1,
              "a predecessor cycle is detected instead of looping forever");

        int outOfRange[2] = {0, 7};
        CHECK(bfsFindPath(outOfRange, 2, 0, 1, path) == -1,
              "an out-of-range predecessor entry is rejected");
        CHECK(bfsFindPath(seeded, 3, 0, 9, path) == -1,
              "an out-of-range destination is rejected");
    }

    return testReport("test_bfs");
}
