/* CAP-026 / CAP-028 / CAP-037 / CAP-051 successor gate: the four W2-Sorting
   capabilities that the per-capability coverage review found promised but not
   delivered.

   These are INDEPENDENT checks, not screenshots. Where a lesson states a
   quantitative or behavioural claim, this suite recomputes the claim from
   first principles and compares, rather than asserting that some wording is
   present:

     - CAP-026 the motivation section's break-even arithmetic is recomputed,
       and its "binary search needs sorted data" claim is checked against the
       corpus's OWN binary-search module on unsorted input.
     - CAP-028 the note's attribution is checked against the corpus: the
       sorting sources really are declared over Item, `typedef int Item;`
       really is displayed in the ADT sources it cites, and each sorting
       note really does carry MACRO_NOTE's own wording unaltered, so the two
       statements of the macro contract cannot contradict each other.
     - CAP-037 each of the three methods is checked for a sorted result AND
       for the pointer story the lesson tells: node identity is tracked frame
       by frame, so "selection and insertion relink nodes" and "bubble
       rewrites no pointer" are measured, not asserted. The insertion
       comparison counts are recomputed from the displayed scan expression,
       which also re-verifies the RES-02 figures after the rewrite.
     - CAP-051 the padded radix result is compared against an independent
       comparison sort of the same keys, the per-pass least-significant-digit
       invariant is checked after every pass, and the equal-width case is
       checked to be byte-for-byte the quoted algorithm with no supplemental
       frame at all.                                                        */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
/* Default the repo root to this tree so the suite is self-contained. */
process.env.DSA_REPO_ROOT=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const LOADER=process.env.DSA_LOADER||'/home/claude/work/replay/reproduce/algorithm/load_modules.cjs';
const {api,context}=require(LOADER).load();

const strip=s=>String(s).replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim();
const macroNote=vm.runInContext('MACRO_NOTE',context);

let seed=0x5a17c0de;
const next=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0);
const rand=n=>next()%n;

let pass=0,fail=0;const results=[];
function chk(name,cond,detail){
  cond?pass++:fail++;
  results.push({name,ok:!!cond,detail:cond?undefined:String(detail).slice(0,300)});
  console.log('  '+(cond?'PASS':'FAIL')+'  '+name+(cond?'':'   <- '+String(detail).slice(0,240)));
}
function sections(id,inputs){
  const t=api.run(id,inputs||{});
  const view=t.f[t.f.length-1].view;
  if(view.kind!=='reference')throw new Error(id+' did not render a reference view');
  return view.sections;
}
function sectionNamed(secs,re){return secs.find(s=>re.test(String(s.title||'')));}

/* ==================================================================
   CAP-026  Sorting motivation (why sorting is useful) -> sortprops
   ================================================================== */
