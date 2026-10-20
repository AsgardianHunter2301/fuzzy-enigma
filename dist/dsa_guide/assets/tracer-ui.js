/* ============================================================
   CLASSROOM-CONTROLS RUNTIME
   - preserves the hardened robustness and source-line controls
   - selected study/filter selectors require an explicit Run trace action
   - dedicated stop control for immediate playback cancellation
   - build metadata kept in Sources and internal manifests
   - rAF playback, reset, persistence and responsive controls
   No course C, pseudocode or algorithm content is changed here.
   ============================================================ */
/* ============================================================
   UI LAYER ORDER
   1. Core player and fields
   2. Layout and topic drawer
   3. Source sheet and multi-page navigation
   4. Study, timeline and view controls
   5. Presentation adapter
   6. Final quality layer

   Wrappers must be installed after the layer they extend. New extension
   layers use installUiLayer(), which records order and rejects duplicate
   installation. Do not insert wrappers by matching an arbitrary function
   name inside another function.
   ============================================================ */
const UI_LAYER_REGISTRY=window.COMP2521UiLayerRegistry=window.COMP2521UiLayerRegistry||[];
function installUiLayer(name,targets,installer){
  if(UI_LAYER_REGISTRY.some(layer=>layer.name===name)){
    console.warn(`[COMP2521 Tracer] UI layer "${name}" was already installed.`);
    return false;
  }
  if(typeof installer!=='function')throw new TypeError(`UI layer "${name}" needs an installer function`);
  installer();
  UI_LAYER_REGISTRY.push(Object.freeze({name,targets:[...(targets||[])],order:UI_LAYER_REGISTRY.length+1}));
  return true;
}
window.COMP2521InstallUiLayer=installUiLayer;

/* ============================================================
   UI / PLAYER
   ============================================================ */
const UI = {
  op:queryOne('#op'),moduleSearch:queryOne('#moduleSearch'),moduleCount:queryOne('#moduleCount'),inputs:queryOne('#inputs'),run:queryOne('#run'),rand:queryOne('#rand'),reset:queryOne('#reset'),undoReset:queryOne('#undoReset'),clearTrace:queryOne('#clearTrace'),status:queryOne('#status'),buildVersion:queryOne('#buildVersion'),moduleStatus:queryOne('#moduleStatus'),
  code:queryOne('#code'),srcName:queryOne('#srcName'),srcTag:queryOne('#srcTag'),vizName:queryOne('#vizName'),viewBadge:queryOne('#viewBadge'),note:queryOne('#note'),viz:queryOne('#viz'),vars:queryOne('#vars'),ledger:queryOne('#ledger'),memorySummary:queryOne('#memorySummary'),tally:queryOne('#tally'),memev:queryOne('#memev'),map:queryOne('#map'),mapSect:queryOne('#mapSect'),
  scrub:queryOne('#scrub'),tick:queryOne('#tick'),play:queryOne('#play'),stopBtn:queryOne('#stopPlayback'),speed:queryOne('#speed'),speedStatus:queryOne('#speedStatus'),textScale:queryOne('#textScale'),helpTour:queryOne('#helpTour'),tourDialog:queryOne('#tourDialog'),tourTitle:queryOne('#tourTitle'),tourBody:queryOne('#tourBody'),tourProgress:queryOne('#tourProgress'),tourBack:queryOne('#tourBack'),tourNext:queryOne('#tourNext'),tourClose:queryOne('#tourClose'),tourDontShow:queryOne('#tourDontShow')
};

const playerState={currentModule:null,frames:[],frameIndex:0,animationHandle:null,sourceLineElements:[],previousVariables:{},playbackTimestamp:0,busy:false,resetBackup:null,legendOpen:true};
let storageWriteTimer=null, storageWarned=false;
const STORAGE_KEY='comp2521-tracer:ui-state:v2';
const requestFrame=typeof window.requestAnimationFrame==='function'?window.requestAnimationFrame.bind(window):(fn=>setTimeout(()=>fn(Date.now()),16));
const cancelFrame=typeof window.cancelAnimationFrame==='function'?window.cancelAnimationFrame.bind(window):clearTimeout;
const ICONS=Object.freeze({
  first:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 6l-8 6 8 6z"/></svg>',
  previous:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 6l-8 6 8 6z"/></svg>',
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>',
  stop:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1"/></svg>',
  next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6l8 6-8 6z"/></svg>',
  last:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l8 6-8 6zM18 5v14"/></svg>'
});
function setButtonIcon(button,name){const slot=button&&button.querySelector('.icon-slot');if(slot)slot.innerHTML=ICONS[name]||'';}
function applyBuildMetadata(){
  document.title=`${TRACER_PAGE.title}  -  COMP2521 Tracer`;
  document.documentElement.dataset.buildVersion=APP_VERSION;
  /* R2 P2: build metadata lives in the Sources sheet, not the header. */
  setButtonIcon(queryOne('#first'),'first');setButtonIcon(queryOne('#prev'),'previous');setButtonIcon(UI.play,'play');setButtonIcon(UI.stopBtn,'stop');setButtonIcon(queryOne('#next'),'next');setButtonIcon(queryOne('#last'),'last');
}
applyBuildMetadata();

function updateModuleStatus(){
  /* Build status and version belong in Sources, not the learning surface. */
  if(!UI.moduleStatus)return;
  UI.moduleStatus.textContent='';
  UI.moduleStatus.hidden=true;
  UI.moduleStatus.removeAttribute('title');
  UI.moduleStatus.removeAttribute('aria-label');
}
function storageWarning(err){
  if(storageWarned)return;
  storageWarned=true;
  console.warn('[COMP2521 Tracer] UI state could not be persisted.',err);
  /* M-05: silent degradation is confusing when pane sizes and the last topic
     stop being remembered. Say so once, in the existing status region. */
  try{
    if(UI&&UI.status)UI.status.textContent=
      'This browser is not storing settings for local files, so pane sizes, text size and the last topic will not be remembered between sessions. The tracer works normally otherwise.';
  }catch(ignored){}
}
function loadUiState(){
  try{const raw=localStorage.getItem(STORAGE_KEY);const data=raw?JSON.parse(raw):{};return data&&typeof data==='object'?data:{};}
  catch(err){storageWarning(err);return {};}
}
const persistedState=loadUiState();  /* L-04: mutated in place, never reassigned */
const VALID_TEXT_SCALES=new Set(['100','112','125','140']);
function writeUiState(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(persistedState));}
  catch(err){storageWarning(err);}
}
function scheduleUiStateWrite(){
  if(storageWriteTimer!==null)clearTimeout(storageWriteTimer);
  storageWriteTimer=setTimeout(()=>{storageWriteTimer=null;persistCurrentUi();},400);
}
function busyControls(){
  return [
    ...UI.inputs.querySelectorAll('[data-k]'),UI.rand,UI.reset,UI.undoReset,UI.clearTrace,UI.op,UI.scrub,UI.play,UI.stopBtn,UI.speed,
    queryOne('#first'),queryOne('#prev'),queryOne('#next'),queryOne('#last')
  ].filter(Boolean);
}
function setBusy(on){
  playerState.busy=!!on;
  UI.run.disabled=!!on;UI.run.classList.toggle('busy',!!on);UI.run.setAttribute('aria-busy',String(!!on));
  busyControls().forEach(control=>{
    if(on){
      if(!Object.prototype.hasOwnProperty.call(control.dataset,'preBusyDisabled'))control.dataset.preBusyDisabled=control.disabled?'1':'0';
      control.disabled=true;
    }else if(Object.prototype.hasOwnProperty.call(control.dataset,'preBusyDisabled')){
      control.disabled=control.dataset.preBusyDisabled==='1';
      delete control.dataset.preBusyDisabled;
    }
  });
  document.documentElement.classList.toggle('trace-busy',!!on);
  if(on)UI.status.textContent='Generating trace; inputs and playback controls are temporarily locked';
}
function clearBusyAfterPaint(){
  requestFrame(()=>requestFrame(()=>{
    setBusy(false);paint();
    const invalid=UI.inputs.querySelector('[aria-invalid="true"]');
    if(invalid)invalid.focus({preventScroll:true});
    UI.status.textContent=playerState.frames.length?`${playerState.frames.length} trace steps ready`:'No trace steps';
  }));
}


/* ---------- managed dialogs: exclusive, focus-safe, native + fallback ---------- */
function dialogIsOpen(dialog){return !!dialog&&(dialog.open||dialog.hasAttribute('open'));}
function openDialogOtherThan(dialog){return [...document.querySelectorAll('dialog')].find(candidate=>candidate!==dialog&&dialogIsOpen(candidate))||null;}
function dialogLabel(dialog){const labelledBy=dialog?.getAttribute('aria-labelledby');const labelled=labelledBy&&document.getElementById(labelledBy);return labelled?.textContent?.trim()||dialog?.querySelector('h1,h2,h3')?.textContent?.trim()||dialog?.getAttribute('aria-label')||'another dialog';}
function dialogFocusable(dialog){
  return [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(element=>!element.hidden&&element.getAttribute('aria-hidden')!=='true'&&element.getClientRects().length>0);
}
function showManagedDialog(dialog,{trigger=null,initialFocus=null,onRequestClose=null}={}){
  if(!dialog)return false;
  const other=openDialogOtherThan(dialog);
  if(other){UI.status.textContent=`Close ${dialogLabel(other)} before opening ${dialogLabel(dialog)}`;return false;}
  dialog._returnFocus=trigger||document.activeElement;
  dialog._requestClose=onRequestClose;
  if(typeof dialog.showModal==='function'){
    if(!dialog.open)dialog.showModal();
  }else{
    dialog.classList.add('dialog-fallback');dialog.setAttribute('open','');dialog.setAttribute('aria-modal','true');
    const backdrop=createElement('div','dialog-fallback-backdrop');
    backdrop.addEventListener('click',()=>{if(typeof dialog._requestClose==='function')dialog._requestClose();});
    dialog._fallbackInert=[];
    for(let branch=dialog;branch&&branch.parentElement;branch=branch.parentElement){
      [...branch.parentElement.children].filter(element=>element!==branch&&element!==backdrop).forEach(element=>{
        if(dialog._fallbackInert.some(entry=>entry.element===element))return;
        dialog._fallbackInert.push({element,wasInert:!!element.inert});element.inert=true;
      });
    }
    dialog._fallbackBackdrop=backdrop;document.body.appendChild(backdrop);document.body.classList.add('dialog-fallback-open');
  }
  requestFrame(()=>{
    const target=initialFocus||dialogFocusable(dialog)[0]||dialog;
    if(target===dialog&&!dialog.hasAttribute('tabindex'))dialog.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
    if(initialFocus&&typeof initialFocus.select==='function')initialFocus.select();
  });
  return true;
}
function closeManagedDialog(dialog,{fallbackFocus=null,restoreFocus=true}={}){
  if(!dialog)return;
  if(typeof dialog.close==='function'&&dialog.open)dialog.close();
  else dialog.removeAttribute('open');
  dialog.classList.remove('dialog-fallback');dialog.removeAttribute('aria-modal');
  if(dialog._fallbackBackdrop){dialog._fallbackBackdrop.remove();dialog._fallbackBackdrop=null;}
  if(Array.isArray(dialog._fallbackInert)){dialog._fallbackInert.forEach(entry=>{entry.element.inert=entry.wasInert;});dialog._fallbackInert=null;}
  if(!document.querySelector('dialog.dialog-fallback[open]'))document.body.classList.remove('dialog-fallback-open');
  const returnFocus=dialog._returnFocus||fallbackFocus;dialog._returnFocus=null;dialog._requestClose=null;
  if(restoreFocus&&returnFocus&&typeof returnFocus.focus==='function')returnFocus.focus({preventScroll:true});
}
function handleManagedDialogKeydown(event,dialog,closeRequest){
  if(event.key==='Escape'){
    event.preventDefault();event.stopPropagation();closeRequest();return true;
  }
  if(event.key!=='Tab'||!dialog.classList.contains('dialog-fallback'))return false;
  const focusable=dialogFocusable(dialog);
  if(!focusable.length){event.preventDefault();dialog.focus();return true;}
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();return true;}
  if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();return true;}
  return false;
}

/* build and filter the operation menu, grouped */
const GROUP_ORDER = ['Course map','Recursion','Analysis','Searching','Sorting','Abstract data types','Binary search trees','Balanced BSTs','AVL trees','Graph representations','Graph traversal','Graph problems','Directed graphs','Shortest paths & MSTs','Hash tables','Hash applications','Priority queues & heaps','Tries','Graphs'];
const MODULE_ORDER = ['coursemap','recpyramid','recfactorial','reclistsum','reclistappend','analysis','lin','bin','sortprops','sel','bub','ins','ms','bottomup','qs','q3','quickvariants','radix','listsorts','adtarch','stack','queue','setadt','bstins','bstsearch','bsttrav','bstdel','bstfree','bstrotate','bstpartition','bstrebalance','bstlocal','avlheight','avlins','avldel','graphfund','graphreps','graphadt','graphlist','graphedges','graphweighted','bfs','bfspath','dfs','dfspath','dfsiter','cycleu','components','hamilton','euler','cycled','webcrawl','warshall','dijkstra','kruskal','prim','hash','hashprobe','hashsetcounter','twosum','oddocc','anagram','pqcompare','pq','heapify','heapsort','trie','namedalgos'];
MODULES.sort((a,b)=>{
  const ga=GROUP_ORDER.indexOf(a.group), gb=GROUP_ORDER.indexOf(b.group);
  if(ga!==gb) return (ga<0?999:ga)-(gb<0?999:gb);
  const ia=MODULE_ORDER.indexOf(a.id), ib=MODULE_ORDER.indexOf(b.id);
  return (ia<0?999:ia)-(ib<0?999:ib) || a.name.localeCompare(b.name);
});
/* ---------- multi-page scoping ---------- */
if(Array.isArray(TRACER_PAGE.groups)){
  const owned=new Set(TRACER_PAGE.groups);
  const kept=MODULES.filter(module=>owned.has(module.group));
  if(kept.length){MODULES.length=0;kept.forEach(module=>MODULES.push(module));}
  else console.warn('[COMP2521 Tracer] No modules matched this page\'s groups.',TRACER_PAGE.groups);
}
function moduleHaystack(module){
  /* R2 P2: search reads the curated vocabulary in topics.js. module.keywords
     stays as provenance metadata and is compared by source_parity, so it is
     not edited; it is only no longer the search surface. */
  const index=(window.TRACER_TOPICS||[]).find(topic=>topic.i===module.id);
  const searchTerms=index&&index.s?index.s:(module.keywords||'');
  return `${module.group} ${module.name} ${module.id} ${searchTerms} ${(module.blocks||[]).map(block=>block.title).join(' ')}`.toLowerCase();
}
function buildMenu(filter=''){
  const keep=playerState.currentModule&&playerState.currentModule.id;
  UI.op.innerHTML='';
  const query=filter.trim().toLowerCase();
  const shown=MODULES.filter(module=>!query||moduleHaystack(module).includes(query));
  const groups=[];
  shown.forEach(module=>{let group=groups.find(candidate=>candidate.name===module.group);if(!group){group={name:module.group,items:[]};groups.push(group);}group.items.push(module);});
  groups.forEach(group=>{const optionGroup=document.createElement('optgroup');optionGroup.label=group.name;group.items.forEach(module=>{const option=document.createElement('option');option.value=module.id;option.textContent=module.name;optionGroup.appendChild(option);});UI.op.appendChild(optionGroup);});
  UI.moduleCount.textContent=`${shown.length}/${MODULES.length} topics`;
  UI.op.disabled=shown.length===0;
  if(keep&&shown.some(module=>module.id===keep))UI.op.value=keep;
  else if(shown.length)UI.op.value=shown[0].id;
  return shown;
}
buildMenu();
if([...UI.speed.options].some(o=>o.value===String(persistedState.speed||''))) UI.speed.value=String(persistedState.speed);
let moduleSearchTimer=null,filterShowingNoResults=false;
function showNoModuleMatches(query){
  filterShowingNoResults=true;stop();playerState.frames=[];playerState.frameIndex=0;playerState.sourceLineElements=[];UI.inputs.innerHTML='';UI.code.innerHTML='';UI.srcName.textContent='No matching topic';UI.srcTag.innerHTML='';UI.vizName.textContent='';UI.viz.innerHTML='';clearFrameState();paint();UI.note.textContent=`No topics match "${query}". Clear or revise the filter.`;UI.status.textContent='No course topics match the filter';
}
function applyModuleFilter(){
  const shown=buildMenu(UI.moduleSearch.value);
  if(!shown.length){showNoModuleMatches(UI.moduleSearch.value.trim());return;}
  if(filterShowingNoResults){filterShowingNoResults=false;const resume=playerState.currentModule&&shown.some(module=>module.id===playerState.currentModule.id)?playerState.currentModule.id:UI.op.value;selectModule(resume,{persistPrevious:true,restore:true});go();return;}
  if(!playerState.currentModule||!shown.some(module=>module.id===playerState.currentModule.id)){
    selectModule(UI.op.value,{persistPrevious:true,restore:true});go();
  }
}
UI.moduleSearch.addEventListener('input',()=>{if(moduleSearchTimer!==null)clearTimeout(moduleSearchTimer);moduleSearchTimer=setTimeout(()=>{moduleSearchTimer=null;applyModuleFilter();},100);});

