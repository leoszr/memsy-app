import { Card, TrainingResult } from './types';
import { calculateXP } from './xp';

export type QuestionDirection = 'front-to-back' | 'back-to-front';
type Random = () => number;

export type SessionAnswer = {
  card: Card;
  result: TrainingResult;
  becameMastered?: boolean;
};

export type SessionSummary = {
  totalXP: number;
  correct: number;
  almost: number;
  wrong: number;
  masteredWords: string[];
};

export function assignQuestionDirections(
  cards: Card[],
  random: Random = Math.random,
): Record<string, QuestionDirection> {
  return cards.reduce<Record<string, QuestionDirection>>((acc, card) => {
    acc[card.id] = random() < 0.5 ? 'front-to-back' : 'back-to-front';
    return acc;
  }, {});
}

export function summarizeSession(answers: SessionAnswer[]): SessionSummary {
  return answers.reduce<SessionSummary>(
    (summary, answer) => {
      summary[answer.result] += 1;
      summary.totalXP += calculateXP(answer.result);
      if (answer.becameMastered) summary.masteredWords.push(answer.card.word);
      return summary;
    },
    { totalXP: 0, correct: 0, almost: 0, wrong: 0, masteredWords: [] },
  );
}
