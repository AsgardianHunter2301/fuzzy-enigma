#!/usr/bin/env node
/* Dump the live curriculum register from a real page load.

   CUR-MOD-01 replaced the group->single-week map with one reviewed register
   held inside course-enhancements.js's IIFE and published through
   window.COMP2521EnhancementTestAPI. Text extraction cannot read it (its
   entries are built by helper functions), and that is the correct design: the
   register is the single source the chips, tooltips and docs derive from.
   This tool therefore reads it from an actual browser page load, which is the
   most faithful source available, and writes it as JSON for the inventory and
   matrix generators. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const BASE=process.env.DSA_BASE_URL||'http://127.0.0.1:8137';
const OUT=process.env.DSA_REGISTER_OUT||'/home/claude/work/artifacts/curriculum_register.json';
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage();
  const errors=[];
  p.on('pageerror',e=>errors.push(String(e&&e.message||e)));
  /* Load every topic page so group coverage is complete. */
  const pages=['foundations.html','searching-sorting.html','adts.html','trees.html',
               'graphs.html','graph-algorithms.html','hashing.html'];
  const merged={admittedGroups:new Set(),excludedGroups:new Set(),register:{},scope:{},
                officialWeekSchedule:null,curriculumSources:null,perPage:{}};
  for(const f of pages){
    await p.goto(`${BASE}/${f}`,{waitUntil:'load'});
    await p.waitForTimeout(900);
    const got=await p.evaluate(()=>{
      const api=window.COMP2521EnhancementTestAPI;
      if(!api)return {missing:true};
      const ids=(window.MODULES||[]).map(m=>m.id);
      const out={version:api.version,admitted:api.admittedGroups(),excluded:api.excludedGroups(),
        weeks:api.officialWeekSchedule?api.officialWeekSchedule():null,
        sources:api.curriculumSources?api.curriculumSources():null,
        register:api.curriculumRegister?api.curriculumRegister():null,
        scope:{}};
      for(const id of ids){try{out.scope[id]=api.courseScope(id);}catch(e){}}
      return out;
    });
    if(got.missing){merged.perPage[f]={error:'COMP2521EnhancementTestAPI not present'};continue;}
    merged.perPage[f]={modules:Object.keys(got.scope||{}).length};
    (got.admitted||[]).forEach(g=>merged.admittedGroups.add(g));
    (got.excluded||[]).forEach(g=>merged.excludedGroups.add(g));
    Object.assign(merged.register,got.register||{});
    Object.assign(merged.scope,got.scope||{});
    merged.officialWeekSchedule=merged.officialWeekSchedule||got.weeks;
    merged.curriculumSources=merged.curriculumSources||got.sources;
    merged.version=got.version;
  }
  await b.close();
  const out={source:'live page load of '+BASE,generated:new Date().toISOString(),
    enhancementVersion:merged.version,
    admittedGroups:[...merged.admittedGroups].sort(),
    excludedGroups:[...merged.excludedGroups].sort(),
    officialWeekSchedule:merged.officialWeekSchedule,
    curriculumSources:merged.curriculumSources,
    moduleCount:Object.keys(merged.register).length,
    register:merged.register,scope:merged.scope,
    perPage:merged.perPage,pageErrors:errors};
  fs.mkdirSync(path.dirname(OUT),{recursive:true});
  fs.writeFileSync(OUT,JSON.stringify(out,null,1));
  console.log(JSON.stringify({out:OUT,enhancementVersion:out.enhancementVersion,
    admittedGroups:out.admittedGroups.length,excludedGroups:out.excludedGroups,
    moduleCount:out.moduleCount,weekRows:(out.officialWeekSchedule||[]).length,
    sources:Object.keys(out.curriculumSources||{}),pageErrors:errors.length},null,1));
  process.exitCode=(out.moduleCount&&!errors.length)?0:1;
})();
