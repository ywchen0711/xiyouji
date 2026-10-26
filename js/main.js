// 西遊記・八十一難: the game. The story is told in its order, from the stone monkey's birth to the five who became
// buddhas: each episode is its words, sometimes a town, a road to walk (demons on it, chests and people beside it)
// and the great demon at its end. The journey's state lives in S and is saved in the browser (and to the account,
// when signed in to the game hub).
import { STORY, MEMBERS, SKILLS, ITEMS, GEAR, SHOP, CHEST, NAN, ORDER, MIDS, LOCAL } from './data/game.js';
import { CAST } from './data/cast.js';
import { SECRETS, RIDDLES } from './data/secrets.js';
import { newUnit, setLevel, stats, epLv, expNeed, canWear } from './rules.js';
import { Battle } from './battle.js';
import { makeMap, drawMap, blocked, restKind, TS } from './field.js';
import { backdrop, THEMES } from './art.js';
import { say, lines, menu, confirm, toast, panel, banner, input, press, $, el, faceOf } from './ui.js';
import { sfx, music, setSound, soundOn } from './sound.js';
import { rng, hash, clamp, esc, wait } from './util.js';

const KEY = 'xiyouji.v1', GAME = 'xiyouji', LW = 384, LH = 224, K = 3;
const cv = $('cv'), g = cv.getContext('2d'); cv.width = LW * K; cv.height = LH * K;
let S = null, scene = 'title', busy = false, cloud = null, battle = null, M = null, stageBg = 'heaven', exploring = null;
let inSecret = null; // the hidden place the pilgrims are in, if any (its progress is not kept: a reload puts them back at its door)
const P = { x: 0, y: 0, fx: 0, fy: 0, dir: 'right', step: 0, trail: [], from: [], fdir: [], k: 1, endT: 0, since: 0, moving: false };
const RETRY = Symbol('retry');

// ---------------------------------------------------------------- the journey's state
const fresh = () => ({ v: 1, ep: 0, phase: 'intro', stage: 0, started: -1, units: {}, party: [], guests: [], names: {}, items: { 仙桃: 3 }, gear: [], gold: 60, flags: {}, nan: [], opened: {}, pos: null, sound: true, steps: 0, battles: 0 });
function save() { if (!S) return; if (M && scene === 'map' && !inSecret) S.pos = { x: P.x, y: P.y, dir: P.dir }; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (cloud) cloud.touch(GAME, KEY); }
function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.units) return { ...fresh(), ...v }; } catch (e) {} return null; }
const party = () => ORDER.filter((id) => S.party.includes(id));
const unit = (id) => S.units[id];
const faceFor = (id) => (id !== '悟空' ? id : S.ep <= 4 ? '石猴' : S.ep <= 7 ? '大聖' : S.ep === 8 ? '火眼' : '悟空');
const sayOpt = () => ({ names: { 悟空: S.names.悟空 || '孫悟空', 石猴: S.names.悟空 === '石猴' ? '石猴' : '美猴王' } });
function heal(u) { const s = stats(u, S.flags); u.hp = s.hp; u.mp = s.mp; }
function join(id) { const want = Math.max(1, epLv(S.ep) - 1); if (!S.units[id]) S.units[id] = newUnit(id, want); else { const u = S.units[id]; if (u.lv < want - 1) { setLevel(u, want - 1); u.exp = 0; } } heal(S.units[id]); if (!S.party.includes(id)) S.party.push(id); }
function give(id, n = 1) {
  if (id === '金箍棒') { S.flags.金箍棒 = true; return '如意金箍棒'; }
  if (GEAR[id]) { for (let i = 0; i < n; i++) S.gear.push(id); const G = GEAR[id]; if (G.who && G.who.length === 1 && S.units[G.who[0]]) { const u = S.units[G.who[0]]; if (!u.eq[G.slot]) equip(u, G.slot, id); } return G.name; }
  if (ITEMS[id]) { S.items[id] = (S.items[id] || 0) + n; return ITEMS[id].name; } return id;
}
function equip(u, slot, id) { if (u.eq[slot]) S.gear.push(u.eq[slot]); if (id) { const i = S.gear.indexOf(id); if (i >= 0) S.gear.splice(i, 1); } u.eq[slot] = id || null; const s = stats(u, S.flags); u.hp = Math.min(u.hp, s.hp); u.mp = Math.min(u.mp, s.mp); }
function learn(map) { for (const [id, list] of Object.entries(map || {})) { const u = S.units[id]; if (!u) continue; for (const k of list) if (!u.skills.includes(k)) { u.skills.push(k); toast(`${MEMBERS[id].name.replace('孫悟空', S.names.悟空 || '孫悟空')}學會了「${SKILLS[k].name}」！`); } } }

