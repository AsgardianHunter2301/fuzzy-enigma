"use strict";
(function(){
  let input=document.getElementById('allSearch');
  let button=document.getElementById('homeSearchBtn');
  let panel=document.getElementById('allResults');
  let status=document.getElementById('searchStatus');
  let metaLine=document.getElementById('homeSearchMeta');
  let build=document.getElementById('homeBuild');
  let topics=window.TRACER_TOPICS||[];
  let cursor=-1,current=[],totalMatches=0;
  const meta=window.TRACER_BUILD||{};
  /* P3-01: the classroom hero shows the version only. Governance status stays
     in the manifest and the Sources sheet, not on the student\u2019s first screen. */
  build.textContent='';
  build.title=(meta.status||'DRAFT')+' v'+(meta.version||'');
  function ascii(value){return String(value==null?'':value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2013\u2014\u2212]/g,'-').replace(/\u2026/g,'...').replace(/\u00b7/g,'|').replace(/[^\x20-\x7e]/g,'?');}
  function esc(s){return ascii(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function mark(text,q){const shown=ascii(text),at=shown.toLowerCase().indexOf(q);if(at<0)return esc(shown);return esc(shown.slice(0,at))+'<mark>'+esc(shown.slice(at,at+q.length))+'</mark>'+esc(shown.slice(at+q.length));}
  function score(t,q){const name=ascii(t.n).toLowerCase();if(name===q)return 0;if(name.indexOf(q)===0)return 1;if(name.indexOf(q)>-1)return 2;if(ascii(t.g).toLowerCase().indexOf(q)>-1)return 3;return 4;}
  function setExpanded(open){input.setAttribute('aria-expanded',String(!!open));if(!open)input.removeAttribute('aria-activedescendant');}
  function hideResults(){panel.hidden=true;setExpanded(false);}
  function render(){
    let q=input.value.trim().toLowerCase();
    if(!q){panel.hidden=true;panel.innerHTML='';current=[];cursor=-1;totalMatches=0;setExpanded(false);metaLine.textContent=topics.length+' topics available';status.textContent=topics.length+' topics available';return;}
    let all=topics.filter(function(t){return ascii(t.n+' '+t.g+' '+t.i+' '+(t.s||t.k)).toLowerCase().indexOf(q)>-1;}).sort(function(a,b){return score(a,q)-score(b,q)||ascii(a.n).localeCompare(ascii(b.n));});
    totalMatches=all.length;current=all.slice(0,12);panel.hidden=false;setExpanded(true);
    if(!current.length){panel.innerHTML='<div class="r-none">No matching topic.</div>';metaLine.textContent='No topics match';status.textContent='No topics match';cursor=-1;return;}
    panel.innerHTML=current.map(function(t,index){var named=t.i==='namedalgos'?'<span class="named-only-tag">Named only</span>':'';return '<a id="home-option-'+index+'" role="option" aria-selected="false" href="'+t.p+'#'+t.i+'"><span>'+mark(t.n,q)+'</span><span class="r-area">'+esc(t.g)+'</span>'+named+'</a>';}).join('');
    let summary=totalMatches+' match'+(totalMatches===1?'':'es')+(totalMatches>current.length?'; showing first '+current.length:'');metaLine.textContent=summary;status.textContent=summary;cursor=0;paint();
  }
  function paint(){const links=panel.querySelectorAll('a');for(let i=0;i<links.length;i++){links[i].classList.toggle('cursor',i===cursor);links[i].setAttribute('aria-selected',String(i===cursor));}if(links[cursor]){input.setAttribute('aria-activedescendant',links[cursor].id);links[cursor].scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');}
  input.addEventListener('input',render);button.addEventListener('click',render);
  input.addEventListener('focus',function(){if(input.value.trim())render();});
  input.addEventListener('keydown',function(e){const links=panel.querySelectorAll('a');if(e.key==='ArrowDown'&&links.length){e.preventDefault();cursor=(cursor+1)%links.length;paint();}else if(e.key==='ArrowUp'&&links.length){e.preventDefault();cursor=(cursor-1+links.length)%links.length;paint();}else if(e.key==='Enter'){e.preventDefault();if(links[cursor])window.location.href=links[cursor].getAttribute('href');else render();}else if(e.key==='Escape'){input.value='';render();input.blur();}});
  document.addEventListener('keydown',function(e){if(e.key!=='/'||e.metaKey||e.ctrlKey||e.altKey)return;const t=e.target;if(t&&t.closest&&t.closest('input,textarea,select,button,a[href],[contenteditable="true"]'))return;e.preventDefault();input.focus();input.select();});
  document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('.home-search'))hideResults();});
})();
