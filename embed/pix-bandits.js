/**
 * PIX Emoji Bandits — Cheese Casino–style 3-bandit challenge generator
 * Soft neon aesthetic for the Popcorn Hub PIX PANEL.
 *
 * Unicode source: curated from emoji-data / Unicode Emoji. Every entry should
 * be something a camera can actually find (or a face the player can pull).
 * The three normal bandits use no skin-tone modifiers and no people-
 * composition or identity glyphs: no pride or other identity flags, no family
 * / couple sequences, no gendered person variants, no person-in-wheelchair
 * sequences, no religious buildings, no wedding chapel. Just things, nature,
 * animals, food, vehicles, sky, faces, sound makers, places and clothing.
 * Everything kept out of the normal pools lives in ONE separate pool, the
 * ILLEGAL EMOJIS pool, which only feeds the hidden 4th bandit (see below).
 *
 * KINGDOMS — the master pool is regrouped into ten logical kingdoms
 * (KINGDOMS below). Each bandit is fed by one or more kingdoms (tick boxes in
 * the bandit options window); its three reels are drawn from the union of the
 * kingdoms it is fed by. Every emoji lives in exactly ONE kingdom so a
 * landed emoji always has a single kingdom for jackpot checks. A guard below
 * strips any illegal emoji out of the kingdoms, so they can never land on the
 * three normal bandits.
 *
 * ZWJ NOTE — a few entries are *emoji sequences*, not single code points:
 * two emoji glued with U+200D ZERO WIDTH JOINER (sometimes plus a U+FE0F
 * variation selector). The ones in the normal kingdoms are neutral and
 * camera-findable: 🐕‍🦺 service dog, 🐈‍⬛ black cat, 🐻‍❄️ polar bear and
 * 😮‍💨 face exhaling. Most of the illegal pool is ZWJ sequences too.
 * Treat every catalogue entry as ONE opaque string (never split by code unit
 * or Array.from) and expect older fonts to draw them as 2 separate glyphs.
 * PixBandits.isSequence(e) tells hosts whether a target is a ZWJ sequence.
 *
 * REEL SLOTS — DOUBLES AND TRIPLES
 *   A reel is REEL_SIZE slots. Most slots hold one emoji, but a slot can hold
 *   two (a DOUBLE, chance DOUBLE_CHANCE ≈ 15 % of slots) or three (a TRIPLE,
 *   chance TRIPLE_CHANCE ≈ 3 %). The emojis in one slot are always different.
 *   Every emoji in a landed picture-line slot is its own photo target.
 *   The illegal bandit's reels are much busier: ILLEGAL_DOUBLE_CHANCE ≈ 50 %
 *   doubles and ILLEGAL_TRIPLE_CHANCE ≈ 33 % triples (the rest are singles).
 *
 * TWO LINES PER SPIN
 *   win line     — each bandit's own three landed reels (left, centre, right).
 *                  Bandit jackpots and the mini triplet reel come from it.
 *   picture line — the CENTRE reel of each of the three bandits (the reels
 *                  with the coloured frame). Its emojis are the photo targets.
 *
 * JACKPOT TIERS (one rule, used for both lines; slot-aware)
 *     0  no jackpot          — no kingdom shows up in two slots
 *     1  kingdom pair        — one kingdom shows up in two of the three slots
 *     2  kingdom triple      — one kingdom shows up in all three slots
 *     3  exact match         — the same emoji shows up in two slots
 *   A slot counts once per kingdom and once per emoji, so a double or triple
 *   gives that slot more chances to match.
 *   A BANDIT JACKPOT is a win line at tier ≥ JACKPOT_MIN_TIER (2). A kingdom
 *   pair is too common on a single bandit (about 6 or 7 spins in 10) to be a
 *   jackpot, so it pays nothing and does not count.
 *
 * JACKPOT → EASIER PICTURE (the rule; the PIX PANEL scene applies it)
 *   picture tier = the bigger of: the picture line's own tier (the original
 *   rule) and the best bandit jackpot tier. The "jackpot ease" slider
 *   (0 tough · 1 fair · 2 kind · 3 gentle) turns it into ease steps:
 *       easeSteps = picture tier × ease.
 *   Each ease step removes one object indicator from the camera challenge,
 *   smallest first (small → medium → geo-nature → big). The background
 *   indicator is never removed. Steps left over once only one object remains
 *   turn the remaining objects into free "unallocated" indicators (any place,
 *   any size). So: the bigger the jackpot, the fewer / looser the indicators.
 *   EXCEPTION — all three bandits jackpot at once: the ILLEGAL BANDIT pops
 *   out, there is NO ease at all, and every emoji on the illegal bandit's win
 *   line is ADDED to the picture as an extra required indicator (fixed place
 *   and size, never unallocated). Super extra hard.
 *
 * ILLEGAL BANDIT (4th bandit)
 *   Hidden normally. Pops out only when all three normal bandits hit a
 *   jackpot on the same spin, and goes back into hiding on the next spin
 *   without a triple jackpot. It does not pay and does not trigger mini reels.
 *   FUTURE (comments only, nothing built): the illegal bandit is where losing
 *   popCoins comes in — an illegal pop-out will later be able to take popCoins
 *   away, push the casino balance below zero, and tie into bank credit
 *   requirements (how far below zero you may go before the bank asks for
 *   credit). Do not build the bank here; hook it in evaluateRound().
 *
 * MINI TRIPLET REEL
 *   Every triple slot that lands on a normal bandit's win line triggers one
 *   mini reel. The mini reel holds ONLY 2 different emojis taken from that
 *   triple: the first is the 🎯 target, the second is the blank. Each spin
 *   lands the target with chance MINI_WIN_CHANCE (½). Landing the target is a
 *   win and the mini reel spins again; it stops at the first miss.
 *   n wins in a row → mini multiplier ×(n · MINI_STEP) = ×n·1000
 *   (1 win ×1,000 · 2 wins ×2,000 · 3 wins ×3,000 …). No win → ×1.
 *
 * CASINO WINNINGS (popCoins, their own "casino" balance, local storage)
 *   One "Spin all" costs SPIN_COST (1) popCoin, taken from the casino balance.
 *   The balance may go below zero (shown in red).
 *   Base win per bandit jackpot (BASE_WIN, from the jackpot tiers):
 *       kingdom triple (tier 2) = 25 · exact match (tier 3) = 100
 *   base   = sum of the base wins of every bandit that hit a jackpot
 *            (or MINI_ONLY_BASE = 1, the spin stake, when there is no jackpot
 *            but a mini reel won, so a lone mini win still pays 1 × 1,000)
 *   multi  = MULTI_JACKPOT[number of jackpots]: 1 → ×1 · 2 → ×20 · 3 → ×420
 *   total  = base × multi × (mini₁ multiplier) × (mini₂ multiplier) × …
 *   e.g. 2 exact matches + one mini win      = 200 × 20 × 1,000 = 4,000,000
 *        3 jackpots + two mini reels winning  = base × 420 × 1,000 × 1,000
 *        a mini reel winning twice in a row   uses ×2,000 instead of ×1,000
 *   Totals use BigInt, so huge streaks never lose digits.
 *   The "I took it" photo award (1–200 popCoins) is separate and unchanged.
 *
 * DEBUG — force outcomes with an address hash (or PixBandits.force(spec)):
 *   #pix-force-triple       a triple on bandit A's centre slot (mini reel)
 *   #pix-force-triples-2    triples on bandits A and B (two mini reels)
 *   #pix-force-double       a double on every centre slot
 *   #pix-force-streak-3     triple + the mini reel wins 3 times, then misses
 *   #pix-force-1jackpot / -2jackpots / -3jackpots   exact-match jackpots
 *   #pix-force-none         no jackpots, no triples
 *   Combine with "+": #pix-force-3jackpots+triples-2+streak-1
 *   While a force is on, natural triples are trimmed to doubles so the
 *   result is exactly what was asked for.
 *
 * Public API (window.PixBandits):
 *   mount(rootEl)           — build UI into #pix-bandits-root (or given node)
 *   mountOptions(el)        — build the bandit options window body into el
 *   spinAll()               — paid spin of all 3 bandits; returns challenge
 *   resetBandit(index)      — free reshuffle + re-roll of one bandit (0..2);
 *                             no casino payout, illegal state unchanged
 *   getChallenge()          — { title, indicators, centers, centerSlots,
 *                               landed, kingdoms, jackpot, bandits, illegal,
 *                               casino, ease, pools }
 *   getCasino()             — { balance, balanceText, negative, spinCost,
 *                               lastRound }
 *   getStats()              — hidden statistics / probability snapshot
 *   getCounts()             — master / kingdom / illegal / reel sizes
 *   getOptions()            — { kingdoms:[[ids]×3], ease }
 *   setBanditKingdoms(i, ids), setEase(n)
 *   force(spec) / clearForce() / parseForce(hash)
 *   kingdomOf(emoji), isIllegal(emoji), isSequence(emoji)
 *   jackpotFor(slots)       — { tier, label, kingdom }
 *   onChange(fn)            — subscribe; challenge carries .reason
 *                             ('spin' | 'reset' | 'mount' | 'options' | 'ease')
 *   KINGDOMS, FLAGS, MASTER_LIST, ILLEGAL, ILLEGAL_LIST, CONFIG
 *
 * HOOK — future statistics & probability view: see _stats below. It records
 *   spins, spend, winnings, jackpots per bandit and tier, multi-jackpot
 *   counts, doubles / triples landed, mini-reel streaks and illegal
 *   pop-outs, persists them (local storage) and fires a
 *   'pix-bandits-spin' CustomEvent on window after each paid spin.
 */
