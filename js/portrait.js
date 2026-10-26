// Portraits in the manner of the old strategy games: a small bust drawn square by square on a 32 by 40 grid, every
// shape in a dark outline, flat colours lit from the upper left, on a pale ground in the colour of the sitter's world.
// People take a face colour, a hat, hair and beard; beasts a species — the shape of the head, ears, horns, muzzle,
// nose, teeth and markings. Each portrait is drawn once and kept.
import { rng, hash } from './util.js';
import { grid, OUT, mixC, dk, lt } from './px.js';
import { CAST } from './data/cast.js';

const GW = 32, GH = 40, S = 10, CACHE = new Map(), cx = 16;
const SKIN = { y: '#eeaa74', w: '#f6c89c', r: '#d8704c', d: '#c48254', b: '#8a5a38', g: '#eeaa74', p: '#fcd6b8', gold: '#f0c04c', blue: '#6c94c8', green: '#86b46c', grey: '#d0ccc8' };
const HAIR = { red: '#c8401c', gold: '#e0a830', white: '#ece8e0', purple: '#7a3a8a' };
const GROUND = { hero: '#ecd4a0', heaven: '#c4d2ee', buddha: '#f2e2a8', demon: '#d2b4cc', mortal: '#dcd2bc', dragon: '#b0d8d2', hell: '#c0c8b0', fox: '#e8bcc4' };
const ROBE = { hero: '#8a5a2a', heaven: '#3a5a9a', buddha: '#c87a20', demon: '#5a3a5a', mortal: '#6a5a3a', dragon: '#2a6a6a', hell: '#3a4a3a', fox: '#8a3a4a' };
const GOLD = '#f0c040', WHITE = '#f8f6f0', BONE = '#eadfc4', LIP = '#9a3a30';

export function portrait(id) {
  const p = CAST[id]; if (!p) return null; if (CACHE.has(id)) return CACHE.get(id);
  const G = grid(GW, GH), R = rng(hash(id) ^ 0x51ed), L = p.look || {};
  const bg = GROUND[p.side] || '#d8d0c8';
  for (let y = 0; y < GH; y++) G.rect(0, y, GW, 1, mixC(bg, '#ffffff', Math.max(0, 0.3 - y / 90)));
  if (L.halo) halo(G, p.beast ? 13 : L.hat === 'buddha' ? 14 : 13, bg);
  if (p.beast) beast(G, p, L, R); else person(G, p, L, R);
  // the frame
  for (let x = 0; x < GW; x++) { G.set(x, 0, '#3a2418'); G.set(x, GH - 1, '#3a2418'); }
  for (let y = 0; y < GH; y++) { G.set(0, y, '#3a2418'); G.set(GW - 1, y, '#3a2418'); }
  const c = G.canvas(S); CACHE.set(id, c); return c;
}

function halo(G, r, bg) { G.shape((x, y) => Math.hypot(x - cx, y - 16) <= r, (x, y) => (Math.hypot(x + 0.5 - cx, y + 0.5 - 16) > r - 1.6 ? GOLD : mixC(bg, '#fff4c0', 0.7)), { out: '#c89020', shade: false }); }
const dseg = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); return [Math.hypot(x - ax - dx * t, y - ay - dy * t), t]; };
// a thick line through points, its width r(t) along the way
function stroke(G, pts, r, col, o) { const n = pts.length - 1; return G.shape((x, y) => { for (let i = 0; i < n; i++) { const [d, t] = dseg(x, y, pts[i], pts[i + 1]); if (d <= (typeof r === 'function' ? r((i + t) / n) : r)) return true; } return false; }, col, o); }
const mir = (pts) => pts.map(([x, y]) => [2 * cx - x, y]);

// ---------------------------------------------------------------- the body: a robe, a kasaya, a tiger skin or armour
function body(G, p, L, R, o) {
  const wide = o.burly ? 17 : o.female ? 14 : 16, armour = o.armour;
  const robe = L.robe || ROBE[p.side] || '#5a5a6a';
  const metal = p.side === 'heaven' || p.side === 'buddha' ? '#d8a840' : p.side === 'dragon' ? '#6aa0a8' : '#8e8e9c';
  const col = (x, y) => {
    if (armour) return y % 3 === 1 ? dk(metal, 0.24) : metal;
    if (robe === 'kasaya') return x % 5 === 1 || y % 4 === 1 ? '#e2b040' : '#c0382a';
    if (robe === 'tiger') return (x * 0.8 + y * 1.4) % 5 < 1.1 ? '#3a2010' : '#e8a830';
    return robe;
  };
  G.shape((x, y) => y >= 31 && ((x - cx) / wide) ** 2 + ((y - 40.5) / 9.5) ** 2 <= 1, col);
  if (armour) {
    for (const sd of [-1, 1]) G.ell(cx + sd * (wide - 5), 34.5, 4.6, 3.4, (x, y) => (y === 35 ? dk(metal, 0.2) : metal));
    G.ell(cx, 36, 2.3, 2.3, (x, y) => (x < cx && y < 36 ? WHITE : GOLD), { shade: false });
    G.rect(cx - 4, 31, 8, 1, '#b83a2a');
  } else if (robe !== 'tiger') {
    // the crossed collar of a robe, the right side over the left
    const cc = robe === 'kasaya' ? '#e8c050' : o.female ? lt(robe, 0.5) : WHITE;
    G.shape((x, y) => y >= 31 && y <= 37 && Math.abs(x - (cx - 4 + (y - 31) * 0.75)) < 1, cc, { out: false });
    G.shape((x, y) => y >= 31 && y <= 35 && Math.abs(x - (cx + 3.6 - (y - 31) * 0.95)) < 1, cc, { out: false });
    G.shape((x, y) => y >= 31 && y < 34 && x > cx - 3.4 + (y - 31) * 0.75 && x < cx + 2.6 - (y - 31) * 0.95, o.skin, { out: false, shade: false });
    if (robe === 'kasaya') G.ell(cx - 6, 34.5, 1.5, 1.5, GOLD);
  }
  if (L.gems) for (let i = 0; i <= 8; i++) { const x = cx - 4.5 + i * 1.1, y = 34.2 - ((x - cx) / 4.5) ** 2 * 2.2; G.set(x, y, ['#e84a3a', GOLD, '#3ab87a', GOLD][i % 4]); }
  if (L.skulls) for (let i = 0; i < 6; i++) { const x = cx - 8.5 + i * 3.4, y = 33.5 + (1 - ((x + 1.5 - cx) / 9) ** 2) * 2.4; G.ell(x + 1.5, y + 1, 1.5, 1.3, BONE, { shade: false }); G.set(x + 1, y + 1, OUT); G.set(x + 2, y + 1, OUT); }
}

