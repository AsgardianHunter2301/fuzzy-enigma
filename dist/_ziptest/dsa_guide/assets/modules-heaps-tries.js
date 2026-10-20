/* ============================================================
   PRIORITY QUEUE/* ============================================================
   PRIORITY QUEUE — binary heap
   ============================================================ */
const SRC_PQ = `typedef struct pq *Pq;

Pq PqNew(void);
void PqFree(Pq pq);
void PqInsert(Pq pq, int item, int priority);
int PqDelete(Pq pq);
int PqPeek(Pq pq);

#define INITIAL_CAPACITY 8

struct pq {
    struct pqItem *items;
    int numItems;
    int capacity;
};

struct pqItem {
    int item;
    int priority;
};

static void resize(Pq pq);
static void fixUp(struct pqItem *items, int i);
static void swap(struct pqItem *items, int i, int j);
static void fixDown(struct pqItem *items, int i, int N);

Pq PqNew(void) {
    Pq pq = malloc(sizeof(struct pq));
    if (pq == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    pq->numItems = 0;
    pq->capacity = INITIAL_CAPACITY;
    pq->items = malloc((pq->capacity + 1) * sizeof(struct pqItem));
    return pq;
}

void PqFree(Pq pq) {
    free(pq->items);
    free(pq);
}

void PqInsert(Pq pq, int item, int priority) {
    if (pq->numItems == pq->capacity) {
        resize(pq);
    }

    pq->numItems++;
    pq->items[pq->numItems] = (struct pqItem){
        .item = item,
        .priority = priority,
    };
    fixUp(pq->items, pq->numItems);
}

static void resize(Pq pq) {
    pq->capacity *= 2;
    pq->items = realloc(pq->items, (pq->capacity + 1) * sizeof(struct pqItem));
    if (pq->items == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
}

static void fixUp(struct pqItem *items, int i) {
    while (i > 1 && items[i].priority > items[i / 2].priority) {
        swap(items, i, i / 2);
        i = i / 2;
    }
}

static void swap(struct pqItem *items, int i, int j) {
    struct pqItem tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
}

int PqDelete(Pq pq) {
    if (pq->numItems == 0) {
        fprintf(stderr, "error: pq is empty\\n");
        exit(EXIT_FAILURE);
    }

    int item = pq->items[1].item;
    pq->items[1] = pq->items[pq->numItems];
    pq->numItems--;
    fixDown(pq->items, 1, pq->numItems);
    return item;
}

static void fixDown(struct pqItem *items, int i, int N) {
    while (2 * i <= N) {
        int j = 2 * i;
        if (j < N && items[j + 1].priority > items[j].priority) {
            j++;
        }
        if (items[i].priority >= items[j].priority) {
            break;
        }
        swap(items, i, j);
        i = j;
    }
}

int PqPeek(Pq pq) {
    if (pq->numItems == 0) {
        fprintf(stderr, "error: pq is empty\\n");
        exit(EXIT_FAILURE);
    }

    return pq->items[1].item;
}`;
const LPQ = lines(SRC_PQ,{
  newmalloc:'Pq pq = malloc(sizeof(struct pq));',newnum:'pq->numItems = 0;',newcap:'pq->capacity = INITIAL_CAPACITY;',newitems:'pq->items = malloc',newret:'return pq;',freesig:'void PqFree',freeitems:'free(pq->items);',freepq:'free(pq);',
  cap:'if (pq->numItems == pq->capacity)',callresize:'resize(pq);',inc:'pq->numItems++;',place:'pq->items[pq->numItems] = (struct pqItem){',fixup:'fixUp(pq->items, pq->numItems);',
  rcap:'pq->capacity *= 2;',realloc:'pq->items = realloc',rnull:'if (pq->items == NULL)',
  uloop:'while (i > 1 && items[i].priority > items[i / 2].priority)',uswap:['swap(items, i, i / 2);',1],uup:'i = i / 2;',swaptmp:'struct pqItem tmp = items[i];',swap1:'items[i] = items[j];',swap2:'items[j] = tmp;',
  dguard:'if (pq->numItems == 0) {',dsave:'int item = pq->items[1].item;',dmove:'pq->items[1] = pq->items[pq->numItems];',ddec:'pq->numItems--;',dfix:'fixDown(pq->items, 1, pq->numItems);',dret:'return item;',
  dloop:'while (2 * i <= N) {',dj:'int j = 2 * i;',dbig:'if (j < N && items[j + 1].priority > items[j].priority)',djpp:'j++;',dstop:'if (items[i].priority >= items[j].priority)',dbrk:'break;',dswap:['swap(items, i, j);',1],ddown:'i = j;',
  peeksig:'int PqPeek',peekguard:['if (pq->numItems == 0)',2],peekret:'return pq->items[1].item;'
});

