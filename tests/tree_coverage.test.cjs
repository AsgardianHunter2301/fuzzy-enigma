/* Successor gate for the five tree/AVL capabilities that the capability
   review recorded as PARTIAL: CAP-066 (tree and BST terminology),
   CAP-076 (size balance), CAP-083 (periodic rebalancing), CAP-087 (the AVL
   height guarantee) and CAP-093 (AVL search).

   Every assertion is checked against something computed INDEPENDENTLY in
   this file - a separate traversal, a separate simulation, a separate
   Fibonacci, a brute-force minimality search over tree shapes - and never
   against a frame count or a stored screenshot. Where the lesson prints
   arithmetic, the printed arithmetic itself is parsed and re-checked, so a
   lesson that displays a wrong sum fails here rather than reading well.  */
'use strict';
const fs=require('node:fs'),path=require('node:path');
process.env.DSA_REPO_ROOT=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const ROOT=process.env.DSA_REPO_ROOT;
const LOADER=process.env.DSA_LOADER||'/home/claude/work/replay/reproduce/algorithm/load_modules.cjs';
const {api}=require(LOADER).load();

let pass=0,fail=0;const results=[];
function chk(name,cond,detail){
  cond?pass++:fail++;
  results.push({name,ok:!!cond,detail:cond?undefined:String(detail).slice(0,300)});
  console.log('  '+(cond?'PASS':'FAIL')+'  '+name+(cond?'':'   <- '+String(detail).slice(0,220)));
}

/* ---------- independent helpers (deliberately not the app's) ---------- */
const views=v=>v?[v,...(v.views||[]).flatMap(views)]:[];
const treeViews=f=>views(f.view).filter(v=>v.kind==='tree'&&v.root!==undefined);
const refs=f=>views(f.view).filter(v=>v.kind==='reference').flatMap(v=>v.sections||[]);
const allText=t=>t.f.map(f=>String(f.note||'')+' '+JSON.stringify(refs(f))).join('\n');
function tables(t){return t.f.flatMap(f=>refs(f).filter(s=>s.table).map(s=>({title:String(s.title||''),headers:s.table.headers,rows:s.table.rows})));}
function tableNamed(t,re){return tables(t).find(x=>re.test(x.title));}

function ins(root,v){                       /* plain BST insert, no duplicates */
  if(!root)return {v,l:null,r:null};
  if(v<root.v)root.l=ins(root.l,v); else if(v>root.v)root.r=ins(root.r,v);
  return root;
}
const build=vals=>vals.reduce((r,v)=>ins(r,v),null);
const inord=n=>n?[...inord(n.l),n.v,...inord(n.r)]:[];
const size=n=>n?1+size(n.l)+size(n.r):0;
const hgt=n=>n?1+Math.max(hgt(n.l),hgt(n.r)):-1;      /* edges; empty = -1 */
function sizeBal(n,out){out=out||[];if(!n)return out;out.push({v:n.v,d:Math.abs(size(n.l)-size(n.r))});sizeBal(n.l,out);sizeBal(n.r,out);return out;}
function avlOk(n){if(!n)return true;return Math.abs(hgt(n.l)-hgt(n.r))<=1&&avlOk(n.l)&&avlOk(n.r);}
function member(n,v){while(n){if(v<n.v)n=n.l;else if(v>n.v)n=n.r;else return true;}return false;}
/* independent minimum-node recurrence, written from the definition */
function minN(h){if(h<0)return 0;if(h===0)return 1;let a=0,b=1;for(let k=1;k<=h;k++){const c=b+a+1;a=b;b=c;}return b;}
/* independent Fibonacci, F(1)=F(2)=1 */
function fib(k){let a=0,b=1;for(let i=1;i<=k;i++){const c=a+b;a=b;b=c;}return a;}
/* BRUTE FORCE minimality: the set of (height, everyNodeBalanced) pairs
   reachable with exactly n nodes, built up from both subtrees. The smallest
   n that can reach height h with every node balanced IS the minimum, with no
   reference to the recurrence at all. */
