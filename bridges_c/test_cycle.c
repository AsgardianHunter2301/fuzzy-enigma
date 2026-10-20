/*
 * test_cycle.c - BRG-06. Driver for the corrected undirected-cycle bridge.
 *
 * Baseline for comparison: the audit reproduction
 * reproduce/curriculum/bridge_cycle_characterisation.c printed
 *   {"nE":1,"selfAdjacent":true,"hasCycle":false}
 * on a one-vertex graph with the edge (0,0) inserted, using the displayed
 * manual adjacency-matrix Graph ADT. The same line is printed below so the
 * before and after can be compared directly. With the corrected bridge the
 * third field must follow the second: whatever the backend accepted, the
 * detector must agree with it.
 *
 * Backend-agnostic: built once against the supplied undirected adjacency list
 * (which rejects self-loops, so nE stays 0 and no cycle is the right answer)
 * and once against the displayed manual adjacency matrix (which accepts and
 * counts them, which is the composition the finding is about). Nothing here
 * narrows the C Graph contract and nothing here concerns the browser's input
 * parser, which rejects self-loops on its own.
 */
#include <stdbool.h>
#include <stdlib.h>

#include "bridges_graph.h"
#include "graph_unweighted.h"
#include "testing.h"

int main(void) {
    SECTION("the audited composition: one vertex, edge (0,0)");
    {
        Graph g = GraphNew(1);
        GraphInsertEdge(g, 0, 0);
        bool selfAdjacent = GraphIsAdjacent(g, 0, 0);
        int nE = GraphNumEdges(g);
        bool cycle = hasCycle(g);

        printf("{\"nE\":%d,\"selfAdjacent\":%s,\"hasCycle\":%s}\n",
               nE, selfAdjacent ? "true" : "false", cycle ? "true" : "false");

        CHECK(cycle == selfAdjacent,
              "a self-loop the ADT accepted is reported as a cycle");
        CHECK(nE == (selfAdjacent ? 1 : 0),
              "nE agrees with what the ADT accepted");
        GraphFree(g);
    }

    SECTION("one vertex, no edges");
    {
        Graph g = GraphNew(1);
        CHECK(!hasCycle(g), "a single isolated vertex has no cycle");
        CHECK(GraphNumEdges(g) == 0, "no edges were inserted");
        GraphFree(g);
    }

    SECTION("zero vertices");
    {
        Graph g = GraphNew(0);
        CHECK(!hasCycle(g), "the empty graph has no cycle");
        GraphFree(g);
    }

    SECTION("ordinary acyclic graphs are unchanged");
    {
        Graph g = GraphNew(2);
        GraphInsertEdge(g, 0, 1);
        CHECK(!hasCycle(g),
              "a single undirected edge is not a cycle (parent edge excluded)");
        GraphFree(g);

        g = GraphNew(4);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 2, 3);
        CHECK(!hasCycle(g), "a path has no cycle");
        GraphFree(g);

        g = GraphNew(5);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 0, 2);
        GraphInsertEdge(g, 3, 4);
        CHECK(!hasCycle(g), "a forest of two trees has no cycle");
        GraphFree(g);
    }

    SECTION("ordinary cyclic graphs are unchanged");
    {
        Graph g = GraphNew(3);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 2, 0);
        CHECK(hasCycle(g), "a triangle is a cycle");
        GraphFree(g);

        g = GraphNew(4);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 2, 3);
        GraphInsertEdge(g, 3, 0);
        CHECK(hasCycle(g), "a four-cycle is a cycle");
        GraphFree(g);

        /* The cycle is in the second component, so it is only found if every
         * root is searched. */
        g = GraphNew(6);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 2, 3);
        GraphInsertEdge(g, 3, 4);
        GraphInsertEdge(g, 4, 2);
        CHECK(hasCycle(g), "a cycle in a later component is still found");
        GraphFree(g);
    }

    SECTION("a self-loop beside ordinary edges, where the backend allows it");
    {
        Graph g = GraphNew(3);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 2, 2);
        bool loopsAccepted = GraphIsAdjacent(g, 2, 2);
        printf("   backend %s self-loops\n",
               loopsAccepted ? "ACCEPTS" : "REJECTS");
        CHECK(hasCycle(g) == loopsAccepted,
              "a loop deep in a tree is a cycle exactly when it was accepted");
        GraphFree(g);
    }

    return testReport("test_cycle");
}