mod({
  id:'pq', group:'Priority queues', name:"Binary heap priority queue - complete lifecycle",
  blocks:[{title:'Priority queue interface and full binary-heap implementation',src:SRC_PQ,pages:'pp. 26-29'}],
  fields:[{k:'ops',label:'operations',def:'insert 10 5, insert 20 9, insert 30 3, insert 40 12, peek, delete, insert 50 7, delete, free'}],
  run(inp){
    const ops=(inp.ops||'').split(/[,;]+/).map(s=>s.trim()).filter(Boolean), t=new Trace();
    const items=[null]; let numItems=0,capacity=8,alive=true,terminated=false;
    const pqBlk=t.alloc('malloc','Pq pq','sizeof(struct pq)');
    const itemsBlk=t.alloc('malloc','pq->items','(capacity + 1) × sizeof(struct pqItem)');
    const V=(cls)=>({kind:'heap',items:items.slice(),n:numItems,cls:cls||{}});
    t.v({numItems,capacity}).step([0,LPQ.newmalloc],'<code>PqNew</code>: allocate <code>struct pq</code>.',V());
    t.step([0,LPQ.newnum],'<code>pq->numItems = 0</code>.',V());
    t.step([0,LPQ.newcap],'<code>pq->capacity = INITIAL_CAPACITY</code> (8).',V());
    t.step([0,LPQ.newitems],'<code>pq->items</code> is allocated with <code>capacity + 1</code> elements. Index 0 is not used by <code>fixUp</code>, <code>PqDelete</code>, or <code>fixDown</code>.',V());

    for(const raw of ops){
      if(!alive||terminated){ t.step([0,LPQ.freepq],terminated?'Trace stopped because the manual calls <code>exit(EXIT_FAILURE)</code>.':'Trace stopped: the priority queue was already freed.',V()); break; }
      const p=raw.split(/\s+/),cmd=p[0].toLowerCase();
      if(cmd==='insert'){
        const item=Number(p[1]),priority=Number(p[2]);
        if(!Number.isInteger(item)||!Number.isInteger(priority)) throw new Error('insert requires integer item and priority');
        t.v({item,priority}).step([0,LPQ.cap],`<code>pq->numItems == pq->capacity</code> is <b>${numItems===capacity}</b>.`,V());
        if(numItems===capacity){
          capacity*=2; t.v({capacity}).step([0,LPQ.rcap],`<code>pq->capacity *= 2</code> gives ${capacity}.`,V());
          t.realloc(itemsBlk,'pq->items',`(${capacity} + 1) × sizeof(struct pqItem)`);
          t.step([0,LPQ.realloc],'<code>realloc</code> resizes the same logical <code>pq->items</code> allocation.',V());
        }
        numItems++; t.v({numItems}).step([0,LPQ.inc],'<code>pq->numItems++</code>.',V());
        items[numItems]={item,priority};
        t.step([0,LPQ.place],`Write <code>{ .item = ${item}, .priority = ${priority} }</code> at index ${numItems}.`,V({[numItems]:'mv'}));
        let i=numItems; t.v({i}).step([0,LPQ.fixup],`<code>fixUp(pq->items, ${numItems})</code>.`,V({[i]:'mv'}));
        while(i>1&&items[i].priority>items[Math.floor(i/2)].priority){
          const j=Math.floor(i/2);
          t.v({i,parent:j}).step([0,LPQ.uloop],`<code>${items[i].priority} > ${items[j].priority}</code>.`,V({[i]:'mv',[j]:'cmp'}));
          const tmp=items[i]; t.step([0,LPQ.swaptmp],`<code>tmp = items[${i}]</code>.`,V({[i]:'mv'}));
          items[i]=items[j]; t.step([0,LPQ.swap1],`<code>items[${i}] = items[${j}]</code>.`,V({[i]:'mv',[j]:'cmp'}));
          items[j]=tmp; t.step([0,LPQ.swap2],`<code>items[${j}] = tmp</code>.`,V({[i]:'cmp',[j]:'mv'}));
          i=j; t.v({i}).step([0,LPQ.uup],`<code>i = i / 2</code> gives ${i}.`,V({[i]:'mv'}));
        }
        t.step([0,LPQ.uloop],i<=1?'<code>i > 1</code> is false.':'The priority comparison is false; <code>fixUp</code> ends.',V({[i]:'cmp'}));
        t.drop('item','priority','parent');
      } else if(cmd==='delete'){
        t.step([0,LPQ.dguard],`<code>pq->numItems == 0</code> is <b>${numItems===0}</b>.`,V());
        if(numItems===0){ t.step([0,LPQ.dguard],'The manual prints <code>error: pq is empty</code> and calls <code>exit(EXIT_FAILURE)</code>.',V()); terminated=true; continue; }
        const item=items[1].item;
        t.v({item}).step([0,LPQ.dsave],`<code>item = pq->items[1].item = ${item}</code>.`,V({1:'mv'}));
        items[1]=items[numItems];
        t.step([0,LPQ.dmove],`Move <code>pq->items[${numItems}]</code> to index 1.`,V({1:'mv',[numItems]:'hole'}));
        items.length=numItems; numItems--;
        t.v({numItems}).step([0,LPQ.ddec],'<code>pq->numItems--</code>.',V({1:numItems?'mv':'hole'}));
        let i=1,Nn=numItems; t.v({i,N:Nn}).step([0,LPQ.dfix],`<code>fixDown(pq->items, 1, ${Nn})</code>.`,V(numItems?{1:'mv'}:{}));
        while(2*i<=Nn){
          let j=2*i; t.v({j}).step([0,LPQ.dj],`<code>j = 2 * i = ${j}</code>.`,V({[i]:'mv',[j]:'cmp'}));
          if(j<Nn&&items[j+1].priority>items[j].priority){
            t.step([0,LPQ.dbig],`<code>items[${j+1}].priority > items[${j}].priority</code>.`,V({[j]:'cmp',[j+1]:'cmp'}));
            j++; t.v({j}).step([0,LPQ.djpp],`<code>j++</code> gives ${j}.`,V({[j]:'cmp'}));
          }
          t.step([0,LPQ.dstop],`<code>items[${i}].priority >= items[${j}].priority</code> is <b>${items[i].priority>=items[j].priority}</b>.`,V({[i]:'cmp',[j]:'cmp'}));
          if(items[i].priority>=items[j].priority){ t.step([0,LPQ.dbrk],'<code>break</code>.',V({[i]:'cmp'})); break; }
          const tmp=items[i]; t.step([0,LPQ.swaptmp],`<code>tmp = items[${i}]</code>.`,V({[i]:'mv'}));
          items[i]=items[j]; t.step([0,LPQ.swap1],`<code>items[${i}] = items[${j}]</code>.`,V({[i]:'mv',[j]:'cmp'}));
          items[j]=tmp; t.step([0,LPQ.swap2],`<code>items[${j}] = tmp</code>.`,V({[i]:'cmp',[j]:'mv'}));
          i=j; t.v({i}).step([0,LPQ.ddown],`<code>i = j</code> gives ${i}.`,V({[i]:'mv'}));
        }
        t.v({return:item}).step([0,LPQ.dret],`Return <code>${item}</code>.`,V());
        t.drop('item','return','i','j','N');
      } else if(cmd==='peek'){
        t.step([0,LPQ.peekguard],`<code>pq->numItems == 0</code> is <b>${numItems===0}</b>.`,V());
        if(numItems===0){ t.step([0,LPQ.peekguard],'The manual prints the empty-PQ error and calls <code>exit(EXIT_FAILURE)</code>.',V()); terminated=true; continue; }
        t.v({return:items[1].item}).step([0,LPQ.peekret],`Return <code>pq->items[1].item = ${items[1].item}</code>.`,V({1:'mv'})); t.drop('return');
      } else if(cmd==='free'){
        t.free(itemsBlk); t.step([0,LPQ.freeitems],'<code>free(pq->items)</code>.',V());
        t.free(pqBlk); alive=false; t.step([0,LPQ.freepq],'<code>free(pq)</code>. All priority-queue allocations are released.',V());
      } else {
        throw new Error('priority queue operations are: insert item priority, delete, peek, free');
      }
    }
    if(alive&&!terminated){ t.step([0,LPQ.newret],'The priority queue remains allocated. Use <code>free</code> to execute <code>PqFree</code>.',V()); }
    return t;
  }
});

