import { longitudinalHalfExtent } from './vehicle.mjs';
export const FRONT_RADAR_RANGE_M = 360;
export const REAR_RADAR_RANGE_M = 65;
export const FORWARD_CAMERA_RANGE_M = 220;
export const NO_PASS_APPROACH_M = 35;
export const NO_PASS_BEYOND_M = 15;
const round = (v, digits = 2) => Number(v.toFixed(digits));

export function forwardVelocity(object) {
  return (object.kind === 'car' ? (object.travelDirection ?? 1) : 1) * object.speed;
}
export function observeObject(object, ego) {
  const forward = object.z - ego.z, overlap = Math.abs(forward) < (longitudinalHalfExtent(ego) + object.length / 2);
  const velocity = forwardVelocity(object);
  return {
    id: `${object.kind}-${object.id}`, kind: object.kind, lane: object.lane,
    travel_direction: object.kind === 'car' ? ((object.travelDirection ?? 1) < 0 ? 'oncoming' : 'same_direction') : 'stationary_longitudinally',
    offset_forward_m: round(forward), offset_right_m: round(object.x - ego.x),
    length_m: object.length, width_m: object.width, speed_mps: round(object.speed),
    forward_velocity_mps: round(velocity), relative_forward_speed_mps: round(velocity - ego.speed * Math.cos(ego.headingRad || 0)),
    lateral_speed_mps: round(object.lateralSpeed || 0),
    ...(object.kind === 'pedestrian' ? { motion: object.motion, crossing_id: object.crossingId } : {}),
    longitudinal_gap_m: round(Math.max(0, Math.abs(forward) - (longitudinalHalfExtent(ego) + object.length / 2))),
    longitudinal_overlap: overlap, relation: overlap ? 'alongside' : forward >= 0 ? 'ahead' : 'behind'
  };
}
