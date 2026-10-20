/* ============================================================
   SUPPLIED-COURSE-CORPUS EXTENSION
   Manual blocks are exact 26T2 manual source. Lecture blocks are
   faithful transcriptions of supplied 25T3 material; formatting is
   normalised only where slide extraction joined lines.
   ============================================================ */

/* ---------- composite/reference/representation renderers ---------- */
RENDER.multi = (view,host)=>{
  (view.views||[]).forEach((v,i)=>{
    if(v.title) host.appendChild(createElement('div','caption',v.title));
    const box=v.box?createElement('div','repbox'):host;
    if(v.box&&v.title){box.appendChild(createElement('h4',null,v.title));}
    if(RENDER[v.kind]) RENDER[v.kind](v,v.box?box:host);
    if(v.box) host.appendChild(box);
  });
};

RENDER.reference = (view,host)=>{
  const root=createElement('div','refsections');
  (view.sections||[]).forEach(sec=>{
    const card=createElement('section','refcard');
    if(sec.title) card.appendChild(createElement('h4',null,sec.title));
    if(sec.html){const d=createElement('div');d.innerHTML=sec.html;card.appendChild(d);}
    if(sec.lines){const ul=createElement('ul');sec.lines.forEach(x=>ul.appendChild(createElement('li',null,String(x))));card.appendChild(ul);}
    if(sec.table){
      const tb=createElement('table','grid');
      const hr=createElement('tr');(sec.table.headers||[]).forEach(h=>hr.appendChild(createElement('th','',String(h))));tb.appendChild(hr);
      (sec.table.rows||[]).forEach(row=>{
        const tr=createElement('tr');row.forEach((v,i)=>{const td=createElement('td','',String(v));if(sec.table.classes&&sec.table.classes[i])td.className=sec.table.classes[i];tr.appendChild(td);});tb.appendChild(tr);
      });
      card.appendChild(tb);
    }
    root.appendChild(card);
  });
  host.appendChild(root);
};

RENDER.callstack = (view,host)=>{
  const wrap=createElement('div');
  wrap.appendChild(createElement('div','stackmeta',view.meta||'automatic call stack — not heap allocation'));
  const st=createElement('div','stackframes');
  const frames=(view.frames||[]).slice().reverse();
  if(!frames.length) st.appendChild(createElement('div','empty','call stack empty'));
  frames.forEach((f,i)=>{
    const d=createElement('div','stackframe '+(i===0?'top ':'')+(f.phase==='unwind'?'unwind ':'')+(f.cls||''));
    d.appendChild(createElement('div','flabel',f.label));
    if(f.detail)d.appendChild(createElement('div','fdetail',f.detail));
    st.appendChild(d);
  });
  wrap.appendChild(st);host.appendChild(wrap);
};

RENDER.adjlist = (view,host)=>{
  const meta=createElement('div','replabel');
  meta.innerHTML=`<span>nV <b>${view.nV}</b></span><span>nE <b>${view.nE}</b></span><span>${view.directed?'directed':'undirected'}</span><span>${view.weighted?'weighted':'unweighted'}</span>`;
  host.appendChild(meta);
  const root=createElement('div','adjlist');
  (view.rows||[]).forEach((row,v)=>{
    const r=createElement('div','adjrow '+(view.activeRow===v?'active':''));
    r.appendChild(createElement('div','adjhead',`edges[${v}]`));
    const chain=createElement('div','adjchain');
    if(!row.length) chain.appendChild(createElement('span','nullbox','NULL'));
    row.forEach((n,i)=>{
      const cls=(view.activeRow===v&&view.activeIndex===i)?'active':(n.cls||'');
      const txt=view.weighted?`${n.v} | ${n.wt}`:String(n.v);
      chain.appendChild(createElement('span','adjnode '+cls,txt));
      chain.appendChild(createElement('span','adjnext','→'));
    });
    if(row.length) chain.appendChild(createElement('span','nullbox','NULL'));
    r.appendChild(chain);root.appendChild(r);
  });
  host.appendChild(root);
};

RENDER.edgearray = (view,host)=>{
  const meta=createElement('div','replabel');
  meta.innerHTML=`<span>nV <b>${view.nV}</b></span><span>nE <b>${view.nE}</b></span><span>maxE <b>${view.maxE}</b></span><span>${view.directed?'directed':'undirected'}</span><span>${view.weighted?'weighted':'unweighted'}</span>`;
  host.appendChild(meta);
  const root=createElement('div','edgearray');
  for(let i=0;i<view.maxE;i++){
    const e=view.edges[i];
    const c=createElement('div','edgecell '+(i===view.active?'active ':'')+(!e?'hole ':'')+(e&&e.cls||''));
    c.appendChild(createElement('div','ev',e?(view.weighted?`(${e.v}, ${e.w}, ${e.wt})`:`(${e.v}, ${e.w})`):'·'));
    c.appendChild(createElement('div','ei',String(i)));root.appendChild(c);
  }
  host.appendChild(root);
};