(function (global) {
  'use strict';

  // ── Tunables (all in one place) ─────────────────────────────────────────
  var REEL_SIZE = 12;
  var DOUBLE_CHANCE = 0.15;          // normal reels: share of slots with 2 emojis
  var TRIPLE_CHANCE = 0.03;          // normal reels: share of slots with 3 emojis
  var ILLEGAL_DOUBLE_CHANCE = 0.5;   // illegal reels: about half are doubles
  var ILLEGAL_TRIPLE_CHANCE = 0.33;  // illegal reels: about a third are triples
  var SPIN_COST = 1;                 // popCoins per "Spin all"
  var JACKPOT_MIN_TIER = 2;          // a bandit jackpot = win line tier ≥ this
  var BASE_WIN = [0, 0, 25, 100];    // base popCoins per jackpot tier
  var MULTI_JACKPOT = [1, 1, 20, 420]; // by number of bandits that jackpot
  var MINI_STEP = 1000;              // n mini wins in a row → ×(n · MINI_STEP)
  var MINI_WIN_CHANCE = 0.5;         // 2 emojis on the mini reel → ½ per spin
  var MINI_MAX_SPINS = 12;           // safety cap on one mini streak
  var MINI_ONLY_BASE = 1;            // base when a mini reel wins with no jackpot

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

  // ── Illegal emojis (the separate pool for the hidden 4th bandit) ────────
  // Everything kept OUT of the three normal bandits lives here.
  var ILLEGAL = {
    id: 'illegal', icon: '🚨', label: 'Illegal emojis',
    groups: [
      { id: 'bikers', label: 'Gendered bikers', list: ['🚴‍♀️', '🚴‍♂️', '🚵‍♀️', '🚵‍♂️'] },
      { id: 'wheelchair', label: 'Person in wheelchair', list: ['🧑‍🦽', '👨‍🦽', '👩‍🦽', '🧑‍🦼', '👨‍🦼', '👩‍🦼'] },
      { id: 'religious', label: 'Religious buildings', list: ['⛪', '🕌', '🛕', '🕍', '⛩️', '🕋'] },
      { id: 'wedding', label: 'Wedding chapel', list: ['💒'] },
      { id: 'pride-family', label: 'Pride and family', list: ['🏳️‍🌈', '👨‍👩‍👧'] }
    ]
  };

  function unique(arr) {
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      if (!seen[arr[i]]) { seen[arr[i]] = 1; out.push(arr[i]); }
    }
    return out;
  }

  var ILLEGAL_OF = Object.create(null);
  var ILLEGAL_LIST = [];
  ILLEGAL.groups.forEach(function (g) {
    g.list = unique(g.list);
    g.list.forEach(function (e) { if (!ILLEGAL_OF[e]) { ILLEGAL_OF[e] = g.id; ILLEGAL_LIST.push(e); } });
  });
  ILLEGAL.list = ILLEGAL_LIST;

  // Every emoji belongs to exactly one kingdom: first kingdom wins.
  // Guard: illegal emojis are stripped so they never reach a normal bandit.
  var KINGDOM_BY_ID = Object.create(null);
  var KINGDOM_OF = Object.create(null);
  var MASTER_LIST = [];
  KINGDOMS.forEach(function (k) {
    k.list = unique(k.list).filter(function (e) { return !KINGDOM_OF[e] && !ILLEGAL_OF[e]; });
    k.list.forEach(function (e) { KINGDOM_OF[e] = k.id; MASTER_LIST.push(e); });
    KINGDOM_BY_ID[k.id] = k;
  });

  var BANDIT_META = [
    { id: 'A', accent: '#00ff41', defaults: ['nature', 'places', 'weather'] },
    { id: 'B', accent: '#ffd700', defaults: ['things', 'vehicles', 'food', 'clothing'] },
    { id: 'C', accent: '#7ec8ff', defaults: ['animals', 'sounds', 'faces'] }
  ];
  var ILLEGAL_META = { id: '🚨', accent: '#ff2a6d' };
  var EASE_LABELS = ['tough', 'fair', 'kind', 'gentle'];

  // ── Options (which kingdoms feed each bandit + jackpot ease) ────────────
  var OPTS_KEY = 'rudventur_pix_bandit_opts_v1';
  var CASINO_KEY = 'rudventur_pix_casino_v1';
  var STATS_KEY = 'rudventur_pix_bandit_stats_v1';
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

  // ── Casino balance (popCoins won / spent on the bandits) ────────────────
  // Kept apart from the photo popCoins and the shared PopCOIN wallet.
  // It may go BELOW ZERO. FUTURE (not built): bank credit — a negative casino
  // balance will later need bank credit (a credit line / limit, interest,
  // paying it back from photo popCoins). The illegal bandit is where losing
  // popCoins and those bank credit requirements will plug in.
  function toBig(v) {
    try { return BigInt(v); } catch (e) { return BigInt(0); }
  }
  var casino = { balance: toBig((function () {
    try { return localStorage.getItem(CASINO_KEY) || '0'; } catch (e) { return '0'; }
  })()) };
  function saveCasino() {
    try { localStorage.setItem(CASINO_KEY, casino.balance.toString()); } catch (e) {}
  }

  // Big-number formatting: 20000 → "20,000", negatives with a real minus sign
  function fmt(v) {
    var b = toBig(v);
    var neg = b < BigInt(0);
    var s = (neg ? -b : b).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + s;
  }

  // ── Stats / probability hook (future statistics view) ───────────────────
  // Hidden: nothing shows it yet. Records every paid spin and persists to
  // local storage. TODO(stats): a statistics view can read getStats(), or
  // listen for the 'pix-bandits-spin' CustomEvent on window.
  function freshStats() {
    return {
      v: 1,
      spinsTotal: 0,
      resets: 0,
      spent: '0',
      won: '0',
      biggestWin: '0',
      jackpotsByBandit: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], // win line tier counts
      pictureTiers: [0, 0, 0, 0],
      multiJackpots: [0, 0, 0, 0],      // spins with 0 / 1 / 2 / 3 bandit jackpots
      doublesLanded: 0,
      triplesLanded: 0,
      miniReels: 0,
      miniSpins: 0,
      miniStreaks: {},                  // streak length → how many mini reels ended there
      bestMiniStreak: 0,
      illegalPopOuts: 0,
      emojiHits: {},
      lastSpinAt: null
    };
  }
  var _stats = (function () {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STATS_KEY) || 'null'); } catch (e) {}
    var base = freshStats();
    if (s && s.v === 1) { for (var k in base) if (s[k] != null) base[k] = s[k]; }
    return base;
  })();
  function saveStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(_stats)); } catch (e) {}
  }
  function recordRound(round) {
    var s = _stats;
    s.spinsTotal++;
    s.lastSpinAt = Date.now();
    s.spent = (toBig(s.spent) + toBig(round.cost)).toString();
    s.won = (toBig(s.won) + toBig(round.total)).toString();
    if (toBig(round.total) > toBig(s.biggestWin)) s.biggestWin = String(round.total);
    round.bandits.forEach(function (r, i) { s.jackpotsByBandit[i][r.tier]++; });
    s.multiJackpots[round.jackpots]++;
    s.pictureTiers[round.pictureTier || 0]++;
    state.bandits.forEach(function (b) {
      b.landed.forEach(function (slot) {
        if (slot.length === 2) s.doublesLanded++;
        if (slot.length >= 3) s.triplesLanded++;
        slot.forEach(function (e) { s.emojiHits[e] = (s.emojiHits[e] || 0) + 1; });
      });
    });
    round.minis.forEach(function (m) {
      s.miniReels++;
      s.miniSpins += m.spins.length;
      s.miniStreaks[m.streak] = (s.miniStreaks[m.streak] || 0) + 1;
      if (m.streak > s.bestMiniStreak) s.bestMiniStreak = m.streak;
    });
    if (round.illegal) s.illegalPopOuts++;
    saveStats();
    try {
      if (global.CustomEvent && global.dispatchEvent) {
        global.dispatchEvent(new CustomEvent('pix-bandits-spin', { detail: { round: summary(round), stats: getStats() } }));
      }
    } catch (e) {}
  }
  function getStats() {
    var s = JSON.parse(JSON.stringify(_stats));
    var n = s.spinsTotal || 0;
    var p = function (x) { return n ? x / n : 0; };
    // empirical probabilities for the future statistics view
    s.probabilities = {
      anyJackpot: p(n - s.multiJackpots[0]),
      twoJackpots: p(s.multiJackpots[2]),
      threeJackpots: p(s.multiJackpots[3]),
      illegalPopOut: p(s.illegalPopOuts),
      miniReelPerSpin: p(s.miniReels),
      miniWinPerSpin: s.miniSpins ? (s.miniSpins - s.miniReels) / s.miniSpins : 0
    };
    s.config = CONFIG;
    return s;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  // ZWJ = U+200D. A catalogue entry containing it is an emoji *sequence*.
  function isSequence(e) {
    return typeof e === 'string' && e.indexOf('\u200D') !== -1;
  }
  function kingdomOf(e) { return KINGDOM_OF[e] || null; }
  function isIllegal(e) { return !!ILLEGAL_OF[e]; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // A slot is an array of 1–3 different emojis. Old callers may pass strings.
  function asSlot(x) { return Array.isArray(x) ? x.filter(Boolean) : (x ? [x] : []); }
  function flatSlots(slots) {
    var out = [];
    (slots || []).forEach(function (s) { out = out.concat(asSlot(s)); });
    return unique(out);
  }

  function slotSize(dbl, tri) {
    var r = Math.random();
    return r < tri ? 3 : (r < tri + dbl ? 2 : 1);
  }
  function makeSlot(first, pool, size) {
    var slot = [first];
    for (var tries = 0; slot.length < size && tries < 60; tries++) {
      var e = pick(pool);
      if (slot.indexOf(e) === -1) slot.push(e);
    }
    return slot;
  }
  // Reels are built independently (an emoji may sit on two reels of one
  // bandit), so an exact-match jackpot is possible but rare.
  function buildReel(pool, size, dbl, tri) {
    var firsts = shuffle(pool);
    while (firsts.length < size && pool.length) firsts = firsts.concat(shuffle(pool));
    return firsts.slice(0, size).map(function (e) { return makeSlot(e, pool, slotSize(dbl, tri)); });
  }

  var TIER_LABELS = ['No jackpot', 'Kingdom pair', 'Kingdom triple', 'Exact match'];

  // Jackpot tier for a line of slots — see JACKPOT TIERS at the top.
  function jackpotFor(slots) {
    var list = (slots || []).map(asSlot).filter(function (s) { return s.length; });
    var emoCount = Object.create(null);
    var kCount = Object.create(null);
    var exact = null, best = null;
    list.forEach(function (slot) {
      var seenE = Object.create(null), seenK = Object.create(null);
      slot.forEach(function (e) {
        if (!seenE[e]) {
          seenE[e] = 1;
          emoCount[e] = (emoCount[e] || 0) + 1;
          if (emoCount[e] >= 2 && !exact) exact = e;
        }
        var k = kingdomOf(e);
        if (k && !seenK[k]) {
          seenK[k] = 1;
          kCount[k] = (kCount[k] || 0) + 1;
          if (!best || kCount[k] > kCount[best]) best = k;
        }
      });
    });
    if (exact) return { tier: 3, kingdom: kingdomOf(exact), emoji: exact, label: TIER_LABELS[3] };
    var n = best ? kCount[best] : 0;
    if (n >= 3) return { tier: 2, kingdom: best, label: TIER_LABELS[2] };
    if (n === 2) return { tier: 1, kingdom: best, label: TIER_LABELS[1] };
    return { tier: 0, kingdom: null, label: TIER_LABELS[0] };
  }

  // ── State ────────────────────────────────────────────────────────────────
  var state = {
    bandits: [],   // [{ meta, reels: [[slot×12]×3], landed: [slot, slot, slot] }]
    illegal: { active: false, reels: null, landed: null, emojis: [] },
    round: null,   // last paid spin (casino result)
    roundSeq: 0,
    anim: null,    // running mini-reel animation
    force: null,   // debug forced outcome
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
    var reels = [];
    for (var r = 0; r < 3; r++) reels.push(buildReel(theme, REEL_SIZE, DOUBLE_CHANCE, TRIPLE_CHANCE));
    return { meta: BANDIT_META[index], reels: reels, landed: reels.map(pick) };
  }

  function buildIllegal() {
    var reels = [];
    for (var r = 0; r < 3; r++) reels.push(buildReel(ILLEGAL_LIST, REEL_SIZE, ILLEGAL_DOUBLE_CHANCE, ILLEGAL_TRIPLE_CHANCE));
    var landed = reels.map(pick);
    return { active: true, reels: reels, landed: landed, emojis: flatSlots(landed) };
  }

  function reshuffleBandit(index) {
    state.bandits[index] = buildBandit(index);
    spinBandit(index);
  }

  function spinBandit(index) {
    var b = state.bandits[index];
    b.landed = b.reels.map(pick);
    return b.landed;
  }

  function banditResult(i) {
    var j = jackpotFor(state.bandits[i].landed);
    j.jackpot = j.tier >= JACKPOT_MIN_TIER;
    j.base = j.jackpot ? BASE_WIN[j.tier] : 0;
    return j;
  }

  function pictureJackpot() {
    var centerSlots = state.bandits.map(function (b) { return b.landed[1]; });
    var pay = jackpotFor(centerSlots);
    var best = { tier: pay.tier, label: pay.label, kingdom: pay.kingdom, source: 'picture line' };
    for (var i = 0; i < state.bandits.length; i++) {
      var r = banditResult(i);
      if (r.jackpot && r.tier > best.tier) {
        best = { tier: r.tier, label: r.label, kingdom: r.kingdom, source: 'Bandit ' + BANDIT_META[i].id };
      }
    }
    if (state.illegal.active) {
      best.illegal = true;
      best.label = 'Triple jackpot · illegal bandit';
    }
    return best;
  }

  // ── Debug: forced outcomes (#pix-force-…) ───────────────────────────────
  function parseForce(hash) {
    var m = /pix-force-([a-z0-9+,\-]+)/i.exec(hash || '');
    if (!m) return null;
    var f = { jackpots: null, triples: 0, double: false, streak: null, none: false, raw: m[1] };
    m[1].toLowerCase().split(/[+,]/).forEach(function (t) {
      var x;
      if (t === 'triple') f.triples = Math.max(f.triples, 1);
      else if ((x = /^triples?-(\d)$/.exec(t))) f.triples = Math.min(3, +x[1]);
      else if (t === 'double' || t === 'doubles') f.double = true;
      else if ((x = /^streak-(\d+)$/.exec(t))) f.streak = Math.min(MINI_MAX_SPINS - 1, +x[1]);
      else if ((x = /^(\d)jackpots?$/.exec(t))) f.jackpots = Math.min(3, +x[1]);
      else if (t === 'none') { f.none = true; f.jackpots = 0; }
    });
    if (f.streak != null && !f.triples) f.triples = 1;
    return f;
  }

  function trimTriples(b) {
    b.landed = b.landed.map(function (s) { return s.length > 2 ? s.slice(0, 2) : s; });
  }

  function applyForce(f) {
    if (!f) return;
    state.bandits.forEach(trimTriples);
    if (f.jackpots != null) {
      state.bandits.forEach(function (b, i) {
        if (i < f.jackpots) {
          // exact match: the same emoji on the left and right reels
          var e = pick(poolFor(i));
          b.landed[0] = [e];
          b.landed[2] = [e];
        } else {
          for (var t = 0; t < 80 && banditResult(i).jackpot; t++) { spinBandit(i); trimTriples(b); }
        }
      });
    }
    if (f.double) {
      state.bandits.forEach(function (b, i) {
        var c = b.landed[1];
        b.landed[1] = c.length >= 2 ? c.slice(0, 2) : makeSlot(c[0], poolFor(i), 2);
      });
    }
    for (var i = 0; i < f.triples && i < 3; i++) {
      var b = state.bandits[i];
      b.landed[1] = makeSlot(b.landed[1][0], poolFor(i), 3);
    }
  }

  // ── Mini triplet reel ───────────────────────────────────────────────────
  function spinMini(banditIndex, reelIndex, slot, f) {
    var two = shuffle(slot).slice(0, 2);
    var spins = [];
    if (f && f.streak != null) {
      for (var k = 0; k < f.streak; k++) spins.push(true);
      spins.push(false);
    } else {
      while (spins.length < MINI_MAX_SPINS) {
        var win = Math.random() < MINI_WIN_CHANCE;
        spins.push(win);
        if (!win) break;
      }
    }
    var streak = 0;
    while (streak < spins.length && spins[streak]) streak++;
    return {
      bandit: banditIndex, reel: reelIndex, triple: slot.slice(),
      target: two[0], other: two[1], spins: spins,
      landed: spins.map(function (w) { return w ? two[0] : two[1]; }),
      streak: streak, mult: streak ? streak * MINI_STEP : 1
    };
  }

  // ── One paid spin → the casino round ────────────────────────────────────
  function evaluateRound(f) {
    var results = state.bandits.map(function (b, i) { return banditResult(i); });
    var jackpots = results.filter(function (r) { return r.jackpot; }).length;
    var minis = [];
    state.bandits.forEach(function (b, i) {
      b.landed.forEach(function (slot, r) { if (slot.length >= 3) minis.push(spinMini(i, r, slot, f)); });
    });
    var base = results.reduce(function (a, r) { return a + r.base; }, 0);
    var miniWins = minis.filter(function (m) { return m.streak > 0; });
    var baseUsed = base > 0 ? base : (miniWins.length ? MINI_ONLY_BASE : 0);
    var multi = MULTI_JACKPOT[jackpots];
    var total = BigInt(0);
    if (baseUsed > 0) {
      total = BigInt(baseUsed) * BigInt(multi);
      miniWins.forEach(function (m) { total *= BigInt(m.mult); });
    }
    var illegal = jackpots === 3;
    // FUTURE (not built): the illegal bandit will be able to cost popCoins
    // here — e.g. an illegal pop-out that the photo then fails could subtract
    // from casino.balance and drive it below zero, which is where the bank
    // credit requirements (credit limit, paying it back) will be checked.
    return {
      id: ++state.roundSeq,
      cost: SPIN_COST,
      bandits: results,
      jackpots: jackpots,
      multi: multi,
      minis: minis,
      base: base,
      baseUsed: baseUsed,
      miniOnly: base === 0 && baseUsed > 0,
      total: total,
      net: total - BigInt(SPIN_COST),
      illegal: illegal
    };
  }

  function breakdownText(round) {
    if (!round) return '';
    var parts = [];
    var jp = round.bandits.map(function (r, i) { return { r: r, id: BANDIT_META[i].id }; })
      .filter(function (x) { return x.r.jackpot; });
    if (!round.baseUsed) {
      return 'No win this spin · spin cost −' + fmt(round.cost) + ' popCoin' + (round.cost === 1 ? '' : 's');
    }
    if (round.miniOnly) {
      parts.push('spin stake ' + fmt(round.baseUsed) + ' (no jackpot)');
    } else {
      var b = jp.map(function (x) { return 'Bandit ' + x.id + ' ' + x.r.label.toLowerCase() + ' ' + fmt(x.r.base); });
      parts.push(b.join(' + ') + (jp.length > 1 ? ' = ' + fmt(round.base) : ''));
    }
    var s = parts[0];
    if (round.multi > 1) s += ' × ' + fmt(round.multi) + ' (' + round.jackpots + ' jackpots)';
    round.minis.forEach(function (m) {
      if (!m.streak) return;
      s += ' × ' + fmt(m.mult) + ' (mini reel ' + m.target + ' · ' + m.streak + ' win' + (m.streak === 1 ? '' : 's in a row') + ')';
    });
    s += ' = ' + fmt(round.total) + ' popCoins · spin cost −' + fmt(round.cost) + ' · net ' + (round.net < BigInt(0) ? '' : '+') + fmt(round.net);
    return s;
  }

  function summary(round) {
    if (!round) return null;
    return {
      id: round.id,
      cost: round.cost,
      jackpots: round.jackpots,
      multi: round.multi,
      base: round.base,
      baseUsed: round.baseUsed,
      total: round.total.toString(),
      totalText: fmt(round.total),
      net: round.net.toString(),
      illegal: round.illegal,
      bandits: round.bandits.map(function (r) { return { tier: r.tier, label: r.label, jackpot: r.jackpot, base: r.base }; }),
      minis: round.minis.map(function (m) {
        return { bandit: m.bandit, target: m.target, other: m.other, spins: m.spins.slice(), streak: m.streak, mult: m.mult };
      }),
      breakdown: breakdownText(round)
    };
  }

  function challengeFromState() {
    // Picture line = centre reel of each bandit; every emoji in those slots
    // (doubles and triples included) is its own photo target.
    var centerSlots = state.bandits.map(function (b) { return b.landed[1].slice(); });
    var centers = flatSlots(centerSlots);
    var landed = state.bandits.map(function (b) { return b.landed.map(function (s) { return s.slice(); }); });
    var jackpot = pictureJackpot();
    var il = state.illegal;
    return {
      title: centerSlots.map(function (s) { return s.join(''); }).join(' '),
      indicators: centers.slice(),
      centers: centers,
      centerSlots: centerSlots,
      kingdoms: centers.map(kingdomOf),
      jackpot: jackpot,
      bandits: state.bandits.map(function (b, i) {
        var r = banditResult(i);
        return { id: b.meta.id, tier: r.tier, label: r.label, jackpot: r.jackpot };
      }),
      illegal: { active: !!il.active, emojis: il.active ? il.emojis.slice() : [], landed: il.active ? il.landed.map(function (s) { return s.slice(); }) : [] },
      casino: summary(state.round),
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

  function reduceMotion() {
    try { return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }

  function poolListHtml(bandit) {
    var flat = [];
    var seen = Object.create(null);
    for (var r = 0; r < bandit.reels.length; r++) {
      for (var i = 0; i < bandit.reels[r].length; i++) {
        var slot = bandit.reels[r][i];
        for (var q = 0; q < slot.length; q++) {
          if (!seen[slot[q]]) { seen[slot[q]] = 1; flat.push(slot[q]); }
        }
      }
    }
    return flat.map(function (e) {
      var seq = isSequence(e);
      var k = KINGDOM_BY_ID[kingdomOf(e)];
      var tag = k ? k.label : (isIllegal(e) ? 'Illegal emojis' : '');
      return '<span class="pix-bandit-pool-emoji' + (seq ? ' is-zwj' : '') + '" title="' + escapeAttr(e) +
        (tag ? ' · ' + escapeAttr(tag) : '') + (seq ? ' · emoji sequence (ZWJ)' : '') + '">' + e + '</span>';
    }).join('');
  }

  function slotHtml(slot) {
    var n = slot.length;
    var seq = slot.some(isSequence);
    var title = n === 1 ? (seq ? 'Emoji sequence (ZWJ) — counts as one target' : '')
      : (n === 2 ? 'Double: 2 emojis, 2 separate photo targets' : 'Triple: 3 emojis, 3 separate photo targets — triggers the mini reel');
    return '<span class="pix-bandit-landed n-' + n + (seq ? ' is-zwj' : '') + '"' + (title ? ' title="' + escapeAttr(title) + '"' : '') + '>' +
      slot.map(function (e) { return '<i>' + e + '</i>'; }).join('') + '</span>';
  }

  function reelsHtml(landed, illegal) {
    var html = '<div class="pix-bandit-reels">';
    for (var r = 0; r < 3; r++) {
      var slot = asSlot(landed[r]);
      html += '<div class="pix-bandit-reel' + (r === 1 ? ' is-center' : '') + (slot.length > 1 ? ' is-multi' : '') +
        (slot.length > 2 ? ' is-triple' : '') + '" data-reel="' + r + '">' + slotHtml(slot) + '</div>';
    }
    return html + '</div>';
  }

  function miniHtml(m, idx, live) {
    var final = !live;
    var log = final ? m.spins.map(function (w) { return '<b class="' + (w ? 'is-win' : 'is-miss') + '">' + (w ? '✓' : '✗') + '</b>'; }).join('') : '';
    var shown = final ? m.landed[m.landed.length - 1] : m.target;
    return '<div class="pix-mini' + (final ? ' is-done' : ' is-live') + (m.streak ? ' has-win' : '') + '" data-mini="' + idx + '">' +
      '<div class="pix-mini-head">✨ Mini reel <span>🎯 ' + m.target + ' · blank ' + m.other + '</span></div>' +
      '<div class="pix-mini-row"><div class="pix-mini-window" aria-live="polite"><span>' + shown + '</span></div>' +
      '<div class="pix-mini-log">' + log + '</div></div>' +
      '<div class="pix-mini-mult">' + (final ? miniMultText(m.streak) : 'spinning…') + '</div></div>';
  }
  function miniMultText(streak) {
    return streak ? '×' + fmt(streak * MINI_STEP) + ' · ' + streak + ' win' + (streak === 1 ? '' : 's in a row') : 'missed · ×1';
  }

  function jackpotHtml(ch) {
    var j = ch.jackpot;
    if (ch.illegal && ch.illegal.active) {
      return '<div class="pix-jackpot is-illegal">🚨 All three bandits hit a jackpot → the illegal bandit is out. ' +
        'Its ' + ch.illegal.emojis.length + ' emojis join your picture as extra required indicators, no ease at all: super extra hard.</div>';
    }
    var steps = j.tier * options.ease;
    var k = j.kingdom ? KINGDOM_BY_ID[j.kingdom] : null;
    if (!j.tier) {
      return '<div class="pix-jackpot is-none">🖼️ Picture: no jackpot — the full picture challenge</div>';
    }
    var what = j.tier === 3 ? 'identical emojis' : (j.tier === 2 ? 'all three from ' : 'two from ') + (k ? k.icon + ' ' + k.label : '');
    return '<div class="pix-jackpot is-tier-' + j.tier + '">🖼️ Picture: ' + escapeAttr(j.label) + ' on ' + escapeAttr(j.source === 'picture line' || !j.source ? 'the picture line' : j.source) +
      ' (' + escapeAttr(what) + ') → ' +
      (steps ? steps + ' ease step' + (steps === 1 ? '' : 's') + ', easier picture' : 'ease is set to tough, no change') + '</div>';
  }

  function casinoHtml() {
    var neg = casino.balance < BigInt(0);
    return '<div class="pix-casino">' +
      '<span class="pix-casino-bal">🎰 Casino balance <b class="' + (neg ? 'is-neg' : '') + '" id="pix-casino-bal">' + fmt(casino.balance) + '</b> popCoins</span>' +
      '<span class="pix-casino-cost">Spin costs ' + fmt(SPIN_COST) + ' popCoin' + (SPIN_COST === 1 ? '' : 's') + '</span>' +
      (neg ? '<span class="pix-casino-note">Below zero — later this needs bank credit</span>' : '') +
      '</div>';
  }

  function winHtml(round, pending) {
    if (!round) return '<div class="pix-win is-idle">📊 Winnings: spin to play. Jackpots pay 25 (kingdom triple) or 100 (exact match); 2 jackpots ×20, 3 jackpots ×420; a triple slot spins the mini reel for ×1,000 per win in a row.</div>';
    var cls = round.total > BigInt(0) ? 'is-win' : 'is-none';
    return '<div class="pix-win ' + cls + (pending ? ' is-pending' : '') + '" id="pix-win">' +
      (round.total > BigInt(0) ? '<strong>💰 +' + fmt(round.total) + ' popCoins</strong> ' : '') +
      '<span class="pix-win-math">📊 ' + escapeAttr(breakdownText(round)) + '</span></div>';
  }

  function statsHookHtml() {
    // HOOK: hidden statistics / probability snapshot for a future view
    var s = _stats;
    return '<div class="pix-bandit-stats-hook" id="pix-stats-hook" hidden data-spins="' + s.spinsTotal +
      '" data-illegal="' + s.illegalPopOuts + '" data-best-mini-streak="' + s.bestMiniStreak +
      '" data-multi-jackpots="' + s.multiJackpots.join(',') + '"><!-- stats & probability: PixBandits.getStats() --></div>';
  }

  function render(animate) {
    if (!state.root) return;
    ensureBandits();
    stopAnim();
    var round = state.round;
    var live = !!(animate && round && round.minis.length && !reduceMotion());
    var ch = challengeFromState();
    var html = '<div class="pix-bandits' + (state.illegal.active ? ' has-illegal' : '') + '" role="group" aria-label="Emoji challenge bandits">';
    html += '<div class="pix-bandits-header">🎰 Emoji Bandits <span class="pix-bandits-sub">fed by kingdoms · ⚙ to change</span></div>';
    html += casinoHtml();
    html += '<div class="pix-bandits-row">';

    for (var i = 0; i < state.bandits.length; i++) {
      var b = state.bandits[i];
      var res = banditResult(i);
      var kNames = options.kingdoms[i].map(function (id) { return KINGDOM_BY_ID[id].label; }).join(', ');
      html += '<div class="pix-bandit' + (res.jackpot ? ' is-jackpot' : '') + '" data-bandit="' + i + '" style="--bandit-accent:' + b.meta.accent + '">';
      html += '<div class="pix-bandit-label" title="Fed by: ' + escapeAttr(kNames) + '">' + escapeAttr(banditLabel(i)) + '</div>';
      html += '<div class="pix-bandit-pool" aria-label="Reel pool">' + poolListHtml(b) + '</div>';
      html += reelsHtml(b.landed);
      html += '<div class="pix-bandit-result tier-' + res.tier + '">' +
        (res.jackpot ? '🎉 JACKPOT · ' + escapeAttr(res.label) + ' · ' + fmt(res.base)
          : (res.tier === 1 ? 'Kingdom pair · no jackpot' : 'No jackpot')) + '</div>';
      // Mini triplet reels pop out under the bandit that landed the triple
      if (round) {
        round.minis.forEach(function (m, idx) { if (m.bandit === i) html += miniHtml(m, idx, live); });
      }
      html += '<button type="button" class="pp-btn pix-bandit-reset" data-reset="' + i + '" title="Reshuffle this bandit’s pools and re-roll (free, no casino payout)">🔄 Reset</button>';
      // HOOK: future statistics & probability panel mounts beside/under Reset
      html += '<div class="pix-bandit-stats-hook" data-stats-bandit="' + i + '" hidden><!-- stats & probability --></div>';
      html += '</div>';
    }
    html += '</div>';

    // The illegal bandit: hidden unless all three bandits hit a jackpot
    if (state.illegal.active) {
      var il = state.illegal;
      html += '<div class="pix-bandit pix-bandit-illegal' + (animate && !reduceMotion() ? ' is-popping' : '') + '" data-bandit="illegal" style="--bandit-accent:' + ILLEGAL_META.accent + '" role="alert">';
      html += '<div class="pix-bandit-label">🚨 ILLEGAL BANDIT · fed by the illegal emojis pool (' + ILLEGAL_LIST.length + ')</div>';
      html += '<div class="pix-bandit-pool" aria-label="Illegal reel pool">' + poolListHtml(il) + '</div>';
      html += reelsHtml(il.landed, true);
      html += '<div class="pix-bandit-result is-illegal">+' + il.emojis.length + ' extra required indicators: ' + il.emojis.join(' ') + '</div>';
      // FUTURE (comment only): the illegal bandit will tie into LOSING popCoins
      // (going below zero) and bank credit requirements. Not built yet.
      html += '</div>';
    }

    html += jackpotHtml(ch);
    html += winHtml(round, live);
    html += '<button type="button" class="pp-btn pix-bandits-spin-all" id="pix-bandits-spin-all">🎰 Spin all bandits · ' + fmt(SPIN_COST) + ' popCoin</button>';
    html += statsHookHtml();
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
    if (live) runMiniAnim(round);
  }

  // ── Mini reel animation (one mini reel after the other) ─────────────────
  function stopAnim() {
    if (state.anim) { state.anim.cancelled = true; clearTimeout(state.anim.t); clearInterval(state.anim.iv); state.anim = null; }
  }

  function runMiniAnim(round) {
    var anim = { cancelled: false, t: 0, iv: 0 };
    state.anim = anim;
    var root = state.root;
    var mi = 0, si = 0;
    function el(idx) { return root.querySelector('.pix-mini[data-mini="' + idx + '"]'); }
    function finish() {
      if (anim.cancelled) return;
      state.anim = null;
      var w = root.querySelector('#pix-win');
      if (w) w.classList.remove('is-pending');
      try { if (global.CustomEvent) root.dispatchEvent(new CustomEvent('pix-mini-done', { bubbles: true, detail: { round: round.id } })); } catch (e) {}
    }
    function step() {
      if (anim.cancelled) return;
      var m = round.minis[mi];
      if (!m) { finish(); return; }
      var box = el(mi);
      if (!box) { mi++; si = 0; step(); return; }
      var win = box.querySelector('.pix-mini-window span');
      var log = box.querySelector('.pix-mini-log');
      var mult = box.querySelector('.pix-mini-mult');
      var flip = 0;
      box.classList.add('is-spinning');
      anim.iv = setInterval(function () { flip++; if (win) win.textContent = flip % 2 ? m.other : m.target; }, 70);
      anim.t = setTimeout(function () {
        clearInterval(anim.iv);
        if (anim.cancelled) return;
        box.classList.remove('is-spinning');
        var w = m.spins[si];
        if (win) win.textContent = m.landed[si];
        if (log) log.insertAdjacentHTML('beforeend', '<b class="' + (w ? 'is-win' : 'is-miss') + '">' + (w ? '✓' : '✗') + '</b>');
        var sofar = 0;
        while (sofar <= si && m.spins[sofar]) sofar++;
        if (mult) mult.textContent = w ? '×' + fmt(sofar * MINI_STEP) + ' so far — spinning again…' : miniMultText(m.streak);
        box.classList.toggle('has-win', sofar > 0);
        si++;
        if (si >= m.spins.length) { box.classList.remove('is-live'); box.classList.add('is-done'); mi++; si = 0; }
        anim.t = setTimeout(step, 380);
      }, 620);
    }
    anim.t = setTimeout(step, 250);
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
      'Each step removes one indicator (smallest first); extra steps free the rest (any place, any size). ' +
      'Except: when all three bandits hit a jackpot the illegal bandit pops out and the picture gets super extra hard.</p>';
    html += '</div>';
    html += '<p class="pix-opt-note">Tick the kingdoms that feed each bandit. Every bandit keeps at least one. ' +
      'Reel slots: about ' + Math.round(DOUBLE_CHANCE * 100) + '% doubles and ' + Math.round(TRIPLE_CHANCE * 100) + '% triples.</p>';
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
    if (!state.root || reduceMotion()) return;
    var sel = only == null ? '.pix-bandit-reel' : '.pix-bandit[data-bandit="' + only + '"] .pix-bandit-reel';
    var reels = state.root.querySelectorAll(sel);
    for (var i = 0; i < reels.length; i++) {
      reels[i].classList.remove('spinning');
      void reels[i].offsetWidth; // force reflow
      reels[i].classList.add('spinning');
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────
  var CONFIG = {
    REEL_SIZE: REEL_SIZE,
    DOUBLE_CHANCE: DOUBLE_CHANCE,
    TRIPLE_CHANCE: TRIPLE_CHANCE,
    ILLEGAL_DOUBLE_CHANCE: ILLEGAL_DOUBLE_CHANCE,
    ILLEGAL_TRIPLE_CHANCE: ILLEGAL_TRIPLE_CHANCE,
    SPIN_COST: SPIN_COST,
    JACKPOT_MIN_TIER: JACKPOT_MIN_TIER,
    BASE_WIN: BASE_WIN.slice(),
    MULTI_JACKPOT: MULTI_JACKPOT.slice(),
    MINI_STEP: MINI_STEP,
    MINI_WIN_CHANCE: MINI_WIN_CHANCE,
    MINI_MAX_SPINS: MINI_MAX_SPINS,
    MINI_ONLY_BASE: MINI_ONLY_BASE
  };

  var api = {
    REEL_SIZE: REEL_SIZE,
    MASTER_LIST: MASTER_LIST,
    KINGDOMS: KINGDOMS,
    FLAGS: FLAGS,
    ILLEGAL: ILLEGAL,
    ILLEGAL_LIST: ILLEGAL_LIST,
    EASE_LABELS: EASE_LABELS,
    CONFIG: CONFIG,
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
    isIllegal: isIllegal,
    kingdomOf: kingdomOf,
    kingdom: function (id) { return KINGDOM_BY_ID[id] || null; },
    jackpotFor: jackpotFor,
    formatNumber: fmt,
    parseForce: parseForce,

    force: function (spec) {
      state.force = typeof spec === 'string' ? parseForce(/pix-force-/.test(spec) ? spec : 'pix-force-' + spec) : (spec || null);
      return state.force;
    },
    clearForce: function () { state.force = null; },

    spinAll: function () {
      ensureBandits();
      for (var i = 0; i < 3; i++) spinBandit(i);
      var f = state.force || (global.location ? parseForce(global.location.hash) : null);
      applyForce(f);
      var round = evaluateRound(f);
      round.pictureTier = 0;
      state.round = round;
      state.illegal = round.illegal ? buildIllegal() : { active: false, reels: null, landed: null, emojis: [] };
      round.pictureTier = pictureJackpot().tier;
      casino.balance = casino.balance - BigInt(round.cost) + round.total;
      saveCasino();
      recordRound(round);
      render(true);
      flashReels();
      return notify('spin');
    },

    resetBandit: function (index) {
      ensureBandits();
      index = index | 0;
      if (index < 0 || index > 2) return challengeFromState();
      reshuffleBandit(index);
      _stats.resets++;
      saveStats();
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

    getCasino: function () {
      return {
        balance: casino.balance.toString(),
        balanceText: fmt(casino.balance),
        negative: casino.balance < BigInt(0),
        spinCost: SPIN_COST,
        lastRound: summary(state.round)
      };
    },

    getStats: getStats,
    resetStats: function () { _stats = freshStats(); api._stats = _stats; saveStats(); return getStats(); },

    getCounts: function () {
      ensureBandits();
      var kingdoms = {};
      KINGDOMS.forEach(function (k) { kingdoms[k.id] = k.list.length; });
      return {
        master: MASTER_LIST.length,
        illegal: ILLEGAL_LIST.length,
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
