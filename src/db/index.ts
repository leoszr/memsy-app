import { runMigrations } from './migrations';
import { SQLiteDatabaseLike } from './types';
export * from './CardRepository';
export * from './SettingsRepository';
export * from './TrainingRepository';
export * from './migrations';
export * from './types';

export async function openMemsyDatabase(
  name = 'memsy.db',
): Promise<SQLiteDatabaseLike> {
  const { openDatabaseAsync } = await import('expo-sqlite');
  const db = await openDatabaseAsync(name);
  await runMigrations(db as unknown as SQLiteDatabaseLike);
  return db as unknown as SQLiteDatabaseLike;
}
