mod({
  id:'hashprobe',group:'Hash tables',name:'Linear probing and double hashing',
  keywords:'linear probe double hash tombstone backshift clustering open addressing primary cluster longest run probe length',
  blocks:[
    {title:"Linear-probing lookup - lecture C",src:LEC_LINEAR_GET,source:'lecture',pages:'week08 hash tables'},
    {title:"Double-hashing insert - lecture C",src:LEC_DOUBLE,source:'lecture',pages:'week08 hash tables'},
    {title:"Deletion methods - lecture",src:LEC_PROBE_DELETE,pseudo:true,source:'lecture',pages:'week08 hash tables'},
    {title:"Backshift deletion and cluster measurement - supplemental",src:SUP_PROBE_SUPP,pseudo:true,source:'memorise',pages:'supplemental lesson'}
  ],
  note:"This is the lecture's open-addressing material, separate from the manual's required separate-chaining implementation. The table starts with 11 slots. The lecture names both deletion methods but describes backshift in only two lines, so the <b>deletion</b> field chooses which one actually runs: <b>tombstone</b> is the lecture's stated default, and <b>backshift</b> is completed in the supplemental block. Both run on the same operation sequence so they can be compared on the same work. Every run ends with the cluster measurement the lecture names but does not compute, taken from the probe counts the trace itself produced.",
  fields:[
    {k:'method',label:'method',def:'linear probing',type:'select',options:['linear probing','double hashing']},
    {k:'deletion',label:'deletion',def:'tombstone',type:'select',options:['tombstone','backshift']},
    {k:'ops',label:'operations',def:'insert 5 50, insert 20 200, insert 16 160, insert 1 10, insert 42 420, insert 15 150, get 42, delete 5, get 16, free'}
  ],
  run(inp){
    const blocks=this.blocks;
    const method=inp.method,deletion=inp.deletion,t=new Trace();
    const numSlots=11,hash2Mod=5,slots=new Array(numSlots).fill(null);
    let numItems=0;
    const ht=t.alloc('malloc','HashTable ht','sizeof(*ht)','lecture C'),
          sa=t.alloc('malloc','ht->slots','11 × sizeof(struct slot)','lecture C');
    const V=(active=-1,path=[])=>({kind:'hashopen',slots:slots.map(s=>s&&({...s})),numSlots,numItems,active,path});

    /* One stride rule for both methods: linear probing is the stride-1 case of
       the same probe sequence, which is what makes the two comparable. */
    const strideOf=k=>method==='linear probing'?1:modHash(k,hash2Mod)+1;
    /* Step number at which key k's own probe sequence reaches slot s. Unique
       because numSlots is prime (11) and every stride is 1..5, so each stride
       is coprime with the table size and one pass visits every slot. */
    const probeStep=(k,s)=>{let i=modHash(k,numSlots),inc=strideOf(k);for(let m=0;m<numSlots;m++){if(i===s)return m;i=(i+inc)%numSlots;}return numSlots;};
    /* Slot currently holding k, found exactly as HashTableGet would: stop at a
       genuinely empty slot, probe through a deleted marker. -1 when absent. */
    const findSlot=k=>{let i=modHash(k,numSlots),inc=strideOf(k);for(let m=0;m<numSlots;m++){const s=slots[i];if(!s)return -1;if(s.state!=='DEL'&&s.key===k)return i;i=(i+inc)%numSlots;}return -1;};
    const liveKeys=()=>slots.map((s,i)=>s&&s.state!=='DEL'?{i,key:s.key,value:s.value}:null).filter(Boolean);
    const tombstones=()=>slots.filter(s=>s&&s.state==='DEL').length;
    const traced=[];                       /* {cmd,key,probes} per traced operation */

    t.v({numSlots,numItems,method,deletion}).step([0,method==='linear probing'?LLPG.struct:LDH.sig],
      `Initialise an ${method} table with 11 empty slots. Deletions will use the <b>${deletion}</b> method.`,V());

    /* ---------- CAP-157: backshift deletion ---------- */
    function backshiftDelete(key,found,path){
      slots[found]=null;numItems--;
      let hole=found,moved=0,examined=0,ended=false;
      t.v({i:found,numItems,hole}).step(srcLine(blocks,LBS,'empty'),
        `Remove key ${key} from slot ${found} and leave that slot genuinely <b>EMPTY</b> — no marker is written. That is exactly what breaks any probe path that ran through slot ${found}, so the cluster behind the hole has to be repaired now.`,V(found,path));
      let j=found;
      for(let n=1;n<numSlots;n++){
        j=(j+1)%numSlots;
        const s=slots[j];
        if(!s){
          ended=true;
          t.v({j}).step(srcLine(blocks,LBS,'stop'),
            `Slot ${j} is genuinely empty, so the cluster ends here and the scan stops. ${examined} occupied slot${examined===1?'':'s'} examined, ${moved} key${moved===1?'':'s'} moved back.`,V(j,[j]));
          break;
        }
        examined++;
        const sHole=probeStep(s.key,hole),sJ=probeStep(s.key,j),shift=sHole<sJ;
        t.v({j,'key at j':s.key,'step to hole':sHole,'step to j':sJ}).step(srcLine(blocks,LBS,'test'),
          `Slot ${j} holds key ${s.key} (home slot ${modHash(s.key,numSlots)}, stride ${strideOf(s.key)}). Its probe sequence reaches the hole at slot ${hole} on step ${sHole} and reaches slot ${j} on step ${sJ}, so the hole ${shift?'does lie on its path before it':'does not lie on its path before it'} and the key ${shift?'<b>must move back</b>, or it could never be found again':'<b>stays where it is</b>'}.`,V(j,[hole,j]));
        if(shift){
          slots[hole]=s;slots[j]=null;moved++;
          t.v({hole:j}).step(srcLine(blocks,LBS,'move'),
            `Move key ${s.key} from slot ${j} into slot ${hole}; slot ${j} becomes the hole and the scan continues from there.`,V(hole,[hole,j]));
          hole=j;
        }
      }
      if(!ended)t.step(srcLine(blocks,LBS,'repeat'),
        `The scan examined every other slot without reaching an empty one, so slot ${hole} is the table's only empty slot and the cluster is the whole table.`,V(hole,[hole]));
      /* Verification sweep. For linear probing the cluster scan is complete and
         this finds nothing; for double hashing a probe path can leave the
         cluster, so any key it missed is lifted out and re-inserted. */
      let broken=liveKeys().filter(x=>findSlot(x.key)!==x.i),rounds=0,repaired=0;
      t.v({'live keys':numItems,'unreachable after scan':broken.length}).step(srcLine(blocks,LBS,'sweep'),
        `Verification sweep: look up all ${numItems} live key${numItems===1?'':'s'} and count those the cluster scan could not reach. ${broken.length===0
          ?'<b>None.</b> Every remaining key is still findable, and the table holds <b>no deleted marker</b> — that is the whole point of backshift.'
          :`<b>${broken.length}</b> (${broken.map(x=>x.key).join(', ')}) ${broken.length===1?'is':'are'} no longer reachable. With double hashing a probe path jumps across the table, so a key whose path crossed the hole need not sit in the cluster behind it; the cluster scan cannot see it. ${broken.length===1?'It is':'They are'} lifted out and re-inserted.`}`,
        V(-1,broken.map(x=>x.i)));
      while(broken.length&&rounds++<numSlots){
        for(const b of broken)slots[b.i]=null;
        for(const b of broken){
          let i=modHash(b.key,numSlots),inc=strideOf(b.key),placed=-1;
          for(let m=0;m<numSlots;m++){if(!slots[i]){placed=i;break;}i=(i+inc)%numSlots;}
          if(placed<0)break;
          slots[placed]={key:b.key,value:b.value,state:'LIVE'};repaired++;
          t.v({'re-inserted':b.key,i:placed}).step(srcLine(blocks,LBS,'sweep'),
            `Re-insert key ${b.key} along its own probe sequence; it lands at slot ${placed}.`,V(placed,[placed]));
        }
        broken=liveKeys().filter(x=>findSlot(x.key)!==x.i);
      }
      t.drop('key at j','step to hole','step to j','re-inserted','hole','j');
      if(broken.length){
        t.v({'unreachable keys':broken.length}).step(srcLine(blocks,LBS,'sweep'),
          `${broken.length} key${broken.length===1?'':'s'} (${broken.map(x=>x.key).join(', ')}) ${broken.length===1?'is':'are'} still unreachable after ${rounds} repair round${rounds===1?'':'s'}. This is reported rather than hidden: the table would need a full rehash to restore every probe path.`,V(-1,broken.map(x=>x.i)));
      }else{
        t.v({'tombstones in table':tombstones(),'keys moved':moved,'slots examined':examined,'keys re-inserted by the sweep':repaired}).step(srcLine(blocks,LBS,'cost'),
          `Backshift is finished: the cluster scan examined ${examined} occupied slot${examined===1?'':'s'} and moved ${moved} key${moved===1?'':'s'} back${repaired?`, and the verification sweep re-inserted a further ${repaired} key${repaired===1?'':'s'} whose probe path left the cluster`:''}. There ${tombstones()===1?'is':'are'} <b>${tombstones()} deleted marker${tombstones()===1?'':'s'}</b> in the table. The cost is paid now, O(cluster length), and no later lookup pays anything — unlike a tombstone, which costs one probe on every later lookup until the table is rebuilt. The price is that keys moved, so any index previously stored into the table is invalid.`,V(-1,[]));
      }
    }

    /* ---------- CAP-158: measure the clustering the lecture only names ---------- */
    function clusterReport(){
      const occ=slots.map(s=>!!s),live=liveKeys(),tombs=tombstones();
      const runs=[];
      if(occ.length&&occ.every(Boolean))runs.push({slots:occ.map((_,i)=>i)});
      else for(let s=0;s<numSlots;s++){
        if(!occ[s]||occ[(s-1+numSlots)%numSlots])continue;          /* run starts only */
        const idx=[];let k=s;while(occ[k]){idx.push(k);k=(k+1)%numSlots;}
        runs.push({slots:idx});
      }
      const longest=runs.reduce((m,r)=>Math.max(m,r.slots.length),0);
      const longestRun=runs.find(r=>r.slots.length===longest);
      const probesFor=k=>{const s=findSlot(k);return s<0?null:probeStep(k,s)+1;};
      const probes=live.map(x=>probesFor(x.key)).filter(x=>x!==null);
      const mean=probes.length?probes.reduce((a,b)=>a+b,0)/probes.length:0;
      const homes={};live.forEach(x=>{const h=modHash(x.key,numSlots);(homes[h]=homes[h]||[]).push(x);});
      const collided=Object.entries(homes).filter(([,g])=>g.length>1)
        .map(([h,g])=>[h,g.map(x=>x.key).join(', '),g.map(x=>strideOf(x.key)).join(', '),g.map(x=>x.i).join(', '),
          g.every((x,n)=>n===0||Math.abs(x.i-g[n-1].i)===1)?'adjacent':'separated']);
      const runRows=runs.length?runs.map(r=>[r.slots.join(', '),r.slots.length,r.slots.filter(i=>slots[i].state==='DEL').length])
                              :[['no occupied slot',0,0]];
      const keyRows=live.length?live.map(x=>[x.key,modHash(x.key,numSlots),strideOf(x.key),x.i,probesFor(x.key)])
                              :[['—','—','—','—','—']];
      const tracedTotal=traced.reduce((a,x)=>a+x.probes,0);
      const gets=traced.filter(x=>x.cmd==='get');
      const getTotal=gets.reduce((a,x)=>a+x.probes,0);
      const W=(sections)=>({kind:'multi',views:[{title:'table state — the longest run of occupied slots is highlighted',...V(-1,longestRun?longestRun.slots:[])},refView(...sections)]});
      const measure=refTable('Measurements of this table',['measurement','value'],[
        ['slots',numSlots],['live keys',live.length],['deleted markers',tombs],
        ['load factor (live keys / slots)',(live.length/numSlots).toFixed(2)],
        ['occupied slots (live + markers)',live.length+tombs],
        ['clusters',runs.length],['longest run of consecutive occupied slots',longest],
        ['mean probes for a successful lookup',probes.length?mean.toFixed(2):'no live keys'],
        ['probes actually used by the traced operations',`${tracedTotal} over ${traced.length} operation${traced.length===1?'':'s'}`+(traced.length?` (mean ${(tracedTotal/traced.length).toFixed(2)})`:'')],
        ['probes actually used by the traced get operations',gets.length?`${getTotal} over ${gets.length} (mean ${(getTotal/gets.length).toFixed(2)})`:'no get operation in this sequence']
      ]);
      t.v({clusters:runs.length,'longest run':longest,'mean probes':probes.length?Number(mean.toFixed(2)):0}).step(srcLine(blocks,LBS,'cdef'),
        `<b>Clusters in this table.</b> A cluster is a maximal run of consecutive occupied slots, wrapping round the end of the table; a deleted marker counts as occupied because a lookup still has to probe through it. There ${runs.length===1?'is':'are'} <b>${runs.length}</b> cluster${runs.length===1?'':'s'}, and the longest run is <b>${longest}</b> slot${longest===1?'':'s'}${longestRun?` (slot${longestRun.slots.length===1?'':'s'} ${longestRun.slots.join(', ')}, highlighted)`:''}.`,
        W([refTable('Clusters (maximal runs of consecutive occupied slots)',['slots in the run','length','of which markers'],runRows),measure]));
      t.step(srcLine(blocks,LBS,'cmean'),
        `<b>Probe length.</b> ${probes.length?`Looking up each of the ${probes.length} live key${probes.length===1?'':'s'} once costs ${probes.join(' + ')} = ${probes.reduce((a,b)=>a+b,0)} slot${probes.reduce((a,b)=>a+b,0)===1?'':'s'} probed, a mean of <b>${mean.toFixed(2)}</b>.`:'The table holds no live key, so there is no mean to report.'} The operations in this trace probed <b>${tracedTotal}</b> slot${tracedTotal===1?'':'s'} over ${traced.length} operation${traced.length===1?'':'s'}: ${traced.map(x=>`${x.cmd} ${x.key} took ${x.probes}`).join('; ')||'none'}. That is the same counting — clustering is not an abstract claim here, it is these numbers.`,
        W([refTable('Successful-lookup cost per live key',['key','home slot','stride','slot held','slots probed'],keyRows),measure]));
      const where=collided.map(r=>`home slot ${r[0]} holds keys ${r[1]} with stride${r[2].includes(',')?'s':''} ${r[2]}, now in slot${r[3].includes(',')?'s':''} ${r[3]} (${r[4]})`).join('; ');
      t.step(srcLine(blocks,LBS,method==='linear probing'?'cwhy':'cdouble'),
        method==='linear probing'
          ? `<b>Why linear probing grows a cluster.</b> Its stride is 1, so a colliding key is placed at the end of whichever run of occupied slots it lands in, and that run becomes one slot longer. Two runs separated by a single free slot merge as soon as a key fills it, so runs do not just grow, they join: that is primary clustering, and it is why the longest run here is <b>${longest}</b> and the mean lookup costs <b>${probes.length?mean.toFixed(2):'0.00'}</b> probes rather than 1.00. ${collided.length?`In this table ${where}.`:'No two live keys share a home slot in this table, so no cluster has yet grown from a collision; insert a key whose primary hash collides and watch the longest run increase by one.'} Now switch <b>method</b> to <code>double hashing</code> with the same operations and compare these two numbers.`
          : `<b>Why double hashing does not grow a primary cluster.</b> Each key's stride is <code>hash2(key, ${hash2Mod}) + 1</code>, so two keys with the same home slot take <i>different</i> second slots instead of becoming neighbours, and no single run absorbs them both. ${collided.length?`In this table ${where}.`:'No two live keys share a home slot in this table.'} The longest run is <b>${longest}</b> and the mean lookup costs <b>${probes.length?mean.toFixed(2):'0.00'}</b> probes. Run the same operations under <b>linear probing</b> and compare: the difference comes from the stride rule, not from luck. Double hashing removes primary clustering; it does not remove collisions, and it is the method for which backshift deletion needs the verification sweep above.`,
        W([refTable('Live keys that share a home slot',['home slot','keys','strides','slots held','placement'],collided.length?collided:[['none','—','—','—','—']]),measure]));
    }

    const ops=parseGraphOps(inp.ops);let alive=true;
    for(const raw of ops){
      const p=raw.split(/\s+/),cmd=p[0].toLowerCase();
      if(cmd==='free'){
        if(!alive)throw new Error('operation after free');
        clusterReport();
        for(let z=0;z<slots.length;z++)slots[z]=null;
        numItems=0;t.free(sa);t.free(ht);alive=false;
        t.v({numItems,numSlots}).step([0,LLPG.struct],'Release the slot array and hash-table structure. No open-addressing allocation remains live.',V());
        continue;
      }
      if(!alive)throw new Error('operation after free');
      const key=Number(p[1]),value=Number(p[2]);
      if(!Number.isInteger(key))throw new Error(`invalid key in ${raw}`);
      const inc=strideOf(key);
      let i=modHash(key,numSlots),path=[];
      t.v({cmd,key,i,inc,numItems}).step([method==='linear probing'?0:1,method==='linear probing'?LLPG.hash:LDH.hash],
        `Primary hash gives index ${i}${method==='double hashing'?`; secondary increment is ${inc}`:''}.`,V(i,[i]));
      if(cmd==='insert'){
        /* AUD-04: open-addressing insertion must be able to reuse a tombstone.
           The earlier version only stored a key when it reached a slot that was
           still EMPTY, so once the table held no empty slot the probe sequence
           ran to completion and reported "no available slot" even though a
           recorded DEL slot was free. The correct behaviour is: walk the probe
           sequence remembering the first DEL slot; stop early at an EMPTY slot
           (no later slot on this path can hold the key); and if the whole
           sequence is exhausted without finding the key, reuse the remembered
           DEL slot. Only a path with neither an EMPTY nor a DEL slot is full.
           numSlots is prime (11) and the double-hashing increment is 1..5, so
           every increment is coprime with the table size and one pass visits
           every slot. */
        let firstDel=-1,done=false;
        for(let j=0;j<numSlots;j++){
          path.push(i);
          t.v({j,i}).step([method==='linear probing'?0:1,method==='linear probing'?LLPG.loop:LDH.loop],`Probe slot ${i}.`,V(i,path));
          const s=slots[i];
          if(!s){
            const at=firstDel>=0?firstDel:i;
            slots[at]={key,value,state:'LIVE'};numItems++;
            t.v({i:at,numItems}).step([1,LDH.setk],`Slot ${i} is empty, so ${key} is not stored on this probe path. Store ${key}:${value} at slot ${at}${firstDel>=0?' (the first tombstone seen on this path)':''}; increment <code>numItems</code>.`,V(at,path));
            done=true;break;
          }
          if(s.state==='DEL'){
            if(firstDel<0){
              firstDel=i;
              t.v({firstDeleted:i}).step(srcLine(blocks,LPD,'tins'),`Slot ${i} holds a deleted marker, which insertion treats as empty. Remember it as the first reusable slot, but keep probing in case ${key} is already stored further along this path.`,V(i,path));
            }
          }else if(s.key===key){
            s.value=value;
            t.step([1,LDH.update],`Key exists; replace its value without changing <code>numItems</code>.`,V(i,path));
            done=true;break;
          }
          i=(i+inc)%numSlots;
          t.step([method==='linear probing'?0:1,method==='linear probing'?LLPG.inc:LDH.step],`Advance to slot ${i}.`,V(i,path));
        }
        if(!done&&firstDel>=0){
          slots[firstDel]={key,value,state:'LIVE'};numItems++;
          t.v({i:firstDel,numItems}).step([1,LDH.setk],`The probe sequence contained no empty slot and ${key} was not found on it, so the remembered tombstone at slot ${firstDel} is reused. Store ${key}:${value} there; increment <code>numItems</code>.`,V(firstDel,path));
          done=true;
        }
        if(!done)t.step([1,LDH.loop],`Every slot on the probe sequence holds a live key and none of them is ${key}, so this table is genuinely full. The supplied source shows a resize gate but does not provide a complete resize implementation here.`,V(-1,path));
        traced.push({cmd,key,probes:path.length});
      }else if(cmd==='get'){
        let found=null;
        for(let j=0;j<numSlots;j++){
          path.push(i);const s=slots[i];
          t.v({j,i}).step([0,LLPG.empty],`Probe slot ${i}: ${!s?'EMPTY':s.state==='DEL'?'DEL':s.key}.`,V(i,path));
          if(!s)break;
          if(s.state!=='DEL'&&s.key===key){found=s.value;t.step([0,LLPG.ret],`Key ${key} found with value ${found} after ${path.length} probe${path.length===1?'':'s'}.`,V(i,path));break;}
          i=(i+inc)%numSlots;
        }
        if(found===null)t.step([0,LLPG.err],`Key ${key} was not found; the lookup probed ${path.length} slot${path.length===1?'':'s'}.`,V(-1,path));
        traced.push({cmd,key,probes:path.length});
      }else if(cmd==='delete'){
        let found=-1;
        for(let j=0;j<numSlots;j++){path.push(i);const s=slots[i];if(!s)break;if(s.state!=='DEL'&&s.key===key){found=i;break;}i=(i+inc)%numSlots;}
        traced.push({cmd,key,probes:path.length});
        if(found<0){
          t.step(deletion==='backshift'?srcLine(blocks,LBS,'absent'):srcLine(blocks,LPD,'tmark'),`Key ${key} is absent after ${path.length} probe${path.length===1?'':'s'}; the table is unchanged.`,V(-1,path));
        }else if(deletion==='tombstone'){
          slots[found]={state:'DEL'};numItems--;
          t.v({i:found,numItems}).step(srcLine(blocks,LPD,'tmark'),
            `Replace key ${key} at slot ${found} with a deleted marker. Nothing moves, so the deletion costs only the ${path.length} probe${path.length===1?'':'s'} that found it.`,V(found,path));
          t.step(srcLine(blocks,LPD,'tlook'),
            `The marker counts as <b>occupied during lookup</b>, so later probes continue through slot ${found} instead of stopping there, and as <b>empty during insertion</b>, so a later insert can reuse it. The price is that every later lookup pays for this marker until the table is rebuilt. Switch <b>deletion</b> to <code>backshift</code> to delete the same key without leaving a marker.`,V(found,path));
        }else{
          backshiftDelete(key,found,path);
        }
      }else throw new Error('operations are insert key value, get key, delete key, free');
    }
    if(alive){
      clusterReport();
      t.v({numItems,numSlots}).step([0,LLPG.struct],'End of operation sequence. The table remains live until its owner frees it.',V());
    }
    return t;
  }
});

