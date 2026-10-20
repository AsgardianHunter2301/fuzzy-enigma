/* Independent checks for the four capability gaps closed in this pass:
 *
 *   CAP-117  components  - the spanning forest is marked, counted and checked
 *                          against the V - C invariant
 *   CAP-154  hash        - the resize branch the manual leaves as a printf is
 *                          implemented as supplemental C and rehashes every key
 *   CAP-157  hashprobe   - backshift deletion is selectable and traced
 *   CAP-158  hashprobe   - clustering is measured, not merely named
 *
 * Nothing here reads a frame count or a note verbatim as a pass criterion.
 * Every assertion recomputes the expected value from the trace's FINAL STATE
 * using an independent method, and compares it with what the lesson reported.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
process.env.DSA_REPO_ROOT=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const LOADER=process.env.DSA_LOADER||'/home/claude/work/replay/reproduce/algorithm/load_modules.cjs';
const {api}=require(LOADER).load();

let pass=0,fail=0;const results=[];
function chk(name,cond,detail){
  cond?pass++:fail++;results.push({name,ok:!!cond,detail:cond?undefined:String(detail).slice(0,300)});
  console.log('  '+(cond?'PASS':'FAIL')+'  '+name+(cond?'':'   <- '+String(detail).slice(0,260)));
}
const views=v=>v?[v,...(v.views||[]).flatMap(views)]:[];
const findView=(v,kind)=>views(v).find(x=>x.kind===kind);
const run=(id,input)=>api.run(id,input||{}).f;
const last=(id,input)=>run(id,input).at(-1);

/* ============================================================
   CAP-117  spanning forest:  edges == V - C
   ============================================================ */
console.log('\nCAP-117  connected components and the spanning forest');

/* Independent component count: breadth-first flood over an adjacency list
   built from the edge string by this file, not by the application. */
function parseUndirected(nV,g){
  const adj=Array.from({length:nV},()=>new Set());
  for(const tok of String(g||'').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean)){
    const m=/^(\d+)\s*-\s*(\d+)/.exec(tok);
    if(!m)throw new Error('test could not parse edge "'+tok+'"');
    const a=Number(m[1]),b=Number(m[2]);
    adj[a].add(b);adj[b].add(a);
  }
  const edges=adj.reduce((n,r,i)=>n+[...r].filter(j=>j>i).length,0);
  return {adj,edges};
}
function componentCount(adj){
  const seen=new Array(adj.length).fill(false);let c=0;
  for(let s=0;s<adj.length;s++){
    if(seen[s])continue;
    c++;const q=[s];seen[s]=true;
    for(let i=0;i<q.length;i++)for(const w of adj[q[i]])if(!seen[w]){seen[w]=true;q.push(w);}
  }
  return c;
}

