import { FRONT_RADAR_RANGE_M } from './traffic.mjs';
import { laneChangeSeconds, speedTargetAcceleration } from './vehicle.mjs';
const round = v => Number(v.toFixed(2));

function gainTime(gain, initialSpeed, targetSpeed, leadSpeed, fallingBehind = false) {
  if (gain <= 0) return 0;
  if (fallingBehind ? targetSpeed >= leadSpeed - .1 : targetSpeed <= leadSpeed + .1) return null;
  let progress = 0, v = initialSpeed;
  for (let t = .05; t <= 120; t += .05) {
    const next = Math.max(0, Math.min(22, v + speedTargetAcceleration(v, targetSpeed) * .05));
    progress += (fallingBehind ? leadSpeed - (v + next) / 2 : (v + next) / 2 - leadSpeed) * .05;
    v = next; if (progress >= gain) return t;
  }
  return null;
}

// Measurements and candidate timing only. Jev selects the lane and target speed.
export function buildPassingContext(state, motion) {
  const ego = state.ego, v = ego.speed_mps, forwardSpeed = ego.forward_speed_mps ?? v, legalSpeed = state.road_rules.active_limit_kmh / 3.6;
  const observations = new Map();
  for (const feed of Object.values(state.cameras)) for (const o of feed.detections) observations.set(o.id, o);
  for (const radar of Object.values(state.radar)) for (const o of [radar.front_object, radar.rear_object, ...(radar.oncoming_objects || [])]) if (o) observations.set(o.id, o);
  const phase = ego.changing_lane ? (ego.target_lane === 'left' ? 'entering_opposing_lane' : 'returning_right') : ego.lane === 'left' ? 'in_opposing_lane' : 'keeping_right';
  const rightCars = [...observations.values()].filter(o => o.kind === 'car' && o.lane === 'right' && o.travel_direction === 'same_direction');
  const memory = state.maneuver_memory;
  let target = null, source = 'current_observation', age = 0;
  if (memory?.target_id) {
    target = observations.get(memory.target_id) || null;
    if (!target && memory.last_observation && memory.last_seen_at_s !== null) {
      age = Math.max(0, (state.simulation_time_s ?? 0) - memory.last_seen_at_s);
      target = { ...memory.last_observation, offset_forward_m: memory.last_observation.offset_forward_m + memory.last_observation.forward_velocity_mps * age - memory.ego_travel_since_observation_m };
      source = 'projected_last_observation';
    }
  } else if (!memory) {
    target = (phase === 'keeping_right' ? rightCars.filter(o => o.offset_forward_m > 0).sort((a, b) => a.offset_forward_m - b.offset_forward_m) : rightCars.sort((a, b) => Math.abs(a.offset_forward_m) - Math.abs(b.offset_forward_m)))[0] || null;
  }
  const halfEgo = ego.longitudinal_half_extent_m ?? 2.2;
  const oncoming = [...observations.values()].filter(o => o.kind === 'car' && o.travel_direction === 'oncoming' && o.offset_forward_m > -(halfEgo + o.length_m / 2)).map(o => {
    const speed = Math.abs(o.forward_velocity_mps), gap = Math.max(0, o.offset_forward_m - (halfEgo + o.length_m / 2));
    return { id: o.id, lane: o.lane, gap_m: round(gap), speed_kmh: round(speed * 3.6), closing_speed_mps: round(forwardSpeed + speed), time_to_contact_at_current_speed_s: forwardSpeed + speed > .1 ? round(gap / (forwardSpeed + speed)) : null, time_to_contact_at_limit_s: round(gap / (legalSpeed + speed)) };
  }).sort((a, b) => a.time_to_contact_at_limit_s - b.time_to_contact_at_limit_s);
  const pose = { x: ego.lateral_position_m, z: 0, speed: v, headingRad: ego.heading_rad || 0, curvature: Math.tan(ego.steering_angle_rad || 0) / 2.7 };
  const transition = (targetX, speed) => laneChangeSeconds(pose, targetX, speed);
  const fullReturn = speed => laneChangeSeconds({ x: -1.8, z: 0, speed, headingRad: 0 }, 1.8, speed);
  const entryAtLimit = phase === 'keeping_right' ? transition(-1.8, legalSpeed) : phase === 'entering_opposing_lane' ? (ego.lane_change_remaining_path_m ?? 0) / legalSpeed : 0;
  const entryAtCurrent = phase === 'keeping_right' ? transition(-1.8, v) : phase === 'entering_opposing_lane' ? (v > .1 ? (ego.lane_change_remaining_path_m ?? 0) / v : null) : 0;
  const returnAtLimit = phase === 'returning_right' ? (ego.lane_change_remaining_path_m ?? 0) / legalSpeed : fullReturn(legalSpeed);
  const returnAtCurrent = phase === 'returning_right' ? (v > .1 ? (ego.lane_change_remaining_path_m ?? 0) / v : null) : fullReturn(v);
  let pass = null, abort = null;
  if (target) {
    const leadSpeed = target.forward_velocity_mps, halfLengths = halfEgo + target.length_m / 2;
    const rearClearance = 3 + leadSpeed * 1.3, gain = Math.max(0, target.offset_forward_m + halfLengths + rearClearance);
    const clearAtLimit = gainTime(gain, v, legalSpeed, leadSpeed);
    const clearAtCurrent = gain <= 0 ? 0 : forwardSpeed - leadSpeed > .1 ? gain / (forwardSpeed - leadSpeed) : null;
    const timeAtLimit = clearAtLimit === null ? null : Math.max(clearAtLimit, entryAtLimit || 0) + returnAtLimit + motion.reaction_horizon_s;
    const timeAtCurrent = clearAtCurrent === null || entryAtCurrent === null || returnAtCurrent === null ? null : Math.max(clearAtCurrent, entryAtCurrent) + returnAtCurrent + motion.reaction_horizon_s;
    pass = {
      target_id: target.id, reference_locked: Boolean(memory?.target_id), observation_source: source, observation_age_s: round(age),
      target_speed_kmh: round(leadSpeed * 3.6), target_offset_forward_m: round(target.offset_forward_m),
      relative_gain_still_needed_m: round(gain), legal_speed_advantage_mps: round(legalSpeed - leadSpeed),
      ego_rear_ahead_of_target_front_m: round(-target.offset_forward_m - halfLengths),
      nominal_return_rear_clearance_m: round(rearClearance), return_clearance_margin_m: round(-target.offset_forward_m - halfLengths - rearClearance),
      estimated_completion_at_current_speed_s: timeAtCurrent === null ? null : round(timeAtCurrent),
      estimated_completion_at_limit_s: timeAtLimit === null ? null : round(timeAtLimit),
      estimated_forward_distance_at_limit_m: timeAtLimit === null ? null : round(legalSpeed * timeAtLimit)
    };
    if (phase !== 'keeping_right') {
      const rollingSpeed = Math.min(3, Math.max(0, leadSpeed / 2));
      const drop = gainTime(Math.max(0, halfLengths + 3 + rollingSpeed * 1.3 - target.offset_forward_m), v, rollingSpeed, leadSpeed, true);
      const turn = rollingSpeed > .1 ? transition(1.8, rollingSpeed) : null;
      abort = { target_id: target.id, assumption: 'Choose a lower rolling target speed to let the original car get ahead, then drive a curve right. A stopped car cannot shift sideways. Other traffic may block the return.', assumed_rolling_target_kmh: round(rollingSpeed * 3.6), estimated_drop_behind_and_return_s: drop === null || turn === null ? null : round(drop + turn + motion.reaction_horizon_s) };
    }
  }
  const boundaryTime = FRONT_RADAR_RANGE_M / (legalSpeed + 50 / 3.6), markings = state.road_observations.lane_markings;
  const availableTime = Math.min(boundaryTime, oncoming[0]?.time_to_contact_at_limit_s ?? Infinity);
  if (pass) {
    pass.time_margin_at_limit_s = pass.estimated_completion_at_limit_s === null ? null : round(availableTime - pass.estimated_completion_at_limit_s);
    pass.marking_visibility_margin_m = pass.estimated_forward_distance_at_limit_m === null ? null : round(markings.observed_range_m - pass.estimated_forward_distance_at_limit_m);
  }
  if (abort) abort.time_margin_s = abort.estimated_drop_behind_and_return_s === null ? null : round(availableTime - abort.estimated_drop_behind_and_return_s);
  return {
    road: 'Keep RIGHT; LEFT is only temporary overtaking space. Finish the original pass and return before considering another vehicle.',
    phase, original_target_id: memory?.target_id ?? null, current_center_line: markings.current_center_line,
    observed_no_passing_segments: markings.no_passing_segments, forward_marking_visibility_m: markings.observed_range_m,
    oncoming_radar_range_m: FRONT_RADAR_RANGE_M, earliest_unseen_oncoming_arrival_at_limit_s: round(boundaryTime),
    unseen_vehicle_assumption: 'An unseen vehicle just beyond radar range may approach at 50 km/h.',
    oncoming, pass, abort,
    right_merge: { front_gap_m: state.radar.right.front_gap_m, rear_gap_m: state.radar.right.rear_gap_m, rear_closing_speed_mps: round(state.radar.right.rear_speed_mps - forwardSpeed), observed_bodies_alongside: rightCars.filter(o => o.longitudinal_overlap).map(o => o.id), short_zone_occupied: state.blind_spots.right },
    estimate_basis: 'Original target stays locked until the actual return right. Lost target positions are labelled projections of last observed velocity. Pass timing overlaps longitudinal progress with the entry curve, then adds the return curve and response margin. Curves require forward movement. Estimates are not actions or permissions.'
  };
}
