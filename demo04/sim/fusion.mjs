// Fusion: turn raw sensor returns plus memory into the compact situation Jev reads.
// Every field here comes from something a sensor reported or the car computed from its own motion.
// Code does the arithmetic (gaps, times, margins); Jev does the judgment.
import { clamp, round } from './rng.mjs';
import { LIMITS, laneStatus } from './dynamics.mjs';
import { RADAR } from './sensors.mjs';

export const RULES = [
  'Drive in the right lane. The left lane carries oncoming traffic toward you.',
  'Use the left lane only to overtake a slower car, and only when the pass and the return to the right lane can be completed before meeting oncoming traffic.',
  'A solid centre line means no overtaking on that stretch.',
  'At a zebra crossing, stop at the stop line while a person is on the road or waiting at the kerb to cross. Continue once the crossing is clear.',
  'The speed limit is the last sign passed (50 km/h until the first sign). Slow down before a 30 sign, not after it.',
  'Make progress. When a slower car holds you under the limit and a pass is possible with a surplus margin and no conflicts, overtake it instead of following indefinitely.',
  'Your chosen manoeuvre is carried out by the car until your next decision, roughly half a second later. You can change it every time.'
];

const gapClass = headway => headway === null ? 'standing still' : headway > 6 ? 'far' : headway > 3 ? 'comfortable' : headway > 1.5 ? 'close' : 'very close';
const marginClass = m => m === null ? 'not possible' : m >= 6 ? 'large surplus' : m >= 3 ? 'moderate surplus' : m >= 0 ? 'thin' : 'deficit';

function collectObjects(sensed) {
  const objects = new Map();
  const add = (d, source) => {
    if (!d) return;
    const prev = objects.get(d.id);
    if (!prev) objects.set(d.id, { ...d, sources: [source] });
    else { Object.assign(prev, d, { sources: [...prev.sources, source] }); }
  };
  for (const [name, cam] of Object.entries(sensed.cameras)) for (const d of cam.detections) add(d, `${name} camera`);
  for (const lane of ['left', 'right']) { add(sensed.radar.front[lane], 'front radar'); add(sensed.radar.rear[lane], 'rear radar'); }
  return objects;
}

