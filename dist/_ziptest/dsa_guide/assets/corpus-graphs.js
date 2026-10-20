mod({
  id:'graphfund',group:'Graph representations',name:'Graph fundamentals, types and terminology',keywords:'vertices edges directed weighted loop multigraph simple adjacent incident degree dense sparse path cycle complete connected tree subgraph component spanning forest clique',
  blocks:[{title:"Graph fundamentals and terminology - lecture",src:LEC_GRAPH_FUND,source:'lecture',pseudo:true,pages:'week04 graph introduction'}],
  note:"Multigraphs are introduced as a graph type but are explicitly not considered further in the supplied course lecture. The default trace therefore models a simple undirected graph unless \"directed\" is selected.",
  fields:[{k:'nV',label:'nV',def:'6',type:'number',min:1,max:12,w:4},{k:'g',label:'edges',def:'0-1, 0-2, 1-2, 2-3, 3-4, 4-5'},{k:'kind',label:'graph',def:'undirected',type:'select',options:['undirected','directed']}],
  run(inp){
    const directed=inp.kind==='directed',G=parseGraph(inp.g,inp.nV,directed),t=new Trace(),n=G.nV;
    const deg=G.adj.map(r=>r.filter(Boolean).length),inD=range(0,n-1).map(v=>G.adj.reduce((a,r)=>a+(r[v]?1:0),0));
    const undEdges=G.edges.length,hasLoop=G.edges.some(e=>e.v===e.w),maxSimple=directed?n*(n-1):n*(n-1)/2;
    function components(){const seen=new Array(n).fill(false);let c=0;for(let s=0;s<n;s++)if(!seen[s]){c++;const q=[s];seen[s]=true;while(q.length){const v=q.shift();for(let w=0;w<n;w++){const linked=directed?(G.adj[v][w]||G.adj[w][v]):G.adj[v][w];if(linked&&!seen[w]){seen[w]=true;q.push(w);}}}}return c;}
    const cc=components(),connected=cc===1,simple=!directed&&!hasLoop,complete=!hasLoop&&undEdges===maxSimple,tree=!directed&&connected&&!hasLoop&&undEdges===n-1;
    t.v({V:n,E:undEdges,type:directed?'directed':'undirected'}).step([0,1],'A graph is the pair of a vertex set and an edge set.',{kind:'multi',views:[plainGraphView(n,G.adj,G.wt,directed,false),{kind:'reference',sections:[refTable(directed?'Directed degrees':'Degrees',['vertex',directed?'in(v)':'deg(v)',directed?'out(v)':'incident edges'],range(0,n-1).map(v=>directed?[v,inD[v],deg[v]]:[v,deg[v],deg[v]]))]}]});
    t.v({loops:hasLoop,simple,components:cc,connected,complete,tree,density:maxSimple?Number((undEdges/maxSimple).toFixed(3)):0}).step([0,6],'Classify the input using the lecture definitions.',refView(refTable('Classification',['Property','Result'],[['Loop present',hasLoop],['Simple graph (undirected, no loops, no multiple edges)',simple],['Connected components',cc],['Connected',connected],['Complete',complete],['Tree',tree],['Dense/sparse indicator',maxSimple?`${undEdges}/${maxSimple} possible non-loop edges`:'not applicable']]),refTable('Structural terms',['Term','Course meaning'],[['Subgraph','subset of vertices and their edges'],['Connected component','maximally connected subgraph'],['Spanning tree','all vertices in one tree'],['Spanning forest','one tree per connected component'],['Clique','complete subgraph']])));return t;
  }
});

