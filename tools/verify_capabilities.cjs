#!/usr/bin/env node
/* Independent verification that each previously-open capability now has a real
   destination.

   This does NOT read any report, note wording or status field. For each
   capability it names one OBSERVABLE and checks it against a live page: either
   the module traces under a specific input, or a stated quantity is present in
   the frames the module produced and agrees with a value computed here. Where
   the original audit recorded a concrete failure ("radix throws for 7 42 318",
   "the periodic mode produces a single frame"), that exact condition is the
   thing re-tested, so the close is measured against the finding, not against
   the fix's own description. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const BASE=process.env.DSA_BASE_URL||'http://127.0.0.1:8137';
const OUT=process.env.DSA_CAP_OUT||'/home/claude/work/artifacts/capability_verification.json';

/* page -> [ {id, cap, what, run} ]  run() executes IN the browser. */
const CHECKS=[
 ['searching-sorting.html',[
  {cap:'CAP-026',what:'sortprops states why sorting is worth doing, with the search break-even',
   fn:()=>{const f=window.COMP2521TracerTestAPI.runModule('sortprops',{});
     const t=JSON.stringify(f);
     return {ok:/binary search/i.test(t)&&/log/i.test(t)&&/\b(break-even|pays for itself|20)\b/i.test(t),
             detail:'frames='+f.length};}},
  {cap:'CAP-028',what:'the array sorts state the Item type and the key-comparison macros',
   fn:()=>{const ids=['sel','bub','ins','ms','qs','q3'];
     /* The type statement is the module's note - metadata shown beside the
        trace - not a frame, so it is read from the inventory. */
     const inv=window.COMP2521TracerTestAPI.moduleInventory()||[];
     const noteOf=i=>String((inv.find(m=>m.id===i)||{}).note||'');
     const naming=ids.filter(i=>/Item/.test(noteOf(i)));
     const sp=JSON.stringify(window.COMP2521TracerTestAPI.runModule('sortprops',{}))+noteOf('sortprops');
     return {ok:naming.length===6&&/typedef\s+int\s+Item/.test(sp)&&/(less|lt|LT|macro)/i.test(sp),
             detail:'sorts whose note names Item: '+naming.length+'/6'};}},
  {cap:'CAP-037',what:'listsorts traces selection and bubble, not only insertion',
   fn:()=>{const r={};for(const m of ['insertion','selection','bubble']){
       try{r[m]=window.COMP2521TracerTestAPI.runModule('listsorts',{method:m}).length;}
       catch(e){r[m]='THREW: '+e.message;}}
     return {ok:typeof r.selection==='number'&&r.selection>1&&typeof r.bubble==='number'&&r.bubble>1,
             detail:JSON.stringify(r)};}},
  {cap:'CAP-051',what:'radix accepts the mixed-width input the audit recorded as refused (7 42 318)',
   fn:()=>{try{const f=window.COMP2521TracerTestAPI.runModule('radix',{a:'7 42 318'});
       return {ok:f.length>1,detail:'frames='+f.length};}
     catch(e){return {ok:false,detail:'THREW: '+e.message};}}}]],

 ['trees.html',[
  {cap:'CAP-066',what:'bsttrav defines the terminology and states the height convention',
   fn:()=>{const t=JSON.stringify(window.COMP2521TracerTestAPI.runModule('bsttrav',{}));
     return {ok:/\broot\b/i.test(t)&&/\bleaf|leaves\b/i.test(t)&&/height/i.test(t)&&/-1|minus one/.test(t),
             detail:'terminology+height convention present'};}},
  {cap:'CAP-076',what:'bstrebalance states the size-balance condition and its boundary',
   fn:()=>{const t=JSON.stringify(window.COMP2521TracerTestAPI.runModule('bstrebalance',{mode:'global'}));
     /* The condition is taught by showing where it breaks: difference 1 is the
        largest allowed, difference 2 is not balanced. Both must be present, so
        a lesson that merely mentions "size" cannot pass. */
     const boundary=/difference 1[^"]{0,40}largest allowed/i.test(t)&&/difference 2/i.test(t);
     const inequality=/(&lt;=|&le;|<=|≤)\s*1/.test(t)||/at most 1/i.test(t);
     return {ok:/size/i.test(t)&&(boundary||inequality),
             detail:'boundary demo='+boundary+' inequality='+inequality};}},
  {cap:'CAP-083',what:'the periodic mode traces instead of producing one prose frame',
   fn:()=>{const f=window.COMP2521TracerTestAPI.runModule('bstrebalance',{mode:'periodic reference'});
     return {ok:f.length>1,detail:'frames='+f.length+' (audit recorded 1)'};}},
  {cap:'CAP-087',what:'avlheight states the O(log n) height guarantee',
   fn:()=>{const t=JSON.stringify(window.COMP2521TracerTestAPI.runModule('avlheight',{}));
     return {ok:/log/i.test(t)&&/(2\s*[·*x]?\s*log|1\.44|O\(log)/i.test(t),
             detail:'bound stated'};}},
  {cap:'CAP-093',what:'an AVL search is traced and the displayed C names avlSearch',
   fn:()=>{let f;try{f=window.COMP2521TracerTestAPI.runModule('avldel',{op:'search'});}
     catch(e){return {ok:false,detail:'THREW: '+e.message};}
     const blocks=JSON.stringify((window.COMP2521TracerTestAPI.moduleInventory()||[])
       .find(m=>m.id==='avldel')||{});
     return {ok:f.length>1&&/avlSearch/i.test(blocks+JSON.stringify(f)),
             detail:'frames='+f.length};}}]],

 ['graph-algorithms.html',[
  {cap:'CAP-117',what:'components marks tree edges and checks the V - C invariant',
   fn:()=>{const f=window.COMP2521TracerTestAPI.runModule('components',{});
     const t=JSON.stringify(f);
     /* recompute V - C from the lesson's own reported vars */
     const last=f[f.length-1]||{};
     const vars=f.map(x=>x&&x.vars).filter(Boolean);
     const withInv=vars.find(v=>v&&('V - C' in v));
     let agrees=false;
     if(withInv){const V=Number(withInv.V),C=Number(withInv.C),TE=Number(withInv['tree edges']);
       agrees=Number.isFinite(V)&&Number.isFinite(C)&&TE===V-C;}
     return {ok:/tree edge/i.test(t)&&agrees,
             detail:withInv?JSON.stringify({V:withInv.V,C:withInv.C,treeEdges:withInv['tree edges']}):'no invariant vars'};}}]],

 ['foundations.html',[
  {cap:'CAP-146',what:'union-find is present in namedalgos with the find(v)==find(w) test',
   fn:()=>{const t=JSON.stringify(window.COMP2521TracerTestAPI.runModule('namedalgos',{}))+
       JSON.stringify((window.COMP2521TracerTestAPI.moduleInventory()||[]).find(m=>m.id==='namedalgos')||{});
     return {ok:/union[- ]?find/i.test(t)&&/find\s*\(/.test(t),detail:'union-find named'};}}]],

 ['hashing.html',[
  {cap:'CAP-154',what:'the hash table actually resizes and rehashes rather than warning',
   fn:()=>{const f=window.COMP2521TracerTestAPI.runModule('hash',{});
     const slots=f.map(x=>x&&x.vars&&(x.vars.numSlots??x.vars['numSlots']))
                  .filter(v=>Number.isFinite(Number(v))).map(Number);
     const grew=slots.length&&Math.max(...slots)>Math.min(...slots);
     return {ok:!!grew&&/rehash/i.test(JSON.stringify(f)),
             detail:'numSlots '+(slots.length?Math.min(...slots)+' -> '+Math.max(...slots):'not reported')};}},
  {cap:'CAP-157',what:'backshift deletion leaves no tombstone, and keys stay findable',
   fn:()=>{let f;try{f=window.COMP2521TracerTestAPI.runModule('hashprobe',{deletion:'backshift'});}
     catch(e){return {ok:false,detail:'THREW: '+e.message};}
     const last=f[f.length-1]||{};
     const slots=(last.view&&last.view.slots)||[];
     const markers=JSON.stringify(slots).match(/deleted|tombstone|DEL/gi)||[];
     return {ok:f.length>1&&markers.length===0,
             detail:'frames='+f.length+' tombstones in final table='+markers.length};}},
  {cap:'CAP-158',what:'a clustering report is produced and its longest run is recomputable',
   fn:()=>{const f=window.COMP2521TracerTestAPI.runModule('hashprobe',{});
     /* The report runs BEFORE free, so the final frame's table is empty by
        design; the recomputation must use the reporting frame's own table. */
     const idx=f.findIndex(x=>x&&x.vars&&('longest run' in x.vars));
     if(idx<0) return {ok:false,detail:'no cluster vars in any frame'};
     const fr=f[idx];
     const views=(fr.view&&fr.view.views)||[fr.view];
     const tbl=views.find(v=>v&&Array.isArray(v.slots));
     if(!tbl) return {ok:false,detail:'reporting frame carries no slot table'};
     /* A slot counts as occupied when a lookup must probe through it, so a
        DEL marker counts. Doubled for wrap-around, then capped at nV. */
     const occupied=tbl.slots.map(s=>s!==null&&s!==undefined);
     let run=0,best=0;
     for(const o of occupied.concat(occupied)){run=o?run+1:0;if(run>best)best=run;}
     best=Math.min(best,occupied.length);
     return {ok:Number(fr.vars['longest run'])===best,
             detail:'reported='+fr.vars['longest run']+' recomputed='+best+
                    ' (frame '+idx+' of '+f.length+')'};}}]]
];

(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errs=[];page.on('pageerror',e=>errs.push(String(e&&e.message||e)));
  const results=[];
  for(const [pg,checks] of CHECKS){
    await page.goto(`${BASE}/${pg}`,{waitUntil:'load'});
    await page.waitForTimeout(400);
    for(const c of checks){
      let r;
      try{r=await page.evaluate(c.fn);}
      catch(e){r={ok:false,detail:'evaluate failed: '+String(e&&e.message||e)};}
      results.push({cap:c.cap,page:pg,what:c.what,...r});
      console.log(`  ${r.ok?'PASS':'FAIL'}  ${c.cap}  ${c.what}`);
      console.log(`          ${r.detail}`);
    }
  }
  await browser.close();
  const passed=results.filter(r=>r.ok).length;
  fs.mkdirSync(require('node:path').dirname(OUT),{recursive:true});
  fs.writeFileSync(OUT,JSON.stringify({base:BASE,passed,failed:results.length-passed,pageErrors:errs,results},null,1));
  console.log(`\n  capability verification: passed=${passed} failed=${results.length-passed}  pageErrors=${errs.length}`);
  console.log(`  evidence: ${OUT}`);
  process.exit(results.length-passed?1:0);
})();
