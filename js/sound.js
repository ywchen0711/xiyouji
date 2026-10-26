// Sound made with the Web Audio API (nothing to download): pentatonic tunes in the Chinese manner over a drone — the
// road, the towns, the caves, heaven, battles and the great demons — a temple gong for each chapter, and short effects.
// Off until the first key or tap, as browsers require.
let A = null, on = true, cur = null, timer = null, master = null;
const ctx = () => { if (!A) { try { A = new (window.AudioContext || window.webkitAudioContext)(); master = A.createGain(); master.gain.value = 0.17; master.connect(A.destination); } catch (e) { A = null; } } if (A && A.state === 'suspended') A.resume(); return A; };
addEventListener('keydown', () => ctx(), { once: true }); addEventListener('pointerdown', () => ctx(), { once: true });
function tone(f, t0, dur, type = 'square', vol = 0.5, slide) { const a = ctx(); if (!a || !on) return; const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02); }
function noise(t0, dur, vol = 0.4, hp = 0) { const a = ctx(); if (!a || !on) return; const b = a.createBuffer(1, Math.max(1, a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = vol; let n = s; if (hp) { const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; s.connect(f); n = f; } n.connect(g); g.connect(master); s.start(t0); }
// a gong: low partials, slowly fading
function gong(t) { for (const [f, v] of [[98, 0.5], [147, 0.3], [196, 0.22], [261, 0.12], [329, 0.08]]) tone(f, t, 2.6, 'sine', v, f * 0.97); noise(t, 0.08, 0.3); }
export function sfx(name) {
  const a = ctx(); if (!a || !on) return; const t = a.currentTime;
  if (name === 'ok') tone(880, t, 0.06, 'square', 0.2);
  else if (name === 'swing') noise(t, 0.09, 0.25, 1800);
  else if (name === 'hit') { noise(t, 0.12, 0.5); tone(150, t, 0.12, 'square', 0.3, 60); }
  else if (name === 'crit') { noise(t, 0.22, 0.7); tone(320, t, 0.22, 'sawtooth', 0.35, 70); }
  else if (name === 'miss') tone(600, t, 0.12, 'triangle', 0.25, 900);
  else if (name === 'down') { tone(220, t, 0.5, 'triangle', 0.35, 55); noise(t + 0.05, 0.3, 0.3); }
  else if (name === 'fire') { noise(t, 0.6, 0.5); tone(180, t, 0.5, 'sawtooth', 0.18, 520); }
  else if (name === 'water') { for (let i = 0; i < 6; i++) tone(300 + i * 70, t + i * 0.045, 0.16, 'triangle', 0.22); noise(t, 0.4, 0.2, 800); }
  else if (name === 'thunder') { noise(t, 0.8, 0.9); tone(70, t, 0.7, 'square', 0.35, 35); }
  else if (name === 'holy') { [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.07, 0.6, 'sine', 0.2)); }
  else if (name === 'magic') { [440, 554, 659].forEach((f, i) => tone(f, t + i * 0.05, 0.25, 'triangle', 0.22, f * 1.5)); }
  else if (name === 'heal' || name === 'buff' || name === 'revive') { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.06, 0.22, 'triangle', 0.26)); }
  else if (name === 'win') { [523, 587, 659, 784, 880, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.24, 'square', 0.2)); }
  else if (name === 'battle') { [220, 220, 330, 294, 440].forEach((f, i) => tone(f, t + i * 0.08, 0.12, 'square', 0.26)); noise(t, 0.3, 0.2); }
  else if (name === 'flee') { for (let i = 0; i < 5; i++) tone(900 - i * 120, t + i * 0.04, 0.08, 'square', 0.18); }
  else if (name === 'coin') { tone(988, t, 0.06, 'square', 0.22); tone(1318, t + 0.06, 0.12, 'square', 0.22); }
  else if (name === 'chest') { [659, 784, 988, 1318].forEach((f, i) => tone(f, t + i * 0.07, 0.16, 'square', 0.2)); }
  else if (name === 'gong') gong(t);
  else if (name === 'step') tone(110, t, 0.03, 'triangle', 0.06);
  else noise(t, 0.2, 0.3);
}
// tunes: degrees of the pentatonic (0 1 2 3 4 = 宮 商 角 徵 羽, 5 the next 宮), looped over a drone
const PENT = [0, 2, 4, 7, 9];
const deg = (n) => { const o = Math.floor(n / 5), r = ((n % 5) + 5) % 5; return o * 12 + PENT[r]; };
const TUNES = {
  title: { bpm: 72, root: 293.66, wave: 'triangle', notes: [5, 4, 3, 2, 3, 1, 0, -1, 0, 2, 3, 4, 5, 7, 6, 5, 4, 3, 4, 2, 1, 0, 1, 2, 3, 2, 0, -1, 0, 0, null, null] },
  road: { bpm: 88, root: 293.66, wave: 'triangle', notes: [0, 1, 2, 4, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, -2, -1, 0, 2, 4, 5, 4, 2, 1, 2, 1, 0, -1, 0, 1, 0, -1, -2] },
  town: { bpm: 104, root: 329.63, wave: 'square', notes: [4, 5, 7, 5, 4, 2, 1, 2, 4, 2, 1, 0, 1, 2, 1, -1, 0, 1, 2, 4, 5, 4, 2, 1, 0, 1, 0, -1, 0, -1, -2, 0] },
  cave: { bpm: 70, root: 196, wave: 'triangle', notes: [0, null, 2, 1, 0, null, -1, null, 0, 3, 2, null, 1, 0, -2, null, 0, null, 2, 3, 4, null, 3, 2, 1, null, 0, -1, 0, null, null, null] },
  heaven: { bpm: 76, root: 392, wave: 'sine', notes: [5, 7, 9, 7, 5, 4, 2, 4, 5, 4, 2, 0, 2, 4, 5, 7, 9, 10, 9, 7, 5, 4, 5, 7, 5, 4, 2, 4, 5, null, null, null] },
  battle: { bpm: 152, root: 220, wave: 'square', notes: [0, 0, 3, 2, 1, 2, 3, 5, 3, 2, 1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 3, 5, 6, 5, 3, 2, 3, 1, 2, 1, 0, 0] },
  boss: { bpm: 168, root: 207.65, wave: 'sawtooth', notes: [0, 0, 0, 2, 1, 0, -1, 0, 3, 3, 2, 1, 2, 0, 1, -1, 0, 0, 5, 4, 3, 2, 3, 4, 5, 5, 6, 5, 3, 2, 1, 0] },
};
export function music(name) {
  if (cur === name) return; cur = name; clearInterval(timer); timer = null; if (!name || !on) return;
  const T = TUNES[name]; if (!T) return; let i = 0; const step = 60 / T.bpm / 2, fight = name === 'battle' || name === 'boss';
  timer = setInterval(() => { const a = ctx(); if (!a || !on) return; const t = a.currentTime + 0.05, n = T.notes[i % T.notes.length];
    if (n != null) tone(T.root * Math.pow(2, deg(n) / 12), t, step * (fight ? 1.3 : 1.9), T.wave, fight ? 0.12 : 0.13);
    if (i % 4 === 0) tone(T.root / 2, t, step * 3.8, 'triangle', 0.11);
    if (fight && i % 2 === 0) noise(t, 0.05, i % 8 === 0 ? 0.22 : 0.1, i % 8 === 0 ? 0 : 3000);
    if (name === 'heaven' && i % 8 === 0) tone(T.root * 2, t, step * 6, 'sine', 0.05);
    i++; }, step * 1000);
}
export function setSound(v) { on = v; if (!on) { clearInterval(timer); timer = null; cur = null; } }
export const soundOn = () => on;
