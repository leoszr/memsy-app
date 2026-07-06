import {
  buildTrainingQueue,
  calculateStreak,
  calculateXP,
  isGoalMet,
  nextCardState,
  seededRandom,
  Card,
  buildWeeklyBars,
  calculateProgressMetrics,
  decideDailyReminder,
  isStreakAtRisk,
} from '../src/logic';

const card = (overrides: Partial<Card> = {}): Card => ({
  id: overrides.id ?? '1',
  word: 'bonjour',
  translation: 'olá',
  phonetic: null,
  gramClass: null,
  langFrom: 'fr',
  langTo: 'pt',
  status: 'new',
  correctStreak: 0,
  timesTrained: 0,
  timesCorrect: 0,
  timesWrong: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastTrainedAt: null,
  ...overrides,
});

describe('progress metrics and reminders', () => {
  it('aggregates real progress metrics from cards and training results', () => {
    expect(
      calculateProgressMetrics(
        [card({ status: 'mastered' }), card({ status: 'training' })],
        { correct: 3, almost: 1, wrong: 2 },
        {
          date: '2026-01-07',
          cardsTrained: 4,
          cardsCorrect: 3,
          goalMet: false,
        },
      ),
    ).toEqual({
      accuracy: 50,
      savedCards: 2,
      masteredCards: 1,
      trainedToday: 4,
    });
  });

  it('builds seven weekly bars ending today', () => {
    const bars = buildWeeklyBars(
      [{ date: '2026-01-07', cardsTrained: 7, cardsCorrect: 5, goalMet: true }],
      '2026-01-07',
    );
    expect(bars).toHaveLength(7);
    expect(bars.at(-1)).toMatchObject({
      date: '2026-01-07',
      cardsTrained: 7,
      isToday: true,
    });
  });

  it('detects streak risk only after 18h with yesterday met and today open', () => {
    const stats = [
      { date: '2026-01-06', cardsTrained: 10, cardsCorrect: 8, goalMet: true },
    ];
    expect(isStreakAtRisk(stats, new Date(2026, 0, 7, 17))).toBe(false);
    expect(isStreakAtRisk(stats, new Date(2026, 0, 7, 18))).toBe(true);
    expect(
      isStreakAtRisk(
        [
          ...stats,
          {
            date: '2026-01-07',
            cardsTrained: 10,
            cardsCorrect: 8,
            goalMet: true,
          },
        ],
        new Date(2026, 0, 7, 20),
      ),
    ).toBe(false);
  });

  it('decides whether to schedule or cancel daily reminder', () => {
    expect(
      decideDailyReminder({ notificationHour: '20' }, null, [
        card({ status: 'training' }),
        card({ status: 'new' }),
      ]),
    ).toEqual({ action: 'schedule', hour: 20, minute: 0, cardsToReview: 2 });
    expect(
      decideDailyReminder(
        {},
        {
          date: '2026-01-07',
          cardsTrained: 10,
          cardsCorrect: 8,
          goalMet: true,
        },
        [],
      ),
    ).toEqual({ action: 'cancel', reason: 'goal-met' });
    expect(
      decideDailyReminder({ notificationsEnabled: 'false' }, null, []),
    ).toEqual({
      action: 'cancel',
      reason: 'disabled',
    });
  });
});

describe('nextCardState', () => {
  it('moves new card to training after first correct', () =>
    expect(nextCardState(card(), 'correct', 't').status).toBe('training'));
  it('increments correct streak', () =>
    expect(
      nextCardState(card({ correctStreak: 1 }), 'correct', 't').correctStreak,
    ).toBe(2));
  it('masters with 3 correct in a row', () =>
    expect(
      nextCardState(
        card({ status: 'training', correctStreak: 2 }),
        'correct',
        't',
      ).status,
    ).toBe('mastered'));
  it('wrong resets streak', () =>
    expect(
      nextCardState(
        card({ status: 'training', correctStreak: 2 }),
        'wrong',
        't',
      ).correctStreak,
    ).toBe(0));
  it('mastered wrong returns to training', () =>
    expect(
      nextCardState(
        card({ status: 'mastered', correctStreak: 3 }),
        'wrong',
        't',
      ).status,
    ).toBe('training'));
  it('almost keeps streak', () =>
    expect(
      nextCardState(
        card({ status: 'training', correctStreak: 2 }),
        'almost',
        't',
      ).correctStreak,
    ).toBe(2));
  it('almost does not master', () =>
    expect(
      nextCardState(
        card({ status: 'training', correctStreak: 2 }),
        'almost',
        't',
      ).status,
    ).toBe('training'));
  it('updates counters and last trained date', () =>
    expect(nextCardState(card(), 'wrong', '2026-01-02').timesWrong).toBe(1));
});

