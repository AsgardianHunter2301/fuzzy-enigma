mod({
  id:'coursemap',group:'Course map',name:'Supplied-course coverage map',keywords:'coverage syllabus supplied course corpus all topics inventory source fidelity',
  blocks:[{title:'Closed-set coverage index',src:COVERAGE_TEXT,source:'coverage',pages:'all supplied sources'}],
  note:"The coverage map is the control index for this build. \"Core\" means an interactive trace or dedicated operational module. \"Reference\" means the supplied source is represented without inventing an implementation. \"Named\" means the lecture names the item but does not provide enough algorithmic detail for a source-faithful implementation.",
  fields:[{k:'scope',label:'show',def:'all',type:'select',options:['all','core','reference','named'],autorun:false}],
  run(inp){
    const t=new Trace(),scope=inp.scope||'all';
    const rows=COVERAGE_ROWS.filter(r=>scope==='all'||r[2]===scope);
    const core=COVERAGE_ROWS.filter(r=>r[2]==='core').length,ref=COVERAGE_ROWS.filter(r=>r[2]==='reference').length,named=COVERAGE_ROWS.filter(r=>r[2]==='named').length;
    t.v({topics:COVERAGE_ROWS.length,core,reference:ref,named}).step([0,1],`Closed-set source inventory: <b>${COVERAGE_ROWS.length}</b> syllabus items mapped. Filter: <code>${scope}</code>.`,refView(
      {title:'Source hierarchy',html:'<p><b>26T2 manual:</b> exact C and manual pseudocode. <b>Supplied 25T3 lectures:</b> representations, lecture-only algorithms, analysis and applications. <b>MEMORISE:</b> complete study bridges added only where both sources omit operation C; these blocks are explicitly marked as not source and are never presented as manual or lecture code.</p>'},
      refTable('Source corpus (21 files)',['Source','File','Mapped course area'],SOURCE_CORPUS),
      refTable('Coverage',['Course area','Syllabus item','Mode','Destination','Source'],rows),
      {title:'Boundary',html:'<p>The app covers the main course content present in the uploaded manual and lecture files. Appendix demonstrations and curiosity-only names are indexed, but are not converted into invented executable C.</p>'}
    ));
    return t;
  }
});

/* ---------- recursion ---------- */
const LEC_FACTORIAL = `int factorial(int n) {
    if (n == 0) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}`;
const LFAC=lines(LEC_FACTORIAL,{sig:'int factorial',test:'if (n == 0)',base:'return 1;',rec:'return n * factorial(n - 1);'});
const LEC_LISTSUM = `struct node {
    int value;
    struct node *next;
};

int listSum(struct node *list) {
    if (list == NULL) {
        return 0;
    } else {
        return list->value + listSum(list->next);
    }
}`;
const LLS=lines(LEC_LISTSUM,{sig:'int listSum',test:'if (list == NULL)',base:'return 0;',rec:'return list->value + listSum(list->next);'});
const LEC_LISTAPPEND = `struct node *listAppend(struct node *list, int value) {
    if (list == NULL) {
        return newNode(value);
    } else {
        list->next = listAppend(list->next, value);
        return list;
    }
}`;
const LLA=lines(LEC_LISTAPPEND,{sig:'struct node *listAppend',test:'if (list == NULL)',newn:'return newNode(value);',set:'list->next = listAppend(list->next, value);',ret:'return list;'});
const LEC_APPEND_HELPER = `void listAppend(struct list *list, int value) {
    list->head = doListAppend(list->head, value);
}

struct node *doListAppend(struct node *node, int value) {
    if (node == NULL) {
        return newNode(value);
    } else {
        node->next = doListAppend(node->next, value);
        return node;
    }
}`;

const LEC_PYRAMID = `To build a pyramid of width n:
1. If n <= 0, do nothing.
2. Otherwise:
   1. Build an n x n layer.
   2. Then build a pyramid of width n - 2 on top.`;