const LEC_SET_COUNTER = `Set with a hash table:
Insert: insert the item as a key; any value may be used
Contains: check whether the key exists
Delete: delete the key

Counter with a hash table:
Add: get the current count, then re-insert the item with count + 1
Get: look up the item's count`;
function smallChainTable(){return Array.from({length:11},()=>[]);}
function chainFind(tab,k){const b=modHash(k,tab.length);return [b,tab[b].find(x=>x.k===k)];}
mod({
  id:'hashsetcounter',group:'Hash applications',name:'Set and Counter over a hash table',keywords:'Set Counter add get insert contains delete hash application',
  blocks:[{title:"Set/Counter mapping - lecture",src:LEC_SET_COUNTER,pseudo:true,source:'lecture',pages:'week08 hash applications'}],
  note:'The operation mappings are stated directly in the lecture. The visual table uses 11 separate-chaining slots to remain consistent with the manual hash-table representation.',
  fields:[{k:'mode',label:'ADT',def:'Counter',type:'select',options:['Set','Counter']},{k:'ops',label:'operations',def:'add 4, add 3, add 4, add 8, add 8, add 4, get 4, get 7'}],
  run(inp){
    const mode=inp.mode,tab=smallChainTable(),t=new Trace();let size=0;const V=(on=-1)=>({kind:'hash',slots:tab.map(r=>r.map(x=>({k:x.k,v:x.v}))),numSlots:11,numItems:size,onSlot:on});
    t.v({mode,size}).step([0,1],`Create an empty ${mode}.`,V());for(const raw of parseGraphOps(inp.ops)){const p=raw.split(/\s+/),cmd=p[0].toLowerCase(),item=Number(p[1]);if(!Number.isInteger(item))throw new Error(`invalid item in ${raw}`);const [b,node]=chainFind(tab,item);t.v({operation:cmd,item,slot:b}).step([0,1],`Hash item ${item} to slot ${b}.`,V(b));if(mode==='Set'){
        if(cmd==='insert'||cmd==='add'){if(!node){tab[b].push({k:item,v:'present'});size++;}t.v({size}).step([0,2],node?'Item already present; set unchanged.':'Insert item as a key.',V(b));}
        else if(cmd==='contains'||cmd==='get')t.v({result:!!node}).step([0,3],`Membership result: <b>${!!node}</b>.`,V(b));
        else if(cmd==='delete'){if(node){tab[b].splice(tab[b].indexOf(node),1);size--;}t.v({size}).step([0,4],node?'Delete the key.':'Key absent; no change.',V(b));}
        else throw new Error('Set operations: insert item, contains item, delete item');
      }else{
        if(cmd==='add'||cmd==='insert'){if(node)node.v++;else{tab[b].push({k:item,v:1});size++;}t.step([0,6],`Store count ${node?node.v:1} for item ${item}.`,V(b));}
        else if(cmd==='get'||cmd==='contains')t.v({count:node?node.v:0}).step([0,7],`Count of ${item}: <b>${node?node.v:0}</b>.`,V(b));
        else throw new Error('Counter operations: add item, get item');
      }}return t;
  }
});

