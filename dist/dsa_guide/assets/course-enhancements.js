"use strict";
/*
 * COMP2521 Tracer v6.4.1 \u2014 course-scoped external interaction assets
 *
 * Scope gate:
 *   - educational code/pseudocode remains controlled by the 26T2 manual,
 *     supplied lectures and visibly declared MEMORISE bridges;
 *   - this file adds interaction methods only;
 *   - no Tactile-DS code, imagery or Tactile-specific prose is copied because no repository
 *     licence file was located at the examined commit;
 *   - the marked timeline and pan/zoom approach adapt MIT-licensed ideas from
 *     devsoc-unsw/structs.sh (see THIRD_PARTY_NOTICES.md).
 */
(function courseScopedEnhancements(){
  if(typeof playerState==='undefined'||typeof UI==='undefined'||typeof MODULES==='undefined')return;

  const ENHANCEMENT_VERSION='6.4.1';
  /* ==================================================================
     CUR-MOD-01 - REVIEWED CURRICULUM REGISTER
     ------------------------------------------------------------------
     This replaces the former group -> single week map. A single group
     chip could not express a mixed lesson: 'Graph representations'
     carried 'Week 4' while graphweighted also contains directed and
     weighted material that the official schedule introduces in Week 5
     and applies in Week 7.

     Each record keeps SEPARATE axes, and OFFICIAL facts are kept apart
     from this build's own recommended sequence:
       introduced    - official first teaching week (OFF-01 only)
       applied       - later official application/reuse weeks (OFF-01)
       revision      - official revision slots, including the literal
                       'Extra' linked-list revision entry
       prerequisites - prerequisite topic ids inside this build
       provenance    - week/term locator of the quoted source material
       assessment    - separate assessment axis, qualified by term+source
       relevance     - directly taught | prerequisite-revision |
                       contextual-named | supplemental extension |
                       development-only
       inference     - anything derived from a topic's own subject. An
                       inference is NEVER promoted to an official week.
       reviewDepth   - what was actually done, at the honest granularity

     Two standing rules are encoded here rather than left to prose:
       1. 'Extra: linked-list revision' is carried with the literal week
          label 'Extra' and numbered:false. There is no Week 0.
       2. A structure used as an optimisation inside another week's
          lesson does not move the week in which the course formally
          teaches that structure, so `applied` never overwrites
          `introduced`.

     SOURCE LIMIT, stated wherever it applies: the 21 declared original
     course documents (26T2 manual, week*.docx lecture files) are ABSENT
     from this repository, and OFF-04/05/06 returned HTTP 403. Exact
     quotation parity against the originals therefore CANNOT be
     certified by this build, and no record below claims it.
     ================================================================== */
  const CURRICULUM_SOURCES=Object.freeze({
    'OFF-01':Object.freeze({title:'COMP2521 26T2 Lectures - official lecture schedule',url:'https://webcms3.cse.unsw.edu.au/COMP2521/26T2/resources/121287',term:'26T2',status:'read',verified:'2026-10-20'}),
    'OFF-02':Object.freeze({title:'Important COMP2521 Final Exam Update - notice dated 6 August 2026',url:'https://webcms3.cse.unsw.edu.au/COMP2521/26T2/',term:'26T2',status:'read',verified:'2026-10-20'}),
    'OFF-04':Object.freeze({title:'COMP2521 26T2 Outline',url:'https://webcms3.cse.unsw.edu.au/COMP2521/26T2/outline',term:'26T2',status:'unavailable - HTTP 403',verified:'2026-10-20'}),
    'OFF-08':Object.freeze({title:'Directed/Weighted Graphs - current-term slide link in the 26T2 schedule',url:'https://webcms3.cse.unsw.edu.au/COMP2521/26T2/resources/121287',term:'26T2',status:'link resolves to a sign-in-required SharePoint page; contents not read',verified:'2026-10-20'}),
    'OFF-09':Object.freeze({title:'Directed/Weighted Graphs - past-term slides linked by the current schedule',url:'https://cgi.cse.unsw.edu.au/~cs2521/25T3/lectures/slides/week05lec02-directed-weighted-graphs.pdf',term:'25T3',status:'read - past term, contextual only',verified:'2026-10-20'}),
    'LOCAL':Object.freeze({title:'This build’s own displayed source blocks and trace generators',url:'',term:'not a course source',status:'read and executed',verified:'2026-10-20'}),
    'ABSENT':Object.freeze({title:'Declared original course documents (26T2 manual and week*.docx lectures)',url:'',term:'26T2',status:'ABSENT from this repository - exact quotation parity cannot be certified',verified:'2026-10-20'})
  });

  /* OFF-01 verbatim group names, in schedule order. 'Extra' is not a
     numbered week and Week 6 is Flex with no lectures. */
  const OFFICIAL_WEEKS=Object.freeze([
    Object.freeze({week:'Week 1',numbered:true,groups:Object.freeze(['Introduction','Recursion','Algorithm analysis'])}),
    Object.freeze({week:'Extra',numbered:false,groups:Object.freeze(['Linked-list revision']),note:'Listed as Extra in the official schedule, not a numbered lecture week.'}),
    Object.freeze({week:'Week 2',numbered:true,groups:Object.freeze(['Sorting'])}),
    Object.freeze({week:'Week 3',numbered:true,groups:Object.freeze(['Abstract data types','Binary search trees'])}),
    Object.freeze({week:'Week 4',numbered:true,groups:Object.freeze(['BST balancing','AVL trees','Graph introduction'])}),
    Object.freeze({week:'Week 5',numbered:true,groups:Object.freeze(['Graph traversal','Graph problems','Directed and weighted graph introduction'])}),
    Object.freeze({week:'Week 6',numbered:true,groups:Object.freeze([]),note:'Flex week; no lectures. Not a graph-teaching week.'}),
    Object.freeze({week:'Week 7',numbered:true,groups:Object.freeze(['Digraph algorithms','Dijkstra','Minimum spanning trees'])}),
    Object.freeze({week:'Week 8',numbered:true,groups:Object.freeze(['Hash tables','Hash-table applications'])}),
    Object.freeze({week:'Week 9',numbered:true,groups:Object.freeze(['Priority queues and heaps','Tries'])}),
    Object.freeze({week:'Week 10',numbered:true,groups:Object.freeze(['Course and exam review','Revision'])})
  ]);

  /* An official week+group citation. Every one of these is OFF-01. */
  const off=(week,group)=>Object.freeze({week,group,sourceId:'OFF-01',official:true,
    numbered:(OFFICIAL_WEEKS.find(row=>row.week===week)||{numbered:true}).numbered!==false});

  /* Assessment axis. Only ONE item-specific assessment fact was
     independently readable, and it is deliberately narrow: the
     6 August 2026 notice excludes heaps and tries from the 26T2
     PROGRAMMING section of the final only. They may still be examined in
     theory, they are not removed from the curriculum, and the label is
     qualified by term and notice. Nothing here applies to another term. */
  const ASSESS_HEAPS_TRIES=Object.freeze({
    programming:'Excluded from the 26T2 final exam PROGRAMMING section by the notice dated 6 August 2026.',
    theory:'May still be examined in the theory section.',
    scope:'26T2 only. This label must not be applied to any other term.',
    examinable:true,
    sourceId:'OFF-02'
  });
  const ASSESS_NONE=Object.freeze({
    programming:'No item-specific assessment requirement was independently established.',
    theory:'No item-specific assessment requirement was independently established.',
    scope:'The 26T2 outline, Tutorials/Labs/Quizzes and Exams resources returned HTTP 403, so this axis is OPEN, not negative.',
    examinable:null,
    sourceId:'OFF-04'
  });

  const EMPTY=Object.freeze([]);
  const entry=spec=>Object.freeze({
    topic:spec.topic,
    introduced:spec.introduced||null,
    applied:Object.freeze(spec.applied||EMPTY),
    revision:Object.freeze(spec.revision||EMPTY),
    prerequisites:Object.freeze(spec.prerequisites||EMPTY),
    provenance:Object.freeze(spec.provenance||{locator:'not recorded',term:'unknown',sourceId:'ABSENT',
      note:'The declared original is absent from this repository; the displayed text cannot be compared with it.'}),
    assessment:spec.assessment||ASSESS_NONE,
    relevance:spec.relevance||'directly taught',
    inference:spec.inference||null,
    reviewDepth:spec.reviewDepth||'read metadata only',
    admitted:spec.admitted!==false,
    reason:spec.reason||null
  });

  /* Provenance helper: a supplied transcription whose filename names a
     week. A filename is NOT evidence of a taught week, so this records
     the locator only and never feeds `introduced`. */
  const prov=(locator,term,sourceId,note)=>Object.freeze({locator,term,sourceId,
    note:note||'Locator taken from the supplied transcription’s own filename. A filename is not independent evidence of a taught week, and the original document is absent, so exact quotation parity is not certified.'});

  const SUPPLIED=prov('week* transcription supplied with this build','declared 26T2; the declared original is absent','ABSENT');

  /* ---------- group-level records (the default for a group) ---------- */
  const GROUP_CURRICULUM=Object.freeze({
    'Recursion':entry({topic:'recursion',introduced:off('Week 1','Recursion'),
      applied:[off('Week 2','Sorting'),off('Week 3','Binary search trees'),off('Week 5','Graph traversal')],
      revision:[off('Week 10','Revision')],provenance:prov('week01lec01','declared 26T2','ABSENT'),
      inference:'The later application weeks are this build’s reading of where recursion is reused (divide-and-conquer sorts, tree and graph recursion). OFF-01 names the week-1 introduction only.',
      reviewDepth:'executed module defaults and independently checked the factorial call-stack semantics (RES-01)'}),
    'Analysis':entry({topic:'analysis of algorithms',introduced:off('Week 1','Algorithm analysis'),
      applied:[off('Week 2','Sorting')],revision:[off('Week 10','Course and exam review')],
      provenance:prov('week01lec02','declared 26T2','ABSENT'),
      inference:'Reuse in the sorting week is this build’s reading, not an OFF-01 assignment.',
      reviewDepth:'executed module default'}),
    'Sorting':entry({topic:'sorting algorithms',introduced:off('Week 2','Sorting'),
      applied:[off('Week 9','Priority queues and heaps')],revision:[off('Week 10','Revision')],
      prerequisites:['analysis'],provenance:prov('week02lec01/week02lec02','declared 26T2','ABSENT'),
      inference:'The week-9 application note is heap sort reusing sorting ideas; it does not move sorting out of Week 2 and does not move heaps out of Week 9.',
      reviewDepth:'independently checked comparison-count semantics for eight sorting modules with oracles written from the displayed source (RES-02)'}),
    'Abstract data types':entry({topic:'abstract data types',introduced:off('Week 3','Abstract data types'),
      applied:[off('Week 5','Graph traversal'),off('Week 8','Hash tables'),off('Week 9','Priority queues and heaps')],
      revision:[off('Week 10','Revision')],provenance:prov('week03lec01','declared 26T2','ABSENT'),
      inference:'The Stack and Queue ADTs are reused by the traversal, hashing and heap lessons. That reuse is this build’s reading; OFF-01 names the week-3 introduction only.',
      reviewDepth:'executed module defaults'}),
    'Binary search trees':entry({topic:'binary search trees',introduced:off('Week 3','Binary search trees'),
      applied:[off('Week 4','BST balancing'),off('Week 4','AVL trees')],revision:[off('Week 10','Revision')],
      prerequisites:['recpyramid'],provenance:prov('week03lec02','declared 26T2','ABSENT'),
      inference:'Week 4 is recorded as an application week because OFF-01 places BST balancing and AVL trees there and both build on the week-3 BST. The BST itself is not moved to Week 4; the former ‘Weeks 3-4’ label conflated the two.',
      reviewDepth:'executed module defaults'}),
    'Balanced BSTs':entry({topic:'balanced search trees',introduced:off('Week 4','BST balancing'),
      revision:[off('Week 10','Revision')],prerequisites:['bstins','bstsearch','bsttrav'],
      provenance:prov('week04lec01-balancing-bsts','declared 26T2','ABSENT'),reviewDepth:'executed module defaults'}),
    'AVL trees':entry({topic:'AVL trees',introduced:off('Week 4','AVL trees'),revision:[off('Week 10','Revision')],
      prerequisites:['bstins','bstrotate'],provenance:prov('week04lec01-avl-trees','declared 26T2','ABSENT'),
      reviewDepth:'executed module defaults and independently checked that no displayed block reaches the avlSearch bridge (CUR-MOD-04)'}),
    'Hash tables':entry({topic:'hashing',introduced:off('Week 8','Hash tables'),
      applied:[off('Week 8','Hash-table applications')],revision:[off('Week 10','Revision')],
      prerequisites:['adtarch','listsorts'],provenance:prov('week08lec01','declared 26T2','ABSENT'),
      reviewDepth:'independently checked the load-factor branch, the resize-not-implemented warning and the tombstone/backshift split (CUR-MOD-04)'}),
    'Hash applications':entry({topic:'hashing applications',introduced:off('Week 8','Hash-table applications'),
      revision:[off('Week 10','Revision')],prerequisites:['hash','setadt'],
      provenance:prov('week08lec02','declared 26T2','ABSENT'),reviewDepth:'executed module defaults'}),
    'Priority queues & heaps':entry({topic:'priority queues and heaps',introduced:off('Week 9','Priority queues and heaps'),
      revision:[off('Week 10','Revision')],prerequisites:['adtarch','sortprops'],
      provenance:prov('week09lec01','declared 26T2','ABSENT'),assessment:ASSESS_HEAPS_TRIES,
      inference:'Dijkstra and Prim can be optimised with a priority queue, and the Week 7 lesson may mention that. Under the standing rule above this does NOT move heaps earlier than Week 9, so no Week 7 entry is recorded here.',
      reviewDepth:'executed module defaults'}),
    'Tries':entry({topic:'tries',introduced:off('Week 9','Tries'),revision:[off('Week 10','Revision')],
      prerequisites:['adtarch'],provenance:prov('26T2 manual trie section','declared 26T2','ABSENT'),
      assessment:ASSESS_HEAPS_TRIES,reviewDepth:'executed module default'}),
    'Graph representations':entry({topic:'graphs',introduced:off('Week 4','Graph introduction'),
      applied:[off('Week 5','Directed and weighted graph introduction')],revision:[off('Week 10','Revision')],
      provenance:prov('week04lec02-graphs-intro','declared 26T2','ABSENT'),
      inference:'Week 5 is recorded as an application week for this group because several of its modules also carry directed and weighted material, which OFF-01 introduces in Week 5. Week 4 graph fundamentals are NOT moved to Week 5.',
      reviewDepth:'compared group membership and block titles against OFF-01 week rows'}),
    'Graph traversal':entry({topic:'graph traversal',introduced:off('Week 5','Graph traversal'),
      revision:[off('Week 10','Revision')],prerequisites:['graphfund','graphadt','queue','stack'],
      provenance:prov('week05lec01-graph-traversal','declared 26T2','ABSENT'),reviewDepth:'executed module defaults'}),
    'Graph problems':entry({topic:'graph problems',introduced:off('Week 5','Graph problems'),
      revision:[off('Week 10','Revision')],prerequisites:['dfs','bfs'],
      provenance:prov('week05lec02-graph-problems','declared 26T2','ABSENT'),reviewDepth:'executed module defaults'}),
    'Directed graphs':entry({topic:'directed graphs',introduced:off('Week 5','Directed and weighted graph introduction'),
      applied:[off('Week 7','Digraph algorithms')],revision:[off('Week 10','Revision')],
      prerequisites:['graphfund','dfs','bfs'],
      provenance:prov('week05lec02-directed-weighted-graphs','declared 26T2; the only copy of these slides that was independently readable is the 25T3 PDF','OFF-09',
        'OFF-08 (the current-term link) resolves to a sign-in-required page, so no 26T2 slide contents were read. The 25T3 PDF is contextual only and its term stays visible. A page titled 26T2 does not make a 25T3 transcription a 26T2 quotation.'),
      inference:'The group as a whole is introduced in Week 5 (terminology). Individual digraph ALGORITHMS are recorded per topic below against OFF-01’s Week 7 ‘Digraph algorithms’ row; the former flat ‘Week 7’ group label hid that split.',
      reviewDepth:'compared group membership and block titles against OFF-01 week rows'}),
    'Shortest paths & MSTs':entry({topic:'shortest paths and minimum spanning trees',
      introduced:off('Week 7','Dijkstra'),applied:[off('Week 7','Minimum spanning trees')],
      revision:[off('Week 10','Revision')],prerequisites:['graphweighted','graphfund','bfs','dfs'],
      provenance:prov('week07lec01-dijkstras-algorithm / week07lec02-msts','declared 26T2','ABSENT'),
      inference:'Weighted-graph terminology is a Week 5 prerequisite for this group; the algorithms themselves are Week 7 in OFF-01.',
      reviewDepth:'executed module defaults'}),
    'Searching':entry({topic:'searching',introduced:null,
      applied:[off('Week 1','Algorithm analysis')],revision:[off('Week 10','Revision')],
      provenance:prov('26T2 manual search section','declared 26T2','ABSENT'),
      relevance:'prerequisite-revision',admitted:false,
      reason:'Searching is present in the supplied manual but is NOT a named group in the official 26T2 lecture schedule, so no official teaching week can be assigned to it and the external-asset gate stays closed.',
      inference:'Linear and binary search are used as the worked examples of the Week 1 analysis lesson, so Week 1 is recorded as an APPLICATION week. That is this build’s reading of its own coverage row, not an OFF-01 assignment: absence from a high-level outline heading is not a reason to call the topic irrelevant.',
      reviewDepth:'executed module defaults; searched OFF-01 for a matching group name and found none'}),
    'Course map':entry({topic:'course map',introduced:null,relevance:'development-only',admitted:false,
      reason:'This is an internal tracer index rather than a taught 26T2 topic, so no external enrichment is admitted.',
      provenance:prov('this build’s own coverage register','not a course source','LOCAL',
        'Generated inside this build. It has no official teaching week and must not be given one.'),
      reviewDepth:'read and executed the register that generates it'})
  });

  /* ---------- per-topic overrides ----------
     Only the topics whose own content differs from the group default need
     a record here. Everything else inherits the group record above. */
  const TOPIC_CURRICULUM=Object.freeze({
    /* The mixed lesson named by CUR-MOD-01. 17 blocks spanning basic,
       directed and weighted material across three representations. */
    graphweighted:entry({topic:'graph mode x representation study matrix',
      introduced:off('Week 4','Graph introduction'),
      applied:[off('Week 5','Directed and weighted graph introduction'),off('Week 7','Digraph algorithms')],
      revision:[off('Week 10','Revision')],
      prerequisites:['graphfund','graphreps','graphadt','graphlist','graphedges'],
      provenance:prov('week05lec02-directed-weighted-graphs for the directed/weighted blocks; week04lec02-graphs-intro for the base representations','declared 26T2; independently readable copy is 25T3 only','OFF-09',
        'OFF-08, the current-term slide link, resolves to a sign-in-required SharePoint page and was not read. The 25T3 PDF (OFF-09) is contextual only. The declared 26T2 original is absent, so no per-block quotation parity is certified.'),
      inference:'Only the UNDIRECTED UNWEIGHTED base representations belong to the Week 4 introduction. The directed and weighted variants in this matrix are Week 5 material and the weighted-digraph combinations are used by Week 7 algorithms. Which individual block belongs to which week is this build’s topical inference from the block titles, NOT an official per-block assignment: OFF-01 names week groups, not blocks. Week 6 is Flex and is not a graph-teaching week.',
      reviewDepth:'read every block title, executed the module default and compared the block titles with the OFF-01 Week 4/5/7 rows; NOT compared with the original course document, which is absent'}),
    graphfund:entry({topic:'graph fundamentals and terminology',
      introduced:off('Week 4','Graph introduction'),
      applied:[off('Week 5','Directed and weighted graph introduction')],revision:[off('Week 10','Revision')],
      provenance:prov('week04lec02-graphs-intro','declared 26T2','ABSENT'),
      inference:'The module also classifies DIRECTED input through its own `kind` field, and directedness is a Week 5 concept in OFF-01. The undirected fundamentals stay in Week 4.',
      reviewDepth:'executed the module default and read its two frames; the second frame classifies the supplied edge list'}),
    graphreps:entry({topic:'graph representation comparison',
      introduced:off('Week 4','Graph introduction'),
      applied:[off('Week 5','Directed and weighted graph introduction')],revision:[off('Week 10','Revision')],
      prerequisites:['graphfund'],provenance:prov('week04lec02-graphs-intro','declared 26T2','ABSENT'),
      inference:'The three-representation comparison is Week 4. The weighted variants among its blocks are Week 5 material by topical inference from the block titles.',
      reviewDepth:'read block titles and executed the module default'}),
    graphlist:entry({topic:'adjacency-list representation',
      introduced:off('Week 4','Graph introduction'),
      applied:[off('Week 5','Directed and weighted graph introduction')],revision:[off('Week 10','Revision')],
      prerequisites:['graphfund','graphreps'],provenance:prov('week04lec02-graphs-intro','declared 26T2','ABSENT'),
      inference:'Its weighted and directed adjacency-list blocks are Week 5 material by topical inference; the undirected unweighted list is Week 4.',
      reviewDepth:'read block titles and executed the module default'}),
    graphedges:entry({topic:'array-of-edges representation',
      introduced:off('Week 4','Graph introduction'),
      applied:[off('Week 5','Directed and weighted graph introduction'),off('Week 7','Minimum spanning trees')],
      revision:[off('Week 10','Revision')],prerequisites:['graphfund','graphreps'],
      provenance:prov('week04lec02-graphs-intro','declared 26T2','ABSENT'),
      inference:'Week 7 is recorded as an application week because Kruskal consumes an edge array. That is reuse, not a second introduction.',
      reviewDepth:'read block titles and executed the module default'}),
    /* Digraph ALGORITHMS: Week 7 in OFF-01, with the Week 5 directed
       introduction as the prerequisite. The old flat group label put the
       directed terminology itself in Week 7. */
    warshall:entry({topic:'transitive closure',introduced:off('Week 7','Digraph algorithms'),
      revision:[off('Week 10','Revision')],prerequisites:['graphfund','graphadt','cycled'],
      provenance:prov('week07lec01-digraph-algorithms','declared 26T2','ABSENT'),
      inference:'Directed-graph terminology is introduced in Week 5 and is recorded as a prerequisite, not as this topic’s introduction week.',
      reviewDepth:'executed module default'}),
    cycled:entry({topic:'directed cycle checking',introduced:off('Week 7','Digraph algorithms'),
      revision:[off('Week 10','Revision')],prerequisites:['graphfund','dfs','cycleu'],
      provenance:prov('week07lec01-digraph-algorithms','declared 26T2','ABSENT'),
      reviewDepth:'executed module default'}),
    webcrawl:entry({topic:'digraph traversal applied to web crawling',introduced:off('Week 7','Digraph algorithms'),
      revision:[off('Week 10','Revision')],prerequisites:['bfs','setadt'],
      provenance:prov('week07lec01-digraph-algorithms','declared 26T2','ABSENT'),
      reviewDepth:'executed module default'}),
    /* Linked-list material: revision is the literal 'Extra' entry, never
       a numbered Week 0. */
    reclistsum:entry({topic:'recursion over a linked list',introduced:off('Week 1','Recursion'),
      revision:[off('Extra','Linked-list revision'),off('Week 10','Revision')],
      provenance:prov('week01lec01','declared 26T2','ABSENT'),
      inference:'The linked-list prerequisite is carried as the official ‘Extra’ revision entry. It is deliberately not numbered: the official schedule has no Week 0.',
      reviewDepth:'executed module default'}),
    reclistappend:entry({topic:'returned-pointer rewiring in recursive list append',
      introduced:off('Week 1','Recursion'),revision:[off('Extra','Linked-list revision'),off('Week 10','Revision')],
      provenance:prov('week01lec01','declared 26T2','ABSENT'),
      inference:'Linked-list prerequisite carried as the official ‘Extra’ revision entry, not a numbered week.',
      reviewDepth:'executed module default'}),
    listsorts:entry({topic:'sorting a linked list by insertion, selection or bubble',introduced:off('Week 2','Sorting'),
      revision:[off('Extra','Linked-list revision'),off('Week 10','Revision')],
      prerequisites:['ins','reclistappend'],provenance:prov('week02lec01-elementary-sorts','declared 26T2','ABSENT'),
      inference:'The linked-list representation it relies on is the official ‘Extra’ revision material, not a numbered week. The sorting lesson itself is Week 2.',
      reviewDepth:'independently checked its insertion-scan comparison counts against the generator’s own loop (RES-02)'}),
    recfactorial:entry({topic:'factorial recursion, winding and unwinding',introduced:off('Week 1','Recursion'),
      applied:[off('Week 2','Sorting')],revision:[off('Week 10','Revision')],
      provenance:prov('week01lec01','declared 26T2','ABSENT'),
      inference:'Reuse in the divide-and-conquer sorting week is this build’s reading, not an OFF-01 assignment.',
      reviewDepth:'independently checked the call-stack depth, multiplication count and return value for n = 0, 1 and 5 (RES-01)'}),
    namedalgos:entry({topic:'named-only and contextual syllabus items',introduced:null,
      relevance:'contextual-named',admitted:false,
      reason:'This is the build’s own source-boundary index, not a taught 26T2 topic.',
      provenance:prov('this build’s own source-boundary list','not a course source','LOCAL'),
      inference:'The items it lists are named across Weeks 2, 7, 8 and 9 by their coverage rows, but the module itself has no teaching week.',
      reviewDepth:'executed the module default and read its full block; found that it omits union-find, which its own coverage row names (recorded as an open gap)'}),
    coursemap:entry({topic:'coverage index',introduced:null,relevance:'development-only',admitted:false,
      reason:'Internal tracer index; no external enrichment is admitted.',
      provenance:prov('this build’s own coverage register','not a course source','LOCAL'),
      reviewDepth:'read and executed the register that generates it'}),
    /* Heap-adjacent graph optimisation note, kept on the graph topics so
       the standing rule is visible where it matters. */
    dijkstra:entry({topic:'single-source shortest paths',introduced:off('Week 7','Dijkstra'),
      revision:[off('Week 10','Revision')],prerequisites:['graphweighted','graphfund','bfs'],
      provenance:prov('week07lec01-dijkstras-algorithm','declared 26T2','ABSENT'),
      inference:'A priority queue is the usual optimisation for the vertex-selection step. Recording that here does NOT move heaps out of Week 9; heaps keep their own Week 9 introduction.',
      reviewDepth:'executed module default'}),
    prim:entry({topic:'minimum spanning tree by Prim',introduced:off('Week 7','Minimum spanning trees'),
      revision:[off('Week 10','Revision')],prerequisites:['graphweighted','graphedges'],
      provenance:prov('week07lec02-msts','declared 26T2','ABSENT'),
      inference:'A priority queue is the usual optimisation for the crossing-edge choice. That does not move heaps out of Week 9.',
      reviewDepth:'executed module default'}),
    kruskal:entry({topic:'minimum spanning tree by Kruskal',introduced:off('Week 7','Minimum spanning trees'),
      revision:[off('Week 10','Revision')],prerequisites:['graphweighted','graphedges','cycleu'],
      provenance:prov('week07lec02-msts','declared 26T2','ABSENT'),
      inference:'Union-find is the usual cycle-check optimisation and its coverage row names it, but the named-only destination omits it. Recorded as an open gap rather than quietly dropped.',
      reviewDepth:'executed module default and searched every displayed block for a union-find reference (none outside the coverage index itself)'})
  });

  const curriculumFor=module=>{
    if(!module)return null;
    return TOPIC_CURRICULUM[module.id]||GROUP_CURRICULUM[module.group]||null;
  };
  const weekList=rows=>rows.map(row=>row.week);
  const uniq=values=>[...new Set(values)];
  /* The chip label is generated from the record, never stored twice. */
  const weekLabelFor=record=>{
    if(!record)return 'Not externally admitted';
    if(!record.introduced)return 'No official 26T2 lecture week';
    const later=uniq(weekList(record.applied).filter(week=>week!==record.introduced.week));
    return later.length
      ? `${record.introduced.week} intro; applied ${later.join(', ')}`
      : record.introduced.week;
  };
  const outlineLabelFor=record=>{
    if(!record)return 'No matching topic is named in the COMP2521 2026 Term 2 lecture schedule';
    const parts=[];
    if(record.introduced)parts.push(`Introduced in ${record.introduced.week}: ${record.introduced.group}`);
    else parts.push('No official 26T2 lecture-schedule group names this topic');
    const later=record.applied.filter(row=>!record.introduced||row.week!==record.introduced.week);
    if(later.length)parts.push(`later applied in ${uniq(later.map(row=>`${row.week} (${row.group})`)).join(' and ')}`);
    if(record.revision.length)parts.push(`revision: ${uniq(record.revision.map(row=>row.numbered===false?`${row.week} - ${row.group}`:row.week)).join(', ')}`);
    parts.push(`official source ${record.introduced?record.introduced.sourceId:'OFF-01'}, term 26T2`);
    if(record.inference)parts.push('plus a labelled inference');
    return parts.join('; ');
  };

  /* COURSE_SCOPE / EXCLUDED_SCOPE are now VIEWS of the one register above,
     so the admission gate and the week labels cannot drift apart. */
  const COURSE_SCOPE=Object.freeze(Object.fromEntries(
    Object.entries(GROUP_CURRICULUM).filter(pair=>pair[1].admitted!==false)));
  const EXCLUDED_SCOPE=Object.freeze(Object.fromEntries(
    Object.entries(GROUP_CURRICULUM).filter(pair=>pair[1].admitted===false)));

  const recipe=(id,title,objective,values)=>Object.freeze({id,title,objective,values:Object.freeze({...values})});
  const RECIPES={};
  const add=(id,...items)=>{RECIPES[id]=Object.freeze(items);};

  add('recpyramid',
    recipe('base','Smallest valid pyramid','Build one layer, then observe the recursive call reach the non-positive base case.',{n:'1'}),
    recipe('layers','Seven-wide pyramid','Follow winding until the base case and then the completed layers.',{n:'7'}));
  /* RES-01. The displayed source is
       int factorial(int n) { if (n == 0) { return 1; } else { return n * factorial(n - 1); } }
     so factorial(5) descends all the way to factorial(0). At peak there are
     SIX active calls - factorial(5), (4), (3), (2), (1) and (0) - and the
     result is 120. There are FIVE recursive transitions and therefore five
     multiplications, which is a different count from the number of frames.
     The old objective said "five stack frames" and conflated the two.
     Independently checked: n=0 gives 1 frame and returns 1; n=1 gives 2
     frames and 1 multiplication; n=5 gives 6 frames, 5 multiplications and
     returns 120. The module's call-stack view and its note agree with this. */
  add('recfactorial',
    recipe('zero','Factorial base case','Observe factorial(0) return without another call: one stack frame, no multiplication, result 1.',{n:'0'}),
    recipe('unwind','Winding and unwinding','Count the two things separately. Six stack frames are active at peak - factorial(5) down to the factorial(0) base case - but only five recursive transitions, so only five multiplications on the way back out. Result 120.',{n:'5'}));
  add('reclistsum',
    recipe('short','Short linked list','Track the head value plus the recursively computed suffix.',{a:'3 1 4'}),
    recipe('signed','Signed values','Observe that recursive structure is independent of value sign.',{a:'9 -2 5 0'}));
  add('reclistappend',
    recipe('append','Append through returned links','Follow recursion to NULL and the returned pointer chain.',{a:'4 5 7',value:'9'}),
    recipe('single','Single-node append','Use the smallest non-empty linked-list append.',{a:'1',value:'2'}));
  add('analysis',
    recipe('small','Small input','Count primitive operations for an easy-to-check n.',{n:'8'}),
    recipe('growth','Growth comparison','Compare the same functions at a larger input.',{n:'64'}));

  // Search remains in the manual-based tracer, but receives no external
  // recipe asset because it is not a named 26T2 course-outline topic.

  /* ==================================================================
     RES-02 - PER-ALGORITHM SORTING WORK REGISTER
     ------------------------------------------------------------------
     One shared objective used to be attached to all eight sorting
     modules: "Expose the high-work ordering for comparison-based
     methods" on the reverse-sorted preset. Measured against the source
     each module actually displays, that claim is true only for bubble
     sort and array insertion sort. It is false for selection sort
     (input-independent), false for both merge sorts (reverse is their
     CHEAPEST of the three), false for both quicksorts, and exactly
     INVERTED for the linked-list insertion sort, whose best case is
     descending input.

     COUNTED OPERATION, defined before any best/worst claim is made:
     one key-vs-key comparison, that is, one evaluation of a displayed
     lt/le/ge/gt macro (for listsorts, one evaluation of S[i] <= v).
     Loop-bound index tests such as `j <= hi` or `i < S.length` are NOT
     counted, and neither are swaps or pointer writes.

     HOW THE NUMBERS WERE OBTAINED, and why not from frame counts: each
     count comes from an oracle transcribed line by line from the block
     the module displays, run on the three preset inputs. Every count was
     then cross-checked by counting the module's own comparison frames.
     The two methods agree exactly for sel, bub, ins, ms, bottomup and
     qs. They disagree for q3, and the reason is instructive: the q3
     trace emits a frame for a medianOfThree test only when it swaps, so
     the trace shows 11/14/18 while the source performs 18/19/24. A trace
     frame total is therefore NOT a comparison oracle - which is exactly
     why these objectives are generated from the measured register below
     rather than read off the timeline.

     The counts are for these six-item presets. They are stated as such
     and are not generalised into asymptotic claims.
     ================================================================== */
  const SORT_COUNTED_OP='one key-vs-key comparison';
  const SORT_INPUTS=Object.freeze({sorted:'1 2 3 4 5 6',reverse:'6 5 4 3 2 1',duplicates:'4 2 4 1 2 3'});
  /* Each measured count lives in exactly one field. The prose explains the
     count and never restates it, so the two can never drift apart. */
  const SORT_WORK=Object.freeze({
    sel:Object.freeze({counted:'one evaluation of lt(items[j], items[min])',
      n:6,sorted:15,reverse:15,duplicates:15,
      shape:'input-independent',
      sortedNote:'The inner scan always runs from i+1 to hi, so existing order cannot shorten it. n(n-1)/2 comparisons happen on every six-item input.',
      reverseNote:'Exactly the same count as sorted input. Reverse order is NOT a high-work case here: selection sort is non-adaptive, so no input is a best or worst case for comparisons.',
      duplicatesNote:'Equal keys do not shorten the scan either. The strict lt test keeps the EARLIER of two equal keys as the running minimum, which on its own would preserve their order - so the comparison is not what makes selection sort unstable. The SWAP is: swap(items, i, min) carries items[i] across the whole unsorted region, past any equal key lying between i and min. Trace 2 2 1 to see it - the first pass swaps index 0 with index 2, and the two 2s come out in the opposite order.'}),
    bub:Object.freeze({counted:'one evaluation of gt(items[j], items[j + 1])',
      n:6,sorted:5,reverse:15,duplicates:14,
      shape:'adaptive through the early-exit break',
      sortedNote:'The first pass makes no swap, so `swapped` stays false and the `break` ends the sort after a single pass. This is bubble sort’s best case.',
      reverseNote:'The dearest of the three. Every pass swaps, so no pass can exit early and all n-1 passes run. This IS the high-work ordering for this algorithm.',
      duplicatesNote:'Between the sorted and reverse counts. The early exit only fires once a whole pass finds the array already in order.'}),
    ins:Object.freeze({counted:'one evaluation of lt(item, items[j - 1])',
      n:6,sorted:5,reverse:15,duplicates:11,
      shape:'adaptive to existing order',
      sortedNote:'Each item’s first lt test fails at once and nothing shifts. Best case.',
      reverseNote:'The dearest of the three. Every item is shifted past the whole sorted prefix before it lands. This IS the high-work ordering for this algorithm.',
      duplicatesNote:'Partial order gives partial benefit, which is what "adaptive" means. Contrast listsorts, which uses the same method on a linked list and is dearest on SORTED input.'}),
    ms:Object.freeze({counted:'one evaluation of le(items[i], items[j]) inside merge',
      n:6,sorted:9,reverse:7,duplicates:10,
      shape:'effectively input-independent; this call tree permits only 7 to 11',
      sortedNote:'Every merge exhausts its left run first, comparing once per left-hand item.',
      reverseNote:'The CHEAPEST of these three, not the dearest. Each merge fails its first le test, takes the whole right run, and then copies the left run across without comparing anything further. Reverse order is not a worst case for merge sort.',
      duplicatesNote:'The dearest of the three, by one comparison. The whole spread sits inside the 7-to-11 band this call tree allows, so merge sort is effectively input-independent.'}),
    bottomup:Object.freeze({counted:'one evaluation of le(items[i], items[j]) inside merge',
      n:6,sorted:9,reverse:7,duplicates:10,
      shape:'effectively input-independent; the same merges as top-down, in iterative pass order',
      sortedNote:'The same total as top-down merge sort, because the identical merges happen in a different order.',
      reverseNote:'The CHEAPEST of these three. Each merge empties its right-hand run on the first le test. Reverse order is not a worst case for a merge sort.',
      duplicatesNote:'The dearest of the three, by one comparison, and identical to top-down merge sort on all three inputs. Compare the pass structure, not the cost.'}),
    qs:Object.freeze({counted:'one evaluation of le/ge/lt inside partition',
      n:6,sorted:19,reverse:17,duplicates:15,
      shape:'degenerate on ordered input in BOTH directions',
      sortedNote:'The dearest of the three. The naive pivot is items[lo], which on sorted input is the minimum, so every partition peels off a single element and the recursion runs n deep.',
      reverseNote:'Also degenerate - the pivot is now the maximum - but measurably CHEAPER than sorted input, not equal to it. Ordered input is bad for this pivot rule in both directions without the two being a tie.',
      duplicatesNote:'The CHEAPEST of the three. An unordered input gives this pivot rule a more even split than either ordered input does.'}),
    q3:Object.freeze({counted:'one evaluation of gt inside medianOfThree, or le/ge/lt inside partition',
      n:6,sorted:18,reverse:19,duplicates:24,
      medianOfThree:Object.freeze({sorted:9,reverse:9,duplicates:12}),
      partition:Object.freeze({sorted:9,reverse:10,duplicates:12}),
      shape:'ordered-input penalty removed, at the cost of three extra gt tests per call',
      sortedNote:'Median-of-three defuses the sorted worst case: the split is even. Compare the naive pivot, which is dearer on this same input and splits far more unevenly.',
      reverseNote:'Reverse order is not specially bad here either; median-of-three places the median at lo before partitioning whichever way the input runs.',
      duplicatesNote:'The DEAREST of the three for this algorithm. Median-of-three removes the ordered-input penalty but pays three gt tests on every call, so the input that was cheapest for the naive pivot is dearest here.'}),
    listsorts:Object.freeze({counted:'one evaluation of S[i] <= v in the INSERTION scan `while (i < S.length && S[i] <= v) i++` (the module default; the selection and bubble methods count differently)',
      n:6,sorted:15,reverse:5,duplicates:11,
      positions:Object.freeze({sorted:'0,1,2,3,4,5',reverse:'0,0,0,0,0,0',duplicates:'0,0,2,0,2,3'}),
      shape:'INVERTED relative to array insertion sort',
      sortedNote:'The DEAREST of the three for this implementation, and the exact opposite of array insertion sort, where sorted input is the best case. Each ascending value walks the entire accumulated sorted prefix of S before stopping.',
      reverseNote:'The CHEAPEST of the three. Each descending value fails S[0] <= v on its very first test and is relinked at the head of S. Descending input is this algorithm’s BEST case - the old shared objective claimed the exact opposite.',
      duplicatesNote:'The scan tests <=, so an equal key is passed over and the new node is relinked after the existing equal keys rather than before them.'})
  });
  /* The nine sorting objectives are generated here, from the register, so a
     measured count is written once and displayed once. */
  const sortObjective=(id,key)=>{
    const work=SORT_WORK[id];
    const detail=[];
    if(work.medianOfThree)detail.push(`${work.medianOfThree[key]} in medianOfThree and ${work.partition[key]} in partition`);
    if(work.positions)detail.push(`insertion positions ${work.positions[key]}`);
    return `Counted operation: ${work.counted}. On this ${work.n}-item preset: ${work[key]} comparisons`
      +(detail.length?` (${detail.join('; ')})`:'')
      +`. ${work[key+'Note']}`;
  };
  Object.keys(SORT_WORK).forEach(id=>add(id,
    recipe('sorted','Already sorted',sortObjective(id,'sorted'),{a:SORT_INPUTS.sorted}),
    recipe('reverse','Reverse sorted',sortObjective(id,'reverse'),{a:SORT_INPUTS.reverse}),
    recipe('duplicates','Repeated keys',sortObjective(id,'duplicates'),{a:SORT_INPUTS.duplicates})));
  add('radix',
    recipe('digits','Equal-width keys','Follow stable bucket passes from least to most significant digit. Every key is already three symbols wide, so no padding step appears.',{a:'329 457 657 839 436 720 355'}),
    recipe('shared','Shared prefixes and suffixes','Track keys with many repeated symbols.',{a:'101 111 110 100 109 190'}));

  add('stack',
    recipe('lifecycle','Stack lifecycle','Create nodes, inspect top and size, pop, then release all memory.',{ops:'push 3, push 7, size, peek, pop, push 9, pop, free'}),
    recipe('lifo','LIFO order','Verify that the last pushed item is returned first.',{ops:'push 1, push 2, push 3, pop, pop, peek, free'}));
  add('queue',
    recipe('lifecycle','Queue lifecycle','Enqueue, inspect, dequeue and free each allocated node.',{ops:'enqueue 4, enqueue 8, size, peek, dequeue, enqueue 2, dequeue, free'}),
    recipe('fifo','FIFO order','Verify that the earliest enqueued item leaves first.',{ops:'enqueue 1, enqueue 2, enqueue 3, dequeue, dequeue, peek, free'}));
  add('pq',
    recipe('fixup','fixUp path','Insert rising priorities so the newest item travels toward the root.',{ops:'insert 1 10, insert 2 20, insert 3 30, insert 4 40, peek, free'}),
    recipe('fixdown','fixDown path','Delete the maximum and follow restoration of heap order.',{ops:'insert 1 40, insert 2 30, insert 3 20, insert 4 10, delete, peek, free'}),
    recipe('resize','Capacity growth','Insert past the initial capacity to expose realloc and its old->new size.',{ops:'insert 1 10, insert 2 20, insert 3 30, insert 4 40, insert 5 50, insert 6 60, insert 7 70, insert 8 80, insert 9 90, free'}));
  add('heapify',
    recipe('down','Bottom-up fix-down','Use the O(n) heap construction method.',{a:'2 7 4 6 5 1 3',method:'fix-down O(n)'}),
    recipe('up','Repeated fix-up','Contrast the O(n log n) construction method.',{a:'2 7 4 6 5 1 3',method:'fix-up O(n log n)'}));
  add('heapsort',
    recipe('reverse','Reverse input','Build a max heap then deheapify a reverse sequence.',{a:'7 6 5 4 3 2 1'}),
    recipe('duplicates','Repeated values','Check heap order when values are equal.',{a:'4 1 4 2 2 3 1'}));
  add('trie',
    recipe('prefix','Shared prefix','Insert cat, car and cart, then distinguish words from prefixes.',{ops:'insert cat, insert car, insert cart, search car, search ca, search cart, free'}),
    recipe('delete','Deletion with shared nodes','Delete one word without removing another word\u2019s path.',{ops:'insert cat, insert car, insert cart, delete car, search cat, search cart, free'}));

  add('bstins',
    recipe('balanced','Balanced insertion order','Build a minimum-height seven-node BST.',{seq:'4 2 6 1 3 5 7'}),
    recipe('degenerate','Degenerate insertion order','See how ascending insertion creates one long branch.',{seq:'1 2 3 4 5 6 7'}));
  add('bstsearch',
    recipe('hit','Search hit','Follow one branch to an existing key.',{seq:'50 30 70 20 40 60 80',val:'40'}),
    recipe('miss','Search miss','Stop when the selected child pointer is NULL.',{seq:'50 30 70 20 40 60 80',val:'45'}));
  add('bsttrav',
    recipe('pre','Pre-order','Visit node, left subtree, then right subtree.',{seq:'4 2 6 1 3 5 7',order:'pre-order'}),
    recipe('in','In-order','Produce sorted order from a BST.',{seq:'4 2 6 1 3 5 7',order:'in-order'}),
    recipe('post','Post-order','Visit children before each node.',{seq:'4 2 6 1 3 5 7',order:'post-order'}),
    recipe('level','Level-order','Use a queue to visit breadth by breadth.',{seq:'4 2 6 1 3 5 7',order:'level-order'}));
  add('bstdel',
    recipe('leaf','Delete a leaf','Remove a node with no children.',{seq:'50 30 70 20 40 60 80',val:'20'}),
    recipe('two','Delete two-child node','Invoke bstJoin to reconnect both subtrees.',{seq:'50 30 70 20 40 60 80 35 45',val:'30'}),
    recipe('root','Delete the root','Observe replacement of the tree root.',{seq:'50 30 70 20 40 60 80',val:'50'}));
  add('bstfree',recipe('postorder','Post-order release','Free children before their parent nodes.',{seq:'4 2 6 1 3 5 7'}));
  add('bstrotate',
    recipe('right','Right rotation','Promote the left child and rewire the middle subtree.',{seq:'7 4 9 1 5',dir:'right'}),
    recipe('left','Left rotation','Promote the right child and rewire the middle subtree.',{seq:'3 1 7 5 9',dir:'left'}));
  add('bstpartition',
    recipe('middle','Lift a middle item','Move an in-order item to the root using rotations.',{seq:'13 5 17 3 8 16 1 6 10',i:'4'}),
    recipe('minimum','Lift the minimum','Partition around the first in-order item.',{seq:'13 5 17 3 8 16 1 6 10',i:'0'}));
  add('bstrebalance',
    recipe('global','Global rebalance','Rebalance an ascending, degenerate tree.',{seq:'1 2 3 4 5 6 7 8 9',mode:'global'}),
    recipe('periodic','Periodic rebalancing','Insert at a leaf, then watch the global rebalance fire whenever size(t) mod k = 0.',{seq:'1 2 3 4 5 6 7 8 9',mode:'periodic reference'}));
  add('bstlocal',
    recipe('root','Insert at root','Partition the inserted key to the root.',{seq:'10 5 14 30 29 32',v:'24',choice:'insert at root'}),
    recipe('leaf','Insert at leaf','Use ordinary leaf insertion for the alternate branch.',{seq:'10 5 14 30 29 32',v:'24',choice:'insert at leaf'}));
  add('avlheight',recipe('factors','Stored heights and factors','Display height and height(left)-height(right) at every node.',{seq:'6 2 9 1 5 8 4'}));
  add('avlins',
    recipe('ll','Left-left case','Trigger one right rotation.',{seq:'30 20 10'}),
    recipe('lr','Left-right case','Trigger a left rotation followed by a right rotation.',{seq:'30 10 20'}),
    recipe('rl','Right-left case','Trigger a right rotation followed by a left rotation.',{seq:'10 30 20'}),
    recipe('rr','Right-right case','Trigger one left rotation.',{seq:'10 20 30'}));
  add('avldel',
    recipe('rebalance','Deletion rebalance','Delete a key and recompute heights while unwinding.',{seq:'30 20 40 10 25 35 50 5',val:'40'}),
    recipe('leaf','Delete AVL leaf','Remove a leaf while checking every ancestor balance factor.',{seq:'30 20 40 10 25 35 50 5',val:'5'}));

  add('hash',
    recipe('collision','Separate-chain collision','Keys 1, 12 and 23 share an initial slot when capacity is 11.',{ops:'insert 1 100, insert 12 200, insert 23 300, contains 12, get 23, size, free'}),
    recipe('update','Update and delete','Replace an existing value without increasing numItems, then delete.',{ops:'insert 12 100, insert 23 200, insert 12 999, size, delete 23, contains 23, free'}));
  add('hashprobe',
    recipe('linear','Linear probing','Follow consecutive slots after a collision.',{method:'linear probing',ops:'insert 5 50, insert 20 200, insert 16 160, insert 1 10, get 20, delete 16, free'}),
    recipe('double','Double hashing','Use the second hash to choose the probe stride.',{method:'double hashing',ops:'insert 5 50, insert 20 200, insert 16 160, insert 1 10, get 20, delete 16, free'}));
  add('hashsetcounter',
    recipe('set','Set over a hash table','Insert distinct keys and test membership.',{mode:'Set',ops:'add 4, add 3, add 4, contains 4, contains 7, delete 3'}),
    recipe('counter','Counter over a hash table','Accumulate and retrieve occurrence counts.',{mode:'Counter',ops:'add 4, add 3, add 4, add 8, add 8, add 4, get 4, get 7'}));
  add('twosum',
    recipe('found','Pair exists','Find a complement already stored in the set.',{a:'12 6 3 3 7 8',S:'13'}),
    recipe('missing','No pair','Complete the scan without a matching complement.',{a:'12 6 3 3 7 8',S:'16'}));
  add('oddocc',
    recipe('mixed','Mixed parity','Count only values with odd occurrence counts.',{a:'4 3 4 8 8 4'}),
    recipe('all-even','All even','Verify the result is zero when every count is even.',{a:'1 1 3 3 7 7'}));
  add('anagram',
    recipe('true','Anagram pair','Balance every character count back to zero.',{s:'aaabb',t:'ababa'}),
    recipe('false','Non-anagram pair','Expose the first mismatched count.',{s:'aaabb',t:'babab'}));

  add('graphfund',
    recipe('undirected','Undirected graph','Review vertices, edges, degree and paths.',{nV:'6',g:'0-1, 0-2, 1-2, 2-3, 3-4, 4-5',kind:'undirected'}),
    recipe('directed','Directed graph','Distinguish source and destination of each arc.',{nV:'6',g:'0-1, 0-2, 2-1, 2-3, 3-4, 4-5',kind:'directed'}));
  add('graphreps',
    recipe('matrix','Adjacency matrix','Open the exact-manual representation map.',{nV:'4',g:'0-1, 0-3, 1-3, 2-3',study:'adjacency matrix \u2014 exact manual'}),
    recipe('list','Adjacency list','Open the declared MEMORISE adjacency-list bridge.',{nV:'4',g:'0-1, 0-3, 1-3, 2-3',study:'adjacency list \u2014 MEMORISE'}),
    recipe('edges','Array of edges','Open the declared MEMORISE edge-array bridge.',{nV:'4',g:'0-1, 0-3, 1-3, 2-3',study:'array of edges \u2014 MEMORISE'}));
  add('graphadt',recipe('lifecycle','Matrix Graph ADT lifecycle','Insert, query, display, remove and free the graph.',{nV:'5',ops:'insert 0 1, insert 0 2, insert 1 3, adjacent 0 2, vertices, edges, show, remove 0 1, free'}));
  ['graphlist','graphedges'].forEach(id=>add(id,
    recipe('undirected','Undirected unweighted operations','Store each logical edge in the selected representation.',{nV:'5',directed:'undirected',weighted:'unweighted',ops:'vertices, insert 0 1, insert 0 2, insert 1 3, insert 3 4, edges, adjacent 0 2, show, free'}),
    recipe('weighted-directed','Directed weighted operations','Store outgoing weighted arcs and update their lifecycle.',{nV:'5',directed:'directed',weighted:'weighted',ops:'vertices, insert 0 1:4, insert 0 2:2, insert 1 3:5, insert 3 4:1, edges, adjacent 0 2, show, free'})));
  add('graphweighted',
    recipe('matrix','Weighted matrix view','Store weights in matrix cells and use a no-edge sentinel.',{nV:'5',g:'0>1:0.2, 0>2:0.4, 1>3:0.3, 1>4:0.6, 2>3:0.5, 2>4:0.1, 3>4:0.9, 4>0:0.1',directed:'directed',weighted:'weighted',rep:'adjacency matrix'}),
    recipe('list','Weighted list view','Store neighbour and weight in each outgoing list node.',{nV:'5',g:'0>1:0.2, 0>2:0.4, 1>3:0.3, 1>4:0.6, 2>3:0.5, 2>4:0.1, 3>4:0.9, 4>0:0.1',directed:'directed',weighted:'weighted',rep:'adjacency list'}),
    recipe('edges','Weighted edge-array view','Store source, destination and weight in each record.',{nV:'5',g:'0>1:0.2, 0>2:0.4, 1>3:0.3, 1>4:0.6, 2>3:0.5, 2>4:0.1, 3>4:0.9, 4>0:0.1',directed:'directed',weighted:'weighted',rep:'array of edges'}));

  add('bfs',
    recipe('connected','Connected BFS','Track queue order and predecessor discovery.',{nV:'6',g:'0-1, 0-2, 1-3, 2-4, 3-5, 4-5, 1-4',src:'0',rep:'adjacency list'}),
    recipe('disconnected','Disconnected BFS','Observe that a source traversal leaves another component unvisited.',{nV:'7',g:'0-1, 0-2, 1-3, 2-4, 5-6',src:'0',rep:'adjacency list'}));
  add('bfspath',
    recipe('reachable','Reachable destination','Reconstruct a shortest unweighted path from predecessor[].',{nV:'6',g:'0-1, 0-2, 1-3, 1-4, 2-4, 3-5, 4-5',src:'0',dest:'5',rep:'adjacency list'}),
    recipe('unreachable','Unreachable destination','Leave predecessor[dest] at -1 across components.',{nV:'7',g:'0-1, 0-2, 1-3, 4-5, 5-6',src:'0',dest:'6',rep:'adjacency list'}));
  add('dfs',
    recipe('deep','Recursive depth first','Follow the recursion stack along one branch before backtracking.',{nV:'6',g:'0-1, 0-2, 1-3, 2-4, 3-5, 4-5, 1-4',src:'0',rep:'adjacency list'}),
    recipe('matrix','Matrix traversal view','Map each neighbour loop to a row scan.',{nV:'6',g:'0-1, 0-2, 1-3, 2-4, 3-5, 4-5, 1-4',src:'0',rep:'adjacency matrix'}));
  add('dfspath',
    recipe('reachable','DFS path found','Track recursive returns that preserve the found path.',{nV:'7',g:'0-1, 0-2, 1-3, 1-4, 2-5, 4-6, 5-6',src:'0',dest:'6',rep:'adjacency list'}),
    recipe('unreachable','DFS path absent','Backtrack from every reachable branch.',{nV:'7',g:'0-1, 0-2, 1-3, 4-5, 5-6',src:'0',dest:'6',rep:'adjacency list'}));
  add('dfsiter',recipe('stack','Explicit stack','Contrast iterative stack state with recursive DFS.',{nV:'6',g:'0-1, 0-2, 1-3, 1-4, 2-4, 3-5, 4-5',src:'0',rep:'adjacency list'}));

  add('cycleu',
    recipe('cycle','Cycle in one component','Detect a back edge that is not the parent edge.',{nV:'7',g:'0-1, 1-2, 2-0, 3-4, 5-6',rep:'adjacency list'}),
    recipe('acyclic','Acyclic forest','Complete every component without detecting a cycle.',{nV:'7',g:'0-1, 1-2, 2-3, 4-5, 5-6',rep:'adjacency list'}));
  add('components',
    recipe('three','Three components','Assign component numbers through repeated DFS.',{nV:'9',g:'0-1, 1-4, 2-3, 3-5, 5-6, 7-8',rep:'adjacency list'}),
    recipe('one','Connected graph','Assign every vertex to one component.',{nV:'6',g:'0-1, 1-2, 2-3, 3-4, 4-5',rep:'adjacency list'}));
  add('hamilton',
    recipe('path','Hamiltonian path','Backtrack until every vertex is used once.',{nV:'5',g:'0-1, 1-2, 2-3, 3-4, 1-3',mode:'path',rep:'adjacency list'}),
    recipe('circuit','Hamiltonian circuit','Require the final vertex to reconnect to the start.',{nV:'5',g:'0-1, 1-2, 2-3, 3-4, 4-0, 1-3',mode:'circuit',rep:'adjacency list'}));
  add('euler',
    recipe('path','Eulerian path','Use exactly two odd-degree vertices.',{nV:'5',g:'0-1, 1-2, 2-3, 3-0, 3-4',mode:'path',rep:'adjacency list'}),
    recipe('circuit','Eulerian circuit','Use a connected graph where every degree is even.',{nV:'4',g:'0-1, 1-2, 2-3, 3-0',mode:'circuit',rep:'adjacency list'}));
  add('cycled',
    recipe('cycle','Directed cycle','Use onStack[] to detect an arc to an active ancestor.',{nV:'6',g:'0>1, 1>2, 2>3, 3>1, 3>4, 4>5',rep:'adjacency list'}),
    recipe('acyclic','Directed acyclic graph','Finish each call without an on-stack back edge.',{nV:'6',g:'0>1, 0>2, 1>3, 2>3, 3>4, 4>5',rep:'adjacency list'}));
  add('webcrawl',
    recipe('limit','Bounded crawl','Stop when maxPagesToVisit is reached.',{nV:'7',g:'0>1, 0>2, 1>3, 1>4, 2>4, 3>5, 4>5, 5>6, 6>2',start:'0',max:'4'}),
    recipe('full','Reach all known pages','Allow the queue to visit the full known graph.',{nV:'7',g:'0>1, 0>2, 1>3, 1>4, 2>4, 3>5, 4>5, 5>6, 6>2',start:'0',max:'7'}));
  add('warshall',
    recipe('chain','Directed chain','Watch reachability propagate through intermediate vertices.',{nV:'4',g:'0-1, 1-2, 2-3'}),
    recipe('cycle','Directed cycle','See mutual reachability close around a cycle.',{nV:'4',g:'0-1, 1-2, 2-0, 2-3'}));
  add('dijkstra',
    recipe('relax','Competing paths','Observe repeated edge relaxation with non-negative weights.',{nV:'5',g:'0-1:4, 0-2:1, 2-1:2, 1-3:5, 2-3:8, 3-4:3, 2-4:10',src:'0',rep:'array of edges'}),
    recipe('unreachable','Unreachable vertex','Keep one distance at infinity.',{nV:'6',g:'0-1:4, 0-2:1, 2-1:2, 1-3:5, 3-4:3',src:'0',rep:'adjacency list'}));
  add('kruskal',
    recipe('mst','Kruskal MST','Consider edges in increasing weight order and reject cycles.',{nV:'5',g:'0-1:4, 0-2:1, 1-2:2, 1-3:5, 2-3:8, 3-4:3, 2-4:10, 0-4:7',rep:'array of edges'}),
    recipe('ties','Equal weights','Observe a valid deterministic choice among tied weights.',{nV:'5',g:'0-1:1, 0-2:1, 1-2:1, 1-3:2, 2-4:2, 3-4:3',rep:'adjacency list'}));
  add('prim',
    recipe('mst','Prim MST','Grow one tree from vertex 0 using the cheapest crossing edge.',{nV:'5',g:'0-1:4, 0-2:1, 1-2:2, 1-3:5, 2-3:8, 3-4:3, 2-4:10, 0-4:7',rep:'adjacency list'}),
    recipe('dense','Denser graph','Compare more candidate crossing edges at each iteration.',{nV:'5',g:'0-1:2, 0-2:3, 0-3:6, 1-2:1, 1-3:4, 1-4:7, 2-3:2, 2-4:5, 3-4:1',rep:'adjacency matrix'}));

  Object.freeze(RECIPES);

  const STRUCTS_COMMIT='f96154f0dfe1eda2a89e2452ab8f289619077a0e';
  const TACTILE_COMMIT='05d0641442d86c44a2401bf48ceb3a24ffc8dc8b';
  const STRUCTS_BASE=`https://github.com/devsoc-unsw/structs.sh`;
  const TACTILE_BASE=`https://github.com/tymzd/Tactile-DS`;
  const resource=(id,repository,title,summary,url,licence)=>Object.freeze({id,repository,title,summary,url,licence});
  const structsDir=(id,title,summary,path)=>resource(id,'structs.sh',title,summary,`${STRUCTS_BASE}/tree/${STRUCTS_COMMIT}/${path}`,'MIT - pinned source');
  const structsFile=(id,title,summary,path)=>resource(id,'structs.sh',title,summary,`${STRUCTS_BASE}/blob/${STRUCTS_COMMIT}/${path}`,'MIT - pinned source');
  const tactileDir=(id,title,summary,path)=>resource(id,'Tactile-DS',title,summary,`${TACTILE_BASE}/tree/${TACTILE_COMMIT}/${path}`,'Reference only - no repository-wide licence located');
const RESOURCE_GROUPS = window.TRACER_RESOURCE_DATA.groups;
const RESOURCE_MODULES = window.TRACER_RESOURCE_DATA.modules;

  const INTERACTION_SOURCES=Object.freeze([
    structsFile('structs-timeline','structs.sh marked timeline source','Reviewed MIT source that informed the discrete marked-step timeline interaction.','client/src/components/Timeline/Slider.tsx'),
    structsFile('structs-viewport','structs.sh visual workspace source','Reviewed MIT source that informed bounded pointer-centred pan and zoom.','client/src/components/Visualiser/VisualiserCanvas.tsx'),
    structsFile('structs-viewport-lock','structs.sh lockable SVG workspace source','Reviewed MIT source that informed the explicit pan lock and visible zoom-level interaction.','client/src/visualiser-debugger/Component/Visualizer/Visulizer/svgComponent.tsx')
  ]);

  const el=(tag,className,text)=>{const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!=null)node.textContent=String(text);
    return node;};
  /* Only http(s) pinned references are ever linked. Anything else is inert. */
  const safeHttpUrl=value=>{
    try{const u=new URL(String(value),document.baseURI);
      return (u.protocol==='https:'||u.protocol==='http:')?u.href:'#';}
    catch(err){return '#';}
  };
  const q=selector=>document.querySelector(selector);
  const qa=selector=>[...document.querySelectorAll(selector)];
  const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const plainNote=html=>{const host=document.createElement('div');host.innerHTML=String(html||'');return (host.textContent||'').replace(/\s+/g,' ').trim();};
  const currentModule=()=>playerState.currentModule;
  /* CUR-MOD-01. Every displayed week label is DERIVED here from the one
     reviewed register - per topic first, group default second - so the
     chip, the module-status tooltip, the search/test surfaces and the
     downloadable matrix cannot disagree with each other. Nothing stores a
     second copy of a week. */
  const scopeFor=module=>{
    const record=curriculumFor(module);
    if(record)return {
      week:weekLabelFor(record),
      outline:outlineLabelFor(record),
      topic:record.topic,
      admitted:record.admitted!==false,
      reason:record.reason,
      /* separate axes, deliberately not flattened into the week label */
      introduced:record.introduced,
      applied:record.applied,
      revision:record.revision,
      prerequisites:record.prerequisites,
      provenance:record.provenance,
      assessment:record.assessment,
      relevance:record.relevance,
      inference:record.inference,
      reviewDepth:record.reviewDepth,
      exactSourceComparison:'NOT performed - the declared original course documents are absent from this repository'
    };
    return {
      week:'Not externally admitted',
      outline:'No matching topic is named in the COMP2521 2026 Term 2 lecture schedule',
      topic:module?.group||'unmapped topic',
      reason:'The external-asset gate fails closed for unmapped groups.',
      admitted:false,
      introduced:null,applied:[],revision:[],prerequisites:[],
      provenance:null,assessment:ASSESS_NONE,relevance:'unrelated',inference:null,
      reviewDepth:'not reviewed - this group is absent from the curriculum register',
      exactSourceComparison:'NOT performed - the declared original course documents are absent from this repository'
    };
  };
  /* One-line summaries of the axes that do not fit in the chip itself. */
  const assessmentLine=scope=>{
    const a=scope&&scope.assessment;
    if(!a)return '';
    return `Assessment (${a.sourceId}): programming - ${a.programming} Theory - ${a.theory} ${a.scope}`;
  };
  const provenanceLine=scope=>{
    const p=scope&&scope.provenance;
    if(!p)return '';
    return `Quoted source: ${p.locator} (term as supplied: ${p.term}; source ${p.sourceId}). ${p.note}`;
  };

  const EUI={
    labBtn:q('#labBtn'),labDialog:q('#labDialog'),labClose:q('#labClose'),labDone:q('#labDone'),labTitle:q('#labTitle'),labList:q('#labRecipeList'),resourceList:q('#labResourceList'),scope:q('#courseScopeChip'),
    stepsBtn:q('#stepsBtn'),stepDialog:q('#stepDialog'),stepClose:q('#stepClose'),stepDone:q('#stepDone'),stepActive:q('#stepActive'),stepSummary:q('#stepSummary'),stepList:q('#stepList'),marks:q('#scrubMarks'),
    canvasTools:q('#canvasTools'),zoomLock:q('#zoomLock'),zoomLockLabel:q('#zoomLockLabel'),zoomOut:q('#zoomOut'),zoomReset:q('#zoomReset'),zoomIn:q('#zoomIn'),zoomFit:q('#zoomFit'),zoomLevel:q('#zoomLevel')
  };

  function defaultsFor(module){return Object.fromEntries((module?.fields||[]).map(field=>[field.k,String(field.def??'')]));}
  function recipeSet(module){
    if(!module||scopeFor(module).admitted===false||!(module.fields||[]).length)return [];
    const defaults=recipe('course-default','Course default','Restore the controlled default values already supplied by this tracer.',defaultsFor(module));
    return [defaults,...(RECIPES[module.id]||[])];
  }
  function resourceSet(module){
    if(!module||scopeFor(module).admitted===false)return [];
    return [...(RESOURCE_MODULES[module.id]||RESOURCE_GROUPS[module.group]||[])];
  }
  function renderResources(module,scope){
    if(!EUI.resourceList)return;
    EUI.resourceList.innerHTML='';
    if(scope.admitted===false){
      EUI.resourceList.innerHTML=`<div class="resource-empty"><b>No external topic reference admitted.</b><p>${escape(scope.reason||'The external-asset gate is closed for this group.')}</p></div>`;
      return;
    }
    const resources=resourceSet(module);
    if(!resources.length){
      EUI.resourceList.innerHTML='<div class="resource-empty"><b>No topic-specific repository asset selected.</b><p>The generic timeline and visual-workspace interactions remain available, but no external study content was needed for this 26T2 topic.</p></div>';
      return;
    }
    resources.forEach(item=>{
      const card=document.createElement('article');card.className='resource-card';card.dataset.repository=item.repository;
      /* H-01: these fields carry third-party repository text, so they are built
         as DOM nodes with textContent. No markup path, no escaping to get wrong.
         The href is additionally scheme-checked before it is set. */
      const meta=el('div','resource-meta');
      meta.appendChild(el('span','resource-repo',item.repository));
      meta.appendChild(el('span','resource-licence',item.licence));
      card.appendChild(meta);
      card.appendChild(el('h4',null,item.title));
      card.appendChild(el('p',null,item.summary));
      const link=el('a','btn resource-link','Open pinned reference');
      link.href=safeHttpUrl(item.url);
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.setAttribute('aria-label',`Open ${item.title} in a new tab`);
      card.appendChild(link);
      EUI.resourceList.appendChild(card);
    });
  }
  function setRecipeValues(module,item){
    const values={...defaultsFor(module),...item.values};
    const unsupported=[];
    Object.entries(values).forEach(([key,value])=>{
      const control=UI.inputs.querySelector(`[data-k="${CSS.escape(key)}"]`);
      if(!control){unsupported.push(key);return;}
      const string=String(value);
      if(control.tagName==='SELECT'&&![...control.options].some(option=>option.value===string)){unsupported.push(`${key}=${string}`);return;}
      control.value=string;
    });
    if(unsupported.length)throw new Error(`Recipe contains unsupported field values: ${unsupported.join(', ')}`);
    clearInputErrors();persistCurrentUi();
  }
  function applyRecipe(item,runNow){
    const module=currentModule();
    if(!module)return;
    try{
      setRecipeValues(module,item);
      closeLab();
      UI.status.textContent=`Loaded "${item.title}" for ${module.name}${runNow?'; generating trace':''}`;
      if(runNow)requestFrame(()=>go());
      else UI.inputs.querySelector('[data-k]')?.focus({preventScroll:true});
    }catch(error){UI.status.textContent=String(error&&error.message||error);}
  }
  function renderLab(){
    const module=currentModule();const scope=scopeFor(module);const items=recipeSet(module);
    EUI.labTitle.textContent=module?`Lab recipes - ${module.name}`:'Lab recipes';
    EUI.scope.classList.toggle('scope-excluded',scope.admitted===false);
    /* The chip keeps its three-part shape. The axes that do not fit -
       assessment, provenance, prerequisites, the labelled inference and the
       review depth - are carried on the chip's own title and data
       attributes rather than being dropped or collapsed into the week. */
    EUI.scope.innerHTML=`<b>${escape(scope.week)}</b><span>${escape(scope.outline)}</span><span class="${scope.admitted===false?'scope-no':'scope-ok'}">${scope.admitted===false?'External enrichment excluded':'26T2 admitted'}</span>`;
    EUI.scope.dataset.relevance=scope.relevance||'unclassified';
    EUI.scope.dataset.reviewDepth=scope.reviewDepth||'';
    EUI.scope.title=[
      scope.week+' - '+scope.outline,
      (scope.prerequisites&&scope.prerequisites.length)?`Prerequisite topics: ${scope.prerequisites.join(', ')}.`:'',
      provenanceLine(scope),
      assessmentLine(scope),
      scope.inference?`INFERENCE (not an official assignment): ${scope.inference}`:'',
      `Relevance: ${scope.relevance}. Review depth: ${scope.reviewDepth}. Exact-source comparison: ${scope.exactSourceComparison}.`
    ].filter(Boolean).join('\n');
    EUI.labList.innerHTML='';
    renderResources(module,scope);
    if(scope.admitted===false){
      EUI.labList.innerHTML=`<div class="recipe-empty"><b>No external recipe asset admitted.</b><p>${escape(scope.reason||'This group is outside the published 26T2 external-asset scope.')}</p><p>The controlled manual-based module remains available through the normal inputs and Run trace controls.</p></div>`;
      return;
    }
    if(!items.length){
      EUI.labList.innerHTML='<div class="recipe-empty"><b>Reference-only topic.</b><p>This admitted course topic has no editable inputs, so no command recipe is required. Press Run trace to review its controlled source material.</p></div>';
      return;
    }
    items.forEach((item,index)=>{
      const card=document.createElement('article');card.className='recipe-card';
      const values=Object.entries(item.values).map(([key,value])=>`<span><b>${escape(key)}</b> ${escape(value)}</span>`).join('');
      card.innerHTML=`<div class="recipe-number">${index+1}</div><div class="recipe-copy"><h3>${escape(item.title)}</h3><p>${escape(item.objective)}</p><div class="recipe-values">${values}</div><div class="recipe-origin">Values-only clean-room preset - no external algorithm code</div></div><div class="recipe-actions"><button class="btn recipe-load" type="button">Load inputs</button><button class="btn go recipe-run" type="button">Load &amp; run</button></div>`;
      card.querySelector('.recipe-load').addEventListener('click',()=>applyRecipe(item,false));
      card.querySelector('.recipe-run').addEventListener('click',()=>applyRecipe(item,true));
      EUI.labList.appendChild(card);
    });
  }
  function openLab(){
    renderLab();EUI.labBtn.setAttribute('aria-expanded','true');
    return showManagedDialog(EUI.labDialog,{trigger:EUI.labBtn,initialFocus:EUI.labClose,onRequestClose:closeLab});
  }
  function closeLab(){EUI.labBtn.setAttribute('aria-expanded','false');closeManagedDialog(EUI.labDialog,{fallbackFocus:EUI.labBtn});}

  function sourcePosition(frame,module){
    const line=Array.isArray(frame?.line)?frame.line:[0,frame?.line];const block=module?.blocks?.[line[0]];
    if(!block||!Number.isInteger(line[1])||line[1]<=0)return 'No source-line highlight';
    return `${block.title} - line ${line[1]}`;
  }
  function eventSummary(frame){
    const events=Array.isArray(frame?.ev)?frame.ev:(frame?.ev?[frame.ev]:[]);const event=events[events.length-1];
    if(!event)return '';
    if(event.t==='a')return `${event.fn} ${event.label}`;
    if(event.t==='r')return `realloc ${event.label}: ${event.oldSize??'?'} -> ${event.size}`;
    if(event.t==='f')return `free ${event.label}`;
    if(event.t==='x')return `lifecycle end: ${event.label}`;
    return '';
  }
  function jumpToStep(index,close=true){
    if(!Number.isInteger(index)||index<0||index>=playerState.frames.length)return;
    stop();playerState.frameIndex=index;playerState.previousVariables={};paint();
    if(typeof narrow==='function'&&narrow()&&typeof setPane==='function')setPane('viz');
    if(close)closeSteps();
    UI.status.textContent=`Jumped to trace step ${index+1} of ${playerState.frames.length}`;
  }
  function renderSteps(){
    const module=currentModule();const count=playerState.frames.length;
    EUI.stepSummary.textContent=count?`${count} exact trace frames - current step ${playerState.frameIndex+1}`:'No trace has been generated for this topic.';
    EUI.stepList.innerHTML='';
    playerState.frames.forEach((frame,index)=>{
      const button=document.createElement('button');button.type='button';button.className='step-item';button.id=`trace-step-${index}`;button.dataset.index=String(index);button.setAttribute('role','option');button.setAttribute('aria-selected',String(index===playerState.frameIndex));
      if(index===playerState.frameIndex)button.setAttribute('aria-current','step');
      const memory=eventSummary(frame);
      button.innerHTML=`<span class="step-n">${index+1}</span><span class="step-copy"><b>${escape(plainNote(frame.note)||'Trace state')}</b><small>${escape(sourcePosition(frame,module))}${memory?` - ${escape(memory)}`:''}</small></span>`;
      button.addEventListener('click',()=>jumpToStep(index,true));
      EUI.stepList.appendChild(button);
    });
    EUI.stepList.querySelector('[aria-current="step"]')?.scrollIntoView({block:'nearest'});
    EUI.stepActive.disabled=!count;
  }
  function openSteps(){
    renderSteps();EUI.stepsBtn.setAttribute('aria-expanded','true');
    return showManagedDialog(EUI.stepDialog,{trigger:EUI.stepsBtn,initialFocus:EUI.stepClose,onRequestClose:closeSteps});
  }
  function closeSteps(){EUI.stepsBtn.setAttribute('aria-expanded','false');closeManagedDialog(EUI.stepDialog,{fallbackFocus:EUI.stepsBtn});}

  // Mark-spacing rule adapted from the MIT-licensed structs.sh timeline Slider.
  function timelineMarks(max){
    if(max<=0)return [];
    if(max<=25){const values=[0,5,10,15,20,max];return [...new Set(values.filter(value=>value<=max))].sort((a,b)=>a-b);}
    const gap=Math.ceil(Math.ceil(max/5)/10)*10;
    if(!gap)return [0,max];
    const values=[];for(let value=0;value<=max;value+=gap)values.push(value);if(values[values.length-1]!==max)values.push(max);return values;
  }
  function updateMarks(){
    const max=Math.max(0,playerState.frames.length-1);EUI.marks.innerHTML='';
    timelineMarks(max).forEach(value=>{
      const mark=document.createElement('span');const percentage=max?value/max*100:0;mark.style.left=`${percentage}%`;mark.textContent=String(value+1);mark.classList.toggle('passed',value<=playerState.frameIndex);mark.classList.toggle('current',value===playerState.frameIndex);EUI.marks.appendChild(mark);
    });
    EUI.stepsBtn.disabled=!playerState.frames.length||playerState.busy;
    EUI.stepsBtn.textContent=playerState.frames.length?`Steps - ${playerState.frames.length}`:'Steps';
    EUI.stepsBtn.title=playerState.frames.length?`Open all ${playerState.frames.length} exact trace steps`:'Run a trace to open its steps';
    if(dialogIsOpen(EUI.stepDialog))renderSteps();
  }

  const ZOOMABLE=new Set(['array','linked','tree','trie','hash','hashopen','heap','intheap','graph','multi','adjlist','edgearray','matrix2d','callstack']);
  const zoom={scale:1,x:0,y:0,layer:null,moduleId:null,kind:null,panning:false,lastX:0,lastY:0,locked:true};
  function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
  function updatePanLockUi(){
    const enabled=!!zoom.layer&&!EUI.canvasTools.hidden;
    if(EUI.zoomLock){
      EUI.zoomLock.disabled=!enabled||playerState.busy;
      EUI.zoomLock.setAttribute('aria-pressed',String(zoom.locked));
      /* WCAG 2.5.3 (Label in Name). This control's VISIBLE text is owned by
         the quality layer, which rewrites it to "Pan locked"/"Pan unlocked".
         Setting an aria-label here replaced the accessible name with wording
         that did not contain that visible text, so a speech-input user saying
         what they could read could not activate the button, and axe-core
         reported label-content-name-mismatch on every page. The name is now
         left to the button's own content, which cannot drift from what is on
         screen, and the state-dependent explanation moves to the described-by
         target instead of competing with the name. */
      EUI.zoomLock.removeAttribute('aria-label');
      const zoomLockHelp=document.getElementById('zoomLockHelp');
      if(zoomLockHelp){
        zoomLockHelp.textContent=zoom.locked
          ?'Activate to unlock panning; zoom remains available.'
          :'Activate to lock panning and prevent accidental movement.';
      }
      EUI.zoomLock.title=zoom.locked?'Unlock panning; zoom remains available':'Lock panning to prevent accidental movement';
    }
    if(EUI.zoomLockLabel)EUI.zoomLockLabel.textContent=zoom.locked?'Locked':'Pan';
    UI.viz.classList.toggle('pan-unlocked',enabled&&!zoom.locked);
  }
  function setPanLocked(locked,announce=true){
    zoom.locked=!!locked;
    if(zoom.locked&&zoom.panning){zoom.panning=false;UI.viz.classList.remove('panning');}
    updatePanLockUi();
    if(announce)UI.status.textContent=zoom.locked?'Trace panning locked':'Trace panning unlocked; drag the diagram to move it';
  }
  function setZoomEnabled(enabled){
    EUI.canvasTools.hidden=!enabled;
    [EUI.zoomLock,EUI.zoomOut,EUI.zoomReset,EUI.zoomIn,EUI.zoomFit].forEach(control=>{if(control)control.disabled=!enabled||playerState.busy;});
    UI.viz.classList.toggle('zoom-workspace',enabled);
    updatePanLockUi();
  }
  function applyZoom(){
    if(!zoom.layer)return;
    zoom.layer.style.transform=`translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`;
    EUI.zoomLevel.textContent=`${Math.round(zoom.scale*100)}%`;
    /* The zoom readout used to be an <output> inside the reset button. role
       status is excluded from name-from-content, so the button's accessible
       name fell through to its title and lost the text on screen. The readout
       is now a plain span, which does name the button, and the spoken
       announcement moved to this separate live region outside the control. */
    const zoomAnnounce=document.getElementById('zoomAnnounce');
    if(zoomAnnounce)zoomAnnounce.textContent=`Zoom ${Math.round(zoom.scale*100)} percent`;
    EUI.zoomOut.disabled=playerState.busy||zoom.scale<=0.5;EUI.zoomIn.disabled=playerState.busy||zoom.scale>=3;
    UI.viz.classList.toggle('zoomed',zoom.scale!==1||zoom.x!==0||zoom.y!==0);
    updatePanLockUi();
  }
  function resetZoom(update=true){zoom.scale=1;zoom.x=0;zoom.y=0;if(update)applyZoom();}
  function prepareZoom(){
    const frame=playerState.frames[playerState.frameIndex];const kind=frame?.view?.kind||null;const enabled=!!kind&&ZOOMABLE.has(kind);
    setZoomEnabled(enabled);zoom.kind=kind;
    if(!enabled){zoom.layer=null;resetZoom(false);EUI.zoomLevel.textContent='100%';updatePanLockUi();return;}
    const children=[...UI.viz.children].filter(child=>!child.classList.contains('legend-panel'));
    if(!children.length){zoom.layer=null;updatePanLockUi();return;}
    const layer=document.createElement('div');layer.className='zoom-layer';children.forEach(child=>layer.appendChild(child));UI.viz.appendChild(layer);zoom.layer=layer;applyZoom();
  }
  function zoomAt(nextScale,clientX=null,clientY=null){
    if(!zoom.layer)return;
    const old=zoom.scale;const next=clamp(nextScale,0.5,3);if(next===old)return;
    const rect=UI.viz.getBoundingClientRect();const px=clientX==null?rect.width/2:clientX-rect.left;const py=clientY==null?rect.height/2:clientY-rect.top;const ratio=next/old;
    zoom.x=px-(px-zoom.x)*ratio;zoom.y=py-(py-zoom.y)*ratio;zoom.scale=next;applyZoom();
  }
  function fitZoom(){
    if(!zoom.layer)return;
    resetZoom(false);zoom.layer.style.transform='none';
    const availableWidth=Math.max(1,UI.viz.clientWidth-16);const availableHeight=Math.max(240,UI.viz.clientHeight-16);
    const naturalWidth=Math.max(1,zoom.layer.scrollWidth,zoom.layer.getBoundingClientRect().width);const naturalHeight=Math.max(1,zoom.layer.scrollHeight,zoom.layer.getBoundingClientRect().height);
    zoom.scale=clamp(Math.min(1,availableWidth/naturalWidth,availableHeight/naturalHeight),0.5,1);zoom.x=0;zoom.y=0;applyZoom();
    UI.status.textContent=`Trace fitted at ${Math.round(zoom.scale*100)}%`;
  }

  function syncAfterPaint(){
    const module=currentModule();if(module?.id!==zoom.moduleId){zoom.moduleId=module?.id||null;resetZoom(false);setPanLocked(true,false);}
    updateMarks();prepareZoom();
    const scope=scopeFor(module);
    if(UI.moduleStatus&&module){
      const base=`COMP2521 Tracer ${APP_STATUS} v${APP_VERSION}; current module: ${module.name} (${module.id})`;
      UI.moduleStatus.dataset.courseWeek=scope.week;
      UI.moduleStatus.dataset.courseWeekIntroduced=scope.introduced?scope.introduced.week:'none';
      UI.moduleStatus.dataset.courseWeekApplied=(scope.applied||[]).map(row=>row.week).join(' ')||'none';
      UI.moduleStatus.dataset.courseRelevance=scope.relevance||'unclassified';
      UI.moduleStatus.dataset.externalAdmission=scope.admitted===false?'excluded':'admitted';
      UI.moduleStatus.title=`${base}; ${scope.week}: ${scope.outline}`
        +(scope.inference?`; INFERENCE (not official): ${scope.inference}`:'')
        +(assessmentLine(scope)?`; ${assessmentLine(scope)}`:'');
      UI.moduleStatus.setAttribute('aria-label',UI.moduleStatus.title);
    }
    if(EUI.labBtn&&module){
      EUI.labBtn.dataset.externalAdmission=scope.admitted===false?'excluded':'admitted';
      EUI.labBtn.title=scope.admitted===false
        ?`No external recipe or topic reference is admitted for ${module.group}; open for the scope explanation`
        :`Open course-scoped practice recipes and optional pinned references for ${module.name}`;
    }
  }

  const basePaintForEnhancements=paint;
  paint=function enhancedPaint(){basePaintForEnhancements();syncAfterPaint();};
  const baseSelectForEnhancements=selectModule;
  selectModule=function enhancedSelect(id,options={}){const previous=currentModule()?.id;baseSelectForEnhancements(id,options);if(currentModule()?.id!==previous){zoom.moduleId=currentModule()?.id||null;resetZoom(false);setPanLocked(true,false);}syncAfterPaint();};
  const baseBusyControlsForEnhancements=busyControls;
  busyControls=function enhancedBusyControls(){return [...new Set([...baseBusyControlsForEnhancements(),EUI.labBtn,EUI.stepsBtn,EUI.zoomLock,EUI.zoomOut,EUI.zoomReset,EUI.zoomIn,EUI.zoomFit].filter(Boolean))];};

  EUI.labBtn?.addEventListener('click',openLab);EUI.labClose?.addEventListener('click',closeLab);EUI.labDone?.addEventListener('click',closeLab);
  EUI.labDialog?.addEventListener('cancel',event=>{event.preventDefault();closeLab();});EUI.labDialog?.addEventListener('click',event=>{if(event.target===EUI.labDialog)closeLab();});EUI.labDialog?.addEventListener('keydown',event=>handleManagedDialogKeydown(event,EUI.labDialog,closeLab));
  EUI.stepsBtn?.addEventListener('click',openSteps);EUI.stepClose?.addEventListener('click',closeSteps);EUI.stepDone?.addEventListener('click',closeSteps);EUI.stepActive?.addEventListener('click',()=>jumpToStep(playerState.frameIndex,true));
  EUI.stepDialog?.addEventListener('cancel',event=>{event.preventDefault();closeSteps();});EUI.stepDialog?.addEventListener('click',event=>{if(event.target===EUI.stepDialog)closeSteps();});EUI.stepDialog?.addEventListener('keydown',event=>{
    handleManagedDialogKeydown(event,EUI.stepDialog,closeSteps);
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    const items=qa('#stepList .step-item');if(!items.length)return;event.preventDefault();const active=document.activeElement.closest?.('.step-item');let index=Math.max(0,items.indexOf(active));if(event.key==='ArrowDown')index=Math.min(items.length-1,index+1);else if(event.key==='ArrowUp')index=Math.max(0,index-1);else if(event.key==='Home')index=0;else index=items.length-1;items[index].focus();
  });

  EUI.zoomLock?.addEventListener('click',()=>setPanLocked(!zoom.locked));
  EUI.zoomOut?.addEventListener('click',()=>zoomAt(zoom.scale-0.25));EUI.zoomIn?.addEventListener('click',()=>zoomAt(zoom.scale+0.25));EUI.zoomReset?.addEventListener('click',()=>{resetZoom();UI.status.textContent='Trace zoom reset to 100%';});EUI.zoomFit?.addEventListener('click',fitZoom);
  UI.viz.addEventListener('wheel',event=>{if(!(event.ctrlKey||event.metaKey)||!zoom.layer)return;event.preventDefault();zoomAt(zoom.scale*(event.deltaY<0?1.12:0.89),event.clientX,event.clientY);},{passive:false});
  UI.viz.addEventListener('pointerdown',event=>{
    if(!zoom.layer||zoom.locked||event.button!==0||event.isPrimary===false||event.target.closest('button,a,summary,details'))return;
    zoom.panning=true;zoom.lastX=event.clientX;zoom.lastY=event.clientY;UI.viz.classList.add('panning');UI.viz.setPointerCapture?.(event.pointerId);event.preventDefault();
  });
  UI.viz.addEventListener('pointermove',event=>{if(!zoom.panning)return;event.preventDefault();zoom.x+=event.clientX-zoom.lastX;zoom.y+=event.clientY-zoom.lastY;zoom.lastX=event.clientX;zoom.lastY=event.clientY;applyZoom();});
  const stopPan=event=>{if(!zoom.panning)return;zoom.panning=false;UI.viz.classList.remove('panning');try{UI.viz.releasePointerCapture?.(event.pointerId);}catch(_error){}};
  UI.viz.addEventListener('pointerup',stopPan);UI.viz.addEventListener('pointercancel',stopPan);UI.viz.addEventListener('pointerleave',event=>{if(event.buttons===0)stopPan(event);});

  // Append external provenance facts each time the existing Sources sheet opens.
  q('#sourcesBtn')?.addEventListener('click',()=>requestFrame(()=>{
    const facts=q('#buildFacts');if(!facts||!dialogIsOpen(q('#sourcesDialog'))||facts.querySelector('[data-external-fact]'))return;
    [
      ['Course-scope gate','COMP2521 2026 Term 2 outline only'],
      ['structs.sh assets','Marked timeline + pan/zoom/fit/lock interaction; MIT; commit f96154f0...'],
      ['Tactile-DS assets','Clean-room command recipes + optional pinned reference links only; commit 05d06414...'],
      ['External algorithm code','None admitted']
    ].forEach(([term,value])=>{
      const dt=createElement('dt',null,term);dt.dataset.externalFact='true';
      const dd=createElement('dd',null,value);dd.dataset.externalFact='true';
      facts.appendChild(dt);facts.appendChild(dd);
    });
  }));

  if(Array.isArray(TOUR_STEPS)&&!TOUR_STEPS.some(step=>step.title==='Use recipes, timeline and zoom')){
    TOUR_STEPS.push({title:'Use recipes, timeline and zoom',body:'Open <code>Lab recipes</code> for course-scoped values-only presets and optional pinned references. Open <code>Steps</code> to jump to any real frame. Use the visualisation controls to zoom or fit; unlock panning before dragging a diagram. These interface methods do not replace course algorithms.'});
    if(dialogIsOpen(UI.tourDialog))renderTour();
  }

  syncAfterPaint();

  window.COMP2521EnhancementTestAPI=Object.freeze({
    version:ENHANCEMENT_VERSION,
    admittedGroups(){return Object.keys(COURSE_SCOPE).sort();},
    excludedGroups(){return Object.keys(EXCLUDED_SCOPE).sort();},
    courseScope(id){const module=MODULES.find(candidate=>candidate.id===id);return module?{...scopeFor(module)}:null;},
    /* CUR-MOD-01 surfaces. The register is the single reviewed source for
       every week label this build displays. */
    officialWeekSchedule(){return OFFICIAL_WEEKS.map(row=>({...row,groups:[...row.groups]}));},
    curriculumSources(){return Object.fromEntries(Object.entries(CURRICULUM_SOURCES).map(([id,src])=>[id,{...src}]));},
    curriculumRecord(id){const module=MODULES.find(candidate=>candidate.id===id);const record=curriculumFor(module);return record?JSON.parse(JSON.stringify(record)):null;},
    curriculumRegister(){return Object.fromEntries(MODULES.map(module=>{
      const record=curriculumFor(module);
      return [module.id,record?{
        topic:record.topic,group:module.group,
        introducedWeek:record.introduced?record.introduced.week:null,
        introducedGroup:record.introduced?record.introduced.group:null,
        introducedSource:record.introduced?record.introduced.sourceId:null,
        appliedWeeks:record.applied.map(row=>row.week),
        revisionWeeks:record.revision.map(row=>({week:row.week,numbered:row.numbered!==false})),
        prerequisites:[...record.prerequisites],
        provenance:{...record.provenance},
        assessment:{...record.assessment},
        relevance:record.relevance,
        inference:record.inference,
        reviewDepth:record.reviewDepth,
        exactSourceComparison:'NOT performed - declared originals absent'
      }:null];
    }));},
    /* RES-02 surface: the measured comparison counts behind the sorting
       objectives, with the counted operation named. */
    sortWorkRegister(){return {countedOperation:SORT_COUNTED_OP,inputs:{...SORT_INPUTS},
      algorithms:Object.fromEntries(Object.entries(SORT_WORK).map(([id,work])=>[id,{...work}]))};},
    /* `objective` is included so that a preset's stated learning claim can
       be reviewed mechanically. RES-01 and RES-02 were both defects in the
       objective text, not in any value, and an inventory that omitted the
       objective could not have surfaced either. */
    recipeInventory(){return Object.fromEntries(MODULES.map(module=>[module.id,recipeSet(module).map(item=>({id:item.id,title:item.title,objective:item.objective,values:{...item.values}}))]));},
    resourceInventory(){return Object.fromEntries(MODULES.map(module=>[module.id,resourceSet(module).map(item=>({...item}))]));},
    interactionSources(){return INTERACTION_SOURCES.map(item=>({...item}));},
    applyRecipe(recipeId,runNow=false){const item=recipeSet(currentModule()).find(candidate=>candidate.id===recipeId);if(!item)throw new Error(`unknown recipe: ${recipeId}`);setRecipeValues(currentModule(),item);if(runNow)go();return readInputs();},
    timelineMarks(max){return timelineMarks(Number(max));},
    timelineSnapshot(){return {frameCount:playerState.frames.length,frameIndex:playerState.frameIndex,marks:timelineMarks(Math.max(0,playerState.frames.length-1)),dialogOpen:dialogIsOpen(EUI.stepDialog)};},
    zoomSnapshot(){return {scale:zoom.scale,x:zoom.x,y:zoom.y,kind:zoom.kind,enabled:!EUI.canvasTools.hidden,locked:zoom.locked};},
    resetZoom(){resetZoom();return this.zoomSnapshot();},
    setPanLocked(value){setPanLocked(!!value,false);return this.zoomSnapshot();},
    externalPolicy(){return {structsSh:{commit:STRUCTS_COMMIT,licence:'MIT',admitted:['timeline marks','pan/zoom/fit/lock interaction','optional pinned source references'],copiedAlgorithmCode:false},tactileDs:{commit:TACTILE_COMMIT,licenceFinding:'no repository-wide licence file located',admitted:['clean-room command recipe interaction','optional pinned reference links'],copiedCode:false,copiedImages:false,copiedProse:false},excludedGroups:Object.keys(EXCLUDED_SCOPE).sort(),excluded:['splay tree','linked-list-only repository content','external algorithm implementations','external source-code substitutions','external imagery','external recipes for topics not named in the 26T2 outline']};}
  });
})();
