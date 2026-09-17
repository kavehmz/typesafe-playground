// Idealised sensing. Cameras have a mount, a field of view, a range and line-of-sight occlusion by other cars.
// Radar returns the nearest body per lane ahead and behind. Blind-spot sensors watch short zones beside the car.
// All of this is structured data about the simulated world, not image inference.
import { round } from './rng.mjs';
import { LANE_X, ROAD_HALF_WIDTH, SIGN_X, centreLineAt } from './world.mjs';
import { footprint } from './dynamics.mjs';

export const CAMERAS = {
  front: { dx: 0, dz: 2.1, yaw: 0, fov: 70, range: 200 },
  left: { dx: -0.9, dz: -0.3, yaw: -Math.PI / 2, fov: 170, range: 30 },
  right: { dx: 0.9, dz: -0.3, yaw: Math.PI / 2, fov: 170, range: 30 },
  rear: { dx: 0, dz: -2.1, yaw: Math.PI, fov: 100, range: 70 }
};
export const RADAR = { frontRange: 300, rearRange: 80 };
export const BLIND_ZONE = { behind: 7, ahead: 1.5 };
export const SIGN_RANGE = 90;
export const CROSSING_RANGE = 120;
export const MARKING_RANGE = 100;

export function mount(ego, cam) {
  const c = Math.cos(ego.heading), s = Math.sin(ego.heading);
  return { x: ego.x + cam.dx * c + cam.dz * s, z: ego.z - cam.dx * s + cam.dz * c, yaw: ego.heading + cam.yaw };
}
function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
// Segment from origin to point crosses the axis-aligned bounds of a body (background cars are axis aligned).
function blocked(origin, point, body) {
  const lo = { x: body.x - body.width / 2, z: body.z - body.length / 2 }, hi = { x: body.x + body.width / 2, z: body.z + body.length / 2 };
  let tNear = 0, tFar = 1;
  for (const k of ['x', 'z']) {
    const d = point[k] - origin[k];
    if (Math.abs(d) < 1e-9) { if (origin[k] < lo[k] || origin[k] > hi[k]) return false; continue; }
    const a = (lo[k] - origin[k]) / d, b = (hi[k] - origin[k]) / d;
    tNear = Math.max(tNear, Math.min(a, b)); tFar = Math.min(tFar, Math.max(a, b));
    if (tNear > tFar) return false;
  }
  return tFar > 0.002 && tNear < 0.998;
}
function samplePoints(body) {
  const pts = footprint(body); pts.push({ x: body.x, z: body.z }); return pts;
}
// Object position expressed in the ego frame (+forward, +right).
export function relativeTo(ego, body) {
  const dx = body.x - ego.x, dz = body.z - ego.z, c = Math.cos(ego.heading), s = Math.sin(ego.heading);
  return { forward: dz * c + dx * s, right: dx * c - dz * s };
}

export function senseCameras(ego, bodies) {
  const cars = bodies.filter(b => b.kind === 'car');
  const out = {};
  for (const [name, cam] of Object.entries(CAMERAS)) {
    const o = mount(ego, cam), half = cam.fov * Math.PI / 360;
    const seen = [];
    for (const b of bodies) {
      let best = null;
      for (const p of samplePoints(b)) {
        const dx = p.x - o.x, dz = p.z - o.z, dist = Math.hypot(dx, dz);
        if (dist > cam.range) continue;
        const bearing = wrap(Math.atan2(dx, dz) - o.yaw);
        if (Math.abs(bearing) > half) continue;
        if (cars.some(c => c !== b && blocked(o, p, c))) continue;
        if (!best || dist < best.dist) best = { dist, bearing };
      }
      if (best) {
        const rel = relativeTo(ego, b);
        seen.push({ id: b.id, kind: b.kind, distance_m: round(best.dist), bearing_deg: round(best.bearing * 180 / Math.PI, 0), forward_m: round(rel.forward), right_m: round(rel.right), lane: laneLabel(b.x), speed_kmh: round(b.speed * 3.6, 0), direction: b.kind === 'car' ? (b.dir === 1 ? 'same' : 'oncoming') : 'pedestrian', ...(b.kind === 'pedestrian' ? { crossing_id: b.crossingId, x_m: round(b.x), walking: b.state === 'crossing' ? (b.kerbSide === 1 ? 'toward left kerb' : 'toward right kerb') : b.state === 'done' ? 'finished crossing' : 'standing on kerb', kerb_side: b.kerbSide === 1 ? 'right' : 'left' } : { length_m: b.length }) });
      }
    }
    seen.sort((a, b) => a.distance_m - b.distance_m);
    out[name] = { fov_deg: cam.fov, range_m: cam.range, detections: seen.slice(0, 6) };
  }
  return out;
}

