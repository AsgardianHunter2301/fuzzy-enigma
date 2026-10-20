/* ============================================================
   BINARY SEARCH TREES/* ============================================================
   BINARY SEARCH TREES
   ============================================================ */
const SRC_BST = `struct node {
    int value;
    struct node *left;
    struct node *right;
};

struct node *bstInsert(struct node *tree, int val) {
    if (tree == NULL) {
        return newNode(val);
    } else if (val < tree->value) {
        tree->left = bstInsert(tree->left, val);
    } else if (val > tree->value) {
        tree->right = bstInsert(tree->right, val);
    }
    return tree;
}

bool bstSearch(struct node *tree, int val) {
    if (tree == NULL) {
        return false;
    } else if (val < tree->value) {
        return bstSearch(tree->left, val);
    } else if (val > tree->value) {
        return bstSearch(tree->right, val);
    } else {  // (val == tree->value)
        return true;
    }
}`;
const LBST = lines(SRC_BST,{inull:'if (tree == NULL) {',inew:'return newNode(val);',ilt:'} else if (val < tree->value) {',ileft:'tree->left = bstInsert(tree->left, val);',igt:'} else if (val > tree->value) {',iright:'tree->right = bstInsert(tree->right, val);',iret:'return tree;',
  snull:['if (tree == NULL) {',2],sfalse:'return false;',slt:['} else if (val < tree->value) {',2],sleft:'return bstSearch(tree->left, val);',sgt:['} else if (val > tree->value) {',2],sright:'return bstSearch(tree->right, val);',seq:'} else {  // (val == tree->value)',strue:'return true;'});

const SRC_BSTDEL = `struct node *bstDelete(struct node *tree, int val) {
    if (tree == NULL) {
        return tree;
    } else if (val < tree->value) {
        tree->left = bstDelete(tree->left, val);
    } else if (val > tree->value) {
        tree->right = bstDelete(tree->right, val);
    } else {
        struct node *new;
        if (tree->left == NULL) {
            new = tree->right;
        } else if (tree->right == NULL) {
            new = tree->left;
        } else {
            new = bstJoin(tree->left, tree->right);
        }
        free(tree);
        tree = new;
    }
    return tree;
}

static struct node *bstJoin(struct node *t1, struct node *t2) {
    if (t1 == NULL) {
        return t2;
    }
    if (t2 == NULL) {
        return t1;
    }

    struct node *curr = t2;
    struct node *parent = NULL;
    while (curr->left != NULL) {
        parent = curr;
        curr = curr->left;
    }

    if (parent != NULL) {
        parent->left = curr->right;
        curr->right = t2;
    }
    curr->left = t1;
    return curr;
}`;
const LDEL = lines(SRC_BSTDEL,{null:'if (tree == NULL) {',lt:'} else if (val < tree->value) {',left:'tree->left = bstDelete(tree->left, val);',gt:'} else if (val > tree->value) {',right:'tree->right = bstDelete(tree->right, val);',found:'struct node *new;',noleft:'if (tree->left == NULL) {',takeright:'new = tree->right;',noright:'} else if (tree->right == NULL) {',takeleft:'new = tree->left;',join:'new = bstJoin(tree->left, tree->right);',free:'free(tree);',assign:'tree = new;',
  jt1:'if (t1 == NULL) {',jt2:'if (t2 == NULL) {',jcurr:'struct node *curr = t2;',jloop:'while (curr->left != NULL) {',jdown:'curr = curr->left;',jparent:'if (parent != NULL) {',junlink:'parent->left = curr->right;',jright:'curr->right = t2;',jleft:'curr->left = t1;',jret:'return curr;'});

const SRC_BST_FULL = `struct node {
    int value;
    struct node *left;
    struct node *right;
};

static struct node *newNode(int val);
static struct node *bstJoin(struct node *t1, struct node *t2);

struct node *bstNew(void) {
    return NULL;
}

void bstFree(struct node *tree) {
    if (tree == NULL) {
        return;
    }

    bstFree(tree->left);
    bstFree(tree->right);
    free(tree);
}

struct node *bstInsert(struct node *tree, int val) {
    if (tree == NULL) {
        return newNode(val);
    } else if (val < tree->value) {
        tree->left = bstInsert(tree->left, val);
    } else if (val > tree->value) {
        tree->right = bstInsert(tree->right, val);
    }
    return tree;
}

static struct node *newNode(int val) {
    struct node *new = malloc(sizeof(struct node));
    if (new == NULL) {
        fprintf(stderr, "error: out of memory\\n");
        exit(EXIT_FAILURE);
    }

    new->value = val;
    new->left = NULL;
    new->right = NULL;
    return new;
}

bool bstSearch(struct node *tree, int val) {
    if (tree == NULL) {
        return false;
    } else if (val < tree->value) {
        return bstSearch(tree->left, val);
    } else if (val > tree->value) {
        return bstSearch(tree->right, val);
    } else {  // (val == tree->value)
        return true;
    }
}

struct node *bstDelete(struct node *tree, int val) {
    if (tree == NULL) {
        return tree;
    } else if (val < tree->value) {
        tree->left = bstDelete(tree->left, val);
    } else if (val > tree->value) {
        tree->right = bstDelete(tree->right, val);
    } else {
        struct node *new;
        if (tree->left == NULL) {
            new = tree->right;
        } else if (tree->right == NULL) {
            new = tree->left;
        } else {
            new = bstJoin(tree->left, tree->right);
        }
        free(tree);
        tree = new;
    }
    return tree;
}

static struct node *bstJoin(struct node *t1, struct node *t2) {
    if (t1 == NULL) {
        return t2;
    }

    if (t2 == NULL) {
        return t1;
    }

    struct node *curr = t2;
    struct node *parent = NULL;
    while (curr->left != NULL) {
        parent = curr;
        curr = curr->left;
    }

    if (parent != NULL) {
        parent->left = curr->right;
        curr->right = t2;
    }
    curr->left = t1;
    return curr;
}`;