const LEC_TWO_SUM = `Two Sum problem:
Given an array of integers and a target sum S, determine whether the array contains two integers that sum to S.
Examples for A = [12, 6, 3, 3, 7, 8]:
twoSum(A, 13) => true
twoSum(A, 16) => false
twoSum(A, 3) => false
twoSum(A, 6) => true`;
mod({
  id:'twosum',group:'Hash applications',name:"Two Sum - source-bounded set trace",keywords:'two sum target complement set hash',
  blocks:[{title:"Two Sum problem statement - lecture",src:LEC_TWO_SUM,source:'lecture',pseudo:true,pages:'week08 hash applications'}],
  note:'The lecture gives the problem and identifies hash tables as sets/counters for efficient problem solving, but does not supply exact pseudocode or C. The trace is therefore explicitly a definition-level set demonstration, not a claimed course implementation.',
  fields:[{k:'a',label:'A',def:'12 6 3 3 7 8'},{k:'S',label:'target S',def:'13',type:'number',w:5}],
  run(inp){const items=parseInts(inp.a),S=Number(inp.S),seen=new Set(),t=new Trace();let pair=null;const V=(i=-1)=>arrView(arrayRow('A',items,i>=0?{[i]:'cmp'}:{},i>=0?{i}:{}),arrayRow('seen set',[...seen]));for(let i=0;i<items.length;i++){const need=S-items[i];t.v({i,'A[i]':items[i],needed:need}).step([0,1],`Definition check: would a previously seen value equal ${need}? <b>${seen.has(need)}</b>.`,V(i));if(seen.has(need)){pair=[need,items[i]];break;}seen.add(items[i]);t.v({'seen size':seen.size}).step([0,1],`Add ${items[i]} to the demonstration set.`,V(i));}t.drop('i','A[i]','needed').v({result:!!pair,pair:pair?pair.join(' + '):'—'}).step([0,1],pair?`Two values sum to ${S}: <b>${pair[0]} + ${pair[1]}</b>.`:`No pair summing to ${S} was found.`,V());return t;}
});

