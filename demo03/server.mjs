// Static server plus a sanitising proxy to TypeSafe. The API key never leaves this process.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { QUESTIONS, validateAnswers } from './questions.mjs';
import { RULES } from './sim/fusion.mjs';
import { MANEUVERS } from './sim/dynamics.mjs';
import { check, num, int, str, en, bool, nul, arr, obj, idOf, SchemaError } from './schema.mjs';

const SENSOR = en('front camera', 'left camera', 'right camera', 'rear camera', 'front radar', 'rear radar');
const carRef = extra => obj({ id: idOf('car'), distance_m: num(0, 400), speed_kmh: num(0, 120), seen_by: arr(SENSOR, 6), ...extra });
const oncomingCar = carRef({ closing_speed_kmh: num(-200, 250), seconds_until_meeting: nul(num(0, 1000)) });
export const SITUATION_SCHEMA = obj({
  ego: obj({ speed_kmh: num(0, 120), lane_status: en('centred in right lane', 'centred in left lane', 'moving into left lane', 'moving back into right lane'), current_maneuver: en(...MANEUVERS), seconds_in_current_maneuver: num(0, 1000), speed_limit_in_use_kmh: en(30, 50), over_limit_by_kmh: num(0, 120), comfortable_stopping_distance_m: num(0, 500), hard_stopping_distance_m: num(0, 500) }),
  lead: nul(carRef({ closing_speed_kmh: num(-200, 200), time_headway_s: nul(num(0, 1000)), gap_class: en('standing still', 'far', 'comfortable', 'close', 'very close'), status: en('stopped', 'moving') })),
  being_passed: nul(obj({ id: idOf('car'), speed_kmh: num(0, 120), position: en('alongside', 'still ahead', 'behind', 'not currently detected'), centre_offset_m: num(-400, 400), clear_distance_m: num(0, 400), our_rear_bumper_is_ahead_of_its_front_by_m: num(-400, 400), note: str() }, ['speed_kmh', 'centre_offset_m', 'clear_distance_m', 'our_rear_bumper_is_ahead_of_its_front_by_m', 'note'])),
  oncoming: obj({ nearest: nul(oncomingCar), second: nul(oncomingCar), note: str() }, ['note']),
  right_lane_return: nul(obj({ zone_clear: bool, bodies_in_zone: arr(idOf('car'), 8), blind_spot_right_occupied: bool, seconds_to_complete_return_at_current_speed: nul(num(0, 200)), next_car_ahead_in_right_lane: nul(obj({ id: idOf('car'), gap_m: num(-10, 400), speed_kmh: num(0, 120) })) })),
  rear: nul(obj({ id: idOf('car'), distance_m: num(0, 400), speed_kmh: num(0, 120), closing_speed_kmh: num(-200, 200) })),
  blind_spots: obj({ left: obj({ covers_lane: en('left', 'right', 'off road'), occupied: bool, object: nul(idOf('car')) }), right: obj({ covers_lane: en('left', 'right', 'off road'), occupied: bool, object: nul(idOf('car')) }) }),
  crossing: nul(obj({
    id: idOf('crossing'), stop_line_distance_m: num(-50, 400), zebra_distance_m: num(-50, 400), stop_line_reach: en('already past the stop line', 'within comfortable stopping distance', 'approaching: less than twice the stopping distance', 'far beyond stopping distance'),
    people_on_road: int(0, 12), people_waiting_at_kerb: int(0, 12), people_finished: int(0, 12),
    people: arr(obj({ id: idOf('person'), seen: str(60), position: en('waiting on right kerb (our side)', 'waiting on left kerb', 'on the road in our lane', 'on the road in the oncoming lane', 'finished crossing, on the far kerb'), walking: en('standing', 'toward our lane', 'leaving the road on our side', 'crossing our lane toward the oncoming lane', 'leaving the road on the far side', 'finished, on far kerb'), seconds_until_off_the_road: nul(num(0, 100)), seconds_until_in_our_lane: nul(num(0, 100)), distance_ahead_m: num(-50, 400) }), 12),
    all_clear: bool, nobody_detected: bool, note: str()
  }, ['note'])),
  markings: obj({ centre_line_here: en('broken', 'solid'), solid_section_starts_in_m: nul(num(0, 400)), solid_section_ends_in_m: nul(num(0, 400)) }),
  signs: obj({
    active_limit_kmh: en(30, 50), active_because: str(),
    next_sign: nul(obj({ id: idOf('sign'), limit_kmh: en(30, 50), distance_m: num(0, 400), within_slowing_distance: bool })),
    seen_ahead: arr(obj({ id: idOf('sign'), limit_kmh: en(30, 50), distance_m: num(0, 400) }), 10),
    recently_passed: arr(obj({ id: idOf('sign'), limit_kmh: en(30, 50), metres_ago: num(0, 2000) }), 3)
  }),
  overtake_estimate: nul(obj({
    target: idOf('car'), target_speed_kmh: num(0, 120), relative_distance_still_needed_m: num(0, 1000), pass_complete: bool, possible: bool, note: str(),
    time_needed_s: num(0, 200), distance_needed_m: num(0, 3000), time_available_s: num(0, 1000), time_available_source: str(), margin_s: num(-1000, 1000), margin_class: en('not possible', 'large surplus', 'moderate surplus', 'thin', 'deficit'), centre_line_conflict: str(), crossing_conflict: str(), speed_sign_conflict: str()
  }, ['possible', 'note', 'time_needed_s', 'distance_needed_m', 'time_available_s', 'time_available_source', 'margin_s', 'margin_class', 'centre_line_conflict', 'crossing_conflict', 'speed_sign_conflict'])),
  timing: obj({ decision_latency_ms: num(0, 20000), car_travel_during_latency_m: num(0, 200), next_decision_in_ms: num(0, 20000) })
});

