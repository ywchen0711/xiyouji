// Painted portraits of people, gods and buddhas: a bust in dramatic light — a warm key light from the upper left, a cool
// rim on the right, deep shadow — the face sculpted and lit pixel by pixel, beards drawn hair by hair, armour, robes,
// kasayas, crowns and veils, all on a smoky ground in the colour of the sitter's world, finished with brushwork.
// (The animal-headed demons are painted by beast.js with the same kit.)
import { rng, hash } from './util.js';

const W = 160, H = 200, CACHE = new Map();
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb = (r, g, b, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
const sh = (c, k, a = 1) => { const [r, g, b] = hex(c), f = (v) => (k > 1 ? v + (255 - v) * (k - 1) : v * k); return rgb(f(r), f(g), f(b), a); };
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
const mix = (a, b, t, al = 1) => { const A = hex(a), B = hex(b); return rgb(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t, al); };
const SKIN = { y: '#d8a27a', w: '#e8bc98', r: '#c0644a', d: '#a8714c', b: '#5e3c2a', g: '#d8a27a', p: '#f0cdb0', gold: '#e8b050', blue: '#6a88a8', green: '#8aa078', grey: '#b8b0a8' };
const HAIR = { red: '#8a3018', gold: '#b88a3a', white: '#d8d4cc', purple: '#5a3048' };
const SIDEC = { hero: '#7a5418', heaven: '#2a4a8a', buddha: '#9a7220', demon: '#4a2448', mortal: '#4a4032', dragon: '#1a5a5a', hell: '#24402a', fox: '#6a2a3a', ls: '#2a4a8a', song: '#8a2a22', bandit: '#5a4a32', zhu: '#7a5a22', zeng: '#4a5a4a', liao: '#4a3a5a', tian: '#6a4a22', wang: '#3a5a3a', fang: '#a85a1a', jin: '#2a3a3a', xia: '#6a5a2a', wander: '#3a5a6a', beast: '#3a3a3a' };

export function painted(p) {
  if (CACHE.has(p.id)) return CACHE.get(p.id);
  const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2; const g = c.getContext('2d'); g.scale(2, 2);
  const L = p.look || {}, R = rng(hash(p.id) ^ 0x9e37), female = !!L.female, side = SIDEC[p.side] || '#3a3a4a';
  const old = L.hair === 'white' || (p.lv >= 48 && (L.beard === 'long' || L.beard === 'goatee') && R() < 0.45);
  const menace = !female && p.side === 'bandit', fierce = menace || p.wu - p.zhi > 28, burly = p.wu >= 86 && !female, wise = !menace && p.zhi - p.wu > 25;
  const skin0 = SKIN[L.face] || SKIN.y, skin = mixHex(mixHex(skin0, R() < 0.5 ? '#c8906a' : '#e0b090', R() * 0.25), '#7a4428', menace ? 0.28 : 0), hairC = old ? '#cfcac0' : HAIR[L.hair] || ['#1e1814', '#2a201a', '#18140f'][R.int(0, 2)];
  const armour = L.hat === 'helm' || L.hat === 'fur' || ((p.troop === '騎' || p.wu > 80) && !wise && L.hat !== 'monk' && L.hat !== 'taoist' && L.hat !== 'scholar' && L.hat !== 'official' && !female && R() < 0.6);
  // proportions, slightly different for everyone
  const cx = 80 + R.int(-2, 2), jaw = (female ? 22 : burly ? 31 : 27) + R.int(-3, 3), eyeY = 90 + R.int(-3, 3), chin = female ? 133 + R.int(-1, 3) : (burly ? 143 : 138) + R.int(-4, 5), top = 46 + R.int(-2, 2), noseL = R.int(-3, 3), mouthW = R.int(-1, 2);
  const eyeGap = female ? 11.5 + R() * 0.8 : 13 + R.int(-1, 1), eyeW = female ? 8 : 7.5, scarK = menace ? R.int(0, 3) : 0, patch = menace && R() < 0.15;
  const beardK = menace && (!L.beard || L.beard === 'none') ? (R() < 0.6 ? 'stub' : 'full') : L.beard;
  // ---- the ground: smoke in the side's colour, darkening outward
  const bg = g.createRadialGradient(60, 70, 10, 80, 100, 150); bg.addColorStop(0, sh(side, 0.95)); bg.addColorStop(0.55, sh(side, 0.42)); bg.addColorStop(1, '#07070b'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H, r = 12 + R() * 36, sg = g.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, `rgba(255,240,220,${0.03 + R() * 0.05})`); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.save(); g.translate(80, 118); g.scale(1.36, 1.36); g.translate(-80, -108);
  if (L.halo) halo(g, R, cx, eyeY - 6, L.hat === 'buddha' ? 58 : 50);
  // ---- hair falling behind (women, wild hair, long-haired sorcerers)
  if (female || L.hat === 'hair' || L.hat === 'taoist' && R() < 0.5) { const hg = g.createLinearGradient(cx - jaw - 18, 0, cx + jaw + 18, 0); hg.addColorStop(0, sh(hairC, 1.1)); hg.addColorStop(1, sh(hairC, 0.45)); g.fillStyle = hg; g.beginPath(); g.moveTo(cx - jaw + 2, top + 8); g.bezierCurveTo(cx - jaw - 22, top + 30, cx - jaw - 20, 150, cx - jaw - 4, 178); g.quadraticCurveTo(cx, 186, cx + jaw + 4, 178); g.bezierCurveTo(cx + jaw + 20, 150, cx + jaw + 22, top + 30, cx + jaw - 2, top + 8); g.closePath(); g.fill(); strands(g, R, hairC, cx - jaw - 14, top + 30, cx + jaw + 14, 172, 60, 0.2); }
  // ---- the body
  body(g, R, p, L, { cx, side, armour, female, burly, skin });
  // ---- neck, in the shadow of the jaw
  const ng = g.createLinearGradient(cx - 14, 0, cx + 14, 0); ng.addColorStop(0, sh(skin, 0.62)); ng.addColorStop(0.45, sh(skin, 0.5)); ng.addColorStop(1, sh(skin, 0.28));
  { const nw0 = (female ? 9 : burly ? 15 : 12); g.fillStyle = ng; g.beginPath(); g.moveTo(cx - nw0, chin - 18); g.quadraticCurveTo(cx - nw0 - 1, chin + 6, cx - nw0 - 6, 158); g.lineTo(cx + nw0 + 6, 158); g.quadraticCurveTo(cx + nw0 + 1, chin + 6, cx + nw0, chin - 18); g.closePath(); g.fill(); if (!female) { g.strokeStyle = sh(skin, 0.55, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 5, chin + 8); g.quadraticCurveTo(cx - 3, chin + 14, cx - 6, 156); g.moveTo(cx + 6, chin + 8); g.quadraticCurveTo(cx + 4, chin + 14, cx + 7, 156); g.stroke(); } }
  soft2(g, cx, chin + 4, jaw * 0.85, 12, 'rgba(25,10,6,1)', 0.75);
  // ---- ears
  for (const sd of [-1, 1]) { g.fillStyle = sd < 0 ? sh(skin, 0.92) : sh(skin, 0.62); g.beginPath(); g.ellipse(cx + sd * (jaw + 1), eyeY + (L.lobes ? 13 : 6), 4.5, L.lobes ? 16 : 9, sd * 0.15, 0, Math.PI * 2); g.fill(); g.strokeStyle = sh(skin, 0.5, 0.6); g.lineWidth = 0.8; g.beginPath(); g.arc(cx + sd * (jaw + 1.5), eyeY + 6, 2.5, 0, Math.PI * 2); g.stroke(); }
  if (female) for (const sd of [-1, 1]) { g.fillStyle = '#e8c060'; g.beginPath(); g.arc(cx + sd * (jaw + 1), eyeY + 17, 1.6, 0, 7); g.fill(); g.fillStyle = '#c83a3a'; g.beginPath(); g.arc(cx + sd * (jaw + 1), eyeY + 21, 1.8, 0, 7); g.fill(); }
  // ---- the face, turned a little to our left: the near side wider, the features shifted, the far side in shadow
  const fo = -3, jl = jaw + 2, jr = jaw - 2, fx = cx + fo, dome = ['monk', 'vinu', 'child', 'buddha'].includes(L.hat) ? -17 : -4;
  const facePath = (q = g) => { q.beginPath(); q.moveTo(cx - jl, top + 34); q.bezierCurveTo(cx - jl - 1, eyeY + 16, cx - jl + (female ? 7 : 3), chin - 20, fx - (female ? 11 : burly ? 15 : 12), chin - 4); q.quadraticCurveTo(fx, chin + 3, fx + (female ? 10 : burly ? 13 : 10), chin - 5); q.bezierCurveTo(cx + jr - (female ? 6 : 2), chin - 18, cx + jr + 1, eyeY + 18, cx + jr, top + 34); q.bezierCurveTo(cx + jr - dome * 0.05, top + dome, cx - jl + dome * 0.05, top + dome, cx - jl, top + 34); q.closePath(); };
  const nb = eyeY + (female ? 19 : 22) + (burly ? 2 : 0) + (female ? noseL * 0.4 : noseL), nw = (burly ? 7 : female ? 4.5 : 6) + (noseL > 1 ? 0.8 : 0), nx = fx - 1;
  const my = nb + (female ? 8.5 : 12.5) - noseL * 0.3, mw = (female ? 7.5 : 9) + mouthW, mx = fx - 0.5;
  // the face is sculpted as a surface and lit, pixel by pixel: brow ridge, sockets, cheekbones, the nose, lips, chin
  sculpt(g, { cx, fx, top, chin, eyeY, eyeGap, jl, jr, nb, nw, nx, my, mw, mx, skin, female, burly, old, menace, fierce, facePath, face: L.face, shave: !female && beardK !== 'full' && beardK !== 'long' });
  g.save(); facePath(); g.clip();
  // the skin's grain: pores and freckles, a little uneven
  for (let i = 0; i < 700; i++) { g.fillStyle = R() < 0.5 ? 'rgba(255,230,200,0.05)' : 'rgba(70,25,12,0.06)'; const s = 0.4 + R() * 0.7; g.fillRect(cx - jl + R() * jl * 2, top + R() * (chin - top), s, s); }
  // age and hardship
  if (old || p.lv > 55 && !female) { g.strokeStyle = mixHex(skin, '#3a1208', 0.5); g.globalAlpha = 0.4; g.lineWidth = 0.6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(fx - 12, top + 18 + i * 4); g.quadraticCurveTo(fx, top + 16 + i * 4, fx + 12, top + 18 + i * 4); g.stroke(); } for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(nx + sd * (nw + 1), nb - 1); g.quadraticCurveTo(nx + sd * (nw + 6), my - 2, mx + sd * (mw + 3), my + 5); g.stroke(); for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(fx + sd * (eyeGap + 8), eyeY - 1 + i * 3); g.lineTo(fx + sd * (eyeGap + 12), eyeY + 1 + i * 4); g.stroke(); } } g.globalAlpha = 1; }
  if (menace) { // the frown knotted between the brows, a creased forehead, deep folds from nose to mouth
    g.strokeStyle = mixHex(skin, '#2a0c04', 0.6); g.lineWidth = 0.8; g.globalAlpha = 0.55; for (const dx of [-2.5, 2.5]) { g.beginPath(); g.moveTo(fx + dx, eyeY - 12); g.lineTo(fx + dx * 0.6, eyeY - 4); g.stroke(); } for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(fx - 11, top + 20 + i * 5); g.quadraticCurveTo(fx, top + 17 + i * 5, fx + 11, top + 20 + i * 5); g.stroke(); } g.lineWidth = 1.1; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(nx + sd * (nw + 1), nb - 2); g.quadraticCurveTo(nx + sd * (nw + 7), my - 2, mx + sd * (mw + 3), my + 6); g.stroke(); } g.globalAlpha = 1;
    // scars: across the cheek, through the brow, along the jaw — a raised pale line with the stitch marks
    g.lineCap = 'round'; for (let k = 0; k < scarK; k++) { const [x0, y0, x1, y1] = [[fx - 20, eyeY + 4, fx - 8, eyeY + 24], [fx + 8, eyeY - 14, fx + 16, eyeY + 6], [fx - 16, chin - 18, fx + 2, chin - 6]][k]; g.strokeStyle = 'rgba(120,40,30,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = 'rgba(255,205,185,0.45)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x0 + 0.6, y0); g.lineTo(x1 + 0.6, y1); g.stroke(); for (let t = 0.2; t < 1; t += 0.25) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; g.strokeStyle = 'rgba(110,40,30,0.45)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - 1.6, y + 1.2); g.lineTo(x + 1.6, y - 1.2); g.stroke(); } } }
  if (['楊志', '史進', '雷橫'].includes(p.id) || (R() < 0.08 && fierce && !menace)) { g.strokeStyle = 'rgba(110,35,25,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(fx - 19, eyeY + 6); g.lineTo(fx - 10, eyeY + 21); g.stroke(); }
  g.restore();
  // ---- the eyes: almond shaped, set in their sockets under a heavy upper lid; a brown iris with its fibres, a wet glint
  for (const sd of [-1, 1]) {
    const far = sd > 0, ex = fx + sd * eyeGap - (far ? 0.6 : 0), ey = eyeY, w = (female ? 7 : 7) * (far ? 0.86 : 1), h = menace ? 2.1 : fierce ? 2.5 : female ? 3.2 : 2.7;
    if (patch && far) { g.fillStyle = '#16100c'; g.beginPath(); g.ellipse(ex, ey, w + 1.5, 6, 0.1, 0, 7); g.fill(); g.strokeStyle = '#16100c'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ex - w, ey - 3); g.lineTo(fx - 22, eyeY - 16); g.moveTo(ex + w, ey - 2); g.lineTo(cx + jaw, eyeY - 4); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1; g.beginPath(); g.arc(ex - 1, ey - 1, 3.5, 3.6, 5); g.stroke(); continue; }
    const ix = ex - sd * w, iy = ey + 1, ox = ex + sd * w, oy = ey + (fierce ? -1.4 : female ? -0.8 : -0.3), up = ey - h * 1.6, lo = ey + h * 1.0;
    const eyePath = () => { g.beginPath(); g.moveTo(ix, iy); g.bezierCurveTo(ix + sd * w * 0.35, up, ox - sd * w * 0.5, up + 0.4, ox, oy); g.bezierCurveTo(ox - sd * w * 0.4, lo, ix + sd * w * 0.4, lo + 0.2, ix, iy); g.closePath(); };
    eyePath(); { const wg = g.createLinearGradient(0, up, 0, lo); wg.addColorStop(0, menace ? '#8a7258' : '#8a7868'); wg.addColorStop(0.5, menace ? '#cdb898' : '#d8cabb'); wg.addColorStop(1, menace ? '#c4ae90' : '#e4d8ca'); g.fillStyle = wg; g.fill(); }
    g.save(); eyePath(); g.clip();
    // the white is shaded at its corners, the iris is cut by the upper lid
    soft2(g, ix, iy, 3, 3, 'rgba(120,60,50,1)', 0.45); soft2(g, ox, oy, 3, 3, 'rgba(80,50,40,1)', 0.5);
    const ir = menace ? 2.7 : female ? 3.4 : 3.2, icx = ex + (far ? -0.8 : 0.4), icy = ey - 0.2;
    { const ig = g.createRadialGradient(icx - 0.4, icy + 0.6, 0.2, icx, icy, ir); ig.addColorStop(0, female ? '#6a4224' : '#4a2c16'); ig.addColorStop(0.55, female ? '#3a2010' : '#28160a'); ig.addColorStop(0.9, '#1a0e08'); ig.addColorStop(1, '#0a0604'); g.fillStyle = ig; g.beginPath(); g.arc(icx, icy, ir, 0, 7); g.fill(); }
    g.lineWidth = 0.25; for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2, r0 = ir * 0.4, r1 = ir * (0.8 + R() * 0.15); g.strokeStyle = `rgba(${female ? '170,120,70' : '140,95,55'},${0.2 + R() * 0.2})`; g.beginPath(); g.moveTo(icx + Math.cos(a) * r0, icy + Math.sin(a) * r0); g.lineTo(icx + Math.cos(a) * r1, icy + Math.sin(a) * r1); g.stroke(); }
    g.fillStyle = '#050304'; g.beginPath(); g.arc(icx, icy, menace ? 1 : 1.35, 0, 7); g.fill();
    if (menace) { g.strokeStyle = 'rgba(170,40,30,0.4)'; g.lineWidth = 0.35; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(ox - sd * 0.5, oy + k * 0.5 - 0.6); g.quadraticCurveTo(ox - sd * 2, oy + k * 0.4, icx + sd * ir, icy + (k - 1.5) * 0.6); g.stroke(); } }
    { const lg = g.createLinearGradient(0, up, 0, ey + 0.5); lg.addColorStop(0, 'rgba(25,10,5,0.8)'); lg.addColorStop(1, 'rgba(25,10,5,0)'); g.fillStyle = lg; g.fillRect(ex - w - 2, up - 1, w * 2 + 4, ey + 0.5 - up + 1); }
    g.fillStyle = 'rgba(255,252,245,0.95)'; g.beginPath(); g.ellipse(icx - 1, icy - 1.1, 0.9, 0.7, -0.5, 0, 7); g.fill(); g.fillStyle = 'rgba(255,250,240,0.4)'; g.beginPath(); g.arc(icx + 1.3, icy + 1.2, 0.4, 0, 7); g.fill();
    g.restore();
    g.fillStyle = 'rgba(200,110,100,0.7)'; g.beginPath(); g.ellipse(ix + sd * 0.9, iy - 0.1, 1, 0.8, 0, 0, 7); g.fill(); // the caruncle
    // the lid: a dark line thick toward the outer corner, the lid's fold above it, the lower lid's wet rim
    g.lineCap = 'round'; g.strokeStyle = '#120806'; for (let k = 0; k < 3; k++) { const t0 = k / 3, t1 = (k + 1) / 3; g.lineWidth = (female ? 1.2 : 1) + k * (female ? 0.55 : 0.45); g.beginPath(); const bz = (t) => { const u = 1 - t; return [u * u * u * ix + 3 * u * u * t * (ix + sd * w * 0.35) + 3 * u * t * t * (ox - sd * w * 0.5) + t * t * t * ox, u * u * u * iy + 3 * u * u * t * up + 3 * u * t * t * (up + 0.4) + t * t * t * oy]; }; const [ax, ay] = bz(t0), [bx, by2] = bz((t0 + t1) / 2), [cx2, cy2] = bz(t1); g.moveTo(ax, ay); g.quadraticCurveTo(bx * 2 - (ax + cx2) / 2, by2 * 2 - (ay + cy2) / 2, cx2, cy2); g.stroke(); }
    if (female) { g.lineWidth = 1; g.beginPath(); g.moveTo(ox, oy); g.quadraticCurveTo(ox + sd * 2, oy - 0.8, ox + sd * 3.2, oy - 2); g.stroke(); g.lineWidth = 0.5; for (let k = 0; k < 6; k++) { const t = 0.5 + k * 0.09, x = ex + sd * (t - 0.5) * 2 * w, y = up + 0.8 + Math.pow(t - 0.55, 2) * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sd * (0.8 + k * 0.2), y - 1.8); g.stroke(); } }
    g.strokeStyle = mixHex(skin, '#3a1208', 0.5); g.globalAlpha = female ? 0.6 : 0.45; g.lineWidth = 0.6; g.beginPath(); g.moveTo(ix + sd * 1.5, iy - 2.4); g.bezierCurveTo(ix + sd * w * 0.5, up - 2.6, ox - sd * w * 0.4, up - 2, ox + sd * 0.8, oy - 1.6); g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = 'rgba(255,215,195,0.4)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(ix + sd * 1.2, iy + 0.3); g.bezierCurveTo(ix + sd * w * 0.4, lo + 0.5, ox - sd * w * 0.4, lo + 0.3, ox - sd * 0.5, oy + 0.5); g.stroke();
    g.strokeStyle = mixHex(skin, '#3a1208', 0.4); g.globalAlpha = 0.5; g.lineWidth = 0.5; g.beginPath(); g.moveTo(ix + sd * 1.5, iy + 1.4); g.bezierCurveTo(ix + sd * w * 0.4, lo + 1.6, ox - sd * w * 0.4, lo + 1.2, ox - sd * 0.5, oy + 1.4); g.stroke(); g.globalAlpha = 1;
    // the brows: hair by hair, rooted thick at the inner end and thinning outward, their set showing the temper
    const bc = old ? '#bcb8b0' : sh(hairC, 1.05), inner = fx + sd * 3.5, outer = fx + sd * (eyeGap + w + 3), by = ey - h - 6.5, tilt = menace ? 7 : fierce ? 4.5 : wise ? -1 : 1.5, thick = female ? 1.1 : menace ? 4.2 : burly || fierce ? 3.2 : 2.3;
    const nB = female ? 34 : menace ? 80 : 60; for (let i = 0; i < nB; i++) { const t = Math.pow(R(), 0.85), x = inner + (outer - inner) * t, th = thick * (1.1 - t * 0.7), y = by + tilt * (1 - t) - Math.sin(t * Math.PI) * (female ? 2.6 : 1.8) + (R() - 0.5) * th; g.strokeStyle = sh(bc, 0.6 + R() * 0.6, 0.55 + R() * 0.4); g.lineWidth = female ? 0.5 : 0.75; const ang = t < 0.25 ? -1.2 : -0.35; g.beginPath(); g.moveTo(x, y + 0.6); g.lineTo(x + sd * Math.cos(ang) * 2.6, y + Math.sin(ang) * 2.6); g.stroke(); }
  }
  // ---- the nose: the form comes from the sculpting; here only the dark of the nostrils and the creases of their wings
  g.fillStyle = 'rgba(40,10,6,0.8)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(nx + sd * (nw - 3.4) + 0.3, nb + 1.6, sd < 0 ? 1.9 : 1.6, 0.95, sd * 0.35, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(60,18,10,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(nx - nw + 0.5, nb - 3); g.quadraticCurveTo(nx - nw - 2, nb + 1.5, nx - nw + 2.2, nb + 3); g.moveTo(nx + nw - 0.5, nb - 3); g.quadraticCurveTo(nx + nw + 2, nb + 1.5, nx + nw - 2.2, nb + 3); g.stroke();
  // ---- the mouth: the line between the lips, deeper at the corners
  g.strokeStyle = female ? '#5a1418' : '#2a0e08'; g.lineCap = 'round'; g.lineWidth = female ? 0.9 : 1.1; g.beginPath(); g.moveTo(mx - mw + 0.5, my + (fierce ? 1.1 : female ? -0.5 : 0.3)); g.bezierCurveTo(mx - mw * 0.4, my - 0.6, mx - 1.5, my + 0.4, mx, my - 0.2); g.bezierCurveTo(mx + 1.5, my + 0.4, mx + mw * 0.4, my - 0.6, mx + mw - 0.5, my + (fierce ? 1.1 : female ? -0.5 : 0.3)); g.stroke();
  for (const sd of [-1, 1]) soft2(g, mx + sd * (mw - 0.5), my + 0.5, 1.6, 1.2, 'rgba(40,10,6,1)', 0.5);
  if (female) { g.fillStyle = 'rgba(190,50,70,0.35)'; g.beginPath(); g.moveTo(mx - mw + 1, my + 0.3); g.quadraticCurveTo(mx - 3, my - 3, mx, my - 1.8); g.quadraticCurveTo(mx + 3, my - 3, mx + mw - 1, my + 0.3); g.quadraticCurveTo(mx, my + 5, mx - mw + 1, my + 0.3); g.fill(); g.fillStyle = 'rgba(255,235,235,0.5)'; g.beginPath(); g.ellipse(mx - 1, my + 2.2, 2.2, 0.7, 0, 0, 7); g.fill(); }
  if (menace) { // a snarl: the lip curled up at one side over bared teeth
    g.fillStyle = '#1a0806'; g.beginPath(); g.moveTo(mx - mw + 2, my + 0.5); g.quadraticCurveTo(mx, my - 1.2, mx + mw - 1, my - 1.5); g.quadraticCurveTo(mx + 2, my + 3.5, mx - mw + 2, my + 0.5); g.fill(); g.fillStyle = '#ddd0b4'; for (let k = 0; k < 5; k++) { const x = mx - mw + 4 + k * 2.6; g.fillRect(x, my - 0.6 + (k > 3 ? -0.6 : 0), 2.2, 1.6); } g.fillStyle = '#eee4cc'; g.beginPath(); g.moveTo(mx + mw - 3.5, my - 1); g.lineTo(mx + mw - 2.5, my + 1.8); g.lineTo(mx + mw - 1.5, my - 1.2); g.fill(); g.strokeStyle = '#220c08'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(mx + mw - 1, my - 1.5); g.lineTo(mx + mw + 1.5, my - 3.5); g.stroke(); }
  // ---- the beard, hair by hair
  beard(g, R, beardK, old ? '#d0ccc4' : hairC, { cx: fx, my, nb, chin, jaw, eyeY, burly });
  // ---- hair and what is worn on the head
  headwear(g, R, p, L, { cx: cx - 1, top, jaw: jaw + 1, eyeY, hairC, skin, side, female });
  if (!female && L.hat !== 'monk' && L.hat !== 'helm') for (const sd of [-1, 1]) for (let k = 0; k < 14; k++) { const x = cx + sd * (jaw - 1 - R() * 3), y = top + 26 + R() * 6; g.strokeStyle = sh(hairC, 0.7 + R() * 0.7, 0.8); g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sd * 1.5, y + 10, x - sd * 0.5 + (R() - 0.5) * 2, y + (female ? 26 : 14) + R() * 8); g.stroke(); }
  if (L.eye3) { const x = fx, y = eyeY - 17; g.fillStyle = '#f0e8d8'; g.beginPath(); g.ellipse(x, y, 1.8, 4.2, 0, 0, 7); g.fill(); g.fillStyle = '#c83a20'; g.beginPath(); g.ellipse(x, y, 1.1, 2.6, 0, 0, 7); g.fill(); g.fillStyle = '#100604'; g.beginPath(); g.ellipse(x, y, 0.5, 1.2, 0, 0, 7); g.fill(); g.strokeStyle = '#140806'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(x, y, 2, 4.5, 0, 0, 7); g.stroke(); }
  if (L.urna) { soft2(g, fx, eyeY - 13, 2.6, 2.6, 'rgba(255,220,120,1)', 0.8); g.fillStyle = '#f8e8c0'; g.beginPath(); g.arc(fx, eyeY - 13, 1.2, 0, 7); g.fill(); }
  if (L.skulls) skulls(g, R, cx, chin);
  g.restore();
  // ---- finish: a vignette, a little warmth, brushwork over the whole
  const vg = g.createRadialGradient(W * 0.45, H * 0.42, 40, W / 2, H / 2, 125); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,170,90,0.18)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  brush(c, R);
  g.strokeStyle = 'rgba(200,170,110,0.85)'; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, W - 1.5, H - 1.5); g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 1; g.strokeRect(2.5, 2.5, W - 5, H - 5);
  CACHE.set(p.id, c); return c;
}
function halo(g, R, x, y, r) { const hg = g.createRadialGradient(x, y, r * 0.55, x, y, r); hg.addColorStop(0, 'rgba(255,230,140,0)'); hg.addColorStop(0.75, 'rgba(255,220,120,0.55)'); hg.addColorStop(0.88, 'rgba(255,245,200,0.9)'); hg.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = hg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,240,190,0.35)'; g.lineWidth = 0.6; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62); g.lineTo(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25); g.stroke(); } }
function skulls(g, R, cx, chin) { for (let i = 0; i < 9; i++) { const t = i / 8, x = cx - 34 + t * 68, y = chin + 18 + Math.sin(t * Math.PI) * 20, sg = g.createRadialGradient(x - 1.5, y - 2, 0.5, x, y, 6); sg.addColorStop(0, '#fffaf0'); sg.addColorStop(0.6, '#d8ccb0'); sg.addColorStop(1, '#6a5a40'); g.fillStyle = sg; g.beginPath(); g.ellipse(x, y, 5, 5.5, 0, 0, 7); g.fill(); g.fillStyle = '#1a1008'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(x + sd * 1.9, y - 0.2, 1.3, 1.5, 0, 0, 7); g.fill(); } g.beginPath(); g.moveTo(x, y + 1.4); g.lineTo(x - 0.8, y + 2.6); g.lineTo(x + 0.8, y + 2.6); g.fill(); g.fillRect(x - 2, y + 3.6, 4, 0.6); } }
export const kit = { W, H, hex, sh, mixHex, mix, toHex, soft2, halo, brush, norm, SIDEC, body: (...a) => body(...a), ground(g, R, side) { const bg = g.createRadialGradient(60, 70, 10, 80, 100, 150); bg.addColorStop(0, sh(side, 0.95)); bg.addColorStop(0.55, sh(side, 0.42)); bg.addColorStop(1, '#07070b'); g.fillStyle = bg; g.fillRect(0, 0, W, H); for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H, r = 12 + R() * 36, sg = g.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, `rgba(255,240,220,${0.03 + R() * 0.05})`); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(x - r, y - r, r * 2, r * 2); } },
  finish(c, g, R) { const vg = g.createRadialGradient(W * 0.45, H * 0.42, 40, W / 2, H / 2, 125); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,170,90,0.18)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; brush(c, R); g.strokeStyle = 'rgba(200,170,110,0.85)'; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, W - 1.5, H - 1.5); g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 1; g.strokeRect(2.5, 2.5, W - 5, H - 5); } };
