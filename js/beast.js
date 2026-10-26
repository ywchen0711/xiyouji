// Painted beasts: the monkey king, the pig, and the demons with the heads of bears, tigers, wolves, oxen, lions,
// elephants, birds, deer, rhinoceroses, serpents, fish and dragons. The head is sculpted as a lit surface (the same
// light as the people: warm from the upper left, a cool rim on the right) from a skull, a muzzle, brows and cheeks;
// then fur, stripes or scales, the eyes, nose and mouth, ears, horns and manes are painted over it, on a robe or in
// armour, on the smoky ground of their world.
import { rng, hash } from './util.js';
import { kit } from './human.js';
const { W, H, hex, sh, mixHex, mix, soft2, norm } = kit;
const CACHE = new Map();

// fur / pale (muzzle, chin) / bare skin of the face / eyes; the shape of the head; nose, ears, horns, pattern, teeth
export const SPECIES = {
  monkey: { fur: '#c08a30', pale: '#e8c890', skin: '#d0906a', eye: '#e8b020', hw: 27, hh: 32, mz: 0.35, mw: 13, nose: 'flat', ears: 'side', mask: true, brow: 2, fluff: 1.15, slant: true },
  pig:    { fur: '#4a4048', pale: '#7a6a70', eye: '#3a2010', hw: 33, hh: 34, mz: 0.75, mw: 15, nose: 'pig', ears: 'flop', fang: 'up', small: true, jowl: 1.4 },
  bear:   { fur: '#24201e', pale: '#8a6a4a', eye: '#3a1a08', hw: 32, hh: 34, mz: 0.7, mw: 13, nose: 'pad', ears: 'round', small: true, fluff: 1.3 },
  tiger:  { fur: '#d0802a', pale: '#f4ecd8', eye: '#e8c020', hw: 32, hh: 33, mz: 0.6, mw: 16, nose: 'pad', ears: 'point', pattern: 'stripe', fang: 'down', whisk: true, slant: true, fluff: 1.1 },
  leopard:{ fur: '#d8a040', pale: '#f4ecd8', eye: '#e8d040', hw: 29, hh: 31, mz: 0.55, mw: 14, nose: 'pad', ears: 'point', pattern: 'spot', fang: 'down', whisk: true, slant: true },
  wolf:   { fur: '#7a7470', pale: '#e0dcd4', eye: '#e8b030', hw: 27, hh: 32, mz: 1.0, mw: 11, nose: 'pad', ears: 'tall', fang: 'down', slant: true, fluff: 1.2 },
  fox:    { fur: '#d07a30', pale: '#f8f4ec', eye: '#e8a020', hw: 26, hh: 30, mz: 0.95, mw: 10, nose: 'pad', ears: 'tall', slant: true, whisk: true },
  ox:     { fur: '#2a2628', pale: '#6a5a50', eye: '#3a1808', hw: 32, hh: 35, mz: 0.8, mw: 18, nose: 'bull', ears: 'cow', horns: 'bull', small: true },
  lion:   { fur: '#c89040', pale: '#ecd8b0', eye: '#e8a020', hw: 31, hh: 32, mz: 0.6, mw: 16, nose: 'pad', ears: 'round', mane: true, fang: 'down', whisk: true, brow: 1.4 },
  elephant:{ fur: '#a8a4a0', pale: '#c8c4bc', eye: '#3a2010', hw: 33, hh: 36, mz: 0.3, mw: 14, nose: 'trunk', ears: 'big', fang: 'tusk', small: true, wrinkle: true },
  bird:   { fur: '#c89a30', pale: '#f0e0b0', eye: '#e8c020', hw: 23, hh: 31, mz: 0, mw: 8, nose: 'beak', ears: 'none', pattern: 'feather', crest: true, slant: true, beakS: 1.8, brow: 2.2, fluff: 1.05 },
  deer:   { fur: '#e8e4dc', pale: '#fffaf0', eye: '#2a1a10', hw: 25, hh: 31, mz: 0.8, mw: 10, nose: 'pad', ears: 'leaf', horns: 'deer', big: true },
  rhino:  { fur: '#5a5c64', pale: '#7a7c84', eye: '#2a1408', hw: 33, hh: 34, mz: 0.8, mw: 17, nose: 'bull', ears: 'cow', horns: 'rhino', small: true, wrinkle: true },
  snake:  { fur: '#8a2a1a', pale: '#e0a060', eye: '#f0d020', hw: 25, hh: 28, mz: 0.8, mw: 12, nose: 'slit', ears: 'none', pattern: 'scale', slit: true, tongue: true },
  croc:   { fur: '#3a4a2a', pale: '#a8a070', eye: '#d8c020', hw: 27, hh: 29, mz: 1.25, mw: 13, nose: 'slit', ears: 'none', pattern: 'scale', slit: true, fang: 'row' },
  fish:   { fur: '#d86020', pale: '#f8e0a0', eye: '#101010', hw: 28, hh: 32, mz: 0.3, mw: 14, nose: 'none', ears: 'fin', pattern: 'scale', big: true, barbel: true },
  dragon: { fur: '#3a7a6a', pale: '#e8d8a0', eye: '#f0c020', hw: 28, hh: 31, mz: 1.0, mw: 14, nose: 'slit', ears: 'fin', horns: 'dragon', pattern: 'scale', fang: 'down', barbel: true, mane: 'fin', brow: 1.6 },
  marten: { fur: '#c8a040', pale: '#f0e0b0', eye: '#2a1a08', hw: 25, hh: 28, mz: 0.65, mw: 10, nose: 'pad', ears: 'round', whisk: true },
  mouse:  { fur: '#e8e4e0', pale: '#fff8f8', eye: '#c83040', hw: 25, hh: 28, mz: 0.7, mw: 10, nose: 'mouse', ears: 'mouse', whisk: true, big: true },
  dog:    { fur: '#2a2a2a', pale: '#c8c0b0', eye: '#e8a020', hw: 26, hh: 31, mz: 0.95, mw: 11, nose: 'pad', ears: 'tall', fang: 'down', slant: true },
  turtle: { fur: '#5a6a3a', pale: '#c8c088', eye: '#2a1a08', hw: 25, hh: 28, mz: 0.45, mw: 13, nose: 'slit', ears: 'none', pattern: 'scale', wrinkle: true, small: true },
  hou:    { fur: '#e0b040', pale: '#f8e8b8', eye: '#e84020', hw: 31, hh: 32, mz: 0.65, mw: 15, nose: 'pad', ears: 'point', mane: true, fang: 'down', horns: 'one', brow: 1.5 },
};

