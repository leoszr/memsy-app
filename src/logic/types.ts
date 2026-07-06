export type CardStatus = 'new' | 'training' | 'mastered';
export type TrainingResult = 'wrong' | 'almost' | 'correct';

export type Card = {
  id: string;
  word: string;
  translation: string;
  phonetic?: string | null;
  gramClass?: string | null;
  langFrom: string;
  langTo: string;
  status: CardStatus;
  correctStreak: number;
  timesTrained: number;
  timesCorrect: number;
  timesWrong: number;
  createdAt: string;
  lastTrainedAt?: string | null;
};

export type DailyStat = {
  date: string;
  cardsTrained: number;
  cardsCorrect: number;
  goalMet: boolean;
};

export type Settings = Record<string, string>;
