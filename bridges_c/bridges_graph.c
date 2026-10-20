/*
 * bridges_graph.c - see bridges_graph.h.
 *
 * SOURCE LABEL: SUPPLEMENTAL C conversion of 26T2 manual pseudocode. The
 * pseudocode is in the manual; this C is not. Learn it separately.
 *
 * The function bodies below are the exact text displayed by the app for the
 * bridges bfs, dfs, undirected-cycle, components, hamiltonian-path,
 * hamiltonian-circuit and warshall. The original, incomplete bodies are
 * preserved unmodified in original/ so the correction stays identifiable.
 */
#include "bridges_graph.h"

#include <stdio.h>
#include <stdlib.h>

#include "queue.h"

/* ========================================================================
 * BRG-01  Breadth-first search
 * ======================================================================== */

/* DECLARED WORKING CONVENTION - the root is its own predecessor.
 *
 *   predecessor[src] == src   src is the search root
 *   predecessor[w]   == -1    w was never reached from src
 *   predecessor[w]   == v     w was first reached from v
 *
 * so -1 means "unreachable" and nothing else, and predecessor[] is the only
 * record of which vertices have been reached. This is the convention printed in
 * the 26T2 manual pseudocode ("predecessor[src] = src", then "for each
 * neighbour w of v in G where predecessor[w] = -1") and the convention the
 * app's active BFS trace executes.
 *
 * CORRECTION NOTE (BRG-01): the earlier conversion kept a separate visited[]
 * array and never assigned predecessor[src], so the root stayed at -1 and -1
 * meant both "this is the root" and "this vertex was never reached". The two
 * cases cannot be told apart by a path consumer, and the lesson executed the
 * other convention. Seeding predecessor[src] = src and using predecessor[] as
 * the reached-marker removes the second meaning of -1, matches the pseudocode
 * line for line, and leaves the visited bookkeeping with exactly one owner. */
int *bfs(Graph g, Vertex src) {
    int nV = GraphNumVertices(g);
    int *predecessor = malloc(nV * sizeof(*predecessor));
    if (predecessor == NULL) exit(EXIT_FAILURE);

    for (Vertex v = 0; v < nV; v++) predecessor[v] = -1;

    Queue q = QueueNew();
    predecessor[src] = src;
    QueueEnqueue(q, src);

    while (QueueSize(q) > 0) {
        Vertex v = QueueDequeue(q);
        for (Vertex w = 0; w < nV; w++) {
            if (GraphIsAdjacent(g, v, w) && predecessor[w] == -1) {
                predecessor[w] = v;
                QueueEnqueue(q, w);
            }
        }
    }

    QueueFree(q);
    return predecessor;  // caller frees this array
}

bool bfsReached(const int *predecessor, int nV, Vertex v) {
    if (v < 0 || v >= nV) return false;
    return predecessor[v] != -1;
}

int bfsFindPath(const int *predecessor, int nV, Vertex src, Vertex dest,
                Vertex path[]) {
    if (src < 0 || src >= nV || dest < 0 || dest >= nV) return -1;
    if (predecessor[src] != src) return -1;   // not the array bfs(g, src) built
    if (predecessor[dest] == -1) return 0;    // dest was never reached

    int length = 0;
    Vertex v = dest;
    while (v != src) {
        if (length >= nV) return -1;          // malformed: no path is invented
        path[length++] = v;
        Vertex p = predecessor[v];
        if (p < 0 || p >= nV) return -1;      // malformed predecessor entry
        v = p;
    }
    path[length++] = src;

    for (int i = 0, j = length - 1; i < j; i++, j--) {
        Vertex t = path[i];
        path[i] = path[j];
        path[j] = t;
    }
    return length;
}

/* ========================================================================
 * Depth-first search - reviewed, unchanged
 * ======================================================================== */

static void dfsRec(Graph g, Vertex v, bool visited[]) {
    visited[v] = true;

    int nV = GraphNumVertices(g);
    for (Vertex w = 0; w < nV; w++) {
        if (GraphIsAdjacent(g, v, w) && !visited[w]) {
            dfsRec(g, w, visited);
        }
    }
}

