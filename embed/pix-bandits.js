/**
 * PIX Emoji Bandits — Cheese Casino–style 3-bandit challenge generator
 * Soft neon aesthetic for the Popcorn Hub PIX tab.
 *
 * Unicode source: curated from emoji-data / Unicode Emoji (camera-friendly
 * objects, places, weather, vehicles, animals, food, clothing). No skin-tone
 * modifiers; prefer single-codepoint or common ZWJ sequences that render widely.
 *
 * ZWJ NOTE — some challenge glyphs are *emoji sequences*, not single code
 * points: several emoji glued with U+200D ZERO WIDTH JOINER (and often a
 * U+FE0F variation selector), e.g. 👨‍👩‍👧 family, 🚴‍♀️ woman biking,
 * 🏳️‍🌈 rainbow flag, 🐕‍🦺 service dog. Treat every catalogue entry as ONE
 * opaque string (never split by code unit / Array.from), and expect older
 * fonts to draw them as 2–3 separate glyphs. PixBandits.isSequence(e) tells
 * you whether a target is a ZWJ sequence so hosts can hint it in the UI.
 *
 * Public API (window.PixBandits):
 *   mount(rootEl)           — build UI into #pix-bandits-root (or given node)
 *   spinAll()               — spin all 3 bandits; returns challenge
 *   resetBandit(index)      — reshuffle + re-roll one bandit (0..2)
 *   getChallenge()          — { title, indicators, landed, centers }
 *   getCounts()             — master / theme / reel sizes
 *   onChange(fn)            — subscribe to challenge updates; the challenge
 *                             carries .reason ('spin' | 'reset' | 'mount')
 *   isSequence(emoji)       — true for ZWJ emoji sequences (👨‍👩‍👧 🚴‍♀️ 🏳️‍🌈)
 *
 * HOOK — future statistics & probability:
 *   PixBandits._stats hooks are stubbed below (spin counts, per-emoji hits,
 *   empirical frequencies). Wire analytics here without changing spin UX.
 */