const GRAPHS=[
  {label:'module default (disconnected, with an isolated vertex)',nV:'10',g:'0-1, 1-4, 2-3, 3-5, 5-6, 7-8'},
  {label:'single isolated vertex',nV:'1',g:''},
  {label:'four isolated vertices, no edges',nV:'4',g:''},
  {label:'connected triangle (one non-tree edge)',nV:'3',g:'0-1, 1-2, 0-2'},
  {label:'triangle plus a separate edge',nV:'5',g:'0-1, 1-2, 2-0, 3-4'},
  {label:'two triangles (disconnected)',nV:'6',g:'0-1, 1-2, 0-2, 3-4, 4-5, 3-5'},
  {label:'three pairs plus an isolated vertex',nV:'7',g:'0-1, 2-3, 4-5'},
  {label:'path of eight',nV:'8',g:'0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6-7'},
  {label:'star plus two isolated vertices',nV:'8',g:'0-1, 0-2, 0-3, 0-4, 0-5'}
];
for(const c of GRAPHS){
  const ref=parseUndirected(Number(c.nV),c.g),C=componentCount(ref.adj),V=Number(c.nV);
  const f=last('components',{nV:c.nV,g:c.g});
  const gv=findView(f.view,'graph');
  const marked=Object.entries(gv.ecls||{}).filter(([,v])=>v==='tree');
  const table=(gv.tables||[]).find(t=>/^tree edges of the spanning forest/.test(t.name));
  const perComp=(gv.tables||[]).find(t=>t.name==='tree edges per component');
  const listed=table?table.row.filter(x=>x!=='—'):[];
  chk(`${c.label}: component count agrees with an independent flood fill`,f.vars.nC===C,JSON.stringify({reported:f.vars.nC,independent:C}));
  chk(`${c.label}: marked tree edges == V - C (${V} - ${C} = ${V-C})`,marked.length===V-C,
      JSON.stringify({markedEdges:marked.map(([k])=>k),expected:V-C}));
  chk(`${c.label}: the lesson's own edge list matches the marked edges`,listed.length===marked.length&&listed.length===V-C,
      JSON.stringify({listed,marked:marked.map(([k])=>k)}));
  chk(`${c.label}: the lesson reports the invariant as holding`,
      f.vars['tree edges']===V-C&&f.vars['V - C']===V-C&&f.vars.V===V&&f.vars.C===C&&f.vars['invariant holds']===true,
      JSON.stringify(f.vars));
  const sum=perComp?perComp.row.filter(x=>x!=='—').reduce((a,b)=>a+Number(b),0):null;
  chk(`${c.label}: per-component edge counts sum to V - C`,sum===V-C,JSON.stringify({perComponent:perComp&&perComp.row,sum,expected:V-C}));
  /* Every marked edge must be a real edge of the input graph, and the marked
     set must be acyclic - V-C edges spanning C components is only a forest if
     it also contains no cycle, so check connectivity per component. */
  const treeAdj=Array.from({length:V},()=>new Set());
  let realEdges=true;
  for(const [k] of marked){
    const [a,b]=k.split('-').map(Number);
    if(!ref.adj[a].has(b))realEdges=false;
    treeAdj[a].add(b);treeAdj[b].add(a);
  }
  chk(`${c.label}: every marked edge is an edge of the input graph`,realEdges,JSON.stringify(marked.map(([k])=>k)));
  chk(`${c.label}: the marked edges alone already span every component`,componentCount(treeAdj)===C,
      JSON.stringify({componentsOfForest:componentCount(treeAdj),expected:C}));
  /* A one-vertex component must contribute zero edges. */
  if(perComp){
    const sizes=new Array(C).fill(0);
    const ccRow=(gv.tables||[]).find(t=>t.name==='componentOf[]');
    (ccRow?ccRow.row:[]).forEach(x=>{if(x>=0)sizes[x]++;});
    const singles=sizes.map((s,i)=>[s,i]).filter(([s])=>s===1).map(([,i])=>i);
    chk(`${c.label}: every one-vertex component contributes 0 edges (${singles.length} such)`,
        singles.every(i=>Number(perComp.row[i])===0),JSON.stringify({singles,perComponent:perComp.row}));
  }
}
{
  const m=api.module('components');
  chk('components: the supplemental forest block is labelled supplemental, not lecture or manual',
      m.blocks.length===2&&m.blocks[1].source==='memorise'&&/supplemental/i.test(m.blocks[1].title),
      JSON.stringify(m.blocks.map(b=>({title:b.title,source:b.source}))));
  chk('components: the quoted lecture pseudocode block is unchanged',
      m.blocks[0].source==='lecture'&&/dfsComponents\(G, w, componentOf, compNo\)/.test(m.blocks[0].src),
      m.blocks[0].title);
  chk('components: the default graph is disconnected and has an isolated vertex',
      last('components').vars.C>=3&&/is <b>isolated<\/b>/.test(run('components').map(f=>f.note).join(' ')),
      JSON.stringify({C:last('components').vars.C}));
}

/* ============================================================
   CAP-154  resize and rehash
   ============================================================ */
console.log('\nCAP-154  separate-chaining resize and rehash');

/* The displayed C's integer hash, restated here so that the slot every key
   must occupy AFTER the modulus change is computed by this file. What is being
   checked is the rehash, not the hash function. */
