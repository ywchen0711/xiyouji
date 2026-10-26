// The rules: how strong a pilgrim is at each level (and in what they wear), how strong a demon is for the stretch of
// road it haunts, how much a blow or a spell does, and how experience comes.
import { MEMBERS, SKILLS, FOES, GEAR, STORY } from './data/game.js';
import { CAST } from './data/cast.js';
import { clamp } from './util.js';

export const MAXLV = 99;
export const expNeed = (lv) => Math.round(10 + lv * 16 + lv * lv * 4.5 + Math.pow(lv, 3) * 0.07);
// the level the story expects of the party at each episode (and of its demons)
export const epLv = (i) => Math.min(95, Math.round(2 + i * 1.5 + Math.max(0, i - 30) * 0.25));

export function newUnit(id, lv = 1) {
  const u = { id, lv: 1, exp: 0, hp: 1, mp: 0, eq: { body: null, acc: null }, skills: [...(MEMBERS[id].start || [])], st: {} };
  setLevel(u, lv); const s = stats(u); u.hp = s.hp; u.mp = s.mp; return u;
}
export function setLevel(u, lv) { u.lv = clamp(Math.round(lv), 1, MAXLV); const L = MEMBERS[u.id].learns || {}; for (const [k, sk] of Object.entries(L)) if (u.lv >= +k && !u.skills.includes(sk)) u.skills.push(sk); }
// the weapon each pilgrim carries grows with them; the monkey's iron bar comes from the dragon's sea
function weapon(u, flags = {}) { const lv = u.lv; switch (u.id) { case '悟空': return flags.金箍棒 ? 22 + lv * 1.3 : 4 + lv * 0.6; case '八戒': return 16 + lv * 1.1; case '悟淨': return 15 + lv * 1.0; case '唐僧': return 4 + lv * 0.3; default: return 12 + lv * 1.1; } }
export function stats(u, flags = {}) {
  const M = MEMBERS[u.id], b = M.base, gr = M.grow, l = u.lv - 1;
  const s = { hp: b[0] + gr[0] * l, mp: b[1] + gr[1] * l, atk: b[2] + gr[2] * l + weapon(u, flags), def: b[3] + gr[3] * l, mag: b[4] + gr[4] * l, spd: b[5] + gr[5] * l, res: [], ward: [], hit: 0 };
  for (const slot of ['body', 'acc']) { const G = GEAR[u.eq?.[slot]]; if (!G) continue; for (const k of ['hp', 'mp', 'atk', 'def', 'mag', 'spd', 'hit']) if (G[k]) s[k] += G[k]; if (G.res) s.res.push(G.res); if (G.ward) s.ward.push(G.ward); }
  for (const k of ['hp', 'mp', 'atk', 'def', 'mag', 'spd']) s[k] = Math.round(s[k]);
  return s;
}
export function gainExp(u, n) { u.exp += n; let up = 0; while (u.lv < MAXLV && u.exp >= expNeed(u.lv)) { u.exp -= expNeed(u.lv); const before = [...u.skills]; setLevel(u, u.lv + 1); up++; u.newSkills = (u.newSkills || []).concat(u.skills.filter((x) => !before.includes(x))); } return up; }
export const canWear = (id, g) => !GEAR[g].who || GEAR[g].who.includes(id);

// ---------------------------------------------------------------- demons
const NORM = (lv) => ({ hp: 22 + lv * 9 + lv * lv * 0.13, atk: 11 + lv * 4.3, def: 5 + lv * 2.0, mag: 8 + lv * 3.3, spd: 7 + lv * 2.0 });
export function foeUnit(id, lv) {
  const F = FOES[id], C = CAST[id], n = NORM(lv), m = F.m, boss = !!F.boss;
  const hp = Math.round(n.hp * m[0] * (boss ? 1.15 : 1));
  return { id, name: C?.name || id, lv, boss, hp, max: hp, atk: Math.round(n.atk * m[1] * (boss ? 1.08 : 1)), def: Math.round(n.def * m[2]), mag: Math.round(n.mag * m[3]), spd: Math.round(n.spd * m[4]), arts: F.arts, weak: F.weak, res: F.res, st: {}, side: 'foe' };
}
// what a demon gives: a share of the level's need, less when the pilgrims are far above it
export function foeExp(f, plv) { const k = clamp(1 - (plv - f.lv) * 0.09, 0.15, 1.4) * (1 + 3 / f.lv); return Math.max(1, Math.round(expNeed(f.lv) * (f.boss ? 0.42 : 0.065) * k)); }
export const foeGold = (f) => Math.round((6 + f.lv * 3.2) * (f.boss ? 6 : 1));

// ---------------------------------------------------------------- blows and spells
// a: the actor (with atk def mag spd st), t: the target, x: the art's multiple
export function physical(a, t, x, R, o = {}) {
  let atk = a.atk * (a.st.rage ? 1.6 : 1), def = t.def * (t.st.guardup ? 1.5 : 1) * (t.st.taunt ? 2 : 1);
  const crit = R() < (a.st.focus ? 0.4 : 0.07) + (a.critUp || 0);
  if (crit) def *= 0.5;
  let d = atk * x * (0.88 + R() * 0.24) - def * 0.55; d = Math.max(d, atk * x * 0.08 + 1);
  if (crit) d *= 1.6;
  d *= elemK(o.el, t); if (t.guarding) d *= 0.5; if (t.st.barrier) d *= 0.6;
  return { n: Math.max(1, Math.round(d)), crit };
}
export function magical(a, t, pw, R, o = {}) {
  // a pilgrim's spell leans on their magic; a demon's on its art, and the pilgrims' spirit resists it
  const foe = a.side === 'foe', mdef = foe ? t.def * 0.4 + t.mag * 0.4 : t.def * 0.22 + t.mag * 0.3;
  let d = (pw * (1 + a.lv * (foe ? 0.03 : 0.05)) + a.mag * (foe ? 0.7 : 2.2)) * (0.9 + R() * 0.2) - mdef; d = Math.max(d, pw * 0.3 + 1);
  d *= elemK(o.el, t); if (t.guarding) d *= 0.6; if (t.st.barrier) d *= 0.6;
  return { n: Math.max(1, Math.round(d)), crit: false };
}
export function elemK(el, t) { if (!el) return 1; if (t.weak === el) return 1.5; if (t.res === el || (t.resList || []).includes(el)) return 0.5; return 1; }
export const healAmount = (a, pw) => Math.round((pw * (1 + a.lv * 0.06) + a.mag * 2.4) * 1.0);
export function hitChance(a, t) { if (a.st.focus) return 1; let p = 0.95 + (a.spd - t.spd) * 0.002; if (a.st.blind) p -= 0.45; if (t.st.evade) p -= 0.5; return clamp(p, 0.1, 0.99); }
export const SKILL = SKILLS;
