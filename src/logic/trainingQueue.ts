import { Card } from './types';

type Random = () => number;

export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffle<T>(items: T[], random: Random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

const oldFirst = (a: Card, b: Card) =>
  (a.lastTrainedAt ?? '').localeCompare(b.lastTrainedAt ?? '');

export function buildTrainingQueue(
  cards: Card[],
  sessionSize = 10,
  random: Random = Math.random,
): Card[] {
  const wrong = cards.filter(
    (c) => c.status === 'training' && c.timesWrong > 0,
  );
  const fresh = cards.filter((c) => c.status === 'new');
  const training = cards
    .filter((c) => c.status === 'training' && c.timesWrong === 0)
    .sort(oldFirst);
  const mastered = cards.filter((c) => c.status === 'mastered').sort(oldFirst);

  return [
    ...shuffle(wrong, random),
    ...shuffle(fresh, random),
    ...shuffle(training, random),
    ...shuffle(mastered, random),
  ].slice(0, sessionSize);
}