describe('buildTrainingQueue', () => {
  it('prioritizes wrong, new, training oldest, mastered fallback', () => {
    const cards = [
      card({ id: 'm', status: 'mastered' }),
      card({ id: 'n', status: 'new' }),
      card({ id: 'o', status: 'training', lastTrainedAt: '2026-01-01' }),
      card({ id: 'w', status: 'training', timesWrong: 2 }),
    ];
    expect(
      buildTrainingQueue(cards, 4, seededRandom(1)).map((c) => c.id),
    ).toEqual(['w', 'n', 'o', 'm']);
  });
  it('respects session size', () =>
    expect(
      buildTrainingQueue([card({ id: '1' }), card({ id: '2' })], 1),
    ).toHaveLength(1));
  it('uses mastered only as fallback', () =>
    expect(
      buildTrainingQueue(
        [card({ id: 'n' }), card({ id: 'm', status: 'mastered' })],
        1,
      )[0]?.id,
    ).toBe('n'));
  it('shuffles inside priority bands with seed', () => {
    const q = buildTrainingQueue(
      [1, 2, 3, 4].map((n) => card({ id: String(n), status: 'new' })),
      4,
      seededRandom(7),
    ).map((c) => c.id);
    expect(q).not.toEqual(['1', '2', '3', '4']);
  });
});

describe('streak, xp, goal', () => {
  it('counts perfect sequence ending today', () =>
    expect(
      calculateStreak(
        [
          {
            date: '2026-01-01',
            cardsTrained: 1,
            cardsCorrect: 1,
            goalMet: true,
          },
          {
            date: '2026-01-02',
            cardsTrained: 1,
            cardsCorrect: 1,
            goalMet: true,
          },
        ],
        '2026-01-02',
      ),
    ).toBe(2));
  it('stops at a gap', () =>
    expect(
      calculateStreak(
        [
          {
            date: '2026-01-01',
            cardsTrained: 1,
            cardsCorrect: 1,
            goalMet: true,
          },
          {
            date: '2026-01-03',
            cardsTrained: 1,
            cardsCorrect: 1,
            goalMet: true,
          },
        ],
        '2026-01-03',
      ),
    ).toBe(1));
  it('keeps yesterday streak when today open', () =>
    expect(
      calculateStreak(
        [
          {
            date: '2026-01-01',
            cardsTrained: 1,
            cardsCorrect: 1,
            goalMet: true,
          },
        ],
        '2026-01-02',
      ),
    ).toBe(1));
  it('zero when yesterday failed and today open', () =>
    expect(
      calculateStreak(
        [
          {
            date: '2026-01-01',
            cardsTrained: 1,
            cardsCorrect: 1,
            goalMet: false,
          },
        ],
        '2026-01-02',
      ),
    ).toBe(0));
  it('handles first day', () =>
    expect(calculateStreak([], '2026-01-02')).toBe(0));
  it('handles month turn', () =>
    expect(
      calculateStreak(
        [
          {
            date: '2026-01-31',
            cardsTrained: 1,
            cardsCorrect: 1,
            goalMet: true,
          },
          {
            date: '2026-02-01',
            cardsTrained: 1,
            cardsCorrect: 1,
            goalMet: true,
          },
        ],
        '2026-02-01',
      ),
    ).toBe(2));
  it('calculates XP', () =>
    expect(
      ['correct', 'almost', 'wrong'].map((r) => calculateXP(r as never)),
    ).toEqual([10, 5, 1]));
  it('checks daily goal boundaries', () => {
    expect(isGoalMet(5, 5)).toBe(true);
    expect(isGoalMet(4, 5)).toBe(false);
  });
});
