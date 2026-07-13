// highlighter.js
// Injects shuffled hand-drawn highlighter backgrounds into .highlighter-slot elements.
// SVGs fetched from assets/img/highlighters/. No paths inlined here.
// Shape 1 and shape 13 excluded from pool (retained in library).
// Pool: shapes 2–12 + their flips = 22 options; shuffled per load, no repeats per page.

(function () {

  // ── Base URL ──────────────────────────────────────────────────────────────
  var baseMeta = document.querySelector('meta[name="base-url"]');
  var BASE = baseMeta ? baseMeta.getAttribute('content').replace(/\/$/, '') : '';

  // ── Pool: 22 shapes (11 originals + 11 flips, shapes 2–12) ───────────────
  var POOL = [];
  for (var n = 2; n <= 12; n++) {
    POOL.push('highlighter-' + n);
    POOL.push('highlighter-' + n + '-flip');
  }

  // ── Shuffle once per page load ────────────────────────────────────────────
  var shuffled = POOL
    .map(function(s) { return { s: s, r: Math.random() }; })
    .sort(function(a, b) { return a.r - b.r; })
    .map(function(o) { return o.s; });
  var idx = 0;
  function nextName() { return shuffled[idx++ % shuffled.length]; }

  // ── Texture randomisation ─────────────────────────────────────────────────
  var textureVariants = [
    { baseFrequency: '0.015 0.05', alphaRow: '0.4 0.4 0.4 0 0.25' },
    { baseFrequency: '0.02 0.06',  alphaRow: '0.3 0.3 0.3 0 0.45' },
  ];
  var tex  = textureVariants[Math.floor(Math.random() * textureVariants.length)];
  var seed = Math.floor(Math.random() * 1000);

  function applyTexture(svg) {
    return svg
      .replace(/baseFrequency="[^"]*"/, 'baseFrequency="' + tex.baseFrequency + '"')
      .replace(/seed="\d+"/, 'seed="' + seed + '"')
      .replace(/0\.4 0\.4 0\.4 0 0\.25|0\.3 0\.3 0\.3 0 0\.45/, tex.alphaRow);
  }

  // ── SVG cache ─────────────────────────────────────────────────────────────
  var cache = {};
  function fetchSvg(name, cb) {
    var url = BASE + '/assets/img/highlighters/' + name + '.svg';
    if (cache[url]) { cb(cache[url]); return; }
    fetch(url)
      .then(function(r) { return r.text(); })
      .then(function(t) { cache[url] = t; cb(t); })
      .catch(function() {});
  }

  // ── Inject into all slots ─────────────────────────────────────────────────
  document.querySelectorAll('.highlighter-slot').forEach(function(slot) {
    var name = nextName();
    fetchSvg(name, function(svg) {
      slot.innerHTML = applyTexture(svg);
    });
  });

})();