// ---------------------------------------------------------------- drawing
function draw(t) {
  g.setTransform(K, 0, 0, K, 0, 0); g.imageSmoothingEnabled = false;
  if (scene === 'battle' && battle) { battle.render(g, t); return; }
  if (scene === 'map' && M) { const cam = { x: clamp(P.fx * TS + 8 - LW / 2, 0, M.w * TS - LW), y: clamp(P.fy * TS + 8 - LH / 2, 0, M.h * TS - LH) }; drawMap(g, M, cam, walkers(), t, { opened: S.opened[(inSecret || STORY[S.ep])?.id] || [], goal: inSecret ? 'lair' : exploring?.goal, inSecret: !!inSecret }); return; }
  g.imageSmoothingEnabled = false; g.drawImage(backdrop(stageBg, S && STORY[S.ep]?.id), 0, 0, LW, LH);
  if (scene === 'title') { const k = t / 4000; g.fillStyle = 'rgba(255,240,200,0.1)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(((i * 80 + k * 30) % 460) - 40, 150 + Math.sin(i) * 20, 60, 10, 0, 0, 7); g.fill(); } }
  if (scene === 'story') { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, LW, LH); }
}
function walkers() { const now = performance.now(), walking = P.moving || now - (P.endT || 0) < 90, ids = party().concat(S.guests.filter((x) => x === '伯欽')), out = []; ids.forEach((id, i) => { const p = i === 0 ? { x: P.fx, y: P.fy, dir: P.dir } : follower(i - 1); out.push({ id: ['悟空', '唐僧', '八戒', '悟淨'].includes(id) ? id : 'npc', fx: p.x, fy: p.y, dir: p.dir, step: walking ? Math.floor(now / 170) % 2 : 0 }); }); return out; }
// those behind glide from the square they stood on to the one the one ahead of them left, facing the way they go
function follower(j) { const a = P.from[j] || P.trail[j] || P, b = P.trail[j] || a, k = P.k, dx = b.x - a.x, dy = b.y - a.y; if (dx || dy) P.fdir[j] = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; return { x: a.x + dx * k, y: a.y + dy * k, dir: P.fdir[j] || P.dir }; }

// ---------------------------------------------------------------- the story, episode by episode
async function runStory() {
  for (;;) {
    const e = STORY[S.ep]; if (!e) return ending();
    stageBg = e.map?.theme || (e.town ? 'town' : 'heaven');
    if (S.phase === 'intro') {
      if (S.started !== S.ep) startEpisode(e);
      scene = 'story'; music(THEMES[stageBg]?.music || 'road');
      await chapterCard(e);
      await say(lines(e.intro), sayOpt());
      S.phase = e.town ? 'town' : e.map ? 'map' : 'after'; S.stage = 0; S.pos = null; save();
    }
    if (S.phase === 'town') { await town(e); S.phase = e.map ? 'map' : 'after'; S.pos = null; save(); }
    if (S.phase === 'map') { const r = await explore(e); if (r === RETRY) continue; S.phase = 'after'; save(); }
    if (S.phase === 'after') {
      scene = 'story'; M = null; await say(lines(e.after), sayOpt());
      endEpisode(e); if (e.final) { S.phase = 'end'; save(); return ending(); }
      S.ep++; S.phase = 'intro'; save();
    }
  }
}
function startEpisode(e) {
  S.started = S.ep;
  if (e.party) { for (const id of e.party) join(id); S.party = [...e.party]; }
  if (e.name) Object.assign(S.names, e.name);
  S.guests = [...(e.guest || [])];
  learn(e.learn);
  if (e.id === 'e10') { give('錦襴袈裟'); toast('得到了「錦襴袈裟」與「九環錫杖」'); }
  for (const id of S.party) heal(S.units[id]);
  save();
}
function endEpisode(e) {
  for (const id of e.join || []) join(id);
  for (const id of e.leave || []) S.party = S.party.filter((x) => x !== id);
  for (const it of e.give || []) toast(`得到了「${give(it)}」`);
  S.guests = [];
  for (const n of e.nan || []) if (!S.nan.includes(n)) { S.nan.push(n); }
  if (e.nan?.length) toast(e.nan.map((n) => `第${cnum(n)}難　${NAN[n - 1]}`).join('　'), 3400);
}
const cnum = (n) => { const d = '〇一二三四五六七八九'; if (n < 10) return d[n]; if (n < 20) return '十' + (n % 10 ? d[n % 10] : ''); return d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : ''); };
async function chapterCard(e) { sfx('gong'); await banner(`<div class="hui">${esc(e.hui)}</div><div class="ht">${esc(e.title)}</div><div class="hp">${esc(e.place)}</div>`, 2300, 'chapter'); }