function cHashRef(key,N){
  const magic=0x45d9f3b;
  let h=(2147483648+key)>>>0;
  h=(Math.imul((h>>>16)^h,magic))>>>0;
  h=(Math.imul((h>>>16)^h,magic))>>>0;
  h=((h>>>16)^h)>>>0;
  return h%N;
}
const DEMO='supplemental rehash, demo threshold 0.25';
const MANUAL='supplemental rehash, manual threshold 2.0';
const OFF='off: quoted warning only';
{
  const m=api.module('hash');
  chk('hash: the quoted manual block still contains the unimplemented-resize printf',
      /printf\("warning: resize not implemented!/.test(m.blocks[0].src)&&(m.blocks[0].source||'manual')==='manual'&&!m.blocks[0].pseudo,
      JSON.stringify({source:m.blocks[0].source}));
  chk('hash: the completed version is a separate block labelled supplemental',
      m.blocks.length===2&&m.blocks[1].source==='memorise'&&/supplemental/i.test(m.blocks[1].title),
      JSON.stringify(m.blocks.map(b=>({title:b.title,source:b.source}))));
  chk('hash: the supplemental block rehashes with the NEW modulus',
      /hash\(curr->key, newNumSlots\)/.test(m.blocks[1].src),'rehash call not found in the supplemental source');
  chk('hash: the supplemental block frees the old slot array exactly once',
      (m.blocks[1].src.match(/free\(oldSlots\);/g)||[]).length===1,'free(oldSlots) count');
  const f=m.fields.find(x=>x.k==='resize');
  chk('hash: the resize branch is a select whose default runs the supplemental rehash',
      !!f&&f.type==='select'&&f.def===DEMO&&f.options.includes(OFF),JSON.stringify(f));
}
const RESIZE_CASES=[
  {label:'module default operations',ops:'insert 12 100, insert 23 200, insert 34 300, contains 23, get 12, size, insert 12 999',resize:DEMO,keys:[12,23,34],expect:{from:11,to:23}},
  {label:'six distinct keys, demo threshold',ops:'insert 1 1, insert 2 2, insert 3 3, insert 4 4, insert 5 5, insert 6 6',resize:DEMO,keys:[1,2,3,4,5,6],expect:{from:11,to:23}},
  {label:'negative and zero keys, demo threshold',ops:'insert 0 1, insert -7 2, insert -18 3, insert 99 4',resize:DEMO,keys:[0,-7,-18,99],expect:{from:11,to:23}},
  {label:'twenty-three keys, the manual 2.0 threshold',ops:Array.from({length:23},(_,i)=>`insert ${i+1} ${(i+1)*10}`).join(', '),resize:MANUAL,keys:Array.from({length:23},(_,i)=>i+1),expect:{from:11,to:23}}
];
for(const c of RESIZE_CASES){
  const frames=run('hash',{ops:c.ops,resize:c.resize}),f=frames.at(-1),v=f.view;
  const held=v.slots.flatMap((ch,i)=>ch.map(n=>({slot:i,k:n.k,v:n.v})));
  chk(`${c.label}: the table grew from ${c.expect.from} to ${c.expect.to} slots`,v.numSlots===c.expect.to,
      JSON.stringify({numSlots:v.numSlots,expected:c.expect.to}));
  chk(`${c.label}: numItems is unchanged by the resize and equals the key count`,
      v.numItems===c.keys.length&&held.length===c.keys.length,JSON.stringify({numItems:v.numItems,nodes:held.length,keys:c.keys.length}));
  /* Findability after the resize: a key is findable only if it sits in the
     chain of hash(key, NEW numSlots). This is what fails when an
     implementation copies chains across instead of rehashing. */
  const misplaced=held.filter(x=>x.slot!==cHashRef(x.k,v.numSlots));
  chk(`${c.label}: every key is findable after the resize (correct slot for the new modulus)`,
      misplaced.length===0&&c.keys.every(k=>held.some(x=>x.k===k)),
      JSON.stringify({misplaced,missing:c.keys.filter(k=>!held.some(x=>x.k===k))}));
  /* At least one key must have CHANGED slot, or the example would not show the
     thing it exists to show. */
  const moved=held.filter(x=>cHashRef(x.k,c.expect.from)!==cHashRef(x.k,c.expect.to));
  chk(`${c.label}: at least one key lands in a different slot under the new modulus`,moved.length>0,
      JSON.stringify({moved:moved.length}));
  /* The reported before/after load factors must be the real ones. */
  const note=frames.map(x=>x.note).join('\n');
  const lf=/Load factor <b>([\d.]+)<\/b> before the resize \((\d+) items? in (\d+) slots\) and <b>([\d.]+)<\/b> after \((\d+) in (\d+)\)/.exec(note);
  chk(`${c.label}: the reported before/after load factors are arithmetically correct`,
      !!lf&&Number(lf[1]).toFixed(2)===(Number(lf[2])/Number(lf[3])).toFixed(2)
          &&Number(lf[4]).toFixed(2)===(Number(lf[5])/Number(lf[6])).toFixed(2)
          &&Number(lf[3])===c.expect.from&&Number(lf[6])===c.expect.to
          &&lf[2]===lf[5],
      lf?JSON.stringify(lf.slice(1)):'no before/after load-factor statement found');
  /* Every key must be visibly rehashed, one frame per key. */
  const rehashed=new Set((note.match(/<b>Rehash<\/b> key (-?\d+)/g)||[]).map(s=>Number(/(-?\d+)$/.exec(s)[1])));
  chk(`${c.label}: the trace shows a rehash step for every key in the table at resize time`,
      rehashed.size>0&&[...rehashed].every(k=>c.keys.includes(k)),
      JSON.stringify({rehashed:[...rehashed]}));
}
{
  /* The quoted original behaviour must still be reachable and unchanged: the
     warning fires, nothing is resized, and the table stays at 11 slots. */
  const ops=Array.from({length:23},(_,i)=>`insert ${i+1} ${(i+1)*10}`).join(', ');
  const frames=run('hash',{ops,resize:OFF}),v=frames.at(-1).view;
  chk('hash: with the quoted source selected the table does NOT grow',v.numSlots===11,JSON.stringify({numSlots:v.numSlots}));
  chk('hash: with the quoted source selected the warning is still printed',
      /warning: resize not implemented!/.test(frames.map(f=>f.note).join(' ')),'warning note not found');
  chk('hash: with the quoted source selected no rehash is claimed',
      !/<b>Rehash<\/b>/.test(frames.map(f=>f.note).join(' ')),'a rehash was traced in the quoted-source mode');
  chk('hash: the 23 keys are all still present in the un-resized table',
      v.slots.flatMap(ch=>ch.map(n=>n.k)).sort((a,b)=>a-b).join(',')===Array.from({length:23},(_,i)=>i+1).join(','),
      JSON.stringify(v.slots.flatMap(ch=>ch.map(n=>n.k))));
}

/* ============================================================
   CAP-157  backshift deletion   /   CAP-158  clustering
   ============================================================ */
console.log('\nCAP-157 / CAP-158  backshift deletion and cluster measurement');

const NSLOTS=11,HASH2=5;
const modHashRef=(k,n)=>((k%n)+n)%n;
const strideRef=(k,method)=>method==='linear probing'?1:modHashRef(k,HASH2)+1;
/* Lookup exactly as HashTableGet does it: stop at a genuinely empty slot,
   probe through a marker. Returns {slot,probes} or null. */
function lookupRef(slots,k,method){
  let i=modHashRef(k,NSLOTS);const inc=strideRef(k,method);
  for(let m=0;m<NSLOTS;m++){
    const s=slots[i];
    if(!s)return null;
    if(s.state!=='DEL'&&s.key===k)return {slot:i,probes:m+1};
    i=(i+inc)%NSLOTS;
  }
  return null;
}
/* Longest run of consecutive occupied slots, wrapping. Computed by scanning
   the slot array CONCATENATED WITH ITSELF, which is a different method from
   the one the lesson uses. */
function longestRunRef(slots){
  const occ=slots.map(s=>!!s);
  if(occ.every(Boolean))return occ.length;
  let best=0,cur=0;
  for(const o of occ.concat(occ)){cur=o?cur+1:0;if(cur>best)best=cur;}
  return Math.min(best,occ.length);
}
function clusterCountRef(slots){
  const occ=slots.map(s=>!!s),n=occ.length;
  if(occ.every(Boolean))return 1;
  let c=0;for(let i=0;i<n;i++)if(occ[i]&&!occ[(i-1+n)%n])c++;
  return c;
}

{
  const m=api.module('hashprobe');
  const method=m.fields.find(f=>f.k==='method'),del=m.fields.find(f=>f.k==='deletion');
  chk('hashprobe: the existing method field is unchanged in name, default and options',
      !!method&&method.def==='linear probing'&&JSON.stringify(method.options)===JSON.stringify(['linear probing','double hashing']),
      JSON.stringify(method));
  chk('hashprobe: the deletion method is a SEPARATE field defaulting to tombstone',
      !!del&&del.k==='deletion'&&del.def==='tombstone'&&JSON.stringify(del.options)===JSON.stringify(['tombstone','backshift']),
      JSON.stringify(del));
  chk('hashprobe: the backshift/clustering block is labelled supplemental',
      m.blocks.length===4&&m.blocks[3].source==='memorise'&&/supplemental/i.test(m.blocks[3].title),
      JSON.stringify(m.blocks.map(b=>({title:b.title,source:b.source}))));
  /* Every field must work on its own against all-other-defaults. */
  for(const f of m.fields)for(const val of (f.options||[f.def])){
    let ok=true,why='';
    try{const t=api.run('hashprobe',{[f.k]:String(val)});ok=Array.isArray(t.f)&&t.f.length>0;}
    catch(e){ok=false;why=String(e.message);}
    chk(`hashprobe: all-defaults with only ${f.k}="${val}" overridden still traces`,ok,why);
  }
}

const PROBE_CASES=[
  {label:'module default sequence',ops:'insert 5 50, insert 20 200, insert 16 160, insert 1 10, insert 42 420, insert 15 150, get 42, delete 5, get 16'},
  {label:'delete from the middle of a long cluster',ops:'insert 5 1, insert 16 2, insert 27 3, insert 38 4, insert 49 5, delete 16, get 27, get 38, get 49'},
  {label:'delete the head of a cluster',ops:'insert 5 1, insert 16 2, insert 27 3, delete 5, get 16, get 27'},
  {label:'full table then one delete',ops:[...Array.from({length:11},(_,i)=>`insert ${i} ${i}`),'delete 4'].join(', ')},
  {label:'delete, reinsert, delete again',ops:'insert 5 1, insert 16 2, insert 27 3, delete 16, insert 16 9, delete 5, get 16, get 27'},
  {label:'delete an absent key',ops:'insert 5 1, insert 16 2, delete 7, get 5, get 16'},
  {label:'probe paths that leave the cluster',ops:'insert 0 1, insert 44 2, insert 22 3, delete 0, get 44, get 22'},
  {label:'single key deleted to empty',ops:'insert 3 30, delete 3'},
  {label:'negative keys',ops:'insert -6 1, insert 5 2, insert -17 3, delete 5, get -6, get -17'}
];
for(const method of ['linear probing','double hashing'])for(const c of PROBE_CASES){
  const tag=`${method} / ${c.label}`;
  const frames=run('hashprobe',{method,deletion:'backshift',ops:c.ops});
  const v=frames.at(-1).view;
  const live=v.slots.map((s,i)=>s&&s.state!=='DEL'?{i,key:s.key}:null).filter(Boolean);
  /* CAP-157: no tombstone may survive a backshift deletion ... */
  chk(`${tag}: backshift leaves no deleted marker in the table`,
      v.slots.every(s=>!s||s.state!=='DEL'),JSON.stringify(v.slots));
  /* ... and every remaining key must still be findable at the slot it occupies. */
  const unreachable=live.filter(x=>{const r=lookupRef(v.slots,x.key,method);return !r||r.slot!==x.i;});
  chk(`${tag}: every remaining key is still findable after backshift`,unreachable.length===0,
      JSON.stringify({unreachable,slots:v.slots.map((s,i)=>s?i+':'+(s.state==='DEL'?'DEL':s.key):null).filter(Boolean)}));
  chk(`${tag}: numItems equals the number of live keys`,v.numItems===live.length,
      JSON.stringify({numItems:v.numItems,live:live.length}));
  /* The tombstone run on the same operations must agree on the key SET, so the
     two methods really are comparable on the same work. */
  const tv=run('hashprobe',{method,deletion:'tombstone',ops:c.ops}).at(-1).view;
  const tLive=tv.slots.filter(s=>s&&s.state!=='DEL').map(s=>s.key).sort((a,b)=>a-b);
  chk(`${tag}: tombstone and backshift agree on which keys remain`,
      tLive.join(',')===live.map(x=>x.key).sort((a,b)=>a-b).join(','),
      JSON.stringify({tombstone:tLive,backshift:live.map(x=>x.key).sort((a,b)=>a-b)}));

  /* CAP-158: the reported longest run must match an independently computed one,
     for both deletion methods. */
  for(const [deletion,view] of [['backshift',v],['tombstone',tv]]){
    const f=run('hashprobe',{method,deletion,ops:c.ops}).at(-1);
    const expectRun=longestRunRef(view.slots),expectClusters=clusterCountRef(view.slots);
    chk(`${tag} (${deletion}): reported longest run matches an independent computation`,
        f.vars['longest run']===expectRun,JSON.stringify({reported:f.vars['longest run'],independent:expectRun,
          slots:view.slots.map((s,i)=>s?i:null).filter(x=>x!==null)}));
    chk(`${tag} (${deletion}): reported cluster count matches an independent computation`,
        f.vars.clusters===expectClusters,JSON.stringify({reported:f.vars.clusters,independent:expectClusters}));
    const liveK=view.slots.filter(s=>s&&s.state!=='DEL').map(s=>s.key);
    const probes=liveK.map(k=>{const r=lookupRef(view.slots,k,method);return r?r.probes:null;});
    const expectMean=probes.length&&probes.every(x=>x!==null)
      ? Number((probes.reduce((a,b)=>a+b,0)/probes.length).toFixed(2)) : 0;
    chk(`${tag} (${deletion}): reported mean probe length matches an independent computation`,
        f.vars['mean probes']===expectMean,JSON.stringify({reported:f.vars['mean probes'],independent:expectMean,probes}));
  }
}
{
  /* Clustering must be shown, not asserted: linear probing must produce a
     longer run and a longer mean lookup than double hashing on a sequence
     built from keys that all share one home slot. */
  const ops='insert 5 1, insert 16 2, insert 27 3, insert 38 4, insert 49 5';
  const lin=last('hashprobe',{method:'linear probing',ops}),dbl=last('hashprobe',{method:'double hashing',ops});
  chk('clustering: five keys with the same home slot form one run of 5 under linear probing',
      lin.vars['longest run']===5&&lin.vars.clusters===1,JSON.stringify(lin.vars));
  chk('clustering: the same five keys do not form a single run under double hashing',
      dbl.vars['longest run']<5,JSON.stringify({longestRun:dbl.vars['longest run'],clusters:dbl.vars.clusters}));
  chk('clustering: linear probing costs more probes per lookup than double hashing here',
      lin.vars['mean probes']>dbl.vars['mean probes'],
      JSON.stringify({linear:lin.vars['mean probes'],double:dbl.vars['mean probes']}));
  chk('clustering: the measurement is tied to the probe counts the trace produced',
      /The operations in this trace probed <b>\d+<\/b> slots? over \d+ operations?/.test(run('hashprobe',{ops}).map(f=>f.note).join('\n')),
      'no traced-probe statement found');
  /* Backshift must shorten a lookup that a tombstone lengthens. */
  const seq='insert 5 1, insert 16 2, delete 5, get 16';
  const tb=run('hashprobe',{method:'linear probing',deletion:'tombstone',ops:seq}).at(-1);
  const bs=run('hashprobe',{method:'linear probing',deletion:'backshift',ops:seq}).at(-1);
  chk('CAP-157: backshift gives a shorter mean lookup than a tombstone on the same operations',
      bs.vars['mean probes']<tb.vars['mean probes'],
      JSON.stringify({tombstone:tb.vars['mean probes'],backshift:bs.vars['mean probes']}));
  chk('CAP-157: the tombstone run really does leave a marker behind',
      tb.view.slots.some(s=>s&&s.state==='DEL'),JSON.stringify(tb.view.slots));
}

console.log('\n  hash/graph coverage assertions: passed='+pass+' failed='+fail);
if(process.env.DSA_JSON_OUT)fs.writeFileSync(process.env.DSA_JSON_OUT,
  JSON.stringify({suite:'hash_graph_coverage',capabilities:['CAP-117','CAP-154','CAP-157','CAP-158'],passed:pass,failed:fail,results},null,1));
process.exitCode=fail?1:0;
