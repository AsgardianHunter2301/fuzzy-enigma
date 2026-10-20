/* ============================================================
   MODULE REGISTRY
   ============================================================ */
const MODULES = [];

/* ============================================================
   FIELD DOMAIN NORMALISATION  (AUD-02, AUD-03)
   ------------------------------------------------------------
   Every field descriptor is normalised once, here, at registration time,
   so the shared validator in tracer-core.js can check it without the
   module having to repeat the rules and without 134 hand-edited
   descriptors drifting apart.

   Why a table rather than inference from `type`: the integer-valued
   scalars `val`, `S`, `v`, `value` and `i` were declared as plain text
   inputs, so `type` alone could not distinguish them from a trie key.
   Those are precisely the fields where Number() previously produced NaN
   and the trace then reported a false match (AUD-02 named bin, bstsearch
   and avldel; an exhaustive sweep of all 134 fields also found lin,
   bstdel and twosum).

   `declaredMax` closes the other half of the problem. nV on graphadt,
   bfs, dfs, warshall, dijkstra, kruskal and prim had NO declared maximum
   at all, and the eleven modules that did declare one only emitted it as
   an HTML min/max attribute, which is a UI hint: "1e3" parsed to 1000 and
   built a 1000x1000 adjacency matrix. The bound chosen for the seven
   previously unbounded modules is 12, matching the maximum already
   declared by their sibling representation/traversal modules, and
   measured at 1,797 frames / 9.6 ms for the worst case (warshall nV=12).
   ============================================================ */
const FIELD_DOMAIN_BY_KEY = Object.freeze({
  a:'intlist', seq:'intlist',
  val:'int', S:'int', v:'int', value:'int', i:'int',
  n:'int', nV:'int', src:'int', dest:'int', start:'int', max:'int',
  g:'graph', ops:'ops',
  s:'text', t:'text'
});
/* Directedness of each module's edge-list field, read from the module's own
   parseGraph call. Needed so the validator applies the same duplicate-edge
   contract that run() will apply. */
const GRAPH_FIELD_DIRECTED = Object.freeze({warshall:true, cycled:true, webcrawl:true});
/* Modules whose directedness comes from a select field rather than a literal. */
const GRAPH_FIELD_DIRECTED_FROM = Object.freeze({graphfund:'kind', graphweighted:'directed'});
/* Justified vertex bounds for the graph modules that declared none. */
const NV_MAX_BY_MODULE = Object.freeze({
  graphadt:12, bfs:12, dfs:12, warshall:12, dijkstra:12, kruskal:12, prim:12
});

/* NEW-16. Fields whose value must be a VERTEX of the graph that the module's
   nV field sizes, so lowering nV can leave a stale value pointing at a vertex
   that no longer exists.

   DECLARED, never inferred. "Every numeric field in a module that has nV" is
   wrong: webcrawl's `max` is numeric, sits beside nV, and caps how many pages
   the crawl visits - it is not a vertex, and clamping it to nV - 1 would
   silently shrink the crawl. The types are also mixed (bfs/dfs/dijkstra
   declare src and dest as text, bfspath/dfspath as number), so the field type
   cannot carry this either.

   run() remains the authority: it still raises "must be a vertex of this
   graph" for a route-supplied or programmatic value. This table only lets the
   UI keep a committed nV edit from leaving the form in a state the student
   did not ask for. */
const VERTEX_TARGET_FIELDS = Object.freeze({
  bfs:Object.freeze(['src']),
  bfspath:Object.freeze(['src','dest']),
  dfs:Object.freeze(['src']),
  dfspath:Object.freeze(['src','dest']),
  dfsiter:Object.freeze(['src']),
  webcrawl:Object.freeze(['start']),
  dijkstra:Object.freeze(['src','dest'])
});
function vertexTargetFields(moduleId){
  return Object.prototype.hasOwnProperty.call(VERTEX_TARGET_FIELDS,moduleId)
    ? VERTEX_TARGET_FIELDS[moduleId] : [];
}
window.VERTEX_TARGET_FIELDS=VERTEX_TARGET_FIELDS;
window.vertexTargetFields=vertexTargetFields;

function normaliseModuleFields(m){
  if(!m||!Array.isArray(m.fields))return m;
  m.fields.forEach(f=>{
    if(!f||typeof f!=='object')return;
    if(f.type==='select'){ if(!f.domain)f.domain='select'; return; }
    if(!f.domain){
      const byKey=FIELD_DOMAIN_BY_KEY[f.k];
      f.domain = byKey || (f.type==='number' ? 'int' : 'text');
    }
    if(f.domain==='graph'){
      if(Object.prototype.hasOwnProperty.call(GRAPH_FIELD_DIRECTED,m.id))f.directed=GRAPH_FIELD_DIRECTED[m.id];
      if(Object.prototype.hasOwnProperty.call(GRAPH_FIELD_DIRECTED_FROM,m.id))f.directedFrom=GRAPH_FIELD_DIRECTED_FROM[m.id];
    }
    if(f.k==='nV'){
      if(f.min===undefined)f.min=1;
      if(f.max===undefined&&Object.prototype.hasOwnProperty.call(NV_MAX_BY_MODULE,m.id))f.max=NV_MAX_BY_MODULE[m.id];
    }
  });
  return m;
}

