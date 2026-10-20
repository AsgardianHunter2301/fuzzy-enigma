/* CUR-MOD-01 successor gate: the teaching-week register.
   Reads the LIVE register dumped from a real page load by
   tools/extract_curriculum_register.cjs, so it checks what the application
   actually computes rather than a literal in the source. Weeks are stored as
   labels ("Week 7", "Extra"), not integers, because "Extra" is not a numbered
   lecture week and must not be coerced into one. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const REG=process.env.DSA_CURRICULUM_REGISTER||'/home/claude/work/artifacts/curriculum_register.json';
if(!fs.existsSync(REG)){console.error('register dump missing: '+REG+'\nrun tools/extract_curriculum_register.cjs first');process.exit(2);}
const d=JSON.parse(fs.readFileSync(REG,'utf8'));
const reg=d.register||{}, weeks=d.officialWeekSchedule||[];
const weekNum=l=>{const m=/^Week\s+(\d+)$/.exec(String(l||''));return m?Number(m[1]):null;};
let pass=0,fail=0;const results=[];
function chk(name,cond,detail){
  cond?pass++:fail++;results.push({name,ok:!!cond,detail:cond?undefined:String(detail).slice(0,260)});
  console.log('  '+(cond?'PASS':'FAIL')+'  '+name+(cond?'':'   <- '+String(detail).slice(0,220)));
}
chk('all 68 modules resolve a curriculum record',Object.keys(reg).length===68&&Object.values(reg).every(Boolean),Object.keys(reg).length);
chk('16 admitted groups and exactly the two declared exclusions',
    (d.admittedGroups||[]).length===16&&JSON.stringify(d.excludedGroups)===JSON.stringify(['Course map','Searching']),
    JSON.stringify({a:(d.admittedGroups||[]).length,e:d.excludedGroups}));

/* No invented Week 0, and "Extra" never becomes a numbered week. */
const labels=new Set();
for(const v of Object.values(reg)){
  if(v.introducedWeek)labels.add(v.introducedWeek);
  (v.appliedWeeks||[]).forEach(w=>labels.add(w));
  (v.revisionWeeks||[]).forEach(r=>labels.add(r.week));
}
chk('no Week 0 was invented',![...labels].some(l=>weekNum(l)===0),[...labels].join(','));
const extra=weeks.find(r=>String(r.week).toLowerCase()==='extra');
chk('the Extra linked-list revision row exists and is NOT numbered',!!extra&&extra.numbered===false,JSON.stringify(extra));
chk('Extra is never used as a numbered teaching week',![...labels].some(l=>/^Week\s+0?$/.test(String(l))),[...labels].join(','));

/* Flex week carries no teaching. */
const w6=weeks.find(r=>weekNum(r.week)===6);
chk('Week 6 is present, has no groups, and is noted as the flex week',
    !!w6&&(w6.groups||[]).length===0&&/flex/i.test(String(w6.note||'')),JSON.stringify(w6));
chk('nothing is introduced in Week 6',
    !Object.values(reg).some(v=>weekNum(v.introducedWeek)===6),
    Object.entries(reg).filter(([,v])=>weekNum(v.introducedWeek)===6).map(([k])=>k).join(','));

/* The mixed graph matrix separates introduction from later application. */
const gw=reg.graphweighted||{};
chk('graphweighted: introduced Week 4, applied in Weeks 5 and 7',
    weekNum(gw.introducedWeek)===4&&(gw.appliedWeeks||[]).map(weekNum).includes(5)&&(gw.appliedWeeks||[]).map(weekNum).includes(7),
    JSON.stringify({i:gw.introducedWeek,a:gw.appliedWeeks}));
chk('graphweighted: the per-block allocation is labelled an inference',/inference/i.test(JSON.stringify(gw)),Object.keys(gw).join(','));
chk('graphweighted: provenance distinguishes the declared term from the readable copy',
    /term/i.test(JSON.stringify(gw.provenance||{}))&&/absent|not read|sign-in/i.test(JSON.stringify(gw.provenance||{})),
    JSON.stringify(gw.provenance||{}).slice(0,200));

/* Digraph algorithms sit in Week 7 with Week 5 as prerequisite context. */
for(const id of ['warshall','cycled','webcrawl']){
  const r=reg[id]||{};
  chk(`${id}: introduced in Week 7 with recorded prerequisites`,
      weekNum(r.introducedWeek)===7&&(r.prerequisites||[]).length>0,
      JSON.stringify({i:r.introducedWeek,p:r.prerequisites}));
}
/* Graph traversal remains Week 5, so the correction did not over-shift. */
for(const id of ['bfs','dfs','cycleu','components']){
  const r=reg[id]||{};
  chk(`${id}: still introduced in Week 5`,weekNum(r.introducedWeek)===5,JSON.stringify({i:r.introducedWeek}));
}
/* Heaps and tries: exam note scoped to term and section, theory retained. */
for(const id of ['pq','heapify','heapsort','trie']){
  const a=JSON.stringify((reg[id]||{}).assessment||{});
  chk(`${id}: exam exclusion is scoped to the 26T2 programming section, theory retained`,
      /26T2/.test(a)&&/programming/i.test(a)&&/theor/i.test(a),a.slice(0,200));
  chk(`${id}: still introduced in Week 9 (not removed from the curriculum)`,
      weekNum((reg[id]||{}).introducedWeek)===9,JSON.stringify({i:(reg[id]||{}).introducedWeek}));
}
/* Every record names the source it came from, and absent originals stay open. */
/* A record either cites the official source for its introduction week, or it
   has NO introduction week and instead carries a relevance classification.
   The second case is correct and deliberate: the four modules in the two
   excluded groups (coursemap, namedalgos, lin, bin) are not named in the
   official outline, so inventing a week for them would be exactly the
   fabrication this register exists to prevent. They are classified, not
   dismissed. */
const unsourced=Object.entries(reg).filter(([,v])=>!v.introducedSource);
chk('every record either cites its source or declares no official week with a relevance class',
    unsourced.every(([,v])=>!v.introducedWeek&&!!v.relevance),
    JSON.stringify(unsourced.map(([k,v])=>({k,week:v.introducedWeek,rel:v.relevance}))));
chk('exactly the four excluded-group modules lack an official introduction week',
    unsourced.map(([k])=>k).sort().join(',')==='bin,coursemap,lin,namedalgos',
    unsourced.map(([k])=>k).sort().join(','));
chk('an absent original course document is recorded as open, not certified',
    /absent|unavailable|not read|no .*parity|not certified/i.test(JSON.stringify(reg)),'no open-source statement found');
chk('no page error occurred while reading the live register',(d.pageErrors||[]).length===0,JSON.stringify(d.pageErrors));

console.log('\n  CUR-MOD-01 register assertions: passed='+pass+' failed='+fail);
if(process.env.DSA_JSON_OUT)fs.writeFileSync(process.env.DSA_JSON_OUT,JSON.stringify({suite:'curriculum_register',passed:pass,failed:fail,results},null,1));
process.exitCode=fail?1:0;
