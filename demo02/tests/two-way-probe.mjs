// Bounded, billable real Jev diagnostics: eight fixed snapshots, or one by zero-based case index.
// No driving loop, no retries, no modification of browser runs.
import { Simulation } from '../public/simulation.mjs';
import { SignMemory } from '../public/road.mjs';
import { decide, validateState } from '../server.mjs';
import { QUESTIONS } from '../questions.mjs';

const car = (id, lane, z, speed, travelDirection = 1) => ({ id, kind: 'car', lane, x: lane === 'left' ? -1.8 : 1.8, z, speed, desiredSpeed: speed, travelDirection, length: 4.4, width: 1.85 });
const incoming = (id, z, speed) => car(id, 'left', z, speed, -1);
function scene(speed = 12, lane = 'right', limit = 50) {
  const s = new Simulation(); s.objects = []; s.signs = []; s.crossings = [];
  Object.assign(s.ego, { speed, x: lane === 'left' ? -1.8 : 1.8, lane, target: lane, control: 'coast' });
  s.signMemory = new SignMemory(); s.signMemory.update({ visible_signs: [{ id: 'sign-1', limit_kmh: limit, distance_m: 1 }] }, -2, 0); s.signMemory.update({ visible_signs: [] }, 0, 0);
  return s;
}
const cases = [];
let s = scene(); s.objects = [car(1, 'right', 20, 3.5), incoming(2, 90, 10)];
cases.push({ name: 'Wait right: oncoming traffic leaves insufficient passing time', sim: s, lane: 'right' });
s = scene(); s.objects = [car(1, 'right', 16, 3), incoming(2, 330, 8)];
cases.push({ name: 'Pass a slow car with a large observed window and return space', sim: s, lane: 'left' });
s = scene(7, 'right', 30); s.objects = [car(1, 'right', 25, 8)];
cases.push({ name: 'No detected oncoming car is not infinite visibility for a very slow pass', sim: s, lane: 'right' });
s = scene(12, 'left'); s.objects = [car(1, 'right', -1, 3), incoming(2, 200, 8)];
cases.push({ name: 'Remain left briefly while the passed car still overlaps', sim: s, lane: 'left' });
s = scene(12, 'left'); s.objects = [car(1, 'right', -22, 3), incoming(2, 120, 10)];
cases.push({ name: 'Return right when fully clear of the passed car', sim: s, lane: 'right' });
s = scene(7, 'left', 30); s.objects = [car(1, 'right', 0, 7.5), incoming(2, 130, 10)];
cases.push({ name: 'Abort an unfinishable pass: brake while alongside instead of cutting right', sim: s, lane: 'left', actions: ['brake', 'emergency'] });
s = scene(); s.objects = [car(1, 'right', 16, 3)]; s.crossings = [{ id: 'crosswalk-1', z: 30, triggeredAt: null }];
cases.push({ name: 'Solid centre line at a crossing prohibits starting a pass', sim: s, lane: 'right' });
s = scene(2, 'left', 30); s.objects = [car(1, 'right', 14, 7.5), incoming(2, 80, 8)];
cases.push({ name: 'After dropping behind, return right into the opened gap', sim: s, lane: 'right' });

const indices = process.argv[2] === undefined ? null : process.argv[2].split(',').map(Number);
if (indices && indices.some(index => !Number.isInteger(index) || index < 0 || index >= cases.length)) throw new Error('Choose case indices from 0 through 7.');
const selected = indices === null ? cases : indices.map(index => cases[index]), results = [];
for (const c of selected) {
  const raw = c.sim.sensors(); raw.control_timing = { recent_round_trip_ms: 345, source: 'scenario_assumption' };
  const r = await decide(validateState(raw), { apiKey: (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim(), model: process.env.TYPESAFE_MODEL || 'jev-latest' });
  const lane = r.answers.lane.choice, action = r.answers[`${lane}_speed`].choice;
  results.push({ case: c.name, expected_lane: c.lane, expected_actions: c.actions ?? null, observed_lane: lane, observed_action: action, matches_expectation: lane === c.lane && (!c.actions || c.actions.includes(action)), ...r });
}
console.log(JSON.stringify({ checked_at: new Date().toISOString(), note: `${selected.length} fixed synthetic situations evaluated by the live Jev API. 345 ms timing is a scenario assumption. These are not a complete driving validation.`, questions: QUESTIONS, results }, null, 2));
