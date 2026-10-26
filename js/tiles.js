// The squares of the maps, in pixel art: grounds and roads, the masses of cliff, forest, cave rock and palace wall
// (a top and a front face), water, lava, cloud and their shores, bridges, the things that stand alone — trees of many
// kinds, rocks, bamboo, coral, pillars, braziers — the small things underfoot, the buildings met along the road and
// the walking figures. Everything is drawn once per palette and kept.
import { rng, hash } from './util.js';
import { grid, OUT, mixC, dk, lt } from './px.js';
import { CAST } from './data/cast.js';

const C = new Map();
const keep = (key, f) => { if (!C.has(key)) C.set(key, f()); return C.get(key); };
const speck = (G, R, n, cols, y0 = 0, y1 = 16) => { for (let i = 0; i < n; i++) G.set(R.int(0, 15), R.int(y0, y1 - 1), cols[R.int(0, cols.length - 1)]); };

// ---------------------------------------------------------------- grounds (16 x 16, four of each)
export function floor(P, v) {
  return keep('f' + P.key + v, () => {
    const G = grid(16, 16), R = rng(hash(P.key) + v * 77), k = P.ground, b = v % 2 ? P.g2 : P.g1;
    G.rect(0, 0, 16, 16, b);
    if (k === 'stone' || k === 'jade' || k === 'gold') {
      const line = k === 'jade' ? '#e4dcc0' : dk(b, 0.18);
      for (let i = 0; i < 16; i++) { G.set(i, 15, line); G.set(v % 2 ? 7 : 15, i, line); if (i < 15) G.set(i, 7, dk(b, 0.1)); }
      G.set(1, 1, lt(b, 0.3)); G.set(2, 1, lt(b, 0.3)); G.set(9, 9, lt(b, 0.3));
      if (v === 3) speck(G, R, 3, [dk(b, 0.08)]); if (k === 'jade' && v === 2) { G.rect(3, 3, 2, 2, '#e8c860'); G.rect(11, 11, 2, 2, '#a8c8e8'); }
      return G.canvas();
    }
    speck(G, R, 22, [dk(b, 0.1), lt(b, 0.1)]);
    if (k === 'grass') { speck(G, R, 8, [dk(b, 0.18)]); if (v >= 2) for (let i = 0; i < 3; i++) { const x = R.int(1, 13), y = R.int(3, 14); G.set(x, y, dk(b, 0.28)); G.set(x + 1, y - 1, dk(b, 0.22)); G.set(x + 2, y, dk(b, 0.28)); } }
    if (k === 'sand' || k === 'seabed') { for (let i = 0; i < 2; i++) { const y = R.int(2, 13), x = R.int(0, 8); for (let j = 0; j < 6; j++) G.set(x + j, y + (j > 2 ? 1 : 0), lt(b, 0.25)); } }
    if (k === 'snow') speck(G, R, 6, ['#ffffff', '#c8d8ec']);
    if (k === 'cave' || k === 'hell' || k === 'ash') { for (let i = 0; i < 3; i++) { const x = R.int(1, 13), y = R.int(1, 13); G.set(x, y, dk(b, 0.3)); G.set(x + 1, y, dk(b, 0.2)); G.set(x, y - 1, lt(b, 0.15)); } if (k === 'ash' && v === 3) G.line(2, 4, 9, 11, '#e8602a'); }
    if (k === 'mud') { G.ell(R.int(4, 11), R.int(4, 11), 3, 1.6, dk(b, 0.18), { out: false, shade: false }); }
    return G.canvas();
  });
}
// a road or path, its edges drawn where it meets the ground
export function road(P, v) {
  return keep('r' + P.key + v, () => {
    const G = grid(16, 16), R = rng(hash(P.key) + v * 31), r = P.road, k = P.roadK;
    G.rect(0, 0, 16, 16, r);
    if (k === 'carpet') { G.rect(0, 0, 16, 16, r); for (let i = 0; i < 16; i += 4) for (let j = 0; j < 16; j += 4) G.set(i + 1, j + 1, dk(r, 0.2)); }
    else if (k === 'slab' || k === 'jade') { const l = dk(r, 0.16); for (let i = 0; i < 16; i++) { G.set(i, 7, l); G.set(i, 15, l); G.set(v % 2 ? 5 : 11, Math.floor(i / 2), l); G.set(v % 2 ? 12 : 3, 8 + Math.floor(i / 2), l); } }
    else { speck(G, R, 16, [dk(r, 0.1), lt(r, 0.12)]); for (let i = 0; i < 3; i++) { const x = R.int(1, 14), y = R.int(1, 14); G.set(x, y, dk(r, 0.3)); G.set(x, y - 1, lt(r, 0.3)); } }
    return G.canvas();
  });
}

