/*
 * test_unchanged.c - the bridges that the BRG findings did not change: dfs,
 * components, hamiltonian-path, hamiltonian-circuit and radix-sort.
 *
 * No correctness defect was raised against these bodies. They are compiled and
 * exercised here so that "this bridge is complete, compilable C" is a checked
 * claim and so that a later edit to the shared helpers cannot break them
 * silently. avl-search is covered by test_avl.
 *
 * Backend: the supplied undirected adjacency list.
 */
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

#include "bridges_graph.h"
#include "graph_unweighted.h"
#include "radix_sort.h"
#include "testing.h"

static int symbolIndexLower(Key key, int position) {
    return key[position] - 'a';
}

int main(void) {
    SECTION("dfs reaches exactly the component of its source");
    {
        Graph g = GraphNew(6);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 3, 4);
        /* vertex 5 is isolated */

        bool *visited = dfs(g, 0);
        int *componentOf = components(g);
        bool same = true;
        for (Vertex v = 0; v < 6; v++) {
            if (visited[v] != (componentOf[v] == componentOf[0])) same = false;
        }
        CHECK(same, "dfs visited set equals the source's component");
        CHECK(visited[0] && visited[1] && visited[2],
              "the whole first component is visited");
        CHECK(!visited[3] && !visited[4] && !visited[5],
              "nothing outside it is visited");
        free(visited);
        free(componentOf);
        GraphFree(g);
    }

    SECTION("components numbers every vertex exactly once");
    {
        Graph g = GraphNew(6);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 3, 4);

        int *componentOf = components(g);
        CHECK(componentOf[0] == 0 && componentOf[1] == 0 && componentOf[2] == 0,
              "the first component is numbered 0");
        CHECK(componentOf[3] == 1 && componentOf[4] == 1,
              "the second component is numbered 1");
        CHECK(componentOf[5] == 2, "the isolated vertex is its own component");
        bool assigned = true;
        for (Vertex v = 0; v < 6; v++) {
            if (componentOf[v] < 0) assigned = false;
        }
        CHECK(assigned, "no vertex is left at -1");
        free(componentOf);
        GraphFree(g);

        g = GraphNew(1);
        componentOf = components(g);
        CHECK(componentOf[0] == 0, "one vertex is one component");
        free(componentOf);
        GraphFree(g);
    }

    SECTION("Hamiltonian path and circuit, accepted and rejected cases");
    {
        Graph g = GraphNew(3);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        CHECK(hasHamiltonianPath(g), "a path graph has a Hamiltonian path");
        CHECK(!hasHamiltonianCircuit(g), "but no Hamiltonian circuit");
        GraphFree(g);

        g = GraphNew(3);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 1, 2);
        GraphInsertEdge(g, 2, 0);
        CHECK(hasHamiltonianPath(g) && hasHamiltonianCircuit(g),
              "a triangle has both");
        GraphFree(g);

        g = GraphNew(4);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 0, 2);
        GraphInsertEdge(g, 0, 3);
        CHECK(!hasHamiltonianPath(g), "a three-leaf star has neither");
        CHECK(!hasHamiltonianCircuit(g), "a three-leaf star has no circuit");
        GraphFree(g);

        g = GraphNew(4);
        GraphInsertEdge(g, 0, 1);
        GraphInsertEdge(g, 2, 3);
        CHECK(!hasHamiltonianPath(g), "a disconnected graph has no path");
        GraphFree(g);

        g = GraphNew(1);
        CHECK(hasHamiltonianPath(g), "one vertex is a Hamiltonian path");
        CHECK(!hasHamiltonianCircuit(g),
              "the bridge declines a circuit below three vertices");
        GraphFree(g);
    }

    SECTION("radix sort orders fixed-width keys and preserves the multiset");
    {
        Key keys[6] = {"cab", "abc", "bca", "aaa", "cab", "bbb"};
        Key before[6];
        memcpy(before, keys, sizeof before);

        radixSort(keys, 6, 3, 26, symbolIndexLower);

        bool sorted = true;
        for (int i = 0; i + 1 < 6; i++) {
            if (strcmp(keys[i], keys[i + 1]) > 0) sorted = false;
        }
        CHECK(sorted, "the keys come out in non-decreasing order");

        bool permutation = true;
        for (int i = 0; i < 6; i++) {
            int seenBefore = 0;
            int seenAfter = 0;
            for (int j = 0; j < 6; j++) {
                if (strcmp(before[i], before[j]) == 0) seenBefore++;
                if (strcmp(before[i], keys[j]) == 0) seenAfter++;
            }
            if (seenBefore != seenAfter) permutation = false;
        }
        CHECK(permutation, "every key appears the same number of times");
        CHECK(strcmp(keys[0], "aaa") == 0, "the smallest key is first");
        CHECK(strcmp(keys[5], "cab") == 0, "the largest key is last");

        Key single[1] = {"zzz"};
        radixSort(single, 1, 3, 26, symbolIndexLower);
        CHECK(strcmp(single[0], "zzz") == 0, "a single key is left alone");

        Key none[1] = {"aaa"};
        radixSort(none, 0, 3, 26, symbolIndexLower);
        CHECK(strcmp(none[0], "aaa") == 0, "an empty range touches nothing");
    }

    return testReport("test_unchanged");
}
