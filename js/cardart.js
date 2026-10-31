// Painted card faces, drawn as SVG in the style of the resource paintings:
// a coloured frame, a parchment name banner, a picture on parchment, rules text and a meander band.
// R.cardFace(key) gives the whole face as one <svg> (252 x 352, the 63:88 card shape).
window.ROO = window.ROO || {};
(function (R) {
  const INK = '#2b1d12';
  const PARCH = '#efe2bf', PARCH_D = '#e2d0a2';

  // Frame colours per card family: [dark, light].
  const FRAME = {
    raid: ['#7c2e1f', '#b9573c'], god: ['#4f3a6e', '#8a6bb0'], reaction: ['#2f5874', '#6b97b8'],
    hidden: ['#3a3631', '#7d7468'], event: ['#26294a', '#5d6296'], wild: ['#a8701f', '#e3b257'],
    fleet: ['#24557a', '#4f88b3'], polis: ['#866534', '#c4a066'], treasure: ['#93701a', '#d6ad45'],
    blessing: ['#2c6f6c', '#62aaa5'], chaos: ['#5a1a2a', '#a33c52'], hero: ['#6e4321', '#b98250'],
    shield: ['#46525d', '#97a5b1'],
  };
  const RES_COL = { olives: '#6f8a2e', bronze: '#c26a2c', silver: '#6f8299', marble: '#f2efe6', hoplites: '#a8322a' };
  const CAT_COL = { fleet: '#2f6a96', polis: '#9c7a42', treasure: '#b48a1e' };

  function family(d) {
    if (d.type === 'resource') return 'wild';
    if (d.type === 'action') return d.raid ? 'raid' : 'god';
    if (d.type === 'point') return d.cat;
    return d.type;
  }
  function typeLabel(d) {
    switch (d.type) {
      case 'resource': return 'Wild Resource';
      case 'action': return d.raid ? 'Raid · Action' : 'God · Action';
      case 'reaction': return 'Reaction';
      case 'hidden': return 'Hidden · ' + R.CAT_NAME[d.cat];
      case 'event': return 'Event';
      case 'point': return R.CAT_NAME[d.cat] + ' · Agora';
      case 'blessing': return 'Blessing · Agora';
      case 'chaos': return 'Chaos · Agora';
      default: return d.type;
    }
  }
  function rulesText(d) {
    if (d.type === 'point') return d.pts > 1 ? `Requires ${d.pts - 1} ${R.CAT_NAME[d.cat]} point${d.pts > 2 ? 's' : ''} to buy.` : 'No requirement.';
    return d.text;
  }

  // ---- drawing helpers (art space is 200 x 170) ----
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const P = (d, fill, extra) => `<path d="${d}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
  const hl = (d, o) => `<path d="${d}" fill="#fff" opacity="${o || 0.3}" stroke="none" data-k="fx"/>`;
  const sh = (d, o) => `<path d="${d}" fill="#000" opacity="${o || 0.18}" stroke="none" data-k="fx"/>`;
  const C = (x, y, r, fill, extra) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
  const E = (x, y, rx, ry, fill, extra) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
  const L = (x1, y1, x2, y2, w, col) => `<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="${col || INK}" stroke-width="${w || 3}"/>`;
  const star = (x, y, r, fill) => `<path d="M${x},${y - r} Q${x},${y} ${x + r},${y} Q${x},${y} ${x},${y + r} Q${x},${y} ${x - r},${y} Q${x},${y} ${x},${y - r}Z" fill="${fill || '#fff6c8'}" stroke="none"/>`;
  const glow = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col || '#fff4c4'}" opacity=".55" stroke="none" data-k="fx"/>`;
  const g = (t, body) => `<g transform="${t}">${body}</g>`;
  function waves(y, fill, amp) {
    amp = amp || 7;
    let d = `M-10,${y}`;
    for (let x = -10; x < 210; x += 30) d += ` Q${x + 7.5},${y - amp} ${x + 15},${y} T${x + 30},${y}`;
    return P(d + ' V175 H-10Z', fill);
  }
  function leaf(x, y, ang, len, fill) {
    return g(`translate(${x},${y}) rotate(${ang})`, P(`M0,0 C${len * .3},${-len * .28} ${len * .75},${-len * .25} ${len},0 C${len * .75},${len * .25} ${len * .3},${len * .28} 0,0Z`, fill || '#5f7f2e'));
  }
  function ship(x, y, s, o) {
    o = o || {};
    const hull = o.hull || '#8a5a32', sail = o.sail || '#efe2bf';
    let oars = '';
    const n = o.oars || 5;
    for (let i = 0; i < n; i++) { const ox = -40 + i * (80 / (n - 1 || 1)); oars += L(ox, 4, ox - 10, 24, 2.5); }
    if (o.banks > 1) for (let i = 0; i < n; i++) { const ox = -36 + i * (80 / (n - 1 || 1)); oars += L(ox, 8, ox - 6, 28, 2.5); }
    let shields = '';
    if (o.shields) for (let i = 0; i < 5; i++) shields += C(-36 + i * 18, -10, 6, o.shields);
    const sailD = 'M-30,-72 H30 C26,-52 26,-36 30,-22 H-30 C-26,-36 -26,-52 -30,-72Z';
    return g(`translate(${x},${y}) scale(${s})`,
      oars +
      L(0, -8, 0, -82, 4) + L(-34, -72, 34, -72, 3.5) +
      P(sailD, sail) + (o.stripe ? P('M-28,-56 H28 V-46 H-28Z', o.stripe, 'stroke="none"') + P(sailD, 'none') : '') +
      (o.mark || '') +
      P('M-64,-10 L62,-10 C60,6 44,16 0,16 C-42,16 -60,8 -64,-10Z', hull) +
      sh('M-60,2 C-50,12 -30,16 0,16 C40,16 56,8 60,-2 C40,6 -30,8 -60,2Z', .2) +
      P('M62,-10 C70,-14 74,-24 66,-32', 'none', 'stroke-width="4"') + P('M-64,-10 C-72,-18 -70,-30 -62,-30 C-56,-30 -56,-22 -62,-22', 'none', 'stroke-width="4"') +
      (o.ram ? P('M58,4 L78,8 L58,12Z', '#c79a4a') : '') + shields +
      C(48, -2, 3.2, '#fff', 'stroke-width="1.5"') + C(48.5, -2, 1.3, INK, 'stroke="none"'));
  }
  function column(x, y, w, h, fill) {
    return P(`M${x - w / 2 - 4},${y - h} h${w + 8} v6 h-${w + 8}Z`, fill || '#f2ece0') +
      P(`M${x - w / 2},${y - h + 6} h${w} v${h - 12} h-${w}Z`, fill || '#f2ece0') +
      L(x - w / 6, y - h + 10, x - w / 6, y - 10, 1.5) + L(x + w / 6, y - h + 10, x + w / 6, y - 10, 1.5) +
      P(`M${x - w / 2 - 4},${y - 6} h${w + 8} v6 h-${w + 8}Z`, fill || '#f2ece0');
  }
  function templeFront(x, y, s, fill) {
    let cols = '';
    for (let i = 0; i < 4; i++) cols += column(-36 + i * 24, 0, 12, 52, fill);
    return g(`translate(${x},${y}) scale(${s})`,
      P('M-58,-58 L0,-88 L58,-58Z', fill || '#f2ece0') + P('M-44,-62 L0,-82 L44,-62Z', '#d9cdb5') +
      P('M-56,-58 h112 v8 h-112Z', fill || '#f2ece0') + cols +
      P('M-60,0 h120 v7 h-120Z', '#ddd2bd') + P('M-66,7 h132 v7 h-132Z', '#d0c4ab'));
  }
  function flame(x, y, s, a, b) {
    return g(`translate(${x},${y}) scale(${s})`,
      P('M0,0 C-22,0 -26,-22 -14,-38 C-12,-28 -6,-26 -4,-30 C-8,-44 0,-58 8,-64 C6,-48 22,-42 20,-22 C20,-8 12,0 0,0Z', a || '#e8742a') +
      P('M0,-4 C-10,-4 -12,-16 -6,-24 C-2,-18 4,-20 4,-28 C12,-20 12,-4 0,-4Z', b || '#f6c94a', 'stroke="none"'));
  }
  function laurelBranch(x, y, ang, n, col) {
    let out = '';
    for (let i = 0; i < n; i++) {
      out += leaf(i * 11, 0, -40, 15, col) + leaf(i * 11 + 4, 0, 40, 15, col);
    }
    return g(`translate(${x},${y}) rotate(${ang})`, L(0, 0, n * 11 + 4, 0, 2) + out);
  }
  function helmetSide(fill, crest) {
    return P('M40,60 C40,30 60,14 92,14 C126,14 146,36 146,70 L146,112 L122,118 L120,94 C120,86 112,82 104,84 L104,118 L74,124 C60,112 46,100 40,84Z', fill) +
      hl('M58,46 C66,30 80,24 96,24 C82,30 72,40 66,56Z', .4) +
      P('M104,84 C112,82 120,86 120,94 L120,108 L104,108Z', '#2b1d12') +
      (crest ? P('M30,46 C40,6 90,-6 140,4 C164,10 174,30 168,52 C150,34 120,26 92,26 C64,26 46,36 38,52Z', crest) + P('M50,30 L56,40 M70,18 L74,30 M92,12 L94,26 M114,10 L112,24 M136,14 L130,28 M154,24 L146,36', 'none', 'stroke-width="2"') : '');
  }
  function shieldDisc(x, y, r, fill, rim) {
    return C(x, y, r, rim || '#c99a46') + C(x, y, r * .82, fill) + hl(`M${x - r * .6},${y - r * .3} A${r * .7},${r * .7} 0 0 1 ${x + r * .2},${y - r * .68} A${r * .78},${r * .78} 0 0 0 ${x - r * .6},${y - r * .3}Z`, .35);
  }

  // ---- one painting per card ----
  const ART = {
    ambrosia: () => glow(100, 70, 66) +
      P('M60,36 H140 C140,84 122,100 100,102 C78,100 60,84 60,36Z', '#e2b23c') +
      E(100, 36, 40, 9, '#f6d77a') + E(100, 37, 33, 5.5, '#fff1b0', 'stroke-width="2"') +
      hl('M70,48 C70,72 78,86 90,94 L84,94 C72,84 66,70 66,48Z', .45) +
      P('M93,101 h14 v30 h-14Z', '#c99528') + E(100, 136, 32, 9, '#e2b23c') + hl('M78,133 C88,130 104,129 118,131 C104,133 90,134 78,136Z', .5) +
      star(36, 40, 12) + star(160, 30, 9) + star(164, 96, 13) + star(38, 112, 8) + star(100, 12, 7),
    nectar: () => glow(100, 92, 64, '#ffe3a0') +
      P('M56,74 C46,124 72,152 100,152 C128,152 154,124 144,74Z', '#d08a2a') +
      sh('M120,80 C130,110 124,138 104,150 C130,148 150,124 144,80Z', .18) +
      P('M74,52 h52 v24 h-52Z', '#b8731f') + E(100, 52, 30, 7, '#e6a640') +
      P('M56,74 C64,84 70,78 74,92 C78,104 84,92 86,84 C90,76 102,94 108,82 C114,72 120,98 128,86 C134,78 140,84 144,74 C130,70 70,70 56,74Z', '#f6c24a') +
      hl('M66,92 C64,112 70,130 82,140 C72,136 62,116 64,94Z', .4) +
      P('M126,20 L146,64', 'none', 'stroke-width="5"') + E(148, 70, 9, 7, '#a8701f') + P('M148,77 C150,88 146,96 146,104', 'none', 'stroke="#f6c24a" stroke-width="5"') +
      star(40, 40, 11) + star(168, 116, 9) + star(30, 132, 7),
    siege: () => P('M10,170 V70 h20 v-14 h18 v14 h20 v-14 h18 v14 h20 v-14 h18 v14 h20 v-14 h18 v14 h28 V170Z', '#c8b996') +
      P('M10,96 H190 M10,124 H190 M10,150 H190 M50,70 V96 M100,70 V96 M150,70 V96 M30,96 V124 M80,96 V124 M130,96 V124 M175,96 V124 M55,124 V150 M110,124 V150 M160,124 V150', 'none', 'stroke-width="1.6" opacity=".55"') +
      sh('M10,150 H190 V170 H10Z', .15) +
      g('rotate(-14 60 120)', P('M40,60 V176 M64,60 V176', 'none', 'stroke="#7a4b28" stroke-width="7"') + P('M40,70 H64 M40,92 H64 M40,114 H64 M40,136 H64 M40,158 H64', 'none', 'stroke="#7a4b28" stroke-width="5"')) +
      g('translate(132,40) rotate(35)', L(0, 0, 0, 56, 3.5) + P('M-6,-2 L0,-16 L6,-2Z', '#9aa3ad') + P('M0,48 L-7,60 M0,48 L7,60 M0,42 L-7,54 M0,42 L7,54', 'none', 'stroke="#a8322a" stroke-width="3"')) +
      g('translate(160,58) rotate(20)', L(0, 0, 0, 50, 3.5) + P('M-6,-2 L0,-16 L6,-2Z', '#9aa3ad') + P('M0,42 L-7,54 M0,42 L7,54', 'none', 'stroke="#a8322a" stroke-width="3"')),
    nightAmbush: () => P('M0,0 H200 V170 H0Z', '#2a2f52', 'stroke="none"') + C(28, 30, 1.6, '#fff', 'stroke="none"') + C(70, 18, 1.2, '#fff', 'stroke="none"') + C(170, 46, 1.6, '#fff', 'stroke="none"') + C(118, 22, 1, '#fff', 'stroke="none"') + C(186, 14, 1.2, '#fff', 'stroke="none"') +
      P('M150,24 A34,34 0 1 0 170,84 A28,28 0 1 1 150,24Z', '#f3e3a0') +
      P('M-10,130 C30,104 60,110 90,124 C120,100 160,96 210,118 V180 H-10Z', '#1b1f38') +
      P('M-10,150 C40,132 90,140 120,150 C150,138 180,140 210,146 V180 H-10Z', '#12152a') +
      g('translate(64,150) rotate(-24)', P('M-5,0 L0,-78 L5,0Z', '#c8d0d8') + L(0, -70, 0, -4, 1.2) + P('M-14,0 h28 v6 h-28Z', '#9b6a2c') + P('M-4,6 h8 v22 h-8Z', '#5a3a1e')) +
      g('translate(132,156) rotate(20)', P('M-5,0 L0,-66 L5,0Z', '#c8d0d8') + L(0, -60, 0, -4, 1.2) + P('M-13,0 h26 v6 h-26Z', '#9b6a2c') + P('M-4,6 h8 v20 h-8Z', '#5a3a1e')) +
      E(84, 112, 4, 2.4, '#ffd34a', 'stroke="none"') + E(98, 112, 4, 2.4, '#ffd34a', 'stroke="none"'),
    spartanRaid: () => g('translate(150,8) rotate(28)', L(0, 0, 0, 160, 6) + P('M-9,0 L0,-26 L9,0Z', '#b8c2cc')) +
      shieldDisc(92, 92, 66, '#a8322a') + P('M64,124 L92,58 L120,124', 'none', 'stroke="#f2d27a" stroke-width="11" stroke-linecap="butt"') + P('M64,124 L92,58 L120,124', 'none', 'stroke-width="2" opacity=".6"'),
    pirateRaid: () => P('M0,0 H200 V170 H0Z', '#f0c98a', 'stroke="none" opacity=".45"') + C(160, 42, 22, '#f3a64a', 'stroke="none" opacity=".7"') +
      ship(96, 116, 1.05, { hull: '#3b2a1e', sail: '#2b2b2b', oars: 5, mark: P('M-10,-58 C-10,-66 10,-66 10,-58 C10,-52 6,-50 6,-46 H-6 C-6,-50 -10,-52 -10,-58Z', '#efe2bf', 'stroke-width="1.5"') + C(-4, -57, 2.4, INK, 'stroke="none"') + C(4, -57, 2.4, INK, 'stroke="none"') + P('M-14,-38 L14,-28 M14,-38 L-14,-28', 'none', 'stroke="#efe2bf" stroke-width="3"'), ram: true }) +
      waves(132, '#3f7aa6') + waves(150, '#2f6a96', 5) + P('M20,132 q8,-6 14,0 M120,128 q8,-6 14,0', 'none', 'stroke="#fff" stroke-width="2" opacity=".6"'),
    trojanHorse: () => P('M30,150 H170 V136 H30Z', '#7a4b28') + C(46, 156, 10, '#5a3a1e') + C(154, 156, 10, '#5a3a1e') + C(46, 156, 3, '#c79a4a') + C(154, 156, 3, '#c79a4a') +
      P('M52,136 V104 H62 V136 M132,136 V104 H142 V136', '#b07a42') +
      P('M50,108 C46,84 60,70 84,70 H124 C130,48 128,30 132,18 C140,8 156,8 164,18 L176,34 C178,40 172,44 166,40 L156,36 C152,52 150,70 146,80 C148,96 144,108 132,110 H56Z', '#c08a50') +
      P('M136,14 C132,4 142,0 150,8 C156,2 166,6 162,16', '#7a4b28') + C(154, 22, 3, INK, 'stroke="none"') +
      P('M64,76 V108 M80,72 V108 M96,72 V108 M112,72 V108 M128,74 V108', 'none', 'stroke-width="1.6" opacity=".5"') +
      P('M84,84 h24 v16 h-24Z', '#5a3a1e') + hl('M60,78 C70,74 90,73 110,74 C90,76 72,78 60,82Z', .4) +
      P('M50,96 C38,98 30,110 34,126', 'none', 'stroke="#7a4b28" stroke-width="6"'),
    aphrodite: () => glow(100, 86, 70, '#ffd9e0') +
      P('M100,146 C40,104 26,72 44,50 C60,30 88,36 100,60 C112,36 140,30 156,50 C174,72 160,104 100,146Z', '#d8546a') +
      hl('M54,58 C62,46 76,46 84,54 C72,52 62,56 56,66Z', .5) + sh('M100,146 C140,116 160,92 158,70 C150,98 128,118 100,146Z', .18) +
      g('translate(100,90) rotate(-28)', L(-92, 0, 92, 0, 4) + P('M92,0 L76,-9 L80,0 L76,9Z', '#e8c35a') + P('M-92,0 L-80,-10 L-74,-10 L-86,0 L-74,10 L-80,10Z', '#f3e8e8')) +
      g('translate(30,44)', P('M0,0 C-8,-10 -24,-8 -24,4 C-12,2 -6,6 0,10Z', '#fff') + P('M0,0 C6,-14 22,-14 24,-2 C12,-2 6,4 0,10Z', '#fff')) +
      star(160, 136, 8, '#fff') + star(170, 30, 6, '#fff'),
    hermes: () => P('M34,124 C34,106 52,98 72,100 L132,96 C150,96 162,104 164,118 C164,128 156,132 144,132 H44 C38,132 34,130 34,124Z', '#b07a42') +
      P('M30,132 H168 C170,140 164,144 156,144 H40 C32,144 28,140 30,132Z', '#7a4b28') +
      P('M70,100 L84,64 M100,98 L110,62 M128,96 L132,64', 'none', 'stroke="#7a4b28" stroke-width="5"') + P('M78,72 Q104,62 132,70', 'none', 'stroke="#7a4b28" stroke-width="4"') +
      P('M58,100 C40,80 18,72 8,52 C26,58 34,54 44,60 C30,44 32,32 24,20 C44,30 50,40 60,52 C60,36 66,26 70,18 C78,40 76,62 72,94Z', '#f6f1e6') +
      P('M30,48 C40,54 48,62 56,74 M42,36 C50,48 56,58 62,72', 'none', 'stroke-width="1.8"') +
      hl('M44,122 C70,116 110,114 150,116 C110,120 70,122 46,128Z', .35) + star(160, 46, 9) + star(140, 22, 6),
    athena: () => P('M120,150 C150,150 176,148 190,140', 'none', 'stroke="#6b4a2a" stroke-width="7"') + leaf(170, 142, -150, 22, '#7f9a4a') + leaf(150, 148, 160, 18, '#7f9a4a') +
      P('M58,148 C46,120 46,80 60,56 C70,40 84,34 100,34 C116,34 130,40 140,56 C154,80 154,120 142,148Z', '#8a6a48') +
      P('M66,64 L56,30 L82,50 C94,46 106,46 118,50 L144,30 L134,64Z', '#8a6a48') +
      P('M76,100 C70,124 76,140 100,146 C124,140 130,124 124,100 C116,90 84,90 76,100Z', '#e8d8b6') +
      P('M84,112 l4,4 l4,-4 M96,118 l4,4 l4,-4 M108,112 l4,4 l4,-4 M90,128 l4,4 l4,-4 M104,128 l4,4 l4,-4', 'none', 'stroke-width="1.6"') +
      C(80, 72, 17, '#f4e8c8') + C(120, 72, 17, '#f4e8c8') + C(80, 72, 10, '#f0b43a') + C(120, 72, 10, '#f0b43a') + C(80, 72, 5, INK, 'stroke="none"') + C(120, 72, 5, INK, 'stroke="none"') + C(77, 69, 1.8, '#fff', 'stroke="none"') + C(117, 69, 1.8, '#fff', 'stroke="none"') +
      P('M94,84 L100,96 L106,84Z', '#e8a03a') +
      P('M58,98 C48,112 50,132 62,146 M142,98 C152,112 150,132 138,146', 'none', 'stroke-width="2.4"') +
      P('M86,148 l-4,8 M92,148 l0,8 M108,148 l0,8 M114,148 l4,8', 'none', 'stroke="#e8a03a" stroke-width="3"'),
    zeus: () => P('M30,60 C14,60 10,40 26,34 C26,16 52,12 60,26 C68,8 100,8 106,28 C120,18 144,24 140,44 C160,44 164,64 146,68 H34Z', '#b7c0cc') +
      hl('M30,46 C40,34 54,32 64,38 C52,38 42,42 34,52Z', .5) + sh('M34,68 H146 C148,62 146,58 140,56 C110,64 70,64 34,60Z', .2) +
      glow(100, 110, 50, '#fff3a8') +
      P('M110,58 L72,112 H98 L80,164 L134,96 H106 L124,58Z', '#f2c43a') + hl('M110,62 L82,104 L90,104 L114,62Z', .5) +
      star(56, 120, 10, '#fff6c8') + star(150, 132, 8, '#fff6c8'),
    hera: () => P('M100,166 C100,120 98,80 100,30', 'none', 'stroke="#6b5a3a" stroke-width="3"') +
      P('M100,18 C50,30 44,100 100,130 C156,100 150,30 100,18Z', '#2f8a7a') +
      P('M100,22 C60,36 56,96 100,124 C144,96 140,36 100,22Z', 'none', 'stroke="#7fc0a8" stroke-width="2"') +
      E(100, 70, 28, 34, '#d6b03c') + E(100, 72, 20, 25, '#2a7a8a') + E(100, 74, 12, 16, '#1d3f80') + E(100, 74, 5, 7, '#0e1a33', 'stroke="none"') +
      hl('M88,58 C92,50 100,48 106,52 C98,52 92,56 90,62Z', .5) +
      P('M100,130 C80,140 70,150 66,164 M100,130 C120,140 130,150 134,164 M100,140 C90,148 86,156 84,166 M100,140 C110,148 114,156 116,166', 'none', 'stroke="#2f8a7a" stroke-width="2.4"'),
    apollo: () => {
      let rays = '';
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, a2 = a + Math.PI / 16; rays += `M${100 + Math.cos(a) * 46},${84 + Math.sin(a) * 46} L${100 + Math.cos(a + .1) * 78},${84 + Math.sin(a + .1) * 78} L${100 + Math.cos(a2) * 46},${84 + Math.sin(a2) * 46}Z `; }
      return glow(100, 84, 82) + P(rays, '#f0a83a') + C(100, 84, 46, '#f6c94a') + hl('M70,66 C78,50 96,44 110,46 C94,52 80,60 74,76Z', .5) +
        g('translate(100,90) scale(.62)', P('M-34,-50 C-46,-20 -40,20 -20,36 H20 C40,20 46,-20 34,-50', 'none', 'stroke="#8a5a1a" stroke-width="7"') + L(-30, -34, 30, -34, 5, '#8a5a1a') + P('M-12,-34 V30 M0,-34 V30 M12,-34 V30', 'none', 'stroke="#8a5a1a" stroke-width="2"') + P('M-24,36 H24 V44 H-24Z', '#8a5a1a'));
    },
    hades: () => P('M0,0 H200 V170 H0Z', '#3a2f3a', 'stroke="none" opacity=".25"') +
      g('translate(140,10) rotate(18)', L(0, 0, 0, 160, 6) + P('M-16,6 V-22 M16,6 V-22', 'none', 'stroke-width="5"') + P('M-16,6 H16', 'none', 'stroke-width="6"') + P('M-21,-20 L-16,-36 L-11,-20Z M11,-20 L16,-36 L21,-20Z', '#9aa3ad')) +
      C(84, 102, 50, '#a8263a') + P('M76,52 L72,40 L80,46 L84,36 L88,46 L96,40 L92,52Z', '#a8263a') +
      P('M62,74 C58,104 68,128 86,138 C112,136 128,116 128,96 C120,76 96,66 62,74Z', '#f3d8c8') +
      (() => { let s = ''; [[74, 90], [86, 84], [98, 88], [110, 96], [80, 104], [94, 102], [108, 110], [88, 118], [102, 124], [74, 116], [116, 120]].forEach(([x, y]) => { s += E(x, y, 5, 6, '#d02848', 'stroke-width="1.5"') + C(x - 1.5, y - 2, 1.4, '#fff', 'stroke="none" opacity=".7"'); }); return s; })() +
      hl('M50,82 C54,66 64,58 76,56 C66,64 58,72 56,88Z', .3),
    demeter: () => {
      let stalks = '', ears = '';
      [-34, -20, -8, 4, 16, 28].forEach((a, i) => {
        const x2 = 100 + Math.sin(a * Math.PI / 180) * 100, y2 = 150 - Math.cos(a * Math.PI / 180) * 110;
        stalks += L(100, 150, x2, y2, 3, '#8a6a2a');
        for (let k = 0; k < 4; k++) {
          const t = .78 + k * .07, ex = 100 + (x2 - 100) * t, ey = 150 + (y2 - 150) * t;
          ears += g(`translate(${ex},${ey}) rotate(${a})`, E(-5, 0, 4.5, 8, '#e3b34a', 'stroke-width="2"') + E(5, 0, 4.5, 8, '#e3b34a', 'stroke-width="2"'));
        }
        ears += g(`translate(${x2},${y2}) rotate(${a})`, E(0, -4, 4, 8, '#e3b34a', 'stroke-width="2"') + L(0, -10, 0, -24, 1.4, '#8a6a2a'));
      });
      return glow(100, 70, 64) + stalks + ears + P('M80,128 C90,122 110,122 120,128 L118,142 C108,138 92,138 82,142Z', '#a8322a') + leaf(84, 150, 200, 30, '#6f8a2e') + leaf(116, 150, -20, 30, '#6f8a2e');
    },
    hephaestus: () => glow(64, 92, 46, '#ffd08a') +
      P('M36,112 H160 C160,124 148,130 134,130 H126 V150 H146 V162 H50 V150 H70 V130 H62 C46,130 36,124 36,112Z', '#5d6670') + P('M36,112 C24,112 14,106 10,96 H40Z', '#5d6670') +
      hl('M40,114 H150 C146,118 140,120 132,120 H44Z', .3) +
      g('translate(122,72) rotate(-36)', P('M-4,-6 h8 v80 h-8Z', '#9b6a2c') + P('M-24,-26 h48 v24 h-48Z', '#7d8790') + hl('M-22,-24 h44 v6 h-44Z', .35)) +
      P('M60,110 L46,82 M68,108 L72,76 M76,110 L96,88 M54,110 L30,96', 'none', 'stroke="#f6a43a" stroke-width="3"') +
      star(44, 76, 7, '#ffd34a') + star(74, 70, 6, '#ffd34a') + star(100, 84, 5, '#ffd34a') + star(26, 92, 5, '#ffd34a'),
    dionysus: () => P('M98,22 C106,14 122,14 130,24', 'none', 'stroke="#6b4a2a" stroke-width="5"') +
      g('translate(122,30) rotate(10)', P('M0,0 C20,-16 46,-6 42,14 C32,8 26,18 14,14 C8,24 0,20 0,0Z', '#6f8a2e') + P('M2,4 C14,2 26,6 36,10', 'none', 'stroke-width="1.5"')) +
      (() => { let s = ''; [[84, 36], [104, 36], [124, 40], [74, 54], [94, 54], [114, 56], [84, 72], [104, 72], [124, 74], [94, 90], [114, 90], [104, 106]].forEach(([x, y]) => { s += C(x - 10, y + 4, 12, '#6b2f78') + C(x - 14, y, 3.5, '#fff', 'stroke="none" opacity=".45"'); }); return s; })() +
      P('M118,124 H174 C174,144 160,152 146,152 C132,152 118,144 118,124Z', '#e2b23c') + E(146, 124, 28, 5, '#7a1f3a') + P('M140,152 h12 v8 h-12Z', '#c99528') + E(146, 162, 16, 4, '#e2b23c') + hl('M124,130 C126,140 132,146 140,148 C130,148 124,140 122,130Z', .45),
    aegis: () => shieldDisc(100, 86, 72, '#d7b062', '#a8763a') +
      C(100, 86, 40, '#e8cfa0') +
      (() => { let s = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x = 100 + Math.cos(a) * 42, y = 86 + Math.sin(a) * 42, x2 = 100 + Math.cos(a + .25) * 58, y2 = 86 + Math.sin(a + .25) * 58; s += `<path d="M${x},${y} Q${(x + x2) / 2 + Math.cos(a + 1.8) * 6},${(y + y2) / 2 + Math.sin(a + 1.8) * 6} ${x2},${y2}" fill="none" stroke="#4f7a3a" stroke-width="5"/>` + C(x2, y2, 3.5, '#4f7a3a', 'stroke-width="1.5"'); } return s; })() +
      C(100, 86, 40, '#e8cfa0') + E(86, 80, 6, 4, '#fff') + E(114, 80, 6, 4, '#fff') + C(86, 80, 2.6, INK, 'stroke="none"') + C(114, 80, 2.6, INK, 'stroke="none"') +
      P('M86,104 C94,110 106,110 114,104', 'none', 'stroke-width="3"') + P('M100,84 L96,96 H104', 'none', 'stroke-width="2"') + P('M80,72 L92,76 M120,72 L108,76', 'none', 'stroke-width="2.4"'),
    shieldWall: () => P('M0,128 H200 V170 H0Z', '#c8b996', 'stroke="none" opacity=".6"') +
      [36, 100, 164].map((x, i) => g(`translate(${x},12)`, L(10, 0, 18, 70, 3.5) + P('M8,-2 L12,-16 L16,-2Z', '#9aa3ad'))).join('') +
      shieldDisc(42, 106, 40, '#2f5874') + shieldDisc(158, 106, 40, '#2f5874') + shieldDisc(100, 100, 46, '#a8322a') +
      P('M34,96 l8,-14 l8,14Z M150,96 l8,-14 l8,14Z', '#e8d8b6') + C(100, 100, 12, '#e8c35a'),
    sunkenTrireme: () => P('M0,0 H200 V170 H0Z', '#2f6a96', 'stroke="none" opacity=".55"') + P('M0,0 H200 V36 C150,46 50,26 0,40Z', '#7fb3d6', 'stroke="none" opacity=".5"') +
      P('M20,170 C40,152 80,148 110,156 C140,148 180,150 200,162 V170Z', '#d9c38a') +
      g('translate(104,150) rotate(-12)', P('M-64,-10 L62,-10 C60,6 44,16 0,16 C-42,16 -60,8 -64,-10Z', '#5a3a1e') + L(-10, -10, 20, -70, 4) + P('M20,-70 L36,-58 L28,-40', 'none', 'stroke-width="3"')) +
      g('translate(56,88)', C(0, -30, 7, 'none', 'stroke-width="4"') + L(0, -23, 0, 30, 5) + L(-14, -12, 14, -12, 4) + P('M-26,12 C-24,30 -10,36 0,36 C10,36 24,30 26,12', 'none', 'stroke-width="5"') + P('M-30,8 L-24,18 L-20,8Z M30,8 L24,18 L20,8Z', INK)) +
      g('translate(150,64)', P('M0,0 C10,-10 26,-8 30,0 C26,8 10,10 0,0Z', '#e8a03a') + P('M30,0 L40,-8 V8Z', '#e8a03a') + C(8, -1, 1.8, INK, 'stroke="none"')) +
      C(120, 108, 4, 'none', 'stroke="#fff" stroke-width="2"') + C(126, 92, 3, 'none', 'stroke="#fff" stroke-width="2"') + C(118, 78, 2.4, 'none', 'stroke="#fff" stroke-width="2"'),
    hiddenShrine: () => P('M0,0 H200 V170 H0Z', '#3a3631', 'stroke="none" opacity=".18"') + glow(100, 80, 60, '#fff0c0') +
      g('translate(100,86) rotate(-30)', C(-52, 0, 22, '#d6ad45') + C(-52, 0, 9, PARCH) + P('M-30,-6 H64 V6 H-30Z', '#d6ad45') + P('M40,6 V24 H50 V6 M58,6 V18 H64 V6', '#d6ad45') +
        hl('M-68,-10 C-62,-20 -50,-22 -40,-18 C-50,-16 -58,-12 -62,-4Z', .5) + C(-52, -22, 5, '#a8322a')) +
      star(150, 40, 9) + star(44, 130, 7),
    buriedHoard: () => P('M0,118 C40,108 160,108 200,120 V170 H0Z', '#a8875a') + P('M0,140 C50,132 150,132 200,142 V170 H0Z', '#8a6a42', 'stroke="none"') +
      P('M44,118 V72 H156 V118Z', '#8a5a32') + P('M44,72 C44,44 156,44 156,72Z', '#a06a3a') + P('M44,72 H156 V82 H44Z', '#d6ad45') + P('M94,78 h12 v18 h-12Z', '#d6ad45') + C(100, 86, 2.5, INK, 'stroke="none"') +
      P('M60,58 C80,50 120,50 140,58', 'none', 'stroke="#d6ad45" stroke-width="5"') +
      C(56, 128, 8, '#f0c84a') + C(74, 132, 8, '#f0c84a') + C(140, 130, 8, '#f0c84a') + P('M116,122 l8,-10 l8,10 l-8,10Z', '#3fa0c8') + P('M82,124 l6,-8 l6,8 l-6,8Z', '#c8384a') +
      sh('M44,96 H156 V118 H44Z', .2) + star(120, 40, 8) + star(70, 34, 6),
    loom: () => P('M0,0 H200 V170 H0Z', '#26294a', 'stroke="none" opacity=".18"') +
      P('M30,160 L54,20 M170,160 L146,20 M44,30 H156 M36,140 H164', 'none', 'stroke="#7a4b28" stroke-width="7"') +
      (() => { let s = ''; for (let i = 0; i < 9; i++) s += L(56 + i * 11, 30, 52 + i * 12, 140, 1.6, '#c8b996'); return s; })() +
      P('M50,70 H150 V100 H50Z', '#a8322a', 'stroke-width="2"') + P('M50,80 H150 M50,90 H150', 'none', 'stroke="#e8c35a" stroke-width="2"') +
      g('translate(36,120)', E(0, 0, 12, 18, '#e8dcc0') + P('M-12,-8 C-4,-4 4,-4 12,-8 M-12,0 C-4,4 4,4 12,0 M-12,8 C-4,12 4,12 12,8', 'none', 'stroke-width="1.4"')) +
      P('M48,120 C80,124 110,110 140,124', 'none', 'stroke="#e8c35a" stroke-width="2.4"') +
      g('translate(158,128) rotate(30)', P('M0,0 L-6,-30 M0,0 L6,-30', 'none', 'stroke="#9aa3ad" stroke-width="5"') + C(-6, 8, 6, 'none', 'stroke-width="3"') + C(6, 8, 6, 'none', 'stroke-width="3"')),
    bireme: () => waves(130, '#4f88b3') + ship(100, 118, 1.05, { sail: '#efe2bf', stripe: '#24557a', oars: 4 }) + waves(146, '#2f6a96', 5),
    trireme: () => waves(130, '#4f88b3') + ship(100, 118, 1.05, { sail: '#efe2bf', stripe: '#a8322a', oars: 5, banks: 2 }) + waves(146, '#2f6a96', 5),
    warGalley: () => waves(130, '#4f88b3') + ship(100, 116, 1.12, { sail: '#a8322a', oars: 6, banks: 2, ram: true, shields: '#d6ad45', mark: C(0, -48, 10, '#e8c35a') }) + waves(148, '#2f6a96', 5),
    armada: () => waves(110, '#7fb3d6') + ship(48, 92, .55, { sail: '#efe2bf', stripe: '#24557a', oars: 3 }) + ship(152, 92, .55, { sail: '#efe2bf', stripe: '#24557a', oars: 3 }) +
      waves(126, '#4f88b3') + ship(100, 128, .9, { sail: '#a8322a', oars: 5, banks: 2, ram: true, shields: '#d6ad45' }) + waves(152, '#2f6a96', 5),
    shrine: () => P('M0,140 H200 V170 H0Z', '#c8b996', 'stroke="none" opacity=".6"') +
      column(40, 150, 16, 100) + column(160, 150, 16, 100) + P('M24,46 H176 V56 H24Z', '#f2ece0') + P('M30,46 L100,22 L170,46Z', '#f2ece0') +
      P('M74,150 V114 H126 V150Z', '#e2d6bf') + P('M68,108 H132 V116 H68Z', '#f2ece0') + flame(100, 108, .8) + glow(100, 90, 30, '#ffd08a') +
      P('M70,130 H130 M70,140 H130', 'none', 'stroke-width="1.5" opacity=".5"'),
    theatre: () => g('translate(72,82) rotate(-10)', P('M-42,-44 C-46,10 -30,44 0,48 C30,44 46,10 42,-44 C20,-36 -20,-36 -42,-44Z', '#f2ece0') +
        P('M-26,-16 C-20,-24 -10,-24 -6,-14 C-14,-10 -22,-10 -26,-16Z M26,-16 C20,-24 10,-24 6,-14 C14,-10 22,-10 26,-16Z', INK) + P('M-22,16 C-10,34 10,34 22,16 C10,22 -10,22 -22,16Z', INK) + P('M-46,-30 C-60,-24 -62,-8 -54,0', 'none', 'stroke="#a8322a" stroke-width="4"')) +
      g('translate(132,96) rotate(12)', P('M-40,-42 C-44,10 -28,42 0,46 C28,42 44,10 40,-42 C20,-34 -20,-34 -40,-42Z', '#d6ad45') +
        P('M-26,-10 C-20,-20 -10,-20 -6,-12 M26,-10 C20,-20 10,-20 6,-12', 'none', 'stroke-width="4"') + P('M-18,26 C-8,14 8,14 18,26 C8,22 -8,22 -18,26Z', INK) + P('M-20,0 L-24,10 M20,0 L24,10', 'none', 'stroke="#2f5874" stroke-width="3"')) +
      P('M30,150 C60,140 80,160 110,148', 'none', 'stroke="#a8322a" stroke-width="4"'),
    temple: () => P('M0,0 H200 V170 H0Z', '#9cc4dc', 'stroke="none" opacity=".35"') + templeFront(100, 140, 1.25) + P('M0,158 H200 V170 H0Z', '#c8b996'),
    acropolis: () => P('M0,0 H200 V170 H0Z', '#9cc4dc', 'stroke="none" opacity=".35"') + C(160, 34, 16, '#f6c94a', 'stroke="none" opacity=".8"') +
      P('M-10,170 L20,110 C40,96 60,94 70,90 H136 C150,96 168,104 182,118 L210,170Z', '#b59a6a') + P('M20,130 C50,124 70,140 100,132 C130,126 160,138 190,134', 'none', 'stroke-width="2" opacity=".4"') +
      sh('M140,96 C160,104 180,120 210,170 H150 C150,140 146,116 140,96Z', .18) +
      templeFront(104, 88, .72) + P('M36,108 C30,90 38,82 40,72 C44,82 50,90 44,108Z', '#4f6e2a'),
    amphora: () => P('M76,22 h48 v8 h-48Z', '#c26a2c') + P('M82,30 C82,44 84,52 70,64 C46,84 50,124 76,146 L88,154 H112 L124,146 C150,124 154,84 130,64 C116,52 118,44 118,30Z', '#c26a2c') +
      P('M82,34 C60,32 52,46 60,62 M118,34 C140,32 148,46 140,62', 'none', 'stroke-width="5"') +
      P('M56,88 H144 C146,98 146,110 144,118 H56 C54,110 54,98 56,88Z', '#2b1d12', 'stroke="none"') +
      g('translate(100,103)', P('M-26,12 L-18,-10 L-10,12 M-14,0 L-30,-6 M10,12 L18,-10 L26,12 M22,-2 L36,-10', 'none', 'stroke="#c26a2c" stroke-width="3"') + C(-18, -14, 4, '#c26a2c', 'stroke="none"') + C(18, -14, 4, '#c26a2c', 'stroke="none"')) +
      P('M88,154 h24 v8 h-24Z', '#2b1d12') + hl('M66,74 C58,90 58,110 68,128 C62,110 62,92 70,76Z', .45),
    laurelWreath: () => glow(100, 86, 60) +
      g('translate(100,80)', (() => { let s = ''; for (let i = 0; i < 9; i++) { const a = 104 + i * 18, b = 76 - i * 18, r = 54; s += leaf(Math.cos(a * Math.PI / 180) * r, Math.sin(a * Math.PI / 180) * r, a + 110, 26, '#e0b53a') + leaf(Math.cos(b * Math.PI / 180) * r, Math.sin(b * Math.PI / 180) * r, b - 110, 26, '#e0b53a'); } return s; })() +
        P('M-13,53 A54,54 0 1 1 13,53', 'none', 'stroke-width="2.4" stroke="#8a6a2a"') +
        P('M-10,50 L-26,74 L-14,72 L-10,82 L0,56 L10,82 L14,72 L26,74 L10,50Z', '#a8322a')),
    goldenIdol: () => glow(100, 70, 60) + P('M60,150 H140 V164 H60Z', '#8a7a62') + P('M68,140 H132 V150 H68Z', '#a39276') +
      P('M100,22 C112,22 118,32 116,44 C114,54 108,58 108,62 L124,70 C132,92 128,112 120,140 H80 C72,112 68,92 76,70 L92,62 C92,58 86,54 84,44 C82,32 88,22 100,22Z', '#e6b83a') +
      P('M80,90 C90,84 110,84 120,90 M84,112 C94,108 106,108 116,112', 'none', 'stroke-width="2"') + C(93, 40, 2.4, INK, 'stroke="none"') + C(107, 40, 2.4, INK, 'stroke="none"') +
      hl('M88,72 C82,90 82,112 86,134 C80,112 80,90 86,72Z', .5) + hl('M92,28 C96,24 104,24 108,28 C102,27 96,28 92,32Z', .55) +
      P('M96,92 l4,-6 l4,6 l-4,6Z', '#3fa0c8') + star(150, 40, 9) + star(48, 64, 7),
    goldenFleece: () => P('M10,40 C60,30 140,30 190,44', 'none', 'stroke="#6b4a2a" stroke-width="8"') + leaf(170, 40, -30, 24, '#6f8a2e') + leaf(30, 36, 200, 22, '#6f8a2e') +
      glow(100, 96, 58) +
      P('M60,40 C46,60 52,80 44,100 C38,120 52,140 66,146 C76,160 92,156 100,148 C108,156 124,160 134,146 C148,140 162,120 156,100 C148,80 154,60 140,40Z', '#e8b832') +
      (() => { let s = ''; [[70, 64], [94, 58], [118, 62], [62, 92], [86, 86], [112, 88], [136, 90], [74, 118], [100, 114], [126, 118], [88, 138], [114, 140]].forEach(([x, y]) => { s += P(`M${x - 9},${y} C${x - 9},${y - 9} ${x + 9},${y - 9} ${x + 9},${y}`, 'none', 'stroke="#a8781a" stroke-width="2.4"'); }); return s; })() +
      P('M78,40 C70,30 66,22 74,16 C80,24 90,26 100,24 C110,26 120,24 126,16 C134,22 130,30 122,40Z', '#e8b832') + P('M74,16 C64,14 60,24 68,30 M126,16 C136,14 140,24 132,30', 'none', 'stroke="#a8781a" stroke-width="4"') +
      hl('M54,94 C50,110 56,126 66,136 C58,122 56,108 58,96Z', .45) + star(168, 92, 9) + star(30, 130, 7),
    olympianFavour: () => {
      let rays = '';
      for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8; rays += L(100 + Math.cos(a) * 30, 54 + Math.sin(a) * 30, 100 + Math.cos(a) * 90, 54 + Math.sin(a) * 90, 4, '#f2c43a'); }
      return glow(100, 54, 80) + rays + P('M10,170 L72,64 L88,82 L104,52 L124,80 L136,70 L194,170Z', '#9aa3ad') + P('M72,64 L88,82 L96,72 L104,52 L112,64 L124,80 L136,70 L146,84 C120,92 90,84 62,82Z', '#f6f1e6', 'stroke-width="2"') +
        sh('M104,52 L124,80 L136,70 L194,170 H120 C130,120 118,80 104,52Z', .18) +
        P('M14,132 C10,118 28,112 38,118 C44,106 66,108 68,120 C80,116 92,124 88,134Z', '#fff', 'stroke-width="2"') + P('M120,144 C116,130 134,124 144,130 C150,118 172,120 174,132 C186,128 198,136 194,146Z', '#fff', 'stroke-width="2"') +
        star(100, 30, 14, '#fff6c8');
    },
    strategos: () => g('translate(100,90) rotate(-40)', L(0, -90, 0, 90, 5) + P('M-8,-86 L0,-108 L8,-86Z', '#9aa3ad')) + g('translate(100,90) rotate(40)', L(0, -90, 0, 90, 5) + P('M-8,-86 L0,-108 L8,-86Z', '#9aa3ad')) +
      shieldDisc(100, 84, 56, '#2f5874', '#b9c2cc') + g('translate(100,84) scale(.62)', (() => { let s = ''; for (let i = 0; i < 9; i++) { const a = 104 + i * 18, b = 76 - i * 18, r = 54; s += leaf(Math.cos(a * Math.PI / 180) * r, Math.sin(a * Math.PI / 180) * r, a + 110, 26, '#e0b53a') + leaf(Math.cos(b * Math.PI / 180) * r, Math.sin(b * Math.PI / 180) * r, b - 110, 26, '#e0b53a'); } return s; })()) + star(100, 84, 12, '#e8c35a') + laurelBranch(36, 150, -8, 6, '#d6ad45') + laurelBranch(164, 150, 188, 6, '#d6ad45'),
    tradeRoutes: () => P('M24,24 H176 V146 H24Z', '#e8d8b0') + P('M24,24 C30,34 30,40 24,48 M176,120 C170,130 170,136 176,146', 'none', 'stroke-width="2"') +
      P('M40,120 C40,100 60,90 70,100 C78,108 90,96 84,84 C76,70 92,58 104,66 M120,60 C140,52 156,70 150,90', 'none', 'stroke="#a8322a" stroke-width="3" stroke-dasharray="6 5"') +
      P('M30,40 C50,36 54,52 44,60 C36,66 40,80 30,82 M160,110 C150,104 148,124 160,130', '#c8b67e', 'stroke-width="2"') +
      g('translate(130,104)', C(0, 0, 30, '#f2ece0') + P('M0,-36 L7,-7 L36,0 L7,7 L0,36 L-7,7 L-36,0 L-7,-7Z', '#d6ad45') + P('M0,-36 L7,-7 L0,0Z M36,0 L7,7 L0,0Z M0,36 L-7,7 L0,0Z M-36,0 L-7,-7 L0,0Z', '#a8781a') + C(0, 0, 4, '#a8322a')) +
      g('translate(60,62) scale(.32)', ship(0, 0, 1, { sail: '#efe2bf', oars: 3 })),
    phoenixEmber: () => glow(100, 96, 70, '#ffc070') + flame(100, 160, 1.4, '#c8401f', '#f2a43a') +
      P('M100,80 C70,40 34,40 10,20 C20,50 34,62 56,70 C34,72 22,80 12,96 C40,92 62,96 84,102Z', '#e8742a') + P('M100,80 C130,40 166,40 190,20 C180,50 166,62 144,70 C166,72 178,80 188,96 C160,92 138,96 116,102Z', '#e8742a') +
      P('M30,32 C50,46 70,58 92,84 M170,32 C150,46 130,58 108,84', 'none', 'stroke-width="2" stroke="#a8321a"') +
      P('M88,110 C84,90 88,72 100,60 C112,72 116,90 112,110 C108,118 92,118 88,110Z', '#f2a43a') + P('M100,60 C96,50 98,40 106,34 C114,36 116,44 110,48 L104,52Z', '#f2a43a') + P('M112,40 L124,44 L112,48Z', '#e8c35a') + C(106, 42, 1.8, INK, 'stroke="none"') +
      P('M96,34 C92,24 100,16 104,10 M102,34 C104,24 112,20 116,16', 'none', 'stroke="#e8742a" stroke-width="3"'),
    oraclesSight: () => glow(100, 70, 70, '#e8e0ff') +
      P('M100,6 C120,20 100,30 112,44 M86,10 C96,24 82,32 92,46', 'none', 'stroke="#9c8ab8" stroke-width="4" opacity=".7"') +
      P('M30,74 C56,40 144,40 170,74 C144,108 56,108 30,74Z', '#f6f1e6') + C(100, 74, 24, '#2c6f6c') + C(100, 74, 11, INK) + C(94, 68, 4, '#fff', 'stroke="none"') +
      P('M30,74 C56,40 144,40 170,74', 'none', 'stroke-width="5"') +
      P('M66,166 L84,120 M134,166 L116,120 M100,166 V124', 'none', 'stroke="#b07a42" stroke-width="5"') + P('M70,112 H130 C130,124 118,128 100,128 C82,128 70,124 70,112Z', '#b07a42') + flame(100, 114, .5, '#8a6bb0', '#d8c8f0'),
    titanomachy: () => P('M0,0 H200 V170 H0Z', '#5a1a2a', 'stroke="none" opacity=".25"') +
      P('M50,30 C40,14 58,4 70,14 C76,0 100,0 104,14 C116,4 136,10 132,26', '#6a5a5a', 'stroke-width="2"') +
      P('M0,170 L70,66 H130 L200,170Z', '#5a4a44') + sh('M100,66 H130 L200,170 H130Z', .2) +
      P('M70,66 C80,74 90,72 100,66 C110,74 120,72 130,66', '#e8742a') +
      P('M86,66 C80,50 76,40 84,28 C92,36 96,30 100,20 C106,32 114,36 118,28 C122,42 118,54 114,66Z', '#f2a43a') + flame(100, 64, .7, '#e8742a', '#f6d34a') +
      P('M84,72 C78,96 70,110 62,130 M118,72 C126,96 132,118 140,140', 'none', 'stroke="#f2a43a" stroke-width="6"') +
      g('translate(40,40) rotate(30)', P('M0,0 C-6,-4 -6,-14 2,-14 C10,-14 10,-4 4,0Z', '#5a4a44')) + g('translate(160,30) rotate(-20)', P('M0,0 C-6,-4 -6,-14 2,-14 C10,-14 10,-4 4,0Z', '#5a4a44')) +
      P('M150,90 L170,110 L160,110 L176,134', 'none', 'stroke="#f6d34a" stroke-width="3"'),
    poseidon: () => P('M0,0 H200 V170 H0Z', '#4f88b3', 'stroke="none" opacity=".25"') +
      P('M-10,170 C10,120 30,70 80,52 C120,38 160,56 164,88 C166,108 148,118 136,108 C148,100 146,80 128,78 C104,76 92,100 100,124 C108,148 140,156 170,150 L210,170Z', '#2f6a96') +
      P('M80,52 C120,38 160,56 164,88 C166,108 148,118 136,108', 'none', 'stroke="#e8f2f8" stroke-width="5"') +
      C(170, 104, 5, '#e8f2f8', 'stroke="none"') + C(178, 92, 4, '#e8f2f8', 'stroke="none"') + C(160, 120, 4, '#e8f2f8', 'stroke="none"') +
      g('translate(60,20) rotate(8)', L(0, 10, 0, 150, 6, '#d6ad45') + P('M-22,30 C-22,20 -22,10 -20,0 M22,30 C22,20 22,10 20,0 M-22,30 H22', 'none', 'stroke-width="8" stroke="#2b1d12"') + P('M-22,30 C-22,20 -22,10 -20,0 M22,30 C22,20 22,10 20,0 M-22,30 H22', 'none', 'stroke-width="4.5" stroke="#d6ad45"') +
        P('M-26,2 L-20,-14 L-14,2Z M-6,-4 L0,-22 L6,-4Z M14,2 L20,-14 L26,2Z', '#d6ad45') + L(0, 30, 0, -4, 4.5, '#d6ad45')),
    pandora: () => P('M0,0 H200 V170 H0Z', '#3a2f3a', 'stroke="none" opacity=".18"') +
      P('M70,60 C40,40 60,20 80,30 C90,10 120,14 116,34 C140,24 160,44 140,60', '#4a3a5a', 'opacity=".9"') + P('M84,58 C70,48 76,40 86,44 M110,56 C120,46 132,50 124,58', 'none', 'stroke="#b07ad0" stroke-width="2.4"') +
      C(76, 40, 2.4, '#ffd34a', 'stroke="none"') + C(126, 44, 2.4, '#ffd34a', 'stroke="none"') +
      P('M44,98 L56,70 H144 L156,98Z', '#8a5a32') + P('M44,98 H156 V156 H44Z', '#a06a3a') + P('M44,110 H156 M44,144 H156', 'none', 'stroke="#d6ad45" stroke-width="4"') +
      P('M44,98 L36,52 L60,40 L56,70Z', '#8a5a32') + P('M92,114 h16 v16 h-16Z', '#d6ad45') + sh('M120,98 H156 V156 H120Z', .18),
    // Heroes
    odysseus: () => P('M30,20 C90,40 90,130 30,150', 'none', 'stroke="#7a4b28" stroke-width="9"') + L(30, 20, 30, 150, 2, '#efe2bf') +
      L(30, 85, 170, 85, 4) + P('M170,85 L150,75 L156,85 L150,95Z', '#9aa3ad') + P('M38,85 L28,76 M38,85 L28,94 M46,85 L36,76 M46,85 L36,94', 'none', 'stroke="#a8322a" stroke-width="3"') +
      g('translate(140,138)', C(0, 0, 18, '#f2ece0') + P('M0,-20 L5,-5 L20,0 L5,5 L0,20 L-5,5 L-20,0 L-5,-5Z', '#d6ad45')),
    hippolyta: () => g('translate(100,90) rotate(-30)', L(0, -80, 0, 80, 6, '#7a4b28') + P('M0,-70 C24,-80 34,-60 24,-40 C14,-48 6,-48 0,-46Z M0,-70 C-24,-80 -34,-60 -24,-40 C-14,-48 -6,-48 0,-46Z', '#b9c2cc')) +
      P('M50,120 C40,90 60,70 100,70 C140,70 160,90 150,120 C140,110 120,104 100,116 C80,104 60,110 50,120Z', '#a8322a') + P('M60,112 C70,100 86,96 100,106 C114,96 130,100 140,112', 'none', 'stroke="#e8c35a" stroke-width="3"') + C(100, 92, 6, '#e8c35a'),
    atalanta: () => glow(100, 86, 62) + P('M100,40 C104,30 112,26 120,26', 'none', 'stroke="#6b4a2a" stroke-width="4"') + leaf(110, 30, -20, 26, '#6f8a2e') +
      C(78, 100, 30, '#e6b83a') + C(126, 96, 30, '#e6b83a') + C(100, 64, 26, '#f0c84a') + hl('M80,52 C86,44 96,42 104,44 C94,46 86,50 82,58Z', .55) + hl('M56,92 C60,82 68,78 76,78 C68,82 62,88 60,98Z', .45) +
      P('M40,150 C70,140 130,140 160,150', 'none', 'stroke="#efe2bf" stroke-width="4" stroke-dasharray="10 8"'),
    achilles: () => P('M74,150 C60,120 60,86 68,62 C76,38 90,26 100,26 C110,26 124,38 132,62 C140,86 140,120 126,150 L112,150 L112,104 C112,96 106,92 100,92 C94,92 88,96 88,104 L88,150Z', '#d6a04a') +
      P('M94,40 L100,92 L106,40', 'none', 'stroke-width="2"') + P('M74,78 C84,72 94,72 96,84 M126,78 C116,72 106,72 104,84', 'none', 'stroke-width="5"') +
      P('M100,26 C88,8 104,-4 120,4 C140,14 160,30 170,60 C150,46 130,36 104,30Z', '#a8322a') + hl('M76,70 C76,52 84,40 94,34 C86,44 82,56 82,72Z', .45),
    heracles: () => g('translate(110,90) rotate(30)', P('M-10,70 C-12,30 -16,-20 -22,-60 C-14,-76 14,-76 22,-60 C16,-20 12,30 10,70Z', '#8a5a32') + C(-14, -44, 4, '#5a3a1e') + C(10, -30, 4, '#5a3a1e') + C(-4, -10, 4, '#5a3a1e')) +
      g('translate(70,76)', (() => { let s = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += E(Math.cos(a) * 30, Math.sin(a) * 30, 14, 9, '#b07a32', `transform="rotate(${i * 30} ${Math.cos(a) * 30} ${Math.sin(a) * 30})"`); } return s; })() +
        C(0, 0, 28, '#e3b257') + E(-10, -6, 4, 3, INK, 'stroke="none"') + E(10, -6, 4, 3, INK, 'stroke="none"') + P('M-8,8 C-4,4 4,4 8,8 L0,14Z', '#5a3a1e') + P('M0,14 V20 M-8,22 C-4,26 4,26 8,22', 'none', 'stroke-width="2"')),
    perseus: () => g('translate(130,90) rotate(25)', L(0, 0, 0, 74, 6, '#7a4b28') + P('M-6,0 C-8,-40 0,-60 30,-72 C10,-56 6,-36 8,0Z', '#c8d0d8') + P('M-14,0 H18', 'none', 'stroke="#d6ad45" stroke-width="6"')) +
      shieldDisc(70, 92, 50, '#c8dce8', '#9aa3ad') + hl('M44,80 C50,64 64,56 80,56 C66,62 56,70 50,86Z', .6) +
      P('M60,140 C70,130 60,120 70,110 M80,142 C90,132 80,122 90,112', 'none', 'stroke="#4f7a3a" stroke-width="5"'),
    shield: () => shieldDisc(100, 86, 70, '#9aa8b4', '#5d6670') + C(100, 86, 28, '#c8d0d8') + P('M100,62 L118,86 L100,110 L82,86Z', '#d6ad45') + C(100, 86, 6, '#a8322a'),
  };

  // The resources, drawn for the vase style. PALE lines are details cut through the glaze.
  const PALE = '#e3a066';
  Object.assign(ART, {
    olives: () => P('M20,150 C60,120 110,92 182,30', 'none', 'stroke="#6b4a2a" stroke-width="6"') +
      P('M70,116 C80,130 84,142 82,152 M118,82 C112,64 114,50 122,40 M150,56 C164,62 174,74 178,88', 'none', 'stroke="#6b4a2a" stroke-width="3.5"') +
      leaf(36, 140, -70, 40, '#5f7f2e') + leaf(52, 128, 30, 42, '#5f7f2e') + leaf(96, 100, -80, 44, '#5f7f2e') + leaf(110, 92, 20, 40, '#5f7f2e') +
      leaf(140, 66, -60, 40, '#5f7f2e') + leaf(158, 50, 40, 36, '#5f7f2e') + leaf(176, 34, -20, 26, '#5f7f2e') +
      [[82, 156, '#3b2a40'], [126, 36, '#3b2a40'], [180, 92, '#8a2a30'], [68, 104, '#8a2a30'], [150, 108, '#3b2a40']].map(([x, y, c]) =>
        E(x, y, 13, 17, c) + `<path d="M${x - 5},${y - 9} C${x - 8},${y - 3} ${x - 8},${y + 3} ${x - 5},${y + 7}" fill="none" stroke="${PALE}" stroke-width="2"/>`).join('') +
      P('M68,104 L72,86 M150,108 L140,86', 'none', 'stroke="#6b4a2a" stroke-width="2.5"'),
    bronze: () => {
      const ingot = (x, y, s) => g(`translate(${x},${y}) scale(${s})`,
        P('M-60,-26 Q0,-8 60,-26 Q48,0 60,26 Q0,8 -60,26 Q-48,0 -60,-26Z', '#c26a2c') +
        `<path d="M-44,-14 Q0,-2 44,-14 M-44,14 Q0,2 44,14 M-20,-6 L-12,6 M8,-6 L16,6" fill="none" stroke="${PALE}" stroke-width="2"/>`);
      return ingot(100, 132, 1.25) + ingot(96, 92, 1.15) + ingot(104, 54, 1.05) + star(40, 40, 8, '#fff6c8') + star(164, 30, 6, '#fff6c8');
    },
    marble: () => P('M28,150 H172 V162 H28Z', '#7d7468') +
      P('M36,150 V96 H112 V150Z', '#f2efe6') + P('M36,96 L54,82 H130 L112,96Z', '#f2efe6') + P('M112,96 L130,82 V136 L112,150Z', '#ddd6c6') +
      P('M120,150 V66 C120,58 168,58 168,66 V150Z', '#f2efe6') + E(144, 66, 24, 7, '#ddd6c6') +
      P('M128,72 V146 M136,73 V148 M144,73 V148 M152,73 V148 M160,72 V146', 'none', 'stroke-width="1.6"') +
      P('M48,112 L70,104 M60,132 L92,120', 'none', 'stroke-width="1.6"') +
      g('translate(66,58) rotate(-35)', P('M-4,-26 h8 v40 h-8Z', '#7a4b28') + P('M-14,-40 h28 v16 h-28Z', '#5d6670')) +
      g('translate(30,60) rotate(30)', P('M-3,-30 h6 v34 h-6Z', '#7a4b28') + P('M-1.5,4 h3 v14 l-1.5,4 l-1.5,-4Z', '#9aa3ad')),
    silver: () => {
      const coin = (x, y, r) => C(x, y, r + 5, '#9aa3ad') + C(x, y, r, '#e6eaee') +
        g(`translate(${x},${y}) scale(${r / 46})`,
          P('M-16,30 C-26,14 -24,-12 -14,-24 L-18,-36 L-6,-28 C-2,-30 2,-30 6,-28 L18,-36 L14,-24 C24,-12 26,14 16,30Z', INK) +
          C(-8, -14, 7, '#e6eaee', 'stroke="none"') + C(8, -14, 7, '#e6eaee', 'stroke="none"') + C(-8, -14, 3, INK, 'stroke="none"') + C(8, -14, 3, INK, 'stroke="none"') +
          P('M-4,-4 L0,4 L4,-4Z', '#e6eaee', 'stroke="none"') +
          `<path d="M-10,8 l3,3 l3,-3 M2,8 l3,3 l3,-3 M-4,18 l3,3 l3,-3" fill="none" stroke="#e6eaee" stroke-width="1.6"/>` +
          P('M24,-30 C30,-24 32,-16 30,-8', 'none', 'stroke="#5f7f2e" stroke-width="2.5"') + leaf(28, -26, -40, 12, '#5f7f2e') + leaf(31, -14, -10, 12, '#5f7f2e') +
          `<text x="30" y="30" font-family="'Marcellus SC', serif" font-size="15" fill="${INK}" stroke="none">ΑΘΕ</text>`);
      return coin(76, 98, 52) + coin(150, 62, 30) + C(150, 132, 22, '#9aa3ad') + C(150, 128, 22, '#e6eaee') + star(36, 34, 7, '#fff6c8');
    },
    hoplites: () => g('translate(110,92) rotate(32)', L(0, -96, 0, 96, 5) + P('M-7,-92 L0,-114 L7,-92Z', '#9aa3ad') + P('M-4,92 h8 v12 h-8Z', '#9aa3ad')) +
      C(84, 102, 58, '#c99a46') + C(84, 102, 49, '#a8322a') +
      `<path d="M84,70 L92,94 L116,102 L92,110 L84,134 L76,110 L52,102 L76,94Z" fill="#efe3cc"/>` + C(84, 102, 6, '#1b1310') +
      g('translate(138,26) scale(.5)', P('M74,150 C60,120 60,86 68,62 C76,38 90,26 100,26 C110,26 124,38 132,62 C140,86 140,120 126,150 L112,150 L112,104 C112,96 106,92 100,92 C94,92 88,96 88,104 L88,150Z', '#d6a04a') +
        `<path d="M74,78 C84,72 94,72 96,84 M126,78 C116,72 106,72 104,84" fill="none" stroke="${PALE}" stroke-width="5"/>` +
        P('M100,26 C88,8 104,-4 120,4 C140,14 160,30 170,60 C150,46 130,36 104,30Z', '#a8322a')),
  });

  // ---- the painting pass: Aegean palette ----
  // Oracle deck: lapis-blue figures on veined marble, details drawn through in pale ice,
  // light colours become pale gold and strong reds become gold leaf.
  // Agora deck: the same drawing reversed, marble-white figures on lapis with blue relief lines.
  const NAVY = '#16386f', BLUE = '#1f4e9c', MARBLE = '#fbf8f1', WHITE = '#ffffff', GOLD = '#d4a62a', GOLD_D = '#a87a12', PALEGOLD = '#f0d48a',
    ICE = '#dfeafa', TABLET = '#f1f6fc', FIGW = '#f7f3ea';
  const fxGone = /<(path|circle|ellipse)[^>]*data-k="fx"[^>]*\/>/g;
  const panelGone = /<path d="M0,0 H200 V170 H0Z"[^>]*\/>/g;
  function hexRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  function tone(col) {
    if (!col || col === 'none' || col[0] !== '#') return null;
    const [r, gg, b] = hexRgb(col), mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2;
    const sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
    let hue = 0;
    if (mx !== mn) hue = mx === r ? ((gg - b) / (mx - mn)) % 6 : mx === gg ? (b - r) / (mx - mn) + 2 : (r - gg) / (mx - mn) + 4;
    hue = (hue * 60 + 360) % 360;
    if (col.toLowerCase() === INK) return 'ink';
    if (col.toLowerCase() === PALE) return 'pale';
    if (l > 0.8) return 'white';
    if ((hue > 335 || hue < 14) && sat > 0.45 && l > 0.25 && l < 0.62) return 'red';
    return 'fig';
  }
  function vase(art, red) {
    const fig = red ? FIGW : BLUE, line = red ? BLUE : ICE;
    const pick = (t) => t === 'white' ? PALEGOLD : t === 'red' ? GOLD : t === 'ink' ? (red ? BLUE : NAVY) : t === 'pale' ? line : fig;
    // see-through tints (water, haze) have no place in a two-material picture
    const tint = /<(path|circle|ellipse)(?=[^>]*stroke="none")[^>]*opacity="(0?\.[0-5]\d*)"[^>]*\/>/g;
    return art.replace(fxGone, '').replace(panelGone, '').replace(tint, '').replace(/<(path|circle|ellipse)([^>]*)\/>/g, (m, tag, attrs) => {
      const fill = (attrs.match(/ fill="([^"]*)"/) || [])[1];
      const stroke = (attrs.match(/ stroke="([^"]*)"/) || [])[1];
      let a = attrs.replace(/ fill="[^"]*"/, '').replace(/ stroke="[^"]*"/, '').replace(/ opacity="[^"]*"/, '');
      if (!fill || fill === 'none') {
        const t = tone(stroke || INK);
        // fine dark lines are details: cut through the glaze (black-figure) or drawn as relief lines (red-figure)
        const w = parseFloat((attrs.match(/stroke-width="([^"]*)"/) || [])[1] || '3');
        const detail = (t === 'ink' || t === 'fig') && w <= 2.5;
        return `<${tag}${a} fill="none" stroke="${detail ? line : pick(t)}"/>`;
      }
      const t = tone(fill);
      const out = stroke === 'none' ? 'none' : line;
      if (stroke !== 'none') a = a.replace(/ stroke-width="[^"]*"/, '') + ` stroke-width="${red ? 1.6 : 1.4}"`;
      return `<${tag}${a} fill="${pick(t)}" stroke="${out}"/>`;
    });
  }

  // Accent per family, and per resource: the only hue a card is allowed besides marble, lapis and gold.
  const ACCENT = {
    raid: '#c0392b', god: '#7b4fb0', reaction: '#2a86c8', hidden: '#4f6178', event: '#3949ab', wild: '#d4a62a',
    fleet: '#1f6fc2', polis: '#8e9aae', treasure: '#e0a81e', blessing: '#13a3a0', chaos: '#b0306a', hero: '#c98a2b', shield: '#7c8b9c',
  };
  const RES_ACCENT = { olives: '#6f9a2e', bronze: '#d2742c', silver: '#7f93ab', marble: '#d8d2c4', hoplites: '#c0392b' };

  function meander(x, y, w, col) {
    let d = `M${x},${y + 14} H${x + w} M${x},${y} H${x + w}`;
    for (let k = x + 3; k + 15 <= x + w; k += 17) d += ` M${k},${y + 14} V${y + 2} H${k + 13} V${y + 10} H${k + 5} V${y + 6} H${k + 9}`;
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="1.8"/>`;
  }
  function tongueRow(x, y, w, n) {
    const u = w / n;
    let out = '';
    for (let i = 0; i < n; i++) {
      const cx = x + i * u + u / 2;
      out += `<path d="M${cx - u * .38},${y} A${u * .38},${u * .5} 0 0 0 ${cx + u * .38},${y} Z" fill="${i % 2 ? GOLD : BLUE}" stroke="none"/>`;
    }
    return out;
  }
  // Text is wrapped by an estimate of Alegreya Sans' average width.
  function wrap(text, size, width) {
    const max = Math.floor(width / (size * 0.45));
    const lines = [];
    let cur = '';
    text.split(' ').forEach(w => {
      if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }
  const RES_MARK = {
    olives: E(0, 0, 4, 5.5, '#c6d77a', 'stroke="none"'),
    bronze: P('M-6,3 L-4,-3 H4 L6,3Z', '#f2b27a', 'stroke="none"'),
    silver: C(0, 0, 5, '#dfe7ef', 'stroke="none"'),
    marble: P('M-5,-5 H5 V5 H-5Z', '#8a8274', 'stroke="none"'),
    hoplites: P('M0,-7 L2,-2 V7 H-2 V-2Z', '#f2d0c8', 'stroke="none"'),
  };
  function gem(x, y, res) {
    const fill = res ? RES_ACCENT[res] : GOLD;
    const mark = res ? RES_MARK[res] : star(0, 0, 6, '#fff');
    return g(`translate(${x},${y})`, `<circle r="11" fill="${fill}" stroke="${NAVY}" stroke-width="2"/><circle r="12.6" fill="none" stroke="${WHITE}" stroke-width="1.2"/>` + mark);
  }
  const CAT_MARK = {
    fleet: P('M-8,2 H8 L5,6 H-5Z M0,2 V-8 L6,0 H0', WHITE, 'stroke="none"'),
    polis: P('M-8,-5 L0,-9 L8,-5Z M-6,-4 h2 v9 h-2Z M-1,-4 h2 v9 h-2Z M4,-4 h2 v9 h-2Z M-8,5 h16 v2 h-16Z', WHITE, 'stroke="none"'),
    treasure: C(0, 0, 7, WHITE, 'stroke="none"') + C(0, 0, 3.5, ACCENT.treasure, 'stroke="none"'),
  };

  // The whole face: a marble card edged in gold, a lapis name band, a frieze of tongues,
  // the picture, a pale tablet for the rules and a gold key on lapis at the foot.
  function face(key, d, figure) {
    const fam = d.type === 'hero' ? 'hero' : d.type === 'shield' ? 'shield' : family(d);
    const accent = d.res ? RES_ACCENT[d.res] : ACCENT[fam];
    const redFig = figure ? figure === 'red' : d.deck === 'agora';
    const name = d.name;
    const nameSize = Math.min(17, Math.max(10, 158 / (name.length * 0.74)));
    const nameFit = name.length * nameSize * 0.74 > 162 ? ' textLength="162" lengthAdjust="spacingAndGlyphs"' : '';
    const draw = ART[key];
    const art = draw ? vase(draw(), redFig) : '';
    const label = d.type === 'hero' ? 'Hero' : d.type === 'shield' ? 'Shield' : d.res ? 'Resource' : typeLabel(d);
    const text = d.type === 'hero' || d.type === 'shield' ? d.text : rulesText(d);
    const fs = text.length <= 12 ? 19 : text.length <= 40 ? 15.5 : text.length <= 70 ? 14 : text.length <= 100 ? 12.6 : 11.4;
    const lines = wrap(text, fs, 200);
    const lh = fs * 1.14, top = 283 - ((lines.length - 1) * lh) / 2 + fs * .35;
    let extras = '';
    if (d.cat) extras += g('translate(36,82)', `<circle r="13" fill="${ACCENT[d.cat]}" stroke="${NAVY}" stroke-width="2"/><circle r="15" fill="none" stroke="${WHITE}" stroke-width="1.2"/>` + CAT_MARK[d.cat]);
    if (d.pts) extras += g('translate(216,82)', `<circle r="16" fill="${GOLD}" stroke="${NAVY}" stroke-width="2"/><circle r="12.5" fill="none" stroke="#fff3c4" stroke-width="1.4"/><text y="6.5" text-anchor="middle" font-family="'Marcellus SC', serif" font-size="19" fill="${NAVY}">${d.pts}</text>`);
    if (d.cost) {
      const list = [];
      Object.keys(d.cost).forEach(r => { for (let i = 0; i < d.cost[r]; i++) list.push(r); });
      list.forEach((r, i) => { extras += gem(126 - (list.length - 1) * 13 + i * 26, 214, r); });
    } else if (d.anyCost) {
      for (let i = 0; i < d.anyCost; i++) extras += gem(126 - (d.anyCost - 1) * 13 + i * 26, 214, null);
    }
    const ground = redFig ? 'assets/lapis.png' : 'assets/marble.png';
    return `<svg class="card-face" viewBox="0 0 252 352" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(name)}">
<rect x="0" y="0" width="252" height="352" rx="14" fill="${MARBLE}"/>
<rect x="2" y="2" width="248" height="348" rx="12.5" fill="none" stroke="${GOLD}" stroke-width="4"/>
<rect x="8" y="8" width="236" height="336" rx="9" fill="none" stroke="${BLUE}" stroke-width="1"/>
<rect x="16" y="14" width="220" height="32" rx="4" fill="${BLUE}"/>
<rect x="16" y="14" width="220" height="14" rx="4" fill="#ffffff" opacity=".1"/>
<rect x="16" y="14" width="220" height="32" rx="4" fill="none" stroke="${GOLD}" stroke-width="1.6"/>
<path d="M25,30 l3,-3 l3,3 l-3,3Z M221,30 l3,-3 l3,3 l-3,3Z" fill="${GOLD}"/>
<text x="126" y="${30 + nameSize * .34}" text-anchor="middle" font-family="'Marcellus SC', serif" font-size="${nameSize.toFixed(1)}" letter-spacing=".1em" fill="${WHITE}"${nameFit}>${esc(name.toUpperCase())}</text>
${tongueRow(18, 50, 216, 18)}
<rect x="16" y="62" width="220" height="170" fill="${redFig ? BLUE : MARBLE}"/>
<image href="${ground}" x="16" y="62" width="220" height="170" preserveAspectRatio="xMidYMid slice"/>
<svg x="26" y="62" width="200" height="170" viewBox="0 0 200 170" overflow="hidden"><g stroke="${NAVY}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${art}</g></svg>
<rect x="16" y="62" width="220" height="170" fill="none" stroke="${accent}" stroke-width="2.6"/>
<rect x="20.5" y="66.5" width="211" height="161" fill="none" stroke="${GOLD}" stroke-width=".9" opacity=".8"/>
${extras}
<rect x="16" y="240" width="220" height="78" rx="4" fill="${TABLET}" stroke="${GOLD}" stroke-width="1.2"/>
<rect x="66" y="225" width="120" height="16" rx="8" fill="${accent}" stroke="${WHITE}" stroke-width="1.6"/>
<text x="126" y="236.2" text-anchor="middle" font-family="'Marcellus SC', serif" font-size="9.5" letter-spacing=".14em" fill="${d.res === 'marble' ? NAVY : WHITE}">${esc(label.toUpperCase())}</text>
<text font-family="'Alegreya Sans', sans-serif" font-weight="500" font-size="${fs}" fill="${NAVY}" text-anchor="middle">${lines.map((l, i) => `<tspan x="126" y="${(top + i * lh).toFixed(1)}">${esc(l)}</tspan>`).join('')}</text>
<rect x="16" y="322" width="220" height="20" rx="3" fill="${BLUE}"/>
${meander(20, 325, 212, GOLD)}
</svg>`;
  }

  R.CARD_ART = ART;
  // figure: 'black' or 'red' forces a technique; by default the Oracle deck is black-figure and the Agora red-figure.
  // The full drawing of a face, built once per card and technique.
  const built = new Map();
  function fullFace(key, figure) {
    const id = key + (figure ? '-' + figure : '');
    if (!built.has(id)) {
      let svg;
      if (R.HEROES && R.HEROES[key]) svg = face(key, { name: R.HEROES[key].name, type: 'hero', text: R.HEROES[key].text });
      else if (key === 'shield') svg = face('shield', { name: 'Shield', type: 'shield', text: 'Used in raids. If the raider picks a Shield, the raid fails.' });
      else svg = face(key, R.CARDS[key], figure);
      built.set(id, svg);
    }
    return built.get(id);
  }
  // In a page, each face is drawn once into a hidden sprite and every card on screen just points at it
  // with <use>, so re-rendering the table only creates a few tiny elements per card.
  let sprite = null;
  const placed = new Set();
  function symbolId(key, figure) {
    const id = 'cf-' + key + (figure ? '-' + figure : '');
    if (!placed.has(id)) {
      if (!sprite) {
        sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        sprite.setAttribute('aria-hidden', 'true');
        sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        document.body.appendChild(sprite);
      }
      const inner = fullFace(key, figure).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      sprite.insertAdjacentHTML('beforeend', `<symbol id="${id}" viewBox="0 0 252 352">${inner}</symbol>`);
      placed.add(id);
    }
    return id;
  }
  // figure: 'black' or 'red' forces a technique; by default the Oracle deck is black-figure and the Agora red-figure.
  R.cardFace = function (key, figure) {
    if (typeof document === 'undefined' || !document.body) return fullFace(key, figure);
    const name = R.HEROES && R.HEROES[key] ? R.HEROES[key].name : key === 'shield' ? 'Shield' : R.CARDS[key].name;
    return `<svg class="card-face" viewBox="0 0 252 352" role="img" aria-label="${esc(name)}"><use href="#${symbolId(key, figure)}"/></svg>`;
  };
  // The complete standalone drawing, for exporting a face outside the game page.
  R.cardFaceSVG = fullFace;
})(window.ROO);
