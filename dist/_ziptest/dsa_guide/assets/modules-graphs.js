/* ============================================================
   GRAPHS/* ============================================================
   GRAPHS
   ============================================================ */
const SRC_GADJ = `typedef struct graph *Graph;
typedef int Vertex;

Graph GraphNew(int nV);
void GraphFree(Graph g);
int GraphNumVertices(Graph g);
int GraphNumEdges(Graph g);
bool GraphIsAdjacent(Graph g, Vertex v, Vertex w);
void GraphInsertEdge(Graph g, Vertex v, Vertex w);
void GraphRemoveEdge(Graph g, Vertex v, Vertex w);
void GraphShow(Graph g);

struct graph {
    int nV;
    int nE;
    bool **edges;
};

static bool validVertex(Graph g, Vertex v);

Graph GraphNew(int nV) {
    Graph g = malloc(sizeof(struct graph));
    if (g == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    g->nV = nV;
    g->nE = 0;

    g->edges = malloc(nV * sizeof(bool *));
    for (int i = 0; i < g->nV; i++) {
        g->edges[i] = calloc(nV, sizeof(bool));
    }

    return g;
}

void GraphFree(Graph g) {
    for (int i = 0; i < g->nV; i++) {
        free(g->edges[i]);
    }
    free(g->edges);
    free(g);
}

int GraphNumVertices(Graph g) {
    return g->nV;
}

int GraphNumEdges(Graph g) {
    return g->nE;
}

bool GraphIsAdjacent(Graph g, Vertex v, Vertex w) {
    assert(validVertex(g, v));
    assert(validVertex(g, w));

    return g->edges[v][w];
}

void GraphInsertEdge(Graph g, Vertex v, Vertex w) {
    assert(validVertex(g, v));
    assert(validVertex(g, w));

    if (g->edges[v][w]) {
        return;
    }

    g->edges[v][w] = true;
    g->edges[w][v] = true;
    g->nE++;
}

void GraphRemoveEdge(Graph g, Vertex v, Vertex w) {
    assert(validVertex(g, v));
    assert(validVertex(g, w));

    if (!g->edges[v][w]) {
        return;
    }

    g->edges[v][w] = false;
    g->edges[w][v] = false;
    g->nE--;
}

void GraphShow(Graph g) {
    printf("Number of vertices: %d\\n", g->nV);
    printf("Number of edges: %d\\n", g->nE);
    printf("Edges:\\n");
    for (int i = 0; i < g->nV; i++) {
        printf("%2d:", i);
        for (int j = 0; j < g->nV; j++) {
            if (g->edges[i][j]) {
                printf(" %d", j);
            }
        }
        printf("\\n");
    }
    printf("\\n");
}

static bool validVertex(Graph g, Vertex v) {
    return (v >= 0 && v < g->nV);
}`;
const LGA = lines(SRC_GADJ,{
  gmalloc:'Graph g = malloc(sizeof(struct graph));',gnv:'g->nV = nV;',gne:'g->nE = 0;',rows:'g->edges = malloc(nV * sizeof(bool *));',rowloop:'for (int i = 0; i < g->nV; i++)',cols:'g->edges[i] = calloc(nV, sizeof(bool));',gret:'return g;',
  freesig:'void GraphFree',freerow:'free(g->edges[i]);',freeedges:'free(g->edges);',freeg:'free(g);',numv:'return g->nV;',nume:'return g->nE;',adj:'return g->edges[v][w];',
  dup:'if (g->edges[v][w]) {',set1:'g->edges[v][w] = true;',set2:'g->edges[w][v] = true;',ne:'g->nE++;',
  missing:'if (!g->edges[v][w]) {',clear1:'g->edges[v][w] = false;',clear2:'g->edges[w][v] = false;',nedec:'g->nE--;',
  show:'void GraphShow',showouter:'for (int i = 0; i < g->nV; i++)',showinner:'for (int j = 0; j < g->nV; j++)',showtest:'if (g->edges[i][j])',valid:'return (v >= 0 && v < g->nV);'
});

const PS_BFS = `bfs(G, src):
    Input: graph G, starting vertex src

    create predecessor array, initialised to -1
    create queue Q

    predecessor[src] = src
    enqueue src into Q

    while Q is not empty:
        v = dequeue from Q
        for each neighbour w of v in G where predecessor[w] = -1:
            predecessor[w] = v
            enqueue w into Q`;
const LBFS = lines(PS_BFS,{pred:'create predecessor array',queue:'create queue Q',seed:'predecessor[src] = src',enq1:'enqueue src into Q',loop:'while Q is not empty:',deq:'v = dequeue from Q',nbr:'for each neighbour w of v in G',setp:'predecessor[w] = v',enq2:'enqueue w into Q'});

const PS_DFS = `dfs(G, src):
    Input: graph G, starting vertex src

    create visited array, initialised to false
    dfsRec(G, src, visited)

dfsRec(G, v, visited):
    Input: graph G, vertex v, visited array

    visited[v] = true
    for each neighbour w of v in G:
        if visited[w] = false:
            dfsRec(G, w, visited)`;
const LDFS = lines(PS_DFS,{vis:'create visited array',call:'dfsRec(G, src, visited)',mark:'visited[v] = true',nbr:'for each neighbour w of v in G:',check:'if visited[w] = false:',rec:'dfsRec(G, w, visited)'});

const PS_WAR = `warshall(A):
    Input:  n x n adjacency matrix A
    Output: n x n transitive closure matrix

    create tc matrix which is a copy of A

    for each vertex k in G:   // from 0 to n - 1
        for each vertex s in G:
            for each vertex t in G:
                if tc[s][k] and tc[k][t]:
                    tc[s][t] = true

    return tc`;
const LWAR = lines(PS_WAR,{copy:'create tc matrix which is a copy of A',k:'for each vertex k in G:',s:'for each vertex s in G:',t:'for each vertex t in G:',test:'if tc[s][k] and tc[k][t]:',set:'tc[s][t] = true',ret:'return tc'});

