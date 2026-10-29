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

  // An icon from js/icons.js placed as a silhouette in the scene (icons are 512×512).
  // The animated class goes on an inner group so CSS transforms don't replace the positioning one.
  const glyph = (key, x, y, size, fill, cls) =>
    `<g transform="translate(${x},${y}) scale(${size / 512})" fill="${fill}"><g class="${cls || ''}">${(R.ICONS[key] || []).map(d => `<path d="${d}"/>`).join('')}</g></g>`;

  function stars() {
    let s = '';
    for (let k = 0; k < 90; k++) {
      const x = rnd() * 1600, y = rnd() * 380, r = 0.6 + rnd() * 1.6;
      s += `<circle class="star" style="animation-delay:${(rnd() * 4).toFixed(2)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" opacity="${(0.3 + rnd() * 0.7 * (1 - y / 420)).toFixed(2)}"/>`;
    }
    return `<g fill="#fff6dc">${s}</g>`;
  }

  // Long sunset clouds lit from below.
  function clouds() {
    const band = (x, y, w, h, fill, dur) => `<g class="drift" style="animation-duration:${dur}s">
      <ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${fill}"/>
      <ellipse cx="${x + w * 0.35}" cy="${y - h * 0.5}" rx="${w * 0.5}" ry="${h * 0.8}" fill="${fill}"/>
      <ellipse cx="${x - w * 0.4}" cy="${y + h * 0.15}" rx="${w * 0.45}" ry="${h * 0.6}" fill="${fill}"/></g>`;
    return band(300, 430, 210, 16, 'url(#cloudLit)', 90) + band(1250, 400, 260, 18, 'url(#cloudLit)', 120)
      + band(820, 330, 160, 11, 'url(#cloudLit)', 140) + band(1450, 520, 170, 10, '#c9706a', 100) + band(120, 540, 150, 9, '#c9706a', 110);
  }

  function seaGlints() {
    let s = '';
    for (let k = 0; k < 46; k++) {
      const y = 650 + Math.pow(rnd(), 1.4) * 330, spread = 40 + (y - 640) * 0.9;
      const x = 800 + (rnd() - 0.5) * spread * 2, w = 10 + rnd() * (30 + (y - 640) * 0.25);
      s += `<rect class="glint" style="animation-delay:${(rnd() * 3).toFixed(2)}s" x="${(x - w / 2).toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(1.5 + (y - 640) / 120).toFixed(1)}" rx="1" fill="#ffd79a"/>`;
    }
    for (let k = 0; k < 30; k++) {
      const y = 680 + rnd() * 300, x = rnd() * 1600, w = 30 + rnd() * 90;
      s += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="1.5" fill="#9fb7e6" opacity="${(0.08 + rnd() * 0.12).toFixed(2)}"/>`;
    }
    return s;
  }

  function birds() {
    const b = (x, y, s) => `<path transform="translate(${x},${y}) scale(${s})" d="M-10,0 Q-5,-6 0,0 Q5,-6 10,0" fill="none" stroke="#1d1430" stroke-width="2"/>`;
    return `<g class="birds">${b(980, 300, 1.2)}${b(1010, 285, 0.9)}${b(1040, 305, 1)}${b(1000, 320, 0.7)}</g>`;
  }

  // Fluted column framing the scene, lit warm on one side.
  function column(x, w, flip) {
    let flutes = '';
    for (let k = 1; k < 7; k++) flutes += `<rect x="${x + (w * k) / 7 - 2}" y="70" width="3" height="930" fill="#000" opacity=".18"/>`;
    return `<g><rect x="${x}" y="70" width="${w}" height="930" fill="url(#${flip ? 'colR' : 'colL'})"/>${flutes}
      <rect x="${x - 18}" y="40" width="${w + 36}" height="34" rx="4" fill="url(#${flip ? 'colR' : 'colL'})"/>
      <rect x="${x - 26}" y="0" width="${w + 52}" height="44" fill="#1b1430"/>
      <path d="M${x - 26},44 h${w + 52}" stroke="#e9a35f" stroke-width="2" opacity=".5"/></g>`;
  }

  R.menuScene = function () {
    return `<svg class="scene-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#070f2a"/><stop offset=".3" stop-color="#1c2c63"/><stop offset=".48" stop-color="#5a3f7c"/>
          <stop offset=".58" stop-color="#c06a6a"/><stop offset=".64" stop-color="#f4a25e"/><stop offset=".66" stop-color="#ffd38a"/></linearGradient>
        <radialGradient id="sunGlow" cx="800" cy="650" r="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffe6a8" stop-opacity=".95"/><stop offset=".18" stop-color="#ffb46a" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a5a" stop-opacity="0"/></radialGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d98a6a"/><stop offset=".12" stop-color="#6a5a8a"/><stop offset=".4" stop-color="#253c74"/><stop offset="1" stop-color="#0a1633"/></linearGradient>
        <linearGradient id="cloudLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d4c86"/><stop offset="1" stop-color="#f2a070"/></linearGradient>
        <linearGradient id="colL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1f3c"/><stop offset=".7" stop-color="#4a3550"/><stop offset="1" stop-color="#c98a62"/></linearGradient>
        <linearGradient id="colR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#2a1f3c"/><stop offset=".7" stop-color="#4a3550"/><stop offset="1" stop-color="#c98a62"/></linearGradient>
        <linearGradient id="cliffFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b3463"/><stop offset="1" stop-color="#2a2048"/></linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#sky)"/>
      ${stars()}
      <rect width="1600" height="1000" fill="url(#sunGlow)"/>
      <circle cx="800" cy="650" r="88" fill="#ffe7b0"/>
      ${clouds()}
      <path d="M560,652 L640,600 L700,618 L780,575 L860,612 L930,596 L1020,652Z" fill="url(#cliffFar)" opacity=".85"/>
      <path d="M1080,652 L1150,618 L1210,630 L1290,598 L1380,652Z" fill="url(#cliffFar)" opacity=".7"/>
      <rect y="650" width="1600" height="350" fill="url(#sea)"/>
      <rect x="0" y="648" width="1600" height="3" fill="#ffd9a0" opacity=".6"/>
      ${seaGlints()}
      ${glyph('trireme', 935, 612, 46, '#1d1430', 'bob')}${glyph('bireme', 610, 625, 30, '#2a1f45', 'bob slow')}${glyph('armada', 1120, 628, 26, '#2a1f45', 'bob')}
      ${birds()}
      <path d="M150,1000 L150,560 C190,520 250,505 320,512 C380,518 420,540 455,580 L500,650 C520,690 540,760 560,1000Z" fill="#160f28"/>
      <path d="M455,580 L500,650 C520,690 540,760 560,1000 L520,1000 C505,820 480,700 455,580Z" fill="#2a1d3d"/>
      ${glyph('temple', 195, 380, 180, '#160f28')}
      ${glyph('column', 410, 470, 70, '#160f28')}
      <path d="M1600,1000 L1600,620 C1540,600 1470,610 1420,640 C1380,665 1360,700 1340,760 L1320,1000Z" fill="#160f28"/>
      ${glyph('column', 1418, 538, 96, '#160f28')}${glyph('column', 1500, 560, 74, '#160f28')}
      ${column(0, 120, false)}${column(1480, 120, true)}
      <rect y="930" width="1600" height="70" fill="#120c22"/><rect y="928" width="1600" height="3" fill="#e9a35f" opacity=".45"/>
    </svg>`;
  };
})(window.ROO);
