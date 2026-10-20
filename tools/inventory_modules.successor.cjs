/* Read-only audit of the final, loaded teaching registry. No app files are written. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { load, ROOT, FILES } = require(process.env.DSA_LOADER||'/home/claude/work/replay/reproduce/algorithm/load_modules.cjs');
const OUT = __dirname;
const COMMIT = '37ada3235c4d67f8b98c46afdb31c092b44419ed';
const REPO = 'https://github.com/AsgardianHunter2301/dsa_guide';
const SCHEDULE = 'https://webcms3.cse.unsw.edu.au/COMP2521/26T2/resources/121287';
const { api, context, warnings } = load();
const json = value => JSON.parse(JSON.stringify(value));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const countLines = text => String(text).split('\n').length;
const lineAt = (text, pos) => countLines(text.slice(0, pos));
const writeJSON = (name, value) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(value, null, 2) + '\n');
const esc = s => String(s ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function csvCell(value) {
  const s = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[\r\n",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function writeCSV(name, rows, keys) {
  fs.writeFileSync(path.join(OUT, name), [keys, ...rows.map(row => keys.map(k => row[k]))].map(row => row.map(csvCell).join(',')).join('\n') + '\n');
}
function expressionEnd(text, start) {
  let q = '', comment = '', depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (comment === '//') { if (c === '\n') comment = ''; continue; }
    if (comment === '/*') { if (c === '*' && n === '/') { comment = ''; i++; } continue; }
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = ''; continue; }
    if (c === '/' && (n === '/' || n === '*')) { comment = '/' + n; i++; continue; }
    if ('\'"`'.includes(c)) { q = c; continue; }
    if ('([{'.includes(c)) depth++;
    if (')]}'.includes(c)) depth--;
    if (c === ';' && depth === 0) return i;
  }
  return text.length;
}
/* SUCCESSOR ADAPTATION 1 of 2.
   The audited version located `const <NAME>=Object.freeze(` by text search and
   eval'd that literal in a bare context. That works only while the literal is
   self-contained. CUR-MOD-01 replaced the single group->week map with one
   reviewed register, so COURSE_SCOPE and EXCLUDED_SCOPE are now DERIVED views
   of it: their source text references GROUP_CURRICULUM, and eval'ing the
   literal alone throws ReferenceError. Rather than freeze a second copy of the
   data in the application just to satisfy an extractor - which would
   reintroduce exactly the duplication CUR-MOD-01 removed - this version
   evaluates the whole file in a sandbox with the small set of browser globals
   it touches, then reads the resolved value. It therefore reports what the
   application actually computes. The literal-text path is retained as a
   fallback so the adapted script still works on the unmodified baseline. */
function extractFrozenObject(text, name) {
  /* The register lives inside the file's IIFE, so evaluating the whole file
     cannot reach it. Instead, evaluate every `const X=Object.freeze(...)`
     declaration in source order inside ONE context, so a derived view can see
     the register it is derived from, then read the requested name. */
  try{
    const ctx=vm.createContext({Object,Array,String,Number,Boolean,JSON,Math,RegExp,Date,Set,Map});
    const decl=/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*Object\.freeze\s*\(/g;
    let m,resolved=false;
    while((m=decl.exec(text))!==null){
      const end=expressionEnd(text,m.index);
      const body=text.slice(text.indexOf('(',m.index)+1,end).trim().replace(/\)$/,'');
      try{vm.runInContext('globalThis.'+m[1]+'=('+body+');',ctx,{timeout:8000});}catch(e){/* skip one that needs more */}
      if(m[1]===name)resolved=true;
    }
    if(resolved&&ctx[name]!==undefined)return ctx[name];
  }catch(err){ /* fall through to the audited literal path */ }
  const start = text.indexOf('const ' + name + '=Object.freeze(');
  if (start < 0) throw new Error('Missing object marker: ' + name);
  const bodyStart = text.indexOf('(', start) + 1;
  const end = expressionEnd(text, start);
  const body = text.slice(bodyStart, end).trim().replace(/\)$/, '');
  return vm.runInNewContext('(' + body + ')');
}
function sourceWeekClaims(text) {
  const values = new Set();
  for (const match of String(text || '').matchAll(/\b(?:week\s*0?|W)([1-9]|10)(?!\d)/gi)) values.add(Number(match[1]));
  return [...values].sort((a,b) => a-b);
}
function viewKinds(view, out = new Set()) {
  if (!view) return out;
  out.add(view.kind);
  for (const child of view.views || []) viewKinds(child, out);
  return out;
}

const files = Object.fromEntries(FILES.map(file => ['assets/' + file, fs.readFileSync(path.join(ROOT, 'assets', file), 'utf8')]));
const enhancementPath = 'assets/course-enhancements.js';
const enhancementText = fs.readFileSync(path.join(ROOT, enhancementPath), 'utf8');
/* SUCCESSOR ADAPTATION 2 of 2.
   The scope views are computed from the CUR-MOD-01 register by helper
   functions, so neither literal eval nor whole-file eval can read them: the
   register lives inside the file's IIFE and is published through
   window.COMP2521EnhancementTestAPI. tools/extract_curriculum_register.cjs
   dumps that API from a real page load; when its JSON is available it is used,
   which reports what the application actually computes rather than what a
   regex guessed. Without it, the audited text path still runs, so this script
   remains usable on the unmodified baseline. */
const registerPath = process.env.DSA_CURRICULUM_REGISTER
  || '/home/claude/work/artifacts/curriculum_register.json';
