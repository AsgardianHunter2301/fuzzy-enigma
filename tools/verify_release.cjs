#!/usr/bin/env node
/* Verify a built release by EXTRACTING it into a new, previously unused
   directory and checking it there - not in the directory it was built in.
   Checks, in order:
     - the detached archive digest matches the archive
     - every manifest-declared path exists with the declared size and SHA-256
     - no unexpected members are present beyond payload + declared metadata
     - SHA256SUMS.txt verifies, and never covers itself
   Usage: node tools/verify_release.cjs --dir <release-out-dir> --work <new-dir> */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const args=process.argv.slice(2),argOf=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:undefined;};
const dir=argOf('--dir'),work=argOf('--work');
if(!dir||!work){console.error('usage: verify_release.cjs --dir <release-dir> --work <new-dir>');process.exit(2);}
if(fs.existsSync(work)){console.error('refusing to reuse an existing work directory: '+work);process.exit(3);}
fs.mkdirSync(work,{recursive:true});
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
let pass=0,fail=0;const results=[];
const chk=(n,c,d)=>{c?pass++:fail++;results.push({check:n,ok:!!c,detail:c?undefined:String(d).slice(0,300)});
  console.log('  '+(c?'PASS':'FAIL')+'  '+n+(c?'':'   <- '+String(d).slice(0,240)));};

for(const archive of fs.readdirSync(dir).filter(f=>f.endsWith('.tar.gz')).sort()){
  const label=archive.replace(/\.tar\.gz$/,'');
  console.log('\n--- '+archive+' ---');
  const archivePath=path.join(dir,archive);
  /* detached receipt */
  const receipt=archivePath+'.sha256';
  chk(label+': detached digest receipt exists outside the archive',fs.existsSync(receipt),receipt);
  if(fs.existsSync(receipt)){
    const declared=fs.readFileSync(receipt,'utf8').trim().split(/\s+/)[0];
    chk(label+': archive digest matches its detached receipt',declared===sha(archivePath),declared+' vs '+sha(archivePath));
  }
  /* fresh extraction */
  const into=path.join(work,label);
  fs.mkdirSync(into,{recursive:true});
  cp.execFileSync('tar',['-xzf',archivePath,'-C',into]);
  const roots=fs.readdirSync(into);
  chk(label+': archive contains exactly one top-level directory',roots.length===1,roots.join(','));
  const root=path.join(into,roots[0]);
  /* manifest reconciliation */
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'MANIFEST.json'),'utf8'));
  let missing=0,wrongSize=0,wrongHash=0;
  for(const f of manifest.files){
    const abs=path.join(root,f.path);
    if(!fs.existsSync(abs)){missing++;continue;}
    if(fs.statSync(abs).size!==f.size)wrongSize++;
    if(sha(abs)!==f.sha256)wrongHash++;
  }
  chk(label+': every declared payload path is present',missing===0,missing+' missing');
  chk(label+': every declared size matches',wrongSize===0,wrongSize+' size mismatches');
  chk(label+': every declared SHA-256 matches',wrongHash===0,wrongHash+' digest mismatches');
  /* unexpected members */
  const actual=[];
  (function walk(d){for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){
    const rel=d?d+'/'+e.name:e.name;
    if(e.isDirectory())walk(rel);else actual.push(rel);}})('');
  const declared=new Set([...manifest.files.map(f=>f.path),'MANIFEST.json','SHA256SUMS.txt']);
  const extra=actual.filter(a=>!declared.has(a));
  chk(label+': no unexpected members beyond payload and declared metadata',extra.length===0,extra.slice(0,8).join(','));
  chk(label+': manifest file count equals its own list length',manifest.fileCount===manifest.files.length,
      manifest.fileCount+' vs '+manifest.files.length);
  chk(label+': the manifest does not list itself or the checksum file',
      !manifest.files.some(f=>f.path==='MANIFEST.json'||f.path==='SHA256SUMS.txt'),'self-reference present');
  /* checksum file */
  const sums=fs.readFileSync(path.join(root,'SHA256SUMS.txt'),'utf8').trim().split('\n');
  chk(label+': SHA256SUMS.txt does not cover itself',!sums.some(l=>l.endsWith(' SHA256SUMS.txt')),'self-coverage present');
  let r;
  try{r=cp.execFileSync('sha256sum',['-c','SHA256SUMS.txt'],{cwd:root,encoding:'utf8'});}
  catch(e){r=String(e.stdout||'')+String(e.stderr||'');}
  const bad=r.split('\n').filter(l=>/FAILED|No such/.test(l));
  chk(label+': sha256sum -c verifies every line in a fresh extraction',bad.length===0,bad.slice(0,6).join(' | '));
  chk(label+': no payload file is a compiled binary',
      !actual.some(a=>{const h=Buffer.alloc(4);try{const fd=fs.openSync(path.join(root,a),'r');fs.readSync(fd,h,0,4,0);fs.closeSync(fd);}catch(e){return false;}
        return h.equals(Buffer.from([0x7f,0x45,0x4c,0x46]));}),'ELF present');
}
console.log('\n  release verification: passed='+pass+' failed='+fail);
if(process.env.DSA_JSON_OUT)fs.writeFileSync(process.env.DSA_JSON_OUT,JSON.stringify({passed:pass,failed:fail,results},null,1));
process.exitCode=fail?1:0;
