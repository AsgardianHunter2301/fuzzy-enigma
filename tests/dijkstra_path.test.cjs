/* CUR-MOD-03 successor gate: the advertised "Shortest-path reconstruction
   from pred" lesson.

   The oracle deliberately does NOT assert one exact vertex sequence. On the
   default graph, dist[4] = 11 is achieved by both 0->2->4 and 0->1->3->4, so
   demanding a particular sequence would make an arbitrary tie-break the only
   passing answer. Instead it checks the properties that must hold: the
   reported sequence is a real walk in the graph, it starts at src and ends at
   dest, and its summed weight equals the independently computed dist[dest]. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
/* Default the repo root to this tree so the suite is self-contained. */
process.env.DSA_REPO_ROOT=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const LOADER=process.env.DSA_LOADER||'/home/claude/work/replay/reproduce/algorithm/load_modules.cjs';
const {api}=require(LOADER).load();
const strip=s=>String(s).replace(/<[^>]+>/g,'');

/* Independent Dijkstra, written from the algorithm definition, not the tracer. */
function shortestDistances(nV,edges,src){
  const INF=Infinity;
  const w=Array.from({length:nV},()=>new Array(nV).fill(INF));
  for(const e of edges){w[e.v][e.w]=Math.min(w[e.v][e.w],e.wt);w[e.w][e.v]=Math.min(w[e.w][e.v],e.wt);}
  const dist=new Array(nV).fill(INF),done=new Array(nV).fill(false);
  dist[src]=0;
  for(let k=0;k<nV;k++){
    let v=-1;for(let i=0;i<nV;i++)if(!done[i]&&(v===-1||dist[i]<dist[v]))v=i;
    if(v===-1||dist[v]===INF)break;
    done[v]=true;
    for(let u=0;u<nV;u++)if(w[v][u]!==INF&&dist[v]+w[v][u]<dist[u])dist[u]=dist[v]+w[v][u];
  }
  return dist;
}
function parseEdges(g){
  return String(g).split(/[,;]+/).map(x=>x.trim()).filter(Boolean).map(tok=>{
    const m=/^(\d+)\s*-\s*(\d+)(?:\s*:\s*(-?[\d.]+))?$/.exec(tok);
    return {v:+m[1],w:+m[2],wt:m[3]===undefined?1:+m[3]};
  });
}
function last(ov){const t=api.run('dijkstra',ov);const f=t.f[t.f.length-1];return {note:strip(f.note),vars:f.vars,frames:t.f.length,all:t.f.map(x=>strip(x.note))};}

let pass=0,fail=0;const results=[];
function chk(name,cond,detail){
  cond?pass++:fail++;results.push({name,ok:!!cond,detail:cond?undefined:String(detail).slice(0,260)});
  console.log('  '+(cond?'PASS':'FAIL')+'  '+name+(cond?'':'   <- '+String(detail).slice(0,220)));
}
/* Verify a reported path is a genuine walk of the stated cost. */
function validPath(nV,g,src,dest,seq,cost){
  const edges=parseEdges(g);
  const has=(a,b)=>edges.find(e=>(e.v===a&&e.w===b)||(e.v===b&&e.w===a));
  if(!seq.length||seq[0]!==src||seq[seq.length-1]!==dest)return 'endpoints wrong';
  let total=0;
  for(let i=0;i+1<seq.length;i++){const e=has(seq[i],seq[i+1]);if(!e)return 'no edge '+seq[i]+'-'+seq[i+1];total+=e.wt;}
  if(Math.abs(total-cost)>1e-9)return 'summed '+total+' but reported '+cost;
  const d=shortestDistances(nV,edges,src);
  if(Math.abs(d[dest]-cost)>1e-9)return 'reported '+cost+' but true shortest is '+d[dest];
  return null;
}

