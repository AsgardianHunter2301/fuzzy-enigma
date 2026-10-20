/* corpus-theory.js — the per-topic theory register.
 *
 * SOURCE LABEL: TRACER-AUTHORED EXPLANATION. Every word in this file was
 * written for this tool. None of it is a quotation of the 26T2 manual, the
 * lecture slides or any other course document, and nothing here is attributed
 * to them. Where a statement describes what the COURSE does — an index base, a
 * partition rule, a chain order — it describes what THIS TRACER EXECUTES, and
 * the convention is named so the reader can check it against their own
 * material rather than trust this file.
 *
 * STRUCTURE. Each entry follows the order that proved to work in study use:
 * the invariant first, because knowing why an algorithm is correct is what
 * makes a half-remembered procedure recoverable; then the mechanism; then the
 * rules that cannot be broken; then the traps; then how to recognise the
 * algorithm from the state it keeps rather than from a picture of it.
 *
 *   coreInvariant       one sentence: what is true at every step, and why that
 *                       forces the result. States the WHY before any procedure.
 *   mechanism           how the procedure maintains that invariant.
 *   criticalInvariants  [{rule, because}] non-negotiables. Breaking one gives a
 *                       wrong answer, not a slower one.
 *   examTraps           [{trap, instead}] the mistakes that look right.
 *   recognition         {stateVariables, tell} identify the algorithm from the
 *                       variables a trace carries, NOT from a diagram.
 *   complexity          [{case, cost, why}] phrased as operation counts.
 *   convention          key into COMP2521_COURSE_CONVENTIONS, or null.
 *   whatToDraw          {unit, columns} the trace unit and the exact columns.
 *   seeAlso             module ids worth tracing next, and why.
 *
 * Markup: plain text only. `backticks` become code spans; the renderer escapes
 * everything else, so no entry can inject markup.
 */
