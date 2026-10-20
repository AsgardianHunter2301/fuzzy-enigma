# Bridge contracts

The 14 supplemental C "bridges" in `assets/manual-boundary-data.js` are C
conversions shown beside 26T2 manual **pseudocode**. The pseudocode is in the
manual; this C is not. Every bridge carries the mandatory warning *"This C is
supplemental. Learn it separately."*

These 14 bridges are **not** the 11 standalone Graph ADT variants in
`memorise_graph_c/`. Those are separate study material with their own guide
(`MEMORISE_GRAPH_C_GUIDE.md`, `docs/C_LIBRARY_MATRIX.md`); the bridges only
*call* one of them.

Each displayed bridge is an **excerpt**, not a standalone C program: it has no
`main`, and the headers, Graph backend and helpers it needs are named in its
conversion note and listed in the table below. `bridges_c/` is where those
excerpts are assembled into complete programs and run; `make parity` compiles
the app's own displayed text with its declared dependencies, so the excerpts are
checked rather than assumed to be compilable.

Every bridge below is compiled and tested in `bridges_c/`. Nothing in this
document claims a result that `bridges_c/RESULTS.txt` does not record.

## Source labels used here

| Label | Meaning |
|---|---|
| SUPPLEMENTAL C | the bridge body: a study conversion of manual pseudocode, not manual source |
| SUPPLEMENTAL ADAPTER / HELPER | newly authored support code (`wgraph.*`, `queue.*`, `testing.h`, the `adt_*.c` wrappers, the drivers) |
| MEMORISE (supplied) | a read-only file from `memorise_graph_c/`, included verbatim and unmodified |
| EXACT QUOTATION | `bridges_c/adt_manual_undirected_matrix.c` only: the adjacency-matrix Graph ADT the app displays, byte identical to `assets/modules-graphs.js` `SRC_GADJ` and to the audit fixture (sha256 `171edda980288a8c2e84766ec2f5786eb8c821b3fe1f82016359e72caeb3305c`) |

Newly authored code is never labelled as course material. The bodies the audit
found incomplete are preserved unmodified in
`bridges_c/original/manual-boundary-data.ORIGINAL-2026-10-20.js` (sha256
`cecbaf24526fc9611c5c7b21b5dc6fdf672803b66908c8751e0ee5ec1788892b`, the same
bytes as the recovery baseline) together with the audit's own reproduction
fixture, so the historical incomplete quotation stays identifiable.

## Build and run

```sh
cd bridges_c
./build.sh            # strict + sanitizer builds, both ADT copies, rewrites RESULTS.txt
./build.sh --quick    # strict build and run only
make parity           # compile the bridge text the app displays and diff it against this code
```

`build.sh` compiles every driver twice:

* strict: `gcc -std=c11 -Wall -Wextra -Wpedantic -Werror`
* sanitizer: `gcc -std=c11 -O1 -g -fsanitize=address,undefined -fno-sanitize-recover=all`

**Backend selection.** All 11 supplied Graph variants declare the same external
names, so exactly one is linked per executable. The directory comes from one
`-I` flag, which also chooses which copy of the read-only ADTs to compile
against: `-I ../memorise_graph_c` (the product copy) or
`-I ../../baseline_pristine/memorise_graph_c` (a copy that cannot change under
the build). `build.sh` does both and records both.

| Backend TU | Supplied / quoted source | Directedness | Weights | Self-loops |
|---|---|---|---|---|
| `adt_undirected_adjlist.c` | `COMP2521_memorise_graph_adjacency_list.c` | undirected | none | **rejected** (`if (v == w \|\| …) return;`) |
| `adt_manual_undirected_matrix.c` | displayed manual adjacency matrix (quotation) | undirected | none | **accepted and counted** |
| `adt_directed_matrix.c` | `COMP2521_memorise_unweighted_directed_adjacency_matrix.c` | directed | none | accepted and counted |
| `wgraph_undirected_adjlist.c` | `COMP2521_memorise_weighted_undirected_adjacency_list.c` | undirected | `double`, finite, `>= 0` | accepted and counted once |
| `wgraph_directed_adjlist.c` | `COMP2521_memorise_weighted_directed_adjacency_list.c` | directed | `double`, finite, `>= 0` | accepted and counted |

