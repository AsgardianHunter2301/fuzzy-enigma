#!/usr/bin/env node
/* Build the uploadable static-site folder.

   The product is a dependency-free static app, so "deploy" means "put these
   files on a web host". This tool produces that folder and nothing else: no
   tests, no tools, no assurance evidence, no predecessor archives, no C
   sources, no .git. Shipping those would publish the audit trail alongside the
   classroom build, which DEPLOY.md explicitly forbids.

   The file set is DERIVED from the pages, never hand-listed, so an asset added
   later cannot be silently left out. References are read from src/href AND
   from meta content attributes - og-card.png is only ever named by
   <meta property="og:image">, and a src/href-only scan drops it.

   Checks, all of which must pass before the folder is declared ready:
     - every reference in every shipped page resolves to a shipped file
     - every shipped file is reachable from a page (no dead weight)
     - no excluded path leaked in, and nothing shipped is a compiled binary
     - the folder works served from a domain root AND from a subdirectory
       (verified separately by tools/verify_site.sh running the browser suite) */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');

const argv=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const flag=n=>{const m=process.argv.find(a=>a.startsWith('--'+n+'='));return m?m.slice(n.length+3):null;};
const TREE=argv[0]||process.cwd();
const DIST=argv[1]||path.join(TREE,'dist');
const NAME='dsa_guide';
const SITE=path.join(DIST,NAME);

/* The pages carry four ABSOLUTE urls each - rel=canonical, og:url, og:image
   and twitter:image - all pointing at the origin the app was first published
   from. They do not affect how the app runs (it is fully relative, and the
   browser suite passes served from a subdirectory), but on a new host a stale
   rel=canonical tells search engines the real copy is somewhere else, and the
   social preview points at a file on the old domain.

   --base-url retargets all four. Without it the existing urls are LEFT ALONE
   and reported, because rewriting them to a guessed origin would be worse
   than leaving a value the publisher can see and decide about. */
const ORIGIN_PREFIX='https://asgardianhunter2301.github.io/dsa_guide';
const baseUrl=(flag('base-url')||'').replace(/\/+$/,'');

/* Everything that is deliberately NOT published. */
const EXCLUDE_TOP=new Set(['.git','.DS_Store','tests','tools','docs','bridges_c',
  'memorise_graph_c','licences','dist','MANIFEST.json','SHA256SUMS.txt',
  'OPEN_FIRST.md','RECOVERY.md','README.md','MANUAL_BOUNDARY_GUIDE.md',
  'MEMORISE_GRAPH_C_GUIDE.md']);

function refsIn(html){
  const out=new Set();
  const add=u=>{
    if(!u)return;
    if(/^(https?:)?\/\//.test(u)||/^(#|mailto:|data:|javascript:)/.test(u))return;
    const clean=u.split('?')[0].split('#')[0];
    if(clean)out.add(clean);
  };
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g))add(m[1]);
  /* og:image and friends live in content=, not src/href. */
  for(const m of html.matchAll(/<meta[^>]+content="([^"]+)"/g)){
    if(/\.(png|jpe?g|svg|webp|ico|gif)$/i.test(m[1]))add(m[1]);
  }
  for(const m of html.matchAll(/<link[^>]+href="([^"]+)"/g))add(m[1]);
  return out;
}

const pages=fs.readdirSync(TREE).filter(f=>f.endsWith('.html')).sort();
if(!pages.length){console.error('no pages found in '+TREE);process.exit(2);}

/* Transitive closure from the pages. */
const want=new Set(pages);
const queue=[...pages];
const problems=[];
while(queue.length){
  const rel=queue.shift();
  const abs=path.join(TREE,rel);
  if(!fs.existsSync(abs)){problems.push(`referenced but absent: ${rel}`);continue;}
  if(!/\.html$/.test(rel))continue;
  for(const r of refsIn(fs.readFileSync(abs,'utf8'))){
    const target=path.normalize(path.join(path.dirname(rel),r));
    if(target.startsWith('..')){problems.push(`reference escapes the tree: ${rel} -> ${r}`);continue;}
    const top=target.split(path.sep)[0];
    if(EXCLUDE_TOP.has(top)){problems.push(`page ${rel} references an excluded path: ${r}`);continue;}
    if(!want.has(target)){want.add(target);queue.push(target);}
  }
}

/* assets/ is shipped whole: a file reached only from CSS or JS at runtime
   would otherwise be missed, and the directory is small and entirely runtime. */
