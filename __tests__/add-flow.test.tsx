/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Add from '../app/(tabs)/add';
import {
  CardRepository,
  SettingsRepository,
  TrainingRepository,
} from '../src/db';
import { configureMemsyStore } from '../src/store/useMemsyStore';
import { FakeDb } from './helpers/fakeDb';

const mockTranslate = jest.fn();
const mockPush = jest.fn();

jest.mock('../src/services/TranslationService', () => ({
  getDefaultTranslationService: jest.fn(async () => ({
    translate: mockTranslate,
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(async () => 'merci'),
}));
jest.mock('expo-speech', () => ({ speak: jest.fn() }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'Light' },
  NotificationFeedbackType: { Success: 'Success' },
}));

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  const chain = {
    onUpdate: () => chain,
    onEnd: () => chain,
  };
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    Gesture: { Pan: () => chain },
    GestureHandlerRootView: View,
  };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: unknown) => component,
    },
    interpolate: (_value: number, _input: number[], output: number[]) =>
      output[0],
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withRepeat: (value: unknown) => value,
    withSpring: (value: unknown, _config?: unknown, callback?: () => void) => {
      callback?.();
      return value;
    },
    withTiming: (value: unknown, _config?: unknown, callback?: () => void) => {
      callback?.();
      return value;
    },
  };
});

function setupStore() {
  const db = new FakeDb();
  const store = configureMemsyStore({
    cards: new CardRepository(db),
    settings: new SettingsRepository(db),
    training: new TrainingRepository(db),
  });
  store.setState({
    hydrated: true,
    settings: {
      nativeLanguage: 'pt',
      learningLanguages: '["fr"]',
      activeLearningLanguage: 'fr',
      activeLangFrom: 'fr',
      activeLangTo: 'pt',
    },
  });
  return { db, store };
}

describe('add capture flow', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    mockPush.mockReset();
  });

  it('translates a word, renders the card, and saves it as new', async () => {
    const { db } = setupStore();
    mockTranslate.mockResolvedValue({
      translation: 'olá / bom dia',
      phonetic: '/bɔ̃.ʒuʁ/',
      gramClass: 'subst. masc.',
    });
    const screen = await render(<Add />);

    await fireEvent.changeText(screen.getByTestId('word-input'), 'bonjour');
    await fireEvent.press(screen.getByRole('button', { name: 'TRADUZIR ✦' }));

    await waitFor(() => expect(screen.getByText('olá / bom dia')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar card' }));

    await waitFor(() => expect(db.cards).toHaveLength(1));
    expect(db.cards[0]).toMatchObject({
      word: 'bonjour',
      translation: 'olá / bom dia',
      status: 'new',
      lang_from: 'fr',
      lang_to: 'pt',
    });
  });

  it('blocks duplicate words in the same language pair', async () => {
    const { db, store } = setupStore();
    await store.getState().addCard({
      word: 'Bonjour',
      translation: 'olá',
      langFrom: 'fr',
      langTo: 'pt',
    });
    const screen = await render(<Add />);

    await fireEvent.changeText(screen.getByTestId('word-input'), ' bonjour ');
    await fireEvent.press(screen.getByRole('button', { name: 'TRADUZIR ✦' }));

    expect(
      screen.getAllByText('Você já tem esse card!').length,
    ).toBeGreaterThan(0);
    expect(mockTranslate).not.toHaveBeenCalled();
    expect(db.cards).toHaveLength(1);
  });
});
