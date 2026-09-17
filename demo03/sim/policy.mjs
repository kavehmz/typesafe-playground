// The only place Jev's answers turn into a command. Deliberately tiny and explicit:
// the manoeuvre Jev chose is executed, and the speed limit Jev chose is the cruising target.
export const MANEUVER_LABELS = {
  cruise: 'Cruise at the limit', follow: 'Follow the car ahead', creep: 'Creep forward', stop: 'Stop at the line',
  overtake: 'Overtake on the left', return_right: 'Return to the right lane', abort_overtake: 'Abort the pass', emergency_brake: 'Emergency brake'
};
export function decisionFromAnswers(answers) {
  return { maneuver: answers.maneuver.choice, pace: Number(answers.pace.choice) };
}