/* full-source line map (the source pane displays SRC_BST_FULL) */
const LBSTF = lines(SRC_BST_FULL,{
  newret:['return NULL;',1],freesig:'void bstFree',freenull:['if (tree == NULL)',1],freeleft:'bstFree(tree->left);',freeright:'bstFree(tree->right);',freeone:['free(tree);',1],
  inull:['if (tree == NULL)',2],inew:'return newNode(val);',ilt:['} else if (val < tree->value)',1],ileft:'tree->left = bstInsert(tree->left, val);',igt:['} else if (val > tree->value)',1],iright:'tree->right = bstInsert(tree->right, val);',iret:['return tree;',2],
  nmalloc:'struct node *new = malloc(sizeof(struct node));',nvalue:'new->value = val;',nleft:'new->left = NULL;',nright:'new->right = NULL;',nret:'return new;',
  snull:['if (tree == NULL)',3],sfalse:'return false;',slt:['} else if (val < tree->value)',2],sleft:'return bstSearch(tree->left, val);',sgt:['} else if (val > tree->value)',2],sright:'return bstSearch(tree->right, val);',strue:'return true;',
  dnull:['if (tree == NULL)',4],dleft:'tree->left = bstDelete(tree->left, val);',dright:'tree->right = bstDelete(tree->right, val);',dfound:'struct node *new;',dnoleft:'if (tree->left == NULL)',dtakeright:'new = tree->right;',dnoright:'} else if (tree->right == NULL)',dtakeleft:'new = tree->left;',djoin:'new = bstJoin(tree->left, tree->right);',dfree:['free(tree);',2],dassign:'tree = new;',dret:['return tree;',3],
  jt1:'if (t1 == NULL)',jt2:'if (t2 == NULL)',jcurr:'struct node *curr = t2;',jparent:'struct node *parent = NULL;',jloop:'while (curr->left != NULL)',jsetparent:'parent = curr;',jdown:'curr = curr->left;',jif:'if (parent != NULL)',junlink:'parent->left = curr->right;',jright:'curr->right = t2;',jleft:'curr->left = t1;',jret:'return curr;'
});

/* tree helpers */
const N = (v,blk=null) => ({v,l:null,r:null,blk});
function treeInsert(n,v,nodeFactory){
  if(!n) return nodeFactory?nodeFactory(v):N(v);
  if(v<n.v) n.l=treeInsert(n.l,v,nodeFactory); else if(v>n.v) n.r=treeInsert(n.r,v,nodeFactory);
  return n;
}
function buildTree(vals,t){
  let r=null;
  vals.forEach(v=>{r=treeInsert(r,v,x=>N(x,t?t.alloc('malloc',`node(value=${x})`,'sizeof(struct node)'):null));});
  return r;
}
function clone(n){ return n?{v:n.v,l:clone(n.l),r:clone(n.r)}:null; }
function heightOf(n){ return n?1+Math.max(heightOf(n.l),heightOf(n.r)):-1; }
function pathCls(path,c){const o={};path.forEach(v=>o[v]=c);return o;}
function countNodes(n){return n?1+countNodes(n.l)+countNodes(n.r):0;}