const FIELD_HELP=Object.freeze({
  nV:'Number of vertices. Vertices are numbered from 0 to nV - 1.',
  a:'Space- or comma-separated input values.',seq:'Space- or comma-separated values used to construct the data structure.',
  g:'Graph edges or arcs in the format shown by the topic.',ops:'Operations to execute in order.',
  val:'Value to search for, insert or delete.',src:'Source or starting vertex.',dest:'Destination vertex.',
  rep:'Graph representation used for the visual trace.',directed:'Choose whether edges have direction.',weighted:'Choose whether edges carry weights.',
  order:'Traversal order.',i:'Zero-based index.',S:'Target sum.',max:'Maximum number of pages or items to process.'
});
function fieldHelp(module,field){return field.help||FIELD_HELP[field.k]||`${field.label}: input for ${module.name}.`;}
function fieldsFor(m,opt={}){
  UI.inputs.innerHTML='';
  const restore=opt.restore!==false;
  const saved=restore&&persistedState.inputs&&persistedState.inputs[m.id]&&typeof persistedState.inputs[m.id]==='object'?persistedState.inputs[m.id]:{};
  (m.fields||[]).forEach(f=>{
    const d=createElement('div','field');
    const label=createElement('label',null,f.label);d.appendChild(label);
    let i;
    const chosen=Object.prototype.hasOwnProperty.call(saved,f.k)?saved[f.k]:f.def;
    if(f.type==='select'){
      i=createElement('select');
      (f.options||[]).forEach(opt=>{
        const o=createElement('option');
        if(typeof opt==='string'){o.value=opt;o.textContent=opt;}
        else{o.value=opt.value;o.textContent=opt.label;}
        i.appendChild(o);
      });
      const values=[...i.options].map(o=>String(o.value));
      i.value=values.includes(String(chosen))?String(chosen):String(f.def);
    }else{
      i=createElement('input'); i.type=f.type||'text';
      i.value=chosen==null?'':chosen; i.size=f.w||Math.min(34,Math.max(8,String(f.def).length+2));
      if(f.min!==undefined)i.min=f.min;if(f.max!==undefined)i.max=f.max;if(f.step!==undefined)i.step=f.step;
    }
    const help=fieldHelp(m,f),helpId=`field-help-${m.id}-${f.k}`;
    i.dataset.k=f.k;i.id=`field-${m.id}-${f.k}`;i.setAttribute('aria-label',f.label);i.title=help;i.dataset.baseDescribedby=helpId;i.setAttribute('aria-describedby',helpId);label.id=`label-${m.id}-${f.k}`;label.setAttribute('for',i.id);label.title=help;
    const helpNode=createElement('span','sr-only field-help',help);helpNode.id=helpId;
    d.dataset.fieldKey=f.k;d.appendChild(i);d.appendChild(helpNode);UI.inputs.appendChild(d);
  });
}

const SOURCE_LABEL={manual:'26T2 manual',lecture:'25T3 lecture',memorise:'supplemental C - not manual or lecture source',coverage:'coverage index'};

function renderCode(m){
  UI.code.innerHTML=''; playerState.sourceLineElements=[];
  m.blocks.forEach((b,bi)=>{
    const h=createElement('div','blockhdr'); h.textContent=b.title; const sk=b.source||'manual'; const sb=createElement('span','tag sourcebadge '+sk,SOURCE_LABEL[sk]||sk); h.appendChild(sb); if(b.pages){const pg=createElement('span','pg',b.pages); h.appendChild(pg);}
    UI.code.appendChild(h);
    /* CUR-MOD-02: the previous notice read "MEMORISE FIRST - PREREQUISITE C -
       NOT SOURCE ... It must be learnt and memorised separately before use."
       The source-status half of that is accurate and is kept. The
       memorisation requirement is not: no authoritative course source
       establishes that a student must memorise every supplemental
       implementation before viewing an algorithm trace, and the graph study
       matrix alone carries 17 source blocks and 2,168 displayed lines. The
       notice now states the provenance honestly and says what the learner
       actually needs, without inventing a prerequisite. */
    if(sk==='memorise'){const warn=createElement('div','memnotice');warn.innerHTML='<b>Supplemental implementation - not course source.</b> This complete implementation is not printed in the attached 26T2 manual, and the attached 25T3 lectures do not supply it as complete C. Use it to see one concrete way the operations this topic needs can be implemented, and to compare representations. You do not need to memorise it to follow the trace above.';UI.code.appendChild(warn);}
    const wrap=createElement('div',b.pseudo?'pseudo':'');
    const sourceHighlighter=createCHighlighter();
    playerState.sourceLineElements[bi]=[];
    b.src.split('\n').forEach((ln,i)=>{
      const row=createElement('div','cline');
      row.appendChild(createElement('span','n',String(i+1)));
      const tsp=createElement('span','t'); tsp.innerHTML=sourceHighlighter.highlightLine(ln)||'&nbsp;';
      row.appendChild(tsp);
      wrap.appendChild(row); playerState.sourceLineElements[bi][i+1]=row;
    });
    UI.code.appendChild(wrap);
  });
}

function selectModule(id,opt={}){
  if(playerState.currentModule&&opt.persistPrevious!==false)persistCurrentUi();
  if(!playerState.currentModule||playerState.currentModule.id!==id){playerState.resetBackup=null;if(UI.undoReset){UI.undoReset.hidden=true;UI.undoReset.disabled=true;}}
  playerState.currentModule=MODULES.find(m=>m.id===id)||MODULES[0];
  UI.op.value=playerState.currentModule.id;
  updateModuleStatus();
  UI.srcName.textContent=playerState.currentModule.name;
  const sourceKinds=[...new Set(playerState.currentModule.blocks.map(b=>b.source||'manual'))];
  const hasPseudo=playerState.currentModule.blocks.some(b=>b.pseudo);
  UI.srcTag.innerHTML=sourceKinds.map(k=>`<span class="tag ${k}">${SOURCE_LABEL[k]||k}</span>`).join(' ') + (hasPseudo?' <span class="tag reference">pseudocode / concept</span>':'');
  UI.vizName.textContent='';
  fieldsFor(playerState.currentModule,{restore:opt.restore!==false});
  renderCode(playerState.currentModule);
  playerState.frames=[]; playerState.frameIndex=0; playerState.previousVariables={};paint();
  persistCurrentUi();
}

function readInputs(){
  const o={};
  UI.inputs.querySelectorAll('[data-k]').forEach(i=>o[i.dataset.k]=i.value);
  return o;
}
function persistCurrentUi(){
  if(!playerState.currentModule)return;
  persistedState.module=playerState.currentModule.id;
  if(!persistedState.pageModule||typeof persistedState.pageModule!=='object')persistedState.pageModule={};
  persistedState.pageModule[TRACER_PAGE.id]=playerState.currentModule.id;
  persistedState.speed=UI.speed.value;
  persistedState.textScale=UI.textScale.value;
  if(!persistedState.inputs||typeof persistedState.inputs!=='object')persistedState.inputs={};
  persistedState.inputs[playerState.currentModule.id]=readInputs();
  writeUiState();
}
function setInputValues(values){
  UI.inputs.querySelectorAll('[data-k]').forEach(control=>{if(Object.prototype.hasOwnProperty.call(values,control.dataset.k))control.value=values[control.dataset.k];});
}
function clearTraceState(message='Trace cleared; inputs retained'){
  stop();clearInputErrors();playerState.frames=[];playerState.frameIndex=0;playerState.previousVariables={};UI.vizName.textContent='';paint();UI.status.textContent=message;
}
function resetCurrent(){
  stop();
  if(!playerState.currentModule)return;
  playerState.resetBackup={moduleId:playerState.currentModule.id,inputs:readInputs(),frameIndex:playerState.frameIndex};
  if(persistedState.inputs)delete persistedState.inputs[playerState.currentModule.id];
  clearInputErrors();fieldsFor(playerState.currentModule,{restore:false});
  playerState.frames=[];playerState.frameIndex=0;playerState.previousVariables={};UI.vizName.textContent='';
  persistCurrentUi();paint();
  UI.undoReset.hidden=false;UI.undoReset.disabled=false;
  UI.status.textContent=`${playerState.currentModule.name} reset to default inputs. Undo is available.`;
}
function undoReset(){
  const backup=playerState.resetBackup;
  if(!backup||!playerState.currentModule||backup.moduleId!==playerState.currentModule.id){UI.status.textContent='There is no reset to undo for this topic';return;}
  fieldsFor(playerState.currentModule,{restore:false});setInputValues(backup.inputs);persistCurrentUi();go();
  playerState.frameIndex=Math.min(backup.frameIndex,Math.max(0,playerState.frames.length-1));paint();
  playerState.resetBackup=null;UI.undoReset.hidden=true;UI.undoReset.disabled=true;
  UI.status.textContent=`Restored the inputs used before reset for ${playerState.currentModule.name}`;
}
function clearInputErrors(){UI.inputs.querySelectorAll('.field.invalid').forEach(field=>{field.classList.remove('invalid');const control=field.querySelector('[data-k]');if(control){control.removeAttribute('aria-invalid');const base=control.dataset.baseDescribedby;if(base)control.setAttribute('aria-describedby',base);else control.removeAttribute('aria-describedby');}field.querySelector('.field-error')?.remove();});}
function inferInvalidFieldKey(error){
  if(error&&error.fieldKey&&playerState.currentModule.fields?.some(field=>field.k===error.fieldKey))return error.fieldKey;
  const message=String(error&&error.message||error||'').toLowerCase();
  const fields=playerState.currentModule&&playerState.currentModule.fields||[];
  const aliases={nv:['nv','vertices','vertex'],g:['edge','edges','arc','arcs','graph','hyperlink'],ops:['operation','operations'],seq:['tree','sequence','values'],a:['items','array','list','keys'],val:['value','search','delete'],src:['src','source'],dest:['dest','destination'],start:['start page'],max:['maximum','max pages'],i:['index'],value:['append'],s:['first string'],t:['second string'],S:['target','sum']};
  for(const field of fields){const probes=[field.k.toLowerCase(),field.label.toLowerCase(),...(aliases[field.k]||[])];if(probes.some(probe=>probe&&message.includes(probe)))return field.k;}
  const editable=fields.filter(field=>field.type!=='select');return editable.length===1?editable[0].k:null;
}
function markInputError(error){
  const fieldKey=inferInvalidFieldKey(error);if(!fieldKey)return;
  const control=UI.inputs.querySelector(`[data-k="${CSS.escape(fieldKey)}"]`);const field=control&&control.closest('.field');if(!field)return;
  field.classList.add('invalid');control.setAttribute('aria-invalid','true');const errorNode=createElement('div','field-error',String(error&&error.message||error));const errorId=`field-error-${playerState.currentModule.id}-${fieldKey}`;errorNode.id=errorId;field.appendChild(errorNode);const base=control.dataset.baseDescribedby;control.setAttribute('aria-describedby',[base,errorId].filter(Boolean).join(' '));control.focus({preventScroll:true});
}
/**
 * Extract simple identifier declarations from displayed C blocks. This is a
 * conservative study aid: types are never guessed from values or names.
 */
function displayedCDeclarations(module){
  const declarations={};
  const typePattern='(?:struct\\s+[A-Za-z_]\\w*|enum\\s+[A-Za-z_]\\w*|unsigned\\s+(?:long\\s+|short\\s+)?int|signed\\s+(?:long\\s+|short\\s+)?int|long\\s+(?:long\\s+)?int|short\\s+int|[A-Za-z_]\\w*)';
  const declare=(type,name,pointer='',array='')=>{
    if(!/^[A-Za-z_]\w*$/.test(name))return;
    const cleaned=`${type.trim()}${pointer?` ${pointer.replace(/\s+/g,'')}`:''}${array?'[]':''}`.replace(/\s+/g,' ').trim();
    if(!declarations[name])declarations[name]=cleaned;
  };
  (module.blocks||[]).filter(block=>!block.pseudo&&typeof block.src==='string').forEach(block=>{
    const code=block.src.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\/\/.*$/gm,' ');
    const functionPattern=new RegExp(`(?:^|\\n)\\s*(${typePattern})(\\s*\\*+)?\\s+[A-Za-z_]\\w*\\s*\\(([^)]*)\\)`,`g`);
    for(const match of code.matchAll(functionPattern)){
      match[3].split(',').map(part=>part.trim()).filter(part=>part&&part!=='void').forEach(parameter=>{
        const pm=parameter.match(new RegExp(`^(?:const\\s+)?(${typePattern})(\\s*\\*+)?\\s*([A-Za-z_]\\w*)\\s*(\\[[^\\]]*\\])?$`));
        if(pm)declare(pm[1],pm[3],pm[2]||'',pm[4]||'');
      });
    }
    const statementPattern=new RegExp(`(?:^|[;{}]\\s*|\\n\\s*)(?:static\\s+)?(?:const\\s+)?(${typePattern})(\\s*\\*+)?\\s+([^;{}()]+);`,'g');
    for(const match of code.matchAll(statementPattern)){
      const type=match[1],commonPointer=match[2]||'';
      match[3].split(',').forEach(part=>{
        const declarator=part.split('=')[0].trim();
        const dm=declarator.match(/^(\*+\s*)?([A-Za-z_]\w*)\s*(\[[^\]]*\])?$/);
        if(dm)declare(type,dm[2],`${commonPointer}${dm[1]||''}`,dm[3]||'');
      });
    }
  });
  return declarations;
}
function attachDisplayedTypes(module,frames){
  const declarations=displayedCDeclarations(module);
  if(!Object.keys(declarations).length)return frames;
  return frames.map(frame=>{
    if(!frame||!frame.vars||typeof frame.vars!=='object')return frame;
    const types={};
    Object.keys(frame.vars).forEach(key=>{if(/^[A-Za-z_]\w*$/.test(key)&&declarations[key])types[key]=declarations[key];});
    return Object.keys(types).length?{...frame,types}:frame;
  });
}

