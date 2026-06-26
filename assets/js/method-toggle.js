(function () {
  var SESSION_KEY = 'htf-method-short';

  var btn = document.getElementById('method-toggle-btn');
  if (!btn) return;

  var fullMethod  = document.getElementById('method-full');
  var shortMethod = document.getElementById('method-short');

  function setMode(mode) {
    var isShort = mode === 'short';
    fullMethod.hidden  =  isShort;
    shortMethod.hidden = !isShort;
    btn.textContent    =  isShort ? '(click for full method)' : '(click for short method)';
    btn.classList.toggle('active', isShort);
    sessionStorage.setItem(SESSION_KEY, mode);
  }

  var saved = sessionStorage.getItem(SESSION_KEY);
  if (saved === 'short') {
    setMode('short');
  }

  btn.addEventListener('click', function () {
    var isShort = shortMethod.hidden === false;
    setMode(isShort ? 'full' : 'short');
  });
})();
