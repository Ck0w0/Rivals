// Card data for Rivals of Olympus, plus small helpers shared by host and clients.
window.ROO = window.ROO || {};
(function (R) {
  R.CATS = ['fleet', 'polis', 'treasure'];
  R.CAT_NAME = { fleet: 'Fleet', polis: 'Polis', treasure: 'Treasure' };
  R.CAT_ICON = { fleet: '⛵', polis: '🏛️', treasure: '💰' };
  R.RES = ['olives', 'bronze', 'marble', 'silver', 'hoplites'];
  R.RES_NAME = { olives: 'Olives', bronze: 'Bronze', marble: 'Marble', silver: 'Silver', hoplites: 'Hoplites' };
  R.RES_ICON = { olives: '🫒', bronze: '🥉', marble: '🪨', silver: '🪙', hoplites: '⚔️' };

  const C = {};
  function def(key, o) { C[key] = Object.assign({ key, deck: 'oracle' }, o); }

  // ---- Oracle deck (110) ----
  // Resources (56)
  def('olives', { name: 'Olives', type: 'resource', res: 'olives', n: 10, text: '1 Olives', glyph: '🫒' });
  def('bronze', { name: 'Bronze', type: 'resource', res: 'bronze', n: 10, text: '1 Bronze', glyph: '🥉' });
  def('marble', { name: 'Marble', type: 'resource', res: 'marble', n: 10, text: '1 Marble', glyph: '🪨' });
  def('silver', { name: 'Silver', type: 'resource', res: 'silver', n: 10, text: '1 Silver', glyph: '🪙' });
  def('hoplites', { name: 'Hoplites', type: 'resource', res: 'hoplites', n: 10, text: '1 Hoplites', glyph: '⚔️' });
  def('ambrosia', { name: 'Ambrosia', type: 'resource', wild: 1, n: 4, text: 'Counts as any 1 resource.', glyph: '✨' });
  def('nectar', { name: 'Nectar of the Gods', type: 'resource', wild: 2, n: 2, text: 'Counts as any 2 resources.', glyph: '🍯' });

  // Raid actions (17)
  def('siege', { name: 'Siege', type: 'action', raid: true, n: 6, text: 'Raid another player.', glyph: '🏹' });
  def('nightAmbush', { name: 'Night Ambush', type: 'action', raid: true, n: 3, text: 'Raid. If it succeeds, you may play another action.', glyph: '🌙' });
  def('spartanRaid', { name: 'Spartan Raid', type: 'action', raid: true, n: 3, text: 'Raid. If it fails, draw 1 card.', glyph: '🗡️' });
  def('pirateRaid', { name: 'Pirate Raid', type: 'action', raid: true, n: 3, text: 'Raid. If it fails, take the top card of the Agora supply.', glyph: '🏴‍☠️' });
  def('trojanHorse', { name: 'Trojan Horse', type: 'action', raid: true, n: 2, text: 'Raid. The defender adds 2 fewer Shields (minimum 1).', glyph: '🐴' });

  // God actions (22)
  def('aphrodite', { name: "Aphrodite's Charm", type: 'action', n: 3, text: 'Steal a face-up point card worth 1 from another player.', glyph: '💘' });
  def('hermes', { name: "Hermes' Trick", type: 'action', n: 3, text: "Take 2 random cards from another player's hand.", glyph: '🪶' });
  def('athena', { name: "Athena's Wisdom", type: 'action', n: 3, text: 'Draw 3 cards. Keep 2 and put 1 on top of the Oracle deck.', glyph: '🦉' });
  def('zeus', { name: "Zeus's Thunderbolt", type: 'action', n: 2, text: 'Destroy a face-up point card worth up to 2 from any player.', glyph: '⚡' });
  def('hera', { name: "Hera's Jealousy", type: 'action', n: 2, text: "Steal another player's Blessing. If you now have 2, keep one.", glyph: '🦚' });
  def('apollo', { name: "Apollo's Prophecy", type: 'action', n: 2, text: 'Look at the top 5 Agora supply cards and put them back in any order.', glyph: '☀️' });
  def('hades', { name: "Hades' Bargain", type: 'action', n: 2, text: 'Take any card from the Oracle discard pile into your hand.', glyph: '💀' });
  def('demeter', { name: "Demeter's Harvest", type: 'action', n: 2, text: 'Draw 2 cards. You may buy 2 Agora cards this turn.', glyph: '🌾' });
  def('hephaestus', { name: "Hephaestus' Forge", type: 'action', n: 2, text: 'Buy any Agora card for 2 fewer resources, ignoring point requirements. You may still make your normal buy.', glyph: '🔨' });
  def('dionysus', { name: "Dionysus' Feast", type: 'action', n: 1, noTwo: true, text: 'Every player passes their whole hand to the left. Then you draw 1 card.', glyph: '🍇' });

  // Reactions (7)
  def('aegis', { name: 'Aegis', type: 'reaction', n: 5, text: 'Cancel any action card. An Aegis can cancel another Aegis.', glyph: '🛡️' });
  def('shieldWall', { name: 'Shield Wall', type: 'reaction', n: 2, text: 'When you are raided, add 3 more Shields.', glyph: '🧱' });

  // Hidden point cards (6)
  def('sunkenTrireme', { name: 'Sunken Trireme', type: 'hidden', cat: 'fleet', pts: 1, n: 2, text: '1 Fleet point while in your hand.', glyph: '⚓' });
  def('hiddenShrine', { name: 'Hidden Shrine', type: 'hidden', cat: 'polis', pts: 1, n: 2, text: '1 Polis point while in your hand.', glyph: '🗝️' });
  def('buriedHoard', { name: 'Buried Hoard', type: 'hidden', cat: 'treasure', pts: 1, n: 2, text: '1 Treasure point while in your hand.', glyph: '💎' });

  // Events (2)
  def('loom', { name: 'Loom of the Fates', type: 'event', n: 2, text: 'When drawn, discard it and draw a replacement. At the end of the turn, the Oracle discard pile is shuffled back into the deck.', glyph: '🧵' });

  // ---- Agora deck (47) ----
  const pt = (key, name, cat, pts, cost, n, glyph) => def(key, { name, deck: 'agora', type: 'point', cat, pts, cost, n, glyph });
  pt('bireme', 'Bireme', 'fleet', 1, { bronze: 1, hoplites: 1 }, 3, '⛵');
  pt('trireme', 'Trireme', 'fleet', 1, { bronze: 1, olives: 1 }, 3, '🚣');
  pt('warGalley', 'War Galley', 'fleet', 2, { bronze: 1, hoplites: 1, silver: 1 }, 4, '🚢');
  pt('armada', 'Armada', 'fleet', 3, { bronze: 2, hoplites: 1, silver: 1 }, 3, '🛳️');
  pt('shrine', 'Shrine', 'polis', 1, { marble: 1, olives: 1 }, 3, '🕯️');
  pt('theatre', 'Theatre', 'polis', 1, { marble: 1, silver: 1 }, 3, '🎭');
  pt('temple', 'Temple', 'polis', 2, { marble: 2, hoplites: 1 }, 4, '🏛️');
  pt('acropolis', 'Acropolis', 'polis', 3, { marble: 2, silver: 1, olives: 1 }, 3, '🌄');
  pt('amphora', 'Amphora', 'treasure', 1, { olives: 1, silver: 1 }, 3, '🏺');
  pt('laurelWreath', 'Laurel Wreath', 'treasure', 1, { silver: 1, hoplites: 1 }, 3, '🌿');
  pt('goldenIdol', 'Golden Idol', 'treasure', 2, { silver: 2, marble: 1 }, 4, '🗿');
  pt('goldenFleece', 'Golden Fleece', 'treasure', 3, { silver: 2, hoplites: 1, bronze: 1 }, 3, '🐏');

  const bl = (key, name, text, glyph) => def(key, { name, deck: 'agora', type: 'blessing', anyCost: 3, n: 1, text, glyph });
  bl('olympianFavour', 'Olympian Favour', 'You win with 1 fewer point in each category.', '🌟');
  bl('strategos', 'Strategos', 'When you raid, the defender adds 1 fewer Shield (min 1). When you are raided, add 1 more Shield.', '🪖');
  bl('tradeRoutes', 'Trade Routes', 'Point cards cost you 1 fewer resource.', '🧭');
  bl('phoenixEmber', 'Phoenix Ember', 'If you lose a card in a raid, shuffle it with 1 Shield and pick one. Pick your card and you keep it.', '🔥');
  bl('oraclesSight', "Oracle's Sight", 'At the start of your turn, draw 3 cards instead of 2, then discard 1.', '👁️');

  const ch = (key, name, text, glyph, noTwo) => def(key, { name, deck: 'agora', type: 'chaos', n: 1, text, glyph, noTwo });
  ch('titanomachy', 'Titanomachy', 'Every player discards their whole hand and draws 4 new cards. Blessings pass to the player on the right.', '🌋');
  ch('poseidon', "Poseidon's Wrath", 'Every player discards their lowest-value Fleet card.', '🌊');
  ch('pandora', "Pandora's Box", 'Every player gives 1 random card from their hand to the player on their right, then everyone draws 1.', '📦', true);

  R.CARDS = C;

  R.HEROES = {
    odysseus: { name: 'Odysseus', discount: 'fleet', text: 'Fleet cards cost you 1 fewer resource.', glyph: '🧭' },
    hippolyta: { name: 'Hippolyta', discount: 'polis', text: 'Polis cards cost you 1 fewer resource.', glyph: '🏹' },
    atalanta: { name: 'Atalanta', discount: 'treasure', text: 'Treasure cards cost you 1 fewer resource.', glyph: '🏃' },
    achilles: { name: 'Achilles', guard: 'fleet', text: 'When your Fleet is raided, add 2 more Shields.', glyph: '🛡️' },
    heracles: { name: 'Heracles', guard: 'polis', text: 'When your Polis is raided, add 2 more Shields.', glyph: '🦁' },
    perseus: { name: 'Perseus', guard: 'treasure', text: 'When your Treasure is raided, add 2 more Shields.', glyph: '🐍' },
  };

  // Points from face-up cards plus (optionally) hidden point cards in hand. Both are arrays of card keys.
  R.points = function (tableKeys, handKeys) {
    const p = { fleet: 0, polis: 0, treasure: 0 };
    tableKeys.concat(handKeys || []).forEach(k => { const d = C[k]; if (d.cat) p[d.cat] += d.pts; });
    return p;
  };

  R.reqMet = function (points, d) {
    return d.type !== 'point' || d.pts < 2 || points[d.cat] >= d.pts - 1;
  };

  // who: { hero, blessing } where blessing is a card key.
  R.discountFor = function (who, d) {
    if (d.type !== 'point') return 0;
    let n = 0;
    if (who.blessing === 'tradeRoutes') n++;
    if (who.hero && R.HEROES[who.hero].discount === d.cat) n++;
    return n;
  };

  // Works out which hand cards pay for d. hand: [{id, key}]. Returns the card ids to discard, or null.
  R.payPlan = function (hand, d, discount) {
    const byRes = {}; R.RES.forEach(r => (byRes[r] = []));
    const amb = [], nec = [];
    hand.forEach(c => {
      const cd = C[c.key];
      if (cd.type !== 'resource') return;
      if (cd.wild === 1) amb.push(c.id); else if (cd.wild === 2) nec.push(c.id); else byRes[cd.res].push(c.id);
    });
    const ids = [];
    let short = 0;
    if (d.anyCost) {
      let need = Math.max(0, d.anyCost - discount);
      const order = R.RES.slice().sort((a, b) => byRes[b].length - byRes[a].length);
      for (const r of order) while (need > 0 && byRes[r].length) { ids.push(byRes[r].pop()); need--; }
      short = need;
    } else if (d.cost) {
      const need = Object.assign({}, d.cost);
      // Spend the discount on whatever we're shortest of.
      for (let i = 0; i < discount; i++) {
        let best = null;
        for (const r in need) if (need[r] > 0 && (best === null || need[r] - byRes[r].length > need[best] - byRes[best].length)) best = r;
        if (!best) break;
        need[best]--;
      }
      for (const r in need) {
        let k = need[r];
        while (k > 0 && byRes[r].length) { ids.push(byRes[r].pop()); k--; }
        short += k;
      }
    } else return null;
    while (short > 0 && amb.length) { ids.push(amb.pop()); short--; }
    while (short > 0 && nec.length) { ids.push(nec.pop()); short -= 2; }
    return short > 0 ? null : ids;
  };

  // Traded resources (2 cards → 1 resource) as pseudo-cards that R.payPlan understands.
  // They go last so payPlan spends them before real cards, since they expire at the end of the turn.
  R.tokenCards = function (tokens) {
    const out = [];
    R.RES.forEach(r => {
      const n = (tokens && tokens[r]) || 0;
      for (let k = 0; k < n; k++) out.push({ id: `tok:${r}:${k}`, key: r, token: true });
    });
    return out;
  };
  R.isToken = id => typeof id === 'string' && id.startsWith('tok:');

  R.costText = function (d) {
    if (d.anyCost) return `Any ${d.anyCost} resources`;
    if (!d.cost) return '';
    return Object.keys(d.cost).map(r => (d.cost[r] > 1 ? d.cost[r] + ' ' : '') + R.RES_NAME[r]).join(' + ');
  };
})(window.ROO);
