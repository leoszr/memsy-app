import {
  SQLiteDatabaseLike,
  SQLiteExecuteResult,
  SQLiteParams,
  SQLiteStatementLike,
} from '../../src/db/types';

type Row = Record<string, string | number | null>;

class Result<T> implements SQLiteExecuteResult<T> {
  lastInsertRowId = 1;
  changes: number;
  constructor(
    private rows: T[],
    changes = 0,
  ) {
    this.changes = changes;
  }
  async getFirstAsync() {
    return this.rows[0] ?? null;
  }
  async getAllAsync() {
    return this.rows;
  }
}

const arr = (params?: SQLiteParams) =>
  Array.isArray(params) ? params : Object.values(params ?? {});

export class FakeDb implements SQLiteDatabaseLike {
  tables = new Set<string>();
  cards: Row[] = [];
  settings = new Map<string, string>();
  dailyStats: Row[] = [];
  trainingLog: Row[] = [];
  prepared: string[] = [];

  async execAsync(source: string): Promise<void> {
    for (const table of [
      'migrations',
      'cards',
      'settings',
      'training_log',
      'daily_stats',
    ]) {
      if (source.includes(`CREATE TABLE IF NOT EXISTS ${table}`))
        this.tables.add(table);
    }
  }

  async prepareAsync(source: string): Promise<SQLiteStatementLike> {
    this.prepared.push(source);
    return {
      executeAsync: async <T>(params?: SQLiteParams) => {
        const out = this.execute<T>(source, arr(params));
        return new Result<T>(out.rows, out.changes);
      },
      finalizeAsync: async () => undefined,
    };
  }

  private execute<T>(
    source: string,
    p: (string | number | null | undefined)[],
  ): { rows: T[]; changes: number } {
    if (source.startsWith('INSERT INTO cards')) {
      this.cards.push({
        id: p[0] as string,
        word: p[1] as string,
        translation: p[2] as string,
        phonetic: p[3] as string | null,
        gram_class: p[4] as string | null,
        lang_from: p[5] as string,
        lang_to: p[6] as string,
        status: p[7] as string,
        correct_streak: p[8] as number,
        times_trained: p[9] as number,
        times_correct: p[10] as number,
        times_wrong: p[11] as number,
        created_at: p[12] as string,
        last_trained_at: p[13] as string | null,
      });
      return { rows: [], changes: 1 };
    }
    if (source.startsWith('SELECT * FROM cards WHERE id'))
      return {
        rows: this.cards.filter((c) => c.id === p[0]) as T[],
        changes: 0,
      };
    if (source.startsWith('SELECT * FROM cards WHERE status'))
      return {
        rows: this.cards
          .filter((c) => c.status === p[0])
          .sort(createdDesc) as T[],
        changes: 0,
      };
    if (source.startsWith('SELECT * FROM cards ORDER'))
      return { rows: [...this.cards].sort(createdDesc) as T[], changes: 0 };
    if (source.startsWith('UPDATE cards SET')) {
      const id = p[13];
      const i = this.cards.findIndex((c) => c.id === id);
      if (i >= 0)
        this.cards[i] = {
          id: id as string,
          word: p[0] as string,
          translation: p[1] as string,
          phonetic: p[2] as string | null,
          gram_class: p[3] as string | null,
          lang_from: p[4] as string,
          lang_to: p[5] as string,
          status: p[6] as string,
          correct_streak: p[7] as number,
          times_trained: p[8] as number,
          times_correct: p[9] as number,
          times_wrong: p[10] as number,
          created_at: p[11] as string,
          last_trained_at: p[12] as string | null,
        };
      return { rows: [], changes: i >= 0 ? 1 : 0 };
    }
    if (source.startsWith('DELETE FROM cards')) {
      const before = this.cards.length;
      this.cards = this.cards.filter((c) => c.id !== p[0]);
      return { rows: [], changes: before - this.cards.length };
    }
    if (
      source.includes('COUNT(*) as cards_trained') &&
      source.includes('FROM training_log')
    ) {
      const date = String(p[0]);
      const logs = this.trainingLog.filter(
        (r) => String(r.trained_at).slice(0, 10) === date,
      );
      return {
        rows: [
          {
            cards_trained: logs.length,
            cards_correct: logs.filter((r) => r.result === 'correct').length,
          },
        ] as T[],
        changes: 0,
      };
    }
    if (
      source.includes(
        'SELECT DISTINCT substr(trained_at, 1, 10) as date FROM training_log',
      )
    ) {
      const dates = [
        ...new Set(
          this.trainingLog.map((r) => String(r.trained_at).slice(0, 10)),
        ),
      ].sort();
      return { rows: dates.map((date) => ({ date })) as T[], changes: 0 };
    }
    if (
      source.includes('FROM training_log') &&
      source.includes("result = 'wrong'")
    ) {
      return {
        rows: [
          {
            wrong: this.trainingLog.filter((r) => r.result === 'wrong').length,
            almost: this.trainingLog.filter((r) => r.result === 'almost')
              .length,
            correct: this.trainingLog.filter((r) => r.result === 'correct')
              .length,
          },
        ] as T[],
        changes: 0,
      };
    }
    if (source.startsWith('SELECT COUNT'))
      return {
        rows: [
          { count: this.cards.filter((c) => c.status === p[0]).length },
        ] as T[],
        changes: 0,
      };
    if (source.startsWith('SELECT key'))
      return {
        rows: [...this.settings.entries()].map(([key, value]) => ({
          key,
          value,
        })) as T[],
        changes: 0,
      };
    if (source.startsWith('INSERT OR REPLACE INTO settings')) {
      this.settings.set(String(p[0]), String(p[1]));
      return { rows: [], changes: 1 };
    }
    if (source.startsWith('INSERT INTO training_log')) {
      this.trainingLog.push({
        id: p[0] as string,
        card_id: p[1] as string,
        result: p[2] as string,
        trained_at: p[3] as string,
      });
      return { rows: [], changes: 1 };
    }
    if (source.startsWith('SELECT * FROM daily_stats WHERE date'))
      return {
        rows: this.dailyStats.filter((r) => r.date === p[0]) as T[],
        changes: 0,
      };
    if (source.startsWith('SELECT * FROM daily_stats ORDER'))
      return {
        rows: [...this.dailyStats].sort((a, b) =>
          String(a.date).localeCompare(String(b.date)),
        ) as T[],
        changes: 0,
      };
    if (source.startsWith('INSERT OR REPLACE INTO daily_stats')) {
      this.dailyStats = this.dailyStats.filter((r) => r.date !== p[0]);
      this.dailyStats.push({
        date: p[0] as string,
        cards_trained: p[1] as number,
        cards_correct: p[2] as number,
        goal_met: p[3] as number,
      });
      return { rows: [], changes: 1 };
    }
    return { rows: [], changes: 0 };
  }
}

function createdDesc(a: Row, b: Row) {
  return String(b.created_at).localeCompare(String(a.created_at));
}
