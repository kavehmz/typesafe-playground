import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { QUESTIONS, QUESTION_LABELS, SAMPLES } from './questions.mjs';

const ASSETS = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/policy.mjs', ['policy.mjs', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']]
]);

export class PublicError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function makeState(body) {
  if (!body || typeof body.message !== 'string' || !body.message.trim()) throw new PublicError(400, 'Enter a support message first.');
  if (body.message.length > 8000) throw new PublicError(400, 'Keep the message under 8,000 characters.');
  const plans = ['Starter', 'Pro', 'Enterprise'];
  const statuses = ['unknown', 'operational', 'incident'];
  if (!plans.includes(body.plan) || !statuses.includes(body.serviceStatus)) throw new PublicError(400, 'Choose a valid account plan and service status.');
  return { ticket: { message: body.message.trim() }, customer: { plan: body.plan }, service: { status: body.serviceStatus } };
}

export function validateResponse(data) {
  const fail = () => { throw new PublicError(502, 'TypeSafe returned an unexpected response. No routing decision was made.'); };
  const bounded = (v, max = 1) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
  if (!data || typeof data.model !== 'string' || !data.answers) fail();
  const answers = {};
  for (const [id, q] of Object.entries(QUESTIONS)) {
    const a = data.answers[id];
    if (!a || a.type !== q.type) fail();
    if (q.type === 'noul') {
      if (!bounded(a.noul)) fail();
      answers[id] = { type: 'noul', noul: a.noul };
      continue;
    }
    const keys = q.type === 'choice' ? Object.keys(q.criteria) : q.criteria.map((_, i) => String(i));
    if (!bounded(a.confidence) || !a.probabilities || Array.isArray(a.probabilities) || Object.keys(a.probabilities).length !== keys.length) fail();
    if (keys.some(key => !bounded(a.probabilities[key]))) fail();
    if (Math.abs(keys.reduce((sum, k) => sum + a.probabilities[k], 0) - 1) > 0.025) fail();
    if (q.type === 'choice') {
      if (!keys.includes(a.choice)) fail();
      if (a.probabilities[a.choice] + 0.01 < Math.max(...Object.values(a.probabilities))) fail();
      answers[id] = { type: 'choice', choice: a.choice, probabilities: a.probabilities, confidence: a.confidence };
    } else {
      if (!bounded(a.score, keys.length - 1)) fail();
      const mean = keys.reduce((sum, key) => sum + Number(key) * a.probabilities[key], 0);
      if (Math.abs(mean - a.score) > 0.06) fail();
      answers[id] = { type: 'score', score: a.score, probabilities: a.probabilities, confidence: a.confidence, legend: Object.fromEntries(q.criteria.map((v, i) => [i, v])) };
    }
  }
  if (!data.usage || !Number.isInteger(data.usage.input_tokens) || data.usage.input_tokens < 0 || !Number.isInteger(data.usage.output_tokens) || data.usage.output_tokens < 0) fail();
  return { model: data.model, answers, usage: { input_tokens: data.usage.input_tokens, output_tokens: data.usage.output_tokens } };
}

export async function evaluate(state, { apiKey, model = 'jev-latest', fetchImpl = fetch, sleep = ms => new Promise(r => setTimeout(r, ms)) }) {
  const request = { model, state, questions: QUESTIONS };
  const started = performance.now();
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    let response;
    try {
      response = await fetchImpl('https://api.typesafe.ai/v1/systemone', {
        method: 'POST', redirect: 'error',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(request), signal: AbortSignal.timeout(20000)
      });
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new PublicError(504, 'TypeSafe did not respond within 20 seconds. Try again.');
      throw new PublicError(502, 'Could not reach TypeSafe. Check the container’s internet connection.');
    }
    if ((response.status === 429 || response.status === 529) && attempts < 3) {
      const retryAfter = response.headers.get('retry-after');
      const seconds = Number(retryAfter);
      const waitMs = retryAfter && Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 500 * 2 ** (attempts - 1);
      await response.body?.cancel();
      await sleep(Math.min(waitMs, 5000));
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      const message = response.status === 401 || response.status === 403 ? 'TypeSafe rejected the credential. Check TYPESAFE_API in the parent .env and recreate the container.'
        : response.status === 429 || response.status === 529 ? 'TypeSafe is busy or rate-limited. Wait a moment and retry.'
          : response.status === 402 ? 'TypeSafe reports insufficient credit. Check your account balance.'
            : `TypeSafe could not evaluate this request (HTTP ${response.status}).`;
      throw new PublicError(response.status === 429 || response.status === 529 ? 503 : 502, message);
    }
    let data;
    try { data = await response.json(); } catch { throw new PublicError(502, 'TypeSafe returned unreadable data. Try again.'); }
    return { ...validateResponse(data), request, meta: { elapsedMs: Math.round(performance.now() - started), attempts, questions: Object.keys(QUESTIONS).length, evaluatedAt: new Date().toISOString() } };
  }
}

async function readBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new PublicError(415, 'Send JSON with this request.');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 40000) throw new PublicError(413, 'This request is too large.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new PublicError(400, 'The request contains invalid JSON.'); }
}

export function createApp({ apiKey = process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API || '', model = process.env.TYPESAFE_MODEL || 'jev-latest', fetchImpl = fetch, sleep } = {}) {
  let active = false;
  return http.createServer(async (req, res) => {
    const headers = {
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
    };
    const json = (status, body) => { res.writeHead(status, { ...headers, 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && path === '/api/health') return json(200, { ok: true, configured: Boolean(apiKey.trim()), model });
      if (req.method === 'GET' && path === '/api/config') return json(200, { configured: Boolean(apiKey.trim()), model, samples: SAMPLES, questions: QUESTIONS, labels: QUESTION_LABELS });
      if (req.method === 'GET' && ASSETS.has(path)) {
        const [filename, type] = ASSETS.get(path);
        const contents = await readFile(new URL(`./public/${filename}`, import.meta.url));
        res.writeHead(200, { ...headers, 'Content-Type': type }); return res.end(contents);
      }
      if (req.method !== 'POST' || path !== '/api/evaluate') return json(404, { error: 'Not found.' });
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) throw new PublicError(403, 'Open this demo directly on its local address.');
      const body = await readBody(req);
      const state = makeState(body);
      if (!apiKey.trim()) throw new PublicError(503, 'Add TYPESAFE_API or TYPESAFE_API_KEY to the parent .env, then recreate the container.');
      if (active) throw new PublicError(429, 'An evaluation is already running. Please wait.');
      active = true;
      try { return json(200, await evaluate(state, { apiKey: apiKey.trim(), model, fetchImpl, sleep })); }
      finally { active = false; }
    } catch (error) {
      // Never forward upstream bodies, keys, request content or internal exception details.
      return json(error instanceof PublicError ? error.status : 500, { error: error instanceof PublicError ? error.message : 'The demo encountered an unexpected error. Try again.' });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const server = createApp();
  server.requestTimeout = 85000;
  server.listen(port, '0.0.0.0', () => console.log(`Decision Lab listening on port ${port}.`));
  process.on('SIGTERM', () => server.close());
  process.on('SIGINT', () => server.close());
}
