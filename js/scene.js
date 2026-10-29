// Vector artwork for the menu backdrop and title laurels.
// If assets/menu-bg.png exists it is shown on top of this drawing instead.
(function (R) {
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  // A curved branch of laurel leaves. side = 1 grows to the right, -1 to the left.
  R.laurel = function (side, opts) {
    const o = Object.assign({ w: 120, h: 150, fill: '#d9a641', stroke: '#7a4f17', leaves: 9 }, opts || {});
    // The stem bows outward (away from the title) as it rises.
    const at = t => [
      o.w * 0.5 + side * (Math.sin(t * Math.PI * 0.9) * o.w * 0.38 - o.w * 0.3 + t * o.w * 0.2),
      o.h - 6 - t * (o.h - 16),
    ];
    let leaves = '', stem = '';
    for (let k = 0; k <= o.leaves; k++) {
      const t = k / o.leaves, [px, py] = at(t), [nx, ny] = at(Math.min(1, t + 0.02));
      stem += (k ? 'L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1);
      const tang = Math.atan2(ny - py, nx - px) * 180 / Math.PI;
      const size = 1 - t * 0.4;
      [-55, 55].forEach(off => {
        leaves += `<path transform="translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${(tang + 90 + off).toFixed(1)}) scale(${size.toFixed(2)})" d="M0,0 C7,-9 7,-22 0,-30 C-7,-22 -7,-9 0,0Z"/>`;
      });
    }
    leaves += `<path transform="translate(${at(1)[0].toFixed(1)},${at(1)[1].toFixed(1)}) rotate(${side > 0 ? 10 : -10}) scale(0.6)" d="M0,0 C7,-9 7,-22 0,-30 C-7,-22 -7,-9 0,0Z"/>`;
    return `<svg viewBox="0 0 ${o.w} ${o.h}" width="${o.w}" height="${o.h}" aria-hidden="true">
      <path d="${stem}" fill="none" stroke="${o.stroke}" stroke-width="3" stroke-linecap="round"/>
      <g fill="${o.fill}" stroke="${o.stroke}" stroke-width="1.6">${leaves}</g></svg>`;
  };

  function clouds() {
    const puff = (x, y, s, op) => `<g transform="translate(${x},${y}) scale(${s})" opacity="${op}">
      <ellipse cx="0" cy="0" rx="90" ry="34"/><ellipse cx="-50" cy="-8" rx="48" ry="30"/><ellipse cx="40" cy="-22" rx="56" ry="40"/>
      <ellipse cx="95" cy="-4" rx="46" ry="26"/><ellipse cx="-100" cy="8" rx="40" ry="18"/></g>`;
    return `<g fill="#fff">${puff(340, 250, 1.6, 0.95)}${puff(560, 205, 0.9, 0.85)}${puff(1180, 300, 1.4, 0.9)}${puff(1000, 120, 0.6, 0.7)}${puff(820, 330, 0.8, 0.75)}${puff(1420, 170, 0.7, 0.6)}</g>`;
  }

  function house(x, y, w, h) {
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f7f1e4" stroke="#c8b99a" stroke-width="1"/>
      <path d="M${x - 3},${y} L${x + w / 2},${y - h * 0.35} L${x + w + 3},${y}Z" fill="#c8643a"/>
      <rect x="${x + w * 0.25}" y="${y + h * 0.35}" width="${w * 0.18}" height="${h * 0.3}" fill="#5d7fae"/>
      <rect x="${x + w * 0.6}" y="${y + h * 0.35}" width="${w * 0.18}" height="${h * 0.3}" fill="#5d7fae"/></g>`;
  }

  function cypress(x, y, h) {
    return `<path d="M${x},${y} C${x - h * 0.16},${y - h * 0.4} ${x - h * 0.08},${y - h * 0.8} ${x},${y - h} C${x + h * 0.08},${y - h * 0.8} ${x + h * 0.16},${y - h * 0.4} ${x},${y}Z" fill="#2f5b35"/>`;
  }

  function temple(x, y, w) {
    const cols = 6, h = w * 0.42;
    let c = '';
    for (let k = 0; k < cols; k++) { const cx = x + w * 0.08 + k * (w * 0.84 / (cols - 1)); c += `<rect x="${cx - w * 0.025}" y="${y - h}" width="${w * 0.05}" height="${h}" fill="#f6f0e2"/>`; }
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${w * 0.06}" fill="#e8dfcb"/>${c}
      <rect x="${x - w * 0.03}" y="${y - h - w * 0.06}" width="${w * 1.06}" height="${w * 0.06}" fill="#efe7d4"/>
      <path d="M${x - w * 0.04},${y - h - w * 0.06} L${x + w / 2},${y - h - w * 0.2} L${x + w * 1.04},${y - h - w * 0.06}Z" fill="#f4ecdb" stroke="#d8ccb2"/></g>`;
  }

  function boat(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-14,0 L14,0 L9,6 L-9,6Z" fill="#6b4a2b"/>
      <path d="M0,-2 L0,-30 L14,-4Z" fill="#fff"/><path d="M-2,-4 L-2,-24 L-12,-4Z" fill="#f1ece0"/></g>`;
  }

  function column(x, w, flip) {
    let flutes = '';
    for (let k = 1; k < 6; k++) flutes += `<rect x="${x + (w * k) / 6 - 2}" y="0" width="4" height="1000" fill="#d9cfbc" opacity="0.7"/>`;
    return `<g><rect x="${x}" y="0" width="${w}" height="1000" fill="url(#marble)"/>${flutes}
      <rect x="${flip ? x - 14 : x - 6}" y="0" width="${w + 20}" height="34" fill="#ece3d0"/>
      <rect x="${flip ? x - 14 : x - 6}" y="34" width="${w + 20}" height="10" fill="#d4c7ad"/></g>`;
  }

  function vine() {
    let leaves = '';
    const pts = [[40, 40], [95, 120], [60, 200], [118, 270], [70, 350], [130, 430], [80, 520], [40, 600]];
    pts.forEach(([x, y], k) => {
      const r = k % 2 ? 35 : -35;
      leaves += `<path transform="translate(${x},${y}) rotate(${r})" d="M0,0 C14,-10 16,-30 0,-44 C-16,-30 -14,-10 0,0Z" fill="${k % 3 ? '#3f7a3a' : '#5a9a48'}" stroke="#2c5a2a" stroke-width="1.5"/>`;
    });
    return `<path d="M30,0 C140,90 10,170 110,260 C180,330 20,400 120,470 C170,520 40,560 50,640" fill="none" stroke="#4b6b2f" stroke-width="6"/>${leaves}`;
  }

  function banner() {
    let key = '';
    for (let k = 0; k < 6; k++) key += `<path d="M${1338 + k * 20},392 h14 v-12 h-8 v6" fill="none" stroke="#e7d39e" stroke-width="3"/>`;
    return `<g><rect x="1300" y="40" width="200" height="12" rx="6" fill="#7b5531"/><circle cx="1296" cy="46" r="10" fill="#c9a24a"/>
      <path d="M1320,52 L1480,52 L1480,420 L1400,470 L1320,420Z" fill="#203a74" stroke="#152a57" stroke-width="4"/>
      <path d="M1330,62 L1470,62 L1470,410 L1400,456 L1330,410Z" fill="none" stroke="#c9a24a" stroke-width="2" opacity="0.7"/>
      <g transform="translate(1340,170) scale(0.5)">${R.laurel(1, { w: 120, h: 150, fill: '#d9b866', stroke: '#d9b866' }).replace(/<\/?svg[^>]*>/g, '')}</g>
      <g transform="translate(1400,170) scale(0.5)">${R.laurel(-1, { w: 120, h: 150, fill: '#d9b866', stroke: '#d9b866' }).replace(/<\/?svg[^>]*>/g, '')}</g>
      ${key}</g>`;
  }

  function helmet() {
    let bristles = '';
    for (let k = 0; k < 16; k++) { const a = Math.PI * (1.05 - k / 16); bristles += `<line x1="${150 + Math.cos(a) * 110}" y1="${120 - Math.sin(a) * 110}" x2="${150 + Math.cos(a) * 140}" y2="${120 - Math.sin(a) * 140}" stroke="#7d2219" stroke-width="5"/>`; }
    return `<g transform="translate(40,560)">
      <path d="M30,130 C30,-20 270,-20 270,130 L250,128 C240,20 60,20 50,128Z" fill="#b8392b" stroke="#7d2219" stroke-width="4"/>${bristles}
      <path d="M45,150 C45,40 255,40 255,150 L262,300 C262,330 220,335 205,310 L198,232 L168,226 L170,332 C150,350 130,350 132,332 L134,226 L104,232 L98,310 C83,335 40,330 40,300Z" fill="url(#bronzeGrad)" stroke="#7a4f17" stroke-width="5"/>
      <path d="M70,200 C110,180 190,180 232,200 L226,222 L172,214 L172,330 L130,330 L130,214 L76,222Z" fill="#2a1d14"/>
      <path d="M78,120 C100,80 150,72 160,74" fill="none" stroke="#f6dc92" stroke-width="7" stroke-linecap="round" opacity="0.8"/></g>`;
  }

  function amphora() {
    return `<g transform="translate(1440,580)">
      <path d="M40,20 L100,20 L96,50 C150,70 160,170 120,250 L104,290 L36,290 L20,250 C-20,170 -10,70 44,50Z" fill="#c4672e" stroke="#4a2414" stroke-width="5"/>
      <path d="M44,40 C10,40 0,90 24,110" fill="none" stroke="#4a2414" stroke-width="9"/><path d="M96,40 C130,40 140,90 116,110" fill="none" stroke="#4a2414" stroke-width="9"/>
      <rect x="2" y="120" width="136" height="44" fill="#2c1a10"/>
      <path d="M8,154 h12 v-22 h22 v14 h-12 v-6 M50,154 h12 v-22 h22 v14 h-12 v-6 M92,154 h12 v-22 h22 v14 h-12 v-6" fill="none" stroke="#d48a4f" stroke-width="4"/>
      <rect x="22" y="200" width="96" height="10" fill="#2c1a10"/></g>
      <path d="M1418,520 C1440,470 1470,460 1500,430 M1440,500 C1420,480 1400,486 1390,470" stroke="#3b6b33" stroke-width="5" fill="none"/>
      <ellipse cx="1500" cy="430" rx="16" ry="8" fill="#4e8a3e"/><ellipse cx="1390" cy="470" rx="16" ry="8" fill="#4e8a3e"/>`;
  }

  function props() {
    const deck = [0, 1, 2].map(k => `<g transform="translate(${310 + k * 8},${862 - k * 8}) rotate(-8)"><rect width="170" height="110" rx="8" fill="#203a74" stroke="#e8d7a8" stroke-width="5"/></g>`).join('');
    const map = `<g transform="translate(1150,870) rotate(4)"><path d="M0,0 L440,-20 L460,150 L10,170Z" fill="#ead8ae" stroke="#b79a64" stroke-width="3"/>
      <path d="M80,40 C140,10 200,60 250,40 C300,30 330,80 380,60 M120,110 C170,90 210,120 260,100" fill="none" stroke="#a5865a" stroke-width="3"/>
      <circle cx="80" cy="100" r="26" fill="none" stroke="#8d7046" stroke-width="2"/><path d="M80,70 L80,130 M50,100 L110,100" stroke="#8d7046" stroke-width="2"/></g>`;
    const scroll = `<g transform="translate(-20,900) rotate(-6)"><rect x="0" y="0" width="200" height="46" rx="20" fill="#f3e7cd" stroke="#b79a64" stroke-width="3"/>
      <rect x="120" y="-4" width="22" height="54" fill="#b8392b"/><circle cx="200" cy="23" r="20" fill="#e2cfa6" stroke="#b79a64" stroke-width="3"/></g>`;
    return deck + map + scroll;
  }

  R.menuScene = function () {
    let houses = '';
    for (let k = 0; k < 26; k++) {
      const x = 200 + rnd() * 380, slope = 430 + (x - 200) * 0.45 + rnd() * 160;
      houses += house(x, slope, 26 + rnd() * 20, 18 + rnd() * 12);
    }
    let trees = '';
    for (let k = 0; k < 10; k++) trees += cypress(190 + rnd() * 420, 480 + rnd() * 260, 50 + rnd() * 40);
    let glints = '';
    for (let k = 0; k < 40; k++) glints += `<rect x="${rnd() * 1600}" y="${580 + rnd() * 260}" width="${20 + rnd() * 60}" height="2" fill="#fff" opacity="${0.15 + rnd() * 0.25}"/>`;
    return `<svg class="scene-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d6bcf"/><stop offset="0.6" stop-color="#7fb7ec"/><stop offset="1" stop-color="#bfe0f7"/></linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a8bd6"/><stop offset="1" stop-color="#1b4c9c"/></linearGradient>
        <linearGradient id="marble" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d6ccb8"/><stop offset="0.45" stop-color="#f7f2e7"/><stop offset="1" stop-color="#cbbfa8"/></linearGradient>
        <linearGradient id="bronzeGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0c766"/><stop offset="0.6" stop-color="#c8902f"/><stop offset="1" stop-color="#8a5a1c"/></linearGradient>
        <linearGradient id="ledge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe3c8"/><stop offset="0.25" stop-color="#e0d0ac"/><stop offset="1" stop-color="#bda77c"/></linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#sky)"/>
      ${clouds()}
      <path d="M760,580 L880,500 L960,530 L1080,460 L1200,520 L1300,490 L1460,580Z" fill="#7f9ccc"/>
      <path d="M900,580 L1010,520 L1100,550 L1230,505 L1460,580Z" fill="#6a8bc0"/>
      <rect y="575" width="1600" height="425" fill="url(#sea)"/>${glints}
      <path d="M160,1000 L160,430 C220,380 300,350 380,370 C470,390 560,470 640,560 L700,640 L720,1000Z" fill="#d6be8c"/>
      <path d="M600,520 L700,640 L720,1000 L560,1000Z" fill="#b99c6b"/>
      ${temple(250, 376, 150)}${trees}${houses}
      <path d="M1060,1000 L1080,640 C1120,600 1180,560 1240,570 C1300,580 1340,640 1360,700 L1380,1000Z" fill="#cdb380"/>
      ${temple(1170, 566, 80)}${cypress(1120, 640, 70)}${cypress(1300, 640, 60)}${cypress(1330, 660, 50)}
      ${boat(820, 700, 1.2)}${boat(950, 650, 0.8)}${boat(760, 790, 1.5)}${boat(1010, 760, 1)}
      ${column(0, 150, false)}${vine()}
      ${column(1470, 130, true)}${banner()}
      <rect y="840" width="1600" height="160" fill="url(#ledge)"/><rect y="836" width="1600" height="10" fill="#f6edd8"/>
      ${helmet()}${amphora()}${props()}
    </svg>`;
  };
})(window.ROO);