// ---------------------------------------------------------------- masses: the top seen from above, the face in front
export function massTop(P, v) {
  return keep('mt' + P.key + v, () => {
    const G = grid(16, 16), R = rng(hash(P.key) ^ (v * 999)), k = P.mass, c = P.m1, d = P.m2;
    G.rect(0, 0, 16, 16, c);
    if (k === 'canopy' || k === 'bramble') {
      G.rect(0, 0, 16, 16, dk(c, 0.25));
      for (const [x, y, r] of [[3, 4, 4.2], [11, 3, 4], [7, 11, 4.4], [15, 11, 3.6], [0, 12, 3.4]]) G.shape((px, py) => Math.hypot(px - x - (v % 2), py - y) < r, (px, py) => (py < y - r * 0.4 ? lt(c, 0.2) : c), { out: dk(c, 0.45) });
      if (P.fruit) for (let i = 0; i < 3; i++) G.set(R.int(1, 14), R.int(1, 14), P.fruit);
      if (k === 'bramble') for (let i = 0; i < 6; i++) G.set(R.int(0, 15), R.int(0, 15), '#c8b070');
    } else if (k === 'redwall' || k === 'yellowwall' || k === 'whitewall') {
      // roof tiles in rows
      G.rect(0, 0, 16, 16, P.roof); for (let y = 0; y < 16; y += 4) { for (let x = 0; x < 16; x++) G.set(x, y + 3, dk(P.roof, 0.3)); for (let x = (y / 4) % 2 ? 0 : 2; x < 16; x += 4) G.set(x, y + 1, lt(P.roof, 0.25)); }
    } else {
      speck(G, R, 26, [d, lt(c, 0.12)]);
      for (let i = 0; i < 2; i++) { const x = R.int(1, 12), y = R.int(2, 13); G.line(x, y, x + R.int(2, 4), y + R.int(-1, 2), dk(c, 0.3)); }
      if (k === 'cliff') for (let i = 0; i < 2; i++) { const x = R.int(2, 12) + (v % 2) * 2, y = R.int(3, 12), r = R.int(2, 3); G.shape((px, py) => Math.hypot(px - x, (py - y) * 1.2) < r, (px, py) => (py < y - r * 0.3 ? lt(c, 0.25) : c), { out: dk(c, 0.42) }); }
      if (P.moss) speck(G, R, 7, [P.moss, lt(P.moss, 0.2)]);
      if (P.cracks) for (let i = 0; i < 2; i++) { const x = R.int(1, 13), y = R.int(1, 13); G.line(x, y, x + 3, y + 2, P.cracks); }
    }
    return G.canvas();
  });
}
export function massFace(P, v) {
  return keep('mf' + P.key + v, () => {
    const G = grid(16, 16), R = rng(hash(P.key) ^ (v * 4321 + 7)), k = P.mass, c = P.f1 || P.m1;
    if (k === 'canopy' || k === 'bramble') {
      // the dark under the trees: trunks between the shadows, the leaves hanging over
      G.rect(0, 0, 16, 16, dk(P.m1, 0.55));
      for (const x of [2 + (v % 3), 9 + (v % 2) * 2]) { G.rect(x, 4, 2, 12, P.trunk); G.set(x, 5, lt(P.trunk, 0.3)); G.set(x + 1, 15, dk(P.trunk, 0.3)); }
      for (let x = 0; x < 16; x++) { const h = 4 + ((x + v) % 4 === 0 ? 2 : (x + v) % 2); for (let y = 0; y < h; y++) G.set(x, y, y === h - 1 ? dk(P.m1, 0.4) : P.m1); }
      if (k === 'bramble') for (let i = 0; i < 5; i++) { const x = R.int(0, 14), y = R.int(6, 14); G.set(x, y, '#a88a5a'); G.set(x + 1, y - 1, '#a88a5a'); }
      G.rect(0, 15, 16, 1, 'rgba(0,0,0,0)');
    } else if (k === 'redwall' || k === 'yellowwall' || k === 'whitewall') {
      G.rect(0, 0, 16, 16, c); G.rect(0, 0, 16, 2, dk(P.roof, 0.35)); G.rect(0, 2, 16, 1, '#e0b040');
      if (v % 3 === 1) { G.rect(4, 5, 8, 6, dk(c, 0.45)); for (let i = 5; i < 12; i += 2) G.rect(i, 5, 1, 6, lt(c, 0.25)); G.rect(4, 8, 8, 1, lt(c, 0.25)); }
      G.rect(0, 3, 2, 10, dk(c, 0.2)); G.rect(0, 13, 16, 3, P.plinth || '#8a8478'); G.rect(0, 13, 16, 1, lt(P.plinth || '#8a8478', 0.25));
    } else {
      G.rect(0, 0, 16, 16, c);
      for (let i = 0; i < 4; i++) { const x = (i * 4 + v * 3 + R.int(0, 1)) % 16; for (let y = 1; y < 15; y++) if (R() < 0.8) G.set(x, y, dk(c, 0.25)); G.set(x + 1, R.int(2, 12), lt(c, 0.2)); }
      G.rect(0, 0, 16, 1, lt(c, 0.35)); if (P.strata) for (const y of [5, 10]) for (let x = 0; x < 16; x++) G.set(x, y, P.strata);
      if (P.snowcap) for (let x = 0; x < 16; x++) { G.set(x, 0, '#ffffff'); G.set(x, 1, x % 5 < 3 ? '#ffffff' : '#dce8f4'); if (x % 5 === 1) G.set(x, 2, '#e8f0f8'); }
      if (P.moss) for (let x = 0; x < 16; x++) if ((x + v) % 3) G.set(x, 0, P.moss);
      G.rect(0, 14, 16, 2, dk(c, 0.4));
      if (P.glow) for (let i = 0; i < 2; i++) G.set(R.int(1, 14), R.int(3, 12), P.glow);
    }
    return G.canvas();
  });
}

// ---------------------------------------------------------------- water, lava, mud, cloud (three frames)
export const LIQ = {
  water: { a: '#3a88c8', b: '#5aa8e0', foam: '#d8f0ff' }, dark: { a: '#1a2a3a', b: '#2a3e52', foam: '#7a8a9a' }, lava: { a: '#d84a1a', b: '#f8a030', foam: '#3a1a10' },
  mud: { a: '#5a4a2a', b: '#6e5c36', foam: '#8a7a4a' }, cloud: { a: '#dce4f4', b: '#f8f8ff', foam: '#ffffff' }, lotus: { a: '#3a8a8a', b: '#58a8a0', foam: '#c8f0e0' },
  sea: { a: '#2a6a9a', b: '#3a80b0', foam: '#a8d8f0' }, ice: { a: '#8ab8e0', b: '#b8d8f0', foam: '#ffffff' },
};
export function liquid(kind, f, v) {
  return keep('w' + kind + f + v, () => {
    const L = LIQ[kind] || LIQ.water, G = grid(16, 16), R = rng(hash(kind) + v * 13);
    G.rect(0, 0, 16, 16, L.a);
    if (kind === 'cloud') { for (const [x, y, r] of [[4 + f, 5, 4], [12 - f, 10, 4.5], [0, 13, 3.5], [16, 3, 3.5]]) G.ell(x, y, r, r * 0.7, (px, py) => (py < y ? '#ffffff' : L.b), { out: false, shade: false }); return G.canvas(); }
    for (let i = 0; i < (kind === 'ice' ? 1 : 3); i++) { const y = (i * 5 + f * 2 + v * 3) % 16, x = (i * 7 + f * 3 + v * 5) % 12; for (let j = 0; j < 4; j++) G.set(x + j, y + (j === 0 || j === 3 ? 1 : 0), L.b); }
    if (kind === 'lava') { G.set(R.int(2, 13), R.int(2, 13), '#ffe070'); if (f === 1) G.set(R.int(2, 13), R.int(2, 13), '#ffe070'); }
    if (kind === 'ice' && v === 1) G.line(R.int(0, 6), R.int(0, 15), R.int(9, 15), R.int(0, 15), '#e8f4ff');
    if (kind === 'lotus' && v % 2 === 0) { G.ell(8, 9, 3.4, 2.2, '#4a9a3a', { out: '#2a5a2a' }); G.set(8, 9, '#2a5a2a'); if (v === 0) { G.poly([[6, 8], [8, 3], [10, 8]], '#f4a0c0', { out: '#a8506a' }); } }
    return G.canvas();
  });
}
export function bridge(kind, horiz) {
  return keep('b' + kind + horiz, () => {
    const G = grid(16, 16), wood = kind === 'cloud' ? '#f4ecd8' : kind === 'lava' ? '#7a6a60' : '#a8784a', rail = kind === 'cloud' ? '#e0b040' : kind === 'lava' ? '#5a4a44' : '#6a4426';
    if (horiz) { G.rect(0, 2, 16, 12, wood); for (let x = 0; x < 16; x += 3) G.rect(x, 2, 1, 12, dk(wood, 0.25)); G.rect(0, 1, 16, 2, rail); G.rect(0, 13, 16, 2, rail); }
    else { G.rect(2, 0, 12, 16, wood); for (let y = 0; y < 16; y += 3) G.rect(2, y, 12, 1, dk(wood, 0.25)); G.rect(1, 0, 2, 16, rail); G.rect(13, 0, 2, 16, rail); }
    return G.canvas();
  });
}

