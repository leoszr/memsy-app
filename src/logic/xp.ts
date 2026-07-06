import { TrainingResult } from './types';

export function calculateXP(result: TrainingResult): number {
  return result === 'correct' ? 10 : result === 'almost' ? 5 : 1;
}

export function isGoalMet(
  cardsTrainedToday: number,
  dailyGoal: number,
): boolean {
  return cardsTrainedToday >= dailyGoal;
}
