// Runs the world in the browser and asks Jev for a manoeuvre as often as the API answers.
// Nothing here chooses how to drive: it only relays Jev's answer into the executor and shows what happened.
import { Simulation } from '/sim/simulation.mjs';
import { DRIVE_LENGTHS } from '/sim/world.mjs';
import { decisionFromAnswers } from '/sim/policy.mjs';
import { Scene } from '/public/scene.mjs';
import { hud } from '/public/hud.mjs';

const $ = id => document.getElementById(id);
const MIN_INTERVAL_S = 0.4, RESTART_DELAY_S = 3.5, PRICE_PER_TOKEN = 42e-9;
const state = { running: false, inFlight: false, lastSnapshotTime: -1, latencyEma: 350, latencies: [], decisions: 0, tokens: 0, log: [], lastRequest: null, lastAnswer: null, endedAt: null, autoRestart: true, config: null, error: null, resumeAt: 0 };
// Remembered controls (per browser) so a reload keeps your setup.
const prefs = (() => { try { return JSON.parse(localStorage.getItem('jev-drives-demo04-prefs') || '{}'); } catch { return {}; } })();
const savePrefs = () => { try { localStorage.setItem('jev-drives-demo04-prefs', JSON.stringify({ seed: Number($('seedInput').value) || 7, traffic: $('trafficSel').value, length: Number($('lengthSel').value), view: $('cameraSel').value, light: $('lightSel').value, overlays: $('overlayChk').checked, auto: $('autoChk').checked })); } catch {} };
$('lengthSel').innerHTML = DRIVE_LENGTHS.map(d => `<option value="${d.length}">${d.label}</option>`).join('');
if (prefs.seed) $('seedInput').value = prefs.seed;
if (prefs.traffic) $('trafficSel').value = prefs.traffic;
$('lengthSel').value = String(DRIVE_LENGTHS.some(d => d.length === prefs.length) ? prefs.length : 840);
if (prefs.view) $('cameraSel').value = prefs.view;
if (['afternoon','morning','golden'].includes(prefs.light)) $('lightSel').value = prefs.light;
if (typeof prefs.overlays === 'boolean') $('overlayChk').checked = prefs.overlays;
if (typeof prefs.auto === 'boolean') { $('autoChk').checked = prefs.auto; state.autoRestart = prefs.auto; }
const drive = () => DRIVE_LENGTHS.find(d => d.length === Number($('lengthSel').value)) || DRIVE_LENGTHS[0];
const sim = new Simulation({ seed: Number($('seedInput').value) || 7, traffic: $('trafficSel').value, length: drive().length, targetSeconds: drive().seconds });
const scene = new Scene($('scene'));
scene.view = $('cameraSel').value; scene.overlays = $('overlayChk').checked; scene.setLighting($('lightSel').value);
hud.init();
scene.buildWorld(sim.world);
// Layout is CSS-driven; camera rectangles are measured before every render.
function fitLayout() { scene.resize(); }

function setRunning(on) {
  state.running = on && !sim.result;
  hud.startButton(state.running, Boolean(sim.result));
  if (state.running) hud.banner(null);
}
function newRun(seed, traffic) {
  sim.reset({ seed, traffic, length: drive().length, targetSeconds: drive().seconds });
  savePrefs();
  sim.timing = { latency_ms: state.latencyEma, interval_ms: MIN_INTERVAL_S * 1000 };
  scene.buildWorld(sim.world);
  hud.timelineReset(); hud.endCard(sim, null);
  state.lastSnapshotTime = -1; state.endedAt = null; state.error = null;
  $('seedInput').value = seed; $('trafficSel').value = traffic;
  $('jevDot').className = 'dot';
  hud.resetDecision();
}
const randomSeed = () => Math.floor(1 + Math.random() * 99998);

