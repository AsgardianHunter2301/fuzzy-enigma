/* ============================================================
   STACK ADT
   ============================================================ */
const SRC_STACK = `typedef struct stack *Stack;
typedef int Item;

Stack StackNew(void);
void StackFree(Stack s);
void StackPush(Stack s, Item item);
Item StackPop(Stack s);
int StackSize(Stack s);
Item StackPeek(Stack s);

struct stack {
    struct node *head;
    int size;
};

struct node {
    Item item;
    struct node *next;
};

Stack StackNew(void) {
    Stack s = malloc(sizeof(struct stack));
    if (s == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    s->head = NULL;
    s->size = 0;
    return s;
}

void StackFree(Stack s) {
    struct node *curr = s->head;
    while (curr != NULL) {
        struct node *temp = curr;
        curr = curr->next;
        free(temp);
    }
    free(s);
}

void StackPush(Stack s, Item item) {
    struct node *new = malloc(sizeof(struct node));
    if (new == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    new->item = item;
    new->next = s->head;
    s->head = new;
    s->size++;
}

Item StackPop(Stack s) {
    if (s->size == 0) {
        fprintf(stderr, "error: stack is empty!\\n");
        return 0;
    }

    struct node *newHead = s->head->next;
    Item it = s->head->item;
    free(s->head);
    s->head = newHead;
    s->size--;
    return it;
}

int StackSize(Stack s) {
    return s->size;
}

Item StackPeek(Stack s) {
    if (s->size == 0) {
        fprintf(stderr, "error: stack is empty!\\n");
        return 0;
    }

    return s->head->item;
}`;
const LST = lines(SRC_STACK,{
  newsig:'Stack StackNew(void)',newmalloc:'Stack s = malloc',newhead:'s->head = NULL;',newsize:'s->size = 0;',newret:'return s;',
  freesig:'void StackFree',freecurr:'struct node *curr = s->head;',freeloop:'while (curr != NULL)',freetemp:'struct node *temp = curr;',freenext:'curr = curr->next;',freenode:'free(temp);',freestruct:'free(s);',
  malloc:'struct node *new = malloc',setitem:'new->item = item;',setnext:'new->next = s->head;',sethead:'s->head = new;',inc:'s->size++;',guard:'if (s->size == 0)',newheadpop:'struct node *newHead = s->head->next;',save:'Item it = s->head->item;',free:'free(s->head);',relink:'s->head = newHead;',dec:'s->size--;',ret:'return it;',
  sizesig:'int StackSize',sizeret:'return s->size;',peeksig:'Item StackPeek',peekguard:['if (s->size == 0)',2],peekret:'return s->head->item;'
});