mod({
  id:'bstins', group:'Binary search trees', name:'BST insert',
  blocks:[{title:'BST full implementation',src:SRC_BST_FULL,pages:'pp. 11-14'}],
  fields:[{k:'seq',label:'insert in order',def:'50 30 70 20 40 60 80 35'}],
  run(inp){
    const vals=parseInts(inp.seq,'seq','tree values'), t=new Trace(); let root=null;
    t.step([0,LBSTF.newret],'<code>bstNew</code> returns <code>NULL</code>.',{kind:'tree',root:null});
    for(const val of vals){
      t.v({val}).step([0,LBSTF.inull],`<code>bstInsert(tree, ${val})</code>.`,{kind:'tree',root:clone(root),cls:root?{[root.v]:'act'}:{}});
      if(root===null){
        const blk=t.alloc('malloc',`node(value=${val})`,'sizeof(struct node)');
        t.step([0,LBSTF.nmalloc],`<code>newNode(${val})</code> allocates a node.`,{kind:'tree',root:null});
        root=N(val,blk);
        t.step([0,LBSTF.nvalue],`<code>new->value = ${val}</code>; <code>new->left = NULL</code>; <code>new->right = NULL</code>.`,{kind:'tree',root:clone(root),cls:{[val]:'hit'}});
        continue;
      }
      let cur=root, parent=null, side=null, duplicate=false; const path=[];
      while(cur){
        path.push(cur.v);
        if(val<cur.v){
          t.step([0,LBSTF.ileft],`<code>${val} &lt; ${cur.v}</code>: assign the recursive result to <code>tree->left</code>.`,{kind:'tree',root:clone(root),cls:pathCls(path,'act')});
          parent=cur; side='l'; cur=cur.l;
        } else if(val>cur.v){
          t.step([0,LBSTF.iright],`<code>${val} &gt; ${cur.v}</code>: assign the recursive result to <code>tree->right</code>.`,{kind:'tree',root:clone(root),cls:pathCls(path,'act')});
          parent=cur; side='r'; cur=cur.r;
        } else {
          duplicate=true;
          t.step([0,LBSTF.iret],`Neither comparison branch is taken because <code>${val} == ${cur.v}</code>; return the existing tree unchanged.`,{kind:'tree',root:clone(root),cls:{[cur.v]:'bad'}});
          break;
        }
      }
      if(!duplicate){
        const blk=t.alloc('malloc',`node(value=${val})`,'sizeof(struct node)');
        t.step([0,LBSTF.nmalloc],`The recursive call reached <code>tree == NULL</code>; <code>newNode(${val})</code> allocates the node.`,{kind:'tree',root:clone(root),cls:pathCls(path,'act')});
        const nn=N(val,blk); parent[side]=nn;
        t.step([0,side==='l'?LBSTF.ileft:LBSTF.iright],`The returned node is stored in <code>${side==='l'?'tree->left':'tree->right'}</code>.`,{kind:'tree',root:clone(root),cls:{[val]:'hit'}});
      }
    }
    t.drop('val').step([0,LBSTF.iret],`Final BST contains ${countNodes(root)} node${countNodes(root)===1?'':'s'}. The nodes remain allocated until <code>bstFree</code>.`,{kind:'tree',root:clone(root)});
    return t;
  }
});

mod({
  id:'bstsearch', group:'Binary search trees', name:'BST search',
  blocks:[{title:'BST full implementation',src:SRC_BST_FULL,pages:'pp. 11-14'}],
  fields:[{k:'seq',label:'build tree from',def:'50 30 70 20 40 60 80'},{k:'val',label:'search for',def:'40',w:5}],
  run(inp){
    const t=new Trace(), root=buildTree(parseInts(inp.seq,'seq','tree values'),t), val=Number(inp.val);
    t.step([0,LBSTF.nret],'Initial tree nodes were created by <code>newNode</code>.',{kind:'tree',root:clone(root)});
    let cur=root; const path=[];
    while(cur){
      path.push(cur.v);
      t.v({val,'tree->value':cur.v}).step([0,LBSTF.snull],'<code>tree != NULL</code>.',{kind:'tree',root:clone(root),cls:pathCls(path,'act')});
      if(val<cur.v){ t.step([0,LBSTF.sleft],`<code>${val} &lt; ${cur.v}</code>: return <code>bstSearch(tree->left, val)</code>.`,{kind:'tree',root:clone(root),cls:pathCls(path,'act')}); cur=cur.l; }
      else if(val>cur.v){ t.step([0,LBSTF.sright],`<code>${val} &gt; ${cur.v}</code>: return <code>bstSearch(tree->right, val)</code>.`,{kind:'tree',root:clone(root),cls:pathCls(path,'act')}); cur=cur.r; }
      else { t.v({return:'true'}).step([0,LBSTF.strue],`<code>${val} == ${cur.v}</code>; return <code>true</code>.`,{kind:'tree',root:clone(root),cls:{[cur.v]:'hit'}}); return t; }
    }
    t.v({return:'false'}).step([0,LBSTF.sfalse],'<code>tree == NULL</code>; return <code>false</code>.',{kind:'tree',root:clone(root),cls:pathCls(path,'bad')});
    return t;
  }
});