mod({
  id:'graphreps',group:'Graph representations',name:"Graph representations - complete source and representation map",keywords:'adjacency matrix list array edges sparse dense complexity representation memorise prior knowledge complete C',
  blocks:[
    {title:"Three representations - exact lecture concept",src:LEC_GRAPH_REPS,source:'lecture',pseudo:true,pages:'week04 graph introduction'},
    {title:"Adjacency-matrix Graph ADT - exact manual C",src:SRC_GADJ,source:'manual',pages:"pp. 16-19"},
    {title:"Adjacency-list structs - exact lecture C",src:LEC_ADJLIST_STRUCT,source:'lecture',pages:'week04 graph introduction'},
    {title:"Adjacency-list Graph ADT - supplemental C",src:SRC_GADJLIST_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Array-of-edges structs - exact lecture C",src:LEC_EDGEARRAY_STRUCT,source:'lecture',pages:'week04 graph introduction'},
    {title:"Array-of-edges Graph ADT - supplemental C",src:SRC_GEDGEARRAY_MEM,source:'memorise',pages:'supplemental implementation'}
  ],
  /* CUR-MOD-02: provenance kept, the universal memorisation requirement
     removed. No authoritative course source establishes it, and the study
     matrix below alone carries 17 blocks and 2,168 displayed lines. */
  note:'The matrix implementation is exact 26T2 manual C. The list and edge-array structures are exact lecture C, but their complete operation bodies are absent from both attached sources. The supplemental blocks are complete, compiler-tested implementations supplied by this tracer; they are not manual or lecture quotations. To follow a traversal or shortest-path trace you need the representation it uses, the API operations it calls and their invariants - not every alternative implementation.',
  fields:[{k:'nV',label:'nV',def:'4',type:'number',min:1,max:12,w:4},{k:'g',label:'edges',def:'0-1, 0-3, 1-3, 2-3'},{k:'study',label:'map first line to',def:'overview',type:'select',options:['overview','adjacency matrix — exact manual','adjacency list — MEMORISE','array of edges — MEMORISE'],autorun:false}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),t=new Trace(),matrix=representationView(G.nV,G.adj,G.wt,false,false,'adjacency matrix'),list=representationView(G.nV,G.adj,G.wt,false,false,'adjacency list'),edge=representationView(G.nV,G.adj,G.wt,false,false,'array of edges');
    const all={kind:'multi',views:[plainGraphView(G.nV,G.adj,G.wt,false,false),{title:'Adjacency matrix',...matrix},{title:'Adjacency list',...list},{title:'Array of edges',...edge}]};
    const study=inp.study||'overview';
    const selectedView=study.startsWith('adjacency matrix')?{kind:'multi',views:[plainGraphView(G.nV,G.adj,G.wt,false,false),{title:'Adjacency matrix',...matrix}]}:study.startsWith('array of edges')?{kind:'multi',views:[plainGraphView(G.nV,G.adj,G.wt,false,false),{title:'Array of edges',...edge}]}:study.startsWith('adjacency list')?{kind:'multi',views:[plainGraphView(G.nV,G.adj,G.wt,false,false),{title:'Adjacency list',...list}]}:all;
    const mapTarget=study==='overview'?'complete provenance index':`complete <b>${study}</b> implementation`;
    t.v({V:G.nV,E:G.edges.length,density:(G.edges.length/(G.nV*(G.nV-1)/2||1)).toFixed(2),study,sourceRoute:'1 exact manual implementation + 2 declared supplemental implementations'}).step([0,1],`The lecture names three graph representations. The mapping pane now opens the ${mapTarget} instead of stopping at a source gap.`,selectedView);
    t.step([0,2],'<b>Adjacency matrix:</b> complete exact C is supplied by the 26T2 manual.',{kind:'multi',views:[plainGraphView(G.nV,G.adj,G.wt,false,false),{title:'Adjacency matrix',...matrix}]});
    t.step([0,4],'<b>Adjacency list:</b> the lecture supplies the structs but no complete operation bodies, so the full Graph ADT shown here is supplemental C. What a traversal actually needs from it is <code>GraphIsAdjacent</code>, <code>GraphNumVertices</code> and the sorted-neighbour invariant.',{kind:'multi',views:[plainGraphView(G.nV,G.adj,G.wt,false,false),{title:'Adjacency list',...list}]});
    t.step([0,6],'<b>Array of edges:</b> the lecture supplies the structs but no complete operations or growth policy, so the full Graph ADT shown here is supplemental C. Note that it stores one record per undirected edge and answers adjacency by scanning, which is the cost difference worth understanding.',{kind:'multi',views:[plainGraphView(G.nV,G.adj,G.wt,false,false),{title:'Array of edges',...edge}]});
    t.step([0,7],'Representation complexity comparison from the graph-introduction lecture.',refView(
      refTable('Graph representation costs',['Operation','Adjacency matrix','Adjacency list','Array of edges'],[
        ['Space','O(V²)','O(V + E)','O(E)'],['Create','O(V²)','O(V)','O(1)'],['Destroy','O(V)','O(V + E)','O(1)'],['Insert edge','O(1)','O(V)','O(E)'],['Remove edge','O(1)','O(V)','O(E)'],['Is adjacent','O(1)','O(V)','O(E)*'],['Degree','O(V)','O(V)','O(E)*']
      ]),
      {title:'Ordered edge-array note',html:'<p>* The lecture notes that adjacency/degree can be O(log E) when the edge array is ordered and both directions of each undirected edge are stored.</p>'},
      {title:'What to understand in these implementations',html:'<ol><li>Who owns the outer graph, row/list-head array and every node/edge buffer.</li><li>How duplicate detection works before insertion.</li><li>Why an undirected adjacency-list edge uses two nodes but increments <code>nE</code once.</li><li>How directed insertion updates only the source representation.</li><li>How weighted insertion replaces an existing weight without incrementing <code>nE</code>.</li><li>How <code>->next</code> is relinked before a node is freed.</li><li>How an edge-array deletion compacts the live prefix.</li><li>How capacity growth uses checked <code>realloc</code>; capacity 8/doubling is an explicit supplemental convention.</li></ol>'}
    ));return t;
  }
});
function parseGraphOps(s){return (s||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);}
function graphRowsFromEntries(n,entries,directed){const rows=Array.from({length:n},()=>[]);entries.forEach(e=>{if(e.fwd!==false)rows[e.v].push({v:e.w,wt:e.wt,blk:e.blk});if(!directed&&e.v!==e.w&&e.rev!==false)rows[e.w].push({v:e.v,wt:e.wt,blk:e.revBlk});});rows.forEach(r=>r.sort((a,b)=>a.v-b.v));return rows;}
function graphSourceLine(src,needle,nth=1){
  const a=src.split('\n');let seen=0;
  for(let i=0;i<a.length;i++){
    if(a[i].includes(needle)&&++seen===nth)return i+1;
  }
  console.warn(`[COMP2521 Tracer] Source line not found: "${needle}" (occurrence ${nth}). No line will be highlighted.`);
  return -1;
}
function graphSourceLineOrNone(src,needle,nth=1){
  const line=graphSourceLine(src,needle,nth);
  return line>0?line:0;
}
mod({
  id:'graphlist',group:'Graph representations',name:"Adjacency list - complete prerequisite C, pointers and memory",keywords:'adjacency list adjNode next graph edges linked nodes vertices edge count get weight insert remove free weighted directed undirected memorise prerequisite',
  blocks:[
    {title:"Adjacency-list concrete representation - exact lecture C",src:LEC_ADJLIST_STRUCT,source:'lecture',pages:'week04 graph introduction'},
    {title:"Undirected unweighted adjacency-list Graph ADT - supplemental C",src:SRC_GADJLIST_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Directed unweighted adjacency-list Graph ADT - supplemental C",src:SRC_GADJLIST_DU_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Undirected weighted adjacency-list Graph ADT - supplemental C",src:SRC_GADJLIST_UW_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Directed weighted adjacency-list Graph ADT - supplemental C",src:SRC_GADJLIST_DW_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Three representations - exact lecture concept",src:LEC_GRAPH_REPS,source:'lecture',pseudo:true,pages:'week04 graph introduction'},
    {title:"Weighted representation changes - exact lecture concept",src:LEC_WEIGHTED_REPS,source:'lecture',pseudo:true,pages:'week05 directed and weighted graphs'}
  ],
  note:"The lecture supplies the exact base structs but no complete adjacency-list operation bodies, so all four implementations here are <b>supplemental C, not course source</b>. The ideas worth taking from them are the interface, the sorted-list invariant, allocation ownership, <code>-&gt;next</code> rewiring, the edge-count rule and the weighted-update rule. Read the variant that matches the mode you are studying; the others are there for comparison.",
  fields:[{k:'nV',label:'nV',def:'5',type:'number',min:1,max:12,w:4},{k:'directed',label:'graph',def:'undirected',type:'select',options:['undirected','directed']},{k:'weighted',label:'weights',def:'unweighted',type:'select',options:['unweighted','weighted']},{k:'ops',label:'operations',def:'vertices, insert 0 1:4, insert 0 2:2, insert 1 3:5, insert 3 4:1, edges, adjacent 0 2, remove 0 1, show, free'}],
  run(inp){
    const n=safeInt(inp.nV,'nV',1,12),directed=inp.directed==='directed',weighted=inp.weighted==='weighted',ops=parseGraphOps(inp.ops),t=new Trace();let entries=[],alive=true,nE=0;
    const mode=graphModeKey(directed,weighted),variant=GRAPH_LIST_VARIANTS[mode],cb={uu:1,du:2,uw:3,dw:4}[mode],L=variant.lines;
    const Q={numVertices:graphSourceLineOrNone(variant.src,'return g->nV;'),numEdges:graphSourceLineOrNone(variant.src,'return g->nE;'),getWeight:weighted?graphSourceLineOrNone(variant.src,'Weight GraphGetWeight',2):0};
    const gBlk=t.alloc('malloc','Graph g','sizeof(struct graph)','memorise');
    t.v({nV:n,nE,mode:variant.label,sourceStatus:'supplemental C — not manual/lecture C'}).step([cb,L.graphAlloc],'<code>GraphNew</code>: allocate the graph structure using the complete C for the selected graph mode.',{kind:'adjlist',nV:n,nE,rows:Array.from({length:n},()=>[]),directed,weighted});
    const headsBlk=t.alloc('calloc','g->edges','nV × sizeof(struct adjNode *)','memorise');
    const rows=()=>graphRowsFromEntries(n,entries,directed);
    const V=(activeRow,activeIndex,edgeKey)=>{const rs=rows(),adj={kind:'adjlist',nV:n,nE,rows:rs,directed,weighted,activeRow,activeIndex};const adjm=Array.from({length:n},()=>Array(n).fill(false)),wt=Array.from({length:n},()=>Array(n).fill(0));entries.forEach(e=>{if(e.fwd!==false){adjm[e.v][e.w]=true;wt[e.v][e.w]=e.wt;}if(!directed&&e.v!==e.w&&e.rev!==false){adjm[e.w][e.v]=true;wt[e.w][e.v]=e.wt;}});return {kind:'multi',views:[plainGraphView(n,adjm,wt,directed,weighted,{},edgeKey?{[edgeKey]:'act'}:{}),adj]};};
    t.step([cb,L.headsAlloc],'<code>calloc</code> creates <code>nV</code> list-head pointers, all initially <code>NULL</code>.',V());
    const parseVW=raw=>{const m=raw.match(/^(insert|remove|adjacent|weight|get|getweight)\s+(\d+)\s+(\d+)(?:\s*[:=]\s*(-?(?:\d+(?:\.\d+)?|\.\d+)))?$/i);if(!m)return null;const v=+m[2],w=+m[3],wt=m[4]===undefined?1:+m[4],cmd=/^(weight|get|getweight)$/i.test(m[1])?'weight':m[1].toLowerCase();if(v<0||v>=n||w<0||w>=n)throw new Error(`vertices must be in 0..${n-1}`);if(weighted&&wt<0)throw new Error('MEMORISE weighted graph bridges require non-negative weights');return {cmd,v,w,wt};};
    for(const raw of ops){if(!alive)break;const p=parseVW(raw),cmd=raw.toLowerCase().replace(/\s+/g,'');
      if(p&&p.cmd==='insert'){
        if(!directed&&!weighted&&p.v===p.w){t.v({v:p.v,w:p.w,nE}).step([cb,L.insertGuard||L.adjacentReturn],'<b>Simple undirected/unweighted source model:</b> a loop is not inserted.',V(p.v));continue;}
        const idx=entries.findIndex(e=>e.v===p.v&&e.w===p.w||(!directed&&e.v===p.w&&e.w===p.v));
        t.v({v:p.v,w:p.w,nE,duplicate:idx>=0}).step([cb,L.adjacentReturn],`Traverse <code>g->edges[${p.v}]</code> through <code>next</code> pointers; matching edge found: <b>${idx>=0}</b>.`,V(p.v));
        if(idx>=0){if(weighted){entries[idx].wt=p.wt;t.step([cb,L.update||L.adjacentReturn],`Replace the existing weight with ${p.wt}${!directed&&p.v!==p.w?' in both stored directions':''}; <code>nE</code> does not change.`,V(p.v));}else t.step([cb,L.insertGuard||L.adjacentReturn],'Duplicate unweighted edge: return without allocating another node.',V(p.v));continue;}
        const blk=t.alloc('malloc',`adjNode(${p.v}->${p.w})`,'sizeof(struct adjNode)','memorise');
        t.step([cb,L.newNode],`Allocate the node storing neighbour ${p.w}${weighted?` and weight ${p.wt}`:''}; it is not linked yet.`,V(p.v));
        const reverseNeeded=!directed&&p.v!==p.w;let revBlk=null;
        if(reverseNeeded){revBlk=t.alloc('malloc',`adjNode(${p.w}->${p.v})`,'sizeof(struct adjNode)','memorise');t.step([cb,L.newNode],`Allocate the reverse adjacency node storing neighbour ${p.v}${weighted?` and weight ${p.wt}`:''}; it is not linked yet.`,V(p.w));}
        const e={v:p.v,w:p.w,wt:p.wt,blk,revBlk,fwd:false,rev:!reverseNeeded};entries.push(e);
        e.fwd=true;t.step([cb,L.insertForward],`Write the head/predecessor <code>->next</code> link so ${p.w} is reachable from <code>g->edges[${p.v}]</code>.`,V(p.v,0,`${p.v}-${p.w}`));
        if(reverseNeeded){e.rev=true;t.step([cb,L.insertReverse||L.insertForward],`Write the reverse <code>->next</code> link so ${p.v} is reachable from <code>g->edges[${p.w}]</code>.`,V(p.w,0,`${p.v}-${p.w}`));}
        nE++;t.v({nE}).step([cb,L.increment],'<code>g->nE++</code> counts the fully linked logical edge/arc once.',V(p.v));
      }else if(p&&p.cmd==='remove'){
        const idx=entries.findIndex(e=>e.v===p.v&&e.w===p.w||(!directed&&e.v===p.w&&e.w===p.v));
        t.v({v:p.v,w:p.w,nE,index:idx}).step([cb,L.adjacentReturn],`Traverse the source list to locate ${p.v}${directed?'→':'–'}${p.w}.`,V(p.v));
        if(idx<0){t.step([cb,L.removeGuard||L.adjacentReturn],'Edge absent: return without pointer or count changes.',V(p.v));continue;}
        const e=entries[idx];
        if(e.fwd!==false){e.fwd=false;t.step([cb,L.unlink||L.removeForward],`Reconnect the head/predecessor in <code>g->edges[${e.v}]</code> to the removed node's <code>next</code>.`,V(e.v));t.free(e.blk);t.step([cb,L.freeOld||L.removeForward],`Return <code>adjNode(${e.v}->${e.w})</code> to the allocator.`,V(e.v));}
        if(!directed&&e.v!==e.w&&e.rev!==false){e.rev=false;t.step([cb,L.unlink||L.removeReverse],`Reconnect the reverse list in <code>g->edges[${e.w}]</code> to skip its node.`,V(e.w));t.free(e.revBlk);t.step([cb,L.freeOld||L.removeReverse],`Return <code>adjNode(${e.w}->${e.v})</code> to the allocator.`,V(e.w));}
        entries.splice(idx,1);nE--;t.v({nE}).step([cb,L.decrement],'<code>g->nE--</code> after every required node has been unlinked and freed.',V(p.v));
      }else if(p&&p.cmd==='adjacent'){
        const row=rows()[p.v],i=row.findIndex(x=>x.v===p.w);t.v({v:p.v,w:p.w,result:i>=0}).step([cb,L.adjacentReturn],`Follow <code>g->edges[${p.v}]</code> until ${p.w} is found or the sorted list passes it; result <b>${i>=0}</b>.`,V(p.v,i));
      }else if(p&&p.cmd==='weight'){
        if(!weighted){t.v({operation:'GraphGetWeight',result:'not part of unweighted interface'}).step([cb,L.adjacentReturn],'<code>GraphGetWeight</code> exists only in the declared weighted study interface. Select <b>weighted</b> before using this operation.',V(p.v));continue;}
        const row=rows()[p.v],i=row.findIndex(x=>x.v===p.w),found=i>=0;t.v({v:p.v,w:p.w,adjacent:found}).step([cb,L.adjacentReturn],`Check the <code>GraphGetWeight</code> precondition: edge ${p.v}${directed?'→':'–'}${p.w} exists: <b>${found}</b>.`,V(p.v,i));
        if(!found){t.v({precondition:'failed — no value returned'}).step([cb,Q.getWeight],'<code>GraphGetWeight</code> assumes that the edge exists. The trace does not invent a weight.',V(p.v));continue;}
        t.v({weight:row[i].wt}).step([cb,Q.getWeight],`<code>GraphGetWeight</code> returns <b>${row[i].wt}</b>.`,V(p.v,i));
      }else if(['vertices','numvertices','numv'].includes(cmd)){
        t.v({return:n}).step([cb,Q.numVertices],`<code>GraphNumVertices</code> returns <b>${n}</b>.`,V());
      }else if(['edges','numedges','nume'].includes(cmd)){
        t.v({return:nE}).step([cb,Q.numEdges],`<code>GraphNumEdges</code> returns the logical edge/arc count <b>${nE}</b>.`,V());
      }else if(cmd==='show'){
        t.v({nV:n,nE}).step([cb,L.showLoop],'For every vertex, traverse its complete <code>next</code> chain and output every stored neighbour/weight.',V());
      }else if(cmd==='free'){
        for(const e of entries){if(e.fwd!==false)t.free(e.blk);if(!directed&&e.v!==e.w&&e.rev!==false)t.free(e.revBlk);}entries=[];nE=0;
        t.step([cb,L.freeNode],'Release every adjacency node in every list.',V());
        t.free(headsBlk);t.step([cb,L.freeHeads],'Release the array of list-head pointers.',V());
        t.free(gBlk);alive=false;t.step([cb,L.freeGraph],'Release the graph structure. No adjacency-list allocation remains live.',V());
      }else throw new Error('operations: vertices, edges, insert v w[:weight], remove v w, adjacent v w, weight v w (weighted mode), show, free');
    }return t;
  }
});