mod({
  id:'stack', group:'Abstract data types', name:"Stack ADT - complete lifecycle",
  blocks:[{title:'Stack interface and implementation',src:SRC_STACK,pages:'pp. 5-8'}],
  fields:[{k:'ops',label:'operations',def:'push 3, push 7, size, peek, pop, push 9, pop, free'}],
  run(inp){
    const ops=(inp.ops||'').split(/[,;]+/).map(s=>s.trim()).filter(Boolean);
    const t=new Trace(); let head=null, size=0, uid=0, alive=true;
    const stackBlk=t.alloc('malloc','Stack s','sizeof(struct stack)');
    const view=(mark,overrideHead)=>{
      const h=overrideHead===undefined?head:overrideHead;
      const nodes=[]; let c=h;
      while(c){
        const nextText=c.next?`next -> ${c.next.item}`:'next = NULL';
        nodes.push({v:c.item,sub:nextText,cls:mark&&mark.id===c.id?mark.cls:''});
        c=c.next;
      }
      return {kind:'linked',label:alive?`s->head ${h?'->':'= NULL'}    s->size = ${size}`:'Stack s has been freed',nodes};
    };
    t.v({size:0}).step([0,LST.newmalloc],'<code>StackNew</code>: allocate <code>struct stack</code>.',view());
    t.step([0,LST.newhead],'<code>s->head = NULL</code>.',view());
    t.step([0,LST.newsize],'<code>s->size = 0</code>, then return <code>s</code>.',view());

    for(const raw of ops){
      if(!alive){
        t.step([0,LST.freestruct],'Trace stopped: the stack object was already freed.',view());
        break;
      }
      const p=raw.split(/\s+/), cmd=p[0].toLowerCase();
      if(cmd==='push'){
        const item=Number(p[1]);
        if(!Number.isInteger(item)) throw new Error('push requires an integer Item');
        const blk=t.alloc('malloc',`node(item=${item})`,'sizeof(struct node)');
        const n={id:++uid,item,next:null,blk};
        t.v({item}).step([0,LST.malloc],`<code>StackPush(s, ${item})</code>: allocate <code>new</code>.`,view());
        t.step([0,LST.setitem],`<code>new->item = ${item}</code>.`,{kind:'linked',label:'new (not yet linked)',nodes:[{v:item,sub:'next = ?',cls:'new'}]});
        n.next=head;
        t.step([0,LST.setnext],`<code>new->next = s->head</code>${head?` (node ${head.item})`:' (NULL)'}.`,{kind:'linked',lists:[{label:'new',nodes:[{v:item,sub:head?`next -> ${head.item}`:'next = NULL',cls:'new'}].concat(chainOf(head))}]});
        head=n;
        t.step([0,LST.sethead],'<code>s->head = new</code>.',view({id:n.id,cls:'new'}));
        size++;
        t.v({size}).step([0,LST.inc],'<code>s->size++</code>.',view({id:n.id,cls:'new'}));
        t.drop('item');
      } else if(cmd==='pop'){
        t.step([0,LST.guard],`<code>s->size == 0</code> is <b>${size===0}</b>.`,view(size?{id:head.id,cls:'new'}:null));
        if(size===0){
          t.v({return:0}).step([0,LST.ret],'The manual prints <code>error: stack is empty!</code> and returns <code>0</code>.',view());
          t.drop('return');
          continue;
        }
        const old=head, newHead=head.next;
        t.step([0,LST.newheadpop],`<code>newHead = s->head->next</code>${newHead?` (node ${newHead.item})`:' (NULL)'}.`,view({id:old.id,cls:'new'}));
        const it=old.item;
        t.v({it}).step([0,LST.save],`<code>it = s->head->item = ${it}</code>.`,view({id:old.id,cls:'new'}));
        t.free(old.blk);
        t.step([0,LST.free],'<code>free(s->head)</code>. The freed node is no longer safe to dereference.',view({id:old.id,cls:'dead'}));
        head=newHead;
        t.step([0,LST.relink],'<code>s->head = newHead</code>.',view());
        size--;
        t.v({size}).step([0,LST.dec],'<code>s->size--</code>.',view());
        t.v({return:it}).step([0,LST.ret],`Return <code>${it}</code>.`,view());
        t.drop('it','return');
      } else if(cmd==='size'){
        t.v({return:size}).step([0,LST.sizeret],`<code>StackSize(s)</code> returns <code>${size}</code>.`,view());
        t.drop('return');
      } else if(cmd==='peek'){
        t.step([0,LST.peekguard],`<code>s->size == 0</code> is <b>${size===0}</b>.`,view(size?{id:head.id,cls:'new'}:null));
        const result=size===0?0:head.item;
        t.v({return:result}).step([0,LST.peekret],size===0?'The manual prints the empty-stack error and returns <code>0</code>.':`Return <code>s->head->item = ${result}</code> without changing any pointer.`,view(size?{id:head.id,cls:'new'}:null));
        t.drop('return');
      } else if(cmd==='free'){
        let curr=head;
        t.step([0,LST.freecurr],`<code>curr = s->head</code>${curr?` (node ${curr.item})`:' (NULL)'}.`,view(curr?{id:curr.id,cls:'new'}:null));
        while(curr!==null){
          t.step([0,LST.freeloop],'<code>curr != NULL</code>, so another node must be released.',view({id:curr.id,cls:'new'}));
          const temp=curr;
          t.step([0,LST.freetemp],`<code>temp = curr</code> (node ${temp.item}).`,view({id:temp.id,cls:'new'}));
          curr=curr.next;
          t.v({curr:curr?curr.item:'NULL'}).step([0,LST.freenext],`<code>curr = curr->next</code>${curr?` (node ${curr.item})`:' (NULL)'}.`,view({id:temp.id,cls:'new'}));
          t.free(temp.blk);
          t.step([0,LST.freenode],`<code>free(temp)</code> for node ${temp.item}.`,view({id:temp.id,cls:'dead'}));
          head=curr; size--;
        }
        t.drop('curr').step([0,LST.freeloop],'<code>curr == NULL</code>: the node loop is complete.',view());
        t.free(stackBlk); alive=false; head=null; size=0;
        t.v({size:0}).step([0,LST.freestruct],'<code>free(s)</code>. All stack allocations are released.',view());
      } else {
        throw new Error('stack operations are: push n, pop, size, peek, free');
      }
    }
    if(alive){
      const live=t.heap.filter(b=>b.live).length;
      t.step([0,LST.newret],`Trace ended with ${live} live allocation${live===1?'':'s'}. Use the <code>free</code> operation to execute <code>StackFree</code>.`,view());
    }
    return t;
  }
});
function chainOf(n){const out=[];while(n){out.push({v:n.item,sub:n.next?`next -> ${n.next.item}`:'next = NULL'});n=n.next;}return out;}