function go(){
  if(!playerState.currentModule||playerState.busy)return;
  stop();clearInputErrors();setBusy(true);persistCurrentUi();
  let succeeded=false;
  try{
    const trace=playerState.currentModule.run(readInputs());
    if(!trace||!Array.isArray(trace.f))throw new Error('trace generator did not return a frame array');
    playerState.frames=attachDisplayedTypes(playerState.currentModule,trace.f);succeeded=true;
  }catch(error){
    markInputError(error);
    playerState.frames=[{line:[0,0],note:'That input could not be traced: '+escapeHtml(String(error&&error.message||error))+'. Correct the highlighted field and run the trace again.',view:null,vars:{},heap:[],ev:null,fresh:[]}];
    console.warn('[COMP2521 Tracer] Trace input was rejected.',String(error&&error.message||error));
  }
  if(succeeded)clearInputErrors();
  playerState.frameIndex=0;UI.scrub.max=Math.max(0,playerState.frames.length-1);UI.scrub.value=0;UI.vizName.textContent=playerState.frames.length+' steps';playerState.previousVariables={};paint();clearBusyAfterPaint();
}

/**
 * Map the active pseudocode/concept line to exact manual C, declared lecture
 * content, or an explicitly-labelled MEMORISE bridge. The decision tree keeps
 * provenance visible and never upgrades supplemental code to source status.
 */
/* Titles denoting a concept, definition or problem statement rather than
   executable pseudocode. Matched on title only; no module data changes. */
const CONCEPT_BLOCK_TITLE=/(concept|problem statement|problem|terminology|fundamentals|properties|architecture|mapping|overview)/i;
function isConceptBlock(block){
  return !!block && block.pseudo===true && CONCEPT_BLOCK_TITLE.test(block.title||'');
}
function mappingForFrame(m,f){
  if(!m||!f||!Array.isArray(f.line)) return null;
  const bi=f.line[0], ln=f.line[1], block=m.blocks&&m.blocks[bi];
  if(!block||!block.pseudo) return null;
  const ps=(block.src.split('\n')[ln-1]||'').trim();
  if(!ps) return null;
  const lower=ps.toLowerCase();
  const mem=(c,why)=>({ps,c,why,level:'memorise',provenance:'SUPPLEMENTAL C - complete implementation - not in the attached manual or lecture'});
  const manual=(c,why)=>({ps,c,why,level:'manual',provenance:'26T2 MANUAL - exact source C'});
  const mixed=(c,why)=>({ps,c,why,level:'mixed',provenance:'MIXED PROVENANCE - exact manual + exact lecture + supplemental C'});
  function findView(v,pred){if(!v)return null;if(pred(v))return v;if(v.kind==='multi')for(const x of (v.views||[])){const hit=findView(x,pred);if(hit)return hit;}return null;}
  const adjView=findView(f.view,v=>v.kind==='adjlist'),edgeView=findView(f.view,v=>v.kind==='edgearray'),gView=findView(f.view,v=>v.kind==='graph');
  const frameRep=adjView?'adjacency list':edgeView?'array of edges':null;
  const inputs=readInputs();
  const rep=frameRep||inputs.rep||'adjacency matrix';
  const directed=((adjView||edgeView||gView)?.directed ?? (inputs.directed==='directed')) || ['cycled','warshall'].includes(m.id);
  const weighted=((adjView||edgeView)?.weighted ?? !!(gView&&gView.w)) || inputs.weighted==='weighted' || ['dijkstra','kruskal','prim'].includes(m.id);
  const selected=graphVariant(rep,!!directed,!!weighted);

  if(m.id==='graphreps' && bi===0){
    if(lower.startsWith('three main graph representations')){const study=inputs.study||'overview';if(study.startsWith('adjacency matrix'))return manual(SRC_GADJ,'The manual supplies the complete undirected/unweighted adjacency-matrix Graph ADT verbatim.');if(study.startsWith('adjacency list'))return mem(SRC_GADJLIST_MEM,'The lecture supplies the adjacency-list structs but not complete operations. This full compiler-tested implementation is supplemental C, supplied here for reference and comparison.');if(study.startsWith('array of edges'))return mem(SRC_GEDGEARRAY_MEM,'The lecture supplies the edge-array structs but not complete operations or growth policy. This full compiler-tested implementation is supplemental C; capacity 8 and doubling are declared supplemental choices.');return mixed(`/* COMPLETE IMPLEMENTATION INDEX */\nAdjacency matrix  -> exact 26T2 manual C\nAdjacency list    -> complete supplemental C\nArray of edges    -> complete supplemental C\n\nUse the "map first line to" selector to open any complete implementation here.`, 'The lecture defines the three representations. One implementation is exact manual C; the other two are clearly separated supplemental implementations.');}
    if(lower.startsWith('adjacency matrix')) return manual(SRC_GADJ,'This is the complete manual adjacency-matrix Graph ADT, including allocation, release, queries, insertion, removal and display.');
    if(lower.startsWith('adjacency list') || lower.includes('array of v lists')) return mem(SRC_GADJLIST_MEM,'The lecture supplies the exact structs and complexity, but no operation bodies. This full compiler-tested Graph ADT is supplied here as supplemental C.');
    if(lower.startsWith('array of edges') || lower.includes('(v, w) pairs')) return mem(SRC_GEDGEARRAY_MEM,'The lecture supplies the exact structs and complexity, but no operation bodies or growth rule. This full compiler-tested Graph ADT is prior-knowledge material; capacity 8 and doubling are visibly declared supplemental choices.');
  }

  if(m.id==='graphweighted' && [0,1,2].includes(bi)){
    const why=selected.source==='manual'?'The selected mode is the manual\'s complete undirected/unweighted adjacency-matrix Graph ADT.':'The attached sources define the representation or delta but do not supply a complete operation implementation for this selected mode. The orange implementation must therefore be learnt and memorised as prior knowledge.';
    return selected.source==='manual'?manual(selected.src,why):mem(selected.src,why);
  }

  if(m.id==='webcrawl' && lower.includes('for each hyperlink')){
    return {ps,c:null,why:'The lecture states this as web-crawling pseudocode and does not define a C webpage/link representation. Follow the visited-set and queue logic from the pseudocode; no graph-ADT C is falsely substituted.',level:'memorise',provenance:'PSEUDOCODE ONLY - no source C representation',gap:'This line is pseudocode: no webpage/link C representation is supplied.'};
  }

  const graphLoop=(lower.includes('for each neighbour')||lower.includes('for each edge'));
  if(graphLoop){
    if(rep==='adjacency list'){
      return mem(weighted?MEM_ADJLIST_WEIGHTED_NEIGHBOUR_LOOP:MEM_ADJLIST_NEIGHBOUR_LOOP,weighted?'Abstract weighted-edge enumeration follows the source vertex list and reads neighbour plus weight from each node.':'Abstract neighbour enumeration follows the source vertex list from its head through every <code>->next</code> pointer. Directedness changes what is stored, not this outgoing-list traversal.');
    }
    if(rep==='array of edges'){
      const c=weighted?(directed?MEM_EDGEARRAY_WEIGHTED_NEIGHBOUR_LOOP:MEM_EDGEARRAY_WEIGHTED_UNDIRECTED_NEIGHBOUR_LOOP):(directed?MEM_EDGEARRAY_DIRECTED_NEIGHBOUR_LOOP:MEM_EDGEARRAY_NEIGHBOUR_LOOP);
      const why=directed?'A directed edge-array traversal processes only records whose source endpoint equals v.':'An undirected edge-array traversal checks both endpoints because a logical edge record may store v at either end.';
      return mem(c,why+(weighted?' The weight is read from the same record.':''));
    }
    if(weighted){
      return mem(MEM_MATRIX_WEIGHTED_NEIGHBOUR_LOOP,'A weighted adjacency-matrix traversal scans row v and processes cells that are not the declared NO_EDGE sentinel.');
    }
    if(directed){
      return mem(MEM_MATRIX_DIRECTED_NEIGHBOUR_LOOP,'Directed adjacency-matrix traversal scans only row v, so it follows outgoing arcs and does not invent reverse adjacency. This loop is prerequisite C, not a manual quotation.');
    }
    return manual('for (int j = 0; j < g->nV; j++) {\n    if (g->edges[i][j]) {\n        printf(" %d", j);\n    }\n}','This exact C fragment is from the manual GraphShow implementation. It maps abstract neighbour enumeration to a row scan of the V x V adjacency matrix. It evidences the scan; the manual still gives BFS/DFS as pseudocode.');
  }

  /* P1-01: concept and problem-statement blocks are not pseudocode. Routing
     them through the pseudocode fallback told students to memorise C for a
     line that only defines terminology. Classified by block title so the
     module inventory, and therefore source parity, is untouched. */
  if(isConceptBlock(block)){
    return {ps,c:null,level:'concept',
      provenance:`${block.source==='lecture'?'LECTURE':'MANUAL'} CONCEPT - definition or problem statement - no C is defined for this line`,
      gap:'This line states a concept, definition or problem statement. No C implementation corresponds to it, and no C implementation corresponds to it.',
      why:'Concept and problem-statement lines describe what a structure or task is. The implementation appears in the separate source blocks for this topic.'};
  }
  return {ps,c:null,why:`The attached ${block.source==='lecture'?'lecture':'manual'} supplies this line as pseudocode or a concept, but not as exact C. Treat the line as a concept rather than as C; do not mislabel generated code as source.`,level:'memorise',provenance:'MEMORISE PSEUDOCODE - source gives no exact C',gap:'MEMORISE THIS SOURCE-SUPPLIED PSEUDOCODE / CONCEPT  -  no exact source C is supplied for this separate algorithmic line.'};
}

function clearFrameState(){
  UI.vars.innerHTML='<span class="empty"> - </span>';
  UI.ledger.innerHTML='<span class="empty">nothing allocated</span>';
  if(UI.memorySummary)UI.memorySummary.textContent='No dynamic allocation state for this frame.';
  if(UI.viewBadge){UI.viewBadge.textContent='no view';UI.viewBadge.dataset.kind='none';}
  UI.tally.innerHTML='';UI.memev.innerHTML='';UI.map.innerHTML='';UI.mapSect.style.display='none';playerState.previousVariables={};
}
/** Render one trace view behind an error boundary. */
function renderFrameView(view){
  UI.viz.innerHTML='';
  const kind=view&&view.kind?view.kind:'none';
  if(UI.viewBadge){UI.viewBadge.textContent=kind==='none'?'no view':`${kind} view`;UI.viewBadge.dataset.kind=kind;}
  if(!view){UI.viz.appendChild(createElement('div','empty','No visual state for this frame.'));return;}
  UI.viz.appendChild(legendFor(view.kind));
  const renderer=RENDER[view.kind];
  if(typeof renderer!=='function'){
    console.warn(`[COMP2521 Tracer] No renderer registered for view kind "${view.kind}".`,view);
    UI.viz.appendChild(createElement('div','render-warning',`No renderer is registered for view kind "${view.kind}". The trace state remains available in the State pane.`));
    return;
  }
  try{renderer(view,UI.viz);}
  catch(err){
    console.error(`[COMP2521 Tracer] Renderer failed for view kind "${view.kind}".`,err);
    UI.viz.appendChild(createElement('div','render-warning',`The "${view.kind}" visualisation could not be rendered: ${String(err&&err.message||err)}`));
  }
}
/* Presentation classification uses declared provenance, never changes a frame.
 * Older generators returned numeric allocation IDs, so their attempted
 * conceptual flag was absent. Explicit pseudocode provenance is sufficient. */
