/*
 * graph_unweighted.h - declared Graph API shared by the unweighted bridges.
 *
 * SOURCE LABEL: SUPPLEMENTAL ADAPTER (authored for the remediation; not
 * course source and not a quotation of the manual).
 *
 * This header only *declares* the unweighted Graph API that the supplemental
 * bridges already assume. Exactly one backend translation unit must be linked
 * into each executable, because every alternative Graph implementation in
 * ../memorise_graph_c defines the same external names and so they are compiled
 * one at a time:
 *
 *   adt_undirected_adjlist.c       supplied undirected adjacency list
 *                                  (REJECTS self-loops: v == w is a no-op)
 *   adt_manual_undirected_matrix.c displayed manual undirected adjacency matrix
 *                                  (ACCEPTS and counts self-loops)
 *   adt_directed_matrix.c          supplied directed adjacency matrix
 *                                  (ACCEPTS and counts self-loops; arcs only)
 *
 * Contract common to all three backends:
 *   - Vertices are the integers 0 .. GraphNumVertices(g) - 1. Passing anything
 *     else is a programming error and is caught by assert() in the backend.
 *   - nE counts stored edges: one count per undirected edge in the undirected
 *     backends, one per arc in the directed backend.
 *   - A duplicate insertion of an existing edge is a no-op.
 *   - GraphNew returns an owning handle; the caller must call GraphFree exactly
 *     once. GraphFree releases every allocation the graph owns.
 *   - Self-loops: see each backend above. The bridges must behave correctly for
 *     a backend that accepts loops (see BRG-06) and must not assume loops are
 *     impossible.
 */
#ifndef BRIDGES_C_GRAPH_UNWEIGHTED_H
#define BRIDGES_C_GRAPH_UNWEIGHTED_H

#include <stdbool.h>

typedef struct graph *Graph;
typedef int Vertex;

Graph GraphNew(int nV);
void GraphFree(Graph g);
int GraphNumVertices(Graph g);
int GraphNumEdges(Graph g);
bool GraphIsAdjacent(Graph g, Vertex v, Vertex w);
void GraphInsertEdge(Graph g, Vertex v, Vertex w);
void GraphRemoveEdge(Graph g, Vertex v, Vertex w);
void GraphShow(Graph g);

#endif /* BRIDGES_C_GRAPH_UNWEIGHTED_H */
