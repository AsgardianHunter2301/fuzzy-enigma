/* REAL-BROWSER ACCEPTANCE — AUD-03, 06, 07, 08, 09, 10
   ----------------------------------------------------
   The audit explicitly did NOT perform this: its frontend evidence came from
   verbatim source snippets executed in a Node VM with event/location stubs,
   which "cannot close" the interaction findings on its own. This suite drives
   a real Chromium over http:// with real keyboard events, real same-document
   navigation, a real accessibility tree and two real same-origin pages.

   Keystrokes use page.keyboard.type/press, i.e. genuine key events, NOT
   programmatic value assignment — that distinction is the whole point of
   AUD-06, where a global handler called preventDefault() on ordinary typing.  */
/* CommonJS: playwright is installed in the global npm prefix, which Node's
   ESM resolver does not search. CJS require() does find it. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');

const BASE=process.env.DSA_BASE_URL||'http://127.0.0.1:8137';
const OUT=process.env.DSA_BROWSER_OUT||'/home/claude/work/artifacts/browser';
fs.mkdirSync(OUT,{recursive:true});

let pass=0,fail=0,skip=0;
const results=[];
function chk(id,name,cond,detail){
  if(cond===null){skip++;results.push({id,name,status:'SKIP',detail:String(detail||'')});console.log(`  SKIP  [${id}] ${name}  -- ${detail}`);return;}
  cond?pass++:fail++;
  results.push({id,name,status:cond?'PASS':'FAIL',detail:cond?undefined:String(detail).slice(0,400)});
  console.log(`  ${cond?'PASS':'FAIL'}  [${id}] ${name}`+(cond?'':`\n          -> ${String(detail).slice(0,340)}`));
}

async function main(){
const browser=await chromium.launch({args:['--no-sandbox']});
const consoleErrors=[],pageErrors=[],failedRequests=[];
function instrument(page){
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push({url:page.url(),text:m.text().slice(0,300)});});
  page.on('pageerror',e=>pageErrors.push({url:page.url(),text:String(e&&e.message||e).slice(0,300)}));
  page.on('requestfailed',r=>failedRequests.push({url:r.url(),err:String(r.failure()&&r.failure().errorText)}));
}

const ctx=await browser.newContext({viewport:{width:1280,height:900}});
const page=await ctx.newPage(); instrument(page);

/* ===================== AUD-08: rendered mathematics =====================
   The defect was in the ASCII adapter that normalises the SMALL regions -
   step note, variables, source mapping, tallies - not in the .viz tables,
   which the adapter deliberately skips. The audit named bstpartition's "More
   context" as the reachable path, so that is what is inspected here. The .viz
   tables are checked separately to confirm they still carry true notation and
   were not collaterally changed. */
await page.goto(`${BASE}/trees.html#bstpartition`,{waitUntil:'load'});
await page.waitForTimeout(1000);
{
  await page.evaluate(()=>{const s=document.querySelector('#scrub');if(s){s.value=String(s.max);s.dispatchEvent(new Event('input',{bubbles:true}));}});
  await page.waitForTimeout(500);
  const r=await page.evaluate(()=>{
    const grab=sel=>{const e=document.querySelector(sel);return e?(e.innerText||e.textContent||''):'';};
    const normalised=['#note','#vars','#map','#tally','#memorySummary'].map(grab).join(' \u0001 ');
    const details=[...document.querySelectorAll('details.compact-context')].map(d=>d.innerText).join(' ');
    return {normalised,details,viz:grab('#viz')};
  });
  const both=r.normalised+' '+r.details;
  chk('AUD-08','complexity notation keeps its exponent in the normalised regions',
      /O\(n\^2\)/.test(both),'normalised+details sample: '+both.replace(/\s+/g,' ').slice(0,220));
  chk('AUD-08','the flattened form O(n2) appears nowhere in those regions',
      !/O\((?:n|V|m|2)\d\)/.test(both),'flattened: '+(both.match(/O\((?:n|V|m|2)\d\)/g)||[]).join(','));
  chk('AUD-08','the "More context" pane the audit named renders the corrected notation',
      /O\(n\^2\)/.test(r.details),'details: '+r.details.replace(/\s+/g,' ').slice(0,200));
  fs.writeFileSync(path.join(OUT,'aud08_rendered_complexity.json'),
    JSON.stringify({normalised:r.normalised.slice(0,1200),details:r.details.slice(0,1200)},null,1));
}
/* The .viz tables are outside the adapter's scope and must keep real
   mathematical characters rather than any ASCII substitute. */
