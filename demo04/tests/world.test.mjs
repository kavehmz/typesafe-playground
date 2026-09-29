import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWorld, postedLimitAt, centreLineAt, TRAFFIC_LEVELS } from '../sim/world.mjs';

test('same seed gives the same world, different seeds give different traffic', () => {
  const a = buildWorld(11), b = buildWorld(11), c = buildWorld(12);
  assert.deepEqual(a.cars.map(x => [x.z, x.speed]), b.cars.map(x => [x.z, x.speed]));
  assert.notDeepEqual(a.cars.map(x => Math.round(x.z)), c.cars.map(x => Math.round(x.z)));
});
test('right-lane cars are slow (10-20 km/h), spaced apart and not all the same speed', () => {
  for (let seed = 1; seed <= 60; seed++) for (const level of TRAFFIC_LEVELS) {
    const w = buildWorld(seed, level);
    const ahead = w.cars.filter(c => c.dir === 1).sort((a, b) => a.z - b.z);
    assert.ok(ahead.length >= 3, 'at least three slow cars');
    for (const c of ahead) assert.ok(c.speed * 3.6 >= 9 && c.speed * 3.6 <= 21, `speed ${c.speed * 3.6}`);
    for (let i = 1; i < ahead.length; i++) assert.ok(ahead[i].z - ahead[i - 1].z >= 60, 'gap between slow cars');
    assert.ok(new Set(ahead.map(c => Math.round(c.speed * 3.6 / 2.5))).size >= 2, 'speeds differ');
    assert.ok(ahead[0].z >= 60, 'first car is not on top of the ego');
  }
});
test('oncoming cars drive toward the ego at 30-50 km/h with passing gaps', () => {
  const w = buildWorld(5);
  const onc = w.cars.filter(c => c.dir === -1).sort((a, b) => a.z - b.z);
  assert.ok(onc.length >= 3);
  for (let i = 1; i < onc.length; i++) assert.ok(onc[i].z - onc[i - 1].z >= 200, 'gaps leave room to overtake');
  for (const c of onc) { assert.equal(c.lane, 'left'); assert.ok(c.speed * 3.6 >= 29 && c.speed * 3.6 <= 51); }
  for (let i = 1; i < onc.length; i++) assert.ok(onc[i].z - onc[i - 1].z >= 60);
});
test('crossings sit inside the route with a 30 zone around each and a solid line nearby', () => {
  const w = buildWorld(3);
  assert.equal(w.crossings.length, 2);
  assert.equal(buildWorld(3, 'dense').crossings.length, 3);
  for (const c of w.crossings) {
    assert.ok(c.z > 200 && c.z < w.length - 80);
    assert.equal(postedLimitAt(w, c.z), 30);
    assert.equal(postedLimitAt(w, c.z + 60), 50);
    assert.equal(centreLineAt(w, c.z - 10), 'solid');
    assert.equal(centreLineAt(w, c.z - 45), 'broken');
  }
  assert.equal(postedLimitAt(w, 0), 50);
  assert.ok(w.pedestrians.every(p => w.crossings.some(c => c.id === p.crossingId)));
});
test('traffic levels change how busy the road is', () => {
  const light = buildWorld(9, 'light'), dense = buildWorld(9, 'dense');
  assert.ok(dense.cars.length > light.cars.length);
  assert.ok(dense.pedestrians.length >= light.pedestrians.length);
});
test('a longer drive scales crossings, slow cars and signs with the road', () => {
  const short = buildWorld(8, 'normal', 840), long = buildWorld(8, 'normal', 2800);
  assert.equal(short.crossings.length, 2);
  assert.ok(long.crossings.length >= 6 && long.crossings.length <= 8, `crossings ${long.crossings.length}`);
  assert.ok(long.cars.filter(c => c.dir === 1).length >= 12, 'slow cars all along the road');
  assert.ok(long.signs.length === long.crossings.length * 2 + 1);
  const zs = long.crossings.map(c => c.z);
  for (let i = 1; i < zs.length; i++) assert.ok(zs[i] - zs[i - 1] > 250, 'crossings keep their distance');
  assert.ok(Math.max(...zs) < long.length - 80 && Math.min(...zs) > 200);
});
