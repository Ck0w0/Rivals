// Screens, menus and the game table.
(function (R) {
  const C = R.CARDS;
  const CREDITS = [
    ['Game design', 'Your name here'],
    ['Rules & cards', 'Rivals of Olympus rulebook'],
    ['Programming', 'Built with Claude'],
    ['Online play', 'PeerJS (WebRTC)'],
    ['Fonts', 'Cinzel & Alegreya Sans (Google Fonts)'],
    ['Card icons', 'game-icons.net (CC BY 3.0) by Lorc, Delapouite, Skoll, Willdabeast, Caro Asercion, Cathelineau, DarkZaitzev and Pierre Leducq'],
    ['Sound', 'Synthesised in the browser with the Web Audio API'],
  ];
  const NAMES = ['Kleon', 'Daphne', 'Nikias', 'Ione', 'Xanthe', 'Lykos', 'Melita', 'Doros'];

  const app = document.getElementById('app');
  const overlay = document.getElementById('overlay');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('roo.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('roo.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };

  const ui = { screen: 'menu', net: null, lobby: null, view: null, modal: null, targets: [], lastReveal: 0, deadlineAt: 0, art: {}, logOpen: store.get('logOpen', false) };

  // ---------- backdrop & optional artwork ----------
  document.getElementById('scene').innerHTML = R.menuScene();
  (function probeArt() {
    const bg = new Image();
    bg.onload = () => { const img = document.createElement('img'); img.className = 'scene-img'; img.src = bg.src; document.getElementById('scene').appendChild(img); document.body.classList.add('has-bg'); };
    bg.src = 'assets/menu-bg.png';
    Object.keys(C).forEach(key => {
      const im = new Image();
      im.onload = () => { ui.art[key] = true; if (ui.screen === 'game') renderGame(); };
      im.src = `assets/cards/${key}.png`;
    });
  })();

  function toast(text, kind) {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    if (kind === 'error') R.sfx.play('error');
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3800);
  }

  function flash(html, kind) {
    const el = document.createElement('div');
    el.className = 'flash ' + kind;
    el.innerHTML = html;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function setScreen(name, html, inGame) {
    ui.screen = name;
    document.body.classList.toggle('in-game', !!inGame);
    app.innerHTML = html;
    renderOverlay();
  }

  const myName = () => store.get('name', NAMES[Math.floor(Math.random() * NAMES.length)]);
  function readName() {
    const el = document.getElementById('name');
    const n = el ? el.value.trim().slice(0, 16) : '';
    if (n) store.set('name', n);
    return n || myName();
  }

  // ---------- title & menus ----------
  function title() {
    return `<div class="title">
      <div class="crest">${R.laurel(-1, { w: 70, h: 110, leaves: 8, fill: '#e8b54a', stroke: '#8a5a1c' })}${R.icon('temple', 'crest-ico')}${R.laurel(1, { w: 70, h: 110, leaves: 8, fill: '#e8b54a', stroke: '#8a5a1c' })}</div>
      <h1><span class="t1">Rivals</span><span class="t-of"><i></i>of<i></i></span><span class="t2">Olympus</span></h1>
      <p class="tagline">A card game of gods, raids &amp; rival city-states</p>
    </div>`;
  }

  const btn = (label, attrs, cls) => `<button class="gbtn ${cls || ''}" ${attrs}><span class="key l"></span>${label}<span class="key r"></span></button>`;
  const mbtn = (go, label, icon, cls) => `<button class="mbtn ${cls || ''}" data-go="${go}"><span class="mbtn-ico">${R.icon(icon)}</span><span class="mbtn-label">${label}</span><span class="mbtn-arrow">›</span></button>`;

  function menu() {
    ui.modal = null;
    setScreen('menu', `<div class="menu">${title()}
      <nav class="menu-panel">
        ${mbtn('play', 'Play', 'swords', 'primary')}
        ${mbtn('cards', 'Cards', 'cardsIcon')}
        ${mbtn('rules', 'How to Play', 'scroll')}
        ${mbtn('settings', 'Settings', 'cog')}
        ${mbtn('credits', 'Credits', 'lyre')}
        ${mbtn('quit', 'Quit', 'exitDoor')}
      </nav>
      <footer class="menu-foot">2–5 players · Play online with friends or against the computer</footer></div>`);
  }

  // ---------- card gallery ----------
  const GALLERY = [
    ['all', 'All'], ['resource', 'Resources'], ['raid', 'Raids'], ['god', 'God Actions'], ['reaction', 'Reactions'],
    ['hidden', 'Hidden & Events'], ['fleet', 'Fleet'], ['polis', 'Polis'], ['treasure', 'Treasure'],
    ['blessing', 'Blessings'], ['chaos', 'Chaos'], ['hero', 'Heroes & Shields'],
  ];
  function galleryMatch(f, d) {
    switch (f) {
      case 'all': return true;
      case 'raid': return !!d.raid;
      case 'god': return d.type === 'action' && !d.raid;
      case 'hidden': return d.type === 'hidden' || d.type === 'event';
      case 'fleet': case 'polis': case 'treasure': return d.type === 'point' && d.cat === f;
      default: return d.type === f;
    }
  }

  function heroCard(key) {
    const h = R.HEROES[key];
    return `<div class="card t-hero" title="${esc(h.name)}">
      <div class="card-head"><span class="card-name">${esc(h.name)}</span></div>
      <div class="card-art">${R.icon(key, 'art-ico')}</div>
      <div class="card-type">Hero</div><div class="card-text">${esc(h.text)}</div></div>`;
  }
  const shieldCard = () => `<div class="card t-shield" title="Shield">
      <div class="card-head"><span class="card-name">Shield</span></div>
      <div class="card-art">${R.icon('aegis', 'art-ico')}</div>
      <div class="card-type">Shield</div><div class="card-text">Used in raids. If the raider picks a Shield, the raid fails.</div></div>`;

  function gallery() {
    const f = ui.galleryFilter || 'all';
    const items = [];
    Object.keys(C).forEach(key => {
      const d = C[key];
      if (!galleryMatch(f, d)) return;
      items.push(`<div class="g-item">${card(key, { cls: 'g-card' })}<span class="g-count">×${d.n}<small>${d.deck === 'agora' ? 'Agora' : 'Oracle'}${d.noTwo ? ' · not in 2-player' : ''}</small></span></div>`);
    });
    if (f === 'all' || f === 'hero') {
      Object.keys(R.HEROES).forEach(k => items.push(`<div class="g-item">${heroCard(k).replace('class="card t-hero"', 'class="card t-hero g-card"')}<span class="g-count">×1<small>Hero</small></span></div>`));
      items.push(`<div class="g-item">${shieldCard().replace('class="card t-shield"', 'class="card t-shield g-card"')}<span class="g-count">×25<small>Shield pile</small></span></div>`);
    }
    setScreen('cards', `<div class="gallery-page"><div class="gallery">
      <header class="gallery-head"><h2>The Cards</h2><p>193 cards: 110 in the Oracle deck, 47 in the Agora, 25 Shields, 6 Heroes and 5 reference cards. Click a card to look closer.</p>
        ${btn('Back', 'data-go="menu"', 'ghost small')}</header>
      <div class="tabs">${GALLERY.map(([k, label]) => `<button class="tab ${f === k ? 'on' : ''}" data-act="galleryFilter" data-arg="${k}">${label}</button>`).join('')}</div>
      <div class="gallery-grid">${items.join('')}</div></div></div>`);
  }

  function page(heading, body) {
    return `<div class="page"><div class="scroll">
      <div class="scroll-rod"></div><div class="scroll-body"><h2>${heading}</h2>${body}</div><div class="scroll-rod"></div>
    </div></div>`;
  }

  function playMenu() {
    setScreen('play', page('Choose Your Path', `
      <label class="field">Your name <input id="name" maxlength="16" value="${esc(myName())}" autocomplete="off"></label>
      <div class="stack">
        ${btn('Host an Online Game', 'data-act="host"')}<p class="hint">You get a room code to share with up to 4 friends.</p>
        ${btn("Join a Friend's Game", 'data-go="join"')}<p class="hint">Enter the room code your host gives you.</p>
        ${btn('Play vs Computer', 'data-act="solo"')}<p class="hint">Practise against the gods' chosen champions.</p>
        ${btn('Back', 'data-go="menu"', 'ghost')}
      </div>`));
  }

  function joinScreen(prefill) {
    setScreen('join', page('Join a Game', `
      <label class="field">Your name <input id="name" maxlength="16" value="${esc(myName())}" autocomplete="off"></label>
      <label class="field">Room code <input id="code" class="code-input" maxlength="5" value="${esc(prefill || '')}" autocomplete="off" placeholder="ABCDE"></label>
      <div class="stack">${btn('Join', 'data-act="join"', 'big')}${btn('Back', 'data-go="play"', 'ghost')}</div>`));
    const code = document.getElementById('code');
    code.addEventListener('keydown', e => { if (e.key === 'Enter') ACTS.join(); });
    (prefill ? code : document.getElementById('name')).focus();
  }

  function settings() {
    setScreen('settings', page('Settings', `
      <label class="field">Player name <input id="name" maxlength="16" value="${esc(myName())}" autocomplete="off"></label>
      <div class="opt-row"><span>Animations</span>
        <button class="pill ${store.get('motion', true) ? 'on' : ''}" data-act="motion" data-arg="1">On</button>
        <button class="pill ${store.get('motion', true) ? '' : 'on'}" data-act="motion" data-arg="0">Off</button></div>
      <div class="opt-row"><span>Sound</span>
        <button class="pill ${R.sfx.on ? 'on' : ''}" data-act="sound" data-arg="1">On</button>
        <button class="pill ${R.sfx.on ? '' : 'on'}" data-act="sound" data-arg="0">Off</button></div>
      <div class="opt-row"><span>Volume</span><input id="vol" class="slider" type="range" min="0" max="100" value="${Math.round(R.sfx.volume * 100)}"></div>
      <p class="hint">Custom art: put a background at <code>assets/menu-bg.png</code> and card pictures at <code>assets/cards/&lt;card&gt;.png</code>. Custom sounds go in <code>assets/sfx/&lt;name&gt;.mp3</code>. They all appear automatically.</p>
      <div class="stack">${btn('Save', 'data-act="saveSettings"', 'big')}${btn('Back', 'data-go="menu"', 'ghost')}</div>`));
    const vol = document.getElementById('vol');
    vol.addEventListener('input', () => R.sfx.set({ volume: vol.value / 100 }));
    vol.addEventListener('change', () => R.sfx.play('coin'));
  }

  function credits() {
    setScreen('credits', page('Credits', `<dl class="credits">${CREDITS.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
      <div class="stack">${btn('Back', 'data-go="menu"', 'ghost')}</div>`));
  }

  function rulesHTML() {
    return `<div class="rules">
      <p><b>Goal.</b> Be the first to reach the target (usually 6) in all three categories: <b>⛵ Fleet</b>, <b>🏛️ Polis</b> and <b>💰 Treasure</b>. Face-up point cards count, plus hidden point cards in your hand.</p>
      <h3>Your turn</h3>
      <ol><li><b>Draw</b> 2 cards (press Draw within 10 seconds).</li><li><b>Act:</b> play 1 action card from your hand (click it).</li><li><b>Buy:</b> buy 1 card from the Agora (click it). Resources are paid automatically.</li><li>Press <b>End Turn</b>.</li></ol>
      <p>You may act and buy in either order. There is no hand limit.</p>
      <h3>Trading</h3>
      <p>On your turn, as often as you like, you may discard any 2 cards from your hand to take 1 resource card of your choice into your hand (press <b>🔁 Trade</b>). It comes from the Oracle discard pile, or from the deck if none are discarded.</p>
      <h3>Turn timer</h3>
      <p>At the start of your turn press <b>Draw</b>; after 10 seconds you draw automatically. You then have 1 minute to act, buy and trade; when it runs out your turn ends. The clock pauses while other players decide on reactions.</p>
      <h3>Buying</h3>
      <p>A 2-point card needs at least 1 point in its category already; a 3-point card needs 2. Blessings cost any 3 resources and give a permanent power. You may hold only one Blessing.</p>
      <h3>Raiding</h3>
      <p>Choose a player and a category where they have face-up cards. Their cards there are shuffled face down with 1 Shield per card (heroes, Blessings and Shield Wall add more). You pick one blindly by clicking it: a point card is yours, a Shield means the raid fails. You have 15 seconds to pick (your turn clock pauses meanwhile); after that one is picked at random.</p>
      <h3>Reactions</h3>
      <p><b>Aegis</b> cancels any action card, and an Aegis can cancel an Aegis. <b>Shield Wall</b> adds 3 Shields when you are raided. When you can react, a bar appears at the bottom of the screen with a 15-second timer.</p>
      <h3>Chaos</h3>
      <p>Chaos cards resolve the moment they appear in the Agora and cannot be cancelled.</p>
      <h3>Two players</h3>
      <p>Target 5, 6 Agora cards, and no Dionysus' Feast or Pandora's Box.</p></div>`;
  }

  function rulesPage() { setScreen('rules', page('How to Play', rulesHTML() + `<div class="stack">${btn('Back', 'data-go="menu"', 'ghost')}</div>`)); }

  function quit() {
    if (ui.net) { ui.net.leave(); ui.net = null; }
    window.close();
    setScreen('quit', page('Farewell, Strategos', `<p class="center">May the gods remember your name. You can close this tab now.</p>
      <div class="stack">${btn('Return to Menu', 'data-go="menu"')}</div>`));
  }

  function connecting(text) {
    setScreen('connecting', page('Consulting the Oracle…', `<p class="center">${esc(text)}</p><div class="spinner"></div>
      <div class="stack">${btn('Cancel', 'data-act="leave"', 'ghost')}</div>`));
  }

  const SCREENS = { menu, play: playMenu, join: () => joinScreen(), settings, credits, rules: rulesPage, quit, cards: gallery };
  function go(name) { SCREENS[name](); }

  // ---------- lobby ----------
  function renderLobby() {
    const l = ui.lobby;
    if (!l) return;
    const seats = [];
    for (let i = 0; i < 5; i++) {
      const s = l.seats[i];
      if (!s) { seats.push(`<li class="seat empty"><span class="seat-icon">○</span><span>Empty seat</span></li>`); continue; }
      seats.push(`<li class="seat"><span class="seat-icon">${i === 0 ? '👑' : s.bot ? '🤖' : '🏺'}</span>
        <span class="seat-name">${esc(s.name)}${i === l.you ? ' <em>(you)</em>' : ''}</span>
        ${l.isHost && i > 0 ? `<button class="x" data-act="kick" data-arg="${i}" title="Remove">✕</button>` : ''}</li>`);
    }
    let code = '<p class="hint center">An offline game against computer players.</p>';
    if (l.online) code = l.ready
      ? `<div class="room-code"><span>Room code</span><b>${esc(l.code)}</b>${btn('Copy Invite', 'data-act="copyInvite"', 'small')}</div>`
      : `<div class="room-code"><span>Contacting Mount Olympus…</span><div class="spinner"></div></div>`;
    const two = l.seats.length === 2;
    const opts = l.isHost ? `
      <div class="opt-row"><span>Victory target</span>${[5, 6, 7].map(t => `<button class="pill ${l.opts.target === t ? 'on' : ''}" data-act="target" data-arg="${t}">${t}</button>`).join('')}</div>
      <div class="opt-row"><span>Heroes</span><button class="pill ${l.opts.heroes ? 'on' : ''}" data-act="heroes" data-arg="1">On</button><button class="pill ${l.opts.heroes ? '' : 'on'}" data-act="heroes" data-arg="0">Off</button></div>
      ${two ? '<p class="hint">2-player rules apply: target 5 at most, 6 Agora cards, no Dionysus\' Feast or Pandora\'s Box.</p>' : ''}`
      : `<p class="hint center">Target ${l.opts.target} · Heroes ${l.opts.heroes ? 'on' : 'off'}</p>`;
    const actions = l.isHost
      ? `${l.seats.length < 5 ? btn('Add Computer Player', 'data-act="addBot"') : ''}${btn('Begin the Game', 'data-act="start"', 'big')}`
      : '<p class="hint center">Waiting for the host to begin…</p>';
    setScreen('lobby', page('Assembly of City-States', `${code}<ul class="seats">${seats.join('')}</ul>${opts}
      <div class="stack">${actions}${btn('Leave', 'data-act="leave"', 'ghost')}</div>`));
  }

  function callbacks() {
    return {
      onLobby: l => { ui.lobby = l; if (!ui.view) renderLobby(); },
      onView: v => onView(v),
      onError: t => toast(t, 'error'),
      onClosed: t => { reset(); menu(); toast(t, 'error'); },
    };
  }

  function reset() {
    if (ui.net) ui.net.leave();
    ui.net = null; ui.lobby = null; ui.view = null; ui.modal = null; ui.lastReveal = 0;
  }

  // ---------- cards ----------
  function typeLabel(d) {
    switch (d.type) {
      case 'resource': return d.wild ? 'Wild Resource' : 'Resource';
      case 'action': return d.raid ? 'Raid' : 'God Action';
      case 'reaction': return 'Reaction';
      case 'hidden': return `Hidden · ${R.CAT_NAME[d.cat]}`;
      case 'event': return 'Event';
      case 'point': return R.CAT_NAME[d.cat];
      case 'blessing': return 'Blessing';
      case 'chaos': return 'Chaos';
    }
    return '';
  }

  const resToken = r => `<span class="res r-${r}" title="${R.RES_NAME[r]}">${R.icon(r)}</span>`;

  function costChips(d) {
    if (d.anyCost) return Array(d.anyCost).fill('<span class="res r-any" title="Any resource">?</span>').join('');
    let out = '';
    for (const r in d.cost) for (let k = 0; k < d.cost[r]; k++) out += resToken(r);
    return out;
  }

  function cardText(d) {
    if (d.type === 'point') return d.pts > 1 ? `Requires ${d.pts - 1} ${R.CAT_NAME[d.cat]} point${d.pts > 2 ? 's' : ''}.` : 'No requirement.';
    return d.text;
  }

  // deck is 'oracle' (red, cards you draw) or 'agora' (blue, the market and raid fans).
  function cardBack(cls, attrs, deck) {
    return `<div class="card back ${deck || 'oracle'}-back ${cls || ''}" ${attrs || ''}><div class="back-inner">${R.icon('laurels')}</div></div>`;
  }

  // Resource cards with a full painted face (assets/cards/<key>.png) show just the painting.
  const FULL_ART = ['olives', 'bronze', 'marble', 'silver', 'hoplites'];

  // Layout follows the printing spec: name and category at the top, art in the middle, text and cost at the bottom.
  function card(key, o) {
    o = o || {};
    const d = C[key];
    const act = o.act || (o.zone === 'hand' ? 'handCard' : o.zone === 'market' ? 'marketCard' : 'zoom');
    const arg = o.arg != null ? o.arg : o.id != null ? o.id : key;
    if (FULL_ART.includes(key) && ui.art[key]) {
      return `<div class="card full-art res-${d.res} ${o.cls || ''}" ${o.style || ''} data-act="${act}" data-arg="${esc(arg)}" title="${esc(d.name)}"><img src="assets/cards/${key}.png" alt="${esc(d.name)}"></div>`;
    }
    const art = ui.art[key] ? `<img src="assets/cards/${key}.png" alt="">` : R.icon(key, 'art-ico');
    const pts = d.pts ? `<div class="pts" title="${d.pts} point${d.pts > 1 ? 's' : ''}">${d.pts}</div>` : '';
    const cost = d.type === 'point' || d.anyCost ? `<div class="cost">${costChips(d)}</div>` : '';
    return `<div class="card t-${d.type} ${d.cat ? 'c-' + d.cat : ''} ${d.res ? 'res-' + d.res : ''} ${d.wild ? 'wild' : ''} ${o.cls || ''}" ${o.style || ''} data-act="${act}" data-arg="${esc(arg)}" title="${esc(d.name)}">
      <div class="card-head"><span class="card-name">${esc(d.name)}</span>${d.cat ? `<span class="cat-ico">${R.icon(d.cat)}</span>` : ''}</div>
      <div class="card-art">${art}${pts}</div>
      <div class="card-type">${typeLabel(d)}</div>
      <div class="card-text">${esc(cardText(d))}</div>${cost}</div>`;
  }

  const pname = (v, i) => (i === v.you ? 'You' : v.players[i].name);

  // One ring per category, filling up towards the victory target.
  function medals(p, big) {
    return `<div class="medals ${big ? 'big' : ''}">${R.CATS.map(cat => {
      const pts = p.points[cat], pct = Math.min(100, (pts / p.needed) * 100);
      return `<div class="medal c-${cat} ${pts >= p.needed ? 'done' : ''}" style="--p:${pct}%" title="${R.CAT_NAME[cat]}: ${pts} of ${p.needed}">
        <div class="medal-in">${R.icon(cat)}<b>${pts}</b></div></div>`;
    }).join('')}<span class="need">/${p.needed}</span></div>`;
  }

  function tableau(p, emptyText) {
    const cards = p.table.slice().sort((a, b) => R.CATS.indexOf(C[a.key].cat) - R.CATS.indexOf(C[b.key].cat) || C[b.key].pts - C[a.key].pts);
    if (!cards.length) return `<div class="tableau"><span class="empty-tab">${emptyText || 'No face-up cards'}</span></div>`;
    return `<div class="tableau">${cards.map(c => {
      const d = C[c.key];
      return `<span class="chip c-${d.cat}" data-act="zoom" data-arg="${c.key}" title="${esc(d.name)}">${R.icon(d.cat)}${esc(d.name)}<b>${d.pts}</b></span>`;
    }).join('')}</div>`;
  }

  function badges(p) {
    let out = '';
    if (p.hero) { const h = R.HEROES[p.hero]; out += `<span class="badge hero" title="${esc(h.name)}: ${esc(h.text)}">${R.icon(p.hero)}${esc(h.name)}</span>`; }
    if (p.blessing) out += `<span class="badge blessing" data-act="zoom" data-arg="${p.blessing}" title="${esc(C[p.blessing].text)}">${R.icon(p.blessing)}${esc(C[p.blessing].name)}</span>`;
    return out ? `<div class="badges">${out}</div>` : '';
  }

  const avatar = p => `<div class="avatar">${p.hero ? R.icon(p.hero) : `<span>${esc(p.name.charAt(0).toUpperCase())}</span>`}</div>`;

  // Where opponents sit around the table, in turn order starting from the player on your left.
  const SEAT_POS = { 1: ['top'], 2: ['left', 'right'], 3: ['left', 'top', 'right'], 4: ['left', 'top', 'top', 'right'] };

  // A fan of face-down card backs, one per card in hand (capped so big hands stay tidy).
  function backFan(count, cls) {
    const n = Math.min(count, 9);
    return `<div class="back-fan ${cls || ''}" title="${count} cards in hand">${Array.from({ length: n }, (_, k) => {
      const t = n > 1 ? k / (n - 1) - 0.5 : 0;
      return `<i style="--r:${(t * Math.min(40, n * 6)).toFixed(1)}deg;--y:${(t * t * 14).toFixed(1)}px"></i>`;
    }).join('')}<b>${count}</b></div>`;
  }

  function seat(v, i, pos) {
    const p = v.players[i];
    return `<div class="seat seat-${pos} ${v.turn === i && v.winner == null ? 'active' : ''} ${p.connected ? '' : 'offline'}">
      ${backFan(p.handCount)}
      <div class="plate">${avatar(p)}<div class="who"><b>${esc(p.name)}</b><small>${p.bot ? 'Computer' : p.connected ? 'Player' : 'Offline · bot playing'}</small></div></div>
      <div class="seat-info">${medals(p)}${badges(p)}${tableau(p)}</div></div>`;
  }

  function pile(inner, count, label, title) {
    return `<div class="pile" title="${title}">${inner}<b class="count">${count}</b><span class="pile-label">${label}</span></div>`;
  }

  // ---------- game screen ----------
  const isFree = v => v.turn === v.you && !v.pending && v.winner == null && v.phase === 'main';
  const mustDraw = v => v.turn === v.you && !v.pending && v.winner == null && v.phase === 'draw';

  function canBuy(v, key) {
    const me = v.players[v.you], d = C[key];
    if (!R.reqMet(me.points, d)) return false;
    return !!R.payPlan(me.hand, d, R.discountFor({ hero: me.hero, blessing: me.blessing }, d));
  }

  function statusText(v) {
    if (v.winner != null) return `${esc(v.players[v.winner].name)} wins!`;
    const pd = v.pending;
    if (pd && pd.kind === 'window') return pd.react === 'aegis' ? 'Will anyone raise the Aegis?' : `${esc(pname(v, pd.act.target.player))} may form a Shield Wall…`;
    if (pd) return pd.player === v.you ? 'Make your choice.' : `${esc(v.players[pd.player].name)} is choosing…`;
    if (v.turn === v.you) return v.phase === 'draw' ? 'Your turn: draw your cards!' : 'Your turn: act, buy, then end your turn.';
    return `${esc(v.players[v.turn].name)}'s turn${v.phase === 'draw' ? ' (drawing)' : ''}`;
  }

  // Counts down the current phase; it reads "paused" while a reaction window is open.
  const turnClock = v => v.winner == null
    ? `<span class="turn-clock ${v.clockPaused ? 'paused' : ''}" data-turn-clock="1" title="${v.phase === 'draw' ? 'Time left to draw' : 'Time left this turn'}"></span>` : '';
  const clockRing = v => `<div class="clock-ring ${v.clockPaused ? 'paused' : ''}" data-turn-ring="1"><span data-turn-clock="1"></span></div>`;

  function renderGame() {
    const v = ui.view, me = v.players[v.you], n = v.players.length, free = isFree(v);
    const myTurn = v.turn === v.you && v.winner == null;
    const others = [];
    for (let k = 1; k < n; k++) others.push((v.you + k) % n);
    const hand = me.hand.slice().sort((a, b) => order(a.key) - order(b.key));
    const drawN = me.blessing === 'oraclesSight' ? 3 : 2;
    const prevLog = document.getElementById('log');
    const stick = !prevLog || prevLog.scrollTop + prevLog.clientHeight >= prevLog.scrollHeight - 30;
    const controls = !myTurn
      ? `<div class="ctrl-wait">Waiting for<b>${esc(v.winner != null ? '—' : v.players[v.turn].name)}</b></div>`
      : v.phase === 'draw'
        ? `${clockRing(v)}${btn(`Draw ${drawN}`, `data-act="draw" ${mustDraw(v) ? '' : 'disabled'}`, 'primary draw-btn')}<div class="hint">Draws for you when time runs out</div>`
        : `${clockRing(v)}<div class="pips"><span class="pip ${v.actionsLeft ? 'on' : ''}" title="Actions left">Action ${v.actionsLeft}</span><span class="pip ${v.buysLeft ? 'on' : ''}" title="Buys left">Buy ${v.buysLeft}</span></div>
           ${btn('Trade 2 → 1', `data-act="tradeOpen" ${free && me.hand.length >= 2 ? '' : 'disabled'} title="Discard 2 cards to take 1 resource card of your choice"`, 'small')}
           ${btn('End Turn', `data-act="end" ${free ? '' : 'disabled'}`, 'primary')}`;
    // Your hand curves in an arc, like cards held in your hand.
    const handHTML = hand.map((c, k) => {
      const t = hand.length > 1 ? k / (hand.length - 1) - 0.5 : 0;
      const style = `style="--r:${(t * Math.min(26, hand.length * 3.2)).toFixed(1)}deg;--y:${(t * t * 46).toFixed(1)}px"`;
      return card(c.key, { id: c.id, zone: 'hand', style,
        cls: (free && v.actionsLeft && C[c.key].type === 'action' ? 'playable ' : '') + (C[c.key].type === 'hidden' ? 'secret' : '') });
    }).join('');
    const pos = SEAT_POS[others.length] || [];
    const seats = { left: '', top: '', right: '' };
    others.forEach((i, k) => { seats[pos[k]] += seat(v, i, pos[k]); });
    const last = v.log[v.log.length - 1];
    setScreen('game', `<div class="game">
      <header class="hud">
        <div class="hud-left">
          <button class="icon-btn" data-act="leave" title="Leave the game">${R.icon('exitDoor')}</button>
          <button class="icon-btn ${R.sfx.on ? '' : 'off'}" data-act="soundToggle" title="Sound ${R.sfx.on ? 'on' : 'off'}">${R.icon('lyre')}</button>
          <button class="icon-btn" data-act="rulesModal" title="Rules">${R.icon('scroll')}</button>
          <span class="tgt">First to ${v.target} · Round ${Math.ceil(v.turnNo / n)}</span>
        </div>
        <div class="hud-mid"><div class="status ${free || mustDraw(v) ? 'mine' : ''}">${statusText(v)} ${turnClock(v)}</div>
          ${last ? `<div class="ticker">${esc(last.text)}</div>` : ''}</div>
        <div class="hud-right"><button class="gbtn small ${ui.logOpen ? 'primary' : ''}" data-act="toggleLog">Chronicle</button></div>
      </header>
      <section class="arena">
        <div class="seats-top">${seats.top}</div>
        <div class="seats-left">${seats.left}</div>
        <div class="seats-right">${seats.right}</div>
        <div class="table">
          <div class="table-area">
            <div class="pile-col">${pile(cardBack('stack', '', 'agora'), v.agoraCount, 'Agora Supply', 'Agora supply: refills the market')}</div>
            <div class="market">${v.market.map(c => c ? card(c.key, { id: c.id, zone: 'market', cls: free && v.buysLeft && canBuy(v, c.key) ? 'affordable' : '' }) : '<div class="card empty"></div>').join('')}</div>
            <div class="pile-col">
              ${pile(v.oracleDiscardTop ? card(v.oracleDiscardTop, { cls: 'stack' }) : '<div class="card empty stack"></div>', v.oracleDiscardCount, 'Discard', 'Oracle discard pile')}
              ${pile(cardBack('stack', '', 'oracle'), v.oracleCount, 'Oracle Deck', 'Oracle deck: you draw from here')}
            </div>
          </div>
        </div>
      </section>
      <section class="me-zone ${myTurn ? 'active' : ''}">
        <div class="me-info">
          <div class="plate">${avatar(me)}<div class="who"><b>${esc(me.name)}</b><small>You · ${me.hand.length} cards</small></div></div>
          ${medals(me, true)}${badges(me)}${tableau(me, 'Buy from the Agora to score points')}</div>
        <div class="hand-fan" id="hand">${handHTML || '<span class="hint">Your hand is empty.</span>'}</div>
        <div class="me-ctrl">${controls}</div>
      </section>
      <aside class="chronicle ${ui.logOpen ? 'open' : ''}"><div class="chron-head"><h3>Chronicle</h3><button class="icon-btn" data-act="toggleLog" title="Close">✕</button></div>
        <div class="log" id="log">${v.log.map(l => `<p class="${/^—/.test(l.text) ? 'turn' : ''}">${esc(l.text)}</p>`).join('')}</div></aside>
    </div>`, true);
    fitHand();
    const log = document.getElementById('log');
    if (stick) log.scrollTop = log.scrollHeight;
  }

  // Overlap hand cards just enough that they all fit.
  function fitHand() {
    const h = document.getElementById('hand');
    if (!h) return;
    const cards = h.querySelectorAll('.card'), n = cards.length;
    if (n < 2) { h.style.removeProperty('--gap'); return; }
    const cw = cards[0].offsetWidth, avail = h.clientWidth - 40;
    h.style.setProperty('--gap', Math.min(-14, (avail - cw * n) / (n - 1)) + 'px');
  }
  window.addEventListener('resize', fitHand);

  const ORDER = ['action', 'reaction', 'resource', 'hidden', 'event'];
  const order = key => ORDER.indexOf(C[key].type) * 100 + Object.keys(C).indexOf(key);

  function onView(v) {
    const pd = v.pending;
    if (pd && pd.remaining != null) ui.deadlineAt = Date.now() + pd.remaining;
    ui.turnDeadlineAt = Date.now() + (v.phaseRemaining || 0);
    const first = !ui.view;
    ui.view = v;
    // Drop local dialogs that no longer make sense.
    if (ui.modal && ['target', 'buy', 'trade'].includes(ui.modal.type)) {
      const me = v.players[v.you], m = ui.modal;
      const still = m.type === 'target' ? me.hand.some(c => c.id === m.id)
        : m.type === 'buy' ? v.market.some(c => c && c.id === m.id)
        : m.sel.every(id => me.hand.some(c => c.id === id));
      if (!isFree(v) || !still) ui.modal = null;
    }
    renderGame();
    if (v.reveal && v.reveal.n !== ui.lastReveal) {
      if (!first) showReveal(v, v.reveal);
      ui.lastReveal = v.reveal.n;
    }
    playLogSounds(v, first);
  }

  // Each new log line may carry a sound; play the first few, slightly staggered.
  function playLogSounds(v, first) {
    const fresh = v.log.filter(l => l.n > (ui.lastLogN || 0));
    ui.lastLogN = v.log.length ? v.log[v.log.length - 1].n : 0;
    if (first) return;
    const names = [];
    fresh.forEach(l => {
      let s = l.sfx;
      if (s === 'turn' && v.turn !== v.you) s = null;
      if (s === 'victory' && v.winner !== v.you) s = 'defeat';
      if (s && !names.includes(s)) names.push(s);
    });
    names.slice(0, 3).forEach((s, k) => setTimeout(() => R.sfx.play(s), k * 220));
  }

  function showReveal(v, r) {
    const raider = pname(v, r.raider), dfd = r.defender === v.you ? 'your' : `${v.players[r.defender].name}'s`;
    // The picked card flips over in the middle of the screen.
    const face = c => `<div class="flip"><div class="flip-inner">${cardBack('flip-back', '', 'agora')}<div class="flip-front">${c}</div></div></div>`;
    if (r.ok) flash(`${face(card(r.card, { act: 'none' }))}<div>${esc(raider)} seized ${esc(dfd)}</div><div class="cardname">${esc(C[r.card].name)}</div>`, 'ok');
    else if (r.saved) flash(`${face(card(r.card, { act: 'none' }))}<div>The Phoenix rises!</div><div class="cardname">${esc(C[r.card].name)} is saved</div>`, 'fail');
    else flash(`${face(shieldCard())}<div>A Shield!</div><div class="cardname">${esc(raider)}${r.raider === v.you ? 'r' : "'s"} raid fails</div>`, 'fail');
  }

  // ---------- dialogs ----------
  function modal(inner, cls) {
    return `<div class="modal-back"><div class="modal ${cls || ''}">${inner}</div></div>`;
  }

  function actText(v, a) {
    const d = C[a.key], t = a.target;
    let s = `${pname(v, a.player)} ${a.player === v.you ? 'play' : 'plays'} ${d.name}`;
    if (d.raid) s += ` on ${t.player === v.you ? 'your' : v.players[t.player].name + "'s"} ${R.CAT_NAME[t.cat]}`;
    else if (a.targetCard) s += ` on ${a.targetOwner === v.you ? 'your' : v.players[a.targetOwner].name + "'s"} ${C[a.targetCard].name}`;
    else if (t.player != null) s += ` on ${t.player === v.you ? 'you' : v.players[t.player].name}`;
    return s + '.';
  }

  function reactBar(v) {
    const pd = v.pending, me = v.players[v.you];
    const mine = me.hand.find(c => c.key === pd.react);
    const ask = pd.react === 'shieldWall' ? 'Form a Shield Wall for +3 Shields?'
      : pd.count % 2 ? 'It has been cancelled by an Aegis. Raise yours to restore it?' : 'Raise the Aegis to cancel it?';
    return `<div class="react-bar"><div class="react-text"><b>${esc(actText(v, pd.act))}</b><span>${ask}</span></div>
      <div class="react-btns">${btn(pd.react === 'aegis' ? '🛡️ Raise Aegis' : '🧱 Shield Wall', `data-act="react" data-arg="${mine ? mine.id : ''}"`, 'primary')}
      ${btn('Pass', 'data-act="react" data-arg=""', 'ghost')}<span class="timer" data-deadline="1"></span></div></div>`;
  }

  // The defender's cards fanned face down. The raider clicks one within 15 seconds; everyone else watches.
  function raidModal(v) {
    const pd = v.pending, r = pd.raid, mine = pd.player === v.you, phoenix = pd.type === 'phoenix';
    const whose = r.defender === v.you ? 'your' : esc(v.players[r.defender].name) + "'s";
    const head = phoenix
      ? `<h2>Phoenix Ember</h2><p>${mine ? `Your ${esc(C[r.saving].name)} is shuffled with 1 Shield. Find your card to keep it!` : `${esc(v.players[pd.player].name)} tries to save the ${esc(C[r.saving].name)}…`}</p>`
      : `<h2>${esc(C[r.key].name)}</h2><p>${r.raider === v.you ? 'You raid' : esc(v.players[r.raider].name) + ' raids'} ${whose} ${R.icon(r.cat, 'inline')} ${R.CAT_NAME[r.cat]}</p>`;
    const n = r.size, spread = Math.min(46, n * 7);
    const fan = Array.from({ length: n }, (_, k) => {
      const t = n > 1 ? k / (n - 1) - 0.5 : 0;
      const style = `style="--rot:${(t * spread).toFixed(1)}deg;--lift:${(Math.abs(t) * 26).toFixed(0)}px;--i:${k}"`;
      return cardBack('raid-card' + (mine ? ' pickable' : ''), `${style} ${mine ? `data-act="choose" data-arg="${k}"` : ''}`, 'agora');
    }).join('');
    const odds = phoenix ? '' : `<span class="odds">${r.cards} card${r.cards > 1 ? 's' : ''} · ${r.shields} Shield${r.shields > 1 ? 's' : ''} · ${Math.round((r.cards / r.size) * 100)}% to steal</span>`;
    const hint = mine ? (phoenix ? 'Pick a card.' : 'Pick a card! A Shield means the raid fails.') : `${esc(v.players[pd.player].name)} is picking…`;
    return modal(`<div class="raid-head"><div class="raid-ico">${R.icon(phoenix ? 'phoenixEmber' : r.key)}</div><div class="raid-title">${head}</div>
        <div class="pick-ring" data-pick-ring="1"><span data-deadline="1"></span></div></div>
      <div class="raid-fan ${mine ? '' : 'watching'}">${fan}</div>
      <p class="raid-hint"><b>${hint}</b>${odds}${mine ? '<small>If you don\'t pick in time, one is picked at random.</small>' : ''}</p>`, 'wide raid');
  }

  function choiceModal(v) {
    const pd = v.pending;
    const blind = pd.options.every(o => !o.card && !o.label);
    const opts = pd.options.map(o => {
      const raw = JSON.stringify(o.v), arg = esc(raw);
      if (o.card) return card(o.card, { act: 'choose', arg: raw, cls: 'pick' });
      if (o.label) return btn(esc(o.label), `data-act="choose" data-arg="${arg}"`, 'ghost');
      return cardBack('pick', `data-act="choose" data-arg="${arg}"`, 'agora');
    }).join('');
    return modal(`<h2>${blind ? 'Choose Blindly' : 'Your Choice'}</h2><p class="prompt">${esc(pd.prompt)}</p><div class="choice-row ${blind ? 'blind' : ''}">${opts}</div>`, 'wide');
  }

  function shieldsFor(v, key, i, cat) {
    const me = v.players[v.you], p = v.players[i];
    const n = p.table.filter(c => C[c.key].cat === cat).length;
    let s = n;
    if (p.hero && R.HEROES[p.hero].guard === cat) s += 2;
    if (p.blessing === 'strategos') s += 1;
    if (me.blessing === 'strategos') s -= 1;
    if (key === 'trojanHorse') s -= 2;
    s = Math.max(1, s);
    return { n, s, pct: Math.round((n / (n + s)) * 100) };
  }

  function targetOptions(v, key) {
    const d = C[key], me = v.you, opps = v.players.map((_, i) => i).filter(i => i !== me);
    const nm = i => esc(v.players[i].name);
    if (d.raid) return opps.flatMap(i => R.CATS.map(cat => {
      const e = shieldsFor(v, key, i, cat);
      if (!e.n) return null;
      return { label: `<b>${nm(i)}</b> · ${R.icon(cat, 'inline')} ${R.CAT_NAME[cat]} <small>${e.n} card${e.n > 1 ? 's' : ''} vs ${e.s} Shield${e.s > 1 ? 's' : ''} · ${e.pct}% to steal</small>`, target: { player: i, cat } };
    }).filter(Boolean));
    if (key === 'aphrodite') return opps.flatMap(i => v.players[i].table.filter(c => C[c.key].pts === 1)
      .map(c => ({ label: `<b>${nm(i)}</b> · ${R.icon(C[c.key].cat, 'inline')} ${esc(C[c.key].name)}`, target: { card: c.id } })));
    if (key === 'zeus') return v.players.flatMap((p, i) => p.table.filter(c => C[c.key].pts <= 2)
      .map(c => ({ label: `<b>${i === me ? 'Your own' : nm(i)}</b> · ${R.icon(C[c.key].cat, 'inline')} ${esc(C[c.key].name)} <small>${C[c.key].pts} pt</small>`, target: { card: c.id } })));
    if (key === 'hermes') return opps.filter(i => v.players[i].handCount > 0)
      .map(i => ({ label: `<b>${nm(i)}</b> <small>${v.players[i].handCount} cards in hand</small>`, target: { player: i } }));
    if (key === 'hera') return opps.filter(i => v.players[i].blessing)
      .map(i => ({ label: `<b>${nm(i)}</b> · ${R.icon(v.players[i].blessing, 'inline')} ${esc(C[v.players[i].blessing].name)}`, target: { player: i } }));
    return [{ label: 'Play this card', target: {} }];
  }

  function targetModal(v) {
    const c = v.players[v.you].hand.find(x => x.id === ui.modal.id);
    const d = C[c.key], opts = targetOptions(v, c.key);
    ui.targets = opts;
    const list = opts.length
      ? `<div class="target-list">${opts.map((o, k) => `<button class="target" data-act="playTarget" data-arg="${k}">${o.label}</button>`).join('')}</div>`
      : '<p class="warn">There is no valid target for this card right now.</p>';
    return modal(`<div class="modal-split"><div>${card(c.key, { cls: 'big', act: 'none' })}</div>
      <div class="modal-body"><h2>${esc(d.name)}</h2><p>${esc(d.text)}</p>${list}
      <div class="stack row">${btn('Cancel', 'data-act="close"', 'ghost')}</div></div></div>`);
  }

  function buyModal(v) {
    const c = v.market.find(x => x && x.id === ui.modal.id), d = C[c.key], me = v.players[v.you];
    const reqOk = R.reqMet(me.points, d);
    const disc = R.discountFor({ hero: me.hero, blessing: me.blessing }, d);
    const plan = R.payPlan(me.hand, d, disc);
    let body;
    if (!reqOk) body = `<p class="warn">You need at least ${d.pts - 1} ${R.CAT_NAME[d.cat]} point${d.pts > 2 ? 's' : ''} before you can buy this.</p>`;
    else if (!plan) body = `<p class="warn">You don't have the resources. It costs ${esc(R.costText(d))}${disc ? ` (${disc} cheaper for you)` : ''}.</p>`;
    else {
      const pay = plan.map(id => { const k = me.hand.find(h => h.id === id).key; return `${R.icon(k, 'inline')} ${esc(C[k].name)}`; });
      body = `<p>You will pay:</p><div class="pay">${pay.map(p => `<span class="pay-card">${p}</span>`).join('') || '<span class="pay-card">Nothing!</span>'}</div>
        ${d.type === 'blessing' && me.blessing ? `<p class="hint">You already hold ${esc(C[me.blessing].name)}; you'll choose which one to keep.</p>` : ''}`;
    }
    return modal(`<div class="modal-split"><div>${card(c.key, { cls: 'big', act: 'none' })}</div>
      <div class="modal-body"><h2>${esc(d.name)}</h2><p>${esc(d.text || '')}</p>${body}
      <div class="stack row">${reqOk && plan ? btn('Buy', `data-act="buy" data-arg="${c.id}"`, 'primary') : ''}${btn('Cancel', 'data-act="close"', 'ghost')}</div></div></div>`);
  }

  function tradeModal(v) {
    const me = v.players[v.you], m = ui.modal;
    const hand = me.hand.slice().sort((a, b) => order(a.key) - order(b.key));
    const ready = m.sel.length === 2 && m.res;
    const hidden = m.sel.some(id => C[me.hand.find(c => c.id === id).key].type === 'hidden');
    return modal(`<h2>🔁 Trade 2 Cards for 1 Resource</h2>
      <p class="prompt">Pick 2 cards to discard, then the resource card you want in your hand.</p>
      <div class="choice-row trade-hand">${hand.map(c => card(c.key, { act: 'tradePick', arg: c.id, cls: 'pick' + (m.sel.includes(c.id) ? ' selected' : '') })).join('')}</div>
      <div class="opt-row res-row"><span>Resource</span>${R.RES.map(r => `<button class="pill ${m.res === r ? 'on' : ''}" data-act="tradeRes" data-arg="${r}">${resToken(r)} ${R.RES_NAME[r]}</button>`).join('')}</div>
      ${hidden ? '<p class="warn">Careful: you are discarding a hidden point card.</p>' : ''}
      <div class="stack row">${btn(`Trade (${m.sel.length}/2)`, `data-act="tradeDo" ${ready ? '' : 'disabled'}`, 'primary')}${btn('Cancel', 'data-act="close"', 'ghost')}</div>`, 'wide');
  }

  function zoomModal() {
    const d = C[ui.modal.key];
    const extra = d.type === 'point' ? `<p><b>Cost:</b> ${esc(R.costText(d))}</p>` : d.anyCost ? '<p><b>Cost:</b> any 3 resources</p>' : '';
    return modal(`<div class="modal-split"><div>${card(d.key, { cls: 'big', act: 'none' })}</div>
      <div class="modal-body"><h2>${esc(d.name)}</h2><p class="hint">${typeLabel(d)}</p><p>${esc(d.text || cardText(d))}</p>${extra}
      <div class="stack row">${btn('Close', 'data-act="close"', 'ghost')}</div></div></div>`);
  }

  function winModal(v) {
    const w = v.players[v.winner];
    const rows = v.players.map((p, i) => `<tr class="${i === v.winner ? 'win' : ''}"><td>${esc(p.name)}</td>${R.CATS.map(c => `<td>${p.points[c]}</td>`).join('')}</tr>`).join('');
    return modal(`<div class="victory">${R.laurel(-1, { w: 80, h: 120 })}<div><div class="big">🏆</div>
      <h2>${v.winner === v.you ? 'Victory is yours!' : esc(w.name) + ' wins!'}</h2><p>The gods have chosen their champion.</p></div>${R.laurel(1, { w: 80, h: 120 })}</div>
      <table class="final"><tr><th></th>${R.CATS.map(c => `<th>${R.icon(c, 'inline')}</th>`).join('')}</tr>${rows}</table>
      <div class="stack">${btn('Return to Menu', 'data-act="leave"', 'big')}</div>`, 'win');
  }

  function renderOverlay() {
    const v = ui.view;
    let html = '';
    if (ui.screen === 'game' && v) {
      const pd = v.pending;
      if (v.winner != null) html = winModal(v);
      else if (pd && pd.raid) html = raidModal(v);
      else if (pd && pd.kind === 'choice' && pd.player === v.you) html = choiceModal(v);
      else {
        if (ui.modal) html = localModal(v);
        if (pd && pd.kind === 'window' && pd.waiting.includes(v.you)) html += reactBar(v);
      }
    } else if (ui.modal) html = localModal(v);
    // Only touch the DOM when something changed, so open dialogs don't replay their entrance animation.
    if (html !== ui.overlayHTML) { overlay.innerHTML = html; ui.overlayHTML = html; }
    tick();
  }

  function clearOverlay() { overlay.innerHTML = ''; ui.overlayHTML = ''; }

  function localModal(v) {
    switch (ui.modal.type) {
      case 'target': return targetModal(v);
      case 'buy': return buyModal(v);
      case 'trade': return tradeModal(v);
      case 'zoom': return zoomModal();
      case 'rules': return modal(`<h2>How to Play</h2>${rulesHTML()}<div class="stack row">${btn('Close', 'data-act="close"', 'ghost')}</div>`, 'wide scrolly');
    }
    return '';
  }

  function tick() {
    document.querySelectorAll('[data-deadline]').forEach(el => {
      const s = Math.max(0, Math.ceil((ui.deadlineAt - Date.now()) / 1000));
      el.textContent = s + 's';
    });
    document.querySelectorAll('[data-pick-ring]').forEach(el => {
      const left = Math.max(0, ui.deadlineAt - Date.now());
      el.style.setProperty('--p', Math.min(100, (left / 15000) * 100) + '%');
      el.classList.toggle('low', left <= 5000);
    });
    const v = ui.view;
    if (!v || ui.screen !== 'game') return;
    const left = v.clockPaused ? v.phaseRemaining : ui.turnDeadlineAt - Date.now();
    const s = Math.max(0, Math.ceil(left / 1000));
    const total = v.phase === 'draw' ? 10000 : 60000;
    document.querySelectorAll('[data-turn-clock]').forEach(el => {
      el.textContent = (v.clockPaused ? '⏸ ' : '') + (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : s + 's');
      el.classList.toggle('low', s <= 10);
    });
    document.querySelectorAll('[data-turn-ring]').forEach(el => {
      el.style.setProperty('--p', Math.max(0, Math.min(100, (left / total) * 100)) + '%');
      el.classList.toggle('low', s <= 10);
    });
    // Tick through the last five seconds of your own turn.
    if (v.turn === v.you && v.winner == null && !v.clockPaused && s <= 5 && s > 0 && s !== ui.lastTick) R.sfx.play('tick');
    ui.lastTick = s;
  }
  setInterval(tick, 250);

  // ---------- input ----------
  function send(cmd) { if (ui.net) ui.net.command(cmd); }
  function openModal(m) { ui.modal = m; renderOverlay(); }

  const ACTS = {
    host() {
      reset();
      ui.net = new R.Host(readName(), callbacks());
      ui.net.goOnline();
    },
    solo() {
      reset();
      ui.net = new R.Host(readName(), callbacks());
      ui.net.addBot(); ui.net.addBot();
    },
    join() {
      const code = (document.getElementById('code').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (code.length !== 5) { toast('Room codes have 5 letters.', 'error'); return; }
      const name = readName();
      reset();
      connecting(`Seeking the hall of ${code}…`);
      ui.net = new R.Client(code, name, callbacks());
    },
    addBot() { ui.net.addBot(); },
    kick(i) { ui.net.removeSeat(+i); },
    target(t) { ui.net.setOpts({ target: +t }); },
    heroes(on) { ui.net.setOpts({ heroes: on === '1' }); },
    start() { ui.net.start(); },
    copyInvite() {
      const l = ui.lobby;
      const link = location.protocol.startsWith('http') ? `${location.origin}${location.pathname}?join=${l.code}` : null;
      const text = link || l.code;
      const done = () => toast(link ? 'Invite link copied!' : `Room code ${l.code} copied. Friends enter it under Play → Join.`);
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => toast('Room code: ' + l.code));
      else toast('Room code: ' + l.code);
    },
    leave() {
      if (ui.view && ui.view.winner == null && ui.screen === 'game' && !confirm('Leave this game?')) return;
      reset(); menu();
    },
    motion(on) { store.set('motion', on === '1'); applyMotion(); settings(); },
    sound(on) { R.sfx.set({ on: on === '1' }); settings(); },
    galleryFilter(f) { ui.galleryFilter = f; gallery(); },
    toggleLog() { ui.logOpen = !ui.logOpen; store.set('logOpen', ui.logOpen); if (ui.view) renderGame(); },
    soundToggle() { R.sfx.set({ on: !R.sfx.on }); if (ui.view) renderGame(); },
    saveSettings() { readName(); toast('Settings saved.'); menu(); },
    rulesModal() { openModal({ type: 'rules' }); },
    close() { ui.modal = null; renderOverlay(); },
    end(_, el) { el.disabled = true; send({ type: 'end' }); },
    draw(_, el) { el.disabled = true; send({ type: 'draw' }); },
    handCard(id) {
      const v = ui.view, c = v.players[v.you].hand.find(x => x.id === +id);
      if (!c) return;
      if (C[c.key].type === 'action' && isFree(v) && v.actionsLeft > 0) openModal({ type: 'target', id: c.id });
      else openModal({ type: 'zoom', key: c.key });
    },
    marketCard(id) {
      const v = ui.view, c = v.market.find(x => x && x.id === +id);
      if (!c) return;
      if (isFree(v) && v.buysLeft > 0) openModal({ type: 'buy', id: c.id });
      else openModal({ type: 'zoom', key: c.key });
    },
    zoom(key) { if (C[key]) openModal({ type: 'zoom', key }); },
    playTarget(k) {
      const o = ui.targets[+k];
      const id = ui.modal.id;
      ui.modal = null;
      send({ type: 'play', card: id, target: o.target });
      renderOverlay();
    },
    buy(id) { ui.modal = null; send({ type: 'buy', card: +id }); renderOverlay(); },
    tradeOpen() { if (isFree(ui.view)) openModal({ type: 'trade', sel: [], res: null }); },
    tradePick(id) {
      const sel = ui.modal.sel, n = +id, k = sel.indexOf(n);
      if (k >= 0) sel.splice(k, 1); else if (sel.length < 2) sel.push(n); else sel.splice(0, 1, n);
      renderOverlay();
    },
    tradeRes(r) { ui.modal.res = r; renderOverlay(); },
    tradeDo() {
      const m = ui.modal;
      ui.modal = null;
      send({ type: 'trade', cards: m.sel, res: m.res });
      renderOverlay();
    },
    // Hide the dialog straight away so a double click can't answer twice; the next view restores it if needed.
    choose(arg) { clearOverlay(); send({ type: 'choose', v: JSON.parse(arg) }); },
    react(id) { clearOverlay(); send({ type: 'react', card: id ? +id : null }); },
    none() {},
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-go],[data-act]');
    if (!el || el.disabled) return;
    if (el.matches('button')) R.sfx.play('click');
    if (el.dataset.go) { ui.modal = null; go(el.dataset.go); return; }
    const fn = ACTS[el.dataset.act];
    if (fn) fn(el.dataset.arg, el);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.modal) ACTS.close(); });
  overlay.addEventListener('click', e => { if (e.target.classList.contains('modal-back') && ui.modal) ACTS.close(); });
  window.addEventListener('beforeunload', e => { if (ui.net && ui.view && ui.view.winner == null) { e.preventDefault(); e.returnValue = ''; } });

  function applyMotion() { document.body.classList.toggle('no-motion', !store.get('motion', true)); }
  applyMotion();

  const params = new URLSearchParams(location.search);
  const joinCode = params.get('join');
  if (joinCode) joinScreen(joinCode.toUpperCase().slice(0, 5));
  else if (params.has('demo')) { ACTS.solo(); ui.net.addBot(); ui.net.start(); R.demoHost = ui.net; } // developer shortcut: straight into a bot game
  else if (params.has('screen')) go(params.get('screen')); // developer shortcut, e.g. ?screen=cards
  else menu();
})(window.ROO);
