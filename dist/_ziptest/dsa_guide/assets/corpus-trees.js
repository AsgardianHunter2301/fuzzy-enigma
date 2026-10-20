/* ============================================================
   SHARED TREE MEASUREMENTS  (CAP-066, CAP-076, CAP-087)
   ------------------------------------------------------------
   One definition of each measured quantity, used by the terminology
   reference on `bsttrav`, the size-balance reference on `bstrebalance` and
   the height-guarantee derivation on `avlheight`, so the three lessons
   cannot drift apart.

   ONE HEIGHT CONVENTION: height is counted in EDGES and an EMPTY TREE HAS
   HEIGHT -1, so a single node has height 0. That is exactly what
   `heightOf()` in modules-trees.js computes and what the AVL lessons store
   in each node for `balance(t) = height(t->left) - height(t->right)`. A
   second, node-counted convention is deliberately NOT introduced anywhere.
   ============================================================ */
function inorderValues(n){return n?inorderValues(n.l).concat([n.v],inorderValues(n.r)):[];}
function leafValues(n,out){out=out||[];if(!n)return out;if(!n.l&&!n.r){out.push(n.v);return out;}leafValues(n.l,out);leafValues(n.r,out);return out;}
function internalValues(n,out){out=out||[];if(!n)return out;if(n.l||n.r)out.push(n.v);internalValues(n.l,out);internalValues(n.r,out);return out;}
/* nodes per level; index = depth, so levelCounts(root)[0] is always 1 */
function levelCounts(n,d,out){out=out||[];if(!n)return out;d=d||0;out[d]=(out[d]||0)+1;levelCounts(n.l,d+1,out);levelCounts(n.r,d+1,out);return out;}
/* one longest root-to-leaf path as values; its edge count equals heightOf(n),
   and the node at index i on it has height heightOf(n) - i */
function longestDownPath(n){if(!n)return [];const l=longestDownPath(n.l),r=longestDownPath(n.r);return [n.v].concat(l.length>=r.length?l:r);}
/* |size(t->left) - size(t->right)| at every node, in pre-order */
function sizeBalanceRows(n,out){out=out||[];if(!n)return out;const L=countNodes(n.l),R=countNodes(n.r);out.push({v:n.v,left:L,right:R,diff:Math.abs(L-R),ok:Math.abs(L-R)<=1});sizeBalanceRows(n.l,out);sizeBalanceRows(n.r,out);return out;}
/* the AVL condition, measured with the same edge-counted height */
function heightBalanceRows(n,out){out=out||[];if(!n)return out;const lh=heightOf(n.l),rh=heightOf(n.r);out.push({v:n.v,lh,rh,bf:lh-rh,ok:Math.abs(lh-rh)<=1});heightBalanceRows(n.l,out);heightBalanceRows(n.r,out);return out;}
function isHeightBalanced(n){return heightBalanceRows(n).every(r=>r.ok);}
/* Fewest nodes an AVL tree of height h can hold, edge-counted:
   N(-1) = 0, N(0) = 1, N(h) = N(h-1) + N(h-2) + 1. */
function avlMinNodes(h){if(h<0)return 0;const a=[0,1];for(let k=1;k<=h;k++)a[k+1]=a[k]+a[k-1]+1;return a[h+1];}
/* One minimum-size AVL tree of height h, labelled 1..N(h) in in-order so it
   is a valid BST. Its mirror image is equally minimal. */
function avlMinTree(h,counter){if(h<0)return null;counter=counter||{n:1};const left=avlMinTree(h-1,counter);const node=N(counter.n++);node.l=left;node.r=avlMinTree(h-2,counter);return node;}
/* F(1) = F(2) = 1; used only to show the Fibonacci identity N(h) = F(h+3) - 1. */
function fibNumber(k){let a=0,b=1;for(let i=1;i<=k;i++){const c=a+b;a=b;b=c;}return a;}

