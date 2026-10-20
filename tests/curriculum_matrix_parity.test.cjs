#!/usr/bin/env node
/* Parity between docs/CURRICULUM_MATRIX.md and the LIVE curriculum register.

   The matrix opens by saying it is generated from the registers the build
   actually uses and that "nothing here is typed in by hand twice". No tool
   regenerates it, and tests/curriculum_register.test.cjs checks the register
   itself rather than the document, so that claim was unguarded: a module
   regrouped or moved to a different teaching week would leave the matrix
   quietly wrong while every gate passed.

   What corresponds to what, which is NOT obvious and was got wrong first time:
     matrix "Official first introduction" <-> register.introducedWeek
     matrix "Official group"              <-> register.introducedGroup
   Both are OFFICIAL-schedule fields and are printed as "**none**" and "-" when
   the register holds null. They are deliberately different from the app's own
   `topic` and `group`: `lin` sits in the app's "Searching" group while having
   no official introduction at all. The "Module" column is a human-readable
   name that the register dump does not carry, so it is not compared here.

   Only the module table is read. The document contains several other tables
   whose first column is also a module id - sort work counts, comparison
   tallies - and reading those as module rows produced 111 false failures. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const REG=process.env.DSA_CURRICULUM_REGISTER||'/home/claude/work/artifacts/curriculum_register.json';
if(!fs.existsSync(REG)){
  console.error('register dump missing: '+REG+'\nrun tools/extract_curriculum_register.cjs first');
  process.exit(2);
}
const register=JSON.parse(fs.readFileSync(REG,'utf8')).register||{};
const lines=fs.readFileSync(path.join(ROOT,'docs/CURRICULUM_MATRIX.md'),'utf8').split('\n');

/* Locate the module table by its header, then take the contiguous rows after
   the separator line. */
let at=lines.findIndex(l=>/Topic id\s*\|\s*Module\s*\|\s*Official first introduction\s*\|\s*Official group/i.test(l));
if(at<0){console.error('module table header not found in docs/CURRICULUM_MATRIX.md');process.exit(2);}
at++;
if(!/^\s*\|[\s-|]+\|\s*$/.test(lines[at]||'')){console.error('separator row not where expected');process.exit(2);}
at++;
const rows=new Map();
for(;at<lines.length;at++){
  const line=lines[at];
  if(!/^\s*\|/.test(line))break;                   /* table ended */
  const cells=line.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(c=>c.trim());
  const idm=/^`([A-Za-z0-9]+)`$/.exec(cells[0]||'');
  if(!idm)continue;
  rows.set(idm[1],{week:cells[2]||'',group:cells[3]||''});
}

const norm=v=>v===null||v===undefined?null:String(v);
const shown=v=>v==='**none**'||v==='-'||v===''?null:v;

let checks=0,failures=0;const problems=[];
const check=(cond,kind,id,detail)=>{checks++;if(!cond){failures++;problems.push(`${kind}  ${id}  ${detail}`);}};

const regIds=Object.keys(register).sort();
check(rows.size>0,'TABLE-EMPTY','-','no module rows parsed');
check(rows.size===regIds.length,'COUNT','-',
  `matrix module table lists ${rows.size} modules, the live register has ${regIds.length}`);

for(const id of regIds){
  const row=rows.get(id);
  check(!!row,'MISSING-IN-MATRIX',id,'registered module has no row in the matrix');
  if(!row)continue;
  const e=register[id];
  check(shown(row.week)===norm(e.introducedWeek),'WEEK',id,
    `matrix "${row.week}" vs register introducedWeek ${JSON.stringify(e.introducedWeek)}`);
  check(shown(row.group)===norm(e.introducedGroup),'GROUP',id,
    `matrix "${row.group}" vs register introducedGroup ${JSON.stringify(e.introducedGroup)}`);
  rows.delete(id);
}
for(const id of rows.keys())
  check(false,'MISSING-IN-REGISTER',id,'the matrix lists a module the register does not have');

console.log(`matrix module rows : ${regIds.length-[...problems].filter(p=>p.startsWith('MISSING-IN-MATRIX')).length}`);
console.log(`register modules   : ${regIds.length}`);
console.log(`checks             : ${checks}`);
console.log(`failures           : ${failures}`);
for(const p of problems.slice(0,20))console.log('  '+p);
if(problems.length>20)console.log(`  ... and ${problems.length-20} more`);
console.log(failures===0?'CURRICULUM MATRIX PARITY: PASS':'CURRICULUM MATRIX PARITY: FAIL');
process.exit(failures===0?0:1);