const LPYR=lines(LEC_PYRAMID,{base:'If n <= 0',layer:'Build an n x n layer',rec:'build a pyramid of width n - 2'});
const LEC_RECURSION_GUIDE = `How to write a recursive function:
First, think:
- How can the solution be expressed in terms of subproblems?
- What would the subproblem(s) be?
- How can the original problem be related to the subproblem(s)?
- What are the base cases?
Then, implement:
- Implement base case(s) first.
- Then implement recursive cases.
- Each subproblem corresponds to a recursive call.
- Assume that the function works for the subproblem(s).`;
mod({
  id:'recpyramid',group:'Recursion',name:"Pyramid recursion - base case, winding and layers",keywords:'pyramid recursion base case n minus 2 winding stack frames design recursive function',
  blocks:[{title:"Pyramid method - lecture",src:LEC_PYRAMID,pseudo:true,source:'lecture',pages:'week01lec01'},{title:"Recursive-function design guide - lecture",src:LEC_RECURSION_GUIDE,pseudo:true,source:'lecture',pages:'week01lec01'}],
  note:'The pyramid example demonstrates a pre-order operation: the current layer is built before the recursive call. Active calls use automatic stack frames; the source does not allocate heap memory.',
  fields:[{k:'n',label:'starting width n',def:'7',type:'number',min:1,max:21,w:4}],
  run(inp){
    const n=safeInt(inp.n,'n',1,21),t=new Trace(),frames=[],layers=[];
    const V=()=>({kind:'multi',views:[{kind:'reference',sections:[refTable('Built layers',['order','width','blocks in layer'],layers.map((w,i)=>[i+1,w,w*w]))]},stackView(frames,'automatic recursion frames; no malloc/calloc/realloc')]});
    function rec(w){
      frames.push({label:`pyramid(${w})`,detail:`n = ${w}`,phase:'wind'});t.v({n:w,depth:frames.length}).step([0,LPYR.base],`Call <code>pyramid(${w})</code>; test <code>n <= 0</code>: <b>${w<=0}</b>.`,V());
      if(w<=0){frames[frames.length-1].phase='unwind';frames[frames.length-1].detail='base case: do nothing';t.step([0,LPYR.base],'Base case reached; no layer is built.',V());frames.pop();return;}
      layers.push(w);t.v({width:w,'layer blocks':w*w}).step([0,LPYR.layer],`Build the <b>${w} × ${w}</b> layer before recursing.`,V());
      rec(w-2);frames[frames.length-1].phase='unwind';frames[frames.length-1].detail='recursive call returned';t.step([0,LPYR.rec],`Return to <code>pyramid(${w})</code> during unwinding.`,V());frames.pop();
    }
    rec(n);t.drop('n','depth','width','layer blocks').v({layers:layers.length,'total blocks':layers.reduce((a,w)=>a+w*w,0)}).step([1,1],'Apply the source design checklist: identify the smaller subproblem, establish the base case, then implement the recursive case.',refView(refTable('Recursive design',['Question','Pyramid answer'],[['Subproblem','pyramid of width n - 2'],['Base case','n <= 0: do nothing'],['Pre-order work','build the n x n layer'],['Assumption','the recursive call correctly builds the smaller pyramid']])));return t;
  }
});

mod({
  id:'recfactorial',group:'Recursion',name:"Factorial - winding and unwinding",keywords:'recursion base case call stack stack frame factorial',
  blocks:[{title:"factorial - lecture C",src:LEC_FACTORIAL,source:'lecture',pages:'week01lec01'}],
  note:'Each call creates an automatic stack frame. That is not a <code>malloc</code> allocation, so the heap lifecycle ledger correctly remains empty.',
  fields:[{k:'n',label:'n',def:'5',type:'number',min:0,max:12,w:4}],
  run(inp){
    const n=safeInt(inp.n,'n',0,12),t=new Trace(),frames=[];
    function view(phase){return stackView(frames,`${phase}; automatic storage, released on return`);}
    function rec(x){
      frames.push({label:`factorial(${x})`,detail:`n = ${x}`,phase:'wind'});
      t.v({n:x,depth:frames.length}).step([0,LFAC.sig],`Call <code>factorial(${x})</code>; create a stack frame.`,view('winding'));
      t.step([0,LFAC.test],`Test <code>n == 0</code>: <b>${x===0}</b>.`,view('winding'));
      if(x===0){
        frames[frames.length-1].phase='unwind';frames[frames.length-1].detail='returns 1';
        t.v({return:1}).step([0,LFAC.base],'<code>return 1</code> begins unwinding.',view('base case'));
        frames.pop();return 1;
      }
      const child=rec(x-1),res=x*child;
      frames[frames.length-1].phase='unwind';frames[frames.length-1].detail=`${x} × ${child} = ${res}`;
      t.v({n:x,'factorial(n - 1)':child,return:res}).step([0,LFAC.rec],`Unwind: <code>${x} * ${child}</code> gives <b>${res}</b>.`,view('unwinding'));
      frames.pop();return res;
    }
    const result=rec(n);t.drop('depth').v({result}).step([0,LFAC.sig],`Call stack is empty. <code>${n}!</code> is <b>${result}</b>.`,view('complete'));
    return t;
  }
});

