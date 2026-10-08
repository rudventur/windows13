/**
 * PIX PANEL scenery — green indicator overlay for the live camera feed.
 *
 * Draws simple GREEN line shapes on a <canvas> laid over the PIX PANEL video
 * and pins ONE lucky emoji to every shape (an HTML label on / next to it).
 * The player then frames a photo where each emoji sits roughly where its
 * green shape says, at roughly that size.
 *
 * Indicator types
 *   background   horizon line (default: sunrise on the sea — a green horizon,
 *                a green half-sun above it, and BLUE wave lines below it; the
 *                waves are the only non-green lines) OR a unified background
 *                (a green frame + light green tint). The background carries an
 *                emoji too: 🏁 on the background = find a flag behind it all.
 *   big          foreground objects: placed low in the frame (nearer).
 *   medium       mid-frame objects, always smaller than every big object.
 *   small        little objects anywhere, smaller than medium ones.
 *   geo          geo-nature objects (mountain, tree, river, rock), never more
 *                than half the frame in either direction.
 *   Any object may be UNALLOCATED (chance slider):
 *     'noplace'  size is set, place is not  → dashed outline ("any place")
 *     'nosize'   place is set, size is not  → dashed marker ("any size")
 *     'free'     neither                    → floating chip only
 *
 * Jackpot → easier picture: see the rule in embed/pix-bandits.js. Here it is
 *   applied in build(): easeSteps = jackpot tier × ease; each step removes one
 *   object (small → medium → geo → big; the background stays) while more than
 *   one object is left; leftover steps free the remaining objects.
 *
 * Doubles and triples: every emoji in a picture-line slot is its own target.
 *   The settings give one object per picture-line slot (3); each extra emoji
 *   from a double or triple adds one more object slot (medium, then small,
 *   alternating) BEFORE the ease steps run, so nothing is silently dropped.
 *
 * Illegal bandit (all three bandits hit a jackpot): NO ease steps at all, and
 *   every emoji on the illegal bandit's win line is ADDED as an extra required
 *   indicator on top of the normal ones (buildings → big, people → medium,
 *   flags → small). Illegal indicators always have a set place and size
 *   (never unallocated) and carry a red "illegal" label. Super extra hard.
 *
 * Public API (window.PixScene):
 *   mount(stageEl)              — add the canvas + label layers to the stage
 *   render(scene | null)        — draw (null = the empty default scene)
 *   build(challenge, settings?) — scene from a PixBandits challenge
 *   fromSpec(spec, settings?)   — scene from a fixed spec (worked example)
 *   relayout(scene, settings?)  — same emojis, new random places / sizes
 *   emojis(scene) / describe(scene)
 *   getSettings() / setSettings(patch) / defaults()
 *   mountSettings(el, onChange) — the PIX PANEL settings window body
 *   setDetails(on)              — on: every emoji pin also shows its type tag
 *                                 (big / medium / geo-nature …); off (default,
 *                                 the simple PIX view): emoji only, plus a
 *                                 tag just for "any place / any size" and 🚨
 *
 * Emoji pins: every lucky emoji is drawn BIG in the middle of its green shape,
 *   sized from the shape (a big foreground box gets a big emoji, a small
 *   circle a small one), so the random place AND the random size read at a
 *   glance. A new scene drops its pins in one after another (no animation
 *   with reduced motion).
 *   EXAMPLE                     — the worked example spec
 */
