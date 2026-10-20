#!/usr/bin/env node
/* Parity between the in-app coverage table and the audit register.

   assets/corpus-shared.js holds COVERAGE_CAPABILITIES - the table the app
   renders - and docs/COVERAGE_CAPABILITIES.csv is the audit register derived
   from it, carrying the extra evidence and required-action columns. Nothing
   regenerates one from the other, so a status corrected in one place can sit
   stale in the other: the app could show a capability as an open gap that the
   register calls closed, or the reverse. Both were edited by hand during this
   remediation, which is exactly when that drift happens.

   The letters are the app's own legend: X executable, C conceptual reference,
   N named only; K complete, P partial, M missing. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');

const MODE={X:'executable',C:'conceptual-reference',N:'named-only'};
const STATUS={K:'complete',P:'partial',M:'missing'};

/* The table is a literal array of string arrays, so it is read from the text
   rather than a page load: no browser, and no chance of reading a value some
   other layer rewrote at runtime. */
const src=fs.readFileSync(path.join(ROOT,'assets/corpus-shared.js'),'utf8');
const start=src.indexOf('const COVERAGE_CAPABILITIES = [');
if(start<0){console.error('COVERAGE_CAPABILITIES not found');process.exit(2);}
const end=src.indexOf('\n];',start);
const body=src.slice(start,end);
const table=[];
for(const m of body.matchAll(/\[((?:'(?:[^'\\]|\\.)*'\s*,?\s*)+)\]/g)){
  const cells=[...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(x=>x[1].replace(/\\'/g,"'"));
  if(cells.length===8&&/^CAP-\d+$/.test(cells[0]))table.push(cells);
}

/* Minimal CSV reader: the file is written fully quoted. */
function readCsv(text){
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cell+='"';i++;} else q=false; } else cell+=c; }
    else if(c==='"')q=true;
    else if(c===','){row.push(cell);cell='';}
    else if(c==='\n'){row.push(cell);cell='';if(row.length>1)rows.push(row);row=[];}
    else if(c!=='\r')cell+=c;
  }
  if(cell||row.length){row.push(cell);if(row.length>1)rows.push(row);}
  const head=rows.shift();
  return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]])));
}
const csv=readCsv(fs.readFileSync(path.join(ROOT,'docs/COVERAGE_CAPABILITIES.csv'),'utf8'));

let checks=0,failures=0;
const problems=[];
const fail=(k,id,d)=>{failures++;problems.push(`${k}  ${id}  ${d}`);};
const check=(cond,k,id,d)=>{checks++;if(!cond)fail(k,id,d);};

check(table.length>0,'TABLE-EMPTY','-','no capability rows parsed from corpus-shared.js');
check(table.length===csv.length,'COUNT','-',
  `app table has ${table.length} rows, register has ${csv.length}`);

const byId=new Map(csv.map(r=>[r.capability_id,r]));
for(const row of table){
  const [id,week,cap,cat,dest,,mode,status]=row;
  const r=byId.get(id);
  check(!!r,'MISSING-IN-REGISTER',id,'row is in the app but not in the register');
  if(!r)continue;
  byId.delete(id);
  check(r.week_label===week,'WEEK',id,`app "${week}" vs register "${r.week_label}"`);
  check(r.capability===cap,'NAME',id,`app "${cap}" vs register "${r.capability}"`);
  check(r.category===cat,'CATEGORY',id,`app "${cat}" vs register "${r.category}"`);
  check(r.destination_topic_ids===dest,'DESTINATION',id,
    `app "${dest}" vs register "${r.destination_topic_ids}"`);
  check(MODE[mode]===r.delivery_mode,'MODE',id,
    `app letter ${mode} (${MODE[mode]}) vs register "${r.delivery_mode}"`);
  check(STATUS[status]===r.completeness,'COMPLETENESS',id,
    `app letter ${status} (${STATUS[status]}) vs register "${r.completeness}"`);
  /* A row the app still shows as an open gap must not read as closed. */
  if(status!=='K')check(/OPEN GAP/i.test(r.required_action||''),'ACTION',id,
    'app shows this as not complete, so the register must still record an OPEN GAP');
  if(status==='K')check(!/OPEN GAP/i.test(r.required_action||''),'ACTION',id,
    'app shows this as complete while the register still records an OPEN GAP');
}
for(const id of byId.keys())fail('MISSING-IN-APP',id,'row is in the register but not in the app');

console.log(`app capability rows : ${table.length}`);
console.log(`register records    : ${csv.length}`);
console.log(`checks              : ${checks}`);
console.log(`failures            : ${failures}`);
for(const p of problems.slice(0,20))console.log('  '+p);
if(problems.length>20)console.log(`  ... and ${problems.length-20} more`);
console.log(failures===0?'COVERAGE REGISTER PARITY: PASS':'COVERAGE REGISTER PARITY: FAIL');
process.exit(failures===0?0:1);
