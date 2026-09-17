import { Simulation, applyDecision, round } from './simulation.mjs';
import { World } from './world.mjs';
import { ACTION_ACCELERATIONS, buildMotionContext, CONTROL_INTERVAL_MS } from './motion.mjs';

const $ = id => document.getElementById(id);
const colors = { accelerate: '#4c9b79', ease: '#8cb882', slow: '#d4bd71', coast: '#aac4b1', brake: '#dfa95b', emergency: '#d57259' };
const names = { accelerate: 'Accelerating', ease: 'Easing forward', slow: 'Slowing gently', coast: 'Holding speed', brake: 'Braking', emergency: 'Hard braking' };
const attention = { clear: 'A clear road ahead.', slower_traffic: 'Watching slower traffic ahead.', pedestrian: 'Watching people at the crossing.', speed_limit: 'Responding to a speed-limit sign.', adjacent_traffic: 'Watching adjacent traffic and rear approach.' };
let sim = new Simulation(), world;
let status = 'ready', generation = 0, controller = null, inFlight = false;
let nextRequest = 0, lastDecisionTime = 0, last = null, questions = {}, tab = 'state';
let lastCaptureTime = 0;
let roundTripSamples = [];
let decisionCount = 0, latencies = [], trace = [], records = [], history = [];
let totalTokens = 0, fallbacks = 0, stale = false, finishes = 0, collisions = 0, runNumber = 1, restartAt = 0;
let configured = false, busyServerUntil = 0, discarded = 0, calls = 0, runCalls = 0;
const sessionId = crypto.randomUUID();

