// Pixel art in code: a small grid of colours painted shape by shape — each shape first in a dark outline, then filled,
// lit from the upper left (a pale rim) and shaded to the lower right — then blown up square by square. Used for the
// portraits, the walkers and the squares of the maps, so everything shares one look.
export const OUT = '#1c1216';
const hx = (c) => { const n = parseInt(c.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const th = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mixC = (a, b, t) => { const A = hx(a), B = hx(b); return th(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
// darker with a little more warmth in it (as painters shade), lighter towards a warm white
export const dk = (c, k = 0.25) => { const [r, g, b] = hx(c); return th(r * (1 - k) - 4, g * (1 - k * 1.08) - 2, b * (1 - k * 0.85) + 6); };
export const lt = (c, k = 0.25) => mixC(c, '#fff8e8', k);

export function grid(w, h) {
  const a = new Array(w * h).fill(null);
  const G = {
    w, h, a,
    set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (c && x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = c; },
    get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : null; },
    rect(x, y, rw, rh, c) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) G.set(x + i, y + j, c); },
    line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) G.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); },
    // a shape given by a test on pixel centres. col is a colour or (x, y) => colour. o.out: outline colour (false for
    // none); o.shade: rim and shadow tones; o.only: paint only where something is already painted
    shape(test, col, o = {}) {
      const m = new Uint8Array(w * h); let any = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (test(x + 0.5, y + 0.5, x, y)) { m[y * w + x] = 1; any = 1; }
      if (!any) return m;
      const In = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1;
      const out = o.out === undefined ? OUT : o.out;
      if (out) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (In(x, y)) continue; if (In(x - 1, y) || In(x + 1, y) || In(x, y - 1) || In(x, y + 1) || (o.thick && (In(x - 1, y - 1) || In(x + 1, y + 1) || In(x - 1, y + 1) || In(x + 1, y - 1)))) G.set(x, y, out); }
      const sh = o.shade !== false;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!In(x, y)) continue; if (o.only && !a[y * w + x]) continue;
        let c = typeof col === 'function' ? col(x, y) : col; if (!c) continue;
        if (sh) { if (!In(x + 1, y) || !In(x, y + 1) || (!In(x + 2, y) && !In(x + 1, y + 1))) c = dk(c, o.dk ?? 0.22); else if (!In(x - 1, y) || !In(x, y - 1)) c = lt(c, o.lt ?? 0.2); }
        a[y * w + x] = c;
      }
      return m;
    },
    ell(cx, cy, rx, ry, col, o) { return G.shape((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, col, o); },
    poly(pts, col, o) { return G.shape((x, y) => inPoly(pts, x, y), col, o); },
    // a canvas, each square s by s
    canvas(s = 1) { const c = document.createElement('canvas'); c.width = w * s; c.height = h * s; const g = c.getContext('2d'); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = a[y * w + x]; if (v) { g.fillStyle = v; g.fillRect(x * s, y * s, s, s); } } return c; },
  };
  return G;
}
export function inPoly(p, x, y) { let ins = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; }
