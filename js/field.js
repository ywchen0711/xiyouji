// The road through each place: a winding way carved from one end of the map to the other (with clearings), side
// paths ending in treasure, the people met along it, and at the far end the demon's lair (or the one to be found).
// The same seed always makes the same map, so a saved game comes back to the same place.
import { rng, hash, clamp } from './util.js';
import { tiles, walker, chest, lair, THEMES } from './art.js';
import { CAST } from './data/cast.js';

export const TS = 16;
const DIMS = [null, [46, 26], [62, 32], [78, 38]];

export function makeMap(e) {
  const m = e.map, R = rng(hash(e.id) ^ 0x3c1), [w, h] = DIMS[m.size || 1], grid = new Uint8Array(w * h).fill(1);
  const at = (x, y) => (x < 1 || y < 1 || x >= w - 1 || y >= h - 1 ? 1 : grid[y * w + x]);
  const dig = (cx, cy, r) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (x > 1 && y > 1 && x < w - 2 && y < h - 2 && (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r) grid[y * w + x] = 0; };
  // the main way: east, wandering up and down
  const path = []; let x = 3, y = Math.floor(h / 2) + R.int(-3, 3), vy = 0;
  while (x < w - 4) { path.push([x, y]); dig(x, y, R() < 0.12 ? R.int(2, 3) : 1); if (R() < 0.06) dig(x, y, 4); vy = clamp(vy + (R() - 0.5) * 0.9, -1, 1); if (R() < 0.55) y = clamp(Math.round(y + vy), 4, h - 5); else x++; if (R() < 0.08) { const len = R.int(3, 7), dy = R() < 0.5 ? -1 : 1; for (let k = 0; k < len; k++) { y = clamp(y + dy, 4, h - 5); path.push([x, y]); dig(x, y, 1); } } }
  const end = path[path.length - 1], start = path[0];
  // side ways, with something at their end
  const nB = 2 + (m.size || 1) * 2, ends = [];
  for (let b = 0; b < nB; b++) { let [bx, by] = path[R.int(Math.floor(path.length * 0.1), Math.floor(path.length * 0.85))]; const dy = by < h / 2 ? 1 : -1, len = R.int(6, 12); for (let k = 0; k < len; k++) { if (R() < 0.7) by = clamp(by + dy, 3, h - 4); else bx = clamp(bx + (R() < 0.5 ? -1 : 1), 3, w - 4); dig(bx, by, R() < 0.3 ? 2 : 1); } dig(bx, by, 2); ends.push([bx, by]); }
  // soften the edges: a wall nearly surrounded by open ground gives way
  for (let pass = 0; pass < 2; pass++) { const nx = grid.slice(); for (let yy = 2; yy < h - 2; yy++) for (let xx = 2; xx < w - 2; xx++) { if (!grid[yy * w + xx]) continue; let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!at(xx + dx, yy + dy)) n++; if (n >= 5 || (n >= 4 && R() < 0.3)) nx[yy * w + xx] = 0; } grid.set(nx); }
  const fv = new Uint8Array(w * h), wv = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) { const r = R(); fv[i] = r < 0.6 ? 0 : r < 0.8 ? 1 : r < 0.93 ? 2 : 3; wv[i] = R.int(0, 2); }
  const chests = ends.slice(0, m.chests ?? 3).map(([cx, cy]) => ({ x: cx, y: cy }));
  // people along the way, standing beside it
  const npcs = (m.npcs || []).map((s, i) => { const [who, text] = s.split('|'), p = path[Math.floor(path.length * (0.18 + i * 0.3))] || path[1]; let nx2 = p[0], ny2 = p[1]; for (const dy of [-1, 1, -2, 2]) if (!at(p[0], p[1] + dy) && !(p[0] === start[0] && p[1] + dy === start[1])) { ny2 = p[1] + dy; break; } return { x: nx2, y: ny2, who, text }; });
  return { w, h, grid, fv, wv, start: { x: start[0], y: start[1] }, end: { x: end[0], y: end[1] }, chests, npcs, theme: m.theme, at };
}
export const blocked = (M, x, y, opened) => M.at(x, y) === 1 || M.npcs.some((n) => n.x === x && n.y === y) || M.chests.some((c) => c.x === x && c.y === y);

