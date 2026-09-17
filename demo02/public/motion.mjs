// Measurements and idealized kinematics only. This module never selects or changes a driving action.
import { FRONT_RADAR_RANGE_M } from './traffic.mjs';
import { projectSpeedTarget } from './vehicle.mjs';
export const CONTROL_INTERVAL_MS = 800;
export const SENSOR_SCHEMA = 'natural-drive-v4';
export const STOP_LINE_SETBACK_M = 6;
export const ACTION_ACCELERATIONS = Object.freeze({ accelerate: 3, ease: 1, coast: 0, slow: -1.5, brake: -5, emergency: -9 });
const round = v => Number(v.toFixed(2));

export function projectMotion(speed, acceleration, seconds) {
  const v = Math.max(0, Math.min(22, speed));
  const untilBound = acceleration < 0 ? v / -acceleration : acceleration > 0 ? (22 - v) / acceleration : seconds;
  const t = Math.max(0, Math.min(seconds, untilBound));
  const finalSpeed = Math.max(0, Math.min(22, v + acceleration * t));
  return { speed_mps: finalSpeed, distance_m: v * t + .5 * acceleration * t * t + finalSpeed * (seconds - t) };
}

export function buildMotionContext(state) {
  const v = state.ego.speed_mps;
  const measuredRtt = state.control_timing?.recent_round_trip_ms ?? null;
  const responseSeconds = (measuredRtt ?? 400) / 1000;
  const interval = CONTROL_INTERVAL_MS / 1000;
  const reactionHorizon = responseSeconds + interval;
  const oldAcceleration = ACTION_ACCELERATIONS[state.ego.current_control] ?? 0;
  const duringResponse = state.ego.command_kind === 'speed_target' ? projectSpeedTarget(v, (state.ego.target_speed_kmh || 0) / 3.6, responseSeconds, state.ego.current_control === 'emergency') : projectMotion(v, oldAcceleration, responseSeconds);
  // A conservative planning window covers a full decision period plus the most recent observed RTT.
  const beforeNextOpportunity = state.ego.command_kind === 'speed_target'
    ? projectSpeedTarget(v, Math.max(v, (state.ego.target_speed_kmh || 0) / 3.6), reactionHorizon)
    : projectMotion(v, Math.max(0, oldAcceleration), reactionHorizon);
  const normalStop = beforeNextOpportunity.distance_m + projectSpeedTarget(beforeNextOpportunity.speed_mps, 0, 15).distance_m;
  const targetValues = new Set([0, 5, 10, state.road_rules.active_limit_kmh]);
  for (const r of Object.values(state.radar)) if (r.front_object?.travel_direction === 'same_direction') targetValues.add(Math.round(r.front_speed_mps * 3.6));
  const action_effects = Object.fromEntries([...targetValues].map(kmh => {
    const projected = projectSpeedTarget(duringResponse.speed_mps, kmh / 3.6, interval);
    return [String(kmh), { speed_after_kmh: round(projected.speed_mps * 3.6), travel_from_snapshot_m: round(duringResponse.distance_m + projected.distance_m) }];
  }));
  const lane_approach = Object.fromEntries(['left', 'right'].map(lane => {
    const radar = state.radar[lane], detected = radar.front_gap_m < FRONT_RADAR_RANGE_M;
    const closing = detected ? (state.ego.forward_speed_mps ?? v) - radar.front_speed_mps : 0;
    const headOn = radar.front_object?.travel_direction === 'oncoming';
    return [lane, {
      front_return: detected,
      closing_speed_mps: round(closing),
      front_is_oncoming: headOn,
      lead_speed_kmh: detected && !headOn ? round(radar.front_speed_mps * 3.6) : null,
      speed_difference_kmh: round(closing * 3.6),
      gap_after_response_m: detected ? round(Math.max(0, radar.front_gap_m + radar.front_speed_mps * responseSeconds - duringResponse.distance_m)) : null,
      time_headway_s: detected && v > .1 ? round(radar.front_gap_m / v) : null,
      nominal_following_gap_m: round(3 + v * 1.3),
      matching_speed_distance_m: detected && !headOn ? round(3 + Math.max(0, closing) * reactionHorizon + Math.max(0, projectSpeedTarget(v, Math.max(0, radar.front_speed_mps), 12).distance_m - Math.max(0, radar.front_speed_mps) * 12)) : null
    }];
  }));
  const people = new Map();
  for (const camera of Object.values(state.cameras)) for (const p of camera.detections) if (p.kind === 'pedestrian') people.set(p.id, p);
  const crossings = state.road_observations.visible_crosswalks.map(c => {
    const pedestrians = [...people.values()].filter(p => p.crossing_id === c.id);
    const onRoad = pedestrians.filter(p => Math.abs(state.ego.lateral_position_m + p.offset_right_m) <= 3.6 + p.width_m / 2);
    const clearing = onRoad.map(p => {
      if (Math.abs(p.lateral_speed_mps) < .05) return null;
      const edge = Math.sign(p.lateral_speed_mps) * (3.6 + p.width_m / 2);
      return Math.max(0, (edge - state.ego.lateral_position_m - p.offset_right_m) / p.lateral_speed_mps);
    });
    const gap = c.distance_m - STOP_LINE_SETBACK_M - (state.ego.longitudinal_half_extent_m ?? 2.2);
    return {
      id: c.id, front_bumper_to_stop_line_m: round(gap),
      gap_after_response_m: round(gap - duringResponse.distance_m),
      coasting_arrival_s: v > .1 && gap >= 0 ? round(gap / v) : null,
      observed_people_on_road: onRoad.length,
      observed_people_waiting: pedestrians.filter(p => p.motion === 'waiting').length,
      observed_people_cleared: pedestrians.filter(p => p.motion === 'cleared').length,
      estimated_clearance_s: clearing.some(t => t === null) ? null : round(Math.max(0, ...clearing))
    };
  }).filter(c => c.front_bumper_to_stop_line_m >= -9);
  return {
    basis: 'Numeric estimates, not an action selector. Jev chooses a target speed; the actuator approaches that fixed value without reading traffic. Matching distance estimates the relative travel needed to reach a moving lead vehicle speed, not a full stop. Response allowance includes measured RTT plus one decision period. Pedestrian clearance uses only visible constant-speed motion.',
    timing_source: measuredRtt === null ? 'startup_estimate_400_ms' : state.control_timing?.source === 'scenario_assumption' ? 'scenario_assumption' : 'measured_recent_browser_round_trip',
    response_estimate_ms: round(responseSeconds * 1000), decision_interval_ms: CONTROL_INTERVAL_MS,
    reaction_horizon_s: round(reactionHorizon),
    stop_distance_m: { normal: round(normalStop), emergency: round(beforeNextOpportunity.distance_m + beforeNextOpportunity.speed_mps ** 2 / 18) },
    desired_stop_line_clearance_m: 2,
    lane_approach, crossings, action_effects
  };
}
