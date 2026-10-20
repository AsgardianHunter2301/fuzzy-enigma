/* ============================================================
   HASH TABLE — separate chaining
   ============================================================ */
const SRC_HASH = `typedef struct hashTable *HashTable;

HashTable HashTableNew(void);
void HashTableFree(HashTable ht);
void HashTableInsert(HashTable ht, int key, int value);
void HashTableDelete(HashTable ht, int key);
bool HashTableContains(HashTable ht, int key);
int HashTableGet(HashTable ht, int key);
int HashTableSize(HashTable ht);

#define INITIAL_NUM_SLOTS 11
#define MAX_LOAD_FACTOR 2.0

struct hashTable {
    struct node **slots;
    int numSlots;
    int numItems;
};

struct node {
    int key;
    int value;
    struct node *next;
};

static void freeList(struct node *list);
static struct node *doInsert(HashTable ht, struct node *list,
                             int key, int value);
static struct node *newNode(int key, int value);
static struct node *doDelete(HashTable ht, struct node *list, int key);
static inline unsigned int hash(int key, int N);

HashTable HashTableNew(void) {
    HashTable ht = malloc(sizeof(*ht));
    if (ht == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    ht->slots = calloc(INITIAL_NUM_SLOTS, sizeof(struct node *));
    ht->numSlots = INITIAL_NUM_SLOTS;
    ht->numItems = 0;
    return ht;
}

void HashTableFree(HashTable ht) {
    for (int i = 0; i < ht->numSlots; i++) {
        freeList(ht->slots[i]);
    }
    free(ht->slots);
    free(ht);
}

static void freeList(struct node *list) {
    struct node *curr = list;
    while (curr != NULL) {
        struct node *temp = curr;
        curr = curr->next;
        free(temp);
    }
}

void HashTableInsert(HashTable ht, int key, int value) {
    if (ht->numItems >= MAX_LOAD_FACTOR * ht->numSlots) {
        printf("warning: resize not implemented!\\n");
    }

    int i = hash(key, ht->numSlots);
    ht->slots[i] = doInsert(ht, ht->slots[i], key, value);
}

static struct node *doInsert(HashTable ht, struct node *list,
                             int key, int value) {
    if (list == NULL) {
        ht->numItems++;
        return newNode(key, value);
    } else if (list->key == key) {
        list->value = value;
        return list;
    } else {
        list->next = doInsert(ht, list->next, key, value);
        return list;
    }
}

static struct node *newNode(int key, int value) {
    struct node *new = malloc(sizeof(struct node));
    if (new == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    new->key = key;
    new->value = value;
    new->next = NULL;
    return new;
}

void HashTableDelete(HashTable ht, int key) {
    int i = hash(key, ht->numSlots);
    ht->slots[i] = doDelete(ht, ht->slots[i], key);
}

static struct node *doDelete(HashTable ht, struct node *list, int key) {
    if (list == NULL) {
        return NULL;
    } else if (list->key == key) {
        ht->numItems--;
        struct node *newHead = list->next;
        free(list);
        return newHead;
    } else {
        list->next = doDelete(ht, list->next, key);
        return list;
    }
}

bool HashTableContains(HashTable ht, int key) {
    int i = hash(key, ht->numSlots);
    struct node *curr;
    for (curr = ht->slots[i]; curr != NULL; curr = curr->next) {
        if (curr->key == key) {
            return true;
        }
    }
    return false;
}

int HashTableGet(HashTable ht, int key) {
    int i = hash(key, ht->numSlots);
    struct node *curr;
    for (curr = ht->slots[i]; curr != NULL; curr = curr->next) {
        if (curr->key == key) {
            return curr->value;
        }
    }
    printf("error: key %d does not exist!\\n", key);
    return -1;
}

int HashTableSize(HashTable ht) {
    return ht->numItems;
}

static inline unsigned int hash(int key, int N) {
    const unsigned int magic = 0x45d9f3b;
    unsigned int h = 1U + INT_MAX;
    h += key;
    h = ((h >> 16) ^ h) * magic;
    h = ((h >> 16) ^ h) * magic;
    h = (h >> 16) ^ h;
    return h % N;
}`;
const LHT = lines(SRC_HASH,{
  newmalloc:'HashTable ht = malloc(sizeof(*ht));',newslots:'ht->slots = calloc',newnumslots:'ht->numSlots = INITIAL_NUM_SLOTS;',newnumitems:'ht->numItems = 0;',newret:'return ht;',
  freesig:'void HashTableFree',freecall:'freeList(ht->slots[i]);',freeslots:'free(ht->slots);',freeht:'free(ht);',freeloop:'while (curr != NULL)',freenode:'free(temp);',
  load:'if (ht->numItems >= MAX_LOAD_FACTOR',warn:'printf("warning: resize not implemented!',ihash:'int i = hash(key, ht->numSlots);',islot:'ht->slots[i] = doInsert',dnull:'if (list == NULL) {',dinc:'ht->numItems++;',dnew:'return newNode(key, value);',dsame:'} else if (list->key == key) {',dupd:'list->value = value;',drec:'list->next = doInsert(ht, list->next, key, value);',nodemalloc:'struct node *new = malloc',
  delhash:['int i = hash(key, ht->numSlots);',2],delslot:'ht->slots[i] = doDelete',xnull:['if (list == NULL) {',2],xmatch:['} else if (list->key == key) {',2],xdec:'ht->numItems--;',xhead:'struct node *newHead = list->next;',xfree:'free(list);',xrec:'list->next = doDelete(ht, list->next, key);',
  contains:'bool HashTableContains',containsloop:['for (curr = ht->slots[i]; curr != NULL; curr = curr->next)',1],containsif:['if (curr->key == key)',1],containstrue:'return true;',containsfalse:'return false;',
  get:'int HashTableGet',getloop:['for (curr = ht->slots[i]; curr != NULL; curr = curr->next)',2],getif:['if (curr->key == key)',2],getret:'return curr->value;',geterr:'printf("error: key %d does not exist!',getminus:'return -1;',size:'return ht->numItems;',
  hmagic:'const unsigned int magic',hinit:'unsigned int h = 1U + INT_MAX;',hadd:'h += key;',hmix1:['h = ((h >> 16) ^ h) * magic;',1],hmix2:['h = ((h >> 16) ^ h) * magic;',2],hfin:'h = (h >> 16) ^ h;',hmod:'return h % N;'
});