// ---------------------------------------------------------------- walking a road
function explore(e) {
  inSecret = null; M = makeMap(e); const md = MIDS[e.id]; if (md && M.midAt && !(S.mids || {})[e.id]) M.mid = { ...M.midAt, id: md.foes[0] };
  const sd = SECRETS.find((q) => q.ep === e.id); if (sd && M.secretAt && !(S.secrets || {})[sd.id]) { M.secret = { ...M.secretAt, d: sd }; setTimeout(() => toast('這一帶似乎藏著甚麼……留意路旁的微光。', 2600), 1500); }
  scene = 'map'; music(THEMES[e.map.theme]?.music || 'road');
  const p = S.pos || M.start; P.x = P.fx = p.x; P.y = P.fy = p.y; P.dir = p.dir || 'right'; P.trail = [0, 1, 2, 3].map(() => ({ x: p.x, y: p.y })); P.from = []; P.fdir = []; P.k = 1; P.since = 0;
  const goal = e.boss ? 'lair' : e.map.goal || null;
  return new Promise((res) => { exploring = { e, goal, res }; busy = false; if (!S.pos) banner(esc(e.map.name), 1200); });
}
async function tryMove(dx, dy) {
  P.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
  const x = P.x + dx, y = P.y + dy, E = exploring;
  if (inSecret && x === M.end.x && y === M.end.y) { await secretTrial(); return; }
  if (x === M.end.x && y === M.end.y && E.goal) { await reachEnd(); return; }
  if (M.mid && x === M.mid.x && y === M.mid.y) { await midFight(E.e); return; }
  if (blocked(M, x, y)) return;
  P.from = P.trail.map((q) => ({ ...q })); P.moving = true; P.trail.unshift({ x: P.x, y: P.y }); P.trail.length = 4; P.k = 0;
  // one step runs on from the last without a pause between, so a held key walks smoothly
  const fx0 = P.x, fy0 = P.y, now0 = performance.now(), t0 = now0 - (P.endT || 0) < 120 ? P.endT : now0; P.x = x; P.y = y;
  await new Promise((res) => { const f = (now) => { const k = Math.max(0, Math.min(1, (now - t0) / 170)); P.k = k; P.fx = fx0 + dx * k; P.fy = fy0 + dy * k; if (k < 1) requestAnimationFrame(f); else res(); }; f(performance.now()); });
  P.endT = t0 + 170; P.k = 1; P.moving = false; S.steps++; P.since++;
  if (S.steps % 12 === 0) save();
  if (!inSecret && M.secret && P.x === M.secret.x && P.y === M.secret.y) { await secretEnter(M.secret.d); return; }
  const here = inSecret || E.e, foes = here.map.foes || [];
  if (M.mid && Math.abs(M.mid.x - P.x) + Math.abs(M.mid.y - P.y) <= 2) { P.since = 0; await midFight(E.e); return; } // the captain sees them coming
  if (foes.length && P.since > 7 && Math.random() < 1 / 15) { P.since = 0; await wildFight(here); }
}
async function wildFight(e) {
  // the demons of the road, and now and then the creatures of the country mixed in among them
  const R = rng(Date.now() >>> 0), n = R.int(1, party().length === 1 ? 2 : Math.min(4, party().length + 1 + (R() < 0.3 ? 1 : 0))), local = e.map.foes.includes('天兵') ? [] : LOCAL[e.map.theme] || [];
  const foes = Array.from({ length: n }, () => (local.length && R() < 0.35 ? R.pick(local) : R.pick(e.map.foes)));
  const r = await fight({ foes, lv: Math.max(1, epLv(S.ep) - 1 + R.int(-1, 1)), theme: e.map.theme, ep: e.id });
  if (r.end === 'lose') await gameOver(); else save();
}
// the captain of the road: words, a hard fight (no running from it), and something always left behind
async function midFight(e) {
  const md = MIDS[e.id], R = rng(hash(e.id + 'mid')), keep = Math.max(1, Math.min(md.foes.length, party().length + (S.guests || []).length)); save();
  await say(lines(md.say), sayOpt());
  const r = await fight({ foes: md.foes.slice(0, keep), lv: epLv(S.ep), theme: e.map.theme, ep: e.id, boss: true, hpK: 0.85 });
  if (r.end === 'lose') { await gameOver(); return; }
  (S.mids = S.mids || {})[e.id] = true; M.mid = null;
  const tier = Math.min(3, Math.floor(S.ep / 14)), pool = (SHOP[Math.min(SHOP.length - 1, Math.floor(S.ep / 5) + 2)] || []).filter((k) => GEAR[k] && !S.gear.includes(k));
  const got = R() < 0.5 && pool.length ? give(R.pick(pool)) : give(R.pick(CHEST[tier].filter((x) => x !== 'gold')));
  sfx('chest'); toast(`${CAST[md.foes[0]]?.name || md.foes[0]}留下了：${got}`, 2600); save();
}
// ---------------------------------------------------------------- the hidden places (秘境)
async function secretEnter(d) {
  sfx('chest'); const go = await confirm(`路旁的草叢後面，竟有一條隱密的小徑。要進去「${d.name}」看看嗎？`); if (!go) return;
  save(); inSecret = d; M = makeMap({ id: d.id, map: d.map }); P.x = P.fx = M.start.x; P.y = P.fy = M.start.y; P.dir = 'right'; P.trail = [0, 1, 2, 3].map(() => ({ x: P.x, y: P.y })); P.from = []; P.k = 1; P.since = 0;
  music(THEMES[d.map.theme]?.music || 'cave'); await banner(`秘境　${esc(d.name)}`, 1400, 'chapter'); if (d.intro) await say(lines(d.intro), sayOpt());
  toast(trialText(d.trial), 3200);
}
const trialText = (T) => [T.waves ? `連戰 ${T.waves.length} 陣，中間不能歇息` : '', T.riddle ? `先答 ${T.riddle} 道題，答錯會遭埋伏` : '', T.limit ? `${T.limit} 回合內獲勝` : '', T.solo ? `只有${MEMBERS[T.solo].name}一人應戰` : '', T.seal ? '法術全被封住' : ''].filter(Boolean).join('；') || '打倒守關的妖怪';
// the trial at the end of the hidden place; losing it only sends them back to the road
async function secretTrial() {
  const d = inSecret, T = d.trial, R = rng(hash(d.id + S.battles)), lv = epLv(S.ep) + 1;
  await say([['-', '秘境的盡頭，就是試煉之地。'], ['-', `試煉：${trialText(T)}。`]], sayOpt());
  if (T.riddle) { const pool = [...RIDDLES].sort(() => R() - 0.5).slice(0, T.riddle);
    for (const [q, ...ans] of pool) { const opts = ans.map((a, i) => ({ label: a, value: i })).sort(() => R() - 0.5); const v = await menu(opts, { title: q, noCancel: true });
      if (v === 0) { sfx('ok'); toast('答對了！'); } else { sfx('down'); toast(`答錯了！正確答案是「${ans[0]}」——有埋伏！`, 2200); const r = await fight({ foes: Array.from({ length: Math.min(3, party().length) }, () => R.pick(d.map.foes)), lv, theme: d.map.theme, ep: d.id }); if (r.end === 'lose') return secretLeave(false); } } }
  const waves = T.waves || [T.foes];
  for (const [i, foes] of waves.entries()) {
    if (waves.length > 1) await banner(`第 ${i + 1} 陣`, 900, 'boss');
    const r = await fight({ foes, lv, theme: d.map.theme, ep: d.id, boss: true, hpK: 0.9, limit: T.limit, sealAll: T.seal, party: T.solo ? [T.solo] : undefined });
    if (r.end !== 'win') { if (r.end === 'timeout') await say([['-', '妖怪趁機溜走了，試煉沒有成功。下次再來罷。']], sayOpt()); return secretLeave(false); }
  }
  (S.secrets = S.secrets || {})[d.id] = true; const got = give(d.reward); sfx('revive');
  await banner(`試煉成功！<br><small>得到了秘寶「${esc(got)}」</small>`, 2200, 'chapter'); toast(`得到秘寶：${got}（${gearDesc(d.reward)}）`, 3600);
  return secretLeave(true);
}
async function secretLeave(won) {
  if (!won) for (const u of Object.values(S.units)) { const s2 = stats(u, S.flags); u.hp = Math.max(u.hp, Math.round(s2.hp * 0.3)); }
  const e = exploring.e; inSecret = null; M = makeMap(e); const md = MIDS[e.id]; if (md && M.midAt && !(S.mids || {})[e.id]) M.mid = { ...M.midAt, id: md.foes[0] };
  const sd = SECRETS.find((q) => q.ep === e.id); if (sd && M.secretAt && !(S.secrets || {})[sd.id]) M.secret = { ...M.secretAt, d: sd };
  const p = S.pos || M.start; P.x = P.fx = p.x; P.y = P.fy = p.y; P.trail = [0, 1, 2, 3].map(() => ({ x: p.x, y: p.y })); P.from = []; P.k = 1; P.since = 0;
  music(THEMES[e.map.theme]?.music || 'road'); banner(won ? '回到了原來的路上' : '被趕出了秘境……', 1200); save();
}
async function interact() {
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[P.dir], x = P.x + d[0], y = P.y + d[1], E = exploring, id = (inSecret || E.e).id;
  if (inSecret && x === M.end.x && y === M.end.y) return secretTrial();
  if (!inSecret && x === M.end.x && y === M.end.y && E.goal) return reachEnd();
  if (M.mid && x === M.mid.x && y === M.mid.y) return midFight(E.e);
  const n = M.npcs.find((q) => q.x === x && q.y === y); if (n) return say([[n.who, n.text]], sayOpt());
  const r = M.rests.find((q) => q.x === x && q.y === y);
  if (r) { // rest: everyone (and the guests) whole again, every ill gone, the game saved
    for (const u of Object.values(S.units)) { heal(u); if (u.st) u.st = {}; }
    sfx('heal'); const k = restKind(M);
    await banner(k === 'censer' ? '焚一爐清香，靜坐片刻，眾人氣血調和。<br><small>兵氣、法力全滿，已記錄進度。</small>' : k === 'lotus' ? '金蓮放光，照得眾人神清氣爽。<br><small>兵氣、法力全滿，已記錄進度。</small>' : '一汪靈泉，清冽甘甜，眾人掬水而飲，精神百倍。<br><small>兵氣、法力全滿，已記錄進度。</small>', 1700);
    save(); return; }
  const c = M.chests.find((q) => q.x === x && q.y === y), key = x + ',' + y;
  if (c && !(S.opened[id] || []).includes(key)) { (S.opened[id] = S.opened[id] || []).push(key); sfx('chest'); const R = rng(hash(id + key)), tier = Math.min(3, Math.floor(S.ep / 14) + (inSecret ? 1 : 0)); let got;
    if (R() < (inSecret ? 0.5 : 0.22)) { const pool = (SHOP[Math.min(SHOP.length - 1, Math.floor(S.ep / 5) + 2)] || []).filter((k) => GEAR[k]); got = pool.length ? give(R.pick(pool)) : null; }
    if (!got) { const it = R.pick(CHEST[tier]); if (it === 'gold') { const n = Math.round((30 + S.ep * 40) * (0.7 + R() * 0.6)); S.gold += n; got = `銀兩 ${n}`; } else got = give(it); }
    toast(`寶箱裡有：${got}`); save(); }
}
async function reachEnd() {
  const E = exploring, e = E.e;
  if (e.boss) {
    for (let s = S.stage; s < e.boss.length; s++) {
      const st = e.boss[s]; save();
      if (st.pre) await say(lines(st.pre), sayOpt());
      for (const it of st.give || []) toast(`得到了「${give(it)}」`);
      if (st.party) for (const id of st.party) if (S.units[id]) heal(S.units[id]); // a fight apart from the others comes after a break in the tale
      const r = await fight({ foes: st.foes, lv: epLv(S.ep), theme: e.map.theme, ep: e.id, boss: true, scripted: st.scripted, party: st.party, guest: st.guest, hpK: st.hpK });
      if (r.end === 'lose' && !st.lose) { await gameOver(); return; }
      if (r.end === 'story' || r.end === 'lose') for (const id of Object.keys(S.units)) { const u = S.units[id], s2 = stats(u, S.flags); u.hp = Math.max(u.hp, Math.round(s2.hp * 0.5)); u.mp = Math.max(u.mp, Math.round(s2.mp * 0.5)); }
      learn(st.learn);
      if (st.post) await say(lines(st.post), sayOpt());
      S.stage = s + 1; save();
    }
  } else if (e.goal) await say(lines(e.goal), sayOpt());
  exploring = null; const res = E.res; res();
}
async function fight(o) {
  const prev = scene; scene = 'battle'; S.battles++;
  const ids = (o.party || party()).filter((id) => S.units[id]), guestIds = [...new Set([...(S.guests || []), ...(o.guest || [])])], guestUnits = {};
  for (const id of guestIds) { guestUnits[id] = newUnit(id, Math.max(1, epLv(S.ep) + 2)); }
  for (const id of ids) { const u = S.units[id]; if (u.hp <= 0 && o.boss) u.hp = 1; }
  battle = new Battle({ S, faceFor, party: [...ids, ...guestIds], guestUnits, foes: o.foes, lv: o.lv, theme: o.theme, ep: o.ep, boss: o.boss, scripted: o.scripted, hpK: o.hpK, limit: o.limit, sealAll: o.sealAll });
  const r = await battle.run(); battle = null; scene = prev === 'battle' ? 'map' : prev; music(THEMES[stageBg]?.music || 'road');
  if (r.end !== 'lose') for (const id of ids) { const u = S.units[id]; if (u.hp <= 0) u.hp = 1; }
  return r;
}
async function gameOver() {
  music(null); sfx('down'); await banner('全軍覆沒……', 1800, 'boss');
  const c = await menu([{ label: '從上次存檔處重來', value: 'retry' }, { label: '回到標題', value: 'title' }], { title: '取經之路，還未走完', cls: 'small', noCancel: true });
  const saved = load(); if (c === 'retry' && saved) { S = saved; for (const u of Object.values(S.units)) heal(u); M = null; exploring = null; throw RETRY; } // a retry comes back rested, so a hard fight can be tried again
  location.reload(); await new Promise(() => {});
}