mod({
  id:'bsttrav',group:'Binary search trees',name:"BST traversals - pre, in, post and level order",keywords:'preorder inorder postorder level order queue visit tree terminology root parent child leaf internal node depth height level subtree size ordering property',
  blocks:[{title:"Traversal pseudocode - lecture",src:LEC_BST_TRAV,pseudo:true,source:'lecture',pages:'week03lec02'}],
  note:'Pre-, in- and post-order use automatic recursive call frames. Level-order uses a queue. The input tree remains caller-owned throughout.',
  fields:[{k:'seq',label:'insert tree values',def:'20 10 30 5 14 24 32 2 12 17 29 31'},{k:'order',label:'order',def:'in-order',type:'select',options:['pre-order','in-order','post-order','level-order']}],
  run(inp){
    const vals=parseInts(inp.seq,'seq','tree values'),root=buildTree(vals),order=inp.order,t=new Trace(),out=[],frames=[];if(!root)throw new Error('tree values must not be empty');
    const V=(active,phase='wind')=>({kind:'multi',views:[{kind:'tree',root:clone(root),cls:active!==undefined?{[active]:'act'}:{}},stackView(frames,order==='level-order'?'queue state is shown in variables':'automatic traversal call stack')]});
    /* ---- CAP-066: tree and BST terminology, on the tree being traced ----
       The traversal lesson uses these words throughout; they are defined
       here once, against the actual nodes, instead of being assumed. Height
       is counted in EDGES and an empty tree has height -1, matching
       heightOf() and the AVL lessons - there is no second convention. */
    const TT=(cls)=>({title:'the tree this lesson traces',kind:'tree',root:clone(root),cls:cls||{}});
    const nTotal=countNodes(root),leafVals=leafValues(root),internalVals=internalValues(root),
          levelSizes=levelCounts(root),deepPath=longestDownPath(root),treeH=heightOf(root),
          sortedVals=inorderValues(root);
    const childNames=x=>[x.l?String(x.l.v):'NULL',x.r?String(x.r.v):'NULL'];
    t.step(srcLine(this.blocks,LBTR,'left'),
      `Terminology, on this tree. It holds <b>${nTotal}</b> node${nTotal===1?'':'s'}. <code>t</code> is a pointer to one node; <code>t->left</code> and <code>t->right</code> point at that node's children, and everything reachable through one of those pointers is a <b>subtree</b> - which is why each traversal above can call itself on it.`,
      {kind:'multi',views:[TT(Object.assign(pathCls(leafVals,'act'),{[root.v]:'hit'})),refView(
        refTable('Structural terms, read off this tree',['Term','Definition','On this tree'],[
          ['root','the one node with no parent; every traversal starts at it',String(root.v)],
          ['parent, child','t->left and t->right point at the children of t, and t is their parent',`${root.v} is the parent of ${childNames(root).join(' and ')}`],
          ['leaf','a node whose left and right pointers are both NULL',`${leafVals.join(' ')}   (${leafVals.length} of ${nTotal})`],
          ['internal node','any node that is not a leaf, so it has at least one child',`${internalVals.join(' ')}   (${internalVals.length} of ${nTotal})`],
          ['subtree','the whole tree reachable from one node, that node included',root.l?`the subtree at ${root.l.v} holds ${inorderValues(root.l).join(' ')}`:'the root has no left subtree'],
          ['size(t)','the number of nodes in the subtree at t',`size(${root.v}) = ${nTotal}`+(root.l?`,  size(${root.l.v}) = ${countNodes(root.l)}`:'')+(root.r?`,  size(${root.r.v}) = ${countNodes(root.r)}`:'')],
          ['empty tree','a NULL pointer; the base case of all four traversals above','written "t is empty" in the pseudocode']
        ]),
        {title:'Reading the diagram',html:'<p>The root carries the result highlight and every leaf the active highlight, so both ends of each root-to-leaf path are visible at once. Internal nodes are the unhighlighted ones.</p>'})]});
    t.v({nodes:nTotal,height:treeH}).step(srcLine(this.blocks,LBTR,'empty'),
      `Measured on this tree: height <b>${treeH}</b>, ${levelSizes.length} level${levelSizes.length===1?'':'s'}, ${nTotal} node${nTotal===1?'':'s'}. The base case highlighted here is the empty tree, and <b>an empty tree has height -1</b> in this corpus - which is what makes a leaf's height 0.`,
      {kind:'multi',views:[TT(pathCls(deepPath,'act')),refView(
        refTable('Measured terms, read off this tree',['Term','Definition','On this tree'],[
          ['depth(t)','the number of edges from the root down to t; the root has depth 0',deepPath.map((v,i)=>`depth(${v}) = ${i}`).join(',  ')],
          ['level k','every node at depth k, so level 0 holds only the root',levelSizes.map((c,d)=>`level ${d}: ${c} node${c===1?'':'s'}`).join(',  ')],
          ['height(t)','the number of edges on the longest path from t down to a leaf',deepPath.map((v,i)=>`height(${v}) = ${treeH-i}`).join(',  ')],
          ['height of an empty tree','-1, the convention used everywhere in this application','so height(leaf) = 1 + max(-1, -1) = 0'],
          ['height of the tree','the height of its root',`${treeH}, along the path ${deepPath.join(' -> ')}`],
          ['size(t)','the number of nodes in the subtree at t',`size of the whole tree = ${nTotal}`]
        ]),
        {title:'One height convention, not two',html:'<p>Height is counted in <b>edges</b> here, and the empty tree is <b>-1</b>. That is the convention <code>heightOf</code> computes, and the convention the AVL lessons store in each node, where <code>balance(t) = height(t->left) - height(t->right)</code> and a single node therefore has height 0. Textbooks that count <b>nodes</b> instead give the empty tree 0 and a single node 1; every height anywhere in this application is one less than that figure. Depth and level are measured the same way: the root is at depth 0, on level 0.</p>'})]});
    const ordRows=[];
    (function scanOrder(x){
      if(!x)return;
      const L=inorderValues(x.l),R=inorderValues(x.r);
      if(L.length||R.length)ordRows.push([
        String(x.v),
        L.length?String(Math.max.apply(null,L)):'left subtree empty',
        R.length?String(Math.min.apply(null,R)):'right subtree empty',
        ((!L.length||Math.max.apply(null,L)<x.v)&&(!R.length||Math.min.apply(null,R)>x.v))?'yes':'NO']);
      scanOrder(x.l);scanOrder(x.r);
    })(root);
    t.drop('nodes','height').step(srcLine(this.blocks,LBTR,'visit'),
      `<b>BST ordering property:</b> at every node <code>t</code>, every value in <code>t->left</code> is less than <code>t->item</code> and every value in <code>t->right</code> is greater. That single property is why in-order - left, visit, right - emits <b>${sortedVals.join(' ')}</b>, in increasing order.`,
      {kind:'multi',views:[TT({[root.v]:'hit'}),refView(
        {title:'The property, and what it is not',html:'<p>It is a statement about <b>whole subtrees</b>, not about immediate children: every value below and to the left must be smaller, however deep it sits. Comparing each node only with its two children is a weaker test that accepts trees which are not BSTs.</p>'},
        refTable('Checked at every node that has at least one child',['Node','largest value in its left subtree','smallest value in its right subtree','ordered?'],ordRows),
        {title:'Boundary',html:'<p>A leaf satisfies the property for nothing, because both of its subtrees are empty - so checking leaves proves nothing, and the table above lists only the nodes where there is something to check. Equal values never arise: <code>bstInsert</code> returns the tree unchanged when the value is already present, so the three branches of every comparison are "smaller", "larger" and "already here".</p>'})]});
    if(order==='level-order'){
      const q=[root],qblk=t.alloc('create','level-order queue','references to tree nodes','lecture pseudocode helper');
      t.v({queue:q.map(x=>x.v).join(' '),output:''}).step([0,LBTR.level],'Enqueue the root.',V(root.v));
      while(q.length){const n=q.shift();t.v({v:n.v,queue:q.map(x=>x.v).join(' ')}).step([0,LBTR.visit],`Dequeue and visit ${n.v}.`,V(n.v));out.push(n.v);if(n.l)q.push(n.l);if(n.r)q.push(n.r);t.v({queue:q.map(x=>x.v).join(' '),output:out.join(' ')}).step([0,LBTR.level],'Enqueue existing children from left to right.',V(n.v));}
      t.release(qblk);t.drop('v','queue').v({output:out.join(' ')}).step([0,LBTR.level],'Queue is empty; level-order traversal is complete.',V());return t;
    }
    const mode=order==='pre-order'?'pre':order==='post-order'?'post':'in';
    function rec(n){
      frames.push({label:`${mode}order(${n?`node(${n.v})`:'NULL'})`,detail:n?'active subtree':'base case',phase:'wind'});
      t.v({node:n?n.v:'NULL',output:out.join(' ')}).step([0,mode==='pre'?LBTR.pre:mode==='post'?LBTR.post:LBTR.in],`Enter ${mode}-order call.`,V(n&&n.v));
      t.step([0,LBTR.empty],`Tree is empty: <b>${!n}</b>.`,V(n&&n.v));
      if(!n){frames.pop();return;}
      if(mode==='pre'){out.push(n.v);t.v({output:out.join(' ')}).step([0,LBTR.visit],`Visit ${n.v} before its subtrees.`,V(n.v));}
      rec(n.l);
      if(mode==='in'){out.push(n.v);t.v({output:out.join(' ')}).step([0,LBTR.visit],`Visit ${n.v} between left and right subtrees.`,V(n.v));}
      rec(n.r);
      if(mode==='post'){out.push(n.v);t.v({output:out.join(' ')}).step([0,LBTR.visit],`Visit ${n.v} after both subtrees.`,V(n.v));}
      frames[frames.length-1].phase='unwind';frames[frames.length-1].detail='return';t.step([0,LBTR.visit],`Return from node ${n.v}.`,V(n.v,'unwind'));frames.pop();
    }
    rec(root);t.drop('node').v({output:out.join(' ')}).step([0,LBTR.visit],`${order} result: <b>${out.join(' ')}</b>.`,V());return t;
  }
});