bool *dfs(Graph g, Vertex src) {
    int nV = GraphNumVertices(g);
    bool *visited = calloc(nV, sizeof(*visited));
    if (visited == NULL) exit(EXIT_FAILURE);

    dfsRec(g, src, visited);
    return visited;  // caller frees this array
}

/* ------------------------------------------------------------------ NEW-15 */
/* DFS path checking and path finding.
 *
 * The dfs bridge's token list registered this conversion as the C for the
 * recursive DFS path pseudocode (dfsHasPath / dfsFindPath) while its body
 * supplied neither routine, so the registered claim could not be honoured.
 * Deleting the claim would have removed the lesson; these are the conversions
 * the claim names.
 *
 * Declared convention, deliberately IDENTICAL to the BFS bridge so the two
 * lessons can be compared line for line:
 *     predecessor[src] == src   src is the search root
 *     predecessor[w]   == -1    w has not been reached
 * The recursion writes a vertex's predecessor BEFORE descending into it. That
 * write is what stops the search revisiting a vertex, and it is why -1 keeps
 * exactly one meaning. The predecessor array is built and released inside each
 * entry point, matching the pseudocode, which creates it in dfsFindPath.
 *
 * DFS reports the FIRST path it finds under neighbour order. It is NOT the
 * shortest path - that is the BFS bridge's job, and the difference between the
 * two is the reason both are taught. The conversion is recursive because the
 * pseudocode is; depth is bounded by the number of vertices. */
static bool dfsFindPathRec(Graph g, Vertex v, Vertex dest, int predecessor[]) {
    if (v == dest) return true;

    int nV = GraphNumVertices(g);
    for (Vertex w = 0; w < nV; w++) {
        if (GraphIsAdjacent(g, v, w) && predecessor[w] == -1) {
            predecessor[w] = v;
            if (dfsFindPathRec(g, w, dest, predecessor)) return true;
        }
    }
    return false;
}

static int *dfsPredecessorNew(int nV, Vertex src) {
    int *predecessor = malloc(nV * sizeof(*predecessor));
    if (predecessor == NULL) exit(EXIT_FAILURE);
    for (Vertex v = 0; v < nV; v++) predecessor[v] = -1;
    predecessor[src] = src;
    return predecessor;
}

bool dfsHasPath(Graph g, Vertex src, Vertex dest) {
    int nV = GraphNumVertices(g);
    if (src < 0 || src >= nV || dest < 0 || dest >= nV) return false;

    int *predecessor = dfsPredecessorNew(nV, src);
    bool found = dfsFindPathRec(g, src, dest, predecessor);
    free(predecessor);
    return found;
}

int dfsFindPath(Graph g, Vertex src, Vertex dest, Vertex path[]) {
    int nV = GraphNumVertices(g);
    if (src < 0 || src >= nV || dest < 0 || dest >= nV) return -1;

    int *predecessor = dfsPredecessorNew(nV, src);
    int length = 0;

    if (dfsFindPathRec(g, src, dest, predecessor)) {
        /* Trace backwards from dest, exactly as the pseudocode's last line
         * says. The nV bound is not decoration: it keeps a malformed array
         * from looping forever, and -1 is returned rather than a path being
         * invented. */
        Vertex v = dest;
        while (v != src) {
            if (length >= nV) { free(predecessor); return -1; }
            path[length++] = v;
            Vertex p = predecessor[v];
            if (p < 0 || p >= nV) { free(predecessor); return -1; }
            v = p;
        }
        path[length++] = src;

        for (int i = 0, j = length - 1; i < j; i++, j--) {
            Vertex t = path[i];
            path[i] = path[j];
            path[j] = t;
        }
    }

    free(predecessor);
    return length;  /* 0 when dest was never reached from src */
}

/* ========================================================================
 * BRG-06  Undirected cycle checking
 * ======================================================================== */

