// The road through each place. Every country is laid out after its kind:
//   wild  — open country: a road winding east, groves and crags (forest under its canopy, cliffs with their faces),
//           streams with bridges, ponds, the clearings where treasure lies, a shrine or a stele by the way;
//   cave  — chambers grown like rock (cellular), joined by a tunnel, with pools, stalagmites and the dark;
//   halls — a palace or a temple: halls and courtyards behind walls, doors between, pillars, gardens;
//   isles — the heavens: terraces of jade floating on the sea of cloud, joined by bridges.
// Each episode can change the plants, the weather, the hour, the water and the buildings (VARIANT below), so no two
// places look alike. The same seed always makes the same map, so a saved game comes back to the same place.
import { rng, hash, clamp } from './util.js';
import { floor, road, massTop, massFace, liquid, LIQ, bridge, stand, deco, prop, PROPS, chest, walker, rest } from './tiles.js';
import { dk } from './px.js';

export const TS = 16;
const DIMS = [null, [46, 26], [62, 32], [78, 38]];
export const FLOOR = 0, SOLID = 1, WATER = 2, ROAD = 3, BRIDGE = 4, PROP = 5, MASS = 6;
const walkable = (v) => v === FLOOR || v === ROAD || v === BRIDGE;

// ---------------------------------------------------------------- the kinds of country
const KIND = {
  forest: { layout: 'wild', ground: 'grass', g1: '#6aa84a', g2: '#64a046', road: '#c8a46a', roadK: 'dirt', mass: 'canopy', m1: '#3a7a34', trunk: '#5a3a22', leaf: '#4a9a3a', pine: '#2e6a3a', stands: ['tree', 'tree', 'pine', 'bush', 'rock'], dens: 0.5, standK: 0.16, deco: ['flower', 'grass', 'grass', 'mush', 'stone'], liquid: 'water', feat: ['stream', 'pond'], props: ['shrine', 'stele'], lair: 'cave' },
  mount: { layout: 'wild', ground: 'grass', g1: '#8aa456', g2: '#84a050', road: '#b8a070', roadK: 'dirt', mass: 'cliff', m1: '#8a8274', m2: '#7a7264', f1: '#9a907e', moss: '#6a8a3a', trunk: '#5a3a22', leaf: '#4a8a3a', pine: '#2e5a3a', rock: '#8a8a84', stands: ['pine', 'rock', 'rock', 'bush', 'pine'], dens: 0.5, standK: 0.12, deco: ['grass', 'stone', 'flower', 'dry'], liquid: 'water', feat: ['pond'], props: ['stele', 'shrine'], lair: 'cave' },
  river: { layout: 'wild', ground: 'grass', g1: '#78a850', g2: '#72a24a', road: '#c8b07a', roadK: 'dirt', mass: 'canopy', m1: '#3e7a3a', trunk: '#5a3a22', leaf: '#5aa04a', pine: '#2e6a3a', stands: ['willow', 'reed', 'rock', 'tree', 'reed'], dens: 0.36, standK: 0.14, deco: ['grass', 'flower', 'stone'], liquid: 'water', feat: ['river', 'stream'], props: ['hut', 'stele'], lair: 'cave' },
  desert: { layout: 'wild', ground: 'sand', g1: '#e0c07a', g2: '#dab872', road: '#ecd498', roadK: 'dirt', mass: 'cliff', m1: '#c8905a', m2: '#b8804a', f1: '#d0985a', strata: '#a8703a', trunk: '#6a5446', leaf: '#8a8a3a', rock: '#c89a5a', stands: ['sandrock', 'deadtree', 'bonepile', 'sandrock'], dens: 0.34, standK: 0.1, deco: ['dry', 'pebble', 'bone'], liquid: 'water', feat: ['oasis'], props: ['stele', 'tent'], lair: 'cave' },
  thorn: { layout: 'wild', ground: 'grass', g1: '#8a9a50', g2: '#84944a', road: '#b89a62', roadK: 'dirt', mass: 'bramble', m1: '#3e5a26', trunk: '#4a3a1a', leaf: '#4a6a2a', pine: '#2e4a2a', stands: ['thorn', 'thorn', 'deadtree', 'thorn'], dens: 0.6, standK: 0.18, deco: ['dry', 'grass', 'stone'], liquid: 'water', feat: [], props: ['shrine'], lair: 'cave' },
  swamp: { layout: 'wild', ground: 'mud', g1: '#6e6e40', g2: '#68683a', road: '#8a7a4a', roadK: 'dirt', mass: 'canopy', m1: '#4a6a2a', trunk: '#4a3a22', leaf: '#5a7a2a', pine: '#3a5a2a', fruit: '#f08a20', stands: ['persimmon', 'persimmon', 'reed', 'deadtree'], dens: 0.42, standK: 0.16, deco: ['fruit', 'grass', 'fruit'], liquid: 'mud', feat: ['pond', 'pond'], props: ['shrine'], lair: 'cave' },
  ice: { layout: 'wild', ground: 'snow', g1: '#e8f0f8', g2: '#e0eaf4', road: '#b8d0e8', roadK: 'dirt', mass: 'cliff', m1: '#c8d4e0', m2: '#b8c4d4', f1: '#8a9cb4', snowcap: true, trunk: '#5a4a3a', leaf: '#4a7a5a', pine: '#2e5a4a', rock: '#8a98a8', stands: ['snowpine', 'snowrock', 'iceblock', 'snowpine'], dens: 0.44, standK: 0.12, deco: ['snow', 'stone'], liquid: 'water', feat: ['frozen'], props: ['hut'], lair: 'cave' },
  lotus: { layout: 'wild', ground: 'gold', g1: '#ecd8a0', g2: '#e6d298', road: '#f8f0dc', roadK: 'jade', mass: 'canopy', m1: '#6a9a3a', trunk: '#6a4a2a', leaf: '#8aa83a', pine: '#4a7a3a', stands: ['bodhi', 'stupa', 'lantern', 'bodhi'], dens: 0.3, standK: 0.12, deco: ['lotus', 'flower', 'petal'], liquid: 'lotus', feat: ['pond', 'pond', 'pond'], props: ['pagoda', 'arch'], lair: 'temple' },
  sea: { layout: 'wild', ground: 'seabed', g1: '#c8b888', g2: '#c0b080', road: '#d8cca0', roadK: 'dirt', mass: 'cliff', m1: '#5a7a8a', m2: '#4a6a7a', f1: '#6a8a9a', moss: '#d86a8a', trunk: '#3a5a4a', leaf: '#3a8a5a', rock: '#7a8a94', stands: ['coral', 'kelp', 'coral', 'rock', 'kelp'], dens: 0.4, standK: 0.18, deco: ['shell', 'star', 'stone'], liquid: 'sea', feat: [], props: [], lair: 'palace' },
  cave: { layout: 'cave', ground: 'cave', g1: '#5a4a3e', g2: '#56463a', road: '#6a5a4a', roadK: 'dirt', mass: 'rock', m1: '#2a2220', m2: '#241c1a', f1: '#6a5444', rock: '#7a6a5a', trunk: '#3a2a1a', leaf: '#3a4a2a', stands: ['stalag', 'rock', 'stalag', 'bonepile'], dens: 0, standK: 0.04, deco: ['pebble', 'bone', 'mush', 'pebble'], liquid: 'water', feat: ['pool'], props: [], lair: 'cave' },
  hell: { layout: 'cave', ground: 'hell', g1: '#5a3a36', g2: '#563632', road: '#6a4a44', roadK: 'slab', mass: 'rock', m1: '#2a1414', m2: '#241010', f1: '#7a3a2e', glow: '#e8602a', rock: '#5a3a34', stands: ['bonepile', 'brazier', 'stalag'], dens: 0, standK: 0.04, deco: ['bone', 'skull', 'ember'], liquid: 'lava', feat: ['pool'], props: [], lair: 'hellgate' },
  fire: { layout: 'wild', ground: 'ash', g1: '#8a3e20', g2: '#84381c', road: '#a85a32', roadK: 'dirt', mass: 'cliff', m1: '#3a2220', m2: '#2e1a18', f1: '#5a2a1e', cracks: '#e8602a', glow: '#f88030', trunk: '#3a2a26', leaf: '#5a3a2a', rock: '#4a3430', stands: ['flame', 'charred', 'rock', 'flame', 'deadtree'], dens: 0.4, standK: 0.14, deco: ['ember', 'pebble'], liquid: 'lava', feat: ['lava'], props: ['stele'], lair: 'cave' },
  heaven: { layout: 'isles', ground: 'jade', g1: '#f4f2fa', g2: '#eeecf6', road: '#f8e8b0', roadK: 'jade', mass: 'none', m1: '#ffffff', trunk: '#8a5a3a', leaf: '#5aa04a', stands: ['pillar', 'tree', 'pillar', 'lantern'], dens: 0, standK: 0.06, deco: ['petal', 'flower'], liquid: 'cloud', feat: [], props: ['pavilion', 'gate'], lair: 'palace' },
  palace: { layout: 'halls', ground: 'stone', g1: '#b8a888', g2: '#b0a080', road: '#b03028', roadK: 'carpet', mass: 'redwall', m1: '#c03a2a', f1: '#b8382a', roof: '#3a5a5a', plinth: '#9a9284', trunk: '#5a3a22', leaf: '#4a8a3a', pine: '#2e5a3a', stands: ['redpillar', 'urn', 'plant'], garden: ['tree', 'bush', 'rock'], dens: 0, standK: 0, deco: [], liquid: 'water', feat: [], props: [], lair: 'palace' },
};
// per episode: the plants, weather, hour, water, buildings and layout of the place
const VARIANT = {
  e01: { leaf: '#5aa84a', stands: ['peach', 'blossom', 'tree', 'bush', 'rock'], feat: ['stream', 'pond'], props: ['stele'], mood: 'spring' },
  e02: { mood: 'mist', stands: ['pine', 'pine', 'rock', 'bamboo'], props: ['stele', 'shrine'], lair: 'gate' },
  e03: { feat: ['pool', 'pool'] },
  e04: { props: [] },
  e06: { stands: ['peach', 'tree', 'blossom', 'bush'], mood: 'dusk' },
  e07: { stands: ['peach', 'peach', 'peach', 'pillar'], deco: ['petal', 'flower', 'petal'], props: ['pavilion'] },
  e08: { stands: ['peach', 'tree', 'pine', 'rock'], mood: 'dusk', feat: ['stream'] },
  e09: { stands: ['pillar', 'pillar', 'lantern'], props: ['gate', 'pavilion', 'pagoda'] },
  e11: { mood: 'dusk', stands: ['pine', 'pine', 'rock', 'bush'], dens: 0.56 },
  e12: { mood: 'autumn', leaf: '#d88a2a', m1: '#8a7a64', props: ['stele', 'shrine'] },
  e13: { feat: ['gorge'], stands: ['rock', 'pine', 'reed'], mass: 'cliff', m1: '#8a8274', m2: '#7a7264', f1: '#9a907e', moss: '#6a8a3a' },
  e14: { stands: ['pine', 'pine', 'rock', 'bamboo'], props: ['temple', 'stele'], mood: 'dark' },
  e15: { mood: 'autumn', leaf: '#c8902a', props: ['hut', 'well', 'hut'], stands: ['tree', 'bush', 'rock', 'pine'], feat: ['pond'] },
  e16: { stands: ['pine', 'tree', 'rock', 'bamboo'], props: ['shrine'] },
  e17: { mood: 'sand' },
  e18: { ground: 'sand', g1: '#d8c088', g2: '#d2ba82', liquid: 'sea', stands: ['reed', 'deadtree', 'sandrock'], mood: 'sand' },
  e20: { stands: ['pine', 'tree', 'bamboo', 'rock'], props: ['temple', 'gate'], feat: ['stream'] },
  e21: { g1: '#a0a080', g2: '#9a9a7a', mood: 'mist', stands: ['deadtree', 'rock', 'bonepile', 'pine'], deco: ['bone', 'dry', 'stone'], moss: '#8a8a6a' },
  e22: { mood: 'dark', stands: ['pine', 'pine', 'pine', 'rock'], dens: 0.58, leaf: '#2e5a34', m1: '#24502a' },
  e23: { stands: ['stalag', 'rock', 'crystal'] },
  e24: { garden: ['tree', 'bush', 'rock'] },
  e25: { stands: ['charred', 'deadtree', 'flame', 'rock'] },
  e26: { liquid: 'dark', mood: 'dusk', stands: ['reed', 'deadtree', 'rock', 'willow'] },
  e27: { mood: 'sand', roof: '#5a4a3a' },
  e28: { mood: 'snow' },
  e29: { mood: 'snow', ground: 'snow', g1: '#e8f0f8', g2: '#e0eaf4', snowcap: true, stands: ['snowpine', 'snowrock', 'pine'] },
  e30: { props: ['well', 'shrine', 'hut'], mood: 'spring', stands: ['tree', 'blossom', 'bush', 'rock'] },
  e31: { m1: '#2a1a2a', f1: '#5a3a5a', crystal: '#c08ae0', stands: ['crystal', 'stalag', 'bonepile'] },
  e32: { stands: ['peach', 'tree', 'blossom', 'rock'], feat: ['stream', 'pond'] },
  e33: { mood: 'heat' },
  e34: { liquid: 'dark', g1: '#a8b08a', g2: '#a0a884', mood: 'deep' },
  e35: { props: ['shrine'], stands: ['thorn', 'thorn', 'pine', 'deadtree'], mood: 'mist' },
  e36: { mass: 'yellowwall', m1: '#e0b050', f1: '#d8a848', roof: '#4a4a4a', stands: ['lantern', 'urn', 'plant'], g1: '#c8bca0', g2: '#c0b498', road: '#d8a840' },
  e37: { mood: 'stench' },
  e38: { mood: 'smoke', stands: ['rock', 'deadtree', 'pine', 'charred'] },
  e39: { m1: '#2a1a24', f1: '#7a5a6a', stands: ['web', 'stalag', 'web', 'bonepile'], deco: ['web', 'bone', 'pebble'], standK: 0.07 },
  e40: { g1: '#9a9a74', g2: '#94946e', mood: 'dusk', stands: ['bonepile', 'rock', 'deadtree', 'pine'], deco: ['bone', 'skull', 'dry'], dens: 0.54 },
  e41: { stands: ['willow', 'willow', 'tree', 'bush'], feat: ['stream', 'pond'], props: ['hut', 'shrine'] },
  e42: { m1: '#140e10', f1: '#4a3a3a', mood: 'deep', feat: ['pool'] },
  e44: { mood: 'fog', stands: ['pine', 'rock', 'pine', 'bush'], dens: 0.56 },
  e46: { stands: ['bamboo', 'bamboo', 'rock', 'bamboo'], leaf: '#6aa83a' },
  e47: { m1: '#1a2030', f1: '#5a6a84', crystal: '#a8e0ff', stands: ['crystal', 'iceblock', 'stalag'], mood: 'cold' },
  e48: { mood: 'night', stands: ['tree', 'blossom', 'rock', 'bush'], deco: ['flower', 'flower', 'grass'] },
  e49: { mood: 'night', stands: ['pine', 'tree', 'rock'], props: ['temple', 'stele'] },
  e51: { mood: 'storm', feat: ['river'], stands: ['reed', 'willow', 'rock'] },
};
export const variantOf = (id) => VARIANT[id] || {};
export function kindOf(e) { const k = KIND[e.map.theme] || KIND.mount, v = VARIANT[e.id] || {}; const P = { ...k, ...v }; P.key = e.id + (e.map.theme || ''); P.theme = e.map.theme; return P; }