RENDER.hashopen = (view,host)=>{
  const meta=createElement('div','replabel');
  meta.innerHTML=`<span>numSlots <b>${view.numSlots}</b></span><span>numItems <b>${view.numItems}</b></span><span>load factor <b>${view.numSlots?(view.numItems/view.numSlots).toFixed(2):'0.00'}</b></span>`;
  host.appendChild(meta);
  const root=createElement('div','hashopen');
  (view.slots||[]).forEach((s,i)=>{
    const path=(view.path||[]).includes(i);
    const cls='oslot '+(i===view.active?'active ':'')+(path?'path ':'')+(s&&s.state==='DEL'?'tomb ':'');
    const d=createElement('div',cls);
    let txt='EMPTY';
    if(s){txt=s.state==='DEL'?'DEL':(s.value===undefined?String(s.key):`${s.key}:${s.value}`);}
    d.appendChild(createElement('div','ov',txt));d.appendChild(createElement('div','oi',String(i)));root.appendChild(d);
  });host.appendChild(root);
};

RENDER.intheap = (view,host)=>{
  const base=view.base||0, arr=view.items||[], N=view.N===undefined?arr.length-1:view.N;
  const vals=arr.map((v,i)=>i<base?null:v);
  const cls={};(view.active||[]).forEach(i=>cls[i]='mv');(view.compare||[]).forEach(i=>cls[i]='cmp');
  if(view.sortedFrom!==undefined) for(let i=view.sortedFrom;i<arr.length;i++)cls[i]='done';
  RENDER.array({rows:[{label:view.label||`heap array (${base}-indexed)`,a:vals,cls,ptr:view.ptr||{}}]},host);
  const idx=[];for(let i=base;i<=N;i++)idx.push(i);
  if(!idx.length)return;
  const pos=new Map(),levels=[];
  idx.forEach(i=>{const d=base===1?Math.floor(Math.log2(i)):Math.floor(Math.log2(i+1));(levels[d]||(levels[d]=[])).push(i);});
  const W=500,gy=60,H=levels.length*gy+34,R=16;
  levels.forEach((lev,d)=>lev.forEach((i,j)=>pos.set(i,{x:(j+1)*W/(lev.length+1),y:24+d*gy})));
  let svg=`<svg class="canvas" aria-hidden="true" focusable="false" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin meet">`;
  idx.forEach(i=>{if(i===base)return;const p=base===1?Math.floor(i/2):Math.floor((i-1)/2);if(pos.has(p)){const a=pos.get(p),b=pos.get(i);svg+=`<line class="edge" x1="${a.x}" y1="${a.y+R}" x2="${b.x}" y2="${b.y-R}"/>`;}});
  idx.forEach(i=>{const p=pos.get(i),c=(view.active||[]).includes(i)?'act':((view.compare||[]).includes(i)?'hit':'');svg+=`<circle class="nd ${c}" cx="${p.x}" cy="${p.y}" r="${R}"/><text x="${p.x}" y="${p.y+4}" text-anchor="middle" font-size="11.5">${arr[i]}</text><text class="bf" x="${p.x+R+2}" y="${p.y-R+2}">[${i}]</text>`;});
  svg+='</svg>';const d=createElement('div');d.innerHTML=svg;host.appendChild(d);
};

RENDER.matrix2d = (view,host)=>{
  const wrap=createElement('div');if(view.name)wrap.appendChild(createElement('div','caption',view.name));
  const tb=createElement('table','grid'),n=view.m.length;const h=createElement('tr');h.appendChild(createElement('th','',''));for(let j=0;j<n;j++)h.appendChild(createElement('th','',String(j)));tb.appendChild(h);
  for(let i=0;i<n;i++){const r=createElement('tr');r.appendChild(createElement('th','',String(i)));for(let j=0;j<n;j++){const raw=view.m[i][j],none=raw===null||raw===undefined||raw===false;const text=none?(view.none||'–'):String(raw===true?1:raw);r.appendChild(createElement('td',(view.chg===`${i}-${j}`?'chg':none?'t0':'t1'),text));}tb.appendChild(r);}wrap.appendChild(tb);host.appendChild(wrap);
};