/* ============================================================
   TRIES/* ============================================================
   TRIES
   ============================================================ */
const SRC_TRIE = `#define ALPHABET_SIZE 26

typedef struct node *Trie;

struct node {
    struct node *children[ALPHABET_SIZE];
    bool finish;
};

static Trie doTrieDelete(Trie t, char *key, bool isRoot);

Trie trieNew(void) {
    Trie t = calloc(1, sizeof(*t));
    if (t == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }
    return t;
}

void trieFree(Trie t) {
    if (t == NULL) {
        return;
    }

    for (int i = 0; i < ALPHABET_SIZE; i++) {
        trieFree(t->children[i]);
    }
    free(t);
}

Trie trieInsert(Trie t, char *key) {
    if (t == NULL) {
        t = calloc(1, sizeof(*t));
    }

    if (key[0] == '\\0') {
        t->finish = true;
        return t;
    }

    int i = key[0] - 'a';
    t->children[i] = trieInsert(t->children[i], &key[1]);
    return t;
}

bool trieSearch(Trie t, char *key) {
    if (t == NULL) {
        return false;
    }

    if (key[0] == '\\0') {
        return t->finish;
    }

    char first = key[0];
    int i = first - 'a';
    return trieSearch(t->children[i], &key[1]);
}

Trie trieDelete(Trie t, char *key) {
    return doTrieDelete(t, key, true);
}

static Trie doTrieDelete(Trie t, char *key, bool isRoot) {
    if (t == NULL) {
        return t;
    } else if (key[0] == '\\0') {
        t->finish = false;
    } else {
        int i = key[0] - 'a';
        t->children[i] = doTrieDelete(t->children[i], &key[1], false);
    }

    if (isRoot || t->finish) {
        return t;
    }

    for (int i = 0; i < ALPHABET_SIZE; i++) {
        if (t->children[i] != NULL) {
            return t;
        }
    }

    free(t);
    return NULL;
}`;
const LTR = lines(SRC_TRIE,{
  newcalloc:'Trie t = calloc(1, sizeof(*t));',newret:'return t;',freesig:'void trieFree',freenull:'if (t == NULL)',freefor:'for (int i = 0; i < ALPHABET_SIZE; i++)',freerec:'trieFree(t->children[i]);',free:'free(t);',
  inull:['if (t == NULL) {',2],icalloc:'t = calloc(1, sizeof(*t));',iend:"if (key[0] == '\\0') {",ifin:'t->finish = true;',iidx:"int i = key[0] - 'a';",irec:'t->children[i] = trieInsert(t->children[i], &key[1]);',iret:'return t;',
  snull:['if (t == NULL) {',3],sfalse:'return false;',send:["if (key[0] == '\\0') {",2],sfin:'return t->finish;',sidx:'char first = key[0];',srec:'return trieSearch(t->children[i], &key[1]);',
  delsig:'Trie trieDelete',delcall:'return doTrieDelete(t, key, true);',dnull:['if (t == NULL) {',4],dend:"} else if (key[0] == '\\0') {",dfin:'t->finish = false;',didx:["int i = key[0] - 'a';",2],drec:'t->children[i] = doTrieDelete(t->children[i], &key[1], false);',dkeep:'if (isRoot || t->finish) {',dscan:'for (int i = 0; i < ALPHABET_SIZE; i++) {',dchild:'if (t->children[i] != NULL) {',dfree:['free(t);',2],dnullret:'return NULL;'
});

