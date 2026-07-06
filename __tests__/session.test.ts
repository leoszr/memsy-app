import {
  assignQuestionDirections,
  seededRandom,
  summarizeSession,
} from '../src/logic';
import { Card } from '../src/logic/types';

const card = (id: string, word = id): Card => ({
  id,
  word,
  translation: `${word}-pt`,
  langFrom: 'fr',
  langTo: 'pt',
  status: 'training',
  correctStreak: 0,
  timesTrained: 0,
  timesCorrect: 0,
  timesWrong: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastTrainedAt: null,
});

describe('session logic', () => {
  it('assigns question directions with seeded balanced distribution', () => {
    const cards = Array.from({ length: 100 }, (_, i) => card(String(i)));
    const directions = Object.values(
      assignQuestionDirections(cards, seededRandom(12)),
    );
    const front = directions.filter((d) => d === 'front-to-back').length;
    const back = directions.filter((d) => d === 'back-to-front').length;

    expect(front).toBeGreaterThan(35);
    expect(back).toBeGreaterThan(35);
    expect(front + back).toBe(100);
  });

  it('summarizes xp, counts and mastered words', () => {
    expect(
      summarizeSession([
        { card: card('1', 'bonjour'), result: 'correct', becameMastered: true },
        { card: card('2'), result: 'almost' },
        { card: card('3'), result: 'wrong' },
      ]),
    ).toEqual({
      totalXP: 16,
      correct: 1,
      almost: 1,
      wrong: 1,
      masteredWords: ['bonjour'],
    });
  });
});
