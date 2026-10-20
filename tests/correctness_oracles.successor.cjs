const fs = require('node:fs');
const path = require('node:path');
const { load } = require(process.env.DSA_LOADER||'/home/claude/work/replay/reproduce/algorithm/load_modules.cjs');
const { api } = load();
let seed = 0x37ada323;
const next = () => (seed = (Math.imul(seed,1664525)+1013904223) >>> 0);
const rand = n => next() % n;
const out = { seed:'0x37ada323', checks:0, passed:0, failed:[], groups:{} };
function check(group, name, actual, expected, input) {
  out.checks++;
  const g = out.groups[group] ||= {checks:0,passed:0,failed:0};
  g.checks++;
  if (JSON.stringify(actual) === JSON.stringify(expected)) { out.passed++;g.passed++; }
  else { g.failed++;out.failed.push({group,name,input,actual,expected}); }
}
function run(id, input) { return api.run(id,input).f; }
function end(id,input) { return run(id,input).at(-1); }
function views(view) { return [view,...(view.views||[]).flatMap(views)]; }
function find(view,kind) { return views(view).find(v=>v.kind===kind); }
function inorder(n) { return n?[...inorder(n.l),n.v,...inorder(n.r)]:[]; }
function balance(n) {
  if (!n) return {h:-1,balanced:true};
  const l=balance(n.l),r=balance(n.r);
  return {h:1+Math.max(l.h,r.h),balanced:l.balanced&&r.balanced&&Math.abs(l.h-r.h)<=1};
}
const arrays=[[],[0],[1,0],[1,1],[-1,0,1],[3,2,1],[1,2,3],[0,-1,0,1,-1],[2147483647,-2147483648,0]];
for(let k=0;k<71;k++)arrays.push(Array.from({length:rand(13)},()=>rand(19)-9));
for(const a of arrays){
  const input={a:a.join(' ')}, expected=a.slice().sort((a,b)=>a-b);
  for(const id of ['sel','bub','ins','ms','qs','q3'])
    check('sorting',id,Array.from(end(id,input).view.rows[0].a),expected,input);
  if(a.length){
    check('sorting','bottomup',Array.from(end('bottomup',input).view.rows[0].a),expected,input);
    check('sorting','heapsort',Array.from(end('heapsort',input).view.items),expected,input);
    for(const method of ['fix-down O(n)','fix-up O(n log n)']){
      const h=Array.from(end('heapify',{...input,method}).view.items);
      check('heapify','permutation-'+method,h.slice().sort((a,b)=>a-b),expected,input);
      check('heapify','max-heap-'+method,h.every((v,i)=>i===0||h[Math.floor((i-1)/2)]>=v),true,input);
    }
  }
  const sorted=expected.join(' ');
  for(const val of [-10,0,10]){
    const f=end('bin',{a:sorted,val:String(val)});
    const matched=/return <b>(-?\d+)<\/b>/.exec(f.note) || /Return <b>(-?\d+)<\/b>/.exec(f.note);
    const idx=matched?Number(matched[1]):null;
    check('binary_search','membership',idx===-1?!expected.includes(val):idx!==null&&expected[idx]===val,true,{a:sorted,val});
  }
}
for(let k=0;k<70;k++){
  const a=Array.from({length:1+rand(18)},()=>rand(41)-20),unique=[...new Set(a)].sort((a,b)=>a-b),seq=a.join(' ');
  for(const id of ['bstins','avlins']){
    const f=end(id,{seq});check('trees',id+'-order',inorder(f.view.root),unique,{seq});
    if(id==='avlins')check('trees',id+'-balance',balance(f.view.root).balanced,true,{seq});
  }
  for(const val of [a[rand(a.length)],99]){
    const expected=unique.filter(v=>v!==val);
    for(const id of ['bstdel','avldel']){
      const f=end(id,{seq,val:String(val)});check('trees',id+'-order',inorder(f.view.root),expected,{seq,val});
      if(id==='avldel')check('trees',id+'-balance',balance(f.view.root).balanced,true,{seq,val});
    }
  }
  const idx=rand(unique.length),part=end('bstpartition',{seq,i:String(idx)}),tree=find(part.view,'tree');
  check('trees','partition-root',tree.root.v,unique[idx],{seq,i:idx});
  check('trees','partition-order',inorder(tree.root),unique,{seq,i:idx});
  const re=end('bstrebalance',{seq,mode:'global'}).view.root;
  check('trees','rebalance-order',inorder(re),unique,{seq});
  check('trees','rebalance-height',balance(re).balanced,true,{seq});
}
// Independent graph oracles: breadth reachability, Bellman-Ford relaxation,
// exhaustive spanning-tree subset selection, and topological cycle detection.
function graph(n,es,directed=false){const adj=Array.from({length:n},()=>[]);for(const e of es){adj[e.v].push(e.w);if(!directed)adj[e.w].push(e.v);}return adj;}
function bfs(adj,s){const d=Array(adj.length).fill(Infinity),q=[s];d[s]=0;for(let i=0;i<q.length;i++)for(const w of adj[q[i]])if(d[w]===Infinity){d[w]=d[q[i]]+1;q.push(w);}return d;}
function components(adj){let c=0;const seen=new Set();for(let s=0;s<adj.length;s++)if(!seen.has(s)){c++;bfs(adj,s).forEach((d,i)=>{if(d!==Infinity)seen.add(i);});}return c;}
function shortest(n,es,s){const d=Array(n).fill(Infinity);d[s]=0;for(let i=0;i<n-1;i++)for(const e of es){d[e.w]=Math.min(d[e.w],d[e.v]+e.wt);d[e.v]=Math.min(d[e.v],d[e.w]+e.wt);}return d;}
function mstCost(n,es){let best=Infinity;for(let mask=0;mask<(1<<es.length);mask++){
  let bitCount=0;for(let m=mask;m;m&=m-1)bitCount++;if(bitCount!==n-1)continue;
  const chosen=es.filter((_,i)=>mask&(1<<i));if(components(graph(n,chosen))===1)best=Math.min(best,chosen.reduce((s,e)=>s+e.wt,0));
}return best;}
function mstRows(frame){const gv=find(frame.view,'graph'),table=gv.tables.find(t=>/^mst(?: edges:)?/.test(t.name));return table?.row.filter(x=>x!=='—')||[];}
for(let k=0;k<80;k++){
  const n=2+rand(4),es=[];for(let v=0;v<n;v++)for(let w=v+1;w<n;w++)if(rand(3)!==0)es.push({v,w,wt:rand(10)});
  const input={nV:String(n),g:es.map(e=>`${e.v}-${e.w}:${e.wt}`).join(', ')},src=rand(n),adj=graph(n,es),dist=bfs(adj,src),cc=components(adj);
  /* SUCCESSOR ADAPTATION (the only behavioural change in this file).
     dijkstra gained a `dest` field for the CUR-MOD-03 path-reconstruction
     lesson. Its default is 4, valid for the module's own default nV of 5, but
     this suite generates nV = 2..5 while overriding only `src`, so `dest`
     stayed at 4 and was correctly rejected as not a vertex of the graph.
     A vertex-valued target MUST be a vertex of the graph, so the validation
     is right and is not weakened here; the suite simply supplies a valid
     destination, exactly as it already does for bfspath on the next line
     (`dest:String(n-1)`). The oracle it checks - dist[] against an
     independent shortest-path computation - is unchanged. */
  const df=end('dijkstra',{...input,src:String(src),dest:String(n-1)}),dt=find(df.view,'graph').tables.find(t=>t.tag==='dist');
  check('graphs','dijkstra',Array.from(dt.row),shortest(n,es,src),{...input,src});
  const b=end('bfspath',{...input,src:String(src),dest:String(n-1)});
  check('graphs','bfs-shortest',b.vars.edges??Infinity,dist[n-1],{...input,src,dest:n-1});
  const c=end('components',input);
  check('graphs','component-count',c.vars.nC,cc,input);
  check('graphs','undirected-cycle',end('cycleu',input).vars.cycle,es.length>n-cc,input);
  const want=mstCost(n,es);
  for(const id of ['kruskal','prim']){
    const f=end(id,input),rows=mstRows(f),observed=/<code>return mst<\/code>/.test(f.note)?rows.reduce((s,x)=>s+Number(x.slice(x.lastIndexOf(':')+1)),0):Infinity;
    check('graphs',id+'-mst-cost',observed,want,input);
  }
}
for(let k=0;k<80;k++){
  const n=1+rand(6),es=[];for(let v=0;v<n;v++)for(let w=0;w<n;w++)if(v!==w&&rand(5)===0)es.push({v,w});
  const input={nV:String(n),g:es.map(e=>`${e.v}>${e.w}`).join(', ')},adj=graph(n,es,true),want=Array.from({length:n},()=>Array(n).fill(false));
  for(let s=0;s<n;s++){const q=[...adj[s]];for(let i=0;i<q.length;i++){const v=q[i];if(want[s][v])continue;want[s][v]=true;q.push(...adj[v]);}}
  const actual=end('warshall',input).view.matrix.m;
  check('graphs','warshall-final',actual,want,input);
  const indeg=Array(n).fill(0);es.forEach(e=>indeg[e.w]++);const q=[];indeg.forEach((d,i)=>{if(d===0)q.push(i);});for(let i=0;i<q.length;i++)for(const w of adj[q[i]])if(--indeg[w]===0)q.push(w);
  check('graphs','directed-cycle',end('cycled',input).vars.cycle,q.length<n,input);
}
for(let k=0;k<100;k++){
  const a=Array.from({length:rand(15)},()=>rand(21)-10),S=rand(41)-20;let pair=false;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i]+a[j]===S)pair=true;
  check('hash_applications','two-sum',end('twosum',{a:a.join(' '),S:String(S)}).vars.result,pair,{a,S});
  const counts={};a.forEach(v=>counts[v]=(counts[v]||0)+1);
  check('hash_applications','odd-count',end('oddocc',{a:a.join(' ')}).vars.result,Object.values(counts).filter(c=>c%2===1).length,{a});
}
fs.writeFileSync((process.env.DSA_JSON_OUT||path.join(__dirname,'correctness_oracles_successor_results.json')),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
if(out.failed.length)process.exitCode=1;
