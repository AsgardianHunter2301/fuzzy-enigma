#!/usr/bin/env node
/* AUD-01 gate: ZERO stored frame views may change after capture.
 *
 * reproduce/algorithm/observe_snapshots.cjs already implements the right
 * mechanism: it wraps Trace.prototype.step to keep a serialized copy of each
 * frame's view at capture time, and - importantly - it also wraps
 * decorateGraphTrace so that a graph trace is compared against its
 * PRE-decoration frames. Decoration legitimately builds new frame objects
 * after generation, so a naive comparison against the returned trace reports
 * kruskal and prim as mutated when nothing mutated at all. This gate reuses
 * the audited observer rather than reimplementing it.
 *
 * What it adds is the failing criterion. The observer is a diagnostic: it
 * exits 0 even when its JSON records changed views, which is precisely how
 * 146 changed frames could sit in an evidence file beside a green run. Here,
 * any changed frame or observer error fails the gate.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const REPLAY=process.env.DSA_REPLAY||'/home/claude/work/replay';
const observer=path.join(REPLAY,'reproduce','algorithm','observe_snapshots.cjs');
if(!fs.existsSync(observer)){console.error('audited observer not found: '+observer);process.exit(2);}
const tree=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
let out;
try{
  out=cp.execFileSync('node',[observer],{encoding:'utf8',timeout:600000,
    env:{...process.env,DSA_REPO_ROOT:tree}});
}catch(e){
  console.error(JSON.stringify({error:'observer failed to run',detail:String(e.stdout||e.message).slice(0,600)},null,1));
  process.exit(1);
}
const d=JSON.parse(out);
const changed=(d.affected||[]).reduce((n,a)=>n+a.changedFrames,0);
const report={
  tree,
  observer:path.relative(tree,observer)||observer,
  modulesChecked:d.modulesChecked,framesChecked:d.framesChecked,
  changedFrameViews:changed,
  affected:(d.affected||[]).map(a=>({id:a.id,changedFrames:a.changedFrames,totalFrames:a.totalFrames})),
  observerErrors:d.errors||[],
  baselineReference:'146 of 1,906 frame views changed after capture on commit 37ada3235c4d67f8b98c46afdb31c092b44419ed '+
    '(graphadt 32/41, dfs 23/54, warshall 46/73, dfspath 20/25, components 19/24, hashprobe 6/34)',
  criterion:'changedFrameViews must be 0 and the observer must report no errors'
};
console.log(JSON.stringify(report,null,1));
process.exitCode=(changed===0&&report.observerErrors.length===0)?0:1;
