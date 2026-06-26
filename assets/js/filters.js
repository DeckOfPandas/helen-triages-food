document.addEventListener('DOMContentLoaded', function () {
  var activeTags = new Set();
  var activeStar = null;
  var activeIngredient = null;
  var activeMetaFilters = new Set(); // 'rewrite' and/or 'proofread'
  var isSearching = false;

  var allIngredientsSet = new Set();
  var items = document.querySelectorAll('.recipe-list li');

  items.forEach(function(li) {
    var rawIng = li.dataset.ingredients || '';
    rawIng.split(',').map(function(s) { return s.trim(); }).filter(Boolean).forEach(function(ing) {
      allIngredientsSet.add(ing);
    });
  });
  var masterIngredientsList = Array.from(allIngredientsSet).sort();

  var matrix = document.querySelector('.controls');
  var recipeList = document.querySelector('.recipe-list');
  var clearButton = null;
  if (matrix) {
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn-clear';
    clearBtn.textContent = '× clear all';
    matrix.insertBefore(clearBtn, matrix.firstChild);
    clearButton = clearBtn;
  }

  var searchBox = document.getElementById('ingredient-search-box');
  var resultsPool = document.getElementById('ingredient-results-pool');
  var ingredientClear = document.getElementById('ingredient-search-clear');

  var singularMap = {
    'eggs':     'egg',
    'legs':     'leg',
    'breasts':  'breast',
    'thighs':   'thigh',
    'fillets':  'fillet',
    'cheeks':   'cheek',
    'beans':    'bean',
    'chips':    'chip',
    'leaves':   'leaf',
    'cloves':   'clove',
    'peaches':  'peach',
    'cherries': 'cherry',
    'tomatoes': 'tomato',
    'potatoes': 'potato',
    'berries':  'berry',
    'olives':   'olive',
    'noodles':  'noodle',
    'chops':    'chop',
    'steaks':   'steak',
    'prawns':   'prawn',
    'mussels':  'mussel',
    'scallops': 'scallop',
    'anchovies':'anchovy',
    'sardines': 'sardine',
    'ribs':     'rib'
  };

  function normaliseIngredientWord(word) {
    return singularMap[word] || word;
  }

  function hasActiveFilters() {
    return activeTags.size > 0 || activeStar !== null || activeMetaFilters.size > 0;
  }

  function getWords(str) {
    return str.toLowerCase().trim().split(/\s+/).filter(Boolean);
  }

  function makeIngredientButton(key, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-tag btn-ingredient';
    if (key === activeIngredient) btn.classList.add('active');
    btn.dataset.ingredient = key;
    btn.textContent = label;
    return btn;
  }

  function updateIngredientClear() {
    if (ingredientClear) {
      ingredientClear.style.display = (activeIngredient || (searchBox && searchBox.value.trim())) ? 'inline-block' : 'none';
    }
  }






function renderResultsPool() {
  if (!searchBox || !resultsPool) return;
  var query = searchBox.value.trim().toLowerCase();
  resultsPool.innerHTML = '';
  activeIngredient = null;
  isSearching = !!query;
  if (!query) {
    update();
    return;
  }
  var enableFamilyButtons = query.length >= 2;
  var renderedKeys = new Set();
  var queryWords = query.split(/\s+/).filter(Boolean);
  var multiWord = queryWords.length > 1;

  // Count how many DISTINCT ingredient entries each normalised word appears in.
  // A word shared by 2+ entries is a "family" and earns an umbrella "(all)" button.
  var wordToEntries = {};
  masterIngredientsList.forEach(function(ing) {
    var normWords = getWords(ing).map(normaliseIngredientWord);
    var seenInThisEntry = new Set();
    normWords.forEach(function(w) {
      if (seenInThisEntry.has(w)) return;
      seenInThisEntry.add(w);
      if (!wordToEntries[w]) wordToEntries[w] = new Set();
      wordToEntries[w].add(ing.toLowerCase());
    });
  });

  if (multiWord) {
    masterIngredientsList.forEach(function(ing) {
      var ingWords = getWords(ing);
      var ingKey = ingWords.map(normaliseIngredientWord).join(' ');
      var allMatch = queryWords.every(function(qw) {
        return ingWords.some(function(iw) { return iw.indexOf(qw) !== -1; });
      });
      if (allMatch && !renderedKeys.has(ingKey)) {
        renderedKeys.add(ingKey);
        resultsPool.appendChild(makeIngredientButton(ing, ing));
      }
    });
  } else {
    // --- Single-word query ---
    //
    // Rules:
    // 1. Collect all matching ingredients.
    // 2. For any word shared by 2+ entries, emit a "word (all)" umbrella button.
    // 3. Suppress an entry if another matching entry's normalised word set is a
    //    strict subset of its own — i.e. it's a plural/variant of a shorter form
    //    that is also in the results. e.g. "chicken legs" is suppressed when
    //    "chicken leg" is present, because {chicken, leg} ⊂ {chicken, legs}.
    // 4. Always suppress entries that are pure members of an (all) family AND
    //    have no additional distinguishing words beyond the family word itself
    //    — i.e. single-word entries like bare "chicken" when "chicken (all)" exists.

    // Step 1: collect all matching entries with their normalised word sets.
    var candidates = []; // { ing, normWords, normKey }
    var familyWords = new Set(); // words that earn an (all) button

    masterIngredientsList.forEach(function(ing) {
      var ingWords = getWords(ing);
      var normWords = ingWords.map(normaliseIngredientWord);

      var matchedAnyWord = ingWords.some(function(word) {
        return word.indexOf(query) !== -1;
      });
      if (!matchedAnyWord) return;

      var normKey = normWords.join(' ');
      candidates.push({ ing: ing, normWords: normWords, normKey: normKey });

      // Check each matched word for family membership (only for queries >= 2 chars)
      if (enableFamilyButtons) {
        ingWords.forEach(function(word, idx) {
          if (word.indexOf(query) === -1) return;
          var normWord = normWords[idx];
          var entries = wordToEntries[normWord];
          if (entries && entries.size > 1) {
            familyWords.add(normWord);
          }
        });
      }
    });

    // Step 2: build normalised word sets for subset check.
    // For each candidate, compute its Set of normalised words.
    var candidateSets = candidates.map(function(c) {
      return new Set(c.normWords);
    });

    // Step 3 & 4: decide which candidates to suppress.
    // Suppress candidate i if:
    //   (a) candidate i's normalised word set is a strict superset of another
    //       candidate j's word set — i.e. i is a plural/variant of a shorter
    //       form j that is also in the results.
    //       e.g. "chicken legs" {chicken,leg} is suppressed when "chicken leg"
    //       {chicken,leg} is present (same after normalisation), OR
    //       more generally when j's words are all contained in i's words and
    //       j is shorter.
    //   (b) candidate i is a single-word entry whose word is a family word
    //       (bare "chicken" suppressed in favour of "chicken (all)")
    // Two-pass suppression:
    // Pass 1 — rule (b): suppress bare single-word family members.
    // Pass 2 — rule (a): suppress entries that are strict supersets of a
    //           non-suppressed entry (catches plurals and redundant variants).
    //           Must be a second pass so we don't use suppressed entries as
    //           suppressors (e.g. bare "chicken" must not cause "chicken leg"
    //           to be suppressed).
    var suppress = candidates.map(function(c) {
      return c.normWords.length === 1 && familyWords.has(c.normWords[0]);
    });

    candidates.forEach(function(c, i) {
      if (suppress[i]) return; // already suppressed
      for (var j = 0; j < candidates.length; j++) {
        if (i === j || suppress[j]) continue; // skip self and suppressed candidates
        var otherSet = candidateSets[j];
        var thisSet = candidateSets[i];
        if (otherSet.size >= thisSet.size) continue; // j must be strictly smaller than i
        var jSubsetOfI = true;
        otherSet.forEach(function(w) { if (!thisSet.has(w)) jSubsetOfI = false; });
        if (jSubsetOfI) { suppress[i] = true; break; }
      }
    });

    // Step 5: render — (all) buttons first, then survivors in original order.
    var renderedAllKeys = new Set();
    familyWords.forEach(function(fw) {
      var label = fw + ' (all)';
      if (!renderedAllKeys.has(fw)) {
        renderedAllKeys.add(fw);
        resultsPool.appendChild(makeIngredientButton(label, label));
      }
    });

    candidates.forEach(function(c, i) {
      if (suppress[i]) return;
      if (!renderedKeys.has(c.normKey)) {
        renderedKeys.add(c.normKey);
        resultsPool.appendChild(makeIngredientButton(c.ing, c.ing));
      }
    });
  }

  var buttons = resultsPool.querySelectorAll('.btn-ingredient');
  if (buttons.length === 1) {
    var onlyBtn = buttons[0];
    activeIngredient = onlyBtn.dataset.ingredient;
    onlyBtn.classList.add('active');
    isSearching = false;
  }
  update();
  updateIngredientClear();
}


  


  



  if (searchBox) {
    searchBox.addEventListener('input', renderResultsPool);
  }

  if (ingredientClear) {
    ingredientClear.addEventListener('click', function() {
      activeIngredient = null;
      isSearching = false;
      if (searchBox) searchBox.value = '';
      if (resultsPool) resultsPool.innerHTML = '';
      update();
    });
  }

  function update() {
    var visibleCount = 0;
    var suppressList = isSearching && !hasActiveFilters();
    if (recipeList) recipeList.style.display = suppressList ? 'none' : '';

    if (!suppressList) {
      items.forEach(function(li) {
        var tags = (li.dataset.tags || '').split(',').filter(Boolean);
        var star = li.dataset.star || '';
        var ingList = (li.dataset.ingredients || '').split(',').map(function(s) { return s.trim(); });
        var visible = true;

        activeTags.forEach(function(t) {
          if (tags.indexOf(t) === -1) visible = false;
        });

        if (activeStar && star !== activeStar) visible = false;

        if (activeMetaFilters.has('rewrite') && li.dataset.metaRewrite !== 'true') visible = false;
        if (activeMetaFilters.has('proofread') && li.dataset.metaProofread !== 'true') visible = false;

        if (activeIngredient) {
          var hasMatch = false;
          var activeWords = getWords(activeIngredient.replace(' (all)', '')).map(normaliseIngredientWord);
          for (var i = 0; i < ingList.length; i++) {
            var ingWords = getWords(ingList[i]).map(normaliseIngredientWord);
            var allMatch = activeWords.every(function(aw) {
              return ingWords.some(function(iw) { return iw.indexOf(aw) !== -1; });
            });
            if (allMatch) { hasMatch = true; break; }
          }
          if (!hasMatch) visible = false;
        }

        li.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
      });
    }

    document.querySelectorAll('.recipe-list .badge').forEach(function(badge) {
      var text = badge.textContent.trim();
      badge.classList.remove('badge--matched', 'badge-ingredient-hit');
      if (activeTags.has(text) || activeStar === text) {
        badge.classList.add('badge--matched');
      }
    });

    // Highlight matching ingredient pills
    var activeWords = activeIngredient
      ? getWords(activeIngredient.replace(' (all)', '')).map(normaliseIngredientWord)
      : [];
    document.querySelectorAll('.recipe-list .ingredient-pill').forEach(function(pill) {
      pill.classList.remove('ingredient--matched');
      if (activeWords.length === 0) return;
      var pillWords = getWords(pill.textContent.trim()).map(normaliseIngredientWord);
      var matches = activeWords.every(function(aw) {
        return pillWords.some(function(pw) { return pw.indexOf(aw) !== -1; });
      });
      if (matches) pill.classList.add('ingredient--matched');
    });

    var emptyMessage = document.querySelector('.recipe-list-empty');
    emptyMessage.style.display = (!suppressList && visibleCount === 0) ? 'block' : 'none';

    var searchingMessage = document.querySelector('.recipe-list-searching');
    if (searchingMessage) searchingMessage.style.display = suppressList ? 'block' : 'none';

    if (clearButton) {
      clearButton.style.visibility = (activeTags.size > 0 || activeStar || activeIngredient || activeMetaFilters.size > 0) ? 'visible' : 'hidden';
    }

    updateInlineLabels();
    updateIngredientClear();
  }

  function updateInlineLabels() {
    var starRow = document.querySelector('.category.category--star');
    if (starRow && starRow.querySelector('.btn-clear-inline')) {
      starRow.querySelector('.btn-clear-inline').style.display = activeStar ? 'inline-block' : 'none';
    }

    document.querySelectorAll('.category').forEach(function(row) {
      if (row.classList.contains('category--star') || row.classList.contains('search')) return;
      var trigger = row.querySelector('.btn-clear-inline');
      if (trigger) {
        trigger.style.display = row.querySelector('.btn-tag.active') !== null ? 'inline-block' : 'none';
      }
    });
  }

  if (matrix) {
    matrix.addEventListener('click', function(e) {
      var target = e.target;

      if (target.classList.contains('btn-tag') && !target.classList.contains('btn-ingredient')) {
        var tag = target.dataset.tag;
        if (activeTags.has(tag)) {
          activeTags.delete(tag);
          target.classList.remove('active');
        } else {
          activeTags.add(tag);
          target.classList.add('active');
        }
        update();
        return;
      }

      if (target.classList.contains('btn-star')) {
        var starValue = target.dataset.star;
        if (activeStar === starValue) {
          activeStar = null;
          target.classList.remove('active');
        } else {
          activeStar = starValue;
          matrix.querySelectorAll('.btn-star').forEach(function(b) { b.classList.remove('active'); });
          target.classList.add('active');
        }
        update();
        return;
      }

      if (target.classList.contains('btn-meta')) {
        var metaKey = target.dataset.meta;
        if (activeMetaFilters.has(metaKey)) {
          activeMetaFilters.delete(metaKey);
          target.classList.remove('active');
        } else {
          activeMetaFilters.add(metaKey);
          target.classList.add('active');
        }
        update();
        return;
      }

      if (target.classList.contains('btn-clear-inline')) {
        var row = target.closest('.category');
        if (row) {
          if (row.classList.contains('category--star')) {
            activeStar = null;
            matrix.querySelectorAll('.btn-star').forEach(function(b) { b.classList.remove('active'); });
          } else {
            row.querySelectorAll('.btn-tag').forEach(function(b) {
              activeTags.delete(b.dataset.tag);
              b.classList.remove('active');
            });
          }
          update();
        }
        return;
      }

      if (target.classList.contains('btn-ingredient')) {
        var ing = target.dataset.ingredient;
        if (activeIngredient === ing) {
          activeIngredient = null;
          isSearching = true;
          target.classList.remove('active');
        } else {
          activeIngredient = ing;
          isSearching = false;
          var rawKey = target.dataset.ingredient;
          if (searchBox) searchBox.value = rawKey.replace(' (all)', '').trim();
          resultsPool.innerHTML = '';
          resultsPool.appendChild(target);
          matrix.querySelectorAll('.btn-ingredient').forEach(function(b) { b.classList.remove('active'); });
          target.classList.add('active');
        }
        update();
        return;
      }
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', function() {
      activeTags.clear();
      activeStar = null;
      activeIngredient = null;
      activeMetaFilters.clear();
      isSearching = false;
      if (searchBox) searchBox.value = '';
      if (resultsPool) resultsPool.innerHTML = '';
      if (matrix) {
        matrix.querySelectorAll('.btn-tag, .btn-star, .btn-meta').forEach(function(btn) {
          btn.classList.remove('active');
        });
      }
      update();
    });
  }

  update();
});
