import { SQLiteDatabaseLike, SQLiteParams } from './types';

export async function execute<T>(
  db: SQLiteDatabaseLike,
  source: string,
  params: SQLiteParams = [],
): Promise<T[]> {
  const statement = await db.prepareAsync(source);
  try {
    const result = await statement.executeAsync<T>(params);
    return await result.getAllAsync();
  } finally {
    await statement.finalizeAsync();
  }
}

export async function first<T>(
  db: SQLiteDatabaseLike,
  source: string,
  params: SQLiteParams = [],
): Promise<T | null> {
  const statement = await db.prepareAsync(source);
  try {
    const result = await statement.executeAsync<T>(params);
    return await result.getFirstAsync();
  } finally {
    await statement.finalizeAsync();
  }
}

export async function run(
  db: SQLiteDatabaseLike,
  source: string,
  params: SQLiteParams = [],
) {
  const statement = await db.prepareAsync(source);
  try {
    return await statement.executeAsync(params);
  } finally {
    await statement.finalizeAsync();
  }
}
