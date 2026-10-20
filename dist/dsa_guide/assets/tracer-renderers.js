/* ============================================================
   RENDERERS
   ============================================================ */
const RENDER = {};

RENDER.array = (view,host)=>{
  view.rows.forEach(row=>{
    const wrap = createElement('div');
    if(row.label) wrap.appendChild(createElement('div','caption',row.label));
    const r = createElement('div','arow');
    if(!row.a.length) r.appendChild(createElement('div','empty','(empty)'));
    row.a.forEach((val,i)=>{
      const c = createElement('div','cell '+(row.cls[i]||''));
      c.appendChild(createElement('div','v', val===null||val===undefined?'·':String(val)));
      c.appendChild(createElement('div','i',String(i)));
      r.appendChild(c);
    });
    wrap.appendChild(r);
    const pr = createElement('div','ptrs');
    let any=false;
    row.a.forEach((_,i)=>{
      const p = createElement('div','p');
      const names = Object.keys(row.ptr).filter(k=>row.ptr[k]===i);
      if(names.length){ p.textContent = names.join(' '); any=true; }
      pr.appendChild(p);
    });
    if(any) wrap.appendChild(pr);
    host.appendChild(wrap);
  });
};

RENDER.linked = (view,host)=>{
  (view.lists||[view]).forEach(L=>{
    const wrap = createElement('div');
    if(L.label) wrap.appendChild(createElement('div','headlbl',L.label));
    const chain = createElement('div','chain');
    if(!L.nodes.length){ chain.appendChild(createElement('span','nullbox','NULL')); }
    L.nodes.forEach((n,i)=>{
      const box = createElement('div','lnode '+(n.cls||''));
      box.appendChild(createElement('div','lv',String(n.v)));
      if(n.sub) box.appendChild(createElement('div','lp',n.sub));
      chain.appendChild(box);
      if(i<L.nodes.length-1) chain.appendChild(createElement('span','arrow','→'));
    });
    if(L.nodes.length){ chain.appendChild(createElement('span','arrow','→')); chain.appendChild(createElement('span','nullbox','NULL')); }
    wrap.appendChild(chain);
    host.appendChild(wrap);
  });
};

/* binary tree layout: in-order x, depth y */
function layoutTree(root){
  const nodes=[], edges=[]; let x=0;
  (function walk(n,d,parent){
    if(!n) return;
    walk(n.l,d+1,n);
    const me={n,x:x++,y:d};
    nodes.push(me);
    if(parent) edges.push([parent,n]);
    walk(n.r,d+1,n);
  })(root,0,null);
  const pos=new Map(); nodes.forEach(o=>pos.set(o.n,o));
  return {nodes,edges,pos,w:x};
}

/* ============================================================
   AUD-10: accessible structural equivalent for node diagrams
   ------------------------------------------------------------
   RENDER.tree and RENDER.trie emitted ONLY an <svg aria-hidden="true"
   focusable="false">. Hiding a decorative canvas is correct, but here the
   canvas WAS the information: the whole tree/trie structure was unavailable
   to assistive technology, with no text alternative anywhere.

   Each renderer now emits a screen-reader table next to the diagram,
   carrying stable node identity, displayed value, root indication, which
   child slot each node occupies, the current highlight, badges (AVL balance
   factors) and, for a trie, the terminal/complete-word flag.

   Identity is a pre-order index, deliberately SEPARATE from the displayed
   value: during an AVL deletion two nodes can transiently hold the same
   value, so a value is not a usable identifier.

   The table is NOT a live region. Playback changes it on every frame, and
   announcing a whole tree per frame would flood a screen reader; it is
   rendered as a static, inspectable structure that a user can read on
   demand, which is why aria-live is explicitly "off".
   ============================================================ */