// ---------------------------------------------------------------- people
function person(G, p, L, R) {
  const female = !!L.female, burly = p.wu >= 86 && !female, old = L.hair === 'white';
  const monster = ['blue', 'green', 'r', 'grey'].includes(L.face) && p.side !== 'heaven';
  const fierce = !female && (p.wu - p.zhi > 28 || ((p.side === 'demon' || p.side === 'hell') && p.wu >= p.zhi)), wise = p.zhi - p.wu > 25;
  const skin = SKIN[L.face] || SKIN.y, hair = HAIR[L.hair] || ['#2a2024', '#3a2a22', '#241c1c'][R.int(0, 2)];
  const rx = female ? 6.7 : burly ? 8.1 : 7.4, ry = 9.1, fcy = 19.6, hat = L.hat || (female ? 'female' : 'top');
  const head = (x, y, e = 0) => { const dy = (y - fcy) / (ry + e), k = dy > 0 ? 1 - 0.3 * dy * dy : 1; return ((x - cx) / ((rx + e) * k)) ** 2 + dy * dy <= 1; };
  const armour = hat === 'helm' || L.armour;
  // behind: long hair, veils, hoods, the cheek guards of a helmet
  if (hat === 'female' || hat === 'hair' || hat === 'horns') G.shape((x, y) => y > 12 && y < 35 && ((x - cx) / (rx + 2.6)) ** 2 + ((y - 21) / 13) ** 2 <= 1, (x, y) => ((x + y) % 5 === 0 ? dk(old ? '#dcd8d0' : hair, 0.15) : old ? '#dcd8d0' : hair));
  if (hat === 'bodhi' || hat === 'scarf') { const vc = hat === 'bodhi' ? WHITE : L.scarf || (p.side === 'mortal' ? '#a8865a' : '#d8d2c4'); G.shape((x, y) => (y > 10 && y < (hat === 'bodhi' ? 34 : 27) && Math.abs(x - cx) < rx + 3.2 - Math.max(0, 16 - y) * 0.5) || head(x, y, 2.4), vc); }
  if (hat === 'helm') for (const sd of [-1, 1]) G.rect(sd < 0 ? cx - rx - 2 : cx + rx, 14, 2, 9, p.side === 'heaven' ? '#d8a840' : '#8e8e9c');
  if (hat === 'vinu') for (const sd of [-1, 1]) stroke(G, [[cx + sd * 6.6, 13.5], [cx + sd * 9.6, 20], [cx + sd * 10.4, 30]], 0.8, '#c83a2a');
  body(G, p, L, R, { burly, female, armour, skin });
  G.shape((x, y) => y > 26 && y < 32 && Math.abs(x - cx) < (female ? 2.6 : 3.4), dk(skin, 0.18));
  const bh = old ? WHITE : hair, bcol = (x, y) => ((x * 3 + y) % 5 === 0 ? dk(bh, 0.14) : bh);
  if (L.beard === 'long') stroke(G, [[cx, 26], [cx, 36.5]], (t) => 4.6 - t * 2.8, bcol);
  // ears, then the face
  for (const sd of [-1, 1]) G.ell(cx + sd * (rx + 0.3), L.lobes ? 22 : 20.5, 1.5, L.lobes ? 4.2 : 2.2, skin);
  G.shape((x, y) => head(x, y), skin);
  if (old || p.lv > 60) { G.set(11, 23, dk(skin, 0.2)); G.set(20, 23, dk(skin, 0.2)); }
  // the eyes and brows
  const close = R() < 0.3 ? 1 : 0, eY = 19, eyeC = monster || (p.side === 'demon' && fierce) ? '#a82020' : '#2a1a14';
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? 11 + close : 18 - close;
    for (let i = 0; i < 3; i++) { G.set(x0 + i, eY - 1, OUT); G.set(x0 + i, eY, i === (sd < 0 ? 2 : 0) ? eyeC : WHITE); }
    if (female) G.set(sd < 0 ? x0 - 1 : x0 + 3, eY - 1, OUT);
    const bc = old ? '#f0ece8' : dk(hair, 0.1), inner = sd < 0 ? x0 + 3 : x0 - 1, outer = sd < 0 ? x0 - 1 : x0 + 3;
    if (!female) for (let i = 0; i <= 4; i++) { const x = outer + (inner - outer) * i / 4, y = fierce ? eY - 4 + Math.round(i / 2.2) : wise ? eY - 3 - (i > 0 && i < 4 ? 1 : 0) : eY - 3; G.set(x, y, bc); if ((burly || fierce) && i > 1) G.set(x, y - 1, bc); }
    else for (let i = 1; i <= 3; i++) G.set(outer + (inner - outer) * i / 4, eY - 3, dk(hair, 0.05));
  }
  // nose, mouth, cheeks
  G.set(16, 21, dk(skin, 0.2)); G.set(16, 22, dk(skin, 0.26)); G.set(15, 22, dk(skin, 0.2));
  const mY = 25;
  if (female) { G.set(15, mY, '#d0484c'); G.set(16, mY, '#d0484c'); G.set(10, 22, '#f2a094'); G.set(21, 22, '#f2a094'); }
  else if (fierce) { for (let x = 14; x <= 17; x++) G.set(x, mY, LIP); G.set(13, mY + 1, LIP); G.set(18, mY + 1, LIP); if (monster) { G.set(14, mY + 1, WHITE); G.set(17, mY + 1, WHITE); } }
  else if (wise) { for (let x = 14; x <= 17; x++) G.set(x, mY, LIP); G.set(13, mY - 1, LIP); G.set(18, mY - 1, LIP); }
  else for (let x = 14 + (R() < 0.5 ? 0 : 1); x <= 17; x++) G.set(x, mY, LIP);
  // beards
  if (L.beard === 'stub') G.shape((x, y) => head(x, y) && y > 23 && (Math.floor(x) + Math.floor(y)) % 2 === 0 && !(Math.floor(y) === mY && Math.abs(x - cx) < 2.6), mixC(skin, bh, 0.45), { out: false, shade: false });
  if (L.beard === 'full') { G.shape((x, y) => y > 23.5 && (head(x, y, 0.5) || (y < 30 + (Math.floor(x) % 2) && Math.abs(x - cx) < 6.5 - (y - 27) * 1.2)) && !(y > mY && y < mY + 1 && Math.abs(x - cx) < 2.2), bcol); for (let x = 14; x <= 17; x++) G.set(x, mY, '#4a1a18'); }
  if (L.beard === 'goatee' || L.beard === 'long') { G.shape((x, y) => (y > 23 && y < 24.9 && Math.abs(x - cx) < 3.4 && Math.abs(x - cx) > 0.6) || (y > 23 && y < 27 && Math.abs(x - cx) > 2.4 && Math.abs(x - cx) < 3.5), bcol, { shade: false }); if (L.beard === 'goatee') G.shape((x, y) => y > 26.5 && y < 31 && Math.abs(x - cx) < 2.2 - (y - 27) * 0.35, bcol); for (let x = 14; x <= 17; x++) G.set(x, mY, '#4a1a18'); }
  // marks of the gods
  if (L.urna) { G.set(15, 15, '#e84a30'); G.set(16, 15, '#e84a30'); }
  if (L.eye3) G.shape((x, y) => Math.abs(x - cx) < 1 && y > 13 && y < 16, (x, y) => (y === 14 ? '#c82020' : WHITE), { shade: false });
  hats(G, p, L, { hat, hair, skin, rx, head, old });
}