console.log('\n  CAP-026  sorting motivation');
{
  const secs=sections('sortprops');
  const mot=sectionNamed(secs,/why sorting/i);
  chk('sortprops renders a motivation section',!!mot,secs.map(s=>s.title).join(' | '));
  const text=mot?strip(mot.html):'';

  /* The three named reasons sorting pays, each identified by the mechanism it
     claims rather than by a keyword that could appear anywhere. */
  chk('the motivation names binary search and the O(n) -> O(log n) change',
      /binary search/i.test(text)&&/O\(n\)/.test(text)&&/O\(log n\)/.test(text),text.slice(0,200));
  chk('the motivation names duplicate and rank queries becoming a linear scan',
      /duplicate/i.test(text)&&/(rank|k-th smallest)/i.test(text)&&/(adjacent|one .*pass|linear)/i.test(text),text);
  chk('the motivation names merging and set operations becoming linear',
      /merg/i.test(text)&&/set operation/i.test(text)&&/O\(n \+ m\)/.test(text),text);
  chk('the motivation states the cost trade-off rather than only the benefits',
      /trade-off/i.test(text)&&/n log/i.test(text),text);

  /* The quantitative claim is RECOMPUTED, not trusted. For n items, q
     membership questions cost q*n unsorted, and n*log2(n) + q*log2(n) sorted,
     so the break-even q is n*log2(n)/(n - log2(n)). */
  const n=1000000,lg=Math.log2(n);
  const breakEven=Math.round(n*lg/(n-lg));
  const quoted=/after roughly (\d+) searches/i.exec(text);
  chk('the break-even search count stated is the one the arithmetic gives',
      !!quoted&&Number(quoted[1])===breakEven,
      quoted?`stated ${quoted[1]}, computed ${breakEven}`:'no break-even figure found in: '+text.slice(0,200));
  /* n log2 n is 19,931,569, so the lesson must present 20,000,000 as the
     rounding it is, with its basis, not as an equality. */
  chk('the stated sort and scan costs for n = 1,000,000 are right, and stated as roundings',
      /1,000,000/.test(text)&&/20,000,000/.test(text)&&/roughly 20,000,000/.test(text)
        &&Math.abs(n*lg-20000000)/20000000<0.01&&Math.round(lg)===20,
      'n log2 n = '+Math.round(n*lg)+', log2 n = '+lg);
  chk('the break-even is correctly characterised as about log2 n searches',
      /log<sub>2<\/sub> n of them/.test(String(mot.html))&&Math.abs(breakEven-lg)<1,
      'log2 n = '+lg+', break-even = '+breakEven);

  /* No course citation is invented for authored content. */
  chk('the motivation declares itself written by the tracer and not course material',
      /written by the tracer/i.test(text)&&/not attributed to the course/i.test(text),text.slice(-240));
  chk('the motivation cites no page or lecture reference of its own',
      !/\bpp?\.\s*\d|week\d|lec\d/i.test(text),text);

  /* The central claim is checked against this corpus's OWN binary search.
     The motivation must describe what `bin` ACTUALLY does with unordered
     input, which is to stop on its stated precondition - not to report a
     false miss, which is what an earlier draft of this section claimed. */
  const unsorted='9 1 8 2 7 3';
  const bf=api.run('bin',{a:unsorted,val:'7'}).f.slice(-1)[0];
  chk('binary search really does refuse unordered input, as the motivation says',
      /does not sort its input|already ordered/i.test(strip(bf.note)),strip(bf.note).slice(0,200));
  chk('the motivation describes that refusal rather than a false miss',
      /refuses an unordered one/i.test(text)&&!/reports a miss/i.test(text),text.slice(0,300));
  const sorted=unsorted.split(' ').map(Number).sort((a,b)=>a-b).join(' ');
  const sf=api.run('bin',{a:sorted,val:'7'}).f.slice(-1)[0];
  const got2=/[Rr]eturn <b>(-?\d+)<\/b>/.exec(sf.note);
  chk('binary search finds the same key once the data is sorted',
      !!got2&&Number(got2[1])>=0&&sorted.split(' ')[Number(got2[1])]==='7',
      'bin on "'+sorted+'" seeking 7 reported '+(got2?got2[1]:strip(sf.note)));
}

/* ==================================================================
   CAP-028  Item and key types -> visible in the sorting lessons
   ================================================================== */