const PS_DIJ = `dijkstra(G, src):
    Input: graph G, source vertex src

    create dist array, initialised to inf
    create pred array, initialised to -1
    create vSet containing all vertices of G
    dist[src] = 0

    while vSet is not empty:
        find vertex v in vSet such that dist[v] is minimal
        remove v from vSet

        for each edge (v, w, weight) in G:
            if dist[v] + weight < dist[w]:
                dist[w] = dist[v] + weight
                pred[w] = v`;
const LDIJ = lines(PS_DIJ,{dist:'create dist array, initialised to inf',pred:'create pred array, initialised to -1',vset:'create vSet containing all vertices',zero:'dist[src] = 0',loop:'while vSet is not empty:',pick:'find vertex v in vSet such that dist[v] is minimal',remove:'remove v from vSet',edge:'for each edge (v, w, weight) in G:',test:'if dist[v] + weight < dist[w]:',relax:'dist[w] = dist[v] + weight',setp:'pred[w] = v'});

const PS_KRUS = `kruskalMst(G):
    Input:  graph G with V vertices
    Output: minimum spanning tree of G

    mst = empty graph with V vertices
    sortedEdges = sort edges of G by weight

    for each edge (v, w, weight) in sortedEdges:
        if there is no path between v and w in mst:
            add edge (v, w, weight) to mst
            if mst has V - 1 edges:
                return mst

    no mst`;
const LKR = lines(PS_KRUS,{mst:'mst = empty graph with V vertices',sort:'sortedEdges = sort edges of G by weight',loop:'for each edge (v, w, weight) in sortedEdges:',test:'if there is no path between v and w in mst:',add:'add edge (v, w, weight) to mst',count:'if mst has V - 1 edges:',ret:'return mst',fail:'no mst'});

const PS_PRIM = `primMst(G):
    Input:  graph G with V vertices
    Output: minimum spanning tree of G

    mst = empty graph with V vertices
    usedV = {0}
    unusedE = edges of G

    while |usedV| < V :
        find cheapest edge e (s, t, weight) in unusedE such that
            s in usedV and t not in usedV
        add e to mst
        add t to usedV
        remove e from unusedE

    return mst`;
const LPR = lines(PS_PRIM,{mst:'mst = empty graph with V vertices',used:'usedV = {0}',unused:'unusedE = edges of G',loop:'while |usedV| < V :',find:'find cheapest edge e (s, t, weight) in unusedE such that',add:'add e to mst',addv:'add t to usedV',rem:'remove e from unusedE',ret:'return mst'});

/* graph parsing for the tracer; vertex count is explicit so isolated vertices are preserved */
/* Shared ceiling for any graph entry path that does not declare its own.
   Sized from measurement: warshall at nV=12 is the most expensive accepted
   representation case on this corpus (1,797 frames, 9.6 ms). */