// ---------------------------------------------------------------- drawing
const LAIR = [];
export function drawMap(g, M, cam, walkers, t, o = {}) {
  const T = tiles(M.theme), x0 = Math.floor(cam.x / TS) - 1, y0 = Math.floor(cam.y / TS) - 2, x1 = x0 + 26, y1 = y0 + 18;
  g.imageSmoothingEnabled = false;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * M.w + x, sx = x * TS - cam.x, sy = y * TS - cam.y; if (x < 0 || y < 0 || x >= M.w || y >= M.h) { g.fillStyle = '#000'; g.fillRect(sx, sy, TS, TS); continue; } g.drawImage(T.floor[M.fv[i]], sx, sy, TS, TS); if (T.flat && M.grid[i] === 1) g.drawImage(T.wall[M.wv[i]], 0, 12 * 3, 48, 48, sx, sy, TS, TS); }
  // things that stand, back to front
  const things = [];
  if (!T.flat) for (let y = y0; y <= y1 + 1; y++) for (let x = x0; x <= x1; x++) { if (M.at(x, y) !== 1 || x < 0 || y < 0 || x >= M.w || y >= M.h) continue; things.push([y, () => g.drawImage(T.wall[M.wv[y * M.w + x]], x * TS - cam.x, (y + 1) * TS - 28 - cam.y, 16, 28)]); }
  for (const c of M.chests) things.push([c.y, () => g.drawImage(chest(!!o.opened?.includes(c.x + ',' + c.y)), c.x * TS - cam.x, c.y * TS - cam.y, 16, 16)]);
  for (const n of M.npcs) { const col = CAST[n.who]?.look?.robe; things.push([n.y, () => g.drawImage(walker(n.who in { 悟空: 1, 八戒: 1, 悟淨: 1, 唐僧: 1 } ? n.who : 'npc', 'down', Math.floor(t / 600) % 2, { col: col && col.startsWith('#') ? col : col === 'kasaya' ? '#c83a2a' : col === 'tiger' ? '#e8c040' : undefined }), n.x * TS - 4 - cam.x, n.y * TS - 8 - cam.y, 24, 24)]); }
  if (o.goal) { const e = M.end, k = (Math.sin(t / 260) + 1) / 2; things.push([e.y, () => { if (o.goal === 'lair') { const f = Math.floor(t / 120) % 8; if (!LAIR[f]) LAIR[f] = lair(f * 120); g.drawImage(LAIR[f], e.x * TS - 4 - cam.x, e.y * TS - 8 - cam.y, 24, 24); } else { const gl = g.createRadialGradient(e.x * TS + 8 - cam.x, e.y * TS + 4 - cam.y, 1, e.x * TS + 8 - cam.x, e.y * TS + 4 - cam.y, 14); gl.addColorStop(0, `rgba(255,240,180,${0.4 + k * 0.3})`); gl.addColorStop(1, 'rgba(255,230,150,0)'); g.fillStyle = gl; g.fillRect(e.x * TS - 8 - cam.x, e.y * TS - 12 - cam.y, 32, 32); const col = CAST[o.goal]?.look?.robe; g.drawImage(walker('npc', 'down', 0, { col: col && col.startsWith('#') ? col : '#c8a040' }), e.x * TS - 4 - cam.x, e.y * TS - 8 - cam.y, 24, 24); } }]); }
  for (const w of walkers) things.push([w.fy + 0.01, () => g.drawImage(walker(w.id, w.dir, w.step, {}), w.fx * TS - 4 - cam.x, w.fy * TS - 8 - cam.y, 24, 24)]);
  things.sort((a, b) => a[0] - b[0]); for (const [, f] of things) f();
  // light: underwater shimmer, heat, the dark of caves
  if (M.theme === 'cave' || M.theme === 'hell') { const me = walkers[0]; if (me) { const px = me.fx * TS + 8 - cam.x, py = me.fy * TS + 4 - cam.y, dg = g.createRadialGradient(px, py, 40, px, py, 200); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, M.theme === 'hell' ? 'rgba(40,0,0,0.6)' : 'rgba(0,0,0,0.65)'); g.fillStyle = dg; g.fillRect(0, 0, 384, 224); } }
  if (M.theme === 'sea') { g.fillStyle = `rgba(30,110,170,${0.26 + Math.sin(t / 900) * 0.04})`; g.fillRect(0, 0, 384, 224); g.strokeStyle = 'rgba(220,250,255,0.35)'; g.lineWidth = 0.6; for (let i = 0; i < 14; i++) { const x = (i * 53 + t / 40) % 384, y = 224 - ((t / 25 + i * 37) % 240); g.beginPath(); g.arc(x, y, 1 + (i % 3) * 0.6, 0, 7); g.stroke(); } }
  if (M.theme === 'fire') { g.fillStyle = `rgba(255,80,20,${0.08 + Math.sin(t / 300) * 0.03})`; g.fillRect(0, 0, 384, 224); }
  if (M.theme === 'heaven' || M.theme === 'lotus') { g.fillStyle = 'rgba(255,240,200,0.12)'; g.fillRect(0, 0, 384, 224); }
}
