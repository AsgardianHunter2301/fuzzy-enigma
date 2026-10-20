# Graph ADT in C — eleven alternative implementations

**What this is.** `memorise_graph_c/` holds eleven complete, standalone Graph ADTs.
They are eleven *alternatives*, not eleven parts of a library: they declare the same
`Graph` API, so they can never be linked together. Exactly one is compiled at a time,
together with a driver.

**What changed in this revision.** The previous version of this guide told learners to
memorise every implementation before using a graph algorithm, and stated several
representation rules as if they held for all eleven files. Neither was correct. Audit
findings AUD-14 (documentation overgeneralises representation contracts) and CUR-MOD-02
(unsupported universal memorisation prerequisite) are addressed here; the register at the
end of this file lists every statement that was replaced and why.

> **File names.** The file names still contain the word `memorise`, and this guide is
> still called `MEMORISE_GRAPH_C_GUIDE.md`, because other parts of the distribution
> (`MANIFEST.json`, `SHA256SUMS.txt`, the lesson data) reference those exact paths. The
> word is a historical artefact of the old framing. It is **not** an instruction, and
> nothing in this directory has to be memorised in order to use it.

---

## 1. Source status, and what is *not* established

| Claim | Status |
|---|---|
| These eleven files compile, run and behave as documented here | **Verified** — see `memorise_graph_c/drivers/RESULTS.txt` for the actual commands, exit statuses and output |
| They are exact C printed in a COMP2521 manual or lecture | **Not claimed.** They are supplemental implementations written for this guide |
| They match a specific official course implementation | **Open / unverified.** The original manual and lecture documents were not available to this work, so no comparison against them was possible. Do not describe any file here as official course code |
| Any of them must be memorised before using an algorithm | **Unsupported.** No authoritative source establishing such a requirement was found. The requirement has been removed, not merely softened |

Week context for the graph topics was recorded only at topic level (weeks 4, 5 and 7);
no official per-file or per-block assignment is implied by anything in this directory.
Standard C headers and a C11 toolchain are this code's only prerequisites — those are
dependencies, not course weeks.

---

## 2. Learning path (replaces the old "memorise first" rule)

You do not need all eleven. Work from the algorithm you are actually studying back to
the one representation it needs.

**Step 1 — Identify the representation the algorithm uses.** BFS and DFS walk each
vertex's neighbours, so they want an adjacency structure. Dijkstra and Prim repeatedly
ask for a specific edge's weight, so they want fast weight lookup. Kruskal sorts *all*
edges, so it wants an edge list. Floyd–Warshall indexes pairs directly, so it wants a
matrix.

**Step 2 — Learn the API, not the file.** Every variant exposes the same operations, and
for most algorithm work this interface is all you need:

```c
Graph  GraphNew(int nV);                /* vertices 0 .. nV-1, no edges */
void   GraphFree(Graph g);              /* NULL-safe; does not reset your handle */
int    GraphNumVertices(Graph g);
int    GraphNumEdges(Graph g);          /* READ SECTION 4: nE means two different things */
bool   GraphIsAdjacent(Graph g, Vertex v, Vertex w);
void   GraphInsertEdge(Graph g, Vertex v, Vertex w);                 /* unweighted */
void   GraphInsertEdge(Graph g, Vertex v, Vertex w, Weight weight);  /* weighted */
Weight GraphGetWeight(Graph g, Vertex v, Vertex w);   /* weighted only; edge must exist */
void   GraphRemoveEdge(Graph g, Vertex v, Vertex w);
void   GraphShow(Graph g);
```

**Step 3 — Learn the invariants your code depends on.** These are the things that make an
algorithm correct or wrong, and they are the real content of these files:

- the vertex domain is `0 .. nV-1`, and it is enforced (section 3);
- what `nE` counts in *your* variant (section 4);
- whether a duplicate insert adds an edge or updates a weight (section 5);
- whether a self-loop is accepted or silently dropped (section 5);
- that `GraphGetWeight` has a precondition rather than an "absent" return value (section 6);
- for the adjacency lists, that each neighbour list is kept in ascending vertex order and
  the searches rely on it (section 7).

