// A painted backdrop for each kind of country, behind the battles and the towns. (The squares of the maps and the
// walking figures are pixel art, in tiles.js.)
import { rng, hash } from './util.js';
import { variantOf } from './field.js';
const K = 1;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w * K; c.height = h * K; const g = c.getContext('2d'); g.scale(K, K); return [c, g]; };
const hexA = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const shade = (c, k) => { const n = parseInt(c.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };

// ---------------------------------------------------------------- the kinds of country
export const THEMES = {
  forest: { sky: ['#6aa8e0', '#d8ecf0'], far: '#4a7a5a', near: '#3a6a3a', ground: ['#5a8a3a', '#2a4a1a'], floor: ['#6a9a44', '#5e8e3c', '#72a24a'], wall: 'tree', leaf: '#2e6a2a', music: 'road' },
  mount: { sky: ['#7aa0d0', '#e0e8e8'], far: '#7a8aa0', near: '#5a6a5a', ground: ['#8a9a5a', '#4a5a2a'], floor: ['#9a9a68', '#8e8e5e', '#a2a070'], wall: 'rock', leaf: '#3a5a3a', music: 'road' },
  cave: { sky: ['#140e10', '#3a2a24'], far: '#2a2220', near: '#1a1412', ground: ['#4a3a30', '#1a120e'], floor: ['#5a4a3e', '#4e4034', '#564638'], wall: 'cave', music: 'cave' },
  sea: { sky: ['#08304a', '#2a80a8'], far: '#1a5a7a', near: '#0e3a50', ground: ['#c8b080', '#6a6040'], floor: ['#c8b888', '#bcac7c', '#d0c090'], wall: 'coral', music: 'cave' },
  hell: { sky: ['#140404', '#5a1a10'], far: '#3a1010', near: '#200808', ground: ['#3a2424', '#140a0a'], floor: ['#3e2c2c', '#342424', '#443030'], wall: 'bone', music: 'cave' },
  heaven: { sky: ['#e8c890', '#fff8e8'], far: '#f0e0c0', near: '#ffffff', ground: ['#f0f0f8', '#b8b8d0'], floor: ['#f0f0f8', '#e6e6f2', '#f6f4fa'], wall: 'pillar', music: 'heaven' },
  palace: { sky: ['#201410', '#4a2e1e'], far: '#5a3a24', near: '#3a2414', ground: ['#a89070', '#5a4830'], floor: ['#a89070', '#9c8466', '#b09878'], wall: 'redpillar', music: 'town' },
  desert: { sky: ['#e0a860', '#f8e8c0'], far: '#c89a60', near: '#a87a40', ground: ['#d8b878', '#8a6a3a'], floor: ['#d8b878', '#ccac6c', '#e0c080'], wall: 'sandrock', music: 'road' },
  fire: { sky: ['#3a0604', '#d0501a'], far: '#8a2a10', near: '#4a1008', ground: ['#8a3a1a', '#3a1206'], floor: ['#8a3a1a', '#7e341a', '#94421e'], wall: 'flame', music: 'cave' },
  ice: { sky: ['#9ac0e8', '#f4faff'], far: '#c8dcf0', near: '#e8f4ff', ground: ['#d8ecf8', '#8aa8c8'], floor: ['#d8ecf8', '#cce2f2', '#e0f0fa'], wall: 'ice', music: 'road' },
  river: { sky: ['#7ab8e8', '#e8f0f0'], far: '#6a9a8a', near: '#4a7a5a', ground: ['#6a9a54', '#2a5a5a'], floor: ['#7aa456', '#6e9a4e', '#82ac5e'], wall: 'water', music: 'road' },
  thorn: { sky: ['#8aa0b0', '#d8dcd0'], far: '#5a6a4a', near: '#3a4a2a', ground: ['#8a7a4a', '#4a3a1a'], floor: ['#9a8a56', '#8e7e4e', '#a2925e'], wall: 'thorn', music: 'road' },
  swamp: { sky: ['#8a9a7a', '#c8c8a8'], far: '#6a6a4a', near: '#4a4a2a', ground: ['#6a5a3a', '#3a2a1a'], floor: ['#6e5e3c', '#625234', '#766644'], wall: 'persimmon', music: 'road' },
  lotus: { sky: ['#f0c060', '#fff4d0'], far: '#e8c890', near: '#d8b070', ground: ['#e8d090', '#a88a40'], floor: ['#ecd498', '#e2ca8c', '#f2dca4'], wall: 'lotus', music: 'heaven' },
  town: { sky: ['#8ab8e0', '#e8ecec'], far: '#8a7a6a', near: '#6a5a4a', ground: ['#a89a80', '#6a5a40'], floor: ['#b0a288', '#a4967c', '#b8aa90'], wall: 'house', music: 'town' },
};

// ---------------------------------------------------------------- battle and town backdrops
const BD = new Map();
export function backdrop(theme, ep) {
  const V = variantOf(ep), mood = V.mood || '', bkey = theme + '|' + mood + '|' + (V.leaf || '') + (V.ground || '');
  if (BD.has(bkey)) return BD.get(bkey);
  const T0 = THEMES[theme] || THEMES.mount, T = { ...T0, ...(V.leaf ? { leaf: V.leaf } : {}), ...(V.ground === 'snow' ? { ground: ['#e8f0f8', '#a8b8c8'] } : {}) }, [c, g] = mk(384, 224), R = rng(hash(theme));
  const sky = g.createLinearGradient(0, 0, 0, 130); sky.addColorStop(0, T.sky[0]); sky.addColorStop(1, T.sky[1]); g.fillStyle = sky; g.fillRect(0, 0, 384, 224);
  const indoor = ['cave', 'palace', 'hell'].includes(theme), under = theme === 'sea';
  // the far country: ranges of mountains (or cave walls, or palace halls), clouds, sun
  if (!indoor) {
    if (theme !== 'heaven' && !under) { g.fillStyle = hexA('#ffffff', 0.5); for (let i = 0; i < 6; i++) { const x = R() * 384, y = 14 + R() * 40; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + k * 9, y + Math.sin(k) * 2, 12, 4, 0, 0, 7); g.fill(); } } }
    for (let layer = 0; layer < 3; layer++) { const col = layer === 0 ? T.far : layer === 1 ? shade(T.far, 0.8) : T.near, base = 104 + layer * 12; g.fillStyle = col; g.beginPath(); g.moveTo(0, 140); let x = 0; while (x <= 384) { const peak = base - 10 - R() * (34 - layer * 8); g.lineTo(x, base); g.lineTo(x + 18 + R() * 20, peak); x += 40 + R() * 30; } g.lineTo(384, base); g.lineTo(384, 140); g.closePath(); g.fill(); if (theme === 'ice' || theme === 'mount') { g.fillStyle = hexA('#ffffff', 0.6 - layer * 0.15); } }
  } else {
    // walls of rock or carved halls closing in
    g.fillStyle = T.far; g.fillRect(0, 0, 384, 140); for (let i = 0; i < 40; i++) { g.fillStyle = hexA(R() < 0.5 ? '#000000' : '#ffffff', 0.05 + R() * 0.06); g.beginPath(); g.ellipse(R() * 384, R() * 130, 10 + R() * 30, 6 + R() * 18, R(), 0, 7); g.fill(); }
    if (theme === 'palace') for (let i = 0; i < 6; i++) { const x = 16 + i * 70; const pg = g.createLinearGradient(x, 0, x + 18, 0); pg.addColorStop(0, '#c83a2a'); pg.addColorStop(1, '#5a1208'); g.fillStyle = pg; g.fillRect(x, 0, 18, 140); g.fillStyle = '#d8a840'; g.fillRect(x - 2, 0, 22, 6); g.fillRect(x - 2, 128, 22, 6); }
    if (theme === 'cave') for (let i = 0; i < 14; i++) { const x = R() * 384, l = 10 + R() * 30; g.fillStyle = shade(T.far, 0.7); g.beginPath(); g.moveTo(x - 6, 0); g.lineTo(x, l); g.lineTo(x + 6, 0); g.fill(); }
    if (theme === 'hell') { const hg = g.createLinearGradient(0, 60, 0, 140); hg.addColorStop(0, 'rgba(255,60,20,0)'); hg.addColorStop(1, 'rgba(255,80,20,0.4)'); g.fillStyle = hg; g.fillRect(0, 60, 384, 80); }
  }
  if (theme === 'heaven' || theme === 'lotus') { for (let i = 0; i < 18; i++) { const x = R() * 384, y = 40 + R() * 90; g.fillStyle = hexA('#ffffff', 0.7); for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + k * 10, y, 14, 6, 0, 0, 7); g.fill(); } } const sg = g.createRadialGradient(300, 40, 4, 300, 40, 80); sg.addColorStop(0, 'rgba(255,250,220,0.9)'); sg.addColorStop(1, 'rgba(255,230,160,0)'); g.fillStyle = sg; g.fillRect(200, 0, 184, 130); if (theme === 'heaven') for (let i = 0; i < 3; i++) { const x = 50 + i * 130, s = i === 1 ? 1.25 : 0.9, by = 104; // pavilions of the heavenly palace, half lost in cloud
    g.globalAlpha = 0.55; for (let f = 0; f < 3; f++) { const w = (34 - f * 8) * s, y = by - f * 14 * s; g.fillStyle = '#b83a2a'; g.fillRect(x - w / 2 + 4 * s, y - 10 * s, w - 8 * s, 10 * s); g.fillStyle = '#d8a840'; g.beginPath(); g.moveTo(x - w / 2 - 6 * s, y - 9 * s); g.quadraticCurveTo(x - w / 4, y - 12 * s, x, y - 16 * s); g.quadraticCurveTo(x + w / 4, y - 12 * s, x + w / 2 + 6 * s, y - 9 * s); g.lineTo(x + w / 2 - 2 * s, y - 11 * s); g.lineTo(x - w / 2 + 2 * s, y - 11 * s); g.fill(); } g.fillStyle = '#d8a840'; g.fillRect(x - 1, by - 58 * s, 2, 12 * s); g.globalAlpha = 1; } }
  if (under) { for (let i = 0; i < 8; i++) { const x = R() * 384; const rg = g.createLinearGradient(x, 0, x + 30, 130); rg.addColorStop(0, 'rgba(200,240,255,0.18)'); rg.addColorStop(1, 'rgba(200,240,255,0)'); g.fillStyle = rg; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 0); g.lineTo(x + 60, 140); g.lineTo(x + 20, 140); g.fill(); } for (let i = 0; i < 30; i++) { g.strokeStyle = 'rgba(220,250,255,0.4)'; g.lineWidth = 0.6; g.beginPath(); g.arc(R() * 384, R() * 130, 1 + R() * 2, 0, 7); g.stroke(); } }
  if (theme === 'fire') { for (let i = 0; i < 30; i++) { const x = R() * 384, h = 20 + R() * 50; const fg = g.createLinearGradient(0, 140 - h, 0, 140); fg.addColorStop(0, 'rgba(255,200,80,0)'); fg.addColorStop(1, 'rgba(255,90,20,0.6)'); g.fillStyle = fg; g.beginPath(); g.moveTo(x - 8, 140); g.quadraticCurveTo(x - 4, 140 - h * 0.6, x, 140 - h); g.quadraticCurveTo(x + 4, 140 - h * 0.6, x + 8, 140); g.fill(); } }
  if (theme === 'town') { // a walled town: the gate tower in the middle, rows of tiled roofs, lanterns
    g.fillStyle = '#8a7a68'; g.fillRect(0, 104, 384, 26); g.fillStyle = '#6a5a4a'; for (let x = 0; x < 384; x += 8) g.fillRect(x, 101, 5, 4);
    g.fillStyle = '#5a3a2a'; g.fillRect(170, 110, 44, 20); g.fillStyle = '#2a1a12'; g.beginPath(); g.moveTo(180, 130); g.lineTo(180, 118); g.quadraticCurveTo(192, 110, 204, 118); g.lineTo(204, 130); g.fill();
    for (const [x, y, w] of [[192, 98, 60], [192, 84, 44]]) { g.fillStyle = '#b83a2a'; g.fillRect(x - w / 2 + 6, y - 10, w - 12, 12); g.fillStyle = '#3a3a48'; g.beginPath(); g.moveTo(x - w / 2 - 8, y - 9); g.quadraticCurveTo(x - w / 4, y - 13, x, y - 18); g.quadraticCurveTo(x + w / 4, y - 13, x + w / 2 + 8, y - 9); g.lineTo(x + w / 2, y - 11); g.lineTo(x - w / 2, y - 11); g.fill(); }
    for (let i = 0; i < 9; i++) { const x = i * 46 + (i > 3 ? 40 : -10), y = 128 - (i % 2) * 6, w = 36 + (i % 3) * 6; if (x > 150 && x < 230) continue; g.fillStyle = '#e8dcc8'; g.fillRect(x, y - 16, w, 16); g.fillStyle = '#4a3a2a'; g.fillRect(x + w / 2 - 3, y - 9, 6, 9); g.fillStyle = ['#3a3a48', '#5a2a1a', '#2a3a4a'][i % 3]; g.beginPath(); g.moveTo(x - 6, y - 15); g.quadraticCurveTo(x + w / 2, y - 22, x + w + 6, y - 15); g.lineTo(x + w + 2, y - 18); g.quadraticCurveTo(x + w / 2, y - 30, x - 2, y - 18); g.fill(); g.fillStyle = '#e83a2a'; g.beginPath(); g.ellipse(x + 6, y - 12, 2, 2.6, 0, 0, 7); g.fill(); }
  }
  // the ground, in perspective, with its grain
  const gg = g.createLinearGradient(0, 128, 0, 224); gg.addColorStop(0, T.ground[0]); gg.addColorStop(1, T.ground[1]); g.fillStyle = gg; g.fillRect(0, 128, 384, 96);
  for (let i = 0; i < 260; i++) { const y = 130 + Math.pow(R(), 1.6) * 94, s = 0.5 + (y - 128) / 40; g.fillStyle = hexA(R() < 0.5 ? '#000000' : '#ffffff', 0.06 + R() * 0.06); g.fillRect(R() * 384, y, s * (2 + R() * 4), s * 0.8); }
  if (theme === 'river' || theme === 'ice') { g.fillStyle = theme === 'ice' ? 'rgba(220,240,255,0.7)' : 'rgba(80,150,200,0.6)'; g.beginPath(); g.moveTo(0, 150); g.quadraticCurveTo(192, 140, 384, 152); g.lineTo(384, 168); g.quadraticCurveTo(192, 158, 0, 166); g.fill(); }
  if (theme === 'forest' || theme === 'mount' || theme === 'thorn' || theme === 'swamp') for (let i = 0; i < 10; i++) { const x = R() < 0.5 ? R() * 60 : 324 + R() * 60, y = 120 + R() * 30; tree(g, x, y, 1.4 + R(), T.leaf || '#3a6a3a', R); }
  const vg = g.createRadialGradient(192, 112, 120, 192, 112, 260); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = vg; g.fillRect(0, 0, 384, 224);
  // the hour and the weather
  const tint = { dusk: 'rgba(255,110,40,0.22)', night: 'rgba(20,30,90,0.42)', dark: 'rgba(0,20,0,0.3)', mist: 'rgba(235,240,245,0.3)', fog: 'rgba(235,240,245,0.45)', snow: 'rgba(220,235,255,0.25)', cold: 'rgba(160,200,255,0.2)', sand: 'rgba(220,170,90,0.3)', storm: 'rgba(30,40,70,0.38)', heat: 'rgba(255,80,20,0.18)', autumn: 'rgba(255,170,60,0.12)', smoke: 'rgba(90,80,80,0.3)', stench: 'rgba(180,170,90,0.25)', deep: 'rgba(0,20,30,0.35)' }[mood];
  if (tint) { g.fillStyle = tint; g.fillRect(0, 0, 384, 224); }
  if (mood === 'snow') { g.fillStyle = '#ffffff'; for (let i = 0; i < 120; i++) g.fillRect(Math.floor(R() * 384), Math.floor(R() * 224), 1, 1); }
  if (mood === 'night') { g.fillStyle = '#fff8d8'; g.beginPath(); g.arc(310, 34, 12, 0, 7); g.fill(); for (let i = 0; i < 40; i++) g.fillRect(Math.floor(R() * 384), Math.floor(R() * 90), 1, 1); }
  pixelate(c); BD.set(bkey, c); return c;
}
// a painter's picture into pixels: colours in fewer steps, the steps blended by an ordered dither
function pixelate(c) {
  const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], q = 20;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4, t = (B[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * q; for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, Math.round((d[i + k] + t) / q) * q)); }
  g.putImageData(im, 0, 0);
}
function tree(g, x, y, s, leaf, R) { g.fillStyle = '#4a3020'; g.fillRect(x - 1.2 * s, y - 6 * s, 2.4 * s, 8 * s); for (let k = 0; k < 4; k++) { g.fillStyle = shade(leaf, 0.8 + k * 0.12); g.beginPath(); g.arc(x + (R() - 0.5) * 6 * s, y - 9 * s - k * 2 * s, (6 - k) * s, 0, 7); g.fill(); } }

export { shade, hexA };
