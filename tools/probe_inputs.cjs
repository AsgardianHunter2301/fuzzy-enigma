/* Malformed-input sweep across every module field.
   Runs ONE module per invocation (parent drives subprocesses with a timeout)
   so that an unbounded-workload field cannot hang the whole sweep. */
const path=require('node:path');
const LOADER=process.env.DSA_LOADER||path.join(__dirname,'..','replay','reproduce','algorithm','load_modules.cjs');
const {load}=require(LOADER);
const {api}=load();
const target=process.argv[2];
const m=api.module(target);
if(!m){console.log(JSON.stringify({id:target,error:'unknown module'}));process.exit(0);}

/* Probe values. "huge" is applied only to fields that are not size-like,
   because a size-like field is a workload bound, tested separately. */
const PROBES=['abc','','   ','1.5','1e3','NaN','Infinity','-0','0x10','1 2','+3','--5','3abc'];
const SIZEISH=/^(n|nV|max|size|len|m|R|k)$/i;
const HUGE='99999999999999999999';

function classify(fn){
  try{
    const tr=fn();
    if(!tr||!Array.isArray(tr.f))return {outcome:'no-trace'};
    const last=tr.f[tr.f.length-1]||{};
    const notes=tr.f.map(f=>String(f.note||'')).join(' ');
    return {
      outcome:'trace',
      frames:tr.f.length,
      finalNote:String(last.note||'').slice(0,220),
      mentionsNaN:/NaN/.test(notes),
      mentionsUndefined:/undefined/.test(notes),
      stopped:/Trace stopped|could not be traced/i.test(notes),
    };
  }catch(e){
    return {outcome:e&&e.name==='InputValidationError'?'rejected':'threw',
            errName:e&&e.name,errMsg:String(e&&e.message||e).slice(0,200),
            fieldKey:e&&e.fieldKey!==undefined?e.fieldKey:null};
  }
}

const out={id:m.id,name:m.name,fields:[]};
for(const f of (m.fields||[])){
  if(f.type==='select')continue;                 /* enumerated separately */
  const rec={k:f.k,type:f.type||'text',def:String(f.def??''),min:f.min,max:f.max,probes:{}};
  const vals=PROBES.slice();
  if(!SIZEISH.test(f.k))vals.push(HUGE);
  for(const v of vals) rec.probes[JSON.stringify(v)]=classify(()=>api.run(m.id,{[f.k]:v}));
  out.fields.push(rec);
}
console.log(JSON.stringify(out));
