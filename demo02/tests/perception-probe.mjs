// Optional live API probe (billable). Not included in npm test.
// Run: docker compose exec -T app node tests/perception-probe.mjs
import { Simulation } from '../public/simulation.mjs';
import { validateState, decide } from '../server.mjs';
const car = (id, lane, z, speed) => ({ id, kind: 'car', lane, x: lane === 'left' ? -1.8 : 1.8, z, speed, desiredSpeed: speed, length: 4.4, width: 1.85 });
const cases = [
  { name: 'Returning right while the overtaken car still overlaps', expected_lane: 'left', objects: [car(1, 'right', -1.2, 14), car(2, 'left', 28, 8)] },
  { name: 'Fast rear traffic approaching the destination lane', expected_lane: 'left', objects: [car(1, 'right', -17, 22), car(2, 'left', 40, 9)] },
  { name: 'Overtaken car well behind and pulling away from it', expected_lane: 'right', objects: [car(1, 'right', -32, 12), { id: 2, kind: 'barrier', lane: 'left', x: -1.8, z: 45, speed: 0, length: 1.4, width: 2.65 }] },
  { name: 'Clear road, preserve lane and make progress', expected_lane: 'left', objects: [] }
];
const results = [];
for (const fixture of cases) {
  const sim = new Simulation(); Object.assign(sim.ego, { x: -1.8, lane: 'left', target: 'left', speed: 16 }); sim.objects = fixture.objects;
  const state = validateState(sim.sensors());
  const answer = await decide(state, { apiKey: (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim(), model: process.env.TYPESAFE_MODEL || 'jev-latest' });
  results.push({ case: fixture.name, expected_lane: fixture.expected_lane, observed_lane: answer.answers.lane.choice, matches_expectation: answer.answers.lane.choice === fixture.expected_lane, ...answer });
}
console.log(JSON.stringify({ checked_at: new Date().toISOString(), note: 'Four hand-written live sensor probes, not a representative driving benchmark.', results }, null, 2));
