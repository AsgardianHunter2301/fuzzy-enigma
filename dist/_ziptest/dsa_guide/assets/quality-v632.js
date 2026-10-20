"use strict";
/* COMP2521 Tracer v6.3.2 classroom quality layer.
   Installed last. It adds progressive disclosure, contextual help, concise
   announcements and audit guards without changing course source or trace data. */
(function(){
  if(window.COMP2521QualityV632)return;
  const install=window.COMP2521InstallUiLayer||function(name,targets,fn){fn();return true;};
  install('quality-v632',['go','paint','markInputError','clearInputErrors','topic drawer'],function(){
    const whyById=Object.freeze({
      sel:'Each pass fixes the next array position by selecting the smallest remaining item.',
      bub:'Adjacent swaps move larger items right. A pass with no swaps proves the array is sorted.',
      ins:'The sorted prefix grows one item at a time by shifting larger items right.',
      ms:'Each half is sorted recursively, then two sorted ranges are merged in order.',
      qs:'Partition places the pivot between values on its two sides, then recursion sorts each side.',
      q3:'Median-of-three changes pivot choice; partition and recursive subproblems remain the core method.',
      radix:'Stable bucket passes from the last symbol to the first preserve earlier ordering decisions.',
      bfs:'The queue explores vertices in increasing edge distance from the start.',
      dfs:'Recursion or an explicit stack follows one path deeply, then backtracks.',
      cycleu:'Tracking the previous vertex avoids treating one undirected edge as a cycle.',
      cycled:'A directed back edge forms a cycle only when it points to a vertex still on the recursion stack.',
      dijkstra:'The smallest unsettled distance is chosen next; non-negative weights make that distance final.',
      kruskal:'Edges are considered from lightest to heaviest and accepted only when they do not form a cycle.',
      prim:'The tree grows through the lightest edge crossing from used to unused vertices.',
      hash:'The hash selects a slot; collision handling preserves access to keys that share that slot.',
      pq:'The heap property keeps the highest-priority item at index 1 while fix-up and fix-down restore order.',
      avlins:'Insertion follows BST order, then rotations restore the AVL balance bound on the return path.',
      avldel:'Deletion follows BST rules, then every affected ancestor is rebalanced on the return path.',
      trie:'Each character chooses one child pointer, so a key is represented by a root-to-finish path.'
    });
    function plain(value){
      const node=document.createElement('div');node.innerHTML=String(value||'');const text=(node.textContent||'').replace(/\s+/g,' ').trim();return window.COMP2521TracerUiV6?window.COMP2521TracerUiV6.asciiText(text):text;
    }
    function sourceScope(module){
      const blocks=module&&module.blocks||[];
      const labels=[];
      if(blocks.some(block=>(block.source||'manual')==='manual'&&!block.pseudo))labels.push('exact manual C');
      if(blocks.some(block=>(block.source||'manual')==='manual'&&block.pseudo))labels.push('manual pseudocode');
      if(blocks.some(block=>block.source==='lecture'&&!block.pseudo))labels.push('lecture C');
      if(blocks.some(block=>block.source==='lecture'&&block.pseudo))labels.push('lecture pseudocode or concept');
      if(blocks.some(block=>block.source==='memorise'))labels.push('supplemental C to learn separately');
      if(blocks.some(block=>block.source==='coverage'))labels.push('coverage only');
      return labels.length?labels.join('; '):'source type not declared';
    }

    /* Visible validation summary, in addition to the field-level error. */
    const toolbar=document.querySelector('.toolbar');
    const errorBanner=document.createElement('div');
    errorBanner.id='inputErrorBanner';errorBanner.className='input-error-banner';errorBanner.hidden=true;
    errorBanner.setAttribute('role','alert');errorBanner.setAttribute('aria-atomic','true');
    toolbar?.insertAdjacentElement('afterend',errorBanner);
    const hideInputBanner=()=>{errorBanner.hidden=true;errorBanner.textContent='';};
    const baseClearInputErrors=clearInputErrors;
    clearInputErrors=function(){baseClearInputErrors();hideInputBanner();};
    const baseMarkInputError=markInputError;
    markInputError=function(error){
      baseMarkInputError(error);
      const field=UI.inputs.querySelector('.field.invalid label')?.textContent?.trim();
      errorBanner.textContent=`Check ${field||'the input'}: ${String(error&&error.message||error)}`;
      errorBanner.hidden=false;
    };
    UI.inputs.addEventListener('input',()=>requestFrame(()=>{if(!UI.inputs.querySelector('.field.invalid'))hideInputBanner();}));

    /* Progressive disclosure: secondary inspection controls appear after a successful explicit run. */
    const disclosureKey='progressiveDisclosureDone';
    function disclosurePending(){return !persistedState[disclosureKey];}
    function prepareDisclosure(){
      if(!disclosurePending())return;
      document.documentElement.classList.add('pretrace');
      if(typeof narrow==='function'&&!narrow()&&typeof LAYOUT==='object'&&!LAYOUT.collapsed.state){
        LAYOUT.collapsed.state=true;applyLayout();
      }
    }
    function revealDisclosure(){
      if(!disclosurePending())return;
      document.documentElement.classList.remove('pretrace');
      if(typeof narrow==='function'&&!narrow()&&typeof LAYOUT==='object'&&LAYOUT.collapsed.state){
        LAYOUT.collapsed.state=false;applyLayout();
      }
      persistedState[disclosureKey]=true;writeUiState();
      UI.status.textContent='Trace ready. State and view tools are now available.';
    }
    prepareDisclosure();
    const baseGoQuality=go;
    go=function(){
      const result=baseGoQuality.apply(this,arguments);
      requestFrame(()=>{
        const invalid=UI.inputs.querySelector('[aria-invalid="true"]');
        if(!invalid&&playerState.frames.length)revealDisclosure();
      });
      return result;
    };
    UI.run.onclick=go;

    /* One concise live announcement replaces per-event memory chatter. */
    UI.memev?.removeAttribute('role');UI.memev?.removeAttribute('aria-live');
    const announcer=document.createElement('div');
    announcer.id='traceAnnouncement';announcer.className='sr-only';announcer.setAttribute('role','status');
    announcer.setAttribute('aria-live','polite');announcer.setAttribute('aria-atomic','true');
    document.querySelector('.transport')?.appendChild(announcer);
    let announcedKey='';
    function announceFrame(){
      const frame=playerState.frames[playerState.frameIndex];
      const key=`${playerState.currentModule?.id||''}:${playerState.frameIndex}:${playerState.frames.length}`;
      if(!frame||key===announcedKey)return;announcedKey=key;
      const note=plain(frame.note).slice(0,180);
      announcer.textContent=`Step ${playerState.frameIndex+1} of ${playerState.frames.length}. ${note}`;
      UI.scrub.setAttribute('aria-valuetext',`Step ${playerState.frameIndex+1} of ${playerState.frames.length}`);
    }

    /* Persistent topic help stays inside the workspace instead of opening another modal. */
    const helpButton=document.createElement('button');
    helpButton.id='contextHelpBtn';helpButton.className='btn context-help';helpButton.type='button';helpButton.textContent='?';
    helpButton.title='Show help for the current topic';helpButton.setAttribute('aria-label','Show help for the current topic');
    helpButton.setAttribute('aria-controls','contextHelpPanel');helpButton.setAttribute('aria-expanded','false');
    const stepsButton=document.querySelector('#stepsBtn');stepsButton?.insertAdjacentElement('afterend',helpButton);
    const helpPanel=document.createElement('aside');
    helpPanel.id='contextHelpPanel';helpPanel.className='context-help-panel';helpPanel.hidden=true;
    helpPanel.setAttribute('aria-labelledby','contextHelpTitle');
    helpPanel.innerHTML='<div class="context-help-head"><div><span class="context-help-kicker">Current topic</span><h3 id="contextHelpTitle">Topic help</h3></div><button class="btn context-help-close" id="contextHelpClose" type="button" aria-label="Close topic help">Close</button></div><div class="context-help-body" id="contextHelpBody"></div>';
    document.querySelector('.pane-viz .stage')?.insertBefore(helpPanel,UI.viz);
    const helpBody=helpPanel.querySelector('#contextHelpBody');
    function updateHelp(){
      const module=playerState.currentModule;if(!module)return;
      const frame=playerState.frames[playerState.frameIndex];
      const focus=whyById[module.id]||plain(module.note)||'Compare the highlighted source line with the change in Trace and State.';
      const current=frame?plain(frame.note):'The default inputs are ready. Press Run to build the trace.';
      helpPanel.querySelector('#contextHelpTitle').textContent=module.name;
      helpBody.innerHTML='';
      const sections=[
        ['Study focus',focus],
        ['Current step',current],
        ['Source boundary',sourceScope(module)],
        ['Controls','Use Left and Right to step, Space to play, and Timeline to jump. Source, Trace and State stay synchronised.']
      ];
      sections.forEach(([heading,body])=>{const h=document.createElement('h4');h.textContent=heading;const p=document.createElement('p');p.textContent=body;helpBody.append(h,p);});
    }
    function closeContextHelp({focus=false}={}){helpPanel.hidden=true;helpButton.setAttribute('aria-expanded','false');if(focus)helpButton.focus();}
    function openContextHelp(){updateHelp();helpPanel.hidden=false;helpButton.setAttribute('aria-expanded','true');helpPanel.querySelector('#contextHelpTitle')?.focus?.();return true;}
    function toggleContextHelp(){if(helpPanel.hidden)return openContextHelp();closeContextHelp({focus:true});return false;}
    helpButton.addEventListener('click',toggleContextHelp);
    helpPanel.querySelector('#contextHelpClose').addEventListener('click',()=>closeContextHelp({focus:true}));
    document.addEventListener('keydown',event=>{
      const target=event.target;
      if(event.key==='Escape'&&!helpPanel.hidden){event.preventDefault();closeContextHelp({focus:true});return;}
      if(event.key!=='?'||event.metaKey||event.ctrlKey||event.altKey)return;
      if(target instanceof Element&&target.closest('input,textarea,select,[contenteditable="true"]'))return;
      if(openDialogOtherThan(null))return;
      event.preventDefault();event.stopImmediatePropagation();toggleContextHelp();
    },true);

    /* A visible text affordance for the otherwise icon-free trace slider. */
    const timelineLabel=document.createElement('span');timelineLabel.className='timeline-label';timelineLabel.textContent='Timeline';
    document.querySelector('.scrub-wrap')?.insertAdjacentElement('beforebegin',timelineLabel);

    /* Set expectations before a student opens a coverage-only topic. */
    function markNamedOnly(){
      document.querySelectorAll('[data-id="namedalgos"],a[href$="#namedalgos"]').forEach(item=>{
        if(item.querySelector('.named-only-tag'))return;
        const tag=document.createElement('span');tag.className='named-only-tag';tag.textContent='Named only';item.appendChild(tag);
        const name=(item.getAttribute('aria-label')||item.textContent||'').replace(/\s+/g,' ').trim();
        item.setAttribute('aria-label',`${name} (named only; no trace)`);
      });
    }
    const topicList=document.querySelector('#topicList');
    if(topicList){new MutationObserver(markNamedOnly).observe(topicList,{childList:true,subtree:true});markNamedOnly();}

    /* Put area navigation before the long topic list on short viewports. */
    const drawerAreas=document.querySelector('#drawerAreas'),topicListNode=document.querySelector('#topicList');
    if(drawerAreas&&topicListNode)topicListNode.parentNode.insertBefore(drawerAreas,topicListNode);

    /* Clear labels replace terse control fragments. */
    const friendlyViews=Object.freeze({
      none:'Run to view',array:'Array',linked:'Linked list',tree:'Tree',trie:'Trie',hash:'Hash table',hashopen:'Open addressing',heap:'Priority queue',intheap:'Heap',graph:'Graph',multi:'Combined view',reference:'Reference',callstack:'Call stack',adjlist:'Adjacency list',edgearray:'Edge array',matrix2d:'Matrix',stack2:'Stack'
    });
    function setText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
    function normaliseControlLabels(){
      const appTools=document.querySelector('#moreBtn'),inputTools=document.querySelector('#moreRunBtn');
      setText(appTools,'Tools');setText(inputTools,'Input tools');
      if(appTools){appTools.title='Open application tools';appTools.setAttribute('aria-label','Open application tools');}
      if(inputTools){inputTools.title='Open input tools';inputTools.setAttribute('aria-label','Open input tools');}
      const kind=UI.viewBadge?.dataset.kind||'none';
      if(UI.viewBadge)setText(UI.viewBadge,friendlyViews[kind]||`${kind.replace(/[-_]/g,' ')} view`);
      const lock=document.querySelector('#zoomLock'),lockLabel=document.querySelector('#zoomLockLabel');
      if(lockLabel)setText(lockLabel,lock?.getAttribute('aria-pressed')==='true'?'Pan locked':'Pan unlocked');
      const zoomLevel=document.querySelector('#zoomLevel');
      if(zoomLevel){const match=zoomLevel.textContent.match(/\d+%/);setText(zoomLevel,`Zoom ${match?match[0]:'100%'}`);}
      const fit=document.querySelector('#zoomFit');if(fit)setText(fit,'Fit view');
    }

    /* A useful first screen replaces empty variables, memory and no-view language. */
    function renderStartState(){
      if(!UI.viz||playerState.frames.length)return;
      const module=playerState.currentModule;
      UI.viz.innerHTML='';
      const card=document.createElement('section');card.className='trace-start-card';card.setAttribute('aria-labelledby','traceStartTitle');
      const kicker=document.createElement('div');kicker.className='trace-start-kicker';kicker.textContent='Ready to trace';
      const title=document.createElement('h3');title.id='traceStartTitle';title.textContent=module?module.name:'Choose a topic';
      const body=document.createElement('p');body.textContent=module?'Default example inputs are ready. Review them or start the trace now.':'Open Topics and choose an item.';
      const steps=document.createElement('ol');
      ['Review the inputs.','Run the trace.','Use the timeline or arrow keys to inspect each exact step.'].forEach(value=>{const item=document.createElement('li');item.textContent=value;steps.appendChild(item);});
      const run=document.createElement('button');run.className='btn go start-trace';run.type='button';run.textContent='Run example';run.disabled=!module;run.addEventListener('click',()=>go());
      card.append(kicker,title,body,steps,run);UI.viz.appendChild(card);
      if(UI.note&&!UI.inputs.querySelector('[aria-invalid="true"]'))UI.note.textContent='The default inputs are ready. Run the example or edit the values first.';
      if(UI.vizName)UI.vizName.textContent='';
      if(UI.viewBadge){UI.viewBadge.dataset.kind='none';UI.viewBadge.textContent='Run to view';}
    }

    /* Visible, non-blocking progress for the short trace-build interval. */
    const progress=document.createElement('div');progress.id='traceBuildProgress';progress.className='trace-build-progress';progress.hidden=true;
    progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');
    progress.innerHTML='<span class="trace-progress-bar" aria-hidden="true"><span></span></span><span>Building trace...</span>';
    errorBanner.insertAdjacentElement('afterend',progress);
    const baseSetBusyQuality=setBusy;
    setBusy=function(on){
      baseSetBusyQuality(on);progress.hidden=!on;setText(UI.run,on?'Building...':'Run');
    };

    /* A small classroom self-check confirms the bundled runtime without shipping the assurance suite. */
    const toolsMenu=document.querySelector('#moreMenu');
    const selfCheckButton=document.createElement('button');selfCheckButton.id='selfCheckBtn';selfCheckButton.className='btn';selfCheckButton.type='button';
    selfCheckButton.setAttribute('role','menuitem');selfCheckButton.textContent='System check';selfCheckButton.title='Check the bundled tracer runtime';
    toolsMenu?.appendChild(selfCheckButton);
    const sourcesBody=document.querySelector('#sourcesDialog .tour-body');
    const selfCheckSection=document.createElement('section');selfCheckSection.className='self-check-section';
    selfCheckSection.innerHTML='<h3>Offline system check</h3><p>Checks the bundled core, topic registry, renderers, local assets and current topic. This is a classroom smoke check, not the full assurance suite.</p><button class="btn" id="runSelfCheck" type="button">Run system check</button><div id="selfCheckSummary" class="self-check-summary" role="status" aria-live="polite"></div><ul id="selfCheckResults" class="self-check-results"></ul>';
    sourcesBody?.appendChild(selfCheckSection);
    function runClassroomSelfCheck(){
      const checks=[];const add=(name,passed,detail='')=>checks.push({name,passed:!!passed,detail:String(detail||'')});
      add('Core tracer is bundled',typeof Trace==='function'&&typeof playerState==='object','assets/tracer-core.js');
      add('All 68 topics are indexed',Array.isArray(window.TRACER_TOPICS)&&window.TRACER_TOPICS.length===68,Array.isArray(window.TRACER_TOPICS)?`${window.TRACER_TOPICS.length} topics`:'topic index missing');
      add('This page loaded its topic modules',Array.isArray(MODULES)&&MODULES.length>0,Array.isArray(MODULES)?`${MODULES.length} page topics`:'module registry missing');
      const required=['array','linked','tree','trie','hash','heap','graph','multi','reference','adjlist','edgearray','matrix2d'];
      const missingRenderers=required.filter(kind=>typeof RENDER?.[kind]!=='function');add('Required renderers are ready',missingRenderers.length===0,missingRenderers.join(', '));
      const externalRuntime=[...document.querySelectorAll('script[src],link[rel="stylesheet"][href]')].map(node=>node.getAttribute(node.tagName==='SCRIPT'?'src':'href')).filter(value=>/^https?:/i.test(value||''));
      add('Runtime assets are local',externalRuntime.length===0,externalRuntime.join(', '));
      const module=playerState.currentModule;
      try{
        const values=Object.fromEntries((module?.fields||[]).map(field=>[field.k,String(field.def??'')]));
        const trace=module?.run(values);add('Current topic builds a trace',!!trace&&Array.isArray(trace.f)&&trace.f.length>0,trace?.f?`${trace.f.length} steps`:'no frame array');
      }catch(error){add('Current topic builds a trace',false,error&&error.message||error);}
      const sourceKinds=new Set(['manual','lecture','memorise','coverage']);
      const badBlocks=(module?.blocks||[]).filter(block=>!sourceKinds.has(block.source||'manual'));
      add('Current topic source labels are declared',badBlocks.length===0,badBlocks.map(block=>block.title).join(', '));
      const list=document.querySelector('#selfCheckResults'),summary=document.querySelector('#selfCheckSummary');if(list){list.innerHTML='';checks.forEach(check=>{const item=document.createElement('li');item.className=check.passed?'pass':'fail';item.textContent=`${check.name}${check.detail?`: ${check.detail}`:''}`;list.appendChild(item);});}
      const passed=checks.filter(check=>check.passed).length;if(summary)summary.textContent=`${passed} of ${checks.length} checks passed.`;
      window.COMP2521ClassroomSelfCheck=Object.freeze({passed:passed===checks.length,checks:checks.map(check=>({...check}))});
      return window.COMP2521ClassroomSelfCheck;
    }
    document.querySelector('#runSelfCheck')?.addEventListener('click',runClassroomSelfCheck);
    selfCheckButton.addEventListener('click',()=>{if(typeof openSources==='function')openSources();requestFrame(runClassroomSelfCheck);});

    /* Build metadata belongs in Sources/About, not the learning surface. */
    if(UI.buildVersion)UI.buildVersion.hidden=true;
    if(UI.moduleStatus){UI.moduleStatus.textContent='';UI.moduleStatus.hidden=true;}

    const basePaintQuality=paint;
    paint=function(){
      basePaintQuality();
      if(UI.moduleStatus){UI.moduleStatus.textContent='';UI.moduleStatus.hidden=true;}
      normaliseControlLabels();
      if(playerState.frames.length===0)renderStartState();
      if(!helpPanel.hidden)updateHelp();
      announceFrame();
    };
    ['#zoomLock','#zoomOut','#zoomReset','#zoomIn','#zoomFit'].forEach(selector=>document.querySelector(selector)?.addEventListener('click',()=>requestFrame(normaliseControlLabels)));

    window.COMP2521QualityV632=Object.freeze({
      version:'6.3.2',
      openContextHelp,
      closeContextHelp,
      runClassroomSelfCheck,
      renderStartState,
      revealDisclosure,
      layerRegistry:window.COMP2521UiLayerRegistry
    });
    if(window.COMP2521TracerTestAPI){
      window.COMP2521QualityTestAPI=Object.freeze({
        disclosurePending,
        inputBanner(){return {hidden:errorBanner.hidden,text:errorBanner.textContent};},
        namedOnlyCount(){markNamedOnly();return document.querySelectorAll('.named-only-tag').length;},
        layerNames(){return (window.COMP2521UiLayerRegistry||[]).map(layer=>layer.name);},
        startState(){return {visible:!!document.querySelector('.trace-start-card'),badge:UI.viewBadge?.textContent||''};},
        inlineHelp(){return {visible:!helpPanel.hidden,title:helpPanel.querySelector('#contextHelpTitle')?.textContent||''};},
        selfCheck(){return runClassroomSelfCheck();}
      });
    }
    paint();
  });
})();
