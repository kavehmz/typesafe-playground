// The rendering cameras and synthetic detectors share their mounts, range and horizontal field of view.
// Coordinates: +z forward along the road, +x to the driver's right. This is idealized 2D perception.
export const CAMERA_CONFIG = {
  front: { range_m: 110, horizontal_fov_deg: 100, yaw_rad: 0, mount_x_m: 0, mount_z_m: 2.25 },
  left: { range_m: 35, horizontal_fov_deg: 150, yaw_rad: -Math.PI / 2, mount_x_m: -1, mount_z_m: 0 },
  right: { range_m: 35, horizontal_fov_deg: 150, yaw_rad: Math.PI / 2, mount_x_m: 1, mount_z_m: 0 },
  rear: { range_m: 65, horizontal_fov_deg: 110, yaw_rad: Math.PI, mount_x_m: 0, mount_z_m: -2.25 }
};
const round = (v, digits = 2) => Number(v.toFixed(digits));

export function intersectsBeforeTarget(origin, point, object) {
  let near = 0, far = 1;
  for (const [axis, size] of [['x', 'width'], ['z', 'length']]) {
    const delta = point[axis] - origin[axis], low = object[axis] - object[size] / 2, high = object[axis] + object[size] / 2;
    if (Math.abs(delta) < 1e-8) { if (origin[axis] < low || origin[axis] > high) return false; }
    else {
      const a = (low - origin[axis]) / delta, b = (high - origin[axis]) / delta;
      near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
      if (near > far) return false;
    }
  }
  return far > .001 && near < .999;
}

export function observeCameras(ego, objects) {
  return Object.fromEntries(Object.entries(CAMERA_CONFIG).map(([direction, config]) => {
    const origin = { x: ego.x + config.mount_x_m, z: ego.z + config.mount_z_m };
    const halfFov = config.horizontal_fov_deg * Math.PI / 360;
    const nearby = objects.filter(o => Math.hypot(o.x - origin.x, o.z - origin.z) < config.range_m + Math.hypot(o.width, o.length));
    const visible = nearby.filter(object => {
      // Sample the object's footprint so partially visible cars are retained; full occlusion removes them.
      const points = [];
      for (const dx of [-.5, 0, .5]) for (const dz of [-.5, 0, .5]) points.push({ x: object.x + dx * object.width, z: object.z + dz * object.length });
      return points.some(point => {
        const dx = point.x - origin.x, dz = point.z - origin.z;
        if (Math.hypot(dx, dz) > config.range_m) return false;
        const angle = Math.atan2(Math.sin(Math.atan2(dx, dz) - config.yaw_rad), Math.cos(Math.atan2(dx, dz) - config.yaw_rad));
        if (Math.abs(angle) > halfFov) return false;
        return !nearby.some(other => other !== object && intersectsBeforeTarget(origin, point, other));
      });
    }).sort((a, b) => Math.hypot(a.x - ego.x, a.z - ego.z) - Math.hypot(b.x - ego.x, b.z - ego.z)).slice(0, 8);
    return [direction, {
      range_m: config.range_m, horizontal_fov_deg: config.horizontal_fov_deg,
      detections: visible.map(o => {
        const forward = o.z - ego.z, overlap = Math.abs(forward) < (ego.length + o.length) / 2;
        return {
          id: `${o.kind}-${o.id}`, kind: o.kind, lane: o.lane,
          offset_forward_m: round(forward), offset_right_m: round(o.x - ego.x),
          length_m: o.length, width_m: o.width, speed_mps: round(o.speed),
          relative_forward_speed_mps: round(o.speed - ego.speed),
          lateral_speed_mps: round(o.lateralSpeed || 0),
          ...(o.kind === 'pedestrian' ? { motion: o.motion, crossing_id: o.crossingId } : {}),
          longitudinal_gap_m: round(Math.max(0, Math.abs(forward) - (ego.length + o.length) / 2)),
          longitudinal_overlap: overlap, relation: overlap ? 'alongside' : forward >= 0 ? 'ahead' : 'behind'
        };
      })
    }];
  }));
}