## The 14 bridges

| # | id | Purpose | Declared working contract | Required helpers | Ownership | Build / run | Tests | Change |
|---|---|---|---|---|---|---|---|---|
| 1 | `radix-sort` | LSD bucket radix sort of fixed-width keys | each key has exactly `m` symbols; `symbolIndex(key, position)` returns `0 .. R-1`; sorted in place; no stability claim is made beyond the bucket append order | `<stdlib.h>`; `bucketAppend` is in the bridge | caller owns `A[]` and the strings; every bucket is freed before return | `gcc $STRICT test_unchanged.c bridges_graph.c queue.c radix_sort.c adt_undirected_adjlist.c -I $ADT -lm` | `test_unchanged`: order, multiset preservation, `n = 0`, `n = 1` | reviewed-unchanged — no finding; compiled and tested so the completeness claim is checked |
| 2 | `avl-insert-rebalance` | AVL insertion with rotations | heights are stored in each node; empty tree `-1`, leaf `0`; duplicates are ignored; every call returns the new subtree root and the caller must store it back | none beyond `<stdlib.h>`; `height`/`updateHeight`/`balance`/`rotateLeft`/`rotateRight`/`avlRebalance` are in the bridge | nodes are `malloc`ed here; the caller owns the root pointer and frees with `avlFree` | `gcc $STRICT test_avl.c avl.c -lm` | `test_avl`: AVL invariant, stored heights and the `h <= 1.4405·log2(n+2) − 0.3277` bound after every insert, for sizes 1..64 | reviewed-unchanged — no finding |
| 3 | `avl-search` | AVL search | the AVL ordering rule is the BST ordering rule | none | no allocation; no ownership transfer | as row 2 | `test_avl`: agrees with the expected contents after every insert and delete | reviewed-unchanged — no finding |
| 4 | `avl-delete` | AVL deletion | `deleteRoot` removes a BST root and returns the replacement subtree root; it is **AVL-aware** — stored heights stay correct and the internal removal path is rebalanced; `avlDelete` rebalances each ancestor as it unwinds, which is what makes a cascade work | **`deleteRoot` + `removeMin`, newly supplied** (they existed nowhere before); `avlRebalance` from row 2 | the deleted node is freed; the caller stores back the returned root | as row 2 | `test_avl`: 0/1/2-child root deletion, missing key, leaf, one-child, two-child, root; a 7-node discriminating tree whose root deletion needs a rotation inside the right subtree; and a demonstration that a deliberately non-rebalancing helper **fails** the same check | **changed — BRG-05** |
| 5 | `bfs` | breadth-first search and path reconstruction | **predecessor convention: the root is its own predecessor.** `predecessor[src] == src`; `predecessor[w] == -1` means `w` was never reached; any other value is the vertex `w` was first reached from. `-1` has exactly one meaning, and `predecessor[]` is the only reached-marker. Reachability is "zero or more edges", so the source is reachable from itself | **`Queue` (`bridges_c/queue.h`), newly supplied**; the bridge's note assumed one but none was bundled | `bfs` returns a `malloc`ed `int[nV]` that the caller frees; `bfsFindPath` writes into a caller-provided `Vertex path[nV]` | `gcc $STRICT test_bfs.c bridges_graph.c queue.c adt_undirected_adjlist.c -I $ADT -lm` (and again with `adt_manual_undirected_matrix.c`) | `test_bfs`, built against both a loop-rejecting and a loop-accepting backend: the audited empty two-vertex case, source, unreachable, self-reachability, agreement with an independent BFS-layer oracle, and four malformed-array cases that must return `-1` rather than invent a path | **changed — BRG-01** |
| 6 | `dfs` | depth-first search, path checking and path finding | `Graph` is the manual Graph ADT; the adjacency-matrix loop implements "for each neighbour". `dfsHasPath` and `dfsFindPath` use **the same predecessor convention as `bfs` (row 5), deliberately**, so the two lessons can be compared line for line: `predecessor[src] == src`, `predecessor[w] == -1` means not reached. The mark is written BEFORE descending, which is what stops the search revisiting and why `-1` keeps one meaning. DFS reports the FIRST path under neighbour order, **not** the shortest | none | `dfs` returns a `malloc`ed `bool[nV]` that the caller frees. `dfsHasPath` and `dfsFindPath` build and release their own predecessor array, as the pseudocode does; `dfsFindPath` writes into a caller-provided `Vertex path[nV]` and returns the count written — `n > 0` a path (`n == 1` means `dest == src`), `0` dest never reached, `-1` an out-of-range vertex or a malformed chain, and no path is ever invented | `gcc $STRICT test_dfspath.c bridges_graph.c queue.c adt_undirected_adjlist.c -I $ADT -lm` (and again with `adt_manual_undirected_matrix.c` and `adt_directed_matrix.c`) | `test_unchanged`: the visited set equals the source's component, cross-checked against `components`. `test_dfspath` on all three backends: every src-dest pair over a bank of generated graphs against an independent boolean-relaxation reachability oracle, cross-checked against the `dfs()` visited array, plus `src == dest`, unreachable, single vertex, self-loop, a cycle where the first path found is not the shortest, and out-of-range rejection. 27,918 / 27,918 / 26,263 checks, 0 failures | **changed — NEW-15.** The token list registered `dfshaspath` and `dfsfindpath` while the body supplied neither. The routines are now implemented rather than the claim deleted |
| 7 | `undirected-cycle` | undirected cycle detection | the parent vertex is excluded only for the single edge the search arrived on; the root uses the sentinel `NO_PARENT = -1`, which no vertex can equal; `w == v` is recognised as a self-loop **before** the parent test, so a loop the Graph ADT accepted is a cycle | none | `visited[]` is allocated and freed inside `hasCycle` | as row 5 | `test_cycle`, built against both backends: the audited `GraphNew(1)` + `GraphInsertEdge(g,0,0)` case, empty singleton, zero vertices, single edge, path, forest, triangle, four-cycle, a cycle in a later component, and a loop beside ordinary edges. Each self-loop check asserts `hasCycle(g) == GraphIsAdjacent(g,v,v)`, so the same source is correct on either Graph contract | **changed — BRG-06** |
| 8 | `components` | connected-component numbering | `componentOf[v]` is `-1` until `v` is assigned; components are numbered from 0 in vertex order | none | returns a `malloc`ed `int[nV]` that the caller frees | as row 1 | `test_unchanged`: numbering of a 3 + 2 + 1 graph, one-vertex graph, and no vertex left at `-1` | reviewed-unchanged — no finding |
| 9 | `hamiltonian-path` | Hamiltonian path search | backtracking resets `visited[v]` before trying a different path, so the array is clean again after a failed root | none | `visited[]` allocated and freed inside | as row 1 | `test_unchanged`: path graph (yes), triangle (yes), three-leaf star (no), disconnected (no), one vertex (yes) | reviewed-unchanged — no finding |
| 10 | `hamiltonian-circuit` | Hamiltonian circuit search | the manual pseudocode fixes vertex 0 as the start; the bridge declines below three vertices | none | `visited[]` allocated and freed inside | as row 1 | `test_unchanged`: triangle (yes), path graph (no), star (no), one vertex (no, by the stated rule) | reviewed-unchanged — no finding |
| 11 | `warshall` | transitive closure | **reachability convention: positive-length reachability.** `tc` starts as a plain copy of the adjacency matrix, so `tc[v][w]` is true exactly when a walk of **one or more** arcs runs from `v` to `w`, and the diagonal is false unless `v` lies on a cycle (a self-loop counts). The reflexive (zero-or-more) closure is the separately named `warshallReflexive` | `warshallFree(tc, nV)`, newly supplied, because the note already said the matrix is caller-owned | the returned `bool **` is caller-owned: `nV` rows plus the row vector, released by `warshallFree` | `gcc $STRICT test_warshall.c bridges_graph.c queue.c adt_directed_matrix.c -I $ADT -lm` | `test_warshall`: the audited empty two-vertex case (all false, including the diagonal), an unreachable pair, a reachable pair, self-reachability through a 2-cycle and through a self-loop, one vertex, zero vertices, the reflexive alternative differing on the diagonal only, and all 64 arc sets on 3 vertices against an independent reachability oracle | **changed — BRG-02** |
| 12 | `dijkstra` | single-source shortest paths and path reconstruction | **numeric contract:** `Weight` is `double`; the accepted domain is the finite non-negative doubles, so zero and fractional weights are inside it and weights are **not** narrowed to `int`. **missing-edge contract:** `WGraphWeight` returns `WGRAPH_NO_EDGE`, which is `+INFINITY` and therefore outside the accepted domain, so it can never be confused with a real weight; `WGraphEdgeWeight(g,v,w,&out)` is the equivalent bool form. **unreachable:** `dist[v] == WGRAPH_INFINITY`. **predecessor contract:** `dist` decides reachability and `pred[src]` stays `-1` — deliberately unlike `bfs`, which has no `dist` array; the difference is stated in the bridge comment so the two lessons are not read as one convention. Negative weights are outside the representation's domain | **the whole weighted API, newly supplied** (`WeightedGraph`, `Weight`, `Edge`, `WGRAPH_NO_EDGE`, `WGRAPH_INFINITY`, `WGraphNumVertices`, `WGraphWeight`, …) — none of it existed | the caller owns `dist[nV]` and `pred[nV]`; the bridge allocates nothing for the caller; `WGraphEdges`/`WGraphEdgesByWeight` arrays are caller-freed | `gcc $STRICT test_dijkstra.c bridges_weighted.c wgraph_common.c wgraph_directed_adjlist.c -I $ADT -lm` | `test_dijkstra`: a genuine `0.0`-weight edge is an edge and not "absent"; a failed query leaves the out-parameter untouched; fractional weights decide the route (`0.75` beats `1.0`); unreachable keeps infinity; `src == dest`; `pred[src] == -1`; a vertex with only a self-loop; malformed `dist`/`pred` rejected; and all 64 arc subsets × 4 sources against a Bellman-Ford oracle, with every finite distance re-walked edge by edge | **changed — BRG-05** |
| 13 | `kruskal` | minimum spanning tree by weight order | **result contract:** returns `MstResult { status, tree, nVertices, nEdges, nComponents, totalWeight }`. `MST_SPANNING_TREE` means `tree` spans every vertex (`nEdges == nVertices - 1`, `nComponents == 1`); `MST_NO_SPANNING_TREE` means no spanning tree exists and `tree` is a minimum spanning **forest of every component**, which is not an MST. `nVertices == 1` succeeds with 0 edges and total weight `0.0`; `nVertices == 0` is reported as no spanning tree rather than as a vacuous success. `WGraphEdgesByWeight` returns every edge once in non-decreasing weight order, ties broken by `(v, w)`, so the answer is reproducible without making one of several equal-cost trees the only correct one. A self-loop can never be chosen. Requires an undirected backend and says so | **`WGraphEdgesByWeight`, `Edge`, `WGraphHasPath`, `WGraphNumComponents`, `WGraphNew`, `WGraphInsertEdge`, newly supplied**; `GraphHasPath` etc. did not exist | the caller owns the result and releases it exactly once with `MstResultFree(&r)`, in the success and the failure case alike; the sorted-edge array is freed inside; the input graph is untouched and still belongs to its own caller | `gcc $STRICT test_mst.c bridges_weighted.c wgraph_common.c wgraph_undirected_adjlist.c -I $ADT -lm` | `test_mst`: connected with zero and fractional weights, tied weights, the audited 3-vertex/1-edge disconnected case, a disconnected case whose edge avoids vertex 0, singleton, singleton with a self-loop, a self-loop that is the cheapest edge, zero vertices, and all 64 subsets of a 6-edge pool against a brute-force minimum-cost oracle; plus `test_mst_backend_guard`, which must exit non-zero on a directed backend | **changed — BRG-03, BRG-05** |
| 14 | `prim` | minimum spanning tree by growing from vertex 0 | the same `MstResult` contract as row 13, with one declared difference: Prim grows only from vertex 0, so on a disconnected graph its forest is a minimum spanning tree of **vertex 0's component only** and the other vertices stay isolated, where Kruskal's forest covers every component. `nVertices == 0` returns before any array access | `WGraphEdges`, `Edge`, `WGraphNumComponents`, newly supplied | as row 13 | as row 13 | `test_mst` (same cases; the two forests are asserted to differ exactly as declared) | **changed — BRG-04, BRG-05** |