mod({
  id:'graphedges',group:'Graph representations',name:"Array of edges - complete prerequisite C, resize and lifecycle",keywords:'edge array maxE nE pairs capacity vertices edge count get weight directed undirected weighted insert remove scan compact realloc free memorise prerequisite',
  blocks:[
    {title:"Array-of-edges concrete representation - exact lecture C",src:LEC_EDGEARRAY_STRUCT,source:'lecture',pages:'week04 graph introduction'},
    {title:"Undirected unweighted edge-array Graph ADT - supplemental C",src:SRC_GEDGEARRAY_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Directed unweighted edge-array Graph ADT - supplemental C",src:SRC_GEDGEARRAY_DU_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Undirected weighted edge-array Graph ADT - supplemental C",src:SRC_GEDGEARRAY_UW_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Directed weighted edge-array Graph ADT - supplemental C",src:SRC_GEDGEARRAY_DW_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Three representations - exact lecture concept",src:LEC_GRAPH_REPS,source:'lecture',pseudo:true,pages:'week04 graph introduction'},
    {title:"Weighted representation changes - exact lecture concept",src:LEC_WEIGHTED_REPS,source:'lecture',pseudo:true,pages:'week05 directed and weighted graphs'}
  ],
  note:"The lecture supplies <code>nV</code>, <code>nE</code>, <code>maxE</code> and the edge record but no complete operations or growth policy, so all four implementations here are <b>supplemental C, not course source</b>. The ideas worth taking from them are the live-prefix invariant, the linear scan, the logical edge count, weighted update, compaction and checked <code>realloc</code>. Capacity 8 and doubling are explicit supplemental conventions, and allocated capacity is never released, so memory follows peak capacity rather than the current edge count.",
  fields:[{k:'nV',label:'nV',def:'5',type:'number',min:1,max:12,w:4},{k:'directed',label:'graph',def:'undirected',type:'select',options:['undirected','directed']},{k:'weighted',label:'weights',def:'unweighted',type:'select',options:['unweighted','weighted']},{k:'ops',label:'operations',def:'vertices, insert 0 1:4, insert 0 2:2, insert 1 3:5, insert 3 4:1, edges, adjacent 0 2, remove 0 1, show, free'}],
  run(inp){
    const n=safeInt(inp.nV,'nV',1,12),directed=inp.directed==='directed',weighted=inp.weighted==='weighted',ops=parseGraphOps(inp.ops),t=new Trace();let edges=[],alive=true,maxE=8;
    const mode=graphModeKey(directed,weighted),variant=GRAPH_EDGE_VARIANTS[mode],cb={uu:1,du:2,uw:3,dw:4}[mode],L=variant.lines;
    const Q={numVertices:graphSourceLineOrNone(variant.src,'return g->nV;'),numEdges:graphSourceLineOrNone(variant.src,'return g->nE;'),getWeight:weighted?graphSourceLineOrNone(variant.src,'Weight GraphGetWeight',2):0};
    const gBlk=t.alloc('malloc','Graph g','sizeof(struct graph)','memorise');
    t.v({nV:n,nE:0,maxE,mode:variant.label,sourceStatus:'supplemental C — not manual/lecture C'}).step([cb,L.graphAlloc],'<code>GraphNew</code>: allocate the graph structure using the complete C for the selected mode.',{kind:'edgearray',nV:n,nE:0,maxE,edges:[],directed,weighted,active:-1});
    const aBlk=t.alloc('malloc','g->edges','8 × sizeof(struct edge)','memorise');
    const V=(active=-1)=>({kind:'edgearray',nV:n,nE:edges.length,maxE,edges:edges.map(e=>({...e})),directed,weighted,active});
    t.step([cb,L.arrayAlloc],'Allocate the initial contiguous array of 8 edge records.',V());
    const parseVW=raw=>{const m=raw.match(/^(insert|remove|adjacent|weight|get|getweight)\s+(\d+)\s+(\d+)(?:\s*[:=]\s*(-?(?:\d+(?:\.\d+)?|\.\d+)))?$/i);if(!m)return null;const v=+m[2],w=+m[3],wt=m[4]===undefined?1:+m[4],cmd=/^(weight|get|getweight)$/i.test(m[1])?'weight':m[1].toLowerCase();if(v<0||v>=n||w<0||w>=n)throw new Error(`vertices must be in 0..${n-1}`);if(weighted&&wt<0)throw new Error('MEMORISE weighted graph bridges require non-negative weights');return {cmd,v,w,wt};};
    const eq=(e,v,w)=>e.v===v&&e.w===w||(!directed&&e.v===w&&e.w===v);
    for(const raw of ops){if(!alive)break;const p=parseVW(raw),cmd=raw.toLowerCase().replace(/\s+/g,'');
      if(p&&p.cmd==='insert'){
        if(!directed&&!weighted&&p.v===p.w){t.v({v:p.v,w:p.w,nE:edges.length,maxE}).step([cb,L.insertGuard||L.adjacentReturn],'<b>Simple undirected/unweighted source model:</b> a loop is not inserted.',V());continue;}
        let i=edges.findIndex(e=>eq(e,p.v,p.w));t.v({v:p.v,w:p.w,index:i,nE:edges.length,maxE}).step([cb,L.edgeScan],`Linearly scan the first <code>nE</code> records for ${p.v}${directed?'→':'–'}${p.w}.`,V(i));
        if(i>=0){if(weighted){edges[i].wt=p.wt;t.step([cb,L.update||L.adjacentReturn],`Replace <code>edges[${i}].weight</code> with ${p.wt}; <code>nE</code> does not change.`,V(i));}else t.step([cb,L.insertGuard||L.adjacentReturn],'Duplicate unweighted edge/arc: do not append another record.',V(i));continue;}
        if(edges.length===maxE){const old=maxE;maxE*=2;t.realloc(aBlk,'g->edges',`${maxE} × sizeof(struct edge)`);t.v({oldMaxE:old,maxE}).step([cb,L.realloc],`Capacity ${old} is full: checked <code>realloc</code> grows the array to ${maxE}.`,V());t.drop('oldMaxE');}
        let sv=p.v,sw=p.w;if(!directed&&weighted&&sv>sw){[sv,sw]=[sw,sv];}
        edges.push({v:sv,w:sw,wt:p.wt});i=edges.length-1;
        t.v({nE:edges.length,index:i,maxE}).step([cb,L.appendV],`Write ${weighted?`(${sv}, ${sw}, ${p.wt})`:`(${sv}, ${sw})`} into <code>edges[${i}]</code>${!directed&&weighted?' using canonical endpoint order':''}.`,V(i));
        t.step([cb,L.increment],'<code>g->nE++</code>.',V(i));
      }else if(p&&p.cmd==='remove'){
        const i=edges.findIndex(e=>eq(e,p.v,p.w));t.v({v:p.v,w:p.w,index:i,nE:edges.length}).step([cb,L.removeIndex],`Linear scan gives match index ${i}.`,V(i));if(i<0){t.step([cb,L.removeIndex],'Edge absent: return without changes.',V());continue;}
        for(let j=i;j<edges.length-1;j++){edges[j]={...edges[j+1]};t.v({j,from:j+1}).step([cb,L.shift],`Copy <code>edges[${j+1}]</code> left into <code>edges[${j}]</code>.`,V(j));}
        edges.pop();t.drop('j','from').v({nE:edges.length}).step([cb,L.decrement],'<code>g->nE--</code>; the live prefix is compact again.',V(Math.min(i,edges.length-1)));
      }else if(p&&p.cmd==='adjacent'){
        const i=edges.findIndex(e=>eq(e,p.v,p.w));t.v({v:p.v,w:p.w,index:i,result:i>=0}).step([cb,L.edgeScan],`Scan all live records; adjacency result <b>${i>=0}</b>.`,V(i));
      }else if(p&&p.cmd==='weight'){
        if(!weighted){t.v({operation:'GraphGetWeight',result:'not part of unweighted interface'}).step([cb,L.edgeScan],'<code>GraphGetWeight</code> exists only in the declared weighted study interface. Select <b>weighted</b> before using this operation.',V());continue;}
        const i=edges.findIndex(e=>eq(e,p.v,p.w)),found=i>=0;t.v({v:p.v,w:p.w,index:i,adjacent:found}).step([cb,L.edgeScan],`Check the <code>GraphGetWeight</code> precondition: edge ${p.v}${directed?'→':'–'}${p.w} exists: <b>${found}</b>.`,V(i));
        if(!found){t.v({precondition:'failed — no value returned'}).step([cb,Q.getWeight],'<code>GraphGetWeight</code> assumes that the edge exists. The trace does not invent a weight.',V());continue;}
        t.v({weight:edges[i].wt}).step([cb,Q.getWeight],`<code>GraphGetWeight</code> returns <b>${edges[i].wt}</b>.`,V(i));
      }else if(['vertices','numvertices','numv'].includes(cmd)){
        t.v({return:n}).step([cb,Q.numVertices],`<code>GraphNumVertices</code> returns <b>${n}</b>.`,V());
      }else if(['edges','numedges','nume'].includes(cmd)){
        t.v({return:edges.length}).step([cb,Q.numEdges],`<code>GraphNumEdges</code> returns the logical edge/arc count <b>${edges.length}</b>.`,V());
      }else if(cmd==='show'){
        t.v({nV:n,nE:edges.length,maxE}).step([cb,L.showLoop],'Output the live record prefix <code>edges[0..nE-1]</code>; later cells are unused capacity.',V());
      }else if(cmd==='free'){
        t.free(aBlk);edges=[];t.step([cb,L.freeArray],'Release the contiguous edge array.',V());t.free(gBlk);alive=false;t.step([cb,L.freeGraph],'Release the graph structure. No edge-array allocation remains live.',V());
      }else throw new Error('operations: vertices, edges, insert v w[:weight], remove v w, adjacent v w, weight v w (weighted mode), show, free');
    }return t;
  }
});