const root = new URL('.', import.meta.url);
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
export class PublicError extends Error { constructor(status, message) { super(message); this.status = status; } }

export function sanitizeSituation(raw) {
  try { return { rules: RULES, ...check(raw, SITUATION_SCHEMA) }; }
  catch (e) { if (e instanceof SchemaError) throw new PublicError(400, `Rejected situation: ${e.message}`); throw e; }
}

export async function askJev(situation, { apiKey, model, fetchImpl = fetch, signal } = {}) {
  const started = performance.now();
  let response;
  try {
    response = await fetchImpl('https://api.typesafe.ai/v1/systemone', {
      method: 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, state: situation, questions: QUESTIONS }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(7000)]) : AbortSignal.timeout(7000)
    });
  } catch { throw new PublicError(504, 'No answer from TypeSafe within 7 s.'); }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    if (response.status === 429 || response.status === 529) throw new PublicError(429, 'TypeSafe rate limit reached. Cooling down.');
    if (response.status === 401 || response.status === 403) throw new PublicError(502, 'TypeSafe rejected the API key.');
    if (response.status === 402) throw new PublicError(502, 'TypeSafe reports insufficient credit.');
    throw new PublicError(502, `TypeSafe returned HTTP ${response.status}.`);
  }
  let data;
  try { data = validateAnswers(await response.json()); } catch { throw new PublicError(502, 'TypeSafe returned an unexpected response.'); }
  return { ...data, latency_ms: Math.round(performance.now() - started) };
}

export function createApp({ apiKey = (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim(), model = process.env.TYPESAFE_MODEL || 'jev-latest', fetchImpl = fetch } = {}) {
  let inFlight = false, cooldownUntil = 0;
  const baseHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; worker-src 'self' blob:" };
  return http.createServer(async (req, res) => {
    const json = (status, body) => { if (!res.destroyed) { res.writeHead(status, { ...baseHeaders, 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); } };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET') {
        if (path === '/api/health') return json(200, { ok: true, configured: Boolean(apiKey), model });
        if (path === '/api/config') return json(200, { configured: Boolean(apiKey), model, questions: QUESTIONS, rules: RULES, maneuvers: MANEUVERS });
        let file = null;
        if (path === '/') file = 'public/index.html';
        else if (/^\/public\/[\w.-]+$/.test(path) || /^\/sim\/[\w.-]+$/.test(path)) file = path.slice(1);
        else if (path === '/vendor/three.module.js') file = 'node_modules/three/build/three.module.js';
        else if (path === '/vendor/three.core.js') file = 'node_modules/three/build/three.core.js';
        if (!file) return json(404, { error: 'Not found' });
        const ext = file.slice(file.lastIndexOf('.'));
        try {
          const body = await readFile(new URL(file, root));
          res.writeHead(200, { ...baseHeaders, 'Content-Type': `${TYPES[ext] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': file.startsWith('node_modules') ? 'public, max-age=86400' : 'no-store' });
          return res.end(body);
        } catch { return json(404, { error: 'Not found' }); }
      }
      if (req.method !== 'POST' || path !== '/api/decide') return json(404, { error: 'Not found' });
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) throw new PublicError(403, 'Use the local demo address.');
      if (!req.headers['content-type']?.startsWith('application/json')) throw new PublicError(415, 'Expected JSON.');
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 48000) throw new PublicError(413, 'Situation payload too large.'); chunks.push(chunk); }
      let body; try { body = JSON.parse(Buffer.concat(chunks)); } catch { throw new PublicError(400, 'Invalid JSON.'); }
      const situation = sanitizeSituation(body?.situation);
      if (!apiKey) throw new PublicError(503, 'No TYPESAFE_API key found. Add it to the parent .env and recreate the container.');
      if (inFlight) throw new PublicError(409, 'A decision is already in flight.');
      if (Date.now() < cooldownUntil) throw new PublicError(429, 'Cooling down after a rate limit.');
      inFlight = true;
      const controller = new AbortController();
      res.on('close', () => { if (!res.writableEnded) controller.abort(); });
      try { return json(200, await askJev(situation, { apiKey, model, fetchImpl, signal: controller.signal })); }
      catch (error) { if (error.status === 429) cooldownUntil = Date.now() + 4000; throw error; }
      finally { inFlight = false; }
    } catch (error) {
      return json(error.status || 500, { error: error instanceof PublicError ? error.message : 'Unexpected server error.' });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createApp();
  server.requestTimeout = 15000;
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '0.0.0.0', () => console.log(`Jev Drives (demo03) listening on ${port}`));
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}