const TRACER_GRAPH_NV_MAX=15;
function parseGraph(s,nV,directed,fieldKey='g',nVMax){
  /* AUD-03: nV is parsed with the shared complete-integer grammar so that
     "1e3", "0x10" and "1.5" can no longer reach the matrix allocation below.
     The caller may pass an explicit ceiling; otherwise the shared default
     applies. Previously this accepted any Number()-coercible value with no
     upper bound, so nV=1000 allocated two 1000x1000 matrices. */
  const n=parseIntScalar(nV,{fieldKey:'nV',fieldLabel:'nV',min:1,
    max:nVMax===undefined?TRACER_GRAPH_NV_MAX:nVMax});
  const edges=[];
  (s||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(tok=>{
    const m=tok.match(/^(\d+)\s*(?:-|>)\s*(\d+)(?:\s*[:=]\s*(-?(?:\d+(?:\.\d+)?|\.\d+)))?$/);
    if(!m) throw new InputValidationError(`invalid edge: ${tok}`,fieldKey);
    const v=+m[1],w=+m[2],wt=m[3]!==undefined?+m[3]:1;
    if(v<0||v>=n||w<0||w>=n) throw new InputValidationError(`edge ${v}-${w} uses a vertex outside 0..${n-1}`,fieldKey);
    if(v===w) throw new InputValidationError(`self loop ${v}-${w} is not supported by this course graph model`,fieldKey);
    const duplicate=edges.some(e=>directed ? (e.v===v&&e.w===w) : ((e.v===v&&e.w===w)||(e.v===w&&e.w===v)));
    const shownEdge=directed?`${v}->${w}`:`${v}-${w}`;
    if(duplicate) throw new InputValidationError(`duplicate/multiple edge ${shownEdge} is not supported by this course graph model`,fieldKey);
    edges.push({v,w,wt});
  });
  const adj=Array.from({length:n},()=>new Array(n).fill(false));
  const wt=Array.from({length:n},()=>new Array(n).fill(0));
  edges.forEach(e=>{adj[e.v][e.w]=true;wt[e.v][e.w]=e.wt;if(!directed){adj[e.w][e.v]=true;wt[e.w][e.v]=e.wt;}});
  return {nV:n,adj,wt,edges,directed:!!directed};
}
function graphView(G,extra){
  extra=extra||{};
  return {kind:'graph',nV:G.nV,edges:G.adj,directed:!!G.directed,w:extra.weighted?G.wt:null,cls:extra.cls||{},ecls:extra.ecls||{},tables:extra.tables||[],matrix:extra.matrix||null,adjChg:extra.adjChg||null,adjName:extra.adjName||'g->edges — adjacency matrix',showAdj:extra.showAdj!==false};
}
function abstractList(t,label,size){
  /* M-02: these are pseudocode values, not C allocations. They are tagged so
     the ledger can show them as conceptual and never imply a missing free().
     NEW-01: the tag is now passed to alloc() as an option. The previous code
     assigned to alloc()'s return value, which is a numeric block id, so the
     guard `typeof block==='object'` was always false and the flag was never
     actually set on any block. */
  return t.alloc('create',label,size,'manual pseudocode',{conceptual:true});
}

mod({
  id:'graphadt',group:'Graphs',name:"Graph ADT - adjacency matrix lifecycle",
  blocks:[{title:'Graph interface and adjacency-matrix implementation',src:SRC_GADJ,pages:'pp. 16-19'}],
  fields:[{k:'nV',label:'nV',def:'5',w:4},{k:'ops',label:'operations',def:'insert 0 1, insert 0 2, insert 1 3, adjacent 0 2, vertices, edges, show, remove 0 1, free'}],
  run(inp){
    const nV=Number(inp.nV),t=new Trace(),ops=(inp.ops||'').split(/[,;]+/).map(s=>s.trim()).filter(Boolean);
    if(!Number.isInteger(nV)||nV<1) throw new InputValidationError('nV must be a positive integer','nV');
    const G={nV,nE:0,adj:Array.from({length:nV},()=>new Array(nV).fill(false)),wt:Array.from({length:nV},()=>new Array(nV).fill(0))};
    let alive=true;
    const gBlk=t.alloc('malloc','Graph g','sizeof(struct graph)');
    const edgePtrBlk=t.alloc('malloc','g->edges','nV × sizeof(bool *)');
    const rowBlks=[];
    const V=(chg)=>graphView(G,{adjChg:chg,tables:[{name:`g->nV = ${G.nV}; g->nE = ${G.nE}`,tag:'field',head:'',row:['nV','nE']} ]});
    t.v({nV,nE:0}).step([0,LGA.gmalloc],'<code>GraphNew</code>: allocate <code>struct graph</code>.',V());
    t.step([0,LGA.gnv],`<code>g->nV = ${nV}</code>.`,V());
    t.step([0,LGA.gne],'<code>g->nE = 0</code>.',V());
    t.step([0,LGA.rows],'<code>g->edges</code> is allocated as an array of row pointers.',V());
    for(let i=0;i<nV;i++){ rowBlks.push(t.alloc('calloc',`g->edges[${i}]`,'nV × sizeof(bool)')); t.v({i}).step([0,LGA.cols],`<code>g->edges[${i}] = calloc(...)</code>; every cell starts false.`,V()); }
    t.drop('i').step([0,LGA.gret],'<code>GraphNew</code> returns <code>g</code>.',V());
    const valid=v=>Number.isInteger(v)&&v>=0&&v<nV;
    for(const raw of ops){
      if(!alive){t.step([0,LGA.freeg],'Trace stopped: graph was already freed.',V());break;}
      const p=raw.split(/\s+/),cmd=p[0].toLowerCase(),v=Number(p[1]),w=Number(p[2]);
      if(['insert','remove','adjacent'].includes(cmd)&&(!valid(v)||!valid(w))) throw new InputValidationError(`vertices must be in 0..${nV-1}`,'ops');
      if(['insert','remove','adjacent'].includes(cmd)&&v===w) throw new InputValidationError(`self loop ${v}-${w} is not supported by this course graph model`,'ops');
      if(cmd==='insert'){
        t.v({v,w}).step([0,LGA.dup],`<code>g->edges[${v}][${w}]</code> is <b>${G.adj[v][w]}</b>.`,V());
        if(G.adj[v][w]){t.step([0,LGA.dup],'<code>return</code>; duplicate edge is not counted twice.',V());continue;}
        G.adj[v][w]=true;t.step([0,LGA.set1],`<code>g->edges[${v}][${w}] = true</code>.`,V(`${v}-${w}`));
        G.adj[w][v]=true;t.step([0,LGA.set2],`<code>g->edges[${w}][${v}] = true</code>.`,V(`${w}-${v}`));
        G.nE++;t.v({nE:G.nE}).step([0,LGA.ne],'<code>g->nE++</code>.',V());
      } else if(cmd==='remove'){
        t.v({v,w}).step([0,LGA.missing],`<code>!g->edges[${v}][${w}]</code> is <b>${!G.adj[v][w]}</b>.`,V());
        if(!G.adj[v][w]){t.step([0,LGA.missing],'<code>return</code>; no edge is removed.',V());continue;}
        G.adj[v][w]=false;t.step([0,LGA.clear1],`<code>g->edges[${v}][${w}] = false</code>.`,V(`${v}-${w}`));
        G.adj[w][v]=false;t.step([0,LGA.clear2],`<code>g->edges[${w}][${v}] = false</code>.`,V(`${w}-${v}`));
        G.nE--;t.v({nE:G.nE}).step([0,LGA.nedec],'<code>g->nE--</code>.',V());
      } else if(cmd==='adjacent'){
        t.v({v,w,return:String(G.adj[v][w])}).step([0,LGA.adj],`Return <code>g->edges[${v}][${w}]</code> (${G.adj[v][w]}).`,V(`${v}-${w}`));t.drop('return');
      } else if(cmd==='vertices'){
        t.v({return:G.nV}).step([0,LGA.numv],`Return <code>g->nV = ${G.nV}</code>.`,V());t.drop('return');
      } else if(cmd==='edges'){
        t.v({return:G.nE}).step([0,LGA.nume],`Return <code>g->nE = ${G.nE}</code>.`,V());t.drop('return');
      } else if(cmd==='show'){
        for(let i=0;i<nV;i++){const ns=[];for(let j=0;j<nV;j++)if(G.adj[i][j])ns.push(j);t.v({i}).step([0,LGA.showouter],`GraphShow row ${i}: <code>${String(i).padStart(2,' ')}:${ns.length?' '+ns.join(' '):''}</code>.`,V());}
        t.drop('i');
      } else if(cmd==='free'){
        for(let i=0;i<nV;i++){t.free(rowBlks[i]);t.v({i}).step([0,LGA.freerow],`<code>free(g->edges[${i}])</code>.`,V());}
        t.free(edgePtrBlk);t.step([0,LGA.freeedges],'<code>free(g->edges)</code>.',V());
        t.free(gBlk);alive=false;t.step([0,LGA.freeg],'<code>free(g)</code>. All graph allocations are released.',V());
      } else throw new InputValidationError('graph operations are: insert v w, remove v w, adjacent v w, vertices, edges, show, free','ops');
    }
    return t;
  }
});

mod({
  id:'bfs',group:'Graphs',name:'Breadth-first search',
  blocks:[{title:"bfs - pseudocode",src:PS_BFS,pseudo:true,pages:'p. 19'},{title:'Graph adjacency-matrix implementation',src:SRC_GADJ,pages:'pp. 16-19'},{title:'Queue implementation used by Q',src:SRC_QUEUE,pages:'pp. 8-11'}],
  fields:[{k:'nV',label:'nV',def:'6',w:4},{k:'g',label:'edges',def:'0-1, 0-2, 1-3, 2-4, 3-5, 4-5, 1-4'},{k:'src',label:'src',def:'0',w:4}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),t=new Trace();
    const src=parseIntScalar(inp.src,{fieldKey:'src',fieldLabel:'src',min:0,max:G.nV-1});
    const predecessor=new Array(G.nV).fill(-1),Q=[];let qUid=0;
    const predBlk=abstractList(t,'predecessor[]','nV entries (pseudocode representation)');
    const qBlk=t.alloc('malloc','Queue Q','sizeof(struct queue)');
    const V=(cls,ecls,chg)=>graphView(G,{cls,ecls,tables:[{name:'predecessor[]',tag:'pred',row:predecessor.slice(),chg:chg||[]},{name:`Q front -> back: ${Q.length?Q.map(x=>x.v).join(' '):'empty'}`,tag:'Q',head:'pos',row:Q.length?Q.map(x=>x.v):['—']}]});
    t.step([0,LBFS.pred],'<code>predecessor</code> is created and every entry is initialised to <code>-1</code>.',V());
    t.step([0,LBFS.queue],'<code>Q</code> is created using the manual Queue ADT.',V());
    predecessor[src]=src;t.v({src}).step([0,LBFS.seed],`<code>predecessor[${src}] = ${src}</code>.`,V({[src]:'hit'},{},[src]));
    const seedBlk=t.alloc('malloc',`Q node(${src})`,'sizeof(*n)');Q.push({v:src,blk:seedBlk,id:++qUid});
    t.step([0,LBFS.enq1],`Enqueue ${src} into <code>Q</code>.`,V({[src]:'hit'}));
    while(Q.length){
      t.step([0,LBFS.loop],'<code>Q</code> is not empty.',V({[Q[0].v]:'act'}));
      const qn=Q.shift(),v=qn.v;t.free(qn.blk);t.v({v}).step([0,LBFS.deq],`Dequeue ${v} from <code>Q</code>.`,V({[v]:'act'}));
      for(let w=0;w<G.nV;w++){
        if(!G.adj[v][w]||predecessor[w]!==-1)continue;
        t.v({w}).step([0,LBFS.nbr],`Vertex ${w} is a neighbour of ${v} and <code>predecessor[${w}] == -1</code>.`,V({[v]:'act',[w]:'hit'},{[`${v}-${w}`]:'act'}));
        predecessor[w]=v;t.step([0,LBFS.setp],`<code>predecessor[${w}] = ${v}</code>.`,V({[w]:'hit'},{[`${v}-${w}`]:'tree'},[w]));
        const blk=t.alloc('malloc',`Q node(${w})`,'sizeof(*n)');Q.push({v:w,blk,id:++qUid});
        t.step([0,LBFS.enq2],`Enqueue ${w} into <code>Q</code>.`,V({[w]:'hit'}));
      }
      t.drop('w');
    }
    t.drop('v').step([0,LBFS.loop],'<code>Q</code> is empty; traversal ends.',V(Object.fromEntries(predecessor.map((p,i)=>[i,p===-1?'bad':'hit']))));
    /* AUD-05: this step describes QueueFree(Q), so it must highlight the Queue
       implementation (block 2), not the Graph implementation (block 1). The
       block index is now derived from the source that LQU was built over, so
       reordering `blocks` cannot reintroduce the mismatch. */
    t.free(qBlk);t.step(srcLine(this.blocks,LQU,'freestruct'),'<code>QueueFree(Q)</code> releases the now-empty queue struct.',V());
    t.release(predBlk);t.step([0,LBFS.pred],'The trace no longer needs <code>predecessor[]</code>. Its concrete C allocation and deallocation are not supplied in the manual.',V());
    return t;
  }
});

