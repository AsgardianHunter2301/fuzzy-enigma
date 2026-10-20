#!/usr/bin/env node
/* Parity between the C the manual-boundary bridges DISPLAY and the C that is
   actually compiled and tested in bridges_c/.
 *
 * bridges_c/verify_displayed_bridges.sh already compiles the displayed
 * excerpts and reports byte differences against this directory, so TEXT drift
 * was covered. What was not covered is whether a bridge's registered TOKENS
 * name routines the body actually provides. That is a different failure, and
 * it is the one NEW-15 was: the dfs bridge registered dfshaspath and
 * dfsfindpath, its displayed and compiled text agreed with each other
 * perfectly, and neither contained either routine - so a parity check on text
 * could not see it. This test checks the claim, not the copy.
 *
 * Checks, per bridge:
 *   TOKEN-UNHONOURED  a registered token names a routine the displayed code
 *                     does not contain, so the claim cannot be honoured
 *   NOT-COMPILED      a function in the displayed code is not defined
 *                     anywhere in bridges_c, so the student is shown C that
 *                     nothing compiles or tests
 *   DRIFT             the displayed body and the compiled body differ once
 *                     comments and whitespace are removed
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const BR=path.join(ROOT,'bridges_c');

function stripComments(s){
  return s.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\/\/[^\n]*/g,' ');
}
function tokens(s){
  return (stripComments(s).match(/[A-Za-z_][A-Za-z0-9_]*|[0-9]+\.?[0-9]*|[^\s\w]/g)||[]);
}
/* Function definitions in a translation unit: a signature followed by a body.
   Returns name -> body token string. */
function functions(src){
  const clean=stripComments(src);
  const out=new Map();
  const re=/(^|\n)[A-Za-z_][A-Za-z0-9_ \t\*]*?\b([A-Za-z_][A-Za-z0-9_]*)\s*\(([^;{)]|\([^)]*\))*\)\s*\{/g;
  let m;
  while((m=re.exec(clean))!==null){
    const name=m[2];
    let depth=0,start=clean.indexOf('{',m.index+m[0].length-1);
    start=m.index+m[0].length-1;
    let end=-1;
    for(let k=start;k<clean.length;k++){
      if(clean[k]==='{')depth++;
      else if(clean[k]==='}'){depth--;if(depth===0){end=k+1;break;}}
    }
    if(end<0) continue;
    if(name==='if'||name==='for'||name==='while'||name==='switch'||name==='sizeof') continue;
    out.set(name,tokens(clean.slice(start,end)).join(' '));
    re.lastIndex=end;
  }
  return out;
}

const compiled=new Map();
for(const f of fs.readdirSync(BR).filter(f=>/\.(c|h)$/.test(f))){
  if(/^test_/.test(f)) continue;            /* drivers are not lesson content */
  for(const [n,b] of functions(fs.readFileSync(path.join(BR,f),'utf8'))){
    if(!compiled.has(n)) compiled.set(n,{body:b,file:f});
  }
}

const w={};
new Function('window','Object',fs.readFileSync(path.join(ROOT,'assets/manual-boundary-data.js'),'utf8'))(w,Object);
const bridges=w.COMP2521_MANUAL_BRIDGES;

let checks=0,failures=0;
const problems=[];
function check(cond,kind,bridge,detail){
  checks++;
  if(!cond){failures++;problems.push({kind,bridge,detail});}
}

for(const b of bridges){
  const lc=b.code.toLowerCase();
  const concept=b.conceptTokens||{};
  for(const t of (b.tokens||[])){
    /* Two kinds of token, both matched by manual-boundary-v62.js against a
       canonicalised heading. A ROUTINE token names a function, and the
       displayed body must define it. A CONCEPT token names the idea a
       heading states ("Transitive closure", "Edge relaxation") rather than a
       function; the body implements it without a function of that name, so
       the data must declare the evidence and the evidence must be present.
       Neither kind is waived. */
    if(Object.prototype.hasOwnProperty.call(concept,t)){
      check(b.code.includes(concept[t]),'CONCEPT-UNEVIDENCED',b.id,
        'concept token "'+t+'" declares evidence '+JSON.stringify(concept[t])+
        ' which is absent from the displayed conversion');
      continue;
    }
    check(lc.includes(String(t).toLowerCase()),'TOKEN-UNHONOURED',b.id,
      'token "'+t+'" names no routine in the displayed conversion'+
      ' (if it names a concept, declare it in conceptTokens with its evidence)');
  }
  const shown=functions(b.code);
  for(const [name,body] of shown){
    const c=compiled.get(name);
    check(!!c,'NOT-COMPILED',b.id,
      'displayed function '+name+'() is not defined in bridges_c');
    if(c) check(c.body===body,'DRIFT',b.id,
      'displayed '+name+'() differs from bridges_c/'+c.file);
  }
}

console.log('bridges                 : '+bridges.length);
console.log('compiled functions seen : '+compiled.size);
console.log('checks                  : '+checks);
console.log('failures                : '+failures);
for(const p of problems) console.log('  '+p.kind+'  ['+p.bridge+']  '+p.detail);
console.log(failures===0?'BRIDGE C PARITY: PASS':'BRIDGE C PARITY: FAIL');
process.exit(failures===0?0:1);
