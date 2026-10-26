// A battle, in the manner of the old console games seen from the front: the demons stand painted on the field, the
// pilgrims' windows along the bottom. Each round every pilgrim is given an order (攻擊, 法術, 道具, 防禦, 總攻擊 to let
// them fight on their own, 逃跑); then all act, the quickest first. Arts strike one or all, with fire, water, wind and
// thunder; great demons have their treasures — gourds that swallow a name, fans that blow a man away, rings that take
// every weapon. Some fights the story means to be lost: at a set round the battle ends and the tale goes on.
import { SKILLS, ITEMS, MEMBERS, CHEST } from './data/game.js';
import { CAST } from './data/cast.js';
import { stats, foeUnit, foeExp, foeGold, physical, magical, healAmount, hitChance, gainExp } from './rules.js';
import { portrait } from './portrait.js';
import { backdrop } from './art.js';
import { menu, say, toast, el, $, input, faceOf, banner } from './ui.js';
import { sfx, music } from './sound.js';
import { rng, clamp, esc, wait } from './util.js';

const ST = { poison: '毒', burn: '灼', stun: '定', sleep: '睡', blind: '盲', seal: '封', capt: '收', evade: '變', focus: '眼', rage: '箍', guardup: '堅', taunt: '挑', cover: '護', barrier: '蟬' };
const BAD = ['poison', 'burn', 'stun', 'sleep', 'blind', 'seal'];
const ELC = { fire: '#ff7a30', water: '#4ab0ff', wind: '#c8f0c0', thunder: '#ffe860', earth: '#c8a060', holy: '#fff2b0', dark: '#a060ff', poison: '#7ad040' };