mod({
  id:'dfs',group:'Graphs',name:'Depth-first search',
  blocks:[{title:"dfs / dfsRec - pseudocode",src:PS_DFS,pseudo:true,pages:'pp. 19-20'},{title:'Graph adjacency-matrix implementation',src:SRC_GADJ,pages:'pp. 16-19'}],
  fields:[{k:'nV',label:'nV',def:'6',w:4},{k:'g',label:'edges',def:'0-1, 0-2, 1-3, 2-4, 3-5, 4-5, 1-4'},{k:'src',label:'src',def:'0',w:4}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),t=new Trace();
    const src=parseIntScalar(inp.src,{fieldKey:'src',fieldLabel:'src',min:0,max:G.nV-1});
    const visited=new Array(G.nV).fill(false),stack=[],treeEdges={};const visBlk=abstractList(t,'visited[]','nV entries (pseudocode representation)');
    const V=(cls,ecls)=>graphView(G,{cls,ecls,tables:[{name:'visited[]',tag:'vis',row:visited.map(x=>x?'T':'F')},{name:`dfsRec call stack: ${stack.length?stack.join(' -> '):'empty'}`,tag:'v',head:'depth',row:stack.length?stack.slice():['—']}]});
    t.step([0,LDFS.vis],'<code>visited</code> is created and initialised to <code>false</code>.',V());
    function rec(v){
      stack.push(v);t.v({v}).step([0,LDFS.call],`<code>dfsRec(G, ${v}, visited)</code>.`,V({[v]:'act'},treeEdges));
      visited[v]=true;t.step([0,LDFS.mark],`<code>visited[${v}] = true</code>.`,V({[v]:'hit'},treeEdges));
      for(let w=0;w<G.nV;w++){
        if(!G.adj[v][w])continue;
        t.v({w}).step([0,LDFS.nbr],`${w} is a neighbour of ${v}.`,V({[v]:'act',[w]:'act'},Object.assign({},treeEdges,{[`${v}-${w}`]:'act'})));
        t.step([0,LDFS.check],`<code>visited[${w}] = false</code> is <b>${!visited[w]}</b>.`,V({[w]:visited[w]?'bad':'hit'},treeEdges));
        if(!visited[w]){treeEdges[`${v}-${w}`]='tree';t.step([0,LDFS.rec],`<code>dfsRec(G, ${w}, visited)</code>.`,V({[w]:'act'},treeEdges));rec(w);}
      }
      stack.pop();t.drop('w').step([0,LDFS.nbr],`Return from <code>dfsRec(G, ${v}, visited)</code>.`,V({[v]:'hit'},treeEdges));
    }
    rec(src);t.drop('v').step([0,LDFS.mark],'DFS trace complete.',V(Object.fromEntries(visited.map((x,i)=>[i,x?'hit':'bad'])),treeEdges));
    t.release(visBlk);t.step([0,LDFS.vis],'The trace no longer needs <code>visited[]</code>. The manual does not supply its concrete C allocation/deallocation.',V());
    return t;
  }
});

