// Billable diagnostic: at most 25 live decisions in a 20 s driving loop,
// then two fixed pedestrian situations. No browser runs are changed.
import { Simulation, applyDecision } from '../public/simulation.mjs';
import { SignMemory } from '../public/road.mjs';
import { decide, validateState } from '../server.mjs';
import { QUESTIONS } from '../questions.mjs';
const car = (id, lane, z, kmh, direction = 1) => ({ id, kind: 'car', lane, x: lane === 'left' ? -1.8 : 1.8, z, speed: kmh / 3.6, desiredSpeed: kmh / 3.6, travelDirection: direction, length: 4.4, width: 1.85 });
const options = { apiKey: (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim(), model: process.env.TYPESAFE_MODEL || 'jev-latest' };
if (!options.apiKey) throw new Error('Missing API credential');
function scene(speedKmh) {
  const sim = new Simulation(42, 90); sim.objects = []; sim.crossings = []; sim.signs = []; sim.signMemory = new SignMemory();
  sim.ego.speed = speedKmh / 3.6; return sim;
}
const sim = scene(20);
sim.objects = [car(1, 'right', 17, 12), car(2, 'right', 150, 15), car(3, 'left', 55, 36, -1), car(4, 'left', 550, 36, -1)];
const trace = [], samples = [], snapshots = []; let lastRtt = null, lastFresh = 0, fallback = false, fallbackCount = 0;
let timer = null, lastWall = performance.now(), startedPass = false, returnedAt = null, callCount = 0;
const raw = s => {
  const r = s.sensors(); r.control_timing = { recent_round_trip_ms: lastRtt, source: 'measured_browser' }; return r;
};
const tick = () => {
  const now = performance.now(), dt = Math.min(.1, (now - lastWall) / 1000); lastWall = now;
  if (sim.result || sim.time >= 20) return;
  if (sim.time - lastFresh > 1.8 && !fallback) { sim.setAction(sim.ego.target, 'emergency'); fallback = true; fallbackCount++; }
  sim.step(dt);
  if (sim.ego.target === 'left') startedPass = true;
  if (startedPass && sim.ego.target === 'right' && !sim.ego.lanePath && !sim.overtakeMemory && returnedAt === null) returnedAt = sim.time;
  samples.push({ t: sim.time, x: sim.ego.x, z: sim.ego.z, speed_kmh: sim.ego.speed * 3.6, heading_rad: sim.ego.headingRad, steer_rad: sim.ego.steeringAngle });
};
try {
  while (callCount < 25 && !sim.result && sim.time < 20 && !(returnedAt !== null && sim.time > returnedAt + 1)) {
    const requestedWall = performance.now(), requestedTime = sim.time, state = validateState(raw(sim));
    callCount++;
    const result = await decide(state, options);
    lastRtt = performance.now() - requestedWall;
    const accepted = applyDecision(sim, result, sim.time - requestedTime);
    if (accepted) { lastFresh = sim.time; fallback = false; }
    const lane = result.answers.lane.choice, target = result.answers[`${lane}_speed`].choice;
    trace.push({ requested_at_s: requestedTime, applied_at_s: sim.time, accepted, ...result });
    console.error(JSON.stringify({ call: callCount, t: Number(sim.time.toFixed(2)), lane, target, actual_kmh: Number((sim.ego.speed * 3.6).toFixed(1)), target_id: state.passing.pass?.target_id, gain_m: state.passing.pass?.relative_gain_still_needed_m, right_gap: state.radar.right.front_gap_m, latency_ms: result.latency_ms }));
    if (!timer) { lastWall = performance.now(); timer = setInterval(tick, 16); }
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 800 - (performance.now() - requestedWall))));
  }
} finally { if (timer) clearInterval(timer); }
for (const gap of [37, 1]) {
  const s = scene(0), z = gap + 6 + 2.2;
  s.crossings = [{ id: 'crosswalk-1', z, triggeredAt: 0 }];
  s.objects = [{ id: 1, kind: 'pedestrian', lane: 'right', x: 1.8, z, speed: 0, length: .6, width: .55, crossingId: 'crosswalk-1', motion: 'crossing', direction: 1, lateralSpeed: .5, walkSpeed: .5, delay: 0 }];
  const result = await decide(validateState(raw(s)), options); callCount++;
  const lane = result.answers.lane.choice, speed = result.answers[`${lane}_speed`].choice;
  snapshots.push({ case: `Stopped ${gap} m before occupied crossing stop line`, expectation: gap > 10 ? 'low positive target' : 'zero target', matches_expectation: lane === 'right' && (gap > 10 ? Number(speed) > 0 && Number(speed) <= 15 : speed === '0'), ...result });
  console.error(JSON.stringify({ crossing_gap_m: gap, lane, target: speed }));
}
const beforePass = trace.filter(r => r.state.passing.phase === 'keeping_right' && r.state.passing.oncoming[0]?.gap_m < 70);
const summary = {
  calls: callCount, driving_seconds: sim.time, collision: sim.result?.reason === 'collision', result: sim.result,
  matched_moving_lead_without_zero: beforePass.length > 0 && beforePass.every(r => r.answers.lane.choice === 'right' && Number(r.answers.right_speed.choice) > 0),
  selected_left_to_pass: startedPass, completed_return_right_at_s: returnedAt,
  stale_fallbacks: fallbackCount, pedestrian_snapshots_passed: snapshots.every(s => s.matches_expectation)
};
console.log(JSON.stringify({ checked_at: new Date().toISOString(), note: 'Live Jev closed-loop diagnostic with real measured API delay and the same physics/actuators as the app. It is a bounded synthetic scenario, not a full randomized driving benchmark. Two crossing cases are fixed snapshots, not a driving loop. No hidden policy selects an ego action.', questions: QUESTIONS, summary, trace, samples, snapshots }, null, 2));
console.error(JSON.stringify(summary));
