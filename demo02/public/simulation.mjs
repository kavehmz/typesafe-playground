import { observeCameras } from './perception.mjs';
import { observeRoad, SignMemory } from './road.mjs';
import { ACTION_ACCELERATIONS, SENSOR_SCHEMA } from './motion.mjs';
import { forwardVelocity, observeObject, FRONT_RADAR_RANGE_M, REAR_RADAR_RANGE_M } from './traffic.mjs';
import { speedTargetAcceleration, createLanePath, advanceOnLanePath, remainingLanePathMetres, longitudinalHalfExtent, lateralHalfExtent, bodiesOverlap, TARGET_SPEED_KEYS } from './vehicle.mjs';

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
    this.ego = { x: LANES.right, z: 0, speed: 12, lane: 'right', target: 'right', length: 4.4, width: 1.85, control: 'coast', commandKind: 'acceleration', targetSpeed: null, acceleration: 0, headingRad: 0, curvature: 0, steeringAngle: 0, lanePath: null };
    this.overtakeMemory = null;
    this.objects = []; this.passed = new Set(); this.everAhead = new Set(); this.laneChanges = 0; this.minGap = Infinity;
    this.opposingLaneSeconds = 0; this.minOncomingTtc = Infinity;
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
    // Traffic gets its own seeded stream: changing scenery or pedestrian generation
    // must not consume its random draws. Sample positions, rather than jittering slots.
    const trafficRng = seededRandom(seed ^ 0x71a5f1c);
    const rightCount = Math.ceil(carCount / 2), minimumGap = density === 'busy' ? 35 : 55;
    const firstRight = 35 + trafficRng() * 55;
    const freeSpan = Math.max(0, this.length * .74 - firstRight - minimumGap * (rightCount - 1));
    const draws = Array.from({ length: rightCount - 1 }, () => trafficRng()).sort((a, b) => a - b);
    const rightPositions = [firstRight, ...draws.map((u, i) => firstRight + minimumGap * (i + 1) + u * freeSpan)];
    const leftPositions = []; let oncomingZ = 140 + trafficRng() * 300;
    for (let i = 0; i < Math.floor(carCount / 2); i++) {
      leftPositions.push(oncomingZ);
      oncomingZ += density === 'busy' ? 110 + trafficRng() * 240 : 200 + trafficRng() * 400;
    }
    for (let i = 0; i < carCount; i++) {
      const lane = i % 2 === 0 ? 'right' : 'left';
      const travelDirection = lane === 'right' ? 1 : -1;
      const z = (lane === 'right' ? rightPositions : leftPositions)[Math.floor(i / 2)];
      const speedKmh = lane === 'right' ? 10 + trafficRng() * 10 : 25 + trafficRng() * 20;
      const speed = speedKmh / 3.6;
      const o = { id: ++id, kind: 'car', lane, travelDirection, x: LANES[lane], z, speed, desiredSpeed: speed, length: 4.4, width: 1.85, color: Math.floor(trafficRng() * 5) };
      this.objects.push(o); if (travelDirection === 1) this.everAhead.add(o.id);
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
  selectLane(lane, referenceId = undefined) {
    const e = this.ego;
    if (!(lane in LANES)) return false;
    if (e.target !== lane) {
      if (lane === 'left' && !this.overtakeMemory) {
        const observed = this.sensors().radar.right.front_object;
        const targetId = referenceId ?? (observed?.kind === 'car' && observed.travel_direction === 'same_direction' ? observed.id : null);
        this.overtakeMemory = { target_id: targetId, started_at_s: this.time, last_seen_at_s: null, last_seen_ego_z: e.z, last_observation: null };
      }
      this.laneChanges++;
      e.lanePath = createLanePath(e, LANES[lane]);
    }
    e.target = lane; return true;
  }
  setAction(lane, control) {
    // Low-level acceleration commands remain available to physics tests and the explicit stale fallback.
    if (!(control in CONTROLS) || !this.selectLane(lane)) return false;
    this.ego.control = control; this.ego.commandKind = 'acceleration'; this.ego.targetSpeed = null; return true;
  }
  setSpeedTarget(lane, choice, referenceId = undefined) {
    if (!TARGET_SPEED_KEYS.includes(String(choice)) || !this.selectLane(lane, referenceId)) return false;
    this.ego.commandKind = 'speed_target'; this.ego.control = choice === 'emergency' ? 'emergency' : 'target_speed';
    this.ego.targetSpeed = choice === 'emergency' ? 0 : Number(choice) / 3.6; return true;
  }
  step(dt) {
    if (this.result) return;
    let remaining = Math.min(dt, .25);
    while (remaining > 1e-7 && !this.result) { const d = Math.min(remaining, 1 / 60); this.integrate(d); remaining -= d; }
  }
  integrate(dt) {
    this.time += dt; this.tick++;
    const e = this.ego;
    const previousSpeed = e.speed;
    e.acceleration = e.commandKind === 'speed_target' ? speedTargetAcceleration(e.speed, e.targetSpeed, e.control === 'emergency') : CONTROLS[e.control];
    e.speed = Math.max(0, Math.min(SPEED_LIMIT, e.speed + e.acceleration * dt));
    advanceOnLanePath(e, (previousSpeed + e.speed) / 2 * dt, LANES[e.target]);
    e.lane = e.x < 0 ? 'left' : 'right';
    if (e.target === 'right' && !e.lanePath && Math.abs(e.x - LANES.right) < .06) this.overtakeMemory = null;
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
    for (const o of this.objects.filter(o => o.kind === 'car').sort((a, b) => (a.travelDirection ?? 1) - (b.travelDirection ?? 1) || (a.travelDirection ?? 1) * (b.z - a.z))) {
      const direction = o.travelDirection ?? 1;
      let allowed = Math.min(o.desiredSpeed, this.postedLimitAt(o.z) / 3.6);
      const ahead = this.objects.filter(other => other !== o && other.kind === 'car' && other.lane === o.lane && (other.travelDirection ?? 1) === direction && direction * (other.z - o.z) > 0).sort((a, b) => direction * (a.z - b.z))[0];
      if (ahead) allowed = Math.min(allowed, Math.max(0, (direction * (ahead.z - o.z) - (ahead.length + o.length) / 2 - 5) / 1.5));
      if (direction === 1 && Math.abs(e.x - o.x) < 2 && e.z > o.z) allowed = Math.min(allowed, Math.max(0, (e.z - o.z - 4.4 - 5) / 1.5));
      for (const c of this.crossings) {
        const crossing = this.objects.some(p => p.kind === 'pedestrian' && p.crossingId === c.id && p.motion === 'crossing');
        const crossingGap = direction * (c.z - o.z);
        if (crossing && crossingGap > 0 && crossingGap < 60) allowed = Math.min(allowed, Math.max(0, (crossingGap - o.length / 2 - 7) / 1.5));
      }
      o.speed += Math.max(-6 * dt, Math.min(2 * dt, allowed - o.speed));
      o.z += direction * Math.max(0, o.speed) * dt;
    }
    if (e.x - lateralHalfExtent(e) < 0) this.opposingLaneSeconds += dt;
    for (const o of this.objects) {
      if (o.kind === 'car' && (o.travelDirection ?? 1) < 0 && o.z > e.z && e.x - lateralHalfExtent(e) < 0) {
        const closing = e.speed * Math.cos(e.headingRad) + o.speed, gap = Math.max(0, o.z - e.z - (o.length + e.length) / 2);
        if (closing > .1) this.minOncomingTtc = Math.min(this.minOncomingTtc, gap / closing);
      }
      const dx = Math.abs(e.x - o.x), dz = Math.abs(e.z - o.z);
      if (bodiesOverlap(e, o)) {
        this.result = { reason: 'collision', object: o.kind, object_id: `${o.kind}-${o.id}`, traffic_direction: o.kind === 'car' && (o.travelDirection ?? 1) < 0 ? 'oncoming' : 'same_direction_or_pedestrian', time: round(this.time, 2), distance: round(e.z), success: false }; e.speed = 0; return;
      }
      if (o.kind === 'car' && (o.travelDirection ?? 1) === 1) { if (o.z > e.z + 2) this.everAhead.add(o.id); if (o.z < e.z - 4.4 && this.everAhead.has(o.id)) this.passed.add(o.id); }
      if (o.z > e.z && dx < 2) this.minGap = Math.min(this.minGap, Math.max(0, dz - (e.length + o.length) / 2));
    }
    if (Math.abs(e.x) + lateralHalfExtent(e) > 4.05) { this.result = { reason: 'collision', object: 'road edge', time: round(this.time, 2), distance: round(e.z), success: false }; e.speed = 0; return; }
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
      const front = objects.filter(o => o.z >= e.z && o.z - e.z < FRONT_RADAR_RANGE_M).sort((a, b) => a.z - b.z)[0];
      const rear = objects.filter(o => o.z < e.z && e.z - o.z < REAR_RADAR_RANGE_M).sort((a, b) => b.z - a.z)[0];
      const gap = front ? Math.max(0, front.z - e.z - (front.length / 2 + longitudinalHalfExtent(e))) : FRONT_RADAR_RANGE_M;
      const closing = front ? e.speed * Math.cos(e.headingRad) - forwardVelocity(front) : 0;
      radar[lane] = { front_gap_m: round(gap), front_speed_mps: round(front ? forwardVelocity(front) : 0), rear_gap_m: round(rear ? Math.max(0, e.z - rear.z - (rear.length / 2 + longitudinalHalfExtent(e))) : REAR_RADAR_RANGE_M), rear_speed_mps: round(rear ? forwardVelocity(rear) : 0), ttc_s: closing > .1 ? round(Math.min(9999, gap / closing), 2) : null };
      radar[lane].range_m = FRONT_RADAR_RANGE_M; radar[lane].rear_range_m = REAR_RADAR_RANGE_M;
      radar[lane].front_object = front ? observeObject(front, e) : null;
      radar[lane].rear_object = rear ? observeObject(rear, e) : null;
      radar[lane].oncoming_objects = objects.filter(o => o.kind === 'car' && (o.travelDirection ?? 1) < 0 && o.z >= e.z && o.z - e.z < FRONT_RADAR_RANGE_M).sort((a, b) => a.z - b.z).slice(0, 3).map(o => observeObject(o, e));
      blind_spots[lane] = objects.some(o => Math.abs(o.z - e.z) < 7);
    }
    const road = observeRoad(e, this.signs, this.crossings, this.objects);
    const cameras = observeCameras(e, this.objects);
    if (this.overtakeMemory?.target_id) {
      const all = [...Object.values(cameras).flatMap(c => c.detections), ...Object.values(radar).flatMap(r => [r.front_object, r.rear_object].filter(Boolean))];
      const seen = all.find(o => o.id === this.overtakeMemory.target_id);
      if (seen) { this.overtakeMemory.last_observation = { ...seen }; this.overtakeMemory.last_seen_at_s = this.time; this.overtakeMemory.last_seen_ego_z = e.z; }
    }
    return {
      simulation_time_s: round(this.time, 3),
      maneuver_memory: this.overtakeMemory ? { target_id: this.overtakeMemory.target_id, started_at_s: round(this.overtakeMemory.started_at_s, 3), last_seen_at_s: this.overtakeMemory.last_seen_at_s === null ? null : round(this.overtakeMemory.last_seen_at_s, 3), ego_travel_since_observation_m: round(e.z - this.overtakeMemory.last_seen_ego_z, 3), last_observation: this.overtakeMemory.last_observation } : null,
      schema: SENSOR_SCHEMA, tick: this.tick,
      ego: { speed_mps: round(e.speed), speed_limit_mps: round(this.signMemory.activeLimit / 3.6, 2), lane: e.lane, target_lane: e.target, changing_lane: Boolean(e.lanePath) || Math.abs(e.x - LANES[e.target]) > .08, lateral_position_m: round(e.x, 3), current_control: e.control, command_kind: e.commandKind, target_speed_kmh: e.targetSpeed === null ? null : round(e.targetSpeed * 3.6, 2), acceleration_mps2: round(e.acceleration, 3), heading_rad: round(e.headingRad, 5), steering_angle_rad: round(e.steeringAngle, 5), forward_speed_mps: round(e.speed * Math.cos(e.headingRad), 3), longitudinal_half_extent_m: round(longitudinalHalfExtent(e), 3), lateral_half_extent_m: round(lateralHalfExtent(e), 3), lane_change_remaining_path_m: round(remainingLanePathMetres(e), 3) },
      radar, blind_spots, cameras, road_observations: road, road_rules: this.signMemory.snapshot(e.z, road)
    };
  }
}
export function applyDecision(sim, result, ageSeconds) {
  if (sim.result || ageSeconds > 1.8 || ageSeconds < 0) return false;
  const lane = result.answers.lane.choice;
  return sim.setSpeedTarget(lane, result.answers[`${lane}_speed`].choice, result.state?.passing?.pass?.target_id);
}
