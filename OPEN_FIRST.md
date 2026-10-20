# DSA Guide — full remediation successor

**Baseline audited:** `AsgardianHunter2301/dsa_guide` @
`37ada3235c4d67f8b98c46afdb31c092b44419ed`
**Successor branch:** `remediation/full-2026-10-20`
**Nothing was pushed, merged, published or deployed.** All work is local.

## Status in one line

28 of the 29 register items are fixed and verified; **AUD-13 (licence and
course-material permission) is open because it is the owner's decision**.
18 further findings were discovered during implementation: 13 fixed, 2
documented as legitimate contract differences, 3 left open with reasons.

## Where to look

| What | Path |
|---|---|
| Finding-by-finding disposition, all 29 | `docs/ISSUE_REGISTER.md` / `.json` / `.csv` |
| The 18 findings discovered during the work | `docs/NEW_FINDINGS.md` / `.json` / `.csv` |
| Teaching-week register and per-algorithm work objectives | `docs/CURRICULUM_MATRIX.md` |
| Per-capability coverage, incl. the 14 open gaps | `docs/COVERAGE_CAPABILITIES.csv` |
| Per-variant C contracts for the 11 Graph ADTs | `docs/C_LIBRARY_MATRIX.md` |
| Per-bridge contracts for the 14 supplemental bridges | `docs/BRIDGE_CONTRACTS.md` |
| Measured justification for every input and workload limit | `docs/REMEDIATION_LIMITS.md` |
| Ownership, provenance and the licence decision **(open)** | `docs/PROVENANCE_AND_LICENCE.md`, `docs/provenance_matrix.csv` |
| Learning-path rewrite for the supplemental C | `MEMORISE_GRAPH_C_GUIDE.md` |

## Running it

The application is a dependency-free static site. Serve the tree and open
`index.html`:

```
python3 -m http.server 8137 --bind 127.0.0.1 --directory .
```

## Deploying it

`dist/dsa_guide/` is the uploadable folder and `dist/dsa_guide.zip` is the same
thing as one file. Read `dist/HOW_TO_DEPLOY.md` first. Both are rebuilt by
`tools/build_site.cjs`, which derives the file set from the pages and refuses to
publish tests, tools, audit evidence, C sources, `.git` or any compiled binary.
The folder was served twice and driven by the full acceptance suite — as a whole
domain and inside a subdirectory, 55 of 55 both ways — so a GitHub Pages project
site at `/<repo>/` is covered.

One decision is left to you there: each page carries four absolute URLs
(`rel=canonical`, `og:url`, `og:image`, `twitter:image`, 32 in all) still naming
the origin the app was first published from. They were **deliberately left
alone** rather than rewritten to a guessed origin, and every build reports them.
Rebuild with `--base-url=https://your-host/your-path` once you know the target.

## Verifying it

One command runs every gate and refuses to package if any fails:

```
tools/release_gate.sh <this-tree> <new-output-dir>
```

**29 gates, all passing.** Module smoke, the independent oracle suite, the
audited defect expectations, frame immutability, source mapping, topic-index,
displayed-C and distribution-manifest sync, ten successor suites, the C ADT
suites with and without `-DNDEBUG`, the bridge suites, four real-browser gates
(acceptance, an axe-core WCAG sweep, manual-bridge rendering, and
capability destinations), and three deployment gates that build the uploadable
folder, serve it from both a domain root and a subdirectory, and prove the zip
round-trips. Add `--skip-browser` if no server is running — a skip is
**recorded as a skip, never counted as a pass**. It then packages and verifies
the release: 24 of 24 verification checks, including that every checksum
re-verifies in a fresh extraction and that no payload file is a compiled
binary.

Tools used by the gate:

