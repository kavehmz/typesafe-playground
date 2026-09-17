// Bounded live diagnostic: two saved traffic states, then at most 14 decisions
// approaching a persistently occupied crossing. No hidden ego driving policy.
import { readFile } from 'node:fs/promises';
import { Simulation, applyDecision } from '../public/simulation.mjs';
import { decide, validateState } from '../server.mjs';
import { QUESTIONS } from '../questions.mjs';
const options = { apiKey: (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim(), model: 'jev-latest' };
const saved = JSON.parse(await readFile(new URL('../artifacts/natural-drive-revised.json', import.meta.url)));
const checks = [];
for (const index of [3, 16]) {
  const r = await decide(saved.trace[index].state, options), lane = r.answers.lane.choice, speed = r.answers[`${lane}_speed`].choice;
  const pass = lane === 'right' && (index === 3 ? Number(speed) >= 10 && Number(speed) <= 14 : Number(speed) >= 40);
  checks.push({ case: index === 3 ? 'Match nearby moving lead' : 'Return right without slowing for distant next car', matches_expectation: pass, ...r });
  console.error(JSON.stringify({ case: checks.at(-1).case, lane, speed, pass }));
}
const sim = new Simulation(42, 90); sim.signs = []; sim.ego.speed = 5 / 3.6;
sim.crossings = [{ id: 'crosswalk-1', z: 18.2, triggeredAt: 0 }]; // 10 m bumper-to-line gap.
sim.objects = [{ id: 1, kind: 'pedestrian', lane: 'left', x: -.5, z: 18.2, speed: 0, length: .6, width: .55, crossingId: 'crosswalk-1', motion: 'crossing', direction: 1, lateralSpeed: .15, walkSpeed: .15, delay: 0 }];
const trace = []; let lastRtt = null, timer = null, lastWall = performance.now(), lastFresh = 0, fallbackCount = 0, stale = false;
try {
  for (let n = 0; n < 14 && !sim.result; n++) {
    const raw = sim.sensors(); raw.control_timing = { recent_round_trip_ms: lastRtt, source: 'measured_browser' };
    const started = performance.now(), captured = sim.time;
    const r = await decide(validateState(raw), options); lastRtt = performance.now() - started;
    const accepted = applyDecision(sim, r, sim.time - captured);
    if (accepted) { lastFresh = sim.time; stale = false; }
    trace.push({ applied_at_s: sim.time, accepted, ...r });
    console.error(JSON.stringify({ call: n + 1, t: Number(sim.time.toFixed(2)), gap: r.state.motion.crossings[0]?.front_bumper_to_stop_line_m, speed: r.state.ego.speed_kmh, choice: r.answers[`${r.answers.lane.choice}_speed`].choice }));
    if (!timer) {
      lastWall = performance.now(); timer = setInterval(() => {
        const now = performance.now(), dt = Math.min(.1, (now - lastWall) / 1000); lastWall = now;
        if (sim.time - lastFresh > 1.8 && !stale) { sim.setAction(sim.ego.target, 'emergency'); stale = true; fallbackCount++; }
        sim.step(dt);
      }, 16);
    }
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 800 - (performance.now() - started))));
  }
} finally { if (timer) clearInterval(timer); }
const final = validateState(sim.sensors());
const summary = { calls: checks.length + trace.length, traffic_rechecks_passed: checks.every(c => c.matches_expectation), crossing_stop_gap_m: final.motion.crossings[0]?.front_bumper_to_stop_line_m, final_speed_kmh: sim.ego.speed * 3.6, result: sim.result, stale_fallbacks: fallbackCount, driving_seconds: sim.time };
console.error(JSON.stringify(summary));
console.log(JSON.stringify({ checked_at: new Date().toISOString(), note: 'Two fixed traffic rechecks plus a real Jev closed-loop crossing approach. The slowly walking pedestrian remains on the roadway throughout. Real API delays advance the simulation; no controller moves the ego closer automatically.', questions: QUESTIONS, summary, checks, trace, final }, null, 2));