// ---------------------------------------------------------------- towns
async function town(e) {
  const T = e.town; scene = 'town'; stageBg = 'town'; music('town'); const tier = T.shop || 1;
  await banner(esc(T.name), 1100);
  for (;;) {
    const c = await menu([{ label: '客棧', hint: `${innPrice(tier)} 兩`, value: 'inn' }, { label: '商店', value: 'shop' }, { label: '打聽', value: 'talk' }, { label: '整備', value: 'menu' }, { label: '出發', value: 'go' }], { title: T.name, cls: 'place', noCancel: true, foot: `銀兩 ${S.gold}` });
    if (c === 'go') return;
    if (c === 'inn') { const p = innPrice(tier); if (S.gold < p) { toast('銀兩不夠。'); continue; } S.gold -= p; for (const id of Object.keys(S.units)) heal(S.units[id]); sfx('heal'); await banner('在客棧裡歇了一夜，精神百倍。', 1200); save(); }
    if (c === 'shop') await shop(tier);
    if (c === 'talk') for (const s of T.talk || []) { const [who, text] = s.split('|'); await say([[who, text]], sayOpt()); }
    if (c === 'menu') await fieldMenu(true);
  }
}
const innPrice = (tier) => 10 + tier * 18;
async function shop(tier) {
  for (;;) {
    const c = await menu([{ label: '買', value: 'buy' }, { label: '賣', value: 'sell' }], { title: `商店（銀兩 ${S.gold}）`, cls: 'place' }); if (!c) return;
    if (c === 'buy') for (;;) { const list = SHOP[Math.min(tier, SHOP.length - 1)], items = list.map((k) => { const I = ITEMS[k] || GEAR[k]; return { label: I.name, hint: `${I.price}`, value: k, off: I.price > S.gold, desc: ITEMS[k] ? I.desc : gearDesc(k) }; }); const k = await menu(items, { title: `買甚麼？（銀兩 ${S.gold}）`, cls: 'shop', foot: '', start: items.findIndex((i) => !i.off) }); if (!k) break; const I = ITEMS[k] || GEAR[k]; S.gold -= I.price; give(k); sfx('coin'); toast(`買了「${I.name}」`); save(); }
    if (c === 'sell') for (;;) { const items = [...Object.entries(S.items).filter(([k, n]) => n > 0 && ITEMS[k].price).map(([k, n]) => ({ label: ITEMS[k].name, hint: `×${n}　${Math.floor(ITEMS[k].price / 2)}`, value: 'i:' + k })), ...[...new Set(S.gear)].filter((k) => GEAR[k].price).map((k) => ({ label: GEAR[k].name, hint: `×${S.gear.filter((x) => x === k).length}　${Math.floor(GEAR[k].price / 2)}`, value: 'g:' + k }))]; if (!items.length) { toast('沒有可以賣的東西。'); break; } const v = await menu(items, { title: `賣甚麼？（銀兩 ${S.gold}）`, cls: 'shop' }); if (!v) break; const [t, k] = v.split(':'); if (t === 'i') { S.items[k]--; S.gold += Math.floor(ITEMS[k].price / 2); } else { S.gear.splice(S.gear.indexOf(k), 1); S.gold += Math.floor(GEAR[k].price / 2); } sfx('coin'); save(); }
  }
}
const SLOT = { body: '衣甲', acc: '飾物', head: '頭冠', feet: '鞋履' };
const gearDesc = (k) => { const G = GEAR[k], parts = []; for (const [s, n] of [['atk', '攻'], ['def', '防'], ['mag', '法'], ['spd', '速'], ['hp', '兵氣'], ['mp', '法力']]) if (G[s]) parts.push(`${n}+${G[s]}`); if (G.crit) parts.push(`會心+${Math.round(G.crit * 100)}%`); if (G.regen) parts.push(`每回合回復${Math.round(G.regen * 100)}%兵氣`); if (G.res) parts.push({ fire: '抗火', water: '抗水' }[G.res]); if (G.ward) parts.push({ poison: '防毒', seal: '防封', blind: '防盲', stun: '防定身', sleep: '防昏睡' }[G.ward]); if (G.who) parts.push(`限${G.who.map((w) => MEMBERS[w].name).join('、')}`); return `${SLOT[G.slot]}：${parts.join('　')}`; };

