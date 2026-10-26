// Checks the data: every speaker has a portrait, every demon its numbers, every art and thing named exists, the shops
// sell what exists, and the eighty-one difficulties are each met once along the way.
import { STORY, MEMBERS, SKILLS, FOES, ITEMS, GEAR, SHOP, CHEST, NAN } from '../js/data/game.js';
import { CAST } from '../js/data/cast.js';
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
console.log(`${STORY.length} episodes, ${lines} lines of story text, ${Object.keys(CAST).length} portraits, ${Object.keys(FOES).length} demons, ${Object.keys(SKILLS).length} arts, ${Object.keys(ITEMS).length + Object.keys(GEAR).length} things`);
console.log(bad ? `${bad} problem(s)` : 'all ok'); process.exit(bad ? 1 : 0);
