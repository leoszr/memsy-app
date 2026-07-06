import { TranslationResult } from '../services/TranslationService.types';
import { first, run } from './sql';
import { SQLiteDatabaseLike } from './types';

type CacheRow = {
  word: string;
  lang_from: string;
  lang_to: string;
  translation: string;
  phonetic: string | null;
  gram_class: string | null;
};

export class TranslationCacheRepository {
  constructor(private readonly db: SQLiteDatabaseLike) {}

  async get(
    word: string,
    langFrom: string,
    langTo: string,
  ): Promise<TranslationResult | null> {
    const row = await first<CacheRow>(
      this.db,
      `SELECT * FROM translation_cache
       WHERE word = ? COLLATE NOCASE AND lang_from = ? AND lang_to = ?`,
      [word.trim(), langFrom, langTo],
    );
    return row
      ? {
          translation: row.translation,
          phonetic: row.phonetic ?? undefined,
          gramClass: row.gram_class ?? undefined,
        }
      : null;
  }

  async set(
    word: string,
    langFrom: string,
    langTo: string,
    result: TranslationResult,
  ): Promise<void> {
    await run(
      this.db,
      `INSERT OR REPLACE INTO translation_cache
       (word, lang_from, lang_to, translation, phonetic, gram_class, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        word.trim(),
        langFrom,
        langTo,
        result.translation,
        result.phonetic ?? null,
        result.gramClass ?? null,
        new Date().toISOString(),
      ],
    );
  }
}
