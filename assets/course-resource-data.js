(function(){
'use strict';

  const COURSE_SCOPE=Object.freeze({
    'Recursion':{week:'Week 1',outline:'Course introduction, recursion, analysis of algorithms',topic:'recursion'},
    'Analysis':{week:'Week 1',outline:'Course introduction, recursion, analysis of algorithms',topic:'analysis of algorithms'},
    'Sorting':{week:'Week 2',outline:'Sorting algorithms',topic:'sorting algorithms'},
    'Abstract data types':{week:'Week 3',outline:'Abstract data types, binary search trees',topic:'abstract data types'},
    'Priority queues & heaps':{week:'Week 9',outline:'Priority queues and heaps, tries',topic:'heaps'},
    'Tries':{week:'Week 9',outline:'Priority queues and heaps, tries',topic:'tries'},
    'Binary search trees':{week:'Weeks 3–4',outline:'Binary search trees',topic:'binary search trees'},
    'Balanced BSTs':{week:'Week 4',outline:'Binary search trees continued; balanced search trees',topic:'balanced search trees'},
    'AVL trees':{week:'Week 4',outline:'Binary search trees continued; balanced search trees',topic:'balanced search trees'},
    'Hash tables':{week:'Week 8',outline:'Hash tables',topic:'hashing'},
    'Hash applications':{week:'Week 8',outline:'Hash tables',topic:'hashing applications'},
    'Graph representations':{week:'Week 4',outline:'Introduction to graphs',topic:'graphs'},
    'Graph traversal':{week:'Week 5',outline:'Graph traversal, graph problems',topic:'graph traversal'},
    'Graph problems':{week:'Week 5',outline:'Graph traversal, graph problems',topic:'graph problems'},
    'Directed graphs':{week:'Week 7',outline:'Directed/weighted graphs, Dijkstra’s algorithm, minimum spanning trees',topic:'directed and weighted graphs'},
    'Shortest paths & MSTs':{week:'Week 7',outline:'Directed/weighted graphs, Dijkstra’s algorithm, minimum spanning trees',topic:'shortest paths and minimum spanning trees'}
  });


  const STRUCTS_COMMIT='f96154f0dfe1eda2a89e2452ab8f289619077a0e';

  const TACTILE_COMMIT='05d0641442d86c44a2401bf48ceb3a24ffc8dc8b';

  const STRUCTS_BASE=`https://github.com/devsoc-unsw/structs.sh`;

  const TACTILE_BASE=`https://github.com/tymzd/Tactile-DS`;

  const resource=(id,repository,title,summary,url,licence)=>Object.freeze({id,repository,title,summary,url,licence});

  const structsDir=(id,title,summary,path)=>resource(id,'structs.sh',title,summary,`${STRUCTS_BASE}/tree/${STRUCTS_COMMIT}/${path}`,'MIT · pinned source');

  const tactileDir=(id,title,summary,path)=>resource(id,'Tactile-DS',title,summary,`${TACTILE_BASE}/tree/${TACTILE_COMMIT}/${path}`,'Reference only · no repository-wide licence located');

  const RESOURCE_GROUPS=Object.freeze({
    'Sorting':Object.freeze([
      structsDir('structs-sorting','structs.sh sorting visualiser source','Optional comparison of a modern animated sorting workspace. This tracer continues to use only its controlled 26T2 source and frames.','client/src/visualiser-src/sorting-visualiser'),
      tactileDir('tactile-sorting','Tactile-DS sorting workspace','Optional interactive C-oriented sorting reference at the reviewed commit; no source, examples or images were copied into this tracer.','sorting-algos')
    ]),
    'Binary search trees':Object.freeze([
      structsDir('structs-bst','structs.sh BST visualiser source','Optional visual-interface reference for binary search trees, pinned to the reviewed MIT commit.','client/src/visualiser-src/binary-search-tree-visualiser'),
      tactileDir('tactile-bst','Tactile-DS binary-tree workspace','Optional C-oriented BST interaction reference; the tracer does not import its implementation or examples.','binary-tree')
    ]),
    'Balanced BSTs':Object.freeze([
      structsDir('structs-bst-balanced','structs.sh BST visualiser source','Optional visual-interface reference for rotations and tree layout. Course algorithms remain unchanged.','client/src/visualiser-src/binary-search-tree-visualiser'),
      tactileDir('tactile-bst-balanced','Tactile-DS binary-tree workspace','Optional interaction reference for rotations and traversals; no Tactile-DS content is embedded.','binary-tree')
    ]),
    'AVL trees':Object.freeze([
      structsDir('structs-avl','structs.sh AVL visualiser source','Optional visual-interface reference for AVL height and rotation displays, pinned to the MIT commit.','client/src/visualiser-src/avl-tree-visualiser'),
      tactileDir('tactile-avl','Tactile-DS AVL workspace','Optional C-oriented AVL interaction reference; source and sample content remain outside this package.','avl-tree')
    ]),
    'Graph representations':Object.freeze([
      tactileDir('tactile-graph-u','Tactile-DS unweighted graph workspace','Optional reference for undirected graph interaction and representation exploration.','unweighted-graph'),
      tactileDir('tactile-digraph-u','Tactile-DS unweighted digraph workspace','Optional reference for directed graph interaction. Course representation code remains controlled locally.','unweighted-digraph')
    ]),
    'Graph traversal':Object.freeze([
      tactileDir('tactile-traversal-u','Tactile-DS unweighted graph workspace','Optional graph-traversal interaction reference; no algorithm implementation is imported.','unweighted-graph'),
      tactileDir('tactile-traversal-d','Tactile-DS unweighted digraph workspace','Optional directed traversal interaction reference, pinned to the reviewed commit.','unweighted-digraph')
    ]),
    'Graph problems':Object.freeze([
      tactileDir('tactile-problems-u','Tactile-DS unweighted graph workspace','Optional interaction reference for course-scoped graph problems.','unweighted-graph'),
      tactileDir('tactile-problems-d','Tactile-DS unweighted digraph workspace','Optional directed-graph interaction reference; the tracer’s pseudocode and traces remain unchanged.','unweighted-digraph')
    ]),
    'Directed graphs':Object.freeze([
      tactileDir('tactile-directed-u','Tactile-DS unweighted digraph workspace','Optional directed-graph interaction reference.','unweighted-digraph'),
      tactileDir('tactile-directed-w','Tactile-DS weighted digraph workspace','Optional weighted directed-graph interaction reference.','weighted-digraph')
    ]),
    'Shortest paths & MSTs':Object.freeze([
      tactileDir('tactile-weighted-u','Tactile-DS weighted graph workspace','Optional weighted-graph and Dijkstra interaction reference; MST and shortest-path teaching remains sourced from the course corpus.','weighted-graph'),
      tactileDir('tactile-weighted-d','Tactile-DS weighted digraph workspace','Optional directed weighted-graph reference at the reviewed commit.','weighted-digraph')
    ]),
    'Hash tables':Object.freeze([
      tactileDir('tactile-hash','Tactile-DS hash-table workspace','Optional hash-table interaction reference; no implementation is copied.','hash-table')
    ]),
    'Hash applications':Object.freeze([
      tactileDir('tactile-hash-apps','Tactile-DS hash-table workspace','Optional reference for visualising the underlying table used by set and counter applications.','hash-table')
    ]),
    'Priority queues & heaps':Object.freeze([
      tactileDir('tactile-heap','Tactile-DS heap workspace','Optional max-heap interaction reference; the tracer retains the manual’s 1-indexed heap mechanics.','heap')
    ])
  });

  const RESOURCE_MODULES=Object.freeze({
    // These representation modules can switch between unweighted/weighted and
    // undirected/directed modes. Their optional references therefore expose
    // the matching closed set rather than inheriting only the unweighted
    // group-level pair.
    graphlist:Object.freeze([
      tactileDir('tactile-list-u','Tactile-DS unweighted graph workspace','Optional adjacency-list interaction reference for an undirected unweighted graph.','unweighted-graph'),
      tactileDir('tactile-list-d','Tactile-DS unweighted digraph workspace','Optional adjacency-list interaction reference for a directed unweighted graph.','unweighted-digraph'),
      tactileDir('tactile-list-wu','Tactile-DS weighted graph workspace','Optional adjacency-list interaction reference for a weighted undirected graph.','weighted-graph'),
      tactileDir('tactile-list-wd','Tactile-DS weighted digraph workspace','Optional adjacency-list interaction reference for a weighted directed graph.','weighted-digraph')
    ]),
    graphedges:Object.freeze([
      tactileDir('tactile-edges-u','Tactile-DS unweighted graph workspace','Optional edge-set interaction reference for an undirected unweighted graph.','unweighted-graph'),
      tactileDir('tactile-edges-d','Tactile-DS unweighted digraph workspace','Optional edge-set interaction reference for a directed unweighted graph.','unweighted-digraph'),
      tactileDir('tactile-edges-wu','Tactile-DS weighted graph workspace','Optional edge-set interaction reference for a weighted undirected graph.','weighted-graph'),
      tactileDir('tactile-edges-wd','Tactile-DS weighted digraph workspace','Optional edge-set interaction reference for a weighted directed graph.','weighted-digraph')
    ]),
    graphweighted:Object.freeze([
      tactileDir('tactile-weighted-rep-u','Tactile-DS weighted graph workspace','Optional weighted-graph representation reference; course source remains local and controlled.','weighted-graph'),
      tactileDir('tactile-weighted-rep-d','Tactile-DS weighted digraph workspace','Optional directed weighted-graph representation reference; no source is embedded.','weighted-digraph')
    ])
  });

window.TRACER_RESOURCE_DATA = Object.freeze({
  groups: RESOURCE_GROUPS,
  modules: RESOURCE_MODULES
});
}());