// ---------------------------------------------------------------- the menu on the road
async function fieldMenu(inTown) {
  for (;;) {
    const c = await menu([{ label: '狀態', value: 'st' }, { label: '法術', value: 'sk' }, { label: '道具', value: 'it' }, { label: '裝備', value: 'eq' }, { label: '八十一難', value: 'nan' }, { label: '故事回顧', value: 'story' }, { label: `音效：${soundOn() ? '開' : '關'}`, value: 'snd' }, ...(inTown ? [] : [{ label: '回到標題', value: 'title' }])], { title: `銀兩 ${S.gold}`, cls: 'main' });
    if (!c) return;
    if (c === 'st') await statusScreen();
    if (c === 'sk') await fieldSkills();
    if (c === 'it') await fieldItems();
    if (c === 'eq') await equipScreen();
    if (c === 'nan') await nanScreen();
    if (c === 'story') await storyScreen();
    if (c === 'snd') { setSound(!soundOn()); S.sound = soundOn(); if (soundOn()) music(THEMES[stageBg]?.music || 'road'); save(); }
    if (c === 'title') { if (await confirm('回到標題畫面？（旅程已自動存檔）')) { save(); location.reload(); } }
  }
}
const nameOf = (id) => (id === '悟空' ? S.names.悟空 || '孫悟空' : MEMBERS[id].name);
async function pickMember(title, filter = () => true) { const ids = party().filter(filter); if (!ids.length) { toast('沒有人可選。'); return null; } return menu(ids.map((id) => { const u = unit(id), s = stats(u, S.flags); return { label: nameOf(id), hint: `${u.hp}/${s.hp}`, value: id }; }), { title, cls: 'order' }); }
async function statusScreen() {
  for (const id of party()) {
    const u = unit(id), s = stats(u, S.flags), box = el('div', 'win detail'); const f = faceOf(faceFor(id)); if (f) box.appendChild(f);
    box.appendChild(el('div', 'dinfo', `<div class="dname">${esc(nameOf(id))}<small>　第 ${u.lv} 級　經驗 ${u.exp}/${expNeed(u.lv)}</small></div>
      <div class="dstats"><span>兵氣 <b>${u.hp}/${s.hp}</b></span><span>法力 <b>${u.mp}/${s.mp}</b></span><span>攻擊 <b>${s.atk}</b></span><span>防禦 <b>${s.def}</b></span><span>法術 <b>${s.mag}</b></span><span>速度 <b>${s.spd}</b></span></div>
      <div class="dtac">兵器：${esc(id === '悟空' && !S.flags.金箍棒 ? '樹枝棍' : MEMBERS[id].weapon)}　衣甲：${esc(GEAR[u.eq.body]?.name || '—')}　頭冠：${esc(GEAR[u.eq.head]?.name || '—')}　鞋履：${esc(GEAR[u.eq.feet]?.name || '—')}　飾物：${esc(GEAR[u.eq.acc]?.name || '—')}</div>
      <div class="dtac">法術：${u.skills.map((k) => esc(SKILLS[k].name)).join('、') || '—'}</div><div class="dhint">（按任意鍵看下一位）</div>`));
    $('ui').appendChild(box); await new Promise((res) => { const off = input.on((a) => { if (['ok', 'cancel', 'menu'].includes(a)) { off(); box.remove(); res(); } }); box.onclick = () => press('ok'); });
  }
}
async function fieldSkills() {
  const caster = await pickMember('誰施法？', (id) => unit(id).skills.some((k) => ['heal', 'revive', 'cure'].includes(SKILLS[k].kind))); if (!caster) return;
  const u = unit(caster), sk = u.skills.filter((k) => ['heal', 'revive', 'cure'].includes(SKILLS[k].kind));
  for (;;) { const k = await menu(sk.map((x) => ({ label: SKILLS[x].name, hint: String(SKILLS[x].mp), value: x, off: SKILLS[x].mp > u.mp, desc: SKILLS[x].desc })), { title: `法力 ${u.mp}`, cls: 'order wide', foot: '' }); if (!k) return; const T = SKILLS[k], cs = stats(u, S.flags);
    const targets = T.to === 'allies' ? party() : T.to === 'self' ? [caster] : [await pickMember(T.kind === 'revive' ? '救誰？' : '給誰？', (id) => (T.kind === 'revive' ? unit(id).hp <= 0 : unit(id).hp > 0))]; if (!targets[0]) continue;
    u.mp -= T.mp; for (const id of targets) { const t = unit(id), ts = stats(t, S.flags); if (T.kind === 'revive') { if (t.hp <= 0) t.hp = Math.round(ts.hp * T.pct); } else if (t.hp > 0) t.hp = Math.min(ts.hp, t.hp + (T.pct ? Math.round(ts.hp * T.pct) : Math.round(T.pw * (1 + u.lv * 0.06) + cs.mag * 2.4))); }
    sfx('heal'); toast(`${nameOf(caster)}施展了「${T.name}」`); save(); }
}
async function fieldItems() {
  for (;;) { const list = Object.entries(S.items).filter(([k, n]) => n > 0); if (!list.length) { toast('沒有道具。'); return; } const k = await menu(list.map(([k, n]) => ({ label: ITEMS[k].name, hint: '×' + n, value: k, off: ITEMS[k].kind === 'key', desc: ITEMS[k].desc })), { title: '道具', cls: 'order wide', foot: '' }); if (!k) return; const I = ITEMS[k];
    const targets = I.kind === 'healAll' ? party() : [await pickMember('給誰？', (id) => (I.kind === 'revive' ? unit(id).hp <= 0 : true))]; if (!targets[0]) continue;
    S.items[k]--; for (const id of targets) { const t = unit(id), s = stats(t, S.flags); if (I.kind === 'revive') { if (t.hp <= 0) t.hp = Math.max(1, Math.round(s.hp * I.pct)); } else if (I.kind === 'mp') t.mp = Math.min(s.mp, t.mp + I.pw); else if (I.kind === 'cure') { } else if (t.hp > 0) t.hp = Math.min(s.hp, t.hp + I.pw); }
    sfx('heal'); toast(`用了「${I.name}」`); save(); }
}
async function equipScreen() {
  const id = await pickMember('誰要換裝備？'); if (!id) return; const u = unit(id);
  for (;;) { const slot = await menu(['body', 'head', 'feet', 'acc'].map((k) => ({ label: `${SLOT[k]}：${GEAR[u.eq[k]]?.name || '—'}`, value: k })), { title: nameOf(id), cls: 'order' }); if (!slot) return;
    const own = [...new Set(S.gear)].filter((k) => GEAR[k].slot === slot && canWear(id, k));
    const k = await menu([{ label: '（卸下）', value: '-', desc: '' }, ...own.map((k) => ({ label: GEAR[k].name, hint: `×${S.gear.filter((x) => x === k).length}`, value: k, desc: gearDesc(k) }))], { title: SLOT[slot], cls: 'order wide', foot: '' }); if (!k) continue;
    equip(u, slot, k === '-' ? null : k); sfx('ok'); save(); }
}
async function nanScreen() { const done = new Set(S.nan); await panel(`<div class="ptitle">八十一難　<small>已歷 ${done.size} 難</small></div><div class="nan">${NAN.map((n, i) => `<span class="${done.has(i + 1) ? 'on' : ''}"><i>${cnum(i + 1)}</i>${done.has(i + 1) ? esc(n) : '？？？'}</span>`).join('')}</div>`, 'nanp'); }
async function storyScreen() {
  const done = STORY.slice(0, S.ep + (S.phase === 'end' ? 1 : 0)); if (!done.length) { toast('旅程才剛開始。'); return; }
  const i = await menu(done.map((e, k) => ({ label: `${e.title}`, hint: e.place, value: k, desc: e.hui })), { title: '故事回顧', cls: 'shop', foot: '', start: done.length - 1 }); if (i == null) return;
  const e = STORY[i]; const keep = scene; scene = 'story'; const bg = stageBg; stageBg = e.map?.theme || 'heaven';
  await say([...lines(e.intro), ...lines(e.after)], sayOpt()); scene = keep; stageBg = bg;
}

