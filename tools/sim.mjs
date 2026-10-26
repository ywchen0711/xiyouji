// A rough reckoning of every great fight: the party the story gives at that point, at the level the story expects, in
// the armour of the last town's shop, against each boss stage — how many rounds to win, and how much of the party's
// life the demon takes meanwhile. Prints a line per fight; flags the ones that look too hard or too easy.
import { STORY, MEMBERS, SKILLS, FOES, GEAR, SHOP } from '../js/data/game.js';
import { newUnit, stats, epLv, foeUnit, physical, magical, hitChance } from '../js/rules.js';
const R = () => 0.5; // average rolls, no luck
let party = [], tier = 1, flags = {};
const bestArmour = (id) => { const list = SHOP.slice(0, tier + 1).flat().filter((k) => GEAR[k]?.slot === 'body' && (!GEAR[k].who || GEAR[k].who.includes(id))); return list.sort((a, b) => GEAR[b].def - GEAR[a].def)[0] || null; };
let hard = 0;
for (const [i, e] of STORY.entries()) {
  if (e.party) party = [...e.party];
  if (e.town) tier = Math.max(tier, e.town.shop);
  if (e.give?.includes('金箍棒')) flags.金箍棒 = true;
  for (const st of e.boss || []) {
    const ids = [...(st.party || party), ...(e.guest || []), ...(st.guest || [])], lv = epLv(i);
    const us = ids.map((id) => { const u = newUnit(id, lv); u.eq.body = bestArmour(id); const s = stats(u, flags); return { id, ...s, lv, st: {}, side: 'ally', skills: u.skills }; });
    const k = Math.min(1.15, 0.5 + 0.17 * us.length);
    const foes = st.foes.map((id) => { const f = foeUnit(id, lv + 1); f.hp = f.max = Math.round(f.max * (f.boss ? k * (st.hpK || 1) : 0.7)); if (!f.boss) f.atk = Math.round(f.atk * 0.85); return f; }), n = us.length, outK = [1.3, 1.12, 1.04][n - 1] || 1, inK = [0.55, 0.78, 0.92][n - 1] || 1;
    const fHP = foes.reduce((s, f) => s + f.hp, 0), pHP = us.reduce((s, u) => s + u.hp, 0);
    // the party's damage a round: each strikes with their strongest single art they can afford (roughly)
    let dpr = 0; for (const u of us) { const best = Math.max(physical(u, foes[0], 1, R).n, ...u.skills.filter((s) => SKILLS[s].kind === 'atk' && SKILLS[s].to === 'one').map((s) => physical(u, foes[0], SKILLS[s].x, R).n), ...u.skills.filter((s) => SKILLS[s].kind === 'mag').map((s) => magical(u, foes[0], SKILLS[s].pw, R).n * (SKILLS[s].to === 'all' ? Math.min(foes.length, 2) : 1))); dpr += best * hitChance(u, foes[0]) * (u.id === '唐僧' ? 0.4 : 1); }
    const rounds = fHP / Math.max(1, dpr * outK);
    // the demons' damage a round on an average pilgrim
    const avg = us.reduce((s, u) => s + u.def, 0) / us.length, tgt = { def: avg, mag: 20, st: {}, side: 'ally' };
    // each demon: plain blows part of the time, its arts the rest (a party-wide art hits everyone)
    const tg2 = { def: avg, mag: us.reduce((s, u) => s + u.mag, 0) / us.length, st: {}, side: 'ally' };
    let fdr = 0; for (const f of foes) { const arts = (f.arts || []).map((k) => SKILLS[k]), pArt = arts.length ? (f.boss ? 0.55 : 0.3) : 0;
      const plain = physical(f, tgt, 1, R).n * 0.95;
      const art = arts.length ? arts.reduce((sum, T) => { const n = T.to === 'all' ? us.length : /^rand(\d)$/.test(T.to) ? +T.to.slice(4) : 1; if (T.kind === 'atk') return sum + physical(f, tgt, T.x, R).n * n; if (T.kind === 'mag') return sum + magical(f, tg2, T.pw, R).n * n; if (T.kind === 'heal' || T.kind === 'buff') return sum; return sum + plain * 0.5; }, 0) / arts.length : 0;
      fdr += plain * (1 - pArt) + art * pArt; }
    // the master's prayers: half his turns go to healing the whole party
    const tang = us.find((u) => u.id === '唐僧'), heal = tang ? (tang.skills.includes('t心經') ? (26 * (1 + lv * 0.06) + tang.mag * 2.4) * us.length : 22 * (1 + lv * 0.06) + tang.mag * 2.4) * 0.5 : 0;
    const taken = Math.max(0, fdr * inK - heal) * rounds / pHP;
    const flag = st.lose ? 'story' : taken > 1.6 ? 'HARD' : taken < 0.15 ? 'easy' : '';
    if (flag === 'HARD') hard++;
    console.log(`${e.id} ${e.title.padEnd(10, '　')} lv${String(lv).padStart(2)} ${st.foes.join('+').padEnd(16, '　')} party ${ids.length}  rounds ${rounds.toFixed(1).padStart(5)}  life lost ${(taken * 100).toFixed(0).padStart(4)}%  ${flag}`);
  }
  for (const id of e.join || []) if (!party.includes(id)) party.push(id);
  for (const id of e.leave || []) party = party.filter((x) => x !== id);
}
console.log(hard ? `${hard} fight(s) look too hard` : 'no fight looks too hard');