mod({
  id:'warshall',group:'Graphs',name:"Warshall's algorithm",
  blocks:[{title:"warshall - pseudocode",src:PS_WAR,pseudo:true,pages:'p. 20'},{title:'Graph adjacency-matrix implementation',src:SRC_GADJ,pages:'pp. 16-19'}],
  fields:[{k:'nV',label:'n',def:'4',w:4},{k:'g',label:'directed arcs v-w',def:'0-1, 1-2, 2-3'}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,true),n=G.nV,t=new Trace(),tc=G.adj.map(r=>r.slice());
    const tcBlk=abstractList(t,'tc matrix','n × n entries (returned pseudocode value)');
    const V=(cls,chg)=>graphView(G,{cls,matrix:{name:'tc — transitive closure',m:tc,chg:chg||null},adjName:'A — input adjacency matrix'});
    t.step([0,LWAR.copy],'<code>tc</code> is created as a copy of <code>A</code>.',V());
    for(let k=0;k<n;k++){
      t.v({k}).step([0,LWAR.k],`Consider intermediate vertex <code>k = ${k}</code>.`,V({[k]:'act'}));
      for(let s=0;s<n;s++)for(let u=0;u<n;u++){
        t.v({s,t:u}).step([0,LWAR.test],`<code>tc[${s}][${k}] && tc[${k}][${u}]</code> is <b>${tc[s][k]&&tc[k][u]}</b>.`,V({[s]:'act',[k]:'hit',[u]:'act'}));
        if(tc[s][k]&&tc[k][u]){tc[s][u]=true;t.step([0,LWAR.set],`<code>tc[${s}][${u}] = true</code>.`,V({[s]:'act',[u]:'hit'},`${s}-${u}`));}
      }
    }
    t.drop('k','s','t').step([0,LWAR.ret],'<code>return tc</code>. The returned matrix remains live; a concrete C owner must later release it, but that code is not supplied in the manual.',V());
    return t;
  }
});

/* CUR-MOD-03: the coverage index promises "Shortest-path reconstruction from
   pred", but the Dijkstra lesson stopped at the dist[]/pred[] tables. Those
   tables are the algorithm's output; they do not demonstrate the
   reconstruction process the index advertises. The gap is closed by ADDING
   the missing lesson, not by deleting the claim.

   This pseudocode is authored by the tracer as a supplemental lesson. It is
   NOT a manual or lecture quotation, and its block is labelled accordingly.
   It follows pred links from the destination back to the source, so the
   vertices come out in reverse and are then reversed.

   Tie-breaking: Dijkstra's pred[] records ONE predecessor - whichever
   relaxation last improved dist[w]. When several shortest paths share the
   same cost, this returns the one pred[] happens to hold. That is a valid
   shortest path, not "the" shortest path, and the lesson says so rather than
   implying uniqueness.

   The loop is guarded against a malformed pred chain: a correct pred array
   from Dijkstra is acyclic, but a defensive reconstruction must terminate and
   report a defect instead of looping forever or inventing a path. */
const PS_DIJ_PATH = `reconstructPath(pred, src, dest):
    if dest = src:
        return [src]                      // the trivial one-vertex path
    if pred[dest] = -1:
        return no path                    // dest was never reached
    path = empty sequence
    v = dest
    while v != -1:
        prepend v to path
        if v = src:
            return path
        v = pred[v]
    return no path                        // pred chain did not reach src`;
const LDIJP=lines(PS_DIJ_PATH,{same:'if dest = src:',none:'if pred[dest] = -1:',
  init:'path = empty sequence',loop:'while v != -1:',add:'prepend v to path',
  done:'if v = src:',step:'v = pred[v]',fail:'return no path                  '});

