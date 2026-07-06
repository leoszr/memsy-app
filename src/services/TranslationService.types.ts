export type TranslationResult = {
  translation: string;
  phonetic?: string;
  gramClass?: string;
};

export type TranslationService = {
  translate(word: string, from: string, to: string): Promise<TranslationResult>;
};

export class TranslationError extends Error {
  constructor(
    message: string,
    readonly code: 'config' | 'timeout' | 'network' | 'http' | 'empty',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}
