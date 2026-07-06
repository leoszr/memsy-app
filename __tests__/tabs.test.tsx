/* eslint-disable @typescript-eslint/no-require-imports, import/first, react/display-name */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: require('react-native').View,
    createAnimatedComponent: (component: unknown) => component,
  },
  useSharedValue: (value: unknown) => ({ value }),
  useAnimatedStyle: (factory: () => unknown) => factory(),
  withRepeat: (value: unknown) => value,
  withTiming: (value: unknown) => value,
}));
import TabLayout from '../app/(tabs)/_layout';
import Add from '../app/(tabs)/add';
import Cards from '../app/(tabs)/cards';
import Train from '../app/(tabs)/train';
import Progress from '../app/(tabs)/progress';

import {
  CardRepository,
  SettingsRepository,
  TrainingRepository,
} from '../src/db';
import { configureMemsyStore } from '../src/store/useMemsyStore';
import { FakeDb } from './helpers/fakeDb';

function configureUiStore() {
  const db = new FakeDb();
  db.settings.set('nativeLanguage', 'pt');
  db.settings.set('learningLanguages', '["fr"]');
  db.settings.set('activeLearningLanguage', 'fr');
  configureMemsyStore({
    cards: new CardRepository(db),
    settings: new SettingsRepository(db),
    training: new TrainingRepository(db),
  });
}

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  function Tabs({ children }: { children: React.ReactNode }) {
    return <View accessibilityRole="tablist">{children}</View>;
  }

  Tabs.Screen = ({ options }: { options: { title: string } }) => (
    <Text accessibilityRole="tab">{options.title}</Text>
  );

  return { Tabs };
});

describe('Sprint 0 tabs', () => {
  it('renders the tab bar with four tabs', async () => {
    const { getByRole } = await render(<TabLayout />);

    expect(getByRole('tab', { name: 'Adicionar' })).toBeTruthy();
    expect(getByRole('tab', { name: 'Cards' })).toBeTruthy();
    expect(getByRole('tab', { name: 'Treinar' })).toBeTruthy();
    expect(getByRole('tab', { name: 'Progresso' })).toBeTruthy();
  });

  it('renders each initial tab screen without crashing', async () => {
    configureUiStore();
    expect((await render(<Add />)).getByText('Nova palavra ✦')).toBeTruthy();
    expect((await render(<Cards />)).getByText('Meus Cards')).toBeTruthy();
    expect((await render(<Train />)).getByText('Treinar')).toBeTruthy();
    expect((await render(<Progress />)).getByText('Progresso')).toBeTruthy();
  });
});
