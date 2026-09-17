// Six bounded, billable Jev requests; no driving loop, no retry, no browser state changes.
import { Simulation } from '../public/simulation.mjs';
import { SignMemory } from '../public/road.mjs';
import { decide, validateState } from '../server.mjs';

function fixture(speed, limit = 30, lineGap = null) {
  const sim = new Simulation(); sim.objects = []; sim.signs = []; sim.crossings = [];
  sim.ego.speed = speed; sim.ego.control = speed ? 'coast' : 'brake'; sim.signMemory = new SignMemory();
  sim.signMemory.update({ visible_signs: [{ id: 'sign-1', limit_kmh: limit, distance_m: 1 }] }, -2, 0);
  sim.signMemory.update({ visible_signs: [] }, 0, 0);
  if (lineGap !== null) {
    const z = lineGap + 8.2;
    sim.crossings = [{ id: 'crosswalk-1', z, triggeredAt: 0 }];
    sim.objects = [{ id: 1, kind: 'pedestrian', lane: 'left', x: -1.8, z, speed: 0, lateralSpeed: 1.4, motion: 'crossing', crossingId: 'crosswalk-1', length: .55, width: .55 }];
  }
  return sim;
}
const car = (id, lane, z, speed) => ({ id, kind: 'car', lane, x: lane === 'left' ? -1.8 : 1.8, z, speed, desiredSpeed: speed, length: 4.4, width: 1.85 });
const cases = [];
const distantStop = fixture(0, 30, 37); distantStop.objects.push(car(2, 'right', 35, 0));
cases.push({ name: 'Stopped 37 m before the line, with a distant waiting lead car', sim: distantStop, expected: ['ease', 'accelerate'], lane: 'right' });
cases.push({ name: 'Stopped at the line while a pedestrian is crossing', sim: fixture(0, 30, .8), expected: ['coast', 'slow', 'brake', 'emergency'], lane: 'right' });
cases.push({ name: 'Slow approach with 24 m still available to the line', sim: fixture(2, 30, 24), expected: ['coast', 'ease', 'accelerate'], lane: 'right' });
cases.push({ name: 'Fast approach only 8 m before the occupied crossing stop line', sim: fixture(8, 30, 8), expected: ['brake', 'emergency'], lane: 'right' });
const distantCar = fixture(10, 50); distantCar.objects = [car(2, 'right', 94.4, 4)];
cases.push({ name: 'Slower car 90 m ahead does not require an immediate stop or lane change', sim: distantCar, expected: ['accelerate', 'ease', 'coast'], lane: 'right' });
const closeCar = fixture(8, 50); closeCar.objects = [car(2, 'right', 11.4, 3), car(3, 'left', 0, 8)];
cases.push({ name: 'Closing on a lead car 7 m ahead with the adjacent lane occupied', sim: closeCar, expected: ['brake', 'emergency'], lane: 'right' });

const index = process.argv[2] === undefined ? null : Number(process.argv[2]);
if (index !== null && (!Number.isInteger(index) || index < 0 || index >= cases.length)) throw new Error('Choose a case index from 0 through 5.');
const selected = index === null ? cases : [cases[index]];
const results = [];
for (const c of selected) {
  const raw = c.sim.sensors(); raw.control_timing = { recent_round_trip_ms: 345, source: 'scenario_assumption' };
  const result = await decide(validateState(raw), { apiKey: (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim(), model: process.env.TYPESAFE_MODEL || 'jev-latest' });
  const lane = result.answers.lane.choice, action = result.answers[`${lane}_speed`].choice;
  results.push({ case: c.name, expected_actions: c.expected, expected_lane: c.lane, observed_lane: lane, observed_action: action, matches_expectation: lane === c.lane && c.expected.includes(action), ...result });
}
console.log(JSON.stringify({ checked_at: new Date().toISOString(), note: `${selected.length} live Jev evaluations of synthetic snapshots. The assumed historical round trip is 345 ms. This is not a complete closed-loop driving validation.`, results }, null, 2));
