import { Card, CardStatus } from '../logic/types';
import { execute, first, run } from './sql';
import { SQLiteDatabaseLike } from './types';

type CardRow = {
  id: string;
  word: string;
  translation: string;
  phonetic: string | null;
  gram_class: string | null;
  lang_from: string;
  lang_to: string;
  status: CardStatus;
  correct_streak: number;
  times_trained: number;
  times_correct: number;
  times_wrong: number;
  created_at: string;
  last_trained_at: string | null;
};

export type NewCardInput = Pick<
  Card,
  'word' | 'translation' | 'langFrom' | 'langTo'
> &
  Partial<Pick<Card, 'id' | 'phonetic' | 'gramClass' | 'createdAt'>>;

const now = () => new Date().toISOString();
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function toCard(row: CardRow): Card {
  return {
    id: row.id,
    word: row.word,
    translation: row.translation,
    phonetic: row.phonetic,
    gramClass: row.gram_class,
    langFrom: row.lang_from,
    langTo: row.lang_to,
    status: row.status,
    correctStreak: row.correct_streak,
    timesTrained: row.times_trained,
    timesCorrect: row.times_correct,
    timesWrong: row.times_wrong,
    createdAt: row.created_at,
    lastTrainedAt: row.last_trained_at,
  };
}

export class CardRepository {
  constructor(private readonly db: SQLiteDatabaseLike) {}

  async create(input: NewCardInput): Promise<Card> {
    const card: Card = {
      id: input.id ?? makeId(),
      word: input.word.trim(),
      translation: input.translation,
      phonetic: input.phonetic ?? null,
      gramClass: input.gramClass ?? null,
      langFrom: input.langFrom,
      langTo: input.langTo,
      status: 'new',
      correctStreak: 0,
      timesTrained: 0,
      timesCorrect: 0,
      timesWrong: 0,
      createdAt: input.createdAt ?? now(),
      lastTrainedAt: null,
    };
    await run(
      this.db,
      `INSERT INTO cards (id, word, translation, phonetic, gram_class, lang_from, lang_to, status, correct_streak, times_trained, times_correct, times_wrong, created_at, last_trained_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.word,
        card.translation,
        card.phonetic,
        card.gramClass,
        card.langFrom,
        card.langTo,
        card.status,
        card.correctStreak,
        card.timesTrained,
        card.timesCorrect,
        card.timesWrong,
        card.createdAt,
        card.lastTrainedAt,
      ],
    );
    return card;
  }

  async getById(id: string): Promise<Card | null> {
    const row = await first<CardRow>(
      this.db,
      'SELECT * FROM cards WHERE id = ?',
      [id],
    );
    return row ? toCard(row) : null;
  }
  async getAll(): Promise<Card[]> {
    return (
      await execute<CardRow>(
        this.db,
        'SELECT * FROM cards ORDER BY created_at DESC',
      )
    ).map(toCard);
  }
  async getByStatus(status: CardStatus): Promise<Card[]> {
    return (
      await execute<CardRow>(
        this.db,
        'SELECT * FROM cards WHERE status = ? ORDER BY created_at DESC',
        [status],
      )
    ).map(toCard);
  }

  async update(card: Card): Promise<void> {
    await run(
      this.db,
      `UPDATE cards SET word = ?, translation = ?, phonetic = ?, gram_class = ?, lang_from = ?, lang_to = ?, status = ?, correct_streak = ?, times_trained = ?, times_correct = ?, times_wrong = ?, created_at = ?, last_trained_at = ? WHERE id = ?`,
      [
        card.word.trim(),
        card.translation,
        card.phonetic ?? null,
        card.gramClass ?? null,
        card.langFrom,
        card.langTo,
        card.status,
        card.correctStreak,
        card.timesTrained,
        card.timesCorrect,
        card.timesWrong,
        card.createdAt,
        card.lastTrainedAt ?? null,
        card.id,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await run(this.db, 'DELETE FROM cards WHERE id = ?', [id]);
  }
  async countByStatus(status: CardStatus): Promise<number> {
    const row = await first<{ count: number }>(
      this.db,
      'SELECT COUNT(*) as count FROM cards WHERE status = ?',
      [status],
    );
    return row?.count ?? 0;
  }
}