const LEC_ROTATE = `struct node *rotateRight(struct node *root) {
    if (root == NULL || root->left == NULL) return root;
    struct node *newRoot = root->left;
    root->left = newRoot->right;
    newRoot->right = root;
    return newRoot;
}

struct node *rotateLeft(struct node *root) {
    if (root == NULL || root->right == NULL) return root;
    struct node *newRoot = root->right;
    root->right = newRoot->left;
    newRoot->left = root;
    return newRoot;
}`;
const LROT=lines(LEC_ROTATE,{rr:'struct node *rotateRight',rg:'root == NULL || root->left',rnew:'struct node *newRoot = root->left;',rmove:'root->left = newRoot->right;',rlink:'newRoot->right = root;',rret:['return newRoot;',1],lr:'struct node *rotateLeft',lg:'root == NULL || root->right',lnew:'struct node *newRoot = root->right;',lmove:'root->right = newRoot->left;',llink:'newRoot->left = root;',lret:['return newRoot;',2]});
function rotateRightJS(root){if(!root||!root.l)return root;const nr=root.l;root.l=nr.r;nr.r=root;return nr;}
function rotateLeftJS(root){if(!root||!root.r)return root;const nr=root.r;root.r=nr.l;nr.l=root;return nr;}
mod({
  id:'bstrotate',group:'Balanced BSTs',name:"BST rotations - exact pointer rewiring",keywords:'rotate left right pointer newRoot O1 balance',
  blocks:[{title:"rotateRight / rotateLeft - lecture C",src:LEC_ROTATE,source:'lecture',pages:'week04 balancing BSTs'}],
  note:'Rotations preserve BST in-order order and perform only local pointer rearrangements, so the lecture gives O(1) time.',
  fields:[{k:'seq',label:'tree values',def:'7 4 9 1 5'},{k:'dir',label:'rotation at root',def:'right',type:'select',options:['right','left']}],
  run(inp){
    let root=buildTree(parseInts(inp.seq,'seq','tree values')),t=new Trace();if(!root)throw new Error('tree values must not be empty');const right=inp.dir==='right';
    const line=x=>[0,x],V=(cls,ecls)=>({kind:'tree',root:clone(root),cls:cls||{},ecls:ecls||{}});
    t.v({root:root.v,direction:inp.dir}).step(line(right?LROT.rr:LROT.lr),`Call <code>rotate${right?'Right':'Left'}(root)</code>.`,V({[root.v]:'act'}));
    const child=right?root.l:root.r;t.step(line(right?LROT.rg:LROT.lg),`Required child exists: <b>${!!child}</b>.`,V({[root.v]:'act'}));if(!child){t.step(line(right?LROT.rg:LROT.lg),'Return the original root unchanged.',V());return t;}
    const old=root,newRoot=child;t.v({newRoot:newRoot.v}).step(line(right?LROT.rnew:LROT.lnew),`<code>newRoot</code> points to node ${newRoot.v}.`,V({[old.v]:'act',[newRoot.v]:'hit'}));
    if(right){old.l=newRoot.r;t.step(line(LROT.rmove),`<code>${old.v}->left</code> now points to ${old.l?old.l.v:'NULL'}.`,V({[old.v]:'act'}));newRoot.r=old;root=newRoot;t.step(line(LROT.rlink),`<code>${newRoot.v}->right</code> now points to old root ${old.v}.`,V({[root.v]:'hit',[old.v]:'act'}));}
    else{old.r=newRoot.l;t.step(line(LROT.lmove),`<code>${old.v}->right</code> now points to ${old.r?old.r.v:'NULL'}.`,V({[old.v]:'act'}));newRoot.l=old;root=newRoot;t.step(line(LROT.llink),`<code>${newRoot.v}->left</code> now points to old root ${old.v}.`,V({[root.v]:'hit',[old.v]:'act'}));}
    t.drop('newRoot').v({root:root.v}).step(line(right?LROT.rret:LROT.lret),`Return node ${root.v} as the new subtree root.`,V({[root.v]:'hit'}));return t;
  }
});

const LEC_PARTITION = `partition(t, i):
    Input: tree t, index i
    Output: tree with i-th item moved to root
    leftSize = size(t->left)
    if i < leftSize:
        t->left = partition(t->left, i)
        t = rotateRight(t)
    else if i > leftSize:
        t->right = partition(t->right, i - leftSize - 1)
        t = rotateLeft(t)
    return t`;
const LPAR=lines(LEC_PARTITION,{sig:'partition(t, i):',size:'leftSize = size',lt:'if i < leftSize:',left:'t->left = partition',rr:'t = rotateRight',gt:'else if i > leftSize:',right:'t->right = partition',rl:'t = rotateLeft',ret:'return t'});
mod({
  id:'bstpartition',group:'Balanced BSTs',name:"BST partition - lift in-order index to root",keywords:'partition index size rotate root',
  blocks:[{title:"partition - lecture pseudocode",src:LEC_PARTITION,pseudo:true,source:'lecture',pages:'week04 balancing BSTs'},{title:"rotations - lecture C",src:LEC_ROTATE,source:'lecture',pages:'week04 balancing BSTs'}],
  note:'The lecture notes that repeatedly computing <code>size()</code> can make partition O(n²) in a degenerate tree; storing subtree size in each node can make each size lookup O(1).',
  fields:[{k:'seq',label:'tree values',def:'13 5 17 3 8 16 1 6 10'},{k:'i',label:'in-order index',def:'4',type:'number',min:0,w:4}],
  run(inp){
    let root=buildTree(parseInts(inp.seq,'seq','tree values')),i=safeInt(inp.i,'index',0,999),t=new Trace(),frames=[];const n=countNodes(root);if(!root||i>=n)throw new Error(`index must be in 0..${Math.max(0,n-1)}`);
    const V=(active)=>({kind:'multi',views:[{kind:'tree',root:clone(root),cls:active!==undefined?{[active]:'act'}:{}},stackView(frames,'partition recursion and unwinding rotations')]});
    function part(node,idx,parent,side){
      frames.push({label:`partition(node(${node.v}), ${idx})`,detail:'compute leftSize',phase:'wind'});const ls=countNodes(node.l);t.v({i:idx,leftSize:ls,'t->item':node.v}).step([0,LPAR.size],`Left subtree of ${node.v} contains ${ls} nodes.`,V(node.v));
      if(idx<ls){t.step([0,LPAR.lt],`${idx} < ${ls}: partition the left subtree.`,V(node.v));node.l=part(node.l,idx,node,'l');frames[frames.length-1].phase='unwind';node=rotateRightJS(node);if(!parent)root=node;else parent[side]=node;t.step([0,LPAR.rr],`Unwind and rotate right; ${node.v} becomes this subtree root.`,V(node.v));}
      else if(idx>ls){const next=idx-ls-1;t.step([0,LPAR.gt],`${idx} > ${ls}: partition the right subtree around ${next}.`,V(node.v));node.r=part(node.r,next,node,'r');frames[frames.length-1].phase='unwind';node=rotateLeftJS(node);if(!parent)root=node;else parent[side]=node;t.step([0,LPAR.rl],`Unwind and rotate left; ${node.v} becomes this subtree root.`,V(node.v));}
      else t.step([0,LPAR.ret],`Index equals leftSize; node ${node.v} is the desired item.`,V(node.v));
      frames.pop();return node;
    }
    root=part(root,i,null,null);t.drop('i','leftSize','t->item').v({root:root.v}).step([0,LPAR.ret],`Partition complete: in-order index ${i} is now root ${root.v}.`,V(root.v));return t;
  }
});