/* ---------- representation helpers ---------- */
const clone2 = a=>a.map(r=>r.slice());
function rowsFromMatrix(edges,wt,weighted){
  return edges.map((row,v)=>row.map((on,w)=>on?{v:w,wt:weighted?wt[v][w]:1}:null).filter(Boolean));
}
function edgeArrayFromMatrix(edges,wt,directed,weighted){
  const out=[];for(let v=0;v<edges.length;v++)for(let w=0;w<edges.length;w++)if(edges[v][w]&&(directed||v<=w))out.push({v,w,wt:weighted?wt[v][w]:1});return out;
}
function plainGraphView(nV,edges,wt,directed,weighted,cls,ecls){return {kind:'graph',nV,edges,directed,w:weighted?wt:null,cls:cls||{},ecls:ecls||{},tables:[],showAdj:false};}
function representationView(nV,edges,wt,directed,weighted,rep,opt={}){
  if(rep==='adjacency list')return {kind:'adjlist',nV,nE:edgeArrayFromMatrix(edges,wt,directed,weighted).length,rows:rowsFromMatrix(edges,wt,weighted),directed,weighted,activeRow:opt.activeRow,activeIndex:opt.activeIndex};
  if(rep==='array of edges'){
    const es=edgeArrayFromMatrix(edges,wt,directed,weighted);return {kind:'edgearray',nV,nE:es.length,maxE:Math.max(es.length,1),edges:es,directed,weighted,active:opt.active};
  }
  return {kind:'matrix2d',name:weighted?'weighted adjacency matrix (– = no edge)':'adjacency matrix',m:edges.map((r,v)=>r.map((x,w)=>x?(weighted?wt[v][w]:1):null)),none:'–',chg:opt.chg};
}
/* Retained as the historical name used by decorateGraphTrace. It now
   delegates to tracer-core.js's snapshotTraceData, which preserves numeric
   sentinels (Infinity/NaN) that the previous implementation passed through
   correctly but which a JSON round-trip would have destroyed, and which is
   cycle-safe. Frames are already independent at capture time (AUD-01); this
   clone only keeps decoration from writing into the captured frame. */
function cloneTraceData(value){ return snapshotTraceData(value); }
/** Return a decorated copy of a graph trace without mutating its source frames. */
function decorateGraphTrace(trace,rep){
  if(!trace || !Array.isArray(trace.f)) return trace;
  const out={...trace};
  out.f=trace.f.map(frame=>{
    const f={...frame,view:cloneTraceData(frame.view)};
    const v=f.view;
    if(!v || (v.kind==='multi' && v.graphRepresentation===rep) || v.kind!=='graph') return f;
    const wt=v.w||v.edges.map(r=>r.map(x=>x?1:0));
    const graph={...v,showAdj:false};
    const activeRow=Number.isInteger(f.vars&&f.vars.v)?Number(f.vars.v):undefined;
    f.view={kind:'multi',graphRepresentation:rep,views:[graph,{title:rep,...representationView(v.nV,v.edges,wt,!!v.directed,!!v.w,rep,{activeRow})}]};
    return f;
  });
  return out;
}
function refView(...sections){return {kind:'reference',sections};}
function refTable(title,headers,rows){return {title,table:{headers,rows}};}
function stackView(frames,meta){return {kind:'callstack',frames:frames.map(x=>({...x})),meta};}
function linkedValues(values,active=-1,label='list'){
  return {kind:'linked',lists:[{label,nodes:values.map((v,i)=>({v,cls:i===active?'new':'',sub:i<values.length-1?'next':'next = NULL'}))}]};
}
function boolValue(x){return String(x).toLowerCase()==='true'||String(x)==='1'||String(x).toLowerCase()==='yes';}
/* InputValidationError is declared in tracer-core.js, which loads first.
   Re-declaring the class here would be a redeclaration SyntaxError in the
   shared global script scope, so this file deliberately only consumes it. */
function safeInt(value,name,min=0,max=1000,fieldKey=null){const number=Number(value);if(!Number.isInteger(number)||number<min||number>max)throw new InputValidationError(`${name} must be an integer from ${min} to ${max} (got ${String(value)})`,fieldKey);return number;}

/* ---------- closed-set syllabus map, split per capability (CUR-MOD-04) ----------
   Each record is ONE capability with its own destination, delivery mode and
   completeness. The former table held 93 rows, several of which bundled
   capabilities whose destinations did not all implement them - radix padding
   with a fixed-width-only tracer, global rebalancing with a one-frame periodic
   note, chaining and load factor with an unimplemented resize, tombstone
   deletion with a prose-only backshift, and AVL deletion with no AVL search.

   `category` is INHERITED from the original row and is never downgraded: a
   promised capability with no working destination is recorded as an open gap
   with evidence, not relabelled unsupported to produce a green matrix.

   `mode` is the delivery granularity - executable, conceptual-reference or
   named-only. A conceptual reference is a legitimate destination for a
   conceptual outcome, but it is labelled as one and never allowed to stand in
   for a promised executable operation.

   `depth` records what was actually done and keeps the levels distinct:
   'read metadata', 'executed one default' and 'independently checked specified
   semantics' are different claims. NONE of these rows was compared against the
   original course document: the 21 declared originals are absent from this
   repository, so exact-quotation parity is not certified anywhere.

   docs/COVERAGE_CAPABILITIES.csv is generated from this same table.
   ---------------------------------------------------------------------- */