function hats(G, p, L, o) {
  const { hat, hair, head, rx } = o, hcol = (x, y) => ((x * 2 + y) % 6 === 0 ? dk(hair, 0.18) : hair);
  const cap = (low, col, e = 0.7, side = 0) => G.shape((x, y) => head(x, y, e) && (y < low || (side && Math.abs(x - cx) > rx - 1.2 && y < low + side)), col);
  switch (hat) {
    case 'top': cap(13.5, hcol, 0.6, 4); G.ell(cx, 9.6, 2.4, 2, hcol); G.rect(cx - 1, 10, 2, 1, '#c83a2a'); break;
    case 'monk':
      if (L.hair && L.hair !== 'white') G.shape((x, y) => head(x, y, 1.2) && !head(x, y, -0.2) && y > 13 && y < 22, hcol);
      if (!L.halo) for (const [x, y] of [[14, 12], [16, 12], [18, 12], [15, 13], [17, 13]]) G.set(x - 0.5, y, dk(o.skin, 0.22));
      G.set(12, 12, lt(o.skin, 0.4)); G.set(13, 11, lt(o.skin, 0.4)); break;
    case 'vinu':
      G.rect(9, 12, 14, 2, GOLD);
      for (const [x, top] of [[10.5, 8], [13.5, 6.5], [16, 5.5], [18.5, 6.5], [21.5, 8]]) G.shape((px, py) => py > top && py < 13 && Math.abs(px - x) < 1.9 - Math.max(0, top + 2 - py) * 0.5, (px, py) => (Math.abs(px - x) < 0.8 && py > top + 2 && py < top + 4 ? (x === 16 ? '#3a6ac8' : '#c83a2a') : GOLD));
      break;
    case 'buddha': G.shape((x, y) => (head(x, y, 0.5) && y < 13.5) || ((x - cx) / 3.4) ** 2 + ((y - 9) / 2.6) ** 2 <= 1, (x, y) => ((x + (y % 2)) % 2 === 0 ? '#5a6ab8' : '#34408a')); break;
    case 'bodhi': cap(13, '#2a2024', 0.2); G.shape((x, y) => head(x, y, 2.4) && y < 12.6, WHITE); G.ell(cx, 11, 1.6, 1.6, (x, y) => (y < 11 ? '#e84a3a' : GOLD)); break;
    case 'emperor':
      cap(13, '#2a2228', 0.6); G.rect(13, 7, 6, 4, '#2a2228'); G.shape((x, y) => y > 5 && y < 7.5 && x > 5.5 && x < 26.5, (x, y) => (y < 6 ? GOLD : '#2a2228'));
      for (let x = 7; x <= 25; x += 2) for (let y = 8; y <= 11; y++) G.set(x, y, ['#e84a3a', GOLD, '#3ab87a', WHITE][(x + y) % 4]); break;
    case 'crown': cap(13.5, hcol, 0.6, 3); G.shape((x, y) => (y > 9.5 && y < 12.5 && Math.abs(x - cx) < 6) || [11, 16, 21].some((t) => y > 6.5 && y <= 10 && Math.abs(x - t) < 1.5 - (10 - y) * 0.15), GOLD); G.set(16, 10, '#e84a3a'); G.set(15, 10, '#e84a3a'); break;
    case 'helm': { const m = p.side === 'heaven' ? '#d8a840' : '#8e8e9c', low = L.eye3 ? 12.6 : 14.4; G.shape((x, y) => head(x, y, 1.1) && y < low, (x, y) => (Math.floor(y) === Math.floor(low - 0.1) ? dk(m, 0.25) : Math.abs(x + 0.5 - cx) < 1 ? lt(m, 0.35) : m)); G.rect(15, 6, 2, 3, GOLD); G.ell(cx, 4.6, 2.2, 2, '#d83a2a'); break; }
    case 'band': cap(13.5, hcol, 0.6, 4); G.shape((x, y) => head(x, y, 0.8) && y > 12 && y < 14, L.bandC || '#c83a2a'); stroke(G, [[cx + rx, 13], [cx + rx + 3, 17]], 0.7, L.bandC || '#c83a2a'); break;
    case 'hair': case 'horns':
      G.shape((x, y) => (head(x, y, 1) && y < 14) || (y > 3 && y < 14 && x > 6 && x < 26 && y > 4 + Math.abs(((x * 0.7) % 3) - 1.5) * 3.4 + Math.abs(x - cx) * 0.35), hcol);
      G.shape((x, y) => head(x, y, 1.4) && !head(x, y, -0.3) && y > 12 && y < 22, hcol);
      if (hat === 'horns') for (const s of [-1, 1]) stroke(G, [[cx + s * 4, 9], [cx + s * 7, 4], [cx + s * 8, 0]], (t) => 1.7 - t * 1.3, (x, y) => (y < 3 ? dk(BONE, 0.2) : BONE));
      break;
    case 'official': G.shape((x, y) => (head(x, y, 0.6) && y < 13.5) || ((x - cx) / 4.8) ** 2 + ((y - 9.5) / 3.2) ** 2 <= 1, '#262028'); for (const s of [-1, 1]) G.shape((x, y) => y > 9 && y < 11.2 && (s < 0 ? x > 2 && x < 9 : x > 23 && x < 30), '#262028'); break;
    case 'scholar': G.shape((x, y) => (head(x, y, 0.7) && y < 13.4) || (y > 6.5 && y < 13 && Math.abs(x - cx) < 5.6), (x, y) => (y > 11.5 ? '#5a4a3a' : '#3a3440')); break;
    case 'taoist': cap(13.5, hcol, 0.6, 3); G.ell(cx, 8.4, 2.8, 2.4, hcol); G.rect(14, 7, 4, 2, '#d8b040'); stroke(G, [[10.5, 8.5], [21.5, 7.5]], 0.5, BONE); break;
    case 'scarf': { const vc = L.scarf || (p.side === 'mortal' ? '#a8865a' : '#d8d2c4'); G.shape((x, y) => head(x, y, 2.4) && y < 13.4, vc); G.shape((x, y) => y > 12 && y < 14 && head(x, y, 2.4), dk(vc, 0.15), { out: false }); break; }
    case 'female': {
      const hc = o.old ? '#dcd8d0' : hair;
      G.shape((x, y) => head(x, y, 0.7) && (y < 13.5 || (Math.abs(x - cx) > rx - 1.6 && y < 20)), (x, y) => ((x + y * 2) % 7 === 0 ? dk(hc, 0.15) : hc));
      G.set(15, 12, dk(hc, 0.3)); G.set(15, 11, dk(hc, 0.3));
      const style = o.old ? 0 : hash(p.id) % 3;
      if (style === 0) G.ell(cx, 7.6, 3.8, 2.8, hc);
      if (style === 1) for (const sd of [-1, 1]) G.ell(cx + sd * 5.4, 8.6, 2.8, 2.6, hc);
      if (style === 2) { G.ell(cx, 6.2, 3, 3.6, hc); G.ell(cx, 9.6, 4.6, 1.8, hc); }
      if (L.gems && !o.old) { G.shape((x, y) => y > 9.5 && y < 11.5 && Math.abs(x - cx) < 5.5, GOLD); for (const t of [cx - 3.5, cx, cx + 3.5]) G.shape((x, y) => y > 7 && y <= 10 && Math.abs(x - t) < 1.2 - (10 - y) * 0.2, GOLD); G.set(15, 10, '#e84a3a'); G.set(16, 10, '#e84a3a'); for (const sd of [-1, 1]) for (let y = 12; y < 16; y++) G.set(sd < 0 ? cx - 6.5 : cx + 5.5, y, y % 2 ? '#e84a3a' : GOLD); }
      else if (!o.old) { stroke(G, style === 1 ? [[8, 9], [12, 7]] : [[11, 8], [23, 6]], 0.5, GOLD); G.ell(style === 1 ? 22 : 21.5, 9.5, 1.3, 1.3, ['#e85a6a', '#f0a0c0', '#ffffff'][hash(p.id + 'f') % 3], { shade: false }); }
      for (const sd of [-1, 1]) G.set(sd < 0 ? cx - rx - 1 : cx + rx, 23, '#e8c050'); break; }
    case 'child': G.shape((x, y) => y > 11 && y < 14 && Math.abs(x - cx) < 2.5 && head(x, y, 0.5), '#2a2024'); for (const sd of [-1, 1]) { G.ell(cx + sd * 5.5, 9.4, 2.6, 2.5, '#2a2024'); G.rect(sd < 0 ? 9 : 21, 11, 2, 1, '#d83a2a'); } break;
  }
}