/* ============================================================
   QUEUE ADT/* ============================================================
   QUEUE ADT
   ============================================================ */
const SRC_QUEUE = `typedef int Item;
typedef struct queue *Queue;

Queue QueueNew(void);
void QueueFree(Queue q);
void QueueEnqueue(Queue q, Item it);
Item QueueDequeue(Queue q);
int QueueSize(Queue q);
Item QueuePeek(Queue q);

struct queue {
    struct node *head;
    struct node *tail;
    int size;
};

struct node {
    Item item;
    struct node *next;
};

static struct node *newNode(Item it);

Queue QueueNew(void) {
    Queue q = malloc(sizeof(struct queue));
    if (q == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    q->head = NULL;
    q->tail = NULL;
    q->size = 0;
    return q;
}

void QueueFree(Queue q) {
    struct node *curr = q->head;
    while (curr != NULL) {
        struct node *temp = curr;
        curr = curr->next;
        free(temp);
    }
    free(q);
}

void QueueEnqueue(Queue q, Item it) {
    struct node *n = newNode(it);
    if (q->size == 0) {
        q->head = n;
    } else {
        q->tail->next = n;
    }
    q->tail = n;
    q->size++;
}

static struct node *newNode(Item it) {
    struct node *n = malloc(sizeof(*n));
    if (n == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    n->item = it;
    n->next = NULL;
    return n;
}

Item QueueDequeue(Queue q) {
    if (q->size == 0) {
        fprintf(stderr, "error: queue is empty!\\n");
        return 0;
    }

    struct node *newHead = q->head->next;
    Item it = q->head->item;
    free(q->head);
    q->head = newHead;
    if (newHead == NULL) {
        q->tail = NULL;
    }
    q->size--;
    return it;
}

int QueueSize(Queue q) {
    return q->size;
}

Item QueuePeek(Queue q) {
    if (q->size == 0) {
        fprintf(stderr, "error: queue is empty!\\n");
        return 0;
    }

    return q->head->item;
}`;
const LQU = lines(SRC_QUEUE,{
  newsig:'Queue QueueNew(void)',newmalloc:'Queue q = malloc',newhead:'q->head = NULL;',newtail:'q->tail = NULL;',newsize:'q->size = 0;',newret:'return q;',
  freesig:'void QueueFree',freecurr:'struct node *curr = q->head;',freeloop:'while (curr != NULL)',freetemp:'struct node *temp = curr;',freenext:'curr = curr->next;',freenode:'free(temp);',freestruct:'free(q);',
  make:'struct node *n = newNode(it);',empty:'if (q->size == 0) {',sethead:'q->head = n;',link:'q->tail->next = n;',settail:'q->tail = n;',inc:'q->size++;',
  nodemalloc:'struct node *n = malloc(sizeof(*n));',nodeitem:'n->item = it;',nodenext:'n->next = NULL;',noderet:'return n;',
  guard:['if (q->size == 0)',2],newheadpop:'struct node *newHead = q->head->next;',save:'Item it = q->head->item;',free:'free(q->head);',relink:'q->head = newHead;',nulltest:'if (newHead == NULL)',nulltail:'q->tail = NULL;',dec:'q->size--;',ret:'return it;',
  sizesig:'int QueueSize',sizeret:'return q->size;',peeksig:'Item QueuePeek',peekguard:['if (q->size == 0)',2],peekret:'return q->head->item;'
});

