// The run: world, ego, traffic, sensing, memory, metrics and the end condition.
// Jev's decisions arrive through applyDecision(); the executor carries them out in integrate().
import { createRng, mps, round } from './rng.mjs';
import { buildWorld, LANE_X, ROAD_HALF_WIDTH, postedLimitAt } from './world.mjs';
import { createEgo, maneuverTargets, stepEgo, bodiesOverlap, MANEUVERS } from './dynamics.mjs';
import { updateCars, updatePedestrians, onRoad } from './traffic.mjs';
import { senseAll } from './sensors.mjs';
import { SignMemory, CrossingMemory } from './memory.mjs';
import { fuseSituation } from './fusion.mjs';

export const SUBSTEP = 1 / 120;
export const MAX_RUN_SECONDS = 150; // floor; a run gets twice its target time before it is called off
export const STALE_AFTER_S = 2.0;

export class Simulation {
  constructor(opts) { this.reset(opts); }
  reset({ seed = 1, traffic = 'normal', length = 840, targetSeconds = 90 } = {}) {
    this.seed = seed; this.traffic = traffic; this.targetSeconds = targetSeconds;
    this.timeLimit = Math.max(MAX_RUN_SECONDS, targetSeconds * 2);
    this.world = buildWorld(seed, traffic, length);
    this.rng = createRng((seed ^ 0x9e3779b9) >>> 0);
    this.ego = createEgo();
    this.time = 0; this.tick = 0; this.result = null;
    this.signs = new SignMemory(); this.crossings = new CrossingMemory();
    this.passTargetId = null; this.passStartedAt = null; this.peopleMemory = new Map();
    this.timing = { latency_ms: 350, interval_ms: 500 };
    this.metrics = { decisions: 0, maneuverChanges: 0, laneChanges: 0, overtakes: 0, leftLaneSeconds: 0, minGapAhead: Infinity, minOncomingTtc: Infinity, speedingSeconds: 0, maxOverKmh: 0, crossingsPassed: 0, enteredOccupiedCrossing: 0, stopsAtCrossings: 0, staleDecisions: 0, maneuverCounts: {} };
    this._sensedTick = -1; this._sensed = null; this._crossingState = new Map(); this._perceptionClock = 0;
    this.refreshPerception();
  }
  refreshPerception() {
    if (this._sensedTick === this.tick && this._sensed) return this._sensed;
    this._sensed = senseAll(this.ego, this.world);
    this.signs.observe(this._sensed.road.signs, this.ego.z);
    this.crossings.observe(this._sensed.road.crossings, this.ego.z);
    this._sensedTick = this.tick;
    return this._sensed;
  }
  situation() {
    const sensed = this.refreshPerception();
    return fuseSituation({ ego: this.ego, sensed, signs: this.signs, crossings: this.crossings, passTargetId: this.passTargetId, time: this.time, timing: this.timing, pace: this.ego.pace, peopleMemory: this.peopleMemory });
  }
  snapshot() { const situation = this.situation(); return { tick: this.tick, time: this.time, situation, sensed: this._sensed }; }
  applyDecision({ maneuver, pace }, ageSeconds = 0) {
    if (this.result) return { applied: false, reason: 'run over' };
    if (ageSeconds > STALE_AFTER_S || ageSeconds < 0) { this.metrics.staleDecisions++; return { applied: false, reason: 'stale' }; }
    if (!MANEUVERS.includes(maneuver)) return { applied: false, reason: 'unknown manoeuvre' };
    const paceNum = Number(pace);
    if (paceNum !== 30 && paceNum !== 50) return { applied: false, reason: 'unknown pace' };
    this.metrics.decisions++;
    this.metrics.maneuverCounts[maneuver] = (this.metrics.maneuverCounts[maneuver] || 0) + 1;
    if (this.ego.maneuver !== maneuver) { this.metrics.maneuverChanges++; this.ego.maneuverSince = this.time; }
    this.ego.maneuver = maneuver; this.ego.pace = paceNum;
    return { applied: true };
  }
  // Cheap measurements the executor needs: the nearest right-lane car ahead, the next remembered stop line, the pass target.
  controllerContext() {
    const e = this.ego, half = e.length / 2, c0 = Math.cos(e.heading), s0 = Math.sin(e.heading);
    let lead = null;
    for (const c of this.world.cars) {
      if (c.dir !== 1 || Math.abs(c.x - LANE_X.right) > 1.75 || c.id === this.passTargetId) continue;
      const forward = (c.z - e.z) * c0 + (c.x - e.x) * s0;
      if (forward <= 0) continue;
      const gap = forward - half - c.length / 2;
      if (gap < 220 && (!lead || gap < lead.gap)) lead = { id: c.id, gap: Math.max(0, gap), speed: c.speed };
    }
    const next = this.crossings.nextAhead(e.z + half);
    const stopLineDistance = next ? next.z - 3 - (e.z + half) : null;
    const passTarget = this.passTargetId ? this.world.cars.find(c => c.id === this.passTargetId) : null;
    return { limit: mps(e.pace), lead, stopLineDistance: stopLineDistance !== null && stopLineDistance > -1 ? stopLineDistance : null, passTarget: passTarget ? { speed: passTarget.speed } : null };
  }
  step(dt) {
    if (this.result) return;
    let remaining = Math.min(dt, 0.25);
    while (remaining > 1e-9 && !this.result) { const d = Math.min(remaining, SUBSTEP); this.integrate(d); remaining -= d; }
  }
  integrate(dt) {
    const e = this.ego, w = this.world, half = e.length / 2;
    this.time += dt; this.tick++;
    const ctx = this.controllerContext();
    const targets = maneuverTargets(e.maneuver, e, ctx);
    if (stepEgo(e, targets, dt)) {
      this.metrics.laneChanges++;
      if (targets.lane === 'left' && !this.passTargetId) {
        const sensed = this.refreshPerception();
        const candidates = [sensed.radar.front.right, ...sensed.cameras.front.detections, ...sensed.cameras.right.detections].filter(d => d && d.kind === 'car' && d.direction === 'same' && d.lane === 'right' && d.forward_m > -6 && d.forward_m < 70).sort((a, b) => a.forward_m - b.forward_m);
        this.passTargetId = candidates[0] ? candidates[0].id : null; this.passStartedAt = this.time;
      }
    }
    updatePedestrians(w, e, dt, this.time);
    updateCars(w, e, dt, this.rng);
    this._perceptionClock += dt;
    if (this._perceptionClock >= 0.1) { this._perceptionClock = 0; this.refreshPerception(); }
    this.signs.update(e.z);
    if (this.passTargetId && e.laneTarget === 'right' && !e.path) {
      const t = w.cars.find(c => c.id === this.passTargetId);
      if (t && t.z < e.z) this.metrics.overtakes++;
      this.passTargetId = null;
    }
    if (e.x - e.width / 2 < 0) this.metrics.leftLaneSeconds += dt;
    const over = e.speed * 3.6 - postedLimitAt(w, e.z);
    if (over > 2) this.metrics.speedingSeconds += dt;
    this.metrics.maxOverKmh = Math.max(this.metrics.maxOverKmh, over);
    if (ctx.lead && e.x - e.width / 2 > 0) this.metrics.minGapAhead = Math.min(this.metrics.minGapAhead, ctx.lead.gap);
    if (e.x - e.width / 2 < 0) for (const c of w.cars) if (c.dir === -1 && c.z > e.z) {
      const gap = c.z - e.z - 4.5, closing = e.speed * Math.cos(e.heading) + c.speed;
      if (closing > 0.1 && gap > 0) this.metrics.minOncomingTtc = Math.min(this.metrics.minOncomingTtc, gap / closing);
    }
    for (const c of w.cars) if (bodiesOverlap(e, c)) return this.end('collision', { with: c.id, kind: c.dir === -1 ? 'oncoming car' : 'same-direction car' });
    for (const p of w.pedestrians) if (bodiesOverlap(e, { x: p.x, z: p.z, heading: 0, length: 0.6, width: 0.6 })) return this.end('collision', { with: p.id, kind: 'pedestrian' });
    if (Math.abs(e.x) + e.width / 2 > ROAD_HALF_WIDTH + 0.2) return this.end('collision', { with: 'road edge', kind: 'left the road' });
    for (const c of w.crossings) {
      const st = this._crossingState.get(c.id) || { passed: false, stopped: false };
      const toLine = c.stopLineZ - (e.z + half);
      if (!st.passed && !st.stopped && e.speed < 0.3 && toLine < 8 && toLine > -1) { st.stopped = true; this.metrics.stopsAtCrossings++; }
      if (!st.passed && toLine <= 0) {
        st.passed = true; this.metrics.crossingsPassed++;
        if (w.pedestrians.some(p => p.crossingId === c.id && p.state === 'crossing' && onRoad(p))) this.metrics.enteredOccupiedCrossing++;
      }
      this._crossingState.set(c.id, st);
    }
    if (e.z >= w.length) return this.end('finish', {});
    if (this.time >= this.timeLimit) return this.end('timeout', {});
  }
  end(reason, extra) {
    this.result = { reason, ...extra, time_s: round(this.time, 2), distance_m: round(this.ego.z, 0), success: reason === 'finish' };
    if (reason === 'collision') this.ego.speed = 0;
  }
  summary() {
    const m = this.metrics;
    return {
      seed: this.seed, traffic: this.traffic, road_length_m: this.world.length, target_seconds: this.targetSeconds, time_limit_s: this.timeLimit, result: this.result, time_s: round(this.time, 2), distance_m: round(this.ego.z, 0),
      decisions: m.decisions, maneuver_changes: m.maneuverChanges, lane_changes: m.laneChanges, overtakes_completed: m.overtakes,
      seconds_in_left_lane: round(m.leftLaneSeconds), min_gap_ahead_m: m.minGapAhead === Infinity ? null : round(m.minGapAhead), min_oncoming_ttc_s: m.minOncomingTtc === Infinity ? null : round(m.minOncomingTtc),
      speeding_seconds: round(m.speedingSeconds), max_over_limit_kmh: round(Math.max(0, m.maxOverKmh), 0), crossings_passed: m.crossingsPassed, stops_at_crossings: m.stopsAtCrossings, entered_occupied_crossing: m.enteredOccupiedCrossing,
      stale_decisions: m.staleDecisions, maneuver_counts: m.maneuverCounts
    };
  }
}
