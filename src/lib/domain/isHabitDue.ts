import { Entry, Habit, UserSettings } from '@/types/domain';
import { dateKeyToDate, getMonthBucket, isLastDayOfMonth, startOfWeek } from './date';

export function isHabitDue(habit: Habit, todayDateKey: string, entries: Entry[], settings: UserSettings): boolean {
  if (habit.archived) return false;
  if (habit.created_at.slice(0, 10) > todayDateKey) return false;

  const entryToday = entries.find((e) => e.habit_id === habit.id && e.date_key === todayDateKey);
  if (entryToday) return true;

  if (habit.frequency === 'daily') return true;

  if (habit.frequency === 'once') {
    return habit.schedule.targetDate === todayDateKey;
  }

  if (habit.frequency === 'weekly_specific') {
    const day = dateKeyToDate(todayDateKey).getDay();
    return habit.schedule.weekDays?.includes(day) ?? false;
  }

  if (habit.frequency === 'monthly_specific') {
    const day = Number(todayDateKey.slice(8, 10));
    const monthDays = habit.schedule.monthDays ?? [];
    return monthDays.includes(day) || (monthDays.includes(32) && isLastDayOfMonth(todayDateKey));
  }

  if (habit.frequency === 'flexible') {
    const interval = habit.schedule.interval ?? 'week';
    const target = habit.schedule.targetIntervalCount ?? 1;

    if (interval === 'week') {
      const bucketStart = startOfWeek(todayDateKey, settings.week_start);
      const completed = entries.filter((e) => e.habit_id === habit.id && e.date_key >= bucketStart && e.date_key <= todayDateKey && e.completed).length;
      return completed < target;
    }

    const bucket = getMonthBucket(todayDateKey);
    const completed = entries.filter((e) => e.habit_id === habit.id && e.date_key.startsWith(bucket) && e.completed).length;
    return completed < target;
  }

  return false;
}
