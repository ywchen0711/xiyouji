// Pictures drawn in code: a painted backdrop for each kind of country (for the battles and the towns), the squares of
// the maps — ground, and what stands on it: trees, rocks, coral, bones, cloud pillars, flames, ice, thorns — and the
// small walking figures of the pilgrims (the master on his white horse), the people met on the road, chests and the
// lairs of the great demons.
import { rng, hash } from './util.js';
const K = 3;
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
export function backdrop(theme) {
  if (BD.has(theme)) return BD.get(theme);
  const T = THEMES[theme] || THEMES.mount, [c, g] = mk(384, 224), R = rng(hash(theme));
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
  BD.set(theme, c); return c;
}
function tree(g, x, y, s, leaf, R) { g.fillStyle = '#4a3020'; g.fillRect(x - 1.2 * s, y - 6 * s, 2.4 * s, 8 * s); for (let k = 0; k < 4; k++) { g.fillStyle = shade(leaf, 0.8 + k * 0.12); g.beginPath(); g.arc(x + (R() - 0.5) * 6 * s, y - 9 * s - k * 2 * s, (6 - k) * s, 0, 7); g.fill(); } }

// ---------------------------------------------------------------- the squares of the maps (16 by 16)
const TL = new Map();
export function tiles(theme) {
  if (TL.has(theme)) return TL.get(theme);
  const T = THEMES[theme] || THEMES.mount, R = rng(hash(theme) ^ 99), floor = [], wall = [], deco = [];
  for (let v = 0; v < 4; v++) { const [c, g] = mk(16, 16); g.fillStyle = T.floor[v % T.floor.length]; g.fillRect(0, 0, 16, 16); for (let i = 0; i < 26; i++) { g.fillStyle = hexA(R() < 0.5 ? '#000000' : '#ffffff', 0.05 + R() * 0.07); g.fillRect(Math.floor(R() * 16), Math.floor(R() * 16), 1 + Math.floor(R() * 2), 1); } floorDeco(g, theme, R, v); floor.push(c); }
  for (let v = 0; v < 3; v++) { const [c, g] = mk(16, 28); wallArt(g, theme, T, R, v); wall.push(c); }
  const t = { floor, wall, flat: ['water', 'lotus'].includes(T.wall) }; TL.set(theme, t); return t;
}
function floorDeco(g, theme, R, v) {
  if (v === 0) return;
  if (['forest', 'river', 'mount'].includes(theme)) { for (let i = 0; i < 5; i++) { g.strokeStyle = 'rgba(40,90,30,0.6)'; g.lineWidth = 0.6; const x = R() * 15, y = 4 + R() * 11; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y - 3); g.moveTo(x, y); g.lineTo(x + 1, y - 3); g.stroke(); } if (v === 3) { g.fillStyle = ['#f0e060', '#f0a0c0', '#ffffff'][Math.floor(R() * 3)]; g.fillRect(5, 6, 2, 2); g.fillRect(10, 11, 1.5, 1.5); } }
  if (['cave', 'hell', 'desert', 'fire', 'thorn', 'swamp'].includes(theme)) { g.fillStyle = 'rgba(0,0,0,0.2)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(R() * 16, R() * 16, 1.5, 1, 0, 0, 7); g.fill(); } if (theme === 'hell' && v === 3) { g.fillStyle = '#e8e0d0'; g.fillRect(4, 9, 6, 1.2); g.beginPath(); g.arc(4, 9.6, 1.1, 0, 7); g.arc(10, 9.6, 1.1, 0, 7); g.fill(); } }
  if (theme === 'sea') { g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, 6 + v); g.quadraticCurveTo(8, 3 + v, 16, 7 + v); g.stroke(); if (v === 3) { g.fillStyle = '#f0c8b0'; g.beginPath(); g.arc(8, 10, 1.6, Math.PI, 0); g.fill(); } }
  if (['palace', 'heaven', 'lotus', 'town'].includes(theme)) { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 0.5; g.strokeRect(0.25, 0.25, 15.5, 15.5); if (theme === 'lotus' && v === 3) { g.fillStyle = 'rgba(255,240,200,0.6)'; g.beginPath(); g.arc(8, 8, 3, 0, 7); g.fill(); } }
  if (theme === 'ice') { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(R() * 16, R() * 16); g.lineTo(R() * 16, R() * 16); g.stroke(); }
}
// what stands on a blocked square, drawn 16 wide and up to 28 tall (its base on the bottom 16)
function wallArt(g, theme, T, R, v) {
  const w = T.wall, base = 28;
  const shadow = () => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(8, base - 3, 7.5, 3, 0, 0, 7); g.fill(); };
  if (w === 'tree' || w === 'persimmon') { shadow(); g.fillStyle = '#4a3020'; g.fillRect(6.5, 15, 3, 11); const leaf = w === 'persimmon' ? '#4a6a2a' : T.leaf; for (let k = 0; k < 5; k++) { g.fillStyle = shade(leaf, 0.7 + k * 0.12); g.beginPath(); g.arc(8 + (R() - 0.5) * 5, 12 - k * 1.6, 7 - k, 0, 7); g.fill(); } if (w === 'persimmon') { g.fillStyle = '#e87a20'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(3 + R() * 10, 6 + R() * 9, 1.1, 0, 7); g.fill(); } } if (v === 2) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(5, 6, 3, 0, 7); g.fill(); } return; }
  if (w === 'rock' || w === 'sandrock' || w === 'cave') { shadow(); const col = w === 'sandrock' ? '#a88a5a' : w === 'cave' ? '#3a2e28' : '#7a7a74'; const rg = g.createLinearGradient(2, 8, 14, 26); rg.addColorStop(0, shade(col, 1.35)); rg.addColorStop(1, shade(col, 0.55)); g.fillStyle = rg; g.beginPath(); g.moveTo(0.5, 27); g.lineTo(1, 14 - v * 2); g.lineTo(5, 7 - v * 2); g.lineTo(10, 6); g.lineTo(15, 12); g.lineTo(15.5, 27); g.closePath(); g.fill(); g.strokeStyle = shade(col, 0.4); g.lineWidth = 0.5; g.beginPath(); g.moveTo(5, 9); g.lineTo(8, 18); g.lineTo(6, 26); g.stroke(); if (w === 'rock' && v === 1) { g.fillStyle = '#2e5a2e'; g.beginPath(); g.moveTo(11, 8); g.lineTo(14, 2); g.lineTo(16, 8); g.fill(); } return; }
  if (w === 'coral') { shadow(); g.fillStyle = 'rgba(40,90,110,0.9)'; g.beginPath(); g.ellipse(8, 22, 7.5, 6, 0, 0, 7); g.fill(); const cc = ['#e86a5a', '#e8a040', '#c85aa0'][v]; g.strokeStyle = cc; g.lineWidth = 1.6; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const x = 3 + i * 2.5; g.beginPath(); g.moveTo(x, 22); g.quadraticCurveTo(x + (R() - 0.5) * 6, 14, x + (R() - 0.5) * 4, 6 + R() * 6); g.stroke(); } return; }
  if (w === 'bone') { shadow(); g.fillStyle = '#3a2a2a'; g.beginPath(); g.ellipse(8, 22, 7.5, 6, 0, 0, 7); g.fill(); g.fillStyle = '#d8d0c0'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(4 + R() * 8, 14 + R() * 8, 2.2, 2.4, 0, 0, 7); g.fill(); g.fillStyle = '#1a1010'; g.fillRect(3 + R() * 9, 15 + R() * 6, 1, 1); g.fillStyle = '#d8d0c0'; } g.fillStyle = '#ff7a30'; g.beginPath(); g.moveTo(7, 12); g.quadraticCurveTo(9, 6, 8, 2); g.quadraticCurveTo(11, 7, 10, 12); g.fill(); return; }
  if (w === 'pillar' || w === 'redpillar') { shadow(); const col = w === 'pillar' ? '#f0f0f8' : '#b8302a'; const pg = g.createLinearGradient(3, 0, 13, 0); pg.addColorStop(0, shade(col, 1.2)); pg.addColorStop(1, shade(col, 0.5)); g.fillStyle = pg; g.fillRect(3.5, 2, 9, 25); g.fillStyle = '#d8a840'; g.fillRect(2.5, 1, 11, 2.5); g.fillRect(2.5, 24.5, 11, 2.5); if (w === 'pillar') { g.strokeStyle = 'rgba(200,160,60,0.6)'; g.lineWidth = 0.8; g.beginPath(); for (let y = 5; y < 24; y += 4) { g.moveTo(3.5, y); g.quadraticCurveTo(8, y - 2, 12.5, y); } g.stroke(); } return; }
  if (w === 'flame') { shadow(); g.fillStyle = '#4a1a0a'; g.beginPath(); g.ellipse(8, 23, 7.5, 5, 0, 0, 7); g.fill(); for (let i = 0; i < 3; i++) { const x = 4 + i * 4, h = 12 + R() * 8, fg = g.createLinearGradient(0, 24 - h, 0, 24); fg.addColorStop(0, '#fff0a0'); fg.addColorStop(0.5, '#ff8a20'); fg.addColorStop(1, '#c82a0a'); g.fillStyle = fg; g.beginPath(); g.moveTo(x - 3, 24); g.quadraticCurveTo(x - 2, 24 - h * 0.6, x, 24 - h); g.quadraticCurveTo(x + 2, 24 - h * 0.6, x + 3, 24); g.fill(); } return; }
  if (w === 'ice') { shadow(); const ig = g.createLinearGradient(2, 6, 14, 26); ig.addColorStop(0, '#ffffff'); ig.addColorStop(1, '#8ab0d8'); g.fillStyle = ig; g.beginPath(); g.moveTo(1, 27); g.lineTo(2, 12); g.lineTo(6, 5 - v); g.lineTo(11, 8); g.lineTo(15, 14); g.lineTo(15, 27); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(4, 12); g.lineTo(7, 20); g.stroke(); return; }
  if (w === 'thorn') { shadow(); g.fillStyle = '#3a4a1a'; g.beginPath(); g.ellipse(8, 20, 7.5, 7, 0, 0, 7); g.fill(); g.strokeStyle = '#6a4a20'; g.lineWidth = 0.8; for (let i = 0; i < 9; i++) { const x = R() * 16, y = 12 + R() * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 8, y - 3 - R() * 6); g.stroke(); } g.fillStyle = '#c83a3a'; g.fillRect(4 + v * 3, 15, 1.4, 1.4); return; }
  if (w === 'house') { shadow(); g.fillStyle = '#e8e0d0'; g.fillRect(1, 12, 14, 15); g.fillStyle = '#4a3a2a'; g.fillRect(6, 19, 4, 8); g.fillStyle = ['#3a3a4a', '#6a2a1a', '#2a4a5a'][v]; g.beginPath(); g.moveTo(-1, 13); g.lineTo(8, 4); g.lineTo(17, 13); g.fill(); return; }
  if (w === 'water' || w === 'lotus') { const wg = g.createLinearGradient(0, 12, 0, 28); wg.addColorStop(0, w === 'lotus' ? '#7ac0a0' : '#4a90c8'); wg.addColorStop(1, w === 'lotus' ? '#3a8a7a' : '#2a6aa0'); g.fillStyle = wg; g.fillRect(0, 12, 16, 16); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(2, 18 + v); g.quadraticCurveTo(6, 16 + v, 10, 18 + v); g.stroke(); if (w === 'lotus') { g.fillStyle = '#3a8a3a'; g.beginPath(); g.ellipse(5 + v * 3, 22, 3, 1.6, 0, 0, 7); g.fill(); g.fillStyle = '#f0a0c0'; g.beginPath(); g.moveTo(9, 20); g.lineTo(10.5, 16); g.lineTo(12, 20); g.fill(); } return; }
}

