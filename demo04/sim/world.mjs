// World generation: a two-lane, two-way road with slow traffic ahead, oncoming traffic,
// zebra crossings with pedestrians, 30/50 km/h signs and scenery. Everything comes from the seed.
import { createRng, mps } from './rng.mjs';

export const LANE_WIDTH = 3.5;
export const LANE_X = { right: 1.75, left: -1.75 };
export const ROAD_HALF_WIDTH = 3.5;
export const KERB_X = 5.0;                 // pedestrians wait here
export const SIGN_X = 5.4;
export const STOP_LINE_BEFORE_CROSSING_M = 3.0; // stop line sits this far before the zebra centre
export const NO_PASS_BEFORE_M = 30;
export const NO_PASS_AFTER_M = 8;
export const CAR_LENGTH = 4.5;
export const CAR_WIDTH = 1.85;
export const TRAFFIC_LEVELS = ['light', 'normal', 'dense'];

// Oncoming gaps are what create (or deny) overtaking windows: at a closing speed of about 25 m/s,
// a 300 m gap is a 12 s window; a full pass from 12 km/h takes roughly 7-8 s.
// Counts are per kilometre so a longer drive keeps the same feel. 840 m gives 1/2/3 crossings and 3/4/5 slow cars.
const LEVEL = {
  light:  { crossingsPerKm: 1.2, aheadPerKm: 3.6, aheadGap: [170, 260], oncoming: 3, oncomingGap: [350, 600], people: [1, 2], lateStepper: false },
  normal: { crossingsPerKm: 2.4, aheadPerKm: 4.8, aheadGap: [130, 210], oncoming: 4, oncomingGap: [220, 450], people: [1, 3], lateStepper: false },
  dense:  { crossingsPerKm: 3.6, aheadPerKm: 6.0, aheadGap: [90, 160],  oncoming: 6, oncomingGap: [120, 300], people: [2, 3], lateStepper: true }
};
export const DRIVE_LENGTHS = [
  { seconds: 90, length: 840, label: '90 s · 840 m' },
  { seconds: 120, length: 1100, label: '2 min · 1.1 km' },
  { seconds: 180, length: 1650, label: '3 min · 1.7 km' },
  { seconds: 300, length: 2800, label: '5 min · 2.8 km' },
  { seconds: 600, length: 5600, label: '10 min · 5.6 km' }
];

