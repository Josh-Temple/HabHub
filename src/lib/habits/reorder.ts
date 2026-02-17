import { Habit } from '@/types/domain';

export type ReorderDirection = -1 | 1;

export type ReorderResult = {
  reordered: Habit[];
  updates: Array<{ id: string; sort_order: number }>;
};

export function buildHabitReorderPlan(habits: Habit[], habitId: string, dir: ReorderDirection): ReorderResult | null {
  const currentIndex = habits.findIndex((habit) => habit.id === habitId);
  if (currentIndex < 0) return null;

  const targetIndex = currentIndex + dir;
  if (targetIndex < 0 || targetIndex >= habits.length) return null;

  const reordered = [...habits];
  [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];

  return {
    reordered,
    updates: reordered.map((habit, index) => ({ id: habit.id, sort_order: index })),
  };
}