let scope, excluded, scopeSource;
if (fs.existsSync(registerPath)) {
  const reg = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
  const pick = names => Object.fromEntries((names||[]).map(g => {
    const hit = Object.values(reg.scope||{}).find(r => r && r.group === g) || {};
    return [g, {week: hit.week || null, outline: hit.outline || null, topic: hit.topic || null,
                admitted: hit.admitted !== false}];
  }));
  scope = json(pick(reg.admittedGroups));
  excluded = json(pick(reg.excludedGroups));
  scopeSource = 'live register dump: ' + registerPath;
} else {
  scope = json(extractFrozenObject(enhancementText, 'COURSE_SCOPE'));
  excluded = json(extractFrozenObject(enhancementText, 'EXCLUDED_SCOPE'));
  scopeSource = 'literal text extraction from ' + enhancementPath;
}
const declaredScopes = {...scope, ...excluded};
const topicContext = vm.createContext({window:{}});
const repositoryFileNames = fs.readdirSync(ROOT,{recursive:true}).filter(name=>fs.statSync(path.join(ROOT,name)).isFile());
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/topics.js'), 'utf8'), topicContext);
const topics = json(topicContext.window.TRACER_TOPICS);
const byTopicId = new Map(topics.map(t => [t.i, t]));
const pageDescriptors = [];
for (const name of fs.readdirSync(path.join(ROOT, 'assets')).filter(n => /^page-.*\.js$/.test(n)).sort()) {
  const ctx = vm.createContext({window:{}});
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', name), 'utf8'), ctx);
  pageDescriptors.push({...json(ctx.window.TRACER_PAGE), descriptor_path:'assets/' + name});
}

// Observe additions after each real loader file. The final registry below still comes from load().
const firstRegistered = new Map();
const registrationContext = vm.createContext({window:{},console:{log(){},warn(){}}});
for (const file of FILES) {
  vm.runInContext(files['assets/' + file], registrationContext, {filename:'assets/' + file,timeout:10000});
  const seen = vm.runInContext('typeof MODULES === "undefined" ? [] : MODULES.map(m=>({id:m.id,group:m.group,name:m.name}))', registrationContext);
  for (const item of seen) if (!firstRegistered.has(item.id)) {
    const text = files['assets/' + file];
    let match = new RegExp('\\bid\\s*:\\s*[\'\"]' + esc(item.id) + '[\'\"]').exec(text);
    if (!match) match = new RegExp('quickModule\\([\'\"]' + esc(item.id) + '[\'\"]').exec(text);
    if (!match) throw new Error('Missing module registration marker for ' + item.id);
    firstRegistered.set(item.id,{path:'assets/' + file,line:lineAt(text,match.index),original_group:item.group});
  }
}

// Map actual decoded block bytes to named source constants and their repository declarations.
const bindingsByHash = new Map();
for (const [file,text] of Object.entries(files)) {
  const regex = /\b(?:const|let|var)\s+([A-Z][A-Z0-9_]*)\s*=/g;
  for (const match of text.matchAll(regex)) {
    const name = match[1];
    let value;
    try { value = vm.runInContext('typeof ' + name + ' === "string" ? ' + name + ' : null', context); } catch { continue; }
    if (typeof value !== 'string') continue;
    const hash = sha(value);
    if (!bindingsByHash.has(hash)) bindingsByHash.set(hash,[]);
    bindingsByHash.get(hash).push({symbol:name,path:file,line_start:lineAt(text,match.index),line_end:lineAt(text,expressionEnd(text,match.index)),url:REPO + '/blob/' + COMMIT + '/' + file + '#L' + lineAt(text,match.index)});
  }
}