const G='0-1:4, 0-2:1, 2-1:2, 1-3:5, 2-3:8, 3-4:3, 2-4:10';
{
  const r=last({nV:'5',g:G,src:'0',dest:'4'});
  const seq=String(r.vars.path).split(' -> ').map(Number);
  const why=validPath(5,G,0,4,seq,r.vars.cost);
  chk('ordinary case: reported path is a real walk of the true shortest cost',why===null,why+' | '+JSON.stringify(r.vars));
  chk('ordinary case: cost is stated as matching dist[dest]',/matches dist\[4\] = 11/.test(r.note),r.note.slice(0,200));
  chk('ordinary case: tie-breaking is stated rather than implying uniqueness',/a shortest path rather than the only one/.test(r.note),r.note.slice(-200));
  chk('ordinary case: predecessor links are walked one step at a time',r.all.filter(n=>/^Prepend/.test(n)).length===seq.length,r.all.filter(n=>/^Prepend/.test(n)).length+' prepends for '+seq.length+' vertices');
}
{
  const r=last({nV:'5',g:G,src:'0',dest:'0'});
  chk('src == dest: one-vertex path, cost 0, no edge traversed',r.vars.cost===0&&/single vertex/.test(r.note)&&/No edge is traversed/.test(r.note),JSON.stringify(r.vars));
}
{
  const r=last({nV:'4',g:'0-1:2',src:'0',dest:'3'});
  chk('unreachable dest: no path reported and none invented',/no path/i.test(r.note)&&/never reached/.test(r.note)&&r.vars.path==='none',JSON.stringify(r.vars));
}
{
  /* Two distinct equal-cost shortest paths exist; either is acceptable. */
  const g='0-1:1, 0-2:1, 1-3:1, 2-3:1';
  const r=last({nV:'4',g,src:'0',dest:'3'});
  const seq=String(r.vars.path).split(' -> ').map(Number);
  chk('equal-cost tie: returns a valid shortest path, not a fixed one',validPath(4,g,0,3,seq,r.vars.cost)===null,validPath(4,g,0,3,seq,r.vars.cost)+' | '+JSON.stringify(r.vars));
}
{
  const g='0-1:0.5, 1-2:0.25';
  const r=last({nV:'3',g,src:'0',dest:'2'});
  chk('fractional weights are preserved end to end',validPath(3,g,0,2,String(r.vars.path).split(' -> ').map(Number),r.vars.cost)===null&&Math.abs(r.vars.cost-0.75)<1e-9,JSON.stringify(r.vars));
}
{
  const r=last({nV:'3',g:'0-1:0, 1-2:0',src:'0',dest:'2'});
  chk('zero weights are handled',r.vars.cost===0&&r.vars.path==='0 -> 1 -> 2',JSON.stringify(r.vars));
}
{
  const r=last({nV:'2',g:'0-1:7',src:'0',dest:'1'});
  chk('smallest non-trivial case: two vertices, one edge',r.vars.cost===7&&r.vars.path==='0 -> 1',JSON.stringify(r.vars));
}
{
  const r=last({nV:'1',g:'',src:'0',dest:'0'});
  chk('single-vertex graph reconstructs the trivial path',r.vars.cost===0,JSON.stringify(r.vars));
}
/* Algorithm-specific restriction stays with the algorithm that needs it. */
{
  let e=null;try{api.run('dijkstra',{nV:'3',g:'0-1:-1',src:'0',dest:'2'});}catch(x){e=x;}
  chk('negative weight rejected for Dijkstra, with field key g',e&&e.name==='InputValidationError'&&e.fieldKey==='g',e&&e.name+'/'+e.fieldKey);
}
{
  let ok=true;try{api.run('kruskal',{nV:'3',g:'0-1:-2, 1-2:-3'});}catch(x){ok=false;}
  chk('MST topics still accept valid negative weights',ok,'kruskal rejected a negative weight');
}
{
  let e=null;try{api.run('dijkstra',{nV:'5',g:G,src:'0',dest:'9'});}catch(x){e=x;}
  chk('dest out of range rejected with field key dest',e&&e.name==='InputValidationError'&&e.fieldKey==='dest',e&&e.name+'/'+e.fieldKey);
}
{
  const m=api.module('dijkstra');const b=(m.blocks||[])[2];
  chk('the added block is labelled supplemental, not a course quotation',!!b&&/supplemental/i.test(b.title)&&b.source==='memorise',b&&JSON.stringify({title:b.title,source:b.source}));
}
console.log('\n  CUR-MOD-03 reconstruction assertions: passed='+pass+' failed='+fail);
if(process.env.DSA_JSON_OUT)fs.writeFileSync(process.env.DSA_JSON_OUT,JSON.stringify({suite:'dijkstra_path',passed:pass,failed:fail,results},null,1));
process.exitCode=fail?1:0;