// smooth value noise
function noise(seed) {
  const h = (x, y) => { let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, s = (t) => t * t * (3 - 2 * t), a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1), U = s(u), V = s(v); return a + (b - a) * U + (c - a) * V + (a - b - c + d) * U * V; };
}

export function makeMap(e) {
  const m = e.map, P = kindOf(e), R = rng(hash(e.id) ^ 0x3c1), [w, h] = DIMS[m.size || 1];
  const grid = new Uint8Array(w * h), ob = new Uint8Array(w * h), dc = new Uint8Array(w * h), var4 = new Uint8Array(w * h), props = [];
  const I = (x, y) => y * w + x, inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const get = (x, y) => (inb(x, y) ? grid[I(x, y)] : MASS), put = (x, y, v) => { if (inb(x, y)) grid[I(x, y)] = v; };
  const N1 = noise(hash(e.id) & 0xffff), N2 = noise((hash(e.id) >>> 8) & 0xffff), fbm = (x, y) => N1(x / 6, y / 6) * 0.65 + N1(x / 2.7 + 50, y / 2.7) * 0.35;
  for (let i = 0; i < w * h; i++) var4[i] = R.int(0, 3);
  // the main way: east, wandering up and down
  const path = []; { let x = 2, y = Math.floor(h / 2) + R.int(-3, 3), vy = 0; while (x < w - 5) { path.push([x, y]); vy = clamp(vy + (R() - 0.5) * 0.8, -1, 1); if (R() < 0.5) { const ny = clamp(Math.round(y + vy), 4, h - 5); if (ny !== y) { y = ny; path.push([x, y]); } } x++; } }
  const start = path[0], end = path[path.length - 1];
  const near = new Uint8Array(w * h), trail = new Uint8Array(w * h);
  const nearOf = () => { near.fill(0); for (const [x, y] of path) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inb(x + dx, y + dy)) near[I(x + dx, y + dy)] = Math.max(near[I(x + dx, y + dy)], 3 - Math.max(Math.abs(dx), Math.abs(dy))); };
  nearOf();
  const branches = [], nB = 2 + (m.size || 1) * 2;

  if (P.layout === 'wild') {
    // groves and crags from the noise, thicker towards the edges, never on the road
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y), v = fbm(x, y) + (edge < 3 ? (3 - edge) * 0.22 : 0);
      if (near[I(x, y)] >= 2) continue;
      if (edge === 0 || v > 0.85 - P.dens * 0.55) put(x, y, MASS);
      else if (R() < P.standK * (0.4 + v)) { put(x, y, SOLID); ob[I(x, y)] = R.int(0, P.stands.length - 1); }
    }
    // no lone squares of forest or cliff: they become a single tree or rock
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (get(x, y) === MASS) { let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (get(x + dx, y + dy) === MASS) n++; if (n <= 1) { put(x, y, SOLID); ob[I(x, y)] = R.int(0, P.stands.length - 1); } }
    for (const f of P.feat || []) water(f);
  } else if (P.layout === 'cave') {
    // rock grown by the rule of the caves, then the tunnel carved through it
    const g2 = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) g2[i] = R() < 0.46 ? 1 : 0;
    for (let it = 0; it < 5; it++) { const nx = g2.slice(); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!inb(x + dx, y + dy) || g2[I(x + dx, y + dy)]) n++; nx[I(x, y)] = n >= 5 ? 1 : 0; } g2.set(nx); }
    for (let i = 0; i < w * h; i++) grid[i] = g2[i] ? MASS : FLOOR;
    for (const [x, y] of path) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.abs(dx) + Math.abs(dy) < 2 || R() < 0.3) put(x + dx, y + dy, FLOOR);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) put(x, y, MASS);
    keepConnected();
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (get(x, y) === FLOOR && near[I(x, y)] < 2 && R() < P.standK) { put(x, y, SOLID); ob[I(x, y)] = R.int(0, P.stands.length - 1); }
    for (const f of P.feat || []) water(f);
  } else if (P.layout === 'isles') {
    // terraces on the sea of cloud along the way, and bridges between
    for (let i = 0; i < w * h; i++) grid[i] = WATER;
    let k = 0; for (const [x, y] of path) { if (k++ % 13 === 6) blob(x + R.int(-1, 1), y + R.int(-2, 2), R.int(2, 4)); }
    blob(start[0] + 1, start[1], 3); blob(end[0], end[1], 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (get(x, y) === FLOOR && near[I(x, y)] < 2 && R() < 0.12) { put(x, y, SOLID); ob[I(x, y)] = R.int(0, P.stands.length - 1); }
  } else if (P.layout === 'halls') { halls(); nearOf(); }

  // the road itself (a bridge where it crosses water)
  for (const [x, y] of path) { const v = get(x, y); put(x, y, v === WATER ? BRIDGE : ROAD); if (P.layout !== 'halls') for (const [dx, dy] of [[0, -1], [0, 1]]) if (get(x + dx, y + dy) === SOLID || get(x + dx, y + dy) === MASS) put(x + dx, y + dy, FLOOR); }
  // side ways, each ending in a clearing with something in it
  if (P.layout !== 'halls') for (let b = 0; b < nB; b++) {
    let [bx, by] = path[R.int(Math.floor(path.length * 0.1), Math.floor(path.length * 0.88))]; const dy = by < h / 2 ? 1 : -1, len = R.int(5, 10);
    for (let k = 0; k < len; k++) { let nx = bx, ny = by; if (R() < 0.7) ny = clamp(by + dy, 2, h - 3); else nx = clamp(bx + (R() < 0.5 ? -1 : 1), 2, w - 3); if (get(nx, ny) === WATER && P.layout !== 'isles' && k > 2) break; bx = nx; by = ny; clear(bx, by, FLOOR); }
    for (let yy = by - 1; yy <= by + 1; yy++) for (let xx = bx - 1; xx <= bx + 1; xx++) if (xx > 0 && yy > 0 && xx < w - 1 && yy < h - 1 && get(xx, yy) !== WATER) clear(xx, yy, FLOOR);
    branches.push([bx, by]);
  }
  // buildings by the way (and the mouth of the lair beyond the end)
  if (P.lair && PROPS[P.lair] && P.layout !== 'halls') { const [, ph] = PROPS[P.lair]; placeProp(P.lair, end[0] + 1, end[1] - ph + 1, true); }
  for (const kind of (P.props || []).slice(0, 1 + (m.size || 1))) for (let t = 0; t < 60; t++) { const [px, py] = path[R.int(Math.floor(path.length * 0.12), Math.floor(path.length * 0.82))], [pw, ph] = PROPS[kind] || [1, 1], x0 = px - Math.floor(pw / 2), y0 = R() < 0.5 ? py - 1 - ph : py + 2; if (placeProp(kind, x0, y0)) break; }
  // small things underfoot
  if (P.deco?.length) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (get(x, y) === FLOOR && R() < 0.1) dc[I(x, y)] = 1 + R.int(0, P.deco.length - 1);
  if (P.layout === 'wild' || P.layout === 'isles') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && walkable(get(x, y))) put(x, y, P.layout === 'isles' ? WATER : MASS);
  const chests = branches.slice(0, m.chests ?? 3).map(([x, y]) => ({ x, y }));
  // places to rest: a spring (a censer in the halls, a golden lotus in heaven) beside the way — half way along, and
  // again a little before the lair; on the long roads one more early on
  const rests = [], restAt = (m.size || 1) >= 3 ? [0.3, 0.6, 0.9] : (m.size || 1) >= 2 ? [0.45, 0.9] : [0.55];
  for (const k of restAt) for (let t = 0; t < 12; t++) {
    const [px, py] = path[clamp(Math.floor(path.length * k) + t * (t % 2 ? 1 : -1), 1, path.length - 3)];
    const spot = [[px, py - 1], [px, py + 1]].find(([x, y]) => x > 0 && y > 0 && x < w - 1 && y < h - 1 && [FLOOR, SOLID, MASS].includes(get(x, y)) && !trail[I(x, y)] && !chests.some((c) => c.x === x && c.y === y) && !rests.some((r) => Math.abs(r.x - x) + Math.abs(r.y - y) < 3));
    if (spot) { put(spot[0], spot[1], FLOOR); dc[I(spot[0], spot[1])] = 0; rests.push({ x: spot[0], y: spot[1] }); break; }
  }
  // people along the way, standing beside it
  const npcs = (m.npcs || []).map((s, i) => { const [who, text] = s.split('|'), p = path[Math.floor(path.length * (0.18 + i * 0.3))] || path[1]; let nx = p[0], ny = p[1]; for (const d of [-1, 1]) if (get(p[0], p[1] + d) === FLOOR && !rests.some((r) => r.x === p[0] && r.y === p[1] + d)) { ny = p[1] + d; break; } if (ny === p[1]) { ny = p[1] - 1; put(nx, ny, FLOOR); } return { x: nx, y: ny, who, text }; });
  // where the captain of the road stands: on the way itself, a little before a place to rest
  const midK = (m.size || 1) >= 3 ? 0.45 : (m.size || 1) >= 2 ? 0.36 : 0.42; let midAt = null;
  for (let t = 0; t < 12 && !midAt; t++) { const [x, y] = path[clamp(Math.floor(path.length * midK) + t * (t % 2 ? 1 : -1), 3, path.length - 4)]; if (walkable(get(x, y)) && !npcs.some((n) => n.x === x && n.y === y)) midAt = { x, y }; }
  const at = (x, y) => (walkable(get(x, y)) ? 0 : 1);
  return { w, h, grid, ob, dc, var4, props, P, start: { x: start[0], y: start[1] }, end: { x: end[0], y: end[1] }, chests, npcs, rests, midAt, mid: null, theme: m.theme, at, get };

  function clear(x, y, to) { if (inb(x, y)) trail[I(x, y)] = 1; const v = get(x, y); if (v === ROAD || v === BRIDGE || v === PROP) return; put(x, y, v === WATER ? BRIDGE : to); }
  function blob(cx, cy, r) { for (let y = cy - r - 1; y <= cy + r + 1; y++) for (let x = cx - r - 2; x <= cx + r + 2; x++) if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && ((x - cx) / (r + 1.5)) ** 2 + ((y - cy) / r) ** 2 <= 1 + (N2(x / 2, y / 2) - 0.5) * 0.6) put(x, y, FLOOR); }
  function water(f) {
    if (f === 'stream' || f === 'gorge') { // a stream from north to south, crossing the road
      let x = Math.floor(w * (0.3 + R() * 0.4)); const wd = f === 'gorge' ? 3 : R.int(1, 2);
      for (let y = 0; y < h; y++) { x = clamp(x + Math.round((N2(y / 4, 9) - 0.5) * 2.2), 4, w - 5); for (let k = 0; k < wd; k++) put(x + k, y, WATER); if (f === 'gorge') for (const k of [-2, -1, wd, wd + 1]) if (near[I(clamp(x + k, 0, w - 1), y)] < 2 && get(x + k, y) !== WATER) put(x + k, y, MASS); }
    }
    if (f === 'river') { // a broad river along one side of the road
      const top = R() < 0.5; for (let x = 0; x < w; x++) { let y0 = null; for (const [px, py] of path) if (px === x) y0 = py; if (y0 == null) continue; const off = Math.round(3 + N2(x / 5, 3) * 3), wd = 3 + Math.round(N2(x / 7, 7) * 3); for (let k = 0; k < wd; k++) { const y = top ? y0 - off - k : y0 + off + k; if (y > 0 && y < h - 1) put(x, y, WATER); } }
      water('stream');
    }
    if (f === 'pond' || f === 'oasis' || f === 'pool' || f === 'lava') { // ponds away from the road
      for (let n = 0; n < (f === 'lava' ? 4 : 2) + (m.size || 1); n++) for (let t = 0; t < 30; t++) {
        const x = R.int(4, w - 5), y = R.int(3, h - 4), r = R.int(1, 3); if (near[I(x, y)]) continue; let ok = true;
        for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r - 1; xx <= x + r + 1; xx++) if (near[I(clamp(xx, 0, w - 1), clamp(yy, 0, h - 1))] >= 2) ok = false; if (!ok) continue;
        for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r - 1; xx <= x + r + 1; xx++) if (((xx - x) / (r + 1.2)) ** 2 + ((yy - y) / (r + 0.4)) ** 2 <= 1 && (P.layout !== 'cave' || get(xx, yy) === FLOOR)) put(xx, yy, WATER);
        break;
      }
    }
    if (f === 'frozen') { // a frozen river across the whole way: walk on the ice, mind the holes
      const y0 = Math.floor(h / 2); for (let x = 4; x < w - 4; x++) for (let y = 2; y < h - 2; y++) if (Math.abs(y - y0 - (N2(x / 6, 1) - 0.5) * 6) < h * 0.2) { if (get(x, y) === MASS || get(x, y) === SOLID) put(x, y, FLOOR); ob[I(x, y)] = 200; }
      for (let n = 0; n < 10; n++) { const x = R.int(6, w - 7), y = R.int(3, h - 4); if (near[I(x, y)]) continue; put(x, y, WATER); if (R() < 0.5) put(x + 1, y, WATER); }
    }
  }
  function placeProp(kind, x0, y0, force) {
    const [pw, ph] = PROPS[kind] || [1, 1];
    for (let y = y0; y < y0 + ph; y++) for (let x = x0; x < x0 + pw; x++) { if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return false; const v = get(x, y); if (!force && (v === ROAD || v === BRIDGE || v === PROP || v === WATER || near[I(x, y)] >= 2 || trail[I(x, y)])) return false; if (x === end[0] && y === end[1]) return false; }
    for (let y = y0; y < y0 + ph; y++) for (let x = x0; x < x0 + pw; x++) put(x, y, PROP);
    for (let x = x0 - 1; x <= x0 + pw; x++) { const v = get(x, y0 + ph); if (v === MASS || v === SOLID) put(x, y0 + ph, FLOOR); }
    props.push({ kind, x: x0, y: y0, w: pw, h: ph }); return true;
  }
  function keepConnected() {
    const seen = new Uint8Array(w * h), q = [I(start[0], start[1])]; seen[q[0]] = 1;
    while (q.length) { const i = q.pop(), x = i % w, y = (i / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const j = I(nx, ny); if (!seen[j] && grid[j] !== MASS) { seen[j] = 1; q.push(j); } } }
    for (let i = 0; i < w * h; i++) if (!seen[i] && grid[i] !== MASS) grid[i] = MASS;
  }
  function halls() {
    // a grid of halls and courtyards, the way running through their doors from the west gate to the throne in the east
    for (let i = 0; i < w * h; i++) grid[i] = MASS;
    const cw = 11, ch = 8, cols = Math.floor((w - 2) / cw), rows = Math.floor((h - 2) / ch), rooms = [], mid = Math.floor(rows / 2);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x0 = 1 + c * cw + R.int(0, 1), y0 = 1 + r * ch + R.int(0, 1), rw = cw - 2 - R.int(0, 1), rh = ch - 2 - R.int(0, 1); rooms.push({ r, c, x0, y0, rw, rh, garden: r !== mid && R() < 0.45 }); for (let y = y0; y < y0 + rh; y++) for (let x = x0; x < x0 + rw; x++) put(x, y, FLOOR); }
    const room = (r, c) => rooms.find((q) => q.r === r && q.c === c);
    const link = (a, b) => { let x = a.x0 + Math.floor(a.rw / 2), y = a.y0 + Math.floor(a.rh / 2); const bx = b.x0 + Math.floor(b.rw / 2), by = b.y0 + Math.floor(b.rh / 2); while (x !== bx) { put(x, y, FLOOR); put(x, y + 1, FLOOR); x += Math.sign(bx - x); } while (y !== by) { put(x, y, FLOOR); put(x + 1, y, FLOOR); y += Math.sign(by - y); } };
    for (const a of rooms) { const e2 = room(a.r, a.c + 1), s = room(a.r + 1, a.c), n = room(a.r - 1, a.c); if (e2 && (a.r === mid || R() < 0.5)) link(a, e2); if (s && (a.r + 1 === mid || R() < 0.4)) link(a, s); if (n && a.r - 1 === mid) link(n, a); }
    // the way: through the middle row of halls, on a carpet
    const mr = room(mid, 0), my = mr.y0 + Math.floor(mr.rh / 2); path.length = 0; for (let x = 2; x < w - 3; x++) { path.push([x, my]); put(x, my, FLOOR); }
    // furnish: pillars along the carpet in the halls, trees and a pool in the gardens
    for (const q of rooms) {
      if (q.garden) { for (let y = q.y0; y < q.y0 + q.rh; y++) for (let x = q.x0; x < q.x0 + q.rw; x++) { ob[I(x, y)] = 100; if (R() < 0.12 && get(x, y) === FLOOR) { put(x, y, SOLID); ob[I(x, y)] = 100 + R.int(0, P.garden.length - 1); } } if (q.rw > 5) { const px = q.x0 + Math.floor(q.rw / 2), py = q.y0 + Math.floor(q.rh / 2); for (let y = py - 1; y <= py; y++) for (let x = px - 1; x <= px + 1; x++) if (get(x, y) === FLOOR) put(x, y, WATER); } }
      else for (let x = q.x0 + 1; x < q.x0 + q.rw - 1; x += 3) for (const y of [q.y0 + 1, q.y0 + q.rh - 2]) if (get(x, y) === FLOOR && Math.abs(y - my) > 1) { put(x, y, SOLID); ob[I(x, y)] = R() < 0.7 ? 0 : R.int(1, P.stands.length - 1); }
    }
    start[0] = 2; start[1] = my; end[0] = w - 4; end[1] = my;
    keepConnected();
    for (let i = 0; i < nB; i++) for (let t = 0; t < 40; t++) { const q = rooms[R.int(0, rooms.length - 1)], x = q.x0 + R.int(0, q.rw - 1), y = q.y0 + R.int(0, q.rh - 1); if (get(x, y) === FLOOR && Math.abs(y - my) > 1 && !branches.some(([a, b]) => a === x && b === y)) { branches.push([x, y]); break; } }
  }
}
export const blocked = (M, x, y) => M.at(x, y) === 1 || (M.mid && M.mid.x === x && M.mid.y === y) || M.npcs.some((n) => n.x === x && n.y === y) || M.chests.some((c) => c.x === x && c.y === y) || M.rests.some((r) => r.x === x && r.y === y);
export const restKind = (M) => (M.P.layout === 'halls' ? 'censer' : M.P.layout === 'isles' ? 'lotus' : M.P.liquid === 'lava' ? 'censer' : 'spring');

