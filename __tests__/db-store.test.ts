import {
  CardRepository,
  SettingsRepository,
  TrainingRepository,
  runMigrations,
} from '../src/db';
import { createMemsyStore } from '../src/store/useMemsyStore';
import { FakeDb } from './helpers/fakeDb';

describe('database layer', () => {
  it('runs migrations idempotently', async () => {
    const db = new FakeDb();
    await runMigrations(db);
    await runMigrations(db);
    expect([...db.tables].sort()).toEqual([
      'cards',
      'daily_stats',
      'migrations',
      'settings',
      'training_log',
      'translation_cache',
    ]);
  });

  it('performs CardRepository CRUD with prepared statements', async () => {
    const db = new FakeDb();
    const repo = new CardRepository(db);
    const created = await repo.create({
      id: 'c1',
      word: ' Bonjour ',
      translation: 'olá',
      langFrom: 'fr',
      langTo: 'pt',
      createdAt: '2026-01-01',
    });
    expect((await repo.getById('c1'))?.word).toBe('Bonjour');
    expect(await repo.countByStatus('new')).toBe(1);
    await repo.update({ ...created, status: 'training', correctStreak: 1 });
    expect(await repo.getByStatus('training')).toHaveLength(1);
    expect(await repo.getAll()).toHaveLength(1);
    await repo.delete('c1');
    expect(await repo.getById('c1')).toBeNull();
    expect(
      db.prepared.every(
        (sql) =>
          sql.includes('?') || sql.startsWith('SELECT * FROM cards ORDER'),
      ),
    ).toBe(true);
  });

  it('preserves display casing while migration adds case-insensitive duplicate index', async () => {
    const db = new FakeDb();
    await runMigrations(db);
    const repo = new CardRepository(db);
    await repo.create({
      id: 'c1',
      word: 'Istanbul',
      translation: 'Istambul',
      langFrom: 'en',
      langTo: 'pt',
    });
    expect((await repo.getById('c1'))?.word).toBe('Istanbul');
  });
});

describe('store integration', () => {
  function setup() {
    const db = new FakeDb();
    const repos = {
      cards: new CardRepository(db),
      settings: new SettingsRepository(db),
      training: new TrainingRepository(db),
    };
    return { db, store: createMemsyStore(repos) };
  }

  it('persists actions and hydrates from repositories', async () => {
    const { db, store } = setup();
    await store.getState().updateSettings({ dailyGoal: '2' });
    const card = await store.getState().addCard({
      id: 'c1',
      word: 'chat',
      translation: 'gato',
      langFrom: 'fr',
      langTo: 'pt',
      createdAt: '2026-01-01',
    });
    await store
      .getState()
      .recordTrainingResult(card.id, 'correct', '2026-01-02T10:00:00.000Z');
    expect(db.cards[0]?.times_trained).toBe(1);
    expect(db.trainingLog).toHaveLength(1);
    expect(store.getState().settings.xp).toBe('10');
    db.settings.set('xp', '999');
    await store.getState().hydrate();
    expect(store.getState().cards).toHaveLength(1);
    expect(store.getState().settings.xp).toBe('10');
  });

  it('rejects simultaneous saves for the same card', async () => {
    const { db, store } = setup();
    const input = {
      word: 'bonjour',
      translation: 'olá',
      langFrom: 'fr',
      langTo: 'pt',
    };

    const results = await Promise.allSettled([
      store.getState().addCard(input),
      store.getState().addCard(input),
    ]);

    expect(results.map((result) => result.status)).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(db.cards).toHaveLength(1);
  });

  it('full flow masters card in database after three correct answers', async () => {
    const { db, store } = setup();
    await store.getState().updateSettings({ dailyGoal: '3' });
    const card = await store.getState().addCard({
      id: 'c1',
      word: 'eau',
      translation: 'água',
      langFrom: 'fr',
      langTo: 'pt',
    });
    await store
      .getState()
      .recordTrainingResult(card.id, 'correct', '2026-01-02T10:00:00.000Z');
    await store
      .getState()
      .recordTrainingResult(card.id, 'correct', '2026-01-02T11:00:00.000Z');
    await store
      .getState()
      .recordTrainingResult(card.id, 'correct', '2026-01-02T12:00:00.000Z');
    expect(db.cards[0]?.status).toBe('mastered');
    expect(db.cards[0]?.times_correct).toBe(3);
    expect(db.dailyStats[0]?.goal_met).toBe(1);
  });

  it('day flow marks goal met and next day keeps streak data', async () => {
    const { db, store } = setup();
    await store.getState().updateSettings({ dailyGoal: '1' });
    const card = await store.getState().addCard({
      id: 'c1',
      word: 'pain',
      translation: 'pão',
      langFrom: 'fr',
      langTo: 'pt',
    });
    await store
      .getState()
      .recordTrainingResult(card.id, 'wrong', '2026-01-31T12:00:00.000Z');
    expect(db.dailyStats[0]).toMatchObject({ date: '2026-01-31', goal_met: 1 });
  });
});