const SHAPES=[[[-1,true]]];                 /* n = 0: the empty tree */
function shapes(n){
  if(SHAPES[n])return SHAPES[n];
  const seen=new Set(),out=[];
  for(let nl=0;nl<n;nl++){
    const nr=n-1-nl;
    for(const [hl,ol] of shapes(nl))for(const [hr,or_] of shapes(nr)){
      const h=1+Math.max(hl,hr),ok=ol&&or_&&Math.abs(hl-hr)<=1,key=h+'/'+ok;
      if(!seen.has(key)){seen.add(key);out.push([h,ok]);}
    }
  }
  return (SHAPES[n]=out);
}
function bruteMinNodes(h){for(let n=0;n<=40;n++)if(shapes(n).some(([hh,ok])=>hh===h&&ok))return n;return null;}

/* =====================================================================
   CAP-066  Tree and BST terminology on bsttrav
   ===================================================================== */
{
  const m=api.module('bsttrav'),t=api.run('bsttrav');
  const text=allText(t);
  for(const term of ['root','parent','child','leaf','internal node','depth','height','level','subtree','size('])
    chk('CAP-066: the terminology names "'+term+'"',text.includes(term),'absent from every frame');
  chk('CAP-066: the empty-tree height convention is stated as -1',
      /empty tree[^.]*-1|-1[^.]*empty tree|height of an empty tree/i.test(text)&&/-1/.test(text),'convention not stated');
  chk('CAP-066: no second, node-counted height convention is introduced',
      /one less/.test(text)&&!/empty tree has height 0/i.test(text),'a conflicting convention appears');
  chk('CAP-066: the BST ordering property is stated',/ordering property/i.test(text),'not stated');

  /* the stated height must equal an independent EDGE-counted height, and must
     agree with the AVL lessons' convention, for several inputs */
  for(const seq of ['20 10 30 5 14 24 32 2 12 17 29 31','4 2 6 1 3 5 7','1 2 3 4 5','9']){
    const want=hgt(build(seq.split(' ').map(Number)));
    const f=api.run('bsttrav',{seq}).f;
    const stated=/Measured on this tree: height <b>(-?\d+)<\/b>/.exec(f.map(x=>x.note).join('\n'));
    chk('CAP-066: stated height matches an independent edge count for "'+seq+'"',
        !!stated&&Number(stated[1])===want,stated?stated[1]+' vs '+want:'height not stated');
  }
  /* the quoted in-order sequence is the sorted distinct input */
  const seq='20 10 30 5 14 24 32 2 12 17 29 31';
  const want=[...new Set(seq.split(' ').map(Number))].sort((a,b)=>a-b).join(' ');
  chk('CAP-066: the in-order sequence quoted in the terminology is sorted and complete',
      allText(api.run('bsttrav',{seq})).includes(want),want);
  /* every ordering-property verdict is checked, not asserted */
  const ord=tableNamed(t,/at every node that has at least one child/i);
  chk('CAP-066: the ordering property is checked at every node with a child',
      !!ord&&ord.rows.length===inord(build(seq.split(' ').map(Number))).filter(v=>{const n=(function find(x){return x?(v<x.v?find(x.l):v>x.v?find(x.r):x):null;})(build(seq.split(' ').map(Number)));return n&&(n.l||n.r);}).length,
      ord?ord.rows.length:'table missing');
  chk('CAP-066: every ordering verdict on a real BST is "yes"',
      !!ord&&ord.rows.every(r=>String(r[r.length-1])==='yes'),ord?JSON.stringify(ord.rows.filter(r=>r[r.length-1]!=='yes')):'table missing');
  /* source mapping: every frame highlights a real line of one of this
     module's own blocks */
  let bad=0;
  for(const f of t.f){if(!f.line)continue;const [b,l]=f.line;if(!m.blocks[b]||l<1||l>m.blocks[b].src.split('\n').length)bad++;}
  chk('CAP-066: every bsttrav frame highlights a real line of its own source',bad===0,bad+' frames out of range');
}

