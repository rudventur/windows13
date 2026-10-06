/**
 * PIX Emoji Bandits — Cheese Casino–style 3-bandit challenge generator
 * Soft neon aesthetic for the Popcorn Hub PIX PANEL.
 *
 * Unicode source: curated from emoji-data / Unicode Emoji. Every entry should
 * be something a camera can actually find (or a face the player can pull).
 * No skin-tone modifiers, no people-composition or identity glyphs (no pride
 * or other identity flags, no family / couple sequences, no gendered person
 * variants, no religious buildings) — just things, nature, animals, food,
 * vehicles, sky, faces, sound makers, places and clothing.
 *
 * KINGDOMS — the master pool is regrouped into ten logical kingdoms
 * (KINGDOMS below). Each bandit is fed by one or more kingdoms (tick boxes in
 * the bandit options window); its three reels are drawn from the union of the
 * kingdoms it is fed by. Every emoji lives in exactly ONE kingdom so a
 * landed emoji always has a single kingdom for jackpot checks.
 *
 * ZWJ NOTE — a few entries are *emoji sequences*, not single code points:
 * two emoji glued with U+200D ZERO WIDTH JOINER (sometimes plus a U+FE0F
 * variation selector). The ones we keep are neutral and camera-findable:
 * 🐕‍🦺 service dog, 🐈‍⬛ black cat, 🐻‍❄️ polar bear and 😮‍💨 face exhaling.
 * Treat every catalogue entry as ONE opaque string (never split by code unit
 * or Array.from) and expect older fonts to draw them as 2 separate glyphs.
 * PixBandits.isSequence(e) tells hosts whether a target is a ZWJ sequence.
 * (🚴 person biking is a plain single emoji — the gendered ZWJ variants were
 * dropped along with the identity / family sequences.)
 *
 * JACKPOT → EASIER PICTURE (the rule; the PIX PANEL scene applies it)
 *   The payline is the centre reel of each bandit (3 emojis). Its jackpot
 *   tier is:
 *     0  no jackpot          — three different kingdoms
 *     1  kingdom pair        — two payline emojis share a kingdom
 *     2  kingdom triple      — all three share a kingdom
 *     3  exact match         — at least two payline emojis are identical
 *   The "jackpot ease" slider (0 tough · 1 fair · 2 kind · 3 gentle) turns
 *   the tier into ease steps:   easeSteps = tier × ease.
 *   Each ease step removes one object indicator from the camera challenge,
 *   smallest first (small → medium → geo-nature → big). The background
 *   indicator is never removed. Steps left over once only one object remains
 *   turn the remaining objects into free "unallocated" indicators (any place,
 *   any size). So: the bigger the jackpot, the fewer / looser the indicators.
 *
 * Public API (window.PixBandits):
 *   mount(rootEl)           — build UI into #pix-bandits-root (or given node)
 *   mountOptions(el)        — build the bandit options window body into el
 *   spinAll()               — spin all 3 bandits; returns challenge
 *   resetBandit(index)      — reshuffle + re-roll one bandit (0..2)
 *   getChallenge()          — { title, indicators, landed, centers,
 *                               kingdoms, jackpot:{tier,label,kingdom} }
 *   getCounts()             — master / kingdom / reel sizes
 *   getOptions()            — { kingdoms:[[ids]×3], ease }
 *   setBanditKingdoms(i, ids), setEase(n)
 *   kingdomOf(emoji)        — kingdom id, or null
 *   jackpotFor(centers)     — { tier, label, kingdom }
 *   onChange(fn)            — subscribe; challenge carries .reason
 *                             ('spin' | 'reset' | 'mount' | 'options' | 'ease')
 *   isSequence(emoji)       — true for ZWJ emoji sequences (🐕‍🦺 🐈‍⬛ 🐻‍❄️)
 *   KINGDOMS, FLAGS, MASTER_LIST
 *
 * HOOK — future statistics & probability:
 *   PixBandits._stats hooks are stubbed below (spin counts, per-emoji hits,
 *   empirical frequencies). Wire analytics here without changing spin UX.
 */
