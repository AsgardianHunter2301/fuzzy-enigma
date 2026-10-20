mod({
  id:'sortprops',group:'Sorting',name:'Sorting properties and complexity matrix',keywords:'stable unstable adaptive non-adaptive in-place complexity lower bound shell counting motivation why sort useful binary search rank duplicates merge set operations item key type typedef comparison macros',
  blocks:[{title:"Sorting properties - lecture concepts",src:LEC_SORT_PROPERTIES,source:'lecture',pseudo:true,pages:'week02 lectures'}],
  note:'The matrix consolidates the properties stated in the supplied sorting lectures. Shell sort and key-indexed counting sort are named in the supplied material but no algorithm or implementation is supplied in these files. The <b>motivation</b> and <b>Item and key types</b> sections are written by the tracer (CAP-026, CAP-028): the supplied lectures state these properties and use <code>Item</code> throughout the sorting signatures, but supply neither a motivation section nor the <code>Item</code> typedef in any sorting source.',
  fields:[],
  run(){
    const t=new Trace();t.v({algorithms:7}).step([0,1],'Compare the course sorting algorithms by case complexity and structural properties.',refView(
      /* CAP-026: the coverage index promises "Sorting motivation (why sorting
         is studied)" and routes it to this destination, which previously held
         only the comparison matrix, the analysis quantities and the lower
         bound - nothing that said why a sort is worth running. The promise is
         met with a short motivation section at the granularity the coverage
         row claims, and NO course citation is invented for it: the supplied
         sorting lectures contain no motivation section, and the section says
         so in its own source-status line. */
      {title:'Why sorting is worth doing',html:'<p>Sorting is almost never the goal. It is a one-off cost that makes the questions asked afterwards cheap:</p><ul><li><b>Binary search needs it.</b> On unsorted data a lookup must scan every element: O(n). On sorted data each test halves the live range: O(log n). The <a href="searching-sorting.html#bin">binary search</a> lesson takes a sorted array as a stated precondition and refuses an unordered one, because discarding half the range is only sound when the order tells you which half cannot hold the key.</li><li><b>Duplicate and rank queries collapse into a linear scan.</b> Equal keys end up adjacent, so finding duplicates becomes one left-to-right pass comparing neighbours instead of testing all n(n-1)/2 pairs; and the k-th smallest key is simply <code>items[k]</code>, with no search at all.</li><li><b>Merging and set operations become linear.</b> Two sorted runs combine with one cursor in each - precisely the <code>merge</code> step traced in <a href="searching-sorting.html#ms">merge sort</a> - so union, intersection and difference cost O(n + m) instead of re-scanning one input once per element of the other.</li></ul><p><b>The trade-off, concretely.</b> The sort is not free. Take n = 1,000,000 and count key comparisons: one linear search over unsorted data costs about 1,000,000; sorting once with an O(n log n) method costs about n log<sub>2</sub> n, which is roughly 20,000,000 because log<sub>2</sub> n here is a little under 20; each binary search afterwards costs about 20. The sort therefore pays for itself after roughly 20 searches - about log<sub>2</sub> n of them - and every query after that is nearly free. Ask one or two membership questions and a scan wins; ask many of them, or ask ranked, merged or set-valued questions at all, and sort first.</p><p><b>Source status:</b> the supplied sorting lectures state the properties and complexities tabled below but contain no motivation section. This section is written by the tracer and is not attributed to the course.</p>'},
      refTable('Sorting comparison',['Algorithm','Best','Average','Worst','Stable','Adaptive','In-place'],[
        ['Selection','O(n²)','O(n²)','O(n²)','No','No','Yes'],
        ['Bubble','O(n)','O(n²)','O(n²)','Yes','Yes','Yes'],
        ['Insertion','O(n)','O(n²)','O(n²)','Yes','Yes','Yes'],
        ['Merge','O(n log n)','O(n log n)','O(n log n)','Yes','No','No'],
        ['Quick','O(n log n)','O(n log n)','O(n²)','No','No','Yes'],
        ['Radix','O(m(n + R))','O(m(n + R))','O(m(n + R))','stable passes required','not classified','No (buckets)'],
        ['Bottom-up merge','O(n log n)','O(n log n)','O(n log n)','Yes','No','No']
      ]),
      {title:'Analysis quantities',html:'<p>The lectures use <code>n = hi - lo + 1</code>, count item comparisons <code>C</code>, and count swaps <code>S</code>. Existing order is considered through random, sorted and reverse-sorted inputs.</p>'},
      {title:'Lower bound',html:'<p>Comparison-based sorts require Ω(n log n) comparisons in the worst case. Radix sort can do better only by using key-symbol structure rather than comparisons alone.</p>'},
      /* CAP-028: "Item and key types" was a promised capability whose only
         displayed `typedef int Item;` sits in the stack, queue and bfs
         sources, so a learner working the sorting lessons met `Item` in every
         signature without ever being shown what it is. The contract is stated
         here, in the sorting overview, and each array-sort lesson carries the
         same contract in its note (modules-sorting.js, SORT_ITEM_NOTE). The
         macro half is interpolated from MACRO_NOTE rather than re-worded, so
         the two statements cannot drift apart or contradict each other. */
      {title:'Item and key types - the contract every sorting source here assumes',html:'<p>Every sorting function in the manual is declared over <code>Item</code>, never over <code>int</code>: <code>void selectionSort(Item items[], int lo, int hi)</code>, and the same shape for <code>bubbleSort</code>, <code>insertionSort</code>, <code>mergeSort</code>, <code>merge</code>, <code>naiveQuickSort</code>, <code>medianOfThreeQuickSort</code> and <code>partition</code>. For this course <code>Item</code> is declared <code>typedef int Item;</code> - the declaration the manual displays where it introduces its ADTs, visible in the <a href="adts.html#stack">Stack</a> and <a href="adts.html#queue">Queue</a> sources - so an item here <i>is</i> its own key, and one comparison compares two whole items.</p><p>'+MACRO_NOTE+' The sorting bodies never apply <code>&lt;</code> or <code>&gt;</code> to items directly; every key test goes through one of those four macros. That is the entire key contract: one typedef plus four macros. Point the typedef at a struct and redefine the four macros to compare its key field, and the same algorithm bodies sort a different item type unchanged.</p><p>Two consequences these traces depend on. <b>Stability</b> is a claim about equal keys keeping their original relative order, which is only observable once an item carries more than its key: with <code>typedef int Item;</code> two equal items are indistinguishable, so the Stable column above is a property of the algorithm rather than something any trace on this page can show you. And because <code>swap()</code> is never defined here, these traces model it as exchanging two whole items - which is why cost is counted in key comparisons and item moves, the quantities named above, and not in bytes.</p><p><b>Source status:</b> the four macros and the <code>Item</code> signatures are the manual\'s, and <code>typedef int Item;</code> is the manual\'s own declaration from its ADT sources. Consolidating them into one stated contract, and the two consequences drawn above, are written by the tracer. The manual uses <code>Item</code> in the sorting signatures without repeating the typedef there.</p>'}
    ));return t;
  }
});