| Tool | Purpose |
|---|---|
| `tools/assert_no_frame_mutation.cjs` | Turns the audited snapshot observer into a failing gate (it exits 0 even when it records changed views) |
| `tools/audit_source_mapping.py` | Checks all 503 `step([block, line])` sites against the block's actual source identity |
| `tools/sync_topic_index.cjs` | Regenerates the derived fields of the generated topic index (`--check` to verify only) |
| `tools/sync_displayed_c.cjs` | Regenerates the displayed C from the compiled C so the two cannot drift (`--check` to verify only) |
| `tools/extract_curriculum_register.cjs` | Dumps the live curriculum register from a real page load |
| `tools/inventory_modules.successor.cjs` | The audited inventory script, adapted in two documented places |
| `tools/build_release.cjs` / `verify_release.cjs` | Allowlist packaging, and verification from a fresh extraction |
| `tools/refresh_manifest.cjs` | Refreshes the distribution manifest's file facts; `--check` is a gate. Leaves `version` and `status` alone, because assigning them is a publication decision |
| `tools/axe_audit.cjs` | axe-core 4.14.0 WCAG 2.0/2.1 A and AA sweep of every page, loaded and after Run |
| `tools/audit_manual_bridges.cjs` | Real-browser sweep of every module: no manual pseudocode may render without a C conversion, and no conversion may omit the routine its pseudocode names |
| `tools/verify_capabilities.cjs` | Re-tests the exact condition each closed coverage finding recorded, recomputing stated quantities rather than reading status fields |
| `tools/build_site.cjs` | Builds the uploadable site folder, deriving the file set from the pages; `--base-url` retargets the canonical and social URLs |
| `tools/verify_site.sh` / `package_site.sh` | Serves the folder from a domain root and from a subdirectory and runs the full acceptance suite against each; zips it and re-verifies every checksum in a fresh extraction |

## What is open, and what it needs

1. **AUD-13 — licence and course-material permission.** The repository has no
   licence of any kind, so the default position is all rights reserved. Five
   options are described neutrally in `docs/PROVENANCE_AND_LICENCE.md` §3 with
   draft `NOTICE.md` wording in §4. **No licence was chosen, created or
   implied.** Separately, the 46 manual and 57 lecture block occurrences have
   no recorded reuse permission, and the repository is already public.
2. **The 21 declared original course documents are absent**, so quotation
   parity cannot be certified. The app labels those blocks by source and term
   and does not claim verified parity. Independently justified corrections
   were still made.
3. **No screen-reader run.** The real accessibility tree was inspected in
   Chromium, the structural equivalents are present, and an axe-core 4.14.0
   WCAG 2.0/2.1 A and AA sweep now reports **0 violations across 14 audits**
   (every page, before and after running a trace) as a release gate. That is an
   automated rule engine: it does not establish that the app is usable with a
   screen reader. Announcement order, live-region behaviour under a real
   reader, and keyboard flow through a running trace are still unverified, and
   no VoiceOver or NVDA evaluation was possible here. This remains a named
   residual gate, not a conformance pass.

   Three serious failures that sweep and that keyboard probing did find are
   fixed and gated: the zoom controls' accessible names did not contain their
   visible text (WCAG 2.5.3, NEW-19/NEW-20), and the manual-bridge code panes
   could not be scrolled from the keyboard because the global trace shortcut
   claimed the arrow keys (WCAG 2.1.1, NEW-21).
4. **The findings that were open are now closed.** The 14 coverage capability
   gaps (NEW-13) have working destinations, independently re-verified 14 of 14
   by `tools/verify_capabilities.cjs`; the dfs bridge's registered routines are
   implemented, compiled and sanitiser-tested rather than deleted (NEW-15); and
   the stale vertex-target value is clamped on a committed `nV` edit (NEW-16).
   Of the 53 recorded items — the 29-item audit register plus 24 newly
   discovered — **only AUD-13 remains open**, because it is yours to decide.
   Five bridges remain unreachable and are recorded as NEW-23: the panel pairs
   manual pseudocode with a C conversion, and the manual prints no pseudocode
   for those routines, so that is a property of the source material. Making
   them render would have required relabelling lecture content as manual, which
   would fabricate provenance.
5. **Course resources that required sign-in** (the full outline, Labs/Quizzes,
   Exams, and the current-term slide link) were not read. Only the publicly
   readable schedule and the 6 August 2026 exam notice were used.

## Decisions reserved for you

Pushing, merging, deploying, publishing, and the licence choice. None was
performed or assumed.

## Recovery

The audited baseline is preserved and was verified recoverable end to end:
archived, hashed, extracted into a new directory, confirmed 73/73 blobs
against the audit's tree, and re-run — 68 modules / 1,906 frames, the 9
original defect expectations still failing, and 146 mutated frame views still
present. See `RECOVERY.md`.
