/* AUD-14 successor gate: the C shown to the learner must be the C that is
   actually compiled and sanitizer-tested.

   Why this is a NEW harness rather than the audited one
   -----------------------------------------------------
   reproduce/curriculum/compare_displayed_c.cjs is preserved unchanged, but it
   cannot judge a successor: it loads the displayed side from a frozen
   source_block_inventory.json captured at the audited commit, so after the
   .c files change it compares baseline-displayed against current-compiled and
   reports 0/11 regardless of whether the tree is consistent. This gate reads
   BOTH sides live from the tree under test.

   The displayed side is read by EVALUATING assets/corpus-source-data.js, not
   by scraping its text: the constants are template literals in which a C
   string's "\n" is written "\\n", so raw text would never equal the .c file.

   Token comparison is adapted from the audited tokenizer: comments and
   whitespace are excluded, quoted bytes, identifier spelling, numbers and
   operators are preserved, and no macro expansion is performed. It
   establishes token identity - not compilation, which the C suites cover. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
process.env.DSA_REPO_ROOT=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const ROOT=process.env.DSA_REPO_ROOT;
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');

function tokenize(src){
  const tokens=[];let i=0;
  while(i<src.length){
    if(/\s/.test(src[i])){i++;continue;}
    if(src.startsWith('//',i)){const e=src.indexOf('\n',i+2);i=e<0?src.length:e;continue;}
    if(src.startsWith('/*',i)){const e=src.indexOf('*/',i+2);if(e<0)throw new Error('Unclosed comment');i=e+2;continue;}
    const rest=src.slice(i);
    const q=rest.match(/^(?:u8|[uUL])?(?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')/);
    if(q){tokens.push(q[0]);i+=q[0].length;continue;}
    const id=rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if(id){tokens.push(id[0]);i+=id[0].length;continue;}
    const num=rest.match(/^(?:0[xX][\da-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)[uUlLfF]*/);
    if(num){tokens.push(num[0]);i+=num[0].length;continue;}
    const op=rest.match(/^(?:>>=|<<=|\.\.\.|->|\+\+|--|<<|>>|<=|>=|==|!=|&&|\|\||\+=|-=|\*=|\/=|%=|&=|\^=|\|=|##|.)/s);
    if(!op)throw new Error('Unrecognised input at '+i);
    tokens.push(op[0]);i+=op[0].length;
  }
  return tokens;
}

const SYMBOLS=['SRC_GADJLIST_MEM','SRC_GEDGEARRAY_MEM','SRC_GADJLIST_DU_MEM','SRC_GADJLIST_UW_MEM',
  'SRC_GADJLIST_DW_MEM','SRC_GEDGEARRAY_DU_MEM','SRC_GEDGEARRAY_UW_MEM','SRC_GEDGEARRAY_DW_MEM',
  'SRC_GMATRIX_DU_MEM','SRC_GMATRIX_UW_MEM','SRC_GMATRIX_DW_MEM'];

/* Evaluate the real application load order and harvest the constants' values.
   corpus-source-data.js depends on lines() from tracer-core.js, so it cannot
   be evaluated on its own; the audited loader establishes the same order the
   HTML pages use. */
const LOADER=process.env.DSA_LOADER||'/home/claude/work/replay/reproduce/algorithm/load_modules.cjs';
const {context}=require(LOADER).load();
vm.runInContext('globalThis.__displayed='+JSON.stringify(SYMBOLS)+
  '.reduce((o,s)=>{try{o[s]=eval(s);}catch(e){o[s]=null;}return o;},{});',context,{timeout:15000});
const displayed=context.__displayed;

const standalone=fs.readdirSync(path.join(ROOT,'memorise_graph_c')).filter(f=>f.endsWith('.c')).sort()
  .map(name=>{const src=fs.readFileSync(path.join(ROOT,'memorise_graph_c',name),'utf8');
    const toks=tokenize(src);return {name,tokenSha:hash(JSON.stringify(toks)),tokenCount:toks.length};});

let pass=0,fail=0;const results=[];
function chk(name,cond,detail){
  cond?pass++:fail++;results.push({name,ok:!!cond,detail:cond?undefined:String(detail).slice(0,240)});
  console.log('  '+(cond?'PASS':'FAIL')+'  '+name+(cond?'':'   <- '+String(detail).slice(0,200)));
}
chk('all 11 displayed implementations were found and evaluated',
    SYMBOLS.every(s=>typeof displayed[s]==='string'&&displayed[s].length>100),
    SYMBOLS.filter(s=>typeof displayed[s]!=='string'));
chk('exactly 11 standalone .c files are present',standalone.length===11,standalone.length);

const used=new Set();
for(const sym of SYMBOLS){
  const text=displayed[sym];
  if(typeof text!=='string'){chk('token parity: '+sym,false,'constant not evaluated');continue;}
  let toks;try{toks=tokenize(text);}catch(e){chk('token parity: '+sym,false,'tokenize failed: '+e.message);continue;}
  const sha=hash(JSON.stringify(toks));
  const matches=standalone.filter(c=>c.tokenSha===sha);
  chk('token parity: '+sym,matches.length===1,
      matches.length===0?('no standalone counterpart; displayed has '+toks.length+' tokens')
                        :('ambiguous: '+matches.map(m=>m.name).join(', ')));
  if(matches.length===1)used.add(matches[0].name);
}
chk('each of the 11 .c files is matched exactly once',used.size===11,used.size+' distinct files matched');

/* The displayed copy intentionally carries its own provenance header, so byte
   equality is NOT expected and is not asserted - only that a header exists. */
let headed=0;
for(const sym of SYMBOLS){const t=displayed[sym];if(typeof t==='string'&&t.trimStart().startsWith('/*'))headed++;}
chk('every displayed copy retains its own provenance header',headed===11,headed+'/11');
chk('no displayed copy still claims assertion-based preconditions',
    SYMBOLS.every(s=>typeof displayed[s]!=='string'||!/\bassert\s*\(/.test(displayed[s])),
    SYMBOLS.filter(s=>typeof displayed[s]==='string'&&/\bassert\s*\(/.test(displayed[s])));

console.log('\n  AUD-14 displayed/compiled parity assertions: passed='+pass+' failed='+fail);
if(process.env.DSA_JSON_OUT)fs.writeFileSync(process.env.DSA_JSON_OUT,JSON.stringify({suite:'displayed_c_parity',passed:pass,failed:fail,results},null,1));
process.exitCode=fail?1:0;
