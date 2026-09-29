// Ego vehicle: pose, smooth lane-change paths and the executors for the manoeuvres Jev can choose.
// This file never looks at traffic to pick a manoeuvre. It only carries out the one it is given.
import { clamp, mps } from './rng.mjs';
import { LANE_X } from './world.mjs';

export const EGO_SIZE = { length: 4.5, width: 1.85, wheelbase: 2.7 };
export const LIMITS = { accel: 3.0, brake: 3.5, hardBrake: 7, emergency: 8.5, maxSpeed: mps(60) };
export const CREEP_SPEED = mps(8);
export const MANEUVERS = ['cruise', 'follow', 'creep', 'stop', 'overtake', 'return_right', 'abort_overtake', 'emergency_brake'];
export const PACES = ['50', '30'];

export function createEgo() {
  return { x: LANE_X.right, z: 0, heading: 0, speed: mps(30), accel: 0, steer: 0, curvature: 0, length: EGO_SIZE.length, width: EGO_SIZE.width, laneTarget: 'right', path: null, maneuver: 'cruise', pace: 50, maneuverSince: 0 };
}

// Quintic lateral profile over forward distance: starts tangent to the current heading, ends straight in the target lane.
export function planLaneChange(ego, targetX) {
  const L = clamp(ego.speed * 2.8, 22, 45);
  const dx = targetX - ego.x, a1 = Math.tan(ego.heading) * L;
  return { startZ: ego.z, L, targetX, c: [ego.x, a1, 0, 10 * dx - 6 * a1, -15 * dx + 8 * a1, 6 * dx - 3 * a1] };
}
export function evalPath(path, s) {
  const t = clamp(s / path.L, 0, 1), c = path.c;
  const x = c[0] + c[1] * t + c[2] * t ** 2 + c[3] * t ** 3 + c[4] * t ** 4 + c[5] * t ** 5;
  const slope = (c[1] + 2 * c[2] * t + 3 * c[3] * t ** 2 + 4 * c[4] * t ** 3 + 5 * c[5] * t ** 4) / path.L;
  const second = (2 * c[2] + 6 * c[3] * t + 12 * c[4] * t ** 2 + 20 * c[5] * t ** 3) / path.L ** 2;
  return { x, slope, heading: Math.atan(slope), curvature: second / (1 + slope * slope) ** 1.5 };
}
export function remainingPathMetres(ego) {
  if (!ego.path) return 0;
  return Math.max(0, ego.path.L - (ego.z - ego.path.startZ));
}

// Speed the executors ask for. `ctx` carries measurements the controller needs to carry out the manoeuvre.
export function followSpeed(lead, limit) {
  if (!lead) return limit;
  const desiredGap = 5 + 1.0 * lead.speed;
  return clamp(lead.speed + 0.6 * (lead.gap - desiredGap), 0, limit);
}
export function stopProfileSpeed(distanceToRest) {
  const s = distanceToRest - 1.2; // come to rest a little before the line
  if (s <= 0.25) return 0;
  return Math.sqrt(2 * 2.6 * s);
}
export function maneuverTargets(m, ego, ctx) {
  const limit = Math.min(ctx.limit, LIMITS.maxSpeed);
  switch (m) {
    case 'cruise': return { lane: ego.laneTarget, speed: limit, mode: 'speed' };
    case 'follow': return { lane: ego.laneTarget, speed: followSpeed(ctx.lead, limit), mode: 'speed' };
    case 'creep': return { lane: ego.laneTarget, speed: Math.min(CREEP_SPEED, limit), mode: 'speed' };
    case 'stop': return { lane: ego.laneTarget, speed: ctx.lead ? followSpeed(ctx.lead, limit) : limit, mode: 'stop', stopDistance: ctx.stopLineDistance };
    case 'overtake': return { lane: 'left', speed: limit, mode: 'speed' };
    case 'return_right': return { lane: 'right', speed: followSpeed(ctx.lead, limit), mode: 'speed' };
    case 'abort_overtake': return { lane: ego.laneTarget, speed: ctx.passTarget ? Math.max(0, ctx.passTarget.speed - mps(12)) : limit * 0.5, mode: 'abort' };
    case 'emergency_brake': return { lane: ego.laneTarget, speed: 0, mode: 'emergency' };
    default: return { lane: ego.laneTarget, speed: 0, mode: 'emergency' };
  }
}