// ---------------------------------------------------------------- the walkers (16 wide, 20 tall; facing down, up, left, right; two steps)
const SP = new Map();
const LOOK = {
  悟空: { head: '#c89030', face: '#e8b090', body: '#e8c040', legs: '#c83a20', item: 'staff', ears: 'monkey', hat: '#e0a830' },
  唐僧: { horse: true, head: '#f0d0b0', face: '#f0d0b0', body: '#c83a2a', legs: '#e8b048', hat: 'vinu' },
  八戒: { head: '#3a3238', face: '#6a5a60', body: '#2a3a5a', legs: '#1a2232', item: 'rake', ears: 'pig' },
  悟淨: { head: '#5a7a9a', face: '#7a9ab8', body: '#5a5a6a', legs: '#3a3a4a', item: 'pole', beard: '#c83a1a' },
  npc: { head: '#2a201a', face: '#e0b090', body: '#6a5a3a', legs: '#3a3020' },
};
export function walker(id, dir, step, opt = {}) {
  const key = id + dir + step + (opt.col || ''); if (SP.has(key)) return SP.get(key);
  const L = { ...(LOOK[id] || LOOK.npc), ...(opt.col ? { body: opt.col } : {}) }, [c, g] = mk(24, 24);
  const side = dir === 'left' || dir === 'right', back = dir === 'up', st = step ? 1 : 0;
  g.save(); if (dir === 'right') { g.translate(24, 0); g.scale(-1, 1); }
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(12, 22.5, L.horse ? 9 : 5, 1.8, 0, 0, 7); g.fill();
  if (L.horse) {
    // the white horse, and the master on it
    const hx = 12, hy = 15; g.fillStyle = '#f4f4f0'; if (side) { g.fillRect(hx - 8, hy - 3, 14, 6); g.fillRect(hx - 10, hy - 8, 4, 8); g.fillRect(hx - 12, hy - 9, 4, 3); g.fillStyle = '#d8d8d0'; for (const [x, s] of [[-7, st], [-4, 1 - st], [2, st], [5, 1 - st]]) g.fillRect(hx + x, hy + 3, 1.6, 4 - s); g.fillStyle = '#c8c0b0'; g.fillRect(hx + 6, hy - 2, 2.5, 5); } else { g.fillRect(hx - 4, hy - 4, 8, 8); g.fillStyle = '#d8d8d0'; g.fillRect(hx - 3.5, hy + 3, 1.8, 4 - st); g.fillRect(hx + 1.7, hy + 3, 1.8, 3 + st); if (!back) { g.fillStyle = '#f4f4f0'; g.fillRect(hx - 2, hy - 10, 4, 7); g.fillStyle = '#202020'; g.fillRect(hx - 1.5, hy - 8, 1, 1); g.fillRect(hx + 0.5, hy - 8, 1, 1); } }
    g.fillStyle = '#c8a040'; g.fillRect(hx - 4, hy - 4.5, 8, 1.5);
    const mx = side ? hx - 1 : hx, my = hy - 9; g.fillStyle = L.body; g.fillRect(mx - 3.5, my, 7, 6); g.fillStyle = '#e8b048'; g.fillRect(mx - 3.5, my + 3, 7, 1); g.fillStyle = L.face; g.fillRect(mx - 2.5, my - 5, 5, 5); g.fillStyle = '#e0a830'; g.fillRect(mx - 3, my - 7, 6, 2.5); g.fillStyle = '#c83a2a'; g.fillRect(mx - 1, my - 7.5, 2, 1); if (!back) { g.fillStyle = '#202020'; g.fillRect(mx - 1.5 - (side ? 1 : 0), my - 3, 1, 1); if (!side) g.fillRect(mx + 0.5, my - 3, 1, 1); }
    g.restore(); SP.set(key, c); return c;
  }
  const x = 12, y = 21;
  // legs, body, arms
  g.fillStyle = L.legs; if (side) { g.fillRect(x - 2 + st, y - 5, 2, 5); g.fillRect(x - st, y - 5, 2, 5); } else { g.fillRect(x - 3, y - 5, 2.2, 5 - st); g.fillRect(x + 0.8, y - 5, 2.2, 4 + st); }
  g.fillStyle = L.body; g.fillRect(x - 4, y - 11, 8, 7); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x - 4, y - 6, 8, 1);
  // what they carry
  if (L.item === 'staff') { g.fillStyle = '#c83a20'; g.fillRect(side ? x + 2 : x + 4.5, y - 17, 1.2, 15); g.fillStyle = '#e8c040'; g.fillRect(side ? x + 2 : x + 4.5, y - 17, 1.2, 1.6); g.fillRect(side ? x + 2 : x + 4.5, y - 3.6, 1.2, 1.6); }
  if (L.item === 'rake') { g.fillStyle = '#8a6a4a'; g.fillRect(x + 4.5, y - 16, 1, 14); g.fillStyle = '#c8c8d0'; g.fillRect(x + 2.5, y - 17, 5, 1.6); for (let i = 0; i < 4; i++) g.fillRect(x + 2.6 + i * 1.3, y - 15.4, 0.7, 2); }
  if (L.item === 'pole') { g.fillStyle = '#8a6a4a'; g.fillRect(x - 9, y - 12, 18, 1); g.fillStyle = '#6a5a8a'; g.fillRect(x - 10, y - 11, 4, 5); g.fillStyle = '#8a4a3a'; g.fillRect(x + 6, y - 11, 4, 5); }
  // the head
  if (L.ears === 'pig') { g.fillStyle = L.head; g.fillRect(x - 5, y - 17, 3, 3); g.fillRect(x + 2, y - 17, 3, 3); }
  g.fillStyle = L.head; g.fillRect(x - 4, y - 18, 8, 7);
  if (!back) { g.fillStyle = L.face; if (L.ears === 'monkey') { g.fillRect(x - 3 - (side ? 1 : 0), y - 16, side ? 5 : 6, 5); g.fillStyle = L.head; g.fillRect(x - 5, y - 15, 1.5, 2); g.fillRect(x + 3.5, y - 15, 1.5, 2); } else g.fillRect(x - 3 - (side ? 1 : 0), y - 16, side ? 5 : 6, 4);
    g.fillStyle = '#100808'; g.fillRect(x - 2 - (side ? 1.5 : 0), y - 15, 1, 1.2); if (!side) g.fillRect(x + 1, y - 15, 1, 1.2);
    if (L.ears === 'pig') { g.fillStyle = '#8a7a80'; g.fillRect(x - 1.5 - (side ? 2.5 : 0), y - 13.5, 3, 2); }
    if (L.beard) { g.fillStyle = L.beard; g.fillRect(x - 3 - (side ? 1 : 0), y - 12.5, side ? 4 : 6, 2); } }
  if (L.ears === 'monkey') { g.fillStyle = '#e0a830'; g.fillRect(x - 4.5, y - 17.5, 9, 1.2); }
  g.restore(); SP.set(key, c); return c;
}
// a person met on the road: a robe of their own colour; the goal glows
export function npc(col, dir = 'down', glow = false) { return walker('npc', dir, 0, { col }); }
export function chest(open) { const key = 'chest' + open; if (SP.has(key)) return SP.get(key); const [c, g] = mk(16, 16); g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(8, 14.5, 6, 1.6, 0, 0, 7); g.fill(); g.fillStyle = '#8a2a1a'; g.fillRect(2, 7, 12, 7); g.fillStyle = open ? '#3a1008' : '#a83a22'; g.fillRect(2, open ? 3 : 4, 12, open ? 3 : 4); g.fillStyle = '#e8c040'; g.fillRect(2, 7, 12, 1); g.fillRect(7, 6, 2, 3); if (open) { g.fillStyle = 'rgba(255,230,120,0.6)'; g.fillRect(4, 5, 8, 2); } SP.set(key, c); return c; }
// the lair of a great demon: a black cloud with red eyes
export function lair(t) { const [c, g] = mk(24, 24); const k = (Math.sin(t / 300) + 1) / 2; const gl = g.createRadialGradient(12, 14, 2, 12, 14, 12); gl.addColorStop(0, `rgba(160,20,40,${0.5 + k * 0.3})`); gl.addColorStop(1, 'rgba(60,0,30,0)'); g.fillStyle = gl; g.fillRect(0, 0, 24, 24); g.fillStyle = '#1a0a14'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(7 + i * 2, 12 + Math.sin(i + t / 200) * 1.5, 4, 0, 7); g.fill(); } g.fillStyle = '#ff3a3a'; g.fillRect(9, 11, 2, 1.4); g.fillRect(13, 11, 2, 1.4); return c; }
export { shade, hexA };