mod({
  id:'graphweighted',group:'Graph representations',name:"Graph mode x representation - complete C study matrix",keywords:'directed undirected weighted unweighted matrix adjacency list edge array source status complete C memorise prior knowledge',
  blocks:[
    {title:"Three representations - exact lecture concept",src:LEC_GRAPH_REPS,source:'lecture',pseudo:true,pages:'week04 graph introduction'},
    {title:"Directed terminology - exact lecture concept",src:LEC_DIGRAPH_TERMS,source:'lecture',pseudo:true,pages:'week05 directed and weighted graphs'},
    {title:"Weighted representation changes - exact lecture concept",src:LEC_WEIGHTED_REPS,source:'lecture',pseudo:true,pages:'week05 directed and weighted graphs'},
    {title:"Undirected unweighted adjacency matrix - exact manual C",src:SRC_GADJ,source:'manual',pages:"pp. 16-19"},
    {title:"Directed unweighted adjacency matrix - supplemental C",src:SRC_GMATRIX_DU_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Undirected weighted adjacency matrix - supplemental C",src:SRC_GMATRIX_UW_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Directed weighted adjacency matrix - supplemental C",src:SRC_GMATRIX_DW_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Adjacency-list base structs - exact lecture C",src:LEC_ADJLIST_STRUCT,source:'lecture',pages:'week04 graph introduction'},
    {title:"Undirected unweighted adjacency list - supplemental C",src:SRC_GADJLIST_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Directed unweighted adjacency list - supplemental C",src:SRC_GADJLIST_DU_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Undirected weighted adjacency list - supplemental C",src:SRC_GADJLIST_UW_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Directed weighted adjacency list - supplemental C",src:SRC_GADJLIST_DW_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Array-of-edges base structs - exact lecture C",src:LEC_EDGEARRAY_STRUCT,source:'lecture',pages:'week04 graph introduction'},
    {title:"Undirected unweighted array of edges - supplemental C",src:SRC_GEDGEARRAY_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Directed unweighted array of edges - supplemental C",src:SRC_GEDGEARRAY_DU_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Undirected weighted array of edges - supplemental C",src:SRC_GEDGEARRAY_UW_MEM,source:'memorise',pages:'supplemental implementation'},
    {title:"Directed weighted array of edges - supplemental C",src:SRC_GEDGEARRAY_DW_MEM,source:'memorise',pages:'supplemental implementation'}
  ],
  /* CUR-MOD-02: this matrix is the largest single carrier of the removed
     requirement - 17 blocks, 2,168 displayed lines. It is a comparison
     reference, not a memorisation list. */
  note:'This is the closed graph-representation study matrix. Only the undirected/unweighted adjacency matrix is exact manual C. Every other mode/representation implementation is <b>supplemental C</b>, with its supplemental choices declared in the source header. Use it to compare how one chosen mode is realised across the three representations; you are not expected to memorise all seventeen. The lecture structures and representation deltas remain separately tagged.',
  fields:[{k:'nV',label:'nV',def:'5',type:'number',min:1,max:10,w:4},{k:'g',label:'edges / arcs [:weight]',def:'0>1:0.2, 0>2:0.4, 1>3:0.3, 1>4:0.6, 2>3:0.5, 2>4:0.1, 3>4:0.9, 4>0:0.1'},{k:'directed',label:'graph',def:'directed',type:'select',options:['undirected','directed']},{k:'weighted',label:'weights',def:'weighted',type:'select',options:['unweighted','weighted']},{k:'rep',label:'representation',def:'adjacency matrix',type:'select',options:['adjacency matrix','adjacency list','array of edges']}],
  run(inp){
    const directed=inp.directed==='directed',weighted=inp.weighted==='weighted',rep=inp.rep,G=parseGraph(inp.g,inp.nV,directed),t=new Trace(),mode=graphModeKey(directed,weighted),variant=graphVariant(rep,directed,weighted);
    if(weighted&&G.edges.some(e=>e.wt<0))throw new Error('study bridges use non-negative weights');
    if(!weighted){G.edges.forEach(e=>e.wt=1);for(let v=0;v<G.nV;v++)for(let w=0;w<G.nV;w++)if(G.adj[v][w])G.wt[v][w]=1;}
    const blockMap={
      'adjacency matrix':{uu:3,du:4,uw:5,dw:6},
      'adjacency list':{uu:8,du:9,uw:10,dw:11},
      'array of edges':{uu:13,du:14,uw:15,dw:16}
    };
    const cb=blockMap[rep][mode];
    const implLine=variant.source==='manual'?(LGA.gmalloc||1):(variant.lines.graphAlloc||variant.lines.insert||1);
    const status=variant.source==='manual'?'26T2 MANUAL — exact C':'SUPPLEMENTAL — complete C; not manual/lecture source';
    const repView={title:rep,...representationView(G.nV,G.adj,G.wt,directed,weighted,rep)};
    const baseViews=[plainGraphView(G.nV,G.adj,G.wt,directed,weighted),repView];
    t.v({V:G.nV,E:G.edges.length,mode:variant.label,representation:rep,sourceStatus:status}).step([0,1],`Select <b>${variant.label}</b> and <b>${rep}</b>. The mapping pane routes this concept to the complete matching C implementation.`,{kind:'multi',views:baseViews});
    if(directed)t.step([1,1],'Directed mode stores an ordered source/destination relation; insertion does not create a reverse edge.',{kind:'multi',views:baseViews});
    if(weighted)t.step([2,1],'Weighted mode stores a weight in each matrix cell, list node or edge record; the complete C declares the no-edge/update convention.',{kind:'multi',views:baseViews});
    t.step([cb,implLine],`Open the selected implementation: <b>${status}</b>.`,{kind:'multi',views:baseViews});
    const outD=G.adj.map(r=>r.filter(Boolean).length),inD=range(0,G.nV-1).map(v=>G.adj.reduce((s,r)=>s+(r[v]?1:0),0));
    let analysis;
    if(directed){
      const tc=G.adj.map(r=>r.slice());for(let i=0;i<G.nV;i++)tc[i][i]=true;for(let k=0;k<G.nV;k++)for(let v=0;v<G.nV;v++)for(let w=0;w<G.nV;w++)if(tc[v][k]&&tc[k][w])tc[v][w]=true;
      analysis=refView(refTable('Directed degrees',['v','in(v)','out(v)'],range(0,G.nV-1).map(v=>[v,inD[v],outD[v]])),refTable('Reachability',['from \\ to',...range(0,G.nV-1)],tc.map((r,i)=>[i,...r.map(x=>x?'T':'F')])));
      t.v({stronglyConnected:tc.every(r=>r.every(Boolean))});
    }else{
      const seen=new Array(G.nV).fill(false);let nC=0;for(let s=0;s<G.nV;s++)if(!seen[s]){nC++;const q=[s];seen[s]=true;while(q.length){const v=q.shift();for(let w=0;w<G.nV;w++)if(G.adj[v][w]&&!seen[w]){seen[w]=true;q.push(w);}}}
      analysis=refView(refTable('Undirected degrees',['v','deg(v)'],range(0,G.nV-1).map(v=>[v,outD[v]])),{title:'Connectivity',html:`<p>Connected components: <b>${nC}</b>.</p>`});t.v({components:nC});
    }
    t.step([cb,implLine],'Confirm the selected representation, graph-mode invariants and source status before tracing algorithms.',refView(
      refTable('Selected implementation',['Dimension','Selection'],[['Direction',directed?'directed':'undirected'],['Weights',weighted?'weighted':'unweighted'],['Representation',rep],['C provenance',status],['Logical E',G.edges.length]]),
      refTable('Neighbour-enumeration pattern',['Representation','C pattern'],[['Adjacency matrix','scan row v from 0 to nV - 1'],['Adjacency list','follow g->edges[v] through ->next'],['Array of edges',directed?'scan records whose source is v':'scan records containing endpoint v']]),
      {title:'Study rule',html:'<p><b>Learn and memorise every orange implementation before relying on an algorithm trace.</b> It is course-aligned prior knowledge, not material claimed to be printed in the manual.</p>'}
    ));
    t.step([cb,implLine],'Graph-mode analysis for the supplied input.',analysis);return t;
  }
});

/* ---------- graph traversal and graph problems ---------- */
function algoGraphView(G,rep,tables=[],cls={},ecls={},activeRow){
  const graph=plainGraphView(G.nV,G.adj,G.wt,!!G.directed,!!G.weighted,cls,ecls);graph.tables=tables;
  return {kind:'multi',views:[graph,{title:rep,...representationView(G.nV,G.adj,G.wt,!!G.directed,!!G.weighted,rep,{activeRow})}]};
}
const PS_BFS_PATH = `bfsFindPath(G, src, dest):
    ... BFS starting from src ...
    if predecessor[dest] = -1:
        return no path
    v = dest
    while v != src:
        output v
        v = predecessor[v]
    output src`;
const LBFP=lines(PS_BFS_PATH,{sig:'bfsFindPath',miss:'if predecessor[dest]',v:'v = dest',loop:'while v != src:',out:'output v',pred:'v = predecessor[v]',src:'output src'});
mod({
  id:'bfspath',group:'Graph traversal',name:'BFS shortest path reconstruction',keywords:'BFS path predecessor shortest unweighted queue representation',
  blocks:[{title:"BFS path reconstruction - lecture pseudocode",src:PS_BFS_PATH,pseudo:true,source:'lecture',pages:'week05 graph traversal'},{title:"BFS - manual pseudocode",src:PS_BFS,pseudo:true,source:'manual',pages:'p. 19'}],
  note:'BFS discovers vertices in order of edge distance, so tracing backwards through <code>predecessor</code> yields a shortest path in number of edges.',
  fields:[{k:'nV',label:'nV',def:'6',type:'number',min:1,max:12,w:4},{k:'g',label:'edges',def:'0-1, 0-2, 1-3, 1-4, 2-4, 3-5, 4-5'},{k:'src',label:'src',def:'0',type:'number',w:4},{k:'dest',label:'dest',def:'5',type:'number',w:4},{k:'rep',label:'view',def:'adjacency list',type:'select',options:['adjacency matrix','adjacency list','array of edges']}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),src=safeInt(inp.src,'src',0,G.nV-1),dest=safeInt(inp.dest,'dest',0,G.nV-1),rep=inp.rep,t=new Trace(),pred=new Array(G.nV).fill(-1),Q=[];
    const pblk=t.alloc('create','predecessor[]','nV entries','lecture pseudocode'),qblk=t.alloc('QueueNew','Q','queue struct','manual Queue ADT');pred[src]=src;Q.push(src);
    const V=(cls={},ecls={},chg=[])=>algoGraphView(G,rep,[{name:'predecessor[]',tag:'pred',row:pred.slice(),chg},{name:`Q: ${Q.length?Q.join(' '):'empty'}`,tag:'Q',row:Q.length?Q.slice():['—']}],cls,ecls,Number.isInteger(t.vars.v)?t.vars.v:undefined);
    t.v({src,dest}).step([1,LBFS.seed],`Seed BFS at ${src}.`,V({[src]:'hit'},{},[src]));
    while(Q.length){const v=Q.shift();t.v({v}).step([1,LBFS.deq],`Dequeue ${v}.`,V({[v]:'act'}));for(let w=0;w<G.nV;w++){if(!G.adj[v][w]||pred[w]!==-1)continue;pred[w]=v;Q.push(w);t.v({w}).step([1,LBFS.setp],`Discover ${w}: <code>predecessor[${w}] = ${v}</code>; enqueue it.`,V({[v]:'act',[w]:'hit'},{[`${v}-${w}`]:'tree'},[w]));}}
    if(pred[dest]===-1){t.step([0,LBFP.miss],`<code>predecessor[${dest}] == -1</code>; no path exists.`,V({[dest]:'bad'}));t.free(qblk);t.release(pblk);t.step([0,LBFP.miss],'Release the helper queue and predecessor-array lifecycle.',V({[dest]:'bad'}));return t;}
    const rev=[];let v=dest;t.v({v}).step([0,LBFP.v],`Begin at destination ${dest}.`,V({[dest]:'act'}));while(v!==src){rev.push(v);const p=pred[v];t.v({v,'predecessor[v]':p}).step([0,LBFP.pred],`Move backwards: ${v} ← ${p}.`,V({[v]:'act',[p]:'hit'},{[`${p}-${v}`]:'tree'}));v=p;}rev.push(src);const path=rev.reverse();t.drop('v','predecessor[v]').v({path:path.join(' -> '),edges:path.length-1}).step([0,LBFP.src],`Shortest path: <b>${path.join(' → ')}</b>.`,V(Object.fromEntries(path.map(x=>[x,'hit'])),Object.fromEntries(path.slice(1).map((x,i)=>[`${path[i]}-${x}`,'tree']))));t.free(qblk);t.release(pblk);t.step([0,LBFP.src],'Release the helper queue and predecessor-array lifecycle; the reconstructed result is retained in the trace.',V(Object.fromEntries(path.map(x=>[x,'hit']))));return t;
  }
});