`$STRICT` is `-std=c11 -Wall -Wextra -Wpedantic -Werror`; `$ADT` is the Graph ADT
directory described under *Backend selection*. The sanitizer build uses the same
sources with `-std=c11 -O1 -g -fsanitize=address,undefined
-fno-sanitize-recover=all`.

## What the original bodies omitted, and why each correction is sound

Each item is also recorded as a `Correction note` comment in the bridge the app
displays, so a learner sees it next to the code.

* **BRG-01 `bfs`.** The original kept a separate `visited[]` array and never
  assigned `predecessor[src]`, so on an empty two-vertex graph it returned
  `[-1, -1]` while the lesson's trace recorded `[0, -1]`, and `-1` meant both
  "root" and "never reached". The correction seeds `predecessor[src] = src` and
  uses `predecessor[]` as the only reached-marker. It is sound because that is
  the convention the 26T2 pseudocode prints (`predecessor[src] = src`, then
  "where `predecessor[w] = -1`") and the one the trace executes, it removes the
  second meaning of `-1`, and it leaves the visited bookkeeping with exactly one
  owner. The path consumer `bfsFindPath` reads `-1` the same way.
* **BRG-02 `warshall`.** The original initialised
  `tc[v][w] = (v == w) || GraphIsAdjacent(g, v, w)` — the reflexive closure —
  and so returned the identity matrix on an empty two-vertex graph while the
  lesson returned the all-false matrix. The correction initialises `tc` as a
  plain copy of `A`. It is sound because the manual pseudocode says "create tc
  matrix which is a copy of A", that is what the trace executes, and the
  reflexive contract is not lost: it is kept, separately and by name, as
  `warshallReflexive`, which differs on the diagonal only.
