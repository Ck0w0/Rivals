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
    return '';
  }

  // Bright fair-weather clouds drifting over the sea.
  function clouds() {
    const band = (x, y, w, h, fill, dur) => `<g class="drift" style="animation-duration:${dur}s">
      <ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${fill}"/>
      <ellipse cx="${x + w * 0.35}" cy="${y - h * 0.5}" rx="${w * 0.5}" ry="${h * 0.8}" fill="${fill}"/>
      <ellipse cx="${x - w * 0.4}" cy="${y + h * 0.15}" rx="${w * 0.45}" ry="${h * 0.6}" fill="${fill}"/></g>`;
    // Kept clear of the temple roof on the left headland.
    return band(560, 300, 190, 13, 'url(#cloudLit)', 90) + band(1180, 400, 240, 16, 'url(#cloudLit)', 120)
      + band(860, 230, 140, 9, 'url(#cloudLit)', 140) + band(1080, 540, 150, 8, '#ffffff', 100) + band(620, 560, 120, 7, '#ffffff', 110);
  }

  function seaGlints() {
    let s = '';
    // The sun's reflection: thin streaks that widen and fade towards the viewer.
    for (let k = 0; k < 60; k++) {
      const d = Math.pow(rnd(), 1.8), y = 654 + d * 220, spread = 30 + d * 160;
      const x = 1180 + (rnd() - 0.5) * spread * 2, w = 8 + rnd() * (20 + d * 50);
      s += `<rect class="glint" style="animation-delay:${(rnd() * 3).toFixed(2)}s" x="${(x - w / 2).toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="1.6" rx=".8" fill="#ffffff" opacity="${(0.9 - d * 0.55).toFixed(2)}"/>`;
    }
    for (let k = 0; k < 30; k++) {
      const y = 680 + rnd() * 300, x = rnd() * 1600, w = 30 + rnd() * 90;
      s += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="1.5" fill="#ffffff" opacity="${(0.15 + rnd() * 0.2).toFixed(2)}"/>`;
    }
    return s;
  }

  function birds() {
    const b = (x, y, s) => `<path transform="translate(${x},${y}) scale(${s})" d="M-10,0 Q-5,-6 0,0 Q5,-6 10,0" fill="none" stroke="#16386f" stroke-width="2"/>`;
    return `<g class="birds">${b(980, 300, 1.2)}${b(1010, 285, 0.9)}${b(1040, 305, 1)}${b(1000, 320, 0.7)}</g>`;
  }

  // Fluted column framing the scene, lit warm on one side.
  function column(x, w, flip) {
    let flutes = '';
    for (let k = 1; k < 7; k++) flutes += `<rect x="${x + (w * k) / 7 - 2}" y="70" width="3" height="930" fill="#8a9bb3" opacity=".22"/>`;
    return `<g><rect x="${x}" y="70" width="${w}" height="930" fill="url(#${flip ? 'colR' : 'colL'})"/>${flutes}
      <rect x="${x - 18}" y="40" width="${w + 36}" height="34" rx="4" fill="url(#${flip ? 'colR' : 'colL'})"/>
      <rect x="${x - 26}" y="0" width="${w + 52}" height="44" fill="#1f4e9c"/>
      <path d="M${x - 26},44 h${w + 52}" stroke="#d4a62a" stroke-width="3"/></g>`;
  }

  function cypress(x, y, h) {
    return `<path d="M${x},${y} C${x - h * 0.17},${y - h * 0.35} ${x - h * 0.09},${y - h * 0.8} ${x},${y - h} C${x + h * 0.09},${y - h * 0.8} ${x + h * 0.17},${y - h * 0.35} ${x},${y}Z"/>`;
  }

  // A rocky headland with a temple on its flat top, sloping down into the sea.
  function leftHeadland() {
    const base = 522; // the plateau the temple stands on
    let cols = '';
    for (let k = 0; k < 6; k++) cols += `<rect x="${222 + k * 27}" y="${base - 102}" width="13" height="80"/><rect x="${219 + k * 27}" y="${base - 106}" width="19" height="5"/>`;
    return `<g fill="#d9c9a6">
      <path d="M100,1000 L100,560 L135,540 L168,${base} L400,${base} L424,534 L440,556 L468,570 L486,596 L512,606 L534,634 L566,650 L590,676 L626,690 L660,716 L690,760 L712,1000Z"/>
      <path d="M400,${base} L424,534 L440,556 L468,570 L486,596 L512,606 L534,634 L566,650 L590,676 L626,690 L660,716 L690,760 L712,1000 L640,1000 L610,780 L560,700 L500,640 L450,590 L410,545Z" fill="#bfa982"/>
      <path d="M168,${base} L400,${base} L424,534 L440,556 L468,570 L486,596 L512,606 L534,634 L566,650 L590,676 L626,690 L660,716 L690,760" fill="none" stroke="#ffffff" stroke-width="2.5" opacity=".7"/>
      <g fill="#fbf8f1" stroke="#c9b48f" stroke-width="1"><rect x="196" y="${base - 14}" width="188" height="14"/><rect x="205" y="${base - 22}" width="170" height="9"/>
      ${cols}
      <rect x="205" y="${base - 124}" width="170" height="18"/>
      <path d="M198,${base - 124} L290,${base - 162} L382,${base - 124}Z"/></g>
      <path d="M290,${base - 162} L382,${base - 124} L376,${base - 124} L290,${base - 156}Z" fill="#1f4e9c" opacity=".25"/>
      <g fill="#2f5d3a">${cypress(150, base + 22, 74)}${cypress(418, base + 16, 62)}${cypress(452, 572, 48)}${cypress(500, 606, 40)}</g>
    </g>`;
  }

  // A smaller cliff on the right with ruined columns still standing on it.
  function rightHeadland() {
    const col = (x, top, ground) => `<rect x="${x}" y="${top}" width="16" height="${ground - top}"/><rect x="${x - 4}" y="${top - 6}" width="24" height="7"/>`;
    return `<g fill="#d9c9a6">
      <path d="M1600,1000 L1600,596 L1440,594 L1400,600 L1372,614 L1346,636 L1322,664 L1304,700 L1290,760 L1280,1000Z"/>
      <path d="M1372,614 L1346,636 L1322,664 L1304,700 L1290,760 L1280,1000 L1330,1000 L1336,800 L1350,710 L1372,650Z" fill="#bfa982"/>
      <path d="M1600,596 L1440,594 L1400,600 L1372,614 L1346,636 L1322,664 L1304,700 L1290,760" fill="none" stroke="#ffffff" stroke-width="2.5" opacity=".7"/>
      <g fill="#fbf8f1" stroke="#c9b48f" stroke-width="1">${col(1404, 510, 599)}${col(1436, 540, 595)}${col(1464, 486, 596)}
      <rect x="1398" y="496" width="90" height="13"/></g>
      <path d="M1378,612 l30,-10 l8,6 l-30,10Z"/>
      <g fill="#2f5d3a">${cypress(1356, 628, 58)}${cypress(1386, 606, 44)}</g>
    </g>`;
  }

  R.menuScene = function () {
    return `<svg class="scene-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3f97e2"/><stop offset=".35" stop-color="#7dc0f0"/><stop offset=".58" stop-color="#c9e6fa"/><stop offset=".66" stop-color="#f2f9fe"/></linearGradient>
        <radialGradient id="sunGlow" cx="1180" cy="190" r="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#fffbe8" stop-opacity=".95"/><stop offset=".2" stop-color="#ffeeb0" stop-opacity=".45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6cc3ea"/><stop offset=".15" stop-color="#2f8fd6"/><stop offset=".5" stop-color="#1a62b4"/><stop offset="1" stop-color="#0e3f86"/></linearGradient>
        <linearGradient id="cloudLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e2eef9"/></linearGradient>
        <linearGradient id="colL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9d2c4"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e3d6"/></linearGradient>
        <linearGradient id="colR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#d9d2c4"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e3d6"/></linearGradient>
        <linearGradient id="cliffFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb0cf"/><stop offset="1" stop-color="#6f93b8"/></linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#sky)"/>
      ${stars()}
      <rect width="1600" height="1000" fill="url(#sunGlow)"/>
      <circle cx="1180" cy="190" r="64" fill="#fffbea"/><circle cx="1180" cy="190" r="78" fill="#fff6cc" opacity=".35"/>
      ${clouds()}
      <path d="M560,652 L640,600 L700,618 L780,575 L860,612 L930,596 L1020,652Z" fill="url(#cliffFar)" opacity=".85"/>
      <path d="M1080,652 L1150,618 L1210,630 L1290,598 L1380,652Z" fill="url(#cliffFar)" opacity=".7"/>
      <rect y="650" width="1600" height="350" fill="url(#sea)"/>
      <rect x="0" y="648" width="1600" height="3" fill="#ffffff" opacity=".8"/>
      ${seaGlints()}
      ${glyph('trireme', 935, 612, 46, '#16386f', 'bob')}${glyph('bireme', 610, 625, 30, '#1f4e9c', 'bob slow')}${glyph('armada', 1120, 628, 26, '#1f4e9c', 'bob')}
      ${birds()}
      ${leftHeadland()}${rightHeadland()}
      ${column(0, 120, false)}${column(1480, 120, true)}
      <rect y="930" width="1600" height="70" fill="#1f4e9c"/><rect y="926" width="1600" height="4" fill="#d4a62a"/>
    </svg>`;
  };
})(window.ROO);
