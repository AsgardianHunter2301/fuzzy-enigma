/* theory-panel.js — renders the per-topic theory register in the State pane.
 *
 * Installed as a UI layer, so it wraps selectModule the way the other layers
 * do instead of being edited into tracer-ui.js.
 *
 * Why it hangs off MODULE SELECTION and not frame paint: theory is per topic
 * and does not change as a trace advances. Rendering it per frame would redo
 * this work on every step for no benefit, and — more importantly — it would
 * put explanation inside the trace, where frame counts, the independent oracle
 * suite and the snapshot-immutability gate all live. The panel leaves every one
 * of those untouched.
 *
 * Accessibility notes, learned from the failures this app already had:
 *   - <details>/<summary> gives keyboard operation and expand state for free;
 *     a hand-rolled toggle would have needed a role, a label and key handling.
 *   - No aria-label is set on anything that has visible text, because an
 *     accessible name that does not contain the text on screen is exactly the
 *     WCAG 2.5.3 failure fixed in NEW-19.
 *   - No aria-live anywhere: this is reference material the reader goes to, not
 *     a status that should interrupt them mid-trace.
 *   - The panel is plain flow content, so it scrolls with the State pane and
 *     needs no scroll container of its own.
 */
(function () {
'use strict';

const install = window.COMP2521InstallUiLayer || function (name, targets, fn) { fn(); return true; };

install('theory-panel', ['#theorySect', '#theory', 'selectModule'], function () {

  const host = document.getElementById('theory');
  const sect = document.getElementById('theorySect');
  if (!host || !sect) return;   /* page without a State pane, e.g. the home page */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Everything is escaped first, so `backticks` are the only markup an entry
     can produce and no entry can inject HTML. */
  function text(value) {
    return escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function block(title, bodyHtml, open) {
    return '<details class="theory-block"' + (open ? ' open' : '') + '>'
         + '<summary>' + escapeHtml(title) + '</summary>'
         + '<div class="theory-body">' + bodyHtml + '</div>'
         + '</details>';
  }

  function pairList(items, aKey, bKey, aClass, bClass) {
    return '<ul class="theory-pairs">' + items.map(function (item) {
      return '<li><span class="' + aClass + '">' + text(item[aKey]) + '</span>'
           + '<span class="' + bClass + '">' + text(item[bKey]) + '</span></li>';
    }).join('') + '</ul>';
  }

  function renderConvention(key) {
    const table = window.COMP2521_COURSE_CONVENTIONS || {};
    const c = table[key];
    if (!c) return '';
    return block('Convention: ' + c.name,
        '<p class="theory-conv-tracer"><strong>This tracer:</strong> ' + text(c.tracer) + '</p>'
      + '<p class="theory-conv-other"><strong>Commonly elsewhere:</strong> ' + text(c.elsewhere) + '</p>'
      + '<p class="theory-conv-matters"><strong>Why it matters:</strong> ' + text(c.matters) + '</p>');
  }

  function renderTheory(entry, moduleId) {
    const prov = window.COMP2521_THEORY_PROVENANCE || {};
    let html = '';

    /* The invariant leads, deliberately: it is what makes a half-remembered
       procedure recoverable, so it is open by default and everything else is
       collapsed. */
    html += block('Core invariant — why it works',
      '<p class="theory-invariant">' + text(entry.coreInvariant) + '</p>'
      + (entry.mechanism ? '<p>' + text(entry.mechanism) + '</p>' : ''), true);

    if (entry.criticalInvariants && entry.criticalInvariants.length) {
      html += block('Critical invariants — break one and the answer is wrong',
        pairList(entry.criticalInvariants, 'rule', 'because', 'theory-rule', 'theory-because'));
    }
    if (entry.examTraps && entry.examTraps.length) {
      html += block('Traps — the mistakes that look right',
        pairList(entry.examTraps, 'trap', 'instead', 'theory-trap', 'theory-instead'));
    }
    if (entry.recognition) {
      const vars = (entry.recognition.stateVariables || [])
        .map(function (v) { return '<code>' + escapeHtml(v) + '</code>'; }).join(' ');
      html += block('Recognising it from the state it keeps',
        (vars ? '<p class="theory-statevars">' + vars + '</p>' : '')
        + '<p>' + text(entry.recognition.tell) + '</p>');
    }
    if (entry.complexity && entry.complexity.length) {
      html += block('Cost',
        '<table class="theory-cost"><thead><tr><th scope="col">Case</th>'
        + '<th scope="col">Cost</th><th scope="col">Why</th></tr></thead><tbody>'
        + entry.complexity.map(function (row) {
            return '<tr><th scope="row">' + escapeHtml(row.case) + '</th>'
                 + '<td>' + text(row.cost) + '</td><td>' + text(row.why) + '</td></tr>';
          }).join('')
        + '</tbody></table>');
    }
    if (entry.convention) html += renderConvention(entry.convention);

    /* An entry may opt in to the WHOLE conventions table with
       `allConventions: true`. One topic should carry it — the course map — so
       there is a single place to read every convention before relying on any
       of them, which is what makes the table useful rather than scattered. A
       convention changes a stated index, height or intermediate array; it
       never changes a decision, and seeing them together is what makes that
       distinction land. */
    if (entry.allConventions) {
      const table = window.COMP2521_COURSE_CONVENTIONS || {};
      const rows = Object.keys(table).map(function (key) {
        const c = table[key];
        return '<tr><th scope="row">' + escapeHtml(c.name) + '</th>'
             + '<td>' + text(c.tracer) + '</td>'
             + '<td>' + text(c.elsewhere) + '</td>'
             + '<td>' + text(c.matters) + '</td></tr>';
      }).join('');
      html += block('Every convention this tracer uses',
        '<p>A convention changes a stated index, height or intermediate array. It never changes '
        + 'a decision — which rotation, which child, which edge. That is what tells you whether a '
        + 'disagreement with another textbook matters or is cosmetic.</p>'
        + '<table class="theory-cost theory-conventions"><thead><tr>'
        + '<th scope="col">Topic</th><th scope="col">This tracer</th>'
        + '<th scope="col">Commonly elsewhere</th><th scope="col">What it does and does not change</th>'
        + '</tr></thead><tbody>' + rows + '</tbody></table>');
    }

    /* The cross-topic tracing layer, on the one entry that opts in. Per-topic
       theory says why ONE algorithm is correct; this says how to trace any of
       them by hand so the working survives marking, and how to name an
       algorithm from an unlabelled trace. */
    if (entry.tracingTechnique) {
      const T = window.COMP2521_TRACING_TECHNIQUE;
      if (T) {
        html += block('Before you trace anything',
          '<ol class="theory-checklist">'
          + T.preTrace.map(function (x) { return '<li>' + text(x) + '</li>'; }).join('')
          + '</ol>');

        html += block('Four rules that recover the most marks',
          pairList(T.rules, 'rule', 'why', 'theory-rule', 'theory-because'));

        html += block('Tie-breaks when the question is silent',
          '<p class="theory-advice">' + text(T.tieBreaks.note) + '</p>'
          + '<table class="theory-cost"><thead><tr><th scope="col">Situation</th>'
          + '<th scope="col">State this, and hold to it</th></tr></thead><tbody>'
          + T.tieBreaks.rows.map(function (r) {
              return '<tr><th scope="row">' + text(r.situation) + '</th><td>' + text(r.choice)
                   + (r.tracer ? '<br><em class="theory-tracernote">In this tracer: '
                       + text(r.tracer) + '</em>' : '')
                   + '</td></tr>';
            }).join('')
          + '</tbody></table>');

        html += block('Cheap self-checks',
          '<table class="theory-cost"><thead><tr><th scope="col">After</th>'
          + '<th scope="col">Check</th></tr></thead><tbody>'
          + T.selfChecks.map(function (c) {
              return '<tr><th scope="row">' + text(c.after) + '</th><td>' + text(c.check) + '</td></tr>';
            }).join('')
          + '</tbody></table>');

        html += block('Naming an algorithm from an unlabelled trace',
          '<p class="theory-advice">' + text(T.identification.note) + '</p>'
          + '<table class="theory-cost"><thead><tr><th scope="col">What the trace carries</th>'
          + '<th scope="col">What it is</th></tr></thead><tbody>'
          + T.identification.rows.map(function (r) {
              return '<tr><td>' + text(r.clue) + '</td><th scope="row">' + text(r.is) + '</th></tr>';
            }).join('')
          + '</tbody></table>');
      }
    }

    if (entry.whatToDraw) {
      html += block('Tracing it by hand',
        '<p><strong>One row =</strong> ' + text(entry.whatToDraw.unit) + '</p>'
        + '<p><strong>Columns:</strong> '
        + (entry.whatToDraw.columns || []).map(function (c) {
            return '<code>' + escapeHtml(c) + '</code>';
          }).join(' &middot; ') + '</p>');
    }
    if (entry.seeAlso && entry.seeAlso.length) {
      html += block('Trace next',
        '<ul class="theory-seealso">' + entry.seeAlso.map(function (s) {
          /* TRACER_TOPICS carries every topic's name AND the page it lives on,
             so a link to another area's topic actually goes there. A bare
             "#id" only works when the topic happens to be on this page, which
             is exactly the case a cross-area suggestion is not. */
          const topic = (window.TRACER_TOPICS || []).find(function (t) { return t.i === s.id; });
          const label = topic ? topic.n
            : (typeof moduleById === 'function' && moduleById(s.id) ? moduleById(s.id).name : s.id);
          const href = topic && topic.p ? topic.p + '#' + s.id : '#' + s.id;
          return '<li><a href="' + escapeHtml(href) + '">' + escapeHtml(label) + '</a>'
               + ' &mdash; ' + text(s.why) + '</li>';
        }).join('') + '</ul>');
    }

    html += '<p class="theory-provenance"><strong>' + escapeHtml(prov.label || 'Tracer-authored')
          + '.</strong> ' + escapeHtml(prov.statement || '') + '</p>';
    return html;
  }

  function paint(moduleId) {
    const register = window.COMP2521_THEORY || {};
    const entry = moduleId && Object.prototype.hasOwnProperty.call(register, moduleId)
      ? register[moduleId] : null;
    if (!entry) { sect.hidden = true; host.innerHTML = ''; return; }
    sect.hidden = false;
    host.innerHTML = renderTheory(entry, moduleId);
  }

  /* Wrap selectModule, which the other layers already do; ours is outermost
     because this file loads last. */
  if (typeof selectModule === 'function') {
    const base = selectModule;
    selectModule = function (id, options) {
      const result = base(id, options);
      try { paint(id); } catch (err) {
        /* Reference material must never take the tracer down with it. */
        sect.hidden = true;
        host.innerHTML = '';
        if (window.console) console.error('[theory-panel] render failed for ' + id, err);
      }
      return result;
    };
  }

  /* The first module is selected before this layer installs, so paint it now. */
  try {
    const current = (window.playerState && window.playerState.currentModule)
      || (typeof moduleById === 'function' && location.hash
          ? moduleById(decodeURIComponent(location.hash.slice(1)).split('?')[0]) : null);
    if (current && current.id) paint(current.id);
  } catch (err) { /* nothing selected yet */ }

  /* Its own global, not a property bolted onto COMP2521TracerTestAPI: that
     object is frozen, so assigning to it throws a page error, and the
     real-browser gate counts any page error as a failure. The other layers
     publish their own test surfaces the same way. */
  window.COMP2521TheoryTestAPI = Object.freeze({
    theorySnapshot: function () {
      const register = window.COMP2521_THEORY || {};
      return {
        registered: Object.keys(register).length,
        visible: !sect.hidden,
        blocks: Array.from(host.querySelectorAll('.theory-block > summary'))
          .map(function (s) { return s.textContent; })
      };
    }
  });
});
})();