* **BRG-03 `kruskal` / BRG-04 `prim`.** Both returned a partial graph with no
  failure status, so a caller could not tell a spanning tree from a forest. The
  correction returns a documented `MstResult` whose `status` states the outcome
  and whose `nComponents`, `nEdges` and `totalWeight` let a caller verify it. It
  is sound because the status is derived from the finished tree rather than
  asserted (`nComponents` is recomputed from the result), the forest is named a
  forest, `MstResultFree` names one owner for the returned graph, and the
  singleton case is implemented rather than excluded — `V = 1` yields a spanning
  tree with 0 edges and weight `0.0`. Keeping the weights on the returned tree
  also lets the total be re-derived independently, which the original
  unweighted-graph return value made impossible.
* **BRG-05 `avl-delete`.** `deleteRoot` was assumed by the conversion note and
  defined nowhere. The correction supplies it with an AVL-aware `removeMin`: the
  path the in-order successor is lifted out of is rebalanced on the way back
  out, and the replacement root is rebalanced too. It is sound because that path
  is exactly where a deletion shortens a subtree, and `test_avl` demonstrates
  the difference: the same checks fail for a deliberately non-rebalancing helper
  defined inside the driver.
* **BRG-05 `dijkstra`.** The original used `int dist[]`, `INT_MAX` and a
  `NO_EDGE` macro, none of the weighted types or helpers existed, and the
  weighted ADTs it would have to run on store `double` weights that may be zero
  or fractional. The correction supplies the weighted API and switches the
  distance type to `Weight`, with `+INFINITY` as both the unreachable distance
  and the absent-edge sentinel and the accepted weight domain restricted to the
  finite non-negative doubles. It is sound because the sentinel is then provably
  outside the value domain — a `0.0` edge stays an edge — and no weight is
  narrowed to fit the bridge.