let trieUid=0;
const TN = (ch,blk=null) => ({id:++trieUid,ch,fin:false,kids:{},blk});
function trieClone(n){ if(!n) return null; const c={id:n.id,ch:n.ch,fin:n.fin,kids:{}}; for(const k in n.kids)c.kids[k]=trieClone(n.kids[k]); return c; }
function pathCls2(ids,c){const o={};ids.forEach(i=>o[i]=c);return o;}

mod({
  id:'trie', group:'Tries', name:"Trie - complete insert, search, delete and free",
  blocks:[{title:'Trie full implementation',src:SRC_TRIE,pages:'pp. 29-31'}],
  fields:[{k:'ops',label:'operations',def:'insert cat, insert car, insert cart, insert dog, search car, delete car, search cart, free'}],
  run(inp){
    trieUid=0;
    const ops=(inp.ops||'').split(/[,;]+/).map(s=>s.trim()).filter(Boolean),t=new Trace();
    let alive=true;
    const rootBlk=t.alloc('calloc','trie root','1 × sizeof(*t)');
    let root=TN('',rootBlk);
    const V=(cls,ecls)=>({kind:'trie',root:trieClone(root),cls:cls||{},ecls:ecls||{}});
    t.step([0,LTR.newcalloc],'<code>trieNew</code> uses <code>calloc(1, sizeof(*t))</code> for the root.',V({[root.id]:'act'}));
    t.step([0,LTR.newret],'<code>trieNew</code> returns the root.',V({[root.id]:'hit'}));

    function checkKey(key){ if(!/^[a-z]*$/.test(key)) throw new Error('trie keys must contain only lowercase a-z; the manual indexes key[0] - \'a\''); }
    for(const raw of ops){
      if(!alive){ t.step([0,LTR.free],'Trace stopped: the trie was already freed.',{kind:'trie',root:null}); break; }
      const p=raw.split(/\s+/),cmd=p[0].toLowerCase(),key=p[1]||'';
      if(cmd==='insert'){
        checkKey(key); t.v({key}).step([0,LTR.inull],`<code>trieInsert(t, "${key}")</code>.`,V({[root.id]:'act'}));
        let cur=root; const path=[root.id];
        for(let d=0;d<key.length;d++){
          const ch=key[d],i=ch.charCodeAt(0)-97;
          t.v({'key[0]':`'${ch}'`,i}).step([0,LTR.iidx],`<code>i = '${ch}' - 'a' = ${i}</code>.`,V(pathCls2(path,'act')));
          if(!cur.kids[ch]){
            const blk=t.alloc('calloc',`node('${ch}')`,'1 × sizeof(*t)');
            cur.kids[ch]=TN(ch,blk);
            t.step([0,LTR.icalloc],`<code>t == NULL</code> at <code>children[${i}]</code>; allocate the node with <code>calloc</code>.`,V({[cur.kids[ch].id]:'hit'}));
          }
          t.step([0,LTR.irec],`Assign <code>trieInsert(t->children[${i}], &key[1])</code> back to <code>t->children[${i}]</code>.`,V({[cur.kids[ch].id]:'act'}));
          cur=cur.kids[ch]; path.push(cur.id);
        }
        cur.fin=true;
        t.drop('key[0]','i').step([0,LTR.ifin],`At <code>'\\0'</code>, set <code>t->finish = true</code>.`,V({[cur.id]:'hit'}));
        t.drop('key');
      } else if(cmd==='search'){
        checkKey(key); t.v({key}).step([0,LTR.snull],`<code>trieSearch(t, "${key}")</code>.`,V({[root.id]:'act'}));
        let cur=root,ok=true; const path=[root.id];
        for(let d=0;d<key.length;d++){
          const ch=key[d],i=ch.charCodeAt(0)-97;
          if(!cur.kids[ch]){ t.v({return:'false'}).step([0,LTR.sfalse],`<code>t->children[${i}] == NULL</code>; return <code>false</code>.`,V(pathCls2(path,'bad'))); ok=false; break; }
          cur=cur.kids[ch]; path.push(cur.id);
          t.step([0,LTR.srec],`Recurse through <code>t->children[${i}]</code> with <code>&key[1]</code>.`,V(pathCls2(path,'act')));
        }
        if(ok){ t.v({return:String(cur.fin)}).step([0,LTR.sfin],`At <code>'\\0'</code>, return <code>t->finish</code> (${cur.fin}).`,V({[cur.id]:cur.fin?'hit':'bad'})); }
        t.drop('key','return');
      } else if(cmd==='delete'){
        checkKey(key); t.v({key}).step([0,LTR.delcall],`<code>trieDelete(t, "${key}")</code> calls <code>doTrieDelete(t, key, true)</code>.`,V({[root.id]:'act'}));
        const chain=[root]; let cur=root,found=true;
        for(const ch of key){ if(!cur.kids[ch]){found=false;break;} cur=cur.kids[ch]; chain.push(cur); }
        if(!found){ t.step([0,LTR.dnull],'<code>t == NULL</code> during recursion; return the existing pointer.',V()); continue; }
        cur.fin=false; t.step([0,LTR.dfin],'<code>t->finish = false</code> at the end of the key.',V({[cur.id]:'bad'}));
        for(let d=chain.length-1;d>=0;d--){
          const n=chain[d],isRoot=d===0;
          t.step([0,LTR.dkeep],`<code>isRoot || t->finish</code> is <b>${isRoot||n.fin}</b> at ${isRoot?'root':`'${n.ch}'`}.`,V({[n.id]:'act'}));
          if(isRoot||n.fin) break;
          const keys=Object.keys(n.kids);
          let keep=false;
          for(let i=0;i<26;i++){
            const ch=String.fromCharCode(97+i);
            if(n.kids[ch]){ t.v({i}).step([0,LTR.dchild],`<code>t->children[${i}] != NULL</code>; keep node '${n.ch}'.`,V({[n.id]:'act'})); keep=true; break; }
          }
          if(keep) break;
          t.step([0,LTR.dscan],`All 26 child pointers of '${n.ch}' are NULL.`,V({[n.id]:'bad'}));
          t.free(n.blk); t.step([0,LTR.dfree],`<code>free(t)</code> for node '${n.ch}'.`,V({[n.id]:'bad'}));
          const parent=chain[d-1]; delete parent.kids[n.ch];
          t.step([0,LTR.dnullret],`Return <code>NULL</code>; the parent stores it in <code>children['${n.ch}' - 'a']</code>.`,V({[parent.id]:'act'}));
        }
        t.drop('key','i');
      } else if(cmd==='free'){
        function release(n){
          if(!n){ t.step([0,LTR.freenull],'<code>t == NULL</code>; return.',{kind:'trie',root:trieClone(root)}); return; }
          for(const ch of Object.keys(n.kids).sort()){
            const i=ch.charCodeAt(0)-97;
            t.v({i}).step([0,LTR.freerec],`<code>trieFree(t->children[${i}])</code> for '${ch}'.`,V({[n.id]:'act'}));
            release(n.kids[ch]);
            delete n.kids[ch];
          }
          t.free(n.blk); t.step([0,LTR.free],`<code>free(t)</code>${n.ch?` for '${n.ch}'`:' for the root'}.`,V({[n.id]:'bad'}));
        }
        release(root); root=null; alive=false;
        t.drop('i').step([0,LTR.free],'All trie nodes are released.',{kind:'trie',root:null});
      } else {
        throw new Error('trie operations are: insert key, search key, delete key, free');
      }
    }
    if(alive){ t.step([0,LTR.iret],'The trie remains allocated. Use <code>free</code> to execute <code>trieFree</code>.',V()); }
    return t;
  }
});
