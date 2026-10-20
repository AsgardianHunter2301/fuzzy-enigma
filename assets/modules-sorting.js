/* ============================================================
   CAP-028 - ITEM AND KEY TYPES
   ------------------------------------------------------------
   "Item and key types" is a promised capability, but the only displayed
   `typedef int Item;` in this corpus sits in the stack, queue and bfs
   sources. A learner working through the sorting lessons therefore met
   `Item` in every signature here without ever being shown what it is.

   MACRO_NOTE (modules-registry.js, which this file must not edit) already
   states the macro half of the contract. This note EXTENDS that exact
   wording with the type half rather than restating it differently, so the
   two can never contradict each other, and the sorting overview carries the
   full contract (corpus-sorting.js, sortprops).
   ============================================================ */
const SORT_ITEM_NOTE = MACRO_NOTE+' These signatures are declared over <code>Item</code>, not over <code>int</code>: for this course <code>Item</code> is <code>typedef int Item;</code>, the declaration the manual displays with its ADT sources (<a href="adts.html#stack">Stack</a>, <a href="adts.html#queue">Queue</a>), so an item here <i>is</i> its own key and one <code>lt</code>/<code>le</code>/<code>ge</code>/<code>gt</code> test compares two whole keys. <a href="searching-sorting.html#sortprops">Sorting properties</a> states the full type and comparison contract, including what <code>Item</code> being a plain <code>int</code> means for the stability claims.';

/* ============================================================
   SELECTION SORT
   ============================================================ */
mod({
  id:'sel', group:'Sorting', name:'Selection sort',
  blocks:[{title:'Comparison macros',src:SRC_MACROS,pages:'p. 2'},{title:'selectionSort',src:SRC_SEL,pages:'p. 2'}],
  note:SORT_ITEM_NOTE,
  fields:[{k:'a',label:'items',def:'8 3 9 1 7 4'}],
  run(inp){
    const a = parseInts(inp.a), lo=0, hi=a.length-1, t=new Trace();
    t.v({lo,hi}).step([1,LSEL.sig],'Sort <code>items[lo..hi]</code> in place. Nothing is allocated — selection sort is fully in-place.',sortView(a));
    for(let i=lo;i<hi;i++){
      t.v({i}).step([1,LSEL.outer],`Pass for position <b>${i}</b>. Everything left of ${i} is already final.`,sortView(a,{[i]:'mv'},{i},range(lo,i-1)));
      let min=i;
      t.v({min}).step([1,LSEL.min],`Assume <code>items[${i}] = ${a[i]}</code> is the smallest so far.`,sortView(a,{[i]:'mv',[min]:'cmp'},{i,min},range(lo,i-1)));
      for(let j=i+1;j<=hi;j++){
        t.v({j}).step([1,LSEL.cmp],`<code>lt(items[${j}], items[${min}])</code> → <code>${a[j]} &lt; ${a[min]}</code> is ${a[j]<a[min]?'<b>true</b>':'false'}.`,
          sortView(a,{[j]:'cmp',[min]:'pivot'},{i,j,min},range(lo,i-1)));
        if(a[j]<a[min]){ min=j; t.v({min}).step([1,LSEL.set],`New minimum found at index <b>${j}</b>.`,sortView(a,{[min]:'pivot'},{i,j,min},range(lo,i-1))); }
      }
      t.step([1,LSEL.swap],`Swap <code>items[${i}]</code> and <code>items[${min}]</code>. ${i===min?'Same index — the swap is a no-op.':''}`,sortView(a,{[i]:'mv',[min]:'mv'},{i,min},range(lo,i-1)));
      const tmp=a[i]; a[i]=a[min]; a[min]=tmp;
      t.drop('j').step([1,LSEL.outer],`Position ${i} is now final.`,sortView(a,{},{i},range(lo,i)));
    }
    t.drop('i','j','min').step([1,LSEL.sig],'Sorted. The array segment is sorted.',sortView(a,{},{},range(lo,hi)));
    return t;
  }
});
function range(a,b){const r=[];for(let i=a;i<=b;i++)r.push(i);return r;}