// ---------------------------------------------------------------- things that stand alone (16 wide; base on the bottom row)
export function stand(kind, P, v) {
  return keep('s' + kind + P.key + v, () => {
    const R = rng(hash(kind + P.key) + v * 101); let G;
    const tall = (h) => (G = grid(16, h));
    const shadow = (h, w = 6) => G.shape((x, y) => ((x - 8) / w) ** 2 + ((y - (h - 2)) / 1.8) ** 2 <= 1, 'rgba(0,0,0,0.25)', { out: false, shade: false });
    const leaf = P.leaf, trunk = P.trunk;
    switch (kind) {
      case 'tree': case 'peach': case 'persimmon': case 'bodhi': case 'blossom': {
        tall(28); shadow(28); G.rect(7, 16, 3, 11, trunk); G.shape((x, y) => x > 6.5 && x < 10 && y > 16 && y < 27, trunk);
        const lc = kind === 'blossom' ? '#f0a8c0' : kind === 'bodhi' ? '#a8b83a' : leaf;
        for (const [x, y, r] of [[8, 9, 6.4], [4.5, 13, 4], [11.5, 13, 4.2]]) G.shape((px, py) => Math.hypot(px - x, py - y) < r + (v % 2) * 0.4, (px, py) => (Math.hypot(px - x + 2, py - y + 2) < r * 0.5 ? lt(lc, 0.22) : py > y + r * 0.4 ? dk(lc, 0.18) : lc));
        const fr = kind === 'peach' ? '#f87a8a' : kind === 'persimmon' ? '#f08a20' : kind === 'blossom' ? '#ffffff' : kind === 'bodhi' ? '#f0d040' : null;
        if (fr) for (let i = 0; i < 6; i++) { const x = R.int(3, 12), y = R.int(5, 15); if (G.get(x, y) && G.get(x, y) !== OUT) G.set(x, y, fr); }
        break; }
      case 'pine': case 'snowpine': {
        tall(30); shadow(30, 5); G.rect(7, 23, 2, 6, trunk);
        for (let t = 0; t < 3; t++) { const y0 = 2 + t * 7, w = 3 + t * 2; G.poly([[8, y0], [8 - w - 1, y0 + 9], [8 + w + 1, y0 + 9]], (x, y) => (x < 8 - (y - y0) * 0.2 ? lt(P.pine, 0.12) : P.pine)); if (kind === 'snowpine') for (let x = 8 - w; x <= 8 + w; x++) if (G.get(x, y0 + 8) && G.get(x, y0 + 8) !== OUT && x % 2) G.set(x, y0 + 8, '#ffffff'); }
        if (kind === 'snowpine') { G.set(8, 3, '#ffffff'); G.set(7, 4, '#ffffff'); G.set(8, 4, '#ffffff'); }
        break; }
      case 'willow': { tall(28); shadow(28); G.rect(7, 14, 3, 13, trunk); G.ell(8, 8, 7, 6, leaf); for (let x = 2; x < 15; x += 2) { const len = 10 + ((x * 3 + v) % 5); for (let y = 10; y < 10 + len; y++) G.set(x, y, y % 3 ? lt(leaf, 0.15) : leaf); } break; }
      case 'bamboo': { tall(30); shadow(30, 5); for (const [x, top] of [[4, 2 + v], [8, 0], [11, 4 - v]]) { G.rect(x, top, 2, 28 - top, '#6aa83a'); G.rect(x, top, 1, 28 - top, '#8ac85a'); for (let y = top + 4; y < 28; y += 5) G.rect(x, y, 2, 1, '#3a6a2a'); G.poly([[x + 1, top + 3], [x + 6, top + 1], [x + 2, top + 5]], '#5a9a3a'); G.poly([[x, top + 8], [x - 5, top + 6], [x - 1, top + 10]], '#5a9a3a'); } break; }
      case 'bush': { tall(16); shadow(16); G.shape((x, y) => Math.hypot(x - 5, y - 9) < 4.5 || Math.hypot(x - 11, y - 9) < 4.5 || Math.hypot(x - 8, y - 6) < 4.5, (x, y) => (y < 7 ? lt(leaf, 0.2) : leaf)); if (P.fruit) for (let i = 0; i < 3; i++) G.set(R.int(4, 12), R.int(5, 11), P.fruit); break; }
      case 'thorn': { tall(18); shadow(18); G.shape((x, y) => Math.hypot(x - 8, y - 10) < 6.5, (x, y) => ((x + y) % 3 === 0 ? '#5a4a26' : '#3e5a26')); for (let i = 0; i < 8; i++) { const a = R() * 6.28, x = 8 + Math.cos(a) * 7, y = 10 + Math.sin(a) * 6; G.line(8 + Math.cos(a) * 4, 10 + Math.sin(a) * 4, x, y, '#8a6a3a'); } G.set(6, 8, '#d83a3a'); G.set(10, 12, '#d83a3a'); break; }
      case 'rock': case 'sandrock': case 'snowrock': case 'stalag': case 'charred': {
        const rc = kind === 'sandrock' ? '#c89a5a' : kind === 'charred' ? '#3a2a26' : kind === 'stalag' ? P.rock || '#7a6a5a' : P.rock || '#8a8a84';
        if (kind === 'stalag') { tall(24); shadow(24, 5); G.poly([[8, 1 + v], [3, 22], [13, 22]], (x, y) => (x < 7 ? lt(rc, 0.2) : rc)); G.line(8, 6, 7, 18, dk(rc, 0.3)); break; }
        tall(18); shadow(18); G.poly([[1, 16], [2, 8 - v], [6, 3], [11, 4], [15, 9], [15, 16]], (x, y) => (y < 7 || x < 4 ? lt(rc, 0.22) : y > 13 ? dk(rc, 0.18) : rc)); G.line(6, 6, 8, 13, dk(rc, 0.3));
        if (kind === 'snowrock') G.shape((x, y) => y < 8 && G.get(x, y) && G.get(x, y) !== OUT, '#ffffff', { out: false, shade: false });
        if (kind === 'charred') { G.set(5, 10, '#e8602a'); G.set(11, 8, '#e8602a'); }
        if (P.moss && kind === 'rock') { G.set(6, 4, P.moss); G.set(7, 4, P.moss); G.set(10, 5, P.moss); }
        break; }
      case 'deadtree': { tall(26); shadow(26, 4); const tc = '#6a5446'; G.rect(7, 10, 2, 15, tc); for (const [x0, y0, x1, y1] of [[8, 12, 3, 5], [8, 10, 13, 3], [8, 16, 13, 11], [4, 7, 2, 2], [12, 5, 14, 1]]) G.line(x0, y0, x1, y1, tc); break; }
      case 'reed': { tall(20); for (let i = 0; i < 6; i++) { const x = 3 + i * 2, top = 4 + ((i * 5 + v) % 6); G.rect(x, top, 1, 18 - top, '#7a9a3a'); if (i % 2 === 0) G.rect(x, top - 2, 1, 3, '#7a4a2a'); } break; }
      case 'coral': { tall(20); shadow(20); const cc = ['#e8604a', '#f0a040', '#d860a8'][v % 3]; for (const pts of [[[8, 18], [8, 8], [5, 3]], [[8, 12], [12, 6], [13, 2]], [[8, 14], [3, 10]], [[12, 8], [15, 7]]]) for (let i = 0; i < pts.length - 1; i++) G.shape((x, y) => { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - ax - dx * t, y - ay - dy * t) < 1.3; }, cc); break; }
      case 'kelp': { tall(28); for (const x0 of [5, 10]) for (let y = 2; y < 27; y++) { const x = x0 + Math.round(Math.sin(y / 3 + x0 + v) * 1.5); G.set(x, y, '#3a8a4a'); G.set(x + 1, y, '#5aaa5a'); if (y % 5 === 0) G.set(x + 2, y, '#5aaa5a'); } break; }
      case 'crystal': { tall(22); shadow(22, 5); const cc = P.crystal || '#8ac8f0'; for (const [x, top, w] of [[8, 2, 3], [4, 9, 2.4], [12, 7, 2.4]]) G.poly([[x, top], [x + w, top + 4], [x + w, 20], [x - w, 20], [x - w, top + 4]], (px, py) => (px < x ? lt(cc, 0.35) : cc)); break; }
      case 'iceblock': { tall(20); shadow(20); G.poly([[2, 18], [2, 7], [6, 3], [13, 4], [14, 18]], (x, y) => (x < 6 ? '#ffffff' : y > 14 ? '#8ab0d8' : '#c0dcf4')); G.line(5, 6, 9, 15, '#ffffff'); break; }
      case 'bonepile': { tall(16); shadow(16); G.ell(8, 11, 6, 3.4, '#5a4a40'); for (const [x, y] of [[5, 9], [10, 10], [8, 7]]) { G.ell(x, y, 2.2, 2, '#e8e0cc'); G.set(x - 1, y, OUT); G.set(x + 1, y, OUT); } G.line(2, 13, 13, 11, '#e8e0cc'); break; }
      case 'brazier': case 'flame': {
        tall(24); shadow(24, 5);
        if (kind === 'brazier') { G.poly([[3, 14], [13, 14], [11, 20], [5, 20]], '#a8783a'); G.rect(5, 20, 1, 3, '#6a4a2a'); G.rect(10, 20, 1, 3, '#6a4a2a'); }
        const base = kind === 'brazier' ? 14 : 22;
        G.shape((x, y) => y < base && y > base - 13 && Math.abs(x - 8) < (y - (base - 13)) * 0.42 + Math.sin(y + v) * 0.6, (x, y) => (Math.abs(x - 8) < 1.5 && y > base - 7 ? '#fff4a0' : y < base - 8 ? '#f05020' : '#f8a030'), { out: '#8a2a10' });
        break; }
      case 'pillar': case 'redpillar': { tall(30); shadow(30, 4); const pc = kind === 'pillar' ? '#f4f0f8' : '#c03a2a'; G.rect(4, 2, 8, 26, pc); G.shape((x, y) => x > 4 && x < 12 && y > 2 && y < 28, (x, y) => (x < 6 ? lt(pc, 0.25) : x > 10 ? dk(pc, 0.22) : pc)); G.rect(3, 0, 10, 3, '#e0b040'); G.rect(3, 26, 10, 3, '#e0b040'); if (kind === 'pillar') for (let y = 6; y < 26; y += 5) G.line(5, y, 10, y - 2, '#e0c060'); break; }
      case 'stupa': { tall(28); shadow(28, 5); G.rect(4, 20, 8, 7, '#f0ece4'); G.ell(8, 16, 5, 5, '#f8f4ec'); G.rect(7, 4, 2, 8, '#e0b040'); for (let y = 6; y < 12; y += 2) G.rect(6, y, 4, 1, '#e0b040'); G.set(8, 2, '#e0b040'); break; }
      case 'lantern': { tall(22); shadow(22, 4); const sc = '#a8a49c'; G.rect(6, 12, 4, 9, sc); G.rect(3, 9, 10, 2, sc); G.rect(5, 5, 6, 4, sc); G.rect(6, 6, 4, 2, '#f8d870'); G.poly([[2, 5], [8, 1], [14, 5]], sc); break; }
      case 'urn': { tall(18); shadow(18); G.ell(8, 11, 6, 5, '#8a7a3a'); G.rect(3, 6, 10, 2, '#a8984a'); G.rect(4, 15, 2, 2, '#6a5a2a'); G.rect(10, 15, 2, 2, '#6a5a2a'); G.set(6, 10, '#c8b860'); break; }
      case 'plant': { tall(20); shadow(20, 5); G.poly([[4, 13], [12, 13], [11, 19], [5, 19]], '#3a6a8a'); G.ell(8, 8, 5.5, 5, '#4a8a3a'); G.set(6, 6, '#f0a0c0'); G.set(10, 8, '#f0a0c0'); break; }
      case 'web': { tall(16); G.shape((x, y) => Math.hypot(x - 8, y - 8) < 7.4 && (Math.abs(x - 8) < 0.6 || Math.abs(y - 8) < 0.6 || Math.abs(x - y) < 0.7 || Math.abs(x + y - 16) < 0.7 || Math.abs(Math.hypot(x - 8, y - 8) - 3.5) < 0.5 || Math.abs(Math.hypot(x - 8, y - 8) - 6.5) < 0.5), '#e8e8f0', { out: false, shade: false }); break; }
      default: tall(16); G.ell(8, 9, 5, 5, '#888');
    }
    return G.canvas();
  });
}