const LEC_REBALANCE = `rebalance(t):
    Input: tree t
    Output: balanced tree containing the same items as t
    if size(t) <= 1:
        return t
    t = partition(t, size(t) / 2)
    t->left = rebalance(t->left)
    t->right = rebalance(t->right)
    return t

Periodic rebalancing:
bstInsert(t, v):
    t = insertAtLeaf(t, v)
    if size(t) mod k = 0:
        t = rebalance(t)
    return t`;
/* `ret` resolves to the FIRST `return t`, which is rebalance()'s base-case
   return; `done` and `pret` name the other two deliberately, and the
   periodic keys (CAP-083) name the statements of the second half of the
   block, which previously had no line of its own. */
const LREB=lines(LEC_REBALANCE,{sig:'rebalance(t):',base:'if size(t) <= 1:',part:'t = partition',left:'t->left = rebalance',right:'t->right = rebalance',ret:'return t',period:'Periodic rebalancing',
  done:['return t',2],pins:'bstInsert(t, v):',pleaf:'t = insertAtLeaf(t, v)',ptest:'if size(t) mod k = 0:',pfire:'t = rebalance(t)',pret:['return t',3]});
function partitionQuiet(node,idx){const ls=countNodes(node.l);if(idx<ls){node.l=partitionQuiet(node.l,idx);return rotateRightJS(node);}if(idx>ls){node.r=partitionQuiet(node.r,idx-ls-1);return rotateLeftJS(node);}return node;}
/* The same global rebalance the traced version performs, without frames, so
   the periodic lesson can call it at a trigger and so the comparison of
   rebalancing policies is computed rather than asserted. */