console.log('\n  CAP-028  item and key types');
const ARRAY_SORTS=['sel','bub','ins','ms','qs','q3'];
{
  const secs=sections('sortprops');
  const item=sectionNamed(secs,/item and key types/i);
  chk('sortprops renders an Item/key-type contract section',!!item,secs.map(s=>s.title).join(' | '));
  const html=item?String(item.html):'',text=strip(html);
  chk('the contract section displays the typedef itself',/typedef int Item;/.test(text),text.slice(0,200));
  chk('the contract section names all four comparison macros',
      ['lt','le','ge','gt'].every(m=>new RegExp('<code>'+m+'</code>').test(html)),html.slice(0,300));
  chk('the contract section reuses MACRO_NOTE verbatim instead of re-wording it',
      html.includes(macroNote),'MACRO_NOTE not found verbatim in the section html');
  chk('the contract section explains what Item being an int means for stability',
      /stab/i.test(text)&&/indistinguishable/i.test(text),text);
  chk('the contract section separates the manual wording from the authored part',
      /source status/i.test(text)&&/written by the tracer/i.test(text),text.slice(-260));

  /* Each sorting lesson that USES Item now carries the contract. */
  for(const id of ARRAY_SORTS){
    const m=api.module(id),note=String(m.note||'');
    chk(id+': its note carries MACRO_NOTE unaltered',note.startsWith(macroNote),note.slice(0,120));
    chk(id+': its note shows the Item typedef',/typedef int Item;/.test(note),note.slice(0,200));
  }

  /* The attribution is checked against the corpus rather than assumed:
     the sorting sources really are declared over Item, and the typedef
     really is displayed in the ADT sources the note points at. */
  for(const id of ARRAY_SORTS){
    const srcs=api.module(id).blocks.map(b=>b.src).join('\n');
    chk(id+': its displayed source really is declared over Item',
        /\bItem\s+\w+\s*\[\s*\]|\bItem\s+item\b|\bItem\s+pivot\b|Item \*tmp/.test(srcs),'no Item declaration in displayed source');
    chk(id+': its displayed source does not declare Item itself (which is why the note must)',
        !/typedef\s+int\s+Item\s*;/.test(srcs),'the source already declares Item');
  }
  const adtSrc=['stack','queue'].map(id=>api.module(id).blocks.map(b=>b.src).join('\n')).join('\n');
  chk('typedef int Item; really is displayed in the Stack and Queue sources the note cites',
      ['stack','queue'].every(id=>/typedef\s+int\s+Item\s*;/.test(api.module(id).blocks.map(b=>b.src).join('\n'))),
      'not found in '+adtSrc.slice(0,80));
  const macroBlock=api.module('sel').blocks.find(b=>/macro/i.test(b.title));
  chk('the four macros named are the four the displayed macro block defines',
      !!macroBlock&&['lt','le','ge','gt'].every(m=>new RegExp('#define '+m+'\\(x, y\\)').test(macroBlock.src)),
      macroBlock?macroBlock.src:'no macro block');
}

/* ==================================================================
   CAP-037  Selection and bubble sort on a linked list -> listsorts
   ================================================================== */
