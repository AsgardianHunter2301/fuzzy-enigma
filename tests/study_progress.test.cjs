/* AUD-09 successor gate: concurrent same-origin study progress.
   Loads the real progress implementation out of tracer-ui.js and drives it
   through independent VM contexts that share one localStorage store, which is
   how two browser tabs on the same origin actually interact. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ROOT=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const ui=fs.readFileSync(path.join(ROOT,'assets','tracer-ui.js'),'utf8');
const START="const STUDY_KEY='comp2521-tracer:study:v1';";
const END='/* A topic counts as worked through';
const a=ui.indexOf(START), b=ui.indexOf(END);
if(a<0||b<0){console.error('study-progress source markers not found in tracer-ui.js');process.exit(2);}
const src=ui.slice(a,b);
const KEY='comp2521-tracer:study:v1', BACKUP='comp2521-tracer:study:v1-pre-v2-backup';

function mkTab(store,denied){
  const ls=denied
    ?{getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}}
    :{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=v;}};
  const ctx=vm.createContext({localStorage:ls,buildMenu(){},UI:{moduleSearch:null},
    Date,Math,JSON,Object,Number,Array,String,window:{addEventListener(){}}});
  vm.runInContext(src+'\nthis.markComplete=markComplete;this.noteRecent=noteRecent;this.study=study;',ctx);
  return ctx;
}
const results=[];let pass=0,fail=0;
function chk(name,cond,detail){
  cond?pass++:fail++;
  results.push({name,ok:!!cond,detail:cond?undefined:String(detail)});
  console.log('  '+(cond?'PASS':'FAIL')+'  '+name+(cond?'':'   <- '+detail));
}
const doneOf=s=>new Set(JSON.parse(s[KEY]).done);

{const s={};const A=mkTab(s),B=mkTab(s);A.markComplete('bstins');B.markComplete('bfs');
 const d=doneOf(s);chk('two tabs opened before either writes keep both completions',d.has('bstins')&&d.has('bfs'),[...d]);}

{const s={};const T=[mkTab(s),mkTab(s),mkTab(s)];
 T[0].markComplete('a');T[1].markComplete('b');T[2].markComplete('c');T[0].markComplete('d');
 const d=doneOf(s);chk('three interleaved tabs keep all four completions',['a','b','c','d'].every(x=>d.has(x)),[...d]);}

{const s={};const A=mkTab(s),B=mkTab(s);A.markComplete('bstins');B.noteRecent('dijkstra');
 const o=JSON.parse(s[KEY]);
 chk('a recent-topic update cannot overwrite a completion fact',o.done.includes('bstins')&&o.recent.includes('dijkstra'),JSON.stringify(o));}

{const s={};const A=mkTab(s),B=mkTab(s);A.markComplete('x');B.markComplete('y');
 const C=mkTab(s);const d=new Set(C.study.done);
 chk('a tab opened afterwards reads the union',d.has('x')&&d.has('y'),[...d]);}

{const s={};s[KEY]=JSON.stringify({done:['old1','old2'],recent:['old1']});
 const A=mkTab(s);A.markComplete('new1');
 const o=JSON.parse(s[KEY]);
 chk('v1 completions survive migration to v2',['old1','old2','new1'].every(x=>o.done.includes(x)),JSON.stringify(o));
 chk('the pre-migration v1 value is preserved in a backup key',
     !!s[BACKUP]&&JSON.parse(s[BACKUP]).done.join()==='old1,old2',String(s[BACKUP]));}

{const s={};s[KEY]='{not json';let ok=true;
 try{const A=mkTab(s);A.markComplete('z');ok=JSON.parse(s[KEY]).done.includes('z');}catch(e){ok=false;}
 chk('a corrupt stored value is handled without throwing',ok);}

{let ok=true;try{const A=mkTab({},true);A.markComplete('q');ok=A.study.done.includes('q');}catch(e){ok=false;}
 chk('storage-denied degrades to an in-memory session',ok);}

{const s={};const A=mkTab(s);A.markComplete('dup');const first=JSON.parse(s[KEY]).completedAt.dup;
 A.markComplete('dup');const second=JSON.parse(s[KEY]).completedAt.dup;
 chk('re-completing a topic does not move its first-completion timestamp',first===second,first+' vs '+second);}

console.log('\n  AUD-09 study-progress assertions: passed='+pass+' failed='+fail);
if(process.env.DSA_JSON_OUT)fs.writeFileSync(process.env.DSA_JSON_OUT,JSON.stringify({suite:'study_progress',passed:pass,failed:fail,results},null,1));
process.exitCode=fail?1:0;