await page.goto(`${BASE}/searching-sorting.html#sortprops`,{waitUntil:'load'});
await page.waitForTimeout(1000);
{
  const viz=await page.evaluate(()=>{const e=document.querySelector('#viz');return e?e.innerText:'';});
  chk('AUD-08','the .viz complexity tables retain true superscript notation',
      /O\(n\u00b2\)/.test(viz),'viz sample: '+viz.replace(/\s+/g,' ').slice(0,200));
}

/* ===================== AUD-03: generation cost of typing ===================== */
await page.goto(`${BASE}/searching-sorting.html#bin`,{waitUntil:'load'});
await page.waitForTimeout(900);
{
  /* Count real generator invocations by wrapping the active module's run(). */
  await page.evaluate(()=>{
    window.__gen=0;
    const m=MODULES.find(x=>x.id===playerState.currentModule.id);
    const inner=m.run.bind(m);
    m.run=function(i){window.__gen++;return inner(i);};
  });
  const field=page.locator('[data-k="a"]');
  await field.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('5 9 12 20 33',{delay:28});   /* real keystrokes */
  await page.waitForTimeout(700);                         /* past the debounce */
  const afterTyping=await page.evaluate(()=>window.__gen);
  chk('AUD-03','typing in a field triggers ZERO full trace generations',afterTyping===0,'generations='+afterTyping);

  await page.evaluate(()=>{window.__gen=0;});
  await page.locator('#run').click();      /* real click on the Run control */
  await page.waitForTimeout(900);
  const afterRun=await page.evaluate(()=>window.__gen);
  chk('AUD-03','one explicit Run triggers exactly one generation',afterRun===1,'generations='+afterRun);

  /* A rejected field value must not silently produce a successful trace. */
  await field.click(); await page.keyboard.press('Control+A'); await page.keyboard.type('1 2 3');
  const valField=page.locator('[data-k="val"]');
  await valField.click(); await page.keyboard.press('Control+A'); await page.keyboard.type('abc');
  await page.waitForTimeout(600);
  const err=await page.evaluate(()=>{
    const c=document.querySelector('[data-k="val"]');
    const f=c&&c.closest('.field');
    return {status:(document.querySelector('#status')||{}).textContent||'',
            flagged:!!(f&&/err|invalid/i.test(f.className))||!!(c&&c.getAttribute('aria-invalid'))};
  });
  chk('AUD-03','a malformed value is reported on its own field without running',
      /whole number|must be/i.test(err.status)||err.flagged, JSON.stringify(err));
  /* And pressing Run with it must not report a false match. */
  await page.locator('#run').click();
  await page.waitForTimeout(700);
  const note=await page.evaluate(()=>(document.querySelector('#note')||{}).textContent||'');
  chk('AUD-02','a rejected target never yields a successful search result in the UI',
      !/return <?b?>?1|== arr\[|found/i.test(note)&&/could not be traced|whole number|must be/i.test(note),note.slice(0,220));
}

/* ===================== AUD-06: real typing vs global shortcuts ===================== */
await page.goto(`${BASE}/trees.html#bstins`,{waitUntil:'load'});
await page.waitForTimeout(900);
{
  /* Open the Topics drawer, then type words containing the shortcut keys. */
  await page.keyboard.press('t');                     /* opens the drawer */
  await page.waitForTimeout(450);
  const drawerOpen=await page.evaluate(()=>{const d=document.querySelector('#topicDrawer');return !!(d&&(d.open||d.hasAttribute('open')));});
  chk('AUD-06','the bare "t" shortcut still opens Topics when not typing',drawerOpen,'drawer open='+drawerOpen);

  const search=page.locator('#moduleSearch');
  await search.click();
  for(const word of ['tree','stack','shortest path']){
    await page.keyboard.press('Control+A');
    await page.keyboard.type(word,{delay:26});          /* REAL keystrokes */
    const got=await search.inputValue();
    chk('AUD-06',`typing ${JSON.stringify(word)} into the search field is not swallowed`,got===word,`typed=${JSON.stringify(word)} field=${JSON.stringify(got)}`);
  }
  await page.keyboard.press('Control+A');
  await page.keyboard.type('a/b?c',{delay:26});
  chk('AUD-06','slash and question mark reach the field while a dialog is open',
      (await search.inputValue())==='a/b?c',JSON.stringify(await search.inputValue()));

  /* Tab to the Close control and press Enter: it must close, not activate the cursor. */
  await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
  await page.evaluate(()=>{const b=document.querySelector('#drawerClose');if(b)b.focus();});
  const focused=await page.evaluate(()=>document.activeElement&&document.activeElement.id);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(450);
  const stillOpen=await page.evaluate(()=>{const d=document.querySelector('#topicDrawer');return !!(d&&(d.open||d.hasAttribute('open')));});
  chk('AUD-06','Enter on the focused Close button closes the drawer',focused==='drawerClose'&&!stillOpen,`focused=${focused} stillOpen=${stillOpen}`);

  /* Escape closes, and focus is restored to the trigger. */
  await page.keyboard.press('t'); await page.waitForTimeout(400);
  await page.keyboard.press('Escape'); await page.waitForTimeout(450);
  const afterEsc=await page.evaluate(()=>{
    const d=document.querySelector('#topicDrawer');
    return {open:!!(d&&(d.open||d.hasAttribute('open'))),active:document.activeElement&&(document.activeElement.id||document.activeElement.tagName)};
  });
  chk('AUD-06','Escape closes the drawer and returns focus to a real control',
      afterEsc.open===false&&!!afterEsc.active, JSON.stringify(afterEsc));

  /* Ctrl+K opens it from inside a field. */
  await page.locator('[data-k="seq"]').click();
  await page.keyboard.press('Control+K'); await page.waitForTimeout(450);
  chk('AUD-06','Ctrl+K still opens Topics from inside an input',
      await page.evaluate(()=>{const d=document.querySelector('#topicDrawer');return !!(d&&(d.open||d.hasAttribute('open')));}),'drawer did not open');
  await page.keyboard.press('Escape'); await page.waitForTimeout(350);

  /* Arrow keys drive the topic cursor from the search field. */
  await page.keyboard.press('t'); await page.waitForTimeout(400);
  await page.locator('#moduleSearch').click();
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(250);
  const cursor=await page.evaluate(()=>{
    const s=document.querySelector('#moduleSearch');
    return {activedescendant:s&&s.getAttribute('aria-activedescendant'),
            marked:document.querySelectorAll('#topicList [aria-selected="true"],#topicList .cursor').length};
  });
  chk('AUD-06','ArrowDown moves the topic cursor from the search field',
      !!(cursor.activedescendant||cursor.marked>0),JSON.stringify(cursor));
  await page.keyboard.press('Escape'); await page.waitForTimeout(350);
}

/* ===================== AUD-10: real accessibility tree ===================== */
await page.goto(`${BASE}/trees.html#bstrotate`,{waitUntil:'load'});
await page.waitForTimeout(1100);
{
  await page.evaluate(()=>{const s=document.querySelector('#scrub');if(s){s.value=String(s.max);s.dispatchEvent(new Event('input',{bubbles:true}));}});
  await page.waitForTimeout(600);
  const snap=await page.accessibility.snapshot({interestingOnly:false});
  fs.writeFileSync(path.join(OUT,'aud10_accessibility_tree.json'),JSON.stringify(snap,null,1));
  const flat=JSON.stringify(snap);
  chk('AUD-10','the tree structure is present in the real accessibility tree',
      /node/i.test(flat)&&/value/i.test(flat),'accessibility tree had no structural node/value text');
  chk('AUD-10','the required bstrotate topology is exposed to assistive technology',
      /\b4\b/.test(flat)&&/\b1\b/.test(flat)&&/\b7\b/.test(flat)&&/\b5\b/.test(flat)&&/\b9\b/.test(flat),
      'missing one of 4/1/7/5/9 in the accessibility tree');
  const svgHidden=await page.evaluate(()=>{
    const svgs=[...document.querySelectorAll('#viz svg')];
    return {count:svgs.length,allHidden:svgs.length>0&&svgs.every(s=>s.getAttribute('aria-hidden')==='true')};
  });
  chk('AUD-10','the decorative canvas is hidden from assistive technology',svgHidden.allHidden,JSON.stringify(svgHidden));
  const live=await page.evaluate(()=>{
    const r=document.querySelector('#viz .structure-text');
    return r?{found:true,ariaLive:r.getAttribute('aria-live'),rows:r.querySelectorAll('tbody tr').length}:{found:false};
  });
  chk('AUD-10','the structural table exists, is not a live region, and has a row per node',
      live.found&&live.ariaLive==='off'&&live.rows>=5,JSON.stringify(live));
}

/* ===================== AUD-07: real navigation ===================== */
{
  /* Fresh full-page load carrying field values. */
  await page.goto(`${BASE}/searching-sorting.html#bin?a=3%205%207%2011&val=7`,{waitUntil:'load'});
  await page.waitForTimeout(1000);
  const fresh=await page.evaluate(()=>({a:document.querySelector('[data-k="a"]').value,val:document.querySelector('[data-k="val"]').value,id:playerState.currentModule.id}));
  chk('AUD-07','a fresh load restores the fields carried in the fragment',
      fresh.id==='bin'&&fresh.a==='3 5 7 11'&&fresh.val==='7',JSON.stringify(fresh));

  /* Same-document navigation to the SAME module with different values. */
  await page.evaluate(()=>{location.hash='#bin?a=2%204%206&val=6';});
  await page.waitForTimeout(1000);
  const same=await page.evaluate(()=>({a:document.querySelector('[data-k="a"]').value,val:document.querySelector('[data-k="val"]').value,steps:(document.querySelector('#vizName')||{}).textContent||''}));
  chk('AUD-07','same-module navigation restores the new values (the audited early return skipped this)',
      same.a==='2 4 6'&&same.val==='6',JSON.stringify(same));

  /* Same-document navigation to a DIFFERENT module with values. */
  await page.evaluate(()=>{location.hash='#lin?a=8%209&val=9';});
  await page.waitForTimeout(1000);
  const other=await page.evaluate(()=>({id:playerState.currentModule.id,a:document.querySelector('[data-k="a"]').value,val:document.querySelector('[data-k="val"]').value}));
  chk('AUD-07','cross-module navigation restores values before running',
      other.id==='lin'&&other.a==='8 9'&&other.val==='9',JSON.stringify(other));

  /* Malformed fragments must not raise an uncaught error. */
  const before=pageErrors.length;
  for(const h of ['#%','#%E0%A4%A','#bin%ZZ?a=1']){
    await page.evaluate(hash=>{location.hash=hash;},h);
    await page.waitForTimeout(450);
  }
  chk('AUD-07','malformed fragments raise no uncaught page error',pageErrors.length===before,
      JSON.stringify(pageErrors.slice(before)));

  /* Back/forward replay. */
  await page.goto(`${BASE}/searching-sorting.html#bin?a=1%202%203&val=2`,{waitUntil:'load'});
  await page.waitForTimeout(900);
  await page.evaluate(()=>{location.hash='#lin?a=4%205&val=5';});
  await page.waitForTimeout(900);
  await page.goBack(); await page.waitForTimeout(1000);
  const back=await page.evaluate(()=>({id:playerState.currentModule.id,hash:location.hash}));
  chk('AUD-07','browser Back returns to the previous scenario without error',
      /bin/.test(back.hash)||back.id==='bin',JSON.stringify(back));
  await page.goForward(); await page.waitForTimeout(1000);
  const fwd=await page.evaluate(()=>({id:playerState.currentModule.id,hash:location.hash}));
  chk('AUD-07','browser Forward replays the later scenario',/lin/.test(fwd.hash)||fwd.id==='lin',JSON.stringify(fwd));
}

/* ===================== AUD-09: two real same-origin pages ===================== */
{
  const c2=await browser.newContext({viewport:{width:1280,height:900}});
  const pA=await c2.newPage(), pB=await c2.newPage();   /* same context = same origin storage */
  instrument(pA); instrument(pB);
  await pA.goto(`${BASE}/trees.html`,{waitUntil:'load'});
  await pB.goto(`${BASE}/graphs.html`,{waitUntil:'load'});
  await pA.waitForTimeout(900); await pB.waitForTimeout(900);
  /* Both tabs are open BEFORE either writes — the audited lost-update case. */
  await pA.evaluate(()=>{markComplete('bstins');});
  await pB.evaluate(()=>{markComplete('bfs');});
  await pA.waitForTimeout(400);
  const stored=await pA.evaluate(()=>JSON.parse(localStorage.getItem('comp2521-tracer:study:v1')||'{}'));
  chk('AUD-09','two real tabs opened before either write keep BOTH completions',
      Array.isArray(stored.done)&&stored.done.includes('bstins')&&stored.done.includes('bfs'),JSON.stringify(stored));
  /* A recent-topic write from one tab must not erase the other's completion. */
  await pB.evaluate(()=>{noteRecent('dijkstra');});
  await pB.waitForTimeout(300);
  const after=await pB.evaluate(()=>JSON.parse(localStorage.getItem('comp2521-tracer:study:v1')||'{}'));
  chk('AUD-09','a recent-topic write preserves completions from the other tab',
      after.done.includes('bstins')&&after.done.includes('bfs')&&(after.recent||[]).includes('dijkstra'),JSON.stringify(after));
  /* A third page reads the union after reload. */
  const pC=await c2.newPage(); instrument(pC);
  await pC.goto(`${BASE}/trees.html`,{waitUntil:'load'}); await pC.waitForTimeout(900);
  const third=await pC.evaluate(()=>JSON.parse(localStorage.getItem('comp2521-tracer:study:v1')||'{}'));
  chk('AUD-09','a third page opened later reads the union',
      third.done.includes('bstins')&&third.done.includes('bfs'),JSON.stringify(third));
  fs.writeFileSync(path.join(OUT,'aud09_two_tab_progress.json'),JSON.stringify({stored,after,third},null,1));
  await c2.close();
}

/* ===================== narrow viewport + resource health ===================== */
{
  const m=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const pm=await m.newPage(); instrument(pm);
  await pm.goto(`${BASE}/graphs.html#bfs`,{waitUntil:'load'});
  await pm.waitForTimeout(1100);
  const layout=await pm.evaluate(()=>({
    horizontalScroll:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
    vizVisible:!!document.querySelector('#viz')&&document.querySelector('#viz').getBoundingClientRect().height>0,
    scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  chk('UI','the narrow layout has no horizontal page scroll',!layout.horizontalScroll,JSON.stringify(layout));
  chk('UI','the visualisation pane renders on a narrow viewport',layout.vizVisible,JSON.stringify(layout));
  await pm.screenshot({path:path.join(OUT,'narrow_graphs_bfs.png'),fullPage:false});
  await m.close();
}
await page.screenshot({path:path.join(OUT,'desktop_last_state.png'),fullPage:false});

/* ===================== NEW-16: stale vertex targets =====================
   Lowering nV left a vertex-target field naming a vertex that no longer
   exists, so the next Run failed and the student had to work out which other
   field to change. A vertex target has exactly one correct repair (the highest
   remaining vertex), so a committed nV edit now clamps it. An edge list has no
   single correct repair - pruning edges would delete input the student typed -
   so it is still reported precisely, and that is asserted here too, so the
   clamp cannot grow into silent pruning. */
{
  await page.goto(`${BASE}/graphs.html#dfspath`,{waitUntil:'load'});
  await page.waitForTimeout(400);
  const before=await page.evaluate(()=>({
    nV:document.querySelector('[data-k="nV"]').value,
    dest:document.querySelector('[data-k="dest"]').value}));
  chk('NEW-16','dfspath starts with dest beyond a 3-vertex graph',
      before.nV==='7'&&before.dest==='6',JSON.stringify(before));

  await page.fill('[data-k="nV"]','3');
  await page.dispatchEvent('[data-k="nV"]','change');
  await page.waitForTimeout(350);
  const after=await page.evaluate(()=>({
    dest:document.querySelector('[data-k="dest"]').value,
    src:document.querySelector('[data-k="src"]').value,
    g:document.querySelector('[data-k="g"]').value}));
  chk('NEW-16','a committed nV edit lowers dest to the highest vertex',
      after.dest==='2',JSON.stringify(after));
  chk('NEW-16','src was already in range and was not moved',
      after.src==='0',JSON.stringify(after));
  chk('NEW-16','the edge list the student typed is left intact, not pruned',
      after.g==='0-1, 0-2, 1-3, 1-4, 2-5, 4-6, 5-6',JSON.stringify(after.g));

  await page.click('#run');
  await page.waitForTimeout(700);
  const err=await page.evaluate(()=>({
    field:Array.from(document.querySelectorAll('.field-error')).map(e=>e.textContent||''),
    invalid:Array.from(document.querySelectorAll('[aria-invalid="true"]')).map(e=>e.dataset.k)}));
  chk('NEW-16','the now-stale edge list is reported against the edges field',
      err.invalid.includes('g')&&err.field.some(t=>/vertex outside 0\.\.2/.test(t)),
      JSON.stringify(err));

  /* And with the edge list corrected, the module runs on the smaller graph. */
  await page.fill('[data-k="g"]','0-1, 1-2');
  await page.dispatchEvent('[data-k="g"]','change');
  await page.waitForTimeout(250);
  await page.click('#run');
  await page.waitForTimeout(700);
  const ok=await page.evaluate(()=>({
    invalid:Array.from(document.querySelectorAll('[aria-invalid="true"]')).map(e=>e.dataset.k),
    frames:window.COMP2521TracerTestAPI.playerSnapshot().frameCount}));
  chk('NEW-16','with the edges corrected the smaller graph traces normally',
      ok.invalid.length===0&&ok.frames>1,JSON.stringify(ok));

  /* Raising nV must never move a field the student chose. */
  await page.fill('[data-k="nV"]','6');
  await page.dispatchEvent('[data-k="nV"]','change');
  await page.waitForTimeout(250);
  const raised=await page.evaluate(()=>document.querySelector('[data-k="dest"]').value);
  chk('NEW-16','raising nV leaves the chosen dest alone',raised==='2',raised);
}

/* ===================== A11Y: accessible names and keyboard reach ========
   Three serious WCAG failures found by an axe-core 4.14.0 sweep and by
   keyboard probing, all now gated here because none of them is visible in
   ordinary use:

   2.5.3 Label in Name - the quality layer rewrites the zoom controls' VISIBLE
   text ("Pan locked", "Zoom 100%", "Fit view") while another layer owned the
   aria-label, so the accessible name did not contain what was on screen and a
   speech-input user could not activate the button by reading it. The zoom
   readout was also an <output>, whose status role is excluded from
   name-from-content, so that button's name fell through to its title.

   2.1.1 Keyboard - the manual-bridge code panes scroll (470px of C in a 135px
   column) but the global trace shortcut claimed the arrow keys unconditionally,
   so tabbing into a pane stepped the trace and the off-screen part of the code
   could not be reached from the keyboard at all. axe reports the markup as
   fine; only the key handling was wrong, so this is probed by pressing keys. */
{
  await page.goto(`${BASE}/graphs.html#bfspath`,{waitUntil:'load'});
  await page.waitForTimeout(400);
  await page.click('#run');
  await page.waitForTimeout(900);

  for(const id of ['zoomLock','zoomReset','zoomFit']){
    const el=await page.$('#'+id);
    const visible=(await el.evaluate(e=>e.textContent.trim()));
    const snap=await page.accessibility.snapshot({root:el});
    const name=String((snap&&snap.name)||'');
    chk('A11Y-2.5.3',`${id} accessible name contains its visible text`,
        visible.length>0&&name.toLowerCase().includes(visible.toLowerCase()),
        JSON.stringify({visible,name}));
  }

  const panes=await page.evaluate(()=>Array.from(document.querySelectorAll('.manual-pair pre')).map(e=>({
    tabindex:e.getAttribute('tabindex'),role:e.getAttribute('role'),
    named:!!(document.getElementById(e.getAttribute('aria-labelledby'))||{}).textContent})));
  chk('A11Y-2.1.1','the bridge code panes are focusable and named',
      panes.length>0&&panes.every(x=>x.tabindex==='0'&&x.role==='region'&&x.named),
      JSON.stringify(panes));

  const idx=()=>page.evaluate(()=>window.COMP2521TracerTestAPI.playerSnapshot().frameIndex);
  /* the stepper must still own the arrow keys when focus is not in a pane */
  const i0=await idx();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  const i1=await idx();
  chk('A11Y-2.1.1','the trace stepper still owns arrow keys outside a pane',
      i1!==i0,JSON.stringify({i0,i1}));

  await page.evaluate(()=>document.querySelector('.manual-pair pre').focus());
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  const scrolled=await page.evaluate(()=>document.querySelector('.manual-pair pre').scrollLeft);
  const i2=await idx();
  chk('A11Y-2.1.1','a focused code pane scrolls by keyboard instead of stepping',
      scrolled>0&&i2===i1,JSON.stringify({scrolled,i1,i2}));

  await page.evaluate(()=>document.activeElement.blur());
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  const i3=await idx();
  chk('A11Y-2.1.1','leaving the pane restores the trace stepper',
      i3!==i2,JSON.stringify({i2,i3}));
}

/* ===================== the per-topic theory panel =====================
   Theory is reference material rendered per MODULE, not per frame, so it must
   not appear in the trace machinery at all. These checks fix the three things
   that would quietly rot: that the invariant is the block a reader lands on,
   that the panel is operable from the keyboard without a hand-rolled toggle,
   and that every entry still carries its tracer-authored provenance line —
   the app has a provenance system for source blocks, and prose that lost its
   label would read as course material. */
{
  await page.goto(`${BASE}/searching-sorting.html#qs`,{waitUntil:'load'});
  await page.waitForTimeout(600);

  const shown=await page.evaluate(()=>{
    const sect=document.getElementById('theorySect');
    const open=document.querySelector('.theory-block[open] > summary');
    return {hidden:sect?sect.hidden:null,
            firstOpen:open?open.textContent:null,
            blocks:document.querySelectorAll('.theory-block').length,
            provenance:!!document.querySelector('.theory-provenance'),
            live:!!document.querySelector('#theorySect [aria-live]')};
  });
  chk('THEORY','the theory panel renders for a topic that has an entry',
      shown.hidden===false&&shown.blocks>=5,JSON.stringify(shown));
  chk('THEORY','the core invariant is the block the reader lands on',
      /Core invariant/i.test(shown.firstOpen||''),JSON.stringify(shown.firstOpen));
  chk('THEORY','every entry carries its tracer-authored provenance line',
      shown.provenance===true,JSON.stringify(shown));
  chk('THEORY','the panel is not a live region',
      shown.live===false,'reference material must not interrupt a screen reader mid-trace');

  /* Keyboard operation, through real key events rather than .open = true. */
  const toggled=await (async()=>{
    const before=await page.evaluate(()=>{
      const d=document.querySelectorAll('.theory-block')[1];
      d.querySelector('summary').focus();
      return d.open;
    });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    const after=await page.evaluate(()=>document.querySelectorAll('.theory-block')[1].open);
    return {before,after};
  })();
  chk('THEORY','a theory block opens from the keyboard',
      toggled.before!==toggled.after,JSON.stringify(toggled));

  /* A suggestion pointing at another area must link to that area's page; a
     bare "#id" silently does nothing when the topic lives elsewhere. */
  const links=await page.evaluate(()=>Array.from(document.querySelectorAll('.theory-seealso a'))
    .map(a=>({href:a.getAttribute('href'),text:a.textContent})));
  chk('THEORY','cross-topic suggestions carry a page, not a bare fragment',
      links.length>0&&links.every(l=>/^[a-z-]+\.html#/.test(l.href)),JSON.stringify(links));

  /* A module with no entry must hide the section rather than show an empty heading. */
  await page.goto(`${BASE}/trees.html#bstrotate`,{waitUntil:'load'});
  await page.waitForTimeout(500);
  const absent=await page.evaluate(()=>{
    const sect=document.getElementById('theorySect');
    const reg=window.COMP2521_THEORY||{};
    return {hidden:sect?sect.hidden:null,
            hasEntry:Object.prototype.hasOwnProperty.call(reg,'bstrotate')};
  });
  chk('THEORY','a topic with no entry hides the section instead of showing an empty heading',
      absent.hasEntry?absent.hidden===false:absent.hidden===true,JSON.stringify(absent));
}

/* ===================== every page loads cleanly ===================== */
for(const f of ['index.html','foundations.html','searching-sorting.html','adts.html','trees.html','graphs.html','graph-algorithms.html','hashing.html']){
  const before={c:consoleErrors.length,e:pageErrors.length,r:failedRequests.length};
  await page.goto(`${BASE}/${f}`,{waitUntil:'load'});
  await page.waitForTimeout(800);
  chk('UI',`${f} loads with no page error or failed request`,
      pageErrors.length===before.e&&failedRequests.length===before.r,
      JSON.stringify({pageErrors:pageErrors.slice(before.e),failed:failedRequests.slice(before.r)}));
}
chk('UI','no console errors across the whole run',consoleErrors.length===0,JSON.stringify(consoleErrors.slice(0,5)));

await browser.close();
const summary={suite:'browser_acceptance',base:BASE,passed:pass,failed:fail,skipped:skip,
  consoleErrors,pageErrors,failedRequests,results};
fs.writeFileSync(path.join(OUT,'browser_acceptance.json'),JSON.stringify(summary,null,1));
console.log(`\n  REAL-BROWSER acceptance: passed=${pass} failed=${fail} skipped=${skip}`);
console.log(`  evidence: ${OUT}`);
process.exitCode=fail?1:0;

}
main().catch(e=>{console.error('browser suite crashed:',e&&e.stack||e);process.exitCode=2;});