mod({
  id:'dijkstra',group:'Graphs',name:"Dijkstra's algorithm",
  blocks:[{title:"dijkstra - pseudocode",src:PS_DIJ,pseudo:true,pages:'p. 20'},{title:'Graph adjacency-matrix implementation (unweighted)',src:SRC_GADJ,pages:'pp. 16-19'},{title:'Shortest-path reconstruction from pred - supplemental',src:PS_DIJ_PATH,pseudo:true,source:'memorise',pages:'supplemental lesson'}],
  fields:[{k:'nV',label:'nV',def:'5',w:4},{k:'g',label:'weighted edges v-w:weight',def:'0-1:4, 0-2:1, 2-1:2, 1-3:5, 2-3:8, 3-4:3, 2-4:10'},{k:'src',label:'src',def:'0',w:4},{k:'dest',label:'dest (path to)',def:'4',w:4}],
  note:'The manual supplies weighted-graph pseudocode for Dijkstra, but its only concrete <code>struct graph</code> stores <code>bool **edges</code> and no weights. The trace therefore shows the pseudocode state and does not claim a manual C implementation.',
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),n=G.nV,t=new Trace();
    /* Dijkstra's non-negative-weight restriction is algorithm-specific: it is
       enforced here, not in the shared validator, so the MST topics keep
       accepting the negative weights that are mathematically valid for them. */
    if(G.edges.some(e=>e.wt<0))throw new InputValidationError("Dijkstra's algorithm requires non-negative edge weights",'g');
    const src=parseIntScalar(inp.src,{fieldKey:'src',fieldLabel:'src',min:0,max:n-1});
    const dest=parseIntScalar(inp.dest,{fieldKey:'dest',fieldLabel:'dest',min:0,max:n-1});
    const dist=new Array(n).fill(Infinity),pred=new Array(n).fill(-1),vSet=new Set(range(0,n-1));
    const distBlk=abstractList(t,'dist[]','nV entries'),predBlk=abstractList(t,'pred[]','nV entries'),setBlk=abstractList(t,'vSet','all vertices');
    const V=(cls,ecls,chg)=>graphView(G,{weighted:true,cls,ecls,tables:[{name:'dist[]',tag:'dist',row:dist.slice(),chg:chg||[]},{name:'pred[]',tag:'pred',row:pred.slice(),chg:chg||[]},{name:`vSet = {${[...vSet].join(', ')}}`,tag:'in?',row:range(0,n-1).map(i=>vSet.has(i)?'T':'F')}]});
    t.step([0,LDIJ.dist],'<code>dist</code> is created and initialised to <code>inf</code>.',V());
    t.step([0,LDIJ.pred],'<code>pred</code> is created and initialised to <code>-1</code>.',V());
    t.step([0,LDIJ.vset],'<code>vSet</code> is created containing every vertex.',V());
    dist[src]=0;t.v({src}).step([0,LDIJ.zero],`<code>dist[${src}] = 0</code>.`,V({[src]:'hit'},{},[src]));
    while(vSet.size){
      t.step([0,LDIJ.loop],'<code>vSet</code> is not empty.',V());
      let v=[...vSet][0];for(const u of vSet)if(dist[u]<dist[v])v=u;
      t.v({v,'dist[v]':dist[v]}).step([0,LDIJ.pick],`Choose vertex ${v} with minimal <code>dist</code> in <code>vSet</code> (${dist[v]===Infinity?'inf':dist[v]}).`,V({[v]:'act'}));
      vSet.delete(v);t.step([0,LDIJ.remove],`Remove ${v} from <code>vSet</code>.`,V({[v]:'hit'}));
      for(let w=0;w<n;w++){
        if(!G.adj[v][w])continue;
        const weight=G.wt[v][w],candidate=dist[v]+weight;
        t.v({w,weight}).step([0,LDIJ.edge],`Edge <code>(${v}, ${w}, ${weight})</code>.`,V({[v]:'act',[w]:'act'},{[`${v}-${w}`]:'act'}));
        t.step([0,LDIJ.test],`<code>dist[${v}] + ${weight} < dist[${w}]</code> is <b>${candidate<dist[w]}</b>.`,V({[w]:candidate<dist[w]?'hit':'bad'},{[`${v}-${w}`]:'act'}));
        if(candidate<dist[w]){dist[w]=candidate;t.step([0,LDIJ.relax],`<code>dist[${w}] = ${candidate}</code>.`,V({[w]:'hit'},{[`${v}-${w}`]:'tree'},[w]));pred[w]=v;t.step([0,LDIJ.setp],`<code>pred[${w}] = ${v}</code>.`,V({[w]:'hit'},{[`${v}-${w}`]:'tree'},[w]));}
      }
      t.drop('w','weight');
    }
    t.release(setBlk);t.step([0,LDIJ.loop],'<code>vSet</code> is empty. Its lifecycle ends here.',V());
    t.drop('v','dist[v]').step([0,LDIJ.loop],'<code>dist</code> and <code>pred</code> hold the final traced state. Their concrete C ownership is not specified in the manual.',V());

    /* ---------- CUR-MOD-03: reconstruct the path to dest from pred ---------- */
    const P=(cls,ecls,path)=>graphView(G,{weighted:true,cls,ecls,tables:[
      {name:'dist[]',tag:'dist',row:dist.slice()},
      {name:'pred[]',tag:'pred',row:pred.slice()},
      {name:`path so far (built backwards from dest): ${path&&path.length?path.join(' <- '):'empty'}`,tag:'path',head:'v',row:path&&path.length?path.slice():['—']}
    ]});
    t.v({dest,'dist[dest]':dist[dest]}).step(srcLine(this.blocks,LDIJP,'same'),
      `Reconstruction target: <code>dest = ${dest}</code>, with <code>dist[${dest}] = ${dist[dest]===Infinity?'inf':dist[dest]}</code>. The vertices are recovered by following <code>pred</code> backwards from <code>dest</code>.`,P({[dest]:'act'},{},[]));
    if(dest===src){
      t.v({path:String(src),cost:0}).step(srcLine(this.blocks,LDIJP,'same'),
        `<code>dest == src</code>, so the shortest path is the single vertex <b>${src}</b> and its cost is <b>0</b>. No edge is traversed.`,P({[src]:'hit'},{},[src]));
    }else if(pred[dest]===-1){
      t.v({path:'none',cost:'inf'}).step(srcLine(this.blocks,LDIJP,'none'),
        `<code>pred[${dest}] == -1</code> and <code>dist[${dest}]</code> is still <code>inf</code>, so vertex ${dest} was never reached from ${src}. There is <b>no path</b>. No path is invented for an unreachable destination.`,P({[dest]:'bad'},{},[]));
    }else{
      const back=[];const seen=new Set();let v=dest,broken=false;
      t.step(srcLine(this.blocks,LDIJP,'init'),'<code>path</code> starts empty and <code>v</code> starts at <code>dest</code>.',P({[dest]:'act'},{},[]));
      while(v!==-1){
        if(seen.has(v)){broken=true;break;}          /* defensive: malformed pred chain */
        seen.add(v);back.unshift(v);
        t.v({v,'pred[v]':pred[v]}).step(srcLine(this.blocks,LDIJP,'add'),
          `Prepend <code>${v}</code>. <code>pred[${v}] = ${pred[v]}</code>.`,
          P({[v]:'hit'},Object.fromEntries(back.slice(0,-1).map((x,i)=>[`${back[i]}-${back[i+1]}`,'tree'])),back));
        if(v===src)break;
        v=pred[v];
      }
      if(broken||back[0]!==src){
        t.v({path:'none'}).step(srcLine(this.blocks,LDIJP,'fail'),
          `The <code>pred</code> chain from ${dest} did not terminate at the source${broken?' because it revisited a vertex':''}. A correct <code>pred</code> array from this algorithm is acyclic, so this indicates a defect rather than a missing path: the reconstruction stops and reports it instead of looping or guessing a path.`,P({[dest]:'bad'},{},back));
      }else{
        const edges={};let cost=0;
        for(let i=0;i+1<back.length;i++){edges[`${back[i]}-${back[i+1]}`]='tree';cost+=G.wt[back[i]][back[i+1]];}
        t.v({path:back.join(' -> '),edges:back.length-1,cost}).step(srcLine(this.blocks,LDIJP,'done'),
          `<code>v == src</code>, so the path is complete: <b>${back.join(' → ')}</b> using ${back.length-1} edge${back.length-1===1?'':'s'}, total cost <b>${cost}</b>, which matches <code>dist[${dest}] = ${dist[dest]}</code>. <code>pred</code> stores one predecessor per vertex, so when several shortest paths have equal cost this returns <i>a</i> shortest path rather than the only one.`,
          P(Object.fromEntries(back.map(x=>[x,'hit'])),edges,back));
      }
    }
    return t;
  }
});

