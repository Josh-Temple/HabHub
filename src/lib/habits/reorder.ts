import { Habit } from '@/types/domain';

export type ReorderDirection = -1 | 1;

export type ReorderUpdate = { id: string; sort_order: number };

export type ReorderResult = {
  reordered: Habit[];
  updates: ReorderUpdate[];
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

export function validateReorderUpdates(updates: ReorderUpdate[]): { ok: boolean; reason?: string } {
  if (updates.length === 0) return { ok: false, reason: 'No updates provided.' };

  const seenIds = new Set<string>();
  const sortOrders = new Set<number>();

  for (const update of updates) {
    if (!update.id) return { ok: false, reason: 'Update id is required.' };
    if (seenIds.has(update.id)) return { ok: false, reason: 'Duplicate habit id found in updates.' };
    seenIds.add(update.id);

    if (!Number.isInteger(update.sort_order) || update.sort_order < 0) {
      return { ok: false, reason: 'sort_order must be a non-negative integer.' };
    }

    if (sortOrders.has(update.sort_order)) {
      return { ok: false, reason: 'Duplicate sort_order values found in updates.' };
    }
    sortOrders.add(update.sort_order);
  }

  for (let index = 0; index < updates.length; index += 1) {
    if (!sortOrders.has(index)) {
      return { ok: false, reason: 'sort_order values must be contiguous from 0.' };
    }
  }

  return { ok: true };
}
