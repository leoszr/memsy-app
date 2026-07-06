/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Onboarding from '../app/onboarding';
import {
  getInitialRoute,
  parseLearningLanguages,
  setActiveLearningLanguage,
} from '../src/logic';
import { getLanguage, LANGUAGES } from '../src/logic/languages';
import {
  CardRepository,
  SettingsRepository,
  TrainingRepository,
} from '../src/db';
import { configureMemsyStore } from '../src/store/useMemsyStore';
import { FakeDb } from './helpers/fakeDb';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: unknown) => component,
    },
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withSpring: (value: unknown) => value,
    withTiming: (value: unknown) => value,
  };
});

function setupStore() {
  const db = new FakeDb();
  const store = configureMemsyStore({
    cards: new CardRepository(db),
    settings: new SettingsRepository(db),
    training: new TrainingRepository(db),
  });
  return { db, store };
}

describe('onboarding logic', () => {
  it('routes to onboarding until languages are configured', () => {
    expect(getInitialRoute({})).toBe('onboarding');
    expect(
      getInitialRoute({ nativeLanguage: 'pt', learningLanguages: '["fr"]' }),
    ).toBe('tabs');
    expect(
      getInitialRoute({ nativeLanguage: 'pt', learningLanguages: '[]' }),
    ).toBe('onboarding');
    expect(
      getInitialRoute({ nativeLanguage: 'pt', learningLanguages: '[123]' }),
    ).toBe('onboarding');
  });

  it('defines supported languages and finds them by code', () => {
    expect(LANGUAGES.map((language) => language.code)).toEqual([
      'pt',
      'en',
      'es',
      'fr',
      'de',
      'it',
    ]);
    expect(getLanguage('fr')?.name).toBe('Français');
    expect(getLanguage('xx')).toBeUndefined();
  });

  it('updates active learning language only when allowed', () => {
    const settings = {
      nativeLanguage: 'pt',
      learningLanguages: '["fr","en"]',
      activeLearningLanguage: 'fr',
    };
    expect(setActiveLearningLanguage(settings, 'en')).toMatchObject({
      activeLearningLanguage: 'en',
      activeLangFrom: 'en',
      activeLangTo: 'pt',
    });
    expect(setActiveLearningLanguage(settings, 'de')).toEqual({});
    expect(parseLearningLanguages('bad')).toEqual([]);
  });
});

describe('onboarding flow', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('selects native language, hides it on step 2, persists learning settings', async () => {
    const { db } = setupStore();
    const screen = await render(<Onboarding />);

    expect(screen.getByText('Qual é a sua língua nativa?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Português' }));
    await fireEvent.press(screen.getByRole('button', { name: 'CONTINUAR →' }));

    expect(screen.getByText('O que você quer aprender?')).toBeTruthy();
    expect(screen.queryByText('Português')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Français' }));
    await fireEvent.press(screen.getByRole('button', { name: 'English' }));
    await fireEvent.press(screen.getByRole('button', { name: 'COMEÇAR! →' }));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/add'),
    );
    expect(db.settings.get('nativeLanguage')).toBe('pt');
    expect(db.settings.get('learningLanguages')).toBe('["fr","en"]');
    expect(db.settings.get('activeLearningLanguage')).toBe('fr');
  });
});