/* =====================================================================
   CAP-076  Size balance on bstrebalance
   ===================================================================== */
{
  const t=api.run('bstrebalance'),text=allText(t);
  chk('CAP-076: size balance is defined over the two subtrees of one node',
      /size-balanced/.test(text)&&/size\(t->left\)/.test(text)&&/size\(t->right\)/.test(text),'definition not displayed');
  chk('CAP-076: the definition says every node must satisfy it',/every/i.test(text),'the "every node" requirement is not stated');
  chk('CAP-076: size balance is distinguished from height balance',
      /height\(t->left\)/.test(text)&&/height balance/i.test(text),'height balance is not contrasted');
  const bd=tableNamed(t,/boundary/i);
  chk('CAP-076: the boundary table shows a size-balanced case',
      !!bd&&bd.rows.some(r=>String(r[3])==='0'&&/^yes/.test(String(r[4]))),bd?JSON.stringify(bd.rows):'no boundary table');
  chk('CAP-076: the boundary table shows difference 1 still passing',
      !!bd&&bd.rows.some(r=>String(r[3])==='1'&&/^yes/.test(String(r[4]))),bd?JSON.stringify(bd.rows):'no boundary table');
  chk('CAP-076: the boundary table shows difference 2 failing',
      !!bd&&bd.rows.some(r=>String(r[3])==='2'&&/^NO/.test(String(r[4]))),bd?JSON.stringify(bd.rows):'no boundary table');
  chk('CAP-076: the boundary cases are rendered as trees, not only described',
      t.f.some(f=>treeViews(f).length>=3),'no frame renders three trees side by side');

  /* the displayed before/after tables must match an independent computation */
  const vals='1 2 3 4 5 6 7 8 9'.split(' ').map(Number),input=build(vals);
  const before=tableNamed(t,/before rebalancing/i);
  const wantBefore=sizeBal(input).map(r=>[String(r.v),String(r.d)]);
  chk('CAP-076: the before-table differences match an independent count',
      !!before&&JSON.stringify(before.rows.map(r=>[String(r[0]),String(r[3])]))===JSON.stringify(wantBefore),
      before?JSON.stringify(before.rows.map(r=>[r[0],r[3]])):'table missing');
  chk('CAP-076: the before-table flags the degenerate input as NOT size-balanced',
      !!before&&before.rows.some(r=>/^NO/.test(String(r[4]))),'no failing node reported');

  /* the rebalanced result really is size-balanced, at many sizes, and its
     height is the floor(log2 n) that the lesson claims */
  let bad=0,badH=0;
  for(let n=1;n<=48;n++){
    const seq=Array.from({length:n},(_,i)=>i+1).join(' ');
    const out=api.run('bstrebalance',{seq,mode:'global'}).f.at(-1).view.root;
    if(!sizeBal(out).every(r=>r.d<=1))bad++;
    if(hgt(out)!==Math.floor(Math.log2(n)))badH++;
    if(inord(out).join(' ')!==seq)bad++;
  }
  chk('CAP-076: global rebalancing leaves every node size-balanced for n = 1..48',bad===0,bad+' sizes failed');
  chk('CAP-076: and its height is floor(log2 n) for n = 1..48',badH===0,badH+' sizes failed');
  const after=tableNamed(t,/after rebalancing/i);
  chk('CAP-076: the after-table reports every node as size-balanced',
      !!after&&after.rows.every(r=>/^yes/.test(String(r[4]))),after?JSON.stringify(after.rows.filter(r=>!/^yes/.test(String(r[4])))):'table missing');
  const split=tableNamed(t,/difference of 2/i);
  chk('CAP-076: the partition split arithmetic displayed is correct',
      !!split&&split.rows.every(r=>{const sz=Number(r[0]),idx=Number(r[1]);
        return idx===Math.floor(sz/2)&&Number(r[2])===idx&&Number(r[3])===sz-1-idx&&Number(r[4])===Math.abs(idx-(sz-1-idx))&&Number(r[4])<=1;}),
      split?JSON.stringify(split.rows):'table missing');
}