const LEC_ODD = `Odd Occurring Elements problem:
Given an array of integers, return the number of distinct integers that occur an odd number of times.
Examples:
oddOccurring([4, 3, 4, 8, 8, 4]) => 2
oddOccurring([7, 2, 1, 5, 6, 9]) => 6
oddOccurring([1, 1, 3, 3, 7, 7]) => 0`;
mod({id:'oddocc',group:'Hash applications',name:"Odd-occurring distinct values - Counter trace",keywords:'odd occurring counter frequency hash',blocks:[{title:"Odd-occurring problem - lecture",src:LEC_ODD,source:'lecture',pseudo:true,pages:'week08 hash applications'}],note:'The lecture defines the problem and separately states how a Counter maps items to counts. The trace combines those supplied definitions; no source C is claimed.',fields:[{k:'a',label:'array',def:'4 3 4 8 8 4'}],run(inp){const A=parseInts(inp.a),counts=new Map(),t=new Trace();const view=i=>refView(refTable('Counter state',['item','count'],[...counts.entries()].map(x=>x)),{title:'Input',html:`<p><code>${A.join(' ')}</code>${i>=0?` — current index ${i}`:''}</p>`});for(let i=0;i<A.length;i++){counts.set(A[i],(counts.get(A[i])||0)+1);t.v({i,item:A[i],count:counts.get(A[i])}).step([0,1],`Counter for ${A[i]} becomes ${counts.get(A[i])}.`,view(i));}const odd=[...counts].filter(([,c])=>c%2).map(([k])=>k);t.drop('i','item','count').v({result:odd.length,'odd values':odd.join(' ')}).step([0,1],`Distinct values with odd counts: <b>${odd.join(', ')||'none'}</b>; result ${odd.length}.`,view(-1));return t;}});