**Step 4 — Read the one file you chose, end to end.** Trace a single insert through it:
which allocation happens, which pointers or cells change, what happens to `nE`, and what
`GraphFree` has to undo. Run `drivers/build_all.sh` and read the output next to the code.

**Step 5 — Compare, when the comparison teaches something.** Useful pairs:

| Compare | Because it shows |
|---|---|
| `unweighted_directed_adjacency_matrix` vs `unweighted_directed_edge_array` | Θ(1) adjacency test against Θ(E) scanning, and Θ(V²) space against Θ(peak E) space |
| `graph_edge_array` vs `graph_adjacency_list` | the same undirected graph stored as one record per edge versus two symmetric nodes |
| `graph_edge_array` vs `weighted_undirected_edge_array` | two different ways to make one stored record answer both endpoint orders: compare both orders at query time, or canonicalise at insert time |
| `weighted_directed_adjacency_matrix` vs `weighted_directed_adjacency_list` | an in-band sentinel for absence versus structural absence |
| `weighted_undirected_adjacency_list` vs `weighted_directed_adjacency_list` | what symmetry costs on insert, update and removal |

Memorising an implementation is one legitimate way to prepare for a closed-book exam, if
your assessment actually requires writing one out. That is a decision to make from your
own assessment information — it is not a prerequisite imposed by this directory, and this
guide has no authority to impose it.

---

## 3. Build and run — the exact route

The eleven files define the same symbols, so **do not** compile two of them into one
program. Each is included textually by a driver:

```sh
cd memorise_graph_c/drivers
./build_all.sh            # compiles and exercises all eleven, writes RESULTS.txt
```

One variant by hand:

```sh
cd memorise_graph_c/drivers
gcc -std=c11 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Werror \
    -DSOURCE_FILE='"../COMP2521_memorise_weighted_undirected_edge_array.c"' \
    -DVARIANT='"weighted_undirected_edge_array"' \
    -DWEIGHTED=1 -DDIRECTED=0 -DALLOW_LOOPS=1 -DEDGE_ARRAY=1 \
    graph_driver.c -o demo
./demo                      # the documented contract, step by step
./demo fatal-absent-weight  # a precondition violation: exits 1 with a message
```

Writing your own `main` is the same pattern — `#include` the one variant you chose, or
compile it as a separate translation unit with your own header holding the declarations.

**Validation is unconditional.** Every public precondition in all eleven files is checked
with an explicit test that fails loudly:

```
error: vertex 99 is outside 0..4
```
on `stderr`, then `exit(EXIT_FAILURE)` (status 1). These checks are **not** `assert()`,
so `-DNDEBUG` does not remove them and does not change behaviour. All eleven files
compile with zero diagnostics under the strict flag set above both with and without
`-DNDEBUG`.

---

## 4. `nE` means two different things

The API gives no hint of this, and it is the single most transferable mistake:

| Group | `GraphNumEdges` counts | Insert `(1,2)` then `(2,1)` |
|---|---|---|
| the five **undirected** variants | **logical undirected edges** | `nE == 1` |
| the six **directed** variants | **directed arcs** | `nE == 2` |

A self-loop counts as **one** in every variant that accepts one.

Stored entries are a third quantity, different again from `nE`:

| Representation | Stored entries for `nE` undirected edges |
|---|---|
| undirected adjacency list / matrix | `2·nE − (number of self-loops)` |
| undirected edge array | exactly `nE` records |

---

## 5. Per-variant contract summary

Full detail, with line citations, complexity and review depth, is in
**`docs/C_LIBRARY_MATRIX.md`**. This is the summary a learner needs in front of them:

