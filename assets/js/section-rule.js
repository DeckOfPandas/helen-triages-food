// section-rule.js
// All SVG assets loaded from files in assets/img/. No paths inlined here.
// To change a colour, update colours.js only.

(function () {

  var C = window.SITE_COLOURS;
  var COLOURS = {
    sectionRule:    { fill: C.pencilGrey, opacity: 0.4  },
    groupHeading:   { fill: C.pencilGrey, opacity: 0.55 },
    titleBox:       { fill: C.vividRose },
    sectionHeading: { fill: C.vividRose },
  };

  // ── Base URL ──────────────────────────────────────────────────────────────
  var baseMeta = document.querySelector('meta[name="base-url"]');
  var BASE = baseMeta ? baseMeta.getAttribute('content').replace(/\/$/, '') : '';

  // ── SVG fetch cache ───────────────────────────────────────────────────────
  var cache = {};
  function fetchSvg(url, cb) {
    if (cache[url]) { cb(cache[url]); return; }
    fetch(url)
      .then(function(r) { return r.text(); })
      .then(function(t) { cache[url] = t; cb(t); })
      .catch(function() {});
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function makePicker(names, pathPrefix) {
    var shuffled = names
      .map(function(n) { return { n: n, r: Math.random() }; })
      .sort(function(a, b) { return a.r - b.r; })
      .map(function(o) { return o.n; });
    var idx = 0;
    return function(cb) {
      var name = shuffled[idx++ % shuffled.length];
      fetchSvg(BASE + pathPrefix + name + '.svg', cb);
    };
  }

  function recolour(svg, map) {
    for (var k in map) svg = svg.split(k).join(map[k]);
    return svg;
  }

  function insertAfter(el, cls, html) {
    if (!el) return;
    var w = document.createElement('div');
    w.className = cls; w.innerHTML = html;
    el.parentNode.insertBefore(w, el.nextSibling);
  }

  function insertBefore(el, cls, html) {
    if (!el) return;
    var w = document.createElement('div');
    w.className = cls; w.innerHTML = html;
    el.parentNode.insertBefore(w, el);
  }

  // ── Section rules ─────────────────────────────────────────────────────────
  // SVGs in assets/img/section-rules/ use SECTION_COLOUR + SECTION_OPACITY placeholders.
  var sectionRuleNames = [
    'section-rule-line-1',      'section-rule-line-1-flip',
    'section-rule-line-2',      'section-rule-line-2-flip',
    'section-rule-line-3',      'section-rule-line-3-flip',
    'section-rule-line-4',      'section-rule-line-4-flip',
  ];
  var pickSection = makePicker(sectionRuleNames, '/assets/img/section-rules/');

  function sectionRule(cb) {
    pickSection(function(svg) {
      cb(recolour(svg, {
        'SECTION_COLOUR':  COLOURS.sectionRule.fill,
        'SECTION_OPACITY': String(COLOURS.sectionRule.opacity),
      }));
    });
  }

  var badgesEl = document.querySelector('.recipe-badges');
  var ingredientsEndEl = document.querySelector('.ingredients-end');
  var notesEl = document.querySelector('#recipe-section-notes');
  var bodyEl  = document.querySelector('.recipe-body-content');

  if (badgesEl)        sectionRule(function(h) { insertAfter(badgesEl, 'section-rule', h); });
  if (ingredientsEndEl) sectionRule(function(h) { insertAfter(ingredientsEndEl, 'section-rule', h); });
  if (notesEl)         sectionRule(function(h) { insertBefore(notesEl, 'section-rule', h); });
  if (bodyEl && bodyEl.children.length > 0)
                       sectionRule(function(h) { insertBefore(bodyEl, 'section-rule', h); });

  // ── Title box ─────────────────────────────────────────────────────────────
  // Title underline removed from recipe page.
  // SVG files retained in assets/img/title-box/ for future use.


  // ── Group heading underlines ──────────────────────────────────────────────
  var underlineNames = [
    'underline-multiple-1',      'underline-multiple-1-flip',
    'underline-multiple-6',      'underline-multiple-6-flip',
    'underline-multiple-7',      'underline-multiple-7-flip',
    'underline-multiple-8',      'underline-multiple-8-flip',
  ];
  var pickHeading = makePicker(underlineNames, '/assets/img/underlines/');

  document.querySelectorAll('[data-group-heading]').forEach(function(h3) {
    var textEl = h3.querySelector('.group-heading-text');
    var slot   = h3.querySelector('.group-heading-underline');
    if (!textEl || !slot) return;
    var w = textEl.getBoundingClientRect().width;
    pickHeading(function(svg) {
      slot.innerHTML = recolour(svg, { 'HEADING_COLOUR': COLOURS.groupHeading.fill });
      var svgEl = slot.querySelector('svg');
      if (svgEl) {
        svgEl.style.width   = w + 'px';
        svgEl.style.height  = '10px';
        svgEl.style.opacity = String(COLOURS.groupHeading.opacity);
      }
    });
  });

  // ── Meta label underlines ─────────────────────────────────────────────────
  var pickMetaLabel = makePicker(underlineNames, '/assets/img/underlines/');

  document.querySelectorAll('[data-meta-label]').forEach(function(label) {
    var slot = label.nextElementSibling;
    if (!slot || !slot.classList.contains('meta-label-underline')) return;
    var range = document.createRange();
    range.selectNodeContents(label);
    var rects = range.getClientRects();
    var w = 0;
    for (var i = 0; i < rects.length; i++) w += rects[i].width;
    if (!w) w = label.getBoundingClientRect().width;
    pickMetaLabel(function(svg) {
      slot.innerHTML = recolour(svg, { 'HEADING_COLOUR': C.vibrantViolet });
      var svgEl = slot.querySelector('svg');
      if (svgEl) { svgEl.style.width = w + 'px'; svgEl.style.height = '7px'; }
    });
  });

  // ── Section heading doodles ───────────────────────────────────────────────
  // notes: three-exclamation-marks doodle (from assets/img/doodles/).
  // ingredients, method: sparkle slots left empty.
  document.querySelectorAll('[data-section-heading]').forEach(function(h2) {
    var section = h2.getAttribute('data-section-heading');
    if (section !== 'notes') return;

    var left  = h2.querySelector('.section-heading-sparkle--left');
    var right = h2.querySelector('.section-heading-sparkle--right');
    if (!left && !right) return;

    fetchSvg(BASE + '/assets/img/doodles/doodle-three-exclamation-marks.svg', function(svg) {
      // SVG has data-w and data-h attrs; extract for sizing
      var wAttr = svg.match(/data-w="(\d+)"/);
      var hAttr = svg.match(/data-h="(\d+)"/);
      var w = wAttr ? wAttr[1] : 18;
      var h = hAttr ? hAttr[1] : 32;
      // Re-wrap with display size and correct fill
      var inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      var vbAttr = svg.match(/viewBox="([^"]+)"/);
      var vb = vbAttr ? vbAttr[1] : '0 0 115.86657 204.55893';
      var coloured = recolour(inner, { 'DOODLE_COLOUR': COLOURS.sectionHeading.fill });
      var out = '<svg viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" ' +
                'preserveAspectRatio="xMidYMid meet" aria-hidden="true" ' +
                'style="display:block;width:' + w + 'px;height:' + h + 'px;">' +
                coloured + '</svg>';
      if (left)  left.innerHTML  = out;
      if (right) right.innerHTML = out;
    });
  });

})();