async function decide() {
  if (!state.running || state.inFlight || sim.result || performance.now() < state.resumeAt) return;
  if (state.lastSnapshotTime >= 0 && sim.time - state.lastSnapshotTime < MIN_INTERVAL_S) return;
  state.inFlight = true;
  sim.timing = { latency_ms: state.latencyEma, interval_ms: MIN_INTERVAL_S * 1000 };
  const snap = sim.snapshot(); const snapTime = sim.time;
  state.lastSnapshotTime = snapTime; state.lastRequest = snap.situation;
  const t0 = performance.now();
  try {
    const res = await fetch('/api/decide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ situation: snap.situation }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status });
    const latency = performance.now() - t0;
    state.latencyEma = state.latencyEma * 0.7 + latency * 0.3; state.latencies.push(latency);
    state.tokens += data.usage.input_tokens + data.usage.output_tokens;
    const decision = decisionFromAnswers(data.answers);
    const applied = sim.applyDecision(decision, sim.time - snapTime);
    state.decisions++;
    state.lastAnswer = data;
    state.log.push({ time: snapTime, applied_at: sim.time, situation: snap.situation, answers: data.answers, usage: data.usage, latency_ms: Math.round(latency), model: data.model, applied });
    if (state.log.length > 600) state.log.shift();
    if (applied.applied) hud.timelinePush(sim.time, decision.maneuver);
    hud.jev(data, decision, latency, applied);
    const recent = state.log.slice(-10);
    const cadence = recent.length > 1 ? (recent.length - 1) / (recent[recent.length - 1].time - recent[0].time) : 0;
    hud.stats({ decisions: state.decisions, cadence, tokens: state.tokens, cost: state.tokens * PRICE_PER_TOKEN, model: data.model });
  } catch (e) {
    state.error = e.message;
    $('jevDot').className = 'dot error';
    if (e.status === 429 || e.status === 409 || e.status === 504) { hud.banner(`${e.message} Retrying in 4 s.`, 'warn'); state.resumeAt = performance.now() + 4000; }
    else { setRunning(false); hud.banner(`${e.message} The run is paused; press Start to retry.`, 'error'); }
  } finally { state.inFlight = false; }
}

let last = performance.now(), hudClock = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (state.running && !sim.result) sim.step(dt);
  if (sim.result && state.endedAt === null) { state.endedAt = now; setRunning(false); hud.endCard(sim, state.autoRestart ? RESTART_DELAY_S : null); }
  if (sim.result && state.autoRestart) {
    const left = RESTART_DELAY_S - (now - state.endedAt) / 1000;
    hud.endCard(sim, Math.max(0, left));
    if (left <= 0) { newRun(randomSeed(), $('trafficSel').value); setRunning(true); }
  }
  decide();
  scene.update(sim, dt);
  hudClock += dt;
  if (hudClock > 0.1) {
    hudClock = 0;
    const sensed = sim.refreshPerception();
    hud.speed(sim.ego.speed * 3.6, sim.ego.pace, postedLimit());
    hud.signs(sim.signs.snapshot(sim.ego.z));
    hud.progress(sim); hud.feeds(sensed); hud.timelineRender(sim.time); hud.executor(sim);
  }
  scene.render(feedRects());
  requestAnimationFrame(frame);
}
function postedLimit() { let limit = 50; for (const s of sim.world.signs) { if (s.z > sim.ego.z) break; limit = s.limit; } return limit; }
const feedEls = Object.fromEntries([...document.querySelectorAll('.feed')].map(el => [el.dataset.cam, el.querySelector('.feed-view')]));
function feedRects() { const out = {}; for (const [name, el] of Object.entries(feedEls)) out[name] = el.getBoundingClientRect(); return out; }

