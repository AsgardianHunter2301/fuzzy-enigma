/*
 * test_dijkstra.c - BRG-05 (weighted dependencies and numeric domain). Driver
 * for the corrected Dijkstra bridge, the weighted-graph helper API it needs,
 * and the path reconstruction consumer.
 *
 * Under test: double weights with zero and fractional values survive; the
 * missing-edge sentinel is never confused with a real weight (a 0.0-weight edge
 * is an edge); unreachable means WGRAPH_INFINITY rather than a large int;
 * dist[src] == 0 with pred[src] == -1 as declared; distances match an
 * independent Bellman-Ford oracle.
 *
 * Backend: the supplied weighted DIRECTED adjacency list, which is what the
 * Dijkstra lesson's directed arc input corresponds to.
 */
#include <stdbool.h>
#include <stdlib.h>

#include "bridges_weighted.h"
#include "testing.h"
#include "wgraph.h"

/* Independent oracle: Bellman-Ford over the same arcs, in double arithmetic. */
static void bellmanFord(WeightedGraph g, Vertex src, Weight dist[]) {
    int nV = WGraphNumVertices(g);
    int nE = 0;
    Edge *edges = WGraphEdges(g, &nE);

    for (Vertex v = 0; v < nV; v++) dist[v] = WGRAPH_INFINITY;
    dist[src] = 0.0;

    for (int round = 0; round < nV; round++) {
        for (int i = 0; i < nE; i++) {
            Vertex v = edges[i].v;
            Vertex w = edges[i].w;
            if (dist[v] != WGRAPH_INFINITY &&
                dist[v] + edges[i].weight < dist[w]) {
                dist[w] = dist[v] + edges[i].weight;
            }
        }
    }
    free(edges);
}