mod({
  id:'bstdel', group:'Binary search trees', name:'BST delete (with bstJoin)',
  blocks:[{title:'BST full implementation',src:SRC_BST_FULL,pages:'pp. 11-14'}],
  fields:[{k:'seq',label:'build tree from',def:'50 30 70 20 40 60 80 35 45'},{k:'val',label:'delete',def:'30',w:5}],
  run(inp){
    const t=new Trace(); let root=buildTree(parseInts(inp.seq,'seq','tree values'),t); const val=Number(inp.val);
    const V=(cls)=>({kind:'tree',root:clone(root),cls:cls||{}});
    t.step([0,LBSTF.nret],'Initial tree nodes were created by <code>newNode</code>.',V());
    const path=[]; let cur=root,parent=null,side=null;
    while(cur&&cur.v!==val){
      path.push(cur.v);
      if(val<cur.v){ t.step([0,LBSTF.dleft],`<code>${val} &lt; ${cur.v}</code>: recurse through <code>tree->left</code>.`,V(pathCls(path,'act'))); parent=cur;side='l';cur=cur.l; }
      else { t.step([0,LBSTF.dright],`<code>${val} &gt; ${cur.v}</code>: recurse through <code>tree->right</code>.`,V(pathCls(path,'act'))); parent=cur;side='r';cur=cur.r; }
    }
    if(!cur){ t.step([0,LBSTF.dnull],'<code>tree == NULL</code>; return the tree unchanged.',V(pathCls(path,'bad'))); return t; }
    t.step([0,LBSTF.dfound],`Found node ${cur.v}; compute <code>new</code> before freeing it.`,V({[cur.v]:'bad'}));
    let repl;
    if(cur.l===null){ repl=cur.r; t.step([0,LBSTF.dtakeright],`<code>tree->left == NULL</code>; <code>new = tree->right</code>${repl?` (${repl.v})`:' (NULL)'}.`,V({[cur.v]:'bad'})); }
    else if(cur.r===null){ repl=cur.l; t.step([0,LBSTF.dtakeleft],`<code>tree->right == NULL</code>; <code>new = tree->left</code> (${repl.v}).`,V({[cur.v]:'bad'})); }
    else {
      const t1=cur.l,t2=cur.r;
      t.step([0,LBSTF.djoin],'<code>new = bstJoin(tree->left, tree->right)</code>.',V({[cur.v]:'bad',[t1.v]:'act',[t2.v]:'act'}));
      let c=t2,p=null;
      t.step([0,LBSTF.jcurr],`<code>curr = t2</code> (${c.v}); <code>parent = NULL</code>.`,V({[c.v]:'act'}));
      while(c.l!==null){ p=c; t.step([0,LBSTF.jsetparent],`<code>parent = curr</code> (${p.v}).`,V({[p.v]:'act'})); c=c.l; t.v({curr:c.v}).step([0,LBSTF.jdown],`<code>curr = curr->left</code> (${c.v}).`,V({[c.v]:'act'})); }
      t.step([0,LBSTF.jloop],`<code>curr->left == NULL</code>; selected node ${c.v}.`,V({[c.v]:'hit'}));
      if(p!==null){
        p.l=c.r; t.step([0,LBSTF.junlink],`<code>parent->left = curr->right</code>${c.r?` (${c.r.v})`:' (NULL)'}.`,V({[p.v]:'act',[c.v]:'hit'}));
        c.r=t2; t.step([0,LBSTF.jright],'<code>curr->right = t2</code>.',V({[c.v]:'hit'}));
      } else {
        t.step([0,LBSTF.jif],'<code>parent == NULL</code>; the <code>curr->right = t2</code> assignment is skipped.',V({[c.v]:'hit'}));
      }
      c.l=t1; t.step([0,LBSTF.jleft],'<code>curr->left = t1</code>.',V({[c.v]:'hit'}));
      repl=c;
    }
    t.free(cur.blk);
    t.step([0,LBSTF.dfree],`<code>free(tree)</code> releases node ${val}.`,V({[cur.v]:'dead'}));
    if(parent===null) root=repl; else parent[side]=repl;
    t.step([0,LBSTF.dassign],'<code>tree = new</code>; recursive returns reconnect the updated subtree.',V(repl?{[repl.v]:'hit'}:{}));
    return t;
  }
});

mod({
  id:'bstfree', group:'Binary search trees', name:'BST free (post-order)',
  blocks:[{title:'BST full implementation',src:SRC_BST_FULL,pages:'pp. 11-14'}],
  fields:[{k:'seq',label:'build tree from',def:'50 30 70 20 40 60 80'}],
  run(inp){
    const t=new Trace(); let root=buildTree(parseInts(inp.seq,'seq','tree values'),t);
    const V=(cls)=>({kind:'tree',root:clone(root),cls:cls||{}});
    t.step([0,LBSTF.nret],'Initial tree nodes were created by <code>newNode</code>.',V());
    function release(n,path,parent,side){
      t.v({tree:n?n.v:'NULL'}).step([0,LBSTF.freenull],n===null?'<code>tree == NULL</code>; return.':'<code>tree != NULL</code>; free both subtrees first.',V(n?pathCls(path.concat(n.v),'act'):{}));
      if(n===null) return;
      t.step([0,LBSTF.freeleft],`<code>bstFree(tree->left)</code> from node ${n.v}.`,V({[n.v]:'act'}));
      release(n.l,path.concat(n.v),n,'l');
      t.step([0,LBSTF.freeright],`<code>bstFree(tree->right)</code> from node ${n.v}.`,V({[n.v]:'act'}));
      release(n.r,path.concat(n.v),n,'r');
      t.free(n.blk);
      t.step([0,LBSTF.freeone],`<code>free(tree)</code> for node ${n.v}.`,V({[n.v]:'dead'}));
      if(parent) parent[side]=null; else root=null;
    }
    release(root,[],null,null);
    t.drop('tree').step([0,LBSTF.freenull],'All nodes have been released.',{kind:'tree',root:null});
    return t;
  }
});

/* ============================================================
   AVL TREES/* ============================================================
   AVL TREES  (pseudocode in the manual)
   ============================================================ */
const PS_AVL = `avlInsert(t, v):
    Input:  AVL tree t, item v
    Output: t with v inserted

    if t is empty:
        return new node containing v
    else if v < t->item:
        t->left = avlInsert(t->left, v)
    else if v > t->item:
        t->right = avlInsert(t->right, v)
    else:
        return t
    return avlRebalance(t)

avlRebalance(t):
    Input:  possibly unbalanced tree t
    Output: balanced t

    bal = balance(t)
    if bal > 1:
        if balance(t->left) < 0:
            t->left = rotateLeft(t->left)
        t = rotateRight(t)
    else if bal < -1:
        if balance(t->right) > 0:
            t->right = rotateRight(t->right)
        t = rotateLeft(t)
    return t

balance(t):
    Input:  tree t
    Output: balance factor of t

    return height(t->left) - height(t->right)`;
