const speed = lane => ({
  type: 'choice',
  instructions: {
    question: `Assuming the target lane is ${lane}, choose the next speed action. Use the closest front vehicle in radar.${lane}, motion.lane_approach.${lane}, motion.crossings, and the active speed limit.`,
    approach: 'Yield means do not ENTER an occupied crossing. It does not mean stop wherever a pedestrian first becomes visible. Compare front_bumper_to_stop_line_m with motion.stop_distance_m. If there is ample room, approach under control; slow progressively and stop about 2 m before the line only if people are still crossing when you get there. At rest far from the line, ease forward if the nearer vehicle gap also allows it. Do not crawl through an occupied crossing.',
    following: 'Compare vehicle gap, closing speed and nominal_following_gap_m. A distant vehicle with ample following space is not a reason to brake immediately. A nearer lead car takes precedence over the crossing line. If its actual bumper gap is already BELOW motion.lane_approach for the target lane gentle_relative_stopping_gap_m and the gap is closing, gentle slowing is insufficient: choose firm or emergency braking, not slow. Check both occupied lanes during an unfinished lane change. Objects solely behind, cleared pedestrians, and crossings already behind are not front hazards.',
    speed_limit: 'Cruise near road_rules.active_limit_kmh when clear. Consider the NEXT action_effects speed to avoid overshooting. A higher sign ahead does not apply until passed, but you may accelerate up to the current limit. At a stop line with people crossing, keep speed zero; after it clears, resume.',
    timing: 'Motion values include measured response delay plus a decision interval. These are simplified estimates, not guarantees. Pedestrian clearance is an estimate only: approach and observe again before entering. Prefer gentle controls for normal adjustments, strong braking for short stopping margins.'
  },
  criteria: {
    accelerate: 'Acceleration +3 m/s². Clear road, well below the active limit, and enough space for the projected extra speed and travel.',
    ease: 'Gentle acceleration +1 m/s². Move forward from a premature distant stop, approach slowly with room remaining, or make a small speed increase. Does not enforce a target speed automatically.',
    coast: 'Zero acceleration: hold current speed, including holding zero when correctly stopped near the line. Use for a suitable approach speed or matched following speed, not to remain stopped far away on a clear approach.',
    slow: 'Gentle braking -1.5 m/s². Use while sufficient stopping space remains: ordinary speed trimming and gradual approaches. Do NOT choose when a closing vehicle gap is already smaller than gentle_relative_stopping_gap_m or a required stop cannot fit the gentle stop distance.',
    brake: 'Firm braking -5 m/s². Use when the gap is too short for gentle slowing: a closing lead car below gentle_relative_stopping_gap_m, or an occupied crossing inside the gentle stopping distance. Do not use just because a hazard is visible far away.',
    emergency: 'Hard braking -9 m/s². Contact or crossing entry is imminent and gentler braking is insufficient.'
  }
});

export const QUESTIONS = {
  lane: {
    type: 'choice',
    instructions: 'Choose the target lane now using `cameras.front`, `cameras.left`, `cameras.right`, `cameras.rear`, `radar`, `blind_spots`, `road_observations`, `road_rules`, and `ego`. Both lanes travel in the SAME direction. Keep the current target lane while a front vehicle is still distant and following space is ample. Use closing speed, radar time to collision, and motion.lane_approach to decide when catching slower traffic makes a pass useful. A visible distant car is not an immediate lane-change command. Pass when catching up and the other lane is clear. Do not overtake a vehicle yielding to pedestrians at a crosswalk; stay in lane and slow or stop for the crossing. Before changing or returning after overtaking, check the destination lane for vehicles alongside or approaching from behind. A negative forward offset does NOT mean you have fully passed: longitudinal_overlap=true means the vehicle bodies still overlap. Compare relative speed and clearance over the 1.4-second lane change. The blind-spot flags cover only a short lane corridor, so also inspect side/rear cameras and rear radar. Use `ego.occupied_lanes` and `ego.remaining_lane_change_seconds` to understand an ongoing transition; do not oscillate between lanes. Preserve progress while avoiding contact.',
    criteria: {
      left: 'Occupy or move to the left lane. Appropriate if already there and it is usable, or to pass an obstruction when the left lane has sufficient front and rear clearance.',
      right: 'Occupy or move to the right lane. Appropriate if already there and it is usable, or to pass an obstruction when the right lane has sufficient front and rear clearance.'
    }
  },
  left_speed: speed('left'),
  right_speed: speed('right'),
  collision_risk: {
    type: 'noul',
    instructions: 'If the ego car continues its current target lane movement and speed for the next two seconds, is collision with an observed object likely? Use all four `cameras`, `radar`, `blind_spots`, and `ego.occupied_lanes`. Include pedestrians walking across either lane and side contact during a lane change, not only a front collision. This probability is a risk prediction, not severity.'
  },
  attention: {
    type: 'choice',
    instructions: 'Which observed situation most needs attention now? Use all four `cameras`, `radar`, `blind_spots`, `road_observations`, `road_rules`, and `ego`. A car partly alongside or approaching the proposed destination lane from behind counts as adjacent traffic.',
    criteria: {
      clear: 'The driving path is clear and no nearby vehicle demands attention.',
      slower_traffic: 'A slower vehicle ahead affects progress or following distance.',
      pedestrian: 'A pedestrian is waiting near or walking across a marked crossing; anticipate or yield.',
      speed_limit: 'A visible upcoming speed sign or overspeed relative to the remembered active limit requires a speed adjustment.',
      adjacent_traffic: 'A nearby vehicle beside or behind the car constrains a lane change.'
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
