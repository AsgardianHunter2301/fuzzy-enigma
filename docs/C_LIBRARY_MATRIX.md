# C library matrix - the eleven Graph ADT alternatives

Per-variant register for `memorise_graph_c/*.c`. Human-readable tables first, then the same
data as a machine-readable JSON block so a checker and a reader cannot drift apart.

Generated from the files themselves. Learner-facing explanation: `MEMORISE_GRAPH_C_GUIDE.md`.
Executed evidence: `memorise_graph_c/drivers/RESULTS.txt`.

- **Audit findings addressed:** AUD-14 (documentation overgeneralised the representation
  contracts) and CUR-MOD-02 (unsupported universal memorisation prerequisite).
- **Review depth is stated per row and is not "audited: pass".** A digest proves bytes, a
  successful compile proves it builds, and neither proves the documented semantics. The
  Review column says which of those was actually done, and the Not-reviewed column says what
  was not.

## 1. Identity

| # | File (`memorise_graph_c/`) | Lines | SHA-256 (first 16) |
|---|---|---|---|
| V1 | `COMP2521_memorise_graph_adjacency_list.c` | 231 | `228c928d7a3162eb` |
| V2 | `COMP2521_memorise_graph_edge_array.c` | 194 | `3bfc1ced0b5ec12b` |
| V3 | `COMP2521_memorise_unweighted_directed_adjacency_list.c` | 219 | `af4739e998c3a5c5` |
| V4 | `COMP2521_memorise_unweighted_directed_adjacency_matrix.c` | 160 | `5ead65b0f4299cd8` |
| V5 | `COMP2521_memorise_unweighted_directed_edge_array.c` | 183 | `f38808448a1f6b18` |
| V6 | `COMP2521_memorise_weighted_directed_adjacency_list.c` | 249 | `8f0c7ab927ee36c2` |
| V7 | `COMP2521_memorise_weighted_directed_adjacency_matrix.c` | 189 | `3e472a8bbf973786` |
| V8 | `COMP2521_memorise_weighted_directed_edge_array.c` | 212 | `d540b22cd6c35839` |
| V9 | `COMP2521_memorise_weighted_undirected_adjacency_list.c` | 269 | `efa251bcb8143de4` |
| V10 | `COMP2521_memorise_weighted_undirected_adjacency_matrix.c` | 195 | `9596ce32e374e7ed` |
| V11 | `COMP2521_memorise_weighted_undirected_edge_array.c` | 226 | `19cb0270b1cfd629` |

## 2. Model and storage

| # | Directed | Weight model | C weight type | Representation | Edge storage |
|---|---|---|---|---|---|
| V1 | undirected | unweighted | n/a | adjacency list | TWO symmetric adjacency nodes, one in each endpoint list (GraphInsertEdge L121-122, nE++ at L123) |
| V2 | undirected | unweighted | n/a | edge array (unsorted, dynamic) | ONE record per logical edge, in the order supplied; symmetry is recovered at QUERY time by comparing both endpoint orders (record written at L116; symmetry recovered by the either-order test at L171 inside edgeIndex L168) |
| V3 | directed | unweighted | n/a | adjacency list | ONE node in list[v] per arc (GraphInsertEdge L109) |
| V4 | directed | unweighted | n/a | adjacency matrix of bool | ONE cell edges[v][w] = true (GraphInsertEdge L107) |
| V5 | directed | unweighted | n/a | edge array (unsorted, dynamic) | ONE record per arc; edgeIndex (L159) matches the EXACT (v,w) order only |
| V6 | directed | weighted | `double` | adjacency list | ONE node in list[v] carrying the weight (GraphInsertEdge L122) |
| V7 | directed | weighted | `double` | adjacency matrix of Weight | ONE cell edges[v][w] = weight (GraphInsertEdge L127); every other cell holds NO_EDGE |
| V8 | directed | weighted | `double` | edge array (unsorted, dynamic) | ONE record {v, w, weight} per arc; edgeIndex (L188) matches the EXACT (v,w) order |
| V9 | undirected | weighted | `double` | adjacency list | TWO symmetric nodes for an ordinary edge, but exactly ONE node for a self-loop - the if (v != w) guards at L136 (weight update), L150 (insert, second node at L151) and L164 (removal) |
| V10 | undirected | weighted | `double` | adjacency matrix of Weight | TWO symmetric cells for an ordinary edge, exactly ONE diagonal cell for a self-loop - the if (v != w) guards at L137 (insert) and L150 (removal) |
| V11 | undirected | weighted | `double` | edge array (unsorted, dynamic, canonicalised) | ONE record per logical edge, CANONICALISED so that v <= w by normalise() (L193), applied on insert (L126, record written at L136) and inside every lookup (edgeIndex L201, normalise call at L202) |

## 3. Accepted input and edge-case behaviour

| # | Self-loop | Duplicate insert | `nE` counts | Stored entries |
|---|---|---|---|---|
| V1 | IGNORED - the v == w term of the insert guard at L117 drops it silently; nE unchanged | IGNORED - same guard at L117; no second node, nE unchanged | logical undirected edges | exactly 2 nodes per edge (self-loops cannot occur) |
| V2 | IGNORED - the v == w term of the insert guard at L108; nE unchanged | IGNORED - same guard at L108; nE unchanged | logical undirected edges, equal to the number of stored records | exactly nE records |
| V3 | ACCEPTED and counted - no v == w guard anywhere; one node in list[v] | IGNORED - GraphIsAdjacent guard; nE unchanged | directed arcs | exactly one node per arc |
| V4 | ACCEPTED and counted - the diagonal cell edges[v][v] | IGNORED - guarded by if (g->edges[v][w]) return; nE unchanged | directed arcs | one cell per arc, in a V*V matrix that always exists in full |
| V5 | ACCEPTED and counted - no v == w guard | IGNORED - GraphIsAdjacent guard at L102; nE unchanged | directed arcs, equal to the number of stored records | exactly nE records |
| V6 | ACCEPTED and counted - one node in list[v] | WEIGHT UPDATED IN PLACE - findAdjNode hit sets node->weight and returns; no new node, nE unchanged | directed arcs | one node per arc |
| V7 | ACCEPTED and counted - the diagonal cell | WEIGHT UPDATED IN PLACE - the cell is overwritten and nE is incremented only when the edge was absent | directed arcs | one cell per arc in a V*V matrix that always exists in full |
| V8 | ACCEPTED and counted | WEIGHT UPDATED IN PLACE - edgeIndex hit rewrites edges[i].weight and returns; no new record, nE unchanged | directed arcs, equal to the number of stored records | exactly nE records |
| V9 | ACCEPTED and counted once; stored as a single node in list[v] | WEIGHT UPDATED IN BOTH NODES - L136 updates the reverse node too, under an explicit symmetry check; nE unchanged | logical undirected edges | 2*nE - (number of self-loops) |
| V10 | ACCEPTED and counted once; one diagonal cell | WEIGHT UPDATED IN BOTH CELLS; nE incremented only when the edge was absent | logical undirected edges | 2*nE - (number of self-loops) cells set, inside a V*V matrix that always exists in full |
| V11 | ACCEPTED and counted once; normalise leaves (v,v) unchanged | WEIGHT UPDATED IN PLACE, in either endpoint order, because the pair is normalised before the lookup; nE unchanged | logical undirected edges, equal to the number of stored records | exactly nE records |

Vertex domain and its validation, the weight domain, `nV`, allocation ownership and
destruction are identical across all eleven and are stated once in section 7.

## 4. Absent-edge queries and preconditions

**V1 `COMP2521_memorise_graph_adjacency_list.c`**  
GraphIsAdjacent is total over the vertex domain: false, no error. No GraphGetWeight in this variant.

**V2 `COMP2521_memorise_graph_edge_array.c`**  
GraphIsAdjacent is total: false, no error. No GraphGetWeight in this variant.

**V3 `COMP2521_memorise_unweighted_directed_adjacency_list.c`**  
GraphIsAdjacent is total: false, no error. No GraphGetWeight in this variant.

