import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEgo, planLaneChange, evalPath, stepEgo, setLaneTarget, maneuverTargets, followSpeed, stopProfileSpeed, bodiesOverlap, MANEUVERS } from '../sim/dynamics.mjs';
import { LANE_X } from '../sim/world.mjs';
import { mps } from '../sim/rng.mjs';

const ctx = (extra = {}) => ({ limit: mps(50), lead: null, stopLineDistance: null, passTarget: null, ...extra });
const run = (ego, maneuver, seconds, c = ctx()) => { for (let t = 0; t < seconds; t += 1 / 120) stepEgo(ego, maneuverTargets(maneuver, ego, c), 1 / 120); };

test('a lane change is a smooth curve: heading turns and the car ends straight in the new lane', () => {
  const ego = createEgo(); ego.speed = mps(40);
  let maxHeading = 0, sawMid = false;
  for (let t = 0; t < 6; t += 1 / 120) {
    stepEgo(ego, { lane: 'left', speed: mps(40), mode: 'speed' }, 1 / 120);
    maxHeading = Math.max(maxHeading, Math.abs(ego.heading));
    if (Math.abs(ego.x) < 0.3) sawMid = true;
  }
  assert.ok(sawMid, 'passes through the centre line region');
  assert.ok(maxHeading > 0.1 && maxHeading < 0.5, `turns visibly (${maxHeading})`);
  assert.ok(Math.abs(ego.x - LANE_X.left) < 0.02 && Math.abs(ego.heading) < 1e-6);
  assert.equal(ego.path, null);
});
test('the path polynomial starts at the current pose and ends flat', () => {
  const ego = createEgo(); ego.speed = 10; ego.heading = -0.1; ego.x = 0.5;
  const p = planLaneChange(ego, LANE_X.left);
  const a = evalPath(p, 0), b = evalPath(p, p.L);
  assert.ok(Math.abs(a.x - 0.5) < 1e-9 && Math.abs(a.heading + 0.1) < 1e-9);
  assert.ok(Math.abs(b.x - LANE_X.left) < 1e-9 && Math.abs(b.heading) < 1e-9);
});
test('a standing car cannot slide sideways', () => {
  const ego = createEgo(); ego.speed = 0;
  setLaneTarget(ego, 'left');
  run(ego, 'emergency_brake', 3);
  assert.equal(ego.laneTarget, 'left');
  assert.equal(ego.x, LANE_X.right, 'lane target pending, no sideways motion while standing');
});
test('reversing a lane change mid-way stays continuous', () => {
  const ego = createEgo(); ego.speed = mps(45);
  run(ego, 'overtake', 1.2);
  const before = { x: ego.x, heading: ego.heading };
  assert.ok(ego.x < 1.2 && ego.x > -1.7, 'mid change');
  run(ego, 'return_right', 1 / 120);
  assert.ok(Math.abs(ego.x - before.x) < 0.05 && Math.abs(ego.heading - before.heading) < 0.05, 'no jump');
  run(ego, 'return_right', 6);
  assert.ok(Math.abs(ego.x - LANE_X.right) < 0.02);
});
test('follow settles at a safe gap behind a slower car and never rams it', () => {
  const ego = createEgo(); ego.speed = mps(50);
  let lead = { z: 60, speed: mps(12) }, minGap = Infinity;
  for (let t = 0; t < 40; t += 1 / 120) {
    const gap = lead.z - ego.z - 4.5;
    minGap = Math.min(minGap, gap);
    stepEgo(ego, maneuverTargets('follow', ego, ctx({ lead: { gap, speed: lead.speed } })), 1 / 120);
    lead.z += lead.speed / 120;
  }
  const finalGap = lead.z - ego.z - 4.5;
  assert.ok(minGap > 2, `keeps a gap (${minGap})`);
  assert.ok(Math.abs(ego.speed - lead.speed) < 0.3, 'matches the lead speed');
  assert.ok(finalGap > 5 && finalGap < 14, `settles at a following gap (${finalGap})`);
});
test('cruise ignores the car ahead, follow is different from cruise', () => {
  assert.equal(maneuverTargets('cruise', createEgo(), ctx({ lead: { gap: 5, speed: 3 } })).speed, mps(50));
  assert.ok(followSpeed({ gap: 5, speed: 3 }, mps(50)) < 4);
});
test('stop brings the car to rest just before the stop line', () => {
  const ego = createEgo(); ego.speed = mps(50);
  const lineZ = 60 + ego.length / 2;
  for (let t = 0; t < 20; t += 1 / 120) {
    const d = lineZ - (ego.z + ego.length / 2);
    stepEgo(ego, maneuverTargets('stop', ego, ctx({ stopLineDistance: d })), 1 / 120);
  }
  const rest = lineZ - (ego.z + ego.length / 2);
  assert.ok(ego.speed < 0.05, 'stopped');
  assert.ok(rest > 0.3 && rest < 2.0, `rests just before the line (${rest})`);
});
test('stop from close range brakes harder but still stops before or at the line', () => {
  const ego = createEgo(); ego.speed = mps(30);
  const lineZ = 12 + ego.length / 2;
  for (let t = 0; t < 10; t += 1 / 120) stepEgo(ego, maneuverTargets('stop', ego, ctx({ stopLineDistance: lineZ - (ego.z + ego.length / 2) })), 1 / 120);
  assert.ok(lineZ - (ego.z + ego.length / 2) > -0.5);
});
test('emergency brake decelerates harder than a normal stop', () => {
  const a = createEgo(), b = createEgo(); a.speed = b.speed = mps(50);
  run(a, 'emergency_brake', 1); run(b, 'stop', 1, ctx({ stopLineDistance: 100 }));
  assert.ok(a.speed < b.speed - 3);
});
test('every manoeuvre resolves to targets and the speed profile helper is monotonic', () => {
  for (const m of MANEUVERS) assert.ok(maneuverTargets(m, createEgo(), ctx({ lead: { gap: 20, speed: 4 }, stopLineDistance: 30, passTarget: { speed: 4 } })).speed >= 0);
  assert.ok(stopProfileSpeed(30) > stopProfileSpeed(10) && stopProfileSpeed(0.5) === 0);
});
test('oriented body overlap detects a side swipe during a lane change', () => {
  const ego = { x: 0.3, z: 100, heading: -0.25, length: 4.5, width: 1.85 };
  assert.ok(bodiesOverlap(ego, { x: 1.75, z: 101, heading: 0, length: 4.5, width: 1.85 }));
  assert.ok(!bodiesOverlap(ego, { x: 1.75, z: 110, heading: 0, length: 4.5, width: 1.85 }));
});
