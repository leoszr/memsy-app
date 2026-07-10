/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import Train from '../app/(tabs)/train';
import {
  CardRepository,
  SettingsRepository,
  TrainingRepository,
} from '../src/db';
import { configureMemsyStore } from '../src/store/useMemsyStore';
import { FakeDb } from './helpers/fakeDb';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  cancelScheduledNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('reminder-id')),
}));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: unknown) => component,
    },
    ReduceMotion: { System: 'system' },
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withSpring: (value: unknown) => value,
    withTiming: (value: unknown) => value,
  };
});

async function setupStore() {
  const db = new FakeDb();
  const store = configureMemsyStore({
    cards: new CardRepository(db),
    settings: new SettingsRepository(db),
    training: new TrainingRepository(db),
  });
  store.setState({ hydrated: true, settings: { dailyGoal: '3' } });
  await store.getState().addCard({
    id: '1',
    word: 'bonjour',
    translation: 'olá',
    langFrom: 'fr',
    langTo: 'pt',
  });
  await store.getState().addCard({
    id: '2',
    word: 'merci',
    translation: 'obrigado',
    langFrom: 'fr',
    langTo: 'pt',
  });
  await store.getState().addCard({
    id: '3',
    word: 'chat',
    translation: 'gato',
    langFrom: 'fr',
    langTo: 'pt',
  });
  return { db, store };
}

describe('training flow', () => {
  beforeEach(() => mockPush.mockReset());

  it('finishes a 3-card session, logs answers and marks daily goal', async () => {
    const { db } = await setupStore();
    const screen = await render(<Train />);

    fireEvent.press(screen.getByRole('button', { name: 'COMEÇAR TREINO →' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'REVELAR ✦' })).toBeTruthy(),
    );
    for (let i = 0; i < 3; i += 1) {
      fireEvent.press(screen.getByRole('button', { name: 'REVELAR ✦' }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'ACERTEI' })).toBeTruthy(),
      );
      await act(async () => {
        fireEvent.press(screen.getByRole('button', { name: 'ACERTEI' }));
      });
      if (i < 2)
        await waitFor(() =>
          expect(
            screen.getByRole('button', { name: 'REVELAR ✦' }),
          ).toBeTruthy(),
        );
    }

    await waitFor(() =>
      expect(screen.getByText('Sessão completa!')).toBeTruthy(),
    );
    expect(db.trainingLog).toHaveLength(3);
    expect(db.dailyStats[0]).toMatchObject({
      cards_trained: 3,
      cards_correct: 3,
      goal_met: 1,
    });
  });

  it('records only one result for two answer taps in the same frame', async () => {
    const { db } = await setupStore();
    const screen = await render(<Train />);

    fireEvent.press(screen.getByRole('button', { name: 'COMEÇAR TREINO →' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'REVELAR ✦' })).toBeTruthy(),
    );
    fireEvent.press(screen.getByRole('button', { name: 'REVELAR ✦' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'ACERTEI' })).toBeTruthy(),
    );

    fireEvent.press(screen.getByRole('button', { name: 'ACERTEI' }));
    fireEvent.press(screen.getByRole('button', { name: 'ACERTEI' }));

    await waitFor(() => expect(db.trainingLog).toHaveLength(1));
  });
});
