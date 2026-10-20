#!/usr/bin/env node
/* Gate for the per-topic theory register (assets/corpus-theory.js).

   The register is prose, so nothing else can check it. These rules encode the
   decisions that were made about it rather than taste:

   COVERAGE      every registered module has an entry, and every entry names a
                 real module. A topic with no theory is the gap this work
                 exists to close.
   SHAPE         each entry carries the parts the panel renders, in usable
                 quantity. An entry with an empty traps list renders a heading
                 over nothing.
   INVARIANT-FIRST  coreInvariant must state WHY, not list steps. It is the
                 part that makes a half-remembered procedure recoverable, and
                 it is the one block the panel opens by default.
   PROVENANCE    theory is tracer-authored. An entry may NOT attribute itself
                 to the manual or the lectures: the app has a provenance system
                 for source blocks, and prose that says "the manual states"
                 would claim a parity that the 21 absent course documents make
                 uncheckable.
   NO QUESTIONS  no practice questions, model answers or quizzes. That was an
                 explicit instruction, and this keeps it from drifting back in.
   COST PHRASING  costs are stated as operation counts ("makes about n log n
                 comparisons"), not in Omega/Theta notation.
   LINKS         every seeAlso id and every convention key resolves.
   PLAIN TEXT    entries carry no markup; the panel escapes everything and
                 `backticks` are the only thing that becomes an element.
*/
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const MODULES=process.env.DSA_MODULE_GROUPS||'/home/claude/work/artifacts/module_groups.json';

/* corpus-theory.js defines the register and the registration function; the
   corpus-theory-*.js area files fill it. They are loaded in the same order the
   pages load them, so a duplicate id throws here exactly as it would in the
   browser. */
const w={};
new Function('window',fs.readFileSync(path.join(ROOT,'assets/corpus-theory.js'),'utf8'))(w);
for(const area of ['foundations','adts','trees','graphs']){
  const f=path.join(ROOT,'assets/corpus-theory-'+area+'.js');
  if(fs.existsSync(f)) new Function('window',fs.readFileSync(f,'utf8'))(w);
}
const THEORY=w.COMP2521_THEORY||{};
const CONVENTIONS=w.COMP2521_COURSE_CONVENTIONS||{};

if(!fs.existsSync(MODULES)){
  console.error('module list missing: '+MODULES+'\nrun the inventory step first');
  process.exit(2);
}
const modules=JSON.parse(fs.readFileSync(MODULES,'utf8'));
const moduleIds=new Set(modules.map(m=>m.id));

let checks=0,failures=0;const problems=[];
const check=(cond,kind,id,detail)=>{checks++;if(!cond){failures++;problems.push(`${kind}  ${id}  ${detail}`);}};

/* ---- coverage ---- */
const missing=[...moduleIds].filter(id=>!Object.prototype.hasOwnProperty.call(THEORY,id)).sort();
check(missing.length===0,'COVERAGE','-',
  `${missing.length} of ${moduleIds.size} modules have no theory entry: ${missing.slice(0,12).join(' ')}${missing.length>12?' …':''}`);
for(const id of Object.keys(THEORY))
  check(moduleIds.has(id),'UNKNOWN-MODULE',id,'theory entry for a module that does not exist');