| File (`COMP2521_memorise_…`) | Dir. | Weight | Representation | Self-loop | Duplicate insert | Undirected storage |
|---|---|---|---|---|---|---|
| `graph_adjacency_list.c` | undirected | none | adjacency list | **ignored** | ignored | two symmetric nodes |
| `graph_edge_array.c` | undirected | none | edge array | **ignored** | ignored | **one record**, either order matched at query time |
| `unweighted_directed_adjacency_list.c` | directed | none | adjacency list | accepted, counted | ignored | — |
| `unweighted_directed_adjacency_matrix.c` | directed | none | adjacency matrix (`bool`) | accepted, counted | ignored | — |
| `unweighted_directed_edge_array.c` | directed | none | edge array | accepted, counted | ignored | — |
| `weighted_directed_adjacency_list.c` | directed | `double` | adjacency list | accepted, counted | **weight updated in place**, `nE` unchanged | — |
| `weighted_directed_adjacency_matrix.c` | directed | `double` | adjacency matrix | accepted, counted | **weight updated in place** | — |
| `weighted_directed_edge_array.c` | directed | `double` | edge array | accepted, counted | **weight updated in place** | — |
| `weighted_undirected_adjacency_list.c` | undirected | `double` | adjacency list | accepted, counted | **weight updated in both nodes** | two symmetric nodes, **one** node for a self-loop |
| `weighted_undirected_adjacency_matrix.c` | undirected | `double` | adjacency matrix | accepted, counted | **weight updated in both cells** | two symmetric cells, **one** diagonal cell for a self-loop |
| `weighted_undirected_edge_array.c` | undirected | `double` | edge array | accepted, counted | **weight updated in place** | **one record**, canonicalised to `v <= w` at insert |

Two variants ignore self-loops; the other nine accept and count them. Do not carry a loop
assumption from one file to another.

---

## 6. Weights: domain, absence, and what `GraphGetWeight` promises

All six weighted variants use `typedef double Weight` and accept any **non-negative**
weight, including exactly `0.0` and fractional values. The domain is enforced
unconditionally in every build; `-1.0` and `NaN` are rejected with
`error: weight must be non-negative` and exit status 1.

**Negative weights are outside the domain of all six.** An algorithm that needs them
(Bellman–Ford, for instance) cannot use these variants unchanged. That is a limitation to
know, not a defect to work around by passing a negative value.

**Absence is represented in two different ways:**

| Variants | How "no edge" is represented |
|---|---|
| the two weighted **adjacency matrices** | an in-band sentinel, `#define NO_EDGE (-1.0)`, stored in the cell |
| the two weighted **adjacency lists** | structurally — no node in the list |
| the two weighted **edge arrays** | structurally — no record, `edgeIndex` returns `-1` |

`NO_EDGE` is internal storage, never a return value: because the weight domain excludes
negatives, the sentinel can never collide with a stored weight.

**`GraphGetWeight` has a precondition, not an absent-edge result.** The edge must exist.
Ask first:

```c
if (GraphIsAdjacent(g, v, w)) {
    Weight x = GraphGetWeight(g, v, w);   /* safe */
}
```

Calling it on an edge that is not there is a programming error, and all six variants treat
it as one: `error: GraphGetWeight: no edge (0, 4)` on `stderr`, then exit status 1. There
is no sentinel return and no undefined read, in either build configuration.

`GraphIsAdjacent`, by contrast, is total over the vertex domain: for any valid `v` and `w`
it simply answers `true` or `false`.

---

## 7. What really is shared across all eleven

These statements were checked file by file and hold for every variant:

- **Vertex domain.** Vertices are integers `0 .. nV-1`. Every file tests this with the
  same `static bool validVertex(Graph g, Vertex v)` returning
  `g != NULL && v >= 0 && v < g->nV`, reached through an unconditional guard in every
  public function. An out-of-range vertex, or a `NULL` graph, exits 1 with a message in
  **both** the default and the `-DNDEBUG` build.
- **`GraphNew(0)` is legal** and yields a usable empty graph. `GraphNew` with a negative
  order fails loudly instead of returning a broken object.
- **Allocation failure is checked at every allocation site** — the result is tested, a
  message goes to `stderr`, and the program exits. The three matrix variants roll back
  the rows already allocated before exiting, with no double free.
