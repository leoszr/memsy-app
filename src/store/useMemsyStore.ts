import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { Card, DailyStat, Settings, TrainingResult } from '../logic/types';
import { nextCardState } from '../logic';
import { CardRepository, NewCardInput } from '../db/CardRepository';
import { SettingsRepository } from '../db/SettingsRepository';
import { TrainingRepository } from '../db/TrainingRepository';

type Repositories = {
  cards: CardRepository;
  settings: SettingsRepository;
  training: TrainingRepository;
};

export type MemsyState = {
  cards: Card[];
  settings: Settings;
  todayStats: DailyStat | null;
  hydrated: boolean;
  hydrate(): Promise<void>;
  addCard(input: NewCardInput): Promise<Card>;
  saveCard(card: Card): Promise<void>;
  discardCard(id: string): Promise<void>;
  recordTrainingResult(
    cardId: string,
    result: TrainingResult,
    trainedAt?: string,
  ): Promise<void>;
  updateSettings(settings: Settings): Promise<void>;
};

const today = () => new Date().toISOString().slice(0, 10);

export function createMemsyStore(repos: Repositories) {
  return createStore<MemsyState>((set, get) => ({
    cards: [],
    settings: {},
    todayStats: null,
    hydrated: false,
    async hydrate() {
      const settings = await repos.settings.getAll();
      const dailyGoal = Number(settings.dailyGoal ?? 10);
      await repos.training.rebuildDailyStats(dailyGoal);
      const xp = await repos.training.calculateTotalXP();
      await repos.settings.set('xp', String(xp));
      const [cards, todayStats] = await Promise.all([
        repos.cards.getAll(),
        repos.training.getDailyStat(today()),
      ]);
      set({
        cards,
        settings: { ...settings, xp: String(xp) },
        todayStats,
        hydrated: true,
      });
    },
    async addCard(input) {
      const card = await repos.cards.create(input);
      set({ cards: [card, ...get().cards] });
      return card;
    },
    async saveCard(card) {
      await repos.cards.update(card);
      set({ cards: get().cards.map((c) => (c.id === card.id ? card : c)) });
    },
    async discardCard(id) {
      await repos.cards.delete(id);
      set({ cards: get().cards.filter((c) => c.id !== id) });
    },
    async recordTrainingResult(
      cardId,
      result,
      trainedAt = new Date().toISOString(),
    ) {
      const existing =
        get().cards.find((c) => c.id === cardId) ??
        (await repos.cards.getById(cardId));
      if (!existing) throw new Error(`Card not found: ${cardId}`);
      const updated = nextCardState(existing, result, trainedAt);
      const dailyGoal = Number(get().settings.dailyGoal ?? 10);
      await repos.cards.update(updated);
      await repos.training.log(cardId, result, trainedAt);
      const todayStats = await repos.training.recalculateDailyStat(
        trainedAt,
        dailyGoal,
      );
      const xp = await repos.training.calculateTotalXP();
      await repos.settings.set('xp', String(xp));
      set({
        cards: get().cards.map((c) => (c.id === cardId ? updated : c)),
        todayStats,
        settings: { ...get().settings, xp: String(xp) },
      });
    },
    async updateSettings(settings) {
      await repos.settings.setMany(settings);
      set({ settings: { ...get().settings, ...settings } });
    },
  }));
}

export type MemsyStore = ReturnType<typeof createMemsyStore>;

let store: MemsyStore | null = null;
export function configureMemsyStore(repos: Repositories): MemsyStore {
  store = createMemsyStore(repos);
  return store;
}

export function useMemsyStore<T>(selector: (state: MemsyState) => T): T {
  if (!store) throw new Error('Memsy store not configured');
  return useStore(store, selector);
}
