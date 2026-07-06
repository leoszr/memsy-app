import Constants from 'expo-constants';
import { TranslationCacheRepository } from '../db/TranslationCacheRepository';
import { openMemsyDatabase } from '../db';
import {
  TranslationError,
  TranslationResult,
  TranslationService,
} from './TranslationService.types';

type FetchLike = typeof fetch;

type DeepLResponse = {
  translations?: { text?: string }[];
};

export type DeepLTranslationServiceOptions = {
  cache: TranslationCacheRepository;
  apiKey?: string;
  endpoint?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

const configExtra = (Constants.expoConfig?.extra ?? {}) as Record<
  string,
  string | undefined
>;

export const getTranslationApiKey = () =>
  process.env.EXPO_PUBLIC_DEEPL_API_KEY ??
  process.env.DEEPL_API_KEY ??
  configExtra.deeplApiKey;

function toDeepLLanguage(code: string, role: 'source' | 'target') {
  if (code === 'pt' && role === 'target') return 'PT-BR';
  return code.toUpperCase();
}

export class DeepLTranslationService implements TranslationService {
  private readonly endpoint: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(private readonly options: DeepLTranslationServiceOptions) {
    this.endpoint =
      options.endpoint ?? 'https://api-free.deepl.com/v2/translate';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8000;
  }

  async translate(
    word: string,
    from: string,
    to: string,
  ): Promise<TranslationResult> {
    const cleanWord = word.trim();
    if (!cleanWord) throw new TranslationError('Palavra vazia.', 'empty');

    const cached = await this.options.cache.get(cleanWord, from, to);
    if (cached) return cached;

    const apiKey = this.options.apiKey ?? getTranslationApiKey();
    if (!apiKey) {
      throw new TranslationError(
        'Configure EXPO_PUBLIC_DEEPL_API_KEY no .env para traduzir.',
        'config',
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const body = new URLSearchParams({
        text: cleanWord,
        source_lang: toDeepLLanguage(from, 'source'),
        target_lang: toDeepLLanguage(to, 'target'),
      }).toString();
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new TranslationError(
          `Falha na tradução (HTTP ${response.status}).`,
          'http',
          response.status,
        );
      }
      const data = (await response.json()) as DeepLResponse;
      const translation = data.translations?.[0]?.text?.trim();
      if (!translation) {
        throw new TranslationError('Tradução vazia.', 'empty');
      }
      const result = { translation };
      await this.options.cache.set(cleanWord, from, to, result);
      return result;
    } catch (error) {
      if (error instanceof TranslationError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TranslationError('Tempo de tradução esgotado.', 'timeout');
      }
      throw new TranslationError('Erro de rede na tradução.', 'network');
    } finally {
      clearTimeout(timer);
    }
  }
}

let singleton: Promise<TranslationService> | null = null;

export function getDefaultTranslationService(): Promise<TranslationService> {
  if (!singleton) {
    singleton = openMemsyDatabase()
      .then(
        (db) =>
          new DeepLTranslationService({
            cache: new TranslationCacheRepository(db),
          }),
      )
      .catch((error) => {
        singleton = null;
        throw error;
      });
  }
  return singleton;
}