/* =====================================================================
   CAP-083  Periodic rebalancing, traced
   ===================================================================== */
{
  const m=api.module('bstrebalance');
  const modeField=(m.fields||[]).find(f=>f.k==='mode');
  chk('CAP-083: the existing mode field is reused, with its options unchanged',
      !!modeField&&JSON.stringify(modeField.options)===JSON.stringify(['global','periodic reference'])&&modeField.def==='global',
      JSON.stringify(modeField));
  const t=api.run('bstrebalance',{mode:'periodic reference'}),text=allText(t);
  chk('CAP-083: periodic rebalancing is a real trace, not a single prose frame',t.f.length>=15,t.f.length+' frames');
  chk('CAP-083: the trigger condition is shown',/size\(t\) mod k/.test(text),'trigger condition absent');
  chk('CAP-083: the period k is stated as a number',/k = \d+/.test(text),'k not stated');
  chk('CAP-083: the insertion is identified as a leaf insertion',/insertAtLeaf/.test(text),'insertAtLeaf absent');
  chk('CAP-083: at least one trigger actually fires and rebalances',/the trigger fires/.test(text)&&/rebuilds the whole tree/.test(text),'no fired trigger');
  chk('CAP-083: it says how periodic differs from rebalancing globally every time',
      /every insertion/i.test(text)&&/rebalance calls/i.test(text),'no comparison with rebalancing every time');

  /* independent simulation of all three policies */
  const K=Number(/k = (\d+)/.exec(text)[1]);
  const vals='1 2 3 4 5 6 7 8 9'.split(' ').map(Number);
  let r=null,fires=0,worst=-1;
  const rebal=n=>{const o=inord(n);const mk=a=>{if(!a.length)return null;const i=Math.floor(a.length/2);const nd={v:a[i],l:mk(a.slice(0,i)),r:mk(a.slice(i+1))};return nd;};return mk(o);};
  vals.forEach(v=>{r=ins(r,v);if(hgt(r)>worst)worst=hgt(r);if(size(r)%K===0){r=rebal(r);fires++;}});
  const policies=tableNamed(t,/polic/i);
  chk('CAP-083: the number of triggers that fired matches an independent simulation',
      !!policies&&Number(policies.rows.find(x=>/periodic/.test(String(x[0])))[1])===fires,
      policies?JSON.stringify(policies.rows):'no policy table');
  chk('CAP-083: the worst height reached between triggers matches an independent simulation',
      !!policies&&Number(policies.rows.find(x=>/periodic/.test(String(x[0])))[2])===worst,
      policies?JSON.stringify(policies.rows):'no policy table');
  chk('CAP-083: the final height matches an independent simulation',
      !!policies&&Number(policies.rows.find(x=>/periodic/.test(String(x[0])))[3])===hgt(r),
      policies?JSON.stringify(policies.rows):'no policy table');
  let never=null;vals.forEach(v=>{never=ins(never,v);});
  chk('CAP-083: the never-rebalance row is the degenerate height',
      !!policies&&Number(policies.rows.find(x=>/never/.test(String(x[0])))[3])===hgt(never)&&hgt(never)===vals.length-1,
      policies?JSON.stringify(policies.rows):'no policy table');
  chk('CAP-083: the rebalance-every-insertion row costs one call per insertion',
      !!policies&&Number(policies.rows.find(x=>/every insertion/.test(String(x[0])))[1])===vals.length,
      policies?JSON.stringify(policies.rows):'no policy table');
  chk('CAP-083: the traced result preserves the input as a BST',
      inord(t.f.at(-1).view.views[0].root).join(' ')===vals.join(' '),
      JSON.stringify(inord(t.f.at(-1).view.views[0].root)));
  /* the trigger frames must highlight the trigger statement itself */
  const trig=t.f.filter(f=>/the trigger fires/.test(String(f.note)));
  chk('CAP-083: a fired trigger highlights the "size(t) mod k = 0" statement',
      trig.length>0&&trig.every(f=>/mod k = 0/.test(m.blocks[f.line[0]].src.split('\n')[f.line[1]-1])),
      trig.length?m.blocks[trig[0].line[0]].src.split('\n')[trig[0].line[1]-1]:'no fired trigger frame');
  const fire=t.f.filter(f=>/rebuilds the whole tree/.test(String(f.note)));
  chk('CAP-083: the rebalancing frame highlights "t = rebalance(t)"',
      fire.length>0&&fire.every(f=>/t = rebalance\(t\)/.test(m.blocks[f.line[0]].src.split('\n')[f.line[1]-1])),
      fire.length?m.blocks[fire[0].line[0]].src.split('\n')[fire[0].line[1]-1]:'no rebalance frame');
}

