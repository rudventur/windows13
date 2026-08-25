/* useRbox v2.0 — shared site-wide widget
 * Drop this in with a single tag on every page:
 *   <script src="/embed/useRbox.js" defer></script>
 * It injects its own CSS + markup and anchors itself top-right, above all
 * page content, on every page it's loaded on.
 *
 * Override the translator's location per-site (if it isn't served from
 * /map-merger-venti/) by setting window.RUDVENTUR_TRANSLATOR_URL before
 * this script runs.
 */
(function () {
  'use strict';

  var scriptEl = document.currentScript;
  var baseUrl = scriptEl ? new URL('.', scriptEl.src).href : './';

  function injectStylesheet() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = baseUrl + 'useRbox.css';
    document.head.appendChild(link);
  }

  function buildMarkup() {
    var root = document.createElement('div');
    root.id = 'topRightUser';
    root.innerHTML =
      '<div id="Rcircle" title="useR">R</div>' +
      '<div id="Ricons">' +
      '  <div class="Ricon" id="iconTranslator" title="Translator">🌐</div>' +
      '  <div class="Ricon" id="iconUser" title="useRbox">👤</div>' +
      '</div>' +
      '<div id="useRbox" class="hidden">' +
      '  <div class="useRbox-notch" id="useRboxNotch" title="Collapse / Expand">⟨⟩</div>' +
      '  <div class="useRbox-header">' +
      '    <strong>⚡ useRbox v2.0</strong>' +
      '    <div class="useRbox-header-btns">' +
      '      <button id="toggleTransparency" title="Toggle transparency">🌑</button>' +
      '      <button id="collapseUser" title="Collapse to notch">⤢</button>' +
      '      <button id="closeUser" title="Close">✖</button>' +
      '    </div>' +
      '  </div>' +
      '  <div id="liveClock">--:--:--</div>' +
      '  <div class="avatar-wrap">' +
      '    <div id="avatarHalftone"></div>' +
      '    <small>pure CSS halftone signature</small>' +
      '  </div>' +
      '  <label>👤 Username</label>' +
      '  <div class="field-row">' +
      '    <input type="text" id="username" value="Rudy" style="flex:1;">' +
      '    <button class="btn btn-small" id="refreshUser">🔄 Refresh</button>' +
      '  </div>' +
      '  <label>📡 Channel</label>' +
      '  <div class="field-row">' +
      '    <input type="text" id="channel" value="main" disabled style="flex:1;">' +
      '    <button class="btn btn-small" id="channelInfo">ℹ️</button>' +
      '  </div>' +
      '  <label>📝 P.S. (Personal Signature)</label>' +
      '  <textarea id="psignature" placeholder="Your personal motto, signature, or note..."></textarea>' +
      '  <label>📍 Current Location</label>' +
      '  <div class="field-row">' +
      '    <input type="text" id="currentLoc" placeholder="???" style="flex:1;">' +
      '    <button class="btn btn-small" id="gpsBtn">📍 GPS</button>' +
      '  </div>' +
      '  <div style="display:flex; gap:8px; margin-top:8px;">' +
      '    <div style="flex:1;"><label style="margin:0 0 4px;">Lat</label><input type="text" id="lat" placeholder="0.000000"></div>' +
      '    <div style="flex:1;"><label style="margin:0 0 4px;">Lon</label><input type="text" id="lon" placeholder="0.000000"></div>' +
      '  </div>' +
      '  <div class="gps-section">' +
      '    <label>📌 Saved GPS Locations</label>' +
      '    <div class="field-row" style="margin-top:8px;">' +
      '      <input type="text" id="gpsName" placeholder="Location name..." style="flex:1;">' +
      '      <button class="btn btn-small" id="saveGpsBtn">💾 Save</button>' +
      '    </div>' +
      '    <div id="gpsList"></div>' +
      '  </div>' +
      '  <div class="social-section">' +
      '    <div class="social-title">🌐 SOCIAL MEDIA</div>' +
      '    <div class="social-grid">' +
      '      <a href="https://github.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="GitHub">' +
      '        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>' +
      '      </a>' +
      '      <a href="https://discord.gg/rudventur" target="_blank" rel="noopener" class="social-icon" title="Discord">💬</a>' +
      '      <a href="https://twitter.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Twitter/X">𝕏</a>' +
      '      <a href="https://instagram.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Instagram">📷</a>' +
      '      <a href="https://youtube.com/@rudventur" target="_blank" rel="noopener" class="social-icon" title="YouTube">▶️</a>' +
      '      <a href="https://ko-fi.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Ko-fi">☕</a>' +
      '      <a href="https://tiktok.com/@rudventur" target="_blank" rel="noopener" class="social-icon" title="TikTok">🎵</a>' +
      '      <a href="https://linkedin.com/in/rudventur" target="_blank" rel="noopener" class="social-icon" title="LinkedIn">💼</a>' +
      '      <a href="https://reddit.com/u/rudventur" target="_blank" rel="noopener" class="social-icon" title="Reddit">🤖</a>' +
      '      <a href="https://facebook.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Facebook">📘</a>' +
      '      <a href="https://twitch.tv/rudventur" target="_blank" rel="noopener" class="social-icon" title="Twitch">🎮</a>' +
      '      <a href="https://snapchat.com/add/rudventur" target="_blank" rel="noopener" class="social-icon" title="Snapchat">👻</a>' +
      '      <a href="https://pinterest.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Pinterest">📌</a>' +
      '      <a href="https://t.me/rudventur" target="_blank" rel="noopener" class="social-icon" title="Telegram">✈️</a>' +
      '      <a href="https://wa.me/447594923008" target="_blank" rel="noopener" class="social-icon" title="WhatsApp">📱</a>' +
      '      <a href="mailto:RudVentur@gmail.com" class="social-icon" title="Email">📧</a>' +
      '    </div>' +
      '  </div>' +
      '  <label class="toggle"><input type="checkbox" id="saveMessages" checked><span>Save my messages</span></label>' +
      '  <button id="saveUser">💾 SAVE PROFILE</button>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function init() {
    injectStylesheet();
    var scope = buildMarkup();
    var q = function (sel) { return scope.querySelector(sel); };

    var savedLocations = [];
    var root = scope;
    var Rcircle = q('#Rcircle');
    var useRbox = q('#useRbox');
    var useRboxNotch = q('#useRboxNotch');

    Rcircle.onclick = function () { root.classList.toggle('open'); };
    q('#iconUser').onclick = function () { useRbox.classList.toggle('hidden'); };
    q('#closeUser').onclick = function () {
      useRbox.classList.add('hidden');
      root.classList.remove('open');
    };

    /* Collapse / notch — lighter minimize state, distinct from close */
    function setCollapsed(collapsed) {
      useRbox.classList.toggle('collapsed', collapsed);
      localStorage.setItem('rud_useRbox_collapsed', collapsed ? '1' : '0');
    }
    q('#collapseUser').onclick = function () { setCollapsed(true); };
    useRboxNotch.onclick = function () { setCollapsed(!useRbox.classList.contains('collapsed')); };
    if (localStorage.getItem('rud_useRbox_collapsed') === '1') useRbox.classList.add('collapsed');

    /* Transparency toggle */
    var PANEL_BG_SOLID = 'rgba(0, 15, 5, 0.96)';
    var PANEL_BG_TRANSPARENT = 'rgba(0, 15, 5, 0.35)';
    var panelTransparent = localStorage.getItem('rud_useRbox_transparent') === '1';
    function applyTransparency() {
      root.style.setProperty('--panel-bg', panelTransparent ? PANEL_BG_TRANSPARENT : PANEL_BG_SOLID);
      var btn = q('#toggleTransparency');
      btn.textContent = panelTransparent ? '👻' : '🌑';
      btn.title = panelTransparent ? 'Switch to solid background' : 'Switch to see-through background';
    }
    q('#toggleTransparency').onclick = function () {
      panelTransparent = !panelTransparent;
      localStorage.setItem('rud_useRbox_transparent', panelTransparent ? '1' : '0');
      applyTransparency();
    };
    applyTransparency();

    /* Live clock */
    function updateClock() {
      q('#liveClock').textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    }
    setInterval(updateClock, 1000);
    updateClock();

    /* GPS */
    q('#gpsBtn').onclick = function (event) {
      if (!navigator.geolocation) { alert('GPS not supported by your browser!'); return; }
      var btn = event.target;
      btn.textContent = '⏳...';
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        function (position) {
          var lat = position.coords.latitude.toFixed(6);
          var lon = position.coords.longitude.toFixed(6);
          q('#lat').value = lat;
          q('#lon').value = lon;
          q('#currentLoc').value = lat + ', ' + lon;
          btn.textContent = '✅ GPS';
          btn.disabled = false;
          setTimeout(function () { btn.textContent = '📍 GPS'; }, 2000);
        },
        function (error) {
          alert('GPS Error: ' + error.message);
          btn.textContent = '❌ GPS';
          btn.disabled = false;
          setTimeout(function () { btn.textContent = '📍 GPS'; }, 2000);
        }
      );
    };

    function renderGPSList() {
      var list = q('#gpsList');
      if (savedLocations.length === 0) {
        list.innerHTML = '<div style="text-align:center; opacity:0.5; padding:10px;">No saved locations</div>';
        return;
      }
      list.innerHTML = savedLocations.map(function (loc) {
        return '<div class="gps-item">' +
          '<div><div class="gps-item-name">' + escapeHtml(loc.name) + '</div>' +
          '<div class="gps-item-coords">' + loc.lat + ', ' + loc.lon + '</div></div>' +
          '<button class="gps-item-delete" data-id="' + loc.id + '">🗑️</button></div>';
      }).join('');
      Array.prototype.forEach.call(list.querySelectorAll('.gps-item-delete'), function (btn) {
        btn.onclick = function () {
          if (!confirm('Delete this location?')) return;
          var id = Number(btn.getAttribute('data-id'));
          savedLocations = savedLocations.filter(function (loc) { return loc.id !== id; });
          renderGPSList();
          persist();
        };
      });
    }

    q('#saveGpsBtn').onclick = function () {
      var name = q('#gpsName').value.trim();
      var lat = q('#lat').value.trim();
      var lon = q('#lon').value.trim();
      if (!name) { alert('Please enter a location name!'); return; }
      if (!lat || !lon) { alert('Please get GPS coordinates first!'); return; }
      savedLocations.push({ id: Date.now(), name: name, lat: lat, lon: lon });
      q('#gpsName').value = '';
      renderGPSList();
      persist();
    };

    /* Save / load user data */
    function collectUserData() {
      return {
        username: q('#username').value,
        channel: q('#channel').value,
        psignature: q('#psignature').value,
        currentLoc: q('#currentLoc').value,
        lat: q('#lat').value,
        lon: q('#lon').value,
        saveMessages: q('#saveMessages').checked,
        savedLocations: savedLocations
      };
    }
    function persist() {
      localStorage.setItem('rud_useRbox_v2', JSON.stringify(collectUserData()));
    }
    function saveUser() {
      persist();
      var btn = q('#saveUser');
      var oldText = btn.textContent;
      btn.textContent = '✅ SAVED!';
      btn.style.background = '#00ff41';
      setTimeout(function () {
        btn.textContent = oldText;
        btn.style.background = '';
      }, 2000);
    }
    function loadUser() {
      var data = localStorage.getItem('rud_useRbox_v2');
      if (!data) return;
      var u = JSON.parse(data);
      q('#username').value = u.username || 'Rudy';
      q('#channel').value = u.channel || 'main';
      q('#psignature').value = u.psignature || '';
      q('#currentLoc').value = u.currentLoc || '';
      q('#lat').value = u.lat || '';
      q('#lon').value = u.lon || '';
      q('#saveMessages').checked = u.saveMessages !== false;
      savedLocations = u.savedLocations || [];
      renderGPSList();
    }
    q('#refreshUser').onclick = loadUser;
    q('#channelInfo').onclick = function () { alert('Channel set on login!'); };
    q('#saveUser').onclick = saveUser;

    function loadChannel() {
      q('#channel').value = localStorage.getItem('rudventur_channel') || 'main';
    }

    /* Shared view mode — same key + URL param convention as translator_v7.html's
       goTo(), so opening the translator carries the current fullscreen/orientation
       state instead of resetting it. */
    var VIEW_MODE_KEY = 'rvViewMode';
    function currentViewMode() {
      return localStorage.getItem(VIEW_MODE_KEY) || '';
    }
    var TRANSLATOR_URL = window.RUDVENTUR_TRANSLATOR_URL || '/map-merger-venti/translator_v7.html';
    function goTo(url) {
      var mode = currentViewMode();
      var qs = mode && mode !== 'normal' ? '?view=' + encodeURIComponent(mode) : '';
      window.open(url + qs, '_blank', 'noopener');
    }
    q('#iconTranslator').onclick = function () { goTo(TRANSLATOR_URL); };

    loadUser();
    loadChannel();

    console.log('👤 useRbox v2.0 loaded (shared embed)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
