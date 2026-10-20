/* corpus-theory-trees.js — theory entries for the trees area.
 *
 * SOURCE LABEL: TRACER-AUTHORED EXPLANATION. See the header of
 * corpus-theory.js for the schema, the provenance rule and the conventions
 * table. Entries are plain text; `backticks` become code spans and the panel
 * escapes everything else.
 *
 * Every claim below was checked against the running tracer before it was
 * written: the frames of each module were read through
 * COMP2521TracerTestAPI.runModule, and the displayed source blocks in
 * corpus-trees.js and modules-trees.js were read alongside them. Where the
 * two disagreed with what a general account of the algorithm would say, the
 * tracer won and the entry says what the tracer does.
 *
 * ONE HEIGHT CONVENTION, verified: `heightOf()` returns -1 for an empty tree,
 * so a leaf is 0 and height is counted in EDGES. The `avlheight` trace prints
 * `height(left) = -1` at every leaf, `max(-1, -1) + 1 = 0`, `N(-1) = 0` and
 * `N(0) = 1`; the `bsttrav` trace states "an empty tree has height -1 in this
 * corpus - which is what makes a leaf's height 0". Every entry that states a
 * height or a balance factor therefore carries convention 'treeHeight'.
 */
(function () {
'use strict';
const T = {};

/* ------------------------------------------------------------------ *
 * Binary search trees.                                                *
 * ------------------------------------------------------------------ */

T.bstins = {
  coreInvariant:
    'Insertion never moves a node that is already in the tree. It descends by comparison and '
    + 'attaches the new node at the exact NULL pointer where a search for that value would have '
    + 'failed, and that slot is correct because every comparison on the way down commits the value '
    + 'to one side of a node permanently: smaller than this node forever, larger than that one '
    + 'forever. The slot reached is the only place in the whole tree that satisfies all of those '
    + 'commitments at once, so the ordering property survives without anything else being touched.',
  mechanism:
    '`bstInsert` returns the root of the subtree it was given and the caller stores that return '
    + 'value back into `tree->left` or `tree->right`. That return-and-reassign is what performs the '
    + 'attachment: the callee that creates the node has no pointer to the parent, so the only way '
    + 'the new node can be linked in is for every level of the recursion to re-accept its own '
    + 'child. The base case `tree == NULL` is both the stopping test and the place `newNode` is '
    + 'called. A value already present takes neither comparison branch and the tree is returned '
    + 'unchanged, so there is no fourth case to remember.',
  criticalInvariants: [
    { rule: 'The result of each recursive call must be assigned back into the child pointer: '
          + '`tree->left = bstInsert(tree->left, val)`.',
      because: 'The new node is built inside a call that cannot reach the parent, so a call whose '
             + 'return value is discarded allocates a node and loses it. The tree is then '
             + 'unchanged and the memory is leaked, and because the code still compiles and the '
             + 'first insertion into an empty tree still appears to work, the bug is easy to miss.' },
    { rule: 'Equality is a third branch that returns the tree untouched, not a reason to descend '
          + 'further.',
      because: 'Treating a duplicate as "larger" would put a second node with the same value '
             + 'somewhere in the right subtree. A later search would then find one of the two '
             + 'copies and a later deletion would remove the other, so the tree would disagree '
             + 'with itself about whether the value is present.' },
    { rule: 'The new node is always attached as a leaf, with both of its own pointers NULL.',
      because: 'The descent stops only at a NULL pointer, so insertion never splits an existing '
             + 'edge and no existing node changes its parent or either child. That is exactly why '
             + 'the shape of the finished tree is a record of the arrival order and nothing else.' }
  ],
  examTraps: [
    { trap: 'Expecting insertion to do something about the shape.',
      instead: 'It does nothing at all about the shape. Values arriving in ascending order give a '
             + 'tree of height `n - 1` — one long right chain — which is the input the global '
             + 'rebalancing topic uses to show the damage.' },
    { trap: 'Believing a value has a fixed position determined by its own size.',
      instead: 'The same value lands at a different depth under a different arrival order. Its '
             + 'position is decided by the comparisons against the nodes that happened to be there '
             + 'already, so two trees holding identical values can have completely different '
             + 'shapes.' },
    { trap: 'Counting the final pointer assignment as a comparison.',
      instead: 'Comparisons are the two value tests made at each node visited; the assignment is a '
             + 'pointer write. A descent of `d` nodes makes up to `2d` comparisons and exactly one '
             + 'write.' }
  ],
  recognition: {
    stateVariables: ['val', 'the node currently being compared', 'the path highlighted so far'],
    tell: 'One value descending and stopping at the first NULL pointer, with no existing node ever '
        + 'moved and no rotation anywhere, is leaf insertion. If the value climbs back towards the '
        + 'root by a rotation at every level of the unwind, that is root insertion in `bstlocal`; '
        + 'if a balance factor is read at each node on the way back up, that is `avlins`.'
  },
  complexity: [
    { case: 'Balanced tree', cost: 'makes about `log n` comparisons per insertion',
      why: 'The descent visits one node per level and a balanced tree of `n` nodes has about '
         + '`log n` levels.' },
    { case: 'Worst case, sorted input', cost: 'makes about `n` comparisons per insertion, and about '
          + '`n^2 / 2` in total to build the tree',
      why: 'Each value is larger than every node already present, so it descends the whole right '
         + 'chain; the chain grows by one node per insertion.' },
    { case: 'Space', cost: 'one new node per insertion, plus recursion depth equal to the path '
          + 'length',
      why: 'Nothing is copied and no auxiliary structure is built; only the call stack grows, and '
         + 'it unwinds as the child pointers are reassigned.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one comparison or one attachment',
    columns: ['value being inserted', 'node compared', 'branch taken', 'tree after the step']
  },
  seeAlso: [
    { id: 'bstsearch', why: 'the identical descent without the attachment — the NULL it stops at is '
                          + 'where insertion would have put the node' },
    { id: 'bstlocal', why: 'the same value placed at the root instead of at a leaf, by rotating on '
                         + 'the way back up' },
    { id: 'bstrebalance', why: 'what the arrival-order shape costs, and the two policies for '
                             + 'repairing it' }
  ]
};

T.bstsearch = {
  coreInvariant:
    'Each comparison eliminates a whole subtree, permanently. That is sound only because the BST '
    + 'ordering property is a statement about entire subtrees and not merely about immediate '
    + 'children: if the value sought is smaller than this node, it is smaller than every value in '
    + 'the right subtree too, however deep. So the descent follows the one path the value could '
    + 'possibly lie on, which is why reaching NULL is a proof of absence rather than a failure to '
    + 'look hard enough.',
  mechanism:
    'A three-way comparison at each node and nothing written anywhere. Smaller takes the left '
    + 'pointer, larger takes the right, equal returns `true`, and a NULL pointer returns `false`. '
    + 'The recursion is a tail call carrying no accumulated state at all, which is why the same '
    + 'descent can be written as a `while` loop over a single pointer with no change in behaviour. '
    + 'The trace carries only the value sought and the value of the node it is standing on.',
  criticalInvariants: [
    { rule: 'Absence is established by reaching a NULL pointer, not by exhausting a comparison '
          + 'budget or running out of nodes to try.',
      because: 'The NULL reached is the single slot the value would have to occupy to satisfy '
             + 'every comparison made on the way down. Stopping earlier, or concluding absence '
             + 'from a mismatch at some node, proves nothing about the rest of the tree.' },
    { rule: 'The equality case is reached by taking neither comparison branch, and is tested last.',
      because: 'That ordering is what makes the cost two comparisons per node rather than three, '
             + 'and it is why a successful search still pays both tests at every node above the '
             + 'one it finds. Counting cost in node visits rather than comparisons avoids the '
             + 'confusion entirely.' },
    { rule: 'Each comparison is against the value of the node currently held, never against the '
          + 'root or against a remembered bound.',
      because: 'The decision at each level is local by design; that is what lets the function be '
             + 'written as one recursive call on a subtree with no extra parameters, and it is why '
             + 'the same body works on every subtree it reaches.' }
  ],
  examTraps: [
    { trap: 'Suspecting that a failed search might have missed a value sitting somewhere else in '
          + 'the tree.',
      instead: 'The ordering property makes the path unique: there is exactly one place a given '
             + 'value may be, and the descent goes there. No second pass is needed or possible.' },
    { trap: 'Reading "BST search is `O(log n)`" as a guarantee.',
      instead: 'It is `O(height)`. Height is about `log n` only when the tree is balanced; built '
             + 'from sorted input by plain insertion the tree is a chain and the identical code '
             + 'makes about `n` comparisons.' },
    { trap: 'Testing whether a tree is a BST by comparing each node only with its two children.',
      instead: 'That weaker test accepts trees that are not BSTs, and the search then fails on '
             + 'them. The property must hold against every value in each subtree, which is what '
             + 'makes the one-path argument work.' }
  ],
  recognition: {
    stateVariables: ['val', 'tree->value', 'return'],
    tell: 'A single pointer descending with a three-way comparison and nothing being written is '
        + 'BST search. The array version in `bin` does the same halving with `lo` and `hi` indices '
        + 'instead of pointers; if you see the tree being modified, or a node created at the NULL '
        + 'the descent reaches, you are watching insertion rather than search.'
  },
  complexity: [
    { case: 'Balanced tree', cost: 'visits about `log n` nodes, making about `2 log n` comparisons',
      why: 'One node per level and two value tests at each, with a balanced tree having about '
         + '`log n` levels.' },
    { case: 'Degenerate tree', cost: 'visits about `n` nodes',
      why: 'A chain has one node per level and `n` levels, so the search degrades to a linear '
         + 'scan of a linked list.' },
    { case: 'Space', cost: 'no allocation at all; `O(1)` written as a loop, or recursion depth '
          + 'equal to the path length',
      why: 'Nothing is stored per node visited — the node is compared and then forgotten — and the '
         + 'tree is never modified.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one node visited',
    columns: ['val', 'tree->value', 'comparison outcome', 'branch taken', 'return value']
  },
  seeAlso: [
    { id: 'bin', why: 'the same halving on a sorted array, where the midpoint index replaces the '
                    + 'node pointer' },
    { id: 'bstins', why: 'the same descent, where the NULL that ends a failed search is the slot '
                       + 'the new node fills' },
    { id: 'avldel', why: 'its search mode runs this descent under the AVL height ceiling, which is '
                       + 'what turns `O(height)` into a worst-case `O(log n)`' }
  ]
};

T.bsttrav = {
  coreInvariant:
    'All four traversals visit every node exactly once and differ only in WHEN a node is emitted '
    + 'relative to its two subtrees. In-order output is sorted not because anything sorts it but '
    + 'because the ordering property guarantees everything in the left subtree is smaller: '
    + 'emitting left, then the node, then right therefore emits increasing values at that node, '
    + 'and the same argument applies at every node of every subtree, so the whole sequence '
    + 'increases.',
  mechanism:
    'Pre-, in- and post-order are one recursive function with the visit statement in one of three '
    + 'positions, and the recursion\'s own call stack holds the path back to the root — nothing '
    + 'else is remembered. Level-order cannot be written that way at all: it needs an explicit '
    + 'queue, with the root enqueued and then a dequeue-visit-enqueue-children loop, because the '
    + 'nodes of one level have no ancestor-descendant relationship to drive a recursion. Heights '
    + 'and depths quoted on this topic are counted in EDGES: the root is at depth 0, a leaf has '
    + 'height 0, and the empty tree has height -1, which is what makes a leaf '
    + '`max(-1, -1) + 1 = 0`.',
  criticalInvariants: [
    { rule: 'The base case is the empty tree, not the leaf.',
      because: 'A leaf still makes both of its recursive calls, on its two NULL children, and the '
             + 'trace shows them happening. Testing for a leaf instead would need a NULL check at '
             + 'every call site rather than one at the top of the function, and would have to '
             + 'handle a node with one child as a special case.' },
    { rule: 'Level-order needs a queue; a stack will not do.',
      because: 'A queue releases nodes in the order they arrived, which keeps a whole level '
             + 'together before any of the next level is reached. Swapping in a stack produces a '
             + 'depth-first order instead, and the output is no longer grouped by level at all.' },
    { rule: 'Post-order is the only order in which a node may be destroyed rather than merely read.',
      because: 'The pointers to a node\'s children live inside that node, so once it is released '
             + 'there is no route to them. Reading in any of the four orders is safe; destroying '
             + 'is safe in exactly one.' }
  ],
  examTraps: [
    { trap: 'Expecting in-order to give sorted output from any binary tree.',
      instead: 'It sorts only because the BST ordering property holds. On an arbitrary binary '
             + 'tree, in-order is just one of the four visit orders and carries no sortedness at '
             + 'all.' },
    { trap: 'Trying to produce level-order from the recursive function by moving the visit '
          + 'statement.',
      instead: 'No position produces it. The three positions give pre-, in- and post-order; '
             + 'level-order is a different traversal with a different data structure.' },
    { trap: 'Reading a height as a count of nodes on the path.',
      instead: 'This tracer counts edges, so the node-counted figure is always one more. A leaf is '
             + '0 here and 1 under a node count; the empty tree is -1 here and 0 there.' }
  ],
  recognition: {
    stateVariables: ['node', 'output', 'the call stack (or, for level-order, the queue)', 'height'],
    tell: 'Three traversals that are the same code with the visit statement moved, and a fourth '
        + 'that carries a queue, are the tree traversals; the output column is the only thing that '
        + 'distinguishes the first three. If the node is being released rather than appended, you '
        + 'are in `bstfree`, which is post-order with `free` in place of visit.'
  },
  complexity: [
    { case: 'All four orders', cost: 'visits each node once, so `O(n)`',
      why: 'Every node is entered exactly once and does constant work beyond its two recursive '
         + 'calls; a tree of `n` nodes produces `2n + 1` calls in the recursive orders.' },
    { case: 'Space, recursive orders', cost: 'recursion depth equal to `height + 1`',
      why: 'Only the path from the root to the current node is on the stack, so about `log n` '
         + 'frames in a balanced tree and up to `n` in a chain.' },
    { case: 'Space, level-order', cost: 'the queue holds at most one whole level, up to about '
          + '`n / 2` nodes',
      why: 'The widest level of a tree can hold about half its nodes, and every node of it is '
         + 'queued before any is dequeued.' }
  ],
  convention: 'treeHeight',
  whatToDraw: {
    unit: 'one row = one call entered, one emptiness test or one node visited',
    columns: ['node', 'is the tree empty', 'position of the visit', 'output so far',
              'call stack or queue']
  },
  seeAlso: [
    { id: 'bstfree', why: 'post-order again, where the order is forced by memory safety rather '
                        + 'than chosen for its output' },
    { id: 'bfs', why: 'the same queue frontier on a graph, where visited marks are needed because '
                    + 'a node can be reached twice' },
    { id: 'bstins', why: 'how the arrival order produced the shape these traversals walk' }
  ]
};

T.bstdel = {
  coreInvariant:
    'Deletion must leave the in-order sequence exactly as it was apart from the removed value, and '
    + 'all three cases do precisely that. A node with at most one child is replaced by that child, '
    + 'which already sits where it belongs. A node with two children is replaced by the smallest '
    + 'value in its right subtree — its in-order successor — because that is the only value which '
    + 'can take the vacated position without any other node having to change side.',
  mechanism:
    'The descent finds the node, then three cases are tested in this order: `tree->left == NULL` '
    + 'takes `tree->right`; `tree->right == NULL` takes `tree->left`; otherwise `bstJoin` is '
    + 'called on the two subtrees. `bstJoin(t1, t2)` walks the left spine of `t2` keeping `curr` '
    + 'and `parent` in step until `curr->left` is NULL, so `curr` is the minimum of `t2`. It then '
    + 'unlinks `curr` with `parent->left = curr->right`, hangs the remains of `t2` on it with '
    + '`curr->right = t2`, hangs `t1` on `curr->left`, and returns `curr` as the new subtree root. '
    + 'When `t2` has no left child at all, `curr` IS `t2`, `parent` is NULL, and the tracer skips '
    + 'the `curr->right = t2` assignment — only `curr->left = t1` runs. The node found is then '
    + 'freed and the returned subtree is assigned back into the parent\'s child pointer.',
  criticalInvariants: [
    { rule: 'The replacement subtree is computed in full before `free(tree)` is called.',
      because: 'Building it reads `tree->left` and `tree->right` out of the node being removed. '
             + 'Freeing first leaves those two reads looking at released memory, which commonly '
             + 'appears to work and then corrupts the tree later.' },
    { rule: 'The two-child case must use the minimum of the right subtree, or symmetrically the '
          + 'maximum of the left — never an arbitrary descendant.',
      because: 'Only those two values sit immediately beside the removed one in the in-order '
             + 'sequence. Any other choice is larger than something it would end up above, or '
             + 'smaller than something it would end up below, and the ordering property breaks.' },
    { rule: 'The `parent != NULL` test inside `bstJoin` guards both re-linking writes.',
      because: 'When the successor is `t2` itself there is no parent to repair, and '
             + '`curr->right = t2` would point the node at itself. That self-loop makes the '
             + 'subtree cyclic, so a later traversal never terminates.' },
    { rule: 'Every recursive return must be stored back into the child pointer it came from.',
      because: 'The subtree root changes in the two-child case and in both one-child cases, so a '
             + 'discarded return leaves the parent pointing at the node that was just freed.' }
  ],
  examTraps: [
    { trap: 'Counting a leaf as a fourth, separate case.',
      instead: 'The first test is `tree->left == NULL`, which a leaf passes, so the replacement is '
             + 'simply `tree->right`, which is NULL. The leaf needs no code of its own.' },
    { trap: 'Copying the successor\'s value into the node and freeing the successor instead.',
      instead: 'That is what `avldel` does, and it is equally correct. This topic relinks pointers '
             + 'and frees the node that was found. Mixing the two gives a trace that frees the '
             + 'wrong node and reports the wrong replacement.' },
    { trap: 'Expecting the height to fall whenever a node is removed.',
      instead: 'It cannot rise — the join removes a node from the right subtree and promotes it, '
             + 'so neither side grows — but it need not fall either. Because the replacement is '
             + 'always drawn from the right, repeated deletion is asymmetric and leaves the tree '
             + 'leaning to the left over time.' },
    { trap: 'Assuming a value that is not present is an error case.',
      instead: 'The descent reaches NULL and the tree is returned unchanged, with nothing freed '
             + 'and nothing allocated.' }
  ],
  recognition: {
    stateVariables: ['curr', 'parent', 'the value being deleted', 'new (the replacement root)',
                     't1 and t2'],
    tell: 'A second walk that starts inside the right subtree and then only ever goes left is the '
        + 'successor hunt, and `curr` with `parent` moving in lockstep is the unlink. If instead a '
        + 'value is copied into the node that was found and the recursion restarts on the right '
        + 'subtree, you are in `avldel`; if balance factors appear on the unwind, likewise.'
  },
  complexity: [
    { case: 'Balanced tree', cost: 'visits about `2 log n` nodes',
      why: 'About `log n` to find the node, then up to `log n` more down the left spine of the '
         + 'right subtree to reach its minimum.' },
    { case: 'Degenerate tree', cost: 'visits about `n` nodes',
      why: 'The find alone walks the whole chain, and the spine walk adds to it.' },
    { case: 'Memory', cost: 'frees exactly one node, or none if the value is absent',
      why: 'The two-child case moves a node rather than copying a value, so the node removed is '
         + 'always the one whose value was deleted.' },
    { case: 'Space', cost: 'a handful of pointers plus recursion depth equal to the path length',
      why: 'No auxiliary structure is built; `curr`, `parent` and the replacement pointer are the '
         + 'whole working state.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one comparison, one join step or one pointer write',
    columns: ['value', 'node compared', 'case chosen', 'curr', 'parent', 'tree after the step']
  },
  seeAlso: [
    { id: 'avldel', why: 'the same removal with the successor\'s value copied down instead, and a '
                       + 'rebalance at every ancestor on the unwind' },
    { id: 'bsttrav', why: 'in-order is the sequence every one of the three cases has to preserve' },
    { id: 'bstfree', why: 'the other operation that calls `free`, where the order of the calls is '
                        + 'the whole lesson' }
  ]
};

T.bstfree = {
  coreInvariant:
    'A node may be released only after both of its subtrees have been released, because the only '
    + 'pointers to those subtrees live inside the node itself. Free the node first and the route '
    + 'to everything below it is gone, so those nodes can never be reclaimed. Post-order is '
    + 'therefore not a stylistic preference among the four traversals but the only one that is '
    + 'safe, and that is why the reason has to come before the procedure here: the order is forced '
    + 'by where the pointers live.',
  mechanism:
    'Two recursive calls, then one `free`. The emptiness test sits at the top of the function, so '
    + 'each node makes both calls whether or not the children exist and the NULL calls simply '
    + 'return — a three-node tree produces seven calls, four of them on NULL. The function takes '
    + 'the pointer by value, so it cannot set the caller\'s variable to NULL; after it returns the '
    + 'caller holds a pointer to released memory and is responsible for not using it.',
  criticalInvariants: [
    { rule: '`free(tree)` is the last statement, after both `bstFree` calls have returned.',
      because: 'The child pointers are read out of the node that is about to be released. Freeing '
             + 'first and then reading `tree->left` reads memory the allocator may already have '
             + 'reused, so the recursion descends into whatever now occupies it.' },
    { rule: 'The NULL test belongs at the top of the function, not at the two call sites.',
      because: 'One test covers both children of every node, including a node with one child, '
             + 'which otherwise needs a case of its own. It is also what makes the base case the '
             + 'empty tree rather than the leaf, matching the three reading traversals exactly.' },
    { rule: 'The caller\'s pointer is dangling the moment this function returns.',
      because: 'C passes the pointer by value, so no assignment inside the function can reach the '
             + 'caller\'s variable. Using the tree afterwards, or calling `bstFree` on it a second '
             + 'time, reads and releases memory that is no longer owned.' }
  ],
  examTraps: [
    { trap: 'Freeing the root first on the grounds that it owns the tree.',
      instead: 'Its own memory holds the only pointers to the children, so releasing it first '
             + 'loses them. Ownership runs downwards; destruction has to run upwards.' },
    { trap: 'Expecting fewer calls than nodes.',
      instead: 'There are exactly `2n + 1` calls for `n` nodes: one per node plus one for each of '
             + 'the `n + 1` NULL pointers. The trace shows the NULL calls as rows of their own.' },
    { trap: 'Assuming the function leaves the caller\'s pointer safe to test against NULL.',
      instead: 'It cannot change the caller\'s pointer. Set it to NULL yourself after the call if '
             + 'the variable is going to be reused.' }
  ],
  recognition: {
    stateVariables: ['tree (the node value, or NULL)', 'which of the two calls is being made',
                     'the release order'],
    tell: 'Two recursive calls followed by a single action at the node, with the action strictly '
        + 'after both, is post-order. Here the action is destructive, which is the only difference '
        + 'from `bsttrav` with post-order selected: that topic appends the same sequence to an '
        + 'output list instead of releasing it.'
  },
  complexity: [
    { case: 'Time', cost: 'makes exactly `2n + 1` calls and `n` calls to `free`, so `O(n)`',
      why: 'Every node and every NULL pointer is visited once, and each does constant work.' },
    { case: 'Space', cost: 'recursion depth equal to `height + 1`',
      why: 'Only the path to the node currently being released is on the stack, so about `log n` '
         + 'frames in a balanced tree and up to `n` in a chain — a deep enough chain can overflow '
         + 'the stack even though the algorithm is linear.' },
    { case: 'Memory', cost: 'releases exactly the `n` nodes that were allocated',
      why: 'Each node is freed once, after both of its subtrees, so nothing is missed and nothing '
         + 'is released twice.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one call entered or one node released',
    columns: ['tree (node or NULL)', 'which call is being made', 'node released',
              'remaining tree']
  },
  seeAlso: [
    { id: 'bsttrav', why: 'post-order as one of the four reading traversals, emitting the same '
                        + 'sequence this one destroys' },
    { id: 'bstdel', why: 'the other operation that frees, where exactly one node goes and the '
                       + 'replacement has to be computed first' }
  ]
};

/* ------------------------------------------------------------------ *
 * Balanced BSTs.                                                      *
 * ------------------------------------------------------------------ */

T.bstrotate = {
  coreInvariant:
    'A rotation rewires three pointers and changes nothing about the in-order sequence. That '
    + 'preservation is the entire reason rotations are legal: the tree before and after holds the '
    + 'same values in the same order, so every search still finds everything, and only the shape — '
    + 'and therefore the height — has moved. `rotateRight` promotes the left child; the old root '
    + 'becomes its right child and adopts the child\'s old right subtree, which is precisely the '
    + 'subtree whose values lie between the two nodes and so belongs between them either way.',
  mechanism:
    'Three assignments and a guard. `rotateRight` returns the tree untouched if `root` or '
    + '`root->left` is NULL, then sets `newRoot = root->left`, moves the middle subtree with '
    + '`root->left = newRoot->right`, closes the link with `newRoot->right = root`, and returns '
    + '`newRoot`. `rotateLeft` is the mirror image. Exactly one subtree changes parent — the '
    + 'middle one — and it moves to the side where its values still belong. The function returns '
    + 'the new subtree root because it has no way to reach the parent of the node it was given.',
  criticalInvariants: [
    { rule: 'The middle subtree is moved before the old root is attached.',
      because: '`newRoot->right = root` overwrites the very pointer that `root->left = '
             + 'newRoot->right` reads. Doing the two in the other order loses the whole middle '
             + 'subtree, and on a small tree the result can still look like a valid BST, so the '
             + 'mistake survives a casual check.' },
    { rule: 'The guard returns the tree unchanged when the child to be promoted is NULL.',
      because: 'There is nothing to promote, and reading `newRoot->right` would dereference NULL. '
             + 'The trace states whether the required child exists before any pointer is written, '
             + 'which is the order the code enforces.' },
    { rule: 'The caller must store the returned pointer in place of the node it passed in.',
      because: 'The function cannot reach the parent. A discarded return value leaves the parent '
             + 'pointing at the old root, which is now a child of a node that nothing points at, '
             + 'so part of the tree is unreachable while still being linked.' }
  ],
  examTraps: [
    { trap: 'Hoping a rotation can repair the ordering of a tree.',
      instead: 'It preserves the in-order sequence exactly. A tree that is not a BST before a '
             + 'rotation is not a BST after one; rotations change shape and nothing else.' },
    { trap: 'Losing the middle subtree while drawing the rewiring.',
      instead: 'Name it before writing anything. In `rotateRight` it is `newRoot->right` going in '
             + 'and `root->left` coming out — the one pointer that has two jobs.' },
    { trap: 'Expecting a rotation on a large subtree to cost more than on a small one.',
      instead: 'Three pointer writes, whatever the size. Only two nodes and one subtree pointer '
             + 'are touched, and no node below them is read, which is why the cost is `O(1)`.' }
  ],
  recognition: {
    stateVariables: ['root', 'newRoot', 'direction'],
    tell: 'Exactly one named temporary and three assignments, with no comparison and no recursion, '
        + 'is a single rotation. Comparisons or recursion around it mean you are inside something '
        + 'that calls these two functions unchanged: `bstpartition`, `bstlocal`, `avlins` or '
        + '`avldel` all do, which is why this is the one piece worth memorising exactly.'
  },
  complexity: [
    { case: 'Time', cost: 'three pointer writes and one comparison against NULL, so `O(1)`',
      why: 'Nothing below the two nodes is examined; the subtrees move as whole pointers.' },
    { case: 'Effect on height', cost: 'changes a subtree\'s height by at most one level',
      why: 'A right rotation lifts the left subtree one level and lowers the right one level, '
         + 'while the middle subtree stays at the same depth.' },
    { case: 'Space', cost: 'one temporary pointer',
      why: 'No allocation, no recursion and no copying — the nodes themselves are never moved in '
         + 'memory, only the pointers between them change.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one pointer write',
    columns: ['root', 'newRoot', 'pointer written', 'its new target', 'tree after the step']
  },
  seeAlso: [
    { id: 'bstpartition', why: 'rotations composed on the unwind, which is how a chosen node is '
                             + 'lifted all the way to the root' },
    { id: 'avlins', why: 'where the two balance factors decide which of these rotations to apply, '
                       + 'and whether one is enough' },
    { id: 'bstlocal', why: 'a rotation at every level of the unwind, to place a newly inserted '
                         + 'value at the root' }
  ]
};

T.bstpartition = {
  coreInvariant:
    '`partition(t, i)` brings the node at in-order index `i` to the root of `t` and leaves every '
    + 'other node in the same in-order position, because the only operation it performs is '
    + 'rotation and rotations preserve that order. It is therefore safe to use anywhere a '
    + 'particular node has to become the root: whatever shape comes back, it is guaranteed to be '
    + 'the same binary search tree holding the same values.',
  mechanism:
    'At each node, `leftSize = size(t->left)` is also the in-order index of the node itself within '
    + 'this subtree — that single observation is what makes a three-way test on the index work. If '
    + '`i` is less than `leftSize` the recursion goes left and a right rotation is applied on the '
    + 'way back up; if greater, the recursion goes right with the index re-based to '
    + '`i - leftSize - 1` and a left rotation is applied on the way back; if equal, this node is '
    + 'the one wanted and nothing happens. Each unwinding rotation lifts the target exactly one '
    + 'level, so after the last one it is the root of `t`.',
  criticalInvariants: [
    { rule: 'The index must be re-based as `i - leftSize - 1` when the recursion goes right.',
      because: '`i` counts from the start of this subtree\'s in-order sequence, and the right '
             + 'subtree\'s sequence begins after the whole left subtree — `leftSize` nodes — and '
             + 'after the node itself, which is one more. Dropping the `- 1` lands on the wrong '
             + 'node by one position at every level the recursion goes right.' },
    { rule: 'The rotations happen on the way back up, not on the way down.',
      because: 'Each rotation lifts the target one level, and there is nothing to lift until the '
             + 'descent has actually found it. Rotating on the way down would change the subtree '
             + 'sizes the remaining index arithmetic depends on.' },
    { rule: 'The unwinding rotation must promote the side the descent took: left means '
          + '`rotateRight`.',
      because: '`rotateRight` promotes the left child, which is where the target now sits. The '
             + 'other rotation would promote the subtree the target is not in, so the target would '
             + 'sink rather than rise and the in-order index would no longer be at the root.' }
  ],
  examTraps: [
    { trap: 'Treating `i` as a value to search for.',
      instead: 'It is a position in the in-order sequence. Index 0 is the smallest value in the '
             + 'subtree whatever that value happens to be, which is why the same index gives a '
             + 'different node on a tree holding different values.' },
    { trap: 'Assuming the size lookups are free.',
      instead: 'This tracer recomputes `size(t->left)` by counting nodes at every level. That is '
             + 'what makes a single partition expensive on a deep tree, and it is why storing a '
             + 'size field in each node is worth it: each lookup becomes one read.' },
    { trap: 'Expecting the rest of the tree to keep its shape.',
      instead: 'Only the in-order ORDER is preserved. Every node on the path from the root to the '
             + 'target changes depth, which is the point — that is how the target reaches the top.' }
  ],
  recognition: {
    stateVariables: ['i', 'leftSize', 't->item', 'root'],
    tell: 'An index compared against a subtree size, with the index shrinking whenever the '
        + 'recursion goes right, is partition. If the index is always `size(t)/2` and both '
        + 'subtrees are recursed into after the rotation, you are in `bstrebalance`; if a value '
        + 'rather than an index drives the descent, it is `bstlocal`.'
  },
  complexity: [
    { case: 'Rotations', cost: 'performs at most one rotation per level, so about `d` rotations for '
          + 'a target at depth `d`',
      why: 'Each level of the unwind lifts the target exactly one level, and only the levels the '
         + 'descent actually entered rotate.' },
    { case: 'Balanced tree with sizes recomputed by counting',
      cost: 'makes about `n` node visits',
      why: 'Counting `size(t->left)` costs about half the subtree at each level, and those halving '
         + 'counts sum to about `n` over the whole descent.' },
    { case: 'Degenerate tree with sizes recomputed by counting',
      cost: 'makes up to about `n^2` node visits',
      why: 'Each of the `n` levels counts a subtree of up to `n` nodes, which is the cost that '
         + 'storing a size field in each node removes.' },
    { case: 'Space', cost: 'recursion depth equal to the target\'s depth, and nothing else',
      why: 'No allocation and no auxiliary structure; the rotations rewire the nodes in place.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one size computation or one unwinding rotation',
    columns: ['node', 'i', 'leftSize', 'branch taken or rotation applied', 'tree after the step']
  },
  seeAlso: [
    { id: 'bstrotate', why: 'the exact three pointer writes each unwinding step performs' },
    { id: 'bstrebalance', why: 'this operation applied at the median index, recursively — which is '
                             + 'the whole of global rebalancing' },
    { id: 'bstlocal', why: 'the same descend-then-rotate-on-the-unwind shape, driven by a value '
                         + 'instead of an index' }
  ]
};

T.bstrebalance = {
  coreInvariant:
    'Both modes rest on one fact: `partition(t, size(t) / 2)` makes a median node the root, and '
    + 'because partition only rotates, what comes back is the same binary search tree with the '
    + 'same values in the same order. Applying it recursively therefore cannot break the ordering '
    + 'property and must leave every node size-balanced, because integer division puts '
    + '`floor(size/2)` nodes on the left and `size - 1 - floor(size/2)` on the right — a '
    + 'difference of 0 when the size is odd and 1 when it is even, so it can never reach 2.',
  mechanism:
    'Two different lessons share one operation. GLOBAL mode is the whole repair in one pass: '
    + 'return immediately if the size is 1 or less, otherwise partition around `size(t) / 2` and '
    + 'then rebalance both subtrees recursively. Every subtree is reached, so the result is '
    + 'size-balanced at every node and its height is `floor(log2 n)`. PERIODIC mode changes when '
    + 'rather than what: it inserts at a leaf exactly as ordinary insertion does, then tests '
    + '`size(t) mod k` and runs the identical global rebalance only when that is 0. This tracer '
    + 'fixes `k = 4`. Between triggers nothing at all is guaranteed — inserting 1 to 9 in '
    + 'ascending order reaches height 5 before the second trigger brings it back to 3.',
  criticalInvariants: [
    { rule: 'The argument passed is `size(t) / 2` under integer division, and it is an in-order '
          + 'index, not a value.',
      because: 'That index is what forces the two halves to differ by at most one node, which is '
             + 'the definition of size balance at that node. An index derived from the values '
             + 'would depend on what the values happen to be and would balance nothing.' },
    { rule: 'Both subtrees are rebalanced after the partition, never before.',
      because: 'The partition rearranges which nodes are in which subtree, so a subtree '
             + 'rebalanced first is immediately taken apart again. The order is what makes one '
             + 'pass sufficient.' },
    { rule: 'Periodic mode tests the size AFTER the insertion, and a value already present does '
          + 'not change the size.',
      because: 'Insertion returns the tree unchanged for a duplicate, so if the size was already a '
             + 'multiple of `k` the trigger fires again and a whole-tree rebuild runs that changes '
             + 'nothing. The trace shows exactly that happening, which is a property of testing '
             + 'the size rather than counting the insertions.' },
    { rule: 'Size balance is a condition on EVERY node, not on the root.',
      because: 'A leaf has two empty subtrees and so passes for free. In a degenerate tree every '
             + 'leaf passes while the root fails badly, so checking a sample of nodes proves '
             + 'nothing about the tree.' }
  ],
  examTraps: [
    { trap: 'Reading size balance as the AVL condition.',
      instead: 'Size balance counts NODES in the two subtrees of the same node; the AVL condition '
             + 'compares their HEIGHTS. Size balance everywhere is the stronger of the two and '
             + 'pins the height at `floor(log2 n)`, while an AVL tree need not be size-balanced at '
             + 'all — the seven-node minimum AVL tree of height 3 has four nodes on one side of '
             + 'its root and two on the other.' },
    { trap: 'Expecting the periodic tree to be balanced when the trace ends.',
      instead: 'It is repaired only at every k-th insertion. If the last insertion did not fire '
             + 'the trigger, the tree is left exactly as leaf insertion made it, and the final '
             + 'size-balance table says so.' },
    { trap: 'Treating periodic rebalancing as a different algorithm.',
      instead: 'The operation a trigger runs is the identical global rebalance. The only '
             + 'difference is when it runs, and `k` is the single tuning decision: small `k` means '
             + 'frequent expensive repairs and a tight height, large `k` means rare repairs and a '
             + 'looser one.' }
  ],
  recognition: {
    stateVariables: ['size', 'height', 'index', 'k', 'size mod k'],
    tell: 'An index of `size(t) / 2` with both subtrees recursed into afterwards is the global '
        + 'rebalance; a `size mod k` column sitting beside an insertion is periodic mode. If '
        + 'instead you see a balance factor printed beside each node and at most one rotation per '
        + 'insertion, you are watching `avlins`, which repairs by rotating rather than rebuilding.'
  },
  complexity: [
    { case: 'Global rebalance with subtree sizes stored',
      cost: 'does about `n log n` operations',
      why: 'Each of the about `log n` levels of the recursion partitions subtrees holding about '
         + '`n` nodes between them.' },
    { case: 'Global rebalance with sizes recomputed by counting',
      cost: 'costs more again, because each `size` call walks a whole subtree',
      why: 'The counting is repeated at every level of every partition rather than read from a '
         + 'field, which is the cost a stored size removes.' },
    { case: 'Periodic with period k', cost: 'runs one whole-tree rebuild per `k` insertions',
      why: 'The rebuild cost is spread over `k` cheap insertions, and in exchange the height is '
         + 'free to grow by up to `k - 1` levels between triggers, since each leaf insertion can '
         + 'add one level.' },
    { case: 'Never rebalancing', cost: 'ascending input gives height `n - 1`, so a search makes '
          + 'about `n` comparisons',
      why: 'Every value is larger than all before it, so each becomes the right child of the '
         + 'previous one and the tree is a chain.' }
  ],
  convention: 'treeHeight',
  whatToDraw: {
    unit: 'one row = one subtree partitioned (global mode), or one insertion and its trigger test '
        + '(periodic mode)',
    columns: ['value inserted or subtree root', 'size', 'index used or `size mod k`',
              'did a rebalance run', 'height after the step']
  },
  seeAlso: [
    { id: 'bstpartition', why: 'the single operation both modes are built from, and where the '
                             + 'index arithmetic comes from' },
    { id: 'avlins', why: 'the other answer to the same problem: fix the shape at every insertion '
                       + 'for the price of a stored height per node' },
    { id: 'bstins', why: 'the leaf insertion whose arrival-order shape this topic exists to '
                       + 'repair' }
  ]
};

T.bstlocal = {
  coreInvariant:
    '`insertAtRoot` finishes with the new value at the root and the tree still a binary search '
    + 'tree, because it performs an ordinary descent to find the leaf slot and then undoes its own '
    + 'descent with one rotation per level on the way back up. Every one of those rotations '
    + 'preserves the in-order sequence, so the ordering property is never at risk; and because the '
    + 'rotation at each level promotes the child the descent entered, the new node climbs back up '
    + 'exactly as far as it went down and lands at the root.',
  mechanism:
    'Recursive, and the rotation is the statement after the recursive call. A smaller value '
    + 'recurses left and then applies `rotateRight`, which promotes the left child; a larger value '
    + 'recurses right and then applies `rotateLeft`; an empty subtree allocates the node. '
    + 'Randomised insertion then chooses between this and ordinary leaf insertion by the test '
    + '`random() mod q < p`. This tracer turns that test into an input rather than calling a '
    + 'random generator, so a trace can be reproduced and compared; the rule being executed is '
    + 'still the probabilistic one. Choosing the leaf branch performs no rotation at all.',
  criticalInvariants: [
    { rule: 'The rotation at each level must promote the child the descent entered: left descent, '
          + '`rotateRight`.',
      because: '`rotateRight` promotes the left child, which is where the new node now sits. The '
             + 'other rotation promotes the subtree the new node is not in, so the value sinks '
             + 'instead of rising and never reaches the root.' },
    { rule: 'The rotation runs after the recursive call returns, not before it.',
      because: 'There is nothing to promote until the call has returned the subtree with the new '
             + 'node at its root. Rotating first would promote some existing node and the new '
             + 'value would be inserted into a different subtree than the comparisons chose.' },
    { rule: 'Every level must store the returned pointer back into its child pointer.',
      because: 'Each rotation changes the subtree root, so the level above has to accept a '
             + 'different pointer than it passed down. A discarded return leaves the parent '
             + 'pointing at a node that is now one level lower.' }
  ],
  examTraps: [
    { trap: 'Expecting root insertion to balance the tree.',
      instead: 'It buys recency, not balance: the most recently inserted value is at the root, and '
             + 'nothing about the procedure bounds the height. It changes which values are near '
             + 'the top, not how deep the tree is.' },
    { trap: 'Reading the traced random branch as a real coin toss.',
      instead: 'The branch is an input here so the trace is reproducible. What randomised '
             + 'insertion actually buys is that the shape depends on the coin rather than on the '
             + 'arrival order, so an adversarial order can no longer force a chain.' },
    { trap: 'Expecting the leaf branch to rotate as well.',
      instead: 'It is plain insertion: the value becomes a leaf and no rotation is performed, '
             + 'which is why the two branches of the random test produce such different shapes '
             + 'from the same value.' }
  ],
  recognition: {
    stateVariables: ['v', 'node', 'root'],
    tell: 'A descent driven by a VALUE, followed by one rotation at every level of the unwind, is '
        + 'root insertion. The same descend-and-rotate shape driven by an in-order INDEX is '
        + '`bstpartition`; driven by a balance factor, and firing at most once, it is `avlins`.'
  },
  complexity: [
    { case: 'Root insertion, balanced tree',
      cost: 'makes about `log n` comparisons and about `log n` rotations',
      why: 'One comparison per level on the way down and one rotation per level on the way back '
         + 'up, with each rotation costing three pointer writes.' },
    { case: 'Root insertion, degenerate tree', cost: 'makes about `n` comparisons and about `n` '
          + 'rotations',
      why: 'A chain has a level per node, and the new value has to be lifted through every level '
         + 'it descended.' },
    { case: 'The leaf branch of the random test', cost: 'no rotations at all',
      why: 'It is ordinary insertion; the node is attached where the descent stopped and nothing '
         + 'above it is touched.' },
    { case: 'Space', cost: 'one new node plus recursion depth equal to the path length',
      why: 'Each level holds only its own node pointer; the rotations rewire in place.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one comparison on the descent or one rotation on the unwind',
    columns: ['v', 'node', 'branch taken', 'rotation applied', 'tree after the step']
  },
  seeAlso: [
    { id: 'bstrotate', why: 'the three pointer writes each unwinding step performs, and the guard '
                          + 'that protects them' },
    { id: 'bstpartition', why: 'the same unwind-and-rotate structure driven by an in-order index, '
                             + 'which lifts an arbitrary node rather than a new one' },
    { id: 'bstins', why: 'the leaf insertion the other branch of the random test falls back to' }
  ]
};

/* ------------------------------------------------------------------ *
 * AVL trees.                                                          *
 * ------------------------------------------------------------------ */

T.avlheight = {
  coreInvariant:
    'Storing a height in every node is what makes the AVL condition readable in constant time, and '
    + 'the condition is what bounds the height. Write `N(h)` for the fewest nodes an AVL tree of '
    + 'height `h` can hold: the root\'s two subtrees differ in height by at most 1 and one of them '
    + 'must reach `h - 1`, so the thinnest possible tree is `N(h-1) + N(h-2) + 1`. That recurrence '
    + 'grows at least as fast as `2^(h/2)`, which forces `h <= 2 log2 n` — so the stored heights '
    + 'buy a WORST-case logarithmic depth, not an average-case one.',
  mechanism:
    '`height` is a field in the node and is counted in EDGES: a leaf is 0 and the empty tree is '
    + '-1, so `height(t) = max(height(t->left), height(t->right)) + 1` and `balance(t) = '
    + 'height(t->left) - height(t->right)`. This tracer computes them bottom-up in post-order, '
    + 'which is exactly why maintenance is cheap: one insertion can only change the heights on the '
    + 'path it descended, and a rotation only has to recompute two nodes — the original root first, '
    + 'then the new one. The module also derives the bound the field is for, shows the '
    + 'minimum-size shape the recurrence describes, and checks `n >= N(h)` against the tree on '
    + 'screen.',
  criticalInvariants: [
    { rule: 'The empty tree has height -1.',
      because: 'That is what makes a leaf `max(-1, -1) + 1 = 0`, and what makes the balance factor '
             + 'of a node with one leaf child `0 - (-1) = 1` rather than something else. The '
             + 'recurrence base cases `N(-1) = 0` and `N(0) = 1` come from the same convention.' },
    { rule: 'A height is recomputed from the two stored child heights, never by walking the '
          + 'subtree.',
      because: 'Reading two numbers is constant work per node, which is the entire reason the '
             + 'field exists. Recomputing by traversal would cost `O(n)` per node and the stored '
             + 'height would buy nothing at all.' },
    { rule: 'After a rotation the ORIGINAL root is recomputed before the new one.',
      because: 'The new root\'s height depends on the original root\'s, which has just become one '
             + 'of its children. Taking them in the other order reads a stale value and the error '
             + 'then propagates up every ancestor.' },
    { rule: '`n >= N(h)` is necessary for an AVL tree but not sufficient.',
      because: 'A tree can hold enough nodes for its height and still break the condition '
             + 'somewhere inside, so the balance factors are what decide. Having FEWER nodes than '
             + '`N(h)` is conclusive the other way: no AVL tree can have that shape.' }
  ],
  examTraps: [
    { trap: 'Counting height in nodes rather than edges.',
      instead: 'This tracer counts edges, so every stated height and every balance factor is one '
             + 'less than the node-counted figure. Which node is unbalanced and which rotation '
             + 'fixes it are identical under either count.' },
    { trap: 'Reading `h <= 2 log2 n` as the height a real AVL tree has.',
      instead: 'It is a ceiling on the worst case. The sharper constant is about 1.44, because '
             + '`N(h) = F(h+3) - 1` and the Fibonacci numbers grow like `phi^k` with `phi` about '
             + '1.618; either form is enough for `O(log n)`.' },
    { trap: 'Taking a balance factor as a difference of node counts.',
      instead: 'It is a difference of HEIGHTS. A node can carry four nodes on one side and two on '
             + 'the other and still be balanced — the seven-node minimum AVL tree of height 3 does '
             + 'exactly that at its root.' }
  ],
  recognition: {
    stateVariables: ['node', 'height(left)', 'height(right)', 'height', 'balance', 'n', 'N(height)'],
    tell: 'A pair of child heights combined by `max(...) + 1` at each node, computed in post-order '
        + 'so the children are always done first, is height maintenance. This topic only measures; '
        + 'if rotations fire as a consequence of what the numbers say, you are in `avlins` or '
        + '`avldel`.'
  },
  complexity: [
    { case: 'Reading a height or a balance factor', cost: 'one or two field reads, so `O(1)`',
      why: 'That constant-time read is precisely what the extra field in each node buys.' },
    { case: 'Refreshing heights after one insertion', cost: 'updates about `log n` nodes',
      why: 'Only the nodes on the descent path can have changed height, and the condition keeps '
         + 'that path about `log n` long.' },
    { case: 'The guarantee itself', cost: 'height at most about `1.44 log2 n`, and certainly at '
          + 'most `2 log2 n`',
      why: 'An AVL tree of `n` nodes and height `h` must satisfy `n >= N(h) >= 2^(h/2)`, which '
         + 'rearranges to the bound; every root-to-leaf descent therefore visits at most about '
         + '`log n` nodes.' }
  ],
  convention: 'treeHeight',
  whatToDraw: {
    unit: 'one row = one node, in post-order',
    columns: ['node', 'height(left)', 'height(right)', 'height', 'balance factor',
              'within plus or minus 1']
  },
  seeAlso: [
    { id: 'avlins', why: 'where a balance factor outside the range selects a rotation, and why one '
                       + 'is always enough' },
    { id: 'bsttrav', why: 'post-order as the traversal this bottom-up computation follows, with '
                        + 'the same edge-counted height' },
    { id: 'bstrebalance', why: 'the other way to bound the height — rebuild around medians instead '
                             + 'of rotating, and store sizes instead of heights' }
  ]
};

T.avlins = {
  coreInvariant:
    'One insertion can push at most one node\'s balance factor to 2 in magnitude, and a single '
    + 'rotation at the LOWEST such node restores that subtree to the height it had before the '
    + 'insertion. Because the height is restored rather than merely reduced, no ancestor above it '
    + 'can still be out of balance — which is why an AVL insertion never needs more than one '
    + 'rotation however tall the tree is, and why checking the balance at every level of the '
    + 'unwind costs almost nothing.',
  mechanism:
    'An ordinary BST insertion by value, with `avlRebalance(t)` on every return. `avlRebalance` '
    + 'reads `bal = height(t->left) - height(t->right)`: within plus or minus 1 the node is '
    + 'returned untouched. `bal > 1` means left-heavy, and the LEFT CHILD\'S own balance then '
    + 'decides between one rotation and two — if the child leans the other way, so '
    + '`balance(t->left) < 0`, the child is rotated left first to make both lean the same way, and '
    + 'then the node is rotated right. `bal < -1` is the mirror image. A value already present '
    + 'returns from the comparison immediately and skips the rebalance entirely.',
  criticalInvariants: [
    { rule: 'The second test reads the CHILD\'S balance factor, not the node\'s again.',
      because: 'A straight left-left lean is fixed by one rotation, while a left-right lean needs '
             + 'the child straightened first. Applying the single rotation to a left-right case '
             + 'moves the imbalance to the other side without reducing it, so the subtree is still '
             + 'out of balance and the tree is now wrong in a harder-to-see way.' },
    { rule: 'The rebalance runs on the way back up, after the recursive call.',
      because: 'Balance factors only change once the new node is actually in place, and they must '
             + 'be read from the bottom upward so the lowest offending node is the one found. '
             + 'Rotating at a higher ancestor first would not restore the height below it.' },
    { rule: 'A duplicate returns before any rebalance is attempted.',
      because: 'Nothing was inserted, so no height anywhere changed and there is nothing to '
             + 'repair. The early return is what makes re-inserting an existing value cost the '
             + 'descent and nothing more.' },
    { rule: 'The value returned by a rotation must be stored back into the parent\'s child '
          + 'pointer.',
      because: 'A rotation changes which node is the root of that subtree, so the level above has '
             + 'to accept a different pointer than it passed down or it keeps pointing into the '
             + 'middle of the rotated subtree.' }
  ],
  examTraps: [
    { trap: 'Expecting several rotations from one insertion.',
      instead: 'At most one rotation SITE fires per insertion. A double rotation is two pointer '
             + 'rewirings at one site, not two sites. Deletion is the operation that can rotate at '
             + 'several different ancestors.' },
    { trap: 'Choosing the rotation from the look of the diagram rather than from the two numbers.',
      instead: 'The node\'s own sign picks the side and the child\'s sign picks single or double. '
             + 'Both numbers are stated in the trace, so the choice is mechanical and needs no '
             + 'picture at all.' },
    { trap: 'Reading the balance factor with the opposite sign convention.',
      instead: 'Here it is left minus right, so a POSITIVE factor means left-heavy and is repaired '
             + 'by rotating RIGHT. Under the other sign convention every rotation name in a '
             + 'written answer comes out reversed.' }
  ],
  recognition: {
    stateVariables: ['v', 'node', 'bal'],
    tell: 'A balance factor printed at every node of the unwind, with at most one of them outside '
        + 'plus or minus 1, is AVL insertion. If several nodes rotate during one operation you are '
        + 'in `avldel`; if no balance factor appears anywhere and the new value ends up at the '
        + 'root, it is root insertion in `bstlocal`.'
  },
  complexity: [
    { case: 'Descent', cost: 'makes about `log n` comparisons',
      why: 'The condition holds the height at about `log n`, and the descent visits one node per '
         + 'level.' },
    { case: 'Rebalance', cost: 'reads about `log n` balance factors and performs at most one '
          + 'rotation of three pointer writes',
      why: 'Every level of the unwind is checked, but only the lowest offending node rotates, and '
         + 'restoring its height ends the matter.' },
    { case: 'Worst case overall', cost: '`O(log n)`, guaranteed rather than expected',
      why: 'That guarantee is the whole difference from a plain BST, where the same insertion '
         + 'costs about `n` comparisons on ascending input.' }
  ],
  convention: 'treeHeight',
  whatToDraw: {
    unit: 'one row = one comparison on the descent or one rebalance on the unwind',
    columns: ['v', 'node', 'bal', 'case (within range, left-left, left-right, right-right, '
            + 'right-left)', 'rotation applied', 'tree after the step']
  },
  seeAlso: [
    { id: 'avlheight', why: 'where the balance factor comes from and the height bound it buys' },
    { id: 'avldel', why: 'the same rebalance, but able to fire at several ancestors because a '
                       + 'rotation after a deletion can shorten the subtree' },
    { id: 'bstrotate', why: 'the exact pointer writes each single rotation makes, and the guard '
                          + 'that protects them' },
    { id: 'bstins', why: 'the identical descent with no rebalance, and the arrival-order shape '
                       + 'that results' }
  ]
};

T.avldel = {
  coreInvariant:
    'Deletion removes a value without disturbing the in-order order, and then has to restore the '
    + 'AVL condition on the way back up. The decisive difference from insertion is that a rotation '
    + 'after a deletion can leave the subtree SHORTER than it was rather than the same height, so '
    + 'repairing one node can unbalance its parent — which is why the rebalance must be attempted '
    + 'at every ancestor and why one deletion can rotate several times.',
  mechanism:
    'Three cases at the node found, tested in this order: `t->left` empty returns `t->right` after '
    + 'freeing; `t->right` empty returns `t->left` after freeing; two children take the minimum of '
    + 'the right subtree — the in-order successor — copy its VALUE into this node with '
    + '`t->item = successor`, and recursively delete the successor from the right subtree, where by '
    + 'construction it has no left child and so lands in one of the two easy cases. The node found '
    + 'is NOT freed; the duplicate deeper in the tree is. Every return then passes through '
    + '`avlRebalance`. The topic also carries a SEARCH mode, which runs the AVL search descent: it '
    + 'reads no height field and performs no rotation, because the AVL condition constrains the '
    + 'SHAPE of the tree and not its ORDER, so the search is the ordinary three-way BST descent '
    + 'running under a height ceiling.',
  criticalInvariants: [
    { rule: 'In the two-child case only the successor\'s VALUE moves; the node that is freed is '
          + 'the successor\'s own node, found by a second, shorter descent.',
      because: 'Copying the value turns a hard two-child case into an easy one-child case, and the '
             + 'successor is guaranteed to have no left child so the second delete terminates '
             + 'quickly. Relinking subtrees and freeing the node found is what `bstdel` does '
             + 'instead; both are correct, but mixing them gives a trace that frees the wrong '
             + 'node.' },
    { rule: '`avlRebalance` runs at every ancestor on the way up, not only at the node where the '
          + 'deletion happened.',
      because: 'A rotation can shorten the subtree it repairs, which changes the parent\'s balance '
             + 'factor and can push it outside the range. The trace shows one deletion rotating at '
             + 'two different ancestors, which cannot happen on an insertion.' },
    { rule: 'The successor is reached by going right once and then left until `t->left` is empty.',
      because: 'The in-order successor is the next value in the sequence, and it is the only value '
             + 'that can take the removed node\'s place without any other node changing side. '
             + 'Going left first, or stopping early, picks a value that is not adjacent in the '
             + 'order.' },
    { rule: 'The search mode must not consult the stored height.',
      because: 'The height field constrains shape, not order, so it says nothing about where a '
             + 'value is. The descent is the three-way comparison and nothing else; the height '
             + 'only bounds how many nodes that descent can visit.' }
  ],
  examTraps: [
    { trap: 'Expecting at most one rotation, by analogy with insertion.',
      instead: 'A deletion can cascade. Each rotation may shorten the subtree and hand the problem '
             + 'to the parent, so the rebalance has to be tried at every ancestor and up to about '
             + '`log n` rotations can fire.' },
    { trap: 'Taking the maximum of the right subtree, or the minimum of the left.',
      instead: 'The two legal choices are the MINIMUM of the right subtree and the MAXIMUM of the '
             + 'left; this tracer takes the first. Either is adjacent to the removed value in the '
             + 'in-order sequence, and nothing else is.' },
    { trap: 'Treating the second, recursive delete as something that could itself be arbitrarily '
          + 'expensive.',
      instead: 'The successor has no left child by construction, so it always lands in one of the '
             + 'two easy cases. That second descent costs at most the remaining height and frees '
             + 'exactly one node.' },
    { trap: 'Thinking the value copy breaks the ordering property.',
      instead: 'The copied value is the next one in the in-order sequence, so it is larger than '
             + 'everything in the left subtree and smaller than everything left in the right '
             + 'subtree once its own node is removed.' }
  ],
  recognition: {
    stateVariables: ['v', 'successor', 'node', 'bal',
                     'and in search mode: t->item, result, comparisons, height'],
    tell: 'A `successor` variable appearing beside the value being deleted is the two-child case, '
        + 'and balance factors printed on the unwind at several ancestors is AVL deletion rather '
        + 'than `bstdel`, which carries no balance column and uses `curr` and `parent` to relink '
        + 'instead. In search mode nothing is written at all and the tree is unchanged.'
  },
  complexity: [
    { case: 'Find and delete', cost: 'makes about `log n` comparisons down and about `log n` '
          + 'balance checks up',
      why: 'The height is held at about `log n` by the condition, and each level does constant '
         + 'work in both directions.' },
    { case: 'Rotations', cost: 'up to about `log n` in one deletion, against at most one for an '
          + 'insertion',
      why: 'A rotation that shortens the subtree can unbalance the parent, so the repair can '
         + 'propagate all the way to the root.' },
    { case: 'Search mode', cost: 'visits at most `height + 1` nodes, so at most about `log n`',
      why: 'The descent takes one node per level and the AVL ceiling bounds the number of levels; '
         + 'the identical descent on an unbalanced BST has no such ceiling and costs about `n` on '
         + 'an ascending-insertion chain.' },
    { case: 'Memory', cost: 'frees exactly one node per successful deletion, and none if the value '
          + 'is absent',
      why: 'The two-child case copies a value and then frees the successor\'s node, so one node '
         + 'leaves the tree however the case was decided.' }
  ],
  convention: 'treeHeight',
  whatToDraw: {
    unit: 'one row = one comparison, one case decision or one rebalance on the unwind',
    columns: ['v', 'node', 'case chosen or successor', 'bal', 'rotation applied',
              'tree after the step']
  },
  seeAlso: [
    { id: 'avlins', why: 'the same rebalance, where one rotation always ends the matter — the '
                       + 'contrast is the lesson' },
    { id: 'bstdel', why: 'the other way to remove a two-child node: relink the two subtrees with a '
                       + 'join and free the node that was found' },
    { id: 'avlheight', why: 'the height ceiling that makes both the descent and the unwind about '
                          + '`log n` long' },
    { id: 'bstsearch', why: 'the descent the search mode executes, with only the field names '
                          + 'changed' }
  ]
};

window.COMP2521RegisterTheory('trees', T);
})();