function isConceptualBlock(block){
  return !!block.conceptual || /\b(pseudocode|conceptual)\b/i.test(String(block.source||''));
}
function paint(){
  const f=playerState.frames[playerState.frameIndex];
  UI.scrub.max=Math.max(0,playerState.frames.length-1); UI.scrub.value=Math.min(playerState.frameIndex,Math.max(0,playerState.frames.length-1));
  UI.tick.textContent=`${playerState.frames.length?playerState.frameIndex+1:0} / ${playerState.frames.length}`;
  setButtonIcon(UI.play,playerState.animationHandle!==null?'pause':'play');
  UI.play.setAttribute('aria-label',playerState.animationHandle!==null?'Pause trace':'Play trace');
  UI.play.disabled=!playerState.frames.length;
  UI.stopBtn.disabled=playerState.animationHandle===null;
  queryOne('#prev').disabled=queryOne('#first').disabled=(!playerState.frames.length||playerState.frameIndex===0);
  queryOne('#next').disabled=queryOne('#last').disabled=(!playerState.frames.length||playerState.frameIndex>=playerState.frames.length-1);
  if(playerState.busy)busyControls().forEach(control=>{control.disabled=true;});

  playerState.sourceLineElements.forEach(blk=>blk&&blk.forEach(r=>r&&r.classList.remove('on')));
  if(!f){ UI.note.innerHTML='Pick an operation and press <b>Run trace</b>.'; UI.viz.innerHTML='';clearFrameState();return; }

  const [bi,ln]=Array.isArray(f.line)?f.line:[0,f.line];
  const row=Number.isInteger(ln)&&ln>0&&playerState.sourceLineElements[bi]?playerState.sourceLineElements[bi][ln]:null;
  if(row){ row.classList.add('on'); if(typeof row.scrollIntoView==='function') row.scrollIntoView({block:'nearest',behavior:playerState.animationHandle!==null?'auto':'smooth'}); }

  UI.note.innerHTML=typeof f.note==='string'?f.note:'';
  renderFrameView(f.view);

  const vars=f.vars&&typeof f.vars==='object'?f.vars:{};
  UI.vars.innerHTML='';
  const keys=Object.keys(vars);
  if(!keys.length) UI.vars.appendChild(createElement('span','empty',' - '));
  keys.forEach(k=>{
    const changed = playerState.previousVariables[k]!==vars[k];
    const d=createElement('div','var'+(changed?' chg':''));
    const declaredType=f.types&&typeof f.types[k]==='string'?f.types[k]:null;
    d.innerHTML=`${declaredType?`<span class="var-type" title="Type explicitly supplied by this trace">${escapeHtml(declaredType)}</span> `:''}<k>${escapeHtml(k)}</k> = <b>${escapeHtml(String(vars[k]))}</b>`;
    if(!declaredType)d.title='No C type is displayed because this trace frame does not explicitly declare one.';
    UI.vars.appendChild(d);
  });
  playerState.previousVariables={...vars};

  const heap=Array.isArray(f.heap)?f.heap:[];
  UI.ledger.innerHTML='';
  if(!heap.length) UI.ledger.appendChild(createElement('span','empty','nothing allocated'));
  heap.forEach(b=>{
    const d=createElement('div','blk'+(b.live?'':' freed')+((f.fresh||[]).includes(b.id)?' fresh':'')+(isConceptualBlock(b)?' conceptual':''));
    d.appendChild(createElement('div','lbl',b.label));
    d.appendChild(createElement('div','sz',b.size));
    if(isConceptualBlock(b)){
      const tag=createElement('div','tag conceptual-tag','conceptual');
      tag.title='Pseudocode value, not a C allocation. No free() is expected.';
      d.appendChild(tag);
    }
    UI.ledger.appendChild(d);
  });
  const realHeap=heap.filter(b=>!isConceptualBlock(b));
  const conceptualHeap=heap.filter(isConceptualBlock);
  const liveReal=realHeap.filter(b=>b.live).length;
  const freedReal=realHeap.length-liveReal;
  const liveConceptual=conceptualHeap.filter(b=>b.live).length;
  const endedConceptual=conceptualHeap.length-liveConceptual;
  const atFinalStep=playerState.frames.length>0&&playerState.frameIndex===playerState.frames.length-1;
  if(UI.memorySummary){
    const lastEvent=Array.isArray(f.ev)&&f.ev.length?f.ev[f.ev.length-1]:null;
    const conceptualEvent=lastEvent&&(/\b(pseudocode|conceptual)\b/i.test(String(lastEvent.source||''))||lastEvent.fn==='create');
    const eventText=!lastEvent?'no memory event on this step'
      :lastEvent.t==='a'?`${lastEvent.label} ${conceptualEvent?'was created as a conceptual value':'was allocated by '+lastEvent.fn}`
      :lastEvent.t==='r'?`realloc changed ${lastEvent.label} from ${lastEvent.oldSize??'unknown'} to ${lastEvent.size}`
      :lastEvent.t==='x'?`${lastEvent.label} reached the end of its tracked lifecycle`
      :`free released ${lastEvent.label}`;
    const realText=realHeap.length?`C allocations: ${liveReal} live, ${freedReal} released.`:'No C allocations recorded.';
    const conceptualText=conceptualHeap.length?` Conceptual values: ${liveConceptual} live, ${endedConceptual} ended. These are not C allocations.`:'';
    UI.memorySummary.textContent=`${realText}${conceptualText} ${eventText}.`;
  }
  UI.tally.innerHTML=(realHeap.length
    ?`<span>C live <b>${liveReal}</b></span><span>C released <b>${freedReal}</b></span><span>C allocations <b>${realHeap.length}</b></span>`:'' )
    +(conceptualHeap.length?`<span>Conceptual live <b>${liveConceptual}</b></span><span>Conceptual ended <b>${endedConceptual}</b></span>`:'')
    +(liveReal&&atFinalStep?`<span class="leak" title="These explicitly modelled C blocks remain live when the trace ends">${liveReal} C blocks still live at the final step</span>`:'');
  const events=Array.isArray(f.ev)?f.ev:(f.ev?[f.ev]:[]);
  UI.memev.innerHTML = events.map(ev=>
    ev.t==='a' ? `<div><span class="a">\u25b2 ${escapeHtml(ev.fn)}</span> ${escapeHtml(ev.label)}  -  ${escapeHtml(ev.size)}</div>`
    : ev.t==='r' ? `<div><span class="r">\u25c6 realloc</span> ${escapeHtml(ev.label)}  -  ${escapeHtml(ev.oldSize??'unknown')} -> ${escapeHtml(ev.size)}</div>`
    : ev.t==='x' ? `<div><span class="x">\u25c7 lifecycle end</span> ${escapeHtml(ev.label)}</div>`
    : `<div><span class="f">\u25bc free</span> ${escapeHtml(ev.label)}</div>`
  ).join('');

  const h3=UI.mapSect.querySelector('h3');
  const sourceMap = f.map || mappingForFrame(playerState.currentModule,f);
  if(playerState.currentModule && (sourceMap || playerState.currentModule.note)){
    UI.mapSect.style.display='';
    h3.textContent = sourceMap
      ? (sourceMap.level==='concept'
          ? 'Concept - no C mapping applies'
          : sourceMap.level==='memorise' && sourceMap.c
          ? 'Pseudocode / concept -> supplemental C'
          : sourceMap.level==='manual'
            ? 'Pseudocode / concept -> exact source C'
            : sourceMap.level==='mixed'
              ? 'Concept -> complete C / provenance map'
              : 'Pseudocode -> C mapping')
      : 'Source boundary';
    let html='';
    if(sourceMap){
      if(sourceMap.provenance) html += `<div class="provenance ${sourceMap.level||''}">${escapeHtml(sourceMap.provenance)}</div>`;
      html += `<div class="ps">${escapeHtml(sourceMap.ps)}</div><div class="to">\u2193</div>`;
      html += sourceMap.c ? `<div class="cc">${escapeHtml(sourceMap.c)}</div>` : `<div class="gap ${sourceMap.level==='memorise'?'memorise-gap':sourceMap.level==='concept'?'concept-gap':''}">${escapeHtml(sourceMap.gap||'No exact source C is supplied for this line.')}</div>`;
      if(sourceMap.why) html += `<div class="why">${sourceMap.why}</div>`;
    }
    if(playerState.currentModule.note) html += `<div class="why"${sourceMap?'':' style="padding-top:0"'}>${playerState.currentModule.note}</div>`;
    UI.map.innerHTML=html;
  } else {
    UI.mapSect.style.display='none';
  }
}

/* transport */
function stop(){
  if(playerState.animationHandle!==null){cancelFrame(playerState.animationHandle);playerState.animationHandle=null;}
  playerState.playbackTimestamp=0;setButtonIcon(UI.play,'play');UI.play.setAttribute('aria-label','Play trace');UI.stopBtn.disabled=true;
}
function playPause(){
  if(!playerState.frames.length){stop();paint();UI.status.textContent='Run a trace before using playback';return;}
  if(playerState.animationHandle!==null){stop();paint();return;}
  if(playerState.frameIndex>=playerState.frames.length-1)playerState.frameIndex=0;
  playerState.playbackTimestamp=(window.performance&&typeof performance.now==='function')?performance.now():Date.now();
  const loop=now=>{
    if(playerState.animationHandle===null)return;
    const delay=Math.max(60,Number(UI.speed.value)||600);
    if(now-playerState.playbackTimestamp>=delay){
      playerState.playbackTimestamp=now;
      if(playerState.frameIndex>=playerState.frames.length-1){stop();paint();return;}
      playerState.frameIndex++;paint();
    }
    if(playerState.animationHandle!==null)playerState.animationHandle=requestFrame(loop);
  };
  playerState.animationHandle=requestFrame(loop);setButtonIcon(UI.play,'pause');UI.play.setAttribute('aria-label','Pause trace');UI.stopBtn.disabled=false;paint();
}
queryOne('#next').onclick=()=>{ stop(); if(playerState.frameIndex<playerState.frames.length-1){playerState.frameIndex++;paint();} };
queryOne('#prev').onclick=()=>{ stop(); if(playerState.frameIndex>0){playerState.frameIndex--;paint();} };
queryOne('#first').onclick=()=>{ stop(); playerState.frameIndex=0; playerState.previousVariables={}; paint(); };
queryOne('#last').onclick=()=>{ stop(); playerState.frameIndex=Math.max(0,playerState.frames.length-1); paint(); };
UI.play.onclick=playPause;
UI.stopBtn.onclick=()=>{
  const wasPlaying=playerState.animationHandle!==null;
  stop();paint();
  UI.status.textContent=wasPlaying?`Playback stopped at step ${playerState.frames.length?playerState.frameIndex+1:0} of ${playerState.frames.length}`:'Playback is already stopped';
};
UI.scrub.oninput=e=>{ stop(); playerState.frameIndex=Number(e.target.value); paint(); };
function updateSpeedStatus(){
  const option=UI.speed.options[UI.speed.selectedIndex];const label=option?option.textContent.trim():'custom';
  if(UI.speedStatus){UI.speedStatus.textContent=`${label} - ${UI.speed.value} ms/step`;UI.speedStatus.value=UI.speedStatus.textContent;}
}
UI.speed.onchange=()=>{updateSpeedStatus();persistCurrentUi();if(playerState.animationHandle!==null){stop();playPause();}};
updateSpeedStatus();
UI.op.onchange=()=>{ if(UI.op.value){selectModule(UI.op.value);go();} };
UI.run.onclick=go;
UI.reset.onclick=resetCurrent;
UI.undoReset.onclick=undoReset;
UI.clearTrace.onclick=()=>clearTraceState();
UI.inputs.addEventListener('input',e=>{
  if(e.target&&e.target.matches('[data-k]')){
    const field=e.target.closest('.field');if(field&&field.classList.contains('invalid')){field.classList.remove('invalid');e.target.removeAttribute('aria-invalid');e.target.removeAttribute('aria-describedby');field.querySelector('.field-error')?.remove();}
    scheduleUiStateWrite();
  }
});
UI.inputs.addEventListener('change',e=>{
  const target=e.target&&e.target.closest?e.target.closest('[data-k]'):null;if(!target)return;
  persistCurrentUi();
  const f=(playerState.currentModule&&playerState.currentModule.fields||[]).find(x=>x.k===target.dataset.k);
  if(target.tagName==='SELECT'){
    if(!f||f.autorun!==false)go();
    else UI.status.textContent=`${f.label} updated; press Run trace to apply the change`;
  }
});
UI.inputs.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target&&e.target.matches('input[data-k],textarea[data-k]')){e.preventDefault();persistCurrentUi();go();}
});
const INTEGER_SEQUENCE_FIELDS=new Set([
  'reclistsum.a','reclistappend.a','lin.a','sel.a','bub.a','ins.a','ms.a','bottomup.a','qs.a','q3.a','listsorts.a','bstins.seq','bstsearch.seq','bsttrav.seq','bstdel.seq','bstfree.seq','bstrotate.seq','bstpartition.seq','bstrebalance.seq','bstlocal.seq','avlheight.seq','avlins.seq','avldel.seq','twosum.a','oddocc.a','heapify.a','heapsort.a'
]);
const SORTED_SEQUENCE_FIELDS=new Set(['bin.a']);
/* radix.a used to be randomised as randomIntegers(7,100,999) - always exactly
   three digits - because the module refused keys of unequal width. Now that it
   pads them (CAP-051), an always-equal-width randomiser never exercises the
   padding path, so Randomise could never show the behaviour the lesson gained.
   Widths are now mixed, and the set still includes the equal-width case, which
   is the one the manual's own example uses. */
const MIXED_WIDTH_KEY_FIELDS=new Set(['radix.a']);
function randomIntegers(length=7,min=1,max=40){return Array.from({length},()=>min+Math.floor(Math.random()*(max-min+1)));}
/* Six keys whose widths genuinely differ, so the padding step is reached, with
   one draw in four left equal-width so the un-padded trace still appears. */
function randomMixedWidthKeys(){
  if(Math.random()<0.25)return randomIntegers(6,100,999);
  const widths=[1,2,3,4];
  return Array.from({length:6},()=>{
    const d=widths[Math.floor(Math.random()*widths.length)];
    const lo=d===1?0:Math.pow(10,d-1);
    const hi=Math.pow(10,d)-1;
    return lo+Math.floor(Math.random()*(hi-lo+1));
  });
}
function randomiseRegisteredField(module,field,control){
  const id=`${module.id}.${field.k}`;
  if(SORTED_SEQUENCE_FIELDS.has(id)){control.value=[...new Set(randomIntegers(10,1,99))].sort((a,b)=>a-b).join(' ');return true;}
  if(MIXED_WIDTH_KEY_FIELDS.has(id)){control.value=randomMixedWidthKeys().join(' ');return true;}
  if(INTEGER_SEQUENCE_FIELDS.has(id)){control.value=randomIntegers(6+Math.floor(Math.random()*3)).join(' ');return true;}
  if(field.k==='val'&&['lin','bin','bstsearch','bstdel','avldel'].includes(module.id)){
    const source=UI.inputs.querySelector('[data-k="a"],[data-k="seq"]');let pool=[];try{pool=source?parseInts(source.value,source.dataset.k,'input values'):[];}catch(error){pool=[];}control.value=pool.length&&Math.random()<.75?pool[Math.floor(Math.random()*pool.length)]:1+Math.floor(Math.random()*40);return true;
  }
  if(field.type==='select'){
    const count=control.options.length;if(!count)return false;let next=Math.floor(Math.random()*count);if(count>1&&next===control.selectedIndex)next=(next+1+Math.floor(Math.random()*(count-1)))%count;control.selectedIndex=next;return true;
  }
  return false;
}
UI.rand.onclick=()=>{
  let changed=0;
  UI.inputs.querySelectorAll('[data-k]').forEach(control=>{const field=(playerState.currentModule.fields||[]).find(candidate=>candidate.k===control.dataset.k);if(field&&randomiseRegisteredField(playerState.currentModule,field,control))changed++;});
  persistCurrentUi();
  if(changed)go();else UI.status.textContent=`No explicit randomiser is registered for ${playerState.currentModule.name}`;
};

function isInteractiveKeyboardTarget(target){
  if(!(target instanceof Element))return false;
  if(target.closest('dialog[open]'))return true;
  if(target.closest('input,textarea,select,a[href],[contenteditable="true"],[role="separator"],[role="slider"],[role="tab"]'))return true;
  const button=target.closest('button,[role="button"]');
  return !!button && !button.closest('.transport');
}
/* A focusable container that actually overflows is keyboard-operable in its own
   right: while it holds focus, the arrow, space, Home and End keys belong to it.
   The trace shortcut claimed those keys unconditionally, so a student who tabbed
   into one of the wide manual-bridge code panes stepped the trace instead of
   scrolling the code, and the part of the pane beyond its 135px column could not
   be reached from the keyboard at all - WCAG 2.1.1, and not something axe-core
   reports, because the markup is correct and only the key handling is wrong.

   The test is deliberately narrow: the element must be focusable AND have an
   auto/scroll overflow AND currently overflow. A focusable region that fits its
   content keeps the trace shortcut, so nothing is given up to fix this. */
function isScrollableRegionTarget(target){
  if(!(target instanceof Element))return false;
  for(let node=target;node&&node!==document.body;node=node.parentElement){
    if(!(node.tabIndex>=0))continue;
    const style=window.getComputedStyle(node);
    if(/(auto|scroll)/.test(style.overflowX)&&node.scrollWidth>node.clientWidth)return true;
    if(/(auto|scroll)/.test(style.overflowY)&&node.scrollHeight>node.clientHeight)return true;
  }
  return false;
}
document.addEventListener('keydown',event=>{
  if(isInteractiveKeyboardTarget(event.target))return;
  if(isScrollableRegionTarget(event.target))return;
  if(event.key==='ArrowRight'){event.preventDefault();queryOne('#next').click();}
  else if(event.key==='ArrowLeft'){event.preventDefault();queryOne('#prev').click();}
  else if(event.key===' '){event.preventDefault();playPause();}
  else if(event.key==='Home'){event.preventDefault();queryOne('#first').click();}
  else if(event.key==='End'){event.preventDefault();queryOne('#last').click();}
});

function applyTextScale(value,persist=true){const scale=VALID_TEXT_SCALES.has(String(value))?String(value):'100';document.documentElement.dataset.textScale=scale;UI.textScale.value=scale;if(persist){persistedState.textScale=scale;writeUiState();}UI.status.textContent=`Interface text size ${scale}%`;}
UI.textScale.addEventListener('change',()=>applyTextScale(UI.textScale.value));

/* Populated by the navigation layer below. The former literal described a
   pre-v4.1 interface (filter box, Trace menu) that no longer exists. */
const TOUR_STEPS=[];
let tourIndex=0;
function renderTour(){const step=TOUR_STEPS[tourIndex];UI.tourTitle.textContent=step.title;UI.tourBody.innerHTML=`<p>${step.body}</p>`;UI.tourProgress.textContent=`Step ${tourIndex+1} of ${TOUR_STEPS.length}`;UI.tourBack.disabled=tourIndex===0;UI.tourNext.textContent=tourIndex===TOUR_STEPS.length-1?'Start tracing':'Next';}
function openTour(start=0){tourIndex=Math.max(0,Math.min(TOUR_STEPS.length-1,start));renderTour();return showManagedDialog(UI.tourDialog,{trigger:UI.helpTour,initialFocus:UI.tourClose,onRequestClose:closeTour});}
function closeTour(){if(UI.tourDontShow.checked){persistedState.tourDismissed=true;writeUiState();}closeManagedDialog(UI.tourDialog,{fallbackFocus:UI.helpTour});}
UI.helpTour.addEventListener('click',()=>openTour(0));UI.tourClose.addEventListener('click',closeTour);UI.tourBack.addEventListener('click',()=>{if(tourIndex>0){tourIndex--;renderTour();}});UI.tourNext.addEventListener('click',()=>{if(tourIndex<TOUR_STEPS.length-1){tourIndex++;renderTour();}else closeTour();});UI.tourDialog.addEventListener('cancel',event=>{event.preventDefault();closeTour();});UI.tourDialog.addEventListener('keydown',event=>{handleManagedDialogKeydown(event,UI.tourDialog,closeTour);});

