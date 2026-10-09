/* RudVentur rxplanation — right-click any button/link for a short explanation. */
(function () {
  if (window.__rvRxplanation) return;
  window.__rvRxplanation = true;

  var CSS = '' +
    '#rxplanation-menu{position:fixed;z-index:2147483000;min-width:240px;max-width:340px;' +
    'background:#0e0e10;border:1px solid #3a3a3a;border-radius:10px;padding:.55rem .6rem .65rem;' +
    'box-shadow:0 16px 48px rgba(0,0,0,.75);color:#eee;font-family:"DM Mono",ui-monospace,monospace;' +
    'display:none;pointer-events:auto}' +
    '#rxplanation-menu.open{display:block}' +
    '#rxplanation-menu .rx-kicker{font-size:.55rem;letter-spacing:2px;color:#7CFF4A;text-transform:uppercase;margin-bottom:.25rem}' +
    '#rxplanation-menu .rx-title{font-size:.82rem;font-weight:700;margin-bottom:.35rem;color:#fff}' +
    '#rxplanation-menu .rx-body{font-size:.68rem;line-height:1.45;color:#bbb;margin-bottom:.55rem}' +
    '#rxplanation-menu .rx-href{font-size:.55rem;color:#6aa;word-break:break-all;margin-bottom:.5rem}' +
    '#rxplanation-menu button{display:block;width:100%;text-align:left;background:rgba(255,255,255,.04);' +
    'border:1px solid #2a2a2a;color:#ddd;font:inherit;font-size:.65rem;letter-spacing:.4px;' +
    'padding:.45rem .55rem;border-radius:6px;cursor:pointer;margin-top:.28rem}' +
    '#rxplanation-menu button:hover{background:rgba(124,255,74,.12);border-color:#7CFF4A;color:#fff}' +
    'button,a,[role="button"],.tool-link,.chem-btn,.user-btn,input[type="button"],input[type="submit"]{position:relative}' +
    '.soon{opacity:.55;cursor:default}' +
    '.tool-list{display:flex;flex-direction:column;gap:.2rem}' +
    '.tool-list li{display:block;position:relative;z-index:1}' +
    '.tool-link,.user-btn,.comp-link,.footer-link{position:relative;z-index:1;visibility:visible;opacity:1}' +
    '.tool-link.soon{opacity:.7}';

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var menu = document.createElement('div');
  menu.id = 'rxplanation-menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'rxplanation');
  document.documentElement.appendChild(menu);

  var current = null;

  function labelOf(el) {
    return (el.getAttribute('aria-label') || el.getAttribute('title') || (el.innerText || el.value || '')).replace(/\s+/g, ' ').trim();
  }

  function explain(el) {
    var custom = el.getAttribute('data-rxplanation');
    if (custom) return custom;
    var label = labelOf(el) || 'This control';
    var href = el.getAttribute('href') || '';
    if (el.classList && el.classList.contains('soon')) {
      return label + ' is listed, but the page is not live yet. Right-click only explains it — it does not open a dead link.';
    }
    if (href && href !== '#' && href.indexOf('REPLACE_ME') === -1) {
      return label + ' opens ' + href + '. Right-click shows this rxplanation before you follow the link.';
    }
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
      return label + ' runs an action on this page. Right-click shows this rxplanation instead of the browser menu.';
    }
    return label + '. Right-click any button or link for its rxplanation.';
  }

  function isControl(el) {
    if (!el || el === menu || menu.contains(el)) return false;
    if (el.id === 'rxplanation-menu') return false;
    var tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A') return true;
    if (tag === 'INPUT') {
      var t = (el.getAttribute('type') || '').toLowerCase();
      return t === 'button' || t === 'submit' || t === 'reset';
    }
    if (el.getAttribute && el.getAttribute('role') === 'button') return true;
    if (el.classList && (el.classList.contains('tool-link') || el.classList.contains('chem-btn') || el.classList.contains('user-btn') || el.classList.contains('repo-card') || el.classList.contains('comp-link') || el.classList.contains('footer-link') || el.classList.contains('social-icon'))) return true;
    return false;
  }

  function hide() {
    menu.classList.remove('open');
    menu.innerHTML = '';
    current = null;
  }

  function show(el, x, y) {
    current = el;
    var title = labelOf(el) || 'Control';
    var body = explain(el);
    var href = el.getAttribute('href') || '';
    menu.innerHTML = '' +
      '<div class="rx-kicker">rxplanation</div>' +
      '<div class="rx-title"></div>' +
      '<div class="rx-body"></div>' +
      (href ? '<div class="rx-href"></div>' : '') +
      (href && href !== '#' && !el.classList.contains('soon') ? '<button type="button" data-act="open">Open link</button>' : '') +
      '<button type="button" data-act="click">Activate this button</button>' +
      (href ? '<button type="button" data-act="copy">Copy link</button>' : '') +
      '<button type="button" data-act="close">Close</button>';
    menu.querySelector('.rx-title').textContent = title;
    menu.querySelector('.rx-body').textContent = body;
    if (href) menu.querySelector('.rx-href').textContent = href;
    menu.classList.add('open');
    var mw = menu.offsetWidth || 280;
    var mh = menu.offsetHeight || 180;
    var left = Math.max(8, Math.min(x, window.innerWidth - mw - 8));
    var top = Math.max(8, Math.min(y, window.innerHeight - mh - 8));
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }

  function tagControls() {
    document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]').forEach(function (el) {
      if (menu.contains(el)) return;
      if (!el.getAttribute('data-rxplanation')) el.setAttribute('data-rxplanation', explain(el));
      var tip = el.getAttribute('title');
      if (!tip || tip.indexOf('rxplanation') === -1) {
        el.setAttribute('title', (tip ? tip + ' — ' : '') + 'Right-click for rxplanation');
      }
    });
  }

  document.addEventListener('contextmenu', function (e) {
    var el = e.target;
    while (el && !isControl(el)) el = el.parentElement;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    show(el, e.clientX, e.clientY);
  }, true);

  menu.addEventListener('click', function (e) {
    var act = e.target.getAttribute && e.target.getAttribute('data-act');
    if (!act) return;
    if (act === 'close') { hide(); return; }
    if (!current) return;
    if (act === 'open' && current.href) {
      window.open(current.href, current.target || '_blank');
    } else if (act === 'click') {
      current.click();
    } else if (act === 'copy' && current.href) {
      if (navigator.clipboard) navigator.clipboard.writeText(current.href).catch(function () {});
    }
    hide();
  });

  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target)) hide();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });
  window.addEventListener('resize', hide);
  window.addEventListener('scroll', hide, true);

  function unstack() {
    var floats = [];
    document.querySelectorAll('button, a, [role="button"]').forEach(function (el) {
      if (menu.contains(el)) return;
      var cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (cs.position === 'fixed' || cs.position === 'sticky' || cs.position === 'absolute') {
        floats.push({ el: el, r: r });
      }
    });
    floats.sort(function (a, b) { return a.r.top - b.r.top || a.r.left - b.r.left; });
    for (var i = 0; i < floats.length; i++) {
      for (var j = 0; j < i; j++) {
        var a = floats[j].r;
        var b = floats[i].r;
        var overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        var overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > 6 && overlapY > 6) {
          var el = floats[i].el;
          var shift = Math.ceil(overlapY + 10);
          var curTop = parseFloat(el.style.top);
          if (!isNaN(curTop)) el.style.top = (curTop + shift) + 'px';
          else el.style.marginTop = shift + 'px';
          var nr = el.getBoundingClientRect();
          floats[i].r = nr;
        }
      }
    }
  }

  function boot() {
    tagControls();
    setTimeout(unstack, 400);
    setTimeout(unstack, 1400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  var mo = new MutationObserver(function () { tagControls(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