function inLane(body, laneX) { return Math.abs(body.x - laneX) < 1.75 + body.width / 2; }
export function laneLabel(x) { return Math.abs(x) > ROAD_HALF_WIDTH ? (x > 0 ? 'right kerb' : 'left kerb') : x >= 0 ? 'right' : 'left'; }
export function senseRadar(ego, bodies) {
  const front = {}, rear = {};
  for (const lane of ['left', 'right']) {
    const laneX = LANE_X[lane];
    let f = null, r = null;
    for (const b of bodies) {
      if (!inLane(b, laneX)) continue;
      const rel = relativeTo(ego, b);
      const gapF = rel.forward - ego.length / 2 - b.length / 2;
      const gapR = -rel.forward - ego.length / 2 - b.length / 2;
      if (rel.forward > 0 && gapF < RADAR.frontRange && (!f || gapF < f.gap)) f = { body: b, gap: gapF, rel };
      if (rel.forward < 0 && gapR < RADAR.rearRange && (!r || gapR < r.gap)) r = { body: b, gap: gapR, rel };
    }
    const egoForward = ego.speed * Math.cos(ego.heading);
    const describe = (hit, sign) => hit ? { id: hit.body.id, kind: hit.body.kind, gap_m: round(Math.max(0, hit.gap)), forward_m: round(hit.rel.forward), right_m: round(hit.rel.right), lane, speed_kmh: round(hit.body.speed * 3.6, 0), direction: hit.body.kind === 'car' ? (hit.body.dir === 1 ? 'same' : 'oncoming') : 'pedestrian', closing_speed_kmh: round(sign * (egoForward - (hit.body.kind === 'car' ? hit.body.dir : 0) * hit.body.speed) * 3.6, 0) } : null;
    front[lane] = describe(f, 1);
    rear[lane] = describe(r, -1);
  }
  return { front, rear, front_range_m: RADAR.frontRange, rear_range_m: RADAR.rearRange };
}

export function senseBlindSpots(ego, bodies) {
  const out = {};
  for (const side of ['left', 'right']) {
    const zoneX = ego.x + (side === 'left' ? -3.5 : 3.5);
    const onRoad = Math.abs(zoneX) < ROAD_HALF_WIDTH + 1;
    let hit = null;
    if (onRoad) for (const b of bodies) {
      if (b.kind !== 'car') continue;
      const overlapX = Math.abs(b.x - zoneX) < 1.75 + b.width / 2;
      const zLo = ego.z - BLIND_ZONE.behind, zHi = ego.z + BLIND_ZONE.ahead;
      const overlapZ = b.z + b.length / 2 > zLo && b.z - b.length / 2 < zHi;
      if (overlapX && overlapZ) hit = b;
    }
    out[side] = { covers_lane: onRoad ? (zoneX < 0 ? 'left' : 'right') : 'off road', occupied: Boolean(hit), object: hit ? hit.id : null };
  }
  return out;
}

export function senseRoad(ego, world, bodies) {
  const cam = mount(ego, CAMERAS.front), half = CAMERAS.front.fov * Math.PI / 360;
  const visible = (x, z, range) => { const dx = x - cam.x, dz = z - cam.z; return Math.hypot(dx, dz) <= range && Math.abs(wrap(Math.atan2(dx, dz) - cam.yaw)) <= half; };
  const signs = world.signs.filter(s => s.z > ego.z && visible(SIGN_X, s.z, SIGN_RANGE)).map(s => ({ id: s.id, limit_kmh: s.limit, distance_m: round(s.z - ego.z, 0) }));
  const crossings = world.crossings.filter(c => c.z > ego.z - 6 && [-3, 0, 3].some(x => visible(x, c.z, CROSSING_RANGE))).map(c => ({ id: c.id, distance_m: round(c.z - ego.z, 0), stop_line_distance_m: round(c.stopLineZ - (ego.z + ego.length / 2), 0) }));
  const here = centreLineAt(world, ego.z);
  let solidStartsIn = null;
  for (const n of world.noPassing) { if (n.from > ego.z && n.from - ego.z <= MARKING_RANGE) solidStartsIn = solidStartsIn === null ? n.from - ego.z : Math.min(solidStartsIn, n.from - ego.z); }
  let solidEndsIn = null;
  if (here === 'solid') { const n = world.noPassing.find(n => ego.z >= n.from && ego.z <= n.to); solidEndsIn = n ? n.to - ego.z : null; }
  return { signs, crossings, centre_line_here: here, solid_section_starts_in_m: round(solidStartsIn, 0), solid_section_ends_in_m: round(solidEndsIn, 0) };
}

export function senseAll(ego, world) {
  const bodies = [...world.cars, ...world.pedestrians.map(p => ({ id: p.id, kind: 'pedestrian', x: p.x, z: p.z, heading: 0, length: 0.6, width: 0.6, speed: p.state === 'crossing' ? p.walkSpeed : 0, state: p.state, kerbSide: p.kerbSide, crossingId: p.crossingId }))];
  return { cameras: senseCameras(ego, bodies), radar: senseRadar(ego, bodies), blind_spots: senseBlindSpots(ego, bodies), road: senseRoad(ego, world, bodies), bodies };
}
