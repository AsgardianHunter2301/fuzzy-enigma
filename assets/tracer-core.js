/* ---------- multi-page page descriptor ----------
   Each page declares the topic groups it owns. Declared first so that build
   metadata, the document title and the scoping filter can all rely on it. */
const TRACER_PAGE=(window.TRACER_PAGE&&typeof window.TRACER_PAGE==='object')
  ? window.TRACER_PAGE
  : {id:'all',file:'',title:'COMP2521 Tracer',groups:null};


"use strict";

/* ============================================================
   COMP2521 Tracer  -  generated runtime core
   Source hierarchy:
   1. Exact 26T2 manual C and pseudocode (authoritative for manual implementations).
   2. Supplied 25T3 lecture material for syllabus content absent from the manual.
   3. Explicit MEMORISE study bridges where both sources omit complete C.
   Supplemental code is never labelled as manual or lecture source.
   ============================================================ */

const BUILD_META=Object.freeze({...window.TRACER_BUILD});
if(!BUILD_META.version)throw new Error('COMP2521 Tracer build metadata must load before tracer.js');
const APP_VERSION=BUILD_META.version;
const APP_STATUS=BUILD_META.status;

/** Return the first element matching a selector within an optional root. */
function queryOne(selector,root=document){return root.querySelector(selector);}
/** Create an element with an optional class name and text content. */
function createElement(tagName,className,textContent){const node=document.createElement(tagName);if(className)node.className=className;if(textContent!=null)node.textContent=textContent;return node;}
/** Escape text before inserting it into an HTML string. */
function escapeHtml(value){return String(value).replace(/[&<>]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));}

/* ---------- stateful C syntax highlighting (display only) ---------- */
const C_TYPE_WORDS=new Set(['void','int','bool','char','unsigned','signed','short','long','float','double','struct','const','static','inline','size_t','uint32_t']);
const C_KEYWORDS=new Set(['if','else','while','for','do','switch','case','default','return','break','continue','typedef','enum','union','true','false','NULL','sizeof','malloc','calloc','realloc','free','exit','fprintf','printf','assert','Input','Output']);

/**
 * Create a line-oriented C lexer. The retained block-comment state allows
 * source blocks to contain multi-line comments without corrupting later lines.
 * It is intentionally a display lexer, not a compiler or formatter.
 */
/* Recommendation 12: colour preprocessor directives. Display only; the
   source string itself is never altered. */
