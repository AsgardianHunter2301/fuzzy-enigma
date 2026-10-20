# What this is, and how to push it

This is the complete COMP2521 tracer repository as remediated — working tree,
full git history, and the deployable site build. Unzip it anywhere and push.

## Two branches. Pick one.

Both produce a **byte-identical working tree** at HEAD (verified: same git tree
hash). They differ only in what their history carries.

| branch | history | use when |
|---|---|---|
| `remediation/full-2026-10-20-clean` | no build artefacts | **recommended** |
| `remediation/full-2026-10-20` | carries 6.8 MB of compiled binaries in four early commits | you want the literal commits as they were made |

The binaries entered the original branch through a `git add -A` that swept in
`bridges_c/_build` — 52 ELF executables, 4 object files and 104 build logs.
They are gone from the working tree in both branches, but git history is
permanent once pushed, so the clean branch exists to keep them out of a public
repository. Its commit messages are identical; only the hashes differ.

```sh
unzip dsa_guide_repo.zip && cd successor

git branch -a                      # confirm both branches are present
git log --oneline 37ada32..HEAD    # the six commits

# recommended
git checkout remediation/full-2026-10-20-clean
git push -u origin remediation/full-2026-10-20-clean
```

`origin` is already set to `https://github.com/AsgardianHunter2301/dsa_guide.git`.
Neither branch has ever been pushed, and `main` is untouched at `37ada32`, so
pushing either one cannot disturb anything you already have. Open a pull request
to review the diff before merging.

## What is in the tree

- `index.html` and the seven topic pages, `assets/` — the application
- `dist/dsa_guide/` and `dist/dsa_guide.zip` — the deployable site, and
  `dist/HOW_TO_DEPLOY.md`. This directory is gitignored: it is build output,
  rebuilt by `node tools/build_site.cjs . dist`
- `tests/`, `tools/` — 12 test suites and the gate tooling
- `docs/` — issue registers, coverage and curriculum matrices, bridge contracts,
  provenance and limits
- `bridges_c/`, `memorise_graph_c/` — the C sources and their test drivers
- `OPEN_FIRST.md` — start here; `RECOVERY.md` — how to get back to the baseline

## Verifying it yourself

```sh
python3 -m http.server 8137 --bind 127.0.0.1 --directory .   # in one shell
bash tools/release_gate.sh . /tmp/gate                        # in another
```

31 gates, then it packages and verifies a release. It refuses to package if any
gate fails. Last run: 31 of 31 passed, release verification 24 of 24.

`bridges_c/_build` is not in the repository and regenerates with
`bash bridges_c/build.sh`.

## Still open, and yours to decide

- **AUD-13** — the repository has no licence, so the default is all rights
  reserved. Options are set out neutrally in `docs/PROVENANCE_AND_LICENCE.md`.
  No licence was chosen, created or implied.
- **NEW-26** — this tracer appends hash chains at the tail (arrival order).
  Earlier study material recorded *ascending-order* chains as the course
  convention. Both cannot describe the same course, and it is not checkable from
  inside this repository because the 21 original course documents are absent.
  Neither the code nor the convention card was changed to match the other.
- A human screen-reader evaluation. The axe-core sweep reports 0 violations
  across 14 audits, but that is a static rule engine and does not establish
  screen-reader usability.