export function buildWorld(seed = 1, traffic = 'normal', length = 840) {
  length = Math.max(400, Math.min(20000, length));
  const base = LEVEL[traffic] || LEVEL.normal;
  const cfg = { ...base, crossings: Math.max(1, Math.round(base.crossingsPerKm * length / 1000)), ahead: Math.max(3, Math.round(base.aheadPerKm * length / 1000)) };
  const rng = createRng(seed);
  const world = { seed, traffic, length, crossings: [], signs: [], noPassing: [], cars: [], pedestrians: [], scenery: [] };
  let id = 0;

  // Crossings: spread along the road, never in the first 180 m or the last 90 m.
  const usable = length - 320;
  for (let i = 0; i < cfg.crossings; i++) {
    const z = Math.round(230 + usable * (i + 0.5) / cfg.crossings + rng.float(-30, 30));
    world.crossings.push({ id: `crossing-${i + 1}`, z, stopLineZ: z - STOP_LINE_BEFORE_CROSSING_M, kerbSide: rng.chance(0.5) ? -1 : 1 });
    world.noPassing.push({ from: z - NO_PASS_BEFORE_M, to: z + NO_PASS_AFTER_M, crossingId: `crossing-${i + 1}` });
  }
  // Signs: an opening 50, then a 30 zone around every crossing that ends with a 50.
  world.signs.push({ id: 'sign-1', z: 15, limit: 50 });
  for (const c of world.crossings) {
    world.signs.push({ id: `sign-${world.signs.length + 1}`, z: c.z - Math.round(rng.float(55, 70)), limit: 30 });
    world.signs.push({ id: `sign-${world.signs.length + 1}`, z: c.z + Math.round(rng.float(25, 35)), limit: 50 });
  }
  world.signs.sort((a, b) => a.z - b.z);

  // Slow same-direction cars in the right lane, each with its own speed.
  const slots = rng.shuffle([10, 12.5, 15, 17.5, 20]);
  let z = rng.float(70, 130);
  for (let i = 0; i < cfg.ahead && z < length - 60; i++) {
    const speedKmh = slots[i % slots.length] + rng.float(-1, 1);
    world.cars.push({ kind: 'car', id: `car-${++id}`, lane: 'right', dir: 1, x: LANE_X.right, z, heading: 0, speed: mps(speedKmh), cruise: mps(speedKmh), length: CAR_LENGTH, width: CAR_WIDTH, color: rng.int(0, 5), yielding: false });
    z += rng.float(...cfg.aheadGap);
  }
  // Oncoming cars in the left lane. They are recycled ahead of the ego during the run.
  z = rng.float(150, 350);
  const oncomingCount = Math.max(cfg.oncoming, Math.round(cfg.oncoming * Math.min(2.5, length / 840)));
  for (let i = 0; i < oncomingCount; i++) {
    const speedKmh = rng.float(30, 50);
    world.cars.push({ kind: 'car', id: `car-${++id}`, lane: 'left', dir: -1, x: LANE_X.left, z, heading: Math.PI, speed: mps(speedKmh), cruise: mps(speedKmh), length: CAR_LENGTH, width: CAR_WIDTH, color: rng.int(0, 5), yielding: false });
    z += rng.float(...cfg.oncomingGap);
  }
  world.oncomingGap = cfg.oncomingGap;

  // Pedestrians: they wait on one kerb and start when the ego comes within their trigger distance.
  let pid = 0;
  for (const c of world.crossings) {
    const count = rng.int(...cfg.people);
    for (let j = 0; j < count; j++) {
      const late = cfg.lateStepper && j === count - 1 && rng.chance(0.6);
      world.pedestrians.push({
        id: `person-${++pid}`, crossingId: c.id, kerbSide: c.kerbSide,
        x: c.kerbSide * (KERB_X + rng.float(0, 0.6)), z: c.z + rng.float(-1.2, 1.2),
        walkSpeed: rng.float(1.1, 1.6), delay: rng.float(0, 2.2),
        triggerDistance: late ? rng.float(22, 34) : rng.float(50, 95),
        state: 'waiting', startedAt: null, color: rng.int(0, 5), late
      });
    }
  }
  // Scenery is cosmetic and deterministic; it never reaches the sensors.
  for (let s = -40; s < length + 120; s += rng.float(9, 16)) {
    if (rng.chance(0.85)) world.scenery.push({ kind: 'tree', x: -(7 + rng.float(0, 8)), z: s, scale: rng.float(0.8, 1.4) });
    if (rng.chance(0.85)) world.scenery.push({ kind: 'tree', x: 7 + rng.float(0, 8), z: s + rng.float(0, 6), scale: rng.float(0.8, 1.4) });
    if (rng.chance(0.25)) world.scenery.push({ kind: 'house', x: (rng.chance(0.5) ? -1 : 1) * (14 + rng.float(0, 6)), z: s, scale: rng.float(0.9, 1.3), color: rng.int(0, 3) });
  }
  for (let s = 40; s < length; s += 60) world.scenery.push({ kind: 'lamp', x: -6.2, z: s, scale: 1 });
  return world;
}

export function postedLimitAt(world, z) {
  let limit = 50;
  for (const s of world.signs) { if (s.z > z) break; limit = s.limit; }
  return limit;
}
export function centreLineAt(world, z) {
  return world.noPassing.some(n => z >= n.from && z <= n.to) ? 'solid' : 'broken';
}