window.addEventListener('beforeunload',persistCurrentUi);


/** Module-level test surface used by the packaged automated regression suite. */
window.COMP2521TracerTestAPI=Object.freeze({
  buildMeta:BUILD_META,
  moduleInventory(){return MODULES.map(module=>({id:module.id,name:module.name,group:module.group,fields:(module.fields||[]).map(field=>({...field})),blocks:(module.blocks||[]).map(block=>({title:block.title,src:block.src,source:block.source||'manual',pseudo:!!block.pseudo,pages:block.pages||''})),keywords:module.keywords||'',note:module.note||''}));},
  coverageRows(){return COVERAGE_ROWS.map(row=>row.slice());},
  rendererKinds(){return Object.keys(RENDER).sort();},
  runModule(id,overrides={}){const module=MODULES.find(candidate=>candidate.id===id);if(!module)throw new Error(`unknown module: ${id}`);const inputs=Object.fromEntries((module.fields||[]).map(field=>[field.k,String(field.def??'')]));Object.assign(inputs,overrides);const trace=module.run(inputs);if(!trace||!Array.isArray(trace.f))throw new Error(`module ${id} did not return a frame array`);return trace.f;},
  highlightLines(lines){const highlighter=createCHighlighter();return lines.map(line=>highlighter.highlightLine(String(line)));},
  playerSnapshot(){return {currentModuleId:playerState.currentModule&&playerState.currentModule.id,frameCount:playerState.frames.length,frameIndex:playerState.frameIndex,playing:playerState.animationHandle!==null};},
  randomiserRegistry(){return {integerSequences:[...INTEGER_SEQUENCE_FIELDS],sortedSequences:[...SORTED_SEQUENCE_FIELDS],mixedWidthKeys:[...MIXED_WIDTH_KEY_FIELDS]};},
  parseIntegerList(value,fieldKey='a'){return parseInts(value,fieldKey,'integer list');},
  dialogState(){return [...document.querySelectorAll('dialog')].map(dialog=>({id:dialog.id,open:dialogIsOpen(dialog),fallback:dialog.classList.contains('dialog-fallback')}));},
  navigationSnapshot(){const selected=NAV.list?.querySelector('.titem[aria-selected="true"]');return {cursorKey:selected?.dataset.navKey||null,href:selected?.getAttribute('href')||null,drawerOpen:dialogIsOpen(NAV.drawer),activeDescendant:UI.moduleSearch?.getAttribute('aria-activedescendant')||null};},
  busySnapshot(){return {busy:playerState.busy,disabled:busyControls().map(control=>({id:control.id||control.dataset.k||control.tagName,disabled:!!control.disabled}))};},
  displayedTypes(id){const module=MODULES.find(candidate=>candidate.id===id);return module?displayedCDeclarations(module):{};}
});


/* ============================================================
   v4.1.0  -  NAVIGATION, LAYOUT AND DENSITY LAYER
   Presentation and navigation only. No course C, pseudocode,
   algorithm, provenance rule or trace generator is changed here.
   ============================================================ */
const NAV={
  drawer:queryOne('#topicDrawer'),btn:queryOne('#topicsBtn'),list:queryOne('#topicList'),
  close:queryOne('#drawerClose'),crumbGroup:queryOne('#crumbGroup'),crumbName:queryOne('#crumbName'),
  blockIndex:queryOne('#blockIndex'),paneTabs:queryOne('#paneTabs'),inputsLead:queryOne('#inputsLead'),
  panes:queryOne('#panes'),split1:queryOne('#split1'),split2:queryOne('#split2'),
  sourcesBtn:queryOne('#sourcesBtn'),sourcesDialog:queryOne('#sourcesDialog'),resetLayout:queryOne('#resetLayout'),
  sourcesClose:queryOne('#sourcesClose'),sourcesDone:queryOne('#sourcesDone'),buildFacts:queryOne('#buildFacts')
};
const cssEscape=value=>(window.CSS&&typeof CSS.escape==='function')?CSS.escape(value):String(value).replace(/[^a-zA-Z0-9_-]/g,ch=>'\\'+ch);
const PANE_KEYS=['src','viz','state'];
const PANE_EL={src:queryOne('#paneSrc'),viz:queryOne('#paneViz'),state:queryOne('#paneState')};
const DEFAULT_COLS=[0.95,1.5,0.95];
const narrow=()=>typeof window.matchMedia==='function'?window.matchMedia('(max-width:1080px)').matches:window.innerWidth<=1080;

/* ---------- layout: resizable and collapsible panes ---------- */
const LAYOUT={cols:DEFAULT_COLS.slice(),collapsed:{src:false,viz:false,state:false}};
(function restoreLayout(){
  const saved=persistedState.layout;
  if(!saved||typeof saved!=='object')return;
  if(Array.isArray(saved.cols)&&saved.cols.length===3&&saved.cols.every(n=>typeof n==='number'&&isFinite(n)&&n>0.2))LAYOUT.cols=saved.cols.slice();
  if(saved.collapsed&&typeof saved.collapsed==='object')PANE_KEYS.forEach(k=>{LAYOUT.collapsed[k]=!!saved.collapsed[k];});
  if(PANE_KEYS.every(k=>LAYOUT.collapsed[k]))PANE_KEYS.forEach(k=>{LAYOUT.collapsed[k]=false;});
})();
function persistLayout(){persistedState.layout={cols:LAYOUT.cols.slice(),collapsed:{...LAYOUT.collapsed}};writeUiState();}
function applyLayout(){
  const parts=[];
  PANE_KEYS.forEach((key,index)=>{
    const el=PANE_EL[key];
    el.classList.toggle('collapsed',!!LAYOUT.collapsed[key]);
    parts.push(LAYOUT.collapsed[key]?'2.25rem':`minmax(var(--pane-min),${LAYOUT.cols[index].toFixed(4)}fr)`);
    if(index<2){
      const splitter=index===0?NAV.split1:NAV.split2;
      const hide=LAYOUT.collapsed[key]||LAYOUT.collapsed[PANE_KEYS[index+1]];
      splitter.hidden=hide;
      parts.push(hide?'0px':'var(--sw)');
    }
  });
  NAV.panes.style.gridTemplateColumns=parts.join(' ');
  PANE_KEYS.forEach(key=>{
    const collapsed=!!LAYOUT.collapsed[key];
    const label=key==='src'?'Source':key==='viz'?'Trace':'State';
    PANE_EL[key].querySelectorAll('.pane-toggle').forEach(button=>{
      const text=`${collapsed?'Expand':'Collapse'} the ${label} pane`;
      button.setAttribute('aria-label',text);button.title=text;button.setAttribute('aria-expanded',String(!collapsed));
    });
  });
  const total=LAYOUT.cols.reduce((a,b)=>a+b,0);
  [[NAV.split1,0],[NAV.split2,1]].forEach(([splitter,index])=>{
    const upTo=LAYOUT.cols.slice(0,index+1).reduce((a,b)=>a+b,0);
    splitter.setAttribute('aria-valuenow',String(Math.round(upTo/total*100)));
    splitter.setAttribute('aria-valuemin','15');splitter.setAttribute('aria-valuemax','85');
  });
}
function togglePane(key){
  const open=PANE_KEYS.filter(k=>!LAYOUT.collapsed[k]);
  if(!LAYOUT.collapsed[key]&&open.length<=1){UI.status.textContent='At least one pane must stay open';return;}
  LAYOUT.collapsed[key]=!LAYOUT.collapsed[key];
  applyLayout();persistLayout();
  UI.status.textContent=`${key==='src'?'Source':key==='viz'?'Trace':'State'} pane ${LAYOUT.collapsed[key]?'collapsed':'expanded'}`;
}
document.addEventListener('click',event=>{
  const button=event.target instanceof Element?event.target.closest('[data-pane-toggle]'):null;
  if(button)togglePane(button.dataset.paneToggle);
});
function attachSplitter(splitter,leftIndex,rightIndex){
  let startX=0,startLeft=0,startRight=0,pairTotal=0;
  const leftEl=PANE_EL[PANE_KEYS[leftIndex]],rightEl=PANE_EL[PANE_KEYS[rightIndex]];
  const nudge=delta=>{
    const left=LAYOUT.cols[leftIndex]+delta,right=LAYOUT.cols[rightIndex]-delta;
    if(left<0.35||right<0.35)return;
    LAYOUT.cols[leftIndex]=left;LAYOUT.cols[rightIndex]=right;applyLayout();persistLayout();
  };
  splitter.addEventListener('pointerdown',event=>{
    if(event.button!==0||narrow())return;
    startX=event.clientX;
    startLeft=leftEl.getBoundingClientRect().width;
    startRight=rightEl.getBoundingClientRect().width;
    pairTotal=LAYOUT.cols[leftIndex]+LAYOUT.cols[rightIndex];
    try{splitter.setPointerCapture(event.pointerId);}catch(err){}
    document.body.classList.add('resizing');event.preventDefault();
  });
  splitter.addEventListener('pointermove',event=>{
    if(typeof splitter.hasPointerCapture==='function'&&!splitter.hasPointerCapture(event.pointerId))return;
    if(!pairTotal)return;
    const delta=event.clientX-startX,min=180;
    const left=Math.max(min,startLeft+delta),right=Math.max(min,startRight-delta);
    const scale=pairTotal/(left+right);
    LAYOUT.cols[leftIndex]=left*scale;LAYOUT.cols[rightIndex]=right*scale;
    applyLayout();
  });
  const release=event=>{
    if(!pairTotal)return;
    pairTotal=0;
    try{splitter.releasePointerCapture(event.pointerId);}catch(err){}
    document.body.classList.remove('resizing');persistLayout();
  };
  splitter.addEventListener('pointerup',release);
  splitter.addEventListener('pointercancel',release);
  splitter.addEventListener('dblclick',()=>{LAYOUT.cols=DEFAULT_COLS.slice();applyLayout();persistLayout();});
  splitter.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();event.stopPropagation();nudge(-0.08);}
    else if(event.key==='ArrowRight'){event.preventDefault();event.stopPropagation();nudge(0.08);}
    else if(event.key==='Home'){event.preventDefault();event.stopPropagation();LAYOUT.cols=DEFAULT_COLS.slice();applyLayout();persistLayout();}
  });
}
attachSplitter(NAV.split1,0,1);
attachSplitter(NAV.split2,1,2);
function resetWorkspaceLayout(){
  LAYOUT.cols=DEFAULT_COLS.slice();PANE_KEYS.forEach(key=>{LAYOUT.collapsed[key]=false;});applyLayout();persistLayout();setPane('viz');UI.status.textContent='Workspace layout restored to the default three-pane arrangement';
}
NAV.resetLayout?.addEventListener('click',resetWorkspaceLayout);
applyLayout();

/* ---------- narrow-viewport pane tabs ---------- */
function setPane(key){
  if(!PANE_KEYS.includes(key))return;
  NAV.panes.dataset.pane=key;
  NAV.paneTabs.querySelectorAll('[role="tab"]').forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.pane===key)));
  persistedState.pane=key;writeUiState();
}
NAV.paneTabs.addEventListener('click',event=>{
  const tab=event.target instanceof Element?event.target.closest('[data-pane]'):null;
  if(tab)setPane(tab.dataset.pane);
});
NAV.paneTabs.addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  const tabs=[...NAV.paneTabs.querySelectorAll('[role="tab"]')];
  const at=tabs.indexOf(document.activeElement);
  if(at<0)return;
  event.preventDefault();
  const next=tabs[(at+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length];
  next.focus();setPane(next.dataset.pane);
});
setPane(PANE_KEYS.includes(persistedState.pane)?persistedState.pane:'viz');

/* ---------- source block index and collapsible blocks ---------- */
let blockOpen=[];
function toggleBlock(blockIndex,force){
  const section=UI.code.querySelector(`.cblock[data-bi="${blockIndex}"]`);
  if(!section)return;
  const next=force===undefined?section.dataset.open!=='1':!!force;
  section.dataset.open=next?'1':'0';
  const head=section.querySelector('.blockhdr');
  if(head)head.setAttribute('aria-expanded',String(next));
  blockOpen[blockIndex]=next;
}
function ensureBlockOpen(blockIndex){if(blockOpen[blockIndex]===false)toggleBlock(blockIndex,true);}
function scrollBlockIntoView(blockIndex){
  const head=UI.code.querySelector(`.cblock[data-bi="${blockIndex}"] .blockhdr`);
  if(head&&typeof head.scrollIntoView==='function')head.scrollIntoView({block:'start',behavior:'smooth'});
}
function renderBlockIndex(module){
  const blocks=(module&&module.blocks)||[];
  NAV.blockIndex.innerHTML='';
  if(blocks.length<2){NAV.blockIndex.hidden=true;return;}
  NAV.blockIndex.hidden=false;
  NAV.blockIndex.appendChild(createElement('span','bi-lead',`${blocks.length} blocks`));
  blocks.forEach((block,index)=>{
    const chip=createElement('button','chip',block.title);
    chip.type='button';chip.dataset.bi=String(index);chip.title=`${block.title}  -  ${block.src.split('\n').length} lines`;
    chip.addEventListener('click',()=>{toggleBlock(index,true);scrollBlockIntoView(index);});
    NAV.blockIndex.appendChild(chip);
  });
  const bulk=createElement('button','chip ghost');
  bulk.type='button';
  const sync=()=>{const allOpen=blockOpen.every(Boolean);bulk.textContent=allOpen?'Collapse all':'Expand all';};
  bulk.addEventListener('click',()=>{const allOpen=blockOpen.every(Boolean);blocks.forEach((b,i)=>toggleBlock(i,!allOpen));sync();});
  sync();
  NAV.blockIndex.appendChild(bulk);
}
function syncBlockIndex(frame){
  if(NAV.blockIndex.hidden)return;
  const active=frame&&Array.isArray(frame.line)?frame.line[0]:-1;
  NAV.blockIndex.querySelectorAll('.chip[data-bi]').forEach(chip=>{
    if(Number(chip.dataset.bi)===active)chip.dataset.active='1';else chip.removeAttribute('data-active');
  });
}
const CARET_PATH='M6 9l6 6 6-6';
function caretSvg(){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','bh-caret');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',CARET_PATH);svg.appendChild(path);
  return svg;
}
renderCode=function(module){
  UI.code.innerHTML='';playerState.sourceLineElements=[];
  const blocks=module.blocks||[];
  const collapseByDefault=blocks.length>=4;
  blockOpen=blocks.map((block,index)=>collapseByDefault?index===0:true);
  blocks.forEach((block,blockIndex)=>{
    const section=createElement('section','cblock');
    section.dataset.bi=String(blockIndex);
    section.dataset.open=blockOpen[blockIndex]?'1':'0';

    const head=createElement('button','blockhdr');
    head.type='button';head.id=`blockhdr-${blockIndex}`;
    head.setAttribute('aria-expanded',String(!!blockOpen[blockIndex]));
    head.setAttribute('aria-controls',`blockbody-${blockIndex}`);
    head.appendChild(caretSvg());
    head.appendChild(createElement('span','bh-title',block.title));
    const kind=block.source||'manual';
    head.appendChild(createElement('span','tag sourcebadge '+kind,SOURCE_LABEL[kind]||kind));
    if(block.pages)head.appendChild(createElement('span','pg',block.pages));
    const sourceLines=block.src.split('\n');
    head.appendChild(createElement('span','bh-lines',`${sourceLines.length} lines`));
    head.addEventListener('click',()=>toggleBlock(blockIndex));
    section.appendChild(head);

    const body=createElement('div','cbody');
    body.id=`blockbody-${blockIndex}`;
    body.setAttribute('role','region');
    body.setAttribute('aria-labelledby',`blockhdr-${blockIndex}`);
    if(kind==='memorise'){
      const warn=createElement('div','memnotice');
      /* P2-03: the label always shows; the full explanation shows once per
         module and is available on every block through the title attribute. */
      /* CUR-MOD-02: the provenance half of this notice is accurate and is
         kept; the memorisation requirement is not supported by any
         authoritative course source and has been removed. */
      warn.innerHTML='<b>Supplemental implementation - not course source.</b>'
        +'<span class="memnotice-detail"> This complete implementation is not printed in the attached 26T2 manual, and the attached 25T3 lectures do not supply it as complete C. Use it to see one concrete way this topic\'s operations can be implemented, and to compare representations. You do not need to memorise it to follow the trace.</span>';
      warn.title='Supplemental C. Not printed in the 26T2 manual and not supplied as complete C in the 25T3 lectures. Provided for reference and comparison.';
      body.appendChild(warn);
    }
    const wrap=createElement('div',block.pseudo?'pseudo':'');
    const sourceHighlighter=createCHighlighter();
    playerState.sourceLineElements[blockIndex]=[];
    sourceLines.forEach((line,i)=>{
      const row=createElement('div','cline');
      const lineNumber=createElement('span','n',String(i+1));lineNumber.setAttribute('aria-hidden','true');row.appendChild(lineNumber);
      const text=createElement('span','t');
      text.innerHTML=sourceHighlighter.highlightLine(line)||'&nbsp;';
      row.appendChild(text);
      wrap.appendChild(row);
      playerState.sourceLineElements[blockIndex][i+1]=row;
    });
    body.appendChild(wrap);
    section.appendChild(body);
    UI.code.appendChild(section);
  });
  renderBlockIndex(module);
};


