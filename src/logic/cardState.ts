import { Card, TrainingResult } from './types';

export function nextCardState(
  card: Card,
  result: TrainingResult,
  trainedAt = new Date().toISOString(),
): Card {
  const wasNew = card.status === 'new';
  let correctStreak = card.correctStreak;
  let status = wasNew ? 'training' : card.status;

  if (result === 'correct') correctStreak += 1;
  if (result === 'wrong') {
    correctStreak = 0;
    if (status === 'mastered') status = 'training';
  }
  if (correctStreak >= 3) status = 'mastered';

  return {
    ...card,
    status,
    correctStreak,
    timesTrained: card.timesTrained + 1,
    timesCorrect: card.timesCorrect + (result === 'correct' ? 1 : 0),
    timesWrong: card.timesWrong + (result === 'wrong' ? 1 : 0),
    lastTrainedAt: trainedAt,
  };
}
