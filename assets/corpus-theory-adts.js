/* corpus-theory-adts.js — theory entries for the adts area.
 *
 * SOURCE LABEL: TRACER-AUTHORED EXPLANATION. See the header of
 * corpus-theory.js for the schema, the provenance rule and the conventions
 * table. Entries are plain text; `backticks` become code spans and the panel
 * escapes everything else.
 *
 * Covers: abstract data types (adtarch, stack, queue, setadt), priority queues
 * and heaps (pqcompare, pq, heapify, heapsort), tries (trie), hash tables
 * (hash) and the hash applications (hashsetcounter, twosum, oddocc, anagram).
 *
 * Every index, cost and ordering claim below was checked against the frames
 * this tracer actually produces and against the source blocks it displays.
 * Two things are worth knowing before reading:
 *   - the heap index base is NOT uniform. The priority-queue ADT is 1-based
 *     (`items[0]` unused, parent `i / 2`, children `2i` and `2i + 1`). The
 *     heapify and heap-sort implementations are BOTH 0-based (root `items[0]`,
 *     children `2i + 1` and `2i + 2`, parent `(i - 1) / 2`), and in both of
 *     them `fixDown`'s `N` parameter is the index of the LAST item.
 *   - separate-chaining order here is ARRIVAL order: `doInsert` recurses to
 *     the end of the chain and the new node is appended at the tail. The
 *     supplemental resize then moves nodes by pushing each at the HEAD of its
 *     new chain, which reverses order within a chain. Each entry states what
 *     the tracer does rather than relying on the convention card.
 */