function rebalanceQuiet(node){if(!node)return null;const sz=countNodes(node);if(sz<=1)return node;node=partitionQuiet(node,Math.floor(sz/2));node.l=rebalanceQuiet(node.l);node.r=rebalanceQuiet(node.r);return node;}
const K_PERIOD=4;      /* the period k the periodic lesson traces */
mod({
  id:'bstrebalance',group:'Balanced BSTs',name:'Global and periodic BST rebalancing',keywords:'global periodic rebalance size balance balanced partition median period k trigger height degradation policy comparison',
  blocks:[{title:"rebalance / periodic rebalancing - lecture pseudocode",src:LEC_REBALANCE,pseudo:true,source:'lecture',pages:'week04 balancing BSTs'}],
  note:`Size balance is the measure both halves of this lesson aim at: a node is size-balanced when <code>|size(t->left) &minus; size(t->right)| &le; 1</code>, and a tree is size-balanced only when <i>every</i> one of its nodes is. Global rebalancing partitions around the median index at each subtree and reaches that state everywhere; the lecture analyses it as O(n log n) when subtree sizes are stored. Periodic rebalancing calls the same global rebalance once every <code>k</code> insertions - traced here with <code>k = ${K_PERIOD}</code> - and lets the height degrade in between.`,
  fields:[{k:'seq',label:'tree values',def:'1 2 3 4 5 6 7 8 9'},{k:'mode',label:'mode',def:'global',type:'select',options:['global','periodic reference']}],
  run(inp){
    const vals=parseInts(inp.seq,'seq','tree values'),t=new Trace();
    if(!vals.length)throw new Error('tree values must not be empty');
    const SIZE_HEADERS=['Node','size(t->left)','size(t->right)','difference','size-balanced?'];
    const sizeRows=node=>sizeBalanceRows(node).map(r=>[String(r.v),String(r.left),String(r.right),String(r.diff),r.ok?'yes':'NO - difference exceeds 1']);
    const SIZE_DEF={title:'What size balance measures',html:'<p>A node <code>t</code> is <b>size-balanced</b> when <code>|size(t->left) &minus; size(t->right)| &le; 1</code>. What is counted is <b>nodes</b>, not heights, and the two counts compared are the two subtrees of the <b>same</b> node - nothing is compared across the tree. A <b>tree</b> is size-balanced only when every one of its nodes is, so one failing node disqualifies it.</p><p>Height balance, the AVL condition, compares heights instead: <code>|height(t->left) &minus; height(t->right)| &le; 1</code>. Size balance at every node is the stronger of the two - it pins the height at <code>floor(log2 n)</code> - and an AVL tree need not be size-balanced at all: the seven-node minimum AVL tree of height 3 has four nodes on one side of its root and two on the other.</p>'};

    if(inp.mode!=='global'){
      /* ================= CAP-083: periodic rebalancing, traced =================
         Insert each value at a leaf, test `size(t) mod k` after every
         insertion, and run the real global rebalance when the trigger fires. */
      let root=null,fired=0,maxH=-1;
      const PV=cls=>({kind:'tree',root:clone(root),cls:cls||{}});
      t.v({k:K_PERIOD}).step([0,LREB.pins],
        `Periodic rebalancing inserts at a leaf and then calls the <i>same</i> global <code>rebalance</code> printed above - but only when <code>size(t) mod k == 0</code>. This trace uses <b>k = ${K_PERIOD}</b> and inserts ${vals.length} value${vals.length===1?'':'s'} into an initially empty tree.`,
        {kind:'multi',views:[PV(),refView(
          {title:'The rule being executed',html:`<p><code>bstInsert(t, v)</code> always inserts <code>v</code> at a leaf, exactly as the ordinary BST insert does. It then tests <code>size(t) mod k</code>. When that is 0 - and only then - it rebalances the <b>whole</b> tree. Between triggers the tree keeps whatever shape leaf insertion gave it, so its height is free to grow.</p><p><code>k</code> is the single tuning decision: a small <code>k</code> means frequent expensive repairs and a tight height bound, a large <code>k</code> means rare repairs and a looser one. <code>k = ${K_PERIOD}</code> is the value traced here, not a value the lecture fixes.</p>`},
          SIZE_DEF)]});
      vals.forEach(v=>{
        const already=!!root&&inorderValues(root).indexOf(v)>=0;
        root=treeInsert(root,v);
        const sz=countNodes(root),h=heightOf(root);
        if(h>maxH)maxH=h;
        t.v({v,size:sz,height:h}).step([0,LREB.pleaf],
          already?`<code>insertAtLeaf(t, ${v})</code>: ${v} is already present, so no node is added and <code>size(t)</code> stays <b>${sz}</b>.`
                 :`<code>insertAtLeaf(t, ${v})</code>: ${v} becomes a new leaf. <code>size(t) = ${sz}</code>, height ${h}.`,
          PV({[v]:'hit'}));
        const rem=((sz%K_PERIOD)+K_PERIOD)%K_PERIOD;
        if(rem!==0){
          t.v({'size mod k':rem}).step([0,LREB.ptest],
            `<code>size(t) mod k = ${sz} mod ${K_PERIOD} = ${rem}</code>, not 0 - <b>no rebalance</b>. The tree is left as leaf insertion made it; its height is ${h}.`,
            PV({[v]:'act'}));
        }else{
          t.v({'size mod k':0}).step([0,LREB.ptest],
            `<code>size(t) mod k = ${sz} mod ${K_PERIOD} = 0</code> - <b>the trigger fires</b>. This is the insertion that pays for the previous ${K_PERIOD-1} cheap ones.`,
            PV({[v]:'act'}));
          const before=h;
          root=rebalanceQuiet(root);fired++;
          const after=heightOf(root),bad=sizeBalanceRows(root).filter(r=>!r.ok).length;
          t.v({height:after}).step([0,LREB.pfire],
            `<code>t = rebalance(t)</code> rebuilds the whole tree around successive median indices: height <b>${before} -&gt; ${after}</b>, and ${bad?`${bad} node(s) still break size balance`:'every node is now size-balanced'}.`,
            PV({[root.v]:'hit'}));
        }
      });
      /* The three policies, each simulated on the same insertions. */
      const never=(()=>{let r=null;vals.forEach(v=>{r=treeInsert(r,v);});return heightOf(r);})();
      const always=(()=>{let r=null,calls=0,worst=-1;vals.forEach(v=>{r=treeInsert(r,v);r=rebalanceQuiet(r);calls++;const h=heightOf(r);if(h>worst)worst=h;});return {calls,worst,h:heightOf(r)};})();
      const finalH=heightOf(root),finalN=countNodes(root),finalBad=sizeBalanceRows(root).filter(r=>!r.ok);
      t.drop('v','size','height','size mod k','k').step([0,LREB.pret],
        `<code>return t</code>. ${vals.length} insertion${vals.length===1?'':'s'}, <b>${fired}</b> rebalance${fired===1?'':'s'} fired, final height <b>${finalH}</b> for ${finalN} node${finalN===1?'':'s'}. Between triggers the height reached <b>${maxH}</b>.`,
        {kind:'multi',views:[PV({[root.v]:'hit'}),refView(
          refTable(`Three policies on the same ${vals.length} insertion${vals.length===1?'':'s'}`,
            ['Policy','rebalance calls','worst height reached','final height'],
            [['never rebalance (plain leaf insertion)','0',String(never),String(never)],
             [`periodic, k = ${K_PERIOD}`,String(fired),String(maxH),String(finalH)],
             ['rebalance after every insertion',String(always.calls),String(always.worst),String(always.h)]]),
          {title:'How periodic differs from rebalancing globally every time',html:`<p>Rebalancing after <b>every</b> insertion holds the height at its minimum at all times, but pays a whole-tree rebuild ${always.calls} time${always.calls===1?'':'s'} here - one per insertion - which is the cost that makes it impractical. Periodic rebalancing pays that same cost only ${fired} time${fired===1?'':'s'}, once every ${K_PERIOD} insertions, and accepts a worse height in between: ${maxH} rather than ${always.worst} at the worst moment of this run. Never rebalancing pays nothing and ends at height ${never}.</p><p>The difference is <b>when</b>, not <b>what</b>: the operation a trigger runs is the identical <code>rebalance(t)</code> traced by the global mode of this topic. Periodic rebalancing therefore guarantees nothing about the tree <i>between</i> triggers - only that the shape is repaired at every k-th insertion.</p>`},
          refTable('Size balance of the final tree'+(finalBad.length?' - not repaired, because the last insertion did not trigger':''),SIZE_HEADERS,sizeRows(root)))]});
      return t;
    }

    /* ================= global rebalancing ================= */
    let root=buildTree(vals);
    if(!root)throw new Error('tree values must not be empty');
    /* ---- CAP-076: define size balance and make its boundary visible ---- */
    const bEven=N(2);bEven.l=N(1);bEven.r=N(3);                       /* sizes 1 and 1 */
    const bOne=N(1);bOne.r=N(2);                                      /* sizes 0 and 1 */
    const bTwo=N(1);bTwo.r=N(2);bTwo.r.r=N(3);                         /* sizes 0 and 2 */
    t.step([0,LREB.base],
      'The measure this lesson aims at, and exactly where its boundary lies. All three trees below are valid binary search trees; only the shape differs.',
      {kind:'multi',views:[
        {title:'size-balanced: difference 0',kind:'tree',root:clone(bEven)},
        {title:'size-balanced: difference 1, the largest allowed',kind:'tree',root:clone(bOne)},
        {title:'NOT size-balanced: difference 2 at the root',kind:'tree',root:clone(bTwo)},
        refView(SIZE_DEF,refTable('The boundary, on three small trees',['Tree','size(left)','size(right)','difference','size-balanced?'],[
          ['2 with children 1 and 3','1','1','0','yes'],
          ['1 with right child 2','0','1','1','yes - 1 is the largest difference allowed'],
          ['1 with right chain 2 then 3','0','2','2','NO - the boundary is crossed'],
          ['leaf 3, inside the first tree','0','0','0','yes - every leaf passes for free']
        ]))]});
    const beforeAll=sizeBalanceRows(root),beforeBad=beforeAll.filter(r=>!r.ok),
          worstBefore=beforeAll.reduce((a,b)=>b.diff>a.diff?b:a,beforeAll[0]);
    t.v({size:countNodes(root),height:heightOf(root)}).step([0,LREB.base],
      beforeBad.length
        ?`Before rebalancing: <b>${beforeBad.length}</b> of ${beforeAll.length} node${beforeAll.length===1?'':'s'} break size balance, worst of them node ${worstBefore.v} with ${worstBefore.left} node(s) left and ${worstBefore.right} right - a difference of ${worstBefore.diff}. This tree is <b>not size-balanced</b>; its height is ${heightOf(root)} for ${countNodes(root)} nodes.`
        :`Before rebalancing: every one of the ${beforeAll.length} node${beforeAll.length===1?'':'s'} already satisfies the condition, so this input is <b>already size-balanced</b>. Height ${heightOf(root)} for ${countNodes(root)} nodes.`,
      {kind:'multi',views:[
        {title:'input tree',kind:'tree',root:clone(root),cls:beforeBad.reduce((o,r)=>{o[r.v]='bad';return o;},{})},
        refView(refTable('Size balance before rebalancing',SIZE_HEADERS,sizeRows(root)),
          {title:'Why leaves prove nothing',html:'<p>A leaf has two empty subtrees, so its difference is <code>0 &minus; 0 = 0</code> and it is size-balanced whatever the rest of the tree looks like. In a degenerate input every leaf passes while the root fails badly. That is what the "<b>every</b> node" in the definition is for, and why the table lists all of them.</p>'})]});
    const splits=[];
    function rec(n,depth=0,attach=x=>{root=x;}){if(!n)return null;const sz=countNodes(n);t.v({depth,size:sz,root:n.v}).step([0,LREB.base],`Subtree rooted at ${n.v} has size ${sz}.`,{kind:'tree',root:clone(root),cls:{[n.v]:'act'}});if(sz<=1)return n;const idx=Math.floor(sz/2);splits.push([String(sz),String(idx),String(idx),String(sz-1-idx),String(Math.abs(idx-(sz-1-idx)))]);n=partitionQuiet(n,idx);attach(n);t.v({depth,size:sz,index:idx,root:n.v}).step([0,LREB.part],`Partition around median index ${idx}; ${n.v} becomes subtree root.`,{kind:'tree',root:clone(root),cls:{[n.v]:'hit'}});n.l=rec(n.l,depth+1,x=>{n.l=x;});n.r=rec(n.r,depth+1,x=>{n.r=x;});return n;}
    root=rec(root,0,x=>{root=x;});
    const afterAll=sizeBalanceRows(root),afterBad=afterAll.filter(r=>!r.ok),afterN=countNodes(root);
    const seen=[],uniqueSplits=splits.filter(r=>{if(seen.indexOf(r[0])>=0)return false;seen.push(r[0]);return true;});
    t.drop('depth','index').v({size:afterN,height:heightOf(root)}).step([0,LREB.part],
      `Every call used <code>partition(t, size(t) / 2)</code>. With integer division that leaves <code>floor(size/2)</code> nodes on the left and <code>size &minus; 1 &minus; floor(size/2)</code> on the right, so the difference is 0 when the size is odd and 1 when it is even - it can never reach 2. ${afterBad.length?`${afterBad.length} node(s) still break size balance.`:`All ${afterAll.length} node${afterAll.length===1?'':'s'} now satisfy the condition, so the tree is size-balanced: height <b>${heightOf(root)}</b>, and <code>floor(log2 ${afterN}) = ${Math.floor(Math.log2(afterN))}</code>.`}`,
      {kind:'multi',views:[
        {title:'rebalanced tree',kind:'tree',root:clone(root)},
        refView(refTable('Size balance after rebalancing',SIZE_HEADERS,sizeRows(root)),
          refTable('Why one partition cannot leave a difference of 2',['subtree size','index used = floor(size/2)','nodes left of it','nodes right of it','difference'],uniqueSplits))]});
    t.drop('size').v({root:root.v,height:heightOf(root)}).step([0,LREB.done],'Both subtrees have been recursively rebalanced.',{kind:'tree',root:clone(root),cls:{[root.v]:'hit'}});return t;
  }
});

