mod({id:'adtarch',group:'Abstract data types',name:"ADT architecture - interface, contract and implementation",keywords:'abstraction opaque pointer h c interface implementation contract bank account',blocks:[{title:"ADT architecture - lecture",src:LEC_ADT_ARCH,source:'lecture',pseudo:true,pages:'week03lec01'}],note:"The interface is the client contract. Preconditions such as \"assumes the stack is not empty\" are part of the operation contract and must be respected by callers.",fields:[],run(){const t=new Trace();t.step([0,1],'Follow the visibility boundary from client to interface to hidden implementation.',refView(
  {title:'Client',html:'<p>Includes the <code>.h</code> file and calls documented operations. It cannot dereference the opaque ADT pointer because the concrete structure is hidden.</p>'},
  {title:'Interface (.h)',html:'<p>Forward declaration such as <code>typedef struct stack *Stack;</code>, prototypes, behaviour, inputs/outputs and usage conditions.</p>'},
  {title:'Implementation (.c)',html:'<p>Defines <code>struct stack</code> and each operation. Constructors establish invariants; destructors release all owned memory.</p>'},
  {title:'Examples in the lecture',html:'<p>Stack, Queue, Set and a Bank Account ADT. The same separation applies to every manual ADT.</p>'}
));return t;}});

mod({id:'setadt',group:'Abstract data types',name:"Set ADT - interface and representation trade-offs",keywords:'set insert contains delete size show array list AVL hash',blocks:[{title:"Set interface - lecture C",src:LEC_SET_IF,source:'lecture',pages:'week08 hash applications'}],note:'The lecture compares unordered arrays, ordered arrays, linked lists, AVL trees and hash tables. No single concrete Set implementation is supplied in the uploaded course files, so this module does not invent one.',fields:[],run(){const t=new Trace();t.step([0,1],'Set operations and implementation costs.',refView(
 refTable('Set interface',['Operation','Meaning'],[['SetNew','create empty set'],['SetFree','release owned memory'],['SetInsert','insert a distinct item'],['SetContains','membership test'],['SetDelete','delete an item'],['SetSize','number of items'],['SetShow','display set']]),
 refTable('Representation comparison',['Representation','Insert','Membership','Delete'],[['Unordered array','O(n)','O(n)','O(n)'],['Ordered array','O(n)','O(log n)','O(n)'],['Linked list','O(n)','O(n)','O(n)'],['AVL tree','O(log n)','O(log n)','O(log n)'],['Hash table (average)','O(1)','O(1)','O(1)']])
));return t;}});

/* ---------- BST traversal and balancing ---------- */
const LEC_BST_TRAV = `preorder(t):
    if t is empty:
        return
    visit(t)
    preorder(t->left)
    preorder(t->right)

inorder(t):
    if t is empty:
        return
    inorder(t->left)
    visit(t)
    inorder(t->right)

postorder(t):
    if t is empty:
        return
    postorder(t->left)
    postorder(t->right)
    visit(t)

Level-order traversal is implemented using a queue.`;
const LBTR=lines(LEC_BST_TRAV,{pre:'preorder(t):',in:'inorder(t):',post:'postorder(t):',empty:'if t is empty:',visit:'visit(t)',left:'inorder(t->left)',right:'inorder(t->right)',level:'Level-order'});