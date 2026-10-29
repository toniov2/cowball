(function () {
  // A failed or stalled Three.js request must never leave the splash screen hanging forever.
  var finished = false;
  function load(src, timeoutMs, ok, fail) {
    var s = document.createElement('script'), settled = false;
    var timer = setTimeout(function () { settle(false); }, timeoutMs);
    function settle(success) {
      if (settled) return; settled = true; clearTimeout(timer);
      s.onload = s.onerror = null;
      if (!success && s.parentNode) s.parentNode.removeChild(s);
      success ? ok() : fail();
    }
    s.src = src; s.onload = function () { settle(!!window.THREE); }; s.onerror = function () { settle(false); };
    document.head.appendChild(s);
  }
  window.__loadThree = function (cb) {
    if (window.THREE) return cb(true);
    var urls = [
      'three.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
      'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
      'https://unpkg.com/three@0.128.0/build/three.min.js'
    ], index = 0;
    function next() {
      if (window.THREE) { if (!finished) { finished = true; cb(true); } return; }
      if (index >= urls.length) { if (!finished) { finished = true; cb(false); } return; }
      var url = urls[index++];
      load(url, url.indexOf('http') !== 0 ? 1800 : 7000, function () {
        if (!finished) { finished = true; cb(true); }
      }, next);
    }
    next();
  };
})();
