import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { QUESTIONS, validateDecision } from './questions.mjs';
import { CAMERA_CONFIG } from './public/perception.mjs';
import { FRONT_RADAR_RANGE_M, REAR_RADAR_RANGE_M } from './public/traffic.mjs';
import { buildPassingContext } from './public/passing.mjs';
import { laneChangeSeconds } from './public/vehicle.mjs';
import { ACTION_ACCELERATIONS, buildMotionContext, CONTROL_INTERVAL_MS, SENSOR_SCHEMA } from './public/motion.mjs';

const assets = new Map([
  ['/', ['public/index.html', 'text/html']],
  ...['app.mjs', 'world.mjs', 'simulation.mjs', 'perception.mjs', 'road.mjs', 'motion.mjs', 'traffic.mjs', 'passing.mjs', 'vehicle.mjs', 'style.css'].map(p => [`/${p}`, [`public/${p}`, p.endsWith('.css') ? 'text/css' : 'text/javascript']]),
  ['/vendor/three.module.js', ['node_modules/three/build/three.module.js', 'text/javascript']],
  ['/vendor/three.core.js', ['node_modules/three/build/three.core.js', 'text/javascript']]
]);
export class PublicError extends Error { constructor(status, message) { super(message); this.status = status; } }

export function validateState(s) {
  const number = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
  const lane = v => ['left', 'right'].includes(v);
  if (!s || !number(s.tick, 0, 1e8) || !s.ego || !number(s.ego.speed_mps, 0, 30) || !number(s.ego.speed_limit_mps, 1, 30) || !lane(s.ego.lane) || !lane(s.ego.target_lane) || typeof s.ego.changing_lane !== 'boolean' || !number(s.ego.lateral_position_m, -4.1, 4.1)) throw new PublicError(400, 'Invalid vehicle telemetry.');
  if (s.schema !== SENSOR_SCHEMA) throw new PublicError(409, 'The demo controls have been updated. This run is paused; open the updated demo in a fresh tab to keep these results.');
  if (!Object.hasOwn(ACTION_ACCELERATIONS, s.ego.current_control) && s.ego.current_control !== 'target_speed') throw new PublicError(400, 'Invalid current control.');
  if (!number(s.simulation_time_s, 0, 600) || !['acceleration', 'speed_target'].includes(s.ego.command_kind) || !(s.ego.target_speed_kmh === null || number(s.ego.target_speed_kmh, 0, 50)) || !number(s.ego.acceleration_mps2, -9.1, 3.1) || !number(s.ego.heading_rad, -1.55, 1.55) || !number(s.ego.steering_angle_rad, -1.55, 1.55) || !number(s.ego.forward_speed_mps, 0, 30) || !number(s.ego.longitudinal_half_extent_m, .1, 4) || !number(s.ego.lateral_half_extent_m, .1, 4) || !number(s.ego.lane_change_remaining_path_m, 0, 150)) throw new PublicError(400, 'Invalid vehicle motion state.');
  const rtt = s.control_timing?.recent_round_trip_ms ?? null;
  if (!(rtt === null || number(rtt, 0, 10000))) throw new PublicError(400, 'Invalid response timing.');
  const timingSource = s.control_timing?.source ?? 'measured_browser';
  if (!['measured_browser', 'scenario_assumption'].includes(timingSource)) throw new PublicError(400, 'Invalid timing source.');
  const cleanObject = (d, range) => {
    if (!d || typeof d.id !== 'string' || !/^(car|barrier|pedestrian)-\d+$/.test(d.id) || !['car', 'barrier', 'pedestrian'].includes(d.kind) || !(lane(d.lane) || d.kind === 'pedestrian' && d.lane === 'roadside') || !number(d.offset_forward_m, -range, range) || !number(d.offset_right_m, -8, 8) || !number(d.speed_mps, 0, 30) || !number(d.forward_velocity_mps, -30, 30) || !number(d.relative_forward_speed_mps, -60, 30) || !number(d.length_m, .1, 12) || !number(d.width_m, .1, 4) || !number(d.lateral_speed_mps, -3, 3)) throw new PublicError(400, 'Invalid directional object observation.');
    if (!['same_direction', 'oncoming', 'stationary_longitudinally'].includes(d.travel_direction) || (d.travel_direction === 'oncoming' && d.forward_velocity_mps > 0) || (d.travel_direction === 'same_direction' && d.forward_velocity_mps < 0) || Math.abs(Math.abs(d.forward_velocity_mps) - d.speed_mps) > .025) throw new PublicError(400, 'Inconsistent observed direction and velocity.');
    if (d.kind === 'pedestrian' && (!['waiting', 'crossing', 'cleared'].includes(d.motion) || !/^crosswalk-\d+$/.test(d.crossing_id))) throw new PublicError(400, 'Invalid pedestrian observation.');
    const overlap = Math.abs(d.offset_forward_m) < (s.ego.longitudinal_half_extent_m + d.length_m / 2);
    return { id: d.id, kind: d.kind, lane: d.lane, travel_direction: d.travel_direction, offset_forward_m: d.offset_forward_m, offset_right_m: d.offset_right_m, length_m: d.length_m, width_m: d.width_m, speed_mps: d.speed_mps, forward_velocity_mps: d.forward_velocity_mps, relative_forward_speed_mps: Number((d.forward_velocity_mps - s.ego.forward_speed_mps).toFixed(2)), lateral_speed_mps: d.lateral_speed_mps, ...(d.kind === 'pedestrian' ? { motion: d.motion, crossing_id: d.crossing_id } : {}), longitudinal_gap_m: Number(Math.max(0, Math.abs(d.offset_forward_m) - (s.ego.longitudinal_half_extent_m + d.length_m / 2)).toFixed(2)), longitudinal_overlap: overlap, relation: overlap ? 'alongside' : d.offset_forward_m >= 0 ? 'ahead' : 'behind' };
  };
  const radar = {};
  for (const name of ['left', 'right']) {
    const r = s.radar?.[name];
    if (!r || !number(r.front_gap_m, 0, FRONT_RADAR_RANGE_M) || !number(r.rear_gap_m, 0, REAR_RADAR_RANGE_M) || !number(r.front_speed_mps, -30, 30) || !number(r.rear_speed_mps, -30, 30) || !(r.ttc_s === null || number(r.ttc_s, 0, 10000)) || typeof s.blind_spots?.[name] !== 'boolean' || !Array.isArray(r.oncoming_objects) || r.oncoming_objects.length > 3) throw new PublicError(400, 'Invalid radar telemetry.');
    radar[name] = { range_m: FRONT_RADAR_RANGE_M, rear_range_m: REAR_RADAR_RANGE_M, front_gap_m: r.front_gap_m, front_speed_mps: r.front_speed_mps, rear_gap_m: r.rear_gap_m, rear_speed_mps: r.rear_speed_mps, ttc_s: r.ttc_s, front_object: r.front_object === null ? null : cleanObject(r.front_object, FRONT_RADAR_RANGE_M), rear_object: r.rear_object === null ? null : cleanObject(r.rear_object, REAR_RADAR_RANGE_M), oncoming_objects: r.oncoming_objects.map(o => cleanObject(o, FRONT_RADAR_RANGE_M)) };
    if (radar[name].oncoming_objects.some(o => o.travel_direction !== 'oncoming')) throw new PublicError(400, 'Invalid oncoming radar return.');
  }
  const cameras = {};
  for (const [direction, config] of Object.entries(CAMERA_CONFIG)) {
    const detections = s.cameras?.[direction]?.detections;
    if (!Array.isArray(detections) || detections.length > 8) throw new PublicError(400, 'All four camera observations are required. Reload the updated demo.');
    cameras[direction] = { range_m: config.range_m, horizontal_fov_deg: config.horizontal_fov_deg, detections: detections.map(d => cleanObject(d, 240)) };
  }
  const validLimit = v => v === 30 || v === 50;
  const signId = v => typeof v === 'string' && /^sign-\d+$/.test(v);
  const memorySign = v => {
    if (!v || !signId(v.id) || !validLimit(v.limit_kmh) || !number(v.distance_m, -2000, 2000) || !number(v.first_seen_at_s, 0, 600) || !(v.passed_at_s === null || number(v.passed_at_s, 0, 600)) || typeof v.visible_now !== 'boolean') throw new PublicError(400, 'Invalid remembered sign.');
    return { id: v.id, limit_kmh: v.limit_kmh, distance_m: v.distance_m, first_seen_at_s: v.first_seen_at_s, passed_at_s: v.passed_at_s, visible_now: v.visible_now };
  };
  const rules = s.road_rules, road = s.road_observations;
  if (!rules || !validLimit(rules.active_limit_kmh) || !(rules.active_sign_id === null || signId(rules.active_sign_id)) || !number(rules.active_since_s, 0, 600) || !['initial_50_kmh_road_rule', 'observed_sign_passed'].includes(rules.source) || !Array.isArray(rules.sign_history) || rules.sign_history.length > 10 || !Array.isArray(rules.upcoming_signs) || rules.upcoming_signs.length > 10 || !road || !Array.isArray(road.visible_signs) || road.visible_signs.length > 10 || !Array.isArray(road.visible_crosswalks) || road.visible_crosswalks.length > 4) throw new PublicError(400, 'Invalid road observations. Reload the updated demo.');
  const seenBy = values => { if (!Array.isArray(values) || !values.length || values.length > 4 || values.some(v => !Object.hasOwn(CAMERA_CONFIG, v))) throw new PublicError(400, 'Invalid road observation camera.'); return [...new Set(values)]; };
  const road_rules = { normal_lane: 'right', opposing_lane: 'left', active_limit_kmh: rules.active_limit_kmh, active_sign_id: rules.active_sign_id, active_since_s: rules.active_since_s, source: rules.source, upcoming_signs: rules.upcoming_signs.map(memorySign), sign_history: rules.sign_history.map(memorySign) };
  const road_observations = {
    visible_signs: road.visible_signs.map(v => { if (!v || !signId(v.id) || !validLimit(v.limit_kmh) || !number(v.distance_m, 0, 120)) throw new PublicError(400, 'Invalid visible speed sign.'); return { id: v.id, limit_kmh: v.limit_kmh, distance_m: v.distance_m, seen_by: seenBy(v.seen_by) }; }),
    visible_crosswalks: road.visible_crosswalks.map(v => { if (!v || !/^crosswalk-\d+$/.test(v.id) || !number(v.distance_m, -5, 200)) throw new PublicError(400, 'Invalid visible crosswalk.'); return { id: v.id, distance_m: v.distance_m, seen_by: seenBy(v.seen_by) }; })
  };
  const markings = road.lane_markings;
  if (!markings || !['solid', 'broken'].includes(markings.current_center_line) || !Array.isArray(markings.no_passing_segments) || markings.no_passing_segments.length > 4) throw new PublicError(400, 'Invalid lane-marking observations.');
  road_observations.lane_markings = { current_center_line: markings.current_center_line, observed_range_m: 200, no_passing_segments: markings.no_passing_segments.map(v => { if (!number(v.start_distance_m, -60, 200) || !number(v.end_distance_m, 0, 260) || v.start_distance_m > v.end_distance_m) throw new PublicError(400, 'Invalid solid-line segment.'); return { start_distance_m: v.start_distance_m, end_distance_m: v.end_distance_m, seen_by: seenBy(v.seen_by) }; }) };
  let maneuver_memory = null;
  if (s.maneuver_memory !== null) {
    const m = s.maneuver_memory;
    if (!m || !(m.target_id === null || /^car-\d+$/.test(m.target_id)) || !number(m.started_at_s, 0, 600) || !(m.last_seen_at_s === null || number(m.last_seen_at_s, 0, 600)) || !number(m.ego_travel_since_observation_m, -1, 2000)) throw new PublicError(400, 'Invalid overtake memory.');
    maneuver_memory = { target_id: m.target_id, started_at_s: m.started_at_s, last_seen_at_s: m.last_seen_at_s, ego_travel_since_observation_m: m.ego_travel_since_observation_m, last_observation: m.last_observation === null ? null : cleanObject(m.last_observation, FRONT_RADAR_RANGE_M) };
  }
  const x = s.ego.lateral_position_m, targetX = s.ego.target_lane === 'left' ? -1.8 : 1.8;
  // Rebuild the payload: no client-defined instructions or unnecessary hidden world state.
  const state = {
    tick: s.tick, simulation_time_s: s.simulation_time_s, maneuver_memory,
    environment: 'Simulated TWO-WAY road. Drive on the RIGHT. The LEFT lane is for ONCOMING traffic; borrow it briefly only for an overtake with room to return right. Broken centre line permits consideration; solid centre line prohibits starting a pass. Return right after passing, and reassess or abandon a pass if conditions change. Four synthetic cameras supply detections, not images. Positive forward means ahead, negative behind; positive right means to your right. Duplicate IDs across cameras are the same object. Radar front/rear speeds and object forward_velocity_mps are SIGNED: positive along our travel, negative oncoming. speed_mps on objects is a magnitude. Relative forward speed = signed object velocity minus ego speed, so head-on closing speed is the SUM of magnitudes. Stopping in the opposing lane does not remove a head-on threat. Pedestrian lateral_speed_mps is positive walking right, negative walking left. Negative forward offset can still overlap the ego body. A remembered 30/50 km/h sign applies when passed, until the next sign is passed. Upcoming signs are observations, not active limits. Initial road rule is 50 km/h. Yield to pedestrians crossing the whole marked crosswalk; do not pass a yielding vehicle into that crossing. Mechanical maximum speed is not the legal speed limit. Choose a target speed in km/h; the actuator follows exactly that target without reading traffic. Moving lead cars normally call for matching their speed, not stopping. Lane changes are forward-driven curves: no sideways movement is possible at zero speed. maneuver_memory retains the original overtaken car until the vehicle has returned right.',
    ego: { speed_mps: s.ego.speed_mps, speed_limit_mps: Number((rules.active_limit_kmh / 3.6).toFixed(2)), speed_kmh: Number((s.ego.speed_mps * 3.6).toFixed(1)), lane: s.ego.lane, target_lane: s.ego.target_lane, changing_lane: s.ego.lane_change_remaining_path_m > .01 || Math.abs(x - targetX) > .08, lateral_position_m: x, occupied_lanes: [...(x - s.ego.lateral_half_extent_m < 0 ? ['left'] : []), ...(x + s.ego.lateral_half_extent_m > 0 ? ['right'] : [])], remaining_lane_change_seconds: s.ego.speed_mps > .1 ? Number((s.ego.lane_change_remaining_path_m / s.ego.speed_mps).toFixed(2)) : null, length_m: 4.4, width_m: 1.85, lane_change_seconds: laneChangeSeconds({ x: 1.8, z: 0, speed: s.ego.speed_mps, headingRad: 0 }, -1.8), normal_stopping_distance_m: Math.round(s.ego.speed_mps ** 2 / 10 + s.ego.speed_mps * .8), desired_following_gap_m: Math.round(s.ego.speed_mps * 1.6 + 5) },
    radar,
    blind_spots: { left: s.blind_spots.left, right: s.blind_spots.right },
    blind_spot_coverage: 'These flags report object centres within 7 m ahead or behind in each ROAD LANE. They are not a judgement that changing lane is safe. Inspect camera body overlap and rear approach as well.',
    cameras, road_observations, road_rules,
    control_timing: { decision_interval_ms: CONTROL_INTERVAL_MS, recent_round_trip_ms: rtt, source: timingSource }
  };
  Object.assign(state.ego, { current_control: s.ego.current_control, command_kind: s.ego.command_kind, target_speed_kmh: s.ego.target_speed_kmh, acceleration_mps2: s.ego.acceleration_mps2, heading_rad: s.ego.heading_rad, steering_angle_rad: s.ego.steering_angle_rad, forward_speed_mps: s.ego.forward_speed_mps, longitudinal_half_extent_m: s.ego.longitudinal_half_extent_m, lateral_half_extent_m: s.ego.lateral_half_extent_m, lane_change_remaining_path_m: s.ego.lane_change_remaining_path_m });
  state.motion = buildMotionContext(state);
  state.passing = buildPassingContext(state, state.motion);
  state.ego.normal_stopping_distance_m = state.motion.stop_distance_m.normal;
  state.ego.desired_following_gap_m = state.motion.lane_approach[state.ego.lane].nominal_following_gap_m;
  return state;
}