export function setLaneTarget(ego, lane) {
  if (lane !== 'left' && lane !== 'right') return false;
  if (ego.laneTarget !== lane) { ego.laneTarget = lane; ego.path = planLaneChange(ego, LANE_X[lane]); return true; }
  return false;
}

// Deceleration that brings the car to rest exactly at the stop point, recomputed every step.
export function stopAcceleration(speed, stopDistance, speedAccel) {
  if (stopDistance === null) return -LIMITS.brake;
  const s = stopDistance - 1.0;
  if (s <= 0.1 || speed < 0.02) return -LIMITS.brake;
  const required = speed * speed / (2 * s);
  if (required < 2.0) return speedAccel; // still far: keep driving normally, braking starts at 2 m/s²
  return -Math.min(required * 1.05, LIMITS.hardBrake);
}
// One physics step. Applies the lane target, then speed and steering. Returns true when a lane change started.
export function stepEgo(ego, targets, dt) {
  const laneChanged = setLaneTarget(ego, targets.lane);
  const v = ego.speed;
  let accel;
  if (targets.mode === 'emergency') accel = -LIMITS.emergency;
  else {
    const speedAccel = clamp(1.4 * (targets.speed - v), targets.mode === 'abort' ? -5 : -LIMITS.brake, LIMITS.accel);
    accel = targets.mode === 'stop' ? Math.min(speedAccel, stopAcceleration(v, targets.stopDistance, speedAccel)) : speedAccel;
  }
  ego.accel = accel;
  const next = clamp(v + accel * dt, 0, LIMITS.maxSpeed);
  const ds = (v + next) / 2 * dt;
  ego.speed = next;
  const targetX = LANE_X[ego.laneTarget];
  if (!ego.path && (Math.abs(ego.x - targetX) > 0.04 || Math.abs(ego.heading) > 0.01)) ego.path = planLaneChange(ego, targetX);
  if (!ego.path) { ego.z += ds; ego.heading = 0; ego.curvature = 0; ego.steer = 0; return laneChanged; }
  if (ds <= 0) return laneChanged; // a standing car cannot move sideways
  const s = ego.z - ego.path.startZ;
  const here = evalPath(ego.path, s);
  const dz = ds / Math.hypot(1, here.slope);
  if (s + dz >= ego.path.L) {
    ego.z = ego.path.startZ + ego.path.L + Math.max(0, ds - (ego.path.L - s) * Math.hypot(1, here.slope));
    ego.x = ego.path.targetX; ego.heading = 0; ego.curvature = 0; ego.steer = 0; ego.path = null;
  } else {
    ego.z += dz;
    const p = evalPath(ego.path, ego.z - ego.path.startZ);
    ego.x = p.x; ego.heading = p.heading; ego.curvature = p.curvature; ego.steer = Math.atan(EGO_SIZE.wheelbase * p.curvature);
  }
  return laneChanged;
}

export function laneOf(x) { return x < 0 ? 'left' : 'right'; }
export function laneStatus(ego) {
  const centredRight = Math.abs(ego.x - LANE_X.right) < 0.3 && !ego.path, centredLeft = Math.abs(ego.x - LANE_X.left) < 0.3 && !ego.path;
  if (centredRight) return 'centred in right lane';
  if (centredLeft) return 'centred in left lane';
  return ego.laneTarget === 'left' ? 'moving into left lane' : 'moving back into right lane';
}

// Oriented rectangles (separating axis test) for collisions and body overlap.
export function bodiesOverlap(a, b) {
  const axes = v => { const h = v.heading || 0; return [{ x: Math.cos(h), z: -Math.sin(h) }, { x: Math.sin(h), z: Math.cos(h) }]; };
  const aa = axes(a), bb = axes(b), dx = b.x - a.x, dz = b.z - a.z;
  const proj = (v, basis, axis) => v.width / 2 * Math.abs(basis[0].x * axis.x + basis[0].z * axis.z) + v.length / 2 * Math.abs(basis[1].x * axis.x + basis[1].z * axis.z);
  return [...aa, ...bb].every(axis => Math.abs(dx * axis.x + dz * axis.z) < proj(a, aa, axis) + proj(b, bb, axis));
}
export function footprint(v) {
  const h = v.heading || 0, c = Math.cos(h), s = Math.sin(h), hw = v.width / 2, hl = v.length / 2;
  return [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(([px, pz]) => ({ x: v.x + px * c + pz * s, z: v.z - px * s + pz * c }));
}
