/* Cowball v46: лёгкий монитор кадров. При стабильно низком FPS отключает декоративные CSS-анимации (класс lowfx).
   Игровой цикл и графика не затрагиваются. Работает только пока вкладка видима и не дольше ~15 с. */
(function () {
  'use strict';
  var root = document.documentElement, last = 0, sum = 0, n = 0, total = 0, running = false;
  function tick(t) {
    if (document.hidden) { running = false; last = 0; return; }
    if (last) { var d = t - last; if (d < 250) { sum += d; n++; total++; } }
    last = t;
    if (n >= 60) {
      if (sum / n > 28) { root.classList.add('lowfx'); return; }
      sum = 0; n = 0;
    }
    if (total < 900) requestAnimationFrame(tick); else running = false;
  }
  function start() { if (running || root.classList.contains('lowfx')) return; running = true; last = 0; requestAnimationFrame(tick); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
  window.addEventListener('load', function () { setTimeout(start, 1500); });
})();