mod({
  id:'reclistsum',group:'Recursion',name:"Linked-list sum - recursive state",keywords:'listSum linked list recursion next winding unwinding',
  blocks:[{title:"listSum - lecture C",src:LEC_LISTSUM,source:'lecture',pages:'week01lec01'}],
  note:'The function does not allocate or free list nodes. The list is caller-owned; only automatic call frames are created and destroyed.',
  fields:[{k:'a',label:'list values',def:'3 1 4'}],
  run(inp){
    const vals=parseInts(inp.a),t=new Trace(),frames=[];
    function V(i){return {kind:'multi',views:[linkedValues(vals,i,'list'),stackView(frames,'automatic listSum call frames')]};}
    function rec(i){
      const isNull=i>=vals.length;frames.push({label:`listSum(${isNull?'NULL':`node(${vals[i]})`})`,detail:isNull?'list = NULL':`list->value = ${vals[i]}`,phase:'wind'});
      t.v({index:i,'list':isNull?'NULL':`node(${vals[i]})`}).step([0,LLS.sig],`Call <code>listSum(${isNull?'NULL':`node ${vals[i]}`})</code>.`,V(isNull?-1:i));
      t.step([0,LLS.test],`Test <code>list == NULL</code>: <b>${isNull}</b>.`,V(isNull?-1:i));
      if(isNull){frames[frames.length-1].phase='unwind';frames[frames.length-1].detail='returns 0';t.v({return:0}).step([0,LLS.base],'<code>return 0</code>.',V(-1));frames.pop();return 0;}
      const tail=rec(i+1),res=vals[i]+tail;frames[frames.length-1].phase='unwind';frames[frames.length-1].detail=`${vals[i]} + ${tail} = ${res}`;
      t.v({'list->value':vals[i],'listSum(list->next)':tail,return:res}).step([0,LLS.rec],`Unwind: <code>${vals[i]} + ${tail}</code> gives <b>${res}</b>.`,V(i));frames.pop();return res;
    }
    const result=rec(0);t.drop('index','list','list->value','listSum(list->next)').v({result}).step([0,LLS.sig],`List sum is <b>${result}</b>; original pointers are unchanged.`,V(-1));return t;
  }
});

mod({
  id:'reclistappend',group:'Recursion',name:"Linked-list append - returned pointer rewiring",keywords:'listAppend doListAppend recursive helper next newNode pointer',
  blocks:[{title:"listAppend - lecture C",src:LEC_LISTAPPEND,source:'lecture',pages:'week01lec01'},{title:"wrapper and recursive helper - lecture C",src:LEC_APPEND_HELPER,source:'lecture',pages:'week01lec01'}],
  note:'The lecture calls <code>newNode(value)</code> but does not provide its body here. The trace records one node allocation at that boundary and does not invent the allocator implementation.',
  fields:[{k:'a',label:'list values',def:'4 5 7'},{k:'value',label:'append',def:'9',type:'number',w:4}],
  run(inp){
    const vals=parseInts(inp.a),value=Number(inp.value);if(!Number.isFinite(value))throw new Error('append value must be a number');
    const t=new Trace(),frames=[],work=vals.slice();let newBlk=null;
    function V(active=-1){return {kind:'multi',views:[linkedValues(work,active,'updated list'),stackView(frames,'recursive listAppend frames')]};}
    function rec(i){
      const isNull=i>=vals.length;frames.push({label:`listAppend(${isNull?'NULL':`node(${vals[i]})`}, ${value})`,detail:isNull?'list = NULL':`current node ${vals[i]}`,phase:'wind'});
      t.v({index:i,list:isNull?'NULL':vals[i],value}).step([0,LLA.sig],`Call at ${isNull?'the empty tail':`node ${vals[i]}`}.`,V(isNull?-1:i));
      t.step([0,LLA.test],`Test <code>list == NULL</code>: <b>${isNull}</b>.`,V(isNull?-1:i));
      if(isNull){newBlk=t.alloc('newNode',`node(value=${value})`,'sizeof(struct node)','lecture boundary');work.push(value);frames[frames.length-1].phase='unwind';frames[frames.length-1].detail=`returns node(${value})`;t.step([0,LLA.newn],`<code>newNode(${value})</code> returns the new tail node.`,V(work.length-1));frames.pop();return work.length-1;}
      const returned=rec(i+1);frames[frames.length-1].phase='unwind';frames[frames.length-1].detail=`node(${vals[i]})->next = node(${work[returned]})`;
      t.v({'node->next':work[returned]}).step([0,LLA.set],`Unwind and assign <code>node(${vals[i]})->next</code> to the returned pointer.`,V(i));
      t.step([0,LLA.ret],`Return the unchanged pointer to <code>node(${vals[i]})</code>.`,V(i));frames.pop();return i;
    }
    rec(0);t.drop('index','list','node->next').v({head:work.length?work[0]:'NULL',size:work.length}).step([1,1],`Wrapper form stores the returned head in <code>list->head</code>. The new node remains live as part of the list.`,V(-1));return t;
  }
});

