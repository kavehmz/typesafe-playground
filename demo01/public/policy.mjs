export const DEFAULT_POLICY = Object.freeze({ confidence: 0.75, yesProbability: 0.80, urgentAt: 0.65 });
export const TEAM_NAMES = Object.freeze({ billing: 'Billing', technical: 'Technical support', account: 'Account support', sales: 'Sales', other: 'General review' });

// No inference here: sliders recompute this pure function using the same saved answers.
export function decide(answers, state, policy = DEFAULT_POLICY) {
  const { team, human_requested: human, urgency } = answers;
  const reasons = [];
  const used = new Set(['human_requested']);
  let destination = TEAM_NAMES[team.choice];
  let review = false;
  const floor = Math.max(0.5, Math.min(1, policy.yesProbability));
  const uncertain = p => p > 1 - floor && p < floor;
  if (human.noul < floor && !uncertain(human.noul)) used.add('team');

  if (human.noul >= floor) {
    review = true;
    destination = 'Human support';
    reasons.push('The message asks for a person. Send it to human support.');
  } else if (uncertain(human.noul)) {
    review = true;
    destination = 'Human review';
    reasons.push('The request for a person is uncertain at this probability threshold.');
  } else if (team.choice === 'other') {
    review = true;
    destination = 'General review';
    reasons.push('No specific team fits. Gather context before routing.');
  } else if (team.confidence < policy.confidence) {
    review = true;
    destination = 'Human review';
    reasons.push(`Team confidence is below the ${Math.round(policy.confidence * 100)}% routing threshold.`);
  } else {
    reasons.push(`Team confidence meets the ${Math.round(policy.confidence * 100)}% routing threshold.`);
  }

  const flags = [];
  // Branch-specific signals are used only on the selected, non-review path.
  if (!review && team.choice === 'billing') {
    used.add('refund_requested');
    const probability = answers.refund_requested.noul;
    flags.push(probability >= floor ? 'Refund requested · review eligibility' : uncertain(probability) ? 'Clarify refund request' : 'No refund request detected');
  }
  if (!review && team.choice === 'technical') {
    used.add('reproducible');
    const probability = answers.reproducible.noul;
    flags.push(probability >= floor ? 'Reproduction steps included' : uncertain(probability) ? 'Check reproduction details' : 'Ask for reproduction steps');
  }

  let priority;
  // A known incident is supplied as an observed fact; the model does not invent it.
  if (!review && team.choice === 'technical' && state.service.status === 'incident') {
    priority = 'High';
    reasons.push('A confirmed service incident makes this technical case high priority.');
  } else {
    used.add('urgency');
    if (urgency.confidence < policy.confidence) {
      priority = 'Review';
      reasons.push('Urgency confidence is low; review priority separately.');
    } else {
      priority = urgency.score / 3 >= policy.urgentAt ? 'High' : 'Normal';
      reasons.push(`Normalized urgency is ${Math.round(urgency.score / 3 * 100)}%; the high-priority threshold is ${Math.round(policy.urgentAt * 100)}%.`);
    }
  }
  return { destination, review, priority, flags, reasons, used: [...used] };
}
