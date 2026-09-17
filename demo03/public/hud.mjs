// DOM side of the presentation: speed dial, sign memory, progress, Jev's answers, timeline, banners.
import { MANEUVER_LABELS } from '/sim/policy.mjs';
import { MANEUVERS } from '/sim/dynamics.mjs';

const $ = id => document.getElementById(id);
const fmt = (v, d = 0) => v === null || v === undefined ? '—' : Number(v).toFixed(d);
export const ATTENTION_LABELS = { lead_car: 'car ahead', car_being_passed: 'car being passed', oncoming_traffic: 'oncoming traffic', pedestrian_or_crossing: 'pedestrian / crossing', speed_sign: 'speed sign', rear_or_blind_spot: 'behind / blind spot', nothing: 'clear road' };
const HAZARD_LABELS = ['clear', 'watch', 'hazard', 'critical'];

export const hud = {
  init() {
    const ul = $('maneuverProbs');
    ul.innerHTML = MANEUVERS.map(m => `<li data-m="${m}"><span class="name">${MANEUVER_LABELS[m]}</span><span class="bar"><i></i></span><span class="pct">—</span></li>`).join('');
    this.timeline = [];
  },
  executor(sim) {
    const e = sim.ego, ctx = sim.controllerContext();
    const status = e.path ? (e.laneTarget === 'left' ? 'steering into left lane' : 'steering back to right lane') : (e.x < 0 ? 'centred in left lane' : 'centred in right lane');
    let doing;
    if (e.maneuver === 'stop') doing = ctx.stopLineDistance !== null ? `braking to rest ${Math.max(0, ctx.stopLineDistance).toFixed(0)} m before the stop line` : 'braking to a standstill';
    else if (e.maneuver === 'emergency_brake') doing = 'hard braking';
    else if (e.maneuver === 'follow' || e.maneuver === 'return_right') doing = ctx.lead ? `matching car ahead (${Math.round(ctx.lead.speed * 3.6)} km/h, gap ${ctx.lead.gap.toFixed(0)} m)` : `no car ahead · cruising to ${e.pace} km/h`;
    else if (e.maneuver === 'creep') doing = 'rolling at 8 km/h';
    else if (e.maneuver === 'abort_overtake') doing = ctx.passTarget ? `slowing to ${Math.max(0, Math.round(ctx.passTarget.speed * 3.6 - 8))} km/h to drop behind` : 'slowing to half the limit';
    else doing = `cruising to ${e.pace} km/h`;
    $('execLine').textContent = `car: ${status} · ${doing}`;
  },
  speed(kmh, pace, posted) {
    $('speedNum').textContent = Math.round(kmh);
    const ring = $('limitRing'); ring.textContent = pace; ring.classList.toggle('over', kmh > posted + 2);
    $('postedNote').textContent = posted === pace ? `posted ${posted}` : `posted ${posted} · Jev uses ${pace}`;
    $('postedNote').classList.toggle('warn', posted !== pace);
  },
  signs(snap) {
    const parts = [];
    for (const s of snap.recently_passed) parts.push(`<span class="sign passed ${s.id === (snap.active_because.split(' ')[0]) ? 'active' : ''}"><b>${s.limit_kmh}</b><small>${s.metres_ago} m ago</small></span>`);
    if (!snap.recently_passed.length) parts.push(`<span class="sign active"><b>50</b><small>default</small></span>`);
    for (const s of snap.seen_ahead) parts.push(`<span class="sign ahead ${s.limit_kmh === 30 ? 'slow' : ''}"><b>${s.limit_kmh}</b><small>in ${s.distance_m} m</small></span>`);
    if (!snap.seen_ahead.length) parts.push(`<span class="sign none"><small>no sign in view</small></span>`);
    $('signStrip').innerHTML = parts.join('');
  },
  progress(sim) {
    const L = sim.world.length, z = sim.ego.z, track = $('track');
    const key = `${sim.seed}-${sim.traffic}-${L}`;
    if (track.dataset.key !== key) {
      track.dataset.key = key;
      track.innerHTML = sim.world.crossings.map(c => `<i class="mark cross" style="left:${c.z / L * 100}%" title="${c.id}"></i>`).join('') + sim.world.signs.map(s => `<i class="mark sign ${s.limit === 30 ? 'slow' : ''}" style="left:${s.z / L * 100}%">${s.limit}</i>`).join('') + '<i class="ego"></i>';
    }
    track.querySelector('.ego').style.left = `${Math.min(100, z / L * 100)}%`;
    $('clock').textContent = `${sim.time.toFixed(1)} s`;
    $('dist').textContent = `${Math.round(z)} / ${L} m`;
    $('runInfo').textContent = `seed ${sim.seed} · ${sim.traffic} traffic · ~${sim.targetSeconds >= 120 ? Math.round(sim.targetSeconds / 60) + ' min' : sim.targetSeconds + ' s'} drive (cap ${Math.round(sim.timeLimit / 60)} min)`;
    const s = sim.summary();
    $('metrics').innerHTML = [
      ['overtakes', s.overtakes_completed], ['left lane', `${fmt(s.seconds_in_left_lane, 1)} s`], ['stops at crossings', s.stops_at_crossings], ['crossings', `${s.crossings_passed}/${sim.world.crossings.length}`],
      ['min gap', s.min_gap_ahead_m === null ? '—' : `${fmt(s.min_gap_ahead_m, 1)} m`], ['over limit', `${fmt(s.speeding_seconds, 1)} s`]
    ].map(([k, v]) => `<span><b>${v}</b>${k}</span>`).join('');
  },
  feeds(sensed) {
    for (const [name, cam] of Object.entries(sensed.cameras)) {
      const el = document.querySelector(`.feed[data-cam="${name}"] em`);
      if (el) { el.textContent = cam.detections.length; el.classList.toggle('some', cam.detections.length > 0); }
    }
    const fr = sensed.radar.front, rr = sensed.radar.rear;
    const desc = r => r ? `${r.id.replace('car-', 'car ').replace('person-', 'person ')} ${r.gap_m} m ${r.closing_speed_kmh > 0 ? '▼' : '▲'}${Math.abs(r.closing_speed_kmh)} km/h` : 'clear';
    $('radarText').innerHTML = `<span>ahead right: ${desc(fr.right)}</span><span>ahead left: ${desc(fr.left)}</span><span>behind: ${desc(rr.right)}</span>`;
    for (const side of ['left', 'right']) { const b = sensed.blind_spots[side]; const el = $(side === 'left' ? 'bsLeft' : 'bsRight'); el.classList.toggle('hit', b.occupied); el.classList.toggle('off', b.covers_lane === 'off road'); el.title = b.occupied ? `${b.object} in the ${side} blind spot` : `${side} blind spot clear`; }
  },
  jev(answer, decision, latencyMs, applied) {
    const a = answer.answers;
    $('maneuverBig').textContent = MANEUVER_LABELS[decision.maneuver];
    $('maneuverBig').dataset.m = decision.maneuver;
    $('maneuverConf').textContent = `${Math.round(a.maneuver.confidence * 100)}% confidence${applied.applied ? '' : ` · not applied (${applied.reason})`}`;
    for (const li of document.querySelectorAll('#maneuverProbs li')) {
      const p = a.maneuver.probabilities[li.dataset.m] || 0;
      li.querySelector('i').style.width = `${Math.round(p * 100)}%`; li.querySelector('.pct').textContent = `${Math.round(p * 100)}%`;
      li.classList.toggle('chosen', li.dataset.m === decision.maneuver);
    }
    for (const el of document.querySelectorAll('.pace-vals span')) el.classList.toggle('on', Number(el.dataset.pace) === decision.pace);
    $('paceConf').textContent = `${Math.round(a.pace.probabilities[String(decision.pace)] * 100)}%`;
    const level = Math.round(a.hazard.score);
    $('hazardMeter').dataset.level = level; $('hazardText').textContent = `${HAZARD_LABELS[level]} (${a.hazard.score.toFixed(1)})`;
    $('attentionChip').textContent = ATTENTION_LABELS[a.attention.choice] || a.attention.choice;
    $('passBar').style.width = `${Math.round(a.pass_window_open.noul * 100)}%`; $('passVal').textContent = `${Math.round(a.pass_window_open.noul * 100)}%`;
    $('yieldBar').style.width = `${Math.round(a.must_yield.noul * 100)}%`; $('yieldVal').textContent = `${Math.round(a.must_yield.noul * 100)}%`;
    $('latency').textContent = `${Math.round(latencyMs)} ms`;
    $('jevDot').className = 'dot live';
  },
  stats({ decisions, cadence, tokens, cost, model }) {
    $('decisions').textContent = decisions; $('cadence').textContent = cadence ? cadence.toFixed(1) : '—';
    $('tokens').textContent = tokens.toLocaleString(); $('cost').textContent = `$${cost.toFixed(4)}`;
    if (model) $('modelName').textContent = model;
  },
  timelinePush(time, maneuver) { this.timeline.push({ t: time, m: maneuver }); if (this.timeline.length > 400) this.timeline.shift(); },
  timelineReset() { this.timeline = []; $('timeline').innerHTML = ''; },
  timelineRender(now) {
    const span = 60, start = Math.max(0, now - span), el = $('timeline');
    const segs = [];
    for (let i = 0; i < this.timeline.length; i++) {
      const a = this.timeline[i], b = this.timeline[i + 1];
      const t0 = Math.max(a.t, start), t1 = Math.min(b ? b.t : now, now);
      if (t1 <= t0) continue;
      segs.push(`<i class="m-${a.m}" style="left:${(t0 - start) / span * 100}%;width:${(t1 - t0) / span * 100}%" title="${MANEUVER_LABELS[a.m]} at ${a.t.toFixed(1)} s"></i>`);
    }
    el.innerHTML = segs.join('');
  },
  banner(text, kind = 'info') { const b = $('banner'); if (!text) { b.hidden = true; return; } b.hidden = false; b.textContent = text; b.className = `banner ${kind}`; },
  endCard(sim, restartIn) {
    const card = $('endCard'); const r = sim.result; if (!r) { card.hidden = true; return; }
    card.hidden = false;
    const s = sim.summary();
    $('endTitle').textContent = r.reason === 'finish' ? 'Finish line reached' : r.reason === 'collision' ? `Collision with ${r.kind}` : `Time cap reached (${Math.round(sim.timeLimit / 60)} min) before the finish`;
    $('endTitle').className = r.reason === 'finish' ? 'good' : 'bad';
    $('endBody').innerHTML = `<span><b>${s.time_s}</b>s</span><span><b>${s.distance_m}</b>m</span><span><b>${s.decisions}</b>decisions</span><span><b>${s.overtakes_completed}</b>overtakes</span><span><b>${s.stops_at_crossings}</b>stops</span><span><b>${s.seconds_in_left_lane}</b>s left lane</span>`;
    $('endNote').textContent = restartIn === null ? 'Auto-restart is off. Press Restart or New traffic.' : `New traffic in ${Math.ceil(restartIn)} s…`;
  },
  startButton(running, hasResult) { const b = $('startBtn'); b.textContent = running ? 'Pause' : hasResult ? 'Start next run' : 'Start driving'; b.classList.toggle('primary', !running); }
};
