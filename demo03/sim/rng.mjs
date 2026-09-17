// Small seeded random source (mulberry32). Same seed, same world.
export function createRng(seed) {
  let a = (seed >>> 0) || 1;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    float: (lo, hi) => lo + (hi - lo) * next(),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: p => next() < p,
    pick: arr => arr[Math.floor(next() * arr.length)],
    shuffle(arr) { const out = arr.slice(); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }
  };
}
export const kmh = mps => mps * 3.6;
export const mps = kmhValue => kmhValue / 3.6;
export const round = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(v)) ? null : Number(v.toFixed(d));
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
