// highlighter.js
// Injects shuffled hand-drawn highlighter backgrounds into all .highlighted elements.
// SVGs are fetched from assets/img/highlighters/ and cached.
// Texture (seed + baseFrequency variant) is randomised per page load.
// Colour is controlled by --highlighter-fill CSS custom property on the parent element.

(function () {

  // ── Base URL ──────────────────────────────────────────────────────────────
  var baseMeta = document.querySelector('meta[name="base-url"]');
  var BASE = baseMeta ? baseMeta.getAttribute('content').replace(/\/$/, '') : '';

  // ── Highlighter shape names (shape 1 excluded from pool, kept in library) ─
  var POOL_NAMES = [
    'highlighter-2',  'highlighter-3',  'highlighter-4',  'highlighter-5',
    'highlighter-6',  'highlighter-7',  'highlighter-8',  'highlighter-9',
    'highlighter-10', 'highlighter-11', 'highlighter-12', 'highlighter-13',
  ];

  // ── Texture randomisation ─────────────────────────────────────────────────
  // Two texture variants from the original system, randomised per page load.
  var textureVariants = [
    { baseFrequency: '0.015 0.05', alphaRow: '0.4 0.4 0.4 0 0.25' },  // texture 1
    { baseFrequency: '0.02 0.06',  alphaRow: '0.3 0.3 0.3 0 0.45' },  // texture 2
  ];
  var tex      = textureVariants[Math.floor(Math.random() * textureVariants.length)];
  var seed     = Math.floor(Math.random() * 1000);

  function applyTexture(svg) {
    return svg
      .replace(/baseFrequency="[^"]*"/, 'baseFrequency="' + tex.baseFrequency + '"')
      .replace(/seed="\d+"/, 'seed="' + seed + '"')
      .replace(/0\.4 0\.4 0\.4 0 0\.25|0\.3 0\.3 0\.3 0 0\.45/, tex.alphaRow);
  }

  // ── Shuffle ───────────────────────────────────────────────────────────────
  function shuffle(arr) {
    return arr
      .map(function(s) { return { s: s, r: Math.random() }; })
      .sort(function(a, b) { return a.r - b.r; })
      .map(function(o) { return o.s; });
  }

  var shuffled = shuffle(POOL_NAMES);
  var idx = 0;
  function nextName() { return shuffled[idx++ % shuffled.length]; }

  // ── SVG cache ─────────────────────────────────────────────────────────────
  var cache = {};

  function fetchSvg(name, cb) {
    if (cache[name]) { cb(cache[name]); return; }
    fetch(BASE + '/assets/img/highlighters/' + name + '.svg')
      .then(function(r) { return r.text(); })
      .then(function(text) { cache[name] = text; cb(text); })
      .catch(function() {});
  }

  // ── Inject into a slot element ────────────────────────────────────────────
  function injectSlot(slot, name) {
    fetchSvg(name, function(svg) {
      slot.innerHTML = applyTexture(svg);
    });
  }

  // ── Run ───────────────────────────────────────────────────────────────────
  document.querySelectorAll('.highlighter-slot').forEach(function(slot) {
    injectSlot(slot, nextName());
  });

})();