const LEC_ROOT_INSERT = `insertAtRoot(t, v):
    Input: tree t, value v
    Output: t with v inserted at the root
    if t is empty:
        return new node containing v
    else if v < t->item:
        t->left = insertAtRoot(t->left, v)
        t = rotateRight(t)
    else if v > t->item:
        t->right = insertAtRoot(t->right, v)
        t = rotateLeft(t)
    return t

insertRandom(t, v):
    if t is empty:
        return new node containing v
    if random() mod q < p:
        return insertAtRoot(t, v)
    else:
        return insertAtLeaf(t, v)`;
const LRI=lines(LEC_ROOT_INSERT,{root:'insertAtRoot(t, v):',empty:'if t is empty:',left:'t->left = insertAtRoot',rr:'t = rotateRight',right:'t->right = insertAtRoot',rl:'t = rotateLeft',random:'insertRandom(t, v):',chance:'if random() mod q < p:',atroot:'return insertAtRoot',leaf:'return insertAtLeaf'});
mod({
  id:'bstlocal',group:'Balanced BSTs',name:'Root insertion and randomised insertion',keywords:'insert root randomized randomised local balance rotate',
  blocks:[{title:"root/randomised insertion - lecture pseudocode",src:LEC_ROOT_INSERT,pseudo:true,source:'lecture',pages:'week04 balancing BSTs'},{title:"rotations - lecture C",src:LEC_ROTATE,source:'lecture',pages:'week04 balancing BSTs'}],
  note:'Randomised insertion is source-faithfully made deterministic here by asking the learner to choose the outcome of the random test. The source still defines the branch as <code>random() mod q &lt; p</code>.',
  fields:[{k:'seq',label:'tree values',def:'10 5 14 30 29 32'},{k:'v',label:'insert',def:'24',type:'number',w:4},{k:'choice',label:'random branch',def:'insert at root',type:'select',options:['insert at root','insert at leaf']}],
  run(inp){
    let root=buildTree(parseInts(inp.seq,'seq','tree values')),v=Number(inp.v),t=new Trace();if(!Number.isFinite(v))throw new Error('insert value must be numeric');
    if(inp.choice==='insert at leaf'){t.step([0,LRI.leaf],'The selected random-test outcome uses normal leaf insertion.',{kind:'tree',root:clone(root)});root=treeInsert(root,v);t.v({v,root:root.v}).step([0,LRI.leaf],`${v} is inserted at a leaf; no rotations are performed.`,{kind:'tree',root:clone(root),cls:{[v]:'hit'}});return t;}
    function ins(n){t.v({v,node:n?n.v:'NULL'}).step([0,LRI.empty],`At ${n?`node ${n.v}`:'an empty subtree'}.`,{kind:'tree',root:clone(root),cls:n?{[n.v]:'act'}:{}});if(!n){const b=t.alloc('new node',`node(${v})`,'sizeof node','lecture pseudocode');return N(v,b);}if(v<n.v){n.l=ins(n.l);n=rotateRightJS(n);t.step([0,LRI.rr],`Rotate right so inserted value moves toward the root.`,{kind:'tree',root:clone(n),cls:{[n.v]:'hit'}});}else if(v>n.v){n.r=ins(n.r);n=rotateLeftJS(n);t.step([0,LRI.rl],`Rotate left so inserted value moves toward the root.`,{kind:'tree',root:clone(n),cls:{[n.v]:'hit'}});}return n;}
    root=ins(root);t.drop('node').v({root:root.v}).step([0,LRI.root],`Inserted value ${v} is now at the root.`,{kind:'tree',root:clone(root),cls:{[root.v]:'hit'}});return t;
  }
});

