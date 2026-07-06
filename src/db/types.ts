export type SQLiteValue = string | number | null | undefined;
export type SQLiteParams = SQLiteValue[] | Record<string, SQLiteValue>;

export type SQLiteExecuteResult<T> = {
  lastInsertRowId: number;
  changes: number;
  getFirstAsync(): Promise<T | null>;
  getAllAsync(): Promise<T[]>;
};

export type SQLiteStatementLike = {
  executeAsync<T>(params: SQLiteParams): Promise<SQLiteExecuteResult<T>>;
  finalizeAsync(): Promise<void>;
};

export type SQLiteDatabaseLike = {
  execAsync(source: string): Promise<void>;
  prepareAsync(source: string): Promise<SQLiteStatementLike>;
};