const LAVL = lines(PS_AVL,{empty:'if t is empty:',new:'return new node containing v',lt:'else if v < t->item:',left:'t->left = avlInsert(t->left, v)',gt:'else if v > t->item:',right:'t->right = avlInsert(t->right, v)',dup:'return t',reb:'return avlRebalance(t)',
  bal:'bal = balance(t)',pos:'if bal > 1:',lr:'if balance(t->left) < 0:',rotL1:'t->left = rotateLeft(t->left)',rotR:'t = rotateRight(t)',neg:'else if bal < -1:',rl:'if balance(t->right) > 0:',rotR1:'t->right = rotateRight(t->right)',rotL:'t = rotateLeft(t)',retbal:'    return t',
  formula:'return height(t->left) - height(t->right)'});

const PS_AVLDEL = `avlDelete(t, v):
    Input:  AVL tree t, item v
    Output: t with v deleted

    if t is empty:
        return empty tree
    else if v < t->item:
        t->left = avlDelete(t->left, v)
    else if v > t->item:
        t->right = avlDelete(t->right, v)
    else:
        if t->left is empty:
            temp = t->right
            free(t)
            return temp
        else if t->right is empty:
            temp = t->left
            free(t)
            return temp
        else:
            successor = minimum value in t->right
            t->item = successor
            t->right = avlDelete(t->right, successor)

    return avlRebalance(t)`;
const LAVD = lines(PS_AVLDEL,{empty:'if t is empty:',lt:'else if v < t->item:',left:'t->left = avlDelete(t->left, v)',gt:'else if v > t->item:',right:'t->right = avlDelete(t->right, v)',noleft:'if t->left is empty:',tr:'temp = t->right',f1:['free(t)',1],rt1:['return temp',1],noright:'else if t->right is empty:',tl:'temp = t->left',succ:'successor = minimum value in t->right',setitem:'t->item = successor',recur:'t->right = avlDelete(t->right, successor)',reb:'return avlRebalance(t)'});

const DERIVED_NOTE = 'The attached manual supplies AVL pseudocode, including <code>balance(t)</code>, <code>rotateLeft</code> and <code>rotateRight</code>, but it does not supply an AVL C implementation or define those helper functions. The visualiser enacts the named pseudocode operations; it does not present generated C as manual source.';


function bal(n){ return n ? heightOf(n.l)-heightOf(n.r) : 0; }
function badgesFor(n,acc){ acc=acc||{}; if(!n) return acc; const b=bal(n); acc[n.v]=(b>0?'+':'')+b; badgesFor(n.l,acc); badgesFor(n.r,acc); return acc; }
function rotR(n){ const p=n.l; n.l=p.r; p.r=n; return p; }
function rotL(n){ const p=n.r; n.r=p.l; p.l=n; return p; }

mod({
  id:'avlins', group:'AVL trees', name:'AVL insert',
  blocks:[{title:"avlInsert / avlRebalance / balance - pseudocode",src:PS_AVL,pseudo:true,pages:'pp. 14-15'}],
  fields:[{k:'seq',label:'insert in order',def:'10 20 30 40 50 25'}],
  note:DERIVED_NOTE,
  run(inp){
    const vals=parseInts(inp.seq,'seq','tree values'), t=new Trace();
    const box={root:null};
    const V=(cls)=>({kind:'tree',root:clone(box.root),cls:cls||{},badges:badgesFor(box.root)});
    t.step([0,LAVL.formula],"Badges show each node's balance factor, <code>height(left) − height(right)</code>. A node is out of balance the moment |bf| exceeds 1.",V());

    function rebalance(n,path){
      const b=bal(n);
      t.v({node:n.v,bal:(b>0?'+':'')+b}).step([0,LAVL.bal],
        `<code>avlRebalance</code> at <b>${n.v}</b>: <code>bal = height(t->left) - height(t->right) = ${b}</code>. ${Math.abs(b)<=1?'Within ±1 — return unchanged.':'<b>Out of balance.</b>'}`,
        V({[n.v]:Math.abs(b)>1?'bad':'act'}));
      if(b>1){
        if(bal(n.l)<0){
          t.step([0,LAVL.lr],`<code>bal &gt; 1</code> and <code>balance(t->left) = ${bal(n.l)} &lt; 0</code> — <b>left-right</b> case: the left child leans the opposite way. Rotate it left first to convert this into a left-left case.`,V({[n.v]:'bad',[n.l.v]:'act'}));
          n.l=rotL(n.l);
          t.step([0,LAVL.rotL1],`Left child rotated left. Both now lean the same way.`,V({[n.v]:'bad'}));
        } else {
          t.step([0,LAVL.pos],`<code>bal &gt; 1</code> and the left child does not lean right — a straight <b>left-left</b> case, one rotation fixes it.`,V({[n.v]:'bad'}));
        }
        const old=n.v, nn=rotR(n);
        if(box.root===n) box.root=nn;
        t.step([0,LAVL.rotR],`<code>rotateRight</code> at ${old}: <b>${nn.v}</b> becomes the subtree root, ${old} becomes its right child and adopts ${nn.v}'s old right subtree. Heights drop by one; the BST ordering is untouched.`,V({[nn.v]:'hit'}));
        return nn;
      }
      if(b<-1){
        if(bal(n.r)>0){
          t.step([0,LAVL.rl],`<code>bal &lt; -1</code> and <code>balance(t->right) = ${bal(n.r)} &gt; 0</code> — <b>right-left</b> case. Rotate the right child right first.`,V({[n.v]:'bad',[n.r.v]:'act'}));
          n.r=rotR(n.r);
          t.step([0,LAVL.rotR1],`Right child rotated right.`,V({[n.v]:'bad'}));
        } else {
          t.step([0,LAVL.neg],`<code>bal &lt; -1</code> and the right child does not lean left — a straight <b>right-right</b> case.`,V({[n.v]:'bad'}));
        }
        const old=n.v, nn=rotL(n);
        if(box.root===n) box.root=nn;
        t.step([0,LAVL.rotL],`<code>rotateLeft</code> at ${old}: <b>${nn.v}</b> becomes the subtree root.`,V({[nn.v]:'hit'}));
        return nn;
      }
      return n;
    }

    function ins(n,v,path){
      if(!n){
        t.step([0,LAVL.new],'Reached an empty subtree — <code>return new node containing v</code>. The caller assigns it back into <code>t->left</code> or <code>t->right</code>.',V(pathCls(path,'act')));
        t.alloc('malloc',`node(item=${v})`,'sizeof(struct node)');
        return N(v);
      }
      const p=path.concat(n.v);
      if(v<n.v){
        t.step([0,LAVL.left],`<code>${v} &lt; ${n.v}</code> — recurse left.`,V(pathCls(p,'act')));
        n.l=ins(n.l,v,p);
      } else if(v>n.v){
        t.step([0,LAVL.right],`<code>${v} &gt; ${n.v}</code> — recurse right.`,V(pathCls(p,'act')));
        n.r=ins(n.r,v,p);
      } else {
        t.step([0,LAVL.dup],`<code>${v}</code> is already present — <code>return t</code> immediately, skipping the rebalance entirely.`,V({[n.v]:'bad'}));
        return n;
      }
      return rebalance(n,p);
    }

    for(const val of vals){
      t.v({v:val}).step([0,LAVL.empty],`<b>avlInsert(t, ${val})</b>.`,V());
      box.root=ins(box.root,val,[]);
      t.drop('node','bal').step([0,LAVL.reb],`<code>${val}</code> is in. ${countNodes(box.root)} nodes, height ${heightOf(box.root)}.`,V({[val]:'hit'}));
    }
    const n=countNodes(box.root);
    t.drop('v').step([0,LAVL.reb],`Insertion trace complete: ${n} nodes, current height ${heightOf(box.root)}. Every displayed badge is <code>height(t->left) - height(t->right)</code>.`,V());
    return t;
  }
});

