// Online play over WebRTC (PeerJS). The host's browser runs the game; guests send commands and receive views.
(function (R) {
  const PREFIX = 'rivals-of-olympus-v1-';
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const BOT_NAMES = ['Pythia', 'Leonidas', 'Pericles', 'Aspasia', 'Themistocles', 'Sappho', 'Solon', 'Hypatia'];
  const MAX_PLAYERS = 5;

  const makeCode = () => Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  const cleanName = n => String(n || '').replace(/[<>]/g, '').trim().slice(0, 16) || 'Stranger';

  // cb: { onLobby(lobby), onView(view), onError(text), onClosed(text) }
  class Host {
    constructor(name, cb) {
      this.cb = cb;
      this.seats = [{ name: cleanName(name), conn: null, bot: false, local: true }];
      this.opts = { target: 6, heroes: false };
      this.game = null; this.peer = null; this.code = null;
      this.isHost = true;
    }

    goOnline() {
      if (typeof Peer === 'undefined') { this.cb.onError('Online play needs an internet connection.'); return; }
      this.code = makeCode();
      this.peer = new Peer(PREFIX + this.code, { debug: 1 });
      this.peer.on('open', () => this.pushLobby());
      this.peer.on('connection', conn => {
        conn.on('data', msg => this.onMessage(conn, msg));
        conn.on('close', () => this.onDisconnect(conn));
        conn.on('error', () => this.onDisconnect(conn));
      });
      this.peer.on('disconnected', () => { if (!this.peer.destroyed) this.peer.reconnect(); });
      this.peer.on('error', e => {
        if (e.type === 'unavailable-id') { this.peer.destroy(); this.goOnline(); return; }
        if (e.type === 'peer-unavailable') return;
        this.cb.onError('Connection problem: ' + (e.type || e.message));
      });
      this.pushLobby();
    }

    send(conn, msg) { if (conn && conn.open) conn.send(msg); }

    onMessage(conn, msg) {
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'hello') {
        const name = cleanName(msg.name);
        if (this.game) {
          const i = this.seats.findIndex(s => !s.bot && !s.local && !s.conn && s.name === name);
          if (i < 0) { this.send(conn, { t: 'refused', text: 'That game has already started.' }); return; }
          this.seats[i].conn = conn;
          this.game.players[i].connected = true;
          this.game.say(`${name} has returned.`);
          this.update();
          return;
        }
        if (this.seats.length >= MAX_PLAYERS) { this.send(conn, { t: 'refused', text: 'That game is full.' }); return; }
        let unique = name, k = 2;
        while (this.seats.some(s => s.name === unique)) unique = `${name} ${k++}`;
        this.seats.push({ name: unique, conn, bot: false });
        this.pushLobby();
        return;
      }
      const i = this.seats.findIndex(s => s.conn === conn);
      if (i < 0 || msg.t !== 'cmd' || !this.game) return;
      const err = this.game.command(i, msg.cmd);
      if (err) this.send(conn, { t: 'error', text: err });
      this.update();
    }

    onDisconnect(conn) {
      const i = this.seats.findIndex(s => s.conn === conn);
      if (i < 0) return;
      if (!this.game) { this.seats.splice(i, 1); this.pushLobby(); return; }
      this.seats[i].conn = null;
      this.game.players[i].connected = false;
      this.game.say(`${this.seats[i].name} lost connection — the gods will play for them until they return.`);
      this.update();
    }

    lobbyFor(i) {
      return { code: this.code, online: !!this.peer, ready: !!(this.peer && this.peer.open), you: i, isHost: i === 0, opts: this.opts, seats: this.seats.map(s => ({ name: s.name, bot: s.bot })) };
    }

    pushLobby() {
      this.cb.onLobby(this.lobbyFor(0));
      this.seats.forEach((s, i) => this.send(s.conn, { t: 'lobby', lobby: this.lobbyFor(i) }));
    }

    addBot() {
      if (this.seats.length >= MAX_PLAYERS) return;
      const name = BOT_NAMES.find(n => !this.seats.some(s => s.name === n)) || 'Oracle ' + this.seats.length;
      this.seats.push({ name, conn: null, bot: true });
      this.pushLobby();
    }

    removeSeat(i) {
      if (i <= 0 || i >= this.seats.length) return;
      const s = this.seats.splice(i, 1)[0];
      if (s.conn) { this.send(s.conn, { t: 'refused', text: 'The host removed you from the game.' }); setTimeout(() => s.conn.close(), 300); }
      this.pushLobby();
    }

    setOpts(o) { Object.assign(this.opts, o); this.pushLobby(); }

    start() {
      if (this.seats.length < 2) { this.cb.onError('You need at least 2 players. Invite a friend or add a bot.'); return; }
      const target = this.seats.length === 2 ? Math.min(this.opts.target, 5) : this.opts.target;
      this.game = new R.Game(this.seats.map(s => ({ name: s.name, bot: s.bot })), { target, heroes: this.opts.heroes });
      this.update();
    }

    command(cmd) {
      if (!this.game) return;
      const err = this.game.command(0, cmd);
      if (err) this.cb.onError(err);
      this.update();
    }

    update() {
      const g = this.game;
      this.cb.onView(g.view(0));
      this.seats.forEach((s, i) => this.send(s.conn, { t: 'view', view: g.view(i) }));
      this.schedule();
    }

    // Lets bots (and disconnected players) take their turns, and closes reaction windows on time.
    schedule() {
      clearTimeout(this.botTimer); clearTimeout(this.windowTimer); clearTimeout(this.turnTimer);
      const g = this.game;
      if (!g || g.winner != null) return;
      const auto = i => g.players[i].bot || !g.players[i].connected;
      const pd = g.pending;
      // While a reaction window is open the turn clock is paused, so just check back later.
      const wait = pd && pd.kind === 'window' ? 1000 : Math.max(0, g.phaseDeadline - Date.now()) + 50;
      this.turnTimer = setTimeout(() => this.turnTimeout(), wait);
      let who;
      if (pd && pd.kind === 'window') {
        who = pd.waiting.find(auto);
        this.windowTimer = setTimeout(() => { if (g.timeout()) this.update(); else this.schedule(); }, Math.max(0, pd.deadline - Date.now()) + 50);
      } else if (pd) who = auto(pd.player) ? pd.player : undefined;
      else who = auto(g.turn) ? g.turn : undefined;
      if (who === undefined) return;
      this.botTimer = setTimeout(() => {
        const cmd = R.botAct(g, who);
        if (cmd && g.command(who, cmd)) g.command(who, R.botFallback(g, who));
        this.update();
      }, pd && pd.kind === 'window' ? 600 : 1100);
    }

    // Draw automatically after the draw timer; end the turn when the action/buy timer runs out.
    turnTimeout() {
      const g = this.game;
      if (!g || g.winner != null) return;
      if (Date.now() < g.phaseDeadline - 200 || (g.pending && g.pending.kind === 'window')) { this.schedule(); return; }
      const who = g.turn;
      if (g.phase === 'draw') {
        g.say(`⏳ ${g.name(who)} draws automatically.`);
        g.command(who, { type: 'draw' });
      } else {
        // Settle any choice that is still open (e.g. a raid pick) before ending the turn.
        for (let k = 0; k < 20 && g.pending && g.pending.kind === 'choice'; k++) {
          const p = g.pending.player;
          if (g.command(p, R.botAct(g, p))) g.command(p, R.botFallback(g, p));
        }
        if (g.winner == null && !g.pending && g.turn === who) {
          g.say(`⏳ Time is up for ${g.name(who)}.`);
          g.command(who, { type: 'end' });
        }
      }
      this.update();
    }

    leave() {
      clearTimeout(this.botTimer); clearTimeout(this.windowTimer); clearTimeout(this.turnTimer);
      this.seats.forEach(s => this.send(s.conn, { t: 'closed', text: 'The host has left the game.' }));
      const peer = this.peer;
      if (peer) setTimeout(() => peer.destroy(), 300);
      this.game = null;
    }
  }

  class Client {
    constructor(code, name, cb) {
      this.cb = cb; this.isHost = false; this.closed = false;
      this.code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      this.name = cleanName(name);
      if (typeof Peer === 'undefined') { setTimeout(() => cb.onClosed('Online play needs an internet connection.')); return; }
      this.peer = new Peer({ debug: 1 });
      this.peer.on('open', () => this.connect());
      this.peer.on('error', e => {
        if (e.type === 'peer-unavailable') this.finish(`No game found with code ${this.code}.`);
        else if (e.type === 'network' || e.type === 'server-error') this.finish('Could not reach the matchmaking server.');
        else cb.onError('Connection problem: ' + e.type);
      });
    }

    connect() {
      this.conn = this.peer.connect(PREFIX + this.code, { reliable: true, serialization: 'json' });
      this.conn.on('open', () => this.conn.send({ t: 'hello', name: this.name }));
      this.conn.on('data', msg => {
        if (msg.t === 'lobby') this.cb.onLobby(msg.lobby);
        else if (msg.t === 'view') this.cb.onView(msg.view);
        else if (msg.t === 'error') this.cb.onError(msg.text);
        else if (msg.t === 'refused' || msg.t === 'closed') this.finish(msg.text);
      });
      this.conn.on('close', () => this.finish('Lost connection to the host.'));
    }

    finish(text) {
      if (this.closed) return;
      this.closed = true;
      this.cb.onClosed(text);
      if (this.peer) this.peer.destroy();
    }

    command(cmd) { if (this.conn && this.conn.open) this.conn.send({ t: 'cmd', cmd }); }
    leave() { this.closed = true; if (this.peer) this.peer.destroy(); }
  }

  R.Host = Host;
  R.Client = Client;
})(window.ROO);