/* ---------- topic drawer ---------- */
const openGroups=new Set();
let cursorKey=null;
function visibleItems(){return [...NAV.list.querySelectorAll('.titem[data-nav-key]')].filter(item=>item.offsetParent!==null||item.closest('.tgroup[data-open="1"]'));}
function topicNavKey(element){return element&&element.dataset?element.dataset.navKey:null;}
function markMatch(text,query){
  const safe=escapeHtml(text);
  if(!query)return safe;
  const at=text.toLowerCase().indexOf(query);
  if(at<0)return safe;
  return `${escapeHtml(text.slice(0,at))}<mark>${escapeHtml(text.slice(at,at+query.length))}</mark>${escapeHtml(text.slice(at+query.length))}`;
}
function renderTopicList(shown,query){
  const currentId=playerState.currentModule&&playerState.currentModule.id;
  NAV.list.innerHTML='';
  if(!shown.length){
    NAV.list.appendChild(createElement('div','drawer-empty',`No topics match "${query}". Clear the search to see all ${MODULES.length}.`));
    cursorKey=null;return;
  }
  const groups=[];
  shown.forEach(module=>{
    let group=groups.find(candidate=>candidate.name===module.group);
    if(!group){group={name:module.group,items:[]};groups.push(group);}
    group.items.push(module);
  });
  groups.forEach(group=>{
    const holdsCurrent=group.items.some(module=>module.id===currentId);
    const open=query?true:(openGroups.has(group.name)||holdsCurrent);
    const wrap=createElement('div','tgroup');
    wrap.dataset.open=open?'1':'0';
    const head=createElement('button','tgroup-h');
    head.type='button';head.setAttribute('aria-expanded',String(open));
    head.appendChild(caretSvg());
    head.appendChild(createElement('span','tg-name',group.name));
    head.appendChild(createElement('span','tg-n',String(group.items.length)));
    head.addEventListener('click',()=>{
      const next=wrap.dataset.open!=='1';
      wrap.dataset.open=next?'1':'0';head.setAttribute('aria-expanded',String(next));
      if(next)openGroups.add(group.name);else openGroups.delete(group.name);
    });
    wrap.appendChild(head);
    const body=createElement('div','tgroup-body');
    group.items.forEach(module=>{
      const item=createElement('button','titem');
      item.type='button';item.dataset.id=module.id;item.dataset.navKey=`local:${module.id}`;item.setAttribute('role','option');item.setAttribute('aria-selected','false');
      item.innerHTML=markMatch(module.name,query);
      item.title=`${module.group} \u203a ${module.name}`;
      if(module.id===currentId)item.setAttribute('aria-current','true');
      item.addEventListener('click',()=>activateTopic(module.id));
      body.appendChild(item);
    });
    wrap.appendChild(body);
    NAV.list.appendChild(wrap);
  });
  const preferred=shown.find(module=>module.id===currentId)||shown[0];
  setCursor(query?`local:${shown[0].id}`:(preferred&&`local:${preferred.id}`));
}
function setCursor(key){
  cursorKey=key||null;
  NAV.list.querySelectorAll('.titem.cursor').forEach(item=>{item.classList.remove('cursor');item.setAttribute('aria-selected','false');});
  if(!cursorKey){UI.moduleSearch.removeAttribute('aria-activedescendant');return;}
  const item=NAV.list.querySelector(`.titem[data-nav-key="${cssEscape(cursorKey)}"]`);
  if(item){item.classList.add('cursor');item.setAttribute('aria-selected','true');if(!item.id)item.id=`topic-option-${Math.abs([...cursorKey].reduce((hash,char)=>((hash*31)+char.charCodeAt(0))|0,7))}`;UI.moduleSearch.setAttribute('aria-activedescendant',item.id);if(typeof item.scrollIntoView==='function')item.scrollIntoView({block:'nearest'});}
}
function moveCursor(step){
  const items=visibleItems();
  if(!items.length)return;
  let at=items.findIndex(item=>topicNavKey(item)===cursorKey);
  if(at<0)at=step>0?-1:0;
  const next=items[(at+step+items.length)%items.length];
  if(next)setCursor(topicNavKey(next));
}
function activateCursor(){
  if(!cursorKey)return;
  const item=NAV.list.querySelector(`.titem[data-nav-key="${cssEscape(cursorKey)}"]`);if(!item)return;
  if(item.dataset.id){activateTopic(item.dataset.id);return;}
  const href=item.getAttribute('href');if(href){closeDrawer(false);window.location.href=href;}
}
function activateTopic(id){
  if(!id)return;
  try{
    UI.moduleSearch.value='';
    
  buildMenu('');
    UI.op.value=id;
    selectModule(id);
    go();
    if(narrow())setPane('viz');
  }catch(err){
    console.error('[COMP2521 Tracer] Topic activation failed.',err);
  }finally{
    closeDrawer(false);
  }
  UI.status.textContent=`Opened ${playerState.currentModule?playerState.currentModule.name:id}`;
}
function openDrawer(){
  buildMenu(UI.moduleSearch.value||'');
  const opened=showManagedDialog(NAV.drawer,{trigger:NAV.btn,initialFocus:UI.moduleSearch,onRequestClose:()=>closeDrawer(true)});
  if(opened){NAV.btn.setAttribute('aria-expanded','true');UI.moduleSearch.setAttribute('aria-expanded','true');}
  return opened;
}
function closeDrawer(restoreFocus=true){
  UI.moduleSearch.value='';UI.moduleSearch.setAttribute('aria-expanded','false');UI.moduleSearch.removeAttribute('aria-activedescendant');
  buildMenu('');
  if(playerState.currentModule)UI.op.value=playerState.currentModule.id;
  NAV.btn.setAttribute('aria-expanded','false');
  closeManagedDialog(NAV.drawer,{fallbackFocus:NAV.btn,restoreFocus});
}
NAV.btn.addEventListener('click',openDrawer);
NAV.close.addEventListener('click',()=>closeDrawer());
NAV.drawer.addEventListener('cancel',event=>{event.preventDefault();closeDrawer();});
NAV.drawer.addEventListener('click',event=>{
  if(event.target===NAV.drawer)closeDrawer();
});
NAV.drawer.addEventListener('keydown',event=>{
  if(handleManagedDialogKeydown(event,NAV.drawer,()=>closeDrawer(true)))return;
  /* AUD-06: the topic cursor used to claim ArrowUp/ArrowDown/Enter for the
     whole drawer. Tabbing to the Close button and pressing Enter therefore
     activated the topic cursor instead of closing the drawer, because Enter
     was preventDefault()ed before the focused native control ever saw it.
     The cursor belongs to the search field and the options list, so it is
     restricted to that context here; every other focused control keeps its
     own native keyboard behaviour. Composition events and keystrokes a
     widget has already handled are left alone. */
  if(event.defaultPrevented)return;
  if(event.isComposing||event.keyCode===229)return;
  if(event.metaKey||event.ctrlKey||event.altKey)return;
  const target=event.target||{};
  const tag=String(target.tagName||'').toLowerCase();
  const inOptionsList=typeof target.closest==='function'
    && !!target.closest('#topicList,#drawerAreas,[role="option"],[role="listbox"]');
  /* The drawer's only text field is the topic search box. */
  const inSearchField=tag==='input'||tag==='textarea'||target.isContentEditable===true;
  const inCursorContext=inSearchField||inOptionsList;
  if(!inCursorContext)return;
  if(event.key==='ArrowDown'){event.preventDefault();moveCursor(1);}
  else if(event.key==='ArrowUp'){event.preventDefault();moveCursor(-1);}
  else if(event.key==='Enter'&&cursorKey){event.preventDefault();activateCursor();}
});

/* Filtering while the drawer is open updates the list only; it no longer
   re-renders the source pane on every keystroke. */
const baseApplyModuleFilter=applyModuleFilter;
applyModuleFilter=function(){
  if(NAV.drawer.open||NAV.drawer.hasAttribute('open')){
    buildMenu(UI.moduleSearch.value);
    return;
  }
  baseApplyModuleFilter();
};
const baseBuildMenu=buildMenu;
buildMenu=function(filter=''){
  const shown=baseBuildMenu(filter);
  renderTopicList(shown,String(filter||'').trim().toLowerCase());
  UI.moduleCount.textContent=`${shown.length} of ${MODULES.length} topics`;
  return shown;
};

/* ---------- breadcrumb, input lead and per-frame sync ---------- */
const baseSelectModule=selectModule;
selectModule=function(id,options={}){
  baseSelectModule(id,options);
  const module=playerState.currentModule;
  if(!module)return;
  NAV.crumbGroup.textContent=module.group||'';
  NAV.crumbName.textContent=module.name||'';
  NAV.crumbName.title=`${module.group} \u203a ${module.name} (${module.id})`;
  const fieldCount=(module.fields||[]).length;
  NAV.inputsLead.textContent=fieldCount?'Inputs':'No inputs';
  NAV.inputsLead.title=fieldCount?`${fieldCount} input${fieldCount===1?'':'s'} for this topic`:'This topic takes no inputs  -  press Run trace';
  if(module.group)openGroups.add(module.group);
};
const basePaint=paint;
paint=function(){
  const frame=playerState.frames[playerState.frameIndex];
  if(frame&&Array.isArray(frame.line))ensureBlockOpen(frame.line[0]);
  basePaint();
  syncBlockIndex(frame);
};

/* ---------- sources sheet ---------- */
function openSources(){
  NAV.buildFacts.innerHTML='';
  const facts=[['Product',BUILD_META.product],['Version',BUILD_META.version],['Status',BUILD_META.status],['Build date',BUILD_META.buildDate],['Code predecessor',BUILD_META.codePredecessorVersion],['Package predecessor',BUILD_META.controlledPackagePredecessorVersion],['Predecessor package',BUILD_META.controlledPackagePredecessorFilename],['Current topic',playerState.currentModule?`${playerState.currentModule.name} (${playerState.currentModule.id})`:' - ']];
  facts.forEach(([term,value])=>{
    NAV.buildFacts.appendChild(createElement('dt',null,term));
    NAV.buildFacts.appendChild(createElement('dd',null,String(value==null?' - ':value)));
  });
  return showManagedDialog(NAV.sourcesDialog,{trigger:NAV.sourcesBtn,initialFocus:NAV.sourcesClose,onRequestClose:closeSources});
}
function closeSources(){
  closeManagedDialog(NAV.sourcesDialog,{fallbackFocus:NAV.sourcesBtn});
}
NAV.sourcesBtn.addEventListener('click',openSources);
NAV.sourcesClose.addEventListener('click',closeSources);
NAV.sourcesDone.addEventListener('click',closeSources);
NAV.sourcesDialog.addEventListener('cancel',event=>{event.preventDefault();closeSources();});
NAV.sourcesDialog.addEventListener('click',event=>{if(event.target===NAV.sourcesDialog)closeSources();});
NAV.sourcesDialog.addEventListener('keydown',event=>{handleManagedDialogKeydown(event,NAV.sourcesDialog,closeSources);});

/* ---------- global shortcuts ---------- */
document.addEventListener('keydown',event=>{
  /* AUD-06: ordinary typing must win over a global shortcut.
     The open-dialog branch used to run BEFORE the in-a-field test, so while
     any dialog was open the bare keys t, T, / and ? were preventDefault()ed
     even when the user was typing into a field inside that dialog. Searching
     for "tree", "stack", "shortest path" or typing "?" silently lost
     characters. The field test now runs first, and only an explicit request
     for ANOTHER dialog is intercepted.
     Also skipped: keystrokes a widget has already handled
     (event.defaultPrevented) and IME composition, where a key event is part
     of composing text rather than a shortcut. */
  if(event.defaultPrevented)return;
  if(event.isComposing||event.keyCode===229)return;
  const target=event.target;
  const inField=!!(target&&typeof target.closest==='function'
    &&target.closest('input,textarea,select,[contenteditable="true"]'))
    ||!!(target&&target.isContentEditable===true);
  /* Cmd/Ctrl+K is a deliberate command-palette chord and is honoured from a
     field; the bare single-character shortcuts are not. */
  const requestsPalette=(event.key==='k'||event.key==='K')&&(event.metaKey||event.ctrlKey);
  const requestsBareDialog=!inField&&!event.metaKey&&!event.ctrlKey&&!event.altKey
    &&(event.key==='t'||event.key==='T'||event.key==='/'||event.key==='?');
  const openModal=[...document.querySelectorAll('dialog')].find(dialogIsOpen);
  if(openModal){
    if(requestsPalette||requestsBareDialog){event.preventDefault();UI.status.textContent=`Close ${dialogLabel(openModal)} before opening another dialog`;}
    return;
  }
  if(requestsPalette){event.preventDefault();openDrawer();return;}
  if(inField||event.metaKey||event.ctrlKey||event.altKey)return;
  if(event.key==='t'||event.key==='T'||event.key==='/'){event.preventDefault();openDrawer();}
  else if(event.key==='?'){event.preventDefault();UI.helpTour.click();}
  else if(narrow()&&['1','2','3'].includes(event.key)){event.preventDefault();setPane(PANE_KEYS[Number(event.key)-1]);}
});