function soft2(g, x, y, rx, ry, col, a) { const r = Math.max(rx, ry), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace(/[\d.]+\)$/, a + ')')); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.save(); g.translate(x, y); g.scale(rx / r, ry / r); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
function path(g, pts) { g.beginPath(); g.moveTo(...pts[0]); for (const q of pts.slice(1)) q.length === 4 ? g.quadraticCurveTo(...q) : g.lineTo(...q); g.closePath(); }
// many fine hairs between two corners, falling downward
function strands(g, R, col, x0, y0, x1, y1, n, a) { for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0) * 0.4; g.strokeStyle = sh(col, 0.6 + R() * 0.9, a); g.lineWidth = 0.6 + R() * 0.8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - 0.5) * 8, (y + y1) / 2, x + (R() - 0.5) * 14, y1 - R() * 20); g.stroke(); } }
// ---------------------------------------------------------------- armour, robes, a monk's robe
function body(g, R, p, L, o) {
  const { cx, side, armour, female, burly } = o, sw = burly ? 70 : female ? 52 : 62;
  const shoulders = () => { g.beginPath(); g.moveTo(cx - sw - 12, 200); g.bezierCurveTo(cx - sw - 8, 168, cx - sw + 6, 154, cx - 18, 150); g.lineTo(cx + 18, 150); g.bezierCurveTo(cx + sw - 6, 154, cx + sw + 8, 168, cx + sw + 12, 200); g.closePath(); };
  if (L.hat === 'monk') {
    shoulders(); const rg = g.createLinearGradient(cx - sw, 150, cx + sw, 200); rg.addColorStop(0, '#9a5a2a'); rg.addColorStop(1, '#4a2410'); g.fillStyle = rg; g.fill();
    g.fillStyle = '#b8862a'; g.beginPath(); g.moveTo(cx - sw, 165); g.lineTo(cx + 20, 150); g.lineTo(cx + 40, 156); g.lineTo(cx - sw + 18, 200); g.lineTo(cx - sw - 6, 200); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,30,10,0.6)'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(cx - sw + 6 + i * 8, 172 + i * 3); g.lineTo(cx - sw + 14 + i * 8, 200); g.stroke(); }
    for (let i = 0; i < 14; i++) { const t = i / 13, x = cx - 30 + t * 60, y = 158 + Math.sin(t * Math.PI) * 16; const bg = g.createRadialGradient(x - 1, y - 1, 0.5, x, y, 4); bg.addColorStop(0, '#d8b080'); bg.addColorStop(1, '#4a2a14'); g.fillStyle = bg; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); }
    return;
  }
  if (armour) {
    // a cape in the side's colour behind the shoulders
    g.fillStyle = sh(side, 0.7); g.beginPath(); g.moveTo(cx - sw - 16, 200); g.lineTo(cx - sw + 4, 158); g.lineTo(cx + sw - 4, 158); g.lineTo(cx + sw + 16, 200); g.fill();
    shoulders(); const ag = g.createLinearGradient(cx - sw, 150, cx + sw, 200); const metal = L.hat === 'fur' ? '#6a5a4a' : p.side === 'fang' ? '#8a6a3a' : '#7a7e88'; ag.addColorStop(0, sh(metal, 1.25)); ag.addColorStop(0.5, metal); ag.addColorStop(1, sh(metal, 0.35)); g.fillStyle = ag; g.fill();
    g.save(); shoulders(); g.clip();
    // lamellar plates: rows of small rounded scales, lit from above-left
    for (let row = 0, y = 156; y < 204; y += 6.5, row++) for (let x = cx - sw - 10 + (row % 2) * 4.5; x < cx + sw + 10; x += 9) {
      const lit = 1.2 - (x - (cx - sw)) / (sw * 2) * 0.8 - (y - 156) / 140, pg = g.createLinearGradient(0, y, 0, y + 6); pg.addColorStop(0, sh(metal, Math.max(0.3, lit + 0.25))); pg.addColorStop(1, sh(metal, Math.max(0.15, lit - 0.35)));
      g.fillStyle = pg; g.beginPath(); g.roundRect(x, y, 8, 6.5, [1, 1, 3, 3]); g.fill(); g.strokeStyle = 'rgba(10,8,8,0.6)'; g.lineWidth = 0.6; g.stroke(); }
    g.restore();
    // pauldrons with a gold trim, a collar of dark leather, a gold-trimmed breast plate
    for (const sd of [-1, 1]) { const x = cx + sd * (sw - 10), pg = g.createRadialGradient(x - sd * 6, 158, 2, x, 166, 26); pg.addColorStop(0, sh(metal, 1.5)); pg.addColorStop(0.6, metal); pg.addColorStop(1, sh(metal, 0.3)); g.fillStyle = pg;
      for (let k = 2; k >= 0; k--) { g.beginPath(); g.ellipse(x + sd * k * 3, 162 + k * 7, 24 - k * 2, 11, sd * 0.35, Math.PI, 0); g.fill(); g.strokeStyle = '#c8a040'; g.lineWidth = 1.2; g.stroke(); } }
    g.fillStyle = '#2a1e18'; g.beginPath(); g.moveTo(cx - 20, 150); g.quadraticCurveTo(cx, 168, cx + 20, 150); g.lineTo(cx + 16, 146); g.quadraticCurveTo(cx, 160, cx - 16, 146); g.fill();
    const bp = g.createLinearGradient(cx - 18, 165, cx + 18, 200); bp.addColorStop(0, sh(metal, 1.4)); bp.addColorStop(1, sh(metal, 0.4)); g.fillStyle = bp; g.beginPath(); g.moveTo(cx - 20, 170); g.quadraticCurveTo(cx, 162, cx + 20, 170); g.lineTo(cx + 18, 200); g.lineTo(cx - 18, 200); g.fill(); g.strokeStyle = '#d8b050'; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = '#d8b050'; g.beginPath(); g.arc(cx, 182, 5, 0, 7); g.fill(); g.fillStyle = sh(side, 1.1); g.beginPath(); g.arc(cx, 182, 3, 0, 7); g.fill();
    if (L.hat === 'fur') { g.fillStyle = '#8a6a4a'; for (let i = 0; i < 40; i++) { const x = cx - sw + R() * sw * 2, y = 150 + R() * 14; g.fillStyle = sh('#8a6a4a', 0.7 + R() * 0.7); g.fillRect(x, y, 2, 5); } }
    return;
  }
  if (L.robe === 'kasaya') { // the 錦襴袈裟: red brocade in a grid of gold, a jade ring at the shoulder
    shoulders(); const rg = g.createLinearGradient(cx - sw, 150, cx + sw, 200); rg.addColorStop(0, '#e8b048'); rg.addColorStop(1, '#6a3a10'); g.fillStyle = rg; g.fill();
    g.save(); g.beginPath(); g.moveTo(cx - sw - 14, 200); g.bezierCurveTo(cx - sw - 8, 166, cx - sw + 8, 154, cx - 14, 151); g.lineTo(cx + 34, 160); g.lineTo(cx + 8, 200); g.closePath(); const kg = g.createLinearGradient(cx - sw, 150, cx + 20, 200); kg.addColorStop(0, '#d8402a'); kg.addColorStop(0.6, '#a01c14'); kg.addColorStop(1, '#4a0806'); g.fillStyle = kg; g.fill(); g.clip();
    g.strokeStyle = 'rgba(240,200,90,0.85)'; g.lineWidth = 1.6; for (let x = cx - sw - 20; x < cx + 40; x += 14) { g.beginPath(); g.moveTo(x, 150); g.lineTo(x + 8, 202); g.stroke(); } for (let y = 156; y < 204; y += 13) { g.beginPath(); g.moveTo(cx - sw - 20, y); g.lineTo(cx + 40, y + 4); g.stroke(); }
    g.fillStyle = 'rgba(255,220,120,0.6)'; for (let x = cx - sw - 14; x < cx + 40; x += 14) for (let y = 162; y < 204; y += 13) { g.beginPath(); g.arc(x + 4, y + 1, 1.4, 0, 7); g.fill(); } g.restore();
    const jg = g.createRadialGradient(cx + 22, 160, 1, cx + 24, 162, 6); jg.addColorStop(0, '#d8f0d0'); jg.addColorStop(1, '#3a7a4a'); g.strokeStyle = jg; g.lineWidth = 2.4; g.beginPath(); g.arc(cx + 24, 162, 4.5, 0, 7); g.stroke();
    g.fillStyle = '#f0e8d8'; g.beginPath(); g.moveTo(cx - 14, 150); g.lineTo(cx + 12, 182); g.lineTo(cx + 5, 186); g.lineTo(cx - 18, 154); g.fill(); return; }
  if (L.robe === 'tiger') { // a tiger-skin kilt and a short silk shirt (the Great Sage's)
    shoulders(); const rg = g.createLinearGradient(cx - sw, 150, cx + sw, 200); rg.addColorStop(0, '#e8d070'); rg.addColorStop(0.5, '#c89a2a'); rg.addColorStop(1, '#5a3a0a'); g.fillStyle = rg; g.fill();
    g.save(); shoulders(); g.clip(); g.strokeStyle = 'rgba(90,50,10,0.55)'; g.lineWidth = 1; for (let i = 0; i < 9; i++) { const x = cx - sw + 8 + i * (sw * 2 - 16) / 8; g.beginPath(); g.moveTo(x, 158); g.quadraticCurveTo(x + (R() - 0.5) * 10, 180, x + (R() - 0.5) * 6, 202); g.stroke(); } g.restore();
    g.fillStyle = '#c83a20'; g.beginPath(); g.moveTo(cx - 20, 150); g.quadraticCurveTo(cx, 166, cx + 20, 150); g.lineTo(cx + 22, 156); g.quadraticCurveTo(cx, 174, cx - 22, 156); g.fill(); return; }
  if (L.robe) { // a robe in a colour of its own
    shoulders(); const rg = g.createLinearGradient(cx - sw, 150, cx + sw, 200); rg.addColorStop(0, sh(L.robe, 1.4)); rg.addColorStop(0.5, L.robe); rg.addColorStop(1, sh(L.robe, 0.35)); g.fillStyle = rg; g.fill();
    g.save(); shoulders(); g.clip(); g.strokeStyle = sh(L.robe, 0.45, 0.6); g.lineWidth = 1.2; for (let i = 0; i < 9; i++) { const x = cx - sw + 8 + i * (sw * 2 - 16) / 8; g.beginPath(); g.moveTo(x, 160 + R() * 6); g.quadraticCurveTo(x + (R() - 0.5) * 10, 182, x + (R() - 0.5) * 6, 202); g.stroke(); } g.restore();
    g.fillStyle = L.collar || '#ece4d4'; g.beginPath(); g.moveTo(cx - 16, 150); g.lineTo(cx + 14, 186); g.lineTo(cx + 6, 190); g.lineTo(cx - 20, 154); g.fill(); g.beginPath(); g.moveTo(cx + 16, 150); g.lineTo(cx - 8, 190); g.lineTo(cx - 14, 186); g.lineTo(cx + 20, 154); g.fill();
    if (L.gems) { for (let i = 0; i < 11; i++) { const t = i / 10, x = cx - 26 + t * 52, y = 156 + Math.sin(t * Math.PI) * 14; const bg = g.createRadialGradient(x - 0.8, y - 0.8, 0.3, x, y, 2.8); bg.addColorStop(0, '#fff0c0'); bg.addColorStop(1, ['#c8a030', '#3a8a5a', '#c83a3a'][i % 3]); g.fillStyle = bg; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); } }
    return; }
  // a robe: outer cloth in the side's colour (or plain for scholars), an inner collar crossed right over left
  const cloth = female ? (R() < 0.5 ? '#8a2a4a' : '#3a5a7a') : L.hat === 'scholar' || L.hat === 'taoist' ? (L.hat === 'taoist' ? '#3a3a5a' : '#4a5a6a') : L.hat === 'official' ? '#5a1a22' : sh(side, 1.05).replace('rgba', 'rgb').replace(/,1\)$/, ')');
  const clothHex = cloth.startsWith('#') ? cloth : '#' + cloth.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join('');
  shoulders(); const rg = g.createLinearGradient(cx - sw, 150, cx + sw, 200); rg.addColorStop(0, sh(clothHex, 1.35)); rg.addColorStop(0.5, clothHex); rg.addColorStop(1, sh(clothHex, 0.35)); g.fillStyle = rg; g.fill();
  g.save(); shoulders(); g.clip(); g.strokeStyle = sh(clothHex, 0.45, 0.6); g.lineWidth = 1.2; for (let i = 0; i < 9; i++) { const x = cx - sw + 8 + i * (sw * 2 - 16) / 8; g.beginPath(); g.moveTo(x, 160 + R() * 6); g.quadraticCurveTo(x + (R() - 0.5) * 10, 182, x + (R() - 0.5) * 6, 202); g.stroke(); } g.restore();
  g.fillStyle = '#ece4d4'; g.beginPath(); g.moveTo(cx - 16, 150); g.lineTo(cx + 14, 186); g.lineTo(cx + 6, 190); g.lineTo(cx - 20, 154); g.fill(); g.beginPath(); g.moveTo(cx + 16, 150); g.lineTo(cx - 8, 190); g.lineTo(cx - 14, 186); g.lineTo(cx + 20, 154); g.fill();
  g.strokeStyle = sh(clothHex, 0.6); g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 18, 152); g.lineTo(cx - 10, 194); g.stroke();
  if (female) { g.fillStyle = '#e8c060'; g.beginPath(); g.moveTo(cx - 24, 188); g.lineTo(cx + 24, 188); g.lineTo(cx + 22, 196); g.lineTo(cx - 22, 196); g.fill(); }
}
// ---------------------------------------------------------------- beards
function beard(g, R, kind, col, o) {
  const { cx, my, nb, chin, jaw, eyeY, burly } = o; if (!kind || kind === 'none') return;
  const hair = (x, y, x2, y2, w = 0.9, a = 0.85) => { const k = R(); g.strokeStyle = k < 0.7 ? sh(col, 0.55 + k * 0.7, a) : mix(col, '#9a7a5a', (k - 0.7) * 1.6, a); g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + (R() - 0.5) * 3, (y + y2) / 2, x2, y2); g.stroke(); };
  if (kind === 'stub') { g.fillStyle = sh(col, 1, 0.22); g.beginPath(); g.moveTo(cx - jaw + 4, eyeY + 18); g.quadraticCurveTo(cx - jaw + 6, chin - 6, cx, chin + 1); g.quadraticCurveTo(cx + jaw - 6, chin - 6, cx + jaw - 4, eyeY + 18); g.lineTo(cx + 12, my - 3); g.lineTo(cx - 12, my - 3); g.fill(); for (let i = 0; i < 140; i++) { const a = R() * Math.PI, r = R(), x = cx + Math.cos(a) * (jaw - 4) * (0.4 + r * 0.6), y = my - 4 + Math.sin(a) * (chin - my + 2) * (0.3 + r * 0.7); g.fillStyle = sh(col, 0.8, 0.5); g.fillRect(x, y, 0.8, 0.8); } return; }
  // the moustache: two wings from under the nose, drooping
  const mo = () => { for (const sd of [-1, 1]) { const mg = g.createLinearGradient(cx, nb + 3, cx + sd * 16, my + 8); mg.addColorStop(0, mix(col, '#6a4a36', 0.25, 0.95)); mg.addColorStop(1, sh(col, 0.6, 0.85)); g.fillStyle = mg; g.beginPath(); g.moveTo(cx + sd * 0.5, nb + 3.5); g.quadraticCurveTo(cx + sd * 10, nb + 2, cx + sd * 14, my + (kind === 'long' ? 9 : 4)); g.quadraticCurveTo(cx + sd * 17, my + 10, cx + sd * 15, my + (kind === 'long' ? 16 : 10)); g.quadraticCurveTo(cx + sd * 10, my + 2, cx + sd * 4, my - 1); g.quadraticCurveTo(cx + sd * 1, my - 2, cx + sd * 0.5, nb + 9); g.closePath(); g.fill(); }
    for (const sd of [-1, 1]) for (let i = 0; i < 40; i++) { const t = R(), x = cx + sd * (1 + t * 3), y = nb + 4 + R() * 3; hair(x, y, cx + sd * (10 + t * 6 + R() * 3), my + 2 + t * 6 + (kind === 'long' ? 4 : 0), 1, 0.9); } };
  if (kind === 'mous') { mo(); return; }
  if (kind === 'goatee') { mo(); for (let i = 0; i < 46; i++) { const x = cx + (R() - 0.5) * 10; hair(x, my + 4, x + (R() - 0.5) * 6, chin + 12 + R() * 10, 1); } return; }
  if (kind === 'long') { // a long, fine beard reaching the chest — the 美髯
    { const bg = g.createLinearGradient(cx - 14, my, cx + 14, 196); bg.addColorStop(0, mix(col, '#7a5a44', 0.3, 0.9)); bg.addColorStop(1, sh(col, 0.45, 0.92)); g.fillStyle = bg; g.beginPath(); g.moveTo(cx - jaw + 6, my - 2); g.quadraticCurveTo(cx - 18, 170, cx - 6, 198); g.lineTo(cx + 6, 198); g.quadraticCurveTo(cx + 16, 170, cx + jaw - 6, my - 2); g.quadraticCurveTo(cx, my + 6, cx - jaw + 6, my - 2); g.fill(); }
    mo(); for (let i = 0; i < 120; i++) { const t = R(), x = cx + (t - 0.5) * jaw * 1.6, y = my + 2 + Math.abs(t - 0.5) * 18; hair(x, y, cx + (t - 0.5) * 22 + (R() - 0.5) * 6, 186 + R() * 14 - Math.abs(t - 0.5) * 20, 0.9, 0.8); }
    return; }
  if (kind === 'full') { // a bushy beard round the whole jaw — the 虯髯
    { const bg = g.createLinearGradient(0, eyeY + 12, 0, chin + 20); bg.addColorStop(0, mix(col, '#7a5a44', 0.35, 0)); bg.addColorStop(0.22, mix(col, '#7a5a44', 0.3, 0.75)); bg.addColorStop(0.55, sh(col, 0.95, 0.96)); bg.addColorStop(1, sh(col, 0.4, 0.98)); g.fillStyle = bg; } g.beginPath(); g.moveTo(cx - jaw - 2, eyeY + 10); g.quadraticCurveTo(cx - jaw - 6, chin + 6, cx - 12, chin + 18 + (burly ? 6 : 0)); g.quadraticCurveTo(cx, chin + 26 + (burly ? 6 : 0), cx + 12, chin + 18 + (burly ? 6 : 0)); g.quadraticCurveTo(cx + jaw + 6, chin + 6, cx + jaw + 2, eyeY + 10); g.lineTo(cx + jaw - 6, eyeY + 16); g.quadraticCurveTo(cx + 12, my - 8, cx, my - 7); g.quadraticCurveTo(cx - 12, my - 8, cx - jaw + 6, eyeY + 16); g.closePath(); g.fill();
    for (let i = 0; i < 420; i++) { const a = R() * Math.PI, r = 0.3 + R() * 0.7, x = cx + Math.cos(a) * (jaw + 3) * r, y = my - 6 + Math.sin(a) * (chin - my + 22) * r; hair(x, y, x + (R() - 0.5) * 5 + Math.cos(a) * 4, y + 5 + R() * 7, 0.5 + R() * 0.5, 0.75); }
    for (let i = 0; i < 90; i++) { const sd = R() < 0.5 ? -1 : 1, x = cx + sd * (jaw - 6 - R() * 8), y = eyeY + 16 + R() * 10; hair(x, y, x + sd * R() * 2, y + 4 + R() * 4, 0.45, 0.55); }
    mo(); g.fillStyle = '#2a120e'; g.beginPath(); g.ellipse(cx, my + 1, 6, 1.6, 0, 0, 7); g.fill(); }
}
// ---------------------------------------------------------------- what they wear on their heads
function headwear(g, R, p, L, o) {
  const { cx, top, jaw, eyeY, hairC, skin, side, female } = o, hat = L.hat;
  const hairTop = (lowY = top + 25) => { // hair combed back over the crown to the knot, a hairline at the temples
    const shape = () => { g.beginPath(); g.moveTo(cx - jaw - 2, lowY + 8); g.bezierCurveTo(cx - jaw - 4, top - 10, cx + jaw + 4, top - 10, cx + jaw + 2, lowY + 8); g.quadraticCurveTo(cx + jaw - 6, lowY - 6, cx, lowY - 10); g.quadraticCurveTo(cx - jaw + 6, lowY - 6, cx - jaw - 2, lowY + 8); g.closePath(); };
    const hg = g.createLinearGradient(cx - jaw, top - 10, cx + jaw, lowY + 8); hg.addColorStop(0, sh(hairC, 1.3)); hg.addColorStop(0.45, hairC); hg.addColorStop(1, sh(hairC, 0.45)); g.fillStyle = hg; shape(); g.fill();
    g.save(); shape(); g.clip();
    for (let i = 0; i < 170; i++) { const t = R(), sx = cx + (t - 0.5) * (jaw * 2 + 4), sy = lowY + 6 - Math.cos((t - 0.5) * Math.PI) * 16 + R() * 3, ex = cx + (t - 0.5) * 10, ey = top - 10; g.strokeStyle = sh(hairC, 0.75 + R() * 0.5, 0.25 + R() * 0.3); g.lineWidth = 0.4 + R() * 0.5; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + (ex - sx) * 0.2, (sy + ey) / 2 - 4, ex, ey); g.stroke(); }
    // the sheen: a band of light across the crown
    for (let i = 0; i < 60; i++) { const t = R(), a0 = Math.PI * (1.1 + t * 0.5), r = jaw * 0.75 + R() * 3; g.strokeStyle = `rgba(255,245,230,${0.08 + R() * 0.12})`; g.lineWidth = 0.6; g.beginPath(); g.arc(cx + 2, top + 16, r, a0, a0 + 0.12); g.stroke(); }
    g.restore();
    // soften the hairline with a few short hairs growing out of it
    for (let i = 0; i < 70; i++) { const t = R(), x = cx + (t - 0.5) * (jaw * 2 + 2), y = lowY + 6 - Math.cos((t - 0.5) * Math.PI) * 16; g.strokeStyle = sh(hairC, 0.8 + R() * 0.4, 0.4); g.lineWidth = 0.4; g.beginPath(); g.moveTo(x, y - 1.5); g.lineTo(x + (t - 0.5) * 1.5, y + 1 + R() * 1.4); g.stroke(); }
  };
  const knot = (y = top - 12) => { const kg = g.createRadialGradient(cx - 3, y - 3, 1, cx, y, 10); kg.addColorStop(0, sh(hairC, 1.6)); kg.addColorStop(1, sh(hairC, 0.5)); g.fillStyle = kg; g.beginPath(); g.ellipse(cx, y, 9, 8, 0, 0, 7); g.fill(); };
  const metal = (x0, y0, x1, y1, base) => { const mg = g.createLinearGradient(x0, y0, x1, y1); mg.addColorStop(0, sh(base, 1.7)); mg.addColorStop(0.35, sh(base, 1.15)); mg.addColorStop(0.7, base); mg.addColorStop(1, sh(base, 0.35)); return mg; };
  if (hat === 'helm') {
    const hh = hash(p.id), base = p.side === 'liao' ? '#7a6a5a' : p.side === 'fang' ? '#9a7a3a' : ['#8a8e98', '#6a6e7a', '#9a8a6a', '#4a4c56', '#a8a090'][hh % 5], plume = ['#c83a2a', '#c83a2a', '#e8e0d0', '#2a2a30', '#d8a830'][(hh >>> 3) % 5], trim = (hh >>> 6) % 3 ? ['#f8e090', '#c89838', '#6a4810'] : ['#f0f4fa', '#a0a6b0', '#4a4e58'];
    // the plume behind, a sweep of dyed horsehair
    const [pr, pg2, pb] = hex(plume); for (let i = 0; i < 160; i++) { const k = 0.5 + R() * 0.75, t = R(), u = R(); g.strokeStyle = `rgba(${pr * k},${pg2 * k},${pb * k},${0.45 + R() * 0.4})`; g.lineWidth = 0.5 + R() * 0.9; g.beginPath(); g.moveTo(cx + 1, top - 32); g.bezierCurveTo(cx - 4 + u * 6, top - 44 - t * 6, cx - 16 - t * 12, top - 40 + u * 8, cx - 22 - t * 18 + u * 6, top - 12 + t * 28 + u * 6); g.stroke(); }
    // neck guard: lames of steel laced together
    for (const sd of [-1, 1]) for (let k = 4; k >= 0; k--) { const y = top + 30 + k * 7, x1 = cx + sd * (jaw + k * 2.2); g.fillStyle = metal(x1 - 6, y, x1 + 6, y + 9, mixHex(base, '#101014', sd > 0 ? 0.45 : 0.15 + k * 0.06)); g.beginPath(); g.moveTo(cx + sd * (jaw - 3), y - 2); g.quadraticCurveTo(x1 + sd * 9, y, x1 + sd * 10, y + 8); g.lineTo(x1 - sd * 1, y + 9); g.quadraticCurveTo(cx + sd * (jaw - 1), y + 4, cx + sd * (jaw - 4), y + 3); g.closePath(); g.fill(); g.strokeStyle = 'rgba(15,10,8,0.7)'; g.lineWidth = 0.7; g.stroke(); g.strokeStyle = sd < 0 ? 'rgba(255,255,255,0.3)' : 'rgba(170,200,255,0.18)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(cx + sd * (jaw - 2), y - 1.4); g.quadraticCurveTo(x1 + sd * 8, y + 0.6, x1 + sd * 9.4, y + 7); g.stroke(); g.fillStyle = '#7a2a1a'; g.fillRect(x1 + sd * 3 - 0.6, y + 2, 1.2, 4); }
    // the bowl: a polished dome reflecting a bright sky above and the dark ground below
    const bowl = () => { g.beginPath(); g.moveTo(cx - jaw - 5, top + 28); g.bezierCurveTo(cx - jaw - 6, top - 26, cx + jaw + 6, top - 26, cx + jaw + 5, top + 28); g.closePath(); };
    { const bg = g.createLinearGradient(cx - jaw, top - 20, cx + jaw * 0.6, top + 28); bg.addColorStop(0, sh(base, 1.75)); bg.addColorStop(0.3, sh(base, 1.2)); bg.addColorStop(0.5, sh(base, 0.55)); bg.addColorStop(0.62, sh(base, 0.95)); bg.addColorStop(1, sh(base, 0.3)); g.fillStyle = bg; bowl(); g.fill(); }
    g.save(); bowl(); g.clip();
    for (let k = -3; k <= 3; k++) { const x = cx + k * 8.5; g.strokeStyle = 'rgba(10,8,6,0.55)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(cx + k * 1.5, top - 18); g.quadraticCurveTo(x + k * 1.5, top + 4, x + k * 2.2, top + 28); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(cx + k * 1.5 - 1, top - 18); g.quadraticCurveTo(x + k * 1.5 - 1.2, top + 4, x + k * 2.2 - 1.3, top + 28); g.stroke(); for (let j = 0; j < 4; j++) { const t = 0.2 + j * 0.22, rx = cx + k * 1.5 + (x + k * 2.2 - cx - k * 1.5) * t, ry = top - 18 + 46 * t; g.fillStyle = 'rgba(255,250,240,0.55)'; g.beginPath(); g.arc(rx + 2, ry, 0.6, 0, 7); g.fill(); } }
    soft2(g, cx - 10, top - 6, 9, 5, 'rgba(255,255,255,1)', 0.55); soft2(g, cx + jaw * 0.7, top + 14, 10, 18, 'rgba(0,0,0,1)', 0.4); soft2(g, cx + jaw + 2, top + 10, 3, 14, 'rgba(160,190,255,1)', 0.35);
    g.restore();
    // the gilt brow band, engraved with a cloud scroll, a red jewel at its centre
    const band = () => { g.beginPath(); g.moveTo(cx - jaw - 6, top + 22); g.quadraticCurveTo(cx, top + 14, cx + jaw + 6, top + 22); g.lineTo(cx + jaw + 5, top + 31); g.quadraticCurveTo(cx, top + 23, cx - jaw - 5, top + 31); g.closePath(); };
    { const tg = g.createLinearGradient(0, top + 15, 0, top + 31); tg.addColorStop(0, trim[0]); tg.addColorStop(0.45, trim[1]); tg.addColorStop(1, trim[2]); g.fillStyle = tg; band(); g.fill(); }
    g.save(); band(); g.clip(); g.strokeStyle = sh(trim[2], 1, 0.7); g.lineWidth = 0.6; for (let k = -4; k <= 4; k++) { const x = cx + k * 7, y = top + 24 + Math.abs(k) * 0.5; g.beginPath(); g.arc(x, y, 2.2, Math.PI * 0.2, Math.PI * 1.7); g.stroke(); g.beginPath(); g.arc(x + 2.6, y + 0.6, 1.2, Math.PI, Math.PI * 2.2); g.stroke(); } g.fillStyle = 'rgba(255,255,240,0.5)'; g.fillRect(cx - jaw - 6, top + 16, jaw * 2 + 12, 1.6); g.restore();
    g.strokeStyle = trim[2]; g.lineWidth = 0.6; band(); g.stroke();
    { const jg = g.createRadialGradient(cx - 1, top + 20, 0.4, cx, top + 21, 3.4); jg.addColorStop(0, '#ffb0a0'); jg.addColorStop(0.4, '#d02a20'); jg.addColorStop(1, '#4a0808'); g.fillStyle = jg; g.beginPath(); g.arc(cx, top + 21, 3.2, 0, 7); g.fill(); g.strokeStyle = trim[1]; g.lineWidth = 0.8; g.stroke(); }
    // the finial: a gilt spike on a lotus base
    g.fillStyle = metal(cx - 4, top - 30, cx + 4, top - 14, '#c8a040'); g.beginPath(); g.moveTo(cx - 5, top - 16); g.quadraticCurveTo(cx, top - 22, cx + 5, top - 16); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cx - 2, top - 19); g.lineTo(cx, top - 40); g.lineTo(cx + 2, top - 19); g.fill();
    return;
  }
  if (hat === 'fur') { hairTop(); const fg = g.createLinearGradient(0, top - 22, 0, top + 30); fg.addColorStop(0, '#a88a6a'); fg.addColorStop(1, '#4a3424'); g.fillStyle = fg; g.beginPath(); g.moveTo(cx - jaw - 8, top + 30); g.bezierCurveTo(cx - jaw - 8, top - 26, cx + jaw + 8, top - 26, cx + jaw + 8, top + 30); g.closePath(); g.fill(); for (let i = 0; i < 160; i++) { const a = Math.PI + R() * Math.PI, r = jaw + 6 + R() * 4, x = cx + Math.cos(a) * r, y = top + 14 + Math.sin(a) * (r + 8); g.strokeStyle = sh('#a88a6a', 0.5 + R() * 1.2, 0.8); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3, y + 4); g.stroke(); } g.fillStyle = '#e8dcc4'; g.fillRect(cx - jaw - 8, top + 24, jaw * 2 + 16, 8); for (const sd of [-1, 1]) { g.fillStyle = '#5a4030'; g.beginPath(); g.ellipse(cx + sd * (jaw + 6), top + 46, 7, 18, 0, 0, 7); g.fill(); } return; }
  if (hat === 'vinu') { // the 毗盧帽: five gilt petals on a band, each with a seated buddha, ribbons at the sides
    const band = () => { g.beginPath(); g.moveTo(cx - jaw - 3, top + 20); g.quadraticCurveTo(cx, top + 12, cx + jaw + 3, top + 20); g.lineTo(cx + jaw + 3, top + 27); g.quadraticCurveTo(cx, top + 19, cx - jaw - 3, top + 27); g.closePath(); };
    for (const sd of [-1, 1]) { g.strokeStyle = '#c83a2a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx + sd * (jaw + 2), top + 24); g.quadraticCurveTo(cx + sd * (jaw + 10), top + 50, cx + sd * (jaw + 6), top + 92); g.stroke(); g.strokeStyle = 'rgba(255,200,150,0.4)'; g.lineWidth = 0.7; g.stroke(); }
    for (let k = -2; k <= 2; k++) { const x = cx + k * jaw * 0.42, y = top + 16 + Math.abs(k) * 2.2, s = k === 0 ? 1.15 : 1 - Math.abs(k) * 0.06; g.save(); g.translate(x, y); g.rotate(k * 0.18); g.scale(s, s);
      const pg = g.createLinearGradient(-7, -18, 7, 0); pg.addColorStop(0, '#fff0b0'); pg.addColorStop(0.4, '#e0a838'); pg.addColorStop(1, '#6a4010'); g.fillStyle = pg; g.beginPath(); g.moveTo(-7, 0); g.quadraticCurveTo(-8, -12, 0, -20); g.quadraticCurveTo(8, -12, 7, 0); g.closePath(); g.fill(); g.strokeStyle = '#5a3008'; g.lineWidth = 0.6; g.stroke();
      g.fillStyle = '#8a1a14'; g.beginPath(); g.moveTo(-5, -1.5); g.quadraticCurveTo(-5.5, -10, 0, -16); g.quadraticCurveTo(5.5, -10, 5, -1.5); g.closePath(); g.fill();
      g.fillStyle = '#f0c860'; g.beginPath(); g.arc(0, -10.5, 1.6, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, -6, 2.6, 2.8, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,230,160,0.6)'; g.lineWidth = 0.5; g.beginPath(); g.arc(0, -9, 4, Math.PI, 0); g.stroke(); g.restore(); }
    { const bg = g.createLinearGradient(0, top + 12, 0, top + 27); bg.addColorStop(0, '#fff0b0'); bg.addColorStop(0.5, '#d09830'); bg.addColorStop(1, '#5a3808'); g.fillStyle = bg; band(); g.fill(); g.strokeStyle = '#4a2a08'; g.lineWidth = 0.6; g.stroke(); }
    for (let k = -3; k <= 3; k++) { g.fillStyle = k % 2 ? '#3a8a5a' : '#c83a3a'; g.beginPath(); g.arc(cx + k * 7, top + 21 - Math.cos(k / 3) * 2 + 2, 1.3, 0, 7); g.fill(); }
    return; }
  if (hat === 'buddha') { // tight curls over the crown and the ushnisha, a jewel at its front
    const cg = g.createRadialGradient(cx - 8, top - 4, 2, cx, top + 10, jaw + 12); cg.addColorStop(0, '#5a6a9a'); cg.addColorStop(1, '#141830'); g.fillStyle = cg; g.beginPath(); g.moveTo(cx - jaw - 2, top + 26); g.bezierCurveTo(cx - jaw - 4, top - 18, cx + jaw + 4, top - 18, cx + jaw + 2, top + 26); g.quadraticCurveTo(cx, top + 16, cx - jaw - 2, top + 26); g.fill(); g.beginPath(); g.ellipse(cx, top - 10, 14, 11, 0, 0, 7); g.fill();
    for (let i = 0; i < 200; i++) { const a = R() * Math.PI * 2, r = R(), x = cx + Math.cos(a) * r * (jaw + 1), y = top + 6 + Math.sin(a) * r * 18; if (y > top + 22 - Math.abs(x - cx) * 0.2) continue; g.fillStyle = `rgba(150,170,230,${0.25 + R() * 0.35})`; g.beginPath(); g.arc(x, y, 1, 0, 7); g.fill(); g.fillStyle = 'rgba(10,12,30,0.5)'; g.beginPath(); g.arc(x + 0.5, y + 0.5, 0.8, 0, 7); g.fill(); }
    for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, r = R(), x = cx + Math.cos(a) * r * 13, y = top - 10 + Math.sin(a) * r * 10; g.fillStyle = `rgba(150,170,230,${0.25 + R() * 0.35})`; g.beginPath(); g.arc(x, y, 1, 0, 7); g.fill(); }
    const jg = g.createRadialGradient(cx - 1, top - 2, 0.5, cx, top - 1, 3.5); jg.addColorStop(0, '#fff0f0'); jg.addColorStop(0.5, '#e84a3a'); jg.addColorStop(1, '#5a0a0a'); g.fillStyle = jg; g.beginPath(); g.arc(cx, top - 1, 3, 0, 7); g.fill(); return; }
  if (hat === 'bodhi') { // a white veil from the crown to the shoulders, a jewelled crown with a small buddha
    const vg = g.createLinearGradient(cx - jaw - 20, 0, cx + jaw + 20, 0); vg.addColorStop(0, '#ffffff'); vg.addColorStop(0.5, '#e8e4ec'); vg.addColorStop(1, '#8a8a9a'); g.fillStyle = vg; g.beginPath(); g.moveTo(cx - jaw + 4, top + 26); g.bezierCurveTo(cx - jaw - 14, top + 10, cx - jaw - 22, eyeY + 40, cx - jaw - 26, 190); g.lineTo(cx - jaw - 6, 190); g.bezierCurveTo(cx - jaw - 4, eyeY + 40, cx - jaw - 2, eyeY, cx - jaw + 2, top + 34); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cx + jaw - 4, top + 26); g.bezierCurveTo(cx + jaw + 14, top + 10, cx + jaw + 22, eyeY + 40, cx + jaw + 26, 190); g.lineTo(cx + jaw + 6, 190); g.bezierCurveTo(cx + jaw + 4, eyeY + 40, cx + jaw + 2, eyeY, cx + jaw - 2, top + 34); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - jaw - 6, top + 30); g.bezierCurveTo(cx - jaw - 10, top - 22, cx + jaw + 10, top - 22, cx + jaw + 6, top + 30); g.quadraticCurveTo(cx, top + 18, cx - jaw - 6, top + 30); g.fill();
    g.strokeStyle = 'rgba(120,120,150,0.35)'; g.lineWidth = 1; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(cx - jaw - 4 + k * 2, top + 30 + k * 6); g.quadraticCurveTo(cx - jaw - 12 - k, eyeY + 30, cx - jaw - 16 - k * 1.2, 188); g.stroke(); g.beginPath(); g.moveTo(cx + jaw + 4 - k * 2, top + 30 + k * 6); g.quadraticCurveTo(cx + jaw + 12 + k, eyeY + 30, cx + jaw + 16 + k * 1.2, 188); g.stroke(); }
    hairTop(top + 28);
    const cg = g.createLinearGradient(0, top - 6, 0, top + 20); cg.addColorStop(0, '#fff0b0'); cg.addColorStop(1, '#a87020'); g.fillStyle = cg; g.beginPath(); g.moveTo(cx - 18, top + 18); g.lineTo(cx - 14, top + 2); g.lineTo(cx - 6, top + 8); g.lineTo(cx, top - 6); g.lineTo(cx + 6, top + 8); g.lineTo(cx + 14, top + 2); g.lineTo(cx + 18, top + 18); g.quadraticCurveTo(cx, top + 12, cx - 18, top + 18); g.fill();
    g.fillStyle = '#c8a040'; g.beginPath(); g.arc(cx, top + 4, 2.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx, top + 9, 3, 3.2, 0, 0, 7); g.fill(); for (const [x, c] of [[-10, '#3a8a5a'], [10, '#3a8a5a'], [0, '#e84a3a']]) { g.fillStyle = c; g.beginPath(); g.arc(cx + x, top + 15, 1.8, 0, 7); g.fill(); } return; }
  if (hat === 'emperor') { hairTop(); knot(top - 6); // the 冕: a flat board on the crown, strings of jade beads before the eyes
    g.fillStyle = metal(cx - jaw, top - 20, cx + jaw, top + 10, '#1a1a22'); g.beginPath(); g.moveTo(cx - jaw + 2, top + 16); g.lineTo(cx - jaw + 6, top - 12); g.lineTo(cx + jaw - 6, top - 12); g.lineTo(cx + jaw - 2, top + 16); g.quadraticCurveTo(cx, top + 10, cx - jaw + 2, top + 16); g.fill();
    const bg = g.createLinearGradient(0, top - 20, 0, top - 12); bg.addColorStop(0, '#3a3a4a'); bg.addColorStop(1, '#101018'); g.fillStyle = bg; g.beginPath(); g.moveTo(cx - jaw - 14, top - 14); g.lineTo(cx + jaw + 10, top - 18); g.lineTo(cx + jaw + 12, top - 12); g.lineTo(cx - jaw - 12, top - 8); g.closePath(); g.fill(); g.strokeStyle = '#c8a040'; g.lineWidth = 0.8; g.stroke();
    for (let k = 0; k < 12; k++) { const x = cx - jaw - 11 + k * ((jaw * 2 + 20) / 11), y0 = top - 10 - k * 0.35; for (let j = 0; j < 6; j++) { const bg2 = g.createRadialGradient(x - 0.4, y0 + j * 3.4 - 0.4, 0.2, x, y0 + j * 3.4, 1.4); bg2.addColorStop(0, '#f0fff0'); bg2.addColorStop(1, j % 2 ? '#c83a3a' : '#3a8a6a'); g.fillStyle = bg2; g.beginPath(); g.arc(x, y0 + j * 3.4 + 2, 1.2, 0, 7); g.fill(); } }
    g.fillStyle = '#c8a040'; g.fillRect(cx - jaw + 4, top + 10, jaw * 2 - 8, 2.5); return; }
  if (hat === 'child') { // a shaved head with two little tufts (and a lock at the front)
    for (const sd of [-1, 1]) { const x = cx + sd * (jaw * 0.55), y = top + 2; const kg = g.createRadialGradient(x - 2, y - 2, 1, x, y, 7); kg.addColorStop(0, sh(hairC, 1.6)); kg.addColorStop(1, sh(hairC, 0.5)); g.fillStyle = kg; g.beginPath(); g.ellipse(x, y, 6.5, 6, sd * 0.3, 0, 7); g.fill(); g.strokeStyle = '#c83a2a'; g.lineWidth = 1.8; g.beginPath(); g.ellipse(x, y + 4, 4, 1.5, 0, 0, Math.PI); g.stroke(); }
    g.fillStyle = hairC; g.beginPath(); g.moveTo(cx - 5, top + 8); g.quadraticCurveTo(cx, top + 4, cx + 5, top + 8); g.lineTo(cx + 2, top + 22); g.lineTo(cx - 2, top + 22); g.fill(); return; }
  if (hat === 'horns') { hairTop(); knot(); // a demon's two horns through the hair
    for (const sd of [-1, 1]) { const x = cx + sd * (jaw * 0.55), hg = g.createLinearGradient(x, top + 6, x + sd * 8, top - 22); hg.addColorStop(0, '#5a4a3a'); hg.addColorStop(0.6, '#c8b89a'); hg.addColorStop(1, '#f8f0e0'); g.fillStyle = hg; g.beginPath(); g.moveTo(x - 4, top + 8); g.quadraticCurveTo(x + sd * 2, top - 8, x + sd * 9, top - 24); g.quadraticCurveTo(x + sd * 6, top - 6, x + 4, top + 8); g.closePath(); g.fill(); g.strokeStyle = 'rgba(60,40,20,0.5)'; g.lineWidth = 0.6; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x - 3 + sd * k, top + 4 - k * 6); g.lineTo(x + 3 + sd * k, top + 3 - k * 6); g.stroke(); } }
    return; }
  if (hat === 'monk') { // the shaved head (sculpted with the face), a shadow of stubble, the burn marks of ordination
    soft2(g, cx + 4, top + 4, jaw * 0.95, 16, 'rgba(60,70,90,1)', 0.2);
    for (let i = 0; i < 6; i++) { const x = cx - 10 + (i % 3) * 10, y = top - 2 + (i < 3 ? 0 : 8); soft2(g, x, y, 2.2, 1.8, 'rgba(120,50,40,1)', 0.7); g.fillStyle = 'rgba(255,220,200,0.35)'; g.beginPath(); g.arc(x - 0.5, y - 0.5, 0.6, 0, 7); g.fill(); } return; }
  if (hat === 'hair') { // wild hair, loose and heavy: locks falling from the crown past the ears to the shoulders, a ragged fringe
    const lock = (rx, ry, tx, ty, wd, col, bend) => { const mx2 = (rx + tx) / 2 + bend, my2 = (ry + ty) / 2, lg = g.createLinearGradient(rx, ry, tx, ty); lg.addColorStop(0, sh(col, 1.2)); lg.addColorStop(0.6, col); lg.addColorStop(1, sh(col, 0.5, 0.6)); g.fillStyle = lg; g.beginPath(); g.moveTo(rx - wd, ry); g.quadraticCurveTo(mx2 - wd * 0.7, my2, tx, ty); g.quadraticCurveTo(mx2 + wd * 0.7, my2, rx + wd, ry); g.closePath(); g.fill(); g.strokeStyle = sh(col, 1.5, 0.25); g.lineWidth = 0.5; g.beginPath(); g.moveTo(rx - wd * 0.3, ry); g.quadraticCurveTo(mx2 - wd * 0.2, my2, tx, ty); g.stroke(); };
    for (let i = 0; i < 30; i++) { const sd = i % 2 ? 1 : -1, t = R(), rx = cx + sd * (jaw - 2 + t * 4), ry = top + 14 + t * 14; lock(rx, ry, cx + sd * (jaw + 5 + R() * 12), eyeY + 18 + R() * 46, 3 + R() * 3, sh(hairC, 0.55 + R() * 0.5).replace(/rgba\((\d+),(\d+),(\d+),[^)]*\)/, (m0, r1, g1, b1) => '#' + [r1, g1, b1].map((v) => (+v).toString(16).padStart(2, '0')).join('')), sd * (2 + R() * 4)); }
    hairTop(top + 22);
    for (let i = 0; i < 30; i++) { const a0 = Math.PI * (1.08 + R() * 0.84), r = jaw * 0.5 + R() * jaw * 0.3, rx = cx + Math.cos(a0) * r, ry = top + 16 + Math.sin(a0) * r * 0.95; lock(rx, ry, rx + Math.cos(a0) * (3 + R() * 4), ry + Math.sin(a0) * (2 + R() * 3) + 5, 2 + R() * 2.5, mixHex(hairC, '#000000', R() * 0.3), (R() - 0.5) * 4); }
    for (let i = 0; i < 9; i++) { const x = cx - jaw * 0.7 + i * jaw * 0.17 + (R() - 0.5) * 2; lock(x, top + 12, x + (R() - 0.5) * 5, top + 25 + R() * 6, 1.4 + R(), hairC, (R() - 0.5) * 3); }
    if (p.id === '武松') { g.fillStyle = '#b89a50'; g.fillRect(cx - jaw - 4, top + 20, jaw * 2 + 8, 5); g.fillStyle = '#e8d080'; g.beginPath(); g.arc(cx, top + 22.5, 3.5, 0, 7); g.fill(); } return; }
  if (hat === 'female') { // centre parting, side locks, a high knot with pins and a flower
    hairTop(top + 29); for (const sd of [-1, 1]) { const lg = g.createLinearGradient(cx + sd * jaw, 0, cx + sd * (jaw + 10), 0); lg.addColorStop(0, sh(hairC, sd < 0 ? 1.3 : 0.8)); lg.addColorStop(1, sh(hairC, 0.5)); g.fillStyle = lg; g.beginPath(); g.moveTo(cx + sd * (jaw - 3), top + 22); g.quadraticCurveTo(cx + sd * (jaw + 9), eyeY + 18, cx + sd * (jaw + 5), eyeY + 56); g.lineTo(cx + sd * (jaw + 1), eyeY + 50); g.quadraticCurveTo(cx + sd * (jaw + 3), eyeY + 8, cx + sd * (jaw - 4), top + 32); g.fill(); for (let i = 0; i < 16; i++) { const t = R(); g.strokeStyle = sh(hairC, 0.8 + R() * 0.6, 0.35); g.lineWidth = 0.5; g.beginPath(); g.moveTo(cx + sd * (jaw - 2 + t * 2), top + 24); g.quadraticCurveTo(cx + sd * (jaw + 5 + t * 4), eyeY + 18, cx + sd * (jaw + 2 + t * 3), eyeY + 52); g.stroke(); } }
    knot(top - 14); g.beginPath(); g.ellipse(cx, top - 4, 16, 9, 0, 0, 7); g.fill();
    g.strokeStyle = '#e8c060'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - 20, top - 14); g.lineTo(cx + 22, top - 4); g.stroke(); g.fillStyle = '#e8c060'; g.beginPath(); g.arc(cx + 22, top - 4, 2.5, 0, 7); g.fill();
    for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#f0a0b8' : '#d84a6a'; g.beginPath(); g.arc(cx - 14 + Math.cos(i * 1.26) * 4, top - 10 + Math.sin(i * 1.26) * 4, 2.6, 0, 7); g.fill(); } return; }
  if (hat === 'scarf' || hat === 'band') {
    hairTop(); knot();
    if (hat === 'band') { g.fillStyle = '#a82a22'; g.beginPath(); g.moveTo(cx - jaw - 3, top + 22); g.quadraticCurveTo(cx, top + 15, cx + jaw + 3, top + 22); g.lineTo(cx + jaw + 3, top + 29); g.quadraticCurveTo(cx, top + 22, cx - jaw - 3, top + 29); g.fill(); g.strokeStyle = '#a82a22'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + jaw + 2, top + 24); g.quadraticCurveTo(cx + jaw + 16, top + 30, cx + jaw + 14, top + 52); g.stroke(); return; }
    // a cloth wrapped over the knot, its two tails hanging behind
    const sc = ['#3a3a4a', '#4a2a22', '#2a3a4a', '#3a4a2a', '#5a4a3a'][hash(p.id) % 5], cg = g.createLinearGradient(cx - jaw, top - 24, cx + jaw, top + 26); cg.addColorStop(0, sh(sc, 1.6)); cg.addColorStop(0.5, sc); cg.addColorStop(1, sh(sc, 0.4));
    g.fillStyle = cg; g.beginPath(); g.moveTo(cx - jaw - 4, top + 26); g.bezierCurveTo(cx - jaw - 6, top - 26, cx + jaw + 6, top - 26, cx + jaw + 4, top + 26); g.quadraticCurveTo(cx, top + 16, cx - jaw - 4, top + 26); g.fill();
    g.save(); g.beginPath(); g.moveTo(cx - jaw - 4, top + 26); g.bezierCurveTo(cx - jaw - 6, top - 26, cx + jaw + 6, top - 26, cx + jaw + 4, top + 26); g.quadraticCurveTo(cx, top + 16, cx - jaw - 4, top + 26); g.clip(); for (let k = 0; k < 4; k++) { const y = top + 18 - k * 9; g.lineCap = 'round'; g.strokeStyle = sh(sc, 0.45, 0.35); g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx - jaw - 4, y + 4); g.quadraticCurveTo(cx - 2, y - 7 - k, cx + jaw + 6, y - 2 + k * 2); g.stroke(); g.strokeStyle = sh(sc, 1.6, 0.3); g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - jaw - 4, y + 2); g.quadraticCurveTo(cx - 3, y - 9 - k, cx + jaw + 6, y - 4 + k * 2); g.stroke(); } soft2(g, cx + jaw * 0.6, top + 8, jaw * 0.7, 20, 'rgba(10,8,12,1)', 0.45); soft2(g, cx - jaw * 0.4, top - 6, jaw * 0.5, 8, 'rgba(255,245,230,1)', 0.18); g.restore();
    for (const sd of [1]) { g.fillStyle = sh(sc, 0.7); g.beginPath(); g.moveTo(cx + sd * (jaw - 4), top); g.quadraticCurveTo(cx + sd * (jaw + 18), top + 10, cx + sd * (jaw + 14), top + 46); g.lineTo(cx + sd * (jaw + 8), top + 44); g.quadraticCurveTo(cx + sd * (jaw + 10), top + 14, cx + sd * (jaw - 6), top + 6); g.fill(); }
    return;
  }
  if (hat === 'taoist') { hairTop(); knot(top - 10); const tg = metal(cx - 10, top - 26, cx + 10, top - 6, '#c8a040'); g.fillStyle = tg; g.beginPath(); g.moveTo(cx - 9, top - 6); g.lineTo(cx - 7, top - 22); g.lineTo(cx, top - 28); g.lineTo(cx + 7, top - 22); g.lineTo(cx + 9, top - 6); g.fill(); g.strokeStyle = '#e8e0d0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - 18, top - 12); g.lineTo(cx + 18, top - 14); g.stroke(); return; }
  if (hat === 'scholar') { hairTop(); g.fillStyle = metal(cx - jaw, top - 24, cx + jaw, top + 24, '#2a2e38'); g.beginPath(); g.moveTo(cx - jaw - 3, top + 24); g.lineTo(cx - jaw + 2, top - 18); g.quadraticCurveTo(cx, top - 26, cx + jaw - 2, top - 18); g.lineTo(cx + jaw + 3, top + 24); g.quadraticCurveTo(cx, top + 14, cx - jaw - 3, top + 24); g.fill(); g.strokeStyle = 'rgba(200,200,220,0.25)'; g.lineWidth = 1; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + k * 7, top - 18); g.lineTo(cx + k * 8, top + 18); g.stroke(); } for (const sd of [-1, 1]) { g.fillStyle = '#3a3e48'; g.beginPath(); g.moveTo(cx + sd * jaw, top + 10); g.quadraticCurveTo(cx + sd * (jaw + 14), top + 30, cx + sd * (jaw + 10), top + 70); g.lineTo(cx + sd * (jaw + 5), top + 68); g.quadraticCurveTo(cx + sd * (jaw + 8), top + 30, cx + sd * (jaw - 4), top + 14); g.fill(); } return; }
  if (hat === 'official') { hairTop(); g.fillStyle = metal(cx - jaw, top - 22, cx + jaw, top + 24, '#1a1a20'); g.beginPath(); g.moveTo(cx - jaw - 3, top + 24); g.bezierCurveTo(cx - jaw - 4, top - 24, cx + jaw + 4, top - 24, cx + jaw + 3, top + 24); g.closePath(); g.fill(); g.fillRect(cx - jaw + 4, top - 30, jaw * 2 - 8, 14); for (const sd of [-1, 1]) { g.fillStyle = '#121216'; g.beginPath(); g.moveTo(cx + sd * jaw, top + 2); g.lineTo(cx + sd * (jaw + 40), top - 4); g.lineTo(cx + sd * (jaw + 40), top + 4); g.lineTo(cx + sd * jaw, top + 10); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(Math.min(cx + sd * jaw, cx + sd * (jaw + 40)), top - 2, 40, 1); } g.fillStyle = '#c8a040'; g.fillRect(cx - jaw + 2, top + 16, jaw * 2 - 4, 3); return; }
  if (hat === 'turban') { hairTop(); const tc = '#b8302a'; for (let k = 0; k < 6; k++) { const y = top - 16 + k * 6.5, rw = jaw + 6 - Math.abs(k - 3.2) * 2, tg = g.createLinearGradient(cx - rw, y - 4, cx + rw, y + 8); tg.addColorStop(0, sh(tc, 1.5)); tg.addColorStop(0.4, tc); tg.addColorStop(1, sh(tc, 0.35)); g.fillStyle = tg; g.beginPath(); g.ellipse(cx, y + 4, rw, 5.5, k % 2 ? 0.1 : -0.1, 0, 7); g.fill(); g.strokeStyle = sh(tc, 0.4, 0.5); g.lineWidth = 1.4; g.beginPath(); g.ellipse(cx, y + 4.5, rw - 1, 4.8, k % 2 ? 0.1 : -0.1, 0.15, Math.PI - 0.15); g.stroke(); g.strokeStyle = sh(tc, 1.7, 0.35); g.lineWidth = 0.8; g.beginPath(); g.ellipse(cx - 1, y + 2.5, rw - 3, 4, k % 2 ? 0.1 : -0.1, Math.PI + 0.4, Math.PI * 1.7); g.stroke(); } const jg = g.createRadialGradient(cx - 1.5, top + 4.5, 0.5, cx, top + 6, 4.5); jg.addColorStop(0, '#fff0b0'); jg.addColorStop(0.5, '#e8b030'); jg.addColorStop(1, '#6a4010'); g.fillStyle = jg; g.beginPath(); g.arc(cx, top + 6, 4.2, 0, 7); g.fill(); return; }
  if (hat === 'crown') { hairTop(); knot(top - 8); const cg = metal(cx - 22, top - 30, cx + 22, top, '#d8a830'); g.fillStyle = cg; g.beginPath(); g.moveTo(cx - 22, top + 4); g.lineTo(cx - 24, top - 14); g.lineTo(cx - 12, top - 6); g.lineTo(cx - 6, top - 26); g.lineTo(cx, top - 10); g.lineTo(cx + 6, top - 26); g.lineTo(cx + 12, top - 6); g.lineTo(cx + 24, top - 14); g.lineTo(cx + 22, top + 4); g.fill(); for (const [x, c] of [[-12, '#3a6ac8'], [0, '#c83a3a'], [12, '#3a6ac8']]) { g.fillStyle = c; g.beginPath(); g.arc(cx + x, top - 2, 2.6, 0, 7); g.fill(); } for (let i = 0; i < 9; i++) { g.strokeStyle = '#e8e0c8'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx - 20 + i * 5, top + 4); g.lineTo(cx - 20 + i * 5, top + 14); g.stroke(); } return; }
  hairTop(); knot();
}
// ---------------------------------------------------------------- the face as a lit surface
// A height field built from the planes of a face — the dome of the head, the brow ridge, the sockets, cheekbones and
// their hollows, the nose with its bridge, ball and wings, the muzzle, the lips and the chin — shaded per pixel with a
// warm key light from the upper left, a cool rim from the right, a little sheen and the reddening of light through skin.
function sculpt(g, o) {
  const { cx, fx, top, chin, eyeY, eyeGap, jl, jr, nb, nw, nx, my, mw, mx, skin, female, burly, old, menace, fierce, facePath, face, shave } = o;
  const PX = 3, x0 = Math.floor(cx - jl - 3), y0 = Math.floor(top - 16), w = Math.ceil(jl + jr + 6), h = Math.ceil(chin + 6 - y0), CW = w * PX, CH = h * PX;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const q = cv.getContext('2d');
  q.scale(PX, PX); q.translate(-x0, -y0); facePath(q); q.fillStyle = '#fff'; q.fill();
  const img = q.getImageData(0, 0, CW, CH), d = img.data;
  // [x, y, sx, sy, amplitude, cavity?] — positive bumps stand out, negative ones are hollows (and darken a little more)
  const F = [], add = (x, y, sx, sy, a, cav = a < 0) => F.push([x, y, sx, sy, a, cav]);
  const soft = female ? 0.7 : 1, hard = (burly || fierce ? 1.2 : 1) * soft;
  for (const sd of [-1, 1]) {
    const ex = fx + sd * eyeGap;
    add(ex, eyeY - 7, 8.5, 3, 2.6 * hard);               // brow ridge
    add(ex, eyeY + 0.5, 7.5, 5, -4.6 * (female ? 0.8 : 1)); // the socket
    add(ex - sd * 0.5, eyeY + 0.5, 5, 3, 2.4);            // the eyeball within it
    add(ex - sd * 4, eyeY + 6, 4, 2, -1);                 // the tear trough
    add(fx + sd * (eyeGap + 5), eyeY + 11, 7, 5, 3.2 * (female ? 0.8 : hard)); // the cheekbone
    add(fx + sd * (jl - 8), eyeY + 27, 6, 9, -2.8 * (female ? 0.25 : hard)); // the hollow under it
    add(fx + sd * (eyeGap + 10), eyeY - 10, 4, 7, -1.8);  // the temple
    add(fx + sd * 9, top + 20, 9, 8, 1.2);                // the two bosses of the forehead
    add(nx + sd * (nw - 2.2), nb - 0.5, 2.6, 2.2, female ? 2 : 3.4);   // the wings of the nose
    add(nx + sd * (nw + 2), nb + 4, 3, 5, -1.4);          // the crease beside them
    add(mx + sd * (mw + 1), my + 0.5, 2, 2.5, -1.2);      // the corners of the mouth
  }
  add(fx, eyeY - 6, 3, 3, 1.4 * hard);                    // between the brows
  add(nx, nb - 1.5, female ? 2.6 : 3.4, female ? 2.4 : 3, female ? 2.2 : 3.6);                         // the ball of the nose
  add(mx, my - 1, female ? 10 : 13, female ? 7 : 9, female ? 2 : 3);                              // the muzzle
  add(mx, (nb + my) / 2 + 1, 1.3, 2.6, -0.7);             // the philtrum
  add(mx, my - 1.6, mw * 0.75, 1.5, 1.2, false); add(mx, my + 2.3, mw * 0.62, 2, 1.6, false); add(mx, my + 0.2, mw * 0.9, 0.55, -1.6); // the lips and the line between
  add(mx, my + 6.5, 6, 1.8, -1.3);                        // under the lower lip
  add(fx, chin - 7, female ? 6 : 7.5, 5, female ? 2 : 3 * hard);                    // the chin
  if (!female) for (const sd of [-1, 1]) add(fx + sd * (jl - 4), chin - 14, 6, 6, burly ? 1.6 : 0.8); // the angle of the jaw
  const D = female ? 22 : 25, cy = (top + chin) / 2 + 4, hy = (chin - top) / 2 + 10;
  // the redness of the skin: cheeks, the nose, lips, the ears' side; the blue-grey of a shaved beard
  const T = [[fx - 13, eyeY + 13, 8, 6, 0.16], [fx + 12, eyeY + 13, 8, 6, 0.16], [nx, nb - 1, 4, 4, 0.16], [mx, my + 0.6, mw * 0.8, female ? 2.2 : 2.6, female ? 0.55 : 0.4]];
  if (fierce) T.push([fx, eyeY + 10, 16, 10, 0.12]);
  const SK = hex(skin), LIP = female ? [190, 70, 80] : [160, 80, 70];
  const Lk = norm(-0.72, -0.58, 0.5), Hh = norm(Lk[0], Lk[1], Lk[2] + 1);
  const H = new Float32Array(CW * CH), CAV = new Float32Array(CW * CH);
  // rows' extents, for the dome of the head
  for (let py = 0; py < CH; py++) {
    let l = -1, r = -1; for (let px = 0; px < CW; px++) if (d[(py * CW + px) * 4 + 3] > 0) { if (l < 0) l = px; r = px; }
    if (l < 0) continue;
    const y = y0 + (py + 0.5) / PX, lx = x0 + l / PX, rx = x0 + (r + 1) / PX, v = (y - cy) / hy, vert = Math.sqrt(Math.max(0, 1 - v * v * 0.7));
    for (let px = l; px <= r; px++) {
      const x = x0 + (px + 0.5) / PX, u = x < fx ? (x - fx) / (fx - lx + 1.5) : (x - fx) / (rx - fx + 1.5), i = py * CW + px;
      let z = D * Math.sqrt(Math.max(0, 1 - u * u)) * vert, cav = 0;
      // the nose: a ridge from between the eyes, growing toward the tip, dropping away beneath it
      if (y > eyeY - 2 && y < nb + 4) { const t = Math.min(1, (y - eyeY + 2) / (nb - eyeY + 2)), wd = 1.8 + 2.4 * t, amp = (female ? 1.5 + 4.6 * Math.pow(t, 1.3) : 2 + 6.5 * Math.pow(t, 1.3)) * (y > nb ? Math.exp(-Math.pow((y - nb) / 1.6, 2)) : 1), dx = (x - (nx + t * 0.3)) / wd; z += amp * Math.exp(-dx * dx); }
      for (const [fx2, fy, sx, sy, a, c2] of F) { const ax = (x - fx2) / sx, ay = (y - fy) / sy, r2 = ax * ax + ay * ay; if (r2 > 9) continue; const e = a * Math.exp(-r2); z += e; if (c2) cav -= e; }
      H[i] = z; CAV[i] = cav;
    }
  }
  // smooth the field: separable box blur, twice — no banding from the rows' extents
  { const tmp = new Float32Array(CW * CH), Rr = 3; for (let pass = 0; pass < 2; pass++) for (const [A, B, dx, dy] of [[H, tmp, 1, 0], [tmp, H, 0, 1]]) for (let py = 0; py < CH; py++) for (let px = 0; px < CW; px++) { const i = py * CW + px; if (!d[i * 4 + 3]) { B[i] = A[i]; continue; } let sum = 0, n = 0; for (let k = -Rr; k <= Rr; k++) { const xx = px + k * dx, yy = py + k * dy; if (xx < 0 || yy < 0 || xx >= CW || yy >= CH) continue; const j = yy * CW + xx; if (!d[j * 4 + 3]) continue; sum += A[j]; n++; } B[i] = sum / n; } }
  const step = 1 / PX;
  for (let py = 1; py < CH - 1; py++) for (let px = 1; px < CW - 1; px++) {
    const i = py * CW + px, al = d[i * 4 + 3]; if (!al) continue;
    const x = x0 + (px + 0.5) / PX, y = y0 + (py + 0.5) / PX;
    const hl = d[(i - 1) * 4 + 3] ? H[i - 1] : H[i] - 2 * step, hr = d[(i + 1) * 4 + 3] ? H[i + 1] : H[i] - 2 * step, hu = d[(i - CW) * 4 + 3] ? H[i - CW] : H[i], hd = d[(i + CW) * 4 + 3] ? H[i + CW] : H[i];
    const n = norm(-(hr - hl) / (2 * step), -(hd - hu) / (2 * step), 1);
    const ndl = n[0] * Lk[0] + n[1] * Lk[1] + n[2] * Lk[2], dif = Math.max(0, (ndl + 0.25) / 1.25), spec = Math.pow(Math.max(0, n[0] * Hh[0] + n[1] * Hh[1] + n[2] * Hh[2]), female ? 50 : 38), rim = Math.pow(Math.max(0, n[0]), 2.2) * Math.pow(1 - n[2], 0.8);
    const ao = Math.max(0, 1 - CAV[i] * 0.075);
    // the lit skin warm and pale, the shadow deep and red-brown, the terminator between them a little redder still
    const lit = dif * ao, term = Math.exp(-Math.pow((dif - 0.32) / 0.14, 2)) * 0.18;
    let r = SK[0] * (0.3 + 0.92 * lit) + 28 * term, gg = SK[1] * (0.22 + 0.92 * lit) - 6 * term, b = SK[2] * (0.2 + 0.9 * lit) - 8 * term;
    for (const [tx, ty, sx, sy, k] of T) { const ax = (x - tx) / sx, ay = (y - ty) / sy, r2 = ax * ax + ay * ay; if (r2 > 6) continue; const e = Math.exp(-r2) * k * (tx === mx ? 1 : 1), tc = tx === mx ? LIP : [200, 80, 60]; r += (tc[0] * lit * 1.05 - r) * e; gg += (tc[1] * lit * 1.05 - gg) * e; b += (tc[2] * lit * 1.05 - b) * e; }
    if (shave) { const ax = (x - mx) / (jl * 0.85), ay = (y - (my + 4)) / 15, r2 = ax * ax + ay * ay; if (r2 < 1 && y > nb + 1) { const e = (1 - r2) * (menace ? 0.2 : 0.11); r += (70 - r) * e; gg += (75 - gg) * e; b += (85 - b) * e; } }
    if (face === 'g') { const ax = (x - (fx + 12)) / 12, ay = (y - (eyeY + 14)) / 16, r2 = ax * ax + ay * ay; if (r2 < 1) { const e = (1 - r2) * 0.6; r += (40 * lit - r) * e; gg += (90 * lit - gg) * e; b += (130 * lit - b) * e; } }
    const sk = spec * (female ? 0.14 : 0.2) * (old ? 0.6 : 1) * ao; r += 255 * sk; gg += 240 * sk; b += 220 * sk;
    r += 120 * rim * 0.5; gg += 150 * rim * 0.5; b += 220 * rim * 0.5;
    const gr = (r + gg + b) / 3; d[i * 4] = r + (gr - r) * 0.12; d[i * 4 + 1] = gg + (gr - gg) * 0.12; d[i * 4 + 2] = b + (gr - b) * 0.12;
  }
  // the outermost rows of pixels keep the plain skin colour
  for (let i = 0; i < CW * CH; i++) { const px = i % CW, py = (i / CW) | 0; if (d[i * 4 + 3] && (px === 0 || py === 0 || px === CW - 1 || py === CH - 1)) { d[i * 4] = SK[0] * 0.5; d[i * 4 + 1] = SK[1] * 0.45; d[i * 4 + 2] = SK[2] * 0.42; } }
  q.putImageData(img, 0, 0);
  g.drawImage(cv, x0, y0, w, h);
}
function norm(x, y, z) { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; }
// ---------------------------------------------------------------- brushwork: short strokes of the picture's own colours along its edges
function brush(c, R) {
  const g = c.getContext('2d'), w = c.width, h = c.height, d = g.getImageData(0, 0, w, h).data, lum = (x, y) => { const i = (y * w + x) * 4; return d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; };
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let k = 0; k < 9000; k++) {
    const x = 3 + Math.floor(R() * (w - 6)), y = 3 + Math.floor(R() * (h - 6)), i = (y * w + x) * 4, gx = lum(x + 3, y) - lum(x - 3, y), gy = lum(x, y + 3) - lum(x, y - 3), m = Math.hypot(gx, gy);
    if (m > 70) continue; // keep the sharp edges — eyes, lips, the lines of the armour — crisp
    const a = m > 8 ? Math.atan2(gy, gx) + Math.PI / 2 : Math.PI / 2 + (R() - 0.5) * 0.8, L = m > 30 ? 4 : 9, ca = Math.cos(a) * L / 2, sa = Math.sin(a) * L / 2;
    g.strokeStyle = `rgba(${d[i]},${d[i + 1]},${d[i + 2]},0.3)`; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x - ca, y - sa); g.lineTo(x + ca, y + sa); g.stroke();
  }
  // a fine grain
  const img = g.getImageData(0, 0, w, h), q = img.data; for (let i = 0; i < q.length; i += 4) { const v = (R() - 0.5) * 9; q[i] += v; q[i + 1] += v; q[i + 2] += v; } g.putImageData(img, 0, 0);
  g.restore();
}
