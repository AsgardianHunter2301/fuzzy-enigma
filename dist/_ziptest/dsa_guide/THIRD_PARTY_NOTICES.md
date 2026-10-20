# Third-party notices - COMP2521 Tracer v6.3.0

## Admission rule

External repositories contribute interaction methods only. No algorithms, source code or images are imported. Admission follows the 26T2 course outline, and Searching has no external recipes.

## structs.sh

- Repository: `devsoc-unsw/structs.sh`
- Pinned commit: `f96154f0dfe1eda2a89e2452ab8f289619077a0e`
- Pinned repository: `https://github.com/devsoc-unsw/structs.sh/tree/f96154f0dfe1eda2a89e2452ab8f289619077a0e`
- Examined files:
  - `client/src/components/Timeline/Slider.tsx`, blob `ae6dc0e3bcb7b746525f2ea5ace9e25380170a27`
  - `client/src/components/Visualiser/VisualiserCanvas.tsx`, blob `06b5105b8bd88cba9bb680124f8bd575c1e97d00`
  - `client/src/visualiser-debugger/Component/Visualizer/Visulizer/svgComponent.tsx`, blob `f0bd99f4b68469dc7dbe6d2b7511c9fdf91b9e1b`
- Licence: MIT, blob `c75fc99a5e98157c64a2efb170d587e83b6055c5`
- Admitted methods:
  - deterministic marks for a discrete trace timeline;
  - bounded pointer-centred zoom and pan around a visual workspace;
  - an explicit pan lock and visible zoom-level control.
- Implementation decision: reimplemented for the tracer's dependency-free static architecture. React, MUI, `gl-matrix`, debugger services, authentication, back-end services, repository algorithms, branding and images are excluded.

The complete MIT licence is packaged at `licences/structs-sh-MIT-LICENSE.txt`.

### MIT License

Copyright (c) 2021 Structs.sh

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Tactile-DS

- Repository: `tymzd/Tactile-DS`
- Pinned commit: `05d0641442d86c44a2401bf48ceb3a24ffc8dc8b`
- Pinned repository: `https://github.com/tymzd/Tactile-DS/tree/05d0641442d86c44a2401bf48ceb3a24ffc8dc8b`
- README blob examined: `7e4ad491219d706864d0162578f6ad3953bf5a35`
- Licence finding: no repository-wide `LICENSE`, `LICENSE.md` or `COPYING` file was located at the examined commit. A licence inside a vendored utility subproject was not treated as a licence for the repository as a whole.
- Admitted method: **clean-room interaction inspiration only** - command-like, values-only practice recipes that load inputs into this tracer's already-controlled modules.
- Not copied: source code, images, prose, terminal output, examples or algorithm implementations.
- Explicit exclusions: splay trees, repository implementations, terminal UI, images, branding and every feature outside the COMP2521 2026 Term 2 outline.

## Evidence

Pinned commit references appear above. The full licensing receipts, the course-scope authority and its hash receipt are held in the separate assurance package, not in this classroom distribution.

## v6 design note

The v6 colour and language redesign is original to this package. It does not copy Wolfram Alpha branding, source code or trade dress.
