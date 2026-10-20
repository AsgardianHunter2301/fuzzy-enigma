/* corpus-theory-graphs.js — theory entries for the graphs area.
 *
 * SOURCE LABEL: TRACER-AUTHORED EXPLANATION. See the header of
 * corpus-theory.js for the schema, the provenance rule and the conventions
 * table. Entries are plain text; `backticks` become code spans and the panel
 * escapes everything else.
 *
 * `bfs` is registered by corpus-theory.js as a worked exemplar, so it is
 * deliberately absent here: registering it twice would throw at load.
 */
(function () {
'use strict';
const T = {};

/* ------------------------------------------------------------------ *
 * Graph representations.                                              *
 * ------------------------------------------------------------------ */

T.graphfund = {
  coreInvariant:
    'A graph is nothing but the pair of a vertex set and an edge set, and every term built on it '
    + '— degree, path, component, tree, clique — is a statement about which pairs are joined. '
    + 'Position on the page carries no information, which is why two drawings with the same '
    + 'incidences are the SAME graph and must classify identically. Every classification question '
    + 'therefore has to be answered from the incidences, never from how the picture looks.',
  mechanism:
    'The trace computes one degree per vertex (in-degree and out-degree separately when the graph '
    + 'is directed), counts the edges, counts the connected components by walking reachability, '
    + 'and then tests the definitions against those numbers. The maximum number of non-loop edges '
    + 'is `V(V - 1)/2` undirected and `V(V - 1)` directed, and the density figure is the edge '
    + 'count over that maximum, so dense and sparse become a ratio rather than an impression.',
  criticalInvariants: [
    { rule: 'The degrees of an undirected graph sum to `2E`, never to `E`.',
      because: 'Each edge is incident to two endpoints and contributes one to each of their '
             + 'degrees. The identity is worth holding because it immediately forces the number '
             + 'of odd-degree vertices to be even, which is the whole basis of the Eulerian test, '
             + 'and it catches a mis-read adjacency row the moment the degrees fail to add up.' },
    { rule: 'A tree is three conditions at once: connected, acyclic, and exactly `V - 1` edges.',
      because: 'Any two of the three imply the third, so a single condition is never enough. '
             + 'Checking only the edge count accepts a graph of two pieces where one piece '
             + 'carries a cycle, and checking only acyclicity accepts a forest.' },
    { rule: 'An isolated vertex is a connected component of its own.',
      because: 'It is reachable from itself, so the equivalence class it belongs to is the set '
             + 'containing just it. Dropping isolated vertices from the count makes every later '
             + 'formula stated in terms of `C` — the `V - C` size of a spanning forest above all '
             + '— come out wrong.' },
    { rule: 'Simplicity is a property of the model here, not a theorem.',
      because: 'The input grammar this tracer accepts rejects self-loops and repeated edges '
             + 'outright, so every graph you can trace in it is simple. That is a stated '
             + 'restriction of the tool, and it is why a test that would be unsafe on a '
             + 'multigraph can still look correct in every trace you run.' }
  ],
  examTraps: [
    { trap: 'Reading `V - 1` edges as proof that a graph is a tree.',
      instead: 'It must also be connected. Spread `V - 1` edges over two components and one of '
             + 'them necessarily contains a cycle, so the edge count alone decides nothing.' },
    { trap: 'Calling a graph dense or sparse from the look of the drawing.',
      instead: 'Compute the edge count against the maximum possible for that many vertices. A '
             + 'graph can look crowded simply because the vertices were drawn close together.' },
    { trap: 'Collapsing in-degree and out-degree into one number for a digraph.',
      instead: 'They are two separate counts and routinely differ. Only their TOTALS agree: '
             + 'summed over all vertices, in-degrees and out-degrees both equal the arc count.' },
    { trap: 'Treating connectivity of a digraph as the same question as connectivity of a graph.',
      instead: 'Strong connectivity asks whether every vertex reaches every other FOLLOWING the '
             + 'arrows, which is far stronger than the undirected notion of being in one piece.' }
  ],
  recognition: {
    stateVariables: ['V', 'E', 'degree per vertex', 'component count', 'density'],
    tell: 'No queue, stack or predecessor array evolves across the trace: there are only derived '
        + 'counts and a verdict per property. That is classification, not traversal. The moment '
        + 'you see a structure being pushed and popped, you are looking at an algorithm instead.'
  },
  complexity: [
    { case: 'Degree of one vertex, adjacency matrix',
      cost: 'scans a whole row of `V` entries',
      why: 'The row has one cell per possible neighbour whether or not an edge is there, so the '
         + 'cost is set by the vertex count and not by how many neighbours the vertex has.' },
    { case: 'All degrees, adjacency list',
      cost: 'touches each stored neighbour once, `2E` nodes for an undirected graph',
      why: 'Each edge appears once in each of its endpoints lists, so one pass over every list '
         + 'counts every degree.' },
    { case: 'Component count',
      cost: 'visits each vertex once and each edge twice with adjacency lists, so `O(V + E)`',
      why: 'The reachability walk enters a vertex only on its first encounter and then looks at '
         + 'each of its incident edges once.' },
    { case: 'Complete-graph and density tests', cost: 'constant, once the edge count is known',
      why: 'Both compare `E` against `V(V - 1)/2`, which is arithmetic on two numbers the trace '
         + 'already has.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one vertex',
    columns: ['vertex', 'degree (or in / out)', 'component', 'isolated?']
  },
  seeAlso: [
    { id: 'graphreps', why: 'where the vertex set and edge set actually live once they are stored, '
                          + 'and what each choice makes cheap' },
    { id: 'components', why: 'the component count turned into an algorithm, with the `V - C` '
                           + 'spanning-forest identity checked against the trace' },
    { id: 'euler', why: 'the one place the sum-of-degrees identity decides a whole question' }
  ]
};

T.graphreps = {
  coreInvariant:
    'All three representations answer the same questions about the same graph; they differ only '
    + 'in WHICH question is cheap. The matrix stores one cell per ordered pair, so adjacency is a '
    + 'single array lookup but the space is `V` squared however few edges there are. The '
    + 'adjacency list and the array of edges store one record per stored edge, so space tracks '
    + '`E`, but a yes-or-no adjacency question has to be searched for. Choosing a representation '
    + 'is therefore choosing which cost you are willing to pay many times over.',
  mechanism:
    'The matrix is `V` rows of `V` booleans, symmetric when the graph is undirected. The '
    + 'adjacency list is `V` chain heads, each chain holding one node per neighbour, kept in '
    + 'ascending vertex order in this tracer so a search can stop as soon as it passes the vertex '
    + 'it wants. The array of edges is one contiguous run of records with a live prefix bounded '
    + 'by `nE`. One logical undirected edge is two true cells, or two list nodes, or one record — '
    + 'and `nE` counts it ONCE in all three.',
  criticalInvariants: [
    { rule: 'An undirected edge is stored twice in a matrix and in two chains, but counted once '
          + 'in `nE`.',
      because: '`nE` is the logical edge count. Counting storage instead doubles `E`, after which '
             + 'the `V - 1` spanning-tree test, every density figure and every cost quoted in '
             + 'terms of `E` is wrong while the stored graph itself is perfectly correct, so the '
             + 'mistake leaves no visible trace.' },
    { rule: 'Neighbour enumeration follows the representation: scan row `v`, or follow the chain, '
          + 'or scan the records containing `v`.',
      because: 'Every traversal cost is really a cost per neighbour enumeration repeated once per '
             + 'vertex. The same breadth-first code is `O(V + E)` over lists and `O(V^2)` over a '
             + 'matrix purely because this one step differs.' },
    { rule: 'Space is a property of the representation, not of the graph.',
      because: 'A matrix for a graph with no edges still allocates `V` squared cells, all false. '
             + 'On a sparse graph almost every cell is wasted, and that waste is the price of the '
             + 'constant-time adjacency test.' }
  ],
  examTraps: [
    { trap: 'Quoting graph algorithms as `O(V + E)` without saying which representation.',
      instead: 'That figure assumes adjacency lists. Over a matrix the neighbour scan is `V` per '
             + 'vertex whatever the degree, so the identical algorithm becomes `O(V^2)`.' },
    { trap: 'Expecting an adjacency list to make edge insertion cheap because lists are flexible.',
      instead: 'Duplicate detection has to walk the chain first, up to `V - 1` nodes. The matrix '
             + 'is the representation that inserts and removes in constant time.' },
    { trap: 'Reading the edge array as cheap everywhere because creating it is constant time.',
      instead: 'Creation is cheap precisely because nothing is initialised. Every adjacency '
             + 'question afterwards is a linear scan of the live records.' },
    { trap: 'Assuming one representation is the right answer.',
      instead: 'State what the algorithm does most often. Repeated adjacency tests favour the '
             + 'matrix, repeated neighbour enumeration on a sparse graph favours lists, and '
             + 'sorting or scanning every edge once favours the edge array.' }
  ],
  recognition: {
    stateVariables: ['nV', 'nE', 'maxE (edge array only)', 'chain heads and next links', 'matrix cells'],
    tell: 'A `V` by `V` grid of booleans is the matrix; `V` chains of neighbour nodes is the '
        + 'adjacency list; one flat run of pair records WITH a separate capacity field is the '
        + 'array of edges. The capacity field is the giveaway, because only the edge array grows '
        + 'a shared buffer.'
  },
  complexity: [
    { case: 'Space', cost: 'matrix `O(V^2)`, list `O(V + E)`, edge array `O(E)`',
      why: 'The matrix allocates a cell per ordered pair; the list allocates a head per vertex '
         + 'plus a node per stored direction; the edge array allocates one record per edge.' },
    { case: 'Is adjacent', cost: 'matrix `O(1)`, list `O(V)`, edge array `O(E)`',
      why: 'One cell read, against walking a chain that can hold every other vertex, against '
         + 'scanning the live record prefix.' },
    { case: 'Insert or remove an edge', cost: 'matrix `O(1)`, list `O(V)`, edge array `O(E)`',
      why: 'All three must first establish that the edge is absent or present, and only the '
         + 'matrix can do that in one lookup.' },
    { case: 'Degree of one vertex', cost: 'matrix `O(V)`, list `O(V)`, edge array `O(E)`',
      why: 'A full row scan, a full chain walk, or a pass over every record looking for the '
         + 'vertex as an endpoint.' },
    { case: 'Create and destroy',
      cost: 'create `O(V^2)` / `O(V)` / `O(1)`; destroy `O(V)` / `O(V + E)` / `O(1)`',
      why: 'The matrix must zero every cell and later free every row; the list has nothing to '
         + 'build but every node to free; the edge array is one block either way.' },
    { case: 'Ordered edge array', cost: 'adjacency and degree in about `log E` comparisons',
      why: 'Sorting the records lets a binary search replace the scan, paid for by keeping the '
         + 'order on every insertion.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one operation',
    columns: ['operation', 'adjacency matrix', 'adjacency list', 'array of edges', 'what is touched']
  },
  seeAlso: [
    { id: 'graphadt', why: 'the matrix version built and torn down operation by operation, with '
                         + 'the jagged allocation made explicit' },
    { id: 'graphlist', why: 'the chain version, where the cost of a single insertion is a pointer '
                          + 'walk rather than one write' },
    { id: 'graphedges', why: 'the record version, and the live-prefix invariant that every scan '
                           + 'depends on' },
    { id: 'bfs', why: 'the same traversal whose stated cost changes entirely with the choice made '
                    + 'here' }
  ]
};

T.graphadt = {
  coreInvariant:
    'The adjacency matrix is a JAGGED allocation: one struct, one array of `V` row pointers, and '
    + '`V` separate row buffers, so `V + 2` blocks are live at once and the only pointers to the '
    + 'rows live inside the array. That forces the release order to be the exact reverse of the '
    + 'allocation order, because freeing the pointer array first makes every row unreachable. The '
    + 'second invariant is symmetry: `edges[v][w]` and `edges[w][v]` are written and cleared '
    + 'together, which is what lets an undirected adjacency test be one lookup from either side.',
  mechanism:
    '`GraphNew` allocates the struct, sets `nV`, sets `nE` to zero, allocates `V` row pointers, '
    + 'then zero-fills each row so every cell starts false. Insertion tests the cell first: a '
    + 'duplicate returns without touching anything, otherwise both cells are set and `nE` is '
    + 'incremented once. Removal is the mirror — test, clear both, decrement. `GraphFree` frees '
    + 'each row, then the row-pointer array, then the struct. After the free the graph is dead '
    + 'and this tracer stops rather than reading through the released pointer.',
  criticalInvariants: [
    { rule: 'Rows must be zero-filled at creation, not merely allocated.',
      because: 'Raw allocated memory holds whatever was there before, so unwritten cells would '
             + 'report arbitrary edges and a traversal would follow edges that do not exist. '
             + 'Nothing later in the lifecycle can repair that, because there is no way to tell a '
             + 'stale true from a written one.' },
    { rule: 'The duplicate test runs BEFORE the increment.',
      because: 'Without it a repeated insertion counts one edge twice, so `nE` and the matrix '
             + 'disagree. The matrix still answers adjacency correctly, so the defect shows up '
             + 'only in `nE`-derived figures — the `V - 1` test, the density, the reported edge '
             + 'count — which is exactly where it is hardest to attribute.' },
    { rule: 'The free order is rows, then the pointer array, then the struct.',
      because: 'Each level holds the only pointers to the level below it. Release `g->edges` and '
             + 'the `V` row addresses are gone; release `g` and the pointer array address is '
             + 'gone. Freeing outside-in leaks everything inside.' },
    { rule: 'One insertion writes two cells but increments the count once.',
      because: 'The two cells are two halves of one undirected edge. Incrementing per write makes '
             + '`nE` equal `2E`, and incrementing before both writes leaves the count describing '
             + 'a graph that does not exist yet.' }
  ],
  examTraps: [
    { trap: 'Expecting `nE` to equal the number of true cells.',
      instead: 'An undirected graph has `2E` true cells. `nE` is the logical edge count, and the '
             + 'factor of two between them is the whole point of keeping the counter.' },
    { trap: 'Freeing the struct first because it is the outermost object.',
      instead: 'Free from the inside out. The struct holds the only pointer to the row array, '
             + 'which holds the only pointers to the rows.' },
    { trap: 'Treating `GraphShow` output as the matrix.',
      instead: 'It prints each vertex neighbour list, which is the true cells of one row read off '
             + 'in order. An empty line means a vertex of degree zero, not a missing vertex.' },
    { trap: 'Assuming a removal that finds nothing is harmless to the count.',
      instead: 'It is, provided the guard is there. Remove without first testing the cell and '
             + '`nE` is decremented for an edge that was never present.' }
  ],
  recognition: {
    stateVariables: ['nV', 'nE', 'the row being allocated or freed', 'the cell being written'],
    tell: 'Paired writes to `[v][w]` and `[w][v]` with a single count change is the undirected '
        + 'matrix. One write and one increment is the directed variant. A chain of nodes being '
        + 'allocated instead of cells being set is the adjacency list.'
  },
  complexity: [
    { case: 'Create', cost: 'makes `V + 2` allocations and zeroes `V^2` cells, so `O(V^2)`',
      why: 'Every cell must start false, and there is one cell per ordered pair of vertices.' },
    { case: 'Adjacency test, insert, remove', cost: 'one or two cell accesses, `O(1)`',
      why: 'The cell address is computed from the two vertex numbers, so density is irrelevant.' },
    { case: 'Neighbour enumeration or degree', cost: 'scans a row of `V` entries',
      why: 'There is no record of which cells are true, so the whole row is examined even for a '
         + 'vertex with one neighbour. This is the step that turns a list-based `O(V + E)` '
         + 'traversal into `O(V^2)`.' },
    { case: 'Destroy', cost: 'frees `V + 2` blocks, `O(V)`',
      why: 'One free per row plus the pointer array plus the struct.' },
    { case: 'Space', cost: '`O(V^2)` whatever `E` is',
      why: 'The allocation is sized from the vertex count alone, so a graph with one edge costs '
         + 'the same as a complete graph.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one ADT call or one allocation step',
    columns: ['call', 'cells touched', 'nE', 'blocks live']
  },
  seeAlso: [
    { id: 'graphreps', why: 'the cost table this lifecycle is one column of, set beside the other '
                          + 'two representations' },
    { id: 'graphlist', why: 'the same interface where an insertion allocates nodes instead of '
                          + 'setting cells, and the release is harder' },
    { id: 'adtarch', why: 'why the interface and the representation are separable at all, which is '
                        + 'what lets a traversal be written once' },
    { id: 'bfs', why: 'the first algorithm that calls this interface, and where the row scan shows '
                    + 'up in the cost' }
  ]
};

T.graphlist = {
  coreInvariant:
    'Each vertex owns one chain, and an undirected edge is TWO nodes in two different chains that '
    + 'must be created together and destroyed together — otherwise the two endpoints disagree '
    + 'about whether the edge exists. The logical count `nE` therefore moves once per edge, not '
    + 'once per node. The invariant that makes a chain search stoppable early is that this tracer '
    + 'keeps every chain in ASCENDING neighbour order, so a walk may give up as soon as it passes '
    + 'the vertex it is looking for.',
  mechanism:
    'The heads are allocated all null. An insertion walks the source chain looking for a match: '
    + 'found and weighted means overwrite the weight and leave `nE` alone, found and unweighted '
    + 'means return without allocating, absent means allocate the forward node, allocate the '
    + 'reverse node when the graph is undirected, link both, then increment once. A removal '
    + 'locates the node, rewrites the predecessor next link past it, frees it, repeats on the '
    + 'reverse chain, and only then decrements. Releasing the graph frees every node in every '
    + 'chain, then the head array, then the struct.',
  criticalInvariants: [
    { rule: 'The predecessor next link is rewritten BEFORE the node is released.',
      because: 'Reading a node next field after releasing it is a use-after-free, and the rest of '
             + 'the chain behind it becomes unreachable. One mis-ordered release can therefore '
             + 'lose arbitrarily many nodes, and the chain that remains ends in a dangling '
             + 'pointer rather than null.' },
    { rule: 'Both directions of an undirected edge are created and destroyed in one operation.',
      because: 'If only one survives, a traversal starting at one endpoint sees an edge that the '
             + 'other endpoint denies, so reachability becomes direction-dependent in a graph '
             + 'that is supposed to be symmetric.' },
    { rule: '`nE` changes once per logical edge, after every required node is linked.',
      because: 'Incrementing per node doubles the count. Incrementing before the second link is '
             + 'written leaves the count describing a graph that is not yet built, which matters '
             + 'because an allocation between the two can fail.' },
    { rule: 'Re-inserting an existing weighted edge updates the weight and does not change `nE`.',
      because: 'The edge already exists; only its value changes. Appending a second node instead '
             + 'leaves two nodes for one edge, after which a chain walk can return either weight '
             + 'and the count over-reports.' }
  ],
  examTraps: [
    { trap: 'Quoting adjacency-list space as `O(E)`.',
      instead: 'It is `O(V + E)`. The head array exists even for a graph with no edges at all, '
             + 'and an isolated vertex still occupies a head.' },
    { trap: 'Expecting an adjacency test to be constant time because the neighbours are in a list.',
      instead: 'A yes-or-no answer walks the chain, up to `V - 1` nodes. The list is fast at '
             + 'ENUMERATING the neighbours that exist, not at testing one named pair.' },
    { trap: 'Counting the two nodes of an undirected edge as two edges.',
      instead: 'They are one edge stored twice. The stored-direction count is `2E`; the logical '
             + 'count is `E`, and `nE` holds the latter.' },
    { trap: 'Reading the ascending chain order as a requirement of the representation.',
      instead: 'It is a stated choice of this implementation. It changes the printed chain and '
             + 'lets a search stop early; it does not change which vertices are neighbours.' }
  ],
  recognition: {
    stateVariables: ['head array', 'next links', 'nE', 'the node being allocated or freed'],
    tell: 'Neighbour sets that grow by allocation, one chain per vertex, is the adjacency list. A '
        + 'fixed grid of cells is the matrix. A single flat run of pair records with a capacity '
        + 'field is the array of edges, which has no per-vertex structure at all.'
  },
  complexity: [
    { case: 'Space', cost: '`V` heads plus one node per stored direction, so `O(V + E)`',
      why: 'The heads are sized from the vertex count and the nodes from the edge count, so both '
         + 'terms are real and neither can be dropped.' },
    { case: 'Is adjacent', cost: 'walks one chain, up to `V - 1` nodes, `O(V)`',
      why: 'The chain can hold every other vertex, and the ascending order only lets the walk '
         + 'stop early on average, not in the worst case.' },
    { case: 'Insert or remove an edge', cost: '`O(V)`',
      why: 'The allocation itself is constant, but locating or ruling out the edge walks the '
         + 'chain first, and a removal walks the reverse chain too.' },
    { case: 'Whole-graph neighbour enumeration', cost: 'touches `2E` nodes and `V` heads once',
      why: 'Each stored direction is read exactly once, which is why a traversal over lists is '
         + 'quoted as `O(V + E)`.' },
    { case: 'Destroy', cost: 'frees every node and every head, `O(V + E)`',
      why: 'Unlike the matrix there is one release per edge as well as per vertex, so a dense '
         + 'graph is dearer to tear down than to create.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one pointer write, allocation or release',
    columns: ['operation', 'chain walked', 'node allocated or freed', 'next link rewritten', 'nE']
  },
  seeAlso: [
    { id: 'graphreps', why: 'the three-way cost comparison this is one column of' },
    { id: 'graphadt', why: 'the same interface over a matrix, where insertion is one write and no '
                         + 'walk at all' },
    { id: 'graphedges', why: 'the third representation, which trades the per-vertex structure away '
                           + 'entirely for one flat run of records' },
    { id: 'stack', why: 'the same next-pointer discipline on a simpler structure, where the '
                      + 'relink-before-free rule is easier to see' }
  ]
};

T.graphedges = {
  coreInvariant:
    'The array has a LIVE PREFIX: records zero up to `nE - 1` are the graph, and everything from '
    + '`nE` to `maxE - 1` is unused capacity rather than empty edges. Every operation has to '
    + 'preserve that, which is why a removal must compact by shifting later records left instead '
    + 'of blanking a slot, and why every scan is bounded by `nE` and never by `maxE`. Capacity '
    + 'and content are two different numbers, and confusing them is how this representation goes '
    + 'wrong.',
  mechanism:
    'One contiguous run of records holds `(v, w)` pairs, with a weight field when the graph is '
    + 'weighted. This tracer starts at capacity eight and doubles with a checked reallocation '
    + 'when `nE` reaches `maxE`. An insertion scans the live prefix for a duplicate; a weighted '
    + 'duplicate has its weight overwritten, otherwise the record is appended at index `nE` and '
    + 'the count rises. Undirected weighted insertion stores a canonical endpoint order so one '
    + 'edge has one spelling. A removal finds the index, copies every later record one place '
    + 'left, and then decrements.',
  criticalInvariants: [
    { rule: 'Every scan is bounded by `nE`, never by `maxE`.',
      because: 'Cells beyond the live prefix hold stale data from a record that was shifted away, '
             + 'or were never written at all. Scanning them reports edges that were deleted or '
             + 'never existed, and the stale values look exactly like real ones.' },
    { rule: 'A removal compacts the prefix.',
      because: 'Leaving a hole destroys the invariant that the graph is the first `nE` records. '
             + 'After that a scan either stops early at the hole or needs a per-slot validity '
             + 'flag that this representation does not have — so the compaction is not an '
             + 'optimisation, it is what keeps the structure meaningful.' },
    { rule: 'Growth uses a checked reallocation, and the old pointer is abandoned only once the '
          + 'new one is known good.',
      because: 'A reallocation can fail and hand back nothing. Overwriting the only pointer to '
             + 'the array with that failure loses every edge at once, and there is no second copy '
             + 'to recover from.' },
    { rule: 'Capacity is never shrunk here, so memory follows the PEAK edge count.',
      because: 'Deleting edges lowers `nE` and leaves `maxE` where it was. The structure is '
             + 'correct, but its footprint remembers the busiest moment of its life rather than '
             + 'its current size.' }
  ],
  examTraps: [
    { trap: 'Reading `maxE` as the edge count.',
      instead: '`nE` is the graph; `maxE` is only how much room there is. They are equal just '
             + 'before a growth and almost never otherwise.' },
    { trap: 'Expecting removal to be cheap because the structure is an array.',
      instead: 'It shifts up to `nE - 1` records to close the gap. Arrays are cheap to append to '
             + 'and dear to delete from the middle of.' },
    { trap: 'Expecting adjacency to be fast.',
      instead: 'Every adjacency question is a linear scan of the live prefix. This is the '
             + 'representation that makes creation cheapest and adjacency dearest, which is the '
             + 'opposite trade from the matrix.' },
    { trap: 'Taking capacity eight and doubling as part of the definition.',
      instead: 'That growth policy is a choice of this implementation. Only the live-prefix '
             + 'invariant and the linear scan belong to the representation itself.' }
  ],
  recognition: {
    stateVariables: ['nE', 'maxE', 'the scan index', 'the active record'],
    tell: 'A capacity field held separately from the count is the array of edges, because neither '
        + 'the matrix nor the adjacency list grows a shared buffer and so neither needs one. If '
        + 'you see records being copied one place left, that is compaction after a removal.'
  },
  complexity: [
    { case: 'Space', cost: 'one record per logical edge plus unused capacity, `O(E)`',
      why: 'Nothing is stored per vertex at all, which is why an isolated vertex costs nothing '
         + 'here and a head slot in an adjacency list.' },
    { case: 'Create', cost: 'one allocation and no initialisation, `O(1)`',
      why: 'There is no prefix to zero, because `nE` of zero already says that nothing is live.' },
    { case: 'Is adjacent, insert, remove', cost: 'scans the live prefix, `O(E)`',
      why: 'There is no index from a vertex to its edges, so every question about a named pair is '
         + 'answered by looking at the records one at a time.' },
    { case: 'Removal shifting', cost: 'copies up to `E - 1` records',
      why: 'Closing the gap moves every record that sat after the deleted one.' },
    { case: 'Growth', cost: 'each record is copied about once on average over a run of insertions',
      why: 'Doubling means the copies at each growth are paid for by the insertions since the '
         + 'last one, so appending is cheap when averaged out even though one insertion can be '
         + 'expensive.' },
    { case: 'Ordered variant', cost: 'adjacency in about `log E` comparisons',
      why: 'Sorted records admit a binary search, paid for by maintaining the order on every '
         + 'insertion.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one record scanned, written or shifted',
    columns: ['operation', 'index', 'record', 'nE', 'maxE']
  },
  seeAlso: [
    { id: 'graphreps', why: 'the three-way comparison, where this column is the cheap-to-create '
                          + 'and dear-to-query one' },
    { id: 'kruskal', why: 'the one algorithm that wants exactly this representation, because it '
                        + 'sorts the whole edge list and never asks about a named pair' },
    { id: 'graphlist', why: 'the representation that spends space on per-vertex structure to make '
                          + 'neighbour enumeration cheap' },
    { id: 'graphweighted', why: 'where the weight field sits in each of the three, and what '
                              + 're-insertion has to do with it' }
  ]
};

T.graphweighted = {
  coreInvariant:
    'Direction and weight are independent of representation. Direction decides whether a stored '
    + 'relation is symmetric, weight decides whether a cell, node or record carries a value as '
    + 'well as a yes-or-no, and the representation decides only WHERE that information lives. '
    + 'Because the two choices are independent of each other and of the storage, four modes times '
    + 'three representations is twelve combinations that need not be learnt separately: knowing '
    + 'the delta along each axis is enough to reconstruct any of them.',
  mechanism:
    'Directed insertion writes only the source side — one matrix cell, one chain node, one record '
    + 'with an ordered source-and-destination pair — so the representation stops being symmetric '
    + 'and that asymmetry IS the direction. Weighting replaces the boolean with a value plus some '
    + 'way of saying no edge: a sentinel cell, a weight field in the node, a weight field in the '
    + 'record. Re-inserting an existing weighted edge updates the value and leaves the count '
    + 'alone. Degree splits in two once direction is present, and the two halves are not equally '
    + 'cheap to read.',
  criticalInvariants: [
    { rule: 'Direction changes what one insertion writes, not how many logical edges exist.',
      because: 'An arc is one edge whether stored once or twice. Comparing a digraph and a graph '
             + 'by counting stored directions compares storage rather than structure, and makes '
             + 'an undirected graph look twice as dense as the same arcs drawn one-way.' },
    { rule: 'A weighted representation needs a no-edge value distinct from every legal weight.',
      because: 'If zero means no edge, a genuine zero-weight edge becomes invisible, and if a '
             + 'large sentinel means no edge, a genuinely large weight collides with it. '
             + 'Adjacency and weight are two separate facts and one cell cannot carry both unless '
             + 'the encoding keeps them apart.' },
    { rule: 'Out-degree and in-degree are different quantities and different costs.',
      because: 'Out-degree is one row, one chain, or the records whose source is `v`. In-degree '
             + 'needs a column of the matrix or a pass over every chain or record, because none '
             + 'of the three representations indexes an arc by its destination.' },
    { rule: 'Re-inserting an existing weighted edge updates, it does not append.',
      because: 'Appending leaves two entries for one edge, after which a scan may return either '
             + 'weight depending on which it meets first, and the count over-reports.' }
  ],
  examTraps: [
    { trap: 'Assuming weighted implies directed.',
      instead: 'The two are independent. An undirected weighted graph stores the same weight in '
             + 'both directions, and a directed unweighted graph stores a one-way boolean.' },
    { trap: 'Reading a directed matrix as symmetric out of habit.',
      instead: '`edges[v][w]` true with `edges[w][v]` false is the ordinary case for a digraph, '
             + 'and that is the arrow. Symmetry is something the undirected insertion imposes.' },
    { trap: 'Expecting in-degree to be as easy to read as out-degree.',
      instead: 'Scan the column, or every chain, or every record. The asymmetry of the data '
             + 'structure mirrors the asymmetry of the relation.' },
    { trap: 'Treating a weighted edge as two facts stored in two places.',
      instead: 'An undirected weighted edge is ONE weight that happens to be readable from both '
             + 'ends. If an update writes only one side the graph stops being well defined.' }
  ],
  recognition: {
    stateVariables: ['nV', 'nE', 'direction and weight mode', 'the representation', 'the selected cell, node or record'],
    tell: 'Symmetric writes mean undirected; a value stored beside the adjacency bit means '
        + 'weighted; and which of the three places that value sits in names the representation. '
        + 'Weight alone tells you nothing about direction, and direction alone nothing about '
        + 'storage.'
  },
  complexity: [
    { case: 'Weighted matrix space', cost: 'one value per ordered pair, `V^2` values',
      why: 'Same shape as the unweighted matrix, but a whole value per cell instead of one bit, '
         + 'so the constant factor rises while the order does not.' },
    { case: 'Weighted list or edge array space',
      cost: 'one extra field per stored direction or record, still `O(V + E)` and `O(E)`',
      why: 'The weight rides along with an entry that already exists, so weighting does not '
         + 'change how many entries there are.' },
    { case: 'Out-degree', cost: 'matrix and list `O(V)`, edge array `O(E)`',
      why: 'One row scan, one chain walk, or a filtered pass over every record.' },
    { case: 'In-degree', cost: 'matrix `O(V)` by column, list `O(V + E)`, edge array `O(E)`',
      why: 'No representation indexes by destination, so the list has to look at every chain '
         + 'while the matrix at least has a column to walk.' },
    { case: 'Weighted insertion', cost: 'the same search as the unweighted case, then one write',
      why: 'The existing edge must be found before the choice between update and append can be '
         + 'made, so the search cost of the representation still applies.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one mode-and-representation selection',
    columns: ['direction', 'weights', 'representation', 'what one insertion writes', 'where the weight lives']
  },
  seeAlso: [
    { id: 'graphreps', why: 'the unweighted undirected baseline these four modes are deltas from' },
    { id: 'dijkstra', why: 'the first algorithm that reads the weights rather than just the '
                         + 'adjacency, and what it needs from the representation' },
    { id: 'prim', why: 'an algorithm that compares weights across a frontier, which is where the '
                     + 'cost of finding a weight starts to matter' },
    { id: 'warshall', why: 'a directed algorithm that uses only adjacency, so direction matters '
                         + 'and weight does not' }
  ]
};

/* ------------------------------------------------------------------ *
 * Graph traversal. `bfs` lives in corpus-theory.js as an exemplar.    *
 * ------------------------------------------------------------------ */

T.bfspath = {
  coreInvariant:
    'The predecessor array is a TREE rooted at the source, not a list of edges: every reached '
    + 'vertex has exactly one parent, and following parents strictly reduces the distance to the '
    + 'source, so a walk back from any destination must terminate at the source and cannot loop — '
    + 'which is why one array of `V` entries answers a shortest-path query for every destination '
    + 'at once, and why the path necessarily comes out backwards and has to be reversed.',
  mechanism:
    'Breadth-first search fills `predecessor`, and reconstruction is a separate phase that reads '
    + 'nothing but that array. It starts at `dest` and repeats `v = predecessor[v]`, collecting '
    + 'each vertex, until it reaches `src`. Two sentinel values make the phase decidable without '
    + 'looking at the graph: `predecessor[src] = src` is the stop condition, and `-1` means never '
    + 'reached, which is tested FIRST so that an absent path is reported rather than walked into. '
    + 'The length reported is the edge count, which equals the breadth-first distance.',
  criticalInvariants: [
    { rule: 'The unreachable test runs before any walking.',
      because: 'With `predecessor[dest]` still `-1` the walk would step to `-1` and index outside '
             + 'the array. The absence of a path is a legitimate answer about the graph, not an '
             + 'error condition to discover by crashing into it.' },
    { rule: 'The loop stops by comparing against `src`, not by waiting for `-1`.',
      because: '`predecessor[src]` is `src`, so a loop waiting for `-1` would spin at the root '
             + 'forever. The self-parent is precisely what distinguishes the root from an '
             + 'unreached vertex, and both tests depend on that distinction holding.' },
    { rule: 'The collected vertices must be reversed before they are read as a path.',
      because: 'The array stores each vertex parent, not its child, so it can only be walked '
             + 'towards the root. Printing as you walk gives the path from the destination to the '
             + 'source, which is the right vertices in the wrong order.' },
    { rule: 'The array only certifies a SHORTEST path because breadth-first search filled it.',
      because: 'The reconstruction itself is indifferent to how the parents got there. It is the '
             + 'first-contact rule during the search that guarantees each parent is one step '
             + 'closer to the source; fill the same array depth-first and the walk still returns '
             + 'a path, just not a shortest one.' }
  ],
  examTraps: [
    { trap: 'Treating the reconstructed path as the unique answer.',
      instead: 'The array holds whichever parent reached each vertex first, which depends on '
             + 'neighbour order. The LENGTH is determined; the particular vertex sequence is one '
             + 'of possibly several of that length.' },
    { trap: 'Counting vertices and calling it the distance.',
      instead: 'A path through `k` vertices uses `k - 1` edges, and the breadth-first distance is '
             + 'the edge count. The off-by-one is at the source, which is in the path but cost '
             + 'nothing to reach.' },
    { trap: 'Rebuilding from a predecessor array produced by something other than breadth-first '
          + 'search and still calling the result shortest.',
      instead: 'Say which search filled it. The reconstruction is the same code either way, so '
             + 'nothing in the walk itself will tell you.' },
    { trap: 'Expecting the reconstruction to consult the graph.',
      instead: 'It reads only the array. That is why it costs no edge accesses at all and why it '
             + 'works unchanged over any representation.' }
  ],
  recognition: {
    stateVariables: ['predecessor', 'the queue during the search phase', 'v during the walk back',
                     'the partial path'],
    tell: 'A trace that fills an array and then walks the SAME array backwards, touching no edges '
        + 'in the second phase, is a reconstruction. If the second phase is still examining '
        + 'neighbours, it is not reconstruction but a second search.'
  },
  complexity: [
    { case: 'Reconstruction', cost: 'follows one parent link per vertex on the path, at most '
          + '`V - 1` steps',
      why: 'Each step moves strictly closer to the source, so no vertex can appear twice, and no '
         + 'edge is read at all.' },
    { case: 'The search that fills the array',
      cost: 'visits each vertex once and each edge twice with adjacency lists, `O(V + E)`',
      why: 'Each vertex is queued at most once and its neighbour list is walked once.' },
    { case: 'Space', cost: 'one array of `V` entries serves every destination',
      why: 'The array is a tree, so one copy answers all `V` queries from that source without '
         + 'storing anything per destination.' },
    { case: 'All pairs by this route', cost: 'one search per source, `V` times `O(V + E)`',
      why: 'Nothing about one source tree can be reused for another, so the work multiplies by '
         + 'the number of sources.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one parent step',
    columns: ['v', 'predecessor[v]', 'path so far (backwards)', 'edges so far']
  },
  seeAlso: [
    { id: 'bfs', why: 'how the array is filled, and the first-contact argument that is the only '
                    + 'reason the reconstructed path is shortest' },
    { id: 'dfspath', why: 'the same array shape and the same backwards walk with no shortest '
                        + 'guarantee, which isolates where the guarantee comes from' },
    { id: 'dijkstra', why: 'the identical reconstruction once edges carry weights, including the '
                         + 'extra source test it needs' }
  ]
};

T.dfs = {
  coreInvariant:
    'The recursion IS the stack, and a vertex is marked visited on ENTRY to its call, so no '
    + 'vertex is ever entered twice. That is what bounds the whole traversal to one call per '
    + 'vertex and one test per edge direction instead of letting a cycle run forever. The call '
    + 'stack at any moment is exactly the current path from the source, which is why the edges '
    + 'that generated the calls form a tree and can never close a cycle.',
  mechanism:
    'Marking is the first statement of the recursive call, before any neighbour is examined. The '
    + 'neighbour loop then tests each candidate and recurses only into unvisited ones; a visited '
    + 'neighbour is still EXAMINED, which is how a non-tree edge is noticed, but not followed. '
    + 'This tracer scans neighbours in ascending vertex order, so the lowest-numbered unvisited '
    + 'neighbour is taken first and the search commits to one branch completely before trying the '
    + 'next. When the loop runs out the call returns, and that return is the backtrack: control '
    + 'resumes in the parent loop at its next neighbour.',
  criticalInvariants: [
    { rule: 'The vertex is marked on entry, before the neighbour loop.',
      because: 'Marking after the loop, or on the way out, lets a cycle re-enter the vertex while '
             + 'its first call is still open, and the recursion need not terminate. On an acyclic '
             + 'graph the bug is invisible, which is what makes it dangerous.' },
    { rule: 'A mark is never cleared.',
      because: 'Clearing on backtrack turns one traversal into an enumeration of every path, '
             + 'which is exactly what a Hamiltonian search does on purpose and is exponential. '
             + 'The permanence of the mark is the entire difference between linear and '
             + 'intractable here.' },
    { rule: 'One call reaches only the source component.',
      because: 'The recursion can only follow edges, so a vertex with no path from the source is '
             + 'never entered. Covering a disconnected graph needs an outer loop over all '
             + 'vertices, which is a different algorithm with a different answer.' },
    { rule: 'A visited neighbour is tested and dropped, not skipped silently.',
      because: 'The edge is still inspected, so the cost counts it; and in an undirected search '
             + 'every such edge closes a cycle inside the current component, which is the fact '
             + 'that cycle detection and component counting both build on.' }
  ],
  examTraps: [
    { trap: 'Expecting depth-first search to find a shortest path.',
      instead: 'It finds the first path in neighbour order, which can be arbitrarily longer than '
             + 'the shortest. Minimising the edge count is what the queue in breadth-first search '
             + 'buys, and a stack cannot substitute for it.' },
    { trap: 'Expecting a unique visit order.',
      instead: 'The order depends entirely on neighbour order; this tracer scans ascending. The '
             + 'SET of vertices visited is the same under any order, the sequence is not.' },
    { trap: 'Reading the call-stack display as the visited set.',
      instead: 'It is the ACTIVE path only. A vertex leaves the stack when its call returns but '
             + 'stays visited for the rest of the traversal.' },
    { trap: 'Assuming one call covers the graph.',
      instead: 'It covers one component. The outer loop that reaches the rest is what component '
             + 'labelling and whole-graph cycle detection add.' }
  ],
  recognition: {
    stateVariables: ['visited', 'the call stack', 'v', 'w'],
    tell: 'A stack or a recursion that deepens along one branch and shrinks on return is '
        + 'depth-first; a queue draining in arrival order is breadth-first. The signature is a '
        + 'stack display that goes deep and then unwinds, rather than staying one level wide. If '
        + 'the stack is explicit rather than the call stack, see the iterative version, where the '
        + 'marking rule differs.'
  },
  complexity: [
    { case: 'Adjacency list', cost: 'makes one call per vertex and examines each edge twice, so '
          + '`O(V + E)`',
      why: 'A vertex is entered only on its first encounter, and each of its incident edges is '
         + 'looked at once from each end.' },
    { case: 'Adjacency matrix', cost: '`O(V^2)`',
      why: 'Each call scans a row of `V` entries to find its neighbours, whether or not edges are '
         + 'there.' },
    { case: 'Space', cost: 'one array of `V` entries plus a call stack up to `V` frames deep',
      why: 'On a path graph the recursion is as deep as the graph is long, which is the one case '
         + 'where the stack depth is a practical concern rather than a bound.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one call entry, one neighbour test or one return',
    columns: ['v', 'w', 'visited[]', 'call stack', 'tree edge?']
  },
  seeAlso: [
    { id: 'dfsiter', why: 'the same traversal with an explicit stack, where the mark moves to the '
                        + 'pop and the neighbour order effectively reverses' },
    { id: 'bfs', why: 'the queue version, and why only that one minimises the edge count' },
    { id: 'components', why: 'the outer loop that turns one-component coverage into whole-graph '
                           + 'coverage' },
    { id: 'cycleu', why: 'what one extra parameter carried down the recursion turns this into' }
  ]
};

T.dfspath = {
  coreInvariant:
    'One array does three jobs: `-1` means not yet reached, any other value is the parent, and '
    + '`predecessor[src] = src` marks the root. Because an entry is written the moment a vertex '
    + 'is reached and is NEVER cleared on backtrack, each vertex is entered at most once, so the '
    + 'search is linear rather than exponential. The price of that is exactly the guarantee it '
    + 'cannot give: the path returned is the first one in neighbour order and need not be '
    + 'shortest.',
  mechanism:
    '`predecessor[src]` is set to `src`, then the recursive call tests `v == dest` on ENTRY and '
    + 'returns success at once if it holds. Otherwise it walks neighbours in ascending order and, '
    + 'for each `w` whose entry is still `-1`, writes `predecessor[w] = v` and recurses. A success '
    + 'propagates straight up with no further work; a failure continues the loop and then '
    + 'backtracks, leaving its writes behind. On success the path is read backwards from the '
    + 'destination exactly as it would be after a breadth-first search.',
  criticalInvariants: [
    { rule: 'The parent is written BEFORE the recursive call, not after it returns.',
      because: 'The entry is the visited marker as well as the parent. Writing it after the call '
             + 'means a cycle re-enters `w` while its first call is still open and the recursion '
             + 'need not terminate — the same failure as marking late in a plain traversal, with '
             + 'the array doing double duty hiding it.' },
    { rule: 'A failed branch leaves its writes in place.',
      because: 'Clearing them would let the search re-enter the same dead region by another route '
             + 'and the cost becomes exponential. The consequence is that entries exist for '
             + 'vertices not on the returned path, so the finished array is a depth-first TREE '
             + 'rather than a path.' },
    { rule: 'The destination test is on entry, and covers the source.',
      because: 'With `dest` equal to `src` the answer is the one-vertex path and no edge should be '
             + 'traversed. Testing after the neighbour loop would walk the whole component before '
             + 'noticing that it had started at the answer.' },
    { rule: '`-1` must keep exactly one meaning.',
      because: 'It means not reached, and the root is excluded from that by being its own parent. '
             + 'If the root kept `-1` the reconstruction could not tell a finished walk from an '
             + 'unreachable destination.' }
  ],
  examTraps: [
    { trap: 'Reading the finished predecessor array as the path.',
      instead: 'It is the whole search tree, abandoned branches included. The path is the chain '
             + 'from the destination back to the source and nothing else in the array.' },
    { trap: 'Calling the result shortest because it came out of a predecessor array.',
      instead: 'Only first-contact order in a breadth-first search certifies shortest. Here the '
             + 'path is whatever neighbour order happened to find first, and it can be much '
             + 'longer.' },
    { trap: 'Expecting the search to undo its marks the way a Hamiltonian search does.',
      instead: 'It never unsets an entry, and that is the difference between a linear reachability '
             + 'search and an exponential enumeration of orderings.' },
    { trap: 'Taking an early success as evidence that the algorithm is fast.',
      instead: 'A lucky neighbour order can finish after very few calls and an unlucky one '
             + 'explores the whole component first. The worst case is unchanged either way.' }
  ],
  recognition: {
    stateVariables: ['predecessor', 'the call stack', 'v', 'w', 'dest'],
    tell: 'A predecessor array filled by a recursion that tests for a destination on entry is '
        + 'depth-first path finding; the same array filled from a queue is breadth-first. If you '
        + 'see marks being CLEARED on the way back up, it is a backtracking enumeration and not a '
        + 'traversal at all.'
  },
  complexity: [
    { case: 'Adjacency list', cost: 'writes each vertex parent at most once and tests each edge '
          + 'twice, `O(V + E)`',
      why: 'The permanence of the write is what keeps every vertex to a single entry, which is '
         + 'what makes the bound linear.' },
    { case: 'Adjacency matrix', cost: '`O(V^2)`',
      why: 'Each call scans a row of `V` entries to enumerate its neighbours.' },
    { case: 'Early exit', cost: 'stops as soon as the destination is entered',
      why: 'The success return does no further neighbour work at any level, so a short answer '
         + 'costs little even though the worst case is a full component sweep.' },
    { case: 'Space', cost: 'one array of `V` entries plus a call stack up to `V` frames',
      why: 'Nothing is stored per edge, so memory tracks the vertex count rather than density.' },
    { case: 'Reconstruction', cost: 'at most `V - 1` parent steps and no edge reads',
      why: 'The chain from destination to source cannot revisit a vertex, because each step moves '
         + 'to a strict ancestor in the search tree.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one call entry, one neighbour test or one backtrack',
    columns: ['v', 'w', 'predecessor[w] before', 'write made', 'predecessor[]', 'outcome']
  },
  seeAlso: [
    { id: 'bfspath', why: 'the same backwards walk over an array that IS shortest, which isolates '
                        + 'what the queue buys' },
    { id: 'dfs', why: 'the plain traversal this adds a destination test and a parent write to' },
    { id: 'hamilton', why: 'the same recursion WITH the marks cleared on backtrack, and the '
                         + 'exponential cost that one line causes' }
  ]
};

T.dfsiter = {
  coreInvariant:
    'The explicit stack holds vertices that have been REACHED but not yet committed to, and a '
    + 'vertex becomes visited only when it is POPPED. Because the mark is deferred to the pop, '
    + 'the same vertex can be pushed by several different neighbours and sit on the stack more '
    + 'than once at the same time; correctness survives because the first pop marks it and every '
    + 'later pop of it is skipped. The set of vertices reached is identical to the recursive '
    + 'version — the ORDER and the surviving parent are not.',
  mechanism:
    'Push the source; then repeatedly pop a vertex, skip it if already visited, otherwise mark it '
    + 'and push every neighbour not yet visited, writing that neighbour parent as it pushes. In '
    + 'this tracer the neighbour loop runs in ASCENDING vertex order, so the highest-numbered '
    + 'unvisited neighbour lands on top and is popped first — the mirror image of the recursive '
    + 'version, which takes the lowest first. Because the parent is written at push time, the '
    + 'value that survives for a vertex is the one written by the LAST push that reached it '
    + 'before it was popped.',
  criticalInvariants: [
    { rule: 'A vertex is marked when popped, and an already-visited pop is skipped.',
      because: 'Without the skip, a vertex pushed twice is expanded twice and its neighbours are '
             + 'pushed again, so on a cyclic graph the stack can grow without bound. The skip is '
             + 'not a tidy-up; it is what makes the loop terminate.' },
    { rule: 'Pushing a neighbour is not visiting it.',
      because: 'The stack is a set of candidates. Counting pushes as visits makes the trace '
             + 'longer than `V`, and reports a vertex as visited before any of its edges have '
             + 'been looked at.' },
    { rule: 'The parent entry is overwritten by every later push that reaches the same vertex.',
      because: 'The write happens at push time, not at pop time, so the parent recorded need not '
             + 'be the vertex whose pop eventually marked it. The reachable SET matches the '
             + 'recursive version exactly; the recorded tree can differ.' },
    { rule: 'Already-visited neighbours are not pushed at all.',
      because: 'The push guard and the pop guard are both needed and do different work: the push '
             + 'guard keeps settled vertices out, while duplicates still arise among vertices '
             + 'that are unvisited at the moment of each push.' }
  ],
  examTraps: [
    { trap: 'Expecting the stack never to hold a vertex twice.',
      instead: 'Duplicates are normal here and are the direct consequence of marking at the pop. '
             + 'On this tracer default input the stack reaches three copies of one vertex.' },
    { trap: 'Expecting iterative and recursive depth-first search to visit in the same order.',
      instead: 'Pushing all the neighbours and then taking the top reverses the neighbour order '
             + 'relative to recursion. On this tracer the recursive version takes the '
             + 'lowest-numbered neighbour first and the iterative version takes the highest.' },
    { trap: 'Reading the final parent array as the recursion tree.',
      instead: 'It is whatever the last push wrote, so an entry can name a vertex other than the '
             + 'one the pop actually came from.' },
    { trap: 'Assuming the stack is bounded by `V` the way the call stack is.',
      instead: 'It is bounded by the number of pushes, which is one per edge in the worst case. '
             + 'That extra space is what buys freedom from recursion depth.' }
  ],
  recognition: {
    stateVariables: ['the explicit stack (shown bottom to top)', 'visited', 'predecessor',
                     'the popped vertex'],
    tell: 'A stack whose top is taken next, with duplicates allowed and a visited test '
        + 'IMMEDIATELY AFTER the pop, is iterative depth-first search. A queue taken from the '
        + 'front is breadth-first. A recursion display that deepens and unwinds, with the mark on '
        + 'entry, is the recursive form, where duplicates cannot occur.'
  },
  complexity: [
    { case: 'Adjacency list', cost: 'makes at most one push per edge direction plus the source, so '
          + 'at most `2E + 1` pushes and the same number of pops, giving `O(V + E)`',
      why: 'A vertex is pushed only by a neighbour being expanded, and each vertex is expanded '
         + 'once, so the pushes are bounded by the stored directions.' },
    { case: 'Adjacency matrix', cost: '`O(V^2)`',
      why: 'Each expanded vertex scans a row of `V` entries to find its neighbours.' },
    { case: 'Space', cost: 'the stack can hold more than `V` entries, up to one per edge, `O(E)`',
      why: 'Duplicates are permitted, so unlike the recursive call stack the bound is set by the '
         + 'edge count rather than by the vertex count.' },
    { case: 'Wasted pops', cost: 'one skipped pop per duplicate push',
      why: 'Every push beyond the first for a vertex produces a pop that does nothing but test '
         + 'the mark, which is why the row count exceeds the vertex count.' }
  ],
  convention: 'dfsStack',
  whatToDraw: {
    unit: 'one row = one pop or one push',
    columns: ['popped vertex', 'already visited?', 'neighbours pushed', 'stack bottom to top',
              'predecessor array']
  },
  seeAlso: [
    { id: 'dfs', why: 'the recursive form, where the mark is on entry and no vertex can appear '
                    + 'twice — the comparison is the lesson' },
    { id: 'bfs', why: 'the same loop with a queue instead of a stack, which is the whole '
                    + 'difference between the two traversals' },
    { id: 'stack', why: 'the structure being driven here, and what push and pop cost' }
  ]
};

/* ------------------------------------------------------------------ *
 * Graph problems.                                                     *
 * ------------------------------------------------------------------ */

T.cycleu = {
  coreInvariant:
    'In an undirected depth-first search every edge is either a tree edge or an edge back to an '
    + 'already-visited vertex, and there is no third kind. A cycle therefore exists if and only '
    + 'if the search meets a visited vertex that is not the one it just came from, because the '
    + 'tree path that already reached that vertex plus this one edge closes a cycle. The '
    + 'not-the-parent test is what stops the single edge between `v` and `w` being mistaken for '
    + 'the two-step round trip, and the outer loop over every vertex is what makes the verdict a '
    + 'statement about the WHOLE graph rather than about one component.',
  mechanism:
    'The visited array starts all false. The outer loop calls the recursive check on each '
    + 'unvisited vertex, passing that vertex as its own previous vertex so the root has no parent '
    + 'to exclude. Inside, the vertex is marked and each neighbour examined: a neighbour equal to '
    + 'the previous vertex is skipped, a visited neighbour is a cycle and the search returns at '
    + 'once, and anything else is recursed into. This tracer stops the outer loop as soon as a '
    + 'cycle is found and names the back edge that closed it.',
  criticalInvariants: [
    { rule: 'The previous vertex is carried down the recursion, and the root is its own previous.',
      because: 'Without it the search steps from `v` to `w`, immediately sees `v` as a visited '
             + 'neighbour of `w`, and reports a cycle in every graph that has even one edge. '
             + 'Making the root its own previous is what lets the same code handle the top of the '
             + 'recursion without a special case.' },
    { rule: 'The outer loop visits every vertex, not just the first.',
      because: 'A cycle can live entirely inside a component that the first search never '
             + 'reaches, and a single search from vertex zero would then report a cyclic graph as '
             + 'acyclic. This tracer finds the cycle in a later component on exactly that input.' },
    { rule: 'A visited neighbour that is not the parent is enough; no further searching is needed.',
      because: 'That vertex is already on the tree path from the root, so the path to it plus this '
             + 'one edge closes a cycle. The existence question is therefore settled in a single '
             + 'pass with no second phase and nothing to reconstruct.' },
    { rule: 'The exclusion is of the parent, not of visited vertices in general.',
      because: 'Excluding every visited neighbour removes exactly the evidence being looked for, '
             + 'and the test then answers no on every graph.' }
  ],
  examTraps: [
    { trap: 'Excluding all visited neighbours rather than only the parent.',
      instead: 'Visited-and-not-parent IS the cycle. Widening the exclusion makes the test always '
             + 'report acyclic, and it will do so quietly on every input.' },
    { trap: 'Excluding the parent by vertex number where repeated edges can exist.',
      instead: 'Two distinct edges between the same pair ARE a cycle, and comparing vertex '
             + 'numbers hides it. This tracer input grammar rejects repeated edges and self-loops, '
             + 'so the case cannot arise here, but the by-vertex test is not safe in a model that '
             + 'permits them.' },
    { trap: 'Concluding acyclic from one search that happened to start in a tree-shaped component.',
      instead: 'The verdict needs the outer loop. One search answers the question only for the '
             + 'component it started in.' },
    { trap: 'Deciding the question by counting edges.',
      instead: 'An acyclic graph has exactly `V - C` edges, so more than that forces a cycle — but '
             + '`E` less than `V` proves nothing, because a triangle plus an isolated vertex has '
             + 'three edges and four vertices.' }
  ],
  recognition: {
    stateVariables: ['visited', 'prev', 'the recursion stack', 'v', 'w'],
    tell: 'A depth-first search carrying a `prev` parameter alongside `visited` is the undirected '
        + 'cycle test. If instead you see a SECOND boolean array that is cleared on the way out of '
        + 'each call, the graph is directed and the question has a different answer and a '
        + 'different test.'
  },
  complexity: [
    { case: 'Adjacency list, worst case',
      cost: 'visits each vertex once and examines each edge twice, `O(V + E)`',
      why: 'The worst case is an acyclic graph, where nothing can stop early and every edge has '
         + 'to be ruled out from both ends.' },
    { case: 'Early exit', cost: 'stops at the first back edge',
      why: 'A graph with a short cycle near the first vertex finishes after a handful of steps, so '
         + 'a yes answer is often far cheaper than a no.' },
    { case: 'Adjacency matrix', cost: '`O(V^2)`',
      why: 'Each visit scans a row of `V` entries to enumerate the neighbours.' },
    { case: 'Space', cost: 'one array of `V` entries plus a recursion up to `V` frames deep',
      why: 'Nothing is kept per edge; the back edge is reported as it is found rather than '
         + 'collected.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one visit or one neighbour test',
    columns: ['v', 'prev', 'w', 'w == prev?', 'visited[w]', 'verdict']
  },
  seeAlso: [
    { id: 'cycled', why: 'why this exact test is wrong on a digraph, and what the second array '
                       + 'replaces it with' },
    { id: 'components', why: 'the same outer loop counting instead of deciding, and where the '
                           + 'non-tree edges go' },
    { id: 'dfs', why: 'the traversal underneath, without the extra parameter' }
  ]
};

T.components = {
  coreInvariant:
    'An entry of `-1` means not yet assigned, and one depth-first search from an unassigned vertex '
    + 'assigns exactly the vertices reachable from it — which is precisely one connected '
    + 'component, because reachability in an undirected graph is an equivalence relation. The '
    + 'outer loop therefore starts one search per component and the counter rises once per search, '
    + 'so the number of searches IS the number of components. The edges the searches used to reach '
    + 'new vertices form a spanning forest, and it has exactly `V - C` edges.',
  mechanism:
    'The label array starts all `-1` and the counter at zero. For each vertex in turn: if it is '
    + 'unassigned, run a search that writes the current counter value into every vertex it '
    + 'reaches, then increment. An edge is recorded as a tree edge only when it reaches a vertex '
    + 'whose label is still `-1`, so no recorded edge can close a cycle. A component of `k` '
    + 'vertices contributes `k - 1` tree edges, and summing over `C` components gives `V - C`; '
    + 'this tracer states that identity and then checks it against what the search recorded.',
  criticalInvariants: [
    { rule: 'The counter rises after a search returns, once per component.',
      because: 'Incrementing inside the search would give every vertex its own number and the '
             + 'count would come out as `V`. The counter is a property of the outer loop, and that '
             + 'is the whole reason the outer loop exists separately from the search.' },
    { rule: 'The outer loop tests the label array, not a separate visited array.',
      because: '`-1` already means unvisited, so one array answers both questions and the two can '
             + 'never fall out of step. A second array would have to be kept in agreement, and any '
             + 'divergence would silently split or merge a component.' },
    { rule: 'An edge is recorded only when it reaches an unassigned vertex.',
      because: 'That is what makes the recorded set a forest. An edge to an already-assigned '
             + 'vertex would close a cycle within its component, so admitting one would break the '
             + 'edge count and the forest claim at the same time.' },
    { rule: 'An isolated vertex is a component and contributes no edges.',
      because: 'It is reachable from itself, so it takes its own label. A graph of `V` isolated '
             + 'vertices has `C` equal to `V` and `V - C` of zero recorded edges, which is the '
             + 'identity holding at its extreme rather than an exception to it.' }
  ],
  examTraps: [
    { trap: 'Expecting the spanning forest to have `V - 1` edges.',
      instead: '`V - 1` belongs to a spanning TREE, which exists only when the graph is '
             + 'connected. A forest has `V - C` edges, one fewer for every extra component.' },
    { trap: 'Reading the non-tree edges as errors or as duplicates.',
      instead: 'In an undirected search every non-tree edge closes a cycle inside its own '
             + 'component. Their number is `E` minus `V - C`, and it is a measure of how far the '
             + 'graph is from being a forest.' },
    { trap: 'Taking the component NUMBERS as meaningful.',
      instead: 'They come from the order in which the outer loop first meets an unassigned '
             + 'vertex, so they are an artefact of vertex numbering. Only the PARTITION into '
             + 'components is determined.' },
    { trap: 'Reading a component count off a single traversal.',
      instead: 'One traversal reports one component. The count is the number of times the outer '
             + 'loop had to start a new one.' }
  ],
  recognition: {
    stateVariables: ['componentOf', 'compNo', 'the recursion stack', 'v', 'w'],
    tell: 'An array of labels initialised to `-1` with a counter that only ever moves in the OUTER '
        + 'loop is component labelling. One run of the same search with a boolean array and no '
        + 'outer loop is a plain traversal, and a boolean verdict instead of a counter is cycle '
        + 'detection.'
  },
  complexity: [
    { case: 'Adjacency list, whole graph',
      cost: 'labels each vertex once and examines each edge twice across ALL the searches together, '
          + 'so `O(V + E)`',
      why: 'The searches partition the vertices between them, so having many components costs no '
         + 'more in total than having one.' },
    { case: 'Adjacency matrix', cost: '`O(V^2)`',
      why: 'Every vertex neighbour enumeration is a row scan of `V` entries regardless of its '
         + 'degree.' },
    { case: 'The outer loop', cost: 'adds `V` constant-time tests',
      why: 'It reads one label per vertex and starts a search only on an unassigned one, so it '
         + 'contributes nothing to the order.' },
    { case: 'Space', cost: 'one array of `V` entries, plus the recursion, plus `V - C` edges if '
          + 'the forest is kept',
      why: 'The labels replace a visited array rather than adding to it, and the forest is the '
         + 'only per-edge storage.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one label assignment or one neighbour test',
    columns: ['v', 'w', 'compNo', 'componentOf[]', 'tree edge recorded?']
  },
  seeAlso: [
    { id: 'cycleu', why: 'the same outer loop answering a yes-or-no question, and where the '
                       + 'non-tree edges become the evidence' },
    { id: 'kruskal', why: 'what a spanning forest becomes once weights decide which edges are in '
                        + 'it, and why `V - C` reappears there' },
    { id: 'graphfund', why: 'the definitions of component, spanning tree and spanning forest that '
                          + 'this mechanises' },
    { id: 'dfs', why: 'the traversal being repeated, which reaches only one component per call' }
  ]
};

T.hamilton = {
  coreInvariant:
    'This is an enumeration, not a traversal, and the one line that makes it so is clearing the '
    + 'mark on the way out of a failed call. Because a mark is UNDONE when a branch fails, a '
    + 'vertex can be used again on a different path, so the search can reach every ordering of '
    + 'the vertices rather than every vertex once. That is what makes it correct for a question '
    + 'about orderings — and it is also exactly why it is exponential.',
  mechanism:
    'A counter of vertices remaining starts at `V`. A call marks the vertex, appends it to the '
    + 'current path, decrements the counter, and succeeds the moment the counter reaches zero — '
    + 'for a circuit, only if the final vertex is also adjacent to the start. Otherwise it tries '
    + 'each unvisited neighbour in turn and recurses. On failure it clears the mark, removes the '
    + 'vertex from the path and returns. The path form tries every start vertex; the circuit form '
    + 'fixes one, because a circuit that exists can be rotated to begin anywhere.',
  criticalInvariants: [
    { rule: 'The mark is cleared on the failure path only, after the neighbour loop.',
      because: 'Without it the search degenerates into an ordinary depth-first traversal, which '
             + 'visits each vertex once and so can only ever find the single path its neighbour '
             + 'order happens to take. With it, every ordering is reachable. Clearing it on '
             + 'SUCCESS instead would unwind the answer on the way back up.' },
    { rule: 'The success test counts VERTICES remaining, not edges used.',
      because: 'The question is whether every vertex appears exactly once. A path through all `V` '
             + 'vertices uses `V - 1` edges, so counting edges invites an off-by-one at the final '
             + 'vertex, where the two tests disagree by exactly one.' },
    { rule: 'For a circuit the closing edge is tested, never assumed.',
      because: 'A Hamiltonian path whose two ends are not adjacent is not a circuit. The two '
             + 'questions have different answers on the same graph, and the closing-edge test is '
             + 'the only place that difference appears.' },
    { rule: 'One start vertex suffices for the circuit form, but not for the path form.',
      because: 'Every vertex lies on a circuit if one exists, so any start will find it. A path '
             + 'has two particular ends, and starting anywhere else can miss it, which is why the '
             + 'path form loops over starts.' }
  ],
  examTraps: [
    { trap: 'Looking for a degree or parity test like the Eulerian one.',
      instead: 'No efficient characterisation of Hamiltonicity is known. The Eulerian question is '
             + 'settled by counting odd degrees; this one is settled only by searching, and that '
             + 'contrast is the lesson rather than a shortcoming of this implementation.' },
    { trap: 'Reading a failed search as a weak or partial answer.',
      instead: 'The search is exhaustive, so a no is a proof of absence. It simply costs an '
             + 'exponential amount of work to obtain, which is why this tracer caps the input '
             + 'size.' },
    { trap: 'Confusing visiting every vertex once with using every edge once.',
      instead: 'Hamiltonian is about vertices and Eulerian is about edges. A graph can satisfy '
             + 'either, both or neither, and neither answer constrains the other.' },
    { trap: 'Reading the undo as a defect copied in from a traversal.',
      instead: 'It is the mechanism. The question is about orderings, and only a search that can '
             + 'reuse a vertex on a different path can enumerate them.' }
  ],
  recognition: {
    stateVariables: ['visited', 'numVerticesLeft', 'the current path', 'v', 'w'],
    tell: 'Marks that are CLEARED when a branch fails, together with a counter of how much of the '
        + 'goal remains, is backtracking search. Marks that are never cleared is a traversal. If '
        + 'the counter runs over edges rather than vertices, the question is Eulerian instead.'
  },
  complexity: [
    { case: 'Worst case', cost: 'tries orderings of the vertices, so the work grows like `V` '
          + 'factorial',
      why: 'Every branch that fails is retried from a different prefix, and the number of prefixes '
         + 'is the number of orderings. This tracer limits the input to seven vertices so an '
         + 'exhaustive search still finishes.' },
    { case: 'Best case', cost: 'makes `V` choices',
      why: 'A lucky neighbour order walks straight down one branch with no backtracking at all, '
         + 'which a cycle graph produces immediately.' },
    { case: 'Space', cost: 'one array of `V` entries, a path of up to `V` vertices, and a '
          + 'recursion up to `V` frames',
      why: 'Only one branch is held at a time, so the SPACE is modest. It is the number of '
         + 'branches, not their depth, that is intractable.' },
    { case: 'Circuit form', cost: 'fixes the start, dividing the work by about `V`',
      why: 'Rotational symmetry removes the outer loop over starts, which changes the constant '
         + 'and leaves the growth rate untouched.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one choice or one backtrack',
    columns: ['v', 'w', 'numVerticesLeft', 'current path', 'visited[]', 'outcome']
  },
  seeAlso: [
    { id: 'euler', why: 'the same shape of question with an efficient test, which is the contrast '
                      + 'worth being able to state in one sentence' },
    { id: 'dfspath', why: 'the same recursion WITHOUT the undo, and why removing one line makes it '
                        + 'linear' },
    { id: 'dfs', why: 'the plain traversal the marking discipline is being deliberately broken '
                    + 'away from' }
  ]
};

T.euler = {
  coreInvariant:
    'Every time a walk passes THROUGH a vertex it uses two of that vertex edges, one to arrive '
    + 'and one to leave, so a walk that uses each edge exactly once can leave an odd number of '
    + 'edges at a vertex only where it starts or where it ends. That pairing argument is the whole '
    + 'theorem: a circuit needs every degree even, a path allows exactly two odd vertices and '
    + 'those are its two ends, and in both cases the edges must all lie in one piece. Because the '
    + 'test is a count plus one connectivity check, the question is settled without constructing '
    + 'any walk at all.',
  mechanism:
    'Count the odd-degree vertices and accept zero or two for a path, zero only for a circuit. '
    + 'Then check that the vertices that HAVE edges all lie in one component: start a traversal at '
    + 'the first vertex of non-zero degree, and afterwards require every non-zero-degree vertex to '
    + 'have been reached. Vertices of degree zero are ignored throughout, because a walk over '
    + 'edges cannot be asked to visit a vertex that has none. Both halves must pass; the verdict '
    + 'is their conjunction.',
  criticalInvariants: [
    { rule: 'Only the non-zero-degree vertices are required to be connected.',
      because: 'An isolated vertex has no edge to use, so it cannot affect whether every edge can '
             + 'be walked. A triangle plus two isolated vertices HAS an Eulerian circuit even '
             + 'though the graph is disconnected, and this tracer reports exactly that.' },
    { rule: 'The number of odd-degree vertices is always even, so one or three is impossible.',
      because: 'The degrees sum to `2E`, which is even, so the odd ones must pair up. A count of '
             + 'one or three means a degree was computed wrongly, and noticing that is cheaper '
             + 'than re-reading the graph.' },
    { rule: 'Both tests are needed; neither alone is sufficient.',
      because: 'Two disjoint even-degree cycles pass the parity test and have no Eulerian circuit, '
             + 'and a connected graph with four odd vertices is perfectly connected and still '
             + 'fails. Each test rules out a failure the other cannot see.' },
    { rule: 'A circuit requires zero odd vertices, not zero or two.',
      because: 'Two odd vertices give a path whose ENDS are those two vertices. A circuit returns '
             + 'to where it started, so that vertex is passed through as well as used twice at the '
             + 'ends, and its degree must be even.' }
  ],
  examTraps: [
    { trap: 'Confusing the Eulerian question with the Hamiltonian one.',
      instead: 'Eulerian is every EDGE exactly once and is decided by counting degrees; '
             + 'Hamiltonian is every VERTEX exactly once and has no known efficient test. The two '
             + 'can disagree in either direction on the same graph.' },
    { trap: 'Testing the whole graph for connectivity and rejecting a graph with isolated '
          + 'vertices.',
      instead: 'Only the edge-bearing part has to be connected. Isolated vertices are simply not '
             + 'part of the question.' },
    { trap: 'Accepting two odd-degree vertices for a circuit.',
      instead: 'Two odd vertices give a path between them. For a circuit the count must be zero, '
             + 'and that is the only difference between the two tests.' },
    { trap: 'Treating the test as a construction.',
      instead: 'It decides existence. Nothing in either half produces an edge sequence, and '
             + 'building the walk is a separate procedure.' }
  ],
  recognition: {
    stateVariables: ['degree per vertex', 'the odd-degree count', 'the connectivity visited array',
                     'v'],
    tell: 'A per-vertex degree table with a count of the odd entries, followed by ONE traversal '
        + 'used only as a yes-or-no connectivity check, is the Eulerian test. A counter of '
        + 'remaining vertices with marks that get cleared is the Hamiltonian search, which looks '
        + 'superficially similar and costs incomparably more.'
  },
  complexity: [
    { case: 'Adjacency list',
      cost: 'computes every degree and runs one traversal, visiting each vertex once and each edge '
          + 'twice, so `O(V + E)`',
      why: 'Both halves are single passes, and neither can be made to repeat work.' },
    { case: 'Adjacency matrix', cost: 'the degree pass alone is `O(V^2)`',
      why: 'Each degree is a row scan of `V` entries whether the vertex has one neighbour or '
         + 'none.' },
    { case: 'Cost of a yes against a no', cost: 'the same either way',
      why: 'The decision is a count with no early exit, which is the practical contrast with the '
         + 'Hamiltonian search, where a yes can be quick and a no ruinous.' },
    { case: 'Space', cost: 'one degree array and one visited array, both `V` entries',
      why: 'Nothing is stored per edge, because an edge only ever contributes to two degrees.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one degree computed, or one vertex reached by the connectivity check',
    columns: ['v', 'degree(v)', 'odd?', 'odd count so far', 'reached by the check?']
  },
  seeAlso: [
    { id: 'hamilton', why: 'the vertex version of the question, and why no comparable test for it '
                         + 'is known' },
    { id: 'graphfund', why: 'degree and the sum-of-degrees identity that the whole parity argument '
                          + 'rests on' },
    { id: 'components', why: 'the connectivity half done properly for every component, rather than '
                           + 'as a single yes-or-no check' }
  ]
};

/* ------------------------------------------------------------------ *
 * Directed graphs.                                                    *
 * ------------------------------------------------------------------ */

T.cycled = {
  coreInvariant:
    'In a digraph, already visited does not mean is an ancestor. A vertex can be reached a second '
    + 'time by a completely different route with no cycle involved, so the undirected test '
    + 'reports cycles that are not there. What identifies a cycle is an arc to a vertex still on '
    + 'the ACTIVE recursion path, and that set is exactly what the second array records. Two '
    + 'arrays are needed because the two facts differ: the visited mark is permanent, and the '
    + 'on-stack mark is the current path and is cleared on the way out.',
  mechanism:
    'Both arrays start false. On entry a vertex is marked visited and on-stack together. For each '
    + 'arc out of it: if the target is on the stack it is an ancestor and the arc closes a cycle, '
    + 'so the search returns at once; otherwise, if the target has not been visited, recurse. When '
    + 'the arc loop finishes, the on-stack mark is cleared and the call returns — the vertex has '
    + 'left the active path but stays visited, so it is never explored again. The outer loop runs '
    + 'over every vertex, so a cycle in a part of the digraph that nothing reaches is still found.',
  criticalInvariants: [
    { rule: 'The on-stack mark is cleared on the way OUT; the visited mark never is.',
      because: 'If the on-stack mark survived, a finished vertex would still look like an '
             + 'ancestor and a diamond — two paths that meet again — would be reported as a '
             + 'cycle. If the visited mark were cleared too, a vertex would be re-explored once '
             + 'per path through it and the search would stop being linear.' },
    { rule: 'The cycle test reads the on-stack array, not the visited array.',
      because: 'Visited true with on-stack false means the vertex was finished on an earlier '
             + 'branch. That is a forward or cross arc and carries no cycle, and it is the '
             + 'commonest configuration in a large acyclic digraph.' },
    { rule: 'No previous-vertex parameter is used, and none is needed.',
      because: 'In a digraph the arc from `v` to `w` and the arc from `w` to `v` are two different '
             + 'arcs, and together they genuinely are a cycle of length two. There is therefore '
             + 'nothing to exclude, and excluding it would hide a real answer.' },
    { rule: 'The outer loop covers every vertex.',
      because: 'A digraph has no notion of starting anywhere and reaching everything. A cycle can '
             + 'sit in a region with no arcs into it, and only an outer loop over all vertices '
             + 'will enter it.' }
  ],
  examTraps: [
    { trap: 'Reusing the undirected test — visited and not the parent — on a digraph.',
      instead: 'That reports a cycle for any two paths that meet, which is the commonest wrong '
             + 'answer in this topic. The replacement is the on-stack array, not a cleverer '
             + 'parent test.' },
    { trap: 'Excluding the arc back to the immediate predecessor.',
      instead: 'A two-arc round trip is a genuine directed cycle and must be reported. Treating '
             + 'the two directions as one edge is correct only for undirected graphs.' },
    { trap: 'Expecting the two arrays to hold the same thing.',
      instead: 'At every moment on-stack is a SUBSET of visited — the active path inside '
             + 'everything seen — and the gap between them is exactly where the forward and cross '
             + 'arcs live.' },
    { trap: 'Reading no cycle as no repeated visit.',
      instead: 'A vertex reached twice by two different routes is normal in an acyclic digraph. '
             + 'This tracer default acyclic example does exactly that and correctly reports no '
             + 'cycle.' }
  ],
  recognition: {
    stateVariables: ['visited', 'onStack', 'the recursion stack', 'v', 'w'],
    tell: 'TWO boolean arrays over the same vertices, one of them cleared on the way out of each '
        + 'call, is directed cycle detection. One boolean array plus a previous-vertex parameter '
        + 'is the undirected test. If the arrows in the trace are one-way, the undirected test is '
        + 'the wrong tool whatever it happens to report.'
  },
  complexity: [
    { case: 'Adjacency list', cost: 'sets each vertex two flags once and examines each arc once, '
          + 'so `O(V + E)`',
      why: 'An arc exists in one direction only, so unlike the undirected case each edge is looked '
         + 'at from one end rather than two.' },
    { case: 'Adjacency matrix', cost: '`O(V^2)`',
      why: 'Every call scans a row of `V` entries to enumerate the arcs out of its vertex.' },
    { case: 'Early exit on a cyclic digraph', cost: 'stops at the first back arc',
      why: 'The return propagates straight up with no further arc work, so a yes can be very '
         + 'cheap; proving a digraph acyclic requires the complete pass.' },
    { case: 'Space', cost: 'two arrays of `V` entries plus a recursion up to `V` frames',
      why: 'The extra `V` flags are precisely what buys the ability to distinguish an ancestor '
         + 'from a vertex merely seen before.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one arc test or one unwind',
    columns: ['v', 'w', 'visited[]', 'onStack[]', 'verdict']
  },
  seeAlso: [
    { id: 'cycleu', why: 'the undirected test, and exactly which configuration makes it fail here' },
    { id: 'warshall', why: 'reachability for every pair, where a true diagonal entry states the '
                         + 'same cycle fact one vertex at a time' },
    { id: 'webcrawl', why: 'another digraph traversal, with a queue and a membership structure '
                         + 'instead of two arrays' }
  ]
};

T.webcrawl = {
  coreInvariant:
    'A crawl is breadth-first search on a digraph that nobody has the whole of: the vertex set is '
    + 'discovered as the search runs, so the have-I-seen-this structure cannot be an array indexed '
    + 'by vertex number and must be a SET keyed on the identity of the page. Correctness rests on '
    + 'the same rule as any breadth-first search — a page joins the set the moment it is first '
    + 'seen, before it is ever dequeued — which is what stops a cycle of links from queuing a page '
    + 'again and again.',
  mechanism:
    'The start page enters the set and the queue together and the visit counter starts at zero. '
    + 'Each round dequeues a page, counts it as visited, and for each hyperlink on it adds the '
    + 'target to the set and the queue if the set does not already hold it. The loop ends when the '
    + 'queue empties OR the visit limit is reached, and this tracer reports which of the two '
    + 'stopped it. Pages can therefore be left sitting in the queue — discovered, in the set, and '
    + 'never visited.',
  criticalInvariants: [
    { rule: 'A page joins the set when it is ENQUEUED, not when it is visited.',
      because: 'Adding on visit lets every page that links to it queue it separately, so a cycle '
             + 'of links queues it repeatedly and the crawl need not terminate. This is the same '
             + 'rule as marking on enqueue in a plain breadth-first search, and it fails the same '
             + 'way.' },
    { rule: 'The set and the visit count are different quantities.',
      because: 'The set holds every page DISCOVERED, including those still queued; the count is '
             + 'pages actually fetched. The set is always at least as large, and after a '
             + 'limit-bounded crawl it is strictly larger — on this tracer default input it ends '
             + 'with seven pages known and six visited.' },
    { rule: 'Both stop conditions are checked every round.',
      because: 'A crawl that checks only the limit never finishes on a small site, and one that '
             + 'checks only the queue has no bound at all on a site whose links form cycles.' },
    { rule: 'Links are one-way.',
      because: 'A link from one page to another says nothing about a link back, so the crawl can '
             + 'reach a page from which it can never return. Treating the relation as symmetric '
             + 'would invent links that do not exist.' }
  ],
  examTraps: [
    { trap: 'Assuming the crawl has seen the whole site when it stops.',
      instead: 'A limit-bounded crawl stops with pages still queued, so not visited does not mean '
             + 'not reachable. This tracer names the stopping condition precisely so the two '
             + 'cannot be confused.' },
    { trap: 'Using a boolean array because the pages in the example carry numbers.',
      instead: 'The numbers are labels for a bounded picture. A crawler does not know how many '
             + 'pages exist, which is why a structure that grows with what it finds is the right '
             + 'choice and why its membership test is the operation that decides the cost.' },
    { trap: 'Counting a page once per inbound link.',
      instead: 'The set makes the second and later arrivals free. Every page is fetched once, '
             + 'however many pages point at it.' },
    { trap: 'Expecting the visit order to be the link order on the start page.',
      instead: 'It is breadth-first over the whole frontier, so pages one link away are all '
             + 'visited before anything two links away.' }
  ],
  recognition: {
    stateVariables: ['the visited set', 'the queue', 'numPagesVisited', 'the current page',
                     'the hyperlink being examined'],
    tell: 'A queue plus a SET rather than an array, with a counter tested against a limit, is a '
        + 'bounded crawl. The same queue with an array of predecessors and no limit is plain '
        + 'breadth-first search, which is the algorithm underneath.'
  },
  complexity: [
    { case: 'One bounded crawl',
      cost: 'performs one dequeue per visited page and one membership test per link on it',
      why: 'Each page is fetched once and each of its links examined once, so the work is set by '
         + 'what was visited rather than by the size of the site.' },
    { case: 'The membership test', cost: 'about one probe on average in a hash set',
      why: 'That is why a crawler uses one. Holding the seen pages in a list would make every test '
         + 'a scan and the crawl quadratic in what it has already found.' },
    { case: 'Space', cost: 'the set holds every page discovered, which exceeds the number visited',
      why: 'Discovery runs ahead of visiting by a whole frontier, so the memory needed is set by '
         + 'the widest frontier rather than by the visit limit.' },
    { case: 'Bounded by the limit rather than the site',
      cost: 'at most the limit many pages are fetched',
      why: 'The limit makes the cost predictable on a site whose size is unknown, which is the '
         + 'whole reason for having it.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one page visited or one hyperlink examined',
    columns: ['current page', 'hyperlink', 'already in the set?', 'the set', 'the queue',
              'pages visited']
  },
  seeAlso: [
    { id: 'bfs', why: 'the same queue discipline with an array instead of a set, and the '
                    + 'mark-on-enqueue argument in its original form' },
    { id: 'hash', why: 'what makes a membership test cheap enough for this to be practical at all' },
    { id: 'setadt', why: 'the operations the crawl actually needs, which are add and contains and '
                       + 'nothing else' },
    { id: 'cycled', why: 'the other digraph traversal here, and why a link cycle is harmless to a '
                       + 'crawl but is the whole question there' }
  ]
};

T.warshall = {
  coreInvariant:
    'After the pass for intermediate vertex `k` finishes, the entry for `s` and `t` is true '
    + 'exactly when a path runs from `s` to `t` whose intermediate vertices all come from the set '
    + 'zero up to `k`. The `k` loop must therefore be OUTERMOST: each pass is allowed to use '
    + 'everything the earlier passes established, which is why one sweep of `k` from zero to '
    + '`V - 1` suffices and no repetition is needed. In this tracer the matrix starts as a COPY of '
    + 'the adjacency matrix, so the relation computed is positive-length reachability and a '
    + 'diagonal entry becomes true only for a vertex that lies on a cycle.',
  mechanism:
    'Copy the adjacency matrix. Then for each `k`, for each `s`, for each `t`: if `s` reaches `k` '
    + 'and `k` reaches `t` in the matrix as it currently stands, set the entry for `s` and `t` '
    + 'true. Each test is asking whether the two halves of a path through `k` are already known, '
    + 'and joining them records the path. Entries are only ever set, never cleared, so the matrix '
    + 'grows monotonically and the result does not depend on the order of `s` and `t` within one '
    + 'pass.',
  criticalInvariants: [
    { rule: '`k` is the OUTER loop.',
      because: 'With `k` inside, a pass over `s` and `t` can use only the intermediates available '
             + 'at that instant, so a path needing two new intermediates in the wrong order is '
             + 'missed and one sweep is not enough. The loop nesting IS the algorithm; the body is '
             + 'three array reads and a write.' },
    { rule: 'The test reads the closure matrix, not the original adjacency matrix.',
      because: 'Reading the original would only ever find paths of length two. Reading the matrix '
             + 'being built is what makes the earlier passes compound, and it is the difference '
             + 'between a closure and a squared matrix.' },
    { rule: 'Entries are only set true, never cleared.',
      because: 'A path, once known to exist, does not stop existing. That monotonicity is also why '
             + 'the two inner loops may run in any order within a single pass without changing the '
             + 'result.' },
    { rule: 'The diagonal is NOT forced true here.',
      because: 'The matrix begins as a copy of the arcs and nothing ever adds a zero-length path, '
             + 'so a diagonal entry becomes true only when some path of length one or more '
             + 'returns to its vertex. On a digraph with no arcs the answer is the all-false '
             + 'matrix, and self-loops — the other way a diagonal entry could start true — are '
             + 'rejected by this tracer input grammar, so a cycle is the only route to one.' }
  ],
  examTraps: [
    { trap: 'Expecting a true diagonal entry for every vertex.',
      instead: 'Under the convention this tracer executes it is true only for a vertex on a cycle. '
             + 'An acyclic chain of three arcs leaves the whole diagonal false, and adding one arc '
             + 'to close the cycle turns on exactly the entries for the vertices in it. The '
             + 'reflexive closure, which forces every diagonal entry true, is a different and '
             + 'equally valid relation; what matters is knowing which of the two you are '
             + 'computing.' },
    { trap: 'Reordering the three loops.',
      instead: '`k` must be outermost. The loops look interchangeable and the code still runs, '
             + 'which makes this the most expensive mistake in the topic: the output is wrong only '
             + 'on digraphs needing two or more chained intermediates, so small examples pass.' },
    { trap: 'Reading a true entry as an arc.',
      instead: 'It says a path exists. The matrix of paths is not the matrix of arcs, and the '
             + 'original adjacency matrix is still the only record of what the arcs were.' },
    { trap: 'Running it on an undirected graph and reading the full diagonal as a defect.',
      instead: 'Every vertex with an edge lies on a two-step round trip there, so every non-'
             + 'isolated vertex earns a true diagonal entry. That is the convention working '
             + 'correctly, not a bug.' }
  ],
  recognition: {
    stateVariables: ['k', 's', 't', 'the closure matrix', 'the cell being set'],
    tell: 'Three nested loops over the same vertex range, with the SAME matrix both read and '
        + 'written, and an outer index that is neither a source nor a destination, is Warshall. A '
        + 'single source with a distance array is a shortest-path algorithm; a queue is '
        + 'breadth-first search.'
  },
  complexity: [
    { case: 'Every case', cost: 'performs `V` cubed tests',
      why: 'The three loops always run to completion. There is no early exit and no dependence on '
         + 'how many arcs the digraph has, so the best and worst cases are identical.' },
    { case: 'Writes', cost: 'at most `V` squared cells are ever set true',
      why: 'Each cell can change only once, from false to true, so the work is dominated by the '
         + 'tests rather than by the updates.' },
    { case: 'Space', cost: 'one `V` by `V` matrix beyond the input, so `V` squared entries',
      why: 'The closure is a relation on pairs, so there is nowhere cheaper to put it when every '
         + 'pair may need an answer.' },
    { case: 'Against one traversal per vertex',
      cost: '`V` traversals over adjacency lists cost `V` times `(V + E)`',
      why: 'On a sparse digraph that is cheaper, because it tracks the arcs that exist. The cubic '
         + 'cost here is insensitive to density, which makes this the better choice only when the '
         + 'digraph is dense or the matrix is the representation already in hand.' }
  ],
  convention: 'warshallDiagonal',
  whatToDraw: {
    unit: 'one row = one pair of tests for a fixed k, s and t',
    columns: ['k', 's', 't', 's reaches k', 'k reaches t', 'cell set']
  },
  seeAlso: [
    { id: 'cycled', why: 'the yes-or-no version of what a true diagonal entry is telling you' },
    { id: 'bfs', why: 'reachability from one source, which is the cheaper route on a sparse '
                    + 'digraph and the comparison that justifies the cubic cost' },
    { id: 'graphweighted', why: 'where the directed adjacency matrix this reads comes from, and why '
                              + 'it is not symmetric' }
  ]
};

/* ------------------------------------------------------------------ *
 * Shortest paths and minimum spanning trees.                          *
 * ------------------------------------------------------------------ */

T.dijkstra = {
  coreInvariant:
    'When the vertex with the smallest tentative distance in the unsettled set is removed, that '
    + 'distance is already final. The argument is short: any other route to it must leave the '
    + 'settled region through some vertex that is still unsettled, and no such route can be '
    + 'cheaper because every unsettled vertex already carries a tentative distance at least as '
    + 'large and the travel beyond it adds a non-negative amount. That single step — minimum '
    + 'tentative distance means settled '
    + '— is the whole correctness proof, and it is precisely the step that negative weights break.',
  mechanism:
    'Distances start at infinity everywhere except the source, which starts at zero; parents start '
    + 'at `-1`; the unsettled set holds every vertex. Each round scans that set for the vertex of '
    + 'minimum distance, removes it, and relaxes each of its edges: if going through it beats the '
    + 'target current distance, lower the distance and record it as the parent. The loop runs '
    + 'until the set is empty. An unreachable vertex is eventually chosen with its distance still '
    + 'infinite, and adding a weight to infinity never improves anything, so it relaxes nothing. '
    + 'The path to a chosen destination is then read backwards through the parents.',
  criticalInvariants: [
    { rule: 'Relaxation is a strict improvement and only ever LOWERS a distance.',
      because: 'Each distance is a tentative upper bound on the true distance at all times. '
             + 'Allowing an equal-cost write changes no distance but silently changes which parent '
             + 'survives, and allowing an increase destroys the bound and the settled argument '
             + 'built on it.' },
    { rule: 'A vertex is settled when it is removed and is never reconsidered.',
      because: 'That is the invariant doing the work. If a later relaxation could still lower a '
             + 'removed vertex distance, every removal would have to be undone — which is exactly '
             + 'what a negative edge causes, and the algorithm has no mechanism for it.' },
    { rule: 'Weights must be non-negative.',
      because: 'The settled argument assumes that travelling further cannot reduce a total. A '
             + 'negative edge leaving an unsettled vertex can make a longer-looking route cheaper, '
             + 'so a vertex settled early can turn out wrong while the search has already moved '
             + 'on. This tracer rejects a negative weight at the input rather than printing a '
             + 'plausible wrong answer.' },
    { rule: 'The source is identified by its distance of zero, not by its parent entry.',
      because: 'Here the source keeps a parent of `-1`, which otherwise means unreached. That is '
             + 'why the reconstruction tests whether the destination IS the source before it tests '
             + 'the parent entry; reversing the two tests reports the source as unreachable from '
             + 'itself.' }
  ],
  examTraps: [
    { trap: 'Reading a vertex distance as final before it has been removed from the unsettled set.',
      instead: 'It is an upper bound until then and can be lowered by a later relaxation. Only '
             + 'removal settles it, which is why the removal step is worth marking in a trace.' },
    { trap: 'Applying the algorithm to negative weights because it usually works.',
      instead: 'It can report a wrong distance with no sign of trouble, and re-running does not '
             + 'help. A graph with negative edges needs a different algorithm entirely.' },
    { trap: 'Reading a parent of `-1` as unreachable without first checking for the source.',
      instead: 'The source parent entry is `-1` too. The ORDER of the two tests is the only thing '
             + 'keeping the two meanings apart.' },
    { trap: 'Expecting the shortest path to be unique.',
      instead: 'The parent array holds whichever relaxation last improved the distance, so '
             + 'equal-cost routes are resolved by edge order. The COST is determined; the vertex '
             + 'sequence is one of possibly several.' }
  ],
  recognition: {
    stateVariables: ['dist', 'pred', 'the unsettled set', 'v', 'the edge weight'],
    tell: 'A distance array of running totals, a set of unsettled vertices and a minimum selection '
        + 'each round is this algorithm. A predecessor array with a queue and no distances is '
        + 'breadth-first search, which is the same algorithm when every weight is equal. A sorted '
        + 'edge list with no source at all is a spanning-tree algorithm, which optimises something '
        + 'else.'
  },
  complexity: [
    { case: 'As traced here, with a linear scan and an adjacency matrix', cost: '`O(V^2)`',
      why: 'Finding the minimum scans the unsettled set once per round, which is about `V` work in '
         + 'each of `V` rounds, and the relaxation pass scans a matrix row of `V` entries per '
         + 'round as well.' },
    { case: 'With a priority queue and adjacency lists', cost: '`O((V + E) log V)`',
      why: 'There are `V` removals and up to `E` distance improvements, each costing about `log V` '
         + 'in the queue. The queue is replacing the linear minimum scan and nothing else.' },
    { case: 'Space', cost: 'two arrays of `V` entries plus the unsettled set, `O(V)`',
      why: 'Nothing is stored per edge — an edge is relaxed and then forgotten — so memory tracks '
         + 'the vertex count rather than the density.' },
    { case: 'Reconstruction', cost: 'at most `V - 1` parent steps and no edge reads',
      why: 'Each step moves to a vertex strictly closer to the source, so the walk cannot revisit '
         + 'and must terminate.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one vertex settled or one edge relaxed',
    columns: ['vertex settled', 'edge and weight', 'dist[v] + weight', 'dist[w] before and after',
              'pred[w]', 'unsettled set']
  },
  seeAlso: [
    { id: 'bfs', why: 'the unweighted special case, and why a plain queue is enough once every '
                    + 'weight is equal' },
    { id: 'bfspath', why: 'the same backwards walk over a parent array, without the source-versus-'
                        + 'unreachable complication' },
    { id: 'prim', why: 'the identical frontier shape choosing on edge weight instead of '
                     + 'accumulated distance, which is the distinction worth being able to state' },
    { id: 'pq', why: 'the structure that replaces the linear minimum scan and sets the better '
                   + 'bound' }
  ]
};

T.kruskal = {
  coreInvariant:
    'An edge is safe to add exactly when its two endpoints are not already connected by the edges '
    + 'chosen so far, because an edge between two already-connected vertices closes a cycle and '
    + 'cannot reduce the total. Taking the edges in ascending weight order and applying that one '
    + 'test is enough: at every moment the chosen set is a subset of some minimum spanning tree, '
    + 'so once it reaches `V - 1` edges it IS one. Nothing in the argument assumes the graph is '
    + 'connected, which is why this algorithm still returns something meaningful when it is not.',
  mechanism:
    'Start with the `V` vertices and no edges, and sort every edge by weight. Take each edge in '
    + 'turn, test whether a path already joins its endpoints within the chosen set — this tracer '
    + 'answers that by searching the partial forest — and add the edge if there is none. Stop as '
    + 'soon as `V - 1` edges have been chosen. If the edge list runs out first then the graph is '
    + 'disconnected and no spanning tree exists; what has been built is a minimum spanning FOREST '
    + 'of EVERY component, because the scan considers edges everywhere in the graph rather than '
    + 'only those near some starting point.',
  criticalInvariants: [
    { rule: 'The edges are considered in ascending weight order.',
      because: 'The safety test on its own produces a spanning tree, not a MINIMUM one. The order '
             + 'is what makes each chosen edge the cheapest one that could still be chosen, and '
             + 'it is the only place the weights influence the result at all.' },
    { rule: 'The connectivity test is against the chosen edges, not against the input graph.',
      because: 'In the input graph the two endpoints are almost always connected — that is why the '
             + 'edge is there. The question is whether the edges chosen SO FAR already join them, '
             + 'and mixing the two up accepts no edges at all after the first.' },
    { rule: 'The stop test is `V - 1` edges, and it has to be able to pass before any edge is '
          + 'considered.',
      because: 'A spanning tree of `V` vertices has exactly `V - 1` edges, so a single vertex is '
             + 'already spanned by none. Testing only after an edge is added reports a one-vertex '
             + 'graph as having no spanning tree, which is wrong.' },
    { rule: 'Running out of edges is a statement about the GRAPH, not a failure.',
      because: 'It means the graph is disconnected and no spanning tree exists. The chosen edges '
             + 'are then a minimum spanning forest of `V - C` edges, and reporting it as a tree '
             + 'would claim a connectivity the graph does not have.' }
  ],
  examTraps: [
    { trap: 'Expecting the chosen edges to form a connected piece while the algorithm runs.',
      instead: 'It builds a forest that only becomes a tree at the very last edge. Several '
             + 'separate fragments growing at once is normal here, and is exactly how it differs '
             + 'from growing one tree from a start vertex.' },
    { trap: 'Reporting the result as a minimum spanning tree when the graph is disconnected.',
      instead: 'Say which it is. `V - 1` edges were not reached, so no spanning tree exists, and '
             + 'the edges chosen are a minimum spanning forest of the whole graph.' },
    { trap: 'Assuming negative weights are a problem.',
      instead: 'A minimum spanning tree is well defined for negative weights and this tracer '
             + 'accepts them. It is the shortest-path algorithm, not this one, whose correctness '
             + 'argument needs non-negative edges.' },
    { trap: 'Breaking ties as though the answer were unique.',
      instead: 'Equal weights may be taken in either order and can produce different trees. The '
             + 'TOTAL is determined; the particular edge set is not unless all the weights '
             + 'differ.' }
  ],
  recognition: {
    stateVariables: ['the sorted edge list', 'the chosen edge set', 'the edge under consideration',
                     'chosen count against V - 1'],
    tell: 'A globally sorted edge list consumed in order, with a connectivity test per edge, is '
        + 'this algorithm. A set of included VERTICES that grows one at a time from a start vertex '
        + 'is the other spanning-tree algorithm. A distance array and a source vertex is a '
        + 'shortest-path algorithm, which optimises paths rather than a tree.'
  },
  complexity: [
    { case: 'Sorting', cost: 'makes about `E log E` comparisons',
      why: 'Every edge has to be ordered before the scan starts, and on a sparse graph this is the '
         + 'dominant term of the whole algorithm.' },
    { case: 'The scan', cost: 'considers each of the `E` edges at most once',
      why: 'There is no backtracking: an edge rejected for closing a cycle is never reconsidered, '
         + 'because the chosen set only grows.' },
    { case: 'The connectivity test, as traced here',
      cost: 'searches the partial forest, up to `V` work per edge',
      why: 'The test is a reachability question inside the chosen edges, and this tracer answers it '
         + 'by walking them.' },
    { case: 'The connectivity test with a union-find structure',
      cost: 'almost constant per edge, which is why the whole algorithm is usually quoted as '
          + '`E log E`',
      why: 'Once the test is cheap, the sort is the only expensive part left.' },
    { case: 'Early stop', cost: 'the loop ends at `V - 1` edges',
      why: 'On a dense connected graph most of the sorted list is never examined — but it was all '
         + 'sorted first, so the sort cost is paid in full regardless.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one edge considered',
    columns: ['edge and weight', 'endpoints already connected?', 'added?',
              'chosen count against V - 1', 'running total']
  },
  seeAlso: [
    { id: 'prim', why: 'the same objective reached by growing one tree, and the one that behaves '
                     + 'differently on a disconnected graph' },
    { id: 'graphedges', why: 'the representation this algorithm actually wants, since it sorts the '
                           + 'whole edge list and never asks about a named pair' },
    { id: 'ms', why: 'the kind of sort that dominates the cost, and what its guarantees are' },
    { id: 'components', why: 'what a spanning forest is, and why `V - C` is the edge count to '
                           + 'expect when the graph is disconnected' }
  ]
};

T.prim = {
  coreInvariant:
    'The chosen vertices always form a SINGLE connected tree, and the cheapest edge leaving that '
    + 'tree is always safe to add — because any spanning tree must cross from the chosen side to '
    + 'the unchosen side somewhere, and swapping its crossing edge for the cheapest one cannot '
    + 'increase the total. So the tree grows by exactly one vertex per round and is a minimum '
    + 'spanning tree of the vertices it holds at every moment. Because growth only ever happens '
    + 'across that frontier, the algorithm can reach nothing outside the START vertex component.',
  mechanism:
    'The chosen set begins as the start vertex alone — this tracer fixes it at vertex zero — and '
    + 'the candidate set as every edge. Each round scans the candidates for the cheapest edge with '
    + 'exactly ONE endpoint already chosen, adds it to the tree, adds its outside endpoint to the '
    + 'chosen set, and removes it from the candidates. The loop runs while fewer than `V` vertices '
    + 'are chosen. If no crossing edge exists the graph is disconnected and the loop stops: what '
    + 'has been built is a minimum spanning tree of the start vertex component ONLY, and the other '
    + 'components are never touched.',
  criticalInvariants: [
    { rule: 'The chosen edge must have exactly one endpoint inside the chosen set.',
      because: 'Both endpoints inside closes a cycle, and both outside attaches a piece that is '
             + 'not joined to the tree. Neither keeps the chosen set a single tree, which is the '
             + 'invariant the whole safety argument rests on.' },
    { rule: 'It is the cheapest CROSSING edge, not the cheapest remaining edge.',
      because: 'The global minimum can sit entirely outside the chosen set and must wait its turn. '
             + 'Taking it anyway is the point at which a trace of this algorithm quietly becomes a '
             + 'trace of the other one.' },
    { rule: 'The chosen set grows by exactly one vertex per round, so the loop runs `V - 1` times '
          + 'on a connected graph.',
      because: 'The added edge has exactly one outside endpoint, so one new vertex enters each '
             + 'round and the edge count and vertex count stay in step. That is why the finished '
             + 'tree has `V - 1` edges without the count ever being checked.' },
    { rule: 'A missing crossing edge is a statement about the graph.',
      because: 'It means no edge joins the chosen set to anything outside it, so the start vertex '
             + 'component has been exhausted. The remaining vertices are unreachable and no amount '
             + 'of further scanning will find them.' }
  ],
  examTraps: [
    { trap: 'Expecting this and the sorted-edge-list algorithm to agree edge by edge.',
      instead: 'They agree on the TOTAL on a connected graph, and on the edges too when all the '
             + 'weights differ. With ties they can choose differently, and on a disconnected graph '
             + 'they do not even cover the same vertices.' },
    { trap: 'Expecting a spanning forest out of a disconnected graph.',
      instead: 'This algorithm stops at the edge of the start vertex component and never looks at '
             + 'the rest; a six-vertex graph of two triangles ends with three vertices used and '
             + 'two edges chosen. The sorted-edge-list algorithm, scanning globally, is the one '
             + 'that produces the forest of every component. That difference is the thing to '
             + 'remember about the pair.' },
    { trap: 'Taking the cheapest unused edge each round.',
      instead: 'Only edges crossing the frontier are candidates. This is the commonest way a hand '
             + 'trace of this algorithm turns into a hand trace of the other.' },
    { trap: 'Assuming the start vertex cannot matter.',
      instead: 'On a connected graph any start gives a minimum spanning tree and the totals agree. '
             + 'On a disconnected graph the start decides WHICH component you get, which is why '
             + 'the fixed start at vertex zero matters there — an isolated vertex zero yields no '
             + 'edges at all.' }
  ],
  recognition: {
    stateVariables: ['the chosen vertex set', 'the candidate edge set', 'the chosen edge and its weight',
                     'the growing tree'],
    tell: 'A set of included vertices that grows one at a time, with candidates limited to the '
        + 'edges leaving it, is this algorithm. A globally sorted edge list with a connectivity '
        + 'test per edge is the other one. The same frontier scan keyed on ACCUMULATED distance '
        + 'from a source rather than on edge weight is the shortest-path algorithm, which '
        + 'optimises paths rather than a tree.'
  },
  complexity: [
    { case: 'As traced here', cost: 'performs about `V` times `E` edge tests',
      why: 'Each of the `V - 1` rounds scans every remaining candidate edge looking for the '
         + 'cheapest crossing one, and nothing is carried over between rounds.' },
    { case: 'With a priority queue over the cheapest known edge to each outside vertex',
      cost: '`O(E log V)`',
      why: 'There are `V` removals and up to `E` updates, each about `log V`, which replaces the '
         + 'repeated full scan with a single ordered structure.' },
    { case: 'With an adjacency matrix and a per-vertex best-edge array', cost: '`O(V^2)`',
      why: 'Scanning `V` unchosen vertices in each of `V` rounds beats the queue on a dense graph, '
         + 'where `E` is close to `V` squared anyway.' },
    { case: 'Space', cost: 'one membership flag per vertex plus the candidate set, `O(V)` beyond '
          + 'the graph',
      why: 'The chosen set is the only state that has to persist between rounds; the tree itself is '
         + 'output rather than working memory.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one edge chosen',
    columns: ['chosen vertex set', 'crossing candidates', 'cheapest crossing edge', 'vertex added',
              'running total']
  },
  seeAlso: [
    { id: 'kruskal', why: 'the same objective by a global edge order, and the one that handles a '
                        + 'disconnected graph differently' },
    { id: 'dijkstra', why: 'the identical frontier shape with a different key, which is the '
                         + 'distinction most worth being able to state out loud' },
    { id: 'pq', why: 'what replaces the linear scan for the cheapest crossing edge, and the bound '
                   + 'it buys' },
    { id: 'graphweighted', why: 'where the weights are stored, and what it costs to read one' }
  ]
};

window.COMP2521RegisterTheory('graphs', T);
})();
