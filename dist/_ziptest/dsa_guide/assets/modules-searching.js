/* ============================================================
   SEARCH
   ============================================================ */
const SRC_LIN = `int linearSearch(int arr[], int size, int val) {
    for (int i = 0; i < size; i++) {
        if (arr[i] == val) {
            return i;
        }
    }
    return -1;
}`;
const LLIN = lines(SRC_LIN,{loop:'for (int i = 0;',cmp:'if (arr[i] == val)',ret:'return i;',fail:'return -1;'});

const SRC_BIN = `int binarySearch(int arr[], int size, int val) {
    int lo = 0;
    int hi = size - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (val < arr[mid]) {
            hi = mid - 1;
        } else if (val > arr[mid]) {
            lo = mid + 1;
        } else {
            return mid;
        }
    }
    return -1;
}`;
const LBIN = lines(SRC_BIN,{lo:'int lo = 0;',hi:'int hi = size - 1;',loop:'while (lo <= hi)',mid:'int mid = (lo + hi) / 2;',lt:'if (val < arr[mid])',sethi:'hi = mid - 1;',gt:'} else if (val > arr[mid])',setlo:'lo = mid + 1;',ret:'return mid;',fail:'return -1;'});

mod({
  id:'lin', group:'Searching', name:'Linear search',
  blocks:[{title:'linearSearch',src:SRC_LIN,pages:'p. 1'}],
  fields:[{k:'a',label:'arr',def:'14 3 27 8 19 5'},{k:'val',label:'val',def:'19',w:5}],
  run(inp){
    const a=parseInts(inp.a), val=Number(inp.val), t=new Trace();
    t.v({size:a.length,val}).step([0,LLIN.loop],'Walk the array from index 0. The array does not need to be sorted.',arrView(arrayRow('arr',a,{},{})));
    for(let i=0;i<a.length;i++){
      t.v({i}).step([0,LLIN.cmp],`<code>arr[${i}] == ${val}</code> → <code>${a[i]} == ${val}</code> is ${a[i]===val?'<b>true</b>':'false'}.`,arrView(arrayRow('arr',a,{[i]:a[i]===val?'hit':'cmp'},{i})));
      if(a[i]===val){ t.step([0,LLIN.ret],`Return <b>${i}</b>. ${i+1} comparison${i?'s':''} used.`,arrView(arrayRow('arr',a,{[i]:'hit'},{i}))); return t; }
    }
    t.drop('i').step([0,LLIN.fail],`<code>${val}</code> is not in the array — return <b>-1</b>. A full miss always costs <code>size</code> comparisons.`,arrView(arrayRow('arr',a,{},{})));
    return t;
  }
});

mod({
  id:'bin', group:'Searching', name:'Binary search',
  blocks:[{title:'binarySearch',src:SRC_BIN,pages:'pp. 1-2'}],
  fields:[{k:'a',label:'arr (must be sorted)',def:'2 5 8 12 16 23 38 56 72 91'},{k:'val',label:'val',def:'23',w:5}],
  run(inp){
    const a=parseInts(inp.a), val=Number(inp.val), t=new Trace();
    const sorted=a.every((x,i)=>i===0||a[i-1]<=x);
    if(!sorted){
      t.v({size:a.length,val}).step([0,LBIN.lo],`<b>Trace stopped:</b> the attached manual's <code>binarySearch</code> does not sort its input. Supply an array already ordered from smallest to largest.`,arrView(arrayRow('arr',a,{},{})));
      return t;
    }
    const seg=(lo,hi,extra)=>{const c=Object.assign({},extra||{});for(let i=0;i<a.length;i++) if(!c[i]) c[i]=(i>=lo&&i<=hi)?'rng':'hole';return c;};
    let lo=0, hi=a.length-1;
    t.v({size:a.length,val,lo,hi}).step([0,LBIN.hi],`The supplied array is already sorted, so the manual's binarySearch can be followed without changing the input.`,arrView(arrayRow('arr',a,seg(lo,hi),{lo,hi})));
    while(lo<=hi){
      t.step([0,LBIN.loop],`<code>lo &lt;= hi</code> → ${lo} ≤ ${hi}: ${hi-lo+1} candidate${hi-lo?'s':''} left.`,arrView(arrayRow('arr',a,seg(lo,hi),{lo,hi})));
      const mid=Math.floor((lo+hi)/2);
      t.v({mid}).step([0,LBIN.mid],`<code>mid = (${lo} + ${hi}) / 2 = ${mid}</code>.`,arrView(arrayRow('arr',a,seg(lo,hi,{[mid]:'cmp'}),{lo,mid,hi})));
      if(val<a[mid]){
        t.step([0,LBIN.lt],`<code>${val} &lt; ${a[mid]}</code> — discard <code>[${mid}..${hi}]</code>.`,arrView(arrayRow('arr',a,seg(lo,hi,{[mid]:'pivot'}),{lo,mid,hi})));
        hi=mid-1; t.v({hi}).step([0,LBIN.sethi],`<code>hi = ${hi}</code>. Half the search space gone in one comparison.`,arrView(arrayRow('arr',a,seg(lo,hi),{lo,hi})));
      } else if(val>a[mid]){
        t.step([0,LBIN.gt],`<code>${val} &gt; ${a[mid]}</code> — discard <code>[${lo}..${mid}]</code>.`,arrView(arrayRow('arr',a,seg(lo,hi,{[mid]:'pivot'}),{lo,mid,hi})));
        lo=mid+1; t.v({lo}).step([0,LBIN.setlo],`<code>lo = ${lo}</code>.`,arrView(arrayRow('arr',a,seg(lo,hi),{lo,hi})));
      } else {
        t.step([0,LBIN.ret],`<code>${val} == arr[${mid}]</code> — return <b>${mid}</b>.`,arrView(arrayRow('arr',a,seg(lo,hi,{[mid]:'hit'}),{mid})));
        return t;
      }
    }
    t.step([0,LBIN.fail],`<code>lo &gt; hi</code> — the range is empty, so <code>${val}</code> is not present. Return <b>-1</b>.`,arrView(arrayRow('arr',a,seg(lo,hi),{})));
    return t;
  }
});
