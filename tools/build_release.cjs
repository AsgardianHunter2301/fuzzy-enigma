#!/usr/bin/env node
/* AUD-11 / AUD-12: build a verifiable release from an explicit allowlist.
 *
 * The audited distribution could never verify: MANIFEST.json and
 * SHA256SUMS.txt both declared `.gitignore`, which is not a tracked file, so
 * `sha256sum -c` reported one unreadable payload however correct the other 70
 * were. The fix is NOT to create the missing file to match a historical
 * digest. `.gitignore` is version-control configuration and `.DS_Store` is
 * workstation debris; neither is part of a classroom web application, so both
 * are excluded by policy and that policy is recorded here and in the output.
 *
 * Non-recursive scheme, in this order, because a manifest cannot contain a
 * trustworthy digest of itself:
 *   1. select payload files from the allowlist and finalise them;
 *   2. write MANIFEST.json listing ONLY payload files, with size + SHA-256,
 *      and naming the metadata files deliberately excluded from that list;
 *   3. write SHA256SUMS.txt covering the payload AND the manifest, excluding
 *      itself;
 *   4. build the archive from payload + metadata;
 *   5. hash the finished archive into a DETACHED receipt written outside it.
 *
 * Two distributions are produced, because the commission requires the
 * application and the richer assurance package to be distinguishable:
 *   app       - the static site a student loads
 *   assurance - the app plus tests, tools, generated docs and C suites
 *
 * Refuses to write when a selected path is missing, duplicated, outside the
 * source tree, absolute, a symlink, or matches an exclusion. Never overwrites
 * an existing output directory.
 *
 * Usage: node tools/build_release.cjs --out <new-dir> [--kind app|assurance|both]
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');

const repo=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const args=process.argv.slice(2);
const argOf=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:undefined;};
const outRoot=argOf('--out');
const kind=argOf('--kind')||'both';
if(!outRoot){console.error('usage: build_release.cjs --out <new-dir> [--kind app|assurance|both]');process.exit(2);}

/* ---------- policy ---------- */
const EXCLUDE_ALWAYS=[
  {pattern:/(^|\/)\.DS_Store$/, reason:'macOS Finder metadata; workstation debris, not an application asset'},
  {pattern:/(^|\/)\.gitignore$/,reason:'version-control configuration; not part of the deployed application. The audited manifest declared it while no such file existed in the tree, which is why the audited checksum check could not pass (AUD-11). A .gitignore now exists, to keep the regenerable dist/ build output out of version control, and it is still excluded from the distribution because it configures the repository rather than the application.'},
  {pattern:/(^|\/)\.git(\/|$)/, reason:'version-control database'},
  {pattern:/(^|\/)node_modules(\/|$)/,reason:'dependency cache'},
  {pattern:/(^|\/)_?build(\/|$)/, reason:'compiled output directory (covers build/ and _build/)'},
  {pattern:/\.(o|so|a|dylib|exe)$/, reason:'object file or compiled library'},
  {pattern:/\.(log|out|err)$/,    reason:'build or test transcript, not a distributable asset'},
  {pattern:/(^|\/)(asan|ubsan|lsan)[^/]*$/i, reason:'sanitizer scratch output'},
  {pattern:/(^|\/)c-results(\/|$)/, reason:'C harness output directory'},
  {pattern:/(^|\/)dist(\/|$)/, reason:'the deployable site folder and its zip are BUILT FROM this payload by tools/build_site.cjs, so packaging them here would ship a second copy of the application inside its own archive. Rebuild with that tool instead; tools/verify_site.sh proves the result serves from a domain root and from a subdirectory.'},
];
/* A distribution must never carry compiled binaries, however they arrived.
   This is a safety net behind the patterns above, not a replacement for them:
   it caught 124 artefacts (including ELF executables) that slipped through on
   the first run because the pattern matched `build/` but the directory was
   actually `_build/`. */
const ELF_MAGIC=Buffer.from([0x7f,0x45,0x4c,0x46]);
function looksExecutable(absolute){
  let fd;
  try{
    fd=fs.openSync(absolute,'r');
    const head=Buffer.alloc(4);
    fs.readSync(fd,head,0,4,0);
    return head.equals(ELF_MAGIC)||head.slice(0,2).toString('latin1')==='MZ';
  }catch(e){return false;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch(e){}}
}
/* The metadata files are packaged but are NOT members of the manifest's inner
   payload list, and SHA256SUMS.txt never covers itself. */
