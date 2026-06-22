(function () {
  // Matches a leading quantity at the start of an ingredient line:
  // e.g. "300g", "1.5 tbsp", "1/2 tsp", "2 1/2 tsp", "3-4 cloves" (range left as-is)
  var QTY_RE = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)(?!\d*-)/;

  function toFraction(value) {
    // Round to nearest 1/4 for friendlier display, fall back to 2dp
    var whole = Math.floor(value);
    var frac = value - whole;
    var fractions = { 0: '', 0.25: '\u00BC', 0.5: '\u00BD', 0.75: '\u00BE' };
    var nearest = Math.round(frac * 4) / 4;
    if (fractions[nearest] !== undefined) {
      if (nearest === 0) return whole.toString();
      var fracStr = fractions[nearest];
      return whole === 0 ? fracStr : whole + ' ' + fracStr;
    }
    // fallback
    var rounded = Math.round(value * 100) / 100;
    return rounded.toString();
  }

  function parseQty(str) {
    if (str.indexOf(' ') > -1 && str.indexOf('/') > -1) {
      // mixed number e.g. "2 1/2"
      var parts = str.split(' ');
      return parseInt(parts[0], 10) + parseFraction(parts[1]);
    }
    if (str.indexOf('/') > -1) {
      return parseFraction(str);
    }
    return parseFloat(str);
  }

  function parseFraction(str) {
    var parts = str.split('/');
    return parseInt(parts[0], 10) / parseInt(parts[1], 10);
  }

  function applyMultiplier(multiplier) {
    document.querySelectorAll('.ingredients li').forEach(function (li) {
      if (!li.dataset.original) {
        li.dataset.original = li.textContent;
      }
      var original = li.dataset.original;
      var match = original.match(QTY_RE);
      if (!match) return;
      var qty = parseQty(match[1]);
      var scaled = qty * multiplier;
      var display = (scaled % 1 === 0) ? scaled.toString() : toFraction(scaled);
      li.textContent = display + original.slice(match[1].length);
    });
  }

  document.querySelectorAll('.recipe-serving-scaler button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.recipe-serving-scaler button').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      applyMultiplier(parseFloat(btn.dataset.multiplier));
    });
  });
})();