(function (global) {
  'use strict';

  // ── Kingdoms (the master emoji pool, regrouped) ─────────────────────────
  var KINGDOMS = [
    { id: 'things', icon: '🧸', label: 'Things', list: [
      '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '📷', '🔦', '💡', '🕯️', '📚',
      '📖', '✏️', '🖊️', '🖍️', '📎', '📌', '✂️', '🔑', '🗝️', '🔨', '🔧', '🪛',
      '🧲', '🧸', '🎁', '🎈', '🎀', '⚽', '🏀', '🎾', '🏐', '🎱', '🏓', '🎲',
      '🧩', '🪁', '🎮', '♟️', '🛒', '🧹', '🪣', '🧴', '🧽', '🧻', '🪑', '🛏️',
      '🚪', '🪞', '🪟', '🧺', '☂️', '🌂', '🕰️', '⌛', '⏳', '🎨', '🖼️', '🔋',
      '🔌', '🪜', '🗑️', '🧶', '📦', '✉️', '🏺', '🧭', '🔭',
      // flags (camera-findable: race, beach, white and black flags)
      '🏁', '🚩', '🏳️', '🏴'
    ] },
    { id: 'nature', icon: '🌿', label: 'Nature / Geo', list: [
      '🌳', '🌲', '🌴', '🌵', '🌿', '🍀', '🍃', '🍂', '🍁', '🌱', '🪴', '🌸',
      '🌺', '🌻', '🌹', '🌷', '🌼', '🌾', '💐', '🪵', '🍄', '🐚', '🪨', '🏔️',
      '⛰️', '🌋', '🗻', '🌊', '🏖️', '🏝️', '🏜️', '🏞️', '🕳️', '💧', '🔥'
    ] },
    { id: 'animals', icon: '🐾', label: 'Animals', list: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
      '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🐢', '🐙', '🐠',
      '🐟', '🐬', '🐳', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🐪',
      '🦒', '🦘', '🦥', '🦦', '🦨', '🦩', '🦚', '🦜', '🐕', '🐈', '🐿️', '🦔',
      '🐑', '🐐', '🦢', '🕊️',
      // ZWJ sequences (one target each — see ZWJ NOTE above)
      '🐕‍🦺', '🐈‍⬛', '🐻‍❄️'
    ] },
    { id: 'food', icon: '🍎', label: 'Food', list: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🍍', '🥝',
      '🍅', '🥑', '🌽', '🥕', '🥦', '🥔', '🧅', '🍞', '🥐', '🥨', '🧀', '🥚',
      '🍳', '🍕', '🍔', '🍟', '🌭', '🌮', '🥪', '🍝', '🍜', '🍣', '🍿', '🍩',
      '🍪', '🧁', '🍰', '🎂', '🍫', '🍬', '🍭', '🍦', '🍯', '☕', '🍵', '🧃',
      '🥤', '🥛', '🧋'
    ] },
    { id: 'vehicles', icon: '🚗', label: 'Vehicles', list: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚',
      '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '✈️', '🚁', '🚂', '🚆', '🚇',
      '🚊', '🚋', '⛵', '🚤', '⛴️', '🛳️', '🚀', '🛸', '🛶', '🚡', '🚠', '🛺',
      '🦽', '🚴'
    ] },
    { id: 'weather', icon: '🌤️', label: 'Weather / Sky', list: [
      '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️',
      '⛄', '💨', '🌪️', '🌫️', '🌈', '🌙', '🌛', '🌜', '🌕', '🌖', '🌗', '🌘',
      '🌑', '⭐', '🌟', '✨', '☄️', '🌌', '🌅', '🌄', '🌠', '🌡️', '☔', '⚡'
    ] },
    { id: 'faces', icon: '😀', label: 'Emotions / Faces', list: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🙂', '🙃', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😋', '😛', '😜', '🤪', '🤔', '🤨', '😐', '😑',
      '😶', '🙄', '😏', '😮', '😯', '😲', '😳', '🥺', '😢', '😭', '😤', '😠',
      '😡', '🤯', '😱', '😴', '🥱', '🤓', '😎', '🥳', '🤠',
      // ZWJ sequence (one target — see ZWJ NOTE above)
      '😮‍💨'
    ] },
    { id: 'sounds', icon: '🔔', label: 'Sounds', list: [
      // things that make a sound
      '🔔', '🛎️', '🥁', '🪘', '🎺', '🎷', '🎸', '🪕', '🎻', '🎹', '🪗', '📯',
      '📢', '📣', '📻', '🔊', '🎤', '🎙️', '🎧', '☎️', '📞', '🚨', '⏰', '🫖'
    ] },
    { id: 'places', icon: '🏛️', label: 'Places / Buildings', list: [
      '🏠', '🏡', '🏘️', '🏚️', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫',
      '🏬', '🏭', '🏯', '🏰', '🗼', '🗽', '⛲', '🏛️', '🌉', '🌁', '🌆', '🌇',
      '🌃', '🏙️', '🚏', '🛤️', '🛣️', '🗿', '🏟️', '🏗️', '🧱', '🏕️', '⛺', '🎡',
      '🎢', '🎠', '💈', '🚦', '⛽', '🅿️'
    ] },
    { id: 'clothing', icon: '👕', label: 'Clothing', list: [
      '👒', '🎩', '🎓', '🧢', '⛑️', '👓', '🕶️', '🥽', '🧣', '🧤', '🧥', '👔',
      '👕', '👖', '🩳', '👗', '👘', '👚', '👟', '👞', '👠', '👡', '👢', '🥾',
      '🩴', '🧦', '👜', '👛', '🎒', '💼', '🧳', '💍', '👑'
    ] }
  ];

  var FLAGS = ['🏁', '🚩', '🏳️', '🏴'];

  function unique(arr) {
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      if (!seen[arr[i]]) { seen[arr[i]] = 1; out.push(arr[i]); }
    }
    return out;
  }

  // Every emoji belongs to exactly one kingdom: first kingdom wins.
  var KINGDOM_BY_ID = Object.create(null);
  var KINGDOM_OF = Object.create(null);
  var MASTER_LIST = [];
  KINGDOMS.forEach(function (k) {
    k.list = unique(k.list).filter(function (e) { return !KINGDOM_OF[e]; });
    k.list.forEach(function (e) { KINGDOM_OF[e] = k.id; MASTER_LIST.push(e); });
    KINGDOM_BY_ID[k.id] = k;
  });

  var REEL_SIZE = 12;
  var BANDIT_META = [
    { id: 'A', accent: '#00ff41', defaults: ['nature', 'places', 'weather'] },
    { id: 'B', accent: '#ffd700', defaults: ['things', 'vehicles', 'food', 'clothing'] },
    { id: 'C', accent: '#7ec8ff', defaults: ['animals', 'sounds', 'faces'] }
  ];
  var EASE_LABELS = ['tough', 'fair', 'kind', 'gentle'];

  // ── Options (which kingdoms feed each bandit + jackpot ease) ────────────
  var OPTS_KEY = 'rudventur_pix_bandit_opts_v1';
  var options = loadOptions();

  function validKingdoms(ids) {
    var out = (Array.isArray(ids) ? ids : []).filter(function (id) { return !!KINGDOM_BY_ID[id]; });
    return unique(out);
  }

  function loadOptions() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(OPTS_KEY) || 'null'); } catch (e) {}
    var kingdoms = BANDIT_META.map(function (m, i) {
      var ids = o && o.kingdoms ? validKingdoms(o.kingdoms[i]) : [];
      return ids.length ? ids : m.defaults.slice();
    });
    var ease = o && typeof o.ease === 'number' ? Math.max(0, Math.min(3, Math.round(o.ease))) : 1;
    return { kingdoms: kingdoms, ease: ease };
  }

  function saveOptions() {
    try { localStorage.setItem(OPTS_KEY, JSON.stringify(options)); } catch (e) {}
  }

  function poolFor(index) {
    var pool = [];
    options.kingdoms[index].forEach(function (id) { pool = pool.concat(KINGDOM_BY_ID[id].list); });
    return unique(pool);
  }

  function banditLabel(index) {
    return BANDIT_META[index].id + ' · ' + options.kingdoms[index].map(function (id) {
      return KINGDOM_BY_ID[id].icon;
    }).join(' ');
  }

  // ── Stats / probability hook (future) ────────────────────────────────────
  // TODO(stats): persist spin tallies, per-emoji hit rates, and expose
  // PixBandits.getProbabilities() for fairness audits & soft difficulty curves.
  var _stats = {
    spinsTotal: 0,
    spinsPerBandit: [0, 0, 0],
    emojiHits: Object.create(null),
    jackpots: [0, 0, 0, 0],
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

  function kingdomOf(e) { return KINGDOM_OF[e] || null; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pickReelPool(theme, size, avoidSet) {
    var pool = shuffle(theme.filter(function (e) { return !avoidSet || !avoidSet[e]; }));
    // Fall back to the full pool if avoiding repeats filtered too hard
    if (pool.length < size) pool = shuffle(theme.slice());
    var reel = [];
    var used = Object.create(null);
    for (var i = 0; i < pool.length && reel.length < size; i++) {
      if (!used[pool[i]]) { used[pool[i]] = 1; reel.push(pool[i]); }
    }
    if (reel.length < size) {
      var pad = shuffle(MASTER_LIST);
      for (var k = 0; k < pad.length && reel.length < size; k++) {
        if (!used[pad[k]]) { used[pad[k]] = 1; reel.push(pad[k]); }
      }
    }
    return reel;
  }

  function pickOne(reel) { return reel[Math.floor(Math.random() * reel.length)]; }

  // Jackpot tier for a payline — see JACKPOT → EASIER PICTURE at the top.
  function jackpotFor(centers) {
    var c = (centers || []).filter(Boolean);
    var ks = c.map(kingdomOf);
    var identical = c.length !== unique(c).length;
    if (identical) {
      return { tier: 3, kingdom: null, label: 'Exact match' };
    }
    var counts = Object.create(null);
    var best = null;
    ks.forEach(function (k) {
      if (!k) return;
      counts[k] = (counts[k] || 0) + 1;
      if (!best || counts[k] > counts[best]) best = k;
    });
    var n = best ? counts[best] : 0;
    if (n >= 3) return { tier: 2, kingdom: best, label: 'Kingdom triple' };
    if (n === 2) return { tier: 1, kingdom: best, label: 'Kingdom pair' };
    return { tier: 0, kingdom: null, label: 'No jackpot' };
  }

  // ── State ────────────────────────────────────────────────────────────────
  var state = {
    bandits: [], // [{ reels: [[emoji×12]×3], landed: [e,e,e] }]
    root: null,
    optsRoot: null,
    listeners: []
  };

  function ensureBandits() {
    if (state.bandits.length === 3) return;
    state.bandits = BANDIT_META.map(function (meta, i) { return buildBandit(i); });
  }

  function buildBandit(index) {
    var theme = poolFor(index);
    var usedAcross = Object.create(null);
    var reels = [];
    for (var r = 0; r < 3; r++) {
      var reel = pickReelPool(theme, REEL_SIZE, usedAcross);
      for (var i = 0; i < reel.length; i++) usedAcross[reel[i]] = 1;
      reels.push(reel);
    }
    return { meta: BANDIT_META[index], reels: reels, landed: reels.map(pickOne) };
  }

  function reshuffleBandit(index) {
    state.bandits[index] = buildBandit(index);
    spinBandit(index, false);
  }

  function spinBandit(index, record) {
    var b = state.bandits[index];
    b.landed = b.reels.map(pickOne);
    if (record !== false) _stats.recordSpin(index, b.landed);
    return b.landed;
  }

  function challengeFromState() {
    // Challenge = centre reel of each bandit (soft “payline” across 3 machines)
    var centers = state.bandits.map(function (b) { return b.landed[1]; });
    var landed = state.bandits.map(function (b) { return b.landed.slice(); });
    return {
      title: centers.join(' '),
      indicators: centers.slice(),
      centers: centers,
      kingdoms: centers.map(kingdomOf),
      jackpot: jackpotFor(centers),
      ease: options.ease,
      pools: options.kingdoms.map(function (ids) { return ids.slice(); }),
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
        if (!seen[e]) { seen[e] = 1; flat.push(e); }
      }
    }
    return flat.map(function (e) {
      var seq = isSequence(e);
      var k = KINGDOM_BY_ID[kingdomOf(e)];
      return '<span class="pix-bandit-pool-emoji' + (seq ? ' is-zwj' : '') + '" title="' + escapeAttr(e) +
        (k ? ' · ' + escapeAttr(k.label) : '') + (seq ? ' · emoji sequence (ZWJ)' : '') + '">' + e + '</span>';
    }).join('');
  }

  function jackpotHtml(ch) {
    var j = ch.jackpot;
    var steps = j.tier * options.ease;
    var k = j.kingdom ? KINGDOM_BY_ID[j.kingdom] : null;
    if (!j.tier) {
      return '<div class="pix-jackpot is-none">No jackpot — the full picture challenge</div>';
    }
    var what = j.tier === 3 ? 'identical emojis' : (j.tier === 2 ? 'all three from ' : 'two from ') + (k ? k.icon + ' ' + k.label : '');
    return '<div class="pix-jackpot is-tier-' + j.tier + '">🎉 Jackpot · ' + escapeAttr(j.label) + ' (' + escapeAttr(what) + ') → ' +
      (steps ? steps + ' ease step' + (steps === 1 ? '' : 's') + ', easier picture' : 'ease is set to tough, no change') + '</div>';
  }

  function render() {
    if (!state.root) return;
    ensureBandits();
    var html = '<div class="pix-bandits" role="group" aria-label="Emoji challenge bandits">';
    html += '<div class="pix-bandits-header">🎰 Emoji Bandits <span class="pix-bandits-sub">fed by kingdoms · ⚙ to change</span></div>';
    html += '<div class="pix-bandits-row">';

    for (var i = 0; i < state.bandits.length; i++) {
      var b = state.bandits[i];
      var kNames = options.kingdoms[i].map(function (id) { return KINGDOM_BY_ID[id].label; }).join(', ');
      html += '<div class="pix-bandit" data-bandit="' + i + '" style="--bandit-accent:' + b.meta.accent + '">';
      html += '<div class="pix-bandit-label" title="Fed by: ' + escapeAttr(kNames) + '">' + escapeAttr(banditLabel(i)) + '</div>';
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
    html += jackpotHtml(challengeFromState());
    html += '<button type="button" class="pp-btn pix-bandits-spin-all" id="pix-bandits-spin-all">🎰 Spin all bandits</button>';
    html += '</div>';

    state.root.innerHTML = html;

    var resets = state.root.querySelectorAll('[data-reset]');
    for (var j = 0; j < resets.length; j++) {
      resets[j].addEventListener('click', function (ev) {
        api.resetBandit(parseInt(ev.currentTarget.getAttribute('data-reset'), 10));
      });
    }
    var spinAllBtn = state.root.querySelector('#pix-bandits-spin-all');
    if (spinAllBtn) spinAllBtn.addEventListener('click', function () { api.spinAll(); });
  }

  // Bandit options window body: kingdom tick boxes per bandit + the jackpot
  // ease spectrum-bracket slider. The host supplies the window chrome.
  function renderOptions() {
    var el = state.optsRoot;
    if (!el) return;
    var e = options.ease;
    var html = '<div class="pix-spectrum" style="--spec-pos:' + (e / 3 * 100) + '%">';
    html += '<label class="pix-spectrum-head" for="pix-opt-ease">🎯 Jackpot ease <strong id="pix-opt-ease-val">' + EASE_LABELS[e] + '</strong></label>';
    html += '<input type="range" id="pix-opt-ease" min="0" max="3" step="1" value="' + e + '" aria-describedby="pix-opt-ease-help">';
    html += '<div class="pix-spectrum-brackets" aria-hidden="true"><span>⟦ tough</span><span>fair</span><span>kind</span><span>gentle ⟧</span></div>';
    html += '<p class="pix-opt-note" id="pix-opt-ease-help">Bigger jackpot = easier picture. Ease steps = jackpot tier × this slider. ' +
      'Tiers: two from one kingdom = 1, all three from one kingdom = 2, identical emojis = 3. ' +
      'Each step removes one indicator (smallest first); extra steps free the rest (any place, any size).</p>';
    html += '</div>';
    html += '<p class="pix-opt-note">Tick the kingdoms that feed each bandit. Every bandit keeps at least one.</p>';
    for (var i = 0; i < BANDIT_META.length; i++) {
      html += '<fieldset class="pix-opt-bandit" style="--bandit-accent:' + BANDIT_META[i].accent + '">';
      html += '<legend>Bandit ' + BANDIT_META[i].id + ' <span>' + poolFor(i).length + ' emojis</span></legend>';
      html += '<div class="pix-opt-kingdoms">';
      for (var k = 0; k < KINGDOMS.length; k++) {
        var kg = KINGDOMS[k];
        var on = options.kingdoms[i].indexOf(kg.id) !== -1;
        html += '<label class="pix-opt-k' + (on ? ' on' : '') + '" title="' + escapeAttr(kg.label + ' · ' + kg.list.length + ' emojis') + '">' +
          '<input type="checkbox" data-bandit="' + i + '" data-kingdom="' + kg.id + '"' + (on ? ' checked' : '') + '>' +
          '<span>' + kg.icon + ' ' + escapeAttr(kg.label) + '</span></label>';
      }
      html += '</div></fieldset>';
    }
    el.innerHTML = html;

    var boxes = el.querySelectorAll('input[type=checkbox][data-kingdom]');
    for (var b = 0; b < boxes.length; b++) {
      boxes[b].addEventListener('change', function (ev) {
        var t = ev.currentTarget;
        var idx = parseInt(t.getAttribute('data-bandit'), 10);
        var id = t.getAttribute('data-kingdom');
        var list = options.kingdoms[idx].filter(function (x) { return x !== id; });
        if (t.checked) list.push(id);
        if (!list.length) { t.checked = true; return; } // keep at least one
        // keep the catalogue order so labels stay stable
        options.kingdoms[idx] = KINGDOMS.map(function (k) { return k.id; }).filter(function (k) { return list.indexOf(k) !== -1; });
        saveOptions();
        api.setBanditKingdoms(idx, options.kingdoms[idx]);
      });
    }
    var slider = el.querySelector('#pix-opt-ease');
    if (slider) {
      slider.addEventListener('input', function () {
        api.setEase(parseInt(slider.value, 10));
      });
    }
  }

  function flashReels(only) {
    if (!state.root) return;
    var sel = only == null ? '.pix-bandit-reel' : '.pix-bandit[data-bandit="' + only + '"] .pix-bandit-reel';
    var reels = state.root.querySelectorAll(sel);
    for (var i = 0; i < reels.length; i++) {
      reels[i].classList.remove('spinning');
      void reels[i].offsetWidth; // force reflow
      reels[i].classList.add('spinning');
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────
  var api = {
    REEL_SIZE: REEL_SIZE,
    MASTER_LIST: MASTER_LIST,
    KINGDOMS: KINGDOMS,
    FLAGS: FLAGS,
    EASE_LABELS: EASE_LABELS,
    _stats: _stats,

    mount: function (rootEl) {
      state.root = typeof rootEl === 'string' ? document.querySelector(rootEl) : rootEl;
      if (!state.root) return null;
      ensureBandits();
      render();
      return notify('mount');
    },

    mountOptions: function (el) {
      state.optsRoot = typeof el === 'string' ? document.querySelector(el) : el;
      renderOptions();
      return state.optsRoot;
    },

    isSequence: isSequence,
    kingdomOf: kingdomOf,
    kingdom: function (id) { return KINGDOM_BY_ID[id] || null; },
    jackpotFor: jackpotFor,

    spinAll: function () {
      ensureBandits();
      for (var i = 0; i < 3; i++) spinBandit(i, true);
      var ch = challengeFromState();
      _stats.jackpots[ch.jackpot.tier]++;
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
      flashReels(index);
      return notify('reset');
    },

    getOptions: function () {
      return { kingdoms: options.kingdoms.map(function (k) { return k.slice(); }), ease: options.ease };
    },

    // Re-feed one bandit from new kingdoms: rebuild its reels and re-roll it.
    setBanditKingdoms: function (index, ids) {
      index = index | 0;
      var list = validKingdoms(ids);
      if (index < 0 || index > 2 || !list.length) return challengeFromState();
      options.kingdoms[index] = list;
      saveOptions();
      ensureBandits();
      reshuffleBandit(index);
      render();
      renderOptions();
      flashReels(index);
      return notify('options');
    },

    setEase: function (n) {
      options.ease = Math.max(0, Math.min(3, Math.round(+n || 0)));
      saveOptions();
      if (state.optsRoot) {
        var v = state.optsRoot.querySelector('#pix-opt-ease-val');
        if (v) v.textContent = EASE_LABELS[options.ease];
        var sp = state.optsRoot.querySelector('.pix-spectrum');
        if (sp) sp.style.setProperty('--spec-pos', (options.ease / 3 * 100) + '%');
      }
      render();
      return notify('ease');
    },

    getChallenge: function () {
      ensureBandits();
      return challengeFromState();
    },

    getCounts: function () {
      ensureBandits();
      var kingdoms = {};
      KINGDOMS.forEach(function (k) { kingdoms[k.id] = k.list.length; });
      return {
        master: MASTER_LIST.length,
        kingdoms: kingdoms,
        reelSize: REEL_SIZE,
        bandits: state.bandits.map(function (b, i) {
          return {
            id: b.meta.id,
            label: banditLabel(i),
            kingdoms: options.kingdoms[i].slice(),
            pool: poolFor(i).length,
            reelSizes: b.reels.map(function (r) { return r.length; })
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
