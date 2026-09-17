import { CAMERA_CONFIG, intersectsBeforeTarget } from './perception.mjs';
import { cameraMount } from './vehicle.mjs';
import { NO_PASS_APPROACH_M, NO_PASS_BEYOND_M } from './traffic.mjs';

const round = v => Number(v.toFixed(2));
function camerasSeeing(ego, point, objects, range) {
  return Object.entries(CAMERA_CONFIG).filter(([, config]) => {
    const origin = cameraMount(ego, config);
    const dx = point.x - origin.x, dz = point.z - origin.z;
    if (Math.hypot(dx, dz) > Math.min(range, config.range_m)) return false;
    const angle = Math.atan2(Math.sin(Math.atan2(dx, dz) - origin.yaw), Math.cos(Math.atan2(dx, dz) - origin.yaw));
    if (Math.abs(angle) > config.horizontal_fov_deg * Math.PI / 360) return false;
    return !objects.some(o => intersectsBeforeTarget(origin, point, o));
  }).map(([name]) => name);
}

export function observeRoad(ego, signs, crossings, objects) {
  const visible_signs = signs.filter(s => s.z >= ego.z).flatMap(sign => {
    const seen_by = camerasSeeing(ego, { x: sign.x, z: sign.z }, objects, 90);
    return seen_by.length ? [{ id: sign.id, limit_kmh: sign.limit, distance_m: round(sign.z - ego.z), seen_by }] : [];
  }).sort((a, b) => a.distance_m - b.distance_m);
  const visible_crosswalks = crossings.filter(c => c.z >= ego.z - 5 && c.z <= ego.z + 200).flatMap(c => {
    const seen_by = [...new Set([-3.7, 0, 3.7].flatMap(x => camerasSeeing(ego, { x, z: c.z }, objects, 200)))];
    return seen_by.length ? [{ id: c.id, distance_m: round(c.z - ego.z), seen_by }] : [];
  });
  const zones = crossings.map(c => ({ id: c.id, start: c.z - NO_PASS_APPROACH_M, end: c.z + NO_PASS_BEYOND_M }));
  const no_passing_segments = zones.filter(z => z.end >= ego.z && z.start <= ego.z + 200).flatMap(z => {
    const point = { x: 0, z: Math.min(z.end, Math.max(ego.z + 3, z.start)) };
    const seen_by = [...new Set([...camerasSeeing(ego, point, objects, 200), ...(visible_crosswalks.find(c => c.id === z.id)?.seen_by || [])])];
    return seen_by.length ? [{ start_distance_m: round(z.start - ego.z), end_distance_m: round(z.end - ego.z), seen_by }] : [];
  });
  return { visible_signs, visible_crosswalks, lane_markings: { current_center_line: zones.some(z => ego.z >= z.start && ego.z <= z.end) ? 'solid' : 'broken', observed_range_m: 200, no_passing_segments } };
}

export class SignMemory {
  constructor() { this.seen = new Map(); this.activeLimit = 50; this.activeId = null; this.activeSince = 0; }
  update(observations, position, time) {
    for (const sign of observations.visible_signs) {
      if (!this.seen.has(sign.id)) this.seen.set(sign.id, { id: sign.id, limit_kmh: sign.limit_kmh, position: position + sign.distance_m, first_seen_at_s: round(time), passed_at_s: null });
    }
    // Only signs actually observed can become remembered active signs. Odometry advances their distance.
    for (const sign of [...this.seen.values()].sort((a, b) => a.position - b.position)) {
      if (sign.passed_at_s === null && sign.position <= position) {
        sign.passed_at_s = round(time); this.activeLimit = sign.limit_kmh; this.activeId = sign.id; this.activeSince = round(time);
      }
    }
  }
  snapshot(position, observations) {
    const visible = new Set(observations.visible_signs.map(s => s.id));
    const history = [...this.seen.values()].map(({ position: z, ...sign }) => ({ ...sign, distance_m: round(z - position), visible_now: visible.has(sign.id) }));
    return { active_limit_kmh: this.activeLimit, active_sign_id: this.activeId, active_since_s: this.activeSince, source: this.activeId ? 'observed_sign_passed' : 'initial_50_kmh_road_rule', upcoming_signs: history.filter(s => s.passed_at_s === null).sort((a, b) => a.distance_m - b.distance_m), sign_history: history };
  }
}