console.log('\n  CAP-037  linked-list selection and bubble');
const METHODS=['insertion','selection','bubble'];
function listRun(a,method){
  const t=api.run('listsorts',method===undefined?{a}:{a,method});
  const frames=t.f.map(f=>{
    const lists=f.view.lists;
    const out=lists.length===1?lists[0]:lists[1];
    return {note:strip(f.note),line:f.line,
            chain:lists.map(L=>L.nodes.map(n=>n.sub).join(',')),
            ids:out.nodes.map(n=>n.sub),values:out.nodes.map(n=>n.v),
            heapLive:(f.heap||[]).filter(b=>b.live).length,
            events:(f.ev||[]).length};
  });
  return {t,frames,last:frames[frames.length-1]};
}
{
  const m=api.module('listsorts');
  const methodField=(m.fields||[]).find(f=>f.k==='method');
  chk('listsorts declares a method selector with all three lecture methods',
      !!methodField&&methodField.type==='select'&&METHODS.every(x=>methodField.options.includes(x)),
      JSON.stringify(methodField));
  chk("the method selector's default is valid on its own options",
      !!methodField&&methodField.options.includes(String(methodField.def)),JSON.stringify(methodField&&methodField.def));

  /* Defaults plus a single override must be valid for EVERY field, because
     that is how the oracle suite and the field sweeps call a module. */
  for(const f of m.fields){
    const probes=f.type==='select'?f.options:[String(f.def),'1 2 3','3 2 1','5','', '-2 0 -2 7'];
    for(const v of probes){
      let ok=true,why='';
      try{api.run('listsorts',{[f.k]:v});}catch(e){ok=false;why=e.message;}
      chk(`listsorts: defaults plus ${f.k}=${JSON.stringify(v)} runs`,ok,why);
    }
  }

  /* Every method sorts, over deterministic pseudo-random inputs plus the
     boundary cases the commission's sorting checklist names. */
  const cases=[[],[5],[2,1],[1,2],[4,4,4],[-3,0,-3,9,1],[8,7,6,5,4,3,2,1]];
  for(let k=0;k<24;k++)cases.push(Array.from({length:rand(9)},()=>rand(17)-8));
  for(const method of METHODS){
    let sortedAll=true,permAll=true,badCase=null;
    for(const arr of cases){
      const {last}=listRun(arr.join(' '),method);
      const expect=arr.slice().sort((x,y)=>x-y);
      const got=last.values;
      if(JSON.stringify(got)!==JSON.stringify(expect)){sortedAll=false;badCase={arr,got,expect};}
      if(JSON.stringify(got.slice().sort((x,y)=>x-y))!==JSON.stringify(expect)){permAll=false;}
    }
    chk(method+': sorts every case including empty, singleton, equal keys and negatives',sortedAll,JSON.stringify(badCase));
    chk(method+': the result is a permutation of the input multiset',permAll,'');
  }

  /* ---- the pointer story, measured frame by frame ---- */
  const input='4 1 7 3 8 6 5 2';
  const originalChain=input.split(' ').map((_,i)=>'n'+i).join(',');

  /* bubble: the lecture swaps VALUES, so the chain must be identical in
     every single frame - that is the whole lesson. */
  {
    const {frames,last}=listRun(input,'bubble');
    chk('bubble: the node chain is unchanged in every frame (no pointer is written)',
        frames.every(f=>f.chain.length===1&&f.chain[0]===originalChain),
        frames.map(f=>f.chain.join('/')).find(c=>c!==originalChain)||'');
    chk('bubble: its closing note claims zero pointer writes, which the chain confirms',
        /zero pointer writes/i.test(last.note)&&last.ids.join(',')===originalChain,last.note.slice(0,160));
    chk('bubble: values really did move even though nodes did not',
        last.values.join(' ')!=='4 1 7 3 8 6 5 2'&&last.values.join(' ')==='1 2 3 4 5 6 7 8',last.values.join(' '));
    /* The stated termination rule: repeat until a traversal makes no swaps,
       with no shrinking range. Recompute the traversal and swap counts. */
    const a=input.split(' ').map(Number);let tv=0,sw=0,moved=true;
    while(moved){moved=false;tv++;for(let j=0;j+1<a.length;j++)if(a[j]>a[j+1]){const x=a[j];a[j]=a[j+1];a[j+1]=x;moved=true;sw++;}}
    const quoted=/after (\d+) traversals? and (\d+) value swaps?/.exec(last.note);
    chk('bubble: the traversal and swap counts it reports match an independent run of the stated method',
        !!quoted&&Number(quoted[1])===tv&&Number(quoted[2])===sw,
        quoted?`reported ${quoted[1]}/${quoted[2]}, computed ${tv}/${sw}`:last.note.slice(0,160));
    chk('bubble: it highlights only the lecture block\'s bubble-sort lines',
        frames.every(f=>f.line[0]===0&&[5,6,7].includes(f.line[1])),
        [...new Set(frames.map(f=>f.line.join(':')))].join(' '));
  }

  /* selection: nodes ARE relinked, S is only ever written at its head, and
     each pass costs exactly three pointer writes. */
  {
    const {frames,last}=listRun(input,'selection');
    chk('selection: the nodes are relinked, so the final chain is a reordering of the original',
        last.ids.join(',')!==originalChain&&last.ids.slice().sort().join(',')===originalChain.split(',').sort().join(','),
        last.ids.join(','));
    /* Every push must put the moved node at the FRONT of S, and S must only
       ever grow - the lecture's "insert that node at the front of S". */
    const sStates=frames.map(f=>f.chain[1]).filter(x=>x!==undefined);
    let growsOnly=true,frontOnly=true;
    for(let i=1;i<sStates.length;i++){
      const before=sStates[i-1]?sStates[i-1].split(',').filter(Boolean):[];
      const after=sStates[i]?sStates[i].split(',').filter(Boolean):[];
      if(after.length<before.length)growsOnly=false;
      if(after.length===before.length+1&&after.slice(1).join(',')!==before.join(','))frontOnly=false;
    }
    chk('selection: S only ever grows',growsOnly,sStates.join(' | ').slice(0,200));
    chk('selection: every node added to S is pushed at its front, leaving the rest of S untouched',
        frontOnly,sStates.join(' | ').slice(0,200));
    const n=input.split(' ').length;
    const quoted=/in (\d+) passe?s? and (\d+) pointer writes?/.exec(last.note);
    chk('selection: the pass and pointer-write counts it reports are the ones the method performs',
        !!quoted&&Number(quoted[1])===n&&Number(quoted[2])===3*n,
        quoted?`reported ${quoted[1]}/${quoted[2]}, expected ${n}/${3*n}`:last.note.slice(0,200));
    chk('selection: it takes the LARGEST remaining value each pass, as the lecture states',
        frames.some(f=>/largest/i.test(f.note)),'no pass mentions the largest value');
    chk('selection: it highlights only the lecture block\'s selection-sort lines',
        frames.every(f=>f.line[0]===0&&[1,2,3].includes(f.line[1])),
        [...new Set(frames.map(f=>f.line.join(':')))].join(' '));
  }

  /* insertion: unchanged semantics, which the RES-02 comparison figures in
     course-enhancements.js depend on. Recompute them from the displayed scan
     expression `while (i < S.length && S[i] <= v) i++`. */
  {
    const {frames,last}=listRun(input,'insertion');
    chk('insertion: the nodes are relinked into sorted order',
        last.values.join(' ')==='1 2 3 4 5 6 7 8'&&last.ids.join(',')!==originalChain,last.ids.join(','));
    chk('insertion: it highlights only the lecture block\'s insertion-sort lines',
        frames.every(f=>f.line[0]===0&&[9,10].includes(f.line[1])),
        [...new Set(frames.map(f=>f.line.join(':')))].join(' '));
    const presets={sorted:'1 2 3 4 5 6',reverse:'6 5 4 3 2 1',duplicates:'4 2 4 1 2 3'};
    const expected={sorted:15,reverse:5,duplicates:11};
    for(const [name,text] of Object.entries(presets)){
      /* One EVALUATION of `S[i] <= v` is the register's counted operation, so
         the failing test that stops the scan counts and `i < S.length`
         short-circuiting means an empty S costs nothing. */
      const S=[];let total=0;
      for(const v of text.split(' ').map(Number)){
        let i=0;while(i<S.length){total++;if(!(S[i]<=v))break;i++;}S.splice(i,0,v);}
      const traced=listRun(text,'insertion').frames
        .map(f=>/after (\d+) evaluations? of S\[i\]/.exec(f.note)).filter(Boolean)
        .reduce((s,m)=>s+Number(m[1]),0);
      chk(`insertion: the ${name} preset still performs ${expected[name]} scan comparisons (RES-02)`,
          total===expected[name]&&traced===expected[name],`oracle ${total}, traced ${traced}, register ${expected[name]}`);
    }
  }

  /* No method may allocate or free: the lesson says these sorts move the
     same allocated nodes. */
  for(const method of METHODS){
    const {frames}=listRun(input,method);
    chk(method+': allocates and frees nothing, as the lesson claims',
        frames.every(f=>f.heapLive===0&&f.events===0),'a heap block or memory event was recorded');
  }

  /* Honesty labelling required by the commission for authored content. */
  const note=String(m.note||'');
  chk('listsorts still states that the lecture supplies methods rather than C',
      /rather than as C/i.test(note)&&/no source C is invented/i.test(note),note.slice(0,200));
  chk('listsorts labels its authored commentary as supplemental, not as course source',
      /supplemental/i.test(note)&&/written by the tracer/i.test(note)&&/not course material/i.test(note),note.slice(0,400));
}