const PS_DFS_PATH = `dfsFindPath(G, src, dest):
    create predecessor array, initialised to -1
    predecessor[src] = src
    if dfsFindPathRec(G, src, dest, predecessor):
        trace backwards from dest through predecessor

dfsFindPathRec(G, v, dest, predecessor):
    if v = dest:
        return true
    for each neighbour w of v in G:
        if predecessor[w] = -1:
            predecessor[w] = v
            if dfsFindPathRec(G, w, dest, predecessor):
                return true
    return false`;
const LDFP=lines(PS_DFS_PATH,{pred:'create predecessor array',seed:'predecessor[src] = src',call:'if dfsFindPathRec',base:'if v = dest:',loop:'for each neighbour',test:'if predecessor[w] = -1:',set:'predecessor[w] = v',rec:'if dfsFindPathRec(G, w',yes:'return true',no:'return false'});
mod({
  id:'dfspath',group:'Graph traversal',name:'Recursive DFS path checking and finding',keywords:'DFS path has path find predecessor recursion backtracking',
  blocks:[{title:"DFS path finding - lecture pseudocode",src:PS_DFS_PATH,pseudo:true,source:'lecture',pages:'week05 graph traversal'}],
  note:'DFS returns the first path found under neighbour order; unlike BFS, it is not guaranteed to be shortest.',
  fields:[{k:'nV',label:'nV',def:'7',type:'number',min:1,max:12,w:4},{k:'g',label:'edges',def:'0-1, 0-2, 1-3, 1-4, 2-5, 4-6, 5-6'},{k:'src',label:'src',def:'0',type:'number',w:4},{k:'dest',label:'dest',def:'6',type:'number',w:4},{k:'rep',label:'view',def:'adjacency list',type:'select',options:['adjacency matrix','adjacency list','array of edges']}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),src=safeInt(inp.src,'src',0,G.nV-1),dest=safeInt(inp.dest,'dest',0,G.nV-1),rep=inp.rep,t=new Trace(),pred=new Array(G.nV).fill(-1),stack=[],treeEdges={};const pblk=t.alloc('create','predecessor[]','nV entries','lecture pseudocode');pred[src]=src;
    const V=(cls={})=>algoGraphView(G,rep,[{name:'predecessor[]',tag:'pred',row:pred.slice()},{name:`call stack: ${stack.length?stack.join(' -> '):'empty'}`,tag:'v',row:stack.length?stack.slice():['—']}],cls,treeEdges,stack[stack.length-1]);
    t.v({src,dest}).step([0,LDFP.seed],`Mark ${src} as reached by setting its predecessor to itself.`,V({[src]:'hit'}));
    function rec(v){stack.push(v);t.v({v}).step([0,LDFP.call],`Enter <code>dfsFindPathRec(${v})</code>.`,V({[v]:'act'}));t.step([0,LDFP.base],`<code>${v} == ${dest}</code>: <b>${v===dest}</b>.`,V({[v]:v===dest?'hit':'act'}));if(v===dest){stack.pop();return true;}for(let w=0;w<G.nV;w++){if(!G.adj[v][w])continue;t.v({w}).step([0,LDFP.test],`Neighbour ${w}; unreached: <b>${pred[w]===-1}</b>.`,V({[v]:'act',[w]:pred[w]===-1?'hit':'bad'}));if(pred[w]===-1){pred[w]=v;treeEdges[`${v}-${w}`]='tree';t.step([0,LDFP.set],`<code>predecessor[${w}] = ${v}</code>.`,V({[w]:'hit'}));if(rec(w)){stack.pop();return true;}}}stack.pop();t.step([0,LDFP.no],`Backtrack from ${v}; no path through this branch.`,V({[v]:'bad'}));return false;}
    const found=rec(src);let path=[];if(found){for(let v=dest;;v=pred[v]){path.push(v);if(v===src)break;}path.reverse();}t.drop('v','w').v({found,path:found?path.join(' -> '):'—'}).step([0,found?LDFP.yes:LDFP.no],found?`Path found: <b>${path.join(' → ')}</b>.`:'No path found.',V(Object.fromEntries(path.map(x=>[x,'hit']))));t.release(pblk);t.step([0,found?LDFP.yes:LDFP.no],'Release the predecessor-array lifecycle after path reconstruction.',V(Object.fromEntries(path.map(x=>[x,'hit']))));return t;
  }
});

const PS_DFS_ITER = `dfs(G, src):
    create visited array, initialised to false
    create predecessor array, initialised to -1
    create stack S
    push src onto S
    while S is not empty:
        v = pop from S
        if visited[v] = true:
            continue
        visited[v] = true
        for each neighbour w of v in G where visited[w] = false:
            predecessor[w] = v
            push w onto S`;
const LDI=lines(PS_DFS_ITER,{vis:'create visited array',pred:'create predecessor',stack:'create stack S',push:'push src',loop:'while S is not empty:',pop:'v = pop',test:'if visited[v]',cont:'continue',mark:'visited[v] = true',nbr:'for each neighbour',set:'predecessor[w] = v',pushw:'push w onto S'});
mod({
  id:'dfsiter',group:'Graph traversal',name:"Iterative DFS - explicit stack",keywords:'iterative DFS stack predecessor visited duplicate pushes',
  blocks:[{title:"Iterative DFS - lecture pseudocode",src:PS_DFS_ITER,pseudo:true,source:'lecture',pages:'week05 graph traversal'}],
  note:"The lecture's crucial distinction is that iterative DFS marks a vertex after popping it, so the stack can contain duplicate references. Already-visited pops are skipped.",
  fields:[{k:'nV',label:'nV',def:'6',type:'number',min:1,max:12,w:4},{k:'g',label:'edges',def:'0-1, 0-2, 1-3, 1-4, 2-4, 3-5, 4-5'},{k:'src',label:'src',def:'0',type:'number',w:4},{k:'rep',label:'view',def:'adjacency list',type:'select',options:['adjacency matrix','adjacency list','array of edges']}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),src=safeInt(inp.src,'src',0,G.nV-1),rep=inp.rep,t=new Trace(),vis=new Array(G.nV).fill(false),pred=new Array(G.nV).fill(-1),S=[];const vb=t.alloc('create','visited[]','nV entries','lecture pseudocode'),pb=t.alloc('create','predecessor[]','nV entries','lecture pseudocode'),sb=t.alloc('StackNew','S','stack struct','manual Stack ADT');S.push(src);
    const V=(cls={})=>algoGraphView(G,rep,[{name:'visited[]',tag:'vis',row:vis.map(x=>x?'T':'F')},{name:'predecessor[]',tag:'pred',row:pred.slice()},{name:`S bottom -> top: ${S.length?S.join(' '):'empty'}`,tag:'S',row:S.length?S.slice():['—']}],cls,{},Number.isInteger(t.vars.v)?t.vars.v:undefined);
    t.v({src}).step([0,LDI.push],`Push ${src}.`,V({[src]:'act'}));while(S.length){t.step([0,LDI.loop],'<code>S</code> is not empty.',V());const v=S.pop();t.v({v}).step([0,LDI.pop],`Pop ${v}.`,V({[v]:'act'}));t.step([0,LDI.test],`Already visited: <b>${vis[v]}</b>.`,V({[v]:vis[v]?'bad':'hit'}));if(vis[v]){t.step([0,LDI.cont],'<code>continue</code>.',V());continue;}vis[v]=true;t.step([0,LDI.mark],`<code>visited[${v}] = true</code>.`,V({[v]:'hit'}));for(let w=0;w<G.nV;w++){if(G.adj[v][w]&&!vis[w]){pred[w]=v;S.push(w);t.v({w}).step([0,LDI.pushw],`Set <code>predecessor[${w}] = ${v}</code> and push ${w}.`,V({[v]:'act',[w]:'hit'}));}}}t.drop('v','w').step([0,LDI.loop],'Stack empty; traversal complete.',V(Object.fromEntries(vis.map((x,i)=>[i,x?'hit':'bad']))));t.free(sb);t.release(vb);t.release(pb);t.step([0,LDI.loop],'Release the explicit stack and both helper-array lifecycles.',V(Object.fromEntries(vis.map((x,i)=>[i,x?'hit':'bad']))));return t;
  }
});

const PS_CYCLE_U = `hasCycle(G):
    create visited array, initialised to false
    for each vertex v in G:
        if visited[v] = false:
            if dfsHasCycle(G, v, v, visited):
                return true
    return false

dfsHasCycle(G, v, prev, visited):
    visited[v] = true
    for each neighbour w of v in G:
        if w = prev:
            continue
        if visited[w] = true:
            return true
        else if dfsHasCycle(G, w, v, visited):
            return true
    return false`;
const LCU=lines(PS_CYCLE_U,{vis:'create visited array',outer:'for each vertex v',call:'if dfsHasCycle(G, v, v',mark:'visited[v] = true',nbr:'for each neighbour',prev:'if w = prev:',cont:'continue',seen:'if visited[w] = true:',yes:'return true',rec:'else if dfsHasCycle',no:'return false'});
mod({
  id:'cycleu',group:'Graph problems',name:"Undirected cycle checking - all components",keywords:'cycle undirected DFS parent previous disconnected',
  blocks:[{title:"Working undirected cycle algorithm - lecture pseudocode",src:PS_CYCLE_U,pseudo:true,source:'lecture',pages:'week05 graph problems'}],
  note:'Ignoring the previous vertex prevents a single undirected edge from being mistaken for a cycle. The outer loop is required to inspect every connected component.',
  fields:[{k:'nV',label:'nV',def:'7',type:'number',min:1,max:12,w:4},{k:'g',label:'edges',def:'0-1, 1-2, 2-0, 3-4, 5-6'},{k:'rep',label:'view',def:'adjacency list',type:'select',options:['adjacency matrix','adjacency list','array of edges']}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),rep=inp.rep,t=new Trace(),vis=new Array(G.nV).fill(false),stack=[];const vb=t.alloc('create','visited[]','nV entries','lecture pseudocode');let cycle=false,back=null;
    const V=(cls={},ecls={})=>algoGraphView(G,rep,[{name:'visited[]',tag:'vis',row:vis.map(x=>x?'T':'F')},{name:`DFS stack: ${stack.length?stack.join(' -> '):'empty'}`,tag:'v',row:stack.length?stack.slice():['—']}],cls,ecls,stack[stack.length-1]);
    function rec(v,prev){stack.push(v);vis[v]=true;t.v({v,prev}).step([0,LCU.mark],`Visit ${v}; previous vertex is ${prev}.`,V({[v]:'act'}));for(let w=0;w<G.nV;w++){if(!G.adj[v][w])continue;t.v({w}).step([0,LCU.prev],`Neighbour ${w}; <code>w == prev</code>: <b>${w===prev}</b>.`,V({[v]:'act',[w]:'act'},{[`${v}-${w}`]:'act'}));if(w===prev)continue;if(vis[w]){back=[v,w];t.step([0,LCU.seen],`${w} is already visited and is not the parent: cycle detected.`,V({[v]:'bad',[w]:'bad'},{[`${v}-${w}`]:'act'}));stack.pop();return true;}if(rec(w,v)){stack.pop();return true;}}stack.pop();return false;}
    for(let v=0;v<G.nV&&!cycle;v++){t.v({v}).step([0,LCU.outer],`Outer scan at vertex ${v}; unvisited: <b>${!vis[v]}</b>.`,V({[v]:vis[v]?'bad':'act'}));if(!vis[v])cycle=rec(v,v);}t.drop('w','prev').v({cycle}).step([0,cycle?LCU.yes:LCU.no],cycle?`Cycle exists${back?` (back edge ${back[0]}–${back[1]})`:''}.`:'No cycle exists.',V({},back?{[`${back[0]}-${back[1]}`]:'act'}:{}));t.release(vb);t.step([0,cycle?LCU.yes:LCU.no],'Release the visited-array lifecycle.',V(back?{[back[0]]:'hit',[back[1]]:'hit'}:{}));return t;
  }
});

