#!/usr/bin/env node
/* Audit the manual pseudocode -> C bridge rendering in a real browser.

   manual-boundary-v62.js decides, in the page, which blocks are "manual
   pseudocode" and which bridge converts each one. It renders
   data-bridge="missing" itself when a manual pseudocode block has no
   registered conversion. Text inspection of manual-boundary-data.js cannot
   reproduce that decision, so this tool reads the rendered result.

   Two checks, both on what a student actually sees:
     PAIR-MISSING  a manual pseudocode block rendered with no C conversion
     PAIR-ROUTINE  the C column does not define the routine the pseudocode
                   column names (the student is shown the wrong conversion)
   It also reports bridge tokens that never matched any rendered block, which
   is a claim the data makes and the app never honours. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const BASE=process.env.DSA_BASE_URL||'http://127.0.0.1:8137';
const OUT=process.env.DSA_BRIDGE_AUDIT_OUT||'/home/claude/work/artifacts/manual_bridge_audit.json';
const PAGES=['foundations.html','searching-sorting.html','adts.html','trees.html',
             'graphs.html','graph-algorithms.html','hashing.html'];
const canon=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');

(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage();
  const pageErrors=[];
  p.on('pageerror',e=>pageErrors.push(String(e&&e.message||e)));
  const problems=[],pairs=[];
  const tokensSeen=new Set();
  let bridgeTokens=[];

  for(const page of PAGES){
    await p.goto(`${BASE}/${page}`,{waitUntil:'load'});
    if(!bridgeTokens.length){
      bridgeTokens=await p.evaluate(()=>(window.COMP2521_MANUAL_BRIDGES||[])
        .flatMap(x=>(x.tokens||[]).map(t=>({id:x.id,token:t}))));
    }
    /* MODULES is a script-scope const, so it is not a window property. The
       app publishes the list through COMP2521TracerTestAPI.moduleInventory. */
    const ids=await p.evaluate(()=>{
      const api=window.COMP2521TracerTestAPI;
      const inv=api&&typeof api.moduleInventory==='function'?api.moduleInventory():[];
      const list=Array.isArray(inv)?inv:(inv&&inv.modules)||[];
      return list.map(m=>m&&(m.id||m.moduleId)).filter(Boolean);
    });
    if(!ids.length) problems.push({kind:'AUDIT-NO-MODULES',page});
    for(const id of ids){
      /* A full load per module, not location.hash on an already-loaded page.
         Assigning the hash in place does not rebuild the boundary panel, so
         an in-place sweep reports zero pairs everywhere and would have been
         read as a dead feature. */
      await p.goto(`${BASE}/${page}#${id}`,{waitUntil:'load'});
      await p.waitForTimeout(260);
      const found=await p.evaluate(()=>Array.from(document.querySelectorAll('.manual-pair')).map(s=>({
        bridge:s.getAttribute('data-bridge'),
        title:(s.querySelector('h4')||{}).textContent||'',
        pseudo:((s.querySelectorAll('pre code')||[])[0]||{}).textContent||'',
        c:((s.querySelectorAll('pre code')||[])[1]||{}).textContent||''
      })));
      for(const f of found){
        pairs.push({module:id,page,...f});
        if(f.bridge==='missing'){
          problems.push({kind:'PAIR-MISSING',module:id,page,title:f.title.trim()});
          continue;
        }
        tokensSeen.add(f.bridge);
        /* routines the pseudocode column names: a name( at the start of a line */
        const named=[...new Set((f.pseudo.match(/^[A-Za-z][A-Za-z0-9_]*(?=\s*\()/gm)||[]))];
        const cc=canon(f.c);
        const absent=named.filter(n=>!cc.includes(canon(n)));
        if(absent.length) problems.push({kind:'PAIR-ROUTINE',module:id,page,
          bridge:f.bridge,title:f.title.trim(),pseudocodeNames:named,notInConversion:absent});
      }
    }
  }
  const deadTokens=bridgeTokens.filter(t=>!tokensSeen.has(t.id));
  const res={base:BASE,pagesVisited:PAGES.length,manualPairsRendered:pairs.length,
    bridgesMatched:[...tokensSeen].sort(),problems,
    bridgesNeverMatched:[...new Set(deadTokens.map(t=>t.id))].sort(),pageErrors};
  fs.mkdirSync(require('node:path').dirname(OUT),{recursive:true});
  fs.writeFileSync(OUT,JSON.stringify(res,null,2));
  console.log(`manual pairs rendered : ${pairs.length}`);
  console.log(`bridges matched       : ${res.bridgesMatched.length} -> ${res.bridgesMatched.join(', ')||'(none)'}`);
  console.log(`bridges never matched : ${res.bridgesNeverMatched.join(', ')||'(none)'}`);
  console.log(`page errors           : ${pageErrors.length}`);
  console.log(`problems              : ${problems.length}`);
  for(const pr of problems) console.log('  '+JSON.stringify(pr));
  console.log('evidence: '+OUT);
  await b.close();
  process.exit(problems.length||pageErrors.length?1:0);
})();
