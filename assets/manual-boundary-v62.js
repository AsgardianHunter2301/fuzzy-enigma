(function () {
'use strict';

const API = window.COMP2521ManualBoundary = window.COMP2521ManualBoundary || {};
const bridges = Array.isArray(window.COMP2521_MANUAL_BRIDGES) ? window.COMP2521_MANUAL_BRIDGES : [];
let scheduled = false;
let observer = null;
let lastMarkup = '';

function canonical(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sourceHost() {
    return document.querySelector('.codewrap');
}

function stateHost() {
    return document.querySelector('.state') || document.querySelector('[data-pane="state"] .scroll');
}

function blockText(header) {
    /* The source lines live inside the block body, not as siblings of the
       header: .cblock > button.blockhdr + .cbody > div > .cline. Walking
       siblings returned nothing, so every block canonicalised to an empty
       string, no bridge could match, and each manual pseudocode block fell to
       the missing-conversion state. */
    const block = header.closest('.cblock');
    const scope = block
        ? (block.querySelector('.cbody') || block)
        : header.parentElement;
    if (!scope) return '';
    const lines = [];
    scope.querySelectorAll('.cline').forEach(function (row) {
        const textNode = row.querySelector('.t');
        lines.push((textNode || row).textContent || '');
    });
    return lines.join('\n').trim();
}

function readBlocks() {
    const host = sourceHost();
    if (!host) return [];
    return Array.from(host.querySelectorAll('.blockhdr')).map(function (header, index) {
        const heading = (header.textContent || '').trim();
        const text = blockText(header);
        const upper = heading.toUpperCase();
        const manual = upper.includes('26T2') || upper.includes('MANUAL');
        const lecture = upper.includes('25T3') || upper.includes('LECTURE');
        const memorise = upper.includes('MEMORISE') || upper.includes('NOT SOURCE') || upper.includes('SUPPLEMENTAL');
        const pseudocode = upper.includes('PSEUDOCODE') || (/^[A-Za-z][A-Za-z0-9_]*\s*\([^\n{}]*\)\s*:/m.test(text) && !/\{\s*$/m.test(text));
        const cCode = /(^|\n)\s*(?:#include|#define|typedef|struct\s+|(?:static\s+)?(?:void|int|bool|Item|Graph|Queue|Stack|HashTable|Pq|Trie)\b)[^\n]*[;{]/m.test(text) || /\{[\s\S]*\}/.test(text);
        return { index, heading, text, manual, lecture, memorise, pseudocode, cCode };
    });
}

function findBridge(text, heading) {
    /* The block heading names the routine, so it decides. The body is only a
       fallback. Matching on the body alone showed the AVL insertion conversion
       on the deletion topic, because the deletion pseudocode calls
       avlRebalance and that token is longer than avlDelete. Within either
       scope the longest matching token wins, so 'balance' cannot outrank a
       specific routine name. */
    function bestIn(value) {
        const key = canonical(value);
        if (!key) return null;
        let best = null;
        let bestLength = 0;
        for (const bridge of bridges) {
            for (const token of (bridge.tokens || [])) {
                if (token && key.includes(token) && token.length > bestLength) {
                    best = bridge;
                    bestLength = token.length;
                }
            }
        }
        return best;
    }
    return bestIn(heading) || bestIn(text);
}

function moduleSummary(blocks) {
    const manualBlocks = blocks.filter(function (block) { return block.manual && !block.memorise; });
    const manualPseudo = manualBlocks.filter(function (block) { return block.pseudocode; });
    const manualC = manualBlocks.filter(function (block) { return block.cCode && !block.pseudocode; });
    const outside = blocks.filter(function (block) { return !block.manual || block.memorise; });
    return { manualBlocks, manualPseudo, manualC, outside };
}

function provenanceHtml(summary) {
    if (summary.manualPseudo.length) {
        return '<strong>Manual boundary:</strong> The pseudocode is in the 26T2 manual. The C conversion is not. This C is supplemental. Learn it separately.';
    }
    if (summary.manualC.length) {
        if (summary.outside.some(function (block) { return block.cCode || block.memorise; })) {
            return '<strong>Manual boundary:</strong> Exact C is in the 26T2 manual. Additional C shown elsewhere in this module is outside the manual. This C is supplemental. Learn it separately.';
        }
        return '<strong>In the manual:</strong> This module includes exact C from the 26T2 manual.';
    }
    if (summary.outside.some(function (block) { return block.cCode || block.memorise; })) {
        return '<strong>Outside the manual:</strong> This C is supplemental. Learn it separately.';
    }
    return '<strong>Outside the manual:</strong> This knowledge is not in the 26T2 manual and must be understood separately.';
}

function pairsHtml(summary) {
    return summary.manualPseudo.map(function (block, index) {
        const bridge = findBridge(block.text, block.heading);
        if (!bridge) {
            return '<section class="manual-pair missing" data-bridge="missing">' +
                '<h4>' + escapeHtml(block.heading || 'Manual pseudocode') + '</h4>' +
                '<p>No C conversion has been registered for this manual pseudocode. This is a build defect.</p>' +
                '</section>';
        }
        return '<section class="manual-pair" data-bridge="' + escapeHtml(bridge.id) + '">' +
            '<h4>' + escapeHtml(bridge.title) + '</h4>' +
            '<div class="manual-columns">' +
                /* WCAG 2.1.1 / 2.1.3. These panes scroll - the C conversions
                   are wider and longer than the column - and a scrollable
                   region that holds no focusable content cannot be reached or
                   scrolled from the keyboard at all, which axe-core reported
                   as scrollable-region-focusable. tabindex="0" puts each pane
                   in the tab order; role="region" with a name means it is
                   announced as what it is instead of as an unlabelled box. */
                '<div><h5 id="' + escapeHtml(bridge.id) + '-ps-h">26T2 manual pseudocode</h5>' +
                '<pre tabindex="0" role="region" aria-labelledby="' + escapeHtml(bridge.id) + '-ps-h"><code>' +
                escapeHtml(block.text) + '</code></pre></div>' +
                '<div><h5 id="' + escapeHtml(bridge.id) + '-c-h">C conversion for study</h5>' +
                '<pre tabindex="0" role="region" aria-labelledby="' + escapeHtml(bridge.id) + '-c-h"><code>' +
                escapeHtml(bridge.code) + '</code></pre></div>' +
            '</div>' +
            '<p class="manual-assumption"><strong>Conversion note:</strong> ' + escapeHtml(bridge.assumption) + '</p>' +
            '<p class="manual-warning">This C is supplemental. Learn it separately.</p>' +
        '</section>';
    }).join('');
}

function render() {
    scheduled = false;
    const host = stateHost();
    const blocks = readBlocks();
    if (!host || !blocks.length) return;

    const summary = moduleSummary(blocks);
    let panel = document.getElementById('manual-boundary-panel');
    if (!panel) {
        panel = document.createElement('section');
        panel.id = 'manual-boundary-panel';
        panel.className = 'manual-boundary-panel';
        panel.setAttribute('aria-label', 'Manual boundary');
        host.insertBefore(panel, host.firstChild);
    }

    panel.dataset.manualPseudocode = String(summary.manualPseudo.length);
    panel.dataset.manualC = String(summary.manualC.length);
    panel.dataset.outside = String(summary.outside.length);
    const markup = '<h3>Manual boundary</h3>' +
        '<p class="manual-provenance">' + provenanceHtml(summary) + '</p>' +
        pairsHtml(summary);
    if (markup === lastMarkup) return;
    lastMarkup = markup;
    panel.innerHTML = markup;
}

function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
}

function appendExamNote() {
    const dialogs = Array.from(document.querySelectorAll('dialog'));
    const sources = dialogs.find(function (dialog) {
        return /sources|source information/i.test(dialog.textContent || '');
    });
    if (!sources || sources.querySelector('.exam-manual-note')) return;
    const note = document.createElement('section');
    note.className = 'exam-manual-note';
    note.innerHTML = '<h3>Exam study boundary</h3>' +
        '<p>The 26T2 course outline describes the final exam as closed-book with relevant documentation supplied. This tool uses the Data Structures and Algorithms Manual as a study boundary. Confirm the exact supplied documents in the current exam instructions.</p>';
    sources.appendChild(note);
}

function removeIncorrectLegacyMessage() {
    document.querySelectorAll('.map, .state, .note').forEach(function (node) {
        if ((node.textContent || '').trim() === 'This C is supplemental. Learn it separately.') {
            node.textContent = '';
        }
    });
}

function start() {
    appendExamNote();
    const root = document.querySelector('.shell') || document.body;
    observer = new MutationObserver(function (mutations) {
        const externalChange = mutations.some(function (mutation) {
            const target = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
            return !target || !target.closest || !target.closest('#manual-boundary-panel');
        });
        if (!externalChange) return;
        removeIncorrectLegacyMessage();
        schedule();
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    schedule();
}

API.refresh = schedule;
API.readBlocks = readBlocks;
API.findBridge = findBridge;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}
}());