const LEC_BOTTOM_UP = `void mergeSortBottomUp(Item items[], int lo, int hi) {
    for (int m = 1; m <= hi - lo; m *= 2) {
        for (int i = lo; i <= hi - m; i += 2 * m) {
            int end = min(i + 2 * m - 1, hi);
            merge(items, i, i + m - 1, end);
        }
    }
}`;
const LBU=lines(LEC_BOTTOM_UP,{sig:'void mergeSortBottomUp',outer:'for (int m = 1',inner:'for (int i = lo',end:'int end = min',merge:'merge(items, i'});
mod({
  id:'bottomup',group:'Sorting',name:'Bottom-up merge sort',keywords:'iterative merge runs m external sorting',
  blocks:[{title:"mergeSortBottomUp - lecture C",src:LEC_BOTTOM_UP,source:'lecture',pages:'week02lec01 divide-and-conquer'},{title:"merge - manual C",src:SRC_MERGE,source:'manual',pages:"pp. 3-4"}],
  note:'The lecture implementation reuses the same <code>merge</code> operation. Each merge allocates a temporary array and frees it before returning.',
  fields:[{k:'a',label:'items',def:'5 2 4 7 3 1 2 6'}],
  run(inp){
    const a=parseInts(inp.a),t=new Trace(),lo=0,hi=a.length-1;if(!a.length)throw new Error('items must not be empty');
    t.v({lo,hi}).step([0,LBU.sig],'Treat each single item as an already-sorted run.',sortView(a));
    function mergeTrace(L,M,H){
      const tmp=[],blk=t.alloc('malloc',`tmp[${H-L+1}]`,`${H-L+1} × sizeof(Item)`);let i=L,j=M+1,k=0;
      t.v({i,j,k,lo:L,mid:M,hi:H}).step([1,LMG.malloc],`Allocate <code>tmp</code> for runs [${L}..${M}] and [${M+1}..${H}].`,arrView(arrayRow('items',a,Object.fromEntries(range(L,H).map(x=>[x,'rng'])),{i,j}),arrayRow('tmp',tmp)));
      while(i<=M&&j<=H){
        t.v({i,j,k}).step([1,LMG.cmp],`Compare ${a[i]} and ${a[j]}; take from ${a[i]<=a[j]?'left':'right'} run.`,arrView(arrayRow('items',a,{[i]:'cmp',[j]:'cmp'},{i,j}),arrayRow('tmp',tmp,{},{k})));
        tmp[k++]=a[i]<=a[j]?a[i++]:a[j++];
      }
      while(i<=M)tmp[k++]=a[i++];while(j<=H)tmp[k++]=a[j++];
      for(let x=L,q=0;x<=H;x++,q++){a[x]=tmp[q];t.v({i:x,k:q}).step([1,LMG.copy],`Copy <code>tmp[${q}]</code> back to <code>items[${x}]</code>.`,sortView(a,{[x]:'mv'},{i:x}));}
      t.free(blk);t.step([1,LMG.free],'<code>free(tmp)</code>.',sortView(a));
    }
    for(let m=1;m<=hi-lo;m*=2){
      t.v({m}).step([0,LBU.outer],`Start a pass with sorted run length <code>m = ${m}</code>.`,sortView(a));
      for(let i=lo;i<=hi-m;i+=2*m){const end=Math.min(i+2*m-1,hi);t.v({m,i,end}).step([0,LBU.end],`Merge adjacent runs ending at <code>${end}</code>.`,sortView(a,Object.fromEntries(range(i,end).map(x=>[x,'rng'])),{i}));mergeTrace(i,i+m-1,end);}
    }
    t.drop('m','i','j','end','k','mid').step([0,LBU.sig],'All runs have merged into one sorted run.',sortView(a,{}, {},range(0,a.length-1)));return t;
  }
});