/* ============================================================
   BUBBLE SORT
   ============================================================ */
mod({
  id:'bub', group:'Sorting', name:'Bubble sort',
  blocks:[{title:'Comparison macros',src:SRC_MACROS,pages:'p. 2'},{title:'bubbleSort',src:SRC_BUB,pages:'pp. 2-3'}],
  note:SORT_ITEM_NOTE,
  fields:[{k:'a',label:'items',def:'5 2 8 1 9 3'}],
  run(inp){
    const a=parseInts(inp.a), lo=0, hi=a.length-1, t=new Trace();
    t.v({lo,hi}).step([1,LBUB.outer],'Each pass bubbles the largest remaining item to the right-hand end.',sortView(a));
    for(let i=hi;i>lo;i--){
      let swapped=false;
      t.v({i,swapped:'false'}).step([1,LBUB.flag],`Pass ending at index <b>${i}</b>. Reset <code>swapped</code>.`,sortView(a,{},{i},range(i+1,hi)));
      for(let j=lo;j<i;j++){
        t.v({j}).step([1,LBUB.cmp],`<code>gt(items[${j}], items[${j+1}])</code> → <code>${a[j]} &gt; ${a[j+1]}</code> is ${a[j]>a[j+1]?'<b>true</b>':'false'}.`,
          sortView(a,{[j]:'cmp',[j+1]:'cmp'},{j,i},range(i+1,hi)));
        if(a[j]>a[j+1]){
          const tm=a[j];a[j]=a[j+1];a[j+1]=tm; swapped=true;
          t.v({swapped:'true'}).step([1,LBUB.swap],`Out of order — swap them.`,sortView(a,{[j]:'mv',[j+1]:'mv'},{j,i},range(i+1,hi)));
        }
      }
      t.step([1,LBUB.brk],swapped?'At least one swap happened, so keep going.':'<b>No swaps this pass</b> — the array is already sorted, so break early. The <code>break</code> statement ends the outer loop.',
        sortView(a,{},{i},range(i,hi)));
      if(!swapped) break;
    }
    t.drop('i','j').step([1,LBUB.outer],'Sorted.',sortView(a,{},{},range(lo,hi)));
    return t;
  }
});

/* ============================================================
   INSERTION SORT
   ============================================================ */
mod({
  id:'ins', group:'Sorting', name:'Insertion sort',
  blocks:[{title:'Comparison macros',src:SRC_MACROS,pages:'p. 2'},{title:'insertionSort',src:SRC_INS,pages:'p. 3'}],
  note:SORT_ITEM_NOTE,
  fields:[{k:'a',label:'items',def:'7 2 9 4 1 5'}],
  run(inp){
    const a=parseInts(inp.a), lo=0, hi=a.length-1, t=new Trace();
    t.v({lo,hi}).step([1,LINS.outer],'The left part is kept sorted; each new item is slid back into place.',sortView(a,{},{},[0]));
    for(let i=lo+1;i<=hi;i++){
      const item=a[i];
      t.drop('j').v({i,item}).step([1,LINS.hold],`Lift <code>items[${i}] = ${item}</code> into <code>item</code>. Index ${i} is now a hole.`,
        arrView(arrayRow('items',a,{[i]:'hole'},{i}), arrayRow('item (register)',[item],{0:'mv'},{})));
      let j=i;
      t.v({j}).step([1,LINS.j],`Start the search for <code>${item}</code>'s slot at <code>j = ${j}</code>.`,
        arrView(arrayRow('items',a,{[i]:'hole'},{i,j}), arrayRow('item (register)',[item],{0:'mv'},{})));
      while(j>lo && item<a[j-1]){
        t.step([1,LINS.inner],`<code>j &gt; lo</code> and <code>lt(item, items[${j-1}])</code> → <code>${item} &lt; ${a[j-1]}</code>: shift right.`,
          arrView(arrayRow('items',a,{[j]:'hole',[j-1]:'cmp'},{j}), arrayRow('item (register)',[item],{0:'mv'},{})));
        a[j]=a[j-1]; j--;
        t.v({j}).step([1,LINS.shift],`<code>items[${j+1}] = items[${j}]</code>. The hole moves left.`,
          arrView(arrayRow('items',a,{[j]:'hole'},{j}), arrayRow('item (register)',[item],{0:'mv'},{})));
      }
      t.step([1,LINS.inner],j===lo?`<code>j == lo</code> — can't go further left.`:`<code>${item} &lt; ${a[j-1]}</code> is false — the slot is found.`,
        arrView(arrayRow('items',a,{[j]:'hole'},{j}), arrayRow('item (register)',[item],{0:'mv'},{})));
      a[j]=item;
      t.step([1,LINS.place],`Drop <code>item</code> into <code>items[${j}]</code>. <code>items[0..${i}]</code> is sorted again.`,
        arrView(arrayRow('items',a,{[j]:'mv'},{j}, null)));
    }
    t.drop('i','j','item').step([1,LINS.outer],'Sorted.',sortView(a,{},{},range(lo,hi)));
    return t;
  }
});