// ---------------------------------------------------------------- small things underfoot (transparent 16 x 16)
export function deco(kind, v) {
  return keep('d' + kind + v, () => {
    const G = grid(16, 16), R = rng(hash(kind) + v * 7), x = R.int(3, 11), y = R.int(4, 12);
    switch (kind) {
      case 'flower': for (let i = 0; i < 3; i++) { const fx = R.int(2, 13), fy = R.int(3, 13), c = ['#f8e050', '#f8a0c0', '#ffffff', '#e86a5a', '#a8a0f0'][R.int(0, 4)]; G.set(fx, fy, c); G.set(fx - 1, fy, c); G.set(fx + 1, fy, c); G.set(fx, fy - 1, c); G.set(fx, fy + 1, c); G.set(fx, fy, '#f8c040'); } break;
      case 'grass': for (let i = 0; i < 2; i++) { const gx = R.int(2, 12), gy = R.int(5, 13); G.set(gx, gy, '#3a6a2a'); G.set(gx + 1, gy - 1, '#4a8a3a'); G.set(gx + 2, gy, '#3a6a2a'); G.set(gx + 1, gy - 2, '#5a9a4a'); } break;
      case 'dry': G.set(x, y, '#a89a5a'); G.set(x + 1, y - 1, '#c8b870'); G.set(x + 2, y, '#a89a5a'); break;
      case 'stone': G.ell(x, y, 1.6, 1.1, '#9a968e'); break;
      case 'pebble': G.set(x, y, '#5a4a40'); G.set(x + 3, y + 2, '#6a5a50'); G.set(x + 4, y + 2, '#4a3a30'); break;
      case 'mush': G.rect(x, y + 1, 1, 2, '#f0e8d8'); G.ell(x + 0.5, y, 1.8, 1, '#d83a2a'); G.set(x, y, '#ffffff'); break;
      case 'bone': G.line(x - 2, y, x + 2, y - 1, '#e8e0cc'); G.set(x - 3, y, '#e8e0cc'); G.set(x + 3, y - 1, '#e8e0cc'); break;
      case 'skull': G.ell(x, y, 2, 1.8, '#e8e0cc'); G.set(x - 1, y, OUT); G.set(x + 1, y, OUT); break;
      case 'shell': G.ell(x, y, 1.8, 1.4, '#f8c8b0'); G.set(x, y, '#d89880'); break;
      case 'star': G.set(x, y, '#f08040'); G.set(x - 1, y, '#f08040'); G.set(x + 1, y, '#f08040'); G.set(x, y - 1, '#f08040'); G.set(x, y + 1, '#f08040'); break;
      case 'leaf': for (let i = 0; i < 3; i++) G.set(R.int(2, 13), R.int(3, 13), ['#d8802a', '#c85a20', '#e8a840'][i]); break;
      case 'petal': for (let i = 0; i < 4; i++) G.set(R.int(2, 13), R.int(3, 13), '#f8b8c8'); break;
      case 'ember': G.set(x, y, '#f8a030'); G.set(x + 4, y + 3, '#e8602a'); break;
      case 'lotus': G.ell(x, y, 2.4, 1.6, '#4a9a3a'); G.set(x, y - 1, '#f4a0c0'); break;
      case 'snow': G.ell(x, y, 2.2, 1.2, '#ffffff', { out: false }); break;
      case 'fruit': G.ell(x, y, 1.4, 1.4, '#c86a20'); G.set(x, y - 1, '#3a5a2a'); break;
      case 'web': G.line(x - 3, y - 3, x + 3, y + 3, '#d8d8e0'); G.line(x - 3, y + 3, x + 3, y - 3, '#d8d8e0'); break;
    }
    return G.canvas();
  });
}

