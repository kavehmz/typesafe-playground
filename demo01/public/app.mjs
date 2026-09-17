import { decide, DEFAULT_POLICY, TEAM_NAMES } from './policy.mjs';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const percent = value => `${Math.round(value * 100)}%`;
const signalIds = ['team', 'human_requested', 'refund_requested', 'urgency', 'frustration', 'reproducible'];
const signalTypes = { team: 'choice', human_requested: 'noul', refund_requested: 'noul', urgency: 'score', frustration: 'score', reproducible: 'noul' };
const signalNames = { team: 'Owning team', human_requested: 'Human requested', refund_requested: 'Refund requested', urgency: 'Urgency', frustration: 'Frustration', reproducible: 'Reproduction steps' };
let config;
let result = null;
let busy = false;
let selectedSample = 'double-charge';
let inspectorView = 'request';
let timer;
let suiteRows = [];
const policy = { ...DEFAULT_POLICY };

function formBody() { return { message: $('message').value, plan: $('plan').value, serviceStatus: $('service-status').value }; }
function currentState() {
  const { message, plan, serviceStatus } = formBody();
  return { ticket: { message: message.trim() }, customer: { plan }, service: { status: serviceStatus } };
}
function clearError() { $('error').hidden = true; $('error').textContent = ''; }
function showError(message) { $('error').textContent = message; $('error').hidden = false; }
function updateCount() { $('character-count').textContent = `${$('message').value.length.toLocaleString()} / 8,000`; }

function setBusy(value, suite = false) {
  busy = value;
  const available = Boolean(config?.configured);
  $('evaluate').disabled = busy || !available;
  $('run-suite').disabled = busy || !available;
  for (const element of [$('message'), $('plan'), $('service-status'), ...document.querySelectorAll('.sample')]) element.disabled = busy;
  document.querySelector('.output-column').setAttribute('aria-busy', String(busy && !suite));
  document.body.classList.toggle('loading', busy && !suite);
  clearInterval(timer);
  if (busy && !suite) {
    $('evaluate').firstElementChild.textContent = 'Evaluating six questions…';
    $('decision-status').textContent = 'EVALUATING';
    const start = performance.now();
    timer = setInterval(() => { $('request-note').textContent = `Waiting for TypeSafe · ${((performance.now() - start) / 1000).toFixed(1)} s elapsed`; }, 100);
  } else {
    $('evaluate').firstElementChild.textContent = 'Evaluate message';
    $('request-note').textContent = 'One live API request · six independent questions';
    if (!busy) render();
  }
}

function renderSamples() {
  $('samples').innerHTML = (config?.samples || []).map(sample => `<button class="sample${sample.id === selectedSample ? ' selected' : ''}" data-sample="${escape(sample.id)}" type="button" aria-pressed="${sample.id === selectedSample}"><span>${escape(sample.icon)}</span>${escape(sample.name)}</button>`).join('');
}
function loadSample(id) {
  const sample = config.samples.find(s => s.id === id);
  if (!sample) return;
  selectedSample = id;
  $('message').value = sample.message;
  $('plan').value = sample.plan;
  $('service-status').value = sample.serviceStatus;
  result = null;
  updateCount(); clearError(); renderSamples(); render();
}

function distribution(answer, id) {
  if (!answer.probabilities) return '';
  return `<details><summary>View distribution</summary><div class="distribution">${Object.entries(answer.probabilities).map(([key, p]) => {
    const label = id === 'team' ? TEAM_NAMES[key] : `Level ${key}`;
    const title = answer.legend?.[key] || label;
    return `<div class="dist-row" title="${escape(title)}"><span>${escape(label)}</span><span>${percent(p)}</span><div class="dist-track"><i style="width:${p * 100}%"></i></div></div>`;
  }).join('')}</div></details>`;
}