export class Battle {
  constructor(o) {
    this.o = o; this.S = o.S; this.R = rng((Date.now() ^ (o.seed || 7)) >>> 0); this.t0 = performance.now(); this.fx = []; this.pops = []; this.round = 0; this.auto = false; this.cursor = -1;
    const flags = this.S.flags;
    this.allies = o.party.map((id) => { const u = this.S.units[id] || o.guestUnits[id], s = stats(u, flags), name = this.S.names?.[id] || MEMBERS[id].name; return { side: 'ally', id, u, name, face: o.faceFor ? o.faceFor(id) : id, hp: Math.min(u.hp, s.hp), max: s.hp, mp: Math.min(u.mp, s.mp), mmax: s.mp, atk: s.atk, def: s.def, mag: s.mag, spd: s.spd, lv: u.lv, resList: s.res, ward: s.ward, st: {}, skills: u.skills.filter((k) => SKILLS[k]), guest: !!o.guestUnits[id] }; });
    if (this.S.items.定風丹) for (const a of this.allies) a.ward.push('wind');
    this.foes = o.foes.map((id) => foeUnit(id, o.lv + (CAST[id] && o.boss ? 1 : 0)));
    // a great demon met by few pilgrims is not quite so tough (the monkey alone in the first chapters)
    if (o.boss) { const k = Math.min(1.15, 0.5 + 0.17 * this.allies.length); for (const f of this.foes) { f.hp = f.max = Math.round(f.max * (f.boss ? k * (o.hpK || 1) : 0.7)); if (!f.boss) { f.atk = Math.round(f.atk * 0.85); f.mag = Math.round(f.mag * 0.85); } } }
    // few against many: the lone monkey (and pairs) strike harder and are struck less
    const n = this.allies.length; this.outK = [1.3, 1.12, 1.04][n - 1] || 1; this.inK = [0.55, 0.78, 0.92][n - 1] || 1;
    // two of a kind are told apart
    const seen = {}; for (const f of this.foes) { seen[f.name] = (seen[f.name] || 0) + 1; } const cnt = {}; for (const f of this.foes) if (seen[f.name] > 1) { cnt[f.name] = (cnt[f.name] || 0) + 1; f.name += '甲乙丙丁戊'[cnt[f.name] - 1]; }
    this.foes.forEach((f) => { f.art = portrait(f.id); f.flash = 0; f.shake = 0; f.alpha = 0; f.dead = 0; });
    this.layout(); this.bg = backdrop(o.theme || 'mount');
  }
  layout() {
    const live = this.foes, n = live.length, W = 384;
    let cw = this.o.boss && n <= 2 ? 96 : n <= 3 ? 74 : n <= 4 ? 66 : 58, gap = 8; const total = n * cw + (n - 1) * gap; if (total > 360) { cw = (360 - (n - 1) * gap) / n; }
    const big = (f) => (f.boss && this.o.boss ? 1 : 0.86);
    let x = (W - (n * cw + (n - 1) * gap)) / 2;
    for (const f of live) { const w = cw * big(f), h = w * 1.25; f.box = { x: x + (cw - w) / 2, y: 126 - h + (f.boss ? 4 : 0) + 6, w, h }; x += cw + gap; }
  }
  alive(side) { return (side === 'ally' ? this.allies : this.foes).filter((b) => b.hp > 0 && !b.st.capt); }
  // ---------------------------------------------------------------- drawing (the canvas: field, demons, effects)
  render(g, t) {
    const now = performance.now(), dt = (now - this.t0) / 1000;
    g.drawImage(this.bg, 0, 0, 384, 224);
    for (const [i, f] of this.foes.entries()) {
      if (f.dead > 1.2) continue; const b = f.box; f.alpha = Math.min(1, f.alpha + 0.06);
      const bob = Math.sin(dt * 1.6 + i) * 1.2, sx = f.shake > 0 ? Math.sin(now / 22) * f.shake : 0; f.shake = Math.max(0, f.shake - 0.4);
      g.save(); g.globalAlpha = f.alpha * (f.dead ? Math.max(0, 1 - f.dead) : 1);
      if (f.st.capt) g.globalAlpha *= 0.3;
      // a shadow on the ground, the painted bust in its frame, a glow for the great
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(b.x + b.w / 2 + sx, b.y + b.h + 3, b.w * 0.45, 3.5, 0, 0, 7); g.fill();
      if (f.boss && this.o.boss) { const gl = g.createRadialGradient(b.x + b.w / 2, b.y + b.h / 2, b.w * 0.3, b.x + b.w / 2, b.y + b.h / 2, b.w * 0.9); gl.addColorStop(0, 'rgba(255,60,40,0.18)'); gl.addColorStop(1, 'rgba(255,60,40,0)'); g.fillStyle = gl; g.fillRect(b.x - b.w * 0.4, b.y - b.h * 0.3, b.w * 1.8, b.h * 1.6); }
      g.imageSmoothingEnabled = true; g.drawImage(f.art, b.x + sx, b.y + bob - (f.lunge || 0), b.w, b.h); g.imageSmoothingEnabled = false;
      if (f.flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = f.flash; g.drawImage(f.art, b.x + sx, b.y + bob, b.w, b.h); g.globalCompositeOperation = 'source-over'; f.flash = Math.max(0, f.flash - 0.08); }
      g.restore();
      if (f.lunge) f.lunge = Math.max(0, f.lunge - 0.8);
      if (f.dead) f.dead += 0.03;
      // the name, the bar of life (and a cursor when choosing)
      if (!f.dead && f.hp > 0) {
        g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(b.x, b.y + b.h + 6, b.w, 3); g.fillStyle = f.hp / f.max > 0.5 ? '#e8c040' : f.hp / f.max > 0.2 ? '#e88030' : '#e83a30'; g.fillRect(b.x, b.y + b.h + 6, b.w * f.hp / f.max, 3);
        g.font = '700 6px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(f.name, b.x + b.w / 2 + 0.5, b.y + b.h + 15.5); g.fillStyle = f.boss ? '#ffd870' : '#f0ecd8'; g.fillText(f.name, b.x + b.w / 2, b.y + b.h + 15);
        const sts = Object.keys(f.st).filter((k) => f.st[k] > 0 && ST[k]); if (sts.length) { g.fillStyle = '#e8a0ff'; g.fillText(sts.map((k) => ST[k]).join(''), b.x + b.w / 2, b.y - 2); }
        if (this.cursor === i) { const cx = b.x + b.w / 2, cy = b.y - 6 + Math.sin(now / 120) * 2; g.fillStyle = '#ffe070'; g.beginPath(); g.moveTo(cx - 5, cy - 6); g.lineTo(cx + 5, cy - 6); g.lineTo(cx, cy); g.fill(); g.strokeStyle = 'rgba(255,224,112,0.8)'; g.lineWidth = 1; g.strokeRect(b.x - 1.5, b.y - 1.5, b.w + 3, b.h + 3); }
      }
    }
    this.drawFx(g, now);
  }
  drawFx(g, now) {
    this.fx = this.fx.filter((e) => now - e.t0 < e.dur);
    for (const e of this.fx) {
      const k = (now - e.t0) / e.dur, R = e.R; g.save();
      if (e.type === 'slash') { g.strokeStyle = `rgba(255,255,255,${1 - k})`; g.lineWidth = 2.2 * (1 - k) + 0.5; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const o = (i - 1) * 7; g.beginPath(); g.moveTo(e.x - 18 + o, e.y - 22 + o * 0.3); g.quadraticCurveTo(e.x + o, e.y - 2, e.x + 18 + o, e.y + 20 - o * 0.3); g.stroke(); } }
      if (e.type === 'hit') { g.fillStyle = `rgba(255,240,180,${1 - k})`; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + e.rot, r = 4 + k * 22; g.beginPath(); g.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 2 * (1 - k) + 0.4, 0, 7); g.fill(); } g.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.8})`; g.lineWidth = 1.5; g.beginPath(); g.arc(e.x, e.y, 6 + k * 18, 0, 7); g.stroke(); }
      if (e.type === 'fire') for (let i = 0; i < 26; i++) { const ph = (i * 0.137 + k) % 1, x = e.x + Math.sin(i * 7.1) * e.w * 0.5, y = e.y + 20 - ph * 50; g.fillStyle = `rgba(255,${140 + ph * 100 | 0},40,${(1 - ph) * (1 - k * 0.6)})`; g.beginPath(); g.arc(x + Math.sin(ph * 9 + i) * 4, y, 5 * (1 - ph) + 1, 0, 7); g.fill(); }
      if (e.type === 'water') { for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(120,200,255,${(1 - k) * 0.9})`; g.lineWidth = 2.5; g.beginPath(); const y = e.y + 16 - i * 10 - k * 8; for (let x = -e.w / 2; x <= e.w / 2; x += 4) g.lineTo(e.x + x, y + Math.sin(x * 0.3 + k * 12 + i) * 3); g.stroke(); } for (let i = 0; i < 14; i++) { const a = R[i] * 6.28, r = k * 30; g.fillStyle = `rgba(200,235,255,${1 - k})`; g.beginPath(); g.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.6 - k * 10, 1.6, 0, 7); g.fill(); } }
      if (e.type === 'wind') { g.strokeStyle = `rgba(220,255,220,${(1 - k) * 0.8})`; g.lineWidth = 1.4; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(e.x + (i - 3) * 6, e.y, 6 + i * 4 + k * 10, k * 8 + i, k * 8 + i + 3.5); g.stroke(); } }
      if (e.type === 'thunder') { g.strokeStyle = `rgba(255,250,180,${1 - k})`; g.lineWidth = 2.5; g.beginPath(); let x = e.x + (R[0] - 0.5) * 10, y = 0; g.moveTo(x, y); while (y < e.y + 10) { y += 8; x += (R[(y | 0) % 14] - 0.5) * 16; g.lineTo(x, y); } g.stroke(); g.fillStyle = `rgba(255,255,220,${(1 - k) * 0.35})`; g.fillRect(0, 0, 384, 224); }
      if (e.type === 'holy') { g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(e.x, e.y, 2, e.x, e.y, 46); gl.addColorStop(0, `rgba(255,240,180,${1 - k})`); gl.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gl; g.beginPath(); g.arc(e.x, e.y, 46, 0, 7); g.fill(); g.strokeStyle = `rgba(255,250,210,${(1 - k) * 0.7})`; g.lineWidth = 1.2; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28 + k; g.beginPath(); g.moveTo(e.x + Math.cos(a) * 8, e.y + Math.sin(a) * 8); g.lineTo(e.x + Math.cos(a) * (30 + k * 20), e.y + Math.sin(a) * (30 + k * 20)); g.stroke(); } }
      if (e.type === 'dark') { for (let i = 0; i < 16; i++) { const a = R[i] * 6.28, r = 6 + k * 26 * R[i + 1]; g.fillStyle = `rgba(120,60,200,${(1 - k) * 0.5})`; g.beginPath(); g.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 7 * (1 - k) + 2, 0, 7); g.fill(); } }
      if (e.type === 'earth') for (let i = 0; i < 9; i++) { const x = e.x + (R[i] - 0.5) * e.w, y = -10 + k * (e.y + 30) * (0.8 + R[i + 3] * 0.4); g.fillStyle = `rgba(160,130,90,${1 - k * 0.5})`; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 3, y - 3); g.lineTo(x + 5, y + 3); g.lineTo(x - 2, y + 5); g.fill(); }
      if (e.type === 'heal' || e.type === 'poison') for (let i = 0; i < 12; i++) { const ph = (i * 0.083 + k) % 1; g.fillStyle = e.type === 'heal' ? `rgba(160,255,160,${1 - ph})` : `rgba(140,220,60,${1 - ph})`; g.beginPath(); g.arc(e.x + (R[i] - 0.5) * 30, e.y + 10 - ph * 30, 2, 0, 7); g.fill(); }
      g.restore();
    }
    this.pops = this.pops.filter((p) => now - p.t0 < 900);
    g.font = '900 9px "Noto Sans TC", sans-serif'; g.textAlign = 'center';
    for (const p of this.pops) { const k = (now - p.t0) / 900, y = p.y - Math.min(1, k * 4) * 10 + Math.max(0, k - 0.25) * 2; g.globalAlpha = 1 - Math.max(0, k - 0.7) / 0.3; g.lineWidth = 2.5; g.strokeStyle = '#000'; g.strokeText(p.text, p.x, y); g.fillStyle = p.col; g.fillText(p.text, p.x, y); g.globalAlpha = 1; }
  }
  effect(type, x, y, w = 40, dur = 520) { this.fx.push({ type, x, y, w, t0: performance.now(), dur, R: Array.from({ length: 20 }, () => this.R()), rot: this.R() * 6 }); }
  pop(b, text, col) { if (b.side === 'foe') { this.pops.push({ x: b.box.x + b.box.w / 2, y: b.box.y + b.box.h * 0.45, text, col, t0: performance.now() }); return; } const p = this.panelOf(b); if (!p) return; const n = el('div', 'bpop', esc(text)); n.style.color = col; p.appendChild(n); setTimeout(() => n.remove(), 900); }
  // ---------------------------------------------------------------- the pilgrims' windows (DOM)
  hud() {
    let h = $('bhud'); if (!h) { h = el('div', ''); h.id = 'bhud'; $('ui').appendChild(h); this.faces = {}; }
    if (h.children.length !== this.allies.length) { h.innerHTML = ''; for (const a of this.allies) { const p = el('div', 'win bpan'); p.dataset.id = a.id; const f = faceOf(a.face); if (f) { f.className = 'bface'; p.appendChild(f); } p.appendChild(el('div', 'binfo')); h.appendChild(p); } }
    for (const a of this.allies) { const p = this.panelOf(a); if (!p) continue; const sts = Object.keys(a.st).filter((k) => a.st[k] > 0 && ST[k]); p.classList.toggle('down', a.hp <= 0); p.classList.toggle('capt', !!a.st.capt); p.classList.toggle('mk', !!a.marked);
      p.querySelector('.binfo').innerHTML = `<div class="bn"><b>${esc(a.name)}</b><small>Lv${a.lv}</small>${sts.map((k) => `<u class="${BAD.includes(k) || k === 'capt' ? 'bad' : ''}">${ST[k]}</u>`).join('')}</div><div class="bbar hp"><i style="width:${clamp(a.hp / a.max, 0, 1) * 100}%"></i></div><div class="bnum">${a.hp}<small>/${a.max}</small></div><div class="bbar mp"><i style="width:${a.mmax ? clamp(a.mp / a.mmax, 0, 1) * 100 : 0}%"></i></div><div class="bnum mp">${a.mp}<small>/${a.mmax}</small></div>`; }
    const ab = $('bauto'); if (this.auto && !ab) { const b = el('div', 'bautotag', '總攻擊中　按任意鍵停止'); b.id = 'bauto'; $('ui').appendChild(b); } else if (!this.auto && ab) ab.remove();
  }
  panelOf(a) { return document.querySelector(`#bhud .bpan[data-id="${a.id}"]`); }
  hurtPanel(a, col) { const p = this.panelOf(a); if (!p) return; p.classList.remove('hurt'); void p.offsetWidth; p.classList.add('hurt'); if (col) { p.style.setProperty('--fl', col); p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash'); } }
  // ---------------------------------------------------------------- the fight
  async run() {
    this.hud(); music(this.o.boss ? 'boss' : 'battle'); sfx('battle');
    if (this.o.boss) await banner(esc(this.foes.map((f) => f.name).filter((v, i, a) => a.indexOf(v) === i).join('・')), 1300, 'boss');
    else toast(this.foes.length > 1 ? `${this.foes[0].name}等妖怪出現了！` : `${this.foes[0].name}出現了！`, 1500);
    for (this.round = 1; this.round < 200; this.round++) {
      if (this.o.scripted && this.round === this.o.scripted.round) { this.setAuto(false); await wait(300); this.effect('holy', 192, 80, 300, 900); sfx('thunder'); await say([['-', this.o.scripted.text]]); for (const a of this.allies) a.st.capt = 9; this.hud(); await wait(400); return this.finish('story'); }
      const orders = [];
      const able = this.allies.filter((b) => b.hp > 0 && !b.st.capt && !b.st.stun && !b.st.sleep);
      for (let i = 0; i < able.length; i++) {
        const b = able[i];
        if (this.auto) { orders.push(this.autoOrder(b)); continue; }
        b.marked = true; this.hud(); const ord = await this.orderFor(b, i === 0); b.marked = false; this.hud();
        if (ord === 'back') { if (i > 0) { orders.pop(); i -= 2; } else i--; continue; }
        if (ord.kind === 'flee') { const r = await this.tryFlee(false); if (r) return this.finish('fled'); orders.length = 0; i = able.length; break; }
        if (ord.kind === 'auto') { this.setAuto(true); i--; continue; }
        orders.push(ord);
      }
      for (const f of this.alive('foe')) if (!f.st.stun && !f.st.sleep) orders.push(this.foeOrder(f));
      orders.sort((a, b) => b.b.spd * (0.85 + this.R() * 0.3) - a.b.spd * (0.85 + this.R() * 0.3));
      for (const o of orders) {
        if (o.b.hp <= 0 || o.b.st.capt) continue;
        const r = await this.act(o); this.hud(); if (r === 'fled') return this.finish('fled');
        const e = this.over(); if (e) { this.setAuto(false); return this.finish(e); }
      }
      // the turn's end: poison and fire hurt, spells wear off, the captured come back
      for (const b of [...this.allies, ...this.foes]) {
        b.guarding = false; if (b.hp <= 0) continue;
        for (const [k, dmgK, col] of [['poison', 0.06, '#7ad040'], ['burn', 0.08, '#ff7a30']]) if (b.st[k] > 0) { const n = Math.max(1, Math.round(b.max * dmgK)); b.hp = Math.max(b.side === 'foe' ? 0 : 1, b.hp - n); this.pop(b, n, col); }
        for (const k of Object.keys(b.st)) if (b.st[k] > 0) { b.st[k]--; if (k === 'capt' && b.st[k] === 0) { this.pop(b, '脫身！', '#fff'); } }
        if (b.side === 'foe' && b.hp <= 0 && !b.dead) { b.dead = 0.01; }
      }
      this.hud(); const e = this.over(); if (e) { this.setAuto(false); return this.finish(e); }
      await wait(150);
    }
    return this.finish('lose');
  }
  over() { if (!this.foes.some((f) => f.hp > 0)) return 'win'; if (!this.alive('ally').length && !this.allies.some((a) => a.hp > 0 && a.st.capt)) return 'lose'; if (!this.allies.some((a) => a.hp > 0)) return 'lose'; return null; }
  setAuto(on) { if (on === !!this.auto) return; this.auto = on; if (on) { this._off = input.on(() => { this.setAuto(false); toast('總攻擊停止，下回合起重新下令'); }); } else if (this._off) { this._off(); this._off = null; } this.hud(); }
  async orderFor(b, first) {
    const S = this.S, sk = b.skills.filter((k) => k !== 'm棒' || true), items = Object.entries(S.items).filter(([id, n]) => n > 0 && ITEMS[id] && ITEMS[id].kind !== 'key');
    const place = (w) => { w.style.left = 'calc(var(--s) * 8px)'; w.style.top = 'calc(var(--s) * 58px)'; };
    for (;;) {
      const c = await menu([{ label: '攻擊', value: 'atk' }, { label: '法術', value: 'skill', off: !sk.length || b.st.seal, hint: b.st.seal ? '封' : '' }, { label: '道具', value: 'item', off: !items.length }, { label: '防禦', value: 'guard' }, { label: '總攻擊', value: 'auto', hint: '自動' }, ...(first ? [{ label: this.o.boss ? '逃跑（不可）' : '逃跑', value: 'flee', off: !!this.o.boss }] : [])], { title: b.name, cls: 'bcmd', place, noCancel: first && !b.prev });
      if (c == null) return 'back';
      if (c === 'guard') return { b, kind: 'guard' };
      if (c === 'auto' || c === 'flee') return { b, kind: c };
      if (c === 'atk') { const t = await this.pickFoe(); if (t) return { b, kind: 'attack', target: t }; continue; }
      if (c === 'skill') {
        const id = await menu(sk.map((k) => ({ label: SKILLS[k].name, hint: String(SKILLS[k].mp || 0), value: k, off: (SKILLS[k].mp || 0) > b.mp || (k === 't緊箍' && !this.allies.some((a) => a.id === '悟空' && a.hp > 0)), desc: SKILLS[k].desc })), { title: `法術（法力 ${b.mp}）`, cls: 'bcmd wide', place, foot: '' });
        if (!id) continue; const T = SKILLS[id];
        if (T.to === 'one') { const t = await this.pickFoe(); if (!t) continue; return { b, kind: 'skill', sk: id, target: t }; }
        if (T.to === 'ally' || T.to === 'dead') { const t = await this.pickAlly(T.to === 'dead'); if (!t) continue; return { b, kind: 'skill', sk: id, target: t }; }
        return { b, kind: 'skill', sk: id };
      }
      if (c === 'item') {
        const id = await menu(items.map(([id, n]) => ({ label: ITEMS[id].name, hint: '×' + n, value: id, desc: ITEMS[id].desc })), { title: '道具', cls: 'bcmd wide', place, foot: '' }); if (!id) continue;
        const I = ITEMS[id]; if (I.kind === 'healAll') return { b, kind: 'item', item: id };
        const t = await this.pickAlly(I.kind === 'revive'); if (!t) continue; return { b, kind: 'item', item: id, target: t };
      }
    }
  }
  pickFoe() {
    const list = this.foes.map((f, i) => [f, i]).filter(([f]) => f.hp > 0 && !f.st.capt); if (list.length === 1) return Promise.resolve(list[0][0]);
    return new Promise((res) => { let k = 0; this.cursor = list[0][1]; const off = input.on((a) => { if (a === 'left' || a === 'up') k = (k + list.length - 1) % list.length; if (a === 'right' || a === 'down') k = (k + 1) % list.length; this.cursor = list[k][1]; if (a === 'ok') { done(list[k][0]); } if (a === 'cancel') done(null); }); const done = (v) => { off(); this.cursor = -1; this.pickAt = null; res(v); }; this.pickAt = (x, y) => { for (const [f] of list) { const b = f.box; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h + 16) return done(f); } }; });
  }
  async pickAlly(dead) { const list = this.allies.filter((a) => (dead ? a.hp <= 0 : a.hp > 0) && !a.st.capt); if (!list.length) return null; return menu(list.map((a) => ({ label: a.name, hint: `${a.hp}/${a.max}`, value: a })), { title: dead ? '救誰？' : '給誰？', cls: 'bcmd', place: (w) => { w.style.left = 'calc(var(--s) * 100px)'; w.style.top = 'calc(var(--s) * 58px)'; } }); }
  click(x, y) { if (this.pickAt) this.pickAt(x, y); }
  // the pilgrims fighting on their own: the master heals, the rest strike the weakest (or all, when there are many)
  autoOrder(b) {
    const foes = this.alive('foe'), weakest = foes.sort((x, y) => x.hp - y.hp)[0], has = (k) => b.skills.includes(k) && (SKILLS[k].mp || 0) <= b.mp && !b.st.seal;
    const hurt = this.alive('ally').filter((a) => a.hp / a.max < 0.45).sort((x, y) => x.hp / x.max - y.hp / y.max), down = this.allies.filter((a) => a.hp <= 0);
    if (down.length && has('t往生')) return { b, kind: 'skill', sk: 't往生', target: down[0] };
    if (hurt.length >= 2 && has('t大悲')) return { b, kind: 'skill', sk: 't大悲' };
    if (hurt.length >= 2 && has('t心經')) return { b, kind: 'skill', sk: 't心經' };
    if (hurt.length && has('t念佛')) return { b, kind: 'skill', sk: 't念佛', target: hurt[0] };
    if (b.id === '唐僧') { if (foes.length >= 2 && has('t真言')) return { b, kind: 'skill', sk: 't真言' }; if (foes.length >= 2 && has('t白龍')) return { b, kind: 'skill', sk: 't白龍' }; }
    if (foes.length >= 3) for (const k of ['m擎天', 'm分身', 'b水軍', 'b亂築', 's骷髏', 's流沙', 'g火輪']) if (has(k)) return { b, kind: 'skill', sk: k };
    return { b, kind: 'attack', target: weakest };
  }
  foeOrder(f) {
    const R = this.R, arts = f.arts || [], allies = this.alive('ally');
    let art = null; if (arts.length && R() < (f.boss ? 0.55 : 0.3)) { art = R.pick(arts); if (SKILLS[art]?.kind === 'heal' && f.hp > f.max * 0.5) art = null; }
    let target = null; const taunt = allies.find((a) => a.st.taunt); if (taunt && R() < 0.7) target = taunt;
    return { b: f, kind: art ? 'skill' : 'attack', sk: art, target: target || R.pick(allies) };
  }
  async tryFlee(sure) { if (this.o.boss) { toast('逃不掉！'); return false; } if (sure || this.R() < 0.6) { sfx('flee'); await banner('逃走了！', 700); return true; } toast('逃跑失敗！'); await wait(400); return false; }
  // ---------------------------------------------------------------- one action
  async act(o) {
    const b = o.b, R = this.R;
    if (o.kind === 'guard') { b.guarding = true; this.pop(b, '防禦', '#a8c8ff'); await wait(180); return; }
    if (b.side === 'ally') { b.marked = true; this.hud(); }
    try {
      if (o.kind === 'attack') { const t = this.retarget(b, o.target); if (!t) return; await this.strike(b, t, b.side === 'ally' ? 1.0 : 1.0, null, b.side === 'ally' ? `${b.name}攻擊！` : null); return; }
      if (o.kind === 'item') {
        const I = ITEMS[o.item]; if (!this.S.items[o.item]) return; this.S.items[o.item]--; this.banner(`${b.name}：${I.name}`); await wait(300);
        const ts = I.kind === 'healAll' ? this.alive('ally') : [o.target]; for (const t of ts) { if (!t) continue; if (I.kind === 'revive') { if (t.hp > 0) continue; t.hp = Math.max(1, Math.round(t.max * I.pct)); this.pop(t, '復活', '#ffe070'); sfx('revive'); } else if (I.kind === 'mp') { t.mp = Math.min(t.mmax, t.mp + I.pw); this.pop(t, '+' + I.pw, '#80c0ff'); } else if (I.kind === 'cure') { for (const k of BAD) t.st[k] = 0; this.pop(t, '解除', '#c0ffc0'); } else if (t.hp > 0) { const n = Math.min(t.max - t.hp, I.pw); t.hp += n; this.pop(t, '+' + n, '#80ff90'); } this.hurtPanel(t, '#80ff90'); } sfx('heal'); await wait(350); return; }
      if (o.kind === 'skill') return await this.cast(b, o.sk, o.target);
    } finally { if (b.side === 'ally') { b.marked = false; this.hud(); } }
  }
  retarget(b, t) { const pool = b.side === 'ally' ? this.alive('foe') : this.alive('ally'); if (t && t.hp > 0 && !t.st.capt) return t; return pool.length ? this.R.pick(pool) : null; }
  coverFor(t) { if (t.side !== 'ally') return t; const sha = this.allies.find((a) => a.st.cover && a.hp > 0 && !a.st.capt && a !== t); if (!sha) return t; const lowest = this.alive('ally').sort((x, y) => x.hp / x.max - y.hp / y.max)[0]; return lowest === t ? sha : t; }
  banner(text) { let w = $('bbanner'); if (!w) { w = el('div', 'win'); w.id = 'bbanner'; $('ui').appendChild(w); } w.textContent = text; w.hidden = false; clearTimeout(this._bt); this._bt = setTimeout(() => { w.hidden = true; }, 1100); }
  // a blow: the swing, the hit or the miss, the number
  async strike(a, t0, x, el2, label) {
    const R = this.R; let t = this.coverFor(t0); if (t !== t0) this.pop(t, '護！', '#a8c8ff');
    if (a.side === 'foe') { a.lunge = 8; sfx('swing'); } else { const p = this.panelOf(a); p?.classList.add('lunge'); setTimeout(() => p?.classList.remove('lunge'), 260); sfx('swing'); }
    if (label) this.banner(label);
    await wait(170);
    if (R() > hitChance(a, t)) { this.pop(t, '閃避', '#a8c8ff'); sfx('miss'); await wait(260); return 0; }
    const d = physical(a, t, x, R, { el: el2 }); d.n = Math.max(1, Math.round(d.n * (a.side === 'ally' ? this.outK : this.inK))); this.damage(t, d.n, d.crit, el2);
    if (t.side === 'foe') this.effect(d.crit ? 'hit' : 'slash', t.box.x + t.box.w / 2, t.box.y + t.box.h * 0.45);
    await wait(d.crit ? 380 : 260); return d.n;
  }
  damage(t, n, crit, elx) {
    t.hp = Math.max(0, t.hp - n); if (t.st.sleep) t.st.sleep = 0;
    this.pop(t, (crit ? '會心 ' : '') + n, crit ? '#ffd040' : t.side === 'ally' ? '#ff9a80' : '#ffffff');
    sfx(crit ? 'crit' : 'hit');
    if (t.side === 'foe') { t.flash = 0.9; t.shake = crit ? 5 : 3; if (t.hp <= 0) { t.dead = 0.01; sfx('down'); } }
    else { this.hurtPanel(t, elx ? ELC[elx] : '#ff5a40'); if (t.hp <= 0) { for (const k of Object.keys(t.st)) t.st[k] = 0; this.pop(t, '倒下', '#ff6a50'); } }
  }
  status(t, st, n, p) {
    if (!st || t.hp <= 0) return; if (t.ward?.includes(st) || (st === 'capt' && t.ward?.includes('wind') && this._wind)) { this.pop(t, '無效', '#c8c8c8'); return; }
    let chance = p ?? 1; if (t.boss && ['stun', 'sleep', 'capt', 'seal'].includes(st)) chance *= 0.35;
    if (this.R() >= chance) { if (p != null && p < 1) this.pop(t, '抵抗', '#c8c8c8'); return; }
    t.st[st] = Math.max(t.st[st] || 0, n || 2); this.pop(t, ST[st] ? `${ST[st]}！` : st, BAD.includes(st) || st === 'capt' ? '#e8a0ff' : '#a8ffe0');
  }
  async cast(b, id, target) {
    const T = SKILLS[id], R = this.R; if (!T) return;
    if (b.side === 'ally') { if ((T.mp || 0) > b.mp) { toast('法力不足！'); return; } b.mp -= T.mp || 0; }
    this.banner(`${b.name}：${T.name}`); if (T.say && b.side === 'foe') this.banner(`${b.name}：${T.name}　${T.say}`);
    const enemy = b.side === 'ally' ? 'foe' : 'ally', friends = b.side;
    if (b.side === 'foe') { b.lunge = 6; b.flash = 0.4; }
    await wait(260);
    const pickTargets = () => { const pool = this.alive(enemy); if (T.to === 'all') return pool; if (/^rand(\d)$/.test(T.to)) { const n = +T.to.slice(4); return Array.from({ length: n }, () => R.pick(pool)).filter(Boolean); } return [this.retarget(b, target)].filter(Boolean); };
    if (T.kind === 'atk') { const ts = pickTargets(); this._wind = T.el === 'wind'; for (const t of ts) { if (!this.alive(enemy).includes(t) && t.side === 'foe' && t.hp <= 0) continue; const n = await this.strike(b, t, T.x, T.el); if (n && T.drain) { const h = Math.round(n * T.drain); b.hp = Math.min(b.max, b.hp + h); this.pop(b, '+' + h, '#80ff90'); } if (n && T.st) this.status(t, T.st, T.n, T.p); if (this.over()) break; } return; }
    if (T.kind === 'mag') {
      const ts = pickTargets(); sfx(T.el === 'fire' ? 'fire' : T.el === 'water' ? 'water' : T.el === 'thunder' ? 'thunder' : T.el === 'holy' ? 'holy' : 'magic');
      if (enemy === 'foe') for (const t of ts) this.effect(T.el === 'earth' ? 'earth' : T.el || 'holy', t.box.x + t.box.w / 2, t.box.y + t.box.h * 0.5, t.box.w, 700); else document.getElementById('bhud')?.style.setProperty('--fl', ELC[T.el] || '#fff');
      await wait(380);
      for (const t of ts) { const d = magical(b, t, T.pw, R, { el: T.el }); d.n = Math.max(1, Math.round(d.n * (b.side === 'ally' ? this.outK : this.inK))); this.damage(t, d.n, false, T.el); if (T.st) this.status(t, T.st, T.n, T.p); }
      await wait(420); return;
    }
    if (T.kind === 'heal') {
      const ts = T.to === 'self' ? [b] : T.to === 'allies' ? this.alive(friends) : [target && target.hp > 0 ? target : b];
      for (const t of ts) { const n = Math.min(t.max - t.hp, T.pct ? Math.round(t.max * T.pct) : healAmount(b, T.pw)); t.hp += n; this.pop(t, '+' + n, '#80ff90'); if (T.cure) for (const k of BAD) t.st[k] = 0; if (t.side === 'foe') this.effect('heal', t.box.x + t.box.w / 2, t.box.y + t.box.h / 2); else this.hurtPanel(t, '#80ff90'); }
      sfx('heal'); await wait(420); return;
    }
    if (T.kind === 'revive') { const t = target; if (t && t.hp <= 0) { t.hp = Math.round(t.max * T.pct); this.pop(t, '復活', '#ffe070'); this.hurtPanel(t, '#ffe070'); sfx('revive'); } await wait(420); return; }
    if (T.kind === 'cure') { for (const t of this.alive(friends)) { for (const k of BAD) t.st[k] = 0; const n = Math.min(t.max - t.hp, healAmount(b, T.pw)); t.hp += n; this.pop(t, '解除', '#c0ffc0'); this.hurtPanel(t, '#c0ffc0'); } sfx('heal'); await wait(380); return; }
    if (T.kind === 'buff') {
      const ts = T.to === 'self' ? [b] : T.to === 'allies' ? this.alive(friends) : T.to === 'monkey' ? this.allies.filter((a) => a.id === '悟空' && a.hp > 0) : [b];
      for (const t of ts) { t.st[T.st] = T.n; this.pop(t, ST[T.st] + '！', '#a8ffe0'); if (t.side === 'ally') this.hurtPanel(t, '#a8ffe0'); if (T.to === 'monkey') { const n = Math.round(t.max * 0.08); t.hp = Math.max(1, t.hp - n); this.pop(t, '頭疼！', '#ff9a80'); } }
      sfx('buff'); await wait(380); return;
    }
    if (T.kind === 'debuff') { const ts = pickTargets(); for (const t of ts) { if (t.side === 'foe') this.effect('dark', t.box.x + t.box.w / 2, t.box.y + t.box.h / 2); else this.hurtPanel(t, '#c080ff'); this.status(t, T.st, T.n, T.p); } sfx('magic'); await wait(420); return; }
    if (T.kind === 'capture') {
      const ts = T.to === 'all' ? this.alive(enemy) : pickTargets(); this._wind = T.el === 'wind';
      for (const t of ts) { if (t.side === 'ally' && t.ward.includes('wind') && T.el === 'wind') { this.pop(t, '定風丹！', '#ffe070'); continue; } this.hurtPanel(t, '#e8a0ff'); this.status(t, 'capt', T.n, T.p); }
      sfx('magic'); await wait(500); return;
    }
    if (T.kind === 'escape') { if (await this.tryFlee(true)) return 'fled'; return; }
  }
  // ---------------------------------------------------------------- the end
  async finish(end) {
    const S = this.S, res = { end, exp: 0, gold: 0, drops: [] };
    for (const a of this.allies) { a.u.hp = Math.max(end === 'lose' ? 0 : 1, a.hp); a.u.mp = a.mp; if (end !== 'lose' && a.hp <= 0) a.u.hp = 1; }
    const h = $('bhud'); if (h) h.remove(); $('bbanner')?.remove(); $('bauto')?.remove();
    if (end !== 'win') return res;
    sfx('win'); music(null);
    const plv = Math.round(this.allies.reduce((s, a) => s + a.lv, 0) / this.allies.length);
    for (const f of this.foes) { res.exp += foeExp(f, plv); res.gold += foeGold(f); }
    // spoils: now and then something from the demons' den
    const tier = Math.min(3, Math.floor(this.o.lv / 22)); for (const f of this.foes) if (this.R() < (f.boss ? 0.6 : 0.14)) { const it = this.R.pick(CHEST[tier].filter((x) => x !== 'gold')); res.drops.push(it); S.items[it] = (S.items[it] || 0) + 1; }
    S.gold += res.gold;
    const ups = [];
    for (const a of this.allies) { if (a.guest) continue; const n = gainExp(a.u, res.exp); if (n) { const s = stats(a.u, S.flags); a.u.hp = Math.min(s.hp, a.u.hp + Math.round(s.hp * 0.2)); ups.push(`${a.name}升到了第 ${a.u.lv} 級！`); for (const k of a.u.newSkills || []) ups.push(`${a.name}學會了「${SKILLS[k].name}」！`); a.u.newSkills = []; } }
    await say([['-', `打敗了妖怪！得到經驗 ${res.exp}、銀兩 ${res.gold}。${res.drops.length ? `得到了：${res.drops.map((d) => ITEMS[d].name).join('、')}。` : ''}`], ...ups.map((u) => ['-', u])], { fast: true });
    return res;
  }
}