const LEC_ANAGRAM = `Anagram problem:
Given two strings s and t, determine whether they are anagrams.
Two strings are anagrams if they contain the same amount of each character.
Examples:
anagram("abcde", "edcba") => true
anagram("abcde", "fdcba") => false
anagram("aaabb", "ababa") => true`;
mod({id:'anagram',group:'Hash applications',name:"Anagram - character Counter trace",keywords:'anagram strings counter characters hash',blocks:[{title:"Anagram problem - lecture",src:LEC_ANAGRAM,source:'lecture',pseudo:true,pages:'week08 hash applications'}],note:'This is a definition-level Counter demonstration. The lecture does not supply exact algorithm pseudocode or C for the problem.',fields:[{k:'s',label:'s',def:'aaabb'},{k:'t',label:'t',def:'ababa'}],run(inp){const s=String(inp.s),u=String(inp.t),cnt=new Map(),tr=new Trace();const V=()=>refView(refTable('Character balance',['character','count(s) - count(t)'],[...cnt.entries()].sort().map(x=>x)),{title:'Definition',html:'<p>All balances must finish at zero and the strings must have the same length.</p>'});for(const ch of s){cnt.set(ch,(cnt.get(ch)||0)+1);tr.v({source:'s',character:ch,balance:cnt.get(ch)}).step([0,1],`Count ${ch} from <code>s</code>.`,V());}for(const ch of u){cnt.set(ch,(cnt.get(ch)||0)-1);tr.v({source:'t',character:ch,balance:cnt.get(ch)}).step([0,1],`Subtract ${ch} from <code>t</code>.`,V());}const result=s.length===u.length&&[...cnt.values()].every(x=>x===0);tr.drop('source','character','balance').v({sameLength:s.length===u.length,result}).step([0,1],`Anagram result: <b>${result}</b>.`,V());return tr;}});

