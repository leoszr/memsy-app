import { Card } from './types';

export const normalizeCardWord = (word: string) =>
  word.trim().toLocaleLowerCase();

export function findDuplicateCard(
  cards: Card[],
  word: string,
  langFrom: string,
  langTo: string,
) {
  const normalized = normalizeCardWord(word);
  return cards.find(
    (card) =>
      normalizeCardWord(card.word) === normalized &&
      card.langFrom === langFrom &&
      card.langTo === langTo,
  );
}
