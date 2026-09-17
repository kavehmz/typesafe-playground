import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { QUESTIONS, SAMPLES } from '../questions.mjs';
import { createApp, makeState, validateResponse, evaluate } from '../server.mjs';
import { decide, DEFAULT_POLICY } from '../public/policy.mjs';

const state = makeState(SAMPLES[0]);
function fixture(team = 'billing') {
  const answers = {};
  for (const [id, q] of Object.entries(QUESTIONS)) {
    if (q.type === 'noul') answers[id] = { type: 'noul', noul: id === 'refund_requested' ? 0.99 : 0.01 };
    if (q.type === 'choice') answers[id] = { type: 'choice', choice: team, confidence: 1, probabilities: Object.fromEntries(Object.keys(q.criteria).map(k => [k, Number(k === team)])) };
    if (q.type === 'score') answers[id] = { type: 'score', score: 0, confidence: 1, probabilities: Object.fromEntries(q.criteria.map((_, i) => [i, Number(i === 0)])), legend: Object.fromEntries(q.criteria.map((value, i) => [i, value])) };
  }
  return { model: 'jev-test', answers, usage: { input_tokens: 300, output_tokens: 60 } };
}
test('explicit human requests override confident automatic routing', () => {
  const { answers } = fixture(); answers.human_requested.noul = 0.98;
  const decision = decide(answers, state);
  assert.equal(decision.destination, 'Human support');
  assert.equal(decision.review, true);
  assert.ok(!decision.used.includes('team'));
  assert.ok(!decision.used.includes('refund_requested'));
});
test('an uncertain request for a human is not silently treated as no', () => {
  const { answers } = fixture(); answers.human_requested.noul = 0.5;
  assert.equal(decide(answers, state).destination, 'Human review');
});
test('unrelated speculative answers never block a sales route', () => {
  const { answers } = fixture('sales');
  answers.refund_requested.noul = 0.5; answers.reproducible.noul = 0.5; answers.frustration.confidence = 0;
  const decision = decide(answers, state);
  assert.equal(decision.destination, 'Sales');
  assert.equal(decision.review, false);
  assert.ok(!decision.used.includes('refund_requested'));
  assert.ok(!decision.used.includes('reproducible'));
});
test('changing a threshold recomposes the same answers and preserves raw data', () => {
  const { answers } = fixture(); answers.team.confidence = 0.72;
  const before = structuredClone(answers);
  assert.equal(decide(answers, state).review, true);
  assert.equal(decide(answers, state, { ...DEFAULT_POLICY, confidence: 0.7 }).review, false);
  assert.deepEqual(answers, before);
});
test('no-match always needs context even with perfect model confidence', () => {
  assert.equal(decide(fixture('other').answers, state, { ...DEFAULT_POLICY, confidence: 0 }).review, true);
});
test('known incident affects only confirmed technical routing, not billing', () => {
  const incident = { ...state, service: { status: 'incident' } };
  assert.equal(decide(fixture('technical').answers, incident).priority, 'High');
  assert.equal(decide(fixture('billing').answers, incident).priority, 'Normal');
});
test('uncertain urgency is reviewed without hiding the team decision', () => {
  const { answers } = fixture(); answers.urgency.confidence = 0.3;
  const decision = decide(answers, state);
  assert.equal(decision.destination, 'Billing'); assert.equal(decision.priority, 'Review');
});
test('invalid and inconsistent model output cannot drive the policy', () => {
  for (const mutate of [d => delete d.answers.team, d => { d.answers.human_requested.noul = 2; }, d => { d.answers.team.choice = 'invented'; }, d => { d.answers.team.probabilities.billing = 0.2; }, d => { d.answers.urgency.score = 2; }, d => { d.usage.input_tokens = -1; }]) {
    const data = fixture(); mutate(data);
    assert.throws(() => validateResponse(data), /unexpected response/);
  }
});
test('input validation rejects blank, oversized and invalid context', () => {
  for (const input of [{ ...SAMPLES[0], message: '  ' }, { ...SAMPLES[0], message: 'x'.repeat(8001) }, { ...SAMPLES[0], plan: 'Unknown' }, null]) assert.throws(() => makeState(input));
});
test('busy API retries are bounded and measured, and questions are batched', async () => {
  let count = 0;
  const delays = [];
  const result = await evaluate(state, { apiKey: 'test-only-secret', sleep: async ms => delays.push(ms), fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.typesafe.ai/v1/systemone');
    assert.equal(Object.keys(JSON.parse(options.body).questions).length, 6);
    return ++count === 1 ? new Response('{}', { status: 429, headers: { 'retry-after': '1' } }) : Response.json(fixture());
  } });
  assert.equal(result.meta.attempts, 2); assert.deepEqual(delays, [1000]);
  assert.ok(!JSON.stringify(result).includes('test-only-secret'));
});
test('service errors never expose an upstream body or credential', async () => {
  await assert.rejects(evaluate(state, { apiKey: 'test-only-secret', fetchImpl: async () => new Response('test-only-secret sensitive upstream text', { status: 401 }) }), error => error.status === 502 && !error.message.includes('test-only-secret'));
});
test('container HTTP flow serves UI, validates input and keeps secrets server-side', async t => {
  let calls = 0;
  const server = createApp({ apiKey: 'test-only-secret', fetchImpl: async () => { calls++; return Response.json(fixture()); } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/', '/api/config', '/app.mjs', '/style.css', '/policy.mjs']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.ok(!(await response.text()).includes('test-only-secret'));
  }
  for (const path of ['/.env', '/../.env', '/server.mjs']) assert.equal((await fetch(base + path)).status, 404);
  const post = (body, origin) => fetch(base + '/api/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin && { Origin: origin }) }, body: JSON.stringify(body) });
  assert.equal((await post({ ...SAMPLES[0], message: '' })).status, 400);
  assert.equal((await post(SAMPLES[0], 'https://unrelated.example')).status, 403);
  assert.equal(calls, 0);
  const response = await post(SAMPLES[0], base);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.answers.team.choice, 'billing'); assert.equal(calls, 1);
  assert.ok(!JSON.stringify(data).includes('test-only-secret'));
});
test('missing credentials produces a visible configuration error without inference', async t => {
  const server = createApp({ apiKey: '', fetchImpl: () => { throw new Error('Must not run'); } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await (await fetch(base + '/api/health')).json()).configured, false);
  const response = await fetch(base + '/api/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(SAMPLES[0]) });
  assert.equal(response.status, 503);
});
