import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { QUESTIONS, validateDecision } from './questions.mjs';
import { CAMERA_CONFIG } from './public/perception.mjs';
import { ACTION_ACCELERATIONS, buildMotionContext, CONTROL_INTERVAL_MS, SENSOR_SCHEMA } from './public/motion.mjs';

const assets = new Map([
  ['/', ['public/index.html', 'text/html']],
  ...['app.mjs', 'world.mjs', 'simulation.mjs', 'perception.mjs', 'road.mjs', 'motion.mjs', 'style.css'].map(p => [`/${p}`, [`public/${p}`, p.endsWith('.css') ? 'text/css' : 'text/javascript']]),
  ['/vendor/three.module.js', ['node_modules/three/build/three.module.js', 'text/javascript']],
  ['/vendor/three.core.js', ['node_modules/three/build/three.core.js', 'text/javascript']]
]);
export class PublicError extends Error { constructor(status, message) { super(message); this.status = status; } }

export function validateState(s) {
  const number = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
  const lane = v => ['left', 'right'].includes(v);
  if (!s || !number(s.tick, 0, 1e8) || !s.ego || !number(s.ego.speed_mps, 0, 30) || !number(s.ego.speed_limit_mps, 1, 30) || !lane(s.ego.lane) || !lane(s.ego.target_lane) || typeof s.ego.changing_lane !== 'boolean' || !number(s.ego.lateral_position_m, -1.8, 1.8)) throw new PublicError(400, 'Invalid vehicle telemetry.');
  if (s.schema !== SENSOR_SCHEMA) throw new PublicError(409, 'The demo controls have been updated. This run is paused; open the updated demo in a fresh tab to keep these results.');
  if (!Object.hasOwn(ACTION_ACCELERATIONS, s.ego.current_control)) throw new PublicError(400, 'Invalid current control.');
  const rtt = s.control_timing?.recent_round_trip_ms ?? null;
  if (!(rtt === null || number(rtt, 0, 10000))) throw new PublicError(400, 'Invalid response timing.');
  const timingSource = s.control_timing?.source ?? 'measured_browser';
  if (!['measured_browser', 'scenario_assumption'].includes(timingSource)) throw new PublicError(400, 'Invalid timing source.');
  for (const name of ['left', 'right']) {
    const r = s.radar?.[name];
    if (!r || !number(r.front_gap_m, 0, 200) || !number(r.rear_gap_m, 0, 200) || !number(r.front_speed_mps, 0, 30) || !number(r.rear_speed_mps, 0, 30) || !(r.ttc_s === null || number(r.ttc_s, 0, 10000)) || typeof s.blind_spots?.[name] !== 'boolean') throw new PublicError(400, 'Invalid sensor telemetry.');
  }
  const cameras = {};
  for (const [direction, config] of Object.entries(CAMERA_CONFIG)) {
    const detections = s.cameras?.[direction]?.detections;
    if (!Array.isArray(detections) || detections.length > 8) throw new PublicError(400, 'All four camera observations are required. Reload the updated demo.');
    cameras[direction] = { range_m: config.range_m, horizontal_fov_deg: config.horizontal_fov_deg, detections: detections.map(d => {
      if (!d || typeof d.id !== 'string' || !/^(car|barrier|pedestrian)-\d+$/.test(d.id) || !['car', 'barrier', 'pedestrian'].includes(d.kind) || !(lane(d.lane) || d.kind === 'pedestrian' && d.lane === 'roadside') || !number(d.offset_forward_m, -120, 120) || !number(d.offset_right_m, -8, 8) || !number(d.speed_mps, 0, 30) || !number(d.relative_forward_speed_mps, -30, 30) || !number(d.length_m, .1, 12) || !number(d.width_m, .1, 4) || !number(d.lateral_speed_mps, -3, 3)) throw new PublicError(400, 'Invalid directional camera detection.');
      if (d.kind === 'pedestrian' && (!['waiting', 'crossing', 'cleared'].includes(d.motion) || !/^crosswalk-\d+$/.test(d.crossing_id))) throw new PublicError(400, 'Invalid pedestrian observation.');
      // Derive body relationships from observations; never compute a recommended lane/action here.
      const overlap = Math.abs(d.offset_forward_m) < (4.4 + d.length_m) / 2;
      return { id: d.id, kind: d.kind, lane: d.lane, offset_forward_m: d.offset_forward_m, offset_right_m: d.offset_right_m, length_m: d.length_m, width_m: d.width_m, speed_mps: d.speed_mps, relative_forward_speed_mps: Number((d.speed_mps - s.ego.speed_mps).toFixed(2)), lateral_speed_mps: d.lateral_speed_mps, ...(d.kind === 'pedestrian' ? { motion: d.motion, crossing_id: d.crossing_id } : {}), longitudinal_gap_m: Number(Math.max(0, Math.abs(d.offset_forward_m) - (4.4 + d.length_m) / 2).toFixed(2)), longitudinal_overlap: overlap, relation: overlap ? 'alongside' : d.offset_forward_m >= 0 ? 'ahead' : 'behind' };
    }) };
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
  const road_rules = { active_limit_kmh: rules.active_limit_kmh, active_sign_id: rules.active_sign_id, active_since_s: rules.active_since_s, source: rules.source, upcoming_signs: rules.upcoming_signs.map(memorySign), sign_history: rules.sign_history.map(memorySign) };
  const road_observations = {
    visible_signs: road.visible_signs.map(v => { if (!v || !signId(v.id) || !validLimit(v.limit_kmh) || !number(v.distance_m, 0, 120)) throw new PublicError(400, 'Invalid visible speed sign.'); return { id: v.id, limit_kmh: v.limit_kmh, distance_m: v.distance_m, seen_by: seenBy(v.seen_by) }; }),
    visible_crosswalks: road.visible_crosswalks.map(v => { if (!v || !/^crosswalk-\d+$/.test(v.id) || !number(v.distance_m, -5, 100)) throw new PublicError(400, 'Invalid visible crosswalk.'); return { id: v.id, distance_m: v.distance_m, seen_by: seenBy(v.seen_by) }; })
  };
  const x = s.ego.lateral_position_m, targetX = s.ego.target_lane === 'left' ? -1.8 : 1.8;
  // Rebuild the payload: no client-defined instructions or unnecessary hidden world state.
  const state = {
    tick: s.tick,
    environment: 'Simulated two-lane road; both lanes move forward. Four synthetic cameras supply detections, not images. Positive forward means ahead, negative behind; positive right means to your right. Duplicate IDs across cameras are the same object. Relative forward speed = object speed minus ego speed. Pedestrian lateral_speed_mps is positive walking right, negative walking left. Negative forward offset can still overlap the ego body. A remembered 30/50 km/h sign applies when passed, until the next sign is passed. Upcoming signs are observations, not active limits. Initial road rule is 50 km/h. Yield to pedestrians crossing the whole marked crosswalk; do not pass a yielding vehicle into that crossing. Mechanical maximum speed is not the legal speed limit.',
    ego: { speed_mps: s.ego.speed_mps, speed_limit_mps: Number((rules.active_limit_kmh / 3.6).toFixed(2)), speed_kmh: Number((s.ego.speed_mps * 3.6).toFixed(1)), lane: s.ego.lane, target_lane: s.ego.target_lane, changing_lane: Math.abs(x - targetX) > .08, lateral_position_m: x, occupied_lanes: [...(x - .925 < 0 ? ['left'] : []), ...(x + .925 > 0 ? ['right'] : [])], remaining_lane_change_seconds: Number((Math.abs(targetX - x) / (3.6 / 1.4)).toFixed(2)), length_m: 4.4, width_m: 1.85, lane_change_seconds: 1.4, normal_stopping_distance_m: Math.round(s.ego.speed_mps ** 2 / 10 + s.ego.speed_mps * .8), desired_following_gap_m: Math.round(s.ego.speed_mps * 1.6 + 5) },
    radar: Object.fromEntries(['left', 'right'].map(l => [l, { front_gap_m: s.radar[l].front_gap_m, front_speed_mps: s.radar[l].front_speed_mps, rear_gap_m: s.radar[l].rear_gap_m, rear_speed_mps: s.radar[l].rear_speed_mps, ttc_s: s.radar[l].ttc_s }])),
    blind_spots: { left: s.blind_spots.left, right: s.blind_spots.right },
    blind_spot_coverage: 'These flags report object centres within 7 m ahead or behind in each ROAD LANE. They are not a judgement that changing lane is safe. Inspect camera body overlap and rear approach as well.',
    cameras, road_observations, road_rules,
    control_timing: { decision_interval_ms: CONTROL_INTERVAL_MS, recent_round_trip_ms: rtt, source: timingSource }
  };
  state.ego.current_control = s.ego.current_control;
  state.motion = buildMotionContext(state);
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
      for await (const chunk of req) { size += chunk.length; if (size > 20000) throw new PublicError(413, 'Sensor payload is too large.'); chunks.push(chunk); }
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
