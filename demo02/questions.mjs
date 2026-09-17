import { TARGET_SPEED_KEYS } from './public/vehicle.mjs';
const speed = lane => ({
  type: 'choice',
  instructions: {
    question: `This is a CONDITIONAL speed decision: assume the separate lane decision has chosen ${lane.toUpperCase()} now. Choose the numerical TARGET SPEED for carrying out that manoeuvre, or emergency for immediate hard braking. Do not answer for the other lane. The actuator tracks the chosen value without reading traffic.`,
    lane_specific: lane === 'left' ? 'LEFT means overtaking, not following the slower RIGHT-lane target. With positive passing margins, select the active legal limit (50 or 30) to gain distance on the car being passed; matching that right-lane car at 12 km/h would make the pass impossible. Still account for the part of the curve that occupies the original lane and any imminent contact. If the pass is no longer feasible, choose a lower rolling speed to fall behind before returning.' : 'RIGHT means normal driving or returning from a pass. Match a constraining moving RIGHT-lane lead car, with gap corrections. If that original overtaken car is now behind and the next front car is distant, continue near the legal limit while driving the return curve. An oncoming car safely in LEFT is not a reason to stop in RIGHT.',
    following: `A visible car is not necessarily constraining. Compare radar.${lane}.front_gap_m with motion.lane_approach.${lane}.matching_speed_distance_m and nominal_following_gap_m. When the gap is much larger than both (for example a 15 km/h car over 100 m ahead), continue near the legal limit, not its speed. When the gap approaches the space needed to match and follow a MOVING same-direction car, choose approximately its speed in km/h, not zero. Example: a 14 km/h lead at a normal following gap calls for 14, not 0. If still closing too fast, choose a somewhat lower moving speed temporarily. Stopping is for a stopped obstruction or an imminent need to stop.`,
    crossing: 'Read motion.crossings[].front_bumper_to_stop_line_m, not merely pedestrian presence. Yield means do not ENTER the occupied crosswalk; it does not mean stop wherever a pedestrian first becomes visible. With ample distance beyond motion.stop_distance_m.normal + 2 m, choose a POSITIVE controlled approach speed, typically 5–10 km/h. In particular a car already stopped 37 m before the line should select 5, not 0. As the gap shrinks to the stopping distance plus roughly 2 m clearance, select 0 if the crossing remains occupied. A stopped car 1 m before the line should hold 0. Reassess clearance and resume when the roadway clears.',
    passing: `If target ${lane} means continuing a justified pass in LEFT, make progress near the current legal limit. If returning RIGHT, keep enough forward speed to DRIVE the return curve; a target of 0 cannot slide the car sideways. Adjust to any nearer right-lane lead vehicle. If aborting while alongside, select a lower rolling speed to let the ORIGINAL target get ahead, then return when a gap exists. Do not brake to zero just because oncoming traffic is in its own lane while we remain RIGHT.`,
    limits: 'Use road_rules.active_limit_kmh. A higher future sign is not active yet. When clear, prefer the current limit; when matching a slow car, select its observed speed or slightly below. Emergency means hard braking for imminent contact; ordinary target 0 is a normal stop.'
  },
  criteria: Object.fromEntries(TARGET_SPEED_KEYS.map(k => [k, k === 'emergency' ? 'Hard emergency stop, -9 m/s², for imminent contact.' : k === '0' ? 'Full stop: occupied crossing within stopping distance plus 2 m, stopped obstruction close ahead, or no moving gap. NOT for a distant pedestrian or an ordinary moving lead car.' : k === '5' ? '5 km/h: controlled moving approach toward a distant occupied crossing, or very slow traffic. Resume from an unnecessarily distant stop while room remains.' : `${k} km/h target`]))
});

