// Jev's questions. Two answers steer the car (maneuver, pace); four more are shown to the audience.
// Instructions are literal and name the state fields to read. Numbers are compared by code beforehand
// and delivered as classes such as gap_class or margin_class next to the raw values.
export const QUESTIONS = {
  maneuver: {
    type: 'choice',
    instructions: {
      question: 'Which manoeuvre should the car carry out now, until the next decision about half a second from now?',
      you_are: 'the tactical driver of `ego` on a two-lane, two-way road under `rules`. The car executes your manoeuvre with smooth steering and braking and does nothing on its own.',
      read: [
        '`lead`: nearest same-direction car ahead in the right lane; `lead.distance_m` is bumper to bumper; `lead.gap_class` is far, comfortable, close, very close, or standing still when the car is stopped.',
        '`oncoming.nearest`: nearest car approaching in the left lane, with `seconds_until_meeting`.',
        '`overtake_estimate`: `margin_s` is time available minus time needed for the whole pass and return; `margin_class` is large surplus, moderate surplus, thin or deficit. `centre_line_conflict`, `crossing_conflict` and `speed_sign_conflict` say "none" when the road allows the pass.',
        '`being_passed`: the car you are passing while in the left lane; `position` is still ahead, alongside, or behind.',
        '`right_lane_return.zone_clear`: true when nothing is beside or just behind you in the right lane.',
        '`crossing`: the next zebra crossing; `stop_line_distance_m` is from your front bumper; `stop_line_reach` compares it with your stopping distance; `people` lists everyone at it.',
        'Distances are metres, speeds km/h. Your stopping distances already include decision latency.'
      ]
    },
    criteria: {
      cruise: {
        what: 'Keep the current lane and drive at the speed limit in use.',
        use_when: '`lead` is null or `lead.gap_class` is "far", the crossing ahead (if any) has `all_clear` true or is null, and `ego.lane_status` is in the right lane.',
        not_when: 'A slower car is comfortable, close or very close ahead (choose follow), a crossing needs a stop, or you are in the left lane (choose overtake or return_right).'
      },
      follow: {
        what: 'Keep the current lane and match the speed of `lead`, holding a safe gap behind it (the car handles the gap).',
        use_when: '`lead` exists with `gap_class` comfortable, close or very close, you are staying in the right lane, no crossing stop is needed first, and a pass is not currently available.',
        not_when: '`lead` is null, you are in the left lane, a stop for the crossing is needed, or `overtake_estimate` shows a surplus margin with all three conflicts "none" (then choose overtake: keep making progress).'
      },
      creep: {
        what: 'Keep the current lane and roll forward at about 8 km/h.',
        use_when: 'People are still on the road at the next crossing but `crossing.stop_line_reach` is "far beyond stopping distance" or "approaching", so rolling closer is safe; or edging forward in a doubtful, low-speed situation.',
        not_when: 'The stop line is within comfortable stopping distance and people are on the road or waiting (choose stop), or the crossing is clear (choose cruise or follow).'
      },
      stop: {
        what: 'Brake smoothly to a standstill just before the stop line of `crossing` (or behind a stopped car if that comes first) and hold there until you choose something else.',
        use_when: '`crossing.people_on_road` > 0 or `crossing.people_waiting_at_kerb` > 0, and `stop_line_reach` is "within comfortable stopping distance" or "approaching"; or you are already standing at the line and `crossing.all_clear` is false.',
        not_when: '`crossing` is null, `crossing.all_clear` is true, or the stop line is "far beyond stopping distance" while people will have finished long before you arrive.'
      },
      overtake: {
        what: 'Move into or stay in the left lane and accelerate to the speed limit to pass the slower car.',
        use_when: 'Starting: `lead` exists and is slower than the limit, `overtake_estimate.possible` is true, `margin_class` is "large surplus" or "moderate surplus", `centre_line_conflict`, `crossing_conflict` and `speed_sign_conflict` are all "none", and `lead.status` is moving. Continuing: you are already in the left lane and `being_passed.position` is "still ahead" or "alongside" while `margin_s` stays positive.',
        not_when: '`overtake_estimate` is null (the car ahead is too far away to plan a pass yet), `margin_class` is thin or deficit, any conflict is not "none", `oncoming.nearest.seconds_until_meeting` is small, or `being_passed.position` is "behind" (choose return_right).'
      },
      return_right: {
        what: 'Steer back into the right lane and match the speed of any car ahead there.',
        use_when: 'You are in the left lane, `being_passed.position` is "behind" (or `being_passed` is null) and `right_lane_return.zone_clear` is true. Also, while in the left lane, whenever `oncoming.nearest.seconds_until_meeting` is below about 6 and no body is exactly alongside: get out of the oncoming lane now, even behind or close to a slow car. Being boxed in the oncoming lane is the worst outcome.',
        not_when: '`being_passed.position` is "alongside" with plenty of time before oncoming traffic, `right_lane_return.zone_clear` is false with plenty of time, or `ego.lane_status` is already "centred in right lane" (then choose cruise or follow).'
      },
      abort_overtake: {
        what: 'Stay in the left lane but slow down to drop behind the car you were passing, so that a return to the right lane becomes possible behind it.',
        use_when: 'You are in the left lane, the pass can no longer be completed (`margin_class` deficit or thin) while `oncoming.nearest.seconds_until_meeting` still leaves time (above about 6 s or no oncoming car), and `being_passed.position` is "alongside" or "still ahead". Dropping behind a slow car takes several seconds.',
        not_when: 'You are in the right lane, `right_lane_return.zone_clear` is already true (choose return_right), or the oncoming car arrives in under about 6 s (choose return_right now).'
      },
      emergency_brake: {
        what: 'Brake as hard as the car can, staying on the current path.',
        use_when: 'A collision with a car or person is likely within about two seconds and no other manoeuvre avoids it.',
        not_when: 'A normal stop, follow or abort would do.'
      }
    }
  },
  pace: {
    type: 'choice',
    instructions: {
      question: 'Which speed limit should the car use as its cruising target right now?',
      read: 'Use `signs`. `signs.active_limit_kmh` is the last sign passed. `signs.next_sign.within_slowing_distance` is true when a sign ahead is close enough that the car should already be slowing for it.'
    },
    criteria: {
      '50': 'The active limit is 50 and either there is no next sign or the next sign is not within slowing distance; or the next sign within slowing distance also shows 50.',
      '30': 'The active limit is 30; or the next sign shows 30 and `within_slowing_distance` is true.'
    }
  },
  hazard: {
    type: 'score',
    instructions: 'If the car keeps its current manoeuvre, how dangerous is the situation over the next few seconds?',
    criteria: [
      'Clear: nothing near the car needs a reaction.',
      'Watch: something ahead, beside or behind needs attention within several seconds.',
      'Hazard: a conflict is developing that needs a change of speed or lane soon.',
      'Critical: a collision is likely within about two seconds unless the car brakes or steers now.'
    ]
  },
  attention: {
    type: 'choice',
    instructions: 'Which single item most deserves the driver\'s attention right now?',
    criteria: {
      lead_car: 'The same-direction car ahead in the right lane.',
      car_being_passed: 'The car alongside or just behind during an overtake.',
      oncoming_traffic: 'A car approaching in the left lane.',
      pedestrian_or_crossing: 'A person on or beside the road at a zebra crossing, or the crossing itself.',
      speed_sign: 'A speed limit change ahead, or being over the limit.',
      rear_or_blind_spot: 'A vehicle behind or in a blind spot.',
      nothing: 'The road around the car is clear.'
    }
  },
  pass_window_open: {
    type: 'noul',
    instructions: 'Is there enough time and room right now to overtake the car ahead completely and return to the right lane before meeting any oncoming traffic, with a broken centre line throughout?',
    criteria: {
      true: 'Yes: `overtake_estimate.possible` is true, `margin_class` is a surplus, both conflicts are "none".',
      false: 'No: `overtake_estimate` is null or not possible, the margin is thin or deficit, or a solid line or crossing is in the way.'
    }
  },
  must_yield: {
    type: 'noul',
    instructions: 'Must the car avoid entering the next zebra crossing right now because a person is on the road or waiting at the kerb to cross?',
    criteria: {
      true: 'Yes: `crossing` shows people on the road or waiting at the kerb and `all_clear` is false.',
      false: 'No: `crossing` is null, or every person has finished crossing.'
    }
  }
};