/* ============================================================
   MERGE SORT  (heap ledger is the point here)
   ============================================================ */
mod({
  id:'ms', group:'Sorting', name:'Merge sort',
  blocks:[{title:'Comparison macros',src:SRC_MACROS,pages:'p. 2'},{title:'mergeSort',src:SRC_MS,pages:'p. 3'},{title:'merge',src:SRC_MERGE,pages:'pp. 3-4'}],
  note:SORT_ITEM_NOTE,
  fields:[{k:'a',label:'items',def:'6 3 8 1 9 2 7'}],
  run(inp){
    const a=parseInts(inp.a), t=new Trace(); let depth=0;
    const seg=(lo,hi,cls)=>{ const c=Object.assign({},cls||{}); for(let i=lo;i<=hi;i++) if(!c[i]) c[i]='rng'; return c; };

    function ms(lo,hi){
      t.v({lo,hi,depth}).step([1,LMS.base],lo>=hi?`<code>lo &gt;= hi</code> — a run of ${hi<lo?0:1} item is sorted by definition. Return.`:`Segment <code>[${lo}..${hi}]</code> at recursion depth ${depth}.`,
        arrView(arrayRow('items',a,seg(lo,hi),{lo,hi})));
      if(lo>=hi) return;
      const mid=Math.floor((lo+hi)/2);
      t.v({mid}).step([1,LMS.mid],`<code>mid = (${lo} + ${hi}) / 2 = ${mid}</code> — integer division truncates.`,
        arrView(arrayRow('items',a,seg(lo,hi,{[mid]:'pivot'}),{lo,mid,hi})));
      t.step([1,LMS.left],`Recurse on the left half <code>[${lo}..${mid}]</code>.`,arrView(arrayRow('items',a,seg(lo,mid),{lo,mid})));
      depth++; ms(lo,mid); depth--;
      t.v({lo,hi,mid,depth}).step([1,LMS.right],`Recurse on the right half <code>[${mid+1}..${hi}]</code>.`,arrView(arrayRow('items',a,seg(mid+1,hi),{hi})));
      depth++; ms(mid+1,hi); depth--;
      t.v({lo,hi,mid,depth}).step([1,LMS.merge],`Both halves are sorted. Merge them.`,arrView(arrayRow('items',a,seg(lo,hi),{lo,mid,hi})));
      merge(lo,mid,hi);
    }

    function merge(lo,mid,hi){
      const n=hi-lo+1;
      const blk=t.alloc('malloc',`tmp — merge[${lo}..${hi}]`,`${n} × sizeof(Item)`);
      const tmp=new Array(n).fill(null);
      t.step([2,LMG.malloc],`<b>malloc</b> a scratch buffer of ${n} Items, exactly as shown in <code>merge</code>.`,
        arrView(arrayRow('items',a,seg(lo,hi),{lo,mid,hi}), arrayRow('tmp (heap)',tmp,{},{})));
      let i=lo,j=mid+1,k=0;
      t.v({i,j,k}).step([2,LMG.k],`Two read cursors into <code>items</code>, one write cursor into <code>tmp</code>.`,
        arrView(arrayRow('items',a,seg(lo,hi,{[i]:'cmp',[j]:'cmp'}),{i,j}), arrayRow('tmp (heap)',tmp,{},{k})));
      while(i<=mid && j<=hi){
        const take = a[i]<=a[j];
        t.step([2,LMG.cmp],`<code>le(items[${i}], items[${j}])</code> → <code>${a[i]} &lt;= ${a[j]}</code> is ${take?'<b>true</b>, take from the left':'false, take from the right'}. The <code>le</code> condition selects the left item when values are equal.`,
          arrView(arrayRow('items',a,seg(lo,hi,{[i]:'cmp',[j]:'cmp'}),{i,j}), arrayRow('tmp (heap)',tmp,{},{k})));
        if(take){ tmp[k]=a[i]; t.v({i:i+1,k:k+1}).step([2,LMG.takeL],`<code>tmp[${k}] = items[${i}]</code>, then both cursors post-increment.`,
            arrView(arrayRow('items',a,seg(lo,hi),{i:i+1,j}), arrayRow('tmp (heap)',tmp,{[k]:'mv'},{}))); i++; k++; }
        else{ tmp[k]=a[j]; t.v({j:j+1,k:k+1}).step([2,LMG.takeR],`<code>tmp[${k}] = items[${j}]</code>.`,
            arrView(arrayRow('items',a,seg(lo,hi),{i,j:j+1}), arrayRow('tmp (heap)',tmp,{[k]:'mv'},{}))); j++; k++; }
      }
      t.step([2,i>mid?LMG.drainR:LMG.drainL],i>mid?`Left half is exhausted — copy the rest of the right half straight across.`:`Right half is exhausted — copy the rest of the left half straight across.`,
        arrView(arrayRow('items',a,seg(lo,hi),{i,j}), arrayRow('tmp (heap)',tmp,{},{k})));
      while(i<=mid){ tmp[k]=a[i]; i++; k++; }
      while(j<=hi){ tmp[k]=a[j]; j++; k++; }
      t.v({i,j,k}).step([2,LMG.drainR],`<code>tmp</code> now holds the merged run.`,
        arrView(arrayRow('items',a,seg(lo,hi),{}), arrayRow('tmp (heap)',tmp,{},{})));
      for(let x=lo,y=0;x<=hi;x++,y++) a[x]=tmp[y];
      t.step([2,LMG.copy],`Copy <code>tmp</code> back over <code>items[${lo}..${hi}]</code>.`,
        arrView(arrayRow('items',a,seg(lo,hi,Object.fromEntries(range(lo,hi).map(x=>[x,'mv']))),{}), arrayRow('tmp (heap)',tmp,{},{})));
      t.free(blk);
      t.drop('i','j','k').step([2,LMG.free],`<b>free(tmp)</b>. The allocation made at the start of this <code>merge</code> call is now released.`,
        arrView(arrayRow('items',a,seg(lo,hi),{})));
    }

    ms(0,a.length-1);
    t.drop('lo','hi','mid','i','j','k','depth').step([1,LMS.merge],'Sorted. The heap is empty again — every scratch buffer was freed.',
      arrView(arrayRow('items',a,Object.fromEntries(a.map((_,i)=>[i,'done'])),{})));
    return t;
  }
});

