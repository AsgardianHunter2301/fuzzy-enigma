"use strict";
/* COMP2521 Tracer v6.4.1 language and presentation adapter.
   It does not change trace generators, source blocks or frame data. */
(function compactAsciiUi(){
  if(typeof paint!=='function'||typeof selectModule!=='function')return;

  const replacements = new Map([
    ['\u00a0',' '],['\u2018',"'"],['\u2019',"'"],['\u201c','"'],['\u201d','"'],
    ['\u2013','-'],['\u2014','-'],['\u2212','-'],['\u2026','...'],['\u00b7','|'],
    ['\u2190','<-'],['\u2192','->'],['\u2191','up'],['\u2193','down'],['\u21d2','=>'],
    ['\u2264','<='],['\u2265','>='],['\u2260','!='],['\u00d7','x'],['\u00f7','/'],
    ['\u221e','infinity'],['\u2205','empty set'],['\u2208','in'],['\u2209','not in'],
    ['\u2248','about'],['\u2126','Omega'],['\u03a9','Omega'],['\u0398','Theta'],['\u03c6','phi'],
    ['\u25b2','alloc'],['\u25bc','free'],
    ['\u25c6','realloc'],['\u25c7','end'],['\u21b5','Enter']
  ]);
  /* L-02: one regex pass over the replacement set instead of 38 split/join
     passes, plus a bounded cache. Repeat text (labels, notes, step summaries)
     is re-normalised on every paint, so the cache does most of the work. */
  const replacementPattern=new RegExp('['+[...replacements.keys()].join('')+']','g');

  /* ---------- AUD-08: preserve mathematical structure ----------
     asciiText used to call String.normalize('NFKD') FIRST. NFKD applies
     *compatibility* decomposition, which folds the superscript characters to
     their plain digits before any replacement runs: U+00B2 became "2", U+207F
     became "n". So the map entries that were supposed to produce "^2" and
     "^3" were unreachable dead code, and the rendered complexity notation
     silently lost its exponent: O(n^2) was displayed as O(n2), O(2^n) as
     O(2n) and n^3 as n3. That is not a cosmetic defect - it changes the
     mathematics a student reads.

     The fix translates superscript and subscript RUNS into explicit ASCII
     mathematical notation BEFORE any destructive normalisation, so the
     structure is carried rather than flattened. A multi-character run is
     bracketed, because n^(i+1) and n^i+1 are different expressions. */
  const SUPERSCRIPT_ASCII=new Map([
    ['⁰','0'],['¹','1'],['²','2'],['³','3'],['⁴','4'],
    ['⁵','5'],['⁶','6'],['⁷','7'],['⁸','8'],['⁹','9'],
    ['ⁿ','n'],['ⁱ','i'],['ᵏ','k'],['⁺','+'],['⁻','-'],
    ['⁼','='],['⁽','('],['⁾',')']
  ]);
  const SUBSCRIPT_ASCII=new Map([
    ['₀','0'],['₁','1'],['₂','2'],['₃','3'],['₄','4'],
    ['₅','5'],['₆','6'],['₇','7'],['₈','8'],['₉','9'],
    ['ₙ','n'],['ᵢ','i'],['₊','+'],['₋','-'],
    ['₌','='],['₍','('],['₎',')']
  ]);
  const SUPERSCRIPT_RUN=new RegExp('['+[...SUPERSCRIPT_ASCII.keys()].join('')+']+','g');
  const SUBSCRIPT_RUN=new RegExp('['+[...SUBSCRIPT_ASCII.keys()].join('')+']+','g');
  function expandRun(run,table,marker){
    let ascii='';
    for(const ch of run)ascii+=table.get(ch)||'';
    if(!ascii)return run;
    return ascii.length>1?marker+'('+ascii+')':marker+ascii;
  }
  function preserveMathStructure(text){
    return text
      .replace(SUPERSCRIPT_RUN,run=>expandRun(run,SUPERSCRIPT_ASCII,'^'))
      .replace(SUBSCRIPT_RUN,run=>expandRun(run,SUBSCRIPT_ASCII,'_'));
  }
  const asciiCache=new Map();
  const ASCII_CACHE_LIMIT=4096;
  const contentCache=new Map();
  /**
   * @param {*} value
   * @param {boolean} [preserveUnmapped]
   *   When true the final catch-all is NOT applied, so a character this
   *   adapter has no ASCII equivalent for is left as itself instead of
   *   becoming "?". Learning content (step notes, variables, the source
   *   mapping, tallies) uses this mode: turning an unrecognised mathematical
   *   symbol into a question mark destroys meaning, whereas navigation
   *   chrome genuinely wants a strict ASCII label.
   */
  function asciiText(value,preserveUnmapped){
    const key=String(value==null?'':value);
    const cache=preserveUnmapped?contentCache:asciiCache;
    const cached=cache.get(key);
    if(cached!==undefined)return cached;
    /* Mathematical structure first: NFKD below would otherwise flatten it. */
    let text=preserveMathStructure(key);
    text=text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
    text=text.replace(replacementPattern,ch=>replacements.get(ch));
    if(!preserveUnmapped)text=text.replace(/[^\x09\x0a\x0d\x20-\x7e]/g,'?');
    if(cache.size>=ASCII_CACHE_LIMIT)cache.clear();
    cache.set(key,text);
    return text;
  }
  function normaliseTextNodes(root,skipSelector='',preserveUnmapped=false){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];let node;
    while((node=walker.nextNode()))nodes.push(node);
    nodes.forEach(textNode=>{
      const parent=textNode.parentElement;
      if(parent&&skipSelector&&parent.closest(skipSelector))return;
      const next=asciiText(textNode.nodeValue,preserveUnmapped);
      if(next!==textNode.nodeValue)textNode.nodeValue=next;
    });
  }
  function compactMapping(){
    if(!UI.map)return;
    const provenance=UI.map.querySelector('.provenance');
    if(provenance){
      if(provenance.classList.contains('manual'))provenance.textContent='Manual source';
      else if(provenance.classList.contains('mixed'))provenance.textContent='Manual, lecture and memorised C';
      /* P1-01: a concept or problem statement is not something to memorise as C. */
      else if(provenance.classList.contains('concept'))provenance.textContent='Concept - no C is defined for this line';
      else provenance.textContent='Supplemental: not in the manual or lecture';
    }
    const gap=UI.map.querySelector('.gap');
    if(gap&&gap.classList.contains('concept-gap'))gap.textContent='This line states a concept or problem statement. No C corresponds to it.';
    else if(gap)gap.textContent='No exact C is supplied for this line.';
    const bridge=UI.map.querySelector('.to');
    if(bridge)bridge.textContent='to';
    const why=[...UI.map.querySelectorAll('.why')];
    if(why.length){
      if(provenance&&provenance.classList.contains('manual'))why[0].textContent='The manual gives this line as pseudocode, not C.';
      else if(provenance&&provenance.classList.contains('mixed'))why[0].textContent='The source and the memorised bridge are shown separately.';
      else if(provenance&&provenance.classList.contains('concept'))why[0].textContent='The implementation appears in the other source blocks for this topic.';
      else if(gap&&/pseudocode/i.test(gap.textContent))why[0].textContent='The source gives pseudocode, not C.';
      else why[0].textContent='Source boundary is shown below.';
    }
    if(why.length>1){
      const extra=why.slice(1);
      const details=document.createElement('details');
      details.className='compact-context';
      const summary=document.createElement('summary');
      summary.textContent='More context';
      details.appendChild(summary);
      extra.forEach(item=>details.appendChild(item));
      UI.map.appendChild(details);
    }
  }
  function compactSourceWarning(){
    UI.code?.querySelectorAll('.memnotice').forEach(node=>{
      /* CUR-MOD-02: compact form of the corrected notice. */
      node.innerHTML='<b>Supplemental.</b> Not in the manual or lecture. Shown for reference and comparison.';
    });
  }
  function normaliseCurrentUi(){
    /* AUD-08: separate learning content from navigation chrome. The step
       note, variable panel, source mapping and tallies carry mathematics and
       are normalised non-destructively; breadcrumbs, badges and status text
       are navigation labels and keep the strict ASCII treatment. */
    const contentRegions=[UI.note,UI.vars,UI.memorySummary,UI.tally,UI.memev,UI.map];
    const navigationRegions=[UI.srcName,UI.srcTag,UI.vizName,UI.viewBadge,UI.moduleStatus,document.querySelector('#crumb'),document.querySelector('#status')];
    contentRegions.forEach(region=>normaliseTextNodes(region,'.ps,.cc,.cline,.viz,svg',true));
    navigationRegions.forEach(region=>normaliseTextNodes(region,'.ps,.cc,.cline,.viz,svg'));
    normaliseTextNodes(UI.viz?.querySelector('.legend-panel'));
    compactMapping();
    if(UI.moduleStatus){UI.moduleStatus.textContent='';UI.moduleStatus.hidden=true;}
    const output=document.querySelector('#speedStatus');
    if(output)output.textContent=asciiText(output.textContent).replace(/\s*\|\s*/g,' | ');
  }
  const basePaintV6=paint;
  paint=function(){basePaintV6();normaliseCurrentUi();};
  const baseSelectV6=selectModule;
  selectModule=function(id,options={}){
    baseSelectV6(id,options);
    compactSourceWarning();
    normaliseTextNodes(UI.code,'.cline .t,.ps,.cc');
    normaliseTextNodes(UI.inputs);
    const fieldLabels={nV:'vertices (nV)',src:'start (src)',dest:'target (dest)',study:'show mapping for'};
    UI.inputs.querySelectorAll('.field').forEach(field=>{
      const key=field.dataset.fieldKey;
      const label=field.querySelector('label');
      if(label&&fieldLabels[key])label.textContent=fieldLabels[key];
    });
    normaliseTextNodes(document.querySelector('#crumb'));
    [...UI.op.options].forEach(option=>{option.textContent=asciiText(option.textContent);});
    normaliseCurrentUi();
  };
  const baseBuildMenuV6=buildMenu;
  buildMenu=function(filter=''){
    const result=baseBuildMenuV6(filter);
    normaliseTextNodes(document.querySelector('#topicList'));
    normaliseTextNodes(document.querySelector('#drawerAreas'));
    [...UI.op.options].forEach(option=>{option.textContent=asciiText(option.textContent);});
    return result;
  };

  SOURCE_LABEL.manual='26T2 manual';
  SOURCE_LABEL.lecture='25T3 lecture';
  SOURCE_LABEL.memorise='Memorise: not source';
  SOURCE_LABEL.coverage='Coverage';
  if(Array.isArray(TOUR_STEPS)){
    TOUR_STEPS.length=0;
    TOUR_STEPS.push(
      {title:'Find a topic',body:'Open <code>Topics</code>. Search by name or keyword. Use Up, Down and Enter.'},
      {title:'Run a trace',body:'Set the inputs and press <code>Run</code>. Invalid values are marked beside the field.'},
      {title:'Follow each step',body:'Use the buttons, timeline or keyboard. Source, trace and state stay in sync.'},
      {title:'Check source and memory',body:'The source line, variables and memory update at each real step. Memorise blocks are not course source.'}
    );
  }
  const originalRenderTour=renderTour;
  renderTour=function(){originalRenderTour();normaliseTextNodes(UI.tourDialog);};
  const originalUpdateStatus=updateModuleStatus;
  updateModuleStatus=function(){originalUpdateStatus();normaliseCurrentUi();};


  function normaliseDialogSoon(selector){
    requestAnimationFrame(()=>requestAnimationFrame(()=>normaliseTextNodes(document.querySelector(selector),'.ps,.cc,.cline,.viz,svg')));
  }
  document.querySelector('#labBtn')?.addEventListener('click',()=>normaliseDialogSoon('#labDialog'));
  document.querySelector('#stepsBtn')?.addEventListener('click',()=>normaliseDialogSoon('#stepDialog'));
  document.querySelector('#sourcesBtn')?.addEventListener('click',()=>normaliseDialogSoon('#sourcesDialog'));
  document.querySelector('#topicsBtn')?.addEventListener('click',()=>normaliseDialogSoon('#topicDrawer'));
  document.querySelector('#speed')?.addEventListener('change',()=>requestAnimationFrame(normaliseCurrentUi));
  const statusNode=document.querySelector('#status');
  if(statusNode){new MutationObserver(()=>normaliseTextNodes(statusNode)).observe(statusNode,{childList:true,subtree:true,characterData:true});}
  document.documentElement.dataset.uiVersion='6.4.1';
  compactSourceWarning();
  normaliseTextNodes(document.querySelector('#topicDrawer'));
  normaliseTextNodes(document.querySelector('#sourcesDialog'));
  normaliseTextNodes(document.querySelector('#labDialog'));
  normaliseTextNodes(document.querySelector('#stepDialog'));
  normaliseTextNodes(document.querySelector('#tourDialog'));
  normaliseCurrentUi();
  window.COMP2521TracerUiV6=Object.freeze({version:'6.4.1',asciiText,normaliseCurrentUi});
})();