export function beastPortrait(p) {
  if (CACHE.has(p.id)) return CACHE.get(p.id);
  const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2; const g = c.getContext('2d'); g.scale(2, 2);
  const L = p.look || {}, base = SPECIES[L.species] || SPECIES.wolf, sp = { ...base, ...(L.fur ? { fur: L.fur } : {}), ...(L.pale ? { pale: L.pale } : {}), ...(L.eye ? { eye: L.eye } : {}), ...(L.horns ? { horns: L.horns } : {}), ...(L.mane != null ? { mane: L.mane } : {}) };
  const R = rng(hash(p.id) ^ 0x51ed), side = kit.SIDEC[p.side] || '#3a2a3a';
  kit.ground(g, R, side);
  g.save(); g.translate(80, 118); g.scale(1.36, 1.36); g.translate(-80, -108);
  if (L.halo) kit.halo(g, R, 80, 84, 52);
  const SC = 1.12, cx = 80, cy = 95, hw = sp.hw * SC, hh = sp.hh * SC, eyeY = cy - hh * 0.12, fx = cx - 3;
  // the muzzle comes forward and a little to our left (the head is turned), longer for the long-snouted
  const mzL = sp.mz, mx = fx - 2 - mzL * 4, my = cy + hh * (0.3 + mzL * 0.14), mrx = sp.mw * SC * (1 + mzL * 0.3), mry = hh * (0.26 + mzL * 0.15);
  const top = cy - hh, chin = cy + hh;
  // ---- behind the head: a mane, the far ear, long ears and horns sweeping back
  if (sp.mane === true) mane(g, R, sp, cx, cy, hw, hh);
  if (sp.mane === 'fin') for (let i = 0; i < 26; i++) { const a = Math.PI * (0.15 + R() * 0.7) * (R() < 0.5 ? 1 : -1) + Math.PI / 2, r = hw + 4 + R() * 10, x = cx + Math.cos(a) * r, y = cy + 10 + Math.sin(a) * r * 0.9; lock(g, cx + Math.cos(a) * hw * 0.8, cy + 10 + Math.sin(a) * hh * 0.8, x + Math.cos(a) * 8, y + Math.sin(a) * 6 + 8, 2.5, mixHex(sp.pale, '#000000', 0.2 + R() * 0.3), (R() - 0.5) * 6); }
  // ---- the body
  kit.body(g, R, { ...p, side: p.side }, { hat: L.armour ? 'helm' : '', robe: L.robe }, { cx, side, armour: !!L.armour, female: false, burly: sp.hw > 30, skin: sp.fur });
  // ---- the neck: fur, in the head's shadow
  { const ng = g.createLinearGradient(cx - 16, 0, cx + 16, 0); ng.addColorStop(0, sh(sp.fur, 0.7)); ng.addColorStop(1, sh(sp.fur, 0.3)); g.fillStyle = ng; g.beginPath(); g.moveTo(cx - 15, chin - 22); g.quadraticCurveTo(cx - 17, chin + 6, cx - 22, 158); g.lineTo(cx + 22, 158); g.quadraticCurveTo(cx + 17, chin + 6, cx + 15, chin - 22); g.closePath(); g.fill(); soft2(g, cx, chin + 2, hw * 0.9, 12, 'rgba(15,8,5,1)', 0.7); }
  earsBack(g, R, sp, cx, cy, hw, hh, top, eyeY);
  hornsBack(g, R, sp, cx, top, hw, eyeY);
  // ---- the head, sculpted
  const headPath = (q) => { q.beginPath(); q.ellipse(cx, cy, hw, hh, 0, 0, Math.PI * 2); if (mzL > 0 || sp.jowl) q.ellipse(mx, my, mrx * (sp.jowl || 1), mry, 0, 0, Math.PI * 2); if (sp.fluff) { q.ellipse(cx - hw * 0.55, cy + hh * 0.35, hw * 0.55 * sp.fluff, hh * 0.45, -0.3, 0, Math.PI * 2); q.ellipse(cx + hw * 0.55, cy + hh * 0.35, hw * 0.55 * sp.fluff, hh * 0.45, 0.3, 0, Math.PI * 2); } };
  const eyeGap = hw * 0.42, nX = mx - mzL * 2, nY = my - mry * 0.25;
  const F = [];
  for (const sd of [-1, 1]) { F.push([fx + sd * eyeGap, eyeY - 5, 7, 3, 2.6 * (sp.brow || 1)], [fx + sd * eyeGap, eyeY + 1, 6, 4.5, -3.2], [fx + sd * eyeGap - sd * 0.5, eyeY + 1, 4, 3, 2], [fx + sd * (eyeGap + 5), eyeY + 12, 8, 7, 3]); }
  F.push([fx, eyeY - 4, 3, 3, 1.2]);
  if (sp.nose === 'pig') F.push([nX, nY + 2, mrx * 0.6, mry * 0.6, 5]);
  if (sp.nose === 'bull') F.push([nX, nY + 4, mrx * 0.75, mry * 0.55, 3]);
  if (sp.nose === 'pad' || sp.nose === 'mouse') F.push([nX, nY - 1, 4, 3, 3]);
  if (sp.mask) { F.push([fx, eyeY + 16, 9, 6, 1.5], [mx, my + 6, 10, 5, 2.5]); } // the monkey's flat nose and its jutting mouth
  F.push([mx, my + mry * 0.55, mrx * 0.9, 1.2, -1.6]);
  const D = 24;
  const height = (x, y) => {
    let z = 0, cav = 0; const e = ((x - cx) / hw) ** 2 + ((y - cy) / hh) ** 2; if (e < 1) z = D * Math.sqrt(1 - e);
    if (mzL > 0 || sp.jowl) { const em = ((x - mx) / (mrx * (sp.jowl || 1))) ** 2 + ((y - my) / mry) ** 2; if (em < 1) { const zm = D * 0.55 + mzL * 10 * Math.sqrt(1 - em) + 4 * Math.sqrt(1 - em); z = smax(z, zm, 4); } }
    if (sp.fluff) for (const sd of [-1, 1]) { const ef = ((x - (cx + sd * hw * 0.55)) / (hw * 0.55 * sp.fluff)) ** 2 + ((y - (cy + hh * 0.35)) / (hh * 0.45)) ** 2; if (ef < 1) z = smax(z, D * 0.5 * Math.sqrt(1 - ef), 5); }
    for (const [fx2, fy, sx, sy, a] of F) { const ax = (x - fx2) / sx, ay = (y - fy) / sy, r2 = ax * ax + ay * ay; if (r2 > 9) continue; const ee = a * Math.exp(-r2); z += ee; if (a < 0) cav -= ee; }
    return [z, cav];
  };
  const SK = hex(sp.fur), PA = hex(sp.pale), BS = sp.skin ? hex(sp.skin) : null;
  const colour = (x, y) => {
    let c = SK;
    // the pale of muzzle, cheeks and chin
    const em = ((x - mx) / (mrx * 1.15)) ** 2 + ((y - my) / (mry * 1.2)) ** 2, chinT = Math.max(0, (y - (cy + hh * 0.45)) / (hh * 0.55)), k = Math.min(1, Math.max(0, 1.2 - em) * 0.9 + chinT * 0.6) * (sp.pattern === 'scale' ? 0.7 : 1);
    c = [c[0] + (PA[0] - c[0]) * k, c[1] + (PA[1] - c[1]) * k, c[2] + (PA[2] - c[2]) * k];
    if (BS) { // the monkey's bare face: a heart shape round the eyes, down to the mouth
      const u = (x - fx) / (hw * 0.72), v = (y - (eyeY + 6)) / (hh * 0.7), heart = (u * u + v * v * 1.1 - 0.75) + Math.abs(u) * 0.35 * (v < 0 ? (1 + v * 1.4) : 0); const m = heart < 0 ? 1 : Math.max(0, 1 - heart * 6);
      c = [c[0] + (BS[0] - c[0]) * m, c[1] + (BS[1] - c[1]) * m, c[2] + (BS[2] - c[2]) * m];
    }
    return c;
  };
  lit(g, { x0: Math.floor(cx - hw - 24), y0: Math.floor(top - 2), w: Math.ceil(hw * 2 + 48), h: Math.ceil(hh * 2 + 10) }, headPath, height, colour, { spec: sp.pattern === 'scale' ? 0.35 : 0.12, rimK: 0.5 });
  // ---- over the surface: pattern, fur, wrinkles
  g.save(); headPath(g); g.clip();
  if (sp.pattern === 'stripe') stripes(g, R, cx, cy, hw, hh, fx, eyeY);
  if (sp.pattern === 'spot') for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, r = R() * 0.95, x = cx + Math.cos(a) * hw * r, y = cy + Math.sin(a) * hh * r * 0.9; if (Math.hypot(x - mx, y - my) < mrx) continue; g.strokeStyle = 'rgba(40,20,8,0.7)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 1.6 + R(), R() * 3, R() * 3 + 4.5); g.stroke(); }
  if (sp.pattern === 'scale') for (let row = 0; row < 18; row++) for (let k = 0; k < 16; k++) { const x = cx - hw - 4 + k * 4.4 + (row % 2) * 2.2, y = top + 4 + row * 4.4; if (Math.hypot(x - fx, y - eyeY) < 9) continue; const litK = 1.25 - (x - cx + hw) / (hw * 2) * 0.7; g.strokeStyle = `rgba(${litK > 1 ? '255,250,220' : '10,10,6'},${0.12 + Math.abs(litK - 1) * 0.25})`; g.lineWidth = 0.6; g.beginPath(); g.arc(x, y, 2.4, 0.15, Math.PI - 0.15); g.stroke(); }
  if (sp.pattern === 'feather') for (let i = 0; i < 90; i++) { const a = R() * Math.PI * 2, r = 0.3 + R() * 0.7, x = cx + Math.cos(a) * hw * r, y = cy + Math.sin(a) * hh * r; g.strokeStyle = `rgba(${R() < 0.5 ? '255,240,200' : '60,30,8'},0.3)`; g.lineWidth = 0.7; g.beginPath(); g.arc(x, y, 3, 0.3 + a, 2.5 + a); g.stroke(); }
  if (sp.wrinkle) { g.strokeStyle = 'rgba(30,25,20,0.35)'; g.lineWidth = 0.6; for (let i = 0; i < 26; i++) { const x = cx - hw + R() * hw * 2, y = top + 8 + R() * hh * 1.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 1.5, x + 8, y); g.stroke(); } }
  if (sp.pattern !== 'scale' && sp.pattern !== 'feather') for (let i = 0; i < 520; i++) { // fur: short strokes combed out from the brow and down the cheeks
    const a = R() * Math.PI * 2, r = Math.sqrt(R()), x = cx + Math.cos(a) * hw * r, y = cy + Math.sin(a) * hh * r; if (BS && Math.hypot((x - fx) / (hw * 0.8), (y - eyeY - 6) / (hh * 0.75)) < 0.8) continue;
    const dir = Math.atan2(y - (eyeY - 8), x - fx), lt = x < cx ? '255,240,215' : '15,10,8'; g.strokeStyle = `rgba(${R() < 0.55 ? lt : '20,12,8'},${0.12 + R() * 0.16})`; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(dir) * 3, y + Math.sin(dir) * 3); g.stroke(); }
  g.restore();
  // fur standing out round the edge of the head, lit on the left
  if (sp.pattern !== 'scale') for (let i = 0; i < 160; i++) { const a = R() * Math.PI * 2; if (Math.sin(a) > 0.65 && Math.abs(Math.cos(a)) < 0.45) continue; const x = cx + Math.cos(a) * hw * 0.97, y = cy + Math.sin(a) * hh * 0.97, l = 2.5 + R() * 4; g.strokeStyle = Math.cos(a) < 0 ? sh(sp.fur, 1.1 + R() * 0.4, 0.75) : sh(sp.fur, 0.45 + R() * 0.3, 0.75); g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5, x + Math.cos(a + 0.3) * l, y + Math.sin(a + 0.3) * l + 1); g.stroke(); }
  // ---- the face
  eyes(g, R, sp, fx, eyeY, eyeGap, L);
  nose(g, R, sp, nX, nY, mx, my, mrx, mry, cx, hw);
  mouth(g, R, sp, mx, my, mrx, mry);
  earsFront(g, R, sp, cx, cy, hw, hh, top, eyeY);
  hornsFront(g, R, sp, cx, top, hw, eyeY, nX, nY);
  if (sp.crest) for (let i = 0; i < 9; i++) lock(g, cx - 8 + i * 2, top + 4, cx + 6 + i * 3, top - 18 - i * 1.5, 2.2, mixHex(sp.fur, '#ffffff', 0.2 + R() * 0.3), -4);
  if (L.circlet) circlet(g, cx, top, hw);
  if (L.crown) { const cg = g.createLinearGradient(0, top - 16, 0, top + 6); cg.addColorStop(0, '#fff0b0'); cg.addColorStop(1, '#a87020'); g.fillStyle = cg; g.beginPath(); g.moveTo(cx - 16, top + 8); g.lineTo(cx - 18, top - 8); g.lineTo(cx - 8, top - 2); g.lineTo(cx, top - 16); g.lineTo(cx + 8, top - 2); g.lineTo(cx + 18, top - 8); g.lineTo(cx + 16, top + 8); g.quadraticCurveTo(cx, top + 2, cx - 16, top + 8); g.fill(); g.fillStyle = '#c83a3a'; g.beginPath(); g.arc(cx, top + 1, 2.2, 0, 7); g.fill(); }
  if (L.cap) { const cg = g.createLinearGradient(cx - hw, top - 10, cx + hw, top + 16); cg.addColorStop(0, sh(L.cap, 1.5)); cg.addColorStop(1, sh(L.cap, 0.4)); g.fillStyle = cg; g.beginPath(); g.moveTo(cx - hw * 0.8, top + 14); g.bezierCurveTo(cx - hw * 0.85, top - 14, cx + hw * 0.85, top - 14, cx + hw * 0.8, top + 14); g.quadraticCurveTo(cx, top + 6, cx - hw * 0.8, top + 14); g.fill(); }
  if (L.heads) for (const [dx, dy, s] of [[-30, -16, 0.42], [30, -18, 0.42], [-18, -34, 0.36], [18, -36, 0.36]].slice(0, L.heads)) miniHead(g, R, sp, cx + dx, cy + dy, s);
  g.restore();
  kit.finish(c, g, R);
  CACHE.set(p.id, c); return c;
}
const smax = (a, b, k) => { const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / k)); return a + (b - a) * h + k * h * (1 - h); };

