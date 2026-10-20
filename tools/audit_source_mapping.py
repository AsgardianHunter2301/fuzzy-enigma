#!/usr/bin/env python3
"""Static audit: every t.step([blockIndex, LTABLE.key]) must use a block whose
`src` is the same source constant that LTABLE was built from.

AUD-05 was exactly this class of error: bfs used block index 1 (the Graph
adjacency-matrix source) with a line number computed from SRC_QUEUE (block 2).
A line-number range check cannot catch it, because 44 is a valid line in both
sources. Comparing the *source identity* behind the index does catch it."""
import re,sys,glob,os,json,collections

root=sys.argv[1]
files=sorted(glob.glob(os.path.join(root,'assets','*.js')))

# L-table name -> source constant name
ltab={}
for f in files:
    for m in re.finditer(r'\bconst\s+(L[A-Z0-9_]+)\s*=\s*lines\(\s*([A-Za-z0-9_]+)',open(f,encoding='utf-8').read()):
        ltab[m.group(1)]=m.group(2)


class _ModuleSite:
    """The subset of a match object the call sites use: .group(1) and .end()."""
    def __init__(self, mid, end):
        self._mid = mid
        self._end = end
    def group(self, n):
        if n != 1:
            raise IndexError("only group(1) is provided")
        return self._mid
    def end(self):
        return self._end


def module_sites(text):
    """Module registrations, anchored to the mod({ call that creates them.

    Discovery used to be the bare pattern id:'<word>' anywhere in the file.
    That reads ordinary JavaScript inside a run() body - an object literal such
    as {id:'NULL'} built while tracing - as the start of a new module, and then
    attributes every later .step() site to the WRONG module's source blocks. A
    content author hit 49 false positives this way and worked around it by
    double-quoting the offending literals, which is the tool bending the
    content rather than the other way round.

    A module exists only where mod({...}) is called, so that call is the
    anchor, and the id must appear in its opening window; an id further in is a
    nested literal, not a registration.
    """
    for call in re.finditer(r"\bmod\(\{", text):
        window = text[call.end():call.end() + 400]
        ident = re.search(r"\bid:\s*'([A-Za-z0-9]+)'", window)
        if ident is None:
            continue
        yield _ModuleSite(ident.group(1), call.end() + ident.end())

# module id -> ordered block source constants  (blocks:[{...src:NAME...},...])
mods={}
for f in files:
    text=open(f,encoding='utf-8').read()
    for m in module_sites(text):
        mid=m.group(1)
        seg=text[m.end():m.end()+6000]
        bm=re.search(r'\bblocks\s*:\s*\[',seg)
        if not bm: continue
        i=bm.end()-1; depth=0; j=i
        while j<len(seg):
            if seg[j]=='[': depth+=1
            elif seg[j]==']':
                depth-=1
                if depth==0: break
            j+=1
        blocks_src=seg[i:j+1]
        srcs=[]
        d2=0
        for om in re.finditer(r'\{|\}|src\s*:\s*([A-Za-z0-9_]+)',blocks_src):
            if om.group(0)=='{': d2+=1
            elif om.group(0)=='}': d2-=1
            elif om.group(1) and d2==1: srcs.append(om.group(1))
        if srcs: mods.setdefault(mid,srcs)

# steps: find each module's run() body and the step([N,LXX.key]) calls in it
problems=[]; checked=0
for f in files:
    text=open(f,encoding='utf-8').read()
    for m in module_sites(text):
        mid=m.group(1)
        if mid not in mods: continue
        seg=text[m.end():m.end()+30000]
        nxt=re.search(r"\bmod\(\{",seg)
        if nxt: seg=seg[:nxt.start()]
        for sm in re.finditer(r'\.step\(\s*\[\s*(\d+)\s*,\s*(L[A-Z0-9_]+)\s*\.',seg):
            bi=int(sm.group(1)); lt=sm.group(2)
            checked+=1
            srcs=mods[mid]
            if bi>=len(srcs):
                problems.append(dict(module=mid,block=bi,table=lt,kind='block-index-out-of-range',
                                     blocks=srcs)); continue
            want=ltab.get(lt)
            if want and srcs[bi]!=want:
                problems.append(dict(module=mid,block=bi,table=lt,kind='source-identity-mismatch',
                                     block_src=srcs[bi],table_src=want,blocks=srcs))
out=dict(step_sites_checked=checked,modules_with_blocks=len(mods),line_tables=len(ltab),
         problems=problems,problem_count=len(problems))
print(json.dumps(out,indent=1))
sys.exit(1 if problems else 0)
