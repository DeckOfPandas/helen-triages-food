document.addEventListener('DOMContentLoaded', function () {
  var activeTags = new Set();
  var activeStar = null;
  var activeIngredient = null;
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
    'eggs': 'egg'
  };

  function normaliseIngredientWord(word) {
    return singularMap[word] || word;
  }

  function hasActiveFilters() {
    return activeTags.size > 0 || activeStar !== null;
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
    masterIngredientsList.forEach(function(ing) {
      var ingWords = getWords(ing);
      var normWords = ingWords.map(normaliseIngredientWord);
      var ingKey = normWords.join(' ');

      var matchedAnyWord = ingWords.some(function(word) {
        return word.indexOf(query) !== -1;
      });
      if (!matchedAnyWord) return;

      if (!renderedKeys.has(ingKey)) {
        renderedKeys.add(ingKey);
        resultsPool.appendChild(makeIngredientButton(ing, ing));
      }

      // Check each matched word for family membership (2+ entries share it)
      ingWords.forEach(function(word, idx) {
        if (word.indexOf(query) === -1) return;
        var normWord = normWords[idx];
        var entries = wordToEntries[normWord];
        if (entries && entries.size > 1) {
          var allKey = normWord + ' (all)';
          if (!renderedKeys.has(allKey)) {
            renderedKeys.add(allKey);
            resultsPool.appendChild(makeIngredientButton(normWord, normWord + ' (all)'));
          }
        }
      });
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

        if (activeIngredient) {
          var hasMatch = false;
          var activeWords = getWords(activeIngredient).map(normaliseIngredientWord);
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

    var emptyMessage = document.querySelector('.recipe-list-empty');
    emptyMessage.style.display = (!suppressList && visibleCount === 0) ? 'block' : 'none';

    if (clearButton) {
      clearButton.style.visibility = (activeTags.size > 0 || activeStar || activeIngredient) ? 'visible' : 'hidden';
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
          if (searchBox) searchBox.value = target.textContent.replace(' (all)', '').trim();
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
      isSearching = false;
      if (searchBox) searchBox.value = '';
      if (resultsPool) resultsPool.innerHTML = '';
      if (matrix) {
        matrix.querySelectorAll('.btn-tag, .btn-star').forEach(function(btn) {
          btn.classList.remove('active');
        });
      }
      update();
    });
  }

  update();
});
