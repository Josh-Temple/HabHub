import { describe, expect, it } from 'vitest';
import { buildHabitReorderPlan, validateReorderUpdates } from '@/lib/habits/reorder';
import { Habit } from '@/types/domain';

const createHabit = (id: string, sortOrder: number): Habit => ({
  id,
  user_id: 'u1',
  name: `habit-${id}`,
  description: null,
  frequency: 'daily',
  goal_count: 1,
  schedule: {},
  external_url: null,
  archived: false,
  sort_order: sortOrder,
  created_at: '2026-01-01T00:00:00.000Z',
});

describe('buildHabitReorderPlan', () => {
  it('returns swap and reindex result when moving within bounds', () => {
    const habits = [createHabit('a', 10), createHabit('b', 20), createHabit('c', 30)];
    const plan = buildHabitReorderPlan(habits, 'b', -1);

    expect(plan).not.toBeNull();
    expect(plan?.reordered.map((habit) => habit.id)).toEqual(['b', 'a', 'c']);
    expect(plan?.updates).toEqual([
      { id: 'b', sort_order: 0 },
      { id: 'a', sort_order: 1 },
      { id: 'c', sort_order: 2 },
    ]);
  });

  it('returns null when target is out of bounds', () => {
    const habits = [createHabit('a', 0), createHabit('b', 1)];
    expect(buildHabitReorderPlan(habits, 'a', -1)).toBeNull();
    expect(buildHabitReorderPlan(habits, 'b', 1)).toBeNull();
  });
});

describe('validateReorderUpdates', () => {
  it('accepts contiguous updates with unique ids', () => {
    const result = validateReorderUpdates([
      { id: 'a', sort_order: 0 },
      { id: 'b', sort_order: 1 },
    ]);

    expect(result.ok).toBe(true);
  });

  it('rejects duplicate ids and non-contiguous sort_order values', () => {
    expect(validateReorderUpdates([
      { id: 'a', sort_order: 0 },
      { id: 'a', sort_order: 1 },
    ])).toEqual({ ok: false, reason: 'Duplicate habit id found in updates.' });

    expect(validateReorderUpdates([
      { id: 'a', sort_order: 0 },
      { id: 'b', sort_order: 2 },
    ])).toEqual({ ok: false, reason: 'sort_order values must be contiguous from 0.' });
  });
});
