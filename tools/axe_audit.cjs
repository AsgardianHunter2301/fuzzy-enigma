#!/usr/bin/env node
/* Automated WCAG audit with axe-core, in real Chromium.

   SCOPE AND LIMITS, stated so the result is not over-read: axe-core is a
   STATIC rule engine. It finds machine-detectable failures (contrast, names,
   roles, landmarks, labels, ARIA validity, heading order). It does NOT
   establish that the app is usable with a screen reader: announcement order,
   live-region behaviour under a real reader, and keyboard flow through a
   running trace are not covered. A human screen-reader evaluation remains
   open and is recorded as such.

   Each page is audited twice: as loaded, and after a module has been run, so
   the dynamically built trace, variable and source panes are in the DOM. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const AXE=process.env.DSA_AXE||'/tmp/claude-0/-home-claude/929d206a-2b74-5f14-8b66-3ce46368d69c/scratchpad/axe/node_modules/axe-core/axe.min.js';
const BASE=process.env.DSA_BASE_URL||'http://127.0.0.1:8137';
const OUT=process.env.DSA_AXE_OUT||'/home/claude/work/artifacts/axe';
const TAGS=['wcag2a','wcag2aa','wcag21a','wcag21aa'];
const PAGES=['index.html','foundations.html','searching-sorting.html','adts.html',
             'trees.html','graphs.html','graph-algorithms.html','hashing.html'];
/* One representative traced module per topic page, so the generated panes are audited too. */
const TRACED={'searching-sorting.html':'bin','trees.html':'bstins','graphs.html':'bfspath',
              'graph-algorithms.html':'dijkstra','hashing.html':'hashprobe','adts.html':'stackarray',
              'foundations.html':null,'index.html':null};

(async()=>{
  if(!fs.existsSync(AXE)){console.error('axe-core not found at '+AXE);process.exit(2);}
  const axeSrc=fs.readFileSync(AXE,'utf8');
  fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch({args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const all=[];
  let violationCount=0,seriousOrCritical=0;

  async function audit(label,url,run){
    await page.goto(url,{waitUntil:'load'});
    await page.waitForTimeout(500);
    if(run){
      const btn=await page.$('#run');
      if(btn){await btn.click();await page.waitForTimeout(900);}
    }
    await page.evaluate(axeSrc);
    const res=await page.evaluate(async tags=>{
      const r=await window.axe.run(document,{runOnly:{type:'tag',values:tags}});
      return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,
        tags:v.tags.filter(t=>/^wcag/.test(t)),nodes:v.nodes.length,
        targets:v.nodes.slice(0,4).map(n=>String(n.target))})),
        passes:r.passes.length,incomplete:r.incomplete.map(i=>({id:i.id,nodes:i.nodes.length}))};
    },TAGS);
    for(const v of res.violations){
      violationCount+=v.nodes;
      if(v.impact==='serious'||v.impact==='critical')seriousOrCritical+=v.nodes;
    }
    all.push({label,url,...res});
    const worst=res.violations.map(v=>`${v.id}(${v.impact},${v.nodes})`).join(' ')||'none';
    console.log(`  ${label.padEnd(34)} passes=${String(res.passes).padEnd(3)} violations=${res.violations.length}  ${worst}`);
  }

  console.log(`axe-core ${JSON.parse(fs.readFileSync(path.join(path.dirname(AXE),'package.json'),'utf8')).version}  tags=${TAGS.join(',')}`);
  for(const p of PAGES){
    await audit(p,`${BASE}/${p}`,false);
    const m=TRACED[p];
    if(m) await audit(`${p}#${m} (after Run)`,`${BASE}/${p}#${m}`,true);
  }
  await browser.close();
  const summary={tool:'axe-core',tags:TAGS,base:BASE,
    scope:'static rule engine; does NOT establish screen-reader usability',
    audits:all.length,violationNodes:violationCount,seriousOrCriticalNodes:seriousOrCritical,results:all};
  fs.writeFileSync(path.join(OUT,'axe_audit.json'),JSON.stringify(summary,null,1));
  console.log(`\n  audits=${all.length}  violation nodes=${violationCount}  serious/critical=${seriousOrCritical}`);
  console.log(`  evidence: ${path.join(OUT,'axe_audit.json')}`);
  process.exit(seriousOrCritical?1:0);
})();
