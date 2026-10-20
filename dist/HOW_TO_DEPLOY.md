# How to deploy

Two forms of the same build are in this directory:

| | what it is |
|---|---|
| `dsa_guide/` | the site as a plain folder — upload or drag this |
| `dsa_guide.zip` | the same folder as one file, for hosts that want an archive |

There is no build step, no package manager and no server-side code. It is
static HTML, CSS and JavaScript with every path relative, so it runs from a
domain root, from a subdirectory, or from any depth of nesting.

## Upload

**Drag-and-drop hosts** (Netlify, Cloudflare Pages, Vercel, Render, Surge):
drop the `dsa_guide` folder on the deploy area, or point the host at it. Leave
the build command empty and set the publish directory to the folder itself.

**GitHub Pages.** Copy the *contents* of `dsa_guide/` into the branch or
directory Pages serves (`/` or `/docs` on a branch, or the root of
`gh-pages`). Keep `.nojekyll` — without it Jekyll silently drops any path
beginning with `_` or `.`. A project site is served at
`https://<user>.github.io/<repo>/`, which is a subdirectory; that is verified
to work (see below).

**Object storage** (S3, Azure Blob, GCS): sync the folder, set `index.html` as
the index document, and serve `.html` as `text/html` and `.js` as
`text/javascript`. No other content types are needed.

**A plain web server** (nginx, Apache, IIS): copy the folder into the web root
or any subdirectory. No rewrite rules, no SPA fallback — every page is a real
file.

Opening `index.html` straight off disk mostly works, but some browsers
restrict local-file script execution. If pages look unstyled or inert, serve
the folder instead: `python3 -m http.server --directory dsa_guide`.

## One thing to decide: the canonical and social URLs

Each page carries four absolute URLs — `rel=canonical`, `og:url`, `og:image`
and `twitter:image`, 32 in total — that still name the origin the app was
first published from. **They were deliberately left as they are**, because
rewriting them to a guessed origin would be worse than leaving a value you can
see and decide about.

They do not affect how the app runs. They do affect two things once it is
live: a stale `rel=canonical` tells search engines the real copy is somewhere
else, which suppresses your deployment in results, and the social preview
image points at a file on the old domain.

To retarget them, rebuild with your own origin:

```sh
node tools/build_site.cjs . dist --base-url=https://your-host/your-path
```

The build reports how many URLs it rewrote. Until you do this, the build
prints a reminder each time.

## What was verified

The folder is not assumed to work — it is served and driven. The full
real-browser acceptance suite (55 checks, Chromium) was run against this
build twice:

- served as a whole domain — **55 passed, 0 failed**
- served inside a subdirectory, as a GitHub Pages project site is — **55 passed, 0 failed**

and all 8 pages returned HTTP 200 on both layouts. Reproduce it with:

```sh
bash tools/verify_site.sh . dist/dsa_guide
```

A WCAG 2.0/2.1 A and AA sweep with axe-core 4.14.0 reports 0 violations
across 14 audits (every page, before and after running a trace). That is an
automated rule engine: it does not establish screen-reader usability, and a
human screen-reader evaluation is still recorded as an open item.

`dsa_guide/SHA256SUMS.txt` covers every published file and not itself. Check
it any time with `cd dsa_guide && sha256sum -c SHA256SUMS.txt`. The zip is
verified by extracting it to a fresh directory and re-verifying every line
there, so what comes out equals what went in.

## What is deliberately not in the folder

The tests, tools, audit evidence, issue registers, C sources, the predecessor
baseline and `.git` are all excluded — publishing them would put the audit
trail on the public web beside the classroom build. They stay in the working
tree and in the assurance package. The build refuses to publish a compiled
binary, and refuses outright if any page references an excluded path.

Copying files over an older deployment does not delete files that used to be
there. Replace the directory, or clear it first.