// ---------------------------------------------------------------- title and ending
async function title() {
  scene = 'title'; stageBg = 'heaven'; music('title'); const saved = load();
  const t = el('div', 'titlebox', `<div class="tzh">西遊記</div><div class="ten">JOURNEY TO THE WEST</div><div class="tsub">八十一難</div>`); $('ui').appendChild(t);
  const c = await menu([{ label: '新的旅程', value: 'new' }, { label: '繼續', value: 'cont', off: !saved }], { cls: 'tmenu', noCancel: true, start: saved ? 1 : 0 });
  t.remove();
  if (c === 'new') { if (saved && !(await confirm('要開始新的旅程嗎？舊的紀錄會被覆蓋。'))) return title(); S = fresh(); }
  else S = saved;
  setSound(S.sound !== false);
  if (S.phase === 'end') return ending();
  for (;;) { try { await runStory(); return; } catch (err) { if (err !== RETRY) throw err; } }
}
async function ending() {
  scene = 'story'; stageBg = 'lotus'; music('heaven');
  await banner('<div class="ht">五聖成真</div><div class="hp">八十一難　圓滿</div>', 3200, 'chapter');
  const box = el('div', 'win panel endp', `<div class="ptitle">西遊記　完</div><div class="endfaces"></div><p>旃檀功德佛　唐三藏<br>鬥戰勝佛　孫悟空<br>淨壇使者　豬八戒<br>金身羅漢　沙悟淨<br>八部天龍　白龍馬</p><p class="small">歷時十四年，行程十萬八千里，取得真經三十五部、五千零四十八卷。<br>已歷 ${S.nan.length} 難。打了 ${S.battles} 場仗，走了 ${S.steps} 步。</p>`);
  for (const id of ['唐僧', '悟空', '八戒', '悟淨', '白龍']) { const f = faceOf(id); if (f) box.querySelector('.endfaces').appendChild(f); }
  $('ui').appendChild(box); await new Promise((res) => { const off = input.on((a) => { if (a === 'ok' || a === 'cancel') { off(); res(); } }); });
  box.remove(); location.reload();
}