mod({
  id:'queue', group:'Abstract data types', name:"Queue ADT - complete lifecycle",
  blocks:[{title:'Queue interface and implementation',src:SRC_QUEUE,pages:'pp. 8-11'}],
  fields:[{k:'ops',label:'operations',def:'enqueue 4, enqueue 8, size, peek, dequeue, enqueue 2, dequeue, free'}],
  run(inp){
    const ops=(inp.ops||'').split(/[,;]+/).map(s=>s.trim()).filter(Boolean);
    const t=new Trace(); let head=null, tail=null, size=0, uid=0, alive=true;
    const queueBlk=t.alloc('malloc','Queue q','sizeof(struct queue)');
    const view=(mark)=>{
      const nodes=[]; let c=head;
      while(c){
        const ptr=[];
        if(c===head) ptr.push('head');
        if(c===tail) ptr.push('tail');
        ptr.push(c.next?`next -> ${c.next.item}`:'next = NULL');
        nodes.push({v:c.item,sub:ptr.join(' | '),cls:mark&&mark.id===c.id?mark.cls:''});
        c=c.next;
      }
      return {kind:'linked',label:alive?`q->head ${head?'->':'= NULL'}    q->tail ${tail?'->':'= NULL'}    q->size = ${size}`:'Queue q has been freed',nodes};
    };
    t.v({size:0}).step([0,LQU.newmalloc],'<code>QueueNew</code>: allocate <code>struct queue</code>.',view());
    t.step([0,LQU.newhead],'<code>q->head = NULL</code>.',view());
    t.step([0,LQU.newtail],'<code>q->tail = NULL</code>.',view());
    t.step([0,LQU.newsize],'<code>q->size = 0</code>, then return <code>q</code>.',view());

    for(const raw of ops){
      if(!alive){ t.step([0,LQU.freestruct],'Trace stopped: the queue object was already freed.',view()); break; }
      const p=raw.split(/\s+/), cmd=p[0].toLowerCase();
      if(cmd==='enqueue'){
        const it=Number(p[1]);
        if(!Number.isInteger(it)) throw new Error('enqueue requires an integer Item');
        t.v({it}).step([0,LQU.make],`<code>QueueEnqueue(q, ${it})</code> calls <code>newNode(${it})</code>.`,view());
        const blk=t.alloc('malloc',`node(item=${it})`,'sizeof(*n)');
        const n={id:++uid,item:it,next:null,blk};
        t.step([0,LQU.nodemalloc],'<code>newNode</code> allocates <code>n</code>.',view());
        t.step([0,LQU.nodeitem],`<code>n->item = ${it}</code>.`,{kind:'linked',label:'n (not yet linked)',nodes:[{v:it,sub:'next = ?',cls:'new'}]});
        t.step([0,LQU.nodenext],'<code>n->next = NULL</code>.',{kind:'linked',label:'n (not yet linked)',nodes:[{v:it,sub:'next = NULL',cls:'new'}]});
        t.step([0,LQU.empty],`<code>q->size == 0</code> is <b>${size===0}</b>.`,view());
        if(size===0){ head=n; t.step([0,LQU.sethead],'<code>q->head = n</code>.',view({id:n.id,cls:'new'})); }
        else { tail.next=n; t.step([0,LQU.link],`<code>q->tail->next = n</code>; node ${tail.item} now points to node ${it}.`,view({id:n.id,cls:'new'})); }
        tail=n;
        t.step([0,LQU.settail],'<code>q->tail = n</code>.',view({id:n.id,cls:'new'}));
        size++;
        t.v({size}).step([0,LQU.inc],'<code>q->size++</code>.',view({id:n.id,cls:'new'}));
        t.drop('it');
      } else if(cmd==='dequeue'){
        t.step([0,LQU.guard],`<code>q->size == 0</code> is <b>${size===0}</b>.`,view(size?{id:head.id,cls:'new'}:null));
        if(size===0){
          t.v({return:0}).step([0,LQU.ret],'The manual prints <code>error: queue is empty!</code> and returns <code>0</code>.',view());
          t.drop('return'); continue;
        }
        const old=head, newHead=head.next, it=head.item;
        t.step([0,LQU.newheadpop],`<code>newHead = q->head->next</code>${newHead?` (node ${newHead.item})`:' (NULL)'}.`,view({id:old.id,cls:'new'}));
        t.v({it}).step([0,LQU.save],`<code>it = q->head->item = ${it}</code>.`,view({id:old.id,cls:'new'}));
        t.free(old.blk);
        t.step([0,LQU.free],'<code>free(q->head)</code>.',view({id:old.id,cls:'dead'}));
        head=newHead;
        t.step([0,LQU.relink],'<code>q->head = newHead</code>.',view());
        t.step([0,LQU.nulltest],`<code>newHead == NULL</code> is <b>${newHead===null}</b>.`,view());
        if(newHead===null){ tail=null; t.step([0,LQU.nulltail],'<code>q->tail = NULL</code>.',view()); }
        size--;
        t.v({size}).step([0,LQU.dec],'<code>q->size--</code>.',view());
        t.v({return:it}).step([0,LQU.ret],`Return <code>${it}</code>.`,view());
        t.drop('it','return');
      } else if(cmd==='size'){
        t.v({return:size}).step([0,LQU.sizeret],`<code>QueueSize(q)</code> returns <code>${size}</code>.`,view());
        t.drop('return');
      } else if(cmd==='peek'){
        t.step([0,LQU.peekguard],`<code>q->size == 0</code> is <b>${size===0}</b>.`,view(size?{id:head.id,cls:'new'}:null));
        const result=size===0?0:head.item;
        t.v({return:result}).step([0,LQU.peekret],size===0?'The manual prints the empty-queue error and returns <code>0</code>.':`Return <code>q->head->item = ${result}</code> without changing the queue.`,view(size?{id:head.id,cls:'new'}:null));
        t.drop('return');
      } else if(cmd==='free'){
        let curr=head;
        t.step([0,LQU.freecurr],`<code>curr = q->head</code>${curr?` (node ${curr.item})`:' (NULL)'}.`,view(curr?{id:curr.id,cls:'new'}:null));
        while(curr!==null){
          t.step([0,LQU.freeloop],'<code>curr != NULL</code>.',view({id:curr.id,cls:'new'}));
          const temp=curr;
          t.step([0,LQU.freetemp],`<code>temp = curr</code> (node ${temp.item}).`,view({id:temp.id,cls:'new'}));
          curr=curr.next;
          t.v({curr:curr?curr.item:'NULL'}).step([0,LQU.freenext],'<code>curr = curr->next</code>.',view({id:temp.id,cls:'new'}));
          t.free(temp.blk);
          t.step([0,LQU.freenode],`<code>free(temp)</code> for node ${temp.item}.`,view({id:temp.id,cls:'dead'}));
          head=curr; size--;
        }
        tail=null;
        t.drop('curr').step([0,LQU.freeloop],'<code>curr == NULL</code>: the node loop is complete.',view());
        t.free(queueBlk); alive=false; head=null; size=0;
        t.v({size:0}).step([0,LQU.freestruct],'<code>free(q)</code>. All queue allocations are released.',view());
      } else {
        throw new Error('queue operations are: enqueue n, dequeue, size, peek, free');
      }
    }
    if(alive){
      const live=t.heap.filter(b=>b.live).length;
      t.step([0,LQU.newret],`Trace ended with ${live} live allocation${live===1?'':'s'}. Use the <code>free</code> operation to execute <code>QueueFree</code>.`,view());
    }
    return t;
  }
});
