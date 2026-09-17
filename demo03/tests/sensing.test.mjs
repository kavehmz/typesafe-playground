import { test } from 'node:test';
import assert from 'node:assert/strict';
import { senseCameras, senseRadar, senseBlindSpots, senseRoad, CAMERAS } from '../sim/sensors.mjs';
import { SignMemory, CrossingMemory } from '../sim/memory.mjs';
import { buildWorld, LANE_X } from '../sim/world.mjs';
import { createEgo } from '../sim/dynamics.mjs';

const car = (id, x, z, dir = 1, speed = 4) => ({ kind: 'car', id, x, z, heading: dir === 1 ? 0 : Math.PI, dir, speed, length: 4.5, width: 1.85 });

test('front camera sees a car ahead; a car behind it is hidden by occlusion', () => {
  const ego = createEgo();
  const near = car('car-1', LANE_X.right, 40), far = car('car-2', LANE_X.right, 80);
  const cams = senseCameras(ego, [near, far]);
  const ids = cams.front.detections.map(d => d.id);
  assert.ok(ids.includes('car-1'));
  assert.ok(!ids.includes('car-2'), 'second car hidden behind the first');
  const side = senseCameras(ego, [far]);
  assert.ok(side.front.detections.some(d => d.id === 'car-2'), 'visible when nothing is in the way');
});
test('an oncoming car in the other lane is visible past a lead car', () => {
  const ego = createEgo();
  const cams = senseCameras(ego, [car('car-1', LANE_X.right, 30), car('car-2', LANE_X.left, 120, -1, 12)]);
  const onc = cams.front.detections.find(d => d.id === 'car-2');
  assert.ok(onc && onc.direction === 'oncoming' && onc.lane === 'left');
});
test('side cameras are short range and the rear camera looks backwards', () => {
  const ego = createEgo(); ego.z = 200;
  const beside = car('car-1', LANE_X.left, 201), farLeft = car('car-2', LANE_X.left, 240), behind = car('car-3', LANE_X.right, 150);
  const cams = senseCameras(ego, [beside, farLeft, behind]);
  assert.ok(cams.left.detections.some(d => d.id === 'car-1'));
  assert.ok(!cams.left.detections.some(d => d.id === 'car-2'), `left camera range ${CAMERAS.left.range} m`);
  assert.ok(cams.rear.detections.some(d => d.id === 'car-3'));
  assert.ok(!cams.front.detections.some(d => d.id === 'car-3'));
});
test('radar reports the nearest body per lane ahead and behind with closing speed', () => {
  const ego = createEgo(); ego.speed = 10;
  const r = senseRadar(ego, [car('car-1', LANE_X.right, 50, 1, 4), car('car-2', LANE_X.right, 90, 1, 4), car('car-3', LANE_X.left, 100, -1, 12), car('car-4', LANE_X.right, -40, 1, 14)]);
  assert.equal(r.front.right.id, 'car-1');
  assert.equal(r.front.left.id, 'car-3');
  assert.ok(r.front.left.closing_speed_kmh > 70, 'head-on closing speed adds both speeds');
  assert.equal(r.rear.right.id, 'car-4');
  assert.ok(r.rear.right.closing_speed_kmh > 0, 'a faster car behind is closing');
});
test('blind spot flags a car beside or just behind in the adjacent lane', () => {
  const ego = createEgo(); ego.z = 100;
  assert.equal(senseBlindSpots(ego, [car('car-1', LANE_X.left, 96)]).left.occupied, true);
  assert.equal(senseBlindSpots(ego, [car('car-1', LANE_X.left, 115)]).left.occupied, false);
  assert.equal(senseBlindSpots(ego, [car('car-1', LANE_X.left, 80)]).left.occupied, false);
  assert.equal(senseBlindSpots(ego, []).right.covers_lane, 'off road');
});
test('signs are read within range, remembered after passing, and applied only when passed', () => {
  const w = buildWorld(4);
  const ego = createEgo();
  const memory = new SignMemory();
  const thirty = w.signs.find(s => s.limit === 30);
  ego.z = thirty.z - 150;
  assert.ok(!senseRoad(ego, w, []).signs.some(s => s.id === thirty.id), 'too far to read');
  ego.z = thirty.z - 60;
  const road = senseRoad(ego, w, []);
  assert.ok(road.signs.some(s => s.id === thirty.id));
  memory.observe(road.signs, ego.z); memory.update(ego.z);
  assert.equal(memory.snapshot(ego.z).active_limit_kmh, 50, 'not yet passed');
  assert.equal(memory.snapshot(ego.z).next_sign.limit_kmh, 30);
  ego.z = thirty.z + 5; memory.update(ego.z);
  const snap = memory.snapshot(ego.z);
  assert.equal(snap.active_limit_kmh, 30);
  assert.match(snap.active_because, /passed 5 m ago/);
  ego.z = thirty.z + 500; memory.update(ego.z);
  assert.equal(memory.snapshot(ego.z).active_limit_kmh, 30, 'remembered long after it left view when nothing new was seen');
});
test('crossings are seen ahead and the next stop line is remembered', () => {
  const w = buildWorld(4);
  const ego = createEgo(); const c = w.crossings[0]; ego.z = c.z - 100;
  const road = senseRoad(ego, w, []);
  assert.ok(road.crossings.some(x => x.id === c.id));
  const mem = new CrossingMemory(); mem.observe(road.crossings, ego.z);
  assert.equal(mem.nextAhead(ego.z + 2.25).id, c.id);
  assert.equal(mem.nextAhead(c.z + 10), null);
});