const LEC_LIST_SORTS = `Selection sort on a linked list:
- Repeatedly unlink the node containing the largest value from L
- Insert that node at the front of S

Bubble sort on a linked list:
- Compare adjacent values and swap values when out of order
- Repeat until a traversal makes no swaps

Insertion sort on a linked list:
- For each node in L, insert the node into S in order`;
/* CAP-037: the displayed lecture block states all three linked-list methods
   but only insertion was traced, so "Selection and bubble sort on a linked
   list" was promised and never demonstrated. All three are now traced, and
   each step resolves its highlighted line through a lines() table built over
   the displayed block instead of the hand-written indices the module used
   before: those sent the insertion trace to line 1 ("Selection sort on a
   linked list:"), to the blank line 8 and to the heading on line 9, so the
   highlighted statement disagreed with the note beside it. */
const LLSORT = lines(LEC_LIST_SORTS,{
  selHead:'Selection sort on a linked list:',
  selUnlink:'Repeatedly unlink the node containing the largest value',
  selPush:'Insert that node at the front of S',
  bubHead:'Bubble sort on a linked list:',
  bubCmp:'Compare adjacent values and swap values when out of order',
  bubPass:'Repeat until a traversal makes no swaps',
  insHead:'Insertion sort on a linked list:',
  insEach:'For each node in L, insert the node into S in order'
});
mod({
  id:'listsorts',group:'Sorting',name:"Sorting linked lists - pointer movement",keywords:'linked list selection bubble insertion sort unlink pointer relink splice head predecessor prev value swap method',
  blocks:[{title:"Linked-list sorting methods - lecture",src:LEC_LIST_SORTS,source:'lecture',pseudo:true,pages:'week02 elementary sorts'}],
  note:'The lecture gives these three methods as prose rather than as C, so no source C is invented here. All three are traced on the <b>same allocated nodes</b>, which is the point of the lesson: insertion walks <code>S</code> and splices into the middle of it, selection walks <code>L</code> and only ever writes <code>S</code>\'s head, and bubble sort as the lecture states it swaps <b>values</b> and therefore rewrites no <code>next</code> pointer at all. <b>Supplemental, written by the tracer and not course material:</b> the per-step commentary naming which pointer is written, the <code>prev</code> pointer the selection unlink needs, and the comparison, swap and traversal counts. The sub-label under each node is that node\'s identity, so a node that keeps its place in the chain while its value changes is visible as such. CAP-037.',
  fields:[{k:'a',label:'list values',def:'4 1 7 3 8 6 5 2'},
          {k:'method',label:'method',def:'insertion',type:'select',options:['insertion','selection','bubble']}],
  run(inp){
    const t=new Trace(),method=inp.method||'insertion';
    /* Each node carries a stable identity, so a frame can say which ALLOCATED
       NODE moved and which pointer was written. None of the three methods
       allocates or frees a node; only insertion and selection write any.

       The node-identity and NULL literals below are deliberately written with
       DOUBLE quotes. tools/audit_source_mapping.py discovers modules by the
       textual pattern (id, colon, single-quoted word), so writing those two
       literals in single quotes makes a ternary such as (node dot id, colon,
       quoted NULL) read to that static audit as the start of a module named
       NULL, which then mis-attributes every step site in the rest of this
       run() to the NEXT module's source block. Keep them double-quoted. */
    const original=parseInts(inp.a).map((v,i)=>({id:"n"+i,v}));
    const box=(n,cls)=>({v:n.v,cls:cls||'',sub:n.id});
    const L_LABEL='L — original nodes still to be placed (sub-label = node identity)';
    const S_LABEL='S — sorted output list';
    const twoLists=(L,S,act)=>({kind:'linked',lists:[
      {label:L_LABEL,nodes:L.map(n=>box(n,n===act?'new':''))},
      {label:S_LABEL,nodes:S.map(n=>box(n,n===act?'new':''))}]});
    const oneList=(L,marks)=>({kind:'linked',lists:[
      {label:'L — the single list, sorted in place (sub-label = node identity, whose order never changes)',
       nodes:L.map(n=>box(n,(marks||{})[n.id]||''))}]});

    if(method==='insertion'){
      const L=original.slice(),S=[];
      t.v({method,remaining:L.length,sorted:0}).step([0,LLSORT.insHead],
        'Insertion method: <code>S</code> starts empty, and every node that enters it is one of the <b>same allocated nodes</b> &mdash; nothing is copied, allocated or freed.',twoLists(L,S));
      while(L.length){
        const n=L.shift();
        t.v({current:n.v,remaining:L.length}).step([0,LLSORT.insEach],
          `Unlink node <code>${n.id}</code> (value ${n.v}) from the head of <code>L</code>. One pointer write, <code>L = L-&gt;next</code>; the node itself does not move.`,twoLists(L,S,n));
        /* The counted operation is one EVALUATION of `S[i] <= v`, which is
           the counted operation the sorting-work register states for this
           module - so the failing test that ends the scan counts too, and
           `i < S.length` short-circuiting means an empty S costs nothing.
           Counting only the successful tests would have reported 0 and 7 for
           the reverse and duplicate presets against the register's 5 and
           11, and the lesson would have disagreed with its own objective. */
        let i=0,comparisons=0;
        while(i<S.length){comparisons++;if(!(S[i].v<=n.v))break;i++;}
        t.v({current:n.v,position:i,comparisons}).step([0,LLSORT.insEach],
          `Walk <code>S</code> from its head for the slot: <code>while (i &lt; S.length &amp;&amp; S[i] &lt;= v) i++</code> stopped at position <b>${i}</b> after ${comparisons} evaluation${comparisons===1?'':'s'} of <code>S[i] &lt;= v</code>. This scan of <code>S</code> is what makes the insertion method dearest on already-ascending input.`,twoLists(L,S,n));
        S.splice(i,0,n);
        t.v({remaining:L.length,sorted:S.length}).step([0,LLSORT.insEach],
          i===0?`Relink <code>${n.id}</code> at the head of <code>S</code>: two writes, <code>${n.id}-&gt;next = ${S[1]?S[1].id:"NULL"}</code> and <code>S = ${n.id}</code>.`
               :`Splice <code>${n.id}</code> after <code>${S[i-1].id}</code>: two writes, <code>${n.id}-&gt;next = ${S[i+1]?S[i+1].id:"NULL"}</code> and <code>${S[i-1].id}-&gt;next = ${n.id}</code>. No other node in <code>S</code> moves.`,twoLists(L,S,n));
      }
      t.drop('current','position','comparisons').step([0,LLSORT.insEach],
        'All original nodes are now linked in sorted order. No node was allocated or freed by this method.',twoLists(L,S));
      return t;
    }

    if(method==='selection'){
      const L=original.slice(),S=[];
      t.v({method,remaining:L.length,sorted:0}).step([0,LLSORT.selHead],
        'Selection method: each pass takes the <b>largest</b> remaining value and pushes that node onto the <b>front</b> of <code>S</code>, so <code>S</code> is built up in ascending order from its head.',twoLists(L,S));
      let pass=0,pointerWrites=0;
      while(L.length){
        pass++;
        t.v({pass,remaining:L.length,sorted:S.length}).step([0,LLSORT.selUnlink],
          `Pass ${pass}: scan <code>L</code> for the largest value. A singly linked node cannot unlink itself, so the scan must carry the <b>predecessor</b> of the running maximum as well as the maximum.`,twoLists(L,S));
        let max=0;
        for(let j=1;j<L.length;j++){
          const better=L[j].v>L[max].v;
          t.v({candidate:L[j].v,largest:L[better?j:max].v}).step([0,LLSORT.selUnlink],
            `Compare <code>${L[j].id}</code> (${L[j].v}) with the running largest <code>${L[max].id}</code> (${L[max].v}): ${better?'<b>larger</b>, so both the running maximum and its <code>prev</code> move':'not larger, so neither moves'}.`,
            twoLists(L,S,L[better?j:max]));
          if(better)max=j;
        }
        const n=L[max],prev=max>0?L[max-1]:null;
        L.splice(max,1);
        pointerWrites++;
        t.v({current:n.v,remaining:L.length,pointerWrites}).step([0,LLSORT.selUnlink],
          prev?`Unlink <code>${n.id}</code> (value ${n.v}) with one write through its predecessor: <code>${prev.id}-&gt;next = ${L[max]?L[max].id:"NULL"}</code>.`
              :`<code>${n.id}</code> (value ${n.v}) is the head of <code>L</code>, so the unlink writes the list head instead of a node: <code>L = ${L[0]?L[0].id:"NULL"}</code>.`,twoLists(L,S,n));
        S.unshift(n);
        pointerWrites+=2;
        t.v({sorted:S.length,pointerWrites}).step([0,LLSORT.selPush],
          `Push <code>${n.id}</code> onto the front of <code>S</code>: two writes, <code>${n.id}-&gt;next = ${S[1]?S[1].id:"NULL"}</code> and <code>S = ${n.id}</code>. <b>Nothing in <code>S</code> is scanned or relinked</b> &mdash; that is the whole difference from the insertion method, which walks <code>S</code> for every node.`,twoLists(L,S,n));
      }
      t.drop('pass','candidate','largest','current').step([0,LLSORT.selPush],
        `Every original node has been relinked into <code>S</code> in ascending order, in ${pass} pass${pass===1?'':'es'} and ${pointerWrites} pointer write${pointerWrites===1?'':'s'} &mdash; three per pass, one to unlink and two to push the front. Each pass scanned <code>L</code> and never <code>S</code>; no node was allocated or freed.`,twoLists(L,S));
      return t;
    }

    /* bubble: the lecture states this method as swapping VALUES, so the chain
       itself is never rewritten. That is the pointer-movement lesson here. */
    const a=original.slice();
    t.v({method,nodes:a.length,swaps:0}).step([0,LLSORT.bubHead],
      'Bubble method: the lecture swaps <b>values</b>, not nodes. Watch the sub-labels &mdash; <code>n0</code>, <code>n1</code>, &hellip; stay in that order in the chain for the whole trace, because <b>no <code>next</code> pointer is ever written</b>. Only the <code>item</code> field inside each node changes.',oneList(a));
    let traversal=0,swaps=0,swapped=true;
    while(swapped){
      swapped=false;traversal++;
      t.v({traversal,swaps}).step([0,LLSORT.bubPass],
        `Traversal ${traversal}: walk the chain from the head, comparing each node with its successor.`,oneList(a));
      for(let j=0;j+1<a.length;j++){
        const out=a[j].v>a[j+1].v;
        t.v({at:a[j].id,comparing:a[j].v+' vs '+a[j+1].v}).step([0,LLSORT.bubCmp],
          `<code>${a[j].id}-&gt;item = ${a[j].v}</code> against <code>${a[j+1].id}-&gt;item = ${a[j+1].v}</code>: ${out?'<b>out of order</b>':'in order, leave both alone'}.`,
          oneList(a,{[a[j].id]:'new',[a[j+1].id]:'new'}));
        if(out){
          const tmp=a[j].v;a[j].v=a[j+1].v;a[j+1].v=tmp;swapped=true;swaps++;
          t.v({swaps}).step([0,LLSORT.bubCmp],
            `Swap the two <b>values</b> in place: <code>${a[j].id}</code> now holds ${a[j].v} and <code>${a[j+1].id}</code> holds ${a[j+1].v}. Both nodes keep their position in the chain, and both <code>next</code> pointers are untouched.`,
            oneList(a,{[a[j].id]:'new',[a[j+1].id]:'new'}));
        }
      }
      t.v({traversal,swaps}).step([0,LLSORT.bubPass],
        swapped?`Traversal ${traversal} swapped at least one pair, so the method must traverse again.`
               :`Traversal ${traversal} made <b>no swap</b>, so the list is in order and the method stops. Note that this needs a full confirming traversal, and that the stated method never shrinks its range the way the array version does with <code>for (int i = hi; i &gt; lo; i--)</code>.`,
        oneList(a));
    }
    t.drop('traversal','at','comparing').step([0,LLSORT.bubPass],
      `Sorted after ${traversal} traversal${traversal===1?'':'s'} and ${swaps} value swap${swaps===1?'':'s'}, with <b>zero pointer writes</b>: the chain is still <code>${a.map(n=>n.id).join(' -&gt; ')||'NULL'}</code>, exactly the order these nodes were allocated in. Compare the other two methods, which sort by relinking nodes and never touch a value.`,
      oneList(a));
    return t;
  }
});