const COVERAGE_MODE_LABEL = Object.freeze({X:'executable',C:'conceptual reference',N:'named only'});
const COVERAGE_STATUS_LABEL = Object.freeze({K:'complete',P:'partial',M:'MISSING - open gap'});
const COVERAGE_CAPABILITIES = [
['CAP-001','W1 Recursion','Recursion expressed as smaller subproblems','core','recfactorial','lecture','X','K'],
['CAP-002','W1 Recursion','Base case and recursive case distinguished','core','recfactorial','lecture','X','K'],
['CAP-003','W1 Recursion','Pyramid worked example','core','recpyramid','lecture','X','K'],
['CAP-004','W1 Recursion','Factorial computed recursively','core','recfactorial','lecture','X','K'],
['CAP-005','W1 Recursion','Winding and unwinding phases shown separately','core','recfactorial','lecture','X','K'],
['CAP-006','W1 Recursion','Simultaneously active stack frames counted correctly','core','recfactorial','lecture','X','K'],
['CAP-007','W1 Recursion','Recursion over a linked list','core','reclistsum','lecture','X','K'],
['CAP-008','W1 Recursion','listSum worked example','core','reclistsum','lecture','X','K'],
['CAP-009','W1 Recursion','How to design a recursive function','reference','recpyramid','lecture','C','K'],
['CAP-010','W1 Recursion','Recursive list append','core','reclistappend','lecture','X','K'],
['CAP-011','W1 Recursion','Returned-pointer assignment (t->next = recursive call)','core','reclistappend','lecture','X','K'],
['CAP-012','W1 Recursion','Recursive helper function with extra state','reference','reclistappend','lecture','X','K'],
['CAP-013','W1 Recursion','Recursion versus iteration','reference','analysis','lecture','C','K'],
['CAP-014','W1 Analysis','Efficiency as a function of input size','core','analysis','lecture','X','K'],
['CAP-015','W1 Analysis','Best, average and worst case','core','analysis','lecture','C','K'],
['CAP-016','W1 Analysis','Empirical analysis (growth observed by running)','core','analysis','lecture','X','K'],
['CAP-017','W1 Analysis','Theoretical analysis (cost derived, not measured)','core','analysis','lecture','C','K'],
['CAP-018','W1 Analysis','Pseudocode notation','core','analysis','lecture','C','K'],
['CAP-019','W1 Analysis','Primitive operation counting','core','analysis','lecture','X','K'],
['CAP-020','W1 Analysis','Asymptotic behaviour','core','analysis','lecture','C','K'],
['CAP-021','W1 Analysis','Big-Oh notation','core','analysis','lecture','C','K'],
['CAP-022','W1 Analysis','Common complexity classes','core','analysis','lecture','C','K'],
['CAP-023','W1 Analysis','Complexity in multiple input variables','core','analysis','lecture','C','K'],
['CAP-024','W1 Analysis','Linear search','core','lin','manual+lecture','X','K'],
['CAP-025','W1 Analysis','Binary search','core','bin','manual+lecture','X','K'],
['CAP-026','W2 Sorting','Sorting motivation (why sorting is studied)','core','sortprops','manual+lecture','C','K'],
['CAP-027','W2 Sorting','Array slice convention items[lo..hi] and n = hi - lo + 1','core','sortprops','manual+lecture','C','K'],
['CAP-028','W2 Sorting','Item and key types','core','sortprops / sel / bub / ins / ms / qs / q3','manual+lecture','C','K'],
['CAP-029','W2 Sorting','Comparison macros lt/le/ge/gt','core','sel / bub / ins / ms / qs / q3','manual+lecture','X','K'],
['CAP-030','W2 Sorting','Stability','core','sortprops','lecture','C','K'],
['CAP-031','W2 Sorting','Adaptability','core','sortprops','lecture','C','K'],
['CAP-032','W2 Sorting','In-place property','core','sortprops','lecture','C','K'],
['CAP-033','W2 Sorting','Selection sort','core','sel','manual+lecture','X','K'],
['CAP-034','W2 Sorting','Bubble sort with early exit','core','bub','manual+lecture','X','K'],
['CAP-035','W2 Sorting','Insertion sort (array)','core','ins','manual+lecture','X','K'],
['CAP-036','W2 Sorting','Sorting a linked list by insertion','core','listsorts','lecture','X','K'],
['CAP-037','W2 Sorting','Selection and bubble sort on a linked list','core','listsorts','lecture','X','K'],
['CAP-038','W2 Sorting','Merge sort (top-down)','core','ms','manual+lecture','X','K'],
['CAP-039','W2 Sorting','Temporary-array lifecycle in merge','core','ms','manual+lecture','X','K'],
['CAP-040','W2 Sorting','Bottom-up merge sort','core','bottomup','lecture','X','K'],
['CAP-041','W2 Sorting','Quick sort with a naive pivot','core','qs','manual+lecture','X','K'],
['CAP-042','W2 Sorting','Partition (inclusive lo..hi, two closing cursors)','core','qs / q3','manual+lecture','X','K'],
['CAP-043','W2 Sorting','Median-of-three quick sort','core','q3','manual+lecture','X','K'],
['CAP-044','W2 Sorting','Randomised pivot','reference','quickvariants','lecture','C','K'],
['CAP-045','W2 Sorting','Insertion-sort threshold in quick sort','reference','quickvariants','lecture','C','K'],
['CAP-046','W2 Sorting','Quick sort on linked lists','reference','quickvariants','lecture','C','K'],
['CAP-047','W2 Sorting','Comparison-sort n log n lower bound','reference','sortprops','lecture','C','K'],
['CAP-048','W2 Sorting','Radix sort by least-significant-digit passes','core','radix','manual+lecture','X','K'],
['CAP-049','W2 Sorting','Radix bucket distribution and gather','core','radix','manual+lecture','X','K'],
['CAP-050','W2 Sorting','Radix stability across passes','core','radix','manual+lecture','X','K'],
['CAP-051','W2 Sorting','Radix key padding for unequal-width keys','core','radix','manual+lecture','X','K'],
['CAP-052','W2 Sorting','Shell sort (named only)','named','namedalgos','lecture','N','K'],
['CAP-053','W2 Sorting','Key-indexed counting sort (named only)','named','namedalgos','lecture','N','K'],
['CAP-054','W3 ADTs','Abstraction as an idea','core','adtarch','lecture','C','K'],
['CAP-055','W3 ADTs','Interface versus implementation','core','adtarch','lecture','C','K'],
['CAP-056','W3 ADTs','ADT contracts','core','adtarch','lecture','C','K'],
['CAP-057','W3 ADTs','C .h / .c separation','core','adtarch','lecture','C','K'],
['CAP-058','W3 ADTs','Opaque pointer typedef','core','adtarch / stack / queue','lecture','C','K'],
['CAP-059','W3 ADTs','Bank account example','reference','adtarch','lecture','C','K'],
['CAP-060','W3 ADTs','Stack ADT complete lifecycle','core','stack','manual+lecture','X','K'],
['CAP-061','W3 ADTs','LIFO ordering','core','stack','manual+lecture','X','K'],
['CAP-062','W3 ADTs','Queue ADT complete lifecycle','core','queue','manual+lecture','X','K'],
['CAP-063','W3 ADTs','FIFO ordering','core','queue','manual+lecture','X','K'],
['CAP-064','W3 ADTs','Set ADT interface','core','setadt','lecture','C','K'],
['CAP-065','W3 ADTs','Set implementation alternatives compared','core','setadt','lecture','C','K'],
['CAP-066','W3 BST','Tree and BST terminology','reference','bsttrav','lecture','C','K'],
['CAP-067','W3 BST','BST insertion','core','bstins','manual+lecture','X','K'],
['CAP-068','W3 BST','BST search','core','bstsearch','manual+lecture','X','K'],
['CAP-069','W3 BST','Pre-order traversal','core','bsttrav','lecture','X','K'],
['CAP-070','W3 BST','In-order traversal','core','bsttrav','lecture','X','K'],
['CAP-071','W3 BST','Post-order traversal','core','bsttrav','lecture','X','K'],
['CAP-072','W3 BST','Level-order traversal','core','bsttrav','lecture','X','K'],
['CAP-073','W3 BST','bstJoin','core','bstdel','manual+lecture','X','K'],
['CAP-074','W3 BST','BST deletion (leaf, one child, two children, root)','core','bstdel','manual+lecture','X','K'],
['CAP-075','W3 BST','Post-order freeing','core','bstfree','manual+lecture','X','K'],
['CAP-076','W4 Balanced BST','Size balance','reference','bstrebalance','lecture','C','K'],
['CAP-077','W4 Balanced BST','Height balance','reference','avlheight','lecture','C','K'],
['CAP-078','W4 Balanced BST','Best and worst BST shape','reference','bstins','lecture','X','K'],
['CAP-079','W4 Balanced BST','Left rotation','core','bstrotate','lecture','X','K'],
['CAP-080','W4 Balanced BST','Right rotation','core','bstrotate','lecture','X','K'],
['CAP-081','W4 Balanced BST','Partition around an in-order index','core','bstpartition','lecture','X','K'],
['CAP-082','W4 Balanced BST','Global rebalancing','core','bstrebalance','lecture','X','K'],
['CAP-083','W4 Balanced BST','Periodic rebalancing','core','bstrebalance','lecture','X','K'],
['CAP-084','W4 Balanced BST','Root insertion','core','bstlocal','lecture','X','K'],
['CAP-085','W4 Balanced BST','Randomised insertion','core','bstlocal','lecture','X','K'],
['CAP-086','W4 AVL','AVL invariant','reference','avlheight','lecture','C','K'],
['CAP-087','W4 AVL','AVL height guarantee','reference','avlheight','lecture','C','K'],
['CAP-088','W4 AVL','AVL insertion','core','avlins','manual+lecture','X','K'],
['CAP-089','W4 AVL','Balance factor computation','core','avlins / avlheight','manual+lecture','X','K'],
['CAP-090','W4 AVL','Four rotation cases (LL, LR, RL, RR)','core','avlins','manual+lecture','X','K'],
['CAP-091','W4 AVL','Stored height data and its maintenance','core','avlheight','lecture','X','K'],
['CAP-092','W4 AVL','AVL deletion with rebalancing','core','avldel','manual+lecture','X','K'],
['CAP-093','W4 AVL','AVL search','core','avldel','manual+lecture','X','K'],
['CAP-094','W4 Graphs','Graph fundamentals: vertex set and edge set','core','graphfund','lecture','C','K'],
['CAP-095','W4 Graphs','Graph types (directed, weighted, simple, multigraph, loops)','core','graphfund','lecture','C','K'],
['CAP-096','W4 Graphs','Graph terminology (degree, path, cycle, component, spanning forest, clique)','core','graphfund','lecture','C','K'],
['CAP-097','W4 Graphs','Graph ADT interface','core','graphadt','manual+lecture','X','K'],
['CAP-098','W4 Graphs','Adjacency-matrix lifecycle (allocate and free)','core','graphadt','manual+lecture','X','K'],
['CAP-099','W4 Graphs','Adjacency-matrix representation','core','graphreps / graphadt','manual+lecture','X','K'],
['CAP-100','W4 Graphs','Adjacency-list representation','core','graphlist','lecture','X','K'],
['CAP-101','W4 Graphs','Adjacency-list complete operation study bridge','core','graphlist','lecture+supplemental','C','K'],
['CAP-102','W4 Graphs','Array-of-edges representation','core','graphedges','lecture','X','K'],
['CAP-103','W4 Graphs','Edge-array resize via realloc','core','graphedges','lecture','X','K'],
['CAP-104','W4 Graphs','Array-of-edges complete operation study bridge','core','graphedges','lecture+supplemental','C','K'],
['CAP-105','W4 Graphs','Representation complexity comparison','core','graphreps','lecture','C','K'],
['CAP-106','W5 Graphs','Directed and weighted graph terminology','core','graphweighted','lecture+supplemental','C','K'],
['CAP-107','W5 Graphs','Graph mode x representation study matrix (12 combinations)','core','graphweighted','lecture+supplemental','C','K'],
['CAP-108','W5 Traversal','BFS with a queue','core','bfs','manual+lecture','X','K'],
['CAP-109','W5 Traversal','BFS visited and predecessor state','core','bfs','manual+lecture','X','K'],
['CAP-110','W5 Traversal','BFS shortest-path reconstruction','core','bfspath','lecture','X','K'],
['CAP-111','W5 Traversal','Recursive DFS','core','dfs','manual+lecture','X','K'],
['CAP-112','W5 Traversal','DFS call stack made visible','core','dfs','manual+lecture','X','K'],
['CAP-113','W5 Traversal','DFS path checking (hasPath)','core','dfspath','lecture','X','K'],
['CAP-114','W5 Traversal','DFS path finding with backtracking','core','dfspath','lecture','X','K'],
['CAP-115','W5 Traversal','Iterative DFS with an explicit stack','core','dfsiter','lecture','X','K'],
['CAP-116','W5 Traversal','Disconnected graphs handled','reference','components','lecture','X','K'],
['CAP-117','W5 Traversal','Spanning tree / spanning forest structure','reference','components','lecture','X','K'],
['CAP-118','W5 Problems','Undirected cycle checking','core','cycleu','lecture','X','K'],
['CAP-119','W5 Problems','Cycle checking across all components','core','cycleu','lecture','X','K'],
['CAP-120','W5 Problems','Connected components and the componentOf array','core','components','lecture','X','K'],
['CAP-121','W5 Problems','Hamiltonian path by backtracking','core','hamilton','lecture','X','K'],
['CAP-122','W5 Problems','Hamiltonian circuit by backtracking','core','hamilton','lecture','X','K'],
['CAP-123','W5 Problems','Eulerian path degree test','core','euler','lecture','X','K'],
['CAP-124','W5 Problems','Eulerian circuit degree and connectivity test','core','euler','lecture','X','K'],
['CAP-125','W5 Problems','Tractable versus intractable graph problems','reference','namedalgos','lecture','C','K'],
['CAP-126','W5 Problems','Longest path, largest clique and three-colourability (named only)','reference','namedalgos','lecture','N','K'],
['CAP-127','W5 Problems','Graph isomorphism (named only)','reference','namedalgos','lecture','N','K'],
['CAP-128','W7 Digraphs','Digraph traversal','core','webcrawl','lecture','X','K'],
['CAP-129','W7 Digraphs','Web crawling with a visited set','core','webcrawl','lecture','X','K'],
['CAP-130','W7 Digraphs','Directed cycle checking','core','cycled','lecture','X','K'],
['CAP-131','W7 Digraphs','onStack state distinguished from visited','core','cycled','lecture','X','K'],
['CAP-132','W7 Digraphs','Transitive closure','core','warshall','manual+lecture','X','K'],
['CAP-133','W7 Digraphs','Warshall triple loop','core','warshall','manual+lecture','X','K'],
['CAP-134','W7 Digraphs','Kosaraju SCC algorithm (named only)','named','namedalgos','lecture','N','K'],
['CAP-135','W7 Digraphs','Tarjan SCC algorithm (named only)','named','namedalgos','lecture','N','K'],
['CAP-136','W7 Shortest path','Weighted path cost','core','dijkstra','manual+lecture','X','K'],
['CAP-137','W7 Shortest path','Dijkstra vertex-set state (dist, pred, inVSet)','core','dijkstra','manual+lecture','X','K'],
['CAP-138','W7 Shortest path','Edge relaxation','core','dijkstra','manual+lecture','X','K'],
['CAP-139','W7 Shortest path','Shortest-path reconstruction from pred','core','dijkstra','lecture','X','K'],
['CAP-140','W7 Shortest path','Floyd-Warshall shortest paths (named only)','named','namedalgos','lecture','N','K'],
['CAP-141','W7 Shortest path','Bellman-Ford shortest paths (named only)','named','namedalgos','lecture','N','K'],
['CAP-142','W7 MST','Minimum spanning tree definition and properties','reference','kruskal / prim','lecture','C','K'],
['CAP-143','W7 MST','Kruskal: edges in increasing weight order','core','kruskal','manual+lecture','X','K'],
['CAP-144','W7 MST','Kruskal: cycle rejection','core','kruskal','manual+lecture','X','K'],
['CAP-145','W7 MST','Prim: cheapest crossing edge','core','prim','manual+lecture','X','K'],
['CAP-146','W7 MST','Union-find as the Kruskal cycle-check optimisation','named','namedalgos','lecture','C','K'],
['CAP-147','W7 MST','Boruvka MST algorithm (named only)','named','namedalgos','lecture','N','K'],
['CAP-148','W7 MST','Karger-Klein-Tarjan MST algorithm (named only)','named','namedalgos','lecture','N','K'],
['CAP-149','W8 Hashing','Map ADT','reference','hash','lecture','C','K'],
['CAP-150','W8 Hashing','Hash functions','reference','hash / hashprobe','lecture','X','K'],
['CAP-151','W8 Hashing','Collisions','reference','hash','lecture','X','K'],
['CAP-152','W8 Hashing','Separate chaining','core','hash','manual+lecture','X','K'],
['CAP-153','W8 Hashing','Load factor test','core','hash','manual+lecture','X','K'],
['CAP-154','W8 Hashing','Hash-table resizing','core','hash','manual+lecture','X','K'],
['CAP-155','W8 Hashing','Linear probing','core','hashprobe','lecture','X','K'],
['CAP-156','W8 Hashing','Tombstone deletion','core','hashprobe','lecture','X','K'],
['CAP-157','W8 Hashing','Backshift deletion','core','hashprobe','lecture','X','K'],
['CAP-158','W8 Hashing','Clustering','core','hashprobe','lecture','X','K'],
['CAP-159','W8 Hashing','Double hashing','core','hashprobe','lecture','X','K'],
['CAP-160','W8 Applications','Set over a hash table','core','hashsetcounter','lecture','X','K'],
['CAP-161','W8 Applications','Counter over a hash table','core','hashsetcounter','lecture','X','K'],
['CAP-162','W8 Applications','Two Sum','core','twosum','lecture','X','K'],
['CAP-163','W8 Applications','Odd-occurring distinct values','core','oddocc','lecture','X','K'],
['CAP-164','W8 Applications','Anagram by character counting','core','anagram','lecture','X','K'],
['CAP-165','W8 Applications','Python dictionaries bonus syntax','reference','namedalgos','lecture','N','K'],
['CAP-166','W9 PQ','Priority Queue ADT','core','pqcompare / pq','lecture','C','K'],
['CAP-167','W9 PQ','Priority queue implementation trade-offs','core','pqcompare','lecture','C','K'],
['CAP-168','W9 Heaps','Heap property','core','pq','manual+lecture','X','K'],
['CAP-169','W9 Heaps','Completeness and array indexing','core','pq','manual+lecture','X','K'],
['CAP-170','W9 Heaps','Insert with fixUp','core','pq','manual+lecture','X','K'],
['CAP-171','W9 Heaps','Delete with fixDown','core','pq','manual+lecture','X','K'],
['CAP-172','W9 Heaps','Heap capacity growth via realloc','core','pq','manual+lecture','X','K'],
['CAP-173','W9 Heaps','Heapify by fix-down, O(n)','core','heapify','lecture','X','K'],
['CAP-174','W9 Heaps','Heapify by fix-up, O(n log n)','core','heapify','lecture','X','K'],
['CAP-175','W9 Heaps','Deheapify','core','heapsort','lecture','X','K'],
['CAP-176','W9 Heaps','Heap sort','core','heapsort','lecture','X','K'],
['CAP-177','Manual Tries','Trie create','core','trie','manual','X','K'],
['CAP-178','Manual Tries','Trie insert','core','trie','manual','X','K'],
['CAP-179','Manual Tries','Trie search distinguishing word from prefix','core','trie','manual','X','K'],
['CAP-180','Manual Tries','Trie delete without breaking a shared path','core','trie','manual','X','K'],
['CAP-181','Manual Tries','Trie free','core','trie','manual','X','K'],
];
/* The five display columns are DERIVED, so the rendered coverage table, the
   coverage index block and the capability register cannot disagree. The item
   text carries the delivery mode and, when it is not complete, the status, so
   the table can no longer imply execution for a static-only or absent one. */