/* NO_PARENT is a sentinel that cannot collide with a real vertex, because every
 * vertex is in 0 .. nV - 1. The parent-edge exclusion must skip the single edge
 * the search arrived on, and nothing else.
 *
 * CORRECTION NOTE (BRG-06): the earlier conversion started each root with
 * dfsHasCycle(g, v, v, visited), so prev was the root's own id. The loop body
 * then skipped w == prev, which at the root means skipping the vertex itself,
 * so an edge (v, v) was never examined. On a Graph backend that accepts and
 * counts self-loops - the displayed manual adjacency-matrix ADT does, where
 * GraphNew(1) plus GraphInsertEdge(g, 0, 0) gives nE == 1 and
 * GraphIsAdjacent(g, 0, 0) == true - hasCycle returned false although a loop at
 * a vertex is a cycle. Using NO_PARENT at the root, and recognising w == v as a
 * self-loop before the parent test, fixes the composition without narrowing the
 * Graph contract: ordinary simple-graph behaviour is unchanged, since a simple
 * graph has no v with GraphIsAdjacent(g, v, v).
 *
 * The browser's graph input parser rejects self-loops separately. This defect
 * was in the C composition of the supplemental bridge with the supplied Graph
 * ADT, not in any UI input path. */
#define NO_PARENT (-1)

static bool dfsHasCycle(Graph g, Vertex v, Vertex prev, bool visited[]) {
    visited[v] = true;
    int nV = GraphNumVertices(g);

    for (Vertex w = 0; w < nV; w++) {
        if (!GraphIsAdjacent(g, v, w)) continue;
        if (w == v) return true;            // a self-loop is a cycle
        if (w == prev) continue;            // the edge this search arrived on
        if (visited[w]) return true;
        if (dfsHasCycle(g, w, v, visited)) return true;
    }
    return false;
}

bool hasCycle(Graph g) {
    int nV = GraphNumVertices(g);
    bool *visited = calloc(nV, sizeof(*visited));
    if (visited == NULL) exit(EXIT_FAILURE);

    bool found = false;
    for (Vertex v = 0; v < nV && !found; v++) {
        if (!visited[v]) found = dfsHasCycle(g, v, NO_PARENT, visited);
    }

    free(visited);
    return found;
}

/* ========================================================================
 * Connected components - reviewed, unchanged
 * ======================================================================== */

static void dfsComponents(Graph g, Vertex v, int componentOf[], int compNo) {
    componentOf[v] = compNo;
    int nV = GraphNumVertices(g);

    for (Vertex w = 0; w < nV; w++) {
        if (GraphIsAdjacent(g, v, w) && componentOf[w] == -1) {
            dfsComponents(g, w, componentOf, compNo);
        }
    }
}

int *components(Graph g) {
    int nV = GraphNumVertices(g);
    int *componentOf = malloc(nV * sizeof(*componentOf));
    if (componentOf == NULL) exit(EXIT_FAILURE);
    for (Vertex v = 0; v < nV; v++) componentOf[v] = -1;

    int compNo = 0;
    for (Vertex v = 0; v < nV; v++) {
        if (componentOf[v] == -1) {
            dfsComponents(g, v, componentOf, compNo);
            compNo++;
        }
    }
    return componentOf;  // caller frees this array
}

/* ========================================================================
 * Hamiltonian path and circuit - reviewed, unchanged
 * ======================================================================== */

static bool dfsHamiltonianPath(Graph g, Vertex v,
                               bool visited[], int verticesLeft) {
    visited[v] = true;
    verticesLeft--;
    if (verticesLeft == 0) return true;

    int nV = GraphNumVertices(g);
    for (Vertex w = 0; w < nV; w++) {
        if (GraphIsAdjacent(g, v, w) && !visited[w]) {
            if (dfsHamiltonianPath(g, w, visited, verticesLeft)) return true;
        }
    }

    visited[v] = false;
    return false;
}