function pathExists(adj,src,dst){const seen=new Array(adj.length).fill(false),q=[src];seen[src]=true;while(q.length){const v=q.shift();if(v===dst)return true;for(let w=0;w<adj.length;w++)if(adj[v][w]&&!seen[w]){seen[w]=true;q.push(w);}}return false;}

mod({
  id:'kruskal',group:'Graphs',name:"Kruskal's algorithm",
  blocks:[{title:"kruskalMst - pseudocode",src:PS_KRUS,pseudo:true,pages:'pp. 20-21'}],
  fields:[{k:'nV',label:'V',def:'5',w:4},{k:'g',label:'weighted edges v-w:weight',def:'0-1:4, 0-2:1, 1-2:2, 1-3:5, 2-3:8, 3-4:3, 2-4:10, 0-4:7'}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),n=G.nV,t=new Trace(),mstAdj=Array.from({length:n},()=>new Array(n).fill(false)),mstE=[];
    const mstBlk=abstractList(t,'mst','empty graph with V vertices'),sortedBlk=abstractList(t,'sortedEdges','edges of G sorted by weight');
    const sorted=G.edges.slice().sort((a,b)=>a.wt-b.wt),inMst={};
    const V=(cls,ecls)=>graphView(G,{weighted:true,cls,ecls:Object.assign({},inMst,ecls||{}),tables:[{name:`mst edges: ${mstE.length}/${Math.max(0,n-1)}`,tag:'mst',head:'edge',row:mstE.length?mstE.map(e=>`${e.v}-${e.w}:${e.wt}`):['—']},{name:'sortedEdges',tag:'e',head:'order',row:sorted.map(e=>`${e.v}-${e.w}:${e.wt}`)}]});
    t.step([0,LKR.mst],'<code>mst</code> is created as an empty graph with <code>V</code> vertices.',V());
    t.step([0,LKR.sort],`<code>sortedEdges</code> = ${sorted.length?sorted.map(e=>`${e.v}-${e.w}:${e.wt}`).join(', '):'(no edges)'}.`,V());
    /* AUD-15: a spanning tree of a V-vertex graph has exactly V-1 edges, so a
       single-vertex graph is already spanned by zero edges. The completion
       test previously ran only after an edge was added, so with no edges to
       consider the loop body never executed, the test was never reached and
       the trace fell through to "no mst". The correct behaviour is to test the
       condition up front: one vertex, zero edges, total weight 0. The input is
       NOT rejected and the example is NOT hidden - V=1 is an ordinary, valid
       graph for this algorithm. */
    if(mstE.length===n-1){
      t.release(sortedBlk);
      t.v({mstEdges:mstE.length,requiredEdges:n-1,totalWeight:0}).step([0,LKR.ret],`<code>mst</code> already has <code>V - 1 = ${n-1}</code> edge${n-1===1?'':'s'}, so it spans every vertex. <code>return mst</code>: a spanning tree over ${n} vertex${n===1?'':'es'} with 0 edges and total weight <b>0</b>. The returned MST remains live.`,V());
      return t;
    }
    for(const e of sorted){
      t.v({v:e.v,w:e.w,weight:e.wt}).step([0,LKR.loop],`Consider edge <code>(${e.v}, ${e.w}, ${e.wt})</code>.`,V({[e.v]:'act',[e.w]:'act'},{[`${e.v}-${e.w}`]:'act'}));
      const noPath=!pathExists(mstAdj,e.v,e.w);
      t.step([0,LKR.test],`There is no path between ${e.v} and ${e.w} in <code>mst</code>: <b>${noPath}</b>.`,V({[e.v]:noPath?'hit':'bad',[e.w]:noPath?'hit':'bad'}));
      if(!noPath)continue;
      mstAdj[e.v][e.w]=mstAdj[e.w][e.v]=true;mstE.push(e);inMst[`${e.v}-${e.w}`]='tree';
      t.step([0,LKR.add],`Add edge <code>(${e.v}, ${e.w}, ${e.wt})</code> to <code>mst</code>.`,V({[e.v]:'hit',[e.w]:'hit'}));
      t.step([0,LKR.count],`<code>mst</code> has <code>${mstE.length}</code> edge${mstE.length===1?'':'s'}; <code>V - 1 = ${n-1}</code>.`,V());
      if(mstE.length===n-1){
        const total=mstE.reduce((acc,x)=>acc+x.wt,0);
        t.release(sortedBlk);
        t.v({mstEdges:mstE.length,requiredEdges:n-1,totalWeight:total}).step([0,LKR.ret],`<code>mst</code> now has <code>V - 1 = ${n-1}</code> edge${n-1===1?'':'s'}. <code>return mst</code>: a spanning tree over ${n} vertices with total weight <b>${total}</b>. The returned MST remains live.`,V());
        return t;
      }
    }
    /* AUD-15 / BRG-03: the edge list is exhausted without reaching V-1 edges,
       so this graph has NO spanning tree. What was built is a spanning FOREST
       of the components, which must be reported as such rather than as a
       successful MST. */
    {
      const total=mstE.reduce((acc,x)=>acc+x.wt,0);
      const trees=n-mstE.length;
      t.release(sortedBlk);t.release(mstBlk);
      t.v({mstEdges:mstE.length,requiredEdges:n-1,totalWeight:total,components:trees}).step([0,LKR.fail],`Every edge has been considered and <code>mst</code> has ${mstE.length} edge${mstE.length===1?'':'s'}, fewer than <code>V - 1 = ${n-1}</code>. This graph is disconnected, so <b>no spanning tree exists</b>: <code>no mst</code>. The ${mstE.length} edge${mstE.length===1?'':'s'} selected form a minimum spanning <i>forest</i> of ${trees} component${trees===1?'':'s'} with total weight ${total} - useful to inspect, but not a spanning tree of the whole graph.`,V());
      return t;
    }
  }
});