const COVERAGE_ROWS = COVERAGE_CAPABILITIES.map(function(c){
  var note = COVERAGE_MODE_LABEL[c[6]];
  if(c[7]!=='K') note += '; ' + COVERAGE_STATUS_LABEL[c[7]];
  return [c[1], c[2]+' ['+note+']', c[3], c[4], c[5]];
});
const COVERAGE_TEXT = COVERAGE_ROWS.map(r=>`${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[4]}`).join('\n');
const SOURCE_CORPUS = [
['26T2 manual','COMP2521 26T2 - Data Structures and Algorithms Manual.pdf','Exact manual C and pseudocode across the main structures and algorithms'],
['W1 lecture','week01lec01-recursion.docx','Recursion'],
['W1 lecture','week01lec02-analysis.docx','Analysis of algorithms'],
['W2 lecture','week02lec01-sorting-intro.docx','Sorting foundations and properties'],
['W2 lecture','week02lec01-elementary-sorts.docx','Selection, bubble and insertion sort'],
['W2 lecture','week02lec01-divide-and-conquer-sorts.docx','Merge sort and quick sort'],
['W2 lecture','week02lec02-non-comparison-sorts.docx','Lower bound and radix sort'],
['W3 lecture','week03lec01-adts.docx','ADTs, stacks, queues and sets'],
['W3 lecture','week03lec02-bsts.docx','Binary search trees'],
['W4 lecture','week04lec01-balancing-bsts.docx','BST balancing operations and methods'],
['W4 lecture','week04lec01-avl-trees.docx','AVL trees'],
['W4 lecture','week04lec02-graphs-intro.docx','Graph ADT and three representations'],
['W5 lecture','week05lec01-graph-traversal.docx','BFS, DFS and path work'],
['W5 lecture','week05lec02-directed-weighted-graphs.docx','Directed and weighted graph representations'],
['W5 lecture','week05lec02-graph-problems.docx','Cycle, components, Hamiltonian and Eulerian problems'],
['W7 lecture','week07lec01-digraph-algorithms.docx','Digraph traversal, cycles and transitive closure'],
['W7 lecture','week07lec01-dijkstras-algorithm.docx','Dijkstra and edge relaxation'],
['W7 lecture','week07lec02-msts.docx','Minimum spanning trees'],
['W8 lecture','week08lec01-hash-tables.docx','Hash tables and collision resolution'],
['W8 lecture','week08lec02-hash-table-applications.docx','Set, Counter and hash applications'],
['W9 lecture','week09lec01-priority-queues.docx','Priority queues, heaps and heap sort']
];