const LEC_QUICK_VARIANTS = `void randomisedQuickSort(Item items[], int lo, int hi) {
    if (lo >= hi) return;
    swap(items, lo, randint(lo, hi));
    int pivotIndex = partition(items, lo, hi);
    randomisedQuickSort(items, lo, pivotIndex - 1);
    randomisedQuickSort(items, pivotIndex + 1, hi);
}

int randint(int lo, int hi) {
    int i = rand() % (hi - lo + 1);
    return lo + i;
}

#define THRESHOLD 5
void quickSort(Item items[], int lo, int hi) {
    if (hi - lo < THRESHOLD) {
        insertionSort(items, lo, hi);
        return;
    }
    medianOfThree(items, lo, hi);
    int pivotIndex = partition(items, lo, hi);
    quickSort(items, lo, pivotIndex - 1);
    quickSort(items, pivotIndex + 1, hi);
}`;
mod({
  id:'quickvariants',group:'Sorting',name:'Quick-sort variants and improvements',keywords:'randomised randomized threshold insertion sort quick list',
  blocks:[{title:"Randomised and threshold quick sort - lecture C",src:LEC_QUICK_VARIANTS,source:'lecture',pages:'week02 divide-and-conquer'}],
  note:'The existing naive and median-of-three modules perform full traces. This module preserves the additional lecture variants without pretending that a particular random pivot was selected by the source.',
  fields:[],run(){const t=new Trace();t.step([0,1],'Course-supplied quick-sort variants.',refView(
    {title:'Randomised pivot',html:'<p>Swap a pseudo-randomly selected element into <code>items[lo]</code>, then use the same course <code>partition</code>. This makes systematically adversarial input unlikely, but does not change the worst-case bound.</p>'},
    /* CUR-MOD-06: the prose said "partitions smaller than THRESHOLD = 5",
     which is off by one against the source. quickSort is called with
     INCLUSIVE bounds lo..hi, so a partition holds hi - lo + 1 items and the
     guard `hi - lo < THRESHOLD` is true when hi - lo + 1 <= 5. A five-item
     partition therefore IS handed to insertion sort. The corrected wording
     and the explicit 4/5/6-item boundary cases below are checked against the
     displayed condition, not against the previous description. */
    {title:'Insertion-sort threshold',html:'<p>The lecture switches to insertion sort for small partitions, to avoid recursive overhead. <code>quickSort</code> takes <b>inclusive</b> bounds, so a partition holds <code>hi - lo + 1</code> items and the guard <code>hi - lo &lt; THRESHOLD</code> with <code>THRESHOLD = 5</code> is true for partitions of <b>five items or fewer</b> &mdash; five is included, not excluded.</p><table class="grid"><tr><th>items</th><th><code>hi - lo</code></th><th><code>hi - lo &lt; 5</code></th><th>handled by</th></tr><tr><td>4</td><td>3</td><td>true</td><td>insertion sort</td></tr><tr><td>5</td><td>4</td><td>true</td><td>insertion sort (the boundary case)</td></tr><tr><td>6</td><td>5</td><td>false</td><td>median-of-three, partition, recurse</td></tr></table><p>A second variant defers all small partitions and performs one final insertion sort over the whole array instead.</p>'},
    {title:'Quick sort on linked lists',html:'<p>Choose a pivot, distribute existing nodes into two lists, recursively sort both lists, then concatenate sorted A, the pivot and sorted B. The lecture supplies the method, not complete C.</p>'}
  ));return t;}
});

/* ---------- ADT architecture and Set ---------- */
const LEC_ADT_ARCH = `In C, an abstract data type is implemented using two files:
- a .h file containing the interface
- a .c file containing the implementation

The interface contains an opaque pointer typedef, operation prototypes and contracts.
Users interact only with the interface and cannot access the concrete struct directly.`;
const LEC_SET_IF = `typedef struct set *Set;

Set SetNew(void);
void SetFree(Set set);
void SetInsert(Set set, int item);
bool SetContains(Set set, int item);
void SetDelete(Set set, int item);
int SetSize(Set set);
void SetShow(Set set);`;