int main(void) {
    printf("test_dijkstra (BRG-05) backend: %s\n", WGraphBackendName());
    CHECK(!WGraphIsUndirected(), "this driver selected the directed backend");

    SECTION("the missing-edge contract never collides with a real weight");
    {
        WeightedGraph g = WGraphNew(3);
        WGraphInsertEdge(g, 0, 1, 0.0);     /* a genuine zero-weight arc */

        Weight out = -1.0;
        CHECK(WGraphEdgeWeight(g, 0, 1, &out), "the zero-weight arc exists");
        CHECK(NEARLY(out, 0.0), "and its weight is 0.0, not 'absent'");
        CHECK(NEARLY(WGraphWeight(g, 0, 1), 0.0),
              "the sentinel form also reports 0.0 for that arc");

        out = 42.0;
        CHECK(!WGraphEdgeWeight(g, 1, 0, &out),
              "the reverse arc does not exist on a directed backend");
        CHECK(NEARLY(out, 42.0), "a failed query does not touch the out value");
        CHECK(WGraphWeight(g, 1, 0) == WGRAPH_NO_EDGE,
              "the sentinel form reports WGRAPH_NO_EDGE");
        CHECK(WGRAPH_NO_EDGE != 0.0 && WGRAPH_NO_EDGE > 0.0,
              "the sentinel is outside the finite accepted weight domain");
        WGraphFree(g);
    }

    SECTION("fractional weights decide the shortest path");
    {
        /* With int weights and truncation this graph would be a tie or wrong:
         * the two-arc route costs 0.75 and the direct arc costs 1.0. */
        WeightedGraph g = WGraphNew(5);
        WGraphInsertEdge(g, 0, 1, 0.5);
        WGraphInsertEdge(g, 1, 2, 0.25);
        WGraphInsertEdge(g, 0, 2, 1.0);
        WGraphInsertEdge(g, 2, 3, 0.0);
        /* vertex 4 is unreachable */

        Weight dist[5];
        Vertex pred[5];
        dijkstraSSSP(g, 0, dist, pred);

        Weight oracle[5];
        bellmanFord(g, 0, oracle);
        for (Vertex v = 0; v < 5; v++) {
            CHECK(NEARLY(dist[v], oracle[v]) ||
                      (dist[v] == WGRAPH_INFINITY && oracle[v] == WGRAPH_INFINITY),
                  "dist matches the Bellman-Ford oracle");
        }

        CHECK(NEARLY(dist[0], 0.0), "dist[src] is 0");
        CHECK(pred[0] == -1, "pred[src] stays -1 under the declared convention");
        CHECK(NEARLY(dist[2], 0.75),
              "the fractional two-arc route beats the direct arc");
        CHECK(pred[2] == 1, "and the predecessor records that route");
        CHECK(NEARLY(dist[3], 0.75),
              "a zero-weight arc extends a path without adding cost");
        CHECK(dist[4] == WGRAPH_INFINITY,
              "an unreachable vertex keeps the infinity sentinel");

        Vertex path[5];
        int length = dijkstraFindPath(dist, pred, 5, 0, 3, path);
        CHECK(length == 4, "the reconstructed path has four vertices");
        CHECK(path[0] == 0 && path[1] == 1 && path[2] == 2 && path[3] == 3,
              "and lists 0, 1, 2, 3 in order");

        CHECK(dijkstraFindPath(dist, pred, 5, 0, 0, path) == 1,
              "source equals destination gives a one-vertex path");
        CHECK(dijkstraFindPath(dist, pred, 5, 0, 4, path) == 0,
              "an unreachable destination gives no path, not an invented one");
        WGraphFree(g);
    }

    SECTION("the consumer refuses a malformed dist/pred pair");
    {
        Weight dist[3] = {0.0, 1.0, 2.0};
        Vertex pred[3] = {-1, 2, 1};        /* 1 and 2 point at each other */
        Vertex path[3];
        CHECK(dijkstraFindPath(dist, pred, 3, 0, 2, path) == -1,
              "a predecessor cycle is detected instead of looping forever");

        Weight wrongSrc[2] = {5.0, 0.0};
        Vertex anyPred[2] = {-1, 0};
        CHECK(dijkstraFindPath(wrongSrc, anyPred, 2, 0, 1, path) == -1,
              "arrays that do not belong to this source are rejected");
        CHECK(dijkstraFindPath(dist, pred, 3, 0, 9, path) == -1,
              "an out-of-range destination is rejected");
    }

    SECTION("a single vertex, and a vertex with only a self-loop");
    {
        WeightedGraph g = WGraphNew(1);
        WGraphInsertEdge(g, 0, 0, 2.5);
        CHECK(WGraphNumEdges(g) == 1, "the backend counted the self-loop arc");

        Weight dist[1];
        Vertex pred[1];
        dijkstraSSSP(g, 0, dist, pred);
        CHECK(NEARLY(dist[0], 0.0),
              "a self-loop never improves the source's own distance");
        CHECK(pred[0] == -1, "and never becomes the source's predecessor");
        WGraphFree(g);
    }

    SECTION("a bank of generated digraphs against the oracle");
    {
        const Edge pool[6] = {
            {0, 1, 0.5}, {1, 2, 0.25}, {0, 2, 1.0},
            {2, 3, 0.0}, {3, 1, 2.5}, {1, 3, 0.75}
        };
        for (unsigned mask = 0; mask < 64; mask++) {
            WeightedGraph g = WGraphNew(4);
            for (int i = 0; i < 6; i++) {
                if (mask & (1u << i)) {
                    WGraphInsertEdge(g, pool[i].v, pool[i].w, pool[i].weight);
                }
            }
            for (Vertex src = 0; src < 4; src++) {
                Weight dist[4];
                Vertex pred[4];
                Weight oracle[4];
                dijkstraSSSP(g, src, dist, pred);
                bellmanFord(g, src, oracle);

                bool same = true;
                for (Vertex v = 0; v < 4; v++) {
                    bool bothInfinite = dist[v] == WGRAPH_INFINITY &&
                                        oracle[v] == WGRAPH_INFINITY;
                    if (!bothInfinite && !NEARLY(dist[v], oracle[v])) same = false;
                }
                CHECK(same, "generated digraph: dist matches Bellman-Ford");

                /* Every finite distance must be explained by a real path. */
                Vertex path[4];
                for (Vertex v = 0; v < 4; v++) {
                    int length = dijkstraFindPath(dist, pred, 4, src, v, path);
                    if (dist[v] == WGRAPH_INFINITY) {
                        CHECK(length == 0, "unreachable vertices have no path");
                    } else {
                        bool walk = length >= 1 && path[0] == src &&
                                    path[length - 1] == v;
                        Weight total = 0.0;
                        for (int i = 0; i + 1 < length && walk; i++) {
                            Weight weight = WGraphWeight(g, path[i], path[i + 1]);
                            if (weight == WGRAPH_NO_EDGE) walk = false;
                            else total += weight;
                        }
                        CHECK(walk && NEARLY(total, dist[v]),
                              "the reconstructed path exists and costs dist[v]");
                    }
                }
            }
            WGraphFree(g);
        }
    }

    return testReport("test_dijkstra");
}