/* ---------- priority queues, heaps and heap sort ---------- */
const LEC_PQ_COMPARE = `Priority queue implementations:
Unordered array: insert O(1), delete O(n), peek O(n), isEmpty O(1)
Ordered array: insert O(n), delete O(1), peek O(1), isEmpty O(1)
Unordered linked list: insert O(1), delete O(n), peek O(n), isEmpty O(1)
Ordered linked list: insert O(n), delete O(1), peek O(1), isEmpty O(1)
Binary heap: insert O(log n), delete O(log n), peek O(1), isEmpty O(1)`;
mod({id:'pqcompare',group:'Priority queues & heaps',name:'Priority queue implementation comparison',keywords:'priority queue unordered ordered array linked list binary heap complexity',blocks:[{title:"PQ implementation costs - lecture",src:LEC_PQ_COMPARE,source:'lecture',pseudo:true,pages:'week09 priority queues'}],note:'The course takes a larger priority value to mean higher priority. The manual implementation uses a 1-indexed max heap.',fields:[],run(){const t=new Trace();t.step([0,1],'Compare the supplied implementation choices.',refView(refTable('Priority Queue costs',['Representation','Insert','Delete max','Peek max','Is empty'],[['Unordered array','O(1)','O(n)','O(n)','O(1)'],['Ordered array','O(n)','O(1)','O(1)','O(1)'],['Unordered linked list','O(1)','O(n)','O(n)','O(1)'],['Ordered linked list','O(n)','O(1)','O(1)','O(1)'],['Binary max heap','O(log n)','O(log n)','O(1)','O(1)']]),{title:'Heap representation',html:'<p>Completeness allows array navigation: for 1-indexed heap item <code>i</code>, left child <code>2i</code>, right child <code>2i + 1</code>, parent <code>i / 2</code>.</p>'}));return t;}});