mod({
  id:'prim',group:'Graphs',name:"Prim's algorithm",
  blocks:[{title:"primMst - pseudocode",src:PS_PRIM,pseudo:true,pages:'p. 21'}],
  fields:[{k:'nV',label:'V',def:'5',w:4},{k:'g',label:'weighted edges v-w:weight',def:'0-1:4, 0-2:1, 1-2:2, 1-3:5, 2-3:8, 3-4:3, 2-4:10, 0-4:7'}],
  run(inp){
    const G=parseGraph(inp.g,inp.nV,false),n=G.nV,t=new Trace(),mstE=[],usedV=new Set([0]),inMst={};let unusedE=G.edges.slice();
    const mstBlk=abstractList(t,'mst','empty graph with V vertices'),usedBlk=abstractList(t,'usedV','{0}'),unusedBlk=abstractList(t,'unusedE','edges of G');
    const V=(cls,ecls)=>graphView(G,{weighted:true,cls:Object.assign(Object.fromEntries([...usedV].map(v=>[v,'hit'])),cls||{}),ecls:Object.assign({},inMst,ecls||{}),tables:[{name:`usedV = {${[...usedV].join(', ')}}`,tag:'used',head:'v',row:range(0,n-1).map(i=>usedV.has(i)?'T':'F')},{name:'unusedE',tag:'e',head:'edge',row:unusedE.length?unusedE.map(e=>`${e.v}-${e.w}:${e.wt}`):['—']},{name:'mst',tag:'e',head:'edge',row:mstE.length?mstE.map(e=>`${e.s}-${e.t}:${e.wt}`):['—']}]});
    t.step([0,LPR.mst],'<code>mst</code> is created as an empty graph with <code>V</code> vertices.',V());
    t.step([0,LPR.used],'<code>usedV = {0}</code>.',V({0:'hit'}));
    t.step([0,LPR.unused],'<code>unusedE = edges of G</code>.',V());
    while(usedV.size<n){
      t.step([0,LPR.loop],`<code>|usedV| = ${usedV.size} < V = ${n}</code>.`,V());
      let best=null,bestIndex=-1;
      unusedE.forEach((e,idx)=>{
        let s=null,tt=null;if(usedV.has(e.v)&&!usedV.has(e.w)){s=e.v;tt=e.w;}else if(usedV.has(e.w)&&!usedV.has(e.v)){s=e.w;tt=e.v;}
        if(s!==null&&(!best||e.wt<best.wt)){best={s,t:tt,wt:e.wt,v:e.v,w:e.w};bestIndex=idx;}
      });
      if(!best){t.step([0,LPR.find],'No edge in <code>unusedE</code> satisfies the stated condition. The supplied pseudocode gives no disconnected-graph branch, so the trace stops.',V());break;}
      t.v({s:best.s,t:best.t,weight:best.wt}).step([0,LPR.find],`Choose <code>e = (${best.s}, ${best.t}, ${best.wt})</code>.`,V({[best.t]:'act'},{[`${best.v}-${best.w}`]:'act'}));
      mstE.push(best);inMst[`${best.v}-${best.w}`]='tree';t.step([0,LPR.add],'<code>add e to mst</code>.',V({[best.t]:'hit'}));
      usedV.add(best.t);t.step([0,LPR.addv],`<code>add ${best.t} to usedV</code>.`,V({[best.t]:'hit'}));
      unusedE.splice(bestIndex,1);t.step([0,LPR.rem],'<code>remove e from unusedE</code>.',V());
    }
    /* AUD-15 / BRG-04: distinguish a completed spanning tree from a partial
       forest explicitly, and report the total weight. V=1 reaches here with
       usedV={0} and zero edges, which is a correct spanning tree, not a
       failure. */
    {
      const total=mstE.reduce((acc,x)=>acc+x.wt,0);
      const complete=usedV.size===n;
      const trees=n-mstE.length;
      t.release(usedBlk);t.release(unusedBlk);
      t.v({mstEdges:mstE.length,requiredEdges:n-1,totalWeight:total,components:complete?1:trees}).step([0,LPR.ret],
        complete
          ?`Every vertex is in <code>usedV</code> and <code>mst</code> has <code>V - 1 = ${n-1}</code> edge${n-1===1?'':'s'}. <code>return mst</code>: a spanning tree over ${n} vertex${n===1?'':'es'} with total weight <b>${total}</b>. The returned MST remains live.`
          :`Only ${usedV.size} of ${n} vertices entered <code>usedV</code>, so this graph is disconnected and <b>no spanning tree exists</b>. The ${mstE.length} edge${mstE.length===1?'':'s'} selected form a minimum spanning <i>forest</i> of the reachable component with total weight ${total}; it is not a spanning tree of the whole graph.`,
        V());
    }
    return t;
  }
});
