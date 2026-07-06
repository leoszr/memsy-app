import { SQLiteDatabaseLike } from './types';

export const MIGRATIONS = [
  {
    version: 1,
    sql: `
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY NOT NULL,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  phonetic TEXT,
  gram_class TEXT,
  lang_from TEXT NOT NULL,
  lang_to TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('new','training','mastered')),
  correct_streak INTEGER NOT NULL DEFAULT 0,
  times_trained INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_wrong INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_trained_at TEXT,
  UNIQUE(word, lang_from, lang_to)
);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS training_log (
  id TEXT PRIMARY KEY NOT NULL,
  card_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('wrong','almost','correct')),
  trained_at TEXT NOT NULL,
  FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS daily_stats (
  date TEXT PRIMARY KEY NOT NULL,
  cards_trained INTEGER NOT NULL DEFAULT 0,
  cards_correct INTEGER NOT NULL DEFAULT 0,
  goal_met INTEGER NOT NULL DEFAULT 0
);
`,
  },
  {
    version: 2,
    sql: `
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_word_pair_nocase
ON cards(word COLLATE NOCASE, lang_from, lang_to);
`,
  },
  {
    version: 3,
    sql: `
CREATE TABLE IF NOT EXISTS translation_cache (
  word TEXT NOT NULL,
  lang_from TEXT NOT NULL,
  lang_to TEXT NOT NULL,
  translation TEXT NOT NULL,
  phonetic TEXT,
  gram_class TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (word, lang_from, lang_to)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_cache_word_pair_nocase
ON translation_cache(word COLLATE NOCASE, lang_from, lang_to);
`,
  },
];

export async function runMigrations(db: SQLiteDatabaseLike): Promise<void> {
  await db.execAsync(
    'PRAGMA foreign_keys = ON; CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL);',
  );
  for (const migration of MIGRATIONS) {
    await db.execAsync(
      `BEGIN; ${migration.sql} INSERT OR IGNORE INTO migrations(version, applied_at) VALUES (${migration.version}, '${new Date().toISOString()}'); COMMIT;`,
    );
  }
}
