// The windows: dialogue with a painted portrait and words that appear as they are spoken, menus you move through
// with the arrows (or tap), notices, banners, and the input that drives them all — keys, mouse and the touch pad,
// read as up / down / left / right / ok / cancel / menu. Only the topmost listener hears a key.
import { portrait } from './portrait.js';
import { CAST } from './data/cast.js';
import { esc, wait } from './util.js';

export const $ = (id) => document.getElementById(id);
export const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
// ---------------------------------------------------------------- input
const listeners = [];
export const input = { held: new Set(), on(fn) { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; }, get depth() { return listeners.length; } };
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Enter: 'ok', KeyZ: 'ok', Space: 'ok', Escape: 'cancel', KeyX: 'cancel', Backspace: 'cancel', KeyM: 'menu', Tab: 'menu', KeyC: 'menu' };
export function press(a) { const top = listeners[listeners.length - 1]; if (top) top(a); }
addEventListener('keydown', (e) => { const a = KEYS[e.code]; if (!a) return; if (e.target.tagName === 'INPUT') return; e.preventDefault(); input.held.add(a); if (!e.repeat || ['up', 'down', 'left', 'right'].includes(a)) press(a); });
addEventListener('keyup', (e) => { const a = KEYS[e.code]; if (a) input.held.delete(a); });
addEventListener('blur', () => input.held.clear());
// ---------------------------------------------------------------- portraits as small canvases for the windows
export function faceOf(id) { const c = portrait(id); if (!c) return null; const img = el('canvas'); img.width = c.width; img.height = c.height; img.getContext('2d').drawImage(c, 0, 0); return img; }
// ---------------------------------------------------------------- dialogue
// lines: [[speaker, words]] ("-" the narrator); names: the pilgrims' names of the moment; faces: which portrait
export async function say(lines, opt = {}) {
  const box = el('div', 'win talk'), root = $('ui'); root.appendChild(box);
  try {
    for (const ln of lines) {
      let [who0, text] = ln; const face = opt.faces?.[who0] || who0, c = CAST[face] || CAST[who0], narr = who0 === '-';
      box.innerHTML = ''; box.classList.toggle('narr', narr);
      if (c) { const f = faceOf(face); if (f) { f.className = 'tface'; box.appendChild(f); } }
      const body = el('div', 'tbody'); if (!narr) { const nm = opt.names?.[who0] || c?.name || who0, ti = c?.title && c.title !== nm ? c.title : ''; body.appendChild(el('div', 'tname', `${esc(nm)}${ti ? `<small>${esc(ti)}</small>` : ''}`)); }
      const tx = el('div', 'ttext'); body.appendChild(tx); box.appendChild(body);
      const arrow = el('div', 'tmore', '▼'); box.appendChild(arrow);
      let shown = 0, full = false, skip = false; const chars = [...text];
      const done = new Promise((res) => {
        const off = input.on((a) => { if (a === 'menu') { skip = true; shown = chars.length; if (full) { off(); res(); } return; } if (a !== 'ok' && a !== 'cancel') return; if (!full) shown = chars.length; else { off(); box.onclick = null; res(); } });
        box.onclick = () => press('ok');
      });
      while (shown < chars.length) { shown = Math.min(chars.length, shown + (opt.fast ? 3 : 1)); tx.textContent = chars.slice(0, shown).join(''); await wait(opt.fast ? 8 : 26); }
      tx.textContent = text; full = true; arrow.classList.add('on');
      if (skip) press('ok');
      await done;
    }
  } finally { box.remove(); }
}
// "speaker|words" lines in a block of text → [[speaker, words]]
export const lines = (txt) => (txt || '').split('\n').map((s) => s.trim()).filter(Boolean).map((s) => { const i = s.indexOf('|'); return i < 0 ? ['-', s] : [s.slice(0, i), s.slice(i + 1)]; });
// ---------------------------------------------------------------- menus
// items: [{ label, hint?, off?, value? }] → the chosen value (or index), or null on cancel
export function menu(items, opt = {}) {
  return new Promise((res) => {
    const w = el('div', 'win menu ' + (opt.cls || '')); if (opt.title) w.appendChild(el('div', 'mtitle', esc(opt.title)));
    const list = el('div', 'mlist'); w.appendChild(list); const foot = opt.foot != null ? el('div', 'mfoot', opt.foot) : null; if (foot) w.appendChild(foot);
    let k = Math.max(0, Math.min(items.length - 1, opt.start || 0)); while (items[k] && items[k].off && k < items.length - 1) k++;
    const rows = items.map((it, i) => { const r = el('div', 'mrow' + (it.off ? ' off' : ''), `<span class="ml">${it.html || esc(it.label)}</span>${it.hint != null ? `<span class="mh">${it.htmlHint || esc(it.hint)}</span>` : ''}`); r.onclick = (e) => { e.stopPropagation(); if (it.off) return; k = i; draw(); finish(i); }; r.onmouseenter = () => { k = i; draw(); }; list.appendChild(r); return r; });
    const draw = () => { rows.forEach((r, i) => r.classList.toggle('on', i === k)); rows[k]?.scrollIntoView({ block: 'nearest' }); if (foot && items[k]?.desc != null) foot.textContent = items[k].desc; opt.onMove?.(items[k], k); };
    const finish = (i) => { off(); w.remove(); res(i == null ? null : items[i].value !== undefined ? items[i].value : i); };
    const off = input.on((a) => {
      if (a === 'up' || a === 'down') { const d = a === 'up' ? -1 : 1; for (let n = 0; n < items.length; n++) { k = (k + d + items.length) % items.length; if (!items[k].off) break; } draw(); }
      if (a === 'ok' && items[k] && !items[k].off) finish(k);
      if ((a === 'cancel' || a === 'menu') && !opt.noCancel) finish(null);
    });
    (opt.parent || $('ui')).appendChild(w); if (opt.place) opt.place(w); draw();
  });
}
export async function confirm(text, yes = '是', no = '否') { const r = await menu([{ label: yes, value: true }, { label: no, value: false }], { title: text, cls: 'small' }); return r === true; }
export function toast(text, ms = 2400) { const t = el('div', 'toast', esc(text)); $('ui').appendChild(t); setTimeout(() => t.remove(), ms); }
// a panel that stays until dismissed (status screens and the like)
export function panel(html, cls = '') { return new Promise((res) => { const w = el('div', 'win panel ' + cls, html); $('ui').appendChild(w); const off = input.on((a) => { if (a === 'cancel' || a === 'ok' || a === 'menu') { off(); w.remove(); res(); } else if (a === 'up' || a === 'down') w.scrollTop += a === 'up' ? -40 : 40; }); w.onclick = () => press('cancel'); }); }
export function banner(text, ms = 1500, cls = '') { const b = el('div', 'banner ' + cls, text); $('ui').appendChild(b); return wait(ms).then(() => b.remove()); }
