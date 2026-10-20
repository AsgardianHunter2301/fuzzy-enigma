/*
 * test_mst.c - BRG-03 and BRG-04. Driver for the corrected Kruskal and Prim
 * bridges and their explicit result contract.
 *
 * Under test: success and "no spanning tree" are distinguishable without
 * inspecting the returned graph; a partial result is identified as a forest and
 * never as an MST; the singleton case succeeds with zero edges and zero weight;
 * ownership is a single MstResultFree call on every path.
 *
 * The total weight is checked against a brute-force oracle that enumerates
 * every edge subset of size nV - 1 and keeps the cheapest spanning one, so no
 * particular tree is required - only the minimum cost, which is what is
 * well defined when several minimum spanning trees exist.
 *
 * Backend: the supplied weighted UNDIRECTED adjacency list (double weights,
 * zero and fractional weights accepted, self-loops accepted).
 */
#include <stdbool.h>
#include <stdlib.h>

#include "bridges_weighted.h"
#include "testing.h"
#include "wgraph.h"

/* ---- brute-force independent oracle ---------------------------------- */

static int ufFind(int parent[], int v) {
    while (parent[v] != v) v = parent[v];
    return v;
}

/* True when some subset of nV-1 edges spans the graph; *best gets the minimum
 * total weight of such a subset. */
static bool oracleMinSpanningWeight(const Edge *edges, int nE, int nV,
                                    Weight *best) {
    if (nV < 1 || nE > 20) return false;
    int need = nV - 1;
    bool found = false;
    Weight bestWeight = 0.0;

    for (unsigned long mask = 0; mask < (1UL << nE); mask++) {
        int chosen = 0;
        for (int i = 0; i < nE; i++) {
            if (mask & (1UL << i)) chosen++;
        }
        if (chosen != need) continue;

        int *parent = malloc((size_t) nV * sizeof(*parent));
        if (parent == NULL) exit(EXIT_FAILURE);
        for (int v = 0; v < nV; v++) parent[v] = v;

        bool acyclic = true;
        Weight total = 0.0;
        for (int i = 0; i < nE && acyclic; i++) {
            if (!(mask & (1UL << i))) continue;
            int a = ufFind(parent, edges[i].v);
            int b = ufFind(parent, edges[i].w);
            if (a == b) {
                acyclic = false;        /* a cycle, or a self-loop */
            } else {
                parent[a] = b;
                total += edges[i].weight;
            }
        }

        if (acyclic) {
            int roots = 0;
            for (int v = 0; v < nV; v++) {
                if (ufFind(parent, v) == v) roots++;
            }
            if (roots == 1 && (!found || total < bestWeight)) {
                found = true;
                bestWeight = total;
            }
        }
        free(parent);
    }

    if (found) *best = bestWeight;
    return found;
}

static void describe(const char *name, MstResult r) {
    printf("   %-24s status=%-26s nV=%d nE=%d components=%d total=%g\n",
           name, MstStatusName(r.status), r.nVertices, r.nEdges,
           r.nComponents, r.totalWeight);
}

/* Total weight re-derived from the returned tree, independently of the
 * accumulator the bridge kept. */
static Weight treeWeight(WeightedGraph tree) {
    int nE = 0;
    Edge *edges = WGraphEdges(tree, &nE);
    Weight total = 0.0;
    for (int i = 0; i < nE; i++) total += edges[i].weight;
    free(edges);
    return total;
}

static void checkAgainstOracle(WeightedGraph g, const char *label) {
    int nV = WGraphNumVertices(g);
    int nE = 0;
    Edge *edges = WGraphEdges(g, &nE);
    Weight oracle = 0.0;
    bool spanning = oracleMinSpanningWeight(edges, nE, nV, &oracle);
    free(edges);

    MstResult k = kruskalMst(g);
    MstResult p = primMst(g);
    describe("kruskal", k);
    describe("prim", p);

    CHECK((k.status == MST_SPANNING_TREE) == spanning,
          "kruskal status agrees with the brute-force oracle");
    CHECK((p.status == MST_SPANNING_TREE) == spanning,
          "prim status agrees with the brute-force oracle");

    if (spanning) {
        CHECK(NEARLY(k.totalWeight, oracle),
              "kruskal total weight is the minimum the oracle found");
        CHECK(NEARLY(p.totalWeight, oracle),
              "prim total weight is the minimum the oracle found");
        CHECK(k.nEdges == nV - 1, "a spanning tree has nV-1 edges");
        CHECK(p.nEdges == nV - 1, "a spanning tree has nV-1 edges");
        CHECK(k.nComponents == 1 && p.nComponents == 1,
              "a spanning tree has one component");
        CHECK(NEARLY(treeWeight(k.tree), k.totalWeight),
              "the returned kruskal tree carries the reported weight");
        CHECK(NEARLY(treeWeight(p.tree), p.totalWeight),
              "the returned prim tree carries the reported weight");
    }

    printf("   (%s)\n", label);
    MstResultFree(&k);
    MstResultFree(&p);
    CHECK(k.tree == NULL && p.tree == NULL,
          "MstResultFree clears the owned handle");
}

