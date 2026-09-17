// Measurements and idealized kinematics only. This module never selects or changes a driving action.
export const CONTROL_INTERVAL_MS = 800;
export const SENSOR_SCHEMA = 'distance-aware-v2';
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
  const duringResponse = projectMotion(v, oldAcceleration, responseSeconds);
  // A conservative planning window covers a full decision period plus the most recent observed RTT.
  const beforeNextOpportunity = projectMotion(v, Math.max(0, oldAcceleration), reactionHorizon);
  const stop = deceleration => round(beforeNextOpportunity.distance_m + beforeNextOpportunity.speed_mps ** 2 / (2 * deceleration));
  const action_effects = Object.fromEntries(Object.entries(ACTION_ACCELERATIONS).map(([action, acceleration]) => {
    const applied = projectMotion(duringResponse.speed_mps, acceleration, interval);
    return [action, { speed_after_kmh: round(applied.speed_mps * 3.6), travel_from_snapshot_m: round(duringResponse.distance_m + applied.distance_m) }];
  }));
  const lane_approach = Object.fromEntries(['left', 'right'].map(lane => {
    const radar = state.radar[lane], detected = radar.front_gap_m < 140;
    const closing = detected ? v - radar.front_speed_mps : 0;
    return [lane, {
      front_return: detected,
      closing_speed_mps: round(closing),
      gap_after_response_m: detected ? round(Math.max(0, radar.front_gap_m + radar.front_speed_mps * responseSeconds - duringResponse.distance_m)) : null,
      time_headway_s: detected && v > .1 ? round(radar.front_gap_m / v) : null,
      nominal_following_gap_m: round(3 + v * 1.3),
      gentle_relative_stopping_gap_m: detected ? round(3 + Math.max(0, closing) * reactionHorizon + Math.max(0, closing) ** 2 / 3) : null
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
    const gap = c.distance_m - STOP_LINE_SETBACK_M - (state.ego.length_m ?? 4.4) / 2;
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
    basis: 'Idealized kinematics, not a selected action or safety guarantee. Action effects hold the last command during estimated RTT, then the candidate for 0.8 s. Stop distances allow RTT plus one decision period, assuming no existing braking. Pedestrian clearance extrapolates only visible people at constant lateral speed.',
    timing_source: measuredRtt === null ? 'startup_estimate_400_ms' : state.control_timing?.source === 'scenario_assumption' ? 'scenario_assumption' : 'measured_recent_browser_round_trip',
    response_estimate_ms: round(responseSeconds * 1000), decision_interval_ms: CONTROL_INTERVAL_MS,
    reaction_horizon_s: round(reactionHorizon),
    stop_distance_m: { gentle: stop(1.5), normal: stop(5), emergency: stop(9) },
    desired_stop_line_clearance_m: 2,
    lane_approach, crossings, action_effects
  };
}