export const QUESTIONS = {
  lane: {
    type: 'choice',
    instructions: {
      question: 'Choose the immediate lateral target RIGHT or LEFT now. Evaluate CURRENT body positions before the desired eventual lane. If already LEFT and passing.right_merge.observed_bodies_alongside is nonempty, RIGHT cuts into that car now: stay LEFT while completing the pass or braking to drop behind. RIGHT is the normal lane to return to once a gap actually exists.',
      start_pass: 'When still RIGHT, prefer a useful overtake of a nearby slower vehicle if a complete legal-speed pass AND return right fit. In this demo aim for at least 2 seconds positive passing.pass.time_margin_at_limit_s, positive marking_visibility_margin_m, no solid line along the manoeuvre, and adequate eventual return space. These are estimates to assess, not guaranteed permission. Do not indefinitely follow a slow car when these conditions clearly support passing. Compare passing.pass estimates with detected oncoming contact times and earliest_unseen_oncoming_arrival_at_limit_s. A missing return means only no vehicle detected within radar range, not infinite clear road. Do not count on exceeding the speed limit or oncoming traffic stopping for you. No pass over a solid centre line or if it would run into an observed no-passing segment or crossing.',
      continue_or_abort: 'Reassess each snapshot. If already LEFT, use right_merge and the target body clearance before returning. Do not cut into a car alongside even when its centre is behind. If completing the pass is no longer feasible, slow to fall behind and return once the right-hand gap exists; while alongside, staying LEFT briefly can be necessary to create that gap. The speed question separately chooses a numerical target speed.',
      return_right: 'Use maneuver_memory and passing.original_target_id: finish the ORIGINAL overtake, not a newly nearer car. When passing.pass.relative_gain_still_needed_m is zero and current right front/rear gaps allow it, choose RIGHT NOW. Another slower car farther ahead is not a reason to keep cruising left or silently start a second overtake. Do not keep cruising LEFT after the overtake. If there is no useful or currently feasible pass, follow on the RIGHT. Do not overtake a vehicle yielding to pedestrians. Avoid initiating passes for distant traffic that is not yet constraining progress.'
    },
    criteria: {
      left: 'Start passing a nearby slower car when time_margin_at_limit_s is at least 2 seconds, marking_visibility_margin_m is positive, the line is broken and the manoeuvre stays before any crossing/solid segment. Matching the lead speed NOW does not rule out accelerating to the limit during the pass. Also KEEP LEFT when already alongside a right-hand car: returning right now would cause side contact. When aborting alongside, the speed answer selects a lower rolling speed to open a gap before a later return.',
      right: 'Keep right when already there and a pass is not justified. Return right from a pass ONLY when right_merge.observed_bodies_alongside is empty and front/rear gaps permit. Not an immediate escape while another car is alongside.'
    }
  },
  left_speed: speed('left'),
  right_speed: speed('right'),
  collision_risk: {
    type: 'noul',
    instructions: 'If the ego car continues its current target lane movement and speed for the next two seconds, is collision with an observed object likely? Use all four `cameras`, `radar`, `blind_spots`, and `ego.occupied_lanes`. Include head-on contact with oncoming traffic when the ego car occupies or is entering LEFT, plus pedestrians and side contact. Oncoming traffic safely confined to LEFT is not itself a collision threat while we stay RIGHT. This probability is a risk prediction, not severity.'
  },
  attention: {
    type: 'choice',
    instructions: 'Which observed situation most needs attention now? Use all four `cameras`, `radar`, `blind_spots`, `road_observations`, `road_rules`, and `ego`. A car partly alongside or approaching the proposed destination lane from behind counts as adjacent traffic.',
    criteria: {
      clear: 'The driving path is clear and no nearby vehicle demands attention.',
      slower_traffic: 'A slower vehicle ahead affects progress or following distance.',
      pedestrian: 'A pedestrian is waiting near or walking across a marked crossing; anticipate or yield.',
      speed_limit: 'A visible upcoming speed sign or overspeed relative to the remembered active limit requires a speed adjustment.',
      adjacent_traffic: 'A nearby vehicle beside or behind the car constrains a lane change.',
      oncoming: 'Opposite-direction traffic or limited forward visibility constrains starting, completing, or abandoning a pass.'
    }
  }
};

export function validateDecision(data) {
  if (!data || typeof data.model !== 'string' || !data.answers) throw new Error('Invalid model response');
  const valid = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
  const answers = {};
  for (const [id, q] of Object.entries(QUESTIONS)) {
    const a = data.answers[id];
    if (!a || a.type !== q.type) throw new Error('Invalid answer type');
    if (q.type === 'noul') {
      if (!valid(a.noul)) throw new Error('Invalid probability');
      answers[id] = { type: 'noul', noul: a.noul };
    } else {
      const keys = Object.keys(q.criteria);
      if (!keys.includes(a.choice) || !valid(a.confidence) || !a.probabilities || Object.keys(a.probabilities).length !== keys.length || keys.some(k => !valid(a.probabilities[k])) || Math.abs(keys.reduce((s, k) => s + a.probabilities[k], 0) - 1) > .025 || a.probabilities[a.choice] + .01 < Math.max(...Object.values(a.probabilities))) throw new Error('Invalid choice distribution');
      answers[id] = { type: 'choice', choice: a.choice, confidence: a.confidence, probabilities: a.probabilities };
    }
  }
  if (!data.usage || !Number.isInteger(data.usage.input_tokens) || data.usage.input_tokens < 0 || !Number.isInteger(data.usage.output_tokens) || data.usage.output_tokens < 0) throw new Error('Invalid token usage');
  return { model: data.model, answers, usage: { input_tokens: data.usage.input_tokens, output_tokens: data.usage.output_tokens } };
}
