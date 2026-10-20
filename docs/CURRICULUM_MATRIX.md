# COMP2521 curriculum and teaching-claim matrix

Generated from the reviewed registers this build actually uses:
`CURRICULUM_SOURCES`, `OFFICIAL_WEEKS`, `GROUP_CURRICULUM` and `TOPIC_CURRICULUM` in
`assets/course-enhancements.js`, `SORT_WORK` in the same file, and
`COVERAGE_CAPABILITIES` in `assets/corpus-shared.js`. Nothing here is typed in by hand
twice: the week chips, the recipe objectives, the coverage table and this document are
all produced from those tables, which is the point of the change.

Remediation scope: findings **RES-01**, **RES-02**, **CUR-MOD-01** and **CUR-MOD-04**.

---

## 0. What this document does NOT certify

Read this before using any row below as assurance.

- **The 21 declared original course documents are ABSENT from this repository.** The 26T2
  manual and the `week*.docx` lecture files are not present. Exact-quotation parity between
  what this build displays and what the course issued **cannot be certified**, and no row in
  this document or in `docs/COVERAGE_CAPABILITIES.csv` claims it. Every `review_depth` value
  carries that statement explicitly.
- **Three official sources were unreachable.** The 26T2 outline (OFF-04), the
  Tutorials/Labs/Quizzes resource and the Exams resource returned HTTP 403, and the
  current-term Directed/Weighted Graphs slide link (OFF-08) resolves to a sign-in-required
  page. Claims that depend on them are marked OPEN, not negative.
- **Review depth is recorded at four distinct levels and they are never collapsed into
  "audited: pass".** `read metadata`, `executed one default`, `independently checked
  specified semantics` and `compared against the original course document` are different
  claims. The fourth level is **used nowhere**, because the originals are absent.
- A trace that returns frames does not prove the lesson or its objective is correct. RES-01
  and RES-02 were both defects in objective text sitting on top of traces that ran fine.

## 1. Official week schedule (the only source of week facts)

Verbatim lecture groups from **OFF-01**, the official COMP2521 26T2 lecture schedule,
<https://webcms3.cse.unsw.edu.au/COMP2521/26T2/resources/121287>, read 2026-10-20.

| Week | Numbered | Official lecture groups | Note |
|---|---|---|---|
| Week 1 | yes | Introduction; Recursion; Algorithm analysis |  |
| Extra | **no** | Linked-list revision | Listed as Extra in the official schedule, not a numbered lecture week. |
| Week 2 | yes | Sorting |  |
| Week 3 | yes | Abstract data types; Binary search trees |  |
| Week 4 | yes | BST balancing; AVL trees; Graph introduction |  |
| Week 5 | yes | Graph traversal; Graph problems; Directed and weighted graph introduction |  |
| Week 6 | yes | - | Flex week; no lectures. Not a graph-teaching week. |
| Week 7 | yes | Digraph algorithms; Dijkstra; Minimum spanning trees |  |
| Week 8 | yes | Hash tables; Hash-table applications |  |
| Week 9 | yes | Priority queues and heaps; Tries |  |
| Week 10 | yes | Course and exam review; Revision |  |

Two consequences are encoded in the register rather than left to prose:

1. **"Extra: linked-list revision" is not a numbered week.** It is carried with the literal
   label `Extra` and `numbered:false`. There is no Week 0 anywhere in the register, and a
   generated check confirms none was invented.
2. **Week 6 is Flex with no lectures.** No topic is introduced or applied in Week 6.

## 2. Per-topic curriculum register (CUR-MOD-01)

This replaces the former group-to-single-week map. The defect: `Graph representations`
carried one flat `Week 4` badge, but `graphweighted` mixes basic, **directed** and
**weighted** material, which OFF-01 introduces in Week 5 and applies in Week 7. One chip
cannot express that, so a learner could be told that later material was an early-week
prerequisite. `Directed graphs` had the mirror-image fault: a flat `Week 7` badge put the
directed *terminology* in Week 7, when OFF-01 introduces it in Week 5 and places only the
digraph *algorithms* in Week 7.

Axes are kept separate. **Official** columns come from OFF-01 only. Anything derived from a
topic's own subject is in the Inference column and is labelled an inference, never promoted
to an official assignment.

Standing rule, encoded: a structure used as an optimisation inside another week's lesson
does not move the week the course formally teaches it. Dijkstra and Prim record the
priority-queue optimisation as an inference and heaps keep their own Week 9 introduction.