function createCHighlighter(){
  let inBlockComment=false;
  const span=(className,text)=>`<span class="${className}">${escapeHtml(text)}</span>`;
  const numberPattern=/^(?:0[xX][0-9A-Fa-f]+|0[bB][01]+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(?:[uUlLfF]+)?/;
  function highlightLine(line){
    let output='',index=0;
    /* A preprocessor directive owns its whole line once code has begun.
       The directive keyword is marked; any trailing comment still highlights. */
    if(!inBlockComment){
      const directive=/^(\s*)(#\s*[a-z]+)/.exec(line);
      if(directive){
        output+=directive[1]+span('pp',directive[2]);
        index=directive[0].length;
      }
    }
    while(index<line.length){
      if(inBlockComment){
        const end=line.indexOf('*/',index);
        if(end<0){output+=span('cm',line.slice(index));return output;}
        output+=span('cm',line.slice(index,end+2));index=end+2;inBlockComment=false;continue;
      }
      if(line.startsWith('//',index)){output+=span('cm',line.slice(index));break;}
      if(line.startsWith('/*',index)){
        const end=line.indexOf('*/',index+2);
        if(end<0){output+=span('cm',line.slice(index));inBlockComment=true;break;}
        output+=span('cm',line.slice(index,end+2));index=end+2;continue;
      }
      const char=line[index];
      if(char==='"'||char==="'"){
        const quote=char;let end=index+1;
        while(end<line.length){if(line[end]==='\\'){end+=2;continue;}if(line[end]===quote){end++;break;}end++;}
        output+=span('str',line.slice(index,end));index=end;continue;
      }
      const tail=line.slice(index);
      const number=tail.match(numberPattern);
      if(number){output+=span('num',number[0]);index+=number[0].length;continue;}
      const identifier=tail.match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if(identifier){
        const word=identifier[0];let className='';
        if(C_TYPE_WORDS.has(word))className='ty';
        else if(C_KEYWORDS.has(word))className='kw';
        else{let look=index+word.length;while(look<line.length&&/\s/.test(line[look]))look++;if(line[look]==='(')className='fn';}
        output+=className?span(className,word):escapeHtml(word);index+=word.length;continue;
      }
      output+=escapeHtml(char);index++;
    }
    return output;
  }
  return Object.freeze({highlightLine,reset(){inBlockComment=false;}});
}

/**
 * Resolve named source lines by substring.
 * @param {string} code Source text split into display lines.
 * @param {Object<string,string|[string,number]>} map Named search specifications.
 * @returns {Object<string,number>} One-based line numbers, or zero when absent.
 */
const TRACER_UNRESOLVED_SOURCE_LINES=[];
function lines(code, map){
  const arr = code.split('\n'), out = {};
  for(const k in map){
    const spec = map[k];
    const needle = Array.isArray(spec)?spec[0]:spec;
    const nth = Array.isArray(spec)?spec[1]:1;
    let seen = 0, found = 0;
    for(let i=0;i<arr.length;i++){
      if(arr[i].includes(needle)){ seen++; if(seen===nth){ found=i+1; break; } }
    }
    if(!found){
      /* AUD-05: an unresolved name must be reported explicitly rather than
         silently becoming line 0 and highlighting nothing (or, worse, being
         paired with the wrong block). The miss is recorded so an assurance
         gate can fail on it instead of it only appearing in a console warning
         that nobody reads. */
      TRACER_UNRESOLVED_SOURCE_LINES.push({key:k,needle:String(needle),occurrence:nth});
      console.warn('line not found for',k,needle);
    }
    out[k]=found;
  }
  /* Tag the table with the exact source text it was resolved against, so a
     (block, line) pair can later be validated by SOURCE IDENTITY rather than
     by a numeric index that silently drifts when blocks are reordered. */
  Object.defineProperty(out,'__src',{value:code,enumerable:false,writable:false});
  return out;
}

/**
 * Resolve a (block, line) pair by source identity.
 *
 * AUD-05: bfs highlighted `free(g)` in the Graph implementation when the
 * trace note said `QueueFree(Q)`, because the step used block index 1 while
 * the line number came from a table built over the Queue source. Numeric
 * indices cannot express that relationship, so this helper derives the index
 * from the source the line table was actually built from, and refuses to
 * return an unresolved pair.
 *
 * @param {Array} blocks  The module's blocks array.
 * @param {Object} table  A table returned by lines(), carrying __src.
 * @param {string} key    The named statement within that table.
 * @returns {[number,number]} A validated [blockIndex, lineNumber] pair.
 */
function srcLine(blocks,table,key){
  if(!Array.isArray(blocks))throw new Error('srcLine: blocks array is required');
  if(!table||typeof table!=='object')throw new Error('srcLine: a lines() table is required');
  const code=table.__src;
  if(typeof code!=='string')throw new Error('srcLine: line table has no recorded source');
  const index=blocks.findIndex(b=>b&&b.src===code);
  if(index<0)throw new Error('srcLine: the line table\'s source is not one of this module\'s blocks');
  const line=table[key];
  if(!line)throw new Error(`srcLine: statement "${key}" could not be resolved in that source`);
  return [index,line];
}

/* ---------- shared input-validation error ----------
   Defined here (the first-loaded core script) so that every later layer -
   modules, corpus generators, the UI, the router and programmatic test entry
   points - raises and recognises exactly one error type with a stable field
   key. Previously this class was declared in corpus-shared.js, which loads
   after the module files that throw it. */
class InputValidationError extends Error{
  constructor(message,fieldKey=null){super(message);this.name='InputValidationError';this.fieldKey=fieldKey;}
}

/* ---------- capture-time trace snapshots (AUD-01) ----------
   Trace.step previously stored the caller's `view` object by reference and
   shallow-copied `vars`/`map`. Generators legitimately mutate the live data
   structure they are tracing (for example Warshall's `tc` matrix, or a
   graph's adjacency rows), so every stored frame observed the *final* state
   of any nested array it referenced. Deep-cloning after generation - as
   corpus-shared.js did via decorateGraphTrace - is too late: by then all
   frames already share the finished arrays, so cloning only duplicates the
   final state.

   snapshotTraceData takes an independent copy at the moment of the step.
   It deliberately does not use a JSON round-trip: the trace model carries
   numeric sentinels (Infinity for unreachable distances, -Infinity, and NaN
   where a module is demonstrating an invalid value) which JSON converts to
   null. Dates, Maps, Sets and typed arrays are preserved structurally; an
   unexpected non-plain object is returned by reference rather than being
   silently flattened, and a reference cycle resolves to the already-copied
   node instead of recursing forever. */
const TRACE_SNAPSHOT_MAX_DEPTH=64;
function snapshotTraceData(value,seen,depth){
  if(value===null||typeof value!=='object')return value;           /* primitives, incl. NaN/Infinity */
  if(typeof depth!=='number')depth=0;
  if(depth>=TRACE_SNAPSHOT_MAX_DEPTH)return value;
  if(!seen)seen=new Map();
  const hit=seen.get(value);
  if(hit!==undefined)return hit;                                    /* cycle / shared node */
  if(Array.isArray(value)){
    const out=new Array(value.length);
    seen.set(value,out);
    for(let i=0;i<value.length;i++)out[i]=snapshotTraceData(value[i],seen,depth+1);
    return out;
  }
  if(value instanceof Date){const d=new Date(value.getTime());seen.set(value,d);return d;}
  if(value instanceof Map){
    const m=new Map();seen.set(value,m);
    value.forEach((v,k)=>m.set(snapshotTraceData(k,seen,depth+1),snapshotTraceData(v,seen,depth+1)));
    return m;
  }
  if(value instanceof Set){
    const st=new Set();seen.set(value,st);
    value.forEach(v=>st.add(snapshotTraceData(v,seen,depth+1)));
    return st;
  }
  if(ArrayBuffer.isView(value)&&typeof value.slice==='function'){const t=value.slice();seen.set(value,t);return t;}
  const proto=Object.getPrototypeOf(value);
  if(proto!==Object.prototype&&proto!==null)return value;           /* class instance: keep identity */
  const copy={};
  seen.set(value,copy);
  for(const k of Object.keys(value))copy[k]=snapshotTraceData(value[k],seen,depth+1);
  return copy;
}

/* ============================================================
   SHARED INPUT CONTRACT  (AUD-02, AUD-03, AUD-07)
   ------------------------------------------------------------
   One pure parse/validate layer used by every entry path: the visible
   inputs, the explicit Run button, fragment routing, saved recipes,
   restored UI state and programmatic/test entry. It performs NO trace
   generation, NO DOM access and NO expensive search, so it is safe to call
   on every keystroke - which is what replaced the previous live-validation
   design that executed the module's full run() on a 450 ms debounce.

   Declared domains
   ----------------
   int      A complete signed decimal integer token, /^[+-]?\d+$/, inside
            JavaScript's safe-integer range, optionally narrowed by the
            field's own min/max. This is deliberately the SAME grammar that
            parseInts already enforced for integer lists, so a scalar and a
            list field accept exactly the same tokens. It rejects "abc",
            "", "   ", "1.5", "1e3", "0x10", "NaN", "Infinity", "--5" and
            "3abc" - all of which Number() previously accepted or turned
            into NaN. Blank is NOT reinterpreted as zero.
   intlist  Whitespace/comma separated int tokens; blank means the empty
            list, which is a documented and useful boundary case (an empty
            array is sorted). Length is capped by intListMaxLength.
   graph    An edge list parsed by parseGraph, which owns the edge grammar,
            vertex range, self-loop and duplicate-edge contract. Fractional
            edge weights remain accepted: the integer rules above are NOT
            applied to weights.
   ops      A command sequence; arity and command names are checked by the
            owning module, with a cap on the number of operations.
   text     Free text with a length cap (for example trie keys).
   select   Must be exactly one of the declared options.

   Workload bounds
   ---------------
   Field min/max are enforced here, for every entry path. Previously they
   were only emitted as HTML min/max attributes, which are UI hints a
   browser does not enforce for typed or programmatic values, so "1e3"
   produced nV=1000 on eleven modules and hamilton accepted nV=8.
   Measured justification for the constants below is in
   docs/REMEDIATION_LIMITS.md. ============================================ */
const TRACER_INPUT_SCHEMA_VERSION='1.0.0';
const TRACER_INT_TOKEN=/^[+-]?\d+$/;
const TRACER_LIMITS=Object.freeze({
  schemaVersion:TRACER_INPUT_SCHEMA_VERSION,
  intMin:-9007199254740991,
  intMax:9007199254740991,
  intDomainLabel:"JavaScript's safe-integer range",
  intListMaxLength:64,
  opsMaxCount:48,
  textMaxLength:512,
  traceFrameBudget:25000
});

/** Resolve a field descriptor's validation domain. An explicit `domain`
 *  always wins; otherwise it is inferred from the rendering type. */
function tracerFieldDomain(field){
  if(!field)return 'text';
  if(field.domain)return field.domain;
  if(field.type==='select')return 'select';
  if(field.type==='number')return 'int';
  return 'text';
}

/** Parse one complete integer token. Returns a number or throws. */
function parseIntScalar(raw,opt){
  opt=opt||{};
  const fieldKey=opt.fieldKey||null;
  const label=opt.fieldLabel||fieldKey||'value';
  const text=String(raw==null?'':raw).trim();
  if(!text)throw new InputValidationError(`${label} is required: enter a whole number. A blank field is not treated as 0.`,fieldKey);
  if(!TRACER_INT_TOKEN.test(text))throw new InputValidationError(`${label} must be one complete whole number such as 12 or -3 (got "${text}"). Decimals, exponents like 1e3, hexadecimal like 0x10, and words are not accepted.`,fieldKey);
  const n=Number(text);
  if(!Number.isSafeInteger(n))throw new InputValidationError(`${label} is outside ${TRACER_LIMITS.intDomainLabel} (got "${text}").`,fieldKey);
  const min=opt.min===undefined?TRACER_LIMITS.intMin:Number(opt.min);
  const max=opt.max===undefined?TRACER_LIMITS.intMax:Number(opt.max);
  if(n<min||n>max)throw new InputValidationError(`${label} must be from ${min} to ${max} (got ${n}).`,fieldKey);
  return n;
}

/** Pure, descriptor-driven validation of one module's raw input values.
 *  Never runs the generator. Returns
 *    {ok:true, values, workload, schemaVersion}
 *  or
 *    {ok:false, errors:[{fieldKey,message}], schemaVersion}
 *  Module-specific relationships that need more than one field (for example
 *  "src must be a vertex of this graph", or "binary search needs sorted
 *  input") stay in the module's run(), which raises the same
 *  InputValidationError type with the same stable field keys. */
function validateModuleInputs(module,raw){
  const errors=[],values={},workload={};
  if(!module||!Array.isArray(module.fields))
    return {ok:true,values:{...(raw||{})},workload,schemaVersion:TRACER_INPUT_SCHEMA_VERSION};
  for(const f of module.fields){
    const key=f.k;
    const present=raw&&Object.prototype.hasOwnProperty.call(raw,key);
    const rawValue=present?raw[key]:f.def;
    const label=f.label||key;
    const domain=tracerFieldDomain(f);
    try{
      if(domain==='select'){
        const allowed=(f.options||[]).map(o=>typeof o==='string'?o:o.value).map(String);
        const got=String(rawValue==null?'':rawValue);
        if(!allowed.includes(got))
          throw new InputValidationError(`${label} must be one of: ${allowed.join(', ')} (got "${got}").`,key);
        values[key]=got;
      }else if(domain==='int'){
        values[key]=parseIntScalar(rawValue,{fieldKey:key,fieldLabel:label,min:f.min,max:f.max});
      }else if(domain==='intlist'){
        const list=parseInts(rawValue,key,label);
        const cap=f.maxLen===undefined?TRACER_LIMITS.intListMaxLength:Number(f.maxLen);
        if(list.length>cap)
          throw new InputValidationError(`${label} accepts at most ${cap} values so the trace stays complete and usable (got ${list.length}).`,key);
        values[key]=list;workload[key]=list.length;
      }else if(domain==='graph'){
        const nvField=module.fields.find(x=>x.k==='nV');
        let nV=null;
        if(nvField){
          try{nV=parseIntScalar(raw&&Object.prototype.hasOwnProperty.call(raw,'nV')?raw.nV:nvField.def,
                {fieldKey:'nV',fieldLabel:nvField.label||'nV',min:nvField.min,max:nvField.max});}
          catch(e){nV=null;}            /* nV reports its own error below */
        }
        const text=String(rawValue==null?'':rawValue);
        if(text.length>TRACER_LIMITS.textMaxLength)
          throw new InputValidationError(`${label} is limited to ${TRACER_LIMITS.textMaxLength} characters.`,key);
        let directed=!!f.directed;
        if(f.directedFrom){                               /* directedness comes from a select */
          const selField=module.fields.find(x=>x.k===f.directedFrom);
          const selRaw=raw&&Object.prototype.hasOwnProperty.call(raw,f.directedFrom)
            ? raw[f.directedFrom] : (selField?selField.def:'');
          directed=String(selRaw)==='directed';
        }
        if(nV!==null&&typeof parseGraph==='function'){
          const G=parseGraph(text,nV,directed,key);        /* pure; also enforces the edge contract */
          values[key]=text;workload[key]=G.edges.length;workload.nV=nV;
        }else values[key]=text;
      }else if(domain==='ops'){
        const text=String(rawValue==null?'':rawValue);
        if(text.length>TRACER_LIMITS.textMaxLength)
          throw new InputValidationError(`${label} is limited to ${TRACER_LIMITS.textMaxLength} characters.`,key);
        const count=text.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean).length;
        const cap=f.maxOps===undefined?TRACER_LIMITS.opsMaxCount:Number(f.maxOps);
        if(count>cap)throw new InputValidationError(`${label} accepts at most ${cap} operations (got ${count}).`,key);
        values[key]=text;workload[key]=count;
      }else{
        const text=String(rawValue==null?'':rawValue);
        const cap=f.maxLen===undefined?TRACER_LIMITS.textMaxLength:Number(f.maxLen);
        if(text.length>cap)throw new InputValidationError(`${label} is limited to ${cap} characters (got ${text.length}).`,key);
        values[key]=text;
      }
    }catch(error){
      if(error&&error.name==='InputValidationError')
        errors.push({fieldKey:error.fieldKey===undefined?key:error.fieldKey,message:String(error.message)});
      else errors.push({fieldKey:key,message:String(error&&error.message||error)});
    }
  }
  return errors.length
    ? {ok:false,errors,schemaVersion:TRACER_INPUT_SCHEMA_VERSION}
    : {ok:true,values,workload,schemaVersion:TRACER_INPUT_SCHEMA_VERSION};
}

/** Convenience wrapper: validate and throw the first error, so a module or
 *  a programmatic caller cannot bypass the shared contract. */
function assertModuleInputs(module,raw){
  const r=validateModuleInputs(module,raw);
  if(!r.ok){const first=r.errors[0];throw new InputValidationError(first.message,first.fieldKey);}
  return r;
}

/* ---------- trace builder ---------- */
/** Build immutable snapshots used by the visual trace player. */
class Trace{
  constructor(){ this.f=[]; this.vars={}; this.heap=[]; this._id=0; this._ev=[]; this._fresh=[]; }
  v(o){ Object.assign(this.vars,o); return this; }
  drop(...ks){ ks.forEach(k=>delete this.vars[k]); return this; }
  /** Record an allocation and return its trace-local block id.
   *
   *  NEW-01: `opt.conceptual` marks a pseudocode value that is not a real C
   *  allocation. Previously the only caller tried to set this by writing to
   *  alloc()'s RETURN VALUE - but alloc returns the numeric block id, so
   *  `if(block&&typeof block==='object')block.conceptual=true` could never be
   *  true and the flag was never set on any block. The memory ledger happened
   *  to still classify those blocks correctly, because it falls back to
   *  matching /pseudocode|conceptual/ against the block's `source` string, so
   *  the dead assignment was invisible. The flag is now settable for real, and
   *  the ledger's string fallback remains for blocks that only declare
   *  provenance. */
  alloc(fn,label,size,source,opt){
    const b={id:++this._id,label,size,live:true,source:source||'manual'};
    if(opt&&opt.conceptual)b.conceptual=true;
    this.heap.push(b); this._ev.push({t:'a',fn,label,size,source:b.source}); this._fresh.push(b.id); return b.id;
  }
  /** Record a size change while preserving the prior size in the event. */
  realloc(id,label,size){
    const b=this.heap.find(x=>x.id===id);
    const oldSize=b?b.size:null;
    if(b){ b.label=label||b.label; b.size=size; }
    this._ev.push({t:'r',fn:'realloc',label:b?b.label:(label||'?'),oldSize,size});
    if(b) this._fresh.push(b.id);
    return id;
  }
  free(id){
    const b=this.heap.find(x=>x.id===id);
    if(b && b.live) b.live=false;
    this._ev.push({t:'f',label:b?b.label:'?'}); return this;
  }
  release(id){
    const b=this.heap.find(x=>x.id===id);
    if(b && b.live) b.live=false;
    this._ev.push({t:'x',label:b?b.label:'?'}); return this;
  }
  /**
   * Capture one real algorithm step with source, state and memory data.
   *
   * AUD-01: `view`, `vars` and `map` are snapshotted here, at capture time,
   * so a later mutation of the live structure the generator is tracing can
   * never change an already-recorded frame. `heap` and `ev` entries are flat
   * records and are copied per element. The frame is then frozen shallowly so
   * that rendering or decoration cannot reassign its fields in place.
   */
  step(line,note,view,opt){
    opt=opt||{};
    /* AUD-03 backstop: refuse to keep allocating an unbounded frame array.
       Input bounds are the primary control; this guard catches any path that
       still reaches an excessive trace, and fails loudly rather than letting
       the tab exhaust memory. The budget sits well above the largest
       legitimate trace measured on this corpus (hamilton nV=7 exhaustive
       negative, 5,873 frames) and below the 41,102-frame case that AUD-03
       recorded at 272 MB RSS. */
    if(this.f.length>=TRACER_LIMITS.traceFrameBudget)
      throw new InputValidationError(`This input needs more than ${TRACER_LIMITS.traceFrameBudget} trace steps, which cannot be displayed as a complete trace. Reduce the input size.`,null);
    this.f.push({
      line, note,
      view: snapshotTraceData(view),
      pline: opt.pline||0,
      map: opt.map?snapshotTraceData(opt.map):null,
      vars: snapshotTraceData(this.vars),
      heap: this.heap.map(b=>({...b})),
      ev: this._ev.map(e=>({...e})), fresh: this._fresh.slice()
    });
    this._ev=[]; this._fresh=[];
    return this;
  }
}

/* ---------- shared view helpers ---------- */
const arrayRow = (label,a,cls,ptr)=>({label,a:a.slice(),cls:cls||{},ptr:ptr||{}});
const arrView = (...rows)=>({kind:'array',rows:rows.filter(Boolean)});
