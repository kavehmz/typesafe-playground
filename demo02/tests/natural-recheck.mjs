// Explicit bounded rechecks of saved sensor states; no driving or browser mutation.
import { readFile } from 'node:fs/promises';
import { decide } from '../server.mjs';
import { QUESTIONS } from '../questions.mjs';
const saved = JSON.parse(await readFile(new URL('../artifacts/natural-drive-check.json', import.meta.url)));
const cases = [
  { name: 'Positive passing margins while matching a slow moving lead', state: saved.trace[12].state, expectedLane: 'left' },
  { name: 'Stopped far before an occupied crossing', state: saved.snapshots[0].state, expectedLane: 'right', minimum: 1, maximum: 10 },
  { name: 'Hold at the line while occupied', state: saved.snapshots[1].state, expectedLane: 'right', minimum: 0, maximum: 0 }
];
const results = [];
for (const c of cases) {
  const r = await decide(c.state, { apiKey: (process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '').trim(), model: 'jev-latest' });
  const lane = r.answers.lane.choice, speed = r.answers[`${lane}_speed`].choice;
  results.push({ case: c.name, matches_expectation: lane === c.expectedLane && (c.minimum === undefined || Number(speed) >= c.minimum && Number(speed) <= c.maximum), ...r });
  console.error(JSON.stringify({ case: c.name, lane, speed, matches_expectation: results.at(-1).matches_expectation }));
}
console.log(JSON.stringify({ checked_at: new Date().toISOString(), note: 'Three billable fixed-state rechecks with revised questions. Inputs are saved observations from the earlier diagnostic, not new browser measurements.', questions: QUESTIONS, results }, null, 2));
