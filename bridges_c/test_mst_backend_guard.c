/*
 * test_mst_backend_guard.c - the documented backend-selection guard.
 *
 * EXPECTED OUTCOME: this executable must TERMINATE WITH A NON-ZERO STATUS. A
 * minimum spanning tree is only defined for an undirected graph, so kruskalMst
 * refuses a directed backend instead of returning a plausible wrong answer.
 * build.sh records the non-zero status as the expected result and fails the
 * build if the program returns 0.
 *
 * Because the guard exits with the graph still allocated, the sanitizer run for
 * this one executable sets ASAN_OPTIONS=detect_leaks=0: the live allocation at
 * a deliberate exit is not a leak defect.
 */
#include <stdio.h>

#include "bridges_weighted.h"
#include "wgraph.h"

int main(void) {
    printf("backend: %s (undirected = %s)\n",
           WGraphBackendName(), WGraphIsUndirected() ? "yes" : "no");

    WeightedGraph g = WGraphNew(2);
    WGraphInsertEdge(g, 0, 1, 1.0);

    MstResult r = kruskalMst(g);   /* must not return */

    printf("UNEXPECTED: kruskalMst returned %s on a directed backend\n",
           MstStatusName(r.status));
    MstResultFree(&r);
    WGraphFree(g);
    return 0;                       /* reaching this line is the failure */
}