// Controls.
$('startBtn').addEventListener('click', () => { if (sim.result) { newRun(randomSeed(), $('trafficSel').value); setRunning(true); return; } state.resumeAt = 0; setRunning(!state.running); });
$('restartBtn').addEventListener('click', () => { newRun(Number($('seedInput').value) || 7, $('trafficSel').value); setRunning(true); });
$('shuffleBtn').addEventListener('click', () => { newRun(randomSeed(), $('trafficSel').value); setRunning(true); });
$('trafficSel').addEventListener('change', () => { newRun(Number($('seedInput').value) || 7, $('trafficSel').value); setRunning(false); });
$('lengthSel').addEventListener('change', () => { newRun(Number($('seedInput').value) || 7, $('trafficSel').value); setRunning(false); });
$('seedInput').addEventListener('change', () => { newRun(Number($('seedInput').value) || 7, $('trafficSel').value); setRunning(false); });
$('cameraSel').addEventListener('change', e => { scene.view = e.target.value; scene.first = true; savePrefs(); });
$('lightSel').addEventListener('change', e => { scene.setLighting(e.target.value); savePrefs(); });
$('overlayChk').addEventListener('change', e => { scene.overlays = e.target.checked; savePrefs(); });
$('autoChk').addEventListener('change', e => { state.autoRestart = e.target.checked; savePrefs(); });
$('inspectBtn').addEventListener('click', () => toggleInspector(true));
$('closeInspect').addEventListener('click', () => toggleInspector(false));
for (const b of document.querySelectorAll('.drawer nav button')) b.addEventListener('click', () => { document.querySelectorAll('.drawer nav button').forEach(x => x.classList.toggle('on', x === b)); renderInspector(); });
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), model: state.config?.model, run: sim.summary(), decisions: state.log, latency_ms_average: Math.round(state.latencies.reduce((a, b) => a + b, 0) / Math.max(1, state.latencies.length)), tokens: state.tokens }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `jev-drives-demo04-seed${sim.seed}-${Date.now()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
let inspectorReturnFocus = null;
function toggleInspector(open) {
  if (open) inspectorReturnFocus = document.activeElement;
  $('inspector').hidden = !open;
  $('inspectorBackdrop').hidden = !open;
  document.querySelector('.ui').inert = open;
  if (open) { renderInspector(); $('closeInspect').focus(); }
  else inspectorReturnFocus?.focus();
}
$('inspectorBackdrop').addEventListener('click', () => toggleInspector(false));
$('focusBtn').addEventListener('click', () => {
  const focused = document.body.classList.toggle('focus-mode');
  $('focusBtn').setAttribute('aria-pressed', String(focused));
  $('focusBtn').setAttribute('aria-label', focused ? 'Exit focus view' : 'Enter focus view');
  fitLayout();
});
// Keep dialog navigation local, including Escape and keyboard focus.
window.addEventListener('keydown', e => {
  if ($('inspector').hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); toggleInspector(false); }
  if (e.key === 'Tab') {
    const nodes = [...$('inspector').querySelectorAll('button, [tabindex="0"]')];
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  e.stopImmediatePropagation();
}, true);
function renderInspector() {
  const tab = document.querySelector('.drawer nav button.on')?.dataset.tab || 'situation';
  const body = $('inspectorBody');
  if (tab === 'situation') body.textContent = state.lastRequest ? JSON.stringify({ rules: state.config?.rules, ...state.lastRequest }, null, 2) : 'No request sent yet. Start driving.';
  else if (tab === 'answers') body.textContent = state.lastAnswer ? JSON.stringify(state.lastAnswer, null, 2) : 'No answer yet.';
  else if (tab === 'questions') body.textContent = state.config ? JSON.stringify(state.config.questions, null, 2) : 'Loading…';
  else body.textContent = JSON.stringify({ run: sim.summary(), requests: state.log.length, tokens: state.tokens, estimated_cost_usd: Number((state.tokens * PRICE_PER_TOKEN).toFixed(4)), average_latency_ms: Math.round(state.latencies.reduce((a, b) => a + b, 0) / Math.max(1, state.latencies.length)), last_error: state.error }, null, 2);
}
window.addEventListener('keydown', e => {
  if (['INPUT', 'SELECT'].includes(e.target.tagName)) return;
  if (e.code === 'Space' && ['BUTTON', 'SUMMARY'].includes(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); $('startBtn').click(); }
  else if (e.key === 'r') $('restartBtn').click(); else if (e.key === 'n') $('shuffleBtn').click();
  else if (e.key === 'f') $('focusBtn').click();
  else if (e.key === 'i') toggleInspector($('inspector').hidden); else if (e.key === 'o') { $('overlayChk').checked = !$('overlayChk').checked; scene.overlays = $('overlayChk').checked; savePrefs(); }
  else if (e.key === 'v') { const s = $('cameraSel'); s.selectedIndex = (s.selectedIndex + 1) % s.options.length; scene.view = s.value; scene.first = true; savePrefs(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && state.running) { setRunning(false); hud.banner('Paused while the tab was hidden. Press Start to continue.', 'info'); } });
window.addEventListener('resize', () => { scene.resize(); fitLayout(); });

fetch('/api/config').then(r => r.json()).then(cfg => {
  state.config = cfg; $('modelName').textContent = cfg.model;
  if (!cfg.configured) { hud.banner('No TYPESAFE_API key in the parent .env. The world runs, but Jev cannot be asked.', 'error'); $('startBtn').disabled = true; }
}).catch(() => hud.banner('Could not load the demo configuration.', 'error'));
hud.speed(sim.ego.speed * 3.6, sim.ego.pace, 50); hud.signs(sim.signs.snapshot(0)); hud.progress(sim); hud.feeds(sim.refreshPerception()); hud.startButton(false, false);
hud.stats({ decisions: 0, cadence: 0, tokens: 0, cost: 0 });
requestAnimationFrame(frame);
