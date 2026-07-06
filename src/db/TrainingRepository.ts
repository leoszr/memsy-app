import { ResultCounts } from '../logic/progress';
import { DailyStat, TrainingResult } from '../logic/types';
import { calculateXP, isGoalMet } from '../logic/xp';
import { execute, first, run } from './sql';
import { SQLiteDatabaseLike } from './types';

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const localDate = (value: string) => value.slice(0, 10);

type DailyStatsRow = {
  date: string;
  cards_trained: number;
  cards_correct: number;
  goal_met: number;
};
type ResultCountsRow = { wrong: number; almost: number; correct: number };

function toDailyStat(row: DailyStatsRow): DailyStat {
  return {
    date: row.date,
    cardsTrained: row.cards_trained,
    cardsCorrect: row.cards_correct,
    goalMet: !!row.goal_met,
  };
}

export class TrainingRepository {
  constructor(private readonly db: SQLiteDatabaseLike) {}

  async log(
    cardId: string,
    result: TrainingResult,
    trainedAt: string,
  ): Promise<void> {
    await run(
      this.db,
      'INSERT INTO training_log(id, card_id, result, trained_at) VALUES (?, ?, ?, ?)',
      [id(), cardId, result, trainedAt],
    );
  }

  async recalculateDailyStat(
    dateOrIso: string,
    dailyGoal: number,
  ): Promise<DailyStat> {
    const date = localDate(dateOrIso);
    const row = await first<{ cards_trained: number; cards_correct: number }>(
      this.db,
      `SELECT COUNT(*) as cards_trained,
        COALESCE(SUM(CASE WHEN result = 'correct' THEN 1 ELSE 0 END), 0) as cards_correct
       FROM training_log
       WHERE substr(trained_at, 1, 10) = ?`,
      [date],
    );
    const cardsTrained = row?.cards_trained ?? 0;
    const cardsCorrect = row?.cards_correct ?? 0;
    const goalMet = isGoalMet(cardsTrained, dailyGoal);
    await run(
      this.db,
      'INSERT OR REPLACE INTO daily_stats(date, cards_trained, cards_correct, goal_met) VALUES (?, ?, ?, ?)',
      [date, cardsTrained, cardsCorrect, goalMet ? 1 : 0],
    );
    return { date, cardsTrained, cardsCorrect, goalMet };
  }

  async rebuildDailyStats(dailyGoal: number): Promise<void> {
    const rows = await execute<{ date: string }>(
      this.db,
      'SELECT DISTINCT substr(trained_at, 1, 10) as date FROM training_log ORDER BY date ASC',
    );
    for (const row of rows)
      await this.recalculateDailyStat(row.date, dailyGoal);
  }

  async calculateTotalXP(): Promise<number> {
    const counts = await this.getResultCounts();
    return (
      counts.wrong * calculateXP('wrong') +
      counts.almost * calculateXP('almost') +
      counts.correct * calculateXP('correct')
    );
  }

  async getResultCounts(): Promise<ResultCounts> {
    const counts = await first<ResultCountsRow>(
      this.db,
      `SELECT
        COALESCE(SUM(CASE WHEN result = 'wrong' THEN 1 ELSE 0 END), 0) as wrong,
        COALESCE(SUM(CASE WHEN result = 'almost' THEN 1 ELSE 0 END), 0) as almost,
        COALESCE(SUM(CASE WHEN result = 'correct' THEN 1 ELSE 0 END), 0) as correct
       FROM training_log`,
    );
    return {
      wrong: counts?.wrong ?? 0,
      almost: counts?.almost ?? 0,
      correct: counts?.correct ?? 0,
    };
  }

  async getDailyStat(date: string): Promise<DailyStat | null> {
    const row = await first<DailyStatsRow>(
      this.db,
      'SELECT * FROM daily_stats WHERE date = ?',
      [date],
    );
    return row ? toDailyStat(row) : null;
  }

  async getDailyStats(): Promise<DailyStat[]> {
    const rows = await execute<DailyStatsRow>(
      this.db,
      'SELECT * FROM daily_stats ORDER BY date ASC',
    );
    return rows.map(toDailyStat);
  }
}