**V4 `COMP2521_memorise_unweighted_directed_adjacency_matrix.c`**  
GraphIsAdjacent is total: false, no error. No GraphGetWeight in this variant.

**V5 `COMP2521_memorise_unweighted_directed_edge_array.c`**  
GraphIsAdjacent is total: false, no error. No GraphGetWeight in this variant.

**V6 `COMP2521_memorise_weighted_directed_adjacency_list.c`**  
GraphIsAdjacent is total: false. GraphGetWeight (L110) has a PRECONDITION that the edge exists: an absent edge prints "error: GraphGetWeight: no edge (v, w)" to stderr and exits EXIT_FAILURE, in BOTH the default and the -DNDEBUG build. There is NO sentinel return. Absence is structural (findAdjNode returns NULL).

**V7 `COMP2521_memorise_weighted_directed_adjacency_matrix.c`**  
GraphIsAdjacent is total: false. GraphGetWeight (L114) has a PRECONDITION that the edge exists: an absent edge prints "error: GraphGetWeight: no edge (v, w)" and exits EXIT_FAILURE in BOTH builds. NO_EDGE (-1.0, L20) is an IN-BAND STORAGE SENTINEL only and is never returned; it cannot collide with a stored weight because the weight domain excludes negatives and the exclusion is enforced unconditionally.

**V8 `COMP2521_memorise_weighted_directed_edge_array.c`**  
GraphIsAdjacent is total: false. GraphGetWeight (L103) has a PRECONDITION that the edge exists: an absent edge prints "error: GraphGetWeight: no edge (v, w)" and exits EXIT_FAILURE in BOTH builds. No sentinel; absence is edgeIndex returning -1, which is never used as an index.

**V9 `COMP2521_memorise_weighted_undirected_adjacency_list.c`**  
GraphIsAdjacent is total: false. GraphGetWeight (L115) has a PRECONDITION that the edge exists: an absent edge prints "error: GraphGetWeight: no edge (v, w)" and exits EXIT_FAILURE in BOTH builds. No sentinel; absence is findAdjNode returning NULL.

**V10 `COMP2521_memorise_weighted_undirected_adjacency_matrix.c`**  
GraphIsAdjacent is total: false. GraphGetWeight (L115) has a PRECONDITION that the edge exists: an absent edge prints "error: GraphGetWeight: no edge (v, w)" and exits EXIT_FAILURE in BOTH builds. NO_EDGE (-1.0, L20) is an in-band storage sentinel only, never returned, and cannot collide with a stored weight.

**V11 `COMP2521_memorise_weighted_undirected_edge_array.c`**  
GraphIsAdjacent is total: false. GraphGetWeight (L107) has a PRECONDITION that the edge exists: an absent edge prints "error: GraphGetWeight: no edge (v, w)" and exits EXIT_FAILURE in BOTH builds. No sentinel; absence is edgeIndex returning -1, never used as an index.

## 5. `GraphShow` output format, and neighbour order

These formats are deliberately **not** unified. The shared declaration
`void GraphShow(Graph g);` fixes the signature, not the output, the body genuinely differs by
representation, and no authoritative source defines one format for all eleven - so under
"characterise first, do not standardise for uniformity" they were documented rather than
changed. Never diff one variant output against another.

**V1** - 3-line header "Number of vertices:/Number of edges:/Edges:", then one line per vertex "%2d:" with ascending neighbours, then a trailing blank line
  - neighbour order: ascending vertex order, maintained by insertAdjNode (L190) and relied on by the inline early-exit scan in GraphIsAdjacent (L102)

**V2** - 3-line header, then "(v, w)" per record in INSERTION order (an edge inserted as (2,1) displays as "(2, 1)"), then a trailing blank line
  - neighbour order: not applicable - the array is unsorted
  - capacity: INITIAL_CAPACITY 8 (L21), doubled by a checked realloc in growEdges (L178) guarded against int overflow; GraphRemoveEdge never reallocs and never lowers maxE

**V3** - body only, no header and no trailing blank: one line per vertex "%2d:" with ascending out-neighbours
  - neighbour order: ascending, maintained by insertAdjNode (L183), relied on by findAdjNode early exit (L175)

**V4** - body only: one line per vertex "%2d:" listing w in ascending order
  - neighbour order: not applicable - cells are scanned 0..V-1, so output is ascending by construction

**V5** - body only: "(v, w)" per record in insertion order, no header, no trailing blank
  - neighbour order: not applicable - unsorted
  - capacity: INITIAL_CAPACITY 8 (L21), doubled by checked realloc in growEdges (L168) with an int-overflow guard; never released

**V6** - body only: one line per vertex "%2d:" with " w(weight)" at %.2f
  - neighbour order: ascending, insertAdjNode (L211) / findAdjNode early exit (L203)

**V7** - body only: one line per vertex "%2d:" with " w(weight)" at %.2f for each cell that is not NO_EDGE
  - neighbour order: not applicable - ascending by cell scan

**V8** - body only: "(v, w, weight)" per record at %.2f, insertion order
  - neighbour order: not applicable - unsorted
  - capacity: INITIAL_CAPACITY 8 (L21), doubled by checked realloc in growEdges (L197) with an int-overflow guard; never released

**V9** - body only: one line per vertex "%2d:" with " w(weight)" at %.2f. An ordinary edge appears in TWO rows; a self-loop appears in ONE row.
  - neighbour order: ascending, insertAdjNode (L231) / findAdjNode early exit (L223)

**V10** - body only: one line per vertex "%2d:" with " w(weight)" at %.2f. An ordinary edge appears in TWO rows; a self-loop appears in ONE row.
  - neighbour order: not applicable - ascending by cell scan

**V11** - body only: "(v, w, weight)" per record at %.2f in insertion order, printed in the NORMALISED order - an edge inserted as (2,1) displays as "(1, 2, 7.50)"
  - neighbour order: not applicable - unsorted
  - capacity: INITIAL_CAPACITY 8 (L21), doubled by checked realloc in growEdges (L211) with an int-overflow guard; never released

## 6. Complexity, derived from the actual representation

`V` is `nV`. `E` is **what `nE` counts in that variant** (section 3) - arcs in the directed
variants, logical edges in the undirected ones. `deg(v)` is the number of stored neighbours
of `v`, out-degree in the directed variants. **Allocated capacity (`maxE`) is a fourth,
separate quantity** and belongs only to the edge arrays.

### V1 `COMP2521_memorise_graph_adjacency_list.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(V) - calloc of V head pointers |
| `GraphIsAdjacent` | O(deg(v)) - scan list[v], early exit on ascending order |
| `GraphGetWeight` | not present in this variant |
| `GraphInsertEdge` | O(deg(v) + deg(w)) - adjacency test plus two sorted inserts; worst O(V) |
| `GraphRemoveEdge` | O(deg(v) + deg(w)) - worst O(V) |
| `GraphShow` | Theta(V + E) - every head plus every stored node |
| `GraphFree` | Theta(V + E) |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(V + E) - V head pointers + 2E nodes (no loops stored) |

### V2 `COMP2521_memorise_graph_edge_array.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(1) - INITIAL_CAPACITY records; nothing is allocated per vertex |
| `GraphIsAdjacent` | O(E) - linear scan of an UNSORTED array; no binary search |
| `GraphGetWeight` | not present in this variant |
| `GraphInsertEdge` | Theta(E) worst AND amortised - the duplicate scan is Theta(E) and dominates; the tail append is O(1) amortised, Theta(maxE) on a doubling realloc |
| `GraphRemoveEdge` | Theta(E) - Theta(E) to find plus Theta(E) to shift the tail down |
| `GraphShow` | Theta(E) - insertion order |
| `GraphFree` | Theta(1) - two frees, no per-node walk |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(maxE) = Theta(PEAK E), independent of V; capacity is never released |

