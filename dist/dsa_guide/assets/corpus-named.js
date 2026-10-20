mod({id:'namedalgos',group:'Course map',name:'Named-only and contextual syllabus items',keywords:'Shell counting Kosaraju Tarjan Floyd Warshall Bellman Ford Boruvka Karger longest path clique colouring graph isomorphism Python dictionaries appendix',blocks:[{title:"Named/contextual items - source boundary",src:NAMED_ONLY,source:'coverage',pseudo:true,pages:'supplied lectures'}],note:'This module makes the omissions explicit rather than silently fabricating algorithms. The listed names remain part of the coverage index.',fields:[],run(){const t=new Trace();t.step([0,1],'These items are present by name or as context, but the supplied files do not contain enough source detail for an exact interactive implementation.',refView({title:'No invented code',html:'<p>The tracer intentionally stops at the source boundary. Add a future course source containing exact pseudocode/C before promoting any of these names to an executable module.</p>'},
      /* CUR-MOD-05: the coverage index names "Union-find optimisation" and
         routes it HERE, but this destination previously did not mention
         union-find at all, so the promise had no content behind it. The gap
         is closed with an accurate conceptual explanation at the granularity
         the coverage row claims (contextual, not an executable topic), plus a
         working link to the lesson it optimises. No course C is invented and
         no official implementation is implied: the supplied lecture material
         names the optimisation without giving its code. */
      {title:'Union-find (disjoint-set) - what it optimises',html:'<p>Kruskal\'s algorithm accepts an edge only when its two endpoints are not already connected in the partial MST. The supplied pseudocode expresses that as <i>"there is no path between v and w in mst"</i>, and the <a href="graph-algorithms.html#kruskal">Kruskal lesson</a> traces exactly that test: it searches the partial tree for a path on every candidate edge.</p><p>A <b>union-find</b> (disjoint-set) structure replaces that search with two near-constant-time operations. Each vertex starts in its own set. <code>find(v)</code> returns a representative for v\'s set, so two endpoints are already connected precisely when <code>find(v) == find(w)</code>; accepting an edge then calls <code>union(v, w)</code> to merge the two sets. Nothing about which edges Kruskal selects changes - only the cost of the connectivity test.</p><p>Two standard refinements make it fast: <b>union by size or rank</b> attaches the smaller tree under the larger, and <b>path compression</b> re-points the nodes visited by a <code>find</code> straight at the representative. Together they give an amortised cost per operation of O(&alpha;(V)), where &alpha; is the inverse Ackermann function and is at most 4 for any realistic V - effectively constant. That turns Kruskal\'s connectivity testing from a per-edge graph search into E operations that are each almost constant, leaving the edge sort as the dominant O(E log E) cost.</p><p><b>Source status:</b> the supplied lecture material names this optimisation as context. It does not supply pseudocode or C for it, so no implementation is traced here and none is attributed to the course. This explanation is written by the tracer.</p>'},refTable('Source status',['Item','Status'],[['Union-find (disjoint-set) optimisation','contextual - explained below, no course C supplied'],['Shell sort','named only'],['Key-indexed counting sort','named only'],['Kosaraju / Tarjan','named only'],['Floyd-Warshall / Bellman-Ford','curiosity only'],['Boruvka / Karger-Klein-Tarjan','other algorithms'],['Longest path / largest clique / three-colourability','tractability context'],['Graph isomorphism','bonus problem'],['Python dictionaries','bonus hash-table syntax']])));return t;}});

/* Every original v2.1 block is an exact 26T2 manual block unless an extension block explicitly declares another source. */
MODULES.forEach(m=>(m.blocks||[]).forEach(b=>{if(!b.source)b.source='manual';}));

/* ---------- re-home and enrich existing v2.1 modules ---------- */
function moduleById(id){return MODULES.find(m=>m.id===id);}
[['graphadt','Graph representations'],['bfs','Graph traversal'],['dfs','Graph traversal'],['warshall','Directed graphs'],['dijkstra','Shortest paths & MSTs'],['kruskal','Shortest paths & MSTs'],['prim','Shortest paths & MSTs'],['hash','Hash tables'],['pq','Priority queues & heaps']].forEach(([id,g])=>{const m=moduleById(id);if(m)m.group=g;});
['bfs','dfs','dijkstra','kruskal','prim'].forEach(id=>{
  const m=moduleById(id);if(!m)return;
  m.fields.push({k:'rep',label:'view',def:id==='dijkstra'?'array of edges':'adjacency list',type:'select',options:['adjacency matrix','adjacency list','array of edges']});
  const original=m.run.bind(m);m.run=inp=>decorateGraphTrace(original(inp),inp.rep||'adjacency matrix');
  m.keywords=(m.keywords||'')+' adjacency matrix list edge array representation';
});


/* colour key, tailored to whatever is on screen */
const LEGENDS = {
  array:[['cmp','being compared'],['mv','being written or moved'],['pivot','pivot / held aside'],['done','final position'],['hole','vacated slot']],
  heap:[['cmp','compared'],['mv','moving'],['hole','out of range']],
  linked:[['new','node in play'],['dead','freed — do not dereference']],
  tree:[['act','on the current path'],['hit','target / new subtree root'],['bad','failing the test']],
  trie:[['act','on the current path'],['hit','matched or created'],['bad','dead end'],['fin','double ring = finish flag set']],
  hash:[['new','node in play'],['dead','freed']],
  graph:[['act','being examined'],['hit','settled / reached'],['bad','skipped']]
};
const LEGEND_NOTES={
  multi:'Composite view — use the highlight meanings shown by each component visualisation.',
  reference:'Reference view — read the labelled sections and tables; no transient state highlight is required.',
  callstack:'Call stack — the most recently added frame is the active recursive call.',
  adjlist:'Adjacency list — each row is a vertex head followed through ->next links.',
  edgearray:'Edge array — live records occupy indices 0 through nE - 1.',
  matrix2d:'Matrix — highlighted cells are the entries currently examined or changed.',
  hashopen:'Open-addressed table — highlighted slots are being probed or updated.',
  intheap:'Heap view — array indices and the corresponding complete binary tree are shown together.'
};
function legendFor(kind){
  const panel=createElement('details','legend-panel');
  panel.open=playerState.legendOpen!==false;
  panel.addEventListener('toggle',()=>{playerState.legendOpen=panel.open;});
  panel.appendChild(createElement('summary','legend-summary',`Legend · ${kind||'view'}`));
  const wrap=createElement('div','legend');
  const entries=LEGENDS[kind]||[];
  entries.forEach(([c,txt])=>{
    const item=createElement('span','lgi');
    item.appendChild(createElement('i','sw '+c));
    item.appendChild(createElement('span',null,txt));
    wrap.appendChild(item);
  });
  if(!entries.length)wrap.appendChild(createElement('span','legend-note',LEGEND_NOTES[kind]||`No additional legend is defined for the “${kind||'unknown'}” view.`));
  panel.appendChild(wrap);
  return panel;
}