/* ============================================================
   CAP-093: AVL SEARCH
   ------------------------------------------------------------
   The attached 26T2 manual supplies AVL insertion, deletion and rebalancing
   as PSEUDOCODE and supplies no AVL C at all. It prints no avlSearch in any
   form, so nothing here is presented as a quotation: the block below is
   labelled `source:'memorise'`, which the interface badges as "supplemental
   C - not manual or lecture source", and the lesson's whole point is that
   the descent is the manual's own bstSearch (displayed verbatim on the BST
   topics, pp. 11-14) with the field names changed.

   The token `avlSearch` now appears in a displayed block heading and body,
   which is what the manual-boundary matcher keys on (NEW-15).
   ============================================================ */
const SUP_AVLSEARCH = `/* Supplemental implementation - NOT 26T2 manual or 25T3 lecture source.
 * The attached manual gives insertion, deletion and rebalancing for AVL
 * trees as pseudocode only, and prints no AVL search in any form. This body
 * is supplied by this application so that the AVL search descent can be
 * executed and compared, statement for statement, with the bstSearch the
 * manual does print (pp. 11-14). It is the same code as the "AVL search"
 * study conversion registered in assets/manual-boundary-data.js.
 *
 * It reads no height field and performs no rotation, because the AVL
 * invariant constrains the SHAPE of the tree and not its ORDER.
 */
bool avlSearch(struct node *t, int v) {
    if (t == NULL) return false;
    if (v < t->item) return avlSearch(t->left, v);
    if (v > t->item) return avlSearch(t->right, v);
    return true;
}`;
const LAVS=lines(SUP_AVLSEARCH,{sig:'bool avlSearch',null:'if (t == NULL) return false;',lt:'if (v < t->item)',gt:'if (v > t->item)',hit:'return true;'});
const AVL_SEARCH_NOTE=' The <b>search</b> operation on this topic executes the supplemental <code>avlSearch</code> block below, not a manual quotation: the manual prints no AVL search. An AVL tree is a binary search tree, so that descent is the manual <code>bstSearch</code> with different field names, and the trace shows the two side by side rather than asserting it.';

