// Background traffic and pedestrians. Simple, deterministic rules: keep to a cruise speed,
// respect posted limits, follow the car ahead, yield at an occupied crossing. Oncoming cars do NOT
// react to the ego car: a head-on conflict is a real collision, never quietly avoided for it.
import { clamp, mps } from './rng.mjs';
import { KERB_X, ROAD_HALF_WIDTH, postedLimitAt } from './world.mjs';

export function crossingOccupied(world, crossingId) {
  return world.pedestrians.some(p => p.crossingId === crossingId && (p.state === 'crossing' || (p.state === 'waiting' && p.startedAt !== null)));
}
export function onRoad(p) { return Math.abs(p.x) < ROAD_HALF_WIDTH + 0.35; }

export function updatePedestrians(world, ego, dt, time) {
  for (const p of world.pedestrians) {
    const c = world.crossings.find(c => c.id === p.crossingId);
    if (p.state === 'waiting') {
      if (p.startedAt === null && ego.z < c.z && c.z - ego.z <= p.triggerDistance) p.startedAt = time + p.delay;
      if (p.startedAt !== null && time >= p.startedAt) p.state = 'crossing';
    }
    if (p.state === 'crossing') {
      p.x -= p.kerbSide * p.walkSpeed * dt;
      if (p.kerbSide * p.x <= -KERB_X) { p.x = -p.kerbSide * KERB_X; p.state = 'done'; }
    }
  }
}

export function updateCars(world, ego, dt, rng) {
  const cars = world.cars;
  let maxOncomingZ = -Infinity;
  for (const c of cars) if (c.dir === -1) maxOncomingZ = Math.max(maxOncomingZ, c.z);
  for (const car of cars) {
    let allowed = Math.min(car.cruise, mps(postedLimitAt(world, car.z)));
    // Follow the nearest same-direction car in the same lane.
    let lead = null, leadGap = Infinity;
    for (const o of cars) {
      if (o === car || o.dir !== car.dir || o.lane !== car.lane) continue;
      const gap = car.dir * (o.z - car.z) - car.length;
      if (gap > -car.length && gap < leadGap) { lead = o; leadGap = gap; }
    }
    if (car.dir === 1 && Math.abs(ego.x - car.x) < 2.2 && ego.z > car.z) {
      const gap = ego.z - car.z - car.length;
      if (gap < leadGap) { lead = { speed: ego.speed }; leadGap = gap; }
    }
    if (lead && leadGap < 70) allowed = Math.min(allowed, Math.max(0, lead.speed + 0.6 * (leadGap - (4 + 1.0 * lead.speed))));
    // Yield before an occupied crossing.
    car.yielding = false;
    for (const c of world.crossings) {
      const stopPoint = c.z - car.dir * (3 + car.length / 2);
      const dist = car.dir * (stopPoint - car.z);
      if (dist > 0 && dist < 70 && crossingOccupied(world, c.id)) {
        allowed = Math.min(allowed, Math.sqrt(2 * 2.5 * Math.max(0, dist - 0.8)));
        car.yielding = true;
      }
    }
    car.speed = clamp(car.speed + clamp(allowed - car.speed, -5 * dt, 1.5 * dt), 0, 30);
    car.z += car.dir * car.speed * dt;
    // Recycle oncoming cars that are well behind the ego so the left lane never runs dry.
    if (car.dir === -1 && car.z < ego.z - 90) {
      car.z = Math.max(ego.z + 420, maxOncomingZ + rng.float(...world.oncomingGap));
      car.speed = car.cruise = mps(rng.float(30, 50));
      maxOncomingZ = car.z;
    }
  }
}
