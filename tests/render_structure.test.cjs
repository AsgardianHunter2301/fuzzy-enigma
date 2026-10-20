/* AUD-10 successor gate: tree/trie diagrams must expose an equivalent
   structural text alternative.

   Adapted from the audited reproduce/frontend/render_a11y_repro.cjs, which is
   preserved unchanged. That harness's element stub implements only
   appendChild/className/textContent/innerHTML, so it cannot host an element
   that calls setAttribute. This successor stub models the small DOM surface
   the renderers actually use. These are Node-level STRUCTURAL assertions, not
   accessibility-tree evidence; the browser gate reports that separately. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
/* Default the repo root to this tree so the suite is self-contained. */
process.env.DSA_REPO_ROOT=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const LOADER=process.env.DSA_LOADER||'/home/claude/work/replay/reproduce/algorithm/load_modules.cjs';
const {api,context}=require(LOADER).load();

context.document={createElement:function(tag){
  return {tag,className:'',textContent:'',innerHTML:'',attrs:{},children:[],
    appendChild(c){this.children.push(c);return c;},
    setAttribute(k,v){this.attrs[k]=String(v);},
    getAttribute(k){return Object.prototype.hasOwnProperty.call(this.attrs,k)?this.attrs[k]:null;}};
}};
function mkHost(){return context.document.createElement('div');}
function flatten(n,out){out=out||[];out.push(n);(n.children||[]).forEach(c=>flatten(c,out));return out;}
function textOf(n){return n?flatten(n).map(x=>x.textContent||'').join(' ').replace(/\s+/g,' ').trim():'';}
function htmlOf(n){return flatten(n).map(x=>x.innerHTML||'').join('');}
function structureOf(host){return flatten(host).find(n=>String(n.className||'').includes('structure-text'));}
function render(kind,view){
  context.__view=view;context.__host=mkHost();
  vm.runInContext(`RENDER.${kind}(__view,__host)`,context);
  return context.__host;
}

let pass=0,fail=0;const results=[];
function chk(name,cond,detail){
  cond?pass++:fail++;results.push({name,ok:!!cond,detail:cond?undefined:String(detail)});
  console.log('  '+(cond?'PASS':'FAIL')+'  '+name+(cond?'':'   <- '+String(detail).slice(0,200)));
}

/* ---- AUD-10's named acceptance case, from the REAL module ---- */
const rotate=api.run('bstrotate');
const finalView=rotate.f[rotate.f.length-1].view;
{
  const host=render('tree',finalView);
  const st=structureOf(host);
  chk('tree renderer emits a structural text region',!!st);
  const t=textOf(st);
  chk('the default final bstrotate tree exposes root 4',/root/.test(t)&&/\b4\b/.test(t),t.slice(0,200));
  chk("4's children are 1 and 7",/value 1\b/.test(t)&&/value 7\b/.test(t),t.slice(0,260));
  chk("7's children are 5 and 9",/value 5\b/.test(t)&&/value 9\b/.test(t),t.slice(0,260));
  chk('left and right child slots are labelled',/left child/.test(t)&&/right child/.test(t),t.slice(0,260));
  chk('the structural region is NOT a live region',st&&st.getAttribute('aria-live')==='off',st&&st.getAttribute('aria-live'));
  chk('the structural region is screen-reader only',String(st.className).includes('sr-only'),st.className);
  chk('the decorative canvas stays aria-hidden',/aria-hidden="true"/.test(htmlOf(host)));
}
/* ---- every rotation frame, not just the last ---- */
{
  let missing=0;
  for(const f of rotate.f){
    if(!f.view||f.view.kind!=='tree')continue;
    const t=textOf(structureOf(render('tree',f.view)));
    if(!/node/.test(t))missing++;
  }
  chk('every tree frame of bstrotate exposes structure',missing===0,missing+' frames without structure');
}
/* ---- AVL deletion: duplicate values must stay distinguishable ---- */
{
  const host=render('tree',{kind:'tree',root:{v:5,l:{v:5,l:null,r:null},r:{v:5,l:null,r:null}},cls:{}});
  const ids=(textOf(structureOf(host)).match(/\bn\d+\b/g)||[]);
  chk('three same-valued nodes get three distinct identities',new Set(ids).size>=3,ids.join(','));
}
/* ---- AVL badges ---- */
{
  const avl=api.run('avldel');
  const withBadges=avl.f.filter(f=>f.view&&f.view.kind==='tree'&&f.view.badges&&Object.keys(f.view.badges).length);
  if(withBadges.length){
    const t=textOf(structureOf(render('tree',withBadges[withBadges.length-1].view)));
    chk('AVL balance factors are exposed in the structure',/balance factor/.test(t)&&/-?\+?\d/.test(t),t.slice(0,240));
  }else chk('AVL balance factors are exposed in the structure',false,'no badge frame found in avldel');
}
/* ---- empty tree ---- */
chk('an empty tree states so in visible text',/tree is empty/.test(textOf(render('tree',{kind:'tree',root:null}))));

/* ---- trie: prefixes, terminals, deletion, from the REAL module ---- */
const trie=api.run('trie');
const trieFrames=trie.f.filter(f=>f.view&&f.view.kind==='trie'&&f.view.root);
{
  chk('the trie module produced trie frames to check',trieFrames.length>0,trieFrames.length);
  const st=structureOf(render('trie',trieFrames[trieFrames.length-1].view));
  chk('trie renderer emits a structural text region',!!st);
  const t=textOf(st);
  chk('terminal state distinguishes a complete word from a prefix',/complete word/.test(t)&&/prefix only/.test(t),t.slice(0,300));
  chk('the accumulated prefix is exposed per node',/prefix at this node/.test(t),t.slice(0,160));
  chk('child characters are listed',/child characters/.test(t),t.slice(0,160));
  chk('the trie structural region is NOT a live region',st.getAttribute('aria-live')==='off',st.getAttribute('aria-live'));
  let missing=0;
  for(const f of trieFrames) if(!/node/.test(textOf(structureOf(render('trie',f.view)))))missing++;
  chk('every trie frame exposes structure',missing===0,missing+' frames without structure');
}
{
  /* "cart" stored, "car" deleted: exactly one complete word remains. */
  const leafT={id:6,ch:'t',fin:true,kids:{}};
  const nodeR={id:5,ch:'r',fin:false,kids:{t:leafT}};
  const nodeA={id:3,ch:'a',fin:false,kids:{r:nodeR}};
  const nodeC={id:2,ch:'c',fin:false,kids:{a:nodeA}};
  const rootT={id:1,ch:'',fin:false,kids:{c:nodeC}};
  const t=textOf(structureOf(render('trie',{kind:'trie',cls:{},root:rootT})));
  chk('after deleting a word only the survivor is marked complete',/1 complete word\b/.test(t),t.slice(0,160));
}
chk('an empty trie states so in visible text',/trie is empty/.test(textOf(render('trie',{kind:'trie',root:null}))));

console.log('\n  AUD-10 structural-equivalence assertions: passed='+pass+' failed='+fail);
console.log('  NOTE: Node-level structural assertions only. Real accessibility-tree and');
console.log('        screen-reader evidence is reported separately by the browser gate.');
if(process.env.DSA_JSON_OUT)fs.writeFileSync(process.env.DSA_JSON_OUT,JSON.stringify({suite:'render_structure',passed:pass,failed:fail,results},null,1));
process.exitCode=fail?1:0;
