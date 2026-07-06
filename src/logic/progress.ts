import { Card, DailyStat, Settings, TrainingResult } from './types';

export type ResultCounts = Record<TrainingResult, number>;

export type ProgressMetrics = {
  accuracy: number;
  savedCards: number;
  masteredCards: number;
  trainedToday: number;
};

export type WeeklyBar = {
  date: string;
  label: string;
  cardsTrained: number;
  isToday: boolean;
};

export type ReminderDecision =
  | { action: 'cancel'; reason: 'goal-met' | 'disabled' }
  | { action: 'schedule'; hour: number; minute: number; cardsToReview: number };

const weekLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: string, days: number): string {
  const d = parseLocalDate(date);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function calculateProgressMetrics(
  cards: Card[],
  resultCounts: ResultCounts,
  todayStats: DailyStat | null,
): ProgressMetrics {
  const totalAnswers =
    resultCounts.correct + resultCounts.almost + resultCounts.wrong;
  return {
    accuracy: totalAnswers
      ? Math.round((resultCounts.correct / totalAnswers) * 100)
      : 0,
    savedCards: cards.length,
    masteredCards: cards.filter((card) => card.status === 'mastered').length,
    trainedToday: todayStats?.cardsTrained ?? 0,
  };
}

export function buildWeeklyBars(
  dailyStats: DailyStat[],
  today: string,
): WeeklyBar[] {
  const byDate = new Map(dailyStats.map((stat) => [stat.date, stat]));
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const parsed = parseLocalDate(date);
    return {
      date,
      label: weekLabels[parsed.getDay()] ?? '',
      cardsTrained: byDate.get(date)?.cardsTrained ?? 0,
      isToday: date === today,
    };
  });
}

export function isStreakAtRisk(dailyStats: DailyStat[], now: Date): boolean {
  const today = formatLocalDate(now);
  const yesterday = addDays(today, -1);
  const todayStat = dailyStats.find((stat) => stat.date === today);
  const yesterdayStat = dailyStats.find((stat) => stat.date === yesterday);
  return (
    now.getHours() >= 18 && !!yesterdayStat?.goalMet && !todayStat?.goalMet
  );
}

export function decideDailyReminder(
  settings: Settings,
  todayStats: DailyStat | null,
  cards: Card[],
): ReminderDecision {
  if (settings.notificationsEnabled === 'false')
    return { action: 'cancel', reason: 'disabled' };
  if (todayStats?.goalMet) return { action: 'cancel', reason: 'goal-met' };
  const hour = Number(settings.notificationHour ?? 19);
  const cardsToReview = cards.filter(
    (card) => card.status === 'new' || card.status === 'training',
  ).length;
  if (cardsToReview === 0) return { action: 'cancel', reason: 'goal-met' };
  return { action: 'schedule', hour, minute: 0, cardsToReview };
}

export function getLocalDate(value = new Date()): string {
  return formatLocalDate(value);
}