export async function decide(state, { apiKey, model, fetchImpl = fetch, signal } = {}) {
  const started = performance.now();
  let response;
  try {
    response = await fetchImpl('https://api.typesafe.ai/v1/systemone', {
      method: 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, state, questions: QUESTIONS }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(6000)]) : AbortSignal.timeout(6000)
    });
  } catch { throw new PublicError(504, 'Jev is not responding. The simulation has paused; resume to retry.'); }
  if (!response.ok) {
    await response.body?.cancel();
    throw new PublicError(response.status === 429 || response.status === 529 ? 429 : 502,
      response.status === 401 || response.status === 403 ? 'TypeSafe rejected the API credential.' : response.status === 402 ? 'TypeSafe reports insufficient account credit.' : `TypeSafe returned HTTP ${response.status}. The simulation has paused; resume to retry.`);
  }
  try { return { ...validateDecision(await response.json()), latency_ms: Math.round(performance.now() - started), tick: state.tick, state }; }
  catch { throw new PublicError(502, 'Jev returned an invalid response. The simulation has paused.'); }
}

export function createApp({ apiKey = (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim(), model = process.env.TYPESAFE_MODEL || 'jev-latest', fetchImpl = fetch } = {}) {
  let active = false;
  let cooldownUntil = 0;
  return http.createServer(async (req, res) => {
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" };
    const json = (status, body) => { if (!res.destroyed) { res.writeHead(status, { ...headers, 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); } };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && path === '/api/health') return json(200, { ok: true, configured: Boolean(apiKey), model });
      if (req.method === 'GET' && path === '/api/config') return json(200, { configured: Boolean(apiKey), model, questions: QUESTIONS, interval_ms: CONTROL_INTERVAL_MS });
      if (req.method === 'GET' && assets.has(path)) {
        const [file, type] = assets.get(path);
        const contents = await readFile(new URL(file, import.meta.url));
        res.writeHead(200, { ...headers, 'Content-Type': `${type}; charset=utf-8` }); return res.end(contents);
      }
      if (path !== '/api/decide' || req.method !== 'POST') return json(404, { error: 'Not found' });
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) throw new PublicError(403, 'Use the local demo address.');
      if (!req.headers['content-type']?.startsWith('application/json')) throw new PublicError(415, 'Expected JSON.');
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 32000) throw new PublicError(413, 'Sensor payload is too large.'); chunks.push(chunk); }
      let body; try { body = JSON.parse(Buffer.concat(chunks)); } catch { throw new PublicError(400, 'Invalid JSON.'); }
      const state = validateState(body);
      if (!apiKey) throw new PublicError(503, 'Add TYPESAFE_API or TYPESAFE_API_KEY to the parent .env, then recreate the container.');
      if (active || Date.now() < cooldownUntil) throw new PublicError(429, 'Jev is busy. Wait a moment, then resume.');
      active = true;
      const controller = new AbortController();
      res.on('close', () => { if (!res.writableEnded) controller.abort(); });
      try { return json(200, await decide(state, { apiKey, model, fetchImpl, signal: controller.signal })); }
      catch (error) { if (error.status === 429) cooldownUntil = Date.now() + 5000; throw error; }
      finally { active = false; }
    } catch (error) { return json(error.status || 500, { error: error instanceof PublicError ? error.message : 'The demo encountered an unexpected error.' }); }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createApp();
  server.requestTimeout = 10000;
  server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Jev Driving Lab ready on port ' + (process.env.PORT || 3000)));
  process.on('SIGTERM', () => server.close());
}