mod({
  id:'avldel', group:'AVL trees', name:'AVL delete', keywords:'avl delete deletion in-order successor rebalance cascade avlSearch avl search descent membership ordering property height guarantee logarithmic',
  blocks:[{title:"avlDelete - pseudocode",src:PS_AVLDEL,pseudo:true,pages:'pp. 15-16'},{title:"avlRebalance / balance - pseudocode",src:PS_AVL,pseudo:true,pages:'pp. 14-15'},{title:"avlSearch - supplemental C",src:SUP_AVLSEARCH,source:'memorise',pages:'supplemental lesson'}],
  fields:[{k:'seq',label:'build tree from',def:'30 20 40 10 25 35 50 5'},{k:'op',label:'operation',def:'delete',type:'select',options:['delete','search']},{k:'val',label:'value',def:'40',w:5}],
  note:DERIVED_NOTE+AVL_SEARCH_NOTE,
  run(inp){
    const t=new Trace(), box={root:null};
    function buildIns(n,v){
      if(!n){ const blk=t.alloc('malloc',`node(item=${v})`,'sizeof(struct node)'); return N(v,blk); }
      if(v<n.v) n.l=buildIns(n.l,v); else if(v>n.v) n.r=buildIns(n.r,v); else return n;
      return avlBalance(n);
    }
    parseInts(inp.seq,'seq','tree values').forEach(v=>{ box.root=buildIns(box.root,v); });
    const val=Number(inp.val);
    const V=(cls)=>({kind:'tree',root:clone(box.root),cls:cls||{},badges:badgesFor(box.root)});
    if(inp.op==='search'){
      /* ---- CAP-093: the AVL search descent, on the supplemental C ---- */
      const blocks=this.blocks,treeH=heightOf(box.root),nNodes=countNodes(box.root);
      t.v({v:val}).step(srcLine(blocks,LAVS,'sig'),
        `<b>avlSearch(t, ${val})</b> on a ${nNodes}-node tree of height ${treeH}. An AVL tree <i>is</i> a binary search tree: <code>rotateLeft</code> and <code>rotateRight</code> rearrange pointers but never change the in-order sequence, so the ordering property still holds and the search is the ordinary three-way BST descent. It never reads <code>t->height</code>.`,V());
      let cur=box.root;const path=[];let compared=0,found=false;
      while(cur){
        path.push(cur.v);
        t.v({'t->item':cur.v}).step(srcLine(blocks,LAVS,'null'),`<code>t != NULL</code>: the descent is standing on node ${cur.v}.`,V(pathCls(path,'act')));
        compared++;
        if(val<cur.v){
          t.step(srcLine(blocks,LAVS,'lt'),`<code>${val} &lt; ${cur.v}</code> - <code>return avlSearch(t->left, ${val})</code>. Everything in the right subtree is larger than ${cur.v}, so it is eliminated in one comparison.`,V(pathCls(path,'act')));
          cur=cur.l;
        }else if(val>cur.v){
          t.step(srcLine(blocks,LAVS,'gt'),`<code>${val} &gt; ${cur.v}</code> - <code>return avlSearch(t->right, ${val})</code>. The whole left subtree is eliminated.`,V(pathCls(path,'act')));
          cur=cur.r;
        }else{
          found=true;
          t.v({result:'true'}).step(srcLine(blocks,LAVS,'hit'),`<code>${val} == ${cur.v}</code> - neither comparison branch is taken, so <code>return true</code>.`,V({[cur.v]:'hit'}));
          break;
        }
      }
      if(!found)
        t.v({result:'false'}).step(srcLine(blocks,LAVS,'null'),
          nNodes?`<code>t == NULL</code>: the descent ran off the bottom of the tree after ${compared} comparison${compared===1?'':'s'}, so <code>return false</code>. Nothing was modified.`
                :`<code>t == NULL</code> on the very first call - the tree is empty, so <code>return false</code> with no comparisons at all.`,
          V(pathCls(path,'bad')));
      t.v({comparisons:compared,'nodes visited':path.length,height:treeH}).step(srcLine(blocks,LAVS,'sig'),
        `Result <b>${found?'true':'false'}</b> after visiting ${path.length} node${path.length===1?'':'s'} of ${nNodes}. A descent can visit at most <code>height + 1 = ${treeH+1}</code> node${treeH+1===1?'':'s'}, whatever the value searched for.`,
        {kind:'multi',views:[V(pathCls(path,found?'hit':'bad')),refView(
          {title:'Why AVL search is BST search',html:'<p>The AVL invariant constrains the <b>shape</b> of the tree, not its <b>order</b>. The two rotations are chosen precisely because they preserve the in-order sequence, so after any number of them it is still true that every value in <code>t->left</code> is smaller than <code>t->item</code> and every value in <code>t->right</code> is larger. A search needs nothing else, so it uses the same three-way comparison and never looks at <code>t->height</code> - the only field AVL adds. The two bodies differ in parameter and field names and in nothing else.</p>'},
          refTable('Statement by statement',['avlSearch - supplemental C (block 3 below)','bstSearch - 26T2 manual, pp. 11-14'],[
            ['bool avlSearch(struct node *t, int v) {','bool bstSearch(struct node *tree, int val) {'],
            ['    if (t == NULL) return false;','    if (tree == NULL) { return false; }'],
            ['    if (v < t->item) return avlSearch(t->left, v);','    } else if (val < tree->value) { return bstSearch(tree->left, val); }'],
            ['    if (v > t->item) return avlSearch(t->right, v);','    } else if (val > tree->value) { return bstSearch(tree->right, val); }'],
            ['    return true;','    } else { return true; }']
          ]),
          {title:'What the height guarantee buys',html:`<p>Not a different algorithm - a bound on the work. The descent visits at most <code>height + 1</code> nodes, so the cost is O(height) whatever the tree. On an AVL tree the stored heights hold every balance factor within &plusmn;1, which forces <code>height &le; 2 &middot; log<sub>2</sub> n</code> - derived with its arithmetic in <i>AVL stored heights and balance factors</i> - so this search is <b>O(log n) in the worst case</b>. Here that ceiling is ${(2*Math.log2(Math.max(nNodes,1))).toFixed(2)} and the actual height is ${treeH}.</p><p>The identical code on an unbalanced binary search tree has no such ceiling: the ascending-insertion input in <i>Global and periodic BST rebalancing</i> gives height <code>n &minus; 1</code>, and the same descent then costs <b>O(n)</b> comparisons. Maintaining the heights buys exactly this and nothing more.</p>`})]});
      t.drop('t->item').step(srcLine(blocks,LAVS,found?'hit':'null'),
        `<code>avlSearch(t, ${val})</code> returns <b>${found?'true':'false'}</b>. The tree is unchanged: search allocates nothing and frees nothing.`,
        V(found?{[val]:'hit'}:pathCls(path,'bad')));
      return t;
    }
    t.v({v:val}).step([0,LAVD.empty],`<b>avlDelete(t, ${val})</b>. Initial nodes were allocated while constructing the input AVL tree.`,V());

    function rebalance(n,blk){
      const b=bal(n);
      t.v({node:n.v,bal:(b>0?'+':'')+b}).step([1,LAVL.bal],
        `Unwinding: <code>avlRebalance</code> at <b>${n.v}</b>, <code>bal = ${b}</code>. ${Math.abs(b)<=1?'Fine.':'<b>Out of balance — rotate.</b>'}`,
        V({[n.v]:Math.abs(b)>1?'bad':'act'}));
      if(b>1){
        if(bal(n.l)<0){ t.step([1,LAVL.lr],`Left-right case at ${n.v}.`,V({[n.v]:'bad',[n.l.v]:'act'})); n.l=rotL(n.l); }
        const old=n.v, nn=rotR(n); if(box.root===n) box.root=nn;
        t.step([1,LAVL.rotR],`<code>rotateRight</code> at ${old} — <b>${nn.v}</b> takes over.`,V({[nn.v]:'hit'}));
        return nn;
      }
      if(b<-1){
        if(bal(n.r)>0){ t.step([1,LAVL.rl],`Right-left case at ${n.v}.`,V({[n.v]:'bad',[n.r.v]:'act'})); n.r=rotR(n.r); }
        const old=n.v, nn=rotL(n); if(box.root===n) box.root=nn;
        t.step([1,LAVL.rotL],`<code>rotateLeft</code> at ${old} — <b>${nn.v}</b> takes over.`,V({[nn.v]:'hit'}));
        return nn;
      }
      return n;
    }

    function del(n,v,path){
      if(!n){ t.step([0,LAVD.empty],`<code>t is empty</code> — <code>${v}</code> was not in the tree.`,V(pathCls(path,'bad'))); return null; }
      const p=path.concat(n.v);
      if(v<n.v){ t.step([0,LAVD.left],`<code>${v} &lt; ${n.v}</code> — recurse left.`,V(pathCls(p,'act'))); n.l=del(n.l,v,p); }
      else if(v>n.v){ t.step([0,LAVD.right],`<code>${v} &gt; ${n.v}</code> — recurse right.`,V(pathCls(p,'act'))); n.r=del(n.r,v,p); }
      else{
        t.step([0,LAVD.noleft],`Found <b>${v}</b>. Three cases, decided by the children.`,V({[v]:'bad'}));
        if(!n.l){
          t.free(n.blk);
          t.step([0,LAVD.f1],`<code>t->left is empty</code>: save <code>t->right</code>, <code>free(t)</code>, and return it.`,V({[n.v]:'bad'}));
          return n.r;
        }
        if(!n.r){
          t.free(n.blk);
          t.step([0,LAVD.tl],`<code>t->right is empty</code>: save <code>t->left</code>, <code>free(t)</code>, and return it.`,V({[n.v]:'bad'}));
          return n.l;
        }
        let m=n.r; while(m.l) m=m.l;
        t.v({successor:m.v}).step([0,LAVD.succ],`Two children. Take the minimum of the right subtree, <b>${m.v}</b> — the in-order successor.`,V({[v]:'bad',[m.v]:'hit'}));
        n.v=m.v;
        t.step([0,LAVD.setitem],`<code>t->item = ${m.v}</code>. The manual copies the <b>value</b> down rather than relinking pointers, so this node is not freed — the duplicate deeper in the tree is what gets removed.`,V({[m.v]:'act'}));
        t.step([0,LAVD.recur],`Recursively delete ${m.v} from the right subtree, where by construction it has no left child — so it lands in one of the easy cases.`,V({[m.v]:'act'}));
        n.r=del(n.r,m.v,p);
      }
      return rebalance(n,p);
    }

    box.root=del(box.root,val,[]);
    t.drop('node','bal','successor').step([0,LAVD.reb],
      `Deletion trace complete. Balance factors shown are calculated as <code>height(t->left) - height(t->right)</code>.`,V());
    return t;
  }
});

function avlIns(n,v){
  if(!n) return N(v);
  if(v<n.v) n.l=avlIns(n.l,v); else if(v>n.v) n.r=avlIns(n.r,v); else return n;
  return avlBalance(n);
}
function avlBalance(n){
  const b=bal(n);
  if(b>1){ if(bal(n.l)<0) n.l=rotL(n.l); return rotR(n); }
  if(b<-1){ if(bal(n.r)>0) n.r=rotR(n.r); return rotL(n); }
  return n;
}