int main(void) {
    printf("test_mst (BRG-03, BRG-04) backend: %s\n", WGraphBackendName());
    CHECK(WGraphIsUndirected(), "the MST bridges need an undirected backend");

    SECTION("connected, with zero and fractional weights");
    {
        WeightedGraph g = WGraphNew(5);
        WGraphInsertEdge(g, 0, 1, 0.5);
        WGraphInsertEdge(g, 1, 2, 0.25);
        WGraphInsertEdge(g, 0, 2, 2.0);
        WGraphInsertEdge(g, 2, 3, 0.0);     /* a zero weight is a real weight */
        WGraphInsertEdge(g, 3, 4, 1.5);
        WGraphInsertEdge(g, 1, 4, 1.75);
        CHECK(WGraphNumEdges(g) == 6, "all six edges were stored once each");
        checkAgainstOracle(g, "connected, fractional and zero weights");
        WGraphFree(g);
    }

    SECTION("connected with tied weights: cost is fixed, the tree is not");
    {
        WeightedGraph g = WGraphNew(4);
        WGraphInsertEdge(g, 0, 1, 1.0);
        WGraphInsertEdge(g, 1, 2, 1.0);
        WGraphInsertEdge(g, 2, 3, 1.0);
        WGraphInsertEdge(g, 3, 0, 1.0);
        checkAgainstOracle(g, "four equal-cost spanning trees, same total");
        WGraphFree(g);
    }

    SECTION("the audited disconnected case: three vertices, one edge");
    {
        WeightedGraph g = WGraphNew(3);
        WGraphInsertEdge(g, 0, 1, 1.0);

        MstResult k = kruskalMst(g);
        MstResult p = primMst(g);
        describe("kruskal", k);
        describe("prim", p);

        CHECK(k.status == MST_NO_SPANNING_TREE,
              "kruskal reports no spanning tree explicitly");
        CHECK(p.status == MST_NO_SPANNING_TREE,
              "prim reports no spanning tree explicitly");
        CHECK(k.nComponents == 2 && p.nComponents == 2,
              "the forest has two components");
        CHECK(k.nEdges == 1, "kruskal's forest keeps the one usable edge");
        CHECK(p.nEdges == 1, "prim grew one edge from vertex 0 and stopped");
        MstResultFree(&k);
        MstResultFree(&p);
        WGraphFree(g);
    }

    SECTION("disconnected with the edge away from vertex 0");
    {
        /* Documents the declared difference between the two forests: Kruskal's
         * covers every component, Prim's only the component of vertex 0. */
        WeightedGraph g = WGraphNew(3);
        WGraphInsertEdge(g, 1, 2, 4.0);

        MstResult k = kruskalMst(g);
        MstResult p = primMst(g);
        describe("kruskal", k);
        describe("prim", p);

        CHECK(k.status == MST_NO_SPANNING_TREE && p.status == MST_NO_SPANNING_TREE,
              "both report no spanning tree");
        CHECK(k.nEdges == 1 && NEARLY(k.totalWeight, 4.0),
              "kruskal's minimum spanning forest spans the far component");
        CHECK(p.nEdges == 0 && NEARLY(p.totalWeight, 0.0),
              "prim's forest is empty: no edge touches vertex 0");
        CHECK(k.nComponents == 2 && p.nComponents == 3,
              "the component counts describe the two different forests");
        MstResultFree(&k);
        MstResultFree(&p);
        WGraphFree(g);
    }

    SECTION("singleton: one vertex is a spanning tree with no edges");
    {
        WeightedGraph g = WGraphNew(1);
        MstResult k = kruskalMst(g);
        MstResult p = primMst(g);
        describe("kruskal", k);
        describe("prim", p);

        CHECK(k.status == MST_SPANNING_TREE, "kruskal: V=1 succeeds");
        CHECK(p.status == MST_SPANNING_TREE, "prim: V=1 succeeds");
        CHECK(k.nEdges == 0 && p.nEdges == 0, "with zero edges");
        CHECK(NEARLY(k.totalWeight, 0.0) && NEARLY(p.totalWeight, 0.0),
              "and total weight zero");
        CHECK(k.nComponents == 1 && p.nComponents == 1, "one component");
        MstResultFree(&k);
        MstResultFree(&p);
        WGraphFree(g);
    }

    SECTION("singleton with a self-loop: still a zero-edge spanning tree");
    {
        WeightedGraph g = WGraphNew(1);
        WGraphInsertEdge(g, 0, 0, 3.0);
        CHECK(WGraphIsAdjacent(g, 0, 0) && WGraphNumEdges(g) == 1,
              "the backend accepted and counted the self-loop");

        MstResult k = kruskalMst(g);
        MstResult p = primMst(g);
        CHECK(k.status == MST_SPANNING_TREE && k.nEdges == 0 &&
                  NEARLY(k.totalWeight, 0.0),
              "kruskal cannot put a loop in a tree");
        CHECK(p.status == MST_SPANNING_TREE && p.nEdges == 0 &&
                  NEARLY(p.totalWeight, 0.0),
              "prim cannot put a loop in a tree");
        MstResultFree(&k);
        MstResultFree(&p);
        WGraphFree(g);
    }

    SECTION("a self-loop beside real edges is ignored");
    {
        WeightedGraph g = WGraphNew(3);
        WGraphInsertEdge(g, 0, 0, 0.125);   /* cheapest edge, and unusable */
        WGraphInsertEdge(g, 0, 1, 1.0);
        WGraphInsertEdge(g, 1, 2, 2.0);
        CHECK(WGraphNumEdges(g) == 3, "the loop is stored and counted");

        MstResult k = kruskalMst(g);
        CHECK(k.status == MST_SPANNING_TREE, "a spanning tree still exists");
        CHECK(k.nEdges == 2 && NEARLY(k.totalWeight, 3.0),
              "the loop is not chosen even though it is the cheapest edge");
        MstResultFree(&k);
        WGraphFree(g);
    }

    SECTION("no vertices: reported as no spanning tree, not a vacuous success");
    {
        WeightedGraph g = WGraphNew(0);
        MstResult k = kruskalMst(g);
        MstResult p = primMst(g);
        CHECK(k.status == MST_NO_SPANNING_TREE && p.status == MST_NO_SPANNING_TREE,
              "an empty graph has nothing to span");
        CHECK(k.nComponents == 0 && p.nComponents == 0, "and no components");
        MstResultFree(&k);
        MstResultFree(&p);
        WGraphFree(g);
    }

    SECTION("a bank of generated graphs against the oracle");
    {
        const Edge pool[6] = {
            {0, 1, 1.5}, {0, 2, 0.5}, {1, 2, 2.25},
            {2, 3, 1.0}, {1, 3, 3.0}, {0, 3, 0.75}
        };
        for (unsigned mask = 0; mask < 64; mask++) {
            WeightedGraph g = WGraphNew(4);
            for (int i = 0; i < 6; i++) {
                if (mask & (1u << i)) {
                    WGraphInsertEdge(g, pool[i].v, pool[i].w, pool[i].weight);
                }
            }
            int nE = 0;
            Edge *edges = WGraphEdges(g, &nE);
            Weight oracle = 0.0;
            bool spanning = oracleMinSpanningWeight(edges, nE, 4, &oracle);
            free(edges);

            MstResult k = kruskalMst(g);
            MstResult p = primMst(g);
            CHECK((k.status == MST_SPANNING_TREE) == spanning,
                  "generated case: kruskal status matches the oracle");
            CHECK((p.status == MST_SPANNING_TREE) == spanning,
                  "generated case: prim status matches the oracle");
            if (spanning) {
                CHECK(NEARLY(k.totalWeight, oracle),
                      "generated case: kruskal cost is minimal");
                CHECK(NEARLY(p.totalWeight, oracle),
                      "generated case: prim cost is minimal");
            }
            MstResultFree(&k);
            MstResultFree(&p);
            WGraphFree(g);
        }
    }

    return testReport("test_mst");
}