// ---------------------------------------------------------------- drawing
export function drawMap(g, M, cam0, walkers, t, o = {}) {
  const cam = { x: Math.round(cam0.x), y: Math.round(cam0.y) }; // whole pixels, so the ground and the walkers never slip against each other
  const P = M.P, x0 = Math.floor(cam.x / TS) - 1, y0 = Math.floor(cam.y / TS) - 1, x1 = x0 + 26, y1 = y0 + 17, f = Math.floor(t / 450) % 3, lq = P.liquid;
  g.imageSmoothingEnabled = false;
  const isMass = (x, y) => M.get(x, y) === MASS, isWater = (x, y) => M.get(x, y) === WATER || M.get(x, y) === BRIDGE, isRoad = (x, y) => M.get(x, y) === ROAD || M.get(x, y) === BRIDGE;
  const garden = { ...P, key: P.key + 'gd', ground: 'grass', g1: '#6aa84a', g2: '#64a046' };
  const things = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const sx = x * TS - cam.x, sy = y * TS - cam.y;
    if (x < 0 || y < 0 || x >= M.w || y >= M.h) { g.fillStyle = '#000'; g.fillRect(sx, sy, TS, TS); continue; }
    const i = y * M.w + x, v = M.grid[i], vv = M.var4[i];
    if (v === MASS) {
      if (P.mass === 'none') { g.drawImage(liquid(lq, f, vv), sx, sy); continue; }
      const face = !isMass(x, y + 1); g.drawImage(face ? massFace(P, vv) : massTop(P, vv), sx, sy);
      // the outline where the mass meets open ground
      g.fillStyle = '#1c1216'; if (!isMass(x - 1, y)) g.fillRect(sx, sy, 1, TS); if (!isMass(x + 1, y)) g.fillRect(sx + TS - 1, sy, 1, TS); if (!isMass(x, y - 1)) g.fillRect(sx, sy, TS, 1);
      if (!face) { g.fillStyle = 'rgba(255,255,255,0.16)'; if (!isMass(x - 1, y)) g.fillRect(sx + 1, sy, 1, TS); if (!isMass(x, y - 1)) g.fillRect(sx, sy + 1, TS, 1); }
      continue;
    }
    if (v === WATER || v === BRIDGE) {
      g.drawImage(liquid(lq, f, vv), sx, sy);
      const L = LIQ[lq] || LIQ.water; g.fillStyle = L.foam; if (!isWater(x, y - 1)) g.fillRect(sx, sy, TS, 2); if (!isWater(x - 1, y)) g.fillRect(sx, sy, 1, TS); if (!isWater(x + 1, y)) g.fillRect(sx + TS - 1, sy, 1, TS); if (!isWater(x, y + 1)) g.fillRect(sx, sy + TS - 1, TS, 1);
      if (v === BRIDGE) g.drawImage(bridge(lq, !isRoad(x, y - 1) && !isRoad(x, y + 1) ? true : isRoad(x - 1, y) || isRoad(x + 1, y)), sx, sy);
      continue;
    }
    if (v === ROAD) g.drawImage(road(P, vv), sx, sy);
    else if (M.ob[i] === 200) g.drawImage(liquid('ice', 0, vv), sx, sy);
    else g.drawImage(floor(M.ob[i] >= 100 && M.ob[i] < 200 ? garden : P, vv), sx, sy);
    if (v === ROAD && P.roadK !== 'carpet') { g.fillStyle = dk(P.road, 0.22); if (!isRoad(x, y - 1)) g.fillRect(sx, sy, TS, 1); if (!isRoad(x, y + 1)) g.fillRect(sx, sy + TS - 1, TS, 1); }
    if (v === ROAD && P.roadK === 'carpet') { g.fillStyle = '#e0b040'; if (!isRoad(x, y - 1)) g.fillRect(sx, sy + 1, TS, 1); if (!isRoad(x, y + 1)) g.fillRect(sx, sy + TS - 2, TS, 1); }
    if (M.dc[i] && v === FLOOR) g.drawImage(deco(P.deco[M.dc[i] - 1], vv), sx, sy);
    if (isMass(x, y - 1) && P.mass !== 'none') { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(sx, sy, TS, 3); }
    if (v === SOLID) { const k = M.ob[i] >= 100 ? P.garden?.[M.ob[i] - 100] || 'tree' : P.stands[M.ob[i]] || P.stands[0], img = stand(k, P, vv % 2); things.push([y + 0.5, () => g.drawImage(img, sx, sy + TS - img.height)]); }
  }
  for (const p of M.props) { if (p.x + p.w < x0 || p.x > x1 || p.y + p.h < y0 - 2 || p.y > y1 + 3) continue; const img = prop(p.kind, P); things.push([p.y + p.h - 0.5, () => g.drawImage(img, p.x * TS - cam.x, (p.y + p.h) * TS - img.height - cam.y)]); }
  for (const c of M.chests) things.push([c.y, () => g.drawImage(chest(!!o.opened?.includes(c.x + ',' + c.y)), c.x * TS - cam.x, c.y * TS - cam.y)]);
  const rk = restKind(M);
  for (const r of M.rests) things.push([r.y, () => {
    const sx = r.x * TS - cam.x, sy = r.y * TS - cam.y, k = (Math.sin(t / 400 + r.x) + 1) / 2, gl = g.createRadialGradient(sx + 8, sy + 8, 1, sx + 8, sy + 8, 18);
    gl.addColorStop(0, `rgba(170,240,255,${0.28 + k * 0.22})`); gl.addColorStop(1, 'rgba(170,240,255,0)'); g.fillStyle = gl; g.fillRect(sx - 10, sy - 10, 36, 36);
    const img = rest(rk, Math.floor(t / 300) % 3); g.drawImage(img, sx, sy + TS - img.height);
    g.fillStyle = 'rgba(255,255,230,0.9)'; for (let i = 0; i < 3; i++) { const ph = ((t / 900 + i / 3) % 1); g.fillRect(Math.round(sx + 3 + ((i * 5 + r.y) % 10)), Math.round(sy + 6 - ph * 16), 1, 1); }
  }]);
  const fig = (img, fx, fy) => g.drawImage(img, Math.round(fx * TS + (TS - img.width) / 2 - cam.x), Math.round(fy * TS + TS - img.height + 2 - cam.y));
  for (const n of M.npcs) things.push([n.y, () => fig(walker(n.who, 'down', Math.floor(t / 600) % 2), n.x, n.y)]);
  if (M.mid) { const d = M.mid; things.push([d.y, () => { // the captain of the road: a dark red glow underfoot, a mark of danger over the head
    const sx = d.x * TS + 8 - cam.x, sy = d.y * TS + 12 - cam.y, k = (Math.sin(t / 220) + 1) / 2, gl = g.createRadialGradient(sx, sy, 1, sx, sy, 15);
    gl.addColorStop(0, `rgba(200,30,40,${0.35 + k * 0.3})`); gl.addColorStop(1, 'rgba(120,0,20,0)'); g.fillStyle = gl; g.fillRect(sx - 16, sy - 16, 32, 32);
    const img = walker(d.id, 'left', Math.floor(t / 400) % 2); fig(img, d.x, d.y);
    const my = Math.round(d.y * TS + TS - img.height - 5 - cam.y - k * 2); g.fillStyle = '#2a0a0a'; g.fillRect(sx - 2, my - 1, 4, 7); g.fillStyle = '#ff4a3a'; g.fillRect(sx - 1, my, 2, 3); g.fillRect(sx - 1, my + 4, 2, 1);
  }]); }
  if (o.goal) { const e = M.end, k = (Math.sin(t / 260) + 1) / 2; things.push([e.y, () => { const gx = e.x * TS + 8 - cam.x, gy = e.y * TS + 6 - cam.y, gl = g.createRadialGradient(gx, gy, 1, gx, gy, 16); gl.addColorStop(0, o.goal === 'lair' ? `rgba(220,40,60,${0.35 + k * 0.3})` : `rgba(255,240,180,${0.4 + k * 0.3})`); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(gx - 16, gy - 16, 32, 32); if (o.goal === 'lair') lairMark(g, gx, gy, t); else fig(walker(o.goal, 'left', 0), e.x, e.y); }]); }
  for (const w of walkers) things.push([w.fy + 0.01, () => fig(walker(w.id, w.dir, w.step), w.fx, w.fy)]);
  things.sort((a, b) => a[0] - b[0]); for (const [, fn] of things) fn();
  weather(g, M, P, walkers[0], cam, t);
}
// the lair: a black cloud with red eyes
function lairMark(g, x, y, t) { g.fillStyle = '#1a0a14'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x - 5 + i * 2, y + Math.sin(i + t / 200) * 1.5, 4, 0, 7); g.fill(); } g.fillStyle = '#ff3a3a'; g.fillRect(x - 3, y - 1, 2, 1.4); g.fillRect(x + 1, y - 1, 2, 1.4); }