/* ---------- refreshed quick tour ---------- */
TOUR_STEPS.length=0;
TOUR_STEPS.push(
  {title:'Find a topic',body:'Press <code>Topics</code> (or <code>T</code>, or <code>Ctrl/\u2318 K</code>) to open the grouped list of all course topics. Search matches topic names, keywords and source-block titles. Use <code>\u2191 \u2193</code> to move and <code>\u21b5</code> to open.'},
  {title:'Set inputs, then run',body:'The inputs row shows only the fields the current topic needs. Edit them and press <code>Run trace</code>. Invalid values are explained directly under the field.'},
  {title:'Step through execution',body:'Use the transport bar, the scrubber, or <code>\u2190 -></code>, <code>Space</code>, <code>Home</code> and <code>End</code>. The dedicated stop button preserves the current frame.'},
  {title:'Navigate long source',body:'Topics with several source blocks show a block index above the code. Blocks collapse so you can read one at a time, and the block holding the active line opens automatically as the trace runs.'},
  {title:'Arrange the workspace',body:'Drag the dividers between panes, or use the arrow buttons in each pane header to collapse a pane you are not using. On a narrow screen the three panes become tabs. Your arrangement is remembered.'}
);

/* ---------- initial paint of navigation chrome ---------- */
buildMenu('');

/* Startup topic: deep link first, then this page\u2019s last topic, then its first. */
/* A shared link carries the topic and its inputs: #moduleId?key=value&key=value.
   Everything below tolerates a plain #moduleId, which is what the app writes
   itself, so existing links keep working. */
/* ---------- AUD-07: fragment routing ----------
   The previous parser called decodeURIComponent on the module-id part of the
   fragment WITHOUT a guard. Only the query-parameter decode was wrapped, so
   "#%", "#%E0%A4%A" and "#bin%ZZ?a=1" each raised an uncaught URIError and
   aborted startup or the hashchange handler. Malformed input in a URL is
   ordinary, not exceptional, so it is now reported as a structured result.
   Lengths are capped, and the id and every field name are allowlisted
   against the real module registry rather than trusted. */
function parseHash(){
  const rawHash=String((typeof location!=='undefined'&&location.hash)||'');
  if(rawHash.length>ROUTE_MAX_HASH_LENGTH)return {id:'',values:null,error:'hash-too-long'};
  const raw=rawHash.replace(/^#/,'');
  const cut=raw.indexOf('?');
  const id=safeDecodeURIComponent(cut<0?raw:raw.slice(0,cut));
  if(id===null)return {id:'',values:null,error:'malformed-encoding'};
  if(cut<0)return {id,values:null};
  const values={};
  let malformed=false;
  raw.slice(cut+1).split('&').forEach(pair=>{
    if(!pair)return;
    const eq=pair.indexOf('=');
    if(eq<0){malformed=true;return;}
    const key=safeDecodeURIComponent(pair.slice(0,eq));
    const value=safeDecodeURIComponent(pair.slice(eq+1));
    if(key===null||value===null){malformed=true;return;}
    if(value.length>ROUTE_MAX_VALUE_LENGTH){malformed=true;return;}
    values[key]=value;
  });
  return malformed?{id,values,error:'malformed-parameter'}:{id,values};
}
/* Declared after parseHash so that they remain inside the audited
   source-extraction range, which begins at `function parseHash(){`. They are
   initialised before parseHash is ever called. */
const ROUTE_MAX_HASH_LENGTH=2048;
const ROUTE_MAX_VALUE_LENGTH=512;
function safeDecodeURIComponent(text){
  try{return decodeURIComponent(text);}catch(err){return null;}
}

/* Apply route-supplied field values through the SHARED validator, so a link
   cannot inject a value that the Run button would have rejected. Only fields
   the module actually declares are considered. Returns true when the controls
   were updated. */
function applyRouteValues(id,values){
  if(!values||typeof values!=='object')return false;
  if(typeof UI==='undefined'||!UI||!UI.inputs)return false;
  const module=MODULES.find(m=>m.id===id);
  if(!module||!Array.isArray(module.fields))return false;
  const candidate={};
  for(const field of module.fields)
    if(Object.prototype.hasOwnProperty.call(values,field.k))candidate[field.k]=values[field.k];
  if(!Object.keys(candidate).length)return false;
  /* Validate the whole resulting input set, not just the supplied subset. */
  const current=typeof readInputs==='function'?readInputs():{};
  const merged={...current,...candidate};
  if(typeof validateModuleInputs==='function'){
    const check=validateModuleInputs(module,merged);
    if(!check.ok){
      const first=check.errors[0];
      if(typeof markInputError==='function')markInputError(new InputValidationError(first.message,first.fieldKey));
      if(UI.status)UI.status.textContent='The link contained a value this topic cannot use: '+first.message;
      return false;
    }
  }
  let applied=false;
  for(const field of module.fields){
    if(!Object.prototype.hasOwnProperty.call(candidate,field.k))continue;
    const control=UI.inputs.querySelector(`[data-k="${typeof CSS!=='undefined'&&CSS.escape?CSS.escape(field.k):field.k}"]`);
    if(!control)continue;
    control.value=candidate[field.k];
    if(typeof Event==='function')control.dispatchEvent(new Event('input',{bubbles:true}));
    applied=true;
  }
  return applied;
}

/* One dispatch path shared by first paint and same-document navigation, so
   an equivalent fragment produces an equivalent scenario either way. */
function dispatchRoute(route,opt){
  opt=opt||{};
  if(!route||route.error==='hash-too-long')return false;
  const id=route.id;
  if(!id||!MODULES.some(module=>module.id===id))return false;
  const already=!!(playerState.currentModule&&playerState.currentModule.id===id);
  const hasRouteValues=!!(route.values&&Object.keys(route.values).length);
  if(!already)selectModule(id);
  applyRouteValues(id,route.values);
  /* A fragment that carries values is a request to show THAT scenario, so it
     re-runs even when the module is already selected - which is exactly what
     the previous same-module early return skipped. A bare "#id" for the
     module already on screen changes nothing and must not re-run, so that it
     cannot loop against writeHash. */
  if(!already||hasRouteValues)go();
  return true;
}
function resolveStartupModule(){
  const onPage=id=>typeof id==='string'&&MODULES.some(module=>module.id===id);
  const hash=parseHash().id;
  if(onPage(hash))return hash;
  const remembered=persistedState.pageModule&&persistedState.pageModule[TRACER_PAGE.id];
  if(onPage(remembered))return remembered;
  if(onPage(persistedState.module))return persistedState.module;
  return MODULES[0]&&MODULES[0].id;
}

/* ---------- P2-04: mobile input density ----------
   On a narrow screen the inputs row plus actions pushed the visualisation
   below the fold. After a successful run the row collapses to a one-line
   summary; editing reopens it. Wide screens are unaffected. */
(function collapsibleInputs(){
  /* Installed once at startup. A previous build created this inside
     activateTopic(), so it never ran for the topic a page opens with and
     stacked another go()/selectModule() wrapper on every drawer selection. */
  const toolbar=queryOne('.toolbar');
  const summary=queryOne('#inputsSummary');
  const summaryText=queryOne('#inputsSummaryText');
  const edit=queryOne('#inputsEdit');
  if(!toolbar||!summary||!summaryText||!edit)return;
  const narrowInputs=()=>typeof window.matchMedia==='function'
    ? window.matchMedia('(max-width:720px)').matches : window.innerWidth<=720;
  function describe(){
    const module=playerState.currentModule;
    const fields=(module&&module.fields)||[];
    if(!fields.length)return 'No inputs';
    const values=readInputs();
    return fields.map(field=>`${field.label} ${values[field.k]}`).join('  |  ');
  }
  function setCollapsed(on){
    const collapse=!!on&&narrowInputs();
    toolbar.dataset.collapsed=collapse?'1':'0';
    summary.hidden=!collapse;
    if(collapse){summaryText.textContent=describe();summaryText.title=describe();}
  }
  edit.addEventListener('click',()=>{
    setCollapsed(false);
    const first=UI.inputs.querySelector('[data-k]');
    if(first)first.focus({preventScroll:true});
  });
  const baseGo=go;
  go=function(){
    baseGo();
    if(playerState.frames.length>1)setCollapsed(true);
  };
  const baseSelect=selectModule;
  selectModule=function(id,options){baseSelect(id,options);setCollapsed(false);};
  window.addEventListener('resize',()=>{if(!narrowInputs())setCollapsed(false);});
})();

/* ---------- R2 P2: secondary controls behind one More menu ----------
   Keeps the learning surface to the primary actions. Every grouped control
   keeps its own id, shortcut and accessible name. */
(function moreMenus(){
  const pairs=[['#moreBtn','#moreMenu'],['#moreRunBtn','#moreRunMenu']];
  const open=[];
  function close(button,menu){menu.hidden=true;button.setAttribute('aria-expanded','false');}
  pairs.forEach(([bs,ms])=>{
    const button=queryOne(bs),menu=queryOne(ms);
    if(!button||!menu)return;
    open.push(()=>close(button,menu));
    button.addEventListener('click',event=>{
      event.stopPropagation();
      const show=menu.hidden;
      open.forEach(fn=>fn());
      if(show){menu.hidden=false;button.setAttribute('aria-expanded','true');
        const first=menu.querySelector('button');if(first)first.focus({preventScroll:true});}
    });
    menu.addEventListener('click',()=>close(button,menu));
    menu.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close(button,menu);button.focus({preventScroll:true});return;}
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        const items=[...menu.querySelectorAll('button:not(:disabled)')].filter(item=>item.getClientRects().length);
        if(!items.length)return;
        event.preventDefault();
        const current=items.indexOf(document.activeElement);
        const next=event.key==='Home'?0:event.key==='End'?items.length-1:event.key==='ArrowDown'?(current+1)%items.length:(current+items.length-1)%items.length;
        items[next].focus({preventScroll:true});
      }
      if(event.key==='Tab')close(button,menu);
    });
  });
  document.addEventListener('click',()=>open.forEach(fn=>fn()));
})();

/* ---------- study aids: progress, recent topics, share ----------
   All three are local to the browser. Nothing is transmitted. */
const STUDY_KEY='comp2521-tracer:study:v1';
/* ---------- AUD-09: concurrent study progress ----------
   The previous design read the whole progress object ONCE at page load and
   then wrote that whole in-memory object back on every change. Two tabs
   opened before either wrote therefore both started from the same snapshot,
   and the second write replaced the first tab's completion: finishing bstins
   in one tab and bfs in another left only bfs recorded.

   This version treats a completion as an independent, monotonic FACT rather
   than a field of a shared blob:

   - completedAt maps topic id -> first-completion timestamp. It is the single
     source of truth; `done` is a derived array kept in the stored object so
     the record stays readable and so existing readers keep working.
   - Every write re-reads the stored value and MERGES before writing. The
     merge is a union over completedAt (keeping the EARLIEST timestamp per
     topic), so concurrent completions commute and no completion can be lost
     by another tab's later write. localStorage offers no transaction, so this
     narrows the race to the microseconds inside one synchronous function and,
     more importantly, makes the operation order-independent.
   - Recording a recent topic merges the same way, so a recent-topic
     preference can never overwrite a completion fact.
   - v1 data is migrated non-destructively: the original v1 value is copied to
     a backup key and left intact.
   - A `storage` event from another tab reconciles the in-memory view.
   - Every access is guarded, so a browser that denies storage (private mode,
     blocked site data) degrades to an in-memory session instead of throwing.
   Nothing here clears real user progress. */
const STUDY_KEY_V1_BACKUP='comp2521-tracer:study:v1-pre-v2-backup';
const STUDY_SCHEMA_VERSION=2;
const STUDY_RECENT_LIMIT=5;

function studyStorage(){
  try{return typeof localStorage!=='undefined'?localStorage:null;}catch(err){return null;}
}
function emptyStudy(){return {v:STUDY_SCHEMA_VERSION,done:[],completedAt:{},recent:[]};}

/** Normalise any stored shape (v1 array form or v2 form) into the v2 model. */
function normaliseStudy(parsed){
  const out=emptyStudy();
  if(!parsed||typeof parsed!=='object')return out;
  if(parsed.completedAt&&typeof parsed.completedAt==='object'){
    for(const id of Object.keys(parsed.completedAt)){
      const ts=Number(parsed.completedAt[id]);
      if(id&&Number.isFinite(ts))out.completedAt[id]=ts;
    }
  }
  /* v1 (and the derived array) carried only ids, with no timestamp. They are
     admitted with timestamp 0, which means "completed, time unknown" and
     always loses to a real timestamp in the earliest-wins merge. */
  if(Array.isArray(parsed.done))
    for(const id of parsed.done)
      if(id&&!Object.prototype.hasOwnProperty.call(out.completedAt,id))out.completedAt[id]=0;
  if(Array.isArray(parsed.recent))
    out.recent=parsed.recent.filter(x=>typeof x==='string'&&x).slice(0,STUDY_RECENT_LIMIT);
  out.done=Object.keys(out.completedAt).sort((a,b)=>(out.completedAt[a]-out.completedAt[b])||a.localeCompare(b));
  return out;
}

function readStudy(){
  const store=studyStorage();
  if(!store)return emptyStudy();
  let raw=null;
  try{raw=store.getItem(STUDY_KEY);}catch(err){return emptyStudy();}
  if(!raw)return emptyStudy();
  let parsed=null;
  try{parsed=JSON.parse(raw);}catch(err){return emptyStudy();}
  const needsMigration=parsed&&typeof parsed==='object'&&Number(parsed.v)!==STUDY_SCHEMA_VERSION;
  if(needsMigration){
    /* Preserve the pre-migration value exactly, once, without deleting it. */
    try{if(store.getItem(STUDY_KEY_V1_BACKUP)==null)store.setItem(STUDY_KEY_V1_BACKUP,raw);}catch(err){}
  }
  return normaliseStudy(parsed);
}

/** Union-merge two study records. Completion is monotonic: earliest wins. */
function mergeStudy(base,incoming){
  const out=emptyStudy();
  for(const src of [base,incoming]){
    if(!src)continue;
    for(const id of Object.keys(src.completedAt||{})){
      const ts=Number(src.completedAt[id]);
      if(!Number.isFinite(ts))continue;
      const seen=out.completedAt[id];
      /* A real timestamp supersedes the unknown-time 0 marker; otherwise the
         earliest real completion is kept. */
      if(seen===undefined)out.completedAt[id]=ts;
      else if(seen===0)out.completedAt[id]=ts;
      else if(ts!==0)out.completedAt[id]=Math.min(seen,ts);
    }
  }
  /* The most recently touched record supplies the recent-topic order. */
  const recent=(incoming&&incoming.recent&&incoming.recent.length)?incoming.recent:((base&&base.recent)||[]);
  out.recent=recent.filter(x=>typeof x==='string'&&x).slice(0,STUDY_RECENT_LIMIT);
  out.done=Object.keys(out.completedAt).sort((a,b)=>(out.completedAt[a]-out.completedAt[b])||a.localeCompare(b));
  return out;
}

/** Re-read, merge, then persist. Returns the merged record actually stored. */
function writeStudy(state){
  const merged=mergeStudy(readStudy(),state);
  const store=studyStorage();
  if(store){
    try{store.setItem(STUDY_KEY,JSON.stringify(merged));}catch(err){/* storage denied: stay in-memory */}
  }
  study.v=merged.v;study.done=merged.done;study.completedAt=merged.completedAt;study.recent=merged.recent;
  return merged;
}

const study=readStudy();

function markComplete(id){
  if(!id)return;
  if(Object.prototype.hasOwnProperty.call(study.completedAt,id)&&study.completedAt[id])return;
  const next={...study,completedAt:{...study.completedAt,[id]:Date.now()}};
  writeStudy(next);
  buildMenu(UI.moduleSearch?UI.moduleSearch.value:'');
}
function noteRecent(id){
  if(!id)return;
  const next={...study,recent:[id,...study.recent.filter(x=>x!==id)].slice(0,STUDY_RECENT_LIMIT)};
  writeStudy(next);
}
/* Another tab wrote progress: adopt the union rather than keeping a stale view. */
try{
  if(typeof window!=='undefined'&&typeof window.addEventListener==='function'){
    window.addEventListener('storage',event=>{
      if(!event||event.key!==STUDY_KEY)return;
      const merged=mergeStudy(study,readStudy());
      study.done=merged.done;study.completedAt=merged.completedAt;study.recent=merged.recent;
      if(typeof buildMenu==='function')buildMenu(UI.moduleSearch?UI.moduleSearch.value:'');
    });
  }
}catch(err){}