bool hasHamiltonianPath(Graph g) {
    int nV = GraphNumVertices(g);
    bool *visited = calloc(nV, sizeof(*visited));
    if (visited == NULL) exit(EXIT_FAILURE);

    bool found = false;
    for (Vertex v = 0; v < nV && !found; v++) {
        found = dfsHamiltonianPath(g, v, visited, nV);
    }
    free(visited);
    return found;
}

static bool dfsHamiltonianCircuit(Graph g, Vertex v,
                                  bool visited[], int verticesLeft) {
    visited[v] = true;
    verticesLeft--;

    if (verticesLeft == 0 && GraphIsAdjacent(g, v, 0)) return true;

    int nV = GraphNumVertices(g);
    for (Vertex w = 0; w < nV; w++) {
        if (GraphIsAdjacent(g, v, w) && !visited[w]) {
            if (dfsHamiltonianCircuit(g, w, visited, verticesLeft)) return true;
        }
    }

    visited[v] = false;
    return false;
}

bool hasHamiltonianCircuit(Graph g) {
    int nV = GraphNumVertices(g);
    if (nV < 3) return false;

    bool *visited = calloc(nV, sizeof(*visited));
    if (visited == NULL) exit(EXIT_FAILURE);
    bool found = dfsHamiltonianCircuit(g, 0, visited, nV);
    free(visited);
    return found;
}

/* ========================================================================
 * BRG-02  Warshall transitive closure
 * ======================================================================== */

/* DECLARED WORKING CONVENTION - positive-length reachability.
 *
 * tc[v][w] is true exactly when a walk of ONE OR MORE arcs runs from v to w, so
 * tc[v][v] is true only when v lies on a cycle (a self-loop counts). tc starts
 * as a plain copy of the adjacency matrix. This is the definition printed in
 * the 26T2 manual pseudocode ("create tc matrix which is a copy of A") and the
 * definition the app's active Warshall trace executes: on a two-vertex graph
 * with no arcs every entry, including the diagonal, is false.
 *
 * CORRECTION NOTE (BRG-02): the earlier conversion initialised
 * tc[v][w] = (v == w) || GraphIsAdjacent(g, v, w), i.e. the REFLEXIVE closure,
 * whose diagonal is true for every vertex. On the same empty two-vertex graph
 * it returned the identity matrix while the lesson it accompanies returned the
 * all-false matrix. Both closures are valid mathematics; teaching one while
 * executing the other is the defect. The reflexive contract is still available,
 * separately and by name, as warshallReflexive() below. */
bool **warshall(Graph g) {
    int nV = GraphNumVertices(g);
    bool **tc = malloc(nV * sizeof(*tc));
    if (tc == NULL) exit(EXIT_FAILURE);

    for (Vertex v = 0; v < nV; v++) {
        tc[v] = malloc(nV * sizeof(*tc[v]));
        if (tc[v] == NULL) exit(EXIT_FAILURE);
        for (Vertex w = 0; w < nV; w++) {
            tc[v][w] = GraphIsAdjacent(g, v, w);
        }
    }

    for (Vertex k = 0; k < nV; k++) {
        for (Vertex i = 0; i < nV; i++) {
            for (Vertex j = 0; j < nV; j++) {
                tc[i][j] = tc[i][j] || (tc[i][k] && tc[k][j]);
            }
        }
    }
    return tc;  // caller frees this matrix with warshallFree(tc, nV)
}

/* ALTERNATIVE CONTRACT, not the working lesson convention: walks of ZERO or
 * more arcs, so every vertex reaches itself by definition. */
bool **warshallReflexive(Graph g) {
    int nV = GraphNumVertices(g);
    bool **tc = warshall(g);
    for (Vertex v = 0; v < nV; v++) tc[v][v] = true;
    return tc;  // caller frees this matrix with warshallFree(tc, nV)
}

void warshallFree(bool **tc, int nV) {
    if (tc == NULL) return;
    for (Vertex v = 0; v < nV; v++) free(tc[v]);
    free(tc);
}
