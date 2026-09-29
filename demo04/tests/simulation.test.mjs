import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../sim/simulation.mjs';
import { sanitizeSituation } from '../server.mjs';
import { LANE_X } from '../sim/world.mjs';
import * as fusion from '../sim/fusion.mjs';
globalThis.__fusion = fusion;

const drive = (sim, maneuver, seconds, pace = 50) => { for (let t = 0; t < seconds && !sim.result; t += 1 / 60) { sim.applyDecision({ maneuver, pace }, 0); sim.step(1 / 60); } };

test('the fused situation validates against the server schema throughout a scripted drive', () => {
  const sim = new Simulation({ seed: 7 });
  const script = t => t < 5 ? 'cruise' : t < 9 ? 'follow' : t < 14 ? 'overtake' : t < 20 ? 'return_right' : t < 28 ? 'follow' : 'stop';
  for (let t = 0; t < 30 && !sim.result; t += 0.5) {
    drive(sim, script(t), 0.5);
    const s = sim.situation();
    const clean = sanitizeSituation(s);
    assert.ok(Array.isArray(clean.rules) && clean.rules.length >= 5, 'server injects the rules');
    assert.ok(JSON.stringify(s).length < 12000, 'payload stays compact');
  }
});
test('following a slow car matches its speed instead of stopping', () => {
  const sim = new Simulation({ seed: 7 });
  drive(sim, 'follow', 25);
  const lead = sim.world.cars.filter(c => c.dir === 1 && c.z > sim.ego.z).sort((a, b) => a.z - b.z)[0];
  assert.ok(Math.abs(sim.ego.speed - lead.speed) < 0.5, `matches ${lead.speed} vs ${sim.ego.speed}`);
  assert.ok(lead.z - sim.ego.z - 4.5 > 4, 'keeps a gap');
  assert.equal(sim.result, null);
});
test('driving into the oncoming lane blindly ends in a real head-on collision', () => {
  const sim = new Simulation({ seed: 7 });
  drive(sim, 'overtake', 40);
  assert.equal(sim.result?.reason, 'collision');
  assert.equal(sim.result.kind, 'oncoming car');
  assert.ok(sim.metrics.leftLaneSeconds > 3);
});
test('an overtake is counted only after returning right behind a passed car', () => {
  const sim = new Simulation({ seed: 7 });
  drive(sim, 'follow', 9);
  drive(sim, 'overtake', 3.5);
  assert.ok(sim.passTargetId, 'remembers the car it set out to pass');
  const s = sim.situation();
  assert.ok(s.being_passed && ['alongside', 'behind', 'still ahead'].includes(s.being_passed.position));
  drive(sim, 'return_right', 5);
  assert.equal(sim.passTargetId, null);
  assert.equal(sim.metrics.overtakes, 1);
  assert.ok(Math.abs(sim.ego.x - LANE_X.right) < 0.05);
});
test('stale or unknown decisions are rejected and counted', () => {
  const sim = new Simulation({ seed: 7 });
  assert.equal(sim.applyDecision({ maneuver: 'cruise', pace: 50 }, 2.5).applied, false);
  assert.equal(sim.metrics.staleDecisions, 1);
  assert.equal(sim.applyDecision({ maneuver: 'teleport', pace: 50 }, 0).applied, false);
  assert.equal(sim.applyDecision({ maneuver: 'cruise', pace: 40 }, 0).applied, false);
  assert.equal(sim.applyDecision({ maneuver: 'cruise', pace: '30' }, 0.3).applied, true);
  assert.equal(sim.ego.pace, 30);
});
test('pace 30 caps cruising speed; posted limits never clamp the car by themselves', () => {
  const sim = new Simulation({ seed: 7 });
  drive(sim, 'cruise', 6, 30);
  assert.ok(sim.ego.speed * 3.6 < 31 && sim.ego.speed * 3.6 > 28);
  const sim2 = new Simulation({ seed: 7 });
  drive(sim2, 'cruise', 4, 50);
  assert.ok(sim2.ego.speed * 3.6 > 45);
});
test('stopping for a crossing rests before the stop line and pedestrians keep walking', () => {
  const sim = new Simulation({ seed: 7 });
  const c = sim.world.crossings[0];
  sim.ego.z = c.z - 120; sim.ego.speed = 30 / 3.6;
  for (const car of sim.world.cars) if (car.dir === 1) car.z += 400; // clear the lane for this check
  drive(sim, 'cruise', 1.5, 30);
  drive(sim, 'stop', 22, 30);
  const front = sim.ego.z + sim.ego.length / 2;
  assert.ok(sim.ego.speed < 0.05);
  assert.ok(c.stopLineZ - front > 0.3 && c.stopLineZ - front < 2.5, `rests before the line (${c.stopLineZ - front})`);
  assert.ok(sim.world.pedestrians.some(p => p.crossingId === c.id && p.state !== 'waiting'), 'people started crossing');
  assert.equal(sim.metrics.stopsAtCrossings, 1);
});
test('a run finishes at the end of the road and restarts fresh with a new seed', () => {
  const sim = new Simulation({ seed: 7 });
  for (const car of sim.world.cars) car.z += 3000;
  for (const p of sim.world.pedestrians) p.z -= 3000;
  sim.ego.z = sim.world.length - 100;
  drive(sim, 'cruise', 20);
  assert.equal(sim.result?.reason, 'finish');
  sim.reset({ seed: 8 });
  assert.equal(sim.result, null); assert.equal(sim.time, 0); assert.equal(sim.seed, 8);
});
test('oncoming cars are recycled ahead so the left lane never empties', () => {
  const sim = new Simulation({ seed: 7 });
  for (const car of sim.world.cars) if (car.dir === 1) car.z += 1000;
  drive(sim, 'cruise', 60);
  const ahead = sim.world.cars.filter(c => c.dir === -1 && c.z > sim.ego.z);
  assert.ok(ahead.length >= 3, `oncoming cars still ahead: ${ahead.length}`);
});
test('short-term pedestrian memory keeps people that a car just hid, then forgets them', () => {
  const sim = new Simulation({ seed: 7 });
  const c = sim.world.crossings[0];
  for (const car of sim.world.cars) car.z += 2000;
  sim.ego.z = c.z - 60; sim.ego.speed = 0;
  sim.tick++; let s = sim.situation();
  assert.ok(s.crossing.people.length > 0 && s.crossing.people.every(p => p.seen === 'now'));
  // hide them with a car parked right in front of the camera
  sim.world.cars[0].z = sim.ego.z + 8; sim.world.cars[0].x = LANE_X.right; sim.world.cars[0].dir = 1; sim.world.cars[0].heading = 0;
  sim.tick++; s = sim.situation();
  assert.ok(s.crossing.people.length > 0 && s.crossing.people.every(p => /last seen/.test(p.seen)), 'remembered while hidden');
  assert.equal(s.crossing.all_clear, false);
  sim.time += 5; sim.tick++; s = sim.situation();
  assert.equal(s.crossing.people.length, 0);
  assert.equal(s.crossing.nobody_detected, true);
  assert.equal(s.crossing.all_clear, false, 'not seeing anyone is not the same as clear');
});
test('people who finished crossing are not counted as waiting', () => {
  const sim = new Simulation({ seed: 7 });
  const c = sim.world.crossings[0];
  for (const car of sim.world.cars) car.z += 2000;
  for (const p of sim.world.pedestrians) if (p.crossingId === c.id) { p.state = 'done'; p.x = -p.kerbSide * 5; }
  sim.ego.z = c.stopLineZ - 30; sim.ego.speed = 0; sim.tick++;
  const s = sim.situation();
  assert.ok(s.crossing.people.length > 0);
  assert.equal(s.crossing.people_waiting_at_kerb, 0);
  assert.equal(s.crossing.people_on_road, 0);
  assert.equal(s.crossing.people_finished, s.crossing.people.length);
  assert.equal(s.crossing.all_clear, true);
  assert.equal(sanitizeSituation(s).crossing.all_clear, true);
});
test('the overtake estimate does not flip from surplus to thin merely because the car speeds up', () => {
  const { overtakeEstimate } = await_import();
  const markings = { centre_line_here: 'broken', solid_section_starts_in_m: null, solid_section_ends_in_m: null };
  const target = { id: 'car-1', speed_kmh: 10, forward_m: 8 };
  const oncoming = { id: 'car-9', distance_m: 187, speed_kmh: 40 };
  const slow = overtakeEstimate({ ego: { speed: 3, heading: 0 }, target, oncoming, limit: 50 / 3.6, markings, crossing: null, inLeftLane: false });
  const fast = overtakeEstimate({ ego: { speed: 12, heading: 0 }, target: { ...target, forward_m: 2 }, oncoming: { ...oncoming, distance_m: 150 }, limit: 50 / 3.6, markings, crossing: null, inLeftLane: true });
  assert.ok(slow.possible && fast.possible);
  assert.ok(Math.abs(slow.margin_s - fast.margin_s) < 2.5, `margins stay consistent along the pass (${slow.margin_s} vs ${fast.margin_s})`);
  assert.ok(slow.time_available_s < 187 / (3 + 40 / 3.6), 'time available accounts for the car accelerating, not its starting speed');
});
function await_import() { return globalThis.__fusion; }
test('the time cap follows the chosen drive length', () => {
  const a = new Simulation({ seed: 1 }), b = new Simulation({ seed: 1, length: 2800, targetSeconds: 300 });
  assert.equal(a.timeLimit, 180);
  assert.equal(b.timeLimit, 600);
  assert.equal(b.summary().road_length_m, 2800);
});
