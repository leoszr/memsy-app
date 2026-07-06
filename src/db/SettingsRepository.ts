import { Settings } from '../logic/types';
import { execute, run } from './sql';
import { SQLiteDatabaseLike } from './types';

export class SettingsRepository {
  constructor(private readonly db: SQLiteDatabaseLike) {}
  async getAll(): Promise<Settings> {
    const rows = await execute<{ key: string; value: string }>(
      this.db,
      'SELECT key, value FROM settings',
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
  async set(key: string, value: string): Promise<void> {
    await run(
      this.db,
      'INSERT OR REPLACE INTO settings(key, value) VALUES (?, ?)',
      [key, value],
    );
  }
  async setMany(settings: Settings): Promise<void> {
    for (const [key, value] of Object.entries(settings))
      await this.set(key, value);
  }
}