// ---------------------------------------------------------------- buildings and landmarks (w x h squares; drawn taller)
export const PROPS = { shrine: [2, 1], stele: [1, 1], pagoda: [2, 2], hut: [3, 2], well: [1, 1], gate: [3, 1], pavilion: [3, 2], palace: [4, 2], temple: [4, 2], cave: [3, 1], hellgate: [3, 1], arch: [3, 1], tent: [2, 1] };
export function prop(kind, P) {
  return keep('p' + kind + P.key, () => {
    const [w, h] = PROPS[kind] || [1, 1], W = w * 16, extra = { pagoda: 34, palace: 22, temple: 22, gate: 22, hellgate: 22, pavilion: 18, hut: 10, shrine: 14, stele: 10, cave: 18, arch: 20, well: 4, tent: 10 }[kind] || 8, H = h * 16 + extra, G = grid(W, H), b = H - 1;
    const roof = (x0, x1, y, depth, col) => { G.poly([[x0 - 3, y + depth], [x0 + 2, y], [x1 - 2, y], [x1 + 3, y + depth]], (x, yy) => ((yy - y) % 2 === 0 ? dk(col, 0.25) : col)); G.rect(x0 - 3, y + depth, x1 - x0 + 6, 1, dk(col, 0.4)); G.set(x0 - 3, y + depth - 1, col); G.set(x1 + 2, y + depth - 1, col); };
    const wall = (x0, x1, y0, y1, col) => G.shape((x, y) => x > x0 && x < x1 && y > y0 && y < y1, (x, y) => (x < x0 + 2 ? lt(col, 0.2) : col));
    switch (kind) {
      case 'shrine': wall(5, W - 5, b - 14, b, '#e8dcc4'); G.rect(W / 2 - 3, b - 9, 6, 9, '#5a3a2a'); G.rect(W / 2 - 1, b - 7, 2, 2, '#f0c040'); roof(5, W - 5, b - 22, 8, '#4a5a6a'); break;
      case 'stele': G.rect(3, b - 3, 10, 3, '#8a8478'); wall(4, 12, b - 24, b - 2, '#b8b4ac'); for (let y = b - 20; y < b - 6; y += 3) G.rect(7, y, 2, 1, '#6a665e'); G.ell(8, b - 24, 4, 2.4, '#b8b4ac'); break;
      case 'well': G.ell(8, b - 5, 7, 4, '#8a8478'); G.ell(8, b - 6, 4.4, 2.2, '#1a2a3a', { out: false }); G.rect(2, b - 18, 2, 12, '#6a4426'); G.rect(12, b - 18, 2, 12, '#6a4426'); G.rect(1, b - 19, 14, 2, '#6a4426'); break;
      case 'hut': wall(4, W - 4, b - 16, b, '#d8c8a0'); G.rect(10, b - 10, 6, 10, '#5a3a2a'); G.rect(W - 16, b - 11, 6, 5, '#3a2a1a'); G.poly([[1, b - 14], [W / 2, b - 26], [W - 1, b - 14]], (x, y) => ((x + y) % 3 === 0 ? '#a8864a' : '#c8a05a')); break;
      case 'tent': G.poly([[1, b], [W / 2, b - 22], [W - 1, b]], (x, y) => (x < W / 2 ? '#d8c8a8' : '#b8a888')); G.poly([[W / 2 - 3, b], [W / 2, b - 8], [W / 2 + 3, b]], '#3a2a1a'); break;
      case 'pagoda': { for (let i = 0; i < 4; i++) { const ww = W - 6 - i * 4, x0 = (W - ww) / 2, y = b - 10 - i * 12; wall(x0 + 1, x0 + ww - 1, y, y + 11, '#e8dcc4'); G.rect(W / 2 - 1, y + 3, 2, 4, '#5a3a2a'); roof(x0, x0 + ww, y - 4, 4, '#5a4a3a'); } G.rect(W / 2 - 1, b - 60, 2, 10, '#e0b040'); break; }
      case 'gate': case 'arch': case 'hellgate': {
        const pc = kind === 'hellgate' ? '#5a2a2a' : kind === 'arch' ? '#e8e4dc' : '#c03a2a', rc = kind === 'hellgate' ? '#2a1a1a' : kind === 'arch' ? '#e0b040' : '#3a4a5a';
        for (const x of [6, W - 10]) wall(x - 1, x + 4, b - 26, b, pc); G.rect(6, b - 22, W - 12, 3, kind === 'arch' ? '#e0b040' : '#e0b040'); roof(4, W - 4, b - 34, 7, rc);
        if (kind === 'hellgate') { G.rect(W / 2 - 6, b - 32, 12, 5, '#1a1010'); G.rect(W / 2 - 4, b - 31, 8, 3, '#d8c8a8'); }
        break; }
      case 'pavilion': case 'palace': case 'temple': {
        const pc = kind === 'temple' ? '#e0b050' : '#c03a2a', rc = kind === 'pavilion' ? '#e0b040' : kind === 'temple' ? '#4a4a4a' : '#3a6a5a';
        G.rect(1, b - 4, W - 2, 4, '#c8c0b0'); G.rect(1, b - 4, W - 2, 1, '#f0e8d8');
        wall(5, W - 5, b - (kind === 'pavilion' ? 20 : 26), b - 3, kind === 'pavilion' ? 'rgba(0,0,0,0)' : pc);
        for (let x = 7; x < W - 8; x += kind === 'pavilion' ? 12 : 10) G.rect(x, b - (kind === 'pavilion' ? 20 : 26), 3, kind === 'pavilion' ? 17 : 23, kind === 'pavilion' ? '#c03a2a' : dk(pc, 0.3));
        if (kind !== 'pavilion') { G.rect(W / 2 - 5, b - 16, 10, 13, '#5a2a1a'); G.rect(W / 2, b - 16, 1, 13, '#2a1a10'); }
        roof(4, W - 4, b - (kind === 'pavilion' ? 30 : 36), 9, rc); if (kind !== 'pavilion') roof(10, W - 10, b - 44, 6, rc);
        break; }
      case 'cave': { // the mouth of a demon's cave, in a heap of rock, bones before it
        const rc = P.f1 || '#6a5a4a';
        G.shape((x, y) => ((x - W / 2) / (W / 2)) ** 2 + ((y - b) / (H - 2)) ** 2 <= 1, (x, y) => ((x * 3 + y * 5) % 9 === 0 ? dk(rc, 0.25) : x < W / 3 ? lt(rc, 0.15) : rc));
        G.shape((x, y) => ((x - W / 2) / 8) ** 2 + ((y - b) / 13) ** 2 <= 1, (x, y) => (y > b - 4 ? '#140a0a' : '#0a0606'), { out: dk(rc, 0.5) });
        for (const x of [W / 2 - 11, W / 2 + 10]) { G.ell(x, b - 2, 2, 1.8, '#e8e0cc'); G.set(x - 1, b - 2, OUT); G.set(x + 1, b - 2, OUT); }
        break; }
    }
    return G.canvas();
  });
}

