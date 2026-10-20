#!/usr/bin/env node
/* Regenerate the derived fields of assets/topics.js from the live module
   registry, so the search index cannot drift from the modules it describes.

   assets/topics.js is generated data, but no generator shipped with the
   repository: its producer lived in a private assurance package. Any change
   to a module's block titles therefore left the search keywords stale. This
   tool closes that gap for the fields whose derivation is exactly known and
   was verified against the audited baseline:

     k = (module.keywords + ' ' + block titles joined), lowercased, collapsed
     b = number of source blocks
     l = total displayed source lines across those blocks

   Verified on commit 37ada3235c4d67f8b98c46afdb31c092b44419ed: b and l
   reproduce 68/68, k reproduces 67/68. The single exception is `coursemap`,
   whose name and keywords are curated overrides; its entry is preserved
   verbatim and listed in CURATED_OVERRIDES.

   The curated fields n (display name), g (group), p (page) and s (search
   text) are NOT regenerated: s is produced by an undocumented editorial
   heuristic, and inventing a replacement would change search behaviour
   without evidence. Run with --check to verify without writing.      */
'use strict';
const fs=require('node:fs'),path=require('node:path');
/* coursemap's display NAME and KEYWORDS are editorial overrides and are
   preserved. Its derived counts are NOT: b (block count) and l (displayed
   source lines) must still track the module, or the index goes stale the
   moment the coverage table changes - which is exactly what happened when
   the 93 coverage rows were split into per-capability records and
   reproduce/curriculum/inventory_modules.cjs began reporting a mismatch
   against topic.l. */
const CURATED_FIELDS_BY_MODULE=Object.freeze({coursemap:['k']});
const repo=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const loader=process.env.DSA_LOADER||'/home/claude/work/replay/reproduce/algorithm/load_modules.cjs';
const checkOnly=process.argv.includes('--check');

process.env.DSA_REPO_ROOT=repo;
const {api}=require(loader).load();
const file=path.join(repo,'assets','topics.js');
const src=fs.readFileSync(file,'utf8');
const re=/(window\.TRACER_TOPICS=)(\[[\s\S]*?\])(;\s*\nwindow\.TRACER_AREAS)/;
const m=re.exec(src);
if(!m){console.error('sync_topic_index: TRACER_TOPICS block not found');process.exit(2);}
const topics=JSON.parse(m[2]);
const norm=s=>String(s).toLowerCase().replace(/\s+/g,' ').trim();
const changes=[];
for(const t of topics){
  const curated=CURATED_FIELDS_BY_MODULE[t.i]||[];
  const mod=api.module(t.i);
  if(!mod){changes.push({id:t.i,field:'(module)',from:'present',to:'MISSING'});continue;}
  const blocks=mod.blocks||[];
  const next={
    k:norm((mod.keywords||'')+' '+blocks.map(b=>b.title).join(' ')),
    b:blocks.length,
    l:blocks.reduce((s,b)=>s+String(b.src||'').split('\n').length,0)
  };
  for(const f of ['k','b','l']){
    if(curated.includes(f))continue;
    if(t[f]!==next[f]){changes.push({id:t.i,field:f,from:t[f],to:next[f]});t[f]=next[f];}
  }
}
const ids=new Set(topics.map(t=>t.i));
const extra=api.inventory().map(x=>x.id).filter(id=>!ids.has(id));
if(extra.length)changes.push({id:extra.join(','),field:'(index)',to:'module not present in topics.js'});
console.log(JSON.stringify({file:path.relative(repo,file),entries:topics.length,
  curatedFieldsPreserved:CURATED_FIELDS_BY_MODULE,changeCount:changes.length,changes},null,1));
if(checkOnly){process.exitCode=changes.length?1:0;}
else if(changes.length){
  const body=JSON.stringify(topics).replace(/^\[/,'[').replace(/\},\{/g,'}, {');
  fs.writeFileSync(file,src.slice(0,m.index)+m[1]+body+m[3]+src.slice(m.index+m[0].length));
  console.log('# topics.js updated');
}else console.log('# no change needed');