const isProb = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
export function validateAnswers(data) {
  if (!data || typeof data.model !== 'string' || !data.answers || typeof data.answers !== 'object') throw new Error('Malformed model response');
  const answers = {};
  for (const [id, q] of Object.entries(QUESTIONS)) {
    const a = data.answers[id];
    if (!a || a.type !== q.type) throw new Error(`Missing answer for ${id}`);
    if (q.type === 'noul') {
      if (!isProb(a.noul)) throw new Error(`Bad noul for ${id}`);
      answers[id] = { type: 'noul', noul: a.noul };
    } else if (q.type === 'choice') {
      const keys = Object.keys(q.criteria);
      if (!keys.includes(a.choice) || !isProb(a.confidence) || !a.probabilities || keys.some(k => !isProb(a.probabilities[k]))) throw new Error(`Bad choice for ${id}`);
      const sum = keys.reduce((s, k) => s + a.probabilities[k], 0);
      if (Math.abs(sum - 1) > 0.03) throw new Error(`Probabilities for ${id} do not sum to 1`);
      answers[id] = { type: 'choice', choice: a.choice, confidence: a.confidence, probabilities: Object.fromEntries(keys.map(k => [k, a.probabilities[k]])) };
    } else {
      const n = q.criteria.length;
      if (typeof a.score !== 'number' || !Number.isFinite(a.score) || a.score < 0 || a.score > n - 1 || !isProb(a.confidence) || !a.probabilities) throw new Error(`Bad score for ${id}`);
      const probs = {};
      for (let i = 0; i < n; i++) { if (!isProb(a.probabilities[String(i)])) throw new Error(`Bad score probabilities for ${id}`); probs[String(i)] = a.probabilities[String(i)]; }
      answers[id] = { type: 'score', score: a.score, confidence: a.confidence, probabilities: probs, legend: Object.fromEntries(q.criteria.map((c, i) => [String(i), c])) };
    }
  }
  const u = data.usage || {};
  if (!Number.isInteger(u.input_tokens) || !Number.isInteger(u.output_tokens) || u.input_tokens < 0 || u.output_tokens < 0) throw new Error('Bad usage');
  return { model: data.model, answers, usage: { input_tokens: u.input_tokens, output_tokens: u.output_tokens } };
}
