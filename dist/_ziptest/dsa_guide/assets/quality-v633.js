"use strict";
/* v6.3.3 - minimum spanning tree total weight.
 *
 * Kruskal and Prim end with an mst edges table listing the chosen edges, but no
 * total, and the traced variable `weight` holds the weight of the last edge
 * considered rather than the tree total. A student reading `weight: 6` at the
 * end of a run whose MST is 11 is being actively misled.
 *
 * The total is derived here from the edges the trace already recorded. No frame,
 * variable or generator is modified, so source parity is untouched.
 */
(function mstTotalWeight() {
  if (typeof playerState === 'undefined' || typeof paint !== 'function') return;

  /* Kruskal labels the table 'mst edges: k/n'; Prim labels it 'mst'. Both hold
     rows of the form 'u-v:w'. 'unusedE' must not match. */
  const MST_TABLE = /^mst(\s|:|$)/i;
  const EDGE_WEIGHT = /:([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*$/i;

  function mstEdgeRows(view) {
    const found = [];
    (function walk(node) {
      if (!node || typeof node !== 'object') return;
      (node.views || []).forEach(walk);
      (node.tables || []).forEach(function (table) {
        if (MST_TABLE.test(String(table.name || '')) && Array.isArray(table.row)) found.push(table.row);
      });
    })(view);
    return found;
  }

  function totalOf(row) {
    let total = 0;
    for (const cell of row) {
      const match = EDGE_WEIGHT.exec(String(cell));
      if (!match) return null;
      const weight = Number(match[1]);
      if (!Number.isFinite(weight)) return null;
      total += weight;
      if (!Number.isFinite(total)) return null;
    }
    return row.length ? total : null;
  }

  function annotate() {
    const stage = document.querySelector('#viz');
    if (!stage) return;
    stage.querySelectorAll('.mst-total,.mst-outcome').forEach(function (node) { node.remove(); });

    const frame = playerState.frames[playerState.frameIndex];
    if (!frame || !frame.view) return;
    if (playerState.currentModule?.id === 'prim'
        && playerState.frameIndex === playerState.frames.length - 1
        && /Trace stopped before every vertex/.test(frame.note || '')) {
      const notice = document.createElement('p');
      notice.className = 'mst-outcome';
      notice.dataset.outcome = 'disconnected';
      notice.textContent = 'No spanning tree: the graph is disconnected. '
        + 'The highlighted edges form only a partial tree. '
        + 'The live mst value is conceptual state retained for inspection, not a C allocation.';
      stage.prepend(notice);
      /* The tree is incomplete, so a "total weight" figure next to a notice
         saying no spanning tree exists would contradict the notice. The
         outcome text already states the edges are a partial tree; skip the
         badge rather than qualify it into ambiguity. */
      return;
    }
    const rows = mstEdgeRows(frame.view);
    if (!rows.length) return;
    const total = totalOf(rows[0]);
    if (total === null) return;

    /* Attach to the caption the renderer already draws for that table. */
    const captions = [...stage.querySelectorAll('*')].filter(function (node) {
      return node.children.length === 0 && MST_TABLE.test((node.textContent || '').trim());
    });
    const target = captions[0];
    if (!target) return;
    const badge = document.createElement('span');
    badge.className = 'mst-total';
    badge.textContent = ' - total weight ' + Number(total.toPrecision(15));
    badge.title = 'Sum of the weights of the edges in the tree so far. '
      + 'The traced variable weight holds the last edge examined, not this total.';
    target.appendChild(badge);
  }

  const baseMstPaint = paint;
  paint = function () {
    baseMstPaint();
    try { annotate(); } catch (error) { /* presentation only; never break a trace */ }
  };
  if (typeof window !== 'undefined') {
    window.COMP2521MstTotal = { mstEdgeRows: mstEdgeRows, totalOf: totalOf };
  }
})();

/* Breadcrumb: keep the area link's text in step with the page descriptor. */
(function breadcrumbArea(){
  var link=document.getElementById('crumbArea');
  if(!link)return;
  var page=window.TRACER_PAGE;
  if(page&&page.title)link.textContent=page.title;
  if(page&&page.file)link.setAttribute('href',page.file);
})();