const LEC_AVL_HEIGHT = `struct node {
    int item;
    struct node *left;
    struct node *right;
    int height;
};

balance(t):
    return height(t->left) - height(t->right)

Whenever a node is inserted, recompute ancestor heights from bottom to top.
Whenever a rotation is performed, recompute the original root, then the new root.`;
const LAVH=lines(LEC_AVL_HEIGHT,{struct:'struct node {',hfield:'int height;',balsig:'balance(t):',formula:'return height(t->left) - height(t->right)',oninsert:'Whenever a node is inserted',onrotate:'Whenever a rotation is performed'});
mod({
  id:'avlheight',group:'AVL trees',name:'AVL stored heights and balance factors',keywords:'height balance factor stored ancestor rotation maintenance guarantee O(log n) logarithmic minimum nodes recurrence Fibonacci worst case shape bound',
  blocks:[{title:"AVL height data - lecture",src:LEC_AVL_HEIGHT,source:'lecture',pseudo:true,pages:'week04 AVL trees'}],
  note:'The lecture stores subtree height in every node so height and balance can be read in O(1) per node. Height is counted in edges and empty-tree height is &minus;1, so a single node has height 0. The stored height exists to buy one guarantee: an AVL tree of n nodes has height O(log n). This module derives that from the minimum-node recurrence <code>N(h) = N(h&minus;1) + N(h&minus;2) + 1</code>, shows the worst-case shape the recurrence describes, and checks the bound against the tree on screen.',
  fields:[{k:'seq',label:'AVL/BST values',def:'6 2 9 1 5 8 4'}],
  run(inp){
    const root=buildTree(parseInts(inp.seq,'seq','tree values')),t=new Trace();if(!root)throw new Error('tree values must not be empty');const rows=[];
    const blocks=this.blocks;
    function post(n){if(!n)return -1;const lh=post(n.l),rh=post(n.r),h=Math.max(lh,rh)+1,bf=lh-rh;rows.push([n.v,lh,rh,h,bf,Math.abs(bf)<=1?'balanced':'unbalanced']);t.v({node:n.v,'height(left)':lh,'height(right)':rh,height:h,balance:bf}).step(srcLine(blocks,LAVH,'formula'),`Node ${n.v}: <code>max(${lh}, ${rh}) + 1 = ${h}</code>; balance factor <code>${lh} - ${rh} = ${bf}</code>.`,{kind:'tree',root:clone(root),cls:{[n.v]:Math.abs(bf)<=1?'hit':'bad'},badges:{[n.v]:`h=${h}, bf=${bf}`}});return h;}
    post(root);
    t.drop('node','height(left)','height(right)').step(srcLine(blocks,LAVH,'oninsert'),'Bottom-up height maintenance is complete. Every stored height above was computed from the two child heights, which is why one insertion only has to refresh the heights on the path it descended.',refView(refTable('Stored node data',['Node','left h','right h','height','balance','status'],rows)));

    /* ================= CAP-087: the height guarantee the stored heights buy =================
       The lesson above shows the data. What follows shows what the data is
       FOR: an AVL tree of n nodes cannot be taller than O(log n). The
       argument is the minimum-node recurrence, the shape it describes, and
       the bound that follows - all with the arithmetic on screen. */
    const nNodes=countNodes(root),treeH=heightOf(root),minForH=avlMinNodes(treeH),
          balanceRows=heightBalanceRows(root),broken=balanceRows.filter(r=>!r.ok),isAvl=!broken.length;
    /* The recurrence applies from h = 1 upwards. N(-1) and N(0) are base
       cases, not instances of it: there is no N(-2) to add. */
    const recRows=[['-1','--','--','0  (base case: the empty tree)',`F(2) - 1 = ${fibNumber(2)} - 1 = ${fibNumber(2)-1}`],
                   ['0','--','--','1  (base case: a single node)',`F(3) - 1 = ${fibNumber(3)} - 1 = ${fibNumber(3)-1}`]];
    for(let k=1;k<=10;k++){
      const prev=avlMinNodes(k-1),prev2=avlMinNodes(k-2),nk=avlMinNodes(k);
      recRows.push([String(k),String(prev),String(prev2),`${prev} + ${prev2} + 1 = ${nk}`,`F(${k+3}) - 1 = ${fibNumber(k+3)} - 1 = ${fibNumber(k+3)-1}`]);
    }
    t.v({n:nNodes,height:treeH,'N(height)':minForH}).step(srcLine(blocks,LAVH,'balsig'),
      `What the <code>&plusmn;1</code> limit buys: a bound on the height. Write <b>N(h)</b> for the fewest nodes an AVL tree of height <b>h</b> can hold. Its root has two AVL subtrees whose heights differ by at most 1, and at least one of them must have height <code>h&minus;1</code>; the cheapest possible choice is a minimum tree of height <code>h&minus;1</code> on one side and a minimum tree of height <code>h&minus;2</code> on the other. So <b>N(&minus;1) = 0</b>, <b>N(0) = 1</b> and <b>N(h) = N(h&minus;1) + N(h&minus;2) + 1</b>.`,
      refView(
        {title:'Why h-2 and not h-1 on both sides',html:'<p>Two subtrees of height <code>h&minus;1</code> would also satisfy the invariant, but they cost more nodes. Dropping one side to <code>h&minus;2</code> is the most lopsided an AVL node is allowed to be, so it gives the thinnest tree that still reaches height <code>h</code>. Going further - <code>h&minus;3</code> - would make the balance factor 2 and stop being an AVL tree at all.</p>'},
        refTable('Minimum nodes for each height, with the arithmetic',['h','N(h-1)','N(h-2)','N(h) = N(h-1) + N(h-2) + 1','Fibonacci identity N(h) = F(h+3) - 1'],recRows),
        {title:'The sequence',html:'<p>1, 2, 4, 7, 12, 20, 33, 54, 88, 143, 232 - each term is the sum of the previous two plus one, which is the Fibonacci sequence shifted by three and reduced by one. The <code>+1</code> is the root itself.</p>'}));

    const hShow=Math.min(treeH,6);
    const worst=avlMinTree(hShow,{n:1}),worstRows=heightBalanceRows(worst),worstN=countNodes(worst);
    t.v({'worst-case height':hShow,'worst-case nodes':worstN}).step(srcLine(blocks,LAVH,'formula'),
      hShow===0
        ?`The worst-case AVL shape of height 0 is the only shape of height 0: a single node, <code>N(0) = 1</code>.`
        :`The worst-case AVL shape of height <b>${hShow}</b>: a minimum-size tree with <b>${worstN}</b> node${worstN===1?'':'s'}, built as a root plus a minimum tree of height ${hShow-1} on the left and a minimum tree of height ${hShow-2} on the right. Every badge below is a balance factor, and every one of them is 0 or +1 - so this really is a legal AVL tree, just the thinnest one that reaches height ${hShow}. Its mirror image, with the balance factors negated, is equally minimal.`
        +(hShow<treeH?` (Drawn for height ${hShow} rather than this input's height ${treeH}, because the minimum tree of height ${treeH} has ${avlMinNodes(treeH)} nodes.)`:''),
      {kind:'multi',views:[
        {title:`minimum-size AVL tree of height ${hShow}`,kind:'tree',root:clone(worst),badges:worstRows.reduce((o,r)=>{o[r.v]=(r.bf>0?'+':'')+r.bf;return o;},{})},
        refView({title:'Reading the shape',html:`<p>The values are 1..${worstN} in order, so it is a valid binary search tree; only its <b>shape</b> matters here. Count the nodes on the longest root-to-leaf path: ${hShow+1} nodes, ${hShow} edges. Removing any single node from this tree either breaks the AVL invariant or lowers the height - that is what "minimum for this height" means.</p>`})]});

    const boundRows=[];
    for(let k=0;k<=10;k++){
      const nk=avlMinNodes(k);
      boundRows.push([String(k),String(nk),Math.pow(2,k/2).toFixed(2),(2*Math.log2(nk)).toFixed(2),k<=2*Math.log2(nk)?'yes':'NO',(1.4405*Math.log2(nk+2)-1.3277).toFixed(3)]);
    }
    t.drop('worst-case height','worst-case nodes').v({n:nNodes,height:treeH,'2*log2(n)':Number((2*Math.log2(nNodes)).toFixed(2))}).step(srcLine(blocks,LAVH,'hfield'),
      `<b>From the recurrence to O(log n).</b> <code>N(h) = N(h&minus;1) + N(h&minus;2) + 1 &gt; N(h&minus;1) + N(h&minus;2) &ge; 2<sup>(h&minus;1)/2</sup> + 2<sup>(h&minus;2)/2</sup> &ge; 2 &middot; 2<sup>(h&minus;2)/2</sup> = 2<sup>h/2</sup></code>, with <code>N(0) = 1 = 2<sup>0</sup></code> and <code>N(1) = 2 &gt; 2<sup>1/2</sup></code> as base cases. An AVL tree of n nodes and height h must satisfy <code>n &ge; N(h) &ge; 2<sup>h/2</sup></code>, which rearranges to <b>h &le; 2 &middot; log<sub>2</sub> n</b>. The height is therefore O(log n). `
      +(isAvl
        ?`<br>This tree: <code>n = ${nNodes}</code>, <code>h = ${treeH}</code>, <code>N(${treeH}) = ${minForH}</code>. ${nNodes===minForH?`<b>n equals N(h) exactly</b>, so this input is itself a minimum-size AVL tree of height ${treeH} - a worst case.`:`<code>n &ge; N(h)</code> holds, with ${nNodes-minForH} node(s) of slack.`} And <code>h = ${treeH} &le; 2 &middot; log<sub>2</sub> ${nNodes} = ${(2*Math.log2(nNodes)).toFixed(2)}</code>.`
        :`<br>This input is <b>not</b> an AVL tree - ${broken.map(r=>`node ${r.v} has balance factor ${r.bf}`).join(', ')} - and the node count shows why it cannot be: it reaches height ${treeH} with only ${nNodes} node${nNodes===1?'':'s'}, while any AVL tree of height ${treeH} needs at least <code>N(${treeH}) = ${minForH}</code>. ${nNodes<minForH?'Fewer nodes than N(h) is conclusive: no AVL tree can have this shape.':'Here the counts alone would allow it, so n &ge; N(h) is a necessary condition and not a sufficient one - the balance factors are what rule it out.'}`),
      refView(
        refTable('The bound checked at every minimum tree',['h','N(h)','2^(h/2)','2 * log2 N(h)','h <= 2 * log2 N(h)?','1.4405 * log2(N(h)+2) - 1.3277'],boundRows),
        {title:'The sharper constant',html:'<p>Because <code>N(h) = F(h+3) &minus; 1</code> and the Fibonacci numbers grow like <code>&phi;<sup>k</sup>/&radic;5</code> with <code>&phi; = (1+&radic;5)/2 &asymp; 1.618</code>, the true constant is <code>log<sub>&phi;</sub>2 &asymp; 1.44</code> rather than 2: in this edge-counted convention the classical bound is <code>h &le; 1.4405 &middot; log<sub>2</sub>(n+2) &minus; 1.3277</code>, the last column above. The <code>2 &middot; log<sub>2</sub> n</code> form is the one that falls straight out of the two-line argument, and either is enough for O(log n).</p>'},
        {title:'What the guarantee is for',html:'<p>Every AVL operation - search, insert and delete - does one root-to-leaf descent plus O(1) work per level, so each costs O(height). Bounding the height at <code>2 &middot; log<sub>2</sub> n</code> is what turns all three into O(log n) in the <b>worst</b> case, not merely on average. The same code on an unbalanced BST has no such bound: the ascending-insertion input in <i>Global and periodic BST rebalancing</i> produces height <code>n &minus; 1</code>, and the identical descent then costs O(n).</p>'}));
    return t;
  }
});