| Topic id | Module | Official first introduction | Official group | Later application (official) | Revision | Prerequisite topic ids | Relevance | Review depth |
|---|---|---|---|---|---|---|---|---|
| `sel` | Selection sort | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `bub` | Bubble sort | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `ins` | Insertion sort | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `ms` | Merge sort | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `qs` | Quick sort (naive pivot) | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `q3` | Quick sort (median of three) | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `radix` | Radix sort | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `lin` | Linear search | **none** | - | Week 1 | Week 10 | - | prerequisite-revision | executed module defaults; searched OFF-01 for a matching group name and found none |
| `bin` | Binary search | **none** | - | Week 1 | Week 10 | - | prerequisite-revision | executed module defaults; searched OFF-01 for a matching group name and found none |
| `stack` | Stack ADT - complete lifecycle | Week 3 | Abstract data types | Week 5; Week 8; Week 9 | Week 10 | - | directly taught | executed module defaults |
| `queue` | Queue ADT - complete lifecycle | Week 3 | Abstract data types | Week 5; Week 8; Week 9 | Week 10 | - | directly taught | executed module defaults |
| `bstins` | BST insert | Week 3 | Binary search trees | Week 4; Week 4 | Week 10 | `recpyramid` | directly taught | executed module defaults |
| `bstsearch` | BST search | Week 3 | Binary search trees | Week 4; Week 4 | Week 10 | `recpyramid` | directly taught | executed module defaults |
| `bstdel` | BST delete (with bstJoin) | Week 3 | Binary search trees | Week 4; Week 4 | Week 10 | `recpyramid` | directly taught | executed module defaults |
| `bstfree` | BST free (post-order) | Week 3 | Binary search trees | Week 4; Week 4 | Week 10 | `recpyramid` | directly taught | executed module defaults |
| `avlins` | AVL insert | Week 4 | AVL trees | - | Week 10 | `bstins`, `bstrotate` | directly taught | executed module defaults and independently checked that no displayed block reaches the avlSearch bridge (CUR-MOD-04) |
| `avldel` | AVL delete | Week 4 | AVL trees | - | Week 10 | `bstins`, `bstrotate` | directly taught | executed module defaults and independently checked that no displayed block reaches the avlSearch bridge (CUR-MOD-04) |
| `hash` | Hash table - complete separate chaining | Week 8 | Hash tables | Week 8 | Week 10 | `adtarch`, `listsorts` | directly taught | independently checked the load-factor branch, the resize-not-implemented warning and the tombstone/backshift split (CUR-MOD-04) |
| `pq` | Binary heap priority queue - complete lifecycle | Week 9 | Priority queues and heaps | - | Week 10 | `adtarch`, `sortprops` | directly taught | executed module defaults |
| `trie` | Trie - complete insert, search, delete and free | Week 9 | Tries | - | Week 10 | `adtarch` | directly taught | executed module default |
| `graphadt` | Graph ADT - adjacency matrix lifecycle | Week 4 | Graph introduction | Week 5 | Week 10 | - | directly taught | compared group membership and block titles against OFF-01 week rows |
| `bfs` | Breadth-first search | Week 5 | Graph traversal | - | Week 10 | `graphfund`, `graphadt`, `queue`, `stack` | directly taught | executed module defaults |
| `dfs` | Depth-first search | Week 5 | Graph traversal | - | Week 10 | `graphfund`, `graphadt`, `queue`, `stack` | directly taught | executed module defaults |
| `warshall` | Warshall's algorithm | Week 7 | Digraph algorithms | - | Week 10 | `graphfund`, `graphadt`, `cycled` | directly taught | executed module default |
| `dijkstra` | Dijkstra's algorithm | Week 7 | Dijkstra | - | Week 10 | `graphweighted`, `graphfund`, `bfs` | directly taught | executed module default |
| `kruskal` | Kruskal's algorithm | Week 7 | Minimum spanning trees | - | Week 10 | `graphweighted`, `graphedges`, `cycleu` | directly taught | executed module default and searched every displayed block for a union-find reference (none outside the coverage index itself) |
| `prim` | Prim's algorithm | Week 7 | Minimum spanning trees | - | Week 10 | `graphweighted`, `graphedges` | directly taught | executed module default |
| `coursemap` | Supplied-course coverage map | **none** | - | - | - | - | development-only | read and executed the register that generates it |
| `recpyramid` | Pyramid recursion - base case, winding and layers | Week 1 | Recursion | Week 2; Week 3; Week 5 | Week 10 | - | directly taught | executed module defaults and independently checked the factorial call-stack semantics (RES-01) |
| `recfactorial` | Factorial - winding and unwinding | Week 1 | Recursion | Week 2 | Week 10 | - | directly taught | independently checked the call-stack depth, multiplication count and return value for n = 0, 1 and 5 (RES-01) |
| `reclistsum` | Linked-list sum - recursive state | Week 1 | Recursion | - | Extra (unnumbered); Week 10 | - | directly taught | executed module default |
| `reclistappend` | Linked-list append - returned pointer rewiring | Week 1 | Recursion | - | Extra (unnumbered); Week 10 | - | directly taught | executed module default |
| `analysis` | Algorithm analysis - operations and growth | Week 1 | Algorithm analysis | Week 2 | Week 10 | - | directly taught | executed module default |
| `sortprops` | Sorting properties and complexity matrix | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `bottomup` | Bottom-up merge sort | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `listsorts` | Sorting linked lists - pointer movement | Week 2 | Sorting | - | Extra (unnumbered); Week 10 | `ins`, `reclistappend` | directly taught | independently checked its insertion-scan comparison counts against the generator’s own loop (RES-02) |
| `quickvariants` | Quick-sort variants and improvements | Week 2 | Sorting | Week 9 | Week 10 | `analysis` | directly taught | independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02) |
| `adtarch` | ADT architecture - interface, contract and implementation | Week 3 | Abstract data types | Week 5; Week 8; Week 9 | Week 10 | - | directly taught | executed module defaults |
| `setadt` | Set ADT - interface and representation trade-offs | Week 3 | Abstract data types | Week 5; Week 8; Week 9 | Week 10 | - | directly taught | executed module defaults |
| `bsttrav` | BST traversals - pre, in, post and level order | Week 3 | Binary search trees | Week 4; Week 4 | Week 10 | `recpyramid` | directly taught | executed module defaults |
| `bstrotate` | BST rotations - exact pointer rewiring | Week 4 | BST balancing | - | Week 10 | `bstins`, `bstsearch`, `bsttrav` | directly taught | executed module defaults |
| `bstpartition` | BST partition - lift in-order index to root | Week 4 | BST balancing | - | Week 10 | `bstins`, `bstsearch`, `bsttrav` | directly taught | executed module defaults |
| `bstrebalance` | Global and periodic BST rebalancing | Week 4 | BST balancing | - | Week 10 | `bstins`, `bstsearch`, `bsttrav` | directly taught | executed module defaults |
| `bstlocal` | Root insertion and randomised insertion | Week 4 | BST balancing | - | Week 10 | `bstins`, `bstsearch`, `bsttrav` | directly taught | executed module defaults |
| `avlheight` | AVL stored heights and balance factors | Week 4 | AVL trees | - | Week 10 | `bstins`, `bstrotate` | directly taught | executed module defaults and independently checked that no displayed block reaches the avlSearch bridge (CUR-MOD-04) |
| `graphfund` | Graph fundamentals, types and terminology | Week 4 | Graph introduction | Week 5 | Week 10 | - | directly taught | executed the module default and read its two frames; the second frame classifies the supplied edge list |
| `graphreps` | Graph representations - complete source and representation map | Week 4 | Graph introduction | Week 5 | Week 10 | `graphfund` | directly taught | read block titles and executed the module default |
| `graphlist` | Adjacency list - complete prerequisite C, pointers and memory | Week 4 | Graph introduction | Week 5 | Week 10 | `graphfund`, `graphreps` | directly taught | read block titles and executed the module default |
| `graphedges` | Array of edges - complete prerequisite C, resize and lifecycle | Week 4 | Graph introduction | Week 5; Week 7 | Week 10 | `graphfund`, `graphreps` | directly taught | read block titles and executed the module default |
| `graphweighted` | Graph mode x representation - complete C study matrix | Week 4 | Graph introduction | Week 5; Week 7 | Week 10 | `graphfund`, `graphreps`, `graphadt`, `graphlist`, `graphedges` | directly taught | read every block title, executed the module default and compared the block titles with the OFF-01 Week 4/5/7 rows; NOT compared with the original course document, which is absent |
| `bfspath` | BFS shortest path reconstruction | Week 5 | Graph traversal | - | Week 10 | `graphfund`, `graphadt`, `queue`, `stack` | directly taught | executed module defaults |
| `dfspath` | Recursive DFS path checking and finding | Week 5 | Graph traversal | - | Week 10 | `graphfund`, `graphadt`, `queue`, `stack` | directly taught | executed module defaults |
| `dfsiter` | Iterative DFS - explicit stack | Week 5 | Graph traversal | - | Week 10 | `graphfund`, `graphadt`, `queue`, `stack` | directly taught | executed module defaults |
| `cycleu` | Undirected cycle checking - all components | Week 5 | Graph problems | - | Week 10 | `dfs`, `bfs` | directly taught | executed module defaults |
| `components` | Connected components and spanning forest | Week 5 | Graph problems | - | Week 10 | `dfs`, `bfs` | directly taught | executed module defaults |
| `hamilton` | Hamiltonian path and circuit - backtracking | Week 5 | Graph problems | - | Week 10 | `dfs`, `bfs` | directly taught | executed module defaults |
| `euler` | Eulerian path and circuit - degree and connectivity tests | Week 5 | Graph problems | - | Week 10 | `dfs`, `bfs` | directly taught | executed module defaults |
| `cycled` | Directed cycle checking - onStack state | Week 7 | Digraph algorithms | - | Week 10 | `graphfund`, `dfs`, `cycleu` | directly taught | executed module default |
| `webcrawl` | Web crawling - BFS with a visited set | Week 7 | Digraph algorithms | - | Week 10 | `bfs`, `setadt` | directly taught | executed module default |
| `hashprobe` | Linear probing and double hashing | Week 8 | Hash tables | Week 8 | Week 10 | `adtarch`, `listsorts` | directly taught | independently checked the load-factor branch, the resize-not-implemented warning and the tombstone/backshift split (CUR-MOD-04) |
| `hashsetcounter` | Set and Counter over a hash table | Week 8 | Hash-table applications | - | Week 10 | `hash`, `setadt` | directly taught | executed module defaults |
| `twosum` | Two Sum - source-bounded set trace | Week 8 | Hash-table applications | - | Week 10 | `hash`, `setadt` | directly taught | executed module defaults |
| `oddocc` | Odd-occurring distinct values - Counter trace | Week 8 | Hash-table applications | - | Week 10 | `hash`, `setadt` | directly taught | executed module defaults |
| `anagram` | Anagram - character Counter trace | Week 8 | Hash-table applications | - | Week 10 | `hash`, `setadt` | directly taught | executed module defaults |
| `pqcompare` | Priority queue implementation comparison | Week 9 | Priority queues and heaps | - | Week 10 | `adtarch`, `sortprops` | directly taught | executed module defaults |
| `heapify` | Heapify - fix-up and fix-down methods | Week 9 | Priority queues and heaps | - | Week 10 | `adtarch`, `sortprops` | directly taught | executed module defaults |
| `heapsort` | Heap sort - heapify then deheapify | Week 9 | Priority queues and heaps | - | Week 10 | `adtarch`, `sortprops` | directly taught | executed module defaults |
| `namedalgos` | Named-only and contextual syllabus items | **none** | - | - | - | - | contextual-named | executed the module default and read its full block; found that it omits union-find, which its own coverage row names (recorded as an open gap) |