const LEC_HEAPIFY = `void heapify(Item items[], int size) {
    for (int i = size / 2 - 1; i >= 0; i--) {
        fixDown(items, i, size - 1);
    }
}

void fixDown(Item items[], int i, int N) {
    while (2 * i + 1 <= N) {
        int j = 2 * i + 1;
        if (j < N && items[j] < items[j + 1]) j++;
        if (items[i] >= items[j]) break;
        swap(items, i, j);
        i = j;
    }
}`;
const LHF=lines(LEC_HEAPIFY,{sig:'void heapify',outer:'for (int i = size / 2 - 1',call:'fixDown(items, i',fd:'void fixDown',loop:'while (2 * i + 1',j:'int j = 2 * i + 1',right:'if (j < N',break:'if (items[i] >= items[j]) break',swap:'swap(items, i, j)',down:'i = j'});
const LEC_HEAPIFY_UP = `void heapify(Item items[], int size) {
    for (int i = 1; i < size; i++) {
        fixUp(items, i);
    }
}

void fixUp(Item items[], int i) {
    while (i > 0 && items[i] > items[(i - 1) / 2]) {
        swap(items, i, (i - 1) / 2);
        i = (i - 1) / 2;
    }
}`;
const LHU=lines(LEC_HEAPIFY_UP,{sig:'void heapify',outer:'for (int i = 1',call:'fixUp(items, i)',fu:'void fixUp',loop:'while (i > 0',swap:'swap(items, i',up:'i = (i - 1) / 2'});
function intFixDownTrace(a,start,N,t,bi,L){let i=start;t.v({i,N}).step([bi,L.loop],`Fix down from index ${i}.`,{kind:'intheap',items:a.slice(),base:0,N,active:[i]});while(2*i+1<=N){let j=2*i+1;t.v({i,j,N}).step([bi,L.j],`Left child index <code>j = ${j}</code>.`,{kind:'intheap',items:a.slice(),base:0,N,compare:[i,j]});if(j<N&&a[j]<a[j+1]){j++;t.v({j}).step([bi,L.right],`Right child is larger; use index ${j}.`,{kind:'intheap',items:a.slice(),base:0,N,compare:[i,j]});}if(a[i]>=a[j]){t.step([bi,L.break],`${a[i]} >= ${a[j]}; heap property holds.`,{kind:'intheap',items:a.slice(),base:0,N,compare:[i,j]});break;}[a[i],a[j]]=[a[j],a[i]];t.step([bi,L.swap],`Swap indices ${i} and ${j}.`,{kind:'intheap',items:a.slice(),base:0,N,active:[i,j]});i=j;t.v({i}).step([bi,L.down],`Continue one level down at index ${i}.`,{kind:'intheap',items:a.slice(),base:0,N,active:[i]});}}
mod({
  id:'heapify',group:'Priority queues & heaps',name:"Heapify - fix-up and fix-down methods",keywords:'heapify fix up fix down max heap O n',
  blocks:[{title:"Heapify by fix-down - lecture C",src:LEC_HEAPIFY,source:'lecture',pages:'week09 priority queues'},{title:"Heapify by fix-up - lecture C",src:LEC_HEAPIFY_UP,source:'lecture',pages:'week09 priority queues'}],
  note:'The fix-up method inserts each item into the growing heap and is O(n log n). The reverse fix-down method starts at the last internal node and is O(n). Both lecture implementations use 0-indexed arrays for heap sort.',
  fields:[{k:'a',label:'items',def:'2 7 4 6 5 1 3'},{k:'method',label:'method',def:'fix-down O(n)',type:'select',options:['fix-down O(n)','fix-up O(n log n)']}],
  run(inp){
    const a=parseInts(inp.a),t=new Trace();if(!a.length)throw new Error('items must not be empty');
    if(inp.method.startsWith('fix-up')){for(let i=1;i<a.length;i++){t.v({i}).step([1,LHU.outer],`Insert index ${i} into the heap prefix.`,{kind:'intheap',items:a.slice(),base:0,N:i,active:[i]});let x=i;while(x>0&&a[x]>a[Math.floor((x-1)/2)]){const p=Math.floor((x-1)/2);t.v({i:x,parent:p}).step([1,LHU.loop],`${a[x]} > parent ${a[p]}.`,{kind:'intheap',items:a.slice(),base:0,N:i,compare:[x,p]});[a[x],a[p]]=[a[p],a[x]];t.step([1,LHU.swap],`Swap ${x} and ${p}.`,{kind:'intheap',items:a.slice(),base:0,N:i,active:[x,p]});x=p;}}t.drop('parent').step([1,LHU.sig],'Heapify by fix-up complete.',{kind:'intheap',items:a.slice(),base:0,N:a.length-1});return t;}
    for(let i=Math.floor(a.length/2)-1;i>=0;i--){t.v({i}).step([0,LHF.outer],`Process internal node ${i} from right to left.`,{kind:'intheap',items:a.slice(),base:0,N:a.length-1,active:[i]});intFixDownTrace(a,i,a.length-1,t,0,LHF);}t.drop('i','j','N').step([0,LHF.sig],'Heapify by fix-down complete.',{kind:'intheap',items:a.slice(),base:0,N:a.length-1});return t;
  }
});