function renderSignals(decision) {
  const expanded = new Set([...document.querySelectorAll('.signal-card:has(details[open])')].map(e => e.dataset.signal));
  $('signals').innerHTML = signalIds.map(id => {
    const a = result?.answers[id];
    const type = signalTypes[id];
    let value = '—', detail = 'Waiting for a judgment', meter = 0;
    if (a) {
      if (type === 'choice') { value = escape(TEAM_NAMES[a.choice]); meter = a.probabilities[a.choice]; detail = `${percent(a.confidence)} confidence`; }
      if (type === 'noul') { value = percent(a.noul); meter = a.noul; detail = 'Probability of yes'; }
      if (type === 'score') { const max = id === 'urgency' ? 3 : 2; value = `${a.score.toFixed(2)}<small>/ ${max}</small>`; meter = a.score / max; detail = `${percent(a.confidence)} confidence`; }
    }
    const used = Boolean(decision?.used.includes(id));
    const usage = id === 'frustration' ? 'observe' : used ? 'used' : 'unused';
    return `<article class="signal-card" data-signal="${id}"><div class="signal-top"><span class="type-tag ${type}">${type.toUpperCase()}</span>${a ? `<span class="signal-use ${used ? '' : 'unused'}" title="${used ? 'Used in the current decision' : 'Not used in the current decision'}">${usage}</span>` : ''}</div><div class="signal-name">${signalNames[id]}</div><div class="signal-value${type === 'choice' ? ' word' : ''}${a ? '' : ' empty'}">${value}</div><div class="signal-meter"><span style="width:${meter * 100}%"></span></div><div class="signal-meta">${detail}</div>${a ? distribution(a, id) : ''}</article>`;
  }).join('');
  for (const id of expanded) document.querySelector(`[data-signal="${id}"] details`)?.setAttribute('open', '');
}

function inspectData() {
  if (inspectorView === 'request') return result?.request || { model: config?.model || 'jev-latest', state: currentState(), questions: config?.questions || {} };
  if (inspectorView === 'response') {
    if (!result) return { note: 'Evaluate a message to inspect a real response.' };
    return { model: result.model, answers: result.answers, usage: result.usage, measured: result.meta };
  }
  if (!result) return { policy, note: 'Evaluate a message to inspect the code decision.' };
  return { policy, ...decide(result.answers, result.request.state, policy), note: 'A simulated routing decision. No ticket is sent and no refund is issued.' };
}
function renderInspector() { $('inspect-content').textContent = JSON.stringify(inspectData(), null, 2); }

function render() {
  const decision = result ? decide(result.answers, result.request.state, policy) : null;
  renderSignals(decision);
  if (!decision) {
    $('decision-heading').innerHTML = 'Your next move,<br>made visible.';
    $('decision-status').textContent = 'WAITING FOR EVALUATION';
    $('priority-pill').textContent = 'Run a message to begin';
    $('priority-pill').className = 'priority-pill';
    $('route-summary').textContent = 'A rule you can inspect. A threshold you can change.';
    $('reasons').innerHTML = '<li>Evaluate a message to see which rules fire.</li>';
    $('flags').replaceChildren();
    $('latency').textContent = '—'; $('tokens').textContent = '—'; $('calls').textContent = '—';
  } else {
    $('decision-heading').textContent = decision.destination;
    $('decision-status').textContent = decision.review ? 'HUMAN REVIEW' : 'READY TO ROUTE';
    $('priority-pill').textContent = decision.priority === 'Review' ? 'Priority needs review' : `${decision.priority} priority`;
    $('priority-pill').className = `priority-pill ${decision.priority.toLowerCase()}`;
    $('route-summary').textContent = decision.review ? 'Pause automatic routing. Keep the human in the loop.' : 'Routing preview · no external action is taken';
    $('reasons').innerHTML = decision.reasons.map(r => `<li>${escape(r)}</li>`).join('');
    $('flags').innerHTML = decision.flags.map(f => `<span class="flag">${escape(f)}</span>`).join('');
    $('latency').textContent = `${result.meta.elapsedMs.toLocaleString()} ms`;
    $('tokens').textContent = `${result.usage.input_tokens.toLocaleString()} / ${result.usage.output_tokens.toLocaleString()}`;
    $('calls').textContent = result.meta.attempts;
  }
  renderInspector();
}

async function evaluate(body) {
  const response = await fetch('/api/evaluate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(80000)
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('The local server returned an unreadable response. Check that the container is running.'); }
  if (!response.ok) throw new Error(data.error || 'Evaluation failed. Try again.');
  return data;
}
function errorMessage(error) {
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return 'The request timed out. Check the connection and try again.';
  if (error instanceof TypeError) return 'The demo server is unreachable. Check that the container is running.';
  return error.message;
}