const imul32 = typeof Math.imul === 'function' ? Math.imul : function(a,b){
  const ah=(a>>>16)&0xffff, al=a&0xffff;
  const bh=(b>>>16)&0xffff, bl=b&0xffff;
  return (al*bl + (((ah*bl + al*bh)&0xffff)<<16))|0;
};
function cHash(key,N){
  const magic=0x45d9f3b;
  let h=(2147483648+key)>>>0;
  h=(imul32((h>>>16)^h,magic))>>>0;
  h=(imul32((h>>>16)^h,magic))>>>0;
  h=((h>>>16)^h)>>>0;
  return h%N;
}

/* ============================================================
   CAP-154 - resizing a separate-chaining hash table
   ------------------------------------------------------------
   The manual's HashTableInsert above reaches

       printf("warning: resize not implemented!\n");

   and then carries straight on into the unchanged 11-slot table: that branch
   has no return, and the supplied source contains no resize function at all.
   The quoted block is left exactly as supplied so that it stays identifiable
   and nothing is attributed to the manual that the manual does not say. The
   block below COMPLETES that branch as declared supplemental C.
   ============================================================ */
const SRC_HASH_RESIZE = `/* SUPPLEMENTAL C - not 26T2 manual source and not 25T3 lecture source.
   The manual's HashTableInsert reaches
       printf("warning: resize not implemented!");
   and then inserts into the unchanged table. This block is that branch,
   completed. Every policy choice it makes is declared here:

     Growth    double the slot count, then round up to the next prime, so the
               modulus keeps mixing keys.  11 -> 23 -> 47 -> 97 -> 193 -> 389.
     Trigger   the load factor numItems / numSlots. MAX_LOAD_FACTOR is the
               manual's own constant; DEMO_LOAD_FACTOR exists only so that the
               rehash is visible in a short trace. The threshold is a policy
               choice, and the tracer names which one is in force. The rehash
               itself is not a choice: it is required for correctness.
     Ownership the new slot array is allocated BEFORE anything moves, so a
               failed allocation leaves the old table usable. Existing nodes
               are MOVED by relinking ->next, never copied, so no key/value
               pair is duplicated and no node is freed twice. Only the old
               slot array is freed. */

#define DEMO_LOAD_FACTOR 0.25

static const int RESIZE_PRIMES[] = {11, 23, 47, 97, 193, 389};
#define NUM_RESIZE_PRIMES 6

static int nextNumSlots(int numSlots) {
    for (int i = 0; i < NUM_RESIZE_PRIMES; i++) {
        if (RESIZE_PRIMES[i] >= 2 * numSlots) {
            return RESIZE_PRIMES[i];
        }
    }
    return 2 * numSlots + 1;
}

static void HashTableResize(HashTable ht) {
    int oldNumSlots = ht->numSlots;
    struct node **oldSlots = ht->slots;
    int newNumSlots = nextNumSlots(oldNumSlots);

    struct node **newSlots = calloc(newNumSlots, sizeof(struct node *));
    if (newSlots == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    for (int i = 0; i < oldNumSlots; i++) {
        struct node *curr = oldSlots[i];
        while (curr != NULL) {
            struct node *next = curr->next;
            unsigned int j = hash(curr->key, newNumSlots);
            curr->next = newSlots[j];
            newSlots[j] = curr;
            curr = next;
        }
    }

    free(oldSlots);
    ht->slots = newSlots;
    ht->numSlots = newNumSlots;
}

void HashTableInsertResizing(HashTable ht, int key, int value, double maxLoad) {
    if (ht->numItems >= maxLoad * ht->numSlots) {
        HashTableResize(ht);
    }

    int i = hash(key, ht->numSlots);
    ht->slots[i] = doInsert(ht, ht->slots[i], key, value);
}`;
const LHR = lines(SRC_HASH_RESIZE,{
  demo:'#define DEMO_LOAD_FACTOR',primes:'static const int RESIZE_PRIMES[]',
  nextsig:'static int nextNumSlots(int numSlots)',nextpick:'if (RESIZE_PRIMES[i] >= 2 * numSlots)',nextret:'return RESIZE_PRIMES[i];',
  sig:'static void HashTableResize(HashTable ht)',old:'int oldNumSlots = ht->numSlots;',oldslots:'struct node **oldSlots = ht->slots;',
  newn:'int newNumSlots = nextNumSlots(oldNumSlots);',calloc:'struct node **newSlots = calloc(newNumSlots',oom:'if (newSlots == NULL)',
  outer:'for (int i = 0; i < oldNumSlots; i++)',walk:'while (curr != NULL)',next:'struct node *next = curr->next;',
  rehash:'unsigned int j = hash(curr->key, newNumSlots);',relink:'curr->next = newSlots[j];',place:'newSlots[j] = curr;',advance:'curr = next;',
  freeold:'free(oldSlots);',setslots:'ht->slots = newSlots;',setn:'ht->numSlots = newNumSlots;',
  isig:'void HashTableInsertResizing',gate:'if (ht->numItems >= maxLoad * ht->numSlots)',call:'HashTableResize(ht);'
});
const RESIZE_PRIMES=[11,23,47,97,193,389];
/* Mirrors nextNumSlots in the supplemental C above. */
function nextNumSlots(n){const p=RESIZE_PRIMES.find(x=>x>=2*n);return p===undefined?2*n+1:p;}