// ---------------------------------------------------------------- beasts
export const SPECIES = {
  monkey: { fur: '#b8782c', pale: '#f6d2a8', skin: '#f2c49a', eye: '#e8b020', hw: 27, hh: 32, mz: 0.35, mw: 13, nose: 'flat', ears: 'side', mask: true, slant: true },
  pig:    { fur: '#6e6070', pale: '#a8949c', eye: '#3a2010', hw: 33, hh: 33, mz: 0.75, mw: 15, nose: 'pig', ears: 'flop', fang: 'up', small: true, jowl: true },
  bear:   { fur: '#3a302c', pale: '#9a7a5a', eye: '#3a1a08', hw: 32, hh: 33, mz: 0.7, mw: 13, nose: 'pad', ears: 'round', small: true, fluff: true },
  tiger:  { fur: '#e0882a', pale: '#f8f0dc', eye: '#e8c020', hw: 32, hh: 32, mz: 0.6, mw: 16, nose: 'pad', ears: 'point', pattern: 'stripe', fang: 'down', whisk: true, slant: true, fluff: true },
  leopard:{ fur: '#e0a840', pale: '#f8f0dc', eye: '#e8d040', hw: 29, hh: 31, mz: 0.55, mw: 14, nose: 'pad', ears: 'point', pattern: 'spot', fang: 'down', whisk: true, slant: true },
  wolf:   { fur: '#8a8480', pale: '#e8e4dc', eye: '#e8b030', hw: 27, hh: 32, mz: 1.0, mw: 11, nose: 'pad', ears: 'tall', fang: 'down', slant: true, fluff: true },
  fox:    { fur: '#e08030', pale: '#fcf8f0', eye: '#e8a020', hw: 26, hh: 30, mz: 0.95, mw: 10, nose: 'pad', ears: 'tall', slant: true, whisk: true },
  ox:     { fur: '#3a3436', pale: '#7a6a60', eye: '#e8a020', hw: 32, hh: 34, mz: 0.8, mw: 18, nose: 'bull', ears: 'cow', horns: 'bull', small: true },
  lion:   { fur: '#d09848', pale: '#f0dcb4', eye: '#e8a020', hw: 30, hh: 31, mz: 0.6, mw: 16, nose: 'pad', ears: 'round', mane: true, fang: 'down', whisk: true, slant: true },
  elephant:{ fur: '#b0aca8', pale: '#d0ccc4', eye: '#3a2010', hw: 32, hh: 34, mz: 0, mw: 14, nose: 'trunk', ears: 'big', fang: 'tusk', small: true },
  bird:   { fur: '#d0a030', pale: '#f4e4b4', eye: '#e8c020', hw: 24, hh: 31, mz: 0, mw: 8, nose: 'beak', ears: 'none', pattern: 'feather', crest: true, slant: true },
  deer:   { fur: '#e8e4dc', pale: '#fffaf0', eye: '#2a1a10', hw: 25, hh: 31, mz: 0.8, mw: 10, nose: 'pad', ears: 'leaf', horns: 'deer', big: true },
  rhino:  { fur: '#6a6c74', pale: '#8a8c94', eye: '#e8a020', hw: 33, hh: 33, mz: 0.8, mw: 17, nose: 'bull', ears: 'cow', horns: 'rhino', small: true },
  snake:  { fur: '#a03a22', pale: '#e8b070', eye: '#f0d020', hw: 25, hh: 28, mz: 0.8, mw: 12, nose: 'slit', ears: 'none', pattern: 'scale', slit: true, tongue: true },
  croc:   { fur: '#4a5a34', pale: '#b8b080', eye: '#d8c020', hw: 27, hh: 29, mz: 1.2, mw: 13, nose: 'slit', ears: 'none', pattern: 'scale', slit: true, fang: 'row' },
  fish:   { fur: '#e06a24', pale: '#fce4a8', eye: '#101010', hw: 28, hh: 31, mz: 0.3, mw: 14, nose: 'none', ears: 'fin', pattern: 'scale', big: true, barbel: true },
  dragon: { fur: '#3a8a74', pale: '#ecdca4', eye: '#f0c020', hw: 28, hh: 31, mz: 1.0, mw: 14, nose: 'slit', ears: 'fin', horns: 'dragon', pattern: 'scale', fang: 'down', barbel: true, mane: 'fin', slant: true },
  marten: { fur: '#d0a844', pale: '#f4e4b8', eye: '#2a1a08', hw: 25, hh: 28, mz: 0.65, mw: 10, nose: 'pad', ears: 'round', whisk: true },
  mouse:  { fur: '#eae6e2', pale: '#fff8f8', eye: '#c83040', hw: 25, hh: 28, mz: 0.7, mw: 10, nose: 'mouse', ears: 'mouse', whisk: true, big: true },
  dog:    { fur: '#3a3a3a', pale: '#d0c8b8', eye: '#e8a020', hw: 26, hh: 31, mz: 0.95, mw: 11, nose: 'pad', ears: 'tall', fang: 'down', slant: true },
  turtle: { fur: '#6a7a44', pale: '#d0c890', eye: '#2a1a08', hw: 25, hh: 28, mz: 0.45, mw: 13, nose: 'slit', ears: 'none', pattern: 'scale', small: true },
  hou:    { fur: '#e8b844', pale: '#fcecc0', eye: '#e84020', hw: 30, hh: 31, mz: 0.65, mw: 15, nose: 'pad', ears: 'point', mane: true, fang: 'down', horns: 'one', slant: true },
};