/* A topic counts as worked through once the final frame is reached. */
const preStudyPaint=paint;
paint=function(){
  preStudyPaint();
  const frames=playerState.frames;
  if(frames.length>1&&playerState.frameIndex===frames.length-1&&playerState.currentModule){
    markComplete(playerState.currentModule.id);
  }
};
const preStudySelect=selectModule;
selectModule=function(id,options){
  preStudySelect(id,options);
  if(playerState.currentModule)noteRecent(playerState.currentModule.id);
};

/* Copy a link that reopens this topic with these inputs. */
(function shareLink(){
  const button=queryOne('#shareBtn');
  if(!button)return;
  button.addEventListener('click',()=>{
    const module=playerState.currentModule;
    if(!module)return;
    const values=readInputs();
    const query=(module.fields||[])
      .map(field=>`${encodeURIComponent(field.k)}=${encodeURIComponent(String(values[field.k]))}`)
      .join('&');
    const url=location.origin+location.pathname+'#'+encodeURIComponent(module.id)+(query?'?'+query:'');
    const announce=text=>{if(UI.status)UI.status.textContent=text;};
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url)
        .then(()=>announce('Share link copied to the clipboard'))
        .catch(()=>announce('Share link: '+url));
    }else{
      announce('Share link: '+url);
    }
  });
})();

const startupModule=resolveStartupModule();
/* If the opening link carried inputs, apply them before the first trace. */
function applySharedInputs(){
  /* AUD-07: delegates to the same allowlisted, validated path that
     same-document navigation uses, so a fresh load and a hashchange cannot
     drift apart. */
  if(!playerState.currentModule)return false;
  return applyRouteValues(playerState.currentModule.id,parseHash().values);
}
applyTextScale(persistedState.textScale||'100',false);
selectModule(startupModule,{persistPrevious:false,restore:true});
if(applySharedInputs())UI.status.textContent='Inputs restored from the shared link';
go();
function tracerStorageWritable(){
  try{const probe='comp2521-tracer:probe';localStorage.setItem(probe,'1');localStorage.removeItem(probe);return true;}
  catch(err){return false;}
}
/* The quick guide opens on request. First contact remains non-modal. */
if(tracerStorageWritable()&&!persistedState.tourDismissed){persistedState.tourDismissed=true;writeUiState();}

/* ============================================================
   MULTI-PAGE NAVIGATION LAYER
   Cross-page topic search, area switching and deep links.
   ============================================================ */
const ALL_TOPICS=Array.isArray(window.TRACER_TOPICS)?window.TRACER_TOPICS:[];
const ALL_AREAS=Array.isArray(window.TRACER_AREAS)?window.TRACER_AREAS:[];
const THIS_FILE=TRACER_PAGE.file||'';

/* ---------- area switcher in the drawer footer ---------- */
(function renderAreaNav(){
  const host=queryOne('#drawerAreas');
  if(!host||!ALL_AREAS.length)return;
  host.appendChild(createElement('div','areas-lead','Topic areas'));
  const list=createElement('div','areas-grid');
  ALL_AREAS.forEach(area=>{
    const link=createElement('a','arealink');
    link.href=area.file;
    if(area.file===THIS_FILE){link.setAttribute('aria-current','page');link.classList.add('here');}
    link.appendChild(createElement('span','al-name',area.title));
    link.appendChild(createElement('span','al-n',String(area.count)));
    list.appendChild(link);
  });
  host.appendChild(list);
  const home=createElement('a','arealink home','All 68 topics');
  home.href='index.html';
  host.appendChild(home);
})();

/* ---------- topic list, now aware of the other pages ---------- */
renderTopicList=function(shown,query){
  const currentId=playerState.currentModule&&playerState.currentModule.id;
  NAV.list.innerHTML='';
  const groups=[];
  shown.forEach(module=>{
    let group=groups.find(candidate=>candidate.name===module.group);
    if(!group){group={name:module.group,items:[]};groups.push(group);}
    group.items.push(module);
  });
  groups.forEach(group=>{
    const holdsCurrent=group.items.some(module=>module.id===currentId);
    const open=query?true:(openGroups.has(group.name)||holdsCurrent);
    const wrap=createElement('div','tgroup');
    wrap.dataset.open=open?'1':'0';
    const head=createElement('button','tgroup-h');
    head.type='button';head.setAttribute('aria-expanded',String(open));
    head.appendChild(caretSvg());
    head.appendChild(createElement('span','tg-name',group.name));
    head.appendChild(createElement('span','tg-n',String(group.items.length)));
    head.addEventListener('click',()=>{
      const next=wrap.dataset.open!=='1';
      wrap.dataset.open=next?'1':'0';head.setAttribute('aria-expanded',String(next));
      if(next)openGroups.add(group.name);else openGroups.delete(group.name);
    });
    wrap.appendChild(head);
    const body=createElement('div','tgroup-body');
    group.items.forEach(module=>{
      const item=createElement('button','titem');
      item.type='button';item.dataset.id=module.id;item.dataset.navKey=`local:${module.id}`;item.setAttribute('role','option');item.setAttribute('aria-selected','false');
      item.innerHTML=markMatch(module.name,query);
      item.title=`${module.group} \u203a ${module.name}`;
      if(module.id===currentId)item.setAttribute('aria-current','true');
      item.addEventListener('click',()=>activateTopic(module.id));
      body.appendChild(item);
    });
    wrap.appendChild(body);
    NAV.list.appendChild(wrap);
  });

  const elsewhere=query?ALL_TOPICS.filter(topic=>topic.p!==THIS_FILE&&`${topic.g} ${topic.n} ${topic.i} ${topic.k}`.toLowerCase().includes(query)):[];
  if(!shown.length&&!elsewhere.length){
    NAV.list.appendChild(createElement('div','drawer-empty',`Nothing matches "${query}". Clear the search to see all ${MODULES.length} topics on this page.`));
  }
  if(elsewhere.length){
    const wrap=createElement('div','tgroup crosspage');
    wrap.dataset.open='1';
    const head=createElement('div','tgroup-h static');
    head.appendChild(createElement('span','tg-name','On other pages'));
    head.appendChild(createElement('span','tg-n',String(elsewhere.length)));
    wrap.appendChild(head);
    const body=createElement('div','tgroup-body');
    elsewhere.slice(0,14).forEach(topic=>{
      const link=createElement('a','titem xlink');
      link.href=`${topic.p}#${topic.i}`;link.dataset.navKey=`page:${topic.p}#${topic.i}`;link.setAttribute('role','option');link.setAttribute('aria-selected','false');
      link.innerHTML=markMatch(topic.n,query);
      link.appendChild(createElement('span','x-area',topic.g));
      link.title=`Open ${topic.n} on the ${topic.g} page`;
      body.appendChild(link);
    });
    wrap.appendChild(body);
    NAV.list.appendChild(wrap);
  }

  const preferred=shown.find(module=>module.id===currentId)||shown[0];
  const firstElsewhere=NAV.list.querySelector('a.titem.xlink[data-nav-key]');
  const preferredKey=query
    ? (shown[0]?`local:${shown[0].id}`:(firstElsewhere&&firstElsewhere.dataset.navKey))
    : (preferred&&`local:${preferred.id}`);
  setCursor(preferredKey);
};

/* Count label reads against this page, not the whole course. */
buildMenu=function(filter=''){
  const shown=baseBuildMenu(filter);
  const query=String(filter||'').trim().toLowerCase();
  renderTopicList(shown,query);
  const elsewhere=query?ALL_TOPICS.filter(topic=>topic.p!==THIS_FILE&&`${topic.g} ${topic.n} ${topic.i} ${topic.k}`.toLowerCase().includes(query)).length:0;
  UI.moduleCount.textContent=query
    ? `${shown.length} here${elsewhere?` - ${elsewhere} elsewhere`:''}`
    : `${MODULES.length} topic${MODULES.length===1?'':'s'} on this page`;
  return shown;
};

/* ---------- deep links ---------- */
let suppressHashSync=false;
function writeHash(id){
  if(!id)return;
  try{
    suppressHashSync=true;
    history.replaceState(null,'',`#${id}`);
  }catch(err){
    location.hash=id;
  }finally{
    requestFrame(()=>{suppressHashSync=false;});
  }
}
const preHashSelectModule=selectModule;
selectModule=function(id,options={}){
  preHashSelectModule(id,options);
  if(playerState.currentModule)writeHash(playerState.currentModule.id);
};
window.addEventListener('hashchange',()=>{
  if(suppressHashSync)return;
  dispatchRoute(parseHash(),{source:'hashchange'});
});

/* ---------- page chrome ---------- */
(function labelPage(){
  const chip=queryOne('#areaChip');
  if(chip)chip.textContent=TRACER_PAGE.title||'';
  const drawerTitle=queryOne('#drawerTitle');
  if(drawerTitle)drawerTitle.textContent=TRACER_PAGE.title||'Topics';
  if(UI.moduleSearch){UI.moduleSearch.placeholder='Search this page, or all 68 topics\u2026';UI.moduleSearch.setAttribute('role','combobox');UI.moduleSearch.setAttribute('aria-autocomplete','list');UI.moduleSearch.setAttribute('aria-controls','topicList');UI.moduleSearch.setAttribute('aria-expanded','false');}
  NAV.list?.setAttribute('role','listbox');
})();

buildMenu('');
if(playerState.currentModule)writeHash(playerState.currentModule.id);

/* Completed topics get a tick in the drawer, and recent topics a jump list. */
const preStudyRenderTopicList=renderTopicList;
renderTopicList=function(shown,query){
  preStudyRenderTopicList(shown,query);
  NAV.list.querySelectorAll('.titem[data-id]').forEach(item=>{
    if(study.done.includes(item.dataset.id)){
      item.classList.add('done');
      if(!item.querySelector('.ti-done')){
        const tick=createElement('span','ti-done','\u2713');
        tick.setAttribute('aria-hidden','true');
        item.appendChild(tick);
        item.setAttribute('aria-label',`${item.textContent.trim()} (worked through)`);
      }
    }
  });
  if(query)return;
  const recent=study.recent.filter(id=>MODULES.some(m=>m.id===id)).slice(0,5);
  if(recent.length<2)return;
  const wrap=createElement('div','tgroup recent-group');
  wrap.dataset.open='1';
  const head=createElement('div','tgroup-h static');
  head.appendChild(createElement('span','tg-name','Recent'));
  head.appendChild(createElement('span','tg-n',String(recent.length)));
  wrap.appendChild(head);
  const body=createElement('div','tgroup-body');
  recent.forEach(id=>{
    const module=MODULES.find(m=>m.id===id);
    const item=createElement('button','titem',module.name);
    item.type='button';item.dataset.id=id;
    item.addEventListener('click',()=>activateTopic(id));
    body.appendChild(item);
  });
  wrap.appendChild(body);
  NAV.list.insertBefore(wrap,NAV.list.firstChild);
};
buildMenu(UI.moduleSearch?UI.moduleSearch.value:'');

/* ---------- live input validation ----------
   Validation previously ran only on Run, so a mistyped value looked accepted
   until the student pressed the button. The module's own run() is the
   authority: it is executed against the current values on a debounce and any
   InputValidationError is surfaced on the offending field immediately. The
   trace itself is never replaced by this check. */
(function liveValidation(){
  if(!UI.inputs)return;
  let timer=null;
  /* AUD-03: live validation used to execute the module's FULL run() against
     the current values - a complete trace generation - on a 450 ms debounce
     for every keystroke, and with no debounce at all on `change`. A debounce
     does not make a full generation cheap: with hamilton at nV=8 one such
     call produced 41,102 frames and drove RSS to ~272 MB, so simply typing in
     a field could stall the tab.

     It now calls the shared pure validator, which parses and range-checks the
     declared field domains and performs NO trace generation, NO DOM mutation
     and no search. Typing therefore triggers ZERO generations; exactly one
     generation happens when the student presses Run. Module-specific
     cross-field rules (for example "src must be a vertex of this graph") are
     still raised by run() at Run time with the same field keys. */
  function validateNow(){
    const module=playerState.currentModule;
    if(!module)return;
    let values;
    try{values=readInputs();}catch(err){return;}
    clearInputErrors();
    const result=validateModuleInputs(module,values);
    if(result.ok)return;
    const first=result.errors[0];
    markInputError(new InputValidationError(first.message,first.fieldKey));
    if(UI.status)UI.status.textContent=String(first.message);
  }
  UI.inputs.addEventListener('input',event=>{
    if(!event.target||!event.target.dataset||!event.target.dataset.k)return;
    if(timer!==null)clearTimeout(timer);
    /* The debounce now only coalesces cheap checks while a value is in flux. */
    timer=setTimeout(()=>{timer=null;validateNow();},200);
  });
  /* NEW-16. Lowering nV used to leave a vertex-target field pointing at a
     vertex that no longer exists, so the next Run failed with "dest must be a
     vertex of this graph" and the student had to work out which other field to
     change. The stale value is the thing to fix, not the message.

     Only a COMMITTED nV edit clamps (the `change` event: blur, Enter, or the
     stepper). Clamping on `input` would be destructive - while someone types
     "12" the field reads "1" for one keystroke, and dest would be driven to 0
     and never restored. Only values ABOVE the new maximum move: a negative is
     a typo rather than a consequence of lowering nV, so validation still
     reports it, and raising nV never moves a field the student chose. run()
     stays the authority for route-supplied and programmatic values. */
  function clampVertexTargets(){
    const module=playerState.currentModule;
    if(!module||typeof vertexTargetFields!=='function')return;
    const keys=vertexTargetFields(module.id);
    if(!keys.length)return;
    const nVControl=UI.inputs.querySelector('[data-k="nV"]');
    if(!nVControl)return;
    const nV=Number.parseInt(String(nVControl.value).trim(),10);
    if(!Number.isFinite(nV)||nV<1)return;          /* invalid nV: let validation speak */
    const maxVertex=nV-1;
    const moved=[];
    keys.forEach(k=>{
      const control=UI.inputs.querySelector('[data-k="'+k+'"]');
      if(!control)return;
      const current=Number.parseInt(String(control.value).trim(),10);
      if(!Number.isFinite(current)||current<=maxVertex)return;
      control.value=String(maxVertex);
      moved.push(k);
    });
    if(!moved.length)return;
    if(UI.status){
      UI.status.textContent=moved.join(' and ')+
        (moved.length>1?' were':' was')+' lowered to '+maxVertex+
        ', the highest vertex in a '+nV+'-vertex graph.';
    }
    return moved;
  }

  UI.inputs.addEventListener('change',event=>{
    if(!(event.target&&event.target.dataset&&event.target.dataset.k))return;
    const moved=event.target.dataset.k==='nV'?clampVertexTargets():null;
    validateNow();
    /* The clamp notice is the useful message, and validateNow() clears the
       status only when it finds nothing wrong, so restore it after. */
    if(moved&&moved.length&&UI.status&&!UI.status.textContent){
      UI.status.textContent=moved.join(' and ')+' lowered to stay a vertex of the graph.';
    }
  });
  if(window.COMP2521TracerTestAPI)window.COMP2521TracerTestAPI.clampVertexTargets=clampVertexTargets;
})();