const HASH_RESIZE_DEMO='supplemental rehash, demo threshold 0.25';
const HASH_RESIZE_MANUAL='supplemental rehash, manual threshold 2.0';
const HASH_RESIZE_OFF='off: quoted warning only';

mod({
  id:'hash', group:'Hash tables', name:"Hash table - complete separate chaining",
  keywords:'hash table separate chaining collision chain load factor resize rehash modulus',
  blocks:[
    {title:'Hash table interface and full separate-chaining implementation',src:SRC_HASH,pages:'pp. 21-26'},
    {title:'Resize and rehash - supplemental C completing the manual warning',src:SRC_HASH_RESIZE,source:'memorise',pages:'supplemental lesson'}
  ],
  note:'The manual implementation is complete except for one branch. When the load factor reaches <code>MAX_LOAD_FACTOR</code> it prints <code>warning: resize not implemented!</code> and then continues, so the table never grows. The second block completes that branch as supplemental C, and the <b>resize branch</b> field chooses which version runs; the quoted manual source is kept unchanged and remains selectable. The step students get wrong is the <b>rehash</b>: changing <code>numSlots</code> changes <code>hash(key, numSlots)</code>, so keys do not keep their old slots and the chains cannot simply be copied across.',
  fields:[
    {k:'ops',label:'operations',def:'insert 12 100, insert 23 200, insert 34 300, contains 23, get 12, size, insert 12 999, delete 23, free'},
    {k:'resize',label:'resize branch',def:HASH_RESIZE_DEMO,type:'select',options:[HASH_RESIZE_DEMO,HASH_RESIZE_MANUAL,HASH_RESIZE_OFF]}
  ],
  run(inp){
    const blocks=this.blocks;
    const resizeMode=inp.resize,resizeOn=resizeMode!==HASH_RESIZE_OFF;
    const maxLoad=resizeMode===HASH_RESIZE_DEMO?0.25:2;
    const maxLoadName=maxLoad===0.25?'DEMO_LOAD_FACTOR = 0.25':'MAX_LOAD_FACTOR = 2.0';
    const ops=(inp.ops||'').split(/[,;]+/).map(s=>s.trim()).filter(Boolean), t=new Trace();
    let numSlots=11, slots=Array.from({length:numSlots},()=>[]), numItems=0, alive=true, resizes=0;
    const htBlk=t.alloc('malloc','HashTable ht','sizeof(*ht)');
    let slotsBlk=t.alloc('calloc','ht->slots','INITIAL_NUM_SLOTS × sizeof(struct node *)');
    const load=()=>(numItems/numSlots).toFixed(2);
    const V=(onSlot,markKey,cls)=>({kind:'hash',numSlots,numItems,onSlot:onSlot==null?-1:onSlot,
      slots:slots.map(ch=>ch.map(n=>({k:n.k,v:n.v,cls:markKey!=null&&n.k===markKey?(cls||'new'):''})))});
    t.v({numSlots,numItems}).step([0,LHT.newmalloc],'<code>HashTableNew</code>: allocate <code>ht</code>.',V());
    t.step([0,LHT.newslots],'<code>calloc</code> creates 11 NULL slot pointers.',V());
    t.step([0,LHT.newnumslots],'<code>ht->numSlots = INITIAL_NUM_SLOTS</code> (11).',V());
    t.step([0,LHT.newnumitems],'<code>ht->numItems = 0</code>, then return <code>ht</code>.',V());

    function hashStep(key){
      const i=cHash(key,numSlots);
      t.v({key,i}).step([0,LHT.ihash],`<code>i = hash(${key}, ${numSlots}) = ${i}</code>.`,V(i));
      return i;
    }

    /* ---------- CAP-154: the completed resize branch, traced per key ---------- */
    function resizeTable(){
      const oldNumSlots=numSlots,oldSlots=slots,oldBlk=slotsBlk;
      const loadBefore=load(),newNumSlots=nextNumSlots(oldNumSlots);
      const newSlots=Array.from({length:newNumSlots},()=>[]);
      const pane=(title,ns,arr,on,markKey,cls)=>({title,kind:'hash',numSlots:ns,
        numItems:arr.reduce((s,c)=>s+c.length,0),onSlot:on==null?-1:on,
        slots:arr.map(ch=>ch.map(n=>({k:n.k,v:n.v,cls:markKey!=null&&n.k===markKey?cls:''})))});
      const W=(oldOn,newOn,markKey)=>({kind:'multi',views:[
        pane(`old table — ${oldNumSlots} slots`,oldNumSlots,oldSlots,oldOn,markKey,'dead'),
        pane(`new table — ${newNumSlots} slots`,newNumSlots,newSlots,newOn,markKey,'new')]});
      t.v({'load factor':loadBefore,oldNumSlots}).step(srcLine(blocks,LHR,'sig'),
        `The gate is true, so <code>HashTableResize</code> runs. The quoted manual source never gets here: its branch prints <code>warning: resize not implemented!</code> and then continues with the table unchanged. Everything in this block is <b>supplemental C</b>, not manual or lecture source.`,W());
      t.v({newNumSlots}).step(srcLine(blocks,LHR,'nextpick'),
        `<code>nextNumSlots(${oldNumSlots})</code> takes the first prime that is at least <code>2 × ${oldNumSlots} = ${2*oldNumSlots}</code>, which is <b>${newNumSlots}</b>. Doubling keeps insertion amortised O(1); a prime modulus keeps <code>hash</code> spreading keys.`,W());
      const newBlk=t.alloc('calloc','ht->slots (new)',`${newNumSlots} × sizeof(struct node *)`,'supplemental C');
      t.step(srcLine(blocks,LHR,'calloc'),
        `<code>calloc</code> creates ${newNumSlots} NULL slot pointers. The new array is allocated <b>before</b> anything moves, so a failed allocation leaves the old table intact and usable.`,W());
      for(let i=0;i<oldNumSlots;i++){
        if(!oldSlots[i].length)continue;
        t.v({i}).step(srcLine(blocks,LHR,'walk'),
          `Old slot ${i} holds ${oldSlots[i].length} node${oldSlots[i].length===1?'':'s'}; walk its chain.`,W(i,null));
        while(oldSlots[i].length){
          const node=oldSlots[i][0],j=cHash(node.k,newNumSlots);
          t.v({'curr->key':node.k,'old slot':i,'new slot':j}).step(srcLine(blocks,LHR,'rehash'),
            `<b>Rehash</b> key ${node.k}: <code>hash(${node.k}, ${newNumSlots}) = ${j}</code>, where it was at old slot ${i}. ${j===i?'This key happens to land on the same index — a coincidence of this key, not a rule.':`It moves from slot ${i} to slot ${j}.`} The modulus changed from ${oldNumSlots} to ${newNumSlots}, so <b>every key must be rehashed</b>; the chains cannot be copied slot for slot.`,W(i,j,node.k));
          oldSlots[i].shift();newSlots[j].unshift(node);
          t.step(srcLine(blocks,LHR,'place'),
            `<code>curr->next = newSlots[${j}]</code>, then <code>newSlots[${j}] = curr</code>. The existing node is moved by pointer: no key/value pair is copied and no node is allocated.`,W(i,j,node.k));
        }
      }
      t.free(oldBlk);
      t.step(srcLine(blocks,LHR,'freeold'),
        `<code>free(oldSlots)</code> releases the ${oldNumSlots}-pointer slot array only. Every node was moved rather than copied, so nothing is leaked and nothing is freed twice.`,W());
      slots=newSlots;slotsBlk=newBlk;numSlots=newNumSlots;resizes++;
      t.drop('curr->key','old slot','new slot','i','oldNumSlots','newNumSlots');
      t.v({numSlots,numItems,'load factor':load()}).step(srcLine(blocks,LHR,'setn'),
        `<code>ht->slots = newSlots</code> and <code>ht->numSlots = ${numSlots}</code>. Load factor <b>${loadBefore}</b> before the resize (${numItems} item${numItems===1?'':'s'} in ${oldNumSlots} slots) and <b>${load()}</b> after (${numItems} in ${numSlots}). <code>numItems</code> is unchanged, because a resize moves items; it does not add or remove any.`,V());
    }

    for(const raw of ops){
      if(!alive){ t.step([0,LHT.freeht],'Trace stopped: the hash table was already freed.',V()); break; }
      const p=raw.split(/\s+/), cmd=p[0].toLowerCase(), key=Number(p[1]), value=Number(p[2]);
      if(cmd==='insert'){
        if(!Number.isInteger(key)||!Number.isInteger(value)) throw new Error('insert requires integer key and value');
        const limit=maxLoad*numSlots,manualLimit=2*numSlots,fires=numItems>=limit;
        const limitText=Number.isInteger(limit)?String(limit):limit.toFixed(2);
        t.v({key,value,numItems,'load factor':load()}).step(resizeOn?srcLine(blocks,LHR,'gate'):[0,LHT.load],
          resizeOn
            ? `Load factor is <code>${numItems} / ${numSlots} = ${load()}</code>. With <code>${maxLoadName}</code> in force, <code>numItems >= maxLoad * numSlots</code> (that is <code>${limitText}</code>) is <b>${fires}</b>.${maxLoad===2?'':` The manual's own gate of 2.0 (${manualLimit} items) is <b>${numItems>=manualLimit}</b>: the smaller threshold exists only so the rehash is visible in a short trace.`}`
            : `<code>numItems >= 2.0 * numSlots</code> (that is ${manualLimit} items) is <b>${fires}</b>. The quoted manual source is in force, so this branch only prints a warning.`,
          V());
        if(fires){
          if(!resizeOn){
            t.step([0,LHT.warn],'<code>printf("warning: resize not implemented!\\n")</code>. The function then continues to hash and insert because there is no return in this branch, so the table stays at its current size and the chains keep growing. Switch the <b>resize branch</b> field to the supplemental version to see the rehash this warning stands in for.',V());
          }else{
            if(numItems>=manualLimit)t.step([0,LHT.warn],'The quoted manual source reaches <code>printf("warning: resize not implemented!\\n")</code> here and then continues with the table unchanged. The supplemental branch below replaces that outcome; the quoted line is not rewritten.',V());
            resizeTable();
          }
        }
        const i=hashStep(key), chain=slots[i];
        let at=0;
        while(at<chain.length&&chain[at].k!==key){
          t.step([0,LHT.drec],`Node key ${chain[at].k} does not match ${key}; assign the recursive result to <code>list->next</code>.`,V(i,chain[at].k,'new'));
          at++;
        }
        if(at<chain.length){
          t.step([0,LHT.dsame],`<code>list->key == ${key}</code>.`,V(i,key,'new'));
          chain[at].v=value;
          t.step([0,LHT.dupd],`<code>list->value = ${value}</code>; <code>numItems</code> remains ${numItems}.`,V(i,key,'new'));
        } else {
          t.step([0,LHT.dnull],'<code>list == NULL</code>.',V(i));
          numItems++;
          t.v({numItems}).step([0,LHT.dinc],'<code>ht->numItems++</code>.',V(i));
          const blk=t.alloc('malloc',`node(key=${key}, value=${value})`,'sizeof(struct node)');
          const node={k:key,v:value,blk}; chain.push(node);
          t.step([0,LHT.nodemalloc],'<code>newNode</code> allocates a node and sets <code>key</code>, <code>value</code>, and <code>next = NULL</code>.',V(i,key,'new'));
        }
        t.step([0,LHT.islot],`Assign the returned chain head to <code>ht->slots[${i}]</code>.`,V(i));
        t.drop('value');
      } else if(cmd==='delete'){
        if(!Number.isInteger(key)) throw new Error('delete requires an integer key');
        const i=hashStep(key), chain=slots[i]; let at=0;
        while(at<chain.length&&chain[at].k!==key){ t.step([0,LHT.xrec],`Node key ${chain[at].k} does not match ${key}; recurse through <code>list->next</code>.`,V(i,chain[at].k,'new')); at++; }
        if(at===chain.length){ t.step([0,LHT.xnull],'<code>list == NULL</code>; return NULL and leave the table unchanged.',V(i)); }
        else {
          const node=chain[at];
          t.step([0,LHT.xmatch],`<code>list->key == ${key}</code>.`,V(i,key,'new'));
          numItems--; t.v({numItems}).step([0,LHT.xdec],'<code>ht->numItems--</code>.',V(i,key,'new'));
          t.step([0,LHT.xhead],`Save <code>newHead = list->next</code>${at+1<chain.length?` (key ${chain[at+1].k})`:' (NULL)'}.`,V(i,key,'new'));
          t.free(node.blk); t.step([0,LHT.xfree],'<code>free(list)</code>.',V(i,key,'dead'));
          chain.splice(at,1); t.step([0,LHT.delslot],`Assign the returned head to <code>ht->slots[${i}]</code>.`,V(i));
        }
      } else if(cmd==='contains'){
        if(!Number.isInteger(key)) throw new Error('contains requires an integer key');
        const i=hashStep(key), chain=slots[i]; let found=false;
        for(const node of chain){
          t.v({curr:node.k}).step([0,LHT.containsloop],`<code>curr</code> visits key ${node.k}.`,V(i,node.k,'new'));
          t.step([0,LHT.containsif],`<code>curr->key == key</code> is <b>${node.k===key}</b>.`,V(i,node.k,node.k===key?'new':'dead'));
          if(node.k===key){found=true;break;}
        }
        t.v({return:String(found)}).step([0,found?LHT.containstrue:LHT.containsfalse],`Return <code>${found}</code>.`,V(i,found?key:null,'new'));
        t.drop('curr','return');
      } else if(cmd==='get'){
        if(!Number.isInteger(key)) throw new Error('get requires an integer key');
        const i=hashStep(key), chain=slots[i]; let found=null;
        for(const node of chain){
          t.v({curr:node.k}).step([0,LHT.getloop],`<code>curr</code> visits key ${node.k}.`,V(i,node.k,'new'));
          t.step([0,LHT.getif],`<code>curr->key == key</code> is <b>${node.k===key}</b>.`,V(i,node.k,node.k===key?'new':'dead'));
          if(node.k===key){found=node;break;}
        }
        if(found){ t.v({return:found.v}).step([0,LHT.getret],`Return <code>curr->value = ${found.v}</code>.`,V(i,key,'new')); }
        else { t.step([0,LHT.geterr],`Print <code>error: key ${key} does not exist!</code>.`,V(i)); t.v({return:-1}).step([0,LHT.getminus],'Return <code>-1</code>.',V(i)); }
        t.drop('curr','return');
      } else if(cmd==='size'){
        t.v({return:numItems}).step([0,LHT.size],`<code>HashTableSize(ht)</code> returns <code>${numItems}</code>.`,V()); t.drop('return');
      } else if(cmd==='free'){
        for(let i=0;i<numSlots;i++){
          t.v({i}).step([0,LHT.freecall],`<code>freeList(ht->slots[${i}])</code>.`,V(i));
          while(slots[i].length){
            const node=slots[i][0];
            t.step([0,LHT.freeloop],`<code>curr != NULL</code> at key ${node.k}.`,V(i,node.k,'new'));
            t.free(node.blk); t.step([0,LHT.freenode],`<code>free(temp)</code> for key ${node.k}.`,V(i,node.k,'dead'));
            slots[i].shift();
          }
        }
        t.free(slotsBlk); t.step([0,LHT.freeslots],'<code>free(ht->slots)</code>.',V());
        t.free(htBlk); alive=false; numItems=0; t.v({numItems:0}).step([0,LHT.freeht],'<code>free(ht)</code>. All hash-table allocations are released.',V());
      } else {
        throw new Error('hash operations are: insert k v, delete k, contains k, get k, size, free');
      }
    }
    if(alive){ t.drop('key','i','load factor').step([0,LHT.newret],`Trace ended with <code>numItems = ${numItems}</code> and <code>numSlots = ${numSlots}</code>${resizes?`, after ${resizes} resize${resizes===1?'':'s'}`:''}. Use <code>free</code> to execute <code>HashTableFree</code>.`,V()); }
    return t;
  }
});