function beast(G, p, L, R) {
  const base = SPECIES[L.species] || SPECIES.wolf, sp = { ...base, ...(L.fur ? { fur: L.fur } : {}), ...(L.pale ? { pale: L.pale } : {}), ...(L.eye ? { eye: L.eye } : {}), ...(L.horns ? { horns: L.horns } : {}) };
  const fur = sp.fur, pale = sp.pale, skin = sp.skin || pale, hcy = 19.4;
  const rx = Math.max(6.6, Math.min(9.6, sp.hw * 0.29)), ry = Math.max(7.6, Math.min(9.6, sp.hh * 0.285)), top = hcy - ry;
  const head = (x, y, e = 0) => { const dy = (y - hcy) / (ry + e); let k = dy > 0 ? (sp.jowl ? 1 + 0.08 * dy : L.species === 'bird' ? 1 - 0.32 * dy * dy : 1 - 0.18 * dy * dy) : 1; if (sp.fluff && dy > -0.1 && dy < 0.75 && Math.floor(y) % 2 === 0) k += 0.1; return ((x - cx) / ((rx + e) * k)) ** 2 + dy * dy <= 1; };
  const furC = (x, y) => {
    const ax = Math.abs(x + 0.5 - cx);
    if (sp.pattern === 'stripe' && ((y < top + 5 && ax < 0.8 && y > top + 1) || (ax > rx * 0.62 && y % 3 === 0 && y > top + 3 && y < hcy + 4))) return '#2a1a10';
    if (sp.pattern === 'spot' && (x * 7 + y * 13) % 11 === 0) return dk(fur, 0.45);
    if (sp.pattern === 'scale' && y % 2 === 0 && (x + (y >> 1)) % 2 === 0) return dk(fur, 0.16);
    if (sp.pattern === 'feather' && y % 3 === 0 && (x + y) % 4 < 2) return dk(fur, 0.12);
    return fur;
  };
  // behind the head: the extra heads, the mane, the fins of a dragon
  if (L.heads) for (let i = 0; i < Math.min(4, L.heads); i++) { const hx = [6, 26, 4.5, 27.5][i], hy = [9, 9, 18, 18][i]; G.ell(hx, hy, 3.4, 3.2, furC); G.set(hx - 1.5, hy - 0.5, sp.eye); G.set(hx + 0.5, hy - 0.5, sp.eye); if (sp.nose === 'beak') G.rect(hx - 0.5, hy + 1, 1, 2, '#e8b830'); else G.rect(hx - 1, hy + 1, 2, 1, pale); }
  if (sp.mane === true) { const mc = dk(fur, 0.28); G.shape((x, y) => { const a = Math.atan2(y - hcy, x - cx); return ((x - cx) / (rx + 3.6)) ** 2 + ((y - hcy - 1) / (ry + 3.4)) ** 2 <= 1 + 0.2 * Math.sin(a * 11); }, (x, y) => ((x + y) % 3 === 0 ? dk(mc, 0.15) : mc)); }
  if (sp.mane === 'fin') for (const sd of [-1, 1]) stroke(G, [[cx + sd * (rx - 1), hcy + 2], [cx + sd * (rx + 4), hcy + 6], [cx + sd * (rx + 2), hcy + 10]], 1.3, lt(fur, 0.2));
  body(G, p, L, R, { burly: sp.hw >= 31, armour: !!L.armour, skin: pale, female: false });
  if (!L.robe && !L.armour) G.ell(cx, 40, 6, 5.5, pale, { shade: false });
  G.shape((x, y) => y > 26 && y < 32 && Math.abs(x - cx) < 4, dk(fur, 0.1));
  // ears behind the head
  const e = sp.ears, eL = (pts, col, o) => { G.poly(pts, col, o); G.poly(mir(pts), col, o); };
  if (e === 'side') for (const sd of [-1, 1]) { G.ell(cx + sd * (rx + 0.8), hcy - 0.5, 2.4, 2.8, skin); G.ell(cx + sd * (rx + 1), hcy - 0.5, 0.9, 1.4, dk(skin, 0.25), { out: false, shade: false }); }
  if (e === 'round') for (const sd of [-1, 1]) { G.ell(cx + sd * (rx - 1.8), top + 1.6, 2.8, 2.6, fur); G.ell(cx + sd * (rx - 1.8), top + 1.6, 1.2, 1.1, dk(pale, 0.1), { out: false, shade: false }); }
  if (e === 'point' || e === 'tall') { const tip = e === 'tall' ? top - 5.5 : top - 2.8; eL([[cx - rx + 0.8, top + 4], [cx - rx + 1.6, tip], [cx - rx + 5.2, top + 2.2]], fur); eL([[cx - rx + 2.2, top + 3], [cx - rx + 2.2, tip + 2.4], [cx - rx + 4.2, top + 2.4]], dk(fur, 0.35), { out: false, shade: false }); }
  if (e === 'cow') for (const sd of [-1, 1]) G.ell(cx + sd * (rx + 2), hcy - 3, 3.2, 1.6, fur);
  if (e === 'big') for (const sd of [-1, 1]) { G.ell(cx + sd * (rx + 2.6), hcy + 1, 4.6, 7.6, fur); G.ell(cx + sd * (rx + 3), hcy + 1, 2.6, 5.2, '#d8a8a4', { out: false }); }
  if (e === 'leaf') eL([[cx - rx + 2, top + 4], [cx - rx - 5, top], [cx - rx + 1, top + 6.5]], fur);
  if (e === 'fin') eL([[cx - rx + 1, hcy - 3], [cx - rx - 5, hcy - 7], [cx - rx - 3, hcy - 3], [cx - rx - 6, hcy], [cx - rx + 0.5, hcy + 3]], lt(pale, 0.1));
  if (e === 'mouse') for (const sd of [-1, 1]) { G.ell(cx + sd * (rx - 0.8), top + 0.4, 3.8, 3.6, fur); G.ell(cx + sd * (rx - 0.8), top + 0.6, 2.2, 2.1, '#f0b0b8', { out: false, shade: false }); }
  // the head
  G.shape((x, y) => head(x, y), furC);
  const mh = 2 + sp.mz * 2.1, mw = sp.mw * 0.27, my = hcy + ry * 0.4, mt = my - mh;
  if (sp.mask) G.shape((x, y) => (Math.hypot(x - (cx - 3.2), y - 18.2) < 3.6 || Math.hypot(x - (cx + 3.2), y - 18.2) < 3.6 || ((x - cx) / (mw + 1.8)) ** 2 + ((y - my) / (mh + 2)) ** 2 <= 1) && head(x, y, -0.8), skin, { out: dk(fur, 0.3) });
  if (sp.nose !== 'trunk' && sp.nose !== 'beak') G.ell(cx, my, mw, mh, pale, { out: sp.mask ? dk(skin, 0.3) : dk(fur, 0.5) });
  // eyes
  const eY = Math.round(hcy - ry * 0.12), ex = Math.max(2.6, rx * 0.44), eye = L.fireEyes ? '#ff5020' : sp.eye;
  for (const sd of [-1, 1]) {
    const wdt = sp.big ? 3 : 2, x0 = Math.round(cx + sd * ex - wdt / 2), xs = Array.from({ length: wdt }, (_, i) => x0 + i);
    if (sp.small) { G.set(xs[0], eY - 1, OUT); G.set(xs[1], eY - 1, OUT); G.set(sd < 0 ? xs[0] : xs[1], eY, WHITE); G.set(sd < 0 ? xs[1] : xs[0], eY, eye === '#3a2010' || eye === '#3a1a08' ? OUT : eye); G.set(sd < 0 ? xs[0] - 1 : xs[1] + 1, eY - 2, OUT); G.set(sd < 0 ? xs[1] + 1 : xs[0] - 1, eY - 1, OUT); continue; }
    for (const x of xs) { G.set(x, eY - 1, OUT); G.set(x, eY, eye); if (sp.big) G.set(x, eY + 1, eye); }
    const pu = sp.slit ? xs[Math.floor(wdt / 2)] : sd < 0 ? xs[wdt - 1] : xs[0]; G.set(pu, eY, OUT); if (sp.big) { G.set(pu, eY + 1, OUT); G.set(sd < 0 ? xs[0] : xs[wdt - 1], eY, WHITE); }
    if (L.fireEyes) { G.set(xs[0] - 1, eY, '#ffd040'); G.set(xs[wdt - 1] + 1, eY, '#ffd040'); }
    if (sp.slant) { const inner = sd < 0 ? xs[wdt - 1] + 1 : xs[0] - 1, outer = sd < 0 ? xs[0] - 1 : xs[wdt - 1] + 1; G.set(outer, eY - 2, OUT); for (const x of xs) G.set(x, eY - 2, OUT); G.set(inner, eY - 1, OUT); }
  }
  // nose and mouth
  const n = sp.nose, nY = Math.round(mt + 0.6);
  if (n === 'flat') { G.set(15, nY + 1, OUT); G.set(16, nY + 1, OUT); }
  if (n === 'pad') { G.rect(14, nY, 4, 1, '#2a1a1a'); G.rect(15, nY + 1, 2, 1, '#2a1a1a'); G.set(15, nY, '#6a5a5a'); }
  if (n === 'bull') { G.ell(cx, nY + 1.4, 4.2, 1.8, dk(pale, 0.25)); G.set(13, nY + 1, OUT); G.set(18, nY + 1, OUT); if (L.crown) { G.set(15, nY + 3, GOLD); G.set(16, nY + 3, GOLD); } }
  if (n === 'pig') { G.ell(cx, hcy + 3.4, 3.6, 2.4, mixC(pale, '#f0a0a0', 0.45)); G.rect(14, Math.round(hcy + 3), 1, 2, OUT); G.rect(17, Math.round(hcy + 3), 1, 2, OUT); }
  if (n === 'slit' || n === 'mouse') { const nc = n === 'mouse' ? '#e07a8a' : OUT; G.set(14, nY, nc); G.set(17, nY, nc); if (n === 'mouse') { G.set(15, nY, nc); G.set(16, nY, nc); } }
  const mY = Math.round(my + mh * 0.5), mx = Math.max(1.5, mw * 0.68);
  if (n !== 'beak' && n !== 'trunk' && n !== 'pig') for (let x = Math.round(cx - mx); x < Math.round(cx + mx); x++) G.set(x, mY, OUT);
  if (n === 'pig') for (let x = 13; x <= 18; x++) G.set(x, Math.round(hcy + 6.4), OUT);
  if (sp.fang === 'down') { G.set(cx - 2, mY + 1, WHITE); G.set(cx + 1, mY + 1, WHITE); }
  if (sp.fang === 'up') { const y = n === 'pig' ? Math.round(hcy + 6.4) : mY; for (const x of [12, 19]) { G.set(x, y, WHITE); G.set(x, y - 1, WHITE); } }
  if (sp.fang === 'row') for (let x = Math.round(cx - mx); x < Math.round(cx + mx); x += 2) G.set(x, mY + 1, WHITE);
  if (sp.tongue) { G.rect(15, mY + 1, 2, 2, '#d82a3a'); G.set(14, mY + 3, '#d82a3a'); G.set(17, mY + 3, '#d82a3a'); }
  if (sp.whisk) for (const sd of [-1, 1]) for (const dy of [0, 2]) G.line(cx + sd * (mw + 0.5), my + dy - 1, cx + sd * (mw + 4.5), my + dy - 2 + dy * 0.5, OUT);
  if (sp.barbel) for (const sd of [-1, 1]) stroke(G, [[cx + sd * mw, my], [cx + sd * (mw + 4), my + 2], [cx + sd * (mw + 5.5), my + 7]], 0.55, lt(pale, 0.1), { out: false });
  if (n === 'trunk') { stroke(G, [[cx, eY + 1], [cx, hcy + 8], [cx + 0.5, 31], [cx + 3, 33]], (t) => 2.6 - t * 1.2, (x, y) => (y % 2 === 0 ? dk(fur, 0.14) : fur)); if (sp.fang === 'tusk') for (const sd of [-1, 1]) stroke(G, [[cx + sd * 3, hcy + 4], [cx + sd * 5.5, hcy + 8], [cx + sd * 5, 30]], (t) => 1.2 - t * 0.6, BONE); }
  if (n === 'beak') { G.poly([[cx - 3.6, hcy + 0.4], [cx + 3.6, hcy + 0.4], [cx + 1, hcy + 7.4], [cx - 1, hcy + 8]], '#eab838'); G.rect(cx - 2, Math.round(hcy + 3), 4, 1, dk('#eab838', 0.4)); }
  // over the head: flop ears, horns, crests, caps and crowns
  if (e === 'flop') eL([[cx - rx + 5.5, top + 1], [cx - rx - 1.6, top - 1], [cx - rx + 0.2, top + 6.8]], dk(fur, 0.08));
  const h = sp.horns, hornC = (x, y) => (y < top - 3 ? dk(BONE, 0.2) : BONE);
  if (h === 'bull') { const pts = [[cx - 4, top + 2.5], [cx - 8, top + 0.5], [cx - 11.5, top - 3], [cx - 12, top - 7.5]]; stroke(G, pts, (t) => 1.9 - t * 1.4, hornC); stroke(G, mir(pts), (t) => 1.9 - t * 1.4, hornC); }
  if (h === 'deer' || h === 'dragon') { const hc = h === 'dragon' ? '#e8c860' : '#a8885a'; for (const pts of [[[cx - 3.5, top + 2], [cx - 5, top - 3], [cx - 7, top - 7]], [[cx - 5, top - 3], [cx - 9, top - 4.5]], [[cx - 6, top - 5.5], [cx - 4, top - 9]]]) { stroke(G, pts, 0.8, hc); stroke(G, mir(pts), 0.8, hc); } }
  if (h === 'rhino') G.poly([[cx - 2, mt + 1], [cx + 2, mt + 1], [cx + 0.6, mt - 5.5], [cx - 0.6, mt - 5.5]], hornC);
  if (h === 'one') G.poly([[cx - 1.8, top + 3.5], [cx + 1.8, top + 3.5], [cx + 0.4, top - 5], [cx - 0.4, top - 5]], hornC);
  if (h === 'ram') for (const sd of [-1, 1]) { const hx = cx + sd * (rx - 0.5), hy = top + 4; G.shape((x, y) => { const d = Math.hypot(x - hx, y - hy); return d < 4.3 && d > 1.6; }, (x, y) => (Math.hypot(x + 0.5 - hx, y + 0.5 - hy) < 2.9 ? dk(BONE, 0.2) : BONE)); }
  if (sp.crest) for (const [tx, ty, c] of [[cx - 4, top - 4, lt(fur, 0.2)], [cx + 4, top - 4, lt(fur, 0.2)], [cx, top - 6.5, '#d83a2a']]) stroke(G, [[cx, top + 2], [tx, ty]], (t) => 1.6 - t, c);
  if (L.cap) G.shape((x, y) => head(x, y, 0.6) && y < top + 4.2, L.cap);
  if (L.circlet) G.shape((x, y) => head(x, y, 0.3) && y > top + 3.5 && y < top + 5.5, (x, y) => (Math.abs(x + 0.5 - cx) < 1 ? '#e84a3a' : GOLD));
  if (L.crown) {
    if (L.species === 'monkey') { G.shape((x, y) => head(x, y, 0.7) && y < top + 4.4, (x, y) => (Math.abs(x + 0.5 - cx) < 1 && y > top + 1 ? '#e84a3a' : GOLD)); for (const sd of [-1, 1]) stroke(G, [[cx + sd * 4, top + 1], [cx + sd * 8, top - 5], [cx + sd * 13, top - 9.5]], (t) => 1.1 - t * 0.5, (x, y) => ((x + y) % 3 === 0 ? '#c83a2a' : '#f0ead8')); }
    else G.shape((x, y) => (y > top + 0.5 && y < top + 3.4 && Math.abs(x - cx) < 4.6) || [cx - 3.4, cx, cx + 3.4].some((t) => y > top - 2.6 && y <= top + 1 && Math.abs(x - t) < 1.1), (x, y) => (Math.abs(x + 0.5 - cx) < 0.8 && y > top + 1 ? '#e84a3a' : GOLD));
  }
}
