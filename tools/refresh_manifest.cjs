#!/usr/bin/env node
/* Refresh the distribution manifest's FILE FACTS, and nothing else.

   MANIFEST.json and SHA256SUMS.txt describe the classroom distribution: the
   pages, assets, licences and the eleven Graph ADT study files. After the
   remediation they described the predecessor, so `sha256sum -c SHA256SUMS.txt`
   failed 40 of 71 lines and read as a corrupt tree rather than a stale record.

   What this tool updates: the file list (path, size, sha256), the checksum
   file, generatedDate, and the measured counts under `scope`.

   What it deliberately does NOT touch: `version`, `status` and `distribution`.
   Assigning a version or promoting a status is a publication decision that
   belongs to the owner, not to a refresh script. Instead it records a
   `remediation` block saying plainly that the content is the remediated
   successor and that those fields are still the owner's to set, so nobody
   reads 6.4.2 as a statement that this tree is the 6.4.2 distribution.

   --check verifies without writing, and is a release gate. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const CHECK=process.argv.includes('--check');
const TREE=process.argv.find((a,i)=>i>=2&&!a.startsWith('--'))||process.cwd();

/* The same selection the predecessor manifest used: every root file except the
   two manifest files themselves, plus assets, licences and the C study files.
   Derived, so a new asset cannot be silently left out. */
const SELF=new Set(['MANIFEST.json','SHA256SUMS.txt','.DS_Store','.gitignore']);
function select(){
  const out=[];
  for(const f of fs.readdirSync(TREE)){
    if(SELF.has(f))continue;
    if(fs.statSync(path.join(TREE,f)).isDirectory())continue;
    out.push(f);
  }
  for(const dir of ['assets','licences']){
    const d=path.join(TREE,dir);
    if(!fs.existsSync(d))continue;
    for(const f of fs.readdirSync(d).sort())out.push(`${dir}/${f}`);
  }
  const mg=path.join(TREE,'memorise_graph_c');
  if(fs.existsSync(mg))
    for(const f of fs.readdirSync(mg).sort())
      if(f.endsWith('.c'))out.push(`memorise_graph_c/${f}`);
  return out.sort();
}

const files=select().map(rel=>{
  const buf=fs.readFileSync(path.join(TREE,rel));
  return {path:rel,size:buf.length,
    sha256:crypto.createHash('sha256').update(buf).digest('hex')};
});

const mp=path.join(TREE,'MANIFEST.json');
const manifest=JSON.parse(fs.readFileSync(mp,'utf8'));
const sumsPath=path.join(TREE,'SHA256SUMS.txt');
const sums=files.map(f=>`${f.sha256}  ${f.path}`).join('\n')+'\n';

/* Measured counts, read from the smoke artefact when one is to hand; left
   alone rather than guessed when it is not. */
let measured=null;
for(const p of ['/home/claude/work/artifacts/root_smoke.json',
                path.join(TREE,'..','artifacts','root_smoke.json')]){
  try{const raw=JSON.parse(fs.readFileSync(p,'utf8'));
      /* root_smoke nests its counts under `summary`. */
      measured=raw&&raw.summary?raw.summary:raw;break;}catch(e){}
}

if(CHECK){
  const have=fs.existsSync(sumsPath)?fs.readFileSync(sumsPath,'utf8'):'';
  const listed=new Map((manifest.files||[]).map(f=>[f.path,f]));
  const problems=[];
  if(have!==sums)problems.push('SHA256SUMS.txt does not match the current tree');
  for(const f of files){
    const m=listed.get(f.path);
    if(!m){problems.push(`MANIFEST.json does not list ${f.path}`);continue;}
    if(m.sha256!==f.sha256)problems.push(`MANIFEST.json sha256 is stale for ${f.path}`);
    if(m.size!==f.size)problems.push(`MANIFEST.json size is stale for ${f.path}`);
    listed.delete(f.path);
  }
  for(const p of listed.keys())problems.push(`MANIFEST.json lists ${p}, which is not in the distribution`);
  console.log(`distribution files : ${files.length}`);
  console.log(`problems           : ${problems.length}`);
  for(const p of problems.slice(0,12))console.log('  '+p);
  if(problems.length>12)console.log(`  ... and ${problems.length-12} more`);
  console.log(problems.length?'MANIFEST CHECK: FAIL':'MANIFEST CHECK: PASS');
  process.exit(problems.length?1:0);
}

const before={files:(manifest.files||[]).length,
  frames:manifest.scope&&manifest.scope.paintedDefaultFrames};
manifest.files=files;
manifest.generatedDate=new Date().toISOString().slice(0,10);
if(measured&&manifest.scope){
  if(Number.isFinite(measured.frames))manifest.scope.paintedDefaultFrames=measured.frames;
  if(Number.isFinite(measured.modules))manifest.scope.registeredTopics=measured.modules;
}
manifest.remediation={
  note:'The CONTENT of this tree is the remediated successor, not the distribution named by '
      +'`version` and `status` above. Those two fields, and the decision to publish, are the '
      +"owner's and have deliberately not been changed by the remediation.",
  branch:'remediation/full-2026-10-20',
  baselinePreservedAt:'37ada3235c4d67f8b98c46afdb31c092b44419ed',
  fileFactsRefreshed:new Date().toISOString().slice(0,10),
  refreshedBy:'tools/refresh_manifest.cjs'
};
fs.writeFileSync(mp,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(sumsPath,sums);
console.log(`files listed       : ${before.files} -> ${files.length}`);
if(measured)console.log(`paintedDefaultFrames: ${before.frames} -> ${manifest.scope.paintedDefaultFrames}`);
console.log(`version / status   : left as "${manifest.version}" / "${manifest.status}" (owner's decision)`);
console.log('MANIFEST.json and SHA256SUMS.txt refreshed');