### 2.1 Provenance, assessment and labelled inferences

Only topics that carry an inference or a non-default assessment or provenance entry are
listed; the rest inherit their group record.

**`sel` - Selection sort**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`bub` - Bubble sort**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`ins` - Insertion sort**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`ms` - Merge sort**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`qs` - Quick sort (naive pivot)**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`q3` - Quick sort (median of three)**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`radix` - Radix sort**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`lin` - Linear search**  
- Week label shown in the app: `No official 26T2 lecture week`  
- Quoted-source provenance: 26T2 manual search section (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Linear and binary search are used as the worked examples of the Week 1 analysis lesson, so Week 1 is recorded as an APPLICATION week. That is this build’s reading of its own coverage row, not an OFF-01 assignment: absence from a high-level outline heading is not a reason to call the topic irrelevant.  
- Relevance: prerequisite-revision. Review depth: executed module defaults; searched OFF-01 for a matching group name and found none. Exact-source comparison: NOT performed - declared originals absent.

**`bin` - Binary search**  
- Week label shown in the app: `No official 26T2 lecture week`  
- Quoted-source provenance: 26T2 manual search section (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Linear and binary search are used as the worked examples of the Week 1 analysis lesson, so Week 1 is recorded as an APPLICATION week. That is this build’s reading of its own coverage row, not an OFF-01 assignment: absence from a high-level outline heading is not a reason to call the topic irrelevant.  
- Relevance: prerequisite-revision. Review depth: executed module defaults; searched OFF-01 for a matching group name and found none. Exact-source comparison: NOT performed - declared originals absent.

**`stack` - Stack ADT - complete lifecycle**  
- Week label shown in the app: `Week 3 intro; applied Week 5, Week 8, Week 9`  
- Quoted-source provenance: week03lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The Stack and Queue ADTs are reused by the traversal, hashing and heap lessons. That reuse is this build’s reading; OFF-01 names the week-3 introduction only.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`queue` - Queue ADT - complete lifecycle**  
- Week label shown in the app: `Week 3 intro; applied Week 5, Week 8, Week 9`  
- Quoted-source provenance: week03lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The Stack and Queue ADTs are reused by the traversal, hashing and heap lessons. That reuse is this build’s reading; OFF-01 names the week-3 introduction only.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`bstins` - BST insert**  
- Week label shown in the app: `Week 3 intro; applied Week 4`  
- Quoted-source provenance: week03lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Week 4 is recorded as an application week because OFF-01 places BST balancing and AVL trees there and both build on the week-3 BST. The BST itself is not moved to Week 4; the former ‘Weeks 3-4’ label conflated the two.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`bstsearch` - BST search**  
- Week label shown in the app: `Week 3 intro; applied Week 4`  
- Quoted-source provenance: week03lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Week 4 is recorded as an application week because OFF-01 places BST balancing and AVL trees there and both build on the week-3 BST. The BST itself is not moved to Week 4; the former ‘Weeks 3-4’ label conflated the two.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`bstdel` - BST delete (with bstJoin)**  
- Week label shown in the app: `Week 3 intro; applied Week 4`  
- Quoted-source provenance: week03lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Week 4 is recorded as an application week because OFF-01 places BST balancing and AVL trees there and both build on the week-3 BST. The BST itself is not moved to Week 4; the former ‘Weeks 3-4’ label conflated the two.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`bstfree` - BST free (post-order)**  
- Week label shown in the app: `Week 3 intro; applied Week 4`  
- Quoted-source provenance: week03lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Week 4 is recorded as an application week because OFF-01 places BST balancing and AVL trees there and both build on the week-3 BST. The BST itself is not moved to Week 4; the former ‘Weeks 3-4’ label conflated the two.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`pq` - Binary heap priority queue - complete lifecycle**  
- Week label shown in the app: `Week 9`  
- Quoted-source provenance: week09lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-02`): programming - Excluded from the 26T2 final exam PROGRAMMING section by the notice dated 6 August 2026. Theory - May still be examined in the theory section. 26T2 only. This label must not be applied to any other term.  
- INFERENCE, not an official assignment: Dijkstra and Prim can be optimised with a priority queue, and the Week 7 lesson may mention that. Under the standing rule above this does NOT move heaps earlier than Week 9, so no Week 7 entry is recorded here.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`trie` - Trie - complete insert, search, delete and free**  
- Week label shown in the app: `Week 9`  
- Quoted-source provenance: 26T2 manual trie section (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-02`): programming - Excluded from the 26T2 final exam PROGRAMMING section by the notice dated 6 August 2026. Theory - May still be examined in the theory section. 26T2 only. This label must not be applied to any other term.  
- Relevance: directly taught. Review depth: executed module default. Exact-source comparison: NOT performed - declared originals absent.

**`graphadt` - Graph ADT - adjacency matrix lifecycle**  
- Week label shown in the app: `Week 4 intro; applied Week 5`  
- Quoted-source provenance: week04lec02-graphs-intro (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Week 5 is recorded as an application week for this group because several of its modules also carry directed and weighted material, which OFF-01 introduces in Week 5. Week 4 graph fundamentals are NOT moved to Week 5.  
- Relevance: directly taught. Review depth: compared group membership and block titles against OFF-01 week rows. Exact-source comparison: NOT performed - declared originals absent.

**`warshall` - Warshall's algorithm**  
- Week label shown in the app: `Week 7`  
- Quoted-source provenance: week07lec01-digraph-algorithms (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Directed-graph terminology is introduced in Week 5 and is recorded as a prerequisite, not as this topic’s introduction week.  
- Relevance: directly taught. Review depth: executed module default. Exact-source comparison: NOT performed - declared originals absent.

**`dijkstra` - Dijkstra's algorithm**  
- Week label shown in the app: `Week 7`  
- Quoted-source provenance: week07lec01-dijkstras-algorithm (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: A priority queue is the usual optimisation for the vertex-selection step. Recording that here does NOT move heaps out of Week 9; heaps keep their own Week 9 introduction.  
- Relevance: directly taught. Review depth: executed module default. Exact-source comparison: NOT performed - declared originals absent.

**`kruskal` - Kruskal's algorithm**  
- Week label shown in the app: `Week 7`  
- Quoted-source provenance: week07lec02-msts (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Union-find is the usual cycle-check optimisation and its coverage row names it, but the named-only destination omits it. Recorded as an open gap rather than quietly dropped.  
- Relevance: directly taught. Review depth: executed module default and searched every displayed block for a union-find reference (none outside the coverage index itself). Exact-source comparison: NOT performed - declared originals absent.

**`prim` - Prim's algorithm**  
- Week label shown in the app: `Week 7`  
- Quoted-source provenance: week07lec02-msts (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: A priority queue is the usual optimisation for the crossing-edge choice. That does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: executed module default. Exact-source comparison: NOT performed - declared originals absent.

**`coursemap` - Supplied-course coverage map**  
- Week label shown in the app: `No official 26T2 lecture week`  
- Quoted-source provenance: this build’s own coverage register (term as supplied: not a course source; source `LOCAL`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- Relevance: development-only. Review depth: read and executed the register that generates it. Exact-source comparison: NOT performed - declared originals absent.

**`recpyramid` - Pyramid recursion - base case, winding and layers**  
- Week label shown in the app: `Week 1 intro; applied Week 2, Week 3, Week 5`  
- Quoted-source provenance: week01lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The later application weeks are this build’s reading of where recursion is reused (divide-and-conquer sorts, tree and graph recursion). OFF-01 names the week-1 introduction only.  
- Relevance: directly taught. Review depth: executed module defaults and independently checked the factorial call-stack semantics (RES-01). Exact-source comparison: NOT performed - declared originals absent.

**`recfactorial` - Factorial - winding and unwinding**  
- Week label shown in the app: `Week 1 intro; applied Week 2`  
- Quoted-source provenance: week01lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Reuse in the divide-and-conquer sorting week is this build’s reading, not an OFF-01 assignment.  
- Relevance: directly taught. Review depth: independently checked the call-stack depth, multiplication count and return value for n = 0, 1 and 5 (RES-01). Exact-source comparison: NOT performed - declared originals absent.

**`reclistsum` - Linked-list sum - recursive state**  
- Week label shown in the app: `Week 1`  
- Quoted-source provenance: week01lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The linked-list prerequisite is carried as the official ‘Extra’ revision entry. It is deliberately not numbered: the official schedule has no Week 0.  
- Relevance: directly taught. Review depth: executed module default. Exact-source comparison: NOT performed - declared originals absent.

**`reclistappend` - Linked-list append - returned pointer rewiring**  
- Week label shown in the app: `Week 1`  
- Quoted-source provenance: week01lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Linked-list prerequisite carried as the official ‘Extra’ revision entry, not a numbered week.  
- Relevance: directly taught. Review depth: executed module default. Exact-source comparison: NOT performed - declared originals absent.

**`analysis` - Algorithm analysis - operations and growth**  
- Week label shown in the app: `Week 1 intro; applied Week 2`  
- Quoted-source provenance: week01lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Reuse in the sorting week is this build’s reading, not an OFF-01 assignment.  
- Relevance: directly taught. Review depth: executed module default. Exact-source comparison: NOT performed - declared originals absent.

**`sortprops` - Sorting properties and complexity matrix**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`bottomup` - Bottom-up merge sort**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`listsorts` - Sorting linked lists - pointer movement**  
- Week label shown in the app: `Week 2`  
- Quoted-source provenance: week02lec01-elementary-sorts (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The linked-list representation it relies on is the official ‘Extra’ revision material, not a numbered week. The sorting lesson itself is Week 2.  
- Relevance: directly taught. Review depth: independently checked its insertion-scan comparison counts against the generator’s own loop (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`quickvariants` - Quick-sort variants and improvements**  
- Week label shown in the app: `Week 2 intro; applied Week 9`  
- Quoted-source provenance: week02lec01/week02lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.  
- Relevance: directly taught. Review depth: independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02). Exact-source comparison: NOT performed - declared originals absent.

**`adtarch` - ADT architecture - interface, contract and implementation**  
- Week label shown in the app: `Week 3 intro; applied Week 5, Week 8, Week 9`  
- Quoted-source provenance: week03lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The Stack and Queue ADTs are reused by the traversal, hashing and heap lessons. That reuse is this build’s reading; OFF-01 names the week-3 introduction only.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`setadt` - Set ADT - interface and representation trade-offs**  
- Week label shown in the app: `Week 3 intro; applied Week 5, Week 8, Week 9`  
- Quoted-source provenance: week03lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The Stack and Queue ADTs are reused by the traversal, hashing and heap lessons. That reuse is this build’s reading; OFF-01 names the week-3 introduction only.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`bsttrav` - BST traversals - pre, in, post and level order**  
- Week label shown in the app: `Week 3 intro; applied Week 4`  
- Quoted-source provenance: week03lec02 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Week 4 is recorded as an application week because OFF-01 places BST balancing and AVL trees there and both build on the week-3 BST. The BST itself is not moved to Week 4; the former ‘Weeks 3-4’ label conflated the two.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`graphfund` - Graph fundamentals, types and terminology**  
- Week label shown in the app: `Week 4 intro; applied Week 5`  
- Quoted-source provenance: week04lec02-graphs-intro (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The module also classifies DIRECTED input through its own `kind` field, and directedness is a Week 5 concept in OFF-01. The undirected fundamentals stay in Week 4.  
- Relevance: directly taught. Review depth: executed the module default and read its two frames; the second frame classifies the supplied edge list. Exact-source comparison: NOT performed - declared originals absent.

**`graphreps` - Graph representations - complete source and representation map**  
- Week label shown in the app: `Week 4 intro; applied Week 5`  
- Quoted-source provenance: week04lec02-graphs-intro (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The three-representation comparison is Week 4. The weighted variants among its blocks are Week 5 material by topical inference from the block titles.  
- Relevance: directly taught. Review depth: read block titles and executed the module default. Exact-source comparison: NOT performed - declared originals absent.

**`graphlist` - Adjacency list - complete prerequisite C, pointers and memory**  
- Week label shown in the app: `Week 4 intro; applied Week 5`  
- Quoted-source provenance: week04lec02-graphs-intro (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Its weighted and directed adjacency-list blocks are Week 5 material by topical inference; the undirected unweighted list is Week 4.  
- Relevance: directly taught. Review depth: read block titles and executed the module default. Exact-source comparison: NOT performed - declared originals absent.

**`graphedges` - Array of edges - complete prerequisite C, resize and lifecycle**  
- Week label shown in the app: `Week 4 intro; applied Week 5, Week 7`  
- Quoted-source provenance: week04lec02-graphs-intro (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Week 7 is recorded as an application week because Kruskal consumes an edge array. That is reuse, not a second introduction.  
- Relevance: directly taught. Review depth: read block titles and executed the module default. Exact-source comparison: NOT performed - declared originals absent.

**`graphweighted` - Graph mode x representation - complete C study matrix**  
- Week label shown in the app: `Week 4 intro; applied Week 5, Week 7`  
- Quoted-source provenance: week05lec02-directed-weighted-graphs for the directed/weighted blocks; week04lec02-graphs-intro for the base representations (term as supplied: declared 26T2; independently readable copy is 25T3 only; source `OFF-09`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: Only the UNDIRECTED UNWEIGHTED base representations belong to the Week 4 introduction. The directed and weighted variants in this matrix are Week 5 material and the weighted-digraph combinations are used by Week 7 algorithms. Which individual block belongs to which week is this build’s topical inference from the block titles, NOT an official per-block assignment: OFF-01 names week groups, not blocks. Week 6 is Flex and is not a graph-teaching week.  
- Relevance: directly taught. Review depth: read every block title, executed the module default and compared the block titles with the OFF-01 Week 4/5/7 rows; NOT compared with the original course document, which is absent. Exact-source comparison: NOT performed - declared originals absent.

**`pqcompare` - Priority queue implementation comparison**  
- Week label shown in the app: `Week 9`  
- Quoted-source provenance: week09lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-02`): programming - Excluded from the 26T2 final exam PROGRAMMING section by the notice dated 6 August 2026. Theory - May still be examined in the theory section. 26T2 only. This label must not be applied to any other term.  
- INFERENCE, not an official assignment: Dijkstra and Prim can be optimised with a priority queue, and the Week 7 lesson may mention that. Under the standing rule above this does NOT move heaps earlier than Week 9, so no Week 7 entry is recorded here.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`heapify` - Heapify - fix-up and fix-down methods**  
- Week label shown in the app: `Week 9`  
- Quoted-source provenance: week09lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-02`): programming - Excluded from the 26T2 final exam PROGRAMMING section by the notice dated 6 August 2026. Theory - May still be examined in the theory section. 26T2 only. This label must not be applied to any other term.  
- INFERENCE, not an official assignment: Dijkstra and Prim can be optimised with a priority queue, and the Week 7 lesson may mention that. Under the standing rule above this does NOT move heaps earlier than Week 9, so no Week 7 entry is recorded here.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`heapsort` - Heap sort - heapify then deheapify**  
- Week label shown in the app: `Week 9`  
- Quoted-source provenance: week09lec01 (term as supplied: declared 26T2; source `ABSENT`)  
- Assessment axis (`OFF-02`): programming - Excluded from the 26T2 final exam PROGRAMMING section by the notice dated 6 August 2026. Theory - May still be examined in the theory section. 26T2 only. This label must not be applied to any other term.  
- INFERENCE, not an official assignment: Dijkstra and Prim can be optimised with a priority queue, and the Week 7 lesson may mention that. Under the standing rule above this does NOT move heaps earlier than Week 9, so no Week 7 entry is recorded here.  
- Relevance: directly taught. Review depth: executed module defaults. Exact-source comparison: NOT performed - declared originals absent.

**`namedalgos` - Named-only and contextual syllabus items**  
- Week label shown in the app: `No official 26T2 lecture week`  
- Quoted-source provenance: this build’s own source-boundary list (term as supplied: not a course source; source `LOCAL`)  
- Assessment axis (`OFF-04`): programming - No item-specific assessment requirement was independently established. Theory - No item-specific assessment requirement was independently established. The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.  
- INFERENCE, not an official assignment: The items it lists are named across Weeks 2, 7, 8 and 9 by their coverage rows, but the module itself has no teaching week.  
- Relevance: contextual-named. Review depth: executed the module default and read its full block; found that it omits union-find, which its own coverage row names (recorded as an open gap). Exact-source comparison: NOT performed - declared originals absent.

### 2.2 Assessment axis, stated narrowly

The only item-specific assessment fact that was independently readable is **OFF-02**, the
notice dated **6 August 2026** at <https://webcms3.cse.unsw.edu.au/COMP2521/26T2/>:

> Heaps and tries are excluded from the **26T2 programming section** of the final exam only.

Therefore, and this is deliberate:

- Heaps and tries are **kept in the curriculum**. `pq`, `pqcompare`, `heapify`, `heapsort`
  and `trie` all retain their Week 9 introduction and all remain fully traced.
- They are **not** labelled generally unexaminable. The register states that they may still
  be examined in the **theory** section, and sets `examinable: true`.
- The label is **qualified by term and notice** and must not be applied to another term.
- For every other topic the assessment axis is **OPEN, not negative**: the outline,
  Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so no item-specific
  requirement was established either way.

---

## 3. RES-01 - factorial preset understated stack depth

**The displayed source** (`recfactorial`, block "factorial - lecture C"):

```c
int factorial(int n) {
    if (n == 0) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}
```

The base case is `n == 0`, so `factorial(5)` descends all the way to `factorial(0)`.

**The defect.** The `unwind` preset (n = 5) said *"Track five stack frames and the return
products."* That conflates two different counts.

**Measured, by running the module and reading its own call-stack view:**

| Input | Frames active at peak | Labels at peak | Recursive transitions = multiplications | Result |
|---|---|---|---|---|
| n = 0 | **1** | `factorial(0)` | 0 | 1 |
| n = 1 | **2** | `factorial(1)`, `factorial(0)` | 1 | 1 |
| n = 5 | **6** | `factorial(5)`, `(4)`, `(3)`, `(2)`, `(1)`, `(0)` | **5** | **120** |

So for n = 5 there are **six** simultaneously active stack frames and **five** multiplications.
Five is the number of recursive transitions, not the number of frames.

**Agreement check across the chain.** The commission requires the preset, the caption and
the call-stack view to agree:

| Surface | State | Finding |
|---|---|---|
| Preset objective | **was wrong** | said five frames; **corrected** |
| Module note | correct | talks about automatic storage per call and makes no numeric claim |
| Call-stack view | correct | holds six frames at peak for n = 5, which is how the count was measured |
| `depth` variable | correct | reaches 6 for n = 5 |
| Final frame | correct | reports `5!` is `120` |

Only the preset objective needed changing, and only `assets/course-enhancements.js` was
edited. The corrected text is:

> Count the two things separately. Six stack frames are active at peak - factorial(5) down to the factorial(0) base case - but only five recursive transitions, so only five multiplications on the way back out. Result 120.

And the base-case preset:

> Observe factorial(0) return without another call: one stack frame, no multiplication, result 1.

**Other numeric preset claims were checked rather than copied.** Every preset objective
containing a number or a number word was re-derived against its own input: the seven-node
minimum-height BST, the three-component graph (nV=9, components {0,1,4}, {2,3,5,6}, {7,8}),
the Eulerian path preset (degrees 2,2,2,3,1 - exactly two odd), the single-unreachable-vertex
Dijkstra preset, the one-rotation AVL cases and the single-long-branch degenerate BST. All
were correct. RES-01 was the only numeric defect found among the presets.

---

## 4. RES-02 - one shared sort objective was wrong per algorithm

**The defect.** One recipe set was attached to eight modules, and its `reverse` preset said
*"Expose the high-work ordering for comparison-based methods."* That claim is algorithm-
specific and was asserted without defining what was being counted.

**Counted operation, defined before any best/worst claim: `one key-vs-key comparison`** - that is, one evaluation of
a displayed `lt`/`le`/`ge`/`gt` macro, or for `listsorts` one evaluation of `S[i] <= v`.
Loop-bound index tests such as `j <= hi` or `i < S.length` are **not** counted, and neither
are swaps or pointer writes.

**Inputs** (six items each): sorted `1 2 3 4 5 6`, reverse `6 5 4 3 2 1`, duplicates `4 2 4 1 2 3`.

**Method, and why not frame counts.** Each count comes from an oracle transcribed line by
line from the block the module displays, then cross-checked by counting the module's own
comparison frames. The two methods agree exactly for `sel`, `bub`, `ins`, `ms`, `bottomup`
and `qs`. They disagree for `q3`, and the reason matters: the `q3` trace emits a
`medianOfThree` frame only when a test **swaps**, so the timeline shows 11/14/18 while the
source performs 18/19/24. **A frame total is not a comparison oracle** - which is exactly
why the objectives are generated from the measured register rather than read off the
timeline.

| Algorithm | Module | sorted | reverse | duplicates | Highest work | Lowest work | Is reverse the high-work input? |
|---|---|---|---|---|---|---|---|
| `sel` | Selection sort | 15 | 15 | 15 | all equal | all equal | **No - input-independent** |
| `bub` | Bubble sort | 5 | 15 | 14 | reverse | sorted | Yes |
| `ins` | Insertion sort | 5 | 15 | 11 | reverse | sorted | Yes |
| `ms` | Merge sort | 9 | 7 | 10 | duplicates | reverse | **No - reverse is the CHEAPEST** |
| `bottomup` | Bottom-up merge sort | 9 | 7 | 10 | duplicates | reverse | **No - reverse is the CHEAPEST** |
| `qs` | Quick sort (naive pivot) | 19 | 17 | 15 | sorted | duplicates | **No - sorted is dearest** |
| `q3` | Quick sort (median of three) | 18 | 19 | 24 | duplicates | sorted | **No - duplicates is dearest** |
| `listsorts` | Sorting linked lists - pointer movement | 15 | 5 | 11 | sorted | reverse | **No - reverse is the CHEAPEST** |

**So the shared objective was accurate for two of the eight modules.** It was correct for
`bub` and `ins`; wrong for `sel` (input-independent), wrong for `ms` and `bottomup` (reverse
is their cheapest of the three), wrong for `qs` (sorted is dearest, and sorted and reverse
do **not** tie), wrong for `q3` (duplicates is dearest), and **exactly inverted** for
`listsorts`.

### 4.1 The `listsorts` inversion

The generator scans with `while (i < S.length && S[i] <= v) i++`:

| Input | Insertion positions | Comparisons | Why |
|---|---|---|---|
| sorted | `0,1,2,3,4,5` | 15 | each ascending value walks the whole accumulated sorted prefix |
| reverse | `0,0,0,0,0,0` | 5 | each descending value fails `S[0] <= v` on the first test and is relinked at the head |
| duplicates | `0,0,2,0,2,3` | 11 | `<=` passes over an equal key, so the node lands after the existing equal keys |

Descending input is this implementation's **best** case - the opposite of array insertion
sort, where descending is the worst case. A learner generalising from `ins` to `listsorts`
would have been taught the wrong input-cost behaviour by the old shared caption.

### 4.2 The generated objectives

Each of the 24 sorting objectives now states the counted operation **first**, then the
measured count, then the explanation. They are generated from `SORT_WORK`, so each measured
number is written once:

**`sel`** - shape: input-independent

- *sorted*: Counted operation: one evaluation of lt(items[j], items[min]). On this 6-item preset: 15 comparisons. The inner scan always runs from i+1 to hi, so existing order cannot shorten it. n(n-1)/2 comparisons happen on every six-item input.
- *reverse*: Counted operation: one evaluation of lt(items[j], items[min]). On this 6-item preset: 15 comparisons. Exactly the same count as sorted input. Reverse order is NOT a high-work case here: selection sort is non-adaptive, so no input is a best or worst case for comparisons.
- *duplicates*: Counted operation: one evaluation of lt(items[j], items[min]). On this 6-item preset: 15 comparisons. Equal keys do not shorten the scan either. The strict lt test simply keeps the earlier of two equal keys as the running minimum, which is why selection sort is unstable.

**`bub`** - shape: adaptive through the early-exit break

- *sorted*: Counted operation: one evaluation of gt(items[j], items[j + 1]). On this 6-item preset: 5 comparisons. The first pass makes no swap, so `swapped` stays false and the `break` ends the sort after a single pass. This is bubble sort’s best case.
- *reverse*: Counted operation: one evaluation of gt(items[j], items[j + 1]). On this 6-item preset: 15 comparisons. The dearest of the three. Every pass swaps, so no pass can exit early and all n-1 passes run. This IS the high-work ordering for this algorithm.
- *duplicates*: Counted operation: one evaluation of gt(items[j], items[j + 1]). On this 6-item preset: 14 comparisons. Between the sorted and reverse counts. The early exit only fires once a whole pass finds the array already in order.

**`ins`** - shape: adaptive to existing order

- *sorted*: Counted operation: one evaluation of lt(item, items[j - 1]). On this 6-item preset: 5 comparisons. Each item’s first lt test fails at once and nothing shifts. Best case.
- *reverse*: Counted operation: one evaluation of lt(item, items[j - 1]). On this 6-item preset: 15 comparisons. The dearest of the three. Every item is shifted past the whole sorted prefix before it lands. This IS the high-work ordering for this algorithm.
- *duplicates*: Counted operation: one evaluation of lt(item, items[j - 1]). On this 6-item preset: 11 comparisons. Partial order gives partial benefit, which is what "adaptive" means. Contrast listsorts, which uses the same method on a linked list and is dearest on SORTED input.

**`ms`** - shape: effectively input-independent; this call tree permits only 7 to 11

- *sorted*: Counted operation: one evaluation of le(items[i], items[j]) inside merge. On this 6-item preset: 9 comparisons. Every merge exhausts its left run first, comparing once per left-hand item.
- *reverse*: Counted operation: one evaluation of le(items[i], items[j]) inside merge. On this 6-item preset: 7 comparisons. The CHEAPEST of these three, not the dearest. Each merge fails its first le test, takes the whole right run, and then copies the left run across without comparing anything further. Reverse order is not a worst case for merge sort.
- *duplicates*: Counted operation: one evaluation of le(items[i], items[j]) inside merge. On this 6-item preset: 10 comparisons. The dearest of the three, by one comparison. The whole spread sits inside the 7-to-11 band this call tree allows, so merge sort is effectively input-independent.

**`bottomup`** - shape: effectively input-independent; the same merges as top-down, in iterative pass order

- *sorted*: Counted operation: one evaluation of le(items[i], items[j]) inside merge. On this 6-item preset: 9 comparisons. The same total as top-down merge sort, because the identical merges happen in a different order.
- *reverse*: Counted operation: one evaluation of le(items[i], items[j]) inside merge. On this 6-item preset: 7 comparisons. The CHEAPEST of these three. Each merge empties its right-hand run on the first le test. Reverse order is not a worst case for a merge sort.
- *duplicates*: Counted operation: one evaluation of le(items[i], items[j]) inside merge. On this 6-item preset: 10 comparisons. The dearest of the three, by one comparison, and identical to top-down merge sort on all three inputs. Compare the pass structure, not the cost.

**`qs`** - shape: degenerate on ordered input in BOTH directions

- *sorted*: Counted operation: one evaluation of le/ge/lt inside partition. On this 6-item preset: 19 comparisons. The dearest of the three. The naive pivot is items[lo], which on sorted input is the minimum, so every partition peels off a single element and the recursion runs n deep.
- *reverse*: Counted operation: one evaluation of le/ge/lt inside partition. On this 6-item preset: 17 comparisons. Also degenerate - the pivot is now the maximum - but measurably CHEAPER than sorted input, not equal to it. Ordered input is bad for this pivot rule in both directions without the two being a tie.
- *duplicates*: Counted operation: one evaluation of le/ge/lt inside partition. On this 6-item preset: 15 comparisons. The CHEAPEST of the three. An unordered input gives this pivot rule a more even split than either ordered input does.

**`q3`** - shape: ordered-input penalty removed, at the cost of three extra gt tests per call

- *sorted*: Counted operation: one evaluation of gt inside medianOfThree, or le/ge/lt inside partition. On this 6-item preset: 18 comparisons (9 in medianOfThree and 9 in partition). Median-of-three defuses the sorted worst case: the split is even. Compare the naive pivot, which is dearer on this same input and splits far more unevenly.
- *reverse*: Counted operation: one evaluation of gt inside medianOfThree, or le/ge/lt inside partition. On this 6-item preset: 19 comparisons (9 in medianOfThree and 10 in partition). Reverse order is not specially bad here either; median-of-three places the median at lo before partitioning whichever way the input runs.
- *duplicates*: Counted operation: one evaluation of gt inside medianOfThree, or le/ge/lt inside partition. On this 6-item preset: 24 comparisons (12 in medianOfThree and 12 in partition). The DEAREST of the three for this algorithm. Median-of-three removes the ordered-input penalty but pays three gt tests on every call, so the input that was cheapest for the naive pivot is dearest here.

**`listsorts`** - shape: INVERTED relative to array insertion sort

- *sorted*: Counted operation: one evaluation of S[i] <= v in the insertion scan `while (i < S.length && S[i] <= v) i++`. On this 6-item preset: 15 comparisons (insertion positions 0,1,2,3,4,5). The DEAREST of the three for this implementation, and the exact opposite of array insertion sort, where sorted input is the best case. Each ascending value walks the entire accumulated sorted prefix of S before stopping.
- *reverse*: Counted operation: one evaluation of S[i] <= v in the insertion scan `while (i < S.length && S[i] <= v) i++`. On this 6-item preset: 5 comparisons (insertion positions 0,0,0,0,0,0). The CHEAPEST of the three. Each descending value fails S[0] <= v on its very first test and is relinked at the head of S. Descending input is this algorithm’s BEST case - the old shared objective claimed the exact opposite.
- *duplicates*: Counted operation: one evaluation of S[i] <= v in the insertion scan `while (i < S.length && S[i] <= v) i++`. On this 6-item preset: 11 comparisons (insertion positions 0,0,2,0,2,3). The scan tests <=, so an equal key is passed over and the new node is relinked after the existing equal keys rather than before them.

### 4.3 Where this disagrees with the brief's measurements

Four of the eight rows in the brief were reproduced exactly; three differ. Both of my
independent methods agree with each other on every algorithm except `q3`, where the
discrepancy is fully explained by the trace omission described above.

| Algorithm | Brief: sorted/reverse/duplicates | Measured here | Agreement |
|---|---|---|---|
| `sel` | 15 / 15 / 15 | 15 / 15 / 15 | exact |
| `bub` | 5 / 15 / 14 | 5 / 15 / 14 | exact |
| `ins` | 5 / 15 / 11 | 5 / 15 / 11 | exact |
| `listsorts` | 15 / 5 / 11 | 15 / 5 / 11 | exact |
| `ms` | 7 / 9 / 9 | **9 / 7 / 10** | differs - see below |
| `qs` | 15 / 15 / 10 | **19 / 17 / 15** | differs - see below |
| `q3` | 17 / 17 / 18 | **18 / 19 / 24** | differs - see below |
| `bottomup` | not given | 9 / 7 / 10 | new |

- **`ms`**: the brief's sorted and reverse figures look transposed. Hand-derivation of the
  five merges for n = 6 gives 1+2+1+2+3 = **9** on sorted input and 1+1+1+1+3 = **7** on
  reverse; duplicates gives 1+2+1+2+4 = **10**. The call tree permits only 7 to 11
  comparisons, and 7 is its structural minimum - so reverse is not merely cheaper, it is as
  cheap as this call tree can be. The brief's direction claim ("reverse/duplicates highest")
  is therefore inverted for reverse.
- **`qs`**: hand-derivation of the five partitions on sorted input gives 6+5+4+3+1 = **19**,
  and on reverse 5+5+3+3+1 = **17**. They do **not** tie, so "sorted AND reverse tie as
  worst" does not hold; sorted alone is the worst of the three.
- **`q3`**: the direction in the brief is right (duplicates is dearest) but the magnitudes
  differ. Hand-derivation on sorted input gives 3+6+3+1+3+2 = **18**. The brief's numbers
  are close to what the *trace* shows once the omitted `medianOfThree` tests are added back
  partially, which is consistent with them having been taken from frame counts.

Hand-derivations were done for `qs` sorted, `qs` reverse, `ms` on all three inputs and `q3`
sorted, and each matched the oracle. Every oracle also verified that its output array was
correctly sorted, so none of the transcriptions is a broken algorithm producing a plausible
count.

---

## 5. CUR-MOD-04 - coverage rows split per capability

The former table held **93 rows**. Several bundled multiple capabilities whose destinations
did not all implement them, so a high-level count could look complete while a specific
operation was absent. The table is now **181 individual capability records**, each with one
capability, its own destination, its delivery mode and its completeness. The five displayed
columns are **derived** from that register, so the rendered coverage table, the coverage
index block and this document cannot disagree.

| Dimension | Breakdown |
|---|---|
| Capabilities | 181 (from 93 bundled rows) |
| Delivery mode | conceptual-reference: 50, executable: 116, named-only: 15 |
| Completeness | complete: 167, missing: 4, partial: 10 |
| Category (inherited, never downgraded) | core: 148, named: 9, reference: 24 |
| Review depth | executed one default: 146, independently checked specified semantics: 35 |

Per-capability detail, including evidence and required action for every record, is in
**`docs/COVERAGE_CAPABILITIES.csv`**, generated from the same table.

A conceptual reference is treated as a **legitimate** destination for a conceptual learning
outcome - `adtarch`, `setadt`, `sortprops` and `pqcompare` are comparison and architecture
lessons and a single static frame suits them. What changed is that they are now labelled
`conceptual-reference` instead of sitting in a table that implied a trace. A promised
**executable** capability still has to have a working destination.

### 5.1 The five bundles the commission named for scrutiny

| Bundle | Split into | Verified by | Outcome |
|---|---|---|---|
| Radix padding vs a fixed-width tracer | LSD passes, bucket distribution, stability, **padding** | ran `radix` with mixed-width keys `7 42 318` | 3 complete; **padding MISSING** - the module refuses mixed-width input with *"the manual does not pad them"*, the pseudocode never mentions padding, and "padding" appears in no destination |
| Global vs periodic rebalancing | **global**, **periodic** | ran both modes of `bstrebalance` | global complete (15-frame executable trace); **periodic PARTIAL** - one frame of prose, no traced insertion, no k, no triggered rebalance |
| Chaining + load factor + resizing | **chaining**, **load factor**, **resizing** | ran `hash` default, then drove 23 inserts into the 11-slot table | chaining and load factor complete (the test flipped true exactly once, at insert 23); **resizing MISSING** - the displayed manual source is literally `printf("warning: resize not implemented!")` with no return |
| Tombstone vs backshift deletion | **linear probing**, **tombstone**, **backshift**, **clustering**, **double hashing** | read the whole `hashprobe` module and ran it | probing, tombstone and double hashing complete; **backshift PARTIAL** (two lines of prose, no deletion-method selector) and **clustering PARTIAL** (one prose line) |
| AVL search vs an AVL deletion destination | **AVL deletion**, **AVL search** | token-searched every displayed block for `avlSearch` | deletion complete; **search PARTIAL** - no standalone AVL search destination exists, and the `avl-search` bridge that *does* exist in `manual-boundary-data.js` is **unreachable**, because the bridge matcher keys on block headings and bodies and no displayed block mentions `avlSearch` |

### 5.2 Open gaps - 14 capabilities

**None of these was closed by weakening a promise or relabelling a capability unsupported.**
Each keeps its inherited category and is recorded as an open gap with evidence, for the
Principal to decide. Four are **missing** outright; ten are **partial** - stated somewhere
but not delivered at the granularity the row promised.

| id | Week | Capability | Category | Destination | Mode | Status | Review depth |
|---|---|---|---|---|---|---|---|
| `CAP-026` | W2 Sorting | Sorting motivation (why sorting is studied) | core | `sortprops` | named-only | **MISSING** | independently checked specified semantics |
| `CAP-028` | W2 Sorting | Item and key types | core | `stack / queue` | conceptual-reference | **PARTIAL** | independently checked specified semantics |
| `CAP-037` | W2 Sorting | Selection and bubble sort on a linked list | core | `listsorts` | conceptual-reference | **PARTIAL** | independently checked specified semantics |
| `CAP-051` | W2 Sorting | Radix key padding for unequal-width keys | core | `radix` | named-only | **MISSING** | independently checked specified semantics |
| `CAP-066` | W3 BST | Tree and BST terminology | reference | `bsttrav` | conceptual-reference | **PARTIAL** | independently checked specified semantics |
| `CAP-076` | W4 Balanced BST | Size balance | reference | `bstrebalance` | conceptual-reference | **PARTIAL** | independently checked specified semantics |
| `CAP-083` | W4 Balanced BST | Periodic rebalancing | core | `bstrebalance` | conceptual-reference | **PARTIAL** | independently checked specified semantics |
| `CAP-087` | W4 AVL | AVL height guarantee | reference | `avlheight` | conceptual-reference | **PARTIAL** | independently checked specified semantics |
| `CAP-093` | W4 AVL | AVL search | core | `avldel` | conceptual-reference | **PARTIAL** | independently checked specified semantics |
| `CAP-117` | W5 Traversal | Spanning tree / spanning forest structure | reference | `components` | conceptual-reference | **PARTIAL** | independently checked specified semantics |
| `CAP-146` | W7 MST | Union-find as the Kruskal cycle-check optimisation | named | `namedalgos` | named-only | **MISSING** | independently checked specified semantics |
| `CAP-154` | W8 Hashing | Hash-table resizing | core | `hash` | named-only | **MISSING** | independently checked specified semantics |
| `CAP-157` | W8 Hashing | Backshift deletion | core | `hashprobe` | conceptual-reference | **PARTIAL** | independently checked specified semantics |
| `CAP-158` | W8 Hashing | Clustering | core | `hashprobe` | conceptual-reference | **PARTIAL** | independently checked specified semantics |

**`CAP-026` - Sorting motivation (why sorting is studied)** (named-only, missing)  
- Destination: `sortprops`. Verified: NO - searched every displayed block; the word "motivation" occurs only inside the coverage index itself, i.e. inside the promise  
- Evidence: sortprops renders "Sorting comparison", "Analysis quantities" and "Lower bound" only. No destination states why sorting matters. This was bundled into one row with three capabilities that ARE delivered, which is how it stayed invisible.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. A short motivation section in a sorting-overview destination would close it.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-028` - Item and key types** (conceptual-reference, partial)  
- Destination: `stack / queue`. Verified: partial - searched every displayed block for a typedef  
- Evidence: typedef int Item appears in the stack, queue and bfs blocks but in NO sorting block. The sorting sources use Item in signatures (Item items[]) without displaying its typedef, so a sorting learner never sees the type they are told about.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. Showing the sorting Item/key typedef in a sorting destination would close it.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-037` - Selection and bubble sort on a linked list** (conceptual-reference, partial)  
- Destination: `listsorts`. Verified: partial - executed the module default in Node and inspected its frames  
- Evidence: The displayed lecture block states all three linked-list methods, but the generator traces only the INSERTION method, and its own note says so. Selection and bubble on a list are therefore stated, not demonstrated. The original row said "Sorting linked lists" without distinguishing the three.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. Either trace the other two methods or say in the lesson that only insertion is traced.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-051` - Radix key padding for unequal-width keys** (named-only, missing)  
- Destination: `radix`. Verified: NO - ran the module with mixed-width keys and it refuses them  
- Evidence: radix throws "all keys must contain the same number of symbols m; the manual does not pad them" for the input 7 42 318. The tracer is fixed-width only, the displayed pseudocode never mentions padding, and the word "padding" occurs in no destination - only inside the coverage index. The original row bundled padding with buckets and stability, which ARE delivered.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. Either implement padding in the tracer or add a conceptual explanation of why and how keys are padded.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-066` - Tree and BST terminology** (conceptual-reference, partial)  
- Destination: `bsttrav`. Verified: partial - executed the module default in Node and inspected its frames  
- Evidence: bsttrav displays "Traversal pseudocode - lecture" and renders tree and call-stack views, but no reference section defines the terminology (root, leaf, height, subtree) that the row promises. The terms are used by the views, not defined.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. A short terminology section on a tree destination would close it.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-076` - Size balance** (conceptual-reference, partial)  
- Destination: `bstrebalance`. Verified: partial - executed the module default in Node and inspected its frames  
- Evidence: The global-rebalance trace partitions around the median size at every subtree, which demonstrates size balance in action, but no reference section states the size-balance definition or contrasts it with height balance.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-083` - Periodic rebalancing** (conceptual-reference, partial)  
- Destination: `bstrebalance`. Verified: partial - ran mode="periodic reference" and got a ONE-frame trace  
- Evidence: The periodic mode produces a single frame whose note reads "Periodic rebalancing inserts at a leaf, then calls global rebalance whenever size(t) mod k == 0." There is no traced insertion, no k, and no triggered rebalance. Global (15 frames, executable) and periodic (1 frame, prose) were bundled in one core row, so the row read as if both were traced.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. Either trace a periodic sequence that crosses the trigger or state in the lesson that periodic is a concept note only.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-087` - AVL height guarantee** (conceptual-reference, partial)  
- Destination: `avlheight`. Verified: partial - executed the module default in Node and inspected its frames  
- Evidence: The module shows stored heights but no section states the O(log n) height guarantee or why it holds.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-093` - AVL search** (conceptual-reference, partial)  
- Destination: `avldel`. Verified: partial - searched every displayed block for an avlSearch token; none contains it  
- Evidence: There is no standalone AVL search destination. The nearest executable search is bstsearch, which is plain BST search; AVL adds nothing to the descent, so the semantics are equivalent but the AVL-specific lesson does not exist. The avlDelete pseudocode does perform a comparison descent, so the descent is observable inside the deletion trace. Separately, manual-boundary-data.js DOES carry an "avl-search" bridge with bool avlSearch(...) C, but the bridge matcher keys on block headings and bodies and NO displayed block mentions avlSearch, so that bridge is unreachable from the interface. The original row bundled search with deletion and pointed both at the deletion module.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. Either surface the existing avlSearch bridge from an AVL block or point the search capability at bstsearch with an explicit note that AVL search is the same descent. manual-boundary-data.js is owned by another agent, so no edit was made there.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-117` - Spanning tree / spanning forest structure** (conceptual-reference, partial)  
- Destination: `components`. Verified: partial - executed the module default in Node and inspected its frames and searched every block for a tree-edge marker  
- Evidence: The closing frame asserts "traversal edges form a spanning forest", and graphfund lists spanning forest among its structural terms, but no view marks WHICH edges form the forest and no block contains a tree-edge concept. The claim is stated, not shown. This was bundled with "disconnected graphs", which IS delivered.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. Highlighting the traversal edges in the components view would close it.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-146` - Union-find as the Kruskal cycle-check optimisation** (named-only, missing)  
- Destination: `namedalgos`. Verified: NO - ran namedalgos and read its whole block; union-find is absent from it  
- Evidence: The coverage row names three items - union-find, Boruvka and Karger-Klein-Tarjan - and the namedalgos source-boundary block lists only Boruvka and Karger-Klein-Tarjan. A token search across every displayed block found no union-find reference anywhere except inside the coverage index itself, i.e. inside the promise. So a named-only capability has a destination that omits it. This is also commission item D "repair the named-only destination that omits union-find".  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. corpus-named.js is not owned here, so the gap is recorded rather than patched. Closing it means adding union-find to the named list with an accurate account of its role in cycle detection and MST processing, linked to the Kruskal lesson.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-154` - Hash-table resizing** (named-only, missing)  
- Destination: `hash`. Verified: NO - drove 23 inserts past the threshold; the only thing that happens is a warning  
- Evidence: The displayed manual source literally contains printf("warning: resize not implemented!") and has no return in that branch, and the trace reproduces exactly that: one warning frame, then the insert proceeds into the unchanged 11-slot table. Resizing was bundled into one core row with chaining and the load factor, both of which ARE delivered, so the row read as if all three worked. The absence is faithful to the supplied source, but the coverage row promised the capability.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. Either implement a resize lesson as a clearly labelled addition or state in the coverage row that the supplied source stops at the warning. Not closed by deleting the promise.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-157` - Backshift deletion** (conceptual-reference, partial)  
- Destination: `hashprobe`. Verified: partial - read the whole module: there is no deletion-method selector  
- Evidence: Backshift is described in two lines of the "Deletion methods - lecture" prose block, but the module has only a method field offering linear probing and double hashing, and its own note says tombstones are used. So backshift is stated and tombstone is executed, while the original row bundled "backshift/tombstone deletion" as one core capability.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported. A backshift mode, or an explicit statement that only tombstone is traced, would close it.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

**`CAP-158` - Clustering** (conceptual-reference, partial)  
- Destination: `hashprobe`. Verified: partial - executed the module default in Node and inspected its frames  
- Evidence: One prose line in the deletion-methods block says double hashing "avoids primary clustering". Probe paths are rendered so clustering is observable, but nothing measures or labels a cluster.  
- Required action: OPEN GAP - referred to the Principal for a decision. Not closed by weakening the promise and not relabelled unsupported.  
- Review depth: independently checked specified semantics; NOT compared against the original course document - the 21 declared original course documents are absent from this repository, so exact quotation parity cannot be certified

### 5.3 Destinations corrected rather than left wrong

Two rows pointed at a destination that does not hold the material. Neither is a gap; both
were simply mis-linked, and the link is now right:

- **Comparison macros `lt`/`le`/`ge`/`gt`** pointed at `sortprops`, which does not display
  the macros at all. They are block 0 of `sel`, `bub`, `ins`, `ms`, `qs` and `q3`, and every
  comparison frame names the macro it is evaluating. Destination corrected to those six.
- **"How to design a recursive function"** pointed at `recpyramid / recfactorial`.
  `recfactorial` carries no design-guide block; `recpyramid` has one, titled
  "Recursive-function design guide - lecture", and renders a "Recursive design" section.
  Destination narrowed to `recpyramid`.

### 5.4 Destination existence check

Every destination id in the register resolves to a registered module: **195 id references**
across the 181 capability records, each `/`-separated id checked against the live 68-module
registry. No record points at a non-existent topic.

---

## 6. Review-depth ledger

The four levels, kept distinct as the commission requires:

| Level | Meaning | Used here |
|---|---|---|
| `read metadata` | the row or descriptor was read; nothing was run | 0 capability records |
| `executed one default` | the destination was run in Node and its frames inspected | 146 capability records |
| `independently checked specified semantics` | an independent oracle or a targeted non-default input was used to test the specific claim | 35 capability records |
| `compared against the original course document` | the displayed text was compared with the issued original | **0 records - not possible, the originals are absent** |

Per-topic review depth for the curriculum register is in the last column of section 2;
per-capability review depth is in section 5 and in the CSV.

## 7. Files changed for these four findings

| File | Change |
|---|---|
| `assets/course-enhancements.js` | RES-01 factorial objective; RES-02 per-algorithm sorting register and generated objectives; CUR-MOD-01 curriculum register replacing the group-week map, with derived week labels and extended test API |
| `assets/corpus-shared.js` (coverage area only) | CUR-MOD-04 `COVERAGE_CAPABILITIES` register with `COVERAGE_ROWS` derived from it |
| `docs/CURRICULUM_MATRIX.md` | this document, generated from those registers |
| `docs/COVERAGE_CAPABILITIES.csv` | per-capability register, generated from the same table |

No other file in the repository was modified for these findings.