/* ---------- analysis and sorting syllabus ---------- */
const LEC_ANALYSIS = `linearSearch(A, val):
    Input: array A of size n, value val
    Output: index of val in A if it exists
            -1 otherwise
    for i from 0 up to n - 1:
        if A[i] = val:
            return i
    return -1

Worst-case primitive operations: 4n + 3
Time complexity: O(n)`;
const LAN=lines(LEC_ANALYSIS,{loop:'for i from 0',cmp:'if A[i] = val:',ret:'return i',miss:'return -1',ops:'Worst-case primitive operations',big:'Time complexity'});

mod({
  id:'analysis',group:'Analysis',name:"Algorithm analysis - operations and growth",keywords:'Big O empirical theoretical primitive operations complexity best average worst recursion iteration',
  blocks:[{title:"Linear-search analysis - lecture pseudocode",src:LEC_ANALYSIS,pseudo:true,source:'lecture',pages:'week01lec02'}],
  note:'The lecture distinguishes empirical timing from theoretical operation counting, and focuses mainly on worst-case asymptotic behaviour. Lower-order terms and constant factors are ignored when classifying growth.',
  fields:[{k:'n',label:'input size n',def:'8',type:'number',min:1,max:1000000,w:7}],
  run(inp){
    const n=safeInt(inp.n,'n',1,1000000),t=new Trace(),arr=Array.from({length:Math.min(n,24)},(_,i)=>i+1);
    t.v({n,i:0,operations:1}).step([0,LAN.loop],`Initialise <code>i = 0</code>; the loop condition can be evaluated up to <code>n + 1</code> times.`,arrView(arrayRow(n<=24?'A':'first 24 positions of A',arr,{0:'mv'},{i:0})));
    const shown=Math.min(n,24);for(let i=0;i<shown;i++)t.v({n,i,'A[i]':arr[i]}).step([0,LAN.cmp],`Worst-case trace examines index ${i}.`,arrView(arrayRow(n<=24?'A':'first 24 positions of A',arr,{[i]:'cmp'},{i})));
    const ops=4*n+3;
    t.v({n,'4n + 3':ops}).step([0,LAN.ops],`Worst-case primitive-operation count from the lecture: <b>4n + 3 = ${ops}</b>.`,refView(
      refTable('Growth when n doubles',['Class','T(n)','T(2n) / T(n)'],[['O(1)','1','1'],['O(log n)','log n','approaches 1'],['O(n)','n','2'],['O(n log n)','n log n','a little over 2'],['O(n²)','n²','4'],['O(2ⁿ)','2ⁿ','2ⁿ']]),
      {title:'Analysis modes',html:'<p><b>Empirical:</b> implement, run on varying inputs, measure and compare growth. <b>Theoretical:</b> count primitive operations from code or pseudocode independently of hardware.</p>'}
    ));
    t.step([0,LAN.big],`Ignoring the constant factor and lower-order term classifies <code>4n + 3</code> as <b>O(n)</b>.`,refView({title:'Big-Oh interpretation',html:'<p>Big-Oh classifies asymptotic growth. The course normally reports worst-case time complexity unless another case is stated.</p>'},{title:'Multiple input variables',html:'<p>When two input arrays have unrelated sizes, the lecture uses separate variables <code>n</code> and <code>m</code>. Example forms include <code>O(n + m)</code>, <code>O(nm)</code>, <code>O(max(n, m))</code>, <code>O(min(n, m))</code> and <code>O(n log m + m log n)</code>.</p>'},{title:'Recursive cost',html:'<p>Recursive functions also consume automatic call-stack space: one stack frame per active call. That memory is distinct from heap allocations made with <code>malloc</code>.</p>'}));return t;
  }
});

const LEC_SORT_PROPERTIES = `Sorting algorithm properties:
- Stable: preserves relative order of equal keys
- Adaptive: takes advantage of existing order
- In-place: sorts within the original structure without temporary arrays

Comparison-based sorting has a worst-case lower bound of Omega(n log n).
Non-comparison sorts exploit properties of the keys.`;