function setError(message = '') { $('error').hidden = !message; $('error').textContent = message; }
function updateStatus() {
  const running = status === 'running' || status === 'starting';
  $('start').innerHTML = status === 'starting' ? 'Waiting for Jev…' : running ? '<span>Ⅱ</span> Pause' : status === 'paused' || status === 'error' ? '<span>▶</span> Resume driving' : '<span>▶</span> Start driving';
  $('start').disabled = !configured || status === 'starting';
  for (const id of ['duration', 'density', 'seed', 'shuffle']) $(id).disabled = running;
  $('stage-guide').hidden = status !== 'ready';
  $('run-status').textContent = { ready: 'READY', starting: 'CONNECTING', running: 'LIVE', paused: 'PAUSED', error: 'PAUSED', ended: 'COMPLETE' }[status];
  $('live-tag').textContent = stale ? 'STALE' : status === 'running' ? 'LIVE' : status === 'starting' ? 'THINKING' : 'STANDBY';
  $('live-tag').classList.toggle('live', status === 'running' && !stale);
  $('control-source').textContent = stale ? 'Stale response · fallback brake' : status === 'running' ? 'Controlled by Jev' : status === 'paused' || status === 'error' ? 'Simulation paused · no API calls' : 'Awaiting Jev';
}
function cancel() {
  generation++; controller?.abort(); controller = null; inFlight = false;
}
function reset({ seed = Number($('seed').value), increment = false } = {}) {
  cancel(); setError();
  runNumber = history.length + 1;
  if (increment) { seed = seed % 999999 + 1; $('seed').value = seed; }
  seed = Math.max(1, Math.min(999999, Math.floor(seed) || 42)); $('seed').value = seed;
  sim.reset(seed, Number($('duration').value), $('density').value);
  world.build(sim); status = 'ready'; decisionCount = 0; latencies = []; trace = []; last = null; stale = false; runCalls = 0;
  lastDecisionTime = 0; nextRequest = 0; restartAt = 0; roundTripSamples = [];
  $('run-result').hidden = true; $('run-label').textContent = `WORLD ${String(seed).padStart(3, '0')}`;
  $('action-title').textContent = 'Ready to drive'; $('action-icon').textContent = '→';
  $('action-description').textContent = 'Five independent judgments. One sensor snapshot. Every 800 ms.';
  $('lane-confidence').textContent = '—'; $('speed-confidence').textContent = '—'; $('speed-lane').textContent = '';
  $('risk').textContent = '—'; $('decisions').textContent = '0'; $('latency').textContent = '—';
  bars('lane-bars', { left: 0, right: 0 }, null); bars('speed-bars', Object.fromEntries(Object.keys(ACTION_ACCELERATIONS).map(k => [k, 0])), null);
  drawTrace(); updateStatus(); renderTelemetry();
}
function pause() {
  cancel(); status = 'paused'; restartAt = 0; updateStatus();
}
async function start() {
  if (!configured || status === 'starting') return;
  if (status === 'running') return pause();
  if (sim.seed !== Number($('seed').value) || sim.duration !== Number($('duration').value) || sim.density !== $('density').value) reset();
  if (sim.result) reset();
  if (Date.now() < busyServerUntil) return setError('TypeSafe is cooling down after a rate limit. Please retry in a few seconds.');
  cancel(); setError(); status = 'starting'; updateStatus();
  await requestDecision(true);
}
async function requestDecision(initial = false) {
  if (inFlight) return;
  const current = generation, snapshot = sim.sensors(), capturedAt = sim.time, requestStarted = performance.now();
  snapshot.control_timing = { recent_round_trip_ms: roundTripSamples.length ? Math.round(roundTripSamples.reduce((sum, v) => sum + v, 0) / roundTripSamples.length) : null };
  const thisController = new AbortController(); controller = thisController; inFlight = true;
  calls++; runCalls++;
  nextRequest = performance.now() + CONTROL_INTERVAL_MS;
  try {
    const response = await fetch('/api/decide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot), signal: thisController.signal });
    const result = await response.json();
    if (current !== generation) return;
    if (!response.ok) { if (response.status === 429) busyServerUntil = Date.now() + 5000; throw new Error(result.error || 'Jev could not decide.'); }
    const roundTripMs = Math.round(performance.now() - requestStarted);
    roundTripSamples.push(roundTripMs); if (roundTripSamples.length > 5) roundTripSamples.shift();
    const age = sim.time - capturedAt;
    const applied = result.tick === snapshot.tick && applyDecision(sim, result, age);
    totalTokens += result.usage.input_tokens + result.usage.output_tokens;
    const entry = { run: runNumber, seed: sim.seed, time_s: round(sim.time, 2), sensor_age_s: round(age, 3), round_trip_ms: roundTripMs, applied, ...result };
    records.push(entry); if (records.length > 2000) records.shift();
    if (!applied) { discarded++; markStale(); return; }
    last = result; lastCaptureTime = capturedAt; decisionCount++; latencies.push(result.latency_ms); lastDecisionTime = sim.time;
    stale = false;
    const lane = result.answers.lane.choice, speed = result.answers[`${lane}_speed`].choice;
    trace.push({ time: round(sim.time, 1), lane, speed, confidence: result.answers[`${lane}_speed`].confidence });
    if (initial) status = 'running';
    renderDecision(); drawTrace(); updateStatus();
  } catch (error) {
    if (current !== generation || error.name === 'AbortError') return;
    status = 'error'; setError(error.message || 'Could not reach Jev. Resume to retry.'); updateStatus();
  } finally {
    if (current === generation) { inFlight = false; controller = null; nextRequest = Math.max(nextRequest, performance.now() + 80); }
  }
}
function markStale() {
  if (!stale) { stale = true; fallbacks++; updateStatus(); }
  sim.ego.control = 'emergency';
}
function bars(id, distribution, selected) {
  const labels = { left: 'Left lane', right: 'Right lane', accelerate: 'Accelerate', ease: 'Ease forward', slow: 'Gentle brake', coast: 'Coast', brake: 'Brake', emergency: 'Emergency' };
  const root = $(id); root.replaceChildren();
  const keys = id === 'lane-bars' ? ['left', 'right'] : Object.keys(ACTION_ACCELERATIONS);
  for (const key of keys) {
    const value = distribution[key];
    const row = document.createElement('div'); row.className = 'bar-row' + (selected === key ? ' selected' : '');
    const label = document.createElement('span'); label.textContent = labels[key];
    const track = document.createElement('div'); track.className = 'bar-track';
    const fill = document.createElement('div'); fill.className = 'bar-fill'; fill.style.width = `${value * 100}%`; track.append(fill);
    const val = document.createElement('span'); val.className = 'bar-value'; val.textContent = `${Math.round(value * 100)}%`;
    row.append(label, track, val); root.append(row);
  }
}
function renderDecision() {
  if (!last) return;
  const a = last.answers, lane = a.lane.choice, longitudinal = a[`${lane}_speed`];
  $('action-title').textContent = names[longitudinal.choice];
  $('action-icon').textContent = lane === 'left' ? '↖' : '↗';
  $('action-description').textContent = `Target: ${lane} lane. ${attention[a.attention.choice]}`;
  bars('lane-bars', a.lane.probabilities, lane); bars('speed-bars', longitudinal.probabilities, longitudinal.choice);
  $('lane-confidence').textContent = `${Math.round(a.lane.confidence * 100)}% confidence`;
  $('speed-confidence').textContent = `${Math.round(longitudinal.confidence * 100)}% confidence`;
  $('speed-lane').textContent = `· ${lane.toUpperCase()}`;
  $('risk').textContent = `${Math.round(a.collision_risk.noul * 100)}%`;
  $('risk').style.color = a.collision_risk.noul > .5 ? '#c1724e' : '#367957';
  $('decisions').textContent = decisionCount;
  $('latency').textContent = `${last.latency_ms} ms`;
  $('latency-label').textContent = `avg ${Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)} ms`;
  $('token-count').textContent = `${totalTokens.toLocaleString()} tokens`;
  if ($('inspector').open) renderInspector();
}
function drawTrace() {
  const root = $('timeline'); root.replaceChildren();
  if (!trace.length) { const empty = document.createElement('span'); empty.className = 'trace-empty'; empty.textContent = 'The next move starts with a judgment.'; root.append(empty); return; }
  for (const t of trace.slice(-36)) {
    const el = document.createElement('div'); el.className = 'trace-point'; el.style.background = colors[t.speed];
    el.title = `${t.time}s · ${t.lane} lane · ${t.speed} · ${Math.round(t.confidence * 100)}% confidence`;
    root.append(el);
  }
}
function renderRadar(s) {
  const canvas = $('radar'), ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const roadLeft = w * .3, roadWidth = w * .4, originY = 20 + 110 * (h - 40) / 175, scale = (h - 40) / 175;
  ctx.fillStyle = '#e1e8d9'; ctx.fillRect(roadLeft, 0, roadWidth, h);
  ctx.strokeStyle = '#c0ceba'; ctx.setLineDash([6, 7]); ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '15px monospace'; ctx.fillStyle = '#8fa086';
  for (const distance of [100, 50, 0, -50]) { const y = originY - distance * scale; ctx.fillText(`${distance}m`, w * .1, y + 4); ctx.strokeStyle = '#ccd7c3'; ctx.beginPath(); ctx.moveTo(roadLeft, y); ctx.lineTo(roadLeft + roadWidth, y); ctx.stroke(); }
  const egoX = s.ego.lateral_position_m, ex = w / 2 + egoX / 3.6 * roadWidth / 2;
  for (const [i, lane] of ['left', 'right'].entries()) {
    ctx.fillStyle = s.blind_spots[lane] ? '#eaa26588' : '#63baa433';
    ctx.fillRect(roadLeft + i * roadWidth / 2 + 3, originY - 7 * scale, roadWidth / 2 - 6, 14 * scale);
    if (s.blind_spots[lane]) { ctx.strokeStyle = '#d18447'; ctx.strokeRect(roadLeft + i * roadWidth / 2 + 3, originY - 7 * scale, roadWidth / 2 - 6, 14 * scale); }
  }
  ctx.fillStyle = '#289a7a'; ctx.fillRect(ex - 11, originY - 14, 22, 28);
  ctx.strokeStyle = '#5db49566'; ctx.beginPath(); ctx.moveTo(ex, originY - 14); ctx.lineTo(roadLeft + 12, 15); ctx.moveTo(ex, originY - 14); ctx.lineTo(roadLeft + roadWidth - 12, 15); ctx.stroke();
  const observations = new Map();
  for (const [direction, feed] of Object.entries(s.cameras)) for (const o of feed.detections) if (!observations.has(o.id)) observations.set(o.id, { ...o, direction });
  const cameraColors = { front: '#398e74', left: '#5586bc', right: '#bd853d', rear: '#ad6c94' };
  for (const o of observations.values()) {
    const x = w / 2 + (egoX + o.offset_right_m) / 3.6 * roadWidth / 2, y = originY - o.offset_forward_m * scale;
    ctx.fillStyle = o.kind === 'pedestrian' ? '#cc754b' : cameraColors[o.direction];
    ctx.fillRect(x - (o.kind === 'barrier' ? 17 : 9), y - 9, o.kind === 'barrier' ? 34 : 18, o.kind === 'barrier' ? 10 : 22);
    if (o.longitudinal_overlap) { ctx.strokeStyle = '#db7648'; ctx.lineWidth = 3; ctx.strokeRect(x - 15, y - 15, 30, 32); ctx.lineWidth = 1; }
    ctx.fillText(o.id.replace('car-', 'C').replace('pedestrian-', 'P').replace('barrier-', 'B'), x + 20, y + 6);
  }
  if (last && $('sensor-source').value === 'decision') {
    const target = last.answers.lane.choice === 'left' ? w / 2 - roadWidth / 4 : w / 2 + roadWidth / 4;
    ctx.strokeStyle = '#296956'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(ex, originY); ctx.lineTo(target, originY - 50); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    ctx.fillStyle = '#296956'; ctx.fillText('JEV', target + 13, originY - 48);
  }
}
function renderRoadAwareness(s) {
  const rules = s.road_rules, speed = sim.ego.speed * 3.6, over = speed - rules.active_limit_kmh;
  $('active-limit').textContent = rules.active_limit_kmh;
  $('speed-verdict').textContent = over > 1 ? `${Math.round(over)} km/h over limit` : 'Within limit';
  $('speed-verdict').classList.toggle('speeding', over > 1);
  $('limit-source').textContent = `${rules.active_sign_id ? `Remembered ${rules.active_sign_id}` : 'Initial road rule'} · ${sim.speedingSeconds.toFixed(1)} s over limit`;
  const next = rules.upcoming_signs[0];
  $('next-limit').textContent = next ? `Next ${next.limit_kmh} · ${Math.max(0, Math.round(next.distance_m))} m ahead` : 'No further sign observed';
  $('sign-trail').replaceChildren(...rules.sign_history.slice(-6).map(sign => {
    const chip = document.createElement('div'); chip.className = 'remembered-sign' + (sign.id === rules.active_sign_id ? ' current' : sign.passed_at_s !== null ? ' passed' : ' upcoming');
    const circle = document.createElement('b'); circle.textContent = sign.limit_kmh;
    const label = document.createElement('span'); label.textContent = sign.id === rules.active_sign_id ? 'ACTIVE' : sign.passed_at_s !== null ? 'PASSED' : 'SEEN AHEAD';
    chip.append(circle, label); chip.title = `${sign.id} first observed at ${sign.first_seen_at_s}s${sign.passed_at_s !== null ? `; passed at ${sign.passed_at_s}s` : ''}`; return chip;
  }));
  if (!rules.sign_history.length) $('sign-trail').textContent = 'Signs appear here only after observation.';
  const crossing = s.road_observations.visible_crosswalks.find(c => c.distance_m >= -3);
  const people = new Map();
  for (const feed of Object.values(s.cameras)) for (const d of feed.detections) if (d.kind === 'pedestrian') people.set(d.id, d);
  const relevant = [...people.values()].filter(p => !crossing || p.crossing_id === crossing.id);
  const walking = relevant.filter(p => p.motion === 'crossing').length, waiting = relevant.filter(p => p.motion === 'waiting').length;
  $('crosswalk-status').textContent = crossing ? `Crosswalk · ${Math.max(0, Math.round(crossing.distance_m))} m ahead` : 'No crossing in view';
  $('pedestrian-status').textContent = walking ? `${walking} walking · ${waiting} waiting · yield` : waiting ? `${waiting} waiting by the road` : 'No pedestrians currently detected';
  $('crosswalk-status').classList.toggle('pedestrians-present', walking > 0);
}

function renderTelemetry() {
  const s = sim.sensors(), remaining = Math.max(0, Math.ceil(sim.duration - sim.time));
  world.updateSensors(s);
  renderRoadAwareness(s);
  for (const [direction, feed] of Object.entries(s.cameras)) $(direction + '-count').textContent = feed.detections.length;
  const viewed = $('sensor-source').value === 'decision' && last ? last.state : s;
  $('speed').textContent = Math.round(sim.ego.speed * 3.6);
  $('clock').textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  $('distance').textContent = `${Math.floor(sim.ego.z)} / ${sim.length} m`;
  $('passed').textContent = sim.passed.size; $('changes').textContent = `${sim.laneChanges} lane changes · ${sim.crossingsPassed.size} crossings`;
  for (const lane of ['left', 'right']) {
    const r = viewed.radar[lane];
    $(lane + '-gap').textContent = `${r.front_gap_m >= 139 ? '>' : ''}${Math.round(r.front_gap_m)} / ${r.rear_gap_m >= 39 ? '>' : ''}${Math.round(r.rear_gap_m)} m`;
    $('blind-' + lane).textContent = viewed.blind_spots[lane] ? 'OCCUPIED' : 'No close return';
    $('zone-' + lane).classList.toggle('occupied', viewed.blind_spots[lane]);
  }
  const seen = new Map();
  for (const [direction, feed] of Object.entries(viewed.cameras)) for (const o of feed.detections) {
    if (!seen.has(o.id)) seen.set(o.id, { ...o, cameras: [] }); seen.get(o.id).cameras.push(direction);
  }
  const nearest = [...seen.values()].sort((a, b) => Math.abs(a.offset_forward_m) - Math.abs(b.offset_forward_m)).slice(0, 2);
  $('detected-objects').replaceChildren(...nearest.map(o => {
    const line = document.createElement('div'); line.textContent = o.kind === 'pedestrian' ? `${o.id} · ${o.motion} · ${o.lateral_speed_mps > 0 ? 'walking right' : o.lateral_speed_mps < 0 ? 'walking left' : 'standing'} · ${Math.abs(o.offset_forward_m).toFixed(1)} m ${o.relation}` : `${o.id} · ${o.lane} lane · ${o.longitudinal_overlap ? 'BODY OVERLAP' : `${Math.abs(o.offset_forward_m).toFixed(1)} m ${o.relation}`} · ${o.relative_forward_speed_mps > 0 ? '+' : ''}${o.relative_forward_speed_mps.toFixed(1)} m/s`; line.title = `Seen by ${o.cameras.join(', ')} cameras. Relative speed = object minus ego.`; return line;
  }));
  if (!nearest.length) $('detected-objects').textContent = 'No visible camera detections in range.';
  $('snapshot-age').textContent = last ? `Jev snapshot ${Math.round((sim.time - lastCaptureTime) * 1000)} ms ago` : 'Live sensors · no decision yet';
  $('flow-sense').classList.toggle('active', inFlight); $('flow-jev').classList.toggle('active', inFlight); $('flow-act').classList.toggle('active', status === 'running' && !stale);
  $('outcomes').textContent = `${finishes} / ${collisions}`;
  $('outcome-label').textContent = `finishes / collisions · ${history.filter(r => r.reason === 'time').length} time limits`;
  $('fallback-count').textContent = `${fallbacks} stale fallbacks`;
  renderRadar(viewed);
  const measured = { ...viewed, control_timing: viewed.control_timing || { recent_round_trip_ms: roundTripSamples.length ? Math.round(roundTripSamples.reduce((sum, v) => sum + v, 0) / roundTripSamples.length) : null } };
  renderApproach(viewed.motion || buildMotionContext(measured), viewed);
}
function renderApproach(motion, state) {
  const crossing = motion.crossings.find(c => c.front_bumper_to_stop_line_m >= -2);
  const lane = state.ego.target_lane, front = state.radar[lane];
  $('approach-label').textContent = crossing ? 'TO STOP LINE' : 'FRONT GAP';
  $('approach-gap').textContent = crossing ? `${Math.max(0, crossing.front_bumper_to_stop_line_m).toFixed(1)} m` : front.front_gap_m >= 140 ? '>140 m' : `${front.front_gap_m.toFixed(1)} m`;
  $('approach-stop').textContent = `${motion.stop_distance_m.gentle.toFixed(1)} m`;
  $('approach-delay').textContent = `${motion.response_estimate_ms} ms`;
  $('approach-note').textContent = `${$('sensor-source').value === 'decision' && last ? "Jev's snapshot" : 'Live measurements'} · ${motion.timing_source.startsWith('startup') ? 'initial delay estimate' : 'measured round trip'} · estimates, not an override`;
}
function endRun() {
  if (status === 'ended') return;
  cancel(); status = 'ended';
  const result = sim.result;
  if (result.reason === 'finish') finishes++;
  if (result.reason === 'collision') collisions++;
  history.push({ run: runNumber, seed: sim.seed, duration: sim.duration, density: sim.density, ...result, decisions: decisionCount, requests: runCalls, lane_changes: sim.laneChanges, passed: sim.passed.size, crossings_passed: sim.crossingsPassed.size, speeding_seconds: round(sim.speedingSeconds, 2), max_overspeed_kmh: round(sim.maxOverspeedKmh), signs_remembered: sim.signMemory.seen.size, min_gap_m: Number.isFinite(sim.minGap) ? round(sim.minGap) : null });
  $('run-result').hidden = false;
  $('result-kicker').textContent = `RUN ${String(runNumber).padStart(2, '0')} · ${result.reason === 'collision' ? 'COLLISION DETECTED' : 'COMPLETE'}`;
  $('result-title').textContent = result.reason === 'finish' ? 'Across the finish line.' : result.reason === 'collision' ? 'A decision to learn from.' : 'Time is up.';
  $('result-text').textContent = `${Math.round(result.distance)} m travelled · ${decisionCount} decisions. ${result.reason === 'collision' ? `Contact with a ${result.object}. ` : ''}${$('loop').checked ? 'A new world starts in 3 seconds.' : 'Start again or inspect the run.'}`;
  restartAt = $('loop').checked ? performance.now() + 3000 : 0;
  updateStatus(); renderTelemetry();
}
function renderInspector() {
  const value = tab === 'state' ? last?.state || sim.sensors() : tab === 'answers' ? last ? { model: last.model, answers: last.answers, latency_ms: last.latency_ms, usage: last.usage } : { note: 'Start a run to see a real Jev response.' } : tab === 'runs' ? { completed_runs: history, current: { seed: sim.seed, time_s: round(sim.time, 2), distance_m: round(sim.ego.z), status }, requests: calls, tokens: totalTokens, stale_fallbacks: fallbacks, discarded_responses: discarded } : questions;
  $('inspector-content').textContent = JSON.stringify(value, null, 2);
}

$('start').addEventListener('click', start);
$('reset').addEventListener('click', () => reset());
$('shuffle').addEventListener('click', () => { $('seed').value = Math.floor(Math.random() * 999998) + 1; reset(); });
for (const id of ['duration', 'density', 'seed']) $(id).addEventListener('change', () => reset());
$('loop').addEventListener('change', () => { if (!$('loop').checked) restartAt = 0; });
$('sensors').addEventListener('change', () => { world.showSensors = $('sensors').checked; });
for (const button of document.querySelectorAll('[data-view]')) button.addEventListener('click', () => {
  world.mode = button.dataset.view; document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b === button));
});
$('inspect').addEventListener('click', () => { renderInspector(); $('inspector').showModal(); });
$('close-inspector').addEventListener('click', () => $('inspector').close());
for (const button of document.querySelectorAll('[data-tab]')) button.addEventListener('click', () => {
  tab = button.dataset.tab; document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === button)); renderInspector();
});
$('export').addEventListener('click', () => {
  const data = { session_id: sessionId, exported_at: new Date().toISOString(), perception: 'Idealized structured simulation sensors, not camera pixels', questions, totals: { requests: calls, tokens: totalTokens, stale_fallbacks: fallbacks, discarded, finishes, collisions }, runs: history, current_run: { seed: sim.seed, time_s: sim.time, status, decisions: decisionCount, distance_m: sim.ego.z }, decisions: records };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `jev-driving-${sessionId.slice(0, 8)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && ['running', 'starting'].includes(status)) pause(); });
document.addEventListener('keydown', e => { if (e.code === 'Space' && !['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(document.activeElement.tagName) && !$('inspector').open) { e.preventDefault(); start(); } });

window.__drivingLab = Object.freeze({ snapshot: () => ({ status, seed: sim.seed, time: sim.time, distance: sim.ego.z, speed: sim.ego.speed, lane: sim.ego.lane, target: sim.ego.target, control: sim.ego.control, decisions: decisionCount, calls, totalTokens, discarded, fallbacks, result: sim.result, runs: structuredClone(history), last: last ? structuredClone(last) : null }), sensors: () => sim.sensors() });

try {
  world = new World($('stage')); reset();
  let previous = performance.now(), lastUI = 0;
  function frame(now) {
    const dt = Math.min(.1, Math.max(0, (now - previous) / 1000)); previous = now;
    if (status === 'running') {
      if (sim.time - lastDecisionTime > 1.8) markStale();
      sim.step(dt);
      if (sim.result) endRun();
      else if (now >= nextRequest && !inFlight) requestDecision();
    }
    if (status === 'ended' && restartAt && now >= restartAt && !document.hidden) { reset({ increment: true }); start(); }
    world.render(sim, dt);
    if (now - lastUI > 100) { renderTelemetry(); lastUI = now; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const config = await fetch('/api/config').then(r => { if (!r.ok) throw new Error('Could not load configuration.'); return r.json(); });
  configured = config.configured; questions = config.questions;
  $('model').textContent = config.model; $('connection').textContent = configured ? 'API key configured' : 'API key missing';
  $('connection-dot').classList.toggle('connected', configured);
  if (!configured) setError('Add the API key to ../.env and recreate the container.');
  updateStatus();
} catch (error) { setError('Unable to start the 3D demo: ' + error.message); }