(function (global) {
  'use strict';

  var GREEN = '#39ff7a';
  var BLUE = '#3fa9ff';
  var TYPES = ['big', 'medium', 'small', 'geo'];
  var TYPE_LABEL = { background: 'background', big: 'big', medium: 'medium', small: 'small', geo: 'geo-nature' };
  // Illegal emojis → indicator type (buildings big, people medium, flags small)
  var ILLEGAL_TYPE = {
    '⛪': 'big', '🕌': 'big', '🛕': 'big', '🕍': 'big', '⛩️': 'big', '🕋': 'big', '💒': 'big',
    '🏳️‍🌈': 'small'
  };
  function illegalType(e) { return ILLEGAL_TYPE[e] || 'medium'; }
  var KEY = 'rudventur_pix_scene_v1';

  // ── Settings (saved in localStorage) ────────────────────────────────────
  function defaults() {
    return {
      background: 'horizon',                        // 'horizon' | 'unified'
      counts: { big: 1, medium: 1, small: 1, geo: 0 }, // 0..3 each
      sizes: { big: 100, medium: 100, small: 100, geo: 100 }, // 50..150 %
      unallocOn: true,
      unalloc: 15                                   // % chance per object
    };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sanitize(s) {
    var d = defaults();
    s = s || {};
    var out = {
      background: s.background === 'unified' ? 'unified' : 'horizon',
      counts: {}, sizes: {},
      unallocOn: s.unallocOn !== false,
      unalloc: clamp(Math.round(+s.unalloc >= 0 ? +s.unalloc : d.unalloc), 0, 100)
    };
    TYPES.forEach(function (t) {
      var c = s.counts && s.counts[t] != null ? +s.counts[t] : d.counts[t];
      var z = s.sizes && s.sizes[t] != null ? +s.sizes[t] : d.sizes[t];
      out.counts[t] = clamp(Math.round(isNaN(c) ? d.counts[t] : c), 0, 3);
      out.sizes[t] = clamp(Math.round(isNaN(z) ? 100 : z), 50, 150);
    });
    return out;
  }
  var settings = (function () {
    try { return sanitize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return defaults(); }
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {} }

  // ── Small helpers ───────────────────────────────────────────────────────
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function PB() { return global.PixBandits || null; }
  function kingdomOf(e) { var p = PB(); return p && p.kingdomOf ? p.kingdomOf(e) : null; }
  function flags() { var p = PB(); return (p && p.FLAGS) || ['🏁', '🚩', '🏳️', '🏴']; }
  function kingdomList(id) { var p = PB(); var k = p && p.kingdom ? p.kingdom(id) : null; return k ? k.list : []; }

  // Which emojis suit which indicator type
  function fits(type, e) {
    var k = kingdomOf(e);
    if (type === 'background') return flags().indexOf(e) !== -1 || k === 'weather' || k === 'places';
    if (type === 'geo') return k === 'nature';
    return k !== 'nature' && k !== 'weather' && flags().indexOf(e) === -1;
  }

  var GEO_SHAPES = {
    mountain: ['🏔️', '⛰️', '🌋', '🗻', '🏜️', '🏞️'],
    tree: ['🌳', '🌲', '🌴', '🌵', '🌿', '🍀', '🍃', '🍂', '🍁', '🌱', '🪴', '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌾', '💐', '🪵', '🍄'],
    river: ['🌊', '💧', '🏖️', '🏝️'],
    rock: ['🪨', '🐚', '🕳️']
  };
  function geoShape(e) {
    for (var s in GEO_SHAPES) if (GEO_SHAPES[s].indexOf(e) !== -1) return s;
    return 'mountain';
  }

  // ── Layout: random place + size per type, with the size rules ───────────
  // All boxes are in 0..1 stage units: { x, y, w, h } (x, y = top-left).
  function layout(scene, s) {
    s = sanitize(s || settings);
    var bg = scene.background;
    bg.mode = s.background;
    bg.horizonY = rnd(0.44, 0.6);
    bg.sunX = rnd(0.22, 0.78);
    bg.sunR = rnd(0.09, 0.13);

    var minBig = { w: 1, h: 1 }, minMed = { w: 1, h: 1 }, placed = [];
    var order = { big: 0, medium: 1, small: 2, geo: 3 };
    var items = scene.items.slice().sort(function (a, b) { return order[a.type] - order[b.type]; });
    items.forEach(function (it) {
      var k = s.sizes[it.type] / 100, w, h, cy;
      if (it.type === 'big') {
        // Foreground: big and low (bottom edge in the lowest tenth)
        w = clamp(rnd(0.3, 0.42) * k, 0.18, 0.62);
        h = clamp(rnd(0.26, 0.38) * k, 0.16, 0.5);
        it.y = clamp(rnd(0.9, 0.98) - h, 0.3, 1 - h);
        minBig.w = Math.min(minBig.w, w); minBig.h = Math.min(minBig.h, h);
      } else if (it.type === 'medium') {
        // Mid-frame, and always smaller than every big object
        w = Math.max(0.06, Math.min(rnd(0.15, 0.24) * k, minBig.w * 0.8));
        h = Math.max(0.06, Math.min(rnd(0.14, 0.22) * k, minBig.h * 0.8));
        cy = rnd(0.4, 0.6);
        it.y = clamp(cy - h / 2, 0.12, 1 - h);
        minMed.w = Math.min(minMed.w, w); minMed.h = Math.min(minMed.h, h);
      } else if (it.type === 'small') {
        w = Math.max(0.04, Math.min(rnd(0.06, 0.1) * k, minMed.w * 0.8, minBig.w * 0.6));
        h = w * rnd(0.9, 1.3);
        cy = rnd(0.25, 0.8);
        it.y = clamp(cy - h / 2, 0.12, 1 - h);
      } else {
        // Geo-nature: at most half the frame in either direction
        it.shape = geoShape(it.emoji);
        w = Math.min(0.5, rnd(0.26, 0.42) * k);
        h = Math.min(0.5, rnd(0.22, 0.4) * k);
        if (bg.mode === 'horizon') {
          if (it.shape === 'river') { h = Math.min(h, 1 - bg.horizonY); it.y = bg.horizonY; }
          else { it.y = clamp(bg.horizonY - h + 0.02, 0.1, 1 - h); }
        } else {
          it.y = clamp(rnd(0.45, 0.8) - h, 0.1, 1 - h);
        }
      }
      it.w = w; it.h = h;
      // random x, but try a few spots and keep the one that overlaps the
      // already placed indicators least (so two big objects don't stack)
      var bestX = 0, bestO = Infinity;
      for (var tries = 0; tries < 14; tries++) {
        var cx = rnd(0.03, Math.max(0.03, 0.97 - w));
        var o = 0;
        placed.forEach(function (q) {
          var ox = Math.max(0, Math.min(cx + w, q.x + q.w) - Math.max(cx, q.x));
          var oy = Math.max(0, Math.min(it.y + h, q.y + q.h) - Math.max(it.y, q.y));
          o += ox * oy;
        });
        if (o < bestO) { bestO = o; bestX = cx; }
        if (o === 0) break;
      }
      it.x = bestX;
      placed.push(it);
      if (!it.shape) it.shape = it.type === 'big' ? 'box' : it.type === 'medium' ? 'ellipse' : 'circle';
      // Unallocated indicators (no set place and / or no set size)
      if (it.illegal) {
        it.unalloc = null; // illegal indicators: place AND size are always set
      } else if (!it.forcedFree) {
        it.unalloc = (s.unallocOn && !scene.noUnalloc && Math.random() * 100 < s.unalloc)
          ? pick(['noplace', 'nosize', 'free']) : null;
      }
    });
    return scene;
  }

  // ── Build a scene from a bandit challenge ───────────────────────────────
  function build(ch, s) {
    s = sanitize(s || settings);
    if (!ch || !ch.centers) return null;
    var p = PB();
    var jackpot = ch.jackpot || (p && p.jackpotFor ? p.jackpotFor(ch.centers) : { tier: 0, label: 'No jackpot' });
    var ease = ch.ease != null ? ch.ease : 1;
    var illegal = ch.illegal && ch.illegal.active ? (ch.illegal.emojis || []).slice() : [];

    // 1) slots from the settings (the background is always there)
    var slots = [];
    TYPES.forEach(function (t) { for (var i = 0; i < s.counts[t]; i++) slots.push({ type: t }); });

    // 1b) doubles / triples: one more object slot per extra picture-line emoji
    var lineSlots = ch.centerSlots ? ch.centerSlots.length : 3;
    var payCount = 0, seenPay = Object.create(null);
    ch.centers.forEach(function (e) { if (e && !seenPay[e]) { seenPay[e] = 1; payCount++; } });
    var extra = Math.max(0, payCount - lineSlots);
    for (var x = 0; x < extra; x++) slots.push({ type: x % 2 ? 'small' : 'medium', extra: true });

    // 2) jackpot → easier: remove objects smallest-first, then free the rest.
    //    Illegal bandit out (3 jackpots) → no ease at all.
    var steps = illegal.length ? 0 : (jackpot.tier || 0) * ease, removed = 0, freed = 0;
    var dropOrder = ['small', 'medium', 'geo', 'big'];
    while (steps > 0 && slots.length > 1) {
      for (var d = 0; d < dropOrder.length; d++) {
        var idx = -1;
        for (var q = slots.length - 1; q >= 0; q--) if (slots[q].type === dropOrder[d]) { idx = q; break; }
        if (idx !== -1) { slots.splice(idx, 1); break; }
      }
      steps--; removed++;
    }
    for (var f = 0; f < slots.length && steps > 0; f++, steps--) { slots[f].forcedFree = true; slots[f].unalloc = 'free'; freed++; }

    // 3) lucky emojis: payline first (best-fitting slot), then fill
    var bgSlot = { type: 'background', emoji: null };
    var used = Object.create(null);
    var payline = [];
    ch.centers.forEach(function (e) { if (e && payline.indexOf(e) === -1) payline.push(e); });
    var dropped = [];
    payline.forEach(function (e) {
      var k = kingdomOf(e);
      var target = null;
      if (fits('background', e) && !bgSlot.emoji && (k !== 'places' || !slots.some(function (x) { return !x.emoji && x.type === 'big'; }))) target = bgSlot;
      if (!target && k === 'nature') target = firstFree(slots, ['geo', 'big', 'medium', 'small']);
      if (!target) target = firstFree(slots, ['big', 'medium', 'small', 'geo']);
      if (target) { target.emoji = e; target.fromPayline = true; used[e] = 1; }
      else dropped.push(e);
    });
    var pool = [];
    (ch.pools || []).forEach(function (ids) { ids.forEach(function (id) { pool = pool.concat(kingdomList(id)); }); });
    if (!pool.length && p) pool = p.MASTER_LIST.slice();
    var all = p ? p.MASTER_LIST : pool;
    [bgSlot].concat(slots).forEach(function (sl) {
      if (sl.emoji) return;
      var cands = pool.filter(function (e) { return !used[e] && fits(sl.type, e); });
      if (!cands.length) cands = all.filter(function (e) { return !used[e] && fits(sl.type, e); });
      if (!cands.length && sl.type === 'background') cands = flags();
      sl.emoji = pick(cands) || '🏁';
      used[sl.emoji] = 1;
    });

    // 4) illegal bandit: its emojis are extra REQUIRED indicators on top
    var items = slots.map(function (sl) {
      return { type: sl.type, emoji: sl.emoji, fromPayline: !!sl.fromPayline, forcedFree: !!sl.forcedFree, unalloc: sl.unalloc || null };
    });
    illegal.forEach(function (e) {
      if (used[e]) return;
      used[e] = 1;
      items.push({ type: illegalType(e), emoji: e, illegal: true, fromPayline: false, forcedFree: false, unalloc: null });
    });

    var scene = {
      background: { mode: s.background, emoji: bgSlot.emoji, fromPayline: !!bgSlot.fromPayline },
      items: items,
      jackpot: jackpot, ease: ease, easeSteps: illegal.length ? 0 : (jackpot.tier || 0) * ease,
      removed: removed, freed: freed, dropped: dropped, payline: ch.centers.slice(),
      extra: extra, illegal: illegal
    };
    return layout(scene, s);
  }

  function firstFree(slots, typeOrder) {
    for (var i = 0; i < typeOrder.length; i++) {
      for (var j = 0; j < slots.length; j++) if (!slots[j].emoji && slots[j].type === typeOrder[i]) return slots[j];
    }
    return null;
  }

  // Worked example: unified 🏁 background, 2 big 🎲 🍦, 1 medium 🚗, 1 geo ⛰️
  var EXAMPLE = { background: { mode: 'unified', emoji: '🏁' }, big: ['🎲', '🍦'], medium: ['🚗'], small: [], geo: ['⛰️'] };

  function fromSpec(spec, s) {
    spec = spec || EXAMPLE;
    s = sanitize(s || settings);
    if (spec.background && spec.background.mode) s.background = spec.background.mode;
    var items = [];
    TYPES.forEach(function (t) { (spec[t] || []).forEach(function (e) { items.push({ type: t, emoji: e, unalloc: null }); }); });
    var scene = {
      background: { mode: s.background, emoji: (spec.background && spec.background.emoji) || '🏁' },
      items: items, jackpot: { tier: 0, label: 'Worked example' }, ease: 0, easeSteps: 0,
      removed: 0, freed: 0, dropped: [], payline: [], fromSpec: true, noUnalloc: true
    };
    return layout(scene, s);
  }

  function relayout(scene, s) {
    if (!scene) return scene;
    scene.items.forEach(function (it) { it.shape = null; });
    return layout(scene, s);
  }

  function emojis(scene) {
    if (!scene) return [];
    return [scene.background.emoji].concat(scene.items.map(function (i) { return i.emoji; })).filter(Boolean);
  }

  function unallocText(u) {
    return u === 'noplace' ? 'any place' : u === 'nosize' ? 'any size' : u === 'free' ? 'anywhere, any size' : '';
  }

  function describe(scene) {
    if (!scene) return [];
    var out = [{ emoji: scene.background.emoji, type: 'background',
      text: (scene.background.mode === 'horizon' ? 'horizon background' : 'unified background') }];
    scene.items.forEach(function (it) {
      out.push({ emoji: it.emoji, type: it.type, unalloc: it.unalloc, illegal: !!it.illegal,
        text: TYPE_LABEL[it.type] + (it.unalloc ? ' · ' + unallocText(it.unalloc) : '') + (it.illegal ? ' · 🚨 illegal' : '') });
    });
    return out;
  }

  // ── Rendering ───────────────────────────────────────────────────────────
  var view = { stage: null, canvas: null, labels: null, scene: null, ro: null, details: false, shown: null };

  function mount(stage) {
    stage = typeof stage === 'string' ? document.querySelector(stage) : stage;
    if (!stage) return null;
    view.stage = stage;
    if (!view.canvas) {
      view.canvas = document.createElement('canvas');
      view.canvas.className = 'pix-scene-canvas';
      view.canvas.setAttribute('aria-hidden', 'true');
      view.labels = document.createElement('div');
      view.labels.className = 'pix-scene-labels';
      var before = stage.querySelector('.pix-overlay');
      stage.insertBefore(view.canvas, before);
      stage.insertBefore(view.labels, before);
      if (global.ResizeObserver) {
        view.ro = new ResizeObserver(function () { draw(); });
        view.ro.observe(stage);
      } else {
        global.addEventListener('resize', draw);
      }
    }
    return stage;
  }

  function render(scene) {
    view.scene = scene || null;
    draw();
  }

  // Empty default: sunrise on the sea (or the unified frame), no emojis yet
  var emptyScene = null;
  function currentScene() {
    if (view.scene) return view.scene;
    if (!emptyScene || emptyScene.background.mode !== settings.background) {
      emptyScene = layout({ background: { mode: settings.background, emoji: null }, items: [], empty: true }, settings);
      emptyScene.background.horizonY = 0.55; emptyScene.background.sunX = 0.5; emptyScene.background.sunR = 0.11;
    }
    return emptyScene;
  }

  function draw() {
    var c = view.canvas, st = view.stage;
    if (!c || !st) return;
    var W = st.clientWidth, H = st.clientHeight;
    if (!W || !H) return;
    var dpr = global.devicePixelRatio || 1;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    c.style.width = W + 'px'; c.style.height = H + 'px';
    var g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    var sc = currentScene();
    var labels = [];
    var lw = Math.max(2, Math.min(3, W / 220));

    // a soft dark halo first so the green reads on bright or green scenes
    function stroke(color, dash) {
      g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash(dash || []);
      g.strokeStyle = 'rgba(0, 0, 0, 0.55)'; g.lineWidth = lw + 3; g.stroke();
      g.strokeStyle = color; g.lineWidth = lw;
      g.shadowColor = color; g.shadowBlur = 6;
      g.stroke(); g.shadowBlur = 0;
    }

    // Background
    var bg = sc.background;
    if (bg.mode === 'unified') {
      var m = 6;
      g.fillStyle = 'rgba(57, 255, 122, 0.07)';
      g.fillRect(m, m, W - 2 * m, H - 2 * m);
      g.beginPath(); roundRect(g, m, m, W - 2 * m, H - 2 * m, 10); stroke(GREEN);
      if (bg.emoji) labels.push({ pin: true, cx: W - m - 34, cy: m + 34, size: 40, emoji: bg.emoji, type: 'background', tag: 'unified background', note: '', cls: 'is-bg' });
    } else {
      var hy = bg.horizonY * H, sx = bg.sunX * W, r = bg.sunR * Math.min(W, H) * 1.4;
      // green horizon
      g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); stroke(GREEN);
      // green half-sun above the horizon, with a few short rays
      g.beginPath(); g.arc(sx, hy, r, Math.PI, 2 * Math.PI); stroke(GREEN);
      for (var a = 1; a <= 5; a++) {
        var ang = Math.PI + a * Math.PI / 6;
        g.beginPath();
        g.moveTo(sx + Math.cos(ang) * r * 1.25, hy + Math.sin(ang) * r * 1.25);
        g.lineTo(sx + Math.cos(ang) * r * 1.55, hy + Math.sin(ang) * r * 1.55);
        stroke(GREEN);
      }
      // blue waves below the horizon (the one exception to green)
      var rows = 4;
      for (var w = 0; w < rows; w++) {
        var t = (w + 1) / (rows + 0.6);
        var y = hy + (H - hy) * t * t + 6;
        var amp = 2 + w * 1.6, len = 26 + w * 16, phase = (w % 2) * len / 2;
        g.beginPath();
        for (var xx = -len; xx <= W + len; xx += 4) {
          var yy = y + Math.sin((xx + phase) / len * Math.PI * 2) * amp;
          if (xx === -len) g.moveTo(xx, yy); else g.lineTo(xx, yy);
        }
        g.globalAlpha = 0.85 - w * 0.1;
        stroke(BLUE);
        g.globalAlpha = 1;
      }
      if (bg.emoji) labels.push({ pin: true, cx: sx, cy: hy - r * 0.5, size: clamp(r * 0.85, 26, 56), emoji: bg.emoji, type: 'background', tag: 'horizon background', note: '', cls: 'is-bg' });
    }

    // Objects
    var free = [];
    sc.items.forEach(function (it) {
      if (it.unalloc === 'free') { free.push(it); return; }
      var x = it.x * W, y = it.y * H, w2 = it.w * W, h2 = it.h * H;
      var dash = it.unalloc === 'noplace' ? [7, 6] : null;
      if (it.unalloc === 'nosize') {
        // place known, size not: dashed marker + crosshair
        var cx = x + w2 / 2, cy = y + h2 / 2;
        g.beginPath(); g.arc(cx, cy, 14, 0, Math.PI * 2); stroke(GREEN, [4, 4]);
        g.beginPath(); g.moveTo(cx - 20, cy); g.lineTo(cx - 8, cy); g.moveTo(cx + 8, cy); g.lineTo(cx + 20, cy);
        g.moveTo(cx, cy - 20); g.lineTo(cx, cy - 8); g.moveTo(cx, cy + 8); g.lineTo(cx, cy + 20); stroke(GREEN);
        labels.push({ pin: true, cx: cx, cy: cy - 34, size: 30, emoji: it.emoji, type: it.type,
          tag: TYPE_LABEL[it.type] + ' · any size', note: 'any size', cls: 'is-unalloc' });
        return;
      }
      g.beginPath();
      shapePath(g, it.shape, x, y, w2, h2);
      stroke(GREEN, dash);
      labels.push({ pin: true, cx: x + w2 / 2, cy: y + h2 / 2, size: pinSize(it.shape, w2, h2), emoji: it.emoji, type: it.type,
        tag: (it.illegal ? '🚨 ' : '') + TYPE_LABEL[it.type] + (it.unalloc === 'noplace' ? ' · any place' : ''),
        note: (it.illegal ? '🚨 illegal' : '') + (it.unalloc === 'noplace' ? 'any place' : ''),
        cls: (it.unalloc ? 'is-unalloc' : '') + (it.illegal ? ' is-illegal' : '') });
    });

    // Emoji pins (HTML so emojis stay crisp): centred in their shape, sized
    // from it. A new scene drops them in one by one; a redraw (resize) doesn't.
    var fresh = sc !== view.shown && !sc.empty;
    view.shown = sc;
    var html = '', n = 0;
    labels.forEach(function (l) {
      var size = Math.round(clamp(l.size, 20, Math.min(96, H * 0.3)));
      var tag = view.details ? l.tag : l.note;
      // keep the whole pin (emoji and its little tag) inside the feed
      var half = Math.max(size * 0.5, tag ? (tag.length * 6.2 + 14) / 2 : 0);
      var cx = clamp(l.cx, half + 2, W - half - 2);
      var cy = clamp(l.cy, size * 0.5 + 2, H - size * 0.5 - (tag ? 16 : 2));
      var style = 'left:' + cx.toFixed(1) + 'px;top:' + cy.toFixed(1) + 'px;font-size:' + size + 'px;' +
        (fresh ? '--pin-delay:' + (n * 110) + 'ms;' : '');
      html += '<span class="pix-scene-label pix-scene-pin ' + (l.cls || '') + (fresh ? ' is-dropping' : '') +
        '" data-type="' + esc(l.type || '') + '" style="' + style + '" title="' + esc(l.tag) + '">' +
        '<b>' + l.emoji + '</b>' + (tag ? '<i>' + esc(tag) + '</i>' : '') + '</span>';
      n++;
    });
    if (free.length) {
      html += '<div class="pix-scene-free">' + free.map(function (it) {
        var st = fresh ? ' style="--pin-delay:' + ((n++) * 110) + 'ms"' : '';
        return '<span class="pix-scene-chip' + (fresh ? ' is-dropping' : '') + '"' + st + ' title="Unallocated: anywhere, any size"><b>' + it.emoji + '</b><i>' +
          (view.details ? esc(TYPE_LABEL[it.type]) + ' · ' : '') + 'anywhere</i></span>';
      }).join('') + '</div>';
    }
    view.labels.innerHTML = html;
    declutter(W, H);
  }

  // Emoji size from its green shape: about half the shape's smaller side
  function pinSize(shape, w, h) {
    var k = shape === 'mountain' || shape === 'tree' ? 0.42 : shape === 'river' ? 0.36 : 0.55;
    return Math.min(w, h) * k;
  }

  // Keep pins readable: nudge any pin that sits under the overlay badges
  // (the mood word, the title) or on top of an earlier pin a little lower.
  // Pins are centred with a transform, so move by the overlap, not to a top.
  function declutter(W, H) {
    var st = view.stage, base = st.getBoundingClientRect();
    var boxes = [];
    var badges = st.querySelectorAll('.pix-title-badge, .pix-mood');
    for (var q = 0; q < badges.length; q++) {
      if (!badges[q].offsetParent) continue;
      var t = badges[q].getBoundingClientRect();
      if (t.width && t.height) boxes.push({ l: t.left - base.left, t: t.top - base.top, r: t.right - base.left, b: t.bottom - base.top });
    }
    var els = view.labels.querySelectorAll('.pix-scene-label');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      for (var guard = 0; guard < 6; guard++) {
        var r = el.getBoundingClientRect();
        var me = { l: r.left - base.left, t: r.top - base.top, r: r.right - base.left, b: r.bottom - base.top };
        var hit = null;
        for (var k = 0; k < boxes.length; k++) {
          var o = boxes[k];
          if (me.l < o.r && me.r > o.l && me.t < o.b && me.b > o.t) { hit = o; break; }
        }
        if (!hit) { boxes.push(me); break; }
        var dy = hit.b + 3 - me.t;
        if (dy <= 0 || me.b + dy > H - 2) { boxes.push(me); break; } // nowhere lower to go
        el.style.top = ((parseFloat(el.style.top) || 0) + dy).toFixed(1) + 'px';
      }
    }
  }

  function roundRect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function shapePath(g, shape, x, y, w, h) {
    switch (shape) {
      case 'ellipse':
        g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); break;
      case 'circle':
        g.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2); break;
      case 'mountain':
        g.moveTo(x, y + h);
        g.lineTo(x + w * 0.42, y);
        g.lineTo(x + w * 0.58, y + h * 0.28);
        g.lineTo(x + w * 0.72, y + h * 0.14);
        g.lineTo(x + w, y + h);
        // snow line
        g.moveTo(x + w * 0.3, y + h * 0.29); g.lineTo(x + w * 0.42, y + h * 0.36); g.lineTo(x + w * 0.52, y + h * 0.27);
        break;
      case 'tree':
        g.moveTo(x + w / 2, y);
        g.lineTo(x + w * 0.85, y + h * 0.72);
        g.lineTo(x + w * 0.15, y + h * 0.72);
        g.closePath();
        g.moveTo(x + w / 2, y + h * 0.72); g.lineTo(x + w / 2, y + h);
        break;
      case 'river':
        // two wavy banks widening toward the viewer
        for (var side = 0; side < 2; side++) {
          for (var i = 0; i <= 20; i++) {
            var t = i / 20;
            var spread = 0.08 + 0.32 * t;
            var cx = x + w * (0.5 + Math.sin(t * Math.PI * 1.5) * 0.15);
            var px = cx + (side ? 1 : -1) * w * spread;
            var py = y + h * t;
            if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
          }
        }
        break;
      case 'rock':
        g.moveTo(x + w * 0.1, y + h);
        g.lineTo(x, y + h * 0.55);
        g.lineTo(x + w * 0.3, y + h * 0.1);
        g.lineTo(x + w * 0.72, y);
        g.lineTo(x + w, y + h * 0.5);
        g.lineTo(x + w * 0.9, y + h);
        g.closePath();
        break;
      default:
        roundRect(g, x, y, w, h, Math.min(w, h) * 0.12);
    }
  }

  // ── Settings window body ────────────────────────────────────────────────
  var setUI = { el: null, onChange: null };

  function spectrum(id, label, min, max, step, value, valueText, brackets, attrs) {
    var pos = (value - min) / (max - min) * 100;
    return '<div class="pix-spectrum" style="--spec-pos:' + pos + '%">' +
      '<label class="pix-spectrum-head" for="' + id + '">' + label + ' <strong data-val="' + id + '">' + esc(valueText) + '</strong></label>' +
      '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"' + (attrs || '') + '>' +
      '<div class="pix-spectrum-brackets" aria-hidden="true">' + brackets.map(function (b, i) {
        return '<span>' + (i === 0 ? '⟦ ' : '') + esc(b) + (i === brackets.length - 1 ? ' ⟧' : '') + '</span>';
      }).join('') + '</div></div>';
  }

  var TYPE_ROW = {
    big: '🟩 Big objects (foreground, low)',
    medium: '▫️ Medium objects (mid-frame)',
    small: '🔹 Small objects',
    geo: '⛰️ Geo-nature (mountain, tree, river)'
  };

  function renderSettings() {
    var el = setUI.el;
    if (!el) return;
    var s = settings;
    var h = '';
    h += '<fieldset class="pix-set-group"><legend>Background</legend>' +
      '<label class="pix-set-tick"><input type="radio" name="pix-set-bg" value="horizon"' + (s.background === 'horizon' ? ' checked' : '') + '> 🌅 Horizon: sunrise on the sea</label>' +
      '<label class="pix-set-tick"><input type="radio" name="pix-set-bg" value="unified"' + (s.background === 'unified' ? ' checked' : '') + '> 🖼️ Unified background: green frame and tint</label>' +
      '</fieldset>';
    TYPES.forEach(function (t) {
      h += '<fieldset class="pix-set-group pix-set-type"><legend>' + TYPE_ROW[t] + '</legend>' +
        spectrum('pix-set-count-' + t, 'How many', 0, 3, 1, s.counts[t], String(s.counts[t]), ['0', '1', '2', '3'], ' data-kind="count" data-type="' + t + '"') +
        spectrum('pix-set-size-' + t, 'Size', 50, 150, 10, s.sizes[t], s.sizes[t] + '%', ['smaller', 'normal', 'larger'], ' data-kind="size" data-type="' + t + '"') +
        '</fieldset>';
    });
    h += '<fieldset class="pix-set-group"><legend>Unallocated indicators</legend>' +
      '<label class="pix-set-tick"><input type="checkbox" id="pix-set-unalloc-on"' + (s.unallocOn ? ' checked' : '') + '> Allow indicators with no set place or no set size</label>' +
      spectrum('pix-set-unalloc', 'Chance', 0, 100, 5, s.unalloc, s.unalloc + '%', ['never', 'sometimes', 'often'], s.unallocOn ? '' : ' disabled') +
      '</fieldset>';
    h += '<div class="pix-set-actions">' +
      '<button type="button" class="pp-btn" data-act="relayout">🎲 Re-roll layout</button>' +
      '<button type="button" class="pp-btn" data-act="example">🏁 Worked example</button>' +
      '<button type="button" class="pp-btn" data-act="defaults">↺ Defaults</button>' +
      '</div>' +
      '<p class="pix-opt-note">Saved on this device (local storage).</p>';
    el.innerHTML = h;

    el.querySelectorAll('input[name="pix-set-bg"]').forEach(function (r) {
      r.addEventListener('change', function () { change({ background: r.value }, 'background'); });
    });
    el.querySelectorAll('input[type=range]').forEach(function (r) {
      r.addEventListener('input', function () {
        var v = +r.value, kind = r.getAttribute('data-kind'), t = r.getAttribute('data-type');
        var out = el.querySelector('[data-val="' + r.id + '"]');
        var wrap = r.closest('.pix-spectrum');
        if (wrap) wrap.style.setProperty('--spec-pos', ((v - +r.min) / (+r.max - +r.min) * 100) + '%');
        if (kind === 'count') { if (out) out.textContent = String(v); var c = {}; c[t] = v; change({ counts: c }, 'count'); }
        else if (kind === 'size') { if (out) out.textContent = v + '%'; var z = {}; z[t] = v; change({ sizes: z }, 'size'); }
        else { if (out) out.textContent = v + '%'; change({ unalloc: v }, 'unalloc'); }
      });
    });
    var on = el.querySelector('#pix-set-unalloc-on');
    if (on) on.addEventListener('change', function () {
      var sl = el.querySelector('#pix-set-unalloc');
      if (sl) sl.disabled = !on.checked;
      change({ unallocOn: on.checked }, 'unalloc');
    });
    el.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-act');
        if (act === 'defaults') { settings = defaults(); save(); renderSettings(); emit('defaults'); }
        else emit(act);
      });
    });
  }

  function change(patch, kind) {
    var next = JSON.parse(JSON.stringify(settings));
    if (patch.background) next.background = patch.background;
    if (patch.counts) for (var a in patch.counts) next.counts[a] = patch.counts[a];
    if (patch.sizes) for (var b in patch.sizes) next.sizes[b] = patch.sizes[b];
    if (patch.unalloc != null) next.unalloc = patch.unalloc;
    if (patch.unallocOn != null) next.unallocOn = patch.unallocOn;
    settings = sanitize(next);
    save();
    emit(kind);
  }

  function emit(kind) {
    if (typeof setUI.onChange === 'function') { try { setUI.onChange(kind, getSettings()); } catch (e) {} }
  }

  function getSettings() { return JSON.parse(JSON.stringify(settings)); }

  global.PixScene = {
    EXAMPLE: EXAMPLE,
    TYPE_LABEL: TYPE_LABEL,
    defaults: defaults,
    getSettings: getSettings,
    setSettings: function (patch) { settings = sanitize(Object.assign(getSettings(), patch || {})); save(); renderSettings(); return getSettings(); },
    mount: mount,
    render: render,
    redraw: draw,
    setDetails: function (on) { on = !!on; if (on === view.details) return; view.details = on; draw(); },
    build: build,
    fromSpec: fromSpec,
    relayout: relayout,
    emojis: emojis,
    describe: describe,
    mountSettings: function (el, onChange) {
      setUI.el = typeof el === 'string' ? document.querySelector(el) : el;
      setUI.onChange = onChange;
      renderSettings();
      return setUI.el;
    }
  };
})(typeof window !== 'undefined' ? window : this);
