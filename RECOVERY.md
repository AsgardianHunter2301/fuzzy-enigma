# Recovery and baseline preservation

## The audited baseline is intact and recoverable

The original repository was never modified. All remediation happened on a
copy, on branch `remediation/full-2026-10-20`.

Recovery was verified end to end, not asserted:

| Step | Result |
|---|---|
| Baseline tree preserved, unmodified | `git status --porcelain` empty throughout; HEAD `37ada3235c4d67f8b98c46afdb31c092b44419ed` |
| Archived with a detached digest | `recovery/baseline_37ada32.tar.gz`, SHA-256 `44fced41a37d1f37e7ecc1ef7227194507f1293895a5841520bfefa9639dfab3` |
| Extracted into a **previously unused** directory | 73 files recovered |
| Reconciled against the audit's own blob tree | `PASS` — 73 listed, 73 matched |
| Original behaviour still reproduces from the recovered copy | 68 modules / **1,906** frames; the 9 original defect expectations still **fail** (exit 1); **146** mutated frame views still present |

The last row matters: the recovered baseline still demonstrates the original
defects, so it is a usable comparison copy rather than just an archive that
opens.

## What preservation does and does not mean

Preserving the original did **not** require the successor's default experience
to reproduce known errors. The corrected behaviour is the active learning
path. Where a quoted source had an omission or an unsuitable boundary
assumption, the original record is kept and identified, and a clearly labelled
corrected adapter or supplemental implementation is the default runnable
lesson — never presented as an exact quotation.

## Checkpoints taken during the work

A versioned checkpoint and a reviewable patch were written before and during
the remediation, each with its own SHA-256, under `work/checkpoints/`. The
container restarted once mid-run; everything was recovered from disk and
re-verified from scratch before work continued, and the baseline was confirmed
clean at that point.

## Release packages

Two distributions are produced by `tools/build_release.cjs`, each with a
manifest, a checksum file that never covers itself, and a **detached** archive
digest written outside the archive:

| Distribution | Payload |
|---|---|
| `dsa_guide_app` | 73 files — the static site a student loads |
| `dsa_guide_assurance` | 139 files — the app plus tests, tools, generated matrices and C suites |

`tools/verify_release.cjs` extracts each archive into a new, previously unused
directory and verifies the detached digest, every declared path, size and
digest, the absence of unexpected members, that the manifest does not list
itself, that the checksum file does not cover itself, and that no payload file
is a compiled binary. The application was then served **from the extracted
payload** and passed all 41 real-browser assertions, confirming it works
outside the development directory.
