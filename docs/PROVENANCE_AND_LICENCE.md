# Provenance, ownership and licence decision — AUD-13

**Status: OPEN. This document prepares the decision; it does not make it.**
Nothing here selects a licence, grants a permission, or certifies that any
reuse is authorised. The machine-readable matrix is `provenance_matrix.csv`
(8 rows, PV-01 … PV-08). Per-block provenance with content digests is in
`../../artifacts/source_block_provenance.json` (127 block occurrences, 86
unique content hashes).

This is an engineering and record-keeping assessment, not legal advice.
Whoever signs off on publication should get advice appropriate to their
situation, and for the course material should ask the course authority
directly.

---

## 1. What the audit finding actually says

AUD-13 is **not** "the project is unlicensed, pick MIT." It is three separate
problems that were being conflated:

1. **The project has no licence at all.** No `LICENSE` file, no copyright
   notice, no terms in `README.md` or anywhere else. The default legal
   position for original work without a grant is that all rights are
   reserved — which means the repository cannot lawfully be redistributed or
   reused by a classmate, a tutor or a future student, even though it is
   plainly built to be shared. **This is the decision that gates
   publication.**
2. **A third-party MIT notice was at risk of being read as the project's
   licence.** The `structs.sh` MIT grant covers `structs.sh`. It does not
   cover this repository, its original code, or any course material quoted in
   it. The existing `THIRD_PARTY_NOTICES.md` already scopes it correctly to
   three examined files and three reimplemented interaction methods; that
   wording is sound and was kept.
3. **The course-material position is unresolved and cannot be resolved
   here.** 46 displayed block occurrences are declared as exact 26T2 manual
   quotations and 57 as 25T3 lecture material. The declared original
   documents are **absent from the repository**, so:
   - quotation parity cannot be certified — the app says so rather than
     implying verification; and
   - no reuse permission for that material is recorded anywhere.

   Absence of a receipt is **not** evidence of infringement, and none is
   alleged. It is an unresolved permission.

## 2. What is already settled

| | |
|---|---|
| `structs.sh` | MIT, pinned commit, licence text packaged at `licences/structs-sh-MIT-LICENSE.txt`. No code imported; methods reimplemented dependency-free. Satisfied for the admitted scope. |
| `Tactile-DS` | No repository-wide licence found at the pinned commit. Nothing was copied, so no grant is relied upon. A licence inside a vendored sub-project was correctly **not** treated as covering the repository. |
| Official course web pages | Cited as references for week alignment (schedule, 6 August 2026 exam notice). No content copied beyond short factual topic names. |

## 3. The decision required, and what each option would mean

These are the realistic options **for the author's own original work**
(PV-01 and PV-04: the application code, and the supplemental C this project
wrote). They are described factually so the choice can be made; none is
recommended here.

| Option | What it would mean in practice |
|---|---|
| **A. Keep all rights reserved (status quo)** | Nothing changes legally. Classmates cannot redistribute or build on it. A public GitHub repository stays visible but not reusable. This is what the repository says today, by omission rather than by choice. |
| **B. A permissive licence** (MIT, BSD-2/3, Apache-2.0) | Anyone may use, modify and redistribute the author's original work with attribution. Apache-2.0 adds an explicit patent grant and a change-notice requirement; MIT is the shortest and is already the pattern the author has seen in `structs.sh`. Does **not** extend to the course material in PV-02/PV-03. |
| **C. A copyleft licence** (GPL-3.0, AGPL-3.0) | Derivatives must stay under the same terms. AGPL extends that to network use. Appropriate if the author wants improvements shared back; more restrictive for a classmate who wants to borrow a fragment. |
| **D. A non-code licence for the writing** (e.g. CC BY-4.0 or CC BY-SA-4.0 for prose and diagrams, plus a code licence for the code) | Recognises that this repository is roughly half teaching content. Common for documentation-heavy projects. Adds the overhead of two licences and a clear boundary between them. |
| **E. "Source-available, no reuse grant"** | An explicit notice that the repository may be read but not reused, which is clearer than silence while keeping the author's position unchanged. |

**Whichever is chosen, the course material is a separate question.** A licence
the author grants cannot grant rights over UNSW's manual or lecture material.
The honest structure is a licence that covers the author's own work and
explicitly excludes the quoted course material, with that material's status
stated.

## 4. Draft wording, for the author to accept, edit or reject

Two files would be added. **Neither has been created**, because creating them
would be the decision.

**`LICENSE`** — only after an option above is chosen. If Option B/MIT were
chosen, the standard MIT text with:

```
Copyright (c) 2026 Saharsha Bhandari
```

**`NOTICE.md`** — the scope boundary, which is needed under every option
except A:

```
This repository contains material under different terms.

1. Original work by the repository author — the application code
   (assets/, the HTML pages), the supplemental C implementations in
   memorise_graph_c/ and bridges_c/, and the authored explanations — is
   licensed under the terms in LICENSE.

2. Quoted course material is NOT covered by LICENSE. Blocks labelled
   "26T2 manual" and "25T3 lecture" in the application are reproduced from
   COMP2521 course material published by UNSW CSE. No reuse permission for
   that material is held or granted here. Its copyright remains with its
   owners. Anyone wishing to reuse it must seek permission from the course
   authority.

3. Third-party material is covered by its own terms; see
   THIRD_PARTY_NOTICES.md and licences/.
```

## 5. The exact inputs needed to close AUD-13

1. **The author's licence choice** for PV-01 and PV-04 — one of A–E above, or
   a different instruction. *Required; nothing else unblocks this.*
2. **A decision on the quoted course material** (PV-02, PV-03): either obtain
   the course's written permission to redistribute the quoted blocks, or
   confirm the repository stays private / unpublished, or reduce the quoted
   material. Note that the repository is already public on GitHub, so this is
   a live question rather than a hypothetical one.
3. **The 21 declared original course documents**, if textual parity is ever to
   be certified. Without them, the app's quotation labels remain
   unverified-by-this-work and are presented that way.
4. **Confirmation that `assets/og-card.png` is wholly original** (PV-07) — no
   third-party logo, font or artwork — before any public release.

## 6. What was deliberately not done

- No licence was chosen, added or implied.
- No permission, receipt or approval was invented.
- The `structs.sh` MIT notice was **not** promoted into a project licence.
- No infringement was alleged against Tactile-DS or anyone else.
- The absent course documents were **not** treated as a reason to stop the
  rest of the remediation; every independently justified code and teaching
  correction was completed regardless.
