/* corpus-theory-foundations.js — theory entries for the foundations area.
 *
 * SOURCE LABEL: TRACER-AUTHORED EXPLANATION. See the header of
 * corpus-theory.js for the schema, the provenance rule and the conventions
 * table. Entries are plain text; `backticks` become code spans and the panel
 * escapes everything else.
 *
 * SCOPE: the course map and named-only boundary, the four recursion topics,
 * algorithm analysis, both searches, and the sorting group except `qs`, which
 * is one of the worked exemplars in corpus-theory.js and is registered there.
 *
 * Every count quoted below was read off this tracer's own frames, on the input
 * named beside it, before the sentence was written. Where the figure belongs to
 * one of the three six-item presets it is stated as such and is not generalised
 * into an asymptotic claim.
 */
(function () {
'use strict';
const T = {};

/* ================================================================== *
 * COURSE MAP AND SOURCE BOUNDARY                                      *
 * ================================================================== */

T.coursemap = {
  /* The one entry carrying the cross-topic tracing layer, beside the full
     conventions table. Both belong on the map rather than on any one topic. */
  tracingTechnique: true,
  coreInvariant:
    'The map is a CLOSED SET over the material this tool was built from: every row names a '
    + 'syllabus item, the mode it is delivered in, and the module that delivers it, and no row '
    + 'exists for anything the sources do not cover. The three modes are claims about the SOURCE, '
    + 'not about importance — "core" means a procedure was available and an interactive trace was '
    + 'built, "reference" means the content is represented without an implementation being '
    + 'invented, "named" means the item is indexed by name because inventing a procedure for it '
    + 'would have been fabrication. That is why the boundary can be trusted: a topic is never '
    + 'promoted past what its source supports, so an absent trace means absent source rather '
    + 'than absent effort.',
  mechanism:
    'One reference frame, filtered by the `scope` control. The counts in the state panel are the '
    + 'whole inventory split by mode: 181 items, of which 148 are core, 24 reference and 9 named. '
    + 'The rows carry the course area, the item with its delivery mode in brackets, the mode, the '
    + 'destination module id and the source family, so a row can be followed to the module that '
    + 'answers it. Filtering changes which rows are listed and nothing else — the counts are over '
    + 'the full set either way.',
  criticalInvariants: [
    { rule: 'The mode describes the source, not the difficulty or the importance of the topic.',
      because: 'A "named" item can be examinable and a "core" item can be trivial. Reading the '
             + 'column as a priority ranking leads to skipping exactly the topics whose source '
             + 'was too thin to trace, which is where the gaps in your own notes will be too.' },
    { rule: 'The destination column must resolve to a module that actually exists.',
      because: 'A promise with no destination is worse than an admitted gap: it reads as covered '
             + 'and is never looked for again. The coverage column is what makes the claim '
             + 'checkable rather than decorative.' },
    { rule: 'A named-only item stays listed rather than being deleted.',
      because: 'Deleting it would make the index look complete while quietly shrinking the '
             + 'syllabus. Keeping the name with an honest status is the only version of the index '
             + 'that tells you what you still have to find elsewhere.' }
  ],
  examTraps: [
    { trap: 'Treating the map as a statement about what matters.',
      instead: 'It is a statement about what this tool can execute. Use it to find the trace for '
             + 'a topic, and use your own course material to decide what to study.' },
    { trap: 'Assuming a "reference" row has no content behind it.',
      instead: 'Reference rows carry explanation, tables and worked structure — what they lack is '
             + 'a step-by-step execution, because no procedure was available to execute.' },
    { trap: 'Reading the conventions as disagreements to be resolved.',
      instead: 'A convention changes a stated index, height or intermediate array and never '
             + 'changes a decision. Check which kind of difference you are looking at before '
             + 'assuming one of the two sources is wrong.' }
  ],
  recognition: {
    stateVariables: ['topics', 'core', 'reference', 'named'],
    tell: 'A single frame carrying four totals and no array, pointer or index is a reference '
        + 'index rather than a trace. If the state panel changes as you step, you are in an '
        + 'algorithm module; if there is only one frame, the content is in the view, not in the '
        + 'sequence.'
  },
  complexity: [
    { case: 'Building the index', cost: 'one frame regardless of the filter',
      why: 'The rows are a fixed table derived from the capability register, so no work is done '
         + 'per item and stepping has nothing to advance through.' },
    { case: 'Finding a topic', cost: 'one filter choice plus a scan of the rows it leaves',
      why: 'The destination column holds the module id, so the lookup is a single read rather '
         + 'than a search through the pages.' },
    { case: 'What the split tells you', cost: '148 core, 24 reference and 9 named of 181 items',
      why: 'The ratio is the honest measure of how much of the syllabus could be turned into an '
         + 'executable trace from the sources available.' }
  ],
  convention: null,
  allConventions: true,
  whatToDraw: {
    unit: 'one row = one syllabus item',
    columns: ['course area', 'syllabus item', 'mode', 'destination module', 'source family']
  },
  seeAlso: [
    { id: 'namedalgos', why: 'the other half of the boundary: the items that are named and '
                           + 'deliberately not traced, and why no code was invented for them' },
    { id: 'analysis', why: 'the one topic every other row depends on, since every cost claim in '
                         + 'the map is an asymptotic one' },
    { id: 'sortprops', why: 'the comparison matrix the sorting rows all point at, which is where '
                          + 'the properties behind those rows are stated' }
  ]
};

T.namedalgos = {
  coreInvariant:
    'A trace can only be as faithful as the procedure it was built from, so a topic whose source '
    + 'supplies a NAME but no procedure gets its name recorded and no executable module. The '
    + 'reason is not modesty: a plausible invented implementation would be indistinguishable from '
    + 'a faithful one in the trace, which would make every parity claim this tool makes '
    + 'unfalsifiable. Admitting the gap therefore keeps the rest of the register checkable, which '
    + 'is worth more than an extra module that nobody can verify.',
  mechanism:
    'One reference frame. A status table splits the named items into four honest kinds: '
    + 'contextual (explained in prose, no code), named-only (Shell sort, key-indexed counting '
    + 'sort, Kosaraju, Tarjan), curiosity (Floyd-Warshall, Bellman-Ford, Boruvka, '
    + 'Karger-Klein-Tarjan) and bonus or tractability context (longest path, largest clique, '
    + 'three-colourability, graph isomorphism, Python dictionaries). One item is explained in '
    + 'full as a concept rather than as code: union-find, the structure that replaces the '
    + 'connectivity search inside Kruskal.',
  criticalInvariants: [
    { rule: 'A named item is never promoted to an executable module without a procedure to '
          + 'execute.',
      because: 'The alternative is a trace that looks authoritative and is actually a guess. '
             + 'Nothing in the display distinguishes the two, so the only safe rule is not to '
             + 'produce one at all.' },
    { rule: 'The union-find explanation is conceptual and is labelled as such.',
      because: 'It describes what the structure does to Kruskal\'s connectivity test, which is '
             + 'checkable against the traced Kruskal, without implying that any particular '
             + 'implementation of `find` and `union` is the one being taught.' },
    { rule: 'Union-find changes the COST of the connectivity test and not the edges Kruskal '
          + 'selects.',
      because: 'Kruskal accepts an edge exactly when its endpoints are not already connected. '
             + 'Replacing a graph search with `find(v) == find(w)` answers the same question '
             + 'faster, so the tree built is the same tree.' }
  ],
  examTraps: [
    { trap: 'Reading "named only" as "nothing to know here".',
      instead: 'It means the procedure was not available to this tool. Find it in your own '
             + 'material; the name is listed precisely so you know to go looking.' },
    { trap: 'Expecting the union-find explanation to come with a traceable implementation.',
      instead: 'Trace Kruskal instead and watch the connectivity test it actually performs — a '
             + 'search of the partial tree per candidate edge. That search is what union-find '
             + 'replaces, and seeing its cost is the point.' },
    { trap: 'Assuming path compression or union by rank changes the answer.',
      instead: 'Both change only how quickly a representative is found. The partition of vertices '
             + 'into connected sets, and therefore every accept-or-reject decision, is identical.' }
  ],
  recognition: {
    stateVariables: ['Item', 'Status'],
    tell: 'This module carries no trace variables at all — a single frame, an empty state panel '
        + 'and a status table. That emptiness is itself the signal: a module with nothing to step '
        + 'through is a boundary statement, not an algorithm, and the content is in the table '
        + 'rather than in the sequence.'
  },
  complexity: [
    { case: 'Kruskal\'s connectivity test as traced',
      cost: 'one search of the partial tree per candidate edge',
      why: 'The traced version looks for a path between the endpoints in the partial tree, so '
         + 'each of the E candidate edges pays a graph search.' },
    { case: 'The same test with union-find',
      cost: 'two `find` operations per edge, each effectively constant',
      why: 'With union by size and path compression the amortised cost per operation is bounded '
         + 'by the inverse Ackermann function, which is at most 4 for any size you will meet.' },
    { case: 'What is then the dominant cost', cost: 'sorting the edges, about `E log E`',
      why: 'Once the connectivity test is near-constant, the edge sort is the only superlinear '
         + 'step left, so optimising the test further buys nothing.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one named item',
    columns: ['item', 'status', 'what would be needed before it could be traced']
  },
  seeAlso: [
    { id: 'kruskal', why: 'the per-edge connectivity search that union-find exists to replace, '
                        + 'visible step by step' },
    { id: 'coursemap', why: 'the full index these named items sit inside, with the mode and '
                          + 'destination for every other topic' },
    { id: 'sortprops', why: 'where Shell sort and key-indexed counting sort appear in the '
                          + 'comparison matrix as names without implementations' }
  ]
};

/* ================================================================== *
 * RECURSION                                                           *
 * ================================================================== */

T.recpyramid = {
  coreInvariant:
    'Each call builds its OWN layer and then hands a strictly smaller problem to the next call, '
    + 'assuming that call builds the smaller pyramid correctly. The width falls by 2 every call '
    + 'and the base test catches every width at or below zero, so the sequence of widths is '
    + 'bounded below and the recursion must terminate — which is what licenses the assumption. '
    + 'Because the layer is built BEFORE the recursive call, the layers come out largest first; '
    + 'that ordering is a consequence of where the work sits, not of anything about pyramids.',
  mechanism:
    'Pre-order recursion over one shrinking integer. The frame for width n is pushed, the base '
    + 'test runs, the n by n layer is built, then the call for width n - 2 is made; only after it '
    + 'returns does this frame unwind. Nothing is computed on the way out, so the unwinding '
    + 'frames carry no result. Every frame is automatic stack storage, which is why the heap '
    + 'ledger stays empty for the whole trace.',
  criticalInvariants: [
    { rule: 'The base case is "width at or below zero", not "width equals zero".',
      because: 'The step is 2, so an odd starting width never lands on 0 — a width of 7 descends '
             + '7, 5, 3, 1, -1 and a width of 1 goes straight to -1. A test for equality with '
             + 'zero would be skipped past and the recursion would run forever on every odd '
             + 'input.' },
    { rule: 'The layer is built before the recursive call, not after it.',
      because: 'Moving it after the call produces the same set of layers in the opposite order. '
             + 'Where the work sits relative to the call is the entire difference between a '
             + 'pre-order and a post-order recursion.' },
    { rule: 'The recursive call must receive a strictly smaller argument.',
      because: 'Subtracting 2 guarantees it. Passing n, or n - 0 in some branch, gives a '
             + 'subproblem no smaller than its parent, and the base case is then unreachable no '
             + 'matter how it is written.' }
  ],
  examTraps: [
    { trap: 'Expecting the deepest call to do the most work.',
      instead: 'The deepest call is the base case and builds nothing at all. In a pre-order '
             + 'recursion the work is front-loaded: the first call builds the largest layer.' },
    { trap: 'Expecting the recursion depth to be the starting width.',
      instead: 'The step is 2, so the depth is about half the width plus one frame for the base '
             + 'case. A width of 7 reaches depth 5.' },
    { trap: 'Counting the frames and the layers as the same number.',
      instead: 'A width of 7 builds 4 layers — 7, 5, 3 and 1 — but opens 5 frames, because the '
             + 'base-case frame builds nothing. The two counts differ by exactly one.' }
  ],
  recognition: {
    stateVariables: ['n', 'depth', 'width', 'layer blocks'],
    tell: 'One integer argument shrinking by a fixed step, with the visible work happening before '
        + 'the recursive call and nothing computed during unwinding, is pre-order recursion. If '
        + 'instead a value is combined with the returned result on the way out, the recursion is '
        + 'post-order, as in factorial or a linked-list sum.'
  },
  complexity: [
    { case: 'Calls', cost: 'about n / 2 calls plus one for the base case',
      why: 'Each call reduces the width by 2, so the number of calls is set by how many times 2 '
         + 'divides into the starting width.' },
    { case: 'Work', cost: 'the sum of the squares of the descending widths',
      why: 'Each call builds one square layer, so a width of 7 totals 49 + 25 + 9 + 1 = 84 '
         + 'blocks — the trace reports exactly that.' },
    { case: 'Space', cost: 'stack depth about n / 2 + 1, and no heap at all',
      why: 'One automatic frame per active call, released on return; nothing is allocated with '
         + '`malloc`, so the heap ledger stays empty.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one call or one return',
    columns: ['width n', 'depth', 'base test result', 'layer built', 'frames live']
  },
  seeAlso: [
    { id: 'recfactorial', why: 'the same stack discipline with the work moved after the call, so '
                             + 'the arithmetic runs in reverse order of the calls' },
    { id: 'reclistsum', why: 'post-order recursion over a pointer rather than an integer, which '
                           + 'is the other shape you have to recognise' },
    { id: 'analysis', why: 'where the per-call stack cost of a recursion is counted alongside its '
                         + 'time' }
  ]
};

T.recfactorial = {
  coreInvariant:
    'The function is correct for n if it is correct for n - 1, and the base case is correct with '
    + 'no assumption at all: `factorial(0)` returns 1 outright. Because the argument falls by 1 '
    + 'each call it must reach 0, so that chain of assumptions is grounded rather than circular. '
    + 'The multiplication cannot happen until the call beneath it has returned, which is why the '
    + 'arithmetic runs in exactly the reverse order of the calls — the calls wind down carrying '
    + 'nothing, and every product is formed on the way back out.',
  mechanism:
    'One frame per active call. On the way in each frame only tests `n == 0` and makes the next '
    + 'call; on the way out each frame multiplies its own n by the value returned from below and '
    + 'returns the product. For n = 5 the deepest point has SIX live frames — 5, 4, 3, 2, 1 and '
    + 'the 0 base case — and five multiplications happen during unwinding, giving 120. Frames are '
    + 'automatic storage released on return, not `malloc` allocations, so the heap ledger stays '
    + 'empty throughout.',
  criticalInvariants: [
    { rule: 'The base case is tested before the recursive call is made.',
      because: 'Written the other way round the call happens unconditionally, so there is no n at '
             + 'which the descent stops and the stack grows until it runs out. Implementing the '
             + 'base case first is a sequencing rule, not a stylistic one.' },
    { rule: 'The step must move the argument toward the base case.',
      because: 'With a base test of `n == 0` and a step of 1, a negative argument steps away from '
             + 'zero forever. That is why this trace accepts only non-negative n: the displayed '
             + 'function has no guard of its own.' },
    { rule: 'The returned value must be used, not just produced.',
      because: 'The product is `n * factorial(n - 1)`. A frame that ignores the return value and '
             + 'returns its own n gives a plausible-looking number for small inputs and the wrong '
             + 'answer everywhere else.' }
  ],
  examTraps: [
    { trap: 'Counting stack frames and multiplications as the same number.',
      instead: 'For n = 5 there are six frames at peak and five multiplications. The base-case '
             + 'frame does no arithmetic, so the two counts always differ by one.' },
    { trap: 'Expecting the base case to return 0.',
      instead: 'It returns 1. Zero would propagate through every multiplication and make the '
             + 'whole result zero — the identity for multiplication is 1, not 0.' },
    { trap: 'Treating recursion as free of memory cost because nothing is allocated.',
      instead: 'Each active call holds an automatic frame, so the peak memory grows with n. It is '
             + 'not heap memory and will not show in an allocation ledger, but it is the reason a '
             + 'deep recursion can fail where a loop would not.' }
  ],
  recognition: {
    stateVariables: ['n', 'depth', 'return', 'factorial(n - 1)', 'result'],
    tell: 'A depth that rises to a peak and then falls, with a `return` value that only becomes '
        + 'meaningful during the fall, is post-order linear recursion. Work visible before the '
        + 'call and nothing computed on the way out is pre-order, as in the pyramid; two '
        + 'recursive calls per frame would be a divide-and-conquer shape instead.'
  },
  complexity: [
    { case: 'Time', cost: 'n + 1 calls and n multiplications, so `O(n)`',
      why: 'One call per value from n down to 0, and one multiplication per recursive transition '
         + 'rather than per call.' },
    { case: 'Space', cost: 'stack depth n + 1, so `O(n)` automatic storage',
      why: 'Every frame stays live until the one beneath it returns, so the whole chain coexists '
         + 'at the deepest point.' },
    { case: 'The iterative form', cost: 'the same n multiplications in `O(1)` space',
      why: 'A loop keeps one running product and needs no frame per value, which is the only '
         + 'thing the recursion is paying for here.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one call or one return',
    columns: ['n', 'depth', 'phase (winding or unwinding)', 'value returned from below',
              'product returned']
  },
  seeAlso: [
    { id: 'recpyramid', why: 'the same call stack with the work before the call instead of after '
                           + 'it, which reverses the order the work appears in' },
    { id: 'reclistsum', why: 'the identical post-order shape over a pointer chain, where the base '
                           + 'case is NULL rather than zero' },
    { id: 'stack', why: 'the explicit LIFO structure that the call stack is doing implicitly here' }
  ]
};

T.reclistsum = {
  coreInvariant:
    'The sum of a list is its head value plus the sum of its tail, and the empty list sums to 0. '
    + 'The tail is a strictly shorter list and `next` eventually reaches NULL in a finite acyclic '
    + 'chain, so the recursion terminates and each frame may safely assume the call below it '
    + 'returned the correct suffix sum — which is what makes ONE addition per frame enough, '
    + 'because no frame ever needs to know anything about the nodes beyond its own successor.',
  mechanism:
    'Recursion on `list->next`. The frames wind all the way to NULL carrying only a pointer and '
    + 'computing nothing; the NULL frame returns 0; then each frame on the way out adds its own '
    + '`list->value` to the suffix sum returned from below. On the list 3, 1, 4 the unwinding '
    + 'frames therefore report 0, then 4, then 5, then 8 — the suffix sums, tail first. No node '
    + 'is allocated or freed and no `next` pointer is written: the list is caller-owned and the '
    + 'function only reads it.',
  criticalInvariants: [
    { rule: 'The NULL test comes before any dereference of `list`.',
      because: 'Reading `list->value` when `list` is NULL is undefined behaviour — a crash rather '
             + 'than a wrong total. The ordering of the test and the dereference is the whole '
             + 'safety argument for a pointer recursion.' },
    { rule: 'The result of the recursive call must be combined with this frame\'s own value.',
      because: 'Returning `list->value` alone gives the head value, and returning only the '
             + 'recursive result gives the sum of everything except the head. Both are wrong and '
             + 'both look plausible on a one-element list.' },
    { rule: 'The recursion must advance along `next` and the chain must be acyclic.',
      because: 'A cycle has no NULL, so the base case is never reached and the stack grows until '
             + 'it runs out. The termination argument rests on the list being finite, not on the '
             + 'code.' }
  ],
  examTraps: [
    { trap: 'Expecting the additions to run from the head of the list forwards.',
      instead: 'They run tail-first. The head\'s addition is the LAST one performed, because it '
             + 'needs the result of everything behind it.' },
    { trap: 'Expecting the empty-list case to return the head value.',
      instead: 'There is no head to return. It returns 0, the identity for addition, which is '
             + 'what lets the sum of a one-element list come out as that element.' },
    { trap: 'Assuming the function changes the list because it recurses through it.',
      instead: 'It performs no write at all. Trace the append instead if you want to see a '
             + 'recursion that rewires pointers — the two look nearly identical and differ in '
             + 'exactly that.' }
  ],
  recognition: {
    stateVariables: ['index', 'list', 'list->value', 'listSum(list->next)', 'return', 'result'],
    tell: 'A pointer argument replaced by `list->next` on each call, with an arithmetic '
        + 'combination of the returned value on the way out, is post-order list recursion. If a '
        + 'frame instead ASSIGNS the returned pointer back into its own `next` field, you are '
        + 'looking at the append, which rewires the chain rather than reading it.'
  },
  complexity: [
    { case: 'Time', cost: 'n + 1 calls and n additions, so `O(n)`',
      why: 'One call per node plus one for the NULL that ends the chain, and one addition per '
         + 'node during unwinding.' },
    { case: 'Space', cost: 'stack depth n + 1, so `O(n)` automatic storage',
      why: 'Every frame stays live until its successor returns, so a long list holds a frame per '
         + 'node simultaneously — the practical reason to prefer a loop for long lists.' },
    { case: 'Heap', cost: 'nothing allocated and nothing freed',
      why: 'The list belongs to the caller and the function only reads it, so the allocation '
         + 'ledger is empty for the whole trace.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one call or one return',
    columns: ['node reached', 'depth', 'base test result', 'suffix sum returned from below',
              'sum returned']
  },
  seeAlso: [
    { id: 'reclistappend', why: 'the same descent to NULL, but each frame writes the returned '
                              + 'pointer back into its own `next` — the one difference that '
                              + 'matters' },
    { id: 'recfactorial', why: 'the identical post-order arithmetic over an integer, where the '
                             + 'base case is a number rather than a null pointer' },
    { id: 'stack', why: 'the explicit structure whose push and pop order the winding and '
                      + 'unwinding here reproduce exactly' }
  ]
};

T.reclistappend = {
  coreInvariant:
    'Every call RETURNS the head of its own sublist after the append, and its caller writes that '
    + 'pointer back into its own `next` field. The invariant is that the returned pointer is '
    + 'always a correct head for a correctly-appended sublist, which is what lets each frame '
    + 'trust the one below it. The function must return a pointer rather than modify in place '
    + 'because the empty sublist has no node to write through: with nothing to point at, the only '
    + 'way to report the new node is to hand it back. That single case is the whole reason for '
    + 'the return type.',
  mechanism:
    'Wind to NULL, allocate exactly one node there with `newNode(value)` and return it. On the '
    + 'way out every frame executes `node->next = doListAppend(node->next, value)` and then '
    + 'returns its own unchanged pointer — so every frame performs the assignment even though '
    + 'only the deepest one writes a value different from the one already there. The wrapper '
    + 'exists for the same reason the return type does: `list->head = doListAppend(list->head, '
    + 'value)` lets an append to an empty list update the caller\'s head.',
  criticalInvariants: [
    { rule: 'The result of the recursive call must be assigned, not discarded.',
      because: 'Calling `doListAppend(node->next, value)` and throwing the result away works by '
             + 'accident whenever the sublist was non-empty, because the pointer handed back is '
             + 'the one already stored. It silently loses the new node exactly when the sublist '
             + 'was empty, which is every append.' },
    { rule: 'The non-empty case returns the pointer it was GIVEN, not the new node.',
      because: 'Returning the new node makes the caller point its `next` at the tail, discarding '
             + 'every node in between. The list comes back with one or two elements instead of '
             + 'the whole chain.' },
    { rule: 'Exactly one node is allocated, and only at the NULL base case.',
      because: 'An allocation in the recursive case would create one node per level and leak all '
             + 'but one of them. The base case is the only place where a node is genuinely '
             + 'missing.' }
  ],
  examTraps: [
    { trap: 'Expecting a `void` function to be able to do this.',
      instead: 'A void append can extend a non-empty list through its predecessor\'s `next`, but '
             + 'it cannot create the first node of an empty one. Either the return type or a '
             + 'pointer-to-pointer parameter is needed, and this version uses the return.' },
    { trap: 'Expecting only the deepest frame to write a pointer.',
      instead: 'Every frame writes. All but one write back the pointer they already held, which '
             + 'is harmless and is the price of the uniform recursive case.' },
    { trap: 'Reading this as the list-sum recursion with a different operation.',
      instead: 'The shapes match and the effect does not: the sum reads values and writes nothing, '
             + 'while this writes a `next` field in every frame and allocates once at the bottom.' }
  ],
  recognition: {
    stateVariables: ['index', 'list', 'value', 'node->next', 'head', 'size'],
    tell: 'A frame that assigns the RETURNED pointer back into its own `next` field is '
        + 'pointer-rewiring recursion. A frame that combines the returned value arithmetically '
        + 'with its own is reading the list, not restructuring it — and a frame that allocates on '
        + 'the way down rather than at the base case is a different algorithm with a leak.'
  },
  complexity: [
    { case: 'Time', cost: 'n + 1 calls to append at the tail, so `O(n)`',
      why: 'The recursion walks the whole chain to find the NULL, and there is no shortcut to the '
         + 'tail of a singly linked list traversed from the head.' },
    { case: 'Space', cost: 'one allocated node plus stack depth n + 1',
      why: 'The node is the only heap cost; the frames are automatic and all live at once at the '
         + 'deepest point.' },
    { case: 'With a kept tail pointer', cost: 'one pointer write and no traversal',
      why: 'The traversal is the entire cost here, so a structure that remembers its last node '
         + 'turns the append into a constant-time operation.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one call or one return',
    columns: ['node reached', 'base test result', 'pointer returned from below',
              'what this frame writes', 'pointer returned']
  },
  seeAlso: [
    { id: 'reclistsum', why: 'the same descent with no writes at all, which is the clearest way '
                           + 'to see what the assignment here is doing' },
    { id: 'listsorts', why: 'three sorts built out of exactly these unlink-and-relink writes, '
                          + 'counted per operation' },
    { id: 'stack', why: 'the same node-and-pointer discipline in an ADT whose insert and delete '
                      + 'touch only the head' }
  ]
};

/* ================================================================== *
 * ANALYSIS                                                            *
 * ================================================================== */

T.analysis = {
  coreInvariant:
    'Big-O is a claim about how a cost GROWS with the input size, not about how large the cost '
    + 'is, which is why any constant factor and any lower-order term can be dropped without '
    + 'weakening the claim: `4n + 3` and `n` make the same statement about growth. It is why the '
    + 'classification survives a change of machine, compiler or counting convention too — those '
    + 'change the 4 and the 3, and the 4 and the 3 are the parts the claim never depended on.',
  mechanism:
    'Primitive operations are counted from the displayed linear-search pseudocode and the worst '
    + 'case is reported as `4n + 3` — four operations charged per iteration and three charged '
    + 'once, outside the loop — which is then classified as `O(n)`. For n = 64 the trace reports '
    + '`4n + 3 = 259`. The doubling table is the other half: when n doubles, an `O(1)` cost is '
    + 'unchanged, an `O(log n)` cost grows by a fixed amount so its ratio approaches 1, an `O(n)` '
    + 'cost doubles, `O(n log n)` grows a little more than double, `O(n^2)` quadruples and `O(2^n)` '
    + 'is squared. The trace itself shows at most 24 index positions whatever n you give it, '
    + 'because the point is the count and not the walk.',
  criticalInvariants: [
    { rule: 'The case must be stated: best, average or worst.',
      because: '`4n + 3` is the worst case for this search. A hit at index 0 costs a constant '
             + 'number of operations, so an unqualified complexity for the same function could '
             + 'honestly be `O(1)` or `O(n)` and the reader cannot tell which you meant.' },
    { rule: 'The counted operation must be fixed before any count is quoted.',
      because: 'Change what counts as primitive and the 4 changes with it. This is why a count '
             + 'is only comparable against another count of the SAME operation, and why the '
             + 'asymptotic class is the part worth carrying between two different analyses.' },
    { rule: 'Two unrelated input sizes need two variables.',
      because: '`O(n + m)`, `O(nm)`, `O(max(n, m))` and `O(min(n, m))` are four different claims. '
             + 'Collapsing them onto one variable by assuming the inputs are comparable in size '
             + 'discards exactly the information the two-variable form exists to carry.' },
    { rule: 'Recursive cost includes one automatic stack frame per active call.',
      because: 'A recursion with no allocations is not free of memory cost. The frames are '
             + 'automatic rather than heap storage, so they will not appear in an allocation '
             + 'ledger, and they are still proportional to the recursion depth.' }
  ],
  examTraps: [
    { trap: 'Treating Big-O as a measured runtime.',
      instead: 'Empirical timing and operation counting answer different questions. Timing tells '
             + 'you what one machine did on one input; counting tells you how the work scales, '
             + 'which is the part that transfers.' },
    { trap: 'Assuming the smaller class is always the faster code.',
      instead: 'Asymptotics describe behaviour as n grows. At the n you actually have, the '
             + 'constants can dominate, which is exactly why a quicksort hands small runs to '
             + 'insertion sort rather than recursing.' },
    { trap: 'Reading `O` as a tight statement.',
      instead: 'It is an upper bound on growth. An algorithm that makes about n comparisons is '
             + 'honestly `O(n^2)` as well; saying `O(n)` is a stronger and more useful claim, so '
             + 'say the tightest bound you can justify.' },
    { trap: 'Dropping a term because it looks small on the input you tried.',
      instead: 'Drop a term only when it grows strictly more slowly, for every large n. The 3 in '
             + '`4n + 3` qualifies; a second variable usually does not.' }
  ],
  recognition: {
    stateVariables: ['n', 'i', 'operations', 'A[i]', '4n + 3'],
    tell: 'A module that counts operations and then names a growth class, with no array being '
        + 'rearranged and no structure being built, is an analysis topic. A trace carrying `lo`, '
        + '`hi` and `mid` is a search; one carrying `i`, `j` and `min` is a sort; one carrying a '
        + 'queue or a stack of vertices is a traversal.'
  },
  complexity: [
    { case: 'Linear search, worst case', cost: '`4n + 3` primitive operations, so `O(n)`',
      why: 'Every position is examined before the miss is reported, and each iteration is charged '
         + 'a fixed number of operations.' },
    { case: 'Linear search, best case', cost: 'a constant number of operations, so `O(1)`',
      why: 'A hit at the first position returns immediately, which is why the case has to be '
         + 'stated before the cost means anything.' },
    { case: 'When n doubles', cost: '`O(n)` doubles, `O(n^2)` quadruples, `O(2^n)` is squared',
      why: 'The ratio of T(2n) to T(n) is what the growth class actually predicts, and it is the '
         + 'quickest way to recognise a class from measured data.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one growth class',
    columns: ['class', 'T(n)', 'T(2n) / T(n)', 'what doubling n costs you']
  },
  seeAlso: [
    { id: 'lin', why: 'the algorithm this count is taken from, step by step, so the 4n can be '
                    + 'matched against the iterations' },
    { id: 'bin', why: 'the same problem solved in about `log n` comparisons, which is the '
                    + 'clearest illustration of what a class change buys' },
    { id: 'sortprops', why: 'where the same counting discipline is applied across eight sorting '
                          + 'algorithms, with the counted operation named each time' }
  ]
};

/* ================================================================== *
 * SEARCHING                                                           *
 * ================================================================== */

T.lin = {
  coreInvariant:
    'After index i has been examined, the value is known to be absent from positions 0 through i. '
    + 'The scan therefore never needs to revisit a position, and when it runs off the end the '
    + 'only remaining claim — absence from the whole array — is exactly what `return -1` reports. '
    + 'Nothing anywhere in the argument uses the ORDER of the elements, which is why linear '
    + 'search is the one search that works on unsorted data and the one that needs no '
    + 'precondition at all.',
  mechanism:
    'One index walking forward from 0, one equality test per position, and an immediate return on '
    + 'the first match. Because the return is immediate, the index reported for a duplicated value '
    + 'is the LOWEST matching one. A miss costs one test per element: the trace says so '
    + 'explicitly, because the loop has no condition that could end it early on a miss, whatever '
    + 'the data looks like.',
  criticalInvariants: [
    { rule: 'The failure value must lie outside the range of valid indices.',
      because: '`-1` can never be confused with a position. Returning 0 on failure would collide '
             + 'with a genuine hit at index 0, and the caller would have no way to distinguish '
             + 'them without a second search.' },
    { rule: 'The loop bound is "i less than size", not "i at most size".',
      because: 'Reading `arr[size]` is one past the end of the array — undefined behaviour that '
             + 'often returns a plausible number instead of crashing, which is what makes the '
             + 'off-by-one so hard to spot.' },
    { rule: 'The return happens on the first match, inside the loop.',
      because: 'Recording the match and continuing would give the LAST occurrence instead of the '
             + 'first, and would cost a full scan on every successful search.' }
  ],
  examTraps: [
    { trap: 'Assuming a sorted array lets this code stop early.',
      instead: 'It has no test that could. Sorted or not, a miss walks every element — the early '
             + 'exit on sorted data needs an extra comparison that this loop does not contain.' },
    { trap: 'Treating -1 as an index.',
      instead: 'It is a sentinel meaning "not present". Indexing with it reads before the start '
             + 'of the array, which is the classic consequence of not checking the return value.' },
    { trap: 'Expecting a successful search to cost a full scan.',
      instead: 'It costs one test per position up to the hit, so about half the array on average '
             + 'when the key is present and positions are equally likely. The full scan is the '
             + 'cost of a MISS.' }
  ],
  recognition: {
    stateVariables: ['size', 'val', 'i'],
    tell: 'A single forward index with one equality test per element, and no `lo` or `hi` at all, '
        + 'is linear search. Two bounds closing in on a recomputed midpoint is binary search; two '
        + 'indices moving toward each other inside one run with a value held aside is '
        + 'partitioning, not searching.'
  },
  complexity: [
    { case: 'Miss, or worst case', cost: 'makes `size` comparisons, so `O(n)`',
      why: 'Every position has to be eliminated before absence can be reported, and nothing in '
         + 'the loop can shorten that.' },
    { case: 'Hit', cost: 'makes 1 comparison at best and about n / 2 on average',
      why: 'The scan stops at the first match, so the cost is the position of that match plus '
         + 'one.' },
    { case: 'Space', cost: '`O(1)` — one index and no copy of the data',
      why: 'Nothing is written and nothing is allocated, so the search can run over data it does '
         + 'not own.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one comparison',
    columns: ['i', 'arr[i]', 'arr[i] == val', 'comparisons so far', 'outcome']
  },
  seeAlso: [
    { id: 'bin', why: 'the same problem in about `log n` comparisons, bought with a sortedness '
                    + 'precondition this search does not need' },
    { id: 'analysis', why: 'where this exact loop is counted as `4n + 3` operations and then '
                         + 'classified' },
    { id: 'hash', why: 'what replaces the scan when you are willing to build an index first: a '
                     + 'lookup that does not grow with n at all' }
  ]
};

T.bin = {
  coreInvariant:
    'The live range `lo..hi` always has the property that IF the key is in the array at all, it '
    + 'is in that range. Each comparison against `arr[mid]` identifies a side of `mid` that '
    + 'cannot hold the key, so that side is discarded without any of its elements being examined '
    + '— and that discard is sound only because the array is sorted. The range loses at least '
    + 'half its elements every iteration, so the loop ends after about `log n` comparisons either '
    + 'with a hit or with an empty range, and an empty range is a proof of absence rather than a '
    + 'failure to find.',
  mechanism:
    '`mid = (lo + hi) / 2` with integer division, so `mid` is the LEFT of the two middles on an '
    + 'even-sized range — the trace shows `(5 + 6) / 2 = 5`. A three-way test follows: smaller '
    + 'sets `hi = mid - 1`, larger sets `lo = mid + 1`, equal returns `mid`. The loop runs while '
    + '`lo <= hi`, so a one-element range is still tested. This tracer REFUSES an unsorted input '
    + 'and stops with a single frame instead of producing an answer, because the displayed '
    + '`binarySearch` does not sort its input and an unsorted trace would teach a procedure that '
    + 'is not sound.',
  criticalInvariants: [
    { rule: 'The array must be sorted before the search runs.',
      because: 'Without order, "the key cannot be in that half" has no justification, and the '
             + 'search can report a present key as absent. It will not crash and it will not '
             + 'loop — it returns a confident wrong answer, which is the worst failure mode of '
             + 'the three.' },
    { rule: '`mid` must be excluded from the next range: `hi = mid - 1` and `lo = mid + 1`.',
      because: 'Writing `hi = mid` leaves the range the same size whenever `hi` is `lo + 1`, so '
             + 'the loop stops shrinking and never ends. The element at `mid` has already been '
             + 'compared and carries no information left to extract.' },
    { rule: 'The loop condition is `lo <= hi`, not `lo < hi`.',
      because: 'With the strict test a one-element range is never examined, so the last remaining '
             + 'candidate is skipped and a key stored there is reported absent. The bug only '
             + 'shows on the keys that happen to be isolated last.' }
  ],
  examTraps: [
    { trap: 'Expecting the midpoint to round up on an even-sized range.',
      instead: 'Integer division truncates toward zero, so the midpoint is the left of the two '
             + 'middles. Every stated index in a hand trace shifts if you round the other way.' },
    { trap: 'Expecting a particular occurrence when the key is duplicated.',
      instead: 'The three-way test returns whichever equal key `mid` happens to land on. Finding '
             + 'the FIRST or LAST occurrence needs a different loop that keeps searching after a '
             + 'match.' },
    { trap: 'Assuming binary search is the faster choice for a handful of lookups.',
      instead: 'The sort that makes it possible costs about `n log n`, against about n for a '
             + 'single scan. It pays for itself after roughly `log n` searches, so count the '
             + 'queries before paying for the order.' }
  ],
  recognition: {
    stateVariables: ['size', 'val', 'lo', 'hi', 'mid'],
    tell: 'Two bounds closing in on a recomputed midpoint, with NO write to the array anywhere, '
        + 'is binary search. Writes to the array mean a sort; a `pivot` held aside while two '
        + 'indices meet is partitioning; a single forward index with no bounds is linear search.'
  },
  complexity: [
    { case: 'Worst case or miss', cost: 'makes about `log2 n` + 1 comparisons, so `O(log n)`',
      why: 'Each comparison at least halves the live range, so the number of comparisons is how '
         + 'many times n can be halved before nothing is left.' },
    { case: 'Best case', cost: 'makes 1 comparison',
      why: 'The key sits at the first midpoint, which for a ten-element array is index 4.' },
    { case: 'Space', cost: '`O(1)` for this iterative form',
      why: 'Two bounds and a midpoint; the recursive form would add a frame per halving instead.' },
    { case: 'The precondition', cost: 'about `n log n` comparisons to sort first',
      why: 'The halving argument needs order, so the sort is part of the true cost of the first '
         + 'lookup and of none of the later ones.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one comparison against arr[mid]',
    columns: ['lo', 'hi', 'mid', 'arr[mid]', 'which half is discarded', 'candidates left']
  },
  seeAlso: [
    { id: 'lin', why: 'the same search without the sortedness precondition, which is what the '
                    + 'halving is being bought with' },
    { id: 'sortprops', why: 'where the trade-off is worked through: how many lookups it takes '
                          + 'before sorting first is worth it' },
    { id: 'bstsearch', why: 'the same halving expressed as a tree shape instead of an index '
                          + 'range, which is why a balanced tree matters' }
  ]
};

/* ================================================================== *
 * SORTING — properties, elementary, divide and conquer, non-comparison *
 * ================================================================== */

T.sortprops = {
  coreInvariant:
    'Stable, adaptive and in-place are claims about HOW a sort reaches sorted order, not about '
    + 'whether it does, and each is decided by one specific feature of the code. A sort is stable '
    + 'when no move can carry an item past an item with an equal key; adaptive when existing '
    + 'order can shorten the work, which requires some test that can exit early; in place when '
    + 'the extra memory it uses is bounded independently of n. Each property is therefore a '
    + 'constraint on a different part of the procedure, which is why knowing which feature '
    + 'decides which property lets you read all three straight off the source instead of '
    + 'memorising a table.',
  mechanism:
    'The comparison matrix sets the three cases against the three properties for selection, '
    + 'bubble, insertion, merge, quick, radix and bottom-up merge sort. The quantities are fixed '
    + 'first: n is `hi - lo + 1`, C counts item comparisons, S counts swaps, and existing order '
    + 'is probed with random, sorted and reverse-sorted input. The type contract is stated too: '
    + 'every sorting signature here is declared over `Item`, which for this course is `typedef '
    + 'int Item;`, and every key test goes through one of the four macros `lt`, `le`, `ge`, `gt` '
    + '— one typedef and four macros, which is the entire interface between the algorithm and the '
    + 'data. The lower bound closes it: a comparison sort has to distinguish n! orderings and '
    + 'each comparison has two outcomes, so it needs at least about `n log n` comparisons in the '
    + 'worst case. Radix sort gets under that only by reading key symbols instead of comparing '
    + 'keys.',
  criticalInvariants: [
    { rule: 'Stability is only OBSERVABLE when an item carries more than its key.',
      because: 'With `typedef int Item;` two equal items are indistinguishable, so no trace on '
             + 'these pages can demonstrate stability or its absence. The Stable column is a '
             + 'property of the algorithm, read off the code, not something a trace could show '
             + 'you.' },
    { rule: 'The four comparison macros are the only key tests in any of these bodies.',
      because: 'None of the sorting bodies applies a relational operator to an item directly. '
             + 'That is exactly what lets the same body sort a different item type after '
             + 'redefining one typedef and four macros, and it is why cost is counted in key '
             + 'comparisons rather than in bytes.' },
    { rule: 'In place constrains EXTRA memory, not the number of writes.',
      because: 'Quicksort is in place and still has a recursion stack that can reach depth n; '
             + 'merge sort allocates a buffer inside every `merge` and is not in place even '
             + 'though each buffer is freed before the call returns. Counting the writes would '
             + 'classify both the other way.' },
    { rule: 'The about-`n log n` lower bound applies to comparison sorts only.',
      because: 'It is derived from the number of outcomes a sequence of comparisons can '
             + 'distinguish. A method that reads key structure directly is not bound by it, which '
             + 'is the whole reason radix sort is in the matrix.' }
  ],
  examTraps: [
    { trap: 'Reading "in place" as "uses no extra memory".',
      instead: 'It means the extra memory does not grow with n. One held item, a handful of '
             + 'indices and a recursion stack are all compatible with the label; a buffer the '
             + 'size of the input is not.' },
    { trap: 'Assuming reverse-sorted input is the worst case for every sort.',
      instead: 'Verified against this tracer on its six-item presets: for both merge sorts '
             + 'descending input is the CHEAPEST of the three, at 7 comparisons against 9 '
             + 'ascending and 10 with repeated keys; and selection sort makes exactly 15 on all '
             + 'three, because it is non-adaptive and has no best or worst ordering at all.' },
    { trap: 'Treating stable as simply better.',
      instead: 'It is a property you need when items carry payload beyond the key and the '
             + 'existing order of equal keys means something. When it does not, stability buys '
             + 'nothing and may cost a buffer.' },
    { trap: 'Expecting to make a sort stable by loosening or tightening its comparison.',
      instead: 'What breaks stability in selection sort is the long-range swap, which can carry '
             + 'an item across equal keys. Changing `lt` to `le` moves which equal key is chosen '
             + 'as the minimum and leaves the swap — and the instability — exactly where it was.' }
  ],
  recognition: {
    stateVariables: ['algorithms', 'n = hi - lo + 1', 'C (comparisons)', 'S (swaps)'],
    tell: 'A single reference frame with a comparison table and no array being rearranged is a '
        + 'properties topic rather than an algorithm. To identify a particular sort, read its own '
        + 'state variables: `i` and `min` is selection, `i`, `j` and `swapped` is bubble, `item` '
        + 'and a travelling hole is insertion, `lo`, `mid`, `hi` and `k` is a merge, and `lo`, '
        + '`hi`, `l`, `r` with a held `pivot` is a partition.'
  },
  complexity: [
    { case: 'Comparison lower bound',
      cost: 'at least about `n log n` comparisons in the worst case',
      why: 'Each comparison splits the remaining possibilities at best in half, and there are n! '
         + 'orderings to tell apart, so no comparison sort can do better in general.' },
    { case: 'Elementary sorts', cost: 'make about `n^2 / 2` comparisons',
      why: 'Selection, bubble and insertion each compare across a shrinking or growing prefix, '
         + 'giving the n(n-1)/2 shape; the adaptive two can beat it on ordered input only.' },
    { case: 'Divide and conquer', cost: 'make about `n log n` comparisons',
      why: 'About `log n` levels of halving with roughly n comparisons per level — the lower '
         + 'bound, reached.' },
    { case: 'Radix sort', cost: 'makes no key comparisons at all, and runs m passes over n keys',
      why: 'It files keys by symbol instead of comparing them, so its cost is set by the key '
         + 'width m and the alphabet size R rather than by n alone.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one algorithm',
    columns: ['algorithm', 'best', 'average', 'worst', 'stable', 'adaptive', 'in place']
  },
  seeAlso: [
    { id: 'sel', why: 'the clearest non-adaptive case: the same comparison count on every input, '
                    + 'which is what "non-adaptive" means concretely' },
    { id: 'ms', why: 'the stable `n log n` sort, and the one that shows why "in place" is about '
                   + 'extra memory rather than writes' },
    { id: 'radix', why: 'the method that gets under the comparison lower bound, and the only way '
                      + 'to do it' },
    { id: 'listsorts', why: 'the same three elementary methods on a linked list, where one of '
                          + 'them inverts its best and worst cases' }
  ]
};

T.sel = {
  coreInvariant:
    'After the pass for position i, `items[lo..i]` holds the smallest items of the whole segment '
    + 'in their FINAL sorted positions, and nothing to the left of i is ever touched again. The '
    + 'pass achieves that by finding the minimum of the entire remaining region before moving '
    + 'anything at all, which is why one swap per pass is enough and why the total number of '
    + 'swaps can never exceed n - 1 however disordered the input is. Selection sort is the sort '
    + 'that minimises movement at the cost of never being able to skip a comparison.',
  mechanism:
    'An outer index i marks the boundary between the final prefix and the unsorted remainder. An '
    + 'inner scan runs from `i + 1` to `hi`, keeping `min` as the INDEX of the smallest item seen '
    + 'so far, and the pass ends with one `swap(items, i, min)`. The scan always runs the full '
    + 'remaining length because the code contains no test that could shorten it, so the '
    + 'comparison count depends on n alone. When `min` is still i the swap is a no-op and still '
    + 'executes — on ascending input every pass reports exactly that.',
  criticalInvariants: [
    { rule: '`min` holds an index, not a value.',
      because: 'The swap needs a position. Keeping the smallest VALUE seen loses where it was, '
             + 'and recovering the position would mean a second scan over the same region.' },
    { rule: 'The inner scan runs to `hi` with no early exit.',
      because: 'The unsorted remainder is in no known order, so an apparently ordered run of it '
             + 'says nothing about what lies beyond. Stopping early can leave a smaller element '
             + 'behind, and the error surfaces several passes later where it is hard to trace '
             + 'back.' },
    { rule: 'The swap happens once, after the scan completes.',
      because: 'Swapping each time a smaller element is found would move the running minimum '
             + 'around and cost up to one swap per comparison. The whole advantage of selection '
             + 'sort is that it commits to a single move per pass.' },
    { rule: 'The outer loop stops at `i < hi`, one short of the end.',
      because: 'When every position but the last is final, the last item is the largest by '
             + 'elimination. A pass for it would compare nothing and swap it with itself.' }
  ],
  examTraps: [
    { trap: 'Expecting sorted input to be cheap.',
      instead: 'Verified on this tracer\'s six-item presets: 15 comparisons on ascending input, '
             + '15 on descending and 15 with repeated keys. Selection sort is non-adaptive, so '
             + 'no ordering is a best or a worst case for comparisons — existing order cannot '
             + 'shorten the scan because there is no test that looks at it.' },
    { trap: 'Assuming the strict `lt` test makes the sort stable.',
      instead: 'The strict test does keep the EARLIER of two equal minima as `min`, but the swap '
             + 'then moves `items[i]` across the whole unsorted region, which can carry it past '
             + 'an equal key. The long-range swap is what makes selection sort unstable, and no '
             + 'change to the comparison fixes it.' },
    { trap: 'Treating the no-op swaps as free.',
      instead: 'They are still swaps on the swap count. Whether you count them is a convention, '
             + 'so state it: on ascending six-item input every one of the five swaps is a no-op.' }
  ],
  recognition: {
    stateVariables: ['lo', 'hi', 'i', 'min', 'j'],
    tell: 'One index scanning for a minimum while a second marks a growing final prefix, with at '
        + 'most one swap per pass, is selection sort. Bubble sort swaps adjacent pairs many times '
        + 'within a single pass; insertion sort holds one item outside the array and shifts a '
        + 'hole; a merge writes into a second array entirely.'
  },
  complexity: [
    { case: 'Comparisons, every case',
      cost: 'makes `n(n-1)/2` comparisons — 15 for n = 6 — so `O(n^2)`',
      why: 'The scan for pass i runs over the whole remainder, giving n-1 then n-2 and so on down '
         + 'to 1, with nothing in the code able to shorten any of them.' },
    { case: 'Swaps', cost: 'at most n - 1, one per pass',
      why: 'The pass commits to a single move after the scan, which is what makes selection sort '
         + 'attractive when a move is far dearer than a comparison.' },
    { case: 'Space', cost: 'in place, `O(1)` extra',
      why: 'Two indices and an index of the running minimum; nothing is allocated, so the trace\'s '
         + 'heap ledger stays empty.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one comparison or one swap',
    columns: ['i', 'j', 'min', 'items[j] vs items[min]', 'array after the step', 'final prefix']
  },
  seeAlso: [
    { id: 'bub', why: 'the other n-squared sort that moves adjacent pairs instead, and the one '
                    + 'whose early exit makes it adaptive where this is not' },
    { id: 'ins', why: 'the adaptive elementary sort, for the clearest contrast with a scan that '
                    + 'cannot be shortened' },
    { id: 'heapsort', why: 'selection done through a heap, which finds each minimum in `log n` '
                         + 'instead of a linear scan' },
    { id: 'listsorts', why: 'the same selection idea on a linked list, where the move is three '
                          + 'pointer writes and `S` is never scanned' }
  ]
};

T.bub = {
  coreInvariant:
    'After the pass ending at index i, `items[i..hi]` holds the largest items in final position, '
    + 'because every adjacent out-of-order pair is swapped and the largest element in the '
    + 'unsorted prefix is therefore carried all the way to i in one pass. The early exit rests on '
    + 'a different and stronger fact: if a complete pass finds NO adjacent pair out of order, '
    + 'then for a total order the whole segment is sorted — local order everywhere implies global '
    + 'order, which is what makes a single clean pass a proof rather than a hint.',
  mechanism:
    'An outer index i descends from `hi`; an inner index j walks from `lo` up to `i - 1` '
    + 'comparing `items[j]` with `items[j + 1]` and swapping on `gt`. A `swapped` flag is reset '
    + 'at the start of every pass and set by any swap, and `if (!swapped) break` ends the sort. On '
    + 'ascending six-item input the first pass makes five comparisons, swaps nothing, and the '
    + 'break fires — a complete sort in one pass.',
  criticalInvariants: [
    { rule: '`swapped` is reset at the start of each pass, inside the outer loop.',
      because: 'Declared or reset once outside, the flag records whether ANY pass ever swapped, '
             + 'so the early exit either never fires or fires on the first ordered pass of a '
             + 'still-unsorted array. The reset is what makes the flag a statement about this '
             + 'pass.' },
    { rule: 'The inner loop stops at `j < i`, not `j <= i`.',
      because: 'At `j == i` the comparison reads `items[j + 1]`, which on the first pass is one '
             + 'past the end of the segment and on later passes is inside the already-final '
             + 'region. Either way the pass can undo settled work.' },
    { rule: 'The comparison is the strict `gt`, so equal neighbours are left alone.',
      because: 'That is precisely what makes bubble sort stable: an item never moves past an '
             + 'equal key. Using `ge` instead would swap equal neighbours, destroy stability, and '
             + 'leave `swapped` true on every pass so the early exit could never fire.' },
    { rule: '"No swap in a whole pass" is the only sound early-exit test.',
      because: 'A pass that stops swapping part-way through says nothing about the part it has '
             + 'not reached yet. The flag has to survive to the end of the pass to mean anything.' }
  ],
  examTraps: [
    { trap: 'Expecting n - 1 passes regardless of input.',
      instead: 'The early exit means ascending input costs a single pass — 5 comparisons on the '
             + 'six-item preset, against 15 on the descending one. Bubble sort is adaptive, and '
             + 'the break is the only reason.' },
    { trap: 'Expecting the break to fire the moment the array becomes sorted.',
      instead: 'It fires one pass LATER. The sort cannot know it is done until a confirming pass '
             + 'walks the whole prefix and finds nothing to swap, so the last pass is always '
             + 'wasted work in the sense that it moves nothing.' },
    { trap: 'Counting a pass as the unit of cost.',
      instead: 'Count the comparisons. A pass over a long prefix and a pass over a short one are '
             + 'not the same amount of work, and the prefix shrinks by one every pass.' }
  ],
  recognition: {
    stateVariables: ['lo', 'hi', 'i', 'swapped', 'j'],
    tell: 'Adjacent pairs compared and swapped, with a boolean deciding whether another pass runs, '
        + 'is bubble sort. A single long-range swap at the end of each pass is selection sort; one '
        + 'item held outside the array with a hole travelling left is insertion sort.'
  },
  complexity: [
    { case: 'Best case', cost: 'makes n - 1 comparisons in one pass, so `O(n)`',
      why: 'An already-ordered segment swaps nothing, so the flag stays false and the break ends '
         + 'the sort after a single confirming pass — 5 comparisons for n = 6.' },
    { case: 'Worst case',
      cost: 'makes about `n(n-1)/2` comparisons — 15 for n = 6 — so `O(n^2)`',
      why: 'Descending input swaps on every comparison, so no pass can exit early and all n - 1 '
         + 'passes run to completion.' },
    { case: 'Swaps', cost: 'up to `n(n-1)/2`, one per out-of-order pair',
      why: 'Every swap fixes exactly one adjacent inversion, so the swap count equals the number '
         + 'of inversions in the input — which is also why the sort is adaptive.' },
    { case: 'Space', cost: 'in place, `O(1)` extra',
      why: 'Two indices and a flag; the swap exchanges items within the array and allocates '
         + 'nothing.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one comparison of an adjacent pair',
    columns: ['i', 'j', 'items[j] vs items[j+1]', 'swapped this pass', 'array after the step']
  },
  seeAlso: [
    { id: 'sel', why: 'the non-adaptive elementary sort, for the contrast with an early exit that '
                    + 'actually pays' },
    { id: 'ins', why: 'the other adaptive elementary sort, which shifts instead of swapping and '
                    + 'so moves far less' },
    { id: 'listsorts', why: 'the linked-list bubble method, which swaps VALUES and writes no '
                          + 'pointer at all — and cannot shrink its range' }
  ]
};

T.ins = {
  coreInvariant:
    '`items[lo..i-1]` is sorted among themselves at the start of every pass — sorted, but not yet '
    + 'in final position, since a later item can still land inside them. The pass restores that '
    + 'property for `items[lo..i]` by sliding `items[i]` back to the first place where it is not '
    + 'smaller than its left neighbour. Nothing in the argument mentions the items to the right of '
    + 'i, which is why insertion sort can run on a prefix that is still growing: it is the natural '
    + 'sort for data arriving one item at a time, and the reason nearly-ordered input is cheap.',
  mechanism:
    'The item at i is lifted into a register, leaving a hole at i. The loop `for (; j > lo && '
    + 'lt(item, items[j - 1]); j--)` copies `items[j - 1]` up into the hole, moving the hole one '
    + 'place left each time; when the test fails the hole is where the item belongs and '
    + '`items[j] = item` drops it in. Items are SHIFTED rather than swapped, which is one write '
    + 'per displaced item instead of the three a swap costs — the reason insertion sort '
    + 'outperforms bubble sort on the same number of inversions.',
  criticalInvariants: [
    { rule: 'The item is lifted out before any shifting begins.',
      because: 'The first shift writes into position i. Without the lift that write destroys the '
             + 'item being inserted, and the array ends up with a duplicate of its left '
             + 'neighbour.' },
    { rule: 'The guard tests `j > lo` BEFORE `lt(item, items[j - 1])`, and relies on '
          + 'short-circuit evaluation.',
      because: 'At `j == lo` the second test would read `items[lo - 1]`, outside the segment. '
             + 'Swapping the two conditions compiles and runs and reads out of bounds, which is '
             + 'why the order of the operands is part of the algorithm and not formatting.' },
    { rule: 'The test is the strict `lt`, so shifting stops at the first item that is not '
          + 'greater.',
      because: 'That places the new item AFTER any equal keys, which is exactly what makes '
             + 'insertion sort stable. A non-strict test would shift past equal keys and insert '
             + 'before them, reversing their original order.' },
    { rule: 'Nothing to the right of i is read during the pass.',
      because: 'It is what lets the sorted-prefix claim hold with no assumption about the '
             + 'unexamined tail — and therefore what lets the algorithm be fed one new item at a '
             + 'time without restarting.' }
  ],
  examTraps: [
    { trap: 'Looking for a swap count.',
      instead: 'The inner loop shifts. What grows is the number of item MOVES — one per displaced '
             + 'element plus the final drop — and a shift is a third of the writes a swap costs.' },
    { trap: 'Expecting ordered and reverse-ordered input to cost the same.',
      instead: 'Verified on this tracer\'s six-item presets: 5 comparisons ascending against 15 '
             + 'descending, a factor of three. Insertion sort is adaptive, and on ascending input '
             + 'each item\'s very first test fails so nothing shifts at all.' },
    { trap: 'Carrying this cost intuition over to a linked list.',
      instead: 'It inverts. The linked-list insertion method walks the SORTED output from its '
             + 'head for every node, so on this tracer\'s six-item presets it makes 15 '
             + 'evaluations on ascending input and 5 on descending — the exact opposite of this '
             + 'array version.' }
  ],
  recognition: {
    stateVariables: ['lo', 'hi', 'i', 'item', 'j'],
    tell: 'One value held outside the array while a hole travels left through a sorted prefix is '
        + 'insertion sort. A `min` index is selection sort; a `swapped` flag is bubble sort; a '
        + '`tmp` buffer with two read cursors is a merge; a held `pivot` with two indices closing '
        + 'in is a partition.'
  },
  complexity: [
    { case: 'Best case', cost: 'makes n - 1 comparisons and no moves, so `O(n)`',
      why: 'On ascending input each item is already not smaller than its left neighbour, so one '
         + 'failing test per pass ends it — 5 comparisons for n = 6.' },
    { case: 'Worst case',
      cost: 'makes about `n(n-1)/2` comparisons and about as many moves — 15 for n = 6',
      why: 'On descending input every item is shifted past the whole sorted prefix before it '
         + 'lands, so pass i costs i comparisons and i moves.' },
    { case: 'Average case', cost: 'makes about `n^2 / 4` comparisons',
      why: 'An item lands about halfway into the prefix on random input, so about half the worst '
         + 'case — and the count tracks the number of inversions exactly.' },
    { case: 'Space', cost: 'in place, one Item of extra storage',
      why: 'The lifted item is the only extra, which is why the method is in place despite moving '
         + 'data on every pass.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one comparison or one shift',
    columns: ['i', 'item held aside', 'j', 'items[j-1] vs item', 'array with the hole',
              'sorted prefix']
  },
  seeAlso: [
    { id: 'bub', why: 'the same adaptive behaviour achieved with swaps instead of shifts, so the '
                    + 'move counts differ by a factor of three' },
    { id: 'listsorts', why: 'the same method on a linked list, where the best and worst cases '
                          + 'swap places — the clearest illustration that cost belongs to the '
                          + 'implementation, not the idea' },
    { id: 'quickvariants', why: 'where insertion sort is used deliberately as the base case for '
                              + 'small runs of a quicksort' }
  ]
};

T.ms = {
  coreInvariant:
    '`merge` requires both of its inputs to be sorted and produces their sorted union; '
    + '`mergeSort` guarantees that precondition by sorting each half first, and a run of one item '
    + 'is sorted by definition. Correctness therefore needs no claim about the data at all — only '
    + 'that each recursive call receives a strictly shorter run — which is exactly why merge '
    + 'sort\'s cost is essentially the same whatever order the input arrives in, and why it is '
    + 'the predictable choice when the worst case has to be bounded.',
  mechanism:
    'Split at `mid = (lo + hi) / 2`, sort the left half, sort the right half, then merge. All the '
    + 'work happens AFTER the recursive calls, which is the exact opposite of quicksort. `merge` '
    + 'allocates a buffer of `hi - lo + 1` Items, walks read cursors `i` and `j` through the two '
    + 'runs with a write cursor `k` into the buffer, takes the smaller item — the LEFT one on a '
    + 'tie, because the test is `le` — drains whichever run is left over, copies the buffer back '
    + 'across `items[lo..hi]` and frees it. Because `merge` only runs after both recursive calls '
    + 'have returned and released their own buffers, at most ONE buffer is live at any moment, of '
    + 'up to n Items.',
  criticalInvariants: [
    { rule: '`merge` is only correct if both halves are already sorted.',
      because: 'Called on unsorted halves it still produces a permutation of them, so the bug '
             + 'appears as a wrong order rather than a crash or a lost element — and a wrong '
             + 'order several levels down is very hard to attribute.' },
    { rule: 'The tie test must take from the LEFT run when keys are equal.',
      because: '`le(items[i], items[j])` taking the left item on equality is the only thing '
             + 'making merge sort stable: it keeps items from the earlier half ahead of equal '
             + 'items from the later half. Reversing it to take the right item produces a correct '
             + 'sort that is no longer stable.' },
    { rule: 'The two drain loops are not optional.',
      because: 'When one run is exhausted the remainder of the other is already in order, but it '
             + 'still has to be copied into the buffer before the copy-back, or the tail of the '
             + 'segment is overwritten with whatever the buffer happened to hold.' },
    { rule: 'Both halves are non-empty, because `lo >= hi` returns first.',
      because: 'That guard is what makes `lo <= mid < hi` hold, so neither half can be the whole '
             + 'run and the recursion is guaranteed to shrink. Integer division also means the '
             + 'left half is never the shorter of the two.' }
  ],
  examTraps: [
    { trap: 'Calling merge sort in place.',
      instead: 'Every `merge` allocates. Freeing each buffer before returning makes the PEAK usage '
             + 'one buffer rather than one per call, which is a real saving and still not in '
             + 'place.' },
    { trap: 'Expecting reverse-sorted input to be the worst case.',
      instead: 'Verified on this tracer\'s six-item presets: 9 comparisons on ascending input, 7 '
             + 'on descending and 10 with repeated keys. Descending is the CHEAPEST, because each '
             + 'merge fails its first `le` test, takes the whole right run, and then copies the '
             + 'left run across without comparing anything further.' },
    { trap: 'Counting the copy-back and the drains as comparisons.',
      instead: 'They move items and compare nothing. Count the `le` evaluations for comparisons '
             + 'and the writes for moves; merge sort does roughly 2n writes per level and that is '
             + 'a separate figure.' }
  ],
  recognition: {
    stateVariables: ['lo', 'hi', 'depth', 'mid', 'i', 'j', 'k'],
    tell: 'Two read cursors into one array with a write cursor into a SECOND array is a merge. Two '
        + 'indices moving toward each other inside one run with a value held aside is partitioning; '
        + 'one index scanning for a minimum is selection sort. A `depth` that rises and falls with '
        + 'a `mid` recomputed per call means the merges are driven by recursion rather than by a '
        + 'doubling run length.'
  },
  complexity: [
    { case: 'Every case', cost: 'makes about `n log n` comparisons',
      why: 'About `log n` levels of halving, and each level merges every element roughly once; '
         + 'the input order moves the figure only within a narrow band.' },
    { case: 'Moves', cost: 'about `2n` writes per level, so about `2n log n` in total',
      why: 'Each merge writes every item into the buffer and then back again, which is the price '
         + 'of the merge being out of place.' },
    { case: 'Space', cost: 'not in place: one buffer of up to n Items live at a time',
      why: '`merge` allocates and frees within one call, and runs only after both recursive calls '
         + 'have returned, so the buffers never coexist.' },
    { case: 'Recursion', cost: 'stack depth about `log n`',
      why: 'The call tree is balanced by construction, since the split is at the midpoint rather '
         + 'than at a data-dependent position.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one le test, one buffer write, or one allocation event',
    columns: ['lo', 'mid', 'hi', 'i', 'j', 'k', 'tmp contents', 'array after the copy-back']
  },
  seeAlso: [
    { id: 'bottomup', why: 'the same merges driven by a doubling run length instead of a call '
                         + 'tree, with identical comparison counts and no recursion' },
    { id: 'qs', why: 'the same divide-and-conquer shape with the work BEFORE the recursion rather '
                   + 'than after it, which is where all the differences come from' },
    { id: 'sortprops', why: 'where the stability and in-place claims made here sit against the '
                          + 'other six algorithms' }
  ]
};

T.bottomup = {
  coreInvariant:
    'Before the pass with run length m, every block of m consecutive items starting at `lo`, `lo '
    + '+ 2m`, and so on is already sorted — single items qualify when m is 1 — and the pass '
    + 'merges each adjacent PAIR of such blocks, which doubles the run length. Once m covers the '
    + 'whole segment there is one run left and it is sorted. The invariant is stated over run '
    + 'length rather than over a call tree, which is exactly why no recursion is needed: the '
    + 'passes rebuild the same structure from the bottom.',
  mechanism:
    'An outer loop doubles `m` while `m <= hi - lo`; an inner loop steps `i` by `2 * m` while `i '
    + '<= hi - m`, sets `end = min(i + 2*m - 1, hi)` and calls the same `merge(items, i, i + m - '
    + '1, end)` the recursive version uses — so the same allocate-and-free happens per merge. The '
    + '`i <= hi - m` guard is what guarantees a right-hand run EXISTS; a trailing run shorter than '
    + 'm is simply left alone this pass and picked up by a later one. On five items the final pass '
    + 'with m = 4 therefore merges `[0..3]` with the single item at index 4.',
  criticalInvariants: [
    { rule: 'The inner guard must be `i <= hi - m`.',
      because: 'It is what makes `i + m - 1` at most `hi`, so the left run is complete and a '
             + 'non-empty right run begins at `i + m`. Without it `merge` is handed a right run '
             + 'that does not exist and reads past the segment.' },
    { rule: '`end` must be clamped with `min(i + 2*m - 1, hi)`.',
      because: 'The last pair of runs in a pass is usually not a full `2m` items, because n is '
             + 'rarely a power of two. Without the clamp the final merge of most inputs runs off '
             + 'the end of the array.' },
    { rule: 'All merges of one pass finish before the next pass begins.',
      because: 'A pass assumes runs of exactly m. Interleaving passes would hand `merge` one run '
             + 'of length m and one of length 2m, and the sorted-input precondition would still '
             + 'hold while the alignment the next pass depends on would not.' },
    { rule: 'The outer condition is `m <= hi - lo`, so a single item runs no pass at all.',
      because: 'For one item `hi - lo` is 0 and the first m of 1 already exceeds it. That is '
             + 'correct — a one-item segment is sorted — and it is why the trace on a single item '
             + 'shows no merge.' }
  ],
  examTraps: [
    { trap: 'Expecting a different comparison count from the recursive version.',
      instead: 'Verified on this tracer\'s six-item presets: 9 ascending, 7 descending and 10 '
             + 'with repeated keys — identical to top-down merge sort on all three. The two '
             + 'perform the SAME merges in a different order, so what is worth comparing is the '
             + 'pass structure, not the cost.' },
    { trap: 'Expecting the input length to be a power of two.',
      instead: 'A non-power-of-two length just makes the last merge of some passes lopsided, '
             + 'which is precisely what the `min` on `end` is for. Nothing about the invariant '
             + 'needs equal run lengths.' },
    { trap: 'Assuming it is in place because there is no recursion.',
      instead: 'It calls the same allocating `merge`, so the buffer cost is unchanged. What the '
             + 'iterative form removes is the CALL STACK, which matters for very large inputs and '
             + 'for environments where recursion depth is limited.' }
  ],
  recognition: {
    stateVariables: ['lo', 'hi', 'm', 'i', 'end', 'j', 'k', 'mid'],
    tell: 'A run length `m` doubling across passes, with an index `i` stepping by `2m` and an '
        + '`end` clamped to `hi`, is bottom-up merging. A `depth` variable with a `mid` '
        + 'recomputed inside each call is top-down merge sort; the merge itself looks identical '
        + 'in both, because it is the same function.'
  },
  complexity: [
    { case: 'Every case', cost: 'makes about `n log n` comparisons',
      why: 'About `log2 n` passes, each comparing at most n items once, and the input order moves '
         + 'the total only within a narrow band.' },
    { case: 'Passes', cost: 'about `log2 n` passes, m doubling each time',
      why: 'The run length starts at 1 and doubles until it covers the segment, which is how many '
         + 'times n can be halved.' },
    { case: 'Space', cost: 'not in place: one buffer of up to n Items at a time, and no call stack',
      why: 'Each merge allocates and frees before the next begins, and the loops replace the '
         + 'recursion entirely.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one merge of a run pair, or one le test inside it',
    columns: ['m', 'i', 'end', 'left run', 'right run', 'array after the merge']
  },
  seeAlso: [
    { id: 'ms', why: 'the recursive version performing the same merges in a different order, which '
                   + 'is the whole comparison worth making' },
    { id: 'sortprops', why: 'where both merge sorts sit against the elementary and '
                          + 'non-comparison methods' },
    { id: 'listsorts', why: 'merging\'s natural home: run-based sorting with no random access, '
                          + 'where relinking replaces the buffer' }
  ]
};

T.q3 = {
  coreInvariant:
    'The partition invariant is unchanged from the naive pivot: after `partition` returns `p`, '
    + 'nothing left of `p` is greater than `A[p]` and nothing right of it is smaller, so `A[p]` is '
    + 'final and is never moved or compared again. `medianOfThree` does not touch that argument at '
    + 'all — it only changes WHICH element becomes the pivot, by physically reordering three '
    + 'positions so that the median of `a[lo]`, `a[mid]` and `a[hi]` ends up at `a[lo]`, which is '
    + 'the one place `partition` looks. That separation is the point: correctness comes from the '
    + 'partition, and the pivot rule buys only balance.',
  mechanism:
    'Three unconditional `gt` tests run before each partition. The first makes `a[mid]` no greater '
    + 'than `a[lo]`; the second then makes `a[lo]` no greater than `a[hi]` but can break the '
    + 'first; the third repeats the first to restore it. The net result is `a[mid]` at most '
    + '`a[lo]` at most `a[hi]`, so `a[lo]` holds the median of the three. All three tests are '
    + 'evaluated whether or not they swap, so every non-trivial call pays exactly three extra '
    + 'comparisons — and on a two-item run `mid` equals `lo`, so the first and third tests compare '
    + 'an element with itself and can never fire.',
  criticalInvariants: [
    { rule: 'All three tests are needed, in that order.',
      because: 'Dropping the third leaves `a[lo]` as the median only when the second test did not '
             + 'swap. The repeat is not redundancy — it repairs the ordering the middle swap can '
             + 'break, which is why the first and third tests are textually identical.' },
    { rule: '`medianOfThree` runs before `partition`, and `partition` still reads its pivot from '
          + '`a[lo]`.',
      because: 'The two halves only work together. Choosing a median and then partitioning around '
             + 'some other position would give a correct sort with none of the balance the '
             + 'reordering was paid for.' },
    { rule: 'It REORDERS the array; it does not merely select.',
      because: 'Whenever a test fires, the array handed to `partition` is not the array the call '
             + 'received — on ascending six-item input the first call turns `1 2 3 4 5 6` into `3 '
             + '2 1 4 5 6`. A hand trace that records only the pivot choice will diverge from the '
             + 'printed array on the very next step.' },
    { rule: 'The correction step `if (lt(pivot, items[l])) l--` inside `partition` still applies '
          + 'unchanged.',
      because: 'Median-of-three changes the pivot VALUE and nothing about how the crossing point '
             + 'is turned into a final position. The same off-by-one that breaks the naive version '
             + 'breaks this one identically.' }
  ],
  examTraps: [
    { trap: 'Expecting the median of the RUN.',
      instead: 'It samples three positions only. Verified on repeated-key input `4 2 4 1 2 3`: the '
             + 'first call samples 4, 4 and 3, so the pivot is 4 — the maximum of the whole array '
             + '— and `partition` returns `hi`, the most unbalanced split available.' },
    { trap: 'Expecting the improvement to be free.',
      instead: 'Verified on this tracer\'s six-item presets: 18, 19 and 24 comparisons on '
             + 'ascending, descending and repeated-key input, against the naive pivot\'s 19, 17 '
             + 'and 15. It removes the ordered-input penalty and pays three `gt` tests per call, '
             + 'which makes repeated keys its DEAREST case and the naive pivot\'s cheapest.' },
    { trap: 'Believing the worst case is now about `n log n`.',
      instead: 'The pivot is still a single element drawn from three fixed positions, so an input '
             + 'built against that rule still degrades to about `n^2`. What median-of-three buys '
             + 'is that ORDINARY ordered input is no longer such an input.' }
  ],
  recognition: {
    stateVariables: ['lo', 'hi', 'mid', 'pivot', 'l', 'r', 'pivotIndex'],
    tell: 'A `mid` computed inside a quicksort call, used by three `gt` tests and then never '
        + 'referenced again, is median-of-three. A quicksort with no `mid` at all takes its pivot '
        + 'straight from `lo`; a `mid` that persists and drives a buffer is a merge sort.'
  },
  complexity: [
    { case: 'Best and average',
      cost: 'makes about `n log n` comparisons, plus three `gt` tests per call',
      why: 'The sampled median usually splits the run reasonably, giving about `log n` levels; the '
         + 'three extra tests are a constant per call and so a constant factor overall.' },
    { case: 'Worst', cost: 'still makes about `n^2 / 2` comparisons',
      why: 'Three sampled positions can all be extreme — repeated keys do it readily — and the '
         + 'recursion is then as deep as the array is long.' },
    { case: 'Against the naive pivot on ordered input',
      cost: '18 comparisons against 19 ascending, with a far more even split',
      why: 'The counts are close on six items while the SPLIT is not: the naive pivot peels off '
         + 'one element per partition, and the gap grows with n.' },
    { case: 'Space', cost: 'in place, with recursion depth up to n in the worst case',
      why: 'Nothing is allocated; only the call stack grows, and the reordering is done with '
         + 'swaps.' }
  ],
  convention: 'partitionPivot',
  whatToDraw: {
    unit: 'one row = one gt test, one pointer move, or one swap',
    columns: ['lo', 'mid', 'hi', 'which of the three tests', 'pivot', 'l', 'r',
              'array after the step']
  },
  seeAlso: [
    { id: 'qs', why: 'the naive first-element pivot on the same partition, which is the only way '
                   + 'to see what the three extra tests are buying' },
    { id: 'quickvariants', why: 'the two other pivot and base-case improvements, including the '
                              + 'randomised pivot and the small-run threshold' },
    { id: 'ms', why: 'the divide-and-conquer sort whose balance does not depend on the data at '
                   + 'all, which is the alternative to improving a pivot rule' }
  ]
};

T.quickvariants = {
  coreInvariant:
    'Every variant here leaves `partition` and its invariant completely untouched; each changes '
    + 'only what happens BEFORE a partition, or whether a partition happens at all. That is the '
    + 'reason none of them can make quicksort incorrect — the argument that the returned pivot '
    + 'position is final never mentions how the pivot was chosen — and it is why none of them '
    + 'changes the worst-case bound either, because that bound is a statement about how unevenly '
    + 'a single element can split a run rather than about how the element was picked.',
  mechanism:
    'Three variants. The RANDOMISED one swaps a pseudo-randomly chosen element into `items[lo]` '
    + 'with `swap(items, lo, randint(lo, hi))`, where `randint` is `lo + rand() % (hi - lo + 1)`, '
    + 'then runs the same `partition`. The THRESHOLD one defines `THRESHOLD 5` and opens with `if '
    + '(hi - lo < THRESHOLD) { insertionSort(items, lo, hi); return; }`; a second form defers '
    + 'every small run and makes a single insertion-sort pass over the whole array at the end. The '
    + 'LINKED-LIST one chooses a pivot, distributes the existing nodes into two lists, sorts both '
    + 'and concatenates sorted-A, the pivot and sorted-B. This module presents the variants rather '
    + 'than tracing them, because no particular random pivot was chosen for it and no complete '
    + 'code for the list version was available to execute.',
  criticalInvariants: [
    { rule: 'The threshold guard tests `hi - lo`, not the item count.',
      because: 'The bounds are INCLUSIVE, so a run holds `hi - lo + 1` items and `hi - lo < 5` is '
             + 'true for runs of five items or fewer. Four items give `hi - lo` of 3 and go to '
             + 'insertion sort; five give 4 and also go to insertion sort; six give 5 and are '
             + 'partitioned. Reading the guard as "fewer than five items" is off by one.' },
    { rule: 'The randomised swap must land the chosen element at `lo`.',
      because: '`partition` reads its pivot from `items[lo]` and from nowhere else. Choosing an '
             + 'index at random and then partitioning without moving it there randomises nothing '
             + 'at all.' },
    { rule: '`insertionSort` is called with the same inclusive bounds and must leave the run '
          + 'sorted.',
      because: 'The caller returns immediately afterwards and never partitions that run, so '
             + 'anything the base case leaves unsorted stays unsorted in the final array.' },
    { rule: 'Randomisation changes the DISTRIBUTION of splits, not the set of possible splits.',
      because: 'The degenerate split is still reachable; what changes is that no fixed input '
             + 'triggers it reliably, so an adversary who knows your code but not your random '
             + 'seed can no longer construct a worst case.' }
  ],
  examTraps: [
    { trap: 'Expecting randomisation to remove the `n^2` worst case.',
      instead: 'It makes the worst case unlikely for any particular input rather than impossible. '
             + 'The bound is unchanged; what improves is the EXPECTED cost over the random '
             + 'choices.' },
    { trap: 'Reading the threshold as "fewer than five items".',
      instead: 'A five-item run is handled by insertion sort, because the guard compares `hi - '
             + 'lo` and the bounds are inclusive. Check the arithmetic against the condition, not '
             + 'against the constant\'s name.' },
    { trap: 'Expecting the threshold to improve the asymptotic cost.',
      instead: 'Insertion sort on a run of at most five items is a bounded amount of work, so the '
             + 'saving is call overhead and constants. The comparison count stays about `n log '
             + 'n`.' }
  ],
  recognition: {
    stateVariables: ['THRESHOLD', 'hi - lo', 'randint(lo, hi)'],
    tell: 'A quicksort that swaps a randomly chosen element to `lo` before partitioning is the '
        + 'randomised variant; one that tests `hi - lo` against a constant and calls '
        + '`insertionSort` is the threshold variant. Both then run the SAME partition, so the '
        + 'pivot is still read from `items[lo]` and the trace of the partition itself is '
        + 'identical in all three.'
  },
  complexity: [
    { case: 'Randomised, expected', cost: 'makes about `n log n` comparisons',
      why: 'A uniformly chosen pivot splits reasonably often enough that the expected depth is '
         + 'about `log n`, taken over the random choices rather than over the inputs.' },
    { case: 'Randomised, worst', cost: 'still makes about `n^2 / 2` comparisons',
      why: 'An unlucky sequence of choices can peel off one element at a time; the bound is the '
         + 'same, only its probability changes.' },
    { case: 'Threshold', cost: 'replaces every run of five items or fewer with one insertion sort',
      why: 'Those runs are the most numerous calls in a balanced call tree, so removing them saves '
         + 'call overhead while the comparison count stays about `n log n`.' },
    { case: 'Linked-list variant',
      cost: 'makes about `n log n` comparisons with no array indexing and no buffer',
      why: 'Nodes are relinked into two lists rather than moved within one array, so there is no '
         + 'random access to lose and no scratch allocation to pay for.' }
  ],
  convention: 'partitionPivot',
  whatToDraw: {
    unit: 'one row = one variant',
    columns: ['variant', 'what it changes', 'what it leaves alone', 'effect on the worst case']
  },
  seeAlso: [
    { id: 'qs', why: 'the baseline these variants modify, with the partition every one of them '
                   + 'still calls unchanged' },
    { id: 'q3', why: 'the pivot improvement that IS fully traced, so the three extra tests per '
                   + 'call can be counted' },
    { id: 'ins', why: 'the sort the threshold variant hands small runs to, and why it is the right '
                    + 'choice for a nearly-ordered run of five' }
  ]
};

T.radix = {
  coreInvariant:
    'Each pass is a STABLE distribution of the keys by one symbol. Because the passes run from the '
    + 'least significant symbol toward the most significant, a pass that orders the keys by symbol '
    + 'i leaves keys that tie on symbol i in the order the earlier passes gave them — which is '
    + 'their order on the less significant symbols. After the pass on symbol 1 the keys are '
    + 'therefore in full order. The stability of every pass is the entire proof, not an '
    + 'optimisation: break it anywhere and the result is wrong rather than merely slower.',
  mechanism:
    'R buckets, one per symbol of the alphabet, with R = 10 for the decimal input used here. For '
    + '`i` from `m` down to 1: empty every bucket, append each key of A in order to bucket '
    + '`key[i]`, clear A, then rebuild A by visiting buckets 0 through R-1 in order and taking '
    + 'each bucket\'s keys in arrival order. Appending at the TAIL and gathering in index order is '
    + 'what makes the pass stable. Position `i = m` is the least significant symbol, so the loop '
    + 'is least-significant-first. No key is ever compared with another key. The displayed '
    + 'pseudocode assumes every key already has m symbols and supplies no step that establishes '
    + 'it, so this tracer adds one clearly marked supplemental frame that pads shorter keys on the '
    + 'LEFT with the symbol `0`: `7 42 318` becomes `007 042 318`, and the trace labels each '
    + 'leading-zero read as padding rather than as an entered symbol.',
  criticalInvariants: [
    { rule: 'The passes must run least significant first, and every pass must be stable.',
      because: 'A pass that reorders ties discards everything the previous passes established. '
             + 'Stability is doing the real work here — the sort has no comparison to fall back '
             + 'on, so there is nothing to recover the lost order.' },
    { rule: 'The gather visits buckets in symbol order, and each bucket in arrival order.',
      because: 'Pushing at the head instead of appending at the tail reverses ties and breaks '
             + 'stability silently: the output still looks plausible and is wrong on the next '
             + 'pass.' },
    { rule: 'Every key must carry a symbol at every position from 1 to m.',
      because: 'The loop indexes `key[i]` for all of them, so a short key has no symbol to file '
             + 'by. Padding must go on the most significant end: a leading `0` does not change '
             + 'what a decimal numeral denotes, while padding on the right multiplies the key by '
             + 'a power of R — 7 would become 7000 — and misaligns its units digit with the pass '
             + 'index.' },
    { rule: 'The number of passes is fixed by the key width m, not by the data.',
      because: 'Radix sort does not adapt. Already-sorted input costs exactly the same m passes, '
             + 'because no pass has any test that could notice.' }
  ],
  examTraps: [
    { trap: 'Looking for a comparison count.',
      instead: 'There is none: no two keys are ever compared. That is precisely how radix sort '
             + 'gets under the comparison lower bound of about `n log n` — it reads key structure '
             + 'instead of asking which of two keys is larger.' },
    { trap: 'Running the passes most significant first with this same loop.',
      instead: 'That is a different algorithm and needs recursion or a sort within each bucket. As '
             + 'written, `for i from m down to 1` is least-significant-first and the correctness '
             + 'argument depends on the direction.' },
    { trap: 'Treating it as in place.',
      instead: 'Between the scatter and the gather, the R buckets hold all n keys, so it needs '
             + 'room for a second copy of the data plus the bucket overhead — which is why the '
             + 'comparison matrix marks it as not in place.' },
    { trap: 'Assuming equal-width keys are a limitation of the algorithm.',
      instead: 'They are a precondition of this pseudocode. Equal-width unsigned numerals compare '
             + 'lexicographically exactly as they compare numerically, which is why left-padding '
             + 'to a common width produces the same order as the keys as entered.' }
  ],
  recognition: {
    stateVariables: ['m', 'R', 'i', 'key', 'bucket', 'padded'],
    tell: 'Keys filed into R buckets by ONE symbol and then concatenated, with a pass index '
        + 'counting DOWN from the key width, is radix sort. Anything that evaluates `lt`, `le`, '
        + '`ge` or `gt` on two keys is a comparison sort and is bound by the about-`n log n` lower '
        + 'bound that this method escapes.'
  },
  complexity: [
    { case: 'Every case', cost: 'makes about `m(n + R)` operations',
      why: 'm passes, each scattering n keys and then emptying and walking R buckets; there is no '
         + 'best or worst input because nothing in a pass depends on the data.' },
    { case: 'Comparisons', cost: 'none at all',
      why: 'A key is read symbol by symbol and filed; it is never tested against another key, '
         + 'which is what takes the method outside the comparison lower bound.' },
    { case: 'Space', cost: 'not in place: about n plus R extra',
      why: 'The buckets hold every key between the scatter and the gather, so a full second copy '
         + 'of the data exists at the midpoint of every pass.' },
    { case: 'When m grows', cost: 'the cost grows linearly in the key width',
      why: 'Wide keys mean more passes, so radix sort wins against about `n log n` only while m '
         + 'stays small relative to `log n`.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one key filed into a bucket, or one gather',
    columns: ['pass i', 'key', 'symbol key[i]', 'bucket', 'bucket contents',
              'A after the gather']
  },
  seeAlso: [
    { id: 'sortprops', why: 'where the comparison lower bound is stated, which is the claim this '
                          + 'method is the counter-example to' },
    { id: 'ms', why: 'the stable comparison sort to contrast it with: both are stable, and only '
                   + 'one of them compares' },
    { id: 'trie', why: 'the other structure here that reads keys symbol by symbol rather than '
                     + 'comparing them whole' }
  ]
};

T.listsorts = {
  coreInvariant:
    'On a linked list the ORDER is the `next` chain, not the positions in memory, so a sort has '
    + 'two genuinely different options: move the nodes by writing pointers, or move the values by '
    + 'writing `item` fields. Each of the three methods here settles that choice differently, and '
    + 'that choice — not the comparison rule — is what decides the cost and what a trace of it '
    + 'looks like. Correctness in each case rests on the same invariant as its array cousin; what '
    + 'changes is which writes maintain it, which is why the array cost intuitions do not carry '
    + 'across unchanged.',
  mechanism:
    'All three run on the SAME allocated nodes, each carrying a stable identity so a node that '
    + 'keeps its place in the chain while its value changes is visible as such. The INSERTION '
    + 'method takes the head node of `L`, walks the sorted output `S` from its head while `S[i] <= '
    + 'v`, and splices the node in — so every node pays a walk of `S`. The SELECTION method scans '
    + '`L` for the LARGEST value and pushes that node onto the FRONT of `S`, so `S` grows '
    + 'ascending from its head; `S` is never scanned and each pass costs exactly three pointer '
    + 'writes, one to unlink and two to push. The BUBBLE method compares adjacent values and swaps '
    + 'VALUES, so no `next` pointer is ever written and the chain stays in allocation order for '
    + 'the whole run.',
  criticalInvariants: [
    { rule: 'The selection unlink needs the PREDECESSOR of the running maximum.',
      because: 'A singly linked node has no pointer back, so it cannot unlink itself. The scan has '
             + 'to carry `prev` alongside the maximum, and when the maximum is the head the unlink '
             + 'writes the list head instead of a node — two different writes for the same '
             + 'operation.' },
    { rule: 'The selection method takes the LARGEST and pushes at the FRONT.',
      because: 'Those two choices cancel into ascending output. Taking the largest and appending '
             + 'at the tail, or taking the smallest and pushing at the front, each produce '
             + 'descending order — the method is only correct as a matched pair.' },
    { rule: 'The insertion scan tests `S[i] <= v`, so an equal key is passed over.',
      because: 'The new node therefore lands AFTER the existing equal keys, which is what makes '
             + 'the method stable. Testing for strictly less would stop at the first equal key and '
             + 'insert before it, reversing their arrival order.' },
    { rule: 'The value-swapping bubble method needs a full traversal with no swap before it may '
          + 'stop, and it cannot shrink its range.',
      because: 'The stated method repeats until a traversal makes no swap, and unlike the array '
             + 'version it has no `for (i = hi; i > lo; i--)` to retire a settled tail — so each '
             + 'traversal walks the whole chain.' }
  ],
  examTraps: [
    { trap: 'Carrying the array insertion sort\'s cost intuition across.',
      instead: 'It inverts. Verified on this tracer\'s six-item presets: 15 evaluations of `S[i] '
             + '<= v` on ascending input and 5 on descending. Ascending is this method\'s WORST '
             + 'case, because every new value walks the whole accumulated prefix of `S` before '
             + 'stopping — the exact opposite of the array version, whose best case is ascending.' },
    { trap: 'Expecting the bubble method to relink nodes.',
      instead: 'It writes values. Verified on eight items: 14 value swaps and ZERO pointer writes, '
             + 'with the chain still in its original node order at the end. Watch the node '
             + 'identities, not the values, to see it.' },
    { trap: 'Expecting the selection method to scan `S`.',
      instead: 'It never does — that is the whole difference from the insertion method. Verified '
             + 'on eight items: 8 passes and 24 pointer writes, exactly three per pass, with every '
             + 'scan over `L` alone.' },
    { trap: 'Assuming a linked-list sort must allocate.',
      instead: 'None of the three allocates or frees a single node. They reorder what the caller '
             + 'already owns, which is the main structural advantage a list has over an array '
             + 'here.' }
  ],
  recognition: {
    stateVariables: ['method', 'remaining', 'sorted', 'current', 'position', 'comparisons',
                     'pass', 'largest', 'pointerWrites', 'traversal', 'swaps'],
    tell: 'Two lists, `L` and `S`, with nodes migrating between them means nodes are being '
        + 'relinked — insertion if `S` is scanned for a slot, selection if only `L` is scanned. ONE '
        + 'list whose values change while the node identities keep their places is the '
        + 'value-swapping bubble method, and its pointer-write count is zero.'
  },
  complexity: [
    { case: 'Insertion, ascending input',
      cost: 'makes about `n(n-1)/2` evaluations — 15 on the six-item preset',
      why: 'Each new value is not smaller than everything already in `S`, so the scan walks the '
         + 'whole sorted prefix before it stops.' },
    { case: 'Insertion, descending input',
      cost: 'makes n - 1 evaluations — 5 on the six-item preset',
      why: 'Each value fails `S[0] <= v` on its very first test and is relinked at the head, so '
         + 'descending input is this method\'s best case.' },
    { case: 'Selection, every input',
      cost: 'makes about `n(n-1)/2` comparisons and exactly 3 pointer writes per pass',
      why: 'The scan of `L` cannot be shortened, and `S` is never walked, so the write count is '
         + 'fixed at three per pass — 24 over 8 passes.' },
    { case: 'Bubble, every input',
      cost: 'up to about `n(n-1)/2` comparisons and NO pointer writes',
      why: 'It repeats full traversals until one makes no swap, and every swap exchanges two '
         + '`item` fields rather than rewiring the chain.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one comparison, one pointer write, or one value swap',
    columns: ['method', 'node in play', 'L', 'S', 'what pointer or field was written',
              'comparisons so far']
  },
  seeAlso: [
    { id: 'ins', why: 'the array insertion sort whose best and worst cases are the exact inverse '
                    + 'of the list version traced here' },
    { id: 'sel', why: 'the array selection sort, for the contrast between one long-range swap and '
                    + 'three pointer writes' },
    { id: 'bub', why: 'the array bubble sort, which can retire a settled tail where the list '
                    + 'method cannot' },
    { id: 'reclistappend', why: 'the unlink-and-relink writes on their own, counted one at a time, '
                              + 'before a sort is built out of them' }
  ]
};

window.COMP2521RegisterTheory('foundations', T);
})();