const PS_COMPONENTS = `components(G):
    create componentOf array, initialised to -1
    compNo = 0
    for each vertex v in G:
        if componentOf[v] = -1:
            dfsComponents(G, v, componentOf, compNo)
            compNo = compNo + 1
    return componentOf

dfsComponents(G, v, componentOf, compNo):
    componentOf[v] = compNo
    for each neighbour w of v in G:
        if componentOf[w] = -1:
            dfsComponents(G, w, componentOf, compNo)`;
const LCO=lines(PS_COMPONENTS,{create:'create componentOf',zero:'compNo = 0',outer:'for each vertex',test:'if componentOf[v]',call:'dfsComponents(G, v',inc:'compNo = compNo + 1',ret:'return componentOf',set:'componentOf[v] = compNo',nbr:'for each neighbour',rec:'dfsComponents(G, w'});
/* ---------- CAP-117: make the spanning forest visible ----------
   The lecture pseudocode above computes componentOf correctly but records no
   edges, so the forest it builds was only asserted in prose. This block is a
   supplemental extension that records the edge the DFS actually used to reach
   each new vertex, counts the edges per component, and states the counting
   invariant the trace is then checked against. It is not lecture or manual
   source. */
const PS_COMPONENTS_FOREST = `spanningForest(G):                    # supplemental extension of components(G)
    create componentOf array, initialised to -1
    create empty treeEdges list
    compNo = 0
    for each vertex v in G:
        if componentOf[v] = -1:
            dfsForest(G, v, componentOf, compNo, treeEdges)
            compNo = compNo + 1
    return componentOf, treeEdges

dfsForest(G, v, componentOf, compNo, treeEdges):
    componentOf[v] = compNo
    for each neighbour w of v in G:
        if componentOf[w] = -1:
            add edge (v, w) to treeEdges      # a tree edge of component compNo
            dfsForest(G, w, componentOf, compNo, treeEdges)

Invariant
    The recorded edges form a spanning forest of G: one spanning tree per
    connected component, and no cycle, because an edge is recorded only when
    it reaches a vertex whose componentOf is still -1.
    A spanning forest of a graph with V vertices and C components has exactly
    V - C edges. A tree on k vertices has k - 1 edges, so adding up over the
    C components gives (sum of the k) - C = V - C.
    A component of one vertex is a tree on one vertex and contributes 0 edges,
    so an isolated vertex still counts towards both V and C.
    An input edge that is not recorded is a non-tree edge. In an undirected
    DFS a non-tree edge closes a cycle inside its own component, and the
    number of non-tree edges is E - (V - C).`;
const LCOF=lines(PS_COMPONENTS_FOREST,{sig:'spanningForest(G):',list:'create empty treeEdges list',call:'dfsForest(G, v',def:['dfsForest(G, v',2],inc:'compNo = compNo + 1',ret:'return componentOf, treeEdges',add:'add edge (v, w) to treeEdges',rec:'dfsForest(G, w',inv:'The recorded edges form a spanning forest',count:'A spanning forest of a graph with V vertices',single:'A component of one vertex',nontree:'An input edge that is not recorded'});
mod({
  id:'components',group:'Graph problems',name:'Connected components and spanning forest',keywords:'componentOf connected components DFS spanning forest tree edge non-tree edge V minus C isolated vertex disconnected cache nC cc',
  blocks:[
    {title:"components - lecture pseudocode",src:PS_COMPONENTS,pseudo:true,source:'lecture',pages:'week05 graph problems'},
    {title:"Spanning-forest edge recording - supplemental",src:PS_COMPONENTS_FOREST,pseudo:true,source:'memorise',pages:'supplemental lesson'}
  ],
  note:'Each DFS tree is one tree of the spanning forest. The lecture pseudocode computes <code>componentOf</code> but records no edges, so the second block is a supplemental extension that names the tree edges as the DFS discovers them, counts them per component and states the counting invariant: a spanning forest of a graph with V vertices and C components has exactly <b>V − C</b> edges, and a one-vertex component contributes none. The default graph is disconnected and includes an isolated vertex so both cases are visible. The lecture also discusses caching <code>nC</code> and <code>cc</code> in the graph struct, which then must be maintained whenever edges change.',
  fields:[{k:'nV',label:'nV',def:'10',type:'number',min:1,max:15,w:4},{k:'g',label:'edges',def:'0-1, 1-4, 2-3, 3-5, 5-6, 7-8'},{k:'rep',label:'view',def:'adjacency list',type:'select',options:['adjacency matrix','adjacency list','array of edges']}],
  run(inp){
    const blocks=this.blocks;
    const G=parseGraph(inp.g,inp.nV,false),rep=inp.rep,t=new Trace(),cc=new Array(G.nV).fill(-1),forest={};
    let compNo=0;const treeEdges=[],compEdges=[],compSize=[];
    const cb=t.alloc('create','componentOf[]','nV entries','lecture pseudocode');
    const eb=t.alloc('create','treeEdges','spanning-forest edge list','supplemental pseudocode');
    const V=(cls={})=>algoGraphView(G,rep,[
      {name:'componentOf[]',tag:'cc',row:cc.slice()},
      {name:`components found: ${compNo}`,tag:'nC',row:[compNo]},
      {name:`tree edges of the spanning forest: ${treeEdges.length}`,tag:'e',row:treeEdges.length?treeEdges.map(e=>`${e.v}-${e.w}`):['—']},
      {name:'tree edges per component',head:'comp',tag:'|T|',row:compEdges.length?compEdges.slice():['—']}
    ],cls,forest,Number.isInteger(t.vars.v)?t.vars.v:undefined);
    const all=cls=>Object.fromEntries(cc.map((c,i)=>[i,cls]));
    function rec(v){
      cc[v]=compNo;compSize[compNo]=(compSize[compNo]||0)+1;
      t.v({v,compNo}).step([0,LCO.set],`Assign vertex ${v} to component ${compNo}.`,V({[v]:'hit'}));
      for(let w=0;w<G.nV;w++)if(G.adj[v][w]&&cc[w]===-1){
        forest[`${v}-${w}`]='tree';treeEdges.push({v,w,comp:compNo});compEdges[compNo]=(compEdges[compNo]||0)+1;
        t.v({w,'tree edges':treeEdges.length}).step(srcLine(blocks,LCOF,'add'),
          `Record <b>${v}–${w}</b> as a tree edge of component ${compNo}. <code>componentOf[${w}]</code> is still −1, so this edge reaches a vertex that no earlier edge reached and it cannot close a cycle. Component ${compNo} now has ${compEdges[compNo]} tree edge${compEdges[compNo]===1?'':'s'}.`,
          V({[v]:'act',[w]:'hit'}));
        rec(w);
      }
    }
    t.step([0,LCO.create],'<code>componentOf</code> starts with all entries −1.',V());
    t.step(srcLine(blocks,LCOF,'list'),'<code>treeEdges</code> starts empty. The lecture pseudocode returns only <code>componentOf</code>; recording the edge that the DFS actually used to reach each new vertex is the supplemental extension that makes the forest visible instead of merely asserted.',V());
    for(let v=0;v<G.nV;v++){
      t.v({v,compNo}).step([0,LCO.test],`<code>componentOf[${v}] == -1</code>: <b>${cc[v]===-1}</b>.`,V({[v]:cc[v]===-1?'act':'bad'}));
      if(cc[v]===-1){
        compEdges[compNo]=0;compSize[compNo]=0;
        rec(v);
        const size=compSize[compNo],ed=compEdges[compNo];
        const mark=Object.fromEntries(cc.map((c,i)=>[i,c]).filter(([,c])=>c===compNo).map(([i])=>[i,'hit']));
        t.v({compNo,'component size':size,'component tree edges':ed}).step(srcLine(blocks,LCOF,'call'),
          `Component ${compNo} is finished: ${size} vert${size===1?'ex':'ices'}, ${ed} tree edge${ed===1?'':'s'}. ${size===1?`Vertex ${v} is <b>isolated</b>, so this component is a tree on one vertex and contributes <b>0</b> edges — it still counts towards both V and C.`:`A tree on ${size} vertices has ${size-1} edges, and this component recorded ${ed} = ${size} − 1.`}`,
          V(mark));
        compNo++;
        t.v({compNo}).step([0,LCO.inc],'Increment component number for the next DFS tree.',V());
      }
    }
    const edges=treeEdges.length,expected=G.nV-compNo,nonTree=G.edges.length-edges;
    t.drop('v','w','tree edges','component size','component tree edges');
    t.v({V:G.nV,C:compNo,'tree edges':edges,'V - C':expected,'invariant holds':edges===expected})
      .step(srcLine(blocks,LCOF,'count'),
        `<b>The invariant, checked against what this trace produced.</b> V = ${G.nV} and C = ${compNo}, so a spanning forest of this graph must have exactly V − C = <b>${expected}</b> edge${expected===1?'':'s'}. The DFS recorded <b>${edges}</b>, so the invariant <b>${edges===expected?'holds':'does NOT hold — this is a defect, not a property of the graph'}</b>. Per component: ${compEdges.map((n,i)=>`component ${i} has ${compSize[i]} vert${compSize[i]===1?'ex':'ices'} and ${n} edge${n===1?'':'s'}`).join('; ')}.`,
        V(all('hit')));
    t.v({nC:compNo}).step([0,LCO.ret],
      `There ${compNo===1?'is':'are'} <b>${compNo}</b> connected component${compNo===1?'':'s'}, and the highlighted edges are the spanning forest: <b>${treeEdges.map(e=>`${e.v}–${e.w}`).join(', ')||'no edges — every vertex is isolated'}</b>. Of the ${G.edges.length} input edge${G.edges.length===1?'':'s'}, ${edges} ${edges===1?'is a tree edge':'are tree edges'} and ${nonTree} ${nonTree===1?'is a non-tree edge':'are non-tree edges'}${nonTree?', and in an undirected DFS each non-tree edge closes a cycle inside its own component':''}.`,
      V(all('hit')));
    t.release(cb);t.release(eb);
    t.step([0,LCO.ret],'Release the <code>componentOf</code> and <code>treeEdges</code> lifecycles after returning their traced result.',V(all('hit')));
    return t;
  }
});

