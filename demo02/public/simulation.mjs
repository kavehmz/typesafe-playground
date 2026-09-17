import { observeCameras } from './perception.mjs';
import { observeRoad, SignMemory } from './road.mjs';
import { ACTION_ACCELERATIONS, SENSOR_SCHEMA } from './motion.mjs';

export const LANES = { left: -1.8, right: 1.8 };
// Mechanical ceiling only. Posted 30/50 limits never clamp the ego car's speed.
export const SPEED_LIMIT = 22;
export const CONTROLS = ACTION_ACCELERATIONS;
export const round = (v, n = 1) => Number(v.toFixed(n));
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export class Simulation {
  constructor(seed = 42, duration = 90, density = 'normal') { this.reset(seed, duration, density); }
  reset(seed, duration, density = 'normal') {
    this.seed = seed; this.duration = duration; this.density = density;
    this.length = duration * 9; this.time = 0; this.tick = 0; this.result = null;
    this.ego = { x: LANES.right, z: 0, speed: 12, lane: 'right', target: 'right', length: 4.4, width: 1.85, control: 'coast' };
    this.objects = []; this.passed = new Set(); this.everAhead = new Set(); this.laneChanges = 0; this.minGap = Infinity;
    this.speedingSeconds = 0; this.maxOverspeedKmh = 0; this.crossingsPassed = new Set();
    this.signMemory = new SignMemory(); this.sensorElapsed = 0;
    const rng = seededRandom(seed); let id = 0;
    const crossingCount = duration >= 60 ? (density === 'busy' ? 3 : 2) : (density === 'busy' ? 2 : 1);
    this.crossings = Array.from({ length: crossingCount }, (_, i) => ({ id: `crosswalk-${i + 1}`, z: this.length * (i + 1) / (crossingCount + 1) + (rng() - .5) * 18, triggeredAt: null, approachAt: null }));
    this.signs = [{ id: 'sign-0', x: 5.5, z: 12, limit: 50 }];
    for (const [i, c] of this.crossings.entries()) {
      this.signs.push({ id: `sign-${i * 2 + 1}`, x: 5.5, z: c.z - 50, limit: 30 }, { id: `sign-${i * 2 + 2}`, x: 5.5, z: c.z + 28, limit: 50 });
      const side = rng() < .5 ? -1 : 1;
      const people = density === 'busy' ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2);
      for (let j = 0; j < people; j++) {
        this.objects.push({ id: ++id, kind: 'pedestrian', lane: 'roadside', x: side * 5.3, z: c.z + (j - (people - 1) / 2) * .85, speed: 0, lateralSpeed: 0, walkSpeed: 1.25 + rng() * .35, direction: -side, startX: side * 5.3, delay: .6 + j * .8 + rng() * .3, crossingId: c.id, motion: 'waiting', length: .55, width: .55, color: Math.floor(rng() * 5) });
      }
    }
    this.signs.sort((a, b) => a.z - b.z);
    const carCount = Math.max(3, Math.round(duration / 15)) + (density === 'busy' ? 3 : 0);
    const spacing = (this.length - 126) / (carCount - 1);
    for (let i = 0; i < carCount; i++) {
      // Stagger the lanes along the road, rather than generating parallel rows of cars.
      const lane = i % 2 === 0 ? 'right' : 'left';
      const z = i === 0 ? 36 + rng() * 8 : 36 + i * spacing + (rng() - .5) * Math.min(18, spacing * .25);
      // Distinct lane bands help two cars separate again after yielding at the same crossing.
      const speedKmh = lane === 'right' ? 10 + rng() * 4 : 16 + rng() * 4;
      const speed = speedKmh / 3.6;
      const o = { id: ++id, kind: 'car', lane, x: LANES[lane], z, speed, desiredSpeed: speed, length: 4.4, width: 1.85, color: Math.floor(rng() * 5) };
      this.objects.push(o); this.everAhead.add(o.id);
    }
    this.refreshRoadMemory();
  }
  postedLimitAt(z) {
    let limit = 50;
    for (const sign of this.signs) { if (sign.z > z) break; limit = sign.limit; }
    return limit;
  }
  refreshRoadMemory() {
    this.roadObservations = observeRoad(this.ego, this.signs, this.crossings, this.objects);
    this.signMemory.update(this.roadObservations, this.ego.z, this.time);
  }
  setAction(lane, control) {
    if (!(lane in LANES) || !(control in CONTROLS)) return false;
    if (this.ego.target !== lane) this.laneChanges++;
    this.ego.target = lane; this.ego.control = control; return true;
  }
  step(dt) {
    if (this.result) return;
    let remaining = Math.min(dt, .25);
    while (remaining > 1e-7 && !this.result) { const d = Math.min(remaining, 1 / 60); this.integrate(d); remaining -= d; }
  }
  integrate(dt) {
    this.time += dt; this.tick++;
    const e = this.ego;
    e.speed = Math.max(0, Math.min(SPEED_LIMIT, e.speed + CONTROLS[e.control] * dt));
    e.z += e.speed * dt;
    const delta = LANES[e.target] - e.x;
    e.x += Math.sign(delta) * Math.min(Math.abs(delta), 3.6 / 1.4 * dt);
    e.lane = e.x < 0 ? 'left' : 'right';
    // Seeded pedestrian scenarios start with ample visible approach distance, never teleport into a lane.
    for (const c of this.crossings) {
      if (c.approachAt == null && c.z - e.z <= 105 && c.z >= e.z) c.approachAt = this.time;
      if (c.triggeredAt === null && c.z >= e.z && (c.z - e.z <= 58 || c.approachAt != null && this.time - c.approachAt >= 3)) c.triggeredAt = this.time;
      if (e.z > c.z + 5) this.crossingsPassed.add(c.id);
      for (const p of this.objects.filter(o => o.kind === 'pedestrian' && o.crossingId === c.id)) {
        if (c.triggeredAt === null || this.time < c.triggeredAt + p.delay || p.motion === 'cleared') continue;
        p.motion = 'crossing'; p.lateralSpeed = p.direction * p.walkSpeed;
        p.x += p.lateralSpeed * dt;
        if (p.direction * p.x >= 5.3) { p.x = p.direction * 5.3; p.motion = 'cleared'; p.lateralSpeed = 0; }
        p.lane = Math.abs(p.x) > 3.6 ? 'roadside' : p.x < 0 ? 'left' : 'right';
      }
    }
    // Only background cars use these traffic rules. They resume when people clear the crossing.
    for (const o of this.objects.filter(o => o.kind === 'car').sort((a, b) => b.z - a.z)) {
      let allowed = Math.min(o.desiredSpeed, this.postedLimitAt(o.z) / 3.6);
      const ahead = this.objects.filter(other => other !== o && other.kind === 'car' && other.lane === o.lane && other.z > o.z).sort((a, b) => a.z - b.z)[0];
      if (ahead) allowed = Math.min(allowed, Math.max(0, (ahead.z - o.z - (ahead.length + o.length) / 2 - 5) / 1.5));
      if (Math.abs(e.x - o.x) < 2 && e.z > o.z) allowed = Math.min(allowed, Math.max(0, (e.z - o.z - 4.4 - 5) / 1.5));
      for (const c of this.crossings) {
        const crossing = this.objects.some(p => p.kind === 'pedestrian' && p.crossingId === c.id && p.motion === 'crossing');
        if (crossing && c.z > o.z && c.z - o.z < 60) allowed = Math.min(allowed, Math.max(0, (c.z - o.z - o.length / 2 - 7) / 1.5));
      }
      o.speed += Math.max(-6 * dt, Math.min(2 * dt, allowed - o.speed));
      o.z += Math.max(0, o.speed) * dt;
    }
    for (const o of this.objects) {
      const dx = Math.abs(e.x - o.x), dz = Math.abs(e.z - o.z);
      if (dx < (e.width + o.width) / 2 && dz < (e.length + o.length) / 2) {
        this.result = { reason: 'collision', object: o.kind, time: round(this.time, 2), distance: round(e.z), success: false }; e.speed = 0; return;
      }
      if (o.kind === 'car') { if (o.z > e.z + 2) this.everAhead.add(o.id); if (o.z < e.z - 4.4 && this.everAhead.has(o.id)) this.passed.add(o.id); }
      if (o.z > e.z && dx < 2) this.minGap = Math.min(this.minGap, Math.max(0, dz - (e.length + o.length) / 2));
    }
    const excess = e.speed * 3.6 - this.postedLimitAt(e.z);
    if (excess > 1) this.speedingSeconds += dt;
    this.maxOverspeedKmh = Math.max(this.maxOverspeedKmh, excess);
    this.sensorElapsed += dt;
    if (this.sensorElapsed >= .1) { this.refreshRoadMemory(); this.sensorElapsed = 0; }
    // Passing an already-observed sign updates remembered rules using odometry, not a new hidden observation.
    this.signMemory.update({ visible_signs: [] }, e.z, this.time);
    if (e.z >= this.length) this.result = { reason: 'finish', time: round(this.time, 2), distance: round(e.z), success: true };
    else if (this.time >= this.duration) this.result = { reason: 'time', time: this.duration, distance: round(e.z), success: false };
  }
  sensors() {
    const e = this.ego, radar = {}, blind_spots = {};
    for (const lane of ['left', 'right']) {
      const objects = this.objects.filter(o => o.lane === lane || (o.kind === 'pedestrian' && Math.abs(o.x - LANES[lane]) < 1.8 + o.width / 2));
      const front = objects.filter(o => o.z >= e.z && o.z - e.z < 140).sort((a, b) => a.z - b.z)[0];
      const rear = objects.filter(o => o.z < e.z && e.z - o.z < 40).sort((a, b) => b.z - a.z)[0];
      const gap = front ? Math.max(0, front.z - e.z - (front.length + e.length) / 2) : 140;
      const closing = front ? e.speed - front.speed : 0;
      radar[lane] = { front_gap_m: round(gap), front_speed_mps: round(front?.speed ?? SPEED_LIMIT), rear_gap_m: round(rear ? Math.max(0, e.z - rear.z - (rear.length + e.length) / 2) : 40), rear_speed_mps: round(rear?.speed ?? 0), ttc_s: closing > .1 ? round(Math.min(9999, gap / closing), 2) : null };
      blind_spots[lane] = objects.some(o => Math.abs(o.z - e.z) < 7);
    }
    const road = observeRoad(e, this.signs, this.crossings, this.objects);
    return {
      schema: SENSOR_SCHEMA, tick: this.tick,
      ego: { speed_mps: round(e.speed), speed_limit_mps: round(this.signMemory.activeLimit / 3.6, 2), lane: e.lane, target_lane: e.target, changing_lane: Math.abs(e.x - LANES[e.target]) > .08, lateral_position_m: round(e.x, 3), current_control: e.control },
      radar, blind_spots, cameras: observeCameras(e, this.objects), road_observations: road, road_rules: this.signMemory.snapshot(e.z, road)
    };
  }
}
export function applyDecision(sim, result, ageSeconds) {
  if (sim.result || ageSeconds > 1.8 || ageSeconds < 0) return false;
  const lane = result.answers.lane.choice;
  return sim.setAction(lane, result.answers[`${lane}_speed`].choice);
}
