// Headless closed-loop run against the real TypeSafe API. Same simulation, same executor as the browser,
// with API latency simulated as driving time. Records every situation and answer for inspection.
//   docker run --rm --env-file ../.env -v "$PWD/artifacts":/app/artifacts -u 0 typesafe-demo03-jev-drives-app node tools/probe.mjs --seed 7 --seconds 150 --out artifacts/run-7.json
import { writeFile } from 'node:fs/promises';
import { Simulation } from '../sim/simulation.mjs';
import { decisionFromAnswers } from '../sim/policy.mjs';
import { sanitizeSituation, askJev } from '../server.mjs';

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : fallback; };
const seed = Number(arg('seed', 7)), traffic = arg('traffic', 'normal'), seconds = Number(arg('seconds', 90)), out = arg('out', null), minInterval = Number(arg('interval', 450)) / 1000;
const apiKey = (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim();
const model = process.env.TYPESAFE_MODEL || 'jev-latest';
if (!apiKey) { console.error('No TYPESAFE_API in the environment.'); process.exit(2); }

const length = Number(arg('length', 840));
const sim = new Simulation({ seed, traffic, length, targetSeconds: Math.round(length / 9.3) });
const log = [];
let latencyEma = 350, tokens = 0, requests = 0, failures = 0;
const line = (s, a, d, lat) => `t=${s.time.toFixed(1).padStart(5)}s z=${String(s.z).padStart(3)} v=${String(s.v).padStart(2)} ${s.lane.padEnd(28)} | ${a.maneuver.choice.padEnd(15)} p=${(a.maneuver.confidence * 100).toFixed(0).padStart(3)}% ovt=${(a.maneuver.probabilities.overtake * 100).toFixed(0).padStart(2)}% stop=${(a.maneuver.probabilities.stop * 100).toFixed(0).padStart(2)}% pace=${a.pace.choice} hz=${a.hazard.score.toFixed(1)} att=${a.attention.choice.padEnd(22)} pass=${a.pass_window_open.noul.toFixed(2)} yield=${a.must_yield.noul.toFixed(2)} ${lat}ms | ${d}`;
while (!sim.result && sim.time < seconds) {
  sim.timing = { latency_ms: latencyEma, interval_ms: minInterval * 1000 };
  const snap = sim.snapshot();
  const situation = sanitizeSituation(snap.situation);
  let answer;
  try { answer = await askJev(situation, { apiKey, model }); requests++; }
  catch (e) { failures++; console.error(`API failure at t=${sim.time.toFixed(1)}: ${e.message}`); if (failures > 5) break; sim.step(1); continue; }
  const latency = answer.latency_ms / 1000;
  latencyEma = latencyEma * 0.7 + answer.latency_ms * 0.3;
  tokens += answer.usage.input_tokens + answer.usage.output_tokens;
  sim.step(latency);                       // the car kept driving while Jev thought
  const decision = decisionFromAnswers(answer.answers);
  const applied = sim.applyDecision(decision, latency);
  const s = snap.situation, e = sim.ego;
  const detail = [s.lead ? `lead ${s.lead.id} ${s.lead.distance_m}m ${s.lead.gap_class}` : 'no lead', s.oncoming.nearest ? `onc ${s.oncoming.nearest.distance_m}m/${s.oncoming.nearest.seconds_until_meeting}s` : 'no onc', s.overtake_estimate ? `ot:${s.overtake_estimate.margin_class || (s.overtake_estimate.pass_complete ? 'complete' : 'n/a')}` : '', s.being_passed ? `bp:${s.being_passed.position}` : '', s.crossing ? `x:${s.crossing.id} ${s.crossing.stop_line_distance_m}m ${s.crossing.people_on_road}on/${s.crossing.people_waiting_at_kerb}wait/${s.crossing.people_finished}done` : '', `signs ${s.signs.active_limit_kmh}${s.signs.next_sign ? '->' + s.signs.next_sign.limit_kmh + '@' + s.signs.next_sign.distance_m : ''}`].filter(Boolean).join(' ');
  console.log(line({ time: snap.time, z: Math.round(snap.situation.ego.speed_kmh * 0 + e.z), v: s.ego.speed_kmh, lane: s.ego.lane_status }, answer.answers, detail, answer.latency_ms));
  log.push({ time: snap.time, situation: snap.situation, answers: answer.answers, usage: answer.usage, latency_ms: answer.latency_ms, model: answer.model, applied });
  sim.step(Math.max(0, minInterval - latency));
}
const summary = { ...sim.summary(), requests, failures, tokens, average_latency_ms: Math.round(log.reduce((a, l) => a + l.latency_ms, 0) / Math.max(1, log.length)), estimated_cost_usd: Number((tokens * 42e-9).toFixed(4)) };
console.log(JSON.stringify(summary, null, 2));
if (out) { await writeFile(out, JSON.stringify({ generated_at: new Date().toISOString(), seed, traffic, seconds, model, summary, decisions: log }, null, 1)); console.log('saved', out); }
