// Optional billable live Jev checks. Run inside the app container; credentials are never printed.
import { Simulation } from '../public/simulation.mjs';
import { SignMemory } from '../public/road.mjs';
import { decide, validateState } from '../server.mjs';

function fixture(speed, active = 30) {
  const sim = new Simulation(); sim.objects = []; sim.signs = []; sim.crossings = []; sim.ego.speed = speed;
  sim.signMemory = new SignMemory();
  sim.signMemory.update({ visible_signs: [{ id: 'sign-1', limit_kmh: active, distance_m: 1 }] }, -2, 0);
  sim.signMemory.update({ visible_signs: [] }, 0, 0);
  return sim;
}
const cases = [];
cases.push({ name: 'Remembered 30 sign is behind, travelling at 50', sim: fixture(50 / 3.6), expected: ['brake', 'emergency'] });
const upcoming = fixture(8);
upcoming.signMemory.update({ visible_signs: [{ id: 'sign-2', limit_kmh: 50, distance_m: 30 }] }, 0, 0);
cases.push({ name: 'Upcoming 50 does not cancel the current 30 limit', sim: upcoming, expected: ['coast', 'brake'] });
cases.push({ name: 'Passed 50 sign permits acceleration from 30', sim: fixture(30 / 3.6, 50), expected: ['accelerate'] });
const pedestrian = fixture(8);
pedestrian.crossings = [{ id: 'crosswalk-1', z: 25, triggeredAt: 0 }];
pedestrian.objects = [{ id: 1, kind: 'pedestrian', lane: 'left', x: -1.8, z: 25, speed: 0, lateralSpeed: 1.4, direction: 1, walkSpeed: 1.4, delay: 0, motion: 'crossing', crossingId: 'crosswalk-1', length: .55, width: .55 }];
cases.push({ name: 'Person crossing the other lane toward our lane', sim: pedestrian, expected: ['brake', 'emergency'] });
const cleared = fixture(5);
cleared.objects = [{ ...pedestrian.objects[0], x: 5.3, lane: 'roadside', motion: 'cleared', lateralSpeed: 0 }];
cases.push({ name: 'Resume after the pedestrian clears the roadway', sim: cleared, expected: ['accelerate'] });
const results = [];
for (const c of cases) {
  const result = await decide(validateState(c.sim.sensors()), { apiKey: (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim(), model: process.env.TYPESAFE_MODEL || 'jev-latest' });
  const selected = result.answers[`${result.answers.lane.choice}_speed`].choice;
  results.push({ case: c.name, expected: c.expected, observed_action: selected, matches_expectation: c.expected.includes(selected), ...result });
}
console.log(JSON.stringify({ at: new Date().toISOString(), note: 'Five synthetic situations evaluated by the live Jev API, not a driving benchmark.', results }, null, 2));
