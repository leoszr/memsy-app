import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { getLocalDate, ResultCounts } from '../logic/progress';
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
  dailyStats: DailyStat[];
  resultCounts: ResultCounts;
  hydrated: boolean;
  highlightCardId: string | null;
  hydrate(): Promise<void>;
  setHighlightCardId(id: string | null): void;
  refreshProgress(): Promise<void>;
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

const today = () => getLocalDate();

export function createMemsyStore(repos: Repositories) {
  const cardsBeingCreated = new Set<string>();
  const trainingBeingRecorded = new Set<string>();

  return createStore<MemsyState>((set, get) => ({
    cards: [],
    settings: {},
    todayStats: null,
    dailyStats: [],
    resultCounts: { wrong: 0, almost: 0, correct: 0 },
    hydrated: false,
    highlightCardId: null,
    setHighlightCardId(id) {
      set({ highlightCardId: id });
    },
    async hydrate() {
      const settings = await repos.settings.getAll();
      const dailyGoal = Number(settings.dailyGoal ?? 10);
      await repos.training.rebuildDailyStats(dailyGoal);
      const xp = await repos.training.calculateTotalXP();
      await repos.settings.set('xp', String(xp));
      const [cards, todayStats, dailyStats, resultCounts] = await Promise.all([
        repos.cards.getAll(),
        repos.training.getDailyStat(today()),
        repos.training.getDailyStats(),
        repos.training.getResultCounts(),
      ]);
      set({
        cards,
        settings: { ...settings, xp: String(xp) },
        todayStats,
        dailyStats,
        resultCounts,
        hydrated: true,
      });
    },
    async refreshProgress() {
      const dailyGoal = Number(get().settings.dailyGoal ?? 10);
      await repos.training.rebuildDailyStats(dailyGoal);
      const [dailyStats, todayStats, resultCounts] = await Promise.all([
        repos.training.getDailyStats(),
        repos.training.getDailyStat(today()),
        repos.training.getResultCounts(),
      ]);
      set({ dailyStats, todayStats, resultCounts });
    },
    async addCard(input) {
      const key = [
        input.word.trim().toLocaleLowerCase(),
        input.langFrom,
        input.langTo,
      ].join(':');
      if (cardsBeingCreated.has(key))
        throw new Error('Este card já está sendo salvo.');

      cardsBeingCreated.add(key);
      try {
        const card = await repos.cards.create(input);
        set({ cards: [card, ...get().cards] });
        return card;
      } finally {
        cardsBeingCreated.delete(key);
      }
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
      if (trainingBeingRecorded.has(cardId))
        throw new Error('Esta resposta já está sendo registrada.');
      trainingBeingRecorded.add(cardId);
      try {
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
        const [dailyStats, resultCounts] = await Promise.all([
          repos.training.getDailyStats(),
          repos.training.getResultCounts(),
        ]);
        await repos.settings.set('xp', String(xp));
        set({
          cards: get().cards.map((c) => (c.id === cardId ? updated : c)),
          todayStats,
          dailyStats,
          resultCounts,
          settings: { ...get().settings, xp: String(xp) },
        });
      } finally {
        trainingBeingRecorded.delete(cardId);
      }
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

export function getMemsyStore(): MemsyStore {
  if (!store) throw new Error('Memsy store not configured');
  return store;
}

export function useMemsyStore<T>(selector: (state: MemsyState) => T): T {
  if (!store) throw new Error('Memsy store not configured');
  return useStore(store, selector);
}