(function (global) {
  'use strict';

  // ── Master emoji catalogue (camera-friendly) ─────────────────────────────
  // Grouped for readability; flattened into MASTER_LIST.
  var THEME_A_NATURE_CITY = [
    // Nature / plants
    '🌳', '🌲', '🌴', '🌵', '🌿', '🍀', '🍃', '🍂', '🍁', '🌱', '🪴', '🌸',
    '🌺', '🌻', '🌹', '🌷', '🌼', '🌾', '💐', '🪵',
    // Landforms / outdoors
    '🏔️', '⛰️', '🌋', '🏕️', '🏖️', '🏝️', '🏜️', '🏞️', '🗻', '🪨', '🕳️', '🌊',
    // City / buildings / places
    '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏬', '🏭',
    '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '⛲', '🏛️',
    '🌉', '🌆', '🌇', '🌃', '🏙️', '🚏', '🛤️', '🛣️', '🗿', '🏟️', '🏗️', '🧱'
  ];

  var THEME_B_PROPS = [
    // Vehicles
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚',
    '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '✈️', '🚁', '🚂', '🚆', '🚇', '🚊',
    '⛵', '🚤', '⛴️', '🛳️', '🚀', '🛸', '🛶', '🚂',
    // ZWJ sequences (one target each — see ZWJ NOTE above)
    '🚴‍♀️', '🚴‍♂️', '🧑‍🦽',
    // Food / drink (easy photo subjects)
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🍍', '🥝',
    '🍅', '🥑', '🌽', '🥕', '🥦', '🍞', '🧀', '🍕', '🍔', '🌭', '🌮', '🍿',
    '🍩', '🍪', '🧁', '🍦', '☕', '🍵', '🧃', '🥤',
    // Clothing / props / objects
    '👒', '🎩', '🎓', '🧢', '👓', '🕶️', '🧣', '🧤', '🧥', '👔', '👕', '👖',
    '👗', '👘', '👟', '👠', '🥾', '🧦', '👜', '🎒', '☂️', '🌂',
    '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📸', '🔦', '💡', '🕯️', '📚',
    '✏️', '🖊️', '📎', '📌', '🔑', '🗝️', '🔨', '🔧', '🪛', '🧲', '🧸', '🎁',
    '🎈', '🎀', '⚽', '🏀', '🎾', '🏐', '🎱', '🏓', '🎸', '🎹', '🥁', '🎺'
  ];

  var THEME_C_SKY_LIFE = [
    // Sky / weather / time
    '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️',
    '⛄', '💨', '🌪️', '🌫️', '🌈', '🌙', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗',
    '⭐', '🌟', '✨', '☄️', '💫', '🌌', '🌃', '🕐', '🕑', '🕒', '🕓', '🕔',
    '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '⏳', '⌛', '⏰', '🕰️', '🗓️',
    // Animals (photo-friendly)
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
    '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
    '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🐢', '🐙', '🐠',
    '🐟', '🐬', '🐳', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🐪',
    '🦒', '🦘', '🦥', '🦦', '🦨', '🦩', '🦚', '🦜',
    // ZWJ sequences (one target each — see ZWJ NOTE above)
    '👨‍👩‍👧', '🏳️‍🌈', '🐕‍🦺', '🐈‍⬛', '🐻‍❄️'
  ];

  // Deduplicate within each theme (theme B had a duplicate 🚂)
  function unique(arr) {
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      if (!seen[arr[i]]) {
        seen[arr[i]] = 1;
        out.push(arr[i]);
      }
    }
    return out;
  }

  THEME_A_NATURE_CITY = unique(THEME_A_NATURE_CITY);
  THEME_B_PROPS = unique(THEME_B_PROPS);
  THEME_C_SKY_LIFE = unique(THEME_C_SKY_LIFE);

  var MASTER_LIST = unique(
    THEME_A_NATURE_CITY.concat(THEME_B_PROPS).concat(THEME_C_SKY_LIFE)
  );

  var REEL_SIZE = 12;
  var BANDIT_META = [
    { id: 'A', label: '🌿 Nature / City', theme: THEME_A_NATURE_CITY, accent: '#00ff41' },
    { id: 'B', label: '🎒 Props / Ride', theme: THEME_B_PROPS, accent: '#ffd700' },
    { id: 'C', label: '🌤️ Sky / Life', theme: THEME_C_SKY_LIFE, accent: '#7ec8ff' }
  ];

  // ── Stats / probability hook (future) ────────────────────────────────────
  // TODO(stats): persist spin tallies, per-emoji hit rates, and expose
  // PixBandits.getProbabilities() for fairness audits & soft difficulty curves.
  var _stats = {
    spinsTotal: 0,
    spinsPerBandit: [0, 0, 0],
    emojiHits: Object.create(null),
    lastSpinAt: null,
    recordSpin: function (banditIndex, landed) {
      this.spinsTotal++;
      this.spinsPerBandit[banditIndex]++;
      this.lastSpinAt = Date.now();
      for (var i = 0; i < landed.length; i++) {
        var e = landed[i];
        this.emojiHits[e] = (this.emojiHits[e] || 0) + 1;
      }
      // Future: emit CustomEvent('pix-bandits-spin', { detail: {...} })
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  // ZWJ = U+200D. A catalogue entry containing it is an emoji *sequence*.
  function isSequence(e) {
    return typeof e === 'string' && e.indexOf('\u200D') !== -1;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function pickReelPool(theme, size, avoidSet) {
    var pool = shuffle(theme.filter(function (e) {
      return !avoidSet || !avoidSet[e];
    }));
    // Fall back to full theme if avoid filtered too hard
    if (pool.length < size) pool = shuffle(theme.slice());
    var reel = [];
    var used = Object.create(null);
    for (var i = 0; i < pool.length && reel.length < size; i++) {
      if (!used[pool[i]]) {
        used[pool[i]] = 1;
        reel.push(pool[i]);
      }
    }
    // Pad from master if theme somehow too small (shouldn't happen)
    if (reel.length < size) {
      var pad = shuffle(MASTER_LIST);
      for (var k = 0; k < pad.length && reel.length < size; k++) {
        if (!used[pad[k]]) {
          used[pad[k]] = 1;
          reel.push(pad[k]);
        }
      }
    }
    return reel;
  }

  function pickOne(reel) {
    return reel[Math.floor(Math.random() * reel.length)];
  }

  // ── State ────────────────────────────────────────────────────────────────
  var state = {
    bandits: [], // [{ reels: [[emoji×12]×3], landed: [e,e,e] }]
    root: null,
    listeners: []
  };

  function ensureBandits() {
    if (state.bandits.length === 3) return;
    state.bandits = BANDIT_META.map(function (meta) {
      return buildBandit(meta);
    });
  }

  function buildBandit(meta) {
    var usedAcross = Object.create(null);
    var reels = [];
    for (var r = 0; r < 3; r++) {
      var reel = pickReelPool(meta.theme, REEL_SIZE, usedAcross);
      for (var i = 0; i < reel.length; i++) usedAcross[reel[i]] = 1;
      reels.push(reel);
    }
    var landed = reels.map(pickOne);
    return { meta: meta, reels: reels, landed: landed };
  }

  function reshuffleBandit(index) {
    var meta = BANDIT_META[index];
    state.bandits[index] = buildBandit(meta);
    // Re-roll immediately so UI shows fresh lands
    spinBandit(index, false);
  }

  function spinBandit(index, record) {
    var b = state.bandits[index];
    b.landed = b.reels.map(pickOne);
    if (record !== false) _stats.recordSpin(index, b.landed);
    return b.landed;
  }

  function challengeFromState() {
    // Challenge = center reel of each bandit (soft “payline” across 3 machines)
    var centers = state.bandits.map(function (b) {
      return b.landed[1];
    });
    var landed = state.bandits.map(function (b) {
      return b.landed.slice();
    });
    return {
      title: centers.join(' '),
      indicators: centers.slice(),
      centers: centers,
      landed: landed
    };
  }

  function notify(reason) {
    var ch = challengeFromState();
    ch.reason = reason || 'spin';
    for (var i = 0; i < state.listeners.length; i++) {
      try { state.listeners[i](ch); } catch (e) {}
    }
    return ch;
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function poolListHtml(bandit) {
    var flat = [];
    var seen = Object.create(null);
    for (var r = 0; r < bandit.reels.length; r++) {
      for (var i = 0; i < bandit.reels[r].length; i++) {
        var e = bandit.reels[r][i];
        if (!seen[e]) {
          seen[e] = 1;
          flat.push(e);
        }
      }
    }
    return flat.map(function (e) {
      var seq = isSequence(e);
      return '<span class="pix-bandit-pool-emoji' + (seq ? ' is-zwj' : '') + '" title="' + escapeAttr(e) +
        (seq ? ' · emoji sequence (ZWJ)' : '') + '">' + e + '</span>';
    }).join('');
  }

  function render() {
    if (!state.root) return;
    ensureBandits();
    var html = '<div class="pix-bandits" role="group" aria-label="Emoji challenge bandits">';
    html += '<div class="pix-bandits-header">🎰 Emoji Bandits <span class="pix-bandits-sub">spin for a 3-emoji challenge</span></div>';
    html += '<div class="pix-bandits-row">';

    for (var i = 0; i < state.bandits.length; i++) {
      var b = state.bandits[i];
      var accent = b.meta.accent;
      html += '<div class="pix-bandit" data-bandit="' + i + '" style="--bandit-accent:' + accent + '">';
      html += '<div class="pix-bandit-label">' + escapeAttr(b.meta.label) + '</div>';
      // Above: pool list
      html += '<div class="pix-bandit-pool" aria-label="Reel pool">' + poolListHtml(b) + '</div>';
      // Reels
      html += '<div class="pix-bandit-reels">';
      for (var r = 0; r < 3; r++) {
        var isCenter = r === 1;
        html += '<div class="pix-bandit-reel' + (isCenter ? ' is-center' : '') + '" data-reel="' + r + '">';
        var lz = isSequence(b.landed[r]);
        html += '<span class="pix-bandit-landed' + (lz ? ' is-zwj' : '') + '"' +
          (lz ? ' title="Emoji sequence (ZWJ) — counts as one target"' : '') + '>' + b.landed[r] + '</span>';
        html += '</div>';
      }
      html += '</div>';
      // Under: Reset + stats hook comment target
      html += '<button type="button" class="pp-btn pix-bandit-reset" data-reset="' + i + '" title="Reshuffle this bandit’s pools and re-roll">🔄 Reset</button>';
      // HOOK: future statistics & probability panel mounts beside/under Reset
      html += '<div class="pix-bandit-stats-hook" data-stats-bandit="' + i + '" hidden><!-- stats & probability --></div>';
      html += '</div>';
    }

    html += '</div>';
    html += '<button type="button" class="pp-btn pix-bandits-spin-all" id="pix-bandits-spin-all">🎰 Spin all bandits</button>';
    html += '</div>';

    state.root.innerHTML = html;

    // Bind resets
    var resets = state.root.querySelectorAll('[data-reset]');
    for (var j = 0; j < resets.length; j++) {
      resets[j].addEventListener('click', function (ev) {
        var idx = parseInt(ev.currentTarget.getAttribute('data-reset'), 10);
        api.resetBandit(idx);
      });
    }
    var spinAllBtn = state.root.querySelector('#pix-bandits-spin-all');
    if (spinAllBtn) {
      spinAllBtn.addEventListener('click', function () {
        api.spinAll();
      });
    }
  }

  function flashReels() {
    if (!state.root) return;
    var reels = state.root.querySelectorAll('.pix-bandit-reel');
    for (var i = 0; i < reels.length; i++) {
      reels[i].classList.remove('spinning');
      // force reflow
      void reels[i].offsetWidth;
      reels[i].classList.add('spinning');
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────
  var api = {
    REEL_SIZE: REEL_SIZE,
    MASTER_LIST: MASTER_LIST,
    _stats: _stats,

    mount: function (rootEl) {
      state.root = typeof rootEl === 'string'
        ? document.querySelector(rootEl)
        : rootEl;
      if (!state.root) return null;
      ensureBandits();
      render();
      return notify('mount');
    },

    isSequence: isSequence,

    spinAll: function () {
      ensureBandits();
      for (var i = 0; i < 3; i++) spinBandit(i, true);
      render();
      flashReels();
      return notify('spin');
    },

    resetBandit: function (index) {
      ensureBandits();
      index = index | 0;
      if (index < 0 || index > 2) return challengeFromState();
      reshuffleBandit(index);
      render();
      flashReels();
      return notify('reset');
    },

    getChallenge: function () {
      ensureBandits();
      return challengeFromState();
    },

    getCounts: function () {
      ensureBandits();
      return {
        master: MASTER_LIST.length,
        themes: {
          A_nature_city: THEME_A_NATURE_CITY.length,
          B_props_ride: THEME_B_PROPS.length,
          C_sky_life: THEME_C_SKY_LIFE.length
        },
        reelSize: REEL_SIZE,
        bandits: state.bandits.map(function (b) {
          return {
            id: b.meta.id,
            label: b.meta.label,
            reelSizes: b.reels.map(function (r) { return r.length; }),
            poolUnique: (function () {
              var s = Object.create(null);
              var n = 0;
              for (var r = 0; r < b.reels.length; r++) {
                for (var i = 0; i < b.reels[r].length; i++) {
                  if (!s[b.reels[r][i]]) { s[b.reels[r][i]] = 1; n++; }
                }
              }
              return n;
            })()
          };
        })
      };
    },

    onChange: function (fn) {
      if (typeof fn === 'function') state.listeners.push(fn);
      return function unsubscribe() {
        state.listeners = state.listeners.filter(function (f) { return f !== fn; });
      };
    },

    // Force a first spin without UI (for hosts that render challenge first)
    ensure: function () {
      ensureBandits();
      return challengeFromState();
    }
  };

  global.PixBandits = api;
})(typeof window !== 'undefined' ? window : this);
