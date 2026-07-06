import { TranslationCacheRepository } from '../src/db/TranslationCacheRepository';
import {
  DeepLTranslationService,
  getTranslationApiKey,
} from '../src/services/TranslationService';
import { TranslationError } from '../src/services/TranslationService.types';
import { FakeDb } from './helpers/fakeDb';

describe('TranslationService', () => {
  const setup = (fetchImpl = jest.fn()) => {
    const cache = new TranslationCacheRepository(new FakeDb());
    const service = new DeepLTranslationService({
      cache,
      apiKey: 'key',
      fetchImpl: fetchImpl as typeof fetch,
      timeoutMs: 50,
    });
    return { service, fetchImpl, cache };
  };

  it('translates through DeepL and writes cache', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: 'olá' }] }),
    });
    const { service, cache } = setup(fetchImpl);

    await expect(service.translate('bonjour', 'fr', 'pt')).resolves.toEqual({
      translation: 'olá',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await expect(cache.get('BONJOUR', 'fr', 'pt')).resolves.toEqual({
      translation: 'olá',
      phonetic: undefined,
      gramClass: undefined,
    });
  });

  it('uses cache hit without fetch', async () => {
    const { service, fetchImpl, cache } = setup(jest.fn());
    await cache.set('bonjour', 'fr', 'pt', { translation: 'olá' });

    await expect(service.translate(' BONJOUR ', 'fr', 'pt')).resolves.toEqual({
      translation: 'olá',
      phonetic: undefined,
      gramClass: undefined,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws typed HTTP errors', async () => {
    const { service } = setup(
      jest
        .fn()
        .mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }),
    );

    await expect(
      service.translate('bonjour', 'fr', 'pt'),
    ).rejects.toMatchObject({
      code: 'http',
      status: 429,
    });
  });

  it('throws typed timeout errors', async () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    const fetchImpl = jest.fn().mockRejectedValue(error);
    const { service } = setup(fetchImpl);

    await expect(
      service.translate('bonjour', 'fr', 'pt'),
    ).rejects.toMatchObject({
      code: 'timeout',
    });
  });

  it('throws config error when key is missing and no cache exists', async () => {
    const service = new DeepLTranslationService({
      cache: new TranslationCacheRepository(new FakeDb()),
      apiKey: '',
      fetchImpl: jest.fn() as typeof fetch,
    });

    await expect(
      service.translate('bonjour', 'fr', 'pt'),
    ).rejects.toBeInstanceOf(TranslationError);
    expect(getTranslationApiKey()).toBeUndefined();
  });
});