const METADATA=['MANIFEST.json','SHA256SUMS.txt'];
const APP_DIRS=['assets','licences','memorise_graph_c'];
const APP_ROOT_FILES=['index.html','foundations.html','searching-sorting.html','adts.html','trees.html',
  'graphs.html','graph-algorithms.html','hashing.html','README.md','DEPLOY.md',
  'THIRD_PARTY_NOTICES.md','MANUAL_BOUNDARY_GUIDE.md','MEMORISE_GRAPH_C_GUIDE.md',
  'OPEN_FIRST.md','RECOVERY.md','PUSH_THIS.md'];
const ASSURANCE_EXTRA_DIRS=['tests','tools','docs','bridges_c'];

const sha256=buf=>crypto.createHash('sha256').update(buf).digest('hex');
function walk(dir,base,acc){
  for(const name of fs.readdirSync(path.join(base,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    const rel=dir?dir+'/'+name.name:name.name;
    if(name.isSymbolicLink())  {acc.rejected.push({path:rel,reason:'symbolic link'});continue;}
    if(name.isDirectory())     {walk(rel,base,acc);continue;}
    if(!name.isFile())         {acc.rejected.push({path:rel,reason:'not a regular file'});continue;}
    const hit=EXCLUDE_ALWAYS.find(e=>e.pattern.test(rel));
    if(hit){acc.excluded.push({path:rel,reason:hit.reason});continue;}
    acc.files.push(rel);
  }
  return acc;
}
function selectPayload(which){
  const acc={files:[],excluded:[],rejected:[]};
  for(const f of APP_ROOT_FILES){
    if(fs.existsSync(path.join(repo,f)))acc.files.push(f);
    else acc.rejected.push({path:f,reason:'declared in the allowlist but missing from the source tree'});
  }
  for(const d of APP_DIRS){
    if(!fs.existsSync(path.join(repo,d))){acc.rejected.push({path:d,reason:'allowlisted directory missing'});continue;}
    walk(d,repo,acc);
  }
  if(which==='assurance'){
    for(const d of ASSURANCE_EXTRA_DIRS) if(fs.existsSync(path.join(repo,d))) walk(d,repo,acc);
  }
  return acc;
}

/* Nothing in the source tree may be dropped silently. Every top-level entry
   is either allowlisted, covered by an allowlisted directory, or explicitly
   excluded with a recorded reason. Anything else is "extra" and stops the
   build, so a newly added file cannot vanish from the distribution unnoticed. */
function auditUnclassified(which){
  const known=new Set([...APP_ROOT_FILES,...METADATA]);
  const dirs=new Set(which==='assurance'?[...APP_DIRS,...ASSURANCE_EXTRA_DIRS]:APP_DIRS);
  const extra=[],excluded=[];
  for(const e of fs.readdirSync(repo,{withFileTypes:true})){
    if(e.isDirectory()){
      if(dirs.has(e.name))continue;
      const hit=EXCLUDE_ALWAYS.find(x=>x.pattern.test(e.name+'/'));
      if(hit){excluded.push({path:e.name+'/',reason:hit.reason});continue;}
      if(which==='app'&&ASSURANCE_EXTRA_DIRS.includes(e.name)){
        excluded.push({path:e.name+'/',reason:'assurance-only directory; present in the assurance distribution'});continue;}
      extra.push({path:e.name+'/',reason:'directory is neither allowlisted nor excluded'});continue;
    }
    if(known.has(e.name))continue;
    const hit=EXCLUDE_ALWAYS.find(x=>x.pattern.test(e.name));
    if(hit){excluded.push({path:e.name,reason:hit.reason});continue;}
    extra.push({path:e.name,reason:'file is neither allowlisted nor excluded'});
  }
  return {extra,excluded};
}

function buildOne(which,dest){
  if(fs.existsSync(dest)){console.error('refusing to overwrite existing output: '+dest);process.exit(3);}
  const classified=auditUnclassified(which);
  if(classified.extra.length){
    console.error('unclassified source entries; nothing written. Allowlist or exclude each one:');
    for(const x of classified.extra)console.error('  - '+x.path+': '+x.reason);
    process.exit(5);
  }
  const sel=selectPayload(which);
  sel.excluded.push(...classified.excluded);
  /* duplicate / unsafe path rejection */
  const seen=new Set();
  for(const f of sel.files){
    if(seen.has(f)){sel.rejected.push({path:f,reason:'duplicate payload entry'});continue;}
    if(path.isAbsolute(f)||f.split('/').includes('..')){sel.rejected.push({path:f,reason:'unsafe path'});continue;}
    seen.add(f);
  }
  if(sel.rejected.length){
    console.error('payload selection rejected entries; nothing written:');
    for(const r of sel.rejected)console.error('  - '+r.path+': '+r.reason);
    process.exit(4);
  }
  const payload=[...seen].sort();
  const binaries=payload.filter(rel=>looksExecutable(path.join(repo,rel)));
  if(binaries.length){
    console.error('refusing to package compiled binaries; nothing written:');
    for(const b of binaries.slice(0,20))console.error('  - '+b);
    if(binaries.length>20)console.error('  ... and '+(binaries.length-20)+' more');
    process.exit(6);
  }
  /* 1. copy payload */
  for(const rel of payload){
    const to=path.join(dest,rel);
    fs.mkdirSync(path.dirname(to),{recursive:true});
    fs.copyFileSync(path.join(repo,rel),to);
  }
  /* 2. manifest over the finalised payload only */
  const files=payload.map(rel=>{
    const buf=fs.readFileSync(path.join(dest,rel));
    return {path:rel,size:buf.length,sha256:sha256(buf)};
  });
  const base=JSON.parse(fs.readFileSync(path.join(repo,'MANIFEST.json'),'utf8'));
  const manifest={
    product:base.product,distribution:which,version:base.version,
    status:'REMEDIATION SUCCESSOR - not a classroom release label',
    generatedDate:new Date().toISOString().slice(0,10),
    predecessor:{...base.predecessor,auditedBaselineCommit:'37ada3235c4d67f8b98c46afdb31c092b44419ed'},
    sourcePolicy:base.sourcePolicy,
    distributionBoundary:which==='app'
      ?'Application and study material only. Tests, tools, generated matrices and C suites are in the assurance distribution.'
      :'Application plus assurance: tests, tools, generated matrices and C suites.',
    payloadPolicy:{
      allowlisted:{rootFiles:APP_ROOT_FILES,directories:which==='assurance'?[...APP_DIRS,...ASSURANCE_EXTRA_DIRS]:APP_DIRS},
      excluded:EXCLUDE_ALWAYS.map(e=>({pattern:String(e.pattern),reason:e.reason})),
      excludedFromThisList:METADATA,
      note:'This list covers payload files only. MANIFEST.json cannot contain its own digest, and SHA256SUMS.txt never covers itself; the archive digest is detached.'
    },
    fileCount:files.length,files
  };
  fs.writeFileSync(path.join(dest,'MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
  /* 3. checksums over payload + manifest, excluding itself */
  const sumLines=[...payload,'MANIFEST.json'].sort()
    .map(rel=>sha256(fs.readFileSync(path.join(dest,rel)))+'  '+rel);
  fs.writeFileSync(path.join(dest,'SHA256SUMS.txt'),sumLines.join('\n')+'\n');
  return {which,dest,payloadCount:payload.length,manifestEntries:files.length,
          checksumLines:sumLines.length,excluded:sel.excluded};
}

const summary={repo,outRoot,builds:[]};
fs.mkdirSync(outRoot,{recursive:true});
for(const which of (kind==='both'?['app','assurance']:[kind])){
  const dest=path.join(outRoot,'dsa_guide_'+which);
  const r=buildOne(which,dest);
  /* 4. archive, 5. detached receipt outside it */
  const archive=path.join(outRoot,'dsa_guide_'+which+'.tar.gz');
  cp.execFileSync('tar',['-czf',archive,'-C',outRoot,path.basename(dest)]);
  const digest=sha256(fs.readFileSync(archive));
  fs.writeFileSync(archive+'.sha256',digest+'  '+path.basename(archive)+'\n');
  r.archive=path.basename(archive);r.archiveSha256=digest;
  r.archiveSize=fs.statSync(archive).size;
  summary.builds.push(r);
}
console.log(JSON.stringify(summary,null,1));
