// Checks the data: every speaker has a portrait, every demon its numbers, every art and thing named exists, the shops
// sell what exists, and the eighty-one difficulties are each met once along the way.
import { STORY, MEMBERS, SKILLS, FOES, ITEMS, GEAR, SHOP, CHEST, NAN } from '../js/data/game.js';
import { CAST } from '../js/data/cast.js';
import { makeMap, blocked } from '../js/field.js';
let bad = 0; const fail = (m) => { bad++; console.log('✗ ' + m); };
const speakers = (txt, where) => { for (const ln of (txt || '').split('\n')) { const s = ln.trim(); if (!s) continue; const w = s.split('|')[0]; if (s.includes('|') && w !== '-' && !CAST[w]) fail(`${where}: no portrait for speaker ${w}`); } };
let lines = 0;
for (const e of STORY) {
  for (const f of ['intro', 'after', 'goal']) { speakers(e[f], e.id + '.' + f); lines += (e[f] || '').split('\n').filter((x) => x.trim()).length; }
  if (e.map) { for (const id of e.map.foes) { if (!FOES[id]) fail(`${e.id}: no foe ${id}`); if (!CAST[id]) fail(`${e.id}: no portrait for foe ${id}`); } for (const n of e.map.npcs || []) if (!CAST[n.split('|')[0]]) fail(`${e.id}: npc ${n}`); if (!e.boss && !e.map.goal) fail(`${e.id}: a map with neither boss nor goal`); if (e.map.goal && !e.goal) fail(`${e.id}: goal without words`); }
  for (const st of e.boss || []) { speakers(st.pre, e.id + '.pre'); speakers(st.post, e.id + '.post'); for (const id of st.foes) { if (!FOES[id]) fail(`${e.id}: no foe ${id}`); if (!CAST[id]) fail(`${e.id}: no portrait for ${id}`); } for (const id of [...(st.party || []), ...(st.guest || [])]) if (!MEMBERS[id]) fail(`${e.id}: no member ${id}`); }
  for (const id of [...(e.party || []), ...(e.join || []), ...(e.leave || []), ...(e.guest || [])]) if (!MEMBERS[id]) fail(`${e.id}: no member ${id}`);
  for (const [id, list] of Object.entries(e.learn || {})) for (const k of list) if (!SKILLS[k]) fail(`${e.id}: no skill ${k}`);
  for (const it of [...(e.give || []), ...(e.boss || []).flatMap((s) => s.give || [])]) if (!ITEMS[it] && !GEAR[it] && it !== '金箍棒') fail(`${e.id}: no thing ${it}`);
  if (e.town && !SHOP[e.town.shop]) fail(`${e.id}: no shop tier ${e.town.shop}`);
}
for (const [id, M] of Object.entries(MEMBERS)) { for (const k of [...(M.start || []), ...Object.values(M.learns || {})]) if (!SKILLS[k]) fail(`member ${id}: no skill ${k}`); }
for (const [id, F] of Object.entries(FOES)) for (const k of F.arts) if (!SKILLS[k]) fail(`foe ${id}: no art ${k}`);
for (const tier of SHOP) for (const k of tier) if (!ITEMS[k] && !GEAR[k]) fail(`shop: no ${k}`);
for (const tier of CHEST) for (const k of tier) if (k !== 'gold' && !ITEMS[k]) fail(`chest: no ${k}`);
const nan = STORY.flatMap((e) => e.nan || []); if (nan.length !== 81 || new Set(nan).size !== 81 || NAN.length !== 81) fail(`difficulties: ${nan.length} met, ${new Set(nan).size} distinct, ${NAN.length} named`);
for (let i = 1; i <= 81; i++) if (!nan.includes(i)) fail(`difficulty ${i} (${NAN[i - 1]}) never met`);
// every map: the end, each chest and each person on the road can be reached from the start
const kinds = new Set(); let rests = 0;
for (const e of STORY) {
  if (!e.map) continue; const M = makeMap(e); kinds.add(M.P.layout + ':' + e.map.theme);
  const seen = new Set([M.start.x + ',' + M.start.y]), q = [[M.start.x, M.start.y]];
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = x + dx + ',' + (y + dy); if (!seen.has(k) && !blocked(M, x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); } } }
  const near = ({ x, y }) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(x + dx + ',' + (y + dy)));
  if (!seen.has(M.end.x + ',' + M.end.y)) fail(`${e.id}: the end of the map cannot be reached`);
  for (const c of M.chests) if (!near(c)) fail(`${e.id}: a chest at ${c.x},${c.y} cannot be reached`);
  for (const n of M.npcs) if (!near(n)) fail(`${e.id}: ${n.who} at ${n.x},${n.y} cannot be reached`);
  if (!M.rests.length) fail(`${e.id}: no place to rest`); for (const r of M.rests) if (!near(r)) fail(`${e.id}: a resting place at ${r.x},${r.y} cannot be reached`); rests += M.rests.length;
  if (M.chests.length < Math.min(2, e.map.chests ?? 3)) fail(`${e.id}: only ${M.chests.length} chests`);
}
console.log(`maps: ${[...kinds].join(' ')}; ${rests} places to rest`);
console.log(`${STORY.length} episodes, ${lines} lines of story text, ${Object.keys(CAST).length} portraits, ${Object.keys(FOES).length} demons, ${Object.keys(SKILLS).length} arts, ${Object.keys(ITEMS).length + Object.keys(GEAR).length} things`);
console.log(bad ? `${bad} problem(s)` : 'all ok'); process.exit(bad ? 1 : 0);