// a place to rest: a spring in a ring of stones, a bronze censer, a golden lotus (three frames)
export function rest(kind, f) {
  return keep('rest' + kind + f, () => {
    let G;
    if (kind === 'censer') { G = grid(16, 22); G.ell(8, 20, 6, 1.5, 'rgba(0,0,0,0.3)', { out: false, shade: false }); G.poly([[2, 11], [14, 11], [12, 18], [4, 18]], (x, y) => (x < 6 ? '#d0a050' : '#a8783a')); G.rect(4, 18, 1, 3, '#6a4a2a'); G.rect(11, 18, 1, 3, '#6a4a2a'); G.rect(1, 10, 14, 2, '#c89a4a'); for (let i = 0; i < 3; i++) G.set(6 + i * 2, 13, '#f0d060'); for (let y = 2; y < 10; y++) G.set(8 + Math.round(Math.sin(y / 1.6 + f) * 1.5), y, y % 2 ? '#e0e0e8' : '#c8c8d4'); G.set(7, 9, '#f8a030'); G.set(8, 9, '#ffe070'); return G.canvas(); }
    if (kind === 'lotus') { G = grid(16, 18); G.ell(8, 15, 7, 2.4, '#e0b040'); for (const [x, y, w] of [[8, 6, 2.2], [4.5, 9, 2], [11.5, 9, 2], [8, 10, 3]]) G.ell(x, y, w, 3.4, (px, py) => (py < y - 1 ? '#fff4f8' : '#f4a8c8')); G.set(8, 3 - (f % 2), '#fff8c0'); return G.canvas(); }
    G = grid(16, 16); G.ell(8, 9, 7.4, 5.6, (x, y) => ((x + y) % 3 === 0 ? '#7a7a74' : '#9a9890'));
    G.ell(8, 9, 5, 3.6, (x, y) => ((x + y + f) % 4 === 0 ? '#d8f8ff' : y < 8 ? '#7ad0f0' : '#4aa8e0'), { out: '#3a5a6a', shade: false });
    G.set(6 + f, 8, '#ffffff'); G.set(10 - f, 10, '#ffffff'); return G.canvas();
  });
}