export function overtakeEstimate({ ego, target, oncoming, limit, markings, crossing, inLeftLane, nextSign = null }) {
  if (!target) return null;
  const v = ego.speed * Math.cos(ego.heading), vl = target.speed_kmh / 3.6, vmax = Math.min(limit, LIMITS.maxSpeed);
  const need = target.forward_m + 11.5; // ego centre must lead the target centre by a car length plus a 7 m margin
  const base = { target: target.id, target_speed_kmh: target.speed_kmh, relative_distance_still_needed_m: round(Math.max(0, need)) };
  if (need <= 0) return { ...base, pass_complete: true, note: 'the car is already far enough ahead of the target to move back right' };
  if (vl >= vmax - 0.3) return { ...base, pass_complete: false, possible: false, note: 'the target is as fast as the speed limit; a legal pass cannot gain distance' };
  // Simulate the ego speed profile once; read off when the pass has gained enough distance and when the
  // oncoming car (or an assumed unseen one at radar range doing 50 km/h) would be met at that same profile.
  const dt = 0.1, vOnc = oncoming ? oncoming.speed_kmh / 3.6 : 50 / 3.6, gapOnc = oncoming ? oncoming.distance_m : RADAR.frontRange;
  let speed = v, egoDist = 0, rel = 0, tGain = null, distAtGain = 0, tAvail = null;
  for (let t = dt; t <= 60 && (tGain === null || tAvail === null); t += dt) {
    const ns = Math.min(vmax, speed + 2.7 * dt), avg = (speed + ns) / 2;
    egoDist += avg * dt; rel += (avg - vl) * dt; speed = ns;
    if (tGain === null && rel >= need) { tGain = t; distAtGain = egoDist; }
    if (tAvail === null && egoDist + vOnc * t >= gapOnc) tAvail = t;
  }
  if (tGain === null) return { ...base, pass_complete: false, possible: false, note: 'gaining enough distance would take over a minute' };
  const entry = inLeftLane ? 0 : clamp(Math.max(v, 3) * 2.8, 22, 45) / Math.max((v + vmax) / 2, 3);
  const ret = clamp(vmax * 2.8, 22, 45) / vmax;
  const passTime = Math.max(tGain, entry) + ret, passDistance = distAtGain + vmax * ret;
  const available = tAvail === null ? 60 : tAvail;
  const source = oncoming ? `nearest oncoming car ${oncoming.id}` : `no oncoming car detected within ${RADAR.frontRange} m; assumes one could appear at that range doing 50 km/h`;
  const margin = available - passTime;
  const solidNow = markings.centre_line_here === 'solid';
  const solidWithin = markings.solid_section_starts_in_m !== null && markings.solid_section_starts_in_m < passDistance;
  return {
    ...base, pass_complete: false, possible: true,
    time_needed_s: round(passTime), distance_needed_m: round(passDistance, 0),
    time_available_s: round(available), time_available_source: source,
    margin_s: round(margin), margin_class: marginClass(margin),
    centre_line_conflict: solidNow ? 'solid line here' : solidWithin ? `solid line begins in ${markings.solid_section_starts_in_m} m, inside the pass` : 'none',
    crossing_conflict: crossing && crossing.stop_line_distance_m < passDistance ? `${crossing.id} lies inside the pass distance` : 'none',
    speed_sign_conflict: nextSign && nextSign.limit_kmh < limit * 3.6 - 1 && nextSign.distance_m < passDistance ? `${nextSign.limit_kmh} sign in ${nextSign.distance_m} m lies inside the pass distance` : 'none'
  };
}

