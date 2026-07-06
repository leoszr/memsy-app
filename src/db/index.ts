import { runMigrations } from './migrations';
import { SQLiteDatabaseLike } from './types';
export * from './CardRepository';
export * from './SettingsRepository';
export * from './TrainingRepository';
export * from './TranslationCacheRepository';
export * from './migrations';
export * from './types';

const dbPromises = new Map<string, Promise<SQLiteDatabaseLike>>();

export async function openMemsyDatabase(
  name = 'memsy.db',
): Promise<SQLiteDatabaseLike> {
  const existing = dbPromises.get(name);
  if (existing) return existing;

  const promise = import('expo-sqlite')
    .then(async ({ openDatabaseAsync }) => {
      const db = (await openDatabaseAsync(
        name,
      )) as unknown as SQLiteDatabaseLike;
      await runMigrations(db);
      return db;
    })
    .catch((error) => {
      dbPromises.delete(name);
      throw error;
    });
  dbPromises.set(name, promise);
  return promise;
}