// a surface lit pixel by pixel: the mask's shape, a height for every point, a colour for every point
function lit(g, box, mask, height, colour, o = {}) {
  const PX = 3, { x0, y0, w, h } = box, CW = w * PX, CH = h * PX;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const q = cv.getContext('2d');
  q.scale(PX, PX); q.translate(-x0, -y0); mask(q); q.fillStyle = '#fff'; q.fill();
  const img = q.getImageData(0, 0, CW, CH), d = img.data, Hf = new Float32Array(CW * CH), CAV = new Float32Array(CW * CH), col = new Float32Array(CW * CH * 3);
  for (let py = 0; py < CH; py++) for (let px = 0; px < CW; px++) { const i = py * CW + px; if (!d[i * 4 + 3]) continue; const x = x0 + (px + 0.5) / PX, y = y0 + (py + 0.5) / PX, [z, cav] = height(x, y), c = colour(x, y); Hf[i] = z; CAV[i] = cav; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
  { const tmp = new Float32Array(CW * CH), Rr = 3; for (let pass = 0; pass < 2; pass++) for (const [A, B, dx, dy] of [[Hf, tmp, 1, 0], [tmp, Hf, 0, 1]]) for (let py = 0; py < CH; py++) for (let px = 0; px < CW; px++) { const i = py * CW + px; if (!d[i * 4 + 3]) { B[i] = A[i]; continue; } let sum = 0, n = 0; for (let k = -Rr; k <= Rr; k++) { const xx = px + k * dx, yy = py + k * dy; if (xx < 0 || yy < 0 || xx >= CW || yy >= CH) continue; const j = yy * CW + xx; if (!d[j * 4 + 3]) continue; sum += A[j]; n++; } B[i] = sum / n; } }
  const Lk = norm(-0.72, -0.58, 0.5), Hh = norm(Lk[0], Lk[1], Lk[2] + 1), step = 1 / PX;
  for (let py = 1; py < CH - 1; py++) for (let px = 1; px < CW - 1; px++) {
    const i = py * CW + px; if (!d[i * 4 + 3]) continue;
    const hl = d[(i - 1) * 4 + 3] ? Hf[i - 1] : Hf[i] - 2 * step, hr = d[(i + 1) * 4 + 3] ? Hf[i + 1] : Hf[i] - 2 * step, hu = d[(i - CW) * 4 + 3] ? Hf[i - CW] : Hf[i], hd = d[(i + CW) * 4 + 3] ? Hf[i + CW] : Hf[i];
    const n = norm(-(hr - hl) / (2 * step), -(hd - hu) / (2 * step), 1), ndl = n[0] * Lk[0] + n[1] * Lk[1] + n[2] * Lk[2], dif = Math.max(0, (ndl + 0.25) / 1.25), spec = Math.pow(Math.max(0, n[0] * Hh[0] + n[1] * Hh[1] + n[2] * Hh[2]), 30), rim = Math.pow(Math.max(0, n[0]), 2.2) * Math.pow(1 - n[2], 0.8);
    const ao = Math.max(0, 1 - CAV[i] * 0.08), l = dif * ao, term = Math.exp(-Math.pow((dif - 0.32) / 0.14, 2)) * 0.15;
    let r = col[i * 3] * (0.28 + 0.95 * l) + 20 * term, gg = col[i * 3 + 1] * (0.24 + 0.95 * l), b = col[i * 3 + 2] * (0.24 + 0.92 * l) - 4 * term;
    const sk = spec * (o.spec ?? 0.15) * ao; r += 255 * sk; gg += 245 * sk; b += 225 * sk; const rk = (o.rimK ?? 0.5) * rim; r += 120 * rk; gg += 150 * rk; b += 220 * rk;
    d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b;
  }
  for (let px = 0; px < CW; px++) for (const py of [0, CH - 1]) { const i = py * CW + px; if (d[i * 4 + 3]) { d[i * 4] = col[i * 3] * 0.4; d[i * 4 + 1] = col[i * 3 + 1] * 0.4; d[i * 4 + 2] = col[i * 3 + 2] * 0.4; } }
  for (let py = 0; py < CH; py++) for (const px of [0, CW - 1]) { const i = py * CW + px; if (d[i * 4 + 3]) { d[i * 4] = col[i * 3] * 0.4; d[i * 4 + 1] = col[i * 3 + 1] * 0.4; d[i * 4 + 2] = col[i * 3 + 2] * 0.4; } }
  q.putImageData(img, 0, 0); g.drawImage(cv, x0, y0, w, h);
}
// a lock of hair or a feather: a tapered, curved shape with its light on the left
function lock(g, rx, ry, tx, ty, wd, col, bend) { const mx = (rx + tx) / 2 + bend, my = (ry + ty) / 2, lg = g.createLinearGradient(rx, ry, tx, ty); lg.addColorStop(0, sh(col, 1.2)); lg.addColorStop(0.6, col); lg.addColorStop(1, sh(col, 0.5, 0.6)); g.fillStyle = lg; g.beginPath(); g.moveTo(rx - wd, ry); g.quadraticCurveTo(mx - wd * 0.7, my, tx, ty); g.quadraticCurveTo(mx + wd * 0.7, my, rx + wd, ry); g.closePath(); g.fill(); g.strokeStyle = sh(col, 1.5, 0.25); g.lineWidth = 0.5; g.beginPath(); g.moveTo(rx - wd * 0.3, ry); g.quadraticCurveTo(mx - wd * 0.2, my, tx, ty); g.stroke(); }
function mane(g, R, sp, cx, cy, hw, hh) {
  const dark = mixHex(sp.fur, '#2a1408', 0.45);
  { const mg = g.createRadialGradient(cx - 10, cy - 10, 10, cx, cy + 10, hw * 2.2); mg.addColorStop(0, sh(sp.fur, 1.1)); mg.addColorStop(1, sh(dark, 0.6)); g.fillStyle = mg; g.beginPath(); g.ellipse(cx, cy + 12, hw * 1.75, hh * 1.65, 0, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 120; i++) { const a = R() * Math.PI * 2, r0 = 0.75 + R() * 0.3, x0 = cx + Math.cos(a) * hw * r0, y0 = cy + 8 + Math.sin(a) * hh * r0, L = 14 + R() * 22, x1 = cx + Math.cos(a) * (hw + L), y1 = cy + 12 + Math.sin(a) * (hh + L * 0.9) + 6; lock(g, x0, y0, x1, y1, 2.5 + R() * 2.5, mixHex(Math.cos(a) < 0 ? sp.fur : dark, '#000000', R() * 0.3), (R() - 0.5) * 8); }
}
function stripes(g, R, cx, cy, hw, hh, fx, eyeY) {
  g.fillStyle = 'rgba(20,10,6,0.85)';
  const st = (x0, y0, x1, y1, w) => { g.beginPath(); g.moveTo(x0 - w, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 2, x1, y1); g.quadraticCurveTo((x0 + x1) / 2 + w * 0.6, (y0 + y1) / 2 + 1, x0 + w, y0); g.fill(); };
  // 王 on the brow
  for (const [y, w] of [[eyeY - 20, 8], [eyeY - 14, 6], [eyeY - 8, 7]]) { g.fillRect(fx - w, y, w * 2, 1.8); } g.fillRect(fx - 0.9, eyeY - 20, 1.8, 13.8);
  for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const x = cx + sd * (hw - 2), y = eyeY - 10 + k * 9; st(x, y, x - sd * (8 + R() * 5), y + 3 + R() * 2, 1.8); }
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const x = fx + sd * (6 + k * 5), y = cy - hh + 6; st(x, y, x + sd * 2, y + 10 + k * 2, 1.4); }
}
function eyes(g, R, sp, fx, eyeY, gap, L) {
  for (const sd of [-1, 1]) {
    const far = sd > 0, ex = fx + sd * gap - (far ? 0.6 : 0), ey = eyeY, w = (sp.small ? 4.6 : sp.big ? 6.6 : 5.8) * (far ? 0.86 : 1), h = sp.small ? 2.2 : sp.big ? 4 : 3, tilt = sp.slant ? -sd * 1.6 : 0;
    const ix = ex - sd * w, iy = ey + 1 - tilt * 0.3, ox = ex + sd * w, oy = ey + tilt, up = ey - h * 1.4, lo = ey + h;
    const path = () => { g.beginPath(); g.moveTo(ix, iy); g.bezierCurveTo(ix + sd * w * 0.4, up, ox - sd * w * 0.4, up + tilt * 0.4, ox, oy); g.bezierCurveTo(ox - sd * w * 0.4, lo, ix + sd * w * 0.4, lo, ix, iy); g.closePath(); };
    soft2(g, ex, ey, w + 3, h + 3, 'rgba(15,8,4,1)', 0.55);
    path(); { const ig = g.createRadialGradient(ex - 0.5, ey + 0.6, 0.3, ex, ey, w); ig.addColorStop(0, sh(sp.eye, 1.4)); ig.addColorStop(0.6, sp.eye); ig.addColorStop(1, sh(sp.eye, 0.35)); g.fillStyle = ig; g.fill(); }
    g.save(); path(); g.clip();
    g.fillStyle = '#050304'; if (sp.slit) { g.beginPath(); g.ellipse(ex, ey, 0.8, h * 1.1, 0, 0, 7); g.fill(); } else { g.beginPath(); g.arc(ex + (far ? -0.4 : 0.3), ey, sp.small ? 1.2 : 1.8, 0, 7); g.fill(); }
    { const lg = g.createLinearGradient(0, up, 0, ey + 0.5); lg.addColorStop(0, 'rgba(20,8,4,0.75)'); lg.addColorStop(1, 'rgba(20,8,4,0)'); g.fillStyle = lg; g.fillRect(ex - w - 2, up - 1, w * 2 + 4, ey - up + 1.5); }
    if (L.fireEyes) { g.fillStyle = 'rgba(255,90,30,0.45)'; g.fillRect(ex - w, ey - h * 2, w * 2, h * 4); }
    g.restore();
    g.fillStyle = 'rgba(255,252,245,0.95)'; g.beginPath(); g.arc(ex - 0.9, ey - 0.9, sp.small ? 0.6 : 0.85, 0, 7); g.fill();
    g.strokeStyle = '#0a0604'; g.lineWidth = 1.2; path(); g.stroke();
    // the brow above: heavy fur, set in a frown
    const bc = sp.mask ? mixHex(sp.fur, '#ffffff', 0.15) : mixHex(sp.fur, '#000000', 0.25); for (let i = 0; i < 26; i++) { const t = R(), x = ex - sd * w + sd * t * (w * 2 + 3), y = up - 3.2 + (1 - t) * 2.2 * (sp.brow || 1) - Math.sin(t * Math.PI) * 1.4 + (R() - 0.5) * 1.6; g.strokeStyle = sh(bc, 0.7 + R() * 0.7, 0.7); g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sd * 2.4, y - 1.2); g.stroke(); }
    if (L.fireEyes) soft2(g, ex, ey, w + 2, h + 2, 'rgba(255,120,40,1)', 0.25);
  }
}
function nose(g, R, sp, nX, nY, mx, my, mrx, mry, cx, hw) {
  const n = sp.nose;
  if (n === 'flat') { g.fillStyle = 'rgba(50,20,12,0.85)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(nX + sd * 2.4, nY - 2, 1.4, 0.9, sd * 0.4, 0, 7); g.fill(); } return; }
  if (n === 'pad' || n === 'mouse') { const s = n === 'mouse' ? 0.6 : 1, ng = g.createLinearGradient(0, nY - 4 * s, 0, nY + 3 * s); ng.addColorStop(0, n === 'mouse' ? '#f0a0a8' : '#4a3a38'); ng.addColorStop(1, n === 'mouse' ? '#a05058' : '#0a0606'); g.fillStyle = ng; g.beginPath(); g.moveTo(nX - 5 * s, nY - 3 * s); g.quadraticCurveTo(nX, nY - 5.5 * s, nX + 5 * s, nY - 3 * s); g.quadraticCurveTo(nX + 3.5 * s, nY + 2.5 * s, nX, nY + 3 * s); g.quadraticCurveTo(nX - 3.5 * s, nY + 2.5 * s, nX - 5 * s, nY - 3 * s); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(nX - 1.5 * s, nY - 3 * s, 1.6 * s, 0.7 * s, -0.2, 0, 7); g.fill(); g.strokeStyle = 'rgba(15,8,6,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(nX, nY + 3 * s); g.lineTo(nX, my + mry * 0.5); g.stroke(); return; }
  if (n === 'pig') { const r = mrx * 0.55, ng = g.createRadialGradient(nX - r * 0.3, nY - r * 0.3, 1, nX, nY + 1, r * 1.1); ng.addColorStop(0, mixHex(sp.pale, '#ffd0d0', 0.4)); ng.addColorStop(1, sh(sp.pale, 0.45)); g.fillStyle = ng; g.beginPath(); g.ellipse(nX, nY + 1, r, r * 0.72, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(20,10,10,0.6)'; g.lineWidth = 0.8; g.stroke(); g.fillStyle = '#140a0a'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(nX + sd * r * 0.4, nY + 1.5, r * 0.18, r * 0.3, sd * 0.2, 0, 7); g.fill(); } return; }
  if (n === 'bull') { g.fillStyle = 'rgba(20,14,14,0.6)'; g.beginPath(); g.ellipse(nX, nY + 4, mrx * 0.7, mry * 0.45, 0, 0, 7); g.fill(); g.fillStyle = '#0a0606'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(nX + sd * mrx * 0.38, nY + 4, 2, 3, sd * 0.4, 0, 7); g.fill(); } if (sp.ring !== false && sp.horns === 'bull') { g.strokeStyle = '#e8c050'; g.lineWidth = 1.4; g.beginPath(); g.arc(nX, nY + 9, 4, 0.2, Math.PI - 0.2); g.stroke(); } return; }
  if (n === 'slit') { g.fillStyle = '#0a0806'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(nX + sd * 3.5, nY - 1, 1.6, 0.8, sd * 0.5, 0, 7); g.fill(); } return; }
  if (n === 'beak') { const S = sp.beakS || 1; g.save(); g.translate(nX + 2, nY - 6); g.scale(S, S); g.translate(-(nX + 2), -(nY - 6)); const bx = nX + 2, by = nY - 6, bg = g.createLinearGradient(bx - 12, by - 6, bx + 8, by + 14); bg.addColorStop(0, '#fff4c0'); bg.addColorStop(0.5, '#e0a820'); bg.addColorStop(1, '#6a3a08'); g.fillStyle = bg; g.beginPath(); g.moveTo(bx - 9, by - 6); g.quadraticCurveTo(bx + 8, by - 8, bx + 8, by + 4); g.quadraticCurveTo(bx + 4, by + 16, bx - 6, by + 18); g.quadraticCurveTo(bx - 2, by + 8, bx - 10, by + 6); g.closePath(); g.fill(); g.strokeStyle = '#3a2008'; g.lineWidth = 0.8; g.stroke(); g.beginPath(); g.moveTo(bx - 9, by + 5); g.quadraticCurveTo(bx - 2, by + 6, bx + 3, by + 10); g.stroke(); g.fillStyle = '#1a0c04'; g.beginPath(); g.ellipse(bx - 3, by - 2, 1.5, 0.8, 0.3, 0, 7); g.fill(); g.restore(); return; }
  if (n === 'trunk') { const tg = g.createLinearGradient(nX - 8, 0, nX + 8, 0); tg.addColorStop(0, sh(sp.fur, 1.3)); tg.addColorStop(1, sh(sp.fur, 0.45)); g.fillStyle = tg; g.beginPath(); g.moveTo(nX - 7, nY - 10); g.bezierCurveTo(nX - 9, nY + 14, nX - 12, nY + 34, nX - 4, nY + 52); g.lineTo(nX + 4, nY + 50); g.bezierCurveTo(nX - 2, nY + 32, nX + 3, nY + 14, nX + 7, nY - 10); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,36,32,0.45)'; g.lineWidth = 0.7; for (let k = 0; k < 14; k++) { const y = nY - 4 + k * 4; g.beginPath(); g.moveTo(nX - 7 + k * 0.1, y); g.quadraticCurveTo(nX - 2, y + 1.5, nX + 5 - k * 0.2, y); g.stroke(); } return; }
}
function mouth(g, R, sp, mx, my, mrx, mry) {
  const y = my + mry * 0.55, w = mrx * 0.85;
  g.strokeStyle = '#140806'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(mx - w, y - 1); g.quadraticCurveTo(mx, y + 2, mx + w, y - 1); g.stroke();
  if (sp.fang === 'down') for (const sd of [-1, 1]) { const x = mx + sd * w * 0.55; g.fillStyle = '#f4ecd8'; g.beginPath(); g.moveTo(x - 1.6, y); g.lineTo(x, y + 6); g.lineTo(x + 1.6, y); g.fill(); g.strokeStyle = 'rgba(60,40,20,0.5)'; g.lineWidth = 0.4; g.stroke(); }
  if (sp.fang === 'up') for (const sd of [-1, 1]) { const x = mx + sd * w * 0.85; g.fillStyle = '#f0e8d0'; g.beginPath(); g.moveTo(x - 2, y + 1); g.quadraticCurveTo(x + sd * 1, y - 6, x + sd * 3, y - 10); g.quadraticCurveTo(x + sd * 2, y - 4, x + 2, y + 1); g.fill(); }
  if (sp.fang === 'tusk') for (const sd of [-1, 1]) { const x = mx + sd * 7, tg = g.createLinearGradient(x, y, x + sd * 16, y + 22); tg.addColorStop(0, '#c8bca0'); tg.addColorStop(1, '#fffaf0'); g.fillStyle = tg; g.beginPath(); g.moveTo(x - 2.5, y - 2); g.quadraticCurveTo(x + sd * 6, y + 18, x + sd * 18, y + 20); g.quadraticCurveTo(x + sd * 4, y + 10, x + 2.5, y - 2); g.fill(); }
  if (sp.fang === 'row') for (let k = -4; k <= 4; k++) { const x = mx + k * w / 4.5; g.fillStyle = '#f0e8d0'; g.beginPath(); g.moveTo(x - 1, y - 1); g.lineTo(x, y + 2.5); g.lineTo(x + 1, y - 1); g.fill(); }
  if (sp.tongue) { g.strokeStyle = '#c82a3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(mx - 2, y + 1); g.quadraticCurveTo(mx - 6, y + 8, mx - 4, y + 12); g.moveTo(mx - 6, y + 8); g.lineTo(mx - 9, y + 13); g.stroke(); }
  if (sp.whisk) for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { g.strokeStyle = 'rgba(255,250,240,0.55)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(mx + sd * w * 0.6, my - 1 + k * 2); g.quadraticCurveTo(mx + sd * (w + 8), my - 3 + k * 3, mx + sd * (w + 18), my - 4 + k * 4); g.stroke(); }
  if (sp.barbel) for (const sd of [-1, 1]) { g.strokeStyle = sh(sp.pale, 0.9, 0.85); g.lineWidth = 1.2; g.beginPath(); g.moveTo(mx + sd * w * 0.7, my - 2); g.bezierCurveTo(mx + sd * (w + 10), my - 8, mx + sd * (w + 12), my + 14, mx + sd * (w + 24), my + 24); g.stroke(); }
  if (sp.mask) { // the monkey's mouth: thin lips, jutting
    g.strokeStyle = 'rgba(80,30,20,0.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(mx - w * 0.9, y - 2.5); g.quadraticCurveTo(mx, y - 4, mx + w * 0.9, y - 2.5); g.stroke(); }
}
function earsBack(g, R, sp, cx, cy, hw, hh, top, eyeY) {
  const e = sp.ears, fill = (sd, path, inner) => { const eg = g.createLinearGradient(cx - hw, 0, cx + hw, 0); eg.addColorStop(0, sh(sp.fur, 1.15)); eg.addColorStop(1, sh(sp.fur, 0.45)); g.fillStyle = eg; path(); g.fill(); if (inner) { g.fillStyle = inner; g.save(); g.translate(0, 0); inner && (g.globalAlpha = 0.85); path(0.55); g.fill(); g.restore(); } };
  for (const sd of [-1, 1]) {
    const x = cx + sd * hw * 0.62, y = top + 6;
    if (e === 'point' || e === 'tall') { const t = e === 'tall' ? 1.6 : 1; fill(sd, (k = 1) => { g.beginPath(); g.moveTo(x - 9 * k, y + 8 * k); g.quadraticCurveTo(x + sd * 2, y - 14 * t * k, x + sd * 6 * k, y - 18 * t * k); g.quadraticCurveTo(x + sd * 10 * k, y - 4 * k, x + 9 * k + sd * 4, y + 8 * k); g.closePath(); }, '#3a2020'); }
    if (e === 'round' || e === 'mouse') { const r = e === 'mouse' ? 14 : 8; fill(sd, (k = 1) => { g.beginPath(); g.arc(x + sd * 4, y - 2, r * k, 0, 7); }, e === 'mouse' ? '#f0b8c0' : '#2a1810'); }
    if (e === 'leaf') fill(sd, (k = 1) => { g.beginPath(); g.ellipse(x + sd * 14, y + 4, 12 * k, 5 * k, sd * -0.5, 0, 7); }, '#d8a8a0');
    if (e === 'big') fill(sd, (k = 1) => { g.beginPath(); g.ellipse(cx + sd * (hw + 8), cy + 4, 18 * k, 30 * k, sd * 0.15, 0, 7); }, '#c89a98');
    if (e === 'fin') { for (let k = 0; k < 5; k++) lock(g, cx + sd * (hw - 4), eyeY + k * 4, cx + sd * (hw + 14 + k * 2), eyeY - 10 + k * 7, 2.4, mixHex(sp.pale, '#c83a20', 0.3), sd * 3); }
    if (e === 'cow') fill(sd, (k = 1) => { g.beginPath(); g.ellipse(cx + sd * (hw + 6), eyeY - 6, 11 * k, 5 * k, sd * 0.35, 0, 7); }, '#5a3a3a');
  }
}
function earsFront(g, R, sp, cx, cy, hw, hh, top, eyeY) {
  for (const sd of [-1, 1]) {
    if (sp.ears === 'side') { const x = cx + sd * (hw + 1), y = eyeY + 4, eg = g.createRadialGradient(x - sd * 2, y - 2, 1, x, y, 8); eg.addColorStop(0, sh(sp.skin || sp.fur, 1.15)); eg.addColorStop(1, sh(sp.skin || sp.fur, 0.5)); g.fillStyle = eg; g.beginPath(); g.ellipse(x, y, 6, 8, sd * 0.2, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,25,15,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.stroke(); }
    if (sp.ears === 'flop') { const x = cx + sd * hw * 0.55, y = top + 8, eg = g.createLinearGradient(x, y, x + sd * 16, y + 30); eg.addColorStop(0, sh(sp.fur, 1.2)); eg.addColorStop(1, sh(sp.fur, 0.4)); g.fillStyle = eg; g.beginPath(); g.moveTo(x - sd * 8, y); g.quadraticCurveTo(x + sd * 22, y - 6, x + sd * 26, y + 26); g.quadraticCurveTo(x + sd * 12, y + 20, x + sd * 2, y + 14); g.closePath(); g.fill(); g.strokeStyle = 'rgba(20,10,10,0.5)'; g.lineWidth = 0.7; g.stroke(); g.strokeStyle = 'rgba(255,220,220,0.15)'; g.beginPath(); g.moveTo(x, y + 4); g.quadraticCurveTo(x + sd * 14, y + 2, x + sd * 22, y + 20); g.stroke(); }
  }
}
function hornsBack(g, R, sp, cx, top, hw, eyeY) {
  if (sp.horns === 'bull') for (const sd of [-1, 1]) { const x = cx + sd * hw * 0.6, y = top + 10, hg = g.createLinearGradient(x, y, x + sd * 40, y - 26); hg.addColorStop(0, '#4a3a2a'); hg.addColorStop(0.5, '#c8b898'); hg.addColorStop(1, '#fffaf0'); g.fillStyle = hg; g.beginPath(); g.moveTo(x - sd * 6, y + 4); g.bezierCurveTo(x + sd * 22, y + 6, x + sd * 40, y - 6, x + sd * 36, y - 30); g.bezierCurveTo(x + sd * 34, y - 12, x + sd * 18, y - 6, x - sd * 2, y - 6); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,30,20,0.4)'; g.lineWidth = 0.6; for (let k = 1; k < 6; k++) { const t = k / 6; g.beginPath(); g.moveTo(x + sd * (t * 30), y + 3 - t * 12); g.lineTo(x + sd * (t * 30 + 2), y - 6 - t * 10); g.stroke(); } }
  if (sp.horns === 'deer' || sp.horns === 'dragon') for (const sd of [-1, 1]) { const x = cx + sd * hw * 0.45, y = top + 6, col = sp.horns === 'dragon' ? '#e8d090' : '#c8a878', w = sp.horns === 'dragon' ? 3.2 : 2.2; g.lineCap = 'round'; const br = (x0, y0, a, l, d) => { const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; g.strokeStyle = sh(col, 0.5); g.lineWidth = w * (1 - d * 0.22) + 0.8; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = col; g.lineWidth = w * (1 - d * 0.22); g.beginPath(); g.moveTo(x0 - 0.5, y0); g.lineTo(x1 - 0.5, y1); g.stroke(); if (d < 3) { br(x1, y1, a - sd * 0.5, l * 0.7, d + 1); if (d < 2) br(x1, y1, a + sd * 0.45, l * 0.6, d + 1); } }; br(x, y, -Math.PI / 2 + sd * 0.5, 14, 0); }
  if (sp.horns === 'ram') for (const sd of [-1, 1]) { const x = cx + sd * hw * 0.8, y = top + 18; g.strokeStyle = '#8a7a5a'; g.lineWidth = 6; g.beginPath(); g.arc(x + sd * 6, y + 6, 9, -Math.PI / 2, Math.PI * 1.2 * sd); g.stroke(); g.strokeStyle = 'rgba(255,250,230,0.4)'; g.lineWidth = 2; g.stroke(); }
}
function hornsFront(g, R, sp, cx, top, hw, eyeY, nX, nY) {
  if (sp.horns === 'one') { const hg = g.createLinearGradient(cx, top + 10, cx, top - 24); hg.addColorStop(0, '#5a4a3a'); hg.addColorStop(1, '#fffaf0'); g.fillStyle = hg; g.beginPath(); g.moveTo(cx - 5, top + 12); g.quadraticCurveTo(cx - 2, top - 8, cx + 3, top - 26); g.quadraticCurveTo(cx + 3, top - 6, cx + 5, top + 12); g.closePath(); g.fill(); }
  if (sp.horns === 'rhino') { const hg = g.createLinearGradient(nX, nY - 6, nX - 6, nY - 32); hg.addColorStop(0, '#4a4a4a'); hg.addColorStop(1, '#e8e4d8'); g.fillStyle = hg; g.beginPath(); g.moveTo(nX - 7, nY - 4); g.quadraticCurveTo(nX - 6, nY - 20, nX - 10, nY - 34); g.quadraticCurveTo(nX + 2, nY - 20, nX + 6, nY - 4); g.closePath(); g.fill(); g.beginPath(); g.moveTo(nX - 3, nY - 16); g.quadraticCurveTo(nX, nY - 26, nX - 1, nY - 30); g.quadraticCurveTo(nX + 4, nY - 24, nX + 4, nY - 16); g.fill(); }
}
// the golden band the Bodhisattva gave the monkey
function circlet(g, cx, top, hw) { const y = top + 16, bg = g.createLinearGradient(0, y - 3, 0, y + 4); bg.addColorStop(0, '#fff4b0'); bg.addColorStop(0.5, '#e0a830'); bg.addColorStop(1, '#6a4008'); g.fillStyle = bg; g.beginPath(); g.moveTo(cx - hw - 1, y + 2); g.quadraticCurveTo(cx, y - 6, cx + hw + 1, y + 2); g.lineTo(cx + hw + 1, y + 6); g.quadraticCurveTo(cx, y - 2, cx - hw - 1, y + 6); g.closePath(); g.fill(); g.strokeStyle = '#4a2a04'; g.lineWidth = 0.5; g.stroke(); for (const sd of [-1, 1]) { g.fillStyle = '#e0a830'; g.beginPath(); g.arc(cx + sd * (hw - 2), y + 3, 2.2, 0, 7); g.fill(); g.strokeStyle = '#e0a830'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx + sd * (hw - 1), y + 4); g.bezierCurveTo(cx + sd * (hw + 8), y + 2, cx + sd * (hw + 6), y - 10, cx + sd * (hw + 12), y - 14); g.stroke(); } }
// one of the extra heads of a many-headed beast: a small sculpt-less head, painted
function miniHead(g, R, sp, x, y, s) { const hg = g.createRadialGradient(x - 6 * s * 3, y - 6 * s * 3, 2, x, y, 30 * s * 1.6); hg.addColorStop(0, sh(sp.fur, 1.3)); hg.addColorStop(1, sh(sp.fur, 0.35)); g.fillStyle = hg; g.beginPath(); g.ellipse(x, y, sp.hw * s * 1.6, sp.hh * s * 1.5, 0, 0, 7); g.fill(); if (sp.mz > 0) { g.beginPath(); g.ellipse(x - 3, y + 8 * s * 2, sp.mw * s * 1.6, 8 * s * 1.6, 0, 0, 7); g.fill(); } for (const sd of [-1, 1]) { g.fillStyle = sp.eye; g.beginPath(); g.ellipse(x + sd * 6 * s * 1.6 - 1, y - 1, 2.6, 1.6, 0, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(x + sd * 6 * s * 1.6 - 1, y - 1, 0.9, 0, 7); g.fill(); } if (sp.nose === 'beak') { g.fillStyle = '#e0a820'; g.beginPath(); g.moveTo(x - 4, y + 2); g.lineTo(x - 2, y + 12); g.lineTo(x + 3, y + 2); g.fill(); } }