- **Removing an edge that is not there is a no-op**, not an error, in all eleven.
- **`GraphFree` releases every allocation the Graph owns and accepts `NULL` safely.** It
  does **not** reset your handle, so the handle must not be used or freed again — a
  second `GraphFree` on the same pointer is a double free, and no variant can prevent
  that, because none takes a `Graph *`.
- **Adjacency-list neighbour order.** All four adjacency-list variants keep each vertex's
  neighbour list in **ascending vertex order**, and their searches exit early on that
  order. The invariant is load-bearing: break it in either the insert or the search and
  the search returns false negatives. No file comments on it, which is exactly why it is
  stated here.

And one property that is deliberately *not* uniform:

- **`GraphShow` output differs by variant and that is not a defect.** The two unweighted
  undirected variants print a three-line `Number of vertices: / Number of edges: / Edges:`
  header and a trailing blank line; the other nine print the body only. The body itself
  differs by representation — adjacency rows for lists and matrices, edge tuples for edge
  arrays. The shared declaration `void GraphShow(Graph g);` fixes the signature, not the
  format, and no authoritative source defines one format for all eleven, so the formats
  were left alone and documented per variant in `docs/C_LIBRARY_MATRIX.md`. Do not write
  a test that compares one variant's output against another's.

---

## 8. Cost model: read it from the representation, not from a generic table

Distinguish four quantities. `V` is `nV`. `E` is **what `nE` counts in that variant**
(section 4). `deg(v)` is the number of stored neighbours of `v` — out-degree in the
directed variants. **Allocated capacity** is a fourth quantity that belongs only to the
edge arrays.

| Operation | Adjacency list | Adjacency matrix | Edge array (unsorted) |
|---|---|---|---|
| `GraphNew(V)` | Θ(V) | **Θ(V²)** | **Θ(1)** — allocates nothing per vertex |
| `GraphIsAdjacent` | O(deg(v)) | **Θ(1)** | **Θ(E)** |
| `GraphGetWeight` | O(deg(v)) | **Θ(1)** | **Θ(E)** |
| `GraphInsertEdge` | O(deg(v)) directed; O(deg(v)+deg(w)) undirected | **Θ(1)** | **Θ(E)** |
| `GraphRemoveEdge` | O(deg(v)) directed; O(deg(v)+deg(w)) undirected | **Θ(1)** | **Θ(E)** |
| `GraphShow` | Θ(V + E) | **Θ(V²)** | **Θ(E)** |
| `GraphFree` | Θ(V + E) | Θ(V) | **Θ(1)** |
| Space | Θ(V + E) | **Θ(V²)** | **Θ(peak E)**, independent of V |

Five distinctions the generic table you have seen elsewhere will get wrong:

1. **Enumeration is not an abstract operation.** Listing one vertex's neighbours costs
   Θ(deg(v)) in a list and Θ(V) in a matrix — Θ(V) even for an isolated vertex. That gap,
   not the Θ(1) adjacency test, is what decides BFS and DFS cost.
2. **The edge arrays are unsorted**, so there is no binary search: every lookup is a
   linear scan, and `GraphIsAdjacent` is Θ(E) rather than O(deg). `graph_edge_array`
   compares both endpoint orders during that scan; `weighted_undirected_edge_array`
   canonicalises the pair first. Both remain Θ(E).
3. **Insertion is where worst case and amortised differ, and only in one part.** An
   edge-array insert appends at the tail with no shifting, and the doubling `realloc`
   makes the *append* O(1) amortised and Θ(maxE) in the worst case. But every insert first
   scans for a duplicate, which is Θ(E) — so the insert is Θ(E) both in the worst case and
   amortised. The amortisation buys you nothing here.
4. **One stored record is not two.** An undirected edge-array insert writes one record; an
   undirected adjacency-list or matrix insert writes two entries (one for a self-loop).
   Constant factors, not asymptotics — but it is the thing AUD-14 was about.