$('ticket-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  clearError(); result = null; render(); setBusy(true);
  try { result = await evaluate(formBody()); }
  catch (error) { showError(errorMessage(error)); }
  finally { setBusy(false); }
});
$('samples').addEventListener('click', event => {
  const button = event.target.closest('[data-sample]');
  if (button && !busy) loadSample(button.dataset.sample);
});
for (const id of ['message', 'plan', 'service-status']) $(id).addEventListener('input', () => {
  selectedSample = null; result = null; updateCount(); clearError(); renderSamples(); render();
});
for (const [id, key, output] of [['confidence', 'confidence', 'confidence-value'], ['yes-probability', 'yesProbability', 'yes-value'], ['urgent-at', 'urgentAt', 'urgent-value']]) {
  $(id).addEventListener('input', () => {
    policy[key] = Number($(id).value);
    $(output).textContent = percent(policy[key]);
    $('yes-description').textContent = `Yes ≥ ${percent(policy.yesProbability)} · no ≤ ${percent(1 - policy.yesProbability)} · otherwise uncertain.`;
    // No fetch: only compose the already-returned answers.
    render();
  });
}
document.querySelector('.inspect-tabs').addEventListener('click', event => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  inspectorView = button.dataset.view;
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b === button));
  renderInspector();
});
$('copy-json').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(inspectData(), null, 2));
    $('copy-json').textContent = 'Copied';
  } catch { $('copy-json').textContent = 'Select JSON to copy'; }
  setTimeout(() => { $('copy-json').textContent = 'Copy JSON'; }, 1800);
});

function renderSuite(running = false) {
  const complete = suiteRows.filter(row => row.data);
  const matches = complete.filter(row => row.data.answers.team.choice === row.sample.expectedTeam).length;
  const errors = suiteRows.filter(row => row.error).length;
  const attempts = complete.reduce((sum, row) => sum + row.data.meta.attempts, 0);
  $('suite-summary').textContent = `${running ? 'Running · ' : ''}${suiteRows.length} / ${config.samples.length} cases · ${matches} team matches${errors ? ` · ${errors} errors` : ''}${complete.length ? ` · ${attempts} successful-case HTTP attempts` : ''}`;
  $('suite-results').innerHTML = suiteRows.map(row => {
    const match = row.data?.answers.team.choice === row.sample.expectedTeam;
    return `<div class="suite-row${match ? '' : ' mismatch'}"><span>${escape(row.sample.name)}<br><small>Expected: ${escape(TEAM_NAMES[row.sample.expectedTeam])}</small></span>${row.error ? `<span class="row-error">${escape(row.error)}</span>` : `<span>${escape(TEAM_NAMES[row.data.answers.team.choice])}<br><small>${percent(row.data.answers.team.confidence)} confidence · ${row.data.meta.elapsedMs} ms</small></span><span>${match ? 'MATCH ✓' : 'DIFFERS'}</span>`}</div>`;
  }).join('');
}
$('run-suite').addEventListener('click', async () => {
  if (busy) return;
  clearError(); suiteRows = []; setBusy(true, true); renderSuite(true);
  $('run-suite').firstChild.textContent = 'Running sample suite… ';
  try {
    for (const sample of config.samples) {
      try { suiteRows.push({ sample, data: await evaluate(sample) }); }
      catch (error) {
        suiteRows.push({ sample, error: errorMessage(error) });
        // Service failures are not model-quality results. Stop instead of repeating failed calls.
        break;
      }
      renderSuite(true);
    }
  } finally {
    renderSuite(); setBusy(false);
    $('run-suite').firstChild.textContent = 'Run sample suite ';
  }
});

render();
try {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('Could not load demo configuration.');
  config = await response.json();
  $('connection').innerHTML = `<i></i>${config.configured ? 'Key configured' : 'Key missing'}`;
  $('connection').className = `connection ${config.configured ? 'ready' : 'failed'}`;
  $('connection').title = config.configured ? `Server has a credential. Model: ${config.model}. An evaluation verifies API access.` : 'Set the credential in the parent .env and recreate the container.';
  loadSample(config.samples[0].id);
  setBusy(false);
  if (!config.configured) showError('No API key configured. Add TYPESAFE_API to the parent .env and recreate the container.');
} catch (error) {
  $('connection').innerHTML = '<i></i>Server unavailable';
  $('connection').className = 'connection failed';
  showError(errorMessage(error));
}
