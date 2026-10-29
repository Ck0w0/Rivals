// Simple computer opponents. They run on the host and also stand in for disconnected players.
(function (R) {
  const C = R.CARDS;
  const BLESSING_RANK = { olympianFavour: 5, tradeRoutes: 4, oraclesSight: 3, strategos: 2, phoenixEmber: 1 };

  function cardValue(key) {
    const d = C[key];
    if (d.type === 'hidden') return 10;
    if (key === 'aegis') return 6;
    if (key === 'nectar') return 5;
    if (key === 'ambrosia') return 4;
    if (d.raid || key === 'demeter' || key === 'shieldWall') return 3;
    if (d.type === 'resource') return 2;
    return 1;
  }

  function buyScore(g, i, id) {
    const d = g.def(id), pts = g.points(i), need = g.needed(i);
    if (d.type === 'blessing') return g.players[i].blessing ? -1 : 4 + (BLESSING_RANK[d.key] || 0) * 0.5;
    const gap = Math.max(0, need - pts[d.cat]);
    return d.pts * 2 + gap + (gap === 0 ? -6 : 0);
  }

  function bestBuy(g, i, ids, extraDiscount, ignoreReq) {
    let best = null;
    ids.forEach(id => {
      if (id == null) return;
      const d = g.def(id);
      if (!ignoreReq && !R.reqMet(g.points(i), d)) return;
      if (!R.payPlan(g.payHand(i), d, R.discountFor(g.who(i), d) + extraDiscount)) return;
      const s = buyScore(g, i, id) + Math.random() * 0.3;
      if (s > 0 && (!best || s > best.s)) best = { id, s };
    });
    return best && best.id;
  }

  // If trading away 2 cheap cards would let us buy something worthwhile, do it.
  function pickTrade(g, i) {
    const hand = g.handCards(i);
    const junk = hand.filter(c => cardValue(c.key) <= 3 && C[c.key].type !== 'hidden').sort((a, b) => cardValue(a.key) - cardValue(b.key));
    if (junk.length < 2) return null;
    let best = null;
    for (let a = 0; a < junk.length; a++) for (let b = a + 1; b < junk.length; b++) {
      const rest = hand.filter(c => c !== junk[a] && c !== junk[b]);
      R.RES.forEach(res => {
        const tokens = Object.assign({}, g.players[i].tokens);
        tokens[res] = (tokens[res] || 0) + 1;
        const pay = rest.concat(R.tokenCards(tokens));
        g.market.forEach(id => {
          if (id == null) return;
          const d = g.def(id);
          if (!R.reqMet(g.points(i), d) || !R.payPlan(pay, d, R.discountFor(g.who(i), d))) return;
          const s = buyScore(g, i, id) - (cardValue(junk[a].key) + cardValue(junk[b].key)) * 0.5;
          if (s > 1 && (!best || s > best.s)) best = { s, cmd: { type: 'trade', cards: [junk[a].id, junk[b].id], res } };
        });
      });
      if (best) return best.cmd;
    }
    return null;
  }

  function pickAction(g, i) {
    const p = g.players[i], hand = g.handCards(i);
    const find = k => hand.find(c => c.key === k);
    const opps = g.players.map((_, j) => j).filter(j => j !== i);
    const myPts = g.points(i), need = g.needed(i);
    const play = (c, target) => ({ type: 'play', card: c.id, target: target || {} });

    for (const k of ['demeter', 'athena']) { const c = find(k); if (c) return play(c); }

    const forge = find('hephaestus');
    if (forge && bestBuy(g, i, g.market, 2, true)) return play(forge);

    const raid = hand.find(c => C[c.key].raid);
    if (raid) {
      let best = null;
      opps.forEach(o => R.CATS.forEach(cat => {
        const cards = g.catCards(o, cat);
        if (!cards.length) return;
        const avg = cards.reduce((s, id) => s + g.def(id).pts, 0) / cards.length;
        const s = avg + (myPts[cat] < need ? 1 : 0) + Math.random() * 0.5;
        if (!best || s > best.s) best = { s, t: { player: o, cat } };
      }));
      if (best) return play(raid, best.t);
    }

    const charm = find('aphrodite');
    if (charm) {
      const t = opps.flatMap(o => g.players[o].table).filter(id => g.def(id).pts === 1)
        .sort((a, b) => (myPts[g.def(a).cat] < need ? 0 : 1) - (myPts[g.def(b).cat] < need ? 0 : 1))[0];
      if (t) return play(charm, { card: t });
    }
    const zeus = find('zeus');
    if (zeus) {
      const t = opps.flatMap(o => g.players[o].table).filter(id => g.def(id).pts <= 2).sort((a, b) => g.def(b).pts - g.def(a).pts)[0];
      if (t) return play(zeus, { card: t });
    }
    const hera = find('hera');
    if (hera && !p.blessing) {
      const o = opps.find(j => g.players[j].blessing);
      if (o != null) return play(hera, { player: o });
    }
    const hermes = find('hermes');
    if (hermes) {
      const o = opps.slice().sort((a, b) => g.players[b].hand.length - g.players[a].hand.length)[0];
      if (o != null && g.players[o].hand.length >= 2) return play(hermes, { player: o });
    }
    const hades = find('hades');
    if (hades && g.oracleDiscard.length) return play(hades);
    return null;
  }

  function choose(g, i, pd) {
    const opts = pd.options, t = pd.ctx.type;
    const rand = () => opts[Math.floor(Math.random() * opts.length)].v;
    const byValue = dir => opts.slice().sort((a, b) => dir * (cardValue(a.card) - cardValue(b.card)))[0].v;
    switch (t) {
      case 'raidPick': case 'phoenix': return rand();
      case 'sight': case 'athena': return byValue(1);
      case 'hades': return byValue(-1);
      case 'keepBlessing': return opts.slice().sort((a, b) => (BLESSING_RANK[b.card] || 0) - (BLESSING_RANK[a.card] || 0))[0].v;
      case 'forge': return bestBuy(g, i, opts.filter(o => o.v !== 'skip').map(o => o.v), 2, true) || 'skip';
      default: return opts[0].v;
    }
  }

  // Returns the next command for player i, or null if they have nothing to do.
  R.botAct = function (g, i) {
    const pd = g.pending;
    if (pd && pd.kind === 'window') {
      if (!pd.waiting.includes(i)) return null;
      if (pd.react === 'shieldWall') return { type: 'react', card: g.findInHand(i, 'shieldWall') };
      const a = pd.act, standing = pd.count % 2 === 0;
      const hurtsMe = a.target.player === i || (a.target.card && g.ownerOf(a.target.card) === i);
      if ((standing && hurtsMe) || (!standing && a.player === i)) return { type: 'react', card: g.findInHand(i, 'aegis') };
      return { type: 'react', card: null };
    }
    if (pd) return pd.player === i ? { type: 'choose', v: choose(g, i, pd) } : null;
    if (g.turn !== i) return null;
    if (g.actionsLeft > 0) { const a = pickAction(g, i); if (a) return a; }
    if (g.buysLeft > 0) {
      const b = bestBuy(g, i, g.market, 0, false);
      if (b) return { type: 'buy', card: b };
      const t = pickTrade(g, i);
      if (t) return t;
    }
    return { type: 'end' };
  };

  // Something always-legal to do if a bot's first idea was rejected.
  R.botFallback = function (g, i) {
    const pd = g.pending;
    if (pd && pd.kind === 'window') return { type: 'react', card: null };
    if (pd) return { type: 'choose', v: pd.options[0].v };
    return { type: 'end' };
  };
})(window.ROO);