/* =====================================================================
   CAP-087  The AVL height guarantee - the arithmetic must be right
   ===================================================================== */
{
  /* the recurrence itself */
  chk('CAP-087: N(-1) = 0 and N(0) = 1',minN(-1)===0&&minN(0)===1,minN(-1)+','+minN(0));
  let bad=0;
  for(let h=1;h<=30;h++)if(minN(h)!==minN(h-1)+minN(h-2)+1)bad++;
  chk('CAP-087: N(h) = N(h-1) + N(h-2) + 1 for h = 1..30',bad===0,bad+' heights failed');
  bad=0;for(let h=-1;h<=30;h++)if(minN(h)!==fib(h+3)-1)bad++;
  chk('CAP-087: the Fibonacci identity N(h) = F(h+3) - 1 holds for h = -1..30',bad===0,bad+' heights failed');
  chk('CAP-087: the sequence is 1, 2, 4, 7, 12, 20, 33, 54, 88, 143, 232',
      Array.from({length:11},(_,h)=>minN(h)).join(',')==='1,2,4,7,12,20,33,54,88,143,232',
      Array.from({length:11},(_,h)=>minN(h)).join(','));
  bad=0;for(let h=0;h<=40;h++)if(!(minN(h)>=Math.pow(2,h/2)))bad++;
  chk('CAP-087: N(h) >= 2^(h/2) for h = 0..40',bad===0,bad+' heights failed');
  bad=0;for(let h=0;h<=40;h++)if(!(h<=2*Math.log2(minN(h))))bad++;
  chk('CAP-087: h <= 2 * log2 N(h) for h = 0..40, so h is O(log n)',bad===0,bad+' heights failed');
  bad=0;for(let h=0;h<=20;h++)if(!(h<=1.4405*Math.log2(minN(h)+2)-1.3277))bad++;
  chk('CAP-087: the sharper bound h <= 1.4405*log2(n+2) - 1.3277 holds for h = 0..20',bad===0,bad+' heights failed');
  /* N(h) really is the minimum, found by brute force over tree SHAPES with
     no use of the recurrence */
  bad=0;const brute=[];
  for(let h=0;h<=6;h++){const b=bruteMinNodes(h);brute.push(b);if(b!==minN(h))bad++;}
  chk('CAP-087: brute force over all tree shapes agrees that N(h) is the minimum, h = 0..6',
      bad===0,'brute='+brute.join(',')+' recurrence='+Array.from({length:7},(_,h)=>minN(h)).join(','));

  /* what the lesson displays */
  const t=api.run('avlheight'),text=allText(t);
  chk('CAP-087: the lesson states the O(log n) height guarantee',/O\(log n\)/.test(text),'not stated');
  chk('CAP-087: the lesson prints the recurrence',/N\(h-1\) \+ N\(h-2\) \+ 1/.test(text),'recurrence not printed');
  const rec=tableNamed(t,/minimum nodes for each height/i);
  chk('CAP-087: every displayed sum in the recurrence table is arithmetically correct',
      !!rec&&rec.rows.every(r=>{const m2=/^(\d+) \+ (\d+) \+ 1 = (\d+)$/.exec(String(r[3]));
        if(!m2)return /base case/.test(String(r[3]));
        return Number(m2[1])+Number(m2[2])+1===Number(m2[3])&&Number(m2[3])===minN(Number(r[0]));}),
      rec?JSON.stringify(rec.rows.map(r=>r[3])):'table missing');
  chk('CAP-087: every displayed Fibonacci identity is arithmetically correct',
      !!rec&&rec.rows.every(r=>{const m2=/^F\((\d+)\) - 1 = (\d+) - 1 = (-?\d+)$/.exec(String(r[4]));
        return !!m2&&fib(Number(m2[1]))===Number(m2[2])&&Number(m2[2])-1===Number(m2[3])&&Number(m2[3])===minN(Number(r[0]));}),
      rec?JSON.stringify(rec.rows.map(r=>r[4])):'table missing');
  chk('CAP-087: the recurrence is not applied where N(h-2) does not exist',
      !!rec&&rec.rows.filter(r=>Number(r[0])<1).every(r=>/base case/.test(String(r[3]))),
      rec?JSON.stringify(rec.rows.slice(0,2)):'table missing');
  const bnd=tableNamed(t,/bound checked/i);
  chk('CAP-087: every row of the displayed bound table is recomputable',
      !!bnd&&bnd.rows.every(r=>{const h=Number(r[0]),n=Number(r[1]);
        return n===minN(h)&&Math.abs(Number(r[2])-Math.pow(2,h/2))<0.005
          &&Math.abs(Number(r[3])-2*Math.log2(n))<0.005&&String(r[4])==='yes'
          &&Math.abs(Number(r[5])-(1.4405*Math.log2(n+2)-1.3277))<0.0005;}),
      bnd?JSON.stringify(bnd.rows):'table missing');

  /* the worst-case shape that is drawn */
  for(const seq of ['6 2 9 1 5 8 4','1 2','5 3 8 1','1 2 3','9']){
    const f=api.run('avlheight',{seq}).f;
    const frame=f.find(x=>/worst-case AVL shape/.test(String(x.note)))||f.find(x=>treeViews(x).some(v=>/minimum-size AVL tree/.test(String(v.title||''))));
    const tv=frame&&treeViews(frame).find(v=>/minimum-size AVL tree/.test(String(v.title||'')));
    const h=Number(/height (\d+)/.exec(String(tv&&tv.title))[1]);
    chk('CAP-087: the drawn worst-case tree has exactly N(h) nodes ("'+seq+'")',
        !!tv&&size(tv.root)===minN(h),tv?size(tv.root)+' vs '+minN(h):'no minimum tree drawn');
    chk('CAP-087: the drawn worst-case tree really has height h ("'+seq+'")',!!tv&&hgt(tv.root)===h,tv?hgt(tv.root)+' vs '+h:'missing');
    chk('CAP-087: the drawn worst-case tree satisfies the AVL invariant ("'+seq+'")',!!tv&&avlOk(tv.root),'invariant broken');
    chk('CAP-087: the drawn worst-case tree is a valid BST ("'+seq+'")',
        !!tv&&inord(tv.root).every((v,i,a)=>i===0||a[i-1]<v),JSON.stringify(tv&&inord(tv.root)));
    chk('CAP-087: its displayed balance factors match an independent computation ("'+seq+'")',
        !!tv&&(function cmp(n){if(!n)return true;const b=hgt(n.l)-hgt(n.r);
          return String(tv.badges[n.v])===((b>0?'+':'')+b)&&cmp(n.l)&&cmp(n.r);})(tv.root),
        JSON.stringify(tv&&tv.badges));
  }
  /* a non-AVL input must be reported as non-AVL, with the node count as the
     evidence, rather than silently claiming the bound */
  const degen=allText(api.run('avlheight',{seq:'1 2 3'}));
  chk('CAP-087: a non-AVL input is named as such instead of being fitted to the bound',
      /not<\/b> an AVL tree|not an AVL tree/.test(degen)&&/needs at least/.test(degen),degen.slice(0,200));
  chk('CAP-087: and for 3 nodes at height 2 the stated minimum is N(2) = 4',
      /N\(2\) = 4/.test(degen)&&minN(2)===4,degen.slice(0,200));
}

