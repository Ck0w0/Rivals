// Authoritative game rules. Only the host runs this; clients receive redacted views.
(function (R) {
  const C = R.CARDS;
  const WINDOW_MS = 15000;
  const DRAW_MS = 10000;
  const MAIN_MS = 60000;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  class Game {
    // seats: [{ name, bot }], opts: { target, heroes }
    constructor(seats, opts) {
      const two = seats.length === 2;
      this.opts = { target: opts.target || (two ? 5 : 6), heroes: !!opts.heroes };
      this.cards = {};
      let nextId = 1;
      const oracle = [], agora = [];
      for (const key in C) {
        const d = C[key];
        if (two && d.noTwo) continue;
        for (let i = 0; i < d.n; i++) { const id = nextId++; this.cards[id] = key; (d.deck === 'agora' ? agora : oracle).push(id); }
      }
      this.oracle = shuffle(oracle); this.oracleDiscard = [];
      this.agora = shuffle(agora); this.agoraDiscard = [];
      const heroKeys = shuffle(Object.keys(R.HEROES));
      this.players = seats.map((s, i) => ({
        name: s.name, bot: !!s.bot, connected: true, hand: [], table: [], blessing: null,
        hero: this.opts.heroes ? heroKeys[i % heroKeys.length] : null,
      }));
      this.log = []; this.logSeq = 0; this.revealSeq = 0; this.seq = 0;
      this.pending = null; this.winner = null; this.reveal = null; this.loomShuffle = false;

      // Lay out the Agora; chaos cards that come up during setup are shuffled back.
      this.market = [];
      for (let i = 0; i < (two ? 6 : 8); i++) {
        let id, guard = 0;
        for (;;) {
          id = this.agora.shift();
          if (this.def(id).type !== 'chaos' || guard++ > 50) break;
          this.agora.push(id); shuffle(this.agora);
        }
        this.market.push(id);
      }
      this.players.forEach((p, i) => this.draw(i, 6));
      this.turn = Math.floor(Math.random() * this.players.length);
      this.turnNo = 1;
      this.say(`The gods are watching. First to ${this.opts.target} points in Fleet, Polis and Treasure wins.`);
      this.startTurn();
    }

    // ---------- helpers ----------
    key(id) { return this.cards[id]; }
    def(id) { return C[this.cards[id]]; }
    name(i) { return this.players[i].name; }
    say(text) { this.log.push({ n: ++this.logSeq, text }); if (this.log.length > 100) this.log.shift(); }
    has(i, key) { return this.players[i].hand.some(id => this.cards[id] === key); }
    findInHand(i, key) { return this.players[i].hand.find(id => this.cards[id] === key); }
    blessingKey(i) { const b = this.players[i].blessing; return b ? this.cards[b] : null; }
    handCards(i) { return this.players[i].hand.map(id => ({ id, key: this.cards[id] })); }    who(i) { return { hero: this.players[i].hero, blessing: this.blessingKey(i) }; }
    ownerOf(id) { return this.players.findIndex(p => p.table.includes(id)); }
    removeFrom(arr, id) { const k = arr.indexOf(id); if (k >= 0) arr.splice(k, 1); return k >= 0; }
    catCards(i, cat) { return this.players[i].table.filter(id => this.def(id).cat === cat); }
    points(i) {
      const p = this.players[i];
      return R.points(p.table.map(id => this.cards[id]), p.hand.map(id => this.cards[id]));
    }
    publicPoints(i) { return R.points(this.players[i].table.map(id => this.cards[id])); }
    needed(i) { return this.opts.target - (this.blessingKey(i) === 'olympianFavour' ? 1 : 0); }
    wins(i) { const pts = this.points(i), need = this.needed(i); return R.CATS.every(c => pts[c] >= need); }

    drawOne() {
      if (!this.oracle.length) {
        if (!this.oracleDiscard.length) return null;
        this.oracle = shuffle(this.oracleDiscard); this.oracleDiscard = [];
        this.say('The Oracle deck is reshuffled.');
      }
      return this.oracle.shift();
    }

    // Draws n cards for player i, handling the Loom of the Fates. Returns the ids drawn.
    draw(i, n) {
      const p = this.players[i], got = [];
      for (let k = 0; k < n; k++) {
        let id = this.drawOne(), guard = 0;
        while (id != null && this.cards[id] === 'loom' && guard++ < 10) {
          this.oracleDiscard.push(id); this.loomShuffle = true;
          this.say(`🧵 ${p.name} drew the Loom of the Fates. The discards return to the deck at the end of this turn.`);
          id = this.drawOne();
        }
        if (id == null) break;
        p.hand.push(id); got.push(id);
      }
      return got;
    }

    drawAgora() {
      if (!this.agora.length) {
        if (!this.agoraDiscard.length) return null;
        this.agora = shuffle(this.agoraDiscard); this.agoraDiscard = [];
        this.say('The Agora supply is reshuffled.');
      }
      return this.agora.shift();
    }

    choice(player, prompt, options, ctx) {
      if (!options.length) return;
      this.pending = { kind: 'choice', player, prompt, options, ctx };
    }

    // ---------- turn flow ----------
    // A turn has two timed phases: 'draw' (press Draw, or it happens automatically) and 'main' (act, buy, trade).
    // The host enforces the deadlines; the engine just records them.
    startTurn() {
      const p = this.players[this.turn];
      this.actionsLeft = 1; this.buysLeft = 1;
      this.phase = 'draw';
      this.phaseDeadline = Date.now() + DRAW_MS;
      this.say(`— ${p.name}'s turn —`);
    }

    drawPhase(i) {
      const p = this.players[i];
      this.phase = 'main';
      this.phaseDeadline = Date.now() + MAIN_MS;
      if (this.blessingKey(i) === 'oraclesSight') {
        this.draw(i, 3);
        this.choice(i, "Oracle's Sight: choose a card to discard.", p.hand.map(id => ({ v: id, card: this.cards[id] })), { type: 'sight' });
      } else this.draw(i, 2);
    }

    // Reaction windows pause the turn clock, so other players deciding doesn't eat into your minute.
    windowClosed(pd) {
      if (this.phase === 'main' && pd.opened) this.phaseDeadline += Date.now() - pd.opened;
    }

    endTurn() {
      if (this.loomShuffle) {
        this.oracle = shuffle(this.oracle.concat(this.oracleDiscard)); this.oracleDiscard = []; this.loomShuffle = false;
        this.say('🧵 The Loom of the Fates turns: the Oracle discards are shuffled back into the deck.');
      }
      this.turn = (this.turn + 1) % this.players.length;
      this.turnNo++;
      this.startTurn();
    }

    // Returns an error string, or undefined on success.
    command(i, cmd) {
      if (this.winner != null) return 'The game is over.';
      const err = this.run(i, cmd || {});
      if (!err) { this.checkWin(); this.seq++; }
      return err;
    }

    run(i, cmd) {
      const pd = this.pending;
      if (cmd.type === 'react') {
        if (!pd || pd.kind !== 'window' || !pd.waiting.includes(i)) return 'There is nothing to react to.';
        return this.react(i, cmd.card);
      }
      if (cmd.type === 'choose') {
        if (!pd || pd.kind !== 'choice' || pd.player !== i) return 'You have no choice to make.';
        if (!pd.options.some(o => o.v === cmd.v)) return 'That is not one of the options.';
        this.pending = null;
        return this.resolveChoice(i, pd.ctx, cmd.v);
      }
      if (pd) return pd.kind === 'window' ? 'Waiting for reactions.' : `Waiting for ${this.name(pd.player)}.`;
      if (i !== this.turn) return 'It is not your turn.';
      if (this.phase === 'draw') return cmd.type === 'draw' ? this.drawPhase(i) : 'Draw your cards first.';
      if (cmd.type === 'draw') return 'You have already drawn this turn.';
      if (cmd.type === 'play') return this.play(i, cmd.card, cmd.target || {});
      if (cmd.type === 'buy') {
        if (this.buysLeft < 1) return 'You have no buys left this turn.';
        return this.purchase(i, cmd.card, false);
      }
      if (cmd.type === 'trade') return this.trade(i, cmd.cards, cmd.res);
      if (cmd.type === 'end') return this.endTurn();
      return 'Unknown command.';
    }

    // House rule: discard any 2 cards from hand to take 1 resource card of your choice.
    // The card comes from the Oracle discard pile, or failing that from the Oracle deck (which is then reshuffled).
    trade(i, cards, res) {
      const p = this.players[i];
      if (!Array.isArray(cards) || cards.length !== 2 || cards[0] === cards[1] || !cards.every(id => p.hand.includes(id))) return 'Choose 2 different cards from your hand.';
      if (!R.RES.includes(res)) return 'Choose a resource.';
      const isRes = id => this.cards[id] === res;
      let got = this.oracleDiscard.find(isRes);
      if (got != null) this.removeFrom(this.oracleDiscard, got);
      else {
        got = this.oracle.find(isRes);
        if (got == null) return `There are no ${R.RES_NAME[res]} cards left to take. Every one is in someone's hand.`;
        this.removeFrom(this.oracle, got);
        shuffle(this.oracle);
      }
      cards.forEach(id => { this.removeFrom(p.hand, id); this.oracleDiscard.push(id); });
      p.hand.push(got);
      this.say(`🔁 ${p.name} trades 2 cards for 1 ${R.RES_NAME[res]}.`);
    }

    timeout() {
      const pd = this.pending;
      if (!pd || pd.kind !== 'window' || Date.now() < pd.deadline - 200) return false;
      pd.waiting = [];
      this.closeWindow();
      this.checkWin(); this.seq++;
      return true;
    }

    checkWin() {
      if (this.winner != null) return;
      const n = this.players.length;
      for (let k = 0; k < n; k++) {
        const i = (this.turn + k) % n;
        if (this.wins(i)) {
          const pd = this.pending;
          if (pd && pd.ctx && pd.ctx.type === 'keepBlessing') this.agora.push(pd.ctx.both[1]);
          this.winner = i; this.pending = null;
          this.say(`🏆 ${this.name(i)} has won the favour of the gods!`);
          return;
        }
      }
    }

    // ---------- actions ----------
    validTarget(i, key, t) {
      const d = C[key], n = this.players.length;
      const isOpp = j => Number.isInteger(j) && j >= 0 && j < n && j !== i;
      if (d.raid) {
        if (!isOpp(t.player) || !R.CATS.includes(t.cat)) return 'Choose a player and a category to raid.';
        if (!this.catCards(t.player, t.cat).length) return 'They have no face-up cards in that category.';
      } else if (key === 'aphrodite') {
        const o = this.ownerOf(t.card);
        if (o < 0 || o === i || this.def(t.card).pts !== 1) return "Choose another player's face-up card worth 1.";
      } else if (key === 'zeus') {
        if (this.ownerOf(t.card) < 0 || this.def(t.card).pts > 2) return 'Choose a face-up card worth up to 2.';
      } else if (key === 'hermes') {
        if (!isOpp(t.player) || !this.players[t.player].hand.length) return 'Choose a player with cards in hand.';
      } else if (key === 'hera') {
        if (!isOpp(t.player) || !this.players[t.player].blessing) return 'Choose a player with a Blessing.';
      }
      return null;
    }

    describe(act) {
      const d = C[act.key], who = this.name(act.player), t = act.target;
      if (d.raid) return `⚔️ ${who} plays ${d.name} on ${this.name(t.player)}'s ${R.CAT_NAME[t.cat]}!`;
      if (act.key === 'aphrodite' || act.key === 'zeus') return `${d.glyph} ${who} plays ${d.name} on ${this.name(this.ownerOf(t.card))}'s ${this.def(t.card).name}.`;
      if (act.key === 'hermes' || act.key === 'hera') return `${d.glyph} ${who} plays ${d.name} on ${this.name(t.player)}.`;
      return `${d.glyph} ${who} plays ${d.name}.`;
    }

    play(i, id, t) {
      const p = this.players[i];
      if (!p.hand.includes(id)) return 'You do not have that card.';
      const key = this.cards[id];
      if (C[key].type !== 'action') return 'That card is not an action.';
      if (this.actionsLeft < 1) return 'You have already used your action this turn.';
      const err = this.validTarget(i, key, t);
      if (err) return err;
      this.removeFrom(p.hand, id); this.oracleDiscard.push(id);
      this.actionsLeft--;
      const act = { player: i, key, target: t };
      this.say(this.describe(act));
      this.openAegis(act, 0, null);
    }

    // A reaction window where anyone holding an Aegis may cancel (or re-enable) the action.
    openAegis(act, count, lastBy) {
      const standing = count % 2 === 0;
      const waiting = this.players.map((_, j) => j).filter(j => j !== lastBy && !(standing && j === act.player) && this.has(j, 'aegis'));
      if (!waiting.length) return this.afterAegis(act, count);
      this.pending = { kind: 'window', react: 'aegis', act, count, waiting, opened: Date.now(), deadline: Date.now() + WINDOW_MS };
    }

    react(i, cardId) {
      const pd = this.pending;
      if (cardId == null) {
        pd.waiting = pd.waiting.filter(j => j !== i);
        if (!pd.waiting.length) this.closeWindow();
        return;
      }
      const p = this.players[i];
      if (!p.hand.includes(cardId) || this.cards[cardId] !== pd.react) return 'You cannot play that card now.';
      this.removeFrom(p.hand, cardId); this.oracleDiscard.push(cardId);
      this.pending = null;
      this.windowClosed(pd);
      if (pd.react === 'aegis') {
        this.say(`🛡️ ${p.name} raises the Aegis${pd.count % 2 ? ' and restores the action' : ' to cancel it'}!`);
        this.openAegis(pd.act, pd.count + 1, i);
      } else {
        this.say(`🧱 ${p.name} forms a Shield Wall! (+3 Shields)`);
        pd.act.shieldWall = 3;
        this.raidReveal(pd.act);
      }
    }

    closeWindow() {
      const pd = this.pending;
      this.pending = null;
      this.windowClosed(pd);
      if (pd.react === 'aegis') this.afterAegis(pd.act, pd.count);
      else this.raidReveal(pd.act);
    }

    afterAegis(act, count) {
      if (count % 2) { this.say(`${C[act.key].name} is cancelled.`); return; }
      if (C[act.key].raid) {
        const dfd = act.target.player;
        if (this.has(dfd, 'shieldWall')) {
          this.pending = { kind: 'window', react: 'shieldWall', act, waiting: [dfd], opened: Date.now(), deadline: Date.now() + WINDOW_MS };
          return;
        }
        return this.raidReveal(act);
      }
      this.resolve(act);
    }

    raidReveal(act) {
      const a = act.player, dfd = act.target.player, cat = act.target.cat;
      const cards = this.catCards(dfd, cat);
      let shields = cards.length;
      const hero = this.players[dfd].hero;
      if (hero && R.HEROES[hero].guard === cat) shields += 2;
      if (this.blessingKey(dfd) === 'strategos') shields += 1;
      shields += act.shieldWall || 0;
      if (this.blessingKey(a) === 'strategos') shields -= 1;
      if (act.key === 'trojanHorse') shields -= 2;
      shields = Math.max(1, shields);
      act.pool = shuffle(cards.concat(Array(shields).fill(0)));
      this.say(`${this.name(dfd)} fans out ${plural(cards.length, 'card')} and ${plural(shields, 'Shield')} face down.`);
      this.choice(a, `Pick one face-down card from ${this.name(dfd)}'s ${R.CAT_NAME[cat]}. Find a Shield and the raid fails.`,
        act.pool.map((_, k) => ({ v: k })), { type: 'raidPick', act });
    }

    raidSuccess(act, id) {
      const dfd = this.players[act.target.player], atk = this.players[act.player];
      this.removeFrom(dfd.table, id); atk.table.push(id);
      this.reveal = { n: ++this.revealSeq, ok: true, card: this.cards[id], raider: act.player, defender: act.target.player };
      this.say(`💥 ${atk.name} seizes ${dfd.name}'s ${this.def(id).name}!`);
      if (act.key === 'nightAmbush') { this.actionsLeft++; this.say(`🌙 Night Ambush: ${atk.name} may play another action.`); }
    }

    raidFailed(act, saved) {
      const a = act.player;
      if (!saved) this.reveal = { n: ++this.revealSeq, ok: false, card: null, raider: a, defender: act.target.player };
      if (act.key === 'spartanRaid') { this.draw(a, 1); this.say(`${this.name(a)} draws 1 card (Spartan Raid).`); }
      if (act.key === 'pirateRaid') {
        const id = this.drawAgoraSkippingChaos();
        if (id != null) { this.say(`🏴‍☠️ ${this.name(a)} plunders ${this.def(id).name} from the Agora supply.`); this.gain(a, id); }
      }
    }

    drawAgoraSkippingChaos() {
      for (let guard = 0; guard < 60; guard++) {
        const id = this.drawAgora();
        if (id == null) return null;
        if (this.def(id).type === 'chaos') this.chaos(id); else return id;
      }
      return null;
    }

    resolve(act) {
      const i = act.player, p = this.players[i], t = act.target, n = this.players.length;
      switch (act.key) {
        case 'aphrodite': {
          const o = this.ownerOf(t.card);
          this.removeFrom(this.players[o].table, t.card); p.table.push(t.card);
          this.say(`💘 ${p.name} charms away ${this.name(o)}'s ${this.def(t.card).name}.`);
          break;
        }
        case 'zeus': {
          const o = this.ownerOf(t.card);
          this.removeFrom(this.players[o].table, t.card); this.agoraDiscard.push(t.card);
          this.say(`⚡ ${this.name(o)}'s ${this.def(t.card).name} is struck down.`);
          break;
        }
        case 'hermes': {
          const v = this.players[t.player]; let k = 0;
          for (; k < 2 && v.hand.length; k++) p.hand.push(v.hand.splice(Math.floor(Math.random() * v.hand.length), 1)[0]);
          this.say(`🪶 ${p.name} filches ${plural(k, 'card')} from ${v.name}.`);
          break;
        }
        case 'athena': {
          const drawn = this.draw(i, 3);
          this.choice(i, "Athena's Wisdom: choose 1 card to put back on top of the Oracle deck.", drawn.map(id => ({ v: id, card: this.cards[id] })), { type: 'athena' });
          break;
        }
        case 'hera': {
          const v = this.players[t.player], b = v.blessing;
          v.blessing = null;
          this.say(`🦚 ${p.name} takes ${v.name}'s ${this.def(b).name}.`);
          this.gainBlessing(i, b);
          break;
        }
        case 'apollo': {
          const k = Math.min(5, this.agora.length);
          if (k < 2) { this.say('The Agora supply holds too few cards to reorder.'); break; }
          this.apolloPrompt(i, this.agora.slice(0, k), [], k);
          break;
        }
        case 'hades': {
          const seen = {}, opts = [];
          this.oracleDiscard.forEach(id => { const key = this.cards[id]; if (!seen[key]) { seen[key] = 1; opts.push({ v: id, card: key }); } });
          if (!opts.length) { this.say('The Oracle discard pile is empty.'); break; }
          this.choice(i, "Hades' Bargain: take any card from the Oracle discard pile.", opts, { type: 'hades' });
          break;
        }
        case 'demeter':
          this.draw(i, 2); this.buysLeft++;
          this.say(`🌾 ${p.name} draws 2 cards and may buy twice this turn.`);
          break;
        case 'hephaestus': {
          const opts = this.market.filter(id => id != null && R.payPlan(this.handCards(i), this.def(id), R.discountFor(this.who(i), this.def(id)) + 2))
            .map(id => ({ v: id, card: this.cards[id] }));
          opts.push({ v: 'skip', label: 'Buy nothing' });
          this.choice(i, "Hephaestus' Forge: buy any Agora card for 2 fewer resources, ignoring requirements.", opts, { type: 'forge' });
          break;
        }
        case 'dionysus': {
          const hands = this.players.map(q => q.hand);
          this.players.forEach((q, j) => (q.hand = hands[(j - 1 + n) % n]));
          this.draw(i, 1);
          this.say('🍇 Every hand passes to the left!');
          break;
        }
      }
    }

    apolloPrompt(i, remaining, placed, k) {
      this.choice(i, `Apollo's Prophecy: choose the card to put ${placed.length ? 'next' : 'on top'} of the Agora supply.`,
        remaining.map(id => ({ v: id, card: this.cards[id] })), { type: 'apollo', remaining, placed, k });
    }

    resolveChoice(i, ctx, v) {
      const p = this.players[i];
      switch (ctx.type) {
        case 'sight':
          this.removeFrom(p.hand, v); this.oracleDiscard.push(v);
          break;
        case 'athena':
          this.removeFrom(p.hand, v); this.oracle.unshift(v);
          break;
        case 'hades':
          this.removeFrom(this.oracleDiscard, v); p.hand.push(v);
          this.say(`💀 ${p.name} bargains a card back from the underworld.`);
          break;
        case 'apollo': {
          const placed = ctx.placed.concat([v]), remaining = ctx.remaining.filter(id => id !== v);
          if (remaining.length > 1) return this.apolloPrompt(i, remaining, placed, ctx.k);
          this.agora.splice(0, ctx.k, ...placed, ...remaining);
          this.say(`☀️ ${p.name} rearranges the future of the Agora.`);
          break;
        }
        case 'forge':
          if (v !== 'skip') { const err = this.purchase(i, v, true); if (err) this.say(err); }
          break;
        case 'keepBlessing': {
          const other = ctx.both.find(id => id !== v);
          p.blessing = v;
          this.agora.push(other); shuffle(this.agora);
          this.say(`${p.name} keeps ${this.def(v).name}; ${this.def(other).name} returns to the Agora supply.`);
          break;
        }
        case 'raidPick': {
          const act = ctx.act, picked = act.pool[v];
          if (!picked) { this.say(`🛡️ A Shield! ${p.name}'s raid fails.`); return this.raidFailed(act); }
          const dfd = act.target.player;
          if (this.blessingKey(dfd) === 'phoenixEmber') {
            this.say(`🔥 Phoenix Ember! ${this.name(dfd)} gets a chance to save the ${this.def(picked).name}.`);
            return this.choice(dfd, `Phoenix Ember: your ${this.def(picked).name} is shuffled with 1 Shield. Pick your card to keep it.`,
              [{ v: 0 }, { v: 1 }], { type: 'phoenix', act, card: picked, two: shuffle([picked, 0]) });
          }
          return this.raidSuccess(act, picked);
        }
        case 'phoenix':
          if (ctx.two[v]) {
            this.say(`🔥 ${p.name} rescues the ${this.def(ctx.card).name}! The raid fails.`);
            this.reveal = { n: ++this.revealSeq, ok: false, saved: true, card: this.cards[ctx.card], raider: ctx.act.player, defender: i };
            return this.raidFailed(ctx.act, true);
          }
          return this.raidSuccess(ctx.act, ctx.card);
      }
    }

    // ---------- the Agora ----------
    purchase(i, id, forge) {
      const slot = id == null ? -1 : this.market.indexOf(id);
      if (slot < 0) return 'That card is not in the Agora.';
      const p = this.players[i], d = this.def(id);
      if (!forge && !R.reqMet(this.points(i), d)) return `You need at least ${d.pts - 1} ${R.CAT_NAME[d.cat]} point${d.pts > 2 ? 's' : ''} to buy that.`;
      const plan = R.payPlan(this.handCards(i), d, R.discountFor(this.who(i), d) + (forge ? 2 : 0));
      if (!plan) return 'You cannot afford that card.';
      const paid = plan.map(c => this.def(c).name);
      plan.forEach(c => { this.removeFrom(p.hand, c); this.oracleDiscard.push(c); });
      if (!forge) this.buysLeft--;
      this.market[slot] = null;
      this.say(`${p.name} buys ${d.name}${paid.length ? ' with ' + paid.join(', ') : ' for free'}.`);
      this.refill();
      this.gain(i, id);
    }

    refill() {
      for (let k = 0; k < this.market.length; k++) {
        if (this.market[k] == null) this.market[k] = this.drawAgoraSkippingChaos();
      }
    }

    gain(i, id) {
      if (this.def(id).type === 'blessing') this.gainBlessing(i, id);
      else this.players[i].table.push(id);
    }

    gainBlessing(i, id) {
      const p = this.players[i];
      if (!p.blessing) { p.blessing = id; return; }
      this.choice(i, 'You may hold only one Blessing. Which will you keep?',
        [{ v: p.blessing, card: this.cards[p.blessing] }, { v: id, card: this.cards[id] }], { type: 'keepBlessing', both: [p.blessing, id] });
    }

    chaos(id) {
      const key = this.cards[id], n = this.players.length;
      this.say(`🌩️ CHAOS — ${C[key].name}! ${C[key].text}`);
      if (key === 'titanomachy') {
        this.players.forEach(p => { this.oracleDiscard.push(...p.hand); p.hand = []; });
        this.players.forEach((p, i) => this.draw(i, 4));
        const bl = this.players.map(p => p.blessing);
        this.players.forEach((p, i) => (p.blessing = bl[(i + 1) % n]));
      } else if (key === 'poseidon') {
        this.players.forEach((p, i) => {
          const fleet = this.catCards(i, 'fleet').sort((a, b) => this.def(a).pts - this.def(b).pts);
          if (!fleet.length) return;
          this.removeFrom(p.table, fleet[0]); this.agoraDiscard.push(fleet[0]);
          this.say(`🌊 ${p.name} loses ${this.def(fleet[0]).name}.`);
        });
      } else if (key === 'pandora') {
        const gifts = this.players.map(p => (p.hand.length ? p.hand[Math.floor(Math.random() * p.hand.length)] : null));
        gifts.forEach((g, i) => { if (g == null) return; this.removeFrom(this.players[i].hand, g); this.players[(i - 1 + n) % n].hand.push(g); });
        this.players.forEach((p, i) => this.draw(i, 1));
      }
      this.agoraDiscard.push(id);
    }

    // ---------- what each player is allowed to see ----------
    view(me) {
      const kc = id => ({ id, key: this.cards[id] });
      const over = this.winner != null;
      const pd = this.pending;
      let pending = null;
      if (pd) {
        pending = { kind: pd.kind };
        if (pd.kind === 'window') {
          const a = pd.act;
          pending.react = pd.react; pending.waiting = pd.waiting.slice(); pending.count = pd.count || 0;
          pending.remaining = Math.max(0, pd.deadline - Date.now());
          pending.act = { player: a.player, key: a.key, target: a.target, targetCard: a.target.card ? this.cards[a.target.card] : null, targetOwner: a.target.card ? this.ownerOf(a.target.card) : null };
        } else {
          pending.player = pd.player; pending.type = pd.ctx.type;
          if (pd.player === me) { pending.prompt = pd.prompt; pending.options = pd.options.map(o => ({ v: o.v, card: o.card || null, label: o.label || null })); }
        }
      }
      return {
        you: me, seq: this.seq, target: this.opts.target, heroes: this.opts.heroes,
        turn: this.turn, turnNo: this.turnNo, actionsLeft: this.actionsLeft, buysLeft: this.buysLeft,
        // Reaction windows pause the turn clock, so report the time that was left when the window opened.
        phase: this.phase, clockPaused: !!(pd && pd.kind === 'window'),
        phaseRemaining: Math.max(0, this.phaseDeadline - (pd && pd.kind === 'window' && this.phase === 'main' ? pd.opened : Date.now())),
        players: this.players.map((p, i) => {
          const open = i === me || over;
          return {
            name: p.name, bot: p.bot, connected: p.connected, hero: p.hero,
            blessing: p.blessing ? this.cards[p.blessing] : null,
            table: p.table.map(kc), handCount: p.hand.length,
            hand: open ? p.hand.map(kc) : null,
            points: open ? this.points(i) : this.publicPoints(i),
            needed: this.needed(i),
          };
        }),
        market: this.market.map(id => (id == null ? null : kc(id))),
        oracleCount: this.oracle.length, oracleDiscardCount: this.oracleDiscard.length,
        oracleDiscardTop: this.oracleDiscard.length ? this.cards[this.oracleDiscard[this.oracleDiscard.length - 1]] : null,
        agoraCount: this.agora.length, agoraDiscardCount: this.agoraDiscard.length,
        pending, winner: this.winner, reveal: this.reveal, log: this.log.slice(-60),
      };
    }

    // Every card id should be in exactly one place (used by the self-test).
    audit() {
      const seen = {};
      const mark = (id, where) => { if (id == null) return; if (seen[id]) throw new Error(`card ${id} (${this.cards[id]}) in ${seen[id]} and ${where}`); seen[id] = where; };
      this.oracle.forEach(id => mark(id, 'oracle')); this.oracleDiscard.forEach(id => mark(id, 'oracleDiscard'));
      this.agora.forEach(id => mark(id, 'agora')); this.agoraDiscard.forEach(id => mark(id, 'agoraDiscard'));
      this.market.forEach(id => mark(id, 'market'));
      this.players.forEach((p, i) => { p.hand.forEach(id => mark(id, 'hand' + i)); p.table.forEach(id => mark(id, 'table' + i)); mark(p.blessing, 'blessing' + i); });
      const pd = this.pending;
      if (pd && pd.ctx && pd.ctx.type === 'keepBlessing') pd.ctx.both.forEach(id => { if (!seen[id]) mark(id, 'pendingBlessing'); });
      const total = Object.keys(this.cards).length, count = Object.keys(seen).length;
      if (total !== count) {
        const lost = Object.keys(this.cards).filter(id => !seen[id]).map(id => this.cards[id]);
        throw new Error(`lost cards: ${lost.join(', ')}; pending ${pd ? pd.kind + '/' + (pd.ctx && pd.ctx.type) : 'none'}; winner ${this.winner}; log: ${this.log.slice(-6).map(l => l.text).join(' | ')}`);
      }
    }
  }

  R.Game = Game;
  R.shuffle = shuffle;
})(window.ROO);
