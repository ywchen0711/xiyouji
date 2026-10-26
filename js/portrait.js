// One portrait for anyone in the cast: people from human.js, beasts from beast.js (both cached).
import { painted } from './human.js';
import { beastPortrait } from './beast.js';
import { CAST } from './data/cast.js';
export function portrait(id) { const c = CAST[id]; if (!c) return null; return c.beast ? beastPortrait(c) : painted(c); }
