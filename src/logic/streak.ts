import { DailyStat } from './types';

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
  const parsed = parseLocalDate(date);
  parsed.setDate(parsed.getDate() + days);
  return formatLocalDate(parsed);
}

export function calculateStreak(
  dailyStats: DailyStat[],
  today: string,
): number {
  const met = new Set(dailyStats.filter((s) => s.goalMet).map((s) => s.date));
  let cursor = met.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (met.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