/* ==================================================================
   CAP-051  Radix key padding for unequal-width keys -> radix
   ================================================================== */
console.log('\n  CAP-051  radix key padding');
function radixRun(a){
  const t=api.run('radix',{a});
  const frames=t.f.map(f=>({note:strip(f.note),line:f.line,
    rows:f.view.rows.map(r=>({label:r.label,a:r.a.slice()}))}));
  return {t,frames,last:frames[frames.length-1]};
}
const rowNamed=(f,re)=>f.rows.find(r=>re.test(r.label));
{
  /* The exact input the audit recorded as refused. */
  let threw=null;
  try{radixRun('7 42 318');}catch(e){threw=e.message;}
  chk('the mixed-width input the audit recorded is accepted instead of refused',!threw,threw);

  const m=api.module('radix');
  chk('the radix field label no longer promises fixed width only',
      !/fixed width/i.test(m.fields[0].label),m.fields[0].label);
  chk('the default input exercises the padding, so the promise is visible without configuration',
      new Set(String(m.fields[0].def).split(/\s+/).map(k=>k.length)).size>1,String(m.fields[0].def));

  /* ---- the padded result must agree with an independent comparison sort ---- */
  const cases=['7 42 318','7 42 318 9 1000 57','1000 9','5','0 00 000','007 42 8',
               '9 99 999 9999','1 10 100 1000 10000','42 7 7 42 318 0'];
  for(let k=0;k<30;k++)
    cases.push(Array.from({length:1+rand(7)},()=>String(rand(100000))).join(' '));
  let allAgree=true,bad=null;
  for(const a of cases){
    const keys=a.split(/\s+/).filter(Boolean);
    const width=keys.reduce((w,k)=>Math.max(w,k.length),0);
    /* Independent comparison sort of the SAME keys, on the padded forms, by
       plain string comparison - a different mechanism from bucket passes. */
    const want=keys.map(k=>k.padStart(width,'0')).sort((x,y)=>x<y?-1:x>y?1:0);
    /* And numerically, which must give the same order for unsigned numerals. */
    const wantNumeric=keys.slice().sort((x,y)=>Number(x)-Number(y)).map(k=>k.padStart(width,'0'));
    const {last}=radixRun(a);
    const got=(rowNamed(last,/^A( \(padded\))?$/)||last.rows[0]).a;
    if(JSON.stringify(got)!==JSON.stringify(want)||JSON.stringify(want)!==JSON.stringify(wantNumeric)){
      allAgree=false;bad={a,got,want,wantNumeric};
    }
  }
  chk('the padded sort agrees with an independent comparison sort of the same keys, on 39 cases',
      allAgree,JSON.stringify(bad));

  /* ---- the least-significant-digit invariant after every pass ---- */
  {
    const a='7 42 318 9 1000 57';
    const {frames}=radixRun(a);
    const width=4;let ok=true,why='';
    /* After the gather for pass i, A must be sorted by the suffix starting at
       position i - that is what makes the next pass's stability sufficient. */
    const gathers=frames.filter(f=>/rebuilt by visiting the buckets/.test(f.note));
    chk('one gather frame per symbol position',gathers.length===width,gathers.length+' of '+width);
    gathers.forEach((f,idx)=>{
      const i=width-idx;                        /* i runs m down to 1 */
      const A=(rowNamed(f,/^A( \(padded\))?$/)||f.rows[0]).a;
      for(let p=1;p<A.length;p++)
        if(A[p-1].slice(i-1)>A[p].slice(i-1)){ok=false;why=`pass i=${i}: ${A[p-1]} before ${A[p]}`;}
    });
    chk('after each pass A is sorted by the suffix that pass has processed',ok,why);
  }

  /* ---- the padding is stated, labelled and reversible ---- */
  {
    const {frames,last}=radixRun('7 42 318 9 1000 57');
    const padFrames=frames.filter(f=>/not in the manual/i.test(f.note));
    chk('exactly one frame is marked as not part of the manual',padFrames.length===1,padFrames.length);
    const pf=padFrames[0]||{note:'',rows:[]};
    chk('that frame states which end is padded and with what',
        /padded on the left/i.test(pf.note)&&/with 0/i.test(pf.note),pf.note.slice(0,220));
    chk('that frame says why left padding preserves the order',
        /leading 0 does not change what the numeral denotes/i.test(pf.note),pf.note.slice(0,260));
    chk('that frame says why right padding would be wrong for this pass order',
        /right would turn 7 into 7000/i.test(pf.note)&&/units digit/i.test(pf.note),pf.note.slice(0,320));
    chk('that frame shows the keys as entered beside the padded keys',
        !!rowNamed(pf,/as entered/)&&!!rowNamed(pf,/padded/),pf.rows.map(r=>r.label).join(' | '));
    chk('it highlights the pseudocode precondition the padding establishes',
        pf.line&&pf.line[0]===0&&/where each key consists of m symbols/
          .test(api.module('radix').blocks[0].src.split('\n')[pf.line[1]-1]||''),
        JSON.stringify(pf.line));
    const entered=rowNamed(last,/as entered/);
    chk('the closing frame reads the keys back exactly as entered, in sorted order',
        !!entered&&entered.a.join(' ')==='7 9 42 57 318 1000',entered?entered.a.join(' '):'no row');
    const kept=radixRun('007 42 8').last;
    chk('a key entered with its own leading zeros is read back unchanged, not stripped',
        rowNamed(kept,/as entered/).a.join(' ')==='007 8 42',rowNamed(kept,/as entered/).a.join(' '));
  }

  /* ---- the quoted original behaviour stays identifiable ---- */
  {
    const manualExample='329 457 657 839 436 720 355';
    const {t,frames}=radixRun(manualExample);
    chk('equal-width input emits NO supplemental frame at all',
        !frames.some(f=>/not in the manual|supplemental/i.test(f.note)),
        frames.filter(f=>/supplemental/i.test(f.note)).map(f=>f.note.slice(0,80)).join(' | '));
    chk('equal-width input traces the quoted algorithm at its original 35 frames',
        t.f.length===35,t.f.length);
    chk('equal-width input labels its array plainly, with no padding caveat',
        frames.every(f=>f.rows.every(r=>!/padded|as entered/.test(r.label))),
        frames.flatMap(f=>f.rows.map(r=>r.label)).find(l=>/padded|as entered/.test(l))||'');
    chk('the displayed pseudocode is still the manual block, with no padding step added to it',
        !/pad/i.test(api.module('radix').blocks[0].src),api.module('radix').blocks[0].src.slice(0,80));
    const note=String(api.module('radix').note||'');
    chk('the module note labels the padding as a supplemental extension, not as the manual',
        /supplemental extension/i.test(note)&&/written by the tracer/i.test(note)&&/not part of the manual/i.test(note),
        note.slice(0,300));
    chk('the module note still records that the manual itself supplies no padding step',
        /supplies no step that establishes it|does not pad/i.test(note),note.slice(0,400));
  }

  /* ---- the domain was widened, not narrowed ---- */
  for(const [a,why] of [['1 -2','a negative key'],['1 a','a non-decimal key'],['','no key at all']]){
    let rejected=false;
    try{api.run('radix',{a});}catch(e){rejected=true;}
    chk('still rejects '+why,rejected,'accepted '+JSON.stringify(a));
  }
}

console.log('\n  CAP-026 / CAP-028 / CAP-037 / CAP-051 assertions: passed='+pass+' failed='+fail);
if(process.env.DSA_JSON_OUT)
  fs.writeFileSync(process.env.DSA_JSON_OUT,JSON.stringify({suite:'sorting_coverage',passed:pass,failed:fail,results},null,1));
process.exitCode=fail?1:0;
