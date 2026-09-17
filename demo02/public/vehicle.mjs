// Actuators only: follow the lane and numerical speed chosen by Jev.
// No vehicle, pedestrian, sign, gap or collision data is used here.
export const WHEELBASE_M = 2.7;
export const TARGET_SPEED_KEYS = [...Array.from({ length: 51 }, (_, n) => String(n)), 'emergency'];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function speedTargetAcceleration(speed, targetMps, emergency = false) {
  return emergency ? -9 : clamp((targetMps - speed) * 1.6, -4.5, 2.5);
}
export function projectSpeedTarget(speed, targetMps, seconds, emergency = false) {
  let v = speed, distance = 0, remaining = seconds;
  while (remaining > 1e-8) {
    const dt = Math.min(remaining, 1 / 60), next = clamp(v + speedTargetAcceleration(v, targetMps, emergency) * dt, 0, 22);
    distance += (v + next) / 2 * dt; v = next; remaining -= dt;
  }
  return { speed_mps: v, distance_m: distance };
}

export function createLanePath(ego, targetX, speed = ego.speed) {
  const length = Math.max(14, speed * 3);
  const slope = Math.tan(ego.headingRad || 0);
  const a1 = slope * length, a2 = .5 * (ego.curvature || 0) * (1 + slope * slope) ** 1.5 * length * length;
  const d = targetX - ego.x;
  return { startZ: ego.z, length, targetX, coefficients: [ego.x, a1, a2, 10 * d - 6 * a1 - 3 * a2, -15 * d + 8 * a1 + 3 * a2, 6 * d - 3 * a1 - a2] };
}
export function evaluateLanePath(path, distance) {
  const t = clamp(distance / path.length, 0, 1), a = path.coefficients;
  const x = a[0] + a[1] * t + a[2] * t ** 2 + a[3] * t ** 3 + a[4] * t ** 4 + a[5] * t ** 5;
  const slope = (a[1] + 2 * a[2] * t + 3 * a[3] * t ** 2 + 4 * a[4] * t ** 3 + 5 * a[5] * t ** 4) / path.length;
  const second = (2 * a[2] + 6 * a[3] * t + 12 * a[4] * t ** 2 + 20 * a[5] * t ** 3) / path.length ** 2;
  return { x, heading: Math.atan(slope), curvature: second / (1 + slope * slope) ** 1.5, slope };
}
export function remainingLanePathMetres(ego) {
  if (!ego.lanePath) return 0;
  const path = ego.lanePath, start = clamp(ego.z - path.startZ, 0, path.length), step = (path.length - start) / 20;
  let metres = 0;
  for (let i = 0; i < 20; i++) metres += Math.hypot(1, evaluateLanePath(path, start + (i + .5) * step).slope) * step;
  return metres;
}
export function laneChangeSeconds(ego, targetX, speed = ego.speed) {
  if (Math.abs(targetX - ego.x) < .06 && Math.abs(ego.headingRad || 0) < .015) return 0;
  if (speed < .1) return null;
  const copy = { ...ego, lanePath: ego.lanePath?.targetX === targetX ? ego.lanePath : createLanePath(ego, targetX, speed) };
  return remainingLanePathMetres(copy) / speed;
}
export function advanceOnLanePath(ego, travelledMetres, targetX) {
  if (!ego.lanePath && (Math.abs(ego.x - targetX) > .01 || Math.abs(ego.headingRad || 0) > .005)) ego.lanePath = createLanePath(ego, targetX);
  if (!ego.lanePath) { ego.z += travelledMetres; ego.headingRad = 0; ego.curvature = 0; ego.steeringAngle = 0; return; }
  if (travelledMetres <= 0) return; // No sideways motion when stopped.
  const path = ego.lanePath, distance = ego.z - path.startZ, current = evaluateLanePath(path, distance);
  const forwardStep = travelledMetres / Math.hypot(1, current.slope);
  const remaining = path.length - distance;
  if (forwardStep >= remaining) {
    ego.z = path.startZ + path.length + Math.max(0, travelledMetres - remaining * Math.hypot(1, current.slope));
    ego.x = path.targetX; ego.headingRad = 0; ego.curvature = 0; ego.steeringAngle = 0; ego.lanePath = null;
  } else {
    ego.z += forwardStep;
    const next = evaluateLanePath(path, ego.z - path.startZ);
    ego.x = next.x; ego.headingRad = next.heading; ego.curvature = next.curvature; ego.steeringAngle = Math.atan(WHEELBASE_M * next.curvature);
  }
}
export function longitudinalHalfExtent(vehicle) {
  const yaw = vehicle.headingRad || 0;
  return Math.abs(Math.cos(yaw)) * vehicle.length / 2 + Math.abs(Math.sin(yaw)) * vehicle.width / 2;
}
export function lateralHalfExtent(vehicle) {
  const yaw = vehicle.headingRad || 0;
  return Math.abs(Math.cos(yaw)) * vehicle.width / 2 + Math.abs(Math.sin(yaw)) * vehicle.length / 2;
}
export function bodiesOverlap(a, b) {
  const axes = v => [{ x: Math.cos(v.headingRad || 0), z: -Math.sin(v.headingRad || 0) }, { x: Math.sin(v.headingRad || 0), z: Math.cos(v.headingRad || 0) }];
  const aa = axes(a), bb = axes(b), dx = b.x - a.x, dz = b.z - a.z;
  const projection = (v, basis, axis) => v.width / 2 * Math.abs(basis[0].x * axis.x + basis[0].z * axis.z) + v.length / 2 * Math.abs(basis[1].x * axis.x + basis[1].z * axis.z);
  return [...aa, ...bb].every(axis => Math.abs(dx * axis.x + dz * axis.z) < projection(a, aa, axis) + projection(b, bb, axis));
}
export function cameraMount(ego, config) {
  const yaw = ego.headingRad || 0, sin = Math.sin(yaw), cos = Math.cos(yaw);
  return { x: ego.x + config.mount_x_m * cos + config.mount_z_m * sin, z: ego.z - config.mount_x_m * sin + config.mount_z_m * cos, yaw: yaw + config.yaw_rad };
}