/* Every module's run() is wrapped so that the shared contract is applied on
   EVERY entry path - the Run button, fragment routing, saved recipes,
   restored UI state, the Course map and programmatic/test callers - rather
   than only where a generator happened to validate for itself. This is the
   single choke point that prevents a bypass through an exported API, which
   is how `api.run('hamilton',{nV:'8'})` previously reached a 41,102-frame
   trace. The generator still parses its own inputs afterwards: that
   defence-in-depth is deliberate, and double-parsing a dozen short strings
   is far cheaper than one trace generation. */
function withValidatedInputs(m){
  if(typeof m.run!=='function')return m;
  const inner=m.run;
  m.run=function(inp){
    const result=validateModuleInputs(m,inp);
    if(!result.ok){
      const first=result.errors[0];
      const error=new InputValidationError(first.message,first.fieldKey);
      error.allErrors=result.errors;
      throw error;
    }
    /* Fall back to the registered module when run() is invoked unbound, so
       that helpers which read `this.blocks` (see srcLine) stay correct. */
    return inner.call(this||m,inp);
  };
  m.validateInputs=function(inp){return validateModuleInputs(m,inp);};
  return m;
}

const mod = o => { MODULES.push(withValidatedInputs(normaliseModuleFields(o))); return o; };

/* ---------- verbatim source: sorting ---------- */
const SRC_MACROS = `#define lt(x, y) (x < y) // less than
#define le(x, y) (x <= y) // less than or equal to
#define ge(x, y) (x >= y) // greater than or equal to
#define gt(x, y) (x > y) // greater than`;

const SRC_SEL = `void selectionSort(Item items[], int lo, int hi) {
    for (int i = lo; i < hi; i++) {
        int min = i;
        for (int j = i + 1; j <= hi; j++) {
            if (lt(items[j], items[min])) {
                min = j;
            }
        }
        swap(items, i, min);
    }
}`;
const LSEL = lines(SRC_SEL,{sig:'void selectionSort',outer:'for (int i = lo; i < hi',min:'int min = i;',inner:'for (int j = i + 1',cmp:'if (lt(items[j]',set:'min = j;',swap:'swap(items, i, min);'});

const SRC_BUB = `void bubbleSort(Item items[], int lo, int hi) {
    for (int i = hi; i > lo; i--) {
        bool swapped = false;
        for (int j = lo; j < i; j++) {
            if (gt(items[j], items[j + 1])) {
                swap(items, j, j + 1);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}`;
const LBUB = lines(SRC_BUB,{outer:'for (int i = hi',flag:'bool swapped = false;',inner:'for (int j = lo; j < i',cmp:'if (gt(items[j]',swap:'swap(items, j, j + 1);',set:'swapped = true;',brk:'if (!swapped) break;'});

const SRC_INS = `void insertionSort(Item items[], int lo, int hi) {
    for (int i = lo + 1; i <= hi; i++) {
        Item item = items[i];
        int j = i;
        for (; j > lo && lt(item, items[j - 1]); j--) {
            items[j] = items[j - 1];
        }
        items[j] = item;
    }
}`;
const LINS = lines(SRC_INS,{outer:'for (int i = lo + 1',hold:'Item item = items[i];',j:'int j = i;',inner:'for (; j > lo &&',shift:'items[j] = items[j - 1];',place:'items[j] = item;'});

const SRC_MS = `void mergeSort(Item items[], int lo, int hi) {
    if (lo >= hi) return;
    int mid = (lo + hi) / 2;
    mergeSort(items, lo, mid);
    mergeSort(items, mid + 1, hi);
    merge(items, lo, mid, hi);
}`;
const LMS = lines(SRC_MS,{base:'if (lo >= hi) return;',mid:'int mid =',left:'mergeSort(items, lo, mid);',right:'mergeSort(items, mid + 1, hi);',merge:'merge(items, lo, mid, hi);'});

const SRC_MERGE = `void merge(Item items[], int lo, int mid, int hi) {
    Item *tmp = malloc((hi - lo + 1) * sizeof(Item));

    int i = lo;
    int j = mid + 1;
    int k = 0;

    while (i <= mid && j <= hi) {
        if (le(items[i], items[j])) {
            tmp[k++] = items[i++];
        } else {
            tmp[k++] = items[j++];
        }
    }

    while (i <= mid) tmp[k++] = items[i++];
    while (j <= hi)  tmp[k++] = items[j++];

    for (i = lo, k = 0; i <= hi; i++, k++) {
        items[i] = tmp[k];
    }
    free(tmp);
}`;
const LMG = lines(SRC_MERGE,{malloc:'Item *tmp = malloc',i:'int i = lo;',j:'int j = mid + 1;',k:'int k = 0;',loop:'while (i <= mid && j <= hi)',cmp:'if (le(items[i], items[j]))',takeL:'tmp[k++] = items[i++];',takeR:'tmp[k++] = items[j++];',drainL:'while (i <= mid) tmp',drainR:'while (j <= hi)  tmp',copy:'items[i] = tmp[k];',free:'free(tmp);'});