for(const f of fs.readdirSync(path.join(TREE,'assets')))want.add(path.posix.join('assets',f));

fs.rmSync(SITE,{recursive:true,force:true});
fs.mkdirSync(SITE,{recursive:true});
const shipped=[];
let rewritten=0;
for(const rel of [...want].sort()){
  const src=path.join(TREE,rel),dst=path.join(SITE,rel);
  let buf=fs.readFileSync(src);
  if(baseUrl&&/\.html$/.test(rel)){
    const before=buf.toString('utf8');
    const after=before.split(ORIGIN_PREFIX).join(baseUrl);
    if(after!==before){rewritten+=(before.split(ORIGIN_PREFIX).length-1);buf=Buffer.from(after,'utf8');}
  }
  if(buf.length>=4){
    const magic=buf.subarray(0,4);
    if(magic[0]===0x7f&&magic[1]===0x45&&magic[2]===0x4c&&magic[3]===0x46)
      {problems.push(`compiled ELF binary would be published: ${rel}`);continue;}
    if(magic[0]===0x4d&&magic[1]===0x5a)
      {problems.push(`compiled MZ binary would be published: ${rel}`);continue;}
  }
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.writeFileSync(dst,buf);
  shipped.push({path:rel.split(path.sep).join('/'),bytes:buf.length,
    sha256:crypto.createHash('sha256').update(buf).digest('hex')});
}

/* GitHub Pages runs Jekyll, which skips paths beginning with _ or . unless
   this file is present. Cheap insurance; harmless on every other host. */
fs.writeFileSync(path.join(SITE,'.nojekyll'),'');

/* Reachability: a shipped file nothing names is dead weight. assets/ is
   shipped whole by design, so report rather than fail. */
const named=new Set();
for(const rel of shipped.map(s=>s.path).filter(p=>p.endsWith('.html'))){
  for(const r of refsIn(fs.readFileSync(path.join(SITE,rel),'utf8')))
    named.add(path.posix.normalize(path.posix.join(path.posix.dirname(rel),r)));
}
const allText=shipped.filter(s=>/\.(js|css)$/.test(s.path))
  .map(s=>fs.readFileSync(path.join(SITE,s.path),'utf8')).join('\n');
const unreferenced=shipped.map(s=>s.path).filter(p=>
  !named.has(p)&&!pages.includes(p)&&!allText.includes(path.posix.basename(p)));

const sums=shipped.map(s=>`${s.sha256}  ${s.path}`).join('\n')+'\n';
fs.writeFileSync(path.join(SITE,'SHA256SUMS.txt'),sums);

/* Count any absolute urls still pointing at the original origin. */
let staleAbsolute=0;
for(const s of shipped.filter(s=>s.path.endsWith('.html'))){
  staleAbsolute+=fs.readFileSync(path.join(SITE,s.path),'utf8').split(ORIGIN_PREFIX).length-1;
}
const report={site:SITE,pages:pages.length,files:shipped.length,
  bytes:shipped.reduce((a,b)=>a+b.bytes,0),unreferenced,problems,
  baseUrl:baseUrl||null,absoluteUrlsRewritten:rewritten,
  absoluteUrlsStillPointingAtOriginalOrigin:staleAbsolute,
  originalOrigin:ORIGIN_PREFIX,
  excluded:[...EXCLUDE_TOP].sort()};
fs.mkdirSync(DIST,{recursive:true});
fs.writeFileSync(path.join(DIST,'site_build.json'),JSON.stringify({...report,shipped},null,1));

console.log(`site folder : ${SITE}`);
console.log(`pages       : ${report.pages}`);
console.log(`files       : ${report.files}  (${(report.bytes/1024).toFixed(0)} KiB)`);
console.log(`unreferenced: ${unreferenced.length?unreferenced.join(', '):'none'}`);
if(baseUrl){
  console.log(`base url    : ${baseUrl}  (${rewritten} absolute urls rewritten)`);
}
if(staleAbsolute){
  console.log(`NOTE        : ${staleAbsolute} absolute url(s) still name ${ORIGIN_PREFIX}`);
  console.log(`              these are rel=canonical / og:url / og:image / twitter:image.`);
  console.log(`              Rebuild with --base-url=https://your-host/path to retarget them.`);
}
console.log(`problems    : ${problems.length}`);
for(const p of problems)console.log('  '+p);
console.log(`report      : ${path.join(DIST,'site_build.json')}`);
process.exit(problems.length?1:0);