// ---------------------------------------------------------------- chests and the walking figures
export function chest(open) { return keep('chest' + open, () => { const G = grid(16, 16); G.ell(8, 14, 6, 1.5, 'rgba(0,0,0,0.3)', { out: false, shade: false }); if (open) { G.rect(2, 4, 12, 3, '#4a1a10'); G.rect(3, 5, 10, 2, '#f8e080'); } G.shape((x, y) => x > 2 && x < 14 && y > (open ? 7 : 5) && y < 14, (x, y) => (y < 8 && !open ? '#c8482a' : '#a83a22')); G.rect(2, 8, 12, 1, '#e8c040'); G.rect(7, 7, 2, 3, '#f0d050'); return G.canvas(); }); }

const WL = {
  悟空: { skin: '#f2c49a', hair: '#b8782c', style: 'monkey', robe: '#e8a830', legs: '#c83a20', item: 'staff' },
  唐僧: { skin: '#fcd6b8', hair: '#f0c040', style: 'vinu', robe: '#c0382a', legs: '#e8b048', horse: true },
  八戒: { skin: '#8a7a88', hair: '#4a3e4a', style: 'pig', robe: '#2a3a5a', legs: '#1a2232', item: 'rake' },
  悟淨: { skin: '#6c94c8', hair: '#c8401c', style: 'monk', robe: '#4a5a6a', legs: '#3a3a4a', item: 'pole', beard: '#c8401c' },
};
// a person met on the road, dressed after their portrait
function lookOf(id, col) {
  if (WL[id]) return WL[id];
  const c = CAST[id], L = c?.look || {}, robe = col || (L.robe && L.robe.startsWith('#') ? L.robe : L.robe === 'kasaya' ? '#c0382a' : '#6a5a3a');
  if (!c) return { skin: '#eeaa74', hair: '#2a2024', style: 'top', robe, legs: '#3a3020' };
  if (c.beast) return { skin: L.fur || '#8a6a4a', hair: dk(L.fur || '#8a6a4a', 0.3), style: 'beast', robe, legs: '#3a3020' };
  const skin = { y: '#eeaa74', w: '#f6c89c', r: '#d8704c', d: '#c48254', p: '#fcd6b8', gold: '#f0c04c', blue: '#6c94c8', green: '#86b46c', grey: '#d0ccc8', bone: '#e8e0c8', ash: '#b8c4b0' }[L.face] || '#eeaa74';
  const hair = L.hair === 'white' ? '#ece8e0' : L.hair === 'red' ? '#c8401c' : L.hair === 'gold' ? '#e0a830' : L.hair === 'purple' ? '#7a3a8a' : '#2a2024';
  const style = L.female ? 'bun' : ['monk', 'vinu', 'buddha', 'child'].includes(L.hat) ? 'monk' : L.hat === 'helm' ? 'helm' : ['official', 'scholar', 'emperor', 'crown'].includes(L.hat) ? 'hat' : L.hat === 'scarf' || L.hat === 'bodhi' ? 'hood' : L.hat === 'tall' ? 'tall' : 'top';
  return { skin, hair, style, robe, legs: dk(robe, 0.35), beard: L.beard === 'long' || L.beard === 'full' ? hair : null, hoodC: L.hat === 'bodhi' ? '#f8f6f0' : L.hat === 'tall' ? L.hatC || '#f8f6f0' : '#b8a07a' };
}
export function walker(id, dir, step, opt = {}) {
  const L = lookOf(id, opt.col);
  return keep('wk' + id + dir + step + (opt.col || ''), () => (L.horse ? horseman(L, dir, step) : figure(L, dir, step)));
}
function figure(L, dir, step) {
  const G = grid(16, 22), side = dir === 'left' || dir === 'right', back = dir === 'up', st = step ? 1 : 0;
  G.ell(8, 20.5, 5, 1.4, 'rgba(0,0,0,0.3)', { out: false, shade: false });
  // legs, body, arms
  if (side) { G.rect(6 + st, 16, 2, 4, L.legs); G.rect(8 - st, 16, 2, 4, dk(L.legs, 0.2)); }
  else { G.rect(5, 16, 2, 4 - st, L.legs); G.rect(9, 16, 2, 3 + st, L.legs); }
  G.shape((x, y) => y > 10 && y < 17 && Math.abs(x - 8) < (side ? 3.4 : 4.2) + (y - 10) * 0.15, L.robe);
  if (!side) for (const sx of [3, 12]) G.rect(sx, 11 + (sx === 3 ? st : 1 - st), 1, 4, L.robe === '#e8a830' ? L.skin : dk(L.robe, 0.15));
  if (L.style === 'monkey' && !back) for (let x = 5; x < 11; x++) if ((x + 1) % 3 === 0) G.set(x, 13, '#3a2010');
  if (L.item === 'staff') { G.rect(side ? 10 : 13, 3, 1, 16, '#c83a20'); G.set(side ? 10 : 13, 3, '#f0c040'); G.set(side ? 10 : 13, 18, '#f0c040'); }
  if (L.item === 'rake') { G.rect(13, 4, 1, 15, '#8a6a4a'); G.rect(11, 3, 5, 1, '#c8c8d0'); for (let i = 11; i < 16; i += 2) G.set(i, 4, '#c8c8d0'); }
  if (L.item === 'pole') { G.rect(1, 10, 14, 1, '#8a6a4a'); G.rect(0, 11, 3, 4, '#7a5a9a'); G.rect(13, 11, 3, 4, '#9a5a3a'); }
  // the head, big, as little figures have
  const hx = side ? 7.5 : 8, hy = 6.5;
  if (L.style === 'pig') for (const s of [-1, 1]) G.poly([[hx + s * 2, hy - 4], [hx + s * 6.5, hy - 5], [hx + s * 5, hy + 0.5]], L.hair);
  G.ell(hx, hy, 4.6, 4.4, back || L.style === 'beast' ? L.hair : L.skin);
  if (!back) {
    const ex = side ? (dir === 'left' ? [5] : [10]) : [6, 10], ey = hy + 0.5;
    if (L.style === 'monkey') G.shape((x, y) => Math.hypot(x - hx, y - hy - 0.8) < 3.2, '#f6d2a8', { out: false, shade: false });
    for (const x of ex) G.set(x, ey, '#1c1216');
    if (L.style === 'pig') { G.rect(hx - 1.5 - (side ? (dir === 'left' ? 2 : -2) : 0), hy + 1.5, 3, 2, '#d8a0b0'); G.set(hx - 1 - (side ? (dir === 'left' ? 2 : -2) : 0), hy + 2, OUT); }
    if (L.beard) G.rect(hx - 2, hy + 3, 4, 3, L.beard);
  }
  // hair and hats
  const top = (y1, c) => G.shape((x, y) => Math.hypot((x - hx) / 4.9, (y - hy) / 4.7) <= 1 && y < y1, c);
  if (back && !['monk', 'beast'].includes(L.style)) top(hy + 3, L.hair);
  switch (L.style) {
    case 'monkey': top(hy - 1.6, L.hair); G.rect(hx - 4, hy - 2, 8, 1, '#f0c040'); for (const s of [-1, 1]) G.ell(hx + s * 4.6, hy, 1.2, 1.4, '#f6d2a8'); break;
    case 'vinu': G.rect(hx - 4, hy - 4, 8, 2, '#f0c040'); for (const x of [-3, 0, 3]) G.rect(hx + x - 0.5, hy - 6, 1, 2, '#f0c040'); break;
    case 'top': top(hy - 1.5, L.hair); G.ell(hx, hy - 5, 1.6, 1.3, L.hair); break;
    case 'bun': top(hy - 1, L.hair); G.ell(hx, hy - 5.4, 2.4, 1.8, L.hair); if (!back) for (const s of [-1, 1]) G.rect(hx + s * 4 - 0.5, hy - 1, 1, 4, L.hair); G.set(hx + 2, hy - 5, '#f0c040'); break;
    case 'helm': top(hy - 1, '#9a9aa8'); G.rect(hx - 0.5, hy - 7, 1, 2, '#d83a2a'); break;
    case 'hat': top(hy - 1.5, '#2a2228'); G.rect(hx - 3, hy - 6, 6, 2, '#2a2228'); break;
    case 'hood': top(hy - 0.5, L.hoodC); break;
    case 'tall': top(hy - 1.5, L.hoodC); G.poly([[hx - 3.5, hy - 3], [hx + 3.5, hy - 3], [hx + 0.6, hy - 10], [hx - 0.6, hy - 10]], L.hoodC); break;
    case 'beast': G.poly([[hx - 4, hy - 2], [hx - 3, hy - 7], [hx - 1, hy - 3]], L.hair); G.poly([[hx + 4, hy - 2], [hx + 3, hy - 7], [hx + 1, hy - 3]], L.hair); if (!back) { G.set(hx - 2, hy, '#f0c020'); G.set(hx + 2, hy, '#f0c020'); G.rect(hx - 1, hy + 2, 2, 1, '#e8e0cc'); } break;
    case 'monk': if (L.hair && L.hair !== '#ece8e0' && L.beard) { for (const s of [-1, 1]) G.rect(hx + s * 4 - (s > 0 ? 0 : 1), hy - 1, 2, 4, L.hair); } G.set(hx - 2, hy - 3, lt(L.skin, 0.4)); break;
  }
  const c = G.canvas(); if (dir === 'right') { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const g = f.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f; } return c;
}
// the master on the white horse
function horseman(L, dir, step) {
  const side = dir === 'left' || dir === 'right', back = dir === 'up', st = step ? 1 : 0, G = grid(side ? 24 : 16, 26), cx = side ? 12 : 8, H = '#f8f8f2';
  G.ell(cx, 24.5, side ? 9 : 5, 1.4, 'rgba(0,0,0,0.3)', { out: false, shade: false });
  if (side) {
    for (const [x, s] of [[5, st], [8, 1 - st], [15, st], [18, 1 - st]]) G.rect(x, 19, 2, 5 - s, '#d8d8d0');
    G.ell(12, 16, 8, 4, H); G.shape((x, y) => x > 1 && x < 6 && y > 6 && y < 17 && x > 1 + (17 - y) * 0.1, H); G.ell(3, 7.5, 2.8, 2, H); G.set(2, 7, OUT);
    G.rect(19, 13, 3, 7, '#e0dcd0'); G.rect(8, 12, 9, 2, '#c83a2a');
  } else {
    G.rect(4, 18, 2, 6 - st, '#d8d8d0'); G.rect(10, 18, 2, 5 + st, '#d8d8d0'); G.ell(8, 16, 5, 4.4, H);
    if (!back) { G.ell(8, 12, 2.6, 4, H); G.set(7, 11, OUT); G.set(9, 11, OUT); }
  }
  // the rider
  const rx = side ? 12 : 8;
  G.shape((x, y) => y > 6 && y < 14 && Math.abs(x - rx) < 3.6 + (y - 6) * 0.15, (x, y) => (x % 3 === 0 || y === 10 ? '#e2b040' : L.robe));
  G.ell(rx, 4, 3.6, 3.4, back ? '#f0c040' : L.skin);
  if (!back) { if (side) G.set(dir === 'left' ? rx - 2 : rx + 2, 4, OUT); else { G.set(rx - 1.5, 4, OUT); G.set(rx + 1.5, 4, OUT); } }
  G.rect(rx - 3, 1, 6, 2, '#f0c040'); for (const x of [-2, 0, 2]) G.set(rx + x, 0, '#f0c040');
  const c = G.canvas(); if (dir === 'right') { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const g = f.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f; } return c;
}