/* ---- per entry ---- */
const ATTRIBUTION=/\b(the manual (says|states|gives|shows|defines)|per the manual|according to the manual|the lecture (says|states|slides? say)|as the course document)/i;
const QUESTIONS=/\b(practice question|exercise \d|try this|quiz|model answer|worked solution|answer:|Q\d[.:])/i;
const GREEK=/[ΩΘ]|\bOmega\(|\bTheta\(/;
const MARKUP=/<\/?[a-z][^>]*>/i;

const textOf=v=>typeof v==='string'?v:'';
for(const [id,e] of Object.entries(THEORY)){
  const whole=JSON.stringify(e);

  check(textOf(e.coreInvariant).length>=120,'SHAPE',id,
    `coreInvariant is ${textOf(e.coreInvariant).length} chars; it must actually explain why the algorithm is correct`);
  /* A causal connective is the cheap proxy for "this explains WHY". The first
     version of this list was too narrow - it accepted "so the" but rejected
     "so a lookup must", "it is why" and "makes that possible", all of which
     are plainly causal - so it failed a correct entry. */
  check(/\b(because|so that|so [a-z]+ (must|can|cannot|is|are)|which is (why|what)|it is why|therefore|forces|ensures|guarantee|means that|makes (that|it) )/i
        .test(textOf(e.coreInvariant)),
    'INVARIANT-FIRST',id,'coreInvariant reads as steps, not as a reason the algorithm is correct');
  check(textOf(e.mechanism).length>=80,'SHAPE',id,'mechanism is missing or too thin to explain how the invariant is maintained');

  check(Array.isArray(e.criticalInvariants)&&e.criticalInvariants.length>=2,'SHAPE',id,
    'needs at least two critical invariants');
  for(const c of (e.criticalInvariants||[]))
    check(textOf(c.rule)&&textOf(c.because).length>=40,'SHAPE',id,
      'each critical invariant needs a rule AND a substantive reason');

  check(Array.isArray(e.examTraps)&&e.examTraps.length>=2,'SHAPE',id,'needs at least two traps');
  for(const t of (e.examTraps||[]))
    check(textOf(t.trap)&&textOf(t.instead).length>=25,'SHAPE',id,
      'each trap needs the mistake AND what to do instead');

  check(e.recognition&&Array.isArray(e.recognition.stateVariables)&&e.recognition.stateVariables.length>=2,
    'SHAPE',id,'recognition must name the state variables a trace carries');
  check(textOf(e.recognition&&e.recognition.tell).length>=60,'SHAPE',id,
    'recognition needs a tell that distinguishes this algorithm from its neighbours');

  check(Array.isArray(e.complexity)&&e.complexity.length>=2,'SHAPE',id,'needs at least two cost rows');
  for(const row of (e.complexity||[]))
    check(textOf(row.case)&&textOf(row.cost)&&textOf(row.why).length>=25,'SHAPE',id,
      'each cost row needs case, cost and a reason');

  check(e.whatToDraw&&textOf(e.whatToDraw.unit)&&Array.isArray(e.whatToDraw.columns)&&e.whatToDraw.columns.length>=2,
    'SHAPE',id,'whatToDraw must give the trace unit and the columns');

  /* A substance floor, set well below the worked exemplars (which run to about
     2,500 characters of prose) and well above an entry that merely fills the
     shape. The per-field minimums above stop any ONE part being a stub; this
     stops an entry being uniformly thin, which is the failure mode when 65
     entries are written to a schema. */
  const prose=[textOf(e.coreInvariant),textOf(e.mechanism),
    ...(e.criticalInvariants||[]).map(c=>textOf(c.rule)+textOf(c.because)),
    ...(e.examTraps||[]).map(t=>textOf(t.trap)+textOf(t.instead)),
    textOf(e.recognition&&e.recognition.tell),
    ...(e.complexity||[]).map(r=>textOf(r.cost)+textOf(r.why))].join(' ');
  check(prose.length>=1200,'SUBSTANCE',id,
    `only ${prose.length} characters of explanation; the worked exemplars run to about 2,500`);

  check(Array.isArray(e.seeAlso)&&e.seeAlso.length>=1,'SHAPE',id,
    'needs at least one onward topic — the connections are part of the teaching');

  if(e.convention!==null&&e.convention!==undefined)
    check(Object.prototype.hasOwnProperty.call(CONVENTIONS,e.convention),'LINK',id,
      `convention "${e.convention}" is not in COMP2521_COURSE_CONVENTIONS`);
  for(const s of (e.seeAlso||[])){
    check(moduleIds.has(s.id),'LINK',id,`seeAlso points at "${s.id}", which is not a module`);
    check(textOf(s.why).length>=15,'SHAPE',id,`seeAlso "${s.id}" needs a reason worth following`);
    check(s.id!==id,'LINK',id,'seeAlso points at itself');
  }

  check(!ATTRIBUTION.test(whole),'PROVENANCE',id,
    'attributes its own prose to the manual or the lectures; theory here is tracer-authored');
  check(!QUESTIONS.test(whole),'NO-QUESTIONS',id,
    'contains a practice question, quiz or model answer');
  check(!GREEK.test(whole),'COST-PHRASING',id,
    'uses Omega/Theta notation; state costs as operation counts instead');
  check(!MARKUP.test(whole),'PLAIN-TEXT',id,'contains raw markup; entries are plain text plus `backticks`');
}

/* ---- conventions ---- */
for(const [key,c] of Object.entries(CONVENTIONS)){
  check(textOf(c.name)&&textOf(c.tracer).length>=60&&textOf(c.elsewhere).length>=25&&textOf(c.matters).length>=60,
    'CONVENTION',key,'needs name, what this tracer does, what is common elsewhere, and why it matters');
  check(/\bdoes not change|never changes|is the same|not change\b/i.test(textOf(c.matters)),
    'CONVENTION',key,'matters must say what the convention does NOT change, which is the point of the table');
}

/* The cross-topic tracing layer, like the conventions table, lives on exactly
   one entry. Its shape is checked because nothing else renders it, and a row
   that lost its "what it is" column would render a clue pointing at nothing. */
const TECH=w.COMP2521_TRACING_TECHNIQUE;
check(!!TECH,'TRACING','-','COMP2521_TRACING_TECHNIQUE is missing');
if(TECH){
  check(Array.isArray(TECH.preTrace)&&TECH.preTrace.length>=6,'TRACING','preTrace',
    'the pre-trace checklist needs at least six steps');
  check(Array.isArray(TECH.rules)&&TECH.rules.every(r=>r.rule&&String(r.why||'').length>=40),
    'TRACING','rules','each rule needs a substantive reason, not just the rule');
  check(TECH.tieBreaks&&Array.isArray(TECH.tieBreaks.rows)&&TECH.tieBreaks.rows.length>=4,
    'TRACING','tieBreaks','needs at least four tie-break situations');
  check(/ADVICE|not tracer behaviour/i.test(String(TECH.tieBreaks&&TECH.tieBreaks.note)),
    'TRACING','tieBreaks',
    'the tie-break note must say these are advice, not behaviours this tracer enforces');
  check(Array.isArray(TECH.selfChecks)&&TECH.selfChecks.every(c=>c.after&&c.check),
    'TRACING','selfChecks','each self-check needs both when to run it and what to check');
  check(TECH.identification&&Array.isArray(TECH.identification.rows)&&TECH.identification.rows.length>=15,
    'TRACING','identification','the identification table needs at least fifteen rows to be useful');
  for(const r of ((TECH.identification||{}).rows||[]))
    check(String(r.clue||'').length>=12&&String(r.is||'').length>=3,'TRACING','identification',
      'every row needs a clue and what it identifies');
}
const withTech=Object.keys(THEORY).filter(id=>THEORY[id].tracingTechnique===true);
check(withTech.length===1,'TRACING-INDEX','-',
  `exactly one entry must set tracingTechnique:true (found ${withTech.length}: ${withTech.join(' ')||'none'})`);

/* Exactly one entry should carry the whole conventions table, so there is a
   single place to read them and no second copy to drift. */
const withAll=Object.keys(THEORY).filter(id=>THEORY[id].allConventions===true);
check(withAll.length===1,'CONVENTION-INDEX','-',
  `exactly one entry must set allConventions:true (found ${withAll.length}: ${withAll.join(' ')||'none'})`);

const covered=Object.keys(THEORY).length;
console.log(`modules            : ${moduleIds.size}`);
console.log(`theory entries     : ${covered}  (${(covered/moduleIds.size*100).toFixed(0)}% coverage)`);
console.log(`conventions        : ${Object.keys(CONVENTIONS).length}`);
console.log(`checks             : ${checks}`);
console.log(`failures           : ${failures}`);
for(const p of problems.slice(0,25))console.log('  '+p);
if(problems.length>25)console.log(`  ... and ${problems.length-25} more`);
console.log(failures===0?'THEORY REGISTER: PASS':'THEORY REGISTER: FAIL');
process.exit(failures===0?0:1);