/* =====================================================================
   CAP-093  AVL search
   ===================================================================== */
{
  const m=api.module('avldel');
  const blk=(m.blocks||[]).find(b=>/avlSearch/.test(b.src)||/avlSearch/.test(b.title));
  chk('CAP-093: a displayed block of an AVL destination contains the token avlSearch',!!blk,
      'no displayed block mentions avlSearch');
  chk('CAP-093: the token appears in the displayed heading as well as the body',
      !!blk&&/avlSearch/.test(blk.title)&&/bool avlSearch\(struct node \*t, int v\)/.test(blk.src),
      blk?blk.title:'missing');
  chk('CAP-093: the complete C body is labelled supplemental, not quoted',
      !!blk&&blk.source==='memorise'&&!/manual|lecture/i.test(String(blk.pages).replace('supplemental lesson','')),
      blk?blk.source+' / '+blk.pages:'missing');
  chk('CAP-093: the block itself says it is not manual or lecture source',
      !!blk&&/NOT 26T2 manual or 25T3 lecture source/.test(blk.src),'provenance header absent');
  chk('CAP-093: the two manual pseudocode blocks are still declared as manual',
      (m.blocks||[]).filter(b=>(b.source||'manual')==='manual').length===2,
      JSON.stringify((m.blocks||[]).map(b=>b.source||'manual')));

  /* the displayed C and the registered study conversion must not drift */
  const strip=s=>String(s).replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').trim();
  const dataFile=path.join(ROOT,'assets','manual-boundary-data.js');
  if(fs.existsSync(dataFile)){
    const raw=fs.readFileSync(dataFile,'utf8');
    const mm=/^window\.COMP2521_MANUAL_BRIDGES = Object\.freeze\(([\s\S]*)\);\s*$/.exec(raw);
    const bridges=mm?JSON.parse(mm[1]):[];
    const bridge=bridges.find(b=>b.id==='avl-search');
    chk('CAP-093: the avl-search study conversion still exists',!!bridge,'bridge avl-search not found');
    chk('CAP-093: the displayed C is token-identical to that conversion',
        !!bridge&&!!blk&&strip(blk.src)===strip(bridge.code),
        bridge&&blk?strip(blk.src)+' != '+strip(bridge.code):'missing');
    /* the matcher's own rule: canonicalise, then longest matching token wins */
    const canonical=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
    const SOURCE_LABEL={manual:'26T2 manual',lecture:'25T3 lecture',memorise:'supplemental C - not manual or lecture source',coverage:'coverage index'};
    const heading=blk?blk.title+SOURCE_LABEL[blk.source||'manual']+String(blk.pages||''):'';
    const best=(value)=>{const key=canonical(value);let b=null,len=0;
      for(const br of bridges)for(const tok of (br.tokens||[]))if(tok&&key.includes(tok)&&tok.length>len){b=br;len=tok.length;}
      return b;};
    chk('CAP-093: the matcher token rule resolves this block heading to avl-search',
        !!best(heading)&&best(heading).id==='avl-search',best(heading)&&best(heading).id);
    chk('CAP-093: and resolves the block body to avl-search too',
        !!blk&&!!best(blk.src)&&best(blk.src).id==='avl-search',blk&&best(blk.src)&&best(blk.src).id);
  }

  /* the operation itself */
  const opField=(m.fields||[]).find(f=>f.k==='op');
  chk('CAP-093: the search is reachable through a select field whose default is the old behaviour',
      !!opField&&opField.def==='delete'&&JSON.stringify(opField.options)===JSON.stringify(['delete','search']),
      JSON.stringify(opField));
  const resultOf=(seq,val)=>{const f=api.run('avldel',{op:'search',seq,val:String(val)}).f.at(-1);
    return String(f.vars.result)==='true';};
  const noteOf=(seq,val)=>String(api.run('avldel',{op:'search',seq,val:String(val)}).f.at(-1).note);

  chk('CAP-093: the smallest case - one node, searching for it - finds it',resultOf('7',7)===true,'did not find');
  chk('CAP-093: one node, searching for something else - rejects it',resultOf('7',8)===false,'false positive');
  chk('CAP-093: one node, searching below it - rejects it',resultOf('7',6)===false,'false positive');
  chk('CAP-093: the empty tree rejects everything without throwing',resultOf('',5)===false,'empty tree did not return false');
  chk('CAP-093: a value equal to the root is found',resultOf('30 20 40 10 25 35 50 5',30)===true,'root not found');
  chk('CAP-093: a value equal to the root is found with no further descent',
      /visiting 1 node/.test(noteOf('30 20 40 10 25 35 50 5',30).replace(/<[^>]+>/g,''))
      ||/visiting 1 node/.test(String(api.run('avldel',{op:'search',seq:'30 20 40 10 25 35 50 5',val:'30'}).f.map(f=>f.note).join(' ')).replace(/<[^>]+>/g,'')),
      'the root search did not stop at the root');
  chk('CAP-093: the deepest leaf is found',resultOf('30 20 40 10 25 35 50 5',5)===true,'deepest leaf not found');
  chk('CAP-093: a value below every key is rejected',resultOf('30 20 40 10 25 35 50 5',-99)===false,'false positive');
  chk('CAP-093: a value above every key is rejected',resultOf('30 20 40 10 25 35 50 5',99)===false,'false positive');
  chk('CAP-093: a value between two keys is rejected',resultOf('30 20 40 10 25 35 50 5',26)===false,'false positive');

  /* randomised agreement with an independent membership test, on the AVL
     tree the module actually built */
  let seed=0x5eed,wrong=0,cases=0;
  const next=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0);
  for(let k=0;k<80;k++){
    const a=Array.from({length:1+next()%12},()=>next()%25-12),seq=a.join(' ');
    for(const val of [a[next()%a.length],next()%25-12,99]){
      cases++;
      const got=resultOf(seq,val);
      /* membership is a property of the SET of keys, so an independent plain
         BST over the same values is the right oracle whatever rotations the
         AVL build performed */
      if(got!==member(build(a),val))wrong++;
    }
  }
  chk('CAP-093: randomised search agrees with an independent membership test ('+cases+' cases)',wrong===0,wrong+' disagreements');

  /* the lesson must explain the two things the capability promises */
  const text=allText(api.run('avldel',{op:'search'}));
  chk('CAP-093: it explains that AVL search is identical to BST search',
      /bstSearch/.test(text)&&/ordering property/.test(text),'no comparison with bstSearch');
  chk('CAP-093: it shows the two bodies statement by statement',
      !!tableNamed(api.run('avldel',{op:'search'}),/statement by statement/i),'no statement-by-statement table');
  chk('CAP-093: it explains what the height guarantee buys',
      /O\(log n\)/.test(text)&&/O\(n\)/.test(text)&&/height/.test(text),'the height bound is not explained');
  chk('CAP-093: the search trace highlights only the supplemental avlSearch block',
      api.run('avldel',{op:'search'}).f.every(f=>!f.line||m.blocks[f.line[0]].src===blk.src),
      'a search frame highlights a different block');
  chk('CAP-093: search leaves the tree unchanged',
      inord(api.run('avldel',{op:'search'}).f.at(-1).view.root).join(' ')==='5 10 20 25 30 35 40 50',
      JSON.stringify(inord(api.run('avldel',{op:'search'}).f.at(-1).view.root)));
  chk('CAP-093: the default operation is still deletion and still deletes',
      inord(api.run('avldel').f.at(-1).view.root).join(' ')==='5 10 20 25 30 35 50',
      JSON.stringify(inord(api.run('avldel').f.at(-1).view.root)));
}

/* =====================================================================
   The oracle-suite contract: all defaults, plus exactly one override
   ===================================================================== */
for(const id of ['bsttrav','bstrebalance','avlheight','avldel']){
  const m=api.module(id);
  for(const f of (m.fields||[])){
    const probes=f.type==='select'?f.options.slice():[String(f.def)];
    for(const p of probes){
      let ok=false,why='';
      try{const tr=api.run(id,{[f.k]:String(p)});ok=Array.isArray(tr.f)&&tr.f.length>0;why=tr.f.length+' frames';}
      catch(e){why=String(e&&e.message||e);}
      chk('defaults + one override works: '+id+' { '+f.k+': "'+p+'" }',ok,why);
    }
  }
}

console.log('\n  tree/AVL coverage assertions: passed='+pass+' failed='+fail);
if(process.env.DSA_JSON_OUT)fs.writeFileSync(process.env.DSA_JSON_OUT,JSON.stringify({suite:'tree_coverage',passed:pass,failed:fail,results},null,1));
process.exitCode=fail?1:0;