// the light and the weather over the map
function weather(g, M, P, me, cam, t) {
  const mood = P.mood, W = 384, H = 224, px = me ? me.fx * TS + 8 - cam.x : W / 2, py = me ? me.fy * TS + 4 - cam.y : H / 2;
  const dark = (inner, outer, col) => { const dg = g.createRadialGradient(px, py, inner, px, py, outer); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, col); g.fillStyle = dg; g.fillRect(0, 0, W, H); };
  const leaves = (col) => { g.fillStyle = col; for (let i = 0; i < 16; i++) { const x = (i * 113 + t / 30 + Math.sin(t / 600 + i) * 30) % W, y = (i * 71 + t / 40) % H; g.fillRect(Math.round(x), Math.round(y), 2, 1); } };
  if (P.layout === 'cave') dark(46, 210, M.theme === 'hell' ? 'rgba(40,0,0,0.5)' : mood === 'deep' ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.66)');
  if (M.theme === 'sea') { g.fillStyle = `rgba(30,110,170,${0.24 + Math.sin(t / 900) * 0.04})`; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(220,250,255,0.5)'; for (let i = 0; i < 14; i++) { const x = (i * 53 + t / 40) % W, y = H - ((t / 25 + i * 37) % 240); g.fillRect(Math.round(x), Math.round(y), 2, 2); } if (mood === 'deep') { g.fillStyle = 'rgba(10,40,40,0.35)'; g.fillRect(0, 0, W, H); } }
  if (M.theme === 'fire' || mood === 'heat') { g.fillStyle = `rgba(255,80,20,${0.1 + Math.sin(t / 300) * 0.04})`; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,200,80,0.8)'; for (let i = 0; i < 18; i++) { const x = (i * 71 + Math.sin(t / 500 + i) * 20 + W) % W, y = H - ((t / 18 + i * 41) % 240); g.fillRect(Math.round(x), Math.round(y), 1, 1); } }
  if (M.theme === 'heaven' || M.theme === 'lotus') { g.fillStyle = 'rgba(255,240,200,0.1)'; g.fillRect(0, 0, W, H); }
  if (mood === 'dusk') { g.fillStyle = 'rgba(255,120,40,0.16)'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(60,20,60,0.14)'; g.fillRect(0, 0, W, H); }
  if (mood === 'autumn') { g.fillStyle = 'rgba(255,170,60,0.08)'; g.fillRect(0, 0, W, H); leaves('#e0802a'); }
  if (mood === 'spring') leaves('#f8b8c8');
  if (mood === 'night') { g.fillStyle = 'rgba(20,30,80,0.32)'; g.fillRect(0, 0, W, H); dark(60, 220, 'rgba(0,0,20,0.5)'); }
  if (mood === 'dark') dark(70, 230, 'rgba(0,10,0,0.55)');
  if (mood === 'mist' || mood === 'fog' || mood === 'stench' || mood === 'smoke') { const col = mood === 'stench' ? '200,190,120' : mood === 'smoke' ? '120,110,110' : '235,240,245', n = mood === 'fog' ? 7 : 4; for (let i = 0; i < n; i++) { const y = ((i * 61 + t / 90) % (H + 60)) - 30, x = ((i * 137 + t / 30) % (W + 200)) - 100, fg = g.createRadialGradient(x, y, 4, x, y, 120); fg.addColorStop(0, `rgba(${col},${mood === 'fog' ? 0.42 : 0.3})`); fg.addColorStop(1, `rgba(${col},0)`); g.fillStyle = fg; g.fillRect(x - 120, y - 120, 240, 240); } if (mood === 'fog') { g.fillStyle = 'rgba(235,240,245,0.22)'; g.fillRect(0, 0, W, H); } }
  if (mood === 'snow' || mood === 'cold') { g.fillStyle = 'rgba(200,220,255,0.1)'; g.fillRect(0, 0, W, H); if (mood === 'snow') { g.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) { const x = (i * 97 + Math.sin(t / 700 + i) * 12 + t / 60 + W) % W, y = (i * 53 + t / 22) % H; g.fillRect(Math.round(x), Math.round(y), i % 3 ? 1 : 2, i % 3 ? 1 : 2); } } }
  if (mood === 'sand') { g.fillStyle = 'rgba(220,170,90,0.2)'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(240,210,150,0.7)'; for (let i = 0; i < 50; i++) { const x = (i * 89 + t / 6) % W, y = (i * 47 + Math.sin(t / 300 + i) * 8 + H) % H; g.fillRect(Math.round(x), Math.round(y), 3, 1); } }
  if (mood === 'storm') { g.fillStyle = 'rgba(30,40,70,0.3)'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(200,220,255,0.5)'; for (let i = 0; i < 70; i++) { const x = (i * 59 + t / 4) % W, y = (i * 83 + t / 2) % H; g.fillRect(Math.round(x), Math.round(y), 1, 4); } if (Math.floor(t / 100) % 60 === 0) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, 0, W, H); } }
}
