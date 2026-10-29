// Sound effects, synthesised with the Web Audio API so no sound files are needed.
// To use a recorded sound instead, drop assets/sfx/<name>.mp3 in place; it takes over automatically.
window.ROO = window.ROO || {};
(function (R) {
  const NAMES = ['click', 'draw', 'place', 'shuffle', 'coin', 'trade', 'raid', 'steal', 'clang', 'magic', 'zap',
    'thunder', 'turn', 'tick', 'victory', 'defeat', 'error'];
  let ctx = null, master = null, noiseBuf = null;
  const files = {};
  const prefs = { on: true, volume: 0.7 };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem('roo.sound') || '{}')); } catch (e) { /* storage unavailable */ }

  // Browsers only allow audio after the player interacts with the page.
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = prefs.volume;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, ensure, { capture: true }));

  // Probe for recorded overrides.
  NAMES.forEach(name => {
    const a = new Audio();
    a.preload = 'auto';
    a.addEventListener('canplaythrough', () => { files[name] = a; }, { once: true });
    a.src = `assets/sfx/${name}.mp3`;
  });

  // ---- building blocks ----
  function tone(freq, start, dur, o) {
    o = o || {};
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, start + dur);
    const peak = o.gain == null ? 0.3 : o.gain;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    let out = g;
    if (o.lowpass) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lowpass; g.connect(f); out = f; }
    osc.connect(g); out.connect(master);
    osc.start(start); osc.stop(start + dur + 0.05);
  }

  function noise(start, dur, o) {
    o = o || {};
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 2000, start);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, start + dur);
    f.Q.value = o.q || 1;
    const peak = o.gain == null ? 0.3 : o.gain;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(start, Math.random()); src.stop(start + dur + 0.05);
  }

  // A metallic strike: inharmonic partials with different decays.
  function metal(start, base, dur, gain) {
    [1, 2.76, 5.4, 8.93].forEach((m, k) => tone(base * m, start, dur / (1 + k * 0.6), { gain: gain / (1 + k), type: 'sine' }));
    noise(start, 0.05, { freq: 4000, q: 0.7, gain: gain * 0.8 });
  }

  const swish = (t, g) => noise(t, 0.16, { freq: 900, to: 4500, q: 0.9, gain: g || 0.35 });

  const SYNTH = {
    click: t => { tone(1400, t, 0.05, { gain: 0.12, type: 'triangle' }); noise(t, 0.03, { freq: 3000, gain: 0.08 }); },
    draw: t => { swish(t); swish(t + 0.12, 0.25); },
    place: t => { noise(t, 0.09, { filter: 'lowpass', freq: 900, gain: 0.5 }); tone(140, t, 0.1, { gain: 0.25 }); },
    shuffle: t => { for (let k = 0; k < 7; k++) swish(t + k * 0.06 + Math.random() * 0.02, 0.18); },
    coin: t => { metal(t, 1900, 0.35, 0.12); metal(t + 0.09, 2500, 0.45, 0.1); },
    trade: t => { swish(t, 0.25); swish(t + 0.1, 0.25); SYNTH.coin(t + 0.22); },
    raid: t => {
      // war horn over two drum hits
      tone(110, t, 0.9, { type: 'sawtooth', to: 130, gain: 0.18, attack: 0.08, lowpass: 900 });
      tone(165, t + 0.05, 0.85, { type: 'sawtooth', gain: 0.1, attack: 0.1, lowpass: 900 });
      [0, 0.22].forEach(d => { tone(70, t + d, 0.25, { to: 40, gain: 0.5 }); noise(t + d, 0.12, { filter: 'lowpass', freq: 400, gain: 0.3 }); });
    },
    steal: t => { noise(t, 0.22, { filter: 'highpass', freq: 1500, to: 6000, gain: 0.3 }); SYNTH.coin(t + 0.18); },
    clang: t => { metal(t, 420, 1.1, 0.22); tone(90, t, 0.2, { gain: 0.3, to: 60 }); },
    magic: t => { [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, t + k * 0.06, 0.6, { gain: 0.09, type: 'triangle' })); },
    zap: t => { noise(t, 0.35, { filter: 'highpass', freq: 3000, to: 300, gain: 0.4 }); tone(900, t, 0.3, { type: 'sawtooth', to: 80, gain: 0.12 }); SYNTH.thunder(t + 0.1, 0.6); },
    thunder: (t, scale) => {
      const s = scale || 1;
      noise(t, 0.08, { filter: 'highpass', freq: 2000, gain: 0.35 * s });
      noise(t + 0.03, 2.2 * s, { filter: 'lowpass', freq: 500, to: 60, q: 0.5, gain: 0.7 * s, attack: 0.05 });
      noise(t + 0.4, 1.6 * s, { filter: 'lowpass', freq: 200, to: 50, q: 0.5, gain: 0.5 * s, attack: 0.2 });
    },
    turn: t => { tone(880, t, 1.2, { gain: 0.16 }); tone(1320, t + 0.12, 1.2, { gain: 0.12 }); tone(1760, t + 0.24, 1.0, { gain: 0.06 }); },
    tick: t => tone(1800, t, 0.04, { gain: 0.1, type: 'square', lowpass: 3000 }),
    victory: t => {
      const notes = [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.45], [784, 0.75], [1047, 0.9]];
      notes.forEach(([f, d], k) => tone(f, t + d, k === notes.length - 1 ? 1.4 : 0.3, { type: 'sawtooth', gain: 0.1, lowpass: 2400, attack: 0.02 }));
      [523, 659, 784].forEach(f => tone(f, t + 0.9, 1.4, { type: 'triangle', gain: 0.08 }));
    },
    defeat: t => { [392, 349, 311, 262].forEach((f, k) => tone(f, t + k * 0.25, 0.5, { type: 'triangle', gain: 0.12 })); },
    error: t => tone(160, t, 0.18, { type: 'square', gain: 0.08, lowpass: 800 }),
  };

  R.sfx = {
    play(name) {
      if (!prefs.on || !SYNTH[name]) return;
      if (files[name]) {
        const a = files[name].cloneNode();
        a.volume = prefs.volume;
        a.play().catch(() => {});
        return;
      }
      if (!ensure() || ctx.state !== 'running') return;
      SYNTH[name](ctx.currentTime + 0.01);
    },
    get on() { return prefs.on; },
    get volume() { return prefs.volume; },
    set(o) {
      Object.assign(prefs, o);
      if (master) master.gain.value = prefs.volume;
      try { localStorage.setItem('roo.sound', JSON.stringify(prefs)); } catch (e) { /* storage unavailable */ }
    },
    names: NAMES,
    // Renders every sound offline and reports its peak level (used by tests/sfx.html).
    async selfTest() {
      const out = {};
      for (const name of NAMES) {
        const off = new OfflineAudioContext(1, 44100 * 3, 44100);
        const saved = [ctx, master, noiseBuf];
        ctx = off; master = off.createGain(); master.connect(off.destination);
        noiseBuf = off.createBuffer(1, 88200, 44100);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        SYNTH[name](0.01);
        [ctx, master, noiseBuf] = saved;
        const buf = await off.startRendering();
        let peak = 0;
        buf.getChannelData(0).forEach(x => { peak = Math.max(peak, Math.abs(x)); });
        out[name] = +peak.toFixed(2);
      }
      return out;
    },
  };
})(window.ROO);
