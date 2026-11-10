/* Cowball v50: accessibility layer. Loaded last; touches only attributes, never game logic.
   - icon-only buttons get an aria-label (from title / data-a / a readable fallback)
   - clickable non-button elements with data-a get role="button", tabindex and Enter/Space activation
   - live regions for the goal banner, splash and save warnings; visible keyboard focus ring */
(function () {
  'use strict';
  var LABELS = { back: 'Назад', close: 'Закрыть', pause: 'Пауза', resume: 'Продолжить', settings: 'Настройки', menu: 'Меню', kick: 'Удар', pass: 'Пас', sprint: 'Спринт', sw: 'Переключить игрока', cross: 'Навес' };
  var IDS = { bKick: 'Удар', bPass: 'Пас', bSprint: 'Спринт', bSwitch: 'Переключить игрока', bCross: 'Навес', pauseBtn: 'Пауза' };
  var hasText = function (el) { return /[\p{L}\p{N}]{2,}/u.test((el.textContent || '').trim()); };
  function label(el) {
    if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
    if (el.tagName === 'BUTTON' && hasText(el)) return;
    var t = el.getAttribute('title') || IDS[el.id] || LABELS[el.getAttribute('data-a')] || '';
    if (!t && el.tagName === 'BUTTON') t = (el.textContent || '').trim() ? 'Кнопка ' + (el.textContent || '').trim() : 'Кнопка';
    if (t) el.setAttribute('aria-label', t);
  }
  function scan(root) {
    var list = (root || document).querySelectorAll('button, [data-a]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.tagName !== 'BUTTON' && el.tagName !== 'A' && el.tagName !== 'INPUT' && el.tagName !== 'SELECT') {
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      }
      label(el);
    }
  }
  document.addEventListener('keydown', function (e) {
    var el = e.target;
    if (!el || el.getAttribute('role') !== 'button' || el.tagName === 'BUTTON' || el.hasAttribute('contenteditable')) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
  });
  var live = function (id, mode) { var n = document.getElementById(id); if (n && !n.hasAttribute('aria-live')) n.setAttribute('aria-live', mode || 'polite'); };
  function setup() {
    live('splash'); live('goalBanner'); live('cbSaveWarn', 'assertive');
    var st = document.createElement('style');
    st.textContent = '[role=button]:focus-visible,button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #b8ff3d;outline-offset:2px}';
    document.head.appendChild(st);
    scan(document);
    var pending = false;
    new MutationObserver(function () {
      if (pending) return; pending = true;
      (window.requestAnimationFrame || setTimeout)(function () { pending = false; scan(document); live('goalBanner'); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) setup(); else document.addEventListener('DOMContentLoaded', setup);
})();