const PS_HAMILTON = `hasHamiltonianPath(G):
    create visited array, initialised to false
    for each vertex v in G:
        if dfsHamiltonianPath(G, v, visited, #vertices(G)):
            return true
    return false

dfsHamiltonianPath(G, v, visited, numVerticesLeft):
    visited[v] = true
    numVerticesLeft = numVerticesLeft - 1
    if numVerticesLeft = 0:
        return true
    for each neighbour w of v in G:
        if visited[w] = false:
            if dfsHamiltonianPath(G, w, visited, numVerticesLeft):
                return true
    visited[v] = false
    return false

Hamiltonian circuit: use one start vertex and require the final vertex to be adjacent to the start.`;
const LHA=lines(PS_HAMILTON,{create:'create visited array',outer:'for each vertex',call:'if dfsHamiltonianPath',mark:'visited[v] = true',dec:'numVerticesLeft = numVerticesLeft - 1',base:'if numVerticesLeft = 0:',nbr:'for each neighbour',test:'if visited[w] = false:',rec:'if dfsHamiltonianPath(G, w',undo:'visited[v] = false',no:'return false',circuit:'Hamiltonian circuit'});
mod({
  id:'hamilton',group:'Graph problems',name:"Hamiltonian path and circuit - backtracking",keywords:'Hamiltonian path circuit DFS backtracking factorial NP hard visited',
  blocks:[{title:"Hamiltonian path/circuit - lecture pseudocode",src:PS_HAMILTON,pseudo:true,source:'lecture',pages:'week05 graph problems'}],
  note:"The trace follows the lecture's brute-force recursive DFS and resets <code>visited[v]</code> on a failed branch. Worst-case time is O(V!). Inputs are limited to seven vertices so the source-defined exhaustive search remains complete while the interactive trace stays usable.",
  fields:[{k:'nV',label:'nV',def:'5',type:'number',min:1,max:7,w:4},{k:'g',label:'edges',def:'0-1, 1-2, 2-3, 3-4, 4-0, 1-3'},{k:'mode',label:'find',def:'path',type:'select',options:['path','circuit']},{k:'rep',label:'view',def:'adjacency list',type:'select',options:['adjacency matrix','adjacency list','array of edges']}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),mode=inp.mode,rep=inp.rep,t=new Trace(),vis=new Array(G.nV).fill(false),path=[];const vb=t.alloc('create','visited[]','nV entries','lecture pseudocode');let steps=0,solution=null;
    const V=(cls={},ecls={})=>algoGraphView(G,rep,[{name:'visited[]',tag:'vis',row:vis.map(x=>x?'T':'F')},{name:`current path: ${path.length?path.join(' -> '):'empty'}`,tag:'path',row:path.length?path.slice():['—']}],cls,ecls,path[path.length-1]);
    function rec(v,left,start){steps++;vis[v]=true;path.push(v);t.v({v,numVerticesLeft:left-1}).step([0,LHA.mark],`Choose ${v}; ${left-1} vertices remain.`,V({[v]:'act'}));left--;if(left===0){const ok=mode==='path'||G.adj[v][start];t.step([0,LHA.base],mode==='path'?'All vertices are present: path found.':`All vertices are present; final edge ${v}–${start} exists: <b>${ok}</b>.`,V({[v]:ok?'hit':'bad'},ok&&mode==='circuit'?{[`${v}-${start}`]:'tree'}:{}));if(ok){solution=path.slice();return true;}}
      for(let w=0;w<G.nV;w++){if(G.adj[v][w]&&!vis[w]){t.v({w}).step([0,LHA.test],`Try unvisited neighbour ${w}.`,V({[v]:'act',[w]:'hit'},{[`${v}-${w}`]:'act'}));if(rec(w,left,start))return true;}}
      vis[v]=false;path.pop();t.step([0,LHA.undo],`Backtrack from ${v}; clear <code>visited[${v}]</code>.`,V({[v]:'bad'}));return false;}
    let found=false;if(mode==='circuit'){found=G.nV>=3&&rec(0,G.nV,0);}else for(let s=0;s<G.nV&&!found;s++){vis.fill(false);path.length=0;t.v({start:s}).step([0,LHA.outer],`Try starting vertex ${s}.`,V({[s]:'act'}));found=rec(s,G.nV,s);}
    const out=solution?(mode==='circuit'?solution.concat(solution[0]):solution):[];t.drop('v','w','numVerticesLeft','start').v({found,solution:out.join(' -> ')}).step([0,found?LHA.base:LHA.no],found?`${mode==='path'?'Hamiltonian path':'Hamiltonian circuit'}: <b>${out.join(' → ')}</b>.`:`No Hamiltonian ${mode} found after ${steps} recursive choices.`,V(Object.fromEntries((solution||[]).map(x=>[x,'hit']))));t.release(vb);t.step([0,found?LHA.base:LHA.no],'Release the Hamiltonian-search visited-array lifecycle.',V(Object.fromEntries((solution||[]).map(x=>[x,'hit']))));return t;
  }
});

const PS_EULER = `hasEulerianPath(G):
    numOddDegree = 0
    for each vertex v in G:
        if degree(G, v) is odd:
            numOddDegree = numOddDegree + 1
    return (numOddDegree = 0 or numOddDegree = 2) and eulerConnected(G)

eulerConnected(G):
    create visited array, initialised to false
    start DFS at the first vertex with non-zero degree
    for each vertex v in G:
        if degree(G, v) > 0 and visited[v] = false:
            return false
    return true

hasEulerianCircuit(G):
    for each vertex v in G:
        if degree(G, v) is odd:
            return false
    return eulerConnected(G)`;
const LEU=lines(PS_EULER,{path:'hasEulerianPath',odd:'numOddDegree = 0',loop:'for each vertex',test:'degree(G, v) is odd',inc:'numOddDegree = numOddDegree + 1',ret:'return (numOddDegree',conn:'eulerConnected(G):',visited:'create visited array',start:'start DFS',unseen:'degree(G, v) > 0 and visited[v] = false',circuit:'hasEulerianCircuit'});
mod({
  id:'euler',group:'Graph problems',name:"Eulerian path and circuit - degree and connectivity tests",keywords:'Eulerian path circuit degree odd connected nonzero edges',
  blocks:[{title:"Eulerian tests - lecture pseudocode",src:PS_EULER,pseudo:true,source:'lecture',pages:'week05 graph problems'}],
  note:'The theorem checks existence, not construction: an Eulerian path uses each edge exactly once; an Eulerian circuit also returns to its starting vertex. The lecture gives O(V + E) using adjacency lists.',
  fields:[{k:'nV',label:'nV',def:'5',type:'number',min:1,max:15,w:4},{k:'g',label:'edges',def:'0-1, 1-2, 2-3, 3-0, 3-4'},{k:'mode',label:'test',def:'path',type:'select',options:['path','circuit']},{k:'rep',label:'view',def:'adjacency list',type:'select',options:['adjacency matrix','adjacency list','array of edges']}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),mode=inp.mode,rep=inp.rep,t=new Trace(),deg=G.adj.map(r=>r.filter(Boolean).length),vis=new Array(G.nV).fill(false);let odd=0;const vb=t.alloc('create','visited[]','nV entries','lecture pseudocode');
    const V=(cls={})=>algoGraphView(G,rep,[{name:'degree[]',tag:'deg',row:deg.slice()},{name:'visited[] for eulerConnected',tag:'vis',row:vis.map(x=>x?'T':'F')}],cls,{},Number.isInteger(t.vars.v)?t.vars.v:undefined);
    for(let v=0;v<G.nV;v++){t.v({v,degree:deg[v],odd}).step([0,LEU.test],`Degree of ${v} is ${deg[v]}: ${deg[v]%2?'odd':'even'}.`,V({[v]:deg[v]%2?'bad':'hit'}));if(deg[v]%2)odd++;}
    const start=deg.findIndex(x=>x>0);if(start>=0){const S=[start];vis[start]=true;t.v({start}).step([0,LEU.start],`Start connectivity DFS at first non-zero-degree vertex ${start}.`,V({[start]:'act'}));while(S.length){const v=S.pop();for(let w=0;w<G.nV;w++)if(G.adj[v][w]&&!vis[w]){vis[w]=true;S.push(w);t.v({v,w}).step([0,LEU.start],`Reach non-zero-degree vertex ${w}.`,V({[v]:'act',[w]:'hit'}));}}}
    let connected=true;for(let v=0;v<G.nV;v++)if(deg[v]>0&&!vis[v])connected=false;const parity=mode==='path'?(odd===0||odd===2):odd===0,result=parity&&connected;
    t.drop('v','w','start').v({numOddDegree:odd,eulerConnected:connected,result}).step([0,mode==='path'?LEU.ret:LEU.circuit],`${mode==='path'?'Eulerian path':'Eulerian circuit'} exists: <b>${result}</b> (${odd} odd-degree vertices; non-zero-degree vertices connected: ${connected}).`,V());t.release(vb);t.step([0,mode==='path'?LEU.ret:LEU.circuit],'Release the Euler-connectivity visited-array lifecycle.',V());return t;
  }
});

const PS_CYCLE_D = `hasCycle(G):
    create visited array, initialised to false
    create onStack array, initialised to false
    for each vertex v in G:
        if visited[v] = false:
            if dfsHasCycle(G, v, visited, onStack):
                return true
    return false

dfsHasCycle(G, v, visited, onStack):
    visited[v] = true
    onStack[v] = true
    for each edge (v, w) in G:
        if onStack[w] = true:
            return true
        else if visited[w] = false:
            if dfsHasCycle(G, w, visited, onStack):
                return true
    onStack[v] = false
    return false`;
const LCD=lines(PS_CYCLE_D,{vis:'create visited array',stack:'create onStack',outer:'for each vertex',call:'if dfsHasCycle',mark:'visited[v] = true',on:'onStack[v] = true',edge:'for each edge',test:'if onStack[w] = true:',rec:'else if visited[w] = false:',off:'onStack[v] = false',no:'return false'});
mod({
  id:'cycled',group:'Directed graphs',name:"Directed cycle checking - onStack state",keywords:'digraph directed cycle DFS onStack call stack back edge',
  blocks:[{title:"Directed cycle algorithm - lecture pseudocode",src:PS_CYCLE_D,pseudo:true,source:'lecture',pages:'week07 digraph algorithms'}],
  note:'A visited vertex is not necessarily an ancestor in a digraph. The separate <code>onStack</code> array identifies exactly the active recursion path.',
  fields:[{k:'nV',label:'nV',def:'6',type:'number',min:1,max:12,w:4},{k:'g',label:'arcs',def:'0>1, 1>2, 2>3, 3>1, 3>4, 4>5'},{k:'rep',label:'view',def:'adjacency list',type:'select',options:['adjacency matrix','adjacency list','array of edges']}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,true);G.weighted=false;const rep=inp.rep,t=new Trace(),vis=new Array(G.nV).fill(false),on=new Array(G.nV).fill(false),stack=[];const vb=t.alloc('create','visited[]','nV entries','lecture pseudocode'),ob=t.alloc('create','onStack[]','nV entries','lecture pseudocode');let found=false,edge=null;
    const V=(cls={},ecls={})=>algoGraphView(G,rep,[{name:'visited[]',tag:'vis',row:vis.map(x=>x?'T':'F')},{name:'onStack[]',tag:'stk',row:on.map(x=>x?'T':'F')},{name:`call stack: ${stack.length?stack.join(' -> '):'empty'}`,tag:'v',row:stack.length?stack.slice():['—']}],cls,ecls,stack[stack.length-1]);
    function rec(v){vis[v]=true;on[v]=true;stack.push(v);t.v({v}).step([0,LCD.on],`Set <code>visited[${v}]</code> and <code>onStack[${v}]</code> true.`,V({[v]:'act'}));for(let w=0;w<G.nV;w++){if(!G.adj[v][w])continue;t.v({w}).step([0,LCD.test],`Arc ${v}→${w}; <code>onStack[${w}]</code> is <b>${on[w]}</b>.`,V({[v]:'act',[w]:on[w]?'bad':'act'},{[`${v}-${w}`]:'act'}));if(on[w]){edge=[v,w];return true;}if(!vis[w]&&rec(w))return true;}on[v]=false;stack.pop();t.step([0,LCD.off],`Unwind from ${v}; set <code>onStack[${v}] = false</code>.`,V({[v]:'hit'}));return false;}
    for(let v=0;v<G.nV&&!found;v++)if(!vis[v])found=rec(v);t.drop('v','w').v({cycle:found}).step([0,found?LCD.test:LCD.no],found?`Directed cycle detected by arc ${edge[0]}→${edge[1]} to an ancestor on the call stack.`:'No directed cycle exists.',V({},edge?{[`${edge[0]}-${edge[1]}`]:'act'}:{}));t.release(vb);t.release(ob);t.step([0,found?LCD.test:LCD.no],'Release both directed-cycle helper-array lifecycles.',V({},edge?{[`${edge[0]}-${edge[1]}`]:'act'}:{}));return t;
  }
});