5. **Edge-array memory follows peak capacity, never current size.** `maxE` starts at
   `INITIAL_CAPACITY 8` and doubles; `GraphRemoveEdge` shifts the tail down and decrements
   `nE` but never reallocs and never lowers `maxE`. Insert 1,000 edges and remove all
   1,000 and 1,024 slots are still held with `nE == 0`. This is a real, deliberate
   property of the design, not a bug: writing edge-array space as O(E) is wrong, and
   `drivers/build_all.sh` prints `maxE` before and after to show it.

Allocation-failure assumption throughout: every variant treats failure as fatal and
exits, so no operation has a "failed, graph unchanged" return path. If you are modelling
these costs in another language, note that C integer arithmetic here is `int` and these
counts are not range-checked beyond the `maxE` doubling guard.

---

## 9. Correction register for this guide

Every statement below was in the previous version of this file and was wrong, incomplete
or missing. Each replacement was checked against the code and, where behavioural, against
a run recorded in `memorise_graph_c/drivers/RESULTS.txt`.

| # | Previous statement | Why it was wrong | Replaced by |
|---|---|---|---|
| 1 | "MEMORISE FIRST – NOT SOURCE … Learn them separately" and "Memorise the supplemental operation bodies" | No authoritative source establishes a memorisation requirement (CUR-MOD-02). The badge and the existence of complete C do not create one | §2, an operation-driven learning path; §1 states plainly what is and is not established |
| 2 | "Undirected edges are stored in both directions but counted once." | False for both undirected edge arrays, which store **one** record; and false for self-loops in the undirected list and matrix variants, which store **one** entry (AUD-14) | §4 and §5: counted once is right, *stored* differs per representation, tabulated per file |
| 3 | "Weighted variants use the sentinel and nonnegative weight rules declared in their source file." | Three errors: four of the six have **no sentinel**; no file *declares* any rule (the only artefact was an `assert`); and the rule was not enforced in an `NDEBUG` build | §6: one weight domain for all six, enforced in every build, and the three distinct ways absence is represented |
| 4 | "Adjacency lists use ordered neighbours where the implementation states this." | The hedge is wrong both ways: no file states it, and **all four** list variants do order their neighbours and depend on it | §7, final bullet: unconditional, load-bearing, and explicitly an unstated invariant |
| 5 | "Edge arrays start with the declared capacity and grow by checked realloc where provided." | "where provided" is a needless hedge — all four provide it — and the material fact that capacity is **never released** was missing | §8 item 5, with the `maxE` evidence the driver prints |
| 6 | "Vertices are integers from 0 to nV - 1." | True but silent on enforcement, which was `assert`-only and therefore absent in a release build; four functions did not validate at all | §3 and §7: one identical test, reached unconditionally, same behaviour in both builds |
| 7 | "GraphFree releases every owned allocation." | True, but omitted that it is NULL-safe and that it does not reset the caller's handle | §7 |
| 8 | The Files table (direction, weight, representation only) | Correct as far as it went, but omitted the three axes on which the variants actually differ: self-loops, duplicate inserts and undirected storage | §5, three added columns, plus `docs/C_LIBRARY_MATRIX.md` |
| 9 | *(nothing)* | The guide never said what `nE` counts, while asking the learner to "trace nE changes". Directed and undirected variants differ | §4 |
| 10 | *(nothing)* | No build or selection route was given for eleven files that cannot be linked together | §3 and `memorise_graph_c/drivers/` |
| 11 | "The orange MEMORISE label never means manual or lecture source." | The factual half is kept. The label is a **source-status** marker only | §1. The badge styling and lesson wording live in `assets/`, outside this file's scope — see the handover note below |

**Handover note.** Three things touching these files are outside this guide's scope and
need the owner of those assets to act: the orange `MEMORISE` badge and lesson wording in
`assets/corpus-graphs.js` and `assets/corpus-foundations.js` (CUR-MOD-02); the displayed
copies of these implementations embedded in `assets/corpus-source-data.js`, which must be
updated to match the corrected C or the displayed source will no longer be the compiled
source (AUD-14 acceptance); and the digests in `SHA256SUMS.txt` and `MANIFEST.json`, which
this revision changes.