/* ---------- graph representations ---------- */
const LEC_GRAPH_REPS = `Three main graph representations:
Adjacency Matrix
    Edges are defined by presence values in a V x V matrix
Adjacency List
    Edges are defined by entries in an array of V lists
Array of Edges
    Edges are represented explicitly as (v, w) pairs`;
const LEC_ADJLIST_STRUCT = `struct graph {
    int nV;
    int nE;
    struct adjNode **edges;
};

struct adjNode {
    Vertex v;
    struct adjNode *next;
};`;
const LAL=lines(LEC_ADJLIST_STRUCT,{graph:'struct graph',nV:'int nV;',nE:'int nE;',edges:'struct adjNode **edges;',node:'struct adjNode {',v:'Vertex v;',next:'struct adjNode *next;'});
const LEC_EDGEARRAY_STRUCT = `struct graph {
    int nV;
    int nE;
    int maxE;
    struct edge *edges;
};

struct edge {
    Vertex v;
    Vertex w;
};`;
const LEA=lines(LEC_EDGEARRAY_STRUCT,{graph:'struct graph',nV:'int nV;',nE:'int nE;',max:'int maxE;',edges:'struct edge *edges;',edge:'struct edge {',v:'Vertex v;',w:'Vertex w;'});
const LEC_DIGRAPH_TERMS = `Directed graph terminology:
- each edge (v, w) has source v and destination w
- in-degree is the number of incoming edges
- out-degree is the number of outgoing edges
- a directed path follows outgoing edges
- w is reachable from v when there is a directed path from v to w
- a digraph is strongly connected when there is a directed path from every vertex to every other vertex
- a strongly-connected component is a maximally strongly-connected subgraph`;
const LEC_WEIGHTED_REPS = `Weighted graph representations:
Adjacency matrix:
    store the weight in each cell, not just true/false
    use a value to signify no edge
Adjacency list:
    add the weight to each list node
Array of edges:
    add the weight to each edge`;



/* ---------- prior-knowledge / memorisation C bridges ---------- */