(function () {
'use strict';
const T = {};

/* ------------------------------------------------------------------ *
 * Abstract data types                                                 *
 * ------------------------------------------------------------------ */

T.adtarch = {
  coreInvariant:
    'A client that includes the header can name the handle type and call the documented '
    + 'operations, but it cannot dereference the handle, because the concrete `struct` is defined '
    + 'only in the implementation file. That one-way visibility is what makes the two halves '
    + 'independent: every fact the client is allowed to rely on has to be written down in the '
    + 'interface, and anything not written down — the field names, the layout, whether a size is '
    + 'stored or counted — the implementation is free to change without a line of client code '
    + 'moving. It also means the implementation is the only code that CAN break the structure\'s '
    + 'internal consistency, which is why the constructor must establish every invariant and each '
    + 'operation must restore it before it returns.',
  mechanism:
    'Three files carry three different responsibilities. The header holds a forward declaration '
    + 'such as `typedef struct stack *Stack;` — legal precisely because a pointer to an incomplete '
    + 'type has a known size — and then the prototypes together with their behaviour, their inputs '
    + 'and outputs and their usage conditions. The implementation file defines `struct stack` and '
    + 'every operation. The client includes only the header. The handle is therefore opaque and '
    + 'the compiler itself enforces the boundary, rather than a convention that a careless caller '
    + 'can ignore. Constructors allocate and establish the invariants; destructors release '
    + 'everything the structure owns, which is the whole reason a `Free` operation has to exist at '
    + 'all.',
  criticalInvariants: [
    { rule: 'The concrete `struct` is defined in the implementation file and never in the header.',
      because: 'If the definition is visible then client code can read the fields directly, and '
             + 'eventually will. Every such read becomes a dependency on the layout, so the '
             + 'representation can no longer be changed without breaking callers — which is '
             + 'exactly the property the opaque pointer was bought for.' },
    { rule: 'A documented precondition, such as an operation that assumes the structure is not '
          + 'empty, is part of the contract and the caller is responsible for it.',
      because: 'The implementation is entitled to rely on it. The stack and queue here do check '
             + 'the empty case and report an error, but a precondition the caller ignores is a '
             + 'caller defect, not an implementation defect. Deciding who is answerable for what '
             + 'is the job the contract does, and an interface without it is incomplete.' },
    { rule: 'Every allocation the constructor makes is released by the destructor, including the '
          + 'structure itself and everything it points at.',
      because: 'The client cannot see the internal allocations, so it cannot possibly release '
             + 'them. Ownership passes to the ADT, and only the implementation knows how many '
             + 'blocks exist — the stack frees every node and then the `struct stack`, in that '
             + 'order, because the nodes are only reachable through it.' }
  ],
  examTraps: [
    { trap: 'Treating the handle as if it were the structure, and expecting `sizeof` or field '
          + 'access to work on it.',
      instead: 'The handle is a pointer to an incomplete type. Its own size is known; the size and '
             + 'shape of its target are not. Only the implementation file can dereference it.' },
    { trap: 'Moving the `struct` definition into the header so that test code can reach the fields.',
      instead: 'That is the leak the architecture exists to prevent. Expose another operation '
             + 'instead: the interface is the only supported way in, and widening it is a '
             + 'deliberate decision rather than an accident.' },
    { trap: 'Reading an interface as a list of function names.',
      instead: 'An interface is names plus behaviour plus preconditions plus ownership. An '
             + 'operation documented without its usage conditions is an incomplete interface, '
             + 'whatever its signature says.' }
  ],
  recognition: {
    stateVariables: ['the opaque handle type (`Stack`, `Queue`, `Pq`)',
                     'the hidden `struct` definition and its fields',
                     'the documented preconditions and ownership rules'],
    tell: 'If the code in front of you can name a field, you are inside the implementation; if it '
        + 'can only call operations, you are in the client. The question to ask of any single line '
        + 'is which side of the boundary it sits on, because that decides whether it is entitled '
        + 'to assume anything at all about the representation.'
  },
  complexity: [
    { case: 'Cost of an operation', cost: 'set entirely by the representation, never by the interface',
      why: 'The same Set interface costs about `n` steps per membership test over a linked list and '
         + 'about one step over a hash table. The interface fixes what is callable; it says nothing '
         + 'about what it costs.' },
    { case: 'Cost of changing the representation', cost: 'one file, if the boundary held',
      why: 'No client reads a field, so swapping an array for a linked list recompiles the '
         + 'implementation alone. A leaked `struct` turns the same change into work in every caller.' },
    { case: 'Space', cost: 'one handle per structure in the client, plus whatever the implementation allocates',
      why: 'The client stores a single pointer. Everything else lives behind it and is accounted '
         + 'for by the implementation that allocated it.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one layer of the visibility boundary',
    columns: ['layer', 'what it can name', 'what it cannot touch', 'what it is responsible for']
  },
  seeAlso: [
    { id: 'stack', why: 'the smallest complete example of the boundary: handle, hidden struct, '
                      + 'constructor and destructor' },
    { id: 'setadt', why: 'one interface over five representations, which is the payoff the '
                       + 'boundary buys' },
    { id: 'queue', why: 'a second structure behind the same pattern, with one more field that has '
                      + 'to be kept consistent' }
  ]
};

T.stack = {
  coreInvariant:
    '`s->head` always points at the most recently pushed node that has not yet been popped, and '
    + '`s->size` always equals the number of nodes reachable from it. Because a push links the new '
    + 'node IN FRONT OF the current head and a pop unlinks exactly the head, the list sits in '
    + 'reverse arrival order at every moment — which is what makes the structure last-in-first-out '
    + 'with no search and no comparison anywhere in it. Nothing in the implementation ever walks '
    + 'past the first node except the destructor.',
  mechanism:
    'A push allocates a node, writes the item, then performs two pointer writes in a fixed order: '
    + '`new->next = s->head` followed by `s->head = new`, and finally `s->size++`. A pop saves '
    + '`newHead = s->head->next` and the item out of the head node BEFORE `free(s->head)`, then '
    + 'sets `s->head = newHead` and decrements the size. Peek reads `s->head->item` and writes '
    + 'nothing at all. The destructor walks the list with `temp = curr; curr = curr->next; '
    + 'free(temp)` and then frees the `struct stack`, so the per-node allocations and the '
    + 'structure are released in that order.',
  criticalInvariants: [
    { rule: 'In the push, `new->next = s->head` runs before `s->head = new`.',
      because: 'Writing the head first makes `s->head` point at the new node while `new->next` is '
             + 'still uninitialised, and at that instant the old list is unreachable from '
             + 'anywhere. Every node already on the stack leaks and the next pop follows a wild '
             + 'pointer. The two writes look interchangeable and are not.' },
    { rule: 'In the pop, `newHead` and the item are both read out of the head node before '
          + '`free(s->head)`.',
      because: 'After the free the node must not be dereferenced, so reading `->next` or `->item` '
             + 'from it afterwards is undefined behaviour. It usually appears to work, because the '
             + 'freed memory still holds the old bytes, and that is exactly what lets the defect '
             + 'survive testing and fail later under load.' },
    { rule: '`s->size` is updated in the same operation that changes the list.',
      because: 'Both the pop guard and the peek guard are written as `s->size == 0`, not as '
             + '`s->head == NULL`. A size that has drifted from the list makes the guard answer a '
             + 'question about the wrong thing, and a pop on what the size thinks is a non-empty '
             + 'stack then dereferences NULL.' },
    { rule: 'The destructor advances `curr` before freeing the node it was pointing at.',
      because: '`temp = curr; curr = curr->next; free(temp)` is the only safe order. Freeing first '
             + 'and then reading `curr->next` out of the freed node loses the rest of the list, so '
             + 'every node after the first leaks.' }
  ],
  examTraps: [
    { trap: 'Reading the `0` that the pop returns on an empty stack as a real item.',
      instead: 'It is an error value printed alongside a message, and `0` is also a perfectly '
             + 'legal item to store. The caller has to test the size first; one return value '
             + 'cannot carry both meanings.' },
    { trap: 'Expecting peek to remove anything.',
      instead: 'Peek reads `s->head->item` and leaves every pointer and the size untouched. Only '
             + 'the pop frees a node, and only the pop changes the head.' },
    { trap: 'Walking the nodes to answer the size query.',
      instead: 'The size is stored, so the query is a single field read. That is the reason the '
             + 'field exists: counting the list would cost about `n` steps on every call.' }
  ],
  recognition: {
    stateVariables: ['`s->head`', '`s->size`',
                     'the node being linked or released (`new`, `newHead`, `temp`)'],
    tell: 'One pointer into the list, with every insertion and every removal happening at that '
        + 'same end, is a stack. A queue carries a second pointer named `tail` and inserts there '
        + 'while removing at the head. If a trace only ever touches one end, pushes and pops '
        + 'cannot be told apart by position — only by the order items come back out.'
  },
  complexity: [
    { case: 'Push', cost: 'one allocation and two pointer writes, so a constant number of steps',
      why: 'Nothing is searched for: the new node goes in front of the current head however many '
         + 'nodes already exist.' },
    { case: 'Pop and peek', cost: 'a constant number of steps',
      why: 'Both touch the head node alone, so the cost does not grow with the number of items '
         + 'held.' },
    { case: 'Free', cost: 'releases each of `n` nodes once, so about `n` steps',
      why: 'The walk visits every node exactly once. This is the only operation whose cost depends '
         + 'on how much the stack holds.' },
    { case: 'Space', cost: 'one node per item plus the `struct stack`',
      why: 'Every item carries its own `next` pointer. That is the price of growing without a '
         + 'capacity limit and without ever copying the contents to a bigger array.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one operation, or one pointer write inside it',
    columns: ['operation', 's->head', 's->size', 'nodes from head to NULL', 'allocated or freed']
  },
  seeAlso: [
    { id: 'queue', why: 'the same node type and the same lifecycle with a tail pointer, which '
                      + 'isolates exactly what the second pointer buys and costs' },
    { id: 'dfsiter', why: 'a stack doing the work it exists for: the explicit stack that turns '
                        + 'recursive depth-first search into a loop' },
    { id: 'adtarch', why: 'why the `struct stack` is invisible to the caller in the first place' }
  ]
};

T.queue = {
  coreInvariant:
    '`q->head` is the oldest node still present and `q->tail` is the newest; every node is '
    + 'reachable from the head by following `next`, and `q->size` is that count. Because an '
    + 'enqueue links at the tail and a dequeue unlinks the head, arrival order is preserved '
    + 'exactly, which is what makes the structure first-in-first-out. Holding BOTH ends is what '
    + 'keeps both operations constant-time: with only a head pointer, an enqueue would have to '
    + 'walk the whole list to find where to attach.',
  mechanism:
    'A helper allocates each node with `next = NULL`. The enqueue tests `q->size == 0`: on an '
    + 'empty queue it sets `q->head = n`, otherwise it sets `q->tail->next = n`; then BOTH '
    + 'branches fall through to `q->tail = n` and `q->size++`. The dequeue saves `newHead = '
    + 'q->head->next` and the item, frees the head node, sets `q->head = newHead`, and then — the '
    + 'step that is easy to leave out — sets `q->tail = NULL` if `newHead` was NULL, before '
    + 'decrementing the size. Peek reads `q->head->item` and changes nothing. The destructor walks '
    + 'with `temp`/`curr` and then frees the `struct queue`.',
  criticalInvariants: [
    { rule: 'When a dequeue empties the queue, `q->tail` must be set to NULL as well.',
      because: 'Otherwise `tail` keeps pointing at the node that has just been freed, and the next '
             + 'enqueue takes the non-empty branch and writes `q->tail->next` through a dangling '
             + 'pointer. The queue looks perfectly healthy until the first enqueue AFTER it '
             + 'empties, which is why this is the one bug every queue implementation has to be '
             + 'checked for.' },
    { rule: 'The enqueue sets `q->tail = n` on both branches, including the very first insertion.',
      because: 'On an empty queue the single node is simultaneously the head and the tail. Setting '
             + 'only the head leaves `tail` NULL, and the second enqueue then dereferences NULL '
             + 'rather than linking.' },
    { rule: 'The item and `head->next` are both read before `free(q->head)`.',
      because: 'After the free the node must not be dereferenced. Reading the item afterwards is '
             + 'undefined behaviour that usually returns the right value anyway, because the bytes '
             + 'are still there, so it passes every test and fails in production.' },
    { rule: '`q->size` is the authority on emptiness, because both guards test it.',
      because: 'The implementation checks `q->size == 0` rather than `q->head == NULL`. If the '
             + 'size and the list ever disagree, the empty branch of the enqueue fires on a '
             + 'non-empty queue and overwrites `q->head`, which loses every node already queued '
             + 'in one assignment.' }
  ],
  examTraps: [
    { trap: 'Assuming the tail pointer makes removal from the tail cheap as well.',
      instead: 'Removing the tail needs the node BEFORE it, and these nodes carry only a forward '
             + '`next`. Finding the predecessor costs about `n` steps, which is why the interface '
             + 'offers no such operation at all.' },
    { trap: 'Reading the dequeue on an empty queue as returning a valid item.',
      instead: 'It prints an error and returns `0`, which is indistinguishable from a stored `0`. '
             + 'Test the size before dequeuing; the return value cannot be made to carry both '
             + 'meanings.' },
    { trap: 'Expecting the trace to touch `tail` on every dequeue.',
      instead: '`tail` changes on a dequeue only when the queue becomes empty. Every other dequeue '
             + 'leaves it alone, and that single special case is the whole difficulty of the '
             + 'structure.' }
  ],
  recognition: {
    stateVariables: ['`q->head`', '`q->tail`', '`q->size`', '`newHead` inside the dequeue'],
    tell: 'Two pointers into one singly linked list, with insertions at one named end and removals '
        + 'at the other, is a queue. A stack keeps one pointer and uses one end for both. If items '
        + 'come back out in the order they went in, it is a queue whatever the fields happen to be '
        + 'called.'
  },
  complexity: [
    { case: 'Enqueue', cost: 'one allocation and at most three pointer writes, a constant number of steps',
      why: 'The tail pointer removes the walk to the end of the list. Without it the same operation '
         + 'would cost about `n` steps.' },
    { case: 'Dequeue and peek', cost: 'a constant number of steps',
      why: 'Both work on the head node alone, and the tail fix-up is a single test and at most one '
         + 'assignment.' },
    { case: 'Free', cost: 'releases each of `n` nodes once, so about `n` steps',
      why: 'Every node is visited exactly once by the walk, and nothing is visited twice.' },
    { case: 'Space', cost: 'one node per item plus the `struct queue`',
      why: 'Each item carries a `next` pointer and nothing is preallocated, so there is no capacity '
         + 'to exceed and no resize to amortise.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one operation, or one pointer write inside it',
    columns: ['operation', 'q->head', 'q->tail', 'q->size', 'nodes head to tail', 'allocated or freed']
  },
  seeAlso: [
    { id: 'stack', why: 'the same node type with one end and one pointer, which is the clean '
                      + 'control for what the tail changes' },
    { id: 'bfs', why: 'a queue doing the work it exists for: the distance-ordered frontier of '
                    + 'breadth-first search' },
    { id: 'pq', why: 'what replaces the queue when arrival order is the wrong order to serve in' }
  ]
};

T.setadt = {
  coreInvariant:
    'A Set holds DISTINCT items and promises no order the client may rely on. Distinctness is the '
    + 'whole constraint: it means every insertion is a membership test followed, only when the '
    + 'item turns out to be absent, by a store. That is why no representation\'s insert can be '
    + 'cheaper than its own membership test, and it is what the cost table is really measuring. '
    + 'Because no order is promised, the representation is free to impose whichever one suits it, '
    + 'which is what lets five structures sit behind one interface.',
  mechanism:
    'One interface — create, free, insert, membership, delete, size and show — over a choice of '
    + 'representation, and the choice is the content. This tracer sets out five. An unordered '
    + 'array costs about `n` for insert, membership and delete alike. An ordered array costs about '
    + '`n` to insert, about `log n` for membership by binary search, and about `n` to delete. A '
    + 'linked list costs about `n` throughout. An AVL tree costs about `log n` for all three. A '
    + 'hash table costs about one step for all three on average. No concrete implementation is '
    + 'traced, because there is nothing to trace: the decision is the subject.',
  criticalInvariants: [
    { rule: 'Insertion has to establish distinctness, so it contains a membership test.',
      because: 'Without it the same item can be stored twice, the size stops counting distinct '
             + 'items, and a single delete leaves a duplicate behind so membership still reports '
             + 'true. This is the structural reason no row in the table has an insert cheaper than '
             + 'its own membership cost.' },
    { rule: 'The interface promises no order, so a client must not depend on the order items are '
          + 'shown in.',
      because: 'The order is a property of the representation: arrival order in a list, key order '
             + 'in an ordered array or an AVL tree, and hash order in a hash table, which is '
             + 'neither. Code that relies on it breaks the moment the representation is swapped — '
             + 'and permitting that swap is the entire reason the interface exists.' },
    { rule: 'The ordered array\'s `log n` membership test is paid for at every insertion.',
      because: 'Binary search is only valid while the array is sorted, and keeping it sorted means '
             + 'an insertion shifts about half the elements. Nothing in the table is free: each '
             + 'row trades one operation against another, and reading a row without its price is '
             + 'how the wrong structure gets chosen.' }
  ],
  examTraps: [
    { trap: 'Reading the hash table\'s constant membership cost as a guarantee.',
      instead: 'It is an average, and it assumes a hash that spreads keys and a load factor kept '
             + 'bounded. A poor hash or one long chain drags it towards about `n`. The AVL tree\'s '
             + '`log n` is the figure that holds in the worst case.' },
    { trap: 'Expecting the ordered array to win overall because its search is fast.',
      instead: 'Its insert and delete are still about `n` because of the shifting. A representation '
             + 'is chosen for the mix of operations a workload actually performs, not for its best '
             + 'single row.' },
    { trap: 'Reading a linked list as cheaper than an unordered array because insertion needs no '
          + 'shifting.',
      instead: 'The distinctness test dominates both: each must walk about `n` items before it can '
             + 'store anything. The list\'s real advantage is growing without a capacity, not '
             + 'speed.' }
  ],
  recognition: {
    stateVariables: ['the item being inserted, tested or deleted',
                     'the number of distinct items currently held',
                     'the representation underneath and its own position state — an index, a node '
                     + 'pointer or a slot'],
    tell: 'If a repeated item is absorbed rather than stored, you are looking at a Set; if repeats '
        + 'accumulate a count, it is a Counter; if a value travels alongside each key, it is a '
        + 'map. A Set imposes no order, so a listing that comes out sorted is telling you which '
        + 'representation is underneath rather than anything about the Set itself.'
  },
  complexity: [
    { case: 'Unordered array or linked list', cost: 'about `n` steps for insert, membership and delete',
      why: 'All three begin by scanning for the item, and there is nothing in the layout that can '
         + 'narrow the scan.' },
    { case: 'Ordered array', cost: 'about `log n` comparisons for membership, about `n` moves for '
          + 'insert and delete',
      why: 'Binary search exploits the order; maintaining the order costs a shift of about half the '
         + 'array on every change.' },
    { case: 'AVL tree', cost: 'about `log n` steps for all three',
      why: 'The height is held proportional to `log n`, so each operation follows one root-to-leaf '
         + 'path. This is a worst-case bound rather than an average.' },
    { case: 'Hash table', cost: 'about one step for all three on average',
      why: 'A hash that spreads keys leaves each item in a short chain, so the work is computing '
         + 'the slot. It is an average and it degrades as the load factor rises.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one representation',
    columns: ['representation', 'insert', 'membership', 'delete', 'what it costs you']
  },
  seeAlso: [
    { id: 'hash', why: 'the representation that supplies the constant-average row, with the chains '
                     + 'and load factor that make or break it' },
    { id: 'avlins', why: 'the representation whose `log n` holds even in the worst case' },
    { id: 'hashsetcounter', why: 'the same hash table driven as a Set and as a Counter, which is '
                               + 'this interface in use' },
    { id: 'bin', why: 'the binary search that gives the ordered array its one fast row' }
  ]
};

/* ------------------------------------------------------------------ *
 * Priority queues and heaps                                           *
 * ------------------------------------------------------------------ */

T.pqcompare = {
  coreInvariant:
    'A priority queue is defined by what comes OUT, not by what order went in: a delete must '
    + 'return an item of maximum priority, and this tracer treats a larger priority value as the '
    + 'higher priority. Every representation keeps just enough order to answer that one question, '
    + 'which is why the cost table splits so sharply. A representation that sorts on the way in '
    + 'pays at the insertion and gets the delete for nothing; one that stores arrivals as they '
    + 'come pays at the delete. The heap is the row where neither side pays in full, because the '
    + 'order it maintains is weaker than sorting and still strong enough to put the maximum at a '
    + 'known place.',
  mechanism:
    'Five choices, measured on insert, delete-maximum, peek-maximum and the emptiness test. An '
    + 'unordered array or list inserts in one step and then scans about `n` items to find the '
    + 'maximum, so delete and peek both cost the scan. An ordered array or list spends about `n` '
    + 'steps placing each insertion and then finds the maximum at a known end in one step. A '
    + 'binary max heap costs about `log n` for insert and for delete, one step for peek, and keeps '
    + 'only a PARTIAL order: each parent at least its children, with nothing promised between '
    + 'siblings or across subtrees. Completeness is what lets the tree live in a flat array with '
    + 'no pointers: for a 1-indexed item `i` the left child is `2i`, the right child is `2i + 1` '
    + 'and the parent is `i / 2`. Every row answers emptiness in one step, because all five store '
    + 'a count.',
  criticalInvariants: [
    { rule: 'A heap is partially ordered, not sorted: each parent dominates its children and '
          + 'nothing is promised between siblings or across subtrees.',
      because: 'The weaker order is the entire saving. Maintaining a full order costs about `n` '
             + 'moves per insertion, while the heap property can be restored along a single '
             + 'root-to-leaf path, which is why both insert and delete come out at about `log n`. '
             + 'It also means reading a heap\'s array left to right does not give sorted output.' },
    { rule: 'The array navigation is valid only because the heap is a COMPLETE tree.',
      because: '`2i`, `2i + 1` and `i / 2` work as child and parent arithmetic only when every '
             + 'level except the last is full and the last fills from the left. A gap anywhere '
             + 'breaks the arithmetic for every node after it, which is why an insertion must go '
             + 'at the next free position and a deletion must refill the hole from the last '
             + 'position.' },
    { rule: 'Peek costs one step in every row except the unordered ones.',
      because: 'Wherever some order is maintained the maximum sits in a known place — the end of '
             + 'an ordered array, the head of an ordered list, the root of a heap. Where no order '
             + 'is maintained, finding the maximum is the same scan as removing it, so peek '
             + 'inherits the cost of the delete.' }
  ],
  examTraps: [
    { trap: 'Treating a priority queue as a queue that happens to be sorted.',
      instead: 'It is not a queue at all. Arrival order is not preserved and items of equal '
             + 'priority come out in no promised order. Only the maximum-priority item is '
             + 'determined at any moment.' },
    { trap: 'Reading the ordered array\'s one-step delete as making it the best choice.',
      instead: 'Its insertion costs about `n` moves. Across a mixed workload the heap\'s `log n` '
             + 'for both operations wins; the ordered array only pays off when deletions vastly '
             + 'outnumber insertions.' },
    { trap: 'Reading a heap\'s array in index order as a sorted list.',
      instead: 'Index order is LEVEL order. The maximum is at the root, but the array between the '
             + 'root and the last level is not sorted, and the second-largest item is only '
             + 'guaranteed to be one of the root\'s two children.' }
  ],
  recognition: {
    stateVariables: ['the priority of the item entering or leaving',
                     'where the maximum currently lives — an end, a head or the root',
                     'the count of items, and for a heap the index of the last occupied position'],
    tell: 'If insertion is the cheap operation and removal is the expensive one, no order is being '
        + 'maintained. If it is the other way round, full order is. If neither is cheap and '
        + 'neither costs about `n`, a partial order is being maintained and you are looking at a '
        + 'heap. Watching which operation pays for the scan identifies the representation without '
        + 'reading a line of the code.'
  },
  complexity: [
    { case: 'Unordered array or list', cost: 'insert one step; delete-maximum and peek about `n` comparisons',
      why: 'The insertion appends or pushes with no search at all, but the maximum can be anywhere, '
         + 'so finding it examines every item.' },
    { case: 'Ordered array or list', cost: 'insert about `n` steps; delete-maximum and peek one step',
      why: 'The insertion finds its position and, in the array, shifts everything after it. The '
         + 'maximum is then permanently at a known end.' },
    { case: 'Binary max heap', cost: 'insert and delete-maximum about `log n` comparisons; peek one step',
      why: 'Both operations walk a single path between the root and the last level, and a complete '
         + 'tree over `n` items has height about `log n`. The root is the maximum by the heap '
         + 'property, so peek needs no search.' },
    { case: 'Emptiness test', cost: 'one step in every representation',
      why: 'All five store a count, so the test is a field read rather than any inspection of the '
         + 'items.' }
  ],
  convention: 'heapIndexing',
  whatToDraw: {
    unit: 'one row = one representation',
    columns: ['representation', 'insert', 'delete maximum', 'peek maximum', 'where the maximum lives']
  },
  seeAlso: [
    { id: 'pq', why: 'the binary heap of this table, built and emptied one operation at a time' },
    { id: 'heapify', why: 'building the heap property over a whole array at once instead of one '
                        + 'insertion at a time' },
    { id: 'queue', why: 'the first-in-first-out queue this is not, which is the comparison the '
                      + 'name invites' },
    { id: 'sortprops', why: 'what maintaining a full order costs, and when that is worth paying '
                          + 'for' }
  ]
};

T.pq = {
  coreInvariant:
    'Every parent\'s priority is at least that of each of its children, so the maximum is at the '
    + 'root. That is why peek is a single read and why a delete has only one path to repair rather '
    + 'than a whole structure. The second half of the invariant is shape: the items occupy '
    + '`items[1]` through `items[numItems]` with no gaps, which is what makes `2i`, `2i + 1` and '
    + '`i / 2` valid child and parent arithmetic with no pointers stored anywhere. Break either '
    + 'half and the other stops meaning anything.',
  mechanism:
    'An insertion appends at `items[++numItems]` — the only position that keeps the tree complete '
    + '— and then `fixUp` swaps the new item with its parent while `i > 1` and the item\'s '
    + 'priority exceeds `items[i / 2]`\'s, reassigning `i = i / 2` each time, so `1 / 2` being 0 '
    + 'in integer arithmetic is what signals the root. A delete saves `items[1].item`, moves '
    + '`items[numItems]` into the root, decrements the count and runs `fixDown` from index 1 with '
    + '`N` set to the new count: that loop takes `j = 2 * i`, advances to `j + 1` when `j` is less '
    + 'than `N` and the right child is larger, and stops as soon as `items[i]` already dominates '
    + '`items[j]`. Peek reads `items[1].item` and changes nothing. When `numItems` reaches '
    + '`capacity` the array is reallocated at double the capacity, again with one extra element.',
  criticalInvariants: [
    { rule: '`items[0]` is never used, and the array is allocated with `capacity + 1` elements.',
      because: 'The parent of `i` is `i / 2` only under 1-based indexing, and `1 / 2` being 0 is '
             + 'precisely how `fixUp` detects the root. Writing the first item at index 0 breaks '
             + 'every parent and child computation at once, and the one extra element is what '
             + 'keeps `items[numItems]` in bounds when the heap is full.' },
    { rule: 'An insertion goes at the END and then moves up; a deletion takes the root, refills it '
          + 'from the end, and then moves down.',
      because: 'Any other placement leaves a gap, and a gap makes the index arithmetic point at '
             + 'the wrong nodes from there on. The last position is the only one that can be added '
             + 'or removed without breaking completeness, so it is always the position that moves.' },
    { rule: '`fixDown` compares the parent against the LARGER child, not the first child it finds.',
      because: 'Swapping with the smaller child leaves the larger one above its new parent, so the '
             + 'heap property is violated at the slot that was just repaired. The step that '
             + 'advances `j` to the right child is what chooses correctly, and the test that `j` '
             + 'is less than `N` is what stops it reading past the last item when the node has '
             + 'only a left child.' },
    { rule: '`fixDown` stops at the first node that already dominates its children.',
      because: 'Everything below that node was a heap before the operation and nothing in it has '
             + 'been touched, so the repair is finished. This is why the cost is one path rather '
             + 'than a whole subtree, and it is the step people leave out when they rewrite the '
             + 'loop from memory.' }
  ],
  examTraps: [
    { trap: 'Reading `fixDown`\'s `N` as a count of items.',
      instead: 'It is the index of the LAST item, which is why the loop condition compares `2 * i` '
             + 'against `N` and the right-child test asks whether `j` is less than `N`. Passing a '
             + 'count instead lets the walk step one slot beyond the heap.' },
    { trap: 'Expecting the printed array to be in priority order.',
      instead: 'It is in level order. The root is the maximum, the rest is only partially ordered, '
             + 'and the item at the last index is not in general the smallest in the heap.' },
    { trap: 'Expecting items of equal priority to come out in insertion order.',
      instead: 'Nothing in either repair breaks ties by arrival, and the strict comparisons leave '
             + 'equal priorities where they sit. A heap is not stable, so equal priorities come out '
             + 'in no promised order at all.' },
    { trap: 'Deleting by overwriting the root and then fixing UP.',
      instead: 'The replacement comes from the last position and is usually small, so it belongs '
             + 'below rather than above. Fixing up from the root does nothing whatsoever, because '
             + 'the root has no parent to compare against.' }
  ],
  recognition: {
    stateVariables: ['`numItems` and `capacity`', '`i`, the index being repaired',
                     '`j`, the chosen child inside `fixDown`',
                     '`items[1]`, which is the maximum at every moment'],
    tell: 'An index that HALVES on each step is walking up a heap; an index that DOUBLES is walking '
        + 'down one. If instead a pointer follows a left or right link after comparing against the '
        + 'key being looked for, that is a binary search tree, which maintains a full left-to-right '
        + 'order that a heap deliberately does not.'
  },
  complexity: [
    { case: 'Insert', cost: 'makes at most about `log n` comparisons',
      why: 'The new item climbs at most the height of the tree, and a complete tree over `n` items '
         + 'has height about `log n`. Most insertions stop far sooner than that.' },
    { case: 'Delete maximum', cost: 'makes at most about `2 log n` comparisons',
      why: 'Each level of the descent compares the two children against each other and then the '
         + 'winner against the parent, over at most about `log n` levels.' },
    { case: 'Peek', cost: 'one step',
      why: 'The maximum is `items[1]` by the heap property, so there is nothing to search.' },
    { case: 'Resize', cost: 'copies `n` items, but doubling keeps the average insertion constant',
      why: 'Each doubling copies everything once and the next doubling is twice as far away, so the '
         + 'copying spread across the insertions that caused it comes to a constant each.' },
    { case: 'Space', cost: '`capacity + 1` item slots and no per-item pointers',
      why: 'One unused slot at index 0 buys the 1-based arithmetic; the rest is the array itself, '
         + 'which is why a heap is more compact than any pointer-based tree.' }
  ],
  convention: 'heapIndexing',
  whatToDraw: {
    unit: 'one row = one comparison or one swap',
    columns: ['operation', 'i', 'parent or chosen child j', 'numItems',
              'items[1..numItems] after the step']
  },
  seeAlso: [
    { id: 'heapify', why: 'building the heap property over a whole array at once, at about `n` '
                        + 'steps rather than `n log n`' },
    { id: 'heapsort', why: 'the same `fixDown` driven to sort in place, over an array indexed '
                         + 'from 0' },
    { id: 'pqcompare', why: 'what the `log n` per operation is actually bought against' },
    { id: 'bstins', why: 'the other tree in this course, ordered left to right instead of top to '
                       + 'bottom, and what that buys and costs' }
  ]
};

T.heapify = {
  coreInvariant:
    'Processing the internal nodes from the LAST one back towards the root means that when a node '
    + 'is reached, both of its subtrees are already heaps. The only possible violation is at that '
    + 'node itself, so sinking its one item along a single path is enough to make the whole '
    + 'subtree a heap. That is why one backwards pass works, why a forwards pass does not, and why '
    + 'the total cost comes out at about `n` steps rather than `n log n`: a node can only sink as '
    + 'far as its own height, and almost all the nodes are near the bottom.',
  mechanism:
    'Both implementations this tracer executes here are 0-BASED: the root is `items[0]`, the '
    + 'children of `i` are `2i + 1` and `2i + 2`, and `fixDown` takes `N` as the index of the last '
    + 'item, so its loop guard asks whether `2 * i + 1` is at most `N`. The fix-down method starts '
    + 'the outer loop at `size / 2 - 1`, the last internal node, and counts DOWN to 0, calling '
    + '`fixDown` on each; the second half of the array is skipped because every index from `size / '
    + '2` upwards is a leaf and a leaf is already a heap of one. The fix-up method instead counts '
    + 'UP from index 1, treating `items[0..i-1]` as a heap and lifting `items[i]` into place '
    + 'against its parent at `(i - 1) / 2`. The difference in cost is pure tree shape.',
  criticalInvariants: [
    { rule: 'The fix-down pass runs from the last internal node back towards the root, never '
          + 'forwards.',
      because: '`fixDown` repairs one node on the assumption that both subtrees below it are '
             + 'already heaps. Running forwards breaks that assumption, and a single forward pass '
             + 'leaves violations behind: large items stranded below small ones that were settled '
             + 'before they arrived and are never looked at again.' },
    { rule: 'The outer loop starts at `size / 2 - 1`, and the whole second half of the array is '
          + 'skipped.',
      because: 'Under 0-based indexing every index from `size / 2` upwards is a leaf, and a leaf '
             + 'already satisfies the heap property on its own. Starting at the last index wastes '
             + 'about half the calls and changes nothing; starting below `size / 2 - 1` misses a '
             + 'genuine internal node and leaves the array unheapified.' },
    { rule: '`fixDown`\'s `N` is the index of the last item and not the number of items.',
      because: 'Both the loop guard and the right-child test read `N` as a last index. Passing a '
             + 'count lets the walk compare against, and swap with, one slot beyond the region '
             + 'being heapified.' },
    { rule: 'The two methods both produce heaps, but not the same heap.',
      because: 'Each satisfies the heap property at every node, yet they move different items in '
             + 'different orders, so the resulting arrays usually differ. A trace asked for by '
             + 'index is answering about one specific method, so the method has to be stated '
             + 'before the indices mean anything.' }
  ],
  examTraps: [
    { trap: 'Reading these implementations as 1-based because the priority-queue heap in this '
          + 'tracer is.',
      instead: 'What runs here is 0-based: the root is `items[0]`, the children of `i` are '
             + '`2i + 1` and `2i + 2`, and the fix-up method\'s parent is `(i - 1) / 2`. The index '
             + 'base is a convention and the heap modules in this tracer do not share one, so '
             + 'every stated index has to be read against the module it came from.' },
    { trap: 'Expecting the `n`-step bound to make heapify cheaper than sorting.',
      instead: 'Heapify produces a HEAP, not a sorted array. The `n` steps buy the heap property '
             + 'and nothing else; extracting sorted output from the result still costs about '
             + '`n log n` on top.' },
    { trap: 'Assuming the fix-up method is the natural one because it mirrors insertion.',
      instead: 'It is exactly the work of inserting `n` items one at a time, about `n log n` steps. '
             + 'Building from the bottom is strictly cheaper, and the reason is that a complete '
             + 'tree has far more nodes near its leaves than near its root.' },
    { trap: 'Stopping a `fixDown` as soon as one swap has been made.',
      instead: 'The item keeps sinking while it is smaller than its larger child. A single call can '
             + 'descend several levels, which is visible in the trace as the index being reassigned '
             + 'to the chosen child and the walk continuing.' }
  ],
  recognition: {
    stateVariables: ['`i`, the node being repaired', '`j`, the larger child',
                     '`N`, the last index of the region being heapified',
                     'the array contents after each swap'],
    tell: 'An outer index counting DOWN towards 0 with a sinking walk inside it is heapify by '
        + 'fix-down; an outer index counting UP from 1 with a climbing walk inside it is heapify by '
        + 'fix-up. If the outer index is instead shrinking a sorted tail at the far end of the '
        + 'array, you are watching heap sort, which drives the very same `fixDown`.'
  },
  complexity: [
    { case: 'Fix-down method', cost: 'makes about `n` comparisons in total',
      why: 'A node at height `h` can sink at most `h` levels, and the number of nodes at height `h` '
         + 'halves as `h` rises, so the total is bounded by a constant times `n` rather than growing '
         + 'with the height.' },
    { case: 'Fix-up method', cost: 'makes about `n log n` comparisons in total',
      why: 'Each item can climb the full current height, and about half the items sit in the last '
         + 'level where that height is greatest. It is the same work as `n` separate insertions.' },
    { case: 'Worst case for one call', cost: 'about `log n` comparisons',
      why: 'A single sink or climb is bounded by the height of a complete tree over `n` items.' },
    { case: 'Space', cost: 'in place, with no auxiliary array',
      why: 'Every move is a swap inside the array being heapified, and the only extra state is the '
         + 'handful of indices.' }
  ],
  convention: 'heapIndexing',
  whatToDraw: {
    unit: 'one row = one comparison or one swap',
    columns: ['i', 'j', 'N', 'comparison made', 'array after the step']
  },
  seeAlso: [
    { id: 'heapsort', why: 'what the heap is built for here, and the second phase that turns it '
                         + 'into sorted output' },
    { id: 'pq', why: 'the same two repairs driven one operation at a time, over a 1-based array' },
    { id: 'pqcompare', why: 'why the heap property is worth a build cost at all' }
  ]
};

T.heapsort = {
  coreInvariant:
    'The one array is split into a heap at the front, indices 0 up to `size - 1`, and a sorted '
    + 'tail behind it; every item in the tail is at least every item in the heap and is already in '
    + 'its final position. Because the root of a max heap is the largest item remaining, swapping '
    + 'it to the front of the tail extends the sorted region by exactly one correct item. That is '
    + 'why the algorithm sorts without ever comparing two items in the tail, and why no second '
    + 'array is needed: the heap and the output share the space.',
  mechanism:
    'Two phases over one 0-based array. The build phase heapifies everything, from the last '
    + 'internal node back to index 0, at about `n` steps. The extraction phase then repeats three '
    + 'actions while the heap holds more than one item: swap `items[0]` with `items[size - 1]`, '
    + 'which places the current maximum at the end of the shrinking heap region; decrement `size`; '
    + 'and `fixDown` from index 0 with `N` set to `size - 1`, repairing the single violation the '
    + 'swapped-in item created at the root. Each round places one item for good, so after `n - 1` '
    + 'rounds the array is sorted ascending. The shrinking `N` is the only thing that keeps the '
    + 'repair away from the items already placed.',
  criticalInvariants: [
    { rule: 'The size is decremented BEFORE the repair, so `fixDown` never looks at the item just '
          + 'placed.',
      because: 'That item is final. Leaving it inside the heap region would let it be compared and '
             + 'swapped back in, and the sorted tail would stop being sorted. The shrinking bound '
             + 'is the entire protection, and there is no other marker distinguishing placed items '
             + 'from heap items.' },
    { rule: 'The repair after each swap is a `fixDown` from the root, not a fresh heapify.',
      because: 'Only the root changed, so only the root can violate the property: both of its '
             + 'subtrees are untouched heaps. Re-heapifying the whole region each round would cost '
             + 'about `n` per round and turn an `n log n` sort into an `n^2` one.' },
    { rule: 'A MAX heap produces ASCENDING order, and the sorted region grows from the back.',
      because: 'The largest item leaves first and is placed at the furthest position, the next '
             + 'largest one place nearer, and so on. Wanting descending output means building a min '
             + 'heap, not reversing the loop.' },
    { rule: 'The extraction loop runs while the heap holds more than one item, not while it holds '
          + 'any.',
      because: 'A one-item heap is already in place: its single item is the smallest left and index '
             + '0 is where it belongs. The extra round would swap it with itself and repair '
             + 'nothing.' }
  ],
  examTraps: [
    { trap: 'Reading the indices here as 1-based because the priority-queue heap in this tracer is.',
      instead: 'Heap sort runs 0-based on the array it is sorting: the root is `items[0]`, children '
             + 'are `2i + 1` and `2i + 2`, and the first item placed lands at `items[size - 1]`. '
             + 'Every stated index differs by one from the 1-based version, so the base has to be '
             + 'fixed before a trace means anything.' },
    { trap: 'Expecting heap sort to be stable.',
      instead: 'The swap at the root moves the last item of the heap right across the structure, so '
             + 'equal items change relative order. It is unstable, in place and non-adaptive: '
             + 'already-sorted input costs exactly what random input costs.' },
    { trap: 'Counting the build phase as the expensive half.',
      instead: 'The build is about `n` steps. The `n log n` comes entirely from the `n - 1` repairs '
             + 'in the extraction phase, so making the build faster cannot change the total.' },
    { trap: 'Expecting the heap region to look progressively sorted as it shrinks.',
      instead: 'Only the tail is sorted. The region in front of it stays merely partially ordered '
             + 'right up to the final round, so a snapshot mid-sort shows a sorted suffix and an '
             + 'unsorted prefix with the largest remaining item at index 0.' }
  ],
  recognition: {
    stateVariables: ['the phase, which separates the build from the extraction',
                     '`size`, the shrinking boundary between heap and sorted tail',
                     '`i` and `j` inside each `fixDown`',
                     'the array, with the sorted region growing from the right'],
    tell: 'A boundary moving right to left, with a sorted region behind it and a repair from index 0 '
        + 'after every swap, is heap sort. Selection sort also grows a sorted region from one end, '
        + 'but it finds its maximum by scanning about `n` items each round instead of reading it '
        + 'off the root — and that single difference is the whole gap between `n^2` and `n log n`.'
  },
  complexity: [
    { case: 'Build phase', cost: 'makes about `n` comparisons',
      why: 'The bottom-up heapify bound: most nodes are near the leaves and can sink only a short '
         + 'way, so the total does not grow with the height.' },
    { case: 'Extraction phase', cost: 'makes about `n log n` comparisons',
      why: 'Each of the `n - 1` rounds repairs one path down from the root, at most the height of '
         + 'the remaining heap, which is about `log n`.' },
    { case: 'Best, average and worst', cost: 'about `n log n` comparisons in all three',
      why: 'Nothing in the algorithm inspects how sorted the input already is, so there is no cheap '
         + 'case to hope for and no bad case to engineer against it.' },
    { case: 'Space', cost: 'in place, with a constant amount of extra state',
      why: 'The heap and the sorted output occupy the same array and only indices are held aside, '
         + 'unlike merge sort, which needs a second array of `n` items.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one swap, one comparison or one change of the heap boundary',
    columns: ['phase', 'size', 'i', 'j', 'array with the sorted tail marked']
  },
  seeAlso: [
    { id: 'heapify', why: 'the build phase on its own, and why it costs about `n` rather than '
                        + '`n log n`' },
    { id: 'sel', why: 'the same growing sorted region with a scan instead of a heap, which is '
                    + 'exactly where the `n^2` comes from' },
    { id: 'ms', why: 'the other `n log n` sort, which is stable but has to pay for a second array' },
    { id: 'pq', why: 'the same two repairs exposed as insert and delete, over a 1-based array' }
  ]
};

/* ------------------------------------------------------------------ *
 * Tries                                                               *
 * ------------------------------------------------------------------ */

T.trie = {
  coreInvariant:
    'A key is spelled out by the PATH from the root and is not stored in any node. A node means '
    + '"this prefix exists"; the `finish` flag on it means "this prefix is also a complete key". '
    + 'Because the path determines the key, two keys that share a prefix necessarily share the '
    + 'nodes for it, and because membership is recorded in the flag rather than by the node '
    + 'existing, a prefix of a stored key can exist as a node without being a key itself. Those '
    + 'two facts together are what every operation here relies on.',
  mechanism:
    'Each node holds 26 child pointers and a boolean, and is created with `calloc`, so every child '
    + 'starts NULL and `finish` starts false without a single explicit initialisation. The '
    + 'character is never stored: the SLOT INDEX carries it, computed as `key[0] - \'a\'`. An '
    + 'insertion recurses on the rest of the key, allocating a node wherever it finds NULL, and '
    + 'the caller writes the result back into `t->children[i]`; at the end of the key it sets '
    + '`finish` to true. A search returns false at NULL and returns `t->finish` at the end of the '
    + 'key. A deletion clears `finish` at the end of the key and then, UNWINDING, prunes a node '
    + 'only when it is not the root, is not itself a key end, and has no remaining children. The '
    + 'destructor is post-order: recurse into all 26 slots, then free the node.',
  criticalInvariants: [
    { rule: 'The return value of the insertion must be assigned back into `t->children[i]`.',
      because: 'A node allocated inside the recursive call is reachable only through that return '
             + 'value. Calling it and discarding the result leaks the new node and the key is '
             + 'simply not stored, while every other key keeps working — so the defect surfaces as '
             + 'a mysteriously missing key rather than as a crash.' },
    { rule: 'Membership is the `finish` flag, not the existence of a node at the end of the path.',
      because: 'Inserting `cart` creates nodes for c, a, r and t. The node for `car` exists on the '
             + 'way through, so a search that stopped at "the path exists" would report a key that '
             + 'was never inserted. Returning the flag is the only correct test, and it is the one '
             + 'the implementation makes.' },
    { rule: 'A deletion clears `finish` first and prunes only on the way back up.',
      because: 'Whether a node may be released depends on what lies below it, and that is not known '
             + 'until the recursion returns. Freeing on the way down would cut off the nodes of '
             + 'every longer key that passes through this one.' },
    { rule: 'A node survives the prune if it is the root, if its own `finish` is set, or if any of '
          + 'its 26 children is non-NULL.',
      because: 'Each of the three means something still depends on it: the trie itself, a shorter '
             + 'key ending there, or a longer key passing through. Deleting `car` while `cart` is '
             + 'stored keeps the r node for exactly the third reason, with its `finish` now false '
             + '— which is what the trace shows.' },
    { rule: '`calloc` is what makes an unset child mean "no such prefix".',
      because: '`malloc` would leave 26 indeterminate pointers and a garbage flag. The code never '
             + 'writes NULL into an unused slot, so the zeroing is the only thing that establishes '
             + 'the invariant the whole structure is read against.' }
  ],
  examTraps: [
    { trap: 'Expecting the cost to depend on how many keys are stored.',
      instead: 'Every operation walks the length of the KEY and nothing else. A trie holding a '
             + 'million keys still answers a four-character search in four steps, which is the '
             + 'property no comparison-based structure has.' },
    { trap: 'Reading a node as holding its own character.',
      instead: 'A node holds 26 pointers and a flag. The character is the INDEX of the slot that '
             + 'reached it, which is why the implementation computes `key[0] - \'a\'` and why any '
             + 'character outside a to z indexes out of range.' },
    { trap: 'Expecting a deletion to free the whole path.',
      instead: 'It frees only the nodes that nothing else needs, from the end back. The root is '
             + 'never freed by a deletion, and a node whose `finish` has just been cleared still '
             + 'stays if any child remains.' },
    { trap: 'Reading the destructor as walking only the children that exist.',
      instead: 'It recurses into all 26 slots at every node and returns immediately on NULL. The '
             + 'work per node is the alphabet size rather than the number of children, which is '
             + 'also why a sparse trie is expensive in memory.' }
  ],
  recognition: {
    stateVariables: ['the remaining key, which loses one character per level',
                     '`i`, the slot index computed from the leading character',
                     '`finish` on the node reached',
                     'the root flag, which only the deletion carries'],
    tell: 'Descending one level per CHARACTER, with the branch chosen by arithmetic on the '
        + 'character rather than by a comparison, is a trie. A binary search tree compares the '
        + 'whole key at each node and descends by the result, so its depth tracks the NUMBER of '
        + 'keys; a trie\'s depth tracks the LENGTH of the key and is unaffected by how many are '
        + 'stored.'
  },
  complexity: [
    { case: 'Insert, search and delete', cost: 'about `m` steps for a key of length `m`',
      why: 'One level of recursion per character, and the work at each level is one index '
         + 'computation and one pointer follow. The number of stored keys never enters it.' },
    { case: 'Free', cost: 'visits all 26 slots of every node, so about 26 steps per node',
      why: 'The recursion cannot know which slots are used without looking at them, so the cost is '
         + 'the alphabet size times the number of nodes.' },
    { case: 'Prune during a delete', cost: 'about 26 steps per node on the way back up',
      why: 'Establishing that a node has no children means scanning all 26 slots, and that scan '
         + 'happens once for each node on the path.' },
    { case: 'Space', cost: '26 pointers plus a flag per node, shared across keys with a common prefix',
      why: 'Sharing prefixes saves nodes, but every node pays for the whole alphabet whether or not '
         + 'the slots are used, which is what makes a sparse trie memory-hungry.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one character of the key',
    columns: ['character', 'slot index', 'node reached (existing or new)', 'finish',
              'what the unwinding step does']
  },
  seeAlso: [
    { id: 'hash', why: 'the other keyed structure here, where the whole key is hashed instead of '
                     + 'walked and collisions therefore exist' },
    { id: 'bstsearch', why: 'a search whose depth grows with the number of keys rather than the '
                          + 'length of one key' },
    { id: 'radix', why: 'the same character-by-character view of a key, used to sort rather than to '
                      + 'store' }
  ]
};

/* ------------------------------------------------------------------ *
 * Hash tables                                                         *
 * ------------------------------------------------------------------ */

T.hash = {
  coreInvariant:
    'Every key lives in the chain hanging off the one slot its hash names and nowhere else, so a '
    + 'lookup only ever has to walk a single chain. The slot is computed from the key AND the '
    + 'current number of slots, which is why changing the number of slots invalidates every stored '
    + 'position at once — and that is the reason a resize must rehash every key rather than copy '
    + 'chains across. The structure makes no promise about the order within a chain; what it '
    + 'promises is that a key is in its own slot\'s chain, and that is the only thing a search may '
    + 'assume.',
  mechanism:
    'The slot array is created with `calloc`, so every chain starts NULL. The hash is not a plain '
    + 'modulus: it offsets the key past the signed range, runs two multiply-and-exclusive-or '
    + 'mixing rounds with a fixed constant, and only then takes the remainder. The insertion '
    + 'recurses down the chain: at NULL it increments the item count and returns a NEW node, on a '
    + 'matching key it OVERWRITES the value and returns the existing node, and otherwise it '
    + 'recurses and reassigns `list->next`. Because the new node is created where the recursion '
    + 'ran out of chain, a new key is appended at the TAIL, so a chain sits in arrival order. The '
    + 'deletion mirrors it, unlinking by returning `list->next` after freeing the matched node. '
    + 'The supplemental resize allocates the new slot array first, moves each existing node by '
    + 'relinking its `next` — pushing it at the HEAD of its new chain, which reverses order within '
    + 'a chain — frees only the old slot array, and leaves the item count untouched.',
  criticalInvariants: [
    { rule: 'The insertion returns the chain head and the caller must write it back into '
          + '`ht->slots[i]`.',
      because: 'When the chain was empty the new node IS the new head, and the only reference to '
             + 'it is that return value. Discarding it leaks the node and loses the key. The same '
             + 'pattern carries the deletion: when the matched node was the head, the returned '
             + '`list->next` is the only way the slot learns its new head.' },
    { rule: 'The item count counts KEYS, so it rises only where a new node is created.',
      because: 'Inserting a key that is already present takes the matching branch, overwrites the '
             + 'value and returns without touching the count. A count that rose on updates would '
             + 'push the load factor up with no extra chain length behind it, and the size query '
             + 'would stop reporting the number of distinct keys.' },
    { rule: 'A resize must recompute the hash of every stored key against the new slot count.',
      because: 'The slot is a function of the key and the modulus together. In the trace, growing '
             + 'from 11 slots to 23 moves key 23 from slot 0 to slot 2 and key 34 from slot 8 to '
             + 'slot 2: the old grouping carries no information about the new one, so chains '
             + 'cannot be transplanted slot for slot.' },
    { rule: 'The new slot array is allocated before anything moves, and nodes are moved by pointer '
          + 'rather than copied.',
      because: 'Allocating first means a failed allocation leaves the old table whole and usable. '
             + 'Relinking rather than copying means no key or value is duplicated and no node is '
             + 'freed twice — only the old array of slot pointers is released.' },
    { rule: 'The slot count is kept prime after each doubling.',
      because: 'Taking a remainder by a composite number lets any structure in the hash values that '
             + 'shares a factor with it collapse onto a few slots. The growth sequence here is 11, '
             + '23, 47, 97, 193, 389 — each the first prime at least twice the previous — so the '
             + 'table doubles and the modulus still spreads.' }
  ],
  examTraps: [
    { trap: 'Reading the home slot as the key modulo the slot count.',
      instead: 'The hash mixes the bits twice before taking any remainder, so the slot is not '
             + 'predictable by eye: in an 11-slot table this tracer sends 12 to slot 2, 23 to slot '
             + '0 and 34 to slot 8. Read the slot off the trace instead of computing it.' },
    { trap: 'Reading the `-1` returned for an absent key as data.',
      instead: 'The lookup prints an error and returns `-1`, which is also a perfectly storable '
             + 'value. The membership test is the operation that can distinguish the two, and it '
             + 'is the one to call first.' },
    { trap: 'Expecting a load factor above 1 to be a problem.',
      instead: 'With separate chaining the load factor IS the average chain length, so 2 means '
             + 'about two nodes to walk. Open addressing is the scheme that cannot exceed 1 at all, '
             + 'because its items live in the slots themselves.' },
    { trap: 'Reading the order within a chain as meaningful.',
      instead: 'A new key is appended at the END of its chain, so a chain is in arrival order — and '
             + 'a resize pushes each moved node at the HEAD of its new chain, which reverses that. '
             + 'The order is an artefact of the path insertions took, not something the structure '
             + 'maintains.' },
    { trap: 'Expecting an insertion of an existing key to add a second node.',
      instead: 'The matching branch assigns the new value in place. A separate-chaining table of '
             + 'this shape cannot hold two nodes with the same key, so insertion doubles as '
             + 'update.' }
  ],
  recognition: {
    stateVariables: ['the slot count and the item count, which together give the load factor',
                     '`i`, the home slot', 'the position in the chain being walked',
                     'the chain contents at each slot'],
    tell: 'Items held in linked lists hanging off a slot array is separate chaining, and its '
        + 'deletion is a plain unlink that leaves no marker behind. Items held in the slots '
        + 'themselves, with a per-key step and a probe count, is open addressing, where deletion '
        + 'needs a tombstone or a backshift. If a trace shows two tables side by side, you are '
        + 'watching a rehash rather than a collision.'
  },
  complexity: [
    { case: 'Search, insert or delete, average',
      cost: 'walks about one plus the load factor nodes',
      why: 'One slot computation, then the chain. The load factor is the expected chain length under '
         + 'a hash that spreads keys evenly, so keeping it bounded is what keeps the cost constant.' },
    { case: 'Worst case', cost: 'walks about `n` nodes',
      why: 'Every key hashing to one slot puts them all in a single chain, and the structure '
         + 'degenerates into a linked list with a slot array attached.' },
    { case: 'Resize', cost: 'scans every slot and rehashes every key',
      why: 'The whole old array is walked and each node is moved exactly once. Doubling makes the '
         + 'cost per insertion constant on average, because each resize is twice as far from the '
         + 'last as the one before.' },
    { case: 'Free', cost: 'visits every slot and releases every node once',
      why: 'Empty slots are still visited, because the destructor cannot know which hold chains '
         + 'without looking.' },
    { case: 'Space', cost: 'one slot pointer per slot plus one node per key',
      why: 'Empty slots still cost a pointer each, which is what a deliberately low load factor '
         + 'trades memory for speed with.' }
  ],
  convention: 'chainOrder',
  whatToDraw: {
    unit: 'one row = one chain step or one slot change',
    columns: ['key', 'home slot', 'chain walked', 'what happened (new node, update, unlink)',
              'item count', 'load factor']
  },
  seeAlso: [
    { id: 'hashprobe', why: 'open addressing, where the items live in the table itself and a '
                          + 'deletion needs a tombstone or a backshift' },
    { id: 'hashsetcounter', why: 'the same table driven as a Set and as a Counter, which is what '
                               + 'the applications are built on' },
    { id: 'setadt', why: 'the cost table this structure supplies the constant-average row of' },
    { id: 'trie', why: 'a keyed structure with no hash and no collisions, where the key is walked '
                     + 'instead of mixed' }
  ]
};

/* ------------------------------------------------------------------ *
 * Hash applications                                                   *
 * ------------------------------------------------------------------ */

T.hashsetcounter = {
  coreInvariant:
    'A Set and a Counter are the same key-to-value table read two different ways. A Set stores the '
    + 'item as the KEY and ignores the value, so inserting an item already present changes nothing '
    + 'and the size is the number of distinct items. A Counter stores the item as the key and its '
    + 'occurrence count as the VALUE, so adding an item already present increments one number '
    + 'instead of creating a second entry. Because a key\'s position is COMPUTED rather than '
    + 'searched for, both "have I seen this?" and "how many times?" reduce to a slot computation — '
    + 'and that is what makes a whole family of counting problems linear instead of quadratic.',
  mechanism:
    'This tracer drives an 11-slot separate-chaining table, and for readability it uses a plain '
    + 'remainder as the hash, so item 4 lands in slot 4 and item 7 in slot 7; the full hash-table '
    + 'module mixes the bits first and its slots are not readable by eye. In Set mode an insertion '
    + 'hashes the item and stores it as a key with a placeholder value only if it is not already '
    + 'there, the membership query reports whether the key is present, and a deletion unlinks it. '
    + 'In Counter mode an addition either increments the stored count or stores a fresh count of '
    + '1, and the query returns the stored count or 0 for an item never added. The size is the '
    + 'number of DISTINCT keys in both modes: adding 4, 3, 4, 8, 8 and 4 leaves three entries '
    + 'holding counts of 3, 1 and 2.',
  criticalInvariants: [
    { rule: 'A Counter\'s size is the number of DISTINCT items, not the number of additions.',
      because: 'Adding an item that is present increments its value and creates no entry. Six '
             + 'additions in the default run leave three entries, so reading the size as the number '
             + 'of items seen conflates a Counter with a list and gives a different number.' },
    { rule: 'A Counter\'s query must return 0 for an absent item rather than an error.',
      because: 'The whole point of counting with a table is that a never-seen item has count 0, '
             + 'which is the correct answer and not a failure. Every counting application depends '
             + 'on it: the first occurrence of an item can be handled by reading then writing, with '
             + 'no separate presence test.' },
    { rule: 'A Set insertion is a membership test followed by a store, so it cannot be cheaper than '
          + 'the membership test.',
      because: 'Distinctness has to be established before anything is written, and it is '
             + 'established the same way a membership query is. On a hash table both are one slot '
             + 'computation and a short chain walk, which is why all three Set operations come out '
             + 'at about one step.' },
    { rule: 'The item must be the KEY, never the value.',
      because: 'Only the key is hashed, so only the key can be found without a scan. Storing items '
             + 'as values and counts as keys turns every lookup into a walk of the entire table and '
             + 'throws away the one property the structure was chosen for.' }
  ],
  examTraps: [
    { trap: 'Expecting a Set to preserve the order items were added in.',
      instead: 'The position is decided by the hash. A Set promises distinctness and membership and '
             + 'nothing else, and a listing of its contents comes out in slot order, which is '
             + 'neither arrival order nor sorted order.' },
    { trap: 'Using a Counter where a Set is wanted and reading any entry as membership.',
      instead: 'An entry with a count of 0 can exist if the count reached zero without the key '
             + 'being deleted. Membership for a Counter means a POSITIVE count, not the presence of '
             + 'a key.' },
    { trap: 'Reading the second mode as a different data structure.',
      instead: 'It is one hash table with one different interpretation of the value. Switching mode '
             + 'changes what sits in the value slot and nothing at all about the slots, the chains '
             + 'or the hash.' }
  ],
  recognition: {
    stateVariables: ['the mode — whether the value is a placeholder or a count',
                     'the item being added or queried', 'the slot it hashes to',
                     'the stored value at that key', 'the number of distinct keys'],
    tell: 'If a repeated item leaves the structure unchanged it is a Set; if a repeated item changes '
        + 'a stored number it is a Counter; if a repeated item adds another entry it is neither, '
        + 'and distinctness is not being maintained at all. All three can sit on the same slot '
        + 'array, so the tell is in what a REPEAT does, never in the shape of the picture.'
  },
  complexity: [
    { case: 'Add, query, membership or delete', cost: 'about one step on average',
      why: 'The slot is computed from the item and then a short chain is walked. The chain length is '
         + 'the load factor, so it does not grow with the number of items while the table is '
         + 'resized.' },
    { case: 'Building a Counter over `n` items', cost: 'about `n` steps',
      why: 'One addition per item, each about one step. This is the bound every counting application '
         + 'in this area inherits from here.' },
    { case: 'Worst case', cost: 'about `n` steps per operation',
      why: 'All items hashing to one slot makes the structure a single chain, so the constant cost '
         + 'is an average and not a guarantee.' },
    { case: 'Space', cost: 'one entry per distinct item, plus the slot array',
      why: 'Repeats cost nothing extra in a Counter: the count is one field on an entry that '
         + 'already exists.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one operation',
    columns: ['operation', 'item', 'slot', 'stored value before', 'stored value after',
              'number of distinct keys']
  },
  seeAlso: [
    { id: 'hash', why: 'the separate-chaining table underneath, with the chains, the load factor '
                     + 'and the resize that keep the average constant' },
    { id: 'oddocc', why: 'a Counter used end to end: build the counts in one pass, then read them '
                       + 'once' },
    { id: 'anagram', why: 'a Counter used as a running balance rather than as a tally' },
    { id: 'setadt', why: 'the Set interface this implements, and what it costs over the other four '
                       + 'representations' }
  ]
};

T.twosum = {
  coreInvariant:
    'At the moment index `i` is examined, the set holds exactly the values at the indices BEFORE '
    + '`i`. Asking whether the complement of `A[i]` is in the set therefore asks whether some '
    + 'EARLIER element pairs with this one, which is why a single pass suffices and why no pair can '
    + 'be missed: every pair has a later member, and the pair is found when that later member is '
    + 'reached. The hashed set is what makes the question cheap; what is given up is the memory to '
    + 'hold the values seen, and any knowledge of WHERE the partner was.',
  mechanism:
    'One pass over the array. At each index the complement — the target minus the current value — '
    + 'is computed, the set is TESTED for it, and only then is the current value added. Testing '
    + 'before adding is the only thing stopping an element from pairing with itself. The set '
    + 'absorbs duplicates, so the second 3 in the default input adds nothing and changes no later '
    + 'test. The pass stops at the first hit and reports the pair as the stored complement '
    + 'alongside the current value: with a target of 13 the default input answers at the 7, naming '
    + '6 as its partner. Because membership is one hashed lookup, the nested double loop over all '
    + 'pairs collapses to a single sweep.',
  criticalInvariants: [
    { rule: 'The complement is tested BEFORE the current value is added.',
      because: 'Adding first puts the current value in the set, so if the target is exactly twice '
             + 'that value the element matches ITSELF and a single element is reported as a pair. '
             + 'The ordering of those two lines is the only thing enforcing "two different '
             + 'positions".' },
    { rule: 'The set holds the values SEEN SO FAR, not the whole array.',
      because: 'The invariant that everything in the set lies at an earlier index is what makes a '
             + 'hit a genuine pair. Preloading the whole array destroys it and reintroduces the '
             + 'self-pairing problem for every element at once, silently.' },
    { rule: 'A set, rather than a count, is enough for a yes-or-no question.',
      because: 'Membership is all the test consults, so duplicates in the input are harmless and '
             + 'cost nothing. If the problem instead asked how many pairs exist, counts would be '
             + 'needed, and duplicates would stop being free.' }
  ],
  examTraps: [
    { trap: 'Assuming the input has to be sorted.',
      instead: 'Nothing here compares two values for order. The hashed approach works on unsorted '
             + 'input in one pass, and the two-pointer method is the one that needs sorting — which '
             + 'already costs about `n log n` before it starts.' },
    { trap: 'Expecting the trace to find the pair at the earlier of the two indices.',
      instead: 'The pair is detected at the LATER index, because that is the moment the earlier one '
             + 'is already in the set. The default run therefore answers at the 7 and names the 6 '
             + 'behind it.' },
    { trap: 'Reading the result as a pair of INDICES.',
      instead: 'The set stores values, so a hit gives the matching value and not its position. '
             + 'Returning positions means storing value-to-index entries, which makes the structure '
             + 'a map rather than a set.' },
    { trap: 'Expecting a negative result to come cheaply.',
      instead: 'Establishing that no pair exists costs the full pass: every element has to be '
             + 'examined and added. Only a hit can stop early, so the best case and the worst case '
             + 'are very different runs.' }
  ],
  recognition: {
    stateVariables: ['`i`, the index being examined', 'the value at that index',
                     'the complement being looked for', 'the set of values already seen, and its size'],
    tell: 'One index moving forward with a membership test against a GROWING set is the hashed '
        + 'solution. Two indices moving towards each other from the ends of a sorted array is the '
        + 'two-pointer solution, and a pair of nested indices is brute force. The tell is whether '
        + 'anything is being compared for order: here, nothing is.'
  },
  complexity: [
    { case: 'Average', cost: 'about `n` set operations, one lookup and at most one insertion per element',
      why: 'A single pass, each step a constant number of hash operations. The saving is that the '
         + 'partner is COMPUTED and then looked up, rather than searched for.' },
    { case: 'Brute force, for comparison', cost: 'about `n^2 / 2` comparisons',
      why: 'Every pair of positions is examined. The set is what replaces the inner loop with one '
         + 'lookup, and that substitution is the whole technique.' },
    { case: 'Worst case', cost: 'about `n` steps, degrading with a poor hash',
      why: 'The pass is still one sweep, but each lookup walks a chain, so a table that puts '
         + 'everything in one slot drags each step towards `n`.' },
    { case: 'Space', cost: 'up to `n` stored values',
      why: 'The constant-time lookup is bought with memory: the set may end up holding every '
         + 'distinct value in the array. The two-pointer method uses none and pays with the sort '
         + 'instead.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one index of the input',
    columns: ['i', 'value at i', 'complement needed', 'in the set?', 'set after the step']
  },
  seeAlso: [
    { id: 'hashsetcounter', why: 'the Set operations this relies on, and what they actually cost on '
                               + 'a real table' },
    { id: 'hash', why: 'the separate-chaining table that makes each membership test about one step' },
    { id: 'oddocc', why: 'the same one-pass shape where a count, not a membership test, is what the '
                       + 'problem needs' },
    { id: 'bin', why: 'the search this replaces, and the sorting it would have to be preceded by' }
  ]
};

T.oddocc = {
  coreInvariant:
    'The parity of a count cannot be decided until the whole input has been read, so the problem '
    + 'needs a tally rather than a running decision. One pass builds a count for each distinct '
    + 'value; a second pass over the DISTINCT VALUES — not over the input — reports how many of '
    + 'those counts are odd. Because the count for a value is reached by hashing the value instead '
    + 'of searching for it, the tally costs about one step per element, which is what turns the '
    + 'obvious approach of rescanning the array for each value into a single sweep.',
  mechanism:
    'One pass over the array, incrementing the count for each element and treating a missing entry '
    + 'as 0, so no presence test is needed before the increment; the trace shows the count after '
    + 'every element. When the pass ends, the entries are filtered to those whose count is odd, '
    + 'and the RESULT is how many such distinct values there are. For the default input 4, 3, 4, '
    + '8, 8, 4 the counts finish at 3 for the value 4, 1 for 3 and 2 for 8, so the odd ones are 4 '
    + 'and 3 and the result is 2. The Counter grows with the number of distinct values, not with '
    + 'the length of the input.',
  criticalInvariants: [
    { rule: 'The result counts DISTINCT VALUES with an odd count, not occurrences.',
      because: 'The value 4 appears three times and contributes exactly one to the result, not '
             + 'three. Reading the answer off the input length, or off a sum of the counts, gives a '
             + 'completely different number, and the two are easy to confuse when the trace shows '
             + 'both.' },
    { rule: 'An item not yet in the Counter reads as 0, so the first increment produces 1 with no '
          + 'special case.',
      because: 'The pass can be a single read-and-write per element only because an absent key '
             + 'reads as zero. A table that reported an error for a missing key would force a '
             + 'membership test before every increment, doubling the lookups for no gain.' },
    { rule: 'The parity test runs after the whole pass, over the Counter\'s entries.',
      because: 'A count\'s parity flips with every occurrence, so any decision taken mid-pass can '
             + 'be reversed by a later element. Only the final count carries meaning, and there are '
             + 'at most as many entries to test as there are distinct values.' },
    { rule: 'An even count must still be kept, not discarded.',
      because: 'A value whose count is currently even may become odd again later. Dropping entries '
             + 'at an even count throws away the state the next occurrence needs — in the default '
             + 'run the value 8 only reaches 2 because its entry survived being 1.' }
  ],
  examTraps: [
    { trap: 'Reading the result as the LIST of odd-occurring values rather than how many there are.',
      instead: 'Both appear in the trace, but the result is the count: 2 for the default input, with '
             + 'the values 4 and 3 sitting behind it.' },
    { trap: 'Reaching for sorting in order to group equal values.',
      instead: 'Sorting first costs about `n log n` before any counting starts. Hashing groups equal '
             + 'values in one pass without ordering anything, and the problem never asks for an '
             + 'order.' },
    { trap: 'Assuming the exclusive-or trick applies here.',
      instead: 'Combining values with exclusive-or answers only the special case of ONE '
             + 'odd-occurring value among otherwise paired ones. This problem asks how many '
             + 'distinct values have an odd count, which needs the counts themselves.' },
    { trap: 'Expecting the Counter to grow with the input.',
      instead: 'It grows with the number of DISTINCT values. Six elements that are all the same '
             + 'leave a single entry, and that is the space the method really uses.' }
  ],
  recognition: {
    stateVariables: ['`i`, the index being read', 'the item at that index',
                     'its count after the increment',
                     'the Counter entries, one per distinct value seen'],
    tell: 'A single table growing by DISTINCT VALUE while one index sweeps the input, followed by a '
        + 'pass over the TABLE rather than the input, is the counting shape. If the decision is '
        + 'instead taken as each element arrives, the problem is one whose answer cannot be '
        + 'overturned by later input — and a parity question never is.'
  },
  complexity: [
    { case: 'Counting pass', cost: 'about `n` steps for `n` elements',
      why: 'One hashed lookup and one store per element, each about one step on average, and no '
         + 'element is examined twice.' },
    { case: 'Reporting pass', cost: 'about one step per distinct value',
      why: 'The parity test touches each Counter entry once, and the number of entries is at most '
         + 'the length of the input and often far less.' },
    { case: 'The alternative being avoided', cost: 'about `n^2` comparisons',
      why: 'Counting each value by rescanning the array for it examines every pair of positions. '
         + 'The hashed Counter is what replaces that rescan with one lookup.' },
    { case: 'Space', cost: 'one entry per distinct value',
      why: 'Repeats share an entry, so the memory tracks distinctness rather than the length of the '
         + 'input.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one element of the input, with a final row for the parity of each count',
    columns: ['i', 'item', 'count after the increment', 'Counter entries']
  },
  seeAlso: [
    { id: 'hashsetcounter', why: 'the Counter operations this is built from, including why an absent '
                               + 'item reads as zero' },
    { id: 'anagram', why: 'the same Counter run as a balance that has to finish at zero' },
    { id: 'twosum', why: 'the same one-pass shape where membership, not a count, is what the problem '
                       + 'needs' },
    { id: 'hash', why: 'the table underneath, and the load factor that keeps each increment about one '
                     + 'step' }
  ]
};

T.anagram = {
  coreInvariant:
    'Two strings are anagrams exactly when every character occurs the same number of times in '
    + 'both. Keeping ONE table of DIFFERENCES rather than two separate tallies turns that into a '
    + 'single condition — every balance zero — because adding for one string and subtracting for '
    + 'the other makes a non-zero entry the direct evidence of a character the two strings do not '
    + 'share equally. Because a character\'s balance is reached by hashing the character, the '
    + 'whole test costs about one step per character; what is given up is any information about '
    + 'WHERE in either string the imbalance arose.',
  mechanism:
    'One Counter of per-character balances. Walk the first string incrementing each character\'s '
    + 'balance, then walk the second decrementing. The result is true when the two strings have '
    + 'the same length and every balance is 0. The trace shows the balance after each step and '
    + 'labels the column as the first string\'s count minus the second\'s, so the sign says which '
    + 'string has the surplus. Entries whose balance returns to 0 are left in the table at 0 '
    + 'rather than removed, which is harmless for the all-zero test and means the table grows with '
    + 'the number of distinct characters SEEN rather than with the number still unbalanced.',
  criticalInvariants: [
    { rule: 'One table of signed differences, not two tables compared afterwards.',
      because: 'Two tallies have to be compared entry by entry, and the comparison has to notice a '
             + 'character present in one table and absent from the other. One balance table makes '
             + '"absent" and "zero" the same thing, so the final condition collapses to "nothing is '
             + 'non-zero".' },
    { rule: 'Every character of both strings is counted, with none skipped.',
      because: 'The all-zero condition is only equivalent to the anagram condition if both strings '
             + 'were counted in full. Stopping the second walk at the first negative balance is a '
             + 'valid optimisation, but this implementation completes both walks, so the final '
             + 'table really is the complete difference.' },
    { rule: 'A balance of zero is not the same as an absent character, and the entry is kept.',
      because: 'The entry stays at 0 after cancelling. That is harmless for the test, but it means '
             + 'the table\'s size reports the distinct characters encountered rather than the '
             + 'characters still out of balance — and reading it as the latter gives the wrong '
             + 'figure.' }
  ],
  examTraps: [
    { trap: 'Treating the equal-length test as an extra condition the balances could miss.',
      instead: 'Once every character of both strings has been counted, all-zero balances already '
             + 'force the lengths to match, because each total is the sum of its own counts. The '
             + 'length test earns its place as a constant-time rejection BEFORE any counting, not '
             + 'as extra correctness afterwards.' },
    { trap: 'Sorting both strings and comparing them.',
      instead: 'That is correct and costs about `m log m` for strings of length `m`. The Counter '
             + 'settles it in about `m` steps, and the difference is precisely what the hashing '
             + 'buys.' },
    { trap: 'Reading the final table as a tally for either string.',
      instead: 'Each entry is the first string\'s count minus the second\'s. A value of 2 means a '
             + 'surplus of two in the first string, not that the character appears twice.' },
    { trap: 'Assuming the method needs a fixed alphabet.',
      instead: 'A hashed Counter takes whatever characters turn up, so it is not limited to 26 '
             + 'letters. A fixed array of 26 counters is faster still but silently wrong on any '
             + 'character outside the range it assumes.' }
  ],
  recognition: {
    stateVariables: ['which string the current character came from, which fixes the sign',
                     'the character', 'its balance after the step',
                     'the characters whose balance is still non-zero', 'the two lengths'],
    tell: 'One table whose values can go NEGATIVE is holding a balance; two tables compared at the '
        + 'end are tallies; one table of positive counts filtered at the end is a frequency '
        + 'problem. If the success condition is "everything is zero", a difference is being kept, '
        + 'and the sign of a leftover entry tells you which input the surplus came from.'
  },
  complexity: [
    { case: 'Both walks', cost: 'about `m` steps for strings of length `m`',
      why: 'One hashed lookup and update per character, each about one step on average, and each '
         + 'character is touched exactly once.' },
    { case: 'The sorting alternative', cost: 'about `m log m` comparisons',
      why: 'Both strings are ordered before any comparison happens. The Counter never orders '
         + 'anything, which is where the whole difference comes from.' },
    { case: 'Early rejection', cost: 'one step when the lengths differ',
      why: 'The lengths are known without counting, so unequal-length inputs are rejected before any '
         + 'table is built at all.' },
    { case: 'Space', cost: 'one entry per distinct character seen',
      why: 'Bounded by the alphabet in practice and by the string length in the worst case, so it '
         + 'does not grow with how many times a character repeats.' }
  ],
  convention: null,
  whatToDraw: {
    unit: 'one row = one character, signed by which string it came from',
    columns: ['source string', 'character', 'balance after the step', 'characters still non-zero']
  },
  seeAlso: [
    { id: 'hashsetcounter', why: 'the Counter this is built on, and what an absent key reads as' },
    { id: 'oddocc', why: 'the same Counter run as a tally rather than as a running balance' },
    { id: 'hash', why: 'the chaining table that makes each character update about one step' }
  ]
};

window.COMP2521RegisterTheory('adts', T);
})();