### V3 `COMP2521_memorise_unweighted_directed_adjacency_list.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(V) - calloc of V head pointers |
| `GraphIsAdjacent` | O(deg+(v)) - scan list[v], early exit on ascending order |
| `GraphGetWeight` | not present in this variant |
| `GraphInsertEdge` | O(deg+(v)) - one sorted insert; worst O(V) |
| `GraphRemoveEdge` | O(deg+(v)) - worst O(V) |
| `GraphShow` | Theta(V + E) |
| `GraphFree` | Theta(V + E) |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(V + E) - V head pointers + one node per arc |

### V4 `COMP2521_memorise_unweighted_directed_adjacency_matrix.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(V^2) - V rows of V cells, each row initialised |
| `GraphIsAdjacent` | Theta(1) - one cell |
| `GraphGetWeight` | not present in this variant |
| `GraphInsertEdge` | Theta(1) |
| `GraphRemoveEdge` | Theta(1) |
| `GraphShow` | Theta(V^2) - every cell is examined, even for isolated vertices |
| `GraphFree` | Theta(V) - one free per row plus two |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(V^2) - independent of E; an empty graph costs the same as a complete one |

### V5 `COMP2521_memorise_unweighted_directed_edge_array.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(1) - INITIAL_CAPACITY records; nothing is allocated per vertex |
| `GraphIsAdjacent` | O(E) - linear scan of an UNSORTED array; no binary search |
| `GraphGetWeight` | not present in this variant |
| `GraphInsertEdge` | Theta(E) worst AND amortised - the duplicate scan is Theta(E) and dominates; the tail append is O(1) amortised, Theta(maxE) on a doubling realloc |
| `GraphRemoveEdge` | Theta(E) - Theta(E) to find plus Theta(E) to shift the tail down |
| `GraphShow` | Theta(E) - insertion order |
| `GraphFree` | Theta(1) - two frees, no per-node walk |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(maxE) = Theta(PEAK E), independent of V; capacity is never released |

### V6 `COMP2521_memorise_weighted_directed_adjacency_list.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(V) - calloc of V head pointers |
| `GraphIsAdjacent` | O(deg+(v)) - scan list[v], early exit on ascending order |
| `GraphGetWeight` | O(deg+(v)) - scan list[v] |
| `GraphInsertEdge` | O(deg+(v)) - one sorted insert; worst O(V) |
| `GraphRemoveEdge` | O(deg+(v)) - worst O(V) |
| `GraphShow` | Theta(V + E) |
| `GraphFree` | Theta(V + E) |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(V + E) - V head pointers + one node per arc |

### V7 `COMP2521_memorise_weighted_directed_adjacency_matrix.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(V^2) - V rows of V cells, each row initialised |
| `GraphIsAdjacent` | Theta(1) - one cell |
| `GraphGetWeight` | Theta(1) - one cell |
| `GraphInsertEdge` | Theta(1) |
| `GraphRemoveEdge` | Theta(1) |
| `GraphShow` | Theta(V^2) - every cell is examined, even for isolated vertices |
| `GraphFree` | Theta(V) - one free per row plus two |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(V^2) - independent of E; an empty graph costs the same as a complete one |

### V8 `COMP2521_memorise_weighted_directed_edge_array.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(1) - INITIAL_CAPACITY records; nothing is allocated per vertex |
| `GraphIsAdjacent` | O(E) - linear scan of an UNSORTED array; no binary search |
| `GraphGetWeight` | Theta(E) - linear scan |
| `GraphInsertEdge` | Theta(E) worst AND amortised - the duplicate scan is Theta(E) and dominates; the tail append is O(1) amortised, Theta(maxE) on a doubling realloc |
| `GraphRemoveEdge` | Theta(E) - Theta(E) to find plus Theta(E) to shift the tail down |
| `GraphShow` | Theta(E) - insertion order |
| `GraphFree` | Theta(1) - two frees, no per-node walk |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(maxE) = Theta(PEAK E), independent of V; capacity is never released |

### V9 `COMP2521_memorise_weighted_undirected_adjacency_list.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(V) - calloc of V head pointers |
| `GraphIsAdjacent` | O(deg(v)) - scan list[v], early exit on ascending order |
| `GraphGetWeight` | O(deg(v)) - scan list[v] only |
| `GraphInsertEdge` | O(deg(v) + deg(w)) - lookup plus two sorted inserts (one for a self-loop); worst O(V) |
| `GraphRemoveEdge` | O(deg(v) + deg(w)) - worst O(V) |
| `GraphShow` | Theta(V + E) - every head plus every stored node |
| `GraphFree` | Theta(V + E) |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(V + E) - V head pointers + (2E - loops) nodes |

### V10 `COMP2521_memorise_weighted_undirected_adjacency_matrix.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(V^2) - V rows of V cells, each row initialised |
| `GraphIsAdjacent` | Theta(1) - one cell |
| `GraphGetWeight` | Theta(1) - one cell |
| `GraphInsertEdge` | Theta(1) |
| `GraphRemoveEdge` | Theta(1) |
| `GraphShow` | Theta(V^2) - every cell is examined, even for isolated vertices |
| `GraphFree` | Theta(V) - one free per row plus two |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(V^2) - independent of E; an empty graph costs the same as a complete one |

### V11 `COMP2521_memorise_weighted_undirected_edge_array.c`

| Operation | Cost |
|---|---|
| `GraphNew` | Theta(1) - INITIAL_CAPACITY records; nothing is allocated per vertex |
| `GraphIsAdjacent` | O(E) - linear scan of an UNSORTED array; no binary search |
| `GraphGetWeight` | Theta(E) - normalise then linear scan |
| `GraphInsertEdge` | Theta(E) worst AND amortised - the duplicate scan is Theta(E) and dominates; the tail append is O(1) amortised, Theta(maxE) on a doubling realloc |
| `GraphRemoveEdge` | Theta(E) - Theta(E) to find plus Theta(E) to shift the tail down |
| `GraphShow` | Theta(E) - insertion order |
| `GraphFree` | Theta(1) - two frees, no per-node walk |
| `GraphNumVertices/GraphNumEdges` | Theta(1) |
| `space` | Theta(maxE) = Theta(PEAK E), independent of V; capacity is never released |

Five distinctions a transplanted generic table gets wrong:

1. **Enumeration is not an abstract operation.** Listing one vertex neighbours costs
   Theta(deg(v)) in a list and Theta(V) in a matrix - Theta(V) even for an isolated vertex.
   That gap, not the Theta(1) adjacency test, decides BFS and DFS cost.
2. **The edge arrays are unsorted**, so there is no binary search anywhere: every lookup is a
   linear scan and `GraphIsAdjacent` is Theta(E), not O(deg).
3. **Worst case and amortised differ in only one part of an edge-array insert.** The tail
   append is O(1) amortised and Theta(maxE) on a doubling realloc, but every insert first
   scans for a duplicate in Theta(E), which dominates - so the insert is Theta(E) worst AND
   amortised. The amortisation buys nothing.
4. **One stored record is not two symmetric entries.** An undirected edge-array insert writes
   one record; an undirected list or matrix insert writes two entries, or one for a self-loop.
5. **Edge-array memory follows peak capacity, not current size.** `maxE` starts at 8 and
   doubles; removal shifts the tail down and decrements `nE` but never reallocs and never
   lowers `maxE`. 1,000 inserts then 1,000 removals leave 1,024 slots held with `nE == 0`.
   This is a real property to know, not a defect: writing edge-array space as O(E) is wrong.
   `drivers/build_all.sh` prints `maxE` before and after to show it.

## 7. Properties shared by all eleven