const LEC_DEHEAP = `void deheapify(Item items[], int size) {
    while (size > 1) {
        swap(items, 0, size - 1);
        size--;
        fixDown(items, 0, size - 1);
    }
}`;
const LDHES=lines(LEC_DEHEAP,{sig:'void deheapify',loop:'while (size > 1)',swap:'swap(items, 0, size - 1)',dec:'size--',fix:'fixDown(items, 0, size - 1)'});
mod({
  id:'heapsort',group:'Priority queues & heaps',name:"Heap sort - heapify then deheapify",keywords:'heap sort deheapify max heap in place unstable non adaptive',
  blocks:[{title:"Heapify by fix-down - lecture C",src:LEC_HEAPIFY,source:'lecture',pages:'week09 priority queues'},{title:"deheapify - lecture C",src:LEC_DEHEAP,source:'lecture',pages:'week09 priority queues'}],
  note:'Heap sort is in-place, non-adaptive and unstable. The lecture gives O(n) heapify plus O(n log n) deheapify, so total time is O(n log n).',
  fields:[{k:'a',label:'items',def:'7 2 6 4 5 1 3'}],
  run(inp){
    const a=parseInts(inp.a),t=new Trace();if(!a.length)throw new Error('items must not be empty');for(let i=Math.floor(a.length/2)-1;i>=0;i--){t.v({phase:'heapify',i}).step([0,LHF.outer],`Heapify internal node ${i}.`,{kind:'intheap',items:a.slice(),base:0,N:a.length-1,active:[i]});intFixDownTrace(a,i,a.length-1,t,0,LHF);}let size=a.length;t.v({phase:'deheapify',size}).step([1,LDHES.sig],'The entire array now satisfies the max-heap property.',{kind:'intheap',items:a.slice(),base:0,N:size-1});while(size>1){t.step([1,LDHES.loop],`Heap size is ${size}.`,{kind:'intheap',items:a.slice(),base:0,N:size-1,sortedFrom:size});[a[0],a[size-1]]=[a[size-1],a[0]];t.step([1,LDHES.swap],`Move maximum ${a[size-1]} to final index ${size-1}.`,{kind:'intheap',items:a.slice(),base:0,N:size-1,active:[0,size-1],sortedFrom:size-1});size--;t.v({size}).step([1,LDHES.dec],`Reduce active heap to indices 0..${size-1}.`,{kind:'intheap',items:a.slice(),base:0,N:size-1,sortedFrom:size});intFixDownTrace(a,0,size-1,t,0,LHF);}t.drop('i','size','phase','j','N').step([1,LDHES.sig],'Heap sort complete.',{kind:'intheap',items:a.slice(),base:0,N:0,sortedFrom:0});return t;
  }
});

const NAMED_ONLY = `Named or contextual items for which the supplied files do not provide a complete algorithm/implementation:
- Shell sort
- Key-indexed counting sort
- Kosaraju's strongly-connected-components algorithm
- Tarjan's strongly-connected-components algorithm
- Floyd-Warshall shortest paths
- Bellman-Ford shortest paths
- Boruvka's minimum-spanning-tree algorithm
- Karger-Klein-Tarjan minimum-spanning-tree algorithm
- Longest-path, largest-clique and three-colourability problems (intractability context)
- Graph isomorphism (bonus problem)
- Python dictionaries (bonus hash-table syntax)

The supplied lectures also include examples, correctness proof outlines, empirical demonstrations and appendix exercises. These are indexed as context rather than converted into invented source code.`;