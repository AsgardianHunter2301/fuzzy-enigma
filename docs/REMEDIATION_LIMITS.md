# Input domains and workload limits — measured justification

Referenced from `assets/tracer-core.js`. Every constant below was chosen from
a measurement on this corpus, not picked for roundness. All figures were taken
with Node v22.22.0 on this machine; they are reference measurements for sizing
the limits, not browser thresholds.

## Integer domain

Scalar integer fields accept one complete decimal token, `/^[+-]?\d+$/`,
inside JavaScript's safe-integer range. This is **deliberately the same
grammar `parseInts` already enforced for integer lists**, so a scalar field
and a list field accept exactly the same tokens. It rejects `abc`, the empty
string, whitespace, `1.5`, `1e3`, `0x10`, `NaN`, `Infinity`, `--5` and
`3abc` — all of which `Number()` previously accepted or turned into `NaN`.

A blank field is **not** treated as `0`. Blank in a *list* field still means
the empty list, which is a documented and useful boundary case: an empty array
is sorted.

The safe-integer range was chosen over a 32-bit C `int` range because
narrowing to `int` would have **reduced** the domain the application already
accepted for list fields, and the commission forbids narrowing a valid domain
to avoid a failing case. Where a module models a genuine C `int` boundary it
declares its own maximum — `recfactorial` caps `n` at 12 because `13!`
overflows a signed 32-bit int.

## Graph vertex bounds

| module | bound | basis |
|---|---|---|
| `graphadt`, `bfs`, `dfs`, `warshall`, `dijkstra`, `kruskal`, `prim` | `nV` ≤ 12 | These seven declared **no maximum at all**. 12 matches the maximum already declared by their sibling representation and traversal modules, so the corpus stays internally consistent. Measured worst case: `warshall` at `nV`=12 produces 1,797 frames in 9.6 ms. |
| `hamilton` | `nV` ≤ 7 (already declared) | Now enforced. The accepted worst case — K6 plus an isolated vertex, an exhaustive negative search — is 5,873 frames in 156 ms. The rejected case the audit recorded, `nV`=8 with K7 plus an isolated vertex, is 41,102 frames, 931.6 ms and 272.8 MB RSS. |
| others | as already declared (10–15) | Previously emitted as HTML attributes only; now enforced on every entry path. |

`parseGraph` also applies a shared ceiling of 15 for any entry path that does
not declare its own, so no path can allocate an unbounded adjacency matrix.

## List length

`intListMaxLength` = **64**. Comparison sorts are quadratic in frames, measured
on reverse-ordered input:

| n | bubble | insertion | selection | wall (bubble) |
|---|---|---|---|---|
| 10 | 110 | 128 | 108 | 1.9 ms |
| 32 | 1,056 | 1,118 | 878 | 9.2 ms |
| 48 | 2,352 | 2,446 | 1,894 | 25.6 ms |
| **64** | **4,160** | **4,286** | **3,294** | **31.7 ms** |
| 96 | 9,312 | 9,502 | 7,246 | 121.7 ms |
| 128 | 16,512 | 16,766 | 12,734 | 233.0 ms |

The methods added to `listsorts` while closing CAP-037 are the heaviest new
paths in the corpus. Measured at the documented `intListMaxLength` bound of 64,
in Chromium, on the delivered tree:

| `listsorts` method | sorted input | reverse-sorted input |
|---|---|---|
| insertion (the default) | 194 frames, 8.6 ms | 194 frames, 7.1 ms |
| selection | 2,210 frames, 82.5 ms | 2,210 frames, 58.8 ms |
| **bubble** | 67 frames, 2.2 ms | **6,178 frames, 184.6 ms** |

Bubble on reverse-sorted input at n=64 is the dearest accepted case anywhere in
the corpus after `hamilton`, and it is still roughly a quarter of the 25,000
frame budget. `radix` at its widest accepted keys (m=8) costs 98 frames and
1.9 ms, so accepting unequal-width keys did not make that lesson expensive. No
`maxLen` was introduced to narrow either domain.

64 keeps the worst case near 4,300 frames and ~32 ms while being four to six
times larger than any supplied preset (presets use 10–16 values).

## Operation sequences

`opsMaxCount` = **48**. The largest supplied preset uses 9 operations; 48
leaves ample room for experimentation while bounding the trace.

## Text length

`textMaxLength` = **512** characters, applied to free-text fields, edge lists
and operation strings. Also used as the per-value cap on fragment-supplied
values, with a 2,048-character cap on the whole fragment.

## Trace frame budget

`traceFrameBudget` = **25,000**, enforced inside `Trace.step`. This is a
**backstop**, not the primary control — input bounds are. It sits well above
the largest legitimate trace measured on this corpus (`hamilton` at `nV`=7,
5,873 frames) and below the 41,102-frame case the audit recorded at 272 MB. It
exists so that any path which still reaches an excessive trace fails loudly
with a field-level message rather than exhausting the tab's memory.

## Cost of the capture-time snapshot (AUD-01)

Taking an independent copy of each frame's view at capture time costs, for all
68 modules generated back to back:

| | baseline | successor (when the cost was measured) |
|---|---|---|
| frames | 1,906 | 1,906 |
| wall | 30.34 ms | 90.86 ms |
| process RSS | 62.3 MB | 62.4 MB |

Roughly 1.3 ms per module, with essentially no change in resident memory.

The successor column above is the SNAPSHOT COST measured on an equal corpus, so
both columns are 1,906 frames: that comparison isolates the price of copying
each frame and nothing else. The corpus has since grown to **1,987 default
frames**, because closing the fourteen coverage capabilities added real traces
(hash resize +27, components +15, radix +8, hashprobe +4, q3 +12, dijkstra +6,
bsttrav +3, bstrebalance +3, avlheight +3). That growth is content, not
overhead, and 68 of 68 modules still generate their default trace.
Correctness of every final result was unchanged: the independent oracle suite
reports 2,920 of 2,920 assertions passing on both trees.

## Default frame count

The audited baseline generates 1,906 frames across 68 default runs. This
successor generates **1,924**, and every added frame is accounted for:

- **+6** `dijkstra` — the path-reconstruction lesson that CUR-MOD-03 requires
  (61 → 67 frames).
- **+12** `q3` — the `medianOfThree` comparisons that previously emitted a
  frame only when they swapped (NEW-03).

No frame count was forced to match a historical total.