* **BRG-06 `undirected-cycle`.** The original started each DFS root with
  `dfsHasCycle(g, v, v, visited)`, so at a root the parent-edge exclusion
  skipped the vertex itself and an accepted edge `(v, v)` was never examined:
  with the displayed manual Graph ADT, `GraphNew(1)` plus
  `GraphInsertEdge(g, 0, 0)` gave `nE == 1`, `GraphIsAdjacent(g,0,0) == true`
  and `hasCycle == false`. The correction uses the sentinel `NO_PARENT = -1`,
  which no vertex can equal, and recognises `w == v` as a self-loop before the
  parent test. It is sound because ordinary simple graphs are unaffected — a
  simple graph has no `v` with `GraphIsAdjacent(g, v, v)` — and the C Graph
  contract is not narrowed to dodge the case. This was a defect in the C
  composition; the browser's graph input parser rejects self-loops separately
  and is not involved.

## Recorded result

`bridges_c/RESULTS.txt` is written by `build.sh` and holds the actual exit
statuses. The first run of 2026-10-20 recorded 10 targets × 4 configurations
(strict and sanitizer, against both ADT copies) = 40 target runs, all PASS,
8,452 checks and 0 failures.

The NEW-15 pass added `test_dfspath` against three backends, taking the matrix
to **13 targets, all PASS**, with `test_dfspath` contributing 27,918 checks on
each undirected backend and 26,263 on the directed one, 0 failures, under
AddressSanitizer, UndefinedBehaviorSanitizer and LeakSanitizer. Two mutation
controls confirm the suite is not vacuous: removing the predecessor mark
segfaults through unbounded recursion, and dropping `src` from the
reconstruction produces 3,389 failures. The four displayed-excerpt translation
units still compile with exit 0, and the displayed-text parity check still
reports 0 of 14 bridges differing from the compiled code.