const SRC_QS = `void naiveQuickSort(Item items[], int lo, int hi) {
    if (lo >= hi) return;
    int pivotIndex = partition(items, lo, hi);
    naiveQuickSort(items, lo, pivotIndex - 1);
    naiveQuickSort(items, pivotIndex + 1, hi);
}`;
const LQS = lines(SRC_QS,{base:'if (lo >= hi) return;',part:'int pivotIndex = partition',left:'naiveQuickSort(items, lo, pivotIndex - 1);',right:'naiveQuickSort(items, pivotIndex + 1, hi);'});

const SRC_PART = `int partition(Item items[], int lo, int hi) {
    Item pivot = items[lo];
    int l = lo + 1;
    int r = hi;

    while (true) {
        while (l < r && le(items[l], pivot)) l++;
        while (l < r && ge(items[r], pivot)) r--;
        if (l == r) break;
        swap(items, l, r);
    }

    if (lt(pivot, items[l])) l--;
    swap(items, lo, l);
    return l;
}`;
const LPT = lines(SRC_PART,{piv:'Item pivot = items[lo];',l:'int l = lo + 1;',r:'int r = hi;',loop:'while (true) {',scanL:'while (l < r && le(items[l], pivot)) l++;',scanR:'while (l < r && ge(items[r], pivot)) r--;',brk:'if (l == r) break;',swap:'swap(items, l, r);',adj:'if (lt(pivot, items[l])) l--;',fin:'swap(items, lo, l);',ret:'return l;'});

const SRC_M3 = `void medianOfThreeQuickSort(Item items[], int lo, int hi) {
    if (lo >= hi) return;
    medianOfThree(items, lo, hi);
    int pivotIndex = partition(items, lo, hi);
    medianOfThreeQuickSort(items, lo, pivotIndex - 1);
    medianOfThreeQuickSort(items, pivotIndex + 1, hi);
}

void medianOfThree(Item a[], int lo, int hi) {
    int mid = (lo + hi) / 2;
    if (gt(a[mid], a[lo])) swap(a, mid, lo);
    if (gt(a[lo], a[hi])) swap(a, lo, hi);
    if (gt(a[mid], a[lo])) swap(a, mid, lo);
}`;
const LM3 = lines(SRC_M3,{base:'if (lo >= hi) return;',m3:'medianOfThree(items, lo, hi);',part:'int pivotIndex = partition',left:'medianOfThreeQuickSort(items, lo, pivotIndex - 1);',right:'medianOfThreeQuickSort(items, pivotIndex + 1, hi);',mid:'int mid = (lo + hi) / 2;',s1:['if (gt(a[mid], a[lo])) swap(a, mid, lo);',1],s2:'if (gt(a[lo], a[hi]))',s3:['if (gt(a[mid], a[lo])) swap(a, mid, lo);',2]});

const PS_RADIX = `radixSort(A):
    Input: array A of keys
    where each key consists of m symbols
    from an "alphabet" of size R

    initialise R buckets   // one for each symbol

    for i from m down to 1:
        empty all buckets
        for each key in A:
            append key to bucket key[i]
        clear A
        for each bucket (in order):
            for each key in bucket:
                append key to A`;
const LRX = lines(PS_RADIX,{init:'initialise R buckets',outer:'for i from m down to 1:',empty:'empty all buckets',scatter:'append key to bucket',clear:'clear A',bucket:'for each bucket (in order):',gather:'append key to A'});

/* ---------- helpers ---------- */
function parseInts(value,fieldKey='a',fieldLabel='integer list'){
  const text=String(value??'').trim();
  if(!text)return [];
  const tokens=text.split(/[\s,]+/).filter(Boolean);
  const invalid=tokens.find(token=>!/^[+-]?\d+$/.test(token));
  if(invalid!==undefined)throw new InputValidationError(`${fieldLabel} must contain complete whole integers separated by spaces or commas (invalid token: "${invalid}")`,fieldKey);
  const numbers=tokens.map(Number);
  const unsafeIndex=numbers.findIndex(number=>!Number.isSafeInteger(number));
  if(unsafeIndex>=0)throw new InputValidationError(`${fieldLabel} contains an integer outside JavaScript's safe range (token: "${tokens[unsafeIndex]}")`,fieldKey);
  return numbers;
}
const MACRO_NOTE = 'The manual defines <code>lt</code>, <code>le</code>, <code>ge</code>, <code>gt</code> as macros over integers. <code>swap()</code> is used throughout but never defined in the manual.';

function sortView(items, cls, ptr, sorted){
  const c = Object.assign({}, cls||{});
  (sorted||[]).forEach(i=>{ if(!c[i]) c[i]='done'; });
  return arrView(arrayRow('items', items, c, ptr||{}));
}
