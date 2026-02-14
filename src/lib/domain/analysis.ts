import { Entry, Habit } from '@/types/domain';
import { toDateKey } from './date';

export function consistency(entries: Entry[], habits: Habit[], days = 30): number {
  const activeHabits = habits.filter((h) => !h.archived).length;
  if (!activeHabits) return 0;
  const today = new Date();
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDateKey(d);
    done += entries.filter((e) => e.date_key === key && e.completed).length;
  }
  return Math.round((done / (activeHabits * days)) * 100);
}

export function last7days(entries: Entry[]): { date: string; rate: number }[] {
  const today = new Date();
  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - idx));
    const key = toDateKey(d);
    const dayEntries = entries.filter((e) => e.date_key === key);
    const completed = dayEntries.filter((e) => e.completed).length;
    const rate = dayEntries.length ? Math.round((completed / dayEntries.length) * 100) : 0;
    return { date: key, rate };
  });
}

export function currentStreak(entries: Entry[]): number {
  const today = new Date();
  let streak = 0;
  while (true) {
    const d = new Date(today);
    d.setDate(today.getDate() - streak);
    const key = toDateKey(d);
    const dayEntries = entries.filter((e) => e.date_key === key);
    if (!dayEntries.length || dayEntries.some((e) => !e.completed)) break;
    streak++;
  }
  return streak;
}