// ---------------------------------------------------------------- the loop, the keys, the touch pad
function loop(now) {
  requestAnimationFrame(loop); draw(now);
  if (scene === 'map' && exploring && !busy && !P.moving && input.depth <= 1) {
    const h = input.held, d = h.has('up') ? [0, -1] : h.has('down') ? [0, 1] : h.has('left') ? [-1, 0] : h.has('right') ? [1, 0] : null;
    if (d) { busy = true; tryMove(...d).catch(onRetry).finally(() => { busy = false; }); }
  }
}
function onRetry(err) { if (err === RETRY) { busy = false; scene = 'story'; (async () => { for (;;) { try { await runStory(); return; } catch (e) { if (e !== RETRY) throw e; } } })(); return; } throw err; }
input.on((a) => {
  if (scene !== 'map' || !exploring || busy || P.moving) return;
  if (a === 'menu' || a === 'cancel') { busy = true; fieldMenu(false).finally(() => { busy = false; }); }
  if (a === 'ok') { busy = true; interact().catch(onRetry).finally(() => { busy = false; }); }
});
cv.addEventListener('pointerdown', (e) => { if (scene !== 'battle' || !battle) return; const r = cv.getBoundingClientRect(); battle.click((e.clientX - r.left) / r.width * LW, (e.clientY - r.top) / r.height * LH); });
for (const b of document.querySelectorAll('[data-k]')) { const k = b.dataset.k; const down = (e) => { e.preventDefault(); if (['up', 'down', 'left', 'right'].includes(k)) input.held.add(k); press(k); }; const up = () => input.held.delete(k); b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up); }
function fit() { const r = Math.min(innerWidth / LW, innerHeight / LH); cv.style.width = Math.floor(LW * r) + 'px'; cv.style.height = Math.floor(LH * r) + 'px'; document.documentElement.style.setProperty('--s', r.toFixed(3)); }
addEventListener('resize', fit); fit();
requestAnimationFrame(loop);
window.XY = { get S() { return S; }, walkers, get battle() { return battle; }, get scene() { return scene; }, get busy() { return busy; }, P, STORY, fight, give, join, save, get M() { return M; }, get exploring() { return exploring; }, reachEnd };
(async () => { try { cloud = await import('/save.js'); await cloud.pull(GAME, KEY); } catch (e) { cloud = null; } title(); })();