function structuralTable(caption, headers, rows){
  const wrap=createElement('div','sr-only structure-text');
  wrap.setAttribute('aria-live','off');
  const table=createElement('table');
  const cap=createElement('caption',null,caption);
  table.appendChild(cap);
  const thead=createElement('thead'),hr=createElement('tr');
  headers.forEach(h=>{const th=createElement('th',null,h);th.setAttribute('scope','col');hr.appendChild(th);});
  thead.appendChild(hr);table.appendChild(thead);
  const tbody=createElement('tbody');
  rows.forEach(cells=>{
    const tr=createElement('tr');
    cells.forEach((c,i)=>{
      const cell=createElement(i===0?'th':'td',null,String(c));
      if(i===0)cell.setAttribute('scope','row');
      tr.appendChild(cell);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

RENDER.tree = (view,host)=>{
  const root=view.root;
  if(!root){ host.appendChild(createElement('div','empty','tree is empty (NULL)')); return; }  /* visible text, already accessible */
  const {nodes,edges,pos,w}=layoutTree(root);
  const gx=Math.max(46, Math.min(76, 620/Math.max(w,1))), gy=64, R=17;
  const pad=34, W=Math.max(w*gx+pad*2,260);
  const H=(Math.max(...nodes.map(o=>o.y))+1)*gy+pad;
  const X=o=>pad+o.x*gx+gx/2, Y=o=>28+o.y*gy;
  let s=`<svg class="canvas" aria-hidden="true" focusable="false" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet">`;
  edges.forEach(([p,c])=>{
    const a=pos.get(p),b=pos.get(c);
    const k=(view.ecls&&view.ecls[c.v])||'';
    const ptr=p.l===c?'left':'right';
    s+=`<line class="edge ${k}" x1="${X(a)}" y1="${Y(a)+R}" x2="${X(b)}" y2="${Y(b)-R}"/>`;
    s+=`<text class="elbl" x="${(X(a)+X(b))/2+4}" y="${(Y(a)+Y(b))/2-3}">${ptr}</text>`;
  });
  nodes.forEach(o=>{
    const cls=(view.cls&&view.cls[o.n.v])||'';
    s+=`<circle class="nd ${cls}" cx="${X(o)}" cy="${Y(o)}" r="${R}"/>`;
    s+=`<text x="${X(o)}" y="${Y(o)+4.5}" text-anchor="middle" font-size="12.5">${o.n.v}</text>`;
    const b=view.badges&&view.badges[o.n.v];
    if(b) s+=`<text class="bf" x="${X(o)+R+3}" y="${Y(o)-R+4}">${b}</text>`;
  });
  s+='</svg>';
  const d=createElement('div'); d.innerHTML=s; host.appendChild(d);
  /* AUD-10: equivalent structural text for the hidden canvas. */
  const ids=new Map();
  (function assign(n){ if(!n)return; ids.set(n,'n'+(ids.size+1)); assign(n.l); assign(n.r); })(root);
  const describe=n=>n?`${ids.get(n)} (value ${n.v})`:'none';
  const rows=[];
  (function emit(n,parent,slot){
    if(!n)return;
    const highlight=(view.cls&&view.cls[n.v])||'';
    const badge=(view.badges&&view.badges[n.v]);
    rows.push([
      ids.get(n),
      n.v,
      parent?`${slot} child of ${ids.get(parent)}`:'root',
      describe(n.l),
      describe(n.r),
      highlight||'none',
      badge===undefined||badge===null?'':String(badge)
    ]);
    emit(n.l,n,'left'); emit(n.r,n,'right');
  })(root,null,'');
  host.appendChild(structuralTable(
    `Tree structure as text: ${rows.length} node${rows.length===1?'':'s'}, root ${describe(root)}. Node ids are pre-order positions and are independent of the values, so duplicate values remain distinguishable.`,
    ['node','value','position','left child','right child','highlight','balance factor'],
    rows));
};

RENDER.trie = (view,host)=>{
  const root=view.root;
  if(!root){ host.appendChild(createElement('div','empty','trie is empty (NULL)')); return; }  /* visible text, already accessible */
  const nodes=[], edges=[]; let leaf=0;
  (function walk(n,d,ch,parent){
    const keys=Object.keys(n.kids).sort();
    const me={n,x:0,y:d,ch};
    nodes.push(me);
    if(parent) edges.push([parent,n,ch]);
    if(!keys.length){ me.x = leaf++; return me; }
    const xs = keys.map(k=>walk(n.kids[k],d+1,k,n).x);
    me.x = (Math.min(...xs)+Math.max(...xs))/2;
    return me;
  })(root,0,'',null);
  const pos=new Map(); nodes.forEach(o=>pos.set(o.n,o));
  const gx=54,gy=58,R=15,pad=28;
  const maxx=Math.max(0,...nodes.map(o=>o.x));
  const W=Math.max((maxx+1)*gx+pad*2,260), H=(Math.max(...nodes.map(o=>o.y))+1)*gy+pad;
  const X=o=>pad+o.x*gx+gx/2, Y=o=>26+o.y*gy;
  let s=`<svg class="canvas" aria-hidden="true" focusable="false" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet">`;
  edges.forEach(([p,c,ch])=>{
    const a=pos.get(p),b=pos.get(c);
    const k=(view.ecls&&view.ecls[c.id])||'';
    s+=`<line class="edge ${k}" x1="${X(a)}" y1="${Y(a)+R}" x2="${X(b)}" y2="${Y(b)-R}"/>`;
    s+=`<text class="elbl" x="${(X(a)+X(b))/2+6}" y="${(Y(a)+Y(b))/2+3}">${ch}</text>`;
  });
  nodes.forEach(o=>{
    const cls=((view.cls&&view.cls[o.n.id])||'')+(o.n.fin?' fin':'');
    s+=`<circle class="nd ${cls}" cx="${X(o)}" cy="${Y(o)}" r="${R}"/>`;
    if(o.n.fin) s+=`<circle class="nd ${cls}" fill="none" cx="${X(o)}" cy="${Y(o)}" r="${R-3.5}"/>`;
    s+=`<text x="${X(o)}" y="${Y(o)+4}" text-anchor="middle" font-size="11.5">${o.n.ch||'\u25CF'}</text>`;
  });
  s+='</svg>';
  const d=createElement('div'); d.innerHTML=s; host.appendChild(d);
  /* AUD-10: equivalent structural text, including the terminal-word flag,
     which the diagram encodes only as a second concentric circle. */
  const trieIds=new Map();
  (function assignTrie(n){
    if(!n)return;
    trieIds.set(n,'t'+(trieIds.size+1));
    Object.keys(n.kids).sort().forEach(k=>assignTrie(n.kids[k]));
  })(root);
  const trieRows=[];
  (function emitTrie(n,parent,edgeChar,prefix){
    if(!n)return;
    const keys=Object.keys(n.kids).sort();
    const here=n.ch?prefix+n.ch:prefix;
    const highlight=(view.cls&&view.cls[n.id])||'';
    trieRows.push([
      trieIds.get(n),
      n.ch?n.ch:'(root)',
      parent?`child "${edgeChar}" of ${trieIds.get(parent)}`:'root',
      here||'(empty)',
      keys.length?keys.join(' '):'none',
      n.fin?'yes - complete word':'no - prefix only',
      highlight||'none'
    ]);
    keys.forEach(k=>emitTrie(n.kids[k],n,k,here));
  })(root,null,'','');
  const words=trieRows.filter(r=>r[5].startsWith('yes')).length;
  host.appendChild(structuralTable(
    `Trie structure as text: ${trieRows.length} node${trieRows.length===1?'':'s'}, ${words} complete word${words===1?'':'s'}. A node marked "prefix only" is on the path to a word but is not itself a stored word.`,
    ['node','character','position','prefix at this node','child characters','complete word','highlight'],
    trieRows));
};

RENDER.hash = (view,host)=>{
  const head=createElement('div','caption',`numSlots = ${view.numSlots}   numItems = ${view.numItems}   load = ${(view.numItems/view.numSlots).toFixed(2)}`);
  host.appendChild(head);
  const box=createElement('div','slots');
  view.slots.forEach((chain,i)=>{
    const row=createElement('div','slot'+(view.onSlot===i?' on':''));
    row.appendChild(createElement('div','sn',String(i)));
    if(!chain.length) row.appendChild(createElement('span','nullbox','NULL'));
    chain.forEach((n,j)=>{
      row.appendChild(createElement('span','kv '+(n.cls||''),`${n.k} → ${n.v}`));
      if(j<chain.length-1) row.appendChild(createElement('span','arrow','→'));
    });
    if(chain.length){ row.appendChild(createElement('span','arrow','→')); row.appendChild(createElement('span','nullbox','NULL')); }
    box.appendChild(row);
  });
  host.appendChild(box);
};

RENDER.heap = (view,host)=>{
  const it=Array.isArray(view.items)?view.items:[], n=Math.max(0,Number(view.n)||0);
  const wrap=createElement('div');
  wrap.appendChild(createElement('div','caption','pq->items   (index 0 unused — the manual uses a 1-indexed heap)'));
  const r=createElement('div','arow');
  for(let i=0;i<=Math.max(n,1);i++){
    const c=createElement('div','cell '+(i===0?'hole':((view.cls&&view.cls[i])||'')));
    const cell=it[i];
    c.appendChild(createElement('div','v', i===0?'·':(cell?`${cell.item}`:'·')));
    c.appendChild(createElement('div','i',String(i)));
    r.appendChild(c);
  }
  wrap.appendChild(r);
  const pr=createElement('div','ptrs');
  for(let i=0;i<=Math.max(n,1);i++){
    const p=createElement('div','p');
    const cell=it[i];
    if(i>0&&cell) p.textContent='p'+cell.priority;
    pr.appendChild(p);
  }
  wrap.appendChild(pr);
  host.appendChild(wrap);

  if(n>0){
    const R=18,gy=60;
    const depth=Math.floor(Math.log2(n))+1;
    const W=Math.max(Math.pow(2,depth-1)*62,280), H=depth*gy+24;
    const px=i=>{ const d=Math.floor(Math.log2(i)); const off=i-Math.pow(2,d); const span=W/Math.pow(2,d); return off*span+span/2; };
    const py=i=>24+Math.floor(Math.log2(i))*gy;
    let s=`<svg class="canvas" aria-hidden="true" focusable="false" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet">`;
    for(let i=2;i<=n;i++){
      const p=Math.floor(i/2);
      s+=`<line class="edge" x1="${px(p)}" y1="${py(p)+R}" x2="${px(i)}" y2="${py(i)-R}"/>`;
    }
    for(let i=1;i<=n;i++){
      const mark=(view.cls&&view.cls[i])||''; const cls=mark==='mv'?'act':(mark==='cmp'?'hit':''); const cell=it[i]||{item:'·',priority:''};
      s+=`<circle class="nd ${cls}" cx="${px(i)}" cy="${py(i)}" r="${R}"/>`;
      s+=`<text x="${px(i)}" y="${py(i)+1}" text-anchor="middle" font-size="11">${cell.item}</text>`;
      s+=`<text class="bf" x="${px(i)}" y="${py(i)+12}" text-anchor="middle">${cell.priority}</text>`;
    }
    s+='</svg>';
    const d=createElement('div'); d.innerHTML=s; host.appendChild(d);
  }
};

RENDER.graph = (view,host)=>{
  const n=view.nV, R=17;
  if(n<=0){ host.appendChild(createElement('div','empty','graph has no vertices')); return; }
  const W=460, H=300, cx=W/2, cy=H/2, rad=Math.min(cx,cy)-40;
  const P=i=>({x:cx+rad*Math.cos(-Math.PI/2+2*Math.PI*i/n), y:cy+rad*Math.sin(-Math.PI/2+2*Math.PI*i/n)});
  let s=`<svg class="canvas" aria-hidden="true" focusable="false" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
  if(view.directed) s+=`<defs><marker id="arrowhead" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><path d="M0,0 L7,2.5 L0,5 z" fill="currentColor"/></marker></defs>`;
  if(view.directed){
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){
      if(!view.edges[i][j]) continue;
      const a=P(i),k=(view.ecls&&view.ecls[i+'-'+j])||'dim';
      if(i===j){
        const d=`M ${a.x-R*.55} ${a.y-R*.82} C ${a.x-R*2.3} ${a.y-R*3.0}, ${a.x+R*2.3} ${a.y-R*3.0}, ${a.x+R*.55} ${a.y-R*.82}`;
        s+=`<path class="edge ${k}" marker-end="url(#arrowhead)" d="${d}"/>`;
        if(view.w) s+=`<text class="elbl" x="${a.x}" y="${a.y-R*3.05}" text-anchor="middle">${view.w[i][i]}</text>`;
        continue;
      }
      const b=P(j),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      const x1=a.x+dx/len*R,y1=a.y+dy/len*R,x2=b.x-dx/len*(R+5),y2=b.y-dy/len*(R+5);
      s+=`<line class="edge ${k}" marker-end="url(#arrowhead)" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      if(view.w) s+=`<text class="elbl" x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2-3}" text-anchor="middle">${view.w[i][j]}</text>`;
    }
  } else {
    for(let i=0;i<n;i++) if(view.edges[i][i]){
      const a=P(i),k=(view.ecls&&view.ecls[i+'-'+i])||'dim';
      const d=`M ${a.x-R*.55} ${a.y-R*.82} C ${a.x-R*2.3} ${a.y-R*3.0}, ${a.x+R*2.3} ${a.y-R*3.0}, ${a.x+R*.55} ${a.y-R*.82}`;
      s+=`<path class="edge ${k}" d="${d}"/>`;
      if(view.w) s+=`<text class="elbl" x="${a.x}" y="${a.y-R*3.05}" text-anchor="middle">${view.w[i][i]}</text>`;
    }
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
      const w=view.w?view.w[i][j]:(view.edges[i][j]?1:0);
      if(!view.edges[i][j]) continue;
      const a=P(i),b=P(j);
      const k=(view.ecls&&(view.ecls[i+'-'+j]||view.ecls[j+'-'+i]))||'dim';
      s+=`<line class="edge ${k}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
      if(view.w) s+=`<text class="elbl" x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2-3}" text-anchor="middle">${w}</text>`;
    }
  }
  for(let i=0;i<n;i++){
    const p=P(i), cls=(view.cls&&view.cls[i])||'';
    s+=`<circle class="nd ${cls}" cx="${p.x}" cy="${p.y}" r="${R}"/>`;
    s+=`<text x="${p.x}" y="${p.y+4.5}" text-anchor="middle" font-size="12.5">${i}</text>`;
  }
  s+='</svg>';
  const d=createElement('div'); d.innerHTML=s; host.appendChild(d);

  (view.tables||[]).forEach(t=>{
    const wrap=createElement('div');
    wrap.appendChild(createElement('div','caption',t.name));
    const tb=createElement('table','grid');
    const h=createElement('tr'); h.appendChild(createElement('th','',t.head||'v'));
    for(let i=0;i<t.row.length;i++) h.appendChild(createElement('th','',String(i)));
    tb.appendChild(h);
    const r=createElement('tr'); r.appendChild(createElement('th','',t.tag||''));
    t.row.forEach((val,i)=>{
      const td=createElement('td', (t.chg&&t.chg.includes(i)?'chg ':'')+(val===Infinity?'inf':''), val===Infinity?'∞':String(val));
      r.appendChild(td);
    });
    tb.appendChild(r); wrap.appendChild(tb); host.appendChild(wrap);
  });

  if(view.showAdj!==false){
    const wrap=createElement('div');
    wrap.appendChild(createElement('div','caption',view.adjName||'g->edges — adjacency matrix'));
    const tb=createElement('table','grid');
    const h=createElement('tr'); h.appendChild(createElement('th','',''));
    for(let j=0;j<n;j++) h.appendChild(createElement('th','',String(j)));
    tb.appendChild(h);
    for(let i=0;i<n;i++){
      const r=createElement('tr'); r.appendChild(createElement('th','',String(i)));
      for(let j=0;j<n;j++){
        const v=!!view.edges[i][j];
        const changed=view.adjChg&&view.adjChg===i+'-'+j;
        r.appendChild(createElement('td',(changed?'chg':(v?'t1':'t0')),v?'1':'0'));
      }
      tb.appendChild(r);
    }
    wrap.appendChild(tb); host.appendChild(wrap);
  }

  if(view.matrix){
    const wrap=createElement('div');
    wrap.appendChild(createElement('div','caption',view.matrix.name));
    const tb=createElement('table','grid');
    const h=createElement('tr'); h.appendChild(createElement('th','',''));
    for(let j=0;j<n;j++) h.appendChild(createElement('th','',String(j)));
    tb.appendChild(h);
    for(let i=0;i<n;i++){
      const r=createElement('tr'); r.appendChild(createElement('th','',String(i)));
      for(let j=0;j<n;j++){
        const v=view.matrix.m[i][j];
        const changed=view.matrix.chg&&view.matrix.chg===i+'-'+j;
        r.appendChild(createElement('td',(changed?'chg':(v?'t1':'t0')), v?'1':'0'));
      }
      tb.appendChild(r);
    }
    wrap.appendChild(tb); host.appendChild(wrap);
  }
};

RENDER.stack2 = RENDER.linked;
