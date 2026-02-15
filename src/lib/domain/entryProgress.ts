import { Entry, Habit } from '@/types/domain';

export function isEntryDone(entry: Pick<Entry, 'count' | 'completed'> | null | undefined, habit: Pick<Habit, 'goal_count'>): boolean {
  return Boolean(entry?.completed) || (entry?.count ?? 0) >= habit.goal_count;
}

export function nextCountFromBump(
  entry: Pick<Entry, 'count' | 'completed'> | null | undefined,
  habit: Pick<Habit, 'goal_count'>,
  delta: number
): number {
  const current = entry?.count ?? 0;
  if (delta === 0) return current;
  return Math.max(0, current + delta);
}

export function nextCountFromToggle(
  entry: Pick<Entry, 'count' | 'completed'> | null | undefined,
  habit: Pick<Habit, 'goal_count'>
): number {
  return isEntryDone(entry, habit) ? 0 : habit.goal_count;
}