export function fuseSituation({ ego, sensed, signs, crossings, passTargetId, time, timing, pace, peopleMemory = new Map() }) {
  const objects = collectObjects(sensed);
  const egoForward = ego.speed * Math.cos(ego.heading);
  const cars = [...objects.values()].filter(o => o.kind === 'car');
  const half = ego.length / 2;
  const car = o => ({ id: o.id, distance_m: round(Math.max(0, Math.abs(o.forward_m) - half - 2.25)), speed_kmh: o.speed_kmh, seen_by: [...new Set(o.sources)] });

  // Lead: nearest same-direction car ahead in the right lane.
  const leadObj = cars.filter(o => o.direction === 'same' && o.lane === 'right' && o.forward_m > 0 && o.id !== passTargetId).sort((a, b) => a.forward_m - b.forward_m)[0] || null;
  let lead = null;
  if (leadObj) {
    const gap = Math.max(0, leadObj.forward_m - half - 2.25), closing = egoForward - leadObj.speed_kmh / 3.6;
    lead = { ...car(leadObj), closing_speed_kmh: round(closing * 3.6, 0), time_headway_s: egoForward > 0.3 ? round(gap / egoForward) : null, gap_class: gapClass(egoForward > 0.3 ? gap / egoForward : null), status: leadObj.speed_kmh < 2 ? 'stopped' : 'moving' };
  }
  // Oncoming: nearest two cars in the left lane ahead.
  const oncomingObjs = cars.filter(o => o.direction === 'oncoming' && o.forward_m > -half).sort((a, b) => a.forward_m - b.forward_m);
  const oncomingCar = o => { const gap = Math.max(0, o.forward_m - half - 2.25), closing = egoForward + o.speed_kmh / 3.6; return { ...car(o), distance_m: round(gap), closing_speed_kmh: round(closing * 3.6, 0), seconds_until_meeting: closing > 0.5 ? round(gap / closing) : null }; };
  const oncoming = { nearest: oncomingObjs[0] ? oncomingCar(oncomingObjs[0]) : null, second: oncomingObjs[1] ? oncomingCar(oncomingObjs[1]) : null };
  if (!oncomingObjs[0]) oncoming.note = `no oncoming car detected within ${RADAR.frontRange} m`;
  // The car being passed.
  let being_passed = null;
  if (passTargetId) {
    const o = objects.get(passTargetId);
    if (o) {
      const offset = o.forward_m;
      being_passed = { id: o.id, speed_kmh: o.speed_kmh, position: Math.abs(offset) < 5 ? 'alongside' : offset >= 5 ? 'still ahead' : 'behind', centre_offset_m: round(offset), clear_distance_m: round(Math.max(0, Math.abs(offset) - half - 2.25)), our_rear_bumper_is_ahead_of_its_front_by_m: round(-offset - half - 2.25) };
    } else being_passed = { id: passTargetId, position: 'not currently detected', note: 'no sensor sees it right now' };
  }
  // Right-lane return zone: anything beside or just behind the car in the right lane.
  const rightZone = cars.filter(o => o.lane === 'right' && o.forward_m > -12 && o.forward_m < 8);
  const nextRightAhead = cars.filter(o => o.lane === 'right' && o.forward_m >= 8).sort((a, b) => a.forward_m - b.forward_m)[0] || null;
  const right_lane_return = ego.laneTarget === 'left' || ego.x < 0.5 ? { zone_clear: rightZone.length === 0 && !sensed.blind_spots.right.occupied, bodies_in_zone: rightZone.map(o => o.id), blind_spot_right_occupied: sensed.blind_spots.right.occupied, seconds_to_complete_return_at_current_speed: egoForward > 0.5 ? round(clamp(egoForward * 2.8, 22, 45) / egoForward) : null, next_car_ahead_in_right_lane: nextRightAhead ? { id: nextRightAhead.id, gap_m: round(nextRightAhead.forward_m - half - 2.25), speed_kmh: nextRightAhead.speed_kmh } : null } : null;
  // Rear.
  const rearObj = sensed.radar.rear.right;
  const rear = rearObj && rearObj.kind === 'car' ? { id: rearObj.id, distance_m: rearObj.gap_m, speed_kmh: rearObj.speed_kmh, closing_speed_kmh: rearObj.closing_speed_kmh } : null;
  // Crossing ahead with people.
  const egoFront = ego.z + half;
  const nextCrossing = crossings.nextAhead(egoFront);
  let crossing = null;
  if (nextCrossing) {
    const stopLine = nextCrossing.z - 3 - egoFront;
    const detectedPeople = [...objects.values()].filter(o => o.kind === 'pedestrian' && o.crossing_id === nextCrossing.id);
    for (const p of detectedPeople) peopleMemory.set(p.id, { record: p, time, egoZ: ego.z });
    const remembered = [...peopleMemory.values()].filter(m => m.record.crossing_id === nextCrossing.id && !detectedPeople.some(p => p.id === m.record.id) && time - m.time <= 3).map(m => ({ ...m.record, forward_m: m.record.forward_m - (ego.z - (m.egoZ ?? ego.z)), _seen: `last seen ${round(time - m.time)} s ago, now hidden` }));
    const people = [...detectedPeople, ...remembered].map(p => {
      const x = p.x_m, onRoad = Math.abs(x) <= 3.85;
      const movingLeft = p.walking === 'toward left kerb', moving = p.walking.startsWith('toward');
      const finished = p.walking === 'finished crossing';
      const position = finished ? 'finished crossing, on the far kerb' : !onRoad ? (x > 0 ? 'waiting on right kerb (our side)' : 'waiting on left kerb') : x > 0 ? 'on the road in our lane' : 'on the road in the oncoming lane';
      let towardOurLane = 'standing';
      if (moving) towardOurLane = (x < 0 && !movingLeft) ? 'toward our lane' : (x > 0 && !movingLeft) ? 'leaving the road on our side' : (x > 0 && movingLeft) ? 'crossing our lane toward the oncoming lane' : 'leaving the road on the far side';
      const speed = p.speed_kmh / 3.6;
      const farEdge = movingLeft ? -3.85 : 3.85;
      const secondsToClear = moving && onRoad ? round(Math.abs(farEdge - x) / Math.max(speed, 0.3)) : null;
      const secondsToOurLane = moving && x < 0 && !movingLeft ? round(Math.abs(0 - x) / Math.max(speed, 0.3)) : null;
      return { id: p.id, seen: p._seen || 'now', position, walking: p.walking === 'finished crossing' ? 'finished, on far kerb' : towardOurLane, seconds_until_off_the_road: secondsToClear, seconds_until_in_our_lane: secondsToOurLane, distance_ahead_m: round(p.forward_m - half, 0) };
    });
    const finished = people.filter(p => p.walking === 'finished, on far kerb').length;
    const comfortableStopNow = egoForward * egoForward / (2 * 3.5) + egoForward * (timing.latency_ms / 1000);
    const reach = stopLine < 0 ? 'already past the stop line' : stopLine <= comfortableStopNow + 2 ? 'within comfortable stopping distance' : stopLine <= 2 * comfortableStopNow + 10 ? 'approaching: less than twice the stopping distance' : 'far beyond stopping distance';
    crossing = {
      id: nextCrossing.id, stop_line_distance_m: round(stopLine), zebra_distance_m: round(stopLine + 3), stop_line_reach: reach,
      people_on_road: people.filter(p => p.position.startsWith('on the road')).length,
      people_waiting_at_kerb: people.filter(p => p.position.startsWith('waiting')).length,
      people_finished: finished,
      people, all_clear: people.length > 0 && people.every(p => p.walking === 'finished, on far kerb'),
      nobody_detected: people.length === 0
    };
    if (stopLine < 0) crossing.note = 'the front bumper is already past the stop line';
  }
  const limit = pace / 3.6;
  const comfortableStop = egoForward * egoForward / (2 * 3.5) + egoForward * (timing.latency_ms / 1000);
  const passTarget = being_passed && objects.get(passTargetId) ? objects.get(passTargetId) : leadObj && leadObj.forward_m < 90 ? leadObj : null;
  const signSnapshot = signs.snapshot(ego.z);
  if (signSnapshot.next_sign) signSnapshot.next_sign.within_slowing_distance = signSnapshot.next_sign.distance_m <= comfortableStop + 15;
  const overtake_estimate = overtakeEstimate({ ego, target: passTarget, oncoming: oncoming.nearest, limit, markings: sensed.road, crossing, inLeftLane: ego.laneTarget === 'left', nextSign: signSnapshot.next_sign });
  return {

    ego: {
      speed_kmh: round(ego.speed * 3.6, 0), lane_status: laneStatus(ego), current_maneuver: ego.maneuver, seconds_in_current_maneuver: round(time - ego.maneuverSince),
      speed_limit_in_use_kmh: pace, over_limit_by_kmh: round(Math.max(0, ego.speed * 3.6 - pace), 0),
      comfortable_stopping_distance_m: round(comfortableStop, 0), hard_stopping_distance_m: round(egoForward * egoForward / (2 * 7) + egoForward * (timing.latency_ms / 1000), 0)
    },
    lead, being_passed, oncoming, right_lane_return, rear,
    blind_spots: { left: sensed.blind_spots.left, right: sensed.blind_spots.right },
    crossing,
    markings: { centre_line_here: sensed.road.centre_line_here, solid_section_starts_in_m: sensed.road.solid_section_starts_in_m, solid_section_ends_in_m: sensed.road.solid_section_ends_in_m },
    signs: signSnapshot,
    overtake_estimate,
    timing: { decision_latency_ms: round(timing.latency_ms, 0), car_travel_during_latency_m: round(egoForward * timing.latency_ms / 1000), next_decision_in_ms: round(timing.interval_ms, 0) }
  };
}