(function () {
'use strict';

/* ------------------------------------------------------------------ *
 * Conventions.                                                        *
 *                                                                     *
 * A convention changes a stated index, height or intermediate array.  *
 * It never changes a DECISION — which rotation, which child, which    *
 * edge. That distinction is the whole value of the table: it tells    *
 * you when a disagreement with another textbook matters and when it   *
 * is cosmetic. `tracer` is what this tool executes.                   *
 * ------------------------------------------------------------------ */
const COMP2521_COURSE_CONVENTIONS = Object.freeze({
  heapIndexing: Object.freeze({
    name: 'Heap index base',
    tracer: 'TWO BASES COEXIST HERE, so the base must be read off the module rather than '
          + 'assumed. The priority-queue ADT is 1-based: root at `items[1]`, `parent(i) = i / 2`, '
          + 'children `2i` and `2i + 1`, and index 0 deliberately unused. Heapify AND heap sort '
          + 'are both 0-based, working on the array they are given: root at `items[0]`, children '
          + '`2i + 1` and `2i + 2`, `parent(i) = (i - 1) / 2`.',
    elsewhere: 'Many texts use one base throughout, most often 0-based everywhere.',
    matters: 'Changes every stated index and the printed array, so a trace asked for by index '
           + 'is wrong under the other base. It does not change which element is promoted.'
  }),
  dfsStack: Object.freeze({
    name: 'Iterative DFS discipline',
    tracer: 'An explicit stack. Neighbours are pushed in ASCENDING vertex order, so the '
          + 'HIGHEST-numbered unvisited neighbour finishes on top and is popped FIRST — the '
          + 'opposite of the order the recursive version takes. A vertex is marked visited when '
          + 'it is POPPED, not when pushed, and a popped vertex that is already visited is '
          + 'skipped. A vertex can therefore sit on the stack more than once at the same time, '
          + 'and `pred[v]` is overwritten by every later push that reaches `v` before it is '
          + 'popped.',
    elsewhere: 'Recursive DFS with discovery and finish times, marking on entry.',
    matters: 'Changes the stack column, the number of rows, and which `pred` write survives — '
           + '`pred[v]` is overwritten by every later push that reaches `v` before it is popped. '
           + 'The set of reachable vertices is the same either way.'
  }),
  partitionPivot: Object.freeze({
    name: 'Quicksort partition',
    tracer: 'Pivot is `A[lo]`. Two pointers move inward from `lo + 1` and `hi` until they cross, '
          + 'then the correction step `if (pivot < A[l]) l--` runs before the pivot is swapped '
          + 'into `A[l]`.',
    elsewhere: 'Lomuto partition with pivot `A[hi]` and a single scanning index.',
    matters: 'Changes the intermediate array after every partition and the final pivot position, '
           + 'so a partition asked for step by step differs. The sorted output is the same.'
  }),
  chainOrder: Object.freeze({
    name: 'Separate-chaining order',
    tracer: 'A new key is appended at the TAIL of its chain: `doInsert` recurses to the end '
          + 'and creates the node where the chain runs out, so a chain sits in ARRIVAL order, not '
          + 'key order. The supplemental resize is the one exception — it moves each node by '
          + 'pushing it at the head of its new chain, so a rehash REVERSES the order within a '
          + 'chain.',
    elsewhere: 'Head insertion, giving reverse arrival order; or chains kept sorted by key, so an '
             + 'insertion walks to its place rather than past the end.',
    matters: 'Changes the printed chain and the probe count for a successful search. It does not '
           + 'change which bucket a key lands in.'
  }),
  secondaryHash: Object.freeze({
    name: 'Double-hashing step',
    tracer: 'The second hash is `h2(x) = (x mod 3) + 1`, giving a step of 1, 2 or 3.',
    elsewhere: '`h2(k) = q - (k mod q)` for a prime `q < m`, chosen so the step is coprime with '
             + 'the table size.',
    matters: 'A step of 3 in a table whose size is a multiple of 3 cannot reach every slot, so '
           + 'the probe sequence cycles and an insertion can fail while the table still has free '
           + 'slots. That failure is a property of this formula, not a bug in the algorithm. It '
           + 'does not change the home slot a key starts from, nor which keys collide in the '
           + 'first place — only the path taken after the first collision.'
  }),
  treeHeight: Object.freeze({
    name: 'Height base case',
    tracer: 'Height is counted in EDGES: a leaf has height 0 and the empty tree has height -1. '
          + 'This is what `height(NULL) == -1` means and what the AVL balance factor is computed '
          + 'from.',
    elsewhere: 'Height counted in NODES, making a leaf 1 and the empty tree 0.',
    matters: 'Every stated height and balance factor shifts by one. It does not change which '
           + 'node is unbalanced or which rotation fixes it.'
  }),
  warshallDiagonal: Object.freeze({
    name: 'Transitive-closure diagonal',
    tracer: 'POSITIVE-LENGTH reachability: `tc` starts as a copy of the adjacency matrix, so '
          + '`tc[v][v]` is true only when `v` lies on a cycle. A self-loop would do it too, but '
          + 'this graph model REJECTS self-loops outright, so lying on a cycle is the only way to '
          + 'see a true diagonal entry here. Being merely reachable is not enough: on the arcs '
          + '`0>1, 1>2, 2>3, 2>0` the diagonal is true for 0, 1 and 2 and false for 3.',
    elsewhere: 'The reflexive closure, which forces the diagonal true for every vertex.',
    matters: 'On a graph with no arcs the two answers are the all-false matrix and the identity '
           + 'matrix. Both are valid mathematics; teaching one while executing the other is the '
           + 'error. It does not change a single off-diagonal entry: whether `v` reaches `w` for '
           + '`v` other than `w` is the same under both.'
  })
});

/* ------------------------------------------------------------------ *
 * Tracing technique — the cross-topic layer.                          *
 *                                                                     *
 * Per-topic theory tells you why ONE algorithm is correct. This is    *
 * the layer above it: how to trace anything by hand so the working    *
 * survives marking, and how to NAME an algorithm from an unlabelled   *
 * trace. It is rendered on the one entry that sets                     *
 * `tracingTechnique: true`.                                           *
 *                                                                     *
 * Two different kinds of statement live here and are labelled as      *
 * such. The checklist, the rules and the tie-break defaults are       *
 * ADVICE about what to write down — they are not behaviours of this   *
 * tracer and nothing enforces them. The self-checks and the           *
 * identification table are claims about the algorithms themselves.    *
 * Where this tracer's own behaviour bears on a row, it is named, and  *
 * it was read off the running code rather than assumed.               *
 * ------------------------------------------------------------------ */
const COMP2521_TRACING_TECHNIQUE = Object.freeze({
  preTrace: Object.freeze([
    'Write the convention header first: index base, height base, diagonal, tie-break. Before any arithmetic.',
    'Transcribe the structure you were given. For an undirected adjacency list, check the entry count is 2E — a miscopied graph cannot be rescued later.',
    'Write the invariant in one line. If you cannot, you do not yet know which algorithm this is.',
    'Name the state variables you will carry, and carry the same ones to the end.',
    'Name the trace unit: "one row = one ___". Settlement, edge examined, pass, probe, k.',
    'Draw the table header before the first value goes in it.',
    'Leave room for rejected candidates, not only accepted ones.',
    'Know which self-check you will run at the end.',
    'Keep the final answer separate from the working.'
  ]),
  rules: Object.freeze([
    { rule: 'One row per unit, including the rows where nothing happens.',
      why: 'A row reading "5 + 9 = 14, not less than 7, no change" is evidence you considered that '
         + 'edge. Skipping it looks identical to never having looked.' },
    { rule: 'Write the arithmetic, not just the result.',
      why: '"0 + 7 = 7 < infinity, accept" rather than "7". The comparison IS the algorithm; the '
         + 'number is a by-product, and a wrong number with visible working is a different mark '
         + 'from a wrong number alone.' },
    { rule: 'Copy the tie-breaking rule from the question verbatim into your header.',
      why: 'Ties are where two correct-looking answers diverge. If the question states one, it '
         + 'overrides every default below.' },
    { rule: 'Run the cheap self-check before writing "final".',
      why: 'Every algorithm here has one, and it costs seconds. It catches the error that would '
         + 'otherwise cost the whole question.' }
  ]),
  tieBreaks: Object.freeze({
    note: 'ADVICE, not tracer behaviour. If the question states a rule, use that. If it is silent, '
        + 'state one of these in your header and hold to it. A tie broken differently changes the '
        + 'predecessor tree and the visit order, but NEVER the Dijkstra distances or the MST total '
        + 'weight — so knowing which outputs are tie-sensitive tells you when a difference matters.',
    rows: Object.freeze([
      { situation: 'BFS or DFS neighbour order',
        choice: 'the order the adjacency list gives; if it is a set, numeric or alphabetical order',
        tracer: 'This tracer scans neighbours by ascending vertex number. For the ITERATIVE DFS '
              + 'that means the highest-numbered neighbour is popped first.' },
      { situation: 'Dijkstra or Prim: two vertices tie on dist or key',
        choice: 'lowest vertex label first', tracer: null },
      { situation: 'Kruskal: two edges tie on weight',
        choice: 'lexicographic by endpoints', tracer: null },
      { situation: 'Heap fix-down: both children equal and both smaller',
        choice: 'the left child', tracer: null },
      { situation: 'BST delete with two children',
        choice: 'the in-order successor — and say so, because the predecessor is equally valid',
        tracer: 'The two deletions here DIFFER, and that is worth knowing. bstdel calls '
              + 'bstJoin(tree->left, tree->right), which is neither; avldel takes the minimum of '
              + 'the right subtree, which is the in-order successor.' }
    ])
  }),
  selfChecks: Object.freeze([
    { after: 'any BST or AVL operation', check: 'an in-order traversal comes out sorted' },
    { after: 'AVL insertion or deletion', check: 'every balance factor is -1, 0 or +1' },
    { after: 'Dijkstra', check: 'the settled distances come out non-decreasing in settlement order' },
    { after: 'Prim or Kruskal on a connected graph', check: 'exactly V - 1 edges were chosen' },
    { after: 'Warshall', check: 'the matrix only ever gains entries, never loses one' },
    { after: 'any heap operation', check: 'every parent still dominates both children' },
    { after: 'insertion sort, at any point', check: 'the prefix left of the cursor is sorted' },
    { after: 'a partition', check: 'everything left of the pivot is no greater, everything right no smaller' }
  ]),
  identification: Object.freeze({
    note: 'Name the algorithm from the STATE it carries, never from the picture. Two algorithms can '
        + 'draw the same diagram and differ entirely in what they keep.',
    rows: Object.freeze([
      { clue: 'A FIFO queue; distances arriving in levels', is: 'BFS' },
      { clue: 'A stack holding duplicates, with the visited test after the pop', is: 'iterative DFS' },
      { clue: 'Recursion that deepens and unwinds, marking on entry', is: 'recursive DFS' },
      { clue: '`dist[u] + w` compared against `dist[v]`, and a settled set', is: 'Dijkstra' },
      { clue: 'A bare edge weight `w` with no accumulated distance, one growing tree', is: 'Prim' },
      { clue: 'A globally sorted edge list and no start vertex', is: 'Kruskal' },
      { clue: 'A boolean matrix combined with OR and AND, `k` in the outermost loop', is: 'Warshall' },
      { clue: 'A NUMERIC matrix combined with min and plus',
        is: 'Floyd-Warshall — which is NOT in this course. The row is here so you do not misname '
          + 'Warshall when you see a matrix.' },
      { clue: 'A BST carrying balance factors, with rotations', is: 'AVL' },
      { clue: 'A subtree-size or rank argument driving the choice of root', is: 'partition rebalancing' },
      { clue: 'An array with parent and child index arithmetic', is: 'a heap' },
      { clue: 'A max-heap shrinking while a sorted suffix grows on the right', is: 'heap sort' },
      { clue: 'A character-by-character path from a root that holds no key', is: 'a trie' },
      { clue: 'A step of exactly one slot, wrapping, with tombstones', is: 'linear probing' },
      { clue: 'A second hash supplying the step size', is: 'double hashing' },
      { clue: 'Split to singletons, then merge upward', is: 'merge sort' },
      { clue: 'A pivot that lands in its final position and is never moved again', is: 'quicksort' },
      { clue: 'A sorted prefix with values shifting right to open a gap', is: 'insertion sort' },
      { clue: 'A full scan of the suffix, then at most one swap', is: 'selection sort' },
      { clue: 'Adjacent swaps only, with the largest element drifting right', is: 'bubble sort' },
      { clue: 'Repeated stable passes, one per digit position', is: 'radix sort' }
    ])
  })
});

/* ------------------------------------------------------------------ *
 * Theory entries, keyed by module id.                                 *
 *                                                                     *
 * The register is OPEN and filled by the corpus-theory-*.js files,     *
 * one per subject area, through COMP2521RegisterTheory. It is split    *
 * that way so the areas can be written independently without four      *
 * authors editing one file, and so a malformed area fails loudly at    *
 * load instead of corrupting the whole register. It is deliberately    *
 * NOT frozen here: freezing it before the area files load would make   *
 * every later registration throw.                                      *
 * ------------------------------------------------------------------ */
const COMP2521_THEORY = {};

function registerTheory(area, entries) {
  if (!entries || typeof entries !== 'object') {
    throw new TypeError('theory area "' + area + '" registered nothing');
  }
  Object.keys(entries).forEach(function (id) {
    if (Object.prototype.hasOwnProperty.call(COMP2521_THEORY, id)) {
      /* Two areas claiming one topic means one of them is wrong about its
         scope, and the loser would silently vanish. */
      throw new Error('theory for "' + id + '" is registered twice (area: ' + area + ')');
    }
    COMP2521_THEORY[id] = entries[id];
  });
  return Object.keys(entries).length;
}

const AREA_EXEMPLARS = {};
AREA_EXEMPLARS.qs = {
  coreInvariant:
    'After a partition returns the index `p`, every element left of `p` is no greater than '
    + '`A[p]` and every element right of it is no smaller. `A[p]` is therefore already in its '
    + 'final sorted position and is never moved or compared again. Correctness follows without '
    + 'any claim about balance: each recursive call sorts a strictly shorter run, and the '
    + 'elements between two settled pivots can only be permuted among themselves.',
  mechanism:
    'Partition does the work; the recursion only repeats it. The pivot is lifted out of play at '
    + '`A[lo]`, then two pointers walk inward and swap any out-of-order pair they meet. When they '
    + 'cross, the left pointer is standing at the last position that belongs on the small side, '
    + 'so swapping the pivot there places it exactly. Quicksort is therefore in-place and does no '
    + 'merging: unlike merge sort it spends its effort BEFORE the recursive calls, not after.',
  criticalInvariants: [
    { rule: 'The correction step `if (pivot < A[l]) l--` runs after the pointers cross and before '
          + 'the pivot is swapped in.',
      because: 'When the pointers cross on an element larger than the pivot, `l` has gone one '
             + 'past the small side. Swapping without the correction puts a larger element to the '
             + 'left of the pivot, which breaks the invariant that makes the pivot final — and '
             + 'the array can still come out sorted on small inputs, so the bug survives casual '
             + 'checking.' },
    { rule: 'The pivot is excluded from the scan, not compared against itself.',
      because: 'A pointer that steps onto the pivot can swap it away from `lo`, after which the '
             + 'final placement swap moves the wrong element.' },
    { rule: 'Recursion never includes the settled pivot: the calls are on `lo..p-1` and `p+1..hi`.',
      because: 'Including `p` gives a subproblem no smaller than its parent, so the recursion '
             + 'need not terminate.' }
  ],
  examTraps: [
    { trap: 'Reading the first element of the array as the pivot for every partition.',
      instead: 'The pivot is the first element OF THE CURRENT RUN, `A[lo]`, which is a different '
             + 'element at every level.' },
    { trap: 'Expecting sorted input to be the easy case.',
      instead: 'Sorted input is the WORST case for a first-element pivot: every partition peels '
             + 'off one element and the recursion is as deep as the array is long.' },
    { trap: 'Counting the pivot swap as a comparison.',
      instead: 'Comparisons are the pointer tests; the placement swap is a move. The two are '
             + 'counted separately.' }
  ],
  recognition: {
    stateVariables: ['lo', 'hi', 'l', 'r', 'pivot'],
    tell: 'Two indices moving toward each other inside one run, with a single value held aside, '
        + 'is partitioning. If instead you see two runs being consumed into a third array, that '
        + 'is merge sort; if you see one index scanning for a minimum, that is selection sort.'
  },
  complexity: [
    { case: 'Best and average', cost: 'makes about `n log n` comparisons',
      why: 'A pivot near the median halves the run, so there are about `log n` levels and each '
         + 'level compares every element roughly once.' },
    { case: 'Worst', cost: 'makes about `n^2 / 2` comparisons',
      why: 'An extreme pivot every time — which sorted or reverse-sorted input produces here — '
         + 'leaves a run only one shorter, giving `n` levels.' },
    { case: 'Space', cost: 'in place, with recursion depth up to `n` in the worst case',
      why: 'No auxiliary array is allocated; only the call stack grows.' }
  ],
  convention: 'partitionPivot',
  whatToDraw: {
    unit: 'one row = one pointer move or swap',
    columns: ['lo', 'hi', 'pivot', 'l', 'r', 'array after the step']
  },
  seeAlso: [
    { id: 'q3', why: 'median-of-three removes the sorted-input penalty and shows what the pivot '
                   + 'choice is actually buying' },
    { id: 'ms', why: 'the same divide-and-conquer shape with the work after the recursion instead '
                   + 'of before it' }
  ]
};

AREA_EXEMPLARS.bfs = {
  coreInvariant:
    'The queue holds a frontier that is ordered by distance: when a vertex is dequeued, every '
    + 'vertex closer to the source has already been dequeued, and every vertex still queued is at '
    + 'the same distance or one further. Because a vertex is recorded the first time it is '
    + 'reached, the edge that records it comes from a vertex one step closer to the source — '
    + 'which is exactly what makes the recorded path a SHORTEST path in an unweighted graph.',
  mechanism:
    'A queue, so the oldest frontier is expanded first, and a predecessor array that doubles as '
    + 'the visited marker. `predecessor[src] = src` marks the root, `-1` means not yet reached, '
    + 'and any other value is the vertex this one was first reached from. One array therefore '
    + 'answers both "have I seen this?" and "how did I get here?", and `-1` keeps exactly one '
    + 'meaning.',
  criticalInvariants: [
    { rule: 'A vertex is recorded when it is ENQUEUED, not when it is dequeued.',
      because: 'Marking on dequeue lets the same vertex be queued several times from different '
             + 'neighbours, and a later enqueue can overwrite the predecessor with a longer '
             + 'route, so the reconstructed path is no longer shortest.' },
    { rule: 'The root is its own predecessor.',
      because: 'If `predecessor[src]` stayed `-1`, that value would mean both "this is the root" '
             + 'and "never reached", and a path consumer could not tell them apart.' },
    { rule: 'The path is read backwards from the destination and then reversed.',
      because: 'The array stores each vertex\'s parent, not its child, so it can only be walked '
             + 'towards the root.' }
  ],
  examTraps: [
    { trap: 'Assuming BFS gives the shortest path in a weighted graph.',
      instead: 'It minimises the NUMBER OF EDGES. With weights, use Dijkstra — BFS is the special '
             + 'case where every weight is equal.' },
    { trap: 'Expecting a unique answer when several shortest paths exist.',
      instead: 'The path found depends on neighbour order. Any shortest path is correct; its '
             + 'LENGTH is what is determined.' },
    { trap: 'Reading an unreached vertex as distance 0 because its predecessor slot is empty.',
      instead: '`-1` means unreachable from this source. Distance 0 belongs to the source alone.' }
  ],
  recognition: {
    stateVariables: ['queue', 'predecessor (or visited)', 'the vertex being expanded'],
    tell: 'A FIFO queue with vertices leaving in the order they arrived is breadth-first. A stack, '
        + 'or recursion, is depth-first. A priority queue keyed on accumulated distance is '
        + 'Dijkstra.'
  },
  complexity: [
    { case: 'Adjacency list', cost: 'visits each vertex once and each edge twice, so `O(V + E)`',
      why: 'Every vertex is enqueued at most once and its neighbour list is walked once.' },
    { case: 'Adjacency matrix', cost: '`O(V^2)`',
      why: 'Finding the neighbours of a vertex means scanning a whole row of `V` entries, whether '
         + 'or not edges exist.' },
    { case: 'Space', cost: 'one queue and one array, both `O(V)`',
      why: 'Nothing is stored per edge — an edge is examined and then forgotten — so memory tracks the number of vertices, not the density of the graph.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one dequeue',
    columns: ['dequeued vertex', 'neighbours examined', 'newly recorded', 'queue after the step',
              'predecessor array']
  },
  seeAlso: [
    { id: 'dfsiter', why: 'the same traversal with a stack instead of a queue, which is the whole '
                        + 'difference' },
    { id: 'bfspath', why: 'reconstructing the shortest path from the predecessor array' },
    { id: 'dijkstra', why: 'what replaces the queue once edges carry weights' }
  ]
};

AREA_EXEMPLARS.hashprobe = {
  coreInvariant:
    'Open addressing stores every item in the table itself, so a lookup must be able to retrace '
    + 'the exact sequence of slots an insertion walked. The probe sequence is a function of the '
    + 'key alone, which is what makes that possible — and it is why a search may only stop at a '
    + 'slot that has NEVER held an item. Stopping at a slot that was emptied by a deletion can '
    + 'end the search before the key it is looking for.',
  mechanism:
    'On collision the probe moves on by a rule fixed by the key: linear probing steps one slot at '
    + 'a time, double hashing steps by `h2(key)`. Deletion is the hard half. A tombstone leaves a '
    + 'marker that lookups treat as occupied and insertions treat as free, which preserves every '
    + 'probe path at the cost of permanent probe length. Backshift instead repairs the cluster by '
    + 'moving later keys back into the hole, leaving the slot genuinely empty.',
  criticalInvariants: [
    { rule: 'A lookup stops only at a never-used slot, never at a tombstone.',
      because: 'The tombstone may sit in the middle of the probe path of a key stored further '
             + 'along; stopping there reports a present key as absent.' },
    { rule: 'With double hashing the step must be coprime with the table size.',
      because: 'Otherwise the probe sequence visits only a fraction of the slots and cycles '
             + 'forever, so an insertion can fail while the table is far from full. With '
             + '`h2(x) = (x mod 3) + 1` a step of 3 in a table whose size is a multiple of 3 does '
             + 'exactly that.' },
    { rule: 'Backshift may only move a key back if the hole lies on that key\'s own probe path.',
      because: 'Moving a key to a slot its probe sequence never visits makes it unreachable. The '
             + 'test uses that key\'s home slot and stride, not the deleted key\'s.' }
  ],
  examTraps: [
    { trap: 'Treating a tombstone as empty when searching, or as occupied when inserting.',
      instead: 'It is the opposite of both: occupied to a search, free to an insertion. That '
             + 'asymmetry is the entire point of the marker.' },
    { trap: 'Reporting the load factor as items over slots after deletions without saying whether '
          + 'tombstones count.',
      instead: 'State which you are counting. Probe cost tracks slots that are not free, so '
             + 'tombstones belong in the figure that predicts performance.' },
    { trap: 'Assuming double hashing removes clustering.',
      instead: 'It removes PRIMARY clustering — keys with the same home slot no longer share a '
             + 'run. Keys can still collide on a later probe, and a poor `h2` reintroduces '
             + 'structure.' }
  ],
  recognition: {
    stateVariables: ['home slot', 'stride or step', 'probe count', 'slot states (live / deleted / empty)'],
    tell: 'Items living in the table with a per-key step is open addressing. Items living in '
        + 'linked lists hanging off each slot is separate chaining, where deletion needs no '
        + 'marker at all.'
  },
  complexity: [
    { case: 'Successful search, load factor a', cost: 'makes about `1 / (1 - a)` probes under '
          + 'uniform hashing',
      why: 'The expected run of non-free slots grows as the table fills; at `a = 0.9` that is '
         + 'about ten probes.' },
    { case: 'Worst', cost: 'makes up to `m` probes', why: 'One cluster filling the whole table.' },
    { case: 'Tombstones', cost: 'raise the effective load factor permanently',
      why: 'They are never reclaimed by searching, so only a rebuild restores the probe length.' }
  ],
  convention: 'secondaryHash',
  whatToDraw: {
    unit: 'one row = one probe',
    columns: ['key', 'home slot', 'step', 'slot tried', 'state found', 'outcome']
  },
  seeAlso: [
    { id: 'hash', why: 'separate chaining, where deletion is simply unlinking and no marker is '
                     + 'needed' },
    { id: 'trie', why: 'a keyed structure with no hashing and no collisions at all' }
  ]
};

registerTheory('exemplars', AREA_EXEMPLARS);

/* ------------------------------------------------------------------ */
window.COMP2521_COURSE_CONVENTIONS = COMP2521_COURSE_CONVENTIONS;
window.COMP2521_TRACING_TECHNIQUE = COMP2521_TRACING_TECHNIQUE;
window.COMP2521_THEORY = COMP2521_THEORY;
window.COMP2521RegisterTheory = registerTheory;
window.COMP2521_THEORY_PROVENANCE = Object.freeze({
  label: 'Tracer-authored explanation',
  statement: 'Written for this tool. Not a quotation of the 26T2 manual, the lecture slides or '
           + 'any other course document, and not attributed to them. Statements about what the '
           + 'course does describe what this tracer executes; each is named as a convention so it '
           + 'can be checked against your own material.'
});
})();
