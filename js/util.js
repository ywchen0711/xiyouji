// Small shared helpers: a seeded random generator (so generated data is the same every time), clamping, picking.
export function rng(seed = 1) {
  let s = (seed >>> 0) || 1;
  const f = () => { s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0; s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0; s ^= s >>> 16; return (s >>> 0) / 4294967296; };
  f.int = (a, b) => a + Math.floor(f() * (b - a + 1));
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.chance = (p) => f() < p;
  return f;
}
export const hash = (str) => { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0; return h; };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