`test_mst_backend_guard` is the one target whose **expected** exit status is
non-zero: it proves `kruskalMst` refuses a directed backend instead of
returning a plausible wrong answer. Its sanitizer run sets
`ASAN_OPTIONS=detect_leaks=0`, because the guard exits on purpose with the graph
still allocated and that live allocation is not a leak defect.

## Open

* ~~`MANIFEST.json` and `SHA256SUMS.txt` still carry the pre-change size and
  sha256 for `assets/manual-boundary-data.js`.~~ **Resolved.** Both are now
  refreshed by `tools/refresh_manifest.cjs`, whose `--check` mode is a release
  gate, so a stale entry fails the build instead of being discovered by a
  reader. `sha256sum -c SHA256SUMS.txt` verifies 72 of 72. The script
  deliberately leaves `version`, `status` and `distribution` untouched, because
  assigning a version or promoting a status is a publication decision reserved
  for the owner; it records that reservation in the manifest instead.
* Whether each bridge is *wired* to a live source block or placed as a
  discoverable supplemental lesson is a matcher and lesson-placement question,
  not a C-correctness one. It has since been measured rather than left open:
  `tools/audit_manual_bridges.cjs` sweeps every module on every page in a real
  browser and reports 11 manual pairs rendered, 9 bridges matched and 0
  problems. Five bridges never match — `avl-search`, `components`,
  `undirected-cycle`, `hamiltonian-path` and `hamiltonian-circuit` — because
  the panel pairs MANUAL PSEUDOCODE with a C conversion and the 26T2 manual
  prints no pseudocode for those routines; exactly one manual pseudocode block
  exists in the whole app (BFS). That is a property of the source material, not
  a defect, and it is recorded as NEW-23 rather than fixed by relabelling
  lecture content as manual. Where the C is worth showing, the lesson is the
  honest route: `avldel` now traces an AVL search on a supplemental block whose
  body is token-identical to the `avl-search` bridge.