/* ============================================================
   QUICK SORT (naive + median of three)
   ============================================================ */
function quickModule(id,name,useM3){
  mod({
    id, group:'Sorting', name,
    blocks:[{title:'Comparison macros',src:SRC_MACROS,pages:'p. 2'},
            {title:useM3?'medianOfThreeQuickSort / medianOfThree':'naiveQuickSort',src:useM3?SRC_M3:SRC_QS,pages:useM3?'p. 5':'p. 4'},
            {title:'partition',src:SRC_PART,pages:'p. 4'}],
    note:SORT_ITEM_NOTE,
    fields:[{k:'a',label:'items',def: useM3?'3 9 1 8 2 7 5 4':'5 3 9 1 7 2 8'}],
    run(inp){
      const a=parseInts(inp.a), t=new Trace();
      const LQ = useM3?LM3:LQS;
      const seg=(lo,hi,cls)=>{const c=Object.assign({},cls||{});for(let i=lo;i<=hi;i++)if(!c[i])c[i]='rng';return c;};

      function m3(lo,hi){
        const mid=Math.floor((lo+hi)/2);
        t.v({mid}).step([1,LM3.mid],`<code>mid = ${mid}</code>. Order <code>a[mid], a[lo], a[hi]</code> so the median ends up at <code>lo</code>.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'cmp',[mid]:'cmp',[hi]:'cmp'}),{lo,mid,hi})));
        /* NEW-03: each of medianOfThree's three gt() tests is now shown
           whether or not it swaps. Previously a frame was emitted only on a
           swap, so a learner stepping through never saw a comparison evaluate
           false, and the displayed source (three unconditional `if (gt(...))`
           statements) disagreed with the trace. It also meant the timeline
           under-reported the comparison count: 11/14/18 frames for inputs
           whose source performs 18/19/24 comparisons. The counted operation
           and the source-derived counts are stated in the exercise
           objectives; the trace now shows every test. */
        const m3test=(line,label,cond,hiCls)=>{
          t.step([1,line],`<code>${label}</code> is <b>${cond}</b>.`,
            arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'cmp',[mid]:'cmp',[hi]:'cmp'}),{lo,mid,hi})));
          return cond;
        };
        if(m3test(LM3.s1,'a[mid] &gt; a[lo]',a[mid]>a[lo])){ swp(a,mid,lo); t.step([1,LM3.s1],`Swap <code>a[mid]</code> and <code>a[lo]</code>.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'mv',[mid]:'mv'}),{lo,mid,hi}))); }
        if(m3test(LM3.s2,'a[lo] &gt; a[hi]',a[lo]>a[hi])){ swp(a,lo,hi); t.step([1,LM3.s2],`Swap <code>a[lo]</code> and <code>a[hi]</code>.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'mv',[hi]:'mv'}),{lo,mid,hi}))); }
        if(m3test(LM3.s3,'a[mid] &gt; a[lo]',a[mid]>a[lo])){ swp(a,mid,lo); t.step([1,LM3.s3],`Swap <code>a[mid]</code> and <code>a[lo]</code> again.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'mv',[mid]:'mv'}),{lo,mid,hi}))); }
        t.step([1,LM3.mid],`<code>a[${lo}] = ${a[lo]}</code> is now the median of the three. The median of the three values is placed at <code>lo</code> before partitioning.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot'}),{lo,hi})));
      }

      function partition(lo,hi){
        const pivot=a[lo];
        t.v({pivot}).step([2,LPT.piv],`Pivot is <code>items[lo] = ${pivot}</code>.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot'}),{lo,hi})));
        let l=lo+1,r=hi;
        t.v({l,r}).step([2,LPT.r],`Two cursors close in from either end of <code>[${lo+1}..${hi}]</code>.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot'}),{l,r})));
        while(true){
          while(l<r && a[l]<=pivot){
            t.v({l}).step([2,LPT.scanL],`<code>items[${l}] = ${a[l]} &lt;= ${pivot}</code> — already on the correct side, advance <code>l</code>.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot',[l]:'cmp'}),{l,r})));
            l++;
          }
          t.v({l}).step([2,LPT.scanL],l>=r?`<code>l == r</code> — the scan stops.`:`<code>items[${l}] = ${a[l]} &gt; ${pivot}</code> — this one belongs on the right. Stop.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot',[l]:'cmp'}),{l,r})));
          while(l<r && a[r]>=pivot){
            t.v({r}).step([2,LPT.scanR],`<code>items[${r}] = ${a[r]} &gt;= ${pivot}</code> — correct side, retreat <code>r</code>.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot',[r]:'cmp'}),{l,r})));
            r--;
          }
          t.v({r}).step([2,LPT.scanR],l>=r?`<code>l == r</code>.`:`<code>items[${r}] = ${a[r]} &lt; ${pivot}</code> — belongs on the left. Stop.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot',[r]:'cmp'}),{l,r})));
          if(l===r){ t.step([2,LPT.brk],`<code>l == r</code> — cursors met, leave the loop.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot',[l]:'mv'}),{l,r}))); break; }
          swp(a,l,r);
          t.step([2,LPT.swap],`Swap the two misplaced items.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot',[l]:'mv',[r]:'mv'}),{l,r})));
        }
        if(pivot<a[l]){ l--; t.v({l}).step([2,LPT.adj],`<code>lt(pivot, items[l])</code> is true, so <code>l</code> is one past the last item ≤ pivot — step back to <b>${l}</b>.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot',[l]:'mv'}),{l})));}
        else t.step([2,LPT.adj],`<code>lt(pivot, items[l])</code> is false — <code>l</code> already points at the pivot's home.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot',[l]:'mv'}),{l})));
        swp(a,lo,l);
        t.step([2,LPT.fin],`Swap the pivot into index <b>${l}</b>. Everything left is ≤ ${pivot}, everything right is ≥ ${pivot}. Index ${l} is final.`,arrView(arrayRow('items',a,seg(lo,hi,{[l]:'done'}),{l})));
        return l;
      }

      function qs(lo,hi){
        t.v({lo,hi}).step([1,LQ.base],lo>=hi?`<code>[${lo}..${hi}]</code> has ${hi<lo?0:1} item — return.`:`Sort <code>[${lo}..${hi}]</code>.`,arrView(arrayRow('items',a,seg(lo,hi),{lo,hi})));
        if(lo>=hi) return;
        if(useM3) m3(lo,hi);
        t.step([1,LQ.part],`Partition around the pivot.`,arrView(arrayRow('items',a,seg(lo,hi,{[lo]:'pivot'}),{lo,hi})));
        const p=partition(lo,hi);
        t.v({pivotIndex:p}).step([1,LQ.left],`Recurse left on <code>[${lo}..${p-1}]</code>.`,arrView(arrayRow('items',a,seg(lo,p-1,{[p]:'done'}),{})));
        qs(lo,p-1);
        t.v({lo,hi,pivotIndex:p}).step([1,LQ.right],`Recurse right on <code>[${p+1}..${hi}]</code>.`,arrView(arrayRow('items',a,seg(p+1,hi,{[p]:'done'}),{})));
        qs(p+1,hi);
      }
      qs(0,a.length-1);
      t.drop('lo','hi','l','r','pivot','pivotIndex','mid').step([1,LQ.base],'Sorted, entirely in place — quicksort allocates nothing on the heap.',arrView(arrayRow('items',a,Object.fromEntries(a.map((_,i)=>[i,'done'])),{})));
      return t;
    }
  });
}
function swp(a,i,j){const t=a[i];a[i]=a[j];a[j]=t;}
quickModule('qs','Quick sort (naive pivot)',false);
quickModule('q3','Quick sort (median of three)',true);

/* ============================================================
   RADIX SORT (pseudocode only in the manual)
   ============================================================ */
/* ============================================================
   CAP-051 - KEY PADDING FOR UNEQUAL-WIDTH KEYS
   ------------------------------------------------------------
   The coverage index promises "Radix key padding for unequal-width keys"
   and routes it here, but this module REFUSED such input outright
   ("all keys must contain the same number of symbols m; the manual does
   not pad them") - so an ordinary input such as `7 42 318` produced no
   lesson at all. Rejecting ordinary input is not a way to close the gap,
   and nor is deleting the promise, so the normalisation is implemented as
   a clearly labelled supplemental extension:

     - The QUOTED SOURCE IS UNCHANGED. PS_RADIX is still displayed exactly
       as the manual gives it, and it still contains no padding step.
     - Keys that already share a width are traced exactly as before: no
       normalisation frame is emitted, and the trace is the quoted
       algorithm, frame for frame. That keeps the original behaviour
       identifiable rather than silently rewritten.
     - When the widths differ, ONE extra frame, explicitly marked as not
       part of the manual, pads each shorter key on the LEFT (the
       most-significant end) with the symbol 0 up to the longest width m.

   Why the left, and why that preserves order: the pseudocode indexes
   `key[i]` for i running from m down to 1, so position m is the least
   significant symbol and EVERY key must carry a symbol at every position
   1..m. Left-padding an unsigned decimal numeral with 0 does not change
   what it denotes (7 and 0007 are the same key), and equal-width unsigned
   numerals compare lexicographically exactly as they compare numerically,
   which is the order the stable least-significant-digit passes produce.
   Right-padding would instead multiply the key by a power of R - 7 would
   become 7000 - and would misalign each key's units digit with the pass
   index, so it is not an option here.
   ============================================================ */
const LRXP = lines(PS_RADIX,{mSymbols:'where each key consists of m symbols'});
mod({
  id:'radix', group:'Sorting', name:'Radix sort',
  blocks:[{title:"radixSort - pseudocode",src:PS_RADIX,pseudo:true,pages:'p. 5'}],
  fields:[{k:'a',label:'keys (decimal symbols; shorter keys are padded)',def:'7 42 318 9 1000 57'}],
  note:'The attached manual supplies radix sort as pseudocode only. The trace uses decimal-symbol input, so <code>R = 10</code>; it does not present generated C. <b>Supplemental extension, written by the tracer and not part of the manual (CAP-051):</b> the quoted pseudocode assumes every key already has the same <code>m</code> symbols and supplies no step that establishes it. Rather than refuse ordinary unequal-width input, this module pads each shorter key <b>on the left, the most-significant end, with the symbol <code>0</code></b>, up to the longest key\'s width <code>m</code>. A leading <code>0</code> does not change what a decimal numeral denotes, and equal-width unsigned numerals compare lexicographically exactly as they compare numerically, so the padded keys sort into the same order as the ones entered; padding on the right would multiply each key by a power of <code>R</code> and misalign its units digit with the pass index <code>i</code>, which runs from <code>m</code> down to 1. Keys that already share a width are traced exactly as the manual states them, with no normalisation step at all.',
  run(inp){
    const entered=(inp.a||'').split(/[\s,]+/).filter(Boolean);
    /* These two were plain Errors, so the UI could not attach either message
       to the field that caused it, unlike every other validated input. The
       domain itself is unchanged - a blank entry and a non-decimal symbol are
       rejected exactly as before - only the error class and the field key. */
    if(!entered.length)
      throw new InputValidationError('provide at least one key','a');
    if(!entered.every(k=>/^[0-9]+$/.test(k)))
      throw new InputValidationError('keys must use decimal symbols 0-9 (radix sort reads key symbols, not signed values)','a');
    const m=entered.reduce((w,k)=>Math.max(w,k.length),0);
    const padded=entered.map(k=>k.padStart(m,'0'));
    const mixed=entered.some(k=>k.length!==m);
    const ALAB=mixed?'A (padded)':'A';
    /* Original width per padded key, so a frame can say whether the symbol it
       is reading is one that was entered or a supplemental pad; and a pool of
       the entered spellings per padded key, so the closing frame can show the
       keys exactly AS ENTERED. Stripping leading zeros would be wrong for a
       key deliberately entered as 007, which is a legal fixed-width key. */
    const originalWidth=new Map(),asEntered=new Map();
    entered.forEach((k,idx)=>{
      if(!originalWidth.has(padded[idx]))originalWidth.set(padded[idx],k.length);
      const pool=asEntered.get(padded[idx])||[];pool.push(k);asEntered.set(padded[idx],pool);
    });
    let A=padded.slice(); const R=10, buckets=Array.from({length:R},()=>[]), t=new Trace();
    const bucketsBlk=t.alloc('create','R buckets','10 buckets (manual pseudocode)','manual pseudocode');
    if(mixed){
      const short=entered.map((k,i)=>k.length===m?null:`${k} &rarr; ${padded[i]}`).filter(Boolean);
      t.v({m,R,padded:short.length}).step([0,LRXP.mSymbols],
        `<b>Supplemental step &mdash; not in the manual.</b> The widest key has <code>m = ${m}</code> symbols, but ${short.length} of the ${entered.length} keys ${short.length===1?'is':'are'} shorter, and the pseudocode indexes <code>key[i]</code> for every <code>i</code> from <code>m</code> down to 1. Each shorter key is padded on the <b>left</b> with <code>0</code> up to ${m} symbols: ${short.join(', ')}. A leading <code>0</code> does not change what the numeral denotes, so the padded keys sort into the same order as the keys entered; padding on the right would turn 7 into 7000 and misalign the units digit with the pass index.`,
        arrView(A0('A (as entered)',entered),A0('A (padded to m symbols)',A),...bucketRows(buckets)));
    }
    t.v({m,R}).step([0,LRX.init],`Initialise <code>R = ${R}</code> buckets, one for each decimal symbol.`,arrView(A0(ALAB,A),...bucketRows(buckets)));
    for(let i=m;i>=1;i--){
      t.v({i}).step([0,LRX.outer],`<code>i = ${i}</code>.`,arrView(A0(ALAB,A,{},{},i-1),...bucketRows(buckets)));
      for(let b=0;b<R;b++) buckets[b].length=0;
      t.step([0,LRX.empty],`Empty all ${R} buckets.`,arrView(A0(ALAB,A,{},{},i-1),...bucketRows(buckets)));
      for(let p=0;p<A.length;p++){
        const key=A[p],b=Number(key[i-1]); buckets[b].push(key);
        const isPad=mixed&&(i-1)<(m-(originalWidth.get(key)||m));
        const padNote=isPad?` Symbol ${i} of this key is supplemental padding rather than a symbol that was entered, which is how a shorter key files into bucket 0 on its leading passes and so stays ahead of a longer one.`:'';
        t.v({key,bucket:b}).step([0,LRX.scatter],`Append <code>${key}</code> to bucket <code>${b}</code>.${padNote}`,arrView(A0(ALAB,A,{[p]:'cmp'},{},i-1),...bucketRows(buckets,b)));
      }
      A=[];
      t.drop('key','bucket').step([0,LRX.clear],'<code>clear A</code>.',arrView(A0(ALAB,A),...bucketRows(buckets)));
      for(let b=0;b<R;b++) for(const key of buckets[b]) A.push(key);
      t.step([0,LRX.gather],'<code>A</code> is rebuilt by visiting the buckets in order.',arrView(A0(ALAB,A,{},{},i-1),...bucketRows(buckets)));
    }
    t.release(bucketsBlk);
    /* Consume the pool in output order, so equal padded keys map back to the
       entered spellings in the input order the stable passes preserved. */
    const entryPool=new Map([...asEntered].map(([k,v])=>[k,v.slice()]));
    const stripped=A.map(k=>{const pool=entryPool.get(k);return pool&&pool.length?pool.shift():k;});
    t.drop('i','padded').step([0,LRX.outer],
      mixed?`The radix-sort trace is complete; the bucket helper lifecycle ends here. Dropping the supplemental left padding reads the keys back as entered, in sorted order: <code>${stripped.join(' ')}</code>.`
           :'The radix-sort trace is complete; the bucket helper lifecycle ends here.',
      mixed?arrView(A0(ALAB,A),A0('A (keys as entered)',stripped)):arrView(A0('A',A)));
    return t;
  }
});
function A0(label,a,cls,ptr,hlPos){
  const rows=arrayRow(label,a,cls||{},ptr||{});
  if(hlPos!=null) rows.hl=hlPos;
  return rows;
}
function bucketRows(buckets,active){
  const nonEmpty=buckets.map((b,i)=>({b,i})).filter(x=>x.b.length||x.i===active);
  if(!nonEmpty.length) return [arrayRow('buckets 0–9 (all empty)',[])];
  return [arrayRow('buckets', buckets.map((b,i)=>b.length?`${i}:${b.join(',')}`:'·'), active!=null?{[active]:'mv'}:{}, {})];
}