| Property | Value |
|---|---|
| Shared API | `Graph GraphNew(int nV)`; `void GraphFree(Graph g)`; `int GraphNumVertices(Graph g)`; `int GraphNumEdges(Graph g)`; `bool GraphIsAdjacent(Graph g, Vertex v, Vertex w)`; `Weight GraphGetWeight(Graph g, Vertex v, Vertex w)  [weighted variants only]`; `void GraphInsertEdge(Graph g, Vertex v, Vertex w[, Weight weight])`; `void GraphRemoveEdge(Graph g, Vertex v, Vertex w)`; `void GraphShow(Graph g)` |
| Compiled one at a time | all 11 declare the same symbols, so two of them can never be linked into one program. Each is selected by textual inclusion through -DSOURCE_FILE. |
| Vertex domain | integers 0 .. nV-1; Vertex is typedef int |
| Vertex validation | identical static bool validVertex(Graph g, Vertex v) returning g != NULL && v >= 0 && v < g->nV in all 11 files, reached through an unconditional requireVertex() guard in every public function. A NULL graph or an out-of-range vertex writes a diagnostic to stderr and exits EXIT_FAILURE (status 1). These are NOT assert(), so -DNDEBUG removes nothing: no assert() remains in any of the 11 files. |
| `nV` domain | nV >= 0; GraphNew(0) is legal and yields a usable empty graph; a negative nV exits 1 |
| Weight domain | all 6 weighted variants: any non-negative double, including exactly 0.0 and fractional values. Negative values and NaN are rejected unconditionally with "error: weight must be non-negative" and exit status 1. Negative weights are OUTSIDE the domain of all six, so an algorithm that needs them (Bellman-Ford) cannot use these unchanged. |
| Removing an absent edge | a no-op, not an error, in all 11 variants |
| Allocation ownership | the Graph owns everything reachable from the handle. Every allocation site tests its result, writes to stderr and exits; the three matrix variants free the rows already allocated before exiting, with no double free. Allocation failure is always fatal, so no operation has a "failed, graph unchanged" return path. |
| Destruction | GraphFree releases every allocation the Graph owns and accepts NULL safely. It does NOT reset the caller handle, so a second GraphFree on the same pointer is a double free; no variant can prevent that because none takes a Graph *. |
| Prerequisites | C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them. |

## 8. Build and run

```sh
cd memorise_graph_c/drivers
./build_all.sh        # all eleven, both build configurations, writes RESULTS.txt
```

One variant by hand (run from `memorise_graph_c/drivers`):

**V1** `COMP2521_memorise_graph_adjacency_list.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_graph_adjacency_list.c"' -DVARIANT='"graph_adjacency_list"' -DWEIGHTED=0 -DDIRECTED=0 -DALLOW_LOOPS=0 -DEDGE_ARRAY=0 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-vertex           # precondition violation: exit 1
```

**V2** `COMP2521_memorise_graph_edge_array.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_graph_edge_array.c"' -DVARIANT='"graph_edge_array"' -DWEIGHTED=0 -DDIRECTED=0 -DALLOW_LOOPS=0 -DEDGE_ARRAY=1 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-vertex           # precondition violation: exit 1
```

**V3** `COMP2521_memorise_unweighted_directed_adjacency_list.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_unweighted_directed_adjacency_list.c"' -DVARIANT='"unweighted_directed_adjacency_list"' -DWEIGHTED=0 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-vertex           # precondition violation: exit 1
```

**V4** `COMP2521_memorise_unweighted_directed_adjacency_matrix.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_unweighted_directed_adjacency_matrix.c"' -DVARIANT='"unweighted_directed_adjacency_matrix"' -DWEIGHTED=0 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-vertex           # precondition violation: exit 1
```

**V5** `COMP2521_memorise_unweighted_directed_edge_array.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_unweighted_directed_edge_array.c"' -DVARIANT='"unweighted_directed_edge_array"' -DWEIGHTED=0 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=1 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-vertex           # precondition violation: exit 1
```

**V6** `COMP2521_memorise_weighted_directed_adjacency_list.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_weighted_directed_adjacency_list.c"' -DVARIANT='"weighted_directed_adjacency_list"' -DWEIGHTED=1 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-absent-weight    # precondition violation: exit 1
```

**V7** `COMP2521_memorise_weighted_directed_adjacency_matrix.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_weighted_directed_adjacency_matrix.c"' -DVARIANT='"weighted_directed_adjacency_matrix"' -DWEIGHTED=1 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-absent-weight    # precondition violation: exit 1
```

**V8** `COMP2521_memorise_weighted_directed_edge_array.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_weighted_directed_edge_array.c"' -DVARIANT='"weighted_directed_edge_array"' -DWEIGHTED=1 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=1 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-absent-weight    # precondition violation: exit 1
```

**V9** `COMP2521_memorise_weighted_undirected_adjacency_list.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_weighted_undirected_adjacency_list.c"' -DVARIANT='"weighted_undirected_adjacency_list"' -DWEIGHTED=1 -DDIRECTED=0 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-absent-weight    # precondition violation: exit 1
```

**V10** `COMP2521_memorise_weighted_undirected_adjacency_matrix.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_weighted_undirected_adjacency_matrix.c"' -DVARIANT='"weighted_undirected_adjacency_matrix"' -DWEIGHTED=1 -DDIRECTED=0 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-absent-weight    # precondition violation: exit 1
```

**V11** `COMP2521_memorise_weighted_undirected_edge_array.c`

```sh
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='"../COMP2521_memorise_weighted_undirected_edge_array.c"' -DVARIANT='"weighted_undirected_edge_array"' -DWEIGHTED=1 -DDIRECTED=0 -DALLOW_LOOPS=1 -DEDGE_ARRAY=1 graph_driver.c -o demo
./demo                 # documented contract, step by step
./demo fatal-absent-weight    # precondition violation: exit 1
```

Add `-DNDEBUG` to any of those commands: the behaviour is unchanged, by design.

## 9. Consumers

| # | Consumers |
|---|---|
| V1 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GADJLIST_MEM, used by assets/corpus-graphs.js in topics graphreps, graphlist, graphweighted (embedded text, not a path reference)<br>assets/tracer-ui.js |
| V2 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GEDGEARRAY_MEM, used by assets/corpus-graphs.js in topics graphreps, graphedges, graphweighted (embedded text, not a path reference)<br>assets/tracer-ui.js |
| V3 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GADJLIST_DU_MEM, used by assets/corpus-graphs.js in topics graphlist, graphweighted (embedded text, not a path reference) |
| V4 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GMATRIX_DU_MEM, used by assets/corpus-graphs.js in topics graphweighted (embedded text, not a path reference) |
| V5 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GEDGEARRAY_DU_MEM, used by assets/corpus-graphs.js in topics graphedges, graphweighted (embedded text, not a path reference) |
| V6 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GADJLIST_DW_MEM, used by assets/corpus-graphs.js in topics graphlist, graphweighted (embedded text, not a path reference) |
| V7 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GMATRIX_DW_MEM, used by assets/corpus-graphs.js in topics graphweighted (embedded text, not a path reference) |
| V8 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GEDGEARRAY_DW_MEM, used by assets/corpus-graphs.js in topics graphedges, graphweighted (embedded text, not a path reference) |
| V9 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GADJLIST_UW_MEM, used by assets/corpus-graphs.js in topics graphlist, graphweighted (embedded text, not a path reference) |
| V10 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GMATRIX_UW_MEM, used by assets/corpus-graphs.js in topics graphweighted (embedded text, not a path reference) |
| V11 | SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)<br>memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)<br>commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)<br>displayed lesson copy: assets/corpus-source-data.js constant SRC_GEDGEARRAY_UW_MEM, used by assets/corpus-graphs.js in topics graphedges, graphweighted (embedded text, not a path reference) |

Snapshot note: `assets/` is owned elsewhere in this remediation and may change
independently; the displayed-copy mapping above was read at generation time.

## 10. Tests that cover each variant

All eleven rows are covered by the same two suites - there is no variant with thinner
coverage than another.

| Suite | What it does |
|---|---|
| Commission harness (unmodified) | commission harness, UNMODIFIED: python3 -I /home/claude/commission_pkg/dsa_guide_Full_Remediation_Commission_2026-10-20/reproduce/c/audit_c.py /home/claude/work/successor <new output dir>. Per variant: strict object compile, then an ASan+UBSan build of reproduce/c/graph_contract_harness.c against an independent reference model, 1676 operations and 286,769-440,110 checks each. |
| Local driver suite | memorise_graph_c/drivers/build_all.sh - for each variant: strict compile with and without -DNDEBUG, driver build+run in both configurations, an ASan+UBSan run, a control-verified LeakSanitizer run, and the fatal precondition demonstrations (fatal-vertex, fatal-null, fatal-nv, and for weighted variants fatal-absent-weight and fatal-negative-weight), each required to exit 1 in BOTH build configurations. |
| Driver steps per variant | insert, duplicate insert, reverse-order insert (the nE demonstration), self-loop per that variant contract, absent-edge query, GraphShow, removal, repeated removal, fill-then-empty capacity behaviour, and GraphFree. |
| Recorded evidence | `memorise_graph_c/drivers/RESULTS.txt (actual commands, exit statuses and output)` |

## 11. Review depth

Stated per row, and deliberately not collapsed into a single verdict. "Read metadata",
"compiled with a fixture" and "independently checked specified semantics" are different
claims; so is "compared with the original source", which was **not** possible here.

| # | Review depth reached | Not reviewed |
|---|---|---|
| V1 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V2 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V3 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V4 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V5 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V6 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V7 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V8 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V9 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V10 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |
| V11 | independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations. | NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/. |

## 12. Machine-readable form

The same data. Field names match the sections above.

```json
{
  "schema": "comp2521-graph-c-variant-matrix/1",
  "generated_utc": "2026-10-20T03:00:46Z",
  "findings_addressed": [
    "AUD-14",
    "CUR-MOD-02"
  ],
  "shared": {
    "api": [
      "Graph GraphNew(int nV)",
      "void GraphFree(Graph g)",
      "int GraphNumVertices(Graph g)",
      "int GraphNumEdges(Graph g)",
      "bool GraphIsAdjacent(Graph g, Vertex v, Vertex w)",
      "Weight GraphGetWeight(Graph g, Vertex v, Vertex w)  [weighted variants only]",
      "void GraphInsertEdge(Graph g, Vertex v, Vertex w[, Weight weight])",
      "void GraphRemoveEdge(Graph g, Vertex v, Vertex w)",
      "void GraphShow(Graph g)"
    ],
    "vertex_domain": "integers 0 .. nV-1; Vertex is typedef int",
    "vertex_validation": "identical static bool validVertex(Graph g, Vertex v) returning g != NULL && v >= 0 && v < g->nV in all 11 files, reached through an unconditional requireVertex() guard in every public function. A NULL graph or an out-of-range vertex writes a diagnostic to stderr and exits EXIT_FAILURE (status 1). These are NOT assert(), so -DNDEBUG removes nothing: no assert() remains in any of the 11 files.",
    "weight_domain": "all 6 weighted variants: any non-negative double, including exactly 0.0 and fractional values. Negative values and NaN are rejected unconditionally with \"error: weight must be non-negative\" and exit status 1. Negative weights are OUTSIDE the domain of all six, so an algorithm that needs them (Bellman-Ford) cannot use these unchanged.",
    "nV_domain": "nV >= 0; GraphNew(0) is legal and yields a usable empty graph; a negative nV exits 1",
    "allocation_ownership": "the Graph owns everything reachable from the handle. Every allocation site tests its result, writes to stderr and exits; the three matrix variants free the rows already allocated before exiting, with no double free. Allocation failure is always fatal, so no operation has a \"failed, graph unchanged\" return path.",
    "destruction": "GraphFree releases every allocation the Graph owns and accepts NULL safely. It does NOT reset the caller handle, so a second GraphFree on the same pointer is a double free; no variant can prevent that because none takes a Graph *.",
    "removal_of_absent_edge": "a no-op, not an error, in all 11 variants",
    "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
    "one_at_a_time": "all 11 declare the same symbols, so two of them can never be linked into one program. Each is selected by textual inclusion through -DSOURCE_FILE."
  },
  "tests": {
    "harness": "commission harness, UNMODIFIED: python3 -I /home/claude/commission_pkg/dsa_guide_Full_Remediation_Commission_2026-10-20/reproduce/c/audit_c.py /home/claude/work/successor <new output dir>. Per variant: strict object compile, then an ASan+UBSan build of reproduce/c/graph_contract_harness.c against an independent reference model, 1676 operations and 286,769-440,110 checks each.",
    "driver": "memorise_graph_c/drivers/build_all.sh - for each variant: strict compile with and without -DNDEBUG, driver build+run in both configurations, an ASan+UBSan run, a control-verified LeakSanitizer run, and the fatal precondition demonstrations (fatal-vertex, fatal-null, fatal-nv, and for weighted variants fatal-absent-weight and fatal-negative-weight), each required to exit 1 in BOTH build configurations.",
    "driver_steps": "insert, duplicate insert, reverse-order insert (the nE demonstration), self-loop per that variant contract, absent-edge query, GraphShow, removal, repeated removal, fill-then-empty capacity behaviour, and GraphFree.",
    "evidence": "memorise_graph_c/drivers/RESULTS.txt (actual commands, exit statuses and output)"
  },
  "variants": [
    {
      "id": "V1",
      "file": "COMP2521_memorise_graph_adjacency_list.c",
      "sha256": "228c928d7a3162eb99d18d85e383f8ca1f244b82d96e673c11531601bfc5b418",
      "lines": 231,
      "directed": false,
      "weighted": false,
      "weight_type": null,
      "representation": "adjacency list",
      "edge_storage": "TWO symmetric adjacency nodes, one in each endpoint list (GraphInsertEdge L121-122, nE++ at L123)",
      "self_loop": "IGNORED - the v == w term of the insert guard at L117 drops it silently; nE unchanged",
      "duplicate_insert": "IGNORED - same guard at L117; no second node, nE unchanged",
      "nE_meaning": "logical undirected edges",
      "stored_entries": "exactly 2 nodes per edge (self-loops cannot occur)",
      "absent_edge": "GraphIsAdjacent is total over the vertex domain: false, no error. No GraphGetWeight in this variant.",
      "show_format": "3-line header \"Number of vertices:/Number of edges:/Edges:\", then one line per vertex \"%2d:\" with ascending neighbours, then a trailing blank line",
      "neighbour_order": "ascending vertex order, maintained by insertAdjNode (L190) and relied on by the inline early-exit scan in GraphIsAdjacent (L102)",
      "capacity": null,
      "complexity": {
        "GraphNew": "Theta(V) - calloc of V head pointers",
        "GraphIsAdjacent": "O(deg(v)) - scan list[v], early exit on ascending order",
        "GraphInsertEdge": "O(deg(v) + deg(w)) - adjacency test plus two sorted inserts; worst O(V)",
        "GraphRemoveEdge": "O(deg(v) + deg(w)) - worst O(V)",
        "GraphShow": "Theta(V + E) - every head plus every stored node",
        "GraphFree": "Theta(V + E)",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(V + E) - V head pointers + 2E nodes (no loops stored)"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_graph_adjacency_list.c\"' -DVARIANT='\"graph_adjacency_list\"' -DWEIGHTED=0 -DDIRECTED=0 -DALLOW_LOOPS=0 -DEDGE_ARRAY=0 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GADJLIST_MEM, used by assets/corpus-graphs.js in topics graphreps, graphlist, graphweighted (embedded text, not a path reference)",
        "assets/tracer-ui.js"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V2",
      "file": "COMP2521_memorise_graph_edge_array.c",
      "sha256": "3bfc1ced0b5ec12b70e5a717d72b092013c557b120be18195fc8d8fce11a17a8",
      "lines": 194,
      "directed": false,
      "weighted": false,
      "weight_type": null,
      "representation": "edge array (unsorted, dynamic)",
      "edge_storage": "ONE record per logical edge, in the order supplied; symmetry is recovered at QUERY time by comparing both endpoint orders (record written at L116; symmetry recovered by the either-order test at L171 inside edgeIndex L168)",
      "self_loop": "IGNORED - the v == w term of the insert guard at L108; nE unchanged",
      "duplicate_insert": "IGNORED - same guard at L108; nE unchanged",
      "nE_meaning": "logical undirected edges, equal to the number of stored records",
      "stored_entries": "exactly nE records",
      "absent_edge": "GraphIsAdjacent is total: false, no error. No GraphGetWeight in this variant.",
      "show_format": "3-line header, then \"(v, w)\" per record in INSERTION order (an edge inserted as (2,1) displays as \"(2, 1)\"), then a trailing blank line",
      "neighbour_order": "not applicable - the array is unsorted",
      "capacity": "INITIAL_CAPACITY 8 (L21), doubled by a checked realloc in growEdges (L178) guarded against int overflow; GraphRemoveEdge never reallocs and never lowers maxE",
      "complexity": {
        "GraphNew": "Theta(1) - INITIAL_CAPACITY records; nothing is allocated per vertex",
        "GraphIsAdjacent": "O(E) - linear scan of an UNSORTED array; no binary search",
        "GraphInsertEdge": "Theta(E) worst AND amortised - the duplicate scan is Theta(E) and dominates; the tail append is O(1) amortised, Theta(maxE) on a doubling realloc",
        "GraphRemoveEdge": "Theta(E) - Theta(E) to find plus Theta(E) to shift the tail down",
        "GraphShow": "Theta(E) - insertion order",
        "GraphFree": "Theta(1) - two frees, no per-node walk",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(maxE) = Theta(PEAK E), independent of V; capacity is never released"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_graph_edge_array.c\"' -DVARIANT='\"graph_edge_array\"' -DWEIGHTED=0 -DDIRECTED=0 -DALLOW_LOOPS=0 -DEDGE_ARRAY=1 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GEDGEARRAY_MEM, used by assets/corpus-graphs.js in topics graphreps, graphedges, graphweighted (embedded text, not a path reference)",
        "assets/tracer-ui.js"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V3",
      "file": "COMP2521_memorise_unweighted_directed_adjacency_list.c",
      "sha256": "af4739e998c3a5c53281d6812c77161d4230a7ed71e20fcc76d85ebc26e6a340",
      "lines": 219,
      "directed": true,
      "weighted": false,
      "weight_type": null,
      "representation": "adjacency list",
      "edge_storage": "ONE node in list[v] per arc (GraphInsertEdge L109)",
      "self_loop": "ACCEPTED and counted - no v == w guard anywhere; one node in list[v]",
      "duplicate_insert": "IGNORED - GraphIsAdjacent guard; nE unchanged",
      "nE_meaning": "directed arcs",
      "stored_entries": "exactly one node per arc",
      "absent_edge": "GraphIsAdjacent is total: false, no error. No GraphGetWeight in this variant.",
      "show_format": "body only, no header and no trailing blank: one line per vertex \"%2d:\" with ascending out-neighbours",
      "neighbour_order": "ascending, maintained by insertAdjNode (L183), relied on by findAdjNode early exit (L175)",
      "capacity": null,
      "complexity": {
        "GraphNew": "Theta(V) - calloc of V head pointers",
        "GraphIsAdjacent": "O(deg+(v)) - scan list[v], early exit on ascending order",
        "GraphInsertEdge": "O(deg+(v)) - one sorted insert; worst O(V)",
        "GraphRemoveEdge": "O(deg+(v)) - worst O(V)",
        "GraphShow": "Theta(V + E)",
        "GraphFree": "Theta(V + E)",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(V + E) - V head pointers + one node per arc"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_unweighted_directed_adjacency_list.c\"' -DVARIANT='\"unweighted_directed_adjacency_list\"' -DWEIGHTED=0 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GADJLIST_DU_MEM, used by assets/corpus-graphs.js in topics graphlist, graphweighted (embedded text, not a path reference)"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V4",
      "file": "COMP2521_memorise_unweighted_directed_adjacency_matrix.c",
      "sha256": "5ead65b0f4299cd815ff10403602829f00aac95f4b91fee7379632683848c95b",
      "lines": 160,
      "directed": true,
      "weighted": false,
      "weight_type": null,
      "representation": "adjacency matrix of bool",
      "edge_storage": "ONE cell edges[v][w] = true (GraphInsertEdge L107)",
      "self_loop": "ACCEPTED and counted - the diagonal cell edges[v][v]",
      "duplicate_insert": "IGNORED - guarded by if (g->edges[v][w]) return; nE unchanged",
      "nE_meaning": "directed arcs",
      "stored_entries": "one cell per arc, in a V*V matrix that always exists in full",
      "absent_edge": "GraphIsAdjacent is total: false, no error. No GraphGetWeight in this variant.",
      "show_format": "body only: one line per vertex \"%2d:\" listing w in ascending order",
      "neighbour_order": "not applicable - cells are scanned 0..V-1, so output is ascending by construction",
      "capacity": null,
      "complexity": {
        "GraphNew": "Theta(V^2) - V rows of V cells, each row initialised",
        "GraphIsAdjacent": "Theta(1) - one cell",
        "GraphInsertEdge": "Theta(1)",
        "GraphRemoveEdge": "Theta(1)",
        "GraphShow": "Theta(V^2) - every cell is examined, even for isolated vertices",
        "GraphFree": "Theta(V) - one free per row plus two",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(V^2) - independent of E; an empty graph costs the same as a complete one"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_unweighted_directed_adjacency_matrix.c\"' -DVARIANT='\"unweighted_directed_adjacency_matrix\"' -DWEIGHTED=0 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GMATRIX_DU_MEM, used by assets/corpus-graphs.js in topics graphweighted (embedded text, not a path reference)"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V5",
      "file": "COMP2521_memorise_unweighted_directed_edge_array.c",
      "sha256": "f38808448a1f6b18f18e8ccd0fa80a19a238ee10ebd2de9c5f4dd6f8be4c62f5",
      "lines": 183,
      "directed": true,
      "weighted": false,
      "weight_type": null,
      "representation": "edge array (unsorted, dynamic)",
      "edge_storage": "ONE record per arc; edgeIndex (L159) matches the EXACT (v,w) order only",
      "self_loop": "ACCEPTED and counted - no v == w guard",
      "duplicate_insert": "IGNORED - GraphIsAdjacent guard at L102; nE unchanged",
      "nE_meaning": "directed arcs, equal to the number of stored records",
      "stored_entries": "exactly nE records",
      "absent_edge": "GraphIsAdjacent is total: false, no error. No GraphGetWeight in this variant.",
      "show_format": "body only: \"(v, w)\" per record in insertion order, no header, no trailing blank",
      "neighbour_order": "not applicable - unsorted",
      "capacity": "INITIAL_CAPACITY 8 (L21), doubled by checked realloc in growEdges (L168) with an int-overflow guard; never released",
      "complexity": {
        "GraphNew": "Theta(1) - INITIAL_CAPACITY records; nothing is allocated per vertex",
        "GraphIsAdjacent": "O(E) - linear scan of an UNSORTED array; no binary search",
        "GraphInsertEdge": "Theta(E) worst AND amortised - the duplicate scan is Theta(E) and dominates; the tail append is O(1) amortised, Theta(maxE) on a doubling realloc",
        "GraphRemoveEdge": "Theta(E) - Theta(E) to find plus Theta(E) to shift the tail down",
        "GraphShow": "Theta(E) - insertion order",
        "GraphFree": "Theta(1) - two frees, no per-node walk",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(maxE) = Theta(PEAK E), independent of V; capacity is never released"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_unweighted_directed_edge_array.c\"' -DVARIANT='\"unweighted_directed_edge_array\"' -DWEIGHTED=0 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=1 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GEDGEARRAY_DU_MEM, used by assets/corpus-graphs.js in topics graphedges, graphweighted (embedded text, not a path reference)"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V6",
      "file": "COMP2521_memorise_weighted_directed_adjacency_list.c",
      "sha256": "8f0c7ab927ee36c290cbb2076c05f99d753e0656a185696151178c4763e06dd6",
      "lines": 249,
      "directed": true,
      "weighted": true,
      "weight_type": "double (typedef double Weight)",
      "representation": "adjacency list",
      "edge_storage": "ONE node in list[v] carrying the weight (GraphInsertEdge L122)",
      "self_loop": "ACCEPTED and counted - one node in list[v]",
      "duplicate_insert": "WEIGHT UPDATED IN PLACE - findAdjNode hit sets node->weight and returns; no new node, nE unchanged",
      "nE_meaning": "directed arcs",
      "stored_entries": "one node per arc",
      "absent_edge": "GraphIsAdjacent is total: false. GraphGetWeight (L110) has a PRECONDITION that the edge exists: an absent edge prints \"error: GraphGetWeight: no edge (v, w)\" to stderr and exits EXIT_FAILURE, in BOTH the default and the -DNDEBUG build. There is NO sentinel return. Absence is structural (findAdjNode returns NULL).",
      "show_format": "body only: one line per vertex \"%2d:\" with \" w(weight)\" at %.2f",
      "neighbour_order": "ascending, insertAdjNode (L211) / findAdjNode early exit (L203)",
      "capacity": null,
      "complexity": {
        "GraphNew": "Theta(V) - calloc of V head pointers",
        "GraphIsAdjacent": "O(deg+(v)) - scan list[v], early exit on ascending order",
        "GraphInsertEdge": "O(deg+(v)) - one sorted insert; worst O(V)",
        "GraphRemoveEdge": "O(deg+(v)) - worst O(V)",
        "GraphShow": "Theta(V + E)",
        "GraphFree": "Theta(V + E)",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(V + E) - V head pointers + one node per arc",
        "GraphGetWeight": "O(deg+(v)) - scan list[v]"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_weighted_directed_adjacency_list.c\"' -DVARIANT='\"weighted_directed_adjacency_list\"' -DWEIGHTED=1 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GADJLIST_DW_MEM, used by assets/corpus-graphs.js in topics graphlist, graphweighted (embedded text, not a path reference)"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V7",
      "file": "COMP2521_memorise_weighted_directed_adjacency_matrix.c",
      "sha256": "3e472a8bbf973786b7245661c662cb50a9e6235ec33b25dc312359ad4bedb3ba",
      "lines": 189,
      "directed": true,
      "weighted": true,
      "weight_type": "double (typedef double Weight)",
      "representation": "adjacency matrix of Weight",
      "edge_storage": "ONE cell edges[v][w] = weight (GraphInsertEdge L127); every other cell holds NO_EDGE",
      "self_loop": "ACCEPTED and counted - the diagonal cell",
      "duplicate_insert": "WEIGHT UPDATED IN PLACE - the cell is overwritten and nE is incremented only when the edge was absent",
      "nE_meaning": "directed arcs",
      "stored_entries": "one cell per arc in a V*V matrix that always exists in full",
      "absent_edge": "GraphIsAdjacent is total: false. GraphGetWeight (L114) has a PRECONDITION that the edge exists: an absent edge prints \"error: GraphGetWeight: no edge (v, w)\" and exits EXIT_FAILURE in BOTH builds. NO_EDGE (-1.0, L20) is an IN-BAND STORAGE SENTINEL only and is never returned; it cannot collide with a stored weight because the weight domain excludes negatives and the exclusion is enforced unconditionally.",
      "show_format": "body only: one line per vertex \"%2d:\" with \" w(weight)\" at %.2f for each cell that is not NO_EDGE",
      "neighbour_order": "not applicable - ascending by cell scan",
      "capacity": null,
      "complexity": {
        "GraphNew": "Theta(V^2) - V rows of V cells, each row initialised",
        "GraphIsAdjacent": "Theta(1) - one cell",
        "GraphInsertEdge": "Theta(1)",
        "GraphRemoveEdge": "Theta(1)",
        "GraphShow": "Theta(V^2) - every cell is examined, even for isolated vertices",
        "GraphFree": "Theta(V) - one free per row plus two",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(V^2) - independent of E; an empty graph costs the same as a complete one",
        "GraphGetWeight": "Theta(1) - one cell"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_weighted_directed_adjacency_matrix.c\"' -DVARIANT='\"weighted_directed_adjacency_matrix\"' -DWEIGHTED=1 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GMATRIX_DW_MEM, used by assets/corpus-graphs.js in topics graphweighted (embedded text, not a path reference)"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V8",
      "file": "COMP2521_memorise_weighted_directed_edge_array.c",
      "sha256": "d540b22cd6c358390b22eb66bc568ade139366c8c810d5e596910093dbc4ce3f",
      "lines": 212,
      "directed": true,
      "weighted": true,
      "weight_type": "double (typedef double Weight)",
      "representation": "edge array (unsorted, dynamic)",
      "edge_storage": "ONE record {v, w, weight} per arc; edgeIndex (L188) matches the EXACT (v,w) order",
      "self_loop": "ACCEPTED and counted",
      "duplicate_insert": "WEIGHT UPDATED IN PLACE - edgeIndex hit rewrites edges[i].weight and returns; no new record, nE unchanged",
      "nE_meaning": "directed arcs, equal to the number of stored records",
      "stored_entries": "exactly nE records",
      "absent_edge": "GraphIsAdjacent is total: false. GraphGetWeight (L103) has a PRECONDITION that the edge exists: an absent edge prints \"error: GraphGetWeight: no edge (v, w)\" and exits EXIT_FAILURE in BOTH builds. No sentinel; absence is edgeIndex returning -1, which is never used as an index.",
      "show_format": "body only: \"(v, w, weight)\" per record at %.2f, insertion order",
      "neighbour_order": "not applicable - unsorted",
      "capacity": "INITIAL_CAPACITY 8 (L21), doubled by checked realloc in growEdges (L197) with an int-overflow guard; never released",
      "complexity": {
        "GraphNew": "Theta(1) - INITIAL_CAPACITY records; nothing is allocated per vertex",
        "GraphIsAdjacent": "O(E) - linear scan of an UNSORTED array; no binary search",
        "GraphInsertEdge": "Theta(E) worst AND amortised - the duplicate scan is Theta(E) and dominates; the tail append is O(1) amortised, Theta(maxE) on a doubling realloc",
        "GraphRemoveEdge": "Theta(E) - Theta(E) to find plus Theta(E) to shift the tail down",
        "GraphShow": "Theta(E) - insertion order",
        "GraphFree": "Theta(1) - two frees, no per-node walk",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(maxE) = Theta(PEAK E), independent of V; capacity is never released",
        "GraphGetWeight": "Theta(E) - linear scan"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_weighted_directed_edge_array.c\"' -DVARIANT='\"weighted_directed_edge_array\"' -DWEIGHTED=1 -DDIRECTED=1 -DALLOW_LOOPS=1 -DEDGE_ARRAY=1 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GEDGEARRAY_DW_MEM, used by assets/corpus-graphs.js in topics graphedges, graphweighted (embedded text, not a path reference)"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V9",
      "file": "COMP2521_memorise_weighted_undirected_adjacency_list.c",
      "sha256": "efa251bcb8143de4004935b218201773af9c1b99b8705788a2f19b3635186d45",
      "lines": 269,
      "directed": false,
      "weighted": true,
      "weight_type": "double (typedef double Weight)",
      "representation": "adjacency list",
      "edge_storage": "TWO symmetric nodes for an ordinary edge, but exactly ONE node for a self-loop - the if (v != w) guards at L136 (weight update), L150 (insert, second node at L151) and L164 (removal)",
      "self_loop": "ACCEPTED and counted once; stored as a single node in list[v]",
      "duplicate_insert": "WEIGHT UPDATED IN BOTH NODES - L136 updates the reverse node too, under an explicit symmetry check; nE unchanged",
      "nE_meaning": "logical undirected edges",
      "stored_entries": "2*nE - (number of self-loops)",
      "absent_edge": "GraphIsAdjacent is total: false. GraphGetWeight (L115) has a PRECONDITION that the edge exists: an absent edge prints \"error: GraphGetWeight: no edge (v, w)\" and exits EXIT_FAILURE in BOTH builds. No sentinel; absence is findAdjNode returning NULL.",
      "show_format": "body only: one line per vertex \"%2d:\" with \" w(weight)\" at %.2f. An ordinary edge appears in TWO rows; a self-loop appears in ONE row.",
      "neighbour_order": "ascending, insertAdjNode (L231) / findAdjNode early exit (L223)",
      "capacity": null,
      "complexity": {
        "GraphNew": "Theta(V) - calloc of V head pointers",
        "GraphIsAdjacent": "O(deg(v)) - scan list[v], early exit on ascending order",
        "GraphInsertEdge": "O(deg(v) + deg(w)) - lookup plus two sorted inserts (one for a self-loop); worst O(V)",
        "GraphRemoveEdge": "O(deg(v) + deg(w)) - worst O(V)",
        "GraphShow": "Theta(V + E) - every head plus every stored node",
        "GraphFree": "Theta(V + E)",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(V + E) - V head pointers + (2E - loops) nodes",
        "GraphGetWeight": "O(deg(v)) - scan list[v] only"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_weighted_undirected_adjacency_list.c\"' -DVARIANT='\"weighted_undirected_adjacency_list\"' -DWEIGHTED=1 -DDIRECTED=0 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GADJLIST_UW_MEM, used by assets/corpus-graphs.js in topics graphlist, graphweighted (embedded text, not a path reference)"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V10",
      "file": "COMP2521_memorise_weighted_undirected_adjacency_matrix.c",
      "sha256": "9596ce32e374e7edd9634e1a7e1fcc599dfbed8c5c47af60b51b16ece603a825",
      "lines": 195,
      "directed": false,
      "weighted": true,
      "weight_type": "double (typedef double Weight)",
      "representation": "adjacency matrix of Weight",
      "edge_storage": "TWO symmetric cells for an ordinary edge, exactly ONE diagonal cell for a self-loop - the if (v != w) guards at L137 (insert) and L150 (removal)",
      "self_loop": "ACCEPTED and counted once; one diagonal cell",
      "duplicate_insert": "WEIGHT UPDATED IN BOTH CELLS; nE incremented only when the edge was absent",
      "nE_meaning": "logical undirected edges",
      "stored_entries": "2*nE - (number of self-loops) cells set, inside a V*V matrix that always exists in full",
      "absent_edge": "GraphIsAdjacent is total: false. GraphGetWeight (L115) has a PRECONDITION that the edge exists: an absent edge prints \"error: GraphGetWeight: no edge (v, w)\" and exits EXIT_FAILURE in BOTH builds. NO_EDGE (-1.0, L20) is an in-band storage sentinel only, never returned, and cannot collide with a stored weight.",
      "show_format": "body only: one line per vertex \"%2d:\" with \" w(weight)\" at %.2f. An ordinary edge appears in TWO rows; a self-loop appears in ONE row.",
      "neighbour_order": "not applicable - ascending by cell scan",
      "capacity": null,
      "complexity": {
        "GraphNew": "Theta(V^2) - V rows of V cells, each row initialised",
        "GraphIsAdjacent": "Theta(1) - one cell",
        "GraphInsertEdge": "Theta(1)",
        "GraphRemoveEdge": "Theta(1)",
        "GraphShow": "Theta(V^2) - every cell is examined, even for isolated vertices",
        "GraphFree": "Theta(V) - one free per row plus two",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(V^2) - independent of E; an empty graph costs the same as a complete one",
        "GraphGetWeight": "Theta(1) - one cell"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_weighted_undirected_adjacency_matrix.c\"' -DVARIANT='\"weighted_undirected_adjacency_matrix\"' -DWEIGHTED=1 -DDIRECTED=0 -DALLOW_LOOPS=1 -DEDGE_ARRAY=0 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GMATRIX_UW_MEM, used by assets/corpus-graphs.js in topics graphweighted (embedded text, not a path reference)"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    },
    {
      "id": "V11",
      "file": "COMP2521_memorise_weighted_undirected_edge_array.c",
      "sha256": "19cb0270b1cfd629c5436425d1c94a612d99d3c064c918187860ac86fa9e9912",
      "lines": 226,
      "directed": false,
      "weighted": true,
      "weight_type": "double (typedef double Weight)",
      "representation": "edge array (unsorted, dynamic, canonicalised)",
      "edge_storage": "ONE record per logical edge, CANONICALISED so that v <= w by normalise() (L193), applied on insert (L126, record written at L136) and inside every lookup (edgeIndex L201, normalise call at L202)",
      "self_loop": "ACCEPTED and counted once; normalise leaves (v,v) unchanged",
      "duplicate_insert": "WEIGHT UPDATED IN PLACE, in either endpoint order, because the pair is normalised before the lookup; nE unchanged",
      "nE_meaning": "logical undirected edges, equal to the number of stored records",
      "stored_entries": "exactly nE records",
      "absent_edge": "GraphIsAdjacent is total: false. GraphGetWeight (L107) has a PRECONDITION that the edge exists: an absent edge prints \"error: GraphGetWeight: no edge (v, w)\" and exits EXIT_FAILURE in BOTH builds. No sentinel; absence is edgeIndex returning -1, never used as an index.",
      "show_format": "body only: \"(v, w, weight)\" per record at %.2f in insertion order, printed in the NORMALISED order - an edge inserted as (2,1) displays as \"(1, 2, 7.50)\"",
      "neighbour_order": "not applicable - unsorted",
      "capacity": "INITIAL_CAPACITY 8 (L21), doubled by checked realloc in growEdges (L211) with an int-overflow guard; never released",
      "complexity": {
        "GraphNew": "Theta(1) - INITIAL_CAPACITY records; nothing is allocated per vertex",
        "GraphIsAdjacent": "O(E) - linear scan of an UNSORTED array; no binary search",
        "GraphInsertEdge": "Theta(E) worst AND amortised - the duplicate scan is Theta(E) and dominates; the tail append is O(1) amortised, Theta(maxE) on a doubling realloc",
        "GraphRemoveEdge": "Theta(E) - Theta(E) to find plus Theta(E) to shift the tail down",
        "GraphShow": "Theta(E) - insertion order",
        "GraphFree": "Theta(1) - two frees, no per-node walk",
        "GraphNumVertices/GraphNumEdges": "Theta(1)",
        "space": "Theta(maxE) = Theta(PEAK E), independent of V; capacity is never released",
        "GraphGetWeight": "Theta(E) - normalise then linear scan"
      },
      "build": "gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror -DSOURCE_FILE='\"../COMP2521_memorise_weighted_undirected_edge_array.c\"' -DVARIANT='\"weighted_undirected_edge_array\"' -DWEIGHTED=1 -DDIRECTED=0 -DALLOW_LOOPS=1 -DEDGE_ARRAY=1 graph_driver.c -o demo",
      "consumers": [
        "SHA256SUMS.txt and MANIFEST.json (release metadata, by path and digest)",
        "memorise_graph_c/drivers/graph_driver.c (via -DSOURCE_FILE)",
        "commission harness reproduce/c/graph_contract_harness.c (via -DSOURCE_FILE)",
        "displayed lesson copy: assets/corpus-source-data.js constant SRC_GEDGEARRAY_UW_MEM, used by assets/corpus-graphs.js in topics graphedges, graphweighted (embedded text, not a path reference)"
      ],
      "prerequisites": "C11 toolchain (tested: gcc 13.3.0) and the standard headers each file includes (stdbool.h, stdio.h, stdlib.h, plus limits.h in the four edge arrays). No third-party library, no build system and no generated code. These are dependencies, NOT university lecture weeks: no week ordering is a prerequisite for compiling or running any of them.",
      "review_depth": "independently checked specified semantics - full source read line by line; strict compile with and without -DNDEBUG; compiled with two independent fixtures (the unmodified commission harness and drivers/graph_driver.c); run under ASan+UBSan and under a control-verified LeakSanitizer; and targeted probes that confirmed this row GraphShow format, edge storage, nE meaning, self-loop and duplicate behaviour, absent-edge query and vertex/weight domain enforcement in both build configurations.",
      "review_not_done": "NOT compared with the authoritative course source: the COMP2521 manual and lecture documents were not available to this work, so no claim is made that any file matches official course code. The displayed copy named in the Consumers column was read and found to be near-identical to the baseline C but NOT byte-identical even before this revision; after the code corrections recorded here it is definitely out of date, and reconciling it belongs to the owner of assets/."
    }
  ]
}
```
