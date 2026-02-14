import { describe, expect, it } from 'vitest';
import { isHabitDue } from './isHabitDue';
import { Entry, Habit, UserSettings } from '@/types/domain';

const settings: UserSettings = { user_id: 'u', week_start: 1, migration_done: false };
const base: Habit = {
  id: 'h', user_id: 'u', name: 'h', description: null, frequency: 'daily', goal_count: 1,
  schedule: {}, external_url: null, archived: false, sort_order: 0, created_at: '2025-01-01T00:00:00Z'
};

const T = '2025-01-31';
const yes = (h: Habit, e: Entry[] = []) => expect(isHabitDue(h, T, e, settings)).toBe(true);
const no = (h: Habit, e: Entry[] = []) => expect(isHabitDue(h, T, e, settings)).toBe(false);

describe('isHabitDue', () => {
  it('daily due', () => yes({ ...base, frequency: 'daily' }));
  it('archived false', () => no({ ...base, archived: true }));
  it('created after today false', () => no({ ...base, created_at: '2025-02-01T00:00:00Z' }));
  it('today entry keeps visible', () => yes({ ...base }, [{ user_id: 'u', habit_id: 'h', date_key: T, count: 1, completed: true }]));
  it('once on target date', () => yes({ ...base, frequency: 'once', schedule: { targetDate: T } }));
  it('once non target', () => no({ ...base, frequency: 'once', schedule: { targetDate: '2025-01-30' } }));
  it('weekly specific include', () => yes({ ...base, frequency: 'weekly_specific', schedule: { weekDays: [5] } }));
  it('weekly specific exclude', () => no({ ...base, frequency: 'weekly_specific', schedule: { weekDays: [1] } }));
  it('monthly specific direct day', () => yes({ ...base, frequency: 'monthly_specific', schedule: { monthDays: [31] } }));
  it('monthly specific month end token 32', () => yes({ ...base, frequency: 'monthly_specific', schedule: { monthDays: [32] } }));
  it('monthly specific no match', () => no({ ...base, frequency: 'monthly_specific', schedule: { monthDays: [30] } }));
  it('flex week due when none done', () => yes({ ...base, frequency: 'flexible', schedule: { interval: 'week', targetIntervalCount: 2 } }));
  it('flex week not due when target met', () => no({ ...base, frequency: 'flexible', schedule: { interval: 'week', targetIntervalCount: 1 } }, [{ user_id: 'u', habit_id: 'h', date_key: '2025-01-27', count: 1, completed: true }]));
  it('flex week due if incomplete entry', () => yes({ ...base, frequency: 'flexible', schedule: { interval: 'week', targetIntervalCount: 1 } }, [{ user_id: 'u', habit_id: 'h', date_key: '2025-01-27', count: 1, completed: false }]));
  it('flex week monday start respected', () => no({ ...base, frequency: 'flexible', schedule: { interval: 'week', targetIntervalCount: 1 } }, [{ user_id: 'u', habit_id: 'h', date_key: '2025-01-31', count: 1, completed: true }]));
  it('flex month due when less than target', () => yes({ ...base, frequency: 'flexible', schedule: { interval: 'month', targetIntervalCount: 2 } }, [{ user_id: 'u', habit_id: 'h', date_key: '2025-01-03', count: 1, completed: true }]));
  it('flex month not due when met', () => no({ ...base, frequency: 'flexible', schedule: { interval: 'month', targetIntervalCount: 1 } }, [{ user_id: 'u', habit_id: 'h', date_key: '2025-01-03', count: 1, completed: true }]));
  it('flex month ignores previous month', () => yes({ ...base, frequency: 'flexible', schedule: { interval: 'month', targetIntervalCount: 1 } }, [{ user_id: 'u', habit_id: 'h', date_key: '2024-12-31', count: 1, completed: true }]));
  it('flex defaults to weekly target1', () => yes({ ...base, frequency: 'flexible', schedule: {} }));
  it('today entry overrides non-due weekly specific', () => yes({ ...base, frequency: 'weekly_specific', schedule: { weekDays: [1] } }, [{ user_id: 'u', habit_id: 'h', date_key: T, count: 1, completed: true }]));
  it('today entry overrides archived? no', () => no({ ...base, archived: true }, [{ user_id: 'u', habit_id: 'h', date_key: T, count: 1, completed: true }]));
  it('weekly specific empty false', () => no({ ...base, frequency: 'weekly_specific', schedule: {} }));
});