const PS_WEB = `webCrawl(startingUrl, maxPagesToVisit):
    create visited set
    add startingUrl to visited set
    enqueue startingUrl into Q
    numPagesVisited = 0
    while Q is not empty and numPagesVisited < maxPagesToVisit:
        currPage = dequeue from Q
        visit currPage
        numPagesVisited = numPagesVisited + 1
        for each hyperlink on currPage:
            if hyperlink not in visited set:
                add hyperlink to visited set
                enqueue hyperlink into Q`;
const LWEB=lines(PS_WEB,{set:'create visited set',add:'add startingUrl',enq:'enqueue startingUrl',zero:'numPagesVisited = 0',loop:'while Q is not empty',deq:'currPage = dequeue',visit:'visit currPage',inc:'numPagesVisited = numPagesVisited + 1',links:'for each hyperlink',test:'if hyperlink not in visited set:',add2:'add hyperlink to visited set',enq2:'enqueue hyperlink'});
mod({
  id:'webcrawl',group:'Directed graphs',name:"Web crawling - BFS with a visited set",keywords:'web crawl URL hyperlink digraph visited set queue max pages',
  blocks:[{title:"webCrawl - lecture pseudocode",src:PS_WEB,pseudo:true,source:'lecture',pages:'week07 digraph algorithms'}],
  note:'The lecture uses a set instead of an array because a crawler does not know in advance how many webpages exist. Numeric page IDs are used only as labels in this bounded visual example.',
  fields:[{k:'nV',label:'known pages',def:'7',type:'number',min:1,max:15,w:4},{k:'g',label:'hyperlinks',def:'0>1, 0>2, 1>3, 1>4, 2>4, 3>5, 4>5, 5>6, 6>2'},{k:'start',label:'start page',def:'0',type:'number',w:4},{k:'max',label:'max visits',def:'6',type:'number',min:1,max:15,w:4}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,true),start=safeInt(inp.start,'start',0,G.nV-1),max=safeInt(inp.max,'max visits',1,15),t=new Trace(),seen=new Set([start]),Q=[start],order=[];const sb=t.alloc('create','visited set','discovered page IDs','lecture pseudocode'),qb=t.alloc('QueueNew','Q','queue struct','manual Queue ADT');
    const V=(cls={})=>algoGraphView(G,'adjacency list',[{name:`visited set = {${[...seen].join(', ')}}`,tag:'set',row:[...seen]},{name:`Q = ${Q.length?Q.join(' '):'empty'}`,tag:'Q',row:Q.length?Q.slice():['—']},{name:`visit order = ${order.join(' ')||'empty'}`,tag:'#',row:order.length?order.slice():['—']}],cls,{},Q[0]);
    t.v({startingUrl:start,maxPagesToVisit:max,numPagesVisited:0}).step([0,LWEB.enq],`Add page ${start} to the visited set and queue.`,V({[start]:'hit'}));while(Q.length&&order.length<max){const curr=Q.shift();order.push(curr);t.v({currPage:curr,numPagesVisited:order.length}).step([0,LWEB.visit],`Visit page ${curr}.`,V({[curr]:'hit'}));for(let w=0;w<G.nV;w++)if(G.adj[curr][w]){t.v({hyperlink:w}).step([0,LWEB.test],`Hyperlink ${curr}→${w}; new page: <b>${!seen.has(w)}</b>.`,V({[curr]:'act',[w]:seen.has(w)?'bad':'hit'}));if(!seen.has(w)){seen.add(w);Q.push(w);t.step([0,LWEB.enq2],`Add page ${w} to the set and enqueue it.`,V({[w]:'hit'}));}}}t.drop('currPage','hyperlink').v({numPagesVisited:order.length,stopped:Q.length?'limit reached':'queue empty'}).step([0,LWEB.loop],`Crawl stops because ${Q.length?'the visit limit was reached':'the queue is empty'}.`,V());t.free(qb);t.release(sb);t.step([0,LWEB.loop],'Release the queue and visited-set lifecycles after the bounded crawl.',V());return t;
  }
});

/* ---------- open-addressing hash tables and applications ---------- */
const LEC_LINEAR_GET = `struct hashTable {
    struct slot *slots;
    int numSlots;
    int numItems;
};

struct slot {
    int key;
    int value;
    bool empty;
};

int HashTableGet(HashTable ht, int key) {
    int i = hash(key, ht->numSlots);
    for (int j = 0; j < ht->numSlots; j++) {
        if (ht->slots[i].empty) break;
        if (ht->slots[i].key == key) {
            return ht->slots[i].value;
        }
        i = (i + 1) % ht->numSlots;
    }
    error;
}`;
const LLPG=lines(LEC_LINEAR_GET,{struct:'struct hashTable',slots:'struct slot',sig:'int HashTableGet',hash:'int i = hash',loop:'for (int j = 0',empty:'if (ht->slots[i].empty)',key:'if (ht->slots[i].key == key)',ret:'return ht->slots[i].value',inc:'i = (i + 1)',err:'error;'});
const LEC_DOUBLE = `struct hashTable {
    struct slot *slots;
    int numSlots;
    int numItems;
    int hash2Mod;
};

void HashTableInsert(HashTable ht, int key, int value) {
    if (/* load factor exceeds threshold */) {
        // resize
    }
    int i = hash(key, ht->numSlots);
    int inc = hash2(key, ht->hash2Mod);
    for (int j = 0; j < ht->numSlots; j++) {
        if (ht->slots[i].empty) {
            ht->slots[i].key = key;
            ht->slots[i].value = value;
            ht->slots[i].empty = false;
            ht->numItems++;
            return;
        }
        if (ht->slots[i].key == key) {
            ht->slots[i].value = value;
            return;
        }
        i = (i + inc) % ht->numSlots;
    }
}`;
const LDH=lines(LEC_DOUBLE,{sig:'void HashTableInsert',load:'if (/* load factor',hash:'int i = hash',inc:'int inc = hash2',loop:'for (int j = 0',empty:'if (ht->slots[i].empty)',setk:'ht->slots[i].key = key',setv:'ht->slots[i].value = value',false:'ht->slots[i].empty = false',num:'ht->numItems++',same:'if (ht->slots[i].key == key)',update:'ht->slots[i].value = value',step:'i = (i + inc)'});
const LEC_PROBE_DELETE = `Linear probing deletion:
Backshift
    remove and re-insert all items between the deleted item and the next empty slot
Tombstone
    replace the item with a deleted marker
    treat the marker as empty during insertion
    treat the marker as occupied during lookup

Double hashing uses a secondary increment and avoids primary clustering.`;
function modHash(k,n){return ((k%n)+n)%n;}
const LPD=lines(LEC_PROBE_DELETE,{head:'Linear probing deletion:',backshift:'Backshift',bsdo:'remove and re-insert all items',tombstone:'Tombstone',tmark:'replace the item with a deleted marker',tins:'treat the marker as empty during insertion',tlook:'treat the marker as occupied during lookup',cluster:'avoids primary clustering'});
/* ---------- CAP-157 / CAP-158: complete the backshift method and define the
   clustering measurements ----------
   The lecture states backshift in two lines and names primary clustering in
   one, but traces only tombstone deletion and measures nothing. This block
   completes both as declared supplemental pseudocode. It is not manual and
   not lecture source. */
const SUP_PROBE_SUPP = `Backshift deletion and cluster measurement - supplemental extension

probeStep(k, s):
    the number of increments from hash(k) along k's own stride that reach slot
    s. numSlots is prime and every stride is 1..numSlots-1, so each slot is
    reached exactly once and the step number is unique.

deleteBackshift(ht, key):
    i = the slot holding key, found along key's own probe sequence
    if key is absent:
        return                                 # table unchanged
    empty slot i                               # no deleted marker is written
    hole = i
    j = i
    repeat numSlots - 1 times:
        j = (j + 1) mod numSlots               # walk forwards through the cluster
        if slot j is empty:
            stop                               # the cluster ends at a real hole
        k = the key stored in slot j
        if probeStep(k, hole) < probeStep(k, j):
            move k from slot j into slot hole  # its probe path crossed the hole
            empty slot j
            hole = j

For linear probing the stride is 1, so probeStep(k, s) is just the forward
distance from hash(k) to s, and the test reduces to "the hole lies between
this key's home slot and the slot it now occupies". The cluster scan then
repairs every probe path the deletion could have broken, which is why
backshift leaves no marker behind at all.

With double hashing a probe path jumps across the table, so a key whose path
crosses the emptied slot need not sit in the cluster behind it. The
implementation therefore finishes with a verification sweep: every live key is
looked up, and any key that is no longer reachable is lifted out and
re-inserted along its own probe sequence. For linear probing the sweep never
finds one. For double hashing it is the extra work that is exactly why the
lecture pairs backshift with linear probing and keeps the tombstone as the
general method.

Cost
    backshift   O(cluster length) at delete time, and keys move, so any index
                stored into the table is invalidated. No later lookup pays.
    tombstone   O(probe length) at delete time and nothing moves, but every
                later lookup must probe through each marker, and the markers
                accumulate until the table is rebuilt.

Cluster measurement
    cluster       a maximal run of consecutive occupied slots, wrapping round
                  the end of the table. A deleted marker counts as occupied,
                  because a lookup must still probe through it.
    longest run   the number of slots in the largest such run
    mean probes   the total number of slots probed to look up every live key
                  once, divided by the number of live keys

Linear probing puts a colliding key at the end of whichever run it lands in,
so neighbouring runs merge and the longest run grows. That growth is primary
clustering, and it is what makes the mean probe length rise faster than the
load factor alone would suggest.
Double hashing gives each key its own stride, so two keys with the same home
slot separate after one probe instead of becoming adjacent, and a single run
does not grow. The stride is the reason, not luck.`;
const LBS=lines(SUP_PROBE_SUPP,{title:'Backshift deletion and cluster measurement',pstep:'probeStep(k, s):',unique:'reached exactly once and the step number is unique',sig:'deleteBackshift(ht, key):',find:'i = the slot holding key',absent:'if key is absent:',empty:'empty slot i ',hole:'    hole = i',repeat:'repeat numSlots - 1 times:',walk:'j = (j + 1) mod numSlots',stop:'if slot j is empty:',read:'k = the key stored in slot j',test:'if probeStep(k, hole) < probeStep(k, j):',move:'move k from slot j into slot hole',clear:'empty slot j',newhole:'hole = j',linear:'For linear probing the stride is 1',sweep:'With double hashing a probe path jumps',cost:'backshift   O(cluster length)',tombcost:'tombstone   O(probe length)',cdef:'cluster       a maximal run',crun:'longest run   the number of slots',cmean:'mean probes   the total number of slots',cwhy:'Linear probing puts a colliding key',cdouble:'Double hashing gives each key its own stride'});