const coverageRows = json(vm.runInContext('COVERAGE_ROWS', context)).map((row,i) => ({
  coverage_row:i+1,area:row[0],item:row[1],declared_mode:row[2],destinations:row[3].split(/\s*\/\s*/),declared_source:row[4],declared_weeks:sourceWeekClaims(row[0]),
  locator:{path:'assets/corpus-shared.js',line:lineAt(files['assets/corpus-shared.js'],files['assets/corpus-shared.js'].indexOf("['" + row[0] + "','" + row[1].replace(/'/g,"\\'") + "'"))}
}));
for (const row of coverageRows) if (row.locator.line <= 1) throw new Error('Coverage marker not resolved for row ' + row.coverage_row);
const sourceCorpus = json(vm.runInContext('SOURCE_CORPUS', context)).map((row,i) => ({
  source_row:i+1,declared_label:row[0],declared_filename:row[1],declared_topic:row[2],declared_weeks:sourceWeekClaims(row[0]),
  declared_term:i===0?'26T2':'25T3 (corpus header and coursemap narrative)', original_file_present_in_repository:repositoryFileNames.some(file=>path.basename(file)===row[1]),
  authority_status:'Repository assertion; original supplied PDF/DOCX has not been independently compared in this audit',
  locator:{path:'assets/corpus-shared.js',line:lineAt(files['assets/corpus-shared.js'],files['assets/corpus-shared.js'].indexOf("['" + row[0] + "','" + row[1] + "'"))}
}));

const scheduleGroups = {
  'Recursion':{primary:[1],prerequisites:[],topic:'Recursion'},
  'Analysis':{primary:[1],prerequisites:[],topic:'Analysis of algorithms'},
  'Sorting':{primary:[2],prerequisites:[1],topic:'Sorting algorithms'},
  'Abstract data types':{primary:[3],prerequisites:[1],topic:'Abstract data types'},
  'Binary search trees':{primary:[3],prerequisites:[1],revisited:[4],topic:'Binary search trees'},
  'Balanced BSTs':{primary:[4],prerequisites:[1,3],topic:'Balancing BSTs'},
  'AVL trees':{primary:[4],prerequisites:[1,3],topic:'AVL trees'},
  'Graph representations':{primary:[4],prerequisites:[3],topic:'Graph introduction'},
  'Graph traversal':{primary:[5],prerequisites:[3,4],topic:'Graph traversal'},
  'Graph problems':{primary:[5],prerequisites:[4,5],topic:'Graph problems'},
  'Directed graphs':{primary:[7],prerequisites:[4,5],topic:'Digraph algorithms'},
  'Shortest paths & MSTs':{primary:[7],prerequisites:[4,5],topic:'Dijkstra and minimum spanning trees'},
  'Hash tables':{primary:[8],prerequisites:[3],topic:'Hash tables'},
  'Hash applications':{primary:[8],prerequisites:[3,8],topic:'Hash-table applications'},
  'Priority queues & heaps':{primary:[9],prerequisites:[2,3],topic:'Priority queues and heaps'},
  'Tries':{primary:[9],prerequisites:[1,3],topic:'Tries'}
};
function weekAlignment(module) {
  const group = scheduleGroups[module.group];
  if (module.id === 'graphweighted') return {primary:[5],prerequisites:[3,4],topic:'Directed/weighted graph introduction',basis:'Topic-level inference from the explicitly named Week 5 lecture; supporting representation basics belong to Week 4',official_url:SCHEDULE,source_verified_date:'2026-10-20',exact_block_taught_week_verified:false};
  if (!group) return {primary:[],prerequisites:[],topic:module.group,basis:module.group==='Searching'?'Manual/source coverage places search with Week 1 analysis; the high-level schedule does not name each search algorithm, so exact taught week needs lecture-level evidence':'Internal navigation/reference collection; individual items have distinct week claims',official_url:SCHEDULE,source_verified_date:'2026-10-20',exact_block_taught_week_verified:false};
  return {...group,basis:'Module-topic inference from the matching named lecture group. Prerequisite weeks are an audit recommendation, not an official week-by-week prerequisite specification.',official_url:SCHEDULE,source_verified_date:'2026-10-20',exact_block_taught_week_verified:false};
}

const modules = [], blocks = [], checks = [];
for (const summary of api.inventory()) {
  const module = api.module(summary.id);
  const topic = byTopicId.get(module.id);
  if (!topic) throw new Error('No generated topic descriptor for ' + module.id);
  const coverage = coverageRows.filter(row => row.destinations.includes(module.id));
  const trace = api.run(module.id);
  const kinds = [...trace.f.reduce((out,frame) => viewKinds(frame.view,out),new Set())].sort();
  const registration = firstRegistered.get(module.id);
  const declaredScope = declaredScopes[module.group] || null;
  const final = trace.f.at(-1);
  const row = {
    id:module.id,name:module.name,group:module.group,page:topic.p,page_descriptor:pageDescriptors.find(p=>p.file===topic.p)?.descriptor_path || null,
    topic_descriptor:topic,registration,registration_url:REPO + '/blob/' + COMMIT + '/' + registration.path + '#L' + registration.line,
    keywords:module.keywords||'',note:module.note||'',fields:json(module.fields||[]),block_count:module.blocks.length,
    source_line_count:module.blocks.reduce((n,b)=>n+countLines(b.src),0),default_frame_count:trace.f.length,default_renderer_kinds:kinds,
    teaching_interaction_observation:trace.f.length===1 && kinds.every(k=>['reference','multi'].includes(k)) ? (module.fields.length?'Single reference frame with a selector or parameter':'Static reference-only default view') : 'Multi-step default trace; operation completeness and all branches are not established by this classification',
    default_final_variables:json(final?.vars || {}),
    site_week_label:declaredScope?.week||null,site_scope_declared:declaredScope,site_scope_locator:{path:enhancementPath,line:lineAt(enhancementText,enhancementText.indexOf("'"+module.group+"':"))},
    course_coverage_rows:coverage.map(row=>row.coverage_row),coverage_modes:[...new Set(coverage.map(row=>row.declared_mode))],coverage_declared_areas:[...new Set(coverage.map(row=>row.area))],
    coverage_declared_weeks:[...new Set(coverage.flatMap(row=>row.declared_weeks))].sort((a,b)=>a-b),
    block_provenance_week_claims:[...new Set(module.blocks.flatMap(b=>sourceWeekClaims(b.pages)))].sort((a,b)=>a-b),
    proposed_week_alignment:weekAlignment(module),
    content_relevance_status:module.group==='Course map'?'Navigation/context collection: assess each listed item individually':module.group==='Searching'?'Relevant manual/analysis prerequisite; verify exact lecture-level placement before treating high-level omission as exclusion':'Direct topic-group relevance; completeness of every named subtopic remains independently reviewable',
    loaded_run_sha256:sha(module.run.toString())
  };
  modules.push(row);
  checks.push({id:module.id,descriptor_name_matches:topic.n===module.name,descriptor_group_matches:topic.g===module.group,descriptor_block_count_matches:topic.b===row.block_count,descriptor_line_count_matches:topic.l===row.source_line_count,page_group_matches:!!pageDescriptors.find(p=>p.file===topic.p&&p.groups.includes(module.group))});
  module.blocks.forEach((block,index) => {
    const hash=sha(block.src), origins=bindingsByHash.get(hash)||[];
    blocks.push({block_id:module.id+':'+index,module_id:module.id,module_name:module.name,module_group:module.group,page:topic.p,block_index_zero_based:index,block_number_one_based:index+1,
      title:block.title,declared_source_category:block.source||null,declared_pseudocode:!!block.pseudo,declared_language:block.lang||block.language||null,
      displayed_language_inference:block.pseudo?'Pseudocode/prose flag':'C-like source highlighting by default; there is no explicit language field',
      content_kind_inference:block.source==='coverage'?'Coverage index or contextual reference':block.source==='memorise'?'Added teaching C bridge':block.pseudo?'Pseudocode or conceptual prose, as declared':'C source/interface, inferred from absence of pseudo flag; not a compilation claim',
      source_locator_text:block.pages||null,source_locator_weeks:sourceWeekClaims(block.pages),
      declared_source_term:block.source==='manual'?'26T2':block.source==='lecture'?'25T3 (global corpus claim)':null,
      source_line_count:countLines(block.src),source_utf8_bytes:Buffer.byteLength(block.src),source_sha256:hash,source_text:block.src,
      exact_source_constant_origins:origins,registration,site_week_label:row.site_week_label,coverage_declared_weeks:row.coverage_declared_weeks,proposed_module_primary_weeks:row.proposed_week_alignment.primary,
      verification_limits:'Exact loaded block bytes inventoried; SHA-256 identifies these bytes only. Original course-source equality, compilation completeness and the exact taught week of this block are not established by hashing.'});
  });
}
if (modules.length !== 68 || topics.length !== 68 || new Set(modules.map(m=>m.id)).size !== 68) throw new Error('Unexpected baseline module cardinality');
const descriptorMismatches = checks.filter(row=>Object.entries(row).some(([key,value])=>key!=='id'&&value!==true));
if (coverageRows.some(row=>row.destinations.some(id=>!modules.some(m=>m.id===id)))) throw new Error('Unresolved coverage destination');

// Row-specific relevance decisions. These are curriculum assessments, not proof of all code semantics.
const moduleIssues = {
  coursemap:['CUR-MOD-03','CUR-MOD-04','CUR-MOD-05','AUD-13'],
  namedalgos:['CUR-MOD-05'],graphweighted:['CUR-MOD-01','CUR-MOD-02'],graphreps:['CUR-MOD-02'],graphlist:['CUR-MOD-02'],graphedges:['CUR-MOD-02'],
  dijkstra:['CUR-MOD-03'],radix:['CUR-MOD-04'],bstrebalance:['CUR-MOD-04'],hash:['CUR-MOD-04'],hashprobe:['CUR-MOD-04','AUD-01','AUD-04'],avldel:['CUR-MOD-04','AUD-02'],quickvariants:['CUR-MOD-06'],
  bin:['AUD-02'],bstsearch:['AUD-02'],graphadt:['AUD-01'],dfs:['AUD-01'],dfspath:['AUD-01'],warshall:['AUD-01'],components:['AUD-01'],bfs:['AUD-05'],hamilton:['AUD-03'],kruskal:['AUD-15']
};
const normalDomainOracleModules = new Set(['sel','bub','ins','ms','qs','q3','bottomup','heapsort','heapify','bin','bstins','avlins','bstdel','avldel','bstpartition','bstrebalance','dijkstra','bfspath','components','cycleu','kruskal','prim','warshall','cycled','twosum','oddocc']);
for (const m of modules) {
  m.related_findings = moduleIssues[m.id] || [];
  m.review_depth = {
    inventory:'All final descriptor fields, source-block metadata and default trace shape inspected; actual page membership cross-checked',
    topic_relevance:'Module topic and source locator assessed against declared coverage and named official lecture group',
    technical:normalDomainOracleModules.has(m.id)?'Included in bounded independent final-result oracle suite; module-level edge cases and source fidelity are not exhaustively proved':'Default trace plus targeted source inspection where findings are listed; no complete correctness certification',
    original_source_comparison:'Not performed: declared original PDF/DOCX files are not present in the repository'
  };
  m.relevance_assessment = m.id==='graphweighted'?'Directly relevant to Week 5 introduction; current Week 4 group label conceals the later topic and mixes Week 4 supporting concepts.'
    :['graphlist','graphedges'].includes(m.id)?'Relevant Week 4 representation foundations; directed and weighted variants extend into Week 5. Separate initial learning from later variants and optional complete C practice.'
    :m.id==='setadt'?'Set/ADT concepts fit Week 3. Its only displayed C interface is attributed to Week 8, so this is a cross-week reference that should be identified as such, not silently treated as a Week 3 quotation.'
    :m.id==='coursemap'?'Useful navigation/control index; each of the 93 promises requires its own delivery and provenance status. The current count alone does not prove complete teaching coverage.'
    :m.id==='namedalgos'?'Useful mixed-week context catalogue. It is not an algorithm lesson for every listed name; union-find is omitted from this destination despite being linked here.'
    :m.group==='Searching'?'Relevant to algorithm analysis and the course manual. High-level outline omission is insufficient evidence of irrelevance; verify the specific Week 1 lecture placement before assigning a taught-week fact.'
    :m.id==='quickvariants'?'Direct Week 2 relevance; preserve the separate reference role and correct the inclusive-index threshold explanation.'
    :m.related_findings.length?'Topic fits the named teaching week; repair the listed delivery/algorithm defects while keeping the topic accessible.'
    :'Topic matches the named lecture group; no topic-placement defect was established in this scope. This does not certify every statement or input domain.';
  m.required_action = m.related_findings.length?'Execute and independently verify the linked fixes; reconcile this module with each mapped coverage claim and per-block source status.'
    :m.id==='setadt'?'Distinguish Week 3 learning placement from the Week 8 interface source; link later implementation alternatives and assess the reference-only delivery label.'
    :m.group==='Searching'?'Inspect the actual analysis/search teaching materials, assign evidence-backed placement, and avoid framing an outline-level omission as a course exclusion.'
    :'No relocation is indicated by the topic-level evidence. Verify source fidelity, declared inputs and pedagogical objectives during corrective execution; change any newly demonstrated defect.';
}
const manualWeeks = {SRC_MACROS:2,SRC_SEL:2,SRC_BUB:2,SRC_INS:2,SRC_MS:2,SRC_MERGE:2,SRC_QS:2,SRC_PART:2,SRC_M3:2,PS_RADIX:2,SRC_STACK:3,SRC_QUEUE:3,SRC_BST_FULL:3,PS_AVL:4,PS_AVLDEL:4,SRC_HASH:8,SRC_PQ:9,SRC_TRIE:9,SRC_GADJ:4,PS_BFS:5,PS_DFS:5,PS_WAR:7,PS_DIJ:7,PS_KRUS:7,PS_PRIM:7};
const contextualSymbols = new Set(['COVERAGE_TEXT','NAMED_ONLY','LEC_RECURSION_GUIDE','LEC_SORT_PROPERTIES','LEC_ADT_ARCH','LEC_GRAPH_FUND','LEC_GRAPH_REPS','LEC_WEIGHTED_REPS','LEC_DIGRAPH_TERMS','LEC_PROBE_DELETE','LEC_SET_COUNTER','LEC_TWO_SUM','LEC_ODD','LEC_ANAGRAM','LEC_PQ_COMPARE']);
const structureSymbols = new Set(['LEC_ADJLIST_STRUCT','LEC_EDGEARRAY_STRUCT','LEC_AVL_HEIGHT']);
for (const b of blocks) {
  const m = modules.find(m=>m.id===b.module_id);
  const symbol = b.exact_source_constant_origins[0]?.symbol;
  const inferredWeek = b.source_locator_weeks[0] || manualWeeks[symbol] || (b.declared_source_category==='memorise' ? /_(DU|UW|DW)_MEM$/.test(symbol)?5:4 : null);
  b.teaching_role = b.declared_source_category==='coverage'?'Course index or named/context reference'
    :b.declared_source_category==='memorise'?'Supplemental complete Graph ADT implementation for a selected representation/mode'
    :symbol==='LEC_SET_IF'?'Set interface declarations; no concrete implementation in this block'
    :structureSymbols.has(symbol)?'Representation/layout or stored-metadata example; supporting source, not a complete operation implementation'
    :contextualSymbols.has(symbol)?'Concept, property table, problem statement or explanatory reference'
    :symbol==='SRC_MACROS'?'Shared comparison macro prerequisite'
    :['SRC_STACK','SRC_QUEUE','SRC_BST_FULL','SRC_HASH','SRC_PQ','SRC_TRIE','SRC_GADJ'].includes(symbol)?'Shared ADT/interface and lifecycle source; the active module may trace only selected operations'
    :b.declared_pseudocode?'Algorithm or method pseudocode; helpers and conventions must be checked separately':'Algorithm/helper C excerpt; standalone compilation completeness must be explicitly established';
  b.proposed_block_concept_weeks = inferredWeek?[inferredWeek]:[];
  b.week_mapping_evidence_level = inferredWeek?'Topic-level inference using the named official lecture group and the repository source locator; this is not verification that every line was taught in that lecture':'No exact taught-week fact established; search source context or inspect individual context items';
  b.week_mapping_evidence = {official_schedule_url:SCHEDULE,source_locator:b.source_locator_text,repository_locator:b.exact_source_constant_origins,module_mapping_basis:m.proposed_week_alignment.basis};
  b.relevance_assessment = b.declared_source_category==='memorise'?'Relevant optional implementation practice for '+b.title+'. Representation invariants and selected operations are useful; no evidence establishes all complete alternatives as mandatory memorisation prerequisites.'
    :b.declared_source_category==='coverage'?'Relevant as navigation/context, with each entry assessed separately; catalogue size is not proof of teaching completeness.'
    :symbol==='SRC_GADJ'&&b.module_id==='dijkstra'?'Relevant as a familiar unweighted representation reference. It lacks weights and cannot itself implement Dijkstra; the module already states this source boundary. Provide an explicit weighted contract when offering executable C.'
    :symbol==='LEC_SET_IF'?'Relevant Set interface reference. Source attribution says Week 8 while the host lesson belongs to Week 3; make the preview/revision relationship visible.'
    :inferredWeek&&!m.proposed_week_alignment.primary.includes(inferredWeek)?'Relevant supporting or cross-week material: the underlying concept maps to Week '+inferredWeek+' while the host module has a different learning placement. Label the relationship rather than overwriting the source week.'
    :'Relevant to the host lesson as '+b.teaching_role.toLowerCase()+'. No topic-level irrelevance was established.';
  b.related_findings = m.related_findings;
  b.required_action = b.declared_source_category==='memorise'?'Remove unsupported universal prerequisite/memorisation wording; document representation contract and optional study purpose, verify displayed C against its downloadable counterpart, and test any corrections.'
    :b.declared_source_category==='coverage'?'Repair missing/diluted coverage claims and destinations, keep named/reference/trace status distinct, and regenerate index metadata from the canonical source.'
    :symbol==='LEC_SET_IF'?'Show the Week 3 lesson versus Week 8 source distinction; verify interface fidelity and links to concrete implementations.'
    :b.related_findings.length?'Apply relevant linked fixes to the model, mapping or explanation; verify original source before correcting a quotation or changing its provenance label.'
    :'No removal or relocation is indicated. Independently compare the attributed original, document excerpt dependencies/model boundaries, and correct any discrepancy found.';
  b.review_depth={metadata:'All bytes, source category, title, line count, exact constant locator, hash and host module inventoried',curriculum:'Role and topic-level relevance assessed for this block in its host context',technical:'Host JavaScript model: '+m.review_depth.technical,original_source_fidelity:'Not independently verified',compiled_as_displayed:false};
  if(b.declared_source_category==='memorise') b.related_standalone_c_evidence={artifact:'displayed_standalone_c_comparison.json',scope:'Separate comparison resolves the displayed block hash to a standalone file using C token identity after comments/whitespace removal. Standalone compile/model tests are documented by the C audit; this field is not a claim that the displayed string was compiled.'};
}
const specialCoverage = {
  'Radix sort, padding, buckets, stability':{issues:['CUR-MOD-04'],assessment:'Fixed-width radix execution is available; mixed-width inputs are explicitly rejected and no padding lesson/source is supplied at this destination.',action:'Separate fixed-width algorithm tracing from a source-backed padding explanation or adapter; complete the relevant padding lesson without silently changing the manual quotation.'},
  'Global and periodic rebalancing':{issues:['CUR-MOD-04'],assessment:'Global mode is a multi-step trace. Periodic mode explicitly produces one reference frame; the single core label hides that difference.',action:'Split delivery status by mode and add a pedagogically justified periodic insertion/rebalance trace if it is within verified teaching scope.'},
  'Separate chaining, load factor and resizing':{issues:['CUR-MOD-04'],assessment:'The source warns that resizing is not implemented; chaining and load-factor explanation exist. The bundled core label does not express the unavailable resize operation.',action:'Describe the actual limitation, split the claim, and add a clearly attributed resize implementation/trace if completing that taught lesson; preserve the original warning in quotations.'},
  'Linear probing, backshift/tombstone deletion, clustering':{issues:['CUR-MOD-04','AUD-04'],assessment:'The executable deletion path uses tombstones. Backshift is a reference description, and tombstone reinsertion has a verified bug.',action:'Fix tombstone reuse, give deletion methods separate delivery labels, and implement/trace a verified backshift lesson or label its reference-only status accurately.'},
  'Search and deletion with rebalancing':{issues:['CUR-MOD-04','AUD-02'],assessment:'The destination is AVL deletion plus rebalance source; it has no search operation. AVL search follows BST ordering and does not require rebalancing.',action:'Create an explicit AVL search lesson/link with the correct no-rebalance contract; split search from deletion and fix scalar validation.'},
  'Shortest-path reconstruction from pred':{issues:['CUR-MOD-03'],assessment:'The destination currently ends with dist and pred arrays; no destination field or reconstructed path is supplied.',action:'Add and test source/destination path reconstruction with unreachable and source-equals-destination cases; mark any new adapter as authored teaching material.'},
  'Union-find optimisation; Boruvka; Karger-Klein-Tarjan':{issues:['CUR-MOD-05'],assessment:'Boruvka and Karger-Klein-Tarjan appear at the named destination; union-find is absent there.',action:'Add the missing union-find context and clarify its Kruskal optimisation role, or link to a separately verified lesson; do not falsely mark the current destination complete.'},
  'Directed/weighted terminology plus complete graph-mode × representation study bridges':{issues:['CUR-MOD-01','CUR-MOD-02'],assessment:'Week 5 coverage placement matches the named official lecture, but the module group supplies a Week 4 badge and frames all supplemental variants as prerequisites.',action:'Assign explicit Week 5 module placement, keep Week 4 prerequisites distinct, and make complete variant study proportional and evidence-backed.'}
};
for (const c of coverageRows) {
  const dest = c.destinations.map(id=>modules.find(m=>m.id===id));
  const special = specialCoverage[c.item];
  c.destination_delivery = dest.map(m=>({id:m.id,interaction:m.teaching_interaction_observation,frames:m.default_frame_count,block_count:m.block_count,site_week_label:m.site_week_label,proposed_module_primary_weeks:m.proposed_week_alignment.primary}));
  c.relevance_assessment = special?.assessment || (c.declared_mode==='named'?'Relevant contextual name(s) according to the repository coverage claim; the high-level official schedule does not establish required implementation depth for each name.'
    :c.declared_mode==='reference'?'Relevant supporting theory or method reference for the stated topic. It should not be counted as an executed algorithm without a separate operational lesson.'
    :dest.some(m=>m.teaching_interaction_observation==='Static reference-only default view')?'The topic fits this part of the course, but its destination is a static reference lesson. The core label needs an explicit, granular delivery definition.'
    :'Relevant to the stated course area with an existing destination. Default trace availability does not prove every subtopic in this combined claim is fully taught.');
  c.proposed_topic_weeks = c.declared_weeks.length?c.declared_weeks:c.area==='Manual Tries'?[9]:[];
  c.week_mapping_evidence_level = c.area==='Manual Tries'?'Week 9 Tries is explicitly named in the official schedule; exact block/operation teaching depth remains unverified':'Named-topic/area alignment with the official schedule; exact individual algorithm/subtopic inclusion relies on a repository claim pending lecture-level verification';
  c.week_mapping_evidence = {official_schedule_url:SCHEDULE,repository_area:c.area,source_claim:c.declared_source,locator:c.locator};
  c.related_findings = special?.issues || (c.declared_mode==='core'&&dest.some(m=>m.teaching_interaction_observation==='Static reference-only default view')?['CUR-MOD-04']:[]);
  c.required_action = special?.action || (c.declared_mode==='named'?'Independently check the named/context status and exact destination presence. Do not manufacture a required implementation from a mention alone.'
    :c.declared_mode==='reference'?'Verify the source-backed statement and destination specificity; expand teaching only where it resolves a demonstrated course need.'
    :c.related_findings.length?'Split or relabel operational versus reference delivery; test each promised capability and complete relevant missing explanations.'
    :'No relocation indicated at area level. Verify every named capability against source and runtime; fix missing, misleading or incorrect delivery before marking the row complete.');
  c.review_depth = {coverage:'Each declared row and destination resolved against the final registry',delivery:'Default interaction inspected, with detailed reproductions for the specifically flagged claims',official_week:'High-level lecture schedule aligned; exact subtopic teaching not independently certified',source_fidelity:'Original PDF/DOCX not compared'};
}
for (const c of sourceCorpus) {
  c.proposed_topic_weeks = c.source_row===1?[1,2,3,4,5,7,8,9]:c.declared_weeks;
  c.relevance_assessment = c.source_row===1?'The same-term manual is the stated baseline for shared algorithms and ADTs across the course. Its original bytes are absent, so exact quotation assertions cannot be verified from this repository alone.'
    :'The declared '+c.declared_topic+' source is relevant to the matching topic group. It is described as an earlier-term lecture transcription; alignment with 26T2 at group level does not establish identical examples, wording or coverage.';
  c.week_mapping_evidence_level = c.source_row===1?'Cross-week source; individual manual blocks use topic-level inference':'Declared filename/label week agrees at topic-group level with the official 26T2 schedule; this does not verify the earlier-term original';
  c.week_mapping_evidence = {official_schedule_url:SCHEDULE,declared_filename:c.declared_filename,declared_label:c.declared_label,locator:c.locator};
  c.required_action = 'Locate the legally accessible attributed original or authoritative current equivalent, record exact title/term/URL/pages/content digest, compare affected blocks, and correct provenance or content where evidence disagrees. If unavailable, state an evidence-specific block; never certify exactness from a repository constant alone.';
  c.review_depth = {inventory:'All 21 declarations read and mapped individually',original_file_inspection:'Not possible from this repository snapshot; original is absent',comparison:'Topic-level schedule only; no word-for-word or per-example comparison'};
  c.related_findings=['AUD-13'];
  c.locator.url=REPO+'/blob/'+COMMIT+'/'+c.locator.path+'#L'+c.locator.line;
}

const sourceHashGroups = new Map();
for (const block of blocks) {
  if (!sourceHashGroups.has(block.source_sha256)) sourceHashGroups.set(block.source_sha256,[]);
  sourceHashGroups.get(block.source_sha256).push(block);
}
const repetitions = [...sourceHashGroups].filter(([,items])=>items.length>1).map(([hash,items])=>({source_sha256:hash,occurrences:items.length,source_line_count_each:items[0].source_line_count,source_utf8_bytes_each:items[0].source_utf8_bytes,block_ids:items.map(b=>b.block_id),titles:[...new Set(items.map(b=>b.title))],source_categories:[...new Set(items.map(b=>b.declared_source_category))],shared_origins:items[0].exact_source_constant_origins,interpretation:'Identical decoded source reused in different module contexts; this is not evidence of duplicate source definitions or a defect. Prefer a shared source identity and context-aware presentation.'})).sort((a,b)=>b.occurrences-a.occurrences||b.source_line_count_each-a.source_line_count_each);

const namedRows = api.run('namedalgos').f[0].view.sections.find(s=>s.table)?.table.rows || [];
const namedItems = namedRows.map((row,i)=>({named_row:i+1,item_group:row[0],displayed_status:row[1],module_id:'namedalgos',module_week_label:modules.find(m=>m.id==='namedalgos').site_week_label,
  matching_coverage_rows:coverageRows.filter(c=>c.destinations.includes('namedalgos') && row[0].split(/\s*\/\s*/).some(part=>c.item.toLowerCase().includes(part.toLowerCase().replace('key-indexed ','').replace('three-colourability','colouring')))).map(c=>c.coverage_row),
  locator:{path:'assets/corpus-named.js',line:1},relevance_status:'Declared by repository as named/contextual, not independently established as a required implementable syllabus algorithm'}));
const individualNamedDefinitions = [
  ['Shell sort','sorting algorithm',2,'named only','Shell sort'],
  ['Key-indexed counting sort','sorting algorithm',2,'named only','Key-indexed counting sort'],
  ['Kosaraju','strongly connected components algorithm',7,'named only',"Kosaraju's"],
  ['Tarjan','strongly connected components algorithm',7,'named only',"Tarjan's"],
  ['Floyd-Warshall','shortest-path algorithm',7,'curiosity only','Floyd-Warshall'],
  ['Bellman-Ford','shortest-path algorithm',7,'curiosity only','Bellman-Ford'],
  ['Boruvka','minimum-spanning-tree algorithm',7,'other algorithms',"Boruvka's"],
  ['Karger-Klein-Tarjan','minimum-spanning-tree algorithm',7,'other algorithms','Karger-Klein-Tarjan'],
  ['Longest path','graph problem',5,'tractability context','Longest-path'],
  ['Largest clique','graph problem',5,'tractability context','largest-clique'],
  ['Three-colourability','graph problem',5,'tractability context','three-colourability'],
  ['Graph isomorphism','graph problem',5,'bonus problem','Graph isomorphism'],
  ['Python dictionaries','language feature used as context, not an app runtime dependency',8,'bonus syntax','Python dictionaries'],
  ['Union-find','disjoint-set data structure / Kruskal optimisation',7,'coverage-row named claim; missing from destination','Union-find']
];
const namedSource = api.module('namedalgos').blocks[0].src;
const individualNamed = individualNamedDefinitions.map(([name,entity,week,status,match])=>({
  name,entity_type:entity,declared_status:status,proposed_topic_weeks:[week],present_in_destination_source:namedSource.toLowerCase().includes(match.toLowerCase()),
  source_block_id:'namedalgos:0',source_locator:blocks.find(b=>b.block_id==='namedalgos:0').exact_source_constant_origins,
  coverage_locator:name==='Union-find'?coverageRows.find(c=>c.item.startsWith('Union-find')).locator:null,
  relevance_assessment:name==='Union-find'?'Relevant as a named Kruskal optimisation according to the coverage index, but its destination omits it.':name==='Python dictionaries'?'Relevant as Week 8 comparative syntax/context; it is not a JavaScript package imported by this app.':week===5?'Relevant to graph-problem/tractability context; a mention does not establish an implementation exercise.':'Relevant to the stated algorithm family as a named/reference item; required depth is not established by the high-level schedule.',
  week_mapping_evidence_level:'Repository item-family claim aligned to a named official lecture group; individual name/depth is not independently confirmed from lecture slides',official_schedule_url:SCHEDULE,
  required_action:name==='Union-find'?'Add the missing context/destination and verify its actual teaching status; use a separate source-backed implementation if depth is warranted.':'Verify the named/context classification against the actual course source; supply a clear definition and relationship, and add executable teaching only where justified by course relevance.',
  review_depth:'Every individual named entity extracted and classified; destination presence and course-family alignment checked; no independent algorithm implementation or per-slide inclusion proof',
  related_findings:name==='Union-find'?['CUR-MOD-05']:[]
}));
for (const row of namedItems) {
  row.proposed_topic_weeks = [...new Set(row.matching_coverage_rows.flatMap(n=>coverageRows.find(c=>c.coverage_row===n).proposed_topic_weeks))];
  row.week_mapping_evidence_level='Repository context table and coverage link cross-check; named official lecture group only';
  row.relevance_assessment='Relevant as '+row.displayed_status+' within the matched topic family. This grouped table is not an executable lesson for every name.';
  row.required_action='Check every individual name against individual_named_context_inventory.json and the authoritative lecture; repair missing context or incorrect required-depth claims.';
  row.review_depth='Entire eight-row status table inspected and cross-linked; individual algorithm semantics and official assessment depth not certified';
}
const summary = {
  repository:REPO,baseline_commit:COMMIT,audit_date:'2026-10-20',method:'Final MODULES registry after actual ordered loader files, independent generated-topic cross-check, default-view classification and exact UTF-8 source hashing',
  module_count:modules.length,page_count:pageDescriptors.length,group_count:new Set(modules.map(m=>m.group)).size,source_block_occurrence_count:blocks.length,unique_source_block_hash_count:sourceHashGroups.size,
  source_line_occurrences:blocks.reduce((n,b)=>n+b.source_line_count,0),unique_source_lines:[...sourceHashGroups.values()].reduce((n,items)=>n+items[0].source_line_count,0),
  repeated_hash_group_count:repetitions.length,additional_repeated_block_occurrences:repetitions.reduce((n,r)=>n+r.occurrences-1,0),source_categories:Object.fromEntries([...new Set(blocks.map(b=>b.declared_source_category))].sort().map(category=>[category,blocks.filter(b=>b.declared_source_category===category).length])),
  source_constant_origin_unresolved_block_count:blocks.filter(b=>!b.exact_source_constant_origins.length).length,coverage_row_count:coverageRows.length,coverage_modes:Object.fromEntries([...new Set(coverageRows.map(c=>c.declared_mode))].map(mode=>[mode,coverageRows.filter(c=>c.declared_mode===mode).length])),
  source_corpus_declaration_count:sourceCorpus.length,source_corpus_original_files_available:sourceCorpus.filter(r=>r.original_file_present_in_repository).length,named_context_table_row_count:namedItems.length,individual_named_context_entity_count:individualNamed.length,
  static_reference_default_module_ids:modules.filter(m=>m.teaching_interaction_observation==='Static reference-only default view').map(m=>m.id),single_frame_parameterised_reference_ids:modules.filter(m=>m.teaching_interaction_observation==='Single reference frame with a selector or parameter').map(m=>m.id),
  scope_source:scopeSource,default_frame_total:modules.reduce((n,m)=>n+m.default_frame_count,0),descriptor_checks_pass:descriptorMismatches.length===0,descriptor_mismatches:descriptorMismatches,descriptor_mismatch_interpretation:'Only the coursemap display name is abbreviated in topics.js; IDs, group/page ownership and block/line counts agree for all modules. This difference is recorded, not asserted to be a functional bug.',warnings,
  row_specific_relevance_assessments:{modules:modules.filter(m=>m.relevance_assessment&&m.required_action&&m.review_depth).length,blocks:blocks.filter(b=>b.relevance_assessment&&b.required_action&&b.review_depth).length,coverage_rows:coverageRows.filter(c=>c.relevance_assessment&&c.required_action&&c.review_depth).length,source_corpus_rows:sourceCorpus.filter(c=>c.relevance_assessment&&c.required_action&&c.review_depth).length,named_table_rows:namedItems.filter(c=>c.relevance_assessment&&c.required_action&&c.review_depth).length,individual_named_entities:individualNamed.filter(c=>c.relevance_assessment&&c.required_action&&c.review_depth).length},
  page_effective_module_counts:Object.fromEntries(pageDescriptors.map(page=>[page.file,modules.filter(m=>page.groups.includes(m.group)).length])),
  scope_limits:['Every block in the 68-module loaded registry union is included. tracer-ui.js sorts that registry and filters membership to each page owned group; page-effective counts are recorded separately. Later layers do not modify underlying module/source metadata, but DOM text normalization can alter rendered math (AUD-08).','Manual conversion bridges, resource cards, recipes, external dependencies and HTML prose have separate inventories produced by the frontend audit.','Metadata and default traces do not prove every operation, all input domains, source quotation fidelity, pedagogical sufficiency or official assessment relevance.','Week assignment is topic-level inference from an independently opened official 26T2 schedule, kept separate from repository source-week assertions. Original course files are absent.','Repeated hashes identify repeated content occurrences; shared constants are not multiple copied implementations.'],
  loader_files:FILES.map(file=>({path:'assets/'+file,sha256:sha(files['assets/'+file])})),official_schedule:{url:SCHEDULE,accessed:'2026-10-20',web_reference:'turn12view0',scope:'Schedule-level topic alignment only; per-slide teaching and assessment status require additional evidence'},
  inventory_script_sha256:sha(fs.readFileSync(__filename))
};
writeJSON('module_inventory.json',{summary,modules});
writeJSON('source_block_inventory.json',{baseline_commit:COMMIT,source_hash_algorithm:'SHA-256 over the decoded final block.src UTF-8 bytes, without normalization',blocks});
writeJSON('coverage_inventory.json',{baseline_commit:COMMIT,rows:coverageRows});
writeJSON('source_corpus_inventory.json',{baseline_commit:COMMIT,sources:sourceCorpus});
writeJSON('named_context_inventory.json',{baseline_commit:COMMIT,rows:namedItems});
writeJSON('individual_named_context_inventory.json',{baseline_commit:COMMIT,entities:individualNamed});
writeJSON('source_repetition_inventory.json',{baseline_commit:COMMIT,repetitions});
writeJSON('module_inventory_summary.json',summary);
writeJSON('module_descriptor_checks.json',{baseline_commit:COMMIT,checks,page_descriptors:pageDescriptors});
writeCSV('module_inventory.csv',modules,['id','name','group','page','block_count','source_line_count','default_frame_count','teaching_interaction_observation','site_week_label','coverage_declared_weeks','block_provenance_week_claims','proposed_week_alignment','content_relevance_status','registration_url','fields','relevance_assessment','required_action','related_findings','review_depth']);
writeCSV('source_block_inventory.csv',blocks,['block_id','module_id','module_name','module_group','page','block_index_zero_based','title','declared_source_category','declared_pseudocode','declared_language','displayed_language_inference','source_locator_text','source_locator_weeks','declared_source_term','source_line_count','source_utf8_bytes','source_sha256','exact_source_constant_origins','site_week_label','coverage_declared_weeks','proposed_module_primary_weeks','teaching_role','proposed_block_concept_weeks','week_mapping_evidence_level','relevance_assessment','required_action','related_findings','review_depth']);
writeCSV('coverage_inventory.csv',coverageRows,['coverage_row','area','item','declared_mode','destinations','declared_source','declared_weeks','locator','destination_delivery','proposed_topic_weeks','week_mapping_evidence_level','relevance_assessment','required_action','related_findings','review_depth']);
writeCSV('source_corpus_inventory.csv',sourceCorpus,['source_row','declared_label','declared_filename','declared_topic','declared_weeks','declared_term','original_file_present_in_repository','authority_status','locator','proposed_topic_weeks','week_mapping_evidence_level','relevance_assessment','required_action','related_findings','review_depth']);
writeCSV('named_context_inventory.csv',namedItems,['named_row','item_group','displayed_status','matching_coverage_rows','module_id','module_week_label','relevance_status','locator','proposed_topic_weeks','week_mapping_evidence_level','relevance_assessment','required_action','review_depth']);
writeCSV('individual_named_context_inventory.csv',individualNamed,['name','entity_type','declared_status','proposed_topic_weeks','present_in_destination_source','source_block_id','source_locator','coverage_locator','week_mapping_evidence_level','relevance_assessment','required_action','related_findings','review_depth']);
console.log(JSON.stringify(summary,null,2));
