// ═══════════════════════════════════════════════════════════════
//  w13-panels.js — Windows 13 desktop panels on the shared toggle pattern
//  (needs js/panel-toggle.js first). Loaded by WINDOWS13-MASTER.html and
//  taskbar-window-system.html; it adds the toggles from here so the page
//  markup (busy with other work) stays untouched.
//
//  taskbar   bottom bar: a "hide" toggle at its right end; when hidden a
//            small "▲ taskbar" tab sits at the bottom edge, the corner
//            buttons drop down and maximised windows take the full height
//  useRbox   the 👤 box folds down to its header (its open / close and
//            maximise buttons keep working as before)
//  Choices are remembered on this device (localStorage windows13_panels).
// ═══════════════════════════════════════════════════════════════
(function () {
  if (!window.sfPanels) return;
  const body = document.body;
  const css = `
    :root { --sf-panel-accent: #00ff41; --sf-panel-text: #00ff41; --sf-panel-ink: #000;
      --sf-panel-font: 'Courier New', monospace; --sf-panel-title-font: 'Courier New', monospace;
      --sf-panel-font-size: .8rem; --sf-panel-radius: 6px; }
    .sf-ptoggle { font-weight: bold; padding: 2px 8px; }
    #taskbar { padding-right: 110px; }
    #taskbar > .w13-taskbar-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); margin: 0; }
    #taskbar, #useRbox, .w13-tab { transition: transform .25s ease; }
    body.sf-hidden-taskbar #taskbar { transform: translateY(110%); box-shadow: none; }
    .w13-tab.sf-ptab { position: fixed; z-index: 10000; bottom: 0; right: 16px; padding: 3px 12px;
      border-radius: 8px 8px 0 0; font-weight: bold; box-shadow: 0 0 14px var(--sf-panel-accent);
      transform: translateY(110%); }
    body.sf-hidden-taskbar .w13-tab.sf-ptab { transform: none; }
    body.sf-hidden-taskbar #bottomButtons, body.sf-hidden-taskbar #popcornBtn { bottom: 34px; }
    body.sf-hidden-taskbar .window.maximized { height: calc(100% - 28px) !important; }
    #desktop:not([style*="block"]) ~ .w13-tab-desk { display: none; }
    .ubx-head .w13-ubx-toggle { margin-left: 0; }
    #useRbox.sf-panel-collapsed { max-height: none; }
    #useRbox.sf-panel-collapsed .ubx-head { border-bottom: 0; }
  `;
  const st = document.createElement('style');
  st.id = 'w13PanelStyle';
  st.textContent = css;
  document.head.appendChild(st);

  function toggleBtn(id, cls, closedText) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sf-ptoggle ' + cls;
    b.dataset.panelToggle = id;
    b.innerHTML = '<span class="sf-pt-icon"></span><span class="sf-pt-label"' + (closedText ? ' data-closed="' + closedText + '"' : '') + '></span>';
    return b;
  }

  // ── Taskbar (bottom bar) ──
  const bar = document.getElementById('taskbar');
  if (bar) {
    bar.appendChild(toggleBtn('taskbar', 'w13-taskbar-toggle'));
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'sf-ptab w13-tab';
    tab.dataset.panelToggle = 'taskbar';
    tab.innerHTML = '<span class="sf-pt-icon"></span> taskbar';
    // On the full OS page the tab follows the desktop (hidden on the login screen).
    const desk = document.getElementById('desktop');
    if (desk && desk.parentNode === body && document.getElementById('login')) { tab.classList.add('w13-tab-desk'); desk.after(tab); }
    else body.appendChild(tab);
    sfPanels.register({
      id: 'taskbar', el: '#taskbar', label: 'the taskbar', side: 'bottom',
      read: () => !body.classList.contains('sf-hidden-taskbar'),
      apply: open => body.classList.toggle('sf-hidden-taskbar', !open)
    });
    sfPanels.set('taskbar', sfPanels.saved('taskbar', true), { noSave: true });
    // The tab's icon is fixed (▲ = bring it up); sync() would show the
    // header chevron, which is the same here, so nothing more to do.
  }

  // ── useRbox: fold to its header ──
  const ubx = document.getElementById('useRbox');
  const head = ubx && ubx.querySelector('.ubx-head');
  const ubxBody = ubx && ubx.querySelector('.ubx-body');
  if (head && ubxBody) {
    ubxBody.classList.add('sf-pbody');
    head.classList.add('sf-phead');
    const btns = head.querySelector('.ubx-head-btns') || head;
    btns.insertBefore(toggleBtn('useRbox', 'w13-ubx-toggle'), btns.firstChild);
    sfPanels.register({ id: 'useRbox', el: ubx, label: 'the useRbox', side: 'top' });
  